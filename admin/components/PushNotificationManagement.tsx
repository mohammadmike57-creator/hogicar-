import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Bell from 'lucide-react/dist/esm/icons/bell-ring';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Send from 'lucide-react/dist/esm/icons/send';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Search from 'lucide-react/dist/esm/icons/search';
import Users from 'lucide-react/dist/esm/icons/users';
import Target from 'lucide-react/dist/esm/icons/target';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Play from 'lucide-react/dist/esm/icons/play';
import X from 'lucide-react/dist/esm/icons/x';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Info from 'lucide-react/dist/esm/icons/info';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { adminFetch } from '../../lib/adminApi';

// ------------------------------------------------------------------ types & helpers

type Campaign = {
  id: number; name: string; title: string; subtitle?: string; body: string; imageUrl?: string; deepLink?: string;
  type?: string; priority?: string; sound?: string; badgeCount?: number; schedule?: string; scheduleTime?: string;
  audience?: string; targetValue?: string; status: string; sentCount: number; acceptedCount?: number; deliveredCount: number;
  openedCount: number; failedCount: number; lastError?: string; createdAt?: string; sentAt?: string;
};
type Device = {
  id: number; deviceId: string; expoToken: string; platform?: string; deviceModel?: string; osVersion?: string; appVersion?: string;
  language?: string; country?: string; city?: string; lastSeen?: string; active: boolean; prefOffers: boolean; createdAt?: string; userId?: number;
};
type Stats = {
  totalDevices: number; activeTokens: number; iosDevices: number; androidDevices: number; last24Hours: number; marketingOptIn?: number;
  campaignsSent: number; scheduledCampaigns: number; sentNotifications?: number; acceptedNotifications?: number; deliveredNotifications: number;
  failedNotifications: number; openedNotifications?: number; deliveryRate: number; expoAccessTokenConfigured?: boolean; recentLogs: any[];
};
type SendResult = { targeted: number; accepted: number; failed: number; invalid: number; errors: string[] };
type Option = { value: string; count: number };
type Options = { countries: Option[]; cities: Option[]; platforms: Option[]; languages: Option[] };

/** Server times are UTC without a zone. */
const utc = (s?: string) => (s ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`) : null);
const fmtWhen = (s?: string) => {
  const d = utc(s);
  return d && !isNaN(d.getTime()) ? d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
};
const ago = (s?: string) => {
  const d = utc(s);
  if (!d || isNaN(d.getTime())) return 'Never';
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  return days < 30 ? `${days} d ago` : d.toLocaleDateString();
};
const num = (n?: number) => (n ?? 0).toLocaleString();
const msgOf = (e: any) => String(e?.message || 'Something went wrong.').replace(/^Request failed with status \d+: /, '');
const toUtcLocal = (local: string) => {
  const d = new Date(local);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 19);
};
const toLocalInput = (s?: string) => {
  const d = utc(s);
  if (!d || isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const AUDIENCES: { value: string; label: string; hint: string; needs?: keyof Options }[] = [
  { value: 'EVERYONE', label: 'Everyone', hint: 'All active devices' },
  { value: 'PLATFORM', label: 'iOS or Android', hint: 'One platform', needs: 'platforms' },
  { value: 'COUNTRY', label: 'Country', hint: 'Devices in one country', needs: 'countries' },
  { value: 'CITY', label: 'City', hint: 'Devices in one city', needs: 'cities' },
  { value: 'LANGUAGE', label: 'Language', hint: 'Phone language', needs: 'languages' },
  { value: 'ACTIVE_USERS', label: 'Active this week', hint: 'Opened the app in 7 days' },
  { value: 'NEW_USERS', label: 'New installs', hint: 'Registered in 24 hours' },
  { value: 'UPCOMING_RENTALS', label: 'Upcoming rentals', hint: 'Pick-up in the next 7 days' },
  { value: 'ABANDONED_CHECKOUT', label: 'Abandoned checkout', hint: 'Started booking, didn’t pay' },
  { value: 'RETURNING_CUSTOMERS', label: 'Returning customers', hint: '2+ completed rentals' },
];
const audienceLabel = (c: Pick<Campaign, 'audience' | 'targetValue'>) => {
  const a = AUDIENCES.find(x => x.value === (c.audience || 'EVERYONE'));
  const v = c.audience === 'PLATFORM' ? ({ ios: 'iOS', android: 'Android' } as Record<string, string>)[String(c.targetValue).toLowerCase()] || c.targetValue : c.targetValue;
  return c.audience === 'PLATFORM' && v ? `${v} only` : `${a?.label || c.audience}${v ? `: ${v}` : ''}`;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  PENDING: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  SENDING: { label: 'Sending', cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  SENT: { label: 'Sent', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  FAILED: { label: 'Failed', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
};
const StatusPill: React.FC<{ c: Campaign }> = ({ c }) => {
  const key = c.status === 'PENDING' && c.schedule !== 'SCHEDULED' ? 'DRAFT' : c.status;
  const s = STATUS[key] || STATUS.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}>
      {key === 'SENDING' && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-indigo-500" />}{s.label}
    </span>
  );
};

const inputCls = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm';

const Toast: React.FC<{ t: { text: string; tone: 'ok' | 'err' } | null }> = ({ t }) => createPortal(
  <AnimatePresence>
    {t && (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} role="status"
        className={`fixed bottom-6 left-1/2 z-[300] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-xl ${t.tone === 'err' ? 'bg-rose-600' : 'bg-slate-900'}`}>
        {t.tone === 'err' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}<span className="truncate">{t.text}</span>
      </motion.div>
    )}
  </AnimatePresence>,
  document.body,
);

const Sheet: React.FC<{ title: string; eyebrow?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ title, eyebrow, onClose, children, footer, wide }) => {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 320 }}
        className={`relative flex h-full w-full flex-col bg-slate-50 shadow-2xl ${wide ? 'max-w-[1040px]' : 'max-w-[520px]'}`}>
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#007ac2]">{eyebrow}</p>}
            <h2 className="mt-0.5 text-xl font-semibold text-slate-900">{title}</h2>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-slate-200 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">{footer}</footer>}
      </motion.aside>
    </div>,
    document.body,
  );
};

// ------------------------------------------------------------------ phone preview

const PhonePreview: React.FC<{ title: string; subtitle?: string; body: string; imageUrl?: string; platform: 'ios' | 'android' }> = ({ title, subtitle, body, imageUrl, platform }) => {
  const img = imageUrl && imageUrl.startsWith('https://') ? imageUrl : '';
  return (
    <div className="relative mx-auto h-[500px] w-[250px] overflow-hidden rounded-[2.6rem] border-[7px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b2545] via-[#1d4f91] to-[#f57c00]/80" />
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="relative px-3 pt-12 text-center text-white">
        <p className="text-5xl font-light tracking-tight">9:41</p>
        <p className="text-xs text-white/80">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <motion.div key={platform} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={`relative mx-2.5 mt-6 overflow-hidden ${platform === 'ios' ? 'rounded-2xl bg-white/75 backdrop-blur-xl' : 'rounded-[20px] bg-white'} p-3 shadow-lg`}>
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0b2545]">
            <svg viewBox="0 0 200 200" className="h-3.5 w-3.5"><path d="M52 106 Q100 58 148 94" stroke="#F57C00" strokeWidth="22" fill="none" strokeLinecap="round" /><line x1="70" y1="132" x2="130" y2="132" stroke="#F57C00" strokeWidth="16" strokeLinecap="round" /></svg>
          </span>
          <span className={`text-[10px] font-semibold ${platform === 'ios' ? 'uppercase tracking-wide text-slate-600' : 'text-slate-700'}`}>Hogicar</span>
          <span className="ml-auto text-[10px] text-slate-500">now</span>
        </div>
        <p className="mt-1 truncate text-[12.5px] font-semibold text-slate-900">{title || 'Notification title'}</p>
        {subtitle && platform === 'ios' && <p className="truncate text-[11.5px] font-medium text-slate-800">{subtitle}</p>}
        <p className="mt-0.5 line-clamp-4 text-[11.5px] leading-snug text-slate-700">{body || 'Your message appears here.'}</p>
        {img && <img src={img} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
      </motion.div>
    </div>
  );
};

// ------------------------------------------------------------------ composer

type Draft = {
  name: string; title: string; subtitle: string; body: string; imageUrl: string; deepLink: string; type: string;
  sound: string; priority: string; audience: string; targetValue: string; when: 'now' | 'later'; scheduleLocal: string;
};
const emptyDraft = (): Draft => ({ name: '', title: '', subtitle: '', body: '', imageUrl: '', deepLink: '', type: 'MARKETING', sound: 'default', priority: 'high', audience: 'EVERYONE', targetValue: '', when: 'now', scheduleLocal: '' });
const draftOf = (c: Campaign): Draft => ({
  name: c.name || '', title: c.title || '', subtitle: c.subtitle || '', body: c.body || '', imageUrl: c.imageUrl || '', deepLink: c.deepLink || '',
  type: c.type || 'MARKETING', sound: c.sound || 'default', priority: c.priority || 'high', audience: c.audience || 'EVERYONE', targetValue: c.targetValue || '',
  when: c.schedule === 'SCHEDULED' ? 'later' : 'now', scheduleLocal: toLocalInput(c.scheduleTime),
});

const LINKS = [
  { label: 'Home', value: 'hogicar://' },
  { label: 'My bookings', value: 'hogicar://bookings' },
  { label: 'Website', value: 'https://www.hogicar.com' },
];

const Composer: React.FC<{
  campaign: Campaign | null; options: Options | null; devices: Device[];
  onClose: () => void; onDone: (msg: string) => void;
}> = ({ campaign, options, devices, onClose, onDone }) => {
  const [d, setD] = React.useState<Draft>(() => (campaign ? draftOf(campaign) : emptyDraft()));
  const [preview, setPreview] = React.useState<'ios' | 'android'>('ios');
  const [estimate, setEstimate] = React.useState<{ devices: number; ios: number; android: number } | null>(null);
  const [busy, setBusy] = React.useState<null | 'draft' | 'send' | 'test'>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const [testDevice, setTestDevice] = React.useState('');
  const [testResult, setTestResult] = React.useState<SendResult | null>(null);
  const set = (p: Partial<Draft>) => { setD(x => ({ ...x, ...p })); setError(null); setConfirm(false); };

  const aud = AUDIENCES.find(a => a.value === d.audience) || AUDIENCES[0];
  const choices = aud.needs && options ? options[aud.needs] : [];

  React.useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ audience: d.audience, type: d.type, ...(d.targetValue ? { value: d.targetValue } : {}) });
    const t = window.setTimeout(() => {
      adminFetch(`/api/push/audience/estimate?${q}`).then(r => { if (alive) setEstimate(r); }).catch(() => { if (alive) setEstimate(null); });
    }, 250);
    return () => { alive = false; window.clearTimeout(t); };
  }, [d.audience, d.targetValue, d.type]);

  const activeDevices = devices.filter(x => x.active);

  const payload = (status?: string) => ({
    name: d.name.trim() || d.title.trim(), title: d.title.trim(), subtitle: d.subtitle.trim() || null, body: d.body.trim(),
    imageUrl: d.imageUrl.trim() || null, deepLink: d.deepLink.trim() || null, type: d.type, sound: d.sound, priority: d.priority,
    audience: d.audience, targetValue: aud.needs ? d.targetValue : null,
    schedule: d.when === 'later' ? 'SCHEDULED' : 'IMMEDIATE',
    scheduleTime: d.when === 'later' ? toUtcLocal(d.scheduleLocal) : null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(status ? { status } : {}),
  });

  const check = () => {
    if (!d.title.trim()) return 'Add a title.';
    if (!d.body.trim()) return 'Add a message.';
    if (d.imageUrl && !d.imageUrl.startsWith('https://')) return 'The image must be an https:// link.';
    if (aud.needs && !d.targetValue) return `Choose a ${aud.label.toLowerCase()}.`;
    if (d.when === 'later') {
      if (!d.scheduleLocal) return 'Pick a date and time.';
      if (new Date(d.scheduleLocal).getTime() < Date.now()) return 'The send time is in the past.';
    }
    return null;
  };

  const save = async (mode: 'draft' | 'send') => {
    const problem = mode === 'send' ? check() : (!d.title.trim() || !d.body.trim()) ? 'Add a title and a message.' : null;
    if (problem) { setError(problem); return; }
    if (mode === 'send' && d.when === 'now' && !confirm) { setConfirm(true); return; }
    setBusy(mode);
    try {
      const body = JSON.stringify(payload(mode === 'draft' ? 'DRAFT' : undefined));
      if (campaign) await adminFetch(`/api/push/campaigns/${campaign.id}`, { method: 'PUT', body });
      else await adminFetch('/api/push/campaigns', { method: 'POST', body });
      onDone(mode === 'draft' ? 'Draft saved' : d.when === 'later' ? 'Campaign scheduled' : 'Sending now…');
    } catch (e) {
      setError(msgOf(e));
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    if (!testDevice) { setError('Choose a device for the test.'); return; }
    if (!d.title.trim() || !d.body.trim()) { setError('Add a title and a message first.'); return; }
    setBusy('test'); setTestResult(null);
    try {
      const r = await adminFetch('/api/push/test', { method: 'POST', body: JSON.stringify({ tokens: [testDevice], title: d.title, body: d.body, data: d.deepLink ? { url: d.deepLink } : {} }) });
      setTestResult(r);
    } catch (e) { setError(msgOf(e)); } finally { setBusy(null); }
  };

  return (
    <Sheet wide title={campaign ? `Edit “${campaign.name}”` : 'New push notification'} eyebrow="Campaign" onClose={onClose}
      footer={
        <div className="space-y-3">
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          {confirm && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />This goes to {num(estimate?.devices)} device{estimate?.devices === 1 ? '' : 's'} right away and can’t be undone. Press “Send now” again to confirm.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={onClose} className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Cancel</button>
            <button onClick={() => save('draft')} disabled={!!busy} className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60">
              {busy === 'draft' ? 'Saving…' : 'Save draft'}
            </button>
            <button onClick={() => save('send')} disabled={!!busy}
              className={`inline-flex h-11 w-full min-w-[160px] sm:ml-auto sm:w-auto items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${confirm ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#007ac2] hover:bg-[#00649f]'}`}>
              {busy === 'send' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : d.when === 'later' ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {d.when === 'later' ? 'Schedule' : confirm ? 'Send now' : `Send to ${num(estimate?.devices)} device${estimate?.devices === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      }>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-5">
          {/* Message */}
          <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Message</p>
            <label className="block">
              <span className="mb-1.5 flex justify-between text-sm font-medium text-slate-800">Title <span className={`text-xs font-normal ${d.title.length > 50 ? 'text-amber-600' : 'text-slate-400'}`}>{d.title.length}/65</span></span>
              <input value={d.title} onChange={e => set({ title: e.target.value.slice(0, 120) })} placeholder="Weekend deal in Dubai 🚗" className={inputCls} autoFocus={!campaign} />
            </label>
            <label className="block">
              <span className="mb-1.5 flex justify-between text-sm font-medium text-slate-800">Subtitle <span className="text-xs font-normal text-slate-400">Optional · iOS only</span></span>
              <input value={d.subtitle} onChange={e => set({ subtitle: e.target.value.slice(0, 80) })} placeholder="Ends Sunday" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 flex justify-between text-sm font-medium text-slate-800">Message <span className={`text-xs font-normal ${d.body.length > 178 ? 'text-amber-600' : 'text-slate-400'}`}>{d.body.length}/178</span></span>
              <textarea value={d.body} onChange={e => set({ body: e.target.value.slice(0, 1000) })} rows={3} placeholder="Save 15% on every car this weekend. Tap to book." className={`${inputCls} h-auto resize-none py-2.5`} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800"><ImageIcon className="h-3.5 w-3.5 text-slate-400" />Image <span className="text-xs font-normal text-slate-400">https link</span></span>
                <input value={d.imageUrl} onChange={e => set({ imageUrl: e.target.value.trim() })} placeholder="https://…/banner.jpg" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800"><Link2 className="h-3.5 w-3.5 text-slate-400" />Opens</span>
                <input value={d.deepLink} onChange={e => set({ deepLink: e.target.value.trim() })} placeholder="hogicar:// or https://" className={inputCls} />
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {LINKS.map(l => <button key={l.value} type="button" onClick={() => set({ deepLink: l.value })} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${d.deepLink === l.value ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-slate-50 text-slate-600 ring-slate-200 hover:ring-slate-300'}`}>{l.label}</button>)}
                </span>
              </label>
            </div>
          </section>

          {/* Audience */}
          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Audience</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#007ac2]/10 px-2.5 py-1 text-xs font-semibold text-[#00649f]">
                <Users className="h-3.5 w-3.5" />{estimate ? `${num(estimate.devices)} device${estimate.devices === 1 ? '' : 's'}` : '…'}
                {estimate && estimate.devices > 0 && <span className="hidden font-normal text-[#00649f]/70 sm:inline">· {estimate.ios} iOS · {estimate.android} Android</span>}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AUDIENCES.map(a => (
                <button key={a.value} type="button" onClick={() => set({ audience: a.value, targetValue: '' })}
                  className={`rounded-xl p-2.5 text-left ring-1 transition ${d.audience === a.value ? 'bg-[#007ac2]/[0.06] ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                  <span className="block text-sm font-semibold text-slate-900">{a.label}</span>
                  <span className="block text-[11px] leading-tight text-slate-500">{a.hint}</span>
                </button>
              ))}
            </div>
            {aud.needs && (
              <select value={d.targetValue} onChange={e => set({ targetValue: e.target.value })} className={inputCls} aria-label={aud.label}>
                <option value="">Choose {aud.label.toLowerCase()}…</option>
                {choices.map(o => <option key={o.value} value={o.value}>{aud.needs === 'platforms' ? (o.value === 'ios' ? 'iOS' : o.value === 'android' ? 'Android' : o.value) : o.value} ({o.count})</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {[['MARKETING', 'Marketing', 'Only devices that allow offers'], ['TRANSACTIONAL', 'Service update', 'All devices in the audience']].map(([v, l, h]) => (
                <button key={v} type="button" onClick={() => set({ type: v })} className={`rounded-lg px-2 py-1.5 text-left transition ${d.type === v ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                  <span className="block text-sm font-semibold text-slate-900">{l}</span><span className="block text-[11px] text-slate-500">{h}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Delivery */}
          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Delivery</p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {(['now', 'later'] as const).map(w => (
                <button key={w} type="button" onClick={() => set({ when: w })} className={`h-9 rounded-lg text-sm font-semibold transition ${d.when === w ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{w === 'now' ? 'Send now' : 'Schedule'}</button>
              ))}
            </div>
            {d.when === 'later' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">Send at <span className="font-normal text-slate-400">({Intl.DateTimeFormat().resolvedOptions().timeZone})</span></span>
                <input type="datetime-local" value={d.scheduleLocal} onChange={e => set({ scheduleLocal: e.target.value })} className={inputCls} />
              </label>
            )}
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={d.sound !== 'none'} onChange={e => set({ sound: e.target.checked ? 'default' : 'none' })} className="h-4 w-4 rounded accent-[#007ac2]" />Play sound</label>
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={d.priority === 'high'} onChange={e => set({ priority: e.target.checked ? 'high' : 'normal' })} className="h-4 w-4 rounded accent-[#007ac2]" />High priority</label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-800">Internal name <span className="font-normal text-slate-400">· optional</span></span>
              <input value={d.name} onChange={e => set({ name: e.target.value.slice(0, 120) })} placeholder={d.title || 'Dubai weekend promo'} className={inputCls} />
            </label>
          </section>

          {/* Test */}
          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Try it on a phone first</p>
            <div className="flex gap-2">
              <select value={testDevice} onChange={e => setTestDevice(e.target.value)} className={inputCls} aria-label="Test device">
                <option value="">{activeDevices.length ? 'Choose a device…' : 'No registered devices yet'}</option>
                {activeDevices.slice(0, 300).map(x => <option key={x.id} value={x.expoToken}>{x.deviceModel || 'Device'} · {x.platform === 'ios' ? 'iOS' : x.platform === 'android' ? 'Android' : x.platform || '—'}{x.city ? ` · ${x.city}` : ''} · {ago(x.lastSeen)}</option>)}
              </select>
              <button onClick={sendTest} disabled={busy === 'test'} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {busy === 'test' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Play className="h-4 w-4" />} Test
              </button>
            </div>
            {testResult && <ResultLine r={testResult} />}
          </section>
        </div>

        <div className="lg:sticky lg:top-0">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
            {(['ios', 'android'] as const).map(p => (
              <button key={p} onClick={() => setPreview(p)} className={`h-8 rounded-lg text-xs font-semibold ${preview === p ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{p === 'ios' ? 'iPhone' : 'Android'}</button>
            ))}
          </div>
          <PhonePreview title={d.title} subtitle={d.subtitle} body={d.body} imageUrl={d.imageUrl} platform={preview} />
          <p className="mt-3 text-center text-xs text-slate-500">Lock-screen preview. Long text is cut off on the phone.</p>
        </div>
      </div>
    </Sheet>
  );
};

const ResultLine: React.FC<{ r: SendResult }> = ({ r }) => (
  <div className={`rounded-xl px-3 py-2.5 text-sm ring-1 ${r.accepted > 0 ? 'bg-emerald-50 text-emerald-900 ring-emerald-200' : 'bg-rose-50 text-rose-800 ring-rose-200'}`}>
    <p className="flex items-center gap-2 font-semibold">
      {r.accepted > 0 ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {r.accepted > 0 ? `Accepted by Expo for ${r.accepted} device${r.accepted === 1 ? '' : 's'}. It should arrive within seconds.` : 'Not sent.'}
    </p>
    {r.errors?.length > 0 && <ul className="mt-1 list-inside list-disc text-xs">{r.errors.map(e => <li key={e}>{e}</li>)}</ul>}
  </div>
);

// ------------------------------------------------------------------ campaign row

const Funnel: React.FC<{ c: Campaign }> = ({ c }) => {
  const steps = [
    { label: 'Targeted', v: c.sentCount },
    { label: 'Accepted', v: c.acceptedCount ?? 0 },
    { label: 'Delivered', v: c.deliveredCount },
    { label: 'Opened', v: c.openedCount },
  ];
  const max = Math.max(1, c.sentCount);
  return (
    <div className="grid grid-cols-4 gap-2">
      {steps.map((s, i) => (
        <div key={s.label}>
          <p className="text-[11px] text-slate-500">{s.label}</p>
          <p className="text-sm font-semibold tabular-nums text-slate-900">{num(s.v)}</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (s.v / max) * 100)}%` }} transition={{ duration: 0.7, delay: i * 0.08 }}
              className={`h-full rounded-full ${['bg-slate-400', 'bg-sky-500', 'bg-emerald-500', 'bg-orange-500'][i]}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ main

type Tab = 'overview' | 'campaigns' | 'devices' | 'activity';

const PushNotificationManagement: React.FC = () => {
  const [tab, setTab] = React.useState<Tab>('overview');
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [options, setOptions] = React.useState<Options | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [composer, setComposer] = React.useState<Campaign | 'new' | null>(null);
  const [toast, setToast] = React.useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [deviceQuery, setDeviceQuery] = React.useState('');
  const [devicePlatform, setDevicePlatform] = React.useState<'all' | 'ios' | 'android' | 'inactive'>('all');
  const [testing, setTesting] = React.useState<number | null>(null);
  const [deviceResult, setDeviceResult] = React.useState<{ id: number; r: SendResult } | null>(null);
  const toastTimer = React.useRef<number>();

  const notify = React.useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const load = React.useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(null);
    const [s, c, d, o] = await Promise.allSettled([
      adminFetch('/api/push/stats'), adminFetch('/api/push/campaigns'), adminFetch('/api/push/tokens'), adminFetch('/api/push/audience/options'),
    ]);
    if (s.status === 'fulfilled') setStats(s.value);
    if (c.status === 'fulfilled' && Array.isArray(c.value)) setCampaigns(c.value);
    if (d.status === 'fulfilled' && Array.isArray(d.value)) setDevices(d.value);
    if (o.status === 'fulfilled') setOptions(o.value);
    if (s.status === 'rejected') setLoadError(msgOf(s.reason));
    setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  // Refresh while something is sending.
  const sending = campaigns.some(c => c.status === 'SENDING');
  React.useEffect(() => {
    if (!sending) return;
    const t = window.setInterval(() => load(true), 4000);
    return () => window.clearInterval(t);
  }, [sending, load]);

  const act = async (c: Campaign, path: string, method: string, done: string) => {
    setBusyId(c.id);
    try { await adminFetch(`/api/push/campaigns/${c.id}${path}`, { method }); notify(done); await load(true); }
    catch (e) { notify(msgOf(e), 'err'); }
    finally { setBusyId(null); }
  };

  const testDevice = async (dv: Device) => {
    setTesting(dv.id); setDeviceResult(null);
    try { const r = await adminFetch('/api/push/test', { method: 'POST', body: JSON.stringify({ tokens: [dv.expoToken] }) }); setDeviceResult({ id: dv.id, r }); }
    catch (e) { notify(msgOf(e), 'err'); }
    finally { setTesting(null); }
  };

  const removeDevice = async (dv: Device) => {
    if (!window.confirm(`Remove ${dv.deviceModel || 'this device'}? It will register again next time the app opens.`)) return;
    try { await adminFetch(`/api/push/tokens/${dv.id}`, { method: 'DELETE' }); setDevices(list => list.filter(x => x.id !== dv.id)); notify('Device removed'); }
    catch (e) { notify(msgOf(e), 'err'); }
  };

  const active = stats?.activeTokens ?? 0;
  const iosPct = active ? Math.round(((stats?.iosDevices ?? 0) / active) * 100) : 0;
  const delivered = stats?.deliveredNotifications ?? 0;
  const sent = stats?.sentNotifications ?? 0;
  const opened = stats?.openedNotifications ?? 0;

  const q = deviceQuery.trim().toLowerCase();
  const shownDevices = devices.filter(x =>
    (devicePlatform === 'all' ? true : devicePlatform === 'inactive' ? !x.active : x.active && (x.platform || '').toLowerCase() === devicePlatform)
    && (!q || [x.deviceModel, x.deviceId, x.expoToken, x.city, x.country, x.appVersion].some(v => (v || '').toLowerCase().includes(q))));

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
    { id: 'devices', label: 'Devices', count: devices.filter(x => x.active).length },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b2545] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#007ac2]/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100 ring-1 ring-inset ring-white/15"><Bell className="h-3 w-3" /> Hogicar apps</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Reach customers on their phones</h2>
            <p className="mt-1 hidden max-w-xl text-sm text-sky-100/80 sm:block">Send campaigns, schedule them, test on a real device first, and see what was delivered and opened.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => load()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-inset ring-white/20 hover:bg-white/15" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
            <button onClick={() => setComposer('new')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b2545] shadow-lg hover:bg-sky-50"><Plus className="h-4 w-4" /> New notification</button>
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            { label: 'Active devices', value: num(active), sub: `${stats?.iosDevices ?? 0} iOS · ${stats?.androidDevices ?? 0} Android`, Icon: Smartphone },
            { label: 'Allow offers', value: num(stats?.marketingOptIn), sub: 'Receive marketing', Icon: Megaphone },
            { label: 'Delivered', value: num(delivered), sub: sent ? `${Math.round((delivered / sent) * 100)}% of ${num(sent)} targeted` : 'No sends yet', Icon: CheckCircle },
            { label: 'Opened', value: num(opened), sub: delivered ? `${Math.round((opened / delivered) * 100)}% of delivered` : '—', Icon: Eye },
          ].map(k => (
            <div key={k.label} className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-inset ring-white/10">
              <dt className="flex items-center gap-1.5 text-xs text-sky-100/80"><k.Icon className="h-3.5 w-3.5" />{k.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{loading && !stats ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-white/15 align-middle" /> : k.value}</dd>
              <dd className="mt-0.5 truncate text-[11px] text-sky-100/70">{k.sub}</dd>
            </div>
          ))}
        </dl>
      </section>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{loadError}</span>
          <button onClick={() => load()} className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-rose-200">Try again</button>
        </div>
      )}

      {/* Tabs */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200" role="tablist">
          {tabs.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`relative inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition ${tab === t.id ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              {tab === t.id && <motion.span layoutId="push-tab" className="absolute inset-0 rounded-xl bg-slate-900" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />}
              <span className="relative">{t.label}</span>
              {t.count !== undefined && <span className={`relative rounded-full px-1.5 text-[11px] ${tab === t.id ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Latest campaigns</h3>
              <button onClick={() => setTab('campaigns')} className="text-sm font-semibold text-[#007ac2] hover:underline">See all</button>
            </div>
            {campaigns.length === 0 ? (
              <div className="py-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Megaphone className="h-6 w-6" /></span>
                <p className="mt-3 font-semibold text-slate-900">No campaigns yet</p>
                <p className="text-sm text-slate-500">Write your first notification and test it on your phone.</p>
                <button onClick={() => setComposer('new')} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New notification</button>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {campaigns.slice(0, 5).map(c => (
                  <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><p className="truncate font-semibold text-slate-900">{c.title}</p><StatusPill c={c} /></div>
                      <p className="truncate text-sm text-slate-500">{audienceLabel(c)} · {c.status === 'PENDING' && c.schedule === 'SCHEDULED' ? `Sends ${fmtWhen(c.scheduleTime)}` : fmtWhen(c.sentAt || c.createdAt)}</p>
                    </div>
                    <div className="w-full sm:w-72"><Funnel c={c} /></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Devices</h3>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-slate-800" style={{ width: `${iosPct}%` }} />
                <div className="bg-emerald-500" style={{ width: `${active ? 100 - iosPct : 0}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-800" />iOS {num(stats?.iosDevices)}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Android {num(stats?.androidDevices)}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">{num(stats?.last24Hours)}</span> opened the app in the last 24 hours.</p>
            </div>
            <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Setup</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li className="flex items-start gap-2">{active > 0 ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                  <span>{active > 0 ? `${num(active)} app install${active === 1 ? '' : 's'} can receive pushes` : 'No devices yet. Open the app and allow notifications.'}</span></li>
                <li className="flex items-start gap-2">{stats?.expoAccessTokenConfigured ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />}
                  <span>{stats?.expoAccessTokenConfigured ? 'Expo access token is set' : <>Expo access token not set. Only needed if “enhanced push security” is on in Expo; set <code className="rounded bg-slate-100 px-1 text-xs">EXPO_ACCESS_TOKEN</code> on the server.</>}</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Delivery receipts are checked every 5 minutes</span></li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* Campaigns */}
      {tab === 'campaigns' && (
        campaigns.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
            <p className="font-semibold text-slate-900">No campaigns yet</p>
            <button onClick={() => setComposer('new')} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />New notification</button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => {
              const canSend = ['DRAFT', 'PENDING', 'FAILED', 'CANCELLED'].includes(c.status);
              const editable = !['SENT', 'SENDING'].includes(c.status);
              return (
                <motion.article key={c.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill c={c} />
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{c.type === 'TRANSACTIONAL' ? 'Service update' : 'Marketing'}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"><Target className="h-3 w-3" />{audienceLabel(c)}</span>
                      </div>
                      <p className="mt-2 font-semibold text-slate-900">{c.title}</p>
                      <p className="line-clamp-2 text-sm text-slate-600">{c.body}</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {c.name !== c.title ? `${c.name} · ` : ''}
                        {c.status === 'PENDING' && c.schedule === 'SCHEDULED' ? `Scheduled for ${fmtWhen(c.scheduleTime)}` : c.sentAt ? `Sent ${fmtWhen(c.sentAt)}` : `Created ${fmtWhen(c.createdAt)}`}
                      </p>
                      {c.lastError && c.status !== 'SENT' && <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700"><AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />{c.lastError}</p>}
                      {c.lastError && c.status === 'SENT' && <p className="mt-2 text-xs text-amber-700">Some devices failed: {c.lastError}</p>}
                    </div>
                    <div className="w-full lg:w-80">
                      <Funnel c={c} />
                      <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                        {canSend && (
                          <button onClick={() => { if (window.confirm(`Send “${c.title}” now?`)) act(c, '/send', 'POST', 'Sending now…'); }} disabled={busyId === c.id}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#007ac2] px-3 text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-60"><Send className="h-3.5 w-3.5" />Send now</button>
                        )}
                        {editable && <button onClick={() => setComposer(c)} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Edit</button>}
                        {c.status === 'PENDING' && c.schedule === 'SCHEDULED' && (
                          <button onClick={() => act(c, '/cancel', 'POST', 'Schedule cancelled')} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50"><X className="h-3.5 w-3.5" />Cancel</button>
                        )}
                        <button onClick={() => act(c, '/duplicate', 'POST', 'Copied as a draft')} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50" title="Duplicate" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm('Delete this campaign?')) act(c, '', 'DELETE', 'Campaign deleted'); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600" title="Delete" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )
      )}

      {/* Devices */}
      {tab === 'devices' && (
        <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto">
              {(['all', 'ios', 'android', 'inactive'] as const).map(p => (
                <button key={p} onClick={() => setDevicePlatform(p)} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ring-1 ${devicePlatform === p ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-white text-slate-600 ring-slate-200'}`}>
                  {p === 'all' ? 'All active' : p === 'ios' ? 'iOS' : p === 'android' ? 'Android' : 'Switched off'}
                </button>
              ))}
            </div>
            <label className="relative block sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={deviceQuery} onChange={e => setDeviceQuery(e.target.value)} placeholder="Model, city, version or token" className={`${inputCls} pl-9`} />
            </label>
          </div>
          {shownDevices.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">{devices.length ? 'No devices match.' : 'No devices yet. When someone opens the app and allows notifications, it appears here.'}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shownDevices.slice(0, 300).map(dv => (
                <li key={dv.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dv.platform === 'ios' ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-700'}`}><Smartphone className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{dv.deviceModel || 'Unknown device'}</p>
                        <span className="text-xs text-slate-500">{dv.platform === 'ios' ? 'iOS' : dv.platform === 'android' ? 'Android' : dv.platform}{dv.osVersion ? ` ${dv.osVersion}` : ''}</span>
                        {!dv.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Switched off</span>}
                        {dv.active && !dv.prefOffers && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">No offers</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[dv.city, dv.country].filter(Boolean).join(', ') || 'Location unknown'} · App {dv.appVersion || '—'} · Seen {ago(dv.lastSeen)}{dv.userId ? ` · User #${dv.userId}` : ''}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{dv.expoToken}</p>
                      {deviceResult?.id === dv.id && <div className="mt-2"><ResultLine r={deviceResult.r} /></div>}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => testDevice(dv)} disabled={testing === dv.id} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#007ac2] ring-1 ring-[#007ac2]/30 hover:bg-[#007ac2]/5 disabled:opacity-60">
                        {testing === dv.id ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#007ac2]/30 border-t-[#007ac2]" /> : <Send className="h-3.5 w-3.5" />}<span className="hidden sm:inline">Test</span>
                      </button>
                      <button onClick={() => removeDevice(dv)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove device"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
          {(stats?.recentLogs || []).length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(stats?.recentLogs || []).map((log: any) => (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${log.level === 'ERROR' ? 'bg-rose-50 text-rose-600' : log.level === 'WARN' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                    {log.level === 'ERROR' ? <XCircle className="h-4 w-4" /> : log.level === 'WARN' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm text-slate-800">{log.message}</p>
                    <p className="text-xs text-slate-400">{fmtWhen(log.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <AnimatePresence>
        {composer && (
          <Composer key="composer" campaign={composer === 'new' ? null : composer} options={options} devices={devices}
            onClose={() => setComposer(null)}
            onDone={msg => { setComposer(null); notify(msg); setTab('campaigns'); load(true); }} />
        )}
      </AnimatePresence>
      <Toast t={toast} />
    </div>
  );
};

export default PushNotificationManagement;
