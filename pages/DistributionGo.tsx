import * as React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert';
import Info from 'lucide-react/dist/esm/icons/info';
import SEOMetadata from '../components/SEOMetadata';
import { API_BASE_URL } from '../lib/config';
import { saveDistributionClick } from '../utils/distributionClick';

type Opened = {
  outcome: 'RESTORED' | 'PRICE_CHANGED' | 'UNAVAILABLE' | 'EXPIRED' | 'INVALID';
  clickToken?: string | null; channelName?: string | null; search?: Record<string, string> | null; carId?: number | null;
  match?: { supplier: string; vehicle: string } | null;
  offerPrice?: number | null; currentPrice?: number | null; currency?: string | null; message?: string | null;
};

const money = (v?: number | null, c?: string | null) =>
  v == null ? '' : `${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || ''}`.trim();

/**
 * Landing page for offers shown on Skyscanner, KAYAK and other channels. The link carries only an
 * opaque offer reference: the server revalidates the car and price, and the original search is
 * restored so the customer never re-enters it.
 */
const DistributionGo: React.FC = () => {
  const { offerRef = '' } = useParams<{ offerRef: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState<Opened | null>(null);
  const [failed, setFailed] = React.useState(false);

  const resultsUrl = (d: Opened, withCar: boolean) => {
    const p = new URLSearchParams();
    Object.entries(d.search || {}).forEach(([k, v]) => { if (v) p.set(k, v); });
    if (withCar && d.carId) p.set('car', String(d.carId));
    if (withCar && d.match) p.set('match', `${d.match.supplier}|${d.match.vehicle}`);
    return `/search?${p.toString()}`;
  };

  React.useEffect(() => {
    let alive = true;
    const campaign = params.get('cmp') || params.get('utm_campaign') || undefined;
    fetch(`${API_BASE_URL}/api/public/distribution/deeplinks/${encodeURIComponent(offerRef)}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ ch: params.get('ch') || undefined, campaign, referrer: document.referrer || undefined }),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Opened) => {
        if (!alive) return;
        saveDistributionClick(d.clickToken);
        if (d.outcome === 'RESTORED' && d.search) {
          navigate(resultsUrl(d, true), { replace: true });
          return;
        }
        setData(d);
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerRef]);

  const card = 'mx-auto my-10 max-w-lg rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 sm:my-16 sm:p-8';
  const primary = 'inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f]';
  const secondary = 'inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50';

  if (failed) {
    return (
      <div className="px-4">
        <SEOMetadata title="Your car hire search | HogiCar" description="Continue your car hire search on HogiCar." noIndex />
        <div className={card}>
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">We couldn't open this offer</h1>
          <p className="mt-2 text-sm text-slate-600">Please search again to see today's prices.</p>
          <Link to="/" className={`${primary} mt-6`}>Search cars</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-slate-600">
        <SEOMetadata title="Checking your offer | HogiCar" description="Checking the latest price and availability." noIndex />
        <LoaderCircle className="h-8 w-8 animate-spin text-[#007ac2]" />
        <p className="text-sm">Checking the latest price and availability…</p>
      </div>
    );
  }

  const changed = data.outcome === 'PRICE_CHANGED';
  const unavailable = data.outcome === 'UNAVAILABLE';
  return (
    <div className="px-4">
      <SEOMetadata title="Your car hire search | HogiCar" description="Continue your car hire search on HogiCar." noIndex />
      <div className={card}>
        {changed ? <Info className="mx-auto h-10 w-10 text-[#007ac2]" /> : <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />}
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          {changed ? 'The price has changed' : unavailable ? 'This car is no longer available' : 'This offer has ended'}
        </h1>
        {changed ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-inset ring-slate-200">
            <div className="flex justify-between"><span className="text-slate-500">Price when you searched</span><span className="tabular-nums text-slate-500 line-through">{money(data.offerPrice, data.currency)}</span></div>
            <div className="mt-1 flex justify-between font-semibold text-slate-900"><span>Price now</span><span className="tabular-nums">{money(data.currentPrice, data.currency)}</span></div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">{data.message}</p>
        )}
        {data.channelName && <p className="mt-3 text-xs text-slate-400">You came from {data.channelName}.</p>}
        <div className="mt-6 space-y-2">
          {changed && data.search && <button className={primary} onClick={() => navigate(resultsUrl(data, true))}>Continue with this car</button>}
          {data.search
            ? <button className={changed ? secondary : primary} onClick={() => navigate(resultsUrl(data, false))}>See all cars for my dates</button>
            : <Link to="/" className={primary}>Start a new search</Link>}
        </div>
      </div>
    </div>
  );
};

export default DistributionGo;
