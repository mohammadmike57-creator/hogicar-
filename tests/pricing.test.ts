import { describe, expect, it } from 'vitest';
import { calcPricing, rentalDays } from '../utils/pricing';

const car = (over: Record<string, any> = {}) => ({ id: 'c1', supplierId: 'xml-1', netPrice: 120, commissionPercent: 15, extras: [], ...over }) as any;
const search = { pickupDate: '2026-12-20', dropoffDate: '2026-12-23' };

describe('prices shown and charged', () => {
  it('counts rental days from the dates', () => {
    expect(rentalDays('2026-12-20', '2026-12-23')).toBe(3);
    expect(rentalDays('2026-12-20', '2026-12-20')).toBe(1);
  });

  it('pays the markup online and the supplier price at the counter', () => {
    const p = calcPricing(car(), search);
    expect(p.payNow).toBe(18);
    expect(p.payAtDesk).toBe(120);
    expect(p.finalTotal).toBe(138);
  });

  it('adds full protection to the price paid at the counter', () => {
    const p = calcPricing(car(), search, [], 'full');
    expect(p.insuranceCost).toBe(36);
    expect(p.payAtDesk).toBe(156);
    expect(p.payNow).toBe(18);
  });

  it('never lets a promo code cost more than the markup', () => {
    const p = calcPricing(car(), search, [], 'basic', { discountType: 'FIXED', amount: 50 } as any);
    expect(p.discountAmount).toBe(18);
    expect(p.payNow).toBe(0);
    expect(p.finalTotal).toBe(120);
  });
});
