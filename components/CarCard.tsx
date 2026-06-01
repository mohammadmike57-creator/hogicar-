




import * as React from 'react';
import { 
  Users, Info, Briefcase, FileText, CreditCard as CreditCardIcon, 
  Handshake, Zap, MapPin, Check, Wind, Settings, Luggage, 
  Building, Bus, Gauge, CalendarX, X, AlertCircle, Fuel, Star, Calendar, Shield, ArrowRight
} from 'lucide-react';
import { Car as CarType, Supplier } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';
import { Link, useSearchParams } from 'react-router-dom';

interface CarCardProps {
    car: CarType;
    pickupDate: Date;
    dropoffDate: Date;
    onViewDeal?: () => void;
    cars?: CarType[];
}

const RatingModal = ({ car, onClose }: { car: CarType, onClose: () => void }) => {
    const brk = car.detailedRatings || { cleanliness: 80, condition: 80, valueForMoney: 80, pickupSpeed: 80 };
    const ratings = {
        clean: (brk.cleanliness / 10).toFixed(1),
        service: (brk.pickupSpeed / 10).toFixed(1),
        vehicle: (brk.condition / 10).toFixed(1),
        value: (brk.valueForMoney / 10).toFixed(1)
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-xl max-w-sm w-full shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-[#0A2647] to-[#1B4D8C] px-4 py-2 flex justify-between items-center">
                    <h3 className="text-white font-bold text-sm">⭐ Rating</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-4 text-sm">
                    <div className="text-center border-b pb-2 mb-2">
                        <span className="text-2xl font-bold text-[#D4AF37]">{car.supplier.rating}</span>
                        <span className="text-gray-500 text-xs">/10</span>
                        <div className="text-xs font-semibold mt-0.5">Very Good · 248 reviews</div>
                    </div>
                    <div className="space-y-1.5 mt-2">
                        {[
                            { label: "Cleanliness", val: ratings.clean },
                            { label: "Customer Service", val: ratings.service },
                            { label: "Vehicle Condition", val: ratings.vehicle },
                            { label: "Value for Money", val: ratings.value }
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[11px]">
                                    <span>{item.label}</span>
                                    <span>{item.val}/10</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div className="bg-[#D4AF37] h-1 rounded-full" style={{ width: `${parseFloat(item.val) * 10}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-4 pb-4">
                    <button onClick={onClose} className="w-full bg-[#1B4D8C] text-white font-semibold py-1.5 rounded-lg text-xs">Close</button>
                </div>
            </div>
        </div>
    );
};

const TermsModal = ({ car, onClose }: { car: CarType, onClose: () => void }) => {
    const cond = {
        deposit: `${car.currency || 'JOD'} ${car.deposit}`,
        excess: `${car.currency || 'JOD'} ${car.excess || 300}`,
        fuel: car.fuelPolicy === 'FULL_TO_FULL' ? 'Full to full (Professional Policy)' : car.fuelPolicy.replace(/_/g, ' ').toLowerCase(),
        cancel: 'Free cancellation up to 48h before pickup',
        insurance: 'Collision Damage Waiver, Theft Protection, Third Party Liability',
        driver: 'Minimum age 21, valid driving license (held for min 1 year)',
        payment: 'Credit card required for security deposit at pickup',
        mileage: car.unlimitedMileage ? 'Unlimited mileage included' : 'Limited mileage applies'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-[#123C69] to-[#1B4D8C] px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-white font-black text-base uppercase tracking-wider">Rental Conditions</h3>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(cond).map(([k, v]) => (
                            <div key={k} className="flex flex-col gap-2 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-[#F57C00]/30 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#F57C00]/10 p-1.5 rounded-lg">
                                        {k === 'deposit' && <CreditCardIcon className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'excess' && <AlertCircle className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'fuel' && <Fuel className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'cancel' && <CalendarX className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'insurance' && <Shield className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'driver' && <Users className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'payment' && <CreditCardIcon className="w-4 h-4 text-[#F57C00]" />}
                                        {k === 'mileage' && <Gauge className="w-4 h-4 text-[#F57C00]" />}
                                    </div>
                                    <strong className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{k}</strong>
                                </div>
                                <span className="text-xs font-bold text-[#0A2647]">{v}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#1B4D8C] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#1B4D8C] font-medium leading-relaxed">
                            These are key highlights. Full terms and conditions will be provided during the booking process and at the rental desk. Please ensure you have all required documents.
                        </p>
                    </div>
                </div>
                <div className="px-6 pb-6 pt-2">
                    <button onClick={onClose} className="w-full bg-[#123C69] hover:bg-[#0A2647] text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
                        I Understand & Agree
                    </button>
                </div>
            </div>
        </div>
    );
};

const CarCard: React.FC<CarCardProps> = ({ car, pickupDate, dropoffDate, onViewDeal, cars }) => {
    const [searchParams] = useSearchParams();
    const { convertPrice, getCurrencySymbol } = useCurrency();
    const [isTermsModalOpen, setIsTermsModalOpen] = React.useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = React.useState(false);

    const {
        days,
        finalTotal,
        payNow,
        payAtDesk,
    } = calcPricing(car, { 
        pickupDate: pickupDate.toISOString().split('T')[0], 
        dropoffDate: dropoffDate.toISOString().split('T')[0] 
    });

    const sym = getCurrencySymbol();
    const dailyPriceValue = finalTotal / days;
    const dayPrice = `${sym} ${convertPrice(dailyPriceValue).toFixed(2)}`;
    const totalDisplay = `${sym} ${convertPrice(finalTotal).toFixed(2)}`;
    const payNowDisplay = `${sym} ${convertPrice(payNow).toFixed(2)}`;
    const payLaterDisplay = `${sym} ${convertPrice(payAtDesk).toFixed(2)}`;

    const pickupType = car.supplier?.pickupType || (car as any).pickupType;
    const pickupTypeLabel =
        pickupType === 'IN_TERMINAL' ? 'In Terminal' :
        pickupType === 'MEET_AND_GREET' ? 'Meet & Greet' :
        pickupType === 'SHUTTLE_BUS' ? 'Shuttle Bus' :
        car.locationDetail || 'Location details';

    const incList = [
        "Basic insurance",
        "VAT",
        car.unlimitedMileage ? "Unlimited mileage" : "Limited mileage",
        car.fuelPolicy === 'FULL_TO_FULL' ? "Full to full" : car.fuelPolicy
    ];

    const handleSelectCar = () => {
        sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
        if (cars) sessionStorage.setItem('hogicar_cars', JSON.stringify(cars));
        if (onViewDeal) onViewDeal();
    };

    return (
        <>
            <div className="car-card overflow-hidden bg-white border-2 border-gray-100 sm:border-0 rounded-[2rem] mb-6 sm:mb-0 border-l-[6px] border-l-[#F57C00] sm:border-l-0 shadow-lg sm:shadow-none">
                <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-[220px] bg-gradient-to-br from-gray-50 to-gray-100 p-8 sm:p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-200">
                        <Link to={`/car/${car.id}?${searchParams}`} state={{ cars }} onClick={handleSelectCar} className="w-full max-w-[260px] h-44 sm:w-36 sm:h-36 bg-white rounded-3xl shadow-sm flex items-center justify-center overflow-hidden mb-5 sm:mb-4 transition-all hover:scale-105 hover:shadow-md">
                            {car.image ? (
                                <img src={car.image} alt={car.displayName} className="w-full h-full object-contain p-3 sm:p-2" />
                            ) : (
                                <CarTypeIcon className="w-12 h-12 text-[#1B4D8C]/70" />
                            )}
                        </Link>
                        <div className="text-center">
                            <h3 className="font-black text-[#0A2647] text-xl sm:text-base leading-tight mb-1 tracking-tight">{car.displayName}</h3>
                            <p className="text-sm sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">or similar {car.model}</p>
                        </div>
                    </div>

                    <div className="flex-1 p-5 sm:p-4 flex flex-col sm:flex-row sm:items-stretch justify-between gap-5 sm:gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2.5 mb-5 sm:mb-4">
                                <span className="spec-badge spec-transmission py-2 px-4 sm:py-1.5 sm:px-3 text-xs font-black uppercase tracking-wider"><Settings className="w-4 h-4" />{car.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
                                <span className="spec-badge spec-seats py-2 px-4 sm:py-1.5 sm:px-3 text-xs font-black uppercase tracking-wider"><Users className="w-4 h-4" />{car.passengers} Seats</span>
                                <span className="spec-badge spec-bags py-2 px-4 sm:py-1.5 sm:px-3 text-xs font-black uppercase tracking-wider"><Luggage className="w-4 h-4" />{car.bags} Bags</span>
                                <span className="spec-badge spec-ac py-2 px-4 sm:py-1.5 sm:px-3 text-xs font-black uppercase tracking-wider"><Wind className="w-4 h-4" />A/C</span>
                            </div>

                            <div className="flex items-center gap-3 mb-2 sm:mb-1">
                                <div className="w-14 h-14 sm:w-11 sm:h-11 rounded-xl sm:rounded-lg supplier-logo text-white flex items-center justify-center font-black text-base sm:text-sm shadow-lg overflow-hidden bg-[#0A2647] border-2 border-white">
                                    {car.supplier.logo ? (
                                        <img src={car.supplier.logo} alt={car.supplier.name} className="w-full h-full object-contain p-1.5 sm:p-1 brightness-0 invert" />
                                    ) : (
                                        car.supplier.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="font-black text-[#0A2647] text-base sm:text-xs uppercase tracking-tight">{car.supplier.name}</div>
                                    <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsRatingModalOpen(true)}>
                                        <span className="text-base sm:text-xs font-black text-[#D4AF37]">{car.supplier.rating}</span>
                                        <span className="text-xs sm:text-[8px] text-[#D4AF37]">★</span>
                                        <span className="text-sm sm:text-[10px] font-bold text-gray-600 ml-0.5">Very Good</span>
                                        <span className="text-[11px] sm:text-[7px] font-medium text-gray-400 ml-0.5">(248 reviews)</span>
                                        <Info className="w-4 h-4 sm:w-2 sm:h-2 text-gray-400 ml-1 group-hover:text-[#1B4D8C] transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm sm:text-[10px] text-gray-600 mb-4 sm:mb-2 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 sm:px-2 sm:py-1 w-fit shadow-sm">
                                {pickupType === 'MEET_AND_GREET' ? (
                                    <Handshake className="w-4 h-4 sm:w-2.5 sm:h-2.5 text-[#F57C00]" />
                                ) : (
                                    <Building className="w-4 h-4 sm:w-2.5 sm:h-2.5 text-[#F57C00]" />
                                )}
                                <span className="font-bold text-[#1a2c3e]">{car.locationDetail || 'Queen Alia Airport'}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="font-black text-[#1B4D8C] text-[11px] sm:text-[9px] uppercase tracking-widest">{pickupTypeLabel}</span>
                            </div>

                            <div className="flex flex-wrap gap-2.5 mb-4 sm:mb-3">
                                {car.unlimitedMileage && (
                                    <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black px-4 py-2 sm:px-3 sm:py-1.5 rounded-2xl flex items-center gap-2 uppercase tracking-widest shadow-md border border-emerald-400/20 transition-all hover:shadow-lg active:scale-95">
                                        <Gauge className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                        Unlimited Mileage
                                    </span>
                                )}
                                {car.fuelPolicy === 'FULL_TO_FULL' && (
                                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black px-4 py-2 sm:px-3 sm:py-1.5 rounded-2xl flex items-center gap-2 uppercase tracking-widest shadow-md border border-blue-400/20 transition-all hover:shadow-lg active:scale-95">
                                        <Fuel className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                        Full to Full
                                    </span>
                                )}
                                {car.supplier.bookingMode === 'FREE_SALE' && (
                                    <span className="bg-gradient-to-r from-amber-500 to-[#F57C00] text-white text-[10px] font-black px-4 py-2 sm:px-3 sm:py-1.5 rounded-2xl flex items-center gap-2 uppercase tracking-widest shadow-md border border-orange-400/20 transition-all hover:shadow-lg active:scale-95">
                                        <Zap className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                        Instant Booking
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 pt-3 border-t border-gray-100 flex flex-wrap justify-between gap-2 items-center">
                                <div className="flex gap-2">
                                    <span className="bg-[#E6F4EA] text-[#008009] text-[10px] font-black px-3 py-1.5 rounded-xl border border-[#008009]/10 flex items-center gap-2 uppercase tracking-widest shadow-sm">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        Free Cancellation
                                    </span>
                                </div>
                                <button onClick={() => setIsTermsModalOpen(true)} className="text-[10px] font-black text-[#123C69] bg-white border-2 border-gray-50 hover:border-[#F57C00]/30 rounded-2xl px-4 py-2 flex items-center gap-2.5 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                                    <FileText className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#F57C00]" />
                                    View Full terms
                                </button>
                            </div>
                        </div>

                        <div className="sm:min-w-[220px] border-t sm:border-t-0 sm:border-l border-gray-100 pt-5 sm:pt-0 sm:pl-6 flex flex-col justify-between">
                            <div className="text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-2">
                                <div className="flex flex-col items-end">
                                    <div className="font-black text-[#0A2647] text-3xl sm:text-2xl tracking-tighter leading-none">{dayPrice}<span className="text-xs font-bold text-gray-400 ml-1 uppercase">/day</span></div>
                                    <div className="text-xs sm:text-[11px] font-black text-[#F57C00] mt-1.5 uppercase tracking-[0.1em] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">Total: {totalDisplay}</div>
                                </div>
                                <div className="hidden sm:block mt-4 payment-block shadow-lg bg-white border-2 border-gray-50 p-3 rounded-2xl">
                                    <div className="payment-row border-b border-gray-50 pb-2 mb-1.5">
                                        <span className="payment-label text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2"><CreditCardIcon className="w-4 h-4 text-[#1B4D8C]" />Pay online</span>
                                        <span className="payment-amount text-sm font-black text-[#1B4D8C]">{payNowDisplay}</span>
                                    </div>
                                    <div className="payment-row pt-1">
                                        <span className="payment-label text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4 text-[#F57C00]" />At pickup</span>
                                        <span className="payment-amount text-sm font-black text-[#F57C00]">{payLaterDisplay}</span>
                                    </div>
                                </div>
                            </div>
                            <Link to={`/car/${car.id}?${searchParams}`} state={{ cars }} onClick={handleSelectCar} className="mt-5 sm:mt-4 w-full view-deal-btn text-white text-base sm:text-sm font-black py-4 sm:py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-3 group uppercase tracking-[0.1em]">
                                Book Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {isRatingModalOpen && <RatingModal car={car} onClose={() => setIsRatingModalOpen(false)} />}
            {isTermsModalOpen && <TermsModal car={car} onClose={() => setIsTermsModalOpen(false)} />}
        </>
    );
};

const CarTypeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
    </svg>
);

export default CarCard;

