import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Users from 'lucide-react/dist/esm/icons/users';
import MousePointer from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Banknote from 'lucide-react/dist/esm/icons/banknote';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Info from 'lucide-react/dist/esm/icons/info';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { adminApi } from '../../api';
import {
  usd, num, errorOf, ago, fmtDate, inputCls, Field, useToast, Toast, CopyButton, Drawer, Hero, heroButton, heroPrimary,
  Segmented, ErrorBanner, Spinner,
} from './commercialUi';

type Status = 'pending' | 'active' | 'paused' | 'rejected';

type Affiliate = {
  id: number;
  name: string;
  email: string;
  website?: string | null;
  status: Status;
  commissionRate: number;
  totalEarnings: number;
  clicks: number;
  conversions: number;
  joinDate?: string | null;
  code?: string | null;
  trackingUrl?: string | null;
  company?: string | null;
  country?: string | null;
  phone?: string | null;
  audience?: string | null;
  notes?: string | null;
  payoutMethod?: string | null;
  payoutDetails?: string | null;
  cookieDays?: number | null;
  lastClickAt?: string | null;
  lastBookingAt?: string | null;
  hasPassword?: boolean;
  clicks30d: number;
  bookings30d: number;
  revenue: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidOut: number;
  balance: number;
  cancelled: number;
};

type Point = { date: string; clicks: number; bookings: number; revenue: number; commission: number };
type Overview = { series: Point[]; trackingBase?: string; defaultRate?: number; defaultCookieDays?: number };

type BookingRow = { id?: number; ref: string; createdAt?: string; pickupDate?: string; dropoffDate?: string; pickup?: string; car?: string; customer?: string; currency: string; value: number; commission: number; state: 'pending' | 'approved' | 'cancelled' | 'unpaid' };
type Payout = { id: number; amount: number; method?: string; reference?: string; note?: string; paidOn?: string };

const STATUS_UI: Record<Status, { label: string; cls: string; dot: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  pending: { label: 'Awaiting review', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  paused: { label: 'Paused', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
};

const BOOKING_UI: Record<BookingRow['state'], { label: string; cls: string }> = {
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: 'Pending', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  unpaid: { label: 'Not paid', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
};

const PAYOUT_METHODS = ['Bank transfer', 'PayPal', 'Wise', 'Payoneer', 'Other'];

const pct = (rate: number | null | undefined) => `${+(Number(rate || 0) * 100).toFixed(2)}%`;

const StatusPill: React.FC<{ status: Status }> = ({ status }) => {
  const ui = STATUS_UI[status] || STATUS_UI.paused;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ui.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />{ui.label}
    </span>
  );
};

const AVATAR_COLORS = ['from-sky-500 to-blue-700', 'from-emerald-500 to-teal-700', 'from-violet-500 to-indigo-700', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-700', 'from-cyan-500 to-sky-700'];
const Avatar: React.FC<{ name: string; size?: 'sm' | 'lg' }> = ({ name, size = 'sm' }) => {
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const color = AVATAR_COLORS[[...(name || '')].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-semibold text-white ${color} ${size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'}`}>{initials}</span>
  );
};

const host = (url?: string | null) => {
  if (!url) return null;
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, ''); } catch { return url; }
};

// ---------------------------------------------------------------- performance chart

const RANGES = [7, 30, 90] as const;

const PerformanceCard: React.FC<{ overview: Overview | null; days: number; onDays: (d: number) => void; loading: boolean }> = ({ overview, days, onDays, loading }) => {
  const series = overview?.series || [];
  const totals = series.reduce((t, p) => ({ clicks: t.clicks + p.clicks, bookings: t.bookings + p.bookings, revenue: t.revenue + Number(p.revenue || 0), commission: t.commission + Number(p.commission || 0) }), { clicks: 0, bookings: 0, revenue: 0, commission: 0 });
  const conv = totals.clicks ? (totals.bookings / totals.clicks) * 100 : 0;
  const data = series.map(p => ({ ...p, label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }));
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Programme performance</h3>
          <p className="text-sm text-slate-500">Clicks on tracking links and the bookings they turned into.</p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {RANGES.map(r => (
            <button key={r} onClick={() => onDays(r)} className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${days === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{r} days</button>
          ))}
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Clicks', value: num(totals.clicks), dot: 'bg-sky-500' },
          { label: 'Bookings', value: num(totals.bookings), dot: 'bg-emerald-500' },
          { label: 'Conversion', value: `${conv.toFixed(conv && conv < 10 ? 1 : 0)}%` },
          { label: 'Commission earned', value: usd(totals.commission), sub: `on ${usd(totals.revenue)} of bookings` },
        ].map(k => (
          <div key={k.label} className="rounded-2xl bg-slate-50 p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{k.dot && <span className={`h-2 w-2 rounded-full ${k.dot}`} />}{k.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">{loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200 align-middle" /> : k.value}</dd>
            {k.sub && !loading && <p className="truncate text-[11px] text-slate-400">{k.sub}</p>}
          </div>
        ))}
      </dl>
      <div className="mt-5 h-56 w-full min-w-0">
        {loading ? <div className="h-full animate-pulse rounded-2xl bg-slate-100" /> : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <AreaChart data={data} margin={{ left: -18, right: 4, top: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="affClicks" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                <linearGradient id="affBookings" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#0ea5e9" strokeWidth={2} fill="url(#affClicks)" />
              <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#10b981" strokeWidth={2} fill="url(#affBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- pending applications

const Applications: React.FC<{ items: Affiliate[]; busyId: number | null; onDecide: (a: Affiliate, status: Status) => void; onOpen: (a: Affiliate) => void }> = ({ items, busyId, onDecide, onOpen }) => (
  <section className="rounded-3xl bg-amber-50/70 p-4 ring-1 ring-amber-200 sm:p-5">
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Inbox className="h-4 w-4" /></span>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{items.length === 1 ? '1 application to review' : `${items.length} applications to review`}</h3>
        <p className="text-xs text-slate-600">Approve to give them a working tracking link and portal access.</p>
      </div>
    </div>
    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map(a => (
        <div key={a.id} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-100">
          <button onClick={() => onOpen(a)} className="flex items-start gap-3 text-left">
            <Avatar name={a.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-900">{a.name}</span>
              <span className="block truncate text-xs text-slate-500">{a.email}</span>
              {a.website && <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#007ac2]"><Globe className="h-3 w-3" />{host(a.website)}</span>}
            </span>
            <span className="shrink-0 text-[11px] text-slate-400">{fmtDate(a.joinDate)}</span>
          </button>
          {a.audience && <p className="mt-2 line-clamp-2 text-xs text-slate-600">“{a.audience}”</p>}
          <div className="mt-3 flex gap-2">
            <button disabled={busyId === a.id} onClick={() => onDecide(a, 'rejected')} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"><X className="h-4 w-4" /> Decline</button>
            <button disabled={busyId === a.id} onClick={() => onDecide(a, 'active')} className="inline-flex h-9 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">{busyId === a.id ? <Spinner light /> : <Check className="h-4 w-4" />} Approve</button>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ---------------------------------------------------------------- list

const AffiliateRow: React.FC<{ a: Affiliate; onOpen: () => void; notify: (t: string) => void }> = ({ a, onOpen, notify }) => (
  <tr onClick={onOpen} className="group cursor-pointer border-t border-slate-100 transition hover:bg-sky-50/40">
    <td className="py-3.5 pl-5 pr-3">
      <div className="flex items-center gap-3">
        <Avatar name={a.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{a.name}</p>
          <p className="truncate text-xs text-slate-500">{a.website ? host(a.website) : a.email}</p>
        </div>
      </div>
    </td>
    <td className="px-3"><StatusPill status={a.status} /></td>
    <td className="px-3">
      {a.code && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 py-1 pl-2 pr-1 font-mono text-xs text-slate-700">
          {a.code}
          {a.trackingUrl && <CopyButton text={a.trackingUrl} className="h-6 w-6 text-slate-400 hover:bg-white hover:text-slate-700" onCopied={() => notify('Tracking link copied')} />}
        </span>
      )}
    </td>
    <td className="px-3 text-right tabular-nums text-slate-700">{pct(a.commissionRate)}</td>
    <td className="px-3 text-right tabular-nums text-slate-700">{num(a.clicks30d)}</td>
    <td className="px-3 text-right tabular-nums text-slate-700">{num(a.conversions)}</td>
    <td className="px-3 text-right tabular-nums text-slate-700">{usd(a.revenue)}</td>
    <td className="px-3 text-right tabular-nums">
      <span className="font-semibold text-slate-900">{usd(a.totalEarnings)}</span>
      {a.pendingEarnings > 0 && <span className="block text-[11px] text-slate-400">{usd(a.pendingEarnings)} pending</span>}
    </td>
    <td className="px-3 text-right tabular-nums">
      <span className={`font-semibold ${a.balance > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{usd(a.balance)}</span>
    </td>
    <td className="pr-4 text-right"><ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" /></td>
  </tr>
);

const AffiliateCard: React.FC<{ a: Affiliate; onOpen: () => void }> = ({ a, onOpen }) => (
  <button onClick={onOpen} className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 active:bg-slate-50">
    <div className="flex items-start gap-3">
      <Avatar name={a.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-slate-900">{a.name}</p>
          <StatusPill status={a.status} />
        </div>
        <p className="truncate text-xs text-slate-500">{a.website ? host(a.website) : a.email}</p>
      </div>
    </div>
    <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
      {[['Rate', pct(a.commissionRate)], ['Clicks', num(a.clicks30d)], ['Bookings', num(a.conversions)], ['To pay', usd(a.balance)]].map(([k, v]) => (
        <div key={k}><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{v}</dd></div>
      ))}
    </dl>
  </button>
);

// ---------------------------------------------------------------- editor / detail

type Draft = {
  name: string; email: string; company: string; website: string; country: string; phone: string;
  ratePct: string; cookieDays: string; code: string; payoutMethod: string; payoutDetails: string; notes: string; audience: string;
  password: string; status: Status;
};

const draftOf = (a: Affiliate | null, defaults?: Overview | null): Draft => ({
  name: a?.name || '', email: a?.email || '', company: a?.company || '', website: a?.website || '', country: a?.country || '', phone: a?.phone || '',
  ratePct: String(+((a?.commissionRate ?? defaults?.defaultRate ?? 0.05) * 100).toFixed(2)),
  cookieDays: String(a?.cookieDays ?? defaults?.defaultCookieDays ?? 30),
  code: a?.code || '', payoutMethod: a?.payoutMethod || '', payoutDetails: a?.payoutDetails || '', notes: a?.notes || '', audience: a?.audience || '',
  password: '', status: a?.status || 'active',
});

const ProfileForm: React.FC<{ d: Draft; set: (p: Partial<Draft>) => void; isNew: boolean; hasPassword?: boolean; example: number }> = ({ d, set, isNew, hasPassword, example }) => (
  <div className="space-y-5">
    <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Partner</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Travel Bloggers" autoFocus={isNew} /></Field>
        <Field label="Company"><input className={inputCls} value={d.company} onChange={e => set({ company: e.target.value })} placeholder="Optional" /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={d.email} onChange={e => set({ email: e.target.value })} placeholder="partner@example.com" /></Field>
        <Field label="Phone"><input className={inputCls} value={d.phone} onChange={e => set({ phone: e.target.value })} placeholder="Optional" /></Field>
        <Field label="Website"><input className={inputCls} value={d.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></Field>
        <Field label="Country"><input className={inputCls} value={d.country} onChange={e => set({ country: e.target.value })} placeholder="Optional" /></Field>
      </div>
      <Field label="Audience" hint="Where their traffic comes from. Shown on applications."><textarea className={`${inputCls} h-20 py-2.5`} value={d.audience} onChange={e => set({ audience: e.target.value })} /></Field>
    </div>

    <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Commission & tracking</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Commission" hint={`They earn ${usd((example * (Number(d.ratePct) || 0)) / 100, 2)} on a ${usd(example)} booking.`}>
          <div className="relative"><input inputMode="decimal" className={`${inputCls} pr-9`} value={d.ratePct} onChange={e => set({ ratePct: e.target.value.replace(/[^0-9.]/g, '') })} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span></div>
        </Field>
        <Field label="Attribution window" hint="How long after a click a booking still counts.">
          <div className="relative"><input inputMode="numeric" className={`${inputCls} pr-14`} value={d.cookieDays} onChange={e => set({ cookieDays: e.target.value.replace(/\D/g, '') })} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">days</span></div>
        </Field>
      </div>
      <Field label="Tracking code" hint={isNew ? 'Leave empty and we’ll create one from the name.' : 'Changing it stops old links from tracking.'}>
        <input className={`${inputCls} font-mono uppercase`} value={d.code} onChange={e => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} placeholder="e.g. TRAVELBLOG" maxLength={30} />
      </Field>
    </div>

    <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Payouts</p>
      <div className="flex flex-wrap gap-1.5">
        {PAYOUT_METHODS.map(m => (
          <button key={m} type="button" onClick={() => set({ payoutMethod: d.payoutMethod === m ? '' : m })}
            className={`h-8 rounded-full px-3 text-xs font-semibold ring-1 transition ${d.payoutMethod === m ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'}`}>{m}</button>
        ))}
      </div>
      <Field label="Payment details" hint="IBAN, PayPal email… Only admins see this."><textarea className={`${inputCls} h-20 py-2.5`} value={d.payoutDetails} onChange={e => set({ payoutDetails: e.target.value })} /></Field>
    </div>

    <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Access & notes</p>
      <Field label={hasPassword ? 'New portal password' : 'Portal password'} hint={hasPassword ? 'Leave empty to keep the current password.' : 'Lets them sign in at /affiliate-program to see their stats. At least 8 characters.'}>
        <div className="relative"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" autoComplete="new-password" className={`${inputCls} pl-10`} value={d.password} onChange={e => set({ password: e.target.value })} placeholder={hasPassword ? '••••••••' : 'Optional'} /></div>
      </Field>
      <Field label="Internal notes" hint="Never shown to the affiliate."><textarea className={`${inputCls} h-20 py-2.5`} value={d.notes} onChange={e => set({ notes: e.target.value })} /></Field>
    </div>
  </div>
);

const toPayload = (d: Draft) => ({
  name: d.name.trim(), email: d.email.trim(), company: d.company, website: d.website, country: d.country, phone: d.phone,
  commissionRate: Number(d.ratePct) / 100, cookieDays: d.cookieDays ? Number(d.cookieDays) : null,
  code: d.code.trim() || null, payoutMethod: d.payoutMethod, payoutDetails: d.payoutDetails, notes: d.notes, audience: d.audience,
  password: d.password.trim() || null, status: d.status,
});

const validate = (d: Draft): string | null => {
  if (!d.name.trim()) return 'Enter the affiliate’s name.';
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return 'Enter a valid email address.';
  const rate = Number(d.ratePct);
  if (!(rate >= 0 && rate <= 30)) return 'Commission must be between 0% and 30%.';
  const days = Number(d.cookieDays);
  if (!(days >= 1 && days <= 365)) return 'Attribution window must be 1 to 365 days.';
  if (d.code && !/^[A-Z0-9_-]{3,30}$/.test(d.code)) return 'Tracking code: 3–30 letters, numbers, - or _.';
  if (d.password && d.password.trim().length < 8) return 'The portal password needs at least 8 characters.';
  return null;
};

const CreateDrawer: React.FC<{ overview: Overview | null; onClose: () => void; onSaved: (a: Affiliate) => void }> = ({ overview, onClose, onSaved }) => {
  const [d, setD] = React.useState<Draft>(() => draftOf(null, overview));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<Draft>) => { setD(x => ({ ...x, ...p })); setError(null); };
  const save = async () => {
    const v = validate(d);
    if (v) { setError(v); return; }
    setSaving(true);
    try { onSaved((await adminApi.createAffiliate(toPayload(d))).data); }
    catch (e) { setError(errorOf(e, 'Could not add the affiliate.')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer eyebrow="New affiliate" title="Add a partner" onClose={onClose} busy={saving}
      footer={<DrawerFooter error={error} saving={saving} onCancel={onClose} onSave={save} label="Add affiliate" />}>
      <ProfileForm d={d} set={set} isNew example={300} />
    </Drawer>
  );
};

const DrawerFooter: React.FC<{ error: string | null; saving: boolean; onCancel: () => void; onSave: () => void; label: string }> = ({ error, saving, onCancel, onSave, label }) => (
  <>
    {error && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><Info className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
    <div className="flex gap-2">
      <button type="button" onClick={onCancel} disabled={saving} className="h-11 flex-1 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Cancel</button>
      <button type="button" onClick={onSave} disabled={saving} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#007ac2] text-sm font-semibold text-white shadow-sm hover:bg-[#00649f] disabled:opacity-70">
        {saving ? <Spinner light /> : <Check className="h-4 w-4" />}{label}
      </button>
    </div>
  </>
);

type DetailTab = 'overview' | 'bookings' | 'payouts' | 'settings';

const DetailDrawer: React.FC<{
  a: Affiliate; overview: Overview | null; onClose: () => void; onChanged: (a: Affiliate) => void; onDeleted: (id: number) => void; notify: (t: string, tone?: 'ok' | 'err') => void;
}> = ({ a, overview, onClose, onChanged, onDeleted, notify }) => {
  const [tab, setTab] = React.useState<DetailTab>('overview');
  const [d, setD] = React.useState<Draft>(() => draftOf(a));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bookings, setBookings] = React.useState<BookingRow[] | null>(null);
  const [payouts, setPayouts] = React.useState<Payout[] | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [statusBusy, setStatusBusy] = React.useState(false);
  const set = (p: Partial<Draft>) => { setD(x => ({ ...x, ...p })); setError(null); };

  React.useEffect(() => { setD(draftOf(a)); }, [a]);
  React.useEffect(() => {
    if (tab === 'bookings' && bookings === null) adminApi.getAffiliateBookings(a.id).then(r => setBookings(r.data || [])).catch(() => setBookings([]));
    if (tab === 'payouts' && payouts === null) adminApi.getAffiliatePayouts(a.id).then(r => setPayouts(r.data || [])).catch(() => setPayouts([]));
  }, [tab, a.id, bookings, payouts]);

  const refresh = async () => {
    const res = await adminApi.getAffiliates();
    const fresh = (res.data as Affiliate[]).find(x => x.id === a.id);
    if (fresh) onChanged(fresh);
  };

  const save = async () => {
    const v = validate(d);
    if (v) { setError(v); return; }
    setSaving(true);
    try {
      const res = await adminApi.updateAffiliate(a.id, toPayload(d));
      onChanged({ ...a, ...res.data });
      set({ password: '' });
      notify(`${a.name} saved`);
    } catch (e) { setError(errorOf(e, 'Could not save changes.')); }
    finally { setSaving(false); }
  };

  const setStatus = async (status: Status) => {
    setStatusBusy(true);
    try {
      const res = await adminApi.setAffiliateStatus(a.id, status);
      onChanged({ ...a, ...res.data });
      notify(status === 'active' ? `${a.name} is active` : status === 'paused' ? `${a.name} paused` : `${a.name} ${STATUS_UI[status].label.toLowerCase()}`);
    } catch (e) { notify(errorOf(e, 'Could not update the status.'), 'err'); }
    finally { setStatusBusy(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await adminApi.deleteAffiliate(a.id); onDeleted(a.id); notify(`${a.name} removed`); }
    catch (e) { notify(errorOf(e, 'Could not remove the affiliate.'), 'err'); setSaving(false); }
  };

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'bookings', label: 'Bookings', count: a.conversions + a.cancelled },
    { key: 'payouts', label: 'Payouts' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <Drawer eyebrow="Affiliate" title={a.name} onClose={onClose} busy={saving} width="max-w-[680px]"
      headerExtra={
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`relative h-10 shrink-0 px-3 text-sm font-semibold transition ${tab === t.key ? 'text-[#007ac2]' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}{t.count ? <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-500">{t.count}</span> : null}
              {tab === t.key && <motion.span layoutId="aff-detail-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#007ac2]" />}
            </button>
          ))}
        </div>
      }
      footer={tab === 'settings' ? <DrawerFooter error={error} saving={saving} onCancel={() => setD(draftOf(a))} onSave={save} label="Save changes" /> : undefined}>
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <Avatar name={a.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><StatusPill status={a.status} />{a.company && <span className="text-xs text-slate-500">{a.company}</span>}</div>
              <a href={`mailto:${a.email}`} className="mt-1.5 flex items-center gap-1.5 truncate text-sm text-slate-700 hover:text-[#007ac2]"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />{a.email}</a>
              {a.website && <a href={a.website.startsWith('http') ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-700 hover:text-[#007ac2]"><Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />{host(a.website)}<ExternalLink className="h-3 w-3 text-slate-400" /></a>}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3.5 w-3.5 text-slate-400" />Joined {fmtDate(a.joinDate)} · last click {ago(a.lastClickAt).toLowerCase()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {a.status === 'pending' && <>
              <button disabled={statusBusy} onClick={() => setStatus('active')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"><Check className="h-4 w-4" /> Approve</button>
              <button disabled={statusBusy} onClick={() => setStatus('rejected')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><X className="h-4 w-4" /> Decline</button>
            </>}
            {a.status === 'active' && <button disabled={statusBusy} onClick={() => setStatus('paused')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Pause className="h-4 w-4" /> Pause tracking</button>}
            {(a.status === 'paused' || a.status === 'rejected') && <button disabled={statusBusy} onClick={() => setStatus('active')} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"><Play className="h-4 w-4" /> Activate</button>}
            <a href={`mailto:${a.email}`} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Mail className="h-4 w-4" /> Email</a>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Clicks · 30 days', value: num(a.clicks30d), sub: `${num(a.clicks)} all time` },
              { label: 'Bookings', value: num(a.conversions), sub: `${num(a.bookings30d)} in 30 days` },
              { label: 'Conversion', value: a.clicks ? `${((a.conversions / a.clicks) * 100).toFixed(1)}%` : '—', sub: 'bookings per click' },
              { label: 'Booking value', value: usd(a.revenue), sub: `${pct(a.commissionRate)} commission` },
              { label: 'Pending', value: usd(a.pendingEarnings), sub: 'rentals not finished yet' },
              { label: 'Ready to pay', value: usd(a.balance), sub: `${usd(a.paidOut)} paid so far`, strong: true },
            ].map(k => (
              <div key={k.label} className={`rounded-2xl p-3.5 ring-1 ${k.strong ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'}`}>
                <dt className="text-xs font-medium text-slate-500">{k.label}</dt>
                <dd className={`mt-0.5 text-xl font-semibold tabular-nums ${k.strong ? 'text-emerald-800' : 'text-slate-900'}`}>{k.value}</dd>
                <p className="truncate text-[11px] text-slate-400">{k.sub}</p>
              </div>
            ))}
          </dl>

          <LinkBuilder a={a} notify={notify} />

          {a.status === 'active' && a.balance > 0 && (
            <button onClick={() => setTab('payouts')} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#0b2545] p-4 text-left text-white">
              <span className="flex items-center gap-3"><Banknote className="h-5 w-5 text-emerald-300" /><span><span className="block text-sm font-semibold">{usd(a.balance)} ready to pay</span><span className="block text-xs text-sky-100/70">Record the payment once you’ve sent it.</span></span></span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {tab === 'bookings' && (
        bookings === null ? <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div> :
        bookings.length === 0 ? (
          <Empty icon={ShoppingBag} title="No bookings yet" text="Bookings made after someone clicks this affiliate’s link appear here." />
        ) : (
          <ul className="space-y-2">
            {bookings.map(b => (
              <li key={b.ref} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-slate-200">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold text-slate-900">{b.ref}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${BOOKING_UI[b.state].cls}`}>{BOOKING_UI[b.state].label}</span></div>
                  <p className="truncate text-xs text-slate-500">{[b.customer, b.car, b.pickup].filter(Boolean).join(' · ')}</p>
                  <p className="text-[11px] text-slate-400">{fmtDate(b.pickupDate)} → {fmtDate(b.dropoffDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900">{usd(b.commission, 2)}</p>
                  <p className="text-[11px] tabular-nums text-slate-400">of {usd(b.value, 2)}</p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'payouts' && (
        <PayoutsPanel a={a} payouts={payouts} onAdded={async p => { setPayouts(list => [p, ...(list || [])]); await refresh(); notify(`${usd(p.amount, 2)} payout recorded`); }}
          onDeleted={async id => { await adminApi.deleteAffiliatePayout(a.id, id); setPayouts(list => (list || []).filter(x => x.id !== id)); await refresh(); notify('Payout removed'); }} />
      )}

      {tab === 'settings' && (
        <div className="space-y-5">
          <ProfileForm d={d} set={set} isNew={false} hasPassword={a.hasPassword} example={300} />
          <div className="rounded-2xl bg-white p-4 ring-1 ring-rose-200">
            <p className="text-sm font-semibold text-slate-900">Remove affiliate</p>
            <p className="mt-0.5 text-xs text-slate-500">Deletes the partner, their click history and payout records. Bookings stay, but stop counting for them.</p>
            {confirmDelete ? (
              <div className="mt-3 flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="h-10 flex-1 rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Keep</button>
                <button onClick={remove} disabled={saving} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700"><Trash2 className="h-4 w-4" /> Remove for good</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Remove affiliate</button>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

const LinkBuilder: React.FC<{ a: Affiliate; notify: (t: string) => void }> = ({ a, notify }) => {
  const [path, setPath] = React.useState('');
  if (!a.trackingUrl || !a.code) return null;
  const base = a.trackingUrl.replace(/\/\?ref=.*$/, '');
  let link = a.trackingUrl;
  const p = path.trim();
  if (p) {
    try {
      const u = new URL(p.startsWith('http') ? p : `${base}${p.startsWith('/') ? '' : '/'}${p}`);
      u.searchParams.set('ref', a.code);
      link = u.toString();
    } catch { /* keep the plain link */ }
  }
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Link2 className="h-4 w-4 text-[#007ac2]" /> Tracking link</p>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 p-1.5 pl-3 ring-1 ring-slate-200">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700">{link}</span>
        <CopyButton text={link} label="Copy" className="h-9 shrink-0 bg-[#007ac2] px-3 text-white hover:bg-[#00649f]" onCopied={() => notify('Link copied')} />
      </div>
      <Field label="Link to a specific page" hint="Paste any Hogicar page and the tracking code is added for you." className="mt-3">
        <input className={inputCls} value={path} onChange={e => setPath(e.target.value)} placeholder="/car-rental/dubai or a full hogicar.com link" />
      </Field>
      <p className="mt-2 text-xs text-slate-500">Bookings within {a.cookieDays || 30} days of a click earn {pct(a.commissionRate)} of the booking value.</p>
    </div>
  );
};

const PayoutsPanel: React.FC<{ a: Affiliate; payouts: Payout[] | null; onAdded: (p: Payout) => Promise<void>; onDeleted: (id: number) => Promise<void> }> = ({ a, payouts, onAdded, onDeleted }) => {
  const [amount, setAmount] = React.useState(a.balance > 0 ? a.balance.toFixed(2) : '');
  const [method, setMethod] = React.useState(a.payoutMethod || 'Bank transfer');
  const [reference, setReference] = React.useState('');
  const [paidOn, setPaidOn] = React.useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const add = async () => {
    if (!(Number(amount) > 0)) { setError('Enter the amount paid.'); return; }
    setBusy(true); setError(null);
    try {
      const res = await adminApi.addAffiliatePayout(a.id, { amount: Number(amount), method, reference, paidOn });
      await onAdded(res.data);
      setAmount(''); setReference('');
    } catch (e) { setError(errorOf(e, 'Could not record the payout.')); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-3">
        {[['Approved', usd(a.approvedEarnings, 2)], ['Paid', usd(a.paidOut, 2)], ['Balance', usd(a.balance, 2)]].map(([k, v], i) => (
          <div key={k} className={`rounded-2xl p-3.5 ring-1 ${i === 2 ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'}`}>
            <dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="mt-px h-3.5 w-3.5 shrink-0" />Commission is approved once the rental has finished. {usd(a.pendingEarnings, 2)} is still pending.</p>
      {a.payoutDetails && <div className="rounded-2xl bg-white p-3.5 text-sm ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{a.payoutMethod || 'Pay to'}</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{a.payoutDetails}</p></div>}

      <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-900">Record a payout</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount (USD)"><input inputMode="decimal" className={inputCls} value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></Field>
          <Field label="Paid on"><input type="date" className={inputCls} value={paidOn} onChange={e => setPaidOn(e.target.value)} /></Field>
          <Field label="Method"><select className={inputCls} value={method} onChange={e => setMethod(e.target.value)}>{PAYOUT_METHODS.map(m => <option key={m}>{m}</option>)}</select></Field>
        </div>
        <Field label="Reference"><input className={inputCls} value={reference} onChange={e => setReference(e.target.value)} placeholder="Transfer ID or invoice number" /></Field>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <button onClick={add} disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#007ac2] text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-70">{busy ? <Spinner light /> : <Banknote className="h-4 w-4" />} Record payout</button>
      </div>

      {payouts === null ? <div className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /> : payouts.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {payouts.map(p => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tabular-nums text-slate-900">{usd(p.amount, 2)}</p>
                <p className="truncate text-xs text-slate-500">{[fmtDate(p.paidOn), p.method, p.reference].filter(Boolean).join(' · ')}</p>
              </div>
              <button onClick={() => onDeleted(p.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove payout"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Empty: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; text: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Icon className="h-7 w-7" /></span>
    <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>
    {action}
  </div>
);

// ---------------------------------------------------------------- page

type Filter = 'all' | Status;

const AffiliatesAdmin: React.FC = () => {
  const [items, setItems] = React.useState<Affiliate[]>([]);
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [days, setDays] = React.useState(30);
  const [loading, setLoading] = React.useState(true);
  const [chartLoading, setChartLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [query, setQuery] = React.useState('');
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true); setLoadError(null);
    try { setItems((await adminApi.getAffiliates()).data || []); }
    catch (e) { setLoadError(errorOf(e, 'Could not load affiliates.')); }
    finally { setLoading(false); }
  }, []);

  const loadChart = React.useCallback(async (d: number) => {
    setChartLoading(true);
    try { setOverview((await adminApi.getAffiliateOverview(d)).data); } catch { /* chart is optional */ }
    finally { setChartLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { loadChart(days); }, [days, loadChart]);

  const replace = (a: Affiliate) => setItems(list => list.map(x => (x.id === a.id ? { ...x, ...a } : x)));

  const decide = async (a: Affiliate, status: Status) => {
    setBusyId(a.id);
    try {
      const res = await adminApi.setAffiliateStatus(a.id, status);
      replace(res.data);
      notify(status === 'active' ? `${a.name} approved` : `${a.name} declined`);
    } catch (e) { notify(errorOf(e, 'Could not update the application.'), 'err'); }
    finally { setBusyId(null); }
  };

  const pending = items.filter(a => a.status === 'pending');
  const active = items.filter(a => a.status === 'active');
  const stats = {
    active: active.length,
    clicks: items.reduce((n, a) => n + Number(a.clicks30d || 0), 0),
    bookings: items.reduce((n, a) => n + Number(a.conversions || 0), 0),
    revenue: items.reduce((n, a) => n + Number(a.revenue || 0), 0),
    owed: items.reduce((n, a) => n + Math.max(0, Number(a.balance || 0)), 0),
    pending: items.reduce((n, a) => n + Number(a.pendingEarnings || 0), 0),
  };
  const counts: Record<Filter, number> = { all: items.length, active: active.length, pending: pending.length, paused: 0, rejected: 0 };
  items.forEach(a => { if (a.status === 'paused' || a.status === 'rejected') counts[a.status]++; });

  const q = query.trim().toLowerCase();
  const visible = items.filter(a => (filter === 'all' || a.status === filter)
    && (!q || [a.name, a.email, a.code, a.website, a.company].some(v => (v || '').toLowerCase().includes(q))));
  const open = items.find(a => a.id === openId) || null;

  return (
    <div className="space-y-5">
      <Hero eyebrow="Commercial" eyebrowIcon={Handshake} title="Affiliate partners"
        subtitle="Bloggers, travel sites and creators who send you customers. Every click on their link is tracked and bookings earn them commission."
        loading={loading}
        actions={<>
          <button onClick={() => { load(); loadChart(days); }} className={heroButton} aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
          <button onClick={() => setCreating(true)} className={heroPrimary}><Plus className="h-4 w-4" /> Add affiliate</button>
        </>}
        kpis={[
          { label: 'Active affiliates', value: num(stats.active), Icon: Users, note: pending.length ? `${pending.length} waiting for review` : undefined },
          { label: 'Clicks · 30 days', value: num(stats.clicks), Icon: MousePointer },
          { label: 'Bookings', value: num(stats.bookings), Icon: ShoppingBag, note: `${usd(stats.revenue)} booking value` },
          { label: 'Ready to pay', value: usd(stats.owed), Icon: Wallet, note: `${usd(stats.pending)} still pending` },
        ]} />

      {loadError && <ErrorBanner text={loadError} onRetry={load} />}

      {!loading && pending.length > 0 && <Applications items={pending} busyId={busyId} onDecide={decide} onOpen={a => setOpenId(a.id)} />}

      <PerformanceCard overview={overview} days={days} onDays={setDays} loading={chartLoading} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented layoutId="aff-filter" value={filter} onChange={setFilter} items={[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'active', label: 'Active', count: counts.active },
          { key: 'pending', label: 'Applications', count: counts.pending, dot: counts.pending > 0 },
          { key: 'paused', label: 'Paused', count: counts.paused },
          { key: 'rejected', label: 'Declined', count: counts.rejected },
        ]} />
        <label className="relative block w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email, code or website"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base shadow-sm outline-none focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm" />
        </label>
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : visible.length === 0 ? (
        <Empty icon={Handshake} title={items.length ? 'No affiliates match' : 'No affiliates yet'}
          text={items.length ? 'Try another filter or search.' : 'Applications from hogicar.com/affiliate-program appear here. You can also add a partner yourself.'}
          action={!items.length ? <button onClick={() => setCreating(true)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f]"><Plus className="h-4 w-4" /> Add affiliate</button> : undefined} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="py-3 pl-5 pr-3 font-semibold">Affiliate</th>
                  <th className="px-3 font-semibold">Status</th>
                  <th className="px-3 font-semibold">Code</th>
                  <th className="px-3 text-right font-semibold">Rate</th>
                  <th className="px-3 text-right font-semibold">Clicks 30d</th>
                  <th className="px-3 text-right font-semibold">Bookings</th>
                  <th className="px-3 text-right font-semibold">Booking value</th>
                  <th className="px-3 text-right font-semibold">Earned</th>
                  <th className="px-3 text-right font-semibold">To pay</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>{visible.map(a => <AffiliateRow key={a.id} a={a} onOpen={() => setOpenId(a.id)} notify={t => notify(t)} />)}</tbody>
            </table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">{visible.map(a => <AffiliateCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />)}</div>
        </>
      )}

      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#007ac2]" />
        <p>Partners apply at <a className="font-semibold text-[#007ac2] hover:underline" href="/affiliate-program" target="_blank" rel="noreferrer">/affiliate-program</a> and sign in there to see their own clicks, bookings and payouts. Commission is calculated on the booking total and approved once the rental ends; cancelled bookings never earn.</p>
      </div>

      <AnimatePresence>
        {creating && <CreateDrawer key="create" overview={overview} onClose={() => setCreating(false)} onSaved={a => { setItems(list => [a, ...list]); setCreating(false); setOpenId(a.id); notify(`${a.name} added`); }} />}
        {open && <DetailDrawer key={`d-${open.id}`} a={open} overview={overview} onClose={() => setOpenId(null)} onChanged={replace} notify={notify}
          onDeleted={id => { setItems(list => list.filter(x => x.id !== id)); setOpenId(null); }} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

export default AffiliatesAdmin;
