import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Power from 'lucide-react/dist/esm/icons/power';
import Plug from 'lucide-react/dist/esm/icons/plug';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import NetworkIcon from 'lucide-react/dist/esm/icons/network';
import Puzzle from 'lucide-react/dist/esm/icons/puzzle';
import { affiliateNetworksApi as api, apiError, type Network } from '../../affiliateNetworksApi';
import { Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { ConnectorLogo } from './networkParts';
import NetworkWizard from './NetworkWizard';
import NetworkDetailDrawer from './NetworkDetailDrawer';
import {
  Badge, Card, EmptyState, HealthBadge, NetworkStatusBadge, SkeletonRows, TableCard, TRACKING_METHOD_LABEL, btnPrimary, iconBtn,
  money, th, thRight, td, tdRight, useConfirm, TEST_RESULT_UI,
} from './ui';
import { ago } from '../commercialUi';

const NetworksTab: React.FC = () => {
  const { networks, connectors, loading, upsertNetwork, removeNetwork, notify, goTo, params } = useAffiliateNetworks();
  const [openId, setOpenId] = React.useState<number | null>(params.networkId ?? null);
  const [wizard, setWizard] = React.useState<{ network: Network | null; step: number } | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [confirm, confirmEl] = useConfirm();
  const open = networks.find(n => n.id === openId) || null;

  const toggle = async (n: Network) => {
    const to = n.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (to === 'INACTIVE' && !(await confirm({ title: `Disable ${n.name}?`, message: 'New conversions will not be sent to this network until it is enabled again.', confirmLabel: 'Disable', danger: true }))) return;
    setBusy(`s${n.id}`);
    try { upsertNetwork(await api.setNetworkStatus(n.id, to)); notify(to === 'ACTIVE' ? `${n.name} enabled` : `${n.name} disabled`); }
    catch (e) { notify(apiError(e, 'Could not change the status.'), 'err'); }
    finally { setBusy(null); }
  };

  const test = async (n: Network) => {
    setBusy(`t${n.id}`);
    try {
      const r = await api.testNetwork(n.id);
      const tone = TEST_RESULT_UI[r.result]?.tone;
      notify(`${n.name}: ${TEST_RESULT_UI[r.result]?.label || r.result}${r.message ? ` – ${r.message}` : ''}`, tone === 'red' ? 'err' : 'ok');
      api.getNetwork(n.id).then(upsertNetwork).catch(() => {});
    } catch (e) { notify(apiError(e, 'The connection test could not run.'), 'err'); }
    finally { setBusy(null); }
  };

  const del = async (n: Network) => {
    if (!(await confirm({ title: `Delete ${n.name}?`, message: 'The network stops tracking and is removed from the list. Historical conversions and logs are kept.', confirmLabel: 'Delete network', danger: true }))) return;
    setBusy(`d${n.id}`);
    try { await api.deleteNetwork(n.id); removeNetwork(n.id); notify(`${n.name} deleted`); }
    catch (e) { notify(apiError(e, 'Could not delete the network.'), 'err'); }
    finally { setBusy(null); }
  };

  const curOf = (n: Network) => (n.supportedCurrencies?.length === 1 ? n.supportedCurrencies[0] : null);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Networks</h3>
          <p className="text-sm text-slate-500">Each network has its own connector, tracking parameters, credentials and commission basis.</p>
        </div>
        <button className={`${btnPrimary} h-11 shrink-0`} onClick={() => setWizard({ network: null, step: 0 })}><Plus className="h-4 w-4" /> Add network</button>
      </div>

      {loading && !networks.length ? <SkeletonRows rows={3} height="h-16" /> : !networks.length ? (
        <EmptyState icon={NetworkIcon} title="No affiliate networks yet" text="Add Awin (or a manual network) to start capturing network clicks and reporting conversions."
          action={<button className={btnPrimary} onClick={() => setWizard({ network: null, step: 0 })}><Plus className="h-4 w-4" /> Add network</button>} />
      ) : (
        <TableCard>
          <thead className="border-b border-slate-100">
            <tr>
              <th className={th}>Network</th><th className={th}>Status</th><th className={th}>Tracking</th><th className={th}>Advertiser · window</th>
              <th className={thRight}>Conversions</th><th className={th}>Health · last test</th><th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(n => (
              <tr key={n.id} className="cursor-pointer border-t border-slate-100 transition first:border-0 hover:bg-sky-50/40" onClick={() => setOpenId(n.id)}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <ConnectorLogo type={n.connectorType} name={n.name} />
                    <div className="min-w-0">
                      <p className="max-w-[200px] truncate font-semibold text-slate-900">{n.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{n.code}{n.testMode && <span className="ml-1.5 font-sans font-semibold text-violet-600">TEST</span>}</p>
                    </div>
                  </div>
                </td>
                <td className={td}><NetworkStatusBadge status={n.status} /></td>
                <td className={td}>
                  <div className="flex max-w-[180px] flex-wrap gap-1">
                    {n.trackingMethods.length ? n.trackingMethods.map(m => <Badge key={m} tone="blue">{TRACKING_METHOD_LABEL[m] || m}</Badge>) : <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td className={td}><p className="font-mono text-xs text-slate-700">{n.advertiserIdMasked || '—'}</p><p className="text-[11px] text-slate-400">{n.attributionWindowDays}-day window</p></td>
                <td className={tdRight}><p className="font-semibold text-slate-900">{money(n.stats?.revenue, curOf(n))}</p><p className="text-[11px] text-slate-400">{new Intl.NumberFormat('en-GB').format(n.stats?.conversions || 0)} conversions</p></td>
                <td className={td}>
                  <div className="flex flex-col items-start gap-1"><HealthBadge health={n.health} title={n.healthMessage} /><span className="text-[11px] text-slate-400">{n.lastTestResult ? `${TEST_RESULT_UI[n.lastTestResult]?.label || n.lastTestResult} · ${ago(n.lastTestAt)}` : 'Never tested'}</span></div>
                </td>
                <td className={td} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    <button className={iconBtn} title="View" aria-label={`View ${n.name}`} onClick={() => setOpenId(n.id)}><Eye className="h-4 w-4" /></button>
                    <button className={iconBtn} title="Edit" aria-label={`Edit ${n.name}`} onClick={() => setWizard({ network: n, step: 0 })}><Pencil className="h-4 w-4" /></button>
                    <button className={iconBtn} title={n.status === 'ACTIVE' ? 'Disable' : n.connectorInstalled ? 'Enable' : 'Connector not installed'} aria-label={n.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      disabled={busy === `s${n.id}` || (n.status !== 'ACTIVE' && !n.connectorInstalled)} onClick={() => toggle(n)}>
                      {busy === `s${n.id}` ? <Spinner /> : <Power className={`h-4 w-4 ${n.status === 'ACTIVE' ? 'text-emerald-600' : ''}`} />}
                    </button>
                    <button className={iconBtn} title="Test connection" aria-label="Test connection" disabled={busy === `t${n.id}`} onClick={() => test(n)}>{busy === `t${n.id}` ? <Spinner /> : <Plug className="h-4 w-4" />}</button>
                    <button className={iconBtn} title="View logs" aria-label="View logs" onClick={() => goTo('logs', { networkId: n.id })}><ScrollText className="h-4 w-4" /></button>
                    <button className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} title="Delete" aria-label="Delete" disabled={busy === `d${n.id}`} onClick={() => del(n)}>{busy === `d${n.id}` ? <Spinner /> : <Trash2 className="h-4 w-4" />}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      <Card title="Available connectors" subtitle="Connectors are the code that talks to each network. New ones arrive with HogiCar updates." icon={Puzzle}>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {connectors.map(c => {
            const count = networks.filter(n => n.connectorType === c.type).length;
            return (
              <div key={c.type} className={`flex min-w-0 items-start gap-3 rounded-xl p-3 ring-1 ${c.installed ? 'bg-white ring-slate-200' : 'bg-slate-50 ring-slate-200'}`}>
                <ConnectorLogo type={c.type} name={c.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    {c.type === 'HOGICAR_DIRECT' ? <Badge tone="blue">In-house</Badge> : c.installed ? <Badge tone="green">Installed</Badge> : <Badge tone="grey">Not installed</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.type === 'HOGICAR_DIRECT' ? 'Your own ?ref= partners – managed in the Affiliates section.' : c.description}</p>
                  {count > 0 && <p className="mt-1 text-[11px] font-semibold text-[#007ac2]">{count} network{count === 1 ? '' : 's'}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <AnimatePresence>
        {open && !wizard && <NetworkDetailDrawer key={`nd-${open.id}`} network={open} onClose={() => setOpenId(null)} onEdit={step => setWizard({ network: open, step: step ?? 0 })} />}
        {wizard && <NetworkWizard key="wizard" network={wizard.network} initialStep={wizard.step} onClose={() => setWizard(null)} onDone={n => { if (!wizard.network) setOpenId(n.id); }} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

export default NetworksTab;
