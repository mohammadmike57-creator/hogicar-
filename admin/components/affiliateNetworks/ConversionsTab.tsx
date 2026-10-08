import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Download from 'lucide-react/dist/esm/icons/download';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Search from 'lucide-react/dist/esm/icons/search';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import {
  affiliateNetworksApi as api, apiError, type Conversion, type ConversionFilters, CONVERSION_STATUSES,
} from '../../affiliateNetworksApi';
import { ErrorBanner, Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import ConversionDetailDrawer from './ConversionDetailDrawer';
import {
  ConversionStatusBadge, EmptyState, FilterBar, FilterField, Pagination, Select, SkeletonRows, TableCard, btnSecondary, daysAgo,
  downloadCsv, filterCls, humanize, isoDay, money, th, thRight, td, tdRight, Badge,
} from './ui';

const PAGE_SIZE = 50;
const shortDay = (d?: string | null) => {
  const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null;
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
};
const shortDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso : t.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const initialFilters = (bookingRef?: string, networkId?: number): ConversionFilters => ({
  from: bookingRef ? undefined : daysAgo(30), to: bookingRef ? undefined : isoDay(new Date()), bookingRef, networkId,
});

const CSV_HEADERS = ['Booking ref', 'Booking date', 'Network', 'Publisher ID', 'Publisher', 'Click ID', 'Campaign', 'Sub ID', 'Pick-up', 'Country', 'Pick-up date', 'Drop-off date',
  'Currency', 'Booking value', 'Commissionable value', 'Commission rate %', 'Commission', 'Network fee', 'Net revenue', 'Refund', 'Status', 'Booking status',
  'Client tag', 'Network reference', 'Attempts', 'Sent at', 'Last response code', 'Last error', 'Reconciled', 'Test'];
const csvRow = (c: Conversion) => [c.bookingRef, c.bookingDate, c.networkName, c.publisherId, c.publisherName, c.clickId, c.campaign, c.subId, c.pickupCode, c.country, c.pickupDate, c.dropoffDate,
  c.currency, c.bookingValue, c.commissionableValue, c.commissionRate, c.commissionAmount, c.networkFee, c.netRevenue, c.refundAmount, c.status, c.bookingStatus,
  c.clientStatus, c.networkReference, c.attempts, c.sentAt, c.lastResponseCode, c.lastError, c.reconciled ? 'yes' : 'no', c.testMode ? 'yes' : 'no'];

const ConversionsTab: React.FC = () => {
  const { networks, notify, params } = useAffiliateNetworks();
  const [filters, setFilters] = React.useState<ConversionFilters>(() => initialFilters(params.bookingRef, params.networkId));
  const [refText, setRefText] = React.useState(params.bookingRef || '');
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState<{ items: Conversion[]; total: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await api.getConversions({ ...filters, page, size: PAGE_SIZE });
      setData({ items: r.items || [], total: r.total ?? (r.items || []).length });
    } catch (e) { setError(apiError(e, 'Could not load conversions.')); }
    finally { setLoading(false); }
  }, [filters, page]);
  React.useEffect(() => { load(); }, [load]);

  // debounce booking-ref search
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const ref = refText.trim() || undefined;
      setFilters(f => (f.bookingRef === ref ? f : { ...f, bookingRef: ref }));
      setPage(p => (filtersRef.current.bookingRef === ref ? p : 0));
    }, 350);
    return () => window.clearTimeout(t);
  }, [refText]);

  const set = (p: Partial<ConversionFilters>) => { setFilters(f => ({ ...f, ...p })); setPage(0); };

  /** Exports every row that matches the current filters (fetched page by page, capped at 10 000). */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: Conversion[] = [];
      const size = 500;
      for (let p = 0; p < 20; p++) {
        const r = await api.getConversions({ ...filters, page: p, size });
        rows.push(...(r.items || []));
        if (!r.items?.length || rows.length >= (r.total ?? 0) || r.items.length < size) break;
      }
      downloadCsv(`affiliate-conversions-${filters.from || 'all'}-to-${filters.to || isoDay(new Date())}.csv`, CSV_HEADERS, rows.map(csvRow));
      notify(`Exported ${rows.length} conversion${rows.length === 1 ? '' : 's'}`);
    } catch (e) {
      if (data?.items.length) {
        downloadCsv(`affiliate-conversions-page-${page + 1}.csv`, CSV_HEADERS, data.items.map(csvRow));
        notify('Exported the rows on this page only', 'err');
      } else notify(apiError(e, 'Could not export conversions.'), 'err');
    } finally { setExporting(false); }
  };

  const currencies = Array.from(new Set(networks.flatMap(n => n.supportedCurrencies || []).concat(['JOD', 'USD', 'EUR', 'AED']))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Conversions</h3>
          <p className="text-sm text-slate-500">Every attributed booking and what was reported to the network.</p>
        </div>
        <button className={`${btnSecondary} h-11 shrink-0`} onClick={exportCsv} disabled={exporting || !data?.total}>{exporting ? <Spinner /> : <Download className="h-4 w-4" />} Export CSV</button>
      </div>

      <FilterBar actions={<button className={`${btnSecondary} h-9`} onClick={() => { setFilters(initialFilters()); setRefText(''); setPage(0); }}><RotateCcw className="h-4 w-4" /> Reset filters</button>}>
        <FilterField label="Booking ref" className="col-span-2 sm:col-span-1">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${filterCls} pl-9 uppercase placeholder:normal-case`} value={refText} onChange={e => setRefText(e.target.value.toUpperCase())} placeholder="H12345" /></div>
        </FilterField>
        <FilterField label="From"><input type="date" className={filterCls} value={filters.from || ''} onChange={e => set({ from: e.target.value || undefined })} /></FilterField>
        <FilterField label="To"><input type="date" className={filterCls} value={filters.to || ''} onChange={e => set({ to: e.target.value || undefined })} /></FilterField>
        <FilterField label="Network">
          <Select compact value={String(filters.networkId ?? '')} onChange={e => set({ networkId: e.target.value || undefined })}>
            <option value="">All networks</option>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select compact value={filters.status || ''} onChange={e => set({ status: e.target.value || undefined })}>
            <option value="">Any status</option>
            {CONVERSION_STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Currency">
          <Select compact value={filters.currency || ''} onChange={e => set({ currency: e.target.value || undefined })}>
            <option value="">All</option>
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Publisher ID"><input className={filterCls} value={filters.publisherId || ''} onChange={e => set({ publisherId: e.target.value.trim() || undefined })} placeholder="Any" /></FilterField>
        <FilterField label="Country"><input className={`${filterCls} uppercase placeholder:normal-case`} maxLength={2} value={filters.country || ''} onChange={e => set({ country: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') || undefined })} placeholder="Any" /></FilterField>
        <FilterField label="Location"><input className={`${filterCls} uppercase placeholder:normal-case`} maxLength={8} value={filters.location || ''} onChange={e => set({ location: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') || undefined })} placeholder="Any" /></FilterField>
      </FilterBar>

      {error && <ErrorBanner text={error} onRetry={load} />}

      {loading && !data ? <SkeletonRows rows={6} height="h-12" /> : !data?.items.length ? (
        <EmptyState icon={Receipt} title="No conversions found" text="Nothing matches these filters. Conversions appear when a booking is attributed to a network click." />
      ) : (
        <TableCard className={loading ? 'opacity-60 transition' : 'transition'} footer={<Pagination page={page} size={PAGE_SIZE} total={data.total} onPage={setPage} />}>
          <thead className="border-b border-slate-100"><tr>
            <th className={th}>Booking</th><th className={th}>Network</th><th className={th}>Publisher</th><th className={th}>Pick-up</th>
            <th className={thRight}>Value</th><th className={thRight}>Commission</th><th className={th}>Status</th><th className={th}>Booking</th><th className={th}>Created</th><th className="w-8" />
          </tr></thead>
          <tbody>
            {data.items.map(c => (
              <tr key={c.id} className="group cursor-pointer border-t border-slate-100 first:border-0 hover:bg-sky-50/40" onClick={() => setOpenId(c.id)}>
                <td className={td}>
                  <p className="font-mono font-semibold text-slate-900">{c.bookingRef}</p>
                  {c.testMode && <Badge tone="violet" className="mt-0.5"><FlaskConical className="h-3 w-3" />Test</Badge>}
                </td>
                <td className={td}>{c.networkName}</td>
                <td className={td}><p className="max-w-[150px] truncate">{c.publisherName || <span className="text-slate-400">Unknown</span>}</p>{c.publisherId && <p className="font-mono text-[11px] text-slate-400">{c.publisherId}</p>}</td>
                <td className={`${td} whitespace-nowrap`}><p className="font-mono">{c.pickupCode || '—'}</p><p className="text-[11px] text-slate-400">{shortDay(c.pickupDate)}</p></td>
                <td className={`${tdRight} font-semibold text-slate-900`}>{money(c.bookingValue, c.currency)}</td>
                <td className={tdRight}>{money(c.commissionAmount, c.currency)}<p className="text-[11px] text-slate-400">{c.commissionRate ? `${c.commissionRate}%` : ''}</p></td>
                <td className={td}><ConversionStatusBadge status={c.status} />{c.lastError ? <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-rose-600" title={c.lastError}>{c.lastError}</p> : c.attempts > 1 ? <p className="mt-0.5 text-[11px] text-slate-400">{c.attempts} attempts</p> : null}</td>
                <td className={`${td} text-xs`}>{humanize(c.bookingStatus)}</td>
                <td className={`${td} whitespace-nowrap text-xs text-slate-500`}>{shortDateTime(c.createdAt)}</td>
                <td className="pr-4 max-md:!hidden"><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" /></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      <AnimatePresence>
        {openId != null && <ConversionDetailDrawer key={`cd-${openId}`} id={openId} onClose={() => setOpenId(null)}
          onChanged={c => setData(d => (d ? { ...d, items: d.items.map(x => (x.id === c.id ? { ...x, ...c } : x)) } : d))} />}
      </AnimatePresence>
    </div>
  );
};

export default ConversionsTab;
