import * as React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Heart from 'lucide-react/dist/esm/icons/heart';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';

const FACES = [
  { score: 1, emoji: '😠', label: 'Very poor' },
  { score: 2, emoji: '😕', label: 'Poor' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😍', label: 'Excellent' },
];

const GOOD = [
  { id: 'EASY_SEARCH', label: 'Easy to search' },
  { id: 'GOOD_PRICES', label: 'Good prices' },
  { id: 'CLEAR_INFO', label: 'Clear car details' },
  { id: 'FAST_CHECKOUT', label: 'Quick checkout' },
  { id: 'GOOD_CHOICE', label: 'Great choice of cars' },
];
const BAD = [
  { id: 'HARD_TO_USE', label: 'Hard to use' },
  { id: 'PRICE_UNCLEAR', label: 'Price wasn’t clear' },
  { id: 'SLOW_SITE', label: 'Site was slow' },
  { id: 'PAYMENT_ISSUE', label: 'Payment problem' },
  { id: 'FEW_CARS', label: 'Not enough choice' },
];

/** "How was booking with HogiCar?" — opened from the email sent after booking. The score in the link is saved at once. */
const BookingFeedback: React.FC = () => {
  const { ref = '' } = useParams<{ ref: string }>();
  const [params] = useSearchParams();
  const token = params.get('token');
  const linkScore = Math.max(0, Math.min(5, Number(params.get('score')) || 0));

  const [ctx, setCtx] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [score, setScore] = React.useState(linkScore);
  const [tags, setTags] = React.useState<string[]>([]);
  const [comment, setComment] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);
  const savedScore = React.useRef(0);

  const saveScore = React.useCallback(async (value: number) => {
    if (!token || value < 1 || savedScore.current === value) return;
    savedScore.current = value;
    try { await api.submitExperience(ref, { token, score: value }); } catch { savedScore.current = 0; }
  }, [ref, token]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.fetchExperienceContext(ref, { token });
        if (!alive) return;
        setCtx(data);
        if (!linkScore && data.score) { setScore(data.score); savedScore.current = data.score; }
        if (Array.isArray(data.tags)) setTags(data.tags);
        if (data.comment) setComment(data.comment);
        // One click in the email is a complete answer, so record it straight away.
        if (linkScore) saveScore(linkScore);
      } catch (e: any) {
        if (alive) setLoadError(e?.response?.data?.message || 'We couldn’t open this survey.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ref, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (value: number) => { setScore(value); saveScore(value); };
  const toggle = (id: string) => setTags(t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1) { setError('Choose how booking went first.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.submitExperience(ref, { token, score, tags, comment: comment.trim() });
      try { (window as any).dataLayer?.push({ event: 'booking_experience_feedback', score }); } catch { /* ignore */ }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We couldn’t send your feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const chips = score >= 4 ? GOOD : score > 0 && score <= 2 ? BAD : [...GOOD.slice(0, 3), ...BAD.slice(0, 3)];

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOMetadata title="Your booking experience | HogiCar" description="Tell us how booking with HogiCar went." noIndex={true} />
      <div className="relative overflow-hidden bg-gradient-to-br from-[#00244f] via-[#00306a] to-[#005b96] pb-28 pt-10 text-white sm:pb-32 sm:pt-14">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">Booking {ref}</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">How was booking with HogiCar?</h1>
          <p className="mx-auto mt-3 max-w-md text-base text-white/70">{ctx?.firstName ? `Thanks, ${ctx.firstName}. ` : ''}Your answer goes straight to our team and shapes what we improve next.</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-20 max-w-2xl px-4 pb-16 sm:-mt-24 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          {loading ? (
            <div className="flex justify-center p-16"><LoaderCircle className="h-7 w-7 animate-spin text-accent" /></div>
          ) : loadError ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
              <h2 className="mt-3 text-lg font-semibold text-slate-900">This link didn’t work</h2>
              <p className="mt-1 text-sm text-slate-600">{loadError}</p>
              <Link to="/contact?topic=FEEDBACK" className="mt-5 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">Send feedback another way</Link>
            </div>
          ) : done ? (
            <div className="p-8 text-center sm:p-12">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 ring-8 ring-rose-50/50"><Heart className="h-8 w-8 fill-rose-500 text-rose-500" /></span>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Thank you!</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">We read every answer. Have a great trip{ctx?.pickupDate ? ` on ${ctx.pickupDate}` : ''}.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/my-bookings" className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">Manage booking</Link>
                <Link to="/help" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Help Center</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="p-5 sm:p-8">
              <div role="radiogroup" aria-label="Booking experience" className="grid grid-cols-5 gap-2 sm:gap-3">
                {FACES.map(f => {
                  const on = score === f.score;
                  return (
                    <button key={f.score} type="button" role="radio" aria-checked={on} onClick={() => pick(f.score)}
                      className={`flex flex-col items-center rounded-2xl px-1 py-3 ring-1 transition-all sm:py-4 ${on ? 'scale-[1.04] bg-accent-50 ring-2 ring-accent shadow-sm' : 'bg-slate-50 ring-slate-200 hover:bg-white hover:ring-slate-300'}`}>
                      <span className={`text-3xl transition-transform sm:text-4xl ${on ? '' : score ? 'opacity-50 grayscale' : ''}`} aria-hidden="true">{f.emoji}</span>
                      <span className={`mt-1.5 text-[11px] font-semibold sm:text-xs ${on ? 'text-accent-700' : 'text-slate-600'}`}>{f.label}</span>
                    </button>
                  );
                })}
              </div>
              {score > 0 && token && <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Your rating is saved. Add details below if you like.</p>}

              {score > 0 && (
                <>
                  <h2 className="mt-7 text-base font-semibold text-slate-900">{score >= 4 ? 'What did you like most?' : score <= 2 ? 'What went wrong?' : 'What stood out?'}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chips.map(c => {
                      const on = tags.includes(c.id);
                      return (
                        <button key={c.id} type="button" aria-pressed={on} onClick={() => toggle(c.id)}
                          className={`h-9 rounded-full px-4 text-sm font-medium ring-1 transition-colors ${on ? 'bg-accent text-white ring-accent' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'}`}>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                  <label htmlFor="fb-comment" className="mt-6 block text-base font-semibold text-slate-900">Anything else? <span className="text-sm font-normal text-slate-400">(optional)</span></label>
                  <textarea id="fb-comment" rows={4} maxLength={2000} value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="One thing we could make better…"
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-300 p-4 text-base outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </>
              )}

              {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</p>}

              <button disabled={saving || score < 1} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-50">
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Send feedback
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">Questions about your booking? <Link to="/help" className="font-medium text-accent hover:underline">Visit the Help Center</Link></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFeedback;
