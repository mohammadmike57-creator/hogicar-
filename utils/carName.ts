// Car names as customers see them (same rules as the backend's CarNames): suppliers send names such as
// "NISSAN KICKS or simlar"; pages add "or similar" themselves, so it is removed here (any spelling), spaces are
// tidied and names written in capitals get normal capitals, keeping abbreviations such as BMW, i10 or CX-5.

const OR_SIMILAR = /[\s,;/\-–(]*\b(?:or|o|ou)\s+sim+[ilaer]*\b\.?\)?[\s.]*$/i;

const ABBREVIATIONS = new Set([
  'BMW', 'GMC', 'MG', 'VW', 'BYD', 'JAC', 'DS', 'GAC', 'GWM', 'BAIC', 'SEAT', 'SUV', 'MPV', 'GT', 'GTI', 'RS',
  'AMG', 'SE', 'SEL', 'LX', 'EX', 'GLS', 'GLE', 'GLA', 'GLC', 'EV', 'HEV', 'PHEV', 'AWD', '4WD', '4X4', 'AT', 'MT',
  'XL', 'LWB', 'SWB', 'CR-V', 'HR-V', 'RAV4', 'XC90', 'XC60', 'XC40', 'CX-5', 'CX-3', 'CX-9',
]);

const shouted = (s: string) => {
  const letters = s.replace(/[^\p{L}]/gu, '');
  return letters.length >= 3 && letters === letters.toUpperCase() && letters !== letters.toLowerCase() && !ABBREVIATIONS.has(s);
};

const normalCapitals = (s: string) => s.split(' ').map(word => {
  if (ABBREVIATIONS.has(word) || (/\d/.test(word) && word.length <= 4)) return word;
  return word.split('-').map(p => (p ? p[0] + p.slice(1).toLowerCase() : p)).join('-');
}).join(' ');

export function cleanCarName(name?: string | null): string {
  if (!name) return '';
  let s = String(name).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++) {
    const next = s.replace(OR_SIMILAR, '').trim();
    if (next === s || !next) break;
    s = next;
  }
  return shouted(s) ? normalCapitals(s) : s;
}

/** "Kia" + "Rio or simlar" -> "Kia Rio" (without repeating the make when the model already has it). */
export function carNameOf(make?: string | null, model?: string | null, fallback = 'Car'): string {
  const m = cleanCarName(make), mo = cleanCarName(model);
  if (!m) return mo || fallback;
  if (!mo) return m;
  return mo.toLowerCase().startsWith(`${m.toLowerCase()} `) ? mo : `${m} ${mo}`;
}
