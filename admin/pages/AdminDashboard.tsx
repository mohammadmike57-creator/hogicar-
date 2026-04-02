import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Building, Calendar, 
  Save, Plus, Trash2, Edit, ChevronDown, ChevronUp, DollarSign, 
  Settings, AlertCircle, CheckCircle, Shield, TrendingUp, 
  MailQuestion, Rss, Link2, XCircle, RefreshCw, Copy, Share2, ShieldCheck,
  Power, Tag, ImageIcon, PlusCircle, LoaderCircle, FileText, Globe, 
  Users, Search, Loader, PowerOff, Key, Code, Mail, CheckSquare, XSquare,
  Clock, History, Zap, Gift, PieChart, Activity, Percent, Coins, MapPin, Lock,
  Eye, EyeOff,
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
  Supplier, CommissionType, BookingMode, PickupType, ApiConnection, ApiPartner, 
  PageContent, SEOConfig, HomepageContent, CarModel, CarCategory, 
  CarType as VehicleType, Affiliate, SupplierApplication, Car as CarType, 
  RateTier, FeatureItem, StepItem, FaqItem
} from '../../types';

// ==================== Helper Functions ====================
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

type Section = 'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 
                'carlibrary' | 'apipartners' | 'affiliates' | 'cms' | 'seo' | 
                'homepage' | 'sitesettings' | 'promotions' | 'globallocations' | 'homepagelogos' | 'searchinglogos';

// ==================== UI Components ====================
const StatCard = ({ icon: Icon, title, value, change, color = 'orange' }: any) => {
  const colors: any = { 
    orange: 'from-orange-500 to-orange-600 shadow-orange-100/50 text-orange-600 bg-orange-50/50', 
    blue: 'from-blue-500 to-blue-600 shadow-blue-100/50 text-blue-600 bg-blue-50/50', 
    green: 'from-green-500 to-green-600 shadow-green-100/50 text-green-600 bg-green-50/50', 
    purple: 'from-purple-500 to-purple-600 shadow-purple-100/50 text-purple-600 bg-purple-50/50' 
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/30 border border-gray-100/50 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors[color].split(' ').slice(0,2).join(' ')} text-white shadow-lg transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border flex items-center gap-1.5 ${change.startsWith('+') ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
            {change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon, action }: any) => (
  <div className="flex justify-between items-center mb-8">
    <div className="flex items-center gap-4">
      {Icon && <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100/50 shadow-sm"><Icon className="w-5 h-5" /></div>}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
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

const GlobalLocationsContent = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<any>({ iataCode: '', name: '', municipality: '', countryCode: '', type: 'city' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async (keyword = '') => {
    setLoading(true);
    try {
      const url = `/api/admin/locations${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`;
      const res = await adminFetch(url);
      setLocations(Array.isArray(res) ? res : []);
    } catch (e: any) {
      console.error(e);
      alert('Failed to load locations: ' + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(filter);
    }, 500);
    return () => clearTimeout(timer);
  }, [filter]);

  const filtered = useMemo(() => {
    if (!Array.isArray(locations)) return [];
    const q = filter.toLowerCase().trim();
    if (!q) return locations;
    return locations.filter((l: any) =>
      (l.iataCode && l.iataCode.toLowerCase().includes(q)) ||
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.municipality && l.municipality.toLowerCase().includes(q))
    );
  }, [locations, filter]);

  const resetForm = () => { setForm({ iataCode: '', name: '', municipality: '', countryCode: '', type: 'city' }); setEditingId(null); };

  const handleSave = async () => {
    if ((!form.iataCode && form.type === 'Airport') || !form.name) { alert('IATA code (for Airport) and Name are required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await adminFetch(`/api/admin/locations/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await adminFetch('/api/admin/locations', { method: 'POST', body: JSON.stringify(form) });
      }
      await load();
      resetForm();
    } catch (e: any) {
      alert('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  const handleEdit = (loc: any) => { setEditingId(loc.id); setForm({ iataCode: loc.iataCode, name: loc.name, municipality: loc.municipality, countryCode: loc.countryCode, type: loc.type || 'city' }); };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this location?')) return;
    try {
      await adminFetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) { alert('Delete failed: ' + e.message); }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <SectionHeader title="Global Locations" subtitle="Manage searchable locations (airports & cities)" icon={Globe} action={null} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by code, city or name..." className="w-full pl-9 pr-3 py-2 border rounded-xl" />
            </div>
            <button onClick={() => load(filter)} className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="overflow-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-bold">Code</th>
                  <th className="text-left p-3 font-bold">Name</th>
                  <th className="text-left p-3 font-bold">City</th>
                  <th className="text-left p-3 font-bold">Type</th>
                  <th className="text-left p-3 font-bold">Country</th>
                  <th className="text-right p-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{l.iataCode || '-'}</td>
                    <td className="p-3">{l.name}</td>
                    <td className="p-3">{l.municipality}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.type === 'Airport' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{l.type || 'City'}</span></td>
                    <td className="p-3">{l.countryCode}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(l)} className="px-3 py-1.5 text-xs rounded-lg bg-orange-50 text-orange-700 font-bold mr-2"><Edit className="w-3 h-3 inline mr-1"/> Edit</button>
                      <button onClick={() => handleDelete(l.id)} className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 font-bold"><Trash2 className="w-3 h-3 inline mr-1"/> Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={6}>No locations</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50/50 rounded-2xl p-4 border">
          <h3 className="font-black mb-3 text-slate-900">{editingId ? 'Edit Location' : 'Add New Location'}</h3>
          <div className="space-y-3">
            <SelectField label="Type" value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} options={[{value: 'Airport', label: 'Airport'}, {value: 'city', label: 'Down Town / City'}]} />
            <InputField label="IATA/Code" value={form.iataCode} onChange={(e: any) => setForm({ ...form, iataCode: e.target.value })} placeholder={form.type === 'Airport' ? "e.g. AMM" : "Optional (e.g. AMMAN_DT)"} />
            <InputField label="Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Queen Alia Airport or Amman Down Town" />
            <InputField label="City" value={form.municipality} onChange={(e: any) => setForm({ ...form, municipality: e.target.value })} />
            <InputField label="Country Code" value={form.countryCode} onChange={(e: any) => setForm({ ...form, countryCode: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-sm disabled:opacity-50"><Save className="w-4 h-4 inline mr-1" /> Save</button>
              <button onClick={resetForm} className="px-4 py-2 rounded-xl bg-white border font-bold text-sm">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}</AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform transition-all duration-500 ease-in-out md:translate-x-0 md:static md:z-auto p-6 flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-10 px-2 flex items-center gap-3.5 py-6 border-b border-slate-50 relative group cursor-pointer">
            <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform duration-500">
                <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="font-black text-slate-900 text-xl tracking-tighter leading-none">HogiCar</h1>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational</span>
                </div>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
          <div className="px-4 mb-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Operations</div>
          <NavItem section="dashboard" label="Performance" icon={LayoutDashboard} />
          <NavItem section="suppliers" label="Supply Partners" icon={Building} />
          <NavItem section="supplierrequests" label="Requests" icon={MailQuestion} count={countSupplierRequests} />
          <NavItem section="bookings" label="Reservations" icon={Calendar} />
          <NavItem section="fleet" label="Active Fleet" icon={Car} />

          <div className="px-4 mb-3 mt-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Inventory</div>
          <NavItem section="promotions" label="Smart Offers" icon={Tag} />
          <NavItem section="carlibrary" label="Global Library" icon={Car} />
          <NavItem section="apipartners" label="Integrations" icon={Share2} />
          <NavItem section="affiliates" label="Affiliate Hub" icon={DollarSign} />

          <div className="px-4 mb-3 mt-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">System</div>
          <NavItem section="cms" label="Pages" icon={FileText} />
          <NavItem section="seo" label="SEO" icon={Globe} />
          <NavItem section="homepage" label="Assets" icon={ImageIcon} />
          <NavItem section="sitesettings" label="Config" icon={Settings} />
          <NavItem section="globallocations" label="Global Locations" icon={Globe} />
          <NavItem section="homepagelogos" label="Homepage Logos" icon={ImageIcon} />
          <NavItem section="searchinglogos" label="Searching Logos" icon={Search} />
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
  const [selectedLabel, setSelectedLabel] = useState(value || '');
  const timer = useRef<any>();

  useEffect(() => {
    if (value) setSelectedLabel(value);
  }, [value]);

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
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center"><RefreshCw className="w-4 h-4 animate-spin inline" /> Loading...</div>
          ) : (
            suggestions.map(loc => (
              <button key={loc.value} onClick={() => handleSelect(loc)} className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-0 transition-colors flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${loc.type === 'airport' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                    {loc.type === 'airport' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div>
                    <span className="font-bold text-slate-900 block text-xs">{loc.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{loc.iataCode || 'CITY LOCATION'}</span>
                </div>
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
  const [selectedLocations, setSelectedLocations] = useState<any[]>([]);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [customLocs, setCustomLocs] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateCredentials = async () => {
    if (!editedSupplier.name) return alert("Please enter company name first");
    if (editedSupplier.id && !window.confirm("This will overwrite the current login credentials. Continue?")) return;
    
    setIsGenerating(true);
    try {
      const resp = await adminFetch('/api/admin/suppliers/generate-credentials', {
        method: 'POST',
        body: JSON.stringify({ name: editedSupplier.name, email: editedSupplier.contactEmail })
      });
      setEditedSupplier(prev => ({ 
        ...prev, 
        email: resp.username, 
        password: resp.password 
      }));
      setShowPassword(true); // Automatically show the generated password
    } catch (e: any) {
      alert("Failed to generate credentials: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const BOOKING_MODE_OPTIONS = [
    { value: BookingMode.FREE_SALE, label: 'Free Sale (Instant)' },
    { value: BookingMode.ON_REQUEST, label: 'On Request (Manual)' }
  ];

  const COMMISSION_TYPE_OPTIONS = [
    { value: CommissionType.FULL_PREPAID, label: 'Full Prepaid' },
    { value: CommissionType.PARTIAL_PREPAID, label: 'Partial Prepaid' },
    { value: CommissionType.PAY_AT_DESK, label: 'Pay at Desk' }
  ];

  const PICKUP_TYPE_OPTIONS = [
    { value: PickupType.IN_TERMINAL, label: 'In Terminal' },
    { value: PickupType.MEET_AND_GREET, label: 'Meet & Greet' },
    { value: PickupType.SHUTTLE_BUS, label: 'Shuttle Bus' }
  ];

  useEffect(() => { const stored = localStorage.getItem('hogicar_custom_locations'); if (stored) setCustomLocs(JSON.parse(stored)); }, [isOpen]);
  useEffect(() => { 
    if (isOpen) { 
        setEditedSupplier(supplier || {}); 
        if (supplier?.locations && supplier.locations.length > 0) 
            setSelectedLocations(Array.isArray(supplier.locations) ? supplier.locations.map((l: any) => ({ label: l.displayName || l.location, value: l.locationCode })) : []);
        else if (supplier?.location && supplier?.locationCode)
            setSelectedLocations([{ label: supplier.location, value: supplier.locationCode }]);
        else 
            setSelectedLocations([]); 
    } 
  }, [supplier, isOpen]);

  const handleChange = (field: any, val: any) => setEditedSupplier(prev => ({ ...prev, [field]: val }));
  const handleLogo = async (e: any) => { 
    if (e.target.files?.[0]) { 
        try {
            const resized = await resizeImage(e.target.files[0], 800, 400);
            handleChange('logo', resized);
        } catch (err) {
            console.error("Failed to resize logo", err);
            const reader = new FileReader(); 
            reader.onloadend = () => handleChange('logo', reader.result); 
            reader.readAsDataURL(e.target.files[0]);
        }
    } 
  };
  
  const handleLocSelect = (loc: any) => { 
    if (loc && !selectedLocations.find(l => l.value === loc.value)) {
        setSelectedLocations(prev => [...prev, loc]);
    }
  };

  const removeLocation = (code: string) => {
    setSelectedLocations(prev => prev.filter(l => l.value !== code));
  };

  const handleCreateCustom = () => { 
    if (!newLocName) return alert("Enter name"); 
    let code = newLocCode.trim().toUpperCase() || newLocName.replace(/[^a-zA-Z0-9]/g, '').substring(0,6).toUpperCase(); 
    const newLoc = { label: newLocName, value: code }; 
    const updated = [...customLocs, newLoc]; 
    setCustomLocs(updated); 
    localStorage.setItem('hogicar_custom_locations', JSON.stringify(updated)); 
    handleLocSelect(newLoc); 
    setNewLocName(''); 
    setNewLocCode(''); 
  };

  const handleSave = () => { 
    if (!editedSupplier.name || !editedSupplier.contactEmail) return alert("Name and contact email required"); 
    if (selectedLocations.length === 0) return alert("Select at least one location"); 
    
    // Ensure booking mode and commission type are set if not present
    const finalEmail = editedSupplier.email || editedSupplier.contactEmail;
    const finalSupplier = {
        ...editedSupplier,
        email: finalEmail,
        locations: selectedLocations.map(l => ({ displayName: l.label, locationCode: l.value })),
        bookingMode: editedSupplier.bookingMode || BookingMode.FREE_SALE,
        commissionType: editedSupplier.commissionType || CommissionType.PARTIAL_PREPAID,
        commissionPercent: editedSupplier.commissionPercent || 0.15,
        pickupType: editedSupplier.pickupType || PickupType.IN_TERMINAL,
        includesCDW: editedSupplier.includesCDW ?? true,
        includesTP: editedSupplier.includesTP ?? true,
        gracePeriodHours: editedSupplier.gracePeriodHours ?? 0,
        minBookingLeadTime: editedSupplier.minBookingLeadTime ?? 0,
        logoScale: editedSupplier.logoScale ?? 100,
        logoScaleMobile: editedSupplier.logoScaleMobile ?? 100,
        oneWayFee: editedSupplier.oneWayFee ?? 0,
        connectionType: editedSupplier.connectionType || 'manual'
    };

    if (!finalSupplier.id) {
        finalSupplier.status = 'active';
        if (!finalSupplier.password) finalSupplier.password = 'changeMe123!';
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
            <div className="relative group w-48 h-32">
                {editedSupplier.logo || editedSupplier.logoUrl ? (
                    <img 
                        src={editedSupplier.logo || editedSupplier.logoUrl} 
                        className="w-full h-full rounded-2xl object-contain bg-white shadow-xl border-4 border-white" 
                        alt="Logo"
                        width={400}
                        height={200}
                    />
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
            <p className="text-[8px] text-gray-400 text-center leading-tight mt-1 max-w-[100px]">Auto-resized<br/>to high quality</p>
          </div>
          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Company Name" placeholder="e.g. HogiCar Global" value={editedSupplier.name || ''} onChange={(e: any) => handleChange('name', e.target.value)} />
                <InputField label="Reservation Email (For Requests)" placeholder="bookings@partner.com" value={editedSupplier.contactEmail || ''} onChange={(e: any) => handleChange('contactEmail', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Contact Phone" placeholder="+1 (555) 000-0000" value={editedSupplier.phone || ''} onChange={(e: any) => handleChange('phone', e.target.value)} />
                <div className="flex flex-col">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-2">Pickup Type</p>
                    <select 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none cursor-pointer"
                        value={editedSupplier.pickupType || PickupType.IN_TERMINAL}
                        onChange={(e) => handleChange('pickupType', e.target.value)}
                    >
                        {PICKUP_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <InputField label="Logo Scale (Desktop %)" type="number" value={editedSupplier.logoScale ?? 100} onChange={(e: any) => handleChange('logoScale', parseInt(e.target.value) || 0)} />
                <InputField label="Logo Scale (Mobile %)" type="number" value={editedSupplier.logoScaleMobile ?? 100} onChange={(e: any) => handleChange('logoScaleMobile', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Location & Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-700">Service Locations</h3>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Add New Location</label>
                        <LocationPicker value="" onChange={handleLocSelect} />
                    </div>
                    
                    {selectedLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {selectedLocations.map(loc => (
                                <div key={loc.value} className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-100 group">
                                    <span className="text-xs font-bold">{loc.label} <span className="text-orange-400">({loc.value})</span></span>
                                    <button onClick={() => removeLocation(loc.value)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-50">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">Or Create Custom Location</label>
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
                    <InputField label="Commission Value (%)" type="number" step="0.01" value={editedSupplier.commissionPercent || 0} onChange={e => handleChange('commissionPercent', parseFloat(e.target.value))} />
                    <SelectField label="Booking Policy" value={editedSupplier.bookingMode || ''} onChange={e => handleChange('bookingMode', e.target.value)} options={BOOKING_MODE_OPTIONS} />
                    <SelectField label="Pickup Type" value={editedSupplier.pickupType || PickupType.IN_TERMINAL} onChange={e => handleChange('pickupType', e.target.value)} options={PICKUP_TYPE_OPTIONS} />
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
                <InputField label="Max. Lead Time (Days)" type="number" value={editedSupplier.maxBookingLeadTimeDays || 0} onChange={e => handleChange('maxBookingLeadTimeDays', parseInt(e.target.value))} />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-purple-500" /> Rental Duration
                </h4>
                <InputField label="Min. Rental Days" type="number" value={editedSupplier.minRentalDays || 0} onChange={e => handleChange('minRentalDays', parseInt(e.target.value))} />
                <InputField label="Max. Rental Days" type="number" value={editedSupplier.maxRentalDays || 0} onChange={e => handleChange('maxRentalDays', parseInt(e.target.value))} />
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

        {/* Security & Access */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-xl">
                        <Lock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Access & Security</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Manage partner login identities and security protocols</p>
                    </div>
                </div>
                <button 
                    onClick={handleGenerateCredentials}
                    disabled={isGenerating}
                    className="text-[10px] font-black bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Auto-Generate Credentials'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <InputField 
                    label="Login Identity (Username/Email)" 
                    placeholder="admin@partner.com" 
                    value={editedSupplier.email || editedSupplier.contactEmail || ''} 
                    onChange={(e: any) => handleChange('email', e.target.value)} 
                />
                
                <div className="relative group/input">
                    <InputField 
                        label="Account Password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder={editedSupplier.id ? "••••••••" : "Set secure password"} 
                        value={editedSupplier.password || ''} 
                        onChange={(e: any) => handleChange('password', e.target.value)} 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[34px] text-gray-400 hover:text-orange-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={editedSupplier.enableSocialProof || false} onChange={e => handleChange('enableSocialProof', e.target.checked)} className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                    <span className="text-[11px] font-bold text-gray-600 group-hover:text-gray-900">Enable Partner Trust Badge</span>
                </label>
                {editedSupplier.password && (
                    <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-black uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Credentials Ready
                    </div>
                )}
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
  const handleApprove = (app: any) => { 
    const locationCode = app.primaryLocation.replace(/[^A-Z0-9]/g, '').substring(0,3).toUpperCase();
    const newSup: any = { 
        name: app.companyName, 
        contactEmail: app.email, 
        email: app.email, // Use request email as login email by default
        locations: [{ displayName: app.primaryLocation, locationCode: locationCode || 'LOC' }],
        connectionType: app.integrationType === 'api' ? 'api' : 'manual', 
        status: 'active', 
        commissionType: CommissionType.PARTIAL_PREPAID, 
        commissionValue: 0.15, 
        bookingMode: BookingMode.FREE_SALE, 
        password: app.companyName.toLowerCase().replace(/\s/g, '') + '123!' 
    }; 
    onApprove(newSup, app); 
  };
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
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
            <th className="px-6 py-4">Reference</th>
            <th className="px-6 py-4">Customer</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Route</th>
            <th className="px-6 py-4">Schedule</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {Array.isArray(bookings) && bookings.map((b: any) => (
            <tr key={b.id} className="hover:bg-orange-50/30 transition-colors group">
              <td className="px-6 py-4">
                <span className="font-mono text-[11px] font-black text-orange-600 bg-orange-50/50 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                    {b.bookingRef}
                </span>
              </td>
              <td className="px-6 py-4 text-[13px] font-black text-slate-900">
                {b.firstName} {b.lastName}
              </td>
              <td className="px-6 py-4 text-[12px] font-bold text-slate-500">
                {b.supplierName || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <span className="text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded-md border border-blue-100/50">{b.pickupCode}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-purple-600 bg-purple-50/50 px-1.5 py-0.5 rounded-md border border-purple-100/50">{b.dropoffCode}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
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
  const [duration, setDuration] = useState(5);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setDuration(data.searchingScreenDuration / 1000);
        setHeroImageUrl(data.heroImageUrl || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        searchingScreenDuration: duration * 1000,
        heroImageUrl: heroImageUrl
      })
    })
    .then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    })
    .catch(err => alert('Failed to save settings: ' + err.message));
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest text-xs">Loading Settings...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 bg-gray-50/30">
        <SectionHeader title="Site Configuration" icon={Settings} subtitle="Global behavior and design settings" />
      </div>
      <div className="p-8 space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Searching Screen Duration (seconds)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))} 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Homepage Hero Background Image URL</label>
          <input 
            type="text" 
            value={heroImageUrl} 
            onChange={e => setHeroImageUrl(e.target.value)} 
            placeholder="https://example.com/image.jpg"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none font-mono" 
          />
          <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Recommended size: 2000x1200px</p>
        </div>
        
        {heroImageUrl && (
          <div className="mt-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preview</label>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              <img src={heroImageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center gap-4">
          <button 
            onClick={handleSave} 
            className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Settings Saved Successfully
            </motion.span>
          )}
        </div>
      </div>
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
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Details</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Year</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Body Type</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.isArray(library) && library.map((m: any) => (
              <tr key={m.id} className="hover:bg-orange-50/30 transition-colors group">
                <td className="px-8 py-4">
                  <div className="w-16 h-10 rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-1 group-hover:border-orange-200 transition-colors">
                    <img src={m.image || m.imageUrl} className="max-w-full max-h-full object-contain" alt={m.model} width={400} height={250} />
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="text-[13px] font-black text-slate-900">{m.make}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{m.model}</div>
                </td>
                <td className="px-8 py-4 text-xs font-black text-slate-500">{m.year}</td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 rounded-lg border border-orange-100/50">
                    {formatEnum(m.category)}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 rounded-lg border border-blue-100/50">
                    {formatEnum(m.type)}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(m)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(m.id)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
                      <Trash2 className="w-3.5 h-3.5" />
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
                <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Provider Details</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Connectivity</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Metrics</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {suppliers.map((s: any) => (
                    <tr key={s.id} className="hover:bg-orange-50/30 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-2 group-hover:border-orange-200 transition-colors">
                                    <img src={s.logo || s.logoUrl} className="max-w-full max-h-full object-contain" onError={(e:any)=>e.target.src='https://via.placeholder.com/100?text=Logo'} alt="Logo" width={40} height={40}/>
                                </div>
                                <div>
                                    <div className="text-[13px] font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">{s.name}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{s.email || s.contactEmail}</div>
                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                                        <MapPin className="w-2.5 h-2.5" /> 
                                        {Array.isArray(s.locations) && s.locations.length > 0 
                                            ? s.locations.slice(0, 2).map((l:any) => l.displayName || l.locationCode).join(', ') + (s.locations.length > 2 ? '...' : '')
                                            : (s.location || 'Global')}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <Badge status={s.status || (s.active ? 'active' : 'inactive')}/>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${s.connectionType === 'api' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {s.connectionType === 'api' ? 'Active API' : 'Manual'}
                                </span>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-xs font-black text-slate-900">{MOCK_CARS.filter(c => c.supplier.id === s.id).length}</div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Fleet</div>
                                </div>
                                <div className="w-px h-6 bg-slate-100" />
                                <div className="text-center">
                                    <div className="text-xs font-black text-slate-900">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === s.id)).length}</div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Bookings</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => onManageApi(s)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm" title="API Settings">
                                    <Rss className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onEdit(s)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm" title="Edit Profile">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(s.id)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm" title="Terminate Partner">
                                    <Trash2 className="w-3.5 h-3.5" />
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
          {Array.isArray(cars) && cars.map((c: any) => (
            <tr key={c.id} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src={c.image} className="w-12 h-8 object-contain rounded bg-gray-100 border" alt={c.name} width={48} height={32} />
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
    imageUrl: '', 
    passengers: 5, 
    bags: 3, 
    doors: 4 
  });

  useEffect(() => { 
    if (carModel) {
      setModel({
        ...carModel,
        imageUrl: carModel.imageUrl || carModel.image
      });
    } 
  }, [carModel]);

  const handleChange = (field: string, val: any) => setModel({ ...model, [field]: val });

  const handleSave = () => { 
    if (!model.make || !model.model || !model.imageUrl) return alert("Required fields: Make, Model, and Image URL are required."); 
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
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Vehicle Representation (Image)</label>
        <div className="flex gap-4 items-start">
          <div className="w-40 h-28 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
            {model.imageUrl ? (
              <img src={model.imageUrl} className="max-w-full max-h-full object-contain" alt="Preview" width={400} height={250} />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-200" />
            )}
          </div>
          <div className="flex-grow space-y-4">
            <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Photo</label>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        accept="image/*" 
                        id="car-model-image-upload"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                try {
                                    const resized = await resizeImage(file, 1200, 800);
                                    handleChange('imageUrl', resized);
                                } catch (err) {
                                    console.error("Failed to resize car image", err);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        handleChange('imageUrl', reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }
                        }}
                        className="hidden"
                    />
                    <label 
                        htmlFor="car-model-image-upload"
                        className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl border border-orange-100 font-bold text-xs cursor-pointer hover:bg-orange-50 transition-colors shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Choose File
                    </label>
                    {model.imageUrl && (
                        <button 
                            type="button" 
                            onClick={() => handleChange('imageUrl', '')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-all bg-white shadow-sm"
                            title="Clear image"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            
            <InputField 
                label="Or Direct Image URL" 
                placeholder="https://..." 
                value={model.imageUrl?.startsWith('data:') ? 'Local Image (Base64)' : model.imageUrl || ''} 
                onChange={(e: any) => handleChange('imageUrl', e.target.value)} 
            />
          </div>
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
        locations: updatedSupplier.locations || [],
        commissionType: updatedSupplier.commissionType || CommissionType.PARTIAL_PREPAID,
        commissionPercent: updatedSupplier.commissionPercent || 0,
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
        rating: updatedSupplier.rating || 5.0,
        pickupType: updatedSupplier.pickupType,
        minRentalDays: updatedSupplier.minRentalDays,
        maxRentalDays: updatedSupplier.maxRentalDays,
        maxBookingLeadTimeDays: updatedSupplier.maxBookingLeadTimeDays,
        logoScale: updatedSupplier.logoScale || 100,
        logoScaleMobile: updatedSupplier.logoScaleMobile || 100
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

  const handleApproveSupplier = async (id: string) => { 
    const s = suppliers.find(s => s.id === id); 
    if (s) { 
        await handleSaveSupplier({ ...s, status: 'active' });
    } 
  };
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
            imageUrl: model.imageUrl || model.image, // Prefer updated imageUrl
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

// ==================== Homepage Logos ====================
const HomepageLogosContent = () => {
    const [logos, setLogos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLogo, setEditingLogo] = useState<any>(null);

    const fetchLogos = async () => {
        setLoading(true);
        try {
            const data = await adminFetch('/api/admin/homepage-logos');
            setLogos(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch logos', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogos(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this brand logo?')) return;
        try {
            await adminFetch(`/api/admin/homepage-logos/${id}`, { method: 'DELETE' });
            fetchLogos();
        } catch (e: any) {
            alert(`Delete failed: ${e.message}`);
        }
    };

    const handleSave = async (logo: any) => {
        try {
            const method = logo.id ? 'PUT' : 'POST';
            const url = logo.id ? `/api/admin/homepage-logos/${logo.id}` : '/api/admin/homepage-logos';
            await adminFetch(url, {
                method,
                body: JSON.stringify(logo)
            });
            fetchLogos();
            setEditingLogo(null);
        } catch (e: any) {
            alert(`Save failed: ${e.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <EditHomepageLogoModal 
                isOpen={!!editingLogo} 
                onClose={() => setEditingLogo(null)} 
                onSave={handleSave} 
                logo={editingLogo} 
            />
            
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-left">Homepage Branding</h2>
                        <p className="text-sm text-gray-500 font-medium text-left">Control global brands and trusted partners displayed on the landing page</p>
                    </div>
                    <button onClick={() => setEditingLogo({ name: '', logoUrl: '', displayOrder: logos.length + 1, scale: 100, mobileScale: 100, spacing: 24, active: true })} 
                        className="bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Add New Brand
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Preview</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Brand Name</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Order</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading brands...</td></tr>
                            ) : logos.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No brands configured yet</td></tr>
                            ) : logos.map((l: any) => (
                                <tr key={l.id} className="hover:bg-orange-50/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="w-20 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shadow-sm group-hover:border-orange-200 transition-colors">
                                            {l.logoUrl ? (
                                                <img src={l.logoUrl} alt={l.name} className="max-w-full max-h-full object-contain" width={100} height={50} />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-sm font-black text-slate-900">{l.name}</span></td>
                                    <td className="px-8 py-4"><span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{l.displayOrder}</span></td>
                                    <td className="px-8 py-4"><Badge status={l.active ? 'active' : 'inactive'} /></td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingLogo(l)} className="p-2 bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 rounded-xl transition-all"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                                        </div>
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

// ==================== Searching Page Logos ====================
const SearchingLogosContent = () => {
    const [logos, setLogos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLogo, setEditingLogo] = useState<any>(null);

    const fetchLogos = async () => {
        setLoading(true);
        try {
            console.log("[DEBUG] Fetching searching logos...");
            const data = await adminFetch(`/api/admin/searching-logos?t=${Date.now()}`);
            console.log("[DEBUG] Fetched searching logos raw data:", data);
            const logosArray = Array.isArray(data) ? data : [];
            console.log("[DEBUG] Setting searching logos state. Count:", logosArray.length);
            setLogos(logosArray);
        } catch (e: any) {
            console.error('[DEBUG] Failed to fetch searching logos', e);
            alert(`Failed to load branding logos: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogos(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this searching logo?')) return;
        try {
            await adminFetch(`/api/admin/searching-logos/${id}`, { method: 'DELETE' });
            await fetchLogos();
            alert('Branding logo removed successfully!');
        } catch (e: any) {
            alert(`Delete failed: ${e.message}`);
        }
    };

    const handleSave = async (logo: any) => {
        setLoading(true);
        try {
            console.log("[DEBUG] Initiating save searching logo:", logo);
            const isNew = !logo.id;
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew ? '/api/admin/searching-logos' : `/api/admin/searching-logos/${logo.id}`;
            
            console.log(`[DEBUG] Calling ${method} ${url}`);
            const saved = await adminFetch(url, {
                method,
                body: JSON.stringify(logo)
            });
            console.log("[DEBUG] Saved searching logo response:", saved);
            
            await fetchLogos();
            setEditingLogo(null);
            alert(isNew ? 'New branding logo added successfully!' : 'Branding logo updated successfully!');
        } catch (e: any) {
            console.error('[DEBUG] Save operation failed:', e);
            alert(`Save failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <EditSearchingLogoModal 
                isOpen={!!editingLogo} 
                onClose={() => setEditingLogo(null)} 
                onSave={handleSave} 
                logo={editingLogo} 
                loading={loading}
            />
            
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-left">Searching Page Branding</h2>
                        <p className="text-sm text-gray-500 font-medium text-left">Manage logos displayed during the scanning animation for specific locations</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchLogos} disabled={loading} className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setEditingLogo({ name: '', logoUrl: '', locationCodes: [], displayOrder: logos.length + 1, scale: 100, mobileScale: 100, spacing: 24, active: true })} 
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                            <PlusCircle className="w-5 h-5" />
                            Add New Searching Logo
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Preview</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Name</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Order</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading logos...</td></tr>
                            ) : logos.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold">No searching logos configured yet</td></tr>
                            ) : logos.map((l: any) => (
                                <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="w-20 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shadow-sm group-hover:border-blue-200 transition-colors">
                                            {l.logoUrl ? (
                                                <img src={l.logoUrl} alt={l.name} className="max-w-full max-h-full object-contain" width={100} height={50} />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-sm font-black text-slate-900">{l.name}</span></td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {Array.isArray(l.locationCodes) && l.locationCodes.length > 0 ? (
                                                l.locationCodes.map((code: string) => (
                                                    <span key={code} className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                                                        {code}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-tighter">GLOBAL</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{l.displayOrder}</span></td>
                                    <td className="px-8 py-4"><Badge status={l.active ? 'active' : 'inactive'} /></td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingLogo(l)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-xl transition-all"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                                        </div>
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

const EditSearchingLogoModal = ({ isOpen, onClose, onSave, logo, loading }: any) => {
    const [formData, setFormData] = useState<any>(logo || {});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (logo) setFormData(logo); }, [logo]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await resizeImage(file, 800, 400);
                setFormData({ ...formData, logoUrl: base64 });
            } catch (err) {
                alert('Failed to process image');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={logo?.id ? 'Edit Searching Logo' : 'Add New Searching Logo'} size="md">
            <div className="space-y-6">
                <InputField label="Name / Brand" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Local Jordan Partner" />
                
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Logo Image</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <InputField value={formData.logoUrl} onChange={(e: any) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="Paste direct image URL or upload →" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl transition-colors flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200">
                            <ImageIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {formData.logoUrl && (
                        <div className="mt-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-center">
                            <img src={formData.logoUrl} alt="Preview" className="max-h-24 object-contain drop-shadow-sm" width={200} height={100} />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Target Locations (IATA/City)</label>
                    <LocationPicker 
                        onChange={(loc: any) => {
                            if (!loc) return;
                            const code = loc.iataCode || loc.value;
                            const currentCodes = Array.isArray(formData.locationCodes) ? formData.locationCodes : [];
                            if (!currentCodes.includes(code)) {
                                setFormData({ ...formData, locationCodes: [...currentCodes, code] });
                            }
                        }} 
                        placeholder="Search to add location..." 
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px] items-center">
                        {(!Array.isArray(formData.locationCodes) || formData.locationCodes.length === 0) && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-slate-100">Global (All Locations)</span>
                        )}
                        {Array.isArray(formData.locationCodes) && formData.locationCodes.map((code: string) => (
                            <span key={code} className="bg-blue-50 text-blue-700 pl-3 pr-2 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-blue-100 group">
                                {code}
                                <button 
                                    onClick={() => setFormData({ ...formData, locationCodes: formData.locationCodes.filter((c: string) => c !== code) })} 
                                    className="p-1 rounded-lg hover:bg-blue-200/50 text-blue-400 hover:text-blue-800 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Add multiple locations. If empty, this logo will appear everywhere as a global partner.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Display Order" type="number" value={formData.displayOrder ?? 0} onChange={(e: any) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
                    <InputField label="Scale (Desktop %)" type="number" value={formData.scale ?? 100} onChange={(e: any) => setFormData({ ...formData, scale: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Scale (Mobile %)" type="number" value={formData.mobileScale ?? 100} onChange={(e: any) => setFormData({ ...formData, mobileScale: parseInt(e.target.value) || 0 })} />
                    <InputField label="Spacing (px)" type="number" value={formData.spacing ?? 24} onChange={(e: any) => setFormData({ ...formData, spacing: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Status</label>
                    <select 
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} type="button" className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button 
                        onClick={() => { 
                            if (!formData.name?.trim()) { alert('Please provide a name/brand'); return; }
                            if (!formData.logoUrl?.trim()) { alert('Please provide a logo URL or upload an image'); return; }
                            
                            const payload = {
                                ...formData,
                                displayOrder: Number(formData.displayOrder) || 0,
                                scale: Number(formData.scale) || 100,
                                mobileScale: Number(formData.mobileScale) || 100,
                                spacing: Number(formData.spacing) || 24,
                                locationCodes: Array.isArray(formData.locationCodes) ? formData.locationCodes : []
                            };
                            onSave(payload); 
                        }} 
                        type="button"
                        disabled={loading}
                        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Processing...' : (logo?.id ? 'Update Branding' : 'Add Branding')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const EditHomepageLogoModal = ({ isOpen, onClose, onSave, logo }: any) => {
    const [formData, setFormData] = useState<any>(logo || {});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (logo) setFormData(logo); }, [logo]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await resizeImage(file, 800, 400);
                setFormData({ ...formData, logoUrl: base64 });
            } catch (err) {
                alert('Failed to process image');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={logo?.id ? 'Edit Brand Logo' : 'Add New Brand Logo'} size="md">
            <div className="space-y-6">
                <InputField label="Brand Name" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Hertz, Avis, Local Partner" />
                
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Brand Logo</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <InputField value={formData.logoUrl} onChange={(e: any) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="Paste direct image URL or upload →" />
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                <span>Recommended: 400x200px, Transparent PNG</span>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl transition-colors flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200">
                            <ImageIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {formData.logoUrl && (
                        <div className="mt-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-center">
                            <img src={formData.logoUrl} alt="Preview" className="max-h-24 object-contain drop-shadow-sm" width={200} height={100} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Display Order" type="number" value={formData.displayOrder ?? 0} onChange={(e: any) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
                    <InputField label="Scale (Desktop %)" type="number" value={formData.scale ?? 100} onChange={(e: any) => setFormData({ ...formData, scale: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Scale (Mobile %)" type="number" value={formData.mobileScale ?? 100} onChange={(e: any) => setFormData({ ...formData, mobileScale: parseInt(e.target.value) || 0 })} />
                    <InputField label="Spacing (px)" type="number" value={formData.spacing ?? 24} onChange={(e: any) => setFormData({ ...formData, spacing: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Status</label>
                    <select 
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer"
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-orange-600 shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all">Save Changes</button>
                </div>
            </div>
        </Modal>
    );
};

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
      case 'globallocations': return <GlobalLocationsContent />;
      case 'homepagelogos': return <HomepageLogosContent />;
      case 'searchinglogos': return <SearchingLogosContent />;
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

      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 flex gap-0 md:gap-8">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} countSupplierRequests={pendingCount} />
        
        <main className="flex-grow min-w-0">
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
                <LayoutDashboard className="w-3 h-3" />
                <span>System / {activeSection}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight leading-none">
                {activeSection === 'dashboard' ? 'Market Overview' : activeSection}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {['dashboard', 'bookings', 'fleet'].includes(activeSection) && (
                <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100 hover:border-orange-200 transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-orange-600 border border-slate-50">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col pr-3">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Supplier Node</span>
                    <select 
                        className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer"
                        value={selectedSupplierId || ''}
                        onChange={(e) => setSelectedSupplierId(e.target.value || null)}
                    >
                        <option value="">All Regions</option>
                        {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3.5 pl-5 border-l border-slate-100">
                 <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg font-black text-sm cursor-pointer"
                 >
                    AD
                 </motion.div>
                 <div className="hidden xl:block">
                    <p className="text-xs font-black text-slate-900 leading-none">Root Auth</p>
                    <div className="flex items-center gap-1 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Tier 1</p>
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
