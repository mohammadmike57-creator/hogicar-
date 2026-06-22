import * as React from 'react';
import { MapPin, Calendar, Clock, Plane, Building, LoaderCircle, Search as SearchIcon, ChevronDown, X } from 'lucide-react';
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
    accentColor?: string;
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ initialValues, onSearch, showTitle = false, accentColor }) => {
    const today = new Date();
    const nextThreeDays = new Date(today);
    nextThreeDays.setDate(today.getDate() + 3);

    const [pickupQuery, setPickupQuery] = React.useState(initialValues?.pickupName || initialValues?.location || '');
    const [pickupSelection, setPickupSelection] = React.useState<LocationSuggestion | null>(initialValues?.pickup ? { label: initialValues.pickupName || initialValues.location || '', value: initialValues.pickup, type: 'airport' as any } : null);
    
    const [differentDropoff, setDifferentDropoff] = React.useState(initialValues?.differentDropoff || false);
    
    const [dropoffQuery, setDropoffQuery] = React.useState(initialValues?.dropoffName || initialValues?.dropoffLocation || '');
    const [dropoffSelection, setDropoffSelection] = React.useState<LocationSuggestion | null>(initialValues?.dropoff ? { label: initialValues.dropoffName || initialValues.dropoffLocation || '', value: initialValues.dropoff, type: 'airport' as any } : null);

    const [pickupDate, setPickupDate] = React.useState(initialValues?.pickupDate || today.toISOString().split('T')[0]);
    const [dropoffDate, setDropoffDate] = React.useState(initialValues?.dropoffDate || nextThreeDays.toISOString().split('T')[0]);
    const [pickupTime, setPickupTime] = React.useState(initialValues?.startTime || '10:00');
    const [dropoffTime, setDropoffTime] = React.useState(initialValues?.endTime || '10:00');

    // Sync state when initialValues change (important for dynamic SEO routes)
    React.useEffect(() => {
        if (initialValues) {
            if (initialValues.pickupName !== undefined) setPickupQuery(initialValues.pickupName || '');
            if (initialValues.pickup !== undefined) {
                setPickupSelection({
                    label: initialValues.pickupName || '',
                    value: initialValues.pickup,
                    type: 'airport' as any,
                    iataCode: initialValues.pickup,
                    name: initialValues.pickupName || '',
                    municipality: '',
                    countryCode: ''
                });
            }
            if (initialValues.dropoffName !== undefined) setDropoffQuery(initialValues.dropoffName || '');
            if (initialValues.dropoff !== undefined) {
                setDropoffSelection({
                    label: initialValues.dropoffName || '',
                    value: initialValues.dropoff,
                    type: 'airport' as any,
                    iataCode: initialValues.dropoff,
                    name: initialValues.dropoffName || '',
                    municipality: '',
                    countryCode: ''
                });
            }
            if (initialValues.pickupDate) setPickupDate(initialValues.pickupDate);
            if (initialValues.dropoffDate) setDropoffDate(initialValues.dropoffDate);
            if (initialValues.startTime) setPickupTime(initialValues.startTime);
            if (initialValues.endTime) setDropoffTime(initialValues.endTime);
            if (initialValues.differentDropoff !== undefined) setDifferentDropoff(initialValues.differentDropoff);
        }
    }, [initialValues]);

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

        if (value.length < 2) {
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
        
        if (value.length < 2) {
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-card bg-slate-100 border border-slate-200 flex-shrink-0">{getLocationIcon(suggestion.type)}</div>
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
    const DesktopDateField = ({ label, value, onChange, min, className = "flex-1" }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: string, className?: string }) => (
        <div className={`relative ${className} min-w-0 group bg-white h-[72px]`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Calendar className="w-6 h-6 text-slate-400 group-focus-within:text-accent transition-colors" />
            </div>
            <div className="pl-12 pt-2.5 pb-1 flex flex-col h-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</label>
                <input
                    type="date"
                    value={value}
                    onChange={onChange}
                    min={min}
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] font-extrabold text-slate-900 cursor-pointer p-0 -mt-1"
                    style={{ colorScheme: 'light' }}
                />
            </div>
        </div>
    );

    const DesktopTimeField = ({ label, value, onChange, options, className = "flex-1" }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[], className?: string }) => (
        <div className={`relative ${className} min-w-0 group bg-white h-[72px]`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Clock className="w-6 h-6 text-slate-400 group-focus-within:text-accent transition-colors" />
            </div>
            <div className="pl-11 pt-2.5 pb-1 flex flex-col h-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</label>
                <select
                    value={value}
                    onChange={onChange}
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] font-extrabold text-slate-900 cursor-pointer p-0 -mt-1 appearance-none"
                >
                    {options.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>
    );

    return (
        <>
        {/* --- MOBILE WIDGET --- */}
        <div className="lg:hidden w-full px-1.5" ref={mobileWidgetRef}>
            <div className="bg-white p-3.5 sm:p-5 rounded-card shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] relative z-10 border border-slate-100/50">
                <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
                    {/* Pick-up location button */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.12em] ml-1">Pick-up Location</label>
                        <button
                            type="button"
                            onClick={() => openSearchOverlay('pickup')}
                            className="relative h-[62px] bg-white rounded-card border border-slate-200/60 flex items-center w-full text-left px-4 focus:outline-none active:scale-[0.98] transition-all hover:border-accent/50 shadow-sm"
                        >
                            <div className="flex items-center gap-3 w-full min-w-0">
                                <div className="flex-shrink-0 bg-white p-1.5 rounded-card shadow-sm border border-slate-100">
                                    {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-extrabold text-slate-900 text-[14px] truncate leading-tight">
                                        {pickupSelection?.label || pickupQuery || 'City, airport, or station'}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Where do you want to start?</div>
                                </div>
                                <div className="text-accent flex-shrink-0 bg-emerald-50 p-1.5 rounded-full">
                                    <SearchIcon className="w-3 h-3" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Drop-off location button */}
                    {differentDropoff && (
                        <div className="flex flex-col gap-1 -mt-1 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.15em] ml-1">Drop-off Location</label>
                            <button
                                type="button"
                                onClick={() => openSearchOverlay('dropoff')}
                                className="relative h-[62px] bg-slate-50 rounded-card border border-slate-200/60 flex items-center w-full text-left px-4 focus:outline-none active:scale-[0.98] transition-all hover:border-accent/50 shadow-sm"
                            >
                                <div className="flex items-center gap-3 w-full min-w-0">
                                    <div className="flex-shrink-0 bg-white p-1.5 rounded-card shadow-sm border border-slate-100">
                                        {getLocationIcon(dropoffSelection?.type || '', 'w-5 h-5')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-extrabold text-slate-900 text-[14px] truncate leading-tight">
                                            {dropoffSelection?.label || dropoffQuery || 'City, airport, or station'}
                                        </div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Where do you want to end?</div>
                                    </div>
                                    <div className="text-accent flex-shrink-0 bg-emerald-50 p-1.5 rounded-full">
                                        <SearchIcon className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Date/Time Section */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.12em] ml-1">Pick-up Date & Time</label>
                            <div className="relative bg-slate-50 rounded-card border border-slate-200/60 flex flex-col transition-all focus-within:border-accent/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/5 shadow-sm overflow-hidden">
                                <div className="p-2 pb-1 flex flex-col border-b border-slate-100">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Calendar className="w-3 h-3 text-accent" />
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Date</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={pickupDate}
                                        onChange={e => setPickupDate(e.target.value)}
                                        min={today.toISOString().split('T')[0]}
                                        className="w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div className="p-2 pt-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Clock className="w-3 h-3 text-accent" />
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Time</span>
                                    </div>
                                    <select
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                        className="w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                    >
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.12em] ml-1">Drop-off Date & Time</label>
                            <div className="relative bg-slate-50 rounded-card border border-slate-200/60 flex flex-col transition-all focus-within:border-accent/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/5 shadow-sm overflow-hidden">
                                <div className="p-2 pb-1 flex flex-col border-b border-slate-100">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Calendar className="w-3 h-3 text-accent" />
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Date</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={dropoffDate}
                                        onChange={e => setDropoffDate(e.target.value)}
                                        min={pickupDate}
                                        className="w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div className="p-2 pt-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Clock className="w-3 h-3 text-accent" />
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Time</span>
                                    </div>
                                    <select
                                        value={dropoffTime}
                                        onChange={e => setDropoffTime(e.target.value)}
                                        className="w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                    >
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5 mt-1 px-1">
                        <label className="flex items-center text-[12px] font-extrabold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-4.5 w-4.5 rounded border-2 border-slate-300 text-accent focus:ring-0 mr-2.5" />
                            Different drop-off location
                        </label>
                        <label className="flex items-center text-[12px] font-extrabold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="h-4.5 w-4.5 rounded border-2 border-slate-300 text-accent focus:ring-0 mr-2.5" />
                            Driver aged 30 - 65?
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full text-white font-extrabold h-12 rounded-card active:scale-[0.97] transition-all flex items-center justify-center gap-3 mt-1 text-[15px] tracking-tight"
                        style={{ backgroundColor: accentColor || '#FF9F1C', boxShadow: `0 10px 25px -5px ${accentColor ? accentColor + '66' : 'rgba(255,159,28,0.4)'}` }}
                    >
                        <SearchIcon className="w-4.5 h-4.5 stroke-[3px]" />
                        Search Deals
                    </button>
                </form>
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

        {/* --- DESKTOP WIDGET (MATCHING IMAGE) --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="max-w-[1280px] mx-auto">
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                    <div className="flex flex-col bg-[#FFB703] p-[3px] rounded-[10px] gap-[3px]">
                        {/* FIRST ROW: Pickup & Optional Dropoff */}
                        <div className={`flex flex-1 items-center bg-white divide-x divide-slate-200 ${differentDropoff ? 'rounded-t-[7px]' : 'rounded-[7px]'}`}>
                            {/* Pick-up Location */}
                            <div className={`relative flex-[14] h-[72px] min-w-0 group ${!differentDropoff ? 'rounded-l-[7px]' : 'rounded-tl-[7px]'}`}>
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <SearchIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="pl-12 pt-2.5 pb-1 flex flex-col h-full pr-10">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Pick-up location</label>
                                    <input
                                        type="text"
                                        placeholder="City, airport, or station"
                                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] font-extrabold text-slate-900 placeholder-slate-400 p-0 -mt-1 truncate"
                                        value={pickupQuery}
                                        onChange={handleLocationChange}
                                        onFocus={handleFocus}
                                        autoComplete="off"
                                        required
                                    />
                                </div>
                                {pickupQuery && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setPickupQuery(''); setPickupSelection(null); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                )}
                                {isSuggestionsOpen && (
                                    <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-2 w-[500px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                                        {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                    </div>
                                )}
                            </div>

                            {/* Drop-off Location (if different) */}
                            {differentDropoff && (
                                <div className={`relative flex-[14] h-[72px] min-w-0 group bg-slate-50/50 rounded-tr-[7px]`}>
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <SearchIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="pl-12 pt-2.5 pb-1 flex flex-col h-full pr-10">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Drop-off location</label>
                                        <input
                                            type="text"
                                            placeholder="City, airport, or station"
                                            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] font-extrabold text-slate-900 placeholder-slate-400 p-0 -mt-1 truncate"
                                            value={dropoffQuery}
                                            onChange={handleDropoffLocationChange}
                                            onFocus={handleDropoffFocus}
                                            autoComplete="off"
                                            required={differentDropoff}
                                        />
                                    </div>
                                    {dropoffQuery && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setDropoffQuery(''); setDropoffSelection(null); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    )}
                                    {isDropoffSuggestionsOpen && (
                                        <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full right-0 mt-2 w-[500px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                                            {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!differentDropoff && (
                                <>
                                    <DesktopDateField
                                        label="Pick-up date"
                                        value={pickupDate}
                                        onChange={(e) => setPickupDate(e.target.value)}
                                        min={today.toISOString().split('T')[0]}
                                        className="flex-[5]"
                                    />
                                    <DesktopTimeField
                                        label="Time"
                                        value={pickupTime}
                                        onChange={(e) => setPickupTime(e.target.value)}
                                        options={timeOptions}
                                        className="flex-[3]"
                                    />
                                    <DesktopDateField
                                        label="Drop-off date"
                                        value={dropoffDate}
                                        onChange={(e) => setDropoffDate(e.target.value)}
                                        min={pickupDate}
                                        className="flex-[5]"
                                    />
                                    <DesktopTimeField
                                        label="Time"
                                        value={dropoffTime}
                                        onChange={(e) => setDropoffTime(e.target.value)}
                                        options={timeOptions}
                                        className="flex-[3]"
                                    />
                                    <div className="p-[5px] flex items-center justify-center bg-white h-[72px] rounded-r-[7px]">
                                        <button 
                                            type="submit" 
                                            className="h-full px-10 bg-[#008009] hover:bg-[#006407] text-white font-extrabold rounded-[5px] transition-all active:scale-[0.98] flex items-center justify-center text-[19px] tracking-tight"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SECOND ROW: Dates, Times, Search (only if differentDropoff) */}
                        {differentDropoff && (
                            <div className="flex flex-1 items-center bg-white rounded-b-[7px] divide-x divide-slate-200 overflow-hidden">
                                <DesktopDateField
                                    label="Pick-up date"
                                    value={pickupDate}
                                    onChange={(e) => setPickupDate(e.target.value)}
                                    min={today.toISOString().split('T')[0]}
                                    className="flex-[5]"
                                />
                                <DesktopTimeField
                                    label="Time"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                    options={timeOptions}
                                    className="flex-[3]"
                                />
                                <DesktopDateField
                                    label="Drop-off date"
                                    value={dropoffDate}
                                    onChange={(e) => setDropoffDate(e.target.value)}
                                    min={pickupDate}
                                    className="flex-[5]"
                                />
                                <DesktopTimeField
                                    label="Time"
                                    value={dropoffTime}
                                    onChange={(e) => setDropoffTime(e.target.value)}
                                    options={timeOptions}
                                    className="flex-[3]"
                                />
                                <div className="p-[5px] flex-[6] flex items-center justify-center bg-white h-[72px]">
                                    <button 
                                        type="submit" 
                                        className="h-full w-full bg-[#008009] hover:bg-[#006407] text-white font-extrabold rounded-[5px] transition-all active:scale-[0.98] flex items-center justify-center text-[19px] tracking-tight"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Checkboxes */}
                    <div className="flex items-center gap-8 px-2 text-[12px] uppercase tracking-widest font-extrabold text-white">
                        <label className="flex items-center cursor-pointer select-none hover:text-white/80 transition-colors group">
                            <input 
                                type="checkbox" 
                                onChange={(e) => setDifferentDropoff(e.target.checked)} 
                                checked={differentDropoff} 
                                className="h-5 w-5 rounded border-2 border-white/20 bg-white/10 text-accent focus:ring-0 mr-3 transition-colors" 
                            />
                            Drop car off at different location
                        </label>
                        <label className="flex items-center cursor-pointer select-none hover:text-white/80 transition-colors group">
                            <input 
                                type="checkbox" 
                                defaultChecked 
                                className="h-5 w-5 rounded border-2 border-white/20 bg-white/10 text-accent focus:ring-0 mr-3 transition-colors" 
                            />
                            Driver aged 30 - 65?
                        </label>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
};

export default SearchWidget;
