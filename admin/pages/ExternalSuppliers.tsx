import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Search from 'lucide-react/dist/esm/icons/search';
import Globe from 'lucide-react/dist/esm/icons/globe';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Car from 'lucide-react/dist/esm/icons/car';
import X from 'lucide-react/dist/esm/icons/x';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import SearchX from 'lucide-react/dist/esm/icons/search-x';
import PackagePlus from 'lucide-react/dist/esm/icons/package-plus';
import { adminFetch } from '../../lib/adminApi';
import { fetchPickupOverrides, savePickupOverride } from '../pickupOverridesAdmin';
import { AdminAddonSettings, fetchAddonSettings, saveAddonCatalog, saveSupplierAddons } from '../addonsAdmin';
import { AddonCatalogPanel, SupplierAddonDraft, addonsFromDraft, draftFromEntry } from '../components/AddonEditors';
import { findSupplierEntry } from '../../utils/pickupOverrides';
import { SupplierAddonsEntry } from '../../utils/addons';
import { findPickupOverride, PickupOverrideMap, PickupTypeValue } from '../../utils/pickupOverrides';
import { Hero, heroButton, heroPrimary, ErrorBanner, Spinner, Toast, useToast, inputCls, num, ago } from '../components/commercialUi';
import { Flag, flagOf, EmptyState, CountrySkeletons, LocationSkeletons, SupplierSkeletons } from '../components/external/media';
import { SupplierCard } from '../components/external/SupplierCard';
import { SupplierDrawer } from '../components/external/SupplierDrawer';
import type { Country, Location, SupplierConfig, SupplierSearchResponse } from '../components/external/types';

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

const compact = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : num(n));

const ExternalSuppliersPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>('countries');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast, notify } = useToast();

  // Location selector state
  const [countryCode, setCountryCode] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<{count: number, cars: number} | null>(null);

  // Drawer state
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
      window.setTimeout(() => document.getElementById('supplier-addons')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminFetch('/api/admin/external-suppliers/countries');
      setCountries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch countries', error);
      setLoadError('Could not load countries. ' + (error instanceof Error ? error.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (countryCode: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminFetch(`/api/admin/external-suppliers/countries/${countryCode}/locations`);
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch locations', error);
      setLocations([]);
      setLoadError('Could not load locations. ' + (error instanceof Error ? error.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
    setCountryCode(country.code);
    setSelectedLocation(null);
    setLocationSearch('');
    fetchLocations(country.code);
    setView('locations');
    setSearchTerm('');
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setLocationSearch(location.name);
    setSearchTerm('');
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
      notify('Could not load suppliers: ' + (error instanceof Error ? error.message : String(error)), 'err');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const performSearch = () => {
    if (selectedLocation) {
      setSearchTerm('');
      triggerSuppliersSearch(selectedLocation.iataCode);
    }
  };

  const goCountries = () => { setView('countries'); setSelectedCountry(null); setSelectedLocation(null); setSearchTerm(''); setLoadError(null); };
  const goLocations = () => { setView('locations'); setSelectedLocation(null); setSearchTerm(''); };

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
      notify(`Sync complete · ${num(result?.locationsProcessed)} locations, ${num(result?.relationshipsCreated)} new links, ${num(result?.relationshipsUpdated)} updated`);
      fetchCountries();
    } catch (error) {
      notify('Sync failed: ' + (error instanceof Error ? error.message : String(error)), 'err');
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
      const filtered = (Array.isArray(allLocs) ? allLocs : []).filter((l: Location) =>
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
      if (!pickupWarning) {
        notify(`${editingSupplier.supplierName} saved`);
        setEditingSupplier(null);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const term = normalizeSearchText(searchTerm);
  const filteredCountries = useMemo(() => countries.filter(c =>
    normalizeSearchText(c.name).includes(term) || normalizeSearchText(c.code).includes(term)), [countries, term]);
  const filteredLocations = useMemo(() => locations.filter(l =>
    normalizeSearchText(l.name).includes(term) || normalizeSearchText(l.iataCode).includes(term)), [locations, term]);
  const filteredSuppliers = useMemo(() => suppliers.filter(s =>
    normalizeSearchText(s.supplierName).includes(term) || normalizeSearchText(s.vendorCode).includes(term)), [suppliers, term]);

  const totals = {
    countries: countries.length,
    suppliers: countries.reduce((acc, c) => acc + (c.supplierCount || 0), 0),
    locations: countries.reduce((acc, c) => acc + (c.locationCount || 0), 0),
    cars: countries.reduce((acc, c) => acc + (c.carCount || 0), 0),
  };
  const overridesCount = Object.keys(pickupOverrides).length;
  const heroLoading = loading && countries.length === 0;
  const lastChecked = suppliers.map(s => s.lastDiscoveredAt).filter(Boolean).sort().pop();
  const supplierCount = lastSyncInfo?.count ?? suppliers.length;
  const supplierCars = lastSyncInfo?.cars ?? suppliers.reduce((acc, s) => acc + (s.carCount || 0), 0);
  const activeCount = suppliers.filter(s => s.active).length;

  const title = view === 'countries' ? 'All countries'
    : view === 'locations' ? `Locations in ${selectedCountry?.name || 'country'}`
    : `Suppliers at ${selectedLocation?.name || 'location'}`;
  const subtitle = view === 'countries' ? 'Choose a country to see its pick-up locations.'
    : view === 'locations' ? 'Choose a location to manage the suppliers that operate there.'
    : `${num(supplierCount)} supplier${supplierCount === 1 ? '' : 's'} · ${num(supplierCars)} cars · ${num(activeCount)} active · last checked ${ago(lastChecked).toLowerCase()}`;
  const filterLabel = view === 'countries' ? 'Filter countries…' : view === 'locations' ? 'Filter locations…' : 'Filter suppliers…';
  const clearFilter = { label: 'Clear filter', onClick: () => setSearchTerm(''), icon: X };

  const renderCountries = () => {
    if (loading) return <CountrySkeletons />;
    if (countries.length === 0) {
      return <EmptyState icon={Globe} title="No countries yet" text="Sync the catalogue to discover the suppliers your API partners offer in each country."
        action={{ label: isSyncing ? 'Syncing…' : 'Sync catalogue', onClick: handleSync, icon: RefreshCw, disabled: isSyncing }} />;
    }
    if (filteredCountries.length === 0) {
      return <EmptyState icon={SearchX} title="No matching countries" text={`Nothing matches “${searchTerm}”. Try a country name or two-letter code.`} action={clearFilter} />;
    }
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCountries.map((country, index) => (
          <button
            key={country.code || index}
            onClick={() => handleCountryClick(country)}
            className="group flex flex-col rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-[#007ac2]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007ac2] sm:p-5"
          >
            <div className="flex items-center gap-3.5">
              <Flag code={country.code} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-900">{country.name}</p>
                <p className="text-xs font-medium text-slate-400">{(country.code || '').toUpperCase()}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-slate-100 text-center ring-1 ring-slate-100">
              {[['Locations', country.locationCount], ['Suppliers', country.supplierCount], ['Cars', country.carCount]].map(([k, v]) => (
                <div key={k as string} className="bg-slate-50 px-2 py-2.5">
                  <dt className="text-[11px] text-slate-500">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{compact(Number(v) || 0)}</dd>
                </div>
              ))}
            </dl>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#007ac2]">
              Open locations <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderLocations = () => {
    if (loading) return <LocationSkeletons />;
    if (locations.length === 0) {
      return <EmptyState icon={MapPin} title="No locations in this country" text="No supplier has been discovered here yet. Sync the catalogue or pick another country."
        action={{ label: 'Back to countries', onClick: goCountries, icon: ArrowLeft }} />;
    }
    if (filteredLocations.length === 0) {
      return <EmptyState icon={SearchX} title="No matching locations" text={`Nothing matches “${searchTerm}”. Try a city, airport name or IATA code.`} action={clearFilter} />;
    }
    return (
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {filteredLocations.map((location, index) => {
          const airport = /airport/i.test(location.type || '');
          return (
            <li key={location.iataCode || index}>
              <button onClick={() => handleLocationClick(location)} className="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-sky-50/40 sm:px-5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${airport ? 'bg-sky-50 text-[#007ac2]' : 'bg-slate-100 text-slate-500'} group-hover:bg-[#007ac2] group-hover:text-white`}>
                  {airport ? <Plane className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{location.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {location.type}<span className="sm:hidden"> · {location.supplierCount} supplier{location.supplierCount === 1 ? '' : 's'}</span>
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{location.iataCode}</span>
                <span className="hidden w-28 text-right text-sm tabular-nums text-slate-600 sm:block">{location.supplierCount} supplier{location.supplierCount === 1 ? '' : 's'}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#007ac2]" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderSuppliers = () => {
    if (loading) return <SupplierSkeletons />;
    if (suppliers.length === 0) {
      return <EmptyState icon={Building2} title="No suppliers at this location" text="No API supplier returned cars here at the last check. Sync the catalogue to look again."
        action={{ label: isSyncing ? 'Syncing…' : 'Sync catalogue', onClick: handleSync, icon: RefreshCw, disabled: isSyncing }} />;
    }
    if (filteredSuppliers.length === 0) {
      return <EmptyState icon={SearchX} title="No matching suppliers" text={`Nothing matches “${searchTerm}”. Try a supplier name or vendor code.`} action={clearFilter} />;
    }
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {filteredSuppliers.map((supplier, index) => {
          const entry = addonsFor(supplier);
          const priced = entry ? Object.values(entry.addons || {}).filter(a => a && a.enabled !== false && typeof a.price === 'number').length : 0;
          return (
            <SupplierCard
              key={supplier.supplierId || index}
              supplier={supplier}
              override={overrideFor(supplier)}
              addonsPriced={priced}
              addonsAllLocations={!!entry?.key.startsWith('*|')}
              onEdit={() => openEditor(supplier)}
              onAddons={() => openEditor(supplier, 'addons')}
              notify={notify}
            />
          );
        })}
      </div>
    );
  };

  // While a location's suppliers load we are still on the locations view; show supplier skeletons.
  const body = isSearching ? <SupplierSkeletons /> : view === 'countries' ? renderCountries() : view === 'locations' ? renderLocations() : renderSuppliers();

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Supply network"
        eyebrowIcon={Link2}
        title="External suppliers"
        subtitle="Pricing, contact details, pick-up type and add-on prices for every rental supplier connected through an API."
        loading={heroLoading}
        actions={<>
          <button onClick={() => setCatalogOpen(true)} className={heroButton}>
            <PackagePlus className="h-4 w-4" /> Add-on catalog
          </button>
          <button onClick={handleSync} disabled={isSyncing} className={`${heroPrimary} disabled:opacity-70`}>
            {isSyncing ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
            {isSyncing ? 'Syncing…' : 'Sync catalogue'}
          </button>
        </>}
        kpis={[
          { label: 'Countries', value: num(totals.countries), Icon: Globe },
          { label: 'Locations', value: compact(totals.locations), Icon: MapPin },
          { label: 'Supplier links', value: compact(totals.suppliers), Icon: Building2, note: overridesCount ? `${overridesCount} pick-up override${overridesCount === 1 ? '' : 's'}` : undefined },
          { label: 'Cars', value: compact(totals.cars), Icon: Car },
        ]}
      />

      {/* Navigator: breadcrumb, title, filter and quick location finder */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {view !== 'countries' && (
              <button onClick={handleBack} className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
                <button onClick={goCountries} className={`rounded px-0.5 hover:text-[#007ac2] ${view === 'countries' ? 'font-medium text-slate-900' : ''}`}>Countries</button>
                {selectedCountry && view !== 'countries' && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <button onClick={goLocations} className={`inline-flex min-w-0 items-center gap-1 rounded px-0.5 hover:text-[#007ac2] ${view === 'locations' ? 'font-medium text-slate-900' : ''}`}>
                      <span aria-hidden="true">{flagOf(selectedCountry.code)}</span>
                      <span className="truncate">{selectedCountry.name}</span>
                    </button>
                  </>
                )}
                {selectedLocation && view === 'suppliers' && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <span className="truncate font-medium text-slate-900">{selectedLocation.name}</span>
                  </>
                )}
              </nav>
              <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                {view === 'suppliers' && <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                <span>{subtitle}</span>
              </p>
            </div>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" placeholder={filterLabel} aria-label={filterLabel} className={`${inputCls} pl-10`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Quick location finder */}
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Country</span>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className={`${inputCls} appearance-none pl-10 pr-10`}
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  const c = countries.find(c => c.code === e.target.value);
                  if (c) {
                    setSelectedCountry(c);
                    fetchLocations(e.target.value);
                    setView('locations');
                    setSearchTerm('');
                  }
                  setLocationSearch('');
                  setSelectedLocation(null);
                  setSuppliers([]);
                }}
              >
                <option value="">Select a country</option>
                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <div className="relative min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Pick-up location</span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Pick-up location"
                placeholder={countryCode ? 'Search city, airport or IATA code…' : 'Select a country first'}
                disabled={!countryCode}
                className={`${inputCls} pl-10 pr-10 disabled:bg-slate-50 disabled:text-slate-400`}
                value={selectedLocation ? selectedLocation.name : locationSearch}
                onChange={(e) => { setSelectedLocation(null); handleLocationSearch(e.target.value); }}
                onFocus={() => { if (locationSearch.length >= 2) setShowSuggestions(true); }}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => { if (e.key === 'Enter' && selectedLocation) performSearch(); }}
              />
              {(selectedLocation || locationSearch) && (
                <button
                  onClick={() => { setSelectedLocation(null); setLocationSearch(''); setLocationSuggestions([]); setSuppliers([]); if (selectedCountry) setView('locations'); }}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear location"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
                {locationSuggestions.map((loc) => (
                  <button
                    key={loc.iataCode}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { setSelectedLocation(loc); setShowSuggestions(false); setLocationSearch(loc.name); }}
                  >
                    {/airport/i.test(loc.type || '') ? <Plane className="h-4 w-4 shrink-0 text-slate-400" /> : <MapPin className="h-4 w-4 shrink-0 text-slate-400" />}
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{loc.name}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{loc.iataCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={performSearch}
            disabled={!selectedLocation || isSearching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#00679f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? <Spinner light /> : <Search className="h-4 w-4" />}
            Show suppliers
          </button>
        </div>
      </section>

      {loadError && !loading && <ErrorBanner text={loadError} onRetry={() => (view === 'locations' && selectedCountry ? fetchLocations(selectedCountry.code) : fetchCountries())} />}

      {body}

      <AnimatePresence>
        {editingSupplier && (
          <SupplierDrawer
            key={`edit-${editingSupplier.supplierId}`}
            supplier={editingSupplier}
            onChange={setEditingSupplier}
            country={selectedCountry}
            location={selectedLocation}
            pickupChoice={pickupChoice}
            onPickupChoice={setPickupChoice}
            pickupAllLocations={pickupAllLocations}
            onPickupAllLocations={setPickupAllLocations}
            addonSettings={addonSettings}
            addonDraft={addonDraft}
            onAddonDraft={setAddonDraft}
            addonsAllLocations={addonsAllLocations}
            onAddonsAllLocations={setAddonsAllLocations}
            saving={isSaving}
            error={saveError}
            warning={saveWarning}
            onSubmit={handleSave}
            onClose={() => setEditingSupplier(null)}
          />
        )}
      </AnimatePresence>
      <AddonCatalogPanel
        open={catalogOpen}
        catalog={addonSettings.catalog}
        onClose={() => setCatalogOpen(false)}
        onSave={async catalog => { setAddonSettings(await saveAddonCatalog(catalog)); }}
      />
      <Toast toast={toast} />
    </div>
  );
};

export default ExternalSuppliersPage;
