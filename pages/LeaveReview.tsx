import * as React from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Star from 'lucide-react/dist/esm/icons/star';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import BadgeDollarSign from 'lucide-react/dist/esm/icons/badge-dollar-sign';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Users from 'lucide-react/dist/esm/icons/users';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Car from 'lucide-react/dist/esm/icons/car';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';

const WORDS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

type Key = 'cleanliness' | 'condition' | 'valueForMoney' | 'pickupSpeed' | 'staffService' | 'dropoffSpeed' | 'easeOfLocating';

const CATEGORIES: { key: Key; label: string; hint: string; icon: any; optional?: boolean }[] = [
  { key: 'cleanliness', label: 'Car cleanliness', hint: 'Inside and out, when you collected it', icon: Sparkles },
  { key: 'condition', label: 'Car condition', hint: 'Tyres, brakes, no warning lights', icon: Wrench },
  { key: 'valueForMoney', label: 'Value for money', hint: 'Did the total match what you got?', icon: BadgeDollarSign },
  { key: 'pickupSpeed', label: 'Pick-up speed', hint: 'Time from the desk to the car', icon: Clock },
  { key: 'staffService', label: 'Staff service', hint: 'Friendly, clear and helpful', icon: Users },
  { key: 'dropoffSpeed', label: 'Drop-off', hint: 'Quick and fair return check', icon: RotateCcw, optional: true },
  { key: 'easeOfLocating', label: 'Finding the desk', hint: 'Easy to find at the location', icon: MapPin, optional: true },
];

const Stars = ({ value, onChange, size = 'h-7 w-7', label }: { value: number; onChange: (v: number) => void; size?: string; label: string }) => {
  const [hover, setHover] = React.useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}, ${WORDS[n]}`}
          onClick={() => onChange(n)} onMouseEnter={() => setHover(n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <Star className={`${size} transition-colors ${shown >= n ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50">
    <SEOMetadata title="Review your rental | HogiCar" description="Rate your car and rental company." noIndex={true} />
    <div className="relative overflow-hidden bg-[#00244f] pb-28 pt-10 text-white sm:pb-32 sm:pt-14">
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#007ac2]/40 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Verified booking review</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">How was your rental?</h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-white/70">Your rating is added to the rental company’s score on HogiCar and helps other travellers choose with confidence.</p>
      </div>
    </div>
    <div className="relative z-10 mx-auto -mt-20 max-w-3xl px-4 pb-16 sm:-mt-24 sm:px-6">{children}</div>
  </div>
);

const LeaveReview: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const ref = String(bookingId || '').trim();
  const [params] = useSearchParams();
  const location = useLocation();
  const token = params.get('token');
  const [email, setEmail] = React.useState<string>((location.state as any)?.email || '');
  const [emailInput, setEmailInput] = React.useState('');
  const [ctx, setCtx] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  const initialOverall = Math.max(0, Math.min(5, Number(params.get('overall')) || 0));
  const [overall, setOverall] = React.useState(initialOverall);
  const [scores, setScores] = React.useState<Record<Key, number>>({ cleanliness: 0, condition: 0, valueForMoney: 0, pickupSpeed: 0, staffService: 0, dropoffSpeed: 0, easeOfLocating: 0 });
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [missing, setMissing] = React.useState<Set<string>>(new Set());
  const [done, setDone] = React.useState<number | null>(null);
  const [imgFailed, setImgFailed] = React.useState(false);

  // Clear the warning for each category as soon as it is rated.
  const rated = (key: string) => {
    setMissing(m => {
      if (!m.has(key)) return m;
      const next = new Set(m);
      next.delete(key);
      if (next.size === 0) setError('');
      return next;
    });
  };

  const load = React.useCallback(async (mail: string) => {
    if (!token && !mail) { setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    try {
      setCtx(await api.fetchReviewContext(ref, { token, email: mail || null }));
    } catch (e: any) {
      setLoadError(e?.response?.data?.message || 'We couldn’t open this review. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ref, token]);

  React.useEffect(() => { load(email); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: (Key | 'overall')[] = ['overall', ...CATEGORIES.filter(c => !c.optional).map(c => c.key)];
    const empty = required.filter(k => (k === 'overall' ? overall : scores[k as Key]) < 1);
    setMissing(new Set(empty));
    if (empty.length) {
      setError('Please rate the overall experience and each required category.');
      document.getElementById(`rate-${empty[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.submitReview(ref, {
        token, email: email || null, overall, comment: comment.trim(),
        ...Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v || null])),
      });
      setDone(res?.rating ?? overall);
      try { (window as any).dataLayer?.push({ event: 'review_submitted', rating: overall }); } catch { /* ignore */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We couldn’t send your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Shell><div className="flex items-center justify-center rounded-3xl bg-white p-16 shadow-xl ring-1 ring-slate-200"><LoaderCircle className="h-7 w-7 animate-spin text-accent" /></div></Shell>;
  }

  if (!token && !email) {
    return (
      <Shell>
        <form onSubmit={e => { e.preventDefault(); if (emailInput.trim()) { setEmail(emailInput.trim()); load(emailInput.trim()); } }}
          className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Confirm it’s your booking</h2>
          <p className="mt-1 text-sm text-slate-600">Enter the email address used for booking <strong>{ref}</strong>.</p>
          <label htmlFor="review-email" className="mt-5 block text-sm font-medium text-slate-700">Email address</label>
          <input id="review-email" type="email" required autoComplete="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
          <button className="mt-4 h-12 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-700">Continue</button>
        </form>
      </Shell>
    );
  }

  if (loadError || !ctx) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">This link didn’t work</h2>
          <p className="mt-1 text-sm text-slate-600">{loadError || 'Please open the link from your email again.'}</p>
          <Link to="/my-bookings" className="mt-5 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">Go to Manage booking</Link>
        </div>
      </Shell>
    );
  }

  const supplier = ctx.supplierName || 'the rental company';

  const summary = (
    <div className="flex items-center gap-4 border-b border-slate-100 p-5 sm:p-6">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
        {ctx.carImage && !imgFailed ? <img src={ctx.carImage} alt="" onError={() => setImgFailed(true)} className="h-full w-full object-contain" /> : <Car className="h-7 w-7 text-slate-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-900">{ctx.carName || 'Your rental car'}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{supplier}</span>
          {ctx.pickupDate && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {ctx.pickupDate} – {ctx.dropoffDate}</span>}
          <span>Ref {ctx.bookingRef}</span>
        </p>
      </div>
      {ctx.supplierLogoUrl && <img src={ctx.supplierLogoUrl} alt={supplier} className="hidden h-8 w-auto max-w-[96px] object-contain sm:block" />}
    </div>
  );

  if (done != null || ctx.alreadyReviewed) {
    const rating = done ?? ctx.review?.rating;
    return (
      <Shell>
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          {summary}
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50"><CheckCircle className="h-9 w-9 text-emerald-500" /></span>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">{done != null ? 'Thank you for your review!' : 'You’ve already reviewed this rental'}</h2>
            {rating != null && (
              <div className="mt-3 flex items-center justify-center gap-1" aria-label={`${rating} out of 5`}>
                {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-6 w-6 ${Number(rating) >= n - 0.25 ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}`} />)}
                <span className="ml-2 text-sm font-semibold text-slate-700">{Number(rating).toFixed(1)} / 5</span>
              </div>
            )}
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">Your rating is now part of {supplier}’s score on HogiCar. It helps other travellers, and helps the rental company keep standards high.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/" className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">Plan your next trip</Link>
              <Link to="/my-bookings" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Manage booking</Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!ctx.canReview) {
    return (
      <Shell>
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          {summary}
          <div className="p-8 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Not quite yet</h2>
            <p className="mt-1 text-sm text-slate-600">{ctx.reason}</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={submit} noValidate className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        {summary}

        <section id="rate-overall" className={`border-b border-slate-100 p-5 text-center sm:p-8 ${missing.has('overall') && overall < 1 ? 'bg-rose-50/60' : ''}`}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Overall, how was {supplier}?</h2>
          <div className="mt-3 flex justify-center"><Stars value={overall} onChange={v => { setOverall(v); rated('overall'); }} size="h-10 w-10 sm:h-12 sm:w-12" label="Overall rating" /></div>
          <p className="mt-2 h-5 text-sm font-semibold text-amber-600">{WORDS[overall]}</p>
        </section>

        <section className="p-5 sm:p-8">
          <h2 className="text-base font-semibold text-slate-900">Rate the details</h2>
          <p className="mt-0.5 text-sm text-slate-500">Each one feeds the matching score on the rental company’s profile.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map(c => {
              const bad = missing.has(c.key) && scores[c.key] < 1;
              return (
                <li key={c.key} id={`rate-${c.key}`}
                  className={`rounded-2xl p-4 ring-1 transition-colors ${bad ? 'bg-rose-50 ring-rose-200' : scores[c.key] ? 'bg-amber-50/40 ring-amber-200/70' : 'bg-slate-50 ring-slate-200/70'}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent ring-1 ring-slate-200"><c.icon className="h-[18px] w-[18px]" /></span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{c.label} {c.optional && <span className="font-normal text-slate-400">(optional)</span>}</p>
                      <p className="text-xs text-slate-500">{c.hint}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Stars value={scores[c.key]} onChange={v => { setScores(s => ({ ...s, [c.key]: v })); rated(c.key); }} label={c.label} />
                    <span className="text-xs font-semibold text-amber-700">{WORDS[scores[c.key]]}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <label htmlFor="review-comment" className="mt-7 block text-base font-semibold text-slate-900">Tell other travellers more <span className="text-sm font-normal text-slate-400">(optional)</span></label>
          <textarea id="review-comment" rows={5} maxLength={2000} value={comment} onChange={e => setComment(e.target.value)}
            placeholder="What went well? Anything the rental company could do better?"
            className="mt-2 w-full resize-y rounded-2xl border border-slate-300 p-4 text-base outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20" />
          <p className="mt-1 text-right text-xs text-slate-400">{comment.length} / 2000</p>

          {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</p>}

          <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Shown with your first name and last initial only.</p>
            <button disabled={submitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-7 text-sm font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-60 sm:w-auto">
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Submit review
            </button>
          </div>
        </section>
      </form>
    </Shell>
  );
};

export default LeaveReview;
