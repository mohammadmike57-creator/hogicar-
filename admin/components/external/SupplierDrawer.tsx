import * as React from 'react';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Save from 'lucide-react/dist/esm/icons/save';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert';
import Check from 'lucide-react/dist/esm/icons/check';
import { pickupIconFor } from '../../../components/PickupTypeIcon';
import { PICKUP_TYPE_OPTIONS, PickupTypeValue } from '../../../utils/pickupOverrides';
import { AdminAddonSettings } from '../../addonsAdmin';
import { SupplierAddonDraft, SupplierAddonsEditor } from '../AddonEditors';
import { Drawer, Field, inputCls, num, ago, Spinner } from '../commercialUi';
import { SupplierLogo, CarImage } from './media';
import { Rating, StatusPill, supplierLogoOf, supplierCarsOf, carImageOf, carNameOf } from './SupplierCard';
import type { SupplierConfig, Country, Location } from './types';

const CURRENCIES = ['USD', 'JOD', 'AED', 'SAR', 'EUR'];
const FORM_ID = 'ext-supplier-form';

const Section: React.FC<{ id: string; title: string; hint?: string; children: React.ReactNode }> = ({ id, title, hint, children }) => (
  <section id={id} className="scroll-mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Suffixed: React.FC<{ suffix: string; children: React.ReactElement<{ className?: string }> }> = ({ suffix, children }) => (
  <div className="relative">
    {React.cloneElement(children, { className: `${inputCls} pr-14` })}
    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>
  </div>
);

const SECTIONS = [
  { id: 'sx-pricing', label: 'Pricing' },
  { id: 'sx-pickup', label: 'Pick-up' },
  { id: 'supplier-addons', label: 'Add-ons' },
  { id: 'sx-contact', label: 'Contact' },
  { id: 'sx-status', label: 'Status' },
];

export const SupplierDrawer: React.FC<{
  supplier: SupplierConfig;
  onChange: (s: SupplierConfig) => void;
  country: Country | null;
  location: Location | null;
  pickupChoice: PickupTypeValue | '';
  onPickupChoice: (v: PickupTypeValue | '') => void;
  pickupAllLocations: boolean;
  onPickupAllLocations: (v: boolean) => void;
  addonSettings: AdminAddonSettings;
  addonDraft: SupplierAddonDraft | null;
  onAddonDraft: (d: SupplierAddonDraft) => void;
  addonsAllLocations: boolean;
  onAddonsAllLocations: (v: boolean) => void;
  saving: boolean;
  error: string | null;
  warning: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = props => {
  const { supplier: s, onChange, country, location, pickupChoice, saving, error, warning } = props;
  const set = (patch: Partial<SupplierConfig>) => onChange({ ...s, ...patch });
  const currency = s.currency || 'USD';
  const cars = supplierCarsOf(s);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const header = (
    <div className="pb-3">
      <div className="flex items-center gap-3">
        <SupplierLogo src={supplierLogoOf(s)} name={s.supplierName} size="md" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{location?.name}{country ? `, ${country.name}` : ''}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill active={s.active} />
            {s.vendorCode && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{s.vendorCode}</span>}
            <Rating value={s.rating} count={s.reviewCount} />
          </div>
        </div>
      </div>
      <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1" aria-label="Sections">
        {SECTIONS.filter(x => x.id !== 'supplier-addons' || props.addonDraft).map(x => (
          <button key={x.id} type="button" onClick={() => jump(x.id)} className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900">{x.label}</button>
        ))}
      </nav>
    </div>
  );

  const footer = (
    <div className="space-y-3">
      {warning && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{warning}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={props.onClose} disabled={saving} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" form={FORM_ID} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#00679f] disabled:opacity-60">
          {saving ? <Spinner light /> : <Save className="h-4 w-4" />} Save changes
        </button>
      </div>
    </div>
  );

  return (
    <Drawer eyebrow="External supplier" title={s.supplierName} onClose={props.onClose} busy={saving} width="max-w-[640px]" headerExtra={header} footer={footer}>
      <form id={FORM_ID} onSubmit={props.onSubmit} className="space-y-4">
        {/* Overview */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-4">
          {[
            ['Cars', s.carCount > 0 ? num(s.carCount) : '—'],
            ['Priority', String(s.priority || 0)],
            ['Configured', s.isConfigured ? 'Yes' : 'Not yet'],
            ['Last checked', ago(s.lastDiscoveredAt)],
          ].map(([k, v]) => (
            <div key={k} className="bg-white px-3.5 py-3">
              <dt className="text-[11px] text-slate-500">{k}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>

        {cars.length > 0 && (
          <Section id="sx-fleet" title="Fleet sample" hint="Cars this supplier returned at this location.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cars.slice(0, 9).map((c, i) => (
                <figure key={i} className="min-w-0">
                  <CarImage src={carImageOf(c)} alt={carNameOf(c)} />
                  <figcaption className="mt-1.5 truncate text-xs font-medium text-slate-700">{carNameOf(c)}</figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        <Section id="sx-pricing" title="Pricing" hint="Applied to this supplier’s prices at this location.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Markup">
              <Suffixed suffix="%"><input type="number" step="0.01" inputMode="decimal" value={s.markupPercentage || 0} onChange={e => set({ markupPercentage: e.target.value ? parseFloat(e.target.value) : 0 })} /></Suffixed>
            </Field>
            <Field label="Commission">
              <Suffixed suffix="%"><input type="number" step="0.01" inputMode="decimal" value={s.commissionPercentage || 0} onChange={e => set({ commissionPercentage: e.target.value ? parseFloat(e.target.value) : 0 })} /></Suffixed>
            </Field>
            <Field label="Fixed fee">
              <Suffixed suffix={currency}><input type="number" step="0.01" inputMode="decimal" value={s.fixedFee || 0} onChange={e => set({ fixedFee: e.target.value ? parseFloat(e.target.value) : 0 })} /></Suffixed>
            </Field>
            <Field label="Currency">
              <select className={inputCls} value={currency} onChange={e => set({ currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Car deposit" hint="Leave empty to use the provider’s deposit.">
              <Suffixed suffix={currency}><input type="number" step="0.01" inputMode="decimal" placeholder="e.g. 500" value={s.carDeposit || ''} onChange={e => set({ carDeposit: e.target.value ? parseFloat(e.target.value) : undefined })} /></Suffixed>
            </Field>
            <Field label="Priority" hint="Higher numbers rank first.">
              <input type="number" inputMode="numeric" className={inputCls} value={s.priority || 0} onChange={e => set({ priority: parseInt(e.target.value) || 0 })} />
            </Field>
          </div>
        </Section>

        <Section id="sx-pickup" title="Pick-up type" hint="How customers collect cars from this supplier. Shown on search results and the car page.">
          <div className="grid gap-2">
            {[{ value: '' as const, label: 'Use provider data', description: 'Keep what the API reports' }, ...PICKUP_TYPE_OPTIONS].map(option => {
              const Icon = option.value ? pickupIconFor(option.value) : RefreshCw;
              const checked = pickupChoice === option.value;
              return (
                <label key={option.value || 'default'} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 ring-1 ring-inset transition ${checked ? 'bg-sky-50/70 ring-2 ring-[#007ac2]' : 'ring-slate-200 hover:ring-slate-300'}`}>
                  <input type="radio" name="pickupType" className="sr-only" checked={checked} onChange={() => props.onPickupChoice(option.value)} />
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? (option.value ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white') : option.value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.description}</span>
                  </span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${checked ? 'bg-[#007ac2] text-white' : 'ring-2 ring-inset ring-slate-300'}`}>{checked && <Check className="h-3 w-3" />}</span>
                </label>
              );
            })}
          </div>
          {pickupChoice && (
            <label className="mt-3 flex items-center gap-2.5 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#007ac2] focus:ring-[#007ac2]" checked={props.pickupAllLocations} onChange={e => props.onPickupAllLocations(e.target.checked)} />
              Apply to all of {s.supplierName}’s locations
            </label>
          )}
        </Section>

        {props.addonDraft && (
          <div id="supplier-addons" className="scroll-mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
            <SupplierAddonsEditor
              catalog={props.addonSettings.catalog}
              draft={props.addonDraft}
              onChange={props.onAddonDraft}
              allLocations={props.addonsAllLocations}
              onAllLocationsChange={props.onAddonsAllLocations}
              supplierName={s.supplierName}
              currency="USD"
            />
          </div>
        )}

        <Section id="sx-contact" title="Contact" hint="Used for booking notifications to this supplier.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" className={`${inputCls} pl-10`} value={s.contactEmail || ''} onChange={e => set({ contactEmail: e.target.value })} placeholder="reservations@supplier.com" /></div>
            </Field>
            <Field label="Phone">
              <div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" inputMode="tel" className={`${inputCls} pl-10`} value={s.contactPhone || ''} onChange={e => set({ contactPhone: e.target.value })} placeholder="+962 …" /></div>
            </Field>
          </div>
        </Section>

        <section id="sx-status" className="scroll-mt-4 flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Active at this location</h3>
            <p className="mt-0.5 text-sm text-slate-500">Inactive suppliers don’t appear in search results here.</p>
          </div>
          <button type="button" role="switch" aria-checked={s.active} aria-label="Active at this location" onClick={() => set({ active: !s.active })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${s.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.active ? 'translate-x-5' : ''}`} />
          </button>
        </section>
      </form>
    </Drawer>
  );
};
