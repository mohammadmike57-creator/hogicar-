
import * as React from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import User from 'lucide-react/dist/esm/icons/user';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Info from 'lucide-react/dist/esm/icons/info';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Check from 'lucide-react/dist/esm/icons/check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import Award from 'lucide-react/dist/esm/icons/award';
import Zap from 'lucide-react/dist/esm/icons/zap';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { Car, PromoCode } from '../types';

// A custom icon component for Automatic Transmission to match the design
const AutomaticIcon = ({ className = "w-4 h-4 text-slate-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v2.34"/><path d="M12 10.32v1.34"/><path d="M7.11 4.41 8 6.1"/><path d="M16 6.1l.89-1.69"/><path d="M4.41 16.89l1.69-.89"/><path d="M17.9 16l1.69.89"/><path d="M2 12h2.34"/><path d="M19.66 12H22"/><path d="M12 14.66V16"/><path d="M12 22v-2.34"/><path d="m15 12-3-3-3 3"/><path d="M12 9v13"/>
  </svg>
);
import { DetailedRatingsTooltip } from '../components/DetailedRatingsTooltip';
import { getRatingDescription, getRatingColor, getRatingTextColor, getCarRatings, normalizeRatingScore } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { Logo } from '../components/Logo';
import { calcPricing, rentalDays } from '../utils/pricing';
import { countSelected, extraUnitTotal } from '../utils/addons';
import { api } from '../api';
import { compactCarForStorage, safeSessionStorageSetItem } from '../utils/storage';

const getPromoCode = (code: string): PromoCode | undefined => {
    return undefined; // Mock data removed
};

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const FormInput = ({ icon: Icon, ...props }: { icon: React.ElementType, [key: string]: any }) => (
  <div className="relative group/input">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
      <Icon className="h-4 w-4 text-slate-400 group-focus-within/input:text-accent transition-colors" />
    </div>
    <input
      {...props}
      className="block h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
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

  const search = React.useMemo(() => {
    const fromStorage = JSON.parse(sessionStorage.getItem('hogicar_search') || '{}');
    return {
        pickupCode: searchParams.get('pickup') || fromStorage.pickupCode,
        dropoffCode: searchParams.get('dropoff') || fromStorage.dropoffCode || searchParams.get('pickup') || fromStorage.pickupCode,
        pickupName: searchParams.get('pickupName') || fromStorage.pickupName,
        dropoffName: searchParams.get('dropoffName') || fromStorage.dropoffName,
        pickupDate: searchParams.get('pickupDate') || fromStorage.pickupDate,
        dropoffDate: searchParams.get('dropoffDate') || fromStorage.dropoffDate,
        startTime: searchParams.get('startTime') || fromStorage.startTime || fromStorage.pickupTime || '10:00',
        endTime: searchParams.get('endTime') || fromStorage.endTime || fromStorage.dropoffTime || '10:00',
    };
  }, [searchParams]);

  const startDate = search.pickupDate || new Date().toISOString().split('T')[0];
  const endDate = search.dropoffDate || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const startTime = search.startTime;
  const endTime = search.endTime;
  const days = rentalDays(startDate, endDate);
  const pickupLabel = search.pickupName || search.pickup || search.pickupCode || car?.location || 'Pickup location';
  const dropoffLabel = search.dropoffName || search.dropoff || search.dropoffCode || pickupLabel;

  // Helper to safely format date strings without timezone shifts
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Split YYYY-MM-DD and create date object at noon to avoid any midnight timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const priceDetails = React.useMemo(() => {
    if (!car) {
        return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, hogicarPromoAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    }
    return calcPricing(car, { pickupDate: startDate, dropoffDate: endDate }, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, startDate, endDate, selectedExtraIds, insuranceOption, appliedPromo]);
  
  const [imageError, setImageError] = React.useState(false);
  const displayImage = imageError ? 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle' : (car?.image || car?.imageUrl || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle');
  const supplierLogo = car?.supplier?.logo || car?.supplier?.logoUrl;
  const transmissionLabel = car?.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual';
  const fuelPolicyLabel = car?.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car?.fuelPolicy?.replace(/_/g, ' ') || 'Full to full';

  const buildBookingPayload = () => {
    if (!car) return null;
    const carId = String(car.id).replace('choice-', '');
    const supplierId = String(car.supplierId ?? car.supplier?.id).replace('choice-', '');
    
    if (!carId) {
      throw new Error('Invalid car id. Please go back to search and select the car again.');
    }
    if (!supplierId) {
      throw new Error('Invalid supplier id. Please go back to search and select the car again.');
    }
    return {
        carId,
        supplierId,
        supplierName: car.supplier?.name || 'Supplier',
        pickupCode: search.pickupCode,
        dropoffCode: search.dropoffCode,
        pickupLocationName: search.pickupName,
        dropoffLocationName: search.dropoffName,
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
        carImage: car.image || car.imageUrl,
        carMake: car.brand || car.make,
        carModel: car.model,
        carCategory: car.category,
        carTransmission: car.transmission,
        carFuelPolicy: car.fuelPolicy,
        carSippCode: car.sippCode,
        carPassengers: car.passengers,
        carBags: car.bags,
        carDoors: car.doors,
        carAirConditioning: car.airConditioning || car.airCon,
        carDeposit: car.deposit,
        carUnlimitedMileage: car.unlimitedMileage,
        supplierLogoUrl: car.supplier?.logo || car.supplier?.logoUrl,
        hogicarChoice: car.hogicarChoice,
        isHogicarChoiceBranded: car.isHogicarChoiceBranded,
        selectedExtras: car.extras
          ?.filter(e => selectedExtraIds.includes(e.id))
          .map(e => ({ ...e, quantity: countSelected(selectedExtraIds, e.id), total: extraUnitTotal(e, days) * countSelected(selectedExtraIds, e.id) }))
    };
  };

  const storeBookingAndGoToConfirmation = (booking: any) => {
    const bookingRef = (booking as any).bookingRef || booking.id;
    sessionStorage.setItem("allowConfirmationRef", bookingRef.toString());
    safeSessionStorageSetItem("hogicar_booking", JSON.stringify(booking));
    safeSessionStorageSetItem("hogicar_car", JSON.stringify(compactCarForStorage(car, { preservePrimaryImage: true })));
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
        safeSessionStorageSetItem("hogicar_pending_booking", JSON.stringify(booking));
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
            // For unpaid bookings, we still "finalize" it to trigger emails and update status
            const finalized = await api.markBookingPaymentComplete(activeBooking.id, 'pay_at_desk');
            storeBookingAndGoToConfirmation(finalized);
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
              safeSessionStorageSetItem("hogicar_pending_booking", JSON.stringify(refreshedBooking));
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
              className="mt-6 px-5 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-700 transition-colors"
            >
              Back to Car Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = routeStep === 'details' ? 'Driver details' : 'Payment';
  const primaryButtonLabel = routeStep === 'details'
    ? 'Continue to payment'
    : priceDetails.payNow > 0 ? 'Pay and book now' : 'Confirm booking';
  const isActionBusy = isSubmitting || isAdvancingToPayment;
  const money = (amount: number) => `${getCurrencySymbol()}${convertPrice(amount).toFixed(2)}`;
  const carName = car.displayName || `${car.make} ${car.model}`;
  const isChoiceBrand = supplierLogo === 'HOGICAR_CHOICE_LOGO' || car.supplier?.name === 'Hogi Car Choice';
  const isInstant = !car?.supplier?.bookingMode || car?.supplier?.bookingMode === 'FREE_SALE';
  const selectedExtras = (car.extras?.filter(e => selectedExtraIds.includes(e.id)) || []).map(e => ({ ...e, quantity: countSelected(selectedExtraIds, e.id) }));
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  const steps = [
    { key: 'details', label: 'Driver details' },
    { key: 'payment', label: 'Payment' },
  ];

  const supplierMark = isChoiceBrand ? (
    <Logo className="h-6 w-auto max-w-[100px]" />
  ) : supplierLogo ? (
    <img src={supplierLogo} alt={car.supplier?.name} className="h-6 w-auto max-w-[90px] object-contain" />
  ) : (
    <span className="text-xs font-semibold text-slate-600">{car.supplier?.name}</span>
  );

  const submitButton = (extraClass = '') => (
    <button
      type="submit"
      disabled={isActionBusy}
      className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 active:bg-accent-800 disabled:cursor-not-allowed disabled:opacity-60 ${extraClass}`}
    >
      {isActionBusy ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {routeStep === 'details' ? 'Preparing payment…' : 'Processing…'}
        </>
      ) : routeStep === 'details' ? (
        <>{primaryButtonLabel} <ArrowRight className="h-4 w-4" /></>
      ) : (
        <><ShieldCheck className="h-4 w-4" /> {primaryButtonLabel}{priceDetails.payNow > 0 ? ` · ${money(priceDetails.payNow)}` : ''}</>
      )}
    </button>
  );

  return (
    <>
    <SEOMetadata
        title={`Book ${car.make} ${car.model} | Hogicar`}
        description="Complete your booking and payment details to reserve your car."
        noIndex={true}
      />
    <div className="min-h-screen overflow-x-clip bg-slate-50 pb-32 font-sans text-slate-900 lg:pb-16">
      {isAdvancingToPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span className="text-sm font-medium text-slate-700">Preparing secure payment…</span>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <BookingStepper currentStep={4} />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{pageTitle}</h1>
            <ol className="mt-2 flex items-center gap-2 text-sm">
              {steps.map((step, i) => {
                const done = routeStep === 'payment' && step.key === 'details';
                const active = routeStep === step.key;
                return (
                  <li key={step.key} className="flex items-center gap-2">
                    {i > 0 && <span className="h-px w-6 bg-slate-300" />}
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${active ? 'bg-accent text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className={active ? 'font-semibold text-slate-900' : 'text-slate-500'}>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="h-3.5 w-3.5" /> Price held for <span className="font-mono font-semibold text-slate-700">{formatTime(timeLeft)}</span>
          </p>
        </div>

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile trip summary */}
            <section className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <img src={displayImage} alt={carName} onError={() => setImageError(true)} referrerPolicy="no-referrer" className="max-h-14 w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{carName} <span className="font-normal text-slate-500">or similar</span></p>
                <p className="mt-0.5 text-xs font-medium text-slate-700">{formatShortDate(startDate)} → {formatShortDate(endDate)}</p>
                <p className="text-xs text-slate-500">{startTime} – {endTime} · {days} day{days > 1 ? 's' : ''}</p>
                <p className="truncate text-xs text-slate-500">{pickupLabel}</p>
              </div>
            </section>

            {routeStep === 'details' ? (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900">Main driver</h2>
                  <p className="mt-1 text-sm text-slate-500">Enter the details exactly as they appear on the driving licence.</p>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="group">
                      <label htmlFor="firstName" className={labelClass}>First name</label>
                      <FormInput id="firstName" icon={User} type="text" placeholder="e.g. JOHN" autoComplete="given-name" autoCapitalize="characters" enterKeyHint="next" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value.toUpperCase())} required />
                    </div>
                    <div className="group">
                      <label htmlFor="lastName" className={labelClass}>Last name</label>
                      <FormInput id="lastName" icon={User} type="text" placeholder="e.g. DOE" autoComplete="family-name" autoCapitalize="characters" enterKeyHint="next" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value.toUpperCase())} required />
                    </div>
                    <div className="group">
                      <label htmlFor="email" className={labelClass}>Email address</label>
                      <FormInput id="email" icon={Mail} type="email" inputMode="email" placeholder="john.doe@example.com" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value.toUpperCase())} required />
                      <p className="mt-1 text-xs text-slate-500">We'll send your confirmation here.</p>
                    </div>
                    <div className="group">
                      <label htmlFor="phone" className={labelClass}>Mobile number</label>
                      <FormInput id="phone" icon={Phone} type="tel" inputMode="tel" placeholder="+1..." autoComplete="tel" enterKeyHint="next" value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} required />
                      <p className="mt-1 text-xs text-slate-500">Include your country code.</p>
                    </div>
                    <div className="group sm:col-span-2">
                      <label htmlFor="flight" className={labelClass}>Flight number <span className="font-normal text-slate-400">(optional)</span></label>
                      <FormInput id="flight" icon={Plane} type="text" placeholder="e.g. BA123" autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={flightNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlightNumber(e.target.value.toUpperCase())} />
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500"><Info className="mt-px h-3.5 w-3.5 shrink-0" /> Lets the supplier track your arrival and hold the car if your flight is delayed.</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-accent focus:ring-accent" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">Create an account to manage this booking</span>
                      <span className="mt-0.5 block text-sm text-slate-500">Keep your booking, payment status and future rentals in one place.</span>
                    </span>
                  </label>
                  {createAccount && (
                    <div className="group mt-4 sm:pl-8">
                      <label htmlFor="password" className={labelClass}>Password</label>
                      <FormInput id="password" icon={ShieldCheck} type="password" placeholder="Minimum 8 characters" autoComplete="new-password" value={accountPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountPassword(e.target.value)} />
                      <p className="mt-1 text-xs text-slate-500">Optional. You can always find your booking with your email and booking reference.</p>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">Main driver</h2>
                    <button type="button" onClick={() => navigate(`/book/${id}/details${bookingQuery}`)} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                      <ArrowLeft className="h-4 w-4" /> Edit
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="col-span-2 sm:col-span-1"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{firstName} {lastName}</dd></div>
                    <div className="col-span-2 min-w-0 sm:col-span-1"><dt className="text-slate-500">Email</dt><dd className="truncate font-medium text-slate-900">{email}</dd></div>
                    <div><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{phoneNumber}</dd></div>
                    {flightNumber && <div><dt className="text-slate-500">Flight</dt><dd className="font-medium text-slate-900">{flightNumber}</dd></div>}
                  </dl>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">Payment details</h2>
                    <div className="flex items-center gap-1.5">
                      {['Visa', 'Mastercard', 'Amex'].map(card => (
                        <span key={card} className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{card}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <span className="text-slate-600">Due now</span>
                    <span className="text-base font-bold text-slate-900">{money(priceDetails.payNow)}</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div className="group">
                      <label htmlFor="cardholder" className={labelClass}>Name on card</label>
                      <FormInput id="cardholder" icon={User} type="text" placeholder="As shown on card" autoComplete="cc-name" autoCapitalize="characters" value={cardholderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardholderName(e.target.value.toUpperCase())} required={priceDetails.payNow > 0} />
                    </div>
                    <div>
                      <span className={labelClass}>Card details</span>
                      {stripeEnabled ? (
                        <div className="rounded-lg border border-slate-300 bg-white px-3 py-3.5 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                          <CardElement options={{
                              hidePostalCode: false,
                              style: {
                                  base: {
                                      fontSize: '16px',
                                      color: '#0f172a',
                                      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                                      '::placeholder': { color: '#94a3b8' },
                                  },
                              }
                          }} />
                        </div>
                      ) : stripeConfigLoading ? (
                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm text-slate-600">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                          Connecting to secure payment…
                        </div>
                      ) : (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3.5 text-sm text-red-700">
                          Secure payment is temporarily unavailable. Please try again shortly or contact support.
                        </div>
                      )}
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" /> Encrypted and processed securely by Stripe.</p>
                    </div>
                    {paymentError && (
                      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">{paymentError}</div>
                    )}
                    {bookingDraft && (
                      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                        Booking reference <strong>{bookingDraft.bookingRef || bookingDraft.id}</strong> is reserved and waiting for payment.
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Desktop action */}
            <div className="hidden items-center justify-between gap-6 lg:flex">
              <p className="max-w-md text-xs text-slate-500">
                {routeStep === 'details'
                  ? 'You won\'t be charged yet. Payment details are entered on the next step.'
                  : 'By booking you agree to our terms and privacy policy and the supplier\'s rental conditions.'}
              </p>
              {submitButton('min-w-[240px]')}
            </div>
          </div>

          {/* Booking summary */}
          <aside>
            <div className="space-y-3 lg:sticky lg:top-20">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="hidden border-b border-slate-100 p-4 lg:block">
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                      <img src={displayImage} alt={carName} onError={() => setImageError(true)} referrerPolicy="no-referrer" loading="eager" className="max-h-14 w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-slate-900">{carName} <span className="font-normal text-slate-500">or similar</span></p>
                      <p className="mt-0.5 text-xs text-slate-500">{car.passengers} seats · {car.bags} bags · {transmissionLabel}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {supplierMark}
                        {!car.isHogicarChoiceBranded && (
                          <span className={`${getRatingColor(car.supplier.rating)} rounded px-1.5 py-0.5 text-xs font-bold text-white`}>{normalizeRatingScore(car.supplier.rating).toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-100 p-4">
                  <h2 className="text-base font-bold text-slate-900">Your trip</h2>
                  <ol className="mt-3 space-y-3">
                    {[
                      { label: 'Pick-up', date: formatShortDate(startDate), time: startTime, place: pickupLabel },
                      { label: 'Drop-off', date: formatShortDate(endDate), time: endTime, place: dropoffLabel },
                    ].map((stop, i) => (
                      <li key={stop.label} className="flex gap-3">
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-accent' : 'border-2 border-accent bg-white'}`} />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">{stop.label}</p>
                          <p className="text-sm font-semibold text-slate-900">{stop.date} · {stop.time}</p>
                          <p className="text-sm text-slate-600">{stop.place}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-slate-500">{days} day{days > 1 ? 's' : ''} rental · {fuelPolicyLabel} fuel{car.unlimitedMileage ? ' · Unlimited mileage' : ''}</p>
                </div>

                <div className="p-4">
                  <h2 className="text-base font-bold text-slate-900">Price details</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Car hire ({days} day{days > 1 ? 's' : ''})</dt><dd className="font-medium text-slate-900">{money(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount)}</dd></div>
                    {priceDetails.insuranceCost > 0 && <div className="flex justify-between gap-4"><dt className="text-slate-600">Full protection</dt><dd className="font-medium text-slate-900">{money(priceDetails.insuranceCost)}</dd></div>}
                    {selectedExtras.map(extra => (
                      <div key={extra.id} className="flex justify-between gap-4"><dt className="text-slate-600">{extra.quantity > 1 ? `${extra.quantity} × ` : ''}{extra.name}</dt><dd className="font-medium text-slate-900">{(extra as any).onRequest ? <span className="text-slate-500">Paid at desk</span> : money(extraUnitTotal(extra, days) * extra.quantity)}</dd></div>
                    ))}
                    {priceDetails.discountAmount > 0 && <div className="flex justify-between gap-4 text-emerald-700"><dt>Promo{appliedPromo?.code ? ` (${appliedPromo.code})` : ''}</dt><dd className="font-medium">-{money(priceDetails.discountAmount)}</dd></div>}
                    {priceDetails.hogicarPromoAmount > 0 && <div className="flex justify-between gap-4 text-emerald-700"><dt>Special deal</dt><dd className="font-medium">-{money(priceDetails.hogicarPromoAmount)}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Taxes and fees</dt><dd className="font-medium text-emerald-700">Included</dd></div>
                  </dl>
                  <div className="mt-3 flex items-end justify-between gap-4 border-t border-slate-200 pt-3">
                    <span className="text-base font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold tracking-tight text-slate-900">{money(priceDetails.finalTotal)}</span>
                  </div>
                  <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex justify-between gap-4"><span className="font-medium text-slate-900">Pay now</span><span className="font-bold text-slate-900">{money(priceDetails.payNow)}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-600">Pay at pick-up</span><span className="font-medium text-slate-900">{money(priceDetails.payAtDesk)}</span></div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Free cancellation before pick-up</li>
                  <li className="flex items-center gap-2">{isInstant ? <Zap className="h-4 w-4 shrink-0 text-emerald-600" /> : <Clock className="h-4 w-4 shrink-0 text-amber-600" />} {isInstant ? 'Instant confirmation' : 'Supplier confirms your request shortly'}</li>
                  <li className="flex items-center gap-2"><Headphones className="h-4 w-4 shrink-0 text-emerald-600" /> 24/7 customer support</li>
                </ul>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">At pick-up bring your driving licence, passport or ID, and a credit card in the main driver's name.</p>
              </section>
            </div>
          </aside>

          {/* Mobile sticky footer */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-500">{routeStep === 'payment' ? 'Due now' : `Total for ${days} day${days > 1 ? 's' : ''}`}</p>
                <p className="text-xl font-bold leading-tight tracking-tight text-slate-900">{money(routeStep === 'payment' ? priceDetails.payNow : priceDetails.finalTotal)}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500"><Lock className="h-3 w-3" /> Secure checkout</p>
              </div>
              <button
                type="submit"
                disabled={isActionBusy}
                className="inline-flex h-12 min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-base font-semibold text-white transition-colors active:bg-accent-800 disabled:opacity-60"
              >
                {isActionBusy ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : routeStep === 'details' ? (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>{priceDetails.payNow > 0 ? 'Pay now' : 'Confirm'}</>
                )}
              </button>
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
  const elementsOptions = React.useMemo(() => ({
    appearance: {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#007ac2',
        },
    },
  }), []);

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
    return <BookingPageContent key="loading" stripeEnabled={false} stripeConfigLoading={true} stripeInstance={null} elementsInstance={null} currentKey={null} onStripeKeyChange={() => {}} configMismatch={false} bookingDraft={null} setBookingDraft={() => {}} creationInProgressRef={creationInProgressRef} />;
  }

  if (!dynamicStripePromise || !currentKey) {
    return <BookingPageContent key={currentKey || 'disabled'} stripeEnabled={false} stripeConfigLoading={false} stripeInstance={null} elementsInstance={null} currentKey={currentKey} onStripeKeyChange={setCurrentKey} configMismatch={configMismatch} bookingDraft={null} setBookingDraft={() => {}} creationInProgressRef={creationInProgressRef} />;
  }

  return (
    <Elements stripe={dynamicStripePromise} key={currentKey || 'stripe'} options={elementsOptions}>
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
