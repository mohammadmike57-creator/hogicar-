import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import Copy from 'lucide-react/dist/esm/icons/copy';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

/** Shared building blocks for the admin Commercial screens (Affiliates, Integrations). */

export const usd = (n: number | null | undefined, digits?: number) => {
  const v = Number(n || 0);
  const d = digits ?? (Math.round(v * 100) % 100 ? 2 : 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
};

export const num = (n: number | null | undefined) => new Intl.NumberFormat('en-US').format(Number(n || 0));

export const errorOf = (e: any, fallback: string) =>
  e?.response?.data?.message || e?.response?.data?.error?.message || fallback;

/** Server times have no zone and are in the server's clock; show them relative to now. */
export const ago = (iso?: string | null) => {
  if (!iso) return 'Never';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'Just now';
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} d ago`;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const inputCls =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

export type ToastState = { text: string; tone: 'ok' | 'err' } | null;

export const useToast = () => {
  const [toast, setToast] = React.useState<ToastState>(null);
  const timer = React.useRef<number>();
  const notify = React.useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ text, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, notify };
};

export const Toast: React.FC<{ toast: ToastState }> = ({ toast }) =>
  typeof document === 'undefined' ? null : createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} role="status"
          className={`fixed bottom-6 left-1/2 z-[300] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-xl ${toast.tone === 'err' ? 'bg-rose-600' : 'bg-slate-900'}`}>
          {toast.tone === 'err' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
          <span className="truncate">{toast.text}</span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};

export const CopyButton: React.FC<{ text: string; label?: string; className?: string; onCopied?: () => void }> = ({ text, label, className = '', onCopied }) => {
  const [done, setDone] = React.useState(false);
  return (
    <button type="button" onClick={async e => { e.stopPropagation(); if (await copyText(text)) { setDone(true); onCopied?.(); window.setTimeout(() => setDone(false), 1600); } }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${className}`} aria-label={label || 'Copy'}>
      {done ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      {label && <span>{done ? 'Copied' : label}</span>}
    </button>
  );
};

/** Right-hand sheet on desktop, full screen on phones. */
export const Drawer: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
  width?: string;
  footer?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ eyebrow, title, onClose, busy, width = 'max-w-[600px]', footer, headerExtra, children }) => {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose, busy]);
  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 320 }}
        className={`relative flex h-full w-full ${width} flex-col bg-slate-50 shadow-2xl`}>
        <header className="border-b border-slate-200 bg-white px-5 pt-4 sm:px-6">
          <div className="flex items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#007ac2]">{eyebrow}</p>
              <h2 className="mt-0.5 truncate text-xl font-semibold text-slate-900">{title}</h2>
            </div>
            <button onClick={onClose} disabled={busy} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          {headerExtra}
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="border-t border-slate-200 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">{footer}</footer>}
      </motion.aside>
    </div>,
    document.body,
  );
};

export const Hero: React.FC<{
  eyebrow: string;
  eyebrowIcon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  kpis: { label: string; value: string; Icon: React.ComponentType<{ className?: string }>; note?: string }[];
  loading?: boolean;
}> = ({ eyebrow, eyebrowIcon: EyebrowIcon, title, subtitle, actions, kpis, loading }) => (
  <section className="relative overflow-hidden rounded-3xl bg-[#0b2545] p-5 text-white sm:p-7">
    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#007ac2]/50 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100 ring-1 ring-inset ring-white/15"><EyebrowIcon className="h-3 w-3" /> {eyebrow}</span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 hidden max-w-xl text-sm text-sky-100/80 sm:block">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    <dl className="relative mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {kpis.map(k => (
        <div key={k.label} className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
          <dt className="flex items-center gap-1.5 text-xs text-sky-100/80"><k.Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{k.label}</span></dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{loading ? <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-white/15 align-middle" /> : k.value}</dd>
          {k.note && !loading && <p className="mt-0.5 truncate text-[11px] text-sky-100/60">{k.note}</p>}
        </div>
      ))}
    </dl>
  </section>
);

export const heroButton = 'inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/15';
export const heroPrimary = 'inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b2545] shadow-lg hover:bg-sky-50';

export const Segmented = <K extends string>({ value, onChange, items, layoutId }: {
  value: K; onChange: (k: K) => void; items: { key: K; label: string; count?: number; dot?: boolean }[]; layoutId: string;
}) => (
  <div className="-mx-1 overflow-x-auto px-1">
    <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200" role="tablist">
      {items.map(it => (
        <button key={it.key} role="tab" aria-selected={value === it.key} onClick={() => onChange(it.key)}
          className={`relative inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition sm:px-4 ${value === it.key ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>
          {value === it.key && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-slate-900" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />}
          <span className="relative">{it.label}</span>
          {it.count != null && <span className={`relative rounded-full px-1.5 text-[11px] ${value === it.key ? 'bg-white/15' : it.dot ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{it.count}</span>}
        </button>
      ))}
    </div>
  </div>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <span>
      <span className="block text-sm font-semibold text-slate-900">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </span>
    <span className="relative shrink-0">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="block h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
      <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </span>
  </label>
);

export const ErrorBanner: React.FC<{ text: string; onRetry: () => void }> = ({ text, onRetry }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
    <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{text}</span>
    <button onClick={onRetry} className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-rose-200">Try again</button>
  </div>
);

export const Spinner: React.FC<{ light?: boolean }> = ({ light }) => (
  <span className={`h-4 w-4 animate-spin rounded-full border-2 ${light ? 'border-white/30 border-t-white' : 'border-slate-300 border-t-slate-700'}`} />
);
