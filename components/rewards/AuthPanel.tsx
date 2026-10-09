import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Mail from 'lucide-react/dist/esm/icons/mail';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Check from 'lucide-react/dist/esm/icons/check';
import { rewards, rewardsSession } from '../../api';
import { getGoogleAccessToken, preloadGoogle } from '../../utils/googleAuth';
import { PasswordField, passwordChecks } from './CreateAccountSheet';

export type AuthResult = { token: string; dashboard: any; created?: boolean };

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** The site's Google client ID, loaded once. Null means Google sign-in is switched off. */
let configPromise: Promise<{ googleClientId: string | null; welcomeBonus: number }> | null = null;
export const useRewardsConfig = () => {
  const [cfg, setCfg] = React.useState<{ googleClientId: string | null; welcomeBonus: number } | null>(null);
  React.useEffect(() => {
    if (!configPromise) configPromise = rewards.config().catch(() => { configPromise = null; return { googleClientId: null, welcomeBonus: 0 }; });
    let alive = true;
    configPromise.then(c => { if (alive) setCfg(c); });
    return () => { alive = false; };
  }, []);
  return cfg;
};

/** "Continue with Google". Hidden when Google sign-in isn't configured. */
export const GoogleButton = ({ label = 'Continue with Google', onResult, onError, disabled }: {
  label?: string; onResult: (r: AuthResult) => void; onError: (msg: string) => void; disabled?: boolean;
}) => {
  const cfg = useRewardsConfig();
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (cfg?.googleClientId) preloadGoogle(); }, [cfg?.googleClientId]);
  if (!cfg?.googleClientId) return null;
  const go = async () => {
    setBusy(true);
    onError('');
    try {
      const token = await getGoogleAccessToken(cfg.googleClientId!);
      const res = await rewards.google(token);
      rewardsSession.set(res.token);
      try { (window as any).dataLayer?.push({ event: res.created ? 'rewards_sign_up' : 'rewards_login', method: 'google' }); } catch { /* ignore */ }
      onResult(res);
    } catch (e: any) {
      onError(e?.response?.data?.message || e?.message || 'Google sign-in didn’t complete. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={go} disabled={busy || disabled}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-[15px] font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:opacity-60">
      {busy ? <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" /> : <GoogleG />} {label}
    </button>
  );
};

export const OrDivider = ({ text = 'or' }: { text?: string }) => (
  <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
    <span className="h-px flex-1 bg-slate-200" /> {text} <span className="h-px flex-1 bg-slate-200" />
  </div>
);

/** Six boxes for a 6-digit code, with paste and arrow-key support. */
export const CodeInput = ({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) => {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const set = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, 6));
  };
  return (
    <div className="flex justify-between gap-2" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1}
          aria-label={`Digit ${i + 1}`} aria-invalid={invalid}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '');
            if (v.length > 1) { onChange(v.slice(0, 6)); refs.current[Math.min(5, v.length - 1)]?.focus(); return; }
            set(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) { refs.current[i - 1]?.focus(); set(i - 1, ''); e.preventDefault(); }
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={e => {
            const v = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (v) { e.preventDefault(); onChange(v); refs.current[Math.min(5, v.length)]?.focus(); }
          }}
          className={`h-14 w-full min-w-0 rounded-xl border bg-white text-center font-mono text-2xl font-bold text-slate-900 outline-none transition focus:ring-4 ${invalid ? 'border-rose-400 focus:ring-rose-500/15' : 'border-slate-300 focus:border-accent focus:ring-accent/15'}`} />
      ))}
    </div>
  );
};

type View = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

const inputCls = (bad?: boolean) =>
  `h-12 w-full rounded-xl border bg-white pl-11 pr-3.5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${bad ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-300 hover:border-slate-400 focus:border-accent focus:ring-accent/15'}`;

/**
 * Sign in or join HogiCar Rewards: Continue with Google, email and password, or a new account with
 * email (confirmed with a 6-digit code). Also handles "Forgot password?" by email code.
 */
const AuthPanel = ({ onAuthenticated, initialEmail = '', initialView = 'signin' }: {
  onAuthenticated: (r: AuthResult) => void; initialEmail?: string; initialView?: 'signin' | 'signup';
}) => {
  const cfg = useRewardsConfig();
  const [view, setView] = React.useState<View>(initialView);
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState('');
  const [first, setFirst] = React.useState('');
  const [last, setLast] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const go = (v: View) => { setView(v); setError(''); setInfo(''); setTouched(false); setCode(''); if (v === 'signin' || v === 'signup') setPassword(''); };
  const emailOk = /^\S+@\S+\.\S{2,}$/.test(email.trim());
  const checks = passwordChecks(password, email);
  const strong = checks.every(c => c.ok);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (e: any) { setError(e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };

  const finish = (res: AuthResult, method: string, created = false) => {
    rewardsSession.set(res.token);
    try { (window as any).dataLayer?.push({ event: created ? 'rewards_sign_up' : 'rewards_login', method }); } catch { /* ignore */ }
    onAuthenticated({ ...res, created });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (view === 'signin') {
      if (!emailOk || !password) return;
      run(async () => finish(await rewards.login(email.trim(), password), 'password'));
    } else if (view === 'signup') {
      if (!first.trim() || !last.trim() || !emailOk || !strong) return;
      run(async () => {
        await rewards.signup({ email: email.trim(), firstName: first.trim(), lastName: last.trim(), password });
        setView('verify'); setTouched(false); setCode(''); setResendIn(45);
      });
    } else if (view === 'verify') {
      if (code.length !== 6) return;
      run(async () => finish(await rewards.verifySignup(email.trim(), code), 'email', true));
    } else if (view === 'forgot') {
      if (!emailOk) return;
      run(async () => { await rewards.forgotPassword(email.trim()); setView('reset'); setTouched(false); setPassword(''); setResendIn(45); });
    } else if (view === 'reset') {
      if (code.length !== 6 || !strong) return;
      run(async () => finish(await rewards.resetWithCode(email.trim(), code, password), 'reset'));
    }
  };

  const resend = () => run(async () => {
    if (view === 'verify') await rewards.signup({ email: email.trim(), firstName: first.trim(), lastName: last.trim(), password });
    else await rewards.forgotPassword(email.trim());
    setCode(''); setResendIn(45); setInfo('We sent a new code.');
  });

  const titles: Record<View, [string, string]> = {
    signin: ['Sign in to your account', 'See all your trips and points in one place.'],
    signup: ['Create your HogiCar account', cfg?.welcomeBonus ? `Join free and get ${cfg.welcomeBonus.toLocaleString()} welcome points.` : 'Join free and start collecting points.'],
    verify: ['Check your email', `Enter the 6-digit code we sent to ${email.trim()}.`],
    forgot: ['Reset your password', 'We’ll email you a 6-digit code.'],
    reset: ['Choose a new password', `Enter the code we sent to ${email.trim()} and your new password.`],
  };

  const primary: Record<View, string> = { signin: 'Sign in', signup: 'Continue', verify: 'Verify & create account', forgot: 'Send code', reset: 'Save password & sign in' };

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-5">
        {(view === 'verify' || view === 'forgot' || view === 'reset') && (
          <button type="button" onClick={() => go(view === 'verify' ? 'signup' : 'signin')} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Back</button>
        )}
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{titles[view][0]}</h2>
        <p className="mt-1 text-sm text-slate-600">{titles[view][1]}</p>
      </div>

      {(view === 'signin' || view === 'signup') && cfg?.googleClientId && (
        <div className="mb-5 space-y-5">
          <GoogleButton label={view === 'signup' ? 'Sign up with Google' : 'Continue with Google'} onResult={r => onAuthenticated(r)} onError={setError} disabled={busy} />
          <OrDivider text={view === 'signup' ? 'or sign up with email' : 'or sign in with email'} />
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-start gap-2 overflow-hidden rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</motion.p>
        )}
        {info && !error && (
          <motion.p role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200"><CheckCircle className="h-4 w-4" /> {info}</motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={submit} noValidate className="space-y-4">
        {view === 'signup' && (
          <div className="grid grid-cols-2 gap-3">
            {([['su-first', 'First name', first, setFirst, 'given-name'], ['su-last', 'Last name', last, setLast, 'family-name']] as const).map(([id, label, v, set, ac]) => (
              <div key={id}>
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input id={id} value={v} onChange={e => set(e.target.value)} autoComplete={ac} className={inputCls(touched && !v.trim())} />
                </div>
              </div>
            ))}
          </div>
        )}

        {(view === 'signin' || view === 'signup' || view === 'forgot') && (
          <div>
            <label htmlFor="au-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input id="au-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={view === 'signup' ? 'Use the email you book with' : 'you@example.com'} className={inputCls(touched && !emailOk)} />
            </div>
            {touched && !emailOk && <p className="mt-1.5 text-xs font-medium text-rose-600">Enter a valid email address.</p>}
          </div>
        )}

        {(view === 'verify' || view === 'reset') && (
          <div>
            <CodeInput value={code} onChange={setCode} invalid={touched && code.length !== 6} />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Can’t find it? Check your spam folder.</span>
              <button type="button" onClick={resend} disabled={resendIn > 0 || busy} className="font-semibold text-accent disabled:text-slate-400">{resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}</button>
            </div>
          </div>
        )}

        {(view === 'signin' || view === 'signup' || view === 'reset') && (
          <div>
            <PasswordField id="au-password" label={view === 'signin' ? 'Password' : view === 'reset' ? 'New password' : 'Create a password'} value={password} onChange={setPassword}
              autoComplete={view === 'signin' ? 'current-password' : 'new-password'} invalid={touched && (view === 'signin' ? !password : !strong)} />
            {view === 'signin' ? (
              <div className="mt-2 flex justify-end"><button type="button" onClick={() => go('forgot')} className="text-sm font-medium text-accent hover:text-accent-700">Forgot password?</button></div>
            ) : (
              <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-3">
                {checks.map(c => (
                  <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${c.ok ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>{c.ok && <Check className="h-3 w-3" />}</span>{c.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button disabled={busy} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white shadow-lg shadow-accent/25 transition-colors hover:bg-accent-700 disabled:opacity-70">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} {primary[view]} {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      {view === 'signin' && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200/70">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-slate-900">New to HogiCar Rewards?</p>
            <p className="text-slate-600">Earn points on every rental and swap them for money off.</p>
            <button type="button" onClick={() => go('signup')} className="mt-1.5 font-semibold text-accent hover:text-accent-700">Create a free account →</button>
          </div>
        </div>
      )}
      {view === 'signup' && (
        <>
          <p className="mt-4 text-center text-sm text-slate-600">Already have an account? <button type="button" onClick={() => go('signin')} className="font-semibold text-accent hover:text-accent-700">Sign in</button></p>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">By creating an account you agree to our <a href="/terms-and-conditions" className="underline">Terms</a> and <a href="/privacy-policy" className="underline">Privacy Policy</a>. Points from bookings made with this email are added automatically.</p>
        </>
      )}
    </div>
  );
};

export default AuthPanel;
