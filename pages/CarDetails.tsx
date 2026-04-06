


import * as React from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_CARS, getPromoCode } from '../services/mockData';
// FIX: Add 'Users' to lucide-react import to fix missing icon errors.
import { Check, ShieldCheck, User, Users, Briefcase, Fuel, Info, CreditCard as CreditCardIcon, ShieldAlert, Calendar, Tag, Car as CarIcon, Snowflake, XCircle, FileText, Clock, Navigation, Baby, PlusCircle, Star, Sparkles, MapPin, CheckCircle, GaugeCircle, Hash, X, ArrowRight, Shield } from 'lucide-react';
import { Car, CommissionType, Supplier, PromoCode } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { calcPricing, rentalDays } from '../utils/pricing';

const StructuredData: React.FC<{ car: typeof MOCK_CARS[0], total: number, currencyCode: string }> = ({ car, total, currencyCode }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${car.make} ${car.model}`,
    "image": car.image,
    "description": `Rent a ${car.make} ${car.model} (${car.category}) from ${car.supplier.name}. Features include ${car.passengers} seats and space for ${car.bags} bags.`,
    "brand": {
      "@type": "Brand",
      "name": car.make
    },
    "vehicleModelDate": car.year,
    "vehicleTransmission": car.transmission,
    "offers": {
      "@type": "Offer",
      "price": total.toFixed(2),
      "priceCurrency": currencyCode,
      "availability": car.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": car.supplier.name
      }
    }
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group">
        <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-2 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
        </div>
    </div>
);

const extraIconMap: { [key: string]: React.ElementType } = {
  'GPS': Navigation,
  'Child Seat': Baby,
  'Ski Rack': Snowflake,
  'default': PlusCircle
};

const CarDoorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
        <path d="M19 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9"/>
        <path d="M12 15V6"/>
        <path d="M4 15h16"/>
        <path d="M15 11h-1"/>
    </svg>
);

const AutomaticIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
    <path d="M12 2v2.34"/><path d="M12 10.32v1.34"/><path d="M7.11 4.41 8 6.1"/><path d="M16 6.1l.89-1.69"/><path d="M4.41 16.89l1.69-.89"/><path d="M17.9 16l1.69.89"/><path d="M2 12h2.34"/><path d="M19.66 12H22"/><path d="M12 14.66V16"/><path d="M12 22v-2.34"/><path d="m15 12-3-3-3 3"/><path d="M12 9v13"/>
  </svg>
);

const MastercardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded-sm shadow-md">
    <rect width="38" height="24" fill="white" rx="3"/>
    <circle cx="13" cy="12" r="7" fill="#EA001B"/>
    <circle cx="25" cy="12" r="7" fill="#F79E1B"/>
    <path d="M20.5 12a7.002 7.002 0 01-7.5-6.96A7.002 7.002 0 0013 19a7.002 7.002 0 007.5-6.96A7.002 7.002 0 0120.5 12z" fill="#FF5F00"/>
  </svg>
);

const AmexIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded-sm shadow-md">
        <rect width="38" height="24" fill="#006FCF" rx="3"/>
        <rect x="4" y="4" width="30" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
        <text x="19" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white">AMEX</text>
    </svg>
);

const VisaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24" className="rounded-sm shadow-md bg-white">
    <rect width="38" height="24" rx="3" fill="white"/>
    <path d="M16.66 16.24H14.1l1.62-10.2h2.56l-1.62 10.2zm10.95-9.96c-.97-.27-2.54-.52-4.05-.52-4.45 0-7.58 2.37-7.6 5.77-.02 2.5 2.24 3.9 3.95 4.74 1.75.86 2.34 1.42 2.34 2.2-.02 1.18-1.42 1.74-2.73 1.74-1.54 0-2.37-.23-3.63-.8l-.52-.24-.73 4.54c.94.43 2.68.8 4.48.82 4.7 0 7.78-2.3 7.8-5.9.02-1.97-1.17-3.46-3.77-4.7-1.58-.8-2.54-1.33-2.54-2.15.02-1.06 1.18-1.64 2.62-1.64 1.2-.02 2.1.25 2.84.57l.34.16.73-4.54zm8.08 9.96h-2.22c-.67 0-1.18-.2-1.46-.87l-4.15-9.32h2.7l.53 1.5h3.3l.3-1.5h2.34l-1.35 10.2zm-2.72-2.75l-1.28-3.5-1.03 3.5h2.3zm-22.25-7.2l-2.4 8.54-.6-3.1c-.2-.8-.78-1.3-1.66-1.56L1.5 8.9v1.24c.7.16 1.5.44 1.96.78.3.22.44.5.53.9l1.77 8.46h2.7l4.06-10.2H8.72z" fill="#1A1F71"/>
  </svg>
);

const RentalConditionsModal = ({ supplier, onClose }: { supplier: Supplier, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col font-sans">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <img src={supplier.logo} alt={supplier.name} className="h-10 object-contain" />
                        <div>
                           <h3 className="font-bold text-lg text-slate-800">Rental Conditions</h3>
                           <p className="text-xs text-slate-500">Provided by {supplier.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500"/> Rental Policy & Terms</h4>
                        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed text-xs whitespace-pre-line border border-slate-200 bg-slate-50/50 p-4 rounded-lg h-48 overflow-y-auto">
                           {supplier.termsAndConditions || "No specific terms and conditions provided by this supplier."}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500"/> Required at Pick-up</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <Shield className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <div>
                                    <strong className="block text-slate-800">Valid Driving License</strong>
                                    <p className="text-xs text-slate-500">Must be held for a minimum of 1 year. International Driving Permit may be required.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <Users className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <div>
                                    <strong className="block text-slate-800">Passport / ID Card</strong>
                                    <p className="text-xs text-slate-500">A valid government-issued photo ID is required.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <CreditCardIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <div>
                                    <strong className="block text-slate-800">Credit Card</strong>
                                    <p className="text-xs text-slate-500">Must be in the main driver's name, with sufficient funds for the security deposit.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><CreditCardIcon className="w-4 h-4 text-slate-500"/> Accepted Payment Cards</h4>
                        <div className="flex gap-2 items-center">
                            <VisaIcon />
                            <MastercardIcon />
                            <AmexIcon />
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-xl">
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-transform active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get car object from persisted search results
  const { car, cars } = React.useMemo(() => {
    const carsFromState = location.state?.cars;
    const carsFromStorage = JSON.parse(sessionStorage.getItem('hogicar_cars') || 'null');
    const selectedCarId = sessionStorage.getItem('hogicar_selectedCarId');
    const selectedCarRaw = sessionStorage.getItem('hogicar_selectedCar');
    let selectedCarFromStorage: Car | null = null;
    if (selectedCarRaw) {
      try {
        selectedCarFromStorage = JSON.parse(selectedCarRaw);
      } catch {
        selectedCarFromStorage = null;
      }
    }
    const allCars = carsFromState || carsFromStorage;

    if (!allCars || !Array.isArray(allCars)) {
        const routeId = id || selectedCarId;
        if (selectedCarFromStorage && (!routeId || String(selectedCarFromStorage.id) === String(routeId))) {
          return { car: selectedCarFromStorage, cars: selectedCarFromStorage ? [selectedCarFromStorage] : [] };
        }
        return { car: null, cars: [] };
    }

    const routeId = id || selectedCarId;
    const foundCarInList = routeId
      ? allCars.find((c: Car) => String(c.id) === String(routeId))
      : null;
    const foundCar = foundCarInList
      || (selectedCarFromStorage && routeId && String(selectedCarFromStorage.id) === String(routeId) ? selectedCarFromStorage : null)
      || selectedCarFromStorage;
    return { car: foundCar || null, cars: allCars };
  }, [id, location.state]);

  const { convertPrice, getCurrencySymbol, selectedCurrency } = useCurrency();
  
  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>([]);
  const [insuranceOption, setInsuranceOption] = React.useState<'basic' | 'full'>('basic');
  const [timeLeft, setTimeLeft] = React.useState(20 * 60);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);

  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null);
  const [promoError, setPromoError] = React.useState('');
  const [isPromoOpen, setIsPromoOpen] = React.useState(false);

  const handleApplyPromo = () => {
      if (!promoCodeInput) {
          setPromoError('Please enter a code.');
          return;
      }
      const promo = getPromoCode(promoCodeInput);
      if (promo && promo.status === 'active') {
          setAppliedPromo(promo);
          setPromoError('');
      } else {
          setAppliedPromo(null);
          setPromoError('Invalid or expired promo code.');
      }
  };

  React.useEffect(() => {
    if (timeLeft === 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const pickupCode = searchParams.get('pickup');
  const dropoffCode = searchParams.get('dropoff');
  
  const search = { pickupDate: startDate, dropoffDate: endDate };
  const days = rentalDays(startDate, endDate);
  
  const priceDetails = React.useMemo(() => {
    if (!car) {
        // FIX: Add 'commissionAmount' to the fallback object to match the return type of calcPricing.
        return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    }
    return calcPricing(car, search, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, search, selectedExtraIds, insuranceOption, appliedPromo]);
  
  const handleToggleExtra = (extraId: string) => {
    setSelectedExtraIds(prev => 
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

  const handleContinueToBook = () => {
    sessionStorage.setItem('hogicar_selectedCarId', String(car.id));
    sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
    sessionStorage.setItem('hogicar_cars', JSON.stringify(cars && cars.length ? cars : [car]));
  };
  
  const bookingSearchParams = new URLSearchParams({ 
      startDate, 
      endDate,
      ...(pickupCode && { pickup: pickupCode }),
      ...(dropoffCode && { dropoff: dropoffCode }),
      ...(selectedExtraIds.length > 0 && { extras: selectedExtraIds.join(',') }),
      ...(appliedPromo && { promo: appliedPromo.code })
  }).toString();

  // Handle case where car is not found (e.g., page refresh with no session data)
  if (!car) {
    return (
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Car Details Not Available</h1>
            <p className="text-sm text-slate-600 mt-3">We could not find this car in your current search session. Please reopen from search results.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
            >
              Back to Search Results
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const carSpecs = [
    { icon: Users, label: `${car.passengers} Seats` },
    { icon: CarDoorIcon, label: `${car.doors} Doors` },
    { icon: Briefcase, label: `${car.bags} Bags` },
    { icon: AutomaticIcon, label: car.transmission },
    { icon: Snowflake, label: 'Air Con' },
    { icon: GaugeCircle, label: car.unlimitedMileage ? 'Unlimited Mileage' : 'Limited Mileage' },
    { icon: Fuel, label: car.fuelPolicy },
    { icon: Hash, label: car.sippCode },
  ];

  return (
    <>
    <SEOMetadata
      title={`Rent a ${car.make} ${car.model} in ${car.location} | Hogicar`}
      description={`Book a ${car.make} ${car.model} from ${car.supplier.name}. Check availability and get the best price for your rental in ${car.location} today.`}
    />
    <StructuredData car={car} total={convertPrice(priceDetails.finalTotal)} currencyCode={selectedCurrency} />
    {isConditionsModalOpen && <RentalConditionsModal supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}

    <div className="bg-slate-50 min-h-screen py-6 font-sans pb-32 lg:pb-12 overflow-x-hidden selection:bg-blue-100">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 transform scale-[0.96] lg:scale-[0.97] origin-top transition-all duration-700 ease-in-out">
        
        <div className="mb-10">
          <BookingStepper currentStep={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Title, Image & Specs Section - THE HERO */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden group relative">
                <div className="flex flex-col lg:flex-row">
                    {/* Image Column */}
                    <div className="lg:w-1/2 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 p-12 flex items-center justify-center relative overflow-hidden min-h-[400px]">
                         {/* Luxury Pattern Overlay */}
                         <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                         <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl transition-all group-hover:bg-blue-200/30"></div>
                         
                         <div className="relative z-10 w-full transform hover:scale-105 transition-transform duration-1000 ease-out">
                             <img 
                                src={car.image} 
                                alt={`${car.make} ${car.model}`} 
                                className="w-full h-auto object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.12)] group-hover:drop-shadow-[0_35px_50px_rgba(0,0,0,0.15)] transition-all" 
                             />
                         </div>
                         
                         {/* Badges Overlay */}
                         <div className="absolute top-10 left-10 flex flex-col gap-3">
                             <div className="flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl uppercase tracking-[0.25em] backdrop-blur-sm border border-white/10">
                                <CarIcon className="w-3 h-3 text-blue-400" /> {car.category}
                             </div>
                             {car.tags && car.tags[0] && (
                                <div className="bg-white/80 text-slate-900 text-[10px] font-black px-4 py-2 rounded-full shadow-lg border border-slate-100 uppercase tracking-[0.25em] backdrop-blur-md">
                                   {car.tags[0]}
                                </div>
                             )}
                         </div>
                    </div>

                    {/* Content Column */}
                    <div className="lg:w-1/2 p-12 lg:p-14 flex flex-col justify-center bg-white border-l border-slate-50">
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                           <div className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-2 border border-emerald-200/50 uppercase tracking-[0.2em] shadow-sm">
                               <Sparkles className="w-3.5 h-3.5"/> Recommended
                           </div>
                           <div className="bg-blue-50 text-blue-700 text-[9px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-2 border border-blue-200/50 uppercase tracking-[0.2em] shadow-sm">
                               <CheckCircle className="w-3.5 h-3.5"/> Verified Stock
                           </div>
                        </div>

                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[0.95] mb-4">
                            {car.displayName || `${car.make} ${car.model}`}
                        </h1>
                        <p className="text-xs text-slate-400 flex items-center gap-2 font-bold uppercase tracking-[0.15em] opacity-80 mb-12">
                            or similar {car.type}
                            <InfoTooltip text="The model shown is an example of the car you will receive, or one of similar quality and size from the same category." />
                        </p>
                        
                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            {carSpecs.slice(0, 4).map(spec => (
                                <div key={spec.label} className="flex items-center gap-5 group/spec">
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400 group-hover/spec:bg-slate-900 group-hover/spec:text-white group-hover/spec:border-slate-900 transition-all duration-300 shadow-sm">
                                        <spec.icon className="w-4.5 h-4.5" />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em]">{spec.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Supplier Card */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                   <div className="space-y-8">
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><MapPin className="w-4 h-4 text-blue-600"/> Pick-up Details</h3>
                       <div>
                           <p className="text-2xl font-black text-slate-900 tracking-tight mb-4">{car.location}</p>
                           <div className="inline-flex items-center gap-3 bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100/50 shadow-sm">
                               <Navigation className="w-4 h-4 opacity-70" />
                               {car.locationDetail}
                           </div>
                       </div>
                   </div>
                   <div className="md:border-l md:border-slate-100 md:pl-16 space-y-8">
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Car Provider</h3>
                       <div className="flex items-center gap-8">
                            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <img src={car.supplier.logo} alt={car.supplier.name} className="h-10 w-28 object-contain" />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-2xl tracking-tight leading-none mb-3">{car.supplier.name}</p>
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-600 text-white font-black px-3 py-1.5 rounded-lg text-xs shadow-lg shadow-emerald-600/20">{car.supplier.rating}</div>
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Exceptional Service</span>
                                </div>
                            </div>
                       </div>
                   </div>
               </div>
            </div>

            {/* Available Extras Section */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-12">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-3"><PlusCircle className="w-4 h-4 text-emerald-600"/> Available Enhancements</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Customise your rental experience</p>
                    </div>
                </div>
                {(!car.extras || car.extras.length === 0) ? (
                    <div className="bg-slate-50/50 rounded-3xl p-12 border-2 border-dashed border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">No optional extras are available for this specific vehicle.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {car.extras.map(extra => {
                            const isSelected = selectedExtraIds.includes(extra.id);
                            const Icon = extraIconMap[extra.name] || extraIconMap['default'];
                            return (
                                <div key={extra.id} onClick={() => handleToggleExtra(extra.id)} className={`relative overflow-hidden rounded-[2rem] border-2 p-8 transition-all duration-500 cursor-pointer group/extra ${isSelected ? 'bg-emerald-50/30 border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl'}`}>
                                    {extra.promotionLabel && <div className="absolute top-0 right-0 bg-slate-900 text-white text-[8px] font-black px-4 py-2 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg">{extra.promotionLabel}</div>}
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-6 items-center">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-50 text-slate-400 group-hover/extra:bg-slate-900 group-hover/extra:text-white'}`}><Icon className="w-6 h-6" /></div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-[12px] uppercase tracking-[0.2em] mb-1">{extra.name}</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{extra.type === 'per_day' ? 'Daily rate' : 'Fixed fee'}</p>
                                            </div>
                                        </div>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isSelected ? 'bg-emerald-600 border-emerald-600 scale-110' : 'border-slate-200 bg-white group-hover/extra:border-slate-400'}`}>{isSelected && <Check className="w-4 h-4 text-white" />}</div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-100/60 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Price</span>
                                        <span className="text-xl font-black text-slate-900 tracking-tight">{getCurrencySymbol()}{convertPrice(extra.price).toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Promo Code - Mobile Only */}
            <div className="lg:hidden bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 overflow-hidden">
              {isPromoOpen ? (
                // Expanded View
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">PROMO CODE</h3>
                    <button onClick={() => setIsPromoOpen(false)} className="text-slate-300 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-grow">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={promoCodeInput}
                        onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        className="w-full border-slate-100 bg-slate-50/50 rounded-xl py-4 pl-11 pr-4 text-[11px] font-black tracking-widest focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-slate-900 text-white font-black px-6 rounded-xl text-[10px] uppercase tracking-widest"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-[9px] mt-3 font-black uppercase tracking-widest ml-1">{promoError}</p>}
                  {appliedPromo && !promoError && <p className="text-emerald-600 text-[9px] mt-3 font-black uppercase tracking-widest flex items-center gap-1.5 ml-1"><CheckCircle className="w-4 h-4" /> Code applied successfully!</p>}
                </div>
              ) : (
                // Collapsed View
                <button onClick={() => setIsPromoOpen(true)} className="w-full flex items-center justify-center gap-3 text-blue-600 font-black text-[10px] py-4 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all uppercase tracking-[0.2em]">
                  <Tag className="w-5 h-5" />
                  <span>Have a promo code?</span>
                </button>
              )}
            </div>

             {/* Essential Info Section */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-12">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12 flex items-center gap-3"><ShieldAlert className="w-4 h-4 text-orange-500"/> Essential Rental Terms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-900 mb-8 uppercase tracking-[0.25em] flex items-center gap-3">Included in price <div className="h-px flex-grow bg-emerald-100/50"></div></h3>
                            <ul className="space-y-6">
                                <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] group">
                                    <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Check className="w-3 h-3"/></div>
                                    Free Cancellation <span className="text-[9px] text-slate-300 font-bold ml-auto opacity-70">Up to 48h</span>
                                </li>
                                {car.supplier.includesCDW && (
                                    <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] group">
                                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Check className="w-3 h-3"/></div>
                                        Collision Damage Waiver
                                    </li>
                                )}
                                {car.supplier.includesTP && (
                                    <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] group">
                                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Check className="w-3 h-3"/></div>
                                        Theft Protection
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-900 mb-8 uppercase tracking-[0.25em] flex items-center gap-3">Additional Info <div className="h-px flex-grow bg-slate-100/50"></div></h3>
                            <ul className="space-y-6">
                                <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] group">
                                    <div className="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all"><Info className="w-3 h-3"/></div>
                                    Fuel Policy: {car.fuelPolicy}
                                </li>
                                <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] group">
                                    <div className="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all"><Info className="w-3 h-3"/></div>
                                    Security Deposit Required
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-16 pt-10 border-t border-slate-50 flex justify-center">
                    <button onClick={() => setIsConditionsModalOpen(true)} className="group relative px-10 py-4 overflow-hidden rounded-xl bg-slate-50 hover:bg-slate-900 transition-all duration-500">
                        <span className="relative z-10 text-[11px] font-black text-slate-900 group-hover:text-white uppercase tracking-[0.3em] flex items-center gap-4 transition-colors">
                            Full Rental Conditions <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500"/>
                        </span>
                    </button>
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-10 space-y-8">
              {/* Main Booking Sidebar */}
              <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100 p-10 transform lg:scale-[0.96] origin-top transition-all hover:scale-100 duration-700">
                 {/* Timer Header */}
                 <div className="mb-10 p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between shadow-2xl shadow-slate-900/20 relative overflow-hidden group/timer">
                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover/timer:opacity-10 transition-opacity"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Time Secured</p>
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.15em] flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Best Price Lock</p>
                    </div>
                    <p className="text-3xl font-mono font-black text-white tracking-tighter drop-shadow-lg">{formatTime(timeLeft)}</p>
                 </div>
                 
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">Order Summary <div className="h-px flex-grow bg-slate-50"></div></h3>
                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest group">
                        <span>Vehicle Rental <span className="text-[9px] text-slate-300 ml-1">({days}d)</span></span>
                        <span className="text-slate-900 group-hover:text-blue-600 transition-colors">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span>
                    </div>
                    {priceDetails.insuranceCost > 0 && (
                        <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest group">
                            <span>Premium Protection</span>
                            <span className="text-slate-900 group-hover:text-emerald-600 transition-colors">{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span>
                        </div>
                    )}
                    {priceDetails.extrasCost > 0 && (
                        <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest group">
                            <span>Selected Extras</span>
                            <span className="text-slate-900 group-hover:text-blue-600 transition-colors">{getCurrencySymbol()}{convertPrice(priceDetails.extrasCost).toFixed(2)}</span>
                        </div>
                    )}
                    {priceDetails.discountAmount > 0 && (
                        <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50 p-2 rounded-lg -mx-2 border border-emerald-100/30">
                            <span>Special Discount</span>
                            <span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span>
                        </div>
                    )}
                  </div>

                  {/* Promo Section */}
                  <div className="pt-8 mb-10 border-t border-slate-50">
                      <div className="flex gap-3">
                          <div className="relative flex-grow">
                              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                  type="text" 
                                  placeholder="COUPON CODE" 
                                  value={promoCodeInput}
                                  onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(''); }}
                                  className="w-full border-slate-100 bg-slate-50 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black tracking-[0.2em] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                              />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleApplyPromo}
                            className="bg-slate-900 text-white font-black px-6 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                          >
                            Apply
                          </button>
                      </div>
                      {promoError && <p className="text-red-500 text-[9px] mt-3 font-black uppercase tracking-widest ml-2">{promoError}</p>}
                      {appliedPromo && <p className="text-emerald-600 text-[9px] mt-3 font-black uppercase tracking-widest flex items-center gap-2 ml-2"><CheckCircle className="w-4 h-4"/> Success: {appliedPromo.code} active</p>}
                  </div>
                 
                 <div className="pt-10 border-t-2 border-dashed border-slate-100 mb-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em] block mb-2">Total Amount</span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> All inclusive</span>
                        </div>
                        <span className="font-black text-slate-900 text-5xl tracking-tighter leading-none">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50 space-y-4 mb-10">
                     <div className="flex justify-between font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]"><span>Pay online now</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span></div>
                     <div className="flex justify-between font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]"><span>Pay at counter</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span></div>
                 </div>

                 <Link to={`/book/${car.id}?${bookingSearchParams}`} state={{ cars: cars }} onClick={handleContinueToBook} className="group relative w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-6 rounded-2xl shadow-2xl shadow-slate-900/20 transition-all duration-500 active:scale-[0.98] flex items-center justify-center text-xs uppercase tracking-[0.3em] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 flex items-center gap-4">
                        Continue Booking <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500"/>
                    </span>
                 </Link>
                 
                 <p className="text-center text-[9px] font-black text-slate-300 mt-8 flex items-center justify-center gap-3 uppercase tracking-[0.2em]"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Secure Data Encryption</p>
              </div>

              {/* Trust Badge Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[2rem] border border-emerald-100 p-8">
                  <div className="flex items-start gap-4">
                      <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-600/20"><Shield className="w-5 h-5"/></div>
                      <div>
                          <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-widest mb-2">Money Back Guarantee</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-70">Cancel up to 48 hours before pick-up for a full refund.</p>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* Mobile Floating CTA Bar */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-4">
              <div>
                  <p className="text-xs text-slate-500">Total Price</p>
                  <p className="font-bold text-xl text-slate-900">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</p>
              </div>
              <Link to={`/book/${car.id}?${bookingSearchParams}`} state={{ cars: cars }} onClick={handleContinueToBook} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform active:scale-95 text-sm whitespace-nowrap">
                  Continue to Book
              </Link>
          </div>
      </div>

    </div>
    </>
  );
};

export default CarDetails;
