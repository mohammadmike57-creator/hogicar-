import React, { useEffect, useState, useMemo } from 'react';
import { 
  ChevronRight, 
  MapPin, 
  Building2, 
  Edit, 
  Search, 
  Globe, 
  ArrowLeft,
  Mail,
  Phone,
  DollarSign,
  Percent,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Save
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';

interface Country {
  name: string;
  code: string;
  supplierCount: number;
  locationCount: number;
  carCount: number;
}

interface Location {
  name: string;
  iataCode: string;
  type: string;
  supplierCount: number;
}

interface SupplierConfig {
  supplierId: number;
  vendorCode: string;
  supplierName: string;
  locationCode: string;
  externalLocationId: string;
  contactEmail: string;
  contactPhone: string;
  markupPercentage: number;
  commissionPercentage: number;
  fixedFee: number;
  currency: string;
  priority: number;
  active: boolean;
  isConfigured: boolean;
  logoUrl: string;
  carCount: number;
}

type ViewMode = 'countries' | 'locations' | 'suppliers';

const ExternalSuppliersPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>('countries');
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [editingSupplier, setEditingSupplier] = useState<SupplierConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/external-suppliers/countries');
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (countryCode: string) => {
    setLoading(true);
    try {
      const data = await adminFetch(`/api/admin/external-suppliers/countries/${countryCode}/locations`);
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async (locationCode: string) => {
    setLoading(true);
    try {
      const data = await adminFetch(`/api/admin/external-suppliers/locations/${locationCode}/suppliers`);
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
    fetchLocations(country.code);
    setView('locations');
    setSearchTerm('');
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    fetchSuppliers(location.iataCode);
    setView('suppliers');
    setSearchTerm('');
  };

  const handleBack = () => {
    if (view === 'suppliers') {
      setView('locations');
      setSelectedLocation(null);
    } else if (view === 'locations') {
      setView('countries');
      setSelectedCountry(null);
    }
    setSearchTerm('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !selectedLocation) return;

    setIsSaving(true);
    try {
      await adminFetch(`/api/admin/external-suppliers/locations/${selectedLocation.iataCode}/suppliers/${editingSupplier.supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(editingSupplier)
      });
      // Refresh current list
      await fetchSuppliers(selectedLocation.iataCode);
      setEditingSupplier(null);
    } catch (error) {
      alert('Failed to save configuration: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (view === 'countries') {
      return countries.filter(c => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term));
    } else if (view === 'locations') {
      return locations.filter(l => l.name.toLowerCase().includes(term) || l.iataCode.toLowerCase().includes(term));
    } else {
      return suppliers.filter(s => s.supplierName.toLowerCase().includes(term) || s.vendorCode.toLowerCase().includes(term));
    }
  }, [view, countries, locations, suppliers, searchTerm]);

  if (loading && view === 'countries') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 min-h-[600px]">
      {/* Header & Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <button 
            onClick={() => { setView('countries'); setSelectedCountry(null); setSelectedLocation(null); }}
            className="hover:text-accent transition-colors"
          >
            Countries
          </button>
          {selectedCountry && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button 
                onClick={() => { setView('locations'); setSelectedLocation(null); }}
                className="hover:text-accent transition-colors"
              >
                {selectedCountry.name}
              </button>
            </>
          )}
          {selectedLocation && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-slate-900">{selectedLocation.name}</span>
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {view !== 'countries' && (
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {view === 'countries' && 'External API Suppliers'}
                {view === 'locations' && `Locations in ${selectedCountry?.name}`}
                {view === 'suppliers' && `Suppliers in ${selectedLocation?.name}`}
              </h1>
            </div>
            <p className="text-slate-500 mt-1">
              {view === 'countries' && 'Manage car-rental API suppliers globally'}
              {view === 'locations' && `Discovered locations for ${selectedCountry?.name}`}
              {view === 'suppliers' && `Manage supplier settings for ${selectedLocation?.name}, ${selectedCountry?.name}`}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${view}...`} 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* Main Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {view === 'countries' && filteredItems.map((country: Country) => (
              <div 
                key={country.code} 
                onClick={() => handleCountryClick(country)}
                className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-accent hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-accent/10 transition-colors">
                    <Globe className="w-6 h-6 text-slate-600 group-hover:text-accent" />
                  </div>
                  <span className="text-2xl">{country.code.split('').map((char: string) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('')}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{country.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm">
                    <span className="block text-slate-400">Suppliers</span>
                    <span className="font-medium text-slate-700">{country.supplierCount}</span>
                  </div>
                  <div className="text-sm">
                    <span className="block text-slate-400">Locations</span>
                    <span className="font-medium text-slate-700">{country.locationCount}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-sm text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Locations <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}

            {view === 'locations' && filteredItems.map((location: Location) => (
              <div 
                key={location.iataCode} 
                onClick={() => handleLocationClick(location)}
                className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-accent hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-accent/10 transition-colors">
                    <MapPin className="w-5 h-5 text-slate-600 group-hover:text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{location.name}</h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{location.iataCode}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{location.type}</span>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {location.supplierCount} Suppliers
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suppliers List View (Table) */}
          {view === 'suppliers' && (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-slate-400 text-sm">
                    <th className="pb-4 pl-4 font-medium">Supplier</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 font-medium">Configuration</th>
                    <th className="pb-4 font-medium text-center">Cars</th>
                    <th className="pb-4 font-medium">Markup / Comm.</th>
                    <th className="pb-4 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((supplier: SupplierConfig) => (
                    <tr key={supplier.supplierId} className="bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                      <td className="py-4 pl-4 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          {supplier.logoUrl ? (
                            <img src={supplier.logoUrl} alt={supplier.supplierName} className="w-10 h-6 object-contain bg-white rounded border border-slate-100 p-0.5" />
                          ) : (
                            <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">NO LOGO</div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{supplier.supplierName}</div>
                            <div className="text-xs text-slate-400 font-mono">{supplier.vendorCode}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {supplier.active ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Available
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Unavailable
                          </div>
                        )}
                      </td>
                      <td>
                        {supplier.isConfigured ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            Configured
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            Not Configured
                          </span>
                        )}
                      </td>
                      <td className="text-center font-medium text-slate-700">
                        {supplier.carCount > 0 ? supplier.carCount : '—'}
                      </td>
                      <td>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1 text-slate-600">
                            <TrendingUp className="w-3 h-3 text-slate-400" />
                            {supplier.markupPercentage}% Markup
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            {supplier.commissionPercentage}% Comm.
                          </div>
                        </div>
                      </td>
                      <td className="pr-4 rounded-r-xl text-right">
                        <button 
                          onClick={() => setEditingSupplier(supplier)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="text-center py-20 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                  <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-slate-500 font-medium">No suppliers found for this location</h3>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your search or contact support if this is unexpected.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Supplier Configuration</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <span className="font-semibold text-accent">{editingSupplier.supplierName}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{selectedLocation?.name}, {selectedCountry?.name}</span>
                </div>
              </div>
              <button onClick={() => setEditingSupplier(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Contact Email</span>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        value={editingSupplier.contactEmail || ''}
                        onChange={(e) => setEditingSupplier({...editingSupplier, contactEmail: e.target.value})}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Contact Phone</span>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        value={editingSupplier.contactPhone || ''}
                        onChange={(e) => setEditingSupplier({...editingSupplier, contactPhone: e.target.value})}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Markup (%)</span>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number" step="0.01"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        value={editingSupplier.markupPercentage || 0}
                        onChange={(e) => setEditingSupplier({...editingSupplier, markupPercentage: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Commission (%)</span>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number" step="0.01"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        value={editingSupplier.commissionPercentage || 0}
                        onChange={(e) => setEditingSupplier({...editingSupplier, commissionPercentage: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Fixed Fee</span>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number" step="0.01"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                          value={editingSupplier.fixedFee || 0}
                          onChange={(e) => setEditingSupplier({...editingSupplier, fixedFee: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Currency</span>
                      <select 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                        value={editingSupplier.currency || 'USD'}
                        onChange={(e) => setEditingSupplier({...editingSupplier, currency: e.target.value})}
                      >
                        <option value="USD">USD</option>
                        <option value="JOD">JOD</option>
                        <option value="AED">AED</option>
                        <option value="SAR">SAR</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Priority</span>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                      value={editingSupplier.priority || 0}
                      onChange={(e) => setEditingSupplier({...editingSupplier, priority: parseInt(e.target.value) || 0})}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingSupplier.active}
                      onChange={(e) => setEditingSupplier({...editingSupplier, active: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Active for this location</span>
                </label>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingSupplier(null)}
                    className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-2 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalSuppliersPage;
