import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Check from 'lucide-react/dist/esm/icons/check';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Gift from 'lucide-react/dist/esm/icons/gift';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import { rewards, rewardsSession } from '../../api';

export const passwordChecks = (pw: string, email = '') => [
  { ok: pw.length >= 8, label: 'At least 8 characters' },
  { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: 'A letter and a number' },
  { ok: pw.length > 0 && pw.toLowerCase() !== email.toLowerCase(), label: 'Not your email address' },
];

export const PasswordField = ({ id, label, value, onChange, autoComplete, invalid }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean;
}) => {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={e => onChange(e.target.value)}
          aria-invalid={invalid}
          className={`h-12 w-full rounded-xl border bg-white pl-3.5 pr-12 text-base text-slate-900 outline-none transition-all focus:ring-4 ${invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-300 hover:border-slate-400 focus:border-accent focus:ring-accent/15'}`} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );
};

/** Joins HogiCar Rewards from Manage booking: the email comes from the booking, so only a password is needed. */
const CreateAccountSheet = ({ email, bookingRef, bookingPoints, welcomeBonus, onClose, onCreated }: {
  email: string; bookingRef: string; bookingPoints: number; welcomeBonus: number;
  onClose: () => void; onCreated: (dashboard: any) => void;
}) => {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const checks = passwordChecks(password, email);
  const valid = checks.every(c => c.ok);
  const match = password === confirm;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [busy, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || !match) return;
    setBusy(true);
    setError('');
    try {
      const res = await rewards.create(email, bookingRef, password);
      rewardsSession.set(res.token);
      try { (window as any).dataLayer?.push({ event: 'rewards_sign_up' }); } catch { /* ignore */ }
      onCreated(res.dashboard);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We couldn’t create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="rewards-create-title">
      <motion.div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()} />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#00244f] via-[#003a7a] to-[#007ac2] px-6 pb-6 pt-6 text-white">
          <div aria-hidden="true" className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-400/25 blur-2xl" />
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"><X className="h-5 w-5" /></button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/15"><Gift className="h-3.5 w-3.5 text-amber-300" /> HogiCar Rewards</span>
          <h2 id="rewards-create-title" className="mt-3 text-2xl font-bold tracking-tight">Create your account</h2>
          <p className="mt-1 text-sm text-white/75">Just choose a password. We already have your details from this booking.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">This trip</p>
              <p className="mt-0.5 text-lg font-bold">+{bookingPoints.toLocaleString()} pts</p>
            </div>
            <div className="rounded-2xl bg-amber-400/15 p-3 ring-1 ring-amber-300/30">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200">Welcome bonus</p>
              <p className="mt-0.5 text-lg font-bold">+{welcomeBonus.toLocaleString()} pts</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4 p-6">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Email</p>
            <div className="flex h-12 items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 text-slate-700 ring-1 ring-slate-200">
              <Mail className="h-[18px] w-[18px] text-slate-400" /> <span className="truncate">{email}</span>
            </div>
          </div>
          <PasswordField id="rw-pass" label="Create a password" value={password} onChange={setPassword} autoComplete="new-password" invalid={touched && !valid} />
          <ul className="grid gap-1.5" aria-live="polite">
            {checks.map(c => (
              <li key={c.label} className={`flex items-center gap-2 text-xs ${c.ok ? 'text-emerald-700' : 'text-slate-500'}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${c.ok ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>{c.ok && <Check className="h-3 w-3" />}</span>{c.label}
              </li>
            ))}
          </ul>
          <PasswordField id="rw-pass2" label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" invalid={touched && !match} />
          {touched && !match && <p className="-mt-2 text-xs font-medium text-rose-600">The passwords don’t match.</p>}
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>}
          <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-700 disabled:opacity-70">
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Create account & collect points
          </button>
          <p className="text-center text-xs leading-relaxed text-slate-500">Next time, open Manage booking with your email and this password. Points from your other bookings with this email are added too.</p>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
};

export default CreateAccountSheet;
