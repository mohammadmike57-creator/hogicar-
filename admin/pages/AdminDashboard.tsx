import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Users, MapPin, User, 
  Calendar, Download, Upload, Save, Plus, Trash2, Edit, 
  ChevronDown, ChevronUp, DollarSign, Settings, AlertCircle, 
  CheckCircle, Shield, BarChart3, TrendingUp, Package,
  Clock, History, Zap, Gift, FileText, PieChart, Activity, 
  Percent, Coins, Award, Star, Bell, Moon, Sun, Home,
  Briefcase, Truck, CreditCard, Globe, Lock, Key, Building,
  Rss, Link2, XCircle, RefreshCw, Copy, Share2, Power, Code,
  Mail, MailQuestion, CheckSquare, XSquare, Tag, ImageIcon,
  PlusCircle, Monitor, Tablet, Smartphone, Expand, PowerOff,
  LoaderCircle, Filter, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Logo } from '../../components/Logo';
import { adminApi } from '../../api';
import { 
  ADMIN_STATS, SUPPLIERS, MOCK_BOOKINGS, addMockSupplier, processSupplierXmlUpdate, 
  MOCK_API_PARTNERS, addMockApiPartner, updateApiPartnerStatus, MOCK_CARS, 
  MOCK_PAGES, updatePage, MOCK_SEO_CONFIGS, updateSeoConfig, MOCK_HOMEPAGE_CONTENT, 
  updateHomepageContent, MOCK_APP_CONFIG, updateAppConfig, MOCK_CAR_LIBRARY, 
  saveCarModel, deleteCarModel, MOCK_AFFILIATES, updateAffiliateStatus, 
  updateAffiliateCommissionRate, MOCK_SUPPLIER_APPLICATIONS, removeSupplierApplication, 
  MOCK_CATEGORY_IMAGES, updateCategoryImages, calculatePrice, addPromoCode, 
  MOCK_PROMO_CODES, updatePromoCodeStatus, deletePromoCode 
} from '../../services/mockData';
import { 
  Supplier, CommissionType, BookingMode, ApiConnection, ApiPartner, PageContent, 
  SEOConfig, HomepageContent, FeatureItem, StepItem, ValuePropositionItem, 
  DestinationItem, FaqItem, CarModel, CarCategory, CarType as VehicleType, Affiliate, 
  SupplierApplication, Car as CarType, RateTier, RateByDay, PromoCode 
} from '../../types';

// ==================== Types ====================
type Section = 'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 
                'carlibrary' | 'apipartners' | 'affiliates' | 'cms' | 'seo' | 
                'homepage' | 'sitesettings' | 'promotions';

// ==================== UI Components (reusable) ====================

const StatCard = ({ icon: Icon, title, value, change, color = 'orange' }: { icon: React.ElementType; title: string; value: string | number; change?: string; color?: string }) => {
  const colorClasses: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
    >
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

const SectionHeader = ({ title, subtitle, icon: Icon, action }: { title: string; subtitle?: string; icon?: React.ElementType; action?: React.ReactNode }) => (
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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <LoaderCircle className="w-8 h-8 animate-spin text-orange-600" />
  </div>
);

const EmptyState = ({ message, icon: Icon = AlertCircle }: { message: string; icon?: React.ElementType }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
    <Icon className="w-16 h-16 text-gray-300 mb-4" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

const InputField = ({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <input {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition`} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const SelectField = ({ label, options, error, ...props }: { label: string; options: { value: string; label: string }[]; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <select {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const TextAreaField = ({ label, error, ...props }: { label: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <textarea {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition min-h-[100px]`} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  if (!isOpen) return null;
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
};

// ==================== Sidebar Component ====================
const Sidebar = ({ activeSection, setActiveSection, isOpen, setIsOpen, countSupplierRequests }: any) => {
  const navigate = useNavigate();
  
  const NavItem = ({ section, label, icon: Icon, count }: { section: Section; label: string; icon: React.ElementType; count?: number }) => {
    const active = activeSection === section;
    return (
      <motion.button
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setActiveSection(section); setIsOpen(false); }}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all ${
          active
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {count !== undefined && count > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" variant="light" />
              <div>
                <h1 className="font-bold text-white text-xl">HogiCar</h1>
                <p className="text-xs text-gray-400">Admin Portal</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/80">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Admin Access</span>
              </div>
            </div>
          </div>

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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                localStorage.removeItem('adminToken');
                navigate('/admin-login');
              }}
              className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== Modals (styling updated) ====================

interface SupplierRowProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onApprove: (id: string) => void;
  onManageApi: (supplier: Supplier) => void;
}

const EditSupplierModal = ({ supplier, isOpen, onClose, onSave }: { supplier: Supplier | null, isOpen: boolean, onClose: () => void, onSave: (s: Supplier) => void }) => {
    const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
    const [locations, setLocations] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setEditedSupplier(supplier || {});
            adminApi.getLocations().then(setLocations).catch(console.error);
        }
    }, [supplier, isOpen]);

    const handleChange = (field: keyof Supplier, value: any) => {
        setEditedSupplier(prev => ({ ...prev, [field]: value }));
    };
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('logo', reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSave = () => {
        if (!editedSupplier.name || !editedSupplier.contactEmail) {
            alert("Supplier Name and Contact Email are required.");
            return;
        }
        onSave(editedSupplier as Supplier);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={supplier?.id ? 'Edit Supplier' : 'Add New Supplier'} size="lg">
            <div className="space-y-6">
                {/* Section 1: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Logo</label>
                        <div className="flex flex-col items-center gap-2">
                            {editedSupplier.logo ? (
                                <img src={editedSupplier.logo} alt="Logo Preview" className="w-24 h-24 object-contain rounded-full border p-1 bg-gray-50"/>
                            ) : (
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-400"/></div>
                            )}
                            <label htmlFor="logo-upload" className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer">
                                {editedSupplier.logo ? 'Change' : 'Upload'}
                                <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload}/>
                            </label>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <InputField label="Company Name" value={editedSupplier.name || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)} />
                        <InputField label="Contact Email" type="email" value={editedSupplier.contactEmail || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('contactEmail', e.target.value)} />
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Primary Location</label>
                            <select 
                                value={editedSupplier.locationCode || ''} 
                                onChange={(e) => {
                                    handleChange('locationCode', e.target.value);
                                    const selectedLoc = locations.find(l => l.iataCode === e.target.value);
                                    if (selectedLoc) {
                                        handleChange('location', selectedLoc.name);
                                    }
                                }}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            >
                                <option value="">Select a location</option>
                                {locations.map((loc) => (
                                    <option key={loc.iataCode} value={loc.iataCode}>
                                        {loc.name} ({loc.iataCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                {/* Section 2: Commission */}
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Commission & Booking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField label="Commission Type" value={editedSupplier.commissionType || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('commissionType', e.target.value)} options={Object.values(CommissionType).map(v => ({ value: v, label: v }))} />
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Commission Value</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{editedSupplier.commissionType === 'Pay at Desk' ? '$' : '%'}</span>
                                <input type="number" step="0.01" value={editedSupplier.commissionValue || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('commissionValue', parseFloat(e.target.value))} className="pl-7 w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-orange-500" />
                            </div>
                        </div>
                        <SelectField label="Booking Mode" value={editedSupplier.bookingMode || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('bookingMode', e.target.value)} options={Object.values(BookingMode).map(v => ({ value: v, label: v }))} />
                    </div>
                </div>
                {/* Section: Marketing */}
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Marketing Features</h4>
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={editedSupplier.enableSocialProof || false} 
                                onChange={e => handleChange('enableSocialProof', e.target.checked)} 
                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-3"
                            />
                            <span>Enable "Recently Booked" social proof messages on car cards.</span>
                        </label>
                    </div>
                </div>
                {/* Section 3: Credentials */}
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Supplier Portal Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Username" value={editedSupplier.username || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('username', e.target.value)} />
                        <InputField label="Password" type="password" value={editedSupplier.password || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('password', e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md">
                        <Save className="w-4 h-4"/> Save Supplier
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const ApiConnectionModal = ({ supplier, isOpen, onClose, onSave }: { supplier: Supplier; isOpen: boolean; onClose: () => void; onSave: (updatedSupplier: Supplier) => void; }) => {
    const [editedSupplier, setEditedSupplier] = useState(supplier);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    if (!isOpen) return null;

    const handleGenerateCredentials = () => {
        const accountId = `${supplier.name.substring(0,2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const secretKey = `sk_live_${[...Array(24)].map(() => Math.random().toString(36)[2]).join('')}`;
        setEditedSupplier(prev => ({ ...prev, apiConnection: { ...prev.apiConnection, accountId, secretKey } as ApiConnection }));
    };
    
    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage('');
        const result = await processSupplierXmlUpdate(supplier.id);
        setSyncMessage(result.message);
        setSyncing(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={<span className="flex items-center gap-2"><Rss className="w-5 h-5 text-orange-600"/> API Connection for {supplier.name}</span>} size="lg">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Connection Type</label>
                    <select 
                        value={editedSupplier.connectionType} 
                        onChange={e => setEditedSupplier({ ...editedSupplier, connectionType: e.target.value as any })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="manual">Manual (UI Based)</option>
                        <option value="api">API (XML Sync)</option>
                    </select>
                </div>

                {editedSupplier.connectionType === 'api' && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Supplier Endpoint URL</label>
                            <div className="relative">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="https://supplier.com/api/v1/inventory.xml" value={editedSupplier.apiConnection?.endpointUrl || ''} onChange={e => setEditedSupplier({ ...editedSupplier, apiConnection: { ...editedSupplier.apiConnection, endpointUrl: e.target.value } as ApiConnection })} className="pl-9 w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-orange-500"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Account ID</label>
                            <div className="relative">
                                <input type="text" readOnly value={editedSupplier.apiConnection?.accountId || ''} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 font-mono" />
                                <button onClick={() => copyToClipboard(editedSupplier.apiConnection?.accountId || '')} className="absolute right-2 top-1.5 p-1 text-gray-400 hover:text-orange-600">
                                    <Copy className="w-3.5 h-3.5"/>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">API Secret Key</label>
                            <div className="relative">
                                <input type="text" readOnly value={editedSupplier.apiConnection?.secretKey || ''} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 font-mono" />
                                <button onClick={() => copyToClipboard(editedSupplier.apiConnection?.secretKey || '')} className="absolute right-2 top-1.5 p-1 text-gray-400 hover:text-orange-600">
                                    <Copy className="w-3.5 h-3.5"/>
                                </button>
                            </div>
                        </div>
                        <button onClick={handleGenerateCredentials} className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1">
                            <Key className="w-3 h-3"/> Generate New Credentials
                        </button>
                        
                        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                            <button onClick={handleSync} disabled={syncing} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                            {syncMessage && <p className="text-xs text-green-600 font-medium">{syncMessage}</p>}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={() => onSave(editedSupplier)} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md">
                    <Save className="w-3.5 h-3.5"/> Save Connection
                </button>
            </div>
        </Modal>
    );
};

const PageEditorModal = ({ page, isOpen, onClose }: { page: PageContent | null; isOpen: boolean; onClose: () => void }) => {
    const [title, setTitle] = useState(page?.title || '');
    const [content, setContent] = useState(page?.content || '');
    
    useEffect(() => {
        if (page) {
            setTitle(page.title);
            setContent(page.content);
        }
    }, [page]);

    if (!isOpen || !page) return null;

    const handleSave = () => {
        updatePage(page.slug, { title, content });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Page: ${page.slug}`} size="lg">
            <div className="space-y-4">
                <InputField label="Page Title" value={title} onChange={e => setTitle(e.target.value)} />
                <div className="flex-grow flex flex-col h-[400px]">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Content (Text / HTML)</label>
                    <textarea 
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        className="w-full h-full border border-gray-200 rounded-xl p-3 font-mono leading-relaxed resize-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md">
                    <Save className="w-4 h-4"/> Save Changes
                </button>
            </div>
        </Modal>
    );
};

const SEOEditorModal = ({ config, isOpen, onClose }: { config: SEOConfig | null, isOpen: boolean, onClose: () => void }) => {
    const [route, setRoute] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [keywords, setKeywords] = useState('');
    const [ogImage, setOgImage] = useState('');

    useEffect(() => {
        if (config) {
            setRoute(config.route);
            setTitle(config.title);
            setDescription(config.description);
            setKeywords(config.keywords || '');
            setOgImage(config.ogImage || '');
        } else {
            setRoute(''); setTitle(''); setDescription(''); setKeywords(''); setOgImage('');
        }
    }, [config]);

    if (!isOpen) return null;

    const handleSave = () => {
        if(!route || !title) return alert("Route and Title are required");
        updateSeoConfig({ route, title, description, keywords, ogImage });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={config ? 'Edit SEO' : 'New SEO Configuration'} size="md">
            <div className="space-y-4">
                <InputField label="Route Path" value={route} onChange={e => setRoute(e.target.value)} placeholder="/" disabled={!!config} />
                <p className="text-[10px] text-gray-400 mt-1">Example: /, /about, /search</p>
                <InputField label="Meta Title" value={title} onChange={e => setTitle(e.target.value)} />
                <TextAreaField label="Meta Description" value={description} onChange={e => setDescription(e.target.value)} />
                <InputField label="Keywords (comma-separated)" value={keywords} onChange={e => setKeywords(e.target.value)} />
                <InputField label="OpenGraph Image URL" value={ogImage} onChange={e => setOgImage(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md">
                    <Save className="w-4 h-4"/> Save SEO
                </button>
            </div>
        </Modal>
    );
};

const EditCarModelModal = ({ carModel, isOpen, onClose, onSave }: { carModel: CarModel | null; isOpen: boolean; onClose: () => void; onSave: (model: CarModel) => void; }) => {
    const [model, setModel] = useState<CarModel>({
        id: '', make: '', model: '', year: new Date().getFullYear(), category: CarCategory.ECONOMY, type: VehicleType.SEDAN, image: '', passengers: 4, bags: 2, doors: 4
    });

    useEffect(() => {
        if (carModel) {
            setModel(carModel);
        } else {
            setModel({ id: '', make: '', model: '', year: new Date().getFullYear(), category: CarCategory.ECONOMY, type: VehicleType.SEDAN, image: '', passengers: 4, bags: 2, doors: 4 });
        }
    }, [carModel, isOpen]);

    const handleChange = (field: keyof CarModel, value: any) => {
        setModel(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('image', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!model.make || !model.model || !model.image) {
            alert('Make, Model, and Image are required.');
            return;
        }
        onSave(model);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={carModel ? 'Edit Car Model' : 'Add New Car Model'} size="lg">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Make" value={model.make} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('make', e.target.value)} />
                    <InputField label="Model" value={model.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('model', e.target.value)} />
                    <InputField label="Year" type="number" value={model.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('year', parseInt(e.target.value))} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Car Image</label>
                    <div className="mt-1 flex items-center gap-4">
                        {model.image ? (
                            <img src={model.image} alt="Preview" className="w-48 h-auto object-cover rounded-xl border p-1" />
                        ) : (
                            <div className="w-48 h-24 bg-gray-100 rounded-xl border flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500">
                            <span>Upload file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <SelectField label="Category" value={model.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('category', e.target.value)} options={Object.values(CarCategory).map(v => ({ value: v, label: v }))} />
                    <SelectField label="Type" value={model.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('type', e.target.value)} options={Object.values(VehicleType).map(v => ({ value: v, label: v }))} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <InputField label="Passengers" type="number" value={model.passengers} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('passengers', parseInt(e.target.value))} />
                    <InputField label="Bags" type="number" value={model.bags} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('bags', parseInt(e.target.value))} />
                    <InputField label="Doors" type="number" value={model.doors} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('doors', parseInt(e.target.value))} />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md">
                    <Save className="w-4 h-4"/> Save Model
                </button>
            </div>
        </Modal>
    );
};

const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: { affiliate: Affiliate | null, isOpen: boolean, onClose: () => void, onSave: (id: string, rate: number) => void }) => {
    const [rate, setRate] = useState(0);

    useEffect(() => {
        if (affiliate) {
            setRate(affiliate.commissionRate);
        }
    }, [affiliate]);

    if (!isOpen || !affiliate) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Commission" size="sm">
            <div>
                <p className="text-xs text-gray-500 mb-2">{affiliate.name}</p>
                <InputField label="Commission Rate" type="number" step="0.01" min="0" max="1" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} />
                <p className="text-[10px] text-gray-400 mt-1">Enter as a decimal (e.g., 0.07 for 7%).</p>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={() => onSave(affiliate.id, rate)} className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold">Save</button>
            </div>
        </Modal>
    );
};

const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: { car: CarType; isOpen: boolean; onClose: () => void; onSave: (carId: string, newTier: RateTier) => void; onDeleteTier: (carId: string, tierId: string) => void; }) => {
    const [tierName, setTierName] = useState('');
    const [promotionLabel, setPromotionLabel] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dailyRate, setDailyRate] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!tierName || !promotionLabel || !startDate || !endDate || !dailyRate) {
            alert("Please fill all fields for the new promotion.");
            return;
        }

        const newTier: RateTier = {
            id: `promo-${Date.now()}`,
            name: tierName,
            startDate,
            endDate,
            promotionLabel,
            rates: [{
                minDays: 1,
                maxDays: 99,
                dailyRate: parseFloat(dailyRate)
            }]
        };

        onSave(car.id, newTier);
        setTierName('');
        setPromotionLabel('');
        setStartDate('');
        setEndDate('');
        setDailyRate('');
    };

    const promoTiers = car.rateTiers.filter(t => t.promotionLabel);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={<span className="flex items-center gap-2"><Tag className="w-5 h-5 text-purple-600"/> Manage Promotions for {car.make} {car.model}</span>} size="lg">
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Active Promotions</h4>
                    {promoTiers.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No promotions are currently active for this vehicle.</p>
                    ) : (
                        <div className="space-y-2">
                            {promoTiers.map(tier => (
                                <div key={tier.id} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{tier.promotionLabel}</p>
                                        <p className="text-xs text-gray-500">{tier.name} ({tier.startDate} to {tier.endDate})</p>
                                        <p className="text-xs font-bold text-green-600 mt-1">Rate: ${tier.rates[0]?.dailyRate}/day</p>
                                    </div>
                                    <button onClick={() => onDeleteTier(car.id, tier.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-4">Add New Promotion</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Promotion Name" placeholder="e.g. Summer Sale" value={tierName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTierName(e.target.value)} />
                        <InputField label="Promotion Label (Public)" placeholder="e.g. 20% Off!" value={promotionLabel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromotionLabel(e.target.value)} />
                        <InputField label="Start Date" type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} />
                        <InputField label="End Date" type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} />
                        <div className="md:col-span-2">
                            <InputField label="Promotional Daily Rate ($)" type="number" placeholder="e.g. 45.00" value={dailyRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyRate(e.target.value)} />
                        </div>
                    </div>
                    <button onClick={handleSave} className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-md">
                        <PlusCircle className="w-4 h-4"/> Add Promotion
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ==================== Section Components ====================

const SupplierRow: React.FC<SupplierRowProps> = ({ supplier, onEdit, onApprove, onManageApi }) => (
    <tr className="hover:bg-orange-50/50 transition-colors">
      <td className="py-3 px-4 flex items-center gap-3">
          <img src={supplier.logo} alt={supplier.name} className="w-10 h-10 object-contain rounded-full bg-white border border-gray-200" />
          <div>
              <span className="block font-bold text-gray-900 text-sm">{supplier.name}</span>
              <span className="text-xs text-gray-500">{supplier.location}</span>
          </div>
      </td>
      <td className="py-3 px-4">
        <Badge status={supplier.status || 'pending'} />
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${supplier.connectionType === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {supplier.connectionType === 'api' ? <Rss className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
            {supplier.connectionType === 'api' ? 'API' : 'Manual'}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">{MOCK_CARS.filter(c => c.supplier.id === supplier.id).length}</td>
      <td className="py-3 px-4 text-xs text-gray-500">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === supplier.id)).length}</td>
      <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-2">
              {supplier.status === 'pending' && <button onClick={() => onApprove(supplier.id)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md" title="Approve"><CheckCircle className="w-4 h-4" /></button>}
              <button onClick={() => onManageApi(supplier)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md" title="Manage API"><Rss className="w-4 h-4" /></button>
              <button onClick={() => onEdit(supplier)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md" title="Edit"><Edit className="w-4 h-4" /></button>
          </div>
      </td>
    </tr>
  );

const DashboardContent = ({ stats, pendingCount }: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={DollarSign} title="Total Revenue" value="$1.2M" change="+15%" color="orange" />
        <StatCard icon={Calendar} title="Total Bookings" value={MOCK_BOOKINGS.length} color="blue" />
        <StatCard icon={Building} title="Active Suppliers" value={`${stats.activeSuppliers} / ${stats.totalSuppliers}`} color="green" />
        <StatCard icon={AlertCircle} title="Pending Actions" value={pendingCount} color="purple" />
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          Monthly Revenue
        </h3>
        <div className="min-h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ADMIN_STATS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} tick={{ fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.1} />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

const SuppliersContent = ({ suppliers, onEdit, onApprove, onManageApi, onAddSupplier }: any) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
            <SectionHeader title="Supplier Management" icon={Building} />
            <button onClick={onAddSupplier} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                <Plus className="w-4 h-4"/> Add Supplier
            </button>
        </div>
        <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50">
                    <tr className="text-xs font-semibold text-gray-500">
                        <th className="py-2 px-4 border-b border-gray-200">Supplier</th>
                        <th className="py-2 px-4 border-b border-gray-200">Status</th>
                        <th className="py-2 px-4 border-b border-gray-200">Connection</th>
                        <th className="py-2 px-4 border-b border-gray-200">Fleet Size</th>
                        <th className="py-2 px-4 border-b border-gray-200">Bookings</th>
                        <th className="py-2 px-4 border-b border-gray-200"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {suppliers.map((s: Supplier) => <SupplierRow key={s.id} supplier={s} onEdit={onEdit} onApprove={onApprove} onManageApi={onManageApi} />)}
                </tbody>
            </table>
        </div>
    </div>
);

const SupplierRequestsContent = ({ apps, onApprove, onReject }: any) => {
    const handleApprove = (app: SupplierApplication) => {
      const newSupplier: Partial<Supplier> = {
          name: app.companyName,
          contactEmail: app.email,
          location: app.primaryLocation,
          connectionType: app.integrationType === 'api' ? 'api' : 'manual',
          status: 'active',
          commissionType: CommissionType.PARTIAL_PREPAID,
          commissionValue: 0.15,
          bookingMode: BookingMode.FREE_SALE,
          username: app.companyName.toLowerCase().replace(/\s/g, ''),
          password: Math.random().toString(36).slice(-8),
      };
      onApprove(newSupplier, app);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <SectionHeader title="Supplier Requests" icon={MailQuestion} />
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-gray-50/50">
                        <tr className="text-xs font-semibold text-gray-500">
                            <th className="p-3 border-b border-gray-200">Company</th>
                            <th className="p-3 border-b border-gray-200">Contact</th>
                            <th className="p-3 border-b border-gray-200">Fleet Size</th>
                            <th className="p-3 border-b border-gray-200">Integration</th>
                            <th className="p-3 border-b border-gray-200">Date</th>
                            <th className="p-3 border-b border-gray-200"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {apps.map((app: SupplierApplication) => (
                            <tr key={app.id} className="hover:bg-orange-50/50 text-sm">
                                <td className="p-3 border-b"><span className="font-bold text-gray-800">{app.companyName}</span><br/><span className="text-xs text-gray-500">{app.primaryLocation}</span></td>
                                <td className="p-3 border-b">{app.contactName}<br/><span className="text-xs text-gray-500">{app.email}</span></td>
                                <td className="p-3 border-b text-xs">{app.fleetSize}</td>
                                <td className="p-3 border-b text-xs uppercase font-medium">{app.integrationType}</td>
                                <td className="p-3 border-b text-xs">{app.submissionDate}</td>
                                <td className="p-3 border-b text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleApprove(app)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                                        <button onClick={() => onReject(app.id)} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-md" title="Reject"><XCircle className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {apps.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm italic">No pending supplier requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BookingsContent = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <SectionHeader title="All Bookings" subtitle="View-only. Actions must be taken from the supplier's portal." icon={Calendar} />
    </div>
);

const FleetContent = () => {
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    const uniqueSuppliers = SUPPLIERS;
    const locationsForSupplier = useMemo(() => {
        if (!filterSupplier) {
            return Array.from(new Set(MOCK_CARS.map(c => c.location))).sort();
        }
        const supplierCars = MOCK_CARS.filter(c => c.supplier.id === filterSupplier);
        return Array.from(new Set(supplierCars.map(c => c.location))).sort();
    }, [filterSupplier]);

    const filteredFleet = useMemo(() => {
        return MOCK_CARS.filter(car => {
            const matchesSupplier = !filterSupplier || car.supplier.id === filterSupplier;
            const matchesLocation = !filterLocation || car.location === filterLocation;
            return matchesSupplier && matchesLocation;
        });
    }, [filterSupplier, filterLocation]);

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterSupplier(e.target.value);
        setFilterLocation('');
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <SectionHeader title="Global Fleet Management" icon={Car} />
            
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Filter by Supplier</label>
                    <select onChange={handleSupplierChange} value={filterSupplier} className="w-full border border-gray-200 rounded-lg py-2 px-2 bg-white focus:ring-2 focus:ring-orange-500">
                        <option value="">All Suppliers</option>
                        {uniqueSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Filter by Location</label>
                    <select onChange={e => setFilterLocation(e.target.value)} value={filterLocation} className="w-full border border-gray-200 rounded-lg py-2 px-2 bg-white focus:ring-2 focus:ring-orange-500">
                        <option value="">All Locations</option>
                        {locationsForSupplier.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
                <button onClick={() => { setFilterSupplier(''); setFilterLocation(''); }} className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-xs shadow-sm">
                    Reset Filters
                </button>
            </div>
            
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50/50">
                        <tr className="text-xs font-semibold text-gray-500">
                            <th className="py-2 px-4 border-b border-gray-200">Vehicle</th>
                            <th className="py-2 px-4 border-b border-gray-200">Supplier</th>
                            <th className="py-2 px-4 border-b border-gray-200">Base Rate</th>
                            <th className="py-2 px-4 border-b border-gray-200">Promotions</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredFleet.map(car => {
                            const basePrice = calculatePrice(car, 1, new Date().toISOString().split('T')[0]).dailyRate;
                            const promoTiers = car.rateTiers.filter(t => t.promotionLabel).length;
                            return (
                                <tr key={car.id} className="hover:bg-orange-50/50 transition-colors">
                                    <td className="py-3 px-4 flex items-center gap-3">
                                        <img src={car.image} alt="" className="w-16 h-10 object-cover rounded bg-gray-100 border border-gray-200" />
                                        <div>
                                            <span className="block font-bold text-gray-800 text-sm">{car.make} {car.model}</span>
                                            <span className="text-xs text-gray-500">{car.category}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{car.supplier.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">${basePrice.toFixed(2)}/day</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{promoTiers > 0 ? `${promoTiers} active` : 'None'}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => {}} className="bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5">
                                            <Tag className="w-3 h-3"/> Manage Promotions
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredFleet.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm italic">No vehicles match the current filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CarLibraryContent = ({ library, onEdit, onDelete }: any) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
            <SectionHeader title="Car Model Library" subtitle="Base images and specifications for car models." icon={Car} />
            <button onClick={() => onEdit(null)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                <Plus className="w-4 h-4"/> Add Model
            </button>
        </div>
        <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50/50">
                    <tr className="text-xs font-semibold text-gray-500">
                        <th className="py-2 px-4 border-b border-gray-200">Image</th>
                        <th className="py-2 px-4 border-b border-gray-200">Make & Model</th>
                        <th className="py-2 px-4 border-b border-gray-200">Year</th>
                        <th className="py-2 px-4 border-b border-gray-200">Category</th>
                        <th className="py-2 px-4 border-b border-gray-200">Type</th>
                        <th className="py-2 px-4 border-b border-gray-200"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {library.map((model: CarModel) => (
                        <tr key={model.id} className="hover:bg-orange-50/50 transition-colors">
                            <td className="py-3 px-4">
                                <img src={model.image} alt={`${model.make} ${model.model}`} className="w-16 h-10 object-cover rounded bg-gray-100 border border-gray-200" />
                            </td>
                            <td className="py-3 px-4">
                                <span className="block font-bold text-gray-800 text-sm">{model.make} {model.model}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{model.year}</td>
                            <td className="py-3 px-4 text-xs text-gray-500">{model.category}</td>
                            <td className="py-3 px-4 text-xs text-gray-500">{model.type}</td>
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onEdit(model)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md" title="Edit Model"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => onDelete(model.id)} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-md" title="Delete Model"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const ApiPartnersContent = ({ partners, onCreate, onToggle }: any) => {
    const [newName, setNewName] = useState('');
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <SectionHeader title="API Partner Management" icon={Share2} />
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-4 items-end mb-6">
                <div className="flex-grow">
                    <label className="block text-xs font-bold text-gray-700 mb-1">New Partner Name</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Skyscanner" className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"/>
                </div>
                <button onClick={() => { onCreate(newName); setNewName(''); }} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
            </div>
            <div className="space-y-3">
                {partners.map((p: ApiPartner) => (
                    <div key={p.id} className="p-3 border border-gray-200 rounded-xl flex justify-between items-center hover:bg-orange-50/50">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Key className="w-3.5 h-3.5 text-gray-400"/>
                                <span className="text-xs font-mono text-gray-500">{p.apiKey}</span>
                                <button onClick={() => navigator.clipboard.writeText(p.apiKey)} className="text-gray-400 hover:text-orange-600"><Copy className="w-3.5 h-3.5"/></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400">Created: {p.createdAt}</span>
                            <button onClick={() => onToggle(p.id, p.status === 'active' ? 'inactive' : 'active')} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                <Power className="w-3 h-3" /> {p.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AffiliatesContent = ({ affiliates, onUpdateStatus, onEditCommission, editingAffiliate, setEditingAffiliate, onSaveCommission }: any) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <SectionHeader title="Affiliate Management" icon={DollarSign} />
        <EditAffiliateModal affiliate={editingAffiliate} isOpen={!!editingAffiliate} onClose={() => setEditingAffiliate(null)} onSave={onSaveCommission} />
        <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-gray-50/50">
                    <tr className="text-xs font-semibold text-gray-500">
                        <th className="py-2 px-4 border-b border-gray-200">Affiliate</th>
                        <th className="py-2 px-4 border-b border-gray-200">Status</th>
                        <th className="py-2 px-4 border-b border-gray-200">Comm. Rate</th>
                        <th className="py-2 px-4 border-b border-gray-200">Clicks</th>
                        <th className="py-2 px-4 border-b border-gray-200">Conversions</th>
                        <th className="py-2 px-4 border-b border-gray-200">Earnings</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {affiliates.map((affiliate: Affiliate) => (
                        <tr key={affiliate.id} className="hover:bg-orange-50/50 transition-colors">
                            <td className="py-3 px-4">
                                <span className="block font-bold text-gray-800 text-sm">{affiliate.name}</span>
                                <span className="text-xs text-gray-500">{affiliate.email}</span>
                            </td>
                            <td className="py-3 px-4">
                                <Badge status={affiliate.status} />
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-700">{(affiliate.commissionRate * 100).toFixed(2)}%</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{affiliate.clicks}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{affiliate.conversions}</td>
                            <td className="py-3 px-4 text-sm font-bold text-gray-800">${affiliate.totalEarnings.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {affiliate.status === 'pending' && (
                                        <>
                                            <button onClick={() => onUpdateStatus(affiliate.id, 'active')} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md" title="Approve"><CheckCircle className="w-4 h-4"/></button>
                                            <button onClick={() => onUpdateStatus(affiliate.id, 'rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-md" title="Reject"><XCircle className="w-4 h-4"/></button>
                                        </>
                                    )}
                                    {affiliate.status === 'active' && <button onClick={() => onUpdateStatus(affiliate.id, 'rejected')} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md" title="Deactivate"><PowerOff className="w-4 h-4"/></button>}
                                    {affiliate.status === 'rejected' && <button onClick={() => onUpdateStatus(affiliate.id, 'active')} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md" title="Activate"><Power className="w-4 h-4"/></button>}
                                    <button onClick={() => setEditingAffiliate(affiliate)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md" title="Edit Commission"><Edit className="w-4 h-4"/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const CmsContent = ({ pages, onEditPage }: any) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <SectionHeader title="Content Management System (CMS)" icon={FileText} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page: PageContent) => (
                <div key={page.slug} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800">{page.title}</h3>
                            <p className="text-xs font-mono text-gray-500 bg-gray-50 px-1 rounded inline-block mt-1">/{page.slug}</p>
                        </div>
                        <button onClick={() => onEditPage(page)} className="text-gray-500 hover:text-orange-600"><Edit className="w-4 h-4"/></button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Last updated: {page.lastUpdated}</p>
                </div>
            ))}
        </div>
    </div>
);

const SeoContent = ({ configs, onEditSeo, onNewSeo }: any) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
            <SectionHeader title="SEO Configurations" icon={Globe} />
            <button onClick={() => onNewSeo()} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                <Plus className="w-4 h-4"/> New Route
            </button>
        </div>
        <div className="space-y-2">
            {configs.map((config: SEOConfig) => (
                <div key={config.route} className="p-3 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-orange-50/50">
                    <div>
                        <p className="font-mono text-sm text-orange-600 font-semibold">{config.route}</p>
                        <p className="text-xs text-gray-700 mt-1">{config.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-md">{config.description}</p>
                    </div>
                    <button onClick={() => onEditSeo(config)} className="text-gray-500 hover:text-orange-600"><Edit className="w-4 h-4"/></button>
                </div>
            ))}
        </div>
    </div>
);

const HomepageContentSection = ({ content, categoryImages, onSave }: any) => {
    const [localContent, setLocalContent] = useState(content);
    const [localCategoryImages, setLocalCategoryImages] = useState(categoryImages);
    const [saved, setSaved] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>('hero');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);

    const handleSave = () => {
        onSave(localContent, localCategoryImages);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleTextChange = (path: string, value: string) => {
        const keys = path.split('.');
        setLocalContent((prev: HomepageContent) => {
            const newState = JSON.parse(JSON.stringify(prev));
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const handleNestedItemChange = (section: keyof HomepageContent, nestedKey: string | null, index: number, field: string, value: any) => {
        setLocalContent((prev: HomepageContent) => {
            const newState = JSON.parse(JSON.stringify(prev));
            const arrayParent = newState[section] as any;
            const arrayToUpdate = nestedKey ? arrayParent[nestedKey] : arrayParent;
            if (Array.isArray(arrayToUpdate)) {
                arrayToUpdate[index][field] = value;
            }
            return newState;
        });
    };

    const handleAddItem = (section: keyof HomepageContent, nestedKey: string | null = null, template: object) => {
         setLocalContent((prev: HomepageContent) => {
            const newState = JSON.parse(JSON.stringify(prev));
            if(nestedKey) {
                (newState[section] as any)[nestedKey].push(template);
            } else {
                (newState[section] as any).push(template);
            }
            return newState;
        });
    };

    const handleDeleteItem = (section: keyof HomepageContent, nestedKey: string | null = null, index: number) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        setLocalContent((prev: HomepageContent) => {
            const newState = JSON.parse(JSON.stringify(prev));
            if(nestedKey) {
                (newState[section] as any)[nestedKey].splice(index, 1);
            } else {
                (newState[section] as any).splice(index, 1);
            }
            return newState;
        });
    };
    
    const handleCategoryImageChange = (category: CarCategory, file: File) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalCategoryImages((prev: any) => ({
                    ...prev,
                    [category]: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const InputFieldComp = ({ label, value, onChange }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <div className="mb-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
            <input type="text" value={value} onChange={onChange} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"/>
        </div>
    );

    const AccordionSection = ({ title, id, children }: { title: string, id: string, children?: React.ReactNode }) => (
        <div className="border border-gray-200 rounded-lg mb-2">
            <button onClick={() => setActiveAccordion(activeAccordion === id ? null : id)} className="w-full flex justify-between items-center p-3 bg-orange-50 hover:bg-orange-100">
                <span className="font-bold text-sm text-gray-700">{title}</span>
                {activeAccordion === id ? <ChevronUp className="w-5 h-5 text-orange-600"/> : <ChevronDown className="w-5 h-5 text-orange-600"/>}
            </button>
            {activeAccordion === id && <div className="p-4 border-t border-gray-200">{children}</div>}
        </div>
    );
    
    const previewClasses = {
        desktop: 'w-full h-[600px] border-4 border-gray-800 rounded-lg shadow-2xl',
        tablet: 'w-[768px] h-[1024px] border-8 border-gray-800 rounded-2xl shadow-2xl scale-[.6] origin-top',
        mobile: 'w-[375px] h-[667px] border-8 border-gray-800 rounded-2xl shadow-2xl scale-[.9] origin-top',
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isPreviewFullScreen && (
                <div className="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center animate-fadeIn">
                    <div className="relative w-full h-full">
                        <iframe src="/#/" title="Live Preview" className="w-full h-full bg-white rounded-lg" />
                        <button onClick={() => setIsPreviewFullScreen(false)} className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full p-1 shadow-lg hover:bg-red-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="sticky top-[70px] z-10 bg-white/80 backdrop-blur-sm py-3 mb-6 flex justify-between items-center border-b border-gray-200 -mx-6 px-6">
                    <h2 className="text-lg font-bold text-gray-800">Homepage Content Editor</h2>
                    <div className="flex items-center gap-3">
                        {saved && <span className="text-green-600 text-xs font-bold flex items-center gap-1 animate-fadeIn"><CheckCircle className="w-4 h-4"/> Saved!</span>}
                        <button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm">
                            <Save className="w-3.5 h-3.5"/> Save All Changes
                        </button>
                    </div>
                </div>

                <AccordionSection title="Hero Section" id="hero">
                    <InputFieldComp label="Title" value={localContent.hero.title} onChange={e => handleTextChange('hero.title', e.target.value)} />
                    <InputFieldComp label="Subtitle" value={localContent.hero.subtitle} onChange={e => handleTextChange('hero.subtitle', e.target.value)} />
                    <InputFieldComp label="Background Image URL" value={localContent.hero.backgroundImage} onChange={e => handleTextChange('hero.backgroundImage', e.target.value)} />
                </AccordionSection>

                <AccordionSection title="Car Category Images" id="categoryimages">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.keys(localCategoryImages).map(cat => {
                            const category = cat as CarCategory;
                            return (
                                <div key={category} className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">{category}</label>
                                    <img src={localCategoryImages[category]} alt={category} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                                    <label htmlFor={`img-upload-${category}`} className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer">
                                        Change Image
                                        <input 
                                            id={`img-upload-${category}`}
                                            type="file" 
                                            className="sr-only" 
                                            accept="image/*" 
                                            onChange={(e) => {
                                                if(e.target.files?.[0]) {
                                                    handleCategoryImageChange(category, e.target.files[0])
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                </AccordionSection>
                
                <AccordionSection title="Features Section" id="features">
                    {(localContent.features || []).map((item: FeatureItem, index: number) => (
                        <div key={item.id} className="p-3 border rounded mb-2 bg-orange-50 relative">
                            <button onClick={() => handleDeleteItem('features', null, index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputFieldComp label="Icon" value={item.icon} onChange={e => handleNestedItemChange('features', null, index, 'icon', e.target.value)} />
                            <InputFieldComp label="Title" value={item.title} onChange={e => handleNestedItemChange('features', null, index, 'title', e.target.value)} />
                            <InputFieldComp label="Description" value={item.description} onChange={e => handleNestedItemChange('features', null, index, 'description', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('features', null, {id: `f${Date.now()}`, icon: 'Globe', title: '', description: ''})} className="text-orange-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Feature</button>
                </AccordionSection>

                <AccordionSection title="How It Works" id="howitworks">
                    <InputFieldComp label="Section Title" value={localContent.howItWorks.title} onChange={e => handleTextChange('howItWorks.title', e.target.value)} />
                    <InputFieldComp label="Section Subtitle" value={localContent.howItWorks.subtitle} onChange={e => handleTextChange('howItWorks.subtitle', e.target.value)} />
                     {(localContent.howItWorks.steps || []).map((item: StepItem, index: number) => (
                        <div key={item.id} className="p-3 border rounded mt-3 mb-2 bg-orange-50 relative">
                            <h4 className="text-xs font-bold mb-2">Step {index + 1}</h4>
                            <button onClick={() => handleDeleteItem('howItWorks', 'steps', index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputFieldComp label="Icon" value={item.icon} onChange={e => handleNestedItemChange('howItWorks', 'steps', index, 'icon', e.target.value)} />
                            <InputFieldComp label="Title" value={item.title} onChange={e => handleNestedItemChange('howItWorks', 'steps', index, 'title', e.target.value)} />
                            <InputFieldComp label="Description" value={item.description} onChange={e => handleNestedItemChange('howItWorks', 'steps', index, 'description', e.target.value)} />
                        </div>
                    ))}
                     <button onClick={() => handleAddItem('howItWorks', 'steps', {id: `s${Date.now()}`, icon: 'Search', title: '', description: ''})} className="text-orange-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Step</button>
                </AccordionSection>
                <AccordionSection title="Value Propositions" id="valuepropositions">
                    {(localContent.valuePropositions || []).map((item: ValuePropositionItem, index: number) => (
                        <div key={item.id} className="p-3 border rounded mb-2 bg-orange-50 relative">
                            <button onClick={() => handleDeleteItem('valuePropositions', null, index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputFieldComp label="Icon" value={item.icon} onChange={e => handleNestedItemChange('valuePropositions', null, index, 'icon', e.target.value)} />
                            <InputFieldComp label="Title" value={item.title} onChange={e => handleNestedItemChange('valuePropositions', null, index, 'title', e.target.value)} />
                            <InputFieldComp label="Description" value={item.description} onChange={e => handleNestedItemChange('valuePropositions', null, index, 'description', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('valuePropositions', null, {id: `vp${Date.now()}`, icon: 'CheckCircle', title: '', description: ''})} className="text-orange-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Proposition</button>
                </AccordionSection>

                <AccordionSection title="Popular Destinations" id="destinations">
                     <InputFieldComp label="Section Title" value={localContent.popularDestinations.title} onChange={e => handleTextChange('popularDestinations.title', e.target.value)} />
                    <InputFieldComp label="Section Subtitle" value={localContent.popularDestinations.subtitle} onChange={e => handleTextChange('popularDestinations.subtitle', e.target.value)} />
                     {(localContent.popularDestinations.destinations || []).map((item: DestinationItem, index: number) => (
                        <div key={item.id} className="p-3 border rounded mt-3 mb-2 bg-orange-50 relative">
                            <h4 className="text-xs font-bold mb-2">Destination {index + 1}</h4>
                            <button onClick={() => handleDeleteItem('popularDestinations', 'destinations', index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputFieldComp label="Name" value={item.name} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'name', e.target.value)} />
                            <InputFieldComp label="Country" value={item.country} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'country', e.target.value)} />
                            <InputFieldComp label="Price (number)" value={item.price.toString()} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'price', Number(e.target.value))} />
                            <InputFieldComp label="Image URL" value={item.image} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'image', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('popularDestinations', 'destinations', {id: `d${Date.now()}`, name: '', country: '', price: 0, image: ''})} className="text-orange-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Destination</button>
                </AccordionSection>

                 <AccordionSection title="Partners & CTA Sections" id="misc">
                    <InputFieldComp label="Partners Section Title" value={localContent.partners.title} onChange={e => handleTextChange('partners.title', e.target.value)} />
                    <InputFieldComp label="CTA Title" value={localContent.cta.title} onChange={e => handleTextChange('cta.title', e.target.value)} />
                    <InputFieldComp label="CTA Subtitle" value={localContent.cta.subtitle} onChange={e => handleTextChange('cta.subtitle', e.target.value)} />
                </AccordionSection>

                <AccordionSection title="FAQs" id="faqs">
                     <InputFieldComp label="Section Title" value={localContent.faqs.title} onChange={e => handleTextChange('faqs.title', e.target.value)} />
                     {(localContent.faqs.items || []).map((item: FaqItem, index: number) => (
                        <div key={item.id} className="p-3 border rounded mt-3 mb-2 bg-orange-50 relative">
                            <h4 className="text-xs font-bold mb-2">FAQ {index + 1}</h4>
                            <button onClick={() => handleDeleteItem('faqs', 'items', index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputFieldComp label="Question" value={item.question} onChange={e => handleNestedItemChange('faqs', 'items', index, 'question', e.target.value)} />
                            <InputFieldComp label="Answer" value={item.answer} onChange={e => handleNestedItemChange('faqs', 'items', index, 'answer', e.target.value)} />
                        </div>
                    ))}
                     <button onClick={() => handleAddItem('faqs', 'items', {id: `faq${Date.now()}`, question: '', answer: ''})} className="text-orange-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add FAQ</button>
                </AccordionSection>
            </div>
            <div className="bg-gray-200 p-4 rounded-lg shadow-inner sticky top-20 h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-700">Live Preview</h3>
                    <div className="flex items-center gap-1 bg-gray-300 p-1 rounded-lg">
                        <button onClick={() => setPreviewMode('desktop')} className={`p-1 rounded-md ${previewMode === 'desktop' ? 'bg-white shadow' : 'text-gray-500 hover:bg-white/50'}`}><Monitor className="w-4 h-4"/></button>
                        <button onClick={() => setPreviewMode('tablet')} className={`p-1 rounded-md ${previewMode === 'tablet' ? 'bg-white shadow' : 'text-gray-500 hover:bg-white/50'}`}><Tablet className="w-4 h-4"/></button>
                        <button onClick={() => setPreviewMode('mobile')} className={`p-1 rounded-md ${previewMode === 'mobile' ? 'bg-white shadow' : 'text-gray-500 hover:bg-white/50'}`}><Smartphone className="w-4 h-4"/></button>
                        <div className="w-px h-4 bg-gray-400 mx-1"></div>
                        <button onClick={() => setIsPreviewFullScreen(true)} className="p-1 rounded-md text-gray-500 hover:bg-white/50"><Expand className="w-4 h-4"/></button>
                    </div>
                </div>
                <div className="w-full h-[calc(100%-2.5rem)] bg-gray-300 rounded-md flex items-center justify-center overflow-auto">
                    <iframe 
                        key={`${previewMode}-${JSON.stringify(localContent)}`} 
                        src="/#/" 
                        title="Live Preview" 
                        className={`bg-white transition-all duration-300 ease-in-out ${previewClasses[previewMode]}`}
                    />
                </div>
            </div>
        </div>
    );
};

const SiteSettingsContent = () => {
    const [duration, setDuration] = useState(MOCK_APP_CONFIG.searchingScreenDuration / 1000);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        updateAppConfig({ searchingScreenDuration: duration * 1000 });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <SectionHeader title="General Site Settings" icon={Settings} />
            <div className="max-w-md space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Searching Screen Duration</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">seconds</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Controls how long the loading screen is shown while "searching" for cars.</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md">Save Settings</button>
                    {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-2 animate-fadeIn"><CheckCircle className="w-5 h-5"/> Saved!</span>}
                </div>
            </div>
        </div>
    );
};

const PromotionsContent = () => {
    const [promos, setPromos] = useState(MOCK_PROMO_CODES);
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState(10);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || newDiscount <= 0) return;
        addPromoCode(newCode, newDiscount);
        setPromos([...MOCK_PROMO_CODES]);
        setNewCode('');
        setNewDiscount(10);
    };

    const handleToggle = (id: string, status: 'active' | 'inactive') => {
        updatePromoCodeStatus(id, status);
        setPromos([...MOCK_PROMO_CODES]);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this promo code?')) {
            deletePromoCode(id);
            setPromos([...MOCK_PROMO_CODES]);
        }
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <SectionHeader title="Manage Promo Codes" icon={Tag} />
            <form onSubmit={handleAdd} className="bg-orange-50 p-4 rounded-xl border border-orange-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Promo Code</label>
                    <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="e.g., SUMMER20" className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Discount (%)</label>
                    <input type="number" value={newDiscount} onChange={e => setNewDiscount(parseInt(e.target.value))} className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"/>
                </div>
                <button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 rounded-lg shadow-sm text-sm">Add Code</button>
            </form>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs font-semibold text-gray-500 bg-gray-50/50">
                        <tr>
                            <th className="p-3 border-b border-gray-200">Code</th>
                            <th className="p-3 border-b border-gray-200">Discount</th>
                            <th className="p-3 border-b border-gray-200">Status</th>
                            <th className="p-3 border-b border-gray-200 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {promos.map(p => (
                            <tr key={p.id}>
                                <td className="p-3 font-mono font-bold text-gray-700">{p.code}</td>
                                <td className="p-3 text-sm text-gray-600">{(p.discount * 100).toFixed(0)}%</td>
                                <td className="p-3">
                                    <Badge status={p.status} />
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleToggle(p.id, p.status === 'active' ? 'inactive' : 'active')} className="p-2 hover:bg-gray-100 rounded-md text-gray-500" title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                                            {p.status === 'active' ? <PowerOff className="w-4 h-4"/> : <Power className="w-4 h-4"/>}
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-md text-red-500" title="Delete">
                                            <Trash2 className="w-4 h-4"/>
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

// ==================== Main AdminDashboard Component ====================
export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [suppliers, setSuppliers] = useState(SUPPLIERS);
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

  // Stats
  const stats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.status === 'active').length,
    totalBookings: MOCK_BOOKINGS.length,
    totalRevenue: 1200000,
  };
  const pendingCount = supplierApps.length;

  useEffect(() => {
    setSuppliers(SUPPLIERS);
    setSupplierApps(MOCK_SUPPLIER_APPLICATIONS);
    setApiPartners(MOCK_API_PARTNERS);
    setCarLibrary(MOCK_CAR_LIBRARY);
    setAffiliates(MOCK_AFFILIATES);
  }, []);

  const handleSaveSupplier = async (updatedSupplier: Supplier) => {
    try {
        if (!updatedSupplier.id) {
            const payload = {
                name: updatedSupplier.name,
                email: updatedSupplier.contactEmail,
                phone: updatedSupplier.phone || '',
                logoUrl: updatedSupplier.logo || '',
                active: true,
                location: updatedSupplier.location || '',
                locationCode: updatedSupplier.locationCode || '',
                bookingMode: updatedSupplier.bookingMode || 'FREE_SALE',
                commissionPercent: updatedSupplier.commissionValue || 0,
                password: updatedSupplier.password || 'defaultPassword123'
            };
            await adminApi.createSupplier(payload);
            alert("Supplier created successfully.");
        } else {
            addMockSupplier(updatedSupplier);
        }
        setSuppliers([...SUPPLIERS]);
        setEditingSupplier(null);
        if (approvingApplication) {
            removeSupplierApplication(approvingApplication.id);
            setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]);
            setApprovingApplication(null);
        }
    } catch (error: any) {
        console.error("Failed to save supplier:", error);
        alert(`Failed to save supplier: ${error.message || 'Unknown error'}`);
    }
  };

  const handleApproveSupplier = (id: string) => {
    const supplier = SUPPLIERS.find(s => s.id === id);
    if (supplier) {
        supplier.status = 'active';
        setSuppliers([...SUPPLIERS]);
    }
  };
  
  const handleSaveApiConnection = (updatedSupplier: Supplier) => {
    handleSaveSupplier(updatedSupplier);
    setIsApiModalOpen(false);
    setEditingSupplier(null);
  };

  const handleCreateApiPartner = (name: string) => {
      if (!name) return;
      addMockApiPartner(name);
      setApiPartners([...MOCK_API_PARTNERS]);
  };

  const handleToggleApiPartnerStatus = (id: string, status: 'active' | 'inactive') => {
      updateApiPartnerStatus(id, status);
      setApiPartners([...MOCK_API_PARTNERS]);
  };

  const handleSaveCarModel = (model: CarModel) => {
    saveCarModel(model);
    setCarLibrary([...MOCK_CAR_LIBRARY]);
    setIsCarModelModalOpen(false);
    setEditingCarModel(null);
  };

  const handleDeleteCarModel = (id: string) => {
      if (window.confirm("Are you sure you want to delete this car model from the library?")) {
          deleteCarModel(id);
          setCarLibrary([...MOCK_CAR_LIBRARY]);
      }
  };

  const handleUpdateAffiliateStatus = (id: string, status: Affiliate['status']) => {
      updateAffiliateStatus(id, status);
      setAffiliates([...MOCK_AFFILIATES]);
  };

  const handleSaveAffiliateCommission = (id: string, rate: number) => {
      updateAffiliateCommissionRate(id, rate);
      setAffiliates([...MOCK_AFFILIATES]);
      setEditingAffiliate(null);
  };
  
  const handleSavePromotion = (carId: string, newTier: RateTier) => {
      const carIndex = MOCK_CARS.findIndex(c => c.id === carId);
      if (carIndex > -1) {
          MOCK_CARS[carIndex].rateTiers.push(newTier);
      }
      setIsPromotionModalOpen(false);
      setManagingPromosForCar(null);
  };
  
  const handleDeleteTier = (carId: string, tierId: string) => {
      const carIndex = MOCK_CARS.findIndex(c => c.id === carId);
      if(carIndex > -1) {
          MOCK_CARS[carIndex].rateTiers = MOCK_CARS[carIndex].rateTiers.filter(t => t.id !== tierId);
          setManagingPromosForCar({...MOCK_CARS[carIndex]});
      }
  };

  const handleRejectApplication = (id: string) => {
      if (window.confirm("Are you sure you want to reject this application?")) {
          removeSupplierApplication(id);
          setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]);
      }
  };

  const handleApproveApplication = (newSupplier: Partial<Supplier>, app: SupplierApplication) => {
      setApprovingApplication(app);
      setEditingSupplier(newSupplier as Supplier);
  };

  const handleEditPage = (page: PageContent) => {
      setEditingPage(page);
      setIsPageEditorOpen(true);
  };

  const handleNewSeo = () => {
      setEditingSeoConfig({} as SEOConfig);
      setIsSeoEditorOpen(true);
  };

  const handleEditSeo = (config: SEOConfig) => {
      setEditingSeoConfig(config);
      setIsSeoEditorOpen(true);
  };

  const handleSaveHomepage = (content: HomepageContent, images: any) => {
      updateHomepageContent(content);
      updateCategoryImages(images);
      setHomepageContent(content);
      setCategoryImages(images);
  };

  const renderContent = () => {
    console.log("renderContent called, activeSection=", activeSection);
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent stats={stats} pendingCount={pendingCount} />;
      case 'suppliers':
        return <SuppliersContent suppliers={suppliers} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(supplier: Supplier) => { setEditingSupplier(supplier); setIsApiModalOpen(true); }} onAddSupplier={() => setEditingSupplier({} as Supplier)} />;
      case 'supplierrequests':
        return <SupplierRequestsContent apps={supplierApps} onApprove={handleApproveApplication} onReject={handleRejectApplication} />;
      case 'bookings':
        return <BookingsContent />;
      case 'fleet':
        return <FleetContent />;
      case 'carlibrary':
        return <CarLibraryContent library={carLibrary} onEdit={(model: CarModel | null) => { setEditingCarModel(model); setIsCarModelModalOpen(true); }} onDelete={handleDeleteCarModel} />;
      case 'apipartners':
        return <ApiPartnersContent partners={apiPartners} onCreate={handleCreateApiPartner} onToggle={handleToggleApiPartnerStatus} />;
      case 'affiliates':
        return <AffiliatesContent affiliates={affiliates} onUpdateStatus={handleUpdateAffiliateStatus} onEditCommission={handleSaveAffiliateCommission} editingAffiliate={editingAffiliate} setEditingAffiliate={setEditingAffiliate} onSaveCommission={handleSaveAffiliateCommission} />;
      case 'cms':
        return <CmsContent pages={MOCK_PAGES} onEditPage={handleEditPage} />;
      case 'seo':
        return <SeoContent configs={MOCK_SEO_CONFIGS} onEditSeo={handleEditSeo} onNewSeo={handleNewSeo} />;
      case 'homepage':
        return <HomepageContentSection content={homepageContent} categoryImages={categoryImages} onSave={handleSaveHomepage} />;
      case 'sitesettings':
        return <SiteSettingsContent />;
      case 'promotions':
        return <PromotionsContent />;
      default:
        return null;
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
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-orange-600" />
          <span className="font-bold text-gray-800">Admin Panel</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          countSupplierRequests={pendingCount}
        />

        <main className="flex-grow lg:pl-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
