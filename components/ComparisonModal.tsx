
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Users, Briefcase, Fuel, Zap, Shield, Award, Building, CreditCard, ArrowLeftRight, Plane, Handshake, Bus, GaugeCircle, Wind, Star, ArrowRight } from 'lucide-react';
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
        // Persist the car ID and the full results list for the next page
        sessionStorage.setItem('hogicar_selectedCarId', car.id);
        sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
        // We don't have the full cars list here, but we can try to get it from sessionStorage if it exists
        // or just let the details page handle it from its own API fetch fallback if needed.
        // Actually, CarCard sets hogicar_cars.
        
        navigate(`/car/${car.id}${searchParams}`);
    };

    const ComparisonRow = ({ label, values, highlightBest = false }: { label: string; values: (string | number | React.ReactNode)[]; highlightBest?: boolean }) => (
        <div 
            className="grid items-center border-b border-slate-100 last:border-0 w-max min-w-full"
            style={{ gridTemplateColumns: `120px repeat(${selectedCars.length}, minmax(220px, 1fr))` }}
        >
            <div className="bg-slate-50/90 backdrop-blur-sm p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider h-full flex items-center sticky left-0 z-20 border-r border-slate-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                {label}
            </div>
            {values.map((val, idx) => (
                <div key={idx} className="p-6 text-center border-l border-slate-100 h-full flex items-center justify-center font-bold text-slate-800 text-sm bg-white">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 md:p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-7xl h-full sm:h-[95vh] md:h-auto md:max-h-[90vh] sm:rounded-3xl md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300">
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
                <div className="flex-grow overflow-auto custom-scrollbar bg-slate-50/50">
                    <div className="min-w-full">
                        {/* Car Header Cards */}
                        <div 
                            className="grid bg-white sticky top-0 z-30 border-b border-slate-200 shadow-sm w-max min-w-full"
                            style={{ gridTemplateColumns: `120px repeat(${selectedCars.length}, minmax(220px, 1fr))` }}
                        >
                            <div className="bg-slate-50/90 backdrop-blur-sm sticky left-0 z-40 border-r border-slate-100 flex items-center justify-center shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                <ArrowLeftRight className="w-5 h-5 text-slate-300" />
                            </div>
                            {selectedCars.map(car => (
                                <div key={car.id} className="p-6 border-l border-slate-100 relative group bg-white">
                                    <button 
                                        onClick={() => onRemove(car)}
                                        className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"
                                        title="Remove from comparison"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    <div className="aspect-[16/10] bg-slate-50 rounded-2xl p-4 mb-4 ring-1 ring-slate-100 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300">
                                        <img src={car.image} alt={car.model} className="max-h-full object-contain drop-shadow-lg" />
                                    </div>
                                    
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-[#008009] uppercase tracking-widest mb-1">{car.category}</p>
                                        <h3 className="font-black text-slate-900 text-base leading-tight uppercase tracking-tight line-clamp-1">{car.make} {car.model}</h3>
                                        <div className="mt-3 flex items-center justify-center gap-2">
                                            <img src={car.supplier.logo} className="h-6 w-auto object-contain" alt={car.supplier.name} />
                                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                <Star className="w-3 h-3 text-[#008009] fill-[#008009]" />
                                                <span className="text-[10px] font-black text-[#008009]">{car.supplier.rating}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSelectCar(car)}
                                            className="mt-4 w-full py-2.5 bg-[#008009] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00a30b] transition-all shadow-md flex items-center justify-center gap-2 group/btn"
                                        >
                                            Select Vehicle
                                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
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
