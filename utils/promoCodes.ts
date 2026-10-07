import axios from 'axios';
import { API_BASE_URL } from '../lib/config';
import type { PromoCode } from '../types';

const KEY = 'hogicar_promo';

/** Code carried over from a ?promo= link or entered earlier in this visit. */
export const rememberedPromo = (): string => {
  try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
};
export const rememberPromo = (code: string | null) => {
  try { code ? sessionStorage.setItem(KEY, code.toUpperCase()) : sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
};

/** Checks a code with the server for this trip; throws an Error with the reason to show. */
export const validatePromoCode = async (
  code: string,
  trip: { pickupCode?: string | null; pickupDate?: string; dropoffDate?: string },
): Promise<PromoCode> => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/bookings/promo-codes/validate`, {
      code: code.trim().toUpperCase(),
      pickupCode: trip.pickupCode || undefined,
      pickupDate: trip.pickupDate,
      dropoffDate: trip.dropoffDate,
    });
    const p = res.data || {};
    return {
      id: String(p.id ?? p.code),
      code: p.code,
      discount: Number(p.discount) || 0,
      discountType: p.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
      amount: p.amount != null ? Number(p.amount) : undefined,
      description: p.description || undefined,
      status: 'active',
    };
  } catch (e: any) {
    throw new Error(e?.response?.data?.message || 'We couldn’t check this code. Please try again.');
  }
};

/** "10% off" / "$15 off". */
export const promoLabel = (p: Pick<PromoCode, 'discountType' | 'discount' | 'amount'>) =>
  p.discountType === 'FIXED' ? `$${Number(p.amount || 0).toFixed(0)} off` : `${Math.round(Number(p.discount || 0) * 100)}% off`;
