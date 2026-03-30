import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building, Car, LoaderCircle, Mail, Lock, ChevronRight, ArrowRight, ShieldCheck, Globe, Zap, AlertCircle, TrendingUp, Users, Activity } from 'lucide-react';
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
    const cardRotateX = useTransform(springY, [0, window.innerHeight], [5, -5]);
    const cardRotateY = useTransform(springX, [0, window.innerWidth], [-5, 5]);

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
            const credentials = {
                email: email.trim(),
                password,
                plainPassword: password,
                username: email.trim(),
                plain_password: password
            };

            const response = await fetch(`${API_BASE_URL}/api/supplier/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (jsonError) {
                data = { message: rawText || `Server error (${response.status})` };
            }

            if (!response.ok) {
                const msg = data.message || data.error || `Login failed (${response.status})`;
                throw new Error(msg);
            }

            if (!data.token) {
                throw new Error('Login successful but no token received.');
            }

            localStorage.setItem('supplierToken', data.token);
            if (data.supplier?.id) {
                localStorage.setItem('supplierId', data.supplier.id);
            }
            
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
            className="min-h-screen bg-[#050505] flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-200"
        >
            {/* --- MOVING BACKGROUND ELEMENTS --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Mesh Gradient 1 */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-orange-600/10 rounded-full blur-[120px]"
                />
                {/* Mesh Gradient 2 */}
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-30, 30]), y: useTransform(springY, [0, window.innerHeight], [-30, 30]) }}
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-blue-600/5 rounded-full blur-[140px]"
                />

                {/* Animated Grid */}
                <div className="absolute inset-0 opacity-[0.15]" 
                    style={{ 
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }} 
                />

                {/* Moving Particles/Lines */}
                <div className="absolute inset-0">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                y: ["-100%", "200%"],
                                opacity: [0, 1, 0]
                            }}
                            transition={{ 
                                duration: 10 + i * 2, 
                                repeat: Infinity, 
                                ease: "linear",
                                delay: i * 3
                            }}
                            className="absolute w-px h-64 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent blur-[1px]"
                            style={{ left: `${20 + i * 30}%` }}
                        />
                    ))}
                </div>
            </div>

            {/* --- LEFT SIDE: THE CONTENT & BRANDING --- */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-8 lg:p-20">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Link to="/" className="inline-block group">
                        <Logo className="h-14 w-auto drop-shadow-2xl" variant="light" />
                    </Link>
                </motion.div>

                <div className="max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <Activity className="w-3 h-3 animate-pulse" />
                            Partner Network v4.0
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-10">
                            The Next Era <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-300 to-yellow-500 italic">
                                of Fleet Control.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl mb-14">
                            Experience the world's most sophisticated car rental management ecosystem. 
                            Built for high-performance teams, engineered for global scale.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: TrendingUp, title: "Market Growth", desc: "Access premium global demand channels." },
                            { icon: Users, title: "Identity", desc: "Unified partner management system." },
                            { icon: Zap, title: "Speed", desc: "Instant sync with global search engines." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                className="relative group"
                            >
                                <div className="absolute -inset-2 bg-gradient-to-br from-orange-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6 rounded-3xl group-hover:border-orange-500/30 transition-all duration-500">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform duration-500">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-white font-bold text-base mb-2">{feature.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1.2 }}
                    className="flex items-center gap-6 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]"
                >
                    <span>&copy; {new Date().getFullYear()} Hogicar Partnership Network</span>
                    <span className="w-12 h-px bg-slate-800" />
                    <span>Privacy & Terms</span>
                </motion.div>
            </div>

            {/* --- RIGHT SIDE: THE LOGIN FORM --- */}
            <div className="relative z-10 w-full lg:w-[600px] flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
                    initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 lg:p-14 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                >
                    {/* Inner Glow */}
                    <div className="absolute -top-[50%] -right-[50%] w-full h-full bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="mb-12 text-center relative">
                        <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.8 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 text-orange-500 mb-8 relative"
                        >
                            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-50" />
                            <Building className="w-10 h-10 relative z-10" />
                        </motion.div>
                        <h2 className="text-4xl font-black text-white tracking-tight mb-3">Portal Access</h2>
                        <p className="text-slate-400 font-medium text-lg">Secure verification required</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8 relative">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Digital Identity</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within/input:text-orange-500 text-slate-600">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all duration-300 font-semibold"
                                    placeholder="partner@enterprise.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Secret Key</label>
                                <button type="button" className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] hover:text-orange-400 transition-colors">Recover?</button>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within/input:text-orange-500 text-slate-600">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all duration-300 font-semibold"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex items-center gap-4 overflow-hidden"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-sm font-bold leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -4, shadow: "0 20px 40px -10px rgba(234, 88, 12, 0.4)" }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black py-5 rounded-2xl shadow-2xl shadow-orange-900/30 flex items-center justify-center gap-4 disabled:opacity-50 group transition-all duration-300"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-7 h-7 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg uppercase tracking-widest">Establish Session</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-12 pt-10 border-t border-white/5 text-center">
                        <p className="text-slate-500 text-sm font-bold tracking-wide">
                            UNAUTHORIZED?{' '}
                            <Link to="/become-supplier" className="text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest ml-2">
                                Apply Now
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
            
            {/* --- HYPER-PROFESSIONAL MOVING CAR --- */}
            <div className="absolute bottom-16 left-0 w-full overflow-hidden pointer-events-none h-24 flex items-center">
                <motion.div
                    animate={{ x: ["-20%", "120%"] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-6 opacity-20 relative"
                >
                    <div className="relative">
                        <Car className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        <motion.div 
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-2 left-4 w-8 h-1 bg-white blur-md"
                        />
                    </div>
                    <div className="relative h-px w-[600px] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-orange-500 to-transparent" />
                        <motion.div 
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent w-40"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SupplierLogin;
