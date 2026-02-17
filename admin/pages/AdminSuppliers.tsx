import * as React from 'react';
import { adminFetch } from '../../lib/adminApi';
import { Plus, Edit, Trash2, LoaderCircle, Power, PowerOff, Shield } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    logoUrl: string | null;
    role: "SUPPLIER" | "ADMIN";
    active: boolean;
}

const AdminSuppliers: React.FC = () => {
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await adminFetch('/api/admin/suppliers');
            setSuppliers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch suppliers.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSuppliers();
    }, []);
    
    const handleToggleActive = async (supplier: Supplier) => {
        if (supplier.role === 'ADMIN') {
            alert('Cannot disable an ADMIN account.');
            return;
        }
        if (!window.confirm(`Are you sure you want to ${supplier.active ? 'disable' : 'enable'} this supplier?`)) {
            return;
        }
        try {
            await adminFetch(`/api/admin/suppliers/${supplier.id}`, {
                method: 'PUT',
                body: JSON.stringify({ active: !supplier.active })
            });
            fetchSuppliers(); // Refresh list
        } catch (err: any) {
             alert(`Failed to update supplier: ${err.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(`Are you sure you want to DELETE supplier #${id}? This action cannot be undone.`)) {
            return;
        }
        try {
            await adminFetch(`/api/admin/suppliers/${id}`, {
                method: 'DELETE'
            });
            fetchSuppliers();
        } catch (err: any) {
             if (err.message && err.message.includes('foreign key constraint')) {
                 alert("Cannot delete supplier because they still have cars. Deactivate the supplier instead, or delete their cars first.");
             } else {
                 alert(`Failed to delete supplier: ${err.message}`);
             }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-slate-800">Suppliers</h1>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5"/> Add Supplier
                </button>
            </div>
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-slate-50">
                        <tr className="text-xs font-semibold text-slate-500">
                            <th className="py-2 px-4 border-b">Name</th>
                            <th className="py-2 px-4 border-b">Contact</th>
                            <th className="py-2 px-4 border-b">Role</th>
                            <th className="py-2 px-4 border-b">Status</th>
                            <th className="py-2 px-4 border-b text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {suppliers.map(s => (
                            <tr key={s.id}>
                                <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                                <td className="py-3 px-4 text-slate-600">{s.email}</td>
                                <td className="py-3 px-4">
                                     <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${s.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {s.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                        {s.role}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {s.active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleToggleActive(s)} 
                                            disabled={s.role === 'ADMIN'}
                                            className="p-2 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                                            title={s.active ? 'Disable' : 'Enable'}
                                        >
                                            {s.active ? <PowerOff className="w-4 h-4 text-orange-600 hover:text-orange-800"/> : <Power className="w-4 h-4 text-green-600 hover:text-green-800"/>}
                                        </button>
                                        <button className="p-2 text-slate-500 hover:bg-slate-200 rounded-md" title="Edit"><Edit className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSuppliers;