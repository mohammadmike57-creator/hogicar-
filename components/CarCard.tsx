




import * as React from 'react';
import { Users, Info, GaugeCircle, Briefcase, Fuel, Plane, Gift, X, FileText, Shield, CreditCard as CreditCardIcon, Handshake, Truck, Zap, Clock, MapPin, Phone, Building, Bus, Award, Tag } from 'lucide-react';
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
      referrerPolicy="no-referrer"
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
  
  const handleSelectCar = () => {
    // Persist the car ID and the full results list for the next page
    sessionStorage.setItem('hogicar_selectedCarId', car.id);
    sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
    sessionStorage.setItem('hogicar_cars', JSON.stringify(cars));
  };

  return (
    <>
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl border-2 border-[#008009] transition-all duration-300 py-2.5 px-3 md:p-6 w-full mb-3 md:mb-4 scale-95 md:scale-100 origin-center group/card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* --- LEFT COLUMN: IMAGE, SPECS, SUPPLIER --- */}
              <div className="md:col-span-3 flex flex-col justify-between">
                  <div> {/* Top Section for Car Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {/* Image */}
                          <div className="sm:col-span-1 flex items-center justify-center relative group bg-slate-50 rounded-xl overflow-hidden min-h-[140px]">
                             <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="w-full h-full flex items-center justify-center">
                                <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-auto object-contain max-h-32 p-2 group-hover:scale-110 transition-transform duration-500" />
                                
                                {promotionLabel ? (
                                    <span className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg flex items-center gap-1 shadow-sm">
                                        <Gift className="w-3 h-3"/> {promotionLabel}
                                    </span>
                                ) : car.tags && car.tags[0] && (
                                    <span className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-sm">
                                        {car.tags[0]}
                                    </span>
                                )}
                             </Link>
                          </div>

                          {/* Title & Specs */}
                          <div className="sm:col-span-2 flex flex-col">
                              {car.hogicarChoice && (
                                  <div className="inline-flex items-center gap-2 bg-[#003580] text-white text-[10px] font-black px-3 py-1.5 rounded-lg mb-2 shadow-sm border border-amber-400/50 w-fit">
                                      <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                                      <span className="tracking-widest uppercase italic">Hogicar Choice</span>
                                  </div>
                              )}
                              
                              <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="group">
                                  <h3 className="text-xl font-black text-slate-900 group-hover:text-[#008009] transition-colors leading-tight">{car.displayName}</h3>
                              </Link>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                  or similar {car.category}
                                  <Info className="w-3 h-3 text-slate-400" />
                              </p>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-4 text-[13px]">
                                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <Users className="w-4 h-4 text-slate-400"/>
                                    <span>{car.passengers} seats</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <Briefcase className="w-4 h-4 text-slate-400"/>
                                    <span>{car.bags} bags</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <AutomaticIcon />
                                    <span>{car.transmission}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <CarDoorIcon />
                                    <span>{car.doors} doors</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <GaugeCircle className="w-4 h-4 text-slate-400"/>
                                    <span>{car.unlimitedMileage ? 'Unlimited' : 'Limited'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <Fuel className="w-4 h-4 text-slate-400"/>
                                    <span>{car.fuelPolicy}</span>
                                  </div>
                              </div>

                              {/* Social Proof */}
                              {recentBookingInfo.isRecent && (
                                <div className="mt-4">
                                  <div className="bg-orange-50 text-orange-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-orange-100 shadow-sm w-fit animate-pulse">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>{recentBookingInfo.message}</span>
                                  </div>
                                </div>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Bottom Section for Supplier Info */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      {car.hogicarChoice ? (
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-amber-500/30">
                                  <Award className="w-7 h-7 text-amber-400" />
                              </div>
                              <div>
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Hogicar Exclusive Verified Fleet</p>
                                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Premium Selection & Direct Support</p>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center gap-6">
                              <img
                                  src={car.supplier.logo || (car.supplier as any).logoUrl}
                                  alt={car.supplier.name}
                                  className="h-10 md:h-12 w-auto object-contain"
                              />
                              <div className="border-l border-slate-200 pl-6 group/rating relative">
                                  <div className="flex items-center gap-2">
                                      <div className="bg-[#008009] text-white text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                          {car.supplier.rating}
                                      </div>
                                      <p className="text-sm font-bold text-slate-800">{getRatingDescription(car.supplier.rating)}</p>
                                      {car.detailedRatings && <DetailedRatingsTooltip ratings={car.detailedRatings} />}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{Math.round(car.supplier.rating * 250)}+ verified reviews</p>
                              </div>
                          </div>
                      )}

                      <div className="flex items-center gap-4">
                          {car.supplier.bookingMode === 'FREE_SALE' && (
                              <span className="flex items-center gap-1.5 bg-emerald-50 text-[#008009] font-bold px-3 py-1.5 rounded-full text-[11px] shadow-sm border border-[#008009]/10">
                                  <Zap className="w-3.5 h-3.5 fill-[#008009]/20" />
                                  Instant Confirmation
                              </span>
                          )}
                          {(() => {
                              const pickupType = car.supplier?.pickupType;
                              const getBadge = (icon: any, text: string, bg: string, textCol: string) => (
                                <span className={`flex items-center gap-1.5 ${bg} ${textCol} font-bold px-3 py-1.5 rounded-full text-[11px] shadow-sm border border-current/10`}>
                                    {icon}
                                    {text}
                                </span>
                              );

                              if (pickupType === 'IN_TERMINAL') {
                                  return getBadge(<Plane className="w-3.5 h-3.5" />, "In Terminal", "bg-green-50", "text-green-700");
                              } else if (pickupType === 'MEET_AND_GREET') {
                                  return getBadge(<Handshake className="w-3.5 h-3.5" />, "Meet & Greet", "bg-blue-50", "text-blue-700");
                              } else if (pickupType === 'SHUTTLE_BUS') {
                                  return getBadge(<Bus className="w-3.5 h-3.5" />, "Shuttle Bus", "bg-orange-50", "text-orange-700");
                              }
                              return null;
                          })()}

                          <button onClick={() => setIsConditionsModalOpen(true)} className="text-[11px] text-slate-400 hover:text-[#008009] font-bold underline underline-offset-4 transition-colors">
                              Rental Conditions
                          </button>
                      </div>
                  </div>
              </div>

              {/* --- RIGHT COLUMN: PRICE & CTA --- */}
              <div className="md:col-span-1 flex flex-col justify-between md:border-l border-slate-100 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0">
                  <div className="flex flex-col items-end text-right">
                      {car.hogicarChoice && car.promotionPercent && car.promotionPercent > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200 mb-4 shadow-sm">
                              <Tag className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase">-{car.promotionPercent}% Secret Deal</span>
                          </div>
                      )}
                      
                      <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Price for {days} days</p>
                          <div className="flex flex-col items-end">
                              <p className="font-black text-slate-900 text-3xl tracking-tight">
                                  {getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(2)}
                              </p>
                              <p className="text-[#008009] text-xs font-black bg-green-50 px-2 py-1 rounded mt-1 border border-green-100">
                                  Pay now: {getCurrencySymbol()}{convertPrice(totalCommissionAmount).toFixed(2)}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 space-y-3">
                      <Link 
                        to={`/car/${car.id}?${searchParams}`} 
                        state={{ cars: cars }} 
                        onClick={handleSelectCar} 
                        className="block w-full bg-[#008009] hover:bg-[#006607] text-white font-black py-4 rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] text-center text-sm uppercase tracking-widest"
                      >
                          View Deal
                      </Link>
                      {!car.hogicarChoice && (
                          <p className="text-[10px] text-slate-400 text-center font-bold italic tracking-wider uppercase">Official {car.supplier.name} Rates</p>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};

export default CarCard;
