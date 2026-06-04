




import * as React from 'react';
import { Users, Info, GaugeCircle, Briefcase, Fuel, Plane, Gift, X, FileText, Shield, CreditCard as CreditCardIcon, Handshake, Truck, Zap, Clock, MapPin, Phone, Building, Bus, Award, Tag, Check, CalendarCheck, Wind, ChevronRight } from 'lucide-react';
import { Car as CarType, Supplier, CarRatings } from '../types';
import { DetailedRatingsTooltip } from './DetailedRatingsTooltip';
import { getRatingDescription, getRatingColor, getRatingTextColor } from '../utils/ratings';
import { Link } from 'react-router-dom';
import { calculatePrice } from '../services/mockData';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';
import { persistSelectedCar } from '../utils/storage';

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
    const depositText = car.deposit > 0 ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'No deposit listed';
    const excessAmount = car.excess;
    const excessText = excessAmount > 0 ? `${getCurrencySymbol()}${convertPrice(excessAmount).toFixed(2)}` : 'See supplier terms';
    const pickupType = supplier.pickupType || (car as any).pickupType;
    const pickupTypeLabel =
        pickupType === 'IN_TERMINAL' ? 'In terminal' :
        pickupType === 'MEET_AND_GREET' ? 'Meet & greet' :
        pickupType === 'SHUTTLE_BUS' ? 'Shuttle bus' :
        car.locationDetail || 'Location details at pickup';
    const supplierLogo = supplier.logo || (supplier as any).logoUrl;
    const supplierName = supplier.name || 'Rental supplier';
    const paymentTypeLabel =
        supplier.commissionType === 'FULL_PREPAID' ? 'Full prepayment online' :
        supplier.commissionType === 'PARTIAL_PREPAID' ? 'Partial payment online' :
        'Pay at rental desk';

    const ConditionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008009]/10 text-[#008009]">{icon}</span>
                {title}
            </h4>
            {children}
        </section>
    );

    const PolicyRow = ({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) => (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
            <span className="text-xs font-bold text-slate-500">{label}</span>
            <span className={`text-right text-xs font-black ${tone === 'good' ? 'text-[#008009]' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col font-sans overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start gap-4 p-4 sm:p-5 border-b border-slate-200 bg-white">
                    <div className="flex min-w-0 items-center gap-4">
                        {!car.hogicarChoice ? (
                            <>
                                <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                                    {supplierLogo ? (
                                        <img src={supplierLogo} alt={supplierName} className="max-h-10 max-w-full object-contain" />
                                    ) : (
                                        <Building className="h-7 w-7 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#008009]">Rental conditions</p>
                                   <h3 className="text-lg font-black text-slate-950 truncate">{supplierName}</h3>
                                   <p className="text-xs font-bold text-slate-500 truncate">{car.displayName || `${car.make} ${car.model}`}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-slate-900 rounded-xl flex shrink-0 items-center justify-center shadow-lg border border-amber-500/30">
                                    <Award className="w-8 h-8 text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Rental conditions</p>
                                   <h3 className="text-lg font-black text-slate-950 truncate">Hogicar verified fleet</h3>
                                   <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Exclusive supplier conditions</p>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors shrink-0"><X className="w-5 h-5"/></button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deposit</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{depositText}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Excess</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{excessText}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mileage</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{car.unlimitedMileage ? 'Unlimited' : 'Limited'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pickup</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{pickupTypeLabel}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
                        <div className="space-y-4">
                            <ConditionCard icon={<CreditCardIcon className="h-4 w-4" />} title="Payment, deposit and card rules">
                                <PolicyRow label="Payment type" value={paymentTypeLabel} />
                                <PolicyRow label="Security deposit" value={depositText} tone={car.deposit > 0 ? 'warn' : 'default'} />
                                <PolicyRow label="Accepted cards" value={<span className="inline-flex items-center gap-1.5"><VisaIcon /><MastercardIcon /><AmexIcon /></span>} />
                                <PolicyRow label="Card holder" value="Main driver's name required" />
                                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">
                                    A physical credit card may be required at the rental desk for the refundable deposit. Prepaid, virtual, or third-party cards may be refused by the supplier.
                                </p>
                            </ConditionCard>

                            <ConditionCard icon={<Users className="h-4 w-4" />} title="Required at pick-up">
                                <div className="grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <Shield className="mb-2 h-4 w-4 text-[#008009]" />
                                        <p className="text-xs font-black text-slate-900">Driving license</p>
                                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Held for at least 1 year. International permit may be required.</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <Users className="mb-2 h-4 w-4 text-[#008009]" />
                                        <p className="text-xs font-black text-slate-900">Passport or ID</p>
                                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">A valid photo ID matching the main driver details.</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <CreditCardIcon className="mb-2 h-4 w-4 text-[#008009]" />
                                        <p className="text-xs font-black text-slate-900">Credit card</p>
                                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Must have enough available funds for the deposit.</p>
                                    </div>
                                </div>
                            </ConditionCard>

                            <ConditionCard icon={<Shield className="h-4 w-4" />} title="Insurance and protection included">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className={`rounded-lg border p-3 ${supplier.includesCDW ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                        <div className="flex items-center gap-2">
                                            <Check className={`h-4 w-4 ${supplier.includesCDW ? 'text-[#008009]' : 'text-slate-400'}`} />
                                            <p className="text-xs font-black text-slate-900">Collision Damage Waiver</p>
                                        </div>
                                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{supplier.includesCDW ? 'Included by this supplier.' : 'Check supplier terms for availability.'}</p>
                                    </div>
                                    <div className={`rounded-lg border p-3 ${supplier.includesTP ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                        <div className="flex items-center gap-2">
                                            <Check className={`h-4 w-4 ${supplier.includesTP ? 'text-[#008009]' : 'text-slate-400'}`} />
                                            <p className="text-xs font-black text-slate-900">Theft Protection</p>
                                        </div>
                                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{supplier.includesTP ? 'Included by this supplier.' : 'Check supplier terms for availability.'}</p>
                                    </div>
                                </div>
                                <PolicyRow label="Damage excess" value={excessText} />
                                <PolicyRow label="One-way fee" value={supplier.oneWayFee ? `${getCurrencySymbol()}${convertPrice(supplier.oneWayFee).toFixed(2)}` : 'Not listed'} />
                            </ConditionCard>

                            <ConditionCard icon={<Fuel className="h-4 w-4" />} title="Mileage, fuel and vehicle policy">
                                <PolicyRow label="Mileage" value={car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'} tone={car.unlimitedMileage ? 'good' : 'default'} />
                                <PolicyRow label="Fuel policy" value={car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car.fuelPolicy.replace(/_/g, ' ')} />
                                <PolicyRow label="Transmission" value={car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'} />
                                <PolicyRow label="Vehicle class" value={`${car.category} or similar`} />
                            </ConditionCard>

                            <ConditionCard icon={<FileText className="h-4 w-4" />} title="Supplier rental terms">
                                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 custom-scrollbar">
                                    <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-600">
                                        {supplier.termsAndConditions || 'No additional supplier terms have been provided for this vehicle. Standard rental desk policies may still apply at pickup.'}
                                    </p>
                                </div>
                            </ConditionCard>
                        </div>

                        <aside className="space-y-4">
                            <ConditionCard icon={<Building className="h-4 w-4" />} title="Supplier and location">
                                <PolicyRow label="Supplier" value={supplierName} />
                                <PolicyRow label="Rating" value={`${supplier.rating}/5 - ${getRatingDescription(supplier.rating)}`} tone={supplier.rating >= 4 ? 'good' : supplier.rating >= 3 ? 'default' : 'warn'} />
                                <PolicyRow label="Pickup type" value={pickupTypeLabel} />
                                {supplier.address && (
                                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                        <p className="text-xs font-semibold leading-relaxed text-slate-600">{supplier.address}</p>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                                        <p className="text-xs font-semibold text-slate-600">{supplier.phone}</p>
                                    </div>
                                )}
                            </ConditionCard>

                            <ConditionCard icon={<Clock className="h-4 w-4" />} title="Pickup and return rules">
                                <PolicyRow label="Booking mode" value={supplier.bookingMode === 'FREE_SALE' ? 'Instant confirmation' : 'On request'} tone={supplier.bookingMode === 'FREE_SALE' ? 'good' : 'default'} />
                                <PolicyRow label="Lead time" value={supplier.minBookingLeadTime ? `${supplier.minBookingLeadTime} hour(s)` : 'Not listed'} />
                                <PolicyRow label="Late return grace" value={gracePeriodInfo} />
                                {workingHours.length > 0 && (
                                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Opening hours</p>
                                        <div className="space-y-1.5">
                                            {workingHours.map(([day, hours]) => (
                                                <div key={day} className="flex justify-between gap-3 text-xs">
                                                    <span className="capitalize font-semibold text-slate-500">{day}</span>
                                                    <span className="text-right font-black text-slate-800">{hours}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ConditionCard>

                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="flex items-start gap-2">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#008009]" />
                                    <p className="text-xs font-bold leading-relaxed text-emerald-800">
                                        Review these conditions before booking. Final acceptance depends on presenting the required documents and card at pickup.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
                 {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-500">These conditions are provided by the supplier and may be checked again at pickup.</p>
                    <button onClick={onClose} className="bg-[#008009] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#006607] shadow-sm transition-transform active:scale-95">
                        Got it
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
  isComparing?: boolean;
  showCompareControl?: boolean;
  showMobileCompareControl?: boolean;
  onCompareToggle?: () => void;
}

const CarCard: React.FC<CarCardProps> = ({ 
    car, 
    cars, 
    days, 
    startDate, 
    endDate, 
    pickupCode, 
    dropoffCode,
    isComparing = false,
    showCompareControl = true,
    showMobileCompareControl = true,
    onCompareToggle
}) => {
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);
  const { convertPrice, getCurrencySymbol } = useCurrency();

  const { promotionLabel } = calculatePrice(car, days, startDate);

  // Use the single source of truth for pricing
  const search = { pickupDate: startDate, dropoffDate: endDate };
  const price = calcPricing(car, search);
  // FIX: Access the correct property 'finalTotal' instead of 'finalPrice'.
  const totalFinalPrice = price.finalTotal;
  const totalCommissionAmount = price.payNow;
  const payAtPickup = Math.max(totalFinalPrice - totalCommissionAmount, 0);


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
  const displayRatings = car.detailedRatings || {
    cleanliness: 85,
    condition: 82,
    valueForMoney: 80,
    pickupSpeed: 78,
    staffService: 84,
  };

  const ratingToDisplay = React.useMemo(() => {
    // If we have real detailed ratings, use them to calculate the average
    // to ensure the main rating reflects any changes in detailed ratings
    if (car.detailedRatings) {
      const values = Object.values(car.detailedRatings);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return parseFloat((avg / 20).toFixed(1));
    }
    // Fallback to the supplier's main rating
    return car.supplier.rating;
  }, [car.detailedRatings, car.supplier.rating]);

  const pickupType = car.supplier?.pickupType;
  const pickupTypeLabel =
    pickupType === 'IN_TERMINAL' ? 'Terminal pickup' :
    pickupType === 'MEET_AND_GREET' ? 'Meet & greet' :
    pickupType === 'SHUTTLE_BUS' ? 'Shuttle bus' :
    car.locationDetail || 'Pickup details';
  const desktopPickupTypeLabel =
    pickupType === 'IN_TERMINAL' ? 'In Terminal' :
    pickupType === 'MEET_AND_GREET' ? 'Meet & Greet' :
    pickupType === 'SHUTTLE_BUS' ? 'Shuttle Bus' :
    car.locationDetail || 'Pickup details';
  const DesktopPickupIcon =
    pickupType === 'IN_TERMINAL' ? Plane :
    pickupType === 'MEET_AND_GREET' ? Handshake :
    pickupType === 'SHUTTLE_BUS' ? Bus :
    Building;

  const handleSelectCar = () => {
    persistSelectedCar(car, cars);
  };

  return (
    <>
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}
      <div className={`bg-white rounded-2xl shadow-[0_10px_28px_-22px_rgba(0,128,9,0.75)] hover:shadow-[0_16px_40px_-18px_rgba(0,128,9,0.45)] border-2 transition-all duration-300 w-full group/card flex flex-col h-full md:hover:-translate-y-0.5 ${isComparing ? 'border-[#008009] ring-4 ring-emerald-50 shadow-[0_18px_42px_-20px_rgba(0,128,9,0.85)]' : 'border-[#008009]/45 hover:border-[#008009]'}`}>
          {/* Header Badge */}
          {car.hogicarChoice && (
            <div className="bg-gradient-to-r from-[#008009] via-[#00a30b] to-[#008009] text-white px-4 py-2 flex items-center justify-center gap-2 rounded-t-2xl">
                <Award className="w-4 h-4 text-white fill-white/20" />
                <span className="text-xs font-black uppercase tracking-widest">Hogicar Recommended</span>
            </div>
          )}

          <div className="p-4 md:hidden">
              <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                      {car.hogicarChoice && (
                        <span className="mb-2 inline-flex rounded-md bg-blue-900 px-2.5 py-1 text-xs font-bold text-white">Recommended</span>
                      )}
                      <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar}>
                          <h3 className="text-[1.7rem] font-black leading-tight tracking-tight text-slate-950">
                              {car.displayName || `${car.make} ${car.model}`}
                          </h3>
                      </Link>
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-blue-600">
                          or similar {car.category.toString().toLowerCase()} car <Info className="h-4 w-4" />
                      </p>
                  </div>

                  {showMobileCompareControl && (
                    <button
                      onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCompareToggle?.();
                      }}
                      aria-pressed={isComparing}
                      aria-label={isComparing ? 'Remove choice from comparison' : 'Add as comparison choice'}
                      className="flex shrink-0 items-center gap-2 pt-1 text-base font-semibold text-slate-900"
                    >
                        <span>Compare</span>
                        <span className={`relative flex h-7 w-12 items-center rounded-full p-1 transition-colors ${isComparing ? 'bg-blue-600 shadow-[0_8px_18px_-10px_rgba(37,99,235,0.8)]' : 'bg-slate-300'}`}>
                            <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isComparing ? 'translate-x-5' : 'translate-x-0'}`} />
                        </span>
                    </button>
                  )}
              </div>

              <div className="grid grid-cols-[1fr_45%] items-center gap-3">
                  <div className="space-y-3 text-slate-950">
                      <div className="flex items-center gap-3 text-lg font-semibold">
                          <Users className="h-6 w-6 stroke-[1.8px]" />
                          <span>{car.passengers} seats</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg font-semibold">
                          <div className="scale-125"><AutomaticIcon /></div>
                          <span>{car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg font-semibold">
                          <GaugeCircle className="h-6 w-6 stroke-[1.8px]" />
                          <span>{car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'}</span>
                      </div>
                  </div>
                  <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="flex items-center justify-center relative group/img-link">
                      <img
                        src={displayImage}
                        alt={`${car.make} ${car.model}`}
                        onError={() => setImageError(true)}
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-contain drop-shadow-2xl mix-blend-multiply transition-transform duration-500 ease-out"
                      />
                  </Link>
              </div>

              {/* Pickup location removed for mobile as per user request */}

              <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4">
                  <div className="min-w-0">
                      <img
                          src={car.supplier.logo || (car.supplier as any).logoUrl}
                          alt={car.supplier.name}
                          className="mb-3 h-10 max-w-[135px] object-contain"
                      />
                      <button
                        type="button"
                        className="group/rating relative flex items-center gap-4 text-left bg-slate-50/50 hover:bg-white p-3 -m-3 rounded-2xl transition-all active:scale-[0.98]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowRatingsTooltip(!showRatingsTooltip);
                        }}
                        aria-label="Show supplier rating details"
                      >
                          <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${getRatingColor(ratingToDisplay)} text-2xl font-black text-white shadow-xl shadow-slate-200/50 overflow-hidden`}>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                              <span className="relative z-10">{ratingToDisplay}</span>
                          </div>
                          <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-xl font-black leading-none ${getRatingTextColor(ratingToDisplay)} tracking-tight`}>
                                      {getRatingDescription(ratingToDisplay)}
                                  </span>
                                  <Info className="w-3.5 h-3.5 text-slate-300 group-hover/rating:text-slate-400 transition-colors" />
                              </div>
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Check className="w-3 h-3 text-[#008009]" />
                                  Trusted Supplier
                              </p>
                          </div>
                          <DetailedRatingsTooltip ratings={displayRatings} visible={showRatingsTooltip} align="left" />
                      </button>
                  </div>
                  <div className="text-right">
                      <p className="text-base font-medium text-slate-500">Price for {days} days:</p>
                      <p className="text-[2rem] font-black leading-none text-slate-950">{getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(0)}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsConditionsModalOpen(true);
                        }}
                        className="mt-2 text-right text-lg font-medium text-green-700 underline-offset-4 active:scale-[0.98]"
                      >
                          Free cancellation · Rental terms
                      </button>
                  </div>
              </div>

              <Link
                to={`/car/${car.id}?${searchParams}`}
                state={{ cars: cars }}
                onClick={handleSelectCar}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#008009] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg active:scale-[0.98]"
              >
                  View deal <ChevronRight className="h-5 w-5" />
              </Link>
          </div>

          <div className="hidden md:flex md:flex-row flex-grow">
              {/* Car Image Area */}
              <div className={`relative md:w-[28%] bg-gradient-to-br from-slate-50 to-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col p-2.5 group/img ${car.hogicarChoice ? '' : 'rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none'}`}>
                  <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="relative w-full aspect-[2.35/1] flex items-center justify-center mb-2 group/img-link">
                      <img
                        src={displayImage}
                        alt={`${car.make} ${car.model}`}
                        onError={() => setImageError(true)}
                        referrerPolicy="no-referrer"
                        loading="eager"
                        className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply transition-transform duration-500 ease-out z-10"
                      />

                      {promotionLabel && (
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-red-600 text-white text-[10px] md:text-xs font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg z-10">
                              <Tag className="w-3 h-3 md:w-3.5 md:h-3.5 fill-white/20"/> {promotionLabel}
                          </div>
                      )}
                  </Link>

                  {/* Supplier & Rating Block */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-auto w-full">
                      <img
                          src={car.supplier.logo || (car.supplier as any).logoUrl}
                          alt={car.supplier.name}
                          className="h-8 w-auto object-contain max-w-[105px]"
                      />
                      <div
                        className="flex items-center gap-3.5 group/rating relative cursor-pointer z-20 bg-slate-50/50 hover:bg-white p-2.5 pr-3 rounded-2xl border border-transparent hover:border-slate-100 transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowRatingsTooltip(!showRatingsTooltip);
                        }}
                      >
                          <div className="flex flex-col items-end">
                            <span className={`text-[13px] font-black leading-none mb-1.5 uppercase tracking-tight ${getRatingTextColor(ratingToDisplay)}`}>
                              {getRatingDescription(ratingToDisplay)}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">
                                  Supplier Score
                                </span>
                                <Info className="w-3 h-3 text-slate-300 group-hover/rating:text-slate-400 transition-colors" />
                            </div>
                          </div>
                          <div className={`relative ${getRatingColor(ratingToDisplay)} text-white text-lg font-black w-11 h-11 flex items-center justify-center rounded-xl shadow-lg shadow-slate-200 overflow-hidden ring-1 ring-white/20 shrink-0 transition-transform group-hover/rating:scale-105`}>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-40" />
                              <span className="relative z-10">{ratingToDisplay}</span>
                          </div>
                          <DetailedRatingsTooltip ratings={displayRatings} visible={showRatingsTooltip} align="right" />
                      </div>
                  </div>
              </div>

              <div className="flex-grow flex flex-col md:flex-row">
                  <div className="p-2.5 flex-grow border-b md:border-b-0 md:border-r border-slate-100">
                      {/* Title & Category */}
                      <div className="mb-2.5">
                          <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="bg-slate-100 text-slate-700 text-[10px] md:text-[9px] font-black px-2 py-1 md:px-1.5 md:py-0.5 rounded-md md:rounded-lg uppercase tracking-wide">
                                  {car.category}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] md:text-[9px] font-black px-2 py-1 md:px-1.5 md:py-0.5 rounded-md md:rounded-lg uppercase tracking-wide">
                                  <DesktopPickupIcon className="h-3 w-3" />
                                  {desktopPickupTypeLabel}
                              </span>
                          </div>
                          <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar}>
                              <h3 className="text-[0.95rem] font-black text-slate-900 leading-snug hover:text-[#008009] transition-colors uppercase tracking-tight line-clamp-1">
                                  {car.displayName}
                              </h3>
                          </Link>
                          <p className="text-[9px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                              or similar <Info className="w-2.5 h-2.5" />
                          </p>
                      </div>

                      {/* Specs Grid (Compact) */}
                      <div className="grid grid-cols-4 gap-1.5 mb-2 py-2 border-y border-slate-100 bg-slate-50 rounded px-2">
                          <div className="flex items-center gap-2 text-slate-600">
                              <Users className="w-3.5 h-3.5 text-slate-400"/>
                              <span className="text-[10px] font-bold">{car.passengers}<span className="hidden min-[390px]:inline ml-1">Adults</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400"/>
                              <span className="text-[10px] font-bold">{car.bags}<span className="hidden min-[390px]:inline ml-1">Bags</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                              <div className="text-slate-400 scale-100 md:scale-90"><AutomaticIcon /></div>
                              <span className="text-[10px] font-bold">
                                  {car.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}
                              </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                              <Wind className="w-3.5 h-3.5 text-slate-400"/>
                              <span className="text-[10px] font-bold">A/C</span>
                          </div>
                      </div>

                      {/* Included Features checklist */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-[#008009] border border-emerald-100">
                              <CalendarCheck className="w-3 h-3 stroke-[2.5px] shrink-0" />
                              <span className="truncate">Free cancellation</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-700 border border-slate-100">
                              <Fuel className="w-3 h-3 text-[#008009] stroke-[2.5px] shrink-0" />
                              <span className="truncate">{car.fuelPolicy === 'FULL_TO_FULL' ? 'Fair fuel' : car.fuelPolicy}</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-700 border border-slate-100">
                              <GaugeCircle className="w-3 h-3 text-[#008009] stroke-[2.5px] shrink-0" />
                              <span className="truncate">{car.unlimitedMileage ? 'Unlimited' : 'Limited'} mileage</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[9px] font-bold text-blue-600 border border-blue-100">
                              <Zap className="w-3 h-3 fill-blue-600/20 shrink-0" />
                              <span className="truncate">Instant Confirmation</span>
                          </div>
                      </div>

                      <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5">
                          <div className="flex min-w-0 items-center gap-2">
                              <DesktopPickupIcon className="h-3.5 w-3.5 shrink-0 text-[#008009]" />
                              <div className="min-w-0">
                                  <p className="truncate text-[9px] font-black uppercase tracking-wide text-slate-900">{desktopPickupTypeLabel}</p>
                                  <p className="truncate text-[9px] font-semibold text-slate-500">{car.locationDetail || car.location || 'Pickup location'}</p>
                              </div>
                          </div>
                          <button
                            onClick={() => setIsConditionsModalOpen(true)}
                            className="shrink-0 text-[9px] font-black uppercase tracking-wide text-[#008009] hover:text-slate-950"
                          >
                              Rental terms
                          </button>
                      </div>

                      {/* Social Proof Message */}
                      {recentBookingInfo.isRecent && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg mt-3 md:mt-2">
                           <Clock className="w-4 h-4 md:w-3 md:h-3 text-[#008009]" />
                           <span className="text-xs md:text-[10px] font-black text-[#008009] uppercase tracking-wide">{recentBookingInfo.message}</span>
                        </div>
                      )}
                  </div>

                  {/* Price & CTA Section */}
                  <div className="p-2.5 md:w-[29%] bg-slate-50 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
                      <div>
                          {/* Pricing Info */}
                          <div className="flex flex-col mb-2.5">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="text-[10px] md:text-[9px] text-slate-500 font-black uppercase tracking-wide">Total <span>for {days} days</span></p>
                                {ratingToDisplay >= 4.5 && (
                                    <div className="flex shrink-0 items-center gap-1 text-[9px] md:text-[10px] font-black text-[#008009] uppercase bg-[#008009]/10 px-2 py-1 rounded-md">
                                        <Award className="w-3 h-3" /> <span>Best Value</span>
                                    </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-baseline gap-2">
                                  {car.promotionPercent > 0 && (
                                      <span className="text-xs text-slate-400 line-through font-bold">
                                          {getCurrencySymbol()}{convertPrice(totalFinalPrice / (1 - car.promotionPercent/100)).toFixed(2)}
                                      </span>
                                  )}
                                  <span className="text-lg font-black text-slate-900 tracking-tight">
                                      {getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(2)}
                                  </span>
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold mt-1 flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5" /> All taxes included
                              </p>
                          </div>

                          <div className="mb-3 grid grid-cols-2 gap-1.5">
                              <div className="p-2 bg-white rounded-xl border border-[#008009]/15 shadow-sm">
                                  <p className="text-[8px] text-emerald-700 font-black uppercase tracking-wide mb-1 flex items-center gap-1">
                                      <CreditCardIcon className="w-3 h-3" /> Pay now
                                  </p>
                                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                      <span className="text-sm font-black text-[#008009] tracking-tight">
                                          {getCurrencySymbol()}{convertPrice(totalCommissionAmount).toFixed(2)}
                                      </span>
                                  </div>
                              </div>
                              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-wide mb-1 flex items-center gap-1">
                                      <Building className="w-3 h-3" /> At pickup
                                  </p>
                                  <span className="text-sm font-black text-slate-900 tracking-tight">
                                      {getCurrencySymbol()}{convertPrice(payAtPickup).toFixed(2)}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          {showCompareControl && (
                            <button
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onCompareToggle?.();
                              }}
                              aria-pressed={isComparing}
                              aria-label={isComparing ? 'Remove choice from comparison' : 'Add as comparison choice'}
                              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] transition-all active:scale-[0.98] ${
                                  isComparing
                                    ? 'border-[#008009] bg-emerald-50 text-[#008009]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#008009] hover:text-[#008009]'
                              }`}
                            >
                                <span>Compare this car</span>
                                <span className={`relative flex h-[18px] w-8 items-center rounded-full p-0.5 transition-colors ${isComparing ? 'bg-[#008009]' : 'bg-slate-200'}`}>
                                    <span className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${isComparing ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                </span>
                            </button>
                          )}
                          {/* CTA Button */}
                          <Link
                            to={`/car/${car.id}?${searchParams}`}
                            state={{ cars: cars }}
                            onClick={handleSelectCar}
                            className="group/btn block w-full bg-[#008009] hover:bg-[#006607] text-white font-black py-2.5 rounded-xl shadow-[0_8px_18px_-7px_rgba(0,128,9,0.55)] hover:shadow-xl transition-all active:scale-[0.97] text-center text-[10px] uppercase tracking-wider relative overflow-hidden"
                          >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                  View Deal <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"/>
                              </span>
                          </Link>

                      </div>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};

export default CarCard;
