




import * as React from 'react';
import { Users, Info, GaugeCircle, Briefcase, Fuel, Plane, Gift, X, FileText, Shield, CreditCard as CreditCardIcon, Handshake, Truck, Zap, Clock, MapPin, Phone, Building, Bus, Award, Tag, Check, CalendarCheck, Wind, ChevronRight } from 'lucide-react';
import { Car as CarType, Supplier, CarRatings } from '../types';
import { DetailedRatingsTooltip } from './DetailedRatingsTooltip';
import { getRatingDescription } from '../utils/ratings';
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
                                          ({getCurrencySymbol()} {convertPrice(car.deposit)})
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
  const [showRatingsTooltip, setShowRatingsTooltip] = React.useState(false);
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
      <div className="bg-white rounded-lg md:rounded-2xl shadow-sm hover:shadow-2xl border md:border-2 border-[#008009] hover:border-[#00a30b] transition-all duration-500 w-full group/card overflow-hidden flex flex-col h-full hover:-translate-y-1 md:scale-[0.97] md:hover:scale-100">
          {/* Header Badge */}
          {car.hogicarChoice && (
            <div className="bg-gradient-to-r from-[#008009] via-[#00a30b] to-[#008009] text-white px-2 md:px-4 py-0.5 md:py-1.5 flex items-center justify-center gap-1 md:gap-2">
                <Award className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 text-white fill-white/20" />
                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest">Hogicar Recommended</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row flex-grow">
              {/* Car Image Area */}
              <div className="relative md:w-1/4 bg-white border-b md:border-b-0 md:border-r border-slate-50 flex flex-col p-1.5 md:p-3 group/img">
                  <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="w-full aspect-[16/10] flex items-center justify-center mb-1 md:mb-4">
                      <img
                        src={displayImage}
                        alt={`${car.make} ${car.model}`}
                        onError={() => setImageError(true)}
                        referrerPolicy="no-referrer"
                        loading="eager"
                        className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-700 ease-out"
                      />

                      {promotionLabel && (
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-red-600 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2.5 md:py-1 rounded md:rounded-md flex items-center gap-0.5 md:gap-1 shadow-md z-10">
                              <Tag className="w-2 h-2 md:w-3 md:h-3 fill-white/20"/> {promotionLabel}
                          </div>
                      )}
                  </Link>

                  {/* Supplier & Rating Block */}
                  <div className="flex items-center justify-between gap-1 pt-1 md:pt-4 border-t border-slate-100 mt-auto w-full">
                      <img
                          src={car.supplier.logo || (car.supplier as any).logoUrl}
                          alt={car.supplier.name}
                          className="h-4 md:h-8 w-auto object-contain max-w-[50px] md:max-w-[90px]"
                      />
                      <div
                        className="flex items-center gap-0.5 md:gap-2 group/rating relative cursor-pointer"
                        onMouseEnter={() => setShowRatingsTooltip(true)}
                        onMouseLeave={() => setShowRatingsTooltip(false)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowRatingsTooltip(!showRatingsTooltip);
                        }}
                      >
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] md:text-[11px] font-black text-slate-900 leading-none mb-0.5">
                              {getRatingDescription(car.supplier.rating)}
                            </span>
                            <span className="text-[7px] md:text-[9px] font-bold text-slate-400 whitespace-nowrap">
                              Supplier Rating
                            </span>
                          </div>
                          <div className="bg-[#008009] text-white text-[10px] md:text-[14px] font-black w-6 h-6 md:w-9 md:h-9 flex items-center justify-center rounded md:rounded-lg shadow-sm shrink-0">
                              {car.supplier.rating}
                          </div>
                          {car.detailedRatings && <DetailedRatingsTooltip ratings={car.detailedRatings} visible={showRatingsTooltip} align="left" />}
                      </div>
                  </div>
              </div>

              <div className="flex-grow flex flex-col md:flex-row">
                  <div className="p-2 md:p-3 flex-grow border-b md:border-b-0 md:border-r border-slate-50">
                      {/* Title & Category */}
                      <div className="mb-1.5 md:mb-4">
                          <div className="flex items-center gap-1 mb-0.5">
                              <span className="bg-slate-100 text-slate-500 text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {car.category}
                              </span>
                          </div>
                          <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar}>
                              <h3 className="text-sm md:text-[1rem] font-black text-slate-900 leading-tight hover:text-[#008009] transition-colors uppercase tracking-tight line-clamp-1">
                                  {car.displayName}
                              </h3>
                          </Link>
                          <p className="text-[7px] md:text-[10px] text-slate-400 font-bold flex items-center gap-0.5 mt-0.5">
                              or similar <Info className="w-2 md:w-2.5 h-2 md:h-2.5" />
                          </p>
                      </div>

                      {/* Specs Grid (Compact) */}
                      <div className="grid grid-cols-2 gap-x-1.5 md:gap-x-3 gap-y-1 md:gap-y-2 mb-1.5 md:mb-4 py-1.5 md:py-2.5 border-y border-slate-50 bg-slate-50/30 rounded px-1.5 md:px-2.5">
                          <div className="flex items-center gap-1 md:gap-2.5 text-slate-600">
                              <Users className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-400"/>
                              <span className="text-[9px] md:text-[11px] font-bold">{car.passengers} <span className="hidden md:inline">Adults</span></span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2.5 text-slate-600">
                              <Briefcase className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-400"/>
                              <span className="text-[9px] md:text-[11px] font-bold">{car.bags} <span className="hidden md:inline">Bags</span></span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2.5 text-slate-600">
                              <div className="text-slate-400 scale-[0.7] md:scale-90"><AutomaticIcon /></div>
                              <span className="text-[9px] md:text-[11px] font-bold">
                                  {car.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}
                              </span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2.5 text-slate-600">
                              <Wind className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-400"/>
                              <span className="text-[9px] md:text-[11px] font-bold">A/C</span>
                          </div>
                      </div>

                      {/* Included Features checklist */}
                      <div className="space-y-0.5 md:space-y-2 mb-1.5 md:mb-4">
                          <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] font-bold text-[#008009]">
                              <CalendarCheck className="w-3 md:w-3.5 h-3 md:h-3.5 stroke-[3px]" />
                              <span>Free Cancellation</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] font-bold text-slate-700">
                              <Fuel className="w-3 md:w-3.5 h-3 md:h-3.5 text-[#008009] stroke-[3px]" />
                              <span>{car.fuelPolicy === 'FULL_TO_FULL' ? <>Fair Fuel Policy <span className="hidden md:inline">(Full to Full)</span></> : car.fuelPolicy}</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] font-bold text-slate-700">
                              <GaugeCircle className="w-3 md:w-3.5 h-3 md:h-3.5 text-[#008009] stroke-[3px]" />
                              <span>{car.unlimitedMileage ? 'Unlimited' : 'Limited'} Mileage</span>
                          </div>
                          {car.supplier.bookingMode === 'FREE_SALE' && (
                            <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] font-bold text-blue-600">
                                <Zap className="w-3 md:w-3.5 h-3 md:h-3.5 fill-blue-600/20" />
                                <span>Instant Confirmation</span>
                            </div>
                          )}
                      </div>

                      {/* Social Proof Message */}
                      {recentBookingInfo.isRecent && (
                        <div className="flex items-center gap-1 md:gap-2 bg-emerald-50 border border-emerald-100 p-1 md:p-2 rounded md:rounded-lg mt-1 md:mt-2">
                           <Clock className="w-2.5 md:w-3 h-2.5 md:h-3 text-[#008009]" />
                           <span className="text-[8px] md:text-[10px] font-black text-[#008009] uppercase tracking-wider">{recentBookingInfo.message}</span>
                        </div>
                      )}
                  </div>

                  {/* Price & CTA Section */}
                  <div className="p-2 md:p-3 md:w-1/3 bg-slate-50/50 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100">
                      <div>
                          {/* Pricing Info */}
                          <div className="flex flex-col mb-1.5 md:mb-4">
                              <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                <p className="text-[7px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest">Total <span>for {days} days</span></p>
                                {car.supplier.rating >= 4.5 && (
                                    <div className="flex items-center gap-0.5 md:gap-1 text-[7px] md:text-[9px] font-black text-[#008009] uppercase bg-[#008009]/5 px-1 md:px-1.5 py-0.5 rounded">
                                        <Award className="w-2 md:w-2.5 h-2 md:h-2.5" /> <span>Best Value</span>
                                    </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 md:gap-2">
                                  {car.promotionPercent > 0 && (
                                      <span className="text-[8px] md:text-[10px] text-slate-300 line-through font-bold">
                                          {getCurrencySymbol()}{convertPrice(totalFinalPrice / (1 - car.promotionPercent/100)).toFixed(2)}
                                      </span>
                                  )}
                                  <span className="text-base md:text-xl font-black text-slate-900 tracking-tighter">
                                      {getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(2)}
                                  </span>
                              </div>
                              <p className="text-[7px] md:text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-0.5 md:gap-1">
                                  <Shield className="w-2 md:w-2.5 h-2 md:h-2.5" /> All taxes included
                              </p>
                          </div>

                          <div className="mb-1.5 md:mb-6 p-1.5 md:p-3 bg-[#008009]/5 rounded-lg md:rounded-xl border border-[#008009]/10">
                              <p className="text-[7px] md:text-[9px] text-emerald-700 font-black uppercase tracking-widest mb-0.5 md:mb-1 flex items-center gap-0.5 md:gap-1">
                                  <CreditCardIcon className="w-2 md:w-3 h-2 md:h-3" /> Pay Now
                              </p>
                              <div className="flex items-baseline gap-0.5 md:gap-1">
                                  <span className="text-sm md:text-xl font-black text-[#008009] tracking-tight">
                                      {getCurrencySymbol()}{convertPrice(totalCommissionAmount).toFixed(2)}
                                  </span>
                                  <span className="text-[7px] md:text-[10px] text-[#008009]/60 font-bold italic">to secure car</span>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-1.5 md:space-y-4">
                          {/* CTA Button */}
                          <Link
                            to={`/car/${car.id}?${searchParams}`}
                            state={{ cars: cars }}
                            onClick={handleSelectCar}
                            className="group/btn block w-full bg-[#008009] hover:bg-[#006607] text-white font-black py-2 md:py-3 rounded-lg md:rounded-xl shadow-md md:shadow-[0_6px_15px_-4px_rgba(0,128,9,0.3)] hover:shadow-lg transition-all active:scale-[0.98] text-center text-[10px] md:text-[10px] uppercase tracking-widest relative overflow-hidden"
                          >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                              <span className="relative z-10 flex items-center justify-center gap-1 md:gap-2">
                                  View <span>Deal</span> <ChevronRight className="w-3 md:w-4 h-3 md:h-4 group-hover/btn:translate-x-1 transition-transform"/>
                              </span>
                          </Link>
                          
                          {/* Badges Footer */}
                          <div className="flex items-center justify-between gap-1 md:gap-2 pt-1 md:pt-2 border-t border-slate-200/60 flex">
                              <div className="flex items-center gap-1 md:gap-1.5">
                                  {(() => {
                                      const pickupType = car.supplier?.pickupType;
                                      const getBadge = (icon: any, text: string, bg: string, textCol: string) => (
                                        <div className={`flex items-center gap-0.5 md:gap-1.5 ${bg} ${textCol} font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded md:rounded-md text-[8px] md:text-[9px] uppercase tracking-wider border border-current/10`}>
                                            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-2.5 md:w-3 h-2.5 md:h-3" })}
                                            {text}
                                        </div>
                                      );

                                      if (pickupType === 'IN_TERMINAL') return getBadge(<Plane />, "Terminal", "bg-green-50", "text-green-700");
                                      if (pickupType === 'MEET_AND_GREET') return getBadge(<Handshake />, "Meet & Greet", "bg-blue-50", "text-blue-700");
                                      if (pickupType === 'SHUTTLE_BUS') return getBadge(<Bus />, "Shuttle", "bg-orange-50", "text-orange-700");
                                      return null;
                                  })()}
                              </div>

                              <button onClick={() => setIsConditionsModalOpen(true)} className="flex items-center gap-0.5 md:gap-1 text-[8px] md:text-[10px] text-slate-400 hover:text-[#008009] font-black uppercase tracking-widest transition-colors group/cond">
                                  <FileText className="w-3 md:w-3.5 h-3 md:h-3.5 group-hover/cond:scale-110 transition-transform" />
                                  <span>Conditions</span>
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};

export default CarCard;
