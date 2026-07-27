import React, { useEffect, useState } from 'react';
import { 
  Building, 
  Edit, 
  Trash2, 
  Plus, 
  Mail, 
  Globe, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Car, 
  X,
  ChevronRight,
  Info,
  Ban,
  Star
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';

interface ExternalSupplier {
  id?: number;
  vendorCode: string;
  name: string;
  markupPercent: number;
  depositSettings: string;
  carDepositOverrides: string;
  contactEmail: string;
  logoUrl: string;
  active?: boolean;
  excludedCarModels?: string;
  rating?: number;
  reviewCount?: number;
}

const API_PATH = '/api/admin/external-suppliers';

const DEFAULT_DEPOSITS = {
  MINI: 350,
  ECONOMY: 350,
  COMPACT: 350,
  MIDSIZE: 500,
  FULLSIZE: 750,
  SUV: 1000,
  CROSSOVER: 500,
  VAN: 1000
};

const ExternalSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ExternalSupplier[]>([]);
  const [form, setForm] = useState<ExternalSupplier>({
    vendorCode: '',
    name: '',
    markupPercent: 0,
    depositSettings: JSON.stringify(DEFAULT_DEPOSITS),
    carDepositOverrides: '{}',
    contactEmail: '',
    logoUrl: '',
    active: true,
    excludedCarModels: '',
    rating: undefined,
    reviewCount: undefined
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [overrideKey, setOverrideKey] = useState('');
  const [overrideValue, setOverrideValue] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const data = await adminFetch(API_PATH);
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminFetch(`${API_PATH}/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await adminFetch(API_PATH, {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      fetchSuppliers();
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const resetForm = () => {
    setForm({ 
      vendorCode: '', 
      name: '', 
      markupPercent: 0, 
      depositSettings: JSON.stringify(DEFAULT_DEPOSITS), 
      carDepositOverrides: '{}', 
      contactEmail: '',
      logoUrl: '',
      active: true,
      excludedCarModels: '',
      rating: undefined,
      reviewCount: undefined
    });
    setEditingId(null);
  };

  const handleEdit = (s: ExternalSupplier) => {
    setForm(s);
    setEditingId(s.id || null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this external supplier? This action cannot be undone.')) {
      try {
        await adminFetch(`${API_PATH}/${id}`, { method: 'DELETE' });
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const updateDeposit = (category: string, value: number) => {
    try {
      const settings = JSON.parse(form.depositSettings || '{}');
      settings[category] = value;
      setForm({ ...form, depositSettings: JSON.stringify(settings) });
    } catch (e) { /* ignore */ }
  };

  const getDeposit = (category: string): number => {
    try {
      const settings = JSON.parse(form.depositSettings || '{}');
      return settings[category] !== undefined ? settings[category] : (DEFAULT_DEPOSITS as any)[category] || 0;
    } catch (e) {
      return (DEFAULT_DEPOSITS as any)[category] || 0;
    }
  };

  const addOverride = () => {
    if (!overrideKey.trim()) return;
    try {
      const overrides = JSON.parse(form.carDepositOverrides || '{}');
      overrides[overrideKey.trim()] = parseFloat(overrideValue) || 0;
      setForm({ ...form, carDepositOverrides: JSON.stringify(overrides) });
      setOverrideKey('');
      setOverrideValue('');
    } catch (e) { alert('Invalid numeric value'); }
  };

  const removeOverride = (key: string) => {
    try {
      const overrides = JSON.parse(form.carDepositOverrides || '{}');
      delete overrides[key];
      setForm({ ...form, carDepositOverrides: JSON.stringify(overrides) });
    } catch (e) { /* ignore */ }
  };

  const getOverrides = (): Record<string, number> => {
    try {
      return JSON.parse(form.carDepositOverrides || '{}');
    } catch (e) { return {}; }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-8 h-8 text-blue-600" />
            External API Suppliers
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage third-party car rental providers and their pricing rules.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isFormOpen ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Close Editor' : 'Add New Supplier'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5" />
              {editingId ? 'Edit Supplier Configuration' : 'New Supplier Setup'}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3 h-3" /> Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code</label>
                    <input 
                      placeholder="e.g., ZD, AL, ET" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={form.vendorCode} 
                      onChange={e => setForm({...form, vendorCode: e.target.value.toUpperCase().trim()})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                    <input 
                      placeholder="e.g., Budget, Alamo" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="email" 
                        placeholder="support@supplier.com" 
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={form.contactEmail} 
                        onChange={e => setForm({...form, contactEmail: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Branding */}
              <div className="space-y-4 border-l pl-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Pricing & Branding
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Markup Percentage (%)</label>
                    <div className="relative">
                      <Percent className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={form.markupPercent} 
                        onChange={e => setForm({...form, markupPercent: parseFloat(e.target.value)})} 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input 
                      placeholder="https://..." 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.logoUrl} 
                      onChange={e => setForm({...form, logoUrl: e.target.value})} 
                    />
                  </div>
                  {form.logoUrl && (
                    <div className="p-2 border rounded-lg inline-block">
                      <img src={form.logoUrl} alt="Preview" className="h-8 object-contain" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/100x40?text=Invalid+Logo")} />
                    </div>
                  )}
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
                    <span className="text-sm font-medium text-gray-700">Show this supplier in search</span>
                    <input
                      type="checkbox"
                      checked={form.active !== false}
                      onChange={e => setForm({...form, active: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Advanced Settings Link/Info */}
              <div className="bg-blue-50 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Configuration Tips
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                    <li>Vendor code must match the API response.</li>
                    <li>Markup applies to the net price fetched.</li>
                    <li>Deposits are shown to users in search results.</li>
                    <li>Excluded models are hidden immediately from customer search.</li>
                  </ul>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Save Changes' : 'Initialize Supplier'}
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Deposit Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Deposit Settings by Category
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl">
                  {Object.keys(DEFAULT_DEPOSITS).map(cat => (
                    <div key={cat} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{cat}</label>
                      <input 
                        type="number" 
                        className="w-full px-2 py-1.5 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        value={getDeposit(cat)} 
                        onChange={e => updateDeposit(cat, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overrides Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Car className="w-3 h-3" /> Specific Car Model Overrides
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      placeholder="e.g., Toyota Camry" 
                      className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
                      value={overrideKey} 
                      onChange={e => setOverrideKey(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Deposit $" 
                      className="w-24 px-3 py-2 border rounded-lg text-sm outline-none"
                      value={overrideValue} 
                      onChange={e => setOverrideValue(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={addOverride}
                      className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {Object.entries(getOverrides()).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No specific car overrides added.</p>
                    ) : (
                      Object.entries(getOverrides()).map(([model, deposit]) => (
                        <div key={model} className="bg-white border px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm">
                          <span className="text-gray-900">{model}</span>
                          <span className="text-blue-600 font-bold">${deposit}</span>
                          <button type="button" onClick={() => removeOverride(model)} className="text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3" /> Manual Rating
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="e.g., 8.7"
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      value={form.rating ?? ''}
                      onChange={e => setForm({...form, rating: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Review Count</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Reviews"
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      value={form.reviewCount ?? ''}
                      onChange={e => setForm({...form, reviewCount: e.target.value === '' ? undefined : parseInt(e.target.value, 10)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Hidden Car Models
                </h4>
                <textarea
                  placeholder={'One model per line, e.g.:\nToyota Camry'}
                  className="min-h-[110px] w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.excludedCarModels || ''}
                  onChange={e => setForm({...form, excludedCarModels: e.target.value})}
                />
                <p className="text-xs text-gray-400">Exact model names listed here will not appear in customer search results for this supplier.</p>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Markup</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rules</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Building className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    No external suppliers configured yet.
                  </td>
                </tr>
              ) : (
                suppliers.map(s => {
                  let overrideCount = 0;
                  const excludedCount = (s.excludedCarModels || '')
                    .split(/[,;\n\r]+/)
                    .map(item => item.trim())
                    .filter(Boolean)
                    .length;
                  try { overrideCount = Object.keys(JSON.parse(s.carDepositOverrides || '{}')).length; } catch(e) {}
                  
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Building className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold text-gray-900">{s.name}</div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.active === false ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {s.active === false ? 'Hidden' : 'Live'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs font-mono text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                                {s.vendorCode}
                              </span>
                              {s.rating !== undefined && s.rating !== null && (
                                <span className="text-xs font-bold text-amber-700 px-1.5 py-0.5 bg-amber-50 rounded">
                                  {s.rating.toFixed(1)} rating
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-blue-600 font-bold">
                          <Plus className="w-3 h-3 mr-0.5" />
                          {s.markupPercent}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <ShieldCheck className="w-3 h-3 text-green-500" /> Standard Deposits
                          </div>
                          {overrideCount > 0 && (
                            <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                              <Car className="w-3 h-3" /> {overrideCount} Car Overrides
                            </div>
                          )}
                          {excludedCount > 0 && (
                            <div className="flex items-center gap-1.5 text-red-600 font-medium">
                              <Ban className="w-3 h-3" /> {excludedCount} Hidden Models
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {s.contactEmail}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleEdit(s)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => s.id && handleDelete(s.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExternalSuppliersPage;
