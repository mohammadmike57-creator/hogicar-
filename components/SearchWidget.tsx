import * as React from 'react';
import { MapPin, Calendar, Clock, Plane, Building, LoaderCircle, Search as SearchIcon, ChevronDown } from 'lucide-react';
import { fetchLocations, LocationSuggestion } from '../api';
import SearchOverlay from './SearchOverlay';

interface SearchParams {
    location: string;
    pickup?: string;
    pickupName?: string;
    pickupDate: string;
    dropoffDate: string;
    startTime: string;
    endTime: string;
    dropoffLocation?: string;
    dropoff?: string;
    dropoffName?: string;
    differentDropoff: boolean;
}

interface SearchWidgetProps {
    initialValues?: Partial<SearchParams>;
    onSearch: (params: Partial<SearchParams>) => void;
    showTitle?: boolean;
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ initialValues, onSearch, showTitle = false }) => {
    const today = new Date();
    const nextThreeDays = new Date(today);
    nextThreeDays.setDate(today.getDate() + 3);

    const [pickupQuery, setPickupQuery] = React.useState(initialValues?.pickupName || initialValues?.location || '');
    const [pickupSelection, setPickupSelection] = React.useState<LocationSuggestion | null>(initialValues?.pickup ? { label: initialValues.pickupName || initialValues.location || '', value: initialValues.pickup, type: 'AIRPORT' } : null);
    
    const [differentDropoff, setDifferentDropoff] = React.useState(initialValues?.differentDropoff || false);
    
    const [dropoffQuery, setDropoffQuery] = React.useState(initialValues?.dropoffName || initialValues?.dropoffLocation || '');
    const [dropoffSelection, setDropoffSelection] = React.useState<LocationSuggestion | null>(initialValues?.dropoff ? { label: initialValues.dropoffName || initialValues.dropoffLocation || '', value: initialValues.dropoff, type: 'AIRPORT' } : null);

    const [pickupDate, setPickupDate] = React.useState(initialValues?.pickupDate || today.toISOString().split('T')[0]);
    const [dropoffDate, setDropoffDate] = React.useState(initialValues?.dropoffDate || nextThreeDays.toISOString().split('T')[0]);
    const [pickupTime, setPickupTime] = React.useState(initialValues?.startTime || '10:00');
    const [dropoffTime, setDropoffTime] = React.useState(initialValues?.endTime || '10:00');

    const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
    const [dropoffSuggestions, setDropoffSuggestions] = React.useState<LocationSuggestion[]>([]);
    const [isDropoffSuggestionsOpen, setIsDropoffSuggestionsOpen] = React.useState(false);

    const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
    const [suggestionsError, setSuggestionsError] = React.useState<string | null>(null);
    const [isDropoffLoading, setIsDropoffLoading] = React.useState(false);
    const [dropoffError, setDropoffError] = React.useState<string | null>(null);
    
    const mobileWidgetRef = React.useRef<HTMLDivElement>(null);
    const desktopWidgetRef = React.useRef<HTMLDivElement>(null);
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>();

    // Overlay state
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = React.useState(false);
    const [overlayType, setOverlayType] = React.useState<'pickup' | 'dropoff'>('pickup');
    const [recentLocations, setRecentLocations] = React.useState<LocationSuggestion[]>([]);

    // Load recent locations from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('hogicar_recent_locations');
        if (saved) {
            try {
                setRecentLocations(JSON.parse(saved));
            } catch (e) {}
        }
    }, []);

    const saveRecentLocations = (locs: LocationSuggestion[]) => {
        localStorage.setItem('hogicar_recent_locations', JSON.stringify(locs));
        setRecentLocations(locs);
    };

    const saveRecentLocation = (loc: LocationSuggestion) => {
        setRecentLocations(prev => {
            const exists = prev.find(p => p.value === loc.value);
            if (exists) return prev;
            const updated = [loc, ...prev].slice(0, 5);
            saveRecentLocations(updated);
            return updated;
        });
    };

    const getLocationIcon = (type: string, sizeClass = 'w-4 h-4') => {
        const lowerType = (type || '').toLowerCase();
        if (lowerType === 'airport') {
            return <Plane className={`${sizeClass} text-green-600`} />;
        }
        if (lowerType === 'city') {
             return <Building className={`${sizeClass} text-amber-700`} />;
        }
        return <MapPin className={`${sizeClass} text-slate-400`} />;
    };

    // --- Desktop suggestion handlers (unchanged) ---
    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPickupQuery(value);
        setPickupSelection(null);
        setSuggestionsError(null);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (value.length < 3) {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
            setIsLoadingSuggestions(false);
            return;
        }
        
        setIsLoadingSuggestions(true);
        setIsSuggestionsOpen(true);

        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await fetchLocations(value);
                setSuggestions(results);
                if (results.length > 0) setIsSuggestionsOpen(true);
            } catch (err) {
                setSuggestionsError('Locations temporarily unavailable.');
                setSuggestions([]);
                setIsSuggestionsOpen(true);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 500);
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        setPickupQuery(suggestion.label);
        setPickupSelection(suggestion);
        setIsSuggestionsOpen(false);
    };

    const handleFocus = () => {
        if ((pickupQuery || '').length >= 3 && (suggestions.length > 0 || isLoadingSuggestions || suggestionsError)) {
            setIsSuggestionsOpen(true);
        }
    };

    const handleDropoffLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDropoffQuery(value);
        setDropoffSelection(null);
        setDropoffError(null);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        if (value.length < 3) {
            setDropoffSuggestions([]);
            setIsDropoffSuggestionsOpen(false);
            setIsDropoffLoading(false);
            return;
        }

        setIsDropoffLoading(true);
        setIsDropoffSuggestionsOpen(true);

        debounceTimer.current = setTimeout(async () => {
             try {
                const results = await fetchLocations(value);
                setDropoffSuggestions(results);
                if (results.length > 0) setIsDropoffSuggestionsOpen(true);
            } catch (err) {
                setDropoffError('Locations temporarily unavailable.');
                setDropoffSuggestions([]);
                setIsDropoffSuggestionsOpen(true);
            } finally {
                setIsDropoffLoading(false);
            }
        }, 500);
    };

    const handleDropoffSuggestionClick = (suggestion: LocationSuggestion) => {
        setDropoffQuery(suggestion.label);
        setDropoffSelection(suggestion);
        setIsDropoffSuggestionsOpen(false);
    };

    const handleDropoffFocus = () => {
        if ((dropoffQuery || '').length >= 3 && (dropoffSuggestions.length > 0 || isDropoffLoading || dropoffError)) {
            setIsDropoffSuggestionsOpen(true);
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                (mobileWidgetRef.current && !mobileWidgetRef.current.contains(event.target as Node)) &&
                (desktopWidgetRef.current && !desktopWidgetRef.current.contains(event.target as Node))
            ) {
                setIsSuggestionsOpen(false);
                setIsDropoffSuggestionsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    const openSearchOverlay = (type: 'pickup' | 'dropoff') => {
        setOverlayType(type);
        setIsSearchOverlayOpen(true);
    };

    const closeSearchOverlay = () => {
        setIsSearchOverlayOpen(false);
    };

    const handleOverlaySelect = (loc: LocationSuggestion) => {
        if (overlayType === 'pickup') {
            setPickupQuery(loc.label);
            setPickupSelection(loc);
        } else {
            setDropoffQuery(loc.label);
            setDropoffSelection(loc);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedQuery = (pickupQuery || '').trim();
        let pickupLocation: string | undefined;
        let finalPickupName: string | undefined;

        if (pickupSelection) {
            pickupLocation = pickupSelection.value;
            finalPickupName = pickupSelection.label;
        } else if (trimmedQuery.length === 3 && /^[A-Z]{3}$/i.test(trimmedQuery)) {
            pickupLocation = trimmedQuery.toUpperCase();
            finalPickupName = pickupLocation;
        } else {
            alert("Please select a location from the dropdown (or type a valid 3-letter IATA code like DXB).");
            return;
        }

        let dropoffLocation: string | undefined = pickupLocation;
        let finalDropoffName: string | undefined = finalPickupName;

        if (differentDropoff) {
            const trimmedDropoffQuery = (dropoffQuery || '').trim();
            if (dropoffSelection) {
                dropoffLocation = dropoffSelection.value;
                finalDropoffName = dropoffSelection.label;
            } else if (trimmedDropoffQuery.length === 3 && /^[A-Z]{3}$/i.test(trimmedDropoffQuery)) {
                dropoffLocation = trimmedDropoffQuery.toUpperCase();
                finalDropoffName = dropoffLocation;
            } else if (dropoffQuery) {
                alert('Please select a drop-off location from the dropdown, or enter a valid 3-letter airport code.');
                return;
            }
        }

        setIsSuggestionsOpen(false);
        setIsDropoffSuggestionsOpen(false);
        
        onSearch({
            pickup: pickupLocation,
            pickupName: finalPickupName,
            pickupDate: pickupDate,
            dropoffDate: dropoffDate,
            startTime: pickupTime,
            endTime: dropoffTime,
            dropoff: dropoffLocation,
            dropoffName: finalDropoffName,
            differentDropoff: differentDropoff
        });
    };
    
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        const formattedHour = hour.toString().padStart(2, '0');
        return `${formattedHour}:${minute}`;
    });

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return 'Select Date';
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };
    
    const renderSuggestions = (
      loading: boolean, 
      error: string | null, 
      suggestions: LocationSuggestion[],
      handler: (s: LocationSuggestion) => void
    ) => (
      <>
        {loading ? (
          <div className="p-5 text-sm text-slate-500 text-center flex items-center justify-center gap-2 font-semibold">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : error ? (
          <p className="p-5 text-sm text-rose-500 text-center font-semibold">{error}</p>
        ) : suggestions.length > 0 ? (
          <ul className="py-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion.value + suggestion.label}>
                <button
                  type="button"
                  onClick={() => handler(suggestion)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50/80 transition-colors flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">{getLocationIcon(suggestion.type)}</div>
                  <div><span className="font-bold">{suggestion.label}</span></div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-500 text-center font-semibold">No results found.</p>
        )}
      </>
    );

    // --- NEW DESKTOP DATE/TIME FIELDS (reliable) ---
    const DesktopDateField = ({ label, value, onChange, min }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: string }) => (
        <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Calendar className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <label className="absolute top-2 left-10 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">{label}</label>
            <input
                type="date"
                value={value}
                onChange={onChange}
                min={min}
                className="w-full h-[68px] pt-5 pb-1 pl-10 pr-3 rounded-[12px] border border-slate-300 bg-white hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:outline-none text-base font-black text-slate-900 cursor-pointer transition-all shadow-sm"
                style={{ colorScheme: 'light' }}
            />
        </div>
    );

    const DesktopTimeField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) => (
        <div className="relative w-[132px] group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Clock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <label className="absolute top-2 left-10 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full h-[68px] pt-5 pb-1 pl-10 pr-3 rounded-[12px] border border-slate-300 bg-white hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:outline-none text-base font-black text-slate-900 cursor-pointer appearance-none transition-all shadow-sm"
            >
                {options.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
        </div>
    );

    const pickupDateId = React.useId();
    const pickupTimeId = React.useId();
    const dropoffDateId = React.useId();
    const dropoffTimeId = React.useId();

    return (
        <>
        {/* --- MOBILE WIDGET --- */}
        <div className="lg:hidden" ref={mobileWidgetRef}>
            <div className="relative overflow-hidden rounded-2xl border border-slate-300/90 bg-white/95 px-4 py-4 shadow-[0_22px_54px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-blue-100/80 via-white to-transparent" />
                <div className="relative">
                    {showTitle && (
                        <div className="mb-3.5">
                            <p className="text-[11px] uppercase tracking-[0.24em] font-black text-blue-700">Premium booking engine</p>
                            <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Find your perfect car in seconds</h3>
                        </div>
                    )}

                    <form onSubmit={handleSearch} className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => openSearchOverlay('pickup')}
                            className="relative h-[64px] rounded-xl border border-slate-300 bg-white px-4 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:outline-none"
                        >
                            <div className="flex items-center gap-3 w-full min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                                    {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pick-up location</div>
                                    <div className="font-black text-slate-900 text-[15px] truncate">
                                        {pickupSelection?.label || pickupQuery || 'City, airport, or station'}
                                    </div>
                                </div>
                                <SearchIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            </div>
                        </button>

                        {differentDropoff && (
                            <button
                                type="button"
                                onClick={() => openSearchOverlay('dropoff')}
                                className="relative h-14 rounded-xl border border-slate-300 bg-slate-50/80 px-3.5 text-left shadow-sm transition-all hover:border-blue-300 hover:bg-white focus:outline-none"
                            >
                                <div className="flex items-center gap-2.5 w-full min-w-0">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 border border-slate-200">
                                        {getLocationIcon(dropoffSelection?.type || '', 'w-4 h-4')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Drop-off location</div>
                                        <div className="font-bold text-slate-900 text-sm truncate">
                                            {dropoffSelection?.label || dropoffQuery || 'City, airport, or station'}
                                        </div>
                                    </div>
                                    <SearchIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                </div>
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="relative h-16 rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <label className="absolute top-1.5 left-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Pick-up date</label>
                                <input
                                    type="date"
                                    value={pickupDate}
                                    onChange={e => setPickupDate(e.target.value)}
                                    min={today.toISOString().split('T')[0]}
                                    className="w-full h-full bg-transparent pl-8 pr-2 pt-5 pb-1 text-[13px] font-black text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
                                />
                            </div>
                            <div className="relative h-16 rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <label className="absolute top-1.5 left-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Drop-off date</label>
                                <input
                                    type="date"
                                    value={dropoffDate}
                                    onChange={e => setDropoffDate(e.target.value)}
                                    min={pickupDate}
                                    className="w-full h-full bg-transparent pl-8 pr-2 pt-5 pb-1 text-[13px] font-black text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="relative h-16 rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <label className="absolute top-1.5 left-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Pick-up time</label>
                                <select
                                    value={pickupTime}
                                    onChange={e => setPickupTime(e.target.value)}
                                    className="w-full h-full bg-transparent pl-8 pr-2 pt-5 pb-1 text-[13px] font-black text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                >
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="relative h-16 rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <label className="absolute top-1.5 left-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em]">Drop-off time</label>
                                <select
                                    value={dropoffTime}
                                    onChange={e => setDropoffTime(e.target.value)}
                                    className="w-full h-full bg-transparent pl-8 pr-2 pt-5 pb-1 text-[13px] font-black text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                >
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-black py-4 text-base shadow-[0_16px_38px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_20px_42px_rgba(37,99,235,0.42)] active:scale-[0.99] flex items-center justify-center gap-2">
                            <SearchIcon className="w-5 h-5" />
                            Search cars now
                        </button>
                    </form>

                    <div className="mt-3.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-3 flex flex-col gap-2.5">
                        <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" checked={differentDropoff} onChange={(e) => setDifferentDropoff(e.target.checked)} className="h-4 w-4 rounded border border-slate-300 bg-white text-blue-600 focus:ring-0 mr-2" />
                            Return to a different location
                        </label>
                        <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border border-slate-300 bg-white text-blue-600 focus:ring-0 mr-2" />
                            Driver age 30 - 65
                        </label>
                        <div className="pt-1 text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">
                            Trusted suppliers • no hidden fees • instant confirmation
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SEARCH OVERLAY (full-screen) --- */}
        <SearchOverlay
            isOpen={isSearchOverlayOpen}
            onClose={closeSearchOverlay}
            onSelectLocation={handleOverlaySelect}
            recentLocations={recentLocations}
            saveRecentLocation={saveRecentLocation}
        />

        {/* --- DESKTOP WIDGET --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="relative z-10 overflow-visible rounded-2xl border border-slate-300 bg-gradient-to-b from-white via-white to-slate-50/80 px-6 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)] max-w-7xl mx-auto">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-blue-100/70 via-white to-transparent" />
                <div className="relative">
                    {showTitle && (
                        <div className="mb-5 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.24em] font-black text-blue-700">Professional car rental marketplace</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Compare trusted offers in one fast search</h3>
                            </div>
                            <div className="rounded-lg border border-blue-200 bg-blue-50/90 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                                900+ suppliers • total price clarity
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-12 gap-2.5">
                            <div className={`relative h-[74px] rounded-xl border border-slate-300 bg-white shadow-sm transition-all hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 ${differentDropoff ? 'col-span-6' : 'col-span-12'}`}>
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                                        {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                                    </div>
                                </div>
                                <div className="absolute top-2.5 left-16 text-[10px] font-black text-slate-500 uppercase tracking-[0.18em]">Pick-up location</div>
                                <input
                                    type="text"
                                    placeholder="City, airport, or station"
                                    className="block w-full h-full pl-16 pr-4 pt-6 pb-2 border-none focus:ring-0 focus:outline-none text-base font-black placeholder-slate-400 text-slate-900 bg-transparent"
                                    value={pickupQuery}
                                    onChange={handleLocationChange}
                                    onFocus={handleFocus}
                                    autoComplete="off"
                                    required
                                />
                                {isSuggestionsOpen && (
                                    <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-3 w-full left-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto py-2">
                                        {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                    </div>
                                )}
                            </div>

                            {differentDropoff && (
                                <div className="relative col-span-6 h-[74px] rounded-xl border border-slate-300 bg-white shadow-sm transition-all hover:border-blue-300 hover:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-300">
                                            {getLocationIcon(dropoffSelection?.type || '', 'w-5 h-5')}
                                        </div>
                                    </div>
                                    <div className="absolute top-2.5 left-16 text-[10px] font-black text-slate-500 uppercase tracking-[0.18em]">Drop-off location</div>
                                    <input
                                        type="text"
                                        placeholder="Different return location"
                                        className="block w-full h-full pl-16 pr-4 pt-6 pb-2 border-none focus:ring-0 focus:outline-none text-base font-black placeholder-slate-400 text-slate-900 bg-transparent"
                                        value={dropoffQuery}
                                        onChange={handleDropoffLocationChange}
                                        onFocus={handleDropoffFocus}
                                        autoComplete="off"
                                    />
                                    {isDropoffSuggestionsOpen && (
                                        <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-3 w-full right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto py-2">
                                            {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-12 gap-2.5 items-stretch">
                            <div className="col-span-4 flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50/70 p-1.5">
                                <DesktopDateField
                                    label="Pick-up"
                                    value={pickupDate}
                                    onChange={(e) => setPickupDate(e.target.value)}
                                    min={today.toISOString().split('T')[0]}
                                />
                                <DesktopTimeField
                                    label="Time"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                    options={timeOptions}
                                />
                            </div>

                            <div className="col-span-4 flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50/70 p-1.5">
                                <DesktopDateField
                                    label="Drop-off"
                                    value={dropoffDate}
                                    onChange={(e) => setDropoffDate(e.target.value)}
                                    min={pickupDate}
                                />
                                <DesktopTimeField
                                    label="Time"
                                    value={dropoffTime}
                                    onChange={(e) => setDropoffTime(e.target.value)}
                                    options={timeOptions}
                                />
                            </div>

                            <button type="submit" className="col-span-4 h-[68px] rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-black text-lg tracking-tight shadow-[0_20px_44px_rgba(37,99,235,0.32)] transition-all hover:shadow-[0_24px_48px_rgba(37,99,235,0.4)] active:scale-[0.99] flex items-center justify-center gap-2">
                                <SearchIcon className="w-5 h-5" />
                                Search available cars
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-white/70 px-4 py-3">
                        <div className="flex items-center gap-5">
                            <label className="flex items-center text-[11px] font-black text-slate-600 cursor-pointer select-none uppercase tracking-[0.14em]">
                                <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-4 w-4 rounded border border-slate-300 bg-white text-blue-600 focus:ring-0 mr-2" />
                                Different drop-off
                            </label>
                            <label className="flex items-center text-[11px] font-black text-slate-600 cursor-pointer select-none uppercase tracking-[0.14em]">
                                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border border-slate-300 bg-white text-blue-600 focus:ring-0 mr-2" />
                                Driver age 30 - 65
                            </label>
                        </div>
                        <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">
                            Free cancellation on most rentals
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
};

export default SearchWidget;
