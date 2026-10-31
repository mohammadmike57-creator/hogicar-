import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plug from 'lucide-react/dist/esm/icons/plug';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Activity from 'lucide-react/dist/esm/icons/activity';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Search from 'lucide-react/dist/esm/icons/search';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Webhook from 'lucide-react/dist/esm/icons/webhook';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Trash from 'lucide-react/dist/esm/icons/trash-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { adminFetch } from '../../lib/adminApi';
import { Hero, heroButton, heroPrimary, Segmented, num, inputCls, Field, useToast, Toast, Drawer, ErrorBanner, Spinner, CopyButton, ago } from './commercialUi';

type Conn = {
  id: number; name: string; supplierCode?: string; channelCode?: string; baseUrl?: string; authMode?: string; environment?: string;
  currency?: string; locationCodes?: string; defaultDriverAge?: number; commissionPercent?: number; logoUrl?: string; replacesVendorCodes?: string;
  active: boolean; bookingEnabled: boolean; timeoutSeconds?: number; webhookHeaderPrefix?: string; hasApiKey: boolean; hasWebhookSecret: boolean;
  webhookUrl?: string; supplierId?: string; lastPingAt?: string; lastPingOk?: boolean | null; lastError?: string; encryptionReady?: boolean;
};
type Offer = { offerId?: string; offerExpiresAt?: string; sipp?: string; makeModel?: string; seats?: number; bags?: number; doors?: number; transmission?: string;
  airConditioning?: boolean; total?: number; currency?: string; deposit?: number; unlimitedMileage?: boolean; cancellationPolicy?: string; paymentType?: string; availableCount?: number };
type Call = { id: number; operation: string; requestId?: string; remoteRequestId?: string; bookingRef?: string; httpStatus?: number; ok: boolean;
  errorCode?: string; errorMessage?: string; durationMs?: number; requestBody?: string; responseBody?: string; createdAt: string };
type Link = { id: number; bookingRef: string; reservationId?: string; supplierStatus?: string; version?: number; cancellationPolicy?: string; lastError?: string; updatedAt?: string };
type Tab = 'overview' | 'search' | 'bookings' | 'log' | 'settings';

const errorText = (e: any, fallback: string) => {
  const m = String(e?.message || '');
  const hit = /status \d+: (.*)$/s.exec(m);
  let text = (hit ? hit[1] : m).trim();
  try { const j = JSON.parse(text); if (j?.message) text = j.message; } catch { /* plain text */ }
  return text && !text.startsWith('<') ? text : fallback;
};
const pretty = (xml?: string) => {
  if (!xml) return '';
  if (xml.trim().startsWith('{')) { try { return JSON.stringify(JSON.parse(xml), null, 2); } catch { return xml; } }
  let out = ''; let depth = 0;
  xml.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/).forEach(part => {
    if (!part.trim()) return;
    if (part.startsWith('</')) depth = Math.max(0, depth - 1);
    out += '  '.repeat(depth) + part + '\n';
    if (part.startsWith('<') && !part.startsWith('</') && !part.startsWith('<?') && !part.endsWith('/>') && !part.includes('</')) depth++;
  });
  return out.replace(/\n(\s*)([^<\s][^\n]*)\n\s*<\//g, '$2</').trim();
};
const money = (v?: number, c?: string) => v == null ? '—' : `${c || ''} ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

const EnvPill: React.FC<{ env?: string }> = ({ env }) => env === 'PRODUCTION'
  ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Production</span>
  : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">Sandbox</span>;

const StatusDot: React.FC<{ c: Conn }> = ({ c }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${c.active ? 'text-emerald-700' : 'text-slate-500'}`}>
    <span className={`h-2 w-2 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-slate-300'}`} /> {c.active ? 'Live in search' : 'Off'}
  </span>
);

const statusTone = (s?: string) => ({
  CONFIRMED: 'bg-emerald-50 text-emerald-700', PENDING: 'bg-amber-50 text-amber-800', IN_PROGRESS: 'bg-sky-50 text-sky-800',
  COMPLETED: 'bg-slate-100 text-slate-700', CANCELLED: 'bg-rose-50 text-rose-700', NO_SHOW: 'bg-rose-50 text-rose-700', FAILED: 'bg-rose-100 text-rose-800',
}[s || ''] || 'bg-slate-100 text-slate-600');

const EMPTY = { name: '', baseUrl: '', channelCode: 'HGC', supplierCode: '', authMode: 'BEARER', environment: 'SANDBOX', currency: 'USD', locationCodes: '',
  defaultDriverAge: 30, commissionPercent: 0, logoUrl: '', replacesVendorCodes: '', active: false, bookingEnabled: true, timeoutSeconds: 20,
  webhookHeaderPrefix: 'X-NCT', apiKey: '', webhookSecret: '' };

/** The connection form, used to add a connection and in its Settings tab. */
const ConnectionForm: React.FC<{ initial?: Conn | null; busy: boolean; onSave: (v: any) => void; onDelete?: () => void }> = ({ initial, busy, onSave, onDelete }) => {
  const [v, setV] = React.useState<any>(() => initial ? { ...EMPTY, ...initial, apiKey: '', webhookSecret: '',
    replacesVendorCodes: initial.replacesVendorCodes || '', logoUrl: initial.logoUrl || '', locationCodes: initial.locationCodes || '' } : { ...EMPTY });
  const set = (k: string, val: any) => setV((x: any) => ({ ...x, [k]: val }));
  const save = () => {
    const body: any = { ...v };
    if (!body.apiKey) delete body.apiKey;
    if (!body.webhookSecret) delete body.webhookSecret;
    onSave(body);
  };
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Supplier</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name customers see"><input className={inputCls} value={v.name} onChange={e => set('name', e.target.value)} placeholder="UR-Drive" /></Field>
          <Field label="Logo link (optional)"><input className={inputCls} value={v.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://…/logo.png" /></Field>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Connection</h3>
        <Field label="OTA address" hint="The message name is added to it, e.g. …/HGC/OTA_VehAvailRate">
          <input className={`${inputCls} font-mono`} value={v.baseUrl} onChange={e => set('baseUrl', e.target.value)} placeholder="https://www.nctrental.com/ota/v1/HGC" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Our channel code"><input className={`${inputCls} font-mono uppercase`} value={v.channelCode} onChange={e => set('channelCode', e.target.value.toUpperCase())} placeholder="HGC" /></Field>
          <Field label="Their supplier code"><input className={`${inputCls} font-mono uppercase`} value={v.supplierCode || ''} onChange={e => set('supplierCode', e.target.value.toUpperCase())} placeholder="NCT" /></Field>
          <Field label="Currency"><input className={`${inputCls} font-mono uppercase`} value={v.currency} onChange={e => set('currency', e.target.value.toUpperCase().slice(0, 3))} /></Field>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Environment</span>
          <div className="grid grid-cols-2 gap-2">
            {(['SANDBOX', 'PRODUCTION'] as const).map(env => (
              <button key={env} type="button" onClick={() => set('environment', env)} aria-pressed={v.environment === env}
                className={`rounded-xl p-3 text-left ring-1 ring-inset ${v.environment === env ? 'bg-white ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200'}`}>
                <span className="block text-sm font-semibold text-slate-900">{env === 'SANDBOX' ? 'Sandbox' : 'Production'}</span>
                <span className="block text-xs text-slate-500">{env === 'SANDBOX' ? 'Test bookings; sends X-Environment: sandbox' : 'Real bookings reach their branches'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><KeyRound className="h-4 w-4 text-slate-400" /> API key</h3>
        <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <Field label="Sent as">
            <select className={inputCls} value={v.authMode} onChange={e => set('authMode', e.target.value)}>
              <option value="BEARER">Authorization: Bearer</option>
              <option value="API_KEY_HEADER">X-Api-Key header</option>
              <option value="OTA_POS">OTA POS MessagePassword</option>
            </select>
          </Field>
          <Field label={initial?.hasApiKey ? 'New API key (leave empty to keep the saved one)' : 'API key'} hint="Stored encrypted. It is never shown again or written to the request log.">
            <input type="password" autoComplete="new-password" className={`${inputCls} font-mono`} value={v.apiKey} onChange={e => set('apiKey', e.target.value)} placeholder={initial?.hasApiKey ? '•••••••• saved' : 'Paste the key they sent you'} />
          </Field>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Selling</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Locations they serve" hint="Codes, comma separated"><input className={`${inputCls} font-mono uppercase`} value={v.locationCodes} onChange={e => set('locationCodes', e.target.value.toUpperCase())} placeholder="AMM" /></Field>
          <Field label="Driver age in searches"><input type="number" className={inputCls} value={v.defaultDriverAge} onChange={e => set('defaultDriverAge', e.target.value)} /></Field>
          <Field label="Hogicar commission %" hint="Invoiced to them; customers pay their price"><input type="number" step="0.1" className={inputCls} value={v.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} /></Field>
        </div>
        <Field label="Hide their cars from other feeds" hint="Vendor codes of the same company in CheapTickets, e.g. URDRIVEJO, so their cars are not shown twice.">
          <input className={`${inputCls} font-mono uppercase`} value={v.replacesVendorCodes} onChange={e => set('replacesVendorCodes', e.target.value.toUpperCase())} placeholder="URDRIVEJO" />
        </Field>
      </section>
      <section className="space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><Webhook className="h-4 w-4 text-slate-400" /> Status updates (webhooks)</h3>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Field label={initial?.hasWebhookSecret ? 'New signing secret (leave empty to keep)' : 'Signing secret'}>
            <input type="password" autoComplete="new-password" className={`${inputCls} font-mono`} value={v.webhookSecret} onChange={e => set('webhookSecret', e.target.value)} placeholder={initial?.hasWebhookSecret ? '•••••••• saved' : 'From the supplier'} />
          </Field>
          <Field label="Header prefix"><input className={`${inputCls} font-mono`} value={v.webhookHeaderPrefix} onChange={e => set('webhookHeaderPrefix', e.target.value)} /></Field>
        </div>
      </section>
      <section className="space-y-2">
        {[['active', 'Show in search', 'Their cars and live prices appear in Hogicar search for the locations above.'],
          ['bookingEnabled', 'Book through the API', 'Bookings are placed in their system automatically. Off: bookings wait for the team.']].map(([k, label, hint]) => (
          <label key={k} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <span><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{hint}</span></span>
            <span className="relative shrink-0">
              <input type="checkbox" className="peer sr-only" checked={!!v[k]} onChange={e => set(k, e.target.checked)} />
              <span className="block h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
          </label>
        ))}
      </section>
      <div className="flex items-center justify-between gap-2 pt-2">
        {onDelete ? <button type="button" onClick={onDelete} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"><Trash className="h-4 w-4" /> Delete</button> : <span />}
        <button type="button" onClick={save} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{busy && <Spinner light />} {initial ? 'Save changes' : 'Add connection'}</button>
      </div>
    </div>
  );
};

/** Admin › XML suppliers: rental companies connected through their own OTA XML booking API. */
const XmlSuppliersAdmin: React.FC = () => {
  const [list, setList] = React.useState<Conn[] | null>(null);
  const [error, setError] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [tab, setTab] = React.useState<Tab>('overview');
  const [busy, setBusy] = React.useState(false);
  const [pinging, setPinging] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState({ pickupCode: '', pickupDate: plus(14), dropoffDate: plus(17) });
  const [result, setResult] = React.useState<any>(null);
  const [calls, setCalls] = React.useState<Call[] | null>(null);
  const [links, setLinks] = React.useState<Link[] | null>(null);
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setError('');
    try { setList(await adminFetch('/api/admin/xml-suppliers')); }
    catch (e: any) { setError(errorText(e, 'Connections could not be loaded.')); setList(l => l ?? []); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const open = (list || []).find(c => c.id === openId) || null;
  React.useEffect(() => {
    if (!open) return;
    setResult(null); setExpanded(null);
    setSearch(s => ({ ...s, pickupCode: (open.locationCodes || '').split(',')[0] || '' }));
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!open) return;
    if (tab === 'log') { setCalls(null); adminFetch(`/api/admin/xml-suppliers/${open.id}/calls?limit=100`).then(setCalls).catch(() => setCalls([])); }
    if (tab === 'bookings') { setLinks(null); adminFetch(`/api/admin/xml-suppliers/${open.id}/bookings`).then(setLinks).catch(() => setLinks([])); }
  }, [tab, openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ping = async (c: Conn) => {
    setPinging(c.id);
    try {
      const r = await adminFetch(`/api/admin/xml-suppliers/${c.id}/ping`, { method: 'POST' });
      notify(r.ok ? `${c.name}: connected (${r.ms} ms)` : `${c.name}: ${r.errorCode} ${r.message || ''}`, r.ok ? 'ok' : 'err');
      await load();
    } catch (e: any) { notify(errorText(e, 'The check failed.'), 'err'); }
    finally { setPinging(null); }
  };

  const save = async (body: any, id?: number) => {
    setBusy(true);
    try {
      const saved = await adminFetch(id ? `/api/admin/xml-suppliers/${id}` : '/api/admin/xml-suppliers', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      notify(id ? 'Changes saved' : `${saved.name} added`);
      await load();
      if (!id) { setAdding(false); setOpenId(saved.id); setTab('overview'); }
    } catch (e: any) { notify(errorText(e, 'Could not save.'), 'err'); }
    finally { setBusy(false); }
  };

  const remove = async (c: Conn) => {
    if (!window.confirm(`Delete the connection to ${c.name}? Their cars leave search straight away. Bookings already made keep their reservation numbers.`)) return;
    try { await adminFetch(`/api/admin/xml-suppliers/${c.id}`, { method: 'DELETE' }); notify(`${c.name} deleted`); setOpenId(null); await load(); }
    catch (e: any) { notify(errorText(e, 'Could not delete.'), 'err'); }
  };

  const runSearch = async () => {
    if (!open) return;
    setBusy(true); setResult(null);
    try { setResult(await adminFetch(`/api/admin/xml-suppliers/${open.id}/test-search`, { method: 'POST', body: JSON.stringify(search) })); }
    catch (e: any) { setResult({ ok: false, message: errorText(e, 'The search failed.') }); }
    finally { setBusy(false); }
  };

  const items = list || [];
  const live = items.filter(c => c.active).length;
  const failing = items.filter(c => c.lastPingOk === false).length;

  const checklist = (c: Conn) => [
    { done: !!c.baseUrl, label: 'OTA address set', hint: c.baseUrl || 'Add the address from their guide' },
    { done: c.hasApiKey, label: 'API key saved (encrypted)', hint: c.hasApiKey ? `Sent as ${c.authMode === 'BEARER' ? 'Authorization: Bearer' : c.authMode === 'API_KEY_HEADER' ? 'X-Api-Key' : 'OTA MessagePassword'}` : 'Paste the key they send you separately' },
    { done: c.lastPingOk === true, label: 'Connection check passed', hint: c.lastPingAt ? `${c.lastPingOk ? 'OK' : 'Failed'} ${ago(c.lastPingAt)}${c.lastError ? ` · ${c.lastError}` : ''}` : 'Run "Test connection"' },
    { done: !!c.locationCodes, label: 'Locations to sell', hint: c.locationCodes || 'e.g. AMM' },
    { done: c.hasWebhookSecret, label: 'Webhook secret saved', hint: c.hasWebhookSecret ? 'Their status updates are verified' : 'Optional: for cancellations and no-shows from their counter' },
    { done: c.environment === 'PRODUCTION', label: 'Certified and switched to production', hint: c.environment === 'PRODUCTION' ? 'Bookings reach their branches' : 'Run their certification cases in the sandbox first' },
    { done: c.active, label: 'Live in Hogicar search', hint: c.active ? 'Customers see their cars' : 'Switch on in Settings when ready' },
  ];

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Supplier connections" eyebrowIcon={Plug} title="XML suppliers"
        subtitle="Rental companies connected through their own booking API (OpenTravel OTA XML): live prices in search, bookings and cancellations in their system, status updates back to Hogicar."
        loading={list === null}
        actions={<>
          <button onClick={load} className={heroButton}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => setAdding(true)} className={heroPrimary}><Plus className="h-4 w-4" /> Add connection</button>
        </>}
        kpis={[
          { label: 'Connections', value: num(items.length), Icon: Plug },
          { label: 'Live in search', value: num(live), Icon: Search },
          { label: 'In production', value: num(items.filter(c => c.environment === 'PRODUCTION').length), Icon: ShieldCheck, note: `${num(items.length - items.filter(c => c.environment === 'PRODUCTION').length)} in sandbox` },
          { label: 'Failed last check', value: num(failing), Icon: Activity, note: failing ? 'Open the request log' : 'All good' },
        ]}
      />
      {error && <ErrorBanner text={error} onRetry={load} />}

      {list !== null && items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><Plug className="h-6 w-6 text-slate-400" /></span>
          <p className="mt-3 text-base font-semibold text-slate-900">No XML suppliers yet</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">Add a rental company that sent you an OTA XML integration guide, such as UR-Drive Jordan. Start in their sandbox; switch it on when their certification passes.</p>
          <button onClick={() => setAdding(true)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add connection</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map(c => (
            <div key={c.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-sm font-bold text-white">
                  {c.logoUrl ? <img src={c.logoUrl} alt="" className="h-full w-full bg-white object-contain p-1" /> : c.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate text-base font-semibold text-slate-900">{c.name}</p><EnvPill env={c.environment} /></div>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{c.channelCode || '—'} → {c.supplierCode || '—'} · OTA 2003/05</p>
                </div>
                <StatusDot c={c} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {(c.locationCodes || '').split(',').filter(Boolean).map(l => <span key={l} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"><MapPin className="h-3 w-3" />{l}</span>)}
                {!c.locationCodes && <span className="text-xs text-slate-400">No locations yet</span>}
              </div>
              <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${c.lastPingOk === false ? 'bg-rose-50 text-rose-800' : c.lastPingOk ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-500'}`}>
                {c.lastPingOk === false ? <XCircle className="h-4 w-4 shrink-0" /> : c.lastPingOk ? <CheckCircle className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
                <span className="truncate">{c.lastPingAt ? `${c.lastPingOk ? 'Connected' : 'Failed'} ${ago(c.lastPingAt)}${c.lastError ? ` · ${c.lastError}` : ''}` : 'Not checked yet'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => ping(c)} disabled={pinging === c.id} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-60">
                  {pinging === c.id ? <Spinner /> : <Activity className="h-4 w-4" />} Test connection
                </button>
                <button onClick={() => { setOpenId(c.id); setTab('overview'); }} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800">Open</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <Drawer eyebrow="New connection" title="Add an XML supplier" onClose={() => setAdding(false)} busy={busy} width="max-w-[640px]">
            <ConnectionForm busy={busy} onSave={v => save(v)} />
          </Drawer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <Drawer eyebrow={`${open.channelCode || ''} → ${open.supplierCode || ''}`} title={open.name} onClose={() => setOpenId(null)} busy={busy} width="max-w-[880px]"
            headerExtra={<div className="pb-3"><Segmented layoutId="xml-tab" value={tab} onChange={setTab} items={[
              { key: 'overview', label: 'Overview' }, { key: 'search', label: 'Test search' }, { key: 'bookings', label: 'Bookings' },
              { key: 'log', label: 'Request log' }, { key: 'settings', label: 'Settings' }]} /></div>}>
            {tab === 'overview' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <EnvPill env={open.environment} /><StatusDot c={open} />
                  <button onClick={() => ping(open)} disabled={pinging === open.id} className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{pinging === open.id ? <Spinner light /> : <Activity className="h-4 w-4" />} Test connection</button>
                </div>
                <div className="rounded-2xl bg-white ring-1 ring-slate-200">
                  <p className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Go-live checklist</p>
                  <ul className="divide-y divide-slate-100">
                    {checklist(open).map(i => (
                      <li key={i.label} className="flex items-start gap-3 px-5 py-3">
                        {i.done ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
                        <span className="min-w-0"><span className="block text-sm font-medium text-slate-900">{i.label}</span><span className="block break-words text-xs text-slate-500">{i.hint}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-900">Your webhook address</p>
                  <p className="mt-0.5 text-xs text-slate-500">Send this to the supplier ("Your HTTPS webhook URL"). Events must be signed with the secret; older than 5 minutes, wrongly signed or repeated events are refused.</p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <code className="min-w-0 flex-1 truncate text-xs text-slate-800">{open.webhookUrl}</code>
                    <CopyButton text={open.webhookUrl || ''} label="Copy" className="h-8 px-2 text-slate-700 hover:bg-white" onCopied={() => notify('Webhook address copied')} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[['Payment', 'Customer pays at the counter'], ['Price shown', 'Their price, nothing added'], ['Commission', `${open.commissionPercent ?? 0}% invoiced to them`]].map(([k, val]) => (
                    <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs text-slate-500">{k}</p><p className="mt-1 text-sm font-semibold text-slate-900">{val}</p></div>
                  ))}
                </div>
                {!open.encryptionReady && <ErrorBanner text="The server has no encryption key (AFFILIATE_MASTER_ENCRYPTION_KEY), so API keys can't be saved yet." onRetry={load} />}
              </div>
            )}

            {tab === 'search' && (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end">
                  <Field label="Pick-up"><input className={`${inputCls} font-mono uppercase`} value={search.pickupCode} onChange={e => setSearch(s => ({ ...s, pickupCode: e.target.value.toUpperCase() }))} /></Field>
                  <Field label="From"><input type="date" className={inputCls} value={search.pickupDate} onChange={e => setSearch(s => ({ ...s, pickupDate: e.target.value }))} /></Field>
                  <Field label="To"><input type="date" className={inputCls} value={search.dropoffDate} onChange={e => setSearch(s => ({ ...s, dropoffDate: e.target.value }))} /></Field>
                  <button onClick={runSearch} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{busy ? <Spinner light /> : <Search className="h-4 w-4" />} Search</button>
                </div>
                {result && !result.ok && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200"><b>{result.errorCode || 'Failed'}</b> {result.message}{result.requestId && <span className="block text-xs">Request {result.requestId}</span>}</div>}
                {result?.ok && (
                  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <p className="border-b border-slate-100 px-4 py-2.5 text-sm text-slate-600"><b className="text-slate-900">{result.offers.length}</b> car group{result.offers.length === 1 ? '' : 's'} available · answered in {result.ms} ms</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr><th className="px-4 py-2">Group</th><th className="px-4 py-2">Car</th><th className="px-4 py-2">Capacity</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Deposit</th><th className="px-4 py-2">Terms</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.offers.map((o: Offer, i: number) => (
                            <tr key={o.offerId || i}>
                              <td className="px-4 py-2.5 font-mono font-semibold">{o.sipp}</td>
                              <td className="px-4 py-2.5"><span className="font-medium text-slate-900">{o.makeModel}</span><span className="block text-xs text-slate-500">{[o.transmission, o.airConditioning ? 'A/C' : null, o.unlimitedMileage ? 'Unlimited km' : null].filter(Boolean).join(' · ')}</span></td>
                              <td className="px-4 py-2.5 text-slate-600">{o.seats ?? '—'} seats · {o.bags ?? '—'} bags · {o.doors ?? '—'} doors</td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">{money(o.total, o.currency)}</td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-600">{money(o.deposit, o.currency)}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-600">{o.cancellationPolicy || '—'} · {o.paymentType || '—'}{o.availableCount != null && <span className="block">{o.availableCount} free</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!result && <p className="text-sm text-slate-500">Searches go to the supplier exactly as customers' searches do, and show what they answer.</p>}
              </div>
            )}

            {tab === 'bookings' && (
              links === null ? <div className="flex justify-center py-10"><Spinner /></div> : links.length === 0 ? (
                <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">No bookings through this connection yet.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Hogicar</th><th className="px-4 py-2">Their reservation</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Updated</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {links.map(l => (
                        <tr key={l.id}>
                          <td className="px-4 py-2.5 font-mono font-semibold">{l.bookingRef}</td>
                          <td className="px-4 py-2.5 font-mono">{l.reservationId || '—'}{l.version ? <span className="ml-1 text-xs text-slate-400">v{l.version}</span> : null}</td>
                          <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(l.supplierStatus)}`}>{(l.supplierStatus || '—').replace('_', ' ')}</span>{l.lastError && <span className="mt-1 block text-xs text-rose-700">{l.lastError}</span>}</td>
                          <td className="px-4 py-2.5 text-slate-500">{l.updatedAt ? ago(l.updatedAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'log' && (
              calls === null ? <div className="flex justify-center py-10"><Spinner /></div> : calls.length === 0 ? (
                <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">No requests yet.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Quote the request id when you contact their support. Keys and passwords are masked.</p>
                  {calls.map(c => (
                    <div key={c.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                      <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                        {c.ok ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                        <span className="w-36 shrink-0 font-mono text-xs font-semibold text-slate-900">{c.operation}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{c.ok ? 'OK' : `${c.errorCode}${c.errorMessage ? ` · ${c.errorMessage}` : ''}`}{c.bookingRef ? ` · ${c.bookingRef}` : ''}</span>
                        <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{c.httpStatus ?? '—'} · {c.durationMs ?? 0} ms · {ago(c.createdAt)}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${expanded === c.id ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded === c.id && (
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">Request <span className="font-mono text-slate-700">{c.requestId}</span>{c.remoteRequestId && c.remoteRequestId !== c.requestId ? <> · theirs <span className="font-mono text-slate-700">{c.remoteRequestId}</span></> : null}</p>
                          {[['Sent', c.requestBody], ['Received', c.responseBody]].map(([label, body]) => body ? (
                            <div key={label as string}>
                              <p className="mb-1 text-xs font-semibold text-slate-600">{label}</p>
                              <pre className="max-h-72 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{pretty(body as string)}</pre>
                            </div>
                          ) : null)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'settings' && <ConnectionForm key={open.id} initial={open} busy={busy} onSave={v => save(v, open.id)} onDelete={() => remove(open)} />}
          </Drawer>
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
};

export default XmlSuppliersAdmin;
