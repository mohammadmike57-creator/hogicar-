import * as React from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_CARS, getPromoCode } from '../services/mockData';
import {
  Check, ShieldCheck, User, Users, Briefcase, Fuel, Info, CreditCard as CreditCardIcon,
  ShieldAlert, Calendar, Tag, Car as CarIcon, Snowflake, XCircle, FileText, Clock,
  Navigation, Baby, PlusCircle, Star, Sparkles, MapPin, CheckCircle, GaugeCircle, Hash, X,
  ArrowRight, Shield, Wifi, Wind, Thermometer, Smartphone, Battery, Coffee, Gift, Award,
  Heart, Share2, ChevronDown, ChevronUp, Phone, Building, Bus, Handshake, Loader2,
  DollarSign, Zap, ThumbsUp, Globe, Headphones, ArrowLeft, Infinity, Lock, Route, Gem,
  Coins, ArrowLeftRight, Book, Medal, Plane, Settings, RefreshCw, CalendarX, UserPlus
} from 'lucide-react';
import { Car, CommissionType, Supplier, PromoCode, Extra } from '../types';
import { DetailedRatingsTooltip } from '../components/DetailedRatingsTooltip';
import { getRatingDescription } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { calcPricing, rentalDays } from '../utils/pricing';
import { supplierApi } from '../lib/api';

// ==================== Helper Components ====================

const StructuredData: React.FC<{ car: Car; total: number; currencyCode: string }> = ({ car, total, currencyCode }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${car.make} ${car.model}`,
    "image": car.image,
    "description": `Rent a ${car.make} ${car.model} (${car.category}) from ${car.supplier.name}. Features include ${car.passengers} seats and space for ${car.bags} bags.`,
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

const AutomaticIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
  const excessAmount = (car as any).excess;
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

  const PolicyRow = ({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) => (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className={`text-right text-xs font-black ${tone === 'good' ? 'text-[#008009]' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  );

  const ConditionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008009]/10 text-[#008009]">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col font-sans overflow-hidden">
        <div className="flex justify-between items-start gap-4 p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex min-w-0 items-center gap-4">
            {(supplier as any).hogicarChoice ? (
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
                  {supplierLogo ? <img src={supplierLogo} alt={supplier.name} className="max-h-10 max-w-full object-contain" /> : <Building className="h-7 w-7 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#008009]">Rental conditions</p>
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
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pickup</p><p className="mt-1 text-sm font-black text-slate-950">{pickupTypeLabel}</p></div>
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
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><Shield className="mb-2 h-4 w-4 text-[#008009]" /><p className="text-xs font-black text-slate-900">Driving license</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Held for at least 1 year. International permit may be required.</p></div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><Users className="mb-2 h-4 w-4 text-[#008009]" /><p className="text-xs font-black text-slate-900">Passport or ID</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">A valid photo ID matching the main driver details.</p></div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><CreditCardIcon className="mb-2 h-4 w-4 text-[#008009]" /><p className="text-xs font-black text-slate-900">Credit card</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Must have enough available funds for the deposit.</p></div>
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
                <PolicyRow label="Vehicle class" value={`${car.category} or similar`} />
              </ConditionCard>
            </div>

            <aside className="space-y-4">
              <ConditionCard icon={<Building className="h-4 w-4" />} title="Supplier and location">
                <PolicyRow label="Supplier" value={supplier.name} />
                <PolicyRow label="Rating" value={`${supplier.rating}/5 - ${getRatingDescription(supplier.rating)}`} tone="good" />
                <PolicyRow label="Pickup type" value={pickupTypeLabel} />
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
          <button onClick={onClose} className="bg-[#008009] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#006607] shadow-sm transition-transform active:scale-95">Got it</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

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

  // Extract search params
  const startDate = searchParams.get('startDate') || searchParams.get('pickupDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || searchParams.get('dropoffDate') || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const pickupCode = searchParams.get('pickup');
  const dropoffCode = searchParams.get('dropoff');
  const days = rentalDays(startDate, endDate);

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
      if (!foundCar && location.state?.cars) {
        const stateCars = location.state.cars;
        if (Array.isArray(stateCars)) {
          foundCars = stateCars;
          foundCar = stateCars.find((c: Car) => String(c.id) === String(id)) || null;
        }
      }

      // 3. fallback to mock data
      if (!foundCar && id) {
        const mockCar = MOCK_CARS.find(c => String(c.id) === String(id));
        if (mockCar) foundCar = mockCar as any;
      }

      if (foundCar) {
        setCar(foundCar);
        setCars(foundCars.length ? foundCars : [foundCar]);
        // Update session storage so refresh works on the new car
        sessionStorage.setItem('hogicar_selectedCarId', String(foundCar.id));
        sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(foundCar));
      } else {
        setError('Car not found. Please go back to search results.');
      }
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

  const handleToggleExtra = (extraId: string) => setSelectedExtraIds(prev => prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]);

  const handleApplyPromo = () => {
    if (!promoCodeInput) { setPromoError('Enter a code.'); return; }
    const promo = getPromoCode(promoCodeInput);
    if (promo && promo.status === 'active') { setAppliedPromo(promo); setPromoError(''); } else { setAppliedPromo(null); setPromoError('Invalid or expired code.'); }
  };

  const handleContinue = () => {
    if (car) {
      sessionStorage.setItem('hogicar_selectedCarId', String(car.id));
      sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
      sessionStorage.setItem('hogicar_cars', JSON.stringify(cars));
    }
  };

  const bookingParams = new URLSearchParams({ startDate, endDate, ...(pickupCode && { pickup: pickupCode }), ...(dropoffCode && { dropoff: dropoffCode }), ...(selectedExtraIds.length && { extras: selectedExtraIds.join(',') }), ...(appliedPromo && { promo: appliedPromo.code }) }).toString();

  const [imageError, setImageError] = React.useState(false);
  const displayImage = imageError ? 'https://placehold.co/400x250/orange/white?text=Vehicle' : (car?.image || 'https://placehold.co/400x250/orange/white?text=Vehicle');
  const pickupDisplay = new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dropoffDisplay = new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const supplierLogo = car?.supplier.logo || (car?.supplier as any)?.logoUrl;
  const depositDisplay = car?.deposit ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'Not listed';
  const excessDisplay = (car as any)?.excess ? `${getCurrencySymbol()}${convertPrice((car as any).excess).toFixed(2)}` : 'See terms';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" /><p className="mt-4 text-slate-600">Loading car details...</p></div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4">
        <div className="bg-[#f2f5fa] rounded-2xl p-8 text-center max-w-md shadow-lg border border-slate-300/70">
          <CarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Car Not Found</h1>
          <p className="text-slate-500 mt-2">{error || 'Please go back to search results.'}</p>
          <button onClick={() => navigate(-1)} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Back to Search</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMetadata title={`Rent a ${car.make} ${car.model} | Hogicar`} description={car.hogicarChoice ? `Book ${car.make} ${car.model} from our exclusive verified fleet. Best price guaranteed.` : `Book ${car.make} ${car.model} from ${car.supplier.name}. Best price guaranteed.`} />
      <StructuredData car={car} total={convertPrice(priceDetails.finalTotal)} currencyCode={selectedCurrency} />
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}

      <div className="bg-[#f4f9ff] min-h-screen font-sans text-[#1a2c3e] p-4 sm:p-8 pb-32 lg:pb-8">
        <div className="max-w-[1380px] mx-auto">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-3 text-sm font-black text-[#2c6e9e] bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/50 hover:bg-white hover:scale-105 transition-all mb-10 active:scale-95">
            <ArrowLeft className="w-5 h-5" /> Back to search results
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
            {/* LEFT COLUMN: vehicle details, timeline with real car image & logo */}
            <div className="space-y-6">
              <div className="bg-white/98 rounded-[2rem] shadow-xl border border-white/60 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
                    <div className="car-name space-y-2">
                      <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none bg-gradient-to-br from-[#0b2b3b] to-[#1a5d7a] bg-clip-text text-transparent">
                        {car.displayName || `${car.make} ${car.model}`} <span className="text-[#5a6e7a] text-2xl font-medium bg-none">or similar</span>
                      </h1>
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{car.category}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{car.transmission}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{car.airCon ? 'A/C' : 'Climate control'}</span>
                      </div>
                    </div>
                    <div className="bg-[#f8fafd] rounded-3xl p-3 flex items-center gap-4 shadow-lg border border-slate-100">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm">
                        {supplierLogo ? <img src={supplierLogo} alt={car.supplier.name} className="max-h-10 object-contain" /> : <Building className="w-6 h-6 text-slate-400" />}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-base">{car.supplier.name}</div>
                        <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-sm font-black text-[#D4AF37]">{car.supplier.rating}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">(248 reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-5 py-4 border-y border-[#edf2f9] my-6">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-[#2a4c6e]">
                      <Users className="w-4.5 h-4.5 text-[#f4a261]" /> {car.passengers} seats
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-[#2a4c6e]">
                      <Settings className="w-4.5 h-4.5 text-[#f4a261]" /> {car.transmission}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-[#2a4c6e]">
                      <Briefcase className="w-4.5 h-4.5 text-[#f4a261]" /> {car.bags} bags
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-[#2a4c6e]">
                      <Wind className="w-4.5 h-4.5 text-[#f4a261]" /> Climate control
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-[#2a4c6e]">
                      <Infinity className="w-4.5 h-4.5 text-[#f4a261]" /> {car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'}
                    </div>
                  </div>

                  {/* FLIGHT TIMELINE with professional car SVG and supplier logo SVG */}
                  <div className="bg-gradient-to-br from-[#fefdf8] to-[#fffdf5] rounded-[1.6rem] p-5 sm:p-6 my-6 border border-[#ffedd5] shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-[2] w-full">
                      <div className="text-[#c26e2c] text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4" /> Journey · Pick-up & Return
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-center flex-1 min-w-[110px]">
                          <div className="w-10 h-10 bg-[#e6f4ea] border-[1.5px] border-[#80b380] text-[#2d6a4f] rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <Plane className="w-5 h-5" />
                          </div>
                          <div className="text-[11px] font-extrabold text-[#1e4c6b]">{pickupDisplay} · 10:00</div>
                          <div className="text-[10px] font-medium text-slate-900 mt-0.5">{pickupCode || car.location}</div>
                          <div className="text-[9px] text-[#6f8fae]">{car.locationDetail}</div>
                        </div>
                        <div className="flex-1 h-px border-t-2 border-dashed border-[#cbdde9]"></div>
                        <div className="text-center flex-1 min-w-[110px]">
                          <div className="w-10 h-10 bg-[#ffe6e6] border-[1.5px] border-[#e9a8a8] text-[#b34343] rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <Plane className="w-5 h-5 rotate-45" />
                          </div>
                          <div className="text-[11px] font-extrabold text-[#1e4c6b]">{dropoffDisplay} · 10:00</div>
                          <div className="text-[10px] font-medium text-slate-900 mt-0.5">{dropoffCode || pickupCode || car.location}</div>
                          <div className="text-[9px] text-[#6f8fae]">Return to desk</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 w-full bg-white/80 rounded-[1.2rem] p-3 flex flex-col items-center gap-3 border border-[#f0e6d5]">
                      <div className="bg-[#fef6e8] rounded-2xl px-3 py-2 flex items-center gap-3 w-full justify-center">
                         <img src={displayImage} alt={car.displayName} className="h-8 object-contain" />
                         <span className="text-[10px] font-bold text-[#8b6946] truncate max-w-[100px]">{car.displayName} · Similar</span>
                      </div>
                      <div className="bg-[#f0f4fa] rounded-full px-4 py-1.5 flex items-center gap-3 w-full justify-center">
                         {supplierLogo ? <img src={supplierLogo} className="h-6 object-contain" /> : <Building className="w-5 h-5 text-[#2c6280]" />}
                         <span className="text-[10px] font-extrabold text-[#2c6280] truncate max-w-[100px]">{car.supplier.name} · Partner</span>
                      </div>
                    </div>
                  </div>

                  {/* included benefits */}
                  <div className="bg-[#FBFDFF] rounded-[1.25rem] p-5 my-6 border border-[#eef2f8]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold flex items-center gap-2 text-slate-900 text-sm">
                        <CheckCircle className="w-5 h-5 text-[#2a9d8f]" /> Included benefits
                      </span>
                      <span className="bg-[#e0f3e8] text-[#1b6e42] px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Free cancellation up to 48h
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Shield className="w-4.5 h-4.5 text-[#2a9d8f]" /> CDW (excess {getCurrencySymbol()}{convertPrice((car as any).excess || 1000).toFixed(0)})
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Lock className="w-4.5 h-4.5 text-[#2a9d8f]" /> Theft Protection (excess {getCurrencySymbol()}{convertPrice((car as any).excess || 1000).toFixed(0)})
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Fuel className="w-4.5 h-4.5 text-[#2a9d8f]" /> Full-to-Full fuel
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Infinity className="w-4.5 h-4.5 text-[#2a9d8f]" /> Unlimited mileage
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Zap className="w-4.5 h-4.5 text-[#2a9d8f]" /> Instant confirmation
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Headphones className="w-4.5 h-4.5 text-[#2a9d8f]" /> 24/7 roadside assist
                      </div>
                    </div>
                  </div>

                  {/* rating summary */}
                  <div className="bg-[#FFFAF0] rounded-2xl p-4 border border-[#fff2e3]">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Star className="w-5 h-5 text-[#f4b942] fill-[#f4b942]" /> {car.supplier.name} · {car.supplier.rating} / 10 ({getRatingDescription(car.supplier.rating)})
                      </span>
                      <span className="bg-[#eef2fc] text-[#2c6280] px-3 py-1 rounded-full text-[10px] font-bold">200+ reviews</span>
                    </div>
                    <p className="text-sm mt-2 text-[#6a4e2e] leading-relaxed">
                      Solid value and professional service at {car.locationDetail}. Customers highly recommend this supplier for their efficiency and car condition.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Extras → Premium guarantee → Your deal (with policy grid) → Key info */}
            <div className="sticky-side space-y-6">
              {/* 1. EXTRAS CARD */}
              <div className="bg-white rounded-[2rem] shadow-xl border border-white/60 overflow-hidden border-l-4 border-l-[#f4a261]">
                <div className="p-5 border-b-2 border-[#ffe0b5] bg-gradient-to-r from-[#fffaf2] to-white">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-[#1f3b4c]">
                    <Gem className="w-5 h-5 text-[#f4a261]" /> Extras & Enhancements
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {car.extras && car.extras.length > 0 ? car.extras.map(extra => (
                      <div key={extra.id} className="flex items-center justify-between p-3.5 bg-white border border-[#ffe7cf] rounded-2xl hover:border-[#f4a261] hover:bg-[#fffef7] transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 bg-gradient-to-br from-[#fef3e2] to-[#ffe6c9] rounded-full flex items-center justify-center text-[#c26e2c]">
                            {extra.name.toLowerCase().includes('gps') ? <Navigation className="w-5 h-5" /> : 
                             extra.name.toLowerCase().includes('wifi') ? <Wifi className="w-5 h-5" /> : 
                             extra.name.toLowerCase().includes('driver') ? <UserPlus className="w-5 h-5" /> : 
                             extra.name.toLowerCase().includes('child') ? <Baby className="w-5 h-5" /> : 
                             <PlusCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#2c4b66]">{extra.name}</div>
                            <div className="text-[10px] text-[#7c8ea0]">{extra.type === 'per_day' ? 'Daily extra' : 'One-time fee'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold text-[#2a9d8f]">+{getCurrencySymbol()}{convertPrice(extra.price).toFixed(0)}{extra.type === 'per_day' ? '/day' : ''}</span>
                          <input 
                            type="checkbox" 
                            checked={selectedExtraIds.includes(extra.id)}
                            onChange={() => handleToggleExtra(extra.id)}
                            className="w-5 h-5 rounded-md border-slate-300 text-[#f4a261] focus:ring-[#f4a261]" 
                          />
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-slate-400 text-sm">No extras available.</p>
                    )}
                  </div>
                  <div className="bg-[#fff2e3] rounded-2xl p-3 text-center text-[10px] text-[#8b6946] flex items-center justify-center gap-2 mt-4">
                    <Info className="w-3.5 h-3.5" /> Selected extras will be confirmed at counter. Prices include VAT.
                  </div>
                </div>
              </div>

              {/* 2. PREMIUM GUARANTEE CARD */}
              <div className="bg-white rounded-[2rem] shadow-xl border border-white/60 p-5 border-l-4 border-l-[#f4a261]">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold flex items-center gap-2 text-sm text-slate-900">
                    <Medal className="w-5 h-5 text-[#e9b741]" /> Premium guarantee
                  </span>
                  <span className="text-[#2a9d8f] text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified supplier
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] text-[#2c4b66] font-medium">
                  <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Best rate guarantee</span>
                  <span className="flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5" /> 24/7 support</span>
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Free modifications</span>
                </div>
              </div>

              {/* 3. YOUR DEAL CARD */}
              <div className="bg-white rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0066b3]" />
                  <h2 className="text-lg font-bold">Your deal</h2>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="bg-[#eef2fc] text-[#2c6280] px-4 py-1.5 rounded-full text-[11px] font-bold">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" /> {days} days · {new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-3xl font-black text-[#2b7a4b] tracking-tight">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-[#6c819e] text-right mb-5 font-medium tracking-wide">Approx. {selectedCurrency !== 'JOD' ? `JOD ${(convertPrice(priceDetails.finalTotal) * 0.71).toFixed(2)}` : ''} (incl. taxes)</div>

                  <div className="bg-[#fafdff] rounded-[1.5rem] p-5 my-5 border border-[#eef2f8] space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-dashed border-[#e5edf5]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0066b3] flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" /> Pay now (online)
                        </span>
                        <span className="text-[10px] text-[#6c819e]">secure deposit</span>
                      </div>
                      <span className="font-extrabold text-[#1f5e3a]">{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-dashed border-[#e5edf5]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#2c6280] flex items-center gap-2">
                          <Handshake className="w-3.5 h-3.5" /> Due at counter
                        </span>
                        <span className="text-[10px] text-[#6c819e]">remaining balance</span>
                      </div>
                      <span className="font-extrabold text-[#1f5e3a]">{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 bg-[#eef6fc] -mx-5 px-5 py-3 rounded-b-[1.5rem]">
                      <span className="font-black text-sm text-[#1a2c3e]">Total rental cost</span>
                      <span className="font-black text-lg text-[#1f5e3a]">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* POLICY GRID */}
                  <div className="grid grid-cols-2 gap-3 my-6">
                    <div className="bg-white border border-[#eef2f8] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-[#f0f6fe] rounded-full flex items-center justify-center text-[#2c6280]">
                        <Coins className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-[#5f7c9c] uppercase tracking-wider">Refundable deposit</div>
                        <div className="text-[11px] font-extrabold text-[#1f3b4c]">{getCurrencySymbol()}{convertPrice(car.deposit).toFixed(0)} <small className="font-normal opacity-70">hold</small></div>
                      </div>
                    </div>
                    <div className="bg-white border border-[#eef2f8] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-[#f0f6fe] rounded-full flex items-center justify-center text-[#2c6280]">
                        <Shield className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-[#5f7c9c] uppercase tracking-wider">Excess (CDW)</div>
                        <div className="text-[11px] font-extrabold text-[#1f3b4c]">{getCurrencySymbol()}{convertPrice((car as any).excess || 1000).toFixed(0)} <small className="font-normal opacity-70">reducible</small></div>
                      </div>
                    </div>
                    <div className="bg-white border border-[#eef2f8] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-[#f0f6fe] rounded-full flex items-center justify-center text-[#2c6280]">
                        <Fuel className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-[#5f7c9c] uppercase tracking-wider">Fuel policy</div>
                        <div className="text-[11px] font-extrabold text-[#1f3b4c]">{car.fuelPolicy.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <div className="bg-white border border-[#eef2f8] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-[#f0f6fe] rounded-full flex items-center justify-center text-[#2c6280]">
                        <CalendarX className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-[#5f7c9c] uppercase tracking-wider">Cancellation</div>
                        <div className="text-[10px] font-bold text-[#0066b3] bg-[#e8f0fe] px-2 py-0.5 rounded-full inline-block mt-0.5 whitespace-nowrap">Free up to 48h</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fff4e0] rounded-2xl p-4 text-[11px] mb-6 border border-[#ffe0b5]">
                    <div className="font-bold flex items-center gap-2 mb-1">
                      <Info className="w-4 h-4 text-[#c26e2c]" /> Payment conditions
                    </div>
                    <span className="text-[#6a4e2e] leading-relaxed">
                      {getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)} prepayment guarantees your reservation. Remaining {getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)} due at {car.supplier.name} counter.
                    </span>
                  </div>

                  <Link 
                    to={`/book/${car.id}/details?${bookingParams}`}
                    onClick={handleContinue}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-[#0066b3] to-[#0088cc] hover:from-[#004b8a] hover:to-[#006bb3] text-white font-extrabold rounded-full shadow-lg transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
                  >
                    <Zap className="w-5 h-5" /> Reserve for {getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}
                  </Link>
                  <p className="text-[10px] text-[#6c819e] text-center mt-4 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> SSL Secure · Instant confirmation
                  </p>
                </div>
              </div>

              {/* 4. KEY INFORMATION CARD */}
              <div className="bg-white rounded-[2rem] shadow-xl border border-white/60 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#e9a23b]" />
                  <h2 className="text-lg font-bold text-slate-900">Key information</h2>
                </div>
                <div className="p-6">
                  <ul className="space-y-3.5">
                    <li className="flex items-center gap-3 text-sm text-[#2c4b66] font-medium">
                      <Book className="w-4.5 h-4.5 text-[#e9a23b]" /> Driver's license (1+ year) & ID required
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[#2c4b66] font-medium">
                      <CreditCardIcon className="w-4.5 h-4.5 text-[#e9a23b]" /> Int'l credit card for deposit (main driver)
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[#2c4b66] font-medium">
                      <Clock className="w-4.5 h-4.5 text-[#e9a23b]" /> Late return: 59 min grace period
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[#2c4b66] font-medium">
                      <Baby className="w-4.5 h-4.5 text-[#e9a23b]" /> Child seats on request (additional fee)
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[#2c4b66] font-medium">
                      <Globe className="w-4.5 h-4.5 text-[#e9a23b]" /> Cross-border not permitted
                    </li>
                  </ul>
                  <hr className="my-5 border-slate-100" />
                  <div className="text-[11px] text-[#6c819e] font-medium leading-relaxed">
                    <Building className="w-3.5 h-3.5 inline mr-1" /> {car.supplier.name} counter: {car.locationDetail}.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Legal */}
          <div className="max-w-[1100px] mx-auto mt-12 text-center text-[11px] text-[#8fa0b5] border-t border-[#e0e9f2] pt-6 leading-relaxed">
             <FileText className="w-4 h-4 inline mr-1" /> By proceeding, you agree to {car.supplier.name} rental terms. 
             Prepayment is non-refundable within 48h of pick-up. Remaining balance due at collection. 
             Extras can be added at checkout.
          </div>
        </div>

        {/* Mobile Floating CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] p-4 z-40">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Price</div>
              <div className="text-xl font-black text-[#2b7a4b]">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</div>
            </div>
            <Link 
              to={`/book/${car.id}/details?${bookingParams}`} 
              onClick={handleContinue} 
              className="bg-gradient-to-r from-[#0066b3] to-[#0088cc] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarDetails;
