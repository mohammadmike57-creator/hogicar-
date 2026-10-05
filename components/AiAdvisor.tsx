import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import X from 'lucide-react/dist/esm/icons/x';
import Send from 'lucide-react/dist/esm/icons/send';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Star from 'lucide-react/dist/esm/icons/star';
import { Car } from '../types';
import { calculatePrice } from '../utils/bookingUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import { normalizeRatingScore, formatCategoryName } from '../utils/ratings';
import { localAdvisorAnswer } from '../utils/localAdvisor';

interface AiAdvisorProps {
  cars: Car[];
  days: number;
  startDate: string;
  endDate: string;
  pickupName: string;
  dropoffName?: string | null;
  activeFilters: string[];
  /** Lift the launcher above other fixed bars (e.g. the compare bar). */
  raised?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  onViewCar: (carId: string) => void;
}

interface Pick { carId: string; label: string; reason: string }
interface ChatMessage { role: 'user' | 'assistant'; content: string; picks?: Pick[]; error?: boolean }

const SUGGESTIONS = [
  'Which car is the best value?',
  'Which cars have the lowest deposit?',
  'Best car for a family of 4 with luggage',
  'Compare the cheapest automatic cars',
];

const MAX_CARS_SENT = 60;

export const AI_ADVISOR_OPEN_EVENT = 'hogicar:open-ai-advisor';
export const openAiAdvisor = (question?: string) => window.dispatchEvent(new CustomEvent(AI_ADVISOR_OPEN_EVENT, { detail: question }));

const fuelLabel = (policy?: string) => {
  const value = String(policy || '').toUpperCase().replace(/[\s-]+/g, '_');
  if (value.includes('FULL_TO_FULL')) return 'Full to full';
  if (value.includes('SAME_TO_SAME')) return 'Same to same';
  if (value.includes('PRE')) return 'Pre-purchase';
  return policy || undefined;
};

const pickupLabel = (car: Car) => {
  const type = car.supplier?.pickupType as string | undefined;
  if (type === 'IN_TERMINAL') return 'In terminal';
  if (type === 'MEET_AND_GREET') return 'Meet & greet';
  if (type === 'SHUTTLE_BUS') return 'Free shuttle bus';
  return car.locationDetail || undefined;
};

const carName = (car: Car) => (car.displayName || `${car.make} ${car.model}`).replace(/\s+or similar\s*$/i, '').trim();

/** Renders the advisor's plain-text reply, turning "- " lines into a bullet list. */
const ReplyText: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-4 list-disc space-y-1 marker:text-accent">
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    );
    bullets = [];
  };
  text.split('\n').forEach(raw => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) { bullets.push(bullet[1]); return; }
    flush();
    blocks.push(<p key={`p-${blocks.length}`}>{line}</p>);
  });
  flush();
  return <div className="space-y-2">{blocks}</div>;
};

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ cars, days, startDate, endDate, pickupName, dropoffName, activeFilters, raised, onEnabledChange, onViewCar }) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  // true when the server-side AI model is configured; otherwise the built-in engine answers.
  const [cloudAi, setCloudAi] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const symbol = getCurrencySymbol();
  const askRef = React.useRef<((q: string) => void) | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/status')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (!cancelled) setCloudAi(Boolean(data?.enabled)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => { onEnabledChange?.(true); }, [onEnabledChange]);

  // Other parts of the page can open the advisor, optionally with a question.
  React.useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const question = (e as CustomEvent<string | undefined>).detail;
      if (question) askRef.current?.(question);
    };
    window.addEventListener(AI_ADVISOR_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(AI_ADVISOR_OPEN_EVENT, onOpen);
  }, []);

  const carById = React.useMemo(() => new Map(cars.map(c => [c.id, c])), [cars]);
  const totalFor = React.useCallback((car: Car) => Math.round(convertPrice(calculatePrice(car, days, startDate).total) * 100) / 100, [convertPrice, days, startDate]);

  const carPayload = React.useMemo(() => cars.filter(c => c.isAvailable !== false).slice(0, MAX_CARS_SENT).map(car => {
    const total = totalFor(car);
    return {
      id: car.id,
      name: carName(car),
      category: formatCategoryName(car.category),
      supplier: car.supplier?.name,
      supplierRating: car.supplier?.rating ? Number(normalizeRatingScore(car.supplier.rating).toFixed(1)) : undefined,
      totalPrice: total,
      pricePerDay: Math.round((total / Math.max(1, days)) * 100) / 100,
      deposit: car.deposit ? Math.round(convertPrice(car.deposit)) : undefined,
      excess: car.excess ? Math.round(convertPrice(car.excess)) : undefined,
      transmission: car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual',
      seats: car.passengers,
      bags: car.bags,
      doors: car.doors,
      fuelPolicy: fuelLabel(car.fuelPolicy),
      unlimitedMileage: car.unlimitedMileage,
      pickupLocation: pickupLabel(car),
      paymentType: car.supplier?.commissionType === 'PAY_AT_DESK' ? 'Pay at pick-up' : car.supplier?.commissionType === 'PARTIAL_PREPAID' ? 'Part now, rest at pick-up' : 'Pay now',
      specialOffer: Boolean(car.promotionAmount || car.promotionPercent || car.hogicarChoice),
    };
  }), [cars, totalFor, convertPrice, days]);

  // Lock page scroll on mobile while the sheet is open; close on Escape.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    const previous = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      window.clearTimeout(t);
    };
  }, [open]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || sending) return;
    const history: ChatMessage[] = [...messages.filter(m => !m.error), { role: 'user', content: text }];
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    const answerLocally = async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
      const local = localAdvisorAnswer(text, carPayload, symbol, days, history.slice(0, -1));
      setMessages(prev => [...prev, { role: 'assistant', content: local.reply, picks: local.picks }]);
    };
    try {
      if (!cloudAi) {
        await answerLocally();
        return;
      }
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({
            role: m.role,
            content: m.picks?.length
              ? `${m.content}\n(Recommended: ${m.picks.map(p => `${p.label} = ${p.carId}`).join('; ')})`
              : m.content,
          })),
          cars: carPayload,
          trip: { pickupLocation: pickupName, dropoffLocation: dropoffName || pickupName, pickupDate: startDate, dropoffDate: endDate, days, currency: symbol, activeFilters },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error(data?.error || 'The AI advisor is busy right now. Please try again in a moment.');
      if (!response.ok || !data?.reply) {
        await answerLocally();
        return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, picks: Array.isArray(data.picks) ? data.picks : [] }]);
    } catch (error) {
      if (error instanceof Error && /busy/.test(error.message)) {
        setMessages(prev => [...prev, { role: 'assistant', content: error.message, error: true }]);
      } else {
        await answerLocally();
      }
    } finally {
      setSending(false);
    }
  };

  askRef.current = ask;

  const viewCar = (carId: string) => {
    if (window.matchMedia('(max-width: 1023px)').matches) setOpen(false);
    onViewCar(carId);
  };

  if (typeof document === 'undefined') return null;

  const launcher = (
    <AnimatePresence>
      {!open && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={() => setOpen(true)}
          className={`fixed right-4 z-[110] flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#003580] to-accent pl-3.5 pr-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,53,128,0.6)] ring-1 ring-white/20 transition-transform hover:-translate-y-0.5 sm:right-6 ${raised ? 'bottom-24' : 'bottom-5 sm:bottom-6'}`}
          aria-label="Ask the Hogicar AI advisor"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <Sparkles className="h-4 w-4" />
          </span>
          Ask AI advisor
        </motion.button>
      )}
    </AnimatePresence>
  );

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-950/40 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <motion.section
            key="panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="ai-advisor-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[130] flex h-[88dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-7rem))] sm:w-[400px] sm:rounded-2xl sm:ring-1 sm:ring-slate-200"
          >
            <header className="flex items-center gap-3 bg-gradient-to-r from-[#003580] to-[#0a4fa6] px-4 py-3.5 text-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="ai-advisor-title" className="flex items-center gap-2 text-sm font-bold">
                  Hogicar AI advisor
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Beta</span>
                </h2>
                <p className="truncate text-xs text-white/75">Comparing {carPayload.length} car{carPayload.length === 1 ? '' : 's'} in {pickupName || 'your search'}</p>
              </div>
              {messages.length > 0 && (
                <button type="button" onClick={() => setMessages([])} className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white" aria-label="Start a new conversation" title="New conversation">
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close AI advisor">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4" aria-live="polite">
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent"><Sparkles className="h-3.5 w-3.5" /></span>
                <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                  Hi! Tell me what matters for your trip (budget, deposit, luggage, automatic…) and I'll compare these deals and pick the best ones for you.
                </div>
              </div>

              {messages.length === 0 && (
                <div className="space-y-2 pl-9">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Try asking</p>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:border-accent hover:text-accent"
                    >
                      {s}
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-white">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent"><Sparkles className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ${m.error ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-white text-slate-700 ring-slate-200/70'}`}>
                      <ReplyText text={m.content} />
                    </div>
                    {m.picks?.map((p, rank) => {
                      const car = carById.get(p.carId);
                      if (!car) return null;
                      const rating = car.supplier?.rating ? normalizeRatingScore(car.supplier.rating) : 0;
                      return (
                        <div key={p.carId} className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${rank === 0 ? 'ring-emerald-300' : 'ring-slate-200'}`}>
                          <div className="flex items-center gap-3 p-3">
                            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                              <img src={car.image} alt="" className="max-h-12 w-auto max-w-full object-contain" loading="lazy" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${rank === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-accent-50 text-accent-800'}`}>{p.label}</span>
                              <p className="mt-1 truncate text-sm font-bold text-slate-900">{carName(car)}</p>
                              <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                                {car.supplier?.name}
                                {rating > 0 && <><span aria-hidden>·</span><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{rating.toFixed(1)}</>}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-base font-extrabold text-slate-900">{symbol}{totalFor(car).toFixed(2)}</p>
                              <p className="text-[11px] text-slate-500">{days} day{days === 1 ? '' : 's'}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                            <p className="min-w-0 text-xs leading-snug text-slate-600">{p.reason}</p>
                            <button type="button" onClick={() => viewCar(p.carId)} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-700">
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex gap-2.5" role="status" aria-label="AI advisor is thinking">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent"><Sparkles className="h-3.5 w-3.5" /></span>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70">
                    {[0, 1, 2].map(d => (
                      <motion.span key={d} className="h-2 w-2 rounded-full bg-accent/70" animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                    <span className="ml-1.5 text-xs text-slate-500">Comparing deals…</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); ask(input); }}
              className="border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
            >
              <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 1000))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
                  rows={1}
                  placeholder="Ask about price, deposit, luggage…"
                  className="max-h-28 min-h-[24px] flex-1 resize-none border-0 bg-transparent p-0 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
                  aria-label="Your question"
                />
                <button type="submit" disabled={!input.trim() || sending} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-700 disabled:bg-slate-200 disabled:text-slate-400" aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">AI can make mistakes. Check the car's details before you book.</p>
            </form>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(<>{launcher}{panel}</>, document.body);
};

export default AiAdvisor;
