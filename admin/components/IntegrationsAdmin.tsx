import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plug from 'lucide-react/dist/esm/icons/plug';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Activity from 'lucide-react/dist/esm/icons/activity';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Check from 'lucide-react/dist/esm/icons/check';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Terminal from 'lucide-react/dist/esm/icons/terminal';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Webhook from 'lucide-react/dist/esm/icons/webhook';
import Info from 'lucide-react/dist/esm/icons/info';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import WalletIcon from 'lucide-react/dist/esm/icons/wallet';
import Car from 'lucide-react/dist/esm/icons/car';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Database from 'lucide-react/dist/esm/icons/database';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import { adminApi } from '../../api';
import { API_BASE_URL } from '../../lib/config';
import {
  usd, num, errorOf, ago, fmtDate, inputCls, Field, useToast, Toast, CopyButton, Drawer, Hero, heroButton, heroPrimary,
  Segmented, ErrorBanner, Spinner, Toggle,
} from './commercialUi';

type Partner = {
  id: number;
  name: string;
  apiKey?: string | null;
  status: 'active' | 'inactive';
  createdAt?: string;
  keyPreview?: string | null;
  keyCreatedAt?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  notes?: string | null;
  scopes: string[];
  rateLimitPerMinute: number;
  allowedIps?: string | null;
  webhookUrl?: string | null;
  requestCount: number;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  requests24h: number;
  errors24h: number;
  requests30d: number;
  errors30d: number;
  bookings: number;
  cancelledBookings: number;
  bookingValue: number;
};

type Service = { key: string; name: string; category: string; purpose: string; state: 'connected' | 'attention' | 'missing' | 'idle'; detail: string; settings?: string | null };
type LogRow = { id: number; partnerId?: number; method: string; path: string; status: number; durationMs?: number; ip?: string; error?: string; createdAt: string };
type Usage = { series: { date: string; requests: number; errors: number }[]; avgLatencyMs: number };

const SERVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  stripe: CreditCard, email: Mail, expo: Smartphone, 'apple-wallet': WalletIcon, 'google-wallet': WalletIcon,
  'supplier-apis': Car, amadeus: MapPin, rapidapi: Database, 'partner-api': Share2,
};

const SERVICE_STATE: Record<Service['state'], { label: string; cls: string; dot: string }> = {
  connected: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  attention: { label: 'Needs attention', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  missing: { label: 'Not set up', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  idle: { label: 'Ready', cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
};

const SCOPES: { key: string; label: string; hint: string }[] = [
  { key: 'search', label: 'Search', hint: 'Look up locations and live car offers.' },
  { key: 'book', label: 'Book', hint: 'Create, read and cancel pay-at-desk bookings.' },
];

const apiBase = () => (API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.hogicar.com')).replace(/\/+$/, '') + '/api/partner/v1';

const statusTone = (s: number) => (s >= 500 ? 'bg-rose-50 text-rose-700 ring-rose-200' : s >= 400 ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200');

// ---------------------------------------------------------------- connected services

const ServicesGrid: React.FC<{ services: Service[] | null }> = ({ services }) => {
  const [open, setOpen] = React.useState<string | null>(null);
  if (!services) return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>;
  const groups = Array.from(new Set(services.map(s => s.category)));
  return (
    <div className="space-y-5">
      {groups.map(g => (
        <div key={g}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{g}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {services.filter(s => s.category === g).map(s => {
              const Icon = SERVICE_ICON[s.key] || Plug;
              const ui = SERVICE_STATE[s.state] || SERVICE_STATE.missing;
              const expanded = open === s.key;
              return (
                <div key={s.key} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.state === 'connected' ? 'bg-[#007ac2]/10 text-[#007ac2]' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ui.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />{ui.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">{s.purpose}</p>
                      <p className="mt-1.5 truncate text-sm text-slate-700">{s.detail}</p>
                    </div>
                  </div>
                  {s.settings && (
                    <>
                      <button onClick={() => setOpen(expanded ? null : s.key)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2]">
                        Render settings <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {s.settings.split(',').map(v => <code key={v} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{v.trim()}</code>)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="mt-px h-3.5 w-3.5 shrink-0" />Secrets are never shown here. Add or change them as environment variables on Render, then redeploy.</p>
    </div>
  );
};

// ---------------------------------------------------------------- partners

const PartnerCard: React.FC<{ p: Partner; busy: boolean; onEdit: () => void; onRotate: () => void; onToggle: () => void; onLogs: () => void }> = ({ p, busy, onEdit, onRotate, onToggle, onLogs }) => {
  const errRate = p.requests24h ? (p.errors24h / p.requests24h) * 100 : 0;
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{p.name}</p>
          <p className="truncate text-xs text-slate-500">{p.contactEmail || p.website || `Added ${fmtDate(p.createdAt)}`}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />{p.status === 'active' ? 'Live' : 'Suspended'}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
        <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">{p.keyPreview || 'No key'}</span>
        <span className="shrink-0 text-[11px] text-slate-400">{p.keyCreatedAt ? ago(p.keyCreatedAt) : ''}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.scopes.map(s => <span key={s} className="rounded-full bg-[#007ac2]/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#007ac2]">{s}</span>)}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{num(p.rateLimitPerMinute)}/min</span>
        {p.allowedIps && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">IP locked</span>}
        {p.webhookUrl && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Webhook</span>}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        <div><dt className="text-[11px] text-slate-500">Calls · 24h</dt><dd className="text-lg font-semibold tabular-nums text-slate-900">{num(p.requests24h)}</dd></div>
        <div><dt className="text-[11px] text-slate-500">Errors</dt><dd className={`text-lg font-semibold tabular-nums ${errRate > 5 ? 'text-rose-600' : 'text-slate-900'}`}>{p.requests24h ? `${errRate.toFixed(errRate && errRate < 10 ? 1 : 0)}%` : '—'}</dd></div>
        <div><dt className="text-[11px] text-slate-500">Bookings</dt><dd className="text-lg font-semibold tabular-nums text-slate-900">{num(p.bookings)}</dd></div>
      </dl>
      <p className="mt-1 text-[11px] text-slate-400">Last call {ago(p.lastUsedAt).toLowerCase()}{p.lastUsedIp ? ` from ${p.lastUsedIp}` : ''} · {usd(p.bookingValue)} booked</p>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {[
          { label: 'Edit', Icon: Pencil, on: onEdit },
          { label: 'Activity', Icon: Activity, on: onLogs },
          { label: 'New key', Icon: RotateCw, on: onRotate },
          { label: p.status === 'active' ? 'Suspend' : 'Resume', Icon: p.status === 'active' ? Pause : Play, on: onToggle },
        ].map(b => (
          <button key={b.label} onClick={b.on} disabled={busy} className="flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50">
            <b.Icon className="h-4 w-4" />{b.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

type Draft = { name: string; contactName: string; contactEmail: string; website: string; notes: string; scopes: string[]; rate: string; ips: string; webhook: string; active: boolean };
const draftOf = (p: Partner | null): Draft => ({
  name: p?.name || '', contactName: p?.contactName || '', contactEmail: p?.contactEmail || '', website: p?.website || '', notes: p?.notes || '',
  scopes: p?.scopes || ['search', 'book'], rate: String(p?.rateLimitPerMinute ?? 120), ips: p?.allowedIps?.split(',').join(', ') || '', webhook: p?.webhookUrl || '',
  active: (p?.status || 'active') === 'active',
});

const PartnerEditor: React.FC<{ partner: Partner | null; onClose: () => void; onSaved: (p: Partner, created: boolean) => void; onDelete: (p: Partner) => Promise<void> }> = ({ partner, onClose, onSaved, onDelete }) => {
  const [d, setD] = React.useState<Draft>(() => draftOf(partner));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const set = (p: Partial<Draft>) => { setD(x => ({ ...x, ...p })); setError(null); };

  const save = async () => {
    if (!d.name.trim()) { setError('Enter the partner’s name.'); return; }
    if (d.contactEmail && !/^\S+@\S+\.\S+$/.test(d.contactEmail.trim())) { setError('Enter a valid contact email.'); return; }
    if (!d.scopes.length) { setError('Give the key at least one permission.'); return; }
    const rate = Number(d.rate);
    if (!(rate >= 1 && rate <= 6000)) { setError('Rate limit must be 1 to 6000 requests per minute.'); return; }
    if (d.webhook && !d.webhook.trim().startsWith('https://')) { setError('The webhook URL must start with https://'); return; }
    const payload = {
      name: d.name.trim(), contactName: d.contactName, contactEmail: d.contactEmail.trim(), website: d.website, notes: d.notes,
      scopes: d.scopes, rateLimitPerMinute: rate, allowedIps: d.ips, webhookUrl: d.webhook.trim(),
      status: d.active ? 'active' : 'inactive',
    };
    setSaving(true);
    try {
      const res = partner ? await adminApi.updateApiPartner(partner.id, payload) : await adminApi.createApiPartner(payload);
      onSaved(res.data, !partner);
    } catch (e) { setError(errorOf(e, 'Could not save the partner.')); }
    finally { setSaving(false); }
  };

  return (
    <Drawer eyebrow={partner ? 'API partner' : 'New API partner'} title={partner ? partner.name : 'Connect a partner'} onClose={onClose} busy={saving}
      footer={<>
        {error && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><Info className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving} className="h-11 flex-1 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#007ac2] text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-70">
            {saving ? <Spinner light /> : partner ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}{partner ? 'Save changes' : 'Create partner & key'}
          </button>
        </div>
      </>}>
      <div className="space-y-5">
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Partner</p>
          <Field label="Company name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Sky Travel Agency" autoFocus={!partner} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Technical contact"><input className={inputCls} value={d.contactName} onChange={e => set({ contactName: e.target.value })} placeholder="Name" /></Field>
            <Field label="Contact email"><input type="email" className={inputCls} value={d.contactEmail} onChange={e => set({ contactEmail: e.target.value })} placeholder="dev@partner.com" /></Field>
          </div>
          <Field label="Website"><input className={inputCls} value={d.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></Field>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Permissions</p>
          {SCOPES.map(s => {
            const on = d.scopes.includes(s.key);
            return (
              <button key={s.key} type="button" onClick={() => set({ scopes: on ? d.scopes.filter(x => x !== s.key) : [...d.scopes, s.key] })}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 transition ${on ? 'bg-[#007ac2]/5 ring-[#007ac2]/40' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${on ? 'bg-[#007ac2] text-white' : 'ring-1 ring-slate-300'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                <span><span className="block text-sm font-semibold text-slate-900">{s.label}</span><span className="block text-xs text-slate-500">{s.hint}</span></span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Security & limits</p>
          <Field label="Rate limit" hint="Requests above this per minute get a 429 answer.">
            <div className="relative"><input inputMode="numeric" className={`${inputCls} pr-24`} value={d.rate} onChange={e => set({ rate: e.target.value.replace(/\D/g, '') })} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">per minute</span></div>
          </Field>
          <Field label="Allowed IP addresses" hint="Optional. Separate with commas. Leave empty to allow any IP.">
            <input className={`${inputCls} font-mono`} value={d.ips} onChange={e => set({ ips: e.target.value })} placeholder="203.0.113.10, 203.0.113.11" />
          </Field>
          <Field label="Webhook URL" hint="We POST booking.confirmed and booking.cancelled events here, signed with the key.">
            <input className={inputCls} value={d.webhook} onChange={e => set({ webhook: e.target.value })} placeholder="https://partner.com/hogicar/webhook" />
          </Field>
        </div>

        <Field label="Internal notes"><textarea className={`${inputCls} h-20 py-2.5`} value={d.notes} onChange={e => set({ notes: e.target.value })} placeholder="Contract, commercial terms…" /></Field>
        <Toggle checked={d.active} onChange={v => set({ active: v })} label="Key is active" hint="Suspended keys get a 403 answer on every call." />

        {partner && (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-rose-200">
            <p className="text-sm font-semibold text-slate-900">Delete partner</p>
            <p className="mt-0.5 text-xs text-slate-500">Revokes the key straight away and deletes the activity log. Their bookings stay.</p>
            {confirm ? (
              <div className="mt-3 flex gap-2">
                <button onClick={() => setConfirm(false)} className="h-10 flex-1 rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Keep</button>
                <button onClick={async () => { setSaving(true); try { await onDelete(partner); } finally { setSaving(false); } }} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700"><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Delete partner</button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

/** Shown once after a key is created or rotated. */
const KeyReveal: React.FC<{ partner: Partner; onClose: () => void }> = ({ partner, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const key = partner.apiKey || '';
  return (
    <Drawer eyebrow="New API key" title={partner.name} onClose={onClose} width="max-w-[560px]"
      footer={<button onClick={onClose} disabled={!copied} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-40">{copied ? <><Check className="h-4 w-4" /> I’ve saved the key</> : 'Copy the key to continue'}</button>}>
      <div className="space-y-4">
        <div className="rounded-3xl bg-[#0b2545] p-5 text-white">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200"><ShieldCheck className="h-4 w-4" /> Secret key</p>
          <p className="mt-3 break-all font-mono text-base leading-relaxed">{key}</p>
          <CopyButton text={key} label="Copy key" onCopied={() => setCopied(true)} className="mt-4 h-11 w-full bg-white text-[#0b2545] hover:bg-sky-50" />
        </div>
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />This is the only time the key is shown. Hogicar stores only a fingerprint of it. Send it to the partner over a secure channel.</p>
        <p className="text-sm text-slate-600">The partner sends it with every call in the <code className="rounded bg-slate-100 px-1 font-mono text-xs">X-API-Key</code> header. Any previous key for this partner has stopped working.</p>
      </div>
    </Drawer>
  );
};

// ---------------------------------------------------------------- docs & console

const Code: React.FC<{ code: string; notify: (t: string) => void }> = ({ code, notify }) => (
  <div className="group relative">
    <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 pr-12 text-[12px] leading-relaxed text-slate-100"><code>{code}</code></pre>
    <CopyButton text={code} className="absolute right-2 top-2 h-8 w-8 bg-white/10 text-slate-200 hover:bg-white/20" onCopied={() => notify('Copied')} />
  </div>
);

const ENDPOINTS = (base: string) => [
  { method: 'GET', path: '/ping', scope: '', text: 'Checks the key and returns its permissions and limit.', example: `curl ${base}/ping \\\n  -H "X-API-Key: $HOGICAR_KEY"` },
  { method: 'GET', path: '/locations?q=dubai', scope: 'search', text: 'Finds airports and cities and their location codes.', example: `curl "${base}/locations?q=dubai" \\\n  -H "X-API-Key: $HOGICAR_KEY"` },
  { method: 'GET', path: '/search', scope: 'search', text: 'Live offers with total price in USD. Params: pickup, dropoff, pickupDate, dropoffDate, pickupTime, dropoffTime, page, size (max 50).', example: `curl "${base}/search?pickup=DXB&pickupDate=2026-11-10&dropoffDate=2026-11-14" \\\n  -H "X-API-Key: $HOGICAR_KEY"` },
  { method: 'POST', path: '/bookings', scope: 'book', text: 'Books an offer, paid at the desk. Hogicar re-checks the price; send expectedTotal to get a 409 if it changed.', example: `curl -X POST ${base}/bookings \\\n  -H "X-API-Key: $HOGICAR_KEY" -H "Content-Type: application/json" \\\n  -d '{"offerId":"…","pickup":"DXB","pickupDate":"2026-11-10","dropoffDate":"2026-11-14",\n       "expectedTotal":182.5,"driver":{"firstName":"Sara","lastName":"Ali","email":"sara@example.com","phone":"+971…"}}'` },
  { method: 'GET', path: '/bookings/{reference}', scope: 'book', text: 'Status and details of a booking made with this key.', example: `curl ${base}/bookings/HC123456 \\\n  -H "X-API-Key: $HOGICAR_KEY"` },
  { method: 'POST', path: '/bookings/{reference}/cancel', scope: 'book', text: 'Cancels a booking made with this key.', example: `curl -X POST ${base}/bookings/HC123456/cancel \\\n  -H "X-API-Key: $HOGICAR_KEY"` },
];

const DocsPanel: React.FC<{ notify: (t: string) => void }> = ({ notify }) => {
  const base = apiBase();
  const [open, setOpen] = React.useState<number>(2);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900"><BookOpen className="h-4 w-4 text-[#007ac2]" /> Partner API v1</h3>
        <p className="mt-1 text-sm text-slate-500">Send these details to a partner’s developers together with their key.</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-1.5 pl-3 ring-1 ring-slate-200">
          <span className="text-xs font-semibold text-slate-400">Base URL</span>
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-800">{base}</span>
          <CopyButton text={base} className="h-8 w-8 text-slate-500 hover:bg-white" onCopied={() => notify('Base URL copied')} />
        </div>
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200">
          {ENDPOINTS(base).map((e, i) => (
            <li key={e.path}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <span className={`w-12 shrink-0 rounded-md py-0.5 text-center font-mono text-[11px] font-bold ${e.method === 'GET' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>{e.method}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-800">{e.path}</span>
                {e.scope && <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 sm:inline">{e.scope}</span>}
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="space-y-2 px-4 pb-4"><p className="text-sm text-slate-600">{e.text}</p><Code code={e.example} notify={notify} /></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 ring-1 ring-slate-200"><p className="mb-1 font-semibold text-slate-900">Errors</p>Every error is JSON: <code className="font-mono">{'{"error":{"code","message"}}'}</code>. 401 bad key · 403 suspended or blocked IP · 409 offer gone or price changed · 429 rate limit (retry after 60 s).</div>
          <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 ring-1 ring-slate-200"><p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-900"><Webhook className="h-3.5 w-3.5" /> Webhooks</p>Signed with header <code className="font-mono">X-Hogicar-Signature</code> = HMAC-SHA256 of the body, using the SHA-256 hex of the API key as the secret.</div>
        </div>
      </section>
      <TestConsole notify={notify} />
    </div>
  );
};

const TestConsole: React.FC<{ notify: (t: string) => void }> = ({ notify }) => {
  const [key, setKey] = React.useState('');
  const [path, setPath] = React.useState('/ping');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ status: number; ms: number; body: string } | null>(null);
  const run = async () => {
    if (!key.trim()) { notify('Paste a key to test with'); return; }
    setBusy(true); setResult(null);
    const started = performance.now();
    try {
      const res = await fetch(`${apiBase()}${path.startsWith('/') ? path : `/${path}`}`, { headers: { 'X-API-Key': key.trim() } });
      const text = await res.text();
      let body = text;
      try { body = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON */ }
      setResult({ status: res.status, ms: Math.round(performance.now() - started), body: body.length > 6000 ? `${body.slice(0, 6000)}\n…` : body });
    } catch (e: any) {
      setResult({ status: 0, ms: Math.round(performance.now() - started), body: e?.message || 'Network error' });
    } finally { setBusy(false); }
  };
  return (
    <section className="flex flex-col rounded-3xl bg-slate-950 p-5 text-slate-100 shadow-sm sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold"><Terminal className="h-4 w-4 text-emerald-400" /> Try a key</h3>
      <p className="mt-1 text-sm text-slate-400">Calls the live partner API from your browser.</p>
      <input value={key} onChange={e => setKey(e.target.value)} placeholder="hc_live_…" autoComplete="off" spellCheck={false}
        className="mt-4 h-11 w-full rounded-xl bg-white/5 px-3.5 font-mono text-base text-white outline-none ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-emerald-400/60 sm:text-sm" />
      <div className="mt-2 flex gap-2">
        <select value={path} onChange={e => setPath(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl bg-white/5 px-3 font-mono text-sm text-white outline-none ring-1 ring-white/10">
          <option value="/ping">GET /ping</option>
          <option value="/locations?q=dubai">GET /locations?q=dubai</option>
        </select>
        <button onClick={run} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">{busy ? <Spinner /> : <Play className="h-4 w-4" />} Send</button>
      </div>
      <div className="mt-4 min-h-[180px] flex-1 overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
        {result ? (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs">
              <span className={`rounded-md px-1.5 py-0.5 font-mono font-bold ${result.status >= 200 && result.status < 300 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{result.status || 'ERR'}</span>
              <span className="text-slate-400">{result.ms} ms</span>
            </div>
            <pre className="max-h-72 overflow-auto p-3 text-[12px] leading-relaxed text-slate-200">{result.body}</pre>
          </>
        ) : <p className="p-4 text-sm text-slate-500">The response appears here.</p>}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- activity

const ActivityPanel: React.FC<{ partners: Partner[]; focus: number | null; setFocus: (id: number | null) => void }> = ({ partners, focus, setFocus }) => {
  const [usage, setUsage] = React.useState<Usage | null>(null);
  const [logs, setLogs] = React.useState<LogRow[] | null>(null);
  const load = React.useCallback(async () => {
    setLogs(null);
    const [u, l] = await Promise.allSettled([adminApi.getApiUsage(focus || undefined), adminApi.getApiLogs(focus || undefined)]);
    setUsage(u.status === 'fulfilled' ? u.value.data : { series: [], avgLatencyMs: 0 });
    setLogs(l.status === 'fulfilled' ? l.value.data || [] : []);
  }, [focus]);
  React.useEffect(() => { load(); }, [load]);
  const names = React.useMemo(() => Object.fromEntries(partners.map(p => [p.id, p.name])), [partners]);
  const series = (usage?.series || []).map(p => ({ ...p, ok: p.requests - p.errors, label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }));
  const total = series.reduce((n, p) => n + p.requests, 0);
  const errors = series.reduce((n, p) => n + p.errors, 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select value={focus ?? ''} onChange={e => setFocus(e.target.value ? Number(e.target.value) : null)} className={`${inputCls} sm:w-72`}>
          <option value="">All partners</option>
          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={load} className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="text-base font-semibold text-slate-900">API traffic · 14 days</h3><p className="text-sm text-slate-500">{num(total)} calls · {total ? ((errors / total) * 100).toFixed(1) : 0}% errors · {num(usage?.avgLatencyMs || 0)} ms average</p></div>
          <div className="flex gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#007ac2]" />Successful</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Errors</span></div>
        </div>
        <div className="mt-4 h-52 w-full min-w-0">
          {!usage ? <div className="h-full animate-pulse rounded-2xl bg-slate-100" /> : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={series} margin={{ left: -18, right: 4, top: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" minTickGap={16} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="ok" name="Successful" stackId="a" fill="#007ac2" radius={[0, 0, 0, 0]} />
                <Bar dataKey="errors" name="Errors" stackId="a" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-base font-semibold text-slate-900">Latest calls</h3></div>
        {logs === null ? <div className="space-y-2 p-5">{[0, 1, 2].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div> :
          logs.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">No calls yet. Once a partner uses their key, every request shows up here.</p> : (
            <ul className="divide-y divide-slate-100">
              {logs.map(l => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className={`w-11 shrink-0 rounded-md py-0.5 text-center font-mono text-[11px] font-bold ring-1 ring-inset ${statusTone(l.status)}`}>{l.status}</span>
                  <span className={`hidden w-11 shrink-0 font-mono text-[11px] font-bold sm:block ${l.method === 'HOOK' ? 'text-violet-600' : 'text-slate-500'}`}>{l.method}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-slate-800">{l.path?.replace(/^\/api\/partner\/v1/, '')}</p>
                    {l.error && <p className="truncate text-[11px] text-rose-600">{l.error}</p>}
                  </div>
                  {!focus && l.partnerId && <span className="hidden max-w-[140px] truncate text-xs text-slate-500 md:block">{names[l.partnerId] || `#${l.partnerId}`}</span>}
                  <span className="hidden w-16 shrink-0 text-right text-xs tabular-nums text-slate-400 sm:block">{l.durationMs != null ? `${l.durationMs} ms` : ''}</span>
                  <span className="w-20 shrink-0 text-right text-xs text-slate-400">{ago(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
};

// ---------------------------------------------------------------- page

type Tab = 'partners' | 'services' | 'activity' | 'docs';

const IntegrationsAdmin: React.FC = () => {
  const [tab, setTab] = React.useState<Tab>('partners');
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [services, setServices] = React.useState<Service[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Partner | 'new' | null>(null);
  const [revealed, setRevealed] = React.useState<Partner | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [focus, setFocus] = React.useState<number | null>(null);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true); setLoadError(null);
    const [p, s] = await Promise.allSettled([adminApi.getApiPartners(), adminApi.getIntegrationServices()]);
    if (p.status === 'fulfilled') setPartners(Array.isArray(p.value.data) ? p.value.data : []);
    else setLoadError(errorOf(p.reason, 'Could not load integrations.'));
    setServices(s.status === 'fulfilled' && Array.isArray(s.value.data) ? s.value.data : []);
    setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const merge = (p: Partner) => setPartners(list => list.map(x => (x.id === p.id ? { ...x, ...p, apiKey: undefined, requests24h: x.requests24h, errors24h: x.errors24h, requests30d: x.requests30d, errors30d: x.errors30d, bookings: x.bookings, cancelledBookings: x.cancelledBookings, bookingValue: x.bookingValue } : x)));

  const toggle = async (p: Partner) => {
    setBusyId(p.id);
    try {
      const res = await adminApi.setApiPartnerStatus(p.id, p.status === 'active' ? 'inactive' : 'active');
      merge(res.data);
      notify(p.status === 'active' ? `${p.name} suspended` : `${p.name} is live again`);
    } catch (e) { notify(errorOf(e, 'Could not update the partner.'), 'err'); }
    finally { setBusyId(null); }
  };

  const rotate = async (p: Partner) => {
    if (!window.confirm(`Create a new key for ${p.name}? Their current key stops working immediately.`)) return;
    setBusyId(p.id);
    try {
      const res = await adminApi.rotateApiPartnerKey(p.id);
      merge(res.data);
      setRevealed(res.data);
    } catch (e) { notify(errorOf(e, 'Could not create a new key.'), 'err'); }
    finally { setBusyId(null); }
  };

  const remove = async (p: Partner) => {
    try {
      await adminApi.deleteApiPartner(p.id);
      setPartners(list => list.filter(x => x.id !== p.id));
      setEditing(null);
      notify(`${p.name} deleted`);
    } catch (e) { notify(errorOf(e, 'Could not delete the partner.'), 'err'); }
  };

  const onSaved = (p: Partner, created: boolean) => {
    setEditing(null);
    if (created) {
      setPartners(list => [{ ...p, apiKey: undefined }, ...list]);
      setRevealed(p);
    } else {
      merge(p);
      notify(`${p.name} saved`);
    }
  };

  const live = partners.filter(p => p.status === 'active');
  const calls = partners.reduce((n, p) => n + Number(p.requests24h || 0), 0);
  const errs = partners.reduce((n, p) => n + Number(p.errors24h || 0), 0);
  const bookings = partners.reduce((n, p) => n + Number(p.bookings || 0), 0);
  const value = partners.reduce((n, p) => n + Number(p.bookingValue || 0), 0);
  const connected = (services || []).filter(s => s.state === 'connected').length;
  const needs = (services || []).filter(s => s.state === 'attention' || s.state === 'missing').length;

  return (
    <div className="space-y-5">
      <Hero eyebrow="Commercial" eyebrowIcon={Plug} title="Integrations"
        subtitle="Give travel agencies and apps their own API key to search and book Hogicar cars, and check every service the platform relies on."
        loading={loading}
        actions={<>
          <button onClick={load} className={heroButton} aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
          <button onClick={() => { setTab('partners'); setEditing('new'); }} className={heroPrimary}><Plus className="h-4 w-4" /> New API partner</button>
        </>}
        kpis={[
          { label: 'Live partner keys', value: num(live.length), Icon: KeyRound, note: `${num(partners.length)} partners in total` },
          { label: 'API calls · 24h', value: num(calls), Icon: Activity },
          { label: 'Error rate · 24h', value: calls ? `${((errs / calls) * 100).toFixed(1)}%` : '—', Icon: Gauge, note: `${num(errs)} failed calls` },
          { label: 'Bookings via API', value: num(bookings), Icon: ShoppingBag, note: `${usd(value)} booking value` },
        ]} />

      {loadError && <ErrorBanner text={loadError} onRetry={load} />}

      <Segmented layoutId="int-tab" value={tab} onChange={setTab} items={[
        { key: 'partners', label: 'API partners', count: partners.length },
        { key: 'services', label: 'Connected services', count: services ? connected : undefined },
        { key: 'activity', label: 'Activity' },
        { key: 'docs', label: 'Docs & testing' },
      ]} />

      {tab === 'partners' && (
        loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-80 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />)}</div> :
        partners.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Share2 className="h-7 w-7" /></span>
            <p className="mt-4 text-base font-semibold text-slate-900">Connect your first partner</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Create a key for a travel agency, OTA or app. They can then search live offers and make bookings through the Hogicar API.</p>
            <button onClick={() => setEditing('new')} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f]"><Plus className="h-4 w-4" /> New API partner</button>
          </div>
        ) : (
          <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {partners.map(p => (
                <PartnerCard key={p.id} p={p} busy={busyId === p.id} onEdit={() => setEditing(p)} onRotate={() => rotate(p)} onToggle={() => toggle(p)}
                  onLogs={() => { setFocus(p.id); setTab('activity'); }} />
              ))}
            </AnimatePresence>
          </motion.div>
        )
      )}

      {tab === 'services' && (
        <>
          {services && needs > 0 && <p className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{needs === 1 ? '1 service needs' : `${needs} services need`} setting up. Open “Render settings” on a card to see which variables to add.</p>}
          <ServicesGrid services={services} />
        </>
      )}

      {tab === 'activity' && <ActivityPanel partners={partners} focus={focus} setFocus={setFocus} />}
      {tab === 'docs' && <DocsPanel notify={t => notify(t)} />}

      <AnimatePresence>
        {editing && <PartnerEditor key="editor" partner={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={onSaved} onDelete={remove} />}
        {revealed && <KeyReveal key="reveal" partner={revealed} onClose={() => { setRevealed(null); notify('Key saved. Share it securely.'); }} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

export default IntegrationsAdmin;
