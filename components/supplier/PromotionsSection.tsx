import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import Search from 'lucide-react/dist/esm/icons/search';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Info from 'lucide-react/dist/esm/icons/info';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import { supplierApi } from '../../api';
import AddonIcon from '../AddonIcon';
import PromotionWrap, { PromotionSticker } from '../PromotionWrap';
import { ADDON_DEFINITIONS } from '../../utils/addons';
import { PROMOTION_THEMES, PromotionTheme, addonName, lowerName } from '../../utils/promotions';
import { SupplierPromotionInfo } from '../../types';

// ---------- Types & helpers ----------

export interface SupplierPromotion {
  id?: number;
  title: string;
  tagline?: string | null;
  discountPercent?: number | null;
  freeAddons?: string | null;
  theme?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  minDays?: number | null;
  locationCode?: string | null;
  carIds?: string | null;
  active: boolean;
  createdAt?: string;
}

type OfferType = 'discount' | 'addons' | 'both';
type Status = 'live' | 'scheduled' | 'paused' | 'ended';

interface Draft {
  id?: number;
  offer: OfferType;
  title: string;
  tagline: string;
  discount: string;
  addons: string[];
  theme: PromotionTheme;
  alwaysOn: boolean;
  startDate: string;
  endDate: string;
  minDays: string;
  locationCode: string;
  allCars: boolean;
  carIds: string[];
  active: boolean;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const csv = (v?: string | null) => (v || '').split(',').map(s => s.trim()).filter(Boolean);

const statusOf = (p: SupplierPromotion): Status => {
  const today = todayIso();
  if (p.endDate && p.endDate < today) return 'ended';
  if (!p.active) return 'paused';
  if (p.startDate && p.startDate > today) return 'scheduled';
  return 'live';
};

const STATUS_STYLE: Record<Status, { label: string; cls: string; dot: string }> = {
  live: { label: 'Live', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  scheduled: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  paused: { label: 'Paused', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  ended: { label: 'Ended', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const emptyDraft = (): Draft => ({
  offer: 'discount', title: '', tagline: '', discount: '10', addons: [], theme: 'rose',
  alwaysOn: false, startDate: todayIso(), endDate: plusDays(30), minDays: '', locationCode: '',
  allCars: true, carIds: [], active: true,
});

const draftFrom = (p: SupplierPromotion): Draft => {
  const addons = csv(p.freeAddons);
  const discount = p.discountPercent ? String(Number(p.discountPercent)) : '';
  return {
    id: p.id,
    offer: discount && addons.length ? 'both' : addons.length ? 'addons' : 'discount',
    title: p.title || '',
    tagline: p.tagline || '',
    discount: discount || '10',
    addons,
    theme: (PROMOTION_THEMES.find(t => t.id === p.theme)?.id || 'rose'),
    alwaysOn: !p.startDate && !p.endDate,
    startDate: p.startDate || todayIso(),
    endDate: p.endDate || plusDays(30),
    minDays: p.minDays ? String(p.minDays) : '',
    locationCode: p.locationCode || '',
    allCars: !csv(p.carIds).length,
    carIds: csv(p.carIds),
    active: p.active,
  };
};

const payloadFrom = (d: Draft): SupplierPromotion => ({
  title: d.title.trim(),
  tagline: d.tagline.trim() || null,
  discountPercent: d.offer === 'addons' ? null : Number(d.discount) || null,
  freeAddons: d.offer === 'discount' ? null : d.addons.join(','),
  theme: d.theme,
  startDate: d.alwaysOn ? null : d.startDate || null,
  endDate: d.alwaysOn ? null : d.endDate || null,
  minDays: Number(d.minDays) > 1 ? Number(d.minDays) : null,
  locationCode: d.locationCode || null,
  carIds: d.allCars ? null : d.carIds.join(','),
  active: d.active,
});

/** Shape the car card uses, built from a draft or a saved promotion. */
const toInfo = (p: SupplierPromotion): SupplierPromotionInfo => ({
  id: p.id,
  title: p.title || 'Your promotion',
  tagline: p.tagline,
  discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
  freeAddons: csv(p.freeAddons),
  theme: p.theme,
  endDate: p.endDate,
  minDays: p.minDays,
});

const carLabel = (c: any) => (c?.name || [c?.make, c?.model].filter(Boolean).join(' ') || 'Car').replace(/\s+or similar\s*$/i, '');
const carImage = (c: any) => c?.imageUrl || c?.image || '';

const TEMPLATES: { title: string; tagline: string; offer: OfferType; discount?: string; addons?: string[]; minDays?: string; theme: PromotionTheme; icon: any; blurb: string }[] = [
  { title: 'Early bird deal', tagline: 'Book ahead and save on every day of your trip', offer: 'discount', discount: '10', theme: 'sky', icon: Percent, blurb: '10% off for the next 30 days' },
  { title: 'Free additional driver', tagline: 'Share the driving at no extra cost', offer: 'addons', addons: ['ADDITIONAL_DRIVER'], theme: 'emerald', icon: Users, blurb: 'A favourite with families and couples' },
  { title: 'Long rental special', tagline: 'Stay longer, pay less', offer: 'both', discount: '15', addons: ['GPS'], minDays: '7', theme: 'violet', icon: Sparkles, blurb: '15% off + free GPS for 7+ days' },
];

// ---------- Preview ----------

const PreviewCard: React.FC<{ promo: SupplierPromotionInfo; car?: any; currency?: string; narrow?: boolean }> = ({ promo, car, currency = 'USD', narrow }) => {
  const base = 150;
  const d = promo.discountPercent || 0;
  const now = d > 0 ? base * (1 - d / 100) : base;
  const img = carImage(car);
  return (
    <PromotionWrap promo={promo} savingsText={d > 0 ? `You save ${currency} ${(base - now).toFixed(2)}` : null}>
      <div className={`grid grid-cols-[110px_minmax(0,1fr)] gap-3 p-3 ${narrow ? '' : 'sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:p-4'}`}>
        <div className="relative flex h-20 items-center justify-center rounded-lg bg-slate-50">
          {img ? <img src={img} alt="" className="max-h-16 w-full object-contain" /> : <CarIcon className="h-8 w-8 text-slate-300" />}
          <PromotionSticker promo={promo} className="absolute left-1 top-1" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{car ? carLabel(car) : 'Toyota Corolla'}</p>
          <p className="text-xs text-slate-500">or similar · {car?.category ? String(car.category).toLowerCase().replace(/_/g, ' ') : 'compact'}</p>
          <p className="mt-1.5 flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {car?.passengers || 5}</span>
            <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {car?.bags || 2}</span>
          </p>
          {(promo.freeAddons || []).length > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><Gift className="h-3.5 w-3.5" /> {(promo.freeAddons || []).map(c => `Free ${lowerName(addonName(c))}`).join(' · ')}</p>
          )}
        </div>
        <div className={`col-span-2 flex items-end justify-between border-t border-slate-100 pt-2 ${narrow ? '' : 'sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right'}`}>
          <p className="text-[11px] text-slate-500">3 days, example</p>
          <div>
            {d > 0 && <p className="text-xs text-slate-400 line-through">{currency} {base.toFixed(2)}</p>}
            <p className="text-lg font-bold leading-tight text-slate-900">{currency} {now.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </PromotionWrap>
  );
};

// ---------- Editor ----------

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-slate-700">{label}</span>
    <span className="mt-1.5 block">{children}</span>
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

const inputCls = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20';

const Step: React.FC<{ n: number; title: string; subtitle?: string; children: React.ReactNode }> = ({ n, title, subtitle, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{n}</span>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const PromotionEditor: React.FC<{
  initial: Draft;
  cars: any[];
  locations: { code: string; name: string }[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, cars, locations, currency, onClose, onSaved }) => {
  const [d, setD] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carQuery, setCarQuery] = useState('');
  const set = (patch: Partial<Draft>) => setD(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const needsDiscount = d.offer !== 'addons';
  const needsAddons = d.offer !== 'discount';
  const discountNum = Number(d.discount);
  const previewCar = useMemo(() => {
    if (!d.allCars && d.carIds.length) return cars.find(c => String(c.id) === d.carIds[0]);
    return cars.find(c => carImage(c)) || cars[0];
  }, [cars, d.allCars, d.carIds]);
  const filteredCars = useMemo(() => {
    const q = carQuery.trim().toLowerCase();
    return cars.filter(c => !q || carLabel(c).toLowerCase().includes(q) || String(c.category || '').toLowerCase().includes(q));
  }, [cars, carQuery]);

  const validate = (): string | null => {
    if (!d.title.trim()) return 'Give the promotion a name customers will see.';
    if (needsDiscount && (!(discountNum >= 1) || discountNum > 90)) return 'The discount must be between 1% and 90%.';
    if (needsAddons && !d.addons.length) return 'Choose at least one free add-on.';
    if (!d.alwaysOn && d.startDate && d.endDate && d.endDate < d.startDate) return 'The end date must be on or after the start date.';
    if (!d.allCars && !d.carIds.length) return 'Choose at least one car, or apply it to the whole fleet.';
    return null;
  };

  const save = async (active: boolean) => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setSaving(true);
    setError(null);
    try {
      const body = payloadFrom({ ...d, active });
      if (d.id) await supplierApi.updatePromotion(d.id, body);
      else await supplierApi.createPromotion(body);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'The promotion could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const previewInfo = toInfo(payloadFrom(d));

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="promo-editor-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 28 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-sm"><Megaphone className="h-5 w-5" /></span>
            <div>
              <h3 id="promo-editor-title" className="text-base font-semibold text-slate-900 sm:text-lg">{d.id ? 'Edit promotion' : 'New promotion'}</h3>
              <p className="text-xs text-slate-500">Customers see it as a coloured frame around your car in search results.</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
          {/* Form */}
          <div className="space-y-4 p-4 sm:p-6 lg:overflow-y-auto">
            <Step n={1} title="What are you offering?" subtitle="Pick a discount, free add-ons, or both together.">
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  { id: 'discount', title: 'Discount', text: 'A percentage off the rental price', icon: Percent },
                  { id: 'addons', title: 'Free add-ons', text: 'Extras included at no cost', icon: Gift },
                  { id: 'both', title: 'Discount + add-ons', text: 'Your strongest offer', icon: Sparkles },
                ] as const).map(o => {
                  const on = d.offer === o.id;
                  return (
                    <button key={o.id} type="button" onClick={() => set({ offer: o.id })} aria-pressed={on}
                      className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${on ? 'border-accent bg-accent-50/60 ring-1 ring-accent' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600'}`}><o.icon className="h-[18px] w-[18px]" /></span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">{o.title}</span>
                        <span className="block text-xs text-slate-500">{o.text}</span>
                      </span>
                      {on && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-accent" />}
                    </button>
                  );
                })}
              </div>

              {needsDiscount && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-32">
                      <Field label="Discount">
                        <span className="flex h-10 items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                          <input type="number" min={1} max={90} step={1} value={d.discount} onChange={e => set({ discount: e.target.value })} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none" aria-label="Discount percent" />
                          <span className="flex h-full items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">%</span>
                        </span>
                      </Field>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pb-0.5">
                      {[5, 10, 15, 20, 25, 30].map(v => (
                        <button key={v} type="button" onClick={() => set({ discount: String(v) })}
                          className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${discountNum === v ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300'}`}>{v}%</button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>Applied to your rate before the Hogicar commission. Example: a {currency} 100 rental becomes {currency} {(100 * (1 - (Math.min(90, Math.max(0, discountNum || 0))) / 100)).toFixed(2)} and you receive that amount at the desk.</span>
                  </p>
                </div>
              )}

              {needsAddons && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">Free add-ons <span className="font-normal text-slate-500">(one of each per booking)</span></p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ADDON_DEFINITIONS.map(a => {
                      const on = d.addons.includes(a.code);
                      return (
                        <button key={a.code} type="button" aria-pressed={on}
                          onClick={() => set({ addons: on ? d.addons.filter(x => x !== a.code) : [...d.addons, a.code] })}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${on ? 'border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <AddonIcon code={a.code} size="sm" active={on} />
                          <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{a.name}</span>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Step>

            <Step n={2} title="Name and message" subtitle="Shown on the ribbon above your car.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Promotion name" hint={`${d.title.length}/40 characters`}>
                  <input className={inputCls} maxLength={40} placeholder="e.g. Summer Sale" value={d.title} onChange={e => set({ title: e.target.value })} />
                </Field>
                <Field label="Short message (optional)" hint="One line under the name on the car page.">
                  <input className={inputCls} maxLength={90} placeholder="e.g. Book now, offer ends soon" value={d.tagline} onChange={e => set({ tagline: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Summer Sale', 'Winter Deal', 'Weekend Special', 'Early Bird', 'Ramadan Offer', 'Limited Time'].map(t => (
                  <button key={t} type="button" onClick={() => set({ title: t })} className="h-7 rounded-full bg-slate-100 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200">{t}</button>
                ))}
              </div>
            </Step>

            <Step n={3} title="When and how long" subtitle="Based on the customer's pick-up date.">
              <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-slate-800">Always on</span>
                  <span className="block text-xs text-slate-500">Runs until you pause or delete it.</span>
                </span>
                <button type="button" role="switch" aria-checked={d.alwaysOn} onClick={() => set({ alwaysOn: !d.alwaysOn })}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${d.alwaysOn ? 'bg-accent' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.alwaysOn ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Pick-ups from">
                  <input type="date" className={inputCls} value={d.startDate} disabled={d.alwaysOn} onChange={e => set({ startDate: e.target.value })} />
                </Field>
                <Field label="Pick-ups until">
                  <input type="date" className={inputCls} value={d.endDate} min={d.startDate} disabled={d.alwaysOn} onChange={e => set({ endDate: e.target.value })} />
                </Field>
                <Field label="Minimum rental" hint="Leave empty for any length.">
                  <span className="flex h-10 items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                    <input type="number" min={1} max={60} placeholder="Any" value={d.minDays} onChange={e => set({ minDays: e.target.value })} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
                    <span className="flex h-full items-center border-l border-slate-200 bg-slate-50 px-3 text-xs text-slate-500">days</span>
                  </span>
                </Field>
              </div>
            </Step>

            <Step n={4} title="Where and which cars">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location">
                  <select className={inputCls} value={d.locationCode} onChange={e => set({ locationCode: e.target.value })}>
                    <option value="">All my locations</option>
                    {locations.map(l => <option key={l.code} value={l.code}>{l.name && l.name !== l.code ? `${l.name} (${l.code})` : l.code}</option>)}
                  </select>
                </Field>
                <div>
                  <span className="block text-sm font-medium text-slate-700">Cars</span>
                  <div className="mt-1.5 grid h-10 grid-cols-2 rounded-lg bg-slate-100 p-1">
                    {[{ v: true, l: 'Whole fleet' }, { v: false, l: 'Choose cars' }].map(o => (
                      <button key={o.l} type="button" onClick={() => set({ allCars: o.v })}
                        className={`rounded-md text-sm font-medium transition-all ${d.allCars === o.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
              </div>
              {!d.allCars && (
                <div className="mt-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input value={carQuery} onChange={e => setCarQuery(e.target.value)} placeholder="Search cars" className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" />
                    <span className="text-xs font-medium text-slate-500">{d.carIds.length} selected</span>
                  </div>
                  <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto">
                    {filteredCars.map(c => {
                      const id = String(c.id);
                      const on = d.carIds.includes(id);
                      return (
                        <li key={id}>
                          <button type="button" onClick={() => set({ carIds: on ? d.carIds.filter(x => x !== id) : [...d.carIds, id] })}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 ${on ? 'bg-accent-50/40' : ''}`}>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-accent bg-accent text-white' : 'border-slate-300'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                            <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded bg-slate-50">
                              {carImage(c) ? <img src={carImage(c)} alt="" className="max-h-8 max-w-full object-contain" /> : <CarIcon className="h-4 w-4 text-slate-300" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-900">{carLabel(c)}</span>
                              <span className="block text-xs text-slate-500">{[c.category, c.locationCode].filter(Boolean).join(' · ')}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {!filteredCars.length && <li className="px-3 py-6 text-center text-sm text-slate-500">No cars match.</li>}
                  </ul>
                </div>
              )}
            </Step>

            <Step n={5} title="Frame colour" subtitle="The frame and ribbon customers see around your car.">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {PROMOTION_THEMES.map(t => {
                  const on = d.theme === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => set({ theme: t.id })} aria-pressed={on} aria-label={t.label}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${on ? 'bg-white ring-2 ring-slate-900' : 'hover:bg-white'}`}>
                      <span className={`relative h-10 w-full rounded-lg ${t.swatch} shadow-sm`}>
                        {on && <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </Step>
          </div>

          {/* Live preview */}
          <aside className="border-t border-slate-200 bg-white p-4 sm:p-6 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live preview</p>
            <p className="mt-1 text-sm text-slate-600">How your car appears in search results.</p>
            <div className="mt-4"><PreviewCard promo={previewInfo} car={previewCar} currency={currency} narrow /></div>
            <dl className="mt-5 space-y-2.5 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Offer</dt><dd className="text-right font-medium text-slate-900">{[needsDiscount && discountNum > 0 ? `${discountNum}% off` : null, ...(needsAddons ? d.addons.map(c => `Free ${lowerName(addonName(c))}`) : [])].filter(Boolean).join(', ') || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Pick-ups</dt><dd className="text-right font-medium text-slate-900">{d.alwaysOn ? 'Always on' : `${fmtDate(d.startDate)} – ${fmtDate(d.endDate)}`}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Rental length</dt><dd className="text-right font-medium text-slate-900">{Number(d.minDays) > 1 ? `${d.minDays}+ days` : 'Any'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Location</dt><dd className="text-right font-medium text-slate-900">{d.locationCode || 'All locations'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Cars</dt><dd className="text-right font-medium text-slate-900">{d.allCars ? `Whole fleet (${cars.length})` : `${d.carIds.length} selected`}</dd></div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> When several promotions match a rental, customers get the one with the biggest discount.</p>
          </aside>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-[20px] text-sm">
            {error && <p className="font-medium text-rose-600" role="alert">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
            <button type="button" disabled={saving} onClick={() => save(false)} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50">Save as paused</button>
            <button type="button" disabled={saving} onClick={() => save(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-50">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {d.id ? 'Save and publish' : 'Publish promotion'}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

// ---------- Section ----------

const PromotionsSection: React.FC<{ supplier: any; cars: any[] }> = ({ supplier, cars }) => {
  const [list, setList] = useState<SupplierPromotion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const currency = supplier?.currency || 'USD';
  const locations = useMemo(() => {
    const raw = (supplier?.locations || []) as any[];
    const out = raw.map(l => ({ code: String(l?.value ?? l?.locationCode ?? '').toUpperCase(), name: String(l?.label ?? l?.displayName ?? '') }))
      .filter(l => l.code && l.code !== 'ALL');
    const seen = new Set<string>();
    return out.filter(l => (seen.has(l.code) ? false : (seen.add(l.code), true)));
  }, [supplier]);

  const load = async () => {
    try {
      const res = await supplierApi.getPromotions();
      setList(Array.isArray(res.data) ? res.data : []);
      setLoadError(null);
    } catch (err: any) {
      setList([]);
      setLoadError(err?.response?.data?.message || 'Promotions could not be loaded. Please refresh the page.');
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const counts = useMemo(() => {
    const c = { all: 0, live: 0, scheduled: 0, paused: 0, ended: 0 } as Record<'all' | Status, number>;
    (list || []).forEach(p => { c.all++; c[statusOf(p)]++; });
    return c;
  }, [list]);
  const carsOnOffer = useMemo(() => {
    const live = (list || []).filter(p => statusOf(p) === 'live');
    if (live.some(p => !csv(p.carIds).length)) return cars.length;
    return new Set(live.flatMap(p => csv(p.carIds))).size;
  }, [list, cars.length]);
  const shown = (list || []).filter(p => filter === 'all' || statusOf(p) === filter);

  const toggle = async (p: SupplierPromotion) => {
    if (!p.id) return;
    setBusyId(p.id);
    try {
      await supplierApi.setPromotionActive(p.id, !p.active);
      setToast(p.active ? `“${p.title}” paused` : `“${p.title}” is live again`);
      await load();
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'Could not update the promotion.');
    } finally { setBusyId(null); }
  };
  const remove = async (p: SupplierPromotion) => {
    if (!p.id || !window.confirm(`Delete “${p.title}”? Customers will no longer see it.`)) return;
    setBusyId(p.id);
    try {
      await supplierApi.deletePromotion(p.id);
      setToast(`“${p.title}” deleted`);
      await load();
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'Could not delete the promotion.');
    } finally { setBusyId(null); }
  };
  const duplicate = (p: SupplierPromotion) => setEditing({ ...draftFrom(p), id: undefined, title: `${p.title} (copy)`.slice(0, 40), active: false });
  const fromTemplate = (t: typeof TEMPLATES[number]) => setEditing({
    ...emptyDraft(), title: t.title, tagline: t.tagline, offer: t.offer, discount: t.discount || '10',
    addons: t.addons || [], minDays: t.minDays || '', theme: t.theme,
  });

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#00507f] p-5 text-white shadow-sm sm:p-6">
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rose-500/25 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/15"><Megaphone className="h-3.5 w-3.5" /> Promotions</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">Stand out in search results</h2>
            <p className="mt-1.5 text-sm text-white/70">Run discounts or include free add-ons. Your cars get a coloured frame and ribbon so customers notice the deal first.</p>
            <button type="button" onClick={() => setEditing(emptyDraft())} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100">
              <Plus className="h-4 w-4" /> New promotion
            </button>
          </div>
          <div className="w-full max-w-md lg:w-[420px]">
            <PreviewCard promo={{ title: 'Summer Sale', discountPercent: 15, freeAddons: ['ADDITIONAL_DRIVER'], theme: 'rose' }} car={cars.find(c => carImage(c))} currency={currency} narrow />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Live now', value: counts.live, icon: Sparkles, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Scheduled', value: counts.scheduled, icon: Calendar, tone: 'bg-sky-50 text-sky-600' },
          { label: 'Paused', value: counts.paused, icon: Pause, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Cars on offer', value: `${carsOnOffer}/${cars.length}`, icon: CarIcon, tone: 'bg-violet-50 text-violet-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 sm:text-sm">{s.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}><s.icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{list ? s.value : '—'}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {(['all', 'live', 'scheduled', 'paused', 'ended'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {f === 'all' ? 'All' : STATUS_STYLE[f].label}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setEditing(emptyDraft())} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-700">
          <Plus className="h-4 w-4" /> New promotion
        </button>
      </div>

      {loadError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{loadError}</p>}

      {/* List */}
      {list === null ? (
        <div className="grid gap-4 xl:grid-cols-2">{[0, 1].map(i => <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      ) : shown.length ? (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map(p => {
            const st = statusOf(p);
            const style = STATUS_STYLE[st];
            const carIds = csv(p.carIds);
            const firstCar = carIds.length ? cars.find(c => String(c.id) === carIds[0]) : cars.find(c => carImage(c));
            return (
              <li key={p.id} className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${st === 'ended' ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">{p.title}</h3>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${st === 'live' ? 'animate-pulse' : ''}`} /> {style.label}
                      </span>
                    </div>
                    {p.tagline && <p className="mt-0.5 truncate text-sm text-slate-500">{p.tagline}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {st !== 'ended' && (
                      <button type="button" disabled={busyId === p.id} onClick={() => toggle(p)} title={p.active ? 'Pause' : 'Resume'} aria-label={p.active ? `Pause ${p.title}` : `Resume ${p.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40">
                        {p.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    )}
                    <button type="button" onClick={() => setEditing(draftFrom(p))} title="Edit" aria-label={`Edit ${p.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => duplicate(p)} title="Duplicate" aria-label={`Duplicate ${p.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Copy className="h-4 w-4" /></button>
                    <button type="button" disabled={busyId === p.id} onClick={() => remove(p)} title="Delete" aria-label={`Delete ${p.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="px-4 py-4 sm:px-5"><PreviewCard promo={toInfo(p)} car={firstCar} currency={currency} /></div>

                <dl className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl border-t border-slate-100 bg-slate-100 text-sm sm:grid-cols-4">
                  {[
                    { icon: Calendar, label: 'Pick-ups', value: !p.startDate && !p.endDate ? 'Always on' : `${p.startDate ? fmtDate(p.startDate) : 'Now'} – ${p.endDate ? fmtDate(p.endDate) : 'open'}` },
                    { icon: Tag, label: 'Rental length', value: p.minDays ? `${p.minDays}+ days` : 'Any' },
                    { icon: MapPin, label: 'Location', value: p.locationCode || 'All' },
                    { icon: CarIcon, label: 'Cars', value: carIds.length ? `${carIds.length} car${carIds.length === 1 ? '' : 's'}` : 'Whole fleet' },
                  ].map(x => (
                    <div key={x.label} className="bg-white px-4 py-3">
                      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500"><x.icon className="h-3.5 w-3.5" /> {x.label}</dt>
                      <dd className="mt-0.5 truncate font-medium text-slate-900">{x.value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      ) : (list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-8">
          <div className="mx-auto max-w-lg text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-sm"><Megaphone className="h-6 w-6" /></span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Create your first promotion</h3>
            <p className="mt-1 text-sm text-slate-500">Start from a ready-made idea or build your own. You can pause or change it at any time.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {TEMPLATES.map(t => (
              <button key={t.title} type="button" onClick={() => fromTemplate(t)} className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${PROMOTION_THEMES.find(x => x.id === t.theme)?.swatch}`}><t.icon className="h-[18px] w-[18px]" /></span>
                <span className="mt-3 text-sm font-semibold text-slate-900">{t.title}</span>
                <span className="mt-0.5 text-xs text-slate-500">{t.blurb}</span>
                <span className="mt-3 text-xs font-semibold text-accent group-hover:underline">Use this idea →</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No {filter === 'all' ? '' : STATUS_STYLE[filter as Status].label.toLowerCase()} promotions.</p>
      ))}

      <AnimatePresence>
        {editing && (
          <PromotionEditor
            key="editor"
            initial={editing}
            cars={cars}
            locations={locations}
            currency={currency}
            onClose={() => setEditing(null)}
            onSaved={() => { setToast(editing.id ? 'Promotion saved' : 'Promotion created'); setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg lg:bottom-6" role="status">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromotionsSection;
