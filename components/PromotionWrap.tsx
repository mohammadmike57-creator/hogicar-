import * as React from 'react';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { SupplierPromotionInfo } from '../types';
import { discountOf, promotionEndsText, promotionHighlights, promotionTheme } from '../utils/promotions';

interface RibbonProps {
  promo: SupplierPromotionInfo;
  /** Text after the highlights, e.g. "You save $24". */
  savingsText?: string | null;
  compact?: boolean;
}

/** Gradient ribbon with the promotion name and what the customer gets. */
export const PromotionRibbon: React.FC<RibbonProps> = ({ promo, savingsText, compact }) => {
  const theme = promotionTheme(promo.theme);
  const highlights = promotionHighlights(promo);
  const ends = promotionEndsText(promo.endDate);
  const hasDiscount = discountOf(promo) > 0;
  const Icon = hasDiscount ? Tag : Gift;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${theme.gradient} text-white`}>
      {/* soft shine */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-24 w-40 rotate-12 rounded-full bg-white/15 blur-2xl" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.14)_1px,transparent_0)] [background-size:14px_14px]" />
      <div className={`relative flex flex-wrap items-center gap-x-3 gap-y-1.5 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-sm font-bold tracking-tight">{promo.title}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {highlights.map(h => (
            <span key={h} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900 shadow-sm">
              <Sparkles className={`h-3 w-3 ${theme.text}`} /> {h}
            </span>
          ))}
        </span>
        <span className="ml-auto hidden items-center gap-3 text-[11px] font-medium text-white/90 sm:inline-flex">
          {savingsText && <span className="font-semibold text-white">{savingsText}</span>}
          {ends && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {ends}</span>}
        </span>
      </div>
      {!compact && promo.tagline && (
        <p className="relative -mt-1 px-4 pb-2 text-xs text-white/85">{promo.tagline}</p>
      )}
    </div>
  );
};

interface WrapProps {
  promo?: SupplierPromotionInfo | null;
  savingsText?: string | null;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps a car card in the promotion's gradient frame with the ribbon on top.
 * Without a promotion it renders the children unchanged.
 */
const PromotionWrap: React.FC<WrapProps> = ({ promo, savingsText, className = '', children }) => {
  if (!promo) return <>{children}</>;
  const theme = promotionTheme(promo.theme);
  return (
    <div className={`relative rounded-[14px] bg-gradient-to-r ${theme.gradient} p-[2px] ${theme.glow} transition-shadow ${className}`}>
      <div className="overflow-hidden rounded-[12px] bg-white">
        <PromotionRibbon promo={promo} savingsText={savingsText} />
        {children}
      </div>
    </div>
  );
};

/** "-15%" sticker for the car image corner. */
export const PromotionSticker: React.FC<{ promo?: SupplierPromotionInfo | null; className?: string }> = ({ promo, className = '' }) => {
  const d = discountOf(promo);
  if (!promo || (d <= 0 && !(promo.freeAddons || []).length)) return null;
  const theme = promotionTheme(promo.theme);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${theme.gradient} px-1.5 py-0.5 text-[11px] font-extrabold text-white shadow-md ${className}`}>
      {d > 0 ? `-${Number.isInteger(d) ? d : d.toFixed(1)}%` : <><Gift className="h-3 w-3" /> Free extra</>}
    </span>
  );
};

export default PromotionWrap;
