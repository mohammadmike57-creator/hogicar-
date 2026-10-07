import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Car from 'lucide-react/dist/esm/icons/car';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import User from 'lucide-react/dist/esm/icons/user';
import Users from 'lucide-react/dist/esm/icons/users';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Target from 'lucide-react/dist/esm/icons/target';
import Package from 'lucide-react/dist/esm/icons/package';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Search from 'lucide-react/dist/esm/icons/search';
import Filter from 'lucide-react/dist/esm/icons/filter';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import History from 'lucide-react/dist/esm/icons/history';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Download from 'lucide-react/dist/esm/icons/download';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Info from 'lucide-react/dist/esm/icons/info';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Gift from 'lucide-react/dist/esm/icons/gift';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Check from 'lucide-react/dist/esm/icons/check';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, addDays, subDays } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { supplierApi, getPublicLocations } from '../api';
import { API_BASE_URL } from '../lib/config';
import { CURRENCIES } from '../contexts/CurrencyContext';
import { 
  Supplier, Car as CarType, Booking, CarCategory, Transmission, FuelPolicy, 
  BookingMode, TemplateConfig, Extra, RateTier, CarModel, CarRateTier,
  ExcelDownloadHistory, BandConfig
} from '../types';
import { Logo } from '../components/Logo';
import AddonIcon from '../components/AddonIcon';
import { VoucherModal } from '../components/RentalVoucher';
import { buildCarAddons, loadAddonSettings } from '../utils/addons';

// ==================== Shared UI Components ====================

const StatCard = ({ icon: Icon, title, value, change, hint, color = "blue", onClick }: any) => {
  const colors: any = {
    blue: "bg-accent-50 text-accent",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all sm:p-5 ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 sm:text-sm">{title}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors[color] || colors.blue}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[28px]">{value}</p>
      {(hint || change) && (
        <p className="mt-1 text-xs text-slate-500">{change || hint}</p>
      )}
    </Tag>
  );
};

const SectionHeader = ({ title, icon: Icon, subtitle, actions }: any) => (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
            {Icon && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent ring-1 ring-inset ring-accent/10">
                    <Icon className="h-[18px] w-[18px]" />
                </span>
            )}
            <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
);

const Badge = ({ children, variant = "default", className = "" }: any) => {
    const variants: any = {
        default: "bg-slate-100 text-slate-700 ring-slate-200",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warning: "bg-amber-50 text-amber-800 ring-amber-200",
        error: "bg-rose-50 text-rose-700 ring-rose-200",
        info: "bg-accent-50 text-accent-800 ring-accent-200",
        purple: "bg-violet-50 text-violet-700 ring-violet-200",
    };
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }: any) => {
    if (!isOpen) return null;
    const sizes: any = {
        sm: "sm:max-w-md",
        md: "sm:max-w-2xl",
        lg: "sm:max-w-4xl",
        xl: "sm:max-w-6xl"
    };
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 340 }} className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${sizes[size]}`}>
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
                    <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
                </div>
                <div className="overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-6">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, icon: Icon, prefix, error, helperText, ...props }: any) => (
    <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
        <div className={`flex h-10 items-center overflow-hidden rounded-lg border bg-white transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${props.readOnly || props.disabled ? 'bg-slate-50' : 'hover:border-slate-400'} ${error ? 'border-rose-400' : 'border-slate-300'}`}>
            {Icon && (
                <div className="flex h-full items-center border-r border-slate-200 bg-slate-50 px-3 text-slate-400">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            {prefix && (
                <div className="flex h-full items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                    {prefix}
                </div>
            )}
            <input
                {...props}
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
            />
        </div>
        {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stopSales, setStopSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats data
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const st = (b: any) => String(b.status || '').toLowerCase();
    const confirmedBookings = bookings.filter(b => st(b) === 'confirmed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.netPrice || 0), 0);
    const pendingCount = bookings.filter(b => st(b) === 'pending').length;
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

  const SECTION_META: Record<string, { title: string; description: string; group: string }> = {
    dashboard: { title: 'Overview', description: 'Your bookings, fleet and availability at a glance.', group: 'Operations' },
    reservations: { title: 'Reservations', description: 'Review, confirm and track every booking.', group: 'Operations' },
    fleet: { title: 'Fleet', description: 'Cars you offer, their details and availability.', group: 'Operations' },
    rates: { title: 'Pricing', description: 'Seasons, rental bands and daily rates for every car.', group: 'Commercial' },
    stopsales: { title: 'Availability', description: 'Close sales for dates, cars or categories.', group: 'Commercial' },
    extras: { title: 'Add-ons', description: 'Extras customers can reserve with a car.', group: 'Commercial' },
    locations: { title: 'Locations', description: 'Where you operate and pick-up details.', group: 'Account' },
    profile: { title: 'Company profile', description: 'Company details, logo and contact information.', group: 'Account' },
  };
  const NAV_GROUPS = [
    { label: 'Operations', items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'reservations', label: 'Reservations', icon: Calendar, badge: stats.pendingCount },
      { id: 'fleet', label: 'Fleet', icon: Car },
    ] },
    { label: 'Commercial', items: [
      { id: 'rates', label: 'Pricing', icon: DollarSign },
      { id: 'stopsales', label: 'Availability', icon: Clock, badge: stats.activeStopSales },
      { id: 'extras', label: 'Add-ons', icon: Package },
    ] },
    { label: 'Account', items: [
      { id: 'locations', label: 'Locations', icon: MapPin },
      { id: 'profile', label: 'Company profile', icon: User },
    ] },
  ];
  const meta = SECTION_META[activeSection] || SECTION_META.dashboard;
  const signOut = () => { localStorage.removeItem('supplierToken'); navigate('/supplier-login'); };
  const initials = (supplier?.name || 'S').split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  if (isLoading) return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden w-64 shrink-0 bg-slate-950 lg:block" />
      <div className="flex-1 p-6 lg:p-10">
        <div className="h-7 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200/70" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );

  if (!supplier) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200"><Lock className="h-5 w-5" /></span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Your session has ended</h2>
        <p className="mt-1.5 text-sm text-slate-500">{error || 'Please sign in again to continue.'}</p>
        <button
          onClick={() => navigate('/supplier-login')}
          className="mt-6 h-10 w-full rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-700"
        >
          Go to supplier sign in
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-slate-300 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Supplier navigation"
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">H</span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Hogicar</p>
              <p className="text-[11px] text-slate-400">Supplier portal</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-5">
              <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const active = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 font-medium text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />}
                        <item.icon className={`h-[18px] w-[18px] ${active ? 'text-accent-300' : ''}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {!!(item as any).badge && (
                          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{(item as any).badge}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {supplier.logoUrl ? <img src={supplier.logoUrl} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-xs font-semibold text-slate-700">{initials}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{supplier.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Verified partner</p>
            </div>
          </div>
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex" aria-label="Breadcrumb">
              <span>{meta.group}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-medium text-slate-900">{meta.title}</span>
            </nav>
            <span className="truncate text-sm font-semibold text-slate-900 sm:hidden">{meta.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.pendingCount > 0 && (
              <button onClick={() => setActiveSection('reservations')} className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {stats.pendingCount} awaiting confirmation
              </button>
            )}
            <button onClick={() => setActiveSection('reservations')} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              {stats.pendingCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-white" />}
            </button>
            <button onClick={() => setActiveSection('profile')} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 pl-1 pr-2.5 hover:bg-slate-50" aria-label="Company profile">
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                {supplier.logoUrl ? <img src={supplier.logoUrl} alt="" className="h-full w-full object-contain p-0.5" /> : <span className="text-[11px] font-semibold text-slate-700">{initials}</span>}
              </span>
              <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 md:block">{supplier.name}</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{meta.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="supplier-content"
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
              {activeSection === 'extras' && <ExtrasSection supplier={supplier} />}
              {activeSection === 'locations' && <LocationsSection supplier={supplier} />}
              {activeSection === 'profile' && <ProfileSection supplier={supplier} onSupplierUpdated={setSupplier} />}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
            © {new Date().getFullYear()} Hogicar · Supplier portal
          </footer>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick navigation">
        <ul className="grid grid-cols-5">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'reservations', label: 'Bookings', icon: Calendar },
            { id: 'rates', label: 'Pricing', icon: DollarSign },
            { id: 'fleet', label: 'Fleet', icon: Car },
          ].map(item => {
            const active = activeSection === item.id;
            return (
              <li key={item.id}>
                <button onClick={() => setActiveSection(item.id)} className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? 'text-accent' : 'text-slate-500'}`}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => setIsSidebarOpen(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500">
              <Menu className="h-5 w-5" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

// ==================== Dashboard Overview ====================
const STATUS_STYLE: Record<string, { label: string; variant: string; color: string }> = {
  confirmed: { label: 'Confirmed', variant: 'success', color: '#10b981' },
  pending: { label: 'Pending', variant: 'warning', color: '#f59e0b' },
  completed: { label: 'Completed', variant: 'info', color: '#007ac2' },
  modified: { label: 'Modified', variant: 'purple', color: '#8b5cf6' },
  cancelled: { label: 'Cancelled', variant: 'error', color: '#f43f5e' },
};
const statusBadge = (status?: string) => {
  const s = STATUS_STYLE[String(status || '').toLowerCase()] || { label: status || 'Unknown', variant: 'default' };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};
const pickupDateOf = (b: any) => b.pickupDate || b.startDate;
const carNameOf = (b: any) => [b.carMake, b.carModel].filter(Boolean).join(' ') || b.carName || 'Car';
const bookingCreated = (b: any) => b.createdAt || b.bookingDate || pickupDateOf(b);
const money0 = (n: number, currency = 'USD') => {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0); }
  catch { return `${currency} ${Math.round(n || 0).toLocaleString()}`; }
};

const DashboardOverview = ({ stats, bookings, supplier, onGenerateReport, setActiveSection }: any) => {
  const currency = supplier?.currency || 'USD';
  const days = 14;
  const series = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = Array.from({ length: days }, (_, i) => {
      const d = subDays(today, days - 1 - i);
      return { key: format(d, 'yyyy-MM-dd'), name: format(d, 'd MMM'), bookings: 0, revenue: 0 };
    });
    const byKey = Object.fromEntries(rows.map(r => [r.key, r]));
    (bookings || []).forEach((b: any) => {
      const raw = bookingCreated(b);
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const row = byKey[format(d, 'yyyy-MM-dd')];
      if (!row) return;
      row.bookings += 1;
      if (String(b.status).toLowerCase() !== 'cancelled') row.revenue += Number(b.netPrice) || 0;
    });
    return rows;
  }, [bookings]);
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (bookings || []).forEach((b: any) => { const k = String(b.status || 'pending').toLowerCase(); counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ key: k, name: STATUS_STYLE[k]?.label || k, value: v, color: STATUS_STYLE[k]?.color || '#94a3b8' }));
  }, [bookings]);
  const upcoming = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return (bookings || [])
      .filter((b: any) => pickupDateOf(b) && new Date(pickupDateOf(b)) >= now && String(b.status).toLowerCase() !== 'cancelled')
      .sort((a: any, b: any) => new Date(pickupDateOf(a)).getTime() - new Date(pickupDateOf(b)).getTime())
      .slice(0, 5);
  }, [bookings]);
  const recent = useMemo(() => [...(bookings || [])]
    .sort((a: any, b: any) => new Date(bookingCreated(b) || 0).getTime() - new Date(bookingCreated(a) || 0).getTime())
    .slice(0, 6), [bookings]);
  const revenue = (bookings || []).filter((b: any) => String(b.status).toLowerCase() !== 'cancelled').reduce((s: number, b: any) => s + (Number(b.netPrice) || 0), 0);
  const last14 = series.reduce((s, r) => s + r.bookings, 0);
  const fmtDate = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : format(d, 'd MMM yyyy'); };

  return (
    <div className="space-y-6">
      {/* Welcome strip */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {supplier.logoUrl ? <img src={supplier.logoUrl} alt="" className="h-full w-full object-contain p-1.5" /> : <Car className="h-6 w-6 text-slate-400" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Welcome back</p>
            <p className="truncate text-lg font-semibold text-slate-900">{supplier.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="success"><CheckCircle className="h-3 w-3" /> Verified partner</Badge>
              {supplier.locationCode && <Badge><MapPin className="h-3 w-3" /> {supplier.locationCode}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveSection('rates')} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex-none">
            <DollarSign className="h-4 w-4" /> Update rates
          </button>
          <button onClick={onGenerateReport} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-700 sm:flex-none">
            <Download className="h-4 w-4" /> Booking report
          </button>
        </div>
      </div>

      {stats.pendingCount > 0 && (
        <button onClick={() => setActiveSection('reservations')} className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100/70">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <span className="flex-1"><span className="font-semibold">{stats.pendingCount} booking{stats.pendingCount === 1 ? '' : 's'}</span> waiting for your confirmation.</span>
          <span className="inline-flex items-center gap-1 font-medium">Review <ChevronRight className="h-4 w-4" /></span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={DollarSign} title="Net revenue" value={money0(revenue, currency)} hint="All bookings, excluding cancelled" color="green" />
        <StatCard icon={Calendar} title="Bookings" value={stats.totalBookings} hint={`${last14} in the last ${days} days`} color="blue" onClick={() => setActiveSection('reservations')} />
        <StatCard icon={Car} title="Active fleet" value={`${stats.activeCars}/${stats.totalCars}`} hint="Cars available to book" color="violet" onClick={() => setActiveSection('fleet')} />
        <StatCard icon={Clock} title="Stop sales" value={stats.activeStopSales} hint="Active today" color="amber" onClick={() => setActiveSection('stopsales')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Bookings received</h3>
              <p className="text-xs text-slate-500">Last {days} days, by booking date</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Bookings</span>
            </div>
          </div>
          <div className="mt-4 h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={0}>
              <AreaChart data={series} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="supplierBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007ac2" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#007ac2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -12px rgba(15,23,42,.25)', fontSize: 12 }} />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#007ac2" strokeWidth={2} fill="url(#supplierBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900">Booking status</h3>
          <p className="text-xs text-slate-500">All bookings</p>
          {statusCounts.length ? (
            <>
              <div className="mx-auto mt-2 h-[160px] w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={2} stroke="none">
                      {statusCounts.map(s => <Cell key={s.key} fill={s.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {statusCounts.map(s => (
                  <li key={s.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
                    <span className="font-medium tabular-nums text-slate-900">{s.value}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-8 text-center text-sm text-slate-500">No bookings yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming pick-ups</h3>
            <button onClick={() => setActiveSection('reservations')} className="text-xs font-medium text-accent hover:underline">View all</button>
          </div>
          {upcoming.length ? (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((b: any) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-50 text-accent">
                    <span className="text-[10px] font-medium uppercase leading-none">{format(new Date(pickupDateOf(b)), 'MMM')}</span>
                    <span className="text-base font-semibold leading-tight">{format(new Date(pickupDateOf(b)), 'd')}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{b.firstName} {b.lastName}</p>
                    <p className="truncate text-xs text-slate-500">{carNameOf(b)} · {b.pickupCode || '—'}{b.startTime ? ` · ${b.startTime}` : ''}</p>
                  </div>
                  {statusBadge(b.status)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No upcoming pick-ups.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-slate-900">Latest bookings</h3>
            <button onClick={() => setActiveSection('reservations')} className="text-xs font-medium text-accent hover:underline">View all</button>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.map((b: any) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(b.firstName?.[0] || '') + (b.lastName?.[0] || '') || '?'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{b.firstName} {b.lastName}</p>
                    <p className="truncate text-xs text-slate-500"><span className="font-mono">{b.bookingRef || `#${b.id}`}</span> · {fmtDate(bookingCreated(b))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-slate-900">{money0(Number(b.netPrice) || 0, b.currency || currency)}</p>
                    <div className="mt-0.5">{statusBadge(b.status)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Bookings will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Reservations Section ====================
const ReservationsSection = ({ bookings }: { bookings: Booking[] }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = bookings.filter(b => {
        const matchesSearch = (b.bookingRef?.toLowerCase() || '').includes(search.toLowerCase()) || 
                              (`${b.firstName} ${b.lastName}`.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || String(b.status || '').toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleConfirm = async (id: any) => {
        const conf = prompt("Enter your confirmation number for this booking:");
        if (!conf || !conf.trim()) return;
        try {
            await supplierApi.confirmBookingBySupplier(id, conf.trim());
            alert("Booking confirmed. The customer will be notified.");
            window.location.reload();
        } catch (e: any) {
            alert(`Could not confirm the booking: ${e?.response?.data?.message || e?.message || 'please try again.'}`);
        }
    };

    const [viewing, setViewing] = useState<any | null>(null);
    const counts = bookings.reduce((acc: Record<string, number>, b) => { const k = String(b.status || '').toLowerCase(); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    const tabs = [['all', 'All', bookings.length], ['pending', 'Pending', counts.pending || 0], ['confirmed', 'Confirmed', counts.confirmed || 0], ['completed', 'Completed', counts.completed || 0], ['cancelled', 'Cancelled', counts.cancelled || 0]] as const;
    const pickupOf = (b: any) => b.pickupDate || b.startDate;
    const dropoffOf = (b: any) => b.dropoffDate || b.endDate;
    const fmtD = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : format(d, 'd MMM yyyy'); };
    const amount = (b: any) => money0(Number(b.netPrice) || 0, b.currency || 'USD');

    const actions = (b: any) => (
        <div className="flex justify-end gap-1.5">
            {String(b.status).toLowerCase() === 'pending' && (
                <button onClick={() => handleConfirm(b.id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Confirm
                </button>
            )}
            <button onClick={() => setViewing(b)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <FileText className="h-3.5 w-3.5" /> Voucher
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
                    {tabs.map(([id, label, n]) => (
                        <button key={id} onClick={() => setStatusFilter(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {label}
                            <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${statusFilter === id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{n}</span>
                        </button>
                    ))}
                </div>
                <div className="relative lg:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search reference or customer…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[880px] text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-medium">Booking</th>
                                <th className="px-4 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">Pick-up</th>
                                <th className="px-4 py-3 font-medium">Drop-off</th>
                                <th className="px-4 py-3 text-right font-medium">Net amount</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((b: any) => (
                                <tr key={b.id} onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; setViewing(b); }} className={`cursor-pointer hover:bg-slate-50/70 ${String(b.status).toLowerCase() === 'pending' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-5 py-3">
                                        <p className="font-mono text-[13px] font-medium text-slate-900">{b.bookingRef || `#${b.id}`}</p>
                                        <p className="text-xs text-slate-500">{carNameOf(b)}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-900">{b.firstName} {b.lastName}</p>
                                        <p className="text-xs text-slate-500">{b.email || b.phone || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-slate-900">{fmtD(pickupOf(b))}{b.startTime ? <span className="text-slate-500"> · {b.startTime}</span> : null}</p>
                                        <p className="text-xs text-slate-500">{b.pickupCode || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-slate-900">{fmtD(dropoffOf(b))}{b.endTime ? <span className="text-slate-500"> · {b.endTime}</span> : null}</p>
                                        <p className="text-xs text-slate-500">{b.dropoffCode || b.pickupCode || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{amount(b)}</td>
                                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                                    <td className="px-5 py-3">{actions(b)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Phone cards */}
                <ul className="divide-y divide-slate-100 md:hidden">
                    {filtered.map((b: any) => (
                        <li key={b.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-900">{b.firstName} {b.lastName}</p>
                                    <p className="font-mono text-xs text-slate-500">{b.bookingRef || `#${b.id}`}</p>
                                </div>
                                {statusBadge(b.status)}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                                <div><p className="text-slate-500">Pick-up</p><p className="font-medium text-slate-900">{fmtD(pickupOf(b))}</p><p className="text-slate-500">{b.pickupCode}{b.startTime ? ` · ${b.startTime}` : ''}</p></div>
                                <div><p className="text-slate-500">Drop-off</p><p className="font-medium text-slate-900">{fmtD(dropoffOf(b))}</p><p className="text-slate-500">{b.dropoffCode || b.pickupCode}{b.endTime ? ` · ${b.endTime}` : ''}</p></div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-sm"><span className="text-slate-500">Net </span><span className="font-semibold text-slate-900">{amount(b)}</span></p>
                                {actions(b)}
                            </div>
                        </li>
                    ))}
                </ul>

                {filtered.length === 0 && (
                    <div className="px-6 py-16 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Calendar className="h-6 w-6" /></span>
                        <p className="mt-3 text-sm font-medium text-slate-900">No bookings found</p>
                        <p className="mt-1 text-sm text-slate-500">{search || statusFilter !== 'all' ? 'Try another search or status.' : 'New bookings will appear here.'}</p>
                    </div>
                )}
            </div>

            <VoucherModal
                booking={viewing}
                audience="supplier"
                onClose={() => setViewing(null)}
                extraActions={viewing && String(viewing.status).toLowerCase() === 'pending' ? (
                    <button onClick={() => handleConfirm(viewing.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700">
                        <CheckCircle className="h-4 w-4" /> Confirm
                    </button>
                ) : null}
            />
        </div>
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
    if (!window.confirm('Delete this car from your fleet? Its rates will no longer apply.')) return;
    try {
      await supplierApi.deleteCar(id);
      await onCarsChanged();
    } catch (e) { alert("Failed to delete"); }
  };

  const prettyCat = (c?: string) => String(c || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, ch => ch.toUpperCase());
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const onStopSale = (car: CarType) => stopSales.some(ss => ss.carId === Number(car.id) && new Date(ss.startDate) <= today0 && new Date(ss.endDate) >= today0);
  const usedCategories = Array.from(new Set(cars.map(c => c.category))).filter(Boolean);
  const availableCount = cars.filter(c => c.isAvailable || c.available).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {[['ALL', 'All cars', cars.length], ...usedCategories.map(c => [c, prettyCat(c), cars.filter(x => x.category === c).length])].map(([id, label, n]: any) => (
            <button key={id} onClick={() => setSelectedCategory(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${selectedCategory === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${selectedCategory === id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{n}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{availableCount} of {cars.length} available</span>
          <button
            onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-700 lg:flex-none"
          >
            <Plus className="h-4 w-4" /> Add car
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCars.map(car => {
          const available = !!(car.isAvailable || car.available);
          const stopped = onStopSale(car);
          return (
            <div key={car.id} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative flex h-40 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6 py-4">
                <img
                  src={car.imageUrl || car.image || 'https://placehold.co/400x250/e2e8f0/64748b?text=Car'}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  alt={car.name || `${car.make} ${car.model}`}
                  width="400"
                  height="250"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {available ? <Badge variant="success">Available</Badge> : <Badge>Unavailable</Badge>}
                  {stopped && <Badge variant="warning">Stop sale today</Badge>}
                </div>
                {car.sippCode && <span className="absolute right-3 top-3 rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">{car.sippCode}</span>}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold text-slate-900">{car.make} {car.model} <span className="font-normal text-slate-500">{car.year || ''}</span></h3>
                <p className="text-sm text-slate-500">{prettyCat(car.category)}{car.location ? ` · ${car.location}` : ''}</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  <li className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400" />{car.passengers} seats</li>
                  <li className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{car.bags} bags</li>
                  <li className="inline-flex items-center gap-1.5"><Settings className="h-3.5 w-3.5 text-slate-400" />{car.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}</li>
                </ul>
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => { setEditingCar(car); setIsModalOpen(true); }} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"><Edit className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => setActiveSection('rates')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent"><DollarSign className="h-3.5 w-3.5" /> Rates</button>
                  <button onClick={() => handleDelete(car.id)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${car.make} ${car.model}`} title="Delete car"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredCars.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Car className="h-6 w-6" /></span>
            <p className="mt-3 text-sm font-medium text-slate-900">{cars.length ? 'No cars in this category' : 'Add your first car'}</p>
            <p className="mt-1 text-sm text-slate-500">{cars.length ? 'Choose another category above.' : 'Cars you add here can be priced and shown in search.'}</p>
            {!cars.length && <button onClick={() => { setEditingCar(null); setIsModalOpen(true); }} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-700"><Plus className="h-4 w-4" /> Add car</button>}
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
    </div>
  );
};

// ==================== History Section ====================

const HistorySection = ({ history, onRestore, onDownload, onDelete }: { 
    history: ExcelDownloadHistory[], 
    onRestore: (id: number) => void, 
    onDownload: (locationCode?: string) => void,
    onDelete: (id: number) => void
}) => {
    const when = (v?: string) => { try { return v ? format(parseISO(v), 'd MMM yyyy, HH:mm') : '—'; } catch { return v || '—'; } };
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Template history</h3>
                    <p className="text-xs text-slate-500">Templates you downloaded. Restore one to bring back its seasons and rules.</p>
                </div>
                <History className="h-4 w-4 text-slate-400" />
            </div>
            {history.length ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                            <tr>
                                <th className="px-4 py-2.5 font-medium sm:px-5">Downloaded</th>
                                <th className="px-4 py-2.5 font-medium">Type</th>
                                <th className="px-4 py-2.5 font-medium">Location</th>
                                <th className="px-4 py-2.5 sm:px-5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-3 text-slate-900 sm:px-5">{when(item.downloadedAt)}</td>
                                    <td className="px-4 py-3"><Badge variant="info">{item.fileType || 'Rates template'}</Badge></td>
                                    <td className="px-4 py-3 text-slate-600">{item.locationCode || 'All locations'}</td>
                                    <td className="px-4 py-3 sm:px-5">
                                        <div className="flex justify-end gap-1.5">
                                            <button onClick={() => onRestore(item.id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent"><RefreshCw className="h-3.5 w-3.5" /> Restore</button>
                                            <button onClick={() => onDownload(item.locationCode)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50" title="Download this template again" aria-label="Download this template again"><Download className="h-4 w-4" /></button>
                                            <button onClick={() => onDelete(item.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete from history" aria-label="Delete from history"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="px-5 py-10 text-center text-sm text-slate-500">No templates downloaded yet.</p>
            )}
        </div>
    );
};

// ==================== Manual Pricing Section ====================
// Building blocks for the manual pricing editor (module level so inputs keep focus).
const StepCard = ({ n, title, subtitle, actions, children }: any) => (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">{n}</span>
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
            </div>
            {actions}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const CheckRow = ({ checked, onClick, title, sub }: any) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={checked}
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${checked ? 'border-accent/40 bg-accent-50/60' : 'border-transparent hover:bg-slate-50'}`}
    >
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-accent bg-accent text-white' : 'border-slate-300 bg-white'}`}>
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">{title}</span>
            {sub && <span className="block truncate text-xs text-slate-500">{sub}</span>}
        </span>
    </button>
);


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

    const [targetSearch, setTargetSearch] = useState('');
    const [quickFill, setQuickFill] = useState<{ band: string; dailyRate: string; deposit: string }>({ band: 'all', dailyRate: '', deposit: '' });

    const applyQuickFill = () => {
        const rate = quickFill.dailyRate.replace(',', '.');
        const dep = quickFill.deposit.replace(',', '.');
        if (!rate && !dep) return;
        setGridData(prev => {
            const next = { ...prev };
            combinations.forEach(({ target, period }) => {
                const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
                const rows = next[key] || sessionBands.map(() => ({ dailyRate: '', deposit: '' }));
                next[key] = rows.map((r, i) => (quickFill.band === 'all' || Number(quickFill.band) === i)
                    ? { dailyRate: rate || r.dailyRate, deposit: dep || r.deposit }
                    : r);
            });
            return next;
        });
    };

    const filledCount = combinations.reduce((n, { target, period }) => {
        const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
        return n + (gridData[key] || []).filter(b => Number(b.dailyRate) > 0).length;
    }, 0);
    const totalCells = combinations.length * sessionBands.length;
    const bandLabel = (b: BandConfig) => `${b.minDays}${b.maxDays ? `–${b.maxDays}` : '+'} days`;
    const q = targetSearch.trim().toLowerCase();
    const visibleCars = cars.filter(c => !q || `${c.make} ${c.model} ${c.sippCode} ${c.category}`.toLowerCase().includes(q));
    const visibleCategories = categories.filter(c => !q || String(c).toLowerCase().includes(q));
    const visibleSipps = sipps.filter(c => !q || String(c).toLowerCase().includes(q));
    const selectedTargetCount = targetType === 'car' ? selectedCarIds.length : targetType === 'category' ? selectedCategories.length : selectedSipps.length;
    const fieldCls = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20';

    return (
        <div className="space-y-5 pb-28 lg:pb-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4" /> Back to rates overview
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {applyToAllLocations ? 'All locations' : (activeLocation || 'Default location')}
                    <span className="text-slate-300">·</span> Prices in <span className="font-semibold text-slate-700">{config.currency}</span>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                {/* Steps */}
                <div className="space-y-4">
                    <StepCard
                        n={1}
                        title="Choose cars"
                        subtitle={`${selectedTargetCount} selected`}
                        actions={
                            <div className="flex gap-1">
                                <button onClick={selectAllTargets} className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-50">Select all</button>
                                <button onClick={clearTargets} className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">Clear</button>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-xs font-medium">
                            {([['car', 'By car'], ['category', 'Category'], ['sipp', 'SIPP code']] as const).map(([type, label]) => (
                                <button key={type} onClick={() => setTargetType(type)} className={`rounded-md py-1.5 transition-colors ${targetType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
                            ))}
                        </div>
                        <div className="relative mt-3">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={targetSearch} onChange={e => setTargetSearch(e.target.value)} placeholder="Search…" className={`${fieldCls} pl-8`} />
                        </div>
                        <div className="mt-2 max-h-[280px] space-y-0.5 overflow-y-auto">
                            {targetType === 'car' && visibleCars.map(car => (
                                <CheckRow key={car.id} checked={selectedCarIds.includes(Number(car.id))} onClick={() => toggleCar(Number(car.id))} title={`${car.make} ${car.model}`} sub={[car.sippCode, car.category, car.location].filter(Boolean).join(' · ')} />
                            ))}
                            {targetType === 'category' && visibleCategories.map(cat => (
                                <CheckRow key={cat} checked={selectedCategories.includes(cat)} onClick={() => toggleCategory(cat)} title={String(cat).replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())} sub={`${cars.filter(c => c.category === cat).length} cars`} />
                            ))}
                            {targetType === 'sipp' && visibleSipps.map(sipp => (
                                <CheckRow key={sipp} checked={selectedSipps.includes(sipp)} onClick={() => toggleSipp(sipp)} title={sipp} sub={`${cars.filter(c => c.sippCode === sipp).length} cars`} />
                            ))}
                            {((targetType === 'car' && !visibleCars.length) || (targetType === 'category' && !visibleCategories.length) || (targetType === 'sipp' && !visibleSipps.length)) && (
                                <p className="py-6 text-center text-sm text-slate-500">{cars.length ? 'No matches.' : 'Add cars to your fleet first.'}</p>
                            )}
                        </div>
                    </StepCard>

                    <StepCard n={2} title="Choose periods" subtitle={`${activePeriods.length} period${activePeriods.length === 1 ? '' : 's'} selected`}>
                        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-medium">
                            <button onClick={() => setActivePeriodTab('seasons')} className={`rounded-md py-1.5 ${activePeriodTab === 'seasons' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Seasons ({selectedPeriodIdxs.length})</button>
                            <button onClick={() => setActivePeriodTab('custom')} className={`rounded-md py-1.5 ${activePeriodTab === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Date ranges ({customPeriods.length})</button>
                        </div>
                        {activePeriodTab === 'seasons' ? (
                            <div className="mt-3 space-y-0.5">
                                {config.periods?.length ? config.periods.map((p, idx) => (
                                    <CheckRow key={idx} checked={selectedPeriodIdxs.includes(idx)} onClick={() => togglePeriod(idx)} title={p.name} sub={`${p.startDate} → ${p.endDate}`} />
                                )) : (
                                    <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">No seasons set up yet. Use date ranges, or add seasons under “Seasons & rules”.</p>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 space-y-3">
                                {customPeriods.map((cp, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-200 p-3">
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={cp.name} onChange={e => updateCustomPeriod(idx, 'name', e.target.value)} placeholder="Name, e.g. Summer" className={fieldCls} />
                                            {customPeriods.length > 1 && (
                                                <button onClick={() => removeCustomPeriod(idx)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove date range"><Trash2 className="h-4 w-4" /></button>
                                            )}
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <label className="block"><span className="mb-1 block text-xs text-slate-500">From</span><input type="date" value={cp.startDate} onChange={e => updateCustomPeriod(idx, 'startDate', e.target.value)} className={fieldCls} /></label>
                                            <label className="block"><span className="mb-1 block text-xs text-slate-500">To</span><input type="date" value={cp.endDate} onChange={e => updateCustomPeriod(idx, 'endDate', e.target.value)} className={fieldCls} /></label>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addCustomPeriod} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent">
                                    <Plus className="h-4 w-4" /> Add date range
                                </button>
                            </div>
                        )}
                    </StepCard>

                    <StepCard
                        n={3}
                        title="Rental length bands"
                        subtitle="A different daily rate for each length"
                        actions={<button onClick={addBand} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-50"><Plus className="h-3.5 w-3.5" /> Add</button>}
                    >
                        <div className="space-y-2">
                            {sessionBands.map((band, idx) => (
                                <div key={idx} className="flex items-end gap-2">
                                    <label className="block flex-1"><span className="mb-1 block text-xs text-slate-500">From day</span><input type="number" min={1} value={band.minDays} onChange={e => updateBand(idx, 'minDays', parseInt(e.target.value))} className={fieldCls} /></label>
                                    <label className="block flex-1"><span className="mb-1 block text-xs text-slate-500">To day</span><input type="number" min={1} value={band.maxDays || ''} onChange={e => updateBand(idx, 'maxDays', e.target.value ? parseInt(e.target.value) : null)} placeholder="No limit" className={fieldCls} /></label>
                                    <button onClick={() => removeBand(idx)} disabled={sessionBands.length <= 1} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Remove band"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </StepCard>
                </div>

                {/* Rate grid */}
                <div className="min-w-0 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Daily rates & deposits</h3>
                                <p className="text-xs text-slate-500">{combinations.length ? `${combinations.length} car/period combination${combinations.length === 1 ? '' : 's'} · ${filledCount}/${totalCells} rates entered` : 'Choose cars and periods to start'}</p>
                            </div>
                            {totalCells > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((filledCount / totalCells) * 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-medium tabular-nums text-slate-600">{Math.round((filledCount / totalCells) * 100)}%</span>
                                </div>
                            )}
                        </div>

                        {combinations.length > 0 && (
                            <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                                <div className="mr-1 flex items-center gap-1.5 self-center text-xs font-semibold text-slate-700"><Zap className="h-3.5 w-3.5 text-accent" /> Quick fill</div>
                                <label className="block w-36"><span className="mb-1 block text-[11px] text-slate-500">Band</span>
                                    <select value={quickFill.band} onChange={e => setQuickFill({ ...quickFill, band: e.target.value })} className={fieldCls}>
                                        <option value="all">All bands</option>
                                        {sessionBands.map((b, i) => <option key={i} value={i}>{bandLabel(b)}</option>)}
                                    </select>
                                </label>
                                <label className="block w-28"><span className="mb-1 block text-[11px] text-slate-500">Daily rate</span><input inputMode="decimal" value={quickFill.dailyRate} onChange={e => setQuickFill({ ...quickFill, dailyRate: e.target.value })} placeholder="0.00" className={fieldCls} /></label>
                                <label className="block w-28"><span className="mb-1 block text-[11px] text-slate-500">Deposit</span><input inputMode="decimal" value={quickFill.deposit} onChange={e => setQuickFill({ ...quickFill, deposit: e.target.value })} placeholder="0" className={fieldCls} /></label>
                                <button onClick={applyQuickFill} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent">Apply to all rows</button>
                            </div>
                        )}

                        {combinations.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-16 text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Layers className="h-6 w-6" /></span>
                                <p className="mt-3 text-sm font-medium text-slate-900">Nothing to price yet</p>
                                <p className="mt-1 max-w-sm text-sm text-slate-500">Select cars in step 1 and at least one season or date range in step 2. A rate grid appears here for each combination.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {combinations.map(({ target, period }) => {
                                    const key = `${target.id}-${period.name}-${period.startDate}-${period.endDate}`;
                                    const data = gridData[key] || [];
                                    const complete = data.length > 0 && data.every(b => Number(b.dailyRate) > 0);
                                    return (
                                        <div key={key} className="px-4 py-4 sm:px-5">
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Car className="h-4 w-4" /></span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900">{target.label} <span className="font-normal text-slate-500">· {target.subLabel}</span></p>
                                                        <p className="text-xs text-slate-500">{period.name} · {period.startDate} → {period.endDate}</p>
                                                    </div>
                                                </div>
                                                {complete ? <Badge variant="success"><Check className="h-3 w-3" /> Ready</Badge> : <Badge variant="warning">Rates missing</Badge>}
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[330px] text-sm">
                                                    <thead>
                                                        <tr className="text-left text-xs text-slate-500">
                                                            <th className="pb-1.5 pr-3 font-medium">Rental length</th>
                                                            <th className="pb-1.5 pr-3 font-medium">Daily rate</th>
                                                            <th className="pb-1.5 font-medium">Deposit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sessionBands.map((band, bIdx) => (
                                                            <tr key={bIdx}>
                                                                <td className="py-1 pr-3"><span className="inline-flex whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{bandLabel(band)}</span></td>
                                                                <td className="py-1 pr-3">
                                                                    <div className="flex h-9 w-[104px] items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 sm:w-36">
                                                                        <span className="px-2 text-xs text-slate-500">{config.currency}</span>
                                                                        <input value={data[bIdx]?.dailyRate || ''} onChange={(e) => handleGridInput(key, bIdx, 'dailyRate', e.target.value)} inputMode="decimal" placeholder="0.00" aria-label={`Daily rate ${bandLabel(band)} ${target.label}`} className="h-full min-w-0 flex-1 bg-transparent pr-2 text-right font-medium tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300" />
                                                                    </div>
                                                                </td>
                                                                <td className="py-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="flex h-9 w-[104px] items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 sm:w-36">
                                                                            <span className="px-2 text-xs text-slate-500">{config.currency}</span>
                                                                            <input value={data[bIdx]?.deposit || ''} onChange={(e) => handleGridInput(key, bIdx, 'deposit', e.target.value)} inputMode="decimal" placeholder="0" aria-label={`Deposit ${bandLabel(band)} ${target.label}`} className="h-full min-w-0 flex-1 bg-transparent pr-2 text-right tabular-nums text-slate-900 outline-none placeholder:text-slate-300" />
                                                                        </div>
                                                                        {config.bonds && config.bonds.length > 0 && (
                                                                            <select
                                                                                value=""
                                                                                onChange={e => { if (e.target.value !== '') handleGridInput(key, bIdx, 'deposit', e.target.value); }}
                                                                                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-600 outline-none focus:border-accent"
                                                                                aria-label="Choose a saved deposit"
                                                                            >
                                                                                <option value="">Saved…</option>
                                                                                {config.bonds.map((b, i) => <option key={i} value={String(b.price)}>{b.name} · {b.price}</option>)}
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky save bar */}
            <div className="fixed inset-x-0 bottom-[60px] z-20 border-t border-slate-200 bg-white/95 backdrop-blur lg:bottom-0 lg:left-64">
                <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input type="checkbox" checked={applyToAllLocations} onChange={e => setApplyToAllLocations(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent" />
                        Apply to all my locations
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-slate-500 sm:inline">{combinations.length ? `${filledCount} of ${totalCells} rates entered` : 'No rates selected'}</span>
                        <button onClick={onBack} className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                        <button
                            onClick={handleApply}
                            disabled={isSaving || combinations.length === 0}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white shadow-sm hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            {isSaving ? 'Saving rates…' : 'Save rates'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
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
    const [rateTab, setRateTab] = useState<'overview' | 'spreadsheet'>('overview');
    const [rateSearch, setRateSearch] = useState('');

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

    const tab: 'overview' | 'edit' | 'spreadsheet' = isManualPricingActive ? 'edit' : rateTab;
    const goTab = (t: 'overview' | 'edit' | 'spreadsheet') => {
        if (t === 'edit') { setIsManualPricingActive(true); return; }
        setIsManualPricingActive(false);
        setRateTab(t);
    };
    const locationTiers = existingTiers.filter(tier => {
        const car = cars.find(c => Number(c.id) === Number(tier.carId));
        return !selectedLocation || car?.location === selectedLocation;
    });
    const rq = rateSearch.trim().toLowerCase();
    const visibleTiers = locationTiers.filter(tier => {
        if (!rq) return true;
        const car = cars.find(c => Number(c.id) === Number(tier.carId));
        return `${car?.make} ${car?.model} ${car?.sippCode} ${car?.category} ${tier.name}`.toLowerCase().includes(rq);
    });
    const pricedCarIds = new Set(locationTiers.map(t => Number(t.carId)));
    const carsHere = cars.filter(c => !selectedLocation || c.location === selectedLocation);
    const unpricedCars = carsHere.filter(c => !pricedCarIds.has(Number(c.id)));
    const today = format(new Date(), 'yyyy-MM-dd');
    const seasonState = (p: any) => (p.endDate < today ? 'past' : p.startDate > today ? 'upcoming' : 'live');
    const daysBetween = (a: string, b: string) => {
        const d = (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
        return isFinite(d) ? Math.round(d) + 1 : null;
    };
    const minRate = (tier: CarRateTier) => {
        const rates = (tier.bands || []).map(b => Number(b.dailyRate)).filter(n => n > 0);
        return rates.length ? Math.min(...rates) : null;
    };
    const locationLabel = supplierLocationOptions.find((l: any) => l.code === selectedLocation)?.label || selectedLocation || 'All locations';

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex h-10 min-w-[220px] items-center gap-2 rounded-lg border border-slate-300 bg-white pl-3 pr-1 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="sr-only">Location</span>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
                        >
                            {supplierLocationOptions.length === 0 && <option value="">All locations</option>}
                            {supplierLocationOptions.map((loc: any) => (
                                <option key={loc.code} value={loc.code}>{loc.label}</option>
                            ))}
                        </select>
                    </label>
                    <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-sm font-medium" role="tablist" aria-label="Pricing views">
                        {([['overview', 'Overview'], ['edit', 'Edit rates'], ['spreadsheet', 'Spreadsheet']] as const).map(([id, label]) => (
                            <button key={id} role="tab" aria-selected={tab === id} onClick={() => goTab(id)} className={`whitespace-nowrap rounded-md px-3 py-1.5 transition-colors sm:px-4 ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsConfigModalOpen(true)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:flex-none">
                        <Settings2 className="h-4 w-4" /> Seasons & rules
                    </button>
                    {tab !== 'edit' && (
                        <button onClick={() => goTab('edit')} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-700 lg:flex-none">
                            <Edit className="h-4 w-4" /> Change rates
                        </button>
                    )}
                </div>
            </div>

            {isLoading && !config && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
                </div>
            )}

            {tab === 'edit' && config && (
                <ManualPricingSection
                    config={config}
                    cars={cars}
                    existingTiers={existingTiers}
                    onUpdate={() => { fetchConfig(); }}
                    onBack={() => goTab('overview')}
                    activeLocation={selectedLocation}
                />
            )}

            {tab === 'overview' && config && (
                <div className="space-y-5">
                    {selectedLocation && !config.locationCode && (
                        <div className="flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <Globe className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{locationLabel} uses your default seasons and rules</p>
                                    <p className="text-sm text-slate-600">Set up seasons, rental bands and booking rules just for this location.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsConfigModalOpen(true)} className="h-9 shrink-0 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-700">Customise location</button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <StatCard icon={Calendar} title="Seasons" value={config.periods?.length || 0} hint={`${(config.periods || []).filter((p: any) => seasonState(p) === 'live').length} live today`} color="blue" />
                        <StatCard icon={Layers} title="Rental bands" value={config.bands?.length || 0} hint="Rate steps by rental length" color="violet" />
                        <StatCard icon={Car} title="Cars with rates" value={`${carsHere.length - unpricedCars.length}/${carsHere.length}`} hint={unpricedCars.length ? `${unpricedCars.length} still need rates` : 'Every car is priced'} color={unpricedCars.length ? 'amber' : 'green'} />
                        <StatCard icon={DollarSign} title="Currency" value={config.currency || '—'} hint="Rates and deposits" color="green" />
                    </div>

                    {unpricedCars.length > 0 && (
                        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <p className="text-sm text-amber-900"><span className="font-semibold">{unpricedCars.length} car{unpricedCars.length === 1 ? '' : 's'} without rates</span> won’t appear in search: {unpricedCars.slice(0, 3).map(c => `${c.make} ${c.model}`).join(', ')}{unpricedCars.length > 3 ? '…' : ''}</p>
                            </div>
                            <button onClick={() => goTab('edit')} className="h-9 shrink-0 rounded-lg border border-amber-300 bg-white px-3.5 text-sm font-medium text-amber-900 hover:bg-amber-100">Add rates</button>
                        </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
                        {/* Seasons */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Seasons</h3>
                                    <p className="text-xs text-slate-500">Date periods that can have their own rates</p>
                                </div>
                                <button onClick={() => setIsConfigModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-50"><Edit className="h-3.5 w-3.5" /> Edit</button>
                            </div>
                            {config.periods?.length ? (
                                <ul className="divide-y divide-slate-100">
                                    {config.periods.map((p: any, idx: number) => {
                                        const state = seasonState(p);
                                        const len = daysBetween(p.startDate, p.endDate);
                                        return (
                                            <li key={idx} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                                <span className={`h-9 w-1 shrink-0 rounded-full ${state === 'live' ? 'bg-emerald-500' : state === 'upcoming' ? 'bg-accent' : 'bg-slate-300'}`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{p.startDate} → {p.endDate}{len ? ` · ${len} days` : ''}</p>
                                                </div>
                                                {state === 'live' ? <Badge variant="success">Live</Badge> : state === 'upcoming' ? <Badge variant="info">Upcoming</Badge> : <Badge>Ended</Badge>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="px-5 py-10 text-center">
                                    <p className="text-sm text-slate-500">No seasons yet.</p>
                                    <button onClick={() => setIsConfigModalOpen(true)} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" /> Add a season</button>
                                </div>
                            )}
                        </div>

                        {/* Rules + bands */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Booking rules</h3>
                                    <p className="text-xs text-slate-500">Applied to every booking</p>
                                </div>
                                <button onClick={() => setIsConfigModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-50"><Edit className="h-3.5 w-3.5" /> Edit</button>
                            </div>
                            <dl className="grid grid-cols-2 gap-px bg-slate-100">
                                {[
                                    ['Minimum rental', `${config.minRentalDays || 1} days`],
                                    ['Maximum rental', `${config.maxRentalDays || 30} days`],
                                    ['Book at least', `${config.minBookingLeadTime || 0} hours ahead`],
                                    ['Book up to', `${config.maxBookingLeadTimeDays || 365} days ahead`],
                                    ['Grace period', `${config.gracePeriodHours || 0} hours`],
                                    ['One-way fee', `${config.oneWayFee || 0} ${config.currency || ''}`],
                                ].map(([k, v]) => (
                                    <div key={k} className="bg-white px-4 py-3">
                                        <dt className="text-xs text-slate-500">{k}</dt>
                                        <dd className="mt-0.5 text-sm font-medium text-slate-900">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                                <p className="text-xs font-medium text-slate-500">Rental length bands</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {config.bands?.length ? config.bands.map((b: any, idx: number) => (
                                        <span key={idx} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{b.label || `${b.minDays}${b.maxDays ? `–${b.maxDays}` : '+'} days`}</span>
                                    )) : <span className="text-sm text-slate-500">No bands yet.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active rates */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Current rates</h3>
                                <p className="text-xs text-slate-500">{locationTiers.length} rate period{locationTiers.length === 1 ? '' : 's'} at {locationLabel}</p>
                            </div>
                            <div className="relative sm:w-64">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={rateSearch} onChange={e => setRateSearch(e.target.value)} placeholder="Search car or season…" className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20" />
                            </div>
                        </div>
                        {visibleTiers.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2.5 font-medium sm:px-5">Car</th>
                                            <th className="px-4 py-2.5 font-medium">Season</th>
                                            <th className="px-4 py-2.5 font-medium">Dates</th>
                                            <th className="px-4 py-2.5 font-medium">Rates by rental length</th>
                                            <th className="px-4 py-2.5 text-right font-medium">From / day</th>
                                            <th className="px-4 py-2.5 sm:px-5" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {visibleTiers.map(tier => {
                                            const car = cars.find(c => Number(c.id) === Number(tier.carId));
                                            const from = minRate(tier);
                                            const state = seasonState(tier);
                                            return (
                                                <tr key={tier.id} className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3 sm:px-5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                                                                {(car as any)?.image || (car as any)?.imageUrl ? <img src={(car as any).image || (car as any).imageUrl} alt="" className="h-full w-full object-contain" /> : <Car className="h-4 w-4 text-slate-400" />}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium text-slate-900">{car ? `${car.make} ${car.model}` : `Car #${tier.carId}`}</p>
                                                                <p className="truncate text-xs text-slate-500">{[car?.sippCode, car?.category, car?.location].filter(Boolean).join(' · ')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2 w-2 rounded-full ${state === 'live' ? 'bg-emerald-500' : state === 'upcoming' ? 'bg-accent' : 'bg-slate-300'}`} />
                                                            <span className="text-slate-800">{tier.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{tier.startDate} → {tier.endDate}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {tier.bands.slice(0, 3).map((b, bidx) => (
                                                                <span key={bidx} className="whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                                                                    {b.minDays}{b.maxDays === 9999 || !b.maxDays ? '+' : `–${b.maxDays}`}d · <span className="font-medium tabular-nums">{b.dailyRate}</span>
                                                                </span>
                                                            ))}
                                                            {tier.bands.length > 3 && <span className="text-xs text-slate-500">+{tier.bands.length - 3}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{from !== null ? `${from} ${tier.currency}` : '—'}</td>
                                                    <td className="px-4 py-3 text-right sm:px-5">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button onClick={() => goTab('edit')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent"><Edit className="h-3.5 w-3.5" /> Edit</button>
                                                            <button onClick={() => handleDeleteRate(tier.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete rate period" title="Delete rate period"><Trash2 className="h-4 w-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-5 py-12 text-center">
                                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><DollarSign className="h-5 w-5" /></span>
                                <p className="mt-3 text-sm font-medium text-slate-900">{rq ? 'No rates match your search' : 'No rates yet for this location'}</p>
                                {!rq && <button onClick={() => goTab('edit')} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-700"><Plus className="h-4 w-4" /> Add rates</button>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'spreadsheet' && (
                <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent"><Download className="h-5 w-5" /></span>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">1. Download your template</h3>
                                    <p className="mt-0.5 text-sm text-slate-500">An Excel file with your cars, seasons and bands for {locationLabel}, ready to fill in.</p>
                                </div>
                            </div>
                            <button onClick={handleDownload} className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                                <Download className="h-4 w-4" /> Download .xlsx
                            </button>
                        </div>
                        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Upload className="h-5 w-5" /></span>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">2. Upload the completed file</h3>
                                    <p className="mt-0.5 text-sm text-slate-500">Rates in the file replace the matching rates on Hogicar.</p>
                                </div>
                            </div>
                            <label className={`relative mt-5 flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm transition-colors ${uploadFile ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800' : 'border-slate-300 text-slate-500 hover:border-accent hover:text-accent'}`}>
                                <input type="file" accept=".xlsx,.xls" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="sr-only" />
                                <FileText className="h-5 w-5" />
                                <span className="max-w-full truncate px-3 font-medium">{uploadFile ? uploadFile.name : 'Choose an Excel file'}</span>
                            </label>
                            <button onClick={handleImport} disabled={!uploadFile || isSaving} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50">
                                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                {isSaving ? 'Importing…' : 'Import rates'}
                            </button>
                        </div>
                    </div>
                    <HistorySection
                        history={history}
                        onRestore={handleRestore}
                        onDownload={(loc) => {
                            if (loc) setSelectedLocation(loc);
                            handleDownload();
                        }}
                        onDelete={handleDeleteHistory}
                    />
                </div>
            )}

            <TemplateConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                config={config}
                onSave={fetchConfig}
                locationCode={selectedLocation}
                supplier={supplier}
            />
        </div>
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
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100/50 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-card">
                            <Car className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Choose from Car Library</h3>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">Quickly pre-fill specs from our master catalog</p>
                        </div>
                    </div>
                    <select 
                        onChange={(e) => handleModelSelect(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-card py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
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
                        <Briefcase className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold text-gray-700">Primary Specs</h3>
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
                        <Settings className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold text-gray-700">Configuration</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 ml-1">Transmission</label>
                            <select value={formData.transmission} onChange={e => handleChange('transmission', e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-card py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20">
                                <option value="MANUAL">Manual</option>
                                <option value="AUTOMATIC">Automatic</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 ml-1">Fuel Policy</label>
                            <select value={formData.fuelPolicy} onChange={e => handleChange('fuelPolicy', e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-card py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20">
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
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400  mb-2 flex items-center gap-2">
                        <User className="w-3 h-3" /> Capacity
                    </h4>
                    <InputField label="Passengers" type="number" value={formData.passengers} onChange={(e:any) => handleChange('passengers', parseInt(e.target.value))} readOnly={!!formData.carModelId} />
                    <InputField label="Large Bags" type="number" value={formData.bags} onChange={(e:any) => handleChange('bags', parseInt(e.target.value))} readOnly={!!formData.carModelId} />
                    <InputField label="Doors" type="number" value={formData.doors} onChange={(e:any) => handleChange('doors', parseInt(e.target.value))} readOnly={!!formData.carModelId} />
                </div>
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400  mb-2 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Financials
                    </h4>
                    <InputField label="Security Deposit" type="number" prefix="$" value={formData.deposit} onChange={(e:any) => handleChange('deposit', parseFloat(e.target.value))} />
                </div>
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.available} onChange={e => handleChange('available', e.target.checked)} className="w-5 h-5 rounded-card text-accent focus:ring-blue-500 border-gray-200" />
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-accent transition-colors">Vehicle Online</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.unlimitedMileage} onChange={e => handleChange('unlimitedMileage', e.target.checked)} className="w-5 h-5 rounded-card text-accent focus:ring-blue-500 border-gray-200" />
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-accent transition-colors">Unlimited Mileage</span>
                    </label>
                </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-card">
                            <MapPin className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Availability & Location</h3>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">Where this vehicle can be picked up</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 ml-1">Supplier Location</label>
                    <select 
                        value={formData.locationCode} 
                        onChange={e => {
                          const nextCode = e.target.value;
                          const nextLocation = supplierLocations.find((loc: any) => loc.locationCode === nextCode);
                          handleChange('locationCode', nextCode);
                          handleChange('locationName', nextLocation?.displayName || '');
                        }} 
                        className="w-full bg-white border border-gray-200 rounded-card py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                        required
                        disabled={supplierLocations.length === 0}
                    >
                        <option value="">Choose one of your active locations...</option>
                        {supplierLocations.map((loc: any) => (
                            <option key={loc.id || loc.locationCode} value={loc.locationCode}>{loc.displayName} ({loc.locationCode})</option>
                        ))}
                    </select>
                    {supplierLocations.length === 0 && (
                        <p className="text-xs font-bold text-red-500">
                            No active supplier locations available. Please request/activate a supplier location first.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-xl text-xs font-semibold  hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-accent text-white rounded-xl text-xs font-semibold  shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50">
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

    const fmtSS = (v: string) => { try { return format(parseISO(v), 'd MMM yyyy'); } catch { return v; } };
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const ssState = (ss: any) => (new Date(ss.endDate) < t0 ? 'ended' : new Date(ss.startDate) > t0 ? 'upcoming' : 'active');
    const selectCls = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <SectionHeader title="Close sales" icon={Lock} subtitle="Stop new bookings for a category on these dates." />
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="From" type="date" value={formData.startDate} onChange={(e: any) => setFormData({ ...formData, startDate: e.target.value })} />
                        <InputField label="To" type="date" value={formData.endDate} min={formData.startDate || undefined} onChange={(e: any) => setFormData({ ...formData, endDate: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Car category</label>
                        <select value={formData.category} onChange={(e: any) => setFormData({ ...formData, category: e.target.value })} className={selectCls}>
                            {Object.values(CarCategory).map(c => <option key={c} value={c}>{String(c).replace(/_/g, ' ').toLowerCase().replace(/^\w/, ch => ch.toUpperCase())}</option>)}
                        </select>
                    </div>
                    <InputField
                        label="Location code (optional)"
                        placeholder="e.g. AMM — leave empty for all locations"
                        value={formData.locationCode}
                        onChange={(e: any) => setFormData({ ...formData, locationCode: e.target.value.toUpperCase() })}
                    />
                    <button
                        onClick={handleApply}
                        disabled={isSaving}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        {isSaving ? 'Closing sales…' : 'Close sales'}
                    </button>
                    <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Existing bookings are not affected. Cars in this category won’t appear in search for these dates.</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Stop sales</h3>
                        <p className="text-xs text-slate-500">{stopSales.length} period{stopSales.length === 1 ? '' : 's'}</p>
                    </div>
                    {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
                </div>
                {stopSales.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle className="h-5 w-5" /></span>
                        <p className="mt-3 text-sm font-medium text-slate-900">All cars are on sale</p>
                        <p className="mt-1 text-sm text-slate-500">Close sales on the left when you can’t take bookings.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {stopSales.map((ss) => {
                            const st = ssState(ss);
                            return (
                                <li key={ss.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${st === 'active' ? 'bg-amber-50 text-amber-600' : st === 'upcoming' ? 'bg-accent-50 text-accent' : 'bg-slate-100 text-slate-400'}`}><Lock className="h-4 w-4" /></span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900">{fmtSS(ss.startDate)} – {fmtSS(ss.endDate)}</p>
                                        <p className="truncate text-xs text-slate-500">{ss.carInfo || ss.reason || (ss.carId ? `Car #${ss.carId}` : 'Category stop sale')}</p>
                                    </div>
                                    {st === 'active' ? <Badge variant="warning">Active</Badge> : st === 'upcoming' ? <Badge variant="info">Upcoming</Badge> : <Badge>Ended</Badge>}
                                    <button onClick={() => handleDelete(ss.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove stop sale" title="Remove stop sale"><Trash2 className="h-4 w-4" /></button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

// Add-ons the supplier's customers can reserve, with the prices Hogicar shows for this supplier.
const ExtrasSection = ({ supplier }: { supplier: Supplier }) => {
    const [settings, setSettings] = useState<{ catalog: any; supplierAddons: any } | null>(null);
    const locations = ((supplier as any).locations || []).map((l: any) => String(l?.value ?? l?.locationCode ?? '').toUpperCase()).filter((c: string) => c && c !== 'ALL');
    const [loc, setLoc] = useState<string>(locations[0] || (supplier as any).locationCode || '');
    useEffect(() => { loadAddonSettings().then(setSettings).catch(() => setSettings({ catalog: {}, supplierAddons: {} })); }, []);

    const addons = useMemo(() => {
        if (!settings) return [];
        const fakeCar: any = { supplierId: supplier.id, supplier: { id: supplier.id, name: supplier.name }, extras: [] };
        return buildCarAddons(fakeCar, settings, loc || undefined);
    }, [settings, loc, supplier.id, supplier.name]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-slate-600">These add-ons are shown to customers on your cars and paid to you at the desk. To change a price or stop offering an add-on, contact your Hogicar account manager.</p>
                </div>
                {locations.length > 1 && (
                    <select value={loc} onChange={e => setLoc(e.target.value)} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-accent">
                        {locations.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
            </div>
            {!settings ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>
            ) : addons.length ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {addons.map(a => (
                        <li key={a.id} className="flex gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <AddonIcon code={a.code} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold text-slate-900">{a.name}</p>
                                    {a.onRequest
                                        ? <Badge>At the desk</Badge>
                                        : <span className="whitespace-nowrap text-sm font-bold text-slate-900">{a.price} <span className="text-xs font-medium text-slate-500">USD/{a.type === 'per_day' ? 'day' : 'rental'}</span></span>}
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">{a.description}</p>
                                {!!a.maxPrice && <p className="mt-1 text-xs text-slate-500">Max {a.maxPrice} USD per rental</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">No add-ons are offered with your cars at the moment.</div>
            )}
        </div>
    );
};

const LocationsSection = ({ supplier }: { supplier: Supplier }) => {
    const [list, setList] = useState<any[] | null>(null);
    const [form, setForm] = useState({ locationCode: '', displayName: '' });
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const load = async () => {
        try {
            const res = await supplierApi.getMyLocations();
            setList(Array.isArray(res.data) ? res.data : []);
        } catch {
            setList(((supplier as any).locations || []).map((l: any) => ({ locationCode: l.value ?? l.locationCode, displayName: l.label ?? l.displayName, status: 'APPROVED' })));
        }
    };
    useEffect(() => { load(); }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = form.locationCode.trim().toUpperCase();
        if (!code) { setMessage({ ok: false, text: 'Enter the airport or city code.' }); return; }
        setSending(true);
        setMessage(null);
        try {
            await supplierApi.requestLocation({ locationCode: code, displayName: form.displayName.trim() || code });
            setForm({ locationCode: '', displayName: '' });
            setMessage({ ok: true, text: `Request for ${code} sent. We’ll review it within 1–2 working days.` });
            load();
        } catch (err: any) {
            setMessage({ ok: false, text: err?.response?.data?.message || 'The request could not be sent. Please try again.' });
        } finally {
            setSending(false);
        }
    };

    const statusOf = (s?: string) => {
        const v = String(s || '').toUpperCase();
        if (v === 'APPROVED' || v === 'ACTIVE') return <Badge variant="success">Live</Badge>;
        if (v === 'PENDING' || v === 'REQUESTED') return <Badge variant="warning">Under review</Badge>;
        if (v === 'REJECTED') return <Badge variant="error">Not approved</Badge>;
        return <Badge>{s || 'Unknown'}</Badge>;
    };

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-6">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                    <h3 className="text-sm font-semibold text-slate-900">Your locations</h3>
                    <p className="text-xs text-slate-500">Where customers can pick up your cars</p>
                </div>
                {list === null ? (
                    <div className="space-y-2 p-4">{[0, 1].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
                ) : list.length ? (
                    <ul className="divide-y divide-slate-100">
                        {list.map((l: any, i: number) => (
                            <li key={l.id || l.locationCode || i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent"><MapPin className="h-4 w-4" /></span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">{l.displayName || l.locationCode}</p>
                                    <p className="font-mono text-xs text-slate-500">{l.locationCode}</p>
                                </div>
                                {statusOf(l.status)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="px-5 py-12 text-center text-sm text-slate-500">No locations yet. Request your first one.</p>
                )}
            </div>

            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <SectionHeader title="Add a location" icon={Plus} subtitle="Request to rent cars at another airport or city." />
                <div className="space-y-4">
                    <InputField label="Airport or city code" icon={Search} placeholder="e.g. AQJ" value={form.locationCode} onChange={(e: any) => setForm({ ...form, locationCode: e.target.value.toUpperCase().slice(0, 8) })} />
                    <InputField label="Location name" placeholder="e.g. Aqaba King Hussein Airport" value={form.displayName} onChange={(e: any) => setForm({ ...form, displayName: e.target.value })} />
                    {message && (
                        <p className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{message.text}</p>
                    )}
                    <button type="submit" disabled={sending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50">
                        {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {sending ? 'Sending…' : 'Request location'}
                    </button>
                    <p className="text-xs text-slate-500">Hogicar reviews every request, usually within 1–2 working days.</p>
                </div>
            </form>
        </div>
    );
};

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
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-xl bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center overflow-hidden p-2">
                            {logoUrl ? (
                                <img src={logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" width="80" height="80" />
                            ) : (
                                <User className="w-8 h-8 text-slate-300" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{supplier.name}</h3>
                            <Badge variant="success">Verified Supplier</Badge>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-400">Branding Information</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-1">Supplier Logo</p>
                            <p className="text-sm font-semibold text-slate-900 break-all">{logoUrl || 'No logo URL provided'}</p>
                        </div>
                        <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-card">
                            <p className="text-xs font-bold text-blue-800 leading-relaxed italic">
                                Branding updates are currently locked. Please contact HogiCar Support to change your company logo or profile details.
                            </p>
                        </div>
                    </div>

                    <InputField label="Reservation Contact Email" value={(supplier as any).contactEmail || supplier.email || ''} readOnly />
                    <InputField label="Phone Number" value={supplier.phone || 'N/A'} readOnly />
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-bold text-gray-900">Security</h3>
                    </div>
                    <InputField label="Login Username (Email)" value={supplier.email} readOnly />
                    <InputField label="Current Password" type="password" value="********" readOnly />
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-card">
                        <p className="text-xs font-bold text-slate-500 leading-relaxed text-center">
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
        } catch (e: any) {
            const data = e?.response?.data;
            alert(`Could not save seasons & rules: ${typeof data === 'string' ? data : data?.message || data?.error || e?.message || 'please try again.'}`);
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
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-accent ring-1 ring-slate-200">
                            <RefreshCw className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Copy from another location</p>
                            <p className="text-xs text-slate-500">Start from the seasons and rules of a location you’ve already set up.</p>
                        </div>
                    </div>
                    <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                        <select 
                            onChange={(e) => handleInherit(e.target.value)}
                            defaultValue=""
                            className="h-10 cursor-pointer rounded-lg bg-transparent px-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="" disabled className="text-slate-900">Choose a location…</option>
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
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-card shadow-sm">
                        <Info className="w-5 h-5 text-accent" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-900 ">Strategy Definition</p>
                        <p className="text-xs font-bold text-blue-800 leading-relaxed opacity-80">
                            Define your seasons and day bands below. After saving, use the "Download Template" action to fill in prices for each car model.
                        </p>
                    </div>
                </div>

                {/* Global Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 ml-1">Template Currency</label>
                        <select 
                            value={localConfig.currency} 
                            onChange={e => setLocalConfig({...localConfig, currency: e.target.value})}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-card py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {CURRENCIES.map(curr => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.flag} {curr.code} - {curr.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-card flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-accent mt-0.5" />
                        <p className="text-xs font-bold text-blue-800 leading-relaxed">
                            Global currency for all rates in the generated XLSX template.
                        </p>
                    </div>
                </div>

                {/* Booking Conditions */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-accent" />
                        <h3 className="text-sm font-semibold text-gray-900">Booking Conditions</h3>
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
                            <Calendar className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-semibold text-gray-900">Pricing Seasons</h3>
                        </div>
                        <button onClick={addPeriod} className="text-xs font-semibold text-accent hover:text-blue-800">+ Add Season</button>
                    </div>
                    <div className="space-y-4">
                        {localConfig.periods?.map((period, idx) => (
                            <div key={idx} className="bg-white p-7 rounded-xl border border-gray-100 shadow-sm relative group hover:border-blue-200 transition-all">
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
                            <Shield className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-semibold text-gray-900">Security Bonds</h3>
                        </div>
                        <button onClick={addBond} className="text-xs font-semibold text-accent hover:text-blue-800">+ Add Bond</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localConfig.bonds?.map((bond, idx) => (
                            <div key={idx} className="bg-white p-7 rounded-xl border border-gray-100 shadow-sm relative group hover:border-blue-200 transition-all">
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
                            <div className="md:col-span-2 py-10 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                                <Shield className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-semibold">No security bonds defined</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rental Duration Bands */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-semibold text-gray-900">Rental Duration Bands</h3>
                        </div>
                        <button onClick={addBand} className="text-xs font-semibold text-accent hover:text-blue-800">+ Add Band</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localConfig.bands?.map((band, idx) => (
                            <div key={idx} className="bg-white p-7 rounded-xl border border-gray-100 shadow-sm relative group hover:border-blue-200 transition-all">
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
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-card text-xs font-semibold  hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                    <div className="flex-[2] flex flex-col gap-3">
                        <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-accent text-white rounded-card text-xs font-semibold  shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50">
                            {isSaving ? 'Saving Configuration...' : 'Save Rate Structure'}
                        </button>
                        <div className="flex items-center justify-center gap-2">
                            <input 
                                type="checkbox" 
                                id="apply-all-loc-config"
                                checked={localConfig.applyToAllLocations}
                                onChange={e => setLocalConfig({...localConfig, applyToAllLocations: e.target.checked})}
                                className="w-3.5 h-3.5 text-accent border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="apply-all-loc-config" className="text-xs font-semibold text-gray-500 cursor-pointer">
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
