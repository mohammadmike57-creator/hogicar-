import React, { useEffect, useState, useMemo } from 'react';
import { pickupIconFor } from '../../components/PickupTypeIcon';
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
  RefreshCw,
  Plane,
  Bus,
  Users,
  Car,
  X
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { fetchPickupOverrides, savePickupOverride } from '../pickupOverridesAdmin';
import { AdminAddonSettings, fetchAddonSettings, saveAddonCatalog, saveSupplierAddons } from '../addonsAdmin';
import { AddonCatalogPanel, SupplierAddonDraft, SupplierAddonsEditor, addonsFromDraft, draftFromEntry } from '../components/AddonEditors';
import { findSupplierEntry } from '../../utils/pickupOverrides';
import { SupplierAddonsEntry } from '../../utils/addons';
import PackagePlus from 'lucide-react/dist/esm/icons/package-plus';
import { findPickupOverride, PICKUP_TYPE_OPTIONS, PickupOverrideMap, PickupTypeValue, pickupTypeLabel } from '../../utils/pickupOverrides';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  // Pick-up type overrides (in terminal / meet & greet / shuttle bus)
  const [pickupOverrides, setPickupOverrides] = useState<PickupOverrideMap>({});
  const [pickupChoice, setPickupChoice] = useState<PickupTypeValue | ''>('');
  const [pickupAllLocations, setPickupAllLocations] = useState(false);

  useEffect(() => {
    fetchPickupOverrides().then(setPickupOverrides).catch(err => console.warn('Could not load pick-up overrides', err));
  }, []);

  // Add-ons: catalog (photos, default prices) and each supplier's own prices
  const [addonSettings, setAddonSettings] = useState<AdminAddonSettings>({ catalog: {}, supplierAddons: {} });
  const [addonDraft, setAddonDraft] = useState<SupplierAddonDraft | null>(null);
  const [addonsAllLocations, setAddonsAllLocations] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  useEffect(() => {
    fetchAddonSettings().then(setAddonSettings).catch(err => console.warn('Could not load add-ons', err));
  }, []);

  const addonsFor = (supplier: SupplierConfig) =>
    findSupplierEntry<SupplierAddonsEntry>(addonSettings.supplierAddons, selectedLocation?.iataCode, supplier.supplierId, supplier.supplierName, supplier.vendorCode, v => !!v?.addons);

  const overrideFor = (supplier: SupplierConfig) =>
    findPickupOverride(pickupOverrides, selectedLocation?.iataCode, supplier.supplierId, supplier.supplierName, supplier.vendorCode);

  const openEditor = (supplier: SupplierConfig, focus?: 'addons') => {
    const current = overrideFor(supplier);
    setPickupChoice((current?.pickupType as PickupTypeValue) || '');
    setPickupAllLocations(!!current?.key.startsWith('*|'));
    const addons = addonsFor(supplier);
    setAddonDraft(draftFromEntry(addons, addonSettings.catalog));
    setAddonsAllLocations(!!addons?.key.startsWith('*|'));
    setSaveError(null);
    setSaveWarning(null);
    setEditingSupplier(supplier);
    if (focus === 'addons') {
      window.setTimeout(() => document.getElementById('supplier-addons')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  };

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
    setCountryCode(country.code);
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
    setSaveError(null);
    setSaveWarning(null);
    try {
      const savedDto = await adminFetch(`/api/admin/external-suppliers/locations/${selectedLocation.iataCode}/suppliers/${editingSupplier.supplierId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...editingSupplier, pickupType: pickupChoice || null })
      });
      setSuppliers(prev => prev.map(s => s.supplierId === savedDto.supplierId ? { ...s, ...savedDto } : s));

      let pickupWarning = false;
      // Save the pick-up type if it changed.
      const current = overrideFor(editingSupplier);
      const changed = (current?.pickupType || '') !== pickupChoice || (!!current && current.key.startsWith('*|') !== pickupAllLocations);
      if (changed) {
        const result = await savePickupOverride({
          location: selectedLocation.iataCode,
          supplierId: editingSupplier.supplierId,
          supplierName: editingSupplier.supplierName,
          vendorCode: editingSupplier.vendorCode,
          pickupType: pickupChoice || null,
          allLocations: pickupAllLocations,
        });
        setPickupOverrides(result.overrides);
        pickupWarning = !result.publicOk;
        if (!result.publicOk) {
          setSaveWarning('Saved in the admin, but the public website is not receiving this setting yet: the backend\'s public homepage content (/api/homepage/content) does not include "supplierPickupOverrides". The backend needs to return that field for the search results to change.');
        }
      }
      // Save the add-on prices if they changed.
      if (addonDraft) {
        const currentAddons = addonsFor(editingSupplier);
        const nextAddons = addonsFromDraft(addonDraft);
        const addonsChanged = JSON.stringify(currentAddons?.addons || null) !== JSON.stringify(nextAddons)
          || (!!currentAddons && currentAddons.key.startsWith('*|') !== addonsAllLocations);
        if (addonsChanged) {
          setAddonSettings(await saveSupplierAddons({
            location: selectedLocation.iataCode,
            supplierId: editingSupplier.supplierId,
            supplierName: editingSupplier.supplierName,
            vendorCode: editingSupplier.vendorCode,
            addons: nextAddons,
            allLocations: addonsAllLocations,
          }));
        }
      }
      if (!pickupWarning) setEditingSupplier(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
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

  if (loading && view === 'countries' && countries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  const totals = {
    countries: countries.length,
    suppliers: countries.reduce((acc, c) => acc + (c.supplierCount || 0), 0),
    locations: countries.reduce((acc, c) => acc + (c.locationCount || 0), 0),
    cars: countries.reduce((acc, c) => acc + (c.carCount || 0), 0),
  };
  const overridesCount = Object.keys(pickupOverrides).length;
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  const pickupIcon = (value?: string) => pickupIconFor(value);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
            <button onClick={() => { setView('countries'); setSelectedCountry(null); setSelectedLocation(null); }} className="hover:text-accent">Countries</button>
            {selectedCountry && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <button onClick={() => { setView('locations'); setSelectedLocation(null); }} className="hover:text-accent">{selectedCountry.name}</button>
              </>
            )}
            {selectedLocation && view === 'suppliers' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="font-medium text-slate-900">{selectedLocation.name}</span>
              </>
            )}
          </nav>
          <div className={`flex items-center gap-3 ${view === 'countries' ? 'hidden' : ''}`}>
            {view !== 'countries' && (
              <button onClick={handleBack} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {view === 'countries' && 'External API suppliers'}
              {view === 'locations' && `Locations in ${selectedCountry?.name || 'country'}`}
              {view === 'suppliers' && `Suppliers at ${selectedLocation?.name || 'location'}`}
            </h2>
          </div>
          <p className={`mt-1 text-sm text-slate-500 ${view === 'countries' ? 'hidden' : ''}`}>
            {view === 'countries' && 'Pricing, contact details and pick-up type for every supplier connected through an API.'}
            {view === 'locations' && 'Choose a location to manage the suppliers that operate there.'}
            {view === 'suppliers' && 'Set each supplier’s pricing and how customers collect the car. Changes apply to search results.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Filter ${view}…`}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setCatalogOpen(true)}
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <PackagePlus className="h-4 w-4" />
            Add-on catalog
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing…' : 'Sync catalogue'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Countries', value: fmt(totals.countries), icon: Globe },
          { label: 'Locations', value: fmt(totals.locations), icon: MapPin },
          { label: 'Supplier links', value: fmt(totals.suppliers), icon: Building2 },
          { label: 'Cars', value: fmt(totals.cars), icon: Car },
          { label: 'Pick-up overrides', value: String(overridesCount), icon: Plane },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Location finder */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="block flex-1">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Country</span>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                <option value="">Select a country</option>
                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <div className="relative block flex-[2]">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Pick-up location</span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={countryCode ? 'Search city, airport or IATA code…' : 'Select a country first'}
                disabled={!countryCode}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-slate-50"
                value={selectedLocation ? selectedLocation.name : locationSearch}
                onChange={(e) => { setSelectedLocation(null); handleLocationSearch(e.target.value); }}
                onFocus={() => { if (locationSearch.length >= 2) setShowSuggestions(true); }}
              />
              {selectedLocation && (
                <button
                  onClick={() => { setSelectedLocation(null); setLocationSearch(''); setSuppliers([]); setView('locations'); }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                  aria-label="Clear location"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {locationSuggestions.map((loc) => (
                  <button
                    key={loc.iataCode}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => { setSelectedLocation(loc); setShowSuggestions(false); setLocationSearch(loc.name); }}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{loc.name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{loc.iataCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={performSearch}
            disabled={!selectedLocation || isSearching}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Show suppliers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {view === 'countries' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((country: Country, index: number) => (
                <button
                  key={country.code || index}
                  onClick={() => handleCountryClick(country)}
                  className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-accent/50 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-xl">
                      {(country.code || '').split('').map((char: string) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{country.name}</p>
                      <p className="text-xs text-slate-500">{country.code}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-accent" />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-lg bg-slate-50 py-2 text-center">
                    <div><dt className="text-[11px] text-slate-500">Suppliers</dt><dd className="text-sm font-semibold text-slate-900">{country.supplierCount}</dd></div>
                    <div><dt className="text-[11px] text-slate-500">Locations</dt><dd className="text-sm font-semibold text-slate-900">{country.locationCount}</dd></div>
                    <div><dt className="text-[11px] text-slate-500">Cars</dt><dd className="text-sm font-semibold text-slate-900">{fmt(country.carCount)}</dd></div>
                  </dl>
                </button>
              ))}
            </div>
          )}

          {view === 'locations' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {filteredItems.map((location: Location, index: number) => (
                  <li key={location.iataCode || index}>
                    <button onClick={() => handleLocationClick(location)} className="group flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-slate-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-accent-50 group-hover:text-accent">
                        {/airport/i.test(location.type) ? <Plane className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{location.name}</p>
                        <p className="text-xs text-slate-500">{location.type}</p>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{location.iataCode}</span>
                      <span className="hidden w-28 text-right text-sm text-slate-600 sm:block">{location.supplierCount} supplier{location.supplierCount === 1 ? '' : 's'}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-accent" />
                    </button>
                  </li>
                ))}
              </ul>
              {filteredItems.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">No locations match your filter.</p>}
            </div>
          )}

          {view === 'suppliers' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {lastSyncInfo?.count ?? suppliers.length} suppliers · {lastSyncInfo?.cars ?? suppliers.reduce((acc, s) => acc + (s.carCount || 0), 0)} cars
                </p>
                <p className="text-xs text-slate-500">
                  Last checked {suppliers[0]?.lastDiscoveredAt ? new Date(suppliers[0].lastDiscoveredAt).toLocaleString() : 'never'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Supplier</th>
                      <th className="px-4 py-2.5 font-medium">Pick-up</th>
                      <th className="px-4 py-2.5 font-medium">Add-ons</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium">Cars</th>
                      <th className="px-4 py-2.5 text-right font-medium">Deposit</th>
                      <th className="px-4 py-2.5 text-right font-medium">Markup</th>
                      <th className="px-4 py-2.5 text-right font-medium">Commission</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((supplier: SupplierConfig, index: number) => {
                      const override = overrideFor(supplier);
                      const PickupIcon = pickupIcon(override?.pickupType);
                      return (
                        <tr key={supplier.supplierId || index} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                                {supplier.logoUrl ? <img src={supplier.logoUrl} alt="" className="h-full w-full object-contain" /> : <Building2 className="h-4 w-4 text-slate-300" />}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{supplier.supplierName}</p>
                                <p className="font-mono text-xs text-slate-500">{supplier.vendorCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {override ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                                <PickupIcon className="h-3.5 w-3.5 text-emerald-600" />
                                {pickupTypeLabel(override.pickupType)}
                                {override.key.startsWith('*|') && <span className="text-emerald-600">· all locations</span>}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">From provider</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const entry = addonsFor(supplier);
                              const priced = entry ? Object.values(entry.addons || {}).filter(a => a && a.enabled !== false && typeof a.price === 'number').length : 0;
                              return (
                                <button
                                  type="button"
                                  onClick={() => openEditor(supplier, 'addons')}
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors hover:ring-accent ${priced ? 'bg-accent-50 text-accent-800 ring-accent-200' : 'bg-white text-slate-600 ring-slate-200'}`}
                                >
                                  <PackagePlus className="h-3.5 w-3.5" />
                                  {priced ? `${priced} price${priced === 1 ? '' : 's'} set` : 'Default prices'}
                                  {entry?.key.startsWith('*|') && <span className="text-accent-600">· all locations</span>}
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-medium ${supplier.active ? 'text-emerald-700' : 'text-slate-500'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${supplier.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {supplier.active ? 'Active' : 'Inactive'}
                              </span>
                              {!supplier.isConfigured && <span className="text-[11px] text-amber-700">Not configured</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{supplier.carCount > 0 ? supplier.carCount : '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{supplier.carDeposit ? `${supplier.carDeposit} ${supplier.currency}` : '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{supplier.markupPercentage ?? 0}%</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{supplier.commissionPercentage ?? 0}%</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              onClick={() => openEditor(supplier)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => openEditor(supplier, 'addons')}
                              className="ml-1.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-700"
                            >
                              <PackagePlus className="h-3.5 w-3.5" /> Add-ons
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredItems.length === 0 && (
                <div className="px-4 py-14 text-center">
                  <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-700">No suppliers found for this location</p>
                  <p className="mt-1 text-xs text-slate-500">Try another filter, or sync the catalogue.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit drawer */}
      {editingSupplier && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setEditingSupplier(null)}>
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="ext-supplier-title">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <h2 id="ext-supplier-title" className="truncate text-lg font-semibold text-slate-900">{editingSupplier.supplierName}</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                  <span>{selectedLocation?.name}{selectedCountry ? `, ${selectedCountry.name}` : ''}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{editingSupplier.vendorCode}</span>
                </p>
              </div>
              <button onClick={() => setEditingSupplier(null)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
                {/* Pick-up */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Pick-up type</h3>
                  <p className="mt-0.5 text-sm text-slate-500">How customers collect cars from this supplier. Shown on search results and the car page.</p>
                  <div className="mt-3 grid gap-2">
                    {[{ value: '' as const, label: 'Use provider data', description: 'Keep what the API reports' }, ...PICKUP_TYPE_OPTIONS].map(option => {
                      const Icon = option.value ? pickupIcon(option.value) : RefreshCw;
                      const checked = pickupChoice === option.value;
                      return (
                        <label key={option.value || 'default'} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors ${checked ? 'border-accent bg-accent-50/60 ring-1 ring-accent' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="pickupType" className="sr-only" checked={checked} onChange={() => setPickupChoice(option.value)} />
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${checked ? 'bg-emerald-600 text-white' : option.value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                            <span className="block text-xs text-slate-500">{option.description}</span>
                          </span>
                          <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${checked ? 'border-accent bg-accent shadow-[inset_0_0_0_2px_white]' : 'border-slate-300'}`} />
                        </label>
                      );
                    })}
                  </div>
                  {pickupChoice && (
                    <label className="mt-3 flex items-center gap-2.5 text-sm text-slate-700">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent" checked={pickupAllLocations} onChange={e => setPickupAllLocations(e.target.checked)} />
                      Apply to all of {editingSupplier.supplierName}’s locations
                    </label>
                  )}
                </section>

                {/* Add-ons */}
                {addonDraft && (
                  <div id="supplier-addons" className="scroll-mt-4">
                  <SupplierAddonsEditor
                    catalog={addonSettings.catalog}
                    draft={addonDraft}
                    onChange={setAddonDraft}
                    allLocations={addonsAllLocations}
                    onAllLocationsChange={setAddonsAllLocations}
                    supplierName={editingSupplier.supplierName}
                    currency="USD"
                  />
                  </div>
                )}

                {/* Pricing */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Pricing</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Markup', suffix: '%', value: editingSupplier.markupPercentage || 0, set: (v: number) => setEditingSupplier({ ...editingSupplier, markupPercentage: v }) },
                      { label: 'Commission', suffix: '%', value: editingSupplier.commissionPercentage || 0, set: (v: number) => setEditingSupplier({ ...editingSupplier, commissionPercentage: v }) },
                      { label: 'Fixed fee', suffix: editingSupplier.currency || 'USD', value: editingSupplier.fixedFee || 0, set: (v: number) => setEditingSupplier({ ...editingSupplier, fixedFee: v }) },
                    ].map(field => (
                      <label key={field.label} className="block">
                        <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
                        <div className="flex h-10 items-center rounded-lg border border-slate-300 bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                          <input type="number" step="0.01" className="h-full min-w-0 flex-1 rounded-lg border-0 bg-transparent px-3 text-sm text-slate-900 focus:outline-none focus:ring-0" value={field.value} onChange={e => field.set(e.target.value ? parseFloat(e.target.value) : 0)} />
                          <span className="pr-3 text-xs text-slate-500">{field.suffix}</span>
                        </div>
                      </label>
                    ))}
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Currency</span>
                      <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" value={editingSupplier.currency || 'USD'} onChange={e => setEditingSupplier({ ...editingSupplier, currency: e.target.value })}>
                        {['USD', 'JOD', 'AED', 'SAR', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Car deposit</span>
                      <div className="flex h-10 items-center rounded-lg border border-slate-300 bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                        <input type="number" step="0.01" placeholder="e.g. 500" className="h-full min-w-0 flex-1 rounded-lg border-0 bg-transparent px-3 text-sm text-slate-900 focus:outline-none focus:ring-0" value={editingSupplier.carDeposit || ''} onChange={e => setEditingSupplier({ ...editingSupplier, carDeposit: e.target.value ? parseFloat(e.target.value) : undefined })} />
                        <span className="pr-3 text-xs text-slate-500">{editingSupplier.currency || 'USD'}</span>
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Priority</span>
                      <input type="number" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" value={editingSupplier.priority || 0} onChange={e => setEditingSupplier({ ...editingSupplier, priority: parseInt(e.target.value) || 0 })} />
                    </label>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="email" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" value={editingSupplier.contactEmail || ''} onChange={e => setEditingSupplier({ ...editingSupplier, contactEmail: e.target.value })} />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Phone</span>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="text" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" value={editingSupplier.contactPhone || ''} onChange={e => setEditingSupplier({ ...editingSupplier, contactPhone: e.target.value })} />
                      </div>
                    </label>
                  </div>
                </section>

                {/* Availability */}
                <section className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Active at this location</h3>
                    <p className="text-xs text-slate-500">Inactive suppliers don’t appear in search results here.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editingSupplier.active}
                    onClick={() => setEditingSupplier({ ...editingSupplier, active: !editingSupplier.active })}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${editingSupplier.active ? 'bg-accent' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editingSupplier.active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </section>
              </div>

              {saveWarning && (
                <div className="mx-6 mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800" role="status">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{saveWarning}</span>
                </div>
              )}
              {saveError && (
                <div className="mx-6 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button type="button" onClick={() => setEditingSupplier(null)} className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-200/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AddonCatalogPanel
        open={catalogOpen}
        catalog={addonSettings.catalog}
        onClose={() => setCatalogOpen(false)}
        onSave={async catalog => { setAddonSettings(await saveAddonCatalog(catalog)); }}
      />
    </div>
  );
};

export default ExternalSuppliersPage;
