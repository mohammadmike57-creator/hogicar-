import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Building, Calendar, 
  Save, Plus, Trash2, Edit, ChevronDown, ChevronUp, DollarSign, ExternalLink,
  Settings, AlertCircle, CheckCircle, Shield, TrendingUp, 
  MailQuestion, Rss, Link2, XCircle, RefreshCw, Copy, Share2, ShieldCheck,
  Power, Tag, ImageIcon, PlusCircle, LoaderCircle, FileText, Globe, 
  Users, Search, Loader, PowerOff, Key, Code, Mail, CheckSquare, XSquare,
  Clock, History, Zap, Gift, PieChart, Activity, Percent, Coins, MapPin, Lock,
  Eye, EyeOff, LayoutGrid, Palette, Building2,
  Award, Star, Bell, Moon, Sun, Home, Briefcase, Truck, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Logo } from '../../components/Logo';
import { fetchLocations, LocationSuggestion } from '../../api';
import { 
    adminFetch, 
    getAdminToken,
    getSupplierCars,
    getSupplierRates,
    getAllSupplierRates,
    updateHogicarChoice 
} from '../../lib/adminApi';
import { API_BASE_URL } from '../../lib/config';
import { calculatePrice } from '../../utils/bookingUtils';
import { 
  Supplier, CommissionType, BookingMode, PickupType, ApiConnection, ApiPartner, 
  PageContent, SEOConfig, HomepageContent, CarModel, CarCategory, 
  CarType as VehicleType, Affiliate, SupplierApplication, Car as CarType, 
  RateTier, FeatureItem, StepItem, FaqItem, Booking
} from '../../types';

// Mock data stubs (Real mock data removed)
const ADMIN_STATS = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];
const SUPPLIERS: Supplier[] = [];
const MOCK_BOOKINGS: Booking[] = [];
const addMockSupplier = (s: any) => {};
const MOCK_API_PARTNERS: any[] = [];
const addMockApiPartner = (p: any) => {};
const updateApiPartnerStatus = (id: string, s: string) => {};
const MOCK_CARS: any[] = [];
const MOCK_PAGES: any[] = [];
const updatePage = (p: any) => {};
const MOCK_HOMEPAGE_CONTENT: any = {
  hero: { title: '', subtitle: '', backgroundImage: '' },
  features: [],
  howItWorks: { title: '', steps: [] },
  faqs: { title: '', items: [] },
  popularDestinations: { title: '', destinations: [] }
};
const MOCK_APP_CONFIG = { searchingScreenDuration: 5000, commissionPercent: 15 };
const updateAppConfig = (c: any) => {};
const MOCK_CAR_LIBRARY: any[] = [];
const saveCarModel = (m: any) => {};
const deleteCarModel = (id: string) => {};
const MOCK_AFFILIATES: any[] = [];
const updateAffiliateStatus = (id: string, s: string) => {};
const updateAffiliateCommissionRate = (id: string, r: number) => {};
const MOCK_SUPPLIER_APPLICATIONS: any[] = [];
const removeSupplierApplication = (id: string) => {};
const MOCK_CATEGORY_IMAGES: any = {};
const addPromoCode = (c: string, d: number) => ({});
const MOCK_PROMO_CODES: any[] = [];
const updatePromoCodeStatus = (id: string, s: string) => {};
const deletePromoCode = (id: string) => {};

// ==================== Helper Functions ====================
const removeLightBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const samplePoints = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const bg = samplePoints.reduce(
    (acc, [x, y]) => {
      const index = (y * width + x) * 4;
      acc.r += data[index];
      acc.g += data[index + 1];
      acc.b += data[index + 2];
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );
  bg.r /= samplePoints.length;
  bg.g /= samplePoints.length;
  bg.b /= samplePoints.length;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const colorDistance = Math.hypot(r - bg.r, g - bg.g, b - bg.b);
    const lowSaturation = Math.max(r, g, b) - Math.min(r, g, b) < 34;

    if (brightness > 238 && colorDistance < 72) {
      data[i + 3] = 0;
    } else if (brightness > 218 && lowSaturation && colorDistance < 54) {
      data[i + 3] = Math.min(data[i + 3], 70);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const resizeImage = (file: File, maxWidth: number, maxHeight: number, options: { removeBackground?: boolean } = {}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const MAX_DATA_URL_LENGTH = 3_000_000; // Increased for high-resolution 8K support
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

          if (options.removeBackground) {
            removeLightBackground(ctx, canvas.width, canvas.height);
            let outputCanvas = canvas;
            let dataUrl = outputCanvas.toDataURL('image/png');

            while (dataUrl.length > MAX_DATA_URL_LENGTH && outputCanvas.width > 420 && outputCanvas.height > 280) {
              const nextWidth = Math.round(outputCanvas.width * 0.86);
              const nextHeight = Math.round(outputCanvas.height * 0.86);
              const smallerCanvas = document.createElement('canvas');
              smallerCanvas.width = nextWidth;
              smallerCanvas.height = nextHeight;
              const smallerCtx = smallerCanvas.getContext('2d');
              if (!smallerCtx) break;
              smallerCtx.imageSmoothingEnabled = true;
              smallerCtx.imageSmoothingQuality = 'high';
              smallerCtx.drawImage(outputCanvas, 0, 0, nextWidth, nextHeight);
              outputCanvas = smallerCanvas;
              dataUrl = outputCanvas.toDataURL('image/png');
            }

            if (dataUrl.length > MAX_DATA_URL_LENGTH) {
              reject(new Error('The transparent image is still too big. Please upload a smaller car image.'));
              return;
            }

            resolve(dataUrl);
            return;
          }
          
          let quality = 0.82;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, try to reduce quality progressively
          while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          if (dataUrl.length > MAX_DATA_URL_LENGTH) {
            reject(new Error('The image is still too big even after compression. Please upload a smaller file or use an image URL.'));
            return;
          }
          resolve(dataUrl);
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
const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }: any) => {
  const colors: any = { 
    blue: 'bg-blue-50 text-[#007ac2] ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    orange: 'bg-amber-50 text-amber-700 ring-amber-100',
    purple: 'bg-violet-50 text-violet-700 ring-violet-100'
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-card p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/70 border border-slate-200 flex flex-col justify-between relative overflow-hidden group transition-all">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-slate-800 to-emerald-500" />
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`w-11 h-11 rounded-card flex items-center justify-center ring-1 transition-transform group-hover:scale-105 ${colors[color] || colors.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${change.startsWith('+') ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100'}`}>
            {change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.18em] mb-2">{title}</p>
        <p className="text-3xl font-extrabold text-slate-950 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon, action }: any) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
    <div className="flex items-center gap-4">
      {Icon && <div className="w-10 h-10 rounded-card bg-slate-950 text-white flex items-center justify-center border border-slate-800 shadow-sm"><Icon className="w-5 h-5" /></div>}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const InputField = ({ label, error, helperText, ...props }: any) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <input {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-card focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
    {helperText && <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>}
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
);

const SelectField = ({ label, options, error, ...props }: any) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-600">{label}</label>
    <select {...props} className={`w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-card focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white`}>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
);

const TextAreaField = ({ label, ...props }: any) => (
  <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">{label}</label><textarea {...props} className="w-full px-3 py-2 border border-gray-200 rounded-card" /></div>
);

const GlobalLocationsContent = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState<any>({ iataCode: "", name: "", municipality: "", countryCode: "", type: "city" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async (keyword = "") => {
    setLoading(true);
    try {
      const url = `/api/admin/locations${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`;
      const res = await adminFetch(url);
      setLocations(Array.isArray(res) ? res : []);
    } catch (e: any) {
      console.error(e);
      alert("Failed to load locations: " + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(filter), 500);
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

  const resetForm = () => { setForm({ iataCode: "", name: "", municipality: "", countryCode: "", type: "city" }); setEditingId(null); };

  const handleSave = async () => {
    if ((!form.iataCode && form.type === "Airport") || !form.name) { alert("IATA code (for Airport) and Name are required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await adminFetch(`/api/admin/locations/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await adminFetch("/api/admin/locations", { method: "POST", body: JSON.stringify(form) });
      }
      await load();
      resetForm();
    } catch (e: any) { alert("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (loc: any) => { setEditingId(loc.id); setForm({ iataCode: loc.iataCode, name: loc.name, municipality: loc.municipality, countryCode: loc.countryCode, type: loc.type || "city" }); };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this location?")) return;
    try {
      await adminFetch(`/api/admin/locations/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) { alert("Delete failed: " + e.message); }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <SectionHeader title="Global Locations" subtitle="Manage searchable locations (airports & cities)" icon={Globe} action={null} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by code, city or name..." className="w-full pl-9 pr-3 py-2 border rounded-card" />
            </div>
            <button onClick={() => load(filter)} className="px-3 py-2 rounded-card bg-slate-900 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          <div className="overflow-auto rounded-card border">
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
                    <td className="p-3 font-mono text-xs">{l.iataCode || "-"}</td>
                    <td className="p-3">{l.name}</td>
                    <td className="p-3">{l.municipality}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.type === "Airport" ? "bg-blue-50 text-[#007ac2]" : "bg-slate-100 text-slate-600"}`}>{l.type || "City"}</span></td>
                    <td className="p-3">{l.countryCode}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(l)} className="px-3 py-1.5 text-xs rounded-card bg-blue-50 text-blue-800 font-bold mr-2"><Edit className="w-3 h-3 inline mr-1"/> Edit</button>
                      <button onClick={() => handleDelete(l.id)} className="px-3 py-1.5 text-xs rounded-card bg-red-50 text-red-700 font-bold"><Trash2 className="w-3 h-3 inline mr-1"/> Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-400">No locations</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-slate-50/50 rounded-card p-4 border">
          <h3 className="font-extrabold mb-3 text-slate-900">{editingId ? "Edit Location" : "Add New Location"}</h3>
          <div className="space-y-3">
            <SelectField label="Type" value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} options={[{value: "Airport", label: "Airport"}, {value: "city", label: "Down Town / City"}]} />
            <InputField label="IATA/Code" value={form.iataCode} onChange={(e: any) => setForm({ ...form, iataCode: e.target.value })} placeholder={form.type === "Airport" ? "e.g. AMM" : "Optional (e.g. AMMAN_DT)"} />
            <InputField label="Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Queen Alia Airport or Amman Down Town" />
            <InputField label="City" value={form.municipality} onChange={(e: any) => setForm({ ...form, municipality: e.target.value })} />
            <InputField label="Country Code" value={form.countryCode} onChange={(e: any) => setForm({ ...form, countryCode: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-card bg-[#007ac2] text-white font-bold text-sm disabled:opacity-50"><Save className="w-4 h-4 inline mr-1" /> Save</button>
              <button onClick={resetForm} className="px-4 py-2 rounded-card bg-white border font-bold text-sm">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ status }: { status: string }) => {
  const colors: any = { active: 'bg-green-100 text-green-700', pending: 'bg-blue-100 text-blue-800', approved: 'bg-blue-100 text-[#007ac2]', rejected: 'bg-red-100 text-red-700' };
  return <span className={`px-2 py-1 text-xs font-bold rounded-full border ${colors[status] || 'bg-gray-100'}`}>{status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending'}</span>;
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null;
  const sizes: any = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className={`bg-white rounded-card shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
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
        whileHover={{ x: 4 }} 
        whileTap={{ scale: 0.98 }}
        onClick={() => { setActiveSection(section); setIsOpen(false); }}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-card transition-all duration-300 group ${active ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
      >
        <div className="flex items-center gap-3.5">
            <div className={`p-2 rounded-card transition-all duration-300 ${active ? 'bg-blue-50' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-[#007ac2]' : 'text-slate-500 group-hover:text-white'}`} />
            </div>
            <span className={`text-[13px] font-extrabold tracking-tight ${active ? 'text-slate-950' : 'text-slate-300 group-hover:text-white'}`}>{label}</span>
        </div>
        {count !== undefined && count > 0 && (
            <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${active ? 'bg-blue-50 text-[#007ac2]' : 'bg-[#007ac2] text-white shadow-lg shadow-blue-900/20'}`}
            >
                {count}
            </motion.span>
        )}
      </motion.button>
    );
  };

  return (
    <>
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />}</AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-all duration-300 ease-in-out p-5 flex flex-col shadow-2xl shadow-slate-950/20 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 px-2 flex items-center gap-3.5 py-5 border-b border-white/10 relative group cursor-pointer">
            <div className="bg-white p-2.5 rounded-card shadow-lg shadow-black/20 transition-transform duration-300">
                <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
                <h1 className="font-extrabold text-white text-xl tracking-tighter leading-none">HogiCar</h1>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.45)]"></span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Admin Command</span>
                </div>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
          <div className="px-4 mb-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.3em]">Operations</div>
          <NavItem section="dashboard" label="Performance" icon={LayoutDashboard} />
          <NavItem section="suppliers" label="Manage Suppliers" icon={Building} />
          <NavItem section="supplierrequests" label="Requests" icon={MailQuestion} count={countSupplierRequests} />
          <NavItem section="bookings" label="Reservations" icon={Calendar} />
          <NavItem section="fleet" label="Active Fleet" icon={Car} />

          <div className="px-4 mb-3 mt-8 text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.3em]">Inventory</div>
          <NavItem section="promotions" label="Smart Offers" icon={Tag} />
          <NavItem section="carlibrary" label="Global Library" icon={Car} />
          <NavItem section="apipartners" label="Integrations" icon={Share2} />
          <NavItem section="affiliates" label="Affiliate Hub" icon={DollarSign} />

          <div className="px-4 mb-3 mt-8 text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.3em]">System</div>
          <NavItem section="cms" label="Pages" icon={FileText} />
          <NavItem section="seo" label="SEO" icon={Globe} />
          <NavItem section="homepage" label="Assets" icon={ImageIcon} />
          <NavItem section="sitesettings" label="Config" icon={Settings} />
          <NavItem section="globallocations" label="Global Locations" icon={Globe} />
          <NavItem section="homepagelogos" label="Homepage Logos" icon={ImageIcon} />
          <NavItem section="searchinglogos" label="Searching Logos" icon={Search} />
        </nav>

        <div className="mt-5 rounded-card bg-white/[0.06] border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-card bg-emerald-400/10 text-emerald-300 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-white uppercase tracking-[0.16em]">Root access</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Enterprise control plane</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <motion.button 
            whileHover={{ x: 4 }} 
            onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin-login'); }} 
            className="flex items-center w-full px-4 py-4 text-slate-400 hover:bg-red-500/10 hover:text-red-300 rounded-card transition-all group font-extrabold text-sm uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
};

// ==================== Location Picker (working, searchable) ====================
const LocationPicker = ({ onSelect, placeholder = "Search location..." }: any) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timer = useRef<any>();

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetchLocations(query);
        setSuggestions(res);
        setIsOpen(res.length > 0);
      } catch(e) { console.error(e); } finally { setLoading(false); }
    }, 300);
  }, [query]);

  const handleSelect = (loc: LocationSuggestion) => {
    setQuery('');
    setIsOpen(false);
    if (onSelect) onSelect(loc);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-card focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-card shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center"><RefreshCw className="w-4 h-4 animate-spin inline" /> Loading...</div>
          ) : (
            suggestions.map(loc => (
              <button
                key={loc.value}
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 transition-colors flex items-center gap-3"
              >
                <div className={`p-1.5 rounded-card ${loc.type === 'airport' ? 'bg-blue-50 text-[#007ac2]' : 'bg-slate-50 text-slate-600'}`}>
                  {loc.type === 'airport' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">{loc.label}</span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{loc.iataCode || 'CITY'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Edit Supplier Modal (with location picker) ====================
const supplierRatingMetrics = [
  { field: 'ratingStaffService', label: 'Staff helpfulness' },
  { field: 'ratingCondition', label: 'Car condition' },
  { field: 'ratingEaseOfLocating', label: 'Ease of locating' },
  { field: 'ratingValueForMoney', label: 'Value for money' },
  { field: 'ratingDropoffSpeed', label: 'Drop-off speed' },
  { field: 'ratingPickupSpeed', label: 'Pick-up speed' },
  { field: 'ratingCleanliness', label: 'Car cleanliness' }
] as const;

const ratingToDefaultPercent = (rating: number | undefined) => {
  const score = Number(rating || 4.5);
  return Math.round(Math.max(0, Math.min(100, score > 5 ? score * 10 : score * 20)));
};

const EditSupplierModal = ({ supplier, isOpen, onClose, onSave, onCopy }: any) => {
  const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
  const [selectedLocations, setSelectedLocations] = useState<any[]>([]);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [customLocs, setCustomLocs] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCredentials = async () => {
    if (!editedSupplier.name) return alert("Please enter company name first");
    if (editedSupplier.id && !window.confirm("This will overwrite credentials. Continue?")) return;
    setIsGenerating(true);
    try {
      const resp = await adminFetch("/api/admin/suppliers/generate-credentials", {
        method: "POST",
        body: JSON.stringify({ name: editedSupplier.name, email: editedSupplier.contactEmail })
      });
      setEditedSupplier(prev => ({ ...prev, email: resp.username, password: resp.password }));
      setShowPassword(true);
    } catch (e: any) { alert("Failed to generate: " + e.message); }
    finally { setIsGenerating(false); }
  };

  useEffect(() => {
    const stored = localStorage.getItem("hogicar_custom_locations");
    if (stored) setCustomLocs(JSON.parse(stored));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setEditedSupplier(supplier || {});
      if (supplier?.locations && supplier.locations.length > 0)
        setSelectedLocations(Array.isArray(supplier.locations) ? supplier.locations.map((l: any) => ({ label: l.displayName || l.location, value: l.locationCode })) : []);
      else if (supplier?.location && supplier?.locationCode)
        setSelectedLocations([{ label: supplier.location, value: supplier.locationCode }]);
      else setSelectedLocations([]);
    }
  }, [supplier, isOpen]);

  const handleChange = (field: any, val: any) => setEditedSupplier(prev => ({ ...prev, [field]: val }));
  const handleLogo = async (e: any) => {
    if (e.target.files?.[0]) {
      try {
        const resized = await resizeImage(e.target.files[0], 800, 400);
        setEditedSupplier(prev => ({ ...prev, logoUrl: resized, logo: "" }));
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => setEditedSupplier(prev => ({ ...prev, logoUrl: reader.result as string, logo: "" }));
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
    if (!newLocName) return alert("Enter location name");
    let code = newLocCode.trim().toUpperCase() || newLocName.replace(/[^a-zA-Z0-9]/g, "").substring(0,6).toUpperCase();
    const newLoc = { label: newLocName, value: code };
    const updated = [...customLocs, newLoc];
    setCustomLocs(updated);
    localStorage.setItem("hogicar_custom_locations", JSON.stringify(updated));
    handleLocSelect(newLoc);
    setNewLocName("");
    setNewLocCode("");
  };

  const handleSave = () => {
    if (!editedSupplier.name || !editedSupplier.contactEmail) return alert("Name and contact email required");
    if (selectedLocations.length === 0) return alert("Select at least one location");
    const finalSupplier = {
      ...editedSupplier,
      email: editedSupplier.email || editedSupplier.contactEmail,
      locations: selectedLocations.map(l => ({ displayName: l.label, locationCode: l.value })),
      bookingMode: editedSupplier.bookingMode || "FREE_SALE",
      commissionType: editedSupplier.commissionType || "PARTIAL_PREPAID",
      commissionPercent: editedSupplier.commissionPercent || 0.15,
      pickupType: editedSupplier.pickupType || "IN_TERMINAL",
      includesCDW: editedSupplier.includesCDW ?? true,
      includesTP: editedSupplier.includesTP ?? true,
      gracePeriodHours: editedSupplier.gracePeriodHours || 0,
      minBookingLeadTime: editedSupplier.minBookingLeadTime || 0,
      minRentalDays: editedSupplier.minRentalDays || 1,
      maxRentalDays: editedSupplier.maxRentalDays || 30,
      maxBookingLeadTimeDays: editedSupplier.maxBookingLeadTimeDays || 365,
      logoScale: editedSupplier.logoScale || 100,
      logoScaleMobile: editedSupplier.logoScaleMobile || 100,
      oneWayFee: editedSupplier.oneWayFee || 0,
      connectionType: editedSupplier.connectionType || "manual",
      rating: editedSupplier.rating || 4.5,
      ratingReviewCount: editedSupplier.ratingReviewCount || 0,
      ratingCleanliness: editedSupplier.ratingCleanliness ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingCondition: editedSupplier.ratingCondition ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingValueForMoney: editedSupplier.ratingValueForMoney ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingPickupSpeed: editedSupplier.ratingPickupSpeed ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingDropoffSpeed: editedSupplier.ratingDropoffSpeed ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingStaffService: editedSupplier.ratingStaffService ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingEaseOfLocating: editedSupplier.ratingEaseOfLocating ?? ratingToDefaultPercent(editedSupplier.rating)
    };
    if (!finalSupplier.id) finalSupplier.status = "active";
    if (!finalSupplier.password) finalSupplier.password = "changeMe123!";
    onSave(finalSupplier);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier?.id ? "Edit Supplier" : "Add Supplier"} size="lg">
      <div className="space-y-6">
        {/* Logo section */}
        <div className="flex gap-6 p-6 bg-gradient-to-br from-blue-50 to-white rounded-card border border-blue-100/50">
          <div className="flex flex-col items-center">
            <div className="relative group w-48 h-32">
              {editedSupplier.logo || editedSupplier.logoUrl ? (
                <img src={editedSupplier.logo || editedSupplier.logoUrl} className="w-full h-full rounded-card object-contain bg-white shadow-xl border-4 border-white" alt="Logo" width="192" height="128" />
              ) : (
                <div className="w-full h-full bg-white rounded-card flex items-center justify-center border-2 border-dashed border-gray-200">
                  <Building className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-card cursor-pointer">
                <ImageIcon className="w-6 h-6 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleLogo} />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Logo (auto-resized)</p>
          </div>
          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Name" value={editedSupplier.name || ""} onChange={e => handleChange("name", e.target.value)} />
              <InputField label="Reservation Email" value={editedSupplier.contactEmail || ""} onChange={e => handleChange("contactEmail", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Pickup Type" value={editedSupplier.pickupType || "IN_TERMINAL"} onChange={e => handleChange("pickupType", e.target.value)} options={[
                { value: "IN_TERMINAL", label: "In Terminal" },
                { value: "MEET_AND_GREET", label: "Meet & Greet" },
                { value: "SHUTTLE_BUS", label: "Shuttle Bus" }
              ]} />
              <div className="bg-white px-3 py-1.5 rounded-card border border-gray-200">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Supplier Rating (1-10)</label>
                <div className="flex items-center gap-3 mt-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <input 
                    type="range" min="1" max="10" step="0.1" 
                    value={editedSupplier.rating || 4.5} 
                    onChange={e => handleChange("rating", parseFloat(e.target.value))}
                    className="flex-grow h-1.5 bg-gray-200 rounded-card appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-sm font-extrabold text-gray-700 min-w-[2rem]">{editedSupplier.rating || 4.5}</span>
                </div>
              </div>
            </div>
            <div className="rounded-card border border-gray-200 bg-white p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-gray-800">Customer rating details</h3>
                  <p className="mt-1 text-[11px] font-medium text-gray-400">Controls the dark rating pop-up bars on search cards.</p>
                </div>
                <div className="w-full sm:w-40">
                  <InputField
                    label="Review Count"
                    type="number"
                    min="0"
                    value={editedSupplier.ratingReviewCount ?? 0}
                    onChange={e => handleChange("ratingReviewCount", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {supplierRatingMetrics.map(metric => {
                  const metricValue = Number((editedSupplier as any)[metric.field] ?? ratingToDefaultPercent(editedSupplier.rating));
                  return (
                    <div key={metric.field} className="rounded-card border border-gray-100 bg-gray-50 px-3 py-2.5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">{metric.label}</label>
                        <span className="text-xs font-extrabold text-gray-900">{metricValue}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={metricValue}
                        onChange={e => handleChange(metric.field, parseInt(e.target.value) || 0)}
                        className="h-2 w-full cursor-pointer appearance-none rounded-card bg-gray-200 accent-[#5fd018]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <InputField 
              label="Supplier Logo URL" 
              icon={Globe}
              value={editedSupplier.logoUrl || editedSupplier.logo || ""} 
              onChange={e => setEditedSupplier(prev => ({ ...prev, logoUrl: e.target.value, logo: "" }))} 
              placeholder="https://example.com/logo.png"
              helperText="Paste a direct image URL or use the upload button on the left."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Phone" value={editedSupplier.phone || ""} onChange={e => handleChange("phone", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#007ac2]" /><h3 className="text-sm font-bold">Service Locations</h3></div>
          <div className="bg-white p-4 rounded-card border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Add New Location</label>
              <LocationPicker onSelect={handleLocSelect} />
            </div>
            {selectedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map(loc => (
                  <div key={loc.value} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-card">
                    <span className="text-xs font-bold">{loc.label} ({loc.value})</span>
                    <button onClick={() => removeLocation(loc.value)}><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase block text-center">Or create custom location</label>
              <div className="flex gap-2 mt-2">
                <input placeholder="City Name" value={newLocName} onChange={e => setNewLocName(e.target.value)} className="flex-1 px-3 py-2 border rounded-card text-sm" />
                <input placeholder="Code" value={newLocCode} onChange={e => setNewLocCode(e.target.value.toUpperCase())} className="w-16 px-3 py-2 border rounded-card text-sm" />
                <button onClick={handleCreateCustom} className="p-2 bg-gray-800 text-white rounded-card hover:bg-gray-700"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Commission & Business Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-card border border-gray-100">
            <h4 className="text-xs font-bold mb-2">Commission</h4>
            <SelectField label="Type" value={editedSupplier.commissionType || "PARTIAL_PREPAID"} onChange={e => handleChange("commissionType", e.target.value)} options={[
              { value: "FULL_PREPAID", label: "Full Prepaid" },
              { value: "PARTIAL_PREPAID", label: "Partial Prepaid" },
              { value: "PAY_AT_DESK", label: "Pay at Desk" }
            ]} />
            <InputField label="Commission %" type="number" step="0.01" value={editedSupplier.commissionPercent || 0} onChange={e => handleChange("commissionPercent", parseFloat(e.target.value))} />
          </div>
          <div className="bg-white p-4 rounded-card border border-gray-100">
            <h4 className="text-xs font-bold mb-2">Booking Policy</h4>
            <SelectField label="Mode" value={editedSupplier.bookingMode || "FREE_SALE"} onChange={e => handleChange("bookingMode", e.target.value)} options={[
              { value: "FREE_SALE", label: "Free Sale (Instant)" },
              { value: "ON_REQUEST", label: "On Request (Manual)" }
            ]} />
            <SelectField label="Connection" value={editedSupplier.connectionType || "manual"} onChange={e => handleChange("connectionType", e.target.value)} options={[
              { value: "manual", label: "Manual Entry" },
              { value: "api", label: "Real-time API" }
            ]} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Min Duration (days)</label>
            <input type="number" value={editedSupplier.minRentalDays ?? 1} onChange={e => handleChange("minRentalDays", parseInt(e.target.value) || 1)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Max Duration (days)</label>
            <input type="number" value={editedSupplier.maxRentalDays ?? 30} onChange={e => handleChange("maxRentalDays", parseInt(e.target.value) || 30)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Grace Period (hrs)</label>
            <input type="number" value={editedSupplier.gracePeriodHours ?? 0} onChange={e => handleChange("gracePeriodHours", parseInt(e.target.value) || 0)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Min Lead Time (hrs)</label>
            <input type="number" value={editedSupplier.minBookingLeadTime ?? 0} onChange={e => handleChange("minBookingLeadTime", parseInt(e.target.value) || 0)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Max Lead Time (days)</label>
            <input type="number" value={editedSupplier.maxBookingLeadTimeDays ?? 365} onChange={e => handleChange("maxBookingLeadTimeDays", parseInt(e.target.value) || 365)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">One Way Fee</label>
            <input type="number" value={editedSupplier.oneWayFee ?? 0} onChange={e => handleChange("oneWayFee", parseFloat(e.target.value) || 0)} className="w-full border rounded-card p-2 mt-1" />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-card p-6 border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2"><Lock className="w-5 h-5 text-gray-600" /><span className="font-bold">Access Credentials</span></div>
            <button onClick={handleGenerateCredentials} disabled={isGenerating} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-card">Auto-generate</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Login Email" value={editedSupplier.email || editedSupplier.contactEmail || ""} onChange={e => handleChange("email", e.target.value)} />
            <div className="relative">
              <InputField label="Password" type={showPassword ? "text" : "password"} value={editedSupplier.password || ""} onChange={e => handleChange("password", e.target.value)} />
              <div className="absolute right-3 top-[34px] flex items-center gap-2">
                <button 
                  onClick={() => onCopy(editedSupplier.password || "", "edit-modal", "Password")} 
                  className="text-gray-400 hover:text-[#007ac2] transition-colors"
                  title="Copy Password"
                  type="button"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="text-gray-400 hover:text-slate-900 transition-colors"
                  type="button"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={editedSupplier.enableSocialProof || false} 
                onChange={e => handleChange("enableSocialProof", e.target.checked)} 
                className="w-4 h-4 rounded border-slate-300 text-[#007ac2] focus:ring-blue-500"
              /> 
              <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Enable Social Proof</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={editedSupplier.hogicarChoice || false} 
                onChange={e => handleChange("hogicarChoice", e.target.checked)} 
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              /> 
              <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-900 transition-colors flex items-center gap-1">
                <Award className="w-3 h-3" />
                Hogicar Choice
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500">Cancel</button>
          <button onClick={handleSave} className="px-8 py-2 bg-[#007ac2] text-white rounded-card font-bold">Save Supplier</button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== Supplier Requests ====================
const SupplierRequestsContent = ({ apps, onApprove, onReject, onRefresh }: any) => {
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

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    if (Array.isArray(dateVal)) return dateVal.join('-');
    return dateVal.toString();
  };

  return (
    <div className="bg-white rounded-card shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <SectionHeader title="Supplier Requests" icon={MailQuestion} subtitle="New partner applications for review" />
          <button onClick={onRefresh} className="p-2 hover:bg-white rounded-card border border-gray-200 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
      </div>
      
      {!apps.length ? (
        <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <MailQuestion className="w-8 h-8" />
            </div>
            <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">No pending requests</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Fleet</th>
                <th className="px-6 py-4">Integration</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {apps.map((app: any) => (
                <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-900 text-[13px]">{app.companyName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{app.primaryLocation}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[12px] font-bold text-slate-700">{app.contactName}</div>
                    <div className="text-[11px] text-[#007ac2] font-medium lowercase mt-0.5">{app.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        {app.fleetSize}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-extrabold px-2 py-1 rounded-md uppercase tracking-widest ${app.integrationType === 'api' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-[#007ac2]'}`}>
                        {app.integrationType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-400 font-bold">
                    {formatDate(app.submissionDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleApprove(app)} 
                        className="p-2 bg-green-500 text-white rounded-card shadow-md shadow-green-100 hover:bg-green-600 transition-colors"
                        title="Approve & Setup Account"
                      >
                        <CheckCircle className="w-4 h-4"/>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => onReject(app.id)} 
                        className="p-2 bg-red-100 text-red-600 rounded-card hover:bg-red-200 transition-colors"
                        title="Reject Application"
                      >
                        <XCircle className="w-4 h-4"/>
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ==================== Bookings ====================
const BookingsContent = ({ bookings, onRefresh }: any) => (
  <div className="bg-white rounded-card shadow-lg border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <SectionHeader title="Bookings" icon={Calendar} subtitle="Monitor all car rental reservations" />
        <button onClick={onRefresh} className="p-2 hover:bg-white rounded-card border border-gray-200 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
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
            <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
              <td className="px-6 py-4">
                <span className="font-mono text-[11px] font-extrabold text-[#007ac2] bg-blue-50/50 px-2 py-1 rounded-card group-hover:bg-white transition-colors">
                    {b.bookingRef}
                </span>
              </td>
              <td className="px-6 py-4 text-[13px] font-extrabold text-slate-900">
                {b.firstName} {b.lastName}
              </td>
              <td className="px-6 py-4 text-[12px] font-bold text-slate-500">
                {b.supplierName || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase">
                    <span className="text-[#007ac2] bg-blue-50/50 px-1.5 py-0.5 rounded-md border border-blue-100/50">{b.pickupCode}</span>
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
  <div className="bg-white rounded-card shadow-lg p-6">
    <SectionHeader title="CMS" icon={FileText} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {pages.map((page: any) => (
        <div key={page.slug} className="p-3 border rounded-card">
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
const SeoContent = ({ configs, onEditSeo, onNewSeo, onDeleteSeo, loading }: any) => {
  const getScore = (c: any) => {
    let score = 0;
    if (c.title && c.title.length >= 30 && c.title.length <= 60) score += 40;
    if (c.description && c.description.length >= 120 && c.description.length <= 160) score += 40;
    if (c.keywords) score += 20;
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-card shadow-sm border border-slate-200">
        <div>
          <SectionHeader title="SEO Management" icon={Globe} />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Optimize your pages for search engines</p>
        </div>
        <button 
          onClick={onNewSeo} 
          className="flex items-center gap-2 bg-[#007ac2] hover:bg-[#00619a] text-white px-4 py-2 rounded-card font-extrabold text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add SEO Route
        </button>
      </div>

      <div className="bg-white rounded-card shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <LoaderCircle className="w-8 h-8 text-[#007ac2] animate-spin" />
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Fetching configs...</span>
          </div>
        ) : configs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Globe className="w-8 h-8 text-slate-200" />
            </div>
            <p className="font-extrabold uppercase tracking-widest text-xs">No SEO configurations found</p>
            <p className="text-[10px] mt-1">Start by adding a new route to optimize.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Route & Title</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">SEO Score</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configs.map((c: any) => {
                  const score = getScore(c);
                  return (
                    <tr key={c.route} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-[#007ac2] bg-blue-50 px-2 py-0.5 rounded-full w-fit mb-1">{c.route}</span>
                          <span className="text-sm font-extrabold text-slate-900 truncate max-w-md">{c.title || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {c.published !== false ? (
                              <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-wider">
                                <Activity className="w-2.5 h-2.5" />
                                Draft
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {c.indexable !== false ? (
                              <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#007ac2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                                <Globe className="w-2.5 h-2.5" />
                                Index
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider">
                                <XCircle className="w-2.5 h-2.5" />
                                NoIndex
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 w-fit px-2 py-1 rounded border text-[10px] font-extrabold uppercase tracking-widest ${getScoreColor(score)}`}>
                          <Activity className="w-3 h-3" />
                          {score}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onEditSeo(c)}
                            className="p-2 text-slate-400 hover:text-[#007ac2] hover:bg-blue-50 rounded-card transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDeleteSeo(c.route)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-card transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== Homepage ====================
const HomepageContentSection = ({ content, categoryImages, onSave, isSaving }: any) => {
  const [localContent, setLocalContent] = useState(content || {});
  const [localCategoryImages, setLocalCategoryImages] = useState<Record<string, string>>(categoryImages || {});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalContent(content || {});
  }, [content]);

  useEffect(() => {
    setLocalCategoryImages(categoryImages || {});
  }, [categoryImages]);

  const formatCategoryLabel = (category: string) =>
    category
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const resolveDestinationImage = (destination: any) => {
    const image = typeof destination?.image === 'string' ? destination.image.trim() : '';
    if (image) {
      return image;
    }

    return typeof destination?.imageUrl === 'string' ? destination.imageUrl.trim() : '';
  };

  const fallbackDestinations =
    (MOCK_HOMEPAGE_CONTENT as any)?.popularDestinations?.destinations || [];

  const getDefaultDestination = (index: number) => {
    const fallback = fallbackDestinations[index] || fallbackDestinations[0] || {};
    return {
      id: fallback.id || `d${index + 1}`,
      name: fallback.name || '',
      country: fallback.country || '',
      price: Number(fallback.price) || 0,
      image: fallback.image || ''
    };
  };

  const currentDestinations = Array.isArray(localContent?.popularDestinations?.destinations)
    ? localContent.popularDestinations.destinations.map((destination: any, index: number) => {
        const fallback = getDefaultDestination(index);
        const safeDestination = destination && typeof destination === 'object' ? destination : {};
        return {
          ...fallback,
          ...safeDestination,
          id: safeDestination.id || fallback.id,
          image: resolveDestinationImage(safeDestination)
        };
      })
    : [];

  const updateDestinationField = (index: number, field: string, value: string | number) => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));

      if (!next.popularDestinations || typeof next.popularDestinations !== 'object') {
        next.popularDestinations = {};
      }

      const destinations = Array.isArray(next.popularDestinations.destinations)
        ? [...next.popularDestinations.destinations]
        : [];

      while (destinations.length <= index) {
        destinations.push(getDefaultDestination(destinations.length));
      }

      const existing = destinations[index] && typeof destinations[index] === 'object'
        ? destinations[index]
        : getDefaultDestination(index);

      const normalizedValue = field === 'price' ? Number(value) || 0 : value;

      if (field === 'image') {
        const imageValue = String(normalizedValue || '');
        destinations[index] = {
          ...existing,
          id: existing.id || `d${index + 1}`,
          image: imageValue,
          imageUrl: imageValue
        };
      } else {
        destinations[index] = {
          ...existing,
          id: existing.id || `d${index + 1}`,
          [field]: normalizedValue
        };
      }

      next.popularDestinations.destinations = destinations;
      return next;
    });
  };

  const addDestination = () => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      if (!next.popularDestinations || typeof next.popularDestinations !== 'object') {
        next.popularDestinations = {};
      }
      const destinations = Array.isArray(next.popularDestinations.destinations)
        ? [...next.popularDestinations.destinations]
        : [];
      destinations.push(getDefaultDestination(destinations.length));
      next.popularDestinations.destinations = destinations;
      return next;
    });
  };

  const removeDestination = (index: number) => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      const destinations = Array.isArray(next?.popularDestinations?.destinations)
        ? [...next.popularDestinations.destinations]
        : [];

      destinations.splice(index, 1);

      if (!next.popularDestinations || typeof next.popularDestinations !== 'object') {
        next.popularDestinations = {};
      }
      next.popularDestinations.destinations = destinations;
      return next;
    });
  };

  const handleDestinationImageUpload = async (index: number, file?: File) => {
    if (!file) return;

    try {
      const base64 = await resizeImage(file, 900, 540);
      updateDestinationField(index, 'image', base64);
    } catch (error: any) {
      alert(`Failed to process destination image: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    await onSave(localContent, localCategoryImages);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (path: string, val: string) => {
    const parts = path.split('.');
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const newState = JSON.parse(JSON.stringify(base));
      let cur = newState;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!cur[part] || typeof cur[part] !== 'object') {
          cur[part] = {};
        }
        cur = cur[part];
      }
      cur[parts[parts.length - 1]] = val;
      return newState;
    });
  };

  const handleCategoryImageUpload = async (category: string, file?: File) => {
    if (!file) return;
    try {
      const resized = await resizeImage(file, 320, 210);
      setLocalCategoryImages(prev => ({ ...prev, [category]: resized }));
    } catch (e: any) {
      console.error(`Failed to resize category image for ${category}`, e);
      alert(e?.message || 'Failed to process image. Please try a smaller file or paste a direct image URL.');
    }
  };

  return (
    <div className="bg-white rounded-card shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h2 className="text-xl font-bold text-slate-900">Homepage Editor</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-bold">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#007ac2] text-white px-4 py-2 rounded-card font-bold text-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-card border border-slate-200 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#007ac2]" />
          Hero Section Builder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Hero Title" value={localContent?.hero?.title || ''} onChange={e => handleChange('hero.title', e.target.value)} />
          <InputField label="Hero Subtitle" value={localContent?.hero?.subtitle || ''} onChange={e => handleChange('hero.subtitle', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Hero Background Image" value={localContent?.hero?.backgroundImage || ''} onChange={e => handleChange('hero.backgroundImage', e.target.value)} />
          <InputField label="Hero Background Video" value={localContent?.hero?.video || ''} onChange={e => handleChange('hero.video', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Button Text" value={localContent?.hero?.buttonText || ''} onChange={e => handleChange('hero.buttonText', e.target.value)} />
          <InputField label="Button Link" value={localContent?.hero?.buttonLink || ''} onChange={e => handleChange('hero.buttonLink', e.target.value)} />
          <InputField label="Text Color" type="color" value={localContent?.hero?.textColor || '#FFFFFF'} onChange={e => handleChange('hero.textColor', e.target.value)} />
        </div>
        <InputField label="FAQs Section Title" value={localContent?.faqs?.title || ''} onChange={e => handleChange('faqs.title', e.target.value)} />
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900 mb-1">Category Filter Images</h3>
        <p className="text-xs text-slate-500 mb-4">Upload an image per category to display in the category filter section.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.values(CarCategory).map((category) => {
            const imageUrl = localCategoryImages?.[category] || '';
            const fileInputId = `homepage-category-image-${category}`;

            return (
              <div key={category} className="border border-slate-200 rounded-card p-4 space-y-3 bg-slate-50/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-slate-800">{formatCategoryLabel(category)}</div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{category}</span>
                </div>

                <div className="h-24 rounded-card border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`${category} category`} className="w-full h-full object-cover" width="320" height="210" loading="lazy" />
                  ) : (
                    <div className="text-[11px] font-bold text-slate-400">No image</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      await handleCategoryImageUpload(category, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={fileInputId}
                    className="flex-1 text-center bg-white border border-blue-200 text-[#007ac2] rounded-card px-3 py-2 text-xs font-bold cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    Upload Image
                  </label>
                  <button
                    type="button"
                    onClick={() => setLocalCategoryImages(prev => ({ ...prev, [category]: '' }))}
                    className="px-3 py-2 rounded-card border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setLocalCategoryImages(prev => ({ ...prev, [category]: e.target.value }))}
                  placeholder="Or paste image URL"
                  className="w-full bg-white border border-slate-200 rounded-card px-3 py-2 text-xs text-slate-700"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Popular Destinations</h3>
            <p className="text-xs text-slate-500">Manage destination cards shown on the home page.</p>
          </div>
          <button
            type="button"
            onClick={addDestination}
            className="px-3 py-2 rounded-card bg-[#007ac2] text-white text-xs font-extrabold hover:bg-blue-800 transition-colors"
          >
            Add Destination
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InputField
            label="Section Title"
            value={localContent?.popularDestinations?.title || ''}
            onChange={e => handleChange('popularDestinations.title', e.target.value)}
          />
          <InputField
            label="Section Subtitle"
            value={localContent?.popularDestinations?.subtitle || ''}
            onChange={e => handleChange('popularDestinations.subtitle', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {currentDestinations.map((destination: any, index: number) => (
            <div key={destination?.id || `destination-${index}`} className="rounded-card border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-extrabold text-slate-800">Destination #{index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeDestination(index)}
                  className="px-2.5 py-1.5 rounded-card border border-red-100 text-red-500 text-[11px] font-extrabold hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <InputField
                  label="Name (Search Query)"
                  value={destination?.name || ''}
                  onChange={e => updateDestinationField(index, 'name', e.target.value)}
                />
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Destination Image</label>
                <div className="h-28 rounded-card border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {destination?.image ? (
                    <img
                      src={destination.image}
                      alt={`${destination?.name || 'Destination'} preview`}
                      className="w-full h-full object-cover"
                      width="320"
                      height="180"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-[11px] font-bold text-slate-400">No image</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id={`popular-destination-image-${index}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      await handleDestinationImageUpload(index, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`popular-destination-image-${index}`}
                    className="flex-1 text-center bg-white border border-blue-200 text-[#007ac2] rounded-card px-3 py-2 text-xs font-bold cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    Upload Image
                  </label>
                  <button
                    type="button"
                    onClick={() => updateDestinationField(index, 'image', '')}
                    className="px-3 py-2 rounded-card border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <InputField
                  label="Image URL"
                  value={destination?.image || destination?.imageUrl || ''}
                  onChange={e => updateDestinationField(index, 'image', e.target.value)}
                />
              </div>
            </div>
          ))}

          {currentDestinations.length === 0 && (
            <div className="rounded-card border border-dashed border-slate-300 bg-slate-50 p-4 text-xs font-bold text-slate-500">
              No destinations yet. Click <span className="text-slate-700">Add Destination</span> to create one.
            </div>
          )}
        </div>
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

  if (loading) return <div className="p-8 text-center text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading Settings...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 bg-gray-50/30">
        <SectionHeader title="Site Configuration" icon={Settings} subtitle="Global behavior and design settings" />
      </div>
      <div className="p-8 space-y-6">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Searching Screen Duration (seconds)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))} 
            className="w-full bg-slate-50 border border-slate-100 rounded-card p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Homepage Hero Background Image URL</label>
          <input 
            type="text" 
            value={heroImageUrl} 
            onChange={e => setHeroImageUrl(e.target.value)} 
            placeholder="https://example.com/image.jpg"
            className="w-full bg-slate-50 border border-slate-100 rounded-card p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono" 
          />
          <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Recommended size: 2000x1200px</p>
        </div>
        
        {heroImageUrl && (
          <div className="mt-4">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Preview</label>
            <div className="relative aspect-video rounded-card overflow-hidden border border-slate-100 bg-slate-50">
              <img src={heroImageUrl} alt="Hero Preview" className="w-full h-full object-cover" width="1280" height="720" />
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center gap-4">
          <button 
            onClick={handleSave} 
            className="bg-[#007ac2] text-white px-8 py-3 rounded-card font-extrabold text-sm shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-extrabold text-xs uppercase tracking-widest flex items-center gap-1">
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
    return (<Modal isOpen={isOpen} onClose={onClose} title="Edit Commission"><InputField label="Rate (decimal)" type="number" step="0.01" value={rate} onChange={e => setRate(parseFloat(e.target.value))} /><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={() => onSave(affiliate.id, rate)} className="bg-[#007ac2] text-white px-3 py-1 rounded">Save</button></div></Modal>);
  };
  return (
    <div className="bg-white rounded-card shadow-lg p-6">
      <SectionHeader title="Affiliates" icon={DollarSign} />
      <EditModal affiliate={editingAffiliate} isOpen={!!editingAffiliate} onClose={() => setEditingAffiliate(null)} onSave={onSaveCommission} />
      <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr className="text-xs"><th>Name</th><th>Status</th><th>Commission</th><th>Clicks</th><th>Conversions</th><th>Earnings</th><th></th></tr></thead><tbody>{affiliates.map((aff: any) => (<tr key={aff.id} className="hover:bg-blue-50"><td className="p-2"><div className="font-bold">{aff.name}</div><div className="text-xs">{aff.email}</div></td><td className="p-2"><Badge status={aff.status}/></td><td className="p-2">{aff.commissionRate*100}%</td><td className="p-2">{aff.clicks}</td><td className="p-2">{aff.conversions}</td><td className="p-2">${aff.totalEarnings}</td><td className="p-2 text-right"><div className="flex gap-1">{aff.status === 'pending' && <><button onClick={() => onUpdateStatus(aff.id, 'active')} className="bg-green-100 p-1 rounded"><CheckCircle className="w-4 h-4"/></button><button onClick={() => onUpdateStatus(aff.id, 'rejected')} className="bg-red-100 p-1 rounded"><XCircle className="w-4 h-4"/></button></>}<button onClick={() => setEditingAffiliate(aff)} className="bg-gray-100 p-1 rounded"><Edit className="w-4 h-4"/></button></div></td></tr>))}</tbody></table></div>
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
    <div className="bg-white rounded-card shadow-lg p-6">
      <SectionHeader title="Promotions" icon={Tag} />
      <form onSubmit={handleAdd} className="flex gap-2 mb-4"><input type="text" placeholder="Code" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} className="border rounded p-1" /><input type="number" placeholder="%" value={newDiscount} onChange={e => setNewDiscount(parseInt(e.target.value))} className="border rounded p-1 w-16" /><button type="submit" className="bg-[#007ac2] text-white px-3 py-1 rounded">Add</button></form>
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return library;
    const q = searchQuery.toLowerCase().trim();
    return (library || []).filter((m: any) => 
      (m.make && m.make.toLowerCase().includes(q)) || 
      (m.model && m.model.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.type && m.type.toLowerCase().includes(q))
    );
  }, [library, searchQuery]);

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
        <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Global Car Library</h2>
            <p className="text-sm text-gray-500 font-medium mb-4">Define models available for all supply partners</p>
            
            <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Search by make or model..." 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-card text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <button onClick={() => onEdit(null)} className="bg-[#007ac2] text-white px-6 py-2.5 rounded-card font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Add New Model
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Visual</th>
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Vehicle Details</th>
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Year</th>
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Category</th>
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Body Type</th>
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.isArray(filteredLibrary) && filteredLibrary.map((m: any) => (
              <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-4">
                  <div className="w-16 h-10 rounded-card bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-1 group-hover:border-blue-200 transition-colors">
                    <img src={m.image || m.imageUrl} className="max-w-full max-h-full object-contain" alt={m.model} width="400" height="250" referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="text-[13px] font-extrabold text-slate-900">{m.make}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{m.model}</div>
                </td>
                <td className="px-8 py-4 text-xs font-extrabold text-slate-500">{m.year}</td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest bg-blue-50 text-[#007ac2] rounded-card border border-blue-100/50">
                    {formatEnum(m.category)}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest bg-blue-50 text-[#007ac2] rounded-card border border-blue-100/50">
                    {formatEnum(m.type)}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(m)} className="p-2 bg-white border border-slate-100 rounded-card text-slate-400 hover:text-[#007ac2] hover:border-blue-100 transition-all shadow-sm">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(m.id)} className="p-2 bg-white border border-slate-100 rounded-card text-slate-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
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
const SuppliersContent = ({ suppliers, fetchError, onEdit, onApprove, onManageApi, onManageFleet, onAddSupplier, onRefresh, onDelete, onFixData, revealedPasswords, onCopy }: any) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSuppliers = useMemo(() => {
        if (!searchQuery.trim()) return suppliers;
        const q = searchQuery.toLowerCase().trim();
        return suppliers.filter((s: any) => 
            s.name.toLowerCase().includes(q) || 
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.contactEmail && s.contactEmail.toLowerCase().includes(q)) ||
            (Array.isArray(s.locations) && s.locations.some((l: any) => 
                (l.locationCode && l.locationCode.toLowerCase().includes(q)) || 
                (l.displayName && l.displayName.toLowerCase().includes(q))
            ))
        );
    }, [suppliers, searchQuery]);

    return (
  <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
        <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Manage Suppliers</h2>
            <p className="text-sm text-gray-500 font-medium mb-4">Manage your global car rental provider network</p>
            
            <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Search by name, email or location..." 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-card text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onFixData} title="Repair Data" className="p-2.5 bg-blue-50 border border-blue-200 rounded-card text-[#007ac2] hover:bg-blue-100 shadow-sm transition-all flex items-center gap-2 font-bold text-xs">
                <ShieldCheck className="w-5 h-5" /> Fix
            </button>
            <button onClick={onRefresh} className="p-2.5 bg-white border border-gray-200 rounded-card text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onAddSupplier} className="bg-gray-900 text-white px-6 py-2.5 rounded-card font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add New Partner
            </button>
        </div>
    </div>
    {fetchError && (
        <div className="mx-8 mt-6 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs font-bold">
                Supplier data could not be refreshed right now. Showing the last saved list.
            </div>
        </div>
    )}
    <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Provider Details</th>
                    <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Credentials</th>
                    <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Operational Status</th>
                    <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Connectivity</th>
                    <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Metrics</th>
                    <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredSuppliers.map((s: any) => (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-card bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-2 group-hover:border-blue-200 transition-colors">
                                    <img src={s.logo || s.logoUrl} className="max-w-full max-h-full object-contain" onError={(e:any)=>e.target.src='https://via.placeholder.com/100?text=Logo'} alt="Logo" width="40" height="40"/>
                                </div>
                                <div>
                                    <div className="text-[13px] font-extrabold text-slate-900 group-hover:text-[#007ac2] transition-colors leading-tight">{s.name}</div>
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
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Users className="w-2.5 h-2.5 text-slate-400" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]" title="Login Username">
                                        {s.email || s.contactEmail || 'N/A'}
                                    </span>
                                </div>
                                <div 
                                    className="flex items-center gap-2 cursor-pointer group/pass"
                                    onClick={() => onCopy(s.password, `table-${s.id}`, "Password")}
                                    title="Click to Reveal & Copy"
                                >
                                    <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100 group-hover/pass:border-blue-200 transition-colors">
                                        <Key className="w-2.5 h-2.5 text-blue-400" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 font-mono tracking-tighter group-hover/pass:text-[#007ac2] transition-colors">
                                        {revealedPasswords.has(`table-${s.id}`) ? (s.password || 'N/A') : '••••••••'}
                                    </span>
                                    {revealedPasswords.has(`table-${s.id}`) 
                                        ? <CheckCircle className="w-2.5 h-2.5 text-green-500" /> 
                                        : <Copy className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover/pass:opacity-100 transition-opacity" />
                                    }
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <Badge status={s.status || (s.active ? 'active' : 'inactive')}/>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${s.connectionType === 'api' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                                    {s.connectionType === 'api' ? 'Active API' : 'Manual'}
                                </span>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-xs font-extrabold text-slate-900">{(s as any).carCount ?? 0}</div>
                                    <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-tighter">Fleet</div>
                                </div>
                                <div className="w-px h-6 bg-slate-100" />
                                <div className="text-center">
                                    <div className="text-xs font-extrabold text-slate-900">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === s.id)).length}</div>
                                    <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-tighter">Bookings</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => onManageFleet(s)} className="p-2 bg-white border border-slate-100 rounded-card text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm" title="Fleet & Hogicar Choice">
                                    <Zap className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onManageApi(s)} className="p-2 bg-white border border-slate-100 rounded-card text-slate-400 hover:text-[#007ac2] hover:border-blue-100 transition-all shadow-sm" title="API Settings">
                                    <Rss className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onEdit(s)} className="p-2 bg-white border border-slate-100 rounded-card text-slate-400 hover:text-[#007ac2] hover:border-blue-100 transition-all shadow-sm" title="Edit Profile">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(s.id)} className="p-2 bg-white border border-slate-100 rounded-card text-slate-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm" title="Terminate Partner">
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
                    <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#007ac2]" />
                        Financial Overview
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time revenue stream</p>
                </div>
                <select className="text-xs font-bold border border-gray-100 rounded-card px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50">
                    <option>Last 30 Days</option>
                    <option>Quarterly</option>
                </select>
            </div>
            <div className="h-[350px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={1}>
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
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-accent" />
                    Latest Activity
                </h3>
                <span className="text-[10px] font-extrabold bg-accent-50 text-accent px-2 py-1 rounded-card uppercase">Live</span>
            </div>
            <div className="space-y-6 flex-1">
                {bookings.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-card bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-extrabold text-xs group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
                                {b.firstName?.[0]}{b.lastName?.[0]}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-accent transition-colors">{b.firstName} {b.lastName}</div>
                                <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{b.bookingRef} • {b.supplierName}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-extrabold text-gray-900">${b.finalPrice}</div>
                            <div className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1 inline-block ${b.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#007ac2]'}`}>
                                {b.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-8 py-3.5 text-xs font-extrabold text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-card border border-dashed border-gray-200 transition-all uppercase tracking-widest">
                Explore All Transactions
            </button>
        </div>
    </div>
  </div>
);

// ==================== Fleet ====================
const FleetContent = ({ cars, onRefresh }: any) => (
  <div className="bg-white rounded-card shadow-lg border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <SectionHeader title="Global Fleet" icon={Car} subtitle="Fleet availability across all suppliers" />
        <button onClick={onRefresh} className="p-2 hover:bg-white rounded-card border border-gray-200 transition-colors shadow-sm">
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
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.isArray(cars) && cars.map((c: any) => (
            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src={c.image} className="w-12 h-8 object-contain rounded bg-gray-100 border" alt={c.name} width="48" height="32" />
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
              <td className="px-6 py-4 font-mono text-xs text-[#007ac2] font-bold">
                {c.sippCode}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-medium">{c.isAvailable ? 'Available' : 'Sold Out'}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => { setManagingPromosForCar(c); setIsPromotionModalOpen(true); }}
                  className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-[#007ac2] rounded-card transition-all flex items-center gap-2 text-xs font-bold"
                  title="Manage Pricing & Promotions"
                >
                  <Tag className="w-4 h-4" />
                  <span>Pricing</span>
                </button>
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
const ApiPartnersContent = ({ partners, onCreate, onToggle }: any) => <div className="bg-white rounded-card shadow-lg p-6"><SectionHeader title="API Partners" icon={Share2} /><div className="text-center py-10 text-gray-400">Coming soon</div></div>;

// ==================== Modals ====================
const ApiConnectionModal = ({ supplier, isOpen, onClose, onSave }: any) => <Modal isOpen={isOpen} onClose={onClose} title="API Connection"><div>API settings</div></Modal>;
const PageEditorModal = ({ page, isOpen, onClose, onSave }: any) => {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  useEffect(() => { if (page) { setTitle(page.title); setContent(page.content); } }, [page]);
  const handleSave = () => { onSave(page.slug, { title, content }); onClose(); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={`Edit ${page?.slug || 'Page'}`}><InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextAreaField label="Content" value={content} onChange={e => setContent(e.target.value)} rows={10} /><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-[#007ac2] text-white px-3 py-1 rounded">Save</button></div></Modal>);
};
const SEOEditorModal = ({ config, isOpen, onClose, onSave }: any) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'layout' | 'builder' | 'style'>('seo');
  const [route, setRoute] = useState(config?.route || '');
  const [title, setTitle] = useState(config?.title || '');
  const [description, setDescription] = useState(config?.description || '');
  const [keywords, setKeywords] = useState(config?.keywords || '');
  const [canonicalUrl, setCanonicalUrl] = useState(config?.canonicalUrl || '');
  const [indexable, setIndexable] = useState(config?.indexable !== false);
  const [ogImage, setOgImage] = useState(config?.ogImage || '');
  const [published, setPublished] = useState(config?.published !== false);
  const [layout, setLayout] = useState(config?.layout || 'HOMEPAGE');
  const [h1Title, setH1Title] = useState(config?.h1Title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(config?.heroSubtitle || '');
  const [introText, setIntroText] = useState(config?.introText || '');
  const [content, setContent] = useState(config?.content || '');
  const [heroImage, setHeroImage] = useState(config?.heroImage || '');
  const [heroMobileImage, setHeroMobileImage] = useState(config?.heroMobileImage || '');
  const [heroVideo, setHeroVideo] = useState(config?.heroVideo || '');
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(config?.heroOverlayOpacity ?? 0.4);
  const [heroTextColor, setHeroTextColor] = useState(config?.heroTextColor || '#FFFFFF');
  const [heroButtonText, setHeroButtonText] = useState(config?.heroButtonText || '');
  const [heroButtonLink, setHeroButtonLink] = useState(config?.heroButtonLink || '');

  const [primaryColor, setPrimaryColor] = useState(config?.primaryColor || '#007ac2');
  const [secondaryColor, setSecondaryColor] = useState(config?.secondaryColor || '#FFFFFF');
  const [buttonColor, setButtonColor] = useState(config?.buttonColor || '#007ac2');
  const [backgroundColor, setBackgroundColor] = useState(config?.backgroundColor || '#F8FAFC');
  const [accentColor, setAccentColor] = useState(config?.accentColor || '#E2E8F0');

  const [searchWidgetStyle, setSearchWidgetStyle] = useState(config?.searchWidgetStyle || 'DEFAULT');
  const [searchWidgetColor, setSearchWidgetColor] = useState(config?.searchWidgetColor || '');
  const [searchWidgetButtonColor, setSearchWidgetButtonColor] = useState(config?.searchWidgetButtonColor || '');

  const [heroPromotionActive, setHeroPromotionActive] = useState(config?.heroPromotionActive ?? false);
  const [heroPromotionText, setHeroPromotionText] = useState(config?.heroPromotionText || '');
  const [heroPromotionLink, setHeroPromotionLink] = useState(config?.heroPromotionLink || '');
  const [heroPromotionColor, setHeroPromotionColor] = useState(config?.heroPromotionColor || '#E11D48');

  const [showHero, setShowHero] = useState(config?.showHero ?? true);
  const [showSearch, setShowSearch] = useState(config?.showSearch ?? true);
  const [showPromotions, setShowPromotions] = useState(config?.showPromotions ?? true);
  const [showSuppliers, setShowSuppliers] = useState(config?.showSuppliers ?? true);
  const [showBenefits, setShowBenefits] = useState(config?.showBenefits ?? true);
  const [showReviews, setShowReviews] = useState(config?.showReviews ?? true);
  const [showFaq, setShowFaq] = useState(config?.showFaq ?? true);
  const [showSeoContent, setShowSeoContent] = useState(config?.showSeoContent ?? true);
  const [showRelatedDestinations, setShowRelatedDestinations] = useState(config?.showRelatedDestinations ?? true);
  const [showFeaturedCars, setShowFeaturedCars] = useState(config?.showFeaturedCars ?? true);

  const defaultBuilder = {
    sections: {
      hero: { enabled: true },
      search: { enabled: true, pickupPrefill: '' },
      content: { enabled: true, html: '', text: '' },
      features: { enabled: true },
      whyChooseUs: { enabled: true },
      supplierLogos: { enabled: true },
      reviews: { enabled: true, selection: '' },
      popularDestinations: { enabled: true },
      stats: { enabled: false },
      faq: { enabled: true }
    },
    styles: {
      accentColor: '#007ac2',
      backgroundColor: '#ffffff',
      textColor: '#0f172a'
    }
  };

  const [builderConfig, setBuilderConfig] = useState(config?.contentJson ? JSON.parse(config.contentJson) : defaultBuilder);

  useEffect(() => {
    if (config) {
      setRoute(config.route || '');
      setTitle(config.title || '');
      setDescription(config.description || '');
      setKeywords(config.keywords || '');
      setCanonicalUrl(config.canonicalUrl || '');
      setIndexable(config.indexable !== false);
      setOgImage(config.ogImage || '');
      setPublished(config.published !== false);
      setLayout(config.layout || 'HOMEPAGE');
      setH1Title(config.h1Title || '');
      setHeroSubtitle(config.heroSubtitle || '');
      setIntroText(config.introText || '');
      setContent(config.content || '');
      setHeroImage(config.heroImage || '');
      setHeroPromotionActive(config.heroPromotionActive ?? false);
      setHeroPromotionText(config.heroPromotionText || '');
      setHeroPromotionLink(config.heroPromotionLink || '');
      setHeroPromotionColor(config.heroPromotionColor || '#E11D48');
      const savedBuilder = config.contentJson ? JSON.parse(config.contentJson) : {};
      setBuilderConfig({
        ...defaultBuilder,
        ...savedBuilder,
        sections: { ...defaultBuilder.sections, ...(savedBuilder.sections || {}) },
        styles: { ...defaultBuilder.styles, ...(savedBuilder.styles || {}) }
      });
      setActiveTab('seo');
    } else {
        setRoute('');
        setTitle('');
        setDescription('');
        setKeywords('');
        setCanonicalUrl('');
        setIndexable(true);
        setOgImage('');
        setPublished(true);
        setLayout('HOMEPAGE');
        setH1Title('');
        setHeroSubtitle('');
        setIntroText('');
        setContent('');
        setHeroImage('');
        setHeroPromotionActive(false);
        setHeroPromotionText('');
        setHeroPromotionLink('');
        setHeroPromotionColor('#E11D48');
        setBuilderConfig(defaultBuilder);
        setActiveTab('seo');
    }
  }, [config, isOpen]);

  const handleSave = () => {
    if (!route || !title || !description) {
      alert("Route, Title, and Description are required.");
      return;
    }
    if (title.length > 60) return alert("Title must not exceed 60 characters.");
    if (description.length > 160) return alert("Description must not exceed 160 characters.");
    
    // Normalize route
    let normalizedRoute = route.trim();
    if (!normalizedRoute.startsWith('/')) normalizedRoute = '/' + normalizedRoute;
    if (normalizedRoute.length > 1 && normalizedRoute.endsWith('/')) {
        normalizedRoute = normalizedRoute.substring(0, normalizedRoute.length - 1);
    }
    
    onSave({ 
      ...config,
      route: normalizedRoute, 
      title, 
      description, 
      keywords, 
      canonicalUrl, 
      indexable,
      ogImage,
      published,
      layout,
      h1Title,
      heroSubtitle,
      introText,
      content,
      heroImage,
      heroMobileImage,
      heroVideo,
      heroOverlayOpacity,
      heroTextColor,
      heroButtonText,
      heroButtonLink,
      primaryColor,
      secondaryColor,
      buttonColor,
      backgroundColor,
      accentColor,
      searchWidgetStyle,
      searchWidgetColor,
      searchWidgetButtonColor,
      heroPromotionActive,
      heroPromotionText,
      heroPromotionLink,
      heroPromotionColor,
      showHero,
      showSearch,
      showPromotions,
      showSuppliers,
      showBenefits,
      showReviews,
      showFaq,
      showSeoContent,
      showRelatedDestinations,
      showFeaturedCars,
      contentJson: JSON.stringify(builderConfig)
    });
  };

  const getScore = () => {
    let score = 0;
    if (title.length >= 30 && title.length <= 60) score += 40;
    if (description.length >= 120 && description.length <= 160) score += 40;
    if (keywords.split(',').filter(k => k.trim()).length >= 3) score += 20;
    return score;
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={config?.id ? 'Edit SEO Optimization' : 'Optimize New Route'}
      size="xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 -mx-6 px-6">
          {[
            { id: 'seo', label: 'General SEO', icon: Globe },
            { id: 'layout', label: 'Layout', icon: LayoutDashboard },
            { id: 'builder', label: 'Sections', icon: LayoutGrid },
            { id: 'style', label: 'Design', icon: Palette }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-[#007ac2] text-[#007ac2]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <InputField 
                        label="Route (e.g. /amman)" 
                        value={route} 
                        onChange={(e: any) => setRoute(e.target.value)} 
                        disabled={!!config?.id}
                        placeholder="/your-custom-route"
                      />
                    </div>
                    {config?.id && (
                      <a 
                        href={`${window.location.origin}${route}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 mb-[1px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-card transition-all flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Live
                      </a>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Page Title</label>
                      <span className={`text-[9px] font-bold ${title.length > 60 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {title.length}/60
                      </span>
                    </div>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-bold ${title.length > 60 ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
                      placeholder="Car Rental in Amman, Jordan | Hogicar"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Meta Description</label>
                      <span className={`text-[9px] font-bold ${description.length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {description.length}/160
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-medium ${description.length > 160 ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
                      placeholder="Enter a compelling description that encourages clicks from Google search results."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <InputField 
                    label="Keywords (comma separated)" 
                    value={keywords} 
                    onChange={(e: any) => setKeywords(e.target.value)} 
                    placeholder="car rental amman, cheap car hire jordan"
                  />
                  <InputField 
                    label="Canonical URL" 
                    value={canonicalUrl} 
                    onChange={(e: any) => setCanonicalUrl(e.target.value)} 
                    placeholder="https://www.hogicar.com/your-route"
                  />
                  <InputField 
                    label="OG Image URL" 
                    value={ogImage} 
                    onChange={(e: any) => setOgImage(e.target.value)} 
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  <div className="p-4 bg-slate-50 rounded-card border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Indexing Toggle</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Allow Google to index this page?</p>
                      </div>
                      <button 
                        onClick={() => setIndexable(!indexable)}
                        className={`w-12 h-6 rounded-full transition-all relative ${indexable ? 'bg-[#007ac2]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${indexable ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Publish Status</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Show this page on the site & sitemap?</p>
                      </div>
                      <button 
                        onClick={() => setPublished(!published)}
                        className={`w-12 h-6 rounded-full transition-all relative ${published ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${published ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">SEO Score</span>
                        <span className={`text-xs font-black ${getScore() >= 80 ? 'text-emerald-500' : getScore() >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {getScore()}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${getScore() >= 80 ? 'bg-emerald-500' : getScore() >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${getScore()}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Preview */}
              <div className="p-4 bg-slate-50 rounded-card border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Google Search Preview</span>
                </div>
                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm max-w-xl">
                  <div className="text-[14px] text-blue-800 hover:underline cursor-pointer font-medium mb-1 truncate">
                    {title || 'Your Page Title Goes Here'}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-emerald-800 mb-1">
                    <span>https://www.hogicar.com</span>
                    <span className="text-slate-400 font-bold">{route || '/example'}</span>
                  </div>
                  <div className="text-[13px] text-slate-600 line-clamp-2">
                    {description || 'Provide a meta description to see how your page will look in Google search results. Make it attractive to get more clicks!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setLayout('HOMEPAGE')}
                  className={`p-6 rounded-card border-2 cursor-pointer transition-all ${layout === 'HOMEPAGE' ? 'border-[#007ac2] bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${layout === 'HOMEPAGE' ? 'bg-[#007ac2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Homepage Layout</h4>
                      <p className="text-xs text-slate-500">Standard booking experience</p>
                    </div>
                    {layout === 'HOMEPAGE' && <CheckCircle className="w-5 h-5 text-[#007ac2] ml-auto" />}
                  </div>
                </div>

                <div 
                  onClick={() => setLayout('LANDING_PAGE')}
                  className={`p-6 rounded-card border-2 cursor-pointer transition-all ${layout === 'LANDING_PAGE' ? 'border-[#007ac2] bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${layout === 'LANDING_PAGE' ? 'bg-[#007ac2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Custom Landing</h4>
                      <p className="text-xs text-slate-500">Bespoke section builder</p>
                    </div>
                    {layout === 'LANDING_PAGE' && <CheckCircle className="w-5 h-5 text-[#007ac2] ml-auto" />}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <InputField 
                  label="Hero H1 Heading" 
                  value={h1Title} 
                  onChange={(e: any) => setH1Title(e.target.value)} 
                  placeholder="e.g. Best Car Rental in Amman"
                />
                <InputField 
                  label="Hero Subtitle" 
                  value={heroSubtitle} 
                  onChange={(e: any) => setHeroSubtitle(e.target.value)} 
                  placeholder="e.g. Compare trusted suppliers and find the best car rental deals in Amman."
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Intro Text / Description</label>
                  <textarea 
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-medium bg-white"
                    placeholder="Provide unique content for this landing page."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Main SEO Content (HTML/Markdown support)</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-200 rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-medium bg-white"
                    placeholder="Enter the main SEO content for this page. You can use HTML tags."
                  />
                  <p className="text-[9px] text-slate-400 italic">This content will be displayed prominently on the landing page.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Hero Background Image (Desktop)" 
                    value={heroImage} 
                    onChange={(e: any) => setHeroImage(e.target.value)} 
                    placeholder="https://example.com/hero.jpg"
                  />
                  <InputField 
                    label="Hero Background Image (Mobile)" 
                    value={heroMobileImage} 
                    onChange={(e: any) => setHeroMobileImage(e.target.value)} 
                    placeholder="https://example.com/hero-mobile.jpg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Hero Background Video (Optional)" 
                    value={heroVideo} 
                    onChange={(e: any) => setHeroVideo(e.target.value)} 
                    placeholder="https://example.com/hero-video.mp4"
                  />
                  <InputField 
                    label="Hero Overlay Opacity (0.0 - 1.0)" 
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={heroOverlayOpacity} 
                    onChange={(e: any) => setHeroOverlayOpacity(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                   <div className="md:col-span-2 bg-rose-50/50 p-4 rounded-card border border-rose-100 mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-rose-500" />
                          <span className="text-[11px] font-extrabold text-rose-900 uppercase tracking-widest">Hero Promotion Section</span>
                        </div>
                        <button 
                          onClick={() => setHeroPromotionActive(!heroPromotionActive)}
                          className={`text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all ${heroPromotionActive ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-200'}`}
                        >
                          {heroPromotionActive ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField 
                          label="Promotion Text (e.g. 15% OFF)" 
                          value={heroPromotionText} 
                          onChange={(e: any) => setHeroPromotionText(e.target.value)} 
                          placeholder="BLACK FRIDAY - 20% OFF"
                        />
                        <InputField 
                          label="Promotion Color (Background)" 
                          type="color"
                          value={heroPromotionColor} 
                          onChange={(e: any) => setHeroPromotionColor(e.target.value)} 
                        />
                      </div>
                      <div className="mt-4">
                        <InputField 
                          label="Promotion Link (Optional)" 
                          value={heroPromotionLink} 
                          onChange={(e: any) => setHeroPromotionLink(e.target.value)} 
                          placeholder="/promotions/black-friday"
                        />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Hero Text Color" 
                    type="color"
                    value={heroTextColor} 
                    onChange={(e: any) => setHeroTextColor(e.target.value)} 
                  />
                  <InputField 
                    label="Hero Button Text" 
                    value={heroButtonText} 
                    onChange={(e: any) => setHeroButtonText(e.target.value)} 
                    placeholder="Book Now"
                  />
                </div>
                <InputField 
                  label="Hero Button Link" 
                  value={heroButtonLink} 
                  onChange={(e: any) => setHeroButtonLink(e.target.value)} 
                  placeholder="#search"
                />
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-card border border-slate-200 mb-6 text-left">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Section Visibility</p>
                <p className="text-[11px] text-slate-500 font-medium">Control which components are displayed on this specific route.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'Hero', state: showHero, setter: setShowHero, icon: ImageIcon },
                  { key: 'Search', state: showSearch, setter: setShowSearch, icon: Search },
                  { key: 'Promotions', state: showPromotions, setter: setShowPromotions, icon: Tag },
                  { key: 'Suppliers', state: showSuppliers, setter: setShowSuppliers, icon: Building2 },
                  { key: 'Benefits', state: showBenefits, setter: setShowBenefits, icon: ShieldCheck },
                  { key: 'Reviews', state: showReviews, setter: setShowReviews, icon: Star },
                  { key: 'FAQ', state: showFaq, setter: setShowFaq, icon: MailQuestion },
                  { key: 'SEO Content', state: showSeoContent, setter: setShowSeoContent, icon: FileText },
                  { key: 'Related Destinations', state: showRelatedDestinations, setter: setShowRelatedDestinations, icon: MapPin },
                  { key: 'Featured Cars', state: showFeaturedCars, setter: setShowFeaturedCars, icon: Car },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-card hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${s.state ? 'bg-blue-50 text-[#007ac2]' : 'bg-slate-50 text-slate-400'}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest">{s.key}</span>
                    </div>
                    <button 
                      onClick={() => s.setter(!s.state)}
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all ${s.state ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      {s.state ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>

              {/* ROUTE-SPECIFIC REVIEWS EDITOR */}
              <div className="bg-slate-50 p-6 rounded-card border border-slate-200 mt-8 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Customer Reviews</p>
                    <p className="text-[11px] text-slate-500 font-medium">Add route-specific reviews to make this page more professional.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const currentItems = builderConfig.sections?.reviews?.items || [];
                      const newItem = { id: Date.now(), author: '', location: '', comment: '', rating: 5, verified: true, date: 'Just now' };
                      setBuilderConfig({
                        ...builderConfig, 
                        sections: {
                          ...builderConfig.sections, 
                          reviews: {
                            ...builderConfig.sections?.reviews, 
                            enabled: true,
                            items: [...currentItems, newItem]
                          }
                        }
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Review
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(builderConfig.sections?.reviews?.items || []).map((review: any, idx: number) => (
                    <div key={review.id || idx} className="p-4 bg-white rounded-card border border-slate-200 shadow-sm space-y-3 relative group">
                       <button 
                         onClick={() => {
                            const newItems = [...builderConfig.sections.reviews.items];
                            newItems.splice(idx, 1);
                            setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                         }} 
                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                       
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Author</label>
                            <input 
                              placeholder="e.g. John Doe" 
                              className="w-full text-xs p-2 border border-slate-100 rounded bg-slate-50/50 focus:bg-white transition-all outline-none" 
                              value={review.author} 
                              onChange={(e) => {
                                const newItems = [...builderConfig.sections.reviews.items];
                                newItems[idx].author = e.target.value;
                                setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                              }} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Location</label>
                            <input 
                              placeholder="e.g. United Kingdom" 
                              className="w-full text-xs p-2 border border-slate-100 rounded bg-slate-50/50 focus:bg-white transition-all outline-none" 
                              value={review.location} 
                              onChange={(e) => {
                                const newItems = [...builderConfig.sections.reviews.items];
                                newItems[idx].location = e.target.value;
                                setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                              }} 
                            />
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Comment</label>
                          <textarea 
                            placeholder="Customer feedback..." 
                            className="w-full text-xs p-3 border border-slate-100 rounded bg-slate-50/50 focus:bg-white transition-all outline-none h-20 resize-none" 
                            value={review.comment} 
                            onChange={(e) => {
                              const newItems = [...builderConfig.sections.reviews.items];
                              newItems[idx].comment = e.target.value;
                              setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                            }} 
                          />
                       </div>

                       <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                               Rating: 
                               <select 
                                 value={review.rating} 
                                 className="border-none bg-slate-50 rounded px-2 py-1 text-[10px] font-black" 
                                 onChange={(e) => {
                                    const newItems = [...builderConfig.sections.reviews.items];
                                    newItems[idx].rating = parseInt(e.target.value);
                                    setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                                 }}
                               >
                                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                               </select>
                            </label>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 checked={review.verified} 
                                 className="rounded border-slate-200 text-blue-500 focus:ring-0"
                                 onChange={(e) => {
                                    const newItems = [...builderConfig.sections.reviews.items];
                                    newItems[idx].verified = e.target.checked;
                                    setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                                 }} 
                               />
                               Verified
                            </label>
                          </div>
                          <span className="text-[9px] text-slate-300 font-mono">ID: {review.id}</span>
                       </div>
                    </div>
                  ))}
                  
                  {(!builderConfig.sections?.reviews?.items || builderConfig.sections.reviews.items.length === 0) && (
                    <div className="py-12 border-2 border-dashed border-slate-100 rounded-card flex flex-col items-center justify-center text-slate-300">
                      <Star className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No custom reviews added</p>
                      <p className="text-[9px] mt-1">Default global reviews will be shown</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-card border border-slate-200">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Global Color Theme</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Primary Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Secondary Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Button Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Accent Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center bg-white p-6 rounded border border-slate-200 shadow-inner">
                    <p className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest mb-4">Live Theme Preview</p>
                    <button style={{ backgroundColor: buttonColor }} className="px-8 py-3 text-white font-extrabold text-sm rounded-card shadow-lg active:scale-95 transition-all">
                      Primary CTA
                    </button>
                    <div className="mt-4 flex gap-2">
                       <div style={{ backgroundColor: primaryColor }} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" title="Primary"></div>
                       <div style={{ backgroundColor: secondaryColor }} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" title="Secondary"></div>
                       <div style={{ backgroundColor: accentColor }} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" title="Accent"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-card border border-slate-200">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Search Widget Customization</p>
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Widget Style</label>
                        <select value={searchWidgetStyle} onChange={(e) => setSearchWidgetStyle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-card text-sm font-bold bg-white outline-none">
                          <option value="DEFAULT">Default (Professional)</option>
                          <option value="MODERN">Modern (Glassmorphism)</option>
                          <option value="CLASSIC">Classic (Compact)</option>
                          <option value="MINIMAL">Minimalist</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Widget Accent Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={searchWidgetColor} onChange={(e) => setSearchWidgetColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={searchWidgetColor} onChange={(e) => setSearchWidgetColor(e.target.value)} placeholder="Auto" className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Search Button Color</label>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-card flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#059669] shadow-sm"></div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Locked to Professional Green</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 italic">For optimal conversion and brand consistency, the search button remains emerald green.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 -mx-6 px-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest transition-all ${getScore() >= 80 ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
              <Activity className="w-3 h-3" />
              SEO Quality: {getScore()}%
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-extrabold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="bg-[#007ac2] hover:bg-[#00619a] text-white px-8 py-2 rounded-card font-extrabold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
const EditCarModelModal = ({ carModel, isOpen, onClose, onSave }: any) => {
  const [model, setModel] = useState<any>({ 
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
  const [targetWidth, setTargetWidth] = useState(7680);
  const [targetHeight, setTargetHeight] = useState(4320);

  useEffect(() => { 
    if (carModel) {
      setModel({
        ...carModel,
        imageUrl: carModel.imageUrl || carModel.image || ''
      });
    } else {
      setModel({
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
    }
  }, [carModel, isOpen]);

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

      <div className="mt-6 p-4 bg-gray-50 rounded-card border border-gray-100">
        <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Vehicle Representation (Image)</label>
        <div className="flex gap-4 items-start">
          <div className="w-40 h-28 rounded-card bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
            {model.imageUrl ? (
              <img src={model.imageUrl} className="max-w-full max-h-full object-contain" alt="Preview" width="400" height="250" referrerPolicy="no-referrer" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-200" />
            )}
          </div>
          <div className="flex-grow space-y-4">
            <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Upload Photo (Target: {targetWidth}x{targetHeight})</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] text-gray-400 uppercase font-bold">Max Width</label>
                            <span className="text-[7px] bg-blue-100 text-[#007ac2] px-1 rounded font-extrabold">8K</span>
                        </div>
                        <input 
                            type="number" 
                            value={targetWidth} 
                            onChange={(e) => setTargetWidth(parseInt(e.target.value) || 7680)}
                            className="w-full px-2 py-1 text-[10px] border rounded bg-white font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 uppercase font-bold">Max Height</label>
                        <input 
                            type="number" 
                            value={targetHeight} 
                            onChange={(e) => setTargetHeight(parseInt(e.target.value) || 4320)}
                            className="w-full px-2 py-1 text-[10px] border rounded bg-white font-bold"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        accept="image/*" 
                        id="car-model-image-upload"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                try {
                                    const resized = await resizeImage(file, targetWidth, targetHeight, { removeBackground: true });
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
                        className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#007ac2] rounded-card border border-blue-100 font-bold text-xs cursor-pointer hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Choose File
                    </label>
                    {model.imageUrl && (
                        <button 
                            type="button" 
                            onClick={() => handleChange('imageUrl', '')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-card border border-red-100 transition-all bg-white shadow-sm"
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
                value={model.imageUrl || ''} 
                onChange={(e: any) => handleChange('imageUrl', e.target.value)} 
                helperText={model.imageUrl?.startsWith('data:') ? 'Currently using a locally uploaded image' : 'Enter a direct link to an image'}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
        <button 
          onClick={onClose}
          className="px-6 py-2.5 rounded-card font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className="bg-[#007ac2] text-white px-8 py-2.5 rounded-card font-bold text-sm shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all"
        >
          {carModel ? 'Save Changes' : 'Create Model'}
        </button>
      </div>
    </Modal>
  );
};
const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: any) => null;
const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: any) => {
  const [choice, setChoice] = useState(car?.hogicarChoice || false);
  const [promo, setPromo] = useState(car?.hogicarPromotion || 0);
  const [manualPrice, setManualPrice] = useState(car?.manualPrice || 0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (car) {
      setChoice(car.hogicarChoice || false);
      setPromo(car.hogicarPromotion || 0);
      setManualPrice(car.manualPrice || 0);
    }
  }, [car]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // car.supplierId is available from the car object
      const supplierId = car.supplierId;
      const res = await adminFetch(`/api/admin/suppliers/${supplierId}/cars/${car.id}/hogicar-choice`, {
        method: 'PATCH',
        body: JSON.stringify({
          hogicarChoice: choice,
          hogicarPromotion: promo,
          manualPrice: manualPrice
        })
      });
      alert('Pricing and Choice settings updated successfully');
      onSave(car.id, res); // Refresh the list
      onClose();
    } catch (e: any) {
      alert(`Update failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Pricing: ${car?.displayName || 'Vehicle'}`}>
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-card border border-blue-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-[#007ac2] uppercase tracking-wider">Hogicar Choice</h4>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Highlight this vehicle as a recommended option</p>
          </div>
          <Toggle checked={choice} onChange={setChoice} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Manual Price Override (Daily)" 
            type="number" 
            value={manualPrice} 
            onChange={(e: any) => setManualPrice(parseFloat(e.target.value))} 
            placeholder="0.00"
            helper="If set, this will override the supplier's base daily rate."
          />
          <InputField 
            label="Promotion Discount (%)" 
            type="number" 
            value={promo} 
            onChange={(e: any) => setPromo(parseFloat(e.target.value))} 
            placeholder="0"
            helper="Applied on top of the final price."
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#007ac2] text-white px-8 py-2.5 rounded-card font-bold text-sm shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Pricing'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

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
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight text-left">Homepage Branding</h2>
                        <p className="text-sm text-gray-500 font-medium text-left">Control global brands and trusted partners displayed on the landing page</p>
                    </div>
                    <button onClick={() => setEditingLogo({ name: '', logoUrl: '', displayOrder: logos.length + 1, scale: 100, mobileScale: 100, spacing: 24, active: true })} 
                        className="bg-[#007ac2] text-white px-6 py-2.5 rounded-card font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Add New Brand
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Preview</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Brand Name</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Order</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading brands...</td></tr>
                            ) : logos.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No brands configured yet</td></tr>
                            ) : logos.map((l: any) => (
                                <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="w-20 h-10 bg-white border border-slate-100 rounded-card flex items-center justify-center p-1.5 shadow-sm group-hover:border-blue-200 transition-colors">
                                            {l.logoUrl ? (
                                                <img src={l.logoUrl} alt={l.name} className="max-w-full max-h-full object-contain" width="100" height="50" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-sm font-extrabold text-slate-900">{l.name}</span></td>
                                    <td className="px-8 py-4"><span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{l.displayOrder}</span></td>
                                    <td className="px-8 py-4"><Badge status={l.active ? 'active' : 'inactive'} /></td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingLogo(l)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-[#007ac2] rounded-card transition-all"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-card transition-all"><Trash2 className="w-4 h-4"/></button>
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
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight text-left">Searching Page Branding</h2>
                        <p className="text-sm text-gray-500 font-medium text-left">Manage logos displayed during the scanning animation for specific locations</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchLogos} disabled={loading} className="p-2.5 rounded-card bg-white border border-gray-200 text-gray-500 hover:text-[#007ac2] hover:border-blue-200 transition-all shadow-sm">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setEditingLogo({ name: '', logoUrl: '', locationCodes: [], displayOrder: logos.length + 1, scale: 100, mobileScale: 100, spacing: 24, active: true })} 
                            className="bg-[#007ac2] text-white px-6 py-2.5 rounded-card font-bold text-sm shadow-lg shadow-blue-200 hover:bg-[#007ac2] transition-all flex items-center gap-2">
                            <PlusCircle className="w-5 h-5" />
                            Add New Searching Logo
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Preview</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Name</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Order</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
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
                                        <div className="w-20 h-10 bg-white border border-slate-100 rounded-card flex items-center justify-center p-1.5 shadow-sm group-hover:border-blue-200 transition-colors">
                                            {l.logoUrl ? (
                                                <img src={l.logoUrl} alt={l.name} className="max-w-full max-h-full object-contain" width="100" height="50" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-sm font-extrabold text-slate-900">{l.name}</span></td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {Array.isArray(l.locationCodes) && l.locationCodes.length > 0 ? (
                                                l.locationCodes.map((code: string) => (
                                                    <span key={code} className="text-[9px] font-mono font-bold text-[#007ac2] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
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
                                            <button onClick={() => setEditingLogo(l)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-[#007ac2] rounded-card transition-all"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-card transition-all"><Trash2 className="w-4 h-4"/></button>
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Logo Image</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <InputField value={formData.logoUrl} onChange={(e: any) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="Paste direct image URL or upload →" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-card transition-colors flex items-center justify-center text-slate-400 hover:text-[#007ac2] hover:border-blue-200">
                            <ImageIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {formData.logoUrl && (
                        <div className="mt-4 p-4 border border-slate-100 rounded-card bg-slate-50/50 flex items-center justify-center">
                            <img src={formData.logoUrl} alt="Preview" className="max-h-24 object-contain drop-shadow-sm" width="200" height="100" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Target Locations (IATA/City)</label>
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
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-card uppercase tracking-wider border border-slate-100">Global (All Locations)</span>
                        )}
                        {Array.isArray(formData.locationCodes) && formData.locationCodes.map((code: string) => (
                            <span key={code} className="bg-blue-50 text-[#007ac2] pl-3 pr-2 py-1.5 rounded-card text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-2 border border-blue-100 group">
                                {code}
                                <button 
                                    onClick={() => setFormData({ ...formData, locationCodes: formData.locationCodes.filter((c: string) => c !== code) })} 
                                    className="p-1 rounded-card hover:bg-blue-200/50 text-blue-400 hover:text-blue-800 transition-all"
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Status</label>
                    <select 
                        className="w-full bg-white border border-slate-200 rounded-card px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} type="button" className="flex-1 py-4 rounded-card font-extrabold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
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
                        className={`flex-1 py-4 rounded-card font-extrabold text-xs uppercase tracking-widest text-white transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#007ac2] shadow-lg shadow-blue-200 hover:bg-[#007ac2]'}`}
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Brand Logo</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <InputField value={formData.logoUrl} onChange={(e: any) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="Paste direct image URL or upload →" />
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                <span>Recommended: 400x200px, Transparent PNG</span>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-card transition-colors flex items-center justify-center text-slate-400 hover:text-[#007ac2] hover:border-blue-200">
                            <ImageIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {formData.logoUrl && (
                        <div className="mt-4 p-4 border border-slate-100 rounded-card bg-slate-50/50 flex items-center justify-center">
                            <img src={formData.logoUrl} alt="Preview" className="max-h-24 object-contain drop-shadow-sm" width="200" height="100" />
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Status</label>
                    <select 
                        className="w-full bg-white border border-slate-200 rounded-card px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-card font-extrabold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-4 rounded-card font-extrabold text-xs uppercase tracking-widest text-white bg-[#007ac2] shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all">Save Changes</button>
                </div>
            </div>
        </Modal>
    );
};

// ==================== Rates View Modal ====================
const RatesModal = ({ car, supplier, onClose }: any) => {
    const [rates, setRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRates = async () => {
            try {
                setLoading(true);
                const cleanCarId = parseInt(String(car.id).split(':')[0]);
                const cleanSupplierId = parseInt(String(supplier.id).split(':')[0]);
                const data = await getSupplierRates(cleanSupplierId, cleanCarId);
                setRates(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadRates();
    }, [car, supplier]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Active Rates</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{car.make} {car.model} • {car.locationCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-card transition-colors text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                         <div className="flex justify-center py-12"><LoaderCircle className="w-8 h-8 text-indigo-600 animate-spin" /></div>
                    ) : rates.length === 0 ? (
                        <p className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">No rates configured for this car</p>
                    ) : (
                        <div className="space-y-4">
                            {rates.map((tier: any) => (
                                <div key={tier.id} className="p-6 rounded-card border border-slate-100 bg-slate-50/30">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 text-sm">{tier.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tier.startDate} — {tier.endDate}</p>
                                        </div>
                                        <div className="px-2 py-1 bg-white rounded-card border border-slate-200 text-[10px] font-extrabold text-indigo-600 uppercase">{tier.currency}</div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {tier.bands?.map((band: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded-card border border-slate-100 shadow-sm">
                                                <p className="text-[8px] font-extrabold text-slate-400 uppercase mb-1">{band.minDays}-{band.maxDays === 9999 ? '∞' : band.maxDays} Days</p>
                                                <p className="text-xs font-extrabold text-slate-900 tracking-tight">{tier.currency} {band.dailyRate}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ==================== Supplier Fleet Modal ====================
const SupplierFleetModal = ({ supplier, onClose, onShowRates }: any) => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true);
        const data = await getSupplierCars(supplier.id);
        setCars(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (supplier) loadCars();
  }, [supplier]);

  const handleToggleChoice = async (carId: any, currentChoice: boolean) => {
    try {
      const cleanCarId = parseInt(String(carId).split(':')[0]);
      const cleanSupplierId = parseInt(String(supplier.id).split(':')[0]);
      setSavingId(carId);
      const updated = await updateHogicarChoice(cleanSupplierId, cleanCarId, { hogicarChoice: !currentChoice });
      setCars(prev => prev.map(c => c.id === carId ? updated : c));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdatePromo = async (carId: any, promo: number) => {
    try {
      const cleanCarId = parseInt(String(carId).split(':')[0]);
      const cleanSupplierId = parseInt(String(supplier.id).split(':')[0]);
      setSavingId(carId);
      const updated = await updateHogicarChoice(cleanSupplierId, cleanCarId, { hogicarPromotion: promo });
      setCars(prev => prev.map(c => c.id === carId ? updated : c));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Car className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Fleet Management</h2>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{supplier.name} • Choice & Promotions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-card transition-colors text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoaderCircle className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Accessing Fleet Inventory...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 rounded-card border border-red-100 flex items-center gap-4 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p className="font-bold">{error}</p>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
               <Car className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest">No vehicles found for this partner</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-card bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Vehicle</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Location</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Rates</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Hogicar Choice</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Commission Promo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cars.map((car: any) => (
                    <tr key={car.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 rounded-card bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                            {car.imageUrl ? <img src={car.imageUrl} className="w-full h-full object-contain" width="64" height="40" /> : <Car className="w-5 h-5 text-slate-200" />}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">{car.make} {car.model}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{car.sippCode} • {car.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 rounded-card text-[10px] font-extrabold text-slate-600 border border-slate-200">
                          {car.locationCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onShowRates(car)}
                          className="p-2 hover:bg-white rounded-card transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            disabled={savingId === car.id}
                            onClick={() => handleToggleChoice(car.id, !!car.hogicarChoice)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${car.hogicarChoice ? 'bg-indigo-600' : 'bg-slate-200'} ${savingId === car.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${car.hogicarChoice ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {car.hogicarChoice ? (
                          <div className="flex items-center gap-2">
                             <div className="relative">
                               <input 
                                 type="number"
                                 defaultValue={car.hogicarPromotion || 0}
                                 onBlur={(e) => handleUpdatePromo(car.id, parseFloat(e.target.value) || 0)}
                                 className="w-20 pl-6 pr-2 py-1.5 bg-indigo-50/30 border border-indigo-100 rounded-card text-xs font-extrabold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                               />
                               <Percent className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400" />
                             </div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Off Comm.</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic uppercase">Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ==================== Main AdminDashboard ====================
export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierFetchError, setSupplierFetchError] = useState<string | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [viewingFleetSupplier, setViewingFleetSupplier] = useState<any>(null);
  const [viewingRatesCar, setViewingRatesCar] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [carLibrary, setCarLibrary] = useState<any[]>([]);
  const [loadingCarLibrary, setLoadingCarLibrary] = useState(false);
  const [supplierApps, setSupplierApps] = useState<any[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [approvingApplication, setApprovingApplication] = useState<any>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiPartners, setApiPartners] = useState(MOCK_API_PARTNERS);
  const [pages, setPages] = useState<any[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isSeoEditorOpen, setIsSeoEditorOpen] = useState(false);
  const [editingSeoConfig, setEditingSeoConfig] = useState<any>(null);
  const [seoConfigs, setSeoConfigs] = useState<SEOConfig[]>([]);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [isCarModelModalOpen, setIsCarModelModalOpen] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<any>(null);
  const [affiliates, setAffiliates] = useState(MOCK_AFFILIATES);
  const [editingAffiliate, setEditingAffiliate] = useState<any>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [managingPromosForCar, setManagingPromosForCar] = useState<any>(null);
  const [homepageContent, setHomepageContent] = useState(MOCK_HOMEPAGE_CONTENT);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(MOCK_CATEGORY_IMAGES as Record<string, string>);
  const [loadingHomepageEditor, setLoadingHomepageEditor] = useState(false);
  const [savingHomepageEditor, setSavingHomepageEditor] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = async (text: string, id: string, label: string = "Password") => {
    // Always toggle reveal state even if there's no text to copy
    const next = new Set(revealedPasswords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedPasswords(next);

    if (!text) {
        showToast(`No ${label} available to copy`, 'error');
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showToast(`${label} copied to clipboard!`);
        } else {
            // Fallback for older browsers or insecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) showToast(`${label} copied to clipboard!`);
            else throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        // If we can't copy, we still showed the toast if we wanted, but let's be explicit
        // showToast('Revealed (Copy failed)', 'error');
    }
  };

  const toggleReveal = (id: string) => {
    const next = new Set(revealedPasswords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedPasswords(next);
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await adminFetch('/api/admin/suppliers');
      const normalized = (Array.isArray(res) ? res : []).map((s: any) => ({
        ...s,
        contactEmail: s.contactEmail,
        logo: s.logoUrl,
        commissionValue: s.commissionPercent,
        carCount: s.carCount || 0
      }));
      setSuppliers(normalized);
      setSupplierFetchError(null);
    } catch (e) { 
      console.error('Failed to fetch suppliers', e);
      setSupplierFetchError(e instanceof Error ? e.message : 'Failed to fetch suppliers');
    } finally { setLoadingSuppliers(false); }
  };

  const fetchSupplierApps = async () => {
    try {
      const res = await adminFetch('/api/partner-applications/admin/all');
      setSupplierApps(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch supplier applications', e);
    }
  };

  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const res = await adminFetch('/api/admin/cms/pages');
      setPages(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch pages', e);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchSeoConfigs = async () => {
    setLoadingSeo(true);
    try {
      const res = await adminFetch('/api/admin/seo');
      setSeoConfigs(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch SEO configs', e);
    } finally {
      setLoadingSeo(false);
    }
  };

  const fetchBookings = async (supplierId?: string | null) => {
    setLoadingBookings(true);
    try {
        const url = supplierId ? `/api/admin/bookings?supplierId=${supplierId}` : '/api/admin/bookings';
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

  const fetchHomepageEditor = async () => {
    setLoadingHomepageEditor(true);
    try {
      const [contentRes, imagesRes] = await Promise.all([
        adminFetch('/api/admin/homepage'),
        adminFetch('/api/admin/homepage/category-images')
      ]);

      setHomepageContent(contentRes && typeof contentRes === 'object' ? contentRes : MOCK_HOMEPAGE_CONTENT);
      setCategoryImages(imagesRes && typeof imagesRes === 'object' ? imagesRes : {});
    } catch (e) {
      console.error('Failed to fetch homepage editor data', e);
    } finally {
      setLoadingHomepageEditor(false);
    }
  };

  const handleFixData = async () => {
    if (!window.confirm("This will repair data by activating suppliers and locations with cars. Proceed?")) return;
    try {
      await adminFetch('/api/admin/suppliers/fix-data', { method: 'POST' });
      alert("Data repaired successfully.");
      fetchSuppliers();
      fetchFleet();
    } catch (e) {
      alert("Failed to repair data.");
    }
  };

  useEffect(() => { 
    fetchSuppliers(); 
    fetchCarLibrary();
    fetchSupplierApps();
  }, []);

  useEffect(() => {
    if (activeSection === 'supplierrequests') {
      fetchSupplierApps();
    }
  }, [activeSection]);

  useEffect(() => {
    fetchBookings(selectedSupplierId);
    fetchFleet(selectedSupplierId);
  }, [selectedSupplierId]);

  useEffect(() => {
    if (activeSection === 'cms') {
      fetchPages();
    }
    if (activeSection === 'seo') {
      fetchSeoConfigs();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'homepage') {
      fetchHomepageEditor();
    }
  }, [activeSection]);

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
        hogicarChoice: updatedSupplier.hogicarChoice || false,
        address: updatedSupplier.address || "",
        termsAndConditions: updatedSupplier.termsAndConditions || "",
        includesCDW: updatedSupplier.includesCDW ?? true,
        includesTP: updatedSupplier.includesTP ?? true,
        oneWayFee: updatedSupplier.oneWayFee || 0,
        gracePeriodHours: updatedSupplier.gracePeriodHours || 0,
        minBookingLeadTime: updatedSupplier.minBookingLeadTime || 0,
        connectionType: updatedSupplier.connectionType || 'manual',
        rating: updatedSupplier.rating || 5.0,
        ratingReviewCount: updatedSupplier.ratingReviewCount || 0,
        ratingCleanliness: updatedSupplier.ratingCleanliness ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingCondition: updatedSupplier.ratingCondition ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingValueForMoney: updatedSupplier.ratingValueForMoney ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingPickupSpeed: updatedSupplier.ratingPickupSpeed ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingDropoffSpeed: updatedSupplier.ratingDropoffSpeed ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingStaffService: updatedSupplier.ratingStaffService ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingEaseOfLocating: updatedSupplier.ratingEaseOfLocating ?? ratingToDefaultPercent(updatedSupplier.rating),
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
        await adminFetch(`/api/partner-applications/admin/${approvingApplication.id}`, { method: 'DELETE' }); 
        fetchSupplierApps(); 
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
            id: model.id ? parseInt(String(model.id).split(':')[0]) : undefined,
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
            const cleanId = parseInt(String(model.id).split(':')[0]);
            await adminFetch(`/api/admin/car-models/${cleanId}`, {
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

  const handleDeleteCarModel = async (id: any) => { 
    if (!confirm('Are you sure you want to delete this car model?')) return;
    try {
        const cleanId = parseInt(String(id).split(':')[0]);
        await adminFetch(`/api/admin/car-models/${cleanId}`, { method: 'DELETE' });
        await fetchCarLibrary();
    } catch (e: any) {
        alert(`Delete failed: ${e.message}`);
    }
  };
  const handleUpdateAffiliateStatus = (id: string, status: any) => { updateAffiliateStatus(id, status); setAffiliates([...MOCK_AFFILIATES]); };
  const handleSaveAffiliateCommission = (id: string, rate: number) => { updateAffiliateCommissionRate(id, rate); setAffiliates([...MOCK_AFFILIATES]); setEditingAffiliate(null); };
  const handleSavePromotion = (carId: string, newTier: RateTier) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers.push(newTier); setIsPromotionModalOpen(false); setManagingPromosForCar(null); };
  const handleDeleteTier = (carId: string, tierId: string) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers = MOCK_CARS[idx].rateTiers.filter(t => t.id !== tierId); setManagingPromosForCar({...MOCK_CARS[idx]}); };
  const handleRejectApplication = async (id: string) => {
    if (confirm('Are you sure you want to reject and delete this application?')) {
      try {
        await adminFetch(`/api/partner-applications/admin/${id}`, { method: 'DELETE' });
        fetchSupplierApps();
      } catch (e) {
        alert("Failed to reject application");
      }
    }
  };

  const handleSaveSeoConfig = async (config: any) => {
    try {
        await adminFetch('/api/admin/seo', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        showToast("SEO config saved successfully");
        fetchSeoConfigs();
        setIsSeoEditorOpen(false);
        setEditingSeoConfig(null);
    } catch (e: any) {
        alert(`Failed to save SEO config: ${e.message}`);
    }
  };

  const handleDeleteSeoConfig = async (route: string) => {
    if (!confirm(`Are you sure you want to delete SEO config for route: ${route}?`)) return;
    try {
        await adminFetch(`/api/admin/seo/${encodeURIComponent(route)}`, { method: 'DELETE' });
        showToast("SEO config deleted");
        fetchSeoConfigs();
    } catch (e: any) {
        alert(`Delete failed: ${e.message}`);
    }
  };
  const handleApproveApplication = (newSupplier: any, app: any) => { setApprovingApplication(app); setEditingSupplier(newSupplier); };
  const handleEditPage = (page: any) => { setEditingPage(page); setIsPageEditorOpen(true); };
  const handleSavePage = async (slug: string, data: any) => {
    try {
      await adminFetch(`/api/admin/cms/pages/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast("Page updated successfully");
      fetchPages();
    } catch (e: any) {
      alert("Failed to save page: " + e.message);
    }
  };
  const handleNewSeo = () => { setEditingSeoConfig({}); setIsSeoEditorOpen(true); };
  const handleEditSeo = (config: any) => { setEditingSeoConfig(config); setIsSeoEditorOpen(true); };
  const handleSaveHomepage = async (content: any, images: Record<string, string>) => {
    setSavingHomepageEditor(true);
    try {
      await adminFetch('/api/admin/homepage', {
        method: 'PUT',
        body: JSON.stringify(content)
      });
      await adminFetch('/api/admin/homepage/category-images', {
        method: 'PUT',
        body: JSON.stringify(images)
      });
      setHomepageContent(content);
      setCategoryImages(images);
    } catch (e: any) {
      alert(`Failed to save homepage content: ${e.message}`);
      throw e;
    } finally {
      setSavingHomepageEditor(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent stats={stats} pendingCount={pendingCount} bookings={bookings} />;
      case 'suppliers': return <SuppliersContent suppliers={suppliers} fetchError={supplierFetchError} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(s: any) => { setEditingSupplier(s); setIsApiModalOpen(true); }} onManageFleet={setViewingFleetSupplier} onAddSupplier={() => setEditingSupplier({})} onRefresh={fetchSuppliers} onDelete={handleDeleteSupplier} onFixData={handleFixData} revealedPasswords={revealedPasswords} onCopy={handleCopy} />;
      case 'supplierrequests': return <SupplierRequestsContent apps={supplierApps} onApprove={handleApproveApplication} onReject={handleRejectApplication} onRefresh={fetchSupplierApps} />;
      case 'bookings': return <BookingsContent bookings={bookings} onRefresh={() => fetchBookings(selectedSupplierId)} />;
      case 'fleet': return <FleetContent cars={fleet} onRefresh={() => fetchFleet(selectedSupplierId)} />;
      case 'carlibrary': return <CarLibraryContent library={carLibrary} onEdit={(m: any) => { setEditingCarModel(m); setIsCarModelModalOpen(true); }} onDelete={handleDeleteCarModel} />;
      case 'apipartners': return <ApiPartnersContent partners={apiPartners} onCreate={handleCreateApiPartner} onToggle={handleToggleApiPartnerStatus} />;
      case 'affiliates': return <AffiliatesContent affiliates={affiliates} onUpdateStatus={handleUpdateAffiliateStatus} onEditCommission={handleSaveAffiliateCommission} editingAffiliate={editingAffiliate} setEditingAffiliate={setEditingAffiliate} onSaveCommission={handleSaveAffiliateCommission} />;
      case 'cms': return <CmsContent pages={pages} onEditPage={handleEditPage} />;
      case 'seo': return <SeoContent configs={seoConfigs} onEditSeo={handleEditSeo} onNewSeo={handleNewSeo} onDeleteSeo={handleDeleteSeoConfig} loading={loadingSeo} />;
      case 'homepage':
        if (loadingHomepageEditor) {
          return <div className="p-8 text-center text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading Homepage Editor...</div>;
        }
        return <HomepageContentSection content={homepageContent} categoryImages={categoryImages} onSave={handleSaveHomepage} isSaving={savingHomepageEditor} />;
      case 'sitesettings': return <SiteSettingsContent />;
      case 'promotions': return <PromotionsContent />;
      case 'globallocations': return <GlobalLocationsContent />;
      case 'homepagelogos': return <HomepageLogosContent />;
      case 'searchinglogos': return <SearchingLogosContent />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <EditSupplierModal isOpen={!!editingSupplier} onClose={() => setEditingSupplier(null)} onSave={handleSaveSupplier} supplier={editingSupplier} onCopy={handleCopy} />
      {editingSupplier && isApiModalOpen && <ApiConnectionModal supplier={editingSupplier} isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSave={handleSaveApiConnection} />}
      {isPageEditorOpen && <PageEditorModal page={editingPage} isOpen={isPageEditorOpen} onClose={() => setIsPageEditorOpen(false)} onSave={handleSavePage} />}
      {isSeoEditorOpen && <SEOEditorModal config={editingSeoConfig} isOpen={isSeoEditorOpen} onClose={() => setIsSeoEditorOpen(false)} onSave={handleSaveSeoConfig} />}
      {isCarModelModalOpen && <EditCarModelModal carModel={editingCarModel} isOpen={isCarModelModalOpen} onClose={() => setIsCarModelModalOpen(false)} onSave={handleSaveCarModel} />}
      {managingPromosForCar && <AdminPromotionModal car={managingPromosForCar} isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} onSave={handleSavePromotion} onDeleteTier={handleDeleteTier} />}
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-card shadow-2xl flex items-center gap-3 border border-slate-800"
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-2 rounded-card shadow-lg">
                <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block font-extrabold text-slate-950 tracking-tight uppercase leading-none">Admin Portal</span>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.18em]">Control plane</span>
            </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-card transition-colors">
            {isSidebarOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
        </button>
      </div>

      <div className="w-full px-3 sm:px-4 lg:pr-8 xl:pr-10 py-4 lg:py-8 flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} countSupplierRequests={pendingCount} />
        
        <main className="flex-grow min-w-0 max-w-[1600px] mx-auto">
          <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 lg:mb-8 gap-5 bg-white p-4 sm:p-5 rounded-card shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="hidden lg:flex p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-card transition-all duration-300 group shadow-sm"
                title={isSidebarOpen ? "Close Menu" : "Open Menu"}
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-slate-600 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                )}
              </button>
              <div>
                <div className="flex items-center gap-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-1">
                  <LayoutDashboard className="w-3 h-3" />
                  <span>System / {activeSection}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 capitalize tracking-tight leading-none">
                  {activeSection === 'dashboard' ? 'Market Overview' : activeSection}
                </h1>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 lg:gap-4 w-full xl:w-auto">
              {['dashboard', 'bookings', 'fleet', 'suppliers'].includes(activeSection) && (
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-card border border-slate-200 hover:border-blue-200 transition-all duration-300 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-card bg-white shadow-sm flex items-center justify-center text-[#007ac2] border border-slate-100">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col pr-3 min-w-0 flex-1">
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-tight">Supplier Node</span>
                    <select 
                        className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer min-w-0"
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

              {selectedSupplierId && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-[#007ac2] px-4 py-2 rounded-card text-white shadow-lg shadow-blue-200 w-full sm:w-auto">
                    <div className="flex flex-col border-r border-blue-500 pr-3 min-w-0">
                        <span className="text-[7px] font-extrabold uppercase tracking-[0.2em] opacity-70">Login Identity</span>
                        <span className="text-[10px] font-bold truncate max-w-[120px]">
                            {suppliers.find(s => s.id.toString() === selectedSupplierId.toString())?.email || 'N/A'}
                        </span>
                    </div>
                    <div className="flex flex-col pl-1">
                        <span className="text-[7px] font-extrabold uppercase tracking-[0.2em] opacity-70">Access Key</span>
                        <div 
                            className="flex items-center gap-2 cursor-pointer group/pass"
                            onClick={() => {
                                const s = suppliers.find(s => s.id.toString() === selectedSupplierId.toString());
                                handleCopy(s?.password || "", `header-${s?.id}`, "Access Key");
                            }}
                            title="Click to Reveal & Copy"
                        >
                            <span className="text-[10px] font-bold font-mono min-w-[60px] hover:text-blue-100 transition-colors">
                                {revealedPasswords.has(`header-${suppliers.find(s => s.id.toString() === selectedSupplierId.toString())?.id}`) 
                                    ? (suppliers.find(s => s.id.toString() === selectedSupplierId.toString())?.password || 'N/A') 
                                    : '••••••••'}
                            </span>
                            <div className="p-1 hover:bg-blue-500 rounded transition-colors bg-blue-800/50">
                                {revealedPasswords.has(`header-${suppliers.find(s => s.id.toString() === selectedSupplierId.toString())?.id}`) ? <CheckCircle className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            </div>
                        </div>
                    </div>
                </motion.div>
              )}

              <div className="hidden sm:flex items-center gap-3.5 sm:pl-4 sm:border-l border-slate-100">
                 <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 rounded-card bg-slate-900 flex items-center justify-center text-white shadow-lg font-extrabold text-sm cursor-pointer"
                 >
                    AD
                 </motion.div>
                 <div className="hidden xl:block">
                    <p className="text-xs font-extrabold text-slate-900 leading-none">Root Auth</p>
                    <div className="flex items-center gap-1 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                        <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Security Tier 1</p>
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
                className="min-h-[600px] overflow-x-auto pb-2 [&_table]:min-w-[860px]"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-16 py-8 border-t border-gray-100 text-center">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.3em]">
                &copy; {new Date().getFullYear()} Hogicar Global Infrastructure. All Systems Operational.
            </p>
          </footer>
        </main>
      </div>

      {viewingFleetSupplier && (
        <SupplierFleetModal 
          supplier={viewingFleetSupplier} 
          onClose={() => setViewingFleetSupplier(null)} 
          onShowRates={setViewingRatesCar}
        />
      )}

      {viewingRatesCar && (
        <RatesModal 
          car={viewingRatesCar} 
          supplier={viewingFleetSupplier}
          onClose={() => setViewingRatesCar(null)}
        />
      )}
    </div>
  );
};
