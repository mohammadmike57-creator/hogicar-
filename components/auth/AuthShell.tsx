import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Check from 'lucide-react/dist/esm/icons/check';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { Logo } from '../Logo';

export interface AuthFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}

export interface AuthShellProps {
  /** Small label above the headline, e.g. "Partner portal". */
  eyebrow: string;
  headline: React.ReactNode;
  intro: string;
  features: AuthFeature[];
  /** Live-looking stats shown on the brand panel. */
  stats?: { value: string; label: string }[];
  formTitle: string;
  formSubtitle: string;
  identityLabel: string;
  identityPlaceholder: string;
  identityType: 'email' | 'text';
  identity: string;
  onIdentity: (v: string) => void;
  password: string;
  onPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  /** True briefly after a successful sign-in, before navigating. */
  isSuccess?: boolean;
  error: string;
  submitLabel: string;
  forgotHelp: string;
  footer?: React.ReactNode;
  /** Accent used for glows: "blue" (supplier) or "amber" (admin). */
  tone?: 'blue' | 'amber';
  rememberKey: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

/** Animated road with a car driving along it, drawn for the brand panel. */
const RouteArt: React.FC<{ reduce: boolean }> = ({ reduce }) => (
  <svg viewBox="0 0 520 140" className="h-auto w-full" aria-hidden="true">
    <defs>
      <linearGradient id="auth-road" x1="0" x2="1">
        <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
        <stop offset=".25" stopColor="#38bdf8" stopOpacity=".7" />
        <stop offset=".75" stopColor="#f59e0b" stopOpacity=".7" />
        <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path id="auth-route" d="M10 110 C 120 110, 140 40, 260 40 S 400 110, 510 70" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" strokeLinecap="round" />
    <motion.path
      d="M10 110 C 120 110, 140 40, 260 40 S 400 110, 510 70"
      fill="none" stroke="url(#auth-road)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 10"
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.8, ease, delay: 0.4 }}
    />
    {[[10, 110, '#38bdf8'], [260, 40, '#ffffff'], [510, 70, '#f59e0b']].map(([x, y, c], i) => (
      <g key={i}>
        {!reduce && <motion.circle cx={x as number} cy={y as number} r="10" fill={c as string} opacity=".25" animate={{ r: [8, 16, 8], opacity: [0.35, 0, 0.35] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} />}
        <circle cx={x as number} cy={y as number} r="5" fill={c as string} />
      </g>
    ))}
    {!reduce && (
      <g>
        <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#fff">
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".45 0 .55 1">
            <mpath href="#auth-route" />
          </animateMotion>
        </rect>
      </g>
    )}
  </svg>
);

const AuthShell: React.FC<AuthShellProps> = (p) => {
  const reduce = !!useReducedMotion();
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsOn, setCapsOn] = React.useState(false);
  const [showForgot, setShowForgot] = React.useState(false);
  const [remember, setRemember] = React.useState(() => {
    try { return !!localStorage.getItem(p.rememberKey); } catch { return false; }
  });
  const [featureIdx, setFeatureIdx] = React.useState(0);
  const [shakeKey, setShakeKey] = React.useState(0);

  // Prefill a remembered identity once.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(p.rememberKey);
      if (saved && !p.identity) p.onIdentity(saved);
    } catch { /* storage unavailable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => { if (p.error) setShakeKey(k => k + 1); }, [p.error]);

  React.useEffect(() => {
    if (reduce || p.features.length < 2) return;
    const t = setInterval(() => setFeatureIdx(i => (i + 1) % p.features.length), 3600);
    return () => clearInterval(t);
  }, [reduce, p.features.length]);

  // Gentle parallax on desktop pointers.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const blobX = useTransform(sx, [0, 1], [-24, 24]);
  const blobY = useTransform(sy, [0, 1], [-18, 18]);
  const onPointer = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse') return;
    mx.set(e.clientX / window.innerWidth);
    my.set(e.clientY / window.innerHeight);
  };

  const submit = (e: React.FormEvent) => {
    try {
      if (remember && p.identity.trim()) localStorage.setItem(p.rememberKey, p.identity.trim());
      else localStorage.removeItem(p.rememberKey);
    } catch { /* storage unavailable */ }
    p.onSubmit(e);
  };

  const glow = p.tone === 'amber' ? 'bg-amber-500/25' : 'bg-sky-500/25';
  const IdentityIcon = p.identityType === 'email' ? Mail : User;
  const stagger = (i: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, ease, delay: 0.15 + i * 0.07 } });
  const feature = p.features[featureIdx];

  return (
    <div onPointerMove={onPointer} className="relative flex min-h-[100dvh] flex-col bg-slate-950 font-sans lg:flex-row lg:bg-white">
      {/* ---------- Brand panel ---------- */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white lg:flex lg:w-[54%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* animated aurora */}
        <motion.div aria-hidden="true" style={{ x: blobX, y: blobY }} className="pointer-events-none absolute -left-32 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-[#007ac2]/40 blur-[110px]" />
        <motion.div aria-hidden="true" style={{ x: blobY, y: blobX }} className={`pointer-events-none absolute -bottom-40 right-[-6rem] -z-10 h-[30rem] w-[30rem] rounded-full ${glow} blur-[120px]`} />
        {!reduce && (
          <motion.div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-1/3 -z-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-[100px]"
            animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

        {/* Mobile brand header */}
        <div className="relative px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))] lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" aria-label="Hogicar home"><Logo variant="light" className="h-7 w-auto" /></Link>
            <Link to="/" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white/80 ring-1 ring-white/15"><ArrowLeft className="h-3.5 w-3.5" /> Website</Link>
          </div>
          <motion.p {...stagger(0)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/15">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
            {p.eyebrow}
          </motion.p>
          <motion.h1 {...stagger(1)} className="mt-3 text-[28px] font-bold leading-tight tracking-tight">{p.headline}</motion.h1>
          <motion.p {...stagger(2)} className="mt-2 text-sm leading-relaxed text-white/65">{p.intro}</motion.p>
        </div>

        {/* Desktop brand content */}
        <div className="relative hidden lg:block">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <Link to="/" aria-label="Hogicar home"><Logo variant="light" className="h-9 w-auto" /></Link>
          </motion.div>
        </div>

        <div className="relative hidden max-w-xl lg:block">
          <motion.p {...stagger(0)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/15">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
            {p.eyebrow}
          </motion.p>
          <motion.h1 {...stagger(1)} className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight xl:text-[56px]">{p.headline}</motion.h1>
          <motion.p {...stagger(2)} className="mt-5 max-w-md text-lg leading-relaxed text-white/65">{p.intro}</motion.p>

          <motion.div {...stagger(3)} className="mt-10"><RouteArt reduce={reduce} /></motion.div>

          {/* rotating feature */}
          <motion.div {...stagger(4)} className="mt-8 grid grid-cols-[1fr_auto] items-center gap-6">
            <div className="relative h-[76px] overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur">
              <AnimatePresence mode="wait">
                <motion.div key={featureIdx} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.45, ease }} className="absolute inset-0 flex items-center gap-4 px-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><feature.icon className="h-5 w-5 text-sky-300" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{feature.title}</span>
                    <span className="block truncate text-sm text-white/60">{feature.text}</span>
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex gap-1.5" role="tablist" aria-label="Highlights">
              {p.features.map((f, i) => (
                <button key={f.title} type="button" role="tab" aria-selected={i === featureIdx} aria-label={f.title} onClick={() => setFeatureIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === featureIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`} />
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative hidden items-center justify-between gap-6 lg:flex">
          {p.stats && (
            <motion.dl {...stagger(5)} className="flex gap-10">
              {p.stats.map(s => (
                <div key={s.label}>
                  <dt className="text-xs text-white/50">{s.label}</dt>
                  <dd className="mt-0.5 text-xl font-semibold tabular-nums text-white">{s.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}
          <p className="flex items-center gap-1.5 text-xs text-white/45"><ShieldCheck className="h-4 w-4" /> 256-bit TLS encrypted</p>
        </div>
      </section>

      {/* ---------- Form panel ---------- */}
      <main className="relative z-10 -mt-8 flex flex-1 items-start justify-center rounded-t-[28px] bg-white px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 lg:mt-0 lg:items-center lg:rounded-none lg:px-12 lg:py-12">
        <div className="w-full max-w-[400px]">
          <motion.div {...stagger(1)}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{p.formTitle}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{p.formSubtitle}</p>
          </motion.div>

          <motion.form
            key={shakeKey}
            onSubmit={submit}
            noValidate
            animate={shakeKey && !reduce ? { x: [0, -10, 9, -6, 4, 0] } : undefined}
            transition={{ duration: 0.45 }}
            className="mt-7 space-y-4"
          >
            <AnimatePresence>
              {p.error && (
                <motion.div role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{p.error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div {...stagger(2)}>
              <label htmlFor="auth-identity" className="mb-1.5 block text-sm font-medium text-slate-700">{p.identityLabel}</label>
              <div className="group relative">
                <IdentityIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-accent" />
                <input
                  id="auth-identity"
                  type={p.identityType}
                  inputMode={p.identityType === 'email' ? 'email' : 'text'}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={p.identity}
                  onChange={e => p.onIdentity(e.target.value)}
                  placeholder={p.identityPlaceholder}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-3.5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-[15px]"
                />
              </div>
            </motion.div>

            <motion.div {...stagger(3)}>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">Password</label>
                <button type="button" onClick={() => setShowForgot(v => !v)} aria-expanded={showForgot} className="text-sm font-medium text-accent hover:text-accent-700">Forgot password?</button>
              </div>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-accent" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={p.password}
                  onChange={e => p.onPassword(e.target.value)}
                  onKeyUp={e => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                  onKeyDown={e => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-[15px]"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              <AnimatePresence>
                {capsOn && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs font-medium text-amber-700">Caps Lock is on</motion.p>
                )}
                {showForgot && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <span className="mt-2 block rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-200">{p.forgotHelp}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.label {...stagger(4)} className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-[18px] w-[18px] rounded border-slate-300 text-accent focus:ring-accent" />
              Remember my {p.identityType === 'email' ? 'email' : 'username'} on this device
            </motion.label>

            <motion.div {...stagger(5)}>
              <motion.button
                type="submit"
                disabled={p.isLoading || p.isSuccess}
                whileTap={reduce ? undefined : { scale: 0.985 }}
                className={`group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[15px] font-semibold text-white shadow-lg transition-colors disabled:cursor-wait ${p.isSuccess ? 'bg-emerald-600 shadow-emerald-600/25' : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'}`}
              >
                {!reduce && !p.isLoading && !p.isSuccess && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[300%]" />
                )}
                <AnimatePresence mode="wait" initial={false}>
                  {p.isSuccess ? (
                    <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2"><Check className="h-5 w-5" /> Signed in</motion.span>
                  ) : p.isLoading ? (
                    <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2.5">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
                      {p.submitLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </motion.form>

          {p.footer && <motion.div {...stagger(6)} className="mt-7">{p.footer}</motion.div>}

          <motion.p {...stagger(7)} className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400 lg:hidden">
            <ShieldCheck className="h-3.5 w-3.5" /> 256-bit TLS encrypted connection
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default AuthShell;
