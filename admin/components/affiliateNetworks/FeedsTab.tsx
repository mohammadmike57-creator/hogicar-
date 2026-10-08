import * as React from 'react';
import Rss from 'lucide-react/dist/esm/icons/rss';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Search from 'lucide-react/dist/esm/icons/search';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { affiliateNetworksApi as api, apiError, toNetworkInput, type Network } from '../../affiliateNetworksApi';
import { Field, CopyButton, Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import { ConnectorLogo } from './networkParts';
import { UrlBox } from './TrackingLinksTab';
import { Badge, Callout, Card, EmptyState, SkeletonRows, btnSecondary, inputCls, isoDay, useConfirm } from './ui';

const FORMATS = ['csv', 'xml', 'json'] as const;

/** Same feed URL with `format=csv|xml|json`. */
export const feedVariant = (url: string, format: string) => {
  try {
    const u = new URL(url);
    u.searchParams.set('format', format);
    return u.toString();
  } catch {
    return /[?&]format=/.test(url) ? url.replace(/([?&]format=)[^&]*/, `$1${format}`) : `${url}${url.includes('?') ? '&' : '?'}format=${format}`;
  }
};

const FeedCard: React.FC<{ n: Network }> = ({ n }) => {
  const { upsertNetwork, notify } = useAffiliateNetworks();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [format, setFormat] = React.useState<(typeof FORMATS)[number]>('csv');
  const [confirm, confirmEl] = useConfirm();
  const regenerate = async () => {
    if (n.feedUrl && !(await confirm({ title: 'Regenerate feed URL?', message: 'The current URL stops working immediately for every publisher using it.', confirmLabel: 'Regenerate', danger: true }))) return;
    setBusy('token');
    try { upsertNetwork(await api.regenerateFeedToken(n.id)); notify('New feed URL generated'); }
    catch (e) { notify(apiError(e, 'Could not regenerate the feed URL.'), 'err'); }
    finally { setBusy(null); }
  };
  const toggle = async () => {
    setBusy('toggle');
    try { upsertNetwork(await api.updateNetwork(n.id, toNetworkInput({ ...n, feedEnabled: !n.feedEnabled }))); notify(n.feedEnabled ? 'Feed disabled' : 'Feed enabled'); }
    catch (e) { notify(apiError(e, 'Could not update the feed.'), 'err'); }
    finally { setBusy(null); }
  };
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ConnectorLogo type={n.connectorType} name={n.name} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{n.name}</p>
            <p className="text-xs text-slate-500">{n.locationCodes.length ? `${n.locationCodes.length} locations` : 'All locations'} · {n.supportedCurrencies.length ? n.supportedCurrencies.join(', ') : 'all currencies'}</p>
          </div>
          <Badge tone={n.feedEnabled ? 'green' : 'grey'} dot>{n.feedEnabled ? 'Feed on' : 'Feed off'}</Badge>
          <button className={`${btnSecondary} h-9`} onClick={toggle} disabled={!!busy}>{busy === 'toggle' ? <Spinner /> : null}{n.feedEnabled ? 'Disable' : 'Enable'}</button>
        </div>
        {n.feedUrl ? (
          <>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {FORMATS.map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`h-8 rounded-lg px-3 text-xs font-semibold uppercase transition ${format === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{f}</button>
              ))}
            </div>
            <UrlBox label={`${format.toUpperCase()} feed URL`} url={feedVariant(n.feedUrl, format)} onCopied={() => notify('Feed URL copied')} />
            <div className="flex flex-wrap gap-2">
              <button className={`${btnSecondary} h-9`} onClick={regenerate} disabled={!!busy}>{busy === 'token' ? <Spinner /> : <RefreshCw className="h-4 w-4" />} Regenerate token</button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            No feed URL yet.
            <button className={`${btnSecondary} h-9`} onClick={regenerate} disabled={!!busy}>{busy === 'token' ? <Spinner /> : <KeyRound className="h-4 w-4" />} Generate feed URL</button>
          </div>
        )}
      </div>
      {confirmEl}
    </Card>
  );
};

const DeepLinkBuilder: React.FC = () => {
  const { settings, notify } = useAffiliateNetworks();
  const base = (settings?.publicBaseUrl || 'https://www.hogicar.com').replace(/\/$/, '');
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in10 = new Date(); in10.setDate(in10.getDate() + 10);
  const [s, setS] = React.useState({ pickup: 'AMM', dropoff: 'AMM', pickupDate: isoDay(in7), dropoffDate: isoDay(in10), startTime: '10:00', endTime: '10:00' });
  const set = (p: Partial<typeof s>) => setS(x => ({ ...x, ...p }));
  const invalid = !s.pickup || !s.dropoff || !s.pickupDate || !s.dropoffDate || s.dropoffDate < s.pickupDate;
  const url = `${base}/search?pickup=${encodeURIComponent(s.pickup)}&dropoff=${encodeURIComponent(s.dropoff)}&pickupDate=${s.pickupDate}&dropoffDate=${s.dropoffDate}&startTime=${encodeURIComponent(s.startTime)}&endTime=${encodeURIComponent(s.endTime)}`
    .replace(/%3A/g, ':');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Pick-up code"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={8} value={s.pickup} onChange={e => set({ pickup: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /></Field>
        <Field label="Drop-off code"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={8} value={s.dropoff} onChange={e => set({ dropoff: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /></Field>
        <div className="hidden sm:block" />
        <Field label="Pick-up date"><input type="date" className={inputCls} value={s.pickupDate} onChange={e => set({ pickupDate: e.target.value })} /></Field>
        <Field label="Drop-off date"><input type="date" className={inputCls} value={s.dropoffDate} min={s.pickupDate} onChange={e => set({ dropoffDate: e.target.value })} /></Field>
        <div className="hidden sm:block" />
        <Field label="Pick-up time"><input type="time" step={1800} className={inputCls} value={s.startTime} onChange={e => set({ startTime: e.target.value })} /></Field>
        <Field label="Drop-off time"><input type="time" step={1800} className={inputCls} value={s.endTime} onChange={e => set({ endTime: e.target.value })} /></Field>
      </div>
      {invalid ? <Callout tone="warn">Fill in both codes and a drop-off date on or after the pick-up date.</Callout> : (
        <div className="space-y-2">
          <UrlBox label="Deep link" url={url} tone="primary" onCopied={() => notify('Deep link copied')} />
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#007ac2] hover:underline">Open search <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      )}
    </div>
  );
};

const FeedsTab: React.FC = () => {
  const { networks, loading, settings } = useAffiliateNetworks();
  const base = (settings?.publicBaseUrl || 'https://www.hogicar.com').replace(/\/$/, '');
  const partnerPath = settings?.partnerApiDocsPath || '/api/partner/v1';
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Feeds & live search</h3>
        <p className="text-sm text-slate-500">Give publishers product data and live availability so their links land on real results.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <Card title="Product feeds" subtitle="One private URL per network, in CSV, XML or JSON." icon={Rss}>
            <div className="space-y-2 text-sm text-slate-600">
              <p>The feed lists HogiCar locations with their codes, a ready-made deep link and the current “from” price per day, limited to the network’s countries, locations and currencies.</p>
              <p>Publishers load it into their site or the network’s product-feed tool. The token in the URL identifies the network – regenerate it if it leaks. Disabled feeds return nothing.</p>
            </div>
          </Card>
          {loading && !networks.length ? <SkeletonRows rows={2} height="h-40" /> : !networks.length
            ? <EmptyState icon={Rss} title="No networks yet" text="Add a network to get its feed URL." compact />
            : networks.map(n => <FeedCard key={n.id} n={n} />)}
        </div>

        <div className="min-w-0 space-y-3">
          <Card title="Live search & deep links" subtitle="For partners who want real-time prices." icon={Search}>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Partners that need live availability (comparison sites, apps) use the existing <b>Partner API</b>:</p>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 pl-3 ring-1 ring-slate-200">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-800">{base}{partnerPath}/search</code>
                <CopyButton text={`${base}${partnerPath}/search`} className="h-8 w-8 shrink-0 bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100" />
              </div>
              <p className="flex items-start gap-2"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#007ac2]" /><span>API keys are created and revoked in the <b>Integrations</b> section of the admin. Each key has its own rate limit and usage log.</span></p>
              <p className="flex items-start gap-2"><Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007ac2]" /><span>Every result links back to HogiCar with a search deep link. Wrap it in the network tracking link (see <b>Tracking links</b>) so the booking is attributed.</span></p>
              <div className="rounded-xl bg-[#0b1526] p-3 font-mono text-[11px] leading-relaxed text-sky-100">
                <span className="text-slate-400">{base}</span>/search?<span className="text-amber-300">pickup</span>=AMM&amp;<span className="text-amber-300">dropoff</span>=AMM&amp;<span className="text-amber-300">pickupDate</span>=YYYY-MM-DD&amp;<span className="text-amber-300">dropoffDate</span>=YYYY-MM-DD&amp;<span className="text-amber-300">startTime</span>=10:00&amp;<span className="text-amber-300">endTime</span>=10:00
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                <li><code className="font-mono">pickup</code> / <code className="font-mono">dropoff</code>: HogiCar location codes (airport IATA codes such as AMM, AQJ).</li>
                <li>Dates are <code className="font-mono">YYYY-MM-DD</code>; times are 24-hour <code className="font-mono">HH:MM</code>.</li>
                <li>Network click parameters (e.g. <code className="font-mono">awc</code>) are added by the network redirect – don’t hard-code them.</li>
              </ul>
            </div>
          </Card>
          <Card title="Deep-link builder" icon={Link2}>
            <DeepLinkBuilder />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedsTab;
