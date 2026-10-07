import React from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Info from 'lucide-react/dist/esm/icons/info';
import { Extra } from '../types';
import { AddonExtra, countSelected, extraUnitTotal } from '../utils/addons';
import AddonIcon from './AddonIcon';

type AnyExtra = Extra & Partial<AddonExtra>;

/**
 * Add-ons on the car page: icon cards with a price and an add button, or a quantity
 * stepper for items a customer may need more than one of (seats, drivers).
 */
const AddonsSection: React.FC<{
  extras: AnyExtra[];
  selectedExtraIds: string[];
  days: number;
  money: (amount: number) => string;
  onChange: (next: string[]) => void;
  className?: string;
}> = ({ extras, selectedExtraIds, days, money, onChange, className = '' }) => {
  if (!extras.length) return null;

  const setQuantity = (id: string, qty: number) => {
    const others = selectedExtraIds.filter(x => x !== id);
    onChange([...others, ...Array.from({ length: Math.max(0, qty) }, () => id)]);
  };

  const selectedCount = extras.reduce((n, e) => n + countSelected(selectedExtraIds, e.id), 0);

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {/* Showcase banner */}
      <div className="relative overflow-hidden rounded-xl border border-accent/10 bg-gradient-to-r from-accent-50 via-accent-50/60 to-white">
        <div className="flex items-center gap-3 pl-4 pr-2 sm:pl-6">
          <div className="min-w-0 flex-1 py-4 sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Travel extras</p>
            <h2 className="mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-xl">Add-ons for a smoother trip</h2>
            <p className="mt-1 text-sm text-slate-600">Child seats, GPS navigation and more, ready when you pick up the car.</p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-700">
              <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Pay at the desk</li>
              <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> No payment now</li>
              <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Change any time before pick-up</li>
            </ul>
          </div>
          <img
            src="/images/addons-showcase.webp"
            alt="Child car seat and GPS navigation device"
            width={256}
            height={256}
            loading="lazy"
            decoding="async"
            className="hidden h-32 w-32 shrink-0 object-contain mix-blend-multiply min-[420px]:block sm:h-36 sm:w-36"
          />
        </div>
        {selectedCount > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
            <Check className="h-3.5 w-3.5" /> {selectedCount} added
          </span>
        )}
      </div>

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {extras.map(extra => {
          const qty = countSelected(selectedExtraIds, extra.id);
          const maxQty = Math.max(1, extra.maxQuantity || 1);
          const selected = qty > 0;
          const unitTotal = extraUnitTotal(extra, days);
          const capped = !!extra.maxPrice && extra.type === 'per_day' && extra.price * days > extra.maxPrice;
          return (
            <li
              key={extra.id}
              className={`flex flex-col rounded-xl border p-4 transition-all ${
                selected ? 'border-accent bg-accent-50/40 ring-1 ring-accent' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <AddonIcon code={extra.code} active={selected} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[15px] font-semibold leading-snug text-slate-900">
                      {extra.name}
                      {selected && qty > 1 && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 align-middle text-[11px] font-semibold text-white">× {qty}</span>}
                    </p>
                    {extra.onRequest ? (
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">At the desk</span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap text-right text-[15px] font-bold leading-snug text-slate-900">
                        {money(extra.price)}<span className="text-xs font-medium text-slate-500">/{extra.type === 'per_day' ? 'day' : 'rental'}</span>
                      </span>
                    )}
                  </div>
                  {extra.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{extra.description}</p>}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="min-w-0 leading-tight">
                  {extra.onRequest ? (
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500"><Info className="h-3.5 w-3.5" /> Price confirmed by the supplier</p>
                  ) : (
                    <>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{extra.type === 'per_day' ? `Total for ${days} day${days === 1 ? '' : 's'}` : 'One-off charge'}</p>
                      <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-slate-900">
                        {money(unitTotal)}{capped && <span className="ml-1 text-[11px] font-medium text-emerald-700">capped</span>}
                      </p>
                    </>
                  )}
                </div>

                {maxQty > 1 && selected ? (
                  <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <button type="button" onClick={() => setQuantity(extra.id, qty - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={`Remove one ${extra.name}`}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-900" aria-live="polite">{qty}</span>
                    <button type="button" onClick={() => setQuantity(extra.id, Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40" aria-label={`Add another ${extra.name}`}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuantity(extra.id, selected ? 0 : 1)}
                    aria-pressed={selected}
                    aria-label={selected ? `Remove ${extra.name}` : `Add ${extra.name}`}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      selected ? 'bg-accent text-white hover:bg-accent-700' : 'border border-slate-300 bg-white text-slate-800 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {selected ? <><Check className="h-3.5 w-3.5" /> Added</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Info className="h-3.5 w-3.5 shrink-0" /> Add-ons are subject to availability and are paid to the rental company at pick-up.</p>
    </section>
  );
};

export default AddonsSection;
