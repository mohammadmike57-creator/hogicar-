




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
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-md">
        <rect width="38" height="24" rx="3" fill="white"/>
        <path d="M24.738 11.235C24.738 8.163 28.104 6.819 29.838 6.171L30.078 6.063C30.294 5.964 30.45 5.796 30.45 5.589V5.535C30.45 5.202 30.15 4.986 29.85 4.986H26.586C26.214 4.986 25.968 5.274 25.902 5.631L24.966 11.235H24.738ZM34.206 17.613L37.518 4.986H34.938L31.626 17.613H34.206ZM23.838 17.613H26.73L27.666 12.006C27.732 11.649 27.486 11.361 27.114 11.361H23.01C22.653 11.361 22.386 11.616 22.302 11.961L19.23 17.613H22.098L22.653 14.679H25.926L25.434 17.613H23.838ZM17.43 17.613L14.118 4.986H11.25L7.938 17.613H10.746L11.31 14.535H14.886L15.342 17.613H17.43ZM12.21 8.847L13.11 12.987H13.218L14.118 8.847L12.21 8.847ZM5.766 5.607C5.55 5.283 5.058 5.043 4.458 5.043C3.426 5.043 2.538 5.643 2.538 6.84C2.538 7.749 3.198 8.253 3.846 8.586C4.548 8.946 4.848 9.198 4.848 9.543C4.848 9.936 4.41 10.164 3.834 10.164C3.048 10.164 2.592 9.924 2.25 9.531L1.71 9.873C2.106 10.491 2.91 10.8 3.93 10.8C5.07 10.8 6.042 10.2 6.042 8.973C6.042 7.869 5.25 7.26 4.446 6.858C3.762 6.513 3.426 6.297 3.426 5.925C3.426 5.517 3.822 5.322 4.35 5.322C4.908 5.322 5.262 5.466 5.49 5.751L5.766 5.607Z" fill="#142688"/>
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