import * as React from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { applyPickupOverrides, loadPickupOverrides } from '../utils/pickupOverrides';
const getPromoCode = (code: string): PromoCode | undefined => {
  return undefined; // Mock data removed
};
import Check from 'lucide-react/dist/esm/icons/check';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import User from 'lucide-react/dist/esm/icons/user';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Fuel from 'lucide-react/dist/esm/icons/fuel';
import Info from 'lucide-react/dist/esm/icons/info';
import CreditCardIcon from 'lucide-react/dist/esm/icons/credit-card';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Tag from 'lucide-react/dist/esm/icons/tag';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import Snowflake from 'lucide-react/dist/esm/icons/snowflake';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Navigation from 'lucide-react/dist/esm/icons/navigation';
import Baby from 'lucide-react/dist/esm/icons/baby';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import Star from 'lucide-react/dist/esm/icons/star';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import GaugeCircle from 'lucide-react/dist/esm/icons/gauge-circle';
import Hash from 'lucide-react/dist/esm/icons/hash';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import Wind from 'lucide-react/dist/esm/icons/wind';
import Thermometer from 'lucide-react/dist/esm/icons/thermometer';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Battery from 'lucide-react/dist/esm/icons/battery';
import Coffee from 'lucide-react/dist/esm/icons/coffee';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Award from 'lucide-react/dist/esm/icons/award';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Building from 'lucide-react/dist/esm/icons/building';
import Bus from 'lucide-react/dist/esm/icons/bus';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Zap from 'lucide-react/dist/esm/icons/zap';
import ThumbsUp from 'lucide-react/dist/esm/icons/thumbs-up';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import Plane from 'lucide-react/dist/esm/icons/plane';
import PickupTypeIcon from '../components/PickupTypeIcon';
import PlaneLanding from 'lucide-react/dist/esm/icons/plane-landing';
import PlaneTakeoff from 'lucide-react/dist/esm/icons/plane-takeoff';
import { Car, CommissionType, Supplier, PromoCode, Extra, CarCategory } from '../types';
import { RatingsModal } from '../components/RatingsModal';
import { getRatingDescription, getRatingColor, getRatingTextColor, formatCategoryName, getCarRatings, normalizeRatingScore } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { Logo } from '../components/Logo';
import { calcPricing, rentalDays } from '../utils/pricing';
import { supplierApi } from '../lib/api';
import { persistSelectedCar } from '../utils/storage';
import { loadCars } from '../utils/loadCars';
import { apiCarsToCars } from '../utils/apiCarToCar';
import ShareCarButton, { ShareCarDetails } from '../components/ShareCar';
import AddonsSection from '../components/AddonsSection';
import { buildCarAddons, countSelected, extraUnitTotal, loadAddonSettings, withAddons } from '../utils/addons';

// ==================== Helper Components ====================

const StructuredData: React.FC<{ car: Car; total: number; currencyCode: string }> = ({ car, total, currencyCode }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${car.make} ${car.model}`,
    "image": car.image,
    "description": `Rent a ${car.make} ${car.model} (${formatCategoryName(car.category)}) from ${car.supplier.name}. Features include ${car.passengers} seats and space for ${car.bags} bags.`,
    "brand": { "@type": "Brand", "name": car.make },
    "vehicleModelDate": car.year,
    "vehicleTransmission": car.transmission,
    "offers": {
      "@type": "Offer",
      "price": total.toFixed(2),
      "priceCurrency": currencyCode,
      "availability": car.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": { "@type": "Organization", "name": car.supplier.name }
    }
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group inline-flex ml-1">
    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-2 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
    </div>
  </div>
);

const CarDoorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M19 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9"/><path d="M12 15V6"/><path d="M4 15h16"/><path d="M15 11h-1"/>
  </svg>
);

const AutomaticIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}>
    <path d="M12 2v2.34"/><path d="M12 10.32v1.34"/><path d="M7.11 4.41 8 6.1"/><path d="M16 6.1l.89-1.69"/><path d="M4.41 16.89l1.69-.89"/><path d="M17.9 16l1.69.89"/><path d="M2 12h2.34"/><path d="M19.66 12H22"/><path d="M12 14.66V16"/><path d="M12 22v-2.34"/><path d="m15 12-3-3-3 3"/><path d="M12 9v13"/>
  </svg>
);

// Payment Icons (same as your existing)
const VisaIcon = () => (
  <div className="w-[38px] h-[24px] bg-white rounded shadow-sm flex items-center justify-center overflow-hidden px-1">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg"
      alt="Visa"
      className="w-full h-auto object-contain"
    />
  </div>
);
const MastercardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="white" rx="3"/><circle cx="13" cy="12" r="7" fill="#EA001B"/><circle cx="25" cy="12" r="7" fill="#F79E1B"/><path d="M20.5 12a7.002 7.002 0 01-7.5-6.96A7.002 7.002 0 0013 19a7.002 7.002 0 007.5-6.96A7.002 7.002 0 0120.5 12z" fill="#FF5F00"/></svg> );
const AmexIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="#006FCF" rx="3"/><rect x="4" y="4" width="30" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/><text x="19" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white">AMEX</text></svg> );

// Rental Conditions Modal
const RentalConditionsModal = ({ car, supplier, onClose }: { car: Car; supplier: Supplier; onClose: () => void }) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const workingHours = supplier.workingHours ? Object.entries(supplier.workingHours) : [];
  const gracePeriodInfo = supplier.gracePeriodDays ? `${supplier.gracePeriodDays} day(s)` : `${supplier.gracePeriodHours} hour(s)`;
  const depositText = car.deposit > 0 ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'No deposit listed';
  const excessAmount = car.excess;
  const excessText = excessAmount > 0 ? `${getCurrencySymbol()}${convertPrice(excessAmount).toFixed(2)}` : 'See supplier terms';
  const supplierLogo = supplier.logo || (supplier as any).logoUrl;
  const pickupTypeLabel =
    supplier.pickupType === 'IN_TERMINAL' ? 'In terminal' :
    supplier.pickupType === 'MEET_AND_GREET' ? 'Meet & greet' :
    supplier.pickupType === 'SHUTTLE_BUS' ? 'Shuttle bus' :
    car.locationDetail || 'Location details at pickup';
  const paymentTypeLabel =
    supplier.commissionType === 'FULL_PREPAID' ? 'Full prepayment online' :
    supplier.commissionType === 'PARTIAL_PREPAID' ? 'Partial payment online' :
    'Pay at rental desk';
  const supplierRatingDisplay = parseFloat(normalizeRatingScore(supplier.rating).toFixed(1));

  const PolicyRow = ({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) => (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className={`text-right text-xs font-black ${tone === 'good' ? 'text-accent' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  );

  const ConditionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col font-sans overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-4 p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex min-w-0 items-center gap-4">
            {(car as any).isHogicarChoiceBranded ? (
              <>
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex shrink-0 items-center justify-center shadow-lg border border-amber-500/30">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Rental conditions</p>
                   <h3 className="text-lg font-black text-slate-950 truncate">Hogicar verified fleet</h3>
                   <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Hogicar Exclusive Verified Fleet</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                  {supplierLogo === 'HOGICAR_CHOICE_LOGO' ? (
                    <Logo className="h-8 w-auto max-w-[150px]" />
                  ) : supplierLogo ? (
                    <img src={supplierLogo} alt={supplier.name} className="max-h-10 max-w-full object-contain" />
                  ) : (
                    <Building className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Rental conditions</p>
                  <h3 className="text-lg font-black text-slate-950 truncate">{supplier.name}</h3>
                  <p className="text-xs font-bold text-slate-500 truncate">{car.displayName || `${car.make} ${car.model}`}</p>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 shrink-0"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deposit</p><p className="mt-1 text-sm font-black text-slate-950">{depositText}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Excess</p><p className="mt-1 text-sm font-black text-slate-950">{excessText}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mileage</p><p className="mt-1 text-sm font-black text-slate-950">{car.unlimitedMileage ? 'Unlimited' : 'Limited'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pickup</p><p className="mt-1 flex items-center gap-1.5 text-sm font-black text-slate-950"><PickupTypeIcon type={supplier.pickupType} size="xs" />{pickupTypeLabel}</p></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
            <div className="space-y-4">
              <ConditionCard icon={<CreditCardIcon className="h-4 w-4" />} title="Payment, deposit and card rules">
                <PolicyRow label="Payment type" value={paymentTypeLabel} />
                <PolicyRow label="Security deposit" value={depositText} tone={car.deposit > 0 ? 'warn' : 'default'} />
                <PolicyRow label="Accepted cards" value={<span className="inline-flex items-center gap-1.5"><VisaIcon /><MastercardIcon /><AmexIcon /></span>} />
                <PolicyRow label="Card holder" value="Main driver's name required" />
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">A physical credit card may be required at the rental desk. Prepaid, virtual, or third-party cards may be refused by the supplier.</p>
              </ConditionCard>

              <ConditionCard icon={<Users className="h-4 w-4" />} title="Required at pick-up">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><Shield className="mb-2 h-4 w-4 text-accent" /><p className="text-xs font-black text-slate-900">Driving license</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Held for at least 1 year. International permit may be required.</p></div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><Users className="mb-2 h-4 w-4 text-accent" /><p className="text-xs font-black text-slate-900">Passport or ID</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">A valid photo ID matching the main driver details.</p></div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><CreditCardIcon className="mb-2 h-4 w-4 text-accent" /><p className="text-xs font-black text-slate-900">Credit card</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Must have enough available funds for the deposit.</p></div>
                </div>
              </ConditionCard>

              <ConditionCard icon={<Shield className="h-4 w-4" />} title="Insurance and protection">
                <PolicyRow label="Collision Damage Waiver" value={supplier.includesCDW ? 'Included' : 'See supplier terms'} tone={supplier.includesCDW ? 'good' : 'default'} />
                <PolicyRow label="Theft Protection" value={supplier.includesTP ? 'Included' : 'See supplier terms'} tone={supplier.includesTP ? 'good' : 'default'} />
                <PolicyRow label="Damage excess" value={excessText} />
                <PolicyRow label="One-way fee" value={supplier.oneWayFee ? `${getCurrencySymbol()}${convertPrice(supplier.oneWayFee).toFixed(2)}` : 'Not listed'} />
              </ConditionCard>

              <ConditionCard icon={<Fuel className="h-4 w-4" />} title="Mileage, fuel and vehicle policy">
                <PolicyRow label="Mileage" value={car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'} tone={car.unlimitedMileage ? 'good' : 'default'} />
                <PolicyRow label="Fuel policy" value={car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car.fuelPolicy.replace(/_/g, ' ')} />
                <PolicyRow label="Transmission" value={car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'} />
                <PolicyRow label="Vehicle class" value={`${formatCategoryName(car.category)} or similar`} />
              </ConditionCard>
            </div>

            <aside className="space-y-4">
              <ConditionCard icon={<Building className="h-4 w-4" />} title="Supplier and location">
                <PolicyRow label="Supplier" value={supplier.name} />
                <PolicyRow label="Rating" value={`${supplierRatingDisplay.toFixed(1)}/10 - ${getRatingDescription(supplierRatingDisplay)}`} tone={supplierRatingDisplay >= 8 ? 'good' : supplierRatingDisplay >= 6 ? 'default' : 'warn'} />
                <PolicyRow label="Pickup type" value={<span className="inline-flex items-center gap-1.5"><PickupTypeIcon type={supplier.pickupType} size="xs" />{pickupTypeLabel}</span>} />
                {supplier.address && <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><p className="text-xs font-semibold leading-relaxed text-slate-600">{supplier.address}</p></div>}
              </ConditionCard>

              <ConditionCard icon={<Clock className="h-4 w-4" />} title="Pickup and return rules">
                <PolicyRow label="Booking mode" value={supplier.bookingMode === 'FREE_SALE' ? 'Instant confirmation' : 'On request'} tone={supplier.bookingMode === 'FREE_SALE' ? 'good' : 'default'} />
                <PolicyRow label="Lead time" value={supplier.minBookingLeadTime ? `${supplier.minBookingLeadTime} hour(s)` : 'Not listed'} />
                <PolicyRow label="Late return grace" value={gracePeriodInfo} />
                {workingHours.length > 0 && <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Opening hours</p>{workingHours.map(([day, hours]) => <div key={day} className="flex justify-between gap-3 text-xs"><span className="capitalize font-semibold text-slate-500">{day}</span><span className="text-right font-black text-slate-800">{hours}</span></div>)}</div>}
              </ConditionCard>
            </aside>
          </div>

          <ConditionCard icon={<FileText className="h-4 w-4" />} title="Supplier rental terms">
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 custom-scrollbar">
              <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-600">{supplier.termsAndConditions || 'No additional supplier terms have been provided for this vehicle. Standard rental desk policies may still apply at pickup.'}</p>
            </div>
          </ConditionCard>
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">Final acceptance depends on presenting the required documents and card at pickup.</p>
          <button onClick={onClose} className="bg-accent text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-accent-700 shadow-sm transition-transform active:scale-95">Got it</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

const categoryRanks: Record<string, number> = {
  [CarCategory.MINI]: 1,
  [CarCategory.ECONOMY]: 2,
  [CarCategory.COMPACT]: 3,
  [CarCategory.MIDSIZE]: 4,
  [CarCategory.INTERMEDIATE]: 5,
  [CarCategory.STANDARD]: 6,
  [CarCategory.FULLSIZE]: 7,
  [CarCategory.PREMIUM]: 8,
  [CarCategory.LUXURY]: 9,
  [CarCategory.SUV]: 10,
  [CarCategory.VAN]: 11,
  [CarCategory.PEOPLE_CARRIER]: 12,
};

const normMatch = (value?: string) => String(value || '').toLowerCase().replace(/\s+or similar\s*$/i, '').replace(/[^a-z0-9]+/g, '');

const withTimeout = <T,>(promise: Promise<T>, ms: number) => new Promise<T>((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
  promise.then(v => { window.clearTimeout(timer); resolve(v); }, e => { window.clearTimeout(timer); reject(e); });
});

/**
 * Finds the car from a shared link by running the search again. External offers get a new
 * id on every search, so besides the id the car is matched by name, supplier and category.
 * Page 0 (our own fleet plus the first provider page) is checked first, then the remaining
 * provider pages in parallel; the first match wins, and every request has a time limit so
 * the page never waits forever.
 */
const findCarInSearch = async (
  id: string,
  params: { pickupCode?: string; dropoffCode?: string; pickupDate: string; dropoffDate: string; startTime?: string; endTime?: string },
  hint: { name?: string; supplier?: string; category?: string },
  onProgress?: (step: number) => void,
): Promise<{ car: Car | null; cars: Car[] }> => {
  const all: Car[] = [];
  const wantChoice = id.startsWith('choice-');
  const byId = (c: Car) => String(c.id) === id;
  const byHint = (c: Car) => !!hint.name && normMatch(c.displayName || `${c.make} ${c.model}`) === normMatch(hint.name)
    && (!hint.supplier || normMatch(c.supplier?.name) === normMatch(hint.supplier))
    && (!hint.category || String(c.category) === hint.category)
    && !!c.isHogicarChoiceBranded === wantChoice;
  const pick = (list: Car[]) => list.find(byId) || list.find(byHint) || null;
  const fetchPage = async (page: number) => {
    const res = await withTimeout(loadCars({ locationsOptions: [], ...params, page, size: 20 }), 25000);
    const list = apiCarsToCars(res.cars || []);
    all.push(...list);
    return { list, hasNext: !!res.hasNext };
  };

  onProgress?.(1);
  let hasNext = true;
  try {
    const first = await fetchPage(0);
    const hit = pick(first.list);
    if (hit) return { car: hit, cars: all };
    hasNext = first.hasNext;
  } catch (e) {
    console.warn('CarDetails: first search page failed', e);
  }
  if (!hasNext) return { car: null, cars: all };

  onProgress?.(2);
  // The backend serves at most 5 provider pages.
  const pages = [1, 2, 3, 4];
  const car = await new Promise<Car | null>(resolve => {
    let pending = pages.length;
    pages.forEach(page => {
      fetchPage(page)
        .then(({ list }) => { const hit = pick(list); if (hit) resolve(hit); })
        .catch(() => undefined)
        .finally(() => { pending -= 1; if (pending === 0) resolve(pick(all)); });
    });
  });
  return { car, cars: all };
};

const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol, selectedCurrency } = useCurrency();

  const [car, setCar] = React.useState<Car | null>(null);
  const [cars, setCars] = React.useState<Car[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // 0 = not searching, 1 = checking our fleet, 2 = checking more suppliers (shared links).
  const [lookupStep, setLookupStep] = React.useState(0);

  // Extract search params
  const startDate = searchParams.get('pickupDate') || searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('dropoffDate') || searchParams.get('endDate') || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const startTime = searchParams.get('startTime') || '10:00';
  const endTime = searchParams.get('endTime') || '10:00';
  const pickupCode = searchParams.get('pickup');

  // Apply admin-set pick-up types for external suppliers (same as on the search page).
  React.useEffect(() => {
    if (!car) return;
    let cancelled = false;
    loadPickupOverrides().then(map => {
      if (cancelled) return;
      const [updated] = applyPickupOverrides([car], map, pickupCode || undefined);
      if (updated !== car) setCar(updated);
    });
    return () => { cancelled = true; };
  }, [car, pickupCode]);

  // Add-ons (additional driver, child seats, ...) with the prices set in the admin.
  React.useEffect(() => {
    if (!car) return;
    let cancelled = false;
    loadAddonSettings().then(settings => {
      if (cancelled) return;
      const updated = withAddons(car, buildCarAddons(car, settings, pickupCode || undefined));
      if (updated !== car) setCar(updated);
    });
    return () => { cancelled = true; };
  }, [car, pickupCode]);
  const dropoffCode = searchParams.get('dropoff');
  const pickupName = searchParams.get('pickupName') || pickupCode || '';
  const dropoffName = searchParams.get('dropoffName') || dropoffCode || pickupName || '';
  const days = rentalDays(startDate, endDate);

  const timeUntilPickup = React.useMemo(() => {
    const pickupDateTime = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    const diffMs = pickupDateTime.getTime() - now.getTime();
    if (diffMs <= 0) return "In progress";
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    if (d > 0) return `${d}d ${h}h remaining`;
    if (h > 0) return `${h}h ${Math.floor((diffMs / (1000 * 60)) % 60)}m remaining`;
    return "Starting soon";
  }, [startDate, startTime]);

  // Load car from sessionStorage / state / API
  React.useEffect(() => {
    const loadCar = async () => {
      if (!car || String(car.id) !== String(id)) {
        setLoading(true);
      }
      setError(null);

      // 1. sessionStorage
      const storedCarRaw = sessionStorage.getItem('hogicar_selectedCar');
      const storedCarsRaw = sessionStorage.getItem('hogicar_cars');
      let foundCar: Car | null = null;
      let foundCars: Car[] = [];
      const stateCars = Array.isArray(location.state?.cars) ? location.state.cars : [];
      const stateCar = id && stateCars.length
        ? stateCars.find((c: Car) => String(c.id) === String(id)) || null
        : null;

      if (storedCarRaw) {
        try {
          const parsed = JSON.parse(storedCarRaw);
          if (parsed && (!id || String(parsed.id) === String(id))) foundCar = parsed;
        } catch (e) {}
      }
      if (storedCarsRaw) {
        try {
          const parsed = JSON.parse(storedCarsRaw);
          if (Array.isArray(parsed)) {
            foundCars = parsed;
            // Also search in foundCars if not found yet
            if (!foundCar && id) {
              foundCar = foundCars.find((c: Car) => String(c.id) === String(id)) || null;
            }
          }
        } catch (e) {}
      }

      // 2. location.state
      if (stateCars.length) {
        if (!foundCars.length) foundCars = stateCars;
        if (!foundCar) foundCar = stateCar;
        if (foundCar && stateCar && !(foundCar.image || (foundCar as any).imageUrl) && (stateCar.image || (stateCar as any).imageUrl)) {
          foundCar = {
            ...foundCar,
            image: stateCar.image || (stateCar as any).imageUrl,
            imageUrl: (stateCar as any).imageUrl || stateCar.image,
          } as Car;
        }
      }

      // 3. Not on this device (e.g. a shared link): run the search again and find the car,
      //    by id, or by name and supplier when the provider issued a new id.
      if (id && (!foundCar || !(foundCar.image || (foundCar as any).imageUrl))) {
        try {
          const { car: refreshedCar, cars: refreshedCars } = await findCarInSearch(id, {
            pickupCode: pickupCode || undefined,
            dropoffCode: dropoffCode || pickupCode || undefined,
            pickupDate: startDate,
            dropoffDate: endDate,
            startTime,
            endTime,
          }, { name: searchParams.get('car') || undefined, supplier: searchParams.get('supplier') || undefined, category: searchParams.get('category') || undefined }, setLookupStep);
          if (!foundCars.length && refreshedCars.length) foundCars = refreshedCars;
          if (!foundCar) {
            foundCar = refreshedCar;
          } else if (refreshedCar?.image) {
            foundCar = { ...foundCar, image: refreshedCar.image, imageUrl: refreshedCar.image } as Car;
          }
        } catch (fetchError) {
          console.error('CarDetails: could not load the car from search', fetchError);
        }
      }

      // 4. fallback to mock data
      if (!foundCar && id) {
        const mockCar = null; // Mock data removed
        if (mockCar) foundCar = mockCar as any;
      }

      // Ensure all foundCars have images if they are missing
      if (foundCars.length > 0) {
        foundCars = foundCars.map(c => {
          if (!c.image && (c as any).imageUrl) {
            return { ...c, image: (c as any).imageUrl };
          }
          return c;
        });
      }

      if (foundCar) {
        setCar(foundCar);
        setCars(foundCars.length ? foundCars : [foundCar]);
        persistSelectedCar(foundCar, foundCars.length ? foundCars : [foundCar]);
      } else {
        setError('This deal is no longer available for these dates. Search again to see the latest prices.');
      }
      setLookupStep(0);
      setLoading(false);
    };
    loadCar();
  }, [id, location.state]);

  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>([]);
  const [insuranceOption, setInsuranceOption] = React.useState<'basic' | 'full'>('basic');
  const [timeLeft, setTimeLeft] = React.useState(20 * 60);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);
  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null);
  const [promoError, setPromoError] = React.useState('');
  const [showFullSpecs, setShowFullSpecs] = React.useState(false);
  const [showRatingsTooltip, setShowRatingsTooltip] = React.useState(false);
  const closeRatings = React.useCallback(() => setShowRatingsTooltip(false), []);

  React.useEffect(() => {
    if (timeLeft === 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const priceDetails = React.useMemo(() => {
    if (!car) return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, hogicarPromoAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    return calcPricing(car, { pickupDate: startDate, dropoffDate: endDate }, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, startDate, endDate, selectedExtraIds, insuranceOption, appliedPromo]);


  const handleApplyPromo = () => {
    if (!promoCodeInput) { setPromoError('Enter a code.'); return; }
    const promo = getPromoCode(promoCodeInput);
    if (promo && promo.status === 'active') { setAppliedPromo(promo); setPromoError(''); } else { setAppliedPromo(null); setPromoError('Invalid or expired code.'); }
  };

  const handleContinue = () => {
    if (car) {
      persistSelectedCar(car, cars);
    }
  };

  const bookingParams = new URLSearchParams({ 
    pickupDate: startDate, 
    dropoffDate: endDate, 
    startTime, 
    endTime, 
    ...(pickupCode && { pickup: pickupCode }), 
    ...(dropoffCode && { dropoff: dropoffCode }), 
    ...(selectedExtraIds.length && { extras: selectedExtraIds.join(',') }), 
    ...(appliedPromo && { promo: appliedPromo.code }) 
  }).toString();

  const [imageError, setImageError] = React.useState(false);
  const displayImage = imageError ? 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle' : (car?.image || car?.imageUrl || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle');
  const pickupDisplay = new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dropoffDisplay = new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const supplierLogo = car?.supplier.logo || (car?.supplier as any)?.logoUrl;
  const depositDisplay = car?.deposit ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'Not listed';
  const excessDisplay = car?.excess ? `${getCurrencySymbol()}${convertPrice(car.excess).toFixed(2)}` : 'See terms';

  const sharedName = searchParams.get('car');
  const sharedSupplier = searchParams.get('supplier');
  const tripLine = `${pickupName ? `${pickupName} · ` : ''}${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const searchAgainUrl = (() => {
    const p = new URLSearchParams();
    ['pickup', 'dropoff', 'pickupName', 'dropoffName', 'startTime', 'endTime'].forEach(k => { const v = searchParams.get(k); if (v) p.set(k, v); });
    p.set('pickupDate', startDate);
    p.set('dropoffDate', endDate);
    if (!p.get('pickupName') && pickupCode) p.set('pickupName', pickupCode);
    return `/search?${p.toString()}`;
  })();

  if (loading) {
    if (lookupStep === 0) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center"><LoaderCircle className="w-10 h-10 animate-spin text-accent mx-auto" /><p className="mt-4 text-sm text-slate-600">Loading car details…</p></div>
        </div>
      );
    }
    const steps = ['Opening the shared deal', 'Checking live prices and availability', 'Comparing every supplier for your dates'];
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 w-full overflow-hidden bg-slate-100"><div className="h-full w-1/3 animate-[shareload_1.4s_ease-in-out_infinite] rounded-full bg-accent" /></div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Shared with you</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{sharedName ? `${sharedName} or similar` : 'Finding this car'}</h1>
            <p className="mt-1 text-sm text-slate-500">{[sharedSupplier, tripLine].filter(Boolean).join(' · ')}</p>
            <ol className="mt-6 space-y-3">
              {steps.map((label, i) => {
                const done = i < lookupStep;
                const active = i === lookupStep;
                return (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-600 text-white' : active ? 'bg-accent-50 text-accent ring-1 ring-accent/30' : 'bg-slate-100 text-slate-400'}`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : active ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={done ? 'text-slate-500' : active ? 'font-medium text-slate-900' : 'text-slate-400'}>{label}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-6 text-xs text-slate-500">Prices are checked live with the rental companies, so this can take a few seconds.</p>
          </div>
        </div>
        <style>{`@keyframes shareload{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200"><CarIcon className="h-7 w-7" /></span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">{sharedName ? 'This deal has been booked up' : 'Car not found'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {sharedName
              ? <>The <span className="font-semibold text-slate-900">{sharedName}</span>{sharedSupplier ? <> from {sharedSupplier}</> : null} is no longer available for these dates. Prices and availability change quickly.</>
              : (error || 'This car is no longer available. Please search again.')}
          </p>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{tripLine}</p>
          <div className="mt-6 grid gap-2">
            <Link to={searchAgainUrl} className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-700">See available cars for these dates</Link>
            <Link to="/" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Start a new search</Link>
          </div>
        </div>
      </div>
    );
  }

  const ratingToDisplay = parseFloat(normalizeRatingScore(car.supplier.rating).toFixed(1));
  const money = (amount: number) => `${getCurrencySymbol()}${convertPrice(amount).toFixed(2)}`;
  const carName = (car.displayName || `${car.make} ${car.model}`).replace(/\s+or similar\s*$/i, '');
  const fuelLabel = car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car.fuelPolicy.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  const isInstant = car.supplier.bookingMode === 'FREE_SALE' || !car.supplier.bookingMode;
  const isChoiceBrand = supplierLogo === 'HOGICAR_CHOICE_LOGO' || car.supplier.name === 'Hogi Car Choice';
  const pickupPlace = pickupName || car.locationDetail || pickupCode || '';
  const dropoffPlace = dropoffName || pickupName || car.locationDetail || dropoffCode || pickupCode || '';
  const upgrades = cars
    ? cars
        .filter(c => c.id !== car.id && c.supplier.id === car.supplier.id && (categoryRanks[c.category] || 0) > (categoryRanks[car.category] || 0))
        .sort((a, b) => (categoryRanks[a.category] || 0) - (categoryRanks[b.category] || 0))
        .slice(0, 4)
    : [];
  const fullProtectionPrice = 15 * days;

  const shareDetails: ShareCarDetails = (() => {
    const params = new URLSearchParams(searchParams);
    // Name, supplier and category let the link find the car again if the provider issues a new id.
    params.set('car', carName);
    if (!isChoiceBrand) params.set('supplier', car.supplier.name); else params.delete('supplier');
    params.set('category', String(car.category));
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hogicar.com';
    return {
      carName,
      category: formatCategoryName(car.category),
      supplierName: isChoiceBrand ? 'Hogicar Choice' : car.supplier.name,
      supplierLogo: isChoiceBrand ? undefined : supplierLogo,
      seats: car.passengers,
      bags: car.bags,
      transmission: car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual',
      image: displayImage,
      // The car's price; add-ons the sharer picked are personal and not part of the link.
      priceText: money(priceDetails.finalTotal - priceDetails.extrasCost),
      days,
      place: pickupPlace,
      datesText: `${pickupDisplay} – ${dropoffDisplay}`,
      url: `${origin}/car/${encodeURIComponent(String(car.id))}?${params.toString()}`,
    };
  })();

  const specs = [
    { icon: Users, label: `${car.passengers} seats` },
    { icon: Briefcase, label: `${car.bags} bag${car.bags === 1 ? '' : 's'}` },
    { icon: CarDoorIcon, label: `${car.doors} doors` },
    { icon: AutomaticIcon, label: car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual' },
    { icon: Snowflake, label: 'Air conditioning' },
  ];

  const highlights = [
    { label: 'Free cancellation', detail: 'Before pick-up' },
    { label: car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage', detail: 'Mileage policy', positive: car.unlimitedMileage },
    { label: `Fuel: ${fuelLabel}`, detail: 'Fuel policy' },
    ...(isInstant ? [{ label: 'Instant confirmation', detail: 'Booking mode' }] : []),
  ];

  const ratingButton = (
    <button
      type="button"
      className="relative inline-flex items-center gap-2 rounded-lg text-left"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowRatingsTooltip(true);
      }}
      aria-haspopup="dialog"
      aria-label="Show rating details"
    >
      <span className={`${getRatingColor(ratingToDisplay)} inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md rounded-bl-none px-1.5 text-sm font-bold text-white`}>
        {ratingToDisplay.toFixed(1)}
      </span>
      <span className="leading-tight">
        <span className={`block text-sm font-semibold ${getRatingTextColor(ratingToDisplay)}`}>{getRatingDescription(ratingToDisplay)}</span>
        {(car.supplier.reviewCount ?? (car.supplier as any).ratingReviewCount) ? <span className="block text-xs text-slate-500">{Number(car.supplier.reviewCount ?? (car.supplier as any).ratingReviewCount).toLocaleString()} reviews</span> : <span className="block text-xs text-slate-500">Customer rating</span>}
      </span>
      <Info className="h-3.5 w-3.5 text-slate-400" />
    </button>
  );

  const supplierMark = isChoiceBrand ? (
    <Logo className="h-7 w-auto max-w-[120px]" />
  ) : supplierLogo ? (
    <img src={supplierLogo} alt={car.supplier.name} className="h-8 w-auto max-w-[110px] object-contain" />
  ) : (
    <span className="text-sm font-semibold text-slate-700">{car.supplier.name}</span>
  );

  return (
    <>
      <SEOMetadata title={`Rent a ${car.make} ${car.model} | Hogicar`} description={car.isHogicarChoiceBranded ? `Book ${car.make} ${car.model} from our exclusive verified fleet. Best price guaranteed.` : `Book ${car.make} ${car.model} from ${car.supplier.name}. Best price guaranteed.`} />
      <StructuredData car={car} total={convertPrice(priceDetails.finalTotal)} currencyCode={selectedCurrency} />
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}
      <RatingsModal
        open={showRatingsTooltip}
        onClose={closeRatings}
        ratings={getCarRatings(car)}
        rating={ratingToDisplay}
        supplierName={car.supplier.name}
        supplierLogo={supplierMark}
        reviewCount={car.supplier.reviewCount ?? (car.supplier as any).ratingReviewCount}
      />

      <div className="min-h-screen bg-slate-50 pb-32 text-slate-900 lg:pb-16">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <BookingStepper currentStep={3} />

          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Review your deal</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {pickupDisplay}, {startTime} – {dropoffDisplay}, {endTime} · {days} day{days > 1 ? 's' : ''}
              </p>
            </div>
<div className="flex items-center gap-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Price held for <span className="font-mono font-semibold text-slate-700">{formatTime(timeLeft)}</span>
              </p>
              <ShareCarButton details={shareDetails} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
            {/* Main column (flattened on mobile so the price card can sit between sections) */}
            <div className="contents lg:block lg:space-y-6">

              {/* Car */}
              <section className="order-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:order-none">
                <div className="grid sm:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="relative flex items-center justify-center bg-slate-50 px-6 py-4 sm:py-8">
                    <img
                      src={displayImage}
                      alt={carName}
                      onError={() => setImageError(true)}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      className="h-auto max-h-28 w-full max-w-[220px] object-contain sm:max-h-44 sm:max-w-[260px]"
                    />
                    {car.tags?.[0] && (
                      <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white">{car.tags[0]}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold leading-tight text-slate-900">
                          {carName} <span className="text-sm font-normal text-slate-500">or similar</span>
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{formatCategoryName(car.category)}{car.sippCode ? ` · ${car.sippCode}` : ''}</p>
                      </div>
                      <div className="shrink-0">{supplierMark}</div>
                    </div>

                    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                      {specs.map(spec => (
                        <li key={spec.label} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                          <spec.icon className="h-4 w-4 text-slate-500" />
                          {spec.label}
                        </li>
                      ))}
                    </ul>

                    <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                      {highlights.map(item => (
                        <li key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                          <Check className={`h-4 w-4 shrink-0 ${item.positive === false ? 'text-slate-400' : 'text-emerald-600'}`} />
                          {item.label}
                        </li>
                      ))}
                    </ul>

                    {car.isHogicarChoiceBranded ? (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-medium text-amber-700">
                        <Award className="h-4 w-4" /> Hogicar Choice · verified fleet
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        {ratingButton}
                        <span className="text-xs text-slate-500">Supplied by <span className="font-medium text-slate-700">{car.supplier.name}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Pick-up and drop-off */}
              <section className="order-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:order-none">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900">Pick-up and drop-off</h2>
                  <span className="hidden shrink-0 text-xs font-medium text-slate-500 sm:inline">{timeUntilPickup}</span>
                </div>
                <ol className="relative grid gap-4 sm:grid-cols-2 sm:gap-6">
                  {[
                    { title: 'Pick-up', icon: PlaneLanding, date: pickupDisplay, time: startTime, place: pickupPlace, code: pickupCode },
                    { title: 'Drop-off', icon: PlaneTakeoff, date: dropoffDisplay, time: endTime, place: dropoffPlace, code: dropoffCode || pickupCode },
                  ].map(stop => (
                    <li key={stop.title} className="flex gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent">
                        <stop.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">{stop.title}</p>
                        <p className="text-sm font-semibold text-slate-900">{stop.date} · {stop.time}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{stop.place}{stop.code && stop.place !== stop.code ? ` (${stop.code})` : ''}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {car.supplier.address && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {car.supplier.address}
                  </p>
                )}
              </section>

              {/* Protection */}
              <section className="order-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:order-none">
                <h2 className="text-lg font-bold text-slate-900">Choose your protection</h2>
                <p className="mt-1 text-sm text-slate-500">Damage excess with basic cover: {excessDisplay}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Protection">
                  {[
                    { id: 'basic' as const, title: 'Basic protection', desc: 'Standard supplier cover', bullets: [car.supplier.includesCDW ? 'Collision damage waiver' : 'Supplier standard cover', car.supplier.includesTP ? 'Theft protection' : `Excess: ${excessDisplay}`], price: 'Included' },
                    { id: 'full' as const, title: 'Full protection', desc: 'Reduce your excess to zero', bullets: ['Everything in basic', 'Zero excess on damage'], price: `+${money(fullProtectionPrice)}`, badge: 'Recommended' },
                  ].map(opt => {
                    const active = insuranceOption === opt.id;
                    return (
                      <label key={opt.id} className={`relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors ${active ? 'border-accent bg-accent-50/40 ring-1 ring-accent' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="insurance" className="sr-only" checked={active} onChange={() => setInsuranceOption(opt.id)} />
                        {opt.badge && <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">{opt.badge}</span>}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-accent' : 'border-slate-300'}`}>
                              {active && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-slate-900">{opt.title}</span>
                              <span className="block text-sm text-slate-500">{opt.desc}</span>
                            </span>
                          </div>
                          <span className={`shrink-0 text-sm font-semibold ${opt.id === 'basic' ? 'text-emerald-700' : 'text-slate-900'}`}>{opt.price}</span>
                        </div>
                        <ul className="mt-3 space-y-1 pl-8">
                          {opt.bullets.map(b => (
                            <li key={b} className="flex items-center gap-2 text-xs text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-600" />{b}</li>
                          ))}
                        </ul>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Add-ons */}
              <AddonsSection
                className="order-4 lg:order-none"
                extras={car.extras || []}
                selectedExtraIds={selectedExtraIds}
                days={days}
                money={money}
                onChange={setSelectedExtraIds}
              />

              {/* Important information */}
              <section className="order-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:order-none">
                <h2 className="text-lg font-bold text-slate-900">Important information</h2>
                <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
                  {[
                    { label: 'Security deposit', value: depositDisplay },
                    { label: 'Damage excess', value: excessDisplay },
                    { label: 'Mileage', value: car.unlimitedMileage ? 'Unlimited' : 'Limited' },
                    { label: 'Fuel policy', value: fuelLabel },
                  ].map(item => (
                    <div key={item.label} className="bg-white px-3 py-3">
                      <dt className="text-xs text-slate-500">{item.label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">At the counter you'll need</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-slate-600 sm:grid-cols-3">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Driving licence</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Passport or ID</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Credit card in driver's name</li>
                  </ul>
                </div>
                <button type="button" onClick={() => setIsConditionsModalOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-700 hover:underline">
                  <FileText className="h-4 w-4" /> View full rental conditions
                </button>
              </section>

              {/* Supplier */}
              <section className="order-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:order-none">
                <h2 className="text-lg font-bold text-slate-900">{car.isHogicarChoiceBranded ? 'About this fleet' : 'About the supplier'}</h2>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {car.isHogicarChoiceBranded && !isChoiceBrand ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900"><Award className="h-6 w-6 text-amber-400" /></span>
                  ) : (
                    <div className="flex h-12 min-w-[96px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3">{supplierMark}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{car.isHogicarChoiceBranded ? 'Hogicar exclusive fleet' : car.supplier.name}</p>
                    <p className="text-sm text-slate-500">{car.isHogicarChoiceBranded ? 'Verified and managed by Hogicar' : 'Car rental provider'}</p>
                  </div>
                  {!car.isHogicarChoiceBranded && ratingButton}
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
                  <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Verified partner</li>
                  <li className="flex items-center gap-2"><Headphones className="h-4 w-4 text-accent" /> 24/7 support</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> {isInstant ? 'Instant confirmation' : 'On request'}</li>
                  <li className="flex items-center gap-2"><Building className="h-4 w-4 text-accent" /> {car.locationDetail || 'Local desk'}</li>
                </ul>
              </section>

              {/* Upgrades */}
              {upgrades.length > 0 && (
                <section className="order-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:order-none">
                  <h2 className="text-lg font-bold text-slate-900">Upgrade your car</h2>
                  <p className="mt-1 text-sm text-slate-500">Larger cars from the same supplier.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {upgrades.map(similar => (
                      <button
                        key={similar.id}
                        type="button"
                        onClick={() => {
                          setCar(similar);
                          navigate(`/car/${similar.id}?${bookingParams}`, { replace: true });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-accent"
                      >
                        <img
                          src={similar.image || similar.imageUrl || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle'}
                          alt={similar.displayName}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('placehold.co')) target.src = 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle';
                          }}
                          className="h-14 w-24 shrink-0 object-contain"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{similar.displayName}</span>
                          <span className="block text-xs text-slate-500">{formatCategoryName(similar.category)} · {similar.passengers} seats · {similar.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}</span>
                          <span className="mt-1 block text-sm font-bold text-slate-900">{money(calcPricing(similar, { pickupDate: startDate, dropoffDate: endDate }).finalTotal)}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Price sidebar */}
            <aside className="order-5 lg:order-none">
              <div className="space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <h2 className="text-lg font-bold text-slate-900">Price details</h2>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Car hire ({days} day{days > 1 ? 's' : ''})</dt><dd className="font-medium text-slate-900">{money(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount)}</dd></div>
                    {priceDetails.insuranceCost > 0 && <div className="flex justify-between gap-4"><dt className="text-slate-600">Full protection</dt><dd className="font-medium text-slate-900">{money(priceDetails.insuranceCost)}</dd></div>}
                    {(car.extras || []).filter(e => selectedExtraIds.includes(e.id)).map(e => {
                      const qty = countSelected(selectedExtraIds, e.id);
                      return (
                        <div key={e.id} className="flex justify-between gap-4">
                          <dt className="text-slate-600">{qty > 1 ? `${qty} × ` : ''}{e.name}</dt>
                          <dd className="font-medium text-slate-900">{(e as any).onRequest ? <span className="text-xs font-normal text-slate-500">At the desk</span> : money(extraUnitTotal(e, days) * qty)}</dd>
                        </div>
                      );
                    })}
                    {priceDetails.discountAmount > 0 && <div className="flex justify-between gap-4 text-emerald-700"><dt>Promo discount</dt><dd className="font-medium">-{money(priceDetails.discountAmount)}</dd></div>}
                    {priceDetails.hogicarPromoAmount > 0 && <div className="flex justify-between gap-4 text-emerald-700"><dt>Special deal</dt><dd className="font-medium">-{money(priceDetails.hogicarPromoAmount)}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Taxes and fees</dt><dd className="font-medium text-emerald-700">Included</dd></div>
                  </dl>
                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-200 pt-4">
                    <span className="text-base font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold tracking-tight text-slate-900">{money(priceDetails.finalTotal)}</span>
                  </div>
                  <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-slate-600">Pay now</span><span className="font-semibold text-slate-900">{money(priceDetails.payNow)}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-600">Pay at pick-up</span><span className="font-semibold text-slate-900">{money(priceDetails.payAtDesk)}</span></div>
                  </div>

                  <details className="group mt-3">
                    <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-accent hover:underline">
                      <Tag className="h-4 w-4" /> Have a promo code?
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-base uppercase outline-none placeholder:normal-case focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                      <button type="button" onClick={handleApplyPromo} className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Apply</button>
                    </div>
                    {promoError && <p className="mt-1.5 text-xs text-red-600">{promoError}</p>}
                    {appliedPromo && <p className="mt-1.5 text-xs text-emerald-700">{appliedPromo.code} applied</p>}
                  </details>

                  <Link
                    to={`/book/${car.id}/details?${bookingParams}`}
                    onClick={handleContinue}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 active:bg-accent-800"
                  >
                    Continue to book <ArrowRight className="h-4 w-4" />
                  </Link>
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Free cancellation before pick-up</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Taxes and fees included</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Secure payment</li>
                  </ul>
                  <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-4"><VisaIcon /><MastercardIcon /><AmexIcon /></div>
                </section>
                <p className="hidden items-center justify-center gap-2 text-xs text-slate-500 lg:flex">
                  <Headphones className="h-4 w-4" /> Need help? Our support team is available 24/7.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-500">Total for {days} day{days > 1 ? 's' : ''}</p>
            <p className="text-xl font-bold leading-tight tracking-tight text-slate-900">{money(priceDetails.finalTotal)}</p>
            <p className="text-xs text-slate-500">Pay now {money(priceDetails.payNow)}</p>
          </div>
          <Link
            to={`/book/${car.id}/details?${bookingParams}`}
            onClick={handleContinue}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-accent px-6 text-base font-semibold text-white transition-colors active:bg-accent-800"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default CarDetails;
