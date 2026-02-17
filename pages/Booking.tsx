
import * as React from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { getPromoCode } from '../services/mockData';
import { ShieldCheck, User, CreditCard, Shield, Info, Calendar, Mail, Phone, Lock, Plus, Check, Plane, TrendingUp, Clock } from 'lucide-react';
import { Car, Extra, BookingMode, PromoCode } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { calcPricing, rentalDays } from '../utils/pricing';
import { api } from '../api';

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

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
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

  const search = JSON.parse(sessionStorage.getItem("hogicar_search") || "{}");
  const startDate = search.pickupDate || new Date().toISOString().split('T')[0];
  const endDate = search.dropoffDate || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
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

    setIsSubmitting(true);
    
    const payload = {
        supplierId: car.supplierId,
        supplierName: car.supplier.name,
        pickupCode: search.pickupCode,
        dropoffCode: search.dropoffCode,
        pickupDate: startDate,
        dropoffDate: endDate,
        currency: car.currency,
        netPrice: priceDetails.baseNetTotal,
        commissionPercent: car.commissionPercent,
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

    console.log("BOOKING PAYLOAD:", payload);

    try {
        const booking = await api.createBooking(payload);
        console.log("BOOKING SUCCESS:", booking);
        
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
        alert(`Booking failed: ${error.message || "An unknown error occurred."}`);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!car) {
    React.useEffect(() => { navigate('/'); }, [navigate]);
    return null;
  }

  return (
    <>
    <SEOMetadata
        title={`Book ${car.make} ${car.model} | Hogicar`}
        description="Complete your booking and payment details to reserve your car."
        noIndex={true}
      />
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <BookingStepper currentStep={4} />

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 flex items-center gap-6">
               <img src={car.image} alt={car.model} className="w-40 h-24 object-cover rounded" />
               <div>
                  <h1 className="text-xl font-bold text-slate-900">{car.displayName || `${car.make} ${car.model}`}</h1>
                  <p className="text-sm text-slate-500">{car.category} &bull; {car.transmission}</p>
                  <p className="text-xs text-slate-600 mt-2">Provided by <strong>{car.supplier.name}</strong></p>
               </div>
            </div>
            
            {/* Driver Details */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Driver Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">First Name</label><FormInput icon={User} type="text" placeholder="John" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label><FormInput icon={User} type="text" placeholder="Doe" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label><FormInput icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label><FormInput icon={Phone} type="tel" placeholder="+1 (555) 123-4567" value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} required /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Flight Number (Optional)</label><FormInput icon={Plane} type="text" placeholder="e.g. AA123" value={flightNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFlightNumber(e.target.value)} /> <p className="text-[10px] text-gray-500 mt-1">Helps the supplier track delays.</p></div>
               </div>
            </div>

            {/* Insurance Options */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Rental Protection</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setInsuranceOption('basic')} className={`p-4 border rounded-lg cursor-pointer transition-all ${insuranceOption === 'basic' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                     <h3 className="font-bold text-slate-800 text-sm">Basic Coverage</h3>
                     <p className="text-xs text-slate-500 mt-1">Included. Covers theft and collision damage with an excess of {getCurrencySymbol()}{convertPrice(car.excess).toFixed(0)}.</p>
                     <span className="text-xs font-bold text-blue-600 mt-2 block">Included in price</span>
                  </div>
                   <div onClick={() => setInsuranceOption('full')} className={`p-4 border rounded-lg cursor-pointer transition-all ${insuranceOption === 'full' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                     <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Full Protection</h3>
                          <p className="text-xs text-slate-500 mt-1">Peace of mind. Your excess is reduced to {getCurrencySymbol()}0, plus coverage for tyres and windows.</p>
                          <span className="text-xs font-bold text-blue-600 mt-2 block">+ {getCurrencySymbol()}{convertPrice(12).toFixed(2)} / day</span>
                        </div>
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                           <TrendingUp className="w-3 h-3"/> Popular
                        </span>
                     </div>
                     {insuranceOption === 'full' && (
                        <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-slate-600 space-y-1 animate-fadeIn">
                           <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> Reduces your excess to {getCurrencySymbol()}0</p>
                           <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> Covers windows, mirrors, wheels & tyres</p>
                           <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500"/> Covers undercarriage & roof</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Payment Details</h2>
               <div className="space-y-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Cardholder Name</label><FormInput icon={User} type="text" placeholder="John M Doe" required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label><FormInput icon={CreditCard} type="text" placeholder="•••• •••• •••• ••••" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label><FormInput icon={Calendar} type="text" placeholder="MM / YY" required /></div>
                     <div><label className="block text-xs font-medium text-gray-700 mb-1">CVC / CVV</label><FormInput icon={Lock} type="text" placeholder="•••" required /></div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar / Booking Summary */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-5 sticky top-24">
               <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 flex items-center justify-between">
                   <p className="text-xs font-bold text-green-700 flex items-center gap-1.5"><Clock className="w-4 h-4"/>Your car is held for:</p>
                   <p className="text-lg font-mono font-extrabold text-green-700 tracking-tight">{formatTime(timeLeft)}</p>
               </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4">Price Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-slate-600"><span>Car Hire ({days} days)</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span></div>
                  {priceDetails.insuranceCost > 0 && <div className="flex justify-between text-xs text-slate-600"><span>Full Protection</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span></div>}
                  
                  {selectedExtraIds.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-100">
                          {car.extras?.filter(e => selectedExtraIds.includes(e.id)).map(extra => (
                              <div key={extra.id} className="flex justify-between text-xs text-slate-600 mb-1">
                                  <span>{extra.name}</span>
                                  <span>{getCurrencySymbol()}{(extra.type === 'per_day' ? convertPrice(extra.price) * days : convertPrice(extra.price)).toFixed(2)}</span>
                              </div>
                          ))}
                      </div>
                  )}

                  {priceDetails.discountAmount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount ({appliedPromo?.code})</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span></div>}

                  <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100"><span>Taxes & Fees</span><span className="text-green-600 font-medium">Included</span></div>
                </div>
                <div className="border-t-2 border-dashed border-slate-200 pt-3 my-4">
                  <div className="flex justify-between items-center"><span className="font-bold text-slate-900 text-base">Total</span><span className="font-bold text-slate-900 text-2xl">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span></div>
               </div>
               <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-2 mb-6">
                   <div className="flex justify-between font-bold text-blue-600"><span>Pay now</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-600"><span>Pay at rental desk</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</span></div>
               </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : `Confirm & Pay ${getCurrencySymbol()}${convertPrice(priceDetails.payNow).toFixed(2)}`}
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3"/> Secure payment processing by Stripe</p>
                <div className="bg-blue-50 border border-blue-100 rounded p-2 mt-4 flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-[10px] text-blue-800">By booking you agree to the <a href="#" className="underline font-medium">Terms of Service</a> and <a href="#" className="underline font-medium">Privacy Policy</a>.</p>
                </div>
             </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default BookingPage;
