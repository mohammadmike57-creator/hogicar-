import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Network from 'lucide-react/dist/esm/icons/network';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Activity from 'lucide-react/dist/esm/icons/activity';
import ChartColumn from 'lucide-react/dist/esm/icons/chart-column';
import History from 'lucide-react/dist/esm/icons/history';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import RadioTower from 'lucide-react/dist/esm/icons/radio-tower';
import Search from 'lucide-react/dist/esm/icons/search';
import Info from 'lucide-react/dist/esm/icons/info';
import { useToast, Toast, ErrorBanner } from '../commercialUi';
import {
  Badge, Card, Callout, EmptyState, FilterBar, FilterField, Modal, SkeletonRows, TableCard, btnPrimary, btnSecondary,
  filterCls, filterSelectCls, inputCls, selectCls, td, tdRight, th, thRight,
} from '../affiliateNetworks/ui';
import { distributionApi, errorText, type Adapter, type Channel, type Meta, type Permission } from './api';
import { DistContext, StatusBadge, TrackBadge, daysAgo, fmtDateTime, fmtMoneyMap, humanize, isoDay, useDist } from './shared';
import ChannelDetail from './ChannelDetail';
import { MonitoringView, ReportsView, InventoryView, AuditRolesView } from './OperationsViews';

type Tab = 'overview' | 'channels' | 'inventory' | 'monitoring' | 'reports' | 'audit';

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { key: 'channels', label: 'Channel registry', Icon: Network },
  { key: 'inventory', label: 'Inventory', Icon: Boxes },
  { key: 'monitoring', label: 'Monitoring', Icon: Activity },
  { key: 'reports', label: 'Reports', Icon: ChartColumn },
  { key: 'audit', label: 'Audit & roles', Icon: History },
];

/** Distribution Network Management: every external channel, from first contact to production. */
const DistributionAdmin: React.FC = () => {
  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [metaError, setMetaError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>('overview');
  const [openChannel, setOpenChannel] = React.useState<number | null>(null);
  const { toast, notify } = useToast();

  const loadMeta = React.useCallback(() => {
    setMetaError(null);
    distributionApi.meta().then(setMeta).catch(e => setMetaError(errorText(e, 'Could not load distribution settings')));
  }, []);
  React.useEffect(loadMeta, [loadMeta]);

  const ctx = React.useMemo(() => ({
    meta,
    can: (p: Permission) => !!meta?.permissions?.includes(p),
    toast: (text: string, tone: 'ok' | 'err' = 'ok') => notify(text, tone),
  }), [meta, notify]);

  if (metaError) return <ErrorBanner text={metaError} onRetry={loadMeta} />;
  if (!meta) return <SkeletonRows rows={4} />;

  return (
    <DistContext.Provider value={ctx}>
      <div className="min-w-0 space-y-5">
        {openChannel ? (
          <ChannelDetail id={openChannel} onBack={() => setOpenChannel(null)} />
        ) : (
          <>
            <div className="min-w-0 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
              <div className="flex gap-1 [overflow-x:auto] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Distribution sections">
                {TABS.map(({ key, label, Icon }) => (
                  <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${tab === key ? 'bg-[#007ac2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>
            </div>
            {tab === 'overview' && <OverviewView onOpen={setOpenChannel} />}
            {tab === 'channels' && <ChannelsView onOpen={setOpenChannel} />}
            {tab === 'inventory' && <InventoryView />}
            {tab === 'monitoring' && <MonitoringView />}
            {tab === 'reports' && <ReportsView />}
            {tab === 'audit' && <AuditRolesView />}
          </>
        )}
      </div>
      <Toast toast={toast} />
    </DistContext.Provider>
  );
};

export default DistributionAdmin;

// ------------------------------------------------------------------ overview

const Kpi: React.FC<{ label: string; value: React.ReactNode; note?: string; tone?: 'default' | 'warn' | 'ok' }> = ({ label, value, note, tone = 'default' }) => (
  <div className={`min-w-0 rounded-2xl p-4 shadow-sm ring-1 ${tone === 'warn' ? 'bg-amber-50 ring-amber-200' : tone === 'ok' ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 truncate text-xl font-bold tabular-nums text-slate-900">{value ?? '—'}</p>
    {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
  </div>
);

const OverviewView: React.FC<{ onOpen: (id: number) => void }> = ({ onOpen }) => {
  const [filters, setFilters] = React.useState({ from: daysAgo(29), to: isoDay(new Date()), channelId: '', country: '', supplierId: '' });
  const [data, setData] = React.useState<any | null>(null);
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    distributionApi.overview(filters).then(setData).catch(e => setError(errorText(e))).finally(() => setLoading(false));
  }, [filters]);
  React.useEffect(load, [load]);
  React.useEffect(() => { distributionApi.channels().then(r => setChannels(r.map(x => x.channel))).catch(() => undefined); }, []);

  const s = data?.byStatus || {};
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <FilterBar actions={<button className={btnSecondary} onClick={load}><RefreshCw className="h-4 w-4" />Refresh</button>}>
        <FilterField label="From"><input type="date" className={filterCls} value={filters.from} onChange={set('from')} /></FilterField>
        <FilterField label="To"><input type="date" className={filterCls} value={filters.to} onChange={set('to')} /></FilterField>
        <FilterField label="Channel">
          <select className={filterSelectCls} value={filters.channelId} onChange={set('channelId')}>
            <option value="">All channels</option>
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FilterField>
        <FilterField label="Country (ISO)"><input className={filterCls} maxLength={2} placeholder="e.g. JO" value={filters.country} onChange={e => setFilters(f => ({ ...f, country: e.target.value.toUpperCase() }))} /></FilterField>
        <FilterField label="Supplier id"><input className={filterCls} inputMode="numeric" placeholder="Any" value={filters.supplierId} onChange={set('supplierId')} /></FilterField>
      </FilterBar>

      {error && <ErrorBanner text={error} onRetry={load} />}
      {loading && !data ? <SkeletonRows rows={3} /> : data && (
        <>
          {data.totalChannels === 0 ? (
            <EmptyState icon={RadioTower} title="No distribution channels yet"
              text="Register Skyscanner, KAYAK or any partner in the channel registry to start onboarding. Figures appear here as real activity is recorded." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                <Kpi label="Registered channels" value={data.totalChannels} />
                <Kpi label="Live in production" value={data.activeProduction} tone={data.activeProduction ? 'ok' : 'default'} />
                <Kpi label="Onboarding" value={(s.REGISTERED || 0) + (s.ONBOARDING || 0)} />
                <Kpi label="Awaiting documentation" value={s.AWAITING_DOCUMENTATION || 0} tone={s.AWAITING_DOCUMENTATION ? 'warn' : 'default'} />
                <Kpi label="Awaiting credentials" value={s.AWAITING_CREDENTIALS || 0} tone={s.AWAITING_CREDENTIALS ? 'warn' : 'default'} />
                <Kpi label="In development" value={s.IN_DEVELOPMENT || 0} />
                <Kpi label="Testing / review" value={(s.TESTING || 0) + (s.READY_FOR_REVIEW || 0)} />
                <Kpi label="Approved, not yet live" value={s.APPROVED_FOR_PRODUCTION || 0} />
                <Kpi label="Suspended / failed" value={(s.SUSPENDED || 0) + (s.FAILED || 0)} />
                <Kpi label="Live distribution locations" value={data.activeDistributionLocations} note="Locations with eligible cars on live channels" />
                <Kpi label="Deeplink clicks" value={data.deeplinkClicks} />
                <Kpi label="Attributed bookings" value={data.attributedBookings} />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Kpi label="API requests" value={data.api?.requests} />
                <Kpi label="API errors" value={data.api?.errors} note={data.api?.errorRatePercent != null ? `${data.api.errorRatePercent}% of requests` : undefined}
                  tone={data.api?.errors ? 'warn' : 'default'} />
                <Kpi label="Avg / p95 latency" value={data.api?.avgLatencyMs != null ? `${data.api.avgLatencyMs} / ${data.api.p95LatencyMs} ms` : '—'} note="Partner API requests" />
                <Kpi label="Cancellation rate" value={data.cancellationRatePercent != null ? `${data.cancellationRatePercent}%` : '—'} />
                <Kpi label="Booking failures" value={data.bookingFailures} />
                <Kpi label="Booking value" value={fmtMoneyMap(data.bookingValue)} note={`Est. commission ${fmtMoneyMap(data.estimatedCommission)}`} />
              </div>
              <Callout tone="info" icon={Info}>{data.revenueNote}</Callout>
              <TableCard>
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className={th}>Channel</th><th className={th}>Status</th><th className={thRight}>Eligible cars</th><th className={thRight}>Excluded</th>
                    <th className={thRight}>Locations</th><th className={thRight}>Category mapping</th><th className={thRight}>Validation errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.channels.map((c: any) => (
                    <tr key={c.channelId} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(c.channelId)}>
                      <td className={td}><p className="font-semibold text-slate-900">{c.name}</p><p className="text-xs text-slate-500">{c.code}</p></td>
                      <td className={td}><StatusBadge status={c.status} /></td>
                      <td className={tdRight}>{c.eligible} <span className="text-slate-400">/ {c.inventory}</span></td>
                      <td className={tdRight}>{c.excluded}</td>
                      <td className={tdRight}>{c.locations}</td>
                      <td className={tdRight}>{c.categoryCoveragePercent == null ? '—' : `${c.categoryCoveragePercent}%`}</td>
                      <td className={tdRight}>{c.validationErrors ? <Badge tone="red">{c.validationErrors}</Badge> : <Badge tone="green">0</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ channel registry

const ChannelsView: React.FC<{ onOpen: (id: number) => void }> = ({ onOpen }) => {
  const { can } = useDist();
  const [rows, setRows] = React.useState<{ channel: Channel; adapter: Adapter | null }[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const { meta } = useDist();

  const load = React.useCallback(() => {
    setError(null);
    distributionApi.channels().then(setRows).catch(e => setError(errorText(e)));
  }, []);
  React.useEffect(load, [load]);

  const filtered = (rows || []).filter(({ channel: c }) =>
    (!q || `${c.name} ${c.code} ${c.programmeName || ''} ${c.businessOwner || ''}`.toLowerCase().includes(q.toLowerCase()))
    && (!status || c.status === status) && (!category || c.category === category));

  return (
    <div className="space-y-4">
      <FilterBar actions={<>
        <button className={btnSecondary} onClick={load}><RefreshCw className="h-4 w-4" />Refresh</button>
        {can('EDIT_CHANNEL') && <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Register channel</button>}
      </>}>
        <FilterField label="Search" className="col-span-2">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className={`${filterCls} pl-9`} placeholder="Name, code, owner" value={q} onChange={e => setQ(e.target.value)} /></div>
        </FilterField>
        <FilterField label="Status">
          <select className={filterSelectCls} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any status</option>{meta?.statuses.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </FilterField>
        <FilterField label="Category">
          <select className={filterSelectCls} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Any category</option>{meta?.categories.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </FilterField>
      </FilterBar>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {!rows ? <SkeletonRows rows={4} /> : rows.length === 0 ? (
        <EmptyState icon={Network} title="No channels registered"
          text="A channel is a record of a partnership. Registering one does not connect or publish anything."
          action={can('EDIT_CHANNEL') ? <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Register channel</button> : undefined} />
      ) : (
        <TableCard>
          <thead className="bg-slate-50/70">
            <tr>
              <th className={th}>Channel</th><th className={th}>Status</th><th className={th}>Commercial</th><th className={th}>Implementation</th>
              <th className={th}>Validation</th><th className={th}>Production approval</th><th className={th}>Integration</th><th className={th}>Last success</th><th className={th}>Last error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(({ channel: c, adapter }) => (
              <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(c.id)}>
                <td className={td}>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.code} · {humanize(c.category)}{c.businessOwner ? ` · ${c.businessOwner}` : ''}</p>
                </td>
                <td className={td}><StatusBadge status={c.status} /></td>
                <td className={td}><TrackBadge value={c.commercialStatus} /></td>
                <td className={td}><TrackBadge value={c.implementationStatus} /></td>
                <td className={td}><TrackBadge value={c.validationStatus} /></td>
                <td className={td}><TrackBadge value={c.productionApproval} /></td>
                <td className={td}>
                  <p className="text-sm text-slate-700">{adapter?.name || c.adapterKey}</p>
                  {adapter && !adapter.officialSpecImplemented && <p className="text-xs text-amber-700">Awaiting provider specification</p>}
                </td>
                <td className={`${td} whitespace-nowrap text-xs text-slate-500`}>{fmtDateTime(c.lastSuccessAt)}</td>
                <td className={`${td} max-w-[220px] truncate text-xs text-rose-700`} title={c.lastError || ''}>{c.lastError || <span className="text-slate-400">—</span>}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500">No channel matches these filters.</td></tr>}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>{creating && <CreateChannelModal onClose={() => setCreating(false)} onCreated={c => { setCreating(false); onOpen(c.id); }} />}</AnimatePresence>
    </div>
  );
};

const CreateChannelModal: React.FC<{ onClose: () => void; onCreated: (c: Channel) => void }> = ({ onClose, onCreated }) => {
  const { meta, toast } = useDist();
  const [form, setForm] = React.useState({ name: '', code: '', category: 'METASEARCH', adapterKey: 'MANUAL', integrationType: 'UNKNOWN', website: '', documentationUrl: '', businessOwner: '' });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const adapter = meta?.adapters.find(a => a.key === form.adapterKey);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      Object.entries(form).forEach(([k, v]) => { if (v) body[k] = v; });
      const c = await distributionApi.createChannel(body);
      toast(`${c.name} registered`);
      onCreated(c);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Register a distribution channel" eyebrow="Channel registry" onClose={onClose} busy={busy} width="max-w-xl"
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={btnPrimary} onClick={submit} disabled={busy || !form.name || !form.code}>{busy ? 'Saving…' : 'Register'}</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-slate-600">Provider name</span>
          <input className={inputCls} value={form.name} onChange={set('name')} placeholder="e.g. Skyscanner Car Hire" /></label>
        <label><span className="mb-1 block text-xs font-medium text-slate-600">Internal code</span>
          <input className={inputCls} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))} placeholder="SKYSCANNER" /></label>
        <label><span className="mb-1 block text-xs font-medium text-slate-600">Category</span>
          <select className={selectCls} value={form.category} onChange={set('category')}>{meta?.categories.map(c => <option key={c} value={c}>{humanize(c)}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-medium text-slate-600">Integration adapter</span>
          <select className={selectCls} value={form.adapterKey} onChange={set('adapterKey')}>{meta?.adapters.map(a => <option key={a.key} value={a.key}>{a.name}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-medium text-slate-600">Integration type</span>
          <select className={selectCls} value={form.integrationType} onChange={set('integrationType')}>{meta?.integrationTypes.map(c => <option key={c} value={c}>{humanize(c)}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-medium text-slate-600">Official website</span>
          <input className={inputCls} value={form.website} onChange={set('website')} placeholder="https://" /></label>
        <label><span className="mb-1 block text-xs font-medium text-slate-600">Documentation URL</span>
          <input className={inputCls} value={form.documentationUrl} onChange={set('documentationUrl')} placeholder="https://" /></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-slate-600">Business owner</span>
          <input className={inputCls} value={form.businessOwner} onChange={set('businessOwner')} placeholder="Who at HogiCar owns this partnership" /></label>
      </div>
      {adapter && (
        <Callout className="mt-4" tone={adapter.officialSpecImplemented ? 'info' : 'warn'} title={adapter.name}>
          {adapter.description} {!adapter.officialSpecImplemented && adapter.specificationNote}
        </Callout>
      )}
      <p className="mt-3 text-xs text-slate-500">The channel starts as Registered. Nothing is published or connected until every requirement is met and production is activated.</p>
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
};
