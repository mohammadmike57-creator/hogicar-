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
            className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-900"
        >
            {/* --- ADMINISTRATIVE CORE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Sophisticated Gradients */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    className="absolute -top-[5%] -right-[5%] w-[50%] h-[50%] bg-orange-100/30 rounded-full blur-[100px]"
                />
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-25, 25]), y: useTransform(springY, [0, window.innerHeight], [-25, 25]) }}
                    className="absolute -bottom-[5%] -left-[5%] w-[50%] h-[50%] bg-blue-100/20 rounded-full blur-[120px]"
                />

                {/* Professional Grid System */}
                <div className="absolute inset-0 opacity-[0.4]" 
                    style={{ 
                        backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
                        backgroundSize: '48px 48px'
                    }} 
                />

                {/* Pulse Points */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-200/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            {/* --- MAIN LOGIN CONTAINER --- */}
            <motion.div 
                style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1200 }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-[440px] px-6"
            >
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ y: -15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-block mb-6 p-4 rounded-3xl bg-white border border-slate-200 shadow-sm"
                    >
                        <Logo variant="dark" className="h-10" />
                    </motion.div>
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">
                        <Shield className="w-3.5 h-3.5 text-orange-500" />
                        Command Infrastructure
                    </div>
                </div>

                {/* Authentication Interface */}
                <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden">
                    {/* Visual Security Sweep */}
                    <motion.div 
                        animate={{ y: [0, 450, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent pointer-events-none"
                    />

                    <form onSubmit={handleLogin} className="space-y-7">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"
                                >
                                    <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-tight leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            <div className="space-y-2.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Identity</label>
                                <div className="relative group/field">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-orange-500 transition-colors">
                                        <Mail className="w-4.5 h-4.5" />
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="system.admin@hogicar.net"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-5 text-xs font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Token</label>
                                <div className="relative group/field">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-orange-500 transition-colors">
                                        <Lock className="w-4.5 h-4.5" />
                                    </div>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-5 text-xs font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.3em] py-6 rounded-2xl shadow-2xl shadow-slate-200 hover:bg-orange-600 transition-all duration-500 flex items-center justify-center gap-3 group/btn disabled:opacity-50"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Establish Link
                                    <ArrowRight className="w-4.5 h-4.5 group-hover/btn:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 grid grid-cols-3 gap-6 pt-10 border-t border-slate-50">
                        <div className="flex flex-col items-center gap-2.5 group/icon">
                            <Cpu className="w-5 h-5 text-slate-200 group-hover/icon:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">System 4.0</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group/icon border-x border-slate-50">
                            <Server className="w-5 h-5 text-slate-200 group-hover/icon:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Encrypted</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group/icon">
                            <Activity className="w-5 h-5 text-slate-200 group-hover/icon:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Live Sync</span>
                        </div>
                    </div>
                </div>

                {/* System Diagnostics */}
                <div className="mt-10 flex justify-center items-center gap-6 text-slate-400 font-black text-[9px] uppercase tracking-[0.35em]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <span>Core Operational</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>Ping: 8ms</span>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
