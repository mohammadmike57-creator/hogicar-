import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Building, Calendar, 
  Save, Plus, Trash2, Edit, ChevronDown, ChevronUp, DollarSign, 
  Settings, AlertCircle, CheckCircle, Shield, TrendingUp, 
  MailQuestion, Rss, Link2, XCircle, RefreshCw, Copy, Share2, 
  Power, Tag, ImageIcon, PlusCircle, LoaderCircle, FileText, Globe, 
  Users, Search, Loader, PowerOff, Key, Code, Mail, CheckSquare, XSquare,
  Clock, History, Zap, Gift, PieChart, Activity, Percent, Coins, MapPin, Lock,
  Award, Star, Bell, Moon, Sun, Home, Briefcase, Truck, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Logo } from '../../components/Logo';
import { fetchLocations, LocationSuggestion } from '../../api';
import { adminFetch, getAdminToken } from '../../lib/adminApi';
import { API_BASE_URL } from '../../lib/config';
import { 
  ADMIN_STATS, SUPPLIERS, MOCK_BOOKINGS, addMockSupplier, 
  MOCK_API_PARTNERS, addMockApiPartner, updateApiPartnerStatus, 
  MOCK_CARS, MOCK_PAGES, updatePage, MOCK_SEO_CONFIGS, updateSeoConfig, 
  MOCK_HOMEPAGE_CONTENT, updateHomepageContent, MOCK_APP_CONFIG, 
  updateAppConfig, MOCK_CAR_LIBRARY, saveCarModel, deleteCarModel, 
  MOCK_AFFILIATES, updateAffiliateStatus, updateAffiliateCommissionRate, 
  MOCK_SUPPLIER_APPLICATIONS, removeSupplierApplication, 
  MOCK_CATEGORY_IMAGES, updateCategoryImages, calculatePrice, 
  addPromoCode, MOCK_PROMO_CODES, updatePromoCodeStatus, deletePromoCode 
} from '../../services/mockData';
import { 
  Supplier, CommissionType, BookingMode, ApiConnection, ApiPartner, 
  PageContent, SEOConfig, HomepageContent, CarModel, CarCategory, 
  CarType as VehicleType, Affiliate, SupplierApplication, Car as CarType, 
  RateTier, FeatureItem, StepItem, FaqItem
} from '../../types';

type Section = 'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 
                'carlibrary' | 'apipartners' | 'affiliates' | 'cms' | 'seo' | 
                'homepage' | 'sitesettings' | 'promotions';

// ==================== UI Components ====================
const StatCard = ({ icon: Icon, title, value, change, color = 'orange' }: any) => {
  const colors: any = { 
    orange: 'from-orange-500 to-orange-600 shadow-orange-200/50 text-orange-600 bg-orange-50', 
    blue: 'from-blue-500 to-blue-600 shadow-blue-200/50 text-blue-600 bg-blue-50', 
    green: 'from-green-500 to-green-600 shadow-green-200/50 text-green-600 bg-green-50', 
    purple: 'from-purple-500 to-purple-600 shadow-purple-200/50 text-purple-600 bg-purple-50' 
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-[2rem] p-7 shadow-2xl shadow-gray-200/40 border border-gray-100 flex flex-col justify-between relative overflow-hidden group transition-all duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color].split(' ').slice(0,2).join(' ')} opacity-[0.03] -mr-10 -mt-10 rounded-full transition-transform duration-500 group-hover:scale-125`} />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors[color].split(' ').slice(0,2).join(' ')} text-white shadow-xl transform transition-transform group-hover:rotate-6`}>
          <Icon className="w-7 h-7" />
        </div>
        {change && (
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all duration-300 ${change.startsWith('+') ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
              {change.startsWith('+') ? <TrendingUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{title}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon, action }: any) => (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-3">
      {Icon && <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Icon className="w-5 h-5" /></div>}
      <div><h2 className="text-2xl font-bold text-gray-800">{title}</h2>{subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}</div>
    </div>
    {action}
  </div>
);

const InputField = ({ label, error, ...props }: any) => (
  <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">{label}</label><input {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500`} /></div>
);

const SelectField = ({ label, options, error, ...props }: any) => (
  <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">{label}</label><select {...props} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white">{options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
);

const TextAreaField = ({ label, ...props }: any) => (
  <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">{label}</label><textarea {...props} className="w-full px-3 py-2 border border-gray-200 rounded-xl" /></div>
);

const Badge = ({ status }: { status: string }) => {
  const colors: any = { active: 'bg-green-100 text-green-700', pending: 'bg-orange-100 text-orange-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-red-100 text-red-700' };
  return <span className={`px-2 py-1 text-xs font-bold rounded-full border ${colors[status] || 'bg-gray-100'}`}>{status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending'}</span>;
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null;
  const sizes: any = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
        <div className="flex-grow overflow-y-auto p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
};

// ==================== Sidebar ====================
const Sidebar = ({ activeSection, setActiveSection, isOpen, setIsOpen, countSupplierRequests }: any) => {
  const navigate = useNavigate();
  const NavItem = ({ section, label, icon: Icon, count }: any) => {
    const active = activeSection === section;
    return (
      <motion.button 
        whileHover={{ x: 6, backgroundColor: active ? '' : 'rgba(249, 250, 251, 1)' }} 
        whileTap={{ scale: 0.98 }}
        onClick={() => { setActiveSection(section); setIsOpen(false); }}
        className={`flex items-center justify-between w-full px-4 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-orange-600 text-white shadow-2xl shadow-orange-200' : 'text-gray-400 hover:text-gray-900'}`}
      >
        <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-white/20 rotate-6' : 'bg-gray-100 group-hover:bg-white group-hover:rotate-6 group-hover:shadow-md'}`}>
                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'}`} />
            </div>
            <span className={`text-sm font-black tracking-tight ${active ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{label}</span>
        </div>
        {count !== undefined && count > 0 && (
            <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-[10px] font-black px-2 py-1 rounded-lg ${active ? 'bg-white text-orange-600' : 'bg-orange-600 text-white shadow-lg shadow-orange-200'}`}
            >
                {count}
            </motion.span>
        )}
      </motion.button>
    );
  };

  return (
    <>
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden" onClick={() => setIsOpen(false)} />}</AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-100 shadow-2xl md:shadow-none transform transition-all duration-500 ease-in-out md:translate-x-0 md:static md:z-auto p-6 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-10 px-2 flex items-center gap-4 py-6 border-b border-gray-50 relative group cursor-pointer">
            <div className="bg-orange-600 p-3 rounded-[1.25rem] shadow-xl shadow-orange-200 group-hover:rotate-12 transition-transform duration-500">
                <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
                <h1 className="font-black text-gray-900 text-2xl tracking-tighter leading-none">HogiCar</h1>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Control</span>
                </div>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <div className="px-4 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-60">Core Operations</div>
          <NavItem section="dashboard" label="Performance" icon={LayoutDashboard} />
          <NavItem section="suppliers" label="Supply Partners" icon={Building} />
          <NavItem section="supplierrequests" label="Requests" icon={MailQuestion} count={countSupplierRequests} />
          <NavItem section="bookings" label="Reservations" icon={Calendar} />
          <NavItem section="fleet" label="Active Fleet" icon={Car} />

          <div className="px-4 mb-4 mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-60">Inventory & Growth</div>
          <NavItem section="promotions" label="Smart Offers" icon={Tag} />
          <NavItem section="carlibrary" label="Global Library" icon={Car} />
          <NavItem section="apipartners" label="Integrations" icon={Share2} />
          <NavItem section="affiliates" label="Affiliate Hub" icon={DollarSign} />

          <div className="px-4 mb-4 mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-60">Content & SEO</div>
          <NavItem section="cms" label="Pages Content" icon={FileText} />
          <NavItem section="seo" label="Meta Data" icon={Globe} />
          <NavItem section="homepage" label="Site Assets" icon={ImageIcon} />
          <NavItem section="sitesettings" label="Configuration" icon={Settings} />
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-50">
          <motion.button 
            whileHover={{ x: 5, color: '#dc2626' }} 
            onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin-login'); }} 
            className="flex items-center w-full px-4 py-4 text-gray-400 hover:bg-red-50 rounded-2xl transition-all group font-black text-sm uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
};

// ==================== Location Picker ====================
const LocationPicker = ({ value, onChange, placeholder = "Search location..." }: any) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const timer = useRef<any>();
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { const res = await fetchLocations(query); setSuggestions(res); setIsOpen(res.length > 0); } catch(e) {} finally { setLoading(false); }
    }, 300);
  }, [query]);
  const handleSelect = (loc: LocationSuggestion) => { setSelectedLabel(loc.label); setQuery(loc.label); onChange(loc); setIsOpen(false); };
  return (
    <div className="relative">
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={query || selectedLabel} onChange={(e) => { setQuery(e.target.value); setSelectedLabel(''); onChange(null); }} placeholder={placeholder} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl" /></div>
      {isOpen && <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">{loading ? <div className="p-3 text-center"><Loader className="w-4 h-4 animate-spin inline" /> Loading...</div> : suggestions.map(loc => <button key={loc.value} onClick={() => handleSelect(loc)} className="w-full text-left px-4 py-2 hover:bg-orange-50"><span className="font-medium">{loc.label}</span><span className="text-gray-400 ml-2">({loc.value})</span></button>)}</div>}
    </div>
  );
};

// ==================== Edit Supplier Modal ====================
const EditSupplierModal = ({ supplier, isOpen, onClose, onSave }: any) => {
  const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [customLocs, setCustomLocs] = useState<any[]>([]);
  
  const BOOKING_MODE_OPTIONS = [
    { value: BookingMode.FREE_SALE, label: 'Free Sale (Instant)' },
    { value: BookingMode.ON_REQUEST, label: 'On Request (Manual)' }
  ];

  const COMMISSION_TYPE_OPTIONS = [
    { value: CommissionType.FULL_PREPAID, label: 'Full Prepaid' },
    { value: CommissionType.PARTIAL_PREPAID, label: 'Partial Prepaid' },
    { value: CommissionType.PAY_AT_DESK, label: 'Pay at Desk' }
  ];

  useEffect(() => { const stored = localStorage.getItem('hogicar_custom_locations'); if (stored) setCustomLocs(JSON.parse(stored)); }, [isOpen]);
  useEffect(() => { 
    if (isOpen) { 
        setEditedSupplier(supplier || {}); 
        if (supplier?.locationCode && supplier?.location) 
            setSelectedLocation({ label: supplier.location, value: supplier.locationCode }); 
        else 
            setSelectedLocation(null); 
    } 
  }, [supplier, isOpen]);

  const handleChange = (field: any, val: any) => setEditedSupplier(prev => ({ ...prev, [field]: val }));
  const handleLogo = (e: any) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => handleChange('logo', reader.result); reader.readAsDataURL(e.target.files[0]); } };
  const handleLocSelect = (loc: any) => { setSelectedLocation(loc); if (loc) { handleChange('locationCode', loc.value); handleChange('location', loc.label); } else { handleChange('locationCode', ''); handleChange('location', ''); } };
  const handleCreateCustom = () => { if (!newLocName) return alert("Enter name"); let code = newLocCode.trim().toUpperCase() || newLocName.replace(/[^a-zA-Z0-9]/g, '').substring(0,6).toUpperCase(); const newLoc = { label: newLocName, value: code }; const updated = [...customLocs, newLoc]; setCustomLocs(updated); localStorage.setItem('hogicar_custom_locations', JSON.stringify(updated)); handleLocSelect(newLoc); setNewLocName(''); setNewLocCode(''); };
  const handleSave = () => { 
    if (!editedSupplier.name || !editedSupplier.contactEmail) return alert("Name and contact email required"); 
    if (!selectedLocation) return alert("Select location"); 
    
    // Ensure booking mode and commission type are set if not present
    const finalSupplier = {
        ...editedSupplier,
        bookingMode: editedSupplier.bookingMode || BookingMode.FREE_SALE,
        commissionType: editedSupplier.commissionType || CommissionType.PARTIAL_PREPAID,
        commissionValue: editedSupplier.commissionValue || 0.15,
        includesCDW: editedSupplier.includesCDW ?? true,
        includesTP: editedSupplier.includesTP ?? true,
        gracePeriodHours: editedSupplier.gracePeriodHours ?? 0,
        minBookingLeadTime: editedSupplier.minBookingLeadTime ?? 0,
        oneWayFee: editedSupplier.oneWayFee ?? 0,
        connectionType: editedSupplier.connectionType || 'manual'
    };

    if (!finalSupplier.id) {
        finalSupplier.status = 'active';
        if (!finalSupplier.password) finalSupplier.password = 'defaultPassword123';
    }
    onSave(finalSupplier); 
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier?.id ? 'Edit Supplier' : 'Add Supplier'} size="lg">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex gap-6 p-6 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100/50">
          <div className="flex flex-col items-center">
            <div className="relative group w-28 h-28">
                {editedSupplier.logo || editedSupplier.logoUrl ? (
                    <img src={editedSupplier.logo || editedSupplier.logoUrl} className="w-full h-full rounded-2xl object-cover shadow-xl border-4 border-white" />
                ) : (
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 shadow-sm group-hover:border-orange-200 transition-colors">
                        <Building className="w-10 h-10 text-gray-300 group-hover:text-orange-200"/>
                    </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                    <ImageIcon className="w-6 h-6 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogo}/>
                </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">Company Logo</p>
          </div>
          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Company Name" placeholder="e.g. HogiCar Global" value={editedSupplier.name || ''} onChange={e => handleChange('name', e.target.value)} />
                <InputField label="Reservation Email" placeholder="bookings@partner.com" value={editedSupplier.contactEmail || ''} onChange={e => handleChange('contactEmail', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Login/Admin Email" placeholder="admin@partner.com" value={editedSupplier.email || editedSupplier.contactEmail || ''} onChange={e => handleChange('email', e.target.value)} />
                <InputField label="Contact Phone" placeholder="+1 (555) 000-0000" value={editedSupplier.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Location & Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-700">Service Coverage</h3>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Primary Hub</label>
                        <LocationPicker value={selectedLocation?.value || ''} onChange={handleLocSelect} />
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Quick Add New Location</label>
                        <div className="flex gap-2">
                            <input placeholder="City Name" value={newLocName} onChange={e => setNewLocName(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
                            <input placeholder="Code" value={newLocCode} onChange={e => setNewLocCode(e.target.value.toUpperCase())} className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
                            <button onClick={handleCreateCustom} className="p-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-700">Business Model</h3>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <SelectField label="Commission Type" value={editedSupplier.commissionType || ''} onChange={e => handleChange('commissionType', e.target.value)} options={COMMISSION_TYPE_OPTIONS} />
                    <InputField label="Commission Value" type="number" step="0.01" value={editedSupplier.commissionValue || 0} onChange={e => handleChange('commissionValue', parseFloat(e.target.value))} />
                    <SelectField label="Booking Policy" value={editedSupplier.bookingMode || ''} onChange={e => handleChange('bookingMode', e.target.value)} options={BOOKING_MODE_OPTIONS} />
                    <SelectField label="Connection Type" value={editedSupplier.connectionType || 'manual'} onChange={e => handleChange('connectionType', e.target.value)} options={[{value:'manual', label:'Manual Entry'}, {value:'api', label:'Real-time API'}]} />
                </div>
            </div>
        </div>

        {/* Operational Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3 text-orange-500" /> Time Constraints
                </h4>
                <InputField label="Grace Period (Hrs)" type="number" value={editedSupplier.gracePeriodHours || 0} onChange={e => handleChange('gracePeriodHours', parseInt(e.target.value))} />
                <InputField label="Min. Lead Time (Hrs)" type="number" value={editedSupplier.minBookingLeadTime || 0} onChange={e => handleChange('minBookingLeadTime', parseInt(e.target.value))} />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-green-500" /> Financials
                </h4>
                <InputField label="One-Way Fee" type="number" value={editedSupplier.oneWayFee || 0} onChange={e => handleChange('oneWayFee', parseFloat(e.target.value))} />
                <InputField label="Initial Rating" type="number" step="0.1" min="1" max="5" value={editedSupplier.rating || 5.0} onChange={e => handleChange('rating', parseFloat(e.target.value))} />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3 text-blue-500" /> Inclusions
                </h4>
                <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editedSupplier.includesCDW ?? true} onChange={e => handleChange('includesCDW', e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                        <span className="text-xs font-bold text-gray-600">CDW Included</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editedSupplier.includesTP ?? true} onChange={e => handleChange('includesTP', e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                        <span className="text-xs font-bold text-gray-600">Theft Protection Included</span>
                    </label>
                </div>
            </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-gray-700">Detailed Information</h3>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <InputField label="Office Address" placeholder="123 Airport Road, Terminal 1..." value={editedSupplier.address || ''} onChange={e => handleChange('address', e.target.value)} />
                <TextAreaField label="Terms & Conditions Summary" rows={3} placeholder="Key rental terms for the customer..." value={editedSupplier.termsAndConditions || ''} onChange={e => handleChange('termsAndConditions', e.target.value)} />
            </div>
        </div>

        {/* Security & Badges */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Access & Credentials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Set Password" type="password" placeholder={editedSupplier.id ? "Leave blank to keep current" : "Set login password"} value={editedSupplier.password || ''} onChange={e => handleChange('password', e.target.value)} />
                <div className="flex flex-col justify-end">
                    <label className="flex items-center p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all">
                        <input type="checkbox" checked={editedSupplier.enableSocialProof || false} onChange={e => handleChange('enableSocialProof', e.target.checked)} className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mr-3" />
                        <div>
                            <span className="text-sm font-bold text-gray-700 block">Trust Badge</span>
                            <span className="text-[10px] text-gray-400">Display "Top Rated" badge on listings</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Discard Changes</button>
            <button onClick={handleSave} className="px-10 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-xl hover:bg-black transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />
                {supplier?.id ? 'Update Partner' : 'Register Partner'}
            </button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== Supplier Requests ====================
const SupplierRequestsContent = ({ apps, onApprove, onReject }: any) => {
  const handleApprove = (app: any) => { const newSup: any = { name: app.companyName, contactEmail: app.email, location: app.primaryLocation, connectionType: app.integrationType === 'api' ? 'api' : 'manual', status: 'active', commissionType: CommissionType.PARTIAL_PREPAID, commissionValue: 0.15, bookingMode: BookingMode.FREE_SALE, username: app.companyName.toLowerCase().replace(/\s/g, ''), password: Math.random().toString(36).slice(-8) }; onApprove(newSup, app); };
  if (!apps.length) return <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-400">No pending requests</div>;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Supplier Requests" icon={MailQuestion} />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-xs">
              <th className="p-2">Company</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Fleet</th>
              <th className="p-2">Integration</th>
              <th className="p-2">Date</th>
              <th className="p-2"></th>
              </tr>
          </thead>
          <tbody>
            {apps.map((app: any) => (
              <tr key={app.id} className="hover:bg-orange-50">
                <td className="p-2">{app.companyName}<br/><span className="text-xs text-gray-500">{app.primaryLocation}</span></td>
                <td className="p-2">{app.contactName}<br/><span className="text-xs">{app.email}</span></td>
                <td className="p-2">{app.fleetSize}</td>
                <td className="p-2 uppercase text-xs">{app.integrationType}</td>
                <td className="p-2 text-xs">{app.submissionDate}</td>
                <td className="p-2 text-right">
                  <div className="flex gap-1">
                    <button onClick={() => handleApprove(app)} className="bg-green-100 p-1 rounded"><CheckCircle className="w-4 h-4"/></button>
                    <button onClick={() => onReject(app.id)} className="bg-red-100 p-1 rounded"><XCircle className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== Bookings ====================
const BookingsContent = ({ bookings, onRefresh }: any) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <SectionHeader title="Bookings" icon={Calendar} subtitle="Monitor all car rental reservations" />
        <button onClick={onRefresh} className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 border-b border-gray-100">
          <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-4">Reference</th>
            <th className="px-6 py-4">Customer</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Route (P/D)</th>
            <th className="px-6 py-4">Rental Dates</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {bookings.map((b: any) => (
            <tr key={b.id} className="hover:bg-orange-50/30 transition-colors group">
              <td className="px-6 py-4">
                <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                    {b.bookingRef}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-800">
                {b.firstName} {b.lastName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {b.supplierName || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{b.pickupCode}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{b.dropoffCode}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                {b.pickupDate} — {b.dropoffDate}
              </td>
              <td className="px-6 py-4">
                <Badge status={b.status}/>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                No bookings found in the database.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ==================== CMS ====================
const CmsContent = ({ pages, onEditPage }: any) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <SectionHeader title="CMS" icon={FileText} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {pages.map((page: any) => (
        <div key={page.slug} className="p-3 border rounded-xl">
          <div className="flex justify-between">
            <div><h3 className="font-bold">{page.title}</h3><p className="text-xs text-gray-500">/{page.slug}</p></div>
            <button onClick={() => onEditPage(page)}><Edit className="w-4 h-4"/></button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Last updated: {page.lastUpdated}</p>
        </div>
      ))}
    </div>
  </div>
);

// ==================== SEO ====================
const SeoContent = ({ configs, onEditSeo, onNewSeo }: any) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex justify-between"><SectionHeader title="SEO" icon={Globe} /><button onClick={onNewSeo} className="bg-orange-600 text-white px-3 py-1 rounded text-sm">New Route</button></div>
    <div className="space-y-2 mt-4">
      {configs.map((c: any) => (
        <div key={c.route} className="p-2 border rounded flex justify-between items-center">
          <div><p className="font-mono text-sm text-orange-600">{c.route}</p><p className="text-xs">{c.title}</p></div>
          <button onClick={() => onEditSeo(c)}><Edit className="w-4 h-4"/></button>
        </div>
      ))}
    </div>
  </div>
);

// ==================== Homepage ====================
const HomepageContentSection = ({ content, categoryImages, onSave }: any) => {
  const [localContent, setLocalContent] = useState(content);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { onSave(localContent, categoryImages); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleChange = (path: string, val: string) => {
    const parts = path.split('.');
    setLocalContent((prev: any) => {
      const newState = JSON.parse(JSON.stringify(prev));
      let cur = newState;
      for (let i = 0; i < parts.length-1; i++) cur = cur[parts[i]];
      cur[parts[parts.length-1]] = val;
      return newState;
    });
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Homepage Editor</h2><button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded">Save</button>{saved && <span className="text-green-600">Saved!</span>}</div>
      <div className="space-y-3">
        <InputField label="Hero Title" value={localContent.hero.title} onChange={e => handleChange('hero.title', e.target.value)} />
        <InputField label="Hero Subtitle" value={localContent.hero.subtitle} onChange={e => handleChange('hero.subtitle', e.target.value)} />
        <InputField label="Hero Background" value={localContent.hero.backgroundImage} onChange={e => handleChange('hero.backgroundImage', e.target.value)} />
        <InputField label="FAQs Title" value={localContent.faqs.title} onChange={e => handleChange('faqs.title', e.target.value)} />
      </div>
    </div>
  );
};

// ==================== Site Settings ====================
const SiteSettingsContent = () => {
  const [duration, setDuration] = useState(MOCK_APP_CONFIG.searchingScreenDuration / 1000);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { updateAppConfig({ searchingScreenDuration: duration * 1000 }); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Site Settings" icon={Settings} />
      <div><label className="block text-sm font-bold">Searching Screen Duration (seconds)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="border rounded p-2 w-32" /></div>
      <button onClick={handleSave} className="mt-3 bg-orange-600 text-white px-4 py-2 rounded">Save</button>{saved && <span className="ml-2 text-green-600">Saved!</span>}
    </div>
  );
};

// ==================== Affiliates ====================
const AffiliatesContent = ({ affiliates, onUpdateStatus, onEditCommission, editingAffiliate, setEditingAffiliate, onSaveCommission }: any) => {
  const EditModal = ({ affiliate, isOpen, onClose, onSave }: any) => {
    const [rate, setRate] = useState(affiliate?.commissionRate || 0);
    if (!isOpen) return null;
    return (<Modal isOpen={isOpen} onClose={onClose} title="Edit Commission"><InputField label="Rate (decimal)" type="number" step="0.01" value={rate} onChange={e => setRate(parseFloat(e.target.value))} /><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={() => onSave(affiliate.id, rate)} className="bg-orange-600 text-white px-3 py-1 rounded">Save</button></div></Modal>);
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Affiliates" icon={DollarSign} />
      <EditModal affiliate={editingAffiliate} isOpen={!!editingAffiliate} onClose={() => setEditingAffiliate(null)} onSave={onSaveCommission} />
      <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th>Name</th><th>Status</th><th>Commission</th><th>Clicks</th><th>Conversions</th><th>Earnings</th><th></th></tr></thead><tbody>{affiliates.map((aff: any) => (<tr key={aff.id} className="hover:bg-orange-50"><td className="p-2"><div className="font-bold">{aff.name}</div><div className="text-xs">{aff.email}</div></td><td className="p-2"><Badge status={aff.status}/></td><td className="p-2">{aff.commissionRate*100}%</td><td className="p-2">{aff.clicks}</td><td className="p-2">{aff.conversions}</td><td className="p-2">${aff.totalEarnings}</td><td className="p-2 text-right"><div className="flex gap-1">{aff.status === 'pending' && <><button onClick={() => onUpdateStatus(aff.id, 'active')} className="bg-green-100 p-1 rounded"><CheckCircle className="w-4 h-4"/></button><button onClick={() => onUpdateStatus(aff.id, 'rejected')} className="bg-red-100 p-1 rounded"><XCircle className="w-4 h-4"/></button></>}<button onClick={() => setEditingAffiliate(aff)} className="bg-gray-100 p-1 rounded"><Edit className="w-4 h-4"/></button></div></td></tr>))}</tbody></table></div>
    </div>
  );
};

// ==================== Promotions ====================
const PromotionsContent = () => {
  const [promos, setPromos] = useState(MOCK_PROMO_CODES);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(10);
  const handleAdd = (e: any) => { e.preventDefault(); if (!newCode) return; addPromoCode(newCode, newDiscount/100); setPromos([...MOCK_PROMO_CODES]); setNewCode(''); setNewDiscount(10); };
  const handleToggle = (id: string, status: string) => { updatePromoCodeStatus(id, status); setPromos([...MOCK_PROMO_CODES]); };
  const handleDelete = (id: string) => { if(confirm('Delete?')) { deletePromoCode(id); setPromos([...MOCK_PROMO_CODES]); } };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Promotions" icon={Tag} />
      <form onSubmit={handleAdd} className="flex gap-2 mb-4"><input type="text" placeholder="Code" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} className="border rounded p-1" /><input type="number" placeholder="%" value={newDiscount} onChange={e => setNewDiscount(parseInt(e.target.value))} className="border rounded p-1 w-16" /><button type="submit" className="bg-orange-600 text-white px-3 py-1 rounded">Add</button></form>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-xs"><th>Code</th><th>Discount</th><th>Status</th><th></th></tr></thead><tbody>{promos.map(p => (<tr key={p.id}><td className="p-2 font-mono">{p.code}</td><td className="p-2">{p.discount*100}%</td><td className="p-2"><Badge status={p.status}/></td><td className="p-2 text-right"><button onClick={() => handleToggle(p.id, p.status === 'active' ? 'inactive' : 'active')} className="p-1 bg-gray-100 rounded mr-1">{p.status === 'active' ? <PowerOff className="w-4 h-4"/> : <Power className="w-4 h-4"/>}</button><button onClick={() => handleDelete(p.id)} className="p-1 bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600"/></button></td></tr>))}</tbody></table></div>
    </div>
  );
};

// Helper to format enum to label
const formatEnum = (val: string) => {
  if (!val) return '';
  return val.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// ==================== Car Library ====================
const CarLibraryContent = ({ library, onEdit, onDelete }: any) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
        <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Global Car Library</h2>
            <p className="text-sm text-gray-500 font-medium">Define models available for all supply partners</p>
        </div>
        <button onClick={() => onEdit(null)} className="bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Add New Model
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Details</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Body Type</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {library.map((m: any) => (
              <tr key={m.id} className="hover:bg-orange-50/30 transition-colors group">
                <td className="px-8 py-4">
                  <div className="w-20 h-12 rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center p-1 group-hover:border-orange-200 transition-colors">
                    <img src={m.image || m.imageUrl} className="max-w-full max-h-full object-contain" />
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="font-bold text-gray-900">{m.make}</div>
                  <div className="text-xs text-gray-500">{m.model}</div>
                </td>
                <td className="px-8 py-4 text-sm font-medium text-gray-600">{m.year}</td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 rounded-lg border border-orange-100/50">
                    {formatEnum(m.category)}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 rounded-lg border border-blue-100/50">
                    {formatEnum(m.type)}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(m)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 hover:border-orange-100 hover:bg-orange-50 shadow-sm transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(m.id)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 shadow-sm transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== Suppliers Content ====================
const SuppliersContent = ({ suppliers, onEdit, onApprove, onManageApi, onAddSupplier, onRefresh, onDelete }: any) => (
  <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
        <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Supply Partners</h2>
            <p className="text-sm text-gray-500 font-medium">Manage your global car rental provider network</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onRefresh} className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onAddSupplier} className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add New Partner
            </button>
        </div>
    </div>
    <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider Details</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Connectivity</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stats (Fleet/Book)</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {suppliers.map((s: any) => (
                    <tr key={s.id} className="hover:bg-orange-50/30 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center p-2 group-hover:border-orange-200 transition-colors">
                                    <img src={s.logo || s.logoUrl} className="max-w-full max-h-full object-contain" onError={(e:any)=>e.target.src='https://via.placeholder.com/100?text=Logo'}/>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{s.name}</div>
                                    <div className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3" /> {s.location}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <Badge status={s.status || (s.active ? 'active' : 'inactive')}/>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${s.connectionType === 'api' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                    {s.connectionType === 'api' ? 'Real-time API' : 'Manual Entry'}
                                </span>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-sm font-black text-gray-900">{MOCK_CARS.filter(c => c.supplier.id === s.id).length}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Fleet</div>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="text-center">
                                    <div className="text-sm font-black text-gray-900">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === s.id)).length}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Bookings</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => onManageApi(s)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 shadow-sm transition-all" title="API Settings">
                                    <Rss className="w-4 h-4" />
                                </button>
                                <button onClick={() => onEdit(s)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 hover:border-orange-100 hover:bg-orange-50 shadow-sm transition-all" title="Edit Profile">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(s.id)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 shadow-sm transition-all" title="Terminate Partner">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  </div>
);

// ==================== Dashboard ====================
const DashboardContent = ({ stats, pendingCount, bookings }: any) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} title="Revenue" value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`} change="+12.5%" />
        <StatCard icon={Calendar} title="Reservations" value={stats.totalBookings} color="blue" change="+5.2%" />
        <StatCard icon={Building} title="Network Scale" value={`${stats.activeSuppliers}`} color="green" />
        <StatCard icon={Zap} title="Pending Actions" value={pendingCount} color="purple" />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        Financial Overview
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time revenue stream</p>
                </div>
                <select className="text-xs font-bold border border-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50">
                    <option>Last 30 Days</option>
                    <option>Quarterly</option>
                </select>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ADMIN_STATS}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} dx={-10} />
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                            itemStyle={{fontWeight: 'bold', fontSize: '12px'}}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Latest Activity
                </h3>
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase">Live</span>
            </div>
            <div className="space-y-6 flex-1">
                {bookings.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                                {b.firstName?.[0]}{b.lastName?.[0]}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{b.firstName} {b.lastName}</div>
                                <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{b.bookingRef} • {b.supplierName}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-gray-900">${b.finalPrice}</div>
                            <div className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1 inline-block ${b.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                {b.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-8 py-3.5 text-xs font-black text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl border border-dashed border-gray-200 transition-all uppercase tracking-widest">
                Explore All Transactions
            </button>
        </div>
    </div>
  </div>
);

// ==================== Fleet ====================
const FleetContent = ({ cars, onRefresh }: any) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <SectionHeader title="Global Fleet" icon={Car} subtitle="Fleet availability across all suppliers" />
        <button onClick={onRefresh} className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 border-b border-gray-100">
          <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-4">Vehicle</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">SIPP</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cars.map((c: any) => (
            <tr key={c.id} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src={c.image} className="w-12 h-8 object-contain rounded bg-gray-100 border" />
                    <div>
                        <div className="text-sm font-bold text-gray-800">{c.displayName}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{c.make} {c.model}</div>
                    </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {c.category}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {c.supplierName || 'Global'}
              </td>
              <td className="px-6 py-4 text-xs font-medium text-gray-500">
                {c.location}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-orange-600 font-bold">
                {c.sippCode}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-medium">{c.isAvailable ? 'Available' : 'Sold Out'}</span>
                </div>
              </td>
            </tr>
          ))}
          {cars.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                No vehicles listed in the global fleet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
const ApiPartnersContent = ({ partners, onCreate, onToggle }: any) => <div className="bg-white rounded-2xl shadow-lg p-6"><SectionHeader title="API Partners" icon={Share2} /><div className="text-center py-10 text-gray-400">Coming soon</div></div>;

// ==================== Modals ====================
const ApiConnectionModal = ({ supplier, isOpen, onClose, onSave }: any) => <Modal isOpen={isOpen} onClose={onClose} title="API Connection"><div>API settings</div></Modal>;
const PageEditorModal = ({ page, isOpen, onClose }: any) => {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  useEffect(() => { if (page) { setTitle(page.title); setContent(page.content); } }, [page]);
  const handleSave = () => { updatePage(page.slug, { title, content }); onClose(); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={`Edit ${page.slug}`}><InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextAreaField label="Content" value={content} onChange={e => setContent(e.target.value)} rows={10} /><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-orange-600 text-white px-3 py-1 rounded">Save</button></div></Modal>);
};
const SEOEditorModal = ({ config, isOpen, onClose }: any) => {
  const [route, setRoute] = useState(config?.route || '');
  const [title, setTitle] = useState(config?.title || '');
  const [description, setDescription] = useState(config?.description || '');
  const [keywords, setKeywords] = useState(config?.keywords || '');
  useEffect(() => { if (config) { setRoute(config.route); setTitle(config.title); setDescription(config.description); setKeywords(config.keywords || ''); } }, [config]);
  const handleSave = () => { updateSeoConfig({ route, title, description, keywords }); onClose(); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={config ? 'Edit SEO' : 'New SEO'}><InputField label="Route" value={route} onChange={e => setRoute(e.target.value)} disabled={!!config} /><InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextAreaField label="Description" value={description} onChange={e => setDescription(e.target.value)} /><InputField label="Keywords" value={keywords} onChange={e => setKeywords(e.target.value)} /><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-orange-600 text-white px-3 py-1 rounded">Save</button></div></Modal>);
};
const EditCarModelModal = ({ carModel, isOpen, onClose, onSave }: any) => {
  const [model, setModel] = useState<any>(carModel || { 
    make: '', 
    model: '', 
    year: new Date().getFullYear(), 
    category: 'ECONOMY', 
    type: 'SEDAN', 
    image: '', 
    passengers: 5, 
    bags: 3, 
    doors: 4 
  });

  useEffect(() => { 
    if (carModel) {
      setModel({
        ...carModel,
        image: carModel.image || carModel.imageUrl
      });
    } 
  }, [carModel]);

  const handleChange = (field: string, val: any) => setModel({ ...model, [field]: val });

  const handleImage = (e: any) => { 
    if (e.target.files?.[0]) { 
      const reader = new FileReader(); 
      reader.onloadend = () => handleChange('image', reader.result); 
      reader.readAsDataURL(e.target.files[0]); 
    } 
  };

  const handleSave = () => { 
    if (!model.make || !model.model || (!model.image && !model.imageUrl)) return alert("Required fields: Make, Model, and Image are required."); 
    onSave(model); 
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={carModel ? 'Edit Car Model' : 'Add New Car Model'}>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Make" placeholder="e.g. Toyota" value={model.make} onChange={(e: any) => handleChange('make', e.target.value)} />
        <InputField label="Model" placeholder="e.g. Corolla" value={model.model} onChange={(e: any) => handleChange('model', e.target.value)} />
        <InputField label="Year" type="number" value={model.year} onChange={(e: any) => handleChange('year', parseInt(e.target.value))} />
        <SelectField 
          label="Category" 
          value={model.category} 
          onChange={(e: any) => handleChange('category', e.target.value)} 
          options={Object.values(CarCategory).map(v => ({ value: v, label: formatEnum(v) }))} 
        />
        <SelectField 
          label="Body Type" 
          value={model.type} 
          onChange={(e: any) => handleChange('type', e.target.value)} 
          options={Object.values(VehicleType).map(v => ({ value: v, label: formatEnum(v) }))} 
        />
        <InputField label="Passengers" type="number" value={model.passengers} onChange={(e: any) => handleChange('passengers', parseInt(e.target.value))} />
        <InputField label="Bags (Large)" type="number" value={model.bags} onChange={(e: any) => handleChange('bags', parseInt(e.target.value))} />
        <InputField label="Doors" type="number" value={model.doors} onChange={(e: any) => handleChange('doors', parseInt(e.target.value))} />
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Vehicle Representation (PNG Recommended)</label>
        <div className="flex gap-4 items-center">
          <div className="w-32 h-20 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center p-2">
            {(model.image || model.imageUrl) ? (
              <img src={model.image || model.imageUrl} className="max-w-full max-h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-200" />
            )}
          </div>
          <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer group">
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-500 mb-1" />
            <span className="text-xs font-bold text-gray-500 group-hover:text-orange-600">Click to Upload Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImage}/>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
        <button 
          onClick={onClose}
          className="px-6 py-2.5 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className="bg-orange-600 text-white px-8 py-2.5 rounded-2xl font-bold text-sm shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all"
        >
          {carModel ? 'Save Changes' : 'Create Model'}
        </button>
      </div>
    </Modal>
  );
};
const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: any) => null;
const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: any) => null;

// ==================== Main AdminDashboard ====================
export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [carLibrary, setCarLibrary] = useState<any[]>([]);
  const [loadingCarLibrary, setLoadingCarLibrary] = useState(false);
  const [supplierApps, setSupplierApps] = useState(MOCK_SUPPLIER_APPLICATIONS);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [approvingApplication, setApprovingApplication] = useState<any>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiPartners, setApiPartners] = useState(MOCK_API_PARTNERS);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isSeoEditorOpen, setIsSeoEditorOpen] = useState(false);
  const [editingSeoConfig, setEditingSeoConfig] = useState<any>(null);
  const [isCarModelModalOpen, setIsCarModelModalOpen] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<any>(null);
  const [affiliates, setAffiliates] = useState(MOCK_AFFILIATES);
  const [editingAffiliate, setEditingAffiliate] = useState<any>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [managingPromosForCar, setManagingPromosForCar] = useState<any>(null);
  const [homepageContent, setHomepageContent] = useState(MOCK_HOMEPAGE_CONTENT);
  const [categoryImages, setCategoryImages] = useState(MOCK_CATEGORY_IMAGES);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await adminFetch('/api/admin/suppliers');
      const normalized = (Array.isArray(res) ? res : []).map((s: any) => ({
        ...s,
        contactEmail: s.contactEmail,
        logo: s.logoUrl,
        commissionValue: s.commissionPercent
      }));
      setSuppliers(normalized);
    } catch (e) { 
      console.error('Failed to fetch suppliers', e);
      setSuppliers([]); 
    } finally { setLoadingSuppliers(false); }
  };

  const fetchBookings = async (supplierId?: string | null) => {
    setLoadingBookings(true);
    try {
        const url = supplierId ? `/api/bookings?supplierId=${supplierId}` : '/api/bookings';
        const res = await adminFetch(url);
        setBookings(Array.isArray(res) ? res : []);
    } catch (e) {
        console.error('Failed to fetch bookings', e);
        setBookings([]);
    } finally { setLoadingBookings(false); }
  };

  const fetchFleet = async (supplierId?: string | null) => {
    setLoadingFleet(true);
    try {
        const url = supplierId ? `/api/admin/fleet/cars?supplierId=${supplierId}` : '/api/admin/fleet/cars';
        const res = await adminFetch(url);
        setFleet(Array.isArray(res) ? res : []);
    } catch (e) {
        console.error('Failed to fetch fleet', e);
        setFleet([]);
    } finally { setLoadingFleet(false); }
  };

  const fetchCarLibrary = async () => {
    setLoadingCarLibrary(true);
    try {
        const res = await adminFetch('/api/admin/car-models');
        const normalized = Array.isArray(res) ? res.map(m => ({
            ...m,
            image: m.imageUrl // Map backend 'imageUrl' to frontend 'image'
        })) : [];
        setCarLibrary(normalized);
    } catch (e) {
        console.error('Failed to fetch car library', e);
        setCarLibrary([]);
    } finally { setLoadingCarLibrary(false); }
  };

  useEffect(() => { 
    fetchSuppliers(); 
    fetchCarLibrary();
  }, []);

  useEffect(() => {
    fetchBookings(selectedSupplierId);
    fetchFleet(selectedSupplierId);
  }, [selectedSupplierId]);

  const stats = { 
    totalSuppliers: suppliers.length, 
    activeSuppliers: suppliers.filter(s => s.status === 'active' || (s as any).active).length, 
    totalBookings: bookings.length, 
    totalRevenue: bookings.reduce((acc, b) => acc + (b.finalPrice || 0), 0) || 1200000 
  };
  const pendingCount = supplierApps.length;

  const handleSaveSupplier = async (updatedSupplier: any) => {
    try {
      const payload = {
        name: updatedSupplier.name,
        email: updatedSupplier.email || updatedSupplier.contactEmail, // Login email
        contactEmail: updatedSupplier.contactEmail, // Reservation email
        phone: updatedSupplier.phone || "",
        logoUrl: updatedSupplier.logo || updatedSupplier.logoUrl || "",
        location: updatedSupplier.location || "",
        locationCode: updatedSupplier.locationCode || "",
        commissionPercent: updatedSupplier.commissionValue || 0,
        bookingMode: updatedSupplier.bookingMode || BookingMode.FREE_SALE,
        active: updatedSupplier.status === 'active' || updatedSupplier.active !== false,
        password: updatedSupplier.password || undefined,
        enableSocialProof: updatedSupplier.enableSocialProof || false,
        address: updatedSupplier.address || "",
        termsAndConditions: updatedSupplier.termsAndConditions || "",
        includesCDW: updatedSupplier.includesCDW ?? true,
        includesTP: updatedSupplier.includesTP ?? true,
        oneWayFee: updatedSupplier.oneWayFee || 0,
        gracePeriodHours: updatedSupplier.gracePeriodHours || 0,
        minBookingLeadTime: updatedSupplier.minBookingLeadTime || 0,
        connectionType: updatedSupplier.connectionType || 'manual',
        rating: updatedSupplier.rating || 5.0
      };

      if (!updatedSupplier.id) {
        await adminFetch('/api/admin/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert("Supplier created successfully");
      } else {
        await adminFetch(`/api/admin/suppliers/${updatedSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert("Supplier updated successfully");
      }
      
      await fetchSuppliers();
      setEditingSupplier(null);
      if (approvingApplication) { 
        removeSupplierApplication(approvingApplication.id); 
        setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]); 
        setApprovingApplication(null); 
      }
    } catch (err: any) { 
        alert(`Action failed: ${err.message}`); 
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    try {
      await adminFetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
      alert('Supplier deleted successfully');
      await fetchSuppliers();
    } catch (err: any) { alert(`Delete failed: ${err.message}`); }
  };

  const handleApproveSupplier = (id: string) => { const s = suppliers.find(s => s.id === id); if (s) { s.status = 'active'; setSuppliers([...suppliers]); } };
  const handleSaveApiConnection = (updated: Supplier) => { handleSaveSupplier(updated); setIsApiModalOpen(false); setEditingSupplier(null); };
  const handleCreateApiPartner = (name: string) => { if (!name) return; addMockApiPartner(name); setApiPartners([...MOCK_API_PARTNERS]); };
  const handleToggleApiPartnerStatus = (id: string, status: any) => { updateApiPartnerStatus(id, status); setApiPartners([...MOCK_API_PARTNERS]); };
  const handleSaveCarModel = async (model: any) => {
    try {
        const payload = {
            make: model.make,
            model: model.model,
            year: model.year,
            category: model.category,
            type: model.type,
            imageUrl: model.image || model.imageUrl,
            passengers: model.passengers,
            bags: model.bags,
            doors: model.doors
        };

        if (!model.id) {
            await adminFetch('/api/admin/car-models', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } else {
            await adminFetch(`/api/admin/car-models/${model.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }
        await fetchCarLibrary();
        setIsCarModelModalOpen(false);
        setEditingCarModel(null);
    } catch (e: any) {
        alert(`Failed to save car model: ${e.message}`);
    }
  };

  const handleDeleteCarModel = async (id: string) => { 
    if (!confirm('Are you sure you want to delete this car model?')) return;
    try {
        await adminFetch(`/api/admin/car-models/${id}`, { method: 'DELETE' });
        await fetchCarLibrary();
    } catch (e: any) {
        alert(`Delete failed: ${e.message}`);
    }
  };
  const handleUpdateAffiliateStatus = (id: string, status: any) => { updateAffiliateStatus(id, status); setAffiliates([...MOCK_AFFILIATES]); };
  const handleSaveAffiliateCommission = (id: string, rate: number) => { updateAffiliateCommissionRate(id, rate); setAffiliates([...MOCK_AFFILIATES]); setEditingAffiliate(null); };
  const handleSavePromotion = (carId: string, newTier: RateTier) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers.push(newTier); setIsPromotionModalOpen(false); setManagingPromosForCar(null); };
  const handleDeleteTier = (carId: string, tierId: string) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers = MOCK_CARS[idx].rateTiers.filter(t => t.id !== tierId); setManagingPromosForCar({...MOCK_CARS[idx]}); };
  const handleRejectApplication = (id: string) => { if (confirm('Reject?')) { removeSupplierApplication(id); setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]); } };
  const handleApproveApplication = (newSupplier: any, app: any) => { setApprovingApplication(app); setEditingSupplier(newSupplier); };
  const handleEditPage = (page: any) => { setEditingPage(page); setIsPageEditorOpen(true); };
  const handleNewSeo = () => { setEditingSeoConfig({}); setIsSeoEditorOpen(true); };
  const handleEditSeo = (config: any) => { setEditingSeoConfig(config); setIsSeoEditorOpen(true); };
  const handleSaveHomepage = (content: any, images: any) => { updateHomepageContent(content); updateCategoryImages(images); setHomepageContent(content); setCategoryImages(images); };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent stats={stats} pendingCount={pendingCount} bookings={bookings} />;
      case 'suppliers': return <SuppliersContent suppliers={suppliers} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(s: any) => { setEditingSupplier(s); setIsApiModalOpen(true); }} onAddSupplier={() => setEditingSupplier({})} onRefresh={fetchSuppliers} onDelete={handleDeleteSupplier} />;
      case 'supplierrequests': return <SupplierRequestsContent apps={supplierApps} onApprove={handleApproveApplication} onReject={handleRejectApplication} />;
      case 'bookings': return <BookingsContent bookings={bookings} onRefresh={fetchBookings} />;
      case 'fleet': return <FleetContent cars={fleet} onRefresh={fetchFleet} />;
      case 'carlibrary': return <CarLibraryContent library={carLibrary} onEdit={(m: any) => { setEditingCarModel(m); setIsCarModelModalOpen(true); }} onDelete={handleDeleteCarModel} />;
      case 'apipartners': return <ApiPartnersContent partners={apiPartners} onCreate={handleCreateApiPartner} onToggle={handleToggleApiPartnerStatus} />;
      case 'affiliates': return <AffiliatesContent affiliates={affiliates} onUpdateStatus={handleUpdateAffiliateStatus} onEditCommission={handleSaveAffiliateCommission} editingAffiliate={editingAffiliate} setEditingAffiliate={setEditingAffiliate} onSaveCommission={handleSaveAffiliateCommission} />;
      case 'cms': return <CmsContent pages={MOCK_PAGES} onEditPage={handleEditPage} />;
      case 'seo': return <SeoContent configs={MOCK_SEO_CONFIGS} onEditSeo={handleEditSeo} onNewSeo={handleNewSeo} />;
      case 'homepage': return <HomepageContentSection content={homepageContent} categoryImages={categoryImages} onSave={handleSaveHomepage} />;
      case 'sitesettings': return <SiteSettingsContent />;
      case 'promotions': return <PromotionsContent />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <EditSupplierModal isOpen={!!editingSupplier} onClose={() => setEditingSupplier(null)} onSave={handleSaveSupplier} supplier={editingSupplier} />
      {editingSupplier && isApiModalOpen && <ApiConnectionModal supplier={editingSupplier} isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSave={handleSaveApiConnection} />}
      {isPageEditorOpen && <PageEditorModal page={editingPage} isOpen={isPageEditorOpen} onClose={() => setIsPageEditorOpen(false)} />}
      {isSeoEditorOpen && <SEOEditorModal config={editingSeoConfig} isOpen={isSeoEditorOpen} onClose={() => setIsSeoEditorOpen(false)} />}
      {isCarModelModalOpen && <EditCarModelModal carModel={editingCarModel} isOpen={isCarModelModalOpen} onClose={() => setIsCarModelModalOpen(false)} onSave={handleSaveCarModel} />}
      {managingPromosForCar && <AdminPromotionModal car={managingPromosForCar} isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} onSave={handleSavePromotion} onDeleteTier={handleDeleteTier} />}
      
      <div className="md:hidden bg-white border-b px-6 py-4 flex justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg">
                <Shield className="w-5 h-5 text-white"/>
            </div>
            <span className="font-black text-gray-900 tracking-tighter uppercase">Admin Portal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 flex gap-8">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} countSupplierRequests={pendingCount} />
        
        <main className="flex-grow min-w-0">
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-100">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Administration / {activeSection}</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 capitalize tracking-tight leading-none">
                {activeSection === 'dashboard' ? 'Performance Overview' : activeSection}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {['dashboard', 'bookings', 'fleet'].includes(activeSection) && (
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600 border border-gray-50">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col pr-4">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Filter</span>
                    <select 
                        className="bg-transparent text-sm font-black text-gray-900 outline-none cursor-pointer"
                        value={selectedSupplierId || ''}
                        onChange={(e) => setSelectedSupplierId(e.target.value || null)}
                    >
                        <option value="">All Supply Partners</option>
                        {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                 <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white shadow-xl font-black text-xl cursor-pointer"
                 >
                    A
                 </motion.div>
                 <div className="hidden xl:block">
                    <p className="text-sm font-black text-gray-900 leading-none">Admin System</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Verified Access</p>
                    </div>
                 </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div 
                key={activeSection} 
                initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-[600px]"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-16 py-8 border-t border-gray-100 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                &copy; {new Date().getFullYear()} Hogicar Global Infrastructure. All Systems Operational.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};
