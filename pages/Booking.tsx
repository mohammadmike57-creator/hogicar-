
import * as React from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { getPromoCode } from '../services/mockData';
import { ShieldCheck, User, CreditCard, Shield, Info, Mail, Phone, Plane, Clock } from 'lucide-react';
import { Car, PromoCode } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { calcPricing, rentalDays } from '../utils/pricing';
import { api } from '../api';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const FormInput = ({ icon: Icon, ...props }: { icon: React.ElementType, [key: string]: any }) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Icon className="h-4 w-4 text-gray-400" />
    </div>
    <input
      {...props}
      className="block w-full rounded border-gray-300 pl-9 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2"
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
  
  const priceDetails = React.useMemo(() => {
    if (!car) {
        return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    }
    return calcPricing(car, { pickupDate: startDate, dropoffDate: endDate }, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, startDate, endDate, selectedExtraIds, insuranceOption, appliedPromo]);
  
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
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
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
    <div className="bg-slate-50 min-h-screen py-6">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <BookingStepper currentStep={4} />

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-5">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <img src={car.image} alt={car.model} className="w-32 h-auto object-contain drop-shadow-md" />
               </div>
               <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{car.displayName || `${car.make} ${car.model}`}</h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">{car.category} &bull; {car.transmission}</p>
                  <div className="flex items-center gap-2 mt-3">
                      <img src={car.supplier.logo} alt={car.supplier.name} className="h-6 object-contain" />
                      <p className="text-xs font-bold text-slate-600">Provided by {car.supplier.name}</p>
                  </div>
               </div>
            </div>
            
            {/* Driver Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
               <h2 className="text-lg font-extrabold text-slate-900 mb-5 flex items-center gap-2"><User className="w-5 h-5 text-blue-600"/> Driver Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">First Name</label><FormInput icon={User} type="text" placeholder="John" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} required /></div>
                  <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Last Name</label><FormInput icon={User} type="text" placeholder="Doe" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} required /></div>
                  <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Email Address</label><FormInput icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required /></div>
                  <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label><FormInput icon={Phone} type="tel" placeholder="+1 (555) 123-4567" value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} required /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Flight Number (Optional)</label><FormInput icon={Plane} type="text" placeholder="e.g. AA123" value={flightNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlightNumber(e.target.value)} /> <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Helps the supplier track delays.</p></div>
               </div>
            </div>


            {/* Payment Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
               <h2 className="text-lg font-extrabold text-slate-900 mb-5 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600"/> Payment Details</h2>
               <div className="space-y-5">
                  <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Cardholder Name</label><FormInput icon={User} type="text" placeholder="John M Doe" value={cardholderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardholderName(e.target.value)} required={priceDetails.payNow > 0} /></div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Card Details</label>
                    {stripeEnabled ? (
                      <div className="rounded border border-gray-300 px-3 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <CardElement options={{ hidePostalCode: true }} />
                      </div>
                    ) : stripeConfigLoading ? (
                      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                        Loading secure payment form...
                      </div>
                    ) : (
                      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                        Stripe payment is currently unavailable.
                      </div>
                    )}
                  </div>
                  {paymentError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      {paymentError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                     <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Pickup Time</p>
                        <p className="text-sm font-bold text-slate-900">{startTime}</p>
                     </div>
                     <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Dropoff Time</p>
                        <p className="text-sm font-bold text-slate-900">{endTime}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar / Booking Summary */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sticky top-28">
               <div className="mb-6 p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-between">
                   <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><Clock className="w-4 h-4"/>Your car is held for:</p>
                   <p className="text-xl font-mono font-extrabold text-blue-800 tracking-tight">{formatTime(timeLeft)}</p>
               </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-6">Price Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-slate-600"><span>Car Hire ({days} days)</span><span className="font-bold text-slate-900">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span></div>
                  {priceDetails.insuranceCost > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Full Protection</span><span className="font-bold text-slate-900">{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span></div>}
                  
                  {selectedExtraIds.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                          {car.extras?.filter(e => selectedExtraIds.includes(e.id)).map(extra => (
                              <div key={extra.id} className="flex justify-between text-sm text-slate-600">
                                  <span>{extra.name}</span>
                                  <span className="font-bold text-slate-900">{getCurrencySymbol()}{(extra.type === 'per_day' ? convertPrice(extra.price) * days : convertPrice(extra.price)).toFixed(2)}</span>
                              </div>
                          ))}
                      </div>
                  )}

                  {priceDetails.discountAmount > 0 && <div className="flex justify-between text-sm text-[#16a34a] font-bold"><span>Discount ({appliedPromo?.code})</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span></div>}

                  <div className="flex justify-between text-sm text-slate-600 pt-3 border-t border-slate-100"><span>Taxes & Fees</span><span className="text-[#16a34a] font-bold">Included</span></div>
                </div>
                <div className="border-t-2 border-dashed border-slate-200 pt-6 my-6">
                  <div className="flex justify-between items-end"><span className="font-extrabold text-slate-900 text-lg">Total</span><span className="font-extrabold text-slate-900 text-3xl tracking-tight">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span></div>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-3 mb-6">
                   <div className="flex justify-between font-extrabold text-blue-700"><span>Pay now</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span></div>
                   <div className="flex justify-between font-medium text-slate-600"><span>Pay at rental desk</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span></div>
               </div>
                <button
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#16a34a] hover:bg-green-700 text-white font-extrabold py-4 px-4 rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center justify-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : `Confirm & Pay ${getCurrencySymbol()}${convertPrice(priceDetails.payNow).toFixed(2)}`}
                </button>
                <p className="text-center text-xs font-bold text-slate-500 mt-4 flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500"/> Secure payment processing by Stripe</p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-6 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">By booking you agree to the <a href="#" className="underline font-bold hover:text-blue-900">Terms of Service</a> and <a href="#" className="underline font-bold hover:text-blue-900">Privacy Policy</a>.</p>
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
