import * as React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MousePointer from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import UserRound from 'lucide-react/dist/esm/icons/user-round';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Coins from 'lucide-react/dist/esm/icons/coins';
import BadgePercent from 'lucide-react/dist/esm/icons/badge-percent';
import Landmark from 'lucide-react/dist/esm/icons/landmark';
import PiggyBank from 'lucide-react/dist/esm/icons/piggy-bank';
import Calculator from 'lucide-react/dist/esm/icons/calculator';
import Activity from 'lucide-react/dist/esm/icons/activity';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import { affiliateNetworksApi as api, apiError, type Overview, type OverviewFilters, type Publisher } from '../../affiliateNetworksApi';
import { ErrorBanner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Card, FilterBar, FilterField, Select, filterCls, money, pct, daysAgo, isoDay, Skeleton, HEALTH_UI, humanize, btnSecondary,
} from './ui';

const n0 = (n: number | null | undefined) => new Intl.NumberFormat('en-GB').format(Number(n || 0));
const shortDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const RANGES = [{ d: 7, l: '7d' }, { d: 30, l: '30d' }, { d: 90, l: '90d' }];
const BOOKING_STATUSES = ['CONFIRMED', 'COMPLETED', 'PENDING', 'MODIFIED', 'CANCELLED'];

const defaultFilters = (): OverviewFilters => ({ from: daysAgo(30), to: isoDay(new Date()) });

const Kpi: React.FC<{ label: string; value: string; Icon: React.ComponentType<{ className?: string }>; note?: string; loading?: boolean; accent?: boolean }> = ({ label, value, Icon, note, loading, accent }) => (
  <div className={`min-w-0 rounded-2xl p-4 shadow-sm ring-1 ${accent ? 'bg-[#0b2545] text-white ring-[#0b2545]' : 'bg-white ring-slate-200'}`}>
    <div className="flex items-center justify-between gap-2">
      <p className={`truncate text-xs font-medium ${accent ? 'text-sky-100/80' : 'text-slate-500'}`}>{label}</p>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-white/10 text-sky-200' : 'bg-[#007ac2]/10 text-[#007ac2]'}`}><Icon className="h-3.5 w-3.5" /></span>
    </div>
    <p className={`mt-2 truncate text-lg font-semibold leading-none tabular-nums sm:text-[22px] ${accent ? 'text-white' : 'text-slate-900'}`}>{loading ? <Skeleton className="h-6 w-20" /> : value}</p>
    {note && !loading && <p className={`mt-1.5 truncate text-[11px] ${accent ? 'text-sky-100/70' : 'text-slate-400'}`}>{note}</p>}
  </div>
);

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' };

const ChartCard: React.FC<{ title: string; subtitle?: string; loading: boolean; empty: boolean; children: React.ReactElement }> = ({ title, subtitle, loading, empty, children }) => (
  <Card title={title} subtitle={subtitle}>
    <div className="h-60 w-full min-w-0">
      {loading ? <div className="h-full animate-pulse rounded-xl bg-slate-100" /> : empty ? (
        <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">No data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>{children}</ResponsiveContainer>
      )}
    </div>
  </Card>
);

const RankList: React.FC<{ rows: { key: string; title: React.ReactNode; sub?: React.ReactNode; value: string; extra?: string; share: number }[]; empty: string; loading: boolean }> = ({ rows, empty, loading }) => {
  if (loading) return <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div>;
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  return (
    <ol className="space-y-1">
      {rows.map((r, i) => (
        <li key={r.key} className="relative overflow-hidden rounded-xl px-3 py-2">
          <span className="absolute inset-y-0 left-0 rounded-xl bg-[#007ac2]/[0.07]" style={{ width: `${Math.max(2, Math.min(100, r.share * 100))}%` }} />
          <div className="relative flex items-center gap-3">
            <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-slate-400">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{r.title}</p>
              {r.sub && <p className="truncate text-[11px] text-slate-500">{r.sub}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-slate-900">{r.value}</p>
              {r.extra && <p className="text-[11px] tabular-nums text-slate-400">{r.extra}</p>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

const HEALTH_STRIP_CLS: Record<string, string> = {
  green: 'border-emerald-200 bg-emerald-50/60',
  amber: 'border-amber-200 bg-amber-50/60',
  red: 'border-rose-200 bg-rose-50/70',
  grey: 'border-slate-200 bg-slate-50',
};
const HEALTH_DOT: Record<string, string> = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500', grey: 'bg-slate-400' };

const NetworkDashboard: React.FC = () => {
  const { networks, goTo } = useAffiliateNetworks();
  const [filters, setFilters] = React.useState<OverviewFilters>(defaultFilters);
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [publishers, setPublishers] = React.useState<Publisher[]>([]);

  const load = React.useCallback(async (f: OverviewFilters) => {
    setLoading(true); setError(null);
    try { setData(await api.getOverview(f)); }
    catch (e) { setError(apiError(e, 'Could not load the dashboard.')); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(filters); }, [filters, load]);
  React.useEffect(() => { api.getPublishers().then(p => setPublishers(Array.isArray(p) ? p : [])).catch(() => setPublishers([])); }, []);

  const set = (p: Partial<OverviewFilters>) => setFilters(f => ({ ...f, ...p }));
  const currencies = React.useMemo(() => Array.from(new Set(networks.flatMap(n => n.supportedCurrencies || []).concat(['JOD', 'USD', 'EUR', 'AED', 'GBP']))).sort(), [networks]);
  const rangeDays = filters.from && filters.to ? Math.round((new Date(filters.to).getTime() - new Date(filters.from).getTime()) / 86400000) : null;

  const k = data?.kpis;
  const cur = data?.currency && data.currency !== 'mixed' ? data.currency : null;
  const mixedNote = data?.currency === 'mixed' ? 'Mixed currencies – summed as-is' : undefined;
  const m = (v?: number) => money(v, cur);
  const series = (data?.series || []).map(p => ({ ...p, label: shortDay(p.date) }));
  const byNetwork = data?.byNetwork || [];
  const maxPub = Math.max(1, ...(data?.topPublishers || []).map(p => p.revenue || 0));
  const maxLp = Math.max(1, ...(data?.topLandingPages || []).map(p => p.clicks || 0));
  const maxLoc = Math.max(1, ...(data?.topLocations || []).map(p => p.revenue || 0));

  return (
    <div className="space-y-4 sm:space-y-5">
      <FilterBar actions={<>
        <div className="mr-auto inline-flex rounded-xl bg-slate-100 p-1">
          {RANGES.map(r => (
            <button key={r.d} onClick={() => set({ from: daysAgo(r.d), to: isoDay(new Date()) })}
              className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${rangeDays === r.d && filters.to === isoDay(new Date()) ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{r.l}</button>
          ))}
        </div>
        <button className={`${btnSecondary} h-9`} onClick={() => setFilters(defaultFilters())}><RotateCcw className="h-4 w-4" /> Reset</button>
      </>}>
        <FilterField label="From"><input type="date" className={filterCls} value={filters.from || ''} max={filters.to} onChange={e => set({ from: e.target.value })} /></FilterField>
        <FilterField label="To"><input type="date" className={filterCls} value={filters.to || ''} min={filters.from} onChange={e => set({ to: e.target.value })} /></FilterField>
        <FilterField label="Network">
          <Select compact value={String(filters.networkId ?? '')} onChange={e => set({ networkId: e.target.value || undefined, publisherId: undefined })}>
            <option value="">All networks</option>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Publisher">
          <Select compact value={filters.publisherId || ''} onChange={e => set({ publisherId: e.target.value || undefined })}>
            <option value="">All publishers</option>
            {publishers.filter(p => !filters.networkId || String(p.networkId) === String(filters.networkId)).map(p => <option key={p.id} value={p.externalPublisherId || String(p.id)}>{p.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Currency">
          <Select compact value={filters.currency || ''} onChange={e => set({ currency: e.target.value || undefined })}>
            <option value="">All currencies</option>
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Booking status">
          <Select compact value={filters.bookingStatus || ''} onChange={e => set({ bookingStatus: e.target.value || undefined })}>
            <option value="">Any status</option>
            {BOOKING_STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Country"><input className={`${filterCls} uppercase placeholder:normal-case`} maxLength={2} placeholder="e.g. JO" value={filters.country || ''} onChange={e => set({ country: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') || undefined })} /></FilterField>
        <FilterField label="Location"><input className={`${filterCls} uppercase placeholder:normal-case`} maxLength={8} placeholder="e.g. AMM" value={filters.location || ''} onChange={e => set({ location: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') || undefined })} /></FilterField>
      </FilterBar>

      {error && <ErrorBanner text={error} onRetry={() => load(filters)} />}

      {/* Network health strip */}
      <Card title="Network health" subtitle="Live connection state of every configured network." icon={Activity}
        actions={<button className="text-sm font-semibold text-[#007ac2] hover:underline" onClick={() => goTo('networks')}>Manage networks</button>}>
        {loading && !data ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
          : (data?.health || []).length === 0 ? <p className="text-sm text-slate-400">No networks configured yet.</p> : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {(data?.health || []).map(h => {
                const ui = HEALTH_UI[h.health] || { tone: 'grey', label: humanize(h.health) };
                return (
                  <button key={h.networkId} onClick={() => goTo('networks', { networkId: h.networkId })}
                    className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition hover:shadow-sm ${HEALTH_STRIP_CLS[ui.tone] || HEALTH_STRIP_CLS.grey}`}>
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${HEALTH_DOT[ui.tone] || HEALTH_DOT.grey} ${h.health === 'CONNECTED' ? 'shadow-[0_0_0_4px_rgba(16,185,129,0.15)]' : ''}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{h.name}</span>
                        <span className="shrink-0 text-[11px] font-semibold text-slate-500">{ui.label}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500" title={h.message || undefined}>{h.message || `${humanize(h.status)} · ${h.connectorType}`}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi accent label="Revenue" value={m(k?.revenue)} Icon={Wallet} note={mixedNote || `${n0(k?.bookings)} bookings`} loading={loading} />
        <Kpi accent label="Commission" value={m(k?.commission)} Icon={BadgePercent} note={`on ${m(k?.commissionableRevenue)} commissionable`} loading={loading} />
        <Kpi accent label="Net revenue" value={m(k?.netRevenue)} Icon={PiggyBank} note={`after ${m(k?.networkFees)} network fees`} loading={loading} />
        <Kpi label="Clicks" value={n0(k?.clicks)} Icon={MousePointer} note={`${n0(k?.uniqueVisitors)} unique visitors`} loading={loading} />
        <Kpi label="Conversion rate" value={pct(k?.conversionRate, 2)} Icon={TrendingUp} note="Bookings ÷ clicks" loading={loading} />
        <Kpi label="Bookings" value={n0(k?.bookings)} Icon={ShoppingBag} note={`${n0(k?.confirmedBookings)} confirmed · ${n0(k?.cancelledBookings)} cancelled`} loading={loading} />
        <Kpi label="Commissionable revenue" value={m(k?.commissionableRevenue)} Icon={Calculator} loading={loading} />
        <Kpi label="Network fees" value={m(k?.networkFees)} Icon={Landmark} loading={loading} />
        <Kpi label="Avg. booking value" value={m(k?.averageBookingValue)} Icon={Coins} loading={loading} />
        <Kpi label="Unique visitors" value={n0(k?.uniqueVisitors)} Icon={UserRound} loading={loading} />
      </div>

      {/* Conversion pipeline */}
      <Card title="Conversion pipeline" subtitle="Where reported conversions are in their lifecycle." bodyClassName="p-3 sm:p-4"
        actions={<button className="text-sm font-semibold text-[#007ac2] hover:underline" onClick={() => goTo('conversions')}>Open conversions</button>}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {([['Pending', k?.pending, 'bg-sky-500'], ['Sent', k?.sent, 'bg-[#007ac2]'], ['Confirmed', k?.confirmed, 'bg-emerald-500'], ['Failed', k?.failed, 'bg-rose-500'], ['Cancelled', k?.cancelled, 'bg-slate-400'], ['Refunded', k?.refunded, 'bg-violet-500']] as const).map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><span className={`h-2 w-2 rounded-full ${c}`} />{l}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{loading ? <Skeleton className="h-5 w-8" /> : n0(v)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue by day" subtitle={cur ? `Booking value in ${cur}` : 'Booking value (summed per booking currency)'} loading={loading} empty={!series.length}>
          <AreaChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="anRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#007ac2" stopOpacity={0.28} /><stop offset="100%" stopColor="#007ac2" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" width={48} tickFormatter={v => new Intl.NumberFormat('en', { notation: 'compact' }).format(v)} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [m(Number(v)), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#007ac2" strokeWidth={2} fill="url(#anRevenue)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ChartCard>
        <ChartCard title="Bookings by day" subtitle="Attributed bookings" loading={loading} empty={!series.length}>
          <BarChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" minTickGap={24} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" width={36} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="bookings" name="Bookings" fill="#0f9d8a" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Revenue by network" loading={loading} empty={!byNetwork.length}>
          <BarChart data={byNetwork} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" tickFormatter={v => new Intl.NumberFormat('en', { notation: 'compact' }).format(v)} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#475569" width={90} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v) => [m(Number(v)), 'Revenue']} />
            <Bar dataKey="revenue" name="Revenue" fill="#007ac2" radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Commission by network" loading={loading} empty={!byNetwork.length}>
          <BarChart data={byNetwork} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" tickFormatter={v => new Intl.NumberFormat('en', { notation: 'compact' }).format(v)} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#475569" width={90} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v) => [m(Number(v)), 'Commission']} />
            <Bar dataKey="commission" name="Commission" fill="#0b2545" radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Top lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Top publishers" icon={Users} bodyClassName="p-2 sm:p-3">
          <RankList loading={loading} empty="No publisher activity yet"
            rows={(data?.topPublishers || []).map(p => ({ key: `${p.networkName}-${p.publisherId}`, title: p.name || p.publisherId, sub: `${p.networkName} · ID ${p.publisherId} · ${n0(p.clicks)} clicks`, value: m(p.revenue), extra: `${n0(p.bookings)} bookings`, share: (p.revenue || 0) / maxPub }))} />
        </Card>
        <Card title="Top landing pages" icon={FileText} bodyClassName="p-2 sm:p-3">
          <RankList loading={loading} empty="No landing page data yet"
            rows={(data?.topLandingPages || []).map(p => ({ key: p.path, title: <span className="font-mono text-[13px]">{p.path}</span>, value: `${n0(p.clicks)} clicks`, extra: `${n0(p.bookings)} bookings`, share: (p.clicks || 0) / maxLp }))} />
        </Card>
        <Card title="Top locations" icon={MapPin} bodyClassName="p-2 sm:p-3">
          <RankList loading={loading} empty="No bookings by location yet"
            rows={(data?.topLocations || []).map(p => ({ key: p.code, title: <span className="font-mono">{p.code}</span>, value: m(p.revenue), extra: `${n0(p.bookings)} bookings`, share: (p.revenue || 0) / maxLoc }))} />
        </Card>
      </div>
    </div>
  );
};

export default NetworkDashboard;
