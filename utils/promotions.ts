// Supplier promotions: shared look (frame colours) and wording for the car card, car page,
// booking and the supplier dashboard.
import { SupplierPromotionInfo } from '../types';
import { ADDON_DEFINITIONS } from './addons';

export type PromotionTheme = 'rose' | 'emerald' | 'violet' | 'amber' | 'navy' | 'sky';

export interface PromotionThemeStyle {
  id: PromotionTheme;
  label: string;
  /** Gradient used for the frame and the ribbon (Tailwind "from/via/to"). */
  gradient: string;
  /** Swatch for the colour picker. */
  swatch: string;
  /** Soft background + text for chips on white. */
  soft: string;
  text: string;
  glow: string;
}

export const PROMOTION_THEMES: PromotionThemeStyle[] = [
  { id: 'rose', label: 'Sale red', gradient: 'from-rose-600 via-red-500 to-orange-500', swatch: 'bg-gradient-to-br from-rose-600 to-orange-500', soft: 'bg-rose-50 ring-rose-200', text: 'text-rose-700', glow: 'shadow-[0_14px_36px_-16px_rgba(225,29,72,0.55)]' },
  { id: 'emerald', label: 'Fresh green', gradient: 'from-emerald-600 via-teal-500 to-cyan-500', swatch: 'bg-gradient-to-br from-emerald-600 to-cyan-500', soft: 'bg-emerald-50 ring-emerald-200', text: 'text-emerald-700', glow: 'shadow-[0_14px_36px_-16px_rgba(5,150,105,0.55)]' },
  { id: 'violet', label: 'Premium violet', gradient: 'from-violet-700 via-purple-600 to-fuchsia-500', swatch: 'bg-gradient-to-br from-violet-700 to-fuchsia-500', soft: 'bg-violet-50 ring-violet-200', text: 'text-violet-700', glow: 'shadow-[0_14px_36px_-16px_rgba(124,58,237,0.55)]' },
  { id: 'amber', label: 'Sunset orange', gradient: 'from-amber-500 via-orange-500 to-orange-600', swatch: 'bg-gradient-to-br from-amber-500 to-orange-600', soft: 'bg-amber-50 ring-amber-200', text: 'text-amber-800', glow: 'shadow-[0_14px_36px_-16px_rgba(234,88,12,0.55)]' },
  { id: 'navy', label: 'Midnight', gradient: 'from-slate-950 via-slate-800 to-[#007ac2]', swatch: 'bg-gradient-to-br from-slate-950 to-[#007ac2]', soft: 'bg-slate-100 ring-slate-300', text: 'text-slate-800', glow: 'shadow-[0_14px_36px_-16px_rgba(15,23,42,0.6)]' },
  { id: 'sky', label: 'Hogicar blue', gradient: 'from-[#005f99] via-[#007ac2] to-sky-400', swatch: 'bg-gradient-to-br from-[#005f99] to-sky-400', soft: 'bg-sky-50 ring-sky-200', text: 'text-sky-800', glow: 'shadow-[0_14px_36px_-16px_rgba(0,122,194,0.55)]' },
];

export const promotionTheme = (theme?: string | null): PromotionThemeStyle =>
  PROMOTION_THEMES.find(t => t.id === theme) || PROMOTION_THEMES[0];

export const addonName = (code: string) =>
  ADDON_DEFINITIONS.find(d => d.code === code)?.name || code.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

/** "Additional driver" -> "additional driver", but keeps "GPS navigation" and "Wi-Fi hotspot". */
export const lowerName = (name: string) => /^[A-Z][a-z]+(\s|$)/.test(name) ? name[0].toLowerCase() + name.slice(1) : name;

export const discountOf = (promo?: SupplierPromotionInfo | null) =>
  promo && typeof promo.discountPercent === 'number' && promo.discountPercent > 0 ? Number(promo.discountPercent) : 0;

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

/** Short highlights, e.g. ["Save 15%", "Free additional driver"]. */
export const promotionHighlights = (promo?: SupplierPromotionInfo | null): string[] => {
  if (!promo) return [];
  const out: string[] = [];
  const d = discountOf(promo);
  if (d > 0) out.push(`Save ${pct(d)}`);
  for (const code of promo.freeAddons || []) out.push(`Free ${lowerName(addonName(code))}`);
  return out;
};

/** One line stored with the booking, e.g. "Summer Sale: 15% off, free additional driver". */
export const promotionSummary = (promo?: SupplierPromotionInfo | null): string | undefined => {
  if (!promo) return undefined;
  const parts: string[] = [];
  const d = discountOf(promo);
  if (d > 0) parts.push(`${pct(d)} off`);
  for (const code of promo.freeAddons || []) parts.push(`free ${lowerName(addonName(code))}`);
  return `${promo.title}${parts.length ? `: ${parts.join(', ')}` : ''}`;
};

export const promotionEndsText = (endDate?: string | null) => {
  if (!endDate) return null;
  const d = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return `Pick up by ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
};
