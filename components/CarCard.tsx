




import * as React from 'react';
import { Users, Info, GaugeCircle, Briefcase, Fuel, Plane, Gift, X, FileText, Shield, CreditCard as CreditCardIcon, Handshake, Truck, Zap, Clock, MapPin, Phone, Building, Bus, Award, Tag, Check, CalendarCheck, Wind, ChevronRight } from 'lucide-react';
import { Car as CarType, Supplier, CarRatings } from '../types';
import { Link } from 'react-router-dom';
import { calculatePrice } from '../services/mockData';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';

// --- ICONS ---

// Custom icon for car doors
const CarDoorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
        <path d="M19 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9"/>
        <path d="M12 15V6"/>
        <path d="M4 15h16"/>
        <path d="M15 11h-1"/>
    </svg>
);

// A custom icon component for Automatic Transmission to match the design
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
  <div className="w-[38px] h-[24px] bg-white rounded-sm shadow-md flex items-center justify-center overflow-hidden px-1">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg"
      alt="Visa"
      className="w-full h-auto object-contain"
    />
  </div>
);


// --- RATING TOOLTIP HELPERS & COMPONENT ---
const getRatingDescription = (rating: number): string => {
    if (rating >= 4.8) return 'Exceptional';
    if (rating >= 4.5) return 'Very Good';
    if (rating >= 4.0) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Fair';
};

const getProgressBarColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-blue-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

const DetailedRatingsTooltip: React.FC<{ ratings: CarRatings }> = ({ ratings }) => {
    const ratingItems: { key: keyof CarRatings, label: string }[] = [
        { key: 'cleanliness', label: 'Cleanliness' },
        { key: 'condition', label: 'Car Condition' },
        { key: 'valueForMoney', label: 'Value for Money' },
        { key: 'pickupSpeed', label: 'Pick-up Speed' },
    ];
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-2 p-3 bg-white text-slate-900 rounded-lg shadow-xl ring-1 ring-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <h4 className="font-bold text-xs mb-2">Customer Ratings Breakdown</h4>
            <div className="space-y-2">
                {ratingItems.map(item => (
                    <div key={item.key}>
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                            <span className="text-[11px] font-bold text-slate-800">{ratings[item.key]}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1">
                            <div 
                                className={`h-1 rounded-full ${getProgressBarColor(ratings[item.key])}`}
                                style={{ width: `${ratings[item.key]}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white"></div>
        </div>
    );
};


// --- RENTAL CONDITIONS MODAL ---
const RentalConditionsModal = ({ car, supplier, onClose }: { car: CarType, supplier: Supplier, onClose: () => void }) => {
    const { convertPrice, getCurrencySymbol } = useCurrency();
    const workingHours = supplier.workingHours ? Object.entries(supplier.workingHours) : [];
    const gracePeriodInfo = supplier.gracePeriodDays ? `${supplier.gracePeriodDays} day(s)` : `${supplier.gracePeriodHours} hour(s)`;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col font-sans">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        {!car.hogicarChoice ? (
                            <>
                                <img src={supplier.logo || (supplier as any).logoUrl} alt={supplier.name} className="h-14 object-contain" width={120} height={56} />
                                <div>
                                   <h3 className="font-bold text-lg text-slate-800">Rental Conditions</h3>
                                   <p className="text-xs text-slate-500">Provided by {supplier.name}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-amber-500/30">
                                    <Award className="w-8 h-8 text-amber-400" />
                                </div>
                                <div>
                                   <h3 className="font-bold text-lg text-slate-900 tracking-tight">Rental Conditions</h3>
                                   <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Hogicar Exclusive Verified Fleet</p>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Supplier Details */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Building className="w-4 h-4 text-slate-500"/> Supplier Details</h4>
                        <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                            {supplier.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"/>
                                    <p className="text-xs text-slate-600">{supplier.address}</p>
                                </div>
                            )}
                            {supplier.phone && (
                                 <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"/>
                                    <p className="text-xs text-slate-600">{supplier.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Opening Hours */}
                    {supplier.workingHours && workingHours.length > 0 && (
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500"/> Opening Hours</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-slate-50 p-4 rounded-lg border border-slate-100">
                                {workingHours.map(([day, hours]) => (
                                    <div key={day} className="flex justify-between">
                                        <span className="capitalize text-slate-600">{day}</span>
                                        <span className="font-semibold text-slate-800">{hours}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500"/> Rental Policy & Terms</h4>
                        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed text-xs whitespace-pre-line border border-slate-200 bg-slate-50/50 p-4 rounded-lg h-48 overflow-y-auto">
                           {supplier.termsAndConditions || "No specific terms and conditions provided by this supplier."}
                           <br /><br />
                           <strong>Grace Period:</strong> A grace period of {gracePeriodInfo} is provided for returns.
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
                                    <p className="text-xs text-slate-500">
                                      Must be in the main driver's name, with sufficient funds for the security deposit
                                      {car.deposit > 0 && (
                                        <strong className="text-blue-600 ml-1">
                                          ({getCurrencySymbol(car.currency || 'USD')} {convertPrice(car.deposit)})
                                        </strong>
                                      )}
                                    </p>
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
                 {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-xl">
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-transform active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- RECENT BOOKING HELPER ---
const getRecentBookingInfo = (car: CarType): { isRecent: boolean; message: string } => {
    // Check if supplier has this feature enabled
    if (!car.supplier.enableSocialProof) {
        return { isRecent: false, message: '' };
    }

    // Simple hash function to get a consistent pseudo-random number from the car ID
    const hashCode = car.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Show the message for roughly 1 in 4 cars
    if (hashCode % 4 === 0) {
        const randomType = hashCode % 2;
        if (randomType === 0) {
            // "Booked X times"
            const times = (hashCode % 5) + 2; // Random number between 2 and 6
            return {
                isRecent: true,
                message: `Booked ${times} times in the last 24h`,
            };
        } else {
            // "Last booked X hours ago"
            const hours = (hashCode % 8) + 1; // Random number between 1 and 8
            return {
                isRecent: true,
                message: `Last booked ${hours} hour${hours > 1 ? 's' : ''} ago`,
            };
        }
    }

    return { isRecent: false, message: '' };
};


interface CarCardProps {
  car: CarType;
  cars: CarType[];
  days: number;
  startDate: string;
  endDate: string;
  pickupCode: string;
  dropoffCode: string;
}

const CarCard: React.FC<CarCardProps> = ({ car, cars, days, startDate, endDate, pickupCode, dropoffCode }) => {
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);
  const { convertPrice, getCurrencySymbol } = useCurrency();

  const { promotionLabel } = calculatePrice(car, days, startDate);

  // Use the single source of truth for pricing
  const search = { pickupDate: startDate, dropoffDate: endDate };
  const price = calcPricing(car, search);
  // FIX: Access the correct property 'finalTotal' instead of 'finalPrice'.
  const totalFinalPrice = price.finalTotal;
  const totalCommissionAmount = price.payNow;


  const searchParams = new URLSearchParams({ 
    startDate, 
    endDate,
    pickup: pickupCode,
    dropoff: dropoffCode
  }).toString();

  const recentBookingInfo = React.useMemo(() => getRecentBookingInfo(car), [car]);
  
  const [imageError, setImageError] = React.useState(false);
  const displayImage = imageError ? 'https://placehold.co/400x250/orange/white?text=Vehicle' : (car.image || 'https://placehold.co/400x250/orange/white?text=Vehicle');

  const handleSelectCar = () => {
    // Persist the car ID and the full results list for the next page
    sessionStorage.setItem('hogicar_selectedCarId', car.id);
    sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
    sessionStorage.setItem('hogicar_cars', JSON.stringify(cars));
  };

  return (
    <>
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 border-l-8 border-l-[#008009] transition-all duration-300 w-full mb-6 group/card overflow-hidden">
          {/* Top Bar for Desktop - Hogicar Choice */}
          {car.hogicarChoice && (
            <div className="hidden md:flex bg-[#008009] text-white px-4 py-1 items-center gap-2">
                <Award className="w-4 h-4 text-white fill-white/20" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hogicar Recommended</span>
                <div className="ml-auto flex items-center gap-4 text-[10px] font-bold">
                    <span className="flex items-center gap-1"><Check className="w-3 h-3"/> Top Rated Supplier</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3"/> Hand-picked Fleet</span>
                </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row">
            {/* --- LEFT: CAR INFO --- */}
            <div className="flex-1 p-3.5 md:p-6">
                <div className="flex flex-col sm:flex-row gap-5 md:gap-6">
                    {/* Car Image Column */}
                    <div className="w-full sm:w-[220px] md:w-[240px] flex flex-col gap-3 md:gap-4">
                        <div className="relative aspect-[16/10] bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 group/img">
                            <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="w-full h-full flex items-center justify-center p-3">
                                <img 
                                  src={displayImage} 
                                  alt={`${car.make} ${car.model}`} 
                                  onError={() => setImageError(true)}
                                  referrerPolicy="no-referrer"
                                  loading="eager"
                                  className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-700 ease-out"
                                />
                                
                                {promotionLabel && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-md z-10">
                                        <Tag className="w-2.5 h-2.5 fill-white/20"/> {promotionLabel}
                                    </div>
                                )}
                            </Link>
                        </div>

                        {/* Supplier Info (Desktop) */}
                        <div className="hidden sm:flex items-center gap-3">
                            <img
                                src={car.supplier.logo || (car.supplier as any).logoUrl}
                                alt={car.supplier.name}
                                className="h-8 w-auto object-contain max-w-[100px]"
                            />
                            <div className="flex flex-col group/rating relative">
                                <div className="flex items-center gap-1.5">
                                    <div className="bg-[#008009] text-white text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                        {car.supplier.rating}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700 underline underline-offset-4 decoration-slate-200 cursor-help">{getRatingDescription(car.supplier.rating)}</span>
                                </div>
                                {car.detailedRatings && <DetailedRatingsTooltip ratings={car.detailedRatings} />}
                            </div>
                        </div>
                    </div>

                    {/* Car Details Column */}
                    <div className="flex-1 flex flex-col">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                    {car.category}
                                </span>
                                {car.hogicarChoice && (
                                    <span className="md:hidden flex items-center gap-1 bg-[#008009] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                                        Choice
                                    </span>
                                )}
                            </div>
                            <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar}>
                                <h3 className="text-lg md:text-2xl font-black text-slate-900 leading-tight hover:text-[#008009] transition-colors uppercase tracking-tight">
                                    {car.displayName}
                                </h3>
                            </Link>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                                or similar <Info className="w-3 h-3 text-slate-300" />
                            </p>
                        </div>

                        {/* Specs Grid */}
                        <div className="flex flex-wrap gap-x-5 gap-y-3 mb-5 py-3 border-y border-slate-50">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Users className="w-4 h-4 text-slate-400"/>
                                <span className="text-xs font-bold">{car.passengers} Adults</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Briefcase className="w-4 h-4 text-slate-400"/>
                                <span className="text-xs font-bold">{car.bags} Large Bags</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="text-slate-400"><AutomaticIcon /></div>
                                <span className="text-xs font-bold">
                                    {car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Wind className="w-4 h-4 text-slate-400"/>
                                <span className="text-xs font-bold">A/C</span>
                            </div>
                        </div>

                        {/* Key Features List */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-[#008009]">
                                <Check className="w-4 h-4" />
                                <span>Free Cancellation (up to 48 hours before pick-up)</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                                <Check className="w-4 h-4 text-[#008009]" />
                                <span>{car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to Full' : car.fuelPolicy} Fuel Policy</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                                <Check className="w-4 h-4 text-[#008009]" />
                                <span>{car.unlimitedMileage ? 'Unlimited Mileage' : 'Limited Mileage'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                                <Check className="w-4 h-4 text-[#008009]" />
                                <span>Collision Damage Waiver (CDW) included</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT: PRICING & CTA --- */}
            <div className="w-full md:w-64 bg-slate-50/50 md:bg-slate-50/80 border-t md:border-t-0 md:border-l border-slate-100 p-4 md:p-5 flex flex-col justify-between">
                <div className="flex flex-row md:flex-col items-end md:items-end justify-between md:justify-start gap-1">
                    <div className="flex-1 md:w-full">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-right">Price for {days} days</p>
                        <div className="flex flex-col items-end">
                            {car.promotionPercent && car.promotionPercent > 0 && (
                                <span className="text-[10px] text-slate-400 line-through font-bold">
                                    {getCurrencySymbol()}{convertPrice(totalFinalPrice / (1 - car.promotionPercent/100)).toFixed(2)}
                                </span>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                                    {getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between group/pay">
                        <div>
                            <p className="text-[8px] text-emerald-700 font-black uppercase tracking-wider">Pay Online Now</p>
                            <p className="text-base font-black text-[#008009] leading-tight">
                                {getCurrencySymbol()}{convertPrice(totalCommissionAmount).toFixed(2)}
                            </p>
                        </div>
                        <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20 group-hover/pay:scale-110 transition-transform"/>
                    </div>

                    <Link 
                      to={`/car/${car.id}?${searchParams}`} 
                      state={{ cars: cars }} 
                      onClick={handleSelectCar} 
                      className="group/btn block w-full bg-[#008009] hover:bg-[#006607] text-white font-black py-3.5 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,128,9,0.3)] hover:shadow-[0_12px_25px_-4px_rgba(0,128,9,0.4)] transition-all active:scale-[0.98] text-center text-[12px] uppercase tracking-widest relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            View Deal <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"/>
                        </span>
                    </Link>
                    
                    <p className="text-[10px] text-slate-400 text-center font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/> Instant Confirmation
                    </p>
                </div>
            </div>
          </div>

          {/* Bottom Bar: Pickup & Conditions */}
          <div className="px-4 md:px-6 py-3 bg-white border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                  {/* Mobile Supplier info */}
                  <div className="md:hidden flex items-center gap-3">
                      <img
                          src={car.supplier.logo || (car.supplier as any).logoUrl}
                          alt={car.supplier.name}
                          className="h-6 w-auto object-contain"
                      />
                      <div className="flex items-center gap-1.5">
                          <div className="bg-[#008009] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                              {car.supplier.rating}
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">{getRatingDescription(car.supplier.rating)}</span>
                      </div>
                  </div>
                  
                  {(() => {
                      const pickupType = car.supplier?.pickupType;
                      const getBadge = (icon: any, text: string, bg: string, textCol: string) => (
                        <div className={`flex items-center gap-1.5 ${bg} ${textCol} font-black px-3 py-1 rounded-md text-[10px] uppercase tracking-wider border border-current/10`}>
                            {React.cloneElement(icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
                            {text}
                        </div>
                      );

                      if (pickupType === 'IN_TERMINAL') {
                          return getBadge(<Plane />, "In Terminal", "bg-green-50", "text-green-700");
                      } else if (pickupType === 'MEET_AND_GREET') {
                          return getBadge(<Handshake />, "Meet & Greet", "bg-blue-50", "text-blue-700");
                      } else if (pickupType === 'SHUTTLE_BUS') {
                          return getBadge(<Bus />, "Shuttle Bus", "bg-orange-50", "text-orange-700");
                      }
                      return null;
                  })()}

                  {recentBookingInfo.isRecent && (
                      <div className="hidden sm:flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 px-3 py-1 rounded-md border border-red-100">
                           <Zap className="w-3.5 h-3.5 fill-red-500" />
                           {recentBookingInfo.message}
                      </div>
                  )}
              </div>

              <div className="flex items-center gap-4 ml-auto">
                  <button onClick={() => setIsConditionsModalOpen(true)} className="text-[10px] text-slate-400 hover:text-[#008009] font-black uppercase tracking-widest transition-colors">
                      Rental Conditions
                  </button>
              </div>
          </div>
      </div>
    </>
  );
};

export default CarCard;
