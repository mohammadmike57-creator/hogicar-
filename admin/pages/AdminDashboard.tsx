import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Building, Calendar, 
  Save, Plus, Trash2, Edit, ChevronDown, ChevronUp, DollarSign, 
  Settings, AlertCircle, CheckCircle, Shield, TrendingUp, 
  MailQuestion, Rss, Link2, XCircle, RefreshCw, Copy, Share2, 
  Power, Tag, ImageIcon, PlusCircle, Monitor, Tablet, Smartphone, 
  Expand, PowerOff, LoaderCircle, FileText, Globe, Users, Search,
  Loader, Clock, History, Zap, Gift, PieChart, Activity, Percent, Coins,
  Award, Star, Bell, Moon, Sun, Home, Briefcase, Truck, CreditCard,
  Key, Code, Mail, CheckSquare, XSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Logo } from '../../components/Logo';
import { fetchLocations, LocationSuggestion } from '../../api';
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
  RateTier, FeatureItem, StepItem, ValuePropositionItem, DestinationItem, FaqItem
} from '../../types';

type Section = 'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 
                'carlibrary' | 'apipartners' | 'affiliates' | 'cms' | 'seo' | 
                'homepage' | 'sitesettings' | 'promotions';

// ==================== UI Components ====================
const StatCard = ({ icon: Icon, title, value, change, color = 'orange' }: any) => {
  const colorClasses: any = { orange: 'bg-orange-100 text-orange-600', blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600' };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{change}</span>}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon, action }: any) => (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-3">
      {Icon && <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Icon className="w-5 h-5" /></div>}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const InputField = ({ label, error, ...props }: any) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <input {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition`} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const SelectField = ({ label, options, error, ...props }: any) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <select {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white`}>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const TextAreaField = ({ label, error, ...props }: any) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <textarea {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition min-h-[100px]`} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const colors: any = { active: 'bg-green-100 text-green-700', pending: 'bg-orange-100 text-orange-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-red-100 text-red-700', confirmed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
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
      <motion.button whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}
        onClick={() => { setActiveSection(section); setIsOpen(false); }}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all ${active ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
        <div className="flex items-center gap-3"><Icon className="w-5 h-5" /><span className="text-sm font-medium">{label}</span></div>
        {count !== undefined && count > 0 && <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}
      </motion.button>
    );
  };
  return (
    <>
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}</AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10"><div className="flex items-center gap-3"><Logo className="w-10 h-10" variant="light" /><div><h1 className="font-bold text-white text-xl">HogiCar</h1><p className="text-xs text-gray-400">Admin Portal</p></div></div><div className="mt-4 pt-4 border-t border-white/10"><div className="flex items-center gap-2 text-white/80"><Shield className="w-4 h-4" /><span className="text-sm">Admin Access</span></div></div></div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavItem section="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavItem section="suppliers" label="Suppliers" icon={Building} />
            <NavItem section="supplierrequests" label="Supplier Requests" icon={MailQuestion} count={countSupplierRequests} />
            <NavItem section="bookings" label="Bookings" icon={Calendar} />
            <NavItem section="fleet" label="Fleet" icon={Car} />
            <NavItem section="promotions" label="Promotions" icon={Tag} />
            <NavItem section="carlibrary" label="Car Library" icon={Car} />
            <NavItem section="apipartners" label="API Partners" icon={Share2} />
            <NavItem section="affiliates" label="Affiliates" icon={DollarSign} />
            <NavItem section="cms" label="CMS" icon={FileText} />
            <NavItem section="seo" label="SEO" icon={Globe} />
            <NavItem section="homepage" label="Homepage" icon={ImageIcon} />
            <NavItem section="sitesettings" label="Site Settings" icon={Settings} />
          </nav>
          <div className="p-4 border-t border-white/10">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin-login'); }} className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition"><LogOut className="w-5 h-5 mr-3" /><span>Logout</span></motion.button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== Searchable Location Picker ====================
const LocationPicker = ({ value, onChange, placeholder = "Search location..." }: { value: string; onChange: (location: LocationSuggestion | null) => void; placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await fetchLocations(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = (loc: LocationSuggestion) => {
    setSelectedLabel(loc.label);
    setQuery(loc.label);
    onChange(loc);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query || selectedLabel}
          onChange={(e) => { setQuery(e.target.value); setSelectedLabel(''); onChange(null); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500"><Loader className="w-4 h-4 animate-spin inline mr-2" /> Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-gray-500">No locations found</div>
          ) : (
            suggestions.map(loc => (
              <button
                key={loc.value}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm"
              >
                <span className="font-medium">{loc.label}</span>
                <span className="text-gray-400 text-xs ml-2">({loc.value})</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Edit Supplier Modal ====================
const EditSupplierModal = ({ supplier, isOpen, onClose, onSave }: any) => {
  const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationCode, setNewLocationCode] = useState('');
  const [customLocations, setCustomLocations] = useState<LocationSuggestion[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('hogicar_custom_locations');
    if (stored) {
      try { setCustomLocations(JSON.parse(stored)); } catch(e) {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setEditedSupplier(supplier || {});
      if (supplier?.locationCode && supplier?.location) {
        setSelectedLocation({ label: supplier.location, value: supplier.locationCode, type: 'airport', iataCode: supplier.locationCode, name: supplier.location, municipality: '', countryCode: '' });
        setNewLocationName('');
        setNewLocationCode('');
      } else {
        setSelectedLocation(null);
      }
    }
  }, [supplier, isOpen]);

  const handleChange = (field: keyof Supplier, value: any) => setEditedSupplier(prev => ({ ...prev, [field]: value }));
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('logo', reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLocationSelect = (loc: LocationSuggestion | null) => {
    setSelectedLocation(loc);
    if (loc) {
      handleChange('locationCode', loc.value);
      handleChange('location', loc.label);
    } else {
      handleChange('locationCode', '');
      handleChange('location', '');
    }
  };

  const handleCreateCustomLocation = () => {
    if (!newLocationName) { alert("Please enter location name."); return; }
    let code = newLocationCode.trim().toUpperCase();
    if (!code) {
      code = newLocationName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
      if (code.length < 2) code = newLocationName.substring(0, 3).toUpperCase();
    }
    const newLoc: LocationSuggestion = { label: newLocationName, value: code, type: 'city', iataCode: code, name: newLocationName, municipality: '', countryCode: '' };
    const updated = [...customLocations, newLoc];
    setCustomLocations(updated);
    localStorage.setItem('hogicar_custom_locations', JSON.stringify(updated));
    setSelectedLocation(newLoc);
    handleChange('locationCode', newLoc.value);
    handleChange('location', newLoc.label);
    setNewLocationName('');
    setNewLocationCode('');
  };

  const handleSave = () => {
    if (!editedSupplier.name || !editedSupplier.contactEmail) {
      alert("Supplier Name and Contact Email are required.");
      return;
    }
    if (!selectedLocation) {
      alert("Please select or create a primary location.");
      return;
    }
    if (!editedSupplier.id) {
      editedSupplier.status = 'active';
    }
    onSave(editedSupplier as Supplier);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier?.id ? 'Edit Supplier' : 'Add New Supplier'} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1">Logo</label>
            <div className="flex flex-col items-center gap-2">
              {editedSupplier.logo ? <img src={editedSupplier.logo} alt="Logo" className="w-24 h-24 object-contain rounded-full border p-1 bg-gray-50"/> : <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-400"/></div>}
              <label htmlFor="logo-upload" className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer">Upload<input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload}/></label>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <InputField label="Company Name" value={editedSupplier.name || ''} onChange={(e: any) => handleChange('name', e.target.value)} />
            <InputField label="Contact Email" type="email" value={editedSupplier.contactEmail || ''} onChange={(e: any) => handleChange('contactEmail', e.target.value)} />
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Primary Location</label>
              <LocationPicker value={selectedLocation?.value || ''} onChange={handleLocationSelect} placeholder="Search city or airport..." />
              {selectedLocation && <p className="text-xs text-green-600 mt-1">Selected: {selectedLocation.label} ({selectedLocation.value})</p>}
            </div>
            <div className="border-t pt-4 mt-2">
              <p className="text-xs font-bold text-gray-500 mb-2">Or create a new location (Code optional):</p>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Name (required)" value={newLocationName} onChange={(e: any) => setNewLocationName(e.target.value)} placeholder="e.g., My City" />
                <InputField label="Code (optional)" value={newLocationCode} onChange={(e: any) => setNewLocationCode(e.target.value.toUpperCase())} placeholder="auto-generated if empty" />
              </div>
              <button type="button" onClick={handleCreateCustomLocation} className="mt-2 bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3"/> Create & Select</button>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <h4 className="text-sm font-bold mb-2">Commission & Booking</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Commission Type" value={editedSupplier.commissionType || ''} onChange={(e: any) => handleChange('commissionType', e.target.value)} options={Object.values(CommissionType).map(v => ({ value: v, label: v }))} />
            <div><label className="block text-xs font-bold">Commission Value</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{editedSupplier.commissionType === 'Pay at Desk' ? '$' : '%'}</span><input type="number" step="0.01" value={editedSupplier.commissionValue || 0} onChange={(e: any) => handleChange('commissionValue', parseFloat(e.target.value))} className="pl-7 w-full border rounded-xl py-2 px-3" /></div></div>
            <SelectField label="Booking Mode" value={editedSupplier.bookingMode || ''} onChange={(e: any) => handleChange('bookingMode', e.target.value)} options={Object.values(BookingMode).map(v => ({ value: v, label: v }))} />
          </div>
        </div>
        <div className="pt-4 border-t"><h4 className="text-sm font-bold mb-2">Marketing Features</h4><div className="bg-orange-50 p-3 rounded-xl"><label className="flex items-center text-sm"><input type="checkbox" checked={editedSupplier.enableSocialProof || false} onChange={e => handleChange('enableSocialProof', e.target.checked)} className="mr-3" />Enable social proof messages</label></div></div>
        <div className="pt-4 border-t"><h4 className="text-sm font-bold mb-2">Supplier Portal Credentials</h4><div className="grid grid-cols-2 gap-4"><InputField label="Username" value={editedSupplier.username || ''} onChange={(e: any) => handleChange('username', e.target.value)} /><InputField label="Password" type="password" value={editedSupplier.password || ''} onChange={(e: any) => handleChange('password', e.target.value)} /></div></div>
        <div className="flex justify-end gap-3 pt-4 border-t"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={handleSave} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Save Supplier</button></div>
      </div>
    </Modal>
  );
};

// ==================== Supplier Requests Table ====================
const SupplierRequestsContent = ({ apps, onApprove, onReject }: any) => {
  const handleApprove = (app: SupplierApplication) => {
    const newSupplier: Partial<Supplier> = {
      name: app.companyName, contactEmail: app.email, location: app.primaryLocation,
      connectionType: app.integrationType === 'api' ? 'api' : 'manual', status: 'active',
      commissionType: CommissionType.PARTIAL_PREPAID, commissionValue: 0.15,
      bookingMode: BookingMode.FREE_SALE, username: app.companyName.toLowerCase().replace(/\s/g, ''),
      password: Math.random().toString(36).slice(-8),
    };
    onApprove(newSupplier, app);
  };
  if (apps.length === 0) return <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-400">No pending supplier requests.</div>;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Supplier Requests" icon={MailQuestion} />
      <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr className="text-xs font-semibold"><th className="p-3">Company</th><th className="p-3">Contact</th><th className="p-3">Fleet</th><th className="p-3">Integration</th><th className="p-3">Date</th><th className="p-3"></th></tr></thead><tbody>{apps.map((app: SupplierApplication) => (<tr key={app.id} className="hover:bg-orange-50"><td className="p-3"><span className="font-bold">{app.companyName}</span><br/><span className="text-xs text-gray-500">{app.primaryLocation}</span></td><td className="p-3">{app.contactName}<br/><span className="text-xs">{app.email}</span></td><td className="p-3">{app.fleetSize}</td><td className="p-3 uppercase text-xs">{app.integrationType}</td><td className="p-3 text-xs">{app.submissionDate}</td><td className="p-3 text-right"><div className="flex gap-2"><button onClick={() => handleApprove(app)} className="bg-green-100 p-2 rounded-md"><CheckCircle className="w-4 h-4 text-green-700"/></button><button onClick={() => onReject(app.id)} className="bg-red-100 p-2 rounded-md"><XCircle className="w-4 h-4 text-red-700"/></button></div></td></td>))}</tbody></table></div>
    </div>
  );
};

// ==================== Bookings Section ====================
const BookingsContent = () => {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="All Bookings" icon={Calendar} />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold text-gray-500">
              <th className="p-3">Ref</th><th className="p-3">Customer</th><th className="p-3">Pickup</th><th className="p-3">Dropoff</th><th className="p-3">Dates</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b: any) => (
              <tr key={b.id} className="hover:bg-orange-50">
                <td className="p-3 font-mono text-xs">{b.bookingRef}</td>
                <td className="p-3">{b.firstName} {b.lastName}</td>
                <td className="p-3">{b.pickupCode}</td>
                <td className="p-3">{b.dropoffCode}</td>
                <td className="p-3 text-xs">{b.pickupDate} → {b.dropoffDate}</td>
                <td className="p-3"><Badge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== CMS Section ====================
const CmsContent = ({ pages, onEditPage }: any) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <SectionHeader title="Content Management System" icon={FileText} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pages.map((page: PageContent) => (
        <div key={page.slug} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div><h3 className="font-bold text-gray-800">{page.title}</h3><p className="text-xs font-mono text-gray-500 bg-gray-50 px-1 rounded inline-block mt-1">/{page.slug}</p></div>
            <button onClick={() => onEditPage(page)} className="text-gray-500 hover:text-orange-600"><Edit className="w-4 h-4"/></button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Last updated: {page.lastUpdated}</p>
        </div>
      ))}
    </div>
  </div>
);

// ==================== SEO Section ====================
const SeoContent = ({ configs, onEditSeo, onNewSeo }: any) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <SectionHeader title="SEO Configurations" icon={Globe} />
      <button onClick={onNewSeo} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> New Route</button>
    </div>
    <div className="space-y-2">
      {configs.map((config: SEOConfig) => (
        <div key={config.route} className="p-3 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-orange-50/50">
          <div><p className="font-mono text-sm text-orange-600 font-semibold">{config.route}</p><p className="text-xs text-gray-700 mt-1">{config.title}</p><p className="text-xs text-gray-500 truncate max-w-md">{config.description}</p></div>
          <button onClick={() => onEditSeo(config)} className="text-gray-500 hover:text-orange-600"><Edit className="w-4 h-4"/></button>
        </div>
      ))}
    </div>
  </div>
);

// ==================== Homepage Section (fully working) ====================
const HomepageContentSection = ({ content, categoryImages, onSave }: any) => {
  const [localContent, setLocalContent] = useState(content);
  const [localCategoryImages, setLocalCategoryImages] = useState(categoryImages);
  const [saved, setSaved] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("hero");

  const handleSave = () => { onSave(localContent, localCategoryImages); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const handleTextChange = (path: string, value: string) => {
    const keys = path.split(".");
    setLocalContent((prev: HomepageContent) => {
      const newState = JSON.parse(JSON.stringify(prev));
      let currentLevel: any = newState;
      for (let i = 0; i < keys.length - 1; i++) currentLevel = currentLevel[keys[i]];
      currentLevel[keys[keys.length - 1]] = value;
      return newState;
    });
  };
  const handleNestedItemChange = (section: keyof HomepageContent, nestedKey: string | null, index: number, field: string, value: any) => {
    setLocalContent((prev: HomepageContent) => {
      const newState = JSON.parse(JSON.stringify(prev));
      const arrayParent = newState[section] as any;
      const arrayToUpdate = nestedKey ? arrayParent[nestedKey] : arrayParent;
      if (Array.isArray(arrayToUpdate)) arrayToUpdate[index][field] = value;
      return newState;
    });
  };
  const handleAddItem = (section: keyof HomepageContent, nestedKey: string | null = null, template: object) => {
    setLocalContent((prev: HomepageContent) => {
      const newState = JSON.parse(JSON.stringify(prev));
      if(nestedKey) (newState[section] as any)[nestedKey].push(template);
      else (newState[section] as any).push(template);
      return newState;
    });
  };
  const handleDeleteItem = (section: keyof HomepageContent, nestedKey: string | null = null, index: number) => {
    if (!window.confirm("Delete?")) return;
    setLocalContent((prev: HomepageContent) => {
      const newState = JSON.parse(JSON.stringify(prev));
      if(nestedKey) (newState[section] as any)[nestedKey].splice(index, 1);
      else (newState[section] as any).splice(index, 1);
      return newState;
    });
  };
  const InputFieldComp = ({ label, value, onChange, fieldKey }: any) => (
    <div key={fieldKey} className="mb-2"><label className="block text-xs font-bold text-gray-500">{label}</label><input type="text" value={value} onChange={onChange} className="w-full p-2 border border-gray-200 rounded-lg" /></div>
  );
  const AccordionSection = ({ title, id, children }: any) => (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button onClick={() => setActiveAccordion(activeAccordion === id ? null : id)} className="w-full flex justify-between items-center p-3 bg-orange-50"><span className="font-bold text-sm">{title}</span>{activeAccordion === id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}</button>
      {activeAccordion === id && <div className="p-4 border-t">{children}</div>}
    </div>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm py-3 mb-6 flex justify-between border-b"><h2 className="text-lg font-bold">Homepage Editor</h2><button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Save</button>{saved && <span className="text-green-600 text-xs">Saved!</span>}</div>
        <AccordionSection title="Hero Section" id="hero">
          <InputFieldComp fieldKey="hero-title" label="Title" value={localContent.hero.title} onChange={e => handleTextChange("hero.title", e.target.value)} />
          <InputFieldComp fieldKey="hero-subtitle" label="Subtitle" value={localContent.hero.subtitle} onChange={e => handleTextChange("hero.subtitle", e.target.value)} />
          <InputFieldComp fieldKey="hero-bg" label="Background Image URL" value={localContent.hero.backgroundImage} onChange={e => handleTextChange("hero.backgroundImage", e.target.value)} />
        </AccordionSection>
        <AccordionSection title="Features" id="features">
          {(localContent.features || []).map((item: FeatureItem, idx: number) => (
            <div key={item.id} className="p-3 border rounded mb-2 relative">
              <button onClick={() => handleDeleteItem("features", null, idx)} className="absolute top-2 right-2 text-red-400"><Trash2 className="w-4 h-4"/></button>
              <InputFieldComp fieldKey={`feature-icon-${idx}`} label="Icon" value={item.icon} onChange={e => handleNestedItemChange("features", null, idx, "icon", e.target.value)} />
              <InputFieldComp fieldKey={`feature-title-${idx}`} label="Title" value={item.title} onChange={e => handleNestedItemChange("features", null, idx, "title", e.target.value)} />
              <InputFieldComp fieldKey={`feature-desc-${idx}`} label="Description" value={item.description} onChange={e => handleNestedItemChange("features", null, idx, "description", e.target.value)} />
            </div>
          ))}
          <button onClick={() => handleAddItem("features", null, {id: Date.now().toString(), icon: "Globe", title: "", description: ""})} className="text-orange-600 text-xs"><PlusCircle className="w-4 h-4 inline"/> Add Feature</button>
        </AccordionSection>
        <AccordionSection title="How It Works" id="howitworks">
          <InputFieldComp fieldKey="how-title" label="Title" value={localContent.howItWorks.title} onChange={e => handleTextChange("howItWorks.title", e.target.value)} />
          <InputFieldComp fieldKey="how-subtitle" label="Subtitle" value={localContent.howItWorks.subtitle} onChange={e => handleTextChange("howItWorks.subtitle", e.target.value)} />
          {(localContent.howItWorks.steps || []).map((step: StepItem, idx: number) => (
            <div key={step.id} className="p-3 border rounded mb-2 relative">
              <button onClick={() => handleDeleteItem("howItWorks", "steps", idx)} className="absolute top-2 right-2 text-red-400"><Trash2 className="w-4 h-4"/></button>
              <InputFieldComp fieldKey={`step-icon-${idx}`} label="Icon" value={step.icon} onChange={e => handleNestedItemChange("howItWorks", "steps", idx, "icon", e.target.value)} />
              <InputFieldComp fieldKey={`step-title-${idx}`} label="Title" value={step.title} onChange={e => handleNestedItemChange("howItWorks", "steps", idx, "title", e.target.value)} />
              <InputFieldComp fieldKey={`step-desc-${idx}`} label="Description" value={step.description} onChange={e => handleNestedItemChange("howItWorks", "steps", idx, "description", e.target.value)} />
            </div>
          ))}
          <button onClick={() => handleAddItem("howItWorks", "steps", {id: Date.now().toString(), icon: "Search", title: "", description: ""})} className="text-orange-600 text-xs"><PlusCircle className="w-4 h-4 inline"/> Add Step</button>
        </AccordionSection>
        <AccordionSection title="FAQs" id="faqs">
          <InputFieldComp fieldKey="faq-title" label="Title" value={localContent.faqs.title} onChange={e => handleTextChange("faqs.title", e.target.value)} />
          {(localContent.faqs.items || []).map((faq: FaqItem, idx: number) => (
            <div key={faq.id} className="p-3 border rounded mb-2 relative">
              <button onClick={() => handleDeleteItem("faqs", "items", idx)} className="absolute top-2 right-2 text-red-400"><Trash2 className="w-4 h-4"/></button>
              <InputFieldComp fieldKey={`faq-q-${idx}`} label="Question" value={faq.question} onChange={e => handleNestedItemChange("faqs", "items", idx, "question", e.target.value)} />
              <InputFieldComp fieldKey={`faq-a-${idx}`} label="Answer" value={faq.answer} onChange={e => handleNestedItemChange("faqs", "items", idx, "answer", e.target.value)} />
            </div>
          ))}
          <button onClick={() => handleAddItem("faqs", "items", {id: Date.now().toString(), question: "", answer: ""})} className="text-orange-600 text-xs"><PlusCircle className="w-4 h-4 inline"/> Add FAQ</button>
        </AccordionSection>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg sticky top-20 h-[calc(100vh-10rem)]"><div className="h-full flex items-center justify-center text-gray-500">Live preview (iframe) would appear here</div></div>
    </div>
  );
};

// ==================== Site Settings ====================
const SiteSettingsContent = () => {
  const [duration, setDuration] = useState(MOCK_APP_CONFIG.searchingScreenDuration / 1000);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { updateAppConfig({ searchingScreenDuration: duration * 1000 }); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Site Settings" icon={Settings} />
      <div className="max-w-md space-y-6">
        <div><label className="block text-sm font-bold mb-2">Searching Screen Duration (seconds)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border rounded-lg p-2" /></div>
        <button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Save</button>{saved && <span className="text-green-600 ml-2">Saved!</span>}
      </div>
    </div>
  );
};

// ==================== Affiliates Section ====================
const AffiliatesContent = ({ affiliates, onUpdateStatus, onEditCommission, editingAffiliate, setEditingAffiliate, onSaveCommission }: any) => {
  const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: any) => {
    const [rate, setRate] = useState(affiliate?.commissionRate || 0);
    useEffect(() => { if(affiliate) setRate(affiliate.commissionRate); }, [affiliate]);
    if (!isOpen) return null;
    return (<Modal isOpen={isOpen} onClose={onClose} title="Edit Commission" size="sm"><InputField label="Commission Rate (decimal)" type="number" step="0.01" value={rate} onChange={e => setRate(parseFloat(e.target.value))} /><div className="flex justify-end gap-3 mt-4"><button onClick={onClose}>Cancel</button><button onClick={() => onSave(affiliate.id, rate)} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Save</button></div></Modal>);
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Affiliates" icon={DollarSign} />
      <EditAffiliateModal affiliate={editingAffiliate} isOpen={!!editingAffiliate} onClose={() => setEditingAffiliate(null)} onSave={onSaveCommission} />
      <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Commission</th><th className="p-3">Clicks</th><th className="p-3">Conversions</th><th className="p-3">Earnings</th><th className="p-3"></th></tr></thead><tbody>{affiliates.map((aff: Affiliate) => (<tr key={aff.id} className="hover:bg-orange-50"><td className="p-3"><div className="font-bold">{aff.name}</div><div className="text-xs text-gray-500">{aff.email}</div></td><td className="p-3"><Badge status={aff.status}/></td><td className="p-3">{aff.commissionRate*100}%</td><td className="p-3">{aff.clicks}</td><td className="p-3">{aff.conversions}</td><td className="p-3">${aff.totalEarnings}</td><td className="p-3 text-right"><div className="flex gap-2">{aff.status === 'pending' && <><button onClick={() => onUpdateStatus(aff.id, 'active')} className="bg-green-100 p-2 rounded"><CheckCircle className="w-4 h-4"/></button><button onClick={() => onUpdateStatus(aff.id, 'rejected')} className="bg-red-100 p-2 rounded"><XCircle className="w-4 h-4"/></button></>}{aff.status === 'active' && <button onClick={() => onUpdateStatus(aff.id, 'rejected')} className="bg-gray-100 p-2 rounded"><PowerOff className="w-4 h-4"/></button>}<button onClick={() => setEditingAffiliate(aff)} className="bg-gray-100 p-2 rounded"><Edit className="w-4 h-4"/></button></div></td></tr>))}</tbody></table></div>
    </div>
  );
};

// ==================== Promotions Section ====================
const PromotionsContent = () => {
  const [promos, setPromos] = useState(MOCK_PROMO_CODES);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(10);
  const handleAdd = (e: React.FormEvent) => { e.preventDefault(); if (!newCode) return; addPromoCode(newCode, newDiscount/100); setPromos([...MOCK_PROMO_CODES]); setNewCode(''); setNewDiscount(10); };
  const handleToggle = (id: string, status: 'active'|'inactive') => { updatePromoCodeStatus(id, status); setPromos([...MOCK_PROMO_CODES]); };
  const handleDelete = (id: string) => { if(confirm('Delete?')) { deletePromoCode(id); setPromos([...MOCK_PROMO_CODES]); } };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <SectionHeader title="Promo Codes" icon={Tag} />
      <form onSubmit={handleAdd} className="bg-orange-50 p-4 rounded-xl flex gap-4 items-end mb-6"><div className="flex-1"><label className="block text-xs font-bold">Code</label><input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} className="w-full border rounded-lg p-2" /></div><div><label className="block text-xs font-bold">Discount %</label><input type="number" value={newDiscount} onChange={e => setNewDiscount(parseInt(e.target.value))} className="w-24 border rounded-lg p-2" /></div><button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg">Add</button></form>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-xs"><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead><tbody>{promos.map(p => (<tr key={p.id}><td className="p-3 font-mono">{p.code}</td><td className="p-3">{p.discount*100}%</td><td className="p-3"><Badge status={p.status}/></td><td className="p-3 text-right"><button onClick={() => handleToggle(p.id, p.status === 'active' ? 'inactive' : 'active')} className="p-2 bg-gray-100 rounded mr-2">{p.status === 'active' ? <PowerOff className="w-4 h-4"/> : <Power className="w-4 h-4"/>}</button><button onClick={() => handleDelete(p.id)} className="p-2 bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600"/></button></td></tr>))}</tbody></table></div>
    </div>
  );
};

// ==================== Car Library (pre‑populated) ====================
const CarLibraryContent = ({ library, onEdit, onDelete }: any) => {
  useEffect(() => {
    if (library.length === 0) {
      const defaultModels = [
        { id: '1', make: 'Toyota', model: 'Corolla', year: 2023, category: 'ECONOMY', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2018/03/13/19/09/toyota-3223474_1280.png', passengers: 5, bags: 2, doors: 4 },
        { id: '2', make: 'Toyota', model: 'Camry', year: 2023, category: 'MIDSIZE', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2018/03/13/19/09/toyota-3223474_1280.png', passengers: 5, bags: 3, doors: 4 },
        { id: '3', make: 'Honda', model: 'Civic', year: 2023, category: 'ECONOMY', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2015/09/02/12/43/honda-918522_1280.jpg', passengers: 5, bags: 2, doors: 4 },
        { id: '4', make: 'Honda', model: 'CR-V', year: 2023, category: 'SUV', type: 'SUV', image: 'https://cdn.pixabay.com/photo/2018/04/07/12/54/honda-3298743_1280.jpg', passengers: 5, bags: 4, doors: 5 },
        { id: '5', make: 'BMW', model: '3 Series', year: 2023, category: 'PREMIUM', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2020/05/23/11/58/bmw-5210777_1280.jpg', passengers: 5, bags: 3, doors: 4 },
        { id: '6', make: 'Mercedes', model: 'C-Class', year: 2023, category: 'PREMIUM', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2017/12/22/18/31/mercedes-benz-3034659_1280.jpg', passengers: 5, bags: 3, doors: 4 },
        { id: '7', make: 'Nissan', model: 'Altima', year: 2023, category: 'MIDSIZE', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2016/11/29/05/21/nissan-1867732_1280.jpg', passengers: 5, bags: 2, doors: 4 },
        { id: '8', make: 'Hyundai', model: 'Elantra', year: 2023, category: 'ECONOMY', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2017/06/20/12/32/hyundai-2423283_1280.jpg', passengers: 5, bags: 2, doors: 4 },
        { id: '9', make: 'Kia', model: 'Sportage', year: 2023, category: 'SUV', type: 'SUV', image: 'https://cdn.pixabay.com/photo/2020/01/12/18/34/kia-4761653_1280.jpg', passengers: 5, bags: 4, doors: 5 },
        { id: '10', make: 'Ford', model: 'Mustang', year: 2023, category: 'PREMIUM', type: 'CONVERTIBLE', image: 'https://cdn.pixabay.com/photo/2017/08/31/16/40/ford-2701767_1280.jpg', passengers: 4, bags: 1, doors: 2 },
        { id: '11', make: 'Chevrolet', model: 'Malibu', year: 2023, category: 'MIDSIZE', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2017/04/25/18/30/chevrolet-2261531_1280.jpg', passengers: 5, bags: 2, doors: 4 },
        { id: '12', make: 'Volkswagen', model: 'Jetta', year: 2023, category: 'ECONOMY', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2016/10/06/18/11/volkswagen-1719497_1280.jpg', passengers: 5, bags: 2, doors: 4 },
        { id: '13', make: 'Audi', model: 'A4', year: 2023, category: 'PREMIUM', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2016/10/06/18/13/audi-1719500_1280.jpg', passengers: 5, bags: 3, doors: 4 },
        { id: '14', make: 'Lexus', model: 'RX', year: 2023, category: 'LUXURY', type: 'SUV', image: 'https://cdn.pixabay.com/photo/2019/02/10/12/58/lexus-3987373_1280.jpg', passengers: 5, bags: 4, doors: 5 },
        { id: '15', make: 'Tesla', model: 'Model 3', year: 2023, category: 'ELECTRIC', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2020/03/13/13/33/tesla-4927117_1280.jpg', passengers: 5, bags: 2, doors: 4 },
      ];
      defaultModels.forEach(m => saveCarModel(m));
    }
  }, []);
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4"><SectionHeader title="Car Library" icon={Car} /><button onClick={() => onEdit(null)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Add Model</button></div>
      <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th className="p-3">Image</th><th className="p-3">Make/Model</th><th className="p-3">Year</th><th className="p-3">Category</th><th className="p-3">Type</th><th className="p-3"></th></tr></thead><tbody>{library.map((model: CarModel) => (<tr key={model.id} className="hover:bg-orange-50"><td className="p-3"><img src={model.image} className="w-16 h-10 object-cover rounded"/></td><td className="p-3 font-bold">{model.make} {model.model}</td><td className="p-3">{model.year}</td><td className="p-3">{model.category}</td><td className="p-3">{model.type}</td><td className="p-3 text-right"><div className="flex gap-2"><button onClick={() => onEdit(model)} className="bg-gray-100 p-2 rounded"><Edit className="w-4 h-4"/></button><button onClick={() => onDelete(model.id)} className="bg-red-100 p-2 rounded"><Trash2 className="w-4 h-4 text-red-600"/></button></div></td></tr>))}</tbody></table></div>
    </div>
  );
};

// ==================== Suppliers Content ====================
const SuppliersContent = ({ suppliers, onEdit, onApprove, onManageApi, onAddSupplier, onRefresh, onDelete }: any) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex justify-between mb-4"><SectionHeader title="Supplier Management" icon={Building} /><div className="flex gap-2"><button onClick={onRefresh} className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Refresh</button><button onClick={onAddSupplier} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Add Supplier</button></div></div>
    <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th className="p-3">Supplier</th><th className="p-3">Status</th><th className="p-3">Connection</th><th className="p-3">Fleet</th><th className="p-3">Bookings</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{suppliers.map((s: Supplier) => (<tr key={s.id} className="hover:bg-orange-50"><td className="p-3 flex items-center gap-3"><img src={s.logo} className="w-8 h-8 rounded-full"/><div><div className="font-bold">{s.name}</div><div className="text-xs text-gray-500">{s.location}</div></div></td><td className="p-3"><Badge status={s.status || 'active'}/></td><td className="p-3"><span className="text-xs bg-gray-100 px-2 py-1 rounded">{s.connectionType === 'api' ? 'API' : 'Manual'}</span></td><td className="p-3">{MOCK_CARS.filter(c => c.supplier.id === s.id).length}</td><td className="p-3">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === s.id)).length}</td><td className="p-3 text-right"><div className="flex justify-end gap-2"><button onClick={() => onManageApi(s)} className="p-2 bg-gray-100 rounded-md"><Rss className="w-4 h-4"/></button><button onClick={() => onEdit(s)} className="p-2 bg-gray-100 rounded-md"><Edit className="w-4 h-4"/></button><button onClick={() => onDelete(s.id)} className="p-2 bg-red-100 text-red-600 rounded-md"><Trash2 className="w-4 h-4"/></button></div></td></tr>))}</tbody></table></div>
  </div>
);

// ==================== Dashboard Content ====================
const DashboardContent = ({ stats, pendingCount }: any) => (
  <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-5"><StatCard icon={DollarSign} title="Total Revenue" value="$1.2M" change="+15%" /><StatCard icon={Calendar} title="Total Bookings" value={MOCK_BOOKINGS.length} color="blue" /><StatCard icon={Building} title="Active Suppliers" value={`${stats.activeSuppliers} / ${stats.totalSuppliers}`} color="green" /><StatCard icon={AlertCircle} title="Pending Actions" value={pendingCount} color="purple" /></div><div className="bg-white rounded-2xl shadow-lg p-6"><h3 className="font-bold mb-4">Monthly Revenue</h3><ResponsiveContainer width="100%" height={300}><AreaChart data={ADMIN_STATS}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.1}/></AreaChart></ResponsiveContainer></div></div>
);

// ==================== Placeholder sections (Fleet, API Partners) ====================
const FleetContent = () => <div className="bg-white rounded-2xl shadow-lg p-6"><SectionHeader title="Fleet Management" icon={Car}/><div className="text-center py-10 text-gray-400">Fleet management coming soon</div></div>;
const ApiPartnersContent = ({ partners, onCreate, onToggle }: any) => <div className="bg-white rounded-2xl shadow-lg p-6"><SectionHeader title="API Partners" icon={Share2}/><div className="text-center py-10 text-gray-400">API partners management coming soon</div></div>;

// ==================== Modal placeholders (simplified but working) ====================
const ApiConnectionModal = ({ supplier, isOpen, onClose, onSave }: any) => <Modal isOpen={isOpen} onClose={onClose} title="API Connection"><div>API connection settings (to be implemented)</div></Modal>;
const PageEditorModal = ({ page, isOpen, onClose }: any) => {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  useEffect(() => { if(page) { setTitle(page.title); setContent(page.content); } }, [page]);
  const handleSave = () => { updatePage(page.slug, { title, content }); onClose(); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={`Edit ${page.slug}`} size="lg"><InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextAreaField label="Content (HTML)" value={content} onChange={e => setContent(e.target.value)} rows={15} /><div className="flex justify-end gap-3 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Save</button></div></Modal>);
};
const SEOEditorModal = ({ config, isOpen, onClose }: any) => {
  const [route, setRoute] = useState(config?.route || '');
  const [title, setTitle] = useState(config?.title || '');
  const [description, setDescription] = useState(config?.description || '');
  const [keywords, setKeywords] = useState(config?.keywords || '');
  useEffect(() => { if(config) { setRoute(config.route); setTitle(config.title); setDescription(config.description); setKeywords(config.keywords || ''); } }, [config]);
  const handleSave = () => { updateSeoConfig({ route, title, description, keywords }); onClose(); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={config ? 'Edit SEO' : 'New SEO'} size="md"><InputField label="Route" value={route} onChange={e => setRoute(e.target.value)} disabled={!!config} /><InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextAreaField label="Description" value={description} onChange={e => setDescription(e.target.value)} /><InputField label="Keywords (comma)" value={keywords} onChange={e => setKeywords(e.target.value)} /><div className="flex justify-end gap-3 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Save</button></div></Modal>);
};
const EditCarModelModal = ({ carModel, isOpen, onClose, onSave }: any) => {
  const [model, setModel] = useState<CarModel>(carModel || { id: '', make: '', model: '', year: new Date().getFullYear(), category: 'ECONOMY', type: 'SEDAN', image: '', passengers: 4, bags: 2, doors: 4 });
  useEffect(() => { if(carModel) setModel(carModel); }, [carModel]);
  const handleChange = (field: keyof CarModel, value: any) => setModel(prev => ({ ...prev, [field]: value }));
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if(e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => handleChange('image', reader.result as string); reader.readAsDataURL(e.target.files[0]); } };
  const handleSave = () => { if(!model.make || !model.model || !model.image) { alert('Required fields'); return; } onSave(model); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={carModel ? 'Edit Car' : 'Add Car'} size="lg"><div className="grid grid-cols-3 gap-4"><InputField label="Make" value={model.make} onChange={e => handleChange('make', e.target.value)} /><InputField label="Model" value={model.model} onChange={e => handleChange('model', e.target.value)} /><InputField label="Year" type="number" value={model.year} onChange={e => handleChange('year', parseInt(e.target.value))} /></div><div><label>Image</label><div className="flex gap-4 mt-1">{model.image && <img src={model.image} className="w-32 h-20 object-cover rounded"/>}<label className="cursor-pointer bg-gray-100 px-4 py-2 rounded">Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/></label></div></div><div className="grid grid-cols-2 gap-4 mt-4"><SelectField label="Category" value={model.category} onChange={e => handleChange('category', e.target.value)} options={Object.values(CarCategory).map(v => ({ value: v, label: v }))} /><SelectField label="Type" value={model.type} onChange={e => handleChange('type', e.target.value)} options={Object.values(VehicleType).map(v => ({ value: v, label: v }))} /></div><div className="grid grid-cols-3 gap-4 mt-4"><InputField label="Passengers" type="number" value={model.passengers} onChange={e => handleChange('passengers', parseInt(e.target.value))} /><InputField label="Bags" type="number" value={model.bags} onChange={e => handleChange('bags', parseInt(e.target.value))} /><InputField label="Doors" type="number" value={model.doors} onChange={e => handleChange('doors', parseInt(e.target.value))} /></div><div className="flex justify-end gap-3 mt-6"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Save</button></div></Modal>);
};
const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: any) => null; // handled inside AffiliatesContent
const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: any) => null; // not used in this simplified version

// ==================== Main AdminDashboard ====================
export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierApps, setSupplierApps] = useState(MOCK_SUPPLIER_APPLICATIONS);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [approvingApplication, setApprovingApplication] = useState<SupplierApplication | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiPartners, setApiPartners] = useState(MOCK_API_PARTNERS);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [isSeoEditorOpen, setIsSeoEditorOpen] = useState(false);
  const [editingSeoConfig, setEditingSeoConfig] = useState<SEOConfig | null>(null);
  const [carLibrary, setCarLibrary] = useState(MOCK_CAR_LIBRARY);
  const [isCarModelModalOpen, setIsCarModelModalOpen] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<CarModel | null>(null);
  const [affiliates, setAffiliates] = useState(MOCK_AFFILIATES);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [managingPromosForCar, setManagingPromosForCar] = useState<CarType | null>(null);
  const [homepageContent, setHomepageContent] = useState(MOCK_HOMEPAGE_CONTENT);
  const [categoryImages, setCategoryImages] = useState(MOCK_CATEGORY_IMAGES);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { setSuppliers([]); return; }
      const response = await fetch('https://hogicar-backend.onrender.com/api/admin/suppliers', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setSuppliers(await response.json());
      else setSuppliers([]);
    } catch (error) { setSuppliers([]); } finally { setLoadingSuppliers(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const stats = { totalSuppliers: suppliers.length, activeSuppliers: suppliers.filter(s => s.status === 'active').length, totalBookings: MOCK_BOOKINGS.length, totalRevenue: 1200000 };
  const pendingCount = supplierApps.length;

  const handleSaveSupplier = async (updatedSupplier: Supplier) => {
    try {
      if (!updatedSupplier.id) {
        const payload = {
          name: updatedSupplier.name,
          email: updatedSupplier.contactEmail,
          phone: updatedSupplier.phone || "",
          logoUrl: updatedSupplier.logo || "",
          active: true,
          location: updatedSupplier.location || "",
          locationCode: updatedSupplier.locationCode || "",
          bookingMode: updatedSupplier.bookingMode || "FREE_SALE",
          commissionPercent: updatedSupplier.commissionValue || 0,
          password: updatedSupplier.password || "defaultPassword123",
          password_confirmation: updatedSupplier.password || "defaultPassword123"
        };
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No token');
        const response = await fetch('https://hogicar-backend.onrender.com/api/admin/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
        alert("Supplier created successfully.");
        await fetchSuppliers();
      } else {
        addMockSupplier(updatedSupplier);
        setSuppliers([...SUPPLIERS]);
      }
      setEditingSupplier(null);
      if (approvingApplication) { removeSupplierApplication(approvingApplication.id); setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]); setApprovingApplication(null); }
    } catch (error: any) { alert(`Failed: ${error.message}`); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No token');
      const response = await fetch(`https://hogicar-backend.onrender.com/api/admin/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(await response.text());
      alert('Supplier deleted');
      await fetchSuppliers();
    } catch (error: any) { alert(`Delete failed: ${error.message}`); }
  };

  const handleApproveSupplier = (id: string) => { const s = suppliers.find(s => s.id === id); if (s) { s.status = 'active'; setSuppliers([...suppliers]); } };
  const handleSaveApiConnection = (updated: Supplier) => { handleSaveSupplier(updated); setIsApiModalOpen(false); setEditingSupplier(null); };
  const handleCreateApiPartner = (name: string) => { if (!name) return; addMockApiPartner(name); setApiPartners([...MOCK_API_PARTNERS]); };
  const handleToggleApiPartnerStatus = (id: string, status: any) => { updateApiPartnerStatus(id, status); setApiPartners([...MOCK_API_PARTNERS]); };
  const handleSaveCarModel = (model: CarModel) => { saveCarModel(model); setCarLibrary([...MOCK_CAR_LIBRARY]); setIsCarModelModalOpen(false); setEditingCarModel(null); };
  const handleDeleteCarModel = (id: string) => { if (confirm("Delete car model?")) { deleteCarModel(id); setCarLibrary([...MOCK_CAR_LIBRARY]); } };
  const handleUpdateAffiliateStatus = (id: string, status: any) => { updateAffiliateStatus(id, status); setAffiliates([...MOCK_AFFILIATES]); };
  const handleSaveAffiliateCommission = (id: string, rate: number) => { updateAffiliateCommissionRate(id, rate); setAffiliates([...MOCK_AFFILIATES]); setEditingAffiliate(null); };
  const handleSavePromotion = (carId: string, newTier: RateTier) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers.push(newTier); setIsPromotionModalOpen(false); setManagingPromosForCar(null); };
  const handleDeleteTier = (carId: string, tierId: string) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers = MOCK_CARS[idx].rateTiers.filter(t => t.id !== tierId); setManagingPromosForCar({...MOCK_CARS[idx]}); };
  const handleRejectApplication = (id: string) => { if (confirm("Reject?")) { removeSupplierApplication(id); setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]); } };
  const handleApproveApplication = (newSupplier: Partial<Supplier>, app: SupplierApplication) => { setApprovingApplication(app); setEditingSupplier(newSupplier as Supplier); };
  const handleEditPage = (page: PageContent) => { setEditingPage(page); setIsPageEditorOpen(true); };
  const handleNewSeo = () => { setEditingSeoConfig({} as SEOConfig); setIsSeoEditorOpen(true); };
  const handleEditSeo = (config: SEOConfig) => { setEditingSeoConfig(config); setIsSeoEditorOpen(true); };
  const handleSaveHomepage = (content: HomepageContent, images: any) => { updateHomepageContent(content); updateCategoryImages(images); setHomepageContent(content); setCategoryImages(images); };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent stats={stats} pendingCount={pendingCount} />;
      case 'suppliers': return <SuppliersContent suppliers={suppliers} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(s: Supplier) => { setEditingSupplier(s); setIsApiModalOpen(true); }} onAddSupplier={() => setEditingSupplier({} as Supplier)} onRefresh={fetchSuppliers} onDelete={handleDeleteSupplier} />;
      case 'supplierrequests': return <SupplierRequestsContent apps={supplierApps} onApprove={handleApproveApplication} onReject={handleRejectApplication} />;
      case 'bookings': return <BookingsContent />;
      case 'fleet': return <FleetContent />;
      case 'carlibrary': return <CarLibraryContent library={carLibrary} onEdit={(m: CarModel | null) => { setEditingCarModel(m); setIsCarModelModalOpen(true); }} onDelete={handleDeleteCarModel} />;
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
    <div className="min-h-screen bg-gray-50">
      <EditSupplierModal isOpen={!!editingSupplier} onClose={() => { setEditingSupplier(null); setApprovingApplication(null); }} onSave={handleSaveSupplier} supplier={editingSupplier} />
      {editingSupplier && isApiModalOpen && <ApiConnectionModal supplier={editingSupplier} isOpen={isApiModalOpen} onClose={() => { setIsApiModalOpen(false); setEditingSupplier(null); }} onSave={handleSaveApiConnection} />}
      {isPageEditorOpen && <PageEditorModal page={editingPage} isOpen={isPageEditorOpen} onClose={() => setIsPageEditorOpen(false)} />}
      {isSeoEditorOpen && <SEOEditorModal config={editingSeoConfig} isOpen={isSeoEditorOpen} onClose={() => setIsSeoEditorOpen(false)} />}
      {isCarModelModalOpen && <EditCarModelModal carModel={editingCarModel} isOpen={isCarModelModalOpen} onClose={() => { setIsCarModelModalOpen(false); setEditingCarModel(null); }} onSave={handleSaveCarModel} />}
      {managingPromosForCar && <AdminPromotionModal car={managingPromosForCar} isOpen={isPromotionModalOpen} onClose={() => { setIsPromotionModalOpen(false); setManagingPromosForCar(null); }} onSave={handleSavePromotion} onDeleteTier={handleDeleteTier} />}
      <div className="md:hidden bg-white border-b px-4 py-3 flex justify-between sticky top-0 z-20"><div className="flex items-center gap-2"><Shield className="w-6 h-6 text-orange-600"/><span className="font-bold">Admin Panel</span></div><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2"><Menu/></button></div>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex"><Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} countSupplierRequests={pendingCount} /><main className="flex-grow lg:pl-8"><AnimatePresence mode="wait"><motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>{renderContent()}</motion.div></AnimatePresence></main></div>
    </div>
  );
};
