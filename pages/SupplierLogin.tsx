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
            className="min-h-screen bg-[#030407] flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-200"
        >
            {/* --- PRETER-PROFESSIONAL BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Mesh Gradients */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-orange-600/5 rounded-full blur-[120px]"
                />
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-30, 30]), y: useTransform(springY, [0, window.innerHeight], [-30, 30]) }}
                    className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-slate-600/5 rounded-full blur-[140px]"
                />

                {/* Micro-Grid */}
                <div className="absolute inset-0 opacity-[0.03]" 
                    style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} 
                />

                {/* Moving Cars Parallax (Subtle) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -1000, opacity: 0 }}
                            animate={{ x: 2000, opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear", delay: i * 7 }}
                            className="absolute"
                            style={{ top: `${20 + i * 25}%` }}
                        >
                            <Car className="w-64 h-64 text-white rotate-12" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- LEFT SIDE: CONTENT --- */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-10 lg:p-24">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Logo className="h-10 w-auto" variant="light" />
                </motion.div>

                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <Sparkles className="w-3 h-3" />
                            Global Supply Chain Enterprise
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
                            Empowering the World's <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-200 to-yellow-500 italic">
                                Leading Fleet Partners.
                            </span>
                        </h1>
                        <p className="text-sm lg:text-base text-slate-400 font-medium leading-relaxed max-w-lg mb-12">
                            Access a high-performance ecosystem designed for modern mobility operations. 
                            Synchronize your inventory with global demand in real-time.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: TrendingUp, title: "Yield Optimization", desc: "Maximize ROI per vehicle." },
                            { icon: Globe, title: "Global Reach", desc: "Connect with 140+ countries." },
                            { icon: Zap, title: "Instant Sync", desc: "Zero-latency data updates." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                                className="group cursor-default"
                            >
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] group-hover:border-orange-500/30 transition-all duration-300">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-white font-bold text-xs mb-1.5 tracking-tight">{feature.title}</h3>
                                    <p className="text-slate-500 text-[10px] leading-relaxed font-medium">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>&copy; {new Date().getFullYear()} Hogicar Partnership</span>
                    <div className="w-8 h-px bg-slate-800" />
                    <span className="cursor-default">Privacy Infrastructure</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: FORM --- */}
            <div className="relative z-10 w-full lg:w-[540px] flex items-center justify-center p-6 lg:p-12 bg-white/[0.01] backdrop-blur-sm border-l border-white/5">
                <motion.div
                    style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="w-full max-w-sm bg-[#0a0c14] border border-white/10 p-10 lg:p-12 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden"
                >
                    {/* Decorative Form Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/20 text-orange-500 mb-6">
                            <Building className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight mb-2">Partner Portal</h2>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Authorized Entry Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Credential Identifier</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700 group-focus-within/input:text-orange-500 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-xs font-bold"
                                    placeholder="partner@enterprise.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Secret Key</label>
                                <button type="button" className="text-[8px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-400 transition-colors">Lost Key?</button>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700 group-focus-within/input:text-orange-500 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-xs font-bold"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-[10px] font-bold leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-300 mt-4 group"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-xs uppercase tracking-[0.2em]">Establish Session</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                            New partner?{' '}
                            <Link to="/apply" className="text-orange-500 hover:text-orange-400 transition-colors ml-1">Apply for Membership</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SupplierLogin;
