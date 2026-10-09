import * as React from 'react';
import { API_BASE_URL } from '../lib/config';
import { compactStorageValue } from './storage';

/**
 * Tells the backend how far someone got in a booking, for one "finish your booking" reminder email.
 * Signed-in Rewards members are tracked from the car page; guests only once they reach payment
 * (with the email they typed). Nothing is sent otherwise. Failures are ignored.
 * The car quote they saw is sent too: the reminder email locks that price for 20 minutes.
 */
const SID_KEY = 'hogicar_checkout_sid';
const TOKEN_KEY = 'hogicar_rewards_token';

type Stage = 'CAR' | 'DETAILS' | 'PAYMENT';

const read = (store: Storage, key: string) => { try { return store.getItem(key); } catch { return null; } };

export const carSummary = (car: any) => car ? {
  id: car.id != null ? String(car.id) : undefined,
  name: [car.make, car.model].filter(Boolean).join(' ') || car.name,
  image: car.image || car.imageUrl,
  category: car.category,
  supplier: car.supplier?.name,
  price: car.finalPrice ?? undefined,
  currency: car.currency || 'USD',
} : undefined;

/** The car as the customer saw it (prices included), small enough to keep. */
const quoteOf = (car: any) => {
  if (!car || car.id == null) return undefined;
  try {
    const q = compactStorageValue({ ...car, supplierTerms: undefined, supplier: car.supplier ? { ...car.supplier, terms: undefined } : car.supplier });
    const text = JSON.stringify(q);
    if (text.length > 55_000 || /^data:/.test(String(q.image || ''))) {
      const lean = { ...q, image: /^https?:/.test(String(q.image || '')) ? q.image : undefined, imageUrl: undefined };
      return JSON.stringify(lean).length > 55_000 ? undefined : lean;
    }
    return q;
  } catch { return undefined; }
};

export const trackCheckout = (stage: Stage, data: { car?: any; quote?: any; search?: Record<string, any>; email?: string; firstName?: string }) => {
  const token = read(localStorage, TOKEN_KEY);
  if (!token && (stage !== 'PAYMENT' || !data.email)) return;
  const body = {
    stage,
    sessionId: read(sessionStorage, SID_KEY) || undefined,
    car: carSummary(data.car),
    quote: quoteOf(data.quote),
    search: data.search,
    email: token ? undefined : data.email,
    firstName: token ? undefined : data.firstName,
  };
  const payload = JSON.stringify(body);
  fetch(`${API_BASE_URL}/api/public/checkout/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: payload,
    keepalive: payload.length < 60_000,
  }).then(r => (r.ok ? r.json() : null)).then(d => {
    if (d?.sessionId) { try { sessionStorage.setItem(SID_KEY, d.sessionId); } catch { /* ignore */ } }
  }).catch(() => { /* reminders are optional */ });
};

/** Called on the confirmation page: no reminder for a finished booking. */
export const completeCheckout = () => {
  const sid = read(sessionStorage, SID_KEY);
  if (!sid) return;
  fetch(`${API_BASE_URL}/api/public/checkout/complete`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }), keepalive: true,
  }).catch(() => { /* ignore */ });
  try { sessionStorage.removeItem(SID_KEY); } catch { /* ignore */ }
};

/** While a car or booking page is open and visible, tell the backend the customer is still here (no reminder yet). */
export const useCheckoutHeartbeat = (active: boolean) => {
  React.useEffect(() => {
    if (!active) return;
    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      const sid = read(sessionStorage, SID_KEY);
      if (!sid) return;
      fetch(`${API_BASE_URL}/api/public/checkout/ping`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }),
      }).catch(() => { /* ignore */ });
    };
    const t = window.setInterval(beat, 60_000);
    return () => window.clearInterval(t);
  }, [active]);
};
