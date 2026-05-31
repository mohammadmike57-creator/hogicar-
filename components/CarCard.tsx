




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
    const depositText = car.deposit > 0 ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'No deposit listed';
    const excessAmount = (car as any).excess;
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
                                <PolicyRow label="Rating" value={`${supplier.rating}/5 - ${getRatingDescription(supplier.rating)}`} tone="good" />
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

      {/* PREMIUM CARD DESIGN */}
      <div className="relative bg-white rounded-[24px] border border-black/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 w-full overflow-hidden group/card">

        {/* Hogicar Choice Badge - Top Right */}
        {car.hogicarChoice && (
          <div className="absolute top-5 right-5 z-20 bg-[#F57C00] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Award className="w-4 h-4 fill-white/30" />
            <span className="text-xs font-bold tracking-wide">HogiCar Choice</span>
          </div>
        )}

        <div className="p-5 md:p-6">
          {/* TOP SECTION - Vehicle Info & Image */}
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-5">

            {/* Left: Vehicle Name & Category */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar}>
                  <h3 className="text-2xl md:text-[32px] font-bold text-[#111827] leading-tight hover:text-[#1180C4] transition-colors mb-1">
                    {car.displayName}
                  </h3>
                </Link>
                <p className="text-sm text-[#6B7280] font-medium">or similar vehicle</p>
              </div>

              {/* Best Value Badge */}
              {(car.promotionPercent > 0 || car.supplier.rating >= 4.5) && (
                <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#15803D] px-3 py-1.5 rounded-full text-xs font-bold mb-4">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Best Value</span>
                </div>
              )}

              {/* Premium Feature Chips - Horizontal Scroll */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] px-3 py-2.5 shrink-0">
                  <Users className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm font-semibold text-[#111827]">{car.passengers} Seats</span>
                </div>

                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] px-3 py-2.5 shrink-0">
                  <div className="text-[#6B7280] scale-90"><AutomaticIcon /></div>
                  <span className="text-sm font-semibold text-[#111827]">{car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}</span>
                </div>

                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] px-3 py-2.5 shrink-0">
                  <Briefcase className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm font-semibold text-[#111827]">{car.bags} Bags</span>
                </div>

                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] px-3 py-2.5 shrink-0">
                  <Fuel className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm font-semibold text-[#111827]">{car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to Full' : car.fuelPolicy}</span>
                </div>

                {car.unlimitedMileage && (
                  <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] px-3 py-2.5 shrink-0">
                    <GaugeCircle className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-sm font-semibold text-[#111827]">Unlimited Mileage</span>
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div className="mt-4 flex items-start gap-2 text-sm text-[#6B7280]">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-[#111827]">{pickupCode || 'Pickup Location'}</p>
                  <p className="text-xs">
                    {(() => {
                      const pickupType = car.supplier?.pickupType;
                      if (pickupType === 'IN_TERMINAL') return 'In Terminal';
                      if (pickupType === 'MEET_AND_GREET') return 'Meet & Greet';
                      if (pickupType === 'SHUTTLE_BUS') return 'Shuttle Bus';
                      return car.locationDetail || 'See details';
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Large Vehicle Image */}
            <div className="md:w-[40%] flex items-center justify-center">
              <Link to={`/car/${car.id}?${searchParams}`} state={{ cars: cars }} onClick={handleSelectCar} className="relative w-full">
                <div className="relative aspect-[4/3] md:aspect-[16/11] w-full">
                  <img
                    src={displayImage}
                    alt={`${car.make} ${car.model}`}
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    className="w-full h-full object-contain drop-shadow-lg group-hover/card:scale-105 transition-transform duration-500"
                  />

                  {promotionLabel && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <Tag className="w-3 h-3 fill-white/30" />
                      {promotionLabel}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* MIDDLE SECTION - Supplier Trust */}
          <div className="flex items-center justify-between gap-4 py-4 border-y border-black/[0.06] mb-5">

            {/* Supplier Logo */}
            <div className="flex items-center gap-3">
              <img
                src={car.supplier.logo || (car.supplier as any).logoUrl}
                alt={car.supplier.name}
                className="h-8 md:h-10 w-auto object-contain max-w-[120px]"
              />
            </div>

            {/* Supplier Rating */}
            <div
              className="flex items-center gap-2 cursor-pointer group/rating relative"
              onMouseEnter={() => setShowRatingsTooltip(true)}
              onMouseLeave={() => setShowRatingsTooltip(false)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRatingsTooltip(!showRatingsTooltip);
              }}
            >
              <div className="text-right">
                <p className="text-xs font-bold text-[#6B7280]">
                  ⭐ {getRatingDescription(car.supplier.rating)}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">2000+ Reviews</p>
              </div>
              <div className="bg-[#111827] text-white text-base font-black w-11 h-11 flex items-center justify-center rounded-xl shadow-md">
                {car.supplier.rating}
              </div>
              {car.detailedRatings && <DetailedRatingsTooltip ratings={car.detailedRatings} visible={showRatingsTooltip} align="right" />}
            </div>

            {/* Trust Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
              <Check className="w-4 h-4" />
              <span>Verified Supplier</span>
            </div>
          </div>

          {/* BOTTOM SECTION - Price & CTA */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">

            {/* Price Container - Highlighted */}
            <div className="flex-1 bg-[#F8FAFC] rounded-[16px] p-4 md:p-5">
              <p className="text-xs font-semibold text-[#6B7280] mb-2">Price for {days} days</p>

              <div className="flex items-baseline gap-2 mb-3">
                {car.promotionPercent > 0 && (
                  <span className="text-base text-[#9CA3AF] line-through font-semibold">
                    {getCurrencySymbol()}{convertPrice(totalFinalPrice / (1 - car.promotionPercent/100)).toFixed(2)}
                  </span>
                )}
                <span className="text-3xl md:text-[38px] font-extrabold text-[#111827] tracking-tight">
                  {getCurrencySymbol()}{convertPrice(totalFinalPrice).toFixed(2)}
                </span>
              </div>

              {/* Benefits List */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
                  <Check className="w-4 h-4" />
                  <span>Free Cancellation</span>
                </div>
                {car.supplier.bookingMode === 'FREE_SALE' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
                    <Check className="w-4 h-4" />
                    <span>Instant Confirmation</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
                  <Check className="w-4 h-4" />
                  <span>Pay Later Available</span>
                </div>
              </div>

              {/* Social Proof */}
              {recentBookingInfo.isRecent && (
                <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex items-center gap-2 text-xs text-[#F57C00] font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{recentBookingInfo.message}</span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="md:w-[200px] space-y-2">
              <Link
                to={`/car/${car.id}?${searchParams}`}
                state={{ cars: cars }}
                onClick={handleSelectCar}
                className="block w-full h-14 bg-[#1180C4] hover:bg-[#0d6aa8] text-white font-bold text-base rounded-[18px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>View Deal</span>
                <ChevronRight className="w-5 h-5" />
              </Link>

              <button
                onClick={() => setIsConditionsModalOpen(true)}
                className="w-full text-xs text-[#6B7280] hover:text-[#1180C4] font-semibold underline-offset-2 hover:underline transition-colors"
              >
                View rental conditions
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarCard;
