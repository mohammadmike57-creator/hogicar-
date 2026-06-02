
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Users, Briefcase, Fuel, Zap, Shield, Award, Building, CreditCard, ArrowLeftRight, Plane, Handshake, Bus, GaugeCircle, Wind, Star, ArrowRight, Info, Calendar, Key, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { Car, FuelPolicy, Transmission } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';

interface ComparisonModalProps {
    selectedCars: Car[];
    onClose: () => void;
    onRemove: (car: Car) => void;
    days: number;
    startDate: string;
    endDate: string;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ selectedCars, onClose, onRemove, days, startDate, endDate }) => {
    const { convertPrice, getCurrencySymbol } = useCurrency();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = location.search;
    const search = { pickupDate: startDate, dropoffDate: endDate };

    const handleSelectCar = (car: Car) => {
        sessionStorage.setItem('hogicar_selectedCarId', car.id);
        sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
        navigate(`/car/${car.id}${searchParams}`);
    };

    const ComparisonRow = ({ 
        label, 
        icon: Icon, 
        values, 
        highlightBest = false,
        sublabel
    }: { 
        label: string; 
        icon?: any;
        values: (string | number | React.ReactNode)[]; 
        highlightBest?: boolean;
        sublabel?: string;
    }) => (
        <div 
            className="grid items-stretch border-b border-slate-100 last:border-0 w-max min-w-full hover:bg-slate-50/30 transition-colors"
            style={{ gridTemplateColumns: `160px repeat(${selectedCars.length}, minmax(240px, 1fr))` }}
        >
            <div className="bg-white/80 backdrop-blur-sm p-5 flex flex-col justify-center sticky left-0 z-20 border-r border-slate-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-0.5">
                    {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
                </div>
                {sublabel && <span className="text-[9px] text-slate-400 font-medium leading-tight">{sublabel}</span>}
            </div>
            {values.map((val, idx) => (
                <div key={idx} className="p-6 text-center border-l border-slate-100 h-full flex flex-col items-center justify-center font-bold text-slate-800 text-sm bg-white/40">
                    {val}
                </div>
            ))}
        </div>
    );

    const RatingBar = ({ value, label }: { value: number; label: string }) => (
        <div className="w-full max-w-[140px] space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter text-slate-500">
                <span>{label}</span>
                <span className={value >= 80 ? 'text-[#008009]' : value >= 60 ? 'text-amber-500' : 'text-slate-400'}>{value}%</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${value >= 80 ? 'bg-[#008009]' : value >= 60 ? 'bg-amber-500' : 'bg-slate-300'}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );

    const getPricePerDay = (car: Car) => {
        const pricing = calcPricing(car, search);
        return pricing.finalTotal / days;
    };

    const getTotalPrice = (car: Car) => {
        const pricing = calcPricing(car, search);
        return pricing.finalTotal;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-10 backdrop-blur-xl bg-slate-950/70 animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-[1400px] h-full sm:h-[98vh] md:h-auto md:max-h-[92vh] sm:rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-5">
                        <div className="bg-gradient-to-br from-[#008009] to-[#00a30b] p-3.5 rounded-[22px] shadow-2xl shadow-emerald-200/50 flex items-center justify-center">
                            <ArrowLeftRight className="w-6 h-6 text-white stroke-[2.5px]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Comparison Matrix</h2>
                                <span className="bg-emerald-50 text-[#008009] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedCars.length} Cars</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                Expert analysis of your selected vehicles
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="group p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all duration-300 active:scale-90"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Comparison Table */}
                <div className="flex-grow overflow-auto custom-scrollbar bg-white">
                    <div className="min-w-full">
                        {/* Car Header Cards */}
                        <div 
                            className="grid bg-white sticky top-0 z-40 border-b border-slate-200 shadow-sm w-max min-w-full"
                            style={{ gridTemplateColumns: `160px repeat(${selectedCars.length}, minmax(240px, 1fr))` }}
                        >
                            <div className="bg-slate-50/80 backdrop-blur-md sticky left-0 z-50 border-r border-slate-100 flex flex-col items-center justify-center shadow-[6px_0_15px_-5px_rgba(0,0,0,0.05)]">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                    <Building className="w-6 h-6 text-slate-300" />
                                </div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-3 rotate-180 [writing-mode:vertical-lr]">Vehicle Specs</span>
                            </div>
                            {selectedCars.map(car => (
                                <div key={car.id} className="p-8 border-l border-slate-100 relative group bg-white/50 hover:bg-white transition-all duration-500">
                                    <button 
                                        onClick={() => onRemove(car)}
                                        className="absolute top-4 right-4 p-2 bg-white text-slate-300 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                                        title="Remove from comparison"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="relative aspect-[16/10] bg-slate-50/50 rounded-3xl p-6 mb-6 ring-1 ring-slate-100 flex items-center justify-center group-hover:scale-[1.05] group-hover:bg-slate-50 transition-all duration-500 ease-out">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-200/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img src={car.image} alt={car.model} className="max-h-full object-contain drop-shadow-2xl z-10" />
                                        {car.hogicarChoice && (
                                            <div className="absolute -top-3 -right-3 bg-slate-900 text-white p-2 rounded-xl shadow-xl z-20 flex items-center gap-1.5 animate-bounce-subtle">
                                                <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">Top Pick</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{car.category}</span>
                                            {car.year && <span className="text-[10px] font-bold text-slate-400">{car.year}</span>}
                                        </div>
                                        <h3 className="font-black text-slate-900 text-xl leading-tight uppercase tracking-tight mb-4 group-hover:text-[#008009] transition-colors">{car.make} {car.model}</h3>
                                        
                                        <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                                            <img src={car.supplier.logo} className="h-7 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all" alt={car.supplier.name} />
                                            <div className="w-px h-6 bg-slate-100" />
                                            <div className="flex items-center gap-1.5">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                <span className="text-sm font-black text-slate-900">{car.supplier.rating}</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleSelectCar(car)}
                                            className="mt-6 w-full py-4 bg-[#008009] text-white rounded-2xl text-xs font-black uppercase tracking-[0.15em] hover:bg-slate-900 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] transition-all duration-300 flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                                        >
                                            <span className="relative z-10">Select Vehicle</span>
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-300 relative z-10" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Financial Analysis */}
                        <div className="bg-slate-50/50 px-8 py-4 flex items-center gap-3 border-y border-slate-100 sticky top-0 z-30">
                            <CreditCard className="w-4 h-4 text-[#008009]" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Financial Analysis & Pricing</span>
                        </div>
                        
                        <ComparisonRow 
                            label="Total Rental" 
                            icon={Calendar}
                            sublabel={`Includes taxes for ${days} days`}
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-black text-slate-900">{getCurrencySymbol()}{convertPrice(getTotalPrice(car)).toFixed(2)}</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#008009] animate-pulse" />
                                        <span className="text-[10px] text-[#008009] font-black uppercase tracking-widest">Best Value</span>
                                    </div>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Daily Rate" 
                            icon={Zap}
                            values={selectedCars.map(car => (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-base font-black text-slate-900">{getCurrencySymbol()}{convertPrice(getPricePerDay(car)).toFixed(2)}</span>
                                    <span className="text-[10px] text-slate-400 uppercase">/ day</span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Security Deposit" 
                            icon={Lock}
                            sublabel="Refundable amount at desk"
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center gap-1">
                                    <span className={`text-sm font-black ${car.deposit === 0 ? 'text-[#008009] bg-emerald-50 px-3 py-1 rounded-full' : 'text-slate-900'}`}>
                                        {car.deposit === 0 ? 'ZERO DEPOSIT' : `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}`}
                                    </span>
                                    {car.deposit > 0 && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Held on credit card</span>}
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Damage Excess" 
                            icon={Shield}
                            sublabel="Your maximum liability"
                            values={selectedCars.map(car => {
                                const excessValue = car.excess || 0;
                                return (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`text-sm font-black ${excessValue === 0 ? 'text-[#008009] bg-emerald-50 px-3 py-1 rounded-full' : 'text-slate-900'}`}>
                                            {excessValue === 0 ? 'ZERO EXCESS' : `${getCurrencySymbol()}${convertPrice(excessValue).toFixed(2)}`}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Damage & Theft</span>
                                    </div>
                                );
                            })} 
                        />

                        {/* Technical Specifications */}
                        <div className="bg-slate-50/50 px-8 py-4 flex items-center gap-3 border-y border-slate-100">
                            <GaugeCircle className="w-4 h-4 text-[#008009]" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Technical Specifications</span>
                        </div>
                        <ComparisonRow 
                            label="Transmission" 
                            icon={Wind}
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-[180px] justify-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <span className="text-xs font-black uppercase tracking-wider">{car.transmission}</span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Capacity" 
                            icon={Users}
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="text-base font-black">{car.passengers}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-black uppercase">Adults</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            <span className="text-base font-black">{car.bags}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-black uppercase">Bags</span>
                                    </div>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="SIPP Classification" 
                            icon={Info}
                            sublabel="Standard industry code"
                            values={selectedCars.map(car => (
                                <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-mono tracking-widest">{car.sippCode || 'XXXX'}</span>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Air Conditioning" 
                            icon={Wind}
                            values={selectedCars.map(car => (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${car.airCon ? 'bg-emerald-50 border-emerald-100 text-[#008009]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {car.airCon ? <Check className="w-4 h-4 stroke-[3px]" /> : <X className="w-4 h-4" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{car.airCon ? 'Equipped' : 'N/A'}</span>
                                </div>
                            ))} 
                        />

                        {/* Experience & Quality */}
                        <div className="bg-slate-50/50 px-8 py-4 flex items-center gap-3 border-y border-slate-100">
                            <Star className="w-4 h-4 text-[#008009]" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Customer Experience & Ratings</span>
                        </div>
                        <ComparisonRow 
                            label="Service Ratings" 
                            icon={Award}
                            sublabel="Verified customer feedback"
                            values={selectedCars.map(car => (
                                <div className="space-y-3 w-full px-4">
                                    <RatingBar value={car.detailedRatings?.cleanliness || 85} label="Cleanliness" />
                                    <RatingBar value={car.detailedRatings?.condition || 82} label="Condition" />
                                    <RatingBar value={car.detailedRatings?.pickupSpeed || 78} label="Speed" />
                                </div>
                            ))} 
                        />

                        {/* Policies & Terms */}
                        <div className="bg-slate-50/50 px-8 py-4 flex items-center gap-3 border-y border-slate-100">
                            <Key className="w-4 h-4 text-[#008009]" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Operational Policies</span>
                        </div>
                        <ComparisonRow 
                            label="Fuel Policy" 
                            icon={Fuel}
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-500">
                                        <Fuel className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{car.fuelPolicy.replace(/_/g, ' ')}</span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Mileage Policy" 
                            icon={GaugeCircle}
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`p-2.5 rounded-2xl ${car.unlimitedMileage ? 'bg-emerald-50 text-[#008009]' : 'bg-amber-50 text-amber-500'}`}>
                                        <GaugeCircle className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${car.unlimitedMileage ? 'text-[#008009]' : 'text-amber-500'}`}>
                                        {car.unlimitedMileage ? 'UNLIMITED MILES' : 'LIMITED'}
                                    </span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Pickup Logistics" 
                            icon={Building}
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        {car.supplier.pickupType === 'IN_TERMINAL' && <Plane className="w-4 h-4 text-blue-500" />}
                                        {car.supplier.pickupType === 'MEET_AND_GREET' && <Handshake className="w-4 h-4 text-emerald-500" />}
                                        {car.supplier.pickupType === 'SHUTTLE_BUS' && <Bus className="w-4 h-4 text-orange-500" />}
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900">
                                            {car.supplier.pickupType?.replace(/_/g, ' ') || 'STANDARD'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-[160px]">
                                        {car.locationDetail || 'Main Terminal Location'}
                                    </span>
                                </div>
                            ))} 
                        />

                        {/* Inclusions */}
                        <div className="bg-slate-50/50 px-8 py-4 flex items-center gap-3 border-y border-slate-100">
                            <Shield className="w-4 h-4 text-[#008009]" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Standard Inclusions</span>
                        </div>
                        <ComparisonRow 
                            label="Insurance Cover" 
                            icon={Shield}
                            values={selectedCars.map(car => (
                                <div className="space-y-2 w-full px-4">
                                    <div className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-xl">
                                        <span className="text-[9px] font-black uppercase text-slate-500">CDW</span>
                                        {car.supplier.includesCDW ? <Check className="w-3.5 h-3.5 text-[#008009] stroke-[3px]" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-xl">
                                        <span className="text-[9px] font-black uppercase text-slate-500">Theft Protection</span>
                                        {car.supplier.includesTP ? <Check className="w-3.5 h-3.5 text-[#008009] stroke-[3px]" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                                    </div>
                                </div>
                            ))} 
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Shield className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Safe & Secure Booking</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Instant confirmation with premium protection</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button 
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Refine Search
                        </button>
                        <div className="hidden sm:block w-px h-10 bg-slate-100" />
                        <button 
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] active:scale-95"
                        >
                            Compare Others
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
