import React from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Plus from 'lucide-react/dist/esm/icons/plus';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Baby from 'lucide-react/dist/esm/icons/baby';
import Armchair from 'lucide-react/dist/esm/icons/armchair';
import Navigation from 'lucide-react/dist/esm/icons/navigation';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import Snowflake from 'lucide-react/dist/esm/icons/snowflake';
import PackagePlus from 'lucide-react/dist/esm/icons/package-plus';
import Info from 'lucide-react/dist/esm/icons/info';
import { Extra } from '../types';
import { AddonExtra, countSelected, extraUnitTotal } from '../utils/addons';

const FALLBACK_ICONS: Record<string, React.ElementType> = {
  ADDITIONAL_DRIVER: UserPlus,
  BABY_SEAT: Baby,
  CHILD_SEAT: Armchair,
  BOOSTER_SEAT: Armchair,
  GPS: Navigation,
  WIFI: Wifi,
  SNOW_CHAINS: Snowflake,
};

type AnyExtra = Extra & Partial<AddonExtra>;

const AddonPhoto: React.FC<{ extra: AnyExtra }> = ({ extra }) => {
  const [failed, setFailed] = React.useState(false);
  const Icon = FALLBACK_ICONS[extra.code || ''] || PackagePlus;
  if (!extra.image || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-50 via-white to-slate-100">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-accent shadow-sm ring-1 ring-slate-200"><Icon className="h-7 w-7" /></span>
      </div>
    );
  }
  return <img src={extra.image} alt={extra.name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />;
};

/**
 * Add-ons on the car page: photo cards with a price and an add button, or a quantity
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
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Add-ons</h2>
          <p className="mt-0.5 text-sm text-slate-500">Reserve extras now and pay for them at the rental desk.</p>
        </div>
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <Check className="h-3.5 w-3.5" /> {selectedCount} added
          </span>
        )}
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {extras.map(extra => {
          const qty = countSelected(selectedExtraIds, extra.id);
          const maxQty = Math.max(1, extra.maxQuantity || 1);
          const selected = qty > 0;
          const unitTotal = extraUnitTotal(extra, days);
          const capped = !!extra.maxPrice && extra.type === 'per_day' && extra.price * days > extra.maxPrice;
          return (
            <li
              key={extra.id}
              className={`group flex overflow-hidden rounded-xl border bg-white transition-all sm:flex-col ${selected ? 'border-accent ring-1 ring-accent' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
            >
              <div className="relative w-28 shrink-0 overflow-hidden bg-slate-100 sm:aspect-[2/1] sm:w-full">
                <AddonPhoto extra={extra} />
                {selected && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent py-0.5 pl-1 pr-2 text-[11px] font-semibold text-white shadow">
                    <Check className="h-3.5 w-3.5" />{qty > 1 ? `× ${qty}` : 'Added'}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                <p className="text-sm font-semibold text-slate-900 sm:text-[15px]">{extra.name}</p>
                {extra.description && <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">{extra.description}</p>}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-2 pt-3">
                  <div className="min-w-0 leading-tight">
                    {extra.onRequest ? (
                      <>
                        <p className="whitespace-nowrap text-sm font-semibold text-slate-700">Price at the desk</p>
                        <p className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Info className="h-3 w-3" /> Confirmed by the supplier</p>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-nowrap text-sm font-bold text-slate-900">
                          {money(extra.price)}<span className="text-xs font-medium text-slate-500"> / {extra.type === 'per_day' ? 'day' : 'rental'}</span>
                        </p>
                        <p className="whitespace-nowrap text-[11px] text-slate-500">
                          {capped ? `Max ${money(extra.maxPrice as number)} per rental` : extra.type === 'per_day' ? `${money(unitTotal)} for ${days} day${days === 1 ? '' : 's'}` : 'One-off charge'}
                        </p>
                      </>
                    )}
                  </div>
                  {maxQty > 1 && selected ? (
                    <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white">
                      <button type="button" onClick={() => setQuantity(extra.id, qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={`Remove one ${extra.name}`}>
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-slate-900" aria-live="polite">{qty}</span>
                      <button type="button" onClick={() => setQuantity(extra.id, Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40" aria-label={`Add another ${extra.name}`}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQuantity(extra.id, selected ? 0 : 1)}
                      aria-pressed={selected}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${selected ? 'bg-accent text-white hover:bg-accent-700' : 'border border-accent/40 text-accent hover:bg-accent-50'}`}
                    >
                      {selected ? <><Check className="h-3.5 w-3.5" /> Added</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">Add-ons are subject to availability and are paid to the rental company at pick-up.</p>
    </section>
  );
};

export default AddonsSection;
