import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, LoaderCircle, Mail, ChevronRight, Activity, Cpu, Globe, Server, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();

    // Mouse Tracking for Parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for mouse movement
    const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

    // Transform for background parallax
    const bgX = useTransform(springX, [0, window.innerWidth], [15, -15]);
    const bgY = useTransform(springY, [0, window.innerHeight], [15, -15]);

    // Transform for card 3D tilt
    const cardRotateX = useTransform(springY, [0, window.innerHeight], [2, -2]);
    const cardRotateY = useTransform(springX, [0, window.innerWidth], [-2, 2]);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Access Denied');

            localStorage.setItem('adminToken', data.token);
            navigate('/admin');

        } catch (err: any) {
            setError(err.message || 'System authentication failure.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="min-h-screen bg-[#05070a] flex items-center justify-center relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-200"
        >
            {/* --- SYSTEM CORE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Dynamic Data Nodes */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] bg-orange-600/5 rounded-full blur-[100px]"
                />
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-20, 20]), y: useTransform(springY, [0, window.innerHeight], [-20, 20]) }}
                    className="absolute -bottom-[10%] -left-[10%] w-[70%] h-[70%] bg-slate-600/5 rounded-full blur-[120px]"
                />

                {/* Animated Grid Lines */}
                <div className="absolute inset-0 opacity-[0.05]" 
                    style={{ 
                        backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }} 
                />

                {/* Pulsing Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[160px] animate-pulse" />
            </div>

            {/* --- MAIN LOGIN CONTAINER --- */}
            <motion.div 
                style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-[420px] px-6"
            >
                {/* System Identification */}
                <div className="text-center mb-8">
                    <motion.div 
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-block mb-6 p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md"
                    >
                        <Logo variant="light" className="h-8" />
                    </motion.div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                        <Shield className="w-3 h-3 text-orange-500" />
                        Administrative Command Center
                    </div>
                </div>

                {/* Authentication Interface */}
                <div className="bg-[#0d1117]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[40px] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] relative overflow-hidden">
                    {/* Decorative Scanner Line */}
                    <motion.div 
                        animate={{ y: [0, 400, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent pointer-events-none"
                    />

                    <form onSubmit={handleLogin} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-red-200 uppercase tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Identifier</label>
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-orange-500 transition-colors">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@hogicar.internal"
                                        className="w-full bg-black/40 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Encrypted Access Token</label>
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-orange-500 transition-colors">
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-black/40 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={isLoading}
                            className="w-full bg-white text-black font-black text-[10px] uppercase tracking-[0.25em] py-5 rounded-2xl shadow-xl shadow-white/5 hover:bg-orange-600 hover:text-white transition-all duration-500 flex items-center justify-center gap-3 group/btn disabled:opacity-50"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Initiate Uplink
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/[0.05]">
                        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                            <Cpu className="w-4 h-4 text-slate-400" />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Core V4</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity border-x border-white/[0.05]">
                            <Server className="w-4 h-4 text-slate-400" />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Secure Srv</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                            <Activity className="w-4 h-4 text-orange-500" />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Live Ops</span>
                        </div>
                    </div>
                </div>

                {/* Footer Telemetry */}
                <div className="mt-8 flex justify-center items-center gap-4 text-slate-700 font-black text-[8px] uppercase tracking-[0.3em]">
                    <span>Node: SG-PROD-01</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/40 animate-pulse" />
                    <span>Lat: 12ms</span>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
