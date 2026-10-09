import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Clock from 'lucide-react/dist/esm/icons/clock';
import SEOMetadata from '../components/SEOMetadata';
import { API_BASE_URL } from '../lib/config';
import { persistSelectedCar } from '../utils/storage';
import { setPriceHold } from '../utils/priceHold';
import { useCurrency } from '../contexts/CurrencyContext';

type Resume = {
  held: boolean; holdEnded?: boolean; expiresAt?: number; secondsLeft?: number; quote?: any;
  stage?: string; carId?: string; carName?: string; price?: number; currency?: string;
  firstName?: string; email?: string; search: Record<string, string | null>;
};

const tripParams = (search: Resume['search']) => {
  const p = new URLSearchParams();
  Object.entries(search || {}).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
  return p;
};

/**
 * "Continue my booking" from the reminder email. While the 20-minute price lock runs, restores the exact
 * quote the customer saw and opens that car; after it ends, offers today's prices for the same trip.
 */
const ResumeBooking: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const [data, setData] = React.useState<Resume | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/api/public/checkout/resume/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Resume) => {
        if (!alive) return;
        if (d.held && d.quote?.id != null && d.expiresAt) {
          const params = tripParams(d.search);
          persistSelectedCar(d.quote, [d.quote]);
          setPriceHold(String(d.quote.id), d.expiresAt);
          // Guests who reached the details step get their name and email filled in again.
          try {
            if (d.email && !sessionStorage.getItem('hogicar_customer_profile')) {
              sessionStorage.setItem('hogicar_customer_profile', JSON.stringify({ firstName: d.firstName || '', lastName: '', email: d.email, phoneNumber: '', flightNumber: '' }));
            }
          } catch { /* storage blocked */ }
          navigate(`/car/${encodeURIComponent(String(d.quote.id))}?${params.toString()}`, { replace: true, state: { cars: [d.quote], priceLocked: true } });
          return;
        }
        setData(d);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [token, navigate]);

  const searchUrl = data ? (() => {
    const p = tripParams(data.search);
    if (data.carId) p.set('car', data.carId);
    return data.search?.pickup ? `/search?${p.toString()}` : '/';
  })() : '/';

  const price = data?.price != null
    ? `${getCurrencySymbol()}${convertPrice(Number(data.price)).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
    : null;

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-12 sm:py-16">
      <SEOMetadata title="Continue your booking | HogiCar" description="Pick up your HogiCar booking where you left off." noIndex={true} />
      <div className="mx-auto max-w-lg">
        {!data && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm" role="status">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Lock className="h-6 w-6" /></span>
            <h1 className="mt-5 text-xl font-bold text-slate-900">Restoring your locked price…</h1>
            <p className="mt-2 text-sm text-slate-500">Taking you back to your car.</p>
            <LoaderCircle className="mx-auto mt-6 h-6 w-6 animate-spin text-accent" />
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">This link has expired</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">We couldn't find this booking reminder. Search again to see the latest cars and prices.</p>
            <Link to="/" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90">Search cars</Link>
          </div>
        )}

        {data && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#00244f] via-[#00306a] to-[#005b96] px-8 py-7 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> {data.holdEnded ? 'Price lock ended' : 'Welcome back'}</span>
              <h1 className="mt-4 text-2xl font-bold">{data.holdEnded ? 'Your 20-minute price lock has ended' : 'Pick up where you left off'}</h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {data.holdEnded
                  ? 'Prices and availability can change, so we\'ll show you today\'s price for the same trip. It only takes a moment.'
                  : 'We\'ll show you today\'s price for the same trip.'}
              </p>
            </div>
            <div className="px-8 py-6">
              {data.carName && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your car</p>
                    <p className="font-semibold text-slate-900">{data.carName} <span className="font-normal text-slate-500">or similar</span></p>
                  </div>
                  {price && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Earlier price</p>
                      <p className="font-semibold text-slate-500">{price}</p>
                    </div>
                  )}
                </div>
              )}
              <Link to={searchUrl} className="mt-5 flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white hover:opacity-90">
                See today's price
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBooking;
