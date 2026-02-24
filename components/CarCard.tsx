




import * as React from 'react';
import { Users, Info, GaugeCircle, Briefcase, Fuel, Plane, Gift, X, FileText, Shield, CreditCard as CreditCardIcon, Handshake, Truck, Zap, Clock, MapPin, Phone, Building } from 'lucide-react';
import { Car as CarType, Supplier, CarRatings } from '../types';
import { Link } from 'react-router-dom';
import { calculatePrice } from '../services/mockData';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';

// --- ICONS ---

// Custom icon for car doors
const CarDoorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
        <path d="M19 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9"/>
        <path d="M12 15V6"/>
        <path d="M4 15h16"/>
        <path d="M15 11h-1"/>
    </svg>
);

// A custom icon component for Automatic Transmission to match the design
const AutomaticIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24" className="rounded-sm shadow-md bg-white">
    <rect width="38" height="24" rx="3" fill="white"/>
    <path d="M16.66 16.24H14.1l1.62-10.2h2.56l-1.62 10.2zm10.95-9.96c-.97-.27-2.54-.52-4.05-.52-4.45 0-7.58 2.37-7.6 5.77-.02 2.5 2.24 3.9 3.95 4.74 1.75.86 2.34 1.42 2.34 2.2-.02 1.18-1.42 1.74-2.73 1.74-1.54 0-2.37-.23-3.63-.8l-.52-.24-.73 4.54c.94.43 2.68.8 4.48.82 4.7 0 7.78-2.3 7.8-5.9.02-1.97-1.17-3.46-3.77-4.7-1.58-.8-2.54-1.33-2.54-2.15.02-1.06 1.18-1.64 2.62-1.64 1.2-.02 2.1.25 2.84.57l.34.16.73-4.54zm8.08 9.96h-2.22c-.67 0-1.18-.2-1.46-.87l-4.15-9.32h2.7l.53 1.5h3.3l.3-1.5h2.34l-1.35 10.2zm-2.72-2.75l-1.28-3.5-1.03 3.5h2.3zm-22.25-7.2l-2.4 8.54-.6-3.1c-.2-.8-.78-1.3-1.66-1.56L1.5 8.9v1.24c.7.16 1.5.44 1.96.78.3.22.44.5.53.9l1.77 8.46h2.7l4.06-10.2H8.72z" fill="#1A1F71"/>
  </svg>
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
const RentalConditionsModal = ({ supplier, onClose }: { supplier: Supplier, onClose: () => void }) => {
    const workingHours = supplier.workingHours ? Object.entries(supplier.workingHours) : [];
    const gracePeriodInfo = supplier.gracePeriodDays ? `${supplier.gracePeriodDays} day(s)` : `${supplier.gracePeriodHours} hour(s)`;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col font-sans">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <img src={supplier.logo} alt={supplier.name} className="h-10 object-contain" />
                        <div>
                           <h3 className="font-bold text-lg text-slate-800">Rental Conditions</h3>
                           <p className="text-xs text-slate-500">Provided by {supplier.name}</p>
                        </div>
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
                                    <p className="text-xs text-slate-500">Must be in the main driver's name, with sufficient funds for the security deposit.</p>
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
    sessionStorage.setItem('hogicar_cars', JSON.stringify(cars));
  };

  return (
    <>
      {isConditionsModalOpen && <RentalConditionsModal supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}
      <div className="bg-white md:rounded-xl md:shadow-sm hover:shadow-lg border-b md:border border-slate-200 transition-all duration-300 py-3 md:p-4 w-full md:mb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-0">
              
              {/* --- LEFT COLUMN: IMAGE, SPECS, SUPPLIER --- */}
              <div className="md:col-span-2 flex flex-col justify-between">
                  <div> {/* Top Section for Car Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Image */}
                          <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="sm:col-span-1 flex items-center justify-center relative group">
                             <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-auto object-contain max-h-28 group-hover:scale-105 transition-transform duration-300" />
                             {promotionLabel ? (
                                 <span className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg md:rounded-tl-xl flex items-center gap-1">
                                     <Gift className="w-3 h-3"/> {promotionLabel}
                                 </span>
                             ) : car.tags && car.tags[0] && (
                                 <span className="absolute top-0 left-0 bg-[#0071c2] text-white text-xs font-bold px-2 py-0.5 rounded-br-lg md:rounded-tl-xl">
                                     {car.tags[0]}
                                 </span>
                             )}
                          </Link>
                          
                          {/* Title & Specs */}
                          <div className="sm:col-span-2">
                              <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="group">
                                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{car.displayName}</h3>
                              </Link>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  or similar {car.category}
                                  <Info className="w-3 h-3 text-slate-400" />
                              </p>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs">
                                  <div className="flex items-center gap-2 text-slate-700"><Users className="w-4 h-4 text-slate-500"/><span>{car.passengers} seats</span></div>
                                  <div className="flex items-center gap-2 text-slate-700"><Briefcase className="w-4 h-4 text-slate-500"/><span>{car.bags} bags</span></div>
                                  <div className="flex items-center gap-2 text-slate-700"><AutomaticIcon /><span>{car.transmission}</span></div>
                                  <div className="flex items-center gap-2 text-slate-700"><CarDoorIcon /><span>{car.doors} doors</span></div>
                                  <div className="flex items-center gap-2 text-slate-700"><GaugeCircle className="w-4 h-4 text-slate-500"/><span>{car.unlimitedMileage ? 'Unlimited' : 'Limited'} mileage</span></div>
                                  <div className="flex items-center gap-2 text-slate-700"><Fuel className="w-4 h-4 text-slate-500"/><span>{car.fuelPolicy}</span></div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Recent Booking Info */}
                  {recentBookingInfo.isRecent && (
                    <div className="mt-4">
                      <div className="bg-orange-50 text-orange-700 text-xs font-bold p-2 rounded-lg flex items-center gap-2 border border-orange-100 animate-flip-in opacity-0">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        <span>{recentBookingInfo.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Section for Supplier Info */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                          <img src={car.supplier.logo} alt={car.supplier.name} className="h-14 w-auto max-w-40 object-contain" />
                          <div className="border-l border-slate-200 pl-5 group">
                              <div className="flex items-center gap-1 relative">
                                  <div className="bg-blue-600 text-white text-[10px] font-bold w-6 h-5 flex items-center justify-center rounded">
                                      {car.supplier.rating}
                                  </div>
                                  <p className="text-xs font-bold text-slate-700">{getRatingDescription(car.supplier.rating)}</p>
                                  {car.detailedRatings && <DetailedRatingsTooltip ratings={car.detailedRatings} />}
                              </div>
                              <p className="text-[10px] text-slate-500">{Math.round(car.supplier.rating * 250)}+ reviews</p>
                               <button onClick={() => setIsConditionsModalOpen(true)} className="text-[10px] text-blue-600 hover:underline font-medium mt-1">
                                  Rental Conditions
                              </button>
                          </div>
                      </div>
                      
                      {(() => {
                          const detail = car.locationDetail.toLowerCase();
                          if (detail.includes('in terminal')) {
                              return (
                                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 font-bold px-2 py-1 rounded-full text-[10px]">
                                      <Plane className="w-3 h-3" />
                                      In Terminal
                                  </span>
                              );
                          }
                          if (detail.includes('meet & greet')) {
                              return (
                                  <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 font-bold px-2 py-1 rounded-full text-[10px]">
                                      <Handshake className="w-3 h-3" />
                                      Meet & Greet
                                  </span>
                              );
                          }
                          if (detail.includes('shuttle')) {
                              return (
                                  <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 font-bold px-2 py-1 rounded-full text-[10px]">
                                      <Truck className="w-3 h-3" />
                                      Shuttle Bus
                                  </span>
                              );
                          }
                          return (
                              <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-full text-[10px]">
                                 {car.locationDetail}
                              </span>
                          );
                      })()}

                  </div>
              </div>

              {/* --- RIGHT COLUMN: PRICE & CTA --- */}
              <div className="md:col-span-1 flex flex-col justify-end md:border-l md:border-slate-100 md:pl-4 pt-4 md:pt-0 border-t border-slate-100">
                  <div className="text-right flex flex-col items-end">
                      <div>
                          <p className="font-bold text-slate-900 text-lg">
                              Total: {getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(2)}
                          </p>
                          <p className="text-green-800 text-sm font-medium mt-1">
                              Pay now: {getCurrencySymbol()}{convertPrice(totalCommissionAmount).toFixed(2)}
                          </p>
                      </div>
                      <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="mt-2 w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-transform active:scale-95 text-center text-sm">
                          View Deal
                      </Link>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};

export default CarCard;