


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
  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded-sm shadow-md">
    <rect width="38" height="24" rx="3" fill="#fff" stroke="#ccc" strokeWidth="1"/>
    <path fill="#142688" d="M10.15 17.2h-2.3L4.6 7h2.55l1.95 7.2c.1.4.15.7.2 1h.05c.05-.3.1-.6.2-1L11.5 7h2.5L10.15 17.2zm11.2-10.2c-.5-.4-.9-.6-1.5-.6-1.8 0-3.1 1.2-3.1 2.9 0 1.4.9 2.2 2.1 2.7.5.2.7.4.7.6 0 .3-.3.5-.7.5-.5 0-.9-.2-1.2-.3l-.3-.2-.3-1.4h-1.6c.1 1.7 1.4 2.5 3 2.5 1.9 0 3.2-1.1 3.2-3 0-1.3-.8-2.1-2.1-2.6-.4-.2-.7-.4-.7-.6 0-.2.2-.5.7-.5.5 0 .8.1 1.1.3l.1.1.3 1.3H24c-.1-1.8-1.3-2.5-3.1-2.5zm5.7 10.2h1.7l-2.6-10.2h-1.8c-.2.4-.4.8-.5 1.2l-1.9 6.8h1.8l.4-1.6h2l.2 1.6zm-.9-3.2l.6-2.5.3-1.3c.05-.2.1-.4.1-.7h.05c.05.3.1.5.1.7l.4 2.1h-1.5zM29.6 7h-1.9l-1 10.2h1.8l1-10.2z"/>
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
    const allCars = carsFromState || carsFromStorage;

    if (!allCars || !Array.isArray(allCars) || !id) {
        return { car: null, cars: [] };
    }
    
    const foundCar = allCars.find((c: Car) => c.id === id);
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
    React.useEffect(() => {
        // Redirect to home if car data is lost
        navigate('/');
    }, [navigate]);
    return null; // or a loading/error component
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

    <div className="bg-slate-50 min-h-screen py-6 font-sans pb-28 lg:pb-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <BookingStepper currentStep={3} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title, Image & Specs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-2/5 flex items-center justify-center">
                         <div className="relative">
                             <img src={car.image} alt={`${car.make} ${car.model}`} className="max-w-xs w-full object-contain" />
                         </div>
                    </div>
                    <div className="md:w-3/5">
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">{car.category}</span>
                        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{car.displayName || `${car.make} ${car.model}`}</h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                            or similar {car.type}
                            <InfoTooltip text="You are booking a car from a specific category. The model shown is an example, but you will receive a similar vehicle with the same main features (size, transmission, etc.)." />
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <h3 className="text-sm font-bold text-slate-800 mb-3">Car Specifications</h3>
                             <div className="grid grid-cols-2 gap-3">
                                {carSpecs.map(spec => (
                                    <div key={spec.label} className="flex items-center gap-2 text-slate-700">
                                        <div className="bg-slate-100 p-1.5 rounded-md"><spec.icon /></div>
                                        <span className="text-xs font-semibold">{spec.label}</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pick-up & Supplier Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Pick-up & Supplier Information</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                       <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600"/> Pick-up Location</h3>
                       <p className="font-semibold text-slate-800">{car.location}</p>
                       <p className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full inline-block mt-2">{car.locationDetail}</p>
                   </div>
                   <div>
                       <h3 className="text-sm font-bold text-slate-700 mb-2">Rental Provider</h3>
                        <div className="flex items-center gap-4">
                            <img src={car.supplier.logo} alt={car.supplier.name} className="h-10 w-20 object-contain" />
                            <div>
                                <p className="font-bold text-slate-800">{car.supplier.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="bg-blue-600 text-white font-bold w-10 h-7 flex items-center justify-center rounded text-sm">{car.supplier.rating}</div>
                                    <p className="text-xs font-bold text-slate-700">Excellent</p>
                                </div>
                            </div>
                        </div>
                   </div>
               </div>
            </div>

             {/* Mobile CTA to scroll down */}
            <div className="block lg:hidden">
                <a 
                    href="#protection-section"
                    onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('protection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center text-sm"
                >
                    Add Extra and Protection <ArrowRight className="w-4 h-4 ml-2"/>
                </a>
            </div>
            
             {/* Rental Protection */}
            <div id="protection-section" className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 scroll-mt-24">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Rental Protection</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setInsuranceOption('basic')} className={`p-5 border-2 rounded-lg cursor-pointer transition-all duration-300 ${insuranceOption === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                     <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">Basic Coverage</h3>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${insuranceOption === 'basic' ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                             {insuranceOption === 'basic' && <Check className="w-3 h-3 text-white"/>}
                        </div>
                     </div>
                     <p className="text-xs text-slate-500 mt-2">Included. Covers theft and collision damage with an excess of {getCurrencySymbol()}{convertPrice(car.excess).toFixed(0)}.</p>
                  </div>
                   <div onClick={() => setInsuranceOption('full')} className={`p-5 border-2 rounded-lg cursor-pointer transition-all duration-300 ${insuranceOption === 'full' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                     <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Full Protection</h3>
                         <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${insuranceOption === 'full' ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                             {insuranceOption === 'full' && <Check className="w-3 h-3 text-white"/>}
                        </div>
                     </div>
                     <p className="text-xs text-slate-500 mt-2">Peace of mind. Your excess is reduced to {getCurrencySymbol()}0, plus coverage for tyres and windows.</p>
                     <p className="text-xs font-bold text-blue-600 mt-2">+ {getCurrencySymbol()}{convertPrice(12).toFixed(2)} / day</p>
                     
                     {insuranceOption === 'full' && (
                        <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-slate-600 space-y-1 animate-fadeIn">
                           <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> Reduces your excess to {getCurrencySymbol()}0</p>
                           <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> Covers windows, mirrors, wheels & tyres</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Optional Extras */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Optional Extras</h2>
                {(!car.extras || car.extras.length === 0) ? (
                    <p className="text-sm text-slate-500 italic">No optional extras are available for this vehicle.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {car.extras.map(extra => {
                            const isSelected = selectedExtraIds.includes(extra.id);
                            const Icon = extraIconMap[extra.name] || extraIconMap['default'];
                            return (
                                <div key={extra.id} onClick={() => handleToggleExtra(extra.id)} className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer ${isSelected ? 'bg-green-50 border-green-400' : 'bg-white border-slate-200 hover:border-slate-400'}`}>
                                    {extra.promotionLabel && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">{extra.promotionLabel}</div>}
                                    <div className="flex gap-4">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}><Icon className="w-5 h-5" /></div>
                                        <div className="flex-grow"><h4 className="font-bold text-slate-800 text-sm">{extra.name}</h4></div>
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 border-2 ${isSelected ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>{isSelected && <Check className="w-4 h-4 text-white" />}</div>
                                    </div>
                                    <div className="text-right mt-3 pt-3 border-t border-slate-100">
                                        <span className="text-sm font-extrabold text-slate-800">+{getCurrencySymbol()}{convertPrice(extra.price).toFixed(2)}</span>
                                        <span className="text-xs text-slate-500"> / {extra.type === 'per_day' ? 'day' : 'rental'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Promo Code - Mobile Only */}
            <div className="lg:hidden bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              {isPromoOpen ? (
                // Expanded View
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Enter Promo Code</h3>
                    <button onClick={() => setIsPromoOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter Code"
                        value={promoCodeInput}
                        onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        className="w-full border-slate-300 rounded-md py-2 pl-9 pr-4 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-slate-800 text-white font-bold px-4 rounded-md text-sm hover:bg-slate-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-red-600 text-xs mt-2 font-medium">{promoError}</p>}
                  {appliedPromo && !promoError && <p className="text-green-600 text-xs mt-2 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Code "{appliedPromo.code}" applied successfully!</p>}
                </div>
              ) : (
                // Collapsed View
                <button onClick={() => setIsPromoOpen(true)} className="w-full flex items-center justify-center gap-2 text-blue-600 font-bold text-sm py-3 px-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <Tag className="w-5 h-5" />
                  <span>Have a promo code?</span>
                </button>
              )}
            </div>

             {/* Important Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Important Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 text-sm gap-6">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-2 text-sm">Included in the price</h3>
                        <ul className="space-y-1.5 text-slate-600">
                            <li className="flex items-center gap-2 text-xs"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/>Free Cancellation up to 48 hours</li>
                            {car.supplier.includesCDW && <li className="flex items-center gap-2 text-xs"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/>Collision Damage Waiver</li>}
                            {car.supplier.includesTP && <li className="flex items-center gap-2 text-xs"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/>Theft Protection</li>}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-2 text-sm">Not Included</h3>
                        <ul className="space-y-1.5 text-slate-600">
                            <li className="flex items-center gap-2 text-xs"><XCircle className="w-4 h-4 text-red-500 flex-shrink-0"/> Fuel - {car.fuelPolicy}</li>
                            <li className="flex items-center gap-2 text-xs"><XCircle className="w-4 h-4 text-red-500 flex-shrink-0"/> Young driver fees (if applicable)</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => setIsConditionsModalOpen(true)} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                        View full rental conditions <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-5 sticky top-24">
               <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 flex items-center justify-between">
                   <p className="text-xs font-bold text-green-700 flex items-center gap-1.5"><Clock className="w-4 h-4"/>Price secured for:</p>
                   <p className="text-lg font-mono font-extrabold text-green-700 tracking-tight">{formatTime(timeLeft)}</p>
               </div>
               
               <h3 className="text-lg font-bold text-slate-900 mb-4">Price Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-slate-600"><span>Car Hire ({days} days)</span><span className="font-medium">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span></div>
                  {priceDetails.insuranceCost > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Full Protection</span><span className="font-medium">{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span></div>}
                  {priceDetails.extrasCost > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Extras</span><span className="font-medium">{getCurrencySymbol()}{convertPrice(priceDetails.extrasCost).toFixed(2)}</span></div>}
                  {priceDetails.discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount ({appliedPromo?.code})</span><span className="font-medium">-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span></div>}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                        <input 
                        type="text" 
                        placeholder="Promo Code" 
                        value={promoCodeInput}
                        onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        className="w-full border-slate-300 rounded-md p-2 text-base"
                        />
                        <button 
                        type="button" 
                        onClick={handleApplyPromo}
                        className="bg-slate-800 text-white font-bold px-4 rounded-md text-sm hover:bg-slate-700"
                        >
                        Apply
                        </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                    {appliedPromo && <p className="text-green-600 text-xs mt-1 font-bold">Applied: {appliedPromo.code}!</p>}
                </div>
               
               <div className="border-t-2 border-dashed border-slate-200 pt-3 my-4">
                  <div className="flex justify-between items-center"><span className="font-bold text-slate-900 text-base">Total</span><span className="font-bold text-slate-900 text-2xl">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span></div>
               </div>
               <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-2 mb-4">
                   <div className="flex justify-between font-bold text-blue-600"><span>Pay now</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-600"><span>Pay at rental desk</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span></div>
               </div>

               <Link to={`/book/${car.id}?${bookingSearchParams}`} state={{ cars: cars }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center text-sm">
                  Continue to Book
               </Link>
               
               <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5"><Tag className="w-3.5 h-3.5"/> In high demand!</p>
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
              <Link to={`/book/${car.id}?${bookingSearchParams}`} state={{ cars: cars }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform active:scale-95 text-sm whitespace-nowrap">
                  Continue to Book
              </Link>
          </div>
      </div>

    </div>
    </>
  );
};

export default CarDetails;