import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Building, Calendar, 
  Save, Plus, Trash2, Edit, ChevronDown, ChevronUp, DollarSign, 
  Settings, AlertCircle, CheckCircle, Shield, TrendingUp, 
  MailQuestion, Rss, Link2, XCircle, RefreshCw, Copy, Share2, 
  Power, Tag, ImageIcon, PlusCircle, LoaderCircle, FileText, Globe, 
  Users, Search, Loader
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
  RateTier, FeatureItem, StepItem, FaqItem
} from '../../types';

type Section = 'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 
                'carlibrary' | 'apipartners' | 'affiliates' | 'cms' | 'seo' | 
                'homepage' | 'sitesettings' | 'promotions';

// ==================== UI Components ====================
const StatCard = ({ icon: Icon, title, value, change, color = 'orange' }: any) => {
  const colors: any = { orange: 'bg-orange-100 text-orange-600', blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600' };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{change}</span>}
      </div>
      <div className="mt-4"><p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p><p className="text-2xl font-bold text-gray-800 mt-1">{value}</p></div>
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

// ==================== Sidebar (unchanged but compact) ====================
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
          <div className="p-6 border-b border-white/10"><div className="flex items-center gap-3"><Logo className="w-10 h-10" variant="light" /><div><h1 className="font-bold text-white text-xl">HogiCar</h1><p className="text-xs text-gray-400">Admin Portal</p></div></div></div>
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
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin-login'); }} className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl"><LogOut className="w-5 h-5 mr-3" /><span>Logout</span></motion.button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== Location Picker (unchanged) ====================
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

// ==================== Edit Supplier Modal (with enhanced fields) ====================
const EditSupplierModal = ({ supplier, isOpen, onClose, onSave }: any) => {
  const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [customLocs, setCustomLocs] = useState<any[]>([]);
  useEffect(() => { const stored = localStorage.getItem('hogicar_custom_locations'); if (stored) setCustomLocs(JSON.parse(stored)); }, [isOpen]);
  useEffect(() => { if (isOpen) { setEditedSupplier(supplier || {}); if (supplier?.locationCode && supplier?.location) setSelectedLocation({ label: supplier.location, value: supplier.locationCode }); else setSelectedLocation(null); } }, [supplier, isOpen]);
  const handleChange = (field: any, val: any) => setEditedSupplier(prev => ({ ...prev, [field]: val }));
  const handleLogo = (e: any) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => handleChange('logo', reader.result); reader.readAsDataURL(e.target.files[0]); } };
  const handleLocSelect = (loc: any) => { setSelectedLocation(loc); if (loc) { handleChange('locationCode', loc.value); handleChange('location', loc.label); } else { handleChange('locationCode', ''); handleChange('location', ''); } };
  const handleCreateCustom = () => { if (!newLocName) return alert("Enter name"); let code = newLocCode.trim().toUpperCase() || newLocName.replace(/[^a-zA-Z0-9]/g, '').substring(0,6).toUpperCase(); const newLoc = { label: newLocName, value: code }; const updated = [...customLocs, newLoc]; setCustomLocs(updated); localStorage.setItem('hogicar_custom_locations', JSON.stringify(updated)); handleLocSelect(newLoc); setNewLocName(''); setNewLocCode(''); };
  const handleSave = () => { if (!editedSupplier.name || !editedSupplier.contactEmail) return alert("Name and email required"); if (!selectedLocation) return alert("Select location"); if (!editedSupplier.id) editedSupplier.status = 'active'; onSave(editedSupplier); };
  if (!isOpen) return null;
  const allLocs = [...customLocs];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier?.id ? 'Edit Supplier' : 'Add Supplier'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-xs font-bold">Logo</label><div className="mt-1 flex flex-col items-center">{editedSupplier.logo ? <img src={editedSupplier.logo} className="w-20 h-20 rounded-full border" /> : <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center"><ImageIcon className="w-8 h-8"/></div>}<label className="text-xs text-orange-600 cursor-pointer">Upload<input type="file" className="hidden" accept="image/*" onChange={handleLogo}/></label></div></div>
          <div className="col-span-2"><InputField label="Company Name" value={editedSupplier.name || ''} onChange={e => handleChange('name', e.target.value)} /><InputField label="Contact Email" value={editedSupplier.contactEmail || ''} onChange={e => handleChange('contactEmail', e.target.value)} /></div>
        </div>
        <div><label className="text-xs font-bold">Location</label><LocationPicker value={selectedLocation?.value || ''} onChange={handleLocSelect} /></div>
        <div className="border-t pt-2"><p className="text-xs font-bold">Or create new location</p><div className="grid grid-cols-2 gap-2 mt-1"><InputField placeholder="Name" value={newLocName} onChange={e => setNewLocName(e.target.value)} /><InputField placeholder="Code (optional)" value={newLocCode} onChange={e => setNewLocCode(e.target.value.toUpperCase())} /></div><button onClick={handleCreateCustom} className="mt-1 text-xs bg-gray-600 text-white px-2 py-1 rounded">Create & Select</button></div>
        <div className="grid grid-cols-3 gap-2"><SelectField label="Commission Type" value={editedSupplier.commissionType || ''} onChange={e => handleChange('commissionType', e.target.value)} options={Object.values(CommissionType).map(v => ({ value: v, label: v }))} /><InputField label="Commission Value" type="number" value={editedSupplier.commissionValue || 0} onChange={e => handleChange('commissionValue', parseFloat(e.target.value))} /><SelectField label="Booking Mode" value={editedSupplier.bookingMode || ''} onChange={e => handleChange('bookingMode', e.target.value)} options={Object.values(BookingMode).map(v => ({ value: v, label: v }))} /></div>
        <div><label className="flex items-center"><input type="checkbox" checked={editedSupplier.enableSocialProof || false} onChange={e => handleChange('enableSocialProof', e.target.checked)} className="mr-2" />Enable social proof</label></div>
        <div className="grid grid-cols-2 gap-2"><InputField label="Username" value={editedSupplier.username || ''} onChange={e => handleChange('username', e.target.value)} /><InputField label="Password" type="password" value={editedSupplier.password || ''} onChange={e => handleChange('password', e.target.value)} /></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-3 py-1 text-gray-600">Cancel</button><button onClick={handleSave} className="px-3 py-1 bg-orange-600 text-white rounded">Save</button></div>
      </div>
    </Modal>
  );
};

// ==================== Supplier Requests (fixed table) ====================
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

// ==================== Bookings (fixed table) ====================
const BookingsContent = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <SectionHeader title="Bookings" icon={Calendar} />
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-xs">
            <th className="p-2">Ref</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Pickup</th>
            <th className="p-2">Dropoff</th>
            <th className="p-2">Dates</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_BOOKINGS.map((b: any) => (
            <tr key={b.id} className="hover:bg-orange-50">
              <td className="p-2 font-mono text-xs">{b.bookingRef}</td>
              <td className="p-2">{b.firstName} {b.lastName}</td>
              <td className="p-2">{b.pickupCode}</td>
              <td className="p-2">{b.dropoffCode}</td>
              <td className="p-2 text-xs">{b.pickupDate} → {b.dropoffDate}</td>
              <td className="p-2"><Badge status={b.status}/></td>
            </tr>
          ))}
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

// ==================== Homepage (simplified but working) ====================
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

// ==================== Car Library ====================
const CarLibraryContent = ({ library, onEdit, onDelete }: any) => {
  useEffect(() => {
    if (library.length === 0) {
      const defaultModels = [
        { id: '1', make: 'Toyota', model: 'Corolla', year: 2023, category: 'ECONOMY', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2018/03/13/19/09/toyota-3223474_1280.png', passengers: 5, bags: 2, doors: 4 },
        { id: '2', make: 'Honda', model: 'Civic', year: 2023, category: 'ECONOMY', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2015/09/02/12/43/honda-918522_1280.jpg', passengers: 5, bags: 2, doors: 4 },
        { id: '3', make: 'BMW', model: '3 Series', year: 2023, category: 'PREMIUM', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2020/05/23/11/58/bmw-5210777_1280.jpg', passengers: 5, bags: 3, doors: 4 },
        { id: '4', make: 'Mercedes', model: 'C-Class', year: 2023, category: 'PREMIUM', type: 'SEDAN', image: 'https://cdn.pixabay.com/photo/2017/12/22/18/31/mercedes-benz-3034659_1280.jpg', passengers: 5, bags: 3, doors: 4 },
      ];
      defaultModels.forEach(m => saveCarModel(m));
    }
  }, []);
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between"><SectionHeader title="Car Library" icon={Car} /><button onClick={() => onEdit(null)} className="bg-orange-600 text-white px-3 py-1 rounded text-sm">Add Model</button></div>
      <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th>Image</th><th>Make/Model</th><th>Year</th><th>Category</th><th>Type</th><th></th></tr></thead><tbody>{library.map((m: any) => (<tr key={m.id} className="hover:bg-orange-50"><td className="p-2"><img src={m.image} className="w-12 h-8 object-cover rounded"/></td><td className="p-2 font-bold">{m.make} {m.model}</td><td className="p-2">{m.year}</td><td className="p-2">{m.category}</td><td className="p-2">{m.type}</td><td className="p-2 text-right"><button onClick={() => onEdit(m)} className="bg-gray-100 p-1 rounded mr-1"><Edit className="w-4 h-4"/></button><button onClick={() => onDelete(m.id)} className="bg-red-100 p-1 rounded"><Trash2 className="w-4 h-4 text-red-600"/></button></td></tr>))}</tbody></table></div>
    </div>
  );
};

// ==================== Suppliers Content ====================
const SuppliersContent = ({ suppliers, onEdit, onApprove, onManageApi, onAddSupplier, onRefresh, onDelete }: any) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex justify-between mb-4"><SectionHeader title="Suppliers" icon={Building} /><div className="flex gap-2"><button onClick={onRefresh} className="bg-gray-100 px-3 py-1 rounded text-sm">Refresh</button><button onClick={onAddSupplier} className="bg-orange-600 text-white px-3 py-1 rounded text-sm">Add Supplier</button></div></div>
    <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th>Supplier</th><th>Status</th><th>Connection</th><th>Fleet</th><th>Bookings</th><th className="text-right">Actions</th></tr></thead><tbody>{suppliers.map((s: any) => (<tr key={s.id} className="hover:bg-orange-50"><td className="p-2 flex items-center gap-2"><img src={s.logo} className="w-6 h-6 rounded-full"/><div><div className="font-bold">{s.name}</div><div className="text-xs text-gray-500">{s.location}</div></div></td><td className="p-2"><Badge status={s.status || 'active'}/></td><td className="p-2"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{s.connectionType === 'api' ? 'API' : 'Manual'}</span></td><td className="p-2">{MOCK_CARS.filter(c => c.supplier.id === s.id).length}</td><td className="p-2">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === s.id)).length}</td><td className="p-2 text-right"><div className="flex justify-end gap-1"><button onClick={() => onManageApi(s)} className="p-1 bg-gray-100 rounded"><Rss className="w-4 h-4"/></button><button onClick={() => onEdit(s)} className="p-1 bg-gray-100 rounded"><Edit className="w-4 h-4"/></button><button onClick={() => onDelete(s.id)} className="p-1 bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600"/></button></div></td></tr>))}</tbody></table></div>
  </div>
);

// ==================== Dashboard ====================
const DashboardContent = ({ stats, pendingCount }: any) => (
  <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><StatCard icon={DollarSign} title="Revenue" value="$1.2M" change="+15%" /><StatCard icon={Calendar} title="Bookings" value={MOCK_BOOKINGS.length} color="blue" /><StatCard icon={Building} title="Active Suppliers" value={`${stats.activeSuppliers} / ${stats.totalSuppliers}`} color="green" /><StatCard icon={AlertCircle} title="Pending Actions" value={pendingCount} color="purple" /></div><div className="bg-white rounded-2xl shadow-lg p-6"><h3 className="font-bold mb-4">Monthly Revenue</h3><ResponsiveContainer width="100%" height={300}><AreaChart data={ADMIN_STATS}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div></div>
);

// ==================== Placeholder sections ====================
const FleetContent = () => <div className="bg-white rounded-2xl shadow-lg p-6"><SectionHeader title="Fleet" icon={Car} /><div className="text-center py-10 text-gray-400">Coming soon</div></div>;
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
  const [model, setModel] = useState<any>(carModel || { make: '', model: '', year: new Date().getFullYear(), category: 'ECONOMY', type: 'SEDAN', image: '', passengers: 4, bags: 2, doors: 4 });
  useEffect(() => { if (carModel) setModel(carModel); }, [carModel]);
  const handleChange = (field: string, val: any) => setModel({ ...model, [field]: val });
  const handleImage = (e: any) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => handleChange('image', reader.result); reader.readAsDataURL(e.target.files[0]); } };
  const handleSave = () => { if (!model.make || !model.model || !model.image) return alert("Required fields"); onSave(model); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={carModel ? 'Edit Car' : 'Add Car'}><div className="grid grid-cols-2 gap-2"><InputField label="Make" value={model.make} onChange={e => handleChange('make', e.target.value)} /><InputField label="Model" value={model.model} onChange={e => handleChange('model', e.target.value)} /><InputField label="Year" type="number" value={model.year} onChange={e => handleChange('year', parseInt(e.target.value))} /><SelectField label="Category" value={model.category} onChange={e => handleChange('category', e.target.value)} options={Object.values(CarCategory).map(v => ({ value: v, label: v }))} /><SelectField label="Type" value={model.type} onChange={e => handleChange('type', e.target.value)} options={Object.values(VehicleType).map(v => ({ value: v, label: v }))} /><InputField label="Passengers" type="number" value={model.passengers} onChange={e => handleChange('passengers', parseInt(e.target.value))} /><InputField label="Bags" type="number" value={model.bags} onChange={e => handleChange('bags', parseInt(e.target.value))} /><InputField label="Doors" type="number" value={model.doors} onChange={e => handleChange('doors', parseInt(e.target.value))} /></div><div className="mt-2"><label>Image</label><div className="flex gap-2 items-center">{model.image && <img src={model.image} className="w-20 h-12 object-cover rounded"/>}<label className="bg-gray-100 px-3 py-1 rounded cursor-pointer">Upload<input type="file" className="hidden" accept="image/*" onChange={handleImage}/></label></div></div><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-orange-600 text-white px-3 py-1 rounded">Save</button></div></Modal>);
};
const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: any) => null;
const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: any) => null;

// ==================== Main AdminDashboard ====================
export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierApps, setSupplierApps] = useState(MOCK_SUPPLIER_APPLICATIONS);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [approvingApplication, setApprovingApplication] = useState<any>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiPartners, setApiPartners] = useState(MOCK_API_PARTNERS);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isSeoEditorOpen, setIsSeoEditorOpen] = useState(false);
  const [editingSeoConfig, setEditingSeoConfig] = useState<any>(null);
  const [carLibrary, setCarLibrary] = useState(MOCK_CAR_LIBRARY);
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
      const token = localStorage.getItem('adminToken');
      if (!token) { setSuppliers([]); return; }
      const res = await fetch('https://hogicar-backend.onrender.com/api/admin/suppliers', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSuppliers(await res.json());
      else setSuppliers([]);
    } catch (e) { setSuppliers([]); } finally { setLoadingSuppliers(false); }
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
          password_confirmation: updatedSupplier.password || "defaultPassword123",
          plainPassword: updatedSupplier.password || "defaultPassword123"   // extra field for some backends
        };
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No token');
        const res = await fetch('https://hogicar-backend.onrender.com/api/admin/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        alert("Supplier created successfully");
        await fetchSuppliers();
      } else {
        addMockSupplier(updatedSupplier);
        setSuppliers([...SUPPLIERS]);
      }
      setEditingSupplier(null);
      if (approvingApplication) { removeSupplierApplication(approvingApplication.id); setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]); setApprovingApplication(null); }
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Delete supplier?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No token');
      const res = await fetch(`https://hogicar-backend.onrender.com/api/admin/suppliers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      alert('Deleted');
      await fetchSuppliers();
    } catch (err: any) { alert(`Delete failed: ${err.message}`); }
  };

  const handleApproveSupplier = (id: string) => { const s = suppliers.find(s => s.id === id); if (s) { s.status = 'active'; setSuppliers([...suppliers]); } };
  const handleSaveApiConnection = (updated: Supplier) => { handleSaveSupplier(updated); setIsApiModalOpen(false); setEditingSupplier(null); };
  const handleCreateApiPartner = (name: string) => { if (!name) return; addMockApiPartner(name); setApiPartners([...MOCK_API_PARTNERS]); };
  const handleToggleApiPartnerStatus = (id: string, status: any) => { updateApiPartnerStatus(id, status); setApiPartners([...MOCK_API_PARTNERS]); };
  const handleSaveCarModel = (model: any) => { saveCarModel(model); setCarLibrary([...MOCK_CAR_LIBRARY]); setIsCarModelModalOpen(false); setEditingCarModel(null); };
  const handleDeleteCarModel = (id: string) => { if (confirm('Delete car model?')) { deleteCarModel(id); setCarLibrary([...MOCK_CAR_LIBRARY]); } };
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
      case 'dashboard': return <DashboardContent stats={stats} pendingCount={pendingCount} />;
      case 'suppliers': return <SuppliersContent suppliers={suppliers} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(s: any) => { setEditingSupplier(s); setIsApiModalOpen(true); }} onAddSupplier={() => setEditingSupplier({})} onRefresh={fetchSuppliers} onDelete={handleDeleteSupplier} />;
      case 'supplierrequests': return <SupplierRequestsContent apps={supplierApps} onApprove={handleApproveApplication} onReject={handleRejectApplication} />;
      case 'bookings': return <BookingsContent />;
      case 'fleet': return <FleetContent />;
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
    <div className="min-h-screen bg-gray-50">
      <EditSupplierModal isOpen={!!editingSupplier} onClose={() => setEditingSupplier(null)} onSave={handleSaveSupplier} supplier={editingSupplier} />
      {editingSupplier && isApiModalOpen && <ApiConnectionModal supplier={editingSupplier} isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSave={handleSaveApiConnection} />}
      {isPageEditorOpen && <PageEditorModal page={editingPage} isOpen={isPageEditorOpen} onClose={() => setIsPageEditorOpen(false)} />}
      {isSeoEditorOpen && <SEOEditorModal config={editingSeoConfig} isOpen={isSeoEditorOpen} onClose={() => setIsSeoEditorOpen(false)} />}
      {isCarModelModalOpen && <EditCarModelModal carModel={editingCarModel} isOpen={isCarModelModalOpen} onClose={() => setIsCarModelModalOpen(false)} onSave={handleSaveCarModel} />}
      {managingPromosForCar && <AdminPromotionModal car={managingPromosForCar} isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} onSave={handleSavePromotion} onDeleteTier={handleDeleteTier} />}
      <div className="md:hidden bg-white border-b px-4 py-3 flex justify-between sticky top-0 z-20"><div className="flex items-center gap-2"><Shield className="w-6 h-6 text-orange-600"/><span className="font-bold">Admin Panel</span></div><button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu/></button></div>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex"><Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} countSupplierRequests={pendingCount} /><main className="flex-grow lg:pl-8"><AnimatePresence mode="wait"><motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>{renderContent()}</motion.div></AnimatePresence></main></div>
    </div>
  );
};
