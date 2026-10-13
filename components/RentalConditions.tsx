import * as React from 'react';
import { createPortal } from 'react-dom';
import X from 'lucide-react/dist/esm/icons/x';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import CheckCircle from 'lucide-react/dist/esm/icons/circle-check';
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert';
import InfoIcon from 'lucide-react/dist/esm/icons/info';
import Check from 'lucide-react/dist/esm/icons/check';
import XMark from 'lucide-react/dist/esm/icons/x';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Phone from 'lucide-react/dist/esm/icons/phone';
import { Car, Supplier } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { normalizeRatingScore } from '../utils/ratings';

export type ConditionsLevel = 'great' | 'good' | 'fair';

interface Factor { good: boolean; text: string }

/**
 * Scores the offer's rental conditions from the supplier's own data only
 * (deposit, protection, mileage, fuel, pick-up, rating). No data → no points.
 */
export const getConditionsScore = (car: Car, supplier: Supplier = car.supplier) => {
  const factors: Factor[] = [];
  let points = 0;
  const add = (delta: number, text: string) => { points += delta; factors.push({ good: delta > 0, text }); };

  const deposit = Number(car.deposit || 0);
  if (deposit <= 0) add(2, 'No security deposit listed');
  else if (deposit <= 300) add(1, 'Low security deposit');
  else if (deposit > 800) add(-1, 'Higher security deposit');

  if (supplier?.includesCDW) add(1, 'Collision damage cover included');
  else add(-1, 'Collision damage cover not listed as included');

  if (car.unlimitedMileage) add(1, 'Unlimited mileage');
  else add(-1, 'Limited mileage');

  if (car.fuelPolicy === 'FULL_TO_FULL' || car.fuelPolicy === 'SAME_TO_SAME') add(1, 'Fair fuel policy (return as you got it)');
  else if (car.fuelPolicy === 'PRE_PURCHASE') add(-1, 'Fuel must be bought from the supplier');

  const pickup = supplier?.pickupType || (car as any).pickupType;
  if (pickup === 'IN_TERMINAL' || pickup === 'MEET_AND_GREET') add(1, pickup === 'IN_TERMINAL' ? 'Desk in the terminal' : 'Meet & greet pick-up');

  const score = normalizeRatingScore(Number(supplier?.rating || 0));
  if (score >= 8.5) add(1, 'Highly rated supplier');
  else if (score > 0 && score < 7) add(-1, 'Lower supplier rating');

  const level: ConditionsLevel = points >= 4 ? 'great' : points >= 1 ? 'good' : 'fair';
  return { level, points, factors };
};

const LEVEL = {
  great: {
    word: 'Great', filled: 3, bar: 'bg-[#1f8a4c]', text: 'text-[#16723d]', tile: 'bg-[#1f8a4c] text-white', sub: 'text-white/85',
    summary: 'Strong conditions: clear protection, a fair fuel policy and terms that keep surprises at the desk to a minimum.',
  },
  good: {
    word: 'Good', filled: 2, bar: 'bg-[#2f7fd1]', text: 'text-[#1f63ad]', tile: 'bg-[#2f7fd1] text-white', sub: 'text-white/85',
    summary: 'A solid offer with standard terms. Check the deposit and the card you will bring before you travel.',
  },
  fair: {
    word: 'Fair', filled: 1, bar: 'bg-[#f2c94c]', text: 'text-[#9a6b00]', tile: 'bg-[#f7d154] text-slate-900', sub: 'text-slate-800',
    summary: 'An acceptable offer, but some terms need attention, such as a higher deposit, limited mileage or a stricter fuel policy.',
  },
} as const;

const Segments: React.FC<{ level: ConditionsLevel; className?: string; segment?: string }> = ({ level, className = '', segment = 'h-1.5 w-7' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`} aria-hidden="true">
    {[0, 1, 2].map(i => (
      <span key={i} className={`${segment} rounded-full ${i < LEVEL[level].filled ? LEVEL[level].bar : 'bg-slate-300/80'}`} />
    ))}
  </span>
);

/** Pill shown on the car: "Great conditions ▬▬▬". Opens the full conditions. */
export const ConditionsChip: React.FC<{ car: Car; onClick: (e: React.MouseEvent) => void; className?: string }> = ({ car, onClick, className = '' }) => {
  const { level } = getConditionsScore(car);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-2.5 text-sm transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
      aria-label={`${LEVEL[level].word} rental conditions. Show details`}
    >
      <span className="font-semibold text-accent group-hover:underline group-hover:underline-offset-2">{LEVEL[level].word} conditions</span>
      <Segments level={level} segment="h-1.5 w-4" />
    </button>
  );
};

type Status = 'good' | 'warn' | 'info';
const StatusIcon: React.FC<{ status: Status }> = ({ status }) =>
  status === 'good' ? <CheckCircle className="h-6 w-6 text-[#1f8a4c]" strokeWidth={1.75} aria-label="Good" />
  : status === 'warn' ? <AlertTriangle className="h-6 w-6 text-slate-500" strokeWidth={1.75} aria-label="Please check" />
  : <InfoIcon className="h-6 w-6 text-slate-400" strokeWidth={1.75} aria-label="Information" />;

const Row: React.FC<{ title: string; value: React.ReactNode; status: Status; open: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, value, status, open, onToggle, children }) => (
  <div className="border-t border-slate-200 first:border-t-0">
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 py-4 text-left">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform ${open ? 'rotate-180' : ''}`}>
        <ChevronDown className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-snug text-slate-900">{title}</span>
        <span className="mt-0.5 block text-sm text-slate-600">{value}</span>
      </span>
      <StatusIcon status={status} />
    </button>
    {open && <div className="pb-5 pl-[3.25rem] pr-1 text-sm leading-relaxed text-slate-700">{children}</div>}
  </div>
);

const CardLine: React.FC<{ ok: boolean; children: React.ReactNode; logo?: React.ReactNode }> = ({ ok, children, logo }) => (
  <li className="flex items-center gap-3 py-1">
    {ok ? <Check className="h-5 w-5 shrink-0 text-[#1f8a4c]" /> : <XMark className="h-5 w-5 shrink-0 text-red-600" />}
    {logo}
    <span>{children}</span>
  </li>
);

const CardLogo: React.FC<{ kind: 'visa' | 'mc' | 'amex' }> = ({ kind }) => (
  <span className="flex h-7 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white">
    {kind === 'visa' && <span className="text-[13px] font-black italic tracking-tight text-[#1a1f71]">VISA</span>}
    {kind === 'mc' && (
      <svg viewBox="0 0 38 24" className="h-5 w-8" aria-hidden="true"><circle cx="15" cy="12" r="7" fill="#EB001B" /><circle cx="23" cy="12" r="7" fill="#F79E1B" /><path d="M19 6.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11z" fill="#FF5F00" /></svg>
    )}
    {kind === 'amex' && <span className="flex h-full w-full items-center justify-center bg-[#006fcf] text-[9px] font-black tracking-tight text-white">AMEX</span>}
  </span>
);

const fuelText = (p?: string) =>
  p === 'FULL_TO_FULL' ? 'Full to full' : p === 'SAME_TO_SAME' ? 'Same to same' : p === 'PRE_PURCHASE' ? 'Pre-purchase' : 'As stated by the supplier';

/** Full rental conditions: score, then one expandable row per condition. */
export const RentalConditionsModal: React.FC<{ car: Car; supplier?: Supplier; onClose: () => void }> = ({ car, supplier = car.supplier, onClose }) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { level, factors } = getConditionsScore(car, supplier);
  const L = LEVEL[level];
  const [open, setOpen] = React.useState<string | null>('card');
  const toggle = (id: string) => setOpen(o => (o === id ? null : id));
  const money = (v: number) => `${getCurrencySymbol()}${convertPrice(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const deposit = Number(car.deposit || 0);
  const excess = Number(car.excess || 0);
  const pickup = supplier?.pickupType || (car as any).pickupType;
  const pickupText = pickup === 'IN_TERMINAL' ? 'Rental desk in the terminal' : pickup === 'MEET_AND_GREET' ? 'Meet & greet' : pickup === 'SHUTTLE_BUS' ? 'Free shuttle bus to the desk' : car.locationDetail || 'Details in your voucher';
  const graceHours = supplier?.gracePeriodDays ? supplier.gracePeriodDays * 24 : Number(supplier?.gracePeriodHours || 0);
  const graceText = !graceHours ? 'Not listed' : graceHours >= 24 && graceHours % 24 === 0 ? `${graceHours / 24} day${graceHours === 24 ? '' : 's'}` : `${graceHours} hour${graceHours === 1 ? '' : 's'}`;
  const hours = supplier?.workingHours ? Object.entries(supplier.workingHours).filter(([, h]) => h) : [];
  const terms = (supplier?.termsAndConditions || '').trim();

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={(e) => { e.stopPropagation(); onClose(); }} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="rc-title" onClick={e => e.stopPropagation()}
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 id="rc-title" className="text-xl font-bold tracking-tight text-slate-900">Rental conditions</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-accent hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-5">
          {/* Score */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`relative ${['col-start-1', 'col-start-2', 'col-start-3'][L.filled - 1]}`}>
              <div className={`${L.tile} rounded-xl px-4 py-3 shadow-sm`}>
                <p className="text-3xl font-extrabold leading-none tracking-tight">{L.word}</p>
                <p className={`mt-2 text-[13px] font-medium leading-snug ${L.sub}`}>Rental conditions score</p>
              </div>
              <span className={`absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 ${L.tile.split(' ')[0]}`} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
            {[0, 1, 2].map(i => <span key={i} className={`h-1.5 rounded-full ${i < L.filled ? L.bar : 'bg-slate-200'}`} />)}
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-700">{L.summary}</p>

          {factors.length > 0 && (
            <ul className="mt-4 grid gap-1.5 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              {factors.map(f => (
                <li key={f.text} className="flex items-start gap-2">
                  {f.good ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1f8a4c]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                  <span className="text-slate-700">{f.text}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-slate-200">
            <Row title="Payment card required at pick-up" value="Credit card in the main driver's name" status="warn" open={open === 'card'} onToggle={() => toggle('card')}>
              <p>Bring a physical credit card in the main driver's full name. The supplier uses it for the security deposit and any charges at the desk.</p>
              <p className="mt-4 font-bold text-[#1f8a4c]">Accepted cards</p>
              <ul className="mt-1">
                <CardLine ok logo={<CardLogo kind="visa" />}>Visa credit</CardLine>
                <CardLine ok logo={<CardLogo kind="mc" />}>Mastercard credit</CardLine>
                <CardLine ok logo={<CardLogo kind="amex" />}>American Express credit</CardLine>
              </ul>
              <p className="mt-4 font-bold text-red-600">Usually not accepted</p>
              <ul className="mt-1">
                <CardLine ok={false}>Debit and prepaid cards</CardLine>
                <CardLine ok={false}>Cards not in the main driver's name</CardLine>
                <CardLine ok={false}>Cash</CardLine>
                <CardLine ok={false}>Cards in a phone wallet (Apple Pay, Google Pay)</CardLine>
              </ul>
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-slate-800"><span className="font-bold">Please note:</span> the card must have the number printed on it and enough available credit for the deposit.</p>
              </div>
            </Row>

            <Row title="Security deposit at pick-up" value={deposit > 0 ? money(deposit) : 'No deposit listed'} status={deposit > 800 ? 'warn' : 'good'} open={open === 'deposit'} onToggle={() => toggle('deposit')}>
              {deposit > 0
                ? <p>{money(deposit)} is blocked on your credit card when you collect the car. It is released after you return the car with no new damage and the agreed fuel level. Your bank decides how long the release takes, usually a few days.</p>
                : <p>The supplier has not listed a security deposit for this car. If one is asked at the desk, it is blocked on your credit card and released after return.</p>}
            </Row>

            <Row title="Included protection" value={supplier?.includesCDW ? (excess > 0 ? `~${money(excess)} excess / deductible` : 'Collision damage cover included') : 'See the supplier terms'} status={supplier?.includesCDW ? 'good' : 'warn'} open={open === 'protection'} onToggle={() => toggle('protection')}>
              <ul className="space-y-1.5">
                <CardLine ok={!!supplier?.includesCDW}>Collision damage waiver (CDW){supplier?.includesCDW ? ' included' : ' not listed as included'}</CardLine>
                <CardLine ok={!!supplier?.includesTP}>Theft protection (TP){supplier?.includesTP ? ' included' : ' not listed as included'}</CardLine>
              </ul>
              {excess > 0 && <p className="mt-3">If the car is damaged or stolen, you pay up to the excess of <span className="font-semibold">{money(excess)}</span>. The rest is covered.</p>}
            </Row>

            <Row title="Late return" value={graceHours ? `${graceText} grace period` : 'Not listed'} status={graceHours ? 'good' : 'info'} open={open === 'grace'} onToggle={() => toggle('grace')}>
              <p>{graceHours ? `You can return the car up to ${graceText} after the agreed time without an extra day being charged.` : 'The supplier has not listed a grace period. Return on time to avoid an extra day being charged.'}</p>
            </Row>

            <Row title="Driver requirements" value="Driving licence held for at least 1 year" status="info" open={open === 'driver'} onToggle={() => toggle('driver')}>
              <ul className="space-y-1.5">
                <CardLine ok>Full driving licence held for at least 1 year</CardLine>
                <CardLine ok>Passport or national ID matching the booking</CardLine>
                <CardLine ok>International driving permit if your licence is not in the Latin alphabet</CardLine>
              </ul>
            </Row>

            <Row title="Mileage" value={car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'} status={car.unlimitedMileage ? 'good' : 'warn'} open={open === 'mileage'} onToggle={() => toggle('mileage')}>
              <p>{car.unlimitedMileage ? 'Drive as far as you like. There is no charge for extra kilometres.' : 'A daily kilometre limit applies. Extra kilometres are charged by the supplier at the desk.'}</p>
            </Row>

            <Row title="Fuel policy" value={fuelText(car.fuelPolicy)} status={car.fuelPolicy === 'FULL_TO_FULL' || car.fuelPolicy === 'SAME_TO_SAME' ? 'good' : 'warn'} open={open === 'fuel'} onToggle={() => toggle('fuel')}>
              <p>{car.fuelPolicy === 'FULL_TO_FULL' ? 'You get the car with a full tank and return it full. Only pay for the fuel you use.' : car.fuelPolicy === 'SAME_TO_SAME' ? 'Return the car with the same fuel level as at pick-up.' : car.fuelPolicy === 'PRE_PURCHASE' ? 'You buy a full tank from the supplier at pick-up. Unused fuel is not refunded.' : 'The supplier explains the fuel policy at the desk.'}</p>
            </Row>

            <Row title="Pick-up" value={pickupText} status={pickup === 'IN_TERMINAL' || pickup === 'MEET_AND_GREET' ? 'good' : 'info'} open={open === 'pickup'} onToggle={() => toggle('pickup')}>
              {supplier?.address && <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{supplier.address}</p>}
              {supplier?.phone && <p className="mt-2 flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{supplier.phone}</p>}
              {hours.length > 0 && (
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                  {hours.map(([d, h]) => <React.Fragment key={d}><dt className="capitalize text-slate-500">{d}</dt><dd className="font-medium text-slate-800">{h}</dd></React.Fragment>)}
                </dl>
              )}
              {!supplier?.address && !supplier?.phone && hours.length === 0 && <p>The exact desk location and contact number are in your booking voucher.</p>}
            </Row>

            {terms && (
              <Row title="Supplier terms" value="Full terms from the supplier" status="info" open={open === 'terms'} onToggle={() => toggle('terms')}>
                <p className="max-h-64 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-[13px] text-slate-600">{terms}</p>
              </Row>
            )}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">The score is worked out from the supplier's own conditions for this car. The supplier checks your documents and card at pick-up.</p>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default RentalConditionsModal;
