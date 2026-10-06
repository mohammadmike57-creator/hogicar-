import Anthropic from '@anthropic-ai/sdk';

// Hogicar AI rental advisor. Runs inside the frontend server so the Anthropic API key
// (ANTHROPIC_API_KEY on Render) never reaches the browser.

const MODEL = process.env.HOGICAR_AI_MODEL || 'claude-opus-5-5';
const MAX_BODY_BYTES = 1_000_000;
const MAX_CARS = 400;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1000;

// Simple in-memory limiter: 20 questions per IP per 10 minutes.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 20;
const hits = new Map();

let client = null;
const getClient = () => {
  if (!client) client = new Anthropic();
  return client;
};

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM_PROMPT = `You are Hogicar's rental advisor, a friendly car hire expert on the Hogicar comparison website.
The customer is looking at search results. The search data lists every car in their search (not only the ones on screen), so always compare across all of them. Help them choose the best car for their trip by comparing: total price, price per day, deposit, damage excess, fuel policy, mileage, transmission, seats, bags, pick-up location type and supplier rating.

How to answer:
- Use only the search data you are given. Never invent cars, prices, suppliers or policies. If something is not in the data, say so briefly and suggest the customer check the car's details page.
- Quote prices exactly as given, with the currency symbol.
- Explain trade-offs in plain language (for example a cheaper car with a high deposit versus a slightly dearer one with a low deposit, or "full to full" versus other fuel policies).
- Keep the reply short and easy to scan: at most about 120 words, with short sentences or a few "- " bullet lines. No markdown headings, tables or bold.
- Reply in the same language the customer writes in.
- Recommend at most 3 cars in "picks" (for an overview or per-category answer, one pick per car type instead, up to 10), best first, using their exact "id" from the search data. Give each pick a short label such as "Best value", "Cheapest", "Lowest deposit", "Best for families" or "Top rated", and a reason of one short sentence. Leave "picks" empty when no recommendation fits the question.
- When asked to compare all results, for an overview, or for the best in each category: group the cars by car type (category) and, for every type, name the best-value car and explain in one short sentence what it offers for any extra cost over the cheapest car of that type (automatic gearbox, luggage space, supplier rating, deposit, fuel policy, mileage), mentioning any downside. Then briefly compare the suppliers and give the overall best value and cheapest car. Give one pick per car type labelled "Best value · <type>". This answer may be up to about 250 words.
- You cannot book, change or cancel anything. For bookings, the customer selects a car on the page.
- If the question has nothing to do with car hire or this trip, politely steer the conversation back to choosing a car.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          carId: { type: 'string' },
          label: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['carId', 'label', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['reply', 'picks'],
  additionalProperties: false,
};

const str = (value, max = 120) => (typeof value === 'string' ? value.slice(0, max) : undefined);
const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined);
const bool = (value) => (typeof value === 'boolean' ? value : undefined);

const sanitizeCar = (car) => ({
  id: str(car?.id, 80),
  name: str(car?.name),
  category: str(car?.category, 40),
  supplier: str(car?.supplier, 80),
  supplierRating: num(car?.supplierRating),
  totalPrice: num(car?.totalPrice),
  pricePerDay: num(car?.pricePerDay),
  deposit: num(car?.deposit),
  excess: num(car?.excess),
  transmission: str(car?.transmission, 20),
  seats: num(car?.seats),
  bags: num(car?.bags),
  doors: num(car?.doors),
  fuelPolicy: str(car?.fuelPolicy, 40),
  unlimitedMileage: bool(car?.unlimitedMileage),
  pickupLocation: str(car?.pickupLocation, 80),
  paymentType: str(car?.paymentType, 40),
  specialOffer: bool(car?.specialOffer),
});

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  const clean = messages
    .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }));
  // The conversation must start with the customer.
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
};

const rateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some(t => now - t < RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT;
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const JSON_INSTRUCTION = 'Respond with only a JSON object of the form {"reply": string, "picks": [{"carId": string, "label": string, "reason": string}]} and nothing else.';

/**
 * Asks Claude for an answer. Tries the full request first (structured output + refusal
 * fallback); if the API rejects a request option, retries with simpler requests so the
 * customer still gets an AI answer.
 */
async function createAnswer(system, messages) {
  const client = getClient();
  const attempts = [
    () => client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system,
      messages,
    }),
    () => client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system,
      messages,
    }),
    () => client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [...system, { type: 'text', text: JSON_INSTRUCTION }],
      messages,
    }),
  ];
  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!(error instanceof Anthropic.BadRequestError)) throw error;
      console.error('[ai-assistant] request rejected, retrying with a simpler request:', error.message);
    }
  }
  throw lastError;
}

export async function handleAiAssistant(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  if (!isAiConfigured()) {
    sendJson(res, 503, { error: 'The AI advisor is not available right now.' });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    sendJson(res, 429, { error: "You've asked a lot of questions in a short time. Please try again in a few minutes." });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    sendJson(res, error.status || 400, { error: 'Invalid request.' });
    return;
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    sendJson(res, 400, { error: 'Please type a question.' });
    return;
  }

  const cars = (Array.isArray(body.cars) ? body.cars : []).slice(0, MAX_CARS).map(sanitizeCar).filter(c => c.id);
  const trip = body.trip && typeof body.trip === 'object' ? body.trip : {};
  const searchData = {
    trip: {
      pickupLocation: str(trip.pickupLocation, 120),
      dropoffLocation: str(trip.dropoffLocation, 120),
      pickupDate: str(trip.pickupDate, 30),
      dropoffDate: str(trip.dropoffDate, 30),
      rentalDays: num(trip.days),
      currency: str(trip.currency, 10),
      activeFilters: Array.isArray(trip.activeFilters) ? trip.activeFilters.slice(0, 12).map(f => str(f, 60)).filter(Boolean) : [],
    },
    cars,
  };

  try {
    const system = [
      { type: 'text', text: SYSTEM_PROMPT },
      {
        type: 'text',
        text: `Search data (JSON, prices already include taxes and fees):\n${JSON.stringify(searchData)}`,
        cache_control: { type: 'ephemeral' },
      },
    ];
    const response = await createAnswer(system, messages);

    if (response.stop_reason === 'refusal') {
      sendJson(res, 200, { reply: "Sorry, I can't help with that. I can compare the cars in your search, for example by price, deposit or fuel policy.", picks: [] });
      return;
    }

    const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      try { parsed = match ? JSON.parse(match[0]) : null; } catch { parsed = null; }
      parsed = parsed || { reply: text, picks: [] };
    }

    const knownIds = new Set(cars.map(c => c.id));
    const picks = (Array.isArray(parsed.picks) ? parsed.picks : [])
      .filter(p => p && knownIds.has(p.carId))
      .slice(0, 10)
      .map(p => ({ carId: p.carId, label: str(p.label, 40) || 'Recommended', reason: str(p.reason, 300) || '' }));

    sendJson(res, 200, { reply: str(parsed.reply, 2000) || '', picks });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      sendJson(res, 429, { error: 'The AI advisor is busy right now. Please try again in a moment.' });
    } else if (error instanceof Anthropic.APIError) {
      console.error('[ai-assistant] API error', error.status, error.message);
      sendJson(res, 502, { error: 'The AI advisor could not answer right now. Please try again.' });
    } else {
      console.error('[ai-assistant] failed', error);
      sendJson(res, 500, { error: 'The AI advisor could not answer right now. Please try again.' });
    }
  }
}
