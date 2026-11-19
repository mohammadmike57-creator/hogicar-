/**
 * Booking events for Google Tag Manager (Google Ads and Analytics), in Google's standard e-commerce format:
 * search, view_item, begin_checkout, add_payment_info and purchase. Google's own consent mode decides what
 * the tags may store (see index.html and utils/consent.ts); these events carry no personal details.
 *
 * The purchase value is Hogicar's revenue on the booking (the amount paid online, i.e. our markup), so ads
 * are optimised for what Hogicar earns; the full rental price is sent alongside as booking_total.
 */
type Item = { item_id: string; item_name: string; item_brand?: string; item_category?: string; price?: number; quantity: number };

const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };

function push(event: string, data: Record<string, any>) {
  try {
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ ecommerce: null }); // Google's advice: clear the previous e-commerce object first
    w.dataLayer.push({ event, ...data });
  } catch { /* tracking must never break the page */ }
}

// The same step for the same car within a few seconds is one visit (the page can load twice on the way in).
let lastStep = { key: '', at: 0 };
function once(event: string, car: any): boolean {
  const key = `${event}|${car?.id ?? car?.carId ?? ''}`;
  const now = Date.now();
  if (lastStep.key === key && now - lastStep.at < 5000) return false;
  lastStep = { key, at: now };
  return true;
}

function itemOf(car: any, supplier?: string): Item {
  const make = car?.make || car?.carMake || car?.brand || '';
  const model = car?.model || car?.carModel || '';
  return {
    item_id: String(car?.sippCode || car?.carSippCode || car?.id || car?.carId || 'car'),
    item_name: `${make} ${model}`.trim() || String(car?.name || car?.carName || 'Rental car'),
    item_brand: supplier || car?.supplier?.name || car?.supplierName || undefined,
    item_category: car?.category || undefined,
    price: num(car?.finalPrice ?? car?.total),
    quantity: 1,
  };
}

/** Results shown for a search (pick-up code, dates and how many cars were found). */
export function trackSearch(pickup: string, pickupDate?: string, dropoffDate?: string, results?: number) {
  push('search', { search_term: pickup, pickup_location: pickup, pickup_date: pickupDate, dropoff_date: dropoffDate, results_count: results });
}

/** A car's page. */
export function trackViewItem(car: any, currency?: string) {
  if (!car || !once('view_item', car)) return;
  push('view_item', { ecommerce: { currency: currency || car?.currency || 'USD', value: num(car?.finalPrice), items: [itemOf(car)] } });
}

/** The driver details step of checkout. */
export function trackBeginCheckout(car: any, total: number, currency?: string) {
  if (!car || !once('begin_checkout', car)) return;
  push('begin_checkout', { ecommerce: { currency: currency || car?.currency || 'USD', value: num(total), items: [itemOf(car)] } });
}

/** The payment step (the amount due online). */
export function trackAddPaymentInfo(car: any, payNow: number, currency?: string) {
  if (!car || !once('add_payment_info', car)) return;
  push('add_payment_info', { ecommerce: { currency: currency || car?.currency || 'USD', value: num(payNow), payment_type: 'card', items: [itemOf(car)] } });
}

const SENT = 'hogicar_ads_purchase_';

/**
 * A completed booking, sent once per booking reference (a refresh or a later visit sends nothing), and only
 * when it is really booked: not while the payment is pending, nor for a cancelled or failed booking.
 */
export function trackPurchase(booking: any): boolean {
  const ref = booking?.bookingRef;
  if (!ref) return false;
  const status = String(booking?.status || '').toUpperCase();
  if (['PAYMENT_PENDING', 'CANCELLED', 'CANCELED', 'FAILED', 'REJECTED', 'EXPIRED'].includes(status)) return false;
  try { if (localStorage.getItem(SENT + ref)) return false; } catch { /* storage blocked: send once per page */ }
  const currency = booking?.currency || 'USD';
  const revenue = num(booking?.payNow);
  const total = num(booking?.finalPrice ?? (num(booking?.payNow) + num(booking?.payAtDesk)));
  push('purchase', {
    ecommerce: {
      transaction_id: String(ref),
      currency,
      value: revenue,
      items: [{ ...itemOf(booking, booking?.supplierName), price: total }],
    },
    booking_total: total,
    pay_at_pickup: num(booking?.payAtDesk),
    pickup_location: booking?.pickupCode,
  });
  try { localStorage.setItem(SENT + ref, String(Date.now())); } catch { /* ignore */ }
  return true;
}
