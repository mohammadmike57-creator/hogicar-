import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, LoaderCircle, Mail, Activity, Cpu, Globe, Server, AlertCircle, ArrowRight, ShieldCheck, Zap, Database, Terminal, Car } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = React.useState('');
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
    const bgX = useTransform(springX, [0, window.innerWidth], [20, -20]);
    const bgY = useTransform(springY, [0, window.innerHeight], [20, -20]);

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
            const credentials = { username: username.trim(), password };
            const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
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
            className="h-screen bg-gray-50 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-900"
        >
            {/* --- ADMINISTRATIVE CORE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Sophisticated Gradients */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] bg-orange-100/40 rounded-full blur-[100px]"
                />
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-40, 40]), y: useTransform(springY, [0, window.innerHeight], [-40, 40]) }}
                    className="absolute -bottom-[10%] -left-[5%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[120px]"
                />

                {/* Professional Grid System */}
                <div className="absolute inset-0 opacity-[0.2]" 
                    style={{ 
                        backgroundImage: `linear-gradient(to right, #e2e8f0 1.5px, transparent 1.5px), linear-gradient(to bottom, #e2e8f0 1.5px, transparent 1.5px)`,
                        backgroundSize: '48px 48px'
                    }} 
                />

                {/* Animated Car Outlines (High-End Motion) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -1200, opacity: 0 }}
                            animate={{ x: 2200, opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear", delay: i * 8 }}
                            className="absolute"
                            style={{ top: `${20 + i * 30}%` }}
                        >
                            <div className="flex items-center gap-3">
                                <Car className="w-56 h-56 text-slate-400 rotate-3" />
                                <div className="h-px w-[600px] bg-gradient-to-r from-slate-300 to-transparent" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Pulse Point */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-200/5 rounded-full blur-[160px] animate-pulse" />
            </div>

            {/* --- LEFT SIDE: COMMAND BRANDING --- */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-8 lg:p-16">
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
                            Administrative Infrastructure
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
                            Autonomous Platform <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-indigo-600">
                                Control Reimagined.
                            </span>
                        </h1>
                        <p className="text-sm lg:text-base text-slate-500 font-bold leading-relaxed max-w-lg mb-8">
                            The nerve center of your global mobility operations. 
                            Monitor real-time data flows, govern partner networks, 
                            and orchestrate the HogiCar ecosystem with absolute authority.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Activity, title: "Global Intel", desc: "Live transaction mesh." },
                            { icon: ShieldCheck, title: "Protocol 4.0", desc: "Military-grade auth." },
                            { icon: Terminal, title: "Core Access", desc: "Direct system kernel." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                                className="group cursor-default"
                            >
                                <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-100 group-hover:border-indigo-200 transition-all duration-500">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 mb-4 group-hover:rotate-12 transition-all">
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
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <span>Core Operational</span>
                    </div>
                    <div className="w-12 h-px bg-slate-200" />
                    <span className="hover:text-slate-900 transition-colors cursor-pointer">Security Protocol</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: FORM CONTAINER --- */}
            <div className="relative z-10 w-full lg:w-[500px] flex items-center justify-center p-6 lg:p-12 bg-white shadow-[-40px_0_100px_rgba(0,0,0,0.03)] border-l border-slate-100">
                <motion.div
                    style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1200 }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-md bg-white p-10 lg:p-12 rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] relative"
                >
                    {/* Visual Security Sweep */}
                    <motion.div 
                        animate={{ y: [0, 600, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent pointer-events-none"
                    />

                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[2rem] bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 shadow-inner">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter mb-1">Command Access</h2>
                        <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.25em]">Restricted Administrative Port</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Identity</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-orange-500 transition-colors">
                                    <Mail className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-13 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-xs font-black"
                                    placeholder="admin or system.admin@hogicar.net"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Token</label>
                                <button type="button" className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:text-slate-900 transition-colors">Emergency Reset</button>
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
                                    placeholder="••••••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
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
                            className="w-full bg-slate-900 hover:bg-orange-600 text-white font-black py-4 rounded-[1.5rem] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-500 mt-4 group"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-xs uppercase tracking-[0.25em]">Admin Login</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 flex justify-center items-center gap-6 text-slate-300 font-black text-[9px] uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>v4.0.2</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-100" />
                        <div className="flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" />
                            <span>Primary DB Sync</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
