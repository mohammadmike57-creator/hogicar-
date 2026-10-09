import * as React from 'react';

/**
 * The "Price held for mm:ss" timer on the car and booking pages. One timer per car, kept for the visit,
 * so it doesn't restart on every page or reload. A "finish your booking" email link sets it to the
 * lock time given in the email.
 */
const KEY = 'hogicar_price_hold';
export const HOLD_MINUTES = 20;

type Hold = { carId: string; expiresAt: number };

const read = (): Hold | null => {
  try {
    const h = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return h && typeof h.expiresAt === 'number' && h.carId ? h : null;
  } catch { return null; }
};

export const setPriceHold = (carId: string, expiresAt: number) => {
  try { sessionStorage.setItem(KEY, JSON.stringify({ carId: String(carId), expiresAt })); } catch { /* storage blocked */ }
};

/** When the hold for this car ends (starts a new 20-minute hold for a car seen for the first time). */
export const priceHoldExpiry = (carId: string) => {
  const h = read();
  if (h && h.carId === String(carId)) return h.expiresAt;
  const expiresAt = Date.now() + HOLD_MINUTES * 60 * 1000;
  setPriceHold(carId, expiresAt);
  return expiresAt;
};

/** Seconds left on the hold for this car, ticking every second. */
export const usePriceHold = (carId?: string | number | null) => {
  const [left, setLeft] = React.useState(HOLD_MINUTES * 60);
  React.useEffect(() => {
    if (carId == null) return;
    const expiresAt = priceHoldExpiry(String(carId));
    const tick = () => setLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [carId]);
  return left;
};
