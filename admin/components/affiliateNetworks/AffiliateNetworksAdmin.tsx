import * as React from 'react';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Network from 'lucide-react/dist/esm/icons/network';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Users from 'lucide-react/dist/esm/icons/users';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Scale from 'lucide-react/dist/esm/icons/scale';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Rss from 'lucide-react/dist/esm/icons/rss';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import Settings from 'lucide-react/dist/esm/icons/settings';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import { useToast, Toast, ErrorBanner } from '../commercialUi';
import { AffiliateNetworksProvider, useAffiliateNetworks, type TabKey, type TabParams } from './context';
import { Badge, Callout } from './ui';
import NetworkDashboard from './NetworkDashboard';
import NetworksTab from './NetworksTab';
import ProgramsTab from './ProgramsTab';
import PublishersTab from './PublishersTab';
import TrackingLinksTab from './TrackingLinksTab';
import ConversionsTab from './ConversionsTab';
import ReconciliationTab from './ReconciliationTab';
import CommissionRulesTab from './CommissionRulesTab';
import FeedsTab from './FeedsTab';
import LogsTab from './LogsTab';
import TestingTab from './TestingTab';
import SettingsTab from './SettingsTab';

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'networks', label: 'Networks', Icon: Network },
  { key: 'programs', label: 'Programs', Icon: Briefcase },
  { key: 'publishers', label: 'Publishers', Icon: Users },
  { key: 'links', label: 'Tracking links', Icon: Link2 },
  { key: 'conversions', label: 'Conversions', Icon: Receipt },
  { key: 'reconciliation', label: 'Reconciliation', Icon: Scale },
  { key: 'rules', label: 'Commission rules', Icon: Percent },
  { key: 'feeds', label: 'Feeds & live search', Icon: Rss },
  { key: 'logs', label: 'Logs', Icon: ScrollText },
  { key: 'testing', label: 'Testing', Icon: FlaskConical },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

const TabNav: React.FC<{ value: TabKey; onChange: (k: TabKey) => void; badges: Partial<Record<TabKey, number>> }> = ({ value, onChange, badges }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-tab="${value}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  return (
    <div className="sticky top-[72px] z-20 min-w-0 rounded-2xl bg-white/95 p-1.5 shadow-sm ring-1 ring-slate-200 backdrop-blur md:static md:bg-white">
      <div ref={ref} className="flex gap-1 [overflow-x:auto] [scrollbar-width:none] xl:flex-wrap xl:[overflow-x:visible] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Affiliate network sections">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === value;
          const count = badges[key];
          return (
            <button key={key} data-tab={key} role="tab" aria-selected={active} onClick={() => onChange(key)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Icon className={`h-4 w-4 ${active ? 'text-sky-300' : 'text-slate-400'}`} />
              {label}
              {!!count && <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/15' : 'bg-rose-100 text-rose-700'}`}>{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Header: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const { networks, settings, loading } = useAffiliateNetworks();
  const active = networks.filter(n => n.status === 'ACTIVE').length;
  const errors = networks.filter(n => n.health === 'ERROR').length;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0b2545] px-5 py-5 text-white sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#007ac2]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100 ring-1 ring-inset ring-white/15"><Share2 className="h-3 w-3" /> Affiliate networks</span>
          <h2 className="mt-2.5 text-2xl font-semibold tracking-tight sm:text-[28px]">Network tracking & conversions</h2>
          <p className="mt-1 max-w-2xl text-sm text-sky-100/80">Connect Awin and other affiliate networks, control what they are paid on, and follow every conversion from click to settlement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {settings && (
            <span className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold ring-1 ring-inset ${settings.enabled ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30' : 'bg-white/10 text-slate-200 ring-white/20'}`}>
              <span className={`h-2 w-2 rounded-full ${settings.enabled ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              Tracking {settings.enabled ? 'on' : 'off'}
            </span>
          )}
          <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-semibold text-sky-100 ring-1 ring-inset ring-white/15">
            {loading ? '…' : `${active} of ${networks.length} active`}
          </span>
          {errors > 0 && <Badge tone="red" dot className="h-9 rounded-xl px-3 text-xs">{errors} with errors</Badge>}
          <button onClick={onRefresh} className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-[#0b2545] shadow hover:bg-sky-50" aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>
    </section>
  );
};

const Body: React.FC<{ tab: TabKey; setTab: (k: TabKey) => void; refreshKey: number; onRefresh: () => void }> = ({ tab, setTab, refreshKey, onRefresh }) => {
  const { error, reload, settings, networks } = useAffiliateNetworks();
  const errorCount = networks.filter(n => n.health === 'ERROR').length;
  const content = (() => {
    switch (tab) {
      case 'dashboard': return <NetworkDashboard />;
      case 'networks': return <NetworksTab />;
      case 'programs': return <ProgramsTab />;
      case 'publishers': return <PublishersTab />;
      case 'links': return <TrackingLinksTab />;
      case 'conversions': return <ConversionsTab />;
      case 'reconciliation': return <ReconciliationTab />;
      case 'rules': return <CommissionRulesTab />;
      case 'feeds': return <FeedsTab />;
      case 'logs': return <LogsTab />;
      case 'testing': return <TestingTab />;
      case 'settings': return <SettingsTab />;
      default: return null;
    }
  })();
  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <Header onRefresh={onRefresh} />
      <TabNav value={tab} onChange={setTab} badges={{ networks: errorCount }} />
      {error && <ErrorBanner text={error} onRetry={reload} />}
      {settings && !settings.encryptionConfigured && tab !== 'settings' && (
        <Callout tone="warn" title="Credential encryption is not configured">
          Set <code className="rounded bg-amber-100 px-1 font-mono text-xs">AFFILIATE_MASTER_ENCRYPTION_KEY</code> on the server before saving network credentials.
        </Callout>
      )}
      <div key={`${tab}-${refreshKey}`} className="min-w-0">{content}</div>
    </div>
  );
};

const TAB_STORAGE = 'hogicar.affiliateNetworks.tab';

const AffiliateNetworksAdmin: React.FC = () => {
  const [tab, setTabState] = React.useState<TabKey>(() => {
    try {
      const t = window.sessionStorage.getItem(TAB_STORAGE) as TabKey | null;
      return t && TABS.some(x => x.key === t) ? t : 'dashboard';
    } catch { return 'dashboard'; }
  });
  const [params, setParams] = React.useState<TabParams>({});
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { toast, notify } = useToast();

  const setTab = React.useCallback((k: TabKey) => {
    setTabState(k);
    setParams({});
    try { window.sessionStorage.setItem(TAB_STORAGE, k); } catch { /* ignore */ }
  }, []);
  const goTo = React.useCallback((k: TabKey, p: TabParams = {}) => {
    setTabState(k);
    setParams(p);
    try { window.sessionStorage.setItem(TAB_STORAGE, k); } catch { /* ignore */ }
  }, []);

  return (
    <AffiliateNetworksProvider notify={notify} goTo={goTo} params={params}>
      <RefreshBridge onRefresh={() => setRefreshKey(k => k + 1)}>
        {refresh => <Body tab={tab} setTab={setTab} refreshKey={refreshKey} onRefresh={refresh} />}
      </RefreshBridge>
      <Toast toast={toast} />
    </AffiliateNetworksProvider>
  );
};

/** Refresh = reload shared data (networks/connectors/settings) and remount the current tab so it refetches. */
const RefreshBridge: React.FC<{ onRefresh: () => void; children: (refresh: () => void) => React.ReactNode }> = ({ onRefresh, children }) => {
  const { reload, reloadSettings } = useAffiliateNetworks();
  const refresh = React.useCallback(() => { reload(); reloadSettings(); onRefresh(); }, [reload, reloadSettings, onRefresh]);
  return <>{children(refresh)}</>;
};

export default AffiliateNetworksAdmin;
