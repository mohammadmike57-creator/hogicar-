import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Car, Calendar, DollarSign, User, Users, LogOut, 
  Settings, Settings2, Target, Package, MapPin, Zap, Clock, Shield, Plus, Edit, 
  Trash2, Search, Filter, ChevronRight, History, TrendingUp,
  Download, Upload, FileText, CheckCircle, XCircle, AlertCircle, Info,
  Menu, X, Bell, Briefcase, Gift, RefreshCw, BarChart3, Lock, Globe,
  Layers, Check, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, addDays, subDays } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { supplierApi, getPublicLocations, API_BASE_URL } from '../api';
import { CURRENCIES } from '../contexts/CurrencyContext';
import { 
  Supplier, Car as CarType, Booking, CarCategory, Transmission, FuelPolicy, 
  BookingMode, TemplateConfig, Extra, RateTier, CarModel, CarRateTier,
  ExcelDownloadHistory
} from '../types';
import { Logo } from '../components/Logo';

// ==================== Shared UI Components ====================

const StatCard = ({ icon: Icon, title, value, change, color = "blue", onClick }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between group relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-slate-800 to-emerald-500 opacity-90" />
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 rounded-xl ring-1 transition-transform group-hover:scale-105 ${colors[color] || colors.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-colors duration-300 ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-2">{title}</p>
        <p className="text-3xl font-black text-slate-950 tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white border border-slate-800 shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h2 className="text-lg font-black text-slate-950 tracking-tight">{title}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.14em] mt-0.5">{subtitle}</p>
        </div>
    </div>
);

const Badge = ({ children, variant = "default", className = "" }: any) => {
    const variants: any = {
        default: "bg-gray-100 text-gray-600",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-amber-50 text-amber-700",
        error: "bg-red-50 text-red-700",
        info: "bg-blue-50 text-blue-700",
        purple: "bg-violet-50 text-violet-700",
    };
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }: any) => {
    if (!isOpen) return null;
    const sizes: any = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl"
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className={`bg-white rounded-[2.5rem] shadow-2xl w-full ${sizes[size]} relative overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-8 overflow-y-auto overflow-x-hidden">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, icon: Icon, prefix, error, helperText, ...props }: any) => (
    <div className="space-y-2">
        {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
        <div className={`flex items-center bg-white border rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm ${props.readOnly ? 'opacity-70 bg-slate-50' : 'hover:border-slate-300'} ${error ? 'border-red-300' : 'border-slate-200'}`}>
            {Icon && (
                <div className="px-5 py-4 bg-slate-50 border-r border-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
            )}
            {prefix && (
                <div className="px-5 py-4 bg-slate-50 border-r border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {prefix}
                </div>
            )}
            <input 
                {...props} 
                className="flex-1 py-4 px-6 text-sm font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-200 cursor-text disabled:cursor-not-allowed" 
            />
        </div>
        {helperText && <p className="text-[9px] text-slate-400 font-medium ml-1">{helperText}</p>}
        {error && <p className="text-[9px] text-red-500 font-bold ml-1">{error}</p>}
    </div>
);

const removeSolidLogoBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const samplePoints = [
        [0, 0],
        [Math.floor(width / 2), 0],
        [width - 1, 0],
        [0, Math.floor(height / 2)],
        [width - 1, Math.floor(height / 2)],
        [0, height - 1],
        [Math.floor(width / 2), height - 1],
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

    const bgBrightness = (bg.r + bg.g + bg.b) / 3;
    const isRemovableBg = bgBrightness > 225 || bgBrightness < 42;
    if (!isRemovableBg) return;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        const colorDistance = Math.hypot(r - bg.r, g - bg.g, b - bg.b);
        const lowSaturation = Math.max(r, g, b) - Math.min(r, g, b) < 38;
        const closeToDarkBg = bgBrightness < 42 && brightness < 70 && colorDistance < 64;
        const closeToLightBg = bgBrightness > 225 && brightness > 210 && colorDistance < 70;

        if ((closeToDarkBg || closeToLightBg) && lowSaturation) {
            data[i + 3] = 0;
        } else if (colorDistance < 42 && lowSaturation) {
            data[i + 3] = Math.min(data[i + 3], 90);
        }
    }

    ctx.putImageData(imageData, 0, 0);
};

const prepareLogoImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_DATA_URL_LENGTH = 700_000;
                const maxWidth = 640;
                const maxHeight = 360;
                let width = img.width;
                let height = img.height;
                const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not process the logo image.'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                removeSolidLogoBackground(ctx, width, height);

                let outputCanvas = canvas;
                let dataUrl = outputCanvas.toDataURL('image/png');
                while (dataUrl.length > MAX_DATA_URL_LENGTH && outputCanvas.width > 180 && outputCanvas.height > 100) {
                    const smallerCanvas = document.createElement('canvas');
                    smallerCanvas.width = Math.round(outputCanvas.width * 0.84);
                    smallerCanvas.height = Math.round(outputCanvas.height * 0.84);
                    const smallerCtx = smallerCanvas.getContext('2d');
                    if (!smallerCtx) break;
                    smallerCtx.imageSmoothingEnabled = true;
                    smallerCtx.imageSmoothingQuality = 'high';
                    smallerCtx.drawImage(outputCanvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
                    outputCanvas = smallerCanvas;
                    dataUrl = outputCanvas.toDataURL('image/png');
                }

                if (dataUrl.length > MAX_DATA_URL_LENGTH) {
                    reject(new Error('The logo is too large. Please upload a smaller logo file.'));
                    return;
                }

                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Could not read the logo image.'));
            img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Could not read the logo file.'));
        reader.readAsDataURL(file);
    });
};

// ==================== Main Dashboard Component ====================

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stopSales, setStopSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats data
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.netPrice || 0), 0);
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const activeStopSales = stopSales.filter(ss => {
      const now = new Date();
      now.setHours(0,0,0,0);
      return new Date(ss.startDate) <= now && new Date(ss.endDate) >= now;
    }).length;
    
    return {
      totalBookings,
      confirmedBookings,
      totalRevenue,
      pendingCount,
      activeStopSales,
      activeCars: cars.filter(c => c.isAvailable || c.available).length,
      totalCars: cars.length
    };
  }, [bookings, cars, stopSales]);

  const refreshStopSales = async () => {
    try {
      const res = await supplierApi.getStopSales();
      setStopSales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to refresh stop sales:', err);
    }
  };

  const refreshCars = async () => {
    try {
      const carsRes = await supplierApi.getCars();
      setCars(Array.isArray(carsRes.data) ? carsRes.data : []);
    } catch (err) {
      console.error('Failed to refresh supplier cars:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [meRes, carsRes, bookingsRes, stopSalesRes] = await Promise.all([
          supplierApi.getMe(),
          supplierApi.getCars(),
          supplierApi.getBookings(),
          supplierApi.getStopSales()
        ]);
        const supplierPayload = meRes?.data?.data ?? meRes?.data ?? null;
        setSupplier(supplierPayload && typeof supplierPayload === 'object' ? supplierPayload : null);
        setCars(Array.isArray(carsRes.data) ? carsRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setStopSales(Array.isArray(stopSalesRes.data) ? stopSalesRes.data : []);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        if (err.response?.status === 401) navigate('/supplier-login');
        setError('Session expired or access denied. Please login again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Close sidebar on mobile when section changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeSection]);

  const handleGenerateReport = async () => {
    try {
      const response = await supplierApi.downloadBookingReport();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `booking_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Report generation failed:', err);
      alert('Failed to generate report');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-700 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Portal...</p>
    </div>
  );

  if (!supplier) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl shadow-sm p-8 text-center">
        <h2 className="text-lg font-black text-slate-900 mb-3">Unable to load supplier dashboard</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'Please sign in again to continue.'}</p>
        <button
          onClick={() => navigate('/supplier-login')}
          className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] bg-blue-700 text-white hover:bg-blue-800 transition-colors"
        >
          Go to supplier login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        className={`fixed inset-y-0 left-0 w-[280px] bg-slate-950 border-r border-slate-800 z-50 flex flex-col overflow-hidden shadow-2xl shadow-slate-950/20 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-7 mb-2 border-b border-white/10">
            <div className="flex items-center gap-3.5 group cursor-pointer">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-950 shadow-xl shadow-black/20 group-hover:scale-105 transition-transform duration-300">
                    <Car className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-black text-xl tracking-tighter text-white leading-none">HOGICAR</h1>
                    <div className="flex items-center gap-1 mt-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)] animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Supplier Command</span>
                    </div>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
            <div className="px-4 mb-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Operations</div>
            {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'reservations', label: 'Reservations', icon: Calendar },
                { id: 'fleet', label: 'My Fleet', icon: Car },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        activeSection === item.id 
                        ? 'bg-white text-slate-950 shadow-lg shadow-black/20' 
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <item.icon className={`w-4 h-4 transition-transform duration-300 ${activeSection === item.id ? 'text-blue-700' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className={`text-[13px] font-black tracking-tight ${activeSection === item.id ? 'text-slate-950' : 'text-slate-300 group-hover:text-white'}`}>{item.label}</span>
                </button>
            ))}

            <div className="px-4 mb-3 mt-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Inventory</div>
            {[
                { id: 'rates', label: 'Pricing', icon: DollarSign },
                { id: 'stopsales', label: 'Availability', icon: Clock },
                { id: 'extras', label: 'Add-ons', icon: Package },
                { id: 'locations', label: 'Expansion', icon: MapPin },
                { id: 'profile', label: 'Profile', icon: User },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        activeSection === item.id 
                        ? 'bg-white text-slate-950 shadow-lg shadow-black/20' 
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <item.icon className={`w-4 h-4 transition-transform duration-300 ${activeSection === item.id ? 'text-blue-700' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className={`text-[13px] font-black tracking-tight ${activeSection === item.id ? 'text-slate-950' : 'text-slate-300 group-hover:text-white'}`}>{item.label}</span>
                </button>
            ))}
        </nav>

        <div className="mx-4 mb-4 rounded-2xl bg-white/[0.06] border border-white/10 p-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.16em]">Account verified</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Enterprise partner access</p>
                </div>
            </div>
        </div>

        <div className="p-4 mt-auto border-t border-white/10">
            <button 
                onClick={() => { localStorage.removeItem('supplierToken'); navigate('/supplier-login'); }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-black text-sm uppercase tracking-widest"
            >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
            </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 transition-all duration-500 w-full min-w-0 lg:ml-[280px]">
        {/* Top Header */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-slate-200 px-4 lg:px-8 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3 lg:gap-5">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm lg:hidden">
                    {isSidebarOpen ? <X className="w-4 h-4 text-slate-600" /> : <Menu className="w-4 h-4 text-slate-600" />}
                </button>
                <div className="h-8 w-px bg-slate-200 hidden lg:block" />
                <div className="flex items-center gap-2 lg:gap-3.5 group cursor-pointer">
                    <motion.img 
                        whileHover={{ scale: 1.05 }}
                        src={supplier.logoUrl || 'https://placehold.co/40x40/blue/white?text=S'} 
                        className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl object-contain border border-slate-200 shadow-sm bg-white p-1.5" 
                        alt={supplier.name} 
                    />
                    <div className="max-w-[120px] lg:max-w-none truncate">
                        <h2 className="text-sm lg:text-base font-black text-slate-900 tracking-tight leading-none mb-1 truncate">{supplier.name}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">{supplier.locationCode || 'Operational'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-5">
                <div className="hidden lg:flex flex-col text-right items-end">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Verified live</span>
                    </div>
                </div>
                <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
                <button className="relative p-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm">
                    <Bell className="w-5 h-5 text-slate-500" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="p-3 sm:p-4 lg:p-8 xl:p-10 max-w-[1500px] mx-auto min-h-[calc(100vh-100px)]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                    {activeSection === 'dashboard' && <DashboardOverview stats={stats} bookings={bookings} supplier={supplier} onGenerateReport={handleGenerateReport} setActiveSection={setActiveSection} />}
                    {activeSection === 'reservations' && <ReservationsSection bookings={bookings} />}
                    {activeSection === 'fleet' && (
                        <FleetSection
                            supplier={supplier}
                            cars={cars}
                            stopSales={stopSales}
                            onCarsChanged={refreshCars}
                            setActiveSection={setActiveSection}
                        />
                    )}
                    {activeSection === 'rates' && <RatesSection supplier={supplier} cars={cars} />}
                    {activeSection === 'stopsales' && <StopSalesSection stopSales={stopSales} onRefresh={refreshStopSales} />}
                    {activeSection === 'extras' && <ExtrasSection />}
                    {activeSection === 'locations' && <LocationsSection />}
                    {activeSection === 'profile' && <ProfileSection supplier={supplier} onSupplierUpdated={setSupplier} />}
                </motion.div>
            </AnimatePresence>
            
            <footer className="mt-20 py-10 border-t border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                    &copy; {new Date().getFullYear()} Hogicar Partnership Network &bull; Secured with Enterprise Encryption
                </p>
            </footer>
        </div>
      </main>
    </div>
  );
};

// ==================== Dashboard Overview ====================
const DashboardOverview = ({ stats, bookings, supplier, onGenerateReport, setActiveSection }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-7">
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl shadow-slate-300/40">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-slate-200" />
        <div className="relative p-6 lg:p-8 flex flex-col xl:flex-row justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-5 min-w-0">
                <div className="relative group">
                    <img
                        src={supplier.logoUrl || 'https://placehold.co/96x96/0f172a/ffffff?text=S'}
                        className="w-20 h-20 rounded-2xl object-contain border border-white/10 bg-white shadow-xl shadow-black/20 p-2 transition-transform group-hover:scale-105"
                        alt={supplier.name}
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">Verified supplier</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{supplier.locationCode || 'Multi-location'}</span>
                    </div>
                    <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tight leading-tight truncate">Supplier command center</h1>
                    <p className="text-sm text-slate-400 font-semibold mt-2 max-w-2xl">
                        {supplier.name} operations, reservations, pricing, availability, and fleet control in one workspace.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 xl:min-w-[360px]">
                <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Fleet</p>
                    <p className="text-xl font-black text-white">{stats.activeCars}/{stats.totalCars}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Pending</p>
                    <p className="text-xl font-black text-white">{stats.pendingCount}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Stop sales</p>
                    <p className="text-xl font-black text-white">{stats.activeStopSales}</p>
                </div>
            </div>
        </div>
    </div>

    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-950 tracking-tight">Operational overview</h2>
            <p className="text-xs lg:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Live commercial and fulfillment performance</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Last 7 Days</button>
            <button 
                onClick={onGenerateReport}
                className="flex-1 md:flex-none px-5 py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-300 hover:bg-blue-700 transition-all"
            >
                Generate Report
            </button>
        </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={DollarSign} title="Est. Revenue" value={`$${(stats.totalRevenue / 1).toFixed(0)}`} change="+12.5%" color="green" />
        <StatCard icon={Calendar} title="Total Bookings" value={stats.totalBookings} color="blue" change="+5.2%" onClick={() => setActiveSection('reservations')} />
        <StatCard icon={Car} title="Active Fleet" value={`${stats.activeCars}/${stats.totalCars}`} color="green" onClick={() => setActiveSection('fleet')} />
        <StatCard icon={Clock} title="Stop Sales" value={stats.activeStopSales} color="amber" onClick={() => setActiveSection('stopsales')} />
        <StatCard icon={Zap} title="Pending Actions" value={stats.pendingCount} color="violet" onClick={() => setActiveSection('reservations')} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <SectionHeader title="Performance Analytics" icon={TrendingUp} subtitle="Daily booking trends and volume" />
            </div>
            <div className="h-[350px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <AreaChart data={[
                        { name: 'Mon', bookings: 4, revenue: 1200 },
                        { name: 'Tue', bookings: 7, revenue: 2100 },
                        { name: 'Wed', bookings: 5, revenue: 1500 },
                        { name: 'Thu', bookings: 9, revenue: 3200 },
                        { name: 'Fri', bookings: 12, revenue: 4500 },
                        { name: 'Sat', bookings: 15, revenue: 5800 },
                        { name: 'Sun', bookings: 10, revenue: 3800 },
                    ]}>
                        <defs>
                            <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.16}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} dx={-10} />
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                            itemStyle={{fontWeight: 'bold', fontSize: '12px'}}
                        />
                        <Area type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorBook)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 lg:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Recent Activity" icon={History} subtitle="Live operational feed" />
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase border border-emerald-100">Live</span>
            </div>
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {bookings.slice(0, 8).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-slate-950 group-hover:text-white transition-all">
                                {b.firstName?.[0]}{b.lastName?.[0]}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-950 group-hover:text-blue-700 transition-colors">{b.firstName} {b.lastName}</div>
                                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{b.bookingRef} • {b.pickupCode}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-950">${b.netPrice}</div>
                            <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1 inline-block ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {b.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  </motion.div>
);

// ==================== Reservations Section ====================
const ReservationsSection = ({ bookings }: { bookings: Booking[] }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = bookings.filter(b => {
        const matchesSearch = (b.bookingRef?.toLowerCase() || '').includes(search.toLowerCase()) || 
                              (`${b.firstName} ${b.lastName}`.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleConfirm = async (id: any) => {
        const conf = prompt("Enter confirmation number:");
        if (!conf) return;
        try {
            await supplierApi.confirmBookingBySupplier(id, conf);
            alert("Confirmed!");
            window.location.reload();
        } catch (e) {
            alert("Failed to confirm");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200">
                <SectionHeader title="Reservations Management" icon={Calendar} subtitle="Manage incoming booking requests" />
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Search by ID or Name..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="px-8 py-5">Reference</th>
                            <th className="px-8 py-5">Customer</th>
                            <th className="px-8 py-5">Schedule</th>
                            <th className="px-8 py-5">Route</th>
                            <th className="px-8 py-5">Net Earnings</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map((b) => (
                            <tr key={b.id} className="hover:bg-blue-50/20 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="font-mono text-[11px] font-black text-blue-700 group-hover:scale-105 transition-transform origin-left">{b.bookingRef}</div>
                                    <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">ID: {b.id}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-[13px] font-black text-slate-900 leading-tight">{b.firstName} {b.lastName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold lowercase mt-0.5">{b.email}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-[11px] font-black text-slate-700">{b.pickupDate}</div>
                                    <div className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1 uppercase"><Clock className="w-2.5 h-2.5" /> {b.startTime}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="info">{b.pickupCode}</Badge>
                                        <ChevronRight className="w-3 h-3 text-slate-200" />
                                        <Badge variant="info">{b.dropoffCode}</Badge>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-[13px] font-black text-slate-900">${b.netPrice}</div>
                                    <div className="text-[9px] text-emerald-700 font-black uppercase tracking-tighter">Net amount</div>
                                </td>
                                <td className="px-8 py-6">
                                    <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'error'}>
                                        {b.status}
                                    </Badge>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {b.status === 'pending' && (
                                            <button onClick={() => handleConfirm(b.id)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100">
                                            <FileText className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                {filtered.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-4 border-2 border-dashed border-gray-100">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No matching records found</h3>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ==================== Fleet Section ====================
const FleetSection = ({
    supplier,
    cars,
    stopSales,
    onCarsChanged,
    setActiveSection,
}: {
    supplier: Supplier,
    cars: CarType[],
    stopSales: any[],
    onCarsChanged: () => Promise<void>,
    setActiveSection: (s: string) => void,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredCars = useMemo(() => {
    return selectedCategory === 'ALL' 
      ? cars 
      : cars.filter(car => car.category === selectedCategory);
  }, [cars, selectedCategory]);

  const handleDelete = async (id: any) => {
    if (!window.confirm('Erase this vehicle from fleet?')) return;
    try {
      await supplierApi.deleteCar(id);
      await onCarsChanged();
    } catch (e) { alert("Failed to delete"); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionHeader title="Fleet Management" icon={Car} subtitle="Manage your vehicle inventory" />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative hidden md:block">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer min-w-[180px]"
            >
              <option value="ALL">All Categories</option>
              {Object.values(CarCategory).map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <button 
              onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-300 hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Mobile Category Filter */}
      <div className="md:hidden overflow-x-auto pb-2 flex gap-2">
        <button 
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === 'ALL' ? 'bg-blue-700 text-white' : 'bg-white text-gray-400'}`}
        >
          All
        </button>
        {Object.values(CarCategory).map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-700 text-white' : 'bg-white text-gray-400'}`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCars.map(car => (
            <motion.div 
                key={car.id} 
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/70 border border-slate-200 overflow-hidden group transition-all"
            >
                <div className="relative h-44 bg-slate-50 flex items-center justify-center p-7 overflow-hidden border-b border-slate-100">
                    <img 
                        src={car.imageUrl || car.image || 'https://placehold.co/400x250/blue/white?text=Vehicle'} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                        alt={car.name}
                        width="400"
                        height="250"
                        referrerPolicy="no-referrer"
                        loading="eager"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge variant={(car.isAvailable || car.available) ? 'success' : 'error'}>{(car.isAvailable || car.available) ? 'Available' : 'Maintenance'}</Badge>
                        {stopSales.some(ss => {
                            const now = new Date();
                            now.setHours(0,0,0,0);
                            return ss.carId === Number(car.id) && new Date(ss.startDate) <= now && new Date(ss.endDate) >= now;
                        }) && (
                            <Badge variant="error" className="bg-blue-700 text-white border-none shadow-lg shadow-blue-200">Stop Sale Active</Badge>
                        )}
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-950 tracking-tight">{car.name}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{car.make} {car.model} • {car.year}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase">{car.sippCode}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-slate-500">
                            <User className="w-3 h-3 text-blue-500" />
                            <span className="text-[11px] font-bold">{car.passengers} Seats</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Package className="w-3 h-3 text-blue-500" />
                            <span className="text-[11px] font-bold">{car.bags} Large Bags</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Settings className="w-3 h-3 text-blue-500" />
                            <span className="text-[11px] font-bold uppercase">{car.transmission}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Briefcase className="w-3 h-3 text-blue-500" />
                            <span className="text-[11px] font-bold uppercase">{car.category}</span>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingCar(car); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition-all">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(car.id)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={() => setActiveSection('rates')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Manage Rates</button>
                    </div>
                </div>
            </motion.div>
        ))}
        {filteredCars.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                    <Car className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">No vehicles found</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Try choosing a different category</p>
            </div>
        )}
      </div>

      <EditCarModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        car={editingCar} 
        supplier={supplier} 
        onSave={() => { onCarsChanged(); setActiveSection('fleet'); }} 
      />
    </motion.div>
  );
};

// ==================== History Section ====================

const HistorySection = ({ history, onRestore, onDownload, onDelete }: { 
    history: ExcelDownloadHistory[], 
    onRestore: (id: number) => void, 
    onDownload: (locationCode?: string) => void,
    onDelete: (id: number) => void
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Excel Download History</h3>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">File Type</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-900">{format(parseISO(item.downloadedAt), 'MMM d, yyyy HH:mm')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Badge variant="info">{item.fileType}</Badge>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-medium text-gray-600 uppercase">{item.locationCode || 'All Locations'}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onRestore(item.id)}
                                                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Restore Config
                                            </button>
                                            <button 
                                                onClick={() => onDownload(item.locationCode)}
                                                className="p-2 bg-gray-900 text-white rounded-xl hover:bg-blue-700 transition-all"
                                                title="Download Template with these settings"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(item.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                                title="Delete this history record"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <History className="w-12 h-12 mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No download history available</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================== Manual Pricing Section ====================
const ManualPricingSection = ({ config, cars, existingTiers = [], onUpdate, onBack, activeLocation }: { config: TemplateConfig, cars: CarType[], existingTiers?: CarRateTier[], onUpdate: () => void, onBack: () => void, activeLocation: string }) => {
    const [targetType, setTargetType] = useState<'car' | 'category' | 'sipp'>('car');
    const [selectedCarIds, setSelectedCarIds] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSipps, setSelectedSipps] = useState<string[]>([]);
    
    const [selectedPeriodIdxs, setSelectedPeriodIdxs] = useState<number[]>([]);
    const [activePeriodTab, setActivePeriodTab] = useState<'seasons' | 'custom'>('seasons');
    const [customPeriods, setCustomPeriods] = useState<any[]>([{
        name: 'Manual Update',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
    }]);

    const [sessionBands, setSessionBands] = useState<BandConfig[]>(config.bands?.length ? config.bands : [{ minDays: 1, maxDays: null, perMonth: false }]);
    const [gridData, setGridData] = useState<Record<string, { dailyRate: string, deposit: string }[]>>({}); // key: targetId-period-range
    const [isSaving, setIsSaving] = useState(false);
    const [applyToAllLocations, setApplyToAllLocations] = useState(false);

    const categories = useMemo(() => Array.from(new Set(cars.map(c => c.category))).sort(), [cars]);
    const sipps = useMemo(() => Array.from(new Set(cars.map(c => c.sippCode))).sort(), [cars]);

    const targets = useMemo(() => {
        const res: { type: string, values: string[], label: string, subLabel: string, id: string }[] = [];
        if (targetType === 'car') {
            selectedCarIds.forEach(id => {
                const car = cars.find(c => Number(c.id) === id);
                if (car) res.push({ type: 'car', values: [String(id)], label: `${car.make} ${car.model}`, subLabel: car.sippCode, id: `car-${id}` });
            });
        } else if (targetType === 'category') {
            selectedCategories.forEach(cat => {
                res.push({ type: 'category', values: [cat], label: cat, subLabel: 'Category', id: `cat-${cat}` });
            });
        } else if (targetType === 'sipp') {
            selectedSipps.forEach(sipp => {
                res.push({ type: 'sipp', values: [sipp], label: sipp, subLabel: 'SIPP Code', id: `sipp-${sipp}` });
            });
        }
        return res;
    }, [targetType, selectedCarIds, selectedCategories, selectedSipps, cars]);

    const activePeriods = useMemo(() => {
        const list = (selectedPeriodIdxs || []).map(idx => config.periods![idx]);
        customPeriods.forEach(cp => {
            list.push({
                ...cp,
                bands: sessionBands
            });
        });
        return list;
    }, [selectedPeriodIdxs, customPeriods, config, sessionBands]);

    const combinations = useMemo(() => {
        const res: { target: any, period: any }[] = [];
        targets.forEach(target => {
            activePeriods.forEach(period => {
                res.push({ target, period });
            });
        });
        return res;
    }, [targets, activePeriods]);

    useEffect(() => {
        setGridData(prev => {
            const next = { ...prev };
            combinations.forEach(({ target, period }) => {
                const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
                if (!next[key] || next[key].length !== sessionBands.length) {
                    const existingData = next[key] || [];
                    
                    // Try to pre-fill from existing tiers if it's a car and we have data
                    let initial = sessionBands.map((_, i) => existingData[i] || { dailyRate: '', deposit: '' });
                    
                    if (!next[key] && target.type === 'car') {
                        const existing = existingTiers?.find(t => 
                            Number(t.carId) === Number(target.values[0]) && 
                            t.startDate === period.startDate && 
                            t.endDate === period.endDate
                        );
                        if (existing && existing.bands?.length > 0) {
                            initial = sessionBands.map(sb => {
                                const match = existing.bands.find(eb => eb.minDays === sb.minDays);
                                return {
                                    dailyRate: match ? String(match.dailyRate) : '',
                                    deposit: match ? String(match.deposit) : ''
                                };
                            });
                        }
                    }
                    next[key] = initial;
                }
            });
            return next;
        });
    }, [combinations, sessionBands, existingTiers]);

    const handleGridInput = (key: string, bandIdx: number, field: 'dailyRate' | 'deposit', value: string) => {
        const normalized = value.replace(',', '.');
        if (!/^\d*\.?\d{0,2}$/.test(normalized) && normalized !== '') return;

        setGridData(prev => ({
            ...prev,
            [key]: prev[key].map((b, i) => i === bandIdx ? { ...b, [field]: normalized } : b)
        }));
    };

    const handleApply = async () => {
        if (combinations.length === 0) {
            alert('Please select at least one car/category and one period.');
            return;
        }

        const invalid = combinations.find(({ target, period }) => {
            const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
            const bands = gridData[key] || [];
            return bands.some(b => !String(b.dailyRate || '').trim() || Number(b.dailyRate) <= 0);
        });

        if (invalid) {
            alert(`Please enter valid rates for ${invalid.target.label} in period ${invalid.period.name}`);
            return;
        }

        setIsSaving(true);
        try {
            const seasons = combinations.map(({ target, period }) => {
                const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
                const data = gridData[key];
                return {
                    targetType: target.type,
                    targetValues: target.values,
                    periodName: period.name,
                    startDate: period.startDate,
                    endDate: period.endDate,
                    rates: sessionBands.map((sb, i) => ({
                        minDays: sb.minDays,
                        maxDays: sb.maxDays,
                        dailyRate: Number(data[i].dailyRate),
                        deposit: Number(data[i].deposit)
                    }))
                };
            });

            await supplierApi.bulkUpdateRates({
                currency: config.currency,
                applyToAllLocations,
                seasons
            });

            alert('Rates updated successfully!');
            onUpdate();
        } catch (e) {
            alert('Failed to update rates.');
        } finally {
            setIsSaving(false);
        }
    };

    const addBand = () => {
        const last = sessionBands[sessionBands.length - 1];
        const nextMin = last ? (last.maxDays || last.minDays) + 1 : 1;
        setSessionBands([...sessionBands, { minDays: nextMin, maxDays: null, perMonth: false }]);
    };

    const removeBand = (idx: number) => {
        if (sessionBands.length <= 1) return;
        setSessionBands(sessionBands.filter((_, i) => i !== idx));
    };

    const updateBand = (idx: number, field: keyof BandConfig, value: any) => {
        setSessionBands(sessionBands.map((b, i) => i === idx ? { ...b, [field]: value } : b));
    };

    const toggleCar = (id: number) => {
        setSelectedCarIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(v => v !== cat) : [...prev, cat]
        );
    };

    const toggleSipp = (sipp: string) => {
        setSelectedSipps(prev =>
            prev.includes(sipp) ? prev.filter(v => v !== sipp) : [...prev, sipp]
        );
    };

    const selectAllTargets = () => {
        if (targetType === 'car') setSelectedCarIds(cars.map(c => Number(c.id)));
        else if (targetType === 'category') setSelectedCategories([...categories]);
        else if (targetType === 'sipp') setSelectedSipps([...sipps]);
    };

    const clearTargets = () => {
        if (targetType === 'car') setSelectedCarIds([]);
        else if (targetType === 'category') setSelectedCategories([]);
        else if (targetType === 'sipp') setSelectedSipps([]);
    };

    const addCustomPeriod = () => {
        setCustomPeriods([...customPeriods, {
            name: `Manual Update ${customPeriods.length + 1}`,
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
        }]);
    };

    const removeCustomPeriod = (idx: number) => {
        setCustomPeriods(customPeriods.filter((_, i) => i !== idx));
    };

    const updateCustomPeriod = (idx: number, field: string, value: string) => {
        setCustomPeriods(customPeriods.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    };

    const togglePeriod = (idx: number) => {
        setSelectedPeriodIdxs(prev =>
            prev.includes(idx) ? prev.filter(v => v !== idx) : [...prev, idx]
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
            {/* Header with Back button */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-black uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Back to Rates
                </button>
                <div className="flex items-center gap-2">
                   <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-2">
                       <Zap className="w-4 h-4 text-blue-700" />
                       <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Manual Pricing Workspace</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* 1. Vehicles / Categories */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-gray-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Targets</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={selectAllTargets} className="px-2 py-1 text-[8px] font-black text-blue-600 uppercase hover:bg-blue-50 rounded-md transition-colors">All</button>
                                <button onClick={clearTargets} className="px-2 py-1 text-[8px] font-black text-gray-400 uppercase hover:bg-gray-100 rounded-md transition-colors">None</button>
                            </div>
                        </div>

                        <div className="flex p-1 bg-gray-50 rounded-xl mb-4">
                            {(['car', 'category', 'sipp'] as const).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setTargetType(type)}
                                    className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${targetType === type ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
                                >
                                    {type}s
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {targetType === 'car' && cars.map(car => {
                                const isSelected = selectedCarIds.includes(Number(car.id));
                                return (
                                    <button
                                        key={car.id}
                                        onClick={() => toggleCar(Number(car.id))}
                                        className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                                            isSelected ? 'bg-blue-700 border-blue-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>{car.make} {car.model}</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-tighter ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{car.sippCode}</span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}

                            {targetType === 'category' && categories.map(cat => {
                                const isSelected = selectedCategories.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                                            isSelected ? 'bg-blue-700 border-blue-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-900'}`}>{cat}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}

                            {targetType === 'sipp' && sipps.map(sipp => {
                                const isSelected = selectedSipps.includes(sipp);
                                return (
                                    <button
                                        key={sipp}
                                        onClick={() => toggleSipp(sipp)}
                                        className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                                            isSelected ? 'bg-blue-700 border-blue-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-900'}`}>{sipp}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Periods */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Periods</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex p-1 bg-gray-50 rounded-xl mb-4">
                                <button 
                                    onClick={() => setActivePeriodTab('seasons')}
                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activePeriodTab === 'seasons' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Seasons ({selectedPeriodIdxs.length})
                                </button>
                                <button 
                                    onClick={() => setActivePeriodTab('custom')}
                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activePeriodTab === 'custom' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Custom ({customPeriods.length})
                                </button>
                            </div>

                            {activePeriodTab === 'seasons' ? (
                                <div className="space-y-2">
                                    {config.periods?.length > 0 ? (
                                        config.periods.map((p, idx) => {
                                            const isSelected = selectedPeriodIdxs.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => togglePeriod(idx)}
                                                    className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                                                        isSelected 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                                                        : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-900'}`}>{p.name}</span>
                                                        <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{p.startDate} - {p.endDate}</span>
                                                    </div>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="py-8 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No predefined seasons</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {customPeriods.map((cp, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group/period">
                                            {customPeriods.length > 1 && (
                                                <button 
                                                    onClick={() => removeCustomPeriod(idx)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/period:opacity-100 transition-opacity z-10"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Period Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={cp.name}
                                                        onChange={e => updateCustomPeriod(idx, 'name', e.target.value)}
                                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black outline-none focus:border-blue-500 transition-all"
                                                        placeholder="e.g. Summer Special"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Start Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={cp.startDate}
                                                        onChange={e => updateCustomPeriod(idx, 'startDate', e.target.value)}
                                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black outline-none focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">End Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={cp.endDate}
                                                        onChange={e => updateCustomPeriod(idx, 'endDate', e.target.value)}
                                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black outline-none focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={addCustomPeriod}
                                        className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Custom Range</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Rental Duration Bands */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-gray-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Rental Bands</h3>
                            </div>
                            <button onClick={addBand} className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {sessionBands.map((band, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 relative group/band">
                                    <button 
                                        onClick={() => removeBand(idx)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/band:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-gray-400 uppercase">Min Days</label>
                                            <input 
                                                type="number" 
                                                value={band.minDays}
                                                onChange={e => updateBand(idx, 'minDays', parseInt(e.target.value))}
                                                className="w-full p-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-black outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-gray-400 uppercase">Max Days</label>
                                            <input 
                                                type="number" 
                                                value={band.maxDays || ''}
                                                onChange={e => updateBand(idx, 'maxDays', e.target.value ? parseInt(e.target.value) : null)}
                                                placeholder="+"
                                                className="w-full p-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-black outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rates Table Workspace */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Manual Rates Editor</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Configure pricing for selected vehicle/period combinations</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected:</span>
                                <span className="text-xs font-black text-blue-700">{combinations.length} Units</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Selection</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing Period</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rental Days</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-blue-700 uppercase tracking-widest">Daily Rate ({config.currency})</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest">Bond/Deposit ({config.currency})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {combinations.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 grayscale opacity-50">
                                                    <Package className="w-12 h-12 text-gray-300" />
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No combinations selected. Choose vehicles and periods from the sidebar.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        combinations.map(({ target, period }) => {
                                            const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
                                            const data = gridData[key] || [];
                                            
                                            return sessionBands.map((band, bIdx) => (
                                                <tr key={`${key}-${bIdx}`} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-gray-900">{target.label}</span>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{target.subLabel}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-gray-700 uppercase">{period.name}</span>
                                                            <span className="text-[9px] font-bold text-gray-400">{period.startDate} - {period.endDate}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1 rounded-full bg-gray-100 text-[9px] font-black text-gray-600 uppercase tracking-tighter border border-gray-200">
                                                            {band.minDays}-{band.maxDays || '+'} Days
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="relative max-w-[120px]">
                                                            <input
                                                                type="text"
                                                                value={data[bIdx]?.dailyRate || ''}
                                                                onChange={(e) => handleGridInput(key, bIdx, 'dailyRate', e.target.value)}
                                                                placeholder="0.00"
                                                                className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                            />
                                                            <DollarSign className="w-3 h-3 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="relative max-w-[140px] flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={data[bIdx]?.deposit || ''}
                                                                    onChange={(e) => handleGridInput(key, bIdx, 'deposit', e.target.value)}
                                                                    placeholder="0"
                                                                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                                />
                                                                <Shield className="w-3 h-3 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                            </div>
                                                            {config.bonds && config.bonds.length > 0 && (
                                                                <div className="group/dropdown relative">
                                                                    <button className="p-2 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 text-blue-600 transition-colors">
                                                                        <Plus className="w-3 h-3" />
                                                                    </button>
                                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 hidden group-hover/dropdown:block z-50">
                                                                        <p className="px-4 pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-2">Select Bond</p>
                                                                        {config.bonds.map((b, i) => (
                                                                            <button 
                                                                                key={i}
                                                                                onClick={() => handleGridInput(key, bIdx, 'deposit', String(b.price))}
                                                                                className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                                                                            >
                                                                                <p className="text-[10px] font-black text-gray-900">{b.name}</p>
                                                                                <p className="text-[9px] font-bold text-blue-600">{config.currency} {b.price}</p>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {combinations.length > 0 && (
                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id="apply-all-final"
                                            checked={applyToAllLocations}
                                            onChange={e => setApplyToAllLocations(e.target.checked)}
                                            className="w-5 h-5 text-blue-700 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="apply-all-final" className="text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] cursor-pointer">
                                        Apply these updates to <span className="text-blue-700">All Locations</span>
                                    </label>
                                </div>

                                <button
                                    onClick={handleApply}
                                    disabled={isSaving}
                                    className="px-12 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Updating Rates...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Submit Rates
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ==================== Rates Section ====================
const RatesSection = ({ supplier, cars }: { supplier: Supplier, cars: CarType[] }) => {
    const [config, setConfig] = useState<TemplateConfig | null>(null);
    const [existingTiers, setExistingTiers] = useState<CarRateTier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [isManualPricingActive, setIsManualPricingActive] = useState(false);
    const [history, setHistory] = useState<ExcelDownloadHistory[]>([]);

    const supplierLocationOptions = useMemo(() => (
        (supplier.locations || [])
            .map((loc: any) => {
                const code = String(loc?.value ?? loc?.locationCode ?? '').trim().toUpperCase();
                const label = String(loc?.label ?? loc?.displayName ?? code).trim();
                return { code, label };
            })
            .filter((loc: any) => loc.code && loc.code !== 'ALL' && loc.code !== 'GLOBAL')
    ), [supplier.locations]);

    useEffect(() => {
        if (supplierLocationOptions.length === 0) {
            if (selectedLocation !== '') setSelectedLocation('');
            return;
        }

        const isCurrentValid = supplierLocationOptions.some((loc: any) => loc.code === selectedLocation);
        if (!isCurrentValid) {
            setSelectedLocation(supplierLocationOptions[0].code);
        }
    }, [supplierLocationOptions, selectedLocation]);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const locCode = selectedLocation || undefined;
            const res = await supplierApi.getTemplateConfig(locCode);
            setConfig(res.data);
            
            // Also fetch all tiers
            const tiersRes = await supplierApi.getAllRates();
            setExistingTiers(tiersRes.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchHistory = async () => {
        try {
            const res = await supplierApi.getExcelHistory();
            setHistory(res.data);
        } catch (e) { console.error("History fetch failed", e); }
    };

    useEffect(() => { 
        fetchConfig(); 
        fetchHistory();
    }, [selectedLocation]);

    const handleRestore = async (historyId: number) => {
        if (!confirm("Are you sure you want to restore this configuration? It will overwrite your current settings for the template.")) return;
        try {
            setIsSaving(true);
            await supplierApi.restoreFromHistory(historyId);
            await fetchConfig();
            await fetchHistory();
            alert("Configuration restored successfully!");
        } catch (e) {
            alert("Restore failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        try {
            const locCode = selectedLocation || undefined;
            const res = await supplierApi.downloadTemplate(locCode);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const filenameSuffix = selectedLocation || 'Default';
            link.setAttribute('download', `HogiCar_Rates_${supplier.name.replace(/\s/g, '_')}_${filenameSuffix}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) { alert("Download failed"); }
    };

    const handleImport = async () => {
        if (!uploadFile) return;
        setIsSaving(true);
        try {
            await supplierApi.importRates(uploadFile);
            alert("Rates imported successfully!");
            setUploadFile(null);
            fetchConfig();
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || e.message || "Import failed. Check template format.";
            alert("Import failed: " + errorMsg);
        }
        finally { setIsSaving(false); }
    };

    const handleDeleteRate = async (tierId: number) => {
        if (!confirm("Are you sure you want to delete this pricing period?")) return;
        try {
            await supplierApi.deleteRate(tierId);
            fetchConfig();
        } catch (e) { alert("Delete failed"); }
    };

    const handleDeleteHistory = async (historyId: number) => {
        if (!confirm("Delete this history record permanently?")) return;
        try {
            await supplierApi.deleteExcelHistory(historyId);
            await fetchHistory();
        } catch (e) {
            alert("Delete failed");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <SectionHeader title="Rates Management" icon={DollarSign} subtitle="Dynamic pricing and bulk imports" />
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                    <select 
                        value={selectedLocation} 
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-gray-900 outline-none pr-8 cursor-pointer"
                    >
                        {supplierLocationOptions.map((loc: any) => (
                            <option key={loc.code} value={loc.code}>{loc.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm w-full">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pricing Workflow Mode</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                        onClick={() => setIsManualPricingActive(false)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            !isManualPricingActive
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                : 'bg-gray-50 text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Spreadsheet & Template Mode
                    </button>
                    <button
                        onClick={() => setIsManualPricingActive(true)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                            isManualPricingActive
                                ? 'bg-blue-700 text-white shadow-lg shadow-blue-200'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        Change Rates Manually
                    </button>
                </div>
            </div>

            {!isManualPricingActive ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Export Section */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 border border-blue-100/50">
                                <Download className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3">Download Rates Template</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-sm">
                                Get the latest spreadsheet with your fleet pre-populated.
                            </p>
                            <button onClick={handleDownload} className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                                <Download className="w-4 h-4" /> Download XLSX
                            </button>
                        </div>

                        {/* Import Section */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mb-6 border border-green-100/50">
                                <Upload className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3">Bulk Rate Import</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-sm">
                                Upload your completed Excel template to update pricing instantly.
                            </p>
                            <div className="w-full space-y-4">
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept=".xlsx,.xls"
                                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-all ${uploadFile ? 'border-green-500 bg-green-50/50' : 'border-gray-100 bg-gray-50/30 group-hover:border-blue-500'}`}>
                                        <FileText className={`w-5 h-5 ${uploadFile ? 'text-green-600' : 'text-gray-300'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${uploadFile ? 'text-green-900' : 'text-gray-400'}`}>
                                            {uploadFile ? uploadFile.name : 'Choose Excel File'}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleImport}
                                    disabled={!uploadFile || isSaving}
                                    className="w-full py-4 bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 disabled:opacity-50 hover:scale-[1.02] transition-all"
                                >
                                    {isSaving ? 'Processing...' : 'Sync Rates Now'}
                                </button>
                            </div>
                        </div>

                        {/* Manual Pricing Trigger Card */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center group cursor-pointer hover:border-blue-500 transition-all" onClick={() => setIsManualPricingActive(true)}>
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-700 mb-6 border border-blue-100/50 group-hover:scale-110 transition-transform">
                                <Zap className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3">Manual Rate Change</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-sm">
                                Open the manual section to choose cars, create period, and define bond prices.
                            </p>
                            <button className="w-full py-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl text-xs font-black uppercase tracking-[0.2em] group-hover:bg-blue-700 group-hover:text-white transition-all flex items-center justify-center gap-3">
                                <Settings2 className="w-4 h-4" /> Start Manual Update
                            </button>
                        </div>
                    </div>

                    {/* Template Preview */}
                    <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-black tracking-tighter mb-2">Configure Rate Template</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Define seasons, periods, and day bands</p>
                            </div>
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Edit Structure
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                config && (
                    <ManualPricingSection 
                        config={config} 
                        cars={cars}
                        existingTiers={existingTiers}
                        onUpdate={() => {
                            fetchConfig();
                        }} 
                        onBack={() => setIsManualPricingActive(false)}
                        activeLocation={selectedLocation}
                    />
                )
            )}

            {/* Strategy Overview */}
            {config && !isManualPricingActive && (
                <div className="space-y-8">
                    {selectedLocation && !config.locationCode && (
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <Globe className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Using Global Strategy</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        This location doesn't have a custom configuration yet.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="px-6 py-3 bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-200"
                            >
                                Customize for this location
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <Calendar className="w-6 h-6 text-blue-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Pricing Seasons</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Defined time periods for dynamic rates</p>
                            </div>
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="p-2 hover:bg-blue-50 rounded-xl text-blue-700 transition-all"
                                title="Edit Strategy"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {config.periods?.map((p, idx) => (
                                <div key={idx} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-blue-200 transition-all">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">{p.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>{p.startDate}</span>
                                        <span className="text-blue-500">→</span>
                                        <span>{p.endDate}</span>
                                    </div>
                                </div>
                            ))}
                            {config.periods?.length === 0 && (
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest p-4">No seasons defined yet. Click "Edit Structure" to start.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Operational Rules</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Booking & Duration Constraints</p>
                            </div>
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-all"
                                title="Edit Constraints"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Min Duration</p>
                                <p className="text-[10px] font-black text-gray-900">{config.minRentalDays || 1} Days</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Duration</p>
                                <p className="text-[10px] font-black text-gray-900">{config.maxRentalDays || 30} Days</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Min Lead Time</p>
                                <p className="text-[10px] font-black text-gray-900">{config.minBookingLeadTime || 0} Hrs</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Grace Period</p>
                                <p className="text-[10px] font-black text-gray-900">{config.gracePeriodHours || 0} Hrs</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Lead Time</p>
                                <p className="text-[10px] font-black text-gray-900">{config.maxBookingLeadTimeDays || 365} Days</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">One Way Fee</p>
                                <p className="text-[10px] font-black text-gray-900">{config.oneWayFee || 0} {config.currency}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {config.bands?.map((b, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{b.label || `${b.minDays}-${b.maxDays || '∞'} Days`}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.minDays} to {b.maxDays || '∞'} d</span>
                                </div>
                            ))}
                            {config.bands?.length === 0 && (
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest p-4">No day bands defined.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Pricing Inventory */}
                {existingTiers.length > 0 && (
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-green-50 rounded-2xl">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Pricing Inventory</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Directly view your current car rates and periods</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-10 px-10">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Car Model</th>
                                        <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Period / Season</th>
                                        <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dates</th>
                                        <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price Summary</th>
                                        <th className="text-right py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {existingTiers
                                        .filter(tier => {
                                            const car = cars.find(c => Number(c.id) === Number(tier.carId));
                                            return !selectedLocation || car?.location === selectedLocation;
                                        })
                                        .map((tier) => {
                                            const car = cars.find(c => Number(c.id) === Number(tier.carId));
                                            return (
                                                <tr key={tier.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                                                                {car?.make?.charAt(0) || 'C'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{car?.make} {car?.model}</p>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{car?.sippCode || car?.category} • {car?.location}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <Badge variant="purple">{tier.name}</Badge>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{tier.startDate}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">to {tier.endDate}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-2">
                                                            {tier.bands.slice(0, 2).map((b, bidx) => (
                                                                <div key={bidx} className="px-2 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-600">
                                                                    {b.minDays}-{b.maxDays === 9999 ? '∞' : b.maxDays}d: {b.dailyRate} {tier.currency}
                                                                </div>
                                                            ))}
                                                            {tier.bands.length > 2 && <span className="text-[8px] font-bold text-gray-400">+{tier.bands.length - 2} more</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    setIsManualPricingActive(true);
                                                                }}
                                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteRate(tier.id)}
                                                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                                title="Delete Rates"
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
                    </div>
                )}
            </div>
            )}

            {!isManualPricingActive && (
                <HistorySection 
                    history={history} 
                    onRestore={handleRestore} 
                    onDownload={(loc) => {
                        if (loc) setSelectedLocation(loc);
                        handleDownload();
                    }} 
                    onDelete={handleDeleteHistory}
                />
            )}

            <TemplateConfigModal 
                isOpen={isConfigModalOpen} 
                onClose={() => setIsConfigModalOpen(false)} 
                config={config} 
                onSave={fetchConfig} 
                locationCode={selectedLocation}
                supplier={supplier}
            />
        </motion.div>
    );
};

// ==================== EditCarModal Component ====================
const EditCarModal = ({ isOpen, onClose, car, supplier, onSave }: any) => {
  const supplierLocations = useMemo(() => {
    return (supplier?.locations ?? [])
      .map((loc: any) => {
        const locationCode = String(loc?.locationCode ?? loc?.value ?? '').trim().toUpperCase();
        const displayName = loc?.displayName || loc?.label || loc?.name || locationCode;
        return { ...loc, locationCode, displayName };
      })
      .filter((loc: any) => loc.locationCode && loc.locationCode !== 'ALL' && loc.locationCode !== 'GLOBAL');
  }, [supplier]);

  const defaultLocationCode = supplierLocations[0]?.locationCode || String(supplier?.locationCode ?? '').trim().toUpperCase();

  const [formData, setFormData] = useState<any>({
    name: '', make: '', model: '', year: new Date().getFullYear(),
    sippCode: '', category: 'ECONOMY', transmission: 'MANUAL', fuelPolicy: 'FULL_TO_FULL',
    passengers: 5, bags: 2, doors: 4, airConditioning: true, imageUrl: '',
    deposit: 0, 
    unlimitedMileage: true, available: true,
    locationCode: defaultLocationCode,
    locationName: '',
  });
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (car) {
        const incomingCode = String(car?.locationCode ?? '').trim().toUpperCase();
        const matchedLocation = supplierLocations.find((loc: any) => loc.locationCode === incomingCode);
        const resolvedLocation = matchedLocation || supplierLocations[0] || null;

        setFormData({
          ...car,
          available: car.isAvailable ?? car.available,
          locationCode: resolvedLocation?.locationCode || '',
          locationName: resolvedLocation?.displayName || car?.locationName || '',
        });
      } else {
        setFormData({
          name: '', make: '', model: '', year: new Date().getFullYear(),
          sippCode: '', category: 'ECONOMY', transmission: 'MANUAL', fuelPolicy: 'FULL_TO_FULL',
          passengers: 5, bags: 2, doors: 4, airConditioning: true, imageUrl: '',
          deposit: 0, 
          unlimitedMileage: true, available: true,
          locationCode: defaultLocationCode,
          locationName: supplierLocations.find((loc: any) => loc.locationCode === defaultLocationCode)?.displayName || '',
        });
      }
      supplierApi.getCarModels().then(res => setCarModels(res.data)).catch(console.error);
    }
  }, [isOpen, car, supplier, supplierLocations, defaultLocationCode]);

  const handleModelSelect = (modelId: string) => {
    const selectedModel = carModels.find(m => m.id.toString() === modelId);
    if (selectedModel) {
        setFormData((prev: any) => ({
            ...prev,
            name: `${selectedModel.make} ${selectedModel.model} or Similar`,
            make: selectedModel.make,
            model: selectedModel.model,
            year: selectedModel.year || prev.year,
            category: selectedModel.category || prev.category,
            passengers: selectedModel.passengers || prev.passengers,
            bags: selectedModel.bags || prev.bags,
            doors: selectedModel.doors || prev.doors,
            imageUrl: selectedModel.imageUrl || selectedModel.image || prev.imageUrl,
        }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);

    const selectedLocation = supplierLocations.find(
      (loc: any) => loc.locationCode === String(formData.locationCode ?? '').trim().toUpperCase()
    );
    if (!selectedLocation) {
      alert('Please choose one of your active supplier locations before saving the car.');
      setIsSaving(false);
      return;
    }

    const payload = {
      ...formData,
      locationCode: selectedLocation.locationCode,
      locationName: selectedLocation.displayName || selectedLocation.locationCode,
    };

    try {
      if (car?.id) await supplierApi.updateCar(car.id, payload);
      else await supplierApi.createCar(payload);
      onSave(); 
      onClose();
    } catch (e) { alert("Failed to save car"); }
    finally { setIsSaving(false); }
  };

  const handleChange = (field: string, val: any) => setFormData((prev: any) => ({ ...prev, [field]: val }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={car ? 'Edit Vehicle' : 'Add New Vehicle'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-8">
            {!car && (
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Car className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Choose from Car Library</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Quickly pre-fill specs from our master catalog</p>
                        </div>
                    </div>
                    <select 
                        onChange={(e) => handleModelSelect(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        <option value="">Select a vehicle template...</option>
                        {carModels.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.make} {m.model} ({m.year})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Primary Specs</h3>
                    </div>
                    <InputField label="Display Name" value={formData.name} onChange={(e:any) => handleChange('name', e.target.value)} required readOnly={!!formData.carModelId} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Make" value={formData.make} onChange={(e:any) => handleChange('make', e.target.value)} required readOnly={!!formData.carModelId} />
                        <InputField label="Model" value={formData.model} onChange={(e:any) => handleChange('model', e.target.value)} required readOnly={!!formData.carModelId} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="SIPP Code" value={formData.sippCode} onChange={(e:any) => handleChange('sippCode', e.target.value)} required />
                        <InputField label="Year" type="number" value={formData.year} onChange={(e:any) => handleChange('year', parseInt(e.target.value))} required readOnly={!!formData.carModelId} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Configuration</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transmission</label>
                            <select value={formData.transmission} onChange={e => handleChange('transmission', e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20">
                                <option value="MANUAL">Manual</option>
                                <option value="AUTOMATIC">Automatic</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fuel Policy</label>
                            <select value={formData.fuelPolicy} onChange={e => handleChange('fuelPolicy', e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20">
                                <option value="FULL_TO_FULL">Full to Full</option>
                                <option value="SAME_TO_SAME">Same to Same</option>
                            </select>
                        </div>
                    </div>
                    <InputField label="Category" value={formData.category} onChange={(e:any) => handleChange('category', e.target.value)} readOnly={!!formData.carModelId} />
                    <InputField label="Image URL" value={formData.imageUrl} onChange={(e:any) => handleChange('imageUrl', e.target.value)} placeholder="https://..." readOnly={!!formData.carModelId} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <User className="w-3 h-3" /> Capacity
                    </h4>
                    <InputField label="Passengers" type="number" value={formData.passengers} onChange={(e:any) => handleChange('passengers', parseInt(e.target.value))} readOnly={!!formData.carModelId} />
                    <InputField label="Large Bags" type="number" value={formData.bags} onChange={(e:any) => handleChange('bags', parseInt(e.target.value))} readOnly={!!formData.carModelId} />
                    <InputField label="Doors" type="number" value={formData.doors} onChange={(e:any) => handleChange('doors', parseInt(e.target.value))} readOnly={!!formData.carModelId} />
                </div>
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Financials
                    </h4>
                    <InputField label="Security Deposit" type="number" prefix="$" value={formData.deposit} onChange={(e:any) => handleChange('deposit', parseFloat(e.target.value))} />
                </div>
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex flex-col justify-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.available} onChange={e => handleChange('available', e.target.checked)} className="w-5 h-5 rounded-lg text-blue-700 focus:ring-blue-500 border-gray-200" />
                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest group-hover:text-blue-700 transition-colors">Vehicle Online</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.unlimitedMileage} onChange={e => handleChange('unlimitedMileage', e.target.checked)} className="w-5 h-5 rounded-lg text-blue-700 focus:ring-blue-500 border-gray-200" />
                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest group-hover:text-blue-700 transition-colors">Unlimited Mileage</span>
                    </label>
                </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-xl">
                            <MapPin className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Availability & Location</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Where this vehicle can be picked up</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supplier Location</label>
                    <select 
                        value={formData.locationCode} 
                        onChange={e => {
                          const nextCode = e.target.value;
                          const nextLocation = supplierLocations.find((loc: any) => loc.locationCode === nextCode);
                          handleChange('locationCode', nextCode);
                          handleChange('locationName', nextLocation?.displayName || '');
                        }} 
                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                        required
                        disabled={supplierLocations.length === 0}
                    >
                        <option value="">Choose one of your active locations...</option>
                        {supplierLocations.map((loc: any) => (
                            <option key={loc.id || loc.locationCode} value={loc.locationCode}>{loc.displayName} ({loc.locationCode})</option>
                        ))}
                    </select>
                    {supplierLocations.length === 0 && (
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                            No active supplier locations available. Please request/activate a supplier location first.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-blue-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all disabled:opacity-50">
                    {isSaving ? 'Processing...' : (car ? 'Update Vehicle' : 'Add to Fleet')}
                </button>
            </div>
        </form>
    </Modal>
  );
};

// ==================== Simple Sub-sections ====================
const StopSalesSection = ({ stopSales, onRefresh }: { stopSales: any[], onRefresh: () => Promise<void> }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        category: CarCategory.ECONOMY,
        locationCode: ''
    });

    const handleApply = async () => {
        if (!formData.startDate || !formData.endDate || !formData.category) {
            alert("Please fill all required fields");
            return;
        }
        setIsSaving(true);
        try {
            const res = await supplierApi.bulkAddStopSale(formData);
            const count = res.data.affectedCars || 0;
            
            setIsLoading(true);
            await onRefresh();
            setIsLoading(false);
            
            setFormData({ ...formData, startDate: '', endDate: '' });
            
            alert(`Success! Blockout applied to ${count} matching vehicles.`);
        } catch (err: any) {
            console.error("Error applying stop sale:", err);
            const msg = err.response?.data || "Failed to apply blockout. Please check if you have cars in this category/location.";
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remove this stop sale?")) return;
        setIsLoading(true);
        try {
            await supplierApi.deleteStopSale(id);
            await onRefresh();
        } catch (err) {
            console.error("Error deleting stop sale:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                <SectionHeader title="Block Out Dates" icon={Clock} subtitle="Prevent bookings for specific categories" />
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <InputField 
                            label="Start Date" 
                            type="date" 
                            value={formData.startDate} 
                            onChange={(e: any) => setFormData({ ...formData, startDate: e.target.value })} 
                        />
                        <InputField 
                            label="End Date" 
                            type="date" 
                            value={formData.endDate} 
                            onChange={(e: any) => setFormData({ ...formData, endDate: e.target.value })} 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Car Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                {Object.values(CarCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <InputField 
                            label="Location Code (Optional)" 
                            placeholder="e.g. DXB" 
                            value={formData.locationCode}
                            onChange={(e: any) => setFormData({ ...formData, locationCode: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <button 
                        onClick={handleApply}
                        disabled={isSaving}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Processing...' : 'Apply Blockout'}
                    </button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                <SectionHeader title="Active Stop Sales" icon={Calendar} subtitle="Currently blocked vehicle ranges" />
                
                {isLoading ? (
                    <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading...</div>
                ) : stopSales.length === 0 ? (
                    <div className="py-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No active blockouts</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {stopSales.map((ss) => (
                            <div key={ss.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{ss.carInfo}</div>
                                    <div className="text-sm font-bold text-gray-900">
                                        {format(parseISO(ss.startDate), 'MMM dd, yyyy')} — {format(parseISO(ss.endDate), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(ss.id)}
                                    className="p-3 bg-white text-gray-400 rounded-xl hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const ExtrasSection = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        <div className="flex justify-between items-center">
            <SectionHeader title="Extras & Add-ons" icon={Package} subtitle="Manage optional services and insurance" />
            <button className="px-6 py-3 bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200">+ New Extra</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['GPS Navigation', 'Baby Seat', 'Additional Driver', 'Full Coverage'].map((extra, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-700 mb-6 border border-gray-100">
                        <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">{extra}</h3>
                    <div className="text-xs text-blue-700 font-black uppercase tracking-widest mb-6">$15.00 / day</div>
                    <div className="flex gap-2 pt-6 border-t border-gray-50">
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-900 transition-all"><Edit className="w-4 h-4" /></button>
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
        </div>
    </motion.div>
);

const LocationsSection = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 max-w-2xl">
        <SectionHeader title="Expand Network" icon={MapPin} subtitle="Request to operate at new locations" />
        <div className="space-y-6">
            <InputField label="Airport / City Search" icon={Search} placeholder="Enter IATA code or city name..." />
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-wider">
                    Note: All new location requests are reviewed by HogiCar Admin. Expansion usually takes 24-48 hours once approved.
                </p>
            </div>
            <button className="w-full py-4 bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 transition-all">Submit Expansion Request</button>
        </div>
    </motion.div>
);

const ProfileSection = ({ supplier, onSupplierUpdated }: { supplier: Supplier, onSupplierUpdated: (supplier: Supplier) => void }) => {
    const [logoUrl, setLogoUrl] = useState((supplier as any).logoUrl || '');
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const [logoError, setLogoError] = useState('');
    const [logoSuccess, setLogoSuccess] = useState('');

    useEffect(() => {
        setLogoUrl((supplier as any).logoUrl || '');
        setLogoError('');
        setLogoSuccess('');
    }, [supplier]);

    const saveLogo = async (nextLogoUrl = logoUrl) => {
        setIsSavingLogo(true);
        setLogoError('');
        setLogoSuccess('');
        try {
            const res = await supplierApi.updateMe({ logoUrl: nextLogoUrl.trim() });
            const updated = res?.data?.data ?? res?.data ?? { ...supplier, logoUrl: nextLogoUrl.trim() };
            onSupplierUpdated(updated);
            setLogoUrl((updated as any).logoUrl || nextLogoUrl.trim());
            setLogoSuccess('Logo updated');
        } catch (err: any) {
            setLogoError(err?.response?.data?.message || err?.message || 'Could not update logo.');
        } finally {
            setIsSavingLogo(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLogoError('');
        setLogoSuccess('');
        try {
            const processedLogo = await prepareLogoImage(file);
            setLogoUrl(processedLogo);
            await saveLogo(processedLogo);
        } catch (err: any) {
            setLogoError(err?.message || 'Could not process logo image.');
        } finally {
            event.target.value = '';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-4xl">
            <SectionHeader title="Supplier Profile" icon={User} subtitle="Account settings and security" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center overflow-hidden p-2">
                            {logoUrl ? (
                                <img src={logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" width="80" height="80" />
                            ) : (
                                <User className="w-8 h-8 text-slate-300" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{supplier.name}</h3>
                            <Badge variant="success">Verified Supplier</Badge>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branding Information</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Supplier Logo</p>
                            <p className="text-sm font-semibold text-slate-900 break-all">{logoUrl || 'No logo URL provided'}</p>
                        </div>
                        <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                            <p className="text-[10px] font-bold text-blue-800 leading-relaxed italic">
                                Branding updates are currently locked. Please contact HogiCar Support to change your company logo or profile details.
                            </p>
                        </div>
                    </div>

                    <InputField label="Reservation Contact Email" value={(supplier as any).contactEmail || supplier.email || ''} readOnly />
                    <InputField label="Phone Number" value={supplier.phone || 'N/A'} readOnly />
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Security</h3>
                    </div>
                    <InputField label="Login Username (Email)" value={supplier.email} readOnly />
                    <InputField label="Current Password" type="password" value="********" readOnly />
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed text-center">
                            Credentials can only be modified by the primary account administrator.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ==================== TemplateConfigModal Component ====================
const TemplateConfigModal = ({ isOpen, onClose, config, onSave, locationCode, supplier }: any) => {
    const [localConfig, setLocalConfig] = useState<TemplateConfig>({
        currency: 'USD',
        bands: [],
        periods: [],
        minBookingLeadTime: 0,
        gracePeriodHours: 0,
        oneWayFee: 0,
        minRentalDays: 1,
        maxRentalDays: 30,
        maxBookingLeadTimeDays: 365,
        locationCode: locationCode || undefined,
        applyToAllLocations: false
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (config) {
                setLocalConfig({
                    ...config,
                    locationCode: locationCode || undefined,
                    applyToAllLocations: false
                });
            } else {
                setLocalConfig({
                    currency: 'USD',
                    bands: [],
                    periods: [],
                    minBookingLeadTime: 0,
                    gracePeriodHours: 0,
                    oneWayFee: 0,
                    minRentalDays: 1,
                    maxRentalDays: 30,
                    maxBookingLeadTimeDays: 365,
                    locationCode: locationCode || undefined,
                    applyToAllLocations: false
                });
            }
        }
    }, [isOpen, config, locationCode]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await supplierApi.saveTemplateConfig(localConfig);
            onSave();
            onClose();
        } catch (e) {
            alert("Failed to save template configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const addBand = () => {
        const newBand = { minDays: 1, maxDays: 3, perMonth: false, label: '' };
        setLocalConfig({ ...localConfig, bands: [...localConfig.bands, newBand] });
    };

    const removeBand = (index: number) => {
        const newBands = [...localConfig.bands];
        newBands.splice(index, 1);
        setLocalConfig({ ...localConfig, bands: newBands });
    };

    const updateBand = (index: number, field: string, value: any) => {
        const newBands = [...localConfig.bands];
        newBands[index] = { ...newBands[index], [field]: value };
        setLocalConfig({ ...localConfig, bands: newBands });
    };

    const addPeriod = () => {
        const newPeriod = { 
            name: 'New Season', 
            startDate: format(new Date(), 'yyyy-MM-dd'), 
            endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), 
            usePreviousBands: true, 
            bands: [] 
        };
        setLocalConfig({ ...localConfig, periods: [...localConfig.periods, newPeriod] });
    };

    const removePeriod = (index: number) => {
        const newPeriods = [...localConfig.periods];
        newPeriods.splice(index, 1);
        setLocalConfig({ ...localConfig, periods: newPeriods });
    };

    const updatePeriod = (index: number, field: string, value: any) => {
        const newPeriods = [...localConfig.periods];
        newPeriods[index] = { ...newPeriods[index], [field]: value };
        setLocalConfig({ ...localConfig, periods: newPeriods });
    };

    const addBond = () => {
        const newBond = { name: 'Standard Bond', price: 500, description: '' };
        setLocalConfig({ ...localConfig, bonds: [...(localConfig.bonds || []), newBond] });
    };

    const removeBond = (index: number) => {
        const newBonds = [...(localConfig.bonds || [])];
        newBonds.splice(index, 1);
        setLocalConfig({ ...localConfig, bonds: newBonds });
    };

    const updateBond = (index: number, field: string, value: any) => {
        const newBonds = [...(localConfig.bonds || [])];
        newBonds[index] = { ...newBonds[index], [field]: value };
        setLocalConfig({ ...localConfig, bonds: newBonds });
    };

    const handleInherit = async (sourceLoc: string) => {
        if (!confirm(`This will overwrite your current settings for this location with the ones from ${sourceLoc}. Continue?`)) return;
        try {
            const locCode = sourceLoc || undefined;
            const res = await supplierApi.getTemplateConfig(locCode);
            if (res.data) {
                setLocalConfig({
                    ...res.data,
                    locationCode: locationCode || undefined,
                    id: localConfig.id // Preserve local ID if it exists
                });
            }
        } catch (e) {
            alert("Failed to fetch source strategy");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configure Rate Template" size="lg">
            <div className="space-y-10">
                {/* Strategy Inheritance / Cloning */}
                <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                            <RefreshCw className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Clone Strategy</p>
                            <p className="text-xs font-bold mt-1 text-white">Import settings from another location</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                        <select 
                            onChange={(e) => handleInherit(e.target.value)}
                            defaultValue=""
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white outline-none px-4 py-2 cursor-pointer"
                        >
                            <option value="" disabled className="text-slate-900">Choose Source...</option>
                            {supplier?.locations?.filter((l: any) => {
                                const code = String(l?.locationCode ?? l?.value ?? '').trim().toUpperCase();
                                return code && code !== String(locationCode || '').trim().toUpperCase() && code !== 'ALL' && code !== 'GLOBAL';
                            }).map((l: any) => {
                                const code = String(l?.locationCode ?? l?.value ?? '').trim().toUpperCase();
                                const label = l?.displayName || l?.label || code;
                                return <option key={code} value={code} className="text-slate-900">{label}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* Informational Note */}
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Info className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Strategy Definition</p>
                        <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-widest opacity-80">
                            Define your seasons and day bands below. After saving, use the "Download Template" action to fill in prices for each car model.
                        </p>
                    </div>
                </div>

                {/* Global Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Template Currency</label>
                        <select 
                            value={localConfig.currency} 
                            onChange={e => setLocalConfig({...localConfig, currency: e.target.value})}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {CURRENCIES.map(curr => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.flag} {curr.code} - {curr.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-wider">
                            Global currency for all rates in the generated XLSX template.
                        </p>
                    </div>
                </div>

                {/* Booking Conditions */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-blue-700" />
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Booking Conditions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField 
                            label="Min Lead Time (Hrs)" 
                            type="number" 
                            icon={Clock}
                            value={localConfig.minBookingLeadTime} 
                            onChange={(e: any) => setLocalConfig({...localConfig, minBookingLeadTime: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Grace Period (Hrs)" 
                            type="number" 
                            icon={RefreshCw}
                            value={localConfig.gracePeriodHours} 
                            onChange={(e: any) => setLocalConfig({...localConfig, gracePeriodHours: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="One Way Fee" 
                            type="number" 
                            prefix={localConfig.currency}
                            value={localConfig.oneWayFee} 
                            onChange={(e: any) => setLocalConfig({...localConfig, oneWayFee: parseFloat(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Min. Duration (Days)" 
                            type="number" 
                            icon={Calendar}
                            value={localConfig.minRentalDays} 
                            onChange={(e: any) => setLocalConfig({...localConfig, minRentalDays: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Max. Duration (Days)" 
                            type="number" 
                            icon={Calendar}
                            value={localConfig.maxRentalDays} 
                            onChange={(e: any) => setLocalConfig({...localConfig, maxRentalDays: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Max. Lead Time (Days)" 
                            type="number" 
                            icon={Zap}
                            value={localConfig.maxBookingLeadTimeDays} 
                            onChange={(e: any) => setLocalConfig({...localConfig, maxBookingLeadTimeDays: parseInt(e.target.value) || 0})} 
                        />
                    </div>
                </div>

                {/* Pricing Seasons / Periods */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-700" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pricing Seasons</h3>
                        </div>
                        <button onClick={addPeriod} className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:text-blue-800">+ Add Season</button>
                    </div>
                    <div className="space-y-4">
                        {localConfig.periods?.map((period, idx) => (
                            <div key={idx} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/30 relative group hover:border-blue-200 transition-all">
                                <button onClick={() => removePeriod(idx)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <InputField label="Season Name" value={period.name} onChange={(e:any) => updatePeriod(idx, 'name', e.target.value)} />
                                    <InputField label="Start Date" type="date" value={period.startDate} onChange={(e:any) => updatePeriod(idx, 'startDate', e.target.value)} />
                                    <InputField label="End Date" type="date" value={period.endDate} onChange={(e:any) => updatePeriod(idx, 'endDate', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Bonds */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-700" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Security Bonds</h3>
                        </div>
                        <button onClick={addBond} className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:text-blue-800">+ Add Bond</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localConfig.bonds?.map((bond, idx) => (
                            <div key={idx} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative group hover:border-blue-200 transition-all">
                                <button onClick={() => removeBond(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="space-y-4">
                                    <InputField label="Bond Name" value={bond.name} onChange={(e:any) => updateBond(idx, 'name', e.target.value)} />
                                    <InputField 
                                        label="Bond Price / Deposit" 
                                        type="number" 
                                        prefix={localConfig.currency}
                                        value={bond.price} 
                                        onChange={(e:any) => updateBond(idx, 'price', parseFloat(e.target.value) || 0)} 
                                    />
                                </div>
                            </div>
                        ))}
                        {(!localConfig.bonds || localConfig.bonds.length === 0) && (
                            <div className="md:col-span-2 py-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-400">
                                <Shield className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No security bonds defined</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rental Duration Bands */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-700" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Rental Duration Bands</h3>
                        </div>
                        <button onClick={addBand} className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:text-blue-800">+ Add Band</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localConfig.bands?.map((band, idx) => (
                            <div key={idx} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative group hover:border-blue-200 transition-all">
                                <button onClick={() => removeBand(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Min Days" type="number" value={band.minDays} onChange={(e:any) => updateBand(idx, 'minDays', parseInt(e.target.value))} />
                                    <InputField label="Max Days" type="number" value={band.maxDays || ''} onChange={(e:any) => updateBand(idx, 'maxDays', e.target.value ? parseInt(e.target.value) : null)} />
                                </div>
                                <div className="mt-4">
                                    <InputField label="Band Label (e.g. 1-3 Days)" value={band.label} onChange={(e:any) => updateBand(idx, 'label', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-50">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                    <div className="flex-[2] flex flex-col gap-3">
                        <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all disabled:opacity-50">
                            {isSaving ? 'Saving Configuration...' : 'Save Rate Structure'}
                        </button>
                        <div className="flex items-center justify-center gap-2">
                            <input 
                                type="checkbox" 
                                id="apply-all-loc-config"
                                checked={localConfig.applyToAllLocations}
                                onChange={e => setLocalConfig({...localConfig, applyToAllLocations: e.target.checked})}
                                className="w-3.5 h-3.5 text-blue-700 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="apply-all-loc-config" className="text-[9px] font-black text-gray-500 uppercase tracking-widest cursor-pointer">
                                Apply to all locations
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SupplierDashboard;
