import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CalendarPlus from 'lucide-react/dist/esm/icons/calendar-plus';
import Tag from 'lucide-react/dist/esm/icons/tag';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Package from 'lucide-react/dist/esm/icons/package';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Percent from 'lucide-react/dist/esm/icons/percent';
import { Booking } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import { api, manageBooking } from '../api';
import ChangeBookingSheet from '../components/manage/ChangeBookingSheet';
import CancelBookingSheet from '../components/manage/CancelBookingSheet';
import { changeRequestOf, changeStatusOf, fmtDay } from '../utils/changeRequest';
import WalletButtons from '../components/wallet/WalletButtons';
import Gift from 'lucide-react/dist/esm/icons/gift';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import CreateAccountSheet, { PasswordField, passwordChecks } from '../components/rewards/CreateAccountSheet';
import RewardsDashboard from '../components/rewards/RewardsDashboard';
import { rewards, rewardsSession } from '../api';

const ease = [0.22, 1, 0.36, 1] as const;

// ---------- helpers ----------

type Status = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'modified';
const statusOf = (b: any): Status => {
  const s = String(b?.status || '').toLowerCase();
  return (['confirmed', 'pending', 'cancelled', 'completed', 'modified'].includes(s) ? s : 'confirmed') as Status;
};
const pickupOf = (b: any) => b.pickupDate || b.startDate;
const dropoffOf = (b: any) => b.dropoffDate || b.endDate;
const toDate = (d?: string, t?: string) => {
  if (!d) return null;
  const x = new Date(`${d}T${(t || '10:00').slice(0, 5)}:00`);
  return isNaN(x.getTime()) ? null : x;
};
const fmtLong = (d: Date | null) => (d ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const daysBetween = (a: Date | null, b: Date | null) => (a && b ? Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000)) : null);

const STATUS_UI: Record<Status, { label: string; title: string; text: string; tone: string; icon: any; bar: string }> = {
  confirmed: { label: 'Confirmed', title: 'Your booking is confirmed', text: 'Everything is ready. Show your voucher at the rental desk.', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200', icon: CheckCircle, bar: 'from-emerald-500 to-teal-400' },
  modified: { label: 'Updated', title: 'Your booking was updated', text: 'Your latest changes are saved. Your voucher shows the new details.', tone: 'bg-sky-50 text-sky-800 ring-sky-200', icon: CheckCircle, bar: 'from-sky-500 to-[#007ac2]' },
  pending: { label: 'Awaiting confirmation', title: 'Waiting for the rental company', text: 'The supplier usually confirms within a few hours. We’ll email you as soon as it’s confirmed.', tone: 'bg-amber-50 text-amber-800 ring-amber-200', icon: Clock, bar: 'from-amber-400 to-orange-500' },
  cancelled: { label: 'Cancelled', title: 'This booking was cancelled', text: 'Nothing more is needed. Any refund goes back to your original payment method.', tone: 'bg-rose-50 text-rose-700 ring-rose-200', icon: XCircle, bar: 'from-rose-500 to-red-500' },
  completed: { label: 'Completed', title: 'Trip completed', text: 'Thanks for renting with Hogicar. We hope you enjoyed the drive.', tone: 'bg-slate-100 text-slate-700 ring-slate-200', icon: CheckCircle, bar: 'from-slate-400 to-slate-500' },
};

const icsFor = (b: any) => {
  const start = toDate(pickupOf(b), b.startTime);
  const end = toDate(dropoffOf(b), b.endTime);
  if (!start || !end) return null;
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const car = [b.carMake, b.carModel].filter(Boolean).join(' ') || b.carName || 'Rental car';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hogicar//Booking//EN', 'BEGIN:VEVENT',
    `UID:${b.bookingRef || b.id}@hogicar.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:Car rental · ${car} (${b.bookingRef || b.id})`,
    `LOCATION:${(b.pickupLocationName || b.pickupCode || '').replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:Hogicar booking ${b.bookingRef || b.id}. Bring your driving licence\\, passport and credit card.`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
};

// ---------- Lookup screen ----------

type LookupMode = 'reference' | 'password' | 'reset';

const LookupScreen = ({ onLogin, onPasswordLogin, onReset, error, isLoading, initialEmail = '', initialMode = 'reference' }: {
  onLogin: (email: string, ref: string) => void;
  onPasswordLogin: (email: string, password: string) => void;
  onReset: (email: string, ref: string, password: string) => void;
  error: string; isLoading: boolean; initialEmail?: string; initialMode?: LookupMode;
}) => {
  const reduce = !!useReducedMotion();
  const [mode, setMode] = React.useState<LookupMode>(initialMode);
  const [email, setEmail] = React.useState(initialEmail);
  const [bookingRef, setBookingRef] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showHelp, setShowHelp] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const refOk = bookingRef.trim().length >= 3;
  const needsRef = mode !== 'password';
  const passOk = mode === 'password' ? password.length > 0 : mode === 'reset' ? passwordChecks(password, email).every(c => c.ok) : true;

  const switchMode = (m: LookupMode) => { setMode(m); setTouched(false); setPassword(''); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailOk || (needsRef && !refOk) || !passOk) return;
    if (mode === 'password') onPasswordLogin(email, password);
    else if (mode === 'reset') onReset(email, bookingRef, password);
    else onLogin(email, bookingRef);
  };
  const rise = (i: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease, delay: 0.08 * i } });

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#00244f] px-4 pb-28 pt-10 text-white sm:pb-36 sm:pt-16">
        <div aria-hidden="true" className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[#007ac2]/50 blur-[90px]" />
        <div aria-hidden="true" className="absolute -bottom-32 right-0 -z-10 h-80 w-80 rounded-full bg-amber-500/20 blur-[100px]" />
        {!reduce && <motion.div aria-hidden="true" className="absolute left-1/2 top-10 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-[90px]" animate={{ x: [0, 80, -40, 0], y: [0, 30, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="mx-auto max-w-2xl text-center">
          <motion.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/15">
            <ShieldCheck className="h-3.5 w-3.5" /> Manage booking
          </motion.p>
          <motion.h1 {...rise(1)} className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Your trip, in your hands</motion.h1>
          <motion.p {...rise(2)} className="mx-auto mt-3 max-w-lg text-base text-white/70 sm:text-lg">View your voucher, change dates or cancel. Use your booking reference, or sign in to your HogiCar Rewards account.</motion.p>
        </div>
      </section>

      {/* Card */}
      <div className="relative z-10 mx-auto -mt-20 max-w-xl px-4 sm:-mt-24">
        <motion.div {...rise(3)} className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-200">
          {mode !== 'reset' ? (
            <div role="tablist" aria-label="How to find your booking" className="grid grid-cols-2 gap-1 border-b border-slate-100 bg-slate-50 p-1.5">
              {([['reference', 'Booking reference', Tag], ['password', 'Password', KeyRound]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => switchMode(id)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${mode === id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:px-8">
              <p className="text-sm font-semibold text-slate-900">Reset your password</p>
              <button type="button" onClick={() => switchMode('password')} className="text-sm font-medium text-accent hover:text-accent-700">Back to sign in</button>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-5 p-5 sm:p-8">
            {mode === 'reset' && <p className="-mt-1 text-sm text-slate-600">Confirm it’s you with any booking reference from your account, then choose a new password.</p>}
            <AnimatePresence>
              {error && (
                <motion.div role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <label htmlFor="mb-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-accent" />
                <input id="mb-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} placeholder="The email you booked with"
                  aria-invalid={touched && !emailOk}
                  className={`h-12 w-full rounded-xl border bg-white pl-11 pr-3.5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${touched && !emailOk ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-300 hover:border-slate-400 focus:border-accent focus:ring-accent/15'}`} />
              </div>
              {touched && !emailOk && <p className="mt-1.5 text-xs font-medium text-rose-600">Enter a valid email address.</p>}
            </div>
            {needsRef && (<div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="mb-ref" className="block text-sm font-medium text-slate-700">Booking reference</label>
                <button type="button" onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-700">
                  Where do I find it? <ChevronDown className={`h-4 w-4 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className="group relative">
                <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-accent" />
                <input id="mb-ref" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={bookingRef} onChange={e => setBookingRef(e.target.value.toUpperCase().replace(/\s+/g, ''))} placeholder="e.g. H56015"
                  aria-invalid={touched && !refOk}
                  className={`h-12 w-full rounded-xl border bg-white pl-11 pr-3.5 font-mono text-base uppercase tracking-wider text-slate-900 outline-none transition-all placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:ring-4 ${touched && !refOk ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-300 hover:border-slate-400 focus:border-accent focus:ring-accent/15'}`} />
              </div>
              {touched && !refOk && <p className="mt-1.5 text-xs font-medium text-rose-600">Enter your booking reference.</p>}
              <AnimatePresence>
                {showHelp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                        <p className="text-[11px] text-slate-400">From: Hogicar · Booking confirmation</p>
                        <p className="mt-1 text-sm text-slate-700">Your booking reference is <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold text-slate-900">H56015</span></p>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600">It’s at the top of your confirmation email and on your rental voucher. It starts with <span className="font-semibold">H</span>. Can’t find the email? Check your spam folder.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>)}
            {mode !== 'reference' && (
              <div>
                <PasswordField id="mb-password" label={mode === 'reset' ? 'New password' : 'Password'} value={password} onChange={setPassword}
                  autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} invalid={touched && !passOk} />
                {touched && !passOk && <p className="mt-1.5 text-xs font-medium text-rose-600">{mode === 'reset' ? 'Use at least 8 characters with a letter and a number.' : 'Enter your password.'}</p>}
                {mode === 'password' && (
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => switchMode('reset')} className="text-sm font-medium text-accent hover:text-accent-700">Forgot password?</button>
                  </div>
                )}
              </div>
            )}
            <motion.button type="submit" disabled={isLoading} whileTap={reduce ? undefined : { scale: 0.985 }}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent text-[15px] font-semibold text-white shadow-lg shadow-accent/25 transition-colors hover:bg-accent-700 disabled:cursor-wait disabled:opacity-80">
              {!reduce && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[300%]" />}
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> {mode === 'reference' ? 'Finding your booking…' : 'Signing in…'}</>
                : <>{mode === 'reference' ? 'Find my booking' : mode === 'password' ? 'Sign in' : 'Save password & sign in'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </motion.button>
          </form>
          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" /> {mode === 'reference' ? 'Your details are encrypted and only used to find your booking' : 'Your password is encrypted and never shared'}
          </div>
          {mode === 'password' && (
            <div className="flex items-start gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:px-8">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p>No account yet? Find your booking with its reference, then choose <strong>Create account</strong> to start collecting points.</p>
            </div>
          )}
        </motion.div>

        {/* What you can do */}
        <motion.ul {...rise(4)} className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: FileText, title: 'Voucher', text: 'View & print' },
            { icon: Edit2, title: 'Change', text: 'Dates & details' },
            { icon: XCircle, title: 'Cancel', text: 'In a few taps' },
          ].map(x => (
            <li key={x.title} className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200 sm:p-4">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent"><x.icon className="h-5 w-5" /></span>
              <p className="mt-2 text-sm font-semibold text-slate-900">{x.title}</p>
              <p className="text-xs text-slate-500">{x.text}</p>
            </li>
          ))}
        </motion.ul>
        <motion.p {...rise(5)} className="mt-6 pb-4 text-center text-sm text-slate-500">
          Need a hand? <Link to="/contact" className="font-semibold text-accent hover:text-accent-700">Contact our support team</Link>
        </motion.p>
      </div>
    </div>
  );
};

// ---------- Detail view ----------

const Row = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className={`text-right text-sm ${strong ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>{value}</dd>
  </div>
);

/** "Add to Apple Wallet / Google Wallet" card; hidden when no wallet is available. */
const WalletStrip: React.FC<{ booking: any }> = ({ booking }) => {
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const onAvailability = React.useCallback((v: boolean) => setAvailable(v), []);
  return (
    <section className={available === false ? 'hidden' : 'overflow-hidden rounded-3xl bg-[#0b2545] p-5 text-white shadow-sm sm:p-6'} aria-label="Add to wallet">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">Digital wallet</p>
          <h2 className="mt-1 text-lg font-semibold">Your voucher, one tap away</h2>
          <p className="mt-0.5 text-sm text-sky-100/80">Add it to your phone’s wallet. It works offline at the desk.</p>
        </div>
        <WalletButtons bookingRef={booking.bookingRef} status={booking.status} layout="stack" className="w-full shrink-0 sm:w-[230px]" onAvailability={onAvailability} />
      </div>
    </section>
  );
};

/** Invites a guest to create a HogiCar Rewards account (or sign in if they have one). */
const RewardsBanner = ({ email, bookingRef, onCreated, onSignIn }: { email: string; bookingRef: string; onCreated: (d: any) => void; onSignIn: () => void }) => {
  const [offer, setOffer] = React.useState<{ hasAccount: boolean; bookingPoints: number; welcomeBonus: number } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    rewards.offer(email, bookingRef).then(o => { if (alive) setOffer(o); }).catch(() => { /* banner is optional */ });
    return () => { alive = false; };
  }, [email, bookingRef]);
  if (!offer || hidden) return null;
  const total = (offer.bookingPoints || 0) + (offer.hasAccount ? 0 : offer.welcomeBonus || 0);
  return (
    <>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#00244f] via-[#003a7a] to-[#0a5fa8] p-5 text-white shadow-sm sm:p-6">
        <div aria-hidden="true" className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-[#00244f] shadow-lg shadow-amber-500/30"><Gift className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">HogiCar Rewards</p>
            {offer.hasAccount ? (
              <>
                <h2 className="mt-0.5 text-lg font-semibold">You have a Rewards account</h2>
                <p className="text-sm text-white/75">Sign in with your password to see your points and all your trips in one place.</p>
              </>
            ) : (
              <>
                <h2 className="mt-0.5 text-lg font-semibold">Collect {total.toLocaleString()} points with this booking</h2>
                <p className="text-sm text-white/75">Create a free account: just choose a password. Earn points on every rental and swap them for money off.</p>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => (offer.hasAccount ? onSignIn() : setOpen(true))}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-[#00244f] shadow hover:bg-amber-50">
              {offer.hasAccount ? 'Sign in' : 'Create account'} <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setHidden(true)} aria-label="Hide" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>
      </motion.section>
      <AnimatePresence>
        {open && (
          <CreateAccountSheet email={email} bookingRef={bookingRef} bookingPoints={offer.bookingPoints || 0} welcomeBonus={offer.welcomeBonus || 0}
            onClose={() => setOpen(false)} onCreated={d => { setOpen(false); onCreated(d); }} />
        )}
      </AnimatePresence>
    </>
  );
};

const BookingDetailView = ({ booking, email, onBookingModified, onBack, initialAction, signedIn = false, onAccountCreated, onSignInRequest }: {
  booking: Booking, email: string, onBookingModified: (updatedBooking: Booking) => void, onBack: () => void, initialAction?: string | null,
  signedIn?: boolean, onAccountCreated?: (dashboard: any) => void, onSignInRequest?: () => void,
}) => {
  const b: any = booking;
  const reduce = !!useReducedMotion();
  const { convertPrice, getCurrencySymbol, selectedCurrency } = useCurrency();
  const [imageError, setImageError] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const navigate = useNavigate();
  const [changeTab, setChangeTab] = React.useState<null | 'dates' | 'contact'>(null);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  React.useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const status = statusOf(b);
  const ui = STATUS_UI[status];
  const ref = b.bookingRef || b.id;
  const start = toDate(pickupOf(b), b.startTime);
  const end = toDate(dropoffOf(b), b.endTime);
  const days = daysBetween(start, end);
  const now = new Date();
  const isPast = end ? end < now : false;
  const active = status !== 'cancelled' && status !== 'completed' && !isPast;
  const daysToPickup = start ? Math.ceil((start.getTime() - now.getTime()) / 86400000) : null;
  const carName = [b.carMake, b.carModel].filter(Boolean).join(' ') || b.carName || 'Your car';
  const displayImage = imageError || !b.carImage ? null : b.carImage;
  const currency = b.currency || 'USD';
  const price = (amount?: number) => {
    const n = Number(amount) || 0;
    return currency === selectedCurrency ? `${getCurrencySymbol()}${convertPrice(n).toFixed(2)}` : `${currency} ${n.toFixed(2)}`;
  };
  const extras = String(b.extrasSummary || '').split(';').map((x: string) => x.trim()).filter(Boolean);
  const ics = icsFor(b);

  const car = {
    category: b.carCategory || 'Standard', transmission: b.carTransmission || 'Automatic', fuelPolicy: b.carFuelPolicy || 'Full to Full',
    airCon: b.carAirConditioning ?? true,
  } as any;

  // "Add flight number" email links open the contact tab straight away.
  React.useEffect(() => {
    if (initialAction === 'flight' && active) setChangeTab('contact');
  }, [initialAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = changeRequestOf(b);
  const changeStatus = changeStatusOf(b);
  const pendingChange = changeStatus === 'REQUESTED' && change;

  const updated = (next: any, message?: string) => {
    if (next && typeof next === 'object') onBookingModified({ ...b, ...next });
    if (message) setToast(message);
  };

  const withdraw = async () => {
    setWithdrawing(true);
    try { updated(await manageBooking.withdrawChange(email, String(ref)), 'Change request withdrawn'); }
    catch (e: any) { alert(e?.response?.data?.message || 'We couldn’t withdraw the request. Please try again.'); }
    finally { setWithdrawing(false); }
  };

  const copyRef = async () => {
    try { await navigator.clipboard.writeText(String(ref)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };

  const rise = (i: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, ease, delay: 0.06 * i } });

  const actions = [
    { key: 'voucher', icon: FileText, title: 'View voucher', text: 'Show it at the desk', to: `/voucher?bookingRef=${ref}`, show: status !== 'cancelled' },
    { key: 'modify', icon: Edit2, title: 'Change booking', text: pendingChange ? 'Request pending' : 'Dates, flight or phone', onClick: () => setChangeTab(pendingChange ? 'contact' : 'dates'), busy: false, show: active },
    { key: 'calendar', icon: CalendarPlus, title: 'Add to calendar', text: 'Pick-up reminder', href: ics, download: `hogicar-${ref}.ics`, show: active && !!ics },
    { key: 'review', icon: Star, title: 'Leave a review', text: 'Rate your rental', onClick: () => navigate(`/leave-review/${encodeURIComponent(String(ref))}`, { state: { email } }), show: (status === 'completed' || (isPast && status !== 'cancelled')) && !b.reviewSubmitted },
    { key: 'cancel', icon: XCircle, title: 'Cancel booking', text: 'Free up to 48h before', onClick: () => setConfirmCancel(true), show: active, danger: true },
  ].filter(a => a.show);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      <AnimatePresence>
        {changeTab && (
          <ChangeBookingSheet key="change" booking={b} email={email} initialTab={changeTab}
            datesLocked={pendingChange ? 'You already asked to change the dates. Withdraw that request on the booking page to send a new one.' : null}
            onClose={() => setChangeTab(null)} onUpdated={(next, msg) => updated(next, msg)} />
        )}
        {confirmCancel && (
          <CancelBookingSheet key="cancel" booking={b} email={email} carName={carName} money={price}
            onClose={() => setConfirmCancel(false)}
            onCancelled={next => updated({ ...next, status: 'CANCELLED' })}
            onChangeInstead={() => { setConfirmCancel(false); setChangeTab('dates'); }} />
        )}
      </AnimatePresence>

      <motion.div {...rise(0)} className="mb-5 flex items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> <span className="sm:hidden">Back</span><span className="hidden sm:inline">{signedIn ? 'Back to my account' : 'Find another booking'}</span>
        </button>
        <button onClick={copyRef} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3.5 text-sm shadow-sm ring-1 ring-slate-200 hover:ring-slate-300" aria-label="Copy booking reference">
          <span className="text-slate-500">Ref</span> <span className="font-mono font-bold text-slate-900">{ref}</span>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
        </button>
      </motion.div>

      {!signedIn && onAccountCreated && (
        <RewardsBanner email={email} bookingRef={String(ref)} onCreated={onAccountCreated} onSignIn={() => onSignInRequest?.()} />
      )}

      {/* Hero */}
      <motion.section {...rise(1)} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className={`h-1.5 bg-gradient-to-r ${ui.bar}`} />
        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ui.tone}`}>
              <ui.icon className="h-3.5 w-3.5" /> {ui.label}
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{ui.title}</h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600">{ui.text}</p>
            {active && daysToPickup !== null && daysToPickup >= 0 && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2.5 text-white">
                <span className="text-2xl font-bold tabular-nums">{daysToPickup === 0 ? 'Today' : daysToPickup}</span>
                <span className="text-xs leading-tight text-white/70">{daysToPickup === 0 ? 'is pick-up day' : <>day{daysToPickup === 1 ? '' : 's'} until<br />pick-up</>}</span>
              </div>
            )}
          </div>
          <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4 ring-1 ring-slate-100">
            {displayImage
              ? <motion.img initial={{ opacity: 0, x: reduce ? 0 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease, delay: 0.2 }} src={displayImage} alt={carName} onError={() => setImageError(true)} referrerPolicy="no-referrer" className="h-32 w-full object-contain sm:h-36" />
              : <span className="flex h-32 items-center text-sm text-slate-400">{carName}</span>}
          </div>
        </div>
      </motion.section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {/* Change request status */}
          <AnimatePresence initial={false}>
            {change && changeStatus && changeStatus !== 'WITHDRAWN' && (changeStatus === 'REQUESTED' || change.decidedAt) && (
              <motion.section key={changeStatus} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden rounded-3xl p-5 ring-1 sm:p-6 ${changeStatus === 'REQUESTED' ? 'bg-amber-50 ring-amber-200' : changeStatus === 'APPROVED' ? 'bg-emerald-50 ring-emerald-200' : 'bg-rose-50 ring-rose-200'}`}>
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${changeStatus === 'REQUESTED' ? 'bg-amber-500' : changeStatus === 'APPROVED' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {changeStatus === 'REQUESTED' ? <Clock className="h-5 w-5" /> : changeStatus === 'APPROVED' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-slate-900">
                      {changeStatus === 'REQUESTED' ? 'Change request waiting for the rental company' : changeStatus === 'APPROVED' ? 'Your date change was approved' : 'Your date change was declined'}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {changeStatus === 'REQUESTED' ? 'Your booking keeps its current dates until they approve. We’ll email you as soon as they reply.'
                        : changeStatus === 'APPROVED' ? 'Your voucher shows the new dates. Any price difference is settled at the rental desk.'
                        : 'Your booking keeps its original dates.'}
                    </p>
                    {changeStatus === 'REQUESTED' && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-amber-100"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requested pick-up</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{fmtDay(change.pickupDate, change.startTime)}</p></div>
                        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-amber-100"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requested drop-off</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{fmtDay(change.dropoffDate, change.endTime)}</p></div>
                      </div>
                    )}
                    {change.decisionMessage && changeStatus !== 'REQUESTED' && <p className="mt-2 text-sm italic text-slate-700">“{change.decisionMessage}”</p>}
                    {changeStatus === 'REQUESTED' && (
                      <button onClick={withdraw} disabled={withdrawing} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60">
                        {withdrawing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> : <X className="h-4 w-4" />} Withdraw request
                      </button>
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Actions */}
          {actions.length > 0 && (
            <motion.ul {...rise(2)} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {actions.map(a => {
                const inner = (
                  <>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.danger ? 'bg-rose-50 text-rose-600' : 'bg-accent-50 text-accent'}`}>
                      {a.busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" /> : <a.icon className="h-5 w-5" />}
                    </span>
                    <span className="mt-2.5 block text-sm font-semibold text-slate-900">{a.title}</span>
                    <span className="block text-xs text-slate-500">{a.text}</span>
                  </>
                );
                const cls = `block h-full w-full rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 transition-all active:scale-[0.98] ${a.danger ? 'ring-slate-200 hover:ring-rose-300' : 'ring-slate-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-accent/40'}`;
                return (
                  <li key={a.key}>
                    {a.to ? <Link to={a.to} className={cls}>{inner}</Link>
                      : a.href ? <a href={a.href} download={a.download} className={cls}>{inner}</a>
                      : <button type="button" onClick={a.onClick} disabled={a.busy} className={cls}>{inner}</button>}
                  </li>
                );
              })}
            </motion.ul>
          )}

          {status !== 'cancelled' && <WalletStrip booking={b} />}

          {/* Trip */}
          <motion.section {...rise(3)} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Your trip</h2>
              {days && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{days} day{days === 1 ? '' : 's'}</span>}
            </div>
            <ol className="relative mt-5 space-y-6 pl-8">
              <span aria-hidden="true" className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-gradient-to-b from-emerald-400 via-slate-200 to-rose-400" />
              {[
                { label: 'Pick-up', dot: 'bg-emerald-500 ring-emerald-100', date: start, time: b.startTime, place: b.pickupLocationName || b.pickupCode },
                { label: 'Drop-off', dot: 'bg-rose-500 ring-rose-100', date: end, time: b.endTime, place: b.dropoffLocationName || b.dropoffCode || b.pickupLocationName || b.pickupCode },
              ].map(s => (
                <li key={s.label} className="relative">
                  <span className={`absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ${s.dot}`}><span className="h-2 w-2 rounded-full bg-white" /></span>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">{fmtLong(s.date)}{s.time ? <span className="font-normal text-slate-500"> · {String(s.time).slice(0, 5)}</span> : null}</p>
                  {s.place && <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {s.place}</p>}
                </li>
              ))}
            </ol>
          </motion.section>

          {/* Car + supplier */}
          <motion.section {...rise(4)} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Car & rental company</h2>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900">{carName} <span className="text-sm font-normal text-slate-500">or similar</span></p>
                <p className="text-sm text-slate-500">{String(car.category).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[String(car.transmission).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()), String(car.fuelPolicy).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()), car.airCon ? 'Air conditioning' : null, b.carUnlimitedMileage !== false ? 'Unlimited mileage' : null]
                    .filter(Boolean).map((t: any) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{t}</span>)}
                  {(!b.bookingMode || b.bookingMode === 'FREE_SALE') && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><Zap className="h-3 w-3" /> Instant confirmation</span>}
                </div>
              </div>
            </div>
            {(b.supplierName || b.supplierLogoUrl) && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-slate-200">
                  {b.supplierLogoUrl && b.supplierLogoUrl !== 'HOGICAR_CHOICE_LOGO' ? <img src={b.supplierLogoUrl} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs font-bold text-slate-500">{String(b.supplierName || 'S').slice(0, 2).toUpperCase()}</span>}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{b.supplierName || 'Rental company'}</p>
                  <p className="text-xs text-slate-500">{b.supplierConfirmationNumber ? <>Supplier ref <span className="font-mono font-semibold text-slate-700">{b.supplierConfirmationNumber}</span></> : 'Your car is supplied by this company'}</p>
                </div>
              </div>
            )}
          </motion.section>

          {/* Driver + extras */}
          <motion.section {...rise(5)} className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">Main driver</h2>
                {active && <button onClick={() => setChangeTab('contact')} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-accent-50"><Edit2 className="h-3.5 w-3.5" /> Edit</button>}
              </div>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5 text-slate-800"><User className="h-4 w-4 text-slate-400" /> {[b.firstName, b.lastName].filter(Boolean).join(' ') || b.customerName || '—'}</li>
                {(b.email || b.customerEmail) && <li className="flex items-center gap-2.5 break-all text-slate-800"><Mail className="h-4 w-4 shrink-0 text-slate-400" /> {b.email || b.customerEmail}</li>}
                {(b.phone || b.customerPhone) && <li className="flex items-center gap-2.5 text-slate-800"><Phone className="h-4 w-4 text-slate-400" /> {b.phone || b.customerPhone}</li>}
                {b.flightNumber && <li className="flex items-center gap-2.5 text-slate-800"><Plane className="h-4 w-4 text-slate-400" /> Flight {b.flightNumber}</li>}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Add-ons</h2>
              {extras.length ? (
                <ul className="mt-3 space-y-2">
                  {extras.map((x: string) => <li key={x} className="flex items-start gap-2.5 text-sm text-slate-800"><Package className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {x}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-slate-500">No add-ons reserved. You can ask for extras at the rental desk.</p>}
              {b.promotionSummary && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 ring-1 ring-rose-100"><Percent className="mt-0.5 h-4 w-4 shrink-0" /> {b.promotionSummary}</p>
              )}
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <motion.section {...rise(3)} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-slate-900">Payment</h2>
            <dl className="mt-2 divide-y divide-slate-100">
              <Row label="Total price" value={price(b.finalPrice ?? b.totalPrice)} strong />
              {b.payNow != null && <Row label="Paid online" value={<span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> {price(b.payNow)}</span>} />}
              {b.payAtDesk != null && <Row label="Pay at pick-up" value={price(b.payAtDesk)} />}
              {Number(b.carDeposit) > 0 && <Row label="Security deposit" value={<span>{price(b.carDeposit)}<span className="block text-[11px] font-normal text-slate-500">Held on your card, then released</span></span>} />}
            </dl>
            {active && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Free cancellation up to 48 hours before pick-up.
              </div>
            )}
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              Bring a credit card in the main driver’s name, your driving licence and passport or ID.
            </div>
          </motion.section>

          <motion.section {...rise(4)} className="relative overflow-hidden rounded-3xl bg-[#00244f] p-5 text-white shadow-sm sm:p-6">
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#007ac2]/50 blur-2xl" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><MessageCircle className="h-5 w-5" /></span>
            <h2 className="relative mt-3 text-base font-semibold">Need help with this booking?</h2>
            <p className="relative mt-1 text-sm text-white/70">Our support team can help with changes, payments and pick-up questions.</p>
            <Link to="/contact" className="relative mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#00244f] hover:bg-slate-100">Contact support <ChevronRight className="h-4 w-4" /></Link>
          </motion.section>
        </aside>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} role="status"
            className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------- Page ----------

const MyBookings: React.FC = () => {
  const [view, setView] = React.useState<'login' | 'booking' | 'account'>('login');
  const [loginError, setLoginError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [userBookings, setUserBookings] = React.useState<Booking[]>([]);
  const [lookupEmail, setLookupEmail] = React.useState('');
  const [account, setAccount] = React.useState<any>(null);
  const [celebrate, setCelebrate] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(() => !!rewardsSession.get());
  const [loginPrefill, setLoginPrefill] = React.useState<{ email: string; mode: 'reference' | 'password' } | null>(null);

  const top = () => { try { window.scrollTo({ top: 0 }); } catch { /* ignore */ } };

  const openBooking = async (email: string, ref: string, fromAccount = false) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const booking = await api.lookupBooking(email.toLowerCase().trim(), ref.toUpperCase().trim());
      setUserBookings([booking]);
      setLookupEmail(email.toLowerCase().trim());
      setView('booking');
      top();
    } catch (err: any) {
      console.error(err);
      setLoginError(fromAccount ? 'We couldn’t open that booking. Please try again.' : 'We couldn’t find a booking with that email and reference. Please check both and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (email: string, ref: string) => openBooking(email, ref);

  const enterAccount = (dashboard: any, fresh = false) => {
    setAccount(dashboard);
    setCelebrate(fresh);
    setView('account');
    top();
  };

  const authError = (err: any, fallback: string) => err?.response?.data?.message || fallback;

  const handlePasswordLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await rewards.login(email.trim(), password);
      rewardsSession.set(res.token);
      enterAccount(res.dashboard);
    } catch (err: any) {
      setLoginError(authError(err, 'We couldn’t sign you in. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (email: string, ref: string, password: string) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await rewards.resetPassword(email.trim(), ref.trim(), password);
      rewardsSession.set(res.token);
      enterAccount(res.dashboard);
    } catch (err: any) {
      setLoginError(authError(err, 'We couldn’t reset your password. Please check your details.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Signed in on this device before: go straight to the account.
  React.useEffect(() => {
    if (!rewardsSession.get()) return;
    if (window.location.hash && !window.location.hash.startsWith('#/')) { setCheckingSession(false); return; }
    let alive = true;
    rewards.me().then(d => { if (alive) enterAccount(d); })
      .catch(() => rewardsSession.clear())
      .finally(() => { if (alive) setCheckingSession(false); });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Links in our emails carry the booking in the fragment (#ref=…&email=…&action=…), which never reaches a server.
  const [initialAction, setInitialAction] = React.useState<string | null>(null);
  React.useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash || hash.startsWith('/')) return;
    const p = new URLSearchParams(hash);
    const ref = p.get('ref'), mail = p.get('email');
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* ignore */ }
    if (ref && mail) {
      setInitialAction(p.get('action'));
      handleLogin(mail, ref);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBookingModified = (updatedBooking: Booking) => {
    setUserBookings(prev => prev.map(b => (b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b)));
  };

  const signOut = () => {
    rewardsSession.clear();
    setAccount(null);
    setUserBookings([]);
    setLoginPrefill(null);
    setView('login');
    top();
  };

  const backFromBooking = () => {
    if (account) {
      rewards.me().then(d => setAccount(d)).catch(() => { /* keep last copy */ });
      setView('account');
    } else {
      setView('login');
      setUserBookings([]);
    }
    top();
  };

  const showLogin = view === 'login' || (view === 'booking' && !userBookings.length) || (view === 'account' && !account);

  return (
    <>
      <SEOMetadata title="Manage My Booking | Hogicar" description="View, modify, or cancel your car rental reservation securely." noIndex={true} />
      <div className="min-h-screen bg-slate-50">
        {checkingSession ? (
          <div className="flex min-h-[60vh] items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-accent" aria-label="Loading" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {showLogin ? (
              <motion.div key={`lookup-${loginPrefill?.mode || 'reference'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <LookupScreen onLogin={handleLogin} onPasswordLogin={handlePasswordLogin} onReset={handleReset} error={loginError} isLoading={isLoading}
                  initialEmail={loginPrefill?.email} initialMode={loginPrefill?.mode} />
              </motion.div>
            ) : view === 'account' ? (
              <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {loginError && <p role="alert" className="mx-auto mt-4 max-w-5xl rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{loginError}</p>}
                <RewardsDashboard data={account} celebrate={celebrate} onChange={setAccount} onSignOut={signOut}
                  onOpenBooking={ref => openBooking(account?.account?.email || '', ref, true)} />
              </motion.div>
            ) : (
              <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <BookingDetailView booking={userBookings[0]} email={lookupEmail} onBookingModified={handleBookingModified} onBack={backFromBooking}
                  initialAction={initialAction} signedIn={!!account}
                  onAccountCreated={d => enterAccount(d, true)}
                  onSignInRequest={() => { setLoginPrefill({ email: lookupEmail, mode: 'password' }); setUserBookings([]); setView('login'); top(); }} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default MyBookings;
