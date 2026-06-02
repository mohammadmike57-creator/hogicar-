
import * as React from 'react';
import { X, Check, Users, Briefcase, Fuel, Zap, Shield, Award, Building, CreditCard, ArrowLeftRight, Plane, Handshake, Bus, GaugeCircle, Wind, Star } from 'lucide-react';
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
    const search = { pickupDate: startDate, dropoffDate: endDate };

    const ComparisonRow = ({ label, values, highlightBest = false }: { label: string; values: (string | number | React.ReactNode)[]; highlightBest?: boolean }) => (
        <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(150px,1fr))] items-center border-b border-slate-100 last:border-0">
            <div className="bg-slate-50/50 p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider h-full flex items-center">
                {label}
            </div>
            {values.map((val, idx) => (
                <div key={idx} className="p-4 text-center border-l border-slate-100 h-full flex items-center justify-center font-bold text-slate-800 text-sm">
                    {val}
                </div>
            ))}
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

    const getDeposit = (car: Car) => car.deposit || 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#008009] p-3 rounded-2xl shadow-lg shadow-emerald-100">
                            <ArrowLeftRight className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Compare Vehicles</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Side-by-side analysis of your choices</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 hover:text-slate-800 transition-all active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Comparison Table */}
                <div className="flex-grow overflow-auto custom-scrollbar">
                    <div className="min-w-[800px]">
                        {/* Car Header Cards */}
                        <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(150px,1fr))] bg-white sticky top-0 z-[5]">
                            <div className="bg-slate-50/50 border-b border-slate-100"></div>
                            {selectedCars.map(car => (
                                <div key={car.id} className="p-6 border-l border-b border-slate-100 relative group">
                                    <button 
                                        onClick={() => onRemove(car)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="aspect-[16/10] bg-slate-50 rounded-2xl p-4 mb-4 ring-1 ring-slate-100 flex items-center justify-center">
                                        <img src={car.image} alt={car.model} className="max-h-full object-contain drop-shadow-md" />
                                    </div>
                                    
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-[#008009] uppercase tracking-widest mb-1">{car.category}</p>
                                        <h3 className="font-black text-slate-900 text-base leading-tight uppercase tracking-tight">{car.make} {car.model}</h3>
                                        <div className="mt-4 flex items-center justify-center gap-2">
                                            <img src={car.supplier.logo} className="h-6 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" alt={car.supplier.name} />
                                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                <Star className="w-3 h-3 text-[#008009] fill-[#008009]" />
                                                <span className="text-[10px] font-black text-[#008009]">{car.supplier.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pricing Section */}
                        <div className="bg-slate-50/30 px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-y border-slate-100">Pricing & Value</div>
                        <ComparisonRow 
                            label="Total Price" 
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-[#008009]">{getCurrencySymbol()}{convertPrice(getTotalPrice(car)).toFixed(2)}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">For {days} days</span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Daily Rate" 
                            values={selectedCars.map(car => (
                                <span className="text-slate-900 font-black">{getCurrencySymbol()}{convertPrice(getPricePerDay(car)).toFixed(2)}</span>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Refundable Deposit" 
                            values={selectedCars.map(car => (
                                <span className={`font-black ${car.deposit === 0 ? 'text-[#008009]' : 'text-slate-900'}`}>
                                    {car.deposit === 0 ? 'NO DEPOSIT' : `${getCurrencySymbol()}${convertPrice(car.deposit).toFixed(2)}`}
                                </span>
                            ))} 
                        />

                        {/* Technical Specs */}
                        <div className="bg-slate-50/30 px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-y border-slate-100">Technical Specifications</div>
                        <ComparisonRow 
                            label="Transmission" 
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-2 uppercase tracking-wide">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Wind className="w-3.5 h-3.5" /></div>
                                    {car.transmission}
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Passengers" 
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Users className="w-3.5 h-3.5" /></div>
                                    {car.passengers} Adults
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Baggage" 
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Briefcase className="w-3.5 h-3.5" /></div>
                                    {car.bags} Large Bags
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Doors" 
                            values={selectedCars.map(car => (
                                <span className="font-bold">{car.doors} Doors</span>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Air Conditioning" 
                            values={selectedCars.map(car => (
                                car.airCon ? <div className="bg-emerald-50 text-[#008009] p-1 rounded-full"><Check className="w-4 h-4" /></div> : <span className="text-slate-400">Not Specified</span>
                            ))} 
                        />

                        {/* Policies */}
                        <div className="bg-slate-50/30 px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-y border-slate-100">Policies & Terms</div>
                        <ComparisonRow 
                            label="Fuel Policy" 
                            values={selectedCars.map(car => (
                                <div className="flex flex-col items-center gap-1">
                                    <Fuel className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] uppercase tracking-wide">{car.fuelPolicy.replace(/_/g, ' ')}</span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Mileage" 
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-2">
                                    <GaugeCircle className={`w-4 h-4 ${car.unlimitedMileage ? 'text-[#008009]' : 'text-amber-500'}`} />
                                    <span className="text-[10px] uppercase font-black">{car.unlimitedMileage ? 'UNLIMITED' : 'LIMITED'}</span>
                                </div>
                            ))} 
                        />
                        <ComparisonRow 
                            label="Pickup Location" 
                            values={selectedCars.map(car => (
                                <div className="flex items-center gap-2 text-[10px] uppercase">
                                    {car.supplier.pickupType === 'IN_TERMINAL' && <Plane className="w-3.5 h-3.5 text-blue-500" />}
                                    {car.supplier.pickupType === 'MEET_AND_GREET' && <Handshake className="w-3.5 h-3.5 text-emerald-500" />}
                                    {car.supplier.pickupType === 'SHUTTLE_BUS' && <Bus className="w-3.5 h-3.5 text-orange-500" />}
                                    {car.locationDetail || 'See Details'}
                                </div>
                            ))} 
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Secure your choice with Hogicar
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        Back to Search
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
