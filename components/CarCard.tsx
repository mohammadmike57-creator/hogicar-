




import * as React from 'react';
import Users from 'lucide-react/dist/esm/icons/users';
import Info from 'lucide-react/dist/esm/icons/info';
import GaugeCircle from 'lucide-react/dist/esm/icons/gauge-circle';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Fuel from 'lucide-react/dist/esm/icons/fuel';
import Plane from 'lucide-react/dist/esm/icons/plane';
import PickupTypeIcon from './PickupTypeIcon';
import PromotionWrap, { PromotionSticker } from './PromotionWrap';
import { discountOf, promotionHighlights } from '../utils/promotions';
import Gift from 'lucide-react/dist/esm/icons/gift';
import X from 'lucide-react/dist/esm/icons/x';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Shield from 'lucide-react/dist/esm/icons/shield';
import CreditCardIcon from 'lucide-react/dist/esm/icons/credit-card';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Clock from 'lucide-react/dist/esm/icons/clock';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Building from 'lucide-react/dist/esm/icons/building';
import Bus from 'lucide-react/dist/esm/icons/bus';
import Award from 'lucide-react/dist/esm/icons/award';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Check from 'lucide-react/dist/esm/icons/check';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import Wind from 'lucide-react/dist/esm/icons/wind';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { Car as CarType, Supplier, CarRatings } from '../types';
import { RatingsModal } from './RatingsModal';
import { getRatingDescription, getRatingTextColor, getRatingColor, normalizeRatingScore, formatCategoryName, getCarRatings } from '../utils/ratings';
import { RatingBadge } from './RatingBadge';
import { RentalConditionsModal, ConditionsChip } from './RentalConditions';
import { Link } from 'react-router-dom';
import { calculatePrice } from '../utils/bookingUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';
import { persistSelectedCar } from '../utils/storage';

// --- ICONS ---

// Custom icon for car doors
const CarDoorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-600">
        <path d="M19 15V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9"/>
        <path d="M12 15V6"/>
        <path d="M4 15h16"/>
        <path d="M15 11h-1"/>
    </svg>
);

// A custom icon component for Automatic Transmission to match the design
const AutomaticIcon = ({ className = "w-4 h-4 text-slate-600" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
      loading="lazy"
      decoding="async"
      width="38"
      height="24"
    />
  </div>
);


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


import { Logo } from './Logo';

interface CarCardProps {
  car: CarType;
  cars: CarType[];
  days: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  pickupCode: string;
  dropoffCode: string;
  isComparing?: boolean;
  showCompareControl?: boolean;
  showMobileCompareControl?: boolean;
  onCompareToggle?: () => void;
  /** Labels of the active search filters this car matches; highlights the card when non-empty. */
  matchedFilters?: string[];
}

const CarCard: React.FC<CarCardProps> = ({
    car,
    cars,
    days,
    startDate,
    endDate,
    startTime,
    endTime,
    pickupCode,
    dropoffCode,
    isComparing = false,
    showCompareControl = true,
    showMobileCompareControl = true,
    onCompareToggle,
    matchedFilters = []
}) => {
  const [isConditionsModalOpen, setIsConditionsModalOpen] = React.useState(false);
  const [showRatings, setShowRatings] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const { convertPrice, getCurrencySymbol } = useCurrency();

  const totalFinalPrice = car.finalPrice ?? 0;
  const totalCommissionAmount = car.commissionAmount ?? 0;
  const payAtPickup = Math.max(totalFinalPrice - totalCommissionAmount, 0);
  const money = (amount: number, digits = 2) => `${getCurrencySymbol()}${convertPrice(amount).toFixed(digits)}`;

  const searchParams = new URLSearchParams({
    pickupDate: startDate,
    dropoffDate: endDate,
    startTime: startTime || '',
    endTime: endTime || '',
    pickup: pickupCode,
    dropoff: dropoffCode,
    // Location names make shared links and the car page read "Queen Alia Airport" instead of "AMM".
    ...(() => {
      const current = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const names: Record<string, string> = {};
      const pn = current?.get('pickupName'); const dn = current?.get('dropoffName');
      if (pn) names.pickupName = pn;
      if (dn) names.dropoffName = dn;
      return names;
    })(),
  }).toString();
  const detailsUrl = `/car/${car.id}?${searchParams}`;

  const recentBookingInfo = React.useMemo(() => getRecentBookingInfo(car), [car]);
  const displayImage = imageError ? 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle' : (car.image || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle');
  const displayRatings = React.useMemo(() => getCarRatings(car), [car]);
  const ratingToDisplay = React.useMemo(() => parseFloat(normalizeRatingScore(car.supplier.rating).toFixed(1)), [car.supplier.rating]);
  const reviewCount = car.supplier.reviewCount ?? (car.supplier as any).ratingReviewCount;
  const closeRatings = React.useCallback(() => setShowRatings(false), []);
  const isFilterMatch = matchedFilters.length > 0;

  const pickupType = car.supplier?.pickupType;
  const pickupLabel =
    pickupType === 'IN_TERMINAL' ? 'In terminal' :
    pickupType === 'MEET_AND_GREET' ? 'Meet & greet' :
    pickupType === 'SHUTTLE_BUS' ? 'Shuttle bus' :
    car.locationDetail || 'Pick-up desk';
  const fuelLabel = car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full' : String(car.fuelPolicy || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  const isInstant = !car.supplier?.bookingMode || car.supplier.bookingMode === 'FREE_SALE';
  const carName = (car.displayName || `${car.make} ${car.model}`).replace(/\s+or similar\s*$/i, '');
  const promo = car.supplierPromotion || null;
  const promoOriginal = promo && discountOf(promo) > 0 && promo.originalFinalPrice && promo.originalFinalPrice > totalFinalPrice ? promo.originalFinalPrice : null;
  const originalPrice = promoOriginal ?? (car.promotionPercent && car.promotionPercent > 0 ? totalFinalPrice / (1 - car.promotionPercent / 100) : null);
  const promoSavings = promoOriginal ? promoOriginal - totalFinalPrice : 0;
  const freeExtras = promo ? promotionHighlights({ ...promo, discountPercent: 0 }) : [];
  const isChoiceLogo = car.supplier.logo === 'HOGICAR_CHOICE_LOGO' || (car.supplier as any).logoUrl === 'HOGICAR_CHOICE_LOGO';
  const supplierLogoSrc = car.supplier.logo || (car.supplier as any).logoUrl;

  const handleSelectCar = () => {
    persistSelectedCar(car, cars);
  };

  const supplierMark = isChoiceLogo ? (
    <Logo className="h-6 w-auto max-w-[96px]" />
  ) : supplierLogoSrc ? (
    <img src={supplierLogoSrc} alt={car.supplier.name} className="h-7 w-auto max-w-[96px] object-contain" loading="lazy" decoding="async" width="96" height="28" />
  ) : (
    <span className="text-xs font-semibold text-slate-600">{car.supplier.name}</span>
  );

  const specs = [
    { icon: Users, label: `${car.passengers} seats` },
    { icon: Briefcase, label: `${car.bags} bag${car.bags === 1 ? '' : 's'}` },
    { icon: AutomaticIcon, label: car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual' },
    { icon: Wind, label: 'A/C' },
  ];

  const features = [
    'Free cancellation',
    car.unlimitedMileage ? 'Unlimited mileage' : 'Limited mileage',
    `Fuel: ${fuelLabel}`,
    ...(isInstant ? ['Instant confirmation'] : []),
  ];

  const ratingButton = (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRatings(true); }}
      aria-haspopup="dialog"
      aria-label={`${car.supplier.name} rating ${ratingToDisplay.toFixed(1)}, show details`}
      className="inline-flex items-center rounded-lg text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <RatingBadge rating={ratingToDisplay} reviewCount={reviewCount} size="sm" fallbackText="Customer rating" showInfo inline />
    </button>
  );

  const compareToggle = (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={isComparing}
        onChange={() => onCompareToggle?.()}
        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
        aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
      />
      Compare
    </label>
  );

  return (
    <>
      {isConditionsModalOpen && <RentalConditionsModal car={car} supplier={car.supplier} onClose={() => setIsConditionsModalOpen(false)} />}
      <RatingsModal
        open={showRatings}
        onClose={closeRatings}
        ratings={displayRatings}
        rating={ratingToDisplay}
        supplierName={car.supplier.name}
        supplierLogo={supplierMark}
        reviewCount={reviewCount}
      />

      <PromotionWrap promo={promo} savingsText={promoSavings > 0 ? `You save ${money(promoSavings)}` : null} className={isComparing ? 'ring-2 ring-accent ring-offset-2' : ''}>
      <article
        className={`relative w-full overflow-hidden bg-white transition-shadow ${
          promo
            ? ''
            : isComparing
            ? 'border-accent shadow-sm ring-1 ring-accent hover:shadow-md'
            : isFilterMatch
              ? 'border-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.12),0_10px_28px_-14px_rgba(5,150,105,0.55)] hover:shadow-[0_0_0_4px_rgba(16,185,129,0.16),0_14px_34px_-14px_rgba(5,150,105,0.6)]'
              : car.isHogicarChoiceBranded ? 'border-accent/60 shadow-sm hover:shadow-md' : 'border-slate-200 shadow-sm hover:shadow-md'
        } ${promo ? '' : 'rounded-xl border'}`}
      >
        {isFilterMatch && (
          <div className="flex items-center gap-1.5 border-b border-emerald-100 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-800">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Matches your filters: {matchedFilters.join(' · ')}</span>
          </div>
        )}
        {car.isHogicarChoiceBranded && (
          <div className="flex items-center gap-1.5 border-b border-accent/20 bg-accent-50 px-4 py-1.5 text-xs font-semibold text-accent-800">
            <Award className="h-3.5 w-3.5" /> Hogicar recommended
          </div>
        )}

        <div className="grid md:grid-cols-[220px_minmax(0,1fr)_210px] lg:grid-cols-[240px_minmax(0,1fr)_220px]">
          {/* Image */}
          <Link
            to={detailsUrl}
            state={{ cars }}
            onClick={handleSelectCar}
            className="relative hidden items-center justify-center bg-slate-50 p-4 md:flex"
            aria-label={`View ${carName}`}
          >
            <img
              src={displayImage}
              alt={carName}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              width="240"
              height="140"
              className="h-auto max-h-32 w-full object-contain"
            />
            {promo ? (
              <PromotionSticker promo={promo} className="absolute left-3 top-3" />
            ) : originalPrice && (
              <span className="absolute left-3 top-3 rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">-{car.promotionPercent}%</span>
            )}
          </Link>

          {/* Details */}
          <div className="min-w-0 p-4 md:border-r md:border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={detailsUrl} state={{ cars }} onClick={handleSelectCar} className="hover:underline">
                  <h3 className="truncate text-lg font-bold leading-tight text-slate-900">{carName}</h3>
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">or similar · {formatCategoryName(car.category)}</p>
              </div>
              {(showCompareControl || showMobileCompareControl) && (
                <div className={`${showCompareControl ? 'md:block' : 'md:hidden'} ${showMobileCompareControl ? 'block' : 'hidden'} shrink-0 pt-0.5`}>{compareToggle}</div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 md:block">
              <div className="min-w-0">
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {specs.map(spec => (
                    <li key={spec.label} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                      <spec.icon className="h-4 w-4 text-slate-500" />
                      {spec.label}
                    </li>
                  ))}
                </ul>
                <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-sm text-slate-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to={detailsUrl} state={{ cars }} onClick={handleSelectCar} className="relative flex items-center justify-center md:hidden" aria-label={`View ${carName}`}>
                <img
                  src={displayImage}
                  alt={carName}
                  onError={() => setImageError(true)}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  width="120"
                  height="80"
                  className="h-auto max-h-20 w-full object-contain"
                />
                {promo ? (
                  <PromotionSticker promo={promo} className="absolute left-0 top-0" />
                ) : originalPrice && (
                  <span className="absolute left-0 top-0 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">-{car.promotionPercent}%</span>
                )}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3">
                {supplierMark}
                {!car.isHogicarChoiceBranded && Number(car.supplier.rating) > 0 && ratingButton}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600">
                  <PickupTypeIcon type={pickupType} size="sm" /> <span className="font-medium text-slate-700">{pickupLabel}</span>
                </span>
                <ConditionsChip car={car} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsConditionsModalOpen(true); }} />
              </div>
            </div>

            {recentBookingInfo.isRecent && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <Clock className="h-3.5 w-3.5" /> {recentBookingInfo.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-white p-4 md:border-t-0">
            <div className="flex items-end justify-between gap-3 md:block">
              <div>
                <p className="text-xs text-slate-500">Price for {days} day{days > 1 ? 's' : ''}</p>
                {originalPrice && <p className="text-sm text-slate-400 line-through">{money(originalPrice)}</p>}
                <p className="text-2xl font-bold leading-tight tracking-tight text-slate-900">{money(totalFinalPrice)}</p>
                <p className="text-xs text-emerald-700">Taxes and fees included</p>
                {promoSavings > 0 && (
                  <p className="mt-1.5 inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">You save {money(promoSavings)}</p>
                )}
                {freeExtras.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-700"><Gift className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> {freeExtras.join(' · ')}</p>
                )}
              </div>
              <dl className="text-right text-xs text-slate-600 md:mt-3 md:space-y-0.5 md:text-left">
                <div className="flex justify-end gap-2 md:justify-between"><dt>Pay now</dt><dd className="font-semibold text-slate-900">{money(totalCommissionAmount)}</dd></div>
                <div className="flex justify-end gap-2 md:justify-between"><dt>At pick-up</dt><dd className="font-semibold text-slate-900">{money(payAtPickup)}</dd></div>
              </dl>
            </div>
            <Link
              to={detailsUrl}
              state={{ cars }}
              onClick={handleSelectCar}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-700 active:bg-accent-800"
            >
              View deal <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
      </PromotionWrap>
    </>
  );
};

export default CarCard;
