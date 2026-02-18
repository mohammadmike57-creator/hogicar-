
import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Car, Info, LoaderCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';
import { setAdminToken } from '../lib/adminApi';

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
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
             <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity" title="Back to Home">
                <div className="relative">
                    <Car className="h-8 w-8 text-[#003580]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF9F1C] rounded-full border-2 border-slate-100"></div>
                </div>
                <span className="font-bold text-2xl tracking-tight text-slate-900">
                    <span className="text-[#003580]">Hogi</span>
                    <span className="text-[#FF9F1C]">car</span>
                </span>
            </Link>
            <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <div className="text-center mb-6">
                    <Shield className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-slate-800">Admin Portal</h1>
                    <p className="text-xs text-slate-500">Master login required.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3" 
                            placeholder="admin"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3" 
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded">{error}</p>}
                    
                    <button type="submit" className="w-full bg-[#003580] hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-50" disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Login'}
                    </button>
                </form>

                {/* Demo Hint */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                        <p className="font-bold mb-1">Demo Credentials:</p>
                        <p>Username: <span className="font-mono bg-blue-100 px-1 rounded select-all">admin</span></p>
                        <p>Password: <span className="font-mono bg-blue-100 px-1 rounded select-all">password123</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;