import * as React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building, Car, LoaderCircle, Mail, Lock, ChevronRight, ShieldCheck, Globe, Zap, AlertCircle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';

const SupplierLogin: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();
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
            className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-900"
        >
            {/* --- SOPHISTICATED ENTERPRISE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Soft Gradient Orbs */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-orange-100/40 rounded-full blur-[100px]"
                />
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-40, 40]), y: useTransform(springY, [0, window.innerHeight], [-40, 40]) }}
                    className="absolute -bottom-[10%] -right-[5%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]"
                />

                {/* Refined Dot Pattern */}
                <div className="absolute inset-0 opacity-[0.4]" 
                    style={{ backgroundImage: `radial-gradient(#e2e8f0 1.5px, transparent 0)`, backgroundSize: '32px 32px' }} 
                />

                {/* Animated Car Outlines (High-End Motion) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -1200, opacity: 0 }}
                            animate={{ x: 2200, opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 12 + i * 4, repeat: Infinity, ease: "linear", delay: i * 6 }}
                            className="absolute"
                            style={{ top: `${15 + i * 22}%` }}
                        >
                            <div className="flex items-center gap-3">
                                <Car className="w-48 h-48 text-orange-600 rotate-6" />
                                <div className="h-px w-96 bg-gradient-to-r from-orange-400 to-transparent" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- LEFT SIDE: PREMIUM BRANDING --- */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-12 lg:p-24">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Logo className="h-12 w-auto" variant="dark" />
                </motion.div>

                <div className="max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Enterprise Fleet Logistics
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8">
                            Global Supply Chain <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                                Mastery Unleashed.
                            </span>
                        </h1>
                        <p className="text-base lg:text-lg text-slate-500 font-bold leading-relaxed max-w-lg mb-12">
                            Access the world's most advanced mobility ecosystem. 
                            Manage your fleet with precision, scale with intelligence, 
                            and dominate your local market with HogiCar.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: TrendingUp, title: "Yield Engine", desc: "AI-driven pricing." },
                            { icon: Globe, title: "Global Hub", desc: "Direct OTA sync." },
                            { icon: Zap, title: "Elite Tech", desc: "Real-time fleet ops." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                                className="group cursor-default"
                            >
                                <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:shadow-orange-100 group-hover:border-orange-200 transition-all duration-500">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4 group-hover:rotate-12 transition-all">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-slate-900 font-black text-xs mb-1.5 tracking-tight uppercase">{feature.title}</h3>
                                    <p className="text-slate-400 text-[10px] leading-relaxed font-bold">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-8 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                    <span>&copy; {new Date().getFullYear()} Hogicar Partnership</span>
                    <div className="w-12 h-px bg-slate-200" />
                    <span className="hover:text-slate-900 transition-colors cursor-pointer">Security Protocol</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: FORM CONTAINER --- */}
            <div className="relative z-10 w-full lg:w-[600px] flex items-center justify-center p-8 lg:p-16 bg-white shadow-[-40px_0_100px_rgba(0,0,0,0.03)] border-l border-slate-100">
                <motion.div
                    style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1200 }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-md bg-white p-12 lg:p-14 rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] relative"
                >
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-orange-50 border border-orange-100 text-orange-600 mb-6 shadow-inner">
                            <Building className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter mb-2">Partner Access</h2>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.25em]">Authorized Supply Nodes Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Partner Email</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-orange-500 transition-colors">
                                    <Mail className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-13 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-xs font-black"
                                    placeholder="node.admin@hogicar.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                                <button type="button" className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:text-slate-900 transition-colors">Reset</button>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-orange-500 transition-colors">
                                    <Lock className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-13 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-xs font-black"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3.5"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-600 text-[10px] font-black leading-tight uppercase tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full bg-slate-900 hover:bg-orange-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-500 mt-6 group"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-xs uppercase tracking-[0.25em]">Initialize Session</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            New partner?{' '}
                            <Link to="/apply" className="text-orange-600 hover:text-slate-900 transition-colors ml-1 border-b-2 border-orange-100 hover:border-slate-900 pb-0.5">Application Form</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SupplierLogin;
