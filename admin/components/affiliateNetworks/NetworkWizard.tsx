import * as React from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Info from 'lucide-react/dist/esm/icons/info';
import Plug from 'lucide-react/dist/esm/icons/plug';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Lock from 'lucide-react/dist/esm/icons/lock';
import {
  affiliateNetworksApi as api, apiError, toNetworkInput,
  type Network, type NetworkInput, type Connector, type CommissionableBasis, type ConsentPolicy,
  TRACKING_METHODS, COMMISSIONABLE_BASES, REPORT_ON_STATUSES, CONSENT_POLICIES,
} from '../../affiliateNetworksApi';
import { Drawer, Field, Toggle, Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { allowedMethods, applyConnectorDefaults, draftFromNetwork, emptyNetwork, BASIS_INFO, CONSENT_INFO } from './networkHelpers';
import { ConnectorLogo, CredentialsEditor, CommissionBasisTable, ConnectionTest } from './networkParts';
import {
  Badge, Callout, ChipInput, MultiPills, NumberInput, Panel, Select, TRACKING_METHOD_LABEL, btnPrimary, btnSecondary, inputCls, humanize, HealthBadge,
} from './ui';

const STEPS = ['Network', 'Tracking', 'Credentials', 'Commission', 'Markets', 'Test', 'Activate'] as const;

const ConnectorCard: React.FC<{ c: Connector; selected: boolean; onSelect: () => void; disabled?: boolean }> = ({ c, selected, onSelect, disabled }) => {
  const direct = c.type === 'HOGICAR_DIRECT';
  return (
    <button type="button" onClick={onSelect} disabled={disabled || direct}
      className={`relative flex min-w-0 flex-col rounded-2xl p-3.5 text-left ring-1 transition ${selected ? 'bg-[#007ac2]/[0.06] ring-2 ring-[#007ac2]' : direct ? 'cursor-default bg-slate-50 ring-slate-200' : 'bg-white ring-slate-200 hover:ring-slate-300'} ${disabled && !selected ? 'opacity-60' : ''}`}>
      <span className="flex items-start gap-3">
        <ConnectorLogo type={c.type} name={c.name} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-900">{c.name}</span>
            {direct ? <Badge tone="blue">In-house</Badge> : c.installed ? <Badge tone="green">Installed</Badge> : <Badge tone="grey">Not installed</Badge>}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{c.description}</span>
        </span>
        {selected && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007ac2] text-white"><Check className="h-3.5 w-3.5" /></span>}
      </span>
      {direct && <span className="mt-2 block rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200">Managed in the existing <b>Affiliates</b> section (?ref=CODE links) – not created here.</span>}
      {!c.installed && !direct && <span className="mt-2 block rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">Connector not installed – network can be saved but cannot send conversions</span>}
    </button>
  );
};

const Stepper: React.FC<{ step: number; maxStep: number; canJump: boolean; onJump: (i: number) => void }> = ({ step, maxStep, canJump, onJump }) => (
  <div className="pb-3">
    <div className="hidden items-center gap-0.5 md:flex">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const reachable = canJump && i <= maxStep;
        return (
          <React.Fragment key={s}>
            <button type="button" disabled={!reachable || active} onClick={() => onJump(i)}
              className={`flex shrink-0 items-center gap-1 rounded-full py-1 pl-1 pr-2 text-[11px] font-semibold transition ${active ? 'bg-[#007ac2]/10 text-[#00649f]' : done ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${active ? 'bg-[#007ac2] text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{done ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className={`h-px min-w-[4px] flex-1 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
          </React.Fragment>
        );
      })}
    </div>
    <div className="md:hidden">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-[#00649f]">Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
        <span className="text-slate-400">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#007ac2] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
    </div>
  </div>
);

const ParamField: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string }> = ({ label, value, onChange, hint }) => (
  <Field label={label} hint={hint}>
    <input className={`${inputCls} font-mono`} value={value} onChange={e => onChange(e.target.value.replace(/[^A-Za-z0-9_.-]/g, ''))} placeholder="not used" />
  </Field>
);

const NetworkWizard: React.FC<{ network?: Network | null; initialStep?: number; onClose: () => void; onDone?: (n: Network) => void }> = ({ network: initial, initialStep = 0, onClose, onDone }) => {
  const { connectors, connectorOf, upsertNetwork, notify, goTo } = useAffiliateNetworks();
  const [network, setNetwork] = React.useState<Network | null>(initial || null);
  const [d, setD] = React.useState<NetworkInput>(() => (initial ? draftFromNetwork(initial) : emptyNetwork()));
  const [step, setStep] = React.useState(initial ? initialStep : 0);
  const [maxStep, setMaxStep] = React.useState(initial ? STEPS.length - 1 : 0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const credSave = React.useRef<(() => Promise<boolean>) | null>(null);
  const registerSave = React.useCallback((fn: () => Promise<boolean>) => { credSave.current = fn; }, []);

  const connector = connectorOf(d.connectorType);
  const allowed = allowedMethods(connector);
  const set = (p: Partial<NetworkInput>) => { setD(x => ({ ...x, ...p })); setError(null); };
  const sync = (n: Network) => { setNetwork(n); upsertNetwork(n); };

  const selectable = connectors.filter(c => c.type !== 'HOGICAR_DIRECT');
  const direct = connectors.find(c => c.type === 'HOGICAR_DIRECT');

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!d.connectorType) return 'Choose a connector.';
      if (!d.name.trim()) return 'Enter a network name.';
      if (!/^[A-Z0-9_]{2,32}$/.test(d.code)) return 'Code: 2–32 capital letters, numbers or _.';
      if (connector?.requiresAdvertiserId && connector.installed && !d.advertiserId.trim()) return `${connector.name} needs your advertiser ID.`;
    }
    if (s === 1) {
      if (!d.trackingMethods.length && allowed.length) return 'Choose at least one tracking method.';
      if (!(d.attributionWindowDays >= 1 && d.attributionWindowDays <= 365)) return 'Attribution window must be 1–365 days.';
      if (!(d.maxRetries >= 0 && d.maxRetries <= 20)) return 'Max retries must be 0–20.';
    }
    if (s === 3) {
      if (!d.defaultCommissionGroup.trim()) return 'Enter a default commission group.';
      if (!d.reportOnStatuses.length) return 'Choose at least one booking status to report on.';
    }
    if (s === 4 && d.currencyMode === 'FIXED' && !/^[A-Z]{3}$/.test(d.fixedCurrency || '')) return 'Enter the fixed currency (3 letters).';
    return null;
  };

  /** Saves the draft: POST the first time (end of step 2), PUT afterwards. */
  const persist = async (): Promise<Network | null> => {
    const body = toNetworkInput({ ...d, fixedCurrency: d.currencyMode === 'FIXED' ? d.fixedCurrency : null });
    const n = network ? await api.updateNetwork(network.id, body) : await api.createNetwork({ ...body, status: 'DRAFT' });
    sync(n);
    setD(draftFromNetwork(n));
    return n;
  };

  const next = async () => {
    const v = validate(step);
    if (v) { setError(v); return; }
    setSaving(true); setError(null);
    try {
      if (step === 0 && network) await persist();
      if (step === 1 || step === 3 || step === 4) {
        const wasNew = !network;
        await persist();
        if (wasNew) notify('Network saved as draft');
      }
      if (step === 2 && credSave.current && !(await credSave.current())) return;
      const to = Math.min(STEPS.length - 1, step + 1);
      setStep(to);
      setMaxStep(m => Math.max(m, to));
    } catch (e) {
      setError(apiError(e, 'Could not save the network.'));
    } finally { setSaving(false); }
  };

  const activate = async () => {
    if (!network) return;
    setSaving(true); setError(null);
    try {
      const n = await api.setNetworkStatus(network.id, 'ACTIVE');
      sync(n);
      notify(`${n.name} is now active`);
      onDone?.(n);
      onClose();
    } catch (e) { setError(apiError(e, 'Could not activate the network.')); }
    finally { setSaving(false); }
  };

  const finish = () => { if (network) onDone?.(network); onClose(); };

  const requiredMissing = (connector?.credentialFields || []).filter(f => f.required && !(network?.credentials || []).find(c => c.key === f.key)?.set);
  const checks: { ok: boolean; label: string; warn?: boolean }[] = [
    { ok: !!network?.connectorInstalled, label: network?.connectorInstalled ? `${connector?.name || 'Connector'} connector installed` : 'Connector not installed – the network cannot be activated' },
    { ok: d.trackingMethods.length > 0, label: `${d.trackingMethods.length} tracking method${d.trackingMethods.length === 1 ? '' : 's'} selected` },
    { ok: !requiredMissing.length, label: requiredMissing.length ? `Missing credentials: ${requiredMissing.map(f => f.label).join(', ')}` : 'Required credentials saved' },
    { ok: !connector?.requiresAdvertiserId || !!d.advertiserId, label: connector?.requiresAdvertiserId ? (d.advertiserId ? 'Advertiser ID set' : 'Advertiser ID missing') : 'No advertiser ID needed' },
    { ok: network?.lastTestResult === 'CONNECTED' || network?.lastTestResult === 'CONFIGURED', warn: true, label: network?.lastTestResult ? `Last connection test: ${humanize(network.lastTestResult)}` : 'Connection not tested yet (recommended)' },
  ];

  const body = (() => {
    switch (step) {
      case 0: return (
        <div className="space-y-5">
          <Panel title="Connector">
            {!initial ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {selectable.map(c => (
                  <ConnectorCard key={c.type} c={c} selected={d.connectorType === c.type}
                    onSelect={() => setD(x => (x.connectorType === c.type ? x : applyConnectorDefaults({ ...x, name: x.connectorType ? '' : x.name, code: x.connectorType ? '' : x.code }, c)))} />
                ))}
                {direct && <ConnectorCard c={direct} selected={false} onSelect={() => {}} />}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <ConnectorLogo type={d.connectorType} name={connector?.name || d.connectorType} />
                <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{connector?.name || d.connectorType}</p><p className="text-xs text-slate-500">The connector can’t be changed after the network is created.</p></div>
                {connector?.docsUrl && <a href={connector.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2] hover:underline">Docs <ExternalLink className="h-3 w-3" /></a>}
              </div>
            )}
            {direct && !initial && (
              <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Your own partners with <code className="font-mono">?ref=</code> links live in <button type="button" className="font-semibold text-[#007ac2] hover:underline" onClick={onClose}>Affiliates</button> (sidebar) and keep working unchanged.</p>
            )}
          </Panel>
          <Panel title="Network details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Awin" /></Field>
              <Field label="Code" hint="Used in feeds, logs and exports."><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={d.code} maxLength={32} onChange={e => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} placeholder="AWIN" /></Field>
            </div>
            <Field label="Description"><textarea className={`${inputCls} h-20 py-2.5`} value={d.description} onChange={e => set({ description: e.target.value })} placeholder="Optional internal note" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Advertiser ID${connector?.requiresAdvertiserId ? ' *' : ''}`} hint="Your merchant/advertiser account at the network."><input className={`${inputCls} font-mono`} value={d.advertiserId} onChange={e => set({ advertiserId: e.target.value.trim() })} placeholder="e.g. 123456" /></Field>
              <Field label="External program ID"><input className={`${inputCls} font-mono`} value={d.externalProgramId} onChange={e => set({ externalProgramId: e.target.value })} placeholder="Optional" /></Field>
              <Field label="Merchant ID"><input className={`${inputCls} font-mono`} value={d.merchantId} onChange={e => set({ merchantId: e.target.value })} placeholder="Optional" /></Field>
              <Field label="Website ID"><input className={`${inputCls} font-mono`} value={d.websiteId} onChange={e => set({ websiteId: e.target.value })} placeholder="Optional" /></Field>
            </div>
          </Panel>
        </div>
      );
      case 1: return (
        <div className="space-y-5">
          <Panel title="Tracking methods">
            <MultiPills options={TRACKING_METHODS} value={d.trackingMethods} onChange={v => set({ trackingMethods: v })} labels={TRACKING_METHOD_LABEL}
              disabled={Object.fromEntries(TRACKING_METHODS.filter(m => !allowed.includes(m)).map(m => [m, `Not supported by the ${connector?.name || 'selected'} connector`]))} />
            <p className="text-xs text-slate-500">Only methods the {connector?.name || 'selected'} connector supports can be chosen. Client-side + server-to-server together give the most reliable tracking.</p>
          </Panel>
          <Panel title="URL parameters" actions={connector && <button type="button" className="text-xs font-semibold text-[#007ac2] hover:underline" onClick={() => setD(x => applyConnectorDefaults({ ...x, name: x.name, code: x.code }, connector))}>Reset to {connector.name} defaults</button>}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ParamField label="Click ID parameter" value={d.clickParam} onChange={v => set({ clickParam: v })} hint="Captured on landing, e.g. ?awc=" />
              <ParamField label="Publisher parameter" value={d.publisherParam} onChange={v => set({ publisherParam: v })} />
              <ParamField label="Sub-ID parameter" value={d.subIdParam} onChange={v => set({ subIdParam: v })} />
              <ParamField label="Click reference parameter" value={d.clickRefParam} onChange={v => set({ clickRefParam: v })} />
              <ParamField label="Campaign parameter" value={d.campaignParam} onChange={v => set({ campaignParam: v })} />
              <ParamField label="Creative parameter" value={d.creativeParam} onChange={v => set({ creativeParam: v })} />
              <ParamField label="Voucher parameter" value={d.voucherParam} onChange={v => set({ voucherParam: v })} />
            </div>
          </Panel>
          <Panel title="Attribution & delivery">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Attribution window" hint="A booking counts if made this long after the click."><NumberInput decimals={false} value={d.attributionWindowDays} onChange={v => set({ attributionWindowDays: v ?? 0 })} suffix="days" /></Field>
              <Field label="Max retries" hint="Failed server-to-server sends are retried with back-off."><NumberInput decimals={false} value={d.maxRetries} onChange={v => set({ maxRetries: v ?? 0 })} /></Field>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {CONSENT_POLICIES.map(p => (
                <button key={p} type="button" onClick={() => set({ consentPolicy: p as ConsentPolicy })}
                  className={`rounded-xl p-3 text-left ring-1 transition ${d.consentPolicy === p ? 'bg-[#007ac2]/[0.06] ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                  <span className="text-sm font-semibold text-slate-900">{CONSENT_INFO[p]?.label || humanize(p)}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{CONSENT_INFO[p]?.text}</span>
                </button>
              ))}
            </div>
            <Toggle checked={d.testMode} onChange={v => set({ testMode: v })} label="Test mode" hint="Conversions are flagged as tests at the network and excluded from payouts." />
            {connector?.capabilities?.productLevel ? (
              <Toggle checked={d.productLevelTracking} onChange={v => set({ productLevelTracking: v })} label="Product-level tracking" hint="Send rental, extras and insurance as separate basket lines." />
            ) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Product-level tracking is not supported by this connector.</p>}
          </Panel>
        </div>
      );
      case 2: return network ? (
        <div className="space-y-4">
          <Callout tone="info" icon={Lock} title="Credentials are write-only">Values are encrypted on the server. After saving you’ll only ever see a masked version.</Callout>
          {!network.connectorInstalled && <Callout tone="warn" title="Connector not installed">You can store credentials now; they will be used once the connector is installed.</Callout>}
          <CredentialsEditor network={network} connector={connector} onChange={sync} registerSave={registerSave} />
        </div>
      ) : null;
      case 3: return (
        <div className="space-y-5">
          <Panel title="Commission">
            <Field label="Default commission group" hint="Network-side group used when no commission rule matches."><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={d.defaultCommissionGroup} onChange={e => set({ defaultCommissionGroup: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} /></Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Commissionable basis</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {COMMISSIONABLE_BASES.map(b => (
                  <button key={b} type="button" onClick={() => set({ commissionableBasis: b as CommissionableBasis })}
                    className={`rounded-xl p-3 text-left ring-1 transition ${d.commissionableBasis === b ? 'bg-[#007ac2]/[0.06] ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                    <span className="text-sm font-semibold text-slate-900">{BASIS_INFO[b].label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{BASIS_INFO[b].text}</span>
                  </button>
                ))}
              </div>
            </div>
            <Toggle checked={d.includeExtras} onChange={v => set({ includeExtras: v })} label="Include extras" hint="Count extras and insurance in the commissionable value (customer total / prepaid bases)." />
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">What counts towards commission</p>
              <CommissionBasisTable basis={d.commissionableBasis} includeExtras={d.includeExtras} />
              <p className="mt-1.5 text-xs text-slate-500">The server calculates the final amount – use “Preview calculation” in Commission rules to check a real booking.</p>
            </div>
          </Panel>
          <Panel title="Report conversions when the booking is">
            <MultiPills options={REPORT_ON_STATUSES} value={d.reportOnStatuses as (typeof REPORT_ON_STATUSES)[number][]} onChange={v => set({ reportOnStatuses: v })} />
            <p className="text-xs text-slate-500">Bookings in other states wait (status <b>Waiting</b>) until they reach one of these.</p>
          </Panel>
        </div>
      );
      case 4: return (
        <div className="space-y-5">
          <Callout tone="info" icon={Info}>Leave a list empty to allow everything. Bookings outside these markets are not reported to this network.</Callout>
          <Panel title="Countries">
            <ChipInput value={d.countries} onChange={v => set({ countries: v })} placeholder="JO, AE…" pattern={/^[A-Z]{2}$/} patternHint="use 2-letter ISO codes" emptyLabel="All countries" />
          </Panel>
          <Panel title="Pick-up locations">
            <ChipInput value={d.locationCodes} onChange={v => set({ locationCodes: v })} placeholder="AMM, AQJ…" pattern={/^[A-Z0-9]{3,8}$/} patternHint="use location codes (e.g. IATA)" emptyLabel="All locations" />
          </Panel>
          <Panel title="Currencies">
            <ChipInput value={d.supportedCurrencies} onChange={v => set({ supportedCurrencies: v })} placeholder="JOD, USD…" pattern={/^[A-Z]{3}$/} patternHint="use 3-letter currency codes" emptyLabel="All currencies" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Report amounts in">
                <Select value={d.currencyMode} onChange={e => set({ currencyMode: e.target.value })}>
                  <option value="BOOKING">The booking currency</option>
                  <option value="FIXED">A fixed currency</option>
                </Select>
              </Field>
              {d.currencyMode === 'FIXED' && (
                <Field label="Fixed currency"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={3} value={d.fixedCurrency || ''} onChange={e => set({ fixedCurrency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} placeholder="USD" /></Field>
              )}
            </div>
          </Panel>
        </div>
      );
      case 5: return network ? (
        <Panel title="Connection test">
          <p className="text-sm text-slate-600">Checks the saved credentials against {connector?.name || 'the network'}. Nothing is reported as a sale.</p>
          <ConnectionTest network={network} connector={connector} onTested={() => api.getNetwork(network.id).then(sync).catch(() => {})} />
        </Panel>
      ) : null;
      case 6: return network ? (
        <div className="space-y-5">
          <Panel title="Ready to go live?">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
              <ConnectorLogo type={network.connectorType} name={network.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{network.name} <span className="font-mono text-xs text-slate-400">{network.code}</span></p>
                <p className="text-xs text-slate-500">{humanize(network.status)} · {network.trackingMethods.map(m => TRACKING_METHOD_LABEL[m] || m).join(', ') || 'no tracking'}</p>
              </div>
              <HealthBadge health={network.health} title={network.healthMessage} />
            </div>
            <ul className="space-y-2">
              {checks.map(c => (
                <li key={c.label} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.ok ? 'bg-emerald-100 text-emerald-700' : c.warn ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {c.ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  </span>
                  <span className={c.ok ? 'text-slate-700' : 'text-slate-900'}>{c.label}</span>
                </li>
              ))}
            </ul>
            {network.testMode && <Callout tone="info" icon={Info}>Test mode is on – conversions will be flagged as tests. Turn it off in Tracking when you’re ready for real sales.</Callout>}
            {!network.connectorInstalled && <Callout tone="warn" icon={Plug} title="Cannot activate">The {connector?.name || network.connectorType} connector is not installed, so this network can’t send conversions. It stays saved as {humanize(network.status).toLowerCase()}.</Callout>}
          </Panel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className={`${btnPrimary} h-11 flex-1`} disabled={saving || !network.connectorInstalled || network.status === 'ACTIVE'} onClick={activate}>
              {saving ? <Spinner light /> : <Rocket className="h-4 w-4" />}{network.status === 'ACTIVE' ? 'Already active' : 'Activate network'}
            </button>
            <button className={`${btnSecondary} h-11 flex-1`} onClick={finish}>{network.status === 'ACTIVE' ? 'Done' : 'Keep as draft & close'}</button>
          </div>
          <button type="button" onClick={() => { finish(); goTo('testing'); }} className="text-sm font-semibold text-[#007ac2] hover:underline">Open the testing tools →</button>
        </div>
      ) : null;
      default: return null;
    }
  })();

  const isLast = step === STEPS.length - 1;
  return (
    <Drawer eyebrow={initial ? 'Edit network' : 'Add network'} title={network?.name || d.name || 'New affiliate network'} onClose={onClose} busy={saving} width="max-w-[820px]"
      headerExtra={<Stepper step={step} maxStep={maxStep} canJump={!!network} onJump={i => { setError(null); setStep(i); }} />}
      footer={!isLast ? (
        <>
          {error && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          <div className="flex gap-2">
            <button type="button" className={`${btnSecondary} h-11 flex-1`} disabled={saving} onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
              {step === 0 ? 'Cancel' : <><ChevronLeft className="h-4 w-4" /> Back</>}
            </button>
            <button type="button" className={`${btnPrimary} h-11 flex-[2]`} disabled={saving} onClick={next}>
              {saving ? <Spinner light /> : null}
              {step === 1 && !network ? 'Save draft & continue' : step === 5 ? 'Continue' : network && step !== 2 ? 'Save & continue' : step === 2 ? 'Continue' : 'Continue'}
              {!saving && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </>
      ) : error ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p> : undefined}>
      {body}
    </Drawer>
  );
};

export default NetworkWizard;
