import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Users from 'lucide-react/dist/esm/icons/users';
import Coins from 'lucide-react/dist/esm/icons/coins';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import Search from 'lucide-react/dist/esm/icons/search';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Ban from 'lucide-react/dist/esm/icons/ban';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Car from 'lucide-react/dist/esm/icons/car';
import Info from 'lucide-react/dist/esm/icons/info';
import { adminAxios, API_BASE_URL } from '../../api';
import { Hero, heroButton, Segmented, Drawer, ErrorBanner, Spinner, Toast, useToast, errorOf, num, fmtDate, ago, inputCls, Field, CopyButton } from './commercialUi';

const BASE = `${API_BASE_URL}/api/admin/loyalty`;
const usd = (v: any) => `USD ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PROVIDER: Record<string, { label: string; cls: string }> = {
  GOOGLE: { label: 'Google', cls: 'bg-white text-slate-700 ring-slate-300' },
  EMAIL: { label: 'Email', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  BOOKING: { label: 'Manage booking', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
};
const TIER_CLS: Record<string, string> = {
  Explorer: 'bg-sky-50 text-sky-700 ring-sky-200',
  Silver: 'bg-slate-100 text-slate-700 ring-slate-300',
  Gold: 'bg-amber-50 text-amber-800 ring-amber-200',
  Platinum: 'bg-violet-50 text-violet-700 ring-violet-200',
};
const CODE_CLS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  USED: 'bg-slate-100 text-slate-600 ring-slate-200',
  EXPIRED: 'bg-amber-50 text-amber-800 ring-amber-200',
  INACTIVE: 'bg-rose-50 text-rose-700 ring-rose-200',
};
const pill = (cls: string, text: React.ReactNode) => <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}>{text}</span>;

const Avatar = ({ name, url }: { name: string; url?: string }) => {
  const [bad, setBad] = React.useState(false);
  const initials = (name || '?').split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return url && !bad
    ? <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setBad(true)} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0b2545] to-[#007ac2] text-sm font-semibold text-white">{initials || '?'}</span>;
};

type Tab = 'members' | 'codes' | 'programme';

const RewardsAdmin: React.FC = () => {
  const [tab, setTab] = React.useState<Tab>('members');
  const [summary, setSummary] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any>({ items: [], total: 0, pages: 0 });
  const [codes, setCodes] = React.useState<any>({ items: [], total: 0 });
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [openId, setOpenId] = React.useState<number | null>(null);
  const { toast, notify: show } = useToast();

  const load = React.useCallback(async (query = q, p = page) => {
    setLoading(true);
    setError('');
    try {
      const [s, m, c] = await Promise.all([
        adminAxios.get(`${BASE}/summary`),
        adminAxios.get(`${BASE}/accounts`, { params: { q: query, page: p, size: 25 } }),
        adminAxios.get(`${BASE}/redemptions`, { params: { size: 50 } }),
      ]);
      setSummary(s.data); setMembers(m.data); setCodes(c.data);
    } catch (e) {
      setError(errorOf(e, 'Couldn’t load Rewards.'));
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const t = setTimeout(() => { setPage(0); load(q, 0); }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const methods = summary?.signUpMethods || {};
  const settings = summary?.settings;

  return (
    <div className="space-y-5">
      <Hero eyebrow="HogiCar Rewards" eyebrowIcon={Gift} title="Rewards programme"
        subtitle="Members, points and reward codes. Customers join from Manage booking, with email or with Google."
        loading={loading && !summary}
        actions={<button className={heroButton} onClick={() => load()}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>}
        kpis={[
          { label: 'Members', value: num(summary?.members), Icon: Users, note: `${num(summary?.newLast30Days)} joined in the last 30 days` },
          { label: 'Points available', value: num(summary?.pointsAvailable), Icon: Coins, note: `Worth ${usd(summary?.liabilityUsd)} if all redeemed` },
          { label: 'Points pending', value: num(summary?.pointsPending), Icon: Clock, note: 'Unlock after drop-off' },
          { label: 'Rewards redeemed', value: num(summary?.redemptions), Icon: Ticket, note: `${num(summary?.pointsRedeemed)} points` },
        ]} />

      {error && <ErrorBanner text={error} onRetry={() => load()} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented layoutId="rw-admin-tab" value={tab} onChange={setTab} items={[
          { key: 'members', label: 'Members', count: summary?.members },
          { key: 'codes', label: 'Reward codes', count: codes.total },
          { key: 'programme', label: 'Programme' },
        ]} />
        {tab === 'members' && (
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email or member no." aria-label="Search members"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#007ac2] focus:ring-2 focus:ring-[#007ac2]/20" />
          </div>
        )}
      </div>

      {tab === 'members' && (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_1fr_24px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <span>Member</span><span>Tier</span><span className="text-right">Available</span><span className="text-right">Pending</span><span>Joined</span><span />
          </div>
          {loading && !members.items.length ? (
            <div className="flex justify-center p-12"><Spinner /></div>
          ) : !members.items.length ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-900">{q ? 'No members match your search' : 'No members yet'}</p>
              <p className="mt-1 text-sm text-slate-500">{q ? 'Try a different name or email.' : 'Customers appear here after they create an account.'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.items.map((m: any) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setOpenId(m.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50 lg:grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_1fr_24px]">
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={m.name || m.email} url={m.avatarUrl} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold text-slate-900">{m.name || m.email}</span>
                          {m.status === 'SUSPENDED' && pill('bg-rose-50 text-rose-700 ring-rose-200', 'Suspended')}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{m.email} · {m.memberNumber}</span>
                        <span className="mt-1 flex flex-wrap gap-1.5 lg:hidden">{pill(TIER_CLS[m.tier] || TIER_CLS.Explorer, m.tier)}{pill('bg-emerald-50 text-emerald-700 ring-emerald-200', `${num(m.available)} pts`)}</span>
                      </span>
                    </span>
                    <span className="hidden lg:block">{pill(TIER_CLS[m.tier] || TIER_CLS.Explorer, <><Crown className="h-3 w-3" /> {m.tier}</>)}</span>
                    <span className="hidden text-right font-semibold tabular-nums text-slate-900 lg:block">{num(m.available)}</span>
                    <span className="hidden text-right tabular-nums text-slate-500 lg:block">{num(m.pending)}</span>
                    <span className="hidden text-sm text-slate-600 lg:block">{fmtDate(m.createdAt)}<span className="block text-[11px] text-slate-400">via {PROVIDER[m.provider]?.label || m.provider}</span></span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {members.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
              <span className="text-slate-500">{num(members.total)} members</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => { setPage(page - 1); load(q, page - 1); }} className="h-9 rounded-lg px-3 font-medium ring-1 ring-slate-200 disabled:opacity-40">Previous</button>
                <button disabled={page + 1 >= members.pages} onClick={() => { setPage(page + 1); load(q, page + 1); }} className="h-9 rounded-lg px-3 font-medium ring-1 ring-slate-200 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'codes' && (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {!codes.items.length ? (
            <div className="p-12 text-center"><Ticket className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold text-slate-900">No rewards redeemed yet</p></div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {codes.items.map((c: any) => (
                <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Ticket className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-slate-900">{c.code} <CopyButton text={c.code} className="h-7 w-7 text-slate-400 hover:bg-slate-100" /></p>
                    <p className="truncate text-xs text-slate-500">{c.memberEmail} · {c.memberNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{usd(c.value)}</p>
                    <p className="text-xs text-slate-500">{num(c.points)} pts · {ago(c.createdAt)}</p>
                  </div>
                  <div className="w-24 text-right">{pill(CODE_CLS[c.state] || CODE_CLS.ACTIVE, c.state.charAt(0) + c.state.slice(1).toLowerCase())}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'programme' && settings && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-900">Earning and redeeming</h3>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              {[
                ['Points per USD 1 spent', num(settings.pointsPerUsd)],
                ['Value of 1,000 points', usd(settings.usdPer1000Points)],
                ['Welcome bonus', `${num(settings.welcomeBonus)} points`],
                ['Points become available', 'After drop-off'],
                ['Cancelled bookings', 'Points removed'],
                ['Reward codes', 'Single use, valid 12 months'],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>)}
            </dl>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Rates are set on the server with LOYALTY_POINTS_PER_USD, LOYALTY_USD_PER_1000_POINTS and LOYALTY_WELCOME_BONUS.</p>
          </section>
          <section className="space-y-5">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">Tiers</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {settings.tiers.map((t: any) => (
                  <div key={t.name} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><Crown className="h-4 w-4 text-amber-500" /> {t.name}</p>
                    <p className="text-xs text-slate-500">{t.minRentals === 0 ? 'On joining' : `${t.minRentals}+ completed rentals`} · {t.bonusPercent ? `+${t.bonusPercent}% points` : 'standard'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">Sign-up methods</h3>
              <ul className="mt-4 space-y-2.5">
                {(['BOOKING', 'EMAIL', 'GOOGLE'] as const).map(k => {
                  const count = Number(methods[k] || 0);
                  const total = Math.max(1, Number(summary?.members || 0));
                  return (
                    <li key={k}>
                      <div className="flex justify-between text-sm"><span className="text-slate-700">{PROVIDER[k].label}</span><span className="font-semibold tabular-nums text-slate-900">{num(count)}</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#007ac2]" style={{ width: `${(count / total) * 100}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
              <p className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs ring-1 ${settings.googleSignIn ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'}`}>
                {settings.googleSignIn ? <><CheckCircle className="h-4 w-4" /> Continue with Google is on.</> : <><Info className="h-4 w-4" /> Continue with Google is off. Set GOOGLE_CLIENT_ID on the server to show it.</>}
              </p>
            </div>
          </section>
        </div>
      )}

      <AnimatePresence>
        {openId != null && <MemberDrawer id={openId} onClose={() => setOpenId(null)} onChanged={(msg) => { show(msg); load(); }} onError={(msg) => show(msg, 'err')} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

const MemberDrawer = ({ id, onClose, onChanged, onError }: { id: number; onClose: () => void; onChanged: (msg: string) => void; onError: (msg: string) => void }) => {
  const [data, setData] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const [points, setPoints] = React.useState('');
  const [sign, setSign] = React.useState<1 | -1>(1);
  const [reason, setReason] = React.useState('');

  const load = React.useCallback(async () => {
    try { setData((await adminAxios.get(`${BASE}/accounts/${id}`)).data); }
    catch (e) { onError(errorOf(e, 'Couldn’t load this member.')); onClose(); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { load(); }, [load]);

  const adjust = async () => {
    const n = parseInt(points, 10);
    if (!n || n <= 0) { onError('Enter a number of points.'); return; }
    if (!reason.trim()) { onError('Add a reason the member will see.'); return; }
    setBusy(true);
    try {
      await adminAxios.post(`${BASE}/accounts/${id}/adjust`, { points: sign * n, reason: reason.trim() });
      setPoints(''); setReason('');
      await load();
      onChanged(`${sign > 0 ? 'Added' : 'Removed'} ${num(n)} points`);
    } catch (e) { onError(errorOf(e, 'Couldn’t adjust points.')); }
    finally { setBusy(false); }
  };

  const toggleStatus = async () => {
    const next = data.member.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (next === 'SUSPENDED' && !window.confirm('Suspend this member? They will be signed out and can’t sign in until you reactivate them.')) return;
    setBusy(true);
    try {
      await adminAxios.patch(`${BASE}/accounts/${id}/status`, { status: next });
      await load();
      onChanged(next === 'SUSPENDED' ? 'Member suspended' : 'Member reactivated');
    } catch (e) { onError(errorOf(e, 'Couldn’t update the member.')); }
    finally { setBusy(false); }
  };

  const m = data?.member;
  const pts = data?.points;
  return (
    <Drawer eyebrow="Rewards member" title={m ? (m.name || m.email) : 'Loading…'} onClose={onClose} busy={busy} width="max-w-[640px]">
      {!data ? <div className="flex justify-center p-10"><Spinner /></div> : (
        <div className="space-y-5">
          <section className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <Avatar name={m.name || m.email} url={m.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-600">{m.email}</p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {pill('bg-slate-100 text-slate-700 ring-slate-200', m.memberNumber)}
                {pill(TIER_CLS[m.tier] || TIER_CLS.Explorer, <><Crown className="h-3 w-3" /> {m.tier}</>)}
                {pill(PROVIDER[m.provider]?.cls || PROVIDER.BOOKING.cls, `Joined via ${PROVIDER[m.provider]?.label || m.provider}`)}
                {m.googleLinked && m.provider !== 'GOOGLE' && pill(PROVIDER.GOOGLE.cls, 'Google linked')}
                {m.status === 'SUSPENDED' && pill('bg-rose-50 text-rose-700 ring-rose-200', 'Suspended')}
              </p>
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[['Available', pts.available], ['Pending', pts.pending], ['Lifetime', pts.lifetime], ['Redeemed', pts.redeemed]].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl bg-white p-3.5 ring-1 ring-slate-200"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-lg font-semibold tabular-nums text-slate-900">{num(v as number)}</dd></div>
            ))}
          </dl>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Adjust points</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => setSign(1)} className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold ${sign > 0 ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}><Plus className="h-4 w-4" /> Add</button>
                <button type="button" onClick={() => setSign(-1)} className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold ${sign < 0 ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'}`}><Minus className="h-4 w-4" /> Remove</button>
              </div>
              <input value={points} onChange={e => setPoints(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Points, e.g. 500" aria-label="Points" className={inputCls} />
            </div>
            <Field label="Reason (shown to the member)" className="mt-3">
              <input value={reason} onChange={e => setReason(e.target.value)} maxLength={200} placeholder="e.g. Goodwill for the late pick-up" className={inputCls} />
            </Field>
            <button type="button" onClick={adjust} disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{busy && <Spinner light />} Save adjustment</button>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Trips</h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {(data.bookings || []).length === 0 && <li className="p-4 text-sm text-slate-500">No bookings with this email.</li>}
              {(data.bookings || []).map((b: any) => (
                <li key={b.bookingRef} className="flex items-center gap-3 px-4 py-3">
                  <Car className="h-5 w-5 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{b.carName || 'Car rental'} <span className="font-normal text-slate-500">· {b.bookingRef}</span></p>
                    <p className="truncate text-xs text-slate-500">{fmtDate(b.pickupDate)} – {fmtDate(b.dropoffDate)} · {String(b.status).toLowerCase()}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${b.pointsStatus === 'AVAILABLE' ? 'text-emerald-700' : b.pointsStatus === 'PENDING' ? 'text-amber-700' : 'text-slate-400'}`}>{b.points ? `+${num(b.points)}` : '—'}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Points history</h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {(data.activity || []).map((a: any) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-slate-500">{fmtDate(a.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-700">{a.description}</span>
                  <span className={`shrink-0 font-semibold tabular-nums ${a.status === 'CANCELLED' ? 'text-slate-400 line-through' : a.points < 0 ? 'text-slate-900' : 'text-emerald-700'}`}>{a.points > 0 ? '+' : ''}{num(a.points)}</span>
                  <span className="w-16 shrink-0 text-right text-[11px] text-slate-400">{a.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{m.status === 'SUSPENDED' ? 'Member is suspended' : 'Account access'}</p>
              <p className="text-slate-500">Last sign-in {m.lastLoginAt ? ago(m.lastLoginAt) : 'never'}.</p>
            </div>
            <button type="button" onClick={toggleStatus} disabled={busy}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold ring-1 ${m.status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
              {m.status === 'SUSPENDED' ? <><CheckCircle className="h-4 w-4" /> Reactivate</> : <><Ban className="h-4 w-4" /> Suspend</>}
            </button>
          </section>
        </div>
      )}
    </Drawer>
  );
};

export default RewardsAdmin;
