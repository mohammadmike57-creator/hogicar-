


import * as React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MOCK_CARS, MOCK_BOOKINGS, SUPPLIERS, calculatePrice, ADMIN_STATS } from '../services/mockData';
import { Car as CarIcon, Calendar, DollarSign, Plus, Settings, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, Save, LayoutDashboard, BookOpen, ChevronDown, ChevronUp, MapPin, Mail, Phone, Users, Briefcase, Zap, Fuel, Snowflake, ListPlus, Rss, Key, Link2, Copy, Menu, X, CalendarDays, PlusCircle, LogOut, Clock, MessageSquare, TrendingUp, History, ArrowRight, MoreHorizontal, Ban, Filter, Gift, Tag as TagIcon, FileText, Printer, Plane, Search, Layers, SlidersHorizontal, Hash, Info, Shield, ArrowLeft, UploadCloud, Download, Send, RefreshCw } from 'lucide-react';
import { Booking, Car, RateTier, CarType, CarCategory, Transmission, FuelPolicy, Extra, RateByDay, Supplier, RateImportSummary } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupplierToken, clearSupplierToken } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';
import { parseFilenameFromContentDisposition } from '../lib/httpFilename';
import { supplierApi } from '../api';

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

  const handleLogout = () => {
      clearSupplierToken();
      navigate('/supplier-login');
  };


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
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id.toString() === id);
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

  // FIX: Resolve syntax error and complete object creation to satisfy the 'Car' type.
  const handleAddVehicle = () => {
    const newCar: Car = {
        id: `c${Date.now()}`,
        make: '', model: '', year: new Date().getFullYear(),
        category: CarCategory.ECONOMY,
        type: CarType.SEDAN,
        sippCode: 'ECAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 4,
        bags: 2,
        doors: 4,
        airCon: true,
        image: 'https://placehold.co/600x400/e2e8f0/64748b?text=Car+Image',
        supplier: supplierData,
        features: [],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: supplierData.location,
        deposit: 200,
        excess: 1000,
        stopSales: [],
        rateTiers: [{ id: 'rt-new', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{minDays: 1, maxDays: 30, dailyRate: 50}]}],
        extras: [],
        locationDetail: "In Terminal",
        unlimitedMileage: true,
    };
    setEditingCar(newCar);
};

  const NavItem = ({ section, label, icon: Icon, count }: { section: typeof activeSection, label: string, icon: React.ElementType, count?: number }) => (
    <button onClick={() => { setActiveSection(section); setIsSidebarOpen(false); }} className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === section ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
          <span className="bg-orange-400 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{count}</span>
      )}
    </button>
  );

  const sidebarContent = (
    <div className="p-4 h-full flex flex-col">
       <div className="flex items-center gap-3 mb-8 px-2">
            <img src={supplierData.logo} alt={supplierData.name} className="w-12 h-12 object-contain rounded-full bg-white p-1 border"/>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">{supplierData.name}</h1>
              <p className="text-xs text-slate-500">Supplier Portal</p>
            </div>
          </div>
      <nav className="space-y-1.5 flex-grow">
        <NavItem section="dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavItem section="bookings" label="Bookings" icon={BookOpen} count={bookings.filter(b => b.status === 'pending').length} />
        <NavItem section="fleet" label="Fleet" icon={CarIcon} />
        <NavItem section="pricing" label="Pricing" icon={DollarSign} />
        <NavItem section="stopsales" label="Stop Sales" icon={CalendarDays} />
        <NavItem section="extras" label="Extras" icon={PlusCircle} />
        <NavItem section="settings" label="Settings" icon={Settings} />
      </nav>
      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 mt-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
        <LogOut className="w-5 h-5 mr-3" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      {editingCar && <EditCarModal isOpen={!!editingCar} onClose={() => setEditingCar(null)} car={editingCar} allExtras={allExtras} onSave={(updatedCar) => {
            const index = MOCK_CARS.findIndex(c => c.id === updatedCar.id);
            if(index > -1) {
                MOCK_CARS[index] = updatedCar;
            } else {
                MOCK_CARS.unshift(updatedCar);
            }
            refreshLocalState();
            setEditingCar(null);
      }} />}

      {isPeriodModalOpen && <CreatePeriodModal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} year={selectedYear} onSave={(name, start, end, promotionLabel) => {
        if (!rateModalTarget) return;

        const newTier: RateTier = {
            id: `rt-${Date.now()}`,
            name, startDate: start, endDate: end,
            rates: [], // Start with no rate bands
            promotionLabel
        };
        
        if (rateModalTarget.type === 'vehicle') {
            const carIndex = MOCK_CARS.findIndex(c => c.id === rateModalTarget.id);
            if (carIndex > -1) {
                MOCK_CARS[carIndex].rateTiers.push(newTier);
            }
        }
        
        refreshLocalState();
      }} />}

      {editingRatesTier && rateModalTarget && <ManageRatesModal isOpen={!!editingRatesTier} tier={editingRatesTier} onClose={() => setEditingRatesTier(null)} onSave={(newRates) => {
          if (rateModalTarget.type === 'vehicle') {
              const carIndex = MOCK_CARS.findIndex(c => c.id === rateModalTarget.id);
              if (carIndex > -1) {
                  const tierIndex = MOCK_CARS[carIndex].rateTiers.findIndex(t => t.id === editingRatesTier.id);
                  if (tierIndex > -1) {
                      MOCK_CARS[carIndex].rateTiers[tierIndex].rates = newRates;
                  }
              }
          }
          refreshLocalState();
          setEditingRatesTier(null);
      }} />}

      
      {/* Mobile Header */}
      <div className="md:hidden bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
             <img src={supplierData.logo} alt={supplierData.name} className="w-8 h-8 object-contain rounded-full bg-white p-1 border"/>
             <span className="font-bold text-slate-800">{supplierData.name}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
             {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
          </button>
       </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
        
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none md:bg-transparent md:w-60 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </aside>

        <main className="flex-grow w-full md:pl-6">
          {/* Main Content Rendered Here */}
        </main>
      </div>
    </div>
  );
};
// FIX: Add missing default export to resolve module import errors.
export default SupplierDashboard;