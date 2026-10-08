import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Calculator from 'lucide-react/dist/esm/icons/calculator';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import {
  affiliateNetworksApi as api, apiError, type CommissionRule, type CommissionRuleInput, type CommissionPreview, type Program, type Publisher,
  COMMISSION_MODELS, type CommissionModel, type CommissionTier,
} from '../../affiliateNetworksApi';
import { Drawer, Field, ErrorBanner, Spinner, Toggle } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { commissionLabel } from './ProgramsTab';
import {
  Badge, Callout, Card, EmptyState, FilterField, NumberInput, Panel, SaveFooter, Select, SkeletonRows, TableCard, btnPrimary, btnSecondary,
  iconBtn, inputCls, humanize, money, th, td, useConfirm,
} from './ui';

const empty = (networkId: number | null): CommissionRuleInput => ({
  name: '', networkId, programId: null, publisherId: null, countryCode: null, locationCode: null, campaign: null,
  model: 'PERCENTAGE', value: 5, tiers: [], commissionGroup: null, currency: null, active: true,
});

const pickRule = (r: CommissionRule): CommissionRuleInput => {
  const e = empty(r.networkId);
  return Object.fromEntries(Object.keys(e).map(k => [k, (r as unknown as Record<string, unknown>)[k] ?? (e as unknown as Record<string, unknown>)[k]])) as unknown as CommissionRuleInput;
};

const TiersEditor: React.FC<{ tiers: CommissionTier[]; onChange: (t: CommissionTier[]) => void; unit: string }> = ({ tiers, onChange, unit }) => {
  const sorted = tiers;
  const update = (i: number, p: Partial<CommissionTier>) => onChange(sorted.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400"><span>From booking #</span><span>Rate ({unit})</span><span className="w-8" /></div>
      {sorted.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <NumberInput decimals={false} value={t.fromBookings} onChange={v => update(i, { fromBookings: v ?? 0 })} />
          <NumberInput value={t.value} onChange={v => update(i, { value: v ?? 0 })} suffix={unit} />
          <button type="button" className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} onClick={() => onChange(sorted.filter((_, j) => j !== i))} aria-label="Remove tier"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" className={`${btnSecondary} h-9`} onClick={() => {
        const last = sorted[sorted.length - 1];
        onChange([...sorted, { fromBookings: last ? last.fromBookings + 100 : 0, value: last ? last.value + 1 : 4 }]);
      }}><Plus className="h-4 w-4" /> Add tier</button>
      {sorted.length > 0 && <p className="text-xs text-slate-500">Bookings in the period are counted per network/publisher; the highest tier reached applies.</p>}
    </div>
  );
};

const RuleDrawer: React.FC<{ rule: CommissionRule | null; defaultNetworkId: number | null; onClose: () => void; onSaved: (r: CommissionRule) => void }> = ({ rule, defaultNetworkId, onClose, onSaved }) => {
  const { networks } = useAffiliateNetworks();
  const [d, setD] = React.useState<CommissionRuleInput>(() => (rule ? pickRule(rule) : empty(defaultNetworkId)));
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [publishers, setPublishers] = React.useState<Publisher[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<CommissionRuleInput>) => { setD(x => ({ ...x, ...p })); setError(null); };
  React.useEffect(() => {
    api.getPrograms(d.networkId ?? undefined).then(setPrograms).catch(() => setPrograms([]));
    api.getPublishers(d.networkId ?? undefined).then(setPublishers).catch(() => setPublishers([]));
  }, [d.networkId]);
  const unit = d.model === 'PERCENTAGE' || d.model === 'TIERED' ? '%' : d.currency || '';
  const save = async () => {
    if (!d.name.trim()) return setError('Name the rule.');
    if (d.model === 'TIERED') {
      if (!d.tiers.length) return setError('Add at least one tier.');
      const froms = d.tiers.map(t => t.fromBookings);
      if (new Set(froms).size !== froms.length) return setError('Each tier needs a different “from booking” value.');
    } else if (!(d.value >= 0)) return setError('Enter a commission value.');
    if (d.model === 'PERCENTAGE' && d.value > 100) return setError('A percentage can’t be above 100.');
    setSaving(true);
    const body = { ...d, tiers: d.model === 'TIERED' ? [...d.tiers].sort((a, b) => a.fromBookings - b.fromBookings) : [] };
    try { onSaved(rule ? await api.updateRule(rule.id, body) : await api.createRule(body)); }
    catch (e) { setError(apiError(e, 'Could not save the rule.')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer eyebrow={rule ? 'Edit rule' : 'New rule'} title={rule?.name || d.name || 'Commission rule'} onClose={onClose} busy={saving}
      footer={<SaveFooter error={error} saving={saving} onCancel={onClose} onSave={save} label={rule ? 'Save rule' : 'Add rule'} />}>
      <div className="space-y-4">
        <Panel title="Rule">
          <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Amman airport" /></Field>
          <Toggle checked={d.active} onChange={v => set({ active: v })} label="Active" hint="Inactive rules are ignored when calculating commission." />
        </Panel>
        <Panel title="Applies to">
          <p className="-mt-2 text-xs text-slate-500">Leave a field empty to match anything. The most specific matching rule wins.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Network">
              <Select value={d.networkId ?? ''} onChange={e => set({ networkId: e.target.value ? Number(e.target.value) : null, programId: null, publisherId: null })}>
                <option value="">Any network</option>
                {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </Select>
            </Field>
            <Field label="Program">
              <Select value={d.programId ?? ''} onChange={e => set({ programId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Any program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Publisher">
              <Select value={d.publisherId ?? ''} onChange={e => set({ publisherId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Any publisher</option>
                {publishers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.externalPublisherId})</option>)}
              </Select>
            </Field>
            <Field label="Campaign"><input className={`${inputCls} font-mono`} value={d.campaign || ''} onChange={e => set({ campaign: e.target.value || null })} placeholder="Any" /></Field>
            <Field label="Country"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={2} value={d.countryCode || ''} onChange={e => set({ countryCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') || null })} placeholder="Any" /></Field>
            <Field label="Pick-up location"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={8} value={d.locationCode || ''} onChange={e => set({ locationCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') || null })} placeholder="Any" /></Field>
          </div>
        </Panel>
        <Panel title="Commission">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Model">
              <Select value={d.model} onChange={e => set({ model: e.target.value as CommissionModel })}>
                {COMMISSION_MODELS.map(m => <option key={m} value={m}>{humanize(m)}</option>)}
              </Select>
            </Field>
            {d.model !== 'TIERED' && <Field label="Value"><NumberInput value={d.value} onChange={v => set({ value: v ?? 0 })} suffix={unit} /></Field>}
            <Field label="Commission group" hint="Network-side group (e.g. Awin commission group code)."><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={d.commissionGroup || ''} onChange={e => set({ commissionGroup: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') || null })} placeholder="Network default" /></Field>
            {(d.model === 'FIXED_PER_BOOKING' || d.model === 'PER_DAY') && (
              <Field label="Currency"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={3} value={d.currency || ''} onChange={e => set({ currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') || null })} placeholder="Booking currency" /></Field>
            )}
          </div>
          {d.model === 'TIERED' && <TiersEditor tiers={d.tiers} onChange={t => set({ tiers: t })} unit="%" />}
        </Panel>
      </div>
    </Drawer>
  );
};

const PreviewPanel: React.FC<{ defaultNetworkId: number | null }> = ({ defaultNetworkId }) => {
  const { networks } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState<number | null>(defaultNetworkId || networks[0]?.id || null);
  const [mode, setMode] = React.useState<'booking' | 'manual'>('booking');
  const [bookingRef, setBookingRef] = React.useState('');
  const [m, setM] = React.useState({ amount: 200 as number | null, currency: 'JOD', days: 3 as number | null, countryCode: '', locationCode: '', publisherId: '' });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CommissionPreview | null>(null);
  React.useEffect(() => { if (!networkId && networks[0]) setNetworkId(networks[0].id); }, [networks, networkId]);

  const run = async () => {
    if (!networkId) return setError('Choose a network.');
    setBusy(true); setError(null); setResult(null);
    try {
      if (mode === 'booking') {
        if (!bookingRef.trim()) { setError('Enter a booking reference.'); return; }
        setResult(await api.previewRule({ networkId, bookingRef: bookingRef.trim() }));
      } else {
        if (!m.amount || m.amount <= 0) { setError('Enter an amount.'); return; }
        setResult(await api.previewRule({ networkId, amount: m.amount, currency: m.currency || undefined, days: m.days ?? undefined, countryCode: m.countryCode || undefined, locationCode: m.locationCode || undefined, publisherId: m.publisherId || undefined }));
      }
    } catch (e) { setError(apiError(e, 'Preview failed.')); }
    finally { setBusy(false); }
  };

  return (
    <Card title="Preview calculation" subtitle="See exactly which rule applies and what the network would be told." icon={Calculator}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Network">
            <Select value={networkId ?? ''} onChange={e => setNetworkId(Number(e.target.value) || null)}>
              {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Based on</span>
            <div className="inline-flex h-11 rounded-xl bg-slate-100 p-1">
              {(['booking', 'manual'] as const).map(k => (
                <button key={k} type="button" onClick={() => setMode(k)} className={`rounded-lg px-3 text-sm font-semibold transition ${mode === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{k === 'booking' ? 'A booking' : 'An amount'}</button>
              ))}
            </div>
          </div>
        </div>
        {mode === 'booking' ? (
          <Field label="Booking reference"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={bookingRef} onChange={e => setBookingRef(e.target.value.toUpperCase())} placeholder="H12345" onKeyDown={e => e.key === 'Enter' && run()} /></Field>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Amount"><NumberInput value={m.amount} onChange={v => setM(x => ({ ...x, amount: v }))} /></Field>
            <Field label="Currency"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={3} value={m.currency} onChange={e => setM(x => ({ ...x, currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') }))} /></Field>
            <Field label="Rental days"><NumberInput decimals={false} value={m.days} onChange={v => setM(x => ({ ...x, days: v }))} /></Field>
            <Field label="Country"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={2} value={m.countryCode} onChange={e => setM(x => ({ ...x, countryCode: e.target.value.toUpperCase() }))} placeholder="JO" /></Field>
            <Field label="Location"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={8} value={m.locationCode} onChange={e => setM(x => ({ ...x, locationCode: e.target.value.toUpperCase() }))} placeholder="AMM" /></Field>
            <Field label="Publisher ID"><input className={`${inputCls} font-mono`} value={m.publisherId} onChange={e => setM(x => ({ ...x, publisherId: e.target.value }))} placeholder="Any" /></Field>
          </div>
        )}
        <button className={`${btnPrimary} w-full sm:w-auto`} onClick={run} disabled={busy || !networks.length}>{busy ? <Spinner light /> : <Calculator className="h-4 w-4" />} Calculate</button>
        {error && <Callout tone="error">{error}</Callout>}
        {result && (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Booking value', money(result.bookingValue, result.currency)], ['Commissionable', money(result.commissionableValue, result.currency)], ['Rate', `${result.commissionRate}%`], ['Commission', money(result.commissionAmount, result.currency)]].map(([k, v], i) => (
                <div key={k}><p className="text-xs text-slate-500">{k}</p><p className={`mt-0.5 font-semibold tabular-nums ${i === 3 ? 'text-lg text-[#007ac2]' : 'text-slate-900'}`}>{v}</p></div>
              ))}
            </div>
            <p className="text-xs text-slate-600">Rule: <b>{result.ruleName || 'Network default'}</b>{result.ruleId ? ` (#${result.ruleId})` : ''} · Group <span className="font-mono">{result.commissionGroup}</span></p>
            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-3 py-2">Component</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Counted</th><th className="px-3 py-2">Note</th></tr></thead>
                <tbody>
                  {result.breakdown.map((b, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{b.component}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${b.included ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{money(b.amount, result.currency)}</td>
                      <td className="px-3 py-2">{b.included ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" />Yes</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><X className="h-3.5 w-3.5" />No</span>}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{b.note || ''}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold"><td className="px-3 py-2">Commissionable value</td><td className="px-3 py-2 text-right tabular-nums">{money(result.commissionableValue, result.currency)}</td><td colSpan={2} /></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const scopeOf = (r: CommissionRule, pubName?: string, progName?: string) => {
  const parts: string[] = [];
  if (r.publisherId) parts.push(`Publisher ${pubName || `#${r.publisherId}`}`);
  if (r.programId) parts.push(`Program ${progName || `#${r.programId}`}`);
  if (r.campaign) parts.push(`Campaign ${r.campaign}`);
  if (r.locationCode) parts.push(r.locationCode);
  if (r.countryCode) parts.push(r.countryCode);
  return parts;
};

const CommissionRulesTab: React.FC = () => {
  const { networks, notify, params } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState(params.networkId ? String(params.networkId) : '');
  const [rules, setRules] = React.useState<CommissionRule[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<CommissionRule | null | 'new'>(null);
  const [confirm, confirmEl] = useConfirm();
  const [pubs, setPubs] = React.useState<Publisher[]>([]);
  const [progs, setProgs] = React.useState<Program[]>([]);
  React.useEffect(() => {
    api.getPublishers().then(setPubs).catch(() => setPubs([]));
    api.getPrograms().then(setProgs).catch(() => setProgs([]));
  }, []);

  const load = React.useCallback(async () => {
    setRules(null); setError(null);
    try { setRules(await api.getRules(networkId || undefined)); }
    catch (e) { setError(apiError(e, 'Could not load commission rules.')); setRules([]); }
  }, [networkId]);
  React.useEffect(() => { load(); }, [load]);

  const sorted = [...(rules || [])].sort((a, b) => (b.specificity - a.specificity) || Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  const del = async (r: CommissionRule) => {
    if (!(await confirm({ title: `Delete “${r.name}”?`, message: 'Bookings it matched will use the next most specific rule or the network default.', confirmLabel: 'Delete rule', danger: true }))) return;
    try { await api.deleteRule(r.id); setRules(x => (x || []).filter(i => i.id !== r.id)); notify('Rule deleted'); }
    catch (e) { notify(apiError(e, 'Could not delete the rule.'), 'err'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Commission rules</h3>
          <p className="text-sm text-slate-500">Override the network default by publisher, program, campaign, country or location. Most specific first.</p>
        </div>
        <div className="flex items-end gap-2">
          <FilterField label="Network" className="w-44">
            <Select compact value={networkId} onChange={e => setNetworkId(e.target.value)}>
              <option value="">All networks</option>
              {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </FilterField>
          <button className={`${btnPrimary} shrink-0`} onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add rule</button>
        </div>
      </div>
      {error && <ErrorBanner text={error} onRetry={load} />}
      <div className="space-y-4">
        <div className="min-w-0">
          {rules === null ? <SkeletonRows rows={4} /> : !sorted.length ? (
            <EmptyState icon={Percent} title="No rules – network defaults apply" text="Add a rule to pay a different commission for a publisher, campaign or location." />
          ) : (
            <TableCard>
              <thead className="border-b border-slate-100"><tr>
                <th className={th}>Rule</th><th className={th}>Specificity</th><th className={th}>Network</th><th className={th}>Scope</th><th className={th}>Commission</th><th className={th}>Group</th><th className={`${th} text-right`}>Actions</th>
              </tr></thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id} className={`cursor-pointer border-t border-slate-100 first:border-0 hover:bg-sky-50/40 ${r.active ? '' : 'opacity-60'}`} onClick={() => setEditing(r)}>
                    <td className={td}><p className="font-semibold text-slate-900">{r.name}</p>{!r.active && <Badge tone="grey">Inactive</Badge>}</td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1.5" title={`Specificity ${r.specificity}`}>
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={`h-2 w-2 rounded-sm ${i < r.specificity ? 'bg-[#007ac2]' : 'bg-slate-200'}`} />)}</span>
                        <span className="text-xs tabular-nums text-slate-500">{r.specificity}</span>
                      </span>
                    </td>
                    <td className={td}>{r.networkName || networks.find(n => n.id === r.networkId)?.name || <span className="text-slate-400">Any</span>}</td>
                    <td className={td}><div className="flex max-w-[220px] flex-wrap gap-1">{scopeOf(r, pubs.find(p => p.id === r.publisherId)?.name, progs.find(p => p.id === r.programId)?.name).length ? scopeOf(r, pubs.find(p => p.id === r.publisherId)?.name, progs.find(p => p.id === r.programId)?.name).map(s => <Badge key={s} tone="sky">{s}</Badge>) : <span className="text-slate-400">Everything</span>}</div></td>
                    <td className={`${td} whitespace-nowrap font-semibold text-slate-900`}>
                      {r.model === 'TIERED' ? <span title={r.tiers.map(t => `${t.fromBookings}+ → ${t.value}%`).join('\n')}>Tiered · {r.tiers.map(t => `${t.value}%`).join(' / ')}</span> : commissionLabel(r.model, r.value, r.currency)}
                    </td>
                    <td className={`${td} font-mono text-xs`}>{r.commissionGroup || <span className="font-sans text-slate-400">Default</span>}</td>
                    <td className={td} onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <button className={iconBtn} onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} onClick={() => del(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
        </div>
        <PreviewPanel defaultNetworkId={Number(networkId) || null} />
      </div>
      <AnimatePresence>
        {editing && <RuleDrawer key="rd" rule={editing === 'new' ? null : editing} defaultNetworkId={Number(networkId) || networks[0]?.id || null} onClose={() => setEditing(null)}
          onSaved={r => { setRules(x => ((x || []).some(i => i.id === r.id) ? (x || []).map(i => (i.id === r.id ? r : i)) : [r, ...(x || [])])); setEditing(null); notify('Rule saved'); }} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

export default CommissionRulesTab;
