import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import X from 'lucide-react/dist/esm/icons/x';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Users from 'lucide-react/dist/esm/icons/users';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Car from 'lucide-react/dist/esm/icons/car';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Wand from 'lucide-react/dist/esm/icons/wand-2';
import Info from 'lucide-react/dist/esm/icons/info';
import { adminApi } from '../../api';

type State = 'LIVE' | 'SCHEDULED' | 'PAUSED' | 'EXPIRED' | 'USED_UP';

type PromoCode = {
  id: number;
  code: string;
  discount: number;
  discountType: 'PERCENT' | 'FIXED';
  amount?: number | null;
  description?: string | null;
  status: 'active' | 'inactive';
  startDate?: string | null;
  endDate?: string | null;
  minDays?: number | null;
  maxUses?: number | null;
  usedCount?: number | null;
  locationCodes?: string | null;
  state: State;
  bookings?: number;
  discountGiven?: number;
  createdAt?: string;
};

type SupplierPromo = {
  id: number;
  supplierId: number;
  supplierName: string;
  title: string;
  tagline?: string;
  discountPercent: number;
  freeAddons: string[];
  startDate?: string | null;
  endDate?: string | null;
  minDays?: number | null;
  locationCode?: string | null;
  carCount: number;
  active: boolean;
  state: Exclude<State, 'USED_UP'>;
};

const STATE_UI: Record<State, { label: string; cls: string; dot: string }> = {
  LIVE: { label: 'Live', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  PAUSED: { label: 'Paused', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  EXPIRED: { label: 'Expired', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  USED_UP: { label: 'Used up', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
};

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n || 0);
const fmtDay = (d?: string | null) => {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : d;
};
const valueLabel = (p: Pick<PromoCode, 'discountType' | 'discount' | 'amount'>) =>
  p.discountType === 'FIXED' ? usd(Number(p.amount || 0)) : `${Math.round(Number(p.discount || 0) * 100)}%`;
const addonLabel = (a: string) => a.toLowerCase().replace(/_/g, ' ').replace(/\bgps\b/g, 'GPS').replace(/\bwifi\b/g, 'Wi-Fi');
const errorOf = (e: any, fallback: string) => e?.response?.data?.message || fallback;
const shareLink = (code: string) => `${typeof window !== 'undefined' ? window.location.origin : 'https://www.hogicar.com'}/?promo=${encodeURIComponent(code)}`;

const StatePill: React.FC<{ state: State }> = ({ state }) => {
  const ui = STATE_UI[state] || STATE_UI.PAUSED;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ui.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ui.dot} ${state === 'LIVE' ? 'animate-pulse' : ''}`} />{ui.label}
    </span>
  );
};

const Toast: React.FC<{ toast: { text: string; tone: 'ok' | 'err' } | null }> = ({ toast }) =>
  typeof document === 'undefined' ? null : createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} role="status"
          className={`fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-xl ${toast.tone === 'err' ? 'bg-rose-600' : 'bg-slate-900'}`}>
          {toast.tone === 'err' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4 text-emerald-400" />}{toast.text}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

// ---------------------------------------------------------------- coupon card

const CouponVisual: React.FC<{ p: Pick<PromoCode, 'discountType' | 'discount' | 'amount' | 'code' | 'description'>; state?: State; compact?: boolean }> = ({ p, state = 'LIVE', compact }) => {
  const dim = state !== 'LIVE' && state !== 'SCHEDULED';
  return (
    <div className={`relative flex overflow-hidden rounded-2xl text-white shadow-lg ${dim ? 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-900/10' : 'bg-gradient-to-br from-[#0b2545] via-[#0f3460] to-[#007ac2] shadow-[#0b2545]/25'}`}>
      <div className={`flex shrink-0 flex-col items-center justify-center ${compact ? 'w-24 py-4' : 'w-28 py-5'}`}>
        <span className={`font-black leading-none tracking-tight ${compact ? 'text-3xl' : 'text-4xl'}`}>{valueLabel(p)}</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">off</span>
      </div>
      <div className="relative my-3 border-l-2 border-dashed border-white/30">
        <span className="absolute -left-[9px] -top-[22px] h-4 w-4 rounded-full bg-white" />
        <span className="absolute -bottom-[22px] -left-[9px] h-4 w-4 rounded-full bg-white" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Promo code</p>
        <p className="truncate font-mono text-xl font-bold tracking-[0.12em]">{p.code || 'YOURCODE'}</p>
        {!compact && <p className="mt-0.5 truncate text-xs text-white/75">{p.description || 'Hogicar car rental discount'}</p>}
      </div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
};

const PromoCard: React.FC<{
  p: PromoCode;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
  notify: (t: string) => void;
}> = ({ p, onEdit, onToggle, onDelete, busy, notify }) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const used = Number(p.usedCount || 0);
  const pct = p.maxUses ? Math.min(100, Math.round((used / p.maxUses) * 100)) : 0;
  const copy = async (text: string, msg: string) => { try { await navigator.clipboard.writeText(text); notify(msg); } catch { notify('Copy failed'); } };
  const rules = [
    (p.startDate || p.endDate) && { Icon: Calendar, text: p.startDate && p.endDate ? `${fmtDay(p.startDate)} – ${fmtDay(p.endDate)}` : p.endDate ? `Until ${fmtDay(p.endDate)}` : `From ${fmtDay(p.startDate)}` },
    p.minDays && { Icon: Clock, text: `${p.minDays}+ days` },
    p.locationCodes && { Icon: MapPin, text: p.locationCodes.split(',').join(', ') },
  ].filter(Boolean) as { Icon: React.ElementType; text: string }[];

  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
      className="group flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300">
      <CouponVisual p={p} state={p.state} />
      <div className="flex flex-1 flex-col px-2 pb-1 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <StatePill state={p.state} />
          <div className="flex items-center gap-0.5">
            <button onClick={() => copy(p.code, `${p.code} copied`)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Copy code" aria-label={`Copy ${p.code}`}><Copy className="h-4 w-4" /></button>
            <button onClick={() => copy(shareLink(p.code), 'Share link copied')} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Copy share link (applies the code automatically)" aria-label="Copy share link"><Link2 className="h-4 w-4" /></button>
          </div>
        </div>
        {rules.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {rules.map(r => <li key={r.text} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200"><r.Icon className="h-3 w-3 text-slate-400" />{r.text}</li>)}
          </ul>
        ) : <p className="mt-3 text-xs text-slate-500">Any dates, any location, any rental length.</p>}

        <div className="mt-3.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-slate-700">{used} use{used === 1 ? '' : 's'}</span>
            <span className="text-slate-500">{p.maxUses ? `of ${p.maxUses}` : 'No limit'}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div initial={{ width: 0 }} animate={{ width: p.maxUses ? `${pct}%` : used ? '100%' : '0%' }} transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${p.maxUses ? (pct >= 100 ? 'bg-amber-500' : 'bg-[#007ac2]') : 'bg-gradient-to-r from-[#007ac2]/40 to-[#007ac2]'}`} />
          </div>
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2"><dt className="text-[11px] text-slate-500">Bookings</dt><dd className="text-base font-semibold tabular-nums text-slate-900">{p.bookings ?? 0}</dd></div>
          <div className="rounded-xl bg-slate-50 px-3 py-2"><dt className="text-[11px] text-slate-500">Discount given</dt><dd className="text-base font-semibold tabular-nums text-slate-900">{usd(Number(p.discountGiven || 0))}</dd></div>
        </dl>

        <div className="mt-auto pt-3.5">
          <AnimatePresence mode="wait" initial={false}>
            {confirmDelete ? (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl bg-rose-50 p-2 ring-1 ring-rose-200">
                <p className="flex-1 px-1 text-xs font-medium text-rose-800">Delete {p.code}? Past bookings keep it.</p>
                <button onClick={() => setConfirmDelete(false)} className="h-8 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-white">Keep</button>
                <button onClick={onDelete} disabled={busy} className="h-8 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60">Delete</button>
              </motion.div>
            ) : (
              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <button onClick={onEdit} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={onToggle} disabled={busy} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60">
                  {busy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> : p.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {p.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => setConfirmDelete(true)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200" aria-label={`Delete ${p.code}`}><Trash2 className="h-4 w-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
};

// ---------------------------------------------------------------- editor

type Draft = {
  code: string; description: string; discountType: 'PERCENT' | 'FIXED'; percent: string; amount: string;
  startDate: string; endDate: string; minDays: string; maxUses: string; locations: string[]; active: boolean;
};

const emptyDraft = (): Draft => ({ code: '', description: '', discountType: 'PERCENT', percent: '10', amount: '20', startDate: '', endDate: '', minDays: '', maxUses: '', locations: [], active: true });
const draftOf = (p: PromoCode): Draft => ({
  code: p.code, description: p.description || '', discountType: p.discountType || 'PERCENT',
  percent: String(Math.round(Number(p.discount || 0) * 100) || 10), amount: String(p.amount ?? 20),
  startDate: p.startDate || '', endDate: p.endDate || '', minDays: p.minDays ? String(p.minDays) : '', maxUses: p.maxUses ? String(p.maxUses) : '',
  locations: (p.locationCodes || '').split(',').map(s => s.trim()).filter(Boolean), active: p.status === 'active',
});

const TEMPLATES: { label: string; hint: string; draft: Partial<Draft> }[] = [
  { label: 'Welcome 10%', hint: 'New customers', draft: { code: 'WELCOME10', description: '10% off your first rental', discountType: 'PERCENT', percent: '10' } },
  { label: 'Week-long', hint: '7+ days', draft: { code: 'WEEK15', description: '15% off rentals of a week or more', discountType: 'PERCENT', percent: '15', minDays: '7' } },
  { label: '$25 off', hint: 'Limited 100 uses', draft: { code: 'SAVE25', description: '$25 off your rental', discountType: 'FIXED', amount: '25', maxUses: '100' } },
];

const randomCode = () => {
  const words = ['DRIVE', 'ROAD', 'TRIP', 'SUN', 'CITY', 'GO', 'JOURNEY'];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}${Math.floor(10 + Math.random() * 89)}`;
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-800">{label}{hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}</span>
    {children}
  </label>
);
const inputCls = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm';

const PromoEditor: React.FC<{ promo: PromoCode | null; onClose: () => void; onSaved: (p: PromoCode, created: boolean) => void }> = ({ promo, onClose, onSaved }) => {
  const [d, setD] = React.useState<Draft>(() => (promo ? draftOf(promo) : emptyDraft()));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [locInput, setLocInput] = React.useState('');
  const set = (patch: Partial<Draft>) => { setD(x => ({ ...x, ...patch })); setError(null); };

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose, saving]);

  const value = d.discountType === 'PERCENT' ? Number(d.percent) : Number(d.amount);
  const preview = { code: d.code.trim().toUpperCase(), description: d.description, discountType: d.discountType, discount: Number(d.percent) / 100, amount: Number(d.amount) };
  const example = 300;
  const exampleOff = d.discountType === 'PERCENT' ? (example * (Number(d.percent) || 0)) / 100 : Number(d.amount) || 0;

  const addLocation = () => {
    const parts = locInput.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9-]{2,10}$/.test(s));
    if (parts.length) set({ locations: Array.from(new Set([...d.locations, ...parts])) });
    setLocInput('');
  };

  const save = async () => {
    const code = d.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) { setError('Codes are 3–24 letters, numbers, - or _.'); return; }
    if (d.discountType === 'PERCENT' && !(value >= 1 && value <= 90)) { setError('Percentage discounts are between 1% and 90%.'); return; }
    if (d.discountType === 'FIXED' && !(value > 0)) { setError('Enter an amount off greater than 0.'); return; }
    if (d.startDate && d.endDate && d.endDate < d.startDate) { setError('The end date is before the start date.'); return; }
    const payload = {
      code, description: d.description.trim() || null, discountType: d.discountType,
      discount: d.discountType === 'PERCENT' ? Number(d.percent) / 100 : 0,
      amount: d.discountType === 'FIXED' ? Number(d.amount) : null,
      startDate: d.startDate || null, endDate: d.endDate || null,
      minDays: d.minDays ? Number(d.minDays) : null, maxUses: d.maxUses ? Number(d.maxUses) : null,
      locationCodes: d.locations.join(',') || null, status: d.active ? 'active' : 'inactive',
    };
    setSaving(true);
    try {
      const res = promo ? await adminApi.updatePromoCode(promo.id, payload) : await adminApi.createPromoCode(payload);
      onSaved(res.data, !promo);
    } catch (e: any) {
      setError(errorOf(e, 'Could not save the promo code.'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="promo-editor-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && onClose()} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 320 }}
        className="relative flex h-full w-full max-w-[560px] flex-col bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#007ac2]">{promo ? 'Edit promo code' : 'New promo code'}</p>
            <h2 id="promo-editor-title" className="mt-0.5 text-xl font-semibold text-slate-900">{promo ? promo.code : 'Create a discount'}</h2>
          </div>
          <button onClick={onClose} disabled={saving} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <CouponVisual p={preview} />
          <p className="-mt-2 flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            On a {usd(example)} rental this takes off up to {usd(exampleOff)}. Codes are funded from Hogicar’s commission, so the discount never exceeds what the customer pays online.
          </p>

          {!promo && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Start from a template</p>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.label} type="button" onClick={() => set({ ...emptyDraft(), ...t.draft })} className="rounded-xl bg-white p-2.5 text-left ring-1 ring-slate-200 transition hover:ring-[#007ac2]/50">
                    <span className="block text-sm font-semibold text-slate-900">{t.label}</span>
                    <span className="block text-[11px] text-slate-500">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <Field label="Code" hint="What customers type">
              <div className="flex gap-2">
                <input value={d.code} onChange={e => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) })} placeholder="SUMMER15" autoFocus={!promo}
                  className={`${inputCls} font-mono font-semibold uppercase tracking-[0.12em]`} />
                <button type="button" onClick={() => set({ code: randomCode() })} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200" title="Generate a code"><Wand className="h-4 w-4" /> Generate</button>
              </div>
            </Field>
            <Field label="Description" hint="Optional, shown on the card">
              <input value={d.description} onChange={e => set({ description: e.target.value.slice(0, 160) })} placeholder="15% off summer rentals" className={inputCls} />
            </Field>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-800">Discount</p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {(['PERCENT', 'FIXED'] as const).map(t => (
                  <button key={t} type="button" onClick={() => set({ discountType: t })}
                    className={`h-9 rounded-lg text-sm font-semibold transition ${d.discountType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t === 'PERCENT' ? 'Percentage' : 'Fixed amount (USD)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-32">
                {d.discountType === 'FIXED' && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">$</span>}
                <input type="number" inputMode="decimal" min={1} max={d.discountType === 'PERCENT' ? 90 : 10000}
                  value={d.discountType === 'PERCENT' ? d.percent : d.amount}
                  onChange={e => set(d.discountType === 'PERCENT' ? { percent: e.target.value } : { amount: e.target.value })}
                  className={`${inputCls} text-lg font-semibold ${d.discountType === 'FIXED' ? 'pl-7' : 'pr-8'}`} aria-label="Discount value" />
                {d.discountType === 'PERCENT' && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">%</span>}
              </div>
              {(d.discountType === 'PERCENT' ? ['5', '10', '15', '20', '25'] : ['10', '20', '25', '50']).map(v => {
                const on = (d.discountType === 'PERCENT' ? d.percent : d.amount) === v;
                return (
                  <button key={v} type="button" onClick={() => set(d.discountType === 'PERCENT' ? { percent: v } : { amount: v })}
                    className={`h-9 rounded-full px-3 text-sm font-semibold ring-1 transition ${on ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'}`}>
                    {d.discountType === 'PERCENT' ? `${v}%` : `$${v}`}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-800">Rules <span className="font-normal text-slate-400">· all optional</span></p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts"><input type="date" value={d.startDate} onChange={e => set({ startDate: e.target.value })} className={inputCls} /></Field>
              <Field label="Ends"><input type="date" value={d.endDate} min={d.startDate || undefined} onChange={e => set({ endDate: e.target.value })} className={inputCls} /></Field>
              <Field label="Minimum rental" hint="days"><input type="number" min={1} max={60} value={d.minDays} onChange={e => set({ minDays: e.target.value })} placeholder="Any" className={inputCls} /></Field>
              <Field label="Total uses" hint="limit"><input type="number" min={1} value={d.maxUses} onChange={e => set({ maxUses: e.target.value })} placeholder="Unlimited" className={inputCls} /></Field>
            </div>
            <Field label="Pick-up locations" hint="Codes, e.g. DXB, AMM">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 bg-white p-1.5 focus-within:border-[#007ac2] focus-within:ring-4 focus-within:ring-[#007ac2]/15">
                {d.locations.map(l => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-lg bg-[#007ac2]/10 py-1 pl-2 pr-1 font-mono text-xs font-semibold text-[#00649f]">
                    {l}<button type="button" onClick={() => set({ locations: d.locations.filter(x => x !== l) })} className="rounded p-0.5 hover:bg-[#007ac2]/15" aria-label={`Remove ${l}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <input value={locInput} onChange={e => setLocInput(e.target.value)} onBlur={addLocation}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLocation(); } else if (e.key === 'Backspace' && !locInput && d.locations.length) set({ locations: d.locations.slice(0, -1) }); }}
                  placeholder={d.locations.length ? '' : 'Everywhere'} className="h-8 min-w-[90px] flex-1 bg-transparent px-1.5 text-base uppercase outline-none placeholder:normal-case placeholder:text-slate-400 sm:text-sm" />
              </div>
            </Field>
          </section>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <span>
              <span className="block text-sm font-medium text-slate-800">Active</span>
              <span className="block text-xs text-slate-500">Paused codes are rejected at checkout.</span>
            </span>
            <span className="relative">
              <input type="checkbox" className="peer sr-only" checked={d.active} onChange={e => set({ active: e.target.checked })} />
              <span className="block h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
          </label>
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          {error && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="h-11 flex-1 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#007ac2] text-sm font-semibold text-white shadow-sm hover:bg-[#00649f] disabled:opacity-70">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}
              {promo ? 'Save changes' : 'Create promo code'}
            </button>
          </div>
        </footer>
      </motion.aside>
    </div>,
    document.body,
  );
};

// ---------------------------------------------------------------- supplier promotions

const SupplierPromotionsList: React.FC<{ items: SupplierPromo[]; query: string; busyId: number | null; onToggle: (p: SupplierPromo) => void }> = ({ items, query, busyId, onToggle }) => {
  const q = query.trim().toLowerCase();
  const list = items.filter(p => !q || p.title.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q) || (p.locationCode || '').toLowerCase().includes(q));
  if (!list.length) {
    return (
      <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Building2 className="h-7 w-7" /></span>
        <p className="mt-4 text-base font-semibold text-slate-900">{items.length ? 'No supplier promotions match your search' : 'No supplier promotions yet'}</p>
        <p className="mt-1 text-sm text-slate-500">Suppliers create promotions in their dashboard. They show here so you can review or pause them.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
      <ul className="divide-y divide-slate-100">
        {list.map(p => (
          <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white ${p.discountPercent > 0 ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                {p.discountPercent > 0 ? <><span className="text-sm font-black leading-none">{Number(p.discountPercent)}%</span><span className="text-[8px] font-bold uppercase tracking-wider text-white/80">off</span></> : <Gift className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-900">{p.title}</p>
                  <StatePill state={p.state} />
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600"><Building2 className="h-3.5 w-3.5 text-slate-400" />{p.supplierName}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-slate-600">
                  {p.freeAddons.map(a => <span key={a} className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-100">Free {addonLabel(a)}</span>)}
                  {(p.startDate || p.endDate) && <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-200"><Calendar className="h-3 w-3" />{p.startDate ? fmtDay(p.startDate) : 'Now'} – {p.endDate ? fmtDay(p.endDate) : 'open-ended'}</span>}
                  {p.minDays ? <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-200"><Clock className="h-3 w-3" />{p.minDays}+ days</span> : null}
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-200"><MapPin className="h-3 w-3" />{p.locationCode || 'All locations'}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-200"><Car className="h-3 w-3" />{p.carCount ? `${p.carCount} car${p.carCount === 1 ? '' : 's'}` : 'Whole fleet'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => onToggle(p)} disabled={busyId === p.id}
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold ring-1 transition disabled:opacity-60 ${p.active ? 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50' : 'bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700'}`}>
              {busyId === p.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : p.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {p.active ? 'Pause' : 'Resume'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------- main

const FILTERS: { key: 'ALL' | State; label: string }[] = [
  { key: 'ALL', label: 'All' }, { key: 'LIVE', label: 'Live' }, { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'PAUSED', label: 'Paused' }, { key: 'EXPIRED', label: 'Expired' }, { key: 'USED_UP', label: 'Used up' },
];

const PromotionsAdmin: React.FC = () => {
  const [tab, setTab] = React.useState<'codes' | 'suppliers'>('codes');
  const [codes, setCodes] = React.useState<PromoCode[]>([]);
  const [supplierPromos, setSupplierPromos] = React.useState<SupplierPromo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'ALL' | State>('ALL');
  const [editing, setEditing] = React.useState<PromoCode | 'new' | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const toastTimer = React.useRef<number>();

  const notify = React.useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true); setLoadError(null);
    const [c, s] = await Promise.allSettled([adminApi.getPromoCodes(), adminApi.getSupplierPromotions()]);
    if (c.status === 'fulfilled') setCodes(Array.isArray(c.value.data) ? c.value.data : []);
    if (s.status === 'fulfilled') setSupplierPromos(Array.isArray(s.value.data) ? s.value.data : []);
    if (c.status === 'rejected' && s.status === 'rejected') setLoadError(errorOf(c.reason, 'Could not load promotions.'));
    setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const toggleCode = async (p: PromoCode) => {
    setBusyId(p.id);
    try {
      const res = await adminApi.setPromoCodeStatus(p.id, p.status === 'active' ? 'inactive' : 'active');
      setCodes(list => list.map(x => (x.id === p.id ? { ...x, ...res.data } : x)));
      notify(p.status === 'active' ? `${p.code} paused` : `${p.code} is active again`);
    } catch (e) { notify(errorOf(e, 'Could not update the code.'), 'err'); }
    finally { setBusyId(null); }
  };

  const deleteCode = async (p: PromoCode) => {
    setBusyId(p.id);
    try { await adminApi.deletePromoCode(p.id); setCodes(list => list.filter(x => x.id !== p.id)); notify(`${p.code} deleted`); }
    catch (e) { notify(errorOf(e, 'Could not delete the code.'), 'err'); }
    finally { setBusyId(null); }
  };

  const toggleSupplier = async (p: SupplierPromo) => {
    setBusyId(p.id);
    try {
      const res = await adminApi.setSupplierPromotionActive(p.id, !p.active);
      setSupplierPromos(list => list.map(x => (x.id === p.id ? { ...x, ...res.data } : x)));
      notify(p.active ? `“${p.title}” paused` : `“${p.title}” is live again`);
    } catch (e) { notify(errorOf(e, 'Could not update the promotion.'), 'err'); }
    finally { setBusyId(null); }
  };

  const onSaved = (p: PromoCode, created: boolean) => {
    setCodes(list => (created ? [p, ...list] : list.map(x => (x.id === p.id ? { ...x, ...p } : x))));
    setEditing(null);
    notify(created ? `${p.code} created` : `${p.code} saved`);
  };

  const stats = React.useMemo(() => ({
    live: codes.filter(c => c.state === 'LIVE').length,
    bookings: codes.reduce((n, c) => n + Number(c.bookings || 0), 0),
    given: codes.reduce((n, c) => n + Number(c.discountGiven || 0), 0),
    supplierLive: supplierPromos.filter(p => p.state === 'LIVE').length,
  }), [codes, supplierPromos]);

  const counts = React.useMemo(() => {
    const m: Record<string, number> = { ALL: codes.length };
    codes.forEach(c => { m[c.state] = (m[c.state] || 0) + 1; });
    return m;
  }, [codes]);

  const q = query.trim().toLowerCase();
  const visible = codes.filter(c => (filter === 'ALL' || c.state === filter) && (!q || c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b2545] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#007ac2]/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100 ring-1 ring-inset ring-white/15"><Sparkles className="h-3 w-3" /> Commercial</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Discounts that bring bookings</h2>
            <p className="mt-1 hidden max-w-xl text-sm text-sky-100/80 sm:block">Create promo codes customers enter at checkout, share them as links, and keep an eye on every supplier promotion running on Hogicar.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/15" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
            <button onClick={() => { setTab('codes'); setEditing('new'); }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b2545] shadow-lg hover:bg-sky-50"><Plus className="h-4 w-4" /> New promo code</button>
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            { label: 'Live promo codes', value: String(stats.live), Icon: Ticket },
            { label: 'Bookings with a code', value: String(stats.bookings), Icon: Users },
            { label: 'Discount given', value: usd(stats.given), Icon: Tag },
            { label: 'Supplier promotions live', value: String(stats.supplierLive), Icon: Building2 },
          ].map(k => (
            <div key={k.label} className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
              <dt className="flex items-center gap-1.5 text-xs text-sky-100/80"><k.Icon className="h-3.5 w-3.5" />{k.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{loading ? <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-white/15 align-middle" /> : k.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200" role="tablist">
          {([['codes', 'Promo codes', codes.length], ['suppliers', 'Supplier promotions', supplierPromos.length]] as const).map(([key, label, n]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`relative inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === key ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              {tab === key && <motion.span layoutId="promo-tab" className="absolute inset-0 rounded-xl bg-slate-900" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />}
              <span className="relative">{label}</span>
              <span className={`relative rounded-full px-1.5 text-[11px] ${tab === key ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={tab === 'codes' ? 'Search codes' : 'Search supplier, title or location'}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base shadow-sm outline-none focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm" />
        </label>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{loadError}</span>
          <button onClick={load} className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-rose-200">Try again</button>
        </div>
      )}

      {tab === 'codes' ? (
        <>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition ${filter === f.key ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'}`}>
                {f.label}<span className={filter === f.key ? 'text-white/80' : 'text-slate-400'}>{counts[f.key] || 0}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-[340px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />)}</div>
          ) : visible.length ? (
            <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visible.map(p => (
                  <PromoCard key={p.id} p={p} busy={busyId === p.id} notify={t => notify(t)}
                    onEdit={() => setEditing(p)} onToggle={() => toggleCode(p)} onDelete={() => deleteCode(p)} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Ticket className="h-7 w-7" /></span>
              <p className="mt-4 text-base font-semibold text-slate-900">{codes.length ? 'No codes match these filters' : 'Create your first promo code'}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{codes.length ? 'Try another filter or search.' : 'Codes work on the car page and at checkout. Share one as a link and it applies itself.'}</p>
              {!codes.length && <button onClick={() => setEditing('new')} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f]"><Plus className="h-4 w-4" /> New promo code</button>}
            </div>
          )}
        </>
      ) : loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />
      ) : (
        <SupplierPromotionsList items={supplierPromos} query={query} busyId={busyId} onToggle={toggleSupplier} />
      )}

      <AnimatePresence>
        {editing && <PromoEditor key="editor" promo={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

export default PromotionsAdmin;
