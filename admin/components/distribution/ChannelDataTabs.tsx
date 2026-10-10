import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Play from 'lucide-react/dist/esm/icons/play';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Car from 'lucide-react/dist/esm/icons/car';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Link from 'lucide-react/dist/esm/icons/link';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import History from 'lucide-react/dist/esm/icons/history';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert';
import { copyText } from '../commercialUi';
import {
  Badge, Callout, Card, EmptyState, Modal, SkeletonRows, TableCard, btnPrimary, btnSecondary, iconBtn, inputCls, selectCls, td, tdRight, th, thRight, useConfirm,
} from '../affiliateNetworks/ui';
import { distributionApi, errorText, type Eligibility } from './api';
import { ReadOnlyNote, fmtDateTime, fmtMoney, humanize, useDist } from './shared';
import type { ChannelBundle } from './ChannelDetail';

const Err: React.FC<{ text: string | null }> = ({ text }) => text ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{text}</p> : null;

const Field: React.FC<{ label: string; children: React.ReactNode; help?: string; wide?: boolean }> = ({ label, children, help, wide }) => (
  <label className={`block min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
    <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
    {children}
    {help && <span className="mt-1 block text-[11px] text-slate-500">{help}</span>}
  </label>
);

/** Small hook for "load a list, show errors". */
function useList<T>(loader: () => Promise<T[]>, deps: React.DependencyList) {
  const [rows, setRows] = React.useState<T[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(() => {
    setError(null);
    return loader().then(setRows).catch(e => setError(errorText(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  React.useEffect(() => { load(); }, [load]);
  return { rows, error, load };
}

// ------------------------------------------------------------------ credentials

export const CredentialsTab: React.FC<{ bundle: ChannelBundle; reload: () => Promise<unknown> }> = ({ bundle, reload }) => {
  const { can, toast } = useDist();
  const { channel: c, adapter } = bundle;
  const [data, setData] = React.useState<{ credentials: any[]; encryptionConfigured: boolean } | null>(null);
  const [form, setForm] = React.useState({ environment: 'SANDBOX', keyName: '', value: '' });
  const [issued, setIssued] = React.useState<{ environment: string; key: string; notice: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, confirmEl] = useConfirm();
  const editable = can('MANAGE_CREDENTIALS');

  const load = React.useCallback(() => distributionApi.credentials(c.id).then(setData).catch(e => setError(errorText(e))), [c.id]);
  React.useEffect(() => { load(); }, [load]);

  const store = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.storeSecret(c.id, form);
      setForm(f => ({ ...f, keyName: '', value: '' }));
      toast('Secret stored encrypted');
      await load();
      await reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const issue = async (env: string) => {
    const existing = data?.credentials.some(x => x.environment === env && x.kind === 'ISSUED_BY_HOGICAR');
    if (existing && !(await confirm({ title: `Rotate the ${humanize(env)} key?`, message: 'The current key stops working immediately. The partner needs the new key before their next request.', confirmLabel: 'Rotate key', danger: true }))) return;
    setBusy(true);
    try {
      setIssued(await distributionApi.issueKey(c.id, env));
      await load();
      await reload();
    } catch (e) {
      toast(errorText(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cred: any) => {
    if (!(await confirm({ title: 'Revoke this credential?', message: `${cred.environment} / ${cred.keyName} will be deleted. This cannot be undone.`, confirmLabel: 'Revoke', danger: true }))) return;
    try {
      await distributionApi.deleteCredential(c.id, cred.id);
      toast('Credential revoked');
      await load();
      await reload();
    } catch (e) {
      toast(errorText(e), 'err');
    }
  };

  return (
    <div className="space-y-4">
      <Callout tone="info" icon={ShieldCheck} title="How secrets are kept">
        Provider secrets are encrypted (AES-256-GCM) and partner API keys are stored only as a hash. No full value is ever shown again after it is saved. Sandbox and production are kept apart.
      </Callout>
      {data && !data.encryptionConfigured && (
        <Callout tone="warn" title="Encryption key missing on the server">Provider secrets cannot be stored until AFFILIATE_MASTER_ENCRYPTION_KEY is set on the backend. Issued partner keys still work (they are hashed, not encrypted).</Callout>
      )}
      {!editable && <ReadOnlyNote what="credentials" />}

      {adapter.key === 'HOGICAR_API' && (
        <Card title="Partner API keys" subtitle="Keys HogiCar issues to this partner for the HogiCar Distribution API" icon={KeyRound}>
          <div className="flex flex-wrap gap-2">
            <button className={btnSecondary} disabled={!editable || busy} onClick={() => issue('SANDBOX')}><KeyRound className="h-4 w-4" />Issue sandbox key</button>
            <button className={btnSecondary} disabled={!editable || busy} onClick={() => issue('PRODUCTION')}><KeyRound className="h-4 w-4" />Issue production key</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Sandbox keys work while the channel is in development, testing or review. Production keys work only once the channel is live.</p>
        </Card>
      )}

      <TableCard>
        <thead className="bg-slate-50/70"><tr><th className={th}>Environment</th><th className={th}>Name</th><th className={th}>Kind</th><th className={th}>Value</th><th className={th}>Updated</th><th className={th}>Last used</th><th className={th} /></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(data?.credentials || []).map(k => (
            <tr key={k.id}>
              <td className={td}><Badge tone={k.environment === 'PRODUCTION' ? 'red' : 'sky'}>{humanize(k.environment)}</Badge></td>
              <td className={`${td} font-mono text-xs`}>{k.keyName}</td>
              <td className={td}>{k.kind === 'ISSUED_BY_HOGICAR' ? 'Issued by HogiCar (hashed)' : 'Provider secret (encrypted)'}</td>
              <td className={`${td} font-mono text-xs`}>{k.masked}</td>
              <td className={`${td} text-xs text-slate-500`}>{fmtDateTime(k.updatedAt)}<br />{k.updatedBy}</td>
              <td className={`${td} text-xs text-slate-500`}>{fmtDateTime(k.lastUsedAt)}</td>
              <td className={td}>{editable && <button className={iconBtn} onClick={() => remove(k)} aria-label="Revoke"><Trash2 className="h-4 w-4" /></button>}</td>
            </tr>
          ))}
          {data && data.credentials.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">No credentials stored.</td></tr>}
        </tbody>
      </TableCard>

      {editable && (
        <Card title="Store a provider secret" subtitle="Credentials the provider gave HogiCar (for example an API key or password)" icon={KeyRound}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Environment"><select className={selectCls} value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}><option value="SANDBOX">Sandbox</option><option value="PRODUCTION">Production</option></select></Field>
            <Field label="Name"><input className={inputCls} value={form.keyName} placeholder="API_KEY" onChange={e => setForm(f => ({ ...f, keyName: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))} /></Field>
            <Field label="Secret value"><input className={inputCls} type="password" autoComplete="new-password" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></Field>
          </div>
          <Err text={error} />
          <div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={busy || !form.keyName || !form.value} onClick={store}>Store encrypted</button></div>
        </Card>
      )}

      <AnimatePresence>
        {issued && (
          <Modal title={`${humanize(issued.environment)} API key`} eyebrow="Shown once" onClose={() => setIssued(null)}
            footer={<button className={btnPrimary} onClick={() => setIssued(null)}>I have stored it safely</button>}>
            <Callout tone="warn">{issued.notice}</Callout>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 p-3">
              <code className="min-w-0 flex-1 break-all text-sm text-emerald-300">{issued.key}</code>
              <button className="shrink-0 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => { copyText(issued.key); toast('Copied'); }} aria-label="Copy key"><Copy className="h-4 w-4" /></button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

// ------------------------------------------------------------------ eligibility

const EMPTY_RULE = { effect: 'EXCLUDE', countryCode: '', city: '', pickupLocation: '', dropoffLocation: '', supplierId: '', carId: '', sippPattern: '', ratePlan: '', market: '', currency: '', dateFrom: '', dateTo: '', reason: '', active: true };

export const RuleModal: React.FC<{ channelId?: number; rule: any | null; onClose: () => void; onSaved: () => void }> = ({ channelId, rule, onClose, onSaved }) => {
  const { meta, toast } = useDist();
  const [form, setForm] = React.useState<any>(rule ? { ...EMPTY_RULE, ...Object.fromEntries(Object.entries(rule).map(([k, v]) => [k, v ?? ''])) } : EMPTY_RULE);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: string, upper = false) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f: any) => ({ ...f, [k]: upper ? e.target.value.toUpperCase() : e.target.value }));
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.saveEligibility(channelId, rule?.id, form);
      toast('Rule saved');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={rule ? `Rule #${rule.id}` : 'New eligibility rule'} eyebrow={channelId ? 'This channel' : 'All channels'} onClose={onClose} busy={busy} width="max-w-2xl"
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy || !form.reason}>Save rule</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Effect" help="INCLUDE narrows the channel to matching inventory; EXCLUDE and STOP SALE remove it.">
          <select className={selectCls} value={form.effect} onChange={set('effect')}>{meta?.ruleEffects.map(r => <option key={r} value={r}>{humanize(r)}</option>)}</select></Field>
        <Field label="Reason (shown wherever the rule removes a car)"><input className={inputCls} value={form.reason} onChange={set('reason')} /></Field>
        <Field label="Country (ISO)"><input className={inputCls} maxLength={2} value={form.countryCode} onChange={set('countryCode', true)} /></Field>
        <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
        <Field label="Pickup location code"><input className={inputCls} value={form.pickupLocation} onChange={set('pickupLocation', true)} /></Field>
        <Field label="Drop-off location code"><input className={inputCls} value={form.dropoffLocation} onChange={set('dropoffLocation', true)} /></Field>
        <Field label="Supplier id"><input className={inputCls} inputMode="numeric" value={form.supplierId} onChange={set('supplierId')} /></Field>
        <Field label="Car id"><input className={inputCls} inputMode="numeric" value={form.carId} onChange={set('carId')} /></Field>
        <Field label="SIPP code or prefix"><input className={inputCls} maxLength={4} value={form.sippPattern} onChange={set('sippPattern', true)} /></Field>
        <Field label="Rate plan (season name)"><input className={inputCls} value={form.ratePlan} onChange={set('ratePlan')} /></Field>
        <Field label="Market (ISO)"><input className={inputCls} maxLength={2} value={form.market} onChange={set('market', true)} /></Field>
        <Field label="Currency"><input className={inputCls} maxLength={3} value={form.currency} onChange={set('currency', true)} /></Field>
        <Field label="Pickups from"><input className={inputCls} type="date" value={form.dateFrom} onChange={set('dateFrom')} /></Field>
        <Field label="Pickups to"><input className={inputCls} type="date" value={form.dateTo} onChange={set('dateTo')} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={e => setForm((f: any) => ({ ...f, active: e.target.checked }))} />Active</label>
      <Err text={error} />
    </Modal>
  );
};

export const describeRule = (r: any) => {
  const parts: string[] = [];
  if (r.countryCode) parts.push(`country ${r.countryCode}`);
  if (r.city) parts.push(`city ${r.city}`);
  if (r.pickupLocation) parts.push(`pickup ${r.pickupLocation}`);
  if (r.dropoffLocation) parts.push(`drop-off ${r.dropoffLocation}`);
  if (r.supplierId) parts.push(`supplier #${r.supplierId}`);
  if (r.carId) parts.push(`car #${r.carId}`);
  if (r.sippPattern) parts.push(`SIPP ${r.sippPattern}*`);
  if (r.ratePlan) parts.push(`rate plan ${r.ratePlan}`);
  if (r.market) parts.push(`market ${r.market}`);
  if (r.currency) parts.push(`currency ${r.currency}`);
  if (r.dateFrom || r.dateTo) parts.push(`pickups ${r.dateFrom || '…'} to ${r.dateTo || '…'}`);
  return parts.length ? parts.join(' · ') : 'Everything';
};

export const RulesTable: React.FC<{ rows: any[]; editable: boolean; onEdit: (r: any) => void; onDelete: (r: any) => void; showScope?: boolean }> = ({ rows, editable, onEdit, onDelete, showScope }) => (
  <TableCard>
    <thead className="bg-slate-50/70"><tr><th className={th}>Effect</th>{showScope && <th className={th}>Scope</th>}<th className={th}>Applies to</th><th className={th}>Reason</th><th className={th}>Status</th><th className={th} /></tr></thead>
    <tbody className="divide-y divide-slate-100">
      {rows.map(r => (
        <tr key={r.id}>
          <td className={td}><Badge tone={r.effect === 'INCLUDE' ? 'green' : r.effect === 'STOP_SALE' ? 'red' : 'amber'}>{humanize(r.effect)}</Badge></td>
          {showScope && <td className={td}>{r.channelId ? 'This channel' : 'All channels'}</td>}
          <td className={`${td} text-xs`}>{describeRule(r)}</td>
          <td className={`${td} text-sm`}>{r.reason}</td>
          <td className={td}>{r.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Off</Badge>}</td>
          <td className={`${td} whitespace-nowrap text-right`}>
            {editable && <><button className={iconBtn} onClick={() => onEdit(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button className={iconBtn} onClick={() => onDelete(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button></>}
          </td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={showScope ? 6 : 5} className="px-5 py-8 text-center text-sm text-slate-500">No rules. Every car that passes the data checks is eligible.</td></tr>}
    </tbody>
  </TableCard>
);

export const EligibilityTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const inv = useList<Eligibility>(() => distributionApi.channelInventory(c.id), [c.id]);
  const rules = useList<any>(() => distributionApi.eligibilityRules(c.id), [c.id]);
  const [report, setReport] = React.useState<any | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'eligible' | 'excluded'>('all');
  const [editing, setEditing] = React.useState<any | null | undefined>(undefined);
  const [confirm, confirmEl] = useConfirm();
  const editable = can('EDIT_INVENTORY');
  const loadReport = React.useCallback(() => distributionApi.validation(c.id).then(setReport).catch(() => undefined), [c.id]);
  React.useEffect(() => { loadReport(); }, [loadReport]);
  const refresh = () => { inv.load(); rules.load(); loadReport(); };

  const del = async (r: any) => {
    if (!(await confirm({ title: 'Delete this rule?', message: r.reason, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await distributionApi.deleteEligibility(r.channelId || undefined, r.id);
      toast('Rule deleted');
      refresh();
    } catch (e) {
      toast(errorText(e), 'err');
    }
  };

  const rows = (inv.rows || []).filter(e => filter === 'all' || (filter === 'eligible' ? e.eligible : !e.eligible));
  const eligibleCount = (inv.rows || []).filter(e => e.eligible).length;

  return (
    <div className="space-y-4">
      {report && (
        <Card title="Validation report" subtitle={`${report.eligible} of ${report.inventory} cars can be distributed`} icon={TriangleAlert}>
          {report.issues.length === 0 ? <Callout tone="ok">No problems found.</Callout> : (
            <ul className="space-y-2">
              {report.issues.map((i: any, n: number) => (
                <li key={n} className="flex items-start gap-2 text-sm">
                  <Badge tone={i.severity === 'ERROR' ? 'red' : i.severity === 'WARNING' ? 'amber' : 'sky'}>{humanize(i.severity)}</Badge>
                  <div className="min-w-0"><p className="text-slate-800">{i.message}{i.count ? ` (${i.count})` : ''}</p>
                    {i.examples?.length > 0 && <p className="text-xs text-slate-500">{i.examples.join(' · ')}</p>}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card title="Eligibility rules" subtitle="Rules for this channel plus rules for all channels" icon={Boxes}
        actions={editable ? <button className={btnPrimary} onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add rule</button> : undefined}
        bodyClassName="p-0">
        {rules.rows ? <RulesTable rows={rules.rows} editable={editable} showScope onEdit={setEditing} onDelete={del} /> : <div className="p-4"><SkeletonRows rows={2} /></div>}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600"><b>{eligibleCount}</b> eligible of {(inv.rows || []).length} cars</p>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {(['all', 'eligible', 'excluded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f ? 'bg-[#007ac2] text-white' : 'text-slate-600'}`}>{humanize(f)}</button>
          ))}
        </div>
      </div>
      {inv.error && <Err text={inv.error} />}
      {!inv.rows ? <SkeletonRows rows={4} /> : (
        <TableCard>
          <thead className="bg-slate-50/70"><tr><th className={th}>Car</th><th className={th}>Supplier</th><th className={th}>Location</th><th className={th}>Rates</th><th className={th}>Distribution</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(e => (
              <tr key={e.item.carId} className="align-top">
                <td className={td}><p className="font-medium text-slate-900">{e.item.make && e.item.model ? `${e.item.make} ${e.item.model}` : e.item.name}</p>
                  <p className="text-xs text-slate-500">#{e.item.carId} · {e.item.sippCode || 'no SIPP'}{e.externalCategory ? ` → ${e.externalCategory}` : ''}</p></td>
                <td className={td}>{e.item.supplierName}</td>
                <td className={td}>{e.item.location ? <><p>{e.item.location.code}{e.externalLocationId ? ` → ${e.externalLocationId}` : ''}</p><p className="text-xs text-slate-500">{[e.item.location.city, e.item.location.countryCode].filter(Boolean).join(', ')}</p></> : <span className="text-slate-400">—</span>}</td>
                <td className={`${td} text-xs`}>{e.item.rates.currentTiers}/{e.item.rates.tiers} current · {e.item.rates.currencies.join(', ') || '—'}<br />{e.item.rates.validUntil ? `until ${e.item.rates.validUntil}` : e.item.rates.currentTiers ? 'open-ended' : ''}</td>
                <td className={td}>
                  {e.eligible ? <Badge tone="green">Eligible</Badge> : <Badge tone="red">Excluded</Badge>}
                  <ul className="mt-1 space-y-0.5">{e.reasons.map((r, i) => <li key={i} className={`text-xs ${r.blocking ? 'text-rose-700' : 'text-slate-500'}`}>{r.message}</li>)}</ul>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">No cars in this view.</td></tr>}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>{editing !== undefined && <RuleModal channelId={c.id} rule={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); refresh(); }} />}</AnimatePresence>
      {confirmEl}
    </div>
  );
};

// ------------------------------------------------------------------ location / category mapping

export const MappingTab: React.FC<{ bundle: ChannelBundle; kind: 'locations' | 'categories' }> = ({ bundle, kind }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const isLoc = kind === 'locations';
  const list = useList<any>(() => distributionApi.mappings(c.id, kind), [c.id, kind]);
  const [missing, setMissing] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<any | null | undefined>(undefined);
  const [confirm, confirmEl] = useConfirm();
  const editable = can('EDIT_CHANNEL');
  const required = isLoc ? bundle.adapter.requiresLocationMapping : bundle.adapter.requiresCategoryMapping;

  React.useEffect(() => {
    distributionApi.validation(c.id).then(r => setMissing(isLoc ? r.unmappedLocations : r.unmappedSipp)).catch(() => undefined);
  }, [c.id, isLoc, list.rows]);

  const del = async (m: any) => {
    if (!(await confirm({ title: 'Remove this mapping?', message: `${isLoc ? m.locationCode : m.sippPattern} → ${m.externalId || m.externalCode}`, confirmLabel: 'Remove', danger: true }))) return;
    try {
      await distributionApi.deleteMapping(c.id, kind, m.id);
      toast('Mapping removed');
      list.load();
    } catch (e) {
      toast(errorText(e), 'err');
    }
  };

  return (
    <div className="space-y-4">
      {!required && <Callout tone="info">{bundle.adapter.name} uses HogiCar's own {isLoc ? 'location codes' : 'SIPP codes'}. Mappings are optional and are shown to the partner when present.</Callout>}
      {required && missing.length > 0 && (
        <Callout tone="warn" title={`${missing.length} ${isLoc ? 'location(s)' : 'SIPP code(s)'} with otherwise eligible cars are not mapped`}>
          <div className="mt-1 flex flex-wrap gap-1">
            {missing.map(m => <button key={m} disabled={!editable} onClick={() => setEditing(isLoc ? { locationCode: m } : { sippPattern: m })}
              className="rounded-lg bg-white px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100">{m} +</button>)}
          </div>
        </Callout>
      )}
      <Card title={isLoc ? 'Location mapping' : 'Vehicle category mapping'}
        subtitle={isLoc ? 'HogiCar pickup location code → provider location id' : 'SIPP/ACRISS code or prefix → provider category (longest prefix wins)'}
        icon={isLoc ? MapPin : Car} bodyClassName="p-0"
        actions={editable ? <button className={btnPrimary} onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add mapping</button> : undefined}>
        {list.error && <div className="p-4"><Err text={list.error} /></div>}
        {!list.rows ? <div className="p-4"><SkeletonRows rows={2} /></div> : (
          <TableCard className="rounded-none shadow-none ring-0">
            <thead className="bg-slate-50/70"><tr><th className={th}>{isLoc ? 'HogiCar code' : 'SIPP'}</th><th className={th}>Provider {isLoc ? 'location id' : 'category'}</th><th className={th}>Provider name</th><th className={th}>Status</th><th className={th}>Updated</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.rows.map(m => (
                <tr key={m.id}>
                  <td className={`${td} font-mono`}>{isLoc ? m.locationCode : m.sippPattern}</td>
                  <td className={`${td} font-mono text-xs`}>{isLoc ? m.externalId : m.externalCode}</td>
                  <td className={td}>{m.externalName || '—'}</td>
                  <td className={td}>{m.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Off</Badge>}</td>
                  <td className={`${td} text-xs text-slate-500`}>{fmtDateTime(m.updatedAt)}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>{editable && <><button className={iconBtn} onClick={() => setEditing(m)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className={iconBtn} onClick={() => del(m)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button></>}</td>
                </tr>
              ))}
              {list.rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No mappings yet.</td></tr>}
            </tbody>
          </TableCard>
        )}
      </Card>
      <AnimatePresence>
        {editing !== undefined && <MappingModal channelId={c.id} kind={kind} value={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); list.load(); }} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

const MappingModal: React.FC<{ channelId: number; kind: 'locations' | 'categories'; value: any | null; onClose: () => void; onSaved: () => void }> = ({ channelId, kind, value, onClose, onSaved }) => {
  const { toast } = useDist();
  const isLoc = kind === 'locations';
  const [form, setForm] = React.useState<any>({
    locationCode: value?.locationCode || '', externalId: value?.externalId || '', sippPattern: value?.sippPattern || '',
    externalCode: value?.externalCode || '', externalName: value?.externalName || '', notes: value?.notes || '', active: value?.active ?? true,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.saveMapping(channelId, kind, value?.id, form);
      toast('Mapping saved');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={value?.id ? 'Edit mapping' : 'New mapping'} eyebrow={isLoc ? 'Location mapping' : 'Vehicle category mapping'} onClose={onClose} busy={busy}
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>Save</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        {isLoc ? <>
          <Field label="HogiCar location code"><input className={inputCls} value={form.locationCode} onChange={e => setForm((f: any) => ({ ...f, locationCode: e.target.value.toUpperCase() }))} placeholder="AMM" /></Field>
          <Field label="Provider location id"><input className={inputCls} value={form.externalId} onChange={e => setForm((f: any) => ({ ...f, externalId: e.target.value }))} /></Field>
        </> : <>
          <Field label="SIPP code or prefix"><input className={inputCls} maxLength={4} value={form.sippPattern} onChange={e => setForm((f: any) => ({ ...f, sippPattern: e.target.value.toUpperCase() }))} placeholder="CDAR or CD" /></Field>
          <Field label="Provider category code"><input className={inputCls} value={form.externalCode} onChange={e => setForm((f: any) => ({ ...f, externalCode: e.target.value }))} /></Field>
        </>}
        <Field label="Provider name" wide><input className={inputCls} value={form.externalName} onChange={e => setForm((f: any) => ({ ...f, externalName: e.target.value }))} /></Field>
        {isLoc && <Field label="Notes" wide><input className={inputCls} value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></Field>}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={e => setForm((f: any) => ({ ...f, active: e.target.checked }))} />Active</label>
      <p className="mt-2 text-xs text-slate-500">Use the identifiers from the provider's official documentation only.</p>
      <Err text={error} />
    </Modal>
  );
};

// ------------------------------------------------------------------ pricing

const EMPTY_PRICING = { name: '', priority: '0', supplierId: '', locationCode: '', market: '', sippPattern: '', effectiveFrom: '', effectiveTo: '',
  adjustPercent: '', adjustFixed: '', commissionModel: 'ABSORBED', commissionPercent: '', commissionFixed: '', minMarginPercent: '', maxMarkupPercent: '', rounding: 'NONE', active: true };

export const PricingTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const list = useList<any>(() => distributionApi.pricingRules(c.id), [c.id]);
  const [editing, setEditing] = React.useState<any | null | undefined>(undefined);
  const [confirm, confirmEl] = useConfirm();
  const editable = can('EDIT_PRICING');

  const del = async (r: any) => {
    if (!(await confirm({ title: 'Delete this pricing rule?', message: r.name || `Rule #${r.id}`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await distributionApi.deletePricing(c.id, r.id);
      toast('Rule deleted');
      list.load();
    } catch (e) {
      toast(errorText(e), 'err');
    }
  };
  const scope = (r: any) => [r.supplierId && `supplier #${r.supplierId}`, r.locationCode && r.locationCode, r.sippPattern && `SIPP ${r.sippPattern}*`, r.market && `market ${r.market}`,
    (r.effectiveFrom || r.effectiveTo) && `${r.effectiveFrom || '…'} to ${r.effectiveTo || '…'}`].filter(Boolean).join(' · ') || 'All offers';

  return (
    <div className="space-y-4">
      <Callout tone="info" icon={Percent} title="How a channel price is built">
        Supplier cost + HogiCar markup = the hogicar.com price. A rule can adjust that price and sets how the channel is paid. ABSORBED commission keeps the customer price and comes out of HogiCar's margin; ADDED TO PRICE grosses the price up once so the margin is kept. Offers that break a minimum margin or maximum markup are not sent.
      </Callout>
      {!editable && <ReadOnlyNote what="pricing rules" />}
      <Card title="Rate and markup rules" subtitle="The most specific matching rule wins, then the higher priority" icon={Percent} bodyClassName="p-0"
        actions={editable ? <button className={btnPrimary} onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add rule</button> : undefined}>
        {!list.rows ? <div className="p-4"><SkeletonRows rows={2} /></div> : (
          <TableCard className="rounded-none shadow-none ring-0">
            <thead className="bg-slate-50/70"><tr><th className={th}>Rule</th><th className={th}>Applies to</th><th className={th}>Price change</th><th className={th}>Commission</th><th className={th}>Guard rails</th><th className={th}>Status</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.rows.map(r => (
                <tr key={r.id}>
                  <td className={td}><p className="font-medium">{r.name || `Rule #${r.id}`}</p><p className="text-xs text-slate-500">priority {r.priority}</p></td>
                  <td className={`${td} text-xs`}>{scope(r)}</td>
                  <td className={`${td} text-xs`}>{[r.adjustPercent && `${r.adjustPercent}%`, r.adjustFixed && `${r.adjustFixed} fixed`, r.rounding !== 'NONE' && humanize(r.rounding)].filter(Boolean).join(' · ') || 'None (website price)'}</td>
                  <td className={`${td} text-xs`}>{humanize(r.commissionModel)}{r.commissionPercent ? ` · ${r.commissionPercent}%` : ''}{r.commissionFixed ? ` + ${r.commissionFixed}` : ''}</td>
                  <td className={`${td} text-xs`}>{[r.minMarginPercent && `margin ≥ ${r.minMarginPercent}%`, r.maxMarkupPercent && `markup ≤ ${r.maxMarkupPercent}%`].filter(Boolean).join(' · ') || '—'}</td>
                  <td className={td}>{r.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Off</Badge>}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>{editable && <><button className={iconBtn} onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className={iconBtn} onClick={() => del(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button></>}</td>
                </tr>
              ))}
              {list.rows.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">No rules: the channel receives the hogicar.com price with no channel commission recorded.</td></tr>}
            </tbody>
          </TableCard>
        )}
      </Card>
      <AnimatePresence>{editing !== undefined && <PricingModal channelId={c.id} rule={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); list.load(); }} />}</AnimatePresence>
      {confirmEl}
    </div>
  );
};

const PricingModal: React.FC<{ channelId: number; rule: any | null; onClose: () => void; onSaved: () => void }> = ({ channelId, rule, onClose, onSaved }) => {
  const { meta, toast } = useDist();
  const [form, setForm] = React.useState<any>(rule ? { ...EMPTY_PRICING, ...Object.fromEntries(Object.entries(rule).map(([k, v]) => [k, v ?? ''])) } : EMPTY_PRICING);
  const [example, setExample] = React.useState({ supplierCost: '120', websitePrice: '144', currency: 'USD' });
  const [preview, setPreview] = React.useState<any | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: string, upper = false) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f: any) => ({ ...f, [k]: upper ? e.target.value.toUpperCase() : e.target.value }));

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      distributionApi.pricingPreview(channelId, { ...form, ...example }).then(setPreview).catch(() => setPreview(null));
    }, 250);
    return () => window.clearTimeout(t);
  }, [channelId, form, example]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.savePricing(channelId, rule?.id, form);
      toast('Pricing rule saved');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={rule ? `Edit ${rule.name || `rule #${rule.id}`}` : 'New pricing rule'} eyebrow="Rate and markup rules" onClose={onClose} busy={busy} width="max-w-3xl"
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>Save rule</button></>}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Field label="Name"><input className={inputCls} value={form.name} onChange={set('name')} /></Field>
          <Field label="Priority"><input className={inputCls} inputMode="numeric" value={form.priority} onChange={set('priority')} /></Field>
          <Field label="Supplier id (optional)"><input className={inputCls} value={form.supplierId} onChange={set('supplierId')} /></Field>
          <Field label="Location code (optional)"><input className={inputCls} value={form.locationCode} onChange={set('locationCode', true)} /></Field>
          <Field label="SIPP prefix (optional)"><input className={inputCls} maxLength={4} value={form.sippPattern} onChange={set('sippPattern', true)} /></Field>
          <Field label="Market (optional)"><input className={inputCls} maxLength={2} value={form.market} onChange={set('market', true)} /></Field>
          <Field label="Effective from"><input type="date" className={inputCls} value={form.effectiveFrom} onChange={set('effectiveFrom')} /></Field>
          <Field label="Effective to"><input type="date" className={inputCls} value={form.effectiveTo} onChange={set('effectiveTo')} /></Field>
          <Field label="Commission model">
            <select className={selectCls} value={form.commissionModel} onChange={set('commissionModel')}>{meta?.commissionModels.map(m => <option key={m} value={m}>{humanize(m)}</option>)}</select></Field>
          <Field label="Commission %"><input className={inputCls} inputMode="decimal" value={form.commissionPercent} onChange={set('commissionPercent')} /></Field>
          <Field label="Commission fixed amount"><input className={inputCls} inputMode="decimal" value={form.commissionFixed} onChange={set('commissionFixed')} /></Field>
          <Field label="Rounding">
            <select className={selectCls} value={form.rounding} onChange={set('rounding')}>{meta?.roundings.map(m => <option key={m} value={m}>{humanize(m)}</option>)}</select></Field>
          <Field label="Price adjustment %" help="Changes the customer price; the channel will then differ from hogicar.com."><input className={inputCls} inputMode="decimal" value={form.adjustPercent} onChange={set('adjustPercent')} /></Field>
          <Field label="Price adjustment fixed"><input className={inputCls} inputMode="decimal" value={form.adjustFixed} onChange={set('adjustFixed')} /></Field>
          <Field label="Minimum margin %"><input className={inputCls} inputMode="decimal" value={form.minMarginPercent} onChange={set('minMarginPercent')} /></Field>
          <Field label="Maximum markup %"><input className={inputCls} inputMode="decimal" value={form.maxMarkupPercent} onChange={set('maxMarkupPercent')} /></Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={form.active} onChange={e => setForm((f: any) => ({ ...f, active: e.target.checked }))} />Active</label>
        </div>
        <div className="space-y-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Worked example</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Supplier cost"><input className={inputCls} value={example.supplierCost} onChange={e => setExample(x => ({ ...x, supplierCost: e.target.value }))} /></Field>
            <Field label="Website price"><input className={inputCls} value={example.websitePrice} onChange={e => setExample(x => ({ ...x, websitePrice: e.target.value }))} /></Field>
          </div>
          {preview ? (
            <dl className="space-y-1 text-sm">
              {[['Supplier cost', preview.supplierCost], ['HogiCar markup', preview.hogicarMarkup], ['Website price', preview.websitePrice], ['Channel adjustment', preview.channelAdjustment],
                ['Customer price', preview.customerPrice], ['Channel commission', preview.channelCommission], ['Net margin', preview.netMargin]].map(([k, v]) => (
                <div key={k as string} className={`flex justify-between gap-2 ${k === 'Customer price' || k === 'Net margin' ? 'font-semibold text-slate-900' : 'text-slate-600'}`}><dt>{k}</dt><dd className="tabular-nums">{fmtMoney(v as number)}</dd></div>
              ))}
              <div className="flex justify-between gap-2 text-slate-600"><dt>Margin</dt><dd>{preview.marginPercent}%</dd></div>
              {!preview.priceParity && <p className="pt-1 text-xs text-amber-700">Customer price differs from hogicar.com.</p>}
              {preview.violations.map((v: string) => <p key={v} className="text-xs text-rose-700">{v} — offer would not be sent.</p>)}
            </dl>
          ) : <p className="text-xs text-slate-500">Enter numbers to see the breakdown.</p>}
        </div>
      </div>
      <Err text={error} />
    </Modal>
  );
};

// ------------------------------------------------------------------ deeplinks & test search

const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export const DeeplinksTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const clicks = useList<any>(() => distributionApi.deeplinks(c.id), [c.id]);
  const markets = (c.markets || '').split(',').filter(Boolean);
  const [form, setForm] = React.useState({ pickup: '', pickupDate: plusDays(14), pickupTime: '10:00', dropoffDate: plusDays(17), dropoffTime: '10:00', market: markets[0] || '', currency: '', driverAge: '' });
  const [result, setResult] = React.useState<any | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await distributionApi.testOffers(c.id, form));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const set = (k: string, upper = false) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: upper ? e.target.value.toUpperCase() : e.target.value }));

  return (
    <div className="space-y-4">
      <Card title="Deeplinks" subtitle="Every offer links to the HogiCar results page with the search restored. Prices are never read from the link." icon={Link}>
        <p className="text-sm text-slate-600">Format: <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-xs">{bundle.deeplinkPattern}</code></p>
        <p className="mt-1 text-xs text-slate-500">The reference is random and expires after {c.offerTtlMinutes} minutes. Opening it revalidates the car and price; if the price changed the customer sees a clear notice; if the car is gone, the rest of the search is shown.</p>
      </Card>

      <Card title="Test availability and offers" subtitle="Runs the live engine for this channel (recorded as an internal test). Open a deeplink to test search restoration." icon={Play}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Pickup (HogiCar code or provider id)"><input className={inputCls} value={form.pickup} onChange={set('pickup', true)} placeholder="AMM" /></Field>
          <Field label="Market"><input className={inputCls} value={form.market} maxLength={2} onChange={set('market', true)} /></Field>
          <Field label="Pickup date"><input type="date" className={inputCls} value={form.pickupDate} onChange={set('pickupDate')} /></Field>
          <Field label="Pickup time"><input type="time" className={inputCls} value={form.pickupTime} onChange={set('pickupTime')} /></Field>
          <Field label="Return date"><input type="date" className={inputCls} value={form.dropoffDate} onChange={set('dropoffDate')} /></Field>
          <Field label="Return time"><input type="time" className={inputCls} value={form.dropoffTime} onChange={set('dropoffTime')} /></Field>
          <Field label="Currency (optional)"><input className={inputCls} maxLength={3} value={form.currency} onChange={set('currency', true)} /></Field>
          <Field label="Driver age (optional)"><input className={inputCls} inputMode="numeric" value={form.driverAge} onChange={set('driverAge')} /></Field>
        </div>
        <div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={busy || !can('EDIT_CHANNEL') || !form.pickup} onClick={run}><Play className="h-4 w-4" />{busy ? 'Searching…' : 'Run search'}</button></div>
        <Err text={error} />
        {result && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600"><b>{result.offers.length}</b> offers · {result.excluded.length} excluded · {result.candidates} candidates · {result.latencyMs} ms</p>
            {result.offers.map((o: any) => (
              <div key={o.offerRef} className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 ring-1 ring-slate-200">
                <div className="min-w-0"><p className="font-medium text-slate-900">{o.vehicle.description} <span className="text-xs text-slate-500">{o.vehicle.sippCode}</span></p>
                  <p className="text-xs text-slate-500">{o.supplier.name} · {o.location.name} · {o.rental.days} days · ref {o.offerRef}</p></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{fmtMoney(o.price.total, o.price.currency)}</span>
                  <a className={btnSecondary} href={o.deeplink.replace(/^https?:\/\/[^/]+/, window.location.origin)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open</a>
                  <button className={iconBtn} onClick={() => { copyText(o.deeplink); toast('Deeplink copied'); }} aria-label="Copy deeplink"><Copy className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {result.excluded.length > 0 && (
              <details className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200">
                <summary className="cursor-pointer font-medium text-slate-700">Why cars were excluded</summary>
                <ul className="mt-2 space-y-1">{result.excluded.map((x: any, i: number) => <li key={i} className="text-xs text-slate-600">#{x.carId} {x.supplierName} {x.sippCode}: <b>{humanize(x.code)}</b> — {x.message}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </Card>

      <Card title="Recent clicks" icon={Link} bodyClassName="p-0" actions={<button className={btnSecondary} onClick={() => clicks.load()}>Refresh</button>}>
        {!clicks.rows ? <div className="p-4"><SkeletonRows rows={2} /></div> : (
          <TableCard className="rounded-none shadow-none ring-0">
            <thead className="bg-slate-50/70"><tr><th className={th}>When</th><th className={th}>Outcome</th><th className={th}>Search</th><th className={thRight}>Offer price</th><th className={thRight}>Price on arrival</th><th className={th}>Campaign</th><th className={th}>Booking</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {clicks.rows.map(k => (
                <tr key={k.id}>
                  <td className={`${td} whitespace-nowrap text-xs`}>{fmtDateTime(k.clickedAt)}</td>
                  <td className={td}><Badge tone={k.outcome === 'RESTORED' ? 'green' : k.outcome === 'PRICE_CHANGED' ? 'amber' : 'red'}>{humanize(k.outcome)}</Badge></td>
                  <td className={`${td} text-xs`}>{k.pickupCode ? `${k.pickupCode} · ${k.pickupDate} → ${k.dropoffDate}` : '—'}</td>
                  <td className={tdRight}>{fmtMoney(k.offerPrice, k.currency)}</td>
                  <td className={tdRight}>{fmtMoney(k.currentPrice, k.currency)}</td>
                  <td className={`${td} text-xs`}>{k.campaign || '—'}</td>
                  <td className={`${td} text-xs`}>{k.bookingRef || '—'}</td>
                </tr>
              ))}
              {clicks.rows.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">No clicks recorded yet.</td></tr>}
            </tbody>
          </TableCard>
        )}
      </Card>
    </div>
  );
};

// ------------------------------------------------------------------ bookings

export const BookingsTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const list = useList<any>(() => distributionApi.bookings(bundle.channel.id), [bundle.channel.id]);
  return (
    <div className="space-y-4">
      <Callout tone="info" icon={Receipt}>Customers from a channel book through the normal HogiCar checkout. Each booking is linked to its click after it is saved; its status is read live from HogiCar's bookings. Commission is an estimate from the pricing rules, not a provider statement.</Callout>
      {!list.rows ? <SkeletonRows rows={3} /> : list.rows.length === 0 ? <EmptyState icon={Receipt} title="No attributed bookings yet" compact /> : (
        <TableCard>
          <thead className="bg-slate-50/70"><tr><th className={th}>Booking</th><th className={th}>Status</th><th className={th}>Dates</th><th className={th}>Supplier</th><th className={thRight}>Offer price</th><th className={thRight}>Booked price</th><th className={thRight}>Est. commission</th><th className={th}>Matches offer</th><th className={th}>Attributed</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.rows.map(r => (
              <tr key={r.attribution.id}>
                <td className={`${td} font-mono text-xs`}>{r.attribution.bookingRef}</td>
                <td className={td}><Badge tone={r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'COMPLETED' ? 'green' : r.bookingStatus === 'CANCELLED' ? 'red' : 'amber'}>{humanize(r.bookingStatus || 'unknown')}</Badge></td>
                <td className={`${td} text-xs`}>{r.pickupDate} → {r.dropoffDate}</td>
                <td className={td}>{r.supplierName}</td>
                <td className={tdRight}>{fmtMoney(r.attribution.offerPrice, r.attribution.currency)}</td>
                <td className={tdRight}>{fmtMoney(r.attribution.bookedPrice, r.attribution.currency)}</td>
                <td className={tdRight}>{fmtMoney(r.attribution.estimatedCommission, r.attribution.currency)}</td>
                <td className={td}>{r.attribution.matchesOffer ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Different car/dates</Badge>}</td>
                <td className={`${td} whitespace-nowrap text-xs`}>{fmtDateTime(r.attribution.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ documentation

export const DocumentsTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const list = useList<any>(() => distributionApi.documents(c.id), [c.id]);
  const [form, setForm] = React.useState({ title: '', docType: 'API_SPEC', url: '', version: '', receivedOn: '', notes: '' });
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, confirmEl] = useConfirm();
  const editable = can('EDIT_CHANNEL');
  const add = async () => {
    setError(null);
    try {
      await distributionApi.addDocument(c.id, form);
      setForm({ title: '', docType: 'API_SPEC', url: '', version: '', receivedOn: '', notes: '' });
      toast('Document recorded');
      list.load();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const del = async (d: any) => {
    if (!(await confirm({ title: 'Remove this document reference?', message: d.title, confirmLabel: 'Remove', danger: true }))) return;
    await distributionApi.deleteDocument(c.id, d.id).then(() => list.load()).catch(e => toast(errorText(e), 'err'));
  };
  return (
    <div className="space-y-4">
      {c.documentationUrl && <Callout tone="info" icon={FileText}>Official documentation: <a className="font-semibold underline" href={c.documentationUrl} target="_blank" rel="noreferrer">{c.documentationUrl}</a></Callout>}
      {!list.rows ? <SkeletonRows rows={2} /> : (
        <TableCard>
          <thead className="bg-slate-50/70"><tr><th className={th}>Document</th><th className={th}>Type</th><th className={th}>Version</th><th className={th}>Received</th><th className={th}>Added</th><th className={th} /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.rows.map(d => (
              <tr key={d.id}>
                <td className={td}>{d.url ? <a className="font-medium text-[#007ac2] hover:underline" href={d.url} target="_blank" rel="noreferrer">{d.title}</a> : <span className="font-medium">{d.title}</span>}{d.notes && <p className="text-xs text-slate-500">{d.notes}</p>}</td>
                <td className={td}><Badge tone="blue">{humanize(d.docType)}</Badge></td>
                <td className={td}>{d.version || '—'}</td>
                <td className={`${td} text-xs`}>{d.receivedOn || '—'}</td>
                <td className={`${td} text-xs text-slate-500`}>{fmtDateTime(d.createdAt)}<br />{d.addedBy}</td>
                <td className={td}>{editable && <button className={iconBtn} onClick={() => del(d)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>}</td>
              </tr>
            ))}
            {list.rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No documents recorded. Add the provider's specification, contract and approvals as they arrive.</td></tr>}
          </tbody>
        </TableCard>
      )}
      {editable && (
        <Card title="Record a document" subtitle="Store a link to the file in your secure storage; HogiCar keeps the reference and who added it" icon={FileText}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Title"><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
            <Field label="Type"><select className={selectCls} value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))}>
              {['API_SPEC', 'CONTRACT', 'CORRESPONDENCE', 'TEST_EVIDENCE', 'APPROVAL', 'OTHER'].map(t => <option key={t} value={t}>{humanize(t)}</option>)}</select></Field>
            <Field label="Link (https)"><input className={inputCls} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></Field>
            <Field label="Version"><input className={inputCls} value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} /></Field>
            <Field label="Received on"><input type="date" className={inputCls} value={form.receivedOn} onChange={e => setForm(f => ({ ...f, receivedOn: e.target.value }))} /></Field>
            <Field label="Notes"><input className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
          </div>
          <Err text={error} />
          <div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={!form.title} onClick={add}><Plus className="h-4 w-4" />Add document</button></div>
        </Card>
      )}
      {confirmEl}
    </div>
  );
};

// ------------------------------------------------------------------ audit

export const AuditList: React.FC<{ rows: any[] | null }> = ({ rows }) => {
  if (!rows) return <SkeletonRows rows={3} />;
  if (rows.length === 0) return <EmptyState icon={History} title="No changes recorded yet" compact />;
  return (
    <TableCard>
      <thead className="bg-slate-50/70"><tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>Action</th><th className={th}>Changes</th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(a => {
          let changes: any[] = [];
          try { changes = a.changesJson ? JSON.parse(a.changesJson) : []; } catch { changes = []; }
          return (
            <tr key={a.id} className="align-top">
              <td className={`${td} whitespace-nowrap text-xs`}>{fmtDateTime(a.createdAt)}</td>
              <td className={`${td} text-xs`}>{a.actor}</td>
              <td className={td}><Badge tone="blue">{humanize(a.action)}</Badge>{a.entityType && <p className="mt-0.5 text-[11px] text-slate-400">{a.entityType} {a.entityId}</p>}</td>
              <td className={`${td} text-xs`}>
                {changes.length === 0 ? '—' : <ul className="space-y-0.5">{changes.slice(0, 8).map((ch, i) => (
                  <li key={i}><b>{ch.field}</b>: <span className="text-slate-400 line-through">{ch.old == null ? '∅' : String(ch.old)}</span> → {ch.new == null ? '∅' : String(ch.new)}</li>
                ))}{changes.length > 8 && <li className="text-slate-400">+{changes.length - 8} more</li>}</ul>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableCard>
  );
};

export const ChannelAuditTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const list = useList<any>(() => distributionApi.channelAudit(bundle.channel.id), [bundle.channel.id]);
  return <AuditList rows={list.rows} />;
};

