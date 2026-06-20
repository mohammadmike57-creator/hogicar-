import * as React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building, Car, LoaderCircle, Mail, Lock, ChevronRight, ShieldCheck, Globe, Zap, AlertCircle, TrendingUp, Sparkles, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';

const SupplierLogin: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);
    const [searchParams] = useSearchParams();

    // Mouse Tracking for Parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for mouse movement
    const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

    // Transform for background parallax
    const bgX = useTransform(springX, [0, window.innerWidth], [20, -20]);
    const bgY = useTransform(springY, [0, window.innerHeight], [20, -20]);

    // Transform for card 3D tilt
    const cardRotateX = useTransform(springY, [0, window.innerHeight], [2, -2]);
    const cardRotateY = useTransform(springX, [0, window.innerWidth], [-2, 2]);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    React.useEffect(() => {
        if (searchParams.get('reason') === 'session_expired') {
            setError('Your session has expired. Please log in again.');
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const credentials = { email: email.trim(), password };
            const response = await fetch(`${API_BASE_URL}/api/supplier/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Invalid credentials');

            localStorage.setItem('supplierToken', data.token);
            if (data.supplier?.id) localStorage.setItem('supplierId', data.supplier.id);
            navigate('/supplier');

        } catch (err: any) {
            setError(err.message || 'An unknown login error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="min-h-screen bg-slate-100 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-blue-500/20 selection:text-blue-950"
        >
            {/* --- ENTERPRISE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    style={{ x: bgX, y: bgY }}
                    className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_42%,#1e3a8a_100%)] lg:w-[62%]"
                />
                <div className="absolute inset-0 opacity-[0.18]"
                    style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)`, backgroundSize: '48px 48px' }}
                />
                <div className="absolute inset-y-0 left-0 hidden lg:block w-[62%] border-r border-white/10" />
                <div className="absolute inset-y-0 right-0 hidden lg:block w-[38%] bg-white" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-slate-950" />
                <div className="absolute left-8 bottom-8 hidden lg:flex items-center gap-3 text-white/10">
                    <Car className="w-48 h-48" />
                    <div className="h-px w-72 bg-white/10" />
                </div>
            </div>

            {/* --- LEFT SIDE: PREMIUM BRANDING --- */}
            <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 lg:p-16 lg:flex-1 min-h-[340px] lg:min-h-screen text-white">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Logo className="h-12 w-auto" variant="light" />
                </motion.div>

                <div className="max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 shadow-sm text-white text-[10px] font-extrabold uppercase tracking-[0.2em] mb-6 lg:mb-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Enterprise Fleet Logistics
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.05] tracking-tight mb-5 lg:mb-6">
                            Supplier operations, pricing, and fleet control.
                        </h1>
                        <p className="text-sm lg:text-base text-slate-300 font-semibold leading-relaxed max-w-lg mb-6 lg:mb-8">
                            Access a secure command center for reservations, inventory, rate strategy, and partner performance.
                        </p>
                    </motion.div>

                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: TrendingUp, title: "Yield Engine", desc: "Rate control." },
                            { icon: Globe, title: "Network Hub", desc: "Location coverage." },
                            { icon: Zap, title: "Live Ops", desc: "Fleet visibility." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                                className="group cursor-default"
                            >
                                <div className="p-5 rounded-card bg-white/10 border border-white/15 shadow-sm group-hover:bg-white/[0.14] transition-all duration-500">
                                    <div className="w-10 h-10 rounded-card bg-white/10 flex items-center justify-center text-blue-200 mb-4 transition-all">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-white font-extrabold text-xs mb-1.5 tracking-tight uppercase">{feature.title}</h3>
                                    <p className="text-slate-300 text-[10px] leading-relaxed font-bold">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-8 text-slate-400 text-[9px] font-extrabold uppercase tracking-[0.3em]">
                    <span>&copy; {new Date().getFullYear()} Hogicar Partnership</span>
                    <div className="w-12 h-px bg-white/20" />
                    <span>Security Protocol</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: FORM CONTAINER --- */}
            <div className="relative z-10 w-full lg:w-[520px] flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-white lg:bg-transparent">
                <motion.div
                    style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1200 }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-md bg-white p-6 sm:p-8 lg:p-10 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/70 relative"
                >
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-card bg-slate-950 border border-slate-800 text-white mb-4 shadow-inner">
                            <Building className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tighter mb-1">Partner Access</h2>
                        <p className="text-slate-400 font-extrabold text-[9px] uppercase tracking-[0.25em]">Authorized Supply Nodes Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Partner Identity</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-[#007ac2] transition-colors">
                                    <User className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-card py-4 pl-13 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-xs font-extrabold"
                                    placeholder="Username or Email"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Access Key</label>
                                <button type="button" className="text-[9px] font-extrabold text-[#007ac2] uppercase tracking-widest hover:text-slate-900 transition-colors">Reset</button>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-[#007ac2] transition-colors">
                                    <Lock className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-card py-4 pl-13 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-xs font-extrabold"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#007ac2] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-red-50 border border-red-100 p-4 rounded-card flex items-center gap-3.5"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-600 text-[10px] font-extrabold leading-tight uppercase tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full bg-slate-950 hover:bg-[#007ac2] text-white font-extrabold py-4 rounded-card shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-500 mt-4 group"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-xs uppercase tracking-[0.25em]">Partner Login</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                            New partner?{' '}
                            <Link to="/apply" className="text-[#007ac2] hover:text-slate-900 transition-colors ml-1 border-b-2 border-blue-100 hover:border-slate-900 pb-0.5">Application Form</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SupplierLogin;
