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

  const PolicyRow = ({ label, value, tone = 'default', description }: { label: string; value: React.ReactNode; tone?: 'default' | 'good' | 'warn'; description?: string }) => (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`text-right text-sm font-black ${tone === 'good' ? 'text-[#008009]' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
      </div>
      {description && <p className="text-[10px] font-medium text-slate-400 leading-tight">{description}</p>}
    </div>
  );

  const ConditionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <h4 className="mb-4 flex items-center gap-3 text-sm font-black text-slate-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">{icon}</span>
        {title}
      </h4>
      <div className="space-y-1">
        {children}
      </div>
    </section>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#f8fafd] rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col font-sans overflow-hidden border border-white/20">
        <div className="flex justify-between items-center gap-4 p-5 sm:p-7 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white px-4 shadow-inner">
              {supplierLogo ? <img src={supplierLogo} alt={supplier.name} className="max-h-12 max-w-full object-contain" /> : <Building className="h-8 w-8 text-slate-300" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#008009] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm shadow-[#008009]/20">Verified Terms</span>
                <span className="text-slate-300">|</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Policy Guide</span>
              </div>
              <h3 className="text-2xl font-black text-slate-950 truncate leading-tight">{supplier.name}</h3>
              <p className="text-sm font-bold text-[#008009] flex items-center gap-1.5 mt-0.5">
                <CarIcon className="w-3.5 h-3.5" /> {car.displayName || `${car.make} ${car.model}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition-all active:scale-90"><X className="w-6 h-6"/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7">
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-[#008009]/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <CreditCardIcon className="w-4 h-4 text-[#008009]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deposit</p>
              </div>
              <p className="text-lg font-black text-slate-950">{depositText}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-[#008009]/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-[#008009]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Excess</p>
              </div>
              <p className="text-lg font-black text-slate-950">{excessText}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-[#008009]/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Infinity className="w-4 h-4 text-[#008009]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mileage</p>
              </div>
              <p className="text-lg font-black text-slate-950">{car.unlimitedMileage ? 'Unlimited' : 'Limited'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-[#008009]/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#008009]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pickup</p>
              </div>
              <p className="text-lg font-black text-slate-950">{pickupTypeLabel}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <ConditionCard icon={<CreditCardIcon className="h-5 w-5" />} title="Payment & Security Deposit">
                <PolicyRow label="Payment mode" value={paymentTypeLabel} description="Accepted payment methods for the rental cost." />
                <PolicyRow label="Security hold" value={depositText} tone={car.deposit > 0 ? 'warn' : 'default'} description="Amount blocked on your card during the rental." />
                <PolicyRow label="Card requirements" value={<span className="inline-flex items-center gap-2"><VisaIcon /><MastercardIcon /><AmexIcon /></span>} description="Only international physical credit cards are accepted." />
                <PolicyRow label="Main driver card" value="Mandatory" description="The credit card must be in the name of the main driver." />
                <div className="mt-4 rounded-xl bg-amber-50 p-4 border border-amber-100 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold leading-relaxed text-amber-800">
                    Debit cards, prepaid cards, and virtual cards are generally NOT accepted for the security deposit and may lead to rental refusal.
                  </p>
                </div>
              </ConditionCard>

              <ConditionCard icon={<ShieldCheck className="h-5 w-5" />} title="Insurance & Protection">
                <PolicyRow label="CDW" value={supplier.includesCDW ? 'Included' : 'Not Included'} tone={supplier.includesCDW ? 'good' : 'warn'} description="Collision Damage Waiver reduces your liability." />
                <PolicyRow label="Theft Protection" value={supplier.includesTP ? 'Included' : 'Not Included'} tone={supplier.includesTP ? 'good' : 'warn'} description="Covers the cost if the vehicle is stolen." />
                <PolicyRow label="Damage Excess" value={excessText} description="The maximum amount you're liable for in case of damage." />
                <PolicyRow label="Third Party" value="Included" tone="good" description="Mandatory liability insurance for third-party damages." />
              </ConditionCard>

              <ConditionCard icon={<Users className="h-5 w-5" />} title="Driver Requirements">
                <PolicyRow label="Minimum Age" value="21+ Years" description="Drivers under 25 may incur a 'Young Driver' fee." />
                <PolicyRow label="License Duration" value="At least 1 year" description="Valid driving license must be held for 12+ months." />
                <PolicyRow label="Documents" value="Passport/ID + License" description="Original physical documents must be presented at pickup." />
              </ConditionCard>
            </div>

            <div className="space-y-6">
              <ConditionCard icon={<Clock className="h-5 w-5" />} title="Pickup & Return Policy">
                <PolicyRow label="Grace Period" value={gracePeriodInfo} description="How long the supplier will hold the car if you're late." />
                <PolicyRow label="After Hours" value="On Request" description="Pickups outside working hours may incur extra fees." />
                <PolicyRow label="Fuel Policy" value={car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to Full' : car.fuelPolicy.replace(/_/g, ' ')} description="Return the car with the same amount of fuel to avoid charges." />
                {workingHours.length > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Desk Working Hours</p>
                    <div className="grid grid-cols-1 gap-2">
                      {workingHours.map(([day, hours]) => (
                        <div key={day} className="flex justify-between items-center text-xs font-bold">
                          <span className="capitalize text-slate-500">{day}</span>
                          <span className="text-slate-900">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ConditionCard>

              <ConditionCard icon={<Globe className="h-5 w-5" />} title="Territorial Restrictions">
                <PolicyRow label="Cross Border" value="Not Allowed" tone="warn" description="Driving into other countries is generally prohibited." />
                <PolicyRow label="Off-Road" value="Prohibited" tone="warn" description="Insurance is void if the vehicle is driven off-road." />
                <PolicyRow label="One-Way" value={supplier.oneWayFee ? 'Allowed (Fee applies)' : 'Contact Supplier'} description="Returning the car to a different location." />
              </ConditionCard>
            </div>
          </div>

          <div className="mt-8">
            <ConditionCard icon={<FileText className="h-5 w-5" />} title="Detailed Rental Terms">
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 custom-scrollbar shadow-inner">
                <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-600">
                  {supplier.termsAndConditions || 'No additional supplier terms have been provided for this vehicle. Standard rental desk policies and local laws apply at the time of pickup. Please ensure you have all required documents ready.'}
                </p>
              </div>
            </ConditionCard>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sticky bottom-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#008009]/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#008009]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Secure Booking</p>
              <p className="text-xs font-bold text-slate-500">Your rental is protected by Hogicar's verified terms.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-[#008009] text-white px-10 py-4 rounded-2xl font-black text-base hover:bg-[#006607] shadow-xl shadow-[#008009]/20 transition-all hover:scale-105 active:scale-95"
          >
            I Understand & Agree
          </button>
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
  
  const pickupType = car?.supplier?.pickupType || (car as any)?.pickupType;
  const pickupTypeLabel =
    pickupType === 'IN_TERMINAL' ? 'In Terminal' :
    pickupType === 'MEET_AND_GREET' ? 'Meet & Greet' :
    pickupType === 'SHUTTLE_BUS' ? 'Shuttle Bus' :
    car?.locationDetail || 'Location details';

  const pickupDisplay = new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dropoffDisplay = new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const supplierLogo = car?.supplier?.logo || (car?.supplier as any)?.logoUrl;
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

      <div className="min-h-screen bg-slate-50 pb-28 font-sans text-slate-900 lg:pb-12">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-[#008009]/40 hover:text-[#008009]">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
              <ShieldCheck className="h-4 w-4 text-[#008009]" />
              Verified supplier terms and secure booking
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
            <main className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-0 lg:grid-cols-[1fr_0.92fr]">
                  <div className="flex min-h-[300px] items-center justify-center border-b border-slate-100 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
                    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
                      <img
                        src={displayImage}
                        alt={car.displayName || `${car.make} ${car.model}`}
                        onError={() => setImageError(true)}
                        referrerPolicy="no-referrer"
                        className="mx-auto h-52 w-full object-contain sm:h-64"
                      />
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#008009] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Available</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">{car.category}</span>
                      {car.hogicarChoice && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">Hogicar choice</span>
                      )}
                    </div>

                    <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                      {car.displayName || `${car.make} ${car.model}`}
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{car.make} {car.model} or similar vehicle from a verified rental partner.</p>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { icon: <Users className="h-4 w-4" />, label: 'Seats', value: `${car.passengers}` },
                        { icon: <Briefcase className="h-4 w-4" />, label: 'Bags', value: `${car.bags}` },
                        { icon: <Settings className="h-4 w-4" />, label: 'Gearbox', value: car.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual' },
                        { icon: <Wind className="h-4 w-4" />, label: 'Climate', value: car.airCon ? 'A/C' : 'Standard' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#008009] shadow-sm">{item.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                          <p className="mt-0.5 text-sm font-black text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3">
                            {supplierLogo ? <img src={supplierLogo} alt={car.supplier.name} className="max-h-8 max-w-full object-contain" /> : <Building className="h-5 w-5 text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{car.supplier.name}</p>
                            <p className="text-xs font-bold text-slate-500">{getRatingDescription(car.supplier.rating)} supplier</p>
                          </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008009] text-sm font-black text-white shadow-sm">
                          {car.supplier.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: <Calendar className="h-4 w-4" />, label: 'Pickup', value: `${pickupDisplay} · 10:00`, sub: pickupCode || car.location },
                  { icon: <RefreshCw className="h-4 w-4" />, label: 'Return', value: `${dropoffDisplay} · 10:00`, sub: dropoffCode || pickupCode || car.location },
                  { icon: <MapPin className="h-4 w-4" />, label: 'Pickup type', value: pickupTypeLabel, sub: car.locationDetail },
                  { icon: <Clock className="h-4 w-4" />, label: 'Duration', value: `${days} day${days > 1 ? 's' : ''}`, sub: 'Taxes and fees included' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#008009]/10 text-[#008009]">{item.icon}</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{item.value}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.sub}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Included In Your Booking</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Clear rental terms before you reserve.</p>
                  </div>
                  <button onClick={() => setIsConditionsModalOpen(true)} className="hidden rounded-lg border border-[#008009]/30 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#008009] sm:inline-flex">
                    Rental terms
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { icon: <ShieldCheck className="h-5 w-5" />, title: 'Collision damage waiver', text: car.supplier.includesCDW ? 'Included by supplier' : 'Check supplier terms' },
                    { icon: <Lock className="h-5 w-5" />, title: 'Theft protection', text: car.supplier.includesTP ? 'Included by supplier' : 'Check supplier terms' },
                    { icon: <Fuel className="h-5 w-5" />, title: 'Fuel policy', text: car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car.fuelPolicy.replace(/_/g, ' ') },
                    { icon: <Infinity className="h-5 w-5" />, title: 'Mileage', text: car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage' },
                    { icon: <CalendarX className="h-5 w-5" />, title: 'Cancellation', text: 'Free cancellation up to 48h' },
                    { icon: <Zap className="h-5 w-5" />, title: 'Confirmation', text: car.supplier.bookingMode === 'FREE_SALE' ? 'Instant confirmation' : 'On request' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#008009] shadow-sm">{item.icon}</div>
                      <p className="text-sm font-black text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{item.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                    <FileText className="h-5 w-5 text-[#008009]" /> Requirements
                  </h2>
                  <div className="space-y-3">
                    {[
                      { icon: <Book className="h-4 w-4" />, title: 'Driving license', text: 'Valid license held for at least 1 year.' },
                      { icon: <User className="h-4 w-4" />, title: 'Passport or ID', text: 'Original photo ID matching the main driver.' },
                      { icon: <CreditCardIcon className="h-4 w-4" />, title: 'Credit card', text: `Required for refundable deposit: ${depositDisplay}.` },
                      { icon: <ShieldAlert className="h-4 w-4" />, title: 'Damage excess', text: `${excessDisplay} according to supplier terms.` },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#008009] shadow-sm">{item.icon}</div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-500">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                    <Sparkles className="h-5 w-5 text-[#008009]" /> Vehicle Features
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Wind className="h-4 w-4" />, label: 'Air conditioning' },
                      { icon: <Smartphone className="h-4 w-4" />, label: 'Bluetooth audio' },
                      { icon: <Navigation className="h-4 w-4" />, label: 'USB input' },
                      { icon: <Zap className="h-4 w-4" />, label: 'Power windows' },
                      { icon: <Lock className="h-4 w-4" />, label: 'Central locking' },
                      { icon: <Coffee className="h-4 w-4" />, label: 'Cup holders' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700">
                        <span className="text-[#008009]">{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                  <PlusCircle className="h-5 w-5 text-[#008009]" /> Optional Extras
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {car.extras && car.extras.length > 0 ? car.extras.map(extra => (
                    <label key={extra.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${selectedExtraIds.includes(extra.id) ? 'border-[#008009] bg-emerald-50' : 'border-slate-200 bg-white hover:border-[#008009]/40'}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#008009]">
                          {extra.name.toLowerCase().includes('gps') ? <Navigation className="h-5 w-5" /> :
                            extra.name.toLowerCase().includes('wifi') ? <Wifi className="h-5 w-5" /> :
                            extra.name.toLowerCase().includes('driver') ? <UserPlus className="h-5 w-5" /> :
                            extra.name.toLowerCase().includes('child') ? <Baby className="h-5 w-5" /> :
                            <PlusCircle className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{extra.name}</p>
                          <p className="text-xs font-semibold text-slate-500">{extra.type === 'per_day' ? 'Daily extra' : 'One-time fee'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-black text-[#008009]">+{getCurrencySymbol()}{convertPrice(extra.price).toFixed(0)}{extra.type === 'per_day' ? '/day' : ''}</span>
                        <input
                          type="checkbox"
                          checked={selectedExtraIds.includes(extra.id)}
                          onChange={() => handleToggleExtra(extra.id)}
                          className="h-5 w-5 rounded border-slate-300 text-[#008009] focus:ring-[#008009]"
                        />
                      </div>
                    </label>
                  )) : (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">No optional extras are available for this vehicle.</p>
                  )}
                </div>
              </section>
            </main>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <section className="overflow-hidden rounded-2xl border-2 border-[#008009]/30 bg-white shadow-xl shadow-slate-200/70">
                <div className="border-b border-slate-100 bg-slate-950 p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Your deal</p>
                      <h2 className="mt-1 text-lg font-black">Reserve this car</h2>
                    </div>
                    <div className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black">{days} days</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total price</p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <span className="text-3xl font-black tracking-tight text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span>
                      <span className="pb-1 text-xs font-bold text-slate-500">taxes included</span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-500">Pay now</span>
                      <span className="text-sm font-black text-[#008009]">{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-500">At pickup</span>
                      <span className="text-sm font-black text-slate-900">{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">Refundable deposit</span>
                      <span className="text-sm font-black text-slate-900">{depositDisplay}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Excess</p>
                      <p className="mt-1 text-xs font-black text-slate-900">{excessDisplay}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fuel</p>
                      <p className="mt-1 text-xs font-black text-slate-900">{car.fuelPolicy.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <Link
                    to={`/book/${car.id}/details?${bookingParams}`}
                    onClick={handleContinue}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#008009] px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#008009]/20 transition-colors hover:bg-[#006607] active:scale-[0.98]"
                  >
                    <Zap className="h-5 w-5" /> Reserve now
                  </Link>
                  <button onClick={() => setIsConditionsModalOpen(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-colors hover:border-[#008009]/40 hover:text-[#008009]">
                    <FileText className="h-4 w-4" /> View rental conditions
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] font-bold text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#008009]" /> Secure checkout and instant confirmation
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-900">Key Information</h2>
                <ul className="space-y-3 text-sm font-semibold text-slate-600">
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#008009]" /> Main driver credit card required for deposit.</li>
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#008009]" /> Passport or photo ID required at pickup.</li>
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#008009]" /> Free cancellation up to 48 hours before pickup.</li>
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#008009]" /> Cross-border driving is not permitted unless approved.</li>
                </ul>
              </section>
            </aside>
          </div>

          <div className="mx-auto mt-8 max-w-4xl border-t border-slate-200 pt-5 text-center text-[11px] font-semibold leading-relaxed text-slate-500">
            By proceeding, you agree to {car.supplier.name} rental terms. Remaining balance is due at collection. Optional extras are subject to supplier confirmation.
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
              <p className="text-xl font-black text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</p>
            </div>
            <Link
              to={`/book/${car.id}/details?${bookingParams}`}
              onClick={handleContinue}
              className="rounded-xl bg-[#008009] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#008009]/20 active:scale-95"
            >
              Reserve
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarDetails;
