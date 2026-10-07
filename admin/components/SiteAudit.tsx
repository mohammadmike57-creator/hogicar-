import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Play from 'lucide-react/dist/esm/icons/play';
import Download from 'lucide-react/dist/esm/icons/download';
import Settings from 'lucide-react/dist/esm/icons/settings';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Info from 'lucide-react/dist/esm/icons/info';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Search from 'lucide-react/dist/esm/icons/search';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Square from 'lucide-react/dist/esm/icons/square';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Database from 'lucide-react/dist/esm/icons/database';
import { adminApi } from '../../api';
import SeoAuditManagement from './SeoAuditManagement';
import {
  num, errorOf, ago, inputCls, Field, useToast, Toast, CopyButton, Drawer, Hero, heroButton, heroPrimary,
  Segmented, ErrorBanner, Spinner, Toggle,
} from './commercialUi';

// ---------------------------------------------------------------- types

type Severity = 'ERROR' | 'WARNING' | 'NOTICE';
type Check = { code: string; title: string; category: string; categoryLabel: string; severity: Severity; why: string; fix: string };
type CheckCount = { code: string; pages: number; previous?: number };
type Category = { key: string; label: string; score: number; errors: number; warnings: number; notices: number };
type SiteCheck = { key: string; title: string; state: 'ok' | 'warning' | 'error' | 'notice'; detail: string; fix: string };
type Summary = {
  healthScore: number; previousHealthScore?: number | null; pages: number; htmlPages: number; indexablePages: number; pagesWithErrors: number;
  errors: number; warnings: number; notices: number; checks: CheckCount[]; categories: Category[];
  statusCodes: Record<string, number>; speed: { avgMs: number; medianMs: number; p90Ms: number; slowPages: number };
  depth: Record<string, number>; notIndexable: Record<string, number>; siteChecks: SiteCheck[]; truncated?: boolean;
};
type Run = {
  id: number; status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'; triggeredBy?: string; startUrl: string; maxPages: number;
  pagesCrawled?: number; pagesDiscovered?: number; progress?: number; phase?: string; createdAt?: string; startedAt?: string; finishedAt?: string;
  healthScore?: number | null; errors?: number | null; warnings?: number | null; notices?: number | null; indexablePages?: number | null;
  errorMessage?: string | null; summary?: Summary | null;
};
type PageIssue = { code: string; detail?: string | null };
type PageRow = {
  id: number; url: string; status: number; location?: string; millis?: number; bytes?: number; depth?: number | null; inSitemap?: boolean;
  robotsBlocked?: boolean; indexable?: boolean; title?: string; description?: string; h1?: string; canonical?: string; wordCount?: number;
  inlinks?: number; outlinks?: number; lang?: string; errors: number; warnings: number; notices: number; issues: PageIssue[];
  focusDetail?: string | null; contentType?: string; detail?: Record<string, any>;
};
type Settings = { startUrl: string; maxPages: number; weeklyEnabled: boolean };

// ---------------------------------------------------------------- visual language

const SEV: Record<Severity, { label: string; plural: string; Icon: React.ComponentType<{ className?: string }>; text: string; soft: string; ring: string; dot: string }> = {
  ERROR: { label: 'Error', plural: 'Errors', Icon: XCircle, text: 'text-rose-700', soft: 'bg-rose-50', ring: 'ring-rose-200', dot: 'bg-rose-500' },
  WARNING: { label: 'Warning', plural: 'Warnings', Icon: AlertTriangle, text: 'text-amber-800', soft: 'bg-amber-50', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  NOTICE: { label: 'Notice', plural: 'Notices', Icon: Info, text: 'text-sky-800', soft: 'bg-sky-50', ring: 'ring-sky-200', dot: 'bg-sky-500' },
};

const scoreTone = (s: number) => (s >= 90 ? { label: 'Excellent', text: 'text-emerald-600', stroke: '#059669', soft: 'bg-emerald-50 text-emerald-700' }
  : s >= 75 ? { label: 'Good', text: 'text-emerald-600', stroke: '#10b981', soft: 'bg-emerald-50 text-emerald-700' }
    : s >= 50 ? { label: 'Needs work', text: 'text-amber-600', stroke: '#d97706', soft: 'bg-amber-50 text-amber-800' }
      : { label: 'Poor', text: 'text-rose-600', stroke: '#e11d48', soft: 'bg-rose-50 text-rose-700' });

const statusTone = (s: number, blocked?: boolean) => blocked ? 'bg-slate-100 text-slate-600 ring-slate-200'
  : s === 0 ? 'bg-rose-50 text-rose-700 ring-rose-200'
    : s >= 500 || s >= 400 ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : s >= 300 ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

const statusLabel = (p: Pick<PageRow, 'status' | 'robotsBlocked'>) => p.robotsBlocked ? 'Blocked' : p.status === 0 ? 'Failed' : String(p.status);

const shortUrl = (u: string) => {
  try {
    const x = new URL(u);
    const path = decodeURIComponent(x.pathname);
    return path === '/' ? x.host : path + (x.search || '');
  } catch { return u; }
};

const fmtWhen = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const duration = (a?: string | null, b?: string | null) => {
  if (!a || !b) return null;
  const s = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

// ---------------------------------------------------------------- small pieces

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 148 }) => {
  const tone = scoreTone(score);
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Health score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={12} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone.stroke} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums text-slate-900">{score}</span>
        <span className={`mt-0.5 text-xs font-semibold ${tone.text}`}>{tone.label}</span>
      </div>
    </div>
  );
};

const Delta: React.FC<{ now: number; before?: number | null; goodWhenDown?: boolean; suffix?: string }> = ({ now, before, goodWhenDown, suffix = '' }) => {
  if (before == null || before === now) return null;
  const up = now > before;
  const good = goodWhenDown ? !up : up;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{Math.abs(now - before)}{suffix}
    </span>
  );
};

const SevBadge: React.FC<{ severity: Severity; compact?: boolean }> = ({ severity, compact }) => {
  const s = SEV[severity];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.soft} ${s.text} ${s.ring}`}>
      <s.Icon className="h-3 w-3" />{compact ? null : s.label}
    </span>
  );
};

const Card: React.FC<{ title?: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, subtitle, action, className = '', children }) => (
  <section className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

// ---------------------------------------------------------------- overview blocks

const SiteChecks: React.FC<{ items: SiteCheck[] }> = ({ items }) => {
  const [open, setOpen] = React.useState<string | null>(null);
  const icon = (st: SiteCheck['state']) => st === 'ok' ? <CheckCircle className="h-5 w-5 text-emerald-500" />
    : st === 'error' ? <XCircle className="h-5 w-5 text-rose-500" /> : st === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : <Info className="h-5 w-5 text-sky-500" />;
  const passed = items.filter(i => i.state === 'ok').length;
  return (
    <Card title="Site essentials" subtitle={`${passed} of ${items.length} passed`}>
      <ul className="divide-y divide-slate-100">
        {items.map(i => (
          <li key={i.key}>
            <button onClick={() => setOpen(open === i.key ? null : i.key)} className="flex w-full items-start gap-3 py-3 text-left">
              <span className="mt-0.5 shrink-0">{icon(i.state)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{i.title}</span>
                <span className="block break-words text-xs text-slate-500">{i.detail}</span>
              </span>
              {i.state !== 'ok' && <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${open === i.key ? 'rotate-180' : ''}`} />}
            </button>
            {open === i.key && i.state !== 'ok' && (
              <p className="mb-3 ml-8 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700"><Wrench className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />{i.fix}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

const TrendCard: React.FC<{ runs: Run[]; onPick: (id: number) => void }> = ({ runs, onPick }) => {
  const data = runs.filter(r => r.status === 'COMPLETED' && r.healthScore != null).slice(0, 12).reverse()
    .map(r => ({ id: r.id, score: r.healthScore, errors: r.errors, label: new Date(r.finishedAt || r.createdAt || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }));
  return (
    <Card title="Health score over time" subtitle={data.length < 2 ? 'Run the audit again after making fixes to see your progress here.' : `Last ${data.length} audits`}>
      <div className="h-48 w-full min-w-0">
        {data.length === 0 ? <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">No completed audits yet</div> : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <LineChart data={data} margin={{ left: -24, right: 8, top: 8, bottom: 0 }} onClick={(e: any) => e?.activePayload?.[0] && onPick(e.activePayload[0].payload.id)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: any, n: any) => [v, n === 'score' ? 'Health score' : n]} />
              <Line type="monotone" dataKey="score" name="score" stroke="#007ac2" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

const CategoryGrid: React.FC<{ categories: Category[]; active: string | null; onPick: (key: string | null) => void }> = ({ categories, active, onPick }) => (
  <Card title="Scores by area" subtitle="Share of pages with no errors or warnings in each area. Click one to see its issues.">
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map(c => {
        const tone = scoreTone(c.score);
        const on = active === c.key;
        return (
          <button key={c.key} onClick={() => onPick(on ? null : c.key)}
            className={`rounded-2xl p-3.5 text-left ring-1 transition ${on ? 'bg-[#007ac2]/5 ring-[#007ac2]' : 'bg-slate-50/60 ring-slate-200 hover:bg-white hover:ring-slate-300'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">{c.label}</span>
              <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>{c.score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <motion.div className="h-full rounded-full" style={{ background: tone.stroke }} initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ duration: 0.6 }} />
            </div>
            <div className="mt-2 flex gap-3 text-[11px] text-slate-500">
              {(['errors', 'warnings', 'notices'] as const).map(k => (
                <span key={k} className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${k === 'errors' ? 'bg-rose-500' : k === 'warnings' ? 'bg-amber-500' : 'bg-sky-500'}`} />{c[k]} {k}</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  </Card>
);

const Breakdown: React.FC<{ s: Summary }> = ({ s }) => {
  const total = Math.max(1, Object.values(s.statusCodes).reduce<number>((a, b) => a + Number(b), 0));
  const parts: { key: string; label: string; color: string }[] = [
    { key: '2xx', label: '200 OK', color: '#10b981' }, { key: '3xx', label: 'Redirects', color: '#f59e0b' },
    { key: '4xx', label: 'Not found (4xx)', color: '#e11d48' }, { key: '5xx', label: 'Server errors', color: '#9f1239' },
    { key: 'failed', label: 'Failed', color: '#64748b' }, { key: 'blocked', label: 'Blocked by robots', color: '#cbd5e1' },
  ];
  return (
    <Card title="Crawl breakdown" subtitle={`${num(s.pages)} URLs found, ${num(s.indexablePages)} can appear in Google`}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {parts.filter(p => s.statusCodes[p.key]).map(p => (
          <div key={p.key} title={`${p.label}: ${s.statusCodes[p.key]}`} style={{ width: `${(s.statusCodes[p.key] / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {parts.map(p => (
          <div key={p.key} className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label}</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{num(s.statusCodes[p.key] || 0)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
        {[
          { label: 'Avg. response', value: `${num(s.speed.avgMs)} ms` },
          { label: '90% of pages under', value: `${num(s.speed.p90Ms)} ms` },
          { label: 'Not indexable', value: num(s.pages - s.indexablePages) },
          { label: 'Not linked internally', value: num(s.depth['Not linked'] || 0) },
        ].map(k => (
          <div key={k.label}><p className="text-xs text-slate-500">{k.label}</p><p className="text-lg font-semibold tabular-nums text-slate-900">{k.value}</p></div>
        ))}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------- issues

const IssueRow: React.FC<{ runId: number; c: CheckCount; check: Check; onOpenPage: (id: number) => void; initiallyOpen?: boolean }> = ({ runId, c, check, onOpenPage, initiallyOpen }) => {
  const [open, setOpen] = React.useState(!!initiallyOpen);
  const [rows, setRows] = React.useState<PageRow[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const fixed = c.pages === 0 && (c.previous || 0) > 0;

  const load = React.useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await adminApi.getSiteAuditPages(runId, { code: c.code, page: p, size: 20 });
      setRows(list => (p === 0 ? res.data.content : [...(list || []), ...res.data.content]));
      setTotal(res.data.totalElements);
      setPage(p);
    } catch { setRows(r => r || []); }
    finally { setLoading(false); }
  }, [runId, c.code]);

  React.useEffect(() => { if (open && rows === null && c.pages > 0) load(0); }, [open, rows, load, c.pages]);

  return (
    <li className={`rounded-2xl bg-white ring-1 transition ${open ? 'ring-slate-300 shadow-sm' : 'ring-slate-200'}`}>
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <SevBadge severity={check.severity} compact />
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-semibold ${fixed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{check.title}</span>
          <span className="block text-xs text-slate-500">{check.categoryLabel}</span>
        </span>
        {fixed ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Fixed</span>
          : <Delta now={c.pages} before={c.previous} goodWhenDown />}
        <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900">{num(c.pages)}<span className="block text-[10px] font-normal text-slate-400">{c.pages === 1 ? 'page' : 'pages'}</span></span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Why it matters</p><p className="mt-1 text-sm text-slate-700">{check.why}</p></div>
                <div className="rounded-xl bg-emerald-50/60 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">How to fix</p><p className="mt-1 text-sm text-slate-700">{check.fix}</p></div>
              </div>
              {c.pages > 0 && (
                rows === null ? <div className="space-y-1.5">{[0, 1, 2].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div> : (
                  <>
                    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
                      {rows.map(r => (
                        <li key={r.id}>
                          <button onClick={() => onOpenPage(r.id)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
                            <span className={`mt-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ring-1 ring-inset ${statusTone(r.status, r.robotsBlocked)}`}>{statusLabel(r)}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-slate-900">{shortUrl(r.url)}</span>
                              {r.focusDetail && <span className="mt-0.5 block whitespace-pre-line break-words font-mono text-[11px] leading-relaxed text-slate-500">{r.focusDetail}</span>}
                            </span>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    {rows.length < total && (
                      <button onClick={() => load(page + 1)} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#007ac2] ring-1 ring-slate-200 hover:bg-slate-50">
                        {loading ? <Spinner /> : null}Show more ({num(total - rows.length)} left)
                      </button>
                    )}
                  </>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const IssuesPanel: React.FC<{ run: Run; checks: Record<string, Check>; category: string | null; setCategory: (c: string | null) => void; onOpenPage: (id: number) => void }> = ({ run, checks, category, setCategory, onOpenPage }) => {
  const [sev, setSev] = React.useState<'ALL' | Severity>('ALL');
  const [showFixed, setShowFixed] = React.useState(false);
  const s = run.summary!;
  const all = s.checks.filter(c => checks[c.code]);
  const visible = all.filter(c => (sev === 'ALL' || checks[c.code].severity === sev) && (!category || checks[c.code].category === category) && (showFixed || c.pages > 0));
  const fixedCount = all.filter(c => c.pages === 0 && (c.previous || 0) > 0).length;
  const count = (k: Severity) => all.filter(c => checks[c.code].severity === k && c.pages > 0 && (!category || checks[c.code].category === category)).length;
  const catLabel = category ? s.categories.find(c => c.key === category)?.label : null;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {(['ALL', 'ERROR', 'WARNING', 'NOTICE'] as const).map(k => (
            <button key={k} onClick={() => setSev(k)} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 transition ${sev === k ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'}`}>
              {k !== 'ALL' && <span className={`h-2 w-2 rounded-full ${SEV[k].dot}`} />}
              {k === 'ALL' ? 'All issues' : SEV[k].plural}
              <span className={sev === k ? 'text-white/70' : 'text-slate-400'}>{k === 'ALL' ? count('ERROR') + count('WARNING') + count('NOTICE') : count(k)}</span>
            </button>
          ))}
          {catLabel && (
            <button onClick={() => setCategory(null)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#007ac2]/10 px-3.5 text-sm font-semibold text-[#007ac2]">{catLabel} <XCircle className="h-4 w-4" /></button>
          )}
        </div>
        {fixedCount > 0 && <Toggle checked={showFixed} onChange={setShowFixed} label={`Show ${fixedCount} fixed`} />}
      </div>
      {visible.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-slate-200">
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-semibold text-slate-900">Nothing to fix here</p>
          <p className="text-sm text-slate-500">No issues match this filter.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((c, i) => <IssueRow key={`${run.id}-${c.code}`} runId={run.id} c={c} check={checks[c.code]} onOpenPage={onOpenPage} initiallyOpen={i === 0 && sev !== 'ALL'} />)}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- pages explorer

const PagesPanel: React.FC<{ runId: number; onOpenPage: (id: number) => void }> = ({ runId, onOpenPage }) => {
  const [q, setQ] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [indexable, setIndexable] = React.useState<'' | 'true' | 'false'>('');
  const [sort, setSort] = React.useState('issues');
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState<{ content: PageRow[]; totalElements: number; totalPages: number } | null>(null);
  React.useEffect(() => { const t = window.setTimeout(() => setDebounced(q), 300); return () => window.clearTimeout(t); }, [q]);
  React.useEffect(() => { setPage(0); }, [debounced, status, indexable, sort]);
  React.useEffect(() => {
    let live = true;
    setData(d => d && { ...d });
    adminApi.getSiteAuditPages(runId, { q: debounced || undefined, status: status || undefined, indexable: indexable || undefined, sort, page, size: 50 })
      .then(r => live && setData(r.data)).catch(() => live && setData({ content: [], totalElements: 0, totalPages: 0 }));
    return () => { live = false; };
  }, [runId, debounced, status, indexable, sort, page]);
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search URL or title" className={`${inputCls} pl-10`} />
        </label>
        <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
          <option value="">All statuses</option><option value="errors">Pages with errors</option><option value="2xx">200 OK</option>
          <option value="3xx">Redirects</option><option value="4xx">4xx</option><option value="5xx">5xx</option><option value="failed">Failed</option><option value="blocked">Blocked</option>
        </select>
        <select value={indexable} onChange={e => setIndexable(e.target.value as any)} className={inputCls}>
          <option value="">Indexable or not</option><option value="true">Indexable</option><option value="false">Not indexable</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className={inputCls}>
          <option value="issues">Most issues first</option><option value="slow">Slowest first</option><option value="words">Fewest words first</option>
          <option value="inlinks">Fewest internal links first</option><option value="url">URL A–Z</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {!data ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div> :
          data.content.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-500">No pages match.</p> : (
            <>
              <table className="hidden w-full text-sm lg:table">
                <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="py-3 pl-5 pr-2">Page</th><th className="px-2">Status</th><th className="px-2 text-right">Words</th><th className="px-2 text-right">Inlinks</th>
                  <th className="px-2 text-right">Time</th><th className="px-2">Issues</th><th className="w-6" />
                </tr></thead>
                <tbody>
                  {data.content.map(p => (
                    <tr key={p.id} onClick={() => onOpenPage(p.id)} className="group cursor-pointer border-t border-slate-100 hover:bg-sky-50/40">
                      <td className="max-w-0 py-3 pl-5 pr-2">
                        <p className="truncate font-medium text-slate-900">{shortUrl(p.url)}</p>
                        <p className="truncate text-xs text-slate-500">{p.title || <span className="italic">No title</span>}</p>
                      </td>
                      <td className="px-2">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ring-1 ring-inset ${statusTone(p.status, p.robotsBlocked)}`}>{statusLabel(p)}</span>
                          {p.status >= 200 && p.status < 300 && !p.indexable && <span className="text-[10px] font-semibold uppercase text-slate-400">Not indexable</span>}
                        </div>
                      </td>
                      <td className="px-2 text-right tabular-nums text-slate-700">{p.wordCount ?? '—'}</td>
                      <td className="px-2 text-right tabular-nums text-slate-700">{p.inlinks ?? '—'}</td>
                      <td className="px-2 text-right tabular-nums text-slate-700">{p.millis != null ? `${p.millis} ms` : '—'}</td>
                      <td className="px-2">
                        <div className="flex gap-1">
                          {p.errors > 0 && <span className="rounded-full bg-rose-50 px-1.5 text-[11px] font-semibold text-rose-700">{p.errors}</span>}
                          {p.warnings > 0 && <span className="rounded-full bg-amber-50 px-1.5 text-[11px] font-semibold text-amber-800">{p.warnings}</span>}
                          {p.notices > 0 && <span className="rounded-full bg-sky-50 px-1.5 text-[11px] font-semibold text-sky-800">{p.notices}</span>}
                          {p.errors + p.warnings + p.notices === 0 && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        </div>
                      </td>
                      <td className="pr-4"><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-slate-100 lg:hidden">
                {data.content.map(p => (
                  <li key={p.id}>
                    <button onClick={() => onOpenPage(p.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                      <span className={`mt-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ring-1 ring-inset ${statusTone(p.status, p.robotsBlocked)}`}>{statusLabel(p)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{shortUrl(p.url)}</span>
                        <span className="block truncate text-xs text-slate-500">{p.title || 'No title'}</span>
                        <span className="mt-1 flex gap-1.5 text-[11px]">
                          {p.errors > 0 && <span className="text-rose-700">{p.errors} errors</span>}
                          {p.warnings > 0 && <span className="text-amber-800">{p.warnings} warnings</span>}
                          {p.notices > 0 && <span className="text-sky-800">{p.notices} notices</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
                <span>{num(data.totalElements)} pages</span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-9 rounded-xl px-3 font-semibold ring-1 ring-slate-200 disabled:opacity-40">Previous</button>
                  <button disabled={page + 1 >= data.totalPages} onClick={() => setPage(p => p + 1)} className="h-9 rounded-xl px-3 font-semibold ring-1 ring-slate-200 disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- page detail

const SerpPreview: React.FC<{ p: PageRow }> = ({ p }) => {
  let host = '', crumbs = '';
  try { const u = new URL(p.url); host = u.host; crumbs = decodeURIComponent(u.pathname).split('/').filter(Boolean).join(' › '); } catch { /* ignore */ }
  const title = p.title || 'No title';
  const desc = p.description || 'No meta description — Google will pick text from the page.';
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Google preview</p>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-[#007ac2]">H</span>
        <div className="min-w-0 leading-tight"><p className="text-sm text-slate-800">Hogicar</p><p className="truncate text-xs text-slate-500">{host}{crumbs ? ` › ${crumbs}` : ''}</p></div>
      </div>
      <p className="mt-1.5 line-clamp-1 text-[19px] leading-snug text-[#1a0dab]">{title.length > 62 ? `${title.slice(0, 60)}…` : title}</p>
      <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{desc.length > 162 ? `${desc.slice(0, 158)}…` : desc}</p>
      <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
        <span className={(p.title?.length || 0) > 60 || (p.title?.length || 0) < 30 ? 'text-amber-700' : ''}>Title {p.title?.length || 0}/60</span>
        <span className={(p.description?.length || 0) > 160 || (p.description?.length || 0) < 70 ? 'text-amber-700' : ''}>Description {p.description?.length || 0}/160</span>
      </div>
    </div>
  );
};

const PageDrawer: React.FC<{ runId: number; pageId: number; checks: Record<string, Check>; onClose: () => void; notify: (t: string) => void }> = ({ runId, pageId, checks, onClose, notify }) => {
  const [p, setP] = React.useState<PageRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    adminApi.getSiteAuditPage(runId, pageId).then(r => setP(r.data)).catch(e => setError(errorOf(e, 'Could not load this page.')));
  }, [runId, pageId]);
  const d = p?.detail || {};
  const grouped = (['ERROR', 'WARNING', 'NOTICE'] as Severity[]).map(sev => ({ sev, items: (p?.issues || []).filter(i => checks[i.code]?.severity === sev) })).filter(g => g.items.length);
  return (
    <Drawer eyebrow="Page report" title={p ? shortUrl(p.url) : 'Loading…'} onClose={onClose} width="max-w-[720px]"
      headerExtra={p && (
        <div className="-mt-2 flex flex-wrap items-center gap-2 pb-3">
          <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ring-1 ring-inset ${statusTone(p.status, p.robotsBlocked)}`}>{statusLabel(p)}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.indexable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{p.indexable ? 'Indexable' : 'Not indexable'}</span>
          {p.inSitemap && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">In sitemap</span>}
          <a href={p.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2]">Open page <ExternalLink className="h-3.5 w-3.5" /></a>
          <CopyButton text={p.url} label="Copy URL" className="h-7 px-2 text-xs text-slate-600 ring-1 ring-slate-200" onCopied={() => notify('URL copied')} />
        </div>
      )}>
      {error ? <ErrorBanner text={error} onRetry={onClose} /> : !p ? <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div> : (
        <div className="space-y-4">
          {p.status >= 200 && p.status < 300 && <SerpPreview p={p} />}
          {grouped.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"><CheckCircle className="h-5 w-5" />No issues on this page.</div>
          ) : grouped.map(g => (
            <div key={g.sev} className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${SEV[g.sev].text}`}>{g.items.length} {g.items.length === 1 ? SEV[g.sev].label.toLowerCase() : SEV[g.sev].plural.toLowerCase()}</p>
              {g.items.map((i, idx) => {
                const c = checks[i.code];
                return (
                  <details key={`${i.code}-${idx}`} className={`group rounded-2xl ring-1 ${SEV[g.sev].ring} ${SEV[g.sev].soft}`}>
                    <summary className="flex cursor-pointer list-none items-start gap-2.5 p-3.5">
                      {React.createElement(SEV[g.sev].Icon, { className: `mt-0.5 h-4 w-4 shrink-0 ${SEV[g.sev].text}` })}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{c?.title || i.code}</span>
                        {i.detail && <span className="mt-0.5 block whitespace-pre-line break-words font-mono text-[11px] text-slate-600">{i.detail}</span>}
                      </span>
                      <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    {c && <div className="space-y-1.5 border-t border-white/60 px-3.5 pb-3.5 pt-2.5 text-sm text-slate-700"><p>{c.why}</p><p className="flex gap-1.5 font-medium text-slate-900"><Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" />{c.fix}</p></div>}
                  </details>
                );
              })}
            </div>
          ))}
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Page facts</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              {[
                ['Response time', p.millis != null ? `${p.millis} ms` : '—'], ['HTML size', p.bytes ? `${Math.round(p.bytes / 1024)} KB` : '—'],
                ['Words', p.wordCount ?? '—'], ['Clicks from home', p.depth ?? 'Not linked'], ['Internal links in', p.inlinks ?? 0], ['Internal links out', p.outlinks ?? 0],
                ['Language', p.lang || '—'], ['Images', d.images ?? 0], ['External links', d.externalLinks ?? 0],
              ].map(([k, v]) => <div key={String(k)}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-semibold tabular-nums text-slate-900">{String(v)}</dd></div>)}
            </dl>
          </div>
          <div className="space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">What Google sees</p>
            {[
              ['H1', (d.h1 || []).join(' | ') || '—'],
              ['Canonical', p.canonical || '—'],
              ['Robots', [d.metaRobots, d.xRobotsTag].filter(Boolean).join(' · ') || 'index, follow (default)'],
              ['Structured data', (d.schemaTypes || []).join(', ') || (d.schemaError ? `Invalid: ${d.schemaError}` : 'None')],
              ['Language versions', Object.entries(d.hreflang || {}).map(([k, v]) => `${k}: ${shortUrl(String(v))}`).join('  ·  ') || 'None'],
              ['Social preview', Object.keys(d.og || {}).length ? `${Object.keys(d.og).length}/4 Open Graph tags${d.twitterCard ? ', Twitter card' : ''}` : 'Missing'],
              ...(p.location ? [['Redirects to', p.location]] : []),
            ].map(([k, v]) => (
              <div key={String(k)} className="grid grid-cols-[120px_1fr] gap-3 border-t border-slate-100 pt-2 first-of-type:border-0">
                <dt className="text-xs text-slate-500">{k}</dt><dd className="break-words text-slate-800">{String(v)}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
};

// ---------------------------------------------------------------- settings & history

const SettingsDrawer: React.FC<{ onClose: () => void; onSaved: (s: Settings) => void }> = ({ onClose, onSaved }) => {
  const [s, setS] = React.useState<Settings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { adminApi.getSiteAuditSettings().then(r => setS(r.data)).catch(e => setError(errorOf(e, 'Could not load settings.'))); }, []);
  const save = async () => {
    if (!s) return;
    setSaving(true); setError(null);
    try { onSaved((await adminApi.saveSiteAuditSettings(s)).data); } catch (e) { setError(errorOf(e, 'Could not save settings.')); } finally { setSaving(false); }
  };
  return (
    <Drawer eyebrow="SEO audit" title="Audit settings" onClose={onClose} busy={saving} width="max-w-[520px]"
      footer={<>
        {error && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="h-11 flex-1 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Cancel</button>
          <button onClick={save} disabled={!s || saving} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#007ac2] text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-60">{saving && <Spinner light />}Save settings</button>
        </div>
      </>}>
      {!s ? <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /> : (
        <div className="space-y-4">
          <Field label="Website to audit" hint="The crawl starts at this address and stays on the same host."><input className={inputCls} value={s.startUrl} onChange={e => setS({ ...s, startUrl: e.target.value })} /></Field>
          <Field label="Page limit" hint="Up to 5,000. Larger audits take longer (about 2–4 pages per second).">
            <input inputMode="numeric" className={inputCls} value={s.maxPages} onChange={e => setS({ ...s, maxPages: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </Field>
          <Toggle checked={s.weeklyEnabled} onChange={v => setS({ ...s, weeklyEnabled: v })} label="Run automatically every week" hint="Monday early morning, so you always see fresh results and new problems." />
        </div>
      )}
    </Drawer>
  );
};

const HistoryPanel: React.FC<{ runs: Run[]; current?: number; onPick: (id: number) => void }> = ({ runs, current, onPick }) => (
  <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
    {runs.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-500">No audits yet.</p> : (
      <ul className="divide-y divide-slate-100">
        {runs.map(r => {
          const tone = r.healthScore != null ? scoreTone(r.healthScore) : null;
          return (
            <li key={r.id}>
              <button onClick={() => r.status === 'COMPLETED' && onPick(r.id)} className={`flex w-full items-center gap-4 px-5 py-3.5 text-left ${r.status === 'COMPLETED' ? 'hover:bg-slate-50' : 'cursor-default'} ${current === r.id ? 'bg-sky-50/60' : ''}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tabular-nums ${tone ? tone.soft : 'bg-slate-100 text-slate-500'}`}>{r.healthScore ?? '—'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{fmtWhen(r.finishedAt || r.createdAt)}{current === r.id && <span className="ml-2 text-xs font-normal text-[#007ac2]">viewing</span>}</span>
                  <span className="block text-xs text-slate-500">
                    {r.status === 'COMPLETED' ? `${num(r.pagesCrawled || 0)} pages · ${r.errors ?? 0} errors · ${r.warnings ?? 0} warnings` : r.status === 'FAILED' ? (r.errorMessage || 'Failed') : r.status.toLowerCase()}
                    {r.triggeredBy === 'SCHEDULED' ? ' · weekly' : ''}{duration(r.startedAt, r.finishedAt) ? ` · ${duration(r.startedAt, r.finishedAt)}` : ''}
                  </span>
                </span>
                {r.status === 'COMPLETED' && <ChevronRight className="h-4 w-4 text-slate-300" />}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

// ---------------------------------------------------------------- page

type Tab = 'overview' | 'issues' | 'pages' | 'history' | 'records';

const SiteAudit: React.FC = () => {
  const [checks, setChecks] = React.useState<Record<string, Check>>({});
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [run, setRun] = React.useState<Run | null>(null);
  const [active, setActive] = React.useState<Run | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>('overview');
  const [category, setCategory] = React.useState<string | null>(null);
  const [pageId, setPageId] = React.useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const { toast, notify } = useToast();

  const loadRun = React.useCallback(async (id: number) => {
    const r = (await adminApi.getSiteAuditRun(id)).data as Run;
    setRun(r);
    return r;
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const [c, list] = await Promise.all([adminApi.getSiteAuditChecks(), adminApi.getSiteAuditRuns()]);
      setChecks(Object.fromEntries((c.data as Check[]).map(x => [x.code, x])));
      const all = (list.data || []) as Run[];
      setRuns(all);
      const running = all.find(r => r.status === 'RUNNING' || r.status === 'QUEUED') || null;
      setActive(running);
      const done = all.find(r => r.status === 'COMPLETED');
      if (done) await loadRun(done.id); else setRun(null);
    } catch (e) {
      setLoadError(errorOf(e, 'Could not load the SEO audit.'));
    } finally { setLoading(false); }
  }, [loadRun]);
  React.useEffect(() => { load(); }, [load]);

  // Live progress while an audit runs
  React.useEffect(() => {
    if (!active) return;
    const t = window.setInterval(async () => {
      try {
        const r = (await adminApi.getSiteAuditRun(active.id)).data as Run;
        if (r.status === 'RUNNING' || r.status === 'QUEUED') { setActive(r); return; }
        setActive(null);
        if (r.status === 'COMPLETED') { notify(`Audit finished: health score ${r.healthScore}`); setTab('overview'); }
        else if (r.status === 'FAILED') notify(r.errorMessage || 'The audit failed', 'err');
        load();
      } catch { /* keep polling */ }
    }, 2000);
    return () => window.clearInterval(t);
  }, [active, load, notify]);

  const start = async () => {
    setStarting(true);
    try {
      const r = (await adminApi.startSiteAudit({})).data as Run;
      setActive(r);
      setRuns(list => [r, ...list]);
      notify('Audit started');
    } catch (e) { notify(errorOf(e, 'Could not start the audit.'), 'err'); }
    finally { setStarting(false); }
  };

  const cancel = async () => {
    if (!active) return;
    try { await adminApi.cancelSiteAudit(active.id); notify('Stopping the audit…'); } catch (e) { notify(errorOf(e, 'Could not stop the audit.'), 'err'); }
  };

  const exportCsv = async () => {
    if (!run) return;
    try {
      const res = await adminApi.exportSiteAudit(run.id);
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = `hogicar-seo-audit-${run.id}.csv`; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { notify(errorOf(e, 'Could not export the audit.'), 'err'); }
  };

  const s = run?.summary || null;
  const latestDone = runs.find(r => r.status === 'COMPLETED');
  const viewingOld = run && latestDone && run.id !== latestDone.id;
  const topIssues = s ? s.checks.filter(c => c.pages > 0 && checks[c.code] && checks[c.code].severity !== 'NOTICE').slice(0, 5) : [];

  return (
    <div className="space-y-5">
      <Hero eyebrow="SEO" eyebrowIcon={Activity} title="SEO audit"
        subtitle="Crawls hogicar.com the way Google does — robots.txt, sitemaps and every internal link — and checks each page against 60 SEO rules."
        loading={loading}
        actions={<>
          <button onClick={() => setSettingsOpen(true)} className={heroButton} aria-label="Settings"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Settings</span></button>
          {run && <button onClick={exportCsv} className={heroButton}><Download className="h-4 w-4" /><span className="hidden sm:inline">Export CSV</span></button>}
          <button onClick={start} disabled={!!active || starting} className={`${heroPrimary} disabled:opacity-60`}>{starting || active ? <Spinner /> : <Play className="h-4 w-4" />}{active ? 'Audit running' : 'Run audit'}</button>
        </>}
        kpis={[
          { label: 'Health score', value: s ? `${s.healthScore}` : '—', Icon: Gauge, note: s?.previousHealthScore != null ? `${s.healthScore >= s.previousHealthScore ? '+' : ''}${s.healthScore - s.previousHealthScore} since last audit` : undefined },
          { label: 'Pages crawled', value: s ? num(s.pages) : '—', Icon: Globe, note: s ? `${num(s.indexablePages)} indexable` : undefined },
          { label: 'Errors', value: s ? num(s.errors) : '—', Icon: XCircle, note: s ? `on ${num(s.pagesWithErrors)} ${s.pagesWithErrors === 1 ? 'page' : 'pages'}` : undefined },
          { label: 'Last audit', value: run ? ago(run.finishedAt) : 'Never', Icon: Clock, note: run ? fmtWhen(run.finishedAt) : undefined },
        ]} />

      {loadError && <ErrorBanner text={loadError} onRetry={load} />}

      {active && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#007ac2]/30 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Activity className="h-5 w-5" /><span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-[#007ac2]/60" /></span>
              <div>
                <p className="font-semibold text-slate-900">{active.phase || 'Starting'}…</p>
                <p className="text-sm text-slate-500">{num(active.pagesCrawled || 0)} of ~{num(Math.max(active.pagesDiscovered || 0, active.pagesCrawled || 0))} pages · limit {num(active.maxPages)}</p>
              </div>
            </div>
            <button onClick={cancel} className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Square className="h-3.5 w-3.5" /> Stop</button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div className="h-full rounded-full bg-[#007ac2]" animate={{ width: `${Math.max(3, active.progress || 0)}%` }} transition={{ duration: 0.6 }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">You can leave this page — the audit keeps running on the server.</p>
        </motion.section>
      )}

      {!loading && !run && !active && !loadError && (
        <section className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Activity className="h-8 w-8" /></span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Run your first SEO audit</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">We'll crawl your live site, check every page for the problems that stop Google from ranking it, and tell you exactly how to fix each one.</p>
          <button onClick={start} disabled={starting} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f]">{starting ? <Spinner light /> : <Play className="h-4 w-4" />} Run audit</button>
        </section>
      )}

      {(run || tab === 'records') && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented layoutId="audit-tab" value={tab} onChange={setTab} items={[
              { key: 'overview', label: 'Overview' },
              { key: 'issues', label: 'Issues', count: s ? s.checks.filter(c => c.pages > 0).length : undefined },
              { key: 'pages', label: 'Pages', count: s?.pages },
              { key: 'history', label: 'History', count: runs.filter(r => r.status === 'COMPLETED').length },
              { key: 'records', label: 'Page records' },
            ]} />
            {viewingOld && tab !== 'records' && (
              <button onClick={() => latestDone && loadRun(latestDone.id)} className="inline-flex h-9 items-center gap-2 self-start rounded-full bg-amber-50 px-3 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                Viewing the audit from {fmtWhen(run!.finishedAt)} · Back to latest
              </button>
            )}
          </div>

          {tab === 'overview' && s && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <Card>
                  <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
                    <ScoreRing score={s.healthScore} />
                    <div className="w-full flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">Site health</p>
                        <Delta now={s.healthScore} before={s.previousHealthScore} />
                      </div>
                      <p className="text-xs text-slate-500">{num(s.pages - s.pagesWithErrors)} of {num(s.pages)} pages have no errors.</p>
                      {(['ERROR', 'WARNING', 'NOTICE'] as Severity[]).map(k => (
                        <button key={k} onClick={() => { setTab('issues'); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 ring-1 ring-inset ${SEV[k].soft} ${SEV[k].ring}`}>
                          <span className={`flex items-center gap-2 text-sm font-semibold ${SEV[k].text}`}>{React.createElement(SEV[k].Icon, { className: 'h-4 w-4' })}{SEV[k].plural}</span>
                          <span className="text-sm font-semibold tabular-nums text-slate-900">{num(k === 'ERROR' ? s.errors : k === 'WARNING' ? s.warnings : s.notices)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card title="Fix these first" subtitle="The problems affecting the most pages, errors before warnings."
                  action={<button onClick={() => setTab('issues')} className="shrink-0 text-sm font-semibold text-[#007ac2]">All issues</button>}>
                  {topIssues.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle className="h-5 w-5" />No errors or warnings. Great work.</div>
                  ) : (
                    <ul className="space-y-2">
                      {topIssues.map(c => (
                        <li key={c.code}>
                          <button onClick={() => { setCategory(null); setTab('issues'); }} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50/70 px-3.5 py-3 text-left ring-1 ring-slate-200 hover:bg-white">
                            <SevBadge severity={checks[c.code].severity} compact />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{checks[c.code].title}</span>
                            <Delta now={c.pages} before={c.previous} goodWhenDown />
                            <span className="text-sm font-semibold tabular-nums text-slate-900">{num(c.pages)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.truncated && <p className="mt-3 flex items-start gap-2 text-xs text-slate-500"><Info className="mt-px h-3.5 w-3.5 shrink-0" />The crawl reached its page limit. Raise it in Settings to audit every page.</p>}
                </Card>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <SiteChecks items={s.siteChecks || []} />
                <div className="space-y-5">
                  <TrendCard runs={runs} onPick={id => loadRun(id)} />
                  <Breakdown s={s} />
                </div>
              </div>
              <CategoryGrid categories={s.categories} active={category} onPick={k => { setCategory(k); if (k) setTab('issues'); }} />
              <div className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007ac2]" />
                <p>Audited <span className="font-semibold text-slate-900">{run?.startUrl}</span> {run?.finishedAt ? `on ${fmtWhen(run.finishedAt)}` : ''}{duration(run?.startedAt, run?.finishedAt) ? ` in ${duration(run?.startedAt, run?.finishedAt)}` : ''}. Fix issues in Website → SEO or the page's content, then run the audit again to confirm.</p>
              </div>
            </div>
          )}

          {tab === 'issues' && run && s && <IssuesPanel run={run} checks={checks} category={category} setCategory={setCategory} onOpenPage={setPageId} />}
          {tab === 'pages' && run && <PagesPanel runId={run.id} onOpenPage={setPageId} />}
          {tab === 'history' && <HistoryPanel runs={runs} current={run?.id} onPick={id => { loadRun(id); setTab('overview'); }} />}
          {tab === 'records' && (
            <div className="space-y-3">
              <p className="flex items-start gap-2 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200"><Database className="mt-0.5 h-4 w-4 shrink-0 text-[#007ac2]" />Checks the SEO records stored for each landing page (titles, descriptions, keywords, locations) and offers automatic fixes. The audit above checks what Google actually receives.</p>
              <SeoAuditManagement />
            </div>
          )}
        </>
      )}

      {!run && !loading && tab !== 'records' && (
        <button onClick={() => setTab('records')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#007ac2]"><FileText className="h-4 w-4" /> Open page records audit</button>
      )}

      <AnimatePresence>
        {pageId != null && run && <PageDrawer key={`p-${pageId}`} runId={run.id} pageId={pageId} checks={checks} onClose={() => setPageId(null)} notify={t => notify(t)} />}
        {settingsOpen && <SettingsDrawer key="settings" onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); notify('Settings saved'); }} />}
      </AnimatePresence>
      <Toast toast={toast} />
      {loading && !run && <div className="grid gap-5 lg:grid-cols-2">{[0, 1].map(i => <div key={i} className="h-64 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />)}</div>}
    </div>
  );
};

export default SiteAudit;
