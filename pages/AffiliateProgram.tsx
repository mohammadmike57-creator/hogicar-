import * as React from 'react';
import SEOMetadata from '../components/SEOMetadata';
import PieChart from 'lucide-react/dist/esm/icons/pie-chart';
import Globe from 'lucide-react/dist/esm/icons/globe';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import MousePointer from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../lib/config';

type Portal = {
  affiliate: {
    name: string; email: string; code: string; trackingUrl: string; commissionRate: number; cookieDays: number; status: string;
    clicks: number; clicks30d: number; conversions: number; bookings30d: number; revenue: number;
    pendingEarnings: number; approvedEarnings: number; paidOut: number; balance: number; totalEarnings: number;
  };
  series: { date: string; clicks: number; bookings: number }[];
  bookings: { ref: string; createdAt?: string; pickupDate?: string; dropoffDate?: string; pickup?: string; car?: string; value: number; commission: number; state: string }[];
  payouts: { id: number; amount: number; method?: string; paidOn?: string; reference?: string }[];
};

const SESSION_KEY = 'hogicar_affiliate_portal';
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
const num = (n: number) => new Intl.NumberFormat('en-US').format(Number(n || 0));
const day = (d?: string) => (d ? new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15';

const STATE_UI: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pending', cls: 'bg-sky-50 text-sky-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
  unpaid: { label: 'Not paid', cls: 'bg-amber-50 text-amber-800' },
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Something went wrong. Please try again.');
  return data;
}

const Dashboard: React.FC<{ data: Portal; onSignOut: () => void }> = ({ data, onSignOut }) => {
  const a = data.affiliate;
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(a.trackingUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };
  const chart = data.series.map(p => ({ ...p, label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }));
  return (
    <div className="min-h-screen bg-slate-50">
      <SEOMetadata title="Partner dashboard | Hogicar" description="Your Hogicar affiliate dashboard." />
      <div className="bg-[#0b2545] px-4 pb-24 pt-8 text-white">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Hogicar partner</p>
            <h1 className="mt-1 truncate text-2xl font-semibold sm:text-3xl">{a.name}</h1>
            <p className="mt-1 text-sm text-sky-100/80">{(a.commissionRate * 100).toFixed(1).replace(/\.0$/, '')}% commission · {a.cookieDays}-day tracking window</p>
          </div>
          <button onClick={onSignOut} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-inset ring-white/20 hover:bg-white/15"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button>
        </div>
      </div>
      <div className="mx-auto -mt-16 max-w-6xl space-y-5 px-4 pb-16">
        <section className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-slate-200 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Link2 className="h-5 w-5 text-[#007ac2]" /> Your tracking link</h2>
          <p className="mt-1 text-sm text-slate-500">Share it anywhere. Bookings made within {a.cookieDays} days of a click are credited to you. Add <span className="font-mono">?ref={a.code}</span> to any Hogicar page to link deeper.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1 truncate rounded-xl bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 ring-1 ring-slate-200">{a.trackingUrl}</div>
            <button onClick={copy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#007ac2] px-6 text-sm font-semibold text-white hover:bg-[#00649f]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy link'}</button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Clicks · 30 days', value: num(a.clicks30d), sub: `${num(a.clicks)} all time`, Icon: MousePointer },
            { label: 'Bookings', value: num(a.conversions), sub: `${num(a.bookings30d)} in 30 days`, Icon: ShoppingBag },
            { label: 'Pending commission', value: usd(a.pendingEarnings), sub: 'approved after the rental ends', Icon: Clock },
            { label: 'Ready to be paid', value: usd(a.balance), sub: `${usd(a.paidOut)} paid so far`, Icon: Wallet },
          ].map(k => (
            <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><k.Icon className="h-3.5 w-3.5" />{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{k.value}</p>
              <p className="truncate text-[11px] text-slate-400">{k.sub}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Last 30 days</h2>
          <div className="mt-4 h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <AreaChart data={chart} margin={{ left: -18, right: 4, top: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="pClicks" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                  <linearGradient id="pBookings" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#0ea5e9" strokeWidth={2} fill="url(#pClicks)" />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#10b981" strokeWidth={2} fill="url(#pBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <h2 className="border-b border-slate-100 px-5 py-4 text-base font-semibold text-slate-900">Your bookings</h2>
            {data.bookings.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">No bookings yet. They appear here as soon as someone books through your link.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.bookings.map((b, i) => (
                  <li key={`${b.ref}-${i}`} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className="font-mono">{b.ref}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${(STATE_UI[b.state] || STATE_UI.pending).cls}`}>{(STATE_UI[b.state] || STATE_UI.pending).label}</span></p>
                      <p className="truncate text-xs text-slate-500">{[b.car, b.pickup].filter(Boolean).join(' · ')} · {day(b.pickupDate)}</p>
                    </div>
                    <div className="text-right"><p className="text-sm font-semibold tabular-nums text-slate-900">{usd(b.commission)}</p><p className="text-[11px] tabular-nums text-slate-400">of {usd(b.value)}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <h2 className="border-b border-slate-100 px-5 py-4 text-base font-semibold text-slate-900">Payments</h2>
            {data.payouts.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">Approved commission is paid monthly. Payments show up here.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.payouts.map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div><p className="text-sm font-semibold tabular-nums text-slate-900">{usd(p.amount)}</p><p className="text-xs text-slate-500">{[day(p.paidOn), p.method].filter(Boolean).join(' · ')}</p></div>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const AffiliateProgram: React.FC = () => {
  const [portal, setPortal] = React.useState<Portal | null>(() => {
    try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [heroImageUrl, setHeroImageUrl] = React.useState('');

  const [reg, setReg] = React.useState({ name: '', company: '', email: '', website: '', country: '', audience: '', password: '' });
  const [regBusy, setRegBusy] = React.useState(false);
  const [regError, setRegError] = React.useState<string | null>(null);
  const [regDone, setRegDone] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginBusy, setLoginBusy] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/settings`).then(r => (r.ok ? r.json() : null)).then(d => d && setHeroImageUrl(d.heroImageUrl || '')).catch(() => { /* optional */ });
  }, []);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (reg.password.length < 8) { setRegError('Choose a password with at least 8 characters.'); return; }
    setRegBusy(true);
    try {
      const res = await post('/api/public/affiliates/apply', reg);
      setRegDone(res.message || 'Thanks for applying. We’ll email you once you’re approved.');
    } catch (err: any) { setRegError(err.message); }
    finally { setRegBusy(false); }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null); setLoginBusy(true);
    try {
      const data = await post('/api/public/affiliates/login', { email, password });
      setPortal(data);
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      setPassword('');
      window.scrollTo(0, 0);
    } catch (err: any) { setLoginError(err.message); }
    finally { setLoginBusy(false); }
  };

  const signOut = () => {
    setPortal(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  };

  if (portal) return <Dashboard data={portal} onSignOut={signOut} />;

  const set = (patch: Partial<typeof reg>) => { setReg(r => ({ ...r, ...patch })); setRegError(null); };

  return (
    <div className="bg-white font-sans">
      <SEOMetadata title="Affiliate Program | Earn with Hogicar" description="Join the Hogicar affiliate program and earn commission on car rental bookings. Real-time tracking, monthly payouts." />

      <div className={`relative overflow-hidden pb-28 pt-20 sm:pt-24 ${!heroImageUrl ? 'bg-gradient-to-br from-[#0b2545] to-[#003580]' : ''}`}>
        {heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <img src={heroImageUrl.startsWith('/') && !heroImageUrl.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#0b2545]/85" />
          </div>
        )}
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100 ring-1 ring-inset ring-white/20"><Handshake className="h-3.5 w-3.5" /> Hogicar partners</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white md:text-6xl">Turn your traffic into <span className="text-[#FF9F1C]">revenue</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-blue-100">Share Hogicar with your audience and earn commission on every car rental booked through your link, tracked in real time and paid monthly.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full bg-[#FF9F1C] px-8 py-3.5 text-lg font-bold text-slate-900 shadow-lg transition hover:bg-orange-400 active:scale-95">Become a partner</button>
            <button onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full bg-white/10 px-8 py-3.5 text-lg font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20">Partner sign in</button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Why partner with Hogicar?</h2>
            <p className="mt-2 text-slate-500">Everything you need to earn from car rental.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { Icon: DollarSign, tone: 'bg-blue-100 text-[#007ac2]', title: 'Commission on every booking', text: 'Earn a share of each completed rental booked within the tracking window of your click. Paid monthly.' },
              { Icon: PieChart, tone: 'bg-violet-100 text-violet-600', title: 'Real-time reporting', text: 'See clicks, bookings, pending and approved commission and every payout in your partner dashboard.' },
              { Icon: Globe, tone: 'bg-orange-100 text-orange-600', title: 'Cars worldwide', text: 'Send your audience to airports and cities across the world with trusted local and international suppliers.' },
            ].map(b => (
              <div key={b.title} className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
                <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${b.tone}`}><b.Icon className="h-8 w-8" /></div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{b.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{b.text}</p>
              </div>
            ))}
          </div>
          <ol className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {['Apply in two minutes', 'Get approved and copy your link', 'Earn on every booking'].map((t, i) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b2545] text-sm font-bold text-white">{i + 1}</span>
                <span className="text-sm font-semibold text-slate-800">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:px-8">
          <div id="join-form" className="scroll-mt-24">
            <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900">Apply to join</h2>
              {regDone ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle className="h-8 w-8" /></div>
                  <h3 className="text-xl font-bold text-slate-900">Application received</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{regDone}</p>
                </div>
              ) : (
                <form onSubmit={apply} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Your name</span><input required className={inputCls} value={reg.name} onChange={e => set({ name: e.target.value })} autoComplete="name" /></label>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Company <span className="font-normal text-slate-400">(optional)</span></span><input className={inputCls} value={reg.company} onChange={e => set({ company: e.target.value })} autoComplete="organization" /></label>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Email</span><input type="email" required className={inputCls} value={reg.email} onChange={e => set({ email: e.target.value })} autoComplete="email" /></label>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Country <span className="font-normal text-slate-400">(optional)</span></span><input className={inputCls} value={reg.country} onChange={e => set({ country: e.target.value })} autoComplete="country-name" /></label>
                  </div>
                  <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Website or social profile</span><input className={inputCls} value={reg.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></label>
                  <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Tell us about your audience</span><textarea className={`${inputCls} h-24`} value={reg.audience} onChange={e => set({ audience: e.target.value })} placeholder="e.g. Travel blog about the Middle East, 40k monthly visitors" /></label>
                  <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Password for your dashboard</span><input type="password" required minLength={8} className={inputCls} value={reg.password} onChange={e => set({ password: e.target.value })} autoComplete="new-password" placeholder="At least 8 characters" /></label>
                  {regError && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{regError}</p>}
                  <button type="submit" disabled={regBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003580] py-4 font-bold text-white shadow-md transition hover:bg-blue-900 disabled:opacity-70">
                    {regBusy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Apply now <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-xs text-slate-400">We review every application within 2 working days. By applying you agree to our affiliate terms.</p>
                </form>
              )}
            </div>
          </div>

          <div id="login-section" className="flex scroll-mt-24 flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              <h2 className="text-2xl font-bold text-slate-900">Already a partner?</h2>
              <p className="mb-6 mt-1 text-slate-500">Sign in to see your clicks, bookings and earnings.</p>
              <form onSubmit={login} className="space-y-4">
                <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Email</span><input type="email" required className={inputCls} value={email} onChange={e => { setEmail(e.target.value); setLoginError(null); }} autoComplete="email" /></label>
                <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Password</span><input type="password" required className={inputCls} value={password} onChange={e => { setPassword(e.target.value); setLoginError(null); }} autoComplete="current-password" /></label>
                {loginError && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loginError}</p>}
                <button type="submit" disabled={loginBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:opacity-70">
                  {loginBusy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> : 'Sign in'}
                </button>
              </form>
              <p className="mt-6 text-xs text-slate-500">Forgot your password? Email <a className="font-semibold text-[#007ac2]" href="mailto:partners@hogicar.com">partners@hogicar.com</a> and we’ll reset it.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateProgram;
