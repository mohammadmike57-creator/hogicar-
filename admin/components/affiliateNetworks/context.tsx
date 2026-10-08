import * as React from 'react';
import { affiliateNetworksApi as api, apiError } from '../../affiliateNetworksApi';
import type { Network, Connector, AffiliateSettings } from '../../affiliateNetworksApi';

export type TabKey =
  | 'dashboard' | 'networks' | 'programs' | 'publishers' | 'links' | 'conversions'
  | 'reconciliation' | 'rules' | 'feeds' | 'logs' | 'testing' | 'settings';

/** Optional parameters passed when jumping between tabs (e.g. "view logs" for one network). */
export type TabParams = { networkId?: number; bookingRef?: string };

type Ctx = {
  networks: Network[];
  connectors: Connector[];
  settings: AffiliateSettings | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reloadSettings: () => Promise<void>;
  upsertNetwork: (n: Network) => void;
  removeNetwork: (id: number) => void;
  setSettings: (s: AffiliateSettings) => void;
  notify: (text: string, tone?: 'ok' | 'err') => void;
  goTo: (tab: TabKey, params?: TabParams) => void;
  params: TabParams;
  connectorOf: (type?: string | null) => Connector | undefined;
};

const AffiliateNetworksContext = React.createContext<Ctx | null>(null);

export const useAffiliateNetworks = () => {
  const ctx = React.useContext(AffiliateNetworksContext);
  if (!ctx) throw new Error('useAffiliateNetworks must be used inside <AffiliateNetworksProvider>');
  return ctx;
};

export const AffiliateNetworksProvider: React.FC<{
  children: React.ReactNode; notify: Ctx['notify']; goTo: Ctx['goTo']; params: TabParams;
}> = ({ children, notify, goTo, params }) => {
  const [networks, setNetworks] = React.useState<Network[]>([]);
  const [connectors, setConnectors] = React.useState<Connector[]>([]);
  const [settings, setSettings] = React.useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [n, c] = await Promise.all([api.getNetworks(), api.getConnectors()]);
      setNetworks(Array.isArray(n) ? n : []);
      setConnectors(Array.isArray(c) ? c : []);
    } catch (e) {
      setError(apiError(e, 'Could not load affiliate networks.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadSettings = React.useCallback(async () => {
    try { setSettings(await api.getSettings()); } catch { /* settings tab shows its own error */ }
  }, []);

  React.useEffect(() => { reload(); reloadSettings(); }, [reload, reloadSettings]);

  const upsertNetwork = React.useCallback((n: Network) => setNetworks(list => (list.some(x => x.id === n.id) ? list.map(x => (x.id === n.id ? n : x)) : [...list, n])), []);
  const removeNetwork = React.useCallback((id: number) => setNetworks(list => list.filter(x => x.id !== id)), []);
  const connectorOf = React.useCallback((type?: string | null) => connectors.find(c => c.type === type), [connectors]);

  const value: Ctx = { networks, connectors, settings, loading, error, reload, reloadSettings, upsertNetwork, removeNetwork, setSettings, notify, goTo, params, connectorOf };
  return <AffiliateNetworksContext.Provider value={value}>{children}</AffiliateNetworksContext.Provider>;
};
