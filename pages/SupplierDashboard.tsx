
import * as React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MOCK_CARS, MOCK_BOOKINGS, SUPPLIERS, calculatePrice, ADMIN_STATS } from '../services/mockData';
// FIX: Import `LoaderCircle` icon from `lucide-react`.
import { Car as CarIcon, Calendar, DollarSign, Plus, Settings, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, Save, LayoutDashboard, BookOpen, ChevronDown, ChevronUp, MapPin, Mail, Phone, Users, Briefcase, Zap, Fuel, Snowflake, ListPlus, Rss, Key, Link2, Copy, Menu, X, CalendarDays, PlusCircle, LogOut, Clock, MessageSquare, TrendingUp, History, ArrowRight, MoreHorizontal, Ban, Filter, Gift, Tag as TagIcon, FileText, Printer, Plane, Search, Layers, SlidersHorizontal, Hash, Info, Shield, ArrowLeft, UploadCloud, Download, Send, RefreshCw, LoaderCircle, FileSpreadsheet, Settings2, Eye } from 'lucide-react';
import { Booking, Car, RateTier, CarType, CarCategory, Transmission, FuelPolicy, Extra, RateByDay, Supplier, RateImportSummary, TemplateConfig, CarRateTier, BandConfig, PeriodConfig, Location } from '../types';
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

const AddLocationModal = ({ isOpen, onClose, onSave, existingLocations, existingFleet }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, existingLocations: Location[], existingFleet: Car[] }) => {
    const [step, setStep] = React.useState(1);
    const [locationData, setLocationData] = React.useState({ name: '', address: '' });
    const [fleetStrategy, setFleetStrategy] = React.useState<'empty' | 'copy'>('empty');
    const [sourceLocationId, setSourceLocationId] = React.useState(existingLocations[0]?.id || '');
    const [rateStrategy, setRateStrategy] = React.useState<'new' | 'copy'>('new');

    if (!isOpen) return null;

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = () => {
        onSave({
            location: locationData,
            fleetStrategy,
            sourceLocationId,
            rateStrategy
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Add New Location</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto">
                    {/* Progress Bar */}
                    <div className="flex items-center mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 h-2 rounded-full mx-1 ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700">Location Details</h4>
                            <InputField label="Location Name" placeholder="e.g. Downtown Office" value={locationData.name} onChange={e => setLocationData({...locationData, name: e.target.value})} />
                            <InputField label="Address" placeholder="Full address" value={locationData.address} onChange={e => setLocationData({...locationData, address: e.target.value})} />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h4 className="font-bold text-slate-700">Fleet Setup</h4>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input type="radio" name="fleet" checked={fleetStrategy === 'empty'} onChange={() => setFleetStrategy('empty')} className="mt-1" />
                                    <div>
                                        <span className="block font-medium text-slate-800">Start with Empty Fleet</span>
                                        <span className="text-xs text-slate-500">I will add vehicles manually later.</span>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input type="radio" name="fleet" checked={fleetStrategy === 'copy'} onChange={() => setFleetStrategy('copy')} className="mt-1" />
                                    <div>
                                        <span className="block font-medium text-slate-800">Copy Fleet from Existing Location</span>
                                        <span className="text-xs text-slate-500">Duplicate vehicle definitions to the new location.</span>
                                    </div>
                                </label>
                            </div>

                            {fleetStrategy === 'copy' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Source Location</label>
                                    <select value={sourceLocationId} onChange={e => setSourceLocationId(e.target.value)} className="w-full border p-2 rounded">
                                        {existingLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h4 className="font-bold text-slate-700">Rates & Pricing</h4>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input type="radio" name="rates" checked={rateStrategy === 'new'} onChange={() => setRateStrategy('new')} className="mt-1" />
                                    <div>
                                        <span className="block font-medium text-slate-800">Set New Rates</span>
                                        <span className="text-xs text-slate-500">Create fresh pricing tiers for this location.</span>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input type="radio" name="rates" checked={rateStrategy === 'copy'} onChange={() => setRateStrategy('copy')} className="mt-1" />
                                    <div>
                                        <span className="block font-medium text-slate-800">Copy Rates from Source</span>
                                        <span className="text-xs text-slate-500">Use the same pricing as the selected source location.</span>
                                    </div>
                                </label>
                            </div>
                            
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mt-4">
                                <p className="text-xs text-yellow-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4"/>
                                    New locations require Admin approval before going live.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-between">
                    {step > 1 ? (
                        <button onClick={handleBack} className="px-4 py-2 text-slate-600 font-medium text-sm">Back</button>
                    ) : (
                        <div></div>
                    )}
                    {step < 3 ? (
                        <button onClick={handleNext} disabled={!locationData.name} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button>
                    ) : (
                        <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4"/> Submit for Approval
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, title, value, change, color = 'text-blue-600' }: { icon: React.ElementType, title: string, value: string | number, change?: string, color?: string }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-slate-100 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            {change && <p className="text-xs text-green-600 font-semibold mt-0.5">{change} vs last month</p>}
        </div>
    </div>
);

const SupplierDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState<'dashboard' | 'fleet' | 'bookings' | 'pricing' | 'settings' | 'stopsales' | 'extras' | 'locations'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getSupplierId = () => {
    const fromState = (location.state as { supplierId: string })?.supplierId;
    if (fromState) return fromState;
    const fromStorage = sessionStorage.getItem('hogicar_supplierId');
    if (fromStorage) return fromStorage;
    // Fallback for demo purposes, might want to redirect to login if no ID is found in a real app
    return 's1'; 
  };
  
  const supplierId = getSupplierId();
  // Initialize supplierData with locations if missing (for safety with old mock data)
  const [supplierData, setSupplierData] = React.useState<any>(null);
  const [fleet, setFleet] = React.useState<any[]>([]);
  const [locations, setLocations] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]); // Keep empty for now if no booking API provided
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [editingCar, setEditingCar] = React.useState<Car | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = React.useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = React.useState(false);
  const [editingRatesTier, setEditingRatesTier] = React.useState<RateTier | null>(null);
  const [rateModalTarget, setRateModalTarget] = React.useState<{ type: 'category' | 'vehicle', id: string } | null>(null);
  const [expandedCarId, setExpandedCarId] = React.useState<string | null>(null);
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);

  const handleLogout = () => {
      clearSupplierToken();
      sessionStorage.removeItem('hogicar_supplierId');
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

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [me, cars, locs] = await Promise.all([
          supplierApi.getMe(),
          supplierApi.getCars(),
          supplierApi.getLocations()
        ]);
        setSupplierData(me);
        setFleet(cars);
        setLocations(locs);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        clearSupplierToken();
        sessionStorage.removeItem('hogicar_supplierId');
        navigate('/supplier-login?reason=session_expired');
      } finally {
        setIsLoading(false);
      }
    };

    if (getSupplierToken()) {
      fetchData();
    } else {
      navigate('/supplier-login');
    }
  }, [navigate]);

  const refreshLocalState = async () => {
      try {
          const cars = await supplierApi.getCars();
          setFleet(cars);
      } catch (error) {
          console.error("Failed to refresh cars:", error);
      }
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

  const handleAddVehicle = () => {
    if(!supplierData) return;
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
    <button onClick={() => { setActiveSection(section); setIsSidebarOpen(false); }} className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeSection === section ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-blue-600'}`}>
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${activeSection === section ? 'text-white' : 'text-slate-400'}`} />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
          <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">{count}</span>
      )}
    </button>
  );

  const sidebarContent = (
    <div className="p-6 h-full flex flex-col bg-slate-50/50 border-r border-slate-200/60">
       <div className="flex items-center gap-4 mb-10 px-2">
            {supplierData && <img src={supplierData.logo} alt={supplierData.name} className="w-14 h-14 object-contain rounded-2xl bg-white p-2 shadow-sm border border-slate-100"/>}
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">{supplierData?.name}</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Supplier Portal</p>
            </div>
          </div>
      <nav className="space-y-2 flex-grow">
        <NavItem section="dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavItem section="bookings" label="Bookings" icon={BookOpen} count={bookings.filter(b => b.status === 'pending').length} />
        <NavItem section="locations" label="Locations" icon={MapPin} />
        <NavItem section="fleet" label="Fleet" icon={CarIcon} />
        <NavItem section="pricing" label="Price Management" icon={DollarSign} />
        <NavItem section="stopsales" label="Stop Sales" icon={CalendarDays} />
        <NavItem section="extras" label="Extras" icon={PlusCircle} />
        <NavItem section="settings" label="Settings" icon={Settings} />
      </nav>
      <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 mt-6 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
        <LogOut className="w-5 h-5 mr-3 text-slate-400" />
        <span>Logout</span>
      </button>
    </div>
  );
  
  if (!supplierData) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-slate-50">
              <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          </div>
      );
  }
  
  const DashboardContent = () => {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const fleetSize = fleet.length;

    const recentBookings = [...bookings].sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()).slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={BookOpen} title="Total Bookings" value={totalBookings} change="+5.2%" />
          <StatCard icon={DollarSign} title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+12.8%" />
          <StatCard icon={Clock} title="Pending Bookings" value={pendingBookings} color="text-orange-500" />
          <StatCard icon={CarIcon} title="Fleet Size" value={fleetSize} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600"/>Booking Trends - Last 12 Months</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={supplierBookingStats} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: '#666' }} />
                <YAxis fontSize={11} tick={{ fill: '#666' }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="bookings" stroke="#3b82f6" fill="#bfdbfe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-green-600"/>Recent Activity</h3>
            <ul className="space-y-3">
              {recentBookings.map(b => (
                <li key={b.id} className="flex items-center text-xs p-2 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                    <CarIcon className="w-4 h-4 text-slate-500"/>
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-700">New Booking: <span className="font-mono">{b.id}</span></p>
                    <p className="text-slate-500">{b.customerName} - ${b.totalPrice}</p>
                  </div>
                  <span className="text-slate-400 font-medium">{new Date(b.bookingDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  const BookingsContent = () => {
    const [filter, setFilter] = React.useState('all');
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

    const filteredBookings = bookings.filter(b => {
        if (filter === 'all') return true;
        return b.status === filter;
    });

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
            {selectedBooking && <BookingVoucherModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600"/>Manage Bookings</h3>
                <div className="flex items-center gap-2">
                    <button className={`px-3 py-1 text-xs rounded-full ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`px-3 py-1 text-xs rounded-full ${filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setFilter('pending')}>Pending</button>
                    <button className={`px-3 py-1 text-xs rounded-full ${filter === 'confirmed' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setFilter('confirmed')}>Confirmed</button>
                    <button className={`px-3 py-1 text-xs rounded-full ${filter === 'cancelled' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setFilter('cancelled')}>Cancelled</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="px-4 py-2">Ref</th>
                            <th className="px-4 py-2">Customer</th>
                            <th className="px-4 py-2">Dates</th>
                            <th className="px-4 py-2">Vehicle</th>
                            <th className="px-4 py-2">Total</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map(b => {
                            const car = fleet.find(c => c.id === b.carId);
                            return (
                                <tr key={b.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-mono font-semibold text-slate-700">{b.id}</td>
                                    <td className="px-4 py-2">{b.customerName}</td>
                                    <td className="px-4 py-2">{b.startDate} to {b.endDate}</td>
                                    <td className="px-4 py-2">{car ? `${car.make} ${car.model}` : 'N/A'}</td>
                                    <td className="px-4 py-2 font-semibold">${b.totalPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                            b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            b.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>{b.status}</span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {b.status === 'pending' && (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleBookingAction(b.id, 'confirm')} className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200"><CheckCircle className="w-4 h-4"/></button>
                                                <button onClick={() => handleBookingAction(b.id, 'reject')} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><XCircle className="w-4 h-4"/></button>
                                            </div>
                                        )}
                                        <button onClick={() => setSelectedBooking(b)} className="p-1.5 text-slate-500 hover:text-blue-600"><Eye className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const FleetContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CarIcon className="w-6 h-6 text-blue-600"/> Fleet Management</h3>
            <button onClick={handleAddVehicle} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4"/> Add Vehicle</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {fleet.map(car => (
                <div key={car.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-40 object-cover"/>
                    <div className="p-4 flex-grow flex flex-col">
                        <h4 className="font-bold text-slate-800">{car.make} {car.model}</h4>
                        <p className="text-xs text-slate-500 mb-2">{car.sippCode} &bull; {car.location}</p>
                        <div className="flex-grow"></div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditingCar(car)} className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteCar(car.id)} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

const TemplateConfigModal = ({ initialConfig, onClose, onSave, isSaving }: { initialConfig: TemplateConfig, onClose: () => void, onSave: (config: TemplateConfig) => void, isSaving: boolean }) => {
    const [config, setConfig] = React.useState<TemplateConfig>(initialConfig);

    const handleAddPeriod = () => {
        setConfig({
            ...config,
            periods: [...config.periods, { name: '', startDate: '', endDate: '', usePreviousBands: false, bands: [] }]
        });
    };

    const handleRemovePeriod = (index: number) => {
        const newPeriods = [...config.periods];
        newPeriods.splice(index, 1);
        setConfig({ ...config, periods: newPeriods });
    };

    const updatePeriod = (index: number, field: keyof PeriodConfig, value: any) => {
        const newPeriods = [...config.periods];
        newPeriods[index] = { ...newPeriods[index], [field]: value };
        setConfig({ ...config, periods: newPeriods });
    };

    const handleAddBand = (periodIndex: number) => {
        const newPeriods = [...config.periods];
        newPeriods[periodIndex].bands.push({ minDays: 1, maxDays: null, perMonth: false, label: '' });
        setConfig({ ...config, periods: newPeriods });
    };

    const handleRemoveBand = (periodIndex: number, bandIndex: number) => {
        const newPeriods = [...config.periods];
        newPeriods[periodIndex].bands.splice(bandIndex, 1);
        setConfig({ ...config, periods: newPeriods });
    };

    const updateBand = (periodIndex: number, bandIndex: number, field: keyof BandConfig, value: any) => {
        const newPeriods = [...config.periods];
        newPeriods[periodIndex].bands[bandIndex] = { ...newPeriods[periodIndex].bands[bandIndex], [field]: value };
        setConfig({ ...config, periods: newPeriods });
    };

    const handleSave = () => {
        // Validation
        if (config.periods.length === 0) return alert("At least one period is required.");
        for (const p of config.periods) {
            if (!p.name || !p.startDate || !p.endDate) return alert("All periods must have a name, start date, and end date.");
            if (new Date(p.startDate) > new Date(p.endDate)) return alert(`Start date must be before end date for period: ${p.name}`);
            if (!p.usePreviousBands && p.bands.length === 0) return alert(`Period "${p.name}" must have at least one band if not using previous bands.`);
            
            if (!p.usePreviousBands) {
                for (const b of p.bands) {
                    if (b.minDays <= 0) return alert(`Min days must be > 0 in period "${p.name}".`);
                    if (b.maxDays !== null && b.maxDays < b.minDays) return alert(`Max days must be >= min days in period "${p.name}".`);
                }
            }
        }
        onSave(config);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 flex flex-col font-sans">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings2 className="w-6 h-6 text-blue-600"/> Configure Excel Template
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Define your pricing periods and duration bands before downloading the template.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 flex-grow space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-slate-800">Pricing Periods (Seasons)</h4>
                            <button onClick={handleAddPeriod} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-slate-200 flex items-center gap-2">
                                <Plus className="w-4 h-4"/> Add Period
                            </button>
                        </div>
                        
                        {config.periods.length === 0 && (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <p className="text-slate-500">No periods defined. Add a period to get started.</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {config.periods.map((period, pIdx) => (
                                <div key={pIdx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-4 items-end">
                                        <div className="flex-grow min-w-[200px]">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Period Name</label>
                                            <input type="text" placeholder="e.g. Summer High Season" value={period.name} onChange={e => updatePeriod(pIdx, 'name', e.target.value)} className="w-full border-slate-300 rounded-md border shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                                            <input type="date" value={period.startDate} onChange={e => updatePeriod(pIdx, 'startDate', e.target.value)} className="border-slate-300 rounded-md border shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                                            <input type="date" value={period.endDate} onChange={e => updatePeriod(pIdx, 'endDate', e.target.value)} className="border-slate-300 rounded-md border shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <button onClick={() => handleRemovePeriod(pIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Remove Period">
                                            <Trash2 className="w-5 h-5"/>
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={!period.usePreviousBands} onChange={() => updatePeriod(pIdx, 'usePreviousBands', false)} className="text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-slate-700">Custom bands for this period</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={period.usePreviousBands} onChange={() => updatePeriod(pIdx, 'usePreviousBands', true)} className="text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-slate-700">Use previous bands</span>
                                            </label>
                                        </div>

                                        {!period.usePreviousBands && (
                                            <div className="space-y-3 pl-4 border-l-2 border-blue-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h5 className="text-sm font-bold text-slate-700">Duration Bands</h5>
                                                    <button onClick={() => handleAddBand(pIdx)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 font-medium flex items-center gap-1">
                                                        <Plus className="w-3 h-3"/> Add Band
                                                    </button>
                                                </div>
                                                
                                                {period.bands.length === 0 && <p className="text-xs text-slate-500 italic">No bands defined. Click 'Add Band'.</p>}

                                                {period.bands.map((band, bIdx) => (
                                                    <div key={bIdx} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <input type="number" min="1" placeholder="Min" value={band.minDays} onChange={e => updateBand(pIdx, bIdx, 'minDays', parseInt(e.target.value) || 0)} className="w-16 border-slate-300 rounded border px-2 py-1 text-sm" />
                                                            <span className="text-slate-400">-</span>
                                                            <input type="number" min="1" placeholder="Max (opt)" value={band.maxDays || ''} onChange={e => updateBand(pIdx, bIdx, 'maxDays', e.target.value ? parseInt(e.target.value) : null)} className="w-20 border-slate-300 rounded border px-2 py-1 text-sm" />
                                                            <span className="text-xs text-slate-500">days</span>
                                                        </div>
                                                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                                        <input type="text" placeholder="Column Label (optional)" value={band.label || ''} onChange={e => updateBand(pIdx, bIdx, 'label', e.target.value)} className="flex-grow border-slate-300 rounded border px-2 py-1 text-sm" />
                                                        <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer ml-2">
                                                            <input type="checkbox" checked={band.perMonth} onChange={e => updateBand(pIdx, bIdx, 'perMonth', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                            Per Month
                                                        </label>
                                                        <button onClick={() => handleRemoveBand(pIdx, bIdx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-auto">
                                                            <X className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl sticky bottom-0 z-10">
                    <button onClick={onClose} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                        Save & Download Template
                    </button>
                </div>
            </div>
        </div>
    );
};

  const PricingContent = () => {
    const [file, setFile] = React.useState<File | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadSummary, setUploadSummary] = React.useState<RateImportSummary | null>(null);
    const [templateConfig, setTemplateConfig] = React.useState<TemplateConfig | null>(null);
    const [isSavingConfig, setIsSavingConfig] = React.useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);

    React.useEffect(() => {
        supplierApi.getTemplateConfig()
            .then(config => {
                if (config && config.periods) {
                    setTemplateConfig(config);
                } else {
                    // Initialize with default if backend returns empty
                    setTemplateConfig({
                        currency: 'USD',
                        bands: [],
                        periods: []
                    });
                }
            })
            .catch(err => {
                console.error("Failed to load template config, using default:", err);
                setTemplateConfig({
                    currency: 'USD',
                    bands: [],
                    periods: []
                });
            });
    }, []);

    const handleFileUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadSummary(null);
        try {
            const summary = await supplierApi.importSupplierRatesExcel(file);
            setUploadSummary(summary);
        } catch (error) {
            console.error(error);
            alert('Upload failed. Check console for details.');
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    const handleDownloadTemplate = () => {
        setIsConfigModalOpen(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><DollarSign className="w-6 h-6 text-blue-600"/> Price Management</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                    <h4 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2"><Download className="w-5 h-5 text-blue-600"/> Create / Download Excel Template</h4>
                    <p className="text-sm text-slate-500 mb-4">Define your pricing periods and bands, then download an Excel file pre-filled with your fleet. Fill out the prices and upload it back.</p>
                </div>
                <button onClick={handleDownloadTemplate} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                    <FileSpreadsheet className="w-5 h-5"/> Configure & Download Template
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-green-600"/> Upload Filled Template</h4>
                <p className="text-sm text-slate-500 mb-4">Once you've filled out the template, upload it here. The system will validate and import the new rates.</p>
                <div className="flex items-center gap-2">
                    <label className="flex-grow cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-medium text-slate-600">{file ? file.name : 'Click to choose Excel file...'}</span>
                        <input type="file" className="hidden" accept=".xlsx" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    <button onClick={handleFileUpload} disabled={!file || isUploading} className="bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {isUploading ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                    </button>
                </div>
                {uploadSummary && (
                    <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-lg text-sm">
                        <p className="font-bold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Import Complete</p>
                        <ul className="mt-2 space-y-1 text-green-700">
                            <li>Cars Updated: <strong>{uploadSummary.carsUpdated}</strong></li>
                            <li>Rates Imported: <strong>{uploadSummary.ratesImported}</strong></li>
                        </ul>
                        {uploadSummary.warnings.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                                <p className="text-orange-700 font-semibold mb-1">Warnings:</p>
                                <ul className="list-disc list-inside text-orange-600 text-xs space-y-1">
                                    {uploadSummary.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {isConfigModalOpen && templateConfig && (
            <TemplateConfigModal 
                initialConfig={templateConfig} 
                onClose={() => setIsConfigModalOpen(false)} 
                onSave={async (newConfig) => {
                    setIsSavingConfig(true);
                    try {
                        const updatedConfig = await supplierApi.updateTemplateConfig(newConfig);
                        setTemplateConfig(updatedConfig);
                        await supplierApi.downloadSupplierRatesTemplate();
                        setIsConfigModalOpen(false);
                    } catch (error) {
                        console.error(error);
                        alert('Failed to save config or download template.');
                    } finally {
                        setIsSavingConfig(false);
                    }
                }}
                isSaving={isSavingConfig}
            />
        )}
      </div>
    );
  };



  const StopSalesContent = () => {
      const [selectedLocation, setSelectedLocation] = React.useState<string>(supplierData?.locations?.[0]?.name || '');
      const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
      const [bulkStartDate, setBulkStartDate] = React.useState('');
      const [bulkEndDate, setBulkEndDate] = React.useState('');

      const filteredFleet = fleet.filter(c => {
          const matchLoc = c.location === selectedLocation;
          const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
          return matchLoc && matchCat;
      });

      const handleBulkStopSale = () => {
          if (!bulkStartDate || !bulkEndDate) return alert("Please select dates");
          if (confirm(`Apply Stop Sale to ${filteredFleet.length} vehicles in ${selectedLocation}?`)) {
              filteredFleet.forEach(c => handleStopSaleAdd(c.id, bulkStartDate, bulkEndDate));
              alert("Stop sale applied successfully.");
          }
      };

      return (
        <div className="space-y-6 p-6">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Stop Sales</h2>
                    <p className="text-slate-500">Block availability for specific dates and locations.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600"/> Bulk Action</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                        <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full border p-2 rounded">
                            {supplierData?.locations?.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full border p-2 rounded">
                            <option value="All">All Categories</option>
                            {Object.values(CarCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2 flex gap-2 items-end">
                        <div className="flex-grow">
                             <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                             <input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                        <div className="flex-grow">
                             <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                             <input type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                        <button onClick={handleBulkStopSale} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700">Apply Block</button>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded text-sm text-slate-600">
                    <p>Selected filters match <strong>{filteredFleet.length}</strong> vehicles.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Vehicle</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Blocked Dates</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFleet.map(car => (
                            <tr key={car.id}>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{car.make} {car.model}</div>
                                    <div className="text-xs text-slate-500">{car.sippCode} • {car.category}</div>
                                </td>
                                <td className="p-4 text-sm text-slate-600">{car.location}</td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {car.stopSales.slice(0, 3).map(d => <span key={d} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-100">{d}</span>)}
                                        {car.stopSales.length > 3 && <span className="text-xs text-slate-400">+{car.stopSales.length - 3} more</span>}
                                        {car.stopSales.length === 0 && <span className="text-xs text-slate-400 italic">No blocks</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => setRateModalTarget({ type: 'vehicle', id: car.id })} className="text-blue-600 hover:underline text-sm font-medium">Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  const ExtrasContent = () => {
    const [extras, setExtras] = React.useState<Extra[]>(allExtras);
    const [editingExtra, setEditingExtra] = React.useState<Extra | null | undefined>(undefined);

    const handleSaveExtra = (extraToSave: Extra) => {
        if (extraToSave.id) { // Editing
            const index = MOCK_CARS.flatMap(c => c.extras).findIndex(e => e.id === extraToSave.id);
            if (index > -1) {
                MOCK_CARS.forEach(c => {
                    const extraIndex = c.extras.findIndex(e => e.id === extraToSave.id);
                    if (extraIndex > -1) c.extras[extraIndex] = extraToSave;
                });
            }
        } else { // Creating
            const newExtra = { ...extraToSave, id: `ex-${Date.now()}`};
            // For simplicity, not adding to any specific car here.
            // A real implementation would need logic to decide which cars get the new extra.
            console.log("New extra created (not assigned to cars):", newExtra);
        }
        refreshLocalState();
        setExtras(allExtras); // Refresh from source
        setEditingExtra(undefined);
    };

    const handleDeleteExtra = (id: string) => {
        if (!window.confirm("Are you sure? This will remove the extra from all vehicles.")) return;
        MOCK_CARS.forEach(c => {
            c.extras = c.extras.filter(e => e.id !== id);
        });
        refreshLocalState();
        setExtras(allExtras);
    };

    return (
        <div className="space-y-6">
            {editingExtra !== undefined && <EditExtraModal isOpen={editingExtra !== undefined} extra={editingExtra} onClose={() => setEditingExtra(undefined)} onSave={handleSaveExtra} />}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><PlusCircle className="w-6 h-6 text-blue-600"/> Manage Optional Extras</h3>
                <button onClick={() => setEditingExtra(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4"/> Add New Extra</button>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Price</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Promotion</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {extras.map(extra => (
                                <tr key={extra.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-semibold">{extra.name}</td>
                                    <td className="px-4 py-2">${extra.price.toFixed(2)}</td>
                                    <td className="px-4 py-2">{extra.type}</td>
                                    <td className="px-4 py-2">{extra.promotionLabel || <span className="text-slate-400 italic">None</span>}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => setEditingExtra(extra)} className="p-1.5 text-slate-500 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteExtra(extra.id)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };
  
  const SettingsContent = () => {
    const [localSupplier, setLocalSupplier] = React.useState(supplierData);

    if (!localSupplier) return null;

    const handleUpdate = (field: keyof Supplier, value: any) => {
        setLocalSupplier(prev => prev ? {...prev, [field]: value} : null);
    };

    const handleSave = () => {
        if (!localSupplier) return;
        const index = SUPPLIERS.findIndex(s => s.id === localSupplier.id);
        if (index > -1) {
            SUPPLIERS[index] = localSupplier;
        }
        setSupplierData(localSupplier);
        alert("Settings saved!");
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Settings className="w-6 h-6 text-blue-600"/> Company Settings</h3>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <h4 className="font-bold mb-2 text-sm text-slate-600">Company Information</h4>
                    <div className="space-y-3">
                        <InputField label="Company Name" value={localSupplier.name} onChange={e => handleUpdate('name', e.target.value)} />
                        <InputField label="Contact Email" type="email" value={localSupplier.contactEmail} onChange={e => handleUpdate('contactEmail', e.target.value)} />
                        <InputField label="Contact Phone" value={localSupplier.phone} onChange={e => handleUpdate('phone', e.target.value)} />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-2 text-sm text-slate-600">Branding</h4>
                    <InputField label="Logo URL" value={localSupplier.logo} onChange={e => handleUpdate('logo', e.target.value)} />
                    {localSupplier.logo && <img src={localSupplier.logo} alt="logo preview" className="w-32 mt-2 bg-slate-100 p-2 rounded"/>}
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <h4 className="font-bold mb-2 text-sm text-slate-600">Operational Settings</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <InputField label="Grace Period (Hours)" type="number" placeholder="e.g., 2" value={localSupplier.gracePeriod || ''} onChange={e => handleUpdate('gracePeriod', parseInt(e.target.value, 10))} />
                         <InputField label="Lead Time (Hours)" type="number" placeholder="e.g., 48" value={localSupplier.leadTime || ''} onChange={e => handleUpdate('leadTime', parseInt(e.target.value, 10))} />
                    </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <h4 className="font-bold mb-2 text-sm text-slate-600">Protection & Insurance</h4>
                     <div className="space-y-2">
                        <label className="flex items-center text-sm text-slate-800 cursor-pointer">
                            <input type="checkbox" checked={localSupplier.includesCDW} onChange={e => handleUpdate('includesCDW', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"/>
                            Includes Collision Damage Waiver (CDW)
                        </label>
                        <label className="flex items-center text-sm text-slate-800 cursor-pointer">
                            <input type="checkbox" checked={localSupplier.includesTP} onChange={e => handleUpdate('includesTP', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"/>
                            Includes Theft Protection (TP)
                        </label>
                    </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <h4 className="font-bold mb-2 text-sm text-slate-600">Terms & Conditions</h4>
                    <textarea value={localSupplier.termsAndConditions} onChange={e => handleUpdate('termsAndConditions', e.target.value)} rows={8} className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-sm"></textarea>
                </div>
                <div className="md:col-span-2 text-right">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700">Save Settings</button>
                </div>
            </div>
        </div>
    );
  };
  
  const LocationsContent = () => {
    const [activeLocationMenu, setActiveLocationMenu] = React.useState<string | null>(null);

    if (!supplierData || !supplierData.locations) return <p>No locations found.</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-6 h-6 text-blue-600"/> Manage Locations</h3>
                <button onClick={() => setIsAddLocationModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4"/> Add New Location
                </button>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="space-y-3">
                    {supplierData.locations.map(loc => (
                        <div key={loc.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">{loc.name}</p>
                                <p className="text-xs text-slate-500">{loc.address}</p>
                            </div>
                            <div className="flex items-center gap-3 relative">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${loc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {loc.status.replace('_', ' ')}
                                </span>
                                <button onClick={() => setActiveLocationMenu(activeLocationMenu === loc.id ? null : loc.id)} className="p-1 hover:bg-slate-100 rounded-full">
                                    <MoreHorizontal className="w-4 h-4 text-slate-500"/>
                                </button>
                                {activeLocationMenu === loc.id && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-100">
                                        <div className="py-1">
                                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                                                <Edit2 className="w-3.5 h-3.5"/> Edit Details
                                            </button>
                                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                                                <CarIcon className="w-3.5 h-3.5"/> Manage Fleet
                                            </button>
                                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                <Trash2 className="w-3.5 h-3.5"/> Deactivate
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderContent = () => {
      switch (activeSection) {
        case 'dashboard': return <DashboardContent />;
        case 'bookings': return <BookingsContent />;
        case 'locations': return <LocationsContent />;
        case 'fleet': return <FleetContent />;
        case 'pricing': return <PricingContent />;
        case 'stopsales': return <StopSalesContent />;
        case 'extras': return <ExtrasContent />;
        case 'settings': return <SettingsContent />;
        default: return <DashboardContent />;
      }
  };


  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {isAddLocationModalOpen && <AddLocationModal 
        isOpen={isAddLocationModalOpen} 
        onClose={() => setIsAddLocationModalOpen(false)} 
        existingLocations={supplierData?.locations || []}
        existingFleet={fleet}
        onSave={(data) => {
            if (!supplierData) return;
            const newLocation: Location = {
                id: `loc-${Date.now()}`,
                name: data.location.name,
                address: data.location.address,
                status: 'pending_approval'
            };
            
            // Update Supplier Data
            const updatedSupplier = { ...supplierData, locations: [...(supplierData.locations || []), newLocation] };
            setSupplierData(updatedSupplier);
            
            // Handle Fleet Copy Strategy
            if (data.fleetStrategy === 'copy' && data.sourceLocationId) {
                const sourceLocName = supplierData.locations?.find(l => l.id === data.sourceLocationId)?.name;
                if (sourceLocName) {
                    const carsToCopy = fleet.filter(c => c.location === sourceLocName);
                    const newCars = carsToCopy.map(c => ({
                        ...c,
                        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        location: newLocation.name,
                        locationId: newLocation.id,
                        rateTiers: data.rateStrategy === 'copy' ? c.rateTiers : [] // Handle Rate Strategy
                    }));
                    setFleet([...fleet, ...newCars]);
                    // Update global mock if needed, but local state is enough for demo
                    MOCK_CARS.push(...newCars);
                }
            }
            
            // Update global supplier mock
            const sIndex = SUPPLIERS.findIndex(s => s.id === supplierId);
            if (sIndex > -1) SUPPLIERS[sIndex] = updatedSupplier;
            
            alert("Location submitted for approval!");
        }}
      />}

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
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none md:bg-transparent md:w-64 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </aside>

        <main className="flex-grow w-full md:pl-8 lg:pl-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;