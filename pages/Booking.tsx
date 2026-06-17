
import * as React from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { ShieldCheck, User, CreditCard, Shield, Info, Mail, Phone, Plane, Clock, ArrowRight, Check, MapPin, CalendarDays, Headphones, BadgeCheck, Award, Zap, ArrowLeft, UserPlus } from 'lucide-react';
import { Car, PromoCode } from '../types';
import { DetailedRatingsTooltip } from '../components/DetailedRatingsTooltip';
import { getRatingDescription, getRatingColor, getRatingTextColor, getCarRatings } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { Logo } from '../components/Logo';
import { calcPricing, rentalDays } from '../utils/pricing';
import { api } from '../api';

const getPromoCode = (code: string): PromoCode | undefined => {
    return undefined; // Mock data removed
};

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const FormInput = ({ icon: Icon, ...props }: { icon: React.ElementType, [key: string]: any }) => (
  <div className="relative group/input">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 sm:pl-5">
      <Icon className="h-4 w-4 text-slate-500 group-focus-within/input:text-[#008009] transition-colors" />
    </div>
    <input
      {...props}
      className="block w-full rounded-xl border border-slate-200 bg-white pl-11 sm:pl-12 shadow-sm focus:border-[#008009] focus:ring-4 focus:ring-[#008009]/10 text-[15px] sm:text-base text-slate-900 font-medium py-3.5 transition-all placeholder:text-slate-400 placeholder:font-medium outline-none"
    />
  </div>
);

type BookingPageContentProps = {
  stripeEnabled: boolean;
  stripeConfigLoading: boolean;
  stripeInstance: ReturnType<typeof useStripe>;
  elementsInstance: ReturnType<typeof useElements>;
  currentKey: string | null;
  onStripeKeyChange: (key: string) => void;
  configMismatch: boolean;
  bookingDraft: any | null;
  setBookingDraft: React.Dispatch<React.SetStateAction<any | null>>;
  creationInProgressRef: React.MutableRefObject<boolean>;
};

const BookingPageContent: React.FC<BookingPageContentProps> = ({ 
  stripeEnabled, 
  stripeConfigLoading, 
  stripeInstance, 
  elementsInstance, 
  currentKey, 
  onStripeKeyChange, 
  configMismatch,
  bookingDraft,
  setBookingDraft,
  creationInProgressRef
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stripe = stripeInstance;
  const elements = elementsInstance;
  
  const routeStep: 'details' | 'payment' = location.pathname.endsWith('/payment') ? 'payment' : 'details';

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [routeStep]);

  const { car } = React.useMemo(() => {
    const carsFromState = location.state?.cars;
    let carsFromStorage: Car[] | null = null;
    try {
      const storedCarsRaw = sessionStorage.getItem('hogicar_cars');
      carsFromStorage = storedCarsRaw ? JSON.parse(storedCarsRaw) : null;
    } catch {
      sessionStorage.removeItem('hogicar_cars');
      carsFromStorage = null;
    }
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
    const foundCar = (selectedCarFromStorage && routeId && String(selectedCarFromStorage.id) === String(routeId))
      ? selectedCarFromStorage
      : (foundCarInList || selectedCarFromStorage);
    
    return { car: foundCar || null };
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
    if (configMismatch) {
        setPaymentError("Critical System Configuration Error: Stripe Secret Key and Publishable Key mismatch in the backend. Please check your environment variables.");
    }
  }, [configMismatch]);
  
  const [createAccount, setCreateAccount] = React.useState(true);
  const [accountPassword, setAccountPassword] = React.useState('');
  const [profileHydrated, setProfileHydrated] = React.useState(false);
  const [isAdvancingToPayment, setIsAdvancingToPayment] = React.useState(false);
  const bookingQuery = location.search || '';
  const paymentSubmitInFlightRef = React.useRef(false);

  React.useEffect(() => {
    if (initialPromoCode) {
      const promo = getPromoCode(initialPromoCode);
      if (promo && promo.status === 'active') {
        setAppliedPromo(promo);
      }
    }
  }, [initialPromoCode]);

  React.useEffect(() => {
    // No-op here, moved to parent
  }, []);

  React.useEffect(() => {
    const storedProfileRaw = sessionStorage.getItem("hogicar_customer_profile");
    if (!storedProfileRaw) {
      setProfileHydrated(true);
      return;
    }
    try {
      const profile = JSON.parse(storedProfileRaw);
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');
      setFlightNumber(profile.flightNumber || '');
      setCreateAccount(profile.createAccount !== false);
      setAccountPassword(profile.accountPassword || '');
    } catch {
      sessionStorage.removeItem("hogicar_customer_profile");
    } finally {
      setProfileHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (routeStep !== 'payment' || !profileHydrated) return;
    if (!firstName || !lastName || !email || !phoneNumber) {
      navigate(`/book/${id}/details${bookingQuery}`, { replace: true });
    }
  }, [routeStep, profileHydrated, firstName, lastName, email, phoneNumber, id, bookingQuery, navigate]);

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

  React.useEffect(() => {
    if (!showRatingsTooltip) return;
    const handleGlobalClick = () => setShowRatingsTooltip(false);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showRatingsTooltip]);

  React.useEffect(() => {
    if (routeStep === 'payment' && !bookingDraft && firstName && lastName && email && phoneNumber) {
        ensureBookingDraft().catch(err => {
            console.error("Auto-creation of booking draft failed:", err);
        });
    }
  }, [routeStep, firstName, lastName, email, phoneNumber]);

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
  const displayImage = imageError ? 'https://placehold.co/400x250/orange/white?text=Vehicle' : (car?.image || car?.imageUrl || 'https://placehold.co/400x250/orange/white?text=Vehicle');
  const supplierLogo = car?.supplier?.logo || car?.supplier?.logoUrl;
  const transmissionLabel = car?.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual';
  const fuelPolicyLabel = car?.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car?.fuelPolicy?.replace(/_/g, ' ') || 'Full to full';

  const buildBookingPayload = () => {
    if (!car) return null;
    // Strip "choice-" prefix from carId if present (from Hogi Car Choice duplication)
    const carId = Number(String(car.id).replace('choice-', ''));
    const supplierId = Number(String(car.supplierId ?? car.supplier?.id).replace('choice-', ''));
    
    if (!Number.isFinite(carId) || carId <= 0) {
      throw new Error('Invalid car id. Please go back to search and select the car again.');
    }
    if (!Number.isFinite(supplierId) || supplierId <= 0) {
      throw new Error('Invalid supplier id. Please go back to search and select the car again.');
    }
    return {
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
        firstName,
        lastName,
        email,
        phone: phoneNumber,
        finalPrice: priceDetails.finalTotal,
        payNow: priceDetails.payNow,
        payAtDesk: priceDetails.payAtDesk,
        flightNumber,
        hogicarChoice: car.hogicarChoice,
        isHogicarChoiceBranded: car.isHogicarChoiceBranded,
        selectedExtras: car.extras?.filter(e => selectedExtraIds.includes(e.id))
    };
  };

  const storeBookingAndGoToConfirmation = (booking: any) => {
    const bookingRef = (booking as any).bookingRef || booking.id;
    sessionStorage.setItem("allowConfirmationRef", bookingRef.toString());
    sessionStorage.setItem("hogicar_booking", JSON.stringify(booking));
    sessionStorage.setItem("hogicar_car", JSON.stringify(car));
    sessionStorage.removeItem("hogicar_pending_booking");
    navigate(`/confirmation?bookingRef=${bookingRef}`);
  };

  const handleCustomerDetailsContinue = async () => {
    if (!car || !firstName || !lastName || !email || !phoneNumber) {
      alert("Please fill in all required driver details.");
      return;
    }
    if (createAccount && accountPassword && accountPassword.length < 8) {
      alert("Please use at least 8 characters for the account password.");
      return;
    }

    if (!search.pickupCode || !search.dropoffCode) {
      alert("Pickup/Dropoff location code is missing. Please start your search again.");
      return;
    }
    setPaymentError(null);
    sessionStorage.setItem("hogicar_customer_profile", JSON.stringify({
      firstName,
      lastName,
      email,
      phoneNumber,
      flightNumber,
      createAccount,
      accountPassword
    }));
    setIsAdvancingToPayment(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Start pre-fetching the booking draft (with PaymentIntent) immediately
    ensureBookingDraft().catch(err => {
        console.warn("[Stripe] Pre-fetch draft failed:", err);
    });

    window.setTimeout(() => {
      navigate(`/book/${id}/payment${bookingQuery}`);
      setIsAdvancingToPayment(false);
    }, 500);
  };

  const ensureBookingDraft = async () => {
    // If we have a draft with a bookingRef, we already have a persistent booking in the DB.
    // If payNow > 0 but we don't have a clientSecret yet, we should allow the API call
    // to "createBooking" which our improved backend now handles by reusing the existing record.
    if (bookingDraft?.bookingRef && (priceDetails.payNow <= 0 || bookingDraft.clientSecret)) {
      if (bookingDraft.publishableKey && currentKey && bookingDraft.publishableKey !== currentKey) {
        console.warn(`[Stripe] Stale draft detected. Draft expects ${bookingDraft.publishableKey.substring(0, 10)}... but current is ${currentKey.substring(0, 10)}...`);
        sessionStorage.removeItem('hogicar_pending_booking');
        setBookingDraft(null);
        onStripeKeyChange(bookingDraft.publishableKey);
        throw new Error('STRIPE_ACCOUNT_MISMATCH');
      }
      return bookingDraft;
    }
    
    if (creationInProgressRef.current) {
        // Wait for existing creation to finish
        let attempts = 0;
        while (creationInProgressRef.current && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            // If it finished and we have a draft, return it
            const stored = sessionStorage.getItem("hogicar_pending_booking");
            if (stored) return JSON.parse(stored);
        }
    }

    creationInProgressRef.current = true;
    try {
        const payload = buildBookingPayload();
        if (!payload) {
          throw new Error('Booking details are not available. Please select the vehicle again.');
        }
        const booking = await api.createBooking(payload);
        
        if (booking.publishableKey && currentKey && booking.publishableKey !== currentKey) {
            console.warn(`[Stripe] Mismatch detected on booking creation. Booking expects ${booking.publishableKey.substring(0, 10)}... but current is ${currentKey.substring(0, 10)}...`);
            sessionStorage.setItem('hogicar_last_stripe_key', booking.publishableKey);
            sessionStorage.removeItem('hogicar_pending_booking');
            setBookingDraft(null);
            onStripeKeyChange(booking.publishableKey);
            throw new Error('STRIPE_ACCOUNT_MISMATCH');
        }

        setBookingDraft(booking);
        sessionStorage.setItem("hogicar_pending_booking", JSON.stringify(booking));
        return booking;
    } finally {
        creationInProgressRef.current = false;
    }
  };

  const handlePaymentSubmit = async () => {
    if (paymentSubmitInFlightRef.current) {
      return;
    }
    if (!firstName || !lastName || !email || !phoneNumber) {
      alert("Please complete the customer details page first.");
      navigate(`/book/${id}/details${bookingQuery}`);
      return;
    }
    paymentSubmitInFlightRef.current = true;
    setIsSubmitting(true);
    setPaymentError(null);
    try {
          const activeBooking = await ensureBookingDraft();
          if (priceDetails.payNow <= 0) {
            storeBookingAndGoToConfirmation(activeBooking);
            return;
          }
          if (!stripeEnabled || !stripe || !elements) {
            throw new Error('Stripe payment is not configured. Please contact support.');
          }
          if (!activeBooking?.clientSecret) {
            throw new Error('Payment session was not created. Please try again.');
          }

          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            throw new Error('Payment form is not ready. Please try again.');
          }

          const paymentResult = await stripe.confirmCardPayment(activeBooking.clientSecret, {
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
            console.error('[Stripe Error Detail]', paymentResult.error);
            const stripeError = paymentResult.error as any;
            const stripeErrorCode = stripeError.code || '';
            const paymentIntent = stripeError.payment_intent || stripeError.paymentIntent;
            const paymentIntentStatus = paymentIntent?.status || '';

            if (paymentIntent?.id && paymentIntentStatus === 'succeeded') {
              const completedBooking = await api.markBookingPaymentComplete(activeBooking.id, paymentIntent.id);
              storeBookingAndGoToConfirmation(completedBooking);
              return;
            }

            if (stripeErrorCode === 'payment_intent_unexpected_state') {
              if (paymentIntentStatus === 'processing' || paymentIntentStatus === 'requires_capture') {
                const waitMessage = 'Your payment is still being processed. Please wait a moment before trying again.';
                setPaymentError(waitMessage);
                alert(waitMessage);
                return;
              }

              const refreshedBooking = await api.refreshBookingPaymentIntent(activeBooking.id);
              if (refreshedBooking.publishableKey && currentKey && refreshedBooking.publishableKey !== currentKey) {
                sessionStorage.setItem('hogicar_last_stripe_key', refreshedBooking.publishableKey);
                sessionStorage.removeItem('hogicar_pending_booking');
                setBookingDraft(null);
                onStripeKeyChange(refreshedBooking.publishableKey);
                throw new Error('STRIPE_ACCOUNT_MISMATCH');
              }

              setBookingDraft(refreshedBooking);
              sessionStorage.setItem("hogicar_pending_booking", JSON.stringify(refreshedBooking));
              const refreshMessage = 'Your secure payment session was refreshed. Please click confirm again.';
              setPaymentError(refreshMessage);
              alert(refreshMessage);
              return;
            }

            const errorMsg = paymentResult.error.message || 'Payment confirmation failed.';
            if (errorMsg.includes('No such payment_intent')) {
                console.error('Stripe Account Mismatch detected. Clearing draft.');
                sessionStorage.removeItem('hogicar_pending_booking');
                setBookingDraft(null);
            }
            throw new Error(errorMsg);
          }

          const paymentIntent = paymentResult.paymentIntent;
          if (paymentIntent && paymentIntent.status === 'succeeded') {
              const completedBooking = await api.markBookingPaymentComplete(activeBooking.id, paymentIntent.id);
              storeBookingAndGoToConfirmation(completedBooking);
          } else {
              // This is the CRITICAL FIX for the reported "bypass" issue.
              // If we reach here, it means confirmCardPayment didn't return an error, 
              // but it also didn't result in a 'succeeded' payment.
              const status = paymentIntent?.status || 'incomplete';
              console.warn(`Payment did not succeed. Status: ${status}`, paymentResult);
              throw new Error(`Payment was not successful (Status: ${status}). Please check your card details and try again.`);
          }
    } catch (error: any) {
        console.error("Payment submission error:", error);
        
        if (error.message === 'STRIPE_ACCOUNT_MISMATCH') {
            console.log('Stripe account mismatch handled. Component will remount.');
            setPaymentError('Adjusting secure payment settings. Please try clicking confirm again in a moment.');
            return;
        }

        const serverMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data;
        const message = (typeof serverMessage === 'string' && serverMessage) || error.message || 'An unknown error occurred.';
        
        if (message.includes('No such payment_intent')) {
            console.warn('Stale payment intent detected in catch. Clearing draft...');
            sessionStorage.removeItem('hogicar_pending_booking');
            setBookingDraft(null);
            setPaymentError('Your payment session has expired or the payment gateway has been updated. Please try again.');
            alert('Your payment session has expired or the gateway has been updated. Please try confirming your booking again.');
        } else {
            setPaymentError(message);
            alert(`Payment failed: ${message}`);
        }
    } finally {
        paymentSubmitInFlightRef.current = false;
        setIsSubmitting(false);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (routeStep === 'details') {
      await handleCustomerDetailsContinue();
    } else {
      await handlePaymentSubmit();
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

  const detailsRoute = `/book/${id}/details${bookingQuery}`;
  const pageTitle = routeStep === 'details' ? 'Customer details' : 'Secure payment';
  const pageDescription = routeStep === 'details'
    ? 'Add the main driver information first. The secure payment page opens after these details are saved.'
    : 'Review the rental and customer details, then complete the secure payment to confirm the booking.';
  const primaryButtonLabel = routeStep === 'details'
    ? 'Continue to Payment'
    : priceDetails.payNow > 0 ? 'Pay & Confirm Reservation' : 'Confirm Reservation';
  const isActionBusy = isSubmitting || isAdvancingToPayment;

  return (
    <>
    <SEOMetadata
        title={`Book ${car.make} ${car.model} | Hogicar`}
        description="Complete your booking and payment details to reserve your car."
        noIndex={true}
      />
    <div className="bg-slate-50 min-h-screen py-2 sm:py-3 font-sans overflow-x-hidden text-slate-800 selection:bg-emerald-100">
      {isAdvancingToPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-500 animate-in fade-in">
           <div className="w-full max-w-[320px] sm:max-w-md px-6">
              <div className="mb-6 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#008009]">Securing session</p>
                    <p className="mt-1 text-sm font-black text-slate-900">Moving to Payment</p>
                 </div>
                 <div className="h-5 w-5 border-2 border-[#008009] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                 <div className="h-full bg-gradient-to-r from-[#008009] to-emerald-400 animate-progress shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>
              <p className="mt-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Hogicar Secure Checkout Gateway</p>
           </div>
        </div>
      )}
        <div className="max-w-[1400px] mx-auto px-1 sm:px-3 lg:px-6">
        <div className="mb-2 sm:mb-4">
            <BookingStepper currentStep={4} />
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_15px_45px_-35px_rgba(15,23,42,0.6)]">
          <div className="h-1.5 bg-slate-100">
            <div className={`h-full rounded-r-full bg-[#008009] transition-all duration-700 ${routeStep === 'details' ? 'w-1/2' : 'w-full'}`}></div>
          </div>
          <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#008009]">Checkout</p>
              <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-950">{pageTitle}</h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-slate-600">{pageDescription}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 sm:min-w-[320px]">
              <div className={`rounded-lg px-2 py-2 text-center ${routeStep === 'details' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.18em]">Step 1</p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-black">Driver details</p>
              </div>
              <div className={`rounded-lg px-2 py-2 text-center ${routeStep === 'payment' ? 'bg-[#008009] text-white shadow-sm' : 'text-slate-500'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.18em]">Step 2</p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-black">Payment</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
              <ShieldCheck className="h-4 w-4 text-[#008009]" />
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">Secure checkout</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
              <BadgeCheck className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">Verified supplier</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
              <Headphones className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">Booking support</span>
            </div>
          </div>
          </div>
        </div>

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 xl:gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Vehicle Summary Header */}
            <div className="bg-white rounded-2xl shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row items-center gap-5 sm:gap-6 relative overflow-visible group">
               <div className="bg-gradient-to-b from-slate-50 to-white p-6 sm:p-7 rounded-2xl border border-slate-200 flex-shrink-0 relative overflow-hidden w-full md:w-auto flex justify-center">
                   <img 
                    src={displayImage} 
                    alt={car.model} 
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    className="w-36 sm:w-44 h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.1)] transform group-hover:scale-105 transition-transform duration-700"
                   />
               </div>
               <div className="flex-grow text-center md:text-left relative z-10">
                  <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                      <span className="bg-slate-950 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg border border-white/10">
                        {car.category?.toLowerCase() === 'people_carrier' ? 'People Carrier' : car.category?.charAt(0).toUpperCase() + car.category?.slice(1).toLowerCase()}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-emerald-100">Ready for Pick-up</span>
                  </div>
                  <h1 className="text-[1.35rem] sm:text-3xl font-black text-slate-950 leading-tight tracking-tight mb-3">{car.displayName || `${car.make} ${car.model}`}</h1>
                  <p className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.14em] sm:tracking-[0.22em] flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap">
                    {transmissionLabel} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {fuelPolicyLabel} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {car.location || 'Airport'}
                  </p>
                  
                  {!car.isHogicarChoiceBranded || car.supplier.name !== 'Hogi Car Choice' ? (
                    <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200/70">
                        <div className="bg-white border border-slate-200 p-2.5 sm:p-3 rounded-xl shadow-sm">
                          {supplierLogo === 'HOGICAR_CHOICE_LOGO' || car.supplier.name === 'Hogi Car Choice' ? (
                            <Logo className="h-10 sm:h-12 w-auto max-w-[140px]" />
                          ) : supplierLogo ? (
                            <img src={supplierLogo} alt={car.supplier.name} className="h-12 sm:h-16 w-auto object-contain" />
                          ) : (
                            <div className="h-12 sm:h-16 w-24 bg-slate-50 flex items-center justify-center rounded-lg border border-dashed border-slate-200">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{car.supplier.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div>
                            <p className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.18em] sm:tracking-[0.2em] leading-none mb-2">Service Provider</p>
                            <p className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-[0.12em] sm:tracking-[0.15em]">{car.supplier.name}</p>
                          </div>
                          <div
                            className="flex items-center gap-3 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-sm border border-slate-200 ml-1 group/rating relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowRatingsTooltip(!showRatingsTooltip);
                            }}
                          >
                             <div className={`relative ${getRatingColor(car.supplier.rating)} text-white w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl shadow-lg shadow-slate-200 overflow-hidden shrink-0 ring-2 ring-white transition-transform group-hover/rating:scale-110`}>
                                 <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                                 <span className="relative z-10 text-[11px] sm:text-base font-black tracking-tight">{car.supplier.rating}</span>
                             </div>
                             <div className="flex flex-col">
                                 <div className="flex items-center gap-1.5 mb-0.5">
                                     <span className={`text-xs font-black leading-none ${getRatingTextColor(car.supplier.rating)} tracking-tight`}>{getRatingDescription(car.supplier.rating)}</span>
                                     <Info className="w-3 h-3 text-slate-300 group-hover/rating:text-slate-500 transition-colors" />
                                 </div>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.12em] flex items-center gap-1">
                                   <BadgeCheck className="w-2.5 h-2.5 text-[#008009]" />
                                   Verified
                                 </span>
                             </div>
                             <DetailedRatingsTooltip
                               ratings={getCarRatings(car)}
                               visible={showRatingsTooltip}
                                align="left"
                                className="max-sm:fixed max-sm:inset-x-4 max-sm:bottom-24 max-sm:w-auto max-sm:mb-0 max-sm:translate-x-0"
                             />
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500 mb-2">Pick-up</p>
                <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-start gap-2"><MapPin className="w-4 h-4 text-[#008009] mt-0.5" /> <span>{pickupLabel}</span></p>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> {startDate} · {startTime}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500 mb-2">Drop-off</p>
                <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-start gap-2"><MapPin className="w-4 h-4 text-[#008009] mt-0.5" /> <span>{dropoffLabel}</span></p>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> {endDate} · {endTime}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500 mb-2">Booking benefits</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600" /> Confirmed supplier inventory</li>
                  <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#008009]" /> PCI-compliant secure checkout</li>
                  <li className="flex items-center gap-2"><Headphones className="w-4 h-4 text-indigo-600" /> Live support before pick-up</li>
                </ul>
              </div>
            </div>

            {routeStep === 'details' ? (
            <>
            {/* Customer Details */}
            <div className="bg-white rounded-2xl shadow-[0_18px_45px_-34px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-7">
               <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                 <div>
                   <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#008009]">Main driver profile</p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-3"><User className="w-5 h-5 text-[#008009]"/> Driver information</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600 leading-relaxed">Please ensure the details below match the driver's official documents to ensure a smooth pick-up experience at the desk.</p>
                </div>
                 <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800 flex items-center gap-2"><Check className="w-3 h-3"/> Required for booking</p>
                  <p className="mt-1 text-sm font-black text-slate-950">Name, email & mobile</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="group"><label className="block text-[13px] font-bold text-slate-600 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors uppercase tracking-wide">First name</label><FormInput icon={User} type="text" placeholder="e.g. JOHN" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value.toUpperCase())} required /></div>
                    <div className="group"><label className="block text-[13px] font-bold text-slate-600 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors uppercase tracking-wide">Last name</label><FormInput icon={User} type="text" placeholder="e.g. DOE" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value.toUpperCase())} required /></div>
                    <div className="group"><label className="block text-[13px] font-bold text-slate-600 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors uppercase tracking-wide">Email address</label><FormInput icon={Mail} type="email" placeholder="john.doe@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value.toUpperCase())} required /></div>
                    <div className="group"><label className="block text-[13px] font-bold text-slate-600 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors uppercase tracking-wide">Mobile number</label><FormInput icon={Phone} type="tel" placeholder="+1..." value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} required /></div>
                    <div className="md:col-span-2 group pt-2">
                      <label className="block text-[13px] font-bold text-slate-600 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors uppercase tracking-wide">Flight number <span className="text-[10px] text-slate-400 ml-2">(Highly Recommended)</span></label>
                      <FormInput icon={Plane} type="text" placeholder="e.g. BA123" value={flightNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlightNumber(e.target.value.toUpperCase())} /> 
                      <p className="text-sm text-slate-500 mt-4 font-medium flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100"><Info className="w-5 h-5 text-[#008009] mt-0.5 flex-shrink-0"/> <span>Providing your flight number helps the rental provider monitor your arrival and hold your vehicle in case of delays.</span></p>
                    </div>
                 </div>
                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                   <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Checklist for pick-up</p>
                   <div className="space-y-4 text-sm font-bold text-slate-700">
                     <p className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><Check className="h-4 w-4 text-[#008009]" /> Valid driving license</p>
                     <p className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><Check className="h-4 w-4 text-[#008009]" /> Passport or ID</p>
                     <p className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><Check className="h-4 w-4 text-[#008009]" /> Driver's credit card</p>
                   </div>
                   <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                     <p className="text-[11px] font-bold leading-relaxed text-blue-700">These details will be used for your rental agreement and secure payment record.</p>
                   </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_18px_45px_-34px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-7">
               <h2 className="text-lg sm:text-xl font-black text-slate-950 mb-2 flex items-center gap-3"><UserPlus className="w-5 h-5 text-[#008009]"/> Create customer account</h2>
               <p className="text-sm text-slate-600 mb-5 sm:mb-6">Your account keeps booking references, payment status, and future rental details in one place.</p>
               <label className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 mb-5 cursor-pointer transition hover:border-emerald-200 hover:bg-emerald-50">
                  <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#008009] focus:ring-[#008009]" />
                  <span>
                    <span className="block text-sm font-black text-slate-900">Register my customer account with this booking</span>
                    <span className="block text-sm text-slate-600 mt-1">We will save your profile details for faster support and future reservations.</span>
                  </span>
               </label>
               {createAccount && (
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors">Create account password</label>
                    <FormInput icon={ShieldCheck} type="password" placeholder="Minimum 8 characters" value={accountPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountPassword(e.target.value)} />
                    <p className="text-sm text-slate-600 mt-3 font-medium flex items-center gap-2"><Info className="w-4 h-4 text-[#008009]"/> If you skip this now, you can still access the booking by email and reference number.</p>
                  </div>
               )}
            </div>
            </>
            ) : (
            <>
            {/* Rental & Driver Summary */}
            <div className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(15,23,42,0.15)] overflow-hidden border border-slate-200">
               <div className="bg-gradient-to-r from-[#008009] to-emerald-600 px-6 py-5 flex items-center justify-between">
                  <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3"><Zap className="w-5 h-5 fill-white"/> Reservation Summary</h2>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter border border-white/30">Review your details</div>
               </div>
               
               <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                     {/* Rental Section */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                           <div className="bg-emerald-50 p-2 rounded-lg"><CalendarDays className="w-5 h-5 text-[#008009]"/></div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Rental Details</p>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                           <div className="relative pl-6 border-l-2 border-emerald-500">
                              <p className="text-[10px] font-black text-[#008009] uppercase tracking-widest mb-1">Pick-up Location & Time</p>
                              <p className="text-slate-900 font-bold text-base leading-snug">{pickupLabel}</p>
                              <p className="text-slate-500 text-sm mt-1 font-medium">{startDate} @ {startTime}</p>
                           </div>
                           <div className="relative pl-6 border-l-2 border-slate-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drop-off Location & Time</p>
                              <p className="text-slate-900 font-bold text-base leading-snug">{dropoffLabel}</p>
                              <p className="text-slate-500 text-sm mt-1 font-medium">{endDate} @ {endTime}</p>
                           </div>
                           <div className="relative pl-6 border-l-2 border-slate-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Selection</p>
                              <p className="text-slate-900 font-bold text-base leading-snug">{car.displayName || `${car.make} ${car.model}`}</p>
                              <p className="text-slate-500 text-sm mt-1 uppercase tracking-tighter font-medium">{car.category} · {days} Days Rental</p>
                           </div>
                        </div>
                     </div>

                     {/* Driver Section */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                           <div className="bg-blue-50 p-2 rounded-lg"><User className="w-5 h-5 text-blue-600"/></div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Driver Details</p>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Main Driver</p>
                              <p className="text-slate-900 font-bold text-lg">{firstName} {lastName}</p>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Email</p>
                                 <p className="text-slate-900 font-bold text-sm truncate">{email}</p>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                                 <p className="text-slate-900 font-bold text-sm">{phoneNumber}</p>
                              </div>
                           </div>
                           {flightNumber && (
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Flight Number</p>
                                 <p className="text-slate-900 font-bold text-sm">{flightNumber}</p>
                              </div>
                           )}
                        </div>
                        <button type="button" onClick={() => navigate(`/book/${id}/details${bookingQuery}`)} className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-[#008009] hover:border-[#008009]/30 transition-all">
                           <ArrowLeft className="w-4 h-4" /> Edit Information
                        </button>
                     </div>
                  </div>
               </div>

               {/* Pricing Summary Bar */}
               <div className="bg-emerald-50/50 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                     <p className="text-[10px] font-black text-[#008009] uppercase tracking-[0.2em] mb-1">Total Amount Due Online</p>
                     <p className="text-2xl font-black text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Complete Protection</p>
                     <p className="text-xs font-bold text-slate-500">Total Rental Value: {getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</p>
                  </div>
               </div>
            </div>
            </>
            )}

            {/* Payment Details */}
            {routeStep === 'payment' && (
            <div className="bg-white rounded-2xl shadow-[0_18px_45px_-34px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-7">
               <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                 <div>
                   <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#008009]">Protected checkout</p>
                   <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-3"><CreditCard className="w-5 h-5 text-[#008009]"/> Secure payment details</h2>
                   <p className="mt-2 max-w-2xl text-sm text-slate-600">Your payment is processed through an encrypted gateway. The supplier receives the reservation only after the secure confirmation step.</p>
                 </div>
                 <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Due now</p>
                   <p className="mt-1 text-xl font-black text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</p>
                 </div>
               </div>
               <div className="space-y-6">
                  <div className="group"><label className="block text-sm font-semibold text-slate-700 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors">Cardholder name</label><FormInput icon={User} type="text" placeholder="As shown on card" value={cardholderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardholderName(e.target.value.toUpperCase())} required={priceDetails.payNow > 0} /></div>
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1 group-focus-within:text-[#008009] transition-colors">Card information</label>
                    {stripeEnabled ? (
                      <div className="rounded-xl border border-slate-200 px-4 sm:px-6 py-4 shadow-sm focus-within:ring-4 focus-within:ring-[#008009]/10 focus-within:border-[#008009] bg-white transition-all">
                        <CardElement options={{ 
                            hidePostalCode: false,
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
                  <p className="mt-3 text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Your payment is processed securely via Stripe. We support Credit Cards, Apple Pay, and Google Pay.
                  </p>
                  {paymentError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 px-6 py-5 text-sm font-semibold text-red-700 flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      {paymentError}
                    </div>
                  )}
                  
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-2">
                    <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">Payment Assurance</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
                      <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> TLS encrypted checkout</p>
                      <p className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#008009]" /> Instant booking reference</p>
                      <p className="flex items-center gap-2"><Headphones className="w-4 h-4 text-indigo-600" /> Dedicated support team</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
                     <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 sm:px-6 py-4 sm:py-5">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Check-in Time</p>
                        <p className="text-lg font-semibold text-slate-900">{startTime}</p>
                     </div>
                     <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 sm:px-6 py-4 sm:py-5">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Check-out Time</p>
                        <p className="text-lg font-semibold text-slate-900">{endTime}</p>
                     </div>
                  </div>
               </div>
            </div>
            )}
          </div>

          {/* Sidebar / Booking Summary */}
          <div className="lg:col-span-1">
             <div className="sticky top-6 sm:top-10 space-y-5 sm:space-y-6">
                <div className="bg-white rounded-2xl shadow-[0_22px_55px_-34px_rgba(15,23,42,0.65)] border border-slate-200 p-5 sm:p-6 transition-all duration-500">
                  <div className="mb-5 p-4 rounded-2xl bg-slate-950 text-white flex items-center justify-between shadow-xl shadow-slate-900/20 relative overflow-hidden group/timer gap-4">
                      <div className="absolute inset-0 bg-[#008009] opacity-0 group-hover/timer:opacity-10 transition-opacity"></div>
                      <div>
                          <p className="text-xs font-black text-slate-200 uppercase tracking-[0.25em] mb-1">Session expires</p>
                          <p className="text-sm font-black text-emerald-300 uppercase tracking-[0.15em] flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Complete now</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tighter drop-shadow-lg">{formatTime(timeLeft)}</p>
                  </div>

                   <h3 className="text-base font-black text-slate-950 mb-5 flex items-center gap-3">Reservation details <div className="h-px flex-grow bg-slate-200"></div></h3>
                   <div className="space-y-3 mb-5">
                     <div className="flex justify-between text-sm font-semibold text-slate-700 gap-4 group">
                        <span>Vehicle Hire <span className="text-xs text-slate-500 ml-1">({days}d)</span></span>
                        <span className="text-slate-900 group-hover:text-[#008009] transition-colors">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span>
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

                   <div className="pt-5 border-t-2 border-dashed border-slate-200 mb-5">
                     <div className="flex justify-between items-end">
                        <div>
                            <span className="font-semibold text-slate-700 text-xs tracking-[0.12em] block mb-2 uppercase">Final Total</span>
                            <span className="text-xs font-semibold text-[#008009] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> Protected rate</span>
                        </div>
                        <span className="font-black text-slate-900 text-3xl sm:text-4xl tracking-tight leading-none">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span>
                     </div>
                   </div>

                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-5">
                       <div className="flex justify-between font-semibold text-slate-900 text-sm gap-4"><span>Pay online now</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span></div>
                       <div className="flex justify-between font-semibold text-slate-600 text-sm gap-4"><span>Pay at counter</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span></div>
                   </div>

                   <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 mb-5">
                     <p className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500 mb-3">What is included</p>
                     <div className="space-y-2 text-sm text-slate-700">
                       <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Supplier base rental charge</p>
                       <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Local taxes and mandatory fees</p>
                       <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Confirmation and booking support</p>
                     </div>
                   </div>

                   {routeStep === 'payment' && bookingDraft && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 mb-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800 mb-2">Payment reservation active</p>
                      <p className="text-sm text-amber-900 leading-relaxed">Reference <strong>{bookingDraft.bookingRef || bookingDraft.id}</strong> is waiting for payment. If payment is not completed within 30 minutes, we will email the customer a professional reminder.</p>
                    </div>
                   )}

                   <button
                     type="submit" 
                     disabled={isActionBusy}
                     className="group relative w-full bg-[#008009] hover:bg-[#006607] text-white font-black py-4 rounded-xl shadow-2xl shadow-emerald-600/20 transition-all duration-500 active:scale-[0.98] flex items-center justify-center text-xs sm:text-sm uppercase tracking-[0.14em] sm:tracking-[0.22em] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-[#008009] to-[#006607] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <span className="relative z-10 flex items-center gap-4">
                        {isActionBusy ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {routeStep === 'details' ? 'Preparing secure payment...' : 'Securely Processing...'}
                            </>
                        ) : (
                            <>{primaryButtonLabel} <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500"/></>
                        )}
                     </span>
                   </button>
                   
                   <p className="text-center text-xs font-semibold text-slate-600 mt-6 sm:mt-8 flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600"/> Bank-level security (AES-256)</p>
                   
                   <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-5 flex gap-3 items-start">
                     <Info className="w-4 h-4 text-[#008009] flex-shrink-0 mt-0.5 opacity-80" />
                     <p className="text-xs text-emerald-900 leading-relaxed font-medium opacity-90">By confirming this booking, you agree to our Global Terms and Privacy Policy.</p>
                   </div>
                </div>

                {/* Secure Trust Badge */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 sm:gap-5">
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

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Headphones className="w-4 h-4 text-[#008009]" /> Need help before you confirm?</h4>
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

const BookingPageWithStripe: React.FC<{ 
  stripeConfigLoading: boolean; 
  currentKey: string | null; 
  onStripeKeyChange: (key: string) => void; 
  configMismatch: boolean;
  bookingDraft: any | null;
  setBookingDraft: React.Dispatch<React.SetStateAction<any | null>>;
  creationInProgressRef: React.MutableRefObject<boolean>;
}> = ({ stripeConfigLoading, currentKey, onStripeKeyChange, configMismatch, bookingDraft, setBookingDraft, creationInProgressRef }) => {
  const stripe = useStripe();
  const elements = useElements();
  return <BookingPageContent 
    stripeEnabled={true} 
    stripeConfigLoading={stripeConfigLoading} 
    stripeInstance={stripe} 
    elementsInstance={elements} 
    currentKey={currentKey} 
    onStripeKeyChange={onStripeKeyChange} 
    configMismatch={configMismatch}
    bookingDraft={bookingDraft}
    setBookingDraft={setBookingDraft}
    creationInProgressRef={creationInProgressRef}
  />;
};

const BookingPage: React.FC = () => {
  const [dynamicStripePromise, setDynamicStripePromise] = React.useState<ReturnType<typeof loadStripe> | null>(
    null
  );
  const [stripeConfigLoading, setStripeConfigLoading] = React.useState(true);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);
  const [configMismatch, setConfigMismatch] = React.useState(false);
  const [bookingDraft, setBookingDraft] = React.useState<any | null>(null);
  const creationInProgressRef = React.useRef(false);

  React.useEffect(() => {
    const storedBookingRaw = sessionStorage.getItem("hogicar_pending_booking");
    if (storedBookingRaw) {
      try {
        setBookingDraft(JSON.parse(storedBookingRaw));
      } catch {
        sessionStorage.removeItem("hogicar_pending_booking");
      }
    }
  }, []);

  React.useEffect(() => {
    if (currentKey) {
      console.log(`[Stripe] Initializing loadStripe with key: ${currentKey.substring(0, 10)}...`);
      setDynamicStripePromise(loadStripe(currentKey));
    } else {
      setDynamicStripePromise(null);
    }
  }, [currentKey]);

  React.useEffect(() => {
    let cancelled = false;
    const loadStripeConfig = async () => {
      try {
        const config = await api.fetchStripeConfig();
        const key = (config?.publishableKey || stripePublishableKey || '').trim();
        const mode = (config as any)?.mode || (key.startsWith('pk_test') ? 'test' : (key.startsWith('pk_live') ? 'live' : 'unknown'));
        const mismatch = (config as any)?.mismatch === 'true';
        
        console.log(`[Stripe] Configuration fetched. Mode: ${mode.toUpperCase()}${mismatch ? ' (MISMATCH DETECTED!)' : ''}`);
        
        if (mismatch) {
          setConfigMismatch(true);
        }
        
        const lastKey = sessionStorage.getItem('hogicar_last_stripe_key');
        if (lastKey && lastKey !== key) {
          console.warn(`[Stripe] Account changed from ${lastKey.substring(0, 10)}... to ${key.substring(0, 10)}... Clearing stale session.`);
          sessionStorage.removeItem('hogicar_pending_booking');
          setBookingDraft(null);
        } else if (!lastKey && key) {
            // First time seeing a key, also clear any untracked drafts to be safe
            sessionStorage.removeItem('hogicar_pending_booking');
            setBookingDraft(null);
        }
        
        sessionStorage.setItem('hogicar_last_stripe_key', key);

        if (!cancelled) {
          if (key) {
            setCurrentKey(key);
          } else {
            console.warn('[Stripe] No publishable key found');
            setCurrentKey('');
          }
        }
      } catch (error) {
        console.error('Failed to fetch Stripe config from backend:', error);
        if (!cancelled) {
          const fallbackKey = stripePublishableKey.trim();
          if (fallbackKey) {
            setCurrentKey(fallbackKey);
          } else {
            setCurrentKey('');
          }
        }
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

  if (stripeConfigLoading) {
    return <BookingPageContent key="loading" stripeEnabled={false} stripeConfigLoading={true} stripeInstance={null} elementsInstance={null} currentKey={null} onStripeKeyChange={() => {}} configMismatch={false} bookingDraft={null} setBookingDraft={() => {}} />;
  }

  if (!dynamicStripePromise || !currentKey) {
    return <BookingPageContent key={currentKey || 'disabled'} stripeEnabled={false} stripeConfigLoading={false} stripeInstance={null} elementsInstance={null} currentKey={currentKey} onStripeKeyChange={setCurrentKey} configMismatch={configMismatch} bookingDraft={null} setBookingDraft={() => {}} />;
  }

  const elementsOptions = bookingDraft?.clientSecret ? {
    clientSecret: bookingDraft.clientSecret,
    appearance: {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#008009',
        },
    },
  } : undefined;

  return (
    <Elements stripe={dynamicStripePromise} key={currentKey + (bookingDraft?.clientSecret || '')} options={elementsOptions}>
      <BookingPageWithStripe 
        stripeConfigLoading={false} 
        currentKey={currentKey} 
        onStripeKeyChange={setCurrentKey} 
        configMismatch={configMismatch} 
        bookingDraft={bookingDraft} 
        setBookingDraft={setBookingDraft} 
        creationInProgressRef={creationInProgressRef}
      />
    </Elements>
  );
};

export default BookingPage;
