// Built-in comparison engine for the AI advisor. It answers common "which car should I pick"
// questions straight from the search results, so the advisor still works when the
// server-side AI model is not configured or not reachable.

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
  fuelPolicy?: string;
  unlimitedMileage?: boolean;
  pickupLocation?: string;
  specialOffer?: boolean;
}

export interface AdvisorPick { carId: string; label: string; reason: string }
export interface AdvisorAnswer { reply: string; picks: AdvisorPick[] }

type Intent = 'cheapest' | 'deposit' | 'rating' | 'value';

const has = (text: string, words: string[]) => words.some(w => text.includes(w));

const WORD_NUMBERS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

const parseNumberBefore = (text: string, nouns: string): number | undefined => {
  const match = text.match(new RegExp(`(\\d+|two|three|four|five|six|seven|eight|nine)\\s*(?:${nouns})`));
  if (!match) return undefined;
  return WORD_NUMBERS[match[1]] ?? Number(match[1]);
};

const money = (symbol: string, value?: number) => (value === undefined ? 'n/a' : `${symbol}${value.toFixed(value % 1 ? 2 : 0)}`);

export function localAdvisorAnswer(question: string, cars: AdvisorCar[], symbol: string, days: number): AdvisorAnswer {
  const text = question.toLowerCase();
  const available = cars.filter(c => Number.isFinite(c.totalPrice) && c.totalPrice > 0);
  if (!available.length) {
    return { reply: "I couldn't find any cars to compare in this search. Try changing your dates or removing some filters.", picks: [] };
  }

  // --- Requirements from the question ---
  const wantsAuto = has(text, ['automatic', 'auto ', 'auto?', 'أوتوماتيك', 'اوتوماتيك', 'اتوماتيك']) || /\bauto\b/.test(text);
  const wantsManual = has(text, ['manual', 'stick', 'عادي', 'يدوي']);
  let seats = parseNumberBefore(text, 'people|persons|passengers|adults|seats|seater|of us|pax');
  const familyOf = text.match(/family of (\d+|two|three|four|five|six|seven|eight)/);
  if (familyOf) seats = WORD_NUMBERS[familyOf[1]] ?? Number(familyOf[1]);
  if (!seats && has(text, ['family', 'kids', 'children', 'عائلة', 'عائله', 'اطفال', 'أطفال'])) seats = 4;
  if (!seats && has(text, ['7 seat', 'seven seat', 'minivan', 'people carrier', 'van'])) seats = 7;
  let bags = parseNumberBefore(text, 'bags|bag|suitcases|suitcase|luggage');
  if (!bags && has(text, ['luggage', 'suitcase', 'bags', 'شنط', 'حقائب'])) bags = 2;
  const wantsFullToFull = has(text, ['full to full', 'full-to-full', 'fuel']);
  const wantsUnlimited = has(text, ['unlimited', 'mileage', 'km', 'kilomet', 'miles']);
  const wantsTerminal = has(text, ['terminal', 'airport desk', 'in the airport']);
  const wantsSuv = has(text, ['suv', 'jeep', '4x4', 'دفع رباعي']);
  const wantsLuxury = has(text, ['luxury', 'premium', 'mercedes', 'bmw', 'فخم', 'فخمة']);

  // --- What they care about most ---
  let intent: Intent = 'value';
  if (has(text, ['deposit', 'excess', 'تأمين', 'تامين', 'ديبوزت'])) intent = 'deposit';
  else if (has(text, ['cheap', 'lowest price', 'budget', 'low cost', 'least expensive', 'رخيص', 'ارخص', 'أرخص'])) intent = 'cheapest';
  else if (has(text, ['rated', 'rating', 'review', 'reliable', 'best supplier', 'trusted', 'تقييم'])) intent = 'rating';

  const requirements: string[] = [];
  let candidates = available.filter(c => {
    if (wantsAuto && !wantsManual && c.transmission !== 'Automatic') return false;
    if (wantsManual && !wantsAuto && c.transmission !== 'Manual') return false;
    if (seats && (c.seats ?? 0) < seats) return false;
    if (bags && (c.bags ?? 0) < bags) return false;
    if (wantsFullToFull && c.fuelPolicy !== 'Full to full') return false;
    if (wantsUnlimited && c.unlimitedMileage === false) return false;
    if (wantsTerminal && !/terminal/i.test(c.pickupLocation || '')) return false;
    if (wantsSuv && !/suv/i.test(c.category || '')) return false;
    if (wantsLuxury && !/luxury|premium/i.test(c.category || '')) return false;
    return true;
  });
  if (wantsAuto && !wantsManual) requirements.push('automatic');
  if (wantsManual && !wantsAuto) requirements.push('manual');
  if (seats) requirements.push(`at least ${seats} seats`);
  if (bags) requirements.push(`room for ${bags}+ bags`);
  if (wantsFullToFull) requirements.push('full-to-full fuel');
  if (wantsUnlimited) requirements.push('unlimited mileage');
  if (wantsTerminal) requirements.push('in-terminal pick-up');
  if (wantsSuv) requirements.push('SUV');
  if (wantsLuxury) requirements.push('luxury');

  const lines: string[] = [];
  if (requirements.length && !candidates.length) {
    lines.push(`None of the ${available.length} cars in this search match all of these: ${requirements.join(', ')}. Here are the closest good options instead.`);
    candidates = available;
  } else if (requirements.length) {
    lines.push(`${candidates.length} of ${available.length} cars match ${requirements.join(', ')}.`);
  } else {
    lines.push(`I compared ${available.length} cars for your ${days}-day rental.`);
  }

  // --- Scoring ---
  const prices = candidates.map(c => c.totalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const deposits = candidates.map(c => c.deposit ?? 0);
  const maxDeposit = Math.max(...deposits, 1);
  const valueScore = (c: AdvisorCar) => {
    const priceScore = maxPrice > minPrice ? 1 - (c.totalPrice - minPrice) / (maxPrice - minPrice) : 1;
    const ratingScore = c.supplierRating ? Math.min(c.supplierRating, 10) / 10 : 0.6;
    const depositScore = 1 - (c.deposit ?? maxDeposit / 2) / maxDeposit;
    return priceScore * 0.5 + ratingScore * 0.25 + depositScore * 0.1
      + (c.fuelPolicy === 'Full to full' ? 0.06 : 0)
      + (c.unlimitedMileage ? 0.05 : 0)
      + (c.specialOffer ? 0.04 : 0);
  };

  const cheapest = [...candidates].sort((a, b) => a.totalPrice - b.totalPrice)[0];
  const lowestDeposit = [...candidates].sort((a, b) => (a.deposit ?? Infinity) - (b.deposit ?? Infinity) || a.totalPrice - b.totalPrice)[0];
  const topRated = [...candidates].sort((a, b) => (b.supplierRating ?? 0) - (a.supplierRating ?? 0) || a.totalPrice - b.totalPrice)[0];
  const bestValue = [...candidates].sort((a, b) => valueScore(b) - valueScore(a))[0];

  const describe = (c: AdvisorCar) => {
    const bits = [`${money(symbol, c.totalPrice)} total`];
    if (c.deposit !== undefined) bits.push(`${money(symbol, c.deposit)} deposit`);
    if (c.supplierRating) bits.push(`rated ${c.supplierRating.toFixed(1)}`);
    return bits.join(', ');
  };
  const specs = (c: AdvisorCar) => [c.transmission, c.seats ? `${c.seats} seats` : '', c.bags ? `${c.bags} bag${c.bags === 1 ? '' : 's'}` : '', c.fuelPolicy ? `${c.fuelPolicy.toLowerCase()} fuel` : ''].filter(Boolean).join(', ');

  const order: { label: string; car: AdvisorCar; reason: string }[] = [];
  const add = (label: string, car: AdvisorCar | undefined, reason: string) => {
    if (car && !order.some(o => o.car.id === car.id)) order.push({ label, car, reason });
  };

  const primary = { cheapest, deposit: lowestDeposit, rating: topRated, value: bestValue }[intent];
  const primaryLabel = { cheapest: 'Cheapest', deposit: 'Lowest deposit', rating: 'Top rated', value: 'Best value' }[intent];
  add(primaryLabel, primary, `${specs(primary)}.`);
  add('Best value', bestValue, 'Best balance of price, supplier rating and rental terms.');
  add('Cheapest', cheapest, `Lowest total price at ${money(symbol, cheapest.totalPrice)}.`);
  add('Lowest deposit', lowestDeposit, `Smallest deposit${lowestDeposit.deposit !== undefined ? ` (${money(symbol, lowestDeposit.deposit)})` : ''} to block on your card.`);
  add('Top rated', topRated, `Highest supplier rating${topRated.supplierRating ? ` (${topRated.supplierRating.toFixed(1)})` : ''}.`);
  const picks = order.slice(0, 3);

  lines.push(`- ${primaryLabel}: ${primary.name} from ${primary.supplier || 'the supplier'} (${describe(primary)}).`);
  picks.slice(1).forEach(p => lines.push(`- ${p.label}: ${p.car.name} from ${p.car.supplier || 'the supplier'} (${describe(p.car)}).`));
  if (primary.fuelPolicy && primary.fuelPolicy !== 'Full to full') {
    lines.push('Tip: with a "full to full" fuel policy you only pay for the fuel you use. Check the fuel terms before you book.');
  } else if ((primary.deposit ?? 0) > 0) {
    lines.push('Tip: the deposit is blocked on the main driver\'s credit card at pick-up and released after you return the car.');
  }

  return { reply: lines.join('\n'), picks: picks.map(p => ({ carId: p.car.id, label: p.label, reason: p.reason })) };
}
