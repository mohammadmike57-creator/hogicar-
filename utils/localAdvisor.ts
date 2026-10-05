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
  overview: boolean;
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
const catText = (c: { category?: string }) => (/suv/i.test(c.category || '') ? 'SUV' : (c.category || 'similar').toLowerCase());
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
  const overview = has(text, ['compare all', 'all results', 'all the results', 'all cars', 'all the cars', 'all options', 'every car', 'overview', 'summary', 'summarize', 'summarise', 'compare everything', 'compare them', 'compare the results', 'what are my options', 'what do you have', 'قارن كل', 'كل السيارات']);
  const thanks = /\b(thanks|thank you|thx|great|perfect|شكرا)\b/.test(trimmed) && trimmed.split(' ').length <= 5;
  const refinement = /^(and|also|what about|how about|but|only|now|ok|okay|then|same|instead|with|without|any|anything|is there|are there|show me|و)\b/.test(trimmed)
    || (trimmed.split(' ').length <= 4 && !sort && !compare);
  const wantsCheaper = has(text, ['cheaper', 'less expensive', 'lower price', 'أرخص', 'ارخص']);
  const wantsBigger = has(text, ['bigger', 'larger', 'more space', 'more room', 'more seats', 'more bags', 'more luggage']);

  return { constraints: c, sort, topic, mentioned, mentionedSuppliers, compare, greeting, overview, thanks, refinement, wantsCheaper, wantsBigger, requirementText: req };
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

const CLASS_RANK: Record<string, number> = {
  mini: 1, economy: 2, compact: 3, midsize: 4, intermediate: 4, standard: 5, estate: 5, fullsize: 6, 'full size': 6,
  suv: 6, van: 6, 'people carrier': 6, premium: 7, convertible: 7, luxury: 8,
};
export const classRank = (c: AdvisorCar) => {
  const cat = norm(c.category);
  const hit = Object.keys(CLASS_RANK).find(k => cat.includes(k));
  return hit ? CLASS_RANK[hit] : 3;
};

/** What the customer gets for the money: car class, space and supplier rating. */
const benefit = (c: AdvisorCar) => classRank(c) * 1.2 + (c.seats ?? 4) * 0.35 + (c.bags ?? 1) * 0.5 + (c.supplierRating ? c.supplierRating * 0.15 : 1.2);
/** Rental terms that save money or hassle. */
const terms = (c: AdvisorCar, maxDeposit: number) =>
  (c.fuelPolicy === 'Full to full' ? 1 : 0) + (c.unlimitedMileage ? 1 : 0) + (c.specialOffer ? 0.6 : 0)
  + (c.deposit !== undefined && maxDeposit > 0 ? 1 - c.deposit / maxDeposit : 0.4)
  + (/terminal/i.test(c.pickupLocation || '') ? 0.4 : 0);

function scoreValue(c: AdvisorCar, pool: AdvisorCar[]) {
  const prices = pool.map(x => x.totalPrice);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const benefits = pool.map(benefit);
  const minB = Math.min(...benefits), maxB = Math.max(...benefits);
  const maxDeposit = Math.max(0, ...pool.map(x => x.deposit ?? 0));
  const termScores = pool.map(x => terms(x, maxDeposit));
  const minT = Math.min(...termScores), maxT = Math.max(...termScores);
  const pricePct = maxP > minP ? (c.totalPrice - minP) / (maxP - minP) : 0;
  const benefitPct = maxB > minB ? (benefit(c) - minB) / (maxB - minB) : 0.5;
  const termPct = maxT > minT ? (terms(c, maxDeposit) - minT) / (maxT - minT) : 0.5;
  return (1 - pricePct) * 0.55 + benefitPct * 0.32 + termPct * 0.13;
}

function sortCars(list: AdvisorCar[], sort: Sort, pool: AdvisorCar[]): AdvisorCar[] {
  const by = [...list];
  switch (sort) {
    case 'price': return by.sort((a, b) => a.totalPrice - b.totalPrice);
    case 'priceDesc': return by.sort((a, b) => b.totalPrice - a.totalPrice);
    case 'deposit': return by.sort((a, b) => (a.deposit ?? Infinity) - (b.deposit ?? Infinity) || a.totalPrice - b.totalPrice);
    case 'excess': return by.sort((a, b) => (a.excess ?? Infinity) - (b.excess ?? Infinity) || a.totalPrice - b.totalPrice);
    case 'rating': return by.sort((a, b) => (b.supplierRating ?? 0) - (a.supplierRating ?? 0) || a.totalPrice - b.totalPrice);
    case 'space': return by.sort((a, b) => ((b.seats ?? 0) + (b.bags ?? 0) + classRank(b) * 0.6) - ((a.seats ?? 0) + (a.bags ?? 0) + classRank(a) * 0.6) || a.totalPrice - b.totalPrice);
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

  // --- Overview of every result ---
  if (q.overview && !q.mentioned.length && q.mentionedSuppliers.length < 2) {
    return overviewAnswer(pool, pool.filter(c => matches(c, q.constraints)), q.requirementText, symbol, days);
  }

  // --- Comparing named cars or suppliers ---
  if (q.compare) {
    let contenders: AdvisorCar[];
    let supplierSummary: string[] = [];
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
      // Compare suppliers like-for-like: the cheapest car of a class every named supplier offers.
      const offers = q.mentionedSuppliers.map(sup => pool.filter(c => c.supplier === sup && matches(c, { ...q.constraints, suppliers: undefined })));
      const sharedCategories = Array.from(new Set(offers.flat().map(c => norm(c.category))))
        .filter(cat => offers.every(list => list.some(c => norm(c.category) === cat)))
        .sort((x, y) => (CLASS_RANK[x] ?? 3) - (CLASS_RANK[y] ?? 3));
      const shared = sharedCategories[0];
      contenders = offers.map(list => sortCars(shared !== undefined ? list.filter(c => norm(c.category) === shared) : list, 'price', pool)[0]).filter(Boolean) as AdvisorCar[];
      const rank = shared;
      supplierSummary = q.mentionedSuppliers.map((sup, i) => offers[i].length
        ? `${sup}: ${plural(offers[i].length, 'car')}, ${money(symbol, Math.min(...offers[i].map(c => c.totalPrice)))}–${money(symbol, Math.max(...offers[i].map(c => c.totalPrice)))}${offers[i][0].supplierRating ? `, rated ${offers[i][0].supplierRating.toFixed(1)}` : ''}`
        : `${sup}: no matching cars in this search`);
      if (contenders.length >= 2) supplierSummary.push(rank !== undefined ? `Like-for-like, cheapest ${catText(contenders[0])} car from each:` : 'They don\'t offer the same type of car here, so this is the cheapest from each:');
    }
    contenders = contenders.slice(0, 3);
    if (contenders.length >= 2) {
      // Same kind of car? Then the cheaper (or better-rated) offer wins; otherwise weigh overall value.
      const similar = (x: AdvisorCar, y: AdvisorCar) => classRank(x) === classRank(y) && x.transmission === y.transmission && Math.abs((x.bags ?? 0) - (y.bags ?? 0)) <= 1 && Math.abs((x.seats ?? 0) - (y.seats ?? 0)) <= 1;
      const ranked = q.sort ? sortCars(contenders, q.sort, pool)
        : contenders.every(c => similar(c, contenders[0]))
          ? [...contenders].sort((x, y) => (Math.abs(x.totalPrice - y.totalPrice) / Math.min(x.totalPrice, y.totalPrice) < 0.03 ? (y.supplierRating ?? 0) - (x.supplierRating ?? 0) : 0) || x.totalPrice - y.totalPrice)
          : sortCars(contenders, 'value', pool);
      const [a, b] = ranked;
      const lines: string[] = [...(supplierSummary.length ? supplierSummary.map((l, i) => (i < supplierSummary.length - 1 || !l.endsWith(':') ? `- ${l}` : l)) : [`Here's how ${contenders.length === 2 ? 'they compare' : 'these compare'} for ${plural(days, 'day')}:`])];
      for (const car of contenders) {
        lines.push(`- ${label(car)}: ${money(symbol, car.totalPrice)} (${money(symbol, car.pricePerDay)}/day), ${specs(car)}, ${car.deposit !== undefined ? `${money(symbol, car.deposit)} deposit` : 'deposit in terms'}${car.excess !== undefined ? `, ${money(symbol, car.excess)} excess` : ''}, ${(car.fuelPolicy || 'fuel policy in terms').toLowerCase()}${car.supplierRating ? `, rated ${car.supplierRating.toFixed(1)}` : ''}.`);
      }
      const reasons: string[] = [];
      if (a.totalPrice < b.totalPrice - 0.5) reasons.push(`is ${money(symbol, b.totalPrice - a.totalPrice)} cheaper`);
      if ((a.deposit ?? Infinity) < (b.deposit ?? Infinity)) reasons.push(`has a lower deposit (${money(symbol, a.deposit)} vs ${money(symbol, b.deposit)})`);
      if ((a.supplierRating ?? 0) > (b.supplierRating ?? 0) + 0.1) reasons.push(`has a better-rated supplier (${a.supplierRating?.toFixed(1)} vs ${b.supplierRating?.toFixed(1)})`);
      if (classRank(a) > classRank(b)) reasons.push(`is a bigger ${catText(a)} car`);
      else if ((a.seats ?? 0) + (a.bags ?? 0) > (b.seats ?? 0) + (b.bags ?? 0)) reasons.push(`has more room (${specs(a)})`);
      if (!reasons.length && similar(a, b)) reasons.push('is the same kind of car at the best price');
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

  // Be honest when the data can't separate the cars on what the customer asked about.
  const notes: string[] = [];
  let effectiveSort: Sort = sort;
  const ratings = matching.map(c => c.supplierRating).filter((r): r is number => r !== undefined);
  if (sort === 'rating' && (ratings.length < 2 || Math.max(...ratings) - Math.min(...ratings) < 0.05)) {
    notes.push(ratings.length ? `All the suppliers here have the same rating (${ratings[0].toFixed(1)}), so rating doesn't separate them. I ranked them by overall value instead.` : 'Supplier ratings aren\'t available for these cars, so I ranked them by overall value instead.');
    effectiveSort = 'value';
  }
  const deposits = matching.map(c => c.deposit).filter((d): d is number => d !== undefined);
  if (sort === 'deposit' && (deposits.length < 2 || Math.max(...deposits) === Math.min(...deposits))) {
    notes.push(deposits.length ? `The listed deposits are the same (${money(symbol, deposits[0])}). Each car's Rental terms confirm the exact amount.` : 'Deposit amounts aren\'t listed in these search results; you\'ll find the exact amount in each car\'s Rental terms. Here\'s the best value meanwhile.');
    effectiveSort = 'value';
  }
  const excesses = matching.map(c => c.excess).filter((d): d is number => d !== undefined);
  if (sort === 'excess' && excesses.length < 2) {
    notes.push('The damage excess isn\'t listed for these cars; check each car\'s Rental terms. Here\'s the best value meanwhile.');
    effectiveSort = 'value';
  }
  const ranked = sortCars(matching, effectiveSort, pool);
  const best = ranked[0];
  const intro = q.requirementText.length
    ? `${matching.length} of ${pool.length} cars ${matching.length === 1 ? 'matches' : 'match'} ${listJoin(q.requirementText)} (${matching.length === 1 ? money(symbol, matching[0].totalPrice) : priceRange(matching)}).`
    : `I compared ${plural(pool.length, 'car')} for your ${days}-day rental (${priceRange(pool)}).`;
  lines.push(intro);
  notes.forEach(n => lines.push(n));
  const cheapestMatch = sortCars(matching, 'price', pool)[0];
  const valueWhy = best.id === cheapestMatch.id
    ? (q.requirementText.length ? `it's the lowest-priced car that fits what you asked for` : `it's the cheapest car in your search${classRank(best) >= 3 ? `, and still a ${catText(best)} car` : ''}`)
    : `for only ${money(symbol, best.totalPrice - cheapestMatch.totalPrice)} more than the cheapest (${cheapestMatch.name}) you get ${[
        classRank(best) > classRank(cheapestMatch) ? `a bigger ${catText(best)} car` : '',
        (best.bags ?? 0) > (cheapestMatch.bags ?? 0) ? `${plural(best.bags ?? 0, 'bag')} of luggage space` : '',
        (best.seats ?? 0) > (cheapestMatch.seats ?? 0) ? `${best.seats} seats` : '',
        best.transmission === 'Automatic' && cheapestMatch.transmission !== 'Automatic' ? 'an automatic gearbox' : '',
        (best.supplierRating ?? 0) > (cheapestMatch.supplierRating ?? 0) + 0.1 ? `a better-rated supplier (${best.supplierRating?.toFixed(1)})` : '',
        (best.deposit ?? Infinity) < (cheapestMatch.deposit ?? Infinity) ? `a lower deposit (${money(symbol, best.deposit)})` : '',
      ].filter(Boolean).join(', ') || 'better overall terms'}`;

  const why: Record<Sort, string> = {
    price: `the lowest price at ${money(symbol, best.totalPrice)} (${money(symbol, best.pricePerDay)}/day)`,
    priceDesc: `the top of the range at ${money(symbol, best.totalPrice)}`,
    deposit: `the lowest deposit${best.deposit !== undefined ? ` (${money(symbol, best.deposit)})` : ''}`,
    excess: `the lowest excess${best.excess !== undefined ? ` (${money(symbol, best.excess)})` : ''}`,
    rating: `the best-rated supplier${best.supplierRating ? ` (${best.supplierRating.toFixed(1)})` : ''}`,
    space: `the most room of the cars that fit`,
    value: valueWhy,
  };
  const extra = [specs(best), best.deposit !== undefined && effectiveSort !== 'deposit' ? `${money(symbol, best.deposit)} deposit` : '', effectiveSort !== 'price' && effectiveSort !== 'priceDesc' ? `${money(symbol, best.totalPrice)} total` : '', best.supplierRating && effectiveSort !== 'rating' ? `rated ${best.supplierRating.toFixed(1)}` : ''].filter(Boolean).join(', ');
  lines.push(effectiveSort === 'value'
    ? `${SORT_LABEL.value}: ${label(best)}, because ${why.value} (${extra}).`
    : `${SORT_LABEL[effectiveSort]}: ${label(best)}, with ${why[effectiveSort]} (${extra}).`);

  // Alternatives: the runner-up for this priority, plus the best car for a different priority.
  const alternatives: AdvisorCar[] = [];
  const pushAlt = (c?: AdvisorCar) => { if (c && c.id !== best.id && !alternatives.some(a => a.id === c.id)) alternatives.push(c); };
  if (effectiveSort !== 'price') pushAlt(cheapestMatch);
  pushAlt(ranked[1]);
  if (effectiveSort !== 'value') pushAlt(sortCars(matching, 'value', pool)[0]);
  // A different class of car is a more useful alternative than a near-identical one.
  pushAlt(ranked.find(c => classRank(c) !== classRank(best)));
  if (effectiveSort !== 'space') pushAlt(sortCars(matching, 'space', pool)[0]);
  const alts = alternatives.slice(0, 2).map(c => ({ car: c, ...tradeOff(c, best, symbol) }));
  if (alts.length === 2 && alts[0].label === alts[1].label) alts[1].label = 'Another option';
  alts.forEach(a => lines.push(`- ${a.label}: ${label(a.car)}. ${a.reason}`));

  if (best.fuelPolicy && best.fuelPolicy !== 'Full to full') lines.push('Tip: this car isn\'t "full to full", so check the fuel terms before you book.');
  else if (best.unlimitedMileage === false) lines.push('Tip: this car has a mileage limit; check the rental terms if you plan long drives.');

  return {
    reply: lines.join('\n'),
    picks: [
      { carId: best.id, label: SORT_LABEL[effectiveSort], reason: `${specs(best)}, ${describeShort(best, symbol)}.` },
      ...alts.map(a => ({ carId: a.car.id, label: a.label, reason: a.reason })),
    ],
  };
}

/** Compares every car in the search: car types, suppliers and the standout deals. */
function overviewAnswer(pool: AdvisorCar[], cars: AdvisorCar[], requirements: string[], symbol: string, days: number): AdvisorAnswer {
  if (!cars.length) {
    return { reply: `None of the ${plural(pool.length, 'car')} in this search match ${listJoin(requirements)}. Try asking without one of those requirements.`, picks: [] };
  }
  const suppliers = Array.from(new Set(cars.map(c => c.supplier).filter(Boolean) as string[]));
  const prices = cars.map(c => c.totalPrice);
  const lines: string[] = [
    `I compared all ${plural(cars.length, 'car')}${requirements.length ? ` that match ${listJoin(requirements)}` : ' in your search'} from ${plural(suppliers.length, 'supplier')}, for ${plural(days, 'day')}: ${money(symbol, Math.min(...prices))} to ${money(symbol, Math.max(...prices))}.`,
  ];

  // By car type, smallest first.
  const byType = new Map<string, AdvisorCar[]>();
  cars.forEach(c => { const key = c.category || 'Other'; byType.set(key, [...(byType.get(key) || []), c]); });
  const types = Array.from(byType.entries()).sort((a, b) => classRank(a[1][0]) - classRank(b[1][0]));
  lines.push('By car type:');
  types.slice(0, 8).forEach(([type, list]) => {
    const cheapest = sortCars(list, 'price', pool)[0];
    lines.push(`- ${type}: ${plural(list.length, 'car')} from ${money(symbol, cheapest.totalPrice)} (${cheapest.name}, ${cheapest.supplier})`);
  });

  // By supplier, cheapest first.
  if (suppliers.length > 1) {
    lines.push('By supplier:');
    suppliers
      .map(sup => ({ sup, list: cars.filter(c => c.supplier === sup) }))
      .sort((a, b) => Math.min(...a.list.map(c => c.totalPrice)) - Math.min(...b.list.map(c => c.totalPrice)))
      .slice(0, 6)
      .forEach(({ sup, list }) => {
        const r = list.find(c => c.supplierRating)?.supplierRating;
        lines.push(`- ${sup}: ${plural(list.length, 'car')} from ${money(symbol, Math.min(...list.map(c => c.totalPrice)))}${r ? `, rated ${r.toFixed(1)}` : ''}`);
      });
  }

  // Standout deals.
  const picks: AdvisorPick[] = [];
  const add = (label: string, car: AdvisorCar | undefined, reason: string) => {
    if (car && !picks.some(p => p.carId === car.id) && picks.length < 3) picks.push({ carId: car.id, label, reason });
  };
  const value = sortCars(cars, 'value', pool)[0];
  const cheapest = sortCars(cars, 'price', pool)[0];
  const autos = cars.filter(c => c.transmission === 'Automatic');
  const cheapestAuto = sortCars(autos, 'price', pool)[0];
  const big = sortCars(cars.filter(c => (c.seats ?? 0) >= 7), 'price', pool)[0];
  const deposits = cars.filter(c => c.deposit !== undefined);
  const lowDeposit = deposits.length >= 2 && new Set(deposits.map(c => c.deposit)).size > 1 ? sortCars(deposits, 'deposit', pool)[0] : undefined;
  const ratings = cars.map(c => c.supplierRating).filter((r): r is number => r !== undefined);
  const topRated = ratings.length && Math.max(...ratings) - Math.min(...ratings) >= 0.1 ? sortCars(cars, 'rating', pool)[0] : undefined;

  lines.push('Standouts:');
  lines.push(`- Cheapest: ${label(cheapest)}, ${money(symbol, cheapest.totalPrice)} (${specs(cheapest)})`);
  if (value.id !== cheapest.id) lines.push(`- Best value: ${label(value)}, ${money(symbol, value.totalPrice)} (${specs(value)})`);
  if (cheapestAuto && cheapestAuto.id !== cheapest.id) lines.push(`- Cheapest automatic: ${label(cheapestAuto)}, ${money(symbol, cheapestAuto.totalPrice)}`);
  if (big) lines.push(`- Cheapest 7+ seats: ${label(big)}, ${money(symbol, big.totalPrice)}`);
  if (lowDeposit) lines.push(`- Lowest deposit: ${label(lowDeposit)}, ${money(symbol, lowDeposit.deposit)} deposit`);
  if (topRated) lines.push(`- Top-rated supplier: ${topRated.supplier} (${topRated.supplierRating?.toFixed(1)}), from ${money(symbol, topRated.totalPrice)}`);
  if (autos.length && autos.length < cars.length) lines.push(`${autos.length} of ${cars.length} cars are automatic.`);

  add('Best value', value, `${specs(value)}, ${describeShort(value, symbol)}.`);
  add('Cheapest', cheapest, `Lowest total price: ${money(symbol, cheapest.totalPrice)}.`);
  add('Cheapest automatic', cheapestAuto, `${specs(cheapestAuto || cheapest)}, ${money(symbol, (cheapestAuto || cheapest).totalPrice)} total.`);
  add('Top rated', topRated, `Supplier rated ${topRated?.supplierRating?.toFixed(1)}.`);
  add('Lowest deposit', lowDeposit, `${money(symbol, lowDeposit?.deposit)} deposit.`);
  return { reply: lines.join('\n'), picks };
}
