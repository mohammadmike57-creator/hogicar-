import * as React from 'react';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import History from 'lucide-react/dist/esm/icons/history';
import Search from 'lucide-react/dist/esm/icons/search';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { affiliateNetworksApi as api, apiError, type LogEntry, type AuditEntry, LOG_TYPES, type LogLevel } from '../../affiliateNetworksApi';
import { ErrorBanner, Segmented } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Badge, EmptyState, FilterBar, FilterField, JsonView, LevelBadge, Pagination, Select, SkeletonRows, dateTime, filterCls, humanize,
} from './ui';

const PAGE = 100;

const LogRow: React.FC<{ l: LogEntry; onBooking: (ref: string) => void }> = ({ l, onBooking }) => {
  const [open, setOpen] = React.useState(false);
  const hasDetail = l.detail !== null && l.detail !== undefined && !(typeof l.detail === 'object' && !Object.keys(l.detail as object).length);
  return (
    <li className={`border-t border-slate-100 first:border-0 ${l.level === 'ERROR' ? 'bg-rose-50/30' : ''}`}>
      <button type="button" onClick={() => hasDetail && setOpen(o => !o)} className={`flex w-full items-start gap-3 px-4 py-3 text-left sm:px-5 ${hasDetail ? 'hover:bg-slate-50' : 'cursor-default'}`} aria-expanded={open}>
        <span className="w-14 shrink-0 pt-0.5"><LevelBadge level={l.level} /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[11px] font-semibold text-slate-700">{l.type}</span>
            {l.networkName && <Badge tone="grey">{l.networkName}</Badge>}
            {l.bookingRef && <span role="link" tabIndex={0} onClick={e => { e.stopPropagation(); onBooking(l.bookingRef!); }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onBooking(l.bookingRef!); } }} className="font-mono text-[11px] font-semibold text-[#007ac2] hover:underline">{l.bookingRef}</span>}
          </span>
          <span className="mt-0.5 block break-words text-sm text-slate-800">{l.message}</span>
        </span>
        <span className="hidden shrink-0 text-right text-xs text-slate-400 sm:block">{dateTime(l.createdAt)}</span>
        {hasDetail && <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />}
      </button>
      <p className="-mt-2 px-4 pb-2 pl-[5.25rem] text-[11px] text-slate-400 sm:hidden">{dateTime(l.createdAt)}</p>
      {open && hasDetail && <div className="px-4 pb-4 sm:pl-[5.75rem] sm:pr-5"><JsonView value={l.detail} maxHeight="max-h-80" /></div>}
    </li>
  );
};

const LogsView: React.FC = () => {
  const { networks, params, goTo } = useAffiliateNetworks();
  const [type, setType] = React.useState('');
  const [networkId, setNetworkId] = React.useState(params.networkId ? String(params.networkId) : '');
  const [bookingRef, setBookingRef] = React.useState(params.bookingRef || '');
  const [refQuery, setRefQuery] = React.useState(params.bookingRef || '');
  const [level, setLevel] = React.useState<'' | LogLevel>('');
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState<{ items: LogEntry[]; total: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { const t = window.setTimeout(() => { setRefQuery(bookingRef.trim()); setPage(0); }, 350); return () => window.clearTimeout(t); }, [bookingRef]);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await api.getLogs({ type: type || undefined, networkId: networkId || undefined, bookingRef: refQuery || undefined, page, size: PAGE }); setData({ items: r.items || [], total: r.total ?? (r.items || []).length }); }
    catch (e) { setError(apiError(e, 'Could not load logs.')); }
    finally { setLoading(false); }
  }, [type, networkId, refQuery, page]);
  React.useEffect(() => { load(); }, [load]);

  const items = (data?.items || []).filter(l => !level || l.level === level);
  const counts = { INFO: 0, WARN: 0, ERROR: 0 } as Record<LogLevel, number>;
  (data?.items || []).forEach(l => { counts[l.level] = (counts[l.level] || 0) + 1; });

  return (
    <div className="space-y-4">
      <FilterBar>
        <FilterField label="Type" className="col-span-2">
          <Select compact value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
            <option value="">All event types</option>
            {LOG_TYPES.map(t => <option key={t} value={t}>{humanize(t)}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Network">
          <Select compact value={networkId} onChange={e => { setNetworkId(e.target.value); setPage(0); }}>
            <option value="">All networks</option>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Booking ref">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${filterCls} pl-9 uppercase placeholder:normal-case`} value={bookingRef} onChange={e => setBookingRef(e.target.value.toUpperCase())} placeholder="H12345" /></div>
        </FilterField>
        <FilterField label="Level" className="col-span-2">
          <div className="flex h-10 items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(['', 'INFO', 'WARN', 'ERROR'] as const).map(l => (
              <button key={l || 'all'} onClick={() => setLevel(l)} className={`h-8 flex-1 rounded-lg text-xs font-semibold transition ${level === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {l || 'All'}{l && data ? <span className="ml-1 tabular-nums text-slate-400">{counts[l]}</span> : null}
              </button>
            ))}
          </div>
        </FilterField>
      </FilterBar>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {loading && !data ? <SkeletonRows rows={8} height="h-12" /> : !items.length ? (
        <EmptyState icon={ScrollText} title="No log entries" text="Attribution, conversion and configuration events appear here as they happen." />
      ) : (
        <div className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${loading ? 'opacity-60' : ''}`}>
          <ul>{items.map(l => <LogRow key={l.id} l={l} onBooking={ref => goTo('conversions', { bookingRef: ref })} />)}</ul>
          <Pagination page={page} size={PAGE} total={data?.total || 0} onPage={setPage} />
        </div>
      )}
    </div>
  );
};

const fmtVal = (v: unknown) => (v === null || v === undefined || v === '' ? '∅' : typeof v === 'object' ? JSON.stringify(v) : String(v));

const AuditView: React.FC = () => {
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState<{ items: AuditEntry[]; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    setError(null);
    try { const r = await api.getAudit({ page, size: PAGE }); setData({ items: r.items || [], total: r.total ?? (r.items || []).length }); }
    catch (e) { setError(apiError(e, 'Could not load the audit log.')); setData({ items: [], total: 0 }); }
  }, [page]);
  React.useEffect(() => { load(); }, [load]);
  if (error && !data?.items.length) return <ErrorBanner text={error} onRetry={load} />;
  if (!data) return <SkeletonRows rows={6} height="h-16" />;
  if (!data.items.length) return <EmptyState icon={History} title="No changes recorded" text="Every configuration change made in this section is recorded here with who made it." />;
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <ul>
        {data.items.map(a => (
          <li key={a.id} className="border-t border-slate-100 px-4 py-3.5 first:border-0 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold uppercase text-white">{(a.actor || '?').slice(0, 2)}</span>
              <span className="text-sm font-semibold text-slate-900">{a.actor}</span>
              <Badge tone="blue">{humanize(a.action)}</Badge>
              <span className="text-xs text-slate-500">{humanize(a.entityType)} #{a.entityId}</span>
              <span className="ml-auto text-xs text-slate-400">{dateTime(a.createdAt)}</span>
            </div>
            {!!a.changes?.length && (
              <ul className="mt-2 space-y-1 pl-9">
                {a.changes.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-mono font-semibold text-slate-700">{c.field}</span>
                    <span className="max-w-[40ch] truncate rounded bg-rose-50 px-1.5 py-0.5 font-mono text-rose-700 line-through decoration-rose-300">{fmtVal(c.old)}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="max-w-[40ch] truncate rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">{fmtVal(c.new)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <Pagination page={page} size={PAGE} total={data.total} onPage={setPage} />
    </div>
  );
};

const LogsTab: React.FC = () => {
  const [view, setView] = React.useState<'logs' | 'audit'>('logs');
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Logs</h3>
          <p className="text-sm text-slate-500">Technical events for every click and conversion, and an audit trail of admin changes.</p>
        </div>
        <Segmented layoutId="an-logs-view" value={view} onChange={setView} items={[{ key: 'logs', label: 'Event log' }, { key: 'audit', label: 'Audit log' }]} />
      </div>
      {view === 'logs' ? <LogsView /> : <AuditView />}
    </div>
  );
};

export default LogsTab;
