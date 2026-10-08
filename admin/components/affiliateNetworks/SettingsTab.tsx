import * as React from 'react';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import Cookie from 'lucide-react/dist/esm/icons/cookie';
import Save from 'lucide-react/dist/esm/icons/save';
import Globe from 'lucide-react/dist/esm/icons/globe';
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal';
import { affiliateNetworksApi as api, apiError, ATTRIBUTION_MODELS, type AttributionModel, type AffiliateSettings } from '../../affiliateNetworksApi';
import { Toggle, Spinner, ErrorBanner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { Badge, Callout, Card, DL, SkeletonRows, btnPrimary, humanize } from './ui';

const MODEL_INFO: Record<AttributionModel, { label: string; text: string }> = {
  LAST_CLICK: { label: 'Last click', text: 'The most recent network click before the booking gets the conversion. Industry default and what Awin expects.' },
  FIRST_CLICK: { label: 'First click', text: 'The first network click within the attribution window keeps the conversion, even if the visitor clicks another network later.' },
  LAST_NON_DIRECT: { label: 'Last non-direct', text: 'Like last click, but a later direct visit (typing hogicar.com) never removes an existing network click.' },
  NETWORK_DEFINED: { label: 'Network defined', text: 'Report to every network that has a valid click and let the networks de-duplicate. Only use if all networks agree.' },
};

const SettingsTab: React.FC = () => {
  const { settings, setSettings, reloadSettings, notify } = useAffiliateNetworks();
  const [draft, setDraft] = React.useState<{ enabled: boolean; attributionModel: AttributionModel } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState<AffiliateSettings | null>(settings);

  const load = React.useCallback(async () => {
    setError(null);
    try { const s = await api.getSettings(); setLoaded(s); setSettings(s); setDraft({ enabled: s.enabled, attributionModel: s.attributionModel }); }
    catch (e) { setError(apiError(e, 'Could not load settings.')); }
  }, [setSettings]);
  React.useEffect(() => { load(); }, [load]);

  const dirty = !!(draft && loaded && (draft.enabled !== loaded.enabled || draft.attributionModel !== loaded.attributionModel));
  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try { const s = await api.updateSettings(draft); setLoaded(s); setSettings(s); notify('Settings saved'); }
    catch (e) { notify(apiError(e, 'Could not save settings.'), 'err'); }
    finally { setSaving(false); }
  };

  if (error && !loaded) return <ErrorBanner text={error} onRetry={() => { load(); reloadSettings(); }} />;
  if (!loaded || !draft) return <SkeletonRows rows={3} height="h-32" />;

  const consentOk = /ACTIVE|CONNECTED|ENABLED/i.test(loaded.consentIntegration || '');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
          <p className="text-sm text-slate-500">Global behaviour for every affiliate network.</p>
        </div>
        <button className={`${btnPrimary} h-11`} onClick={save} disabled={!dirty || saving}>{saving ? <Spinner light /> : <Save className="h-4 w-4" />} Save settings</button>
      </div>

      {!loaded.encryptionConfigured ? (
        <Callout tone="error" icon={ShieldAlert} title="Credential encryption is not configured">
          Set <code className="rounded bg-rose-100 px-1 font-mono text-xs">AFFILIATE_MASTER_ENCRYPTION_KEY</code> on the server before saving credentials. Until then network API keys cannot be stored and server-to-server conversions can’t be sent.
        </Callout>
      ) : (
        <Callout tone="ok" icon={ShieldCheck} title="Credential encryption is configured">Network secrets are encrypted at rest and never returned to the browser.</Callout>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Network tracking" icon={SlidersHorizontal}>
          <div className="space-y-4">
            <Toggle checked={draft.enabled} onChange={v => setDraft(d => (d ? { ...d, enabled: v } : d))} label="Enable affiliate network tracking"
              hint="When off, no network clicks are captured and no conversions are sent. The in-house Affiliates programme is not affected." />
            {!draft.enabled && <Callout tone="warn">Tracking is off – bookings from network traffic will not be attributed.</Callout>}
          </div>
        </Card>
        <Card title="Consent" icon={Cookie}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Cookie-consent integration</span>
              <Badge tone={consentOk ? 'green' : 'amber'} dot>{humanize(loaded.consentIntegration)}</Badge>
            </div>
            <p className="text-xs text-slate-500">Each network decides how consent is used (Network → Tracking → consent policy): send the consent signal only, or require marketing consent before capturing the click.</p>
          </div>
        </Card>
      </div>

      <Card title="Attribution model" subtitle="Decides which network gets a booking when a visitor clicked through more than one.">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ATTRIBUTION_MODELS.map(m => (
            <button key={m} type="button" onClick={() => setDraft(d => (d ? { ...d, attributionModel: m } : d))}
              className={`rounded-xl p-3.5 text-left ring-1 transition ${draft.attributionModel === m ? 'bg-[#007ac2]/[0.06] ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{MODEL_INFO[m].label}</span>
                {m === 'LAST_CLICK' && <Badge tone="blue">Recommended</Badge>}
              </span>
              <span className="mt-1 block text-xs text-slate-500">{MODEL_INFO[m].text}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Environment" icon={Globe}>
        <DL items={[
          ['Public base URL', <span key="u" className="font-mono text-xs">{loaded.publicBaseUrl}</span>],
          ['Partner API', <span key="p" className="font-mono text-xs">{loaded.partnerApiDocsPath}</span>],
          ['Encryption', loaded.encryptionConfigured ? <Badge key="e" tone="green">Configured</Badge> : <Badge key="e" tone="red">Missing key</Badge>],
          ['Consent integration', humanize(loaded.consentIntegration)],
        ]} />
      </Card>
    </div>
  );
};

export default SettingsTab;
