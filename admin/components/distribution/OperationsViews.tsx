import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Download from 'lucide-react/dist/esm/icons/download';
import Activity from 'lucide-react/dist/esm/icons/activity';
import ChartColumn from 'lucide-react/dist/esm/icons/chart-column';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Users from 'lucide-react/dist/esm/icons/users';
import Info from 'lucide-react/dist/esm/icons/info';
import { ErrorBanner } from '../commercialUi';
import {
  Badge, Callout, Card, EmptyState, FilterBar, FilterField, Modal, Pagination, SkeletonRows, TableCard,
  btnPrimary, btnSecondary, filterCls, filterSelectCls, iconBtn, inputCls, selectCls, td, tdRight, th, thRight, useConfirm,
} from '../affiliateNetworks/ui';
import { distributionApi, errorText, type Channel, type InventoryItem } from './api';
import { SEVERITY_TONE, daysAgo, fmtDateTime, fmtMoneyMap, humanize, isoDay, useDist } from './shared';
import { AuditList, RuleModal, RulesTable } from './ChannelDataTabs';

const useChannels = () => {
  const [channels, setChannels] = React.useState<Channel[]>([]);
  React.useEffect(() => { distributionApi.channels().then(r => setChannels(r.map(x => x.channel))).catch(() => undefined); }, []);
  return channels;
};

// ------------------------------------------------------------------ monitoring

export const MonitoringView: React.FC<{ channelId?: number; onlyErrors?: boolean }> = ({ channelId, onlyErrors }) => {
  const { meta } = useDist();
  const channels = useChannels();
  const [f, setF] = React.useState({ channelId: channelId ? String(channelId) : '', severity: '', errorType: '', onlyErrors: !!onlyErrors, correlationId: '', from: daysAgo(6), to: isoDay(new Date()) });
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const size = 50;

  const load = React.useCallback(() => {
    setError(null);
    distributionApi.logs({ ...f, page, size }).then(setData).catch(e => setError(errorText(e)));
  }, [f, page]);
  React.useEffect(load, [load]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setPage(0); setF(s => ({ ...s, [k]: e.target.value })); };

  const items = data?.items || [];
  const failures = items.filter((x: any) => !x.log.success).length;
  const lat = items.map((x: any) => x.log.latencyMs).filter((v: any) => v != null).sort((a: number, b: number) => a - b);

  return (
    <div className="space-y-4">
      <FilterBar actions={<button className={btnSecondary} onClick={load}><RefreshCw className="h-4 w-4" />Refresh</button>}>
        {!channelId && <FilterField label="Channel"><select className={filterSelectCls} value={f.channelId} onChange={set('channelId')}><option value="">All</option>{channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FilterField>}
        <FilterField label="From"><input type="date" className={filterCls} value={f.from} onChange={set('from')} /></FilterField>
        <FilterField label="To"><input type="date" className={filterCls} value={f.to} onChange={set('to')} /></FilterField>
        <FilterField label="Severity"><select className={filterSelectCls} value={f.severity} onChange={set('severity')}><option value="">Any</option>{meta?.severities.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></FilterField>
        <FilterField label="Error type"><select className={filterSelectCls} value={f.errorType} onChange={set('errorType')}><option value="">Any</option>{meta?.errorTypes.filter(t => t !== 'NONE').map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></FilterField>
        <FilterField label="Correlation id"><input className={filterCls} value={f.correlationId} onChange={set('correlationId')} /></FilterField>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={f.onlyErrors} onChange={e => { setPage(0); setF(s => ({ ...s, onlyErrors: e.target.checked })); }} />Failures only</label>
      </FilterBar>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><p className="text-xs text-slate-500">Operations (filtered)</p><p className="text-xl font-bold tabular-nums">{data.total}</p></Card>
          <Card><p className="text-xs text-slate-500">Failures on this page</p><p className="text-xl font-bold tabular-nums">{failures}</p></Card>
          <Card><p className="text-xs text-slate-500">Median latency (page)</p><p className="text-xl font-bold tabular-nums">{lat.length ? `${lat[Math.floor(lat.length / 2)]} ms` : '—'}</p></Card>
          <Card><p className="text-xs text-slate-500">Slowest (page)</p><p className="text-xl font-bold tabular-nums">{lat.length ? `${lat[lat.length - 1]} ms` : '—'}</p></Card>
        </div>
      )}
      {!data ? <SkeletonRows rows={4} /> : items.length === 0 ? (
        <EmptyState icon={Activity} title={f.onlyErrors ? 'No failures in this period' : 'No operations recorded in this period'}
          text="Partner API calls, connection tests, deeplink opens and booking attribution are logged here as they happen." compact />
      ) : (
        <TableCard footer={<Pagination page={page} size={size} total={data.total} onPage={setPage} />}>
          <thead className="bg-slate-50/70"><tr><th className={th}>When</th><th className={th}>Operation</th><th className={th}>Result</th><th className={thRight}>Latency</th><th className={th}>Details</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(({ log, advice }: any) => (
              <tr key={log.id} className="align-top">
                <td className={`${td} whitespace-nowrap text-xs`}>{fmtDateTime(log.createdAt)}<p className="font-mono text-[10px] text-slate-400">{log.correlationId}</p></td>
                <td className={td}><p className="text-sm font-medium">{humanize(log.operation)}</p><p className="text-xs text-slate-500">{humanize(log.direction)}{log.environment ? ` · ${humanize(log.environment)}` : ''}{!channelId && log.channelId ? ` · #${log.channelId}` : ''}</p></td>
                <td className={td}>{log.success ? <Badge tone="green">OK{log.httpStatus ? ` ${log.httpStatus}` : ''}</Badge>
                  : <div className="space-y-1"><Badge tone={SEVERITY_TONE[log.severity] || 'red'}>{humanize(log.errorType)}{log.httpStatus ? ` ${log.httpStatus}` : ''}</Badge></div>}</td>
                <td className={tdRight}>{log.latencyMs != null ? `${log.latencyMs} ms` : '—'}</td>
                <td className={`${td} max-w-[420px] text-xs`}><p className="break-words text-slate-700">{log.message || '—'}</p>{advice && <p className="mt-1 text-[#007ac2]">What to do: {advice}</p>}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ reports

export const ReportsView: React.FC<{ channelId?: number }> = ({ channelId }) => {
  const { can, toast } = useDist();
  const channels = useChannels();
  const [f, setF] = React.useState({ channelId: channelId ? String(channelId) : '', from: daysAgo(29), to: isoDay(new Date()), granularity: 'DAY' });
  const [data, setData] = React.useState<{ rows: any[]; note: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(() => {
    setError(null);
    distributionApi.reports(f).then(setData).catch(e => setError(errorText(e)));
  }, [f]);
  React.useEffect(load, [load]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(s => ({ ...s, [k]: e.target.value }));

  const exportCsv = async () => {
    try {
      const blob = await distributionApi.reportsCsv(f);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `distribution-report-${f.from}-${f.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast(errorText(e), 'err');
    }
  };

  const totals = (data?.rows || []).reduce((t: any, r: any) => {
    ['searches', 'offersReturned', 'clicks', 'clicksRestored', 'bookings', 'confirmed', 'cancelled', 'requests', 'errors'].forEach(k => { t[k] = (t[k] || 0) + (r[k] || 0); });
    return t;
  }, {});

  return (
    <div className="space-y-4">
      <FilterBar actions={<>
        <button className={btnSecondary} onClick={load}><RefreshCw className="h-4 w-4" />Refresh</button>
        {can('EXPORT_REPORTS') && <button className={btnPrimary} onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</button>}
      </>}>
        {!channelId && <FilterField label="Channel"><select className={filterSelectCls} value={f.channelId} onChange={set('channelId')}><option value="">All</option>{channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FilterField>}
        <FilterField label="From"><input type="date" className={filterCls} value={f.from} onChange={set('from')} /></FilterField>
        <FilterField label="To"><input type="date" className={filterCls} value={f.to} onChange={set('to')} /></FilterField>
        <FilterField label="Group by"><select className={filterSelectCls} value={f.granularity} onChange={set('granularity')}><option value="DAY">Day</option><option value="WEEK">Week</option><option value="MONTH">Month</option></select></FilterField>
      </FilterBar>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {data && <Callout tone="info" icon={Info}>{data.note}</Callout>}
      {!data ? <SkeletonRows rows={4} /> : data.rows.length === 0 ? (
        <EmptyState icon={ChartColumn} title="No activity in this period" text="Rows appear once channels search, click or book. Nothing is estimated where no records exist." compact />
      ) : (
        <TableCard>
          <thead className="bg-slate-50/70">
            <tr><th className={th}>Period</th>{!channelId && <th className={th}>Channel</th>}<th className={thRight}>Searches</th><th className={thRight}>Offers</th><th className={thRight}>Clicks</th>
              <th className={thRight}>Bookings</th><th className={thRight}>Confirmed</th><th className={thRight}>Cancelled</th><th className={thRight}>Conversion</th>
              <th className={thRight}>Booking value</th><th className={thRight}>Est. commission</th><th className={thRight}>Est. net margin</th><th className={thRight}>Error rate</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((r, i) => (
              <tr key={i}>
                <td className={`${td} whitespace-nowrap`}>{r.period}</td>
                {!channelId && <td className={td}>{r.channel}</td>}
                <td className={tdRight}>{r.searches}</td><td className={tdRight}>{r.offersReturned}</td><td className={tdRight}>{r.clicks}</td>
                <td className={tdRight}>{r.bookings}</td><td className={tdRight}>{r.confirmed}</td><td className={tdRight}>{r.cancelled}</td>
                <td className={tdRight}>{r.bookingConversionPercent == null ? '—' : `${r.bookingConversionPercent}%`}</td>
                <td className={tdRight}>{fmtMoneyMap(r.bookingValue)}</td><td className={tdRight}>{fmtMoneyMap(r.estimatedCommission)}</td><td className={tdRight}>{fmtMoneyMap(r.estimatedNetMargin)}</td>
                <td className={tdRight}>{r.errorRatePercent == null ? '—' : `${r.errorRatePercent}%`}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className={td}>Total</td>{!channelId && <td className={td} />}
              <td className={tdRight}>{totals.searches}</td><td className={tdRight}>{totals.offersReturned}</td><td className={tdRight}>{totals.clicks}</td>
              <td className={tdRight}>{totals.bookings}</td><td className={tdRight}>{totals.confirmed}</td><td className={tdRight}>{totals.cancelled}</td>
              <td className={tdRight}>{totals.clicks ? `${Math.round((totals.bookings / totals.clicks) * 10000) / 100}%` : '—'}</td>
              <td className={tdRight} colSpan={3} /><td className={tdRight}>{totals.requests ? `${Math.round((totals.errors / totals.requests) * 10000) / 100}%` : '—'}</td>
            </tr>
          </tbody>
        </TableCard>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ inventory

export const InventoryView: React.FC = () => {
  const { can, toast } = useDist();
  const [items, setItems] = React.useState<InventoryItem[] | null>(null);
  const [rules, setRules] = React.useState<any[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [editingCar, setEditingCar] = React.useState<InventoryItem | null>(null);
  const [editingRule, setEditingRule] = React.useState<any | null | undefined>(undefined);
  const [confirm, confirmEl] = useConfirm();

  const load = React.useCallback(() => {
    setError(null);
    distributionApi.inventory().then(setItems).catch(e => setError(errorText(e)));
    distributionApi.eligibilityRules().then(setRules).catch(() => undefined);
  }, []);
  React.useEffect(load, [load]);

  const rows = (items || []).filter(i => !q || `${i.supplierName} ${i.make} ${i.model} ${i.name} ${i.sippCode} ${i.location?.code} ${i.location?.city}`.toLowerCase().includes(q.toLowerCase()));
  const delRule = async (r: any) => {
    if (!(await confirm({ title: 'Delete this rule?', message: r.reason, confirmLabel: 'Delete', danger: true }))) return;
    await distributionApi.deleteEligibility(undefined, r.id).then(() => { toast('Rule deleted'); load(); }).catch(e => toast(errorText(e), 'err'));
  };

  return (
    <div className="space-y-4">
      <Callout tone="info" icon={Boxes} title="One inventory for every channel">
        These are HogiCar's contracted supplier cars and their real rates. Cars HogiCar sources from third-party APIs are not resold to other channels. Without a fleet quantity a car is free sale: the supplier owns availability.
      </Callout>
      <Card title="Rules for all channels" subtitle="Stop sales and exclusions that apply to every channel" icon={Boxes} bodyClassName="p-0"
        actions={can('EDIT_INVENTORY') ? <button className={btnPrimary} onClick={() => setEditingRule(null)}><Plus className="h-4 w-4" />Add rule</button> : undefined}>
        {rules ? <RulesTable rows={rules} editable={can('EDIT_INVENTORY')} onEdit={setEditingRule} onDelete={delRule} /> : <div className="p-4"><SkeletonRows rows={2} /></div>}
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input className={`${filterCls} max-w-sm`} placeholder="Search supplier, car, SIPP, location" value={q} onChange={e => setQ(e.target.value)} />
        <button className={btnSecondary} onClick={load}><RefreshCw className="h-4 w-4" />Refresh</button>
      </div>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {!items ? <SkeletonRows rows={5} /> : items.length === 0 ? <EmptyState icon={Boxes} title="No supplier cars yet" compact /> : (
        <TableCard>
          <thead className="bg-slate-50/70"><tr><th className={th}>Car</th><th className={th}>Supplier</th><th className={th}>Location</th><th className={th}>Specification</th><th className={th}>Rates</th><th className={th}>Fleet</th><th className={th} /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(i => (
              <tr key={i.carId} className="align-top">
                <td className={td}><p className="font-medium">{i.make && i.model ? `${i.make} ${i.model}` : i.name}{!i.modelGuaranteed && <span className="text-slate-400"> or similar</span>}</p>
                  <p className="text-xs text-slate-500">#{i.carId} · {i.sippCode || 'no SIPP'} · {i.category || '—'}</p></td>
                <td className={td}>{i.supplierName}{(!i.supplierActive || !i.supplierVisible) && <p><Badge tone="grey">{!i.supplierActive ? 'Inactive' : 'Hidden'}</Badge></p>}</td>
                <td className={td}>{i.location ? <><p>{i.location.code} · {i.location.name}</p><p className="text-xs text-slate-500">{[i.location.city, i.location.countryCode].filter(Boolean).join(', ')}{i.location.pickupMethod ? ` · ${humanize(i.location.pickupMethod)}` : ''}</p></> : <Badge tone="amber">No fixed location</Badge>}</td>
                <td className={`${td} text-xs`}>{[i.transmission, i.fuelPolicy, i.passengers && `${i.passengers} seats`, i.bags != null && `${i.bags} bags`, i.doors && `${i.doors} doors`, i.airConditioning && 'A/C'].filter(Boolean).join(' · ')}</td>
                <td className={`${td} text-xs`}>{i.rates.currentTiers}/{i.rates.tiers} current{i.rates.currencies.length ? ` · ${i.rates.currencies.join(', ')}` : ''}{i.rates.validUntil ? ` · until ${i.rates.validUntil}` : ''}{i.rates.fromDailyRate != null ? ` · from ${i.rates.fromDailyRate}/day` : ''}</td>
                <td className={td}>{i.fleetQuantity != null ? <Badge tone="blue">{i.fleetQuantity} allocated</Badge> : <span className="text-xs text-slate-500">Free sale</span>}{!i.available && <p><Badge tone="red">Unavailable</Badge></p>}</td>
                <td className={td}>{can('EDIT_INVENTORY') && <button className={iconBtn} onClick={() => setEditingCar(i)} aria-label="Edit distribution settings"><Pencil className="h-4 w-4" /></button>}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>
        {editingCar && <CarProfileModal item={editingCar} onClose={() => setEditingCar(null)} onSaved={() => { setEditingCar(null); load(); }} />}
        {editingRule !== undefined && <RuleModal rule={editingRule} onClose={() => setEditingRule(undefined)} onSaved={() => { setEditingRule(undefined); load(); }} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

const CarProfileModal: React.FC<{ item: InventoryItem; onClose: () => void; onSaved: () => void }> = ({ item, onClose, onSaved }) => {
  const { toast } = useDist();
  const [qty, setQty] = React.useState(item.fleetQuantity != null ? String(item.fleetQuantity) : '');
  const [guaranteed, setGuaranteed] = React.useState(item.modelGuaranteed);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.saveProfile(item.carId, { fleetQuantity: qty, modelGuaranteed: guaranteed });
      toast('Saved');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={`${item.make || ''} ${item.model || item.name || ''}`.trim()} eyebrow={`Car #${item.carId} · ${item.supplierName}`} onClose={onClose} busy={busy}
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>Save</button></>}>
      <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Allocated fleet quantity</span>
        <input className={inputCls} inputMode="numeric" value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))} placeholder="Leave empty for free sale" />
        <span className="mt-1 block text-[11px] text-slate-500">When set, HogiCar never sells more of this car for overlapping dates, on the website or any channel.</span></label>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={guaranteed} onChange={e => setGuaranteed(e.target.checked)} />
        <span>The supplier guarantees this exact make and model. Leave unticked to advertise it as "or similar".</span></label>
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
};

// ------------------------------------------------------------------ audit & roles

const ROLE_HELP: Record<string, string> = {
  SUPER_ADMIN: 'Everything, including production activation and roles',
  DISTRIBUTION_MANAGER: 'Channels, onboarding, mappings and inventory rules',
  PRICING_MANAGER: 'Pricing and markup rules',
  TECHNICAL_INTEGRATION_MANAGER: 'Channels, mappings and credentials',
  READ_ONLY_ANALYST: 'View and export reports only',
};

export const AuditRolesView: React.FC = () => {
  const { can, meta, toast } = useDist();
  const [audit, setAudit] = React.useState<any[] | null>(null);
  const [roles, setRoles] = React.useState<any[] | null>(null);
  React.useEffect(() => {
    distributionApi.audit().then(setAudit).catch(() => setAudit([]));
    if (can('MANAGE_ROLES')) distributionApi.roles().then(setRoles).catch(() => setRoles([]));
  }, [can]);
  const change = async (adminId: number, role: string) => {
    try {
      setRoles(await distributionApi.setRole(adminId, role));
      toast('Role updated');
    } catch (e) {
      toast(errorText(e), 'err');
    }
  };
  return (
    <div className="space-y-4">
      <Card title="Distribution roles" subtitle={`Your role: ${humanize(meta?.role || '')}`} icon={Users} bodyClassName={roles ? 'p-0' : 'p-4 sm:p-5'}>
        {!can('MANAGE_ROLES') ? <p className="text-sm text-slate-600">Only a super administrator can assign roles.</p> : !roles ? <SkeletonRows rows={2} /> : (
          <TableCard className="rounded-none shadow-none ring-0">
            <thead className="bg-slate-50/70"><tr><th className={th}>Admin</th><th className={th}>Role</th><th className={th}>Can do</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map(r => (
                <tr key={r.adminId}>
                  <td className={td}><p className="font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.email}{!r.active ? ' · inactive' : ''}</p></td>
                  <td className={td}><select className={selectCls} value={r.role} onChange={e => change(r.adminId, e.target.value)}>{meta?.roles.map(x => <option key={x} value={x}>{humanize(x)}</option>)}</select></td>
                  <td className={`${td} text-xs text-slate-500`}>{ROLE_HELP[r.role]}{!r.explicit ? ' (default for existing admins)' : ''}</td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}
      </Card>
      <p className="text-sm font-semibold text-slate-700">All distribution changes</p>
      <AuditList rows={audit} />
    </div>
  );
};
