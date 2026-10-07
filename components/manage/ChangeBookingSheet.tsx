import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Check from 'lucide-react/dist/esm/icons/check';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Info from 'lucide-react/dist/esm/icons/info';
import Send from 'lucide-react/dist/esm/icons/send';
import { manageBooking } from '../../api';
import { fmtDay } from '../../utils/changeRequest';

const ease = [0.22, 1, 0.36, 1] as const;
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const todayIso = () => new Date().toISOString().slice(0, 10);
const nights = (a?: string, b?: string) => {
  if (!a || !b) return null;
  const x = new Date(`${a}T00:00:00`).getTime(), y = new Date(`${b}T00:00:00`).getTime();
  return isNaN(x) || isNaN(y) ? null : Math.round((y - x) / 86400000);
};
const errMsg = (e: any) => e?.response?.data?.message || (e?.message && /network/i.test(e.message) ? 'We could not reach Hogicar. Check your connection and try again.' : 'Something went wrong. Please try again.');

const field = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition-all hover:border-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-[15px]';

interface Props {
  booking: any;
  email: string;
  initialTab?: 'dates' | 'contact';
  /** Disable the dates tab (e.g. a request is already waiting). */
  datesLocked?: string | null;
  onClose: () => void;
  onUpdated: (booking: any, message: string) => void;
}

const ChangeBookingSheet: React.FC<Props> = ({ booking: b, email, initialTab = 'dates', datesLocked, onClose, onUpdated }) => {
  const reduce = !!useReducedMotion();
  const ref = String(b.bookingRef || b.id);
  const [tab, setTab] = React.useState<'dates' | 'contact'>(datesLocked ? 'contact' : initialTab);
  const [pickupDate, setPickupDate] = React.useState<string>(b.pickupDate || '');
  const [startTime, setStartTime] = React.useState<string>(String(b.startTime || '10:00').slice(0, 5));
  const [dropoffDate, setDropoffDate] = React.useState<string>(b.dropoffDate || '');
  const [endTime, setEndTime] = React.useState<string>(String(b.endTime || '10:00').slice(0, 5));
  const [note, setNote] = React.useState('');
  const [phone, setPhone] = React.useState<string>(b.phone || '');
  const [flight, setFlight] = React.useState<string>(b.flightNumber || '');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<null | 'dates' | 'contact'>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, busy]);

  const oldLen = nights(b.pickupDate, b.dropoffDate);
  const newLen = nights(pickupDate, dropoffDate);
  const datesChanged = pickupDate !== b.pickupDate || dropoffDate !== b.dropoffDate || startTime !== String(b.startTime || '10:00').slice(0, 5) || endTime !== String(b.endTime || '10:00').slice(0, 5);
  const dateProblem = !pickupDate || !dropoffDate ? 'Choose both dates.'
    : pickupDate < todayIso() ? 'Pick-up can’t be in the past.'
    : dropoffDate < pickupDate || (dropoffDate === pickupDate && endTime <= startTime) ? 'Drop-off must be after pick-up.'
    : newLen !== null && newLen > 90 ? 'Rentals can be at most 90 days.'
    : null;
  const contactChanged = phone.trim() !== String(b.phone || '').trim() || flight.trim().toUpperCase() !== String(b.flightNumber || '').trim().toUpperCase();

  const submitDates = async () => {
    if (dateProblem || !datesChanged) return;
    setBusy(true); setError(null);
    try {
      const updated = await manageBooking.requestChange(email, ref, { pickupDate, startTime, dropoffDate, endTime, note: note.trim() || undefined });
      onUpdated(updated, 'Change request sent');
      setDone('dates');
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const submitContact = async () => {
    if (!contactChanged) return;
    setBusy(true); setError(null);
    try {
      const updated = await manageBooking.updateContact(email, ref, phone.trim(), flight.trim());
      onUpdated(updated, 'Your details were saved');
      setDone('contact');
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="change-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()} className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <motion.div
        initial={{ y: reduce ? 0 : 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 330 }}
        className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-3xl"
      >
        <span className="mx-auto mt-2.5 block h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-7 sm:pt-6">
          <div>
            <h2 id="change-title" className="text-xl font-bold tracking-tight text-slate-900">Change your booking</h2>
            <p className="mt-0.5 text-sm text-slate-500">Booking <span className="font-mono font-semibold text-slate-700">{ref}</span></p>
          </div>
          <button onClick={onClose} disabled={busy} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        {!done && (
          <div className="px-5 sm:px-7">
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist">
              {([['dates', 'Dates & times', Calendar], ['contact', 'Contact & flight', Phone]] as const).map(([id, label, Icon]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setError(null); }}
                  className={`relative flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab === id && <motion.span layoutId="change-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
                  <span className="relative inline-flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5 sm:px-7">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }} className="py-6 text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 220, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                  {done === 'dates' ? <Send className="h-7 w-7" /> : <Check className="h-8 w-8" />}
                </motion.span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{done === 'dates' ? 'Change request sent' : 'Details saved'}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                  {done === 'dates'
                    ? 'The rental company will review your new dates. Your booking stays as it is until they approve it, and we’ll email you as soon as they reply.'
                    : 'Your new contact details are saved and shared with the rental company.'}
                </p>
                {done === 'dates' && (
                  <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2 text-left">
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">New pick-up</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{fmtDay(pickupDate, startTime)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">New drop-off</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{fmtDay(dropoffDate, endTime)}</p></div>
                  </div>
                )}
              </motion.div>
            ) : tab === 'dates' ? (
              <motion.div key="dates" initial={{ opacity: 0, x: reduce ? 0 : -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : 12 }} transition={{ duration: 0.25 }} className="space-y-5">
                {datesLocked && (
                  <p className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200"><Info className="mt-0.5 h-4 w-4 shrink-0" /> {datesLocked}</p>
                )}
                <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Currently booked</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{fmtDay(b.pickupDate, b.startTime)} <ArrowRight className="mx-1 inline h-3.5 w-3.5 text-slate-400" /> {fmtDay(b.dropoffDate, b.endTime)}{oldLen ? <span className="text-slate-500"> · {oldLen} day{oldLen === 1 ? '' : 's'}</span> : null}</p>
                </div>

                {[
                  { label: 'New pick-up', date: pickupDate, setDate: setPickupDate, time: startTime, setTime: setStartTime, min: todayIso(), dot: 'bg-emerald-500' },
                  { label: 'New drop-off', date: dropoffDate, setDate: setDropoffDate, time: endTime, setTime: setEndTime, min: pickupDate || todayIso(), dot: 'bg-rose-500' },
                ].map(s => (
                  <fieldset key={s.label} disabled={!!datesLocked}>
                    <legend className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}</legend>
                    <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                      <input type="date" value={s.date} min={s.min} onChange={e => s.setDate(e.target.value)} className={field} aria-label={`${s.label} date`} />
                      <select value={s.time} onChange={e => s.setTime(e.target.value)} className={field} aria-label={`${s.label} time`}>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </fieldset>
                ))}

                <AnimatePresence initial={false}>
                  {datesChanged && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      {dateProblem ? (
                        <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"><AlertCircle className="h-4 w-4 shrink-0" /> {dateProblem}</p>
                      ) : (
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-50 px-3.5 py-3 ring-1 ring-accent-100">
                          <p className="text-sm text-slate-700">New rental length <span className="font-semibold text-slate-900">{newLen} day{newLen === 1 ? '' : 's'}</span></p>
                          {oldLen !== null && newLen !== null && newLen !== oldLen && (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${newLen > oldLen ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{newLen > oldLen ? '+' : '−'}{Math.abs(newLen - oldLen)} day{Math.abs(newLen - oldLen) === 1 ? '' : 's'}</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Message for the rental company <span className="font-normal text-slate-400">(optional)</span></span>
                  <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 300))} rows={2} disabled={!!datesLocked} placeholder="e.g. My flight now lands at 09:15"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-[15px]" />
                </label>

                <ol className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200 sm:grid-cols-3">
                  {['We send your request to the rental company', 'They review the new dates, usually within a day', 'You get an email. Any price difference is paid at the desk'].map((t, i) => (
                    <li key={t} className="flex items-start gap-2.5 text-slate-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-accent ring-1 ring-slate-200">{i + 1}</span>{t}
                    </li>
                  ))}
                </ol>
              </motion.div>
            ) : (
              <motion.div key="contact" initial={{ opacity: 0, x: reduce ? 0 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -12 }} transition={{ duration: 0.25 }} className="space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Mobile number</span>
                  <span className="group relative block">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-accent" />
                    <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+962 7X XXX XXXX" className={`${field} pl-11`} />
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">The rental company may call this number on the day.</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Flight number <span className="font-normal text-slate-400">(optional)</span></span>
                  <span className="group relative block">
                    <Plane className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-accent" />
                    <input type="text" autoCapitalize="characters" value={flight} onChange={e => setFlight(e.target.value.toUpperCase().slice(0, 12))} placeholder="e.g. RJ 182" className={`${field} pl-11 font-mono uppercase tracking-wide placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`} />
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">If your flight is delayed, the rental company can wait for you.</span>
                </label>
                <p className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Contact changes are saved straight away. No approval needed.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-7">
          {done ? (
            <button onClick={onClose} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800">Done</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={onClose} disabled={busy} className="h-12 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none sm:px-6">Cancel</button>
              {tab === 'dates' ? (
                <button onClick={submitDates} disabled={busy || !!datesLocked || !datesChanged || !!dateProblem}
                  className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:ml-auto sm:flex-none sm:px-6">
                  {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending…</> : <><Send className="h-4 w-4" /> Send change request</>}
                </button>
              ) : (
                <button onClick={submitContact} disabled={busy || !contactChanged}
                  className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:ml-auto sm:flex-none sm:px-6">
                  {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</> : <><Check className="h-4 w-4" /> Save details</>}
                </button>
              )}
            </div>
          )}
        </footer>
      </motion.div>
    </div>
  );
};

export default ChangeBookingSheet;
