import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import ServerCog from 'lucide-react/dist/esm/icons/server-cog';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Car from 'lucide-react/dist/esm/icons/car';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Link from 'lucide-react/dist/esm/icons/link';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Activity from 'lucide-react/dist/esm/icons/activity';
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert';
import ChartColumn from 'lucide-react/dist/esm/icons/chart-column';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import History from 'lucide-react/dist/esm/icons/history';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check';
import CircleX from 'lucide-react/dist/esm/icons/circle-x';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Play from 'lucide-react/dist/esm/icons/play';
import { ErrorBanner } from '../commercialUi';
import { Badge, Callout, Card, DL, Modal, SkeletonRows, btnDanger, btnPrimary, btnSecondary, inputCls, selectCls } from '../affiliateNetworks/ui';
import { distributionApi, errorText, type Adapter, type CapabilityState, type Channel, type ChecklistItem } from './api';
import { CAP_UI, ReadOnlyNote, StatusBadge, TrackBadge, fmtDateTime, humanize, useDist } from './shared';
import { CredentialsTab, EligibilityTab, MappingTab, PricingTab, DeeplinksTab, BookingsTab, DocumentsTab, ChannelAuditTab } from './ChannelDataTabs';
import { MonitoringView, ReportsView } from './OperationsViews';

type TabKey = 'overview' | 'commercial' | 'integration' | 'credentials' | 'markets' | 'eligibility' | 'locations' | 'categories'
  | 'pricing' | 'deeplinks' | 'bookings' | 'monitoring' | 'errors' | 'reporting' | 'documentation' | 'audit';

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview & readiness', Icon: ShieldCheck },
  { key: 'commercial', label: 'Commercial', Icon: Briefcase },
  { key: 'integration', label: 'Integration', Icon: ServerCog },
  { key: 'credentials', label: 'Credentials & security', Icon: KeyRound },
  { key: 'markets', label: 'Markets & currencies', Icon: Globe },
  { key: 'eligibility', label: 'Inventory eligibility', Icon: Boxes },
  { key: 'locations', label: 'Location mapping', Icon: MapPin },
  { key: 'categories', label: 'Vehicle categories', Icon: Car },
  { key: 'pricing', label: 'Rate & markup rules', Icon: Percent },
  { key: 'deeplinks', label: 'Deeplinks', Icon: Link },
  { key: 'bookings', label: 'Booking sync', Icon: Receipt },
  { key: 'monitoring', label: 'API monitoring', Icon: Activity },
  { key: 'errors', label: 'Error logs', Icon: TriangleAlert },
  { key: 'reporting', label: 'Reporting', Icon: ChartColumn },
  { key: 'documentation', label: 'Documentation', Icon: FileText },
  { key: 'audit', label: 'Audit history', Icon: History },
];

export interface ChannelBundle { channel: Channel; adapter: Adapter; activationBlockers: string[]; deeplinkPattern: string }

const ChannelDetail: React.FC<{ id: number; onBack: () => void }> = ({ id, onBack }) => {
  const [bundle, setBundle] = React.useState<ChannelBundle | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<TabKey>('overview');

  const load = React.useCallback(() => {
    setError(null);
    return distributionApi.channel(id).then(setBundle).catch(e => setError(errorText(e)));
  }, [id]);
  React.useEffect(() => { load(); }, [load]);

  if (error) return <ErrorBanner text={error} onRetry={load} />;
  if (!bundle) return <SkeletonRows rows={5} />;
  const { channel: c, adapter } = bundle;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex min-w-0 items-center gap-3">
          <button className={btnSecondary} onClick={onBack} aria-label="Back to channels"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Channels</span></button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900">{c.name}</h2>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-xs text-slate-500">{c.code} · {humanize(c.category)} · {adapter.name}</p>
          </div>
        </div>
        {!adapter.officialSpecImplemented && <Badge tone="amber">Provider specification not received</Badge>}
      </div>

      <div className="min-w-0 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        <div className="flex gap-1 [overflow-x:auto] [scrollbar-width:none] xl:flex-wrap [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Channel sections">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition ${tab === key ? 'bg-[#007ac2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <OverviewTab bundle={bundle} reload={load} />}
      {tab === 'commercial' && <ChannelForm channel={c} reload={load} fields={COMMERCIAL_FIELDS} title="Commercial information" icon={Briefcase} />}
      {tab === 'integration' && <IntegrationTab bundle={bundle} reload={load} />}
      {tab === 'credentials' && <CredentialsTab bundle={bundle} reload={load} />}
      {tab === 'markets' && <MarketsTab channel={c} reload={load} />}
      {tab === 'eligibility' && <EligibilityTab bundle={bundle} />}
      {tab === 'locations' && <MappingTab bundle={bundle} kind="locations" />}
      {tab === 'categories' && <MappingTab bundle={bundle} kind="categories" />}
      {tab === 'pricing' && <PricingTab bundle={bundle} />}
      {tab === 'deeplinks' && <DeeplinksTab bundle={bundle} />}
      {tab === 'bookings' && <BookingsTab bundle={bundle} />}
      {tab === 'monitoring' && <MonitoringView channelId={c.id} />}
      {tab === 'errors' && <MonitoringView channelId={c.id} onlyErrors />}
      {tab === 'reporting' && <ReportsView channelId={c.id} />}
      {tab === 'documentation' && <DocumentsTab bundle={bundle} />}
      {tab === 'audit' && <ChannelAuditTab bundle={bundle} />}
    </div>
  );
};

export default ChannelDetail;

// ------------------------------------------------------------------ overview & readiness

const STATE_UI: Record<ChecklistItem['state'], { Icon: React.ComponentType<{ className?: string }>; cls: string; label: string }> = {
  DONE: { Icon: CircleCheck, cls: 'text-emerald-600', label: 'Done' },
  PENDING: { Icon: Clock, cls: 'text-slate-400', label: 'Pending' },
  BLOCKED: { Icon: CircleX, cls: 'text-rose-600', label: 'Blocked' },
  NOT_APPLICABLE: { Icon: CircleCheck, cls: 'text-slate-300', label: 'Not applicable' },
};

const AUTO_KEYS = new Set(['credentials_received', 'implementation_complete', 'locations_mapped', 'categories_mapped', 'markets_configured',
  'rates_validated', 'mandatory_fees_validated', 'deeplinks_tested', 'search_restoration_tested', 'production_activation']);

const OverviewTab: React.FC<{ bundle: ChannelBundle; reload: () => Promise<unknown> }> = ({ bundle, reload }) => {
  const { can, meta, toast } = useDist();
  const { channel: c, adapter, activationBlockers } = bundle;
  const [items, setItems] = React.useState<ChecklistItem[] | null>(null);
  const [editing, setEditing] = React.useState<ChecklistItem | null>(null);
  const [activating, setActivating] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState('');
  const [statusNote, setStatusNote] = React.useState('');
  const [test, setTest] = React.useState<any | null>(null);
  const [busy, setBusy] = React.useState(false);

  const loadItems = React.useCallback(() => distributionApi.checklist(c.id).then(setItems).catch(e => toast(errorText(e), 'err')), [c.id, toast]);
  React.useEffect(() => { loadItems(); }, [loadItems]);

  const changeStatus = async () => {
    if (!statusTarget) return;
    setBusy(true);
    try {
      await distributionApi.setStatus(c.id, statusTarget, statusNote);
      toast(`Status changed to ${humanize(statusTarget)}`);
      setStatusTarget('');
      setStatusNote('');
      await reload();
    } catch (e) {
      toast(errorText(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  const runTest = async (env: string) => {
    setBusy(true);
    try {
      setTest({ env, ...(await distributionApi.testConnection(c.id, env)) });
      await reload();
    } catch (e) {
      toast(errorText(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  const sections = items ? Array.from(new Set(items.map(i => i.section))) : [];
  const mandatory = items?.filter(i => i.mandatory) || [];
  const done = mandatory.filter(i => i.state === 'DONE' || i.state === 'NOT_APPLICABLE').length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <Card title="Production readiness" subtitle={items ? `${done} of ${mandatory.length} mandatory requirements met` : 'Loading…'} icon={ShieldCheck}
          actions={<button className={btnSecondary} onClick={() => loadItems()}>Re-check</button>}>
          {items && (
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${mandatory.length ? (done / mandatory.length) * 100 : 0}%` }} />
            </div>
          )}
          {!items ? <SkeletonRows rows={4} height="h-10" /> : sections.map(sec => (
            <div key={sec} className="mb-4 last:mb-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{sec}</p>
              <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                {items.filter(i => i.section === sec).map(i => {
                  const ui = STATE_UI[i.state];
                  const auto = AUTO_KEYS.has(i.itemKey);
                  return (
                    <li key={i.id} className="flex items-start gap-3 px-3 py-2.5">
                      <ui.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ui.cls}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-900">{i.label}</p>
                          {!i.mandatory && <Badge tone="grey">Optional</Badge>}
                          <Badge tone={auto ? 'sky' : i.external ? 'violet' : 'grey'}>{auto ? 'Verified automatically' : i.external ? 'Provider evidence' : 'Internal'}</Badge>
                        </div>
                        {i.evidence && <p className="mt-0.5 break-words text-xs text-slate-600">{i.evidence}</p>}
                        {i.verifiedAt && <p className="mt-0.5 text-[11px] text-slate-400">{ui.label} · {i.verificationSource === 'AUTOMATIC' ? 'system check' : i.verifiedBy} · {fmtDateTime(i.verifiedAt)}</p>}
                      </div>
                      {!auto && can('EDIT_CHANNEL') && (
                        <button className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#007ac2] hover:bg-sky-50" onClick={() => setEditing(i)}>Update</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Card>

        <Card title="Capabilities" subtitle="What this integration can actually do today" icon={ServerCog}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.entries(adapter.capabilities) as [string, CapabilityState][]).map(([cap, state]) => (
              <div key={cap} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">{humanize(cap)}</span>
                <Badge tone={CAP_UI[state].tone}>{CAP_UI[state].label}</Badge>
              </div>
            ))}
          </div>
          {!adapter.officialSpecImplemented && <Callout className="mt-3" tone="warn">{adapter.specificationNote}</Callout>}
        </Card>
      </div>

      <div className="min-w-0 space-y-4">
        <Card title="Status" icon={Rocket}>
          <DL items={[
            ['Lifecycle', <StatusBadge key="s" status={c.status} />],
            ['Commercial', <TrackBadge key="c" value={c.commercialStatus} />],
            ['Implementation', <TrackBadge key="i" value={c.implementationStatus} />],
            ['Validation', <TrackBadge key="v" value={c.validationStatus} />],
            ['Production approval', <TrackBadge key="p" value={c.productionApproval} />],
            ['Activated', c.activatedAt ? `${fmtDateTime(c.activatedAt)} by ${c.activatedBy}` : null],
            ['First production request', fmtDateTime(c.firstProductionRequestAt)],
            ['First attributed booking', fmtDateTime(c.firstAttributedBookingAt)],
          ]} />
          {can('EDIT_CHANNEL') && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <select className={selectCls} value={statusTarget} onChange={e => setStatusTarget(e.target.value)} aria-label="New status">
                <option value="">Change lifecycle status…</option>
                {meta?.statuses.filter(s => s !== 'ACTIVE' && s !== c.status).map(s => <option key={s} value={s}>{humanize(s)}</option>)}
              </select>
              {statusTarget && <>
                <input className={inputCls} placeholder="Reason (kept in the audit history)" value={statusNote} onChange={e => setStatusNote(e.target.value)} />
                <button className={`${btnSecondary} w-full`} disabled={busy} onClick={changeStatus}>Change status</button>
              </>}
            </div>
          )}
        </Card>

        <Card title="Production activation" icon={Lock}>
          {c.status === 'ACTIVE' ? (
            <Callout tone="ok" icon={CircleCheck} title="Live">This channel is active in production.</Callout>
          ) : activationBlockers.length ? (
            <>
              <p className="mb-2 text-sm text-slate-600">Production can be activated once all of these are resolved:</p>
              <ul className="space-y-1.5">
                {activationBlockers.map(b => <li key={b} className="flex gap-2 text-sm text-slate-700"><CircleX className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />{b}</li>)}
              </ul>
            </>
          ) : (
            <>
              <Callout tone="ok" icon={CircleCheck}>Every requirement is met.</Callout>
              {can('ACTIVATE_PRODUCTION')
                ? <button className={`${btnPrimary} mt-3 w-full`} onClick={() => setActivating(true)}><Rocket className="h-4 w-4" />Activate production</button>
                : <p className="mt-3 text-xs text-slate-500">Only a super administrator can activate production.</p>}
            </>
          )}
        </Card>

        <Card title="Connection test" icon={Play}>
          <div className="grid grid-cols-2 gap-2">
            <button className={btnSecondary} disabled={busy || !can('EDIT_CHANNEL')} onClick={() => runTest('SANDBOX')}>Sandbox</button>
            <button className={btnSecondary} disabled={busy || !can('EDIT_CHANNEL')} onClick={() => runTest('PRODUCTION')}>Production</button>
          </div>
          {test && (
            <div className="mt-3 space-y-2">
              <Callout tone={test.result.verified ? 'ok' : 'warn'} title={`${humanize(test.env)}: ${test.result.verified ? 'ready' : 'not verified'}`}>
                {test.result.summary}{test.result.mock ? ' (checked inside HogiCar; no provider was contacted)' : ''}
              </Callout>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">{test.result.details.map((d: string) => <li key={d}>{d}</li>)}</ul>
              <p className="text-[11px] text-slate-400">Correlation id {test.correlationId}</p>
            </div>
          )}
        </Card>
      </div>

      <AnimatePresence>
        {editing && <ChecklistModal channelId={c.id} item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadItems(); reload(); }} />}
        {activating && <ActivateModal channel={c} onClose={() => setActivating(false)} onDone={() => { setActivating(false); reload(); loadItems(); }} />}
      </AnimatePresence>
    </div>
  );
};

const ChecklistModal: React.FC<{ channelId: number; item: ChecklistItem; onClose: () => void; onSaved: () => void }> = ({ channelId, item, onClose, onSaved }) => {
  const { toast } = useDist();
  const [state, setState] = React.useState(item.state);
  const [evidence, setEvidence] = React.useState(item.evidence || '');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.setChecklist(channelId, item.itemKey, state, evidence);
      toast('Requirement updated');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={item.label} eyebrow={item.external ? 'Provider requirement' : 'Internal requirement'} onClose={onClose} busy={busy}
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>Save</button></>}>
      <div className="space-y-3">
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">State</span>
          <select className={selectCls} value={state} onChange={e => setState(e.target.value as ChecklistItem['state'])}>
            <option value="PENDING">Pending</option><option value="DONE">Done</option><option value="BLOCKED">Blocked</option><option value="NOT_APPLICABLE">Not applicable</option>
          </select></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Evidence</span>
          <textarea className={`${inputCls} min-h-[96px] py-2`} value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder="Who confirmed it, when, and a reference (email subject, contract number, document title)" /></label>
        {item.external && <p className="text-xs text-slate-500">This requirement is closed only by evidence from the provider. Internal tests do not count.</p>}
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
};

const ActivateModal: React.FC<{ channel: Channel; onClose: () => void; onDone: () => void }> = ({ channel, onClose, onDone }) => {
  const { toast } = useDist();
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.activate(channel.id, confirm);
      toast(`${channel.name} is live`);
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={`Activate ${channel.name} in production`} eyebrow="Production activation" onClose={onClose} busy={busy}
      footer={<><button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={btnDanger} onClick={go} disabled={busy || confirm !== channel.code}>Activate production</button></>}>
      <p className="text-sm text-slate-600">Production keys start working and live offers can reach customers through this channel. Type <b>{channel.code}</b> to confirm.</p>
      <input className={`${inputCls} mt-3`} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={channel.code} autoFocus />
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
};

// ------------------------------------------------------------------ editable forms

type FieldDef = { key: keyof Channel; label: string; type?: 'text' | 'date' | 'email' | 'number' | 'textarea' | 'select' | 'url'; options?: string[]; help?: string; wide?: boolean };

const COMMERCIAL_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Provider name' },
  { key: 'programmeName', label: 'Programme name' },
  { key: 'website', label: 'Official website', type: 'url' },
  { key: 'businessOwner', label: 'Business owner at HogiCar' },
  { key: 'commercialStatus', label: 'Commercial status', type: 'select', options: [] },
  { key: 'contractStatus', label: 'Contract status / reference' },
  { key: 'applicationDate', label: 'Application date', type: 'date' },
  { key: 'productionApprovalAt', label: 'Production approval date', type: 'date' },
  { key: 'commercialContactName', label: 'Commercial contact' },
  { key: 'commercialContactEmail', label: 'Commercial contact email', type: 'email' },
  { key: 'commercialContactPhone', label: 'Commercial contact phone' },
  { key: 'operationalNotes', label: 'Operational notes', type: 'textarea', wide: true },
];

const INTEGRATION_FIELDS: FieldDef[] = [
  { key: 'adapterKey', label: 'Integration adapter', type: 'select', options: [] },
  { key: 'integrationType', label: 'Integration type', type: 'select', options: [] },
  { key: 'documentationUrl', label: 'Official documentation URL', type: 'url' },
  { key: 'implementationStatus', label: 'Implementation status', type: 'select', options: [] },
  { key: 'validationStatus', label: 'Validation status', type: 'select', options: [], help: 'Mock tests run inside HogiCar; sandbox and provider validation need evidence on the checklist.' },
  { key: 'productionApproval', label: 'Production approval', type: 'select', options: [] },
  { key: 'technicalContactName', label: 'Technical contact' },
  { key: 'technicalContactEmail', label: 'Technical contact email', type: 'email' },
  { key: 'technicalContactPhone', label: 'Technical contact phone' },
  { key: 'documentationReceivedAt', label: 'Documentation received', type: 'date' },
  { key: 'apiAccessRequestedAt', label: 'API access requested', type: 'date' },
  { key: 'credentialsReceivedAt', label: 'Credentials received', type: 'date' },
  { key: 'sandboxAccessAt', label: 'Sandbox access received', type: 'date' },
  { key: 'implementationStartedAt', label: 'Implementation started', type: 'date' },
  { key: 'integrationTestingCompletedAt', label: 'Integration testing completed', type: 'date' },
  { key: 'providerValidationAt', label: 'Provider validation completed', type: 'date' },
  { key: 'offerTtlMinutes', label: 'Offer lifetime (minutes)', type: 'number', help: 'How long an offer reference stays valid before it must be revalidated.' },
  { key: 'attributionWindowDays', label: 'Attribution window (days)', type: 'number' },
];

const ChannelForm: React.FC<{ channel: Channel; reload: () => Promise<unknown>; fields: FieldDef[]; title: string; icon: React.ComponentType<{ className?: string }>; footer?: React.ReactNode }> = ({ channel, reload, fields, title, icon, footer }) => {
  const { can, meta, toast } = useDist();
  const editable = can('EDIT_CHANNEL');
  const initial = React.useMemo(() => Object.fromEntries(fields.map(f => [f.key, channel[f.key] ?? ''])), [channel, fields]);
  const [form, setForm] = React.useState<Record<string, any>>(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setForm(initial), [initial]);

  const options = (key: string): string[] => {
    if (!meta) return [];
    switch (key) {
      case 'commercialStatus': return meta.commercialStatuses;
      case 'implementationStatus': return meta.implementationStatuses;
      case 'validationStatus': return meta.validationStatuses;
      case 'productionApproval': return meta.approvalStatuses;
      case 'integrationType': return meta.integrationTypes;
      case 'adapterKey': return meta.adapters.map(a => a.key);
      default: return [];
    }
  };
  const changed = Object.keys(form).filter(k => String(form[k] ?? '') !== String(initial[k] ?? ''));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      changed.forEach(k => { body[k] = form[k] === '' ? null : form[k]; });
      await distributionApi.updateChannel(channel.id, body);
      toast('Saved');
      await reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={title} icon={icon}>
      {!editable && <div className="mb-3"><ReadOnlyNote what="these details" /></div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(f => (
          <label key={String(f.key)} className={`block min-w-0 ${f.wide || f.type === 'textarea' ? 'sm:col-span-2 xl:col-span-3' : ''}`}>
            <span className="mb-1 block text-xs font-medium text-slate-600">{f.label}</span>
            {f.type === 'select' ? (
              <select className={selectCls} disabled={!editable} value={form[f.key as string] ?? ''} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}>
                {options(String(f.key)).map(o => <option key={o} value={o}>{f.key === 'adapterKey' ? meta?.adapters.find(a => a.key === o)?.name : humanize(o)}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea className={`${inputCls} min-h-[88px] py-2`} disabled={!editable} value={form[f.key as string] ?? ''} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} />
            ) : (
              <input className={inputCls} disabled={!editable} type={f.type === 'url' ? 'url' : f.type || 'text'} value={form[f.key as string] ?? ''}
                onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} />
            )}
            {f.help && <span className="mt-1 block text-[11px] text-slate-500">{f.help}</span>}
          </label>
        ))}
      </div>
      {footer}
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {editable && (
        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button className={btnSecondary} disabled={!changed.length || busy} onClick={() => setForm(initial)}>Discard</button>
          <button className={btnPrimary} disabled={!changed.length || busy} onClick={save}>{busy ? 'Saving…' : `Save${changed.length ? ` (${changed.length})` : ''}`}</button>
        </div>
      )}
    </Card>
  );
};

const IntegrationTab: React.FC<{ bundle: ChannelBundle; reload: () => Promise<unknown> }> = ({ bundle, reload }) => {
  const { channel: c, adapter, deeplinkPattern } = bundle;
  const apiBase = `${window.location.origin}/api/distribution/v1`;
  return (
    <div className="space-y-4">
      <Card title={adapter.name} subtitle={adapter.description} icon={ServerCog}>
        <DL items={[
          ['Official specification implemented', adapter.officialSpecImplemented ? 'Yes' : 'No'],
          ['Specification', adapter.specificationNote],
          ['Needs location mapping', adapter.requiresLocationMapping ? 'Yes' : 'No (uses HogiCar codes)'],
          ['Needs category mapping', adapter.requiresCategoryMapping ? 'Yes' : 'No (uses SIPP codes)'],
          ['Deeplink format', <code key="d" className="break-all text-xs">{deeplinkPattern}</code>],
          ...(adapter.key === 'HOGICAR_API' ? [['Partner API base URL', <code key="a" className="break-all text-xs">{apiBase}</code>] as [string, React.ReactNode],
            ['Partner endpoints', <span key="e" className="text-xs">GET /ping · GET /locations · GET /offers · GET /offers/{'{offerRef}'} — header X-Api-Key</span>] as [string, React.ReactNode]] : []),
        ]} />
      </Card>
      <ChannelForm channel={c} reload={reload} fields={INTEGRATION_FIELDS} title="Integration configuration" icon={ServerCog} />
    </div>
  );
};

const MarketsTab: React.FC<{ channel: Channel; reload: () => Promise<unknown> }> = ({ channel, reload }) => {
  const { can, toast } = useDist();
  const editable = can('EDIT_CHANNEL');
  const [markets, setMarkets] = React.useState(channel.markets || '');
  const [currencies, setCurrencies] = React.useState(channel.currencies || '');
  const [fees, setFees] = React.useState(channel.mandatoryFeesConfirmed);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.updateChannel(channel.id, { markets, currencies, mandatoryFeesConfirmed: fees });
      toast('Markets saved');
      await reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const chips = (v: string) => v.split(/[,\s]+/).filter(Boolean);
  return (
    <Card title="Point-of-sale markets and currencies" icon={Globe}>
      {!editable && <div className="mb-3"><ReadOnlyNote what="markets" /></div>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Markets (ISO country codes, comma separated)</span>
          <input className={inputCls} disabled={!editable} value={markets} onChange={e => setMarkets(e.target.value.toUpperCase())} placeholder="GB, DE, JO, AE" />
          <div className="mt-2 flex flex-wrap gap-1">{chips(markets).map(m => <Badge key={m} tone="blue">{m}</Badge>)}</div>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Accepted currencies (ISO codes)</span>
          <input className={inputCls} disabled={!editable} value={currencies} onChange={e => setCurrencies(e.target.value.toUpperCase())} placeholder="USD, EUR" />
          <div className="mt-2 flex flex-wrap gap-1">{chips(currencies).map(m => <Badge key={m} tone="violet">{m}</Badge>)}</div>
          <span className="mt-1 block text-[11px] text-slate-500">Rates are offered only in their own currency; HogiCar does not convert prices with estimated exchange rates.</span>
        </label>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
        <input type="checkbox" className="mt-1 h-4 w-4" disabled={!editable} checked={fees} onChange={e => setFees(e.target.checked)} />
        <span className="text-sm text-slate-700"><b>Supplier rates include all taxes and mandatory fees.</b> Tick only after checking the supplier contracts for the cars sent to this channel. Advertised totals must include mandatory charges.</span>
      </label>
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {editable && <div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save markets'}</button></div>}
    </Card>
  );
};
