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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-[#008009] transition-colors" />
            </div>
            <label className="absolute top-1 left-9 text-[9px] font-bold text-slate-500 uppercase tracking-wider z-10">{label}</label>
            <input
                type="date"
                value={value}
                onChange={onChange}
                min={min}
                className="w-full h-14 pt-4 pb-1 pl-9 pr-3 rounded-xl border border-transparent bg-slate-50 group-hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-[#008009]/10 focus:border-[#008009] focus:outline-none text-base font-bold text-slate-900 cursor-pointer transition-all"
                style={{ colorScheme: 'light' }}
            />
        </div>
    );

    const DesktopTimeField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) => (
        <div className="relative w-32 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Clock className="w-4 h-4 text-slate-400 group-focus-within:text-[#008009] transition-colors" />
            </div>
            <label className="absolute top-1 left-9 text-[9px] font-bold text-slate-500 uppercase tracking-wider z-10">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full h-14 pt-4 pb-1 pl-9 pr-8 rounded-xl border border-transparent bg-slate-50 group-hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-[#008009]/10 focus:border-[#008009] focus:outline-none text-base font-bold text-slate-900 cursor-pointer appearance-none transition-all"
            >
                {options.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
        </div>
    );

    return (
        <>
        {/* --- MOBILE WIDGET --- */}
        <div className="lg:hidden w-full px-0" ref={mobileWidgetRef}>
            <div className="bg-white p-5 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 border border-slate-100/50">
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                    {/* Pick-up location button */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Pick-up Location</label>
                        <button
                            type="button"
                            onClick={() => openSearchOverlay('pickup')}
                            className="relative h-16 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center w-full text-left px-4 focus:outline-none active:scale-[0.98] transition-all hover:border-[#008009]/50 shadow-sm"
                        >
                            <div className="flex items-center gap-4 w-full min-w-0">
                                <div className="flex-shrink-0 bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                                    {getLocationIcon(pickupSelection?.type || '', 'w-6 h-6')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-extrabold text-slate-900 text-[16px] truncate leading-tight">
                                        {pickupSelection?.label || pickupQuery || 'City, airport, or station'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Where do you want to start?</div>
                                </div>
                                <div className="text-[#008009] flex-shrink-0 bg-emerald-50 p-2 rounded-full">
                                    <SearchIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Drop-off location button */}
                    {differentDropoff && (
                        <div className="flex flex-col gap-1 -mt-1 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Drop-off Location</label>
                            <button
                                type="button"
                                onClick={() => openSearchOverlay('dropoff')}
                                className="relative h-16 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center w-full text-left px-4 focus:outline-none active:scale-[0.98] transition-all hover:border-[#008009]/50 shadow-sm"
                            >
                                <div className="flex items-center gap-4 w-full min-w-0">
                                    <div className="flex-shrink-0 bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                                        {getLocationIcon(dropoffSelection?.type || '', 'w-6 h-6')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-extrabold text-slate-900 text-[16px] truncate leading-tight">
                                            {dropoffSelection?.label || dropoffQuery || 'City, airport, or station'}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Where do you want to end?</div>
                                    </div>
                                    <div className="text-[#008009] flex-shrink-0 bg-emerald-50 p-2 rounded-full">
                                        <SearchIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Date/Time Section */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Pick-up Date & Time</label>
                            <div className="relative bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col transition-all focus-within:border-[#008009]/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008009]/5 shadow-sm overflow-hidden">
                                <div className="p-3 pb-2 flex flex-col border-b border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-3.5 h-3.5 text-[#008009]" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Date</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={pickupDate}
                                        onChange={e => setPickupDate(e.target.value)}
                                        min={today.toISOString().split('T')[0]}
                                        className="w-full bg-transparent p-0 text-[15px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div className="p-3 pt-2 flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-[#008009]" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Time</span>
                                    </div>
                                    <select
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                        className="w-full bg-transparent p-0 text-[15px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                    >
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Drop-off Date & Time</label>
                            <div className="relative bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col transition-all focus-within:border-[#008009]/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008009]/5 shadow-sm overflow-hidden">
                                <div className="p-3 pb-2 flex flex-col border-b border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-3.5 h-3.5 text-[#008009]" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Date</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={dropoffDate}
                                        onChange={e => setDropoffDate(e.target.value)}
                                        min={pickupDate}
                                        className="w-full bg-transparent p-0 text-[15px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div className="p-3 pt-2 flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-[#008009]" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Time</span>
                                    </div>
                                    <select
                                        value={dropoffTime}
                                        onChange={e => setDropoffTime(e.target.value)}
                                        className="w-full bg-transparent p-0 text-[15px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                    >
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-1 px-1">
                        <label className="flex items-center text-[13px] font-extrabold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-5 w-5 rounded-md border-2 border-slate-300 text-[#008009] focus:ring-0 mr-3" />
                            Different drop-off location
                        </label>
                        <label className="flex items-center text-[13px] font-extrabold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="h-5 w-5 rounded-md border-2 border-slate-300 text-[#008009] focus:ring-0 mr-3" />
                            Driver aged 30 - 65?
                        </label>
                    </div>

                    <button type="submit" className="w-full bg-[#FF9F1C] hover:bg-[#f39200] text-white font-black h-16 rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,159,28,0.4)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 mt-3 text-lg tracking-tight">
                        <SearchIcon className="w-6 h-6 stroke-[3px]" />
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

        {/* --- DESKTOP WIDGET (professional design) --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] relative z-10 border border-slate-100">
                <form onSubmit={handleSearch} className="flex flex-col gap-5">
                    <div className="flex flex-row items-center gap-4 w-full">
                        <div className={`relative h-16 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all duration-300 border border-slate-200/50 focus-within:border-[#008009] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008009]/10 ${differentDropoff ? 'flex-1' : 'flex-1'} w-full`}>
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                {getLocationIcon(pickupSelection?.type || '', 'w-6 h-6')}
                            </div>
                            <div className="absolute top-2 left-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pick-up Location</div>
                            <input
                                type="text"
                                placeholder="City, airport, or station"
                                className="block w-full h-full pl-12 pr-4 pt-5 pb-1 border-none focus:ring-0 focus:outline-none text-[16px] font-extrabold placeholder-slate-400 text-slate-900 bg-transparent"
                                value={pickupQuery}
                                onChange={handleLocationChange}
                                onFocus={handleFocus}
                                autoComplete="off"
                                required
                            />
                            {isSuggestionsOpen && (
                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-3 w-[600px] left-0 bg-white border border-slate-100 rounded-3xl shadow-[0_30px_60px_-10px_rgba(0,0,0,0.2)] z-50 max-h-[400px] overflow-y-auto">
                                    {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                </div>
                            )}
                        </div>
                        {differentDropoff && (
                            <div className="relative h-16 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all duration-300 border border-slate-200/50 focus-within:border-[#008009] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008009]/10 flex-1 w-full animate-in fade-in slide-in-from-left-4">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    {getLocationIcon(dropoffSelection?.type || '', 'w-6 h-6')}
                                </div>
                                <div className="absolute top-2 left-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop-off Location</div>
                                <input
                                    type="text"
                                    placeholder="Enter drop-off city"
                                    className="block w-full h-full pl-12 pr-4 pt-5 pb-1 border-none focus:ring-0 focus:outline-none text-[16px] font-extrabold placeholder-slate-400 text-slate-900 bg-transparent"
                                    value={dropoffQuery}
                                    onChange={handleDropoffLocationChange}
                                    onFocus={handleDropoffFocus}
                                    autoComplete="off"
                                />
                                {isDropoffSuggestionsOpen && (
                                    <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-3 w-[600px] right-0 bg-white border border-slate-100 rounded-3xl shadow-[0_30px_60px_-10px_rgba(0,0,0,0.2)] z-50 max-h-[400px] overflow-y-auto">
                                        {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-row items-center gap-4 w-full">
                        <div className="flex-[2] flex flex-row gap-3">
                            <DesktopDateField
                                label="Pick-up Date"
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
                        <div className="flex-[2] flex flex-row gap-3">
                            <DesktopDateField
                                label="Drop-off Date"
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
                        <button type="submit" className="h-16 px-12 bg-[#FF9F1C] hover:bg-[#f39200] text-white font-black rounded-2xl shadow-[0_15px_30px_-5px_rgba(255,159,28,0.4)] transition-all active:scale-95 flex items-center justify-center text-xl whitespace-nowrap tracking-tight">
                            Search Deals
                        </button>
                    </div>
                </form>

                <div className="mt-5 flex items-center gap-8 px-2 text-[12px] uppercase tracking-widest font-black">
                    <label className="flex items-center text-slate-500 cursor-pointer select-none hover:text-[#008009] transition-colors group">
                        <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-5 w-5 rounded-lg border-2 border-slate-200 text-[#008009] focus:ring-0 mr-3 group-hover:border-[#008009]/40 transition-colors" />
                        Drop car off at different location
                    </label>
                    <label className="flex items-center text-slate-500 cursor-pointer select-none hover:text-[#008009] transition-colors group">
                        <input type="checkbox" defaultChecked className="h-5 w-5 rounded-lg border-2 border-slate-200 text-[#008009] focus:ring-0 mr-3 group-hover:border-[#008009]/40 transition-colors" />
                        Driver aged 30 - 65?
                    </label>
                </div>
            </div>
        </div>
        </>
    )
};

export default SearchWidget;
