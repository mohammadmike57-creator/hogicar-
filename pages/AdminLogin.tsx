import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Car, LoaderCircle, User, Lock, ArrowRight, ShieldCheck, Database, Key, AlertCircle, Cpu, Fingerprint, Activity } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';
import { setAdminToken } from '../lib/adminApi';
import { Logo } from '../components/Logo';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = React.useState('');
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
    const cardRotateX = useTransform(springY, [0, window.innerHeight], [4, -4]);
    const cardRotateY = useTransform(springX, [0, window.innerWidth], [-4, 4]);

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

        const loginUrl = `${API_BASE_URL}/api/admin/auth/login`;
        const loginBody = { username: username.trim(), password };
        
        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginBody),
                credentials: 'omit',
            });

            if (!response.ok) {
                let errorMessage = `Login failed (Status: ${response.status}).`;
                try {
                    const errorData = await response.json();
                    if(errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch(e) {}
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setAdminToken(data.token);
            navigate('/admin');

        } catch (err: any) {
            setError(err.message || "An unknown login error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="min-h-screen bg-[#05060b] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200"
        >
            {/* --- SYSTEM INFRASTRUCTURE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Subtle Mesh Gradients */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    animate={{ 
                        opacity: [0.1, 0.15, 0.1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[140px]"
                />
                
                {/* Static Grid */}
                <div className="absolute inset-0 opacity-[0.03]" 
                    style={{ 
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }} 
                />
            </div>

            <motion.div 
                style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-[#0a0d17] border border-white/5 rounded-[2.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden relative z-10"
            >
                {/* Left Side: Branding */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent">
                    <div className="relative">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                            <Logo className="h-8 w-auto mb-16" variant="light" />
                        </motion.div>
                        
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mb-6">
                                <Cpu className="w-3 h-3" />
                                Infrastructure Core v9.4
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight mb-6">
                                Centralized <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400 italic">Control Interface.</span>
                            </h1>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                                Management of global fleet logistics, real-time financial monitoring, and multi-tenant security layers.
                            </p>
                        </motion.div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: ShieldCheck, text: "Hash Verification Active" },
                            { icon: Database, text: "Data Persistence Layer Ready" },
                            { icon: Fingerprint, text: "Biometric Session Logic" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                                className="flex items-center gap-3 text-slate-500"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/5 border border-white/5 flex items-center justify-center text-blue-500">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Authentication */}
                <div className="p-8 lg:p-20 flex flex-col justify-center bg-white/[0.01] border-l border-white/5">
                    <div className="mb-10 lg:hidden text-center">
                        <Logo className="h-8 w-auto inline-block" variant="light" />
                    </div>

                    <div className="mb-10 relative">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 mb-6">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-1">Administrative Access</h2>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Verify system identity</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Admin UID</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-blue-500 text-slate-700 transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-xs font-bold"
                                    placeholder="system_root"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Access Token</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-blue-500 text-slate-700 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-xs font-bold"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: 5 }}
                                    animate={{ opacity: 1, x: 0 }}
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
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-300 mt-4 group"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-xs uppercase tracking-[0.2em]">Authorize Session</span>
                                    <Activity className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-2 text-slate-700 text-[8px] font-black uppercase tracking-[0.4em]">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Secure Node Connection Active
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
