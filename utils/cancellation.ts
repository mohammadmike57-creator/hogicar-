// The free-cancellation line for a car. Suppliers connected through their own API send their policy code
// (e.g. FLEX48 = free until 48 hours before pick-up); other cars keep the site's general wording.
export const freeCancellationDetail = (car: any): string => {
  const code = String(car?.cancellationPolicy || '').toUpperCase();
  const hours = /FLEX(\d{1,3})/.exec(code);
  if (hours) {
    const n = Number(hours[1]);
    return n % 24 === 0 && n >= 48 ? `Up to ${n / 24} days before pick-up` : `Up to ${n} hours before pick-up`;
  }
  return 'Before pick-up';
};

export const freeCancellationLine = (car: any): string => {
  const d = freeCancellationDetail(car);
  return d === 'Before pick-up' ? 'Free cancellation before pick-up' : `Free cancellation ${d.charAt(0).toLowerCase()}${d.slice(1)}`;
};
