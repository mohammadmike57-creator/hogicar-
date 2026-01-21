
import * as React from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { MOCK_CARS, calculatePrice, calculateBookingFinancials, addMockBooking, getPromoCode } from '../services/mockData';
import { ShieldCheck, User, CreditCard, Shield, Car, Info, Calendar, Mail, Phone, Lock, Plus, Check, Plane, TrendingUp, Clock } from 'lucide-react';
// FIX: Import `BookingMode` to correctly determine the booking status.
import { Extra, BookingMode, PromoCode } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';

// FIX: Moved FormInput outside of the main component to prevent re-rendering issues (losing focus after one character).
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
  const car = MOCK_CARS.find(c => c.id === id) || MOCK_CARS[0];
  const { convertPrice, getCurrencySymbol } = useCurrency();

  // Pre-select extras from URL
  const initialExtras = searchParams.get('extras')?.split(',').filter(Boolean) || [];
  const initialPromoCode = searchParams.get('promo');

  const [driverName, setDriverName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [flightNumber, setFlightNumber] = React.useState('');
  const [insuranceOption, setInsuranceOption] = React.useState<'basic' | 'full'>('basic');
  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>(initialExtras);
  const [timeLeft, setTimeLeft] = React.useState(20 * 60); // 20 minutes
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null);

  React.useEffect(() => {
    if (initialPromoCode) {
      const promo = getPromoCode(initialPromoCode);
      if (promo && promo.status === 'active') {
        setAppliedPromo(promo);
      }
    }
  }, [initialPromoCode]);
  
  const fullProtectionDailyCost = 12;

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

  // Get dates from URL or use defaults
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(new Date().setDate(today.getDate() + 5)).toISOString().split('T')[0];
  
  const startDate = startDateParam || defaultStart;
  const endDate = endDateParam || defaultEnd;
  const startTime = "10:00"; // Default
  const endTime = "10:00"; // Default
  
  // Calculate duration
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Default to 1 day

  // Memoize price calculations
  const { baseTotal, insuranceCost, extrasCost, finalTotal, finalPayNow, finalPayAtDesk, discountAmount } = React.useMemo(() => {
    // 1. Calculate Base Rental Price (now returns gross and net)
    const { total: carGrossTotal, netTotal: carNetTotal } = calculatePrice(car, days, startDate);
    
    // 1.5. Apply promo code discount ONLY to commission
    const commission = carGrossTotal - carNetTotal;
    const discount = appliedPromo ? commission * appliedPromo.discount : 0;
    const discountedCarGrossTotal = carGrossTotal - discount;

    // 2. Calculate Insurance (if full protection selected)
    const insurance = insuranceOption === 'full' ? fullProtectionDailyCost * days : 0;
    
    // 3. Calculate Extras (Separately, paid at desk)
    const extrasTotal = (car.extras || []).reduce((acc, extra) => {
        if (!selectedExtraIds.includes(extra.id)) return acc;
        return acc + (extra.type === 'per_day' ? extra.price * days : extra.price);
    }, 0);

    // 4. Calculate total gross amounts. Insurance is added on top of the car's gross price.
    const rentalAndInsuranceGrossTotal = discountedCarGrossTotal + insurance;
    const finalGrossTotal = rentalAndInsuranceGrossTotal + extrasTotal;

    // 5. Calculate Financials. Insurance is assumed not commissionable and is part of the net cost. The discount does not affect the supplier's net.
    const financialNetTotal = carNetTotal + insurance; 
    const { payNow, payAtDesk } = calculateBookingFinancials(rentalAndInsuranceGrossTotal, financialNetTotal, extrasTotal, car.supplier);

    return {
      baseTotal: carGrossTotal, // Original gross price for summary display before discount
      insuranceCost: insurance,
      extrasCost: extrasTotal,
      finalTotal: finalGrossTotal,
      finalPayNow: payNow,
      finalPayAtDesk: payAtDesk,
      discountAmount: discount
    };
  }, [car, days, insuranceOption, startDate, selectedExtraIds, appliedPromo]);
  
  
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !email || !phoneNumber) {
      alert("Please enter the driver's full name, email, and phone number.");
      return;
    }

    // Retrieve Affiliate ID from session storage
    const affiliateId = sessionStorage.getItem('hogicar_affiliate_ref') || undefined;

    const newBooking = addMockBooking({
        carId: car.id,
        carName: `${car.make} ${car.model}`,
        customerName: driverName,
        customerEmail: email,
        customerPhone: phoneNumber,
        flightNumber: flightNumber,
        startDate,
        startTime,
        endDate,
        endTime,
        totalPrice: finalTotal,
        status: car.supplier.bookingMode === BookingMode.ON_REQUEST ? 'pending' : 'confirmed',
        amountPaidOnline: finalPayNow,
        amountToPayAtDesk: finalPayAtDesk,
        bookingMode: car.supplier.bookingMode,
        selectedExtras: (car.extras || []).filter(e => selectedExtraIds.includes(e.id)),
        affiliateId: affiliateId,
        appliedPromoCode: appliedPromo?.code,
        discountAmount: discountAmount,
    });
    
    navigate(`/confirmation/${newBooking.id}`);
  };

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
                  <h1 className="text-xl font-bold text-slate-900">{car.make} {car.model}</h1>
                  <p className="text-sm text-slate-500">{car.category} &bull; {car.transmission}</p>
                  <p className="text-xs text-slate-600 mt-2">Provided by <strong>{car.supplier.name}</strong></p>
               </div>
            </div>
            
            {/* Driver Details */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Driver Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label><FormInput icon={User} type="text" placeholder="John Doe" value={driverName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDriverName(e.target.value)} required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label><FormInput icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label><FormInput icon={Phone} type="tel" placeholder="+1 (555) 123-4567" value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} required /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Driver's Age</label><FormInput icon={Calendar} type="number" placeholder="25" required /></div>
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
                          <span className="text-xs font-bold text-blue-600 mt-2 block">+ {getCurrencySymbol()}{convertPrice(fullProtectionDailyCost).toFixed(2)} / day</span>
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
                  <div className="flex justify-between text-xs text-slate-600"><span>Car Hire ({days} days)</span><span>{getCurrencySymbol()}{convertPrice(baseTotal).toFixed(2)}</span></div>
                  {insuranceOption === 'full' && <div className="flex justify-between text-xs text-slate-600"><span>Full Protection</span><span>{getCurrencySymbol()}{convertPrice(insuranceCost).toFixed(2)}</span></div>}
                  
                  {/* Selected Extras Summary */}
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

                  {discountAmount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount ({appliedPromo?.code})</span><span>-{getCurrencySymbol()}{convertPrice(discountAmount).toFixed(2)}</span></div>}

                  <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100"><span>Taxes & Fees</span><span className="text-green-600 font-medium">Included</span></div>
                </div>
                <div className="border-t border-slate-100 pt-3 mb-4">
                  <div className="flex justify-between items-center"><span className="font-bold text-slate-900 text-base">Total</span><span className="font-bold text-slate-900 text-2xl">{getCurrencySymbol()}{convertPrice(finalTotal).toFixed(2)}</span></div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-2 mb-6">
                   <div className="flex justify-between font-bold text-blue-600"><span>Pay Online Now</span><span>{getCurrencySymbol()}{convertPrice(finalPayNow).toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-600"><span>Pay at Counter</span><span>{getCurrencySymbol()}{convertPrice(finalPayAtDesk).toFixed(2)}</span></div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center text-sm">
                  Confirm & Pay {getCurrencySymbol()}{convertPrice(finalPayNow).toFixed(2)}
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
