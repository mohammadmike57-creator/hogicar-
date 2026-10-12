/**
 * Display names and landing pages for the country/city tags stored on SEO pages ("jo", "Jordan", "amman", "dead-sea").
 * Unknown tags fall back to a tidy version of the tag itself.
 */
type Place = { en: string; ar: string; enRoute: string; arRoute: string };

const COUNTRIES: Record<string, Place> = {
  jordan: { en: 'Jordan', ar: 'الأردن', enRoute: '/car-rental-jordan', arRoute: '/ar/تأجير-سيارات-في-الأردن' },
  'united-arab-emirates': { en: 'United Arab Emirates', ar: 'الإمارات', enRoute: '/car-rental-united-arab-emirates', arRoute: '/ar/تأجير-سيارات-في-الإمارات-العربية-المتحدة' },
  'saudi-arabia': { en: 'Saudi Arabia', ar: 'السعودية', enRoute: '/car-rental-saudi-arabia', arRoute: '/ar/تأجير-سيارات-في-المملكة-العربية-السعودية' },
  egypt: { en: 'Egypt', ar: 'مصر', enRoute: '/car-rental-egypt', arRoute: '/ar/تأجير-سيارات-في-مصر' },
  qatar: { en: 'Qatar', ar: 'قطر', enRoute: '/car-rental-qatar', arRoute: '/ar/تأجير-سيارات-في-قطر' },
  oman: { en: 'Oman', ar: 'سلطنة عمان', enRoute: '/car-rental-oman', arRoute: '/ar/تأجير-سيارات-في-سلطنة-عمان' },
  bahrain: { en: 'Bahrain', ar: 'البحرين', enRoute: '/car-rental-bahrain', arRoute: '/ar/تأجير-سيارات-في-البحرين' },
  kuwait: { en: 'Kuwait', ar: 'الكويت', enRoute: '/car-rental-kuwait', arRoute: '/ar/تأجير-سيارات-في-الكويت' },
};

const COUNTRY_ALIASES: Record<string, string> = {
  jo: 'jordan', 'الأردن': 'jordan', 'الاردن': 'jordan',
  ae: 'united-arab-emirates', uae: 'united-arab-emirates', 'الإمارات': 'united-arab-emirates',
  sa: 'saudi-arabia', ksa: 'saudi-arabia', eg: 'egypt', qa: 'qatar', om: 'oman', bh: 'bahrain', kw: 'kuwait',
};

const CITIES: Record<string, Place> = {
  amman: { en: 'Amman', ar: 'عمان', enRoute: '/car-rental-amman', arRoute: '/ar/تأجير-سيارات-في-عمان' },
  aqaba: { en: 'Aqaba', ar: 'العقبة', enRoute: '/car-rental-aqaba', arRoute: '/ar/تأجير-سيارات-في-العقبة' },
  petra: { en: 'Petra', ar: 'البتراء', enRoute: '/car-rental-petra', arRoute: '/ar/تأجير-سيارات-في-البتراء' },
  'dead-sea': { en: 'Dead Sea', ar: 'البحر الميت', enRoute: '/car-rental-dead-sea', arRoute: '/ar/تأجير-سيارات-في-البحر-الميت' },
  'wadi-rum': { en: 'Wadi Rum', ar: 'وادي رم', enRoute: '/car-rental-wadi-rum', arRoute: '/ar/تأجير-سيارات-في-وادي-رم' },
  dubai: { en: 'Dubai', ar: 'دبي', enRoute: '/car-rental-dubai', arRoute: '/ar/تأجير-سيارات-في-دبي' },
  'abu-dhabi': { en: 'Abu Dhabi', ar: 'أبو ظبي', enRoute: '/car-rental-abu-dhabi', arRoute: '/ar/تأجير-سيارات-في-أبو-ظبي' },
};

const key = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '-');
const tidy = (v: string) => (/^[a-z0-9-]+$/i.test(v) ? v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : v);

export const countryPlace = (tag: string, arabic: boolean) => {
  const k = key(tag);
  const p = COUNTRIES[COUNTRY_ALIASES[k] || COUNTRY_ALIASES[tag.trim()] || k];
  if (p) return { name: arabic ? p.ar : p.en, route: arabic ? p.arRoute : p.enRoute };
  return { name: tidy(tag), route: `/car-rental-${k}` };
};

export const cityPlace = (tag: string, arabic: boolean) => {
  const k = key(tag);
  const p = CITIES[k];
  if (p) return { name: arabic ? p.ar : p.en, route: arabic ? p.arRoute : p.enRoute };
  return { name: tidy(tag), route: `/car-rental-${k}` };
};
