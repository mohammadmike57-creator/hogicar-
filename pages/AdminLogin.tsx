import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Car, LoaderCircle, User, Lock, ArrowRight, ShieldCheck, Database, Key, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* --- MOVING BACKGROUND ELEMENTS --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        x: [0, -100, 0],
                        y: [0, 80, 0],
                        scale: [1, 1.4, 1]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[140px]"
                />
                <motion.div 
                    animate={{ 
                        x: [0, 120, 0],
                        y: [0, -60, 0],
                        scale: [1, 1.3, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
                    className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px]"
                />
                
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
                {/* Left Side: Info & Brand */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600/20 to-transparent border-r border-white/5">
                    <div>
                        <Logo className="h-10 w-auto mb-12" variant="light" />
                        <h1 className="text-4xl font-black text-white leading-tight mb-6">
                            Secure <br />
                            <span className="text-blue-500 text-5xl">System Core</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-xs">
                            Authorized access only. Monitor global operations, manage fleet integrity, and oversee financial performance.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: ShieldCheck, text: "Multi-factor Authentication" },
                            { icon: Database, text: "Real-time Data Sync" },
                            { icon: Key, text: "Encrypted Session Control" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300">
                                <item.icon className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-bold tracking-wide">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-8 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10 lg:hidden text-center">
                        <Logo className="h-10 w-auto inline-block mb-6" variant="light" />
                    </div>

                    <div className="mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-500 mb-6">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Internal Access</h2>
                        <p className="text-slate-400 font-medium">Please verify your credentials</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 text-slate-600 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="admin_id"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 text-slate-600 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-xs font-bold leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 disabled:opacity-50 transition-all mt-4"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Authenticate</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p className="mt-8 text-center text-slate-600 text-xs font-medium">
                        System authorized for Hogicar Inc. personnel only.
                    </p>
                </div>
            </div>

            {/* --- MOVING CAR ELEMENT --- */}
            <div className="absolute top-[15%] left-0 w-full overflow-hidden pointer-events-none h-px opacity-20">
                <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                />
            </div>
            <div className="absolute bottom-[15%] left-0 w-full overflow-hidden pointer-events-none h-px opacity-20">
                <motion.div
                    animate={{ x: ["100%", "-100%"] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                />
            </div>
        </div>
    );
};

export default AdminLogin;
