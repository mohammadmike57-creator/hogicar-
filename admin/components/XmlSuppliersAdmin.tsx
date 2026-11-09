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
import Building from 'lucide-react/dist/esm/icons/building-2';
import Code from 'lucide-react/dist/esm/icons/code-xml';
import Store from 'lucide-react/dist/esm/icons/store';
import PauseCircle from 'lucide-react/dist/esm/icons/pause-circle';
import Play from 'lucide-react/dist/esm/icons/play';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import { adminFetch } from '../../lib/adminApi';
import { Hero, heroButton, heroPrimary, Segmented, num, inputCls, Field, useToast, Toast, Drawer, ErrorBanner, Spinner, CopyButton, ago } from './commercialUi';

type Conn = {
  id: number; name: string; supplierCode?: string; channelCode?: string; baseUrl?: string; authMode?: string; environment?: string;
  currency?: string; locationCodes?: string; defaultDriverAge?: number; commissionPercent?: number; logoUrl?: string; replacesVendorCodes?: string;
  pickupType?: string; pickupLabel?: string;
  active: boolean; bookingEnabled: boolean; timeoutSeconds?: number; webhookHeaderPrefix?: string; hasApiKey: boolean; hasWebhookSecret: boolean;
  webhookUrl?: string; supplierId?: string; lastPingAt?: string; lastPingOk?: boolean | null; lastError?: string; encryptionReady?: boolean;
  protocol?: string; otaVersion?: string; otaNamespace?: string; urlTemplate?: string; username?: string; apiKeyHeader?: string; oauthTokenUrl?: string;
  signRequests?: boolean; signingHeaderPrefix?: string; hasSigningSecret?: boolean; customMapping?: string;
  health?: Health;
};
type Health = { status: 'HEALTHY' | 'DEGRADED' | 'PAUSED' | 'TESTING' | 'UNKNOWN'; searches: number; successRate?: number | null; medianMs?: number | null;
  p95Ms?: number | null; failuresInARow: number; pausedUntil?: string | null; lastError?: string | null; lastErrorAt?: string | null; lastOkAt?: string | null;
  recent: { at: string; ok: boolean; ms: number; error?: string }[] };
type Preset = { id: string; label: string; description: string; protocol: string; otaVersion?: string | null; urlTemplate?: string | null; authMode: string; customMapping?: string | null };

const PROTOCOLS: Record<string, string> = {
  OTA: 'OpenTravel (OTA) XML', OTA_SOAP11: 'OTA in SOAP 1.1', OTA_SOAP12: 'OTA in SOAP 1.2', NATIVE_XML: 'UR-Drive / NCT native XML', CUSTOM_XML: 'Custom XML mapping',
};
const AUTH: Record<string, string> = {
  BEARER: 'Authorization: Bearer', API_KEY_HEADER: 'API key header', OTA_POS: 'OTA POS MessagePassword', WS_SECURITY: 'WS-Security UsernameToken',
  BASIC: 'Basic (username + password)', OAUTH2: 'OAuth 2.0 client credentials', BODY_CREDENTIALS: 'Key inside the message', NONE: 'None / in the mapping',
};
const authFits = (mode: string, protocol: string) => {
  const ota = protocol.startsWith('OTA');
  if (mode === 'OTA_POS') return ota;
  if (mode === 'WS_SECURITY') return protocol === 'OTA_SOAP11' || protocol === 'OTA_SOAP12';
  return true;
};
const formatLine = (c: Conn) => {
  const p = c.protocol || 'OTA';
  return p.startsWith('OTA') ? `${PROTOCOLS[p]} ${c.otaVersion || '2.000'}` : PROTOCOLS[p] || p;
};
type Offer = { offerId?: string; offerExpiresAt?: string; sipp?: string; makeModel?: string; seats?: number; bags?: number; doors?: number; transmission?: string;
  airConditioning?: boolean; total?: number; currency?: string; deposit?: number; unlimitedMileage?: boolean; cancellationPolicy?: string; paymentType?: string; availableCount?: number; pictureUrl?: string };
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

const HEALTH: Record<string, { label: string; cls: string; dot: string }> = {
  HEALTHY: { label: 'Healthy', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  DEGRADED: { label: 'Errors', cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  TESTING: { label: 'Recovering', cls: 'bg-sky-50 text-sky-800 ring-sky-600/20', dot: 'bg-sky-500' },
  PAUSED: { label: 'Paused', cls: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  UNKNOWN: { label: 'No searches yet', cls: 'bg-slate-50 text-slate-600 ring-slate-500/20', dot: 'bg-slate-300' },
};
const HealthBadge: React.FC<{ h?: Health }> = ({ h }) => {
  const t = HEALTH[h?.status || 'UNKNOWN'];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${t.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />{t.label}</span>;
};
/** The latest searches, oldest on the left: green answered (taller = slower), red failed. */
const SearchStrip: React.FC<{ h?: Health; slots?: number }> = ({ h, slots = 20 }) => {
  const recent = [...(h?.recent || [])].reverse().slice(-slots);
  const max = Math.max(800, ...recent.map(r => r.ms));
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-label={`Last ${recent.length} searches`}>
      {Array.from({ length: slots - recent.length }).map((_, i) => <span key={`e${i}`} className="h-1.5 flex-1 rounded-sm bg-slate-100" />)}
      {recent.map((r, i) => (
        <span key={i} title={`${new Date(r.at).toLocaleTimeString()} · ${r.ok ? `${r.ms} ms` : r.error}`}
          className={`flex-1 rounded-sm ${r.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ height: `${r.ok ? Math.max(18, Math.round((r.ms / max) * 100)) : 100}%` }} />
      ))}
    </div>
  );
};
const fmtMs = (ms?: number | null) => ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
const fmtRate = (r?: number | null) => r == null ? '—' : `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}%`;
const panelCls = 'space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200';
const PanelHead: React.FC<{ icon?: any; title: string; text?: string }> = ({ icon: Icon, title, text }) => (
  <div className="flex items-start gap-3">
    {Icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span>}
    <div><h3 className="text-sm font-semibold text-slate-900">{title}</h3>{text && <p className="mt-0.5 text-xs text-slate-500">{text}</p>}</div>
  </div>
);

const statusTone = (s?: string) => ({
  CONFIRMED: 'bg-emerald-50 text-emerald-700', PENDING: 'bg-amber-50 text-amber-800', IN_PROGRESS: 'bg-sky-50 text-sky-800',
  COMPLETED: 'bg-slate-100 text-slate-700', CANCELLED: 'bg-rose-50 text-rose-700', NO_SHOW: 'bg-rose-50 text-rose-700', FAILED: 'bg-rose-100 text-rose-800',
}[s || ''] || 'bg-slate-100 text-slate-600');

const EMPTY = { name: '', baseUrl: '', channelCode: 'HGC', supplierCode: '', authMode: 'BEARER', environment: 'SANDBOX', currency: 'USD', locationCodes: '',
  defaultDriverAge: 30, commissionPercent: 0, logoUrl: '', replacesVendorCodes: '', pickupType: '', pickupLabel: '', active: false, bookingEnabled: true, timeoutSeconds: 20,
  webhookHeaderPrefix: 'X-NCT', apiKey: '', webhookSecret: '',
  protocol: 'OTA', otaVersion: '2.000', otaNamespace: '', urlTemplate: '', username: '', apiKeyHeader: '', oauthTokenUrl: '',
  signRequests: false, signingHeaderPrefix: '', signingSecret: '', customMapping: '' };

/** The connection form, used to add a connection and in its Settings tab. */
const ConnectionForm: React.FC<{ initial?: Conn | null; busy: boolean; onSave: (v: any) => void; onDelete?: () => void }> = ({ initial, busy, onSave, onDelete }) => {
  const [v, setV] = React.useState<any>(() => initial ? { ...EMPTY, ...initial, apiKey: '', webhookSecret: '', signingSecret: '',
    replacesVendorCodes: initial.replacesVendorCodes || '', logoUrl: initial.logoUrl || '', locationCodes: initial.locationCodes || '',
    pickupType: initial.pickupType || '', pickupLabel: initial.pickupLabel || '', protocol: initial.protocol || 'OTA', otaVersion: initial.otaVersion || '2.000',
    otaNamespace: initial.otaNamespace || '', urlTemplate: initial.urlTemplate || '', username: initial.username || '', apiKeyHeader: initial.apiKeyHeader || '',
    oauthTokenUrl: initial.oauthTokenUrl || '', signRequests: !!initial.signRequests, signingHeaderPrefix: initial.signingHeaderPrefix || '',
    customMapping: initial.customMapping || '' } : { ...EMPTY });
  const set = (k: string, val: any) => setV((x: any) => ({ ...x, [k]: val }));
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [advanced, setAdvanced] = React.useState(() => !!(initial?.urlTemplate || initial?.otaNamespace));
  React.useEffect(() => { adminFetch('/api/admin/xml-suppliers/presets').then(setPresets).catch(() => setPresets([])); }, []);
  const usePreset = (p: Preset) => setV((x: any) => ({ ...x, protocol: p.protocol, otaVersion: p.otaVersion || x.otaVersion || '2.000', urlTemplate: p.urlTemplate || '',
    authMode: p.authMode, customMapping: p.protocol === 'CUSTOM_XML' ? (x.customMapping || p.customMapping || '') : x.customMapping }));
  const isOta = String(v.protocol).startsWith('OTA');
  const mappingError = React.useMemo(() => {
    if (v.protocol !== 'CUSTOM_XML' || !v.customMapping.trim()) return '';
    try { const j = JSON.parse(v.customMapping); return j && typeof j.operations === 'object' ? '' : 'Needs an "operations" section.'; }
    catch (e: any) { return `Not valid JSON: ${e?.message || ''}`; }
  }, [v.protocol, v.customMapping]);
  const save = () => {
    const body: any = { ...v };
    for (const k of ['apiKey', 'webhookSecret', 'signingSecret']) if (!body[k]) delete body[k];
    if (body.protocol !== 'CUSTOM_XML') delete body.customMapping;
    onSave(body);
  };
  return (
    <div className="space-y-4">
      <section className={panelCls}>
        <PanelHead icon={Building} title="Supplier" text="How the company appears to customers." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name customers see"><input className={inputCls} value={v.name} onChange={e => set('name', e.target.value)} placeholder="UR-Drive" /></Field>
          <Field label="Logo link (optional)"><input className={inputCls} value={v.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://…/logo.png" /></Field>
        </div>
      </section>
      <section className={panelCls}>
        <PanelHead icon={Code} title="Message format" text="Pick the style from their integration guide; every value can still be changed." />
        {presets.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map(p => {
              const on = v.protocol === p.protocol && (p.urlTemplate || '') === (v.urlTemplate || '') && (!p.protocol.startsWith('OTA') || (p.otaVersion || '2.000') === v.otaVersion);
              return (
                <button key={p.id} type="button" onClick={() => usePreset(p)} aria-pressed={on}
                  className={`rounded-xl p-3 text-left ring-1 ring-inset ${on ? 'bg-white ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:bg-slate-50'}`}>
                  <span className="block text-sm font-semibold text-slate-900">{p.label}</span>
                  <span className="block text-xs text-slate-500">{p.description}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Format">
            <select className={inputCls} value={v.protocol} onChange={e => { const p = e.target.value; setV((x: any) => ({ ...x, protocol: p, authMode: authFits(x.authMode, p) ? x.authMode : 'BEARER' })); }}>
              {Object.entries(PROTOCOLS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </Field>
          {isOta && (
            <Field label="OTA version" hint="The Version attribute on every message, as their guide says.">
              <input className={`${inputCls} font-mono`} list="ota-versions" value={v.otaVersion} onChange={e => set('otaVersion', e.target.value)} placeholder="2.000" />
              <datalist id="ota-versions">{['2.000', '1.003', '1.002', '1.000', '3.000', '4.000', '5.000', '6.000', '2018.1', '2024.1'].map(x => <option key={x} value={x} />)}</datalist>
            </Field>
          )}
        </div>
        <Field label={v.protocol === 'OTA_SOAP11' || v.protocol === 'OTA_SOAP12' ? 'SOAP address' : 'Address'}
          hint={v.urlTemplate ? 'Used as {base} in the address pattern below.' : v.protocol === 'OTA_SOAP11' || v.protocol === 'OTA_SOAP12' ? 'Every message is posted to this one address.' : isOta ? 'The message name is added to it, e.g. …/HGC/OTA_VehAvailRate' : v.protocol === 'CUSTOM_XML' ? 'Each operation\'s "path" from the mapping is added to it.' : 'The operation name is added to it, e.g. …/xml/v1/Availability'}>
          <input className={`${inputCls} font-mono`} value={v.baseUrl} onChange={e => set('baseUrl', e.target.value)} placeholder="https://api.supplier.com/ota/v1/HGC" />
        </Field>
        <button type="button" onClick={() => setAdvanced(a => !a)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2]">
          <ChevronDown className={`h-3.5 w-3.5 transition ${advanced ? 'rotate-180' : ''}`} /> Address pattern and namespace
        </button>
        {advanced && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Address pattern (optional)" hint="{base} {message} {messageRQ} {channel} {version}">
              <input className={`${inputCls} font-mono`} value={v.urlTemplate} onChange={e => set('urlTemplate', e.target.value)} placeholder="{base}/ota/2024A/{channel}/{message}" />
            </Field>
            {isOta && (
              <Field label="OTA namespace (optional)" hint="Leave empty for the standard OpenTravel namespace.">
                <input className={`${inputCls} font-mono`} value={v.otaNamespace} onChange={e => set('otaNamespace', e.target.value)} placeholder="http://www.opentravel.org/OTA/2003/05" />
              </Field>
            )}
          </div>
        )}
        {v.protocol === 'CUSTOM_XML' && (
          <Field label="Custom mapping (JSON)" hint="Request templates and where to read each answer. Paths use element names with / and @attribute. Operations left out are reported as not supported.">
            <textarea spellCheck={false} rows={14} className={`${inputCls} h-auto font-mono text-xs leading-5`} value={v.customMapping} onChange={e => set('customMapping', e.target.value)}
              placeholder='{"operations": {"availability": {"path": "Search", "request": "<Search>…</Search>", "list": "Cars/Car", "fields": {"offerId": "@id", "total": "Price/@total"}}}}' />
            {mappingError && <span className="mt-1 block text-xs font-medium text-rose-700">{mappingError}</span>}
          </Field>
        )}
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
      <section className={panelCls}>
        <PanelHead icon={KeyRound} title="Sign-in" text="How Hogicar proves who it is. Secrets are stored encrypted and never shown again." />
        <div className="grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
          <Field label="Method">
            <select className={inputCls} value={v.authMode} onChange={e => set('authMode', e.target.value)}>
              {Object.entries(AUTH).filter(([k]) => authFits(k, v.protocol)).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </Field>
          {v.authMode !== 'NONE' && (
            <Field label={`${initial?.hasApiKey ? 'New ' : ''}${v.authMode === 'BASIC' || v.authMode === 'WS_SECURITY' ? 'password' : v.authMode === 'OAUTH2' ? 'client secret' : 'API key'}${initial?.hasApiKey ? ' (leave empty to keep the saved one)' : ''}`}
              hint="Stored encrypted. It is never shown again or written to the request log.">
              <input type="password" autoComplete="new-password" className={`${inputCls} font-mono`} value={v.apiKey} onChange={e => set('apiKey', e.target.value)} placeholder={initial?.hasApiKey ? '•••••••• saved' : 'Paste what they sent you'} />
            </Field>
          )}
        </div>
        {v.authMode === 'NONE' && <p className="text-xs text-slate-500">No sign-in header is sent. For a custom mapping, put {'{apiKey}'} in the request templates instead; the key above is still stored encrypted.</p>}
        {v.authMode === 'NONE' && (
          <Field label={initial?.hasApiKey ? 'New key for {apiKey} (optional)' : 'Key for {apiKey} (optional)'}>
            <input type="password" autoComplete="new-password" className={`${inputCls} font-mono`} value={v.apiKey} onChange={e => set('apiKey', e.target.value)} placeholder={initial?.hasApiKey ? '•••••••• saved' : ''} />
          </Field>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {['BASIC', 'WS_SECURITY', 'OAUTH2'].includes(v.authMode) && (
            <Field label={v.authMode === 'OAUTH2' ? 'Client ID' : 'Username'} hint="Leave empty to use our channel code.">
              <input className={`${inputCls} font-mono`} value={v.username} onChange={e => set('username', e.target.value)} placeholder={v.channelCode || 'HGC'} />
            </Field>
          )}
          {v.authMode === 'API_KEY_HEADER' && (
            <Field label="Header name"><input className={`${inputCls} font-mono`} value={v.apiKeyHeader} onChange={e => set('apiKeyHeader', e.target.value)} placeholder="X-Api-Key" /></Field>
          )}
          {v.authMode === 'OAUTH2' && (
            <Field label="Token address"><input className={`${inputCls} font-mono`} value={v.oauthTokenUrl} onChange={e => set('oauthTokenUrl', e.target.value)} placeholder="https://auth.supplier.com/oauth/token" /></Field>
          )}
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <span><span className="block text-sm font-semibold text-slate-900">Sign every request (HMAC-SHA256)</span><span className="mt-0.5 block text-xs text-slate-500">Adds a timestamp and signature header, for suppliers that require signed requests.</span></span>
          <span className="relative shrink-0">
            <input type="checkbox" className="peer sr-only" checked={!!v.signRequests} onChange={e => set('signRequests', e.target.checked)} />
            <span className="block h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
            <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>
        {v.signRequests && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <Field label={initial?.hasSigningSecret ? 'New request-signing secret (leave empty to keep)' : 'Request-signing secret'}>
              <input type="password" autoComplete="new-password" className={`${inputCls} font-mono`} value={v.signingSecret} onChange={e => set('signingSecret', e.target.value)} placeholder={initial?.hasSigningSecret ? '•••••••• saved' : 'From the supplier'} />
            </Field>
            <Field label="Header prefix"><input className={`${inputCls} font-mono`} value={v.signingHeaderPrefix} onChange={e => set('signingHeaderPrefix', e.target.value)} placeholder="X-URD" /></Field>
          </div>
        )}
      </section>
      <section className={panelCls}>
        <PanelHead icon={Store} title="Selling" text="Where their cars are sold and how customers pay." />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Locations they serve" hint="Codes, comma separated"><input className={`${inputCls} font-mono uppercase`} value={v.locationCodes} onChange={e => set('locationCodes', e.target.value.toUpperCase())} placeholder="AMM" /></Field>
          <Field label="Driver age in searches"><input type="number" className={inputCls} value={v.defaultDriverAge} onChange={e => set('defaultDriverAge', e.target.value)} /></Field>
          <Field label="Hogicar markup %" hint="Added on top of their price and paid online; their full price is paid at the counter"><input type="number" step="0.1" className={inputCls} value={v.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <Field label="Pick-up type">
            <select className={inputCls} value={v.pickupType} onChange={e => set('pickupType', e.target.value)}>
              <option value="">None (city branch / office)</option>
              <option value="IN_TERMINAL">In terminal</option>
              <option value="MEET_AND_GREET">Meet &amp; greet</option>
              <option value="SHUTTLE_BUS">Shuttle bus</option>
            </select>
          </Field>
          <Field label="Pick-up wording customers see" hint="Shown when no pick-up type applies, e.g. their station from the guide.">
            <input className={inputCls} value={v.pickupLabel} onChange={e => set('pickupLabel', e.target.value)} placeholder="Main branch, Amman" />
          </Field>
        </div>
        <Field label="Hide their cars from other feeds" hint="Vendor codes of the same company in CheapTickets, e.g. URDRIVEJO, so their cars are not shown twice.">
          <input className={`${inputCls} font-mono uppercase`} value={v.replacesVendorCodes} onChange={e => set('replacesVendorCodes', e.target.value.toUpperCase())} placeholder="URDRIVEJO" />
        </Field>
      </section>
      <section className={panelCls}>
        <PanelHead icon={Webhook} title="Status updates (webhooks)" text="Cancellations, pick-ups and no-shows from their counter, verified with a shared secret." />
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
  // Health figures change with every customer search: refresh quietly while the page is open.
  React.useEffect(() => {
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
    return () => window.clearInterval(t);
  }, [load]);

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

  const resume = async (c: Conn) => {
    try { await adminFetch(`/api/admin/xml-suppliers/${c.id}/resume`, { method: 'POST' }); notify(`${c.name} is back in search`); await load(); }
    catch (e: any) { notify(errorText(e, 'Could not resume.'), 'err'); }
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

  const [rules, setRules] = React.useState<Record<string, any>>({});
  const checkPrice = async (o: Offer) => {
    if (!open) return;
    const k = o.offerId || o.sipp || '';
    setRules(r => ({ ...r, [k]: { loading: true } }));
    try {
      const res = await adminFetch(`/api/admin/xml-suppliers/${open.id}/rate-rule`, { method: 'POST', body: JSON.stringify({ ...search, offerId: o.offerId, sipp: o.sipp }) });
      setRules(r => ({ ...r, [k]: res }));
    } catch (e: any) { setRules(r => ({ ...r, [k]: { ok: false, message: errorText(e, 'The check failed.') } })); }
  };
  const runSearch = async () => {
    if (!open) return;
    setBusy(true); setResult(null); setRules({});
    try { setResult(await adminFetch(`/api/admin/xml-suppliers/${open.id}/test-search`, { method: 'POST', body: JSON.stringify(search) })); }
    catch (e: any) { setResult({ ok: false, message: errorText(e, 'The search failed.') }); }
    finally { setBusy(false); }
  };

  const items = list || [];
  const live = items.filter(c => c.active).length;
  const failing = items.filter(c => c.lastPingOk === false).length;
  const paused = items.filter(c => c.health?.status === 'PAUSED').length;

  const checklist = (c: Conn) => [
    { done: !!c.baseUrl, label: 'Address and format set', hint: c.baseUrl ? `${formatLine(c)} · ${c.baseUrl}` : 'Add the address from their guide' },
    { done: c.hasApiKey || c.authMode === 'NONE', label: 'Sign-in saved (encrypted)', hint: c.hasApiKey ? `${AUTH[c.authMode || 'BEARER'] || c.authMode}${c.signRequests ? ' · signed requests' : ''}` : c.authMode === 'NONE' ? 'No sign-in header' : 'Paste the key they send you separately' },
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
        subtitle="Rental companies connected through their own XML booking API (OpenTravel OTA in any version, SOAP, or their own XML format): live prices in search, bookings and cancellations in their system, status updates back to Hogicar."
        loading={list === null}
        actions={<>
          <button onClick={load} className={heroButton}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => setAdding(true)} className={heroPrimary}><Plus className="h-4 w-4" /> Add connection</button>
        </>}
        kpis={[
          { label: 'Connections', value: num(items.length), Icon: Plug },
          { label: 'Live in search', value: num(live), Icon: Search },
          { label: 'In production', value: num(items.filter(c => c.environment === 'PRODUCTION').length), Icon: ShieldCheck, note: `${num(items.length - items.filter(c => c.environment === 'PRODUCTION').length)} in sandbox` },
          { label: 'Needs attention', value: num(failing + paused), Icon: Activity, note: paused ? `${num(paused)} paused automatically` : failing ? 'Connection check failed' : 'All good' },
        ]}
      />
      {error && <ErrorBanner text={error} onRetry={load} />}

      {list !== null && items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><Plug className="h-6 w-6 text-slate-400" /></span>
          <p className="mt-3 text-base font-semibold text-slate-900">No XML suppliers yet</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">Add a rental company that sent you an XML integration guide (OTA, SOAP or their own format), such as UR-Drive Jordan. Start in their sandbox; switch it on when their certification passes.</p>
          <button onClick={() => setAdding(true)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add connection</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map(c => (
            <div key={c.id} className="group flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300">
              <div className="flex items-start gap-3 p-5 pb-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-sm font-bold text-white">
                  {c.logoUrl ? <img src={c.logoUrl} alt="" className="h-full w-full bg-white object-contain p-1" /> : c.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate text-base font-semibold text-slate-900">{c.name}</p><EnvPill env={c.environment} /></div>
                  <p className="mt-0.5 truncate text-xs text-slate-500"><span className="font-mono">{c.channelCode || '—'} → {c.supplierCode || '—'}</span> · {formatLine(c)}</p>
                </div>
                <StatusDot c={c} />
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 bg-slate-50/60">
                {[['Health', <HealthBadge key="h" h={c.health} />], ['Success', fmtRate(c.health?.successRate)], ['Typical answer', fmtMs(c.health?.medianMs)]].map(([k, v]) => (
                  <div key={k as string} className="min-w-0 px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k}</p><div className="mt-1 truncate text-sm font-semibold text-slate-900">{v}</div></div>
                ))}
              </div>
              <div className="space-y-3 p-5 pt-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400"><span>Last searches</span><span>{c.health?.searches ? `${c.health.searches} recorded` : 'none yet'}</span></div>
                  <SearchStrip h={c.health} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(c.locationCodes || '').split(',').filter(Boolean).map(l => <span key={l} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"><MapPin className="h-3 w-3" />{l}</span>)}
                  {!c.locationCodes && <span className="text-xs text-slate-400">No locations yet</span>}
                  <span className="ml-auto text-xs text-slate-500">+{Number(c.commissionPercent || 0)}% markup online · their price at counter</span>
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${c.health?.status === 'PAUSED' ? 'bg-rose-50 text-rose-800' : c.lastPingOk === false ? 'bg-rose-50 text-rose-800' : c.lastPingOk ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-500'}`}>
                  {c.health?.status === 'PAUSED' ? <PauseCircle className="h-4 w-4 shrink-0" /> : c.lastPingOk === false ? <XCircle className="h-4 w-4 shrink-0" /> : c.lastPingOk ? <CheckCircle className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{c.health?.status === 'PAUSED' ? `Left out of search until ${new Date(c.health.pausedUntil!).toLocaleTimeString()} · ${c.health.lastError || ''}` : c.lastPingAt ? `Connection check ${c.lastPingOk ? 'passed' : 'failed'} ${ago(c.lastPingAt)}${c.lastError ? ` · ${c.lastError}` : ''}` : 'Connection not checked yet'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => ping(c)} disabled={pinging === c.id} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-60">
                    {pinging === c.id ? <Spinner /> : <Activity className="h-4 w-4" />} Test connection
                  </button>
                  <button onClick={() => { setOpenId(c.id); setTab('overview'); }} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800">Open</button>
                </div>
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
            {tab === 'overview' && (() => {
              const h = open.health;
              const pct = Number(open.commissionPercent || 0);
              const example = 100;
              const markup = Math.round(example * pct) / 100;
              return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <EnvPill env={open.environment} /><StatusDot c={open} /><HealthBadge h={h} />
                  <span className="text-xs text-slate-500">{formatLine(open)}</span>
                  <button onClick={() => ping(open)} disabled={pinging === open.id} className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{pinging === open.id ? <Spinner light /> : <Activity className="h-4 w-4" />} Test connection</button>
                </div>

                {h?.status === 'PAUSED' && (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
                    <PauseCircle className="h-5 w-5 shrink-0 text-rose-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-rose-900">Paused: left out of search until {new Date(h.pausedUntil!).toLocaleTimeString()}</p>
                      <p className="text-xs text-rose-800">{h.failuresInARow} failed searches in a row{h.lastError ? ` · ${h.lastError}` : ''}. Customers are not kept waiting; one test search runs when the pause ends. Bookings and cancellations still go through.</p>
                    </div>
                    <button onClick={() => resume(open)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"><Play className="h-4 w-4" /> Resume now</button>
                  </div>
                )}

                <div className={panelCls}>
                  <PanelHead icon={Gauge} title="Search health" text="How their system answered the latest customer searches (since the server last started)." />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[['Success rate', fmtRate(h?.successRate)], ['Typical answer', fmtMs(h?.medianMs)], ['Slowest 5%', fmtMs(h?.p95Ms)], ['Searches', String(h?.searches ?? 0)]].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k}</p><p className="mt-0.5 text-lg font-semibold text-slate-900">{v}</p></div>
                    ))}
                  </div>
                  <SearchStrip h={h} slots={40} />
                  <p className="text-xs text-slate-500">{h?.lastError ? <>Last error {h.lastErrorAt ? ago(h.lastErrorAt) : ''}: <span className="font-mono text-slate-700">{h.lastError}</span>. </> : null}After 3 failed searches in a row the supplier is paused automatically (1 minute, doubling up to 15), so a supplier that is down never slows the site.</p>
                </div>

                <div className={panelCls}>
                  <PanelHead icon={Wallet} title="How customers pay" text="Hogicar's markup is added on top of the supplier's price and paid online; the supplier's full price is paid at their counter." />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[['Customer sees', money(example + markup, open.currency), 'Their price + Hogicar markup'], ['Pays online to Hogicar', money(markup, open.currency), `${pct}% markup`], ['Pays at their counter', money(example, open.currency), 'Their full price (net rate)']].map(([k, v, n]) => (
                      <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-xs text-slate-500">{k}</p><p className="mt-0.5 text-lg font-semibold text-slate-900">{v}</p><p className="text-[11px] text-slate-400">{n}</p></div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Example when their price is {money(example, open.currency)}. They are always asked for, and collect, their own full price; every booking sent to them says so.{pct <= 0 ? ' With a 0% markup nothing is paid online, so these cars cannot be booked on the website.' : ''}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-2xl bg-white ring-1 ring-slate-200">
                    <p className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Go-live checklist <span className="ml-1 text-xs font-normal text-slate-500">{checklist(open).filter(i => i.done).length}/{checklist(open).length}</span></p>
                    <ul className="divide-y divide-slate-100">
                      {checklist(open).map(i => (
                        <li key={i.label} className="flex items-start gap-3 px-5 py-3">
                          {i.done ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
                          <span className="min-w-0"><span className="block text-sm font-medium text-slate-900">{i.label}</span><span className="block break-words text-xs text-slate-500">{i.hint}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${panelCls} self-start`}>
                    <PanelHead icon={Webhook} title="Your webhook address" text={'Send this to the supplier ("Your HTTPS webhook URL"). Events must be signed with the secret; old, wrongly signed or repeated events are refused.'} />
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                      <code className="min-w-0 flex-1 truncate text-xs text-slate-800">{open.webhookUrl}</code>
                      <CopyButton text={open.webhookUrl || ''} label="Copy" className="h-8 px-2 text-slate-700 hover:bg-white" onCopied={() => notify('Webhook address copied')} />
                    </div>
                  </div>
                </div>
                {!open.encryptionReady && <ErrorBanner text="The server has no encryption key (AFFILIATE_MASTER_ENCRYPTION_KEY), so API keys can't be saved yet." onRetry={load} />}
              </div>
              );
            })()}

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
                    <p className="border-b border-slate-100 px-4 py-2.5 text-sm text-slate-600"><b className="text-slate-900">{result.offers.length}</b> car group{result.offers.length === 1 ? '' : 's'} available · answered in {result.ms} ms{result.fromLibrary != null && <> · <b className="text-slate-900">{result.fromLibrary}</b> with the Car library picture</>}</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr><th className="px-4 py-2">Picture</th><th className="px-4 py-2">Group</th><th className="px-4 py-2">Car</th><th className="px-4 py-2">Capacity</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Deposit</th><th className="px-4 py-2">Terms</th><th className="px-4 py-2">Final price</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.offers.map((o: Offer, i: number) => (
                            <tr key={o.offerId || i}>
                              {(() => {
                                const img = result.images?.[o.offerId || o.sipp] ?? o.pictureUrl ?? '';
                                const lib = !!img && img !== (o.pictureUrl || '');
                                return (
                                  <td className="px-4 py-2.5">
                                    <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200">{img ? <img src={img} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-slate-400">No picture</span>}</div>
                                    <span className={`mt-1 block text-[10px] font-semibold ${lib ? 'text-emerald-700' : 'text-slate-500'}`}>{lib ? 'Car library' : img ? "Supplier's" : '—'}</span>
                                  </td>
                                );
                              })()}
                              <td className="px-4 py-2.5 font-mono font-semibold">{o.sipp}</td>
                              <td className="px-4 py-2.5"><span className="font-medium text-slate-900">{o.makeModel}</span><span className="block text-xs text-slate-500">{[o.transmission, o.airConditioning ? 'A/C' : null, o.unlimitedMileage ? 'Unlimited km' : null].filter(Boolean).join(' · ')}</span></td>
                              <td className="px-4 py-2.5 text-slate-600">{o.seats ?? '—'} seats · {o.bags ?? '—'} bags · {o.doors ?? '—'} doors</td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">{money(o.total, o.currency)}</td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-600">{money(o.deposit, o.currency)}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-600">{o.cancellationPolicy || '—'} · {o.paymentType || '—'}{o.availableCount != null && <span className="block">{o.availableCount} free</span>}</td>
                              {(() => {
                                const r = rules[o.offerId || o.sipp || ''];
                                if (!r) return <td className="px-4 py-2.5"><button onClick={() => checkPrice(o)} className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Check</button></td>;
                                if (r.loading) return <td className="px-4 py-2.5"><Spinner /></td>;
                                if (!r.ok) return <td className="px-4 py-2.5 text-xs text-rose-700"><b>{r.errorCode || 'Failed'}</b> {r.message}</td>;
                                const same = r.rule?.total == null || Number(r.rule.total) === Number(o.total);
                                return (
                                  <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                                    <span className={`font-semibold ${same ? 'text-emerald-700' : 'text-amber-800'}`}>{r.rule?.total == null ? 'No price returned' : money(r.rule.total, r.rule.currency)}</span>
                                    <span className="block text-slate-500">{same ? 'Same as search' : 'Changed since search'}{r.rule?.minDriverAge ? ` · age ${r.rule.minDriverAge}+` : ''}</span>
                                  </td>
                                );
                              })()}
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
