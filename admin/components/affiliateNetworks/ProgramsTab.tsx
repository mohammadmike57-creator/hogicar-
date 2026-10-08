import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import {
  affiliateNetworksApi as api, apiError, type Program, type ProgramInput, COMMISSION_MODELS, type CommissionModel,
} from '../../affiliateNetworksApi';
import { Drawer, Field, ErrorBanner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Badge, ChipInput, EmptyState, NumberInput, Panel, SaveFooter, Select, SkeletonRows, TableCard, btnPrimary, iconBtn, inputCls,
  humanize, money, th, thRight, td, tdRight, useConfirm, fmtDay, FilterField, pickInto,
} from './ui';

export const commissionLabel = (model: CommissionModel, value: number | null | undefined, currency?: string | null) => {
  if (value === null || value === undefined) return '—';
  switch (model) {
    case 'PERCENTAGE': return `${value}%`;
    case 'FIXED_PER_BOOKING': return `${money(value, currency)} / booking`;
    case 'PER_DAY': return `${money(value, currency)} / day`;
    case 'TIERED': return 'Tiered';
    default: return String(value);
  }
};

const empty = (networkId: number): ProgramInput => ({
  networkId, name: '', externalProgramId: '', status: 'ACTIVE', description: '', commissionModel: 'PERCENTAGE', commissionValue: 5, currency: null,
  countries: [], attributionWindowDays: null, cookieDays: null, startDate: null, endDate: null, minBookingValue: null, maxBookingValue: null,
});

const ProgramDrawer: React.FC<{ program: Program | null; defaultNetworkId: number; onClose: () => void; onSaved: (p: Program) => void }> = ({ program, defaultNetworkId, onClose, onSaved }) => {
  const { networks } = useAffiliateNetworks();
  const [d, setD] = React.useState<ProgramInput>(() => (program ? pickInto(empty(program.networkId), program) : empty(defaultNetworkId)));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<ProgramInput>) => { setD(x => ({ ...x, ...p })); setError(null); };
  const save = async () => {
    if (!d.networkId) return setError('Choose a network.');
    if (!d.name.trim()) return setError('Enter a program name.');
    if (d.startDate && d.endDate && d.endDate < d.startDate) return setError('End date is before the start date.');
    setSaving(true);
    try { onSaved(program ? await api.updateProgram(program.id, d) : await api.createProgram(d)); }
    catch (e) { setError(apiError(e, 'Could not save the program.')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer eyebrow={program ? 'Edit program' : 'New program'} title={program?.name || 'Add a program'} onClose={onClose} busy={saving}
      footer={<SaveFooter error={error} saving={saving} onCancel={onClose} onSave={save} label={program ? 'Save program' : 'Add program'} />}>
      <div className="space-y-4">
        <Panel title="Program">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Network">
              <Select value={d.networkId || ''} onChange={e => set({ networkId: Number(e.target.value) })}>
                <option value="">Choose…</option>
                {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={d.status} onChange={e => set({ status: e.target.value })}>
                {['ACTIVE', 'PAUSED', 'ENDED'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}
              </Select>
            </Field>
            <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="HogiCar Car Rental" /></Field>
            <Field label="External program ID"><input className={`${inputCls} font-mono`} value={d.externalProgramId} onChange={e => set({ externalProgramId: e.target.value })} placeholder="Optional" /></Field>
          </div>
          <Field label="Description"><textarea className={`${inputCls} h-20 py-2.5`} value={d.description} onChange={e => set({ description: e.target.value })} /></Field>
        </Panel>
        <Panel title="Commission">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Model">
              <Select value={d.commissionModel} onChange={e => set({ commissionModel: e.target.value as CommissionModel })}>
                {COMMISSION_MODELS.map(m => <option key={m} value={m}>{humanize(m)}</option>)}
              </Select>
            </Field>
            <Field label="Value" hint={d.commissionModel === 'TIERED' ? 'Define tiers in Commission rules.' : undefined}>
              <NumberInput value={d.commissionValue} onChange={v => set({ commissionValue: v })} suffix={d.commissionModel === 'PERCENTAGE' ? '%' : d.currency || ''} />
            </Field>
            <Field label="Currency"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={3} value={d.currency || ''} onChange={e => set({ currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') || null })} placeholder="Booking" /></Field>
            <Field label="Min booking value"><NumberInput value={d.minBookingValue} onChange={v => set({ minBookingValue: v })} placeholder="None" /></Field>
            <Field label="Max booking value"><NumberInput value={d.maxBookingValue} onChange={v => set({ maxBookingValue: v })} placeholder="None" /></Field>
          </div>
        </Panel>
        <Panel title="Scope & dates">
          <Field label="Countries"><ChipInput value={d.countries} onChange={v => set({ countries: v })} placeholder="JO, AE…" pattern={/^[A-Z]{2}$/} patternHint="2-letter codes" emptyLabel="All countries" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Attribution window" hint="Empty = network default"><NumberInput decimals={false} value={d.attributionWindowDays} onChange={v => set({ attributionWindowDays: v })} suffix="days" /></Field>
            <Field label="Cookie days" hint="Empty = network default"><NumberInput decimals={false} value={d.cookieDays} onChange={v => set({ cookieDays: v })} suffix="days" /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={d.startDate || ''} onChange={e => set({ startDate: e.target.value || null })} /></Field>
            <Field label="End date"><input type="date" className={inputCls} value={d.endDate || ''} onChange={e => set({ endDate: e.target.value || null })} /></Field>
          </div>
        </Panel>
      </div>
    </Drawer>
  );
};

const ProgramsTab: React.FC = () => {
  const { networks, notify, params } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState<string>(params.networkId ? String(params.networkId) : '');
  const [items, setItems] = React.useState<Program[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Program | null | 'new'>(null);
  const [confirm, confirmEl] = useConfirm();

  const load = React.useCallback(async () => {
    setItems(null); setError(null);
    try { setItems(await api.getPrograms(networkId || undefined)); }
    catch (e) { setError(apiError(e, 'Could not load programs.')); setItems([]); }
  }, [networkId]);
  React.useEffect(() => { load(); }, [load]);

  const del = async (p: Program) => {
    if (!(await confirm({ title: `Delete ${p.name}?`, message: 'Tracking links and rules that reference this program will fall back to the network defaults.', confirmLabel: 'Delete', danger: true }))) return;
    try { await api.deleteProgram(p.id); setItems(l => (l || []).filter(x => x.id !== p.id)); notify('Program deleted'); }
    catch (e) { notify(apiError(e, 'Could not delete the program.'), 'err'); }
  };
  const nameOf = (id: number) => networks.find(n => n.id === id)?.name;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Programs</h3>
          <p className="text-sm text-slate-500">Advertiser programs inside each network, with their own commission and dates.</p>
        </div>
        <div className="flex items-end gap-2">
          <FilterField label="Network" className="w-44">
            <Select compact value={networkId} onChange={e => setNetworkId(e.target.value)}>
              <option value="">All networks</option>
              {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </FilterField>
          <button className={`${btnPrimary} shrink-0`} onClick={() => setEditing('new')} disabled={!networks.length}><Plus className="h-4 w-4" /> Add program</button>
        </div>
      </div>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {items === null ? <SkeletonRows rows={3} /> : !items.length ? (
        <EmptyState icon={Briefcase} title="No programs" text={networks.length ? 'Programs are optional – add one when a network runs several advertiser programs.' : 'Add a network first.'} />
      ) : (
        <TableCard>
          <thead className="border-b border-slate-100"><tr>
            <th className={th}>Program</th><th className={th}>Network</th><th className={th}>Status</th><th className={th}>Commission</th><th className={th}>Countries</th><th className={thRight}>Window</th><th className={th}>Dates</th><th className={`${th} text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="cursor-pointer border-t border-slate-100 first:border-0 hover:bg-sky-50/40" onClick={() => setEditing(p)}>
                <td className={td}><p className="font-semibold text-slate-900">{p.name}</p>{p.externalProgramId && <p className="font-mono text-[11px] text-slate-400">#{p.externalProgramId}</p>}</td>
                <td className={td}>{p.networkName || nameOf(p.networkId) || '—'}</td>
                <td className={td}><Badge tone={p.status === 'ACTIVE' ? 'green' : 'grey'} dot>{humanize(p.status)}</Badge></td>
                <td className={`${td} whitespace-nowrap font-medium`}>{commissionLabel(p.commissionModel, p.commissionValue, p.currency)}</td>
                <td className={td}>{p.countries?.length ? p.countries.join(', ') : <span className="text-slate-400">All</span>}</td>
                <td className={tdRight}>{p.attributionWindowDays ? `${p.attributionWindowDays}d` : <span className="text-slate-400">Default</span>}</td>
                <td className={`${td} whitespace-nowrap text-xs`}>{p.startDate ? fmtDay(p.startDate) : 'Open'} → {p.endDate ? fmtDay(p.endDate) : 'no end'}</td>
                <td className={td} onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-0.5">
                    <button className={iconBtn} onClick={() => setEditing(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} onClick={() => del(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>
        {editing && <ProgramDrawer key="pd" program={editing === 'new' ? null : editing} defaultNetworkId={Number(networkId) || networks[0]?.id || 0} onClose={() => setEditing(null)}
          onSaved={p => { setItems(l => (l || []).some(x => x.id === p.id) ? (l || []).map(x => (x.id === p.id ? p : x)) : [p, ...(l || [])]); setEditing(null); notify('Program saved'); }} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

export default ProgramsTab;
