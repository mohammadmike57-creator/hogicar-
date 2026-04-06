import * as React from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_CARS, getPromoCode } from '../services/mockData';
import {
  Check, ShieldCheck, User, Users, Briefcase, Fuel, Info, CreditCard as CreditCardIcon,
  ShieldAlert, Calendar, Tag, Car as CarIcon, Snowflake, XCircle, FileText, Clock,
  Navigation, Baby, PlusCircle, Star, Sparkles, MapPin, CheckCircle, GaugeCircle, Hash, X,
  ArrowRight, Shield, Wifi, Wind, Thermometer, Smartphone, Battery, Coffee, Gift, Award,
  Heart, Share2, ChevronDown, ChevronUp, Phone, Building, Bus, Handshake
} from 'lucide-react';
import { Car, CommissionType, Supplier, PromoCode, Extra } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { calcPricing, rentalDays } from '../utils/pricing';

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

// Payment Icons
const VisaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24" className="rounded shadow-sm bg-white"><rect width="38" height="24" rx="3" fill="white"/><path d="M16.66 16.24H14.1l1.62-10.2h2.56l-1.62 10.2zm10.95-9.96c-.97-.27-2.54-.52-4.05-.52-4.45 0-7.58 2.37-7.6 5.77-.02 2.5 2.24 3.9 3.95 4.74 1.75.86 2.34 1.42 2.34 2.2-.02 1.18-1.42 1.74-2.73 1.74-1.54 0-2.37-.23-3.63-.8l-.52-.24-.73 4.54c.94.43 2.68.8 4.48.82 4.7 0 7.78-2.3 7.8-5.9.02-1.97-1.17-3.46-3.77-4.7-1.58-.8-2.54-1.33-2.54-2.15.02-1.06 1.18-1.64 2.62-1.64 1.2-.02 2.1.25 2.84.57l.34.16.73-4.54zm8.08 9.96h-2.22c-.67 0-1.18-.2-1.46-.87l-4.15-9.32h2.7l.53 1.5h3.3l.3-1.5h2.34l-1.35 10.2zm-2.72-2.75l-1.28-3.5-1.03 3.5h2.3zm-22.25-7.2l-2.4 8.54-.6-3.1c-.2-.8-.78-1.3-1.66-1.56L1.5 8.9v1.24c.7.16 1.5.44 1.96.78.3.22.44.5.53.9l1.77 8.46h2.7l4.06-10.2H8.72z" fill="#1A1F71"/></svg>
);

const MastercardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="white" rx="3"/><circle cx="13" cy="12" r="7" fill="#EA001B"/><circle cx="25" cy="12" r="7" fill="#F79E1B"/><path d="M20.5 12a7.002 7.002 0 01-7.5-6.96A7.002 7.002 0 0013 19a7.002 7.002 0 007.5-6.96A7.002 7.002 0 0120.5 12z" fill="#FF5F00"/></svg>
);

const AmexIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="#006FCF" rx="3"/><rect x="4" y="4" width="30" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/><text x="19" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white">AMEX</text></svg>
);

// Rental Conditions Modal
const RentalConditionsModal = ({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <div className="flex items-center gap-3">
            <img src={supplier.logo} alt={supplier.name} className="h-10 object-contain" />
            <div><h3 className="font-bold text-lg">Rental Conditions</h3><p className="text-xs text-slate-500">Provided by {supplier.name}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <div><h4 className="font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Rental Policy & Terms</h4><div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg h-48 overflow-y-auto">{supplier.termsAndConditions || "No specific terms provided."}</div></div>
          <div><h4 className="font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Required at Pick-up</h4><ul className="space-y-3"><li className="flex gap-3 p-3 bg-slate-50 rounded-lg"><Shield className="w-5 h-5 text-slate-400"/><div><strong>Valid Driving License</strong><p className="text-xs">Held for min 1 year. International permit may be required.</p></div></li><li className="flex gap-3 p-3 bg-slate-50 rounded-lg"><CreditCardIcon className="w-5 h-5 text-slate-400"/><div><strong>Credit Card</strong><p className="text-xs">In main driver's name with sufficient funds for deposit.</p></div></li></ul></div>
          <div><h4 className="font-bold mb-3 flex items-center gap-2"><CreditCardIcon className="w-4 h-4" /> Accepted Cards</h4><div className="flex gap-2"><VisaIcon/><MastercardIcon/><AmexIcon/></div></div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end rounded-b-2xl"><button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Close</button></div>
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

  // Get car from persisted state
  const { car, cars } = React.useMemo(() => {
    const carsFromState = location.state?.cars;
    const carsFromStorage = JSON.parse(sessionStorage.getItem('hogicar_cars') || 'null');
    const selectedCarRaw = sessionStorage.getItem('hogicar_selectedCar');
    let selectedCarFromStorage: Car | null = null;
    try { selectedCarFromStorage = selectedCarRaw ? JSON.parse(selectedCarRaw) : null; } catch { /* ignore */ }
    const allCars = carsFromState || carsFromStorage;
    if (!allCars || !Array.isArray(allCars)) {
      if (selectedCarFromStorage && (!id || String(selectedCarFromStorage.id) === String(id))) return { car: selectedCarFromStorage, cars: [selectedCarFromStorage] };
      return { car: null, cars: [] };
    }
    const foundCar = id ? allCars.find((c: Car) => String(c.id) === String(id)) : selectedCarFromStorage;
    return { car: foundCar || null, cars: allCars };
  }, [id, location.state]);

  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>([]);
  const [insuranceOption, setInsuranceOption] = React.useState<'basic' | 'full'>('basic');
  const [timeLeft, setTimeLeft] = React.useState(20 * 60);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);
  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null);
  const [promoError, setPromoError] = React.useState('');
  const [isPromoOpen, setIsPromoOpen] = React.useState(false);
  const [showFullSpecs, setShowFullSpecs] = React.useState(false);

  React.useEffect(() => {
    if (timeLeft === 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const pickupCode = searchParams.get('pickup');
  const dropoffCode = searchParams.get('dropoff');
  const days = rentalDays(startDate, endDate);

  const priceDetails = React.useMemo(() => {
    if (!car) return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    return calcPricing(car, { pickupDate: startDate, dropoffDate: endDate }, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, startDate, endDate, selectedExtraIds, insuranceOption, appliedPromo]);

  const handleToggleExtra = (extraId: string) => setSelectedExtraIds(prev => prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]);

  const handleApplyPromo = () => {
    if (!promoCodeInput) { setPromoError('Enter a code.'); return; }
    const promo = getPromoCode(promoCodeInput);
    if (promo && promo.status === 'active') { setAppliedPromo(promo); setPromoError(''); } else { setAppliedPromo(null); setPromoError('Invalid or expired code.'); }
  };

  const handleContinue = () => {
    sessionStorage.setItem('hogicar_selectedCarId', String(car!.id));
    sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
    sessionStorage.setItem('hogicar_cars', JSON.stringify(cars && cars.length ? cars : [car]));
  };

  const bookingParams = new URLSearchParams({ startDate, endDate, ...(pickupCode && { pickup: pickupCode }), ...(dropoffCode && { dropoff: dropoffCode }), ...(selectedExtraIds.length && { extras: selectedExtraIds.join(',') }), ...(appliedPromo && { promo: appliedPromo.code }) }).toString();

  if (!car) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md"><h1 className="text-2xl font-bold">Car Not Found</h1><p className="text-slate-500 mt-2">Please go back to search results.</p><button onClick={() => navigate(-1)} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">Back to Search</button></div>
      </div>
    );
  }

  const carSpecs = [
    { icon: Users, label: `${car.passengers} Seats` }, { icon: CarDoorIcon, label: `${car.doors} Doors` }, { icon: Briefcase, label: `${car.bags} Bags` }, { icon: AutomaticIcon, label: car.transmission }, { icon: Snowflake, label: 'Air Conditioning' }, { icon: GaugeCircle, label: car.unlimitedMileage ? 'Unlimited Mileage' : 'Limited Mileage' }, { icon: Fuel, label: car.fuelPolicy }, { icon: Hash, label: car.sippCode }
  ];

  return (
    <>
      <SEOMetadata title={`Rent a ${car.make} ${car.model} | Hogicar`} description={`Book ${car.make} ${car.model} from ${car.supplier.name}. Best price guaranteed.`} />
      <StructuredData car={car} total={convertPrice(priceDetails.finalTotal)} currencyCode={selectedCurrency} />
      {isConditionsModalOpen && <RentalConditionsModal supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}

      <div className="bg-slate-50 min-h-screen pb-32 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BookingStepper currentStep={3} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero Section - Image & Title */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative">
                  <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-64 lg:h-96 object-cover" />
                  <div className="absolute top-4 left-4 flex gap-2"><span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">{car.category}</span>{car.tags?.[0] && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">{car.tags[0]}</span>}</div>
                  <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md"><Heart className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                  <h1 className="text-2xl lg:text-3xl font-bold">{car.displayName || `${car.make} ${car.model}`}</h1>
                  <p className="text-slate-500 text-sm mt-1">or similar · {car.year}</p>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {car.supplier.rating} · {getRatingText(car.supplier.rating)}</div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-slate-400" /> {car.locationDetail}</div>
                  </div>
                </div>
              </div>

              {/* Key Specifications Grid */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Key Specifications</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {carSpecs.map(spec => (
                    <div key={spec.label} className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl">
                      <spec.icon className="w-6 h-6 text-blue-600 mb-2" />
                      <span className="text-xs font-medium text-slate-700">{spec.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowFullSpecs(!showFullSpecs)} className="mt-4 text-blue-600 text-sm flex items-center gap-1">{showFullSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {showFullSpecs ? 'Show less' : 'Show all specs'}</button>
                {showFullSpecs && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl grid grid-cols-2 gap-3 text-sm">
                    <div><span className="font-semibold">Fuel Policy:</span> {car.fuelPolicy}</div>
                    <div><span className="font-semibold">Transmission:</span> {car.transmission}</div>
                    <div><span className="font-semibold">Mileage:</span> {car.unlimitedMileage ? 'Unlimited' : 'Limited'}</div>
                    <div><span className="font-semibold">Air Conditioning:</span> Yes</div>
                    <div><span className="font-semibold">Doors:</span> {car.doors}</div>
                    <div><span className="font-semibold">SIPP Code:</span> {car.sippCode}</div>
                  </div>
                )}
              </div>

              {/* Extras Section */}
              {car.extras && car.extras.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-green-600" /> Optional Extras</h2>
                  <div className="space-y-3">
                    {car.extras.map(extra => (
                      <div key={extra.id} onClick={() => handleToggleExtra(extra.id)} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExtraIds.includes(extra.id) ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-3"><div className="p-2 bg-slate-100 rounded-lg"><PlusCircle className="w-5 h-5 text-slate-600" /></div><div><div className="font-semibold">{extra.name}</div><div className="text-xs text-slate-500">{extra.type === 'per_day' ? 'per day' : 'one-time'}</div></div></div>
                        <div className="flex items-center gap-4"><div className="font-bold">{getCurrencySymbol()}{convertPrice(extra.price).toFixed(2)}</div>{selectedExtraIds.includes(extra.id) && <Check className="w-5 h-5 text-green-600" />}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplier Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">About the Supplier</h2>
                <div className="flex items-center gap-4">
                  <img src={car.supplier.logo} alt={car.supplier.name} className="h-12 object-contain" />
                  <div><div className="font-semibold">{car.supplier.name}</div><div className="text-sm text-slate-500">Car rental provider</div></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Verified Partner</div>
                  <div className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> 4.5+ Rating</div>
                  <button onClick={() => setIsConditionsModalOpen(true)} className="text-blue-600 text-sm underline">View rental conditions →</button>
                </div>
              </div>

              {/* Similar Cars (placeholder) */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">You might also like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cars && cars.filter((c: Car) => c.id !== car.id).slice(0, 2).map((similar: Car) => (
                    <Link key={similar.id} to={`/car/${similar.id}?${bookingParams}`} className="flex gap-3 p-3 border rounded-xl hover:shadow transition">
                      <img src={similar.image} alt={similar.displayName} className="w-20 h-20 object-cover rounded" />
                      <div><div className="font-semibold">{similar.displayName}</div><div className="text-sm text-slate-500">{similar.category}</div><div className="font-bold text-blue-600">{getCurrencySymbol()}{convertPrice(calculatePriceFromCar(similar, days, startDate))}/day</div></div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                  <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 flex justify-between items-center"><div><div className="text-xs uppercase tracking-wide">Price locked for</div><div className="font-mono font-bold text-2xl">{formatTime(timeLeft)}</div></div><Clock className="w-8 h-8 opacity-50" /></div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between"><span className="text-slate-600">Rental ({days} days)</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span></div>
                    {priceDetails.insuranceCost > 0 && <div className="flex justify-between"><span>Insurance</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span></div>}
                    {priceDetails.extrasCost > 0 && <div className="flex justify-between"><span>Extras</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.extrasCost).toFixed(2)}</span></div>}
                    {priceDetails.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span></div>}
                    <div className="border-t pt-3 mt-3"><div className="flex justify-between font-bold text-lg"><span>Total</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span></div><div className="text-xs text-slate-500 text-right">Including taxes & fees</div></div>
                  </div>
                  {/* Promo */}
                  <div className="mb-6"><div className="flex gap-2"><input type="text" placeholder="Promo code" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} className="flex-1 border rounded-lg px-3 py-2 text-sm" /><button onClick={handleApplyPromo} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Apply</button></div>{promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}{appliedPromo && <p className="text-green-600 text-xs mt-1">✓ {appliedPromo.code} applied</p>}</div>
                  {/* Insurance selection */}
                  <div className="mb-6"><label className="flex items-center gap-2 mb-2"><input type="radio" name="insurance" checked={insuranceOption === 'basic'} onChange={() => setInsuranceOption('basic')} /> Basic Insurance (included)</label><label className="flex items-center gap-2"><input type="radio" name="insurance" checked={insuranceOption === 'full'} onChange={() => setInsuranceOption('full')} /> Full Protection (+${convertPrice(15 * days).toFixed(2)})</label></div>
                  <Link to={`/book/${car.id}?${bookingParams}`} onClick={handleContinue} className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-3 rounded-xl transition">Continue to Book</Link>
                  <div className="mt-4 flex justify-center gap-2 opacity-70"><VisaIcon /><MastercardIcon /><AmexIcon /></div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100"><div className="flex gap-3"><ShieldCheck className="w-6 h-6 text-green-600" /><div><div className="font-bold">Free cancellation</div><div className="text-xs">Up to 48 hours before pickup</div></div></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="flex justify-between items-center"><div><div className="text-xs text-slate-500">Total price</div><div className="text-xl font-bold">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</div></div><Link to={`/book/${car.id}?${bookingParams}`} onClick={handleContinue} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">Book Now</Link></div>
        </div>
      </div>
    </>
  );
};

// Helper to get rating text
function getRatingText(rating: number): string {
  if (rating >= 4.8) return 'Exceptional';
  if (rating >= 4.5) return 'Very Good';
  if (rating >= 4.0) return 'Good';
  if (rating >= 3.0) return 'Average';
  return 'Fair';
}

// Helper to calculate price for similar car (simplified)
function calculatePriceFromCar(car: Car, days: number, startDate: string): number {
  // Use first rate tier or default
  const tier = car.rateTiers?.[0]?.rates?.[0];
  return tier ? tier.dailyRate : 49.99;
}

export default CarDetails;
