import React, { useEffect, useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown,
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
  Save,
  RefreshCw
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
  visible: boolean;
  isConfigured: boolean;
  logoUrl: string;
  carCount: number;
  carDeposit?: number;
  lastDiscoveredAt?: string;
}

interface SupplierSearchResponse {
  totalSuppliers?: number;
  totalCars?: number;
  suppliers?: SupplierConfig[];
}

type ViewMode = 'countries' | 'locations' | 'suppliers';

const normalizeSearchText = (value: unknown) =>
  typeof value === 'string' ? value.toLowerCase() : '';

const extractSupplierList = (value: unknown): SupplierConfig[] => {
  if (Array.isArray(value)) {
    return value as SupplierConfig[];
  }
  const response = value as SupplierSearchResponse;
  return Array.isArray(response?.suppliers) ? response.suppliers : [];
};

const ExternalSuppliersPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>('countries');
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Location selector state
  const [countryCode, setCountryCode] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<{count: number, cars: number} | null>(null);
  
  // Modal state
  const [editingSupplier, setEditingSupplier] = useState<SupplierConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingSupplierId, setUpdatingSupplierId] = useState<number | null>(null);

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


  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
    fetchLocations(country.code);
    setView('locations');
    setSearchTerm('');
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setLocationSearch(location.name);
    triggerSuppliersSearch(location.iataCode);
  };

  const triggerSuppliersSearch = async (locationCode: string) => {
    setIsSearching(true);
    setLoading(true);
    try {
      const data = await adminFetch(`/api/admin/external-suppliers/search?locationCode=${locationCode}`);
      const supplierList = extractSupplierList(data);
      const response = data as SupplierSearchResponse;
      setSuppliers(supplierList);
      const totalCars = typeof response?.totalCars === 'number'
        ? response.totalCars
        : supplierList.reduce((acc: number, s: SupplierConfig) => acc + (s.carCount || 0), 0);
      const totalSuppliers = typeof response?.totalSuppliers === 'number'
        ? response.totalSuppliers
        : supplierList.length;
      setLastSyncInfo({ count: totalSuppliers, cars: totalCars });
      setView('suppliers');
    } catch (error) {
      console.error('Failed to perform supplier search', error);
      alert('Failed to perform search: ' + error);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const performSearch = () => {
    if (selectedLocation) {
      triggerSuppliersSearch(selectedLocation.iataCode);
    }
  };

  const handleBack = () => {
    if (view === 'suppliers') {
      setView('locations');
      // Keep selectedLocation for the search card
    } else if (view === 'locations') {
      setView('countries');
      setSelectedCountry(null);
    }
    setSearchTerm('');
  };

  const handleSync = async () => {
    if (!confirm('This will perform a real-time car availability search for all locations to discover suppliers. This may take a few minutes. Continue?')) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await adminFetch('/api/admin/external-suppliers/sync', { method: 'POST' });
      alert(`Sync complete!\nLocations processed: ${result.locationsProcessed}\nRelationships created: ${result.relationshipsCreated}\nUpdated: ${result.relationshipsUpdated}`);
      fetchCountries();
    } catch (error) {
      alert('Sync failed: ' + error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLocationSearch = async (val: string) => {
    setLocationSearch(val);
    if (!val || val.length < 2 || !countryCode) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const allLocs = await adminFetch(`/api/admin/external-suppliers/countries/${countryCode}/locations`);
      const filtered = allLocs.filter((l: Location) => 
        normalizeSearchText(l.name).includes(normalizeSearchText(val)) ||
        normalizeSearchText(l.iataCode).includes(normalizeSearchText(val))
      );
      setLocationSuggestions(filtered);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to search locations', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !selectedLocation) return;

    setIsSaving(true);
    try {
      const savedDto = await adminFetch(`/api/admin/external-suppliers/locations/${selectedLocation.iataCode}/suppliers/${editingSupplier.supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(editingSupplier)
      });
      
      // Update local state with the saved data
      setSuppliers(prev => prev.map(s => s.supplierId === savedDto.supplierId ? savedDto : s));
      setEditingSupplier(null);
    } catch (error) {
      alert('Failed to save configuration: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = normalizeSearchText(searchTerm);
    if (view === 'countries') {
      return countries.filter(c => 
        normalizeSearchText(c.name).includes(term) ||
        normalizeSearchText(c.code).includes(term)
      );
    } else if (view === 'locations') {
      return locations.filter(l => 
        normalizeSearchText(l.name).includes(term) ||
        normalizeSearchText(l.iataCode).includes(term)
      );
    } else {
      return suppliers.filter(s => 
        normalizeSearchText(s.supplierName).includes(term) ||
        normalizeSearchText(s.vendorCode).includes(term)
      );
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
                {view === 'locations' && `Locations in ${selectedCountry?.name || selectedCountry?.code || 'Country'}`}
                {view === 'suppliers' && `Suppliers in ${selectedLocation?.name || selectedLocation?.iataCode || 'Location'}`}
              </h1>
            </div>
            <p className="text-slate-500 mt-1">
              {view === 'countries' && 'Manage car-rental API suppliers globally'}
              {view === 'locations' && `Discovered locations for ${selectedCountry?.name}`}
              {view === 'suppliers' && `Manage supplier settings for ${selectedLocation?.name}, ${selectedCountry?.name}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {view === 'suppliers' && suppliers.length > 0 && (
              <div className="text-right mr-4 hidden md:block">
                <div className="text-sm font-bold text-slate-700">{lastSyncInfo?.count ?? suppliers.length} suppliers · {lastSyncInfo?.cars ?? suppliers.reduce((acc, s) => acc + (s.carCount || 0), 0)} cars</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tighter">
                  Last checked: {suppliers[0]?.lastDiscoveredAt ? new Date(suppliers[0].lastDiscoveredAt).toLocaleString() : 'Never'}
                </div>
              </div>
            )}
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Catalog'}
            </button>
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
      </div>

      {/* Location Selector Card */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Country</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none appearance-none"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  const c = countries.find(c => c.code === e.target.value);
                  if (c) {
                    setSelectedCountry(c);
                    fetchLocations(e.target.value);
                    setView('locations');
                  }
                  setLocationSearch('');
                  setSelectedLocation(null);
                  setSuppliers([]);
                }}
              >
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-[2] space-y-2 relative">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pickup Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search city, airport or location..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
                value={selectedLocation ? selectedLocation.name : locationSearch}
                onChange={(e) => handleLocationSearch(e.target.value)}
                onFocus={() => { if (locationSearch.length >= 2) setShowSuggestions(true); }}
              />
              {selectedLocation && (
                <button 
                  onClick={() => { setSelectedLocation(null); setLocationSearch(''); setSuppliers([]); setView('locations'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {locationSuggestions.map((loc) => (
                  <button
                    key={loc.iataCode}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setShowSuggestions(false);
                      setLocationSearch(loc.name);
                    }}
                  >
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{loc.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{loc.iataCode} • {loc.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={performSearch}
            disabled={!selectedLocation || isSearching}
            className="px-8 py-2.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-accent/20 h-[42px]"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search Suppliers
          </button>
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
            {view === 'countries' && filteredItems.map((country: Country, index: number) => (
              <div 
                key={country.code || index} 
                onClick={() => handleCountryClick(country)}
                className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-accent hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-accent/10 transition-colors">
                    <Globe className="w-6 h-6 text-slate-600 group-hover:text-accent" />
                  </div>
                  <span className="text-2xl">{(country.code || '').split('').map((char: string) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('')}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{country.name}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm">
                    <span className="block text-slate-400">Suppliers</span>
                    <span className="font-medium text-slate-700">{country.supplierCount}</span>
                  </div>
                  <div className="text-sm">
                    <span className="block text-slate-400">Loc.</span>
                    <span className="font-medium text-slate-700">{country.locationCount}</span>
                  </div>
                  <div className="text-sm">
                    <span className="block text-slate-400">Cars</span>
                    <span className="font-medium text-slate-700">{country.carCount > 1000 ? `${(country.carCount/1000).toFixed(1)}k` : country.carCount}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-sm text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Locations <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}

            {view === 'locations' && filteredItems.map((location: Location, index: number) => (
              <div 
                key={location.iataCode || index} 
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
                    <th className="pb-4 font-medium text-center">Deposit</th>
                    <th className="pb-4 font-medium">Markup / Comm.</th>
                    <th className="pb-4 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((supplier: SupplierConfig, index: number) => (
                    <tr key={supplier.supplierId || index} className="bg-slate-50/50 hover:bg-slate-50 transition-colors group">
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
                        <div className="space-y-1">
                          {supplier.active ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Available
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Unavailable
                            </div>
                          )}
                          {supplier.visible !== false ? (
                            <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Visible
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Hidden
                            </div>
                          )}
                        </div>
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
                      <td className="text-center font-medium text-slate-700">
                        {supplier.carDeposit ? `${supplier.carDeposit} ${supplier.currency}` : '—'}
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
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            disabled={updatingSupplierId === supplier.supplierId}
                            onClick={async () => {
                              if (!selectedLocation) return;
                              const newVisible = supplier.visible === false; // toggle
                              const confirmMsg = newVisible 
                                ? "Show this supplier for this location?\n\nThe supplier's available vehicles can appear in customer searches for this location."
                                : "Hide this supplier from this location?\n\nThe supplier will remain configured, but its vehicles will no longer appear in customer searches for this location.";
                              
                              if (!window.confirm(confirmMsg)) return;

                              setUpdatingSupplierId(supplier.supplierId);
                              try {
                                await adminFetch(`/api/admin/external-suppliers/locations/${selectedLocation.iataCode}/suppliers/${supplier.supplierId}/visibility`, { 
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ visible: newVisible })
                                });
                                // Update local state
                                setSuppliers(prev => prev.map(s => s.supplierId === supplier.supplierId ? { ...s, visible: newVisible } : s));
                              } catch (e: any) {
                                alert("Failed to update visibility: " + e.message);
                              } finally {
                                setUpdatingSupplierId(null);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm ${
                              supplier.visible !== false 
                                ? 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border-slate-200' 
                                : 'bg-accent text-white hover:bg-accent/90 border-accent'
                            } disabled:opacity-50`}
                          >
                            {updatingSupplierId === supplier.supplierId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : (
                              supplier.visible !== false ? 'Hide' : 'Show'
                            )}
                          </button>
                          <button 
                            onClick={() => setEditingSupplier(supplier)}
                            className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
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
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Provider: {editingSupplier.vendorCode}</span>
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
                    <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Car Deposit</span>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number" step="0.01"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        value={editingSupplier.carDeposit || ''}
                        onChange={(e) => setEditingSupplier({...editingSupplier, carDeposit: e.target.value ? parseFloat(e.target.value) : undefined})}
                        placeholder="e.g. 500.00"
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
                        onChange={(e) => setEditingSupplier({...editingSupplier, markupPercentage: e.target.value ? parseFloat(e.target.value) : 0})}
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
                        onChange={(e) => setEditingSupplier({...editingSupplier, commissionPercentage: e.target.value ? parseFloat(e.target.value) : 0})}
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
                          onChange={(e) => setEditingSupplier({...editingSupplier, fixedFee: e.target.value ? parseFloat(e.target.value) : 0})}
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
                <div className="flex flex-col gap-4">
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

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative inline-flex items-center">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={editingSupplier.visible !== false}
                        onChange={(e) => {
                          const newVisible = e.target.checked;
                          const confirmMsg = newVisible 
                            ? "Show this supplier for this location?\n\nThe supplier's available vehicles can appear in customer searches for this location."
                            : "Hide this supplier from this location?\n\nThe supplier will remain configured, but its vehicles will no longer appear in customer searches for this location.";
                          
                          if (window.confirm(confirmMsg)) {
                            setEditingSupplier({...editingSupplier, visible: newVisible});
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Visible in Search</span>
                  </label>
                </div>

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
