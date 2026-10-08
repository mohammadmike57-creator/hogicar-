import * as React from 'react';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import Plug from 'lucide-react/dist/esm/icons/plug';
import Check from 'lucide-react/dist/esm/icons/check';
import Minus from 'lucide-react/dist/esm/icons/minus';
import X from 'lucide-react/dist/esm/icons/x';
import { affiliateNetworksApi as api, apiError, type Network, type Connector, type ConnectionTestResult, type CommissionableBasis } from '../../affiliateNetworksApi';
import { Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { basisRows, CONNECTOR_ACCENT, ConnectorLogoText } from './networkHelpers';
import { Badge, Callout, btnPrimary, btnSecondary, iconBtn, inputCls, useConfirm, TestResultBadge, dateTime, TEST_RESULT_UI } from './ui';

export const ConnectorLogo: React.FC<{ type?: string | null; name?: string; size?: 'sm' | 'md' }> = ({ type, name, size = 'sm' }) => (
  <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white ${CONNECTOR_ACCENT[String(type)] || 'from-slate-400 to-slate-600'} ${size === 'md' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs'}`}>
    {ConnectorLogoText(name || String(type || '?'))}
  </span>
);

/**
 * Credential management. Secrets are write-only: the API only ever returns masked values,
 * and empty inputs are sent as "unchanged".
 */
export const CredentialsEditor: React.FC<{
  network: Network; connector?: Connector; onChange: (n: Network) => void; registerSave?: (fn: () => Promise<boolean>) => void;
}> = ({ network, connector, onChange, registerSave }) => {
  const { settings, notify } = useAffiliateNetworks();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [confirm, confirmEl] = useConfirm();
  const fields = connector?.credentialFields?.length
    ? connector.credentialFields
    : (network.credentials || []).map(c => ({ key: c.key, label: c.label, secret: true, required: false, help: '' }));
  const status = (key: string) => (network.credentials || []).find(c => c.key === key);
  const encryptionOff = settings ? !settings.encryptionConfigured : false;
  const dirty = Object.keys(values).some(k => (values[k] || '').trim());

  const save = React.useCallback(async (): Promise<boolean> => {
    const payload: Record<string, string> = {};
    Object.keys(values).forEach(k => { if ((values[k] || '').trim()) payload[k] = values[k]; });
    if (!Object.keys(payload).length) return true;
    setSaving(true);
    try {
      const n = await api.saveCredentials(network.id, payload);
      onChange(n);
      setValues({});
      notify('Credentials saved');
      return true;
    } catch (e) {
      notify(apiError(e, 'Could not save credentials.'), 'err');
      return false;
    } finally { setSaving(false); }
  }, [values, network.id, onChange, notify]);

  React.useEffect(() => { registerSave?.(save); }, [registerSave, save]);

  const remove = async (key: string, label: string) => {
    if (!(await confirm({ title: `Remove ${label}?`, message: 'The stored value is deleted. Conversions that need it will fail until a new value is saved.', confirmLabel: 'Remove', danger: true }))) return;
    setBusyKey(key);
    try { onChange(await api.deleteCredential(network.id, key)); notify(`${label} removed`); }
    catch (e) { notify(apiError(e, 'Could not remove the credential.'), 'err'); }
    finally { setBusyKey(null); }
  };

  return (
    <div className="space-y-3">
      {encryptionOff && (
        <Callout tone="warn" icon={ShieldAlert} title="Encryption key missing">
          Set <code className="font-mono text-xs">AFFILIATE_MASTER_ENCRYPTION_KEY</code> on the server before saving credentials.
        </Callout>
      )}
      {!fields.length && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">This connector does not need any credentials.</p>}
      {fields.map(f => {
        const s = status(f.key);
        return (
          <div key={f.key} className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{f.label}{f.required && <span className="ml-0.5 text-rose-500">*</span>}</p>
              {s?.set ? (
                <span className="flex items-center gap-1.5">
                  <Badge tone="green"><ShieldCheck className="h-3 w-3" /> Saved</Badge>
                  <button className={iconBtn} disabled={busyKey === f.key} onClick={() => remove(f.key, f.label)} aria-label={`Remove ${f.label}`} title="Remove stored value">
                    {busyKey === f.key ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </span>
              ) : <Badge tone={f.required ? 'amber' : 'grey'}>{f.required ? 'Required – not set' : 'Not set'}</Badge>}
            </div>
            {s?.set && <p className="mt-1 text-xs text-slate-500">Current: <span className="font-mono text-slate-700">{s.masked || '••••••••'}</span>{s.updatedAt && <> · updated {dateTime(s.updatedAt)}</>}</p>}
            <div className="relative mt-2.5">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type={f.secret ? 'password' : 'text'} autoComplete="new-password" spellCheck={false} disabled={encryptionOff}
                className={`${inputCls} pl-10 font-mono`} value={values[f.key] || ''}
                placeholder={s?.set ? 'Leave empty to keep the current value' : `Enter ${f.label.toLowerCase()}`}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} />
            </div>
            {f.help && <p className="mt-1.5 text-xs text-slate-500">{f.help}</p>}
          </div>
        );
      })}
      {!!fields.length && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Secrets are encrypted on the server and never shown again.</p>
          <button className={btnPrimary} disabled={!dirty || saving || encryptionOff} onClick={save}>{saving ? <Spinner light /> : <Check className="h-4 w-4" />} Save credentials</button>
        </div>
      )}
      {confirmEl}
    </div>
  );
};

const STATE_UI = {
  included: { label: 'Included', cls: 'text-emerald-700', Icon: Check },
  excluded: { label: 'Excluded', cls: 'text-slate-400', Icon: X },
  deducted: { label: 'Deducted', cls: 'text-amber-700', Icon: Minus },
  conditional: { label: 'Depends', cls: 'text-sky-700', Icon: Minus },
} as const;

export const CommissionBasisTable: React.FC<{ basis: CommissionableBasis; includeExtras: boolean }> = ({ basis, includeExtras }) => (
  <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            <th className="px-3 py-2">Component</th><th className="px-3 py-2">Counts?</th><th className="px-3 py-2">Why</th>
          </tr>
        </thead>
        <tbody>
          {basisRows(basis, includeExtras).map(r => {
            const ui = STATE_UI[r.state];
            return (
              <tr key={r.component} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{r.component}</td>
                <td className={`whitespace-nowrap px-3 py-2 font-semibold ${ui.cls}`}><span className="inline-flex items-center gap-1"><ui.Icon className="h-3.5 w-3.5" />{ui.label}</span></td>
                <td className="px-3 py-2 text-xs text-slate-500">{r.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

/** Runs POST /networks/{id}/test and shows the outcome. */
export const ConnectionTest: React.FC<{ network: Network; connector?: Connector; onTested?: (r: ConnectionTestResult) => void }> = ({ network, connector, onTested }) => {
  const { notify } = useAffiliateNetworks();
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ConnectionTestResult | null>(null);
  const run = async () => {
    setBusy(true);
    try { const r = await api.testNetwork(network.id); setResult(r); onTested?.(r); }
    catch (e) { notify(apiError(e, 'The connection test could not run.'), 'err'); }
    finally { setBusy(false); }
  };
  const shown = result || (network.lastTestResult ? { result: network.lastTestResult, message: network.lastTestError || '', httpStatus: network.lastTestHttpStatus, testedAt: network.lastTestAt || '' } : null);
  const tone = shown ? TEST_RESULT_UI[shown.result]?.tone : null;
  const supported = network.connectorInstalled !== false && connector?.capabilities?.connectionTest !== false;
  return (
    <div className="space-y-3">
      {!supported && (
        <Callout tone="info" icon={Plug} title={network.connectorInstalled === false ? 'Connector not installed' : 'Connection test not supported'}>
          {network.connectorInstalled === false ? 'This network can be saved and configured, but it cannot send conversions until its connector is installed.' : 'This connector has no live test – the result only checks the configuration.'}
        </Callout>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button className={btnPrimary} onClick={run} disabled={busy}>{busy ? <Spinner light /> : <Plug className="h-4 w-4" />} {busy ? 'Testing…' : 'Run connection test'}</button>
        {shown && !result && <span className="text-xs text-slate-500">Last test {dateTime(shown.testedAt)}</span>}
      </div>
      {shown && (
        <div className={`rounded-xl p-4 ring-1 ${tone === 'green' ? 'bg-emerald-50 ring-emerald-200' : tone === 'red' ? 'bg-rose-50 ring-rose-200' : tone === 'amber' ? 'bg-amber-50 ring-amber-200' : 'bg-slate-50 ring-slate-200'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <TestResultBadge result={shown.result} />
            {shown.httpStatus != null && <Badge tone="grey">HTTP {shown.httpStatus}</Badge>}
            <span className="ml-auto text-xs text-slate-500">{dateTime(shown.testedAt)}</span>
          </div>
          {shown.message && <p className="mt-2 break-words text-sm text-slate-700">{shown.message}</p>}
        </div>
      )}
    </div>
  );
};

export const SecondaryLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className={`${btnSecondary} h-9`}>{children}</button>
);
