import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import type {
  Health, NetworkStatus, ConversionStatus, MatchStatus, LogLevel, PublisherStatus, TestResult,
} from '../../affiliateNetworksApi';
import { inputCls, Spinner } from '../commercialUi';

export { inputCls };
export { fmtDate as fmtDay } from '../commercialUi';

// ---------------------------------------------------------------- formatting

/** "SERVER_TO_SERVER" → "Server to server" */
export const humanize = (v?: string | null) => {
  if (!v) return '—';
  const s = v.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const TRACKING_METHOD_LABEL: Record<string, string> = {
  CLIENT_SIDE: 'Client-side tag',
  SERVER_TO_SERVER: 'Server-to-server',
  PIXEL: 'Fallback pixel',
  POSTBACK: 'Postback',
  WEBHOOK: 'Webhook',
  API: 'API',
  HYBRID: 'Hybrid',
};

const isCurrencyCode = (c?: string | null) => !!c && /^[A-Z]{3}$/.test(c);

/** Money in the booking currency; plain number when the currency is unknown or "mixed". */
export const money = (n: number | null | undefined, currency?: string | null) => {
  const v = Number(n || 0);
  if (isCurrencyCode(currency)) {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency!, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    } catch { /* unknown code */ }
  }
  return new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
};

export const pct = (n: number | null | undefined, digits = 1) => `${Number(n || 0).toFixed(digits)}%`;

export const dateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const isoDay = (d: Date) => {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return isoDay(d); };

// ---------------------------------------------------------------- buttons

export const btnPrimary = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00649f] disabled:cursor-not-allowed disabled:opacity-60';
export const btnSecondary = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';
export const btnDanger = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60';
export const iconBtn = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40';
export const selectCls = `${inputCls} cursor-pointer appearance-none pr-9`;
/** Compact control used in filter bars. */
export const filterCls = 'h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15';
export const filterSelectCls = `${filterCls} cursor-pointer appearance-none pr-8`;

/** Native select with a chevron. `compact` = filter-bar size. */
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { compact?: boolean }> = ({ compact, className = '', children, ...rest }) => (
  <div className="relative min-w-0">
    <select {...rest} className={`${compact ? filterSelectCls : selectCls} ${className}`}>{children}</select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

// ---------------------------------------------------------------- badges

export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'blue' | 'violet' | 'sky';
const TONES: Record<Tone, { cls: string; dot: string }> = {
  green: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  amber: { cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  red: { cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  grey: { cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  blue: { cls: 'bg-[#007ac2]/10 text-[#00649f] ring-[#007ac2]/25', dot: 'bg-[#007ac2]' },
  violet: { cls: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  sky: { cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
};

export const Badge: React.FC<{ tone?: Tone; dot?: boolean; children: React.ReactNode; title?: string; className?: string }> = ({ tone = 'grey', dot, children, title, className = '' }) => (
  <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[tone].cls} ${className}`}>
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONES[tone].dot}`} />}
    {children}
  </span>
);

export const HEALTH_UI: Record<Health, { tone: Tone; label: string }> = {
  CONNECTED: { tone: 'green', label: 'Connected' },
  CONFIGURED: { tone: 'amber', label: 'Configured' },
  WARNING: { tone: 'amber', label: 'Warning' },
  ERROR: { tone: 'red', label: 'Error' },
  NOT_CONFIGURED: { tone: 'grey', label: 'Not configured' },
  DISABLED: { tone: 'grey', label: 'Disabled' },
  CONNECTOR_NOT_INSTALLED: { tone: 'grey', label: 'Connector not installed' },
};
export const HealthBadge: React.FC<{ health?: Health | null; title?: string | null }> = ({ health, title }) => {
  const ui = (health && HEALTH_UI[health]) || { tone: 'grey' as Tone, label: humanize(health) };
  return <Badge tone={ui.tone} dot title={title || undefined}>{ui.label}</Badge>;
};

export const NETWORK_STATUS_UI: Record<NetworkStatus, { tone: Tone; label: string }> = {
  ACTIVE: { tone: 'green', label: 'Active' },
  DRAFT: { tone: 'sky', label: 'Draft' },
  INACTIVE: { tone: 'grey', label: 'Inactive' },
};
export const NetworkStatusBadge: React.FC<{ status: NetworkStatus }> = ({ status }) => {
  const ui = NETWORK_STATUS_UI[status] || { tone: 'grey' as Tone, label: humanize(status) };
  return <Badge tone={ui.tone} dot>{ui.label}</Badge>;
};

export const CONVERSION_STATUS_TONE: Record<ConversionStatus, Tone> = {
  WAITING: 'grey', PENDING: 'sky', PROCESSING: 'blue', SENT: 'blue', CONFIRMED: 'green', FAILED: 'red', RETRYING: 'amber',
  CANCELLED: 'grey', REFUNDED: 'violet', REVERSED: 'violet', SKIPPED: 'grey',
};
export const ConversionStatusBadge: React.FC<{ status?: ConversionStatus | null }> = ({ status }) =>
  status ? <Badge tone={CONVERSION_STATUS_TONE[status] || 'grey'} dot>{humanize(status)}</Badge> : <span className="text-slate-400">—</span>;

export const MATCH_TONE: Record<MatchStatus, Tone> = {
  MATCHED: 'green', PARTIALLY_MATCHED: 'amber', MISSING_NETWORK: 'red', MISSING_BOOKING: 'red', VALUE_MISMATCH: 'amber', STATUS_MISMATCH: 'amber',
};
export const MatchBadge: React.FC<{ status?: MatchStatus | null }> = ({ status }) =>
  status ? <Badge tone={MATCH_TONE[status] || 'grey'} dot>{humanize(status)}</Badge> : <span className="text-slate-400">—</span>;

export const LEVEL_TONE: Record<LogLevel, Tone> = { INFO: 'sky', WARN: 'amber', ERROR: 'red' };
export const LevelBadge: React.FC<{ level: LogLevel }> = ({ level }) => <Badge tone={LEVEL_TONE[level] || 'grey'}>{level}</Badge>;

export const PUBLISHER_STATUS_TONE: Record<PublisherStatus, Tone> = { ACTIVE: 'green', PENDING: 'amber', SUSPENDED: 'grey', BLOCKED: 'red' };

export const TEST_RESULT_UI: Record<TestResult, { tone: Tone; label: string }> = {
  CONNECTED: { tone: 'green', label: 'Connected' },
  CONFIGURED: { tone: 'amber', label: 'Configured (no live check)' },
  FAILED: { tone: 'red', label: 'Failed' },
  INVALID_CREDENTIALS: { tone: 'red', label: 'Invalid credentials' },
  NOT_SUPPORTED: { tone: 'grey', label: 'Not supported' },
  TIMEOUT: { tone: 'red', label: 'Timed out' },
};
export const TestResultBadge: React.FC<{ result?: TestResult | null }> = ({ result }) => {
  if (!result) return <span className="text-slate-400">Never tested</span>;
  const ui = TEST_RESULT_UI[result] || { tone: 'grey' as Tone, label: humanize(result) };
  return <Badge tone={ui.tone} dot>{ui.label}</Badge>;
};

export const PassFail: React.FC<{ ok: boolean; yes?: string; no?: string }> = ({ ok, yes = 'Pass', no = 'Fail' }) => (
  <Badge tone={ok ? 'green' : 'red'}>{ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{ok ? yes : no}</Badge>
);

// ---------------------------------------------------------------- layout

export const Card: React.FC<{
  title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; icon?: React.ComponentType<{ className?: string }>;
}> = ({ title, subtitle, actions, children, className = '', bodyClassName = 'p-4 sm:p-5', icon: Icon }) => (
  <section className={`min-w-0 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
    {(title || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#007ac2]/10 text-[#007ac2]"><Icon className="h-4 w-4" /></span>}
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

/** Section label used inside drawers and forms. */
export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 ${className}`}>{children}</p>
);

export const Panel: React.FC<{ title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }> = ({ title, children, className = '', actions }) => (
  <div className={`space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 ${className}`}>
    {(title || actions) && <div className="flex items-center justify-between gap-2">{title && <SectionLabel>{title}</SectionLabel>}{actions}</div>}
    {children}
  </div>
);

/** Definition list grid for read-only detail. */
export const DL: React.FC<{ items: [React.ReactNode, React.ReactNode][]; cols?: 2 | 3 }> = ({ items, cols = 2 }) => (
  <dl className={`grid grid-cols-1 gap-x-4 gap-y-3 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
    {items.map(([k, v], i) => (
      <div key={i} className="min-w-0">
        <dt className="text-xs text-slate-500">{k}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{v === null || v === undefined || v === '' ? <span className="text-slate-400">—</span> : v}</dd>
      </div>
    ))}
  </dl>
);

export const th = 'whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 first:pl-4 last:pr-4 sm:first:pl-5';
export const thRight = `${th} text-right`;
export const td = 'px-3 py-3 align-middle first:pl-4 last:pr-4 sm:first:pl-5';
export const tdRight = `${td} text-right tabular-nums`;

/** Table inside a card; scrolls horizontally inside the card on narrow screens. */
export const TableCard: React.FC<{ children: React.ReactNode; className?: string; footer?: React.ReactNode }> = ({ children, className = '', footer }) => (
  <div className={`min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-slate-700">{children}</table>
    </div>
    {footer}
  </div>
);

export const SkeletonRows: React.FC<{ rows?: number; height?: string }> = ({ rows = 5, height = 'h-14' }) => (
  <div className="space-y-2" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className={`${height} animate-pulse rounded-2xl bg-white ring-1 ring-slate-200`} />)}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-24' }) => <span className={`inline-block animate-pulse rounded-md bg-slate-200 ${className}`} />;

export const EmptyState: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode; compact?: boolean }> = ({ icon: Icon, title, text, action, compact }) => (
  <div className={`rounded-2xl bg-white text-center ring-1 ring-slate-200 ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Icon className="h-6 w-6" /></span>
    <p className="mt-3 text-base font-semibold text-slate-900">{title}</p>
    {text && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const Callout: React.FC<{ tone?: 'info' | 'warn' | 'error' | 'ok'; icon?: React.ComponentType<{ className?: string }>; title?: React.ReactNode; children?: React.ReactNode; className?: string }> = ({ tone = 'info', icon: Icon = AlertTriangle, title, children, className = '' }) => {
  const cls = { info: 'bg-sky-50 text-sky-900 ring-sky-200', warn: 'bg-amber-50 text-amber-900 ring-amber-200', error: 'bg-rose-50 text-rose-900 ring-rose-200', ok: 'bg-emerald-50 text-emerald-900 ring-emerald-200' }[tone];
  const ic = { info: 'text-sky-600', warn: 'text-amber-600', error: 'text-rose-600', ok: 'text-emerald-600' }[tone];
  return (
    <div className={`flex items-start gap-3 rounded-2xl p-3.5 text-sm ring-1 ring-inset ${cls} ${className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ic}`} />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
};

export const FilterBar: React.FC<{ children: React.ReactNode; actions?: React.ReactNode }> = ({ children, actions }) => (
  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{children}</div>
    {actions && <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">{actions}</div>}
  </div>
);

export const FilterField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`block min-w-0 ${className}`}>
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    {children}
  </label>
);

export const Pagination: React.FC<{ page: number; size: number; total: number; onPage: (p: number) => void }> = ({ page, size, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? page * size + 1 : 0;
  const to = Math.min(total, (page + 1) * size);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-5">
      <span className="tabular-nums">{from}–{to} of {total.toLocaleString('en-GB')}</span>
      <div className="flex items-center gap-1">
        <button className={iconBtn} disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <span className="px-2 tabular-nums text-slate-700">{page + 1} / {pages}</span>
        <button className={iconBtn} disabled={page + 1 >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- dialogs

export const Modal: React.FC<{
  title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; busy?: boolean; width?: string; eyebrow?: string;
}> = ({ title, onClose, children, footer, busy, width = 'max-w-lg', eyebrow }) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);
  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.16 }}
        className={`relative flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#007ac2]">{eyebrow}</p>}
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          </div>
          <button onClick={onClose} disabled={busy} className={iconBtn} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </motion.div>
    </div>,
    document.body,
  );
};

type ConfirmOptions = { title: string; message: React.ReactNode; confirmLabel?: string; danger?: boolean };

/** `const [confirm, confirmEl] = useConfirm(); if (await confirm({...})) …` — render `confirmEl` once. */
export const useConfirm = (): [(o: ConfirmOptions) => Promise<boolean>, React.ReactNode] => {
  const [state, setState] = React.useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = React.useCallback((o: ConfirmOptions) => new Promise<boolean>(resolve => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  const el = (
    <AnimatePresence>
      {state && (
        <Modal key="confirm" title={state.title} onClose={() => close(false)} width="max-w-md"
          footer={<>
            <button className={btnSecondary} onClick={() => close(false)}>Cancel</button>
            <button className={state.danger ? btnDanger : btnPrimary} onClick={() => close(true)} autoFocus>{state.confirmLabel || 'Confirm'}</button>
          </>}>
          <div className="flex items-start gap-3 text-sm text-slate-600">
            {state.danger && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"><AlertTriangle className="h-4 w-4" /></span>}
            <div className="pt-1.5">{state.message}</div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
  return [confirm, el];
};

// ---------------------------------------------------------------- inputs

/** Free-text tag input; Enter, comma or space adds a chip. */
export const ChipInput: React.FC<{
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; upper?: boolean; pattern?: RegExp; patternHint?: string; emptyLabel?: string;
}> = ({ value, onChange, placeholder, upper = true, pattern, patternHint, emptyLabel }) => {
  const [text, setText] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const add = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map(s => (upper ? s.toUpperCase() : s).trim()).filter(Boolean);
    if (!parts.length) return;
    const bad = pattern ? parts.filter(p => !pattern.test(p)) : [];
    if (bad.length) { setErr(`${bad.join(', ')}: ${patternHint || 'invalid value'}`); return; }
    onChange(Array.from(new Set([...value, ...parts])));
    setText(''); setErr(null);
  };
  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 py-1.5 focus-within:border-[#007ac2] focus-within:ring-4 focus-within:ring-[#007ac2]/15">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pl-2 pr-1 font-mono text-xs font-semibold text-slate-700">
            {v}
            <button type="button" onClick={() => onChange(value.filter(x => x !== v))} className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-slate-700" aria-label={`Remove ${v}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={text} onChange={e => { setText(e.target.value); setErr(null); }} placeholder={value.length ? '' : placeholder}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); add(text); }
            else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => text && add(text)}
          className="h-8 min-w-[8rem] flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-slate-400 sm:text-sm" />
      </div>
      {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : !value.length && emptyLabel ? <p className="mt-1 text-xs text-slate-500">{emptyLabel}</p> : null}
    </div>
  );
};

/** Pill multi-select. Disabled options keep a reason as tooltip/subtext. */
export const MultiPills = <T extends string>({ options, value, onChange, labels, disabled }: {
  options: readonly T[]; value: T[]; onChange: (v: T[]) => void; labels?: Record<string, string>; disabled?: Partial<Record<T, string>>;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(o => {
      const on = value.includes(o);
      const reason = disabled?.[o];
      return (
        <button key={o} type="button" disabled={!!reason && !on} title={reason || undefined}
          onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition ${on ? 'bg-[#007ac2] text-white ring-[#007ac2]' : reason ? 'cursor-not-allowed bg-slate-50 text-slate-400 ring-slate-200' : 'bg-white text-slate-600 ring-slate-300 hover:ring-slate-400'}`}>
          {on && <Check className="h-3.5 w-3.5" />}{labels?.[o] || humanize(o)}
        </button>
      );
    })}
  </div>
);

export const NumberInput: React.FC<{ value: number | null | undefined; onChange: (v: number | null) => void; suffix?: string; placeholder?: string; decimals?: boolean; min?: number }> = ({ value, onChange, suffix, placeholder, decimals = true }) => {
  const [text, setText] = React.useState(value === null || value === undefined ? '' : String(value));
  React.useEffect(() => {
    const cur = text === '' ? null : Number(text);
    if (cur !== (value ?? null)) setText(value === null || value === undefined ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className="relative">
      <input inputMode={decimals ? 'decimal' : 'numeric'} className={`${inputCls} ${suffix ? 'pr-14' : ''}`} value={text} placeholder={placeholder}
        onChange={e => {
          const t = e.target.value.replace(decimals ? /[^0-9.-]/g : /[^0-9-]/g, '');
          setText(t);
          onChange(t === '' || t === '-' || t === '.' ? null : Number(t));
        }} />
      {suffix && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}
    </div>
  );
};

export const JsonView: React.FC<{ value: unknown; maxHeight?: string }> = ({ value, maxHeight = 'max-h-96' }) => {
  let text: string;
  if (typeof value === 'string') {
    try { text = JSON.stringify(JSON.parse(value), null, 2); } catch { text = value; }
  } else {
    text = value === undefined ? '' : JSON.stringify(value, null, 2);
  }
  if (!text || text === 'null') return <p className="text-sm text-slate-400">No data</p>;
  return (
    <div className="relative">
      <pre className={`${maxHeight} overflow-auto rounded-xl bg-[#0b1526] p-3.5 font-mono text-[12px] leading-relaxed text-sky-100`}>{text}</pre>
    </div>
  );
};

export const SaveFooter: React.FC<{ error?: string | null; saving: boolean; onCancel: () => void; onSave: () => void; label: string; extra?: React.ReactNode }> = ({ error, saving, onCancel, onSave, label, extra }) => (
  <>
    {error && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
    <div className="flex gap-2">
      {extra}
      <button type="button" onClick={onCancel} disabled={saving} className={`${btnSecondary} h-11 flex-1`}>Cancel</button>
      <button type="button" onClick={onSave} disabled={saving} className={`${btnPrimary} h-11 flex-[2]`}>{saving ? <Spinner light /> : <Check className="h-4 w-4" />}{label}</button>
    </div>
  </>
);

// ---------------------------------------------------------------- csv

const csvCell = (v: unknown) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Excel-compatible CSV (UTF-8 BOM, CRLF) generated in the browser. */
export const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
  const body = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['﻿', body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Copies only the keys present in `template` from `src` (drops read-only fields such as id or stats). */
export const pickInto = <T extends object>(template: T, src: object): T => {
  const out: Record<string, unknown> = { ...(template as Record<string, unknown>) };
  Object.keys(template).forEach(k => { const v = (src as Record<string, unknown>)[k]; if (v !== undefined) out[k] = v; });
  return out as T;
};

export const safeStorage = {
  get(key: string): string | null { try { return window.localStorage.getItem(key); } catch { return null; } },
  set(key: string, v: string) { try { window.localStorage.setItem(key, v); } catch { /* ignore */ } },
};
