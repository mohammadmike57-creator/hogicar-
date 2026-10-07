import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Check from 'lucide-react/dist/esm/icons/check';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Search from 'lucide-react/dist/esm/icons/search';
import { manageBooking } from '../../api';
import { fmtDay } from '../../utils/changeRequest';

const ease = [0.22, 1, 0.36, 1] as const;
const REASONS = ['My plans changed', 'My flight changed', 'I found a better price', 'I booked by mistake', 'I no longer need a car', 'Other'];

interface Props {
  booking: any;
  email: string;
  carName: string;
  money: (n?: number) => string;
  onClose: () => void;
  onCancelled: (booking: any) => void;
  /** Opens the change flow instead (offered as an alternative). */
  onChangeInstead?: () => void;
}

const CancelBookingSheet: React.FC<Props> = ({ booking: b, email, carName, money, onClose, onCancelled, onChangeInstead }) => {
  const reduce = !!useReducedMotion();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [reason, setReason] = React.useState<string | null>(null);
  const [other, setOther] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, busy]);

  const start = b.pickupDate ? new Date(`${b.pickupDate}T${String(b.startTime || '10:00').slice(0, 5)}:00`) : null;
  const hoursLeft = start && !isNaN(start.getTime()) ? (start.getTime() - Date.now()) / 3600000 : null;
  const late = hoursLeft !== null && hoursLeft < 48;
  const paidOnline = Number(b.payNow) || 0;
  const finalReason = reason === 'Other' ? (other.trim() || 'Other') : reason || '';

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const updated = await manageBooking.cancel(email, String(b.bookingRef || b.id), finalReason);
      onCancelled(updated);
      setStep(3);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'We couldn’t cancel your booking. Please try again or contact support.');
    } finally { setBusy(false); }
  };

  const slide = { initial: { opacity: 0, x: reduce ? 0 : 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: reduce ? 0 : -24 }, transition: { duration: 0.28, ease } };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && step !== 3 && onClose()} className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <motion.div
        initial={{ y: reduce ? 0 : 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 330 }}
        className="relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-3xl"
      >
        <span className="mx-auto mt-2.5 block h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-3 sm:px-7 sm:pt-6">
          {step === 2 ? (
            <button onClick={() => setStep(1)} disabled={busy} className="inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /> Back</button>
          ) : <span />}
          {step < 3 && (
            <div className="flex items-center gap-1.5" aria-label={`Step ${step} of 2`}>
              {[1, 2].map(n => <span key={n} className={`h-1.5 rounded-full transition-all ${n === step ? 'w-6 bg-rose-500' : n < step ? 'w-3 bg-rose-300' : 'w-3 bg-slate-200'}`} />)}
            </div>
          )}
          <button onClick={onClose} disabled={busy} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-7">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" {...slide}>
                <h2 id="cancel-title" className="text-xl font-bold tracking-tight text-slate-900">Why are you cancelling?</h2>
                <p className="mt-1 text-sm text-slate-500">This helps us and the rental company improve. It won’t affect your refund.</p>
                <div className="mt-5 grid gap-2" role="radiogroup">
                  {REASONS.map(r => {
                    const on = reason === r;
                    return (
                      <button key={r} type="button" role="radio" aria-checked={on} onClick={() => setReason(r)}
                        className={`flex h-12 items-center justify-between rounded-xl border px-4 text-left text-sm font-medium transition-all ${on ? 'border-rose-400 bg-rose-50 text-rose-900 ring-1 ring-rose-400' : 'border-slate-200 text-slate-800 hover:border-slate-300'}`}>
                        {r}
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${on ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>{on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {reason === 'Other' && (
                    <motion.textarea initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      value={other} onChange={e => setOther(e.target.value.slice(0, 280))} rows={2} placeholder="Tell us a little more (optional)"
                      className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-[15px]" />
                  )}
                </AnimatePresence>
                {onChangeInstead && (reason === 'My plans changed' || reason === 'My flight changed') && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl bg-accent-50 p-4 ring-1 ring-accent-100">
                    <p className="text-sm font-semibold text-slate-900">Keep your car and change the dates instead?</p>
                    <p className="mt-0.5 text-sm text-slate-600">You can request new dates or update your flight in a minute.</p>
                    <button type="button" onClick={onChangeInstead} className="mt-3 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-accent ring-1 ring-accent/30 hover:bg-accent-50">Change my booking</button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" {...slide}>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Review and confirm</h2>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-900">{carName}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{fmtDay(b.pickupDate, b.startTime)} → {fmtDay(b.dropoffDate, b.endTime)}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">Booking {b.bookingRef || b.id}</p>
                </div>

                {late ? (
                  <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Pick-up is less than 48 hours away. Under the rental terms a cancellation fee may apply.
                  </p>
                ) : (
                  <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> You’re cancelling more than 48 hours before pick-up, so it’s free.
                  </p>
                )}

                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><CreditCard className="h-4 w-4" /></span>
                    <span className="text-slate-700">{paidOnline > 0 ? <>You paid <span className="font-semibold text-slate-900">{money(paidOnline)}</span> online. Our team refunds it to your original payment method under the cancellation policy.</> : 'Nothing was charged online, so there’s nothing to refund.'}</span></li>
                  <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Check className="h-4 w-4" /></span>
                    <span className="text-slate-700">You won’t pay anything at the rental desk.</span></li>
                  <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Mail className="h-4 w-4" /></span>
                    <span className="text-slate-700">We’ll email a cancellation confirmation and tell the rental company.</span></li>
                </ul>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5">
                  <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
                  <span className="text-sm text-slate-700">I understand this cancels my booking and can’t be undone.</span>
                </label>

                <AnimatePresence>
                  {error && (
                    <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }} className="py-6 text-center">
                <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 220, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg">
                  <Check className="h-8 w-8" />
                </motion.span>
                <h2 className="mt-5 text-xl font-bold text-slate-900">Your booking is cancelled</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                  We’ve sent a confirmation to <span className="font-medium text-slate-800">{email}</span>{paidOnline > 0 ? ' and our team will process your refund.' : '.'}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-400">Booking {b.bookingRef || b.id}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-7">
          {step === 1 && (
            <div className="flex gap-2">
              <button onClick={onClose} className="h-12 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50">Keep my booking</button>
              <button onClick={() => setStep(2)} disabled={!reason} className="h-12 flex-1 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="flex gap-2">
              <button onClick={onClose} disabled={busy} className="h-12 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50">Keep booking</button>
              <button onClick={submit} disabled={!agree || busy} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Cancelling…</> : 'Cancel booking'}
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="flex gap-2">
              <button onClick={onClose} className="h-12 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50">Close</button>
              <Link to="/" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-700"><Search className="h-4 w-4" /> Find a new car</Link>
            </div>
          )}
        </footer>
      </motion.div>
    </div>
  );
};

export default CancelBookingSheet;
