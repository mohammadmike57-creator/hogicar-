import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building, Car, LoaderCircle, Mail, Lock, ChevronRight, ArrowRight, ShieldCheck, Globe, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';

const SupplierLogin: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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
        <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-200">
            {/* --- MOVING BACKGROUND ELEMENTS --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Mesh Gradient 1 */}
                <motion.div 
                    animate={{ 
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[140px]"
                />
                {/* Mesh Gradient 2 */}
                <motion.div 
                    animate={{ 
                        x: [0, -80, 0],
                        y: [0, 60, 0],
                        scale: [1, 1.3, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[160px]"
                />
                {/* Moving Particles/Lines */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-px h-64 bg-gradient-to-b from-transparent via-orange-500/50 to-transparent blur-sm animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/3 w-px h-48 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent blur-sm animate-pulse delay-700" />
                </div>
            </div>

            {/* --- LEFT SIDE: THE CONTENT & BRANDING --- */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-8 lg:p-16">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Link to="/" className="inline-block group">
                        <Logo className="h-12 w-auto" variant="light" />
                    </Link>
                </motion.div>

                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-8">
                            Partner Portal <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500">
                                Global Fleet Control
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg mb-12">
                            Manage your car rental business with the world's most professional dashboard. 
                            Scale your operations, track real-time bookings, and optimize your fleet performance.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Globe, title: "Global Reach", desc: "Access millions of customers worldwide." },
                            { icon: Zap, title: "Real-time", desc: "Instant sync with our booking engine." },
                            { icon: ShieldCheck, title: "Secure", desc: "Enterprise-grade security for your data." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                                className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl group hover:border-orange-500/50 transition-colors"
                            >
                                <feature.icon className="w-6 h-6 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="text-white font-bold text-sm mb-1">{feature.title}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-slate-600 text-sm font-medium"
                >
                    &copy; {new Date().getFullYear()} Hogicar Partnership Network. All rights reserved.
                </motion.div>
            </div>

            {/* --- RIGHT SIDE: THE LOGIN FORM --- */}
            <div className="relative z-10 w-full lg:w-[500px] flex items-center justify-center p-4 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
                    className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-10 lg:p-12 rounded-[2.5rem] shadow-2xl relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-[2.5rem] blur-xl opacity-50 -z-10" />

                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-600/20 border border-orange-500/30 text-orange-500 mb-6 group hover:scale-110 transition-transform cursor-pointer">
                            <Building className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-slate-400 font-medium">Log in to your partner dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-slate-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium"
                                    placeholder="partner@company.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                <button type="button" className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:underline underline-offset-4">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-slate-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <p className="text-red-400 text-sm font-bold leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3 disabled:opacity-50 group transition-all mt-4"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Access Dashboard</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-white/5 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            Not a partner yet?{' '}
                            <Link to="/become-supplier" className="text-orange-500 font-bold hover:underline underline-offset-4">
                                Join the Network
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
            
            {/* --- MOVING CAR ELEMENT --- */}
            <div className="absolute bottom-10 left-0 w-full overflow-hidden pointer-events-none h-16 flex items-center">
                <motion.div
                    animate={{ x: ["-10%", "110%"] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-4 opacity-10"
                >
                    <Car className="w-12 h-12 text-white" />
                    <div className="h-0.5 w-64 bg-gradient-to-r from-white to-transparent" />
                </motion.div>
            </div>
        </div>
    );
};

export default SupplierLogin;
