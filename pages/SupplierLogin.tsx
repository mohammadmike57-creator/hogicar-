import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building, Car, LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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

            // Try to get the raw text first, then attempt to parse JSON
            const rawText = await response.text();
            console.log('Raw response:', rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (jsonError) {
                // If not JSON, use the raw text as the message
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
            console.error('Login error:', err);
            setError(err.message || 'An unknown login error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background animations (unchanged) */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF9F1C]/15 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"
            />

            <style>
                {`
                    @keyframes driveCar {
                        0% { transform: translateX(-40px) scale(0.8); opacity: 0; }
                        15% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { transform: translateX(180px) scale(0.8); opacity: 0; }
                    }
                    .animate-drive {
                        animation: driveCar 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }
                `}
            </style>

            <div className="w-full max-w-md relative z-10">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center mb-8 relative"
                >
                    <Link to="/" className="relative z-10 block hover:opacity-80 transition-all transform hover:scale-105" title="Back to Home">
                        <Logo className="h-20 w-auto" variant="light" />
                    </Link>
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl shadow-black/50"
                >
                    <div className="text-center mb-10">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-600/20 border border-orange-500/30 mb-6 shadow-lg shadow-orange-200/10"
                        >
                            <Building className="w-8 h-8 text-orange-500" />
                        </motion.div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Supplier Portal</h1>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Manage your global fleet</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    disabled={isLoading} 
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl text-white py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-sm" 
                                    placeholder="partner@hogicar.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Password</label>
                                <button type="button" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    disabled={isLoading} 
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl text-white py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-sm" 
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center disabled:opacity-50 mt-4 uppercase tracking-widest text-xs"
                        >
                            {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Secure Authorization'}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-8">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">New to the network?</p>
                        <Link to="/become-supplier" className="text-orange-500 font-black text-sm hover:text-orange-400 transition-all">Apply for Partnership <ChevronRight className="inline w-4 h-4 mb-0.5" /></Link>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center"
                >
                    <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Hogicar Inc. All rights reserved.</p>
                </motion.div>
            </div>
        </div>
    );
};

export default SupplierLogin;
