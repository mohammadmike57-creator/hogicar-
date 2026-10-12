import * as React from 'react';
import Star from 'lucide-react/dist/esm/icons/star';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import PackagePlus from 'lucide-react/dist/esm/icons/package-plus';
import Ellipsis from 'lucide-react/dist/esm/icons/ellipsis';
import Copy from 'lucide-react/dist/esm/icons/copy';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { pickupIconFor } from '../../../components/PickupTypeIcon';
import { pickupTypeLabel } from '../../../utils/pickupOverrides';
import { num, copyText } from '../commercialUi';
import { SupplierLogo, CarImage, firstString } from './media';
import type { SupplierConfig, ExternalCar } from './types';

export const supplierLogoOf = (s: SupplierConfig) => firstString(s.logoUrl, s.supplierLogo, s.logo, s.imageUrl);

export const supplierCarsOf = (s: SupplierConfig): ExternalCar[] =>
  (Array.isArray(s.cars) ? s.cars : Array.isArray(s.sampleCars) ? s.sampleCars : []).filter(Boolean);

export const carImageOf = (c: ExternalCar) => firstString(c.imageUrl, c.image, c.carImage, c.photoUrl, c.picture);
export const carNameOf = (c: ExternalCar) => firstString(c.name, c.carName, [c.make, c.model].filter(Boolean).join(' '), c.model, c.category) || 'Car';

export const Rating: React.FC<{ value?: number; count?: number }> = ({ value, count }) =>
  typeof value === 'number' && value > 0 ? (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-slate-800">{value.toFixed(1)}</span>
      {typeof count === 'number' && count > 0 && <span className="text-slate-400">({num(count)})</span>}
    </span>
  ) : null;

export const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />{active ? 'Active' : 'Inactive'}
  </span>
);

export const PickupPill: React.FC<{ override?: { pickupType?: string; key: string } | null }> = ({ override }) => {
  if (!override?.pickupType) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
        <RefreshCw className="h-3.5 w-3.5 text-slate-400" /> Pick-up from provider
      </span>
    );
  }
  const Icon = pickupIconFor(override.pickupType);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
      <Icon className="h-3.5 w-3.5 text-emerald-600" />
      {pickupTypeLabel(override.pickupType) || override.pickupType}
      {override.key.startsWith('*|') && <span className="text-emerald-600">· all locations</span>}
    </span>
  );
};

const Menu: React.FC<{ items: { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void; href?: string }[] }> = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="More actions"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-800">
        <Ellipsis className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full right-0 z-30 mb-2 w-56 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
          {items.map(it => {
            const cls = 'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50';
            const body = <><it.icon className="h-4 w-4 text-slate-400" /><span className="truncate">{it.label}</span></>;
            return it.href
              ? <a key={it.label} role="menuitem" href={it.href} className={cls} onClick={() => setOpen(false)}>{body}</a>
              : <button key={it.label} role="menuitem" type="button" className={cls} onClick={() => { setOpen(false); it.onClick?.(); }}>{body}</button>;
          })}
        </div>
      )}
    </div>
  );
};

export const SupplierCard: React.FC<{
  supplier: SupplierConfig;
  override?: { pickupType?: string; key: string } | null;
  addonsPriced: number;
  addonsAllLocations: boolean;
  onEdit: () => void;
  onAddons: () => void;
  notify: (text: string) => void;
}> = ({ supplier: s, override, addonsPriced, addonsAllLocations, onEdit, onAddons, notify }) => {
  const cars = supplierCarsOf(s).slice(0, 4);
  const currency = s.currency || 'USD';
  const stats: [string, string][] = [
    ['Cars', s.carCount > 0 ? num(s.carCount) : '—'],
    ['Markup', `${s.markupPercentage ?? 0}%`],
    ['Commission', `${s.commissionPercentage ?? 0}%`],
    ['Deposit', s.carDeposit ? `${num(s.carDeposit)} ${currency}` : '—'],
  ];
  const menu = [
    { label: 'Edit pricing & details', icon: Pencil, onClick: onEdit },
    { label: 'Set add-on prices', icon: PackagePlus, onClick: onAddons },
    ...(s.contactEmail ? [{ label: `Email ${s.contactEmail}`, icon: Mail, href: `mailto:${s.contactEmail}` }] : []),
    ...(s.contactPhone ? [{ label: `Call ${s.contactPhone}`, icon: Phone, href: `tel:${s.contactPhone.replace(/\s+/g, '')}` }] : []),
    { label: 'Copy vendor code', icon: Copy, onClick: async () => { if (await copyText(s.vendorCode || '')) notify('Vendor code copied'); } },
  ];

  return (
    <article className={`flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 transition hover:shadow-md sm:p-5 ${s.active ? 'ring-slate-200' : 'ring-slate-200/70'}`}>
      <div className="flex items-start gap-3.5">
        <SupplierLogo src={supplierLogoOf(s)} name={s.supplierName} size="md" className={s.active ? '' : 'opacity-60 grayscale'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900" title={s.supplierName}>{s.supplierName}</h3>
            <StatusPill active={s.active} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {s.vendorCode && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{s.vendorCode}</span>}
            <Rating value={s.rating} count={s.reviewCount} />
            {!s.isConfigured && <span className="text-[11px] font-medium text-amber-700">Not configured yet</span>}
          </div>
        </div>
      </div>

      {cars.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {cars.map((c, i) => <CarImage key={i} src={carImageOf(c)} alt={carNameOf(c)} />)}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100 sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-slate-50 px-3 py-2.5">
            <dt className="text-[11px] text-slate-500">{k}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <PickupPill override={override} />
        <button type="button" onClick={onAddons}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition hover:ring-[#007ac2] ${addonsPriced ? 'bg-sky-50 text-[#005f96] ring-sky-200' : 'bg-white text-slate-600 ring-slate-200'}`}>
          <PackagePlus className="h-3.5 w-3.5" />
          {addonsPriced ? `${addonsPriced} add-on price${addonsPriced === 1 ? '' : 's'}` : 'Default add-on prices'}
          {addonsAllLocations && <span className="opacity-75">· all locations</span>}
        </button>
      </div>

      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
        {s.contactEmail || s.contactPhone ? (
          <>
            {s.contactEmail && <a href={`mailto:${s.contactEmail}`} className="flex min-w-0 items-center gap-2 text-slate-600 hover:text-[#007ac2]"><Mail className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{s.contactEmail}</span></a>}
            {s.contactPhone && <a href={`tel:${s.contactPhone.replace(/\s+/g, '')}`} className="flex min-w-0 items-center gap-2 text-slate-600 hover:text-[#007ac2]"><Phone className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{s.contactPhone}</span></a>}
          </>
        ) : (
          <p className="flex items-center gap-2 text-slate-400"><Mail className="h-4 w-4 shrink-0" />No contact details yet</p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button type="button" onClick={onEdit} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white hover:bg-[#00679f]">
          <Pencil className="h-4 w-4" /> Edit
        </button>
        <button type="button" onClick={onAddons} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">
          <PackagePlus className="h-4 w-4" /> Add-ons
        </button>
        <Menu items={menu} />
      </div>
    </article>
  );
};
