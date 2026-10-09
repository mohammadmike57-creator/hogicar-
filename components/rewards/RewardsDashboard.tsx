import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Car from 'lucide-react/dist/esm/icons/car';
import History from 'lucide-react/dist/esm/icons/history';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import Settings from 'lucide-react/dist/esm/icons/settings';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Info from 'lucide-react/dist/esm/icons/info';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import { rewards, rewardsSession } from '../../api';
import { PasswordField, passwordChecks } from './CreateAccountSheet';

const ease = [0.22, 1, 0.36, 1] as const;
const n = (v: any) => Number(v || 0).toLocaleString('en-US');
const usd = (v: any) => {
  const x = Number(v || 0);
  return `USD ${x.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })}`;
};
const day = (v?: string) => {
  if (!v) return '—';
  const d = new Date(String(v).length <= 10 ? `${v}T12:00:00` : v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TIER_STYLE: Record<string, { card: string; chip: string; ring: string }> = {
  Explorer: { card: 'from-[#0b2a55] via-[#11407d] to-[#1f6fb2]', chip: 'bg-sky-400/20 text-sky-100 ring-sky-300/30', ring: 'ring-sky-300/40' },
  Silver: { card: 'from-[#3a4556] via-[#6b7789] to-[#a9b3c1]', chip: 'bg-white/25 text-white ring-white/40', ring: 'ring-slate-200/60' },
  Gold: { card: 'from-[#6b4a0a] via-[#a8781a] to-[#e2b54a]', chip: 'bg-amber-200/30 text-amber-50 ring-amber-200/50', ring: 'ring-amber-300/60' },
  Platinum: { card: 'from-[#141826] via-[#2c3247] to-[#5d6683]', chip: 'bg-violet-300/20 text-violet-100 ring-violet-200/40', ring: 'ring-violet-200/50' },
};

const STATUS_PILL: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 ring-slate-200',
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  MODIFIED: 'bg-sky-50 text-sky-700 ring-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
};

type Tab = 'overview' | 'trips' | 'rewards' | 'activity' | 'account';

const RewardsDashboard = ({ data, onChange, onOpenBooking, onSignOut, celebrate }: {
  data: any; onChange: (d: any) => void; onOpenBooking: (ref: string) => void; onSignOut: () => void; celebrate?: boolean;
}) => {
  const reduce = !!useReducedMotion();
  const [tab, setTab] = React.useState<Tab>('overview');
  const [redeeming, setRedeeming] = React.useState<number | null>(null);
  const [confirmPts, setConfirmPts] = React.useState<number | null>(null);
  const [issued, setIssued] = React.useState<{ code: string; value: number; expiresOn: string } | null>(null);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState<string | null>(null);
  const [welcome, setWelcome] = React.useState(!!celebrate);

  const acc = data.account || {};
  const pts = data.points || {};
  const tier = data.tier || {};
  const style = TIER_STYLE[tier.name] || TIER_STYLE.Explorer;
  const trips: any[] = data.bookings || [];
  const upcoming = trips.filter(t => t.status !== 'CANCELLED' && t.dropoffDate && new Date(`${t.dropoffDate}T23:59:00`) >= new Date())
    .sort((a, b) => String(a.pickupDate).localeCompare(String(b.pickupDate)));
  const nextReward = (data.rewards || []).find((r: any) => !r.affordable);
  const activeCodes = (data.codes || []).filter((c: any) => c.state === 'ACTIVE');

  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1600); } catch { /* blocked */ }
  };

  const redeem = async (points: number) => {
    setRedeeming(points);
    setError('');
    try {
      const res = await rewards.redeem(points);
      setIssued({ code: res.code, value: res.value, expiresOn: res.expiresOn });
      onChange(res.dashboard);
      setConfirmPts(null);
      try { (window as any).dataLayer?.push({ event: 'rewards_redeem', points }); } catch { /* ignore */ }
    } catch (e: any) {
      if (e?.response?.status === 401) { onSignOut(); return; }
      setError(e?.response?.data?.message || 'We couldn’t create your reward. Please try again.');
    } finally {
      setRedeeming(null);
    }
  };

  const rise = (i: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease, delay: 0.05 * i } });

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'trips', label: 'My trips', icon: Car, badge: upcoming.length || undefined },
    { id: 'rewards', label: 'Rewards', icon: Gift, badge: activeCodes.length || undefined },
    { id: 'activity', label: 'Points history', icon: History },
    { id: 'account', label: 'Account', icon: Settings },
  ];

  const tripCard = (t: any) => {
    const ptsLabel = t.pointsStatus === 'AVAILABLE' ? `+${n(t.points)} pts earned` : t.pointsStatus === 'PENDING' ? `+${n(t.points)} pts after drop-off` : t.pointsStatus === 'CANCELLED' ? 'No points (cancelled)' : null;
    return (
      <li key={t.bookingRef}>
        <button type="button" onClick={() => onOpenBooking(t.bookingRef)}
          className="group flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300 sm:p-4">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
            {t.carImage ? <img src={t.carImage} alt="" loading="lazy" className="h-full w-full object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : <Car className="h-7 w-7 text-slate-300" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-slate-900">{t.carName || 'Car rental'}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_PILL[t.status] || STATUS_PILL.CONFIRMED}`}>{String(t.status || '').charAt(0) + String(t.status || '').slice(1).toLowerCase()}</span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {day(t.pickupDate)} – {day(t.dropoffDate)}</span>
              {t.pickupLocation && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.pickupLocation}</span></span>}
            </p>
            <p className="mt-1 text-xs text-slate-400">Ref {t.bookingRef}{t.supplierName ? ` · ${t.supplierName}` : ''}</p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            {ptsLabel && <p className={`text-xs font-semibold ${t.pointsStatus === 'AVAILABLE' ? 'text-emerald-700' : t.pointsStatus === 'PENDING' ? 'text-amber-700' : 'text-slate-400'}`}>{ptsLabel}</p>}
            <p className="mt-1 inline-flex items-center gap-0.5 text-sm font-semibold text-accent">Manage <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 sm:hidden" />
        </button>
      </li>
    );
  };

  const rewardGrid = (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {(data.rewards || []).map((r: any) => {
        const short = Math.max(0, r.points - (pts.available || 0));
        const progress = Math.min(1, (pts.available || 0) / r.points);
        return (
          <li key={r.points} className={`relative flex flex-col overflow-hidden rounded-2xl p-4 ring-1 transition ${r.affordable ? 'bg-white ring-slate-200 hover:shadow-md' : 'bg-slate-50 ring-slate-200/70'}`}>
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.affordable ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}>
                {r.affordable ? <Gift className="h-5 w-5" /> : <Lock className="h-[18px] w-[18px]" />}
              </span>
              <span className="text-xs font-semibold text-slate-500">{n(r.points)} pts</span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{usd(r.value)}</p>
            <p className="text-xs text-slate-500">off your next rental</p>
            {r.affordable ? (
              <button type="button" onClick={() => setConfirmPts(r.points)} disabled={redeeming != null}
                className="mt-4 h-10 rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60">Redeem</button>
            ) : (
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${progress * 100}%` }} /></div>
                <p className="mt-1.5 text-[11px] text-slate-500">{n(short)} more points</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const codesList = (data.codes || []).length > 0 && (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      {(data.codes || []).map((c: any) => (
        <li key={c.code} className="flex flex-wrap items-center gap-3 p-4">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.state === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}><Ticket className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold tracking-wider text-slate-900">{c.code}</p>
            <p className="text-xs text-slate-500">{usd(c.value)} off · {n(c.points)} pts · {c.state === 'ACTIVE' ? `valid until ${day(c.expiresOn)}` : c.state === 'USED' ? 'used' : c.state === 'EXPIRED' ? 'expired' : 'inactive'}</p>
          </div>
          {c.state === 'ACTIVE' ? (
            <button type="button" onClick={() => copy(c.code)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              {copied === c.code ? <><Check className="h-4 w-4 text-emerald-600" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
            </button>
          ) : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{c.state === 'USED' ? 'Used' : c.state === 'EXPIRED' ? 'Expired' : 'Inactive'}</span>}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="pb-16">
      {/* Hero with membership card */}
      <section className="relative isolate overflow-hidden bg-[#00244f] px-4 pb-10 pt-8 text-white sm:pt-12">
        <div aria-hidden="true" className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[#007ac2]/50 blur-[90px]" />
        <div aria-hidden="true" className="absolute -bottom-32 right-0 -z-10 h-80 w-80 rounded-full bg-amber-500/20 blur-[100px]" />
        <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <motion.div {...rise(0)}>
            <p className="text-sm font-medium text-white/70">Welcome back{acc.firstName ? `, ${acc.firstName}` : ''}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Your HogiCar Rewards</h1>
            <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Available points</p>
                <p className="mt-1 text-5xl font-bold tracking-tight tabular-nums">{n(pts.available)}</p>
                <p className="mt-1 text-sm text-emerald-300">Worth {usd(pts.availableValue)} off</p>
              </div>
              <div className="pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Pending</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white/90">{n(pts.pending)}</p>
                <p className="mt-0.5 text-xs text-white/60">Unlock after drop-off</p>
              </div>
            </div>
            <div className="mt-6 max-w-md">
              {tier.next ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{tier.name}</span>
                    <span className="text-white/70">{tier.rentalsToNext} more {tier.rentalsToNext === 1 ? 'rental' : 'rentals'} to {tier.next} (+{tier.nextBonusPercent}% points)</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" initial={{ width: 0 }} animate={{ width: `${Math.max(4, (tier.progress || 0) * 100)}%` }} transition={{ duration: 1, ease, delay: 0.3 }} />
                  </div>
                </>
              ) : <p className="inline-flex items-center gap-2 text-sm text-amber-200"><Crown className="h-4 w-4" /> You’ve reached our top tier. Thank you!</p>}
            </div>
          </motion.div>

          {/* Membership card */}
          <motion.div {...rise(1)} className="mx-auto w-full max-w-sm [perspective:1200px]">
            <motion.div whileHover={reduce ? undefined : { rotateX: 4, rotateY: -6 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className={`relative aspect-[1.586] overflow-hidden rounded-[22px] bg-gradient-to-br ${style.card} p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ${style.ring}`}>
              <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.18)_50%,transparent_65%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-black tracking-[0.12em]">HOGI<span className="text-[#F57C00]">CAR</span></p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Rewards</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${style.chip}`}><Crown className="h-3.5 w-3.5" /> {tier.name}</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">Points</p>
                  <p className="text-3xl font-bold tabular-nums">{n(pts.available)}</p>
                </div>
                <div className="flex items-end justify-between text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold uppercase tracking-wider">{[acc.firstName, acc.lastName].filter(Boolean).join(' ') || acc.email}</p>
                    <p className="font-mono text-white/70">{acc.memberNumber}</p>
                  </div>
                  <p className="shrink-0 text-right text-white/70">Member since<br /><span className="font-semibold text-white">{day(acc.memberSince)}</span></p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 [scrollbar-width:none]" aria-label="Account sections">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setIssued(null); setError(''); }} aria-current={tab === t.id ? 'page' : undefined}
              className={`relative inline-flex h-12 shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-accent' : 'text-slate-600 hover:text-slate-900'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
              {t.badge ? <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{t.badge}</span> : null}
              {tab === t.id && <motion.span layoutId="rw-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <AnimatePresence>
          {welcome && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white"><Sparkles className="h-5 w-5" /></span>
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Your account is ready!</p>
                <p className="text-sm text-emerald-800/90">We added your welcome bonus and the points from your bookings. Next time, sign in to Manage booking with your email and password.</p>
              </div>
              <button type="button" onClick={() => setWelcome(false)} className="text-sm font-medium text-emerald-800 hover:underline">Close</button>
            </motion.div>
          )}
        </AnimatePresence>

        {issued && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-amber-200">
            <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center sm:flex-row sm:text-left">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow"><Gift className="h-7 w-7" /></span>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-900">Your {usd(issued.value)} reward code</p>
                <p className="text-sm text-slate-600">Enter it in the promo code box at checkout. Valid for one booking until {day(issued.expiresOn)}. We’ve emailed it to you too.</p>
              </div>
              <button type="button" onClick={() => copy(issued.code)} className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-white px-4 py-3 font-mono text-lg font-bold tracking-wider text-slate-900 hover:bg-amber-50">
                {issued.code} {copied === issued.code ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5 text-slate-400" />}
              </button>
            </div>
          </motion.div>
        )}

        {error && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</p>}

        {tab === 'overview' && (
          <div className="space-y-8">
            <motion.dl {...rise(2)} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Available', value: n(pts.available), sub: usd(pts.availableValue), icon: Gift, tone: 'text-amber-600 bg-amber-50' },
                { label: 'Pending', value: n(pts.pending), sub: 'After drop-off', icon: Clock, tone: 'text-sky-600 bg-sky-50' },
                { label: 'Lifetime earned', value: n(pts.lifetime), sub: `${tier.completedRentals || 0} completed rentals`, icon: TrendingUp, tone: 'text-emerald-600 bg-emerald-50' },
                { label: 'Your tier', value: tier.name, sub: tier.bonusPercent ? `+${tier.bonusPercent}% bonus points` : 'Standard points', icon: Crown, tone: 'text-violet-600 bg-violet-50' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-[18px] w-[18px]" /></span>
                  <dt className="mt-3 text-xs font-medium text-slate-500">{s.label}</dt>
                  <dd className="text-xl font-bold tracking-tight text-slate-900">{s.value}</dd>
                  <dd className="text-xs text-slate-500">{s.sub}</dd>
                </div>
              ))}
            </motion.dl>

            {upcoming.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Upcoming trips</h2><button type="button" onClick={() => setTab('trips')} className="text-sm font-medium text-accent hover:underline">All trips</button></div>
                <ul className="space-y-3">{upcoming.slice(0, 2).map(tripCard)}</ul>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Redeem your points</h2>
                  <p className="text-sm text-slate-500">{nextReward ? `${n(nextReward.points - (pts.available || 0))} more points to unlock ${usd(nextReward.value)} off.` : 'Every reward is unlocked. Treat yourself!'}</p>
                </div>
              </div>
              {rewardGrid}
            </section>

            <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">How HogiCar Rewards works</h2>
              <ol className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { t: 'Book with your email', d: `Earn ${pts.pointsPerUsd || 10} points for every USD 1 you spend on a rental, with every booking made with ${acc.email}.` },
                  { t: 'Complete your trip', d: 'Points are pending until your drop-off date, then become available. Cancelled bookings don’t earn points.' },
                  { t: 'Get money off', d: `Exchange 1,000 points for ${usd(pts.usdPer1000Points || 10)} off. Your code works in the promo code box at checkout.` },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
                    <div><p className="font-semibold text-slate-900">{s.t}</p><p className="mt-0.5 text-sm text-slate-600">{s.d}</p></div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(tier.all || []).map((t: any) => {
                  const current = t.name === tier.name;
                  return (
                    <div key={t.name} className={`rounded-2xl p-3 ring-1 ${current ? 'bg-accent-50 ring-accent' : 'bg-slate-50 ring-slate-200'}`}>
                      <p className={`flex items-center gap-1.5 text-sm font-semibold ${current ? 'text-accent-700' : 'text-slate-800'}`}><Crown className="h-4 w-4" /> {t.name}{current && <span className="text-[10px] font-bold uppercase">· You</span>}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.minRentals === 0 ? 'When you join' : `${t.minRentals}+ completed rentals`}</p>
                      <p className="text-xs font-semibold text-slate-700">{t.bonusPercent ? `+${t.bonusPercent}% points` : 'Standard points'}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {tab === 'trips' && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">My trips</h2>
            {trips.length ? <ul className="space-y-3">{trips.map(tripCard)}</ul> : (
              <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200">
                <Car className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-900">No trips yet</p>
                <Link to="/" className="mt-4 inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-white">Find a car</Link>
              </div>
            )}
          </section>
        )}

        {tab === 'rewards' && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Choose a reward</h2>
              <p className="mb-4 text-sm text-slate-500">You have <strong className="text-slate-900">{n(pts.available)}</strong> points available.</p>
              {rewardGrid}
            </section>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">My reward codes</h2>
              {codesList || <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">Codes you redeem will appear here.</p>}
              <p className="mt-3 flex items-start gap-2 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Each code works once, on a booking’s online payment, and can’t be exchanged for cash.</p>
            </section>
          </div>
        )}

        {tab === 'activity' && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Points history</h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {(data.activity || []).map((a: any) => {
                const negative = a.points < 0;
                const label = a.type === 'WELCOME' ? 'Welcome bonus' : a.type === 'REDEEM' ? 'Reward redeemed' : a.type === 'ADJUST' ? 'Adjustment' : 'Rental';
                return (
                  <li key={a.id} className="flex items-center gap-3 p-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.type === 'REDEEM' ? 'bg-amber-50 text-amber-600' : a.type === 'WELCOME' ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                      {a.type === 'REDEEM' ? <Ticket className="h-5 w-5" /> : a.type === 'WELCOME' ? <Sparkles className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{label}{a.bookingRef ? <span className="font-normal text-slate-500"> · {a.bookingRef}</span> : null}</p>
                      <p className="truncate text-xs text-slate-500">{a.description} · {day(a.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold tabular-nums ${a.status === 'CANCELLED' ? 'text-slate-400 line-through' : negative ? 'text-slate-900' : 'text-emerald-700'}`}>{negative ? '' : '+'}{n(a.points)}</p>
                      <p className={`text-[11px] font-medium ${a.status === 'PENDING' ? 'text-amber-700' : a.status === 'CANCELLED' ? 'text-slate-400' : 'text-slate-500'}`}>{a.status === 'PENDING' ? 'Pending' : a.status === 'CANCELLED' ? 'Cancelled' : 'Available'}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === 'account' && <AccountSettings acc={acc} onChange={onChange} onSignOut={onSignOut} />}

        {tab !== 'account' && (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        )}
      </div>

      {/* Redeem confirmation */}
      <AnimatePresence>
        {confirmPts != null && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="rw-confirm-title">
            <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => redeeming == null && setConfirmPts(null)} />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200"><Gift className="h-6 w-6" /></span>
              <h2 id="rw-confirm-title" className="mt-4 text-xl font-bold text-slate-900">Redeem {n(confirmPts)} points?</h2>
              <p className="mt-1 text-sm text-slate-600">You’ll get a one-time code for {usd((data.rewards || []).find((r: any) => r.points === confirmPts)?.value)} off your next rental. You’ll have {n((pts.available || 0) - confirmPts)} points left.</p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmPts(null)} disabled={redeeming != null} className="h-11 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Not now</button>
                <button type="button" onClick={() => redeem(confirmPts)} disabled={redeeming != null} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-70">
                  {redeeming != null && <LoaderCircle className="h-4 w-4 animate-spin" />} Get my code
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AccountSettings = ({ acc, onChange, onSignOut }: { acc: any; onChange: (d: any) => void; onSignOut: () => void }) => {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const valid = passwordChecks(next, acc.email).every(c => c.ok);

  const hasPassword = acc.hasPassword !== false;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { setMsg({ ok: false, text: 'Use at least 8 characters with a letter and a number.' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const res = await rewards.changePassword(current, next);
      rewardsSession.set(res.token);
      onChange(res.dashboard);
      setCurrent(''); setNext('');
      setMsg({ ok: true, text: 'Password updated. Other devices are signed out.' });
    } catch (err: any) {
      if (err?.response?.status === 401) { onSignOut(); return; }
      setMsg({ ok: false, text: err?.response?.data?.message || 'We couldn’t update your password.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your details</h2>
        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          {[
            ['Name', [acc.firstName, acc.lastName].filter(Boolean).join(' ') || '—'],
            ['Email', acc.email],
            ['Member number', acc.memberNumber],
            ['Member since', day(acc.memberSince)],
            ['Sign-in', [acc.googleLinked ? 'Google' : null, acc.hasPassword !== false ? 'Email & password' : null].filter(Boolean).join(' · ') || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-900">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-slate-500">Points are collected for every booking made with this email address.</p>
        <button type="button" onClick={onSignOut} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200"><LogOut className="h-4 w-4" /> Sign out</button>
      </section>
      <form onSubmit={save} className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><KeyRound className="h-5 w-5 text-slate-400" /> {hasPassword ? 'Change password' : 'Set a password'}</h2>
        {!hasPassword && <p className="text-sm text-slate-600">You sign in with Google. Add a password to also sign in with your email.</p>}
        {hasPassword && <PasswordField id="rw-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />}
        <PasswordField id="rw-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
        <p className="text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        {msg && <p role="status" className={`rounded-xl p-3 text-sm ring-1 ${msg.ok ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>{msg.text}</p>}
        <button disabled={busy || (hasPassword && !current) || !next} className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60">
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} {hasPassword ? 'Update password' : 'Save password'}
        </button>
      </form>
    </div>
  );
};

export default RewardsDashboard;
