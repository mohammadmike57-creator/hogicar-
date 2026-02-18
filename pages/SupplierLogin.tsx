
import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building, Car, LoaderCircle } from 'lucide-react';
import { setSupplierToken } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';

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

        const url = `${API_BASE_URL}/api/supplier/auth/login`;
        const body = { email: email.trim(), password };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'omit',
            });
            
            if (!response.ok) {
                let errorMessage = `Login failed (Status: ${response.status}).`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    // ignore and use default message
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            setSupplierToken(data.token);
            navigate('/supplier', { state: { supplierId: data.supplierId } });

        } catch (err: any) {
            if (err instanceof TypeError) { // Network error
                console.error(`Request to ${url} failed`, err);
                setError(`Cannot reach backend: ${API_BASE_URL}`);
            } else {
                setError(err.message || 'An unknown login error occurred.');
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
                    <Building className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-slate-800">Supplier Portal</h1>
                    <p className="text-xs text-slate-500">Login with your provided credentials.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3" />
                    </div>
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-[#003580] hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-50">
                        {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SupplierLogin;