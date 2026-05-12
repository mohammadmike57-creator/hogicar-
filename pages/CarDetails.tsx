import * as React from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_CARS, getPromoCode } from '../services/mockData';
import {
  Check, ShieldCheck, User, Users, Briefcase, Fuel, Info, CreditCard as CreditCardIcon,
  ShieldAlert, Calendar, Tag, Car as CarIcon, Snowflake, XCircle, FileText, Clock,
  Navigation, Baby, PlusCircle, Star, Sparkles, MapPin, CheckCircle, GaugeCircle, Hash, X,
  ArrowRight, Shield, Wifi, Wind, Thermometer, Smartphone, Battery, Coffee, Gift, Award,
  Heart, Share2, ChevronDown, ChevronUp, Phone, Building, Bus, Handshake, Loader2,
  DollarSign, Zap, ThumbsUp, Globe, Headphones
} from 'lucide-react';
import { Car, CommissionType, Supplier, PromoCode, Extra } from '../types';
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
      referrerPolicy="no-referrer"
    />
  </div>
);
const MastercardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="white" rx="3"/><circle cx="13" cy="12" r="7" fill="#EA001B"/><circle cx="25" cy="12" r="7" fill="#F79E1B"/><path d="M20.5 12a7.002 7.002 0 01-7.5-6.96A7.002 7.002 0 0013 19a7.002 7.002 0 007.5-6.96A7.002 7.002 0 0120.5 12z" fill="#FF5F00"/></svg> );
const AmexIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="#006FCF" rx="3"/><rect x="4" y="4" width="30" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/><text x="19" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white">AMEX</text></svg> );

// Rental Conditions Modal (simplified but kept from original)
const RentalConditionsModal = ({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const workingHours = supplier.workingHours ? Object.entries(supplier.workingHours) : [];
  const gracePeriodInfo = supplier.gracePeriodDays ? `${supplier.gracePeriodDays} day(s)` : `${supplier.gracePeriodHours} hour(s)`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col font-sans">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="flex items-center gap-4">
            {(supplier as any).hogicarChoice ? (
              <>
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-amber-500/30">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-slate-900 tracking-tight">Rental Conditions</h3>
                   <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Hogicar Exclusive Verified Fleet</p>
                </div>
              </>
            ) : (
              <>
                <img src={supplier.logo || (supplier as any).logoUrl} alt={supplier.name} className="h-14 object-contain" width={120} height={56} />
                <div><h3 className="font-bold text-lg text-slate-800">Rental Conditions</h3><p className="text-sm text-slate-700">Provided by {supplier.name}</p></div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div><h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Building className="w-4 h-4 text-slate-500"/> Supplier Details</h4><div className="space-y-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">{supplier.address && (<div className="flex gap-3"><MapPin className="w-4 h-4"/><p className="text-sm text-slate-700">{supplier.address}</p></div>)}</div></div>
          {supplier.workingHours && workingHours.length > 0 && (<div><h4 className="font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4"/> Opening Hours</h4><div className="grid grid-cols-2 gap-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-lg">{workingHours.map(([day, hours]) => (<div key={day} className="flex justify-between"><span className="capitalize">{day}</span><span className="font-semibold">{hours}</span></div>))}</div></div>)}
          <div><h4 className="font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Rental Policy & Terms</h4><div className="text-sm text-slate-700 whitespace-pre-line border bg-slate-50/50 p-4 rounded-lg h-48 overflow-y-auto">{supplier.termsAndConditions || "No specific terms provided."}<br/><br/><strong>Grace Period:</strong> {gracePeriodInfo}</div></div>
          <div><h4 className="font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Required at Pick-up</h4><ul className="space-y-3"><li className="flex gap-3 p-3 bg-slate-50 rounded-lg"><Shield className="w-5 h-5"/><div><strong>Valid Driving License</strong><p className="text-sm text-slate-700">Held for min 1 year.</p></div></li><li className="flex gap-3 p-3 bg-slate-50 rounded-lg"><CreditCardIcon className="w-5 h-5"/><div><strong>Credit Card</strong><p className="text-sm text-slate-700">In main driver's name for deposit.</p></div></li></ul></div>
          <div><h4 className="font-bold mb-3 flex items-center gap-2"><CreditCardIcon className="w-4 h-4"/> Accepted Cards</h4><div className="flex gap-2"><VisaIcon/><MastercardIcon/><AmexIcon/></div></div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end rounded-b-xl"><button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Close</button></div>
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
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const pickupCode = searchParams.get('pickup');
  const dropoffCode = searchParams.get('dropoff');
  const days = rentalDays(startDate, endDate);

  // Load car from sessionStorage / state / API
  React.useEffect(() => {
    const loadCar = async () => {
      setLoading(true);
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
          if (Array.isArray(parsed)) foundCars = parsed;
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

  const getRatingText = (rating: number) => rating >= 4.8 ? 'Exceptional' : rating >= 4.5 ? 'Very Good' : rating >= 4.0 ? 'Good' : rating >= 3.0 ? 'Average' : 'Fair';

  return (
    <>
      <SEOMetadata title={`Rent a ${car.make} ${car.model} | Hogicar`} description={car.hogicarChoice ? `Book ${car.make} ${car.model} from our exclusive verified fleet. Best price guaranteed.` : `Book ${car.make} ${car.model} from ${car.supplier.name}. Best price guaranteed.`} />
      <StructuredData car={car} total={convertPrice(priceDetails.finalTotal)} currencyCode={selectedCurrency} />
      {isConditionsModalOpen && <RentalConditionsModal supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}

      <div className="bg-slate-200/55 min-h-screen pb-32 lg:pb-12 text-slate-800">
        <div className="max-w-[1500px] mx-auto px-2 sm:px-6 lg:px-10 py-6">
          <BookingStepper currentStep={3} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 mt-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-7">
              {/* Hero Section - smaller image + modern layout */}
              <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 overflow-hidden">
                <div className="relative bg-slate-50 border-b border-slate-100">
                  {/* Reduced image height: h-48 on mobile, h-64 on desktop */}
                  <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-40 lg:h-56 object-contain p-4" />
                  
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">{car.category}</span>
                    {car.tags?.[0] && <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">{car.tags[0]}</span>}
                  </div>
                  <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md"><Heart className="w-5 h-5" /></button>
                </div>
                <div className="p-5 sm:p-6">
                  {car.hogicarChoice && (
                    <div className="inline-flex items-center gap-2 bg-[#003580] text-white text-[10px] font-black px-4 py-2 rounded-xl mb-4 shadow-xl border border-amber-400/50">
                        <Award className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                        <span className="tracking-[0.2em] uppercase italic font-black text-amber-400">Hogicar Choice Exclusive Verified</span>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-2xl lg:text-[1.8rem] font-bold">{car.displayName || `${car.make} ${car.model}`}</h1>
                      </div>
                      <p className="text-slate-700 text-base mt-1">or similar · {car.year}</p>
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {!car.hogicarChoice ? <>{car.supplier.rating} · {getRatingText(car.supplier.rating)}</> : <span className="font-bold text-indigo-700">Premium Choice · Top Rated</span>}</div>
                        <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-slate-400" /> {car.locationDetail}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="bg-blue-100/80 px-4 py-2 rounded-xl flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-blue-800">Available now</span>
                      </div>
                      {(car.supplier.bookingMode === 'FREE_SALE' || !car.supplier.bookingMode) && (
                        <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-[#008009]/10 shadow-sm">
                          <Zap className="w-5 h-5 text-[#008009] fill-[#008009]/20" />
                          <span className="text-sm font-bold text-[#008009]">Instant Confirmation</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> Trip at a Glance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="rounded-xl border border-slate-300/70 bg-slate-100/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Pick-up</p>
                    <p className="font-semibold text-slate-900">{pickupCode || car.location}</p>
                    <p className="text-slate-600 mt-1">{startDate}</p>
                  </div>
                  <div className="rounded-xl border border-slate-300/70 bg-slate-100/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Drop-off</p>
                    <p className="font-semibold text-slate-900">{dropoffCode || pickupCode || car.location}</p>
                    <p className="text-slate-600 mt-1">{endDate}</p>
                  </div>
                  <div className="rounded-xl border border-slate-300/70 bg-slate-100/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Rental Plan</p>
                    <p className="font-semibold text-slate-900">{days} day{days > 1 ? 's' : ''}</p>
                    <p className="text-slate-600 mt-1">Flexible cancellation window</p>
                  </div>
                </div>
              </div>

              {/* Key Specifications Grid - rich icons */}
              <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><GaugeCircle className="w-5 h-5 text-blue-600" /> Key Specifications</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {[
                    { icon: Users, label: `${car.passengers} Seats`, desc: 'Comfortable seating' },
                    { icon: CarDoorIcon, label: `${car.doors} Doors`, desc: 'Easy access' },
                    { icon: Briefcase, label: `${car.bags} Bags`, desc: 'Luggage capacity' },
                    { icon: AutomaticIcon, label: car.transmission, desc: 'Smooth driving' },
                    { icon: Snowflake, label: 'A/C', desc: 'Climate control' },
                    { icon: GaugeCircle, label: car.unlimitedMileage ? 'Unlimited' : 'Limited', desc: 'Mileage policy' },
                    { icon: Fuel, label: car.fuelPolicy.split('_').join(' '), desc: 'Fuel policy' },
                    { icon: Hash, label: car.sippCode, desc: 'Vehicle code' }
                  ].map(spec => (
                    <div key={spec.label} className="flex flex-col items-center text-center p-3 bg-slate-100/80 border border-slate-300/70 rounded-xl hover:shadow-sm transition">
                      <spec.icon className="w-6 h-6 text-blue-600 mb-2" />
                      <span className="text-sm font-semibold text-slate-800">{spec.label}</span>
                      <span className="text-xs text-slate-600">{spec.desc}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowFullSpecs(!showFullSpecs)} className="mt-6 text-blue-600 text-sm flex items-center gap-1 mx-auto">{showFullSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {showFullSpecs ? 'Show less' : 'Show all specs'}</button>
                {showFullSpecs && (
                  <div className="mt-6 p-5 bg-[#eef2f8] border border-slate-300/70 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">Fuel Policy:</span> {car.fuelPolicy}</div>
                    <div><span className="font-semibold">Transmission:</span> {car.transmission}</div>
                    <div><span className="font-semibold">Mileage:</span> {car.unlimitedMileage ? 'Unlimited' : 'Limited'}</div>
                    <div><span className="font-semibold">Air Conditioning:</span> Yes</div>
                    <div><span className="font-semibold">Doors:</span> {car.doors}</div>
                    <div><span className="font-semibold">SIPP Code:</span> {car.sippCode}</div>
                    {car.deposit > 0 && <div><span className="font-semibold">Deposit:</span> {getCurrencySymbol()}{convertPrice(car.deposit)}</div>}
                  </div>
                )}
              </div>

              {/* Extras Section - modern cards */}
              {car.extras && car.extras.length > 0 && (
                <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-green-600" /> Optional Extras</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {car.extras.map(extra => (
                      <div key={extra.id} onClick={() => handleToggleExtra(extra.id)} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExtraIds.includes(extra.id) ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-100/70 hover:border-slate-400'}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg"><PlusCircle className="w-5 h-5 text-slate-600" /></div>
                          <div><div className="font-semibold">{extra.name}</div><div className="text-sm text-slate-700">{extra.type === 'per_day' ? 'per day' : 'one-time'}</div></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="font-bold">{getCurrencySymbol()}{convertPrice(extra.price).toFixed(2)}</div>
                          {selectedExtraIds.includes(extra.id) && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Included in your rate</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Supplier base rental and local taxes</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Transparent pay-now / pay-at-counter split</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Dedicated confirmation support</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Secure booking record and invoice trail</p>
                </div>
              </div>

              {/* Supplier Info with trust badges */}
              <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Building className="w-5 h-5 text-slate-600" /> {!car.hogicarChoice ? "About the Supplier" : "Hogicar Verification"}</h2>
                {!car.hogicarChoice ? (
                  <div className="flex flex-wrap items-center gap-6">
                    <img src={car.supplier.logo} alt={car.supplier.name} className="h-12 object-contain" />
                    <div><div className="font-semibold text-lg">{car.supplier.name}</div><div className="text-base text-slate-700">Car rental provider</div></div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-amber-500/20">
                      <Award className="w-10 h-10 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-black text-xl tracking-tight text-slate-900 uppercase">Hogicar Exclusive Fleet</div>
                      <div className="text-base text-slate-700 font-medium">Verified professional management</div>
                    </div>
                  </div>
                )}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center p-3 bg-slate-100/80 border border-slate-300/70 rounded-xl"><Shield className="w-6 h-6 text-green-600 mb-1" /><span className="text-sm font-bold text-slate-700">Verified Partner</span></div>
                  <div className="flex flex-col items-center p-3 bg-slate-100/80 border border-slate-300/70 rounded-xl"><Award className="w-6 h-6 text-yellow-500 mb-1" /><span className="text-sm font-bold text-slate-700">Top Rated</span></div>
                  <div className="flex flex-col items-center p-3 bg-slate-100/80 border border-slate-300/70 rounded-xl"><Headphones className="w-6 h-6 text-blue-500 mb-1" /><span className="text-sm font-bold text-slate-700">24/7 Support</span></div>
                  <div className="flex flex-col items-center p-3 bg-slate-100/80 border border-slate-300/70 rounded-xl"><Globe className="w-6 h-6 text-purple-500 mb-1" /><span className="text-sm font-bold text-slate-700">Global Presence</span></div>
                </div>
                <button onClick={() => setIsConditionsModalOpen(true)} className="mt-6 text-blue-600 text-sm font-medium underline flex items-center gap-1">View full rental conditions <ArrowRight className="w-4 h-4" /></button>
              </div>

              {/* Upgrade / Other models from same supplier */}
              {cars && cars.filter(c => c.id !== car.id && c.supplier.id === car.supplier.id).length > 0 && (
                <div className="bg-[#f3f6fb] rounded-2xl shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Upgrade your ride
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cars.filter(c => c.id !== car.id && c.supplier.id === car.supplier.id).slice(0, 4).map(similar => (
                      <Link 
                        key={similar.id} 
                        to={`/car/${similar.id}?${bookingParams}`} 
                        className="flex gap-4 p-4 border border-slate-300/70 bg-slate-100/80 rounded-xl hover:shadow-lg transition-all hover:border-blue-400"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        <img src={similar.image} alt={similar.displayName} className="w-24 h-24 object-contain rounded-lg" />
                        <div className="flex-1">
                          <div className="font-semibold">{similar.displayName}</div>
                          <div className="text-sm text-slate-500">{similar.category}</div>
                          <div className="font-bold text-blue-600 mt-2">{getCurrencySymbol()}{convertPrice(calcPricing(similar, { pickupDate: startDate, dropoffDate: endDate }).finalTotal).toFixed(2)} total</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Sidebar (professional) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                <div className="bg-[#f3f6fb] rounded-2xl shadow-xl shadow-slate-400/20 p-5 sm:p-6 border border-slate-300/70">
                  {/* Price lock timer */}
                  <div className="bg-slate-900 text-white p-4 rounded-xl mb-5 flex justify-between items-center">
                    <div><div className="text-sm uppercase tracking-wide text-slate-100">Price locked for</div><div className="font-mono font-bold text-2xl">{formatTime(timeLeft)}</div></div>
                    <Clock className="w-8 h-8 opacity-50" />
                  </div>
                  {/* Price breakdown */}
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Rental ({days} days)</span><span className="font-medium">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span></div>
                    {priceDetails.insuranceCost > 0 && <div className="flex justify-between text-sm"><span>Insurance</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span></div>}
                    {priceDetails.extrasCost > 0 && <div className="flex justify-between text-sm"><span>Extras</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.extrasCost).toFixed(2)}</span></div>}
                    {priceDetails.discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span></div>}
                    {priceDetails.hogicarPromoAmount > 0 && <div className="flex justify-between text-sm text-green-700 font-bold"><span>Secret Deal</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.hogicarPromoAmount).toFixed(2)}</span></div>}
                    <div className="border-t pt-3 mt-3"><div className="flex justify-between font-bold text-lg"><span>Total</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span></div><div className="text-sm text-slate-600 text-right">Including taxes & fees</div></div>
                  </div>
                  {/* Promo code */}
                  <div className="mb-5"><div className="flex gap-2"><input type="text" placeholder="Promo code" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" /><button onClick={handleApplyPromo} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition">Apply</button></div>{promoError && <p className="text-red-600 text-sm mt-1">{promoError}</p>}{appliedPromo && <p className="text-green-700 text-sm mt-1">✓ {appliedPromo.code} applied</p>}</div>
                  {/* Insurance selection */}
                  <div className="mb-5"><label className="flex items-center gap-2 mb-3 cursor-pointer"><input type="radio" name="insurance" checked={insuranceOption === 'basic'} onChange={() => setInsuranceOption('basic')} className="w-4 h-4 text-[#008009]" /> <span className="text-sm font-medium">Basic Insurance (included)</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="insurance" checked={insuranceOption === 'full'} onChange={() => setInsuranceOption('full')} className="w-4 h-4 text-[#008009]" /> <span className="text-sm font-medium">Full Protection (+${convertPrice(15 * days).toFixed(2)})</span></label></div>
                  <Link to={`/book/${car.id}?${bookingParams}`} onClick={handleContinue} className="block w-full bg-[#008009] hover:bg-[#006607] text-white text-center font-bold py-4 rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] uppercase tracking-widest text-sm">Continue to Book</Link>
                  <div className="mt-4 flex justify-center gap-2 opacity-70"><VisaIcon /><MastercardIcon /><AmexIcon /></div>
                </div>
                {/* Trust badge */}
                <div className="bg-[#eaf7ef] rounded-2xl p-5 border border-green-200/80"><div className="flex gap-3"><ShieldCheck className="w-6 h-6 text-green-600" /><div><div className="font-bold">Free cancellation</div><div className="text-sm text-slate-700">Up to 48 hours before pickup</div></div></div></div>
                <div className="bg-[#eaf0fb] rounded-2xl p-5 border border-blue-200/80"><div className="flex gap-3"><Headphones className="w-6 h-6 text-blue-600" /><div><div className="font-bold">24/7 Customer Support</div><div className="text-sm text-slate-700">We're here to help anytime</div></div></div></div>
                <div className="bg-[#f3f6fb] rounded-2xl p-5 border border-slate-300/70">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Professional booking checklist</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Driving license and passport/ID ready</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Card in the main driver’s name</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Review supplier terms before checkout</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#f3f6fb] border-t border-slate-300/80 shadow-lg p-4 z-40">
          <div className="flex justify-between items-center"><div><div className="text-sm text-slate-600">Total price</div><div className="text-xl font-bold">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</div></div><Link to={`/book/${car.id}?${bookingParams}`} onClick={handleContinue} className="bg-[#008009] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-green-100 transition-all active:scale-95">Book Now</Link></div>
        </div>
      </div>
    </>
  );
};

export default CarDetails;
