
import * as React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MOCK_CARS, MOCK_BOOKINGS, SUPPLIERS, calculatePrice, ADMIN_STATS } from '../services/mockData';
import { Car as CarIcon, Calendar, DollarSign, Plus, Settings, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, Save, LayoutDashboard, BookOpen, ChevronDown, ChevronUp, MapPin, Mail, Phone, Users, Briefcase, Zap, Fuel, Snowflake, ListPlus, Rss, Key, Link2, Copy, Menu, X, CalendarDays, PlusCircle, LogOut, Clock, MessageSquare, TrendingUp, History, ArrowRight, MoreHorizontal, Ban, Filter, Gift, Tag as TagIcon, FileText, Printer, Plane, Search, Layers, SlidersHorizontal, Hash, Info, Shield, ArrowLeft, UploadCloud, Download, Send, RefreshCw } from 'lucide-react';
import { Booking, Car, RateTier, CarType, CarCategory, Transmission, FuelPolicy, Extra, RateByDay, Supplier } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';

// --- MODALS ---

const BookingVoucherModal = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
    const car = MOCK_CARS.find(c => c.id === booking.carId);

    if (!booking || !car) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:h-full print:rounded-none flex flex-col font-sans">
                {/* Header (Hidden in Print) */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 print:hidden sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600"/> Voucher Preview
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                {/* Printable Voucher Content */}
                <div className="p-10 print:p-0 flex-grow bg-white text-slate-900" id="voucher-content">
                    
                    {/* 1. Official Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                        <div>
                            <img src={car.supplier.logo} alt={car.supplier.name} className="h-12 w-auto object-contain mb-4" />
                            <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">Rental Voucher</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">Confirmed Reservation</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Reference</span>
                                <span className="font-mono text-xl font-bold text-slate-900">{booking.id}</span>
                            </div>
                            <div className="mb-2">
                                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date of Issue</span>
                                <span className="font-medium text-slate-700">{booking.bookingDate}</span>
                            </div>
                            <div className={`inline-block px-3 py-1 rounded border text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                {booking.status}
                            </div>
                        </div>
                    </div>

                    {/* 2. Driver & Flight Info */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Main Driver</h4>
                            <p className="text-lg font-bold text-slate-900">{booking.customerName}</p>
                            {booking.customerPhone && (
                                <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-slate-400"/> {booking.customerPhone}
                                </p>
                            )}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Flight Details</h4>
                            {booking.flightNumber ? (
                                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Plane className="w-4 h-4 text-slate-400"/> {booking.flightNumber}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Not provided</p>
                            )}
                        </div>
                    </div>

                    {/* 3. Vehicle Details */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CarIcon className="w-4 h-4"/> Vehicle Information
                        </h4>
                        <div className="flex items-start gap-6">
                            <img src={car.image} alt={car.make} className="w-40 h-28 object-contain bg-white rounded border border-slate-200 p-2" />
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-slate-900">{car.make} {car.model}</h3>
                                <p className="text-sm text-slate-500 mb-4">or similar {car.category} class</p>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="block text-[10px] text-slate-400 uppercase">SIPP Code</span>
                                        <span className="font-mono font-bold text-slate-700">{car.sippCode}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 uppercase">Transmission</span>
                                        <span className="font-medium text-slate-700">{car.transmission}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 uppercase">Fuel Policy</span>
                                        <span className="font-medium text-slate-700">{car.fuelPolicy}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 uppercase">A/C</span>
                                        <span className="font-medium text-slate-700">{car.airCon ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Itinerary */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3 text-green-700">
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                <h4 className="text-sm font-bold uppercase tracking-wide">Pick-up</h4>
                            </div>
                            <p className="text-xl font-bold text-slate-900 mb-1">{booking.startDate}</p>
                            <p className="text-sm font-medium text-slate-700 mb-2">{booking.startTime || '10:00'}</p>
                            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">{car.location}</p>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3 text-red-700">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                <h4 className="text-sm font-bold uppercase tracking-wide">Drop-off</h4>
                            </div>
                            <p className="text-xl font-bold text-slate-900 mb-1">{booking.endDate}</p>
                            <p className="text-sm font-medium text-slate-700 mb-2">{booking.endTime || '10:00'}</p>
                            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">{car.location}</p>
                        </div>
                    </div>

                    {/* 5. Extras & Inclusions */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">Extras & Services</h4>
                        {booking.selectedExtras && booking.selectedExtras.length > 0 ? (
                            <ul className="space-y-2">
                                {booking.selectedExtras.map((extra, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                        <span className="text-slate-700 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-slate-400"/> {extra.name}</span>
                                        <span className="font-mono text-slate-500">${extra.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No optional extras selected.</p>
                        )}
                    </div>

                    {/* 6. Payment (Updated per request) */}
                    <div className="bg-slate-900 text-white rounded-lg p-6 flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400 print:text-slate-500">Payment Due at Desk</h4>
                            <p className="text-xs text-slate-500 mt-1 print:text-slate-400">Please present your credit card for this amount plus security deposit.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-extrabold tracking-tight">${booking.amountToPayAtDesk.toFixed(2)} USD</span>
                        </div>
                    </div>

                    {/* Footer / Terms */}
                    <div className="mt-12 text-[10px] text-slate-400 text-center leading-relaxed print:mt-8">
                        <p>Issued by Hogicar on behalf of {car.supplier.name}. This voucher confirms your reservation.</p>
                        <p className="mt-2">Important: The main driver must present a valid driving license and a credit card in their name at the time of pick-up. The credit card must have sufficient funds to cover the security deposit.</p>
                        <p className="mt-2">Customer Support: +1 (555) 123-4567 | support@hogicar.com</p>
                    </div>
                </div>

                {/* Actions (Hidden in Print) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 print:hidden rounded-b-xl">
                    <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                        <Printer className="w-4 h-4"/> Print / PDF
                    </button>
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-transform active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

const EditCarModal = ({ car, allExtras, isOpen, onClose, onSave }: { car: Car | null; allExtras: Extra[]; isOpen: boolean; onClose: () => void; onSave: (updatedCar: Car) => void; }) => {
    const [editedCar, setEditedCar] = React.useState<Car | null>(car);

    React.useEffect(() => {
        if (isOpen) {
            setEditedCar(car);
        }
    }, [car, isOpen]);

    if (!isOpen || !editedCar) return null;

    const handleCarChange = (field: keyof Car, value: any) => {
        setEditedCar(prev => (prev ? { ...prev, [field]: value } : null));
    };

    const toggleExtra = (extra: Extra) => {
        setEditedCar(prev => {
            if (!prev) return null;
            const hasExtra = prev.extras.some(e => e.id === extra.id);
            let newExtras;
            if (hasExtra) {
                newExtras = prev.extras.filter(e => e.id !== extra.id);
            } else {
                newExtras = [...prev.extras, extra];
            }
            return { ...prev, extras: newExtras };
        });
    }
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">Edit Vehicle: {editedCar.make || 'New Vehicle'} {editedCar.model}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><XCircle className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Vehicle Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Make" value={editedCar.make} onChange={e => handleCarChange('make', e.target.value)} />
                        <InputField label="Model" value={editedCar.model} onChange={e => handleCarChange('model', e.target.value)} />
                        <InputField label="Year" type="number" value={editedCar.year} onChange={e => handleCarChange('year', +e.target.value)} />
                        <InputField label="SIPP Code" value={editedCar.sippCode} onChange={e => handleCarChange('sippCode', e.target.value)} />
                        <InputField label="Location" value={editedCar.location} onChange={e => handleCarChange('location', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="Deposit ($)" type="number" value={editedCar.deposit} onChange={e => handleCarChange('deposit', +e.target.value)} />
                            <InputField label="Excess ($)" type="number" value={editedCar.excess} onChange={e => handleCarChange('excess', +e.target.value)} />
                        </div>
                    </div>
                    {/* Vehicle Specs Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SelectField label="Category" value={editedCar.category} onChange={e => handleCarChange('category', e.target.value)} options={Object.values(CarCategory)} />
                        <SelectField label="Type" value={editedCar.type} onChange={e => handleCarChange('type', e.target.value)} options={Object.values(CarType)} />
                        <InputField label="Passengers" type="number" value={editedCar.passengers} onChange={e => handleCarChange('passengers', +e.target.value)} />
                        <InputField label="Bags" type="number" value={editedCar.bags} onChange={e => handleCarChange('bags', +e.target.value)} />
                        <InputField label="Doors" type="number" value={editedCar.doors} onChange={e => handleCarChange('doors', +e.target.value)} />
                        <SelectField label="Transmission" value={editedCar.transmission} onChange={e => handleCarChange('transmission', e.target.value)} options={Object.values(Transmission)} />
                        <SelectField label="Fuel Policy" value={editedCar.fuelPolicy} onChange={e => handleCarChange('fuelPolicy', e.target.value)} options={Object.values(FuelPolicy)} />
                         <div className="flex items-center pt-6"><label className="flex items-center text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={editedCar.airCon} onChange={e => handleCarChange('airCon', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" /> Air Conditioning</label></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Extras Selection Section */}
                        <div className="col-span-2">
                             <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ListPlus className="w-4 h-4 text-purple-600"/> Enable Extras</h4>
                             <p className="text-xs text-slate-500 mb-3">Select which extras are available for this vehicle. Manage prices and promotions in the "Extras" tab.</p>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {allExtras.map(extra => {
                                    const isSelected = editedCar.extras.some(e => e.id === extra.id);
                                    return (
                                        <div key={extra.id} onClick={() => toggleExtra(extra)} className={`border rounded-lg p-2 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-semibold text-slate-800">{extra.name}</span>
                                                    <span className="block text-[10px] text-slate-500">{extra.promotionLabel ? <span className="text-green-600 font-bold">{extra.promotionLabel}</span> : `$${extra.price} / ${extra.type === 'per_day' ? 'day' : 'trip'}`}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {allExtras.length === 0 && <p className="text-xs text-slate-400 italic col-span-3">No extras defined. Go to 'Extras' tab to create them.</p>}
                             </div>
                        </div>
                    </div>

                </div>
                <div className="flex justify-end items-center p-4 bg-slate-50 border-t gap-3 sticky bottom-0">
                    <button onClick={onClose} className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-xs shadow-sm">Cancel</button>
                    <button onClick={() => onSave(editedCar)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2"><Save className="w-3.5 h-3.5"/> Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// 1. Create Period Modal with Promotion Support
const CreatePeriodModal = ({ isOpen, onClose, onSave, year }: { isOpen: boolean; onClose: () => void; onSave: (name: string, start: string, end: string, promotionLabel?: string) => void, year: number | null }) => {
    const [name, setName] = React.useState('');
    const [start, setStart] = React.useState('');
    const [end, setEnd] = React.useState('');
    const [isPromotion, setIsPromotion] = React.useState(false);
    const [promotionLabel, setPromotionLabel] = React.useState('');

    React.useEffect(() => {
        // Reset form when modal opens for a new year
        setName('');
        setStart(year ? `${year}-01-01` : '');
        setEnd(year ? `${year}-01-01` : '');
        setIsPromotion(false);
        setPromotionLabel('');
    }, [isOpen, year]);

    if (!isOpen || !year) return null;

    const handleSave = () => {
        if (!name || !start || !end) return alert('Please fill in all fields');
        if (new Date(start) > new Date(end)) return alert('Start date must be before end date');
        if (isPromotion && !promotionLabel) return alert('Please enter a promotion label');
        
        onSave(name, start, end, isPromotion ? promotionLabel : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">New Period for {year}</h3>
                <div className="space-y-3">
                    <InputField label="Period Name" placeholder="e.g. Summer Season" value={name} onChange={e => setName(e.target.value)} />
                    <InputField label="Start Date" type="date" value={start} onChange={e => setStart(e.target.value)} min={`${year}-01-01`} max={`${year}-12-31`} />
                    <InputField label="End Date" type="date" value={end} onChange={e => setEnd(e.target.value)} min={start || `${year}-01-01`} max={`${year}-12-31`} />
                    
                    <div className="pt-3 border-t border-slate-100">
                        <label className="flex items-center text-sm font-semibold text-slate-700 cursor-pointer mb-2">
                            <input type="checkbox" checked={isPromotion} onChange={e => setIsPromotion(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                            This is a Promotional Period
                        </label>
                        {isPromotion && (
                            <div className="animate-fadeIn bg-green-50 p-3 rounded border border-green-100">
                                <InputField label="Promotion Label" placeholder="e.g. Winter Sale - 20% Off!" value={promotionLabel} onChange={e => setPromotionLabel(e.target.value)} />
                                <p className="text-[10px] text-green-700 mt-1">This label will be shown to customers.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-3">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">Create Period</button>
                </div>
            </div>
        </div>
    );
};

// 2. Manage Rates Modal
const ManageRatesModal = ({ tier, isOpen, onClose, onSave }: { tier: RateTier; isOpen: boolean; onClose: () => void; onSave: (rates: RateByDay[]) => void }) => {
    const [rates, setRates] = React.useState<RateByDay[]>([]);
    const [newBand, setNewBand] = React.useState({ minDays: '', maxDays: '', dailyRate: '' });
    
    // FIX: Use React.useEffect to sync internal state with props, preventing stale data.
    React.useEffect(() => {
        if (isOpen && tier) {
            setRates(tier.rates || []);
        }
    }, [tier, isOpen]);

    if (!isOpen) return null;

    const handleAddBand = () => {
        const min = parseInt(newBand.minDays);
        const max = parseInt(newBand.maxDays);
        const rate = parseFloat(newBand.dailyRate);
        
        if (!min || !max || !rate) return;
        
        const overlap = rates.some(r => (min >= r.minDays && min <= r.maxDays) || (max >= r.minDays && max <= r.maxDays));
        if (overlap) return alert('Duration range overlaps with existing band.');

        const updated = [...rates, { minDays: min, maxDays: max, dailyRate: rate }].sort((a,b) => a.minDays - b.minDays);
        setRates(updated);
        setNewBand({ minDays: '', maxDays: '', dailyRate: '' });
    };

    const removeBand = (idx: number) => {
        setRates(rates.filter((_, i) => i !== idx));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Manage Rates</h3>
                        <p className="text-xs text-slate-500">{tier.name} ({tier.startDate} - {tier.endDate})</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                
                <div className="p-4 flex-grow overflow-y-auto">
                    <div className="space-y-2 mb-4">
                        {rates.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No pricing bands configured yet.</p>}
                        {rates.map((r, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                                <span className="font-medium text-slate-700">{r.minDays} - {r.maxDays} Days</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-900">${r.dailyRate}</span>
                                    <button onClick={() => removeBand(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 p-3 rounded border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 mb-2">Add Rate Band</p>
                        <div className="flex gap-2">
                            <input type="number" placeholder="Min" className="w-16 p-1 text-base border rounded" value={newBand.minDays} onChange={e => setNewBand({...newBand, minDays: e.target.value})} />
                            <span className="text-slate-400 self-center">-</span>
                            <input type="number" placeholder="Max" className="w-16 p-1 text-base border rounded" value={newBand.maxDays} onChange={e => setNewBand({...newBand, maxDays: e.target.value})} />
                            <span className="text-slate-400 self-center text-xs">Days</span>
                            <div className="flex-grow relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input type="number" placeholder="Price" className="w-full pl-5 p-1 text-base border rounded" value={newBand.dailyRate} onChange={e => setNewBand({...newBand, dailyRate: e.target.value})} />
                            </div>
                            <button onClick={handleAddBand} className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"><Plus className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={() => onSave(rates)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Rates</button>
                </div>
            </div>
        </div>
    );
};

const AddStopSaleModal = ({ fleet, isOpen, onClose, onSave }: { fleet: Car[], isOpen: boolean, onClose: () => void, onSave: (carId: string, start: string, end: string) => void }) => {
    const [selectedCar, setSelectedCar] = React.useState(fleet.length > 0 ? fleet[0].id : '');
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');

    React.useEffect(() => {
        if(fleet.length > 0 && !selectedCar) setSelectedCar(fleet[0].id);
    }, [fleet]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!selectedCar || !startDate || !endDate) return alert("Please fill all fields");
        onSave(selectedCar, startDate, endDate);
        setStartDate('');
        setEndDate('');
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Ban className="w-5 h-5 text-red-600"/> Block Dates</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Vehicle</label>
                        <select value={selectedCar} onChange={e => setSelectedCar(e.target.value)} className="w-full border-slate-300 rounded-md border text-base py-2 px-3">
                            {fleet.map(c => <option key={c.id} value={c.id}>{c.make} {c.model} ({c.sippCode})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <InputField label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleSave} className="w-full mt-6 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700">Add Stop Sale</button>
            </div>
        </div>
    )
}

// 3. Edit Extra Modal
const EditExtraModal = ({ extra, isOpen, onClose, onSave }: { extra: Extra | null; isOpen: boolean; onClose: () => void; onSave: (extra: Extra) => void }) => {
    const [editedExtra, setEditedExtra] = React.useState<Extra>(extra || { id: '', name: '', price: 0, type: 'per_day', promotionLabel: '' });
    const [isPromotion, setIsPromotion] = React.useState(!!extra?.promotionLabel);

    React.useEffect(() => {
        if (extra) {
            setEditedExtra(extra);
            setIsPromotion(!!extra.promotionLabel);
        } else {
            setEditedExtra({ id: '', name: '', price: 0, type: 'per_day', promotionLabel: '' });
            setIsPromotion(false);
        }
    }, [extra, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!editedExtra.name) return alert('Name is required');
        const finalExtra = {
            ...editedExtra,
            promotionLabel: isPromotion ? editedExtra.promotionLabel : undefined
        };
        onSave(finalExtra);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{extra ? 'Edit Extra' : 'Create New Extra'}</h3>
                <div className="space-y-4">
                    <InputField label="Name" placeholder="e.g. GPS, Child Seat" value={editedExtra.name} onChange={e => setEditedExtra({...editedExtra, name: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Price" type="number" value={editedExtra.price} onChange={e => setEditedExtra({...editedExtra, price: parseFloat(e.target.value) || 0})} />
                        <SelectField label="Type" value={editedExtra.type} onChange={e => setEditedExtra({...editedExtra, type: e.target.value as any})} options={['per_day', 'per_rental']} />
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <label className="flex items-center text-sm font-semibold text-slate-700 cursor-pointer mb-2">
                            <input type="checkbox" checked={isPromotion} onChange={e => setIsPromotion(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                            Enable Promotion / Free Offer
                        </label>
                        {isPromotion && (
                            <div className="animate-fadeIn bg-green-50 p-3 rounded border border-green-100">
                                <InputField label="Promotion Label" placeholder="e.g. Free for Summer!" value={editedExtra.promotionLabel || ''} onChange={e => setEditedExtra({...editedExtra, promotionLabel: e.target.value})} />
                                <p className="text-[10px] text-green-700 mt-1">This text will be shown on the car card.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-3">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">Save Extra</button>
                </div>
            </div>
        </div>
    );
};

const ExcelUploadView = ({ year }: { year: number }) => {
    const [rateFile, setRateFile] = React.useState<File | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [processMessage, setProcessMessage] = React.useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setRateFile(e.target.files[0]);
            setProcessMessage('');
        }
    };

    const handleProcessFile = () => {
        if (!rateFile) return;
        setIsProcessing(true);
        setProcessMessage('');
        setTimeout(() => {
            setIsProcessing(false);
            setProcessMessage(`Success! Processed multiple periods from '${rateFile.name}' for ${year}. Pricing is now updated.`);
            setRateFile(null);
            // In a real app, this would parse the file based on the new format and update the data store.
        }, 2000);
    };

    const handleDownloadTemplate = () => {
        const csvContent = [
            ['Period Name', 'Summer High Season'],
            ['Start Date', '2024-06-01'],
            ['End Date', '2024-08-31'],
            [], // Empty row
            ['Sipp', 'CarType', '1-3', '4-7', '8-14', '15+'],
            ['MDAR', '"Kia Picanto or Similar"', '55', '52', '50', '48'],
            ['DDAR', '"Kia Pegas or Similar"', '65', '60', '58', '55'],
            ['SDAR', '"Kia Cerato or Similar"', '70', '68', '65', '62'],
        ]
        .map(e => e.join(","))
        .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        // Even though it's CSV content, naming it .xlsx prompts Excel to open it.
        link.setAttribute('download', 'Hogicar_Rate_Template.xlsx');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fadeIn space-y-6 max-w-4xl mx-auto">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0"><Info className="h-5 w-5 text-blue-400"/></div>
                    <div className="ml-3 space-y-1">
                        <p className="text-sm font-bold text-blue-800">Multi-Sheet Pivot Format</p>
                        <p className="text-sm text-blue-700">
                            Your Excel file should contain multiple sheets. <strong>Each sheet represents one pricing period</strong> (e.g., "Summer", "Winter").
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">Sheet Structure Requirements</h3>
                <p className="text-xs text-slate-500 mb-4">Each sheet must be structured exactly like this example. The system reads period details from rows 1-3. The rate table begins at row 5. The headers from column C onwards (C5, D5, etc.) define your rental duration bands. These bands are flexible; you can create as many as you need and use formats like single days (`7`), ranges (`8-15`), or open-ended (`30+`).</p>
                
                <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto">
                    <p className="mb-2 font-bold text-slate-700">Example: A sheet named "Summer Season"</p>
                    <table className="w-full border-collapse">
                        <tbody>
                            <tr className="bg-slate-200"><td className="border border-slate-300 p-2 font-mono font-bold">A1: Period Name</td><td className="border border-slate-300 p-2 font-mono" colSpan={5}>B1: Summer High Season</td></tr>
                            <tr className="bg-slate-200"><td className="border border-slate-300 p-2 font-mono font-bold">A2: Start Date</td><td className="border border-slate-300 p-2 font-mono" colSpan={5}>B2: 2024-06-01</td></tr>
                            <tr className="bg-slate-200"><td className="border border-slate-300 p-2 font-mono font-bold">A3: End Date</td><td className="border border-slate-300 p-2 font-mono" colSpan={5}>B3: 2024-08-31</td></tr>
                            <tr><td className="p-1" colSpan={6}></td></tr>
                            <tr className="bg-slate-800 text-white font-bold text-left">
                                <td className="border border-slate-400 p-2">Sipp</td>
                                <td className="border border-slate-400 p-2">CarType</td>
                                <td className="border border-slate-400 p-2">1-3</td>
                                <td className="border border-slate-400 p-2">4-7</td>
                                <td className="border border-slate-400 p-2">8-14</td>
                                <td className="border border-slate-400 p-2">15+</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="border border-slate-300 p-2 font-mono">MDAR</td>
                                <td className="border border-slate-300 p-2">Kia Picanto or Similar</td>
                                <td className="border border-slate-300 p-2 font-mono">55</td>
                                <td className="border border-slate-300 p-2 font-mono">52</td>
                                <td className="border border-slate-300 p-2 font-mono">50</td>
                                <td className="border border-slate-300 p-2 font-mono">48</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="border border-slate-300 p-2 font-mono">DDAR</td>
                                <td className="border border-slate-300 p-2">Kia Pegas or Similar</td>
                                <td className="border border-slate-300 p-2 font-mono">65</td>
                                <td className="border border-slate-300 p-2 font-mono">60</td>
                                <td className="border border-slate-300 p-2 font-mono">58</td>
                                <td className="border border-slate-300 p-2 font-mono">55</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="border border-slate-300 p-2 font-mono">SDAR</td>
                                <td className="border border-slate-300 p-2">Kia Cerato or Similar</td>
                                <td className="border border-slate-300 p-2 font-mono">70</td>
                                <td className="border border-slate-300 p-2 font-mono">68</td>
                                <td className="border border-slate-300 p-2 font-mono">65</td>
                                <td className="border border-slate-300 p-2 font-mono">62</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={handleDownloadTemplate} className="text-xs font-semibold text-blue-600 hover:underline mt-3 flex items-center gap-1"><Download className="w-3 h-3"/> Download Template.xlsx</button>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Your File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-slate-400"/>
                        {rateFile ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FileText className="w-4 h-4 text-slate-400"/>
                                <span className="font-medium">{rateFile.name}</span>
                                <button onClick={() => setRateFile(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <div className="flex text-sm text-slate-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>Select a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv"/>
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                        )}
                        <p className="text-xs text-slate-500">XLSX, XLS, CSV up to 10MB</p>
                    </div>
                </div>
            </div>

            <div>
                <button onClick={handleProcessFile} disabled={!rateFile || isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    {isProcessing ? 'Processing...' : 'Upload and Process Rates'}
                </button>
                {processMessage && (
                     <div className={`mt-4 p-3 rounded-md text-xs font-medium text-center ${processMessage.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {processMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

const InputField = ({ label, ...props }: { label: string, [key: string]: any }) => (<label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}</span><input {...props} className="block w-full border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3" /></label>);
const SelectField = ({ label, options, ...props }: { label: string, options: string[], [key: string]: any }) => (<label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}</span><select {...props} className="block w-full border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3 appearance-none bg-white">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>);

const getRateStatus = (endDate: string): { label: string, color: string, icon: React.ElementType } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);

    if (end < today) {
        return { label: 'Expired', color: 'bg-slate-100 text-slate-500', icon: History };
    }
    // Any non-expired period is now considered 'Active'.
    return { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
};

const SupplierDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState<'dashboard' | 'fleet' | 'bookings' | 'pricing' | 'settings' | 'stopsales' | 'extras'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const supplierId = (location.state as { supplierId: string })?.supplierId || 's1'; 
  const [supplierData, setSupplierData] = React.useState<Supplier>(SUPPLIERS.find(s => s.id === supplierId)!);

  const [bookings, setBookings] = React.useState<Booking[]>(() => MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === supplierId)));
  const [fleet, setFleet] = React.useState<Car[]>(() => MOCK_CARS.filter(c => c.supplier.id === supplierId));

  const [editingCar, setEditingCar] = React.useState<Car | null>(null);
  
  // New State for Period/Rate workflow
  const [isPeriodModalOpen, setIsPeriodModalOpen] = React.useState(false);
  const [editingRatesTier, setEditingRatesTier] = React.useState<RateTier | null>(null);
  const [rateModalTarget, setRateModalTarget] = React.useState<{ type: 'category' | 'vehicle', id: string } | null>(null);
  const [expandedCarId, setExpandedCarId] = React.useState<string | null>(null);
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);


  const supplierBookingStats = React.useMemo(() => {
    const monthlyBookings: {[key: string]: number} = {};
    bookings.forEach(b => {
      const month = new Date(b.startDate).getMonth();
      if (!monthlyBookings[month]) monthlyBookings[month] = 0;
      monthlyBookings[month]++;
    });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((name, index) => ({ name, bookings: monthlyBookings[index] || 0 }));
  }, [bookings]);

  const allExtras = React.useMemo(() => {
      const uniqueExtras = new Map<string, Extra>();
      MOCK_CARS.filter(c => c.supplier.id === supplierId).forEach(car => {
          (car.extras || []).forEach(e => {
              if (!uniqueExtras.has(e.name)) uniqueExtras.set(e.name, e);
          });
      });
      if(uniqueExtras.size === 0) {
          return [
            { id: 'ex-1', name: 'GPS Navigation', price: 12, type: 'per_day' as const },
            { id: 'ex-2', name: 'Child Seat', price: 10, type: 'per_day' as const }
          ];
      }
      return Array.from(uniqueExtras.values());
  }, [fleet]);

  const refreshLocalState = () => {
    setFleet([...MOCK_CARS.filter(c => c.supplier.id === supplierId)]);
    setBookings([...MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === supplierId))]);
  };

  const handleBookingAction = (id: string, action: 'confirm' | 'reject') => {
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
        MOCK_BOOKINGS[bookingIndex].status = action === 'confirm' ? 'confirmed' : 'cancelled';
    }
    refreshLocalState();
  };

  const handleStopSaleAdd = (carId: string, start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dates: string[] = [];
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }
    const carIndex = MOCK_CARS.findIndex(c => c.id === carId);
    if (carIndex !== -1) {
        const carToUpdate = MOCK_CARS[carIndex];
        const newStopSales = Array.from(new Set([...carToUpdate.stopSales, ...dates])).sort();
        MOCK_CARS[carIndex] = { ...carToUpdate, stopSales: newStopSales };
    }
    refreshLocalState();
  };

  const handleStopSaleRemove = (carId: string, date: string) => {
      const carIndex = MOCK_CARS.findIndex(c => c.id === carId);
      if (carIndex !== -1) {
          const carToUpdate = MOCK_CARS[carIndex];
          const newStopSales = carToUpdate.stopSales.filter(d => d !== date);
          MOCK_CARS[carIndex] = { ...carToUpdate, stopSales: newStopSales };
      }
      refreshLocalState();
  }
  
  const handleDeleteCar = (carId: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
        const index = MOCK_CARS.findIndex(car => car.id === carId);
        if (index > -1) MOCK_CARS.splice(index, 1);
        refreshLocalState();
    }
  }

  const handleAddVehicle = () => {
      const newCar: Car = {
          id: `c${Date.now()}`,
          make: '', model: '', year: new Date().getFullYear(),
          category: CarCategory.ECONOMY, type: CarType.SEDAN,
          sippCode: '', transmission: Transmission.AUTOMATIC,
          passengers: 4, bags: 2, doors: 4, airCon: true,
          image: 'https://placehold.co/400x300/e2e8f0/64748b?text=New+Car',
          supplier: supplierData,
          features: [], fuelPolicy: FuelPolicy.FULL_TO_FULL,
          isAvailable: true, location: supplierData.location,
          deposit: 300, excess: 1000,
          stopSales: [], rateTiers: [], extras: [],
          locationDetail: 'In Terminal',
          unlimitedMileage: true,
      };
      setEditingCar(newCar);
  };
  
  const handleSaveCar = (updatedCar: Car) => {
      const carIndex = MOCK_CARS.findIndex(car => car.id === updatedCar.id);
      if (carIndex > -1) {
          MOCK_CARS[carIndex] = updatedCar;
      } else {
          MOCK_CARS.unshift(updatedCar);
      }
      setEditingCar(null);
      refreshLocalState();
  };

  const handleSaveExtra = (updatedExtra: Extra) => {
      const newId = updatedExtra.id || `ex-${Date.now()}`;
      const extraToSave = { ...updatedExtra, id: newId };
      MOCK_CARS.forEach(car => {
          if (car.supplier.id === supplierId) {
              const extraIndex = car.extras.findIndex(e => e.id === extraToSave.id || e.name === extraToSave.name);
              if (extraIndex > -1) car.extras[extraIndex] = extraToSave;
          }
      });
      refreshLocalState();
  };

  const handleCreateGlobalExtra = (newExtra: Extra) => {
      const extra = { ...newExtra, id: `ex-${Date.now()}` };
      MOCK_CARS.forEach(car => {
          if (car.supplier.id === supplierId) car.extras.push(extra);
      });
      refreshLocalState();
  };

  const handleCreatePeriod = (name: string, start: string, end: string, promotionLabel?: string) => {
      if (!rateModalTarget) return;
      const newTier: RateTier = {
          id: `tier-${Date.now()}`, name, startDate: start, endDate: end, rates: [], promotionLabel
      };
      MOCK_CARS.forEach(car => {
          if ((rateModalTarget.type === 'category' && car.category === rateModalTarget.id && car.supplier.id === supplierId) ||
              (rateModalTarget.type === 'vehicle' && car.id === rateModalTarget.id)) {
              car.rateTiers.push(newTier);
          }
      });
      setIsPeriodModalOpen(false);
      refreshLocalState();
  };

  const handleUpdateRates = (rates: RateByDay[]) => {
      if (!editingRatesTier || !rateModalTarget) return;
      MOCK_CARS.forEach(car => {
          if ((rateModalTarget.type === 'category' && car.category === rateModalTarget.id && car.supplier.id === supplierId) ||
              (rateModalTarget.type === 'vehicle' && car.id === rateModalTarget.id)) {
              const tier = car.rateTiers.find(t => t.id === editingRatesTier.id);
              if (tier) tier.rates = rates;
          }
      });
      setEditingRatesTier(null);
      refreshLocalState();
  };

  const handleDeleteRateTier = (tierId: string, target: { type: string, id: string }) => {
      if (!window.confirm("Delete this pricing period?")) return;
      MOCK_CARS.forEach(car => {
          if ((target.type === 'category' && car.category === target.id && car.supplier.id === supplierId) ||
              (target.type === 'vehicle' && car.id === target.id)) {
              car.rateTiers = car.rateTiers.filter(t => t.id !== tierId);
          }
      });
      refreshLocalState();
  };
  

  const NavItem = ({ section, label, icon: Icon }: { section: typeof activeSection, label: string, icon: React.ElementType }) => (
    <button onClick={() => { setActiveSection(section); setIsSidebarOpen(false); }} className={`flex items-center w-full px-4 py-3 md:py-2 rounded-md text-sm font-medium transition-colors ${activeSection === section ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
      <Icon className="w-5 h-5 md:w-4 md:h-4 mr-3" />
      <span>{label}</span>
    </button>
  );

  if (!supplierData) {
      return <div className="p-8">Error: Supplier not found or not logged in. <a href="/#/supplier-login" className="text-blue-600">Please log in.</a></div>;
  }

  // RENDER API-CONNECTED VIEW
  if (supplierData.connectionType === 'api') {
      return (
        <div className="bg-slate-100 min-h-screen">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row">
             <aside className="w-full md:w-64 flex-shrink-0 pr-0 md:pr-6 mb-6 md:mb-0">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <img src={supplierData.logo} alt="Supplier Logo" className="w-8 h-8 rounded-full" />
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm">{supplierData.name}</h2>
                            <p className="text-[10px] text-slate-500">Supplier Portal</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/supplier-login')} className="flex items-center w-full px-4 py-2 mt-auto rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
                      <LogOut className="w-4 h-4 mr-3" />
                      <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="flex-grow">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Rss className="w-6 h-6 text-blue-600"/>
                        <h2 className="text-lg font-bold text-slate-800">API Connection Active</h2>
                    </div>
                    <p className="text-sm text-slate-600 mb-6">
                        Your inventory, rates, and availability are managed automatically via your API endpoint. Manual editing through this portal is disabled to prevent data conflicts.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                        <div>
                           <label className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider">Your Endpoint URL</label>
                           <div className="flex items-center gap-2 font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 mt-1 overflow-x-auto"><Link2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/><span>{supplierData.apiConnection?.endpointUrl}</span></div>
                        </div>
                        <div>
                           <label className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider">Your Account ID</label>
                           <div className="flex items-center gap-2 font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 mt-1"><Key className="w-3.5 h-3.5 text-slate-400"/><span>{supplierData.apiConnection?.accountId}</span></div>
                        </div>
                         <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">Please contact support if you need to update your credentials or switch to manual management.</p>
                    </div>
                </div>
            </main>
          </div>
        </div>
      );
  }

  // --- DASHBOARD CONTENT REDESIGN ---
  const DashboardContent = () => (
    <div className="space-y-8">
      {/* Hero Welcome Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-3xl font-extrabold mb-2">Good afternoon, {supplierData.name}</h2>
              <p className="text-blue-100 max-w-xl text-sm leading-relaxed">Here is your daily performance overview. You have {bookings.filter(b => b.status === 'pending').length} pending reservations requiring your attention today.</p>
              
              <div className="mt-6 flex gap-3">
                  <button onClick={() => setActiveSection('bookings')} className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Manage Bookings
                  </button>
                  <button onClick={() => setActiveSection('pricing')} className="bg-blue-800/50 hover:bg-blue-800/70 text-white border border-blue-400/30 px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Update Rates
                  </button>
              </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <CarIcon className="w-64 h-64 -mb-8 -mr-8" />
          </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { label: "Total Revenue", val: "$24,500", trend: "+12% vs last month", icon: DollarSign, color: "bg-blue-100 text-blue-600" },
            { label: "Total Bookings", val: bookings.length.toString(), trend: "Total Lifetime", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
            { label: "Active Fleet", val: `${fleet.filter(c => c.isAvailable).length} / ${fleet.length}`, trend: "85% Utilization", icon: CarIcon, color: "bg-green-100 text-green-600" },
            { label: "Pending Actions", val: bookings.filter(b => b.status === 'pending').length.toString(), trend: "Requires Attention", icon: AlertCircle, color: "bg-orange-100 text-orange-600" }
        ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-extrabold text-slate-900">{stat.val}</h3>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                        <stat.icon className="w-5 h-5"/>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-slate-400"/> {stat.trend}
                    </p>
                </div>
            </div>
        ))}
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Booking Performance</h3>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button className="px-3 py-1 text-xs font-medium bg-white shadow-sm rounded-md text-slate-800">Month</button>
                    <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700">Year</button>
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={supplierBookingStats}>
                      <defs><linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} itemStyle={{ color: '#1e293b' }} />
                      <Area type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity / Action Feed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
            <h3 className="font-bold text-slate-800 text-lg mb-6">Recent Activity</h3>
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 max-h-[400px] custom-scrollbar">
                {bookings.slice(0, 6).map(booking => (
                    <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveSection('bookings')}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm ${booking.status === 'confirmed' ? 'bg-green-100 text-green-600' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                            {booking.status === 'confirmed' ? <CheckCircle className="w-5 h-5"/> : booking.status === 'pending' ? <Clock className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{booking.customerName}</p>
                            <p className="text-xs text-slate-500 truncate">{booking.carName} &bull; <span className="font-mono">{booking.id}</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">${booking.totalPrice}</p>
                            <p className="text-[10px] text-slate-400">{new Date(booking.bookingDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                        </div>
                    </div>
                ))}
                {bookings.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No recent bookings.</p>}
            </div>
            <button onClick={() => setActiveSection('bookings')} className="mt-4 w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 hover:border-blue-200 uppercase tracking-wide">
                View All Transactions
            </button>
        </div>
      </div>
    </div>
  );

  const FleetContent = () => {
    return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-xl font-bold text-slate-800">Fleet Management</h2><p className="text-sm text-slate-500 mt-1">Manage your vehicle inventory and availability.</p></div>
            <button onClick={handleAddVehicle} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-sm transition-transform active:scale-95"><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Vehicle</span></button>
        </div>
        
        <div className="overflow-x-auto mt-4 hidden md:block rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-50"><tr className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4 border-b border-slate-200">Vehicle</th>
                  <th className="py-3 px-4 border-b border-slate-200">SIPP</th>
                  <th className="py-3 px-4 border-b border-slate-200">Status</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {fleet.map(car => (
                <tr key={car.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                        <img src={car.image} alt="" className="w-12 h-8 object-cover rounded bg-slate-100 border border-slate-200" />
                        <div><span className="block font-bold text-slate-900 text-xs">{car.make} {car.model}</span><span className="text-[10px] text-slate-500 uppercase">{car.type}</span></div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 font-medium">{car.sippCode}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${car.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{car.isAvailable ? 'Available' : 'Unavailable'}</span></td>
                    <td className="py-3 px-4 text-right"><div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingCar(car)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition-colors" title="Edit Car"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCar(car.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                </tr>
              ))}
              </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="mt-4 space-y-4 md:hidden">
            {fleet.map(car => (
              <div key={car.id} className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                          <img src={car.image} alt="" className="w-16 h-10 object-cover rounded bg-slate-50 border border-slate-100" />
                          <div>
                              <span className="block font-bold text-slate-900 text-sm">{car.make} {car.model}</span>
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">{car.sippCode}</span>
                          </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 flex-shrink-0">
                          <button onClick={() => setEditingCar(car)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Edit Car"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteCar(car.id)} className="p-2 hover:bg-red-50 rounded-full text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-500">Current Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${car.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{car.isAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
              </div>
            ))}
        </div>
    </div>
    )
  };

  const BookingsContent = () => {
     const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
     
     // Filters
     const [searchTerm, setSearchTerm] = React.useState(''); // IDs or Names
     const [filterCategory, setFilterCategory] = React.useState('all');
     const [filterSipp, setFilterSipp] = React.useState('');
     
     const [startDate, setStartDate] = React.useState('');
     const [endDate, setEndDate] = React.useState('');

     // Extract unique values for filters
     const uniqueCategories = Array.from(new Set(MOCK_CARS.map(c => c.category)));
     const uniqueSipps = Array.from(new Set(MOCK_CARS.map(c => c.sippCode))).sort();

     const filteredBookings = bookings.filter(b => {
         const car = MOCK_CARS.find(c => c.id === b.carId);
         if (!car) return false;

         const term = searchTerm.toLowerCase();
         // Text Search: ID, Name
         const matchesSearch = b.customerName.toLowerCase().includes(term) || 
                               b.id.toLowerCase().includes(term);
         
         if (!matchesSearch) return false;

         // Category Filter
         if (filterCategory !== 'all' && car.category !== filterCategory) return false;

         // SIPP Filter
         if (filterSipp && !car.sippCode.includes(filterSipp)) return false;

         // Date Range Filter
         if (startDate && endDate) {
             // Checking if booking overlaps or starts within range. Let's use Pickup Date check.
             if (b.startDate < startDate || b.startDate > endDate) return false;
         }
         return true;
     });
     
     const getStatusBadge = (status: Booking['status']) => {
        const baseClasses = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm border inline-flex items-center gap-1.5";
        switch(status) {
            case 'confirmed': return <span className={`${baseClasses} bg-green-50 text-green-700 border-green-100`}>{status}</span>;
            case 'pending': return <span className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-100`}>{status}</span>;
            case 'cancelled': return <span className={`${baseClasses} bg-red-50 text-red-700 border-red-100`}>{status}</span>;
            case 'modified': return <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-100`}><History className="w-3 h-3"/> {status}</span>;
            default: return <span className={`${baseClasses} bg-slate-50 text-slate-700 border-slate-100`}>{status}</span>;
        }
    }

     return (
     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        {selectedBooking && <BookingVoucherModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Reservation Management</h2>
            
            {/* Professional Filter Bar */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                
                {/* Text Search */}
                <div className="md:col-span-4 lg:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Booking ID or Name" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-2 text-base border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                    </div>
                </div>

                {/* Filters Row */}
                <div className="md:col-span-8 lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Category Filter */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full text-base border border-slate-300 rounded-md py-2 px-2 bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    {/* SIPP Filter */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Car SIPP</label>
                        <select 
                            value={filterSipp} 
                            onChange={(e) => setFilterSipp(e.target.value)}
                            className="w-full text-base border border-slate-300 rounded-md py-2 px-2 bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Codes</option>
                            {uniqueSipps.map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Pick-up From</label>
                        <input type="date" className="w-full text-base border border-slate-300 rounded-md py-2 px-2 focus:ring-2 focus:ring-blue-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Pick-up To</label>
                        <input type="date" className="w-full text-base border border-slate-300 rounded-md py-2 px-2 focus:ring-2 focus:ring-blue-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto hidden md:block rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50">
                  <tr className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4 border-b border-slate-200">Ref #</th>
                    <th className="py-3 px-4 border-b border-slate-200">Customer</th>
                    <th className="py-3 px-4 border-b border-slate-200">Vehicle Info</th>
                    <th className="py-3 px-4 border-b border-slate-200">Schedule</th>
                    <th className="py-3 px-4 border-b border-slate-200 text-right">Collect @ Desk</th>
                    <th className="py-3 px-4 border-b border-slate-200 text-center">Status</th>
                    <th className="py-3 px-4 border-b border-slate-200 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {filteredBookings.length === 0 && (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-400 italic bg-slate-50/30">No bookings match your filters.</td></tr>
                  )}
                  {filteredBookings.map(booking => {
                      const car = MOCK_CARS.find(c => c.id === booking.carId);
                      return (
                      <tr key={booking.id} className="hover:bg-blue-50/50 cursor-pointer group transition-colors" onClick={() => setSelectedBooking(booking)}>
                          <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-700 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">#{booking.id}</span>
                          </td>
                          <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-xs">{booking.customerName}</div>
                              {booking.flightNumber ? 
                                <div className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5"><Plane className="w-3 h-3"/> {booking.flightNumber}</div> : 
                                <div className="text-[10px] text-slate-400 mt-0.5">No flight info</div>
                              }
                          </td>
                          <td className="py-3 px-4">
                              <div className="text-slate-800 font-medium text-xs">{booking.carName}</div>
                              <div className="flex gap-1 mt-1">
                                  <span className="text-[9px] bg-slate-100 border border-slate-200 px-1 rounded text-slate-500">{car?.sippCode}</span>
                                  <span className="text-[9px] bg-slate-100 border border-slate-200 px-1 rounded text-slate-500">{car?.category}</span>
                              </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[10px]">
                              <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-green-500"/> {booking.startDate} <span className="text-slate-400">@</span> {booking.startTime}</span>
                                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-red-500"/> {booking.endDate} <span className="text-slate-400">@</span> {booking.endTime}</span>
                              </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-right text-xs">${booking.amountToPayAtDesk.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(booking.status)}</td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              {booking.status === 'pending' ? (
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => handleBookingAction(booking.id, 'confirm')} className="bg-white border border-green-200 text-green-600 hover:bg-green-50 p-1.5 rounded shadow-sm transition-colors" title="Confirm"><CheckCircle className="w-4 h-4"/></button>
                                      <button onClick={() => handleBookingAction(booking.id, 'reject')} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 p-1.5 rounded shadow-sm transition-colors" title="Reject"><XCircle className="w-4 h-4"/></button>
                                  </div>
                              ) : (
                                  <button onClick={() => setSelectedBooking(booking)} className="text-blue-600 hover:text-blue-800 text-[10px] font-bold uppercase tracking-wide hover:underline flex items-center justify-end gap-1 w-full">
                                      View <ArrowRight className="w-3 h-3"/>
                                  </button>
                              )}
                          </td>
                      </tr>
                  )}}
              </tbody>
          </table>
        </div>
        
        {/* Mobile View */}
        <div className="space-y-4 md:hidden">
            {filteredBookings.map(booking => (
                <div key={booking.id} onClick={() => setSelectedBooking(booking)} className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 active:bg-slate-50 transition-colors relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'pending' ? 'bg-yellow-500' : 'bg-slate-300'}`}></div>
                    <div className="flex justify-between items-start pl-2">
                        <div>
                            <p className="font-mono text-[10px] font-bold text-slate-500 mb-1">#{booking.id}</p>
                            <p className="font-bold text-slate-900 text-sm">{booking.carName}</p>
                            <p className="text-xs text-slate-600">{booking.customerName}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs pl-2">
                        <div>
                            <p className="text-[10px] text-slate-500 font-medium">Pick-up</p>
                            <p className="text-slate-700 font-semibold">{booking.startDate}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] text-slate-500 font-medium">Collect</p>
                             <p className="text-slate-800 font-bold">${booking.amountToPayAtDesk.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
  };
  
  const ExtrasManagerContent = () => {
    const [isExtraModalOpen, setIsExtraModalOpen] = React.useState(false);
    const [editingExtra, setEditingExtra] = React.useState<Extra | null>(null);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-100">
            <EditExtraModal extra={editingExtra} isOpen={isExtraModalOpen || !!editingExtra} onClose={() => { setIsExtraModalOpen(false); setEditingExtra(null); }} onSave={(extra) => { if(editingExtra) handleSaveExtra(extra); else handleCreateGlobalExtra(extra); setIsExtraModalOpen(false); setEditingExtra(null); }} />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ListPlus className="w-5 h-5 text-blue-600"/> Extras & Add-ons</h2>
                    <p className="text-xs text-slate-500">Manage optional services and equipment.</p>
                </div>
                <button onClick={() => setIsExtraModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><Plus className="w-3.5 h-3.5"/> Create Extra</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allExtras.map(extra => (
                    <div key={extra.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800 text-sm">{extra.name}</h4>
                            <button onClick={() => setEditingExtra(extra)} className="text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                            <span className="font-bold text-slate-900">${extra.price}</span>
                            <span className="text-slate-400">/ {extra.type === 'per_day' ? 'Day' : 'Rental'}</span>
                        </div>
                        {extra.promotionLabel ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><Gift className="w-3 h-3"/> {extra.promotionLabel}</span>
                        ) : (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">Standard Rate</span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100">ID: {extra.id}</p>
                    </div>
                ))}
            </div>
        </div>
    );
  };
  
  const SettingsContent = () => {
    const [settings, setSettings] = React.useState(supplierData);
    const [isSaved, setIsSaved] = React.useState(false);

    const handleChange = (field: keyof Supplier, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSupplierData(settings); // Update parent state
        // In real app, this would be an API call
        const supplierIndex = SUPPLIERS.findIndex(s => s.id === settings.id);
        if (supplierIndex > -1) {
            SUPPLIERS[supplierIndex] = settings;
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Company Settings</h2>
            <p className="text-xs text-slate-500 mb-6">Manage your public profile and operational policies.</p>

            <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
                {/* 1. Profile Information */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Company Name" value={settings.name} onChange={e => handleChange('name', e.target.value)} />
                        <div>
                            <InputField label="Contact Email" type="email" value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} />
                            <p className="text-[10px] text-blue-600 mt-1.5 flex items-center gap-1.5 font-medium bg-blue-50 p-1.5 rounded border border-blue-100"><Info className="w-3 h-3 flex-shrink-0"/> Receives all reservation requests.</p>
                        </div>
                        <InputField label="Primary Location" value={settings.location} onChange={e => handleChange('location', e.target.value)} />
                        {/* Add Logo URL field just for demonstration/consistency, though often handled via upload */}
                        <InputField label="Logo URL" value={settings.logo} onChange={e => handleChange('logo', e.target.value)} />
                    </div>
                </div>

                {/* 2. Standard Inclusions */}
                 <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">Standard Inclusions</h3>
                    <p className="text-xs text-slate-500 mb-3">Select which protections are included in your base rental price.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={settings.includesCDW || false} onChange={e => handleChange('includesCDW', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-3 text-xs font-semibold text-slate-700">Collision Damage Waiver (CDW)</span>
                        </label>
                         <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={settings.includesTP || false} onChange={e => handleChange('includesTP', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-3 text-xs font-semibold text-slate-700">Theft Protection (TP)</span>
                        </label>
                    </div>
                </div>

                {/* 3. Operational Settings (Grace Period, Lead Time) */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">Operational Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-600"/> Minimum Advance Notice (Lead Time)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={settings.minBookingLeadTime || 0} 
                                    onChange={e => handleChange('minBookingLeadTime', parseInt(e.target.value) || 0)} 
                                    className="block w-24 border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2 px-3" 
                                />
                                <span className="text-xs text-slate-500">hours</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                How many hours in advance must a booking be made? Set to <strong>0</strong> for instant/same-day availability.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><History className="w-3.5 h-3.5 text-orange-600"/> Return Grace Period</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={settings.gracePeriodHours} 
                                    onChange={e => handleChange('gracePeriodHours', parseInt(e.target.value) || 0)} 
                                    className="block w-24 border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2 px-3" 
                                />
                                <span className="text-xs text-slate-500">hours</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                Time after the scheduled return time before late fees are charged.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-green-600"/> One-Way Drop-off Fee</label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    value={settings.oneWayFee || 0} 
                                    onChange={e => handleChange('oneWayFee', parseFloat(e.target.value) || 0)} 
                                    className="block w-24 border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2 px-3" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                A flat fee charged if the drop-off location is different. Set to <strong>0</strong> for no fee.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Legal & Terms */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">Terms & Conditions</h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Rental Policy Text</label>
                        <textarea 
                            rows={6} 
                            value={settings.termsAndConditions || ''} 
                            onChange={e => handleChange('termsAndConditions', e.target.value)}
                            placeholder="Enter your specific rental terms, age requirements, deposit info, etc."
                            className="block w-full border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs py-2 px-3 leading-relaxed"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">This text will be displayed to customers during booking.</p>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-transform active:scale-95"><Save className="w-4 h-4"/> Save All Settings</button>
                    {isSaved && <span className="text-green-600 text-xs font-bold flex items-center gap-1.5 animate-fadeIn"><CheckCircle className="w-4 h-4"/> Changes Saved Successfully!</span>}
                </div>
            </form>
        </div>
    );
  };
  
  const PricingManagerContent = () => {
    const categories = Object.values(CarCategory);
    const [viewMode, setViewMode] = React.useState<'category' | 'vehicle'>('category');
    const currentYear = new Date().getFullYear();
    const availableYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];
    const [priceManagementMode, setPriceManagementMode] = React.useState<'manual' | 'excel'>('manual');

    if (!selectedYear) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[600px] animate-fadeIn">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-6 h-6 text-blue-600"/> Select a Year to Manage</h2>
                    <p className="text-sm text-slate-500 mt-1">Choose a year to configure your seasonal rates and pricing periods.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {availableYears.map(year => (
                        <button 
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className="text-center p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
                            <p className="text-4xl font-extrabold text-slate-700">{year}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[600px]">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <button onClick={() => setSelectedYear(null)} className="text-xs text-slate-500 hover:text-blue-600 font-semibold mb-2 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Back to Year Selection
                </button>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600"/> Price Management for {selectedYear}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Configure rate tiers for the selected year.</p>
            </div>
         </div>
        
         <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-fit mb-6">
             <button 
                onClick={() => setPriceManagementMode('manual')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${priceManagementMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Manual Management
             </button>
             <button 
                onClick={() => setPriceManagementMode('excel')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${priceManagementMode === 'excel' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Upload Excel Sheet
             </button>
         </div>

         {priceManagementMode === 'manual' ? (
             <div className="animate-fadeIn">
                 <div className="bg-slate-100 p-1 rounded-lg flex items-center w-fit mb-6">
                     <button 
                        onClick={() => setViewMode('category')}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${viewMode === 'category' ? 'bg-white text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        <Layers className="w-4 h-4"/> By Category
                     </button>
                     <button 
                        onClick={() => setViewMode('vehicle')}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${viewMode === 'vehicle' ? 'bg-white text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        <CarIcon className="w-4 h-4"/> By Vehicle
                     </button>
                 </div>

                 {viewMode === 'category' ? (
                     <div className="space-y-6 animate-fadeIn">
                         <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 text-xs">
                             <Layers className="w-4 h-4"/> 
                             <span><strong>Global Rates:</strong> Pricing set here applies to all vehicles in the category unless overridden specifically for a single vehicle.</span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                             {categories.map(cat => {
                                 const sampleCar = fleet.find(c => c.category === cat);
                                 if (!sampleCar) return null; // Only show categories present in fleet
                                 
                                 const tiersForYear = sampleCar.rateTiers.filter(tier => new Date(tier.startDate).getFullYear() === selectedYear);

                                 return (
                                     <div key={cat} className="border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                                         <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
                                             <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><TagIcon className="w-4 h-4 text-slate-400"/> {cat}</h4>
                                             <button onClick={() => { setRateModalTarget({ type: 'category', id: cat }); setIsPeriodModalOpen(true); }} className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
                                                 <Plus className="w-3 h-3"/> Add Period
                                             </button>
                                         </div>
                                         
                                         <div className="p-4">
                                             {tiersForYear.length === 0 ? (
                                                 <div className="text-center py-6">
                                                     <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2"><Calendar className="w-5 h-5 text-slate-300"/></div>
                                                     <p className="text-xs text-slate-400 italic">No rate tiers defined for {selectedYear}.</p>
                                                 </div>
                                             ) : (
                                                 <div className="space-y-3">
                                                     {tiersForYear.map(tier => {
                                                         const status = getRateStatus(tier.endDate);
                                                         return (
                                                             <div key={tier.id} className="group relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                                                                 <div className="flex justify-between items-start mb-2">
                                                                     <div>
                                                                         <span className="font-bold text-xs text-slate-800 block">{tier.name}</span>
                                                                         <span className="text-[10px] text-slate-500">{tier.startDate} &rarr; {tier.endDate}</span>
                                                                     </div>
                                                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                         <button onClick={() => { setRateModalTarget({ type: 'category', id: cat }); setEditingRatesTier(tier); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded bg-white border border-slate-100 shadow-sm" title="Edit Rates"><Edit2 className="w-3 h-3"/></button>
                                                                         <button onClick={() => handleDeleteRateTier(tier.id, { type: 'category', id: cat })} className="p-1.5 hover:bg-red-50 text-red-600 rounded bg-white border border-slate-100 shadow-sm" title="Delete"><Trash2 className="w-3 h-3"/></button>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex justify-between items-end">
                                                                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${status.color}`}><status.icon className="w-2.5 h-2.5"/> {status.label}</span>
                                                                     {tier.rates && tier.rates.length > 0 && <span className="text-xs font-bold text-slate-900">${tier.rates[0].dailyRate}<span className="text-[10px] font-normal text-slate-400">/day</span></span>}
                                                                 </div>
                                                                 {tier.promotionLabel && <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-green-600 font-bold flex items-center gap-1"><Gift className="w-3 h-3"/> {tier.promotionLabel}</div>}
                                                             </div>
                                                         )
                                                     })}
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                     </div>
                 ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4 bg-purple-50 border border-purple-100 p-3 rounded-lg text-purple-800 text-xs">
                            <CarIcon className="w-4 h-4"/> 
                            <span><strong>Vehicle Overrides:</strong> Rates set here will override the category defaults for the specific vehicle.</span>
                        </div>

                        <div className="space-y-2">
                            {fleet.map((car) => {
                                const tiersForYear = car.rateTiers.filter(tier => new Date(tier.startDate).getFullYear() === selectedYear);
                                return (
                                <div key={car.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <button onClick={() => setExpandedCarId(expandedCarId === car.id ? null : car.id)} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <img src={car.image} alt="" className="w-16 h-12 object-cover rounded bg-slate-100 border border-slate-200" />
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{car.make} {car.model}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200">{car.sippCode}</span>
                                                    <span className="text-[10px] text-slate-500">{car.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                             <div className="text-right hidden sm:block">
                                                 <p className="text-xs text-slate-500 mb-0.5">Rate Periods ({selectedYear})</p>
                                                 <p className="text-sm font-bold text-slate-800">{tiersForYear.length}</p>
                                             </div>
                                             <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCarId === car.id ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {expandedCarId === car.id && (
                                        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <h5 className="text-xs font-bold text-slate-600">Specific Rates for this Vehicle ({selectedYear})</h5>
                                                <button onClick={() => { setRateModalTarget({ type: 'vehicle', id: car.id }); setIsPeriodModalOpen(true); }} className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
                                                    <Plus className="w-3 h-3"/> Add Period
                                                </button>
                                            </div>
                                            
                                            {tiersForYear.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2"><Calendar className="w-5 h-5 text-slate-400"/></div>
                                                    <p className="text-xs text-slate-400 italic">No specific rate tiers defined for this vehicle in {selectedYear}.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                    {tiersForYear.map(tier => {
                                                         const status = getRateStatus(tier.endDate);
                                                         return (
                                                             <div key={tier.id} className="group relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                                                                 <div className="flex justify-between items-start mb-2">
                                                                     <div>
                                                                         <span className="font-bold text-xs text-slate-800 block">{tier.name}</span>
                                                                         <span className="text-[10px] text-slate-500">{tier.startDate} &rarr; {tier.endDate}</span>
                                                                     </div>
                                                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                         <button onClick={() => { setRateModalTarget({ type: 'vehicle', id: car.id }); setEditingRatesTier(tier); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded bg-white border border-slate-100 shadow-sm" title="Edit Rates"><Edit2 className="w-3 h-3"/></button>
                                                                         <button onClick={() => handleDeleteRateTier(tier.id, { type: 'vehicle', id: car.id })} className="p-1.5 hover:bg-red-50 text-red-600 rounded bg-white border border-slate-100 shadow-sm" title="Delete"><Trash2 className="w-3 h-3"/></button>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex justify-between items-end">
                                                                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${status.color}`}><status.icon className="w-2.5 h-2.5"/> {status.label}</span>
                                                                     {tier.rates && tier.rates.length > 0 && <span className="text-xs font-bold text-slate-900">${tier.rates[0].dailyRate}<span className="text-[10px] font-normal text-slate-400">/day</span></span>}
                                                                 </div>
                                                                 {tier.promotionLabel && <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-green-600 font-bold flex items-center gap-1"><Gift className="w-3 h-3"/> {tier.promotionLabel}</div>}
                                                             </div>
                                                         )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                 )}
             </div>
         ) : (
            <ExcelUploadView year={selectedYear} />
         )}
      </div>
    );
  };

  const StopSalesContent = () => {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-100">
            <AddStopSaleModal fleet={fleet} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleStopSaleAdd} />
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Ban className="w-5 h-5 text-red-600"/> Stop Sales</h2>
                    <p className="text-xs text-slate-500">Block availability for specific dates.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><Plus className="w-3.5 h-3.5"/> Block Dates</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fleet.filter(c => c.stopSales.length > 0).map(car => (
                    <div key={car.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200">
                            <img src={car.image} alt="" className="w-12 h-8 object-cover rounded" />
                            <div>
                                <h4 className="font-bold text-slate-800 text-xs">{car.make} {car.model}</h4>
                                <span className="font-mono text-[10px] bg-white px-1 border rounded text-slate-500">{car.sippCode}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {car.stopSales.map(date => (
                                <div key={date} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm text-xs">
                                    <span className="font-medium text-slate-700 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-red-400"/> {date}</span>
                                    <button onClick={() => handleStopSaleRemove(car.id, date)} className="text-slate-400 hover:text-red-600"><X className="w-3.5 h-3.5"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {fleet.every(c => c.stopSales.length === 0) && <p className="col-span-3 text-center text-slate-400 text-sm py-8 italic">No active stop sales.</p>}
            </div>
        </div>
    );
  };
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent />;
      case 'fleet': return <FleetContent />;
      case 'bookings': return <BookingsContent />;
      case 'pricing': return <PricingManagerContent />;
      case 'settings': return <SettingsContent />;
      case 'stopsales': return <StopSalesContent />;
      case 'extras': return <ExtrasManagerContent />;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <EditCarModal car={editingCar} allExtras={allExtras} isOpen={!!editingCar} onClose={() => setEditingCar(null)} onSave={handleSaveCar} />
      <CreatePeriodModal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} onSave={handleCreatePeriod} year={selectedYear} />
      {editingRatesTier && <ManageRatesModal tier={editingRatesTier} isOpen={!!editingRatesTier} onClose={() => setEditingRatesTier(null)} onSave={handleUpdateRates} />}
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <img src={supplierData.logo} alt="Supplier Logo" className="w-8 h-8 rounded-full" />
             <span className="font-bold text-slate-800 text-sm">{supplierData.name}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
             {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
          </button>
       </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
        
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none md:bg-transparent md:w-60 lg:w-64 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 h-full flex flex-col">
            <div className="hidden md:flex items-center gap-3 mb-8">
              <img src={supplierData.logo} alt="Supplier Logo" className="w-10 h-10 rounded-full" />
              <div>
                <h1 className="font-bold text-slate-800">{supplierData.name}</h1>
                <p className="text-xs text-slate-500">Supplier Portal</p>
              </div>
            </div>
            <nav className="space-y-1 flex-grow">
              <NavItem section="dashboard" label="Dashboard" icon={LayoutDashboard} />
              <NavItem section="bookings" label="Bookings" icon={BookOpen} />
              <NavItem section="fleet" label="Fleet" icon={CarIcon} />
              <NavItem section="pricing" label="Pricing" icon={DollarSign} />
              <NavItem section="stopsales" label="Stop Sales" icon={CalendarDays} />
              <NavItem section="extras" label="Extras" icon={PlusCircle} />
              <NavItem section="settings" label="Settings" icon={Settings} />
            </nav>
            <button onClick={() => navigate('/supplier-login')} className="flex items-center w-full px-4 py-2 mt-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-grow w-full md:pl-6 lg:pl-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
// FIX: Add a default export to the component.
export default SupplierDashboard;
