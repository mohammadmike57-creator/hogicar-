const BASE = '/api/rapid/cars';

export async function autoCompleteLocation(query: string, region?: string, locale = 'en_US') {
  const params = new URLSearchParams({ query, locale });
  if (region) params.append('region', region);
  const res = await fetch(`${BASE}/auto-complete?${params}`);
  if (!res.ok) throw new Error('Auto-complete failed');
  return res.json();
}

export async function searchCars(params: {
  pickUpLocation: string;
  dropOffLocation?: string;
  pickUpDate?: string;
  dropOffDate?: string;
  page?: number;
  locale?: string;
  currency?: string;
}) {
  const query = new URLSearchParams();
  query.append('pickUpLocation', params.pickUpLocation);
  if (params.dropOffLocation) query.append('dropOffLocation', params.dropOffLocation);
  if (params.pickUpDate) query.append('pickUpDate', params.pickUpDate);
  if (params.dropOffDate) query.append('dropOffDate', params.dropOffDate);
  if (params.page) query.append('page', String(params.page));
  if (params.locale) query.append('locale', params.locale);
  if (params.currency) query.append('currency', params.currency);

  const res = await fetch(`${BASE}/search?${query}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getCarDetails(carOfferToken: string, locale = 'en_US', currency = 'USD') {
  const params = new URLSearchParams({ carOfferToken, locale, currency });
  const res = await fetch(`${BASE}/details?${params}`);
  if (!res.ok) throw new Error('Details failed');
  return res.json();
}
