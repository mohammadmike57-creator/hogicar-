import * as React from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
const getPromoCode = (code: string): PromoCode | undefined => {
  return undefined; // Mock data removed
};
import {
  Check, ShieldCheck, User, Users, Briefcase, Fuel, Info, CreditCard as CreditCardIcon,
  ShieldAlert, Calendar, Tag, Car as CarIcon, Snowflake, XCircle, FileText, Clock,
  Navigation, Baby, PlusCircle, Star, Sparkles, MapPin, CheckCircle, GaugeCircle, Hash, X,
  ArrowRight, Shield, Wifi, Wind, Thermometer, Smartphone, Battery, Coffee, Gift, Award,
  Heart, Share2, ChevronDown, ChevronUp, Phone, Building, Bus, Handshake, Loader2,
  DollarSign, Zap, ThumbsUp, Globe, Headphones, Plane, PlaneLanding, PlaneTakeoff
} from 'lucide-react';
import { Car, CommissionType, Supplier, PromoCode, Extra, CarCategory } from '../types';
import { DetailedRatingsTooltip } from '../components/DetailedRatingsTooltip';
import { getRatingDescription, getRatingColor, getRatingTextColor, formatCategoryName, getCarRatings } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { Logo } from '../components/Logo';
import { calcPricing, rentalDays } from '../utils/pricing';
import { supplierApi } from '../lib/api';
import { persistSelectedCar } from '../utils/storage';
import { loadCars } from '../utils/loadCars';

// ==================== Helper Components ====================

const StructuredData: React.FC<{ car: Car; total: number; currencyCode: string }> = ({ car, total, currencyCode }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${car.make} ${car.model}`,
    "image": car.image,
    "description": `Rent a ${car.make} ${car.model} (${formatCategoryName(car.category)}) from ${car.supplier.name}. Features include ${car.passengers} seats and space for ${car.bags} bags.`,
    "brand": { "@type": "Brand", "name": car.make },
    "vehicleModelDate": car.year,
    "vehicleTransmission": car.transmission,
    "offers": {
      "@type": "Offer",
      "price": total.toFixed(2),
      "priceCurrency": currencyCode,
      "availability": car.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": { "@type": "Organization", "name": car.supplier.name }
    }
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group inline-flex ml-1">
    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-2 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
    </div>
  </div>
);

const CarDoorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M19 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9"/><path d="M12 15V6"/><path d="M4 15h16"/><path d="M15 11h-1"/>
  </svg>
);

const AutomaticIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}>
    <path d="M12 2v2.34"/><path d="M12 10.32v1.34"/><path d="M7.11 4.41 8 6.1"/><path d="M16 6.1l.89-1.69"/><path d="M4.41 16.89l1.69-.89"/><path d="M17.9 16l1.69.89"/><path d="M2 12h2.34"/><path d="M19.66 12H22"/><path d="M12 14.66V16"/><path d="M12 22v-2.34"/><path d="m15 12-3-3-3 3"/><path d="M12 9v13"/>
  </svg>
);

// Payment Icons (same as your existing)
const VisaIcon = () => (
  <div className="w-[38px] h-[24px] bg-white rounded shadow-sm flex items-center justify-center overflow-hidden px-1">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg"
      alt="Visa"
      className="w-full h-auto object-contain"
    />
  </div>
);
const MastercardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="white" rx="3"/><circle cx="13" cy="12" r="7" fill="#EA001B"/><circle cx="25" cy="12" r="7" fill="#F79E1B"/><path d="M20.5 12a7.002 7.002 0 01-7.5-6.96A7.002 7.002 0 0013 19a7.002 7.002 0 007.5-6.96A7.002 7.002 0 0120.5 12z" fill="#FF5F00"/></svg> );
const AmexIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded shadow-sm"><rect width="38" height="24" fill="#006FCF" rx="3"/><rect x="4" y="4" width="30" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/><text x="19" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white">AMEX</text></svg> );

// Rental Conditions Modal
const RentalConditionsModal = ({ car, supplier, onClose }: { car: Car; supplier: Supplier; onClose: () => void }) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const workingHours = supplier.workingHours ? Object.entries(supplier.workingHours) : [];
  const gracePeriodInfo = supplier.gracePeriodDays ? `${supplier.gracePeriodDays} day(s)` : `${supplier.gracePeriodHours} hour(s)`;
  const depositText = car.deposit > 0 ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'No deposit listed';
  const excessAmount = car.excess;
  const excessText = excessAmount > 0 ? `${getCurrencySymbol()}${convertPrice(excessAmount).toFixed(2)}` : 'See supplier terms';
  const supplierLogo = supplier.logo || (supplier as any).logoUrl;
  const pickupTypeLabel =
    supplier.pickupType === 'IN_TERMINAL' ? 'In terminal' :
    supplier.pickupType === 'MEET_AND_GREET' ? 'Meet & greet' :
    supplier.pickupType === 'SHUTTLE_BUS' ? 'Shuttle bus' :
    car.locationDetail || 'Location details at pickup';
  const paymentTypeLabel =
    supplier.commissionType === 'FULL_PREPAID' ? 'Full prepayment online' :
    supplier.commissionType === 'PARTIAL_PREPAID' ? 'Partial payment online' :
    'Pay at rental desk';

  const PolicyRow = ({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) => (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className={`text-right text-xs font-black ${tone === 'good' ? 'text-[#008009]' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  );

  const ConditionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008009]/10 text-[#008009]">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col font-sans overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-4 p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex min-w-0 items-center gap-4">
            {(car as any).isHogicarChoiceBranded ? (
              <>
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex shrink-0 items-center justify-center shadow-lg border border-amber-500/30">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Rental conditions</p>
                   <h3 className="text-lg font-black text-slate-950 truncate">Hogicar verified fleet</h3>
                   <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Hogicar Exclusive Verified Fleet</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                  {supplierLogo === 'HOGICAR_CHOICE_LOGO' ? (
                    <Logo className="h-8 w-auto max-w-[150px]" />
                  ) : supplierLogo ? (
                    <img src={supplierLogo} alt={supplier.name} className="max-h-10 max-w-full object-contain" />
                  ) : (
                    <Building className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#008009]">Rental conditions</p>
                  <h3 className="text-lg font-black text-slate-950 truncate">{supplier.name}</h3>
                  <p className="text-xs font-bold text-slate-500 truncate">{car.displayName || `${car.make} ${car.model}`}</p>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 shrink-0"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deposit</p><p className="mt-1 text-sm font-black text-slate-950">{depositText}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Excess</p><p className="mt-1 text-sm font-black text-slate-950">{excessText}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mileage</p><p className="mt-1 text-sm font-black text-slate-950">{car.unlimitedMileage ? 'Unlimited' : 'Limited'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pickup</p><p className="mt-1 text-sm font-black text-slate-950">{pickupTypeLabel}</p></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
            <div className="space-y-4">
              <ConditionCard icon={<CreditCardIcon className="h-4 w-4" />} title="Payment, deposit and card rules">
                <PolicyRow label="Payment type" value={paymentTypeLabel} />
                <PolicyRow label="Security deposit" value={depositText} tone={car.deposit > 0 ? 'warn' : 'default'} />
                <PolicyRow label="Accepted cards" value={<span className="inline-flex items-center gap-1.5"><VisaIcon /><MastercardIcon /><AmexIcon /></span>} />
                <PolicyRow label="Card holder" value="Main driver's name required" />
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">A physical credit card may be required at the rental desk. Prepaid, virtual, or third-party cards may be refused by the supplier.</p>
              </ConditionCard>

              <ConditionCard icon={<Users className="h-4 w-4" />} title="Required at pick-up">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><Shield className="mb-2 h-4 w-4 text-[#008009]" /><p className="text-xs font-black text-slate-900">Driving license</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Held for at least 1 year. International permit may be required.</p></div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><Users className="mb-2 h-4 w-4 text-[#008009]" /><p className="text-xs font-black text-slate-900">Passport or ID</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">A valid photo ID matching the main driver details.</p></div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><CreditCardIcon className="mb-2 h-4 w-4 text-[#008009]" /><p className="text-xs font-black text-slate-900">Credit card</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Must have enough available funds for the deposit.</p></div>
                </div>
              </ConditionCard>

              <ConditionCard icon={<Shield className="h-4 w-4" />} title="Insurance and protection">
                <PolicyRow label="Collision Damage Waiver" value={supplier.includesCDW ? 'Included' : 'See supplier terms'} tone={supplier.includesCDW ? 'good' : 'default'} />
                <PolicyRow label="Theft Protection" value={supplier.includesTP ? 'Included' : 'See supplier terms'} tone={supplier.includesTP ? 'good' : 'default'} />
                <PolicyRow label="Damage excess" value={excessText} />
                <PolicyRow label="One-way fee" value={supplier.oneWayFee ? `${getCurrencySymbol()}${convertPrice(supplier.oneWayFee).toFixed(2)}` : 'Not listed'} />
              </ConditionCard>

              <ConditionCard icon={<Fuel className="h-4 w-4" />} title="Mileage, fuel and vehicle policy">
                <PolicyRow label="Mileage" value={car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'} tone={car.unlimitedMileage ? 'good' : 'default'} />
                <PolicyRow label="Fuel policy" value={car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : car.fuelPolicy.replace(/_/g, ' ')} />
                <PolicyRow label="Transmission" value={car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'} />
                <PolicyRow label="Vehicle class" value={`${formatCategoryName(car.category)} or similar`} />
              </ConditionCard>
            </div>

            <aside className="space-y-4">
              <ConditionCard icon={<Building className="h-4 w-4" />} title="Supplier and location">
                <PolicyRow label="Supplier" value={supplier.name} />
                <PolicyRow label="Rating" value={`${supplier.rating}/5 - ${getRatingDescription(supplier.rating)}`} tone={supplier.rating >= 4 ? 'good' : supplier.rating >= 3 ? 'default' : 'warn'} />
                <PolicyRow label="Pickup type" value={pickupTypeLabel} />
                {supplier.address && <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><p className="text-xs font-semibold leading-relaxed text-slate-600">{supplier.address}</p></div>}
              </ConditionCard>

              <ConditionCard icon={<Clock className="h-4 w-4" />} title="Pickup and return rules">
                <PolicyRow label="Booking mode" value={supplier.bookingMode === 'FREE_SALE' ? 'Instant confirmation' : 'On request'} tone={supplier.bookingMode === 'FREE_SALE' ? 'good' : 'default'} />
                <PolicyRow label="Lead time" value={supplier.minBookingLeadTime ? `${supplier.minBookingLeadTime} hour(s)` : 'Not listed'} />
                <PolicyRow label="Late return grace" value={gracePeriodInfo} />
                {workingHours.length > 0 && <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Opening hours</p>{workingHours.map(([day, hours]) => <div key={day} className="flex justify-between gap-3 text-xs"><span className="capitalize font-semibold text-slate-500">{day}</span><span className="text-right font-black text-slate-800">{hours}</span></div>)}</div>}
              </ConditionCard>
            </aside>
          </div>

          <ConditionCard icon={<FileText className="h-4 w-4" />} title="Supplier rental terms">
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 custom-scrollbar">
              <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-600">{supplier.termsAndConditions || 'No additional supplier terms have been provided for this vehicle. Standard rental desk policies may still apply at pickup.'}</p>
            </div>
          </ConditionCard>
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">Final acceptance depends on presenting the required documents and card at pickup.</p>
          <button onClick={onClose} className="bg-[#008009] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#006607] shadow-sm transition-transform active:scale-95">Got it</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

const categoryRanks: Record<string, number> = {
  [CarCategory.MINI]: 1,
  [CarCategory.ECONOMY]: 2,
  [CarCategory.COMPACT]: 3,
  [CarCategory.MIDSIZE]: 4,
  [CarCategory.INTERMEDIATE]: 5,
  [CarCategory.STANDARD]: 6,
  [CarCategory.FULLSIZE]: 7,
  [CarCategory.PREMIUM]: 8,
  [CarCategory.LUXURY]: 9,
  [CarCategory.SUV]: 10,
  [CarCategory.VAN]: 11,
  [CarCategory.PEOPLE_CARRIER]: 12,
};

const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol, selectedCurrency } = useCurrency();

  const [car, setCar] = React.useState<Car | null>(null);
  const [cars, setCars] = React.useState<Car[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Extract search params
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];
  const startTime = searchParams.get('startTime') || '10:00';
  const endTime = searchParams.get('endTime') || '10:00';
  const pickupCode = searchParams.get('pickup');
  const dropoffCode = searchParams.get('dropoff');
  const pickupName = searchParams.get('pickupName') || pickupCode || '';
  const dropoffName = searchParams.get('dropoffName') || dropoffCode || pickupName || '';
  const days = rentalDays(startDate, endDate);

  const timeUntilPickup = React.useMemo(() => {
    const pickupDateTime = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    const diffMs = pickupDateTime.getTime() - now.getTime();
    if (diffMs <= 0) return "In progress";
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    if (d > 0) return `${d}d ${h}h remaining`;
    if (h > 0) return `${h}h ${Math.floor((diffMs / (1000 * 60)) % 60)}m remaining`;
    return "Starting soon";
  }, [startDate, startTime]);

  // Load car from sessionStorage / state / API
  React.useEffect(() => {
    const loadCar = async () => {
      if (!car || String(car.id) !== String(id)) {
        setLoading(true);
      }
      setError(null);

      // 1. sessionStorage
      const storedCarRaw = sessionStorage.getItem('hogicar_selectedCar');
      const storedCarsRaw = sessionStorage.getItem('hogicar_cars');
      let foundCar: Car | null = null;
      let foundCars: Car[] = [];
      const stateCars = Array.isArray(location.state?.cars) ? location.state.cars : [];
      const stateCar = id && stateCars.length
        ? stateCars.find((c: Car) => String(c.id) === String(id)) || null
        : null;

      if (storedCarRaw) {
        try {
          const parsed = JSON.parse(storedCarRaw);
          if (parsed && (!id || String(parsed.id) === String(id))) foundCar = parsed;
        } catch (e) {}
      }
      if (storedCarsRaw) {
        try {
          const parsed = JSON.parse(storedCarsRaw);
          if (Array.isArray(parsed)) {
            foundCars = parsed;
            // Also search in foundCars if not found yet
            if (!foundCar && id) {
              foundCar = foundCars.find((c: Car) => String(c.id) === String(id)) || null;
            }
          }
        } catch (e) {}
      }

      // 2. location.state
      if (stateCars.length) {
        if (!foundCars.length) foundCars = stateCars;
        if (!foundCar) foundCar = stateCar;
        if (foundCar && stateCar && !(foundCar.image || (foundCar as any).imageUrl) && (stateCar.image || (stateCar as any).imageUrl)) {
          foundCar = {
            ...foundCar,
            image: stateCar.image || (stateCar as any).imageUrl,
            imageUrl: (stateCar as any).imageUrl || stateCar.image,
          } as Car;
        }
      }

      if (foundCar && id && !(foundCar.image || (foundCar as any).imageUrl)) {
        try {
          const refreshedCars = await loadCars({
            locationsOptions: [],
            pickupCode: pickupCode || undefined,
            dropoffCode: dropoffCode || pickupCode || undefined,
            pickupDate: startDate,
            dropoffDate: endDate,
          });

          // If foundCars was empty, populate it from refreshedCars
          if (foundCars.length === 0 && refreshedCars.length > 0) {
            // Map ApiSearchResult to something closer to Car if needed, 
            // but loadCars already normalizes most fields.
            foundCars = refreshedCars as any[];
          }

          const refreshedCar = refreshedCars.find(c => String(c.id) === String(id).replace('choice-', ''));
          if (refreshedCar?.image) {
            foundCar = {
              ...foundCar,
              image: refreshedCar.image,
              imageUrl: refreshedCar.image,
            } as Car;
          }
        } catch (refreshError) {
          console.warn('Could not refresh car image for details page', refreshError);
        }
      }

      // 3. Re-fetch from API if not found in storage/state
      if (!foundCar && id) {
        try {
          console.log("CarDetails: Car not found in storage, attempting API re-fetch for ID:", id);
          const refreshedCars = await loadCars({
            locationsOptions: [],
            pickupCode: pickupCode || undefined,
            dropoffCode: dropoffCode || pickupCode || undefined,
            pickupDate: startDate,
            dropoffDate: endDate,
          });

          const normalizedId = String(id).replace('choice-', '');
          const refreshedCar = refreshedCars.find(c => String(c.id) === normalizedId);
          
          if (refreshedCar) {
            foundCar = refreshedCar as Car;
            if (String(id).startsWith('choice-')) {
               foundCar = {
                 ...foundCar,
                 id: `choice-${foundCar.id}`,
                 supplier: {
                   ...foundCar.supplier,
                   name: 'Hogi Car Choice',
                   logo: 'HOGICAR_CHOICE_LOGO'
                 },
                 isHogicarChoiceBranded: true
               } as Car;
            }
            if (!foundCars.length) foundCars = refreshedCars as any[];
          }
        } catch (fetchError) {
          console.error('CarDetails: API re-fetch failed', fetchError);
        }
      }

      // 4. fallback to mock data
      if (!foundCar && id) {
        const mockCar = null; // Mock data removed
        if (mockCar) foundCar = mockCar as any;
      }

      // Ensure all foundCars have images if they are missing
      if (foundCars.length > 0) {
        foundCars = foundCars.map(c => {
          if (!c.image && (c as any).imageUrl) {
            return { ...c, image: (c as any).imageUrl };
          }
          return c;
        });
      }

      if (foundCar) {
        setCar(foundCar);
        setCars(foundCars.length ? foundCars : [foundCar]);
        persistSelectedCar(foundCar, foundCars.length ? foundCars : [foundCar]);
      } else {
        setError('Car not found. Please go back to search results.');
      }
      setLoading(false);
    };
    loadCar();
  }, [id, location.state]);

  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>([]);
  const [insuranceOption, setInsuranceOption] = React.useState<'basic' | 'full'>('basic');
  const [timeLeft, setTimeLeft] = React.useState(20 * 60);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);
  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCode | null>(null);
  const [promoError, setPromoError] = React.useState('');
  const [showFullSpecs, setShowFullSpecs] = React.useState(false);
  const [showRatingsTooltip, setShowRatingsTooltip] = React.useState(false);

  React.useEffect(() => {
    if (timeLeft === 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  React.useEffect(() => {
    if (!showRatingsTooltip) return;
    const handleGlobalClick = () => setShowRatingsTooltip(false);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showRatingsTooltip]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const priceDetails = React.useMemo(() => {
    if (!car) return { days: 0, baseNetTotal: 0, extrasCost: 0, insuranceCost: 0, discountAmount: 0, hogicarPromoAmount: 0, finalTotal: 0, payNow: 0, payAtDesk: 0, commissionAmount: 0 };
    return calcPricing(car, { pickupDate: startDate, dropoffDate: endDate }, selectedExtraIds, insuranceOption, appliedPromo);
  }, [car, startDate, endDate, selectedExtraIds, insuranceOption, appliedPromo]);

  const handleToggleExtra = (extraId: string) => setSelectedExtraIds(prev => prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]);

  const handleApplyPromo = () => {
    if (!promoCodeInput) { setPromoError('Enter a code.'); return; }
    const promo = getPromoCode(promoCodeInput);
    if (promo && promo.status === 'active') { setAppliedPromo(promo); setPromoError(''); } else { setAppliedPromo(null); setPromoError('Invalid or expired code.'); }
  };

  const handleContinue = () => {
    if (car) {
      persistSelectedCar(car, cars);
    }
  };

  const bookingParams = new URLSearchParams({ startDate, endDate, ...(pickupCode && { pickup: pickupCode }), ...(dropoffCode && { dropoff: dropoffCode }), ...(selectedExtraIds.length && { extras: selectedExtraIds.join(',') }), ...(appliedPromo && { promo: appliedPromo.code }) }).toString();

  const [imageError, setImageError] = React.useState(false);
  const displayImage = imageError ? 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle' : (car?.image || car?.imageUrl || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle');
  const pickupDisplay = new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dropoffDisplay = new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const supplierLogo = car?.supplier.logo || (car?.supplier as any)?.logoUrl;
  const depositDisplay = car?.deposit ? `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}` : 'Not listed';
  const excessDisplay = car?.excess ? `${getCurrencySymbol()}${convertPrice(car.excess).toFixed(2)}` : 'See terms';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" /><p className="mt-4 text-slate-600">Loading car details...</p></div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4">
        <div className="bg-[#f2f5fa] rounded-2xl p-8 text-center max-w-md shadow-lg border border-slate-300/70">
          <CarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Car Not Found</h1>
          <p className="text-slate-500 mt-2">{error || 'Please go back to search results.'}</p>
          <button onClick={() => navigate(-1)} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Back to Search</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMetadata title={`Rent a ${car.make} ${car.model} | Hogicar`} description={car.isHogicarChoiceBranded ? `Book ${car.make} ${car.model} from our exclusive verified fleet. Best price guaranteed.` : `Book ${car.make} ${car.model} from ${car.supplier.name}. Best price guaranteed.`} />
      <StructuredData car={car} total={convertPrice(priceDetails.finalTotal)} currencyCode={selectedCurrency} />
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}

      <div className="bg-slate-50 min-h-screen pb-16 lg:pb-8 text-slate-800">
        <div className="max-w-[1500px] mx-auto px-2 sm:px-4 lg:px-6 py-3">
          <BookingStepper currentStep={3} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6 mt-4">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Hero Section */}
              <div className="overflow-visible bg-white rounded-3xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.3)] border border-slate-200">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative flex min-h-[300px] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-8 lg:min-h-[440px] border-b lg:border-b-0 lg:border-r border-slate-100 rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none group">
                    <img
                      src={displayImage}
                      alt={`${car.make} ${car.model}`}
                      onError={() => setImageError(true)}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      className="h-auto max-h-[280px] w-full max-w-full object-contain drop-shadow-[0_32px_64px_rgba(15,23,42,0.15)] transition-all duration-700 sm:max-h-[340px] lg:max-h-[460px] group-hover:scale-105"
                    />
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2.5">
                      <span className="hidden md:inline-block bg-slate-950 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">
                        {formatCategoryName(car.category)}
                      </span>
                      {car.tags?.[0] && <span className="bg-[#008009] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[#008009]/20">{car.tags[0]}</span>}
                    </div>
                    <button className="absolute top-6 right-6 bg-white/95 p-2.5 rounded-full shadow-xl border border-slate-100 hover:bg-slate-50 transition-all hover:scale-110 active:scale-95"><Heart className="w-5 h-5 text-slate-400" /></button>
                  </div>

                  <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  {car.isHogicarChoiceBranded && (
                    <div className="inline-flex items-center gap-3 bg-slate-950 text-white text-[10px] font-black px-5 py-2.5 rounded-2xl mb-6 shadow-2xl border border-amber-400/30">
                        <Award className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                        <span className="tracking-[0.25em] uppercase italic font-black text-amber-400">Hogicar Choice Exclusive Verified</span>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between items-start gap-6">
                    <div className="flex-1 min-w-[240px]">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#008009] mb-2">Reserved for you</p>
                      <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">{car.displayName || `${car.make} ${car.model}`}</h1>
                      <p className="text-slate-500 text-sm font-bold mt-2 flex items-center gap-2">
                        <span className="text-slate-900">or similar</span> 
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        {car.year} 
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        {car.sippCode}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            {!car.isHogicarChoiceBranded ? (
                                <div 
                                  className="flex items-center gap-4 group/rating relative cursor-pointer rounded-2xl border border-slate-200 bg-white hover:border-[#008009]/30 p-3 pr-5 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowRatingsTooltip(!showRatingsTooltip);
                                  }}
                                >
                                    <div className={`relative ${getRatingColor(car.supplier.rating)} text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-lg shadow-slate-200 overflow-hidden shrink-0 ring-2 ring-white transition-transform group-hover/rating:scale-110`}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                                        <span className="relative z-10 text-xl font-black">{car.supplier.rating}</span>
                                    </div> 
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`font-black text-lg leading-none ${getRatingTextColor(car.supplier.rating)} tracking-tight`}>
                                                {getRatingDescription(car.supplier.rating)}
                                            </span>
                                            <Info className="w-3.5 h-3.5 text-slate-300 group-hover/rating:text-slate-500 transition-colors" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <CheckCircle className="w-3 h-3 text-[#008009]" />
                                            Verified Supplier
                                        </span>
                                    </div>
                                    <DetailedRatingsTooltip
                                       ratings={getCarRatings(car)}
                                       visible={showRatingsTooltip}
                                       align="left"
                                       className="max-sm:fixed max-sm:inset-x-4 max-sm:bottom-24 max-sm:w-auto max-sm:mb-0 max-sm:translate-x-0"
                                     />
                                </div>
                            ) : (
                                <span className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-black text-amber-800 uppercase tracking-wider flex items-center gap-3 shadow-sm">
                                    <Award className="w-5 h-5 fill-amber-500/20" /> Premium Choice · Top Rated
                                </span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 items-start sm:items-end">
                      <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                        {supplierLogo === 'HOGICAR_CHOICE_LOGO' || car.supplier.name === 'Hogi Car Choice' ? (
                          <Logo className="h-10 w-auto max-w-[150px]" />
                        ) : (
                          supplierLogo && <img src={supplierLogo} alt={car.supplier.name} className="h-12 max-w-[150px] object-contain" />
                        )}
                      </div>
                      {(car.supplier.bookingMode === 'FREE_SALE' || !car.supplier.bookingMode) && (
                        <div className="bg-emerald-50 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border border-[#008009]/10 shadow-sm">
                          <Zap className="w-4 h-4 text-[#008009] fill-[#008009]/20" />
                          <span className="text-[10px] font-black text-[#008009] uppercase tracking-[0.2em]">Instant confirmation</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                    {[
                      { icon: Users, label: `${car.passengers}`, desc: 'Seats', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { icon: Briefcase, label: `${car.bags}`, desc: 'Bags', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { icon: car.transmission === 'AUTOMATIC' ? AutomaticIcon : AutomaticIcon, label: car.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual', desc: 'Gear', color: 'text-[#008009]', bg: 'bg-emerald-50' },
                      { icon: Snowflake, label: 'A/C', desc: 'Climate', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                    ].map(item => (
                      <div key={item.desc} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                        <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mb-2.5 shadow-inner`}>
                          <item.icon className={`w-4 h-4 ${item.color} stroke-[2.5px]`} />
                        </div>
                        <p className="text-sm font-black text-slate-950">{item.label}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                      <p className="text-xs font-black text-[#008009] flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Free cancellation</p>
                      <p className="text-[11px] text-emerald-800 font-semibold mt-1">Flexible booking before pickup.</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs font-black text-slate-900 flex items-center gap-2"><GaugeCircle className="w-4 h-4 text-[#008009]" /> {car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage'}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">Mileage policy shown before checkout.</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs font-black text-slate-900 flex items-center gap-2"><Fuel className="w-4 h-4 text-[#008009]" /> {car.fuelPolicy.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">Fuel condition from supplier.</p>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)]">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black flex items-center gap-3 text-slate-950 tracking-tight">
                      <div className="bg-[#008009]/10 p-2 rounded-xl">
                        <Plane className="w-5 h-5 text-[#008009]" />
                      </div>
                      Rental Journey Itinerary
                    </h2>
                    <p className="mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule & Locations</p>
                  </div>
                  <div className="inline-flex items-center gap-2.5 rounded-2xl border border-[#008009]/20 bg-emerald-50/50 px-4 py-2 shadow-sm backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-[#008009]" />
                    <span className="text-xs font-black text-[#008009] uppercase tracking-[0.1em]">{timeUntilPickup}</span>
                  </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center relative">
                  {/* Decorative line for desktop */}
                  <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-px bg-slate-100 z-0"></div>
                  
                  <div className="relative z-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#008009]/5 text-[#008009] ring-1 ring-[#008009]/10">
                        <PlaneLanding className="w-6 h-6" />
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008009]">Pick-up Location</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{pickupCode}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date & Time</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-2xl font-black text-slate-950 tracking-tighter">{startTime}</p>
                          <div className="h-4 w-px bg-slate-200"></div>
                          <p className="text-sm font-black text-slate-900">{pickupDisplay}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Exact address</p>
                        <p className="mt-1 text-xs font-bold text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {pickupName || car.locationDetail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-2xl ring-4 ring-white">
                      <CarIcon className="w-5 h-5" />
                    </div>
                    <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">{days} days rental</span>
                    </div>
                  </div>

                  <div className="relative z-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#003580]/5 text-[#003580] ring-1 ring-[#003580]/10">
                        <PlaneTakeoff className="w-6 h-6" />
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003580]">Drop-off Location</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{dropoffCode || pickupCode}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date & Time</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-2xl font-black text-slate-950 tracking-tighter">{endTime}</p>
                          <div className="h-4 w-px bg-slate-200"></div>
                          <p className="text-sm font-black text-slate-900">{dropoffDisplay}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Exact address</p>
                        <p className="mt-1 text-xs font-bold text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {dropoffName || pickupName || car.locationDetail}</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* Key Specifications Grid - rich icons */}
              <div className="bg-white rounded-2xl shadow-[0_14px_36px_-30px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-black flex items-center gap-2 text-slate-950"><GaugeCircle className="w-5 h-5 text-[#008009]" /> Vehicle details</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">The most important specs for this rental class.</p>
                  </div>
                  <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{formatCategoryName(car.category)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Users, label: `${car.passengers} Seats`, desc: 'Comfortable seating' },
                    { icon: CarDoorIcon, label: `${car.doors} Doors`, desc: 'Easy access' },
                    { icon: Briefcase, label: `${car.bags} Bags`, desc: 'Luggage capacity' },
                    { icon: AutomaticIcon, label: car.transmission, desc: 'Smooth driving' },
                    { icon: Snowflake, label: 'A/C', desc: 'Climate control' },
                    { icon: GaugeCircle, label: car.unlimitedMileage ? 'Unlimited' : 'Limited', desc: 'Mileage policy' },
                    { icon: Fuel, label: car.fuelPolicy.split('_').join(' '), desc: 'Fuel policy' },
                    { icon: Hash, label: car.sippCode, desc: 'Vehicle code' }
                  ].map(spec => (
                    <div key={spec.label} className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-sm transition">
                      <spec.icon className="w-5 h-5 text-[#008009] mb-2" />
                      <span className="text-sm font-black text-slate-900 leading-tight">{spec.label}</span>
                      <span className="text-[11px] font-semibold text-slate-500">{spec.desc}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowFullSpecs(!showFullSpecs)} className="mt-5 text-[#008009] text-sm font-black flex items-center gap-1 mx-auto">{showFullSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {showFullSpecs ? 'Show less' : 'Show all specs'}</button>
                {showFullSpecs && (
                  <div className="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">Fuel Policy:</span> {car.fuelPolicy}</div>
                    <div><span className="font-semibold">Transmission:</span> {car.transmission}</div>
                    <div><span className="font-semibold">Mileage:</span> {car.unlimitedMileage ? 'Unlimited' : 'Limited'}</div>
                    <div><span className="font-semibold">Air Conditioning:</span> Yes</div>
                    <div><span className="font-semibold">Doors:</span> {car.doors}</div>
                    <div><span className="font-semibold">SIPP Code:</span> {car.sippCode}</div>
                    {car.deposit > 0 && <div><span className="font-semibold">Deposit:</span> {depositDisplay}</div>}
                    <div><span className="font-semibold">Excess:</span> {excessDisplay}</div>
                  </div>
                )}
              </div>

              {/* Extras Section - modern cards */}
              {car.extras && car.extras.length > 0 && (
                <div className="bg-white rounded-2xl shadow-[0_14px_36px_-30px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-6">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-[#008009]" /> Optional extras</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {car.extras.map(extra => (
                      <div key={extra.id} onClick={() => handleToggleExtra(extra.id)} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExtraIds.includes(extra.id) ? 'border-[#008009] bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg"><PlusCircle className="w-5 h-5 text-slate-600" /></div>
                          <div><div className="font-semibold">{extra.name}</div><div className="text-sm text-slate-700">{extra.type === 'per_day' ? 'per day' : 'one-time'}</div></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="font-bold">{getCurrencySymbol()}{convertPrice(extra.price).toFixed(2)}</div>
                          {selectedExtraIds.includes(extra.id) && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-[0_14px_36px_-30px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-6">
                <h2 className="text-xl font-black mb-5 flex items-center gap-2 text-slate-950"><ShieldCheck className="w-5 h-5 text-[#008009]" /> Included in your rate</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Supplier base rental and local taxes</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Transparent pay-now / pay-at-counter split</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Dedicated confirmation support</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Secure booking record and invoice trail</p>
                </div>
              </div>

              {/* Supplier Info with trust badges */}
              <div className="bg-white rounded-2xl shadow-[0_14px_36px_-30px_rgba(15,23,42,0.5)] border border-slate-200 p-5 sm:p-6">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-950"><Building className="w-5 h-5 text-[#008009]" /> {!car.isHogicarChoiceBranded ? "Supplier and pickup information" : "Hogicar Verification"}</h2>
                {!car.isHogicarChoiceBranded || car.supplier.name === 'Hogi Car Choice' ? (
                  <div className="flex flex-wrap items-center gap-6">
                    {car.supplier.logo === 'HOGICAR_CHOICE_LOGO' ? (
                      <Logo className="h-12 w-auto max-w-[150px]" />
                    ) : (
                      <img src={car.supplier.logo} alt={car.supplier.name} className="h-16 w-auto object-contain max-w-[150px]" />
                    )}
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="font-black text-xl text-slate-900 tracking-tight">{car.supplier.name}</div>
                            <div className="text-base text-slate-600 font-medium tracking-wide">Professional Car Rental Provider</div>
                        </div>
                        <div 
                          className="flex items-center gap-4 bg-white p-2.5 pr-4 rounded-2xl shadow-sm border border-slate-200 ml-2 group/rating relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98]"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowRatingsTooltip(!showRatingsTooltip);
                          }}
                        >
                             <div className={`relative ${getRatingColor(car.supplier.rating)} text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-lg shadow-slate-200 overflow-hidden shrink-0 ring-2 ring-white transition-transform group-hover/rating:scale-110 group-hover/rating:rotate-3`}>
                                 <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                                 <span className="relative z-10 text-xl font-black">{car.supplier.rating}</span>
                             </div>
                             <div className="flex flex-col min-w-0">
                                 <div className="flex items-center gap-2 mb-0.5">
                                     <span className={`text-lg font-black leading-none truncate whitespace-nowrap tracking-tight ${getRatingTextColor(car.supplier.rating)}`}>
                                         {getRatingDescription(car.supplier.rating)}
                                     </span>
                                     <Info className="w-3.5 h-3.5 text-slate-300 group-hover/rating:text-slate-500 transition-colors" />
                                 </div>
                                 <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.15em] flex items-center gap-1.5">
                                     <CheckCircle className="w-3 h-3 text-[#008009]" />
                                     Verified Rating
                                 </span>
                             </div>
                             <DetailedRatingsTooltip
                               ratings={getCarRatings(car)}
                               visible={showRatingsTooltip}
                               align="left"
                               className="max-sm:fixed max-sm:inset-x-4 max-sm:bottom-24 max-sm:w-auto max-sm:mb-0 max-sm:translate-x-0"
                             />
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-amber-500/20">
                      <Award className="w-10 h-10 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-black text-xl tracking-tight text-slate-900 uppercase">Hogicar Exclusive Fleet</div>
                      <div className="text-base text-slate-700 font-medium">Verified professional management</div>
                    </div>
                  </div>
                )}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-xl"><Shield className="w-6 h-6 text-[#008009] mb-1" /><span className="text-sm font-bold text-slate-700">Verified Partner</span></div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-xl"><Award className="w-6 h-6 text-yellow-500 mb-1" /><span className="text-sm font-bold text-slate-700">Top Rated</span></div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-xl"><Headphones className="w-6 h-6 text-blue-500 mb-1" /><span className="text-sm font-bold text-slate-700">24/7 Support</span></div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-xl"><Globe className="w-6 h-6 text-purple-500 mb-1" /><span className="text-sm font-bold text-slate-700">Global Presence</span></div>
                </div>
                <button onClick={() => setIsConditionsModalOpen(true)} className="mt-8 flex items-center gap-2 text-[#008009] hover:text-[#006607] text-base font-black uppercase tracking-[0.1em] transition-colors group/cond">
                    <FileText className="w-6 h-6 group-hover/cond:scale-110 transition-transform" />
                    <span>View Full Rental Conditions</span>
                    <ArrowRight className="w-5 h-5 ml-1 group-hover/cond:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Upgrade / Other models from same supplier */}
              {cars && cars.filter(c => c.id !== car.id && c.supplier.id === car.supplier.id && (categoryRanks[c.category] || 0) > (categoryRanks[car.category] || 0)).length > 0 && (
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)] border border-slate-200 p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-xl font-black flex items-center gap-3 text-slate-950 tracking-tight">
                        <div className="bg-amber-100 p-2 rounded-xl">
                          <Sparkles className="w-5 h-5 text-amber-600 fill-amber-600/10" />
                        </div>
                        Premium Upgrade Options
                      </h2>
                      <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Experience a superior category</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                        <div className="w-2 h-2 rounded-full bg-[#008009] animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Available Now</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {cars.filter(c => c.id !== car.id && c.supplier.id === car.supplier.id && (categoryRanks[c.category] || 0) > (categoryRanks[car.category] || 0))
                      .sort((a, b) => (categoryRanks[a.category] || 0) - (categoryRanks[b.category] || 0))
                      .slice(0, 4).map(similar => (
                      <button 
                        key={similar.id} 
                        onClick={() => {
                          setCar(similar);
                          navigate(`/car/${similar.id}?${bookingParams}`, { replace: true });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:-translate-y-1 hover:border-[#008009]/40 hover:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)]"
                      >
                        <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-slate-50 p-6">
                          <img 
                            src={similar.image || similar.imageUrl || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle'} 
                            alt={similar.displayName} 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('placehold.co')) {
                                target.src = 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle';
                              }
                            }}
                            className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#008009] shadow-sm ring-1 ring-slate-200 backdrop-blur-md">
                            {formatCategoryName(similar.category)}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          <div className="min-w-0">
                            <div className="truncate text-lg font-black text-slate-950 tracking-tight">{similar.displayName}</div>
                            <div className="mt-4 grid grid-cols-3 gap-2.5">
                              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center transition-colors group-hover:bg-emerald-50/50 group-hover:border-emerald-100">
                                 <Users className="w-4 h-4 text-[#008009] mx-auto mb-1.5" />
                                 <p className="text-xs font-black text-slate-900 leading-none">{similar.passengers}</p>
                              </div>
                              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center transition-colors group-hover:bg-emerald-50/50 group-hover:border-emerald-100">
                                 <Briefcase className="w-4 h-4 text-[#008009] mx-auto mb-1.5" />
                                 <p className="text-xs font-black text-slate-900 leading-none">{similar.bags}</p>
                              </div>
                              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center transition-colors group-hover:bg-emerald-50/50 group-hover:border-emerald-100">
                                 <AutomaticIcon className="w-4 h-4 text-[#008009] mx-auto mb-1.5" />
                                 <p className="text-xs font-black text-slate-900 leading-none">{similar.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total</p>
                              <p className="text-xl font-black text-slate-950">{getCurrencySymbol()}{convertPrice(calcPricing(similar, { pickupDate: startDate, dropoffDate: endDate }).finalTotal).toFixed(2)}</p>
                            </div>
                            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-[11px] font-black uppercase tracking-widest text-white transition-all group-hover:bg-[#008009] group-hover:shadow-lg group-hover:shadow-[#008009]/20">
                              Choose
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Sidebar (professional) */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(15,23,42,0.15)] p-6 border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008009] to-emerald-400"></div>
                  
                  {/* Price lock timer */}
                  <div className="bg-slate-950 text-white p-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Session Price Lock</div>
                      <div className="font-mono font-black text-2xl tracking-tighter mt-0.5">{formatTime(timeLeft)}</div>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
                      <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Pay now</p>
                        <p className="mt-1 text-2xl font-black tracking-tight text-[#008009]">{getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-right ring-1 ring-slate-200">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">At counter</p>
                        <p className="mt-1 text-lg font-black tracking-tight text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.payAtDesk).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-100">
                      <ShieldCheck className="h-4 w-4 text-[#008009]" />
                      Includes mandatory taxes, supplier fees, and booking support.
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Price breakdown</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{days} days</span>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex justify-between gap-4 text-sm font-semibold"><span className="text-slate-600">Vehicle rental</span><span className="text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.baseNetTotal + priceDetails.commissionAmount - priceDetails.discountAmount).toFixed(2)}</span></div>
                      {priceDetails.insuranceCost > 0 && <div className="flex justify-between gap-4 text-sm font-semibold"><span className="text-slate-600">Protection</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.insuranceCost).toFixed(2)}</span></div>}
                      {priceDetails.extrasCost > 0 && <div className="flex justify-between gap-4 text-sm font-semibold"><span className="text-slate-600">Selected extras</span><span>{getCurrencySymbol()}{convertPrice(priceDetails.extrasCost).toFixed(2)}</span></div>}
                      {priceDetails.discountAmount > 0 && <div className="flex justify-between gap-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700"><span>Promo discount</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.discountAmount).toFixed(2)}</span></div>}
                      {priceDetails.hogicarPromoAmount > 0 && <div className="flex justify-between gap-4 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-black text-indigo-700"><span>Secret deal</span><span>-{getCurrencySymbol()}{convertPrice(priceDetails.hogicarPromoAmount).toFixed(2)}</span></div>}
                      <div className="border-t border-dashed border-slate-200 pt-3">
                        <div className="flex items-end justify-between gap-4"><span className="text-sm font-black text-slate-900">Total price</span><span className="text-2xl font-black tracking-tight text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <input type="text" placeholder="Promo code" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none placeholder:text-slate-400" />
                      <button onClick={handleApplyPromo} className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#008009]">Apply</button>
                    </div>
                    {promoError && <p className="mt-2 text-xs font-bold text-red-600">{promoError}</p>}
                    {appliedPromo && <p className="mt-2 text-xs font-bold text-green-700">✓ {appliedPromo.code} applied</p>}
                  </div>
                  <div className="mb-5 grid gap-2">
                    <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${insuranceOption === 'basic' ? 'border-[#008009]/30 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                      <span className="flex items-center gap-3"><input type="radio" name="insurance" checked={insuranceOption === 'basic'} onChange={() => setInsuranceOption('basic')} className="w-4 h-4 text-[#008009]" /><span><span className="block text-sm font-black text-slate-950">Basic cover included</span><span className="text-[11px] font-semibold text-slate-500">Standard supplier coverage</span></span></span>
                      <span className="text-xs font-black text-[#008009]">Included</span>
                    </label>
                    <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${insuranceOption === 'full' ? 'border-[#008009]/30 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                      <span className="flex items-center gap-3"><input type="radio" name="insurance" checked={insuranceOption === 'full'} onChange={() => setInsuranceOption('full')} className="w-4 h-4 text-[#008009]" /><span><span className="block text-sm font-black text-slate-950">Full protection</span><span className="text-[11px] font-semibold text-slate-500">Extra peace of mind</span></span></span>
                      <span className="text-xs font-black text-slate-950">+{getCurrencySymbol()}{convertPrice(15 * days).toFixed(2)}</span>
                    </label>
                  </div>
                  <Link to={`/book/${car.id}/details?${bookingParams}`} onClick={handleContinue} className="block w-full rounded-2xl bg-[#008009] py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_-18px_rgba(0,128,9,0.75)] transition hover:-translate-y-0.5 hover:bg-[#006607] active:scale-[0.98]">Continue to book</Link>
                  <div className="mt-4 flex items-center justify-center gap-2 opacity-75"><VisaIcon /><MastercardIcon /><AmexIcon /></div>
                </div>
                {/* Trust badge */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#eaf7ef] rounded-xl p-3 border border-green-200/80"><div className="flex gap-2"><ShieldCheck className="w-5 h-5 text-green-600 shrink-0" /><div><div className="text-xs font-black">Free cancellation</div><div className="text-[11px] text-slate-700">Before pickup</div></div></div></div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200"><div className="flex gap-2"><Headphones className="w-5 h-5 text-blue-600 shrink-0" /><div><div className="text-xs font-black">24/7 support</div><div className="text-[11px] text-slate-700">Anytime help</div></div></div></div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <h4 className="text-xs font-black text-slate-900 mb-2">Booking checklist</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Driving license and passport/ID ready</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Card in the main driver’s name</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Review supplier terms before checkout</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-18px_40px_-24px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Total price</div>
              <div className="text-xl font-black tracking-tight text-slate-950">{getCurrencySymbol()}{convertPrice(priceDetails.finalTotal).toFixed(2)}</div>
              <div className="text-[10px] font-bold text-[#008009]">Pay now {getCurrencySymbol()}{convertPrice(priceDetails.payNow).toFixed(2)}</div>
            </div>
            <Link to={`/book/${car.id}/details?${bookingParams}`} onClick={handleContinue} className="shrink-0 rounded-2xl bg-[#008009] px-6 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_28px_-16px_rgba(0,128,9,0.8)] transition active:scale-95">Book now</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarDetails;
