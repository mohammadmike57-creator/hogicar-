
import * as React from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { getPromoCode } from '../services/mockData';
import { ShieldCheck, User, CreditCard, Shield, Info, Mail, Phone, Plane, Clock, ArrowRight, Check, MapPin, CalendarDays, Headphones, BadgeCheck, Award, Zap } from 'lucide-react';
import { Car, PromoCode } from '../types';
import { DetailedRatingsTooltip } from '../components/DetailedRatingsTooltip';
import { getRatingDescription } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { calcPricing, rentalDays } from '../utils/pricing';
import { api } from '../api';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const FormInput = ({ icon: Icon, ...props }: { icon: React.ElementType, [key: string]: any }) => (
  <div className="relative group/input">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 sm:pl-5">
      <Icon className="h-4 w-4 text-slate-500 group-focus-within/input:text-blue-600 transition-colors" />
    </div>
    <input
      {...props}
      className="block w-full rounded-xl sm:rounded-2xl border border-slate-300/75 bg-[#f3f6fb] pl-11 sm:pl-12 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] sm:text-base text-slate-900 font-medium py-3.5 sm:py-4 transition-all placeholder:text-slate-500 placeholder:font-medium"
    />
  </div>
);

type BookingPageContentProps = {
  stripeEnabled: boolean;
  stripeConfigLoading: boolean;
  stripeInstance: ReturnType<typeof useStripe>;
  elementsInstance: ReturnType<typeof useElements>;
};

const BookingPageContent: React.FC<BookingPageContentProps> = ({ stripeEnabled, stripeConfigLoading, stripeInstance, elementsInstance }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stripe = stripeInstance;
  const elements = elementsInstance;
  
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

  const { convertPrice, getCurrencySymbol } = useCurrency();

  const initialExtras = searchParams.get('extras')?.split(',').filter(Boolean) || [];
  const initialPromoCode = searchParams.get('promo');

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [flightNumber, setFlightNumber] = React.useState('');
  const [insuranceOption, setInsuranceOption] = React.useState<'basic' | 'full'>('basic');
  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>(initialExtras);
  const [timeLeft, setTimeLeft] = React.useState(20 * 60);
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showRatingsTooltip, setShowRatingsTooltip] = React.useState(false);
  const [cardholderName, setCardholderName] = React.useState('');
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialPromoCode) {
      const promo = getPromoCode(initialPromoCode);
      if (promo && promo.status === 'active') {
        setAppliedPromo(promo);
      }
    }
  }, [initialPromoCode]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(prevTimeLeft => {
        if (prevTimeLeft <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prevTimeLeft - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const search = JSON.parse(sessionStorage.getItem('hogicar_search') || '{}');
  const startDate = search.pickupDate || new Date().toISOString().split('T')[0];
  const endDate = search.dropoffDate || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const startTime = search.startTime || search.pickupTime || '10:00';
  const endTime = search.endTime || search.dropoffTime || '10:00';
  const days = rentalDays(startDate, endDate);
  const pickupLabel = search.pickupName || search.pickup || search.pickupCode || car?.location || 'Pickup location';
  const dropoffLabel = search.dropoffName || search.dropoff || search.dropoffCode || pickupLabel;
  
  const priceDetails = React.useMemo(() => {
    if (!car) {
        return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, hogicarPromoAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    }
    return calcPricing(car, { pickupDate: startDate, dropoffDate: endDate }, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, startDate, endDate, selectedExtraIds, insuranceOption, appliedPromo]);
  
  const [imageError, setImageError] = React.useState(false);
  const displayImage = imageError ? 'https://placehold.co/400x250/orange/white?text=Vehicle' : (car?.image || 'https://placehold.co/400x250/orange/white?text=Vehicle');

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || !firstName || !lastName || !email || !phoneNumber) {
      alert("Please fill in all required driver details.");
      return;
    }

    if (!search.pickupCode || !search.dropoffCode) {
      alert("Pickup/Dropoff location code is missing. Please start your search again.");
      return;
    }
    if (priceDetails.payNow > 0 && stripeConfigLoading) {
      alert('Stripe is still loading. Please wait a moment and try again.');
      return;
    }
    if (priceDetails.payNow > 0 && !stripeEnabled) {
      alert('Stripe is not configured. Please contact support.');
      return;
    }

    const carId = Number(car.id);
    const supplierId = Number(car.supplierId ?? car.supplier?.id);
    if (!Number.isFinite(carId) || carId <= 0) {
      alert('Invalid car id. Please go back to search and select the car again.');
      return;
    }
    if (!Number.isFinite(supplierId) || supplierId <= 0) {
      alert('Invalid supplier id. Please go back to search and select the car again.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);
    
    const payload = {
        carId,
        supplierId,
        supplierName: car.supplier?.name || 'Supplier',
        pickupCode: search.pickupCode,
        dropoffCode: search.dropoffCode,
        pickupDate: startDate,
        dropoffDate: endDate,
        startTime,
        endTime,
        currency: car.currency || 'USD',
        netPrice: priceDetails.baseNetTotal,
        commissionPercent: car.commissionPercent ?? 0,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phoneNumber,
        finalPrice: priceDetails.finalTotal,
        payNow: priceDetails.payNow,
        payAtDesk: priceDetails.payAtDesk,
        flightNumber: flightNumber,
        selectedExtras: car.extras?.filter(e => selectedExtraIds.includes(e.id))
    };

    try {
        const booking = await api.createBooking(payload);

        if (priceDetails.payNow > 0) {
          if (!stripeEnabled || !stripe || !elements) {
            throw new Error('Stripe payment is not configured. Please contact support.');
          }
          if (!booking.clientSecret) {
            throw new Error('Payment session was not created. Please try again.');
          }

          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            throw new Error('Payment form is not ready. Please try again.');
          }

          const paymentResult = await stripe.confirmCardPayment(booking.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: cardholderName || `${firstName} ${lastName}`.trim(),
                email,
                phone: phoneNumber,
              },
            },
          });

          if (paymentResult.error) {
            throw new Error(paymentResult.error.message || 'Payment confirmation failed.');
          }
        }
        
        // Set one-time flag for confirmation page
        // Use the bookingRef returned by the API (which might be in the Booking object)
        const bookingRef = (booking as any).bookingRef || booking.id;

        sessionStorage.setItem("allowConfirmationRef", bookingRef.toString());
        sessionStorage.setItem("hogicar_booking", JSON.stringify(booking));
        // Keep car data for confirmation page display
        sessionStorage.setItem("hogicar_car", JSON.stringify(car));

        const navUrl = `/confirmation?bookingRef=${bookingRef}`;
        navigate(navUrl);
    } catch (error: any) {
        console.error("Booking submission error:", error);
        const message = error.message || 'An unknown error occurred.';
        setPaymentError(message);
        alert(`Booking failed: ${message}`);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!car) {
    return (
      <div className="bg-slate-100 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-[#f2f5fa] border border-slate-300/70 rounded-2xl p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Booking Details Not Available</h1>
            <p className="text-sm text-slate-600 mt-3">We could not find this selected vehicle in your session. Please return to results and try again.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
            >
              Back to Car Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <SEOMetadata
        title={`Book ${car.make} ${car.model} | Hogicar`}
        description="Complete your booking and payment details to reserve your car."
        noIndex={true}
      />
    <div className="bg-slate-200/55 min-h-screen py-6 sm:py-8 font-sans overflow-x-hidden text-slate-800 selection:bg-blue-100">
      <div className="max-w-[1500px] mx-auto px-2 sm:px-6 lg:px-10">
        <div className="mb-6 sm:mb-10">
            <BookingStepper currentStep={4} />
        </div>

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 xl:gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Vehicle Summary Header */}
            <div className="bg-[#f3f6fb] rounded-3xl sm:rounded-[2.5rem] shadow-lg shadow-slate-400/20 border border-slate-300/70 p-5 sm:p-7 flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-100/70 to-slate-200/70 pointer-events-none"></div>
               <div className="bg-slate-100/80 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-300/60 flex-shrink-0 relative overflow-hidden">
                   <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                   <img 
                    src={displayImage} 
                    alt={car.model} 
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    className="w-40 sm:w-48 h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.1)] transform group-hover:scale-110 transition-transform duration-1000"
                   />
               </div>
               <div className="flex-grow text-center md:text-left relative z-10">
                  <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                      <span className="bg-slate-900 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-[0.25em] shadow-lg border border-white/10">{car.category}</span>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-emerald-100">Ready for Pick-up</span>
                  </div>
                  <h1 className="text-[1.45rem] sm:text-[2.15rem] font-black text-slate-900 leading-tight tracking-tight mb-3 sm:mb-4">{car.displayName || `${car.make} ${car.model}`}</h1>
                  <p className="text-[11px] sm:text-xs font-black text-slate-600 uppercase tracking-[0.16em] sm:tracking-[0.3em] flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap">
                    {car.transmission} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {car.fuelPolicy} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {car.location}
                  </p>
                  
                  {!car.hogicarChoice ? (
                    <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200/70">
                        <div className="bg-[#edf2fa] border border-slate-300/70 p-2.5 sm:p-3 rounded-xl shadow-sm">
                          <img src={car.supplier.logo} alt={car.supplier.name} className="h-12 sm:h-16 w-auto object-contain" />
                        </div>
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div>
                            <p className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.18em] sm:tracking-[0.2em] leading-none mb-2">Service Provider</p>
                            <p className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-[0.12em] sm:tracking-[0.15em]">{car.supplier.name}</p>
                          </div>
                          <div 
                            className="flex items-center gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl shadow-sm border border-slate-200 ml-1 group/rating relative cursor-pointer"
                            onMouseEnter={() => setShowRatingsTooltip(true)}
                            onMouseLeave={() => setShowRatingsTooltip(false)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowRatingsTooltip(!showRatingsTooltip);
                            }}
                          >
                             <div className="bg-[#008009] text-white text-xs sm:text-sm font-black w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg shadow-sm">
                                 {car.supplier.rating}
                             </div>
                             <div className="hidden sm:flex flex-col">
                                 <span className="text-[10px] font-black text-slate-900 leading-none">{getRatingDescription(car.supplier.rating)}</span>
                                 <span className="text-[8px] font-bold text-slate-400 mt-0.5">Reviews</span>
                             </div>
                             {car.detailedRatings && <DetailedRatingsTooltip ratings={car.detailedRatings} visible={showRatingsTooltip} />}
                          </div>
                        </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200/70">
                       <div className="bg-[#003580] border-2 border-amber-400 p-3 sm:p-4 rounded-2xl shadow-xl flex items-center justify-center">
                          <Award className="w-8 h-8 text-amber-400 fill-amber-400/20" />
                       </div>
                       <div>
                         <p className="text-[11px] sm:text-xs font-black text-amber-600 uppercase tracking-[0.25em] mb-1 italic">Hogicar Choice</p>
                         <p className="text-sm sm:text-lg font-black text-slate-900 tracking-tight uppercase">Exclusive Verified Fleet</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-[#f3f6fb] rounded-2xl border border-slate-300/70 p-4 sm:p-5">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500 mb-2">Pick-up</p>
                <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-600 mt-0.5" /> <span>{pickupLabel}</span></p>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> {startDate} · {startTime}</p>
              </div>
              <div className="bg-[#f3f6fb] rounded-2xl border border-slate-300/70 p-4 sm:p-5">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500 mb-2">Drop-off</p>
                <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-600 mt-0.5" /> <span>{dropoffLabel}</span></p>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> {endDate} · {endTime}</p>
              </div>
              <div className="bg-[#f3f6fb] rounded-2xl border border-slate-300/70 p-4 sm:p-5">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500 mb-2">Booking benefits</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600" /> Confirmed supplier inventory</li>
                  <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> PCI-compliant secure checkout</li>
                  <li className="flex items-center gap-2"><Headphones className="w-4 h-4 text-indigo-600" /> Live support before pick-up</li>
                </ul>
              </div>
            </div>

            {/* Driver Details */}
            <div className="bg-[#f3f6fb] rounded-3xl sm:rounded-[2.5rem] shadow-lg shadow-slate-400/20 border border-slate-300/70 p-6 sm:p-10">
               <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3"><User className="w-5 h-5 text-blue-600"/> Main Driver Information</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 sm:gap-y-10">
                  <div className="group"><label className="block text-sm font-semibold text-slate-700 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">First Name</label><FormInput icon={User} type="text" placeholder="John" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value.toUpperCase())} required /></div>
                  <div className="group"><label className="block text-sm font-semibold text-slate-700 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Last Name</label><FormInput icon={User} type="text" placeholder="Doe" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value.toUpperCase())} required /></div>
                  <div className="group"><label className="block text-sm font-semibold text-slate-700 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Email Address</label><FormInput icon={Mail} type="email" placeholder="john.doe@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value.toUpperCase())} required /></div>
                  <div className="group"><label className="block text-sm font-semibold text-slate-700 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Mobile Number</label><FormInput icon={Phone} type="tel" placeholder="+1..." value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} required /></div>
                  <div className="md:col-span-2 group pt-4">
                    <label className="block text-sm font-semibold text-slate-800 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Flight Number <span className="text-xs text-slate-500 ml-2">(Optional)</span></label>
                    <FormInput icon={Plane} type="text" placeholder="e.g. BA123" value={flightNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlightNumber(e.target.value.toUpperCase())} /> 
                    <p className="text-sm text-slate-700 mt-4 font-medium flex items-center gap-2"><Info className="w-4 h-4 text-blue-500"/> Providing your flight number helps the provider wait if your flight is delayed.</p>
                  </div>
               </div>
            </div>


            {/* Payment Details */}
            <div className="bg-[#f3f6fb] rounded-3xl sm:rounded-[2.5rem] shadow-lg shadow-slate-400/20 border border-slate-300/70 p-6 sm:p-10">
               <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3"><CreditCard className="w-5 h-5 text-blue-600"/> Secure Payment Details</h2>
               <div className="space-y-6 sm:space-y-10">
                  <div className="group"><label className="block text-sm font-semibold text-slate-700 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Cardholder Name</label><FormInput icon={User} type="text" placeholder="As shown on card" value={cardholderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardholderName(e.target.value.toUpperCase())} required={priceDetails.payNow > 0} /></div>
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Card Information</label>
                    {stripeEnabled ? (
                      <div className="rounded-xl sm:rounded-2xl border border-slate-300 px-4 sm:px-6 py-4 sm:py-5 shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 bg-[#f2f5fb] transition-all">
                        <CardElement options={{ 
                            hidePostalCode: true,
                            style: {
                                base: {
                                    fontSize: '18px',
                                    color: '#0f172a',
                                    fontWeight: '500',
                                    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                                    letterSpacing: '0.01em',
                                    '::placeholder': {
                                        color: '#94a3b8',
                                        fontSize: '14px',
                                        letterSpacing: '0.01em',
                                        fontWeight: '400'
                                    },
                                },
                            }
                        }} />
                      </div>
                    ) : stripeConfigLoading ? (
                      <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50/40 px-4 sm:px-6 py-4 sm:py-5 text-sm font-semibold text-blue-800 flex items-center gap-3 shadow-inner">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Establishing Secure Connection...
                      </div>
                    ) : (
                      <div className="rounded-xl sm:rounded-2xl border border-red-100 bg-red-50/40 px-4 sm:px-6 py-4 sm:py-5 text-sm font-semibold text-red-700 shadow-inner">
                        Security gateway is currently unavailable.
                      </div>
                    )}
                    <p className="mt-3 text-sm text-slate-600">Your card details are encrypted and processed securely by Stripe.</p>
                  </div>
                  {paymentError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 px-6 py-5 text-sm font-semibold text-red-700 flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      {paymentError}
                    </div>
                  )}
                  
                  <div className="rounded-2xl border border-slate-300/75 bg-[#eef2f8] p-4 sm:p-5 space-y-2">
                    <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">Payment Assurance</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
                      <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> TLS encrypted checkout</p>
                      <p className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-blue-600" /> Instant booking reference</p>
                      <p className="flex items-center gap-2"><Headphones className="w-4 h-4 text-indigo-600" /> Dedicated support team</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
                     <div className="rounded-2xl sm:rounded-[1.5rem] border border-slate-300/70 bg-slate-100/80 px-5 sm:px-6 py-4 sm:py-5">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Check-in Time</p>
                        <p className="text-lg font-semibold text-slate-900">{startTime}</p>
                     </div>
                     <div className="rounded-2xl sm:rounded-[1.5rem] border border-slate-300/70 bg-slate-100/80 px-5 sm:px-6 py-4 sm:py-5">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Check-out Time</p>
                        <p className="text-lg font-semibold text-slate-900">{endTime}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar / Booking Summary */}
          <div className="lg:col-span-1">
             <div className="sticky top-6 sm:top-10 space-y-5 sm:space-y-6">
                <div className="bg-[#f3f6fb] rounded-3xl sm:rounded-[2.5rem] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.38)] border border-slate-300/70 p-6 sm:p-8 transition-all duration-500">
                  <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 text-white flex items-center justify-between shadow-xl shadow-slate-900/20 relative overflow-hidden group/timer gap-4">
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover/timer:opacity-10 transition-opacity"></div>
                      <div>
                          <p className="text-xs font-black text-slate-200 uppercase tracking-[0.25em] mb-1">Session Expires</p>
                          <p className="text-sm font-black text-blue-300 uppercase tracking-[0.15em] flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Complete Now</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tighter drop-shadow-lg">{formatTime(timeLeft)}</p>
                  </div>

                   <h3 className="text-base font-semibold text-slate-800 mb-5 sm:mb-6 flex items-center gap-3">Reservation Details <div className="h-px flex-grow bg-slate-200"></div></h3>
                   <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-7">
                     <div className="flex justify-between text-sm font-semibold text-slate-700 gap-4 group">
                        <span>Vehicle Hire <span className="text-xs text-slate-500 ml-1">({days}d)</span></span>
                        <span className="text-slate-900 group-hover:text-blue-600 transition-colors">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span>
                     </div>
                     
                     {priceDetails.insuranceCost > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-slate-700 gap-4 group">
                            <span>Premium Shield</span>
                            <span className="text-slate-900 group-hover:text-emerald-600 transition-colors">{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span>
                        </div>
                     )}
                     
                     {selectedExtraIds.length > 0 && (
                         <div className="pt-4 mt-4 border-t border-slate-50 space-y-4 sm:space-y-6">
                             {car.extras?.filter(e => selectedExtraIds.includes(e.id)).map(extra => (
                                <div key={extra.id} className="flex justify-between text-sm font-semibold text-slate-700 gap-4 group">
                                     <span>{extra.name}</span>
                                     <span className="text-slate-900 group-hover:text-blue-600 transition-colors">{getCurrencySymbol()}{(extra.type === 'per_day' ? convertPrice(extra.price) * days : convertPrice(extra.price)).toFixed(2)}</span>
                                 </div>
                             ))}
                         </div>
                     )}

                     {priceDetails.discountAmount > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-emerald-700 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/50 gap-4">
                            <span>Applied Promo <span className="text-xs opacity-70 ml-2">({appliedPromo?.code})</span></span>
                            <span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span>
                        </div>
                     )}

                     {priceDetails.hogicarPromoAmount > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-indigo-700 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100/50 gap-4">
                            <span>Secret Deal Selection</span>
                            <span>-{getCurrencySymbol()}{convertPrice(priceDetails.hogicarPromoAmount).toFixed(2)}</span>
                        </div>
                     )}

                     <div className="flex justify-between text-sm font-semibold text-slate-600 pt-6 border-t border-slate-200"><span>Local Taxes</span><span className="text-emerald-700 flex items-center gap-2"><Check className="w-3.5 h-3.5"/> Included</span></div>
                   </div>

                   <div className="pt-6 sm:pt-7 border-t-2 border-dashed border-slate-200 mb-6 sm:mb-7">
                     <div className="flex justify-between items-end">
                        <div>
                            <span className="font-semibold text-slate-700 text-xs tracking-[0.12em] block mb-2 uppercase">Final Total</span>
                            <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> Protected Rate</span>
                        </div>
                        <span className="font-black text-slate-900 text-3xl sm:text-4xl tracking-tight leading-none">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span>
                     </div>
                   </div>

                   <div className="bg-[#eef2f8] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-300/70 space-y-3 sm:space-y-4 mb-6 sm:mb-7">
                       <div className="flex justify-between font-semibold text-slate-900 text-sm gap-4"><span>Pay online now</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span></div>
                       <div className="flex justify-between font-semibold text-slate-600 text-sm gap-4"><span>Pay at counter</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span></div>
                   </div>

                   <div className="rounded-2xl border border-slate-300/75 bg-[#eef2f8] p-4 sm:p-5 mb-6 sm:mb-7">
                     <p className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500 mb-3">What is included</p>
                     <div className="space-y-2 text-sm text-slate-700">
                       <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Supplier base rental charge</p>
                       <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Local taxes and mandatory fees</p>
                       <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Confirmation and booking support</p>
                     </div>
                   </div>

                   <button
                     type="submit" 
                     disabled={isSubmitting}
                     className="group relative w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 sm:py-6 rounded-xl sm:rounded-2xl shadow-2xl shadow-emerald-600/20 transition-all duration-500 active:scale-[0.98] flex items-center justify-center text-xs sm:text-sm uppercase tracking-[0.14em] sm:tracking-[0.3em] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <span className="relative z-10 flex items-center gap-4">
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Securely Processing...
                            </>
                        ) : (
                            <>Confirm & Secure Reservation <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500"/></>
                        )}
                     </span>
                   </button>
                   
                   <p className="text-center text-xs font-semibold text-slate-600 mt-6 sm:mt-8 flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600"/> Bank-level security (AES-256)</p>
                   
                   <div className="bg-[#e8eef8] border border-blue-200/70 rounded-xl sm:rounded-2xl p-4 sm:p-5 mt-6 sm:mt-10 flex gap-3 sm:gap-4 items-start">
                     <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 opacity-70" />
                     <p className="text-xs text-blue-900 leading-relaxed font-medium opacity-90">By confirming this booking, you agree to our <a href="#" className="underline hover:text-blue-950 transition-colors">Global Terms</a> and <a href="#" className="underline hover:text-blue-950 transition-colors">Privacy Policy</a>.</p>
                   </div>
                </div>

                {/* Secure Trust Badge */}
                <div className="bg-[#f3f6fb] rounded-2xl sm:rounded-[2rem] border border-slate-300/70 p-5 sm:p-6 shadow-lg shadow-slate-400/20 flex items-center gap-4 sm:gap-5">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#008009] shadow-inner">
                        {(!car?.supplier?.bookingMode || car?.supplier?.bookingMode === 'FREE_SALE') ? <Zap className="w-6 h-6 fill-[#008009]/20"/> : <Clock className="w-6 h-6 text-blue-600"/>}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">
                            {(!car?.supplier?.bookingMode || car?.supplier?.bookingMode === 'FREE_SALE') ? 'Instant Confirmation' : 'Reservation Request'}
                        </h4>
                        <p className="text-sm text-slate-600 leading-tight">
                            {(!car?.supplier?.bookingMode || car?.supplier?.bookingMode === 'FREE_SALE') ? 'Your car is secured immediately.' : 'Supplier will confirm your request shortly.'}
                        </p>
                    </div>
                </div>

                <div className="bg-[#f3f6fb] rounded-2xl sm:rounded-[2rem] border border-slate-300/70 p-5 sm:p-6 shadow-lg shadow-slate-400/20">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Headphones className="w-4 h-4 text-blue-600" /> Need help before you confirm?</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">Our booking specialists can help with payment, documentation, and supplier requirements before pickup time.</p>
                </div>
             </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

const BookingPage: React.FC = () => {
  const [dynamicStripePromise, setDynamicStripePromise] = React.useState<ReturnType<typeof loadStripe> | null>(
    stripePublishableKey ? loadStripe(stripePublishableKey) : null
  );
  const [stripeConfigLoading, setStripeConfigLoading] = React.useState(!stripePublishableKey);

  React.useEffect(() => {
    if (stripePublishableKey) {
      return;
    }
    let cancelled = false;
    const loadStripeConfig = async () => {
      try {
        const config = await api.fetchStripeConfig();
        const key = (config?.publishableKey || '').trim();
        if (!cancelled && key) {
          setDynamicStripePromise(loadStripe(key));
        }
      } catch (error) {
        console.error('Failed to fetch Stripe config from backend:', error);
      } finally {
        if (!cancelled) {
          setStripeConfigLoading(false);
        }
      }
    };
    loadStripeConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!dynamicStripePromise) {
    return <BookingPageContent stripeEnabled={false} stripeConfigLoading={stripeConfigLoading} stripeInstance={null} elementsInstance={null} />;
  }
  return (
    <Elements stripe={dynamicStripePromise}>
      <BookingPageWithStripe stripeConfigLoading={false} />
    </Elements>
  );
};

const BookingPageWithStripe: React.FC<{ stripeConfigLoading: boolean }> = ({ stripeConfigLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  return <BookingPageContent stripeEnabled={true} stripeConfigLoading={stripeConfigLoading} stripeInstance={stripe} elementsInstance={elements} />;
};

export default BookingPage;
