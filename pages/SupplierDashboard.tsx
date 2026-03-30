import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Car, Calendar, DollarSign, User, LogOut, 
  Settings, Package, MapPin, Zap, Clock, Shield, Plus, Edit, 
  Trash2, Search, Filter, ChevronRight, History, TrendingUp,
  Download, Upload, FileText, CheckCircle, XCircle, AlertCircle,
  Menu, X, Bell, Briefcase, Gift, RefreshCw, BarChart3, Lock
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
    orange: "from-orange-500 to-orange-600 shadow-orange-200/50 text-orange-600 bg-orange-50",
    blue: "from-blue-500 to-blue-600 shadow-blue-200/50 text-blue-600 bg-blue-50",
    green: "from-green-500 to-green-600 shadow-green-200/50 text-green-600 bg-green-50",
    purple: "from-purple-500 to-purple-600 shadow-purple-200/50 text-purple-600 bg-purple-50",
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-50 flex flex-col justify-between group transition-all duration-500 relative overflow-hidden"
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${colors[color].split(' ').slice(0,2).join(' ')} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`} />
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl shadow-lg transition-transform duration-500 group-hover:rotate-6 ${colors[color].split(' ').slice(-2).join(' ')}`}>
          <Icon className="w-7 h-7" />
        </div>
        {change && (
          <motion.span 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border transition-colors duration-300 ${change.startsWith('+') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {change}
          </motion.span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>
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
            <input {...props} className={`w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 ${Icon ? 'pl-11' : 'px-4'} pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-300`} />
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
      activeCars: cars.filter(c => c.isAvailable || (c as any).available).length,
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

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Portal...</p>
    </div>
  );

  if (!supplier) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans text-gray-900">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-50 flex flex-col overflow-hidden shadow-[20px_0_50px_rgba(0,0,0,0.02)]"
      >
        <div className="p-10 mb-6">
            <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-orange-200 group-hover:rotate-12 transition-transform duration-500">
                    <Car className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="font-black text-2xl tracking-tighter text-gray-900 leading-none">HOGICAR</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Partner Hub</span>
                    </div>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-6 space-y-2.5 overflow-y-auto custom-scrollbar">
            <div className="px-4 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-60">Operations</div>
            {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'reservations', label: 'Reservations', icon: Calendar },
                { id: 'fleet', label: 'My Fleet', icon: Car },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                        activeSection === item.id 
                        ? 'bg-orange-600 text-white shadow-2xl shadow-orange-200' 
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeSection === item.id ? 'text-white scale-110' : 'group-hover:text-orange-600 group-hover:scale-110'}`} />
                    <span className={`text-sm font-black tracking-tight ${activeSection === item.id ? 'text-white' : 'text-gray-600'}`}>{item.label}</span>
                </button>
            ))}

            <div className="px-4 mb-4 mt-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-60">Management</div>
            {[
                { id: 'rates', label: 'Rates & Pricing', icon: DollarSign },
                { id: 'stopsales', label: 'Stop Sales', icon: Clock },
                { id: 'extras', label: 'Extras & Add-ons', icon: Package },
                { id: 'locations', label: 'Location Requests', icon: MapPin },
                { id: 'profile', label: 'Supplier Profile', icon: User },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                        activeSection === item.id 
                        ? 'bg-orange-600 text-white shadow-2xl shadow-orange-200' 
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeSection === item.id ? 'text-white scale-110' : 'group-hover:text-orange-600 group-hover:scale-110'}`} />
                    <span className={`text-sm font-black tracking-tight ${activeSection === item.id ? 'text-white' : 'text-gray-600'}`}>{item.label}</span>
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
      <main className={`flex-1 transition-all duration-500 ${isSidebarOpen ? 'ml-[300px]' : 'ml-0'}`}>
        {/* Top Header */}
        <header className="sticky top-0 bg-white/70 backdrop-blur-xl z-40 border-b border-gray-100 px-10 py-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-6">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all shadow-sm">
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="h-8 w-px bg-gray-100" />
                <div className="flex items-center gap-4 group cursor-pointer">
                    <motion.img 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        src={supplier.logoUrl || 'https://placehold.co/40x40/orange/white?text=S'} 
                        className="w-12 h-12 rounded-[1.25rem] object-cover border-2 border-orange-500/10 shadow-xl shadow-orange-100/50" 
                        alt={supplier.name} 
                    />
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1.5">{supplier.name}</h2>
                        <div className="flex items-center gap-2">
                            <div className="p-0.5 bg-orange-100 rounded-md">
                                <MapPin className="w-2.5 h-2.5 text-orange-600" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{supplier.locationCode || 'Global Operations'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:flex flex-col text-right items-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1.5">Network Status</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-xl border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Verified Partner</span>
                    </div>
                </div>
                <div className="h-10 w-px bg-gray-100 mx-2" />
                <button className="relative p-3 bg-gray-50 hover:bg-orange-50 group rounded-2xl transition-all border border-transparent hover:border-orange-100">
                    <Bell className="w-6 h-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    <span className="absolute top-3 right-3 w-3 h-3 bg-orange-600 rounded-full border-[3px] border-white shadow-sm" />
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="p-10 max-w-[1400px] mx-auto min-h-[calc(100vh-100px)]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                    {activeSection === 'dashboard' && <DashboardOverview stats={stats} bookings={bookings} supplier={supplier} />}
                    {activeSection === 'reservations' && <ReservationsSection bookings={bookings} />}
                    {activeSection === 'fleet' && <FleetSection supplier={supplier} />}
                    {activeSection === 'rates' && <RatesSection supplier={supplier} />}
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
const DashboardOverview = ({ stats, bookings, supplier }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
    <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Welcome Back, {supplier.name.split(' ')[0]}</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Here's the pulse of your rental operations</p>
        </div>
        <div className="flex gap-2">
            <button className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Last 7 Days</button>
            <button className="px-5 py-2.5 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:scale-105 transition-all">Generate Report</button>
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

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            <th className="px-8 py-5">Reference</th>
                            <th className="px-8 py-5">Customer</th>
                            <th className="px-8 py-5">Schedule</th>
                            <th className="px-8 py-5">Route</th>
                            <th className="px-8 py-5">Earnings</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((b) => (
                            <tr key={b.id} className="hover:bg-orange-50/20 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="font-mono text-xs font-black text-orange-600 group-hover:scale-105 transition-transform origin-left">{b.bookingRef}</div>
                                    <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">ID: {b.id}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-sm font-black text-gray-900">{b.firstName} {b.lastName}</div>
                                    <div className="text-[10px] text-gray-400 font-bold lowercase mt-0.5">{b.email}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-[11px] font-black text-gray-700">{b.pickupDate}</div>
                                    <div className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {b.startTime}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="info">{b.pickupCode}</Badge>
                                        <ChevronRight className="w-3 h-3 text-gray-300" />
                                        <Badge variant="info">{b.dropoffCode}</Badge>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-sm font-black text-gray-900">${b.netPrice}</div>
                                    <div className="text-[10px] text-green-600 font-bold">Confirmed</div>
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
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all">
                                            <FileText className="w-4 h-4" />
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
const FleetSection = ({ supplier }: { supplier: Supplier }) => {
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
                        src={car.image || (car as any).imageUrl || 'https://placehold.co/400x250/orange/white?text=Vehicle'} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                        alt={car.name} 
                    />
                    <div className="absolute top-4 left-4">
                        <Badge variant={(car.isAvailable || (car as any).available) ? 'success' : 'error'}>{(car.isAvailable || (car as any).available) ? 'Available' : 'Maintenance'}</Badge>
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
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Manage Rates</button>
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
        onSave={fetchCars} 
      />
    </motion.div>
  );
};

// ==================== Rates Section ====================
const RatesSection = ({ supplier }: { supplier: Supplier }) => {
    const [config, setConfig] = useState<TemplateConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await supplierApi.getTemplateConfig();
            setConfig(res.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleDownload = async () => {
        try {
            const res = await supplierApi.downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `HogiCar_Rates_${supplier.name.replace(/\s/g, '_')}.xlsx`);
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
            <div className="flex justify-between items-center">
                <SectionHeader title="Rates Management" icon={DollarSign} subtitle="Dynamic pricing and bulk imports" />
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

            {/* Template Preview */}
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black tracking-tighter mb-2">Configure Rate Template</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Define seasons, periods, and day bands</p>
                    </div>
                    <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        Edit Structure
                    </button>
                </div>
            </div>
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
  });
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (car) setFormData({ ...car, available: car.isAvailable ?? car.available });
      else setFormData({
        name: '', make: '', model: '', year: new Date().getFullYear(),
        sippCode: '', category: 'ECONOMY', transmission: 'MANUAL', fuelPolicy: 'FULL_TO_FULL',
        passengers: 5, bags: 2, doors: 4, airConditioning: true, imageUrl: '',
        deposit: 0, excess: 0, unlimitedMileage: true, available: true,
        locationCode: supplier?.locationCode || '',
      });
      supplierApi.getCarModels().then(res => setCarModels(res.data)).catch(console.error);
    }
  }, [isOpen, car, supplier]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (car?.id) await supplierApi.updateCar(car.id, formData);
      else await supplierApi.createCar(formData);
      onSave(); onClose();
    } catch (e) { alert("Failed to save car"); }
    finally { setIsSaving(false); }
  };

  const handleChange = (field: string, val: any) => setFormData((prev: any) => ({ ...prev, [field]: val }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={car ? 'Edit Vehicle' : 'Add New Vehicle'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Primary Specs</h3>
                    </div>
                    <InputField label="Display Name" value={formData.name} onChange={(e:any) => handleChange('name', e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Make" value={formData.make} onChange={(e:any) => handleChange('make', e.target.value)} required />
                        <InputField label="Model" value={formData.model} onChange={(e:any) => handleChange('model', e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="SIPP Code" value={formData.sippCode} onChange={(e:any) => handleChange('sippCode', e.target.value)} required />
                        <InputField label="Year" type="number" value={formData.year} onChange={(e:any) => handleChange('year', parseInt(e.target.value))} required />
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
                    <InputField label="Category" value={formData.category} onChange={(e:any) => handleChange('category', e.target.value)} />
                    <InputField label="Image URL" value={formData.imageUrl} onChange={(e:any) => handleChange('imageUrl', e.target.value)} placeholder="https://..." />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <User className="w-3 h-3" /> Capacity
                    </h4>
                    <InputField label="Passengers" type="number" value={formData.passengers} onChange={(e:any) => handleChange('passengers', parseInt(e.target.value))} />
                    <InputField label="Large Bags" type="number" value={formData.bags} onChange={(e:any) => handleChange('bags', parseInt(e.target.value))} />
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
                    <img src={supplier.logoUrl} className="w-20 h-20 rounded-[2rem] object-cover border-2 border-orange-500 shadow-lg" alt="Logo" />
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

export default SupplierDashboard;
