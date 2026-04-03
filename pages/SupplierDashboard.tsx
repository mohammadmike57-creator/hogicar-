import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Car, Calendar, DollarSign, User, LogOut, 
  Settings, Settings2, Target, Package, MapPin, Zap, Clock, Shield, Plus, Edit, 
  Trash2, Search, Filter, ChevronRight, History, TrendingUp,
  Download, Upload, FileText, CheckCircle, XCircle, AlertCircle, Info,
  Menu, X, Bell, Briefcase, Gift, RefreshCw, BarChart3, Lock, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, addDays, subDays } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { supplierApi, getPublicLocations, API_BASE_URL } from '../api';
import { 
  Supplier, Car as CarType, Booking, CarCategory, Transmission, FuelPolicy, 
  BookingMode, TemplateConfig, Extra, RateTier, CarModel
} from '../types';
import Logo from '../components/Logo';

// ==================== Shared UI Components ====================

const StatCard = ({ icon: Icon, title, value, change, color = "orange" }: any) => {
  const colors: any = {
    orange: "from-orange-500 to-orange-600 shadow-orange-100/50 text-orange-600 bg-orange-50/50",
    blue: "from-blue-500 to-blue-600 shadow-blue-100/50 text-blue-600 bg-blue-50/50",
    green: "from-green-500 to-green-600 shadow-green-100/50 text-green-600 bg-green-50/50",
    purple: "from-purple-500 to-purple-600 shadow-purple-100/50 text-purple-600 bg-purple-50/50",
  };

  return (
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-50 flex flex-col justify-between group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3.5 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${colors[color].split(' ').slice(-2).join(' ')}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-colors duration-300 ${change.startsWith('+') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100/50 shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">{subtitle}</p>
        </div>
    </div>
);

const Badge = ({ children, variant = "default" }: any) => {
    const variants: any = {
        default: "bg-gray-100 text-gray-600",
        success: "bg-green-50 text-green-600",
        warning: "bg-orange-50 text-orange-600",
        error: "bg-red-50 text-red-600",
        info: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
    };
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${variants[variant]}`}>
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

const InputField = ({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative group">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />}
            <input {...props} className={`w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 ${Icon ? 'pl-11' : 'px-4'} pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-300 ${props.readOnly ? 'opacity-70 bg-gray-100/50 cursor-not-allowed' : ''}`} />
        </div>
    </div>
);

// ==================== Main Dashboard Component ====================

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats data
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.netPrice || 0), 0);
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    
    return {
      totalBookings,
      confirmedBookings,
      totalRevenue,
      pendingCount,
      activeCars: cars.filter(c => c.isAvailable || c.available).length,
      totalCars: cars.length
    };
  }, [bookings, cars]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [meRes, carsRes, bookingsRes] = await Promise.all([
          supplierApi.getMe(),
          supplierApi.getCars(),
          supplierApi.getBookings()
        ]);
        setSupplier(meRes.data);
        setCars(Array.isArray(carsRes.data) ? carsRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
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
        <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Portal...</p>
    </div>
  );

  if (!supplier) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans text-slate-900 overflow-x-hidden">
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
        animate={{ 
          x: isSidebarOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0),
          width: isSidebarOpen ? 280 : (window.innerWidth < 1024 ? 280 : 0),
          opacity: isSidebarOpen ? 1 : (window.innerWidth < 1024 ? 1 : 0)
        }}
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 flex flex-col overflow-hidden shadow-[20px_0_50px_rgba(0,0,0,0.02)] transition-all duration-300 ${!isSidebarOpen && 'lg:pointer-events-none'}`}
      >
        <div className="p-8 mb-4">
            <div className="flex items-center gap-3.5 group cursor-pointer">
                <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-200 group-hover:rotate-12 transition-transform duration-500">
                    <Car className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-black text-xl tracking-tighter text-slate-900 leading-none">HOGICAR</h1>
                    <div className="flex items-center gap-1 mt-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Partner Node</span>
                    </div>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto custom-scrollbar">
            <div className="px-4 mb-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Operations</div>
            {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'reservations', label: 'Reservations', icon: Calendar },
                { id: 'fleet', label: 'My Fleet', icon: Car },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                        activeSection === item.id 
                        ? 'bg-orange-600 text-white shadow-xl shadow-orange-200' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <item.icon className={`w-4 h-4 transition-transform duration-300 ${activeSection === item.id ? 'text-white' : 'group-hover:text-orange-600'}`} />
                    <span className={`text-[13px] font-black tracking-tight ${activeSection === item.id ? 'text-white' : 'text-slate-600'}`}>{item.label}</span>
                </button>
            ))}

            <div className="px-4 mb-3 mt-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Inventory</div>
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
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                        activeSection === item.id 
                        ? 'bg-orange-600 text-white shadow-xl shadow-orange-200' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <item.icon className={`w-4 h-4 transition-transform duration-300 ${activeSection === item.id ? 'text-white' : 'group-hover:text-orange-600'}`} />
                    <span className={`text-[13px] font-black tracking-tight ${activeSection === item.id ? 'text-white' : 'text-slate-600'}`}>{item.label}</span>
                </button>
            ))}
        </nav>

        <div className="p-8 mt-auto border-t border-gray-50">
            <button 
                onClick={() => { localStorage.removeItem('supplierToken'); navigate('/supplier-login'); }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all font-black text-sm uppercase tracking-widest"
            >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
            </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-500 w-full min-w-0 ${isSidebarOpen ? 'lg:ml-[280px]' : 'ml-0'}`}>
        {/* Top Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-slate-100 px-4 lg:px-8 py-5 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3 lg:gap-5">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100">
                    {isSidebarOpen && window.innerWidth < 1024 ? <X className="w-4 h-4 text-slate-600" /> : <Menu className="w-4 h-4 text-slate-600" />}
                </button>
                <div className="h-6 w-px bg-slate-100" />
                <div className="flex items-center gap-2 lg:gap-3.5 group cursor-pointer">
                    <motion.img 
                        whileHover={{ scale: 1.05 }}
                        src={supplier.logoUrl || 'https://placehold.co/40x40/orange/white?text=S'} 
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl object-cover border border-orange-500/10 shadow-lg" 
                        alt={supplier.name} 
                    />
                    <div className="max-w-[120px] lg:max-w-none truncate">
                        <h2 className="text-sm lg:text-base font-black text-slate-900 tracking-tight leading-none mb-1 truncate">{supplier.name}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{supplier.locationCode || 'Operational'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5">
                <div className="hidden lg:flex flex-col text-right items-end">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-100">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Verified</span>
                    </div>
                </div>
                <div className="h-8 w-px bg-slate-100 mx-1" />
                <button className="relative p-2.5 bg-slate-50 hover:bg-orange-50 rounded-xl transition-all border border-slate-100 hover:border-orange-100">
                    <Bell className="w-5 h-5 text-slate-400 group-hover:text-orange-600" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-600 rounded-full border-2 border-white shadow-sm" />
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-10 max-w-[1400px] mx-auto min-h-[calc(100vh-100px)]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                    {activeSection === 'dashboard' && <DashboardOverview stats={stats} bookings={bookings} supplier={supplier} onGenerateReport={handleGenerateReport} />}
                    {activeSection === 'reservations' && <ReservationsSection bookings={bookings} />}
                    {activeSection === 'fleet' && <FleetSection supplier={supplier} setActiveSection={setActiveSection} />}
                    {activeSection === 'rates' && <RatesSection supplier={supplier} cars={cars} />}
                    {activeSection === 'stopsales' && <StopSalesSection />}
                    {activeSection === 'extras' && <ExtrasSection />}
                    {activeSection === 'locations' && <LocationsSection />}
                    {activeSection === 'profile' && <ProfileSection supplier={supplier} />}
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
const DashboardOverview = ({ stats, bookings, supplier, onGenerateReport }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tighter">Welcome Back, {supplier.name.split(' ')[0]}</h1>
            <p className="text-xs lg:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Here's the pulse of your rental operations</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Last 7 Days</button>
            <button 
                onClick={onGenerateReport}
                className="flex-1 md:flex-none px-5 py-2.5 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:scale-105 transition-all"
            >
                Generate Report
            </button>
        </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} title="Est. Revenue" value={`$${(stats.totalRevenue / 1).toFixed(0)}`} change="+12.5%" />
        <StatCard icon={Calendar} title="Total Bookings" value={stats.totalBookings} color="blue" change="+5.2%" />
        <StatCard icon={Car} title="Active Fleet" value={`${stats.activeCars}/${stats.totalCars}`} color="green" />
        <StatCard icon={Zap} title="Pending Actions" value={stats.pendingCount} color="purple" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <SectionHeader title="Performance Analytics" icon={TrendingUp} subtitle="Daily booking trends and volume" />
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                        <Area type="monotone" dataKey="bookings" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorBook)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <SectionHeader title="Recent Activity" icon={History} subtitle="Live operational feed" />
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase">Live</span>
            </div>
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {bookings.slice(0, 8).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-black text-xs group-hover:bg-orange-600 group-hover:text-white transition-all">
                                {b.firstName?.[0]}{b.lastName?.[0]}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{b.firstName} {b.lastName}</div>
                                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{b.bookingRef} • {b.pickupCode}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-900">${b.netPrice}</div>
                            <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1 inline-block ${b.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/30 border border-gray-50">
                <SectionHeader title="Reservations Management" icon={Calendar} subtitle="Manage incoming booking requests" />
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                            placeholder="Search by ID or Name..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20" 
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
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
                            <tr key={b.id} className="hover:bg-orange-50/20 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="font-mono text-[11px] font-black text-orange-600 group-hover:scale-105 transition-transform origin-left">{b.bookingRef}</div>
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
                                    <div className="text-[9px] text-green-600 font-black uppercase tracking-tighter">Confirmed</div>
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
const FleetSection = ({ supplier, setActiveSection }: { supplier: Supplier, setActiveSection: (s: string) => void }) => {
  const [cars, setCars] = useState<CarType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);

  const fetchCars = async () => {
    try {
      const res = await supplierApi.getCars();
      setCars(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchCars(); }, []);

  const handleDelete = async (id: any) => {
    if (!window.confirm('Erase this vehicle from fleet?')) return;
    try {
      await supplierApi.deleteCar(id);
      fetchCars();
    } catch (e) { alert("Failed to delete"); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/30 border border-gray-50">
        <SectionHeader title="Fleet Management" icon={Car} subtitle="Manage your vehicle inventory" />
        <button 
            onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cars.map(car => (
            <motion.div 
                key={car.id} 
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden group"
            >
                <div className="relative h-48 bg-gray-50 flex items-center justify-center p-8 overflow-hidden">
                    <img 
                        src={car.imageUrl || car.image || 'https://placehold.co/400x250/orange/white?text=Vehicle'} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                        alt={car.name}
                        width={400}
                        height={250}
                    />
                    <div className="absolute top-4 left-4">
                        <Badge variant={(car.isAvailable || car.available) ? 'success' : 'error'}>{(car.isAvailable || car.available) ? 'Available' : 'Maintenance'}</Badge>
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">{car.name}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{car.make} {car.model} • {car.year}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase">{car.sippCode}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-400">
                            <User className="w-3 h-3 text-orange-500" />
                            <span className="text-[11px] font-bold">{car.passengers} Seats</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Package className="w-3 h-3 text-orange-500" />
                            <span className="text-[11px] font-bold">{car.bags} Large Bags</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Settings className="w-3 h-3 text-orange-500" />
                            <span className="text-[11px] font-bold uppercase">{car.transmission}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Briefcase className="w-3 h-3 text-orange-500" />
                            <span className="text-[11px] font-bold uppercase">{car.category}</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingCar(car); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all">
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
      </div>

      <EditCarModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        car={editingCar} 
        supplier={supplier} 
        onSave={() => { fetchCars(); setActiveSection('fleet'); }} 
      />
    </motion.div>
  );
};

// ==================== Manual Pricing Section ====================
const ManualPricingSection = ({ config, cars, onUpdate }: { config: TemplateConfig, cars: CarType[], onUpdate: () => void }) => {
    const [targetType, setTargetType] = useState<'category' | 'sipp'>('category');
    const [targetValues, setTargetValues] = useState<string[]>([]);
    const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(0);
    const [isCustomPeriod, setIsCustomPeriod] = useState(false);
    const [customPeriod, setCustomPeriod] = useState({
        name: 'Manual Update',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
    });
    const [deposit, setDeposit] = useState<number | ''>('');
    const [bandRates, setBandRates] = useState<{[key: number]: number}>({});
    const [isSaving, setIsSaving] = useState(false);

    // Get unique categories and SIPPs from the fleet
    const uniqueTargets = useMemo(() => {
        const set = new Set<string>();
        cars.forEach(car => {
            const val = targetType === 'category' ? car.category : car.sippCode;
            if (val) set.add(val);
        });
        return Array.from(set).sort();
    }, [cars, targetType]);

    const handleApply = async () => {
        if (targetValues.length === 0) {
            alert(`Please select at least one ${targetType === 'category' ? 'Category' : 'SIPP Code'}`);
            return;
        }

        const period = isCustomPeriod ? customPeriod : config.periods[selectedPeriodIdx];
        if (!period) return;

        setIsSaving(true);
        try {
            const payload = {
                targetType,
                targetValues,
                periodName: period.name,
                startDate: period.startDate,
                endDate: period.endDate,
                currency: config.currency,
                deposit: deposit === '' ? null : deposit,
                rates: (isCustomPeriod ? config.periods[0]?.bands : config.periods[selectedPeriodIdx]?.bands)?.map((b, idx) => ({
                    minDays: b.minDays,
                    maxDays: b.maxDays,
                    dailyRate: bandRates[idx] || 0
                })) || []
            };
            await supplierApi.bulkUpdateRates(payload);
            alert("Rates updated successfully for all matching cars!");
            onUpdate();
        } catch (e) {
            alert("Failed to update rates manually.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTargetValue = (val: string) => {
        setTargetValues(prev => 
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const activePeriod = isCustomPeriod ? customPeriod : config.periods[selectedPeriodIdx];
    const activeBands = (isCustomPeriod ? config.periods[0]?.bands : config.periods[selectedPeriodIdx]?.bands) || [];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-gray-200/60 border border-gray-50 mt-12 overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-orange-600 rounded-3xl shadow-lg shadow-orange-200 ring-8 ring-orange-50">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Direct Pricing Management</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Manual Bulk Updates & Deposit Configuration</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12 relative z-10">
                {/* Target Type & Selection */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Settings2 className="w-3 h-3" /> 1. Select Target Type
                        </label>
                        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                            <button 
                                onClick={() => { setTargetType('category'); setTargetValues([]); }}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${targetType === 'category' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Categories
                            </button>
                            <button 
                                onClick={() => { setTargetType('sipp'); setTargetValues([]); }}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${targetType === 'sipp' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                SIPP Codes
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Target className="w-3 h-3" /> 2. Select {targetType === 'category' ? 'Categories' : 'SIPP Codes'}
                        </label>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-2">
                            {uniqueTargets.map(val => (
                                <label key={val} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-50 cursor-pointer hover:border-orange-200 transition-all group">
                                    <input 
                                        type="checkbox" 
                                        checked={targetValues.includes(val)}
                                        onChange={() => toggleTargetValue(val)}
                                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight group-hover:text-orange-600">{val}</span>
                                </label>
                            ))}
                            {uniqueTargets.length === 0 && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-4">No {targetType}s found</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Period Selection */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Calendar className="w-3 h-3" /> 3. Define Time Period
                        </label>
                        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
                            <button 
                                onClick={() => setIsCustomPeriod(false)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isCustomPeriod ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Use Existing Season
                            </button>
                            <button 
                                onClick={() => setIsCustomPeriod(true)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCustomPeriod ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Custom Range
                            </button>
                        </div>
                        
                        {!isCustomPeriod ? (
                            <select 
                                value={selectedPeriodIdx} 
                                onChange={e => setSelectedPeriodIdx(parseInt(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                            >
                                {config.periods.map((p, idx) => (
                                    <option key={idx} value={idx}>{p.name} ({p.startDate} - {p.endDate})</option>
                                ))}
                            </select>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={customPeriod.startDate}
                                        onChange={e => setCustomPeriod({...customPeriod, startDate: e.target.value})}
                                        className="w-full bg-white border border-gray-100 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={customPeriod.endDate}
                                        onChange={e => setCustomPeriod({...customPeriod, endDate: e.target.value})}
                                        className="w-full bg-white border border-gray-100 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bond / Deposit */}
                <div className="lg:col-span-4 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        <Shield className="w-3 h-3" /> 4. Update Security Bond
                    </label>
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm group-focus-within:text-orange-600 transition-colors">{config.currency}</span>
                        <input 
                            type="number" 
                            placeholder="Optional: New Deposit Amount"
                            value={deposit}
                            onChange={e => setDeposit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-gray-300"
                        />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-1">
                        Leave empty to keep existing deposits for selected vehicles.
                    </p>
                </div>
            </div>

            {activePeriod && (
                <div className="bg-gray-50/30 p-8 md:p-10 rounded-[2.5rem] border border-gray-100 mb-12 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em] flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-orange-600" />
                            </div>
                            5. Set Daily Rates
                        </h4>
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-white rounded-full border border-gray-100 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                                {isCustomPeriod ? 'Custom Period' : activePeriod.name}
                            </span>
                            <span className="px-4 py-1.5 bg-white rounded-full border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
                                {format(parseISO(activePeriod.startDate), 'MMM d')} - {format(parseISO(activePeriod.endDate), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {activeBands.map((band, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-3 block group-hover:text-orange-500 transition-colors">
                                    {band.label || `${band.minDays}${band.maxDays ? `-${band.maxDays}` : '+'} Days`}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs group-focus-within:text-orange-600 transition-colors">{config.currency}</span>
                                    <input 
                                        type="number" 
                                        value={bandRates[idx] || ''}
                                        onChange={e => setBandRates({...bandRates, [idx]: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-gray-50/50 border border-transparent group-hover:bg-white group-hover:border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button 
                onClick={handleApply}
                disabled={isSaving || targetValues.length === 0}
                className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-4 ${
                    targetValues.length > 0 
                    ? 'bg-gray-900 text-white shadow-gray-200 hover:bg-orange-600 hover:scale-[1.01] active:scale-95' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
                {isSaving ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Updates...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Apply Manual Update to {targetValues.length} {targetType === 'category' ? 'Categories' : 'SIPPs'}
                    </>
                )}
            </button>
        </motion.div>
    );
}

// ==================== Rates Section ====================
const RatesSection = ({ supplier, cars }: { supplier: Supplier, cars: CarType[] }) => {
    const [config, setConfig] = useState<TemplateConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<string>('global');

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const locCode = selectedLocation === 'global' ? undefined : selectedLocation;
            const res = await supplierApi.getTemplateConfig(locCode);
            setConfig(res.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchConfig(); }, [selectedLocation]);

    const handleDownload = async () => {
        try {
            const locCode = selectedLocation === 'global' ? undefined : selectedLocation;
            const res = await supplierApi.downloadTemplate(locCode);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const filenameSuffix = selectedLocation === 'global' ? 'Global' : selectedLocation;
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
        } catch (e) { alert("Import failed. Check template format."); }
        finally { setIsSaving(false); }
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
                        <option value="global">Global Strategy</option>
                        {supplier.locations?.map((loc) => (
                            <option key={loc.value} value={loc.value}>{loc.label || loc.value}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Export Section */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 border border-blue-100/50">
                        <Download className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3">Download Rates Template</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-sm">
                        Get the latest spreadsheet with your fleet pre-populated. Fill in the daily rates for each period and re-upload.
                    </p>
                    {config && config.periods.length === 0 && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3 text-left">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-blue-900 leading-normal uppercase tracking-tight">
                                Note: You haven't defined any seasons yet. We'll provide a default structure which you can customize later.
                            </p>
                        </div>
                    )}
                    <button onClick={handleDownload} className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3">
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
                        Upload your completed XLSX template. This will update all pricing bands across your fleet instantly.
                    </p>
                    <div className="w-full space-y-4">
                        <div className="relative group">
                            <input 
                                type="file" 
                                accept=".xlsx"
                                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-all ${uploadFile ? 'border-green-500 bg-green-50/50' : 'border-gray-100 bg-gray-50/30 group-hover:border-orange-500'}`}>
                                <FileText className={`w-5 h-5 ${uploadFile ? 'text-green-600' : 'text-gray-300'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${uploadFile ? 'text-green-900' : 'text-gray-400'}`}>
                                    {uploadFile ? uploadFile.name : 'Choose XLSX File'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handleImport}
                            disabled={!uploadFile || isSaving}
                            className="w-full py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-200 disabled:opacity-50 hover:scale-[1.02] transition-all"
                        >
                            {isSaving ? 'Processing...' : 'Sync Rates Now'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Pricing Update Section */}
            {config && (
                <ManualPricingSection 
                    config={config} 
                    cars={cars}
                    onUpdate={() => {
                        fetchConfig();
                    }} 
                />
            )}

            {/* Template Preview */}
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full" />
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

            {/* Strategy Overview */}
            {config && (
                <div className="space-y-8">
                    {selectedLocation !== 'global' && !config.locationCode && (
                        <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <Globe className="w-6 h-6 text-orange-600" />
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
                                className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
                            >
                                Customize for this location
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-orange-50 rounded-2xl">
                                <Calendar className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Pricing Seasons</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Defined time periods for dynamic rates</p>
                            </div>
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-all"
                                title="Edit Strategy"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {config.periods.map((p, idx) => (
                                <div key={idx} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-orange-200 transition-all">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">{p.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>{p.startDate}</span>
                                        <span className="text-orange-500">→</span>
                                        <span>{p.endDate}</span>
                                    </div>
                                </div>
                            ))}
                            {config.periods.length === 0 && (
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
                            {config.bands.map((b, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{b.label || `${b.minDays}-${b.maxDays || '∞'} Days`}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.minDays} to {b.maxDays || '∞'} d</span>
                                </div>
                            ))}
                            {config.bands.length === 0 && (
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest p-4">No day bands defined.</p>
                            )}
                        </div>
                    </div>
                </div>
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
        </motion.div>
    );
};

// ==================== EditCarModal Component ====================
const EditCarModal = ({ isOpen, onClose, car, supplier, onSave }: any) => {
  const [formData, setFormData] = useState<any>({
    name: '', make: '', model: '', year: new Date().getFullYear(),
    sippCode: '', category: 'ECONOMY', transmission: 'MANUAL', fuelPolicy: 'FULL_TO_FULL',
    passengers: 5, bags: 2, doors: 4, airConditioning: true, imageUrl: '',
    deposit: 0, excess: 0, unlimitedMileage: true, available: true,
    locationCode: supplier?.locationCode || '',
    locationName: '',
  });
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (car) setFormData({ ...car, available: car.isAvailable ?? car.available });
      else setFormData({
        name: '', make: '', model: '', year: new Date().getFullYear(),
        sippCode: '', category: 'ECONOMY', transmission: 'MANUAL', fuelPolicy: 'FULL_TO_FULL',
        passengers: 5, bags: 2, doors: 4, airConditioning: true, imageUrl: '',
        deposit: 0, excess: 0, unlimitedMileage: true, available: true,
        locationCode: supplier?.locationCode || '',
        locationName: '',
      });
      setIsCustomLocation(false);
      supplierApi.getCarModels().then(res => setCarModels(res.data)).catch(console.error);
    }
  }, [isOpen, car, supplier]);

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
    try {
      if (car?.id) await supplierApi.updateCar(car.id, formData);
      else await supplierApi.createCar(formData);
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
                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-xl">
                            <Car className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Choose from Car Library</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Quickly pre-fill specs from our master catalog</p>
                        </div>
                    </div>
                    <select 
                        onChange={(e) => handleModelSelect(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer"
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
                        <Briefcase className="w-4 h-4 text-orange-600" />
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
                        <Settings className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Configuration</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transmission</label>
                            <select value={formData.transmission} onChange={e => handleChange('transmission', e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20">
                                <option value="MANUAL">Manual</option>
                                <option value="AUTOMATIC">Automatic</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fuel Policy</label>
                            <select value={formData.fuelPolicy} onChange={e => handleChange('fuelPolicy', e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20">
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
                    <InputField label="Security Deposit" type="number" value={formData.deposit} onChange={(e:any) => handleChange('deposit', parseFloat(e.target.value))} />
                    <InputField label="Max Excess" type="number" value={formData.excess} onChange={(e:any) => handleChange('excess', parseFloat(e.target.value))} />
                </div>
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex flex-col justify-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.available} onChange={e => handleChange('available', e.target.checked)} className="w-5 h-5 rounded-lg text-orange-600 focus:ring-orange-500 border-gray-200" />
                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Vehicle Online</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.unlimitedMileage} onChange={e => handleChange('unlimitedMileage', e.target.checked)} className="w-5 h-5 rounded-lg text-orange-600 focus:ring-orange-500 border-gray-200" />
                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Unlimited Mileage</span>
                    </label>
                </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-xl">
                            <MapPin className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Availability & Location</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Where this vehicle can be picked up</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setIsCustomLocation(!isCustomLocation)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCustomLocation ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                        {isCustomLocation ? 'Using Custom Location' : '+ Create New Location'}
                    </button>
                </div>

                {isCustomLocation ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <InputField 
                            label="New Location Code (e.g. DXB, LHR)" 
                            value={formData.locationCode} 
                            onChange={(e:any) => handleChange('locationCode', e.target.value.toUpperCase())} 
                            placeholder="IATA Code"
                            required
                        />
                        <InputField 
                            label="Location Display Name" 
                            value={formData.locationName} 
                            onChange={(e:any) => handleChange('locationName', e.target.value)} 
                            placeholder="e.g. Dubai Intl Airport"
                            required
                        />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Existing Location</label>
                        <select 
                            value={formData.locationCode} 
                            onChange={e => handleChange('locationCode', e.target.value)} 
                            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer"
                            required
                        >
                            <option value="">Choose a location...</option>
                            {supplier?.locations?.map((loc: any) => (
                                <option key={loc.id} value={loc.locationCode}>{loc.displayName} ({loc.locationCode})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex gap-4 pt-6">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-orange-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all disabled:opacity-50">
                    {isSaving ? 'Processing...' : (car ? 'Update Vehicle' : 'Add to Fleet')}
                </button>
            </div>
        </form>
    </Modal>
  );
};

// ==================== Simple Sub-sections ====================
const StopSalesSection = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 max-w-2xl">
        <SectionHeader title="Stop Sales" icon={Clock} subtitle="Block dates for specific categories" />
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <InputField label="Start Date" type="date" />
                <InputField label="End Date" type="date" />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Car Category</label>
                <select className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all">
                    {Object.values(CarCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all">Apply Blockout</button>
        </div>
    </motion.div>
);

const ExtrasSection = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        <div className="flex justify-between items-center">
            <SectionHeader title="Extras & Add-ons" icon={Package} subtitle="Manage optional services and insurance" />
            <button className="px-6 py-3 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-200">+ New Extra</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['GPS Navigation', 'Baby Seat', 'Additional Driver', 'Full Coverage'].map((extra, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 border border-gray-100">
                        <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">{extra}</h3>
                    <div className="text-xs text-orange-600 font-black uppercase tracking-widest mb-6">$15.00 / day</div>
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
            <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl">
                <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-wider">
                    Note: All new location requests are reviewed by HogiCar Admin. Expansion usually takes 24-48 hours once approved.
                </p>
            </div>
            <button className="w-full py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-200 transition-all">Submit Expansion Request</button>
        </div>
    </motion.div>
);

const ProfileSection = ({ supplier }: { supplier: Supplier }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-4xl">
        <SectionHeader title="Supplier Profile" icon={User} subtitle="Account settings and security" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <img src={supplier.logoUrl} className="w-20 h-20 rounded-[2rem] object-cover border-2 border-orange-500 shadow-lg" alt="Logo" width={80} height={80} />
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{supplier.name}</h3>
                        <Badge variant="success">Verified Supplier</Badge>
                    </div>
                </div>
                <InputField label="Reservation Contact Email" value={supplier.contactEmail} readOnly />
                <InputField label="Phone Number" value={supplier.phone || 'N/A'} readOnly />
                <button className="w-full py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 transition-all">Update Information</button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Security</h3>
                </div>
                <InputField label="Login Username (Email)" value={supplier.email} readOnly />
                <InputField label="Current Password" type="password" value="********" readOnly />
                <button className="w-full py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all">Change Credentials</button>
            </div>
        </div>
    </motion.div>
);

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
        locationCode: locationCode === 'global' ? undefined : locationCode
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (config) {
                setLocalConfig({
                    ...config,
                    locationCode: locationCode === 'global' ? undefined : locationCode
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
                    locationCode: locationCode === 'global' ? undefined : locationCode
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

    const handleInherit = async (sourceLoc: string) => {
        if (!confirm(`This will overwrite your current settings for this location with the ones from ${sourceLoc}. Continue?`)) return;
        try {
            const locCode = sourceLoc === 'global' ? undefined : sourceLoc;
            const res = await supplierApi.getTemplateConfig(locCode);
            if (res.data) {
                setLocalConfig({
                    ...res.data,
                    locationCode: locationCode === 'global' ? undefined : locationCode,
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
                            <RefreshCw className="w-6 h-6 text-orange-400" />
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
                            {locationCode !== 'global' && <option value="global" className="text-slate-900">Global Strategy</option>}
                            {supplier?.locations?.filter((l: any) => l.locationCode !== locationCode).map((l: any) => (
                                <option key={l.locationCode} value={l.locationCode} className="text-slate-900">{l.displayName || l.locationCode}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Informational Note */}
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Info className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-orange-900 uppercase tracking-[0.2em]">Strategy Definition</p>
                        <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-widest opacity-80">
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
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                        >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JOD">JOD - Jordanian Dinar</option>
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
                        <Settings className="w-5 h-5 text-orange-600" />
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Booking Conditions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField 
                            label="Min Lead Time (Hrs)" 
                            type="number" 
                            icon={Clock}
                            value={localConfig.minBookingLeadTime || ''} 
                            onChange={(e: any) => setLocalConfig({...localConfig, minBookingLeadTime: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Grace Period (Hrs)" 
                            type="number" 
                            icon={RefreshCw}
                            value={localConfig.gracePeriodHours || ''} 
                            onChange={(e: any) => setLocalConfig({...localConfig, gracePeriodHours: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label={`One Way Fee (${localConfig.currency})`} 
                            type="number" 
                            icon={DollarSign}
                            value={localConfig.oneWayFee || ''} 
                            onChange={(e: any) => setLocalConfig({...localConfig, oneWayFee: parseFloat(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Min. Duration (Days)" 
                            type="number" 
                            icon={Calendar}
                            value={localConfig.minRentalDays || ''} 
                            onChange={(e: any) => setLocalConfig({...localConfig, minRentalDays: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Max. Duration (Days)" 
                            type="number" 
                            icon={Calendar}
                            value={localConfig.maxRentalDays || ''} 
                            onChange={(e: any) => setLocalConfig({...localConfig, maxRentalDays: parseInt(e.target.value) || 0})} 
                        />
                        <InputField 
                            label="Max. Lead Time (Days)" 
                            type="number" 
                            icon={Zap}
                            value={localConfig.maxBookingLeadTimeDays || ''} 
                            onChange={(e: any) => setLocalConfig({...localConfig, maxBookingLeadTimeDays: parseInt(e.target.value) || 0})} 
                        />
                    </div>
                </div>

                {/* Day Bands */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Global Day Bands</h3>
                        </div>
                        <button onClick={addBand} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700">+ Add Band</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localConfig.bands.map((band, idx) => (
                            <div key={idx} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 relative group">
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

                {/* Seasons / Periods */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pricing Seasons</h3>
                        </div>
                        <button onClick={addPeriod} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700">+ Add Season</button>
                    </div>
                    <div className="space-y-4">
                        {localConfig.periods.map((period, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-orange-200 transition-all">
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

                <div className="flex gap-4 pt-6 border-t border-gray-50">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all disabled:opacity-50">
                        {isSaving ? 'Saving Configuration...' : 'Save Rate Structure'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SupplierDashboard;
