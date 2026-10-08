import * as React from 'react';
import MousePointer from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import Calculator from 'lucide-react/dist/esm/icons/calculator';
import Send from 'lucide-react/dist/esm/icons/send';
import CopyCheck from 'lucide-react/dist/esm/icons/copy-check';
import ListChecks from 'lucide-react/dist/esm/icons/list-checks';
import Play from 'lucide-react/dist/esm/icons/play';
import Check from 'lucide-react/dist/esm/icons/check';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import {
  affiliateNetworksApi as api, apiError, type AttributionTestResult, type ConversionTestResult, type S2sTestResult, type DedupeTestResult,
} from '../../affiliateNetworksApi';
import { Field, Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { Badge, Callout, Card, DL, JsonView, PassFail, Select, btnPrimary, btnSecondary, inputCls, safeStorage, useConfirm } from './ui';

const useRunner = <T,>() => {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (fn: () => Promise<T>) => {
    setBusy(true); setError(null); setResult(null);
    try { setResult(await fn()); } catch (e) { setError(apiError(e, 'The test could not run.')); } finally { setBusy(false); }
  };
  return { busy, result, error, run };
};

const RunButton: React.FC<{ busy: boolean; onClick: () => void; label: string; disabled?: boolean }> = ({ busy, onClick, label, disabled }) => (
  <button className={`${btnPrimary} w-full sm:w-auto`} onClick={onClick} disabled={busy || disabled}>{busy ? <Spinner light /> : <Play className="h-4 w-4" />}{label}</button>
);

const ResultBox: React.FC<{ ok: boolean; title: string; children?: React.ReactNode }> = ({ ok, title, children }) => (
  <div className={`space-y-3 rounded-xl p-3.5 ring-1 ${ok ? 'bg-emerald-50/60 ring-emerald-200' : 'bg-rose-50/60 ring-rose-200'}`}>
    <div className="flex items-center gap-2"><PassFail ok={ok} /><p className="text-sm font-semibold text-slate-900">{title}</p></div>
    {children}
  </div>
);

const NetworkSelect: React.FC<{ value: number | null; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const { networks } = useAffiliateNetworks();
  return (
    <Select value={value ?? ''} onChange={e => onChange(Number(e.target.value))}>
      {!networks.length && <option value="">No networks</option>}
      {networks.map(n => <option key={n.id} value={n.id}>{n.name}{n.testMode ? ' (test mode)' : ''}</option>)}
    </Select>
  );
};

const AttributionTest: React.FC = () => {
  const { settings } = useAffiliateNetworks();
  const base = (settings?.publicBaseUrl || 'https://www.hogicar.com').replace(/\/$/, '');
  const [url, setUrl] = React.useState(`${base}/?awc=TEST_AWC_123&affid=999`);
  const r = useRunner<AttributionTestResult>();
  return (
    <Card title="Attribution capture" subtitle="Would this landing URL be recognised, and what would be stored?" icon={MousePointer}>
      <div className="space-y-3">
        <Field label="Landing URL"><input className={`${inputCls} font-mono text-sm`} value={url} onChange={e => setUrl(e.target.value)} /></Field>
        <RunButton busy={r.busy} onClick={() => r.run(() => api.testAttribution(url.trim()))} label="Test URL" disabled={!url.trim()} />
        {r.error && <Callout tone="error">{r.error}</Callout>}
        {r.result && (
          <ResultBox ok={r.result.matched && !r.result.problems?.length} title={r.result.matched ? `Matched ${r.result.networkName || 'a network'}` : 'No network matched'}>
            {!!r.result.problems?.length && <ul className="list-disc space-y-0.5 pl-5 text-sm text-rose-800">{r.result.problems.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            {r.result.captured && <div><p className="mb-1 text-xs font-semibold text-slate-500">Captured</p><JsonView value={r.result.captured} maxHeight="max-h-56" /></div>}
          </ResultBox>
        )}
      </div>
    </Card>
  );
};

const ConversionDryRun: React.FC = () => {
  const { networks } = useAffiliateNetworks();
  const [ref, setRef] = React.useState('');
  const [networkId, setNetworkId] = React.useState<number | null>(networks[0]?.id ?? null);
  React.useEffect(() => { if (networkId == null && networks[0]) setNetworkId(networks[0].id); }, [networks, networkId]);
  const r = useRunner<ConversionTestResult>();
  return (
    <Card title="Conversion dry run" subtitle="Eligibility, commission and the exact payloads – nothing is sent." icon={Calculator}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Booking ref"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="H12345" /></Field>
          <Field label="Network"><NetworkSelect value={networkId} onChange={setNetworkId} /></Field>
        </div>
        <RunButton busy={r.busy} onClick={() => r.run(() => api.testConversion(ref.trim(), networkId!))} label="Run dry run" disabled={!ref.trim() || !networkId} />
        {r.error && <Callout tone="error">{r.error}</Callout>}
        {r.result && (
          <ResultBox ok={r.result.eligible} title={r.result.eligible ? 'Eligible – would be reported' : 'Not eligible'}>
            {!!r.result.reasons?.length && <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">{r.result.reasons.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            {r.result.calculation && <div><p className="mb-1 text-xs font-semibold text-slate-500">Calculation</p><JsonView value={r.result.calculation} maxHeight="max-h-48" /></div>}
            {r.result.clientTag != null && <div><p className="mb-1 text-xs font-semibold text-slate-500">Client-side tag</p><JsonView value={r.result.clientTag} maxHeight="max-h-48" /></div>}
            {r.result.serverPayload != null && <div><p className="mb-1 text-xs font-semibold text-slate-500">Server-to-server payload</p><JsonView value={r.result.serverPayload} maxHeight="max-h-48" /></div>}
          </ResultBox>
        )}
      </div>
    </Card>
  );
};

const S2sTest: React.FC = () => {
  const { networks } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState<number | null>(networks[0]?.id ?? null);
  React.useEffect(() => { if (networkId == null && networks[0]) setNetworkId(networks[0].id); }, [networks, networkId]);
  const [confirm, confirmEl] = useConfirm();
  const r = useRunner<S2sTestResult>();
  const net = networks.find(n => n.id === networkId);
  const go = async () => {
    if (!(await confirm({ title: 'Send a test order?', message: <>A clearly labelled <code className="font-mono">TEST-…</code> order is sent to {net?.name || 'the network'} through the real connector. {net?.testMode ? 'The network is in test mode.' : <b>The network is NOT in test mode – ask the network to decline it.</b>}</>, confirmLabel: 'Send test order' }))) return;
    r.run(() => api.testS2s(networkId!));
  };
  return (
    <Card title="Server-to-server test order" subtitle="Sends one TEST-… order through the connector." icon={Send}>
      <div className="space-y-3">
        <Field label="Network"><NetworkSelect value={networkId} onChange={setNetworkId} /></Field>
        {net && !net.testMode && <Callout tone="warn" icon={AlertTriangle}>{net.name} is not in test mode.</Callout>}
        <RunButton busy={r.busy} onClick={go} label="Send test order" disabled={!networkId} />
        {r.error && <Callout tone="error">{r.error}</Callout>}
        {r.result && (
          <ResultBox ok={r.result.success} title={r.result.success ? 'Accepted by the network' : 'Rejected or failed'}>
            <DL items={[['HTTP status', r.result.httpStatus != null ? <Badge key="h" tone={r.result.httpStatus < 300 ? 'green' : 'red'}>{r.result.httpStatus}</Badge> : null]]} />
            {r.result.response && <div><p className="mb-1 text-xs font-semibold text-slate-500">Response</p><JsonView value={r.result.response} maxHeight="max-h-48" /></div>}
            <div><p className="mb-1 text-xs font-semibold text-slate-500">Payload sent</p><JsonView value={r.result.payload} maxHeight="max-h-48" /></div>
          </ResultBox>
        )}
      </div>
      {confirmEl}
    </Card>
  );
};

const DedupeTest: React.FC = () => {
  const [ref, setRef] = React.useState('');
  const r = useRunner<DedupeTestResult>();
  return (
    <Card title="Duplicate protection" subtitle="Checks that a booking can only ever produce one conversion per network." icon={CopyCheck}>
      <div className="space-y-3">
        <Field label="Booking ref"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="H12345" /></Field>
        <RunButton busy={r.busy} onClick={() => r.run(() => api.testDedupe(ref.trim()))} label="Check duplicates" disabled={!ref.trim()} />
        {r.error && <Callout tone="error">{r.error}</Callout>}
        {r.result && (
          <ResultBox ok={r.result.duplicatesBlocked && r.result.conversions <= 1} title={`${r.result.conversions} conversion${r.result.conversions === 1 ? '' : 's'} · duplicates ${r.result.duplicatesBlocked ? 'blocked' : 'NOT blocked'}`}>
            {r.result.message && <p className="text-sm text-slate-700">{r.result.message}</p>}
          </ResultBox>
        )}
      </div>
    </Card>
  );
};

export const AWIN_SCENARIOS: { id: string; title: string; how: string }[] = [
  { id: 'direct', title: 'Direct visitor is not attributed', how: 'Open the site without parameters, book – no network conversion is created.' },
  { id: 'capture', title: '?awc=TEST_AWC_123 is captured', how: 'Land on /?awc=TEST_AWC_123 – Logs show ATTRIBUTION_CAPTURED.' },
  { id: 'persist-search', title: 'Attribution persists through search', how: 'Search for a car after landing – the click is still attached.' },
  { id: 'persist-select', title: 'Persists through car selection', how: 'Open a car and the extras page – attribution unchanged.' },
  { id: 'persist-booking', title: 'Persists through booking', how: 'Complete a booking – BOOKING_ATTRIBUTED with the same click ID.' },
  { id: 'tag-once', title: 'Conversion tag fires once', how: 'Confirmation page serves the Awin tag exactly once (CLIENT_TAG_SERVED).' },
  { id: 'pixel', title: 'Fallback pixel fires', how: 'With JavaScript blocked, the fallback image pixel is requested.' },
  { id: 's2s-one', title: 'One server-to-server conversion', how: 'Exactly one CONVERSION_SENT for the booking.' },
  { id: 'refresh', title: 'Refresh creates no duplicate', how: 'Reload the confirmation page – no second tag or conversion.' },
  { id: 'revisit', title: 'Revisit creates no duplicate', how: 'Open the booking again later / from email – still one conversion.' },
  { id: 'payment-redirect', title: 'Payment redirect keeps attribution', how: 'Pay with a 3-D Secure / redirect card – attribution survives the round-trip.' },
  { id: 'api-down', title: 'Awin API down → booking still succeeds', how: 'Break the API key – booking completes, conversion goes to RETRYING.' },
  { id: 'retry-one', title: 'Retry produces one transaction', how: 'Restore the key and retry – Awin shows a single transaction.' },
  { id: 'no-click', title: 'No click → no conversion', how: 'Book in a fresh browser without a network click – nothing is reported.' },
  { id: 'consent', title: 'Consent rejected behaviour', how: 'Reject marketing cookies – behaviour follows the network’s consent policy.' },
];

const CHECK_KEY = 'hogicar.affiliateNetworks.awinChecklist';

const Checklist: React.FC = () => {
  const [done, setDone] = React.useState<Record<string, boolean>>(() => {
    try { return JSON.parse(safeStorage.get(CHECK_KEY) || '{}'); } catch { return {}; }
  });
  React.useEffect(() => { safeStorage.set(CHECK_KEY, JSON.stringify(done)); }, [done]);
  const count = AWIN_SCENARIOS.filter(s => done[s.id]).length;
  return (
    <Card title="Awin go-live checklist" subtitle="Manual scenarios to walk through before switching off test mode. Ticks are saved in this browser." icon={ListChecks}
      actions={<>
        <Badge tone={count === AWIN_SCENARIOS.length ? 'green' : 'grey'}>{count} / {AWIN_SCENARIOS.length}</Badge>
        <button className={`${btnSecondary} h-8 px-2.5 text-xs`} onClick={() => setDone({})}><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
      </>}>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(count / AWIN_SCENARIOS.length) * 100}%` }} /></div>
      <ol className="grid gap-2 md:grid-cols-2">
        {AWIN_SCENARIOS.map((s, i) => (
          <li key={s.id}>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition ${done[s.id] ? 'bg-emerald-50/60 ring-emerald-200' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
              <input type="checkbox" className="sr-only" checked={!!done[s.id]} onChange={e => setDone(d => ({ ...d, [s.id]: e.target.checked }))} />
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ${done[s.id] ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-white ring-slate-300'}`}>{done[s.id] && <Check className="h-3.5 w-3.5" />}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900"><span className="mr-1.5 tabular-nums text-slate-400">{i + 1}.</span>{s.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{s.how}</span>
              </span>
            </label>
          </li>
        ))}
      </ol>
    </Card>
  );
};

const TestingTab: React.FC = () => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">Testing</h3>
      <p className="text-sm text-slate-500">Verify capture, calculation and delivery before going live. Only the test order below contacts a network.</p>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <AttributionTest />
      <ConversionDryRun />
      <S2sTest />
      <DedupeTest />
    </div>
    <Checklist />
  </div>
);

export default TestingTab;
