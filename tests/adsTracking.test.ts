import { beforeEach, describe, expect, it } from 'vitest';
import { trackBeginCheckout, trackPurchase } from '../utils/adsTracking';

const events = () => ((window as any).dataLayer || []).filter((e: any) => e?.event).map((e: any) => e.event);
const booking = { bookingRef: 'H1', status: 'CONFIRMED', currency: 'USD', payNow: 18, payAtDesk: 120, finalPrice: 138, carMake: 'Toyota', carModel: 'Corolla' };

beforeEach(() => { (window as any).dataLayer = []; localStorage.clear(); });

describe('Google Ads booking tracking', () => {
  it('sends one purchase per booking, valued at Hogicar\'s revenue', () => {
    expect(trackPurchase(booking)).toBe(true);
    expect(trackPurchase(booking)).toBe(false);
    const p = (window as any).dataLayer.find((e: any) => e.event === 'purchase');
    expect(p.ecommerce).toMatchObject({ transaction_id: 'H1', value: 18, currency: 'USD' });
    expect(p.booking_total).toBe(138);
  });

  it('sends nothing for a booking that is not paid or was cancelled', () => {
    expect(trackPurchase({ ...booking, bookingRef: 'H2', status: 'PAYMENT_PENDING' })).toBe(false);
    expect(trackPurchase({ ...booking, bookingRef: 'H3', status: 'CANCELLED' })).toBe(false);
    expect(events()).not.toContain('purchase');
  });

  it('counts a checkout step once even when the page loads twice', () => {
    const car = { id: 'c9', make: 'Kia', model: 'Picanto', currency: 'USD' };
    trackBeginCheckout(car, 100);
    trackBeginCheckout(car, 100);
    expect(events().filter((e: string) => e === 'begin_checkout')).toHaveLength(1);
  });
});
