
import { Car, PromoCode } from '../types';

// Search state shape needed for calculation
export interface SearchState {
  pickupDate?: string;   // "YYYY-MM-DD"
  dropoffDate?: string;  // "YYYY-MM-DD"
}

// If your backend netPrice is already TOTAL for the whole rental,
// set this to false (no multiplying by days).
const NET_PRICE_IS_DAILY = true;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function rentalDays(pickupDate?: string, dropoffDate?: string): number {
  if (!pickupDate || !dropoffDate) return 1;
  // Ensure we handle dates correctly without timezone issues for diff calculation
  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const ms = end.getTime() - start.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

export function calcPricing(
    car: Car, 
    search: SearchState, 
    selectedExtraIds: string[] = [], 
    insuranceOption: 'basic' | 'full' = 'basic', 
    appliedPromo: PromoCode | null = null
) {
    const days = rentalDays(search.pickupDate, search.dropoffDate);
    const fullProtectionDailyCost = 12;

    const dailyNetPrice = car.netPrice || 0;
    const dailyCommissionPercent = car.commissionPercent || 0;
    
    // Calculate base totals for the entire rental duration
    const baseNetTotal = NET_PRICE_IS_DAILY ? dailyNetPrice * days : dailyNetPrice;
    const netTotal = round2(baseNetTotal);
    
    const commissionAmount = round2((netTotal * dailyCommissionPercent) / 100);
    const finalPriceBeforeOptions = round2(netTotal + commissionAmount);

    // Calculate costs for selected options
    const extrasCost = (car.extras || []).reduce((acc, extra) => {
        if (!selectedExtraIds.includes(extra.id)) return acc;
        const extraPrice = extra.type === 'per_day' ? extra.price * days : extra.price;
        return acc + extraPrice;
    }, 0);
    
    const insuranceCost = insuranceOption === 'full' ? fullProtectionDailyCost * days : 0;

    // Apply promotions
    const discountAmount = appliedPromo ? round2(commissionAmount * appliedPromo.discount) : 0;

    // Calculate final totals
    const finalTotal = round2(finalPriceBeforeOptions + insuranceCost + extrasCost - discountAmount);
    
    // The amount paid online is the commission, minus any discount
    const payNow = round2(commissionAmount - discountAmount);
    
    // The amount paid at the desk is the net price plus any extras and insurance
    const payAtDesk = round2(netTotal + insuranceCost + extrasCost);
    
    return {
        days,
        baseNetTotal: netTotal, // Renamed for clarity
        extrasCost: round2(extrasCost),
        insuranceCost: round2(insuranceCost),
        discountAmount,
        finalTotal,
        payNow,
        payAtDesk,
        commissionAmount,
    };
}
