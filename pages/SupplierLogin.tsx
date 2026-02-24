
import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building, Car, LoaderCircle } from 'lucide-react';
import { setSupplierToken } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';
import { supplierApi } from '../api';

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
            const data = await supplierApi.login({ email: email.trim(), password });
            
            if (!data.token) {
                throw new Error('Login successful but no token received.');
            }
            
            setSupplierToken(data.token);
            navigate('/supplier');

        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'An unknown login error occurred.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF9F1C]/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>

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
                {/* Dynamic Logo Area */}
                <div className="flex flex-col items-center mb-10 relative">
                    <Link to="/" className="relative z-10 block hover:opacity-80 transition-opacity" title="Back to Home">
                        <Logo className="h-16 w-auto" variant="light" />
                    </Link>
                    {/* The moving car coming out from behind the logo */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-0 animate-drive flex items-center">
                        <Car className="w-8 h-8 text-[#FF9F1C]" />
                        <div className="w-12 h-0.5 bg-gradient-to-r from-[#FF9F1C]/50 to-transparent ml-1 rounded-full"></div>
                    </div>
                </div>

                {/* Glassmorphism Login Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FF9F1C]/20 border border-[#FF9F1C]/30 mb-4">
                            <Building className="w-6 h-6 text-[#FF9F1C]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Supplier Portal</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage your fleet and bookings</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                disabled={isLoading} 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg text-white py-3 px-4 focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C] outline-none transition-all placeholder:text-slate-600" 
                                placeholder="partner@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                disabled={isLoading} 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg text-white py-3 px-4 focus:ring-2 focus:ring-[#FF9F1C] focus:border-[#FF9F1C] outline-none transition-all placeholder:text-slate-600" 
                                placeholder="••••••••"
                            />
                        </div>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2">
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}
                        <button type="submit" disabled={isLoading} className="w-full bg-[#FF9F1C] hover:bg-[#e88d15] text-white font-bold py-3.5 rounded-lg shadow-[0_0_15px_rgba(255,159,28,0.4)] transition-all flex items-center justify-center disabled:opacity-50 mt-2">
                            {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-white/10 pt-6">
                        <p className="text-sm text-slate-400 mb-2">Not a partner yet?</p>
                        <Link to="/become-supplier" className="text-[#FF9F1C] font-bold hover:text-[#e88d15] transition-colors">Join the Hogicar Network</Link>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Hogicar Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default SupplierLogin;