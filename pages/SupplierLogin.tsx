import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Car } from 'lucide-react';
import { SUPPLIERS } from '../services/mockData';

const SupplierLogin: React.FC = () => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const foundSupplier = SUPPLIERS.find(s => s.username === username && s.password === password);

        if (foundSupplier) {
            // Pass the logged-in supplier's ID to the dashboard
            navigate('/supplier', { state: { supplierId: foundSupplier.id } });
        } else {
            setError('Invalid credentials. Please contact your administrator.');
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
                        <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3" />
                    </div>
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <button type="submit" className="w-full bg-[#003580] hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg shadow-md transition-all">Login</button>
                </form>
            </div>
        </div>
    );
};

export default SupplierLogin;