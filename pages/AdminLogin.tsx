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
    const bgX = useTransform(springX, [0, window.innerWidth], [30, -30]);
    const bgY = useTransform(springY, [0, window.innerHeight], [30, -30]);

    // Transform for card 3D tilt
    const cardRotateX = useTransform(springY, [0, window.innerHeight], [10, -10]);
    const cardRotateY = useTransform(springX, [0, window.innerWidth], [-10, 10]);

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
            className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200"
        >
            {/* --- HYPER-PROFESSIONAL BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Mesh Gradients */}
                <motion.div 
                    style={{ x: bgX, y: bgY }}
                    animate={{ 
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[160px]"
                />
                <motion.div 
                    style={{ x: useTransform(springX, [0, window.innerWidth], [-40, 40]), y: useTransform(springY, [0, window.innerHeight], [-40, 40]) }}
                    animate={{ 
                        opacity: [0.1, 0.15, 0.1],
                        scale: [1.1, 1, 1.1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                    className="absolute -bottom-[20%] -left-[10%] w-[80%] h-[80%] bg-indigo-600/15 rounded-full blur-[180px]"
                />
                
                {/* Grid & Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-[0.05]" />
                <div className="absolute inset-0 opacity-[0.03]" 
                    style={{ 
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)`,
                        backgroundSize: '30px 30px'
                    }} 
                />
            </div>

            <motion.div 
                style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-[#0a0d17]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden relative z-10"
            >
                {/* Left Side: System Metadata & Branding */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-10 right-10 flex flex-col items-end gap-2 font-mono text-[10px] text-blue-500">
                            <span>SYS_AUTH_READY: 1</span>
                            <span>ENCRYPTION: AES-256</span>
                            <span>NODE_VER: 20.11.0</span>
                        </div>
                    </div>

                    <div className="relative">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Logo className="h-12 w-auto mb-16" variant="light" />
                        </motion.div>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8">
                                <Cpu className="w-3 h-3 animate-pulse" />
                                CORE INFRASTRUCTURE V9.2
                            </div>
                            <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-8">
                                Centralized <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">Control Unit.</span>
                            </h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
                                Authorized access to global fleet logistics, real-time transaction monitoring, and multi-tenant security layers.
                            </p>
                        </motion.div>
                    </div>

                    <div className="space-y-6 relative">
                        {[
                            { icon: ShieldCheck, text: "Advanced Biometric Hash Verification" },
                            { icon: Database, text: "Neural Data Persistence Layer" },
                            { icon: Key, text: "Zero-Knowledge Session Logic" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.9 + i * 0.1 }}
                                className="flex items-center gap-4 text-slate-300 group cursor-default"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Authentication Form */}
                <div className="p-8 lg:p-20 flex flex-col justify-center relative overflow-hidden bg-white/[0.01]">
                    {/* Background Decorative Element */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
                    
                    <div className="mb-12 lg:hidden text-center">
                        <Logo className="h-10 w-auto inline-block mb-10" variant="light" />
                    </div>

                    <div className="mb-12 relative">
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 text-blue-500 mb-10 relative group"
                        >
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Shield className="w-10 h-10 relative z-10" />
                        </motion.div>
                        <h2 className="text-4xl font-black text-white tracking-tight mb-3">Internal Access</h2>
                        <p className="text-slate-400 font-medium text-lg tracking-wide">Identity verification required</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8 relative">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Admin Identifier</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within/input:text-blue-500 text-slate-700 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-300 font-bold"
                                    placeholder="admin_uid"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Access Credential</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within/input:text-blue-500 text-slate-700 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-300 font-bold"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, x: 10, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/40 p-5 rounded-2xl flex items-center gap-4"
                                >
                                    <Fingerprint className="w-6 h-6 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-sm font-bold leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2, shadow: "0 20px 40px -10px rgba(37, 99, 235, 0.4)" }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-900/30 flex items-center justify-center gap-4 disabled:opacity-50 transition-all duration-300 mt-6"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-7 h-7 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg uppercase tracking-[0.2em]">Authorize Access</span>
                                    <Activity className="w-6 h-6" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center gap-3 text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Secure Node Connection Active
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- SYSTEM DECORATIONS --- */}
            <div className="absolute top-[10%] left-[5%] w-px h-64 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-px h-64 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent pointer-events-none" />
            
            <div className="absolute top-[20%] right-[20%] pointer-events-none h-24 w-24 opacity-10">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full border-[10px] border-dotted border-blue-500 rounded-full"
                />
            </div>
        </div>
    );
};

export default AdminLogin;
