import * as React from 'react';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Power from 'lucide-react/dist/esm/icons/power';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import {
  affiliateNetworksApi as api, apiError, toNetworkInput, type Network, type LogEntry,
} from '../../affiliateNetworksApi';
import { Drawer, CopyButton, Toggle, Spinner, Segmented } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { BASIS_INFO, CONSENT_INFO } from './networkHelpers';
import { ConnectorLogo, CredentialsEditor, CommissionBasisTable, ConnectionTest } from './networkParts';
import {
  Badge, Callout, DL, HealthBadge, LevelBadge, NetworkStatusBadge, Panel, TRACKING_METHOD_LABEL, btnDanger, btnPrimary, btnSecondary,
  dateTime, humanize, money, useConfirm, TestResultBadge,
} from './ui';

type DTab = 'overview' | 'config' | 'credentials' | 'feed' | 'logs';

const listOrAll = (v: string[] | undefined, all: string) => (v && v.length ? v.join(', ') : <span className="text-slate-500">{all}</span>);

const NetworkDetailDrawer: React.FC<{ network: Network; onClose: () => void; onEdit: (step?: number) => void }> = ({ network: n, onClose, onEdit }) => {
  const { connectorOf, upsertNetwork, removeNetwork, notify, goTo } = useAffiliateNetworks();
  const connector = connectorOf(n.connectorType);
  const [tab, setTab] = React.useState<DTab>('overview');
  const [logs, setLogs] = React.useState<LogEntry[] | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [confirm, confirmEl] = useConfirm();

  React.useEffect(() => {
    api.getNetwork(n.id).then(upsertNetwork).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n.id]);
  React.useEffect(() => {
    if (tab === 'logs' && logs === null) api.getLogs({ networkId: n.id, size: 25 }).then(p => setLogs(p.items || [])).catch(() => setLogs([]));
  }, [tab, logs, n.id]);

  const toggleStatus = async () => {
    const to = n.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (to === 'INACTIVE' && !(await confirm({ title: `Disable ${n.name}?`, message: 'New conversions will not be sent to this network until it is enabled again. Attribution already captured is kept.', confirmLabel: 'Disable', danger: true }))) return;
    setBusy('status');
    try { upsertNetwork(await api.setNetworkStatus(n.id, to)); notify(to === 'ACTIVE' ? `${n.name} enabled` : `${n.name} disabled`); }
    catch (e) { notify(apiError(e, 'Could not change the status.'), 'err'); }
    finally { setBusy(null); }
  };

  const del = async () => {
    if (!(await confirm({ title: `Delete ${n.name}?`, message: <>The network is removed from the admin and stops tracking. Historical conversions and logs are kept for reporting. <b>This can’t be undone here.</b></>, confirmLabel: 'Delete network', danger: true }))) return;
    setBusy('delete');
    try { await api.deleteNetwork(n.id); removeNetwork(n.id); notify(`${n.name} deleted`); onClose(); }
    catch (e) { notify(apiError(e, 'Could not delete the network.'), 'err'); setBusy(null); }
  };

  const regenerate = async () => {
    if (!(await confirm({ title: 'Regenerate feed URL?', message: 'The current feed URL stops working immediately. Publishers using it must be given the new URL.', confirmLabel: 'Regenerate', danger: true }))) return;
    setBusy('feed');
    try { upsertNetwork(await api.regenerateFeedToken(n.id)); notify('New feed URL generated'); }
    catch (e) { notify(apiError(e, 'Could not regenerate the feed URL.'), 'err'); }
    finally { setBusy(null); }
  };

  const setFeedEnabled = async (v: boolean) => {
    setBusy('feedEnabled');
    try { upsertNetwork(await api.updateNetwork(n.id, toNetworkInput({ ...n, feedEnabled: v }))); notify(v ? 'Feed enabled' : 'Feed disabled'); }
    catch (e) { notify(apiError(e, 'Could not update the feed.'), 'err'); }
    finally { setBusy(null); }
  };

  return (
    <Drawer eyebrow={`${connector?.name || n.connectorType} network`} title={n.name} onClose={onClose} busy={busy === 'delete'} width="max-w-[760px]"
      headerExtra={
        <div className="space-y-3 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <NetworkStatusBadge status={n.status} />
            <HealthBadge health={n.health} title={n.healthMessage} />
            {n.testMode && <Badge tone="violet">Test mode</Badge>}
            <span className="font-mono text-xs text-slate-400">{n.code}</span>
          </div>
          <Segmented layoutId="an-net-detail" value={tab} onChange={setTab} items={[
            { key: 'overview', label: 'Overview' }, { key: 'config', label: 'Configuration' }, { key: 'credentials', label: 'Credentials' },
            { key: 'feed', label: 'Feed' }, { key: 'logs', label: 'Logs' },
          ]} />
        </div>
      }
      footer={
        <div className="flex flex-wrap gap-2">
          <button className={`${btnPrimary} flex-1`} onClick={() => onEdit(0)}><Pencil className="h-4 w-4" /> Edit</button>
          <button className={`${btnSecondary} flex-1`} onClick={toggleStatus} disabled={busy === 'status' || (n.status !== 'ACTIVE' && !n.connectorInstalled)} title={!n.connectorInstalled ? 'Connector not installed' : undefined}>
            {busy === 'status' ? <Spinner /> : <Power className="h-4 w-4" />}{n.status === 'ACTIVE' ? 'Disable' : 'Enable'}
          </button>
          <button className={`${btnDanger} sm:flex-none`} onClick={del} disabled={busy === 'delete'} aria-label="Delete network">{busy === 'delete' ? <Spinner light /> : <Trash2 className="h-4 w-4" />}<span className="sm:hidden lg:inline">Delete</span></button>
        </div>
      }>
      <div className="space-y-4">
        {tab === 'overview' && <>
          {n.health === 'ERROR' && n.lastError && <Callout tone="error" title="Last error">{n.lastError}</Callout>}
          {!n.connectorInstalled && <Callout tone="warn" title="Connector not installed">This network is saved but cannot send conversions.</Callout>}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[['Clicks', new Intl.NumberFormat('en-GB').format(n.stats?.clicks || 0)], ['Conversions', new Intl.NumberFormat('en-GB').format(n.stats?.conversions || 0)], ['Revenue', money(n.stats?.revenue, n.supportedCurrencies?.length === 1 ? n.supportedCurrencies[0] : null)], ['Commission', money(n.stats?.commission, n.supportedCurrencies?.length === 1 ? n.supportedCurrencies[0] : null)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-xs text-slate-500">{k}</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{v}</p></div>
            ))}
          </div>
          <Panel title="Health">
            <DL items={[
              ['State', <HealthBadge key="h" health={n.health} />],
              ['Message', n.healthMessage],
              ['Last success', dateTime(n.lastSuccessAt)],
              ['Last error', n.lastErrorAt ? `${dateTime(n.lastErrorAt)}` : null],
            ]} />
          </Panel>
          <Panel title="Connection test">
            <ConnectionTest network={n} connector={connector} onTested={() => api.getNetwork(n.id).then(upsertNetwork).catch(() => {})} />
          </Panel>
          <Panel title="Identity">
            <DL items={[
              ['Connector', <span key="c" className="inline-flex items-center gap-2"><ConnectorLogo type={n.connectorType} name={connector?.name} />{connector?.name || n.connectorType}</span>],
              ['Advertiser ID', <span key="a" className="font-mono">{n.advertiserIdMasked || '—'}</span>],
              ['External program ID', n.externalProgramId], ['Merchant ID', n.merchantId], ['Website ID', n.websiteId],
              ['Created', dateTime(n.createdAt)], ['Updated', dateTime(n.updatedAt)],
              ['Description', n.description],
            ]} />
            {connector?.docsUrl && <a href={connector.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#007ac2] hover:underline">{connector.name} documentation <ExternalLink className="h-3.5 w-3.5" /></a>}
          </Panel>
        </>}

        {tab === 'config' && <>
          <Panel title="Tracking" actions={<button className="text-xs font-semibold text-[#007ac2] hover:underline" onClick={() => onEdit(1)}>Edit</button>}>
            <div className="flex flex-wrap gap-1.5">{n.trackingMethods.length ? n.trackingMethods.map(m => <Badge key={m} tone="blue">{TRACKING_METHOD_LABEL[m] || m}</Badge>) : <span className="text-sm text-slate-400">No tracking methods</span>}</div>
            <DL cols={3} items={[
              ['Click ID', <code key="1" className="font-mono">{n.clickParam || '—'}</code>], ['Publisher', <code key="2" className="font-mono">{n.publisherParam || '—'}</code>],
              ['Sub-ID', <code key="3" className="font-mono">{n.subIdParam || '—'}</code>], ['Click ref', <code key="4" className="font-mono">{n.clickRefParam || '—'}</code>],
              ['Campaign', <code key="5" className="font-mono">{n.campaignParam || '—'}</code>], ['Creative', <code key="6" className="font-mono">{n.creativeParam || '—'}</code>],
              ['Voucher', <code key="7" className="font-mono">{n.voucherParam || '—'}</code>], ['Attribution window', `${n.attributionWindowDays} days`], ['Max retries', n.maxRetries],
              ['Consent', CONSENT_INFO[n.consentPolicy]?.label || humanize(n.consentPolicy)], ['Test mode', n.testMode ? 'On' : 'Off'], ['Product-level', n.productLevelTracking ? 'On' : 'Off'],
            ]} />
          </Panel>
          <Panel title="Commission" actions={<button className="text-xs font-semibold text-[#007ac2] hover:underline" onClick={() => onEdit(3)}>Edit</button>}>
            <DL items={[
              ['Default group', <code key="g" className="font-mono">{n.defaultCommissionGroup}</code>],
              ['Basis', BASIS_INFO[n.commissionableBasis]?.label || n.commissionableBasis],
              ['Include extras', n.includeExtras ? 'Yes' : 'No'],
              ['Reported when booking is', n.reportOnStatuses.map(humanize).join(', ')],
            ]} />
            <CommissionBasisTable basis={n.commissionableBasis} includeExtras={n.includeExtras} />
          </Panel>
          <Panel title="Markets" actions={<button className="text-xs font-semibold text-[#007ac2] hover:underline" onClick={() => onEdit(4)}>Edit</button>}>
            <DL items={[
              ['Countries', listOrAll(n.countries, 'All countries')], ['Locations', listOrAll(n.locationCodes, 'All locations')],
              ['Currencies', listOrAll(n.supportedCurrencies, 'All currencies')], ['Reported in', n.currencyMode === 'FIXED' ? n.fixedCurrency : 'Booking currency'],
            ]} />
          </Panel>
        </>}

        {tab === 'credentials' && <CredentialsEditor network={n} connector={connector} onChange={upsertNetwork} />}

        {tab === 'feed' && <>
          <Toggle checked={n.feedEnabled} onChange={setFeedEnabled} label="Product feed" hint="Publishers can download locations and starting prices for their sites." />
          <Panel title="Feed URL">
            {n.feedUrl ? (
              <>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 pl-3 ring-1 ring-slate-200">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700" title="Feed URL">{n.feedUrl}</code>
                  <CopyButton text={n.feedUrl} label="Copy" className="h-8 shrink-0 bg-white px-2.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100" onCopied={() => notify('Feed URL copied')} />
                </div>
                {!n.feedEnabled && <p className="text-xs text-amber-700">The feed is disabled – this URL returns nothing until it is enabled.</p>}
                <div className="flex flex-wrap gap-2">
                  <button className={btnSecondary} onClick={regenerate} disabled={busy === 'feed'}>{busy === 'feed' ? <Spinner /> : <RefreshCw className="h-4 w-4" />} Regenerate token</button>
                  <button className={btnSecondary} onClick={() => { onClose(); goTo('feeds'); }}>CSV / XML / JSON variants</button>
                </div>
              </>
            ) : <p className="text-sm text-slate-500">No feed URL yet – generate one to share with publishers.<button className="ml-2 font-semibold text-[#007ac2] hover:underline" onClick={regenerate}>Generate</button></p>}
          </Panel>
        </>}

        {tab === 'logs' && (
          <Panel title="Recent activity" actions={<button className="inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2] hover:underline" onClick={() => { onClose(); goTo('logs', { networkId: n.id }); }}><ScrollText className="h-3.5 w-3.5" /> All logs</button>}>
            {logs === null ? <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
              : !logs.length ? <p className="py-4 text-center text-sm text-slate-400">No log entries yet.</p> : (
                <ul className="divide-y divide-slate-100">
                  {logs.map(l => (
                    <li key={l.id} className="flex items-start gap-3 py-2.5">
                      <LevelBadge level={l.level} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800">{l.message}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400"><span className="font-mono">{l.type}</span>{l.bookingRef && <> · {l.bookingRef}</>} · {dateTime(l.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            <div className="flex items-center gap-2 text-xs text-slate-500">Last test: <TestResultBadge result={n.lastTestResult} /></div>
          </Panel>
        )}
      </div>
      {confirmEl}
    </Drawer>
  );
};

export default NetworkDetailDrawer;
