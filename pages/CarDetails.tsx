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
                    <div className="car-name space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#008009] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[#008009]/20 flex items-center gap-2">
                          <Medal className="w-3.5 h-3.5" /> Verified Choice
                        </span>
                        {car.isAvailable && (
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] flex items-center gap-2 border border-emerald-100">
                            <Zap className="w-3.5 h-3.5" /> High Demand
                          </span>
                        )}
                      </div>
                      <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.9] text-slate-900 drop-shadow-sm">
                        {car.displayName || `${car.make} ${car.model}`}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200">{car.category}</span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 font-bold text-xs">
                          <Settings className="w-3.5 h-3.5" /> {car.transmission}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 font-bold text-xs">
                          <Wind className="w-3.5 h-3.5" /> {car.airCon ? 'Air Conditioning' : 'Climate Control'}
                        </div>
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

                  {/* Journey Itinerary Section */}
                  <div className="bg-[#fefdf8] rounded-[2.5rem] p-8 my-8 border border-[#ffedd5] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f4a261]/5 rounded-bl-full -mr-10 -mt-10"></div>
                    <div className="flex flex-col lg:flex-row items-center gap-10">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-[#f4a261] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#f4a261]/20">
                            <Route className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-black text-[#c26e2c] uppercase tracking-widest leading-none">Journey Itinerary</h3>
                        </div>
                        <div className="flex items-center justify-between gap-4 relative">
                          <div className="absolute top-[22px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-[#cbdde9] -z-0"></div>
                          
                          <div className="text-center flex-1 min-w-[120px] relative z-10">
                            <div className="w-11 h-11 bg-[#e6f4ea] border-2 border-[#80b380] text-[#2d6a4f] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                              <Plane className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-black text-[#1e4c6b]">{pickupDisplay} · 10:00</div>
                            <div className="text-[11px] font-bold text-slate-900 mt-1">{pickupCode || car.location}</div>
                            <div className="text-[10px] font-medium text-[#6f8fae] bg-slate-50 px-2 py-1 rounded-lg mt-2 inline-block border border-slate-100">{pickupTypeLabel}</div>
                          </div>

                          <div className="text-center flex-1 min-w-[120px] relative z-10">
                            <div className="w-11 h-11 bg-[#ffe6e6] border-2 border-[#e9a8a8] text-[#b34343] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                              <Plane className="w-5 h-5 rotate-45" />
                            </div>
                            <div className="text-sm font-black text-[#1e4c6b]">{dropoffDisplay} · 10:00</div>
                            <div className="text-[11px] font-bold text-slate-900 mt-1">{dropoffCode || pickupCode || car.location}</div>
                            <div className="text-[10px] font-medium text-[#6f8fae] bg-slate-50 px-2 py-1 rounded-lg mt-2 inline-block border border-slate-100">Return to Desk</div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full lg:w-[320px] bg-white rounded-[2rem] p-6 flex flex-col items-center justify-center border border-[#f0e6d5] shadow-inner relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>
                        <div className="relative z-10 w-full">
                          <div className="bg-[#fef6e8] rounded-2xl p-4 flex flex-col items-center gap-4 w-full shadow-sm border border-[#fff2e3]">
                             <img src={displayImage} alt={car.displayName} className="h-24 object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-500" />
                             <div className="text-center">
                               <span className="text-xs font-black text-[#8b6946] uppercase tracking-[0.15em] block mb-1">{car.displayName}</span>
                               <span className="text-[10px] font-bold text-[#c26e2c] bg-[#f4a261]/10 px-3 py-1 rounded-full border border-[#f4a261]/20">Official Partner Vehicle</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-10">
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">Secure Payment</p>
                        <p className="text-[11px] font-bold text-slate-400">100% SSL Encrypted</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">Instant Confirmation</p>
                        <p className="text-[11px] font-bold text-slate-400">Voucher sent in seconds</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <Headphones className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">24/7 Support</p>
                        <p className="text-[11px] font-bold text-slate-400">We are here to help</p>
                      </div>
                    </div>
                  </div>

                  {/* included benefits */}
                  <div className="bg-[#FBFDFF] rounded-[2.5rem] p-8 my-10 border border-[#eef2f8] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#2a9d8f]/5 rounded-bl-full -mr-16 -mt-16"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                      <div>
                        <h3 className="text-3xl font-black text-slate-950 flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#2a9d8f] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2a9d8f]/20">
                            <CheckCircle className="w-7 h-7 text-white" />
                          </div>
                          Your Premium Package
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-2">Comprehensive coverage and benefits included at no extra cost</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-[#e0f3e8] text-[#1b6e42] px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border border-[#1b6e42]/10">
                          <Calendar className="w-4.5 h-4.5" /> Free cancellation
                        </span>
                        <p className="text-[10px] font-bold text-slate-400">Up to 48 hours before pickup</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-3 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 text-[#2a9d8f] opacity-20 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center text-[#2a9d8f]">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none tracking-tight">Collision Damage</p>
                          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Basic protection included. Reduces your liability for damage to the vehicle's bodywork to a fixed excess amount.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 text-[#2a9d8f] opacity-20 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center text-[#2a9d8f]">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none tracking-tight">Theft Protection</p>
                          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Standard theft coverage included. Provides financial security if the car is stolen during your rental period.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 text-[#2a9d8f] opacity-20 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center text-[#2a9d8f]">
                          <Fuel className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none tracking-tight">Full-to-Full Fuel</p>
                          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">The fairest fuel policy. Simply return the car with a full tank of fuel to avoid any additional refueling charges.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 text-[#2a9d8f] opacity-20 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center text-[#2a9d8f]">
                          <Infinity className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none tracking-tight">Unlimited Mileage</p>
                          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">No limits on your journey. Explore as much as you want without worrying about extra per-kilometer costs.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 text-[#2a9d8f] opacity-20 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center text-[#2a9d8f]">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none tracking-tight">Instant Booking</p>
                          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Secure your vehicle instantly. Your reservation is confirmed the moment you complete the checkout process.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 text-[#2a9d8f] opacity-20 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center text-[#2a9d8f]">
                          <Headphones className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none tracking-tight">Roadside Assistance</p>
                          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">24/7 technical support included. Help is just a phone call away for any mechanical issues on the road.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Features Section */}
                  <div className="bg-white rounded-[2.5rem] p-8 my-10 border border-slate-100 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                         <Sparkles className="w-7 h-7" />
                       </div>
                       Vehicle Features & Technology
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Wind className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Air Conditioning</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Smartphone className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Bluetooth Audio</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Navigation className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">USB Input</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Thermometer className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Outside Temp</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Zap className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Power Windows</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Lock className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Central Locking</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Users className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">ISOFIX Points</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-slate-100">
                        <Coffee className="w-6 h-6 text-[#2c6e9e]" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Cup Holders</span>
                      </div>
                    </div>
                  </div>

                  {/* rating summary */}
                  <div className="bg-gradient-to-br from-[#FFFAF0] to-[#fffdf5] rounded-[2.5rem] p-8 border border-[#fff2e3] shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg border border-[#f4b942]/20">
                          <span className="text-2xl font-black text-[#D4AF37] leading-none">{car.supplier.rating}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">/ 10</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-950 flex items-center gap-2">
                             {car.supplier.name} <Star className="w-5 h-5 text-[#f4b942] fill-[#f4b942]" />
                          </h4>
                          <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">{getRatingDescription(car.supplier.rating)} · Verified Supplier</p>
                        </div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#f4b942]/10 shadow-sm">
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Customer Feedback</p>
                         <p className="text-sm font-black text-slate-900">2,480 Verified Reviews</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <p className="text-base font-medium text-[#6a4e2e] leading-relaxed italic">
                        "The collection process was smooth and the car was in excellent condition. Highly recommend {car.supplier.name} for their professional service at {car.locationDetail}."
                      </p>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500">
                            <span>Car Cleanliness</span>
                            <span className="text-slate-900">9.2</span>
                         </div>
                         <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#f4b942]/10">
                            <div className="h-full bg-[#f4b942] rounded-full" style={{ width: '92%' }}></div>
                         </div>
                         <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500">
                            <span>Staff Helpfulness</span>
                            <span className="text-slate-900">8.8</span>
                         </div>
                         <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#f4b942]/10">
                            <div className="h-full bg-[#f4b942] rounded-full" style={{ width: '88%' }}></div>
                         </div>
                      </div>
                    </div>
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
