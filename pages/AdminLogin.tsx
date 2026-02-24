
import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Car, Info, LoaderCircle } from 'lucide-react';
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
                } catch(e) {
                    // Ignore if body is not json, use default message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setAdminToken(data.token);
            navigate('/admin');

        } catch (err: any) {
             if (err instanceof TypeError) { // This often indicates a network error
                console.error(`Request to ${loginUrl} failed`, err);
                setError(`Cannot reach backend: ${API_BASE_URL}`);
            } else {
                setError(err.message || "An unknown login error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF9F1C]/10 rounded-full blur-[120px] pointer-events-none"></div>

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
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 mb-4">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                        <p className="text-sm text-slate-400 mt-1">Secure access to system controls</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg text-white py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="admin"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg text-white py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2">
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}
                        
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center disabled:opacity-50 mt-2" disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Authenticate'}
                        </button>
                    </form>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Hogicar Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
