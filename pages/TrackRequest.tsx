import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Search from 'lucide-react/dist/esm/icons/search';
import Check from 'lucide-react/dist/esm/icons/check';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Send from 'lucide-react/dist/esm/icons/send';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import UserSearch from 'lucide-react/dist/esm/icons/user-search';
import MailCheck from 'lucide-react/dist/esm/icons/mail-check';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import LifeBuoy from 'lucide-react/dist/esm/icons/life-buoy';
import Mail from 'lucide-react/dist/esm/icons/mail';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import MessageSquarePlus from 'lucide-react/dist/esm/icons/message-square-plus';
import SEOMetadata from '../components/SEOMetadata';
import { API_BASE_URL, CONTACT_EMAIL } from '../lib/config';

type Step = { key: string; label: string; state: 'done' | 'current' | 'upcoming'; at?: string | null };
type Entry = { kind: 'CUSTOMER_MESSAGE' | 'TEAM_REPLY' | 'STATUS' | 'RECEIVED'; author?: string; text: string; at: string; status?: string };
type Tracked = {
  reference: string; status: 'NEW' | 'IN_PROGRESS' | 'REPLIED' | 'CLOSED'; statusLabel: string; statusText: string; topic: string; subject?: string;
  bookingRef?: string; name: string; email: string; createdAt: string; updatedAt: string; steps: Step[]; conversation: Entry[]; activity: Entry[]; token: string;
};

const STEP_ICON: Record<string, React.ComponentType<{ className?: string }>> = { NEW: Inbox, IN_PROGRESS: UserSearch, REPLIED: MailCheck, CLOSED: BadgeCheck };
const STEP_HINT: Record<string, string> = {
  NEW: 'We have your request',
  IN_PROGRESS: 'Our team is on it',
  REPLIED: 'We replied by email',
  CLOSED: 'All sorted',
};
const TONE: Record<Tracked['status'], string> = {
  NEW: 'bg-sky-50 text-sky-800 ring-sky-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 ring-amber-200',
  REPLIED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-700 ring-slate-200',
};
const DOT: Record<Tracked['status'], string> = { NEW: 'bg-sky-500', IN_PROGRESS: 'bg-amber-500', REPLIED: 'bg-emerald-500', CLOSED: 'bg-slate-400' };

const fmt = (iso?: string | null, withTime = true) => !iso ? '' : new Date(iso).toLocaleString(undefined, withTime
  ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  : { day: 'numeric', month: 'short', year: 'numeric' });
const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
};
const initials = (name = '') => name.split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
const normRef = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/public/contact${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data as T;
}

const CopyRef: React.FC<{ value: string }> = ({ value }) => {
  const [done, setDone] = React.useState(false);
  return (
    <button type="button" aria-label="Copy reference" onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* blocked */ } }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

/** Progress: Received → In review → Answered → Resolved, with the date each step was reached. */
const Progress: React.FC<{ steps: Step[] }> = ({ steps }) => {
  const doneCount = steps.filter(s => s.state !== 'upcoming').length;
  return (
    <ol className="relative grid gap-0 sm:grid-cols-4">
      {/* connecting line on wide screens */}
      <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-[3px] rounded-full bg-slate-200 sm:block" />
      <span aria-hidden className="absolute left-[12.5%] top-5 hidden h-[3px] rounded-full bg-[#0f2b4d] transition-all duration-700 sm:block"
        style={{ width: `${Math.max(0, doneCount - 1) * 25}%` }} />
      {steps.map((s, i) => {
        const Icon = STEP_ICON[s.key] || Inbox;
        const done = s.state === 'done', current = s.state === 'current';
        return (
          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
            {i < steps.length - 1 && <span aria-hidden className={`absolute left-5 top-11 h-[calc(100%-2.75rem)] w-[3px] -translate-x-1/2 rounded-full sm:hidden ${done ? 'bg-[#0f2b4d]' : 'bg-slate-200'}`} />}
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition ${
              done ? 'bg-[#0f2b4d] text-white' : current ? 'bg-[#F57C00] text-white shadow-[0_0_0_6px_rgba(245,124,0,0.15)]' : 'bg-white text-slate-400 ring-slate-100 border border-slate-200'}`}>
              {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Icon className="h-[18px] w-[18px]" />}
              {current && <span className="absolute inset-0 animate-ping rounded-full bg-[#F57C00] opacity-20" />}
            </span>
            <span className="min-w-0 sm:mt-3">
              <span className={`block text-sm font-semibold ${s.state === 'upcoming' ? 'text-slate-400' : 'text-slate-900'}`}>{s.label}</span>
              <span className="block text-xs text-slate-500">{s.at ? fmt(s.at) : current ? STEP_HINT[s.key] : s.state === 'upcoming' ? STEP_HINT[s.key] : ''}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const Message: React.FC<{ e: Entry; you: string }> = ({ e, you }) => {
  const team = e.kind === 'TEAM_REPLY';
  return (
    <li className="flex gap-3 sm:gap-4">
      {team
        ? <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0f2b4d] ring-2 ring-white"><img src="/android-chrome-192x192.png" alt="" className="h-10 w-10" /></span>
        : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 ring-2 ring-white">{initials(e.author || you)}</span>}
      <div className={`min-w-0 flex-1 rounded-2xl rounded-tl-md p-4 sm:p-5 ${team ? 'bg-white ring-1 ring-[#0f2b4d]/15 shadow-[0_8px_24px_-16px_rgba(15,43,77,0.45)]' : 'bg-slate-50 ring-1 ring-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-slate-900">{team ? (e.author || 'Hogicar team') : 'You'}</span>
          {team && <span className="inline-flex items-center gap-1 rounded-full bg-[#0f2b4d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"><ShieldCheck className="h-3 w-3" /> Hogicar</span>}
          <span className="ml-auto text-xs text-slate-500" title={fmt(e.at)}>{fmt(e.at)}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-700">{e.text.replace(/^[ \t]*[-*][ \t]+/gm, '• ')}</p>
      </div>
    </li>
  );
};

const TrackRequest: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [ref, setRef] = React.useState(normRef(params.get('ref') || ''));
  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState(params.get('t') || '');
  const [data, setData] = React.useState<Tracked | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const show = React.useCallback((d: Tracked) => {
    setData(d); setToken(d.token);
    // Keep the private link in the address bar so a refresh or bookmark opens the same request.
    setParams({ ref: d.reference, t: d.token }, { replace: true });
  }, [setParams]);

  const lookup = React.useCallback(async (body: Record<string, unknown>, quiet = false) => {
    if (!quiet) { setLoading(true); setError(''); }
    try { show(await post<Tracked>('/track', body)); }
    catch (e: any) { if (!quiet) { setError(e?.message && !/fetch/i.test(e.message) ? e.message : 'We couldn’t reach Hogicar. Check your connection and try again.'); setData(null); } }
    finally { if (!quiet) setLoading(false); }
  }, [show]);

  // Opened from the email link: load straight away.
  React.useEffect(() => {
    const r = params.get('ref'), t = params.get('t');
    if (r && t && !data) lookup({ reference: r, token: t });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stay current while the page is open.
  React.useEffect(() => {
    if (!data) return;
    const tick = () => { if (document.visibilityState === 'visible') lookup({ reference: data.reference, token }, true); };
    const t = window.setInterval(tick, 60000);
    return () => window.clearInterval(t);
  }, [data, token, lookup]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (normRef(ref).replace(/^HC-?/, '').length < 6) { setError('Enter your reference – it looks like HC-7K2M9Q.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError('Enter the email address you used to contact us.'); return; }
    lookup({ reference: ref, email: email.trim() });
  };

  const refresh = async () => {
    if (!data) return;
    setRefreshing(true);
    await lookup({ reference: data.reference, token }, true);
    setRefreshing(false);
  };

  const sendReply = async () => {
    if (!data || reply.trim().length < 2) return;
    setSending(true); setSendError('');
    try {
      show(await post<Tracked>('/track/message', { reference: data.reference, token, message: reply.trim() }));
      setReply(''); setSent(true); window.setTimeout(() => setSent(false), 5000);
    } catch (e: any) { setSendError(e?.message || 'Your message could not be sent. Please try again.'); }
    finally { setSending(false); }
  };

  const reset = () => { setData(null); setToken(''); setEmail(''); setRef(''); setError(''); setParams({}, { replace: true }); };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEOMetadata title="Track your request | Hogicar" description="Follow the progress of your Hogicar support request." noIndex />

      <section className="relative overflow-hidden bg-[#00224f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#0b5cc4_0%,_#003580_45%,_#00224f_100%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <Link to="/contact" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Contact us</Link>
          {data ? (
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Request</p>
                <div className="mt-1 flex items-center gap-1">
                  <h1 className="font-mono text-3xl font-bold tracking-wider sm:text-4xl">{data.reference}</h1>
                  <CopyRef value={data.reference} />
                </div>
                <p className="mt-2 max-w-2xl truncate text-base text-white/80 sm:text-lg">{data.subject || data.topic}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${TONE[data.status]}`}>
                  <span className={`h-2 w-2 rounded-full ${DOT[data.status]}`} />{data.statusLabel}
                </span>
                <button onClick={refresh} aria-label="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 hover:bg-white/15 hover:text-white">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                <Search className="h-3.5 w-3.5" /> Request tracking
              </p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Track your request</h1>
              <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">See where your request stands, read our replies and add more information – all in one place.</p>
            </>
          )}
        </div>
      </section>

      <div className="relative mx-auto -mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
        {!data ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_-24px_rgba(2,24,64,0.35)] ring-1 ring-slate-200 sm:p-8">
              {loading && params.get('t') ? (
                <div className="flex flex-col items-center py-16 text-slate-500"><LoaderCircle className="h-8 w-8 animate-spin text-[#007ac2]" /><p className="mt-4 text-sm">Opening your request…</p></div>
              ) : (
                <form onSubmit={submit} noValidate className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Find your request</h2>
                    <p className="mt-1 text-sm text-slate-500">Use the reference from your confirmation email and the email address you wrote from.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ref" className="mb-1.5 block text-sm font-semibold text-slate-800">Reference</label>
                      <input id="ref" value={ref} onChange={e => { setRef(normRef(e.target.value)); setError(''); }} placeholder="HC-7K2M9Q" autoCapitalize="characters" autoComplete="off" spellCheck={false}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-[16px] uppercase tracking-wider text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15" />
                    </div>
                    <div>
                      <label htmlFor="em" className="mb-1.5 block text-sm font-semibold text-slate-800">Email address</label>
                      <input id="em" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15" />
                    </div>
                  </div>
                  {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
                  <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f2b4d] px-6 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#123c69] disabled:opacity-60 sm:w-auto">
                    {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Track request
                  </button>
                  <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Only someone with both the reference and your email address can see your request.</p>
                </form>
              )}
            </section>
            <aside className="space-y-4">
              <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Where is my reference?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">It’s in the email we sent when you contacted us, titled <span className="font-medium text-slate-800">“We’ve received your request – HC-…”</span>. That email also has a button that opens your request directly.</p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Your reference</p>
                  <p className="mt-1 font-mono text-xl font-bold tracking-wider text-[#0f2b4d]">HC-7K2M9Q</p>
                </div>
              </div>
              <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Haven’t contacted us yet?</h3>
                <p className="mt-2 text-sm text-slate-600">Send us a message and you’ll get a reference to follow it here.</p>
                <Link to="/contact" className="mt-4 inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-700">Contact us</Link>
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status and progress */}
            <section className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_-24px_rgba(2,24,64,0.35)] ring-1 ring-slate-200 sm:p-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{data.name ? `Hi ${data.name}, ${data.statusText.charAt(0).toLowerCase()}${data.statusText.slice(1)}` : data.statusText}</h2>
                <p className="shrink-0 text-sm text-slate-500">Updated {ago(data.updatedAt)}</p>
              </div>
              <div className="mt-8"><Progress steps={data.steps} /></div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              {/* Conversation */}
              <section className="min-w-0 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Conversation</h2>
                  <span className="text-sm text-slate-500">{data.conversation.length} message{data.conversation.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="mt-6 space-y-5">
                  {data.conversation.map((e, i) => <Message key={i} e={e} you={data.name} />)}
                </ul>
                {!data.conversation.some(e => e.kind === 'TEAM_REPLY') && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                    <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-slate-400" style={{ animationDuration: '2.4s' }} />
                    Our reply will appear here and in your inbox ({data.email}).
                  </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <label htmlFor="reply" className="flex items-center gap-2 text-sm font-semibold text-slate-900"><MessageSquarePlus className="h-4 w-4 text-[#007ac2]" /> Add information</label>
                  <p className="mt-1 text-xs text-slate-500">{data.status === 'CLOSED' || data.status === 'REPLIED' ? 'Still need help? Sending a message reopens your request.' : 'Anything else we should know? Our team sees it straight away.'}</p>
                  <textarea id="reply" value={reply} onChange={e => setReply(e.target.value.slice(0, 3000))} rows={4} placeholder="Write your message…"
                    className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-[16px] leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15" />
                  {sendError && <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{sendError}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className={`text-sm ${sent ? 'font-medium text-emerald-700' : 'text-slate-400'}`}>{sent ? <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Sent – our team has been notified.</span> : `${reply.length}/3000`}</span>
                    <button onClick={sendReply} disabled={sending || reply.trim().length < 2}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0068a5] disabled:cursor-not-allowed disabled:opacity-50">
                      {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                    </button>
                  </div>
                </div>
              </section>

              {/* Details and activity */}
              <aside className="space-y-6">
                <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Details</h2>
                  <dl className="mt-4 divide-y divide-slate-100 text-sm">
                    {[
                      ['Reference', <span className="font-mono font-semibold tracking-wide">{data.reference}</span>],
                      ['Topic', data.topic],
                      ...(data.bookingRef ? [['Booking', <span className="font-mono">{data.bookingRef}</span>]] : []),
                      ['Submitted', fmt(data.createdAt)],
                      ['Replies to', data.email],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="min-w-0 truncate text-right font-medium text-slate-900">{v}</dd></div>
                    ))}
                  </dl>
                </section>

                <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</h2>
                  <ol className="mt-4 space-y-0">
                    {data.activity.map((a, i) => (
                      <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                        {i < data.activity.length - 1 && <span aria-hidden className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
                        <span className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white ring-1 ${i === 0 ? 'bg-[#F57C00] ring-[#F57C00]/40' : 'bg-slate-300 ring-slate-200'}`} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-900">{a.text}</span>
                          <span className="block text-xs text-slate-500">{fmt(a.at)}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-3xl bg-[#0f2b4d] p-6 text-white">
                  <h2 className="text-base font-semibold">Need something urgently?</h2>
                  <p className="mt-1 text-sm text-white/70">Change or cancel a booking yourself, or browse quick answers.</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link to="/my-bookings" className="inline-flex h-10 items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#0f2b4d] hover:bg-white/90">Manage booking</Link>
                    <Link to="/help" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"><LifeBuoy className="h-4 w-4" /> Help Center</Link>
                    <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Request ${data.reference}`)}`} className="inline-flex h-10 items-center justify-center gap-2 text-sm font-medium text-white/80 hover:text-white"><Mail className="h-4 w-4" /> {CONTACT_EMAIL}</a>
                  </div>
                </section>

                <button onClick={reset} className="w-full text-center text-sm font-semibold text-[#007ac2] hover:underline">Track another request</button>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackRequest;
