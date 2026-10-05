// Built-in comparison engine for the AI advisor. It reads the customer's question
// (requirements, budget, named cars or suppliers, what matters most, follow-ups) and
// answers from the search results, so the advisor works even when the server-side AI
// model is not configured or not reachable.

export interface AdvisorCar {
  id: string;
  name: string;
  category?: string;
  supplier?: string;
  supplierRating?: number;
  totalPrice: number;
  pricePerDay: number;
  deposit?: number;
  excess?: number;
  transmission?: string;
  seats?: number;
  bags?: number;
  doors?: number;
  fuelPolicy?: string;
  unlimitedMileage?: boolean;
  pickupLocation?: string;
  paymentType?: string;
  specialOffer?: boolean;
}

export interface AdvisorPick { carId: string; label: string; reason: string }
export interface AdvisorAnswer { reply: string; picks: AdvisorPick[] }
export interface AdvisorTurn { role: 'user' | 'assistant'; content: string; picks?: AdvisorPick[] }

type Sort = 'price' | 'priceDesc' | 'deposit' | 'excess' | 'rating' | 'space' | 'value';
type Topic = 'deposit' | 'excess' | 'fuel' | 'insurance' | 'documents' | 'cancellation' | 'mileage' | 'payment';

interface Constraints {
  transmission?: 'Automatic' | 'Manual';
  minSeats?: number;
  minBags?: number;
  maxTotal?: number;
  maxPerDay?: number;
  minTotal?: number;
  maxDeposit?: number;
  fullToFull?: boolean;
  unlimitedMileage?: boolean;
  pickupType?: 'terminal' | 'shuttle' | 'meet';
  categories?: string[];
  suppliers?: string[];
  specialOffer?: boolean;
  payAtPickup?: boolean;
}

interface Parsed {
  constraints: Constraints;
  sort?: Sort;
  topic?: Topic;
  mentioned: AdvisorCar[];
  mentionedSuppliers: string[];
  compare: boolean;
  greeting: boolean;
  thanks: boolean;
  refinement: boolean;
  wantsCheaper: boolean;
  wantsBigger: boolean;
  requirementText: string[];
}

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const NUM = '(\\d+|one|two|three|four|five|six|seven|eight|nine)';
const toNum = (v: string) => WORD_NUMBERS[v] ?? Number(v);
const has = (text: string, words: (string | RegExp)[]) => words.some(w => (typeof w === 'string' ? text.includes(w) : w.test(text)));

const CATEGORY_WORDS: [string, (string | RegExp)[]][] = [
  ['Mini', [/\bmini\b/, 'smallest', 'city car']],
  ['Economy', ['economy', /\bsmall car\b/]],
  ['Compact', ['compact']],
  ['Midsize', ['midsize', 'mid-size', 'intermediate', 'mid size']],
  ['Standard', [/\bstandard\b/]],
  ['Fullsize', ['fullsize', 'full-size', 'full size', 'large car', 'big car']],
  ['Premium', ['premium']],
  ['Luxury', ['luxury', 'mercedes', 'bmw', 'audi', 'فخم']],
  ['SUV', [/\bsuvs?\b/, '4x4', 'jeep', 'دفع رباعي']],
  ['Van', [/\bvans?\b/, 'minibus']],
  ['People Carrier', ['people carrier', 'minivan', 'mpv', '7 seat', 'seven seat', '7-seat']],
  ['Convertible', ['convertible', 'cabrio']],
  ['Estate', ['estate', 'station wagon', 'wagon']],
];

const money = (symbol: string, value?: number) => {
  if (value === undefined || !Number.isFinite(value)) return 'n/a';
  return `${symbol}${value % 1 ? value.toFixed(2) : value.toFixed(0)}`;
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const listJoin = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9؀-ۿ ]+/g, ' ').replace(/\s+/g, ' ').trim();

function findMentionedCars(text: string, cars: AdvisorCar[]): AdvisorCar[] {
  const found: AdvisorCar[] = [];
  const t = ` ${norm(text)} `;
  for (const car of cars) {
    const name = norm(car.name);
    const parts = name.split(' ').filter(Boolean);
    const model = parts.slice(1).join(' ');
    const hit = t.includes(` ${name} `)
      || (model.length >= 3 && t.includes(` ${model} `))
      || parts.slice(1).some(p => p.length >= 4 && !/^(class|sport|plus|auto|wagon|estate|similar)$/.test(p) && t.includes(` ${p} `));
    if (hit) found.push(car);
  }
  return found;
}

function findMentionedSuppliers(text: string, cars: AdvisorCar[]): string[] {
  const t = ` ${norm(text)} `;
  const names = Array.from(new Set(cars.map(c => c.supplier).filter(Boolean) as string[]));
  return names.filter(n => {
    const s = norm(n);
    return s.length >= 3 && (t.includes(` ${s} `) || (s.split(' ')[0].length >= 4 && t.includes(` ${s.split(' ')[0]} `)));
  });
}

function parseQuestion(question: string, cars: AdvisorCar[]): Parsed {
  const text = ` ${question.toLowerCase().replace(/[’']/g, "'")} `;
  const c: Constraints = {};
  const req: string[] = [];

  // Gearbox
  const auto = has(text, [/\bauto(matic)?s?\b/, 'أوتوماتيك', 'اوتوماتيك', 'اتوماتيك', 'automatik']);
  const manual = has(text, [/\bmanual\b/, /\bstick( shift)?\b/, 'gear stick', 'يدوي', 'عادي']);
  if (auto && !manual) { c.transmission = 'Automatic'; req.push('automatic'); }
  else if (manual && !auto) { c.transmission = 'Manual'; req.push('manual'); }

  // People / seats
  const people = text.match(new RegExp(`${NUM}\\s*(?:people|persons|passengers|adults|pax|of us|seats?|seater|travell?ers|guests)`))
    || text.match(new RegExp(`(?:family|group|party) of ${NUM}`))
    || text.match(new RegExp(`(?:we are|we're|there are) ${NUM}\\b`));
  if (people) c.minSeats = toNum(people[1]);
  else if (has(text, ['family', 'kids', 'children', 'child seat', 'عائلة', 'عائله', 'اطفال', 'أطفال'])) c.minSeats = 5;
  if (has(text, ['people carrier', 'minivan', '7 seat', 'seven seat', '7-seat'])) c.minSeats = Math.max(c.minSeats || 0, 7);
  if (c.minSeats) req.push(`${c.minSeats}+ seats`);

  // Luggage
  const bags = text.match(new RegExp(`${NUM}\\s*(?:big |large |small )?(?:bags?|suitcases?|luggages?|cases)`));
  if (bags) c.minBags = toNum(bags[1]);
  else if (has(text, ['lots of luggage', 'a lot of luggage', 'lot of bags', 'big boot', 'large boot', 'big trunk', 'golf'])) c.minBags = 3;
  else if (has(text, [/\bluggage\b/, /\bsuitcases?\b/, 'شنط', 'حقائب'])) c.minBags = 2;
  if (c.minBags) req.push(`${c.minBags}+ bags`);

  // Budget
  const budget = text.match(/(?:under|below|less than|cheaper than|max(?:imum)?|up to|no more than|within|budget(?: is| of)?|at most|<)\s*(?:[$€£]|usd|eur|gbp|jod|aed|sar)?\s*(\d+(?:[.,]\d+)?)/);
  if (budget) {
    const value = Number(budget[1].replace(',', '.'));
    const after = text.slice((budget.index || 0) + budget[0].length, (budget.index || 0) + budget[0].length + 20);
    if (/(per|a|\/)\s*day|daily|a night|per night/.test(after)) { c.maxPerDay = value; req.push(`under ${value} per day`); }
    else if (has(text, ['deposit'])) { c.maxDeposit = value; req.push(`deposit under ${value}`); }
    else { c.maxTotal = value; req.push(`under ${value} total`); }
  }

  // Terms
  if (has(text, ['full to full', 'full-to-full', 'full tank'])) { c.fullToFull = true; req.push('full-to-full fuel'); }
  if (has(text, ['unlimited', 'no mileage limit', 'unlimited km', 'unlimited miles'])) { c.unlimitedMileage = true; req.push('unlimited mileage'); }
  if (has(text, ['in terminal', 'in the terminal', 'inside the airport', 'airport desk', 'at the airport'])) { c.pickupType = 'terminal'; req.push('in-terminal pick-up'); }
  else if (has(text, ['shuttle'])) { c.pickupType = 'shuttle'; req.push('shuttle pick-up'); }
  else if (has(text, ['meet and greet', 'meet & greet'])) { c.pickupType = 'meet'; req.push('meet & greet'); }
  if (has(text, ['offer', 'discount', 'deal of', 'promo', 'sale', 'عرض', 'خصم'])) { c.specialOffer = true; req.push('special offer'); }
  if (has(text, ['pay at pick', 'pay at the desk', 'pay on arrival', 'pay later', 'pay at the counter'])) { c.payAtPickup = true; req.push('pay at pick-up'); }
  if (has(text, ['no deposit', 'zero deposit', 'without deposit'])) { c.maxDeposit = 0; req.push('no deposit'); }

  // Categories
  const categories = CATEGORY_WORDS.filter(([, words]) => has(text, words)).map(([cat]) => cat);
  if (categories.length) { c.categories = categories; req.push(categories.join(' or ')); }

  const mentioned = findMentionedCars(question, cars);
  const mentionedSuppliers = findMentionedSuppliers(question, cars);

  // What matters most
  let sort: Sort | undefined;
  if (has(text, ['most expensive', 'priciest', 'fanciest', 'top of the range', 'most luxurious'])) sort = 'priceDesc';
  if (has(text, ['cheap', 'lowest price', 'low price', 'budget', 'low cost', 'least expensive', 'save money', 'affordable', 'رخيص', 'ارخص', 'أرخص'])) sort = 'price';
  if (has(text, ['lowest deposit', 'smallest deposit', 'low deposit', 'less deposit', 'cheapest deposit', 'least deposit'])) sort = 'deposit';
  if (has(text, ['lowest excess', 'low excess', 'smallest excess'])) sort = 'excess';
  if (has(text, ['best rated', 'top rated', 'highest rated', 'rating', 'reviews', 'reliable', 'trusted', 'reputation', 'best supplier', 'best company', 'تقييم'])) sort = 'rating';
  if (has(text, ['most space', 'biggest', 'largest', 'roomiest', 'most room', 'most luggage', 'most bags', 'most seats', 'spacious', 'comfortable', 'comfort'])) sort = 'space';
  if (has(text, ['best value', 'value for money', 'worth', 'best deal', 'best car', 'recommend', 'best option', 'best choice', 'which one should', 'what should i', 'أفضل', 'افضل'])) sort = sort || 'value';

  // Information questions
  let topic: Topic | undefined;
  const asksInfo = has(text, ['what is', "what's", 'what does', 'explain', 'mean', 'how does', 'how much is the', 'do i need', 'is there', 'are there', 'included', 'include', '?']);
  if (has(text, ['deposit', 'تأمين', 'تامين']) && asksInfo && sort !== 'deposit' && !budget) topic = 'deposit';
  else if (has(text, ['excess', 'deductible']) && sort !== 'excess') topic = 'excess';
  else if (has(text, ['fuel', 'petrol', 'gas tank', 'بنزين']) && !c.fullToFull) topic = 'fuel';
  else if (has(text, ['insurance', 'cover', 'protection', 'cdw', 'damage'])) topic = 'insurance';
  else if (has(text, ['document', 'licen', 'passport', 'credit card', 'debit card', 'id card', 'requirements', 'need to bring', 'age'])) topic = 'documents';
  else if (has(text, ['cancel', 'refund', 'change my booking', 'amend'])) topic = 'cancellation';
  else if (has(text, ['mileage', 'kilomet', 'km limit', 'miles']) && !c.unlimitedMileage) topic = 'mileage';
  else if (has(text, ['pay now', 'payment', 'how do i pay', 'when do i pay', 'pay at'])) topic = topic || (c.payAtPickup ? undefined : 'payment');

  const compare = mentioned.length >= 2 || mentionedSuppliers.length >= 2
    || (has(text, [' vs ', ' versus ', 'compare', 'difference', ' or the ', 'better', 'which is better', 'قارن', 'الفرق']) && (mentioned.length >= 1 || mentionedSuppliers.length >= 1));

  const trimmed = text.trim();
  const greeting = /^(hi|hello|hey|salam|مرحبا|السلام|good (morning|evening|afternoon))\b/.test(trimmed) && trimmed.split(' ').length <= 4;
  const thanks = /\b(thanks|thank you|thx|great|perfect|شكرا)\b/.test(trimmed) && trimmed.split(' ').length <= 5;
  const refinement = /^(and|also|what about|how about|but|only|now|ok|okay|then|same|instead|with|without|any|anything|is there|are there|show me|و)\b/.test(trimmed)
    || (trimmed.split(' ').length <= 4 && !sort && !compare);
  const wantsCheaper = has(text, ['cheaper', 'less expensive', 'lower price', 'أرخص', 'ارخص']);
  const wantsBigger = has(text, ['bigger', 'larger', 'more space', 'more room', 'more seats', 'more bags', 'more luggage']);

  return { constraints: c, sort, topic, mentioned, mentionedSuppliers, compare, greeting, thanks, refinement, wantsCheaper, wantsBigger, requirementText: req };
}

function matches(car: AdvisorCar, c: Constraints): boolean {
  if (c.transmission && car.transmission !== c.transmission) return false;
  if (c.minSeats && (car.seats ?? 0) < c.minSeats) return false;
  if (c.minBags && (car.bags ?? 0) < c.minBags) return false;
  if (c.maxTotal !== undefined && car.totalPrice > c.maxTotal) return false;
  if (c.minTotal !== undefined && car.totalPrice < c.minTotal) return false;
  if (c.maxPerDay !== undefined && car.pricePerDay > c.maxPerDay) return false;
  if (c.maxDeposit !== undefined && (car.deposit ?? 0) > c.maxDeposit) return false;
  if (c.fullToFull && car.fuelPolicy !== 'Full to full') return false;
  if (c.unlimitedMileage && car.unlimitedMileage === false) return false;
  if (c.pickupType === 'terminal' && !/terminal/i.test(car.pickupLocation || '')) return false;
  if (c.pickupType === 'shuttle' && !/shuttle/i.test(car.pickupLocation || '')) return false;
  if (c.pickupType === 'meet' && !/meet/i.test(car.pickupLocation || '')) return false;
  if (c.categories?.length && !c.categories.some(cat => norm(car.category).includes(norm(cat)) || (cat === 'People Carrier' && (car.seats ?? 0) >= 7))) return false;
  if (c.suppliers?.length && !c.suppliers.includes(car.supplier || '')) return false;
  if (c.specialOffer && !car.specialOffer) return false;
  if (c.payAtPickup && !/pick-up/i.test(car.paymentType || '')) return false;
  return true;
}

const describeShort = (c: AdvisorCar, symbol: string) => {
  const bits = [`${money(symbol, c.totalPrice)} total`];
  if (c.deposit !== undefined) bits.push(`${money(symbol, c.deposit)} deposit`);
  if (c.supplierRating) bits.push(`rated ${c.supplierRating.toFixed(1)}`);
  return bits.join(', ');
};
const specs = (c: AdvisorCar) => [
  c.transmission?.toLowerCase(),
  c.seats ? `${c.seats} seats` : '',
  c.bags !== undefined ? plural(c.bags, 'bag') : '',
].filter(Boolean).join(', ');
const label = (c: AdvisorCar) => `${c.name}${c.supplier ? ` (${c.supplier})` : ''}`;

function scoreValue(c: AdvisorCar, pool: AdvisorCar[]) {
  const prices = pool.map(x => x.totalPrice);
  const min = Math.min(...prices), max = Math.max(...prices);
  const maxDeposit = Math.max(1, ...pool.map(x => x.deposit ?? 0));
  const priceScore = max > min ? 1 - (c.totalPrice - min) / (max - min) : 1;
  const ratingScore = c.supplierRating ? Math.min(c.supplierRating, 10) / 10 : 0.6;
  const depositScore = 1 - (c.deposit ?? maxDeposit / 2) / maxDeposit;
  const spaceScore = Math.min(1, ((c.seats ?? 4) + (c.bags ?? 1)) / 10);
  return priceScore * 0.45 + ratingScore * 0.22 + depositScore * 0.1 + spaceScore * 0.08
    + (c.fuelPolicy === 'Full to full' ? 0.06 : 0) + (c.unlimitedMileage ? 0.05 : 0) + (c.specialOffer ? 0.04 : 0);
}

function sortCars(list: AdvisorCar[], sort: Sort, pool: AdvisorCar[]): AdvisorCar[] {
  const by = [...list];
  switch (sort) {
    case 'price': return by.sort((a, b) => a.totalPrice - b.totalPrice);
    case 'priceDesc': return by.sort((a, b) => b.totalPrice - a.totalPrice);
    case 'deposit': return by.sort((a, b) => (a.deposit ?? Infinity) - (b.deposit ?? Infinity) || a.totalPrice - b.totalPrice);
    case 'excess': return by.sort((a, b) => (a.excess ?? Infinity) - (b.excess ?? Infinity) || a.totalPrice - b.totalPrice);
    case 'rating': return by.sort((a, b) => (b.supplierRating ?? 0) - (a.supplierRating ?? 0) || a.totalPrice - b.totalPrice);
    case 'space': return by.sort((a, b) => ((b.seats ?? 0) + (b.bags ?? 0)) - ((a.seats ?? 0) + (a.bags ?? 0)) || a.totalPrice - b.totalPrice);
    default: return by.sort((a, b) => scoreValue(b, pool) - scoreValue(a, pool));
  }
}

const SORT_LABEL: Record<Sort, string> = {
  price: 'Cheapest', priceDesc: 'Top of the range', deposit: 'Lowest deposit', excess: 'Lowest excess',
  rating: 'Top rated', space: 'Most space', value: 'Best value',
};

/** Why `alt` is worth a look compared with `best`. */
function tradeOff(alt: AdvisorCar, best: AdvisorCar, symbol: string): { label: string; reason: string } {
  const diff = alt.totalPrice - best.totalPrice;
  if (diff < -0.5) return { label: 'Cheaper option', reason: `${money(symbol, -diff)} cheaper${alt.transmission !== best.transmission ? `, but ${alt.transmission?.toLowerCase()}` : ''}${(alt.bags ?? 0) < (best.bags ?? 0) ? `, less luggage space (${plural(alt.bags ?? 0, 'bag')})` : ''}.` };
  if ((alt.deposit ?? Infinity) < (best.deposit ?? Infinity)) return { label: 'Lower deposit', reason: `Deposit of ${money(symbol, alt.deposit)} instead of ${money(symbol, best.deposit)}, for ${money(symbol, diff)} more.` };
  if ((alt.supplierRating ?? 0) > (best.supplierRating ?? 0) + 0.2) return { label: 'Better rated', reason: `Supplier rated ${alt.supplierRating?.toFixed(1)} vs ${best.supplierRating?.toFixed(1)}, for ${money(symbol, diff)} more.` };
  if ((alt.seats ?? 0) + (alt.bags ?? 0) > (best.seats ?? 0) + (best.bags ?? 0)) return { label: 'More space', reason: `${specs(alt)}, for ${money(symbol, diff)} more.` };
  return { label: 'Also good', reason: `${specs(alt)}, ${describeShort(alt, symbol)}.` };
}

function topicAnswer(topic: Topic, pool: AdvisorCar[], symbol: string): { lines: string[]; sort?: Sort } {
  const deposits = pool.map(c => c.deposit).filter((d): d is number => d !== undefined);
  const excesses = pool.map(c => c.excess).filter((d): d is number => d !== undefined);
  switch (topic) {
    case 'deposit': return {
      sort: 'deposit',
      lines: [
        'The deposit is an amount the supplier blocks on the main driver\'s credit card at pick-up. It is released after you return the car undamaged and with the right fuel level.',
        deposits.length ? `In your results deposits range from ${money(symbol, Math.min(...deposits))} to ${money(symbol, Math.max(...deposits))}.` : 'Deposit amounts are shown in each car\'s rental terms.',
      ],
    };
    case 'excess': return {
      sort: 'excess',
      lines: [
        'The excess is the most you would pay towards damage or theft if something happens to the car. It is not charged unless there is damage.',
        excesses.length ? `In your results the excess ranges from ${money(symbol, Math.min(...excesses))} to ${money(symbol, Math.max(...excesses))}. You can reduce it by adding protection when you book, where offered.` : 'Check each car\'s rental terms for the excess amount.',
      ],
    };
    case 'fuel': {
      const f2f = pool.filter(c => c.fuelPolicy === 'Full to full').length;
      return {
        lines: [
          '"Full to full" means you get the car with a full tank and return it full, so you only pay for the fuel you use. It is usually the best-value policy.',
          `${f2f} of ${pool.length} cars in your results are full to full.${pool.length - f2f > 0 ? ' With other policies you may pay for a tank up front; check the rental terms.' : ''}`,
        ],
      };
    }
    case 'mileage': {
      const unl = pool.filter(c => c.unlimitedMileage).length;
      return { lines: [`${unl} of ${pool.length} cars include unlimited mileage, so you can drive as far as you like at no extra cost.${pool.length - unl > 0 ? ' The others have a daily limit; check their rental terms.' : ''}`] };
    }
    case 'insurance': return {
      sort: 'excess',
      lines: ['Each car\'s "Rental terms" show what cover is included and the excess. To lower what you\'d pay if the car is damaged, choose a car with a low excess or add protection when you book, where offered.'],
    };
    case 'documents': return {
      lines: ['You\'ll usually need the main driver\'s full driving licence, a passport or ID, and a credit card in their name for the deposit. Age rules and any international licence requirements are in each car\'s rental terms.'],
    };
    case 'cancellation': return {
      lines: ['Cars marked "Free cancellation" can be cancelled free of charge before the deadline in the rental terms. You can manage your booking from "Manage Booking" at the top of the page.'],
    };
    case 'payment': {
      const desk = pool.filter(c => /pick-up/i.test(c.paymentType || '')).length;
      return { lines: [`${desk} of ${pool.length} cars let you pay at pick-up; the rest are paid now when you book. The price box on each car shows what you pay now and at pick-up.`] };
    }
  }
}

/** Requirements built up over the conversation: the last full question plus any follow-ups after it. */
const lastUserConstraints = (history: AdvisorTurn[], cars: AdvisorCar[]): Parsed | null => {
  const chain: Parsed[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role !== 'user') continue;
    const parsed = parseQuestion(history[i].content, cars);
    chain.unshift(parsed);
    if (!(parsed.refinement || parsed.wantsCheaper || parsed.wantsBigger)) break;
  }
  if (!chain.length) return null;
  return chain.reduce((acc, p) => ({
    ...p,
    constraints: { ...acc.constraints, ...p.constraints },
    requirementText: Array.from(new Set([...acc.requirementText, ...p.requirementText])),
    sort: p.sort || acc.sort,
  }));
};

export function localAdvisorAnswer(question: string, cars: AdvisorCar[], symbol: string, days: number, history: AdvisorTurn[] = []): AdvisorAnswer {
  const pool = cars.filter(c => Number.isFinite(c.totalPrice) && c.totalPrice > 0);
  if (!pool.length) return { reply: "I couldn't find any cars to compare in this search. Try changing your dates or removing some filters.", picks: [] };

  const q = parseQuestion(question, pool);
  const lastPick = [...history].reverse().find(t => t.role === 'assistant' && t.picks?.length)?.picks?.[0];
  const lastPickCar = lastPick ? pool.find(c => c.id === lastPick.carId) : undefined;

  // Follow-up questions keep the earlier requirements unless they are replaced.
  if (q.refinement || q.wantsCheaper || q.wantsBigger) {
    const prev = lastUserConstraints(history, pool);
    if (prev) {
      q.constraints = { ...prev.constraints, ...q.constraints };
      q.requirementText = Array.from(new Set([...prev.requirementText, ...q.requirementText]));
      q.sort = q.sort || prev.sort;
    }
  }
  if (q.wantsCheaper && lastPickCar) {
    q.constraints.maxTotal = Math.min(q.constraints.maxTotal ?? Infinity, lastPickCar.totalPrice - 0.01);
    q.requirementText.push(`cheaper than ${money(symbol, lastPickCar.totalPrice)}`);
    q.sort = q.sort || 'value';
  }
  if (q.wantsBigger && lastPickCar) {
    q.constraints.minSeats = Math.max(q.constraints.minSeats ?? 0, lastPickCar.seats ?? 0);
    q.constraints.minBags = Math.max(q.constraints.minBags ?? 0, (lastPickCar.bags ?? 0) + 1);
    q.sort = q.sort || 'space';
  }
  if (q.mentionedSuppliers.length === 1 && !q.compare) q.constraints.suppliers = q.mentionedSuppliers;

  const priceRange = (list: AdvisorCar[]) => {
    const p = list.map(c => c.totalPrice);
    return `${money(symbol, Math.min(...p))}–${money(symbol, Math.max(...p))}`;
  };

  // --- Thanks / greeting ---
  if (q.thanks && !q.sort && !q.mentioned.length) {
    return { reply: "You're welcome! Ask me anything else, for example \"cheapest automatic\" or \"best car for 4 people with luggage\". When you're ready, tap View deal on the car you like.", picks: [] };
  }
  if (q.greeting) {
    const value = sortCars(pool, 'value', pool)[0];
    const cheapest = sortCars(pool, 'price', pool)[0];
    return {
      reply: `Hi! I'm comparing ${plural(pool.length, 'car')} for your ${days}-day rental, priced ${priceRange(pool)}.\nTell me what matters to you (budget, number of people, luggage, automatic, deposit…) and I'll find the best match.`,
      picks: [
        { carId: value.id, label: 'Best value', reason: `${specs(value)}, ${describeShort(value, symbol)}.` },
        ...(cheapest.id !== value.id ? [{ carId: cheapest.id, label: 'Cheapest', reason: `${specs(cheapest)}, ${money(symbol, cheapest.totalPrice)} total.` }] : []),
      ],
    };
  }

  // --- Comparing named cars or suppliers ---
  if (q.compare) {
    let contenders: AdvisorCar[];
    if (q.mentioned.length >= 1) {
      // One offer per model (the cheapest), unless the same model is offered by named suppliers.
      const byModel = new Map<string, AdvisorCar>();
      for (const car of sortCars(q.mentioned, 'price', pool)) {
        const key = q.mentionedSuppliers.length ? `${norm(car.name)}|${car.supplier}` : norm(car.name);
        if (q.mentionedSuppliers.length && !q.mentionedSuppliers.includes(car.supplier || '')) continue;
        if (!byModel.has(key)) byModel.set(key, car);
      }
      contenders = Array.from(byModel.values());
      if (contenders.length < 2) contenders = sortCars(q.mentioned, 'price', pool);
    } else {
      contenders = q.mentionedSuppliers.map(s => sortCars(pool.filter(c => c.supplier === s && matches(c, { ...q.constraints, suppliers: undefined })), q.sort || 'value', pool)[0]).filter(Boolean) as AdvisorCar[];
    }
    contenders = contenders.slice(0, 3);
    if (contenders.length >= 2) {
      const ranked = sortCars(contenders, q.sort || 'value', pool);
      const [a, b] = ranked;
      const lines: string[] = [`Here's how ${contenders.length === 2 ? 'they compare' : 'these compare'} for ${plural(days, 'day')}:`];
      for (const car of contenders) {
        lines.push(`- ${label(car)}: ${money(symbol, car.totalPrice)} (${money(symbol, car.pricePerDay)}/day), ${specs(car)}, ${car.deposit !== undefined ? `${money(symbol, car.deposit)} deposit` : 'deposit in terms'}${car.excess !== undefined ? `, ${money(symbol, car.excess)} excess` : ''}, ${(car.fuelPolicy || 'fuel policy in terms').toLowerCase()}${car.supplierRating ? `, rated ${car.supplierRating.toFixed(1)}` : ''}.`);
      }
      const reasons: string[] = [];
      if (a.totalPrice < b.totalPrice - 0.5) reasons.push(`is ${money(symbol, b.totalPrice - a.totalPrice)} cheaper`);
      if ((a.deposit ?? Infinity) < (b.deposit ?? Infinity)) reasons.push(`has a lower deposit (${money(symbol, a.deposit)} vs ${money(symbol, b.deposit)})`);
      if ((a.supplierRating ?? 0) > (b.supplierRating ?? 0) + 0.1) reasons.push(`has a better-rated supplier (${a.supplierRating?.toFixed(1)} vs ${b.supplierRating?.toFixed(1)})`);
      if ((a.seats ?? 0) + (a.bags ?? 0) > (b.seats ?? 0) + (b.bags ?? 0)) reasons.push(`has more room (${specs(a)})`);
      if (a.fuelPolicy === 'Full to full' && b.fuelPolicy !== 'Full to full') reasons.push('has a full-to-full fuel policy');
      if (a.transmission === 'Automatic' && b.transmission !== 'Automatic' && q.constraints.transmission !== 'Manual') reasons.push('is automatic');
      const unmet = q.requirementText.length && !matches(a, q.constraints) ? ` Note: it doesn't meet all of: ${q.requirementText.join(', ')}.` : '';
      lines.push(`My pick: ${label(a)}${reasons.length ? `. It ${listJoin(reasons)}` : ''}.${unmet}`);
      if (b.totalPrice < a.totalPrice - 0.5) lines.push(`${label(b)} is ${money(symbol, a.totalPrice - b.totalPrice)} cheaper if price matters most.`);
      const lose = tradeOff(b, a, symbol);
      return {
        reply: lines.join('\n'),
        picks: [
          { carId: a.id, label: q.sort ? SORT_LABEL[q.sort] : 'Better choice', reason: reasons.length ? `${listJoin(reasons).replace(/^(is|has) /, m => (m === 'is ' ? 'It is ' : 'It has '))}.` : `${specs(a)}, ${describeShort(a, symbol)}.` },
          { carId: b.id, label: lose.label, reason: lose.reason },
          ...ranked.slice(2).map(c => ({ carId: c.id, label: 'Also compared', reason: `${specs(c)}, ${describeShort(c, symbol)}.` })),
        ],
      };
    }
  }

  // --- One named car: describe it and how it ranks ---
  if (q.mentioned.length >= 1 && !q.compare) {
    const car = sortCars(q.mentioned, 'price', pool)[0];
    const rank = sortCars(pool, 'price', pool).findIndex(c => c.id === car.id) + 1;
    const lines = [`${label(car)} costs ${money(symbol, car.totalPrice)} for ${plural(days, 'day')} (${money(symbol, car.pricePerDay)}/day). It's the ${rank === 1 ? 'cheapest' : `${rank}${['th', 'st', 'nd', 'rd'][rank % 10 > 3 || [11, 12, 13].includes(rank % 100) ? 0 : rank % 10]} cheapest`} of ${pool.length} cars.`];
    lines.push(`- ${specs(car)}${car.doors ? `, ${car.doors} doors` : ''}`);
    lines.push(`- ${car.deposit !== undefined ? `Deposit ${money(symbol, car.deposit)}` : 'Deposit shown in rental terms'}${car.excess !== undefined ? `, excess ${money(symbol, car.excess)}` : ''}`);
    lines.push(`- ${car.fuelPolicy || 'Fuel policy in rental terms'}, ${car.unlimitedMileage ? 'unlimited mileage' : 'limited mileage'}${car.pickupLocation ? `, ${car.pickupLocation.toLowerCase()} pick-up` : ''}`);
    if (q.requirementText.length) {
      const ok = matches(car, { ...q.constraints, suppliers: undefined });
      lines.push(ok ? `Yes, it meets what you asked for (${q.requirementText.join(', ')}).` : `It doesn't fully meet what you asked for (${q.requirementText.join(', ')}).`);
    }
    const better = sortCars(pool.filter(c => c.id !== car.id && matches(c, { ...q.constraints, suppliers: undefined })), q.sort || 'value', pool)[0];
    const picks: AdvisorPick[] = [{ carId: car.id, label: 'You asked about', reason: `${specs(car)}, ${describeShort(car, symbol)}.` }];
    if (better && scoreValue(better, pool) > scoreValue(car, pool)) {
      const t = tradeOff(better, car, symbol);
      lines.push(`Worth a look: ${label(better)} (${describeShort(better, symbol)}).`);
      picks.push({ carId: better.id, label: t.label, reason: t.reason });
    }
    return { reply: lines.join('\n'), picks };
  }

  // --- Information questions (deposit, fuel, documents...) ---
  if (q.topic && !q.requirementText.length) {
    const info = topicAnswer(q.topic, pool, symbol);
    const sort = q.sort || info.sort;
    const picks: AdvisorPick[] = [];
    if (sort) {
      const top = sortCars(pool, sort, pool)[0];
      info.lines.push(`- ${SORT_LABEL[sort]}: ${label(top)} (${describeShort(top, symbol)}).`);
      picks.push({ carId: top.id, label: SORT_LABEL[sort], reason: `${specs(top)}, ${describeShort(top, symbol)}.` });
    } else if (q.topic === 'fuel') {
      const f2f = sortCars(pool.filter(c => c.fuelPolicy === 'Full to full'), 'value', pool)[0];
      if (f2f) picks.push({ carId: f2f.id, label: 'Best full to full', reason: `${specs(f2f)}, ${describeShort(f2f, symbol)}.` });
    } else if (q.topic === 'mileage') {
      const unl = sortCars(pool.filter(c => c.unlimitedMileage), 'price', pool)[0];
      if (unl) picks.push({ carId: unl.id, label: 'Cheapest unlimited', reason: `${specs(unl)}, ${money(symbol, unl.totalPrice)} total.` });
    }
    return { reply: info.lines.join('\n'), picks };
  }

  // --- Requirements and priorities ---
  const sort: Sort = q.sort || (q.constraints.maxTotal !== undefined || q.constraints.maxPerDay !== undefined ? 'value' : q.constraints.minSeats || q.constraints.minBags ? 'value' : 'value');
  const matching = pool.filter(c => matches(c, q.constraints));
  const lines: string[] = [];

  if (!matching.length) {
    // Relax the requirements one at a time to find the closest options.
    const keys = Object.keys(q.constraints) as (keyof Constraints)[];
    let closest: AdvisorCar[] = [];
    let dropped: string | null = null;
    for (const key of keys) {
      const relaxed = { ...q.constraints, [key]: undefined };
      const found = pool.filter(c => matches(c, relaxed));
      if (found.length) { closest = found; dropped = key; break; }
    }
    if (!closest.length) closest = pool;
    const top = sortCars(closest, sort, pool).slice(0, 3);
    const droppedText: Record<string, string> = {
      transmission: 'the gearbox', minSeats: 'the number of seats', minBags: 'the luggage space', maxTotal: 'the budget', maxPerDay: 'the daily budget',
      maxDeposit: 'the deposit limit', fullToFull: 'the fuel policy', unlimitedMileage: 'unlimited mileage', pickupType: 'the pick-up type',
      categories: 'the car type', suppliers: 'the supplier', specialOffer: 'special offers', payAtPickup: 'pay at pick-up', minTotal: 'the minimum price',
    };
    lines.push(`None of the ${plural(pool.length, 'car')} in this search match all of: ${q.requirementText.join(', ')}.`);
    lines.push(dropped ? `If you're flexible on ${droppedText[dropped] || dropped}, these are the closest:` : 'Here are the best alternatives:');
    top.forEach(c => lines.push(`- ${label(c)}: ${specs(c)}, ${describeShort(c, symbol)}.`));
    return { reply: lines.join('\n'), picks: top.map((c, i) => ({ carId: c.id, label: i === 0 ? 'Closest match' : 'Alternative', reason: `${specs(c)}, ${describeShort(c, symbol)}.` })) };
  }

  const ranked = sortCars(matching, sort, pool);
  const best = ranked[0];
  const intro = q.requirementText.length
    ? `${matching.length} of ${pool.length} cars ${matching.length === 1 ? 'matches' : 'match'} ${listJoin(q.requirementText)} (${matching.length === 1 ? money(symbol, matching[0].totalPrice) : priceRange(matching)}).`
    : `I compared ${plural(pool.length, 'car')} for your ${days}-day rental (${priceRange(pool)}).`;
  lines.push(intro);

  const why: Record<Sort, string> = {
    price: `the lowest price at ${money(symbol, best.totalPrice)} (${money(symbol, best.pricePerDay)}/day)`,
    priceDesc: `the top of the range at ${money(symbol, best.totalPrice)}`,
    deposit: `the lowest deposit${best.deposit !== undefined ? ` (${money(symbol, best.deposit)})` : ''}`,
    excess: `the lowest excess${best.excess !== undefined ? ` (${money(symbol, best.excess)})` : ''}`,
    rating: `the best-rated supplier${best.supplierRating ? ` (${best.supplierRating.toFixed(1)})` : ''}`,
    space: `the most room: ${specs(best)}`,
    value: `the best balance of price, supplier rating and rental terms`,
  };
  const extra = [specs(best), best.deposit !== undefined && sort !== 'deposit' ? `${money(symbol, best.deposit)} deposit` : '', sort !== 'price' && sort !== 'priceDesc' ? `${money(symbol, best.totalPrice)} total` : '', best.supplierRating && sort !== 'rating' ? `rated ${best.supplierRating.toFixed(1)}` : ''].filter(Boolean).join(', ');
  lines.push(`${SORT_LABEL[sort]}: ${label(best)}, with ${why[sort]} (${extra}).`);

  // Alternatives: the runner-up for this priority, plus the best car for a different priority.
  const alternatives: AdvisorCar[] = [];
  const pushAlt = (c?: AdvisorCar) => { if (c && c.id !== best.id && !alternatives.some(a => a.id === c.id)) alternatives.push(c); };
  pushAlt(ranked[1]);
  if (sort !== 'price') pushAlt(sortCars(matching, 'price', pool)[0]);
  if (sort !== 'value') pushAlt(sortCars(matching, 'value', pool)[0]);
  if (sort !== 'rating') pushAlt(sortCars(matching, 'rating', pool)[0]);
  const alts = alternatives.slice(0, 2).map(c => ({ car: c, ...tradeOff(c, best, symbol) }));
  if (alts.length === 2 && alts[0].label === alts[1].label) alts[1].label = 'Another option';
  alts.forEach(a => lines.push(`- ${a.label}: ${label(a.car)}. ${a.reason}`));

  if (best.fuelPolicy && best.fuelPolicy !== 'Full to full') lines.push('Tip: this car isn\'t "full to full", so check the fuel terms before you book.');
  else if (best.unlimitedMileage === false) lines.push('Tip: this car has a mileage limit; check the rental terms if you plan long drives.');

  return {
    reply: lines.join('\n'),
    picks: [
      { carId: best.id, label: SORT_LABEL[sort], reason: `${specs(best)}, ${describeShort(best, symbol)}.` },
      ...alts.map(a => ({ carId: a.car.id, label: a.label, reason: a.reason })),
    ],
  };
}
