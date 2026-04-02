import * as React from 'react';
import { MapPin, Calendar, Clock, Plane, Building, LoaderCircle, Search as SearchIcon, ArrowLeft, History, ChevronDown } from 'lucide-react';
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
          <div className="p-4 text-sm text-slate-500 text-center flex items-center justify-center gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-slate-500 text-center">{error}</p>
        ) : suggestions.length > 0 ? (
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion.value + suggestion.label}>
                <button
                  type="button"
                  onClick={() => handler(suggestion)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
                >
                  <div className="flex-shrink-0">{getLocationIcon(suggestion.type)}</div>
                  <div><span className="font-semibold">{suggestion.label}</span></div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-slate-500 text-center">No results found.</p>
        )}
      </>
    );

    // --- NEW DESKTOP DATE/TIME FIELDS (reliable) ---
    const DesktopDateField = ({ label, value, onChange, min }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: string }) => (
        <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Calendar className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <label className="absolute top-2 left-10 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">{label}</label>
            <input
                type="date"
                value={value}
                onChange={onChange}
                min={min}
                className="w-full h-16 pt-5 pb-1 pl-10 pr-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none text-base font-black text-slate-900 cursor-pointer transition-all shadow-sm"
                style={{ colorScheme: 'light' }}
            />
        </div>
    );

    const DesktopTimeField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) => (
        <div className="relative w-32 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Clock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <label className="absolute top-2 left-10 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full h-16 pt-5 pb-1 pl-10 pr-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none text-base font-black text-slate-900 cursor-pointer appearance-none transition-all shadow-sm"
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
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl relative z-10 border border-white/20">
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                    {/* Pick-up location button */}
                    <button
                        type="button"
                        onClick={() => openSearchOverlay('pickup')}
                        className="relative h-14 bg-slate-50/80 rounded-2xl border border-slate-200/50 flex items-center w-full text-left px-4 focus:outline-none active:bg-slate-100 transition-all hover:bg-slate-100/80"
                    >
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <div className="flex-shrink-0 text-blue-600">
                                {getLocationIcon(pickupSelection?.type || '', 'w-6 h-6')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pick-up Location</div>
                                <div className="font-bold text-slate-900 text-base truncate">
                                    {pickupSelection?.label || pickupQuery || 'City, airport, or station'}
                                </div>
                            </div>
                            <div className="text-slate-400 flex-shrink-0">
                                <SearchIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </button>

                    {/* Drop-off location button */}
                    {differentDropoff && (
                        <button
                            type="button"
                            onClick={() => openSearchOverlay('dropoff')}
                            className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center w-full text-left px-3 focus:outline-none active:bg-slate-100 transition-colors"
                        >
                            <div className="flex items-center gap-2 w-full min-w-0">
                                <div className="flex-shrink-0">
                                    {getLocationIcon(dropoffSelection?.type || '', 'w-5 h-5')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Drop-off Location</div>
                                    <div className="font-bold text-slate-900 text-base truncate">
                                        {dropoffSelection?.label || dropoffQuery || 'City, airport, or station'}
                                    </div>
                                </div>
                                <div className="text-slate-400 flex-shrink-0">
                                    <SearchIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </button>
                    )}

                    {/* Date Row */}
                    <div className="flex gap-3">
                        <div className="relative h-14 bg-slate-50/80 rounded-2xl border border-slate-200/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 flex items-center transition-all">
                            <div className="pl-4 flex items-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1.5 left-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pick-up Date</label>
                                <input
                                    type="date"
                                    value={pickupDate}
                                    onChange={e => setPickupDate(e.target.value)}
                                    min={today.toISOString().split('T')[0]}
                                    className="w-full h-full bg-transparent pl-3 pt-4 pb-1 text-sm font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer text-[16px]"
                                />
                            </div>
                        </div>
                        <div className="relative h-14 bg-slate-50/80 rounded-2xl border border-slate-200/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 flex items-center transition-all">
                            <div className="pl-4 flex items-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1.5 left-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop-off Date</label>
                                <input
                                    type="date"
                                    value={dropoffDate}
                                    onChange={e => setDropoffDate(e.target.value)}
                                    min={pickupDate}
                                    className="w-full h-full bg-transparent pl-3 pt-4 pb-1 text-sm font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer text-[16px]"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Time Row */}
                    <div className="flex gap-3">
                        <div className="relative h-14 bg-slate-50/80 rounded-2xl border border-slate-200/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 flex items-center transition-all">
                            <div className="pl-4 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1.5 left-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pick-up Time</label>
                                <select
                                    value={pickupTime}
                                    onChange={e => setPickupTime(e.target.value)}
                                    className="w-full h-full bg-transparent pl-3 pt-4 pb-1 text-sm font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                >
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="relative h-14 bg-slate-50/80 rounded-2xl border border-slate-200/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 flex items-center transition-all">
                            <div className="pl-4 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1.5 left-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop-off Time</label>
                                <select
                                    value={dropoffTime}
                                    onChange={e => setDropoffTime(e.target.value)}
                                    className="w-full h-full bg-transparent pl-3 pt-4 pb-1 text-sm font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                >
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black py-4 rounded-2xl text-base shadow-xl shadow-green-200/50 mt-1 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <SearchIcon className="w-5 h-5" />
                        Search Deals
                    </button>
                </form>
                
                <div className="mt-3 flex flex-col gap-2 px-1">
                    <label className="flex items-center text-xs font-medium text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={differentDropoff} onChange={(e) => setDifferentDropoff(e.target.checked)} className="h-4 w-4 rounded bg-slate-100 text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border border-slate-300" />
                        Drop car off at different location
                    </label>
                    <label className="flex items-center text-xs font-medium text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-slate-100 text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border border-slate-300" />
                        Driver aged between 30 - 65?
                    </label>
                </div>
            </div>
        </div>

        {/* --- PROFESSIONAL SEARCH OVERLAY (full-screen) --- */}
        <SearchOverlay
            isOpen={isSearchOverlayOpen}
            onClose={closeSearchOverlay}
            onSelectLocation={handleOverlaySelect}
            recentLocations={recentLocations}
            saveRecentLocation={saveRecentLocation}
        />

        {/* --- DESKTOP WIDGET (professional two-row version) --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] relative z-10 border border-white/40 max-w-7xl mx-auto">
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                    {/* Row 1: Locations */}
                    <div className="flex flex-row items-center gap-3">
                        <div className={`relative h-16 bg-slate-50/50 rounded-2xl hover:bg-slate-100/80 transition-all border border-slate-200/50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 group shadow-sm`}>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                {getLocationIcon(pickupSelection?.type || '', 'w-6 h-6 group-focus-within:text-blue-500')}
                            </div>
                            <div className="absolute top-2 left-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pick-up Location</div>
                            <input 
                                type="text" 
                                placeholder="City or Airport" 
                                className="block w-full h-full pl-12 pr-4 pt-5 pb-1 border-none focus:ring-0 focus:outline-none text-sm font-black placeholder-slate-400 text-slate-900 bg-transparent" 
                                value={pickupQuery} 
                                onChange={handleLocationChange} 
                                onFocus={handleFocus} 
                                autoComplete="off" 
                                required 
                            />
                            {isSuggestionsOpen && (
                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-3 w-full left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto py-2">
                                    {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                </div>
                            )}
                        </div>

                        {differentDropoff && (
                            <div className="relative h-16 bg-slate-50/50 rounded-2xl hover:bg-slate-100/80 transition-all border border-slate-200/50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 group shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                    {getLocationIcon(dropoffSelection?.type || '', 'w-6 h-6 group-focus-within:text-blue-500')}
                                </div>
                                <div className="absolute top-2 left-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop-off Location</div>
                                <input
                                    type="text"
                                    placeholder="Drop-off Location"
                                    className="block w-full h-full pl-12 pr-4 pt-5 pb-1 border-none focus:ring-0 focus:outline-none text-sm font-black placeholder-slate-400 text-slate-900 bg-transparent"
                                    value={dropoffQuery}
                                    onChange={handleDropoffLocationChange}
                                    onFocus={handleDropoffFocus}
                                    autoComplete="off"
                                />
                                {isDropoffSuggestionsOpen && (
                                    <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-3 w-full right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto py-2">
                                        {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Row 2: Date/Time & Search */}
                    <div className="flex flex-row items-center gap-3">
                        {/* Pickup Date/Time */}
                        <div className="flex-1 flex flex-row items-center gap-1 bg-slate-50/30 p-1 rounded-2xl border border-slate-200/30">
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
                        
                        {/* Dropoff Date/Time */}
                        <div className="flex-1 flex flex-row items-center gap-1 bg-slate-50/30 p-1 rounded-2xl border border-slate-200/30">
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

                        <button type="submit" className="h-16 px-12 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center text-lg tracking-tight group min-w-[220px]">
                            <SearchIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                            Search Deals
                        </button>
                    </div>
                </form>
                
                <div className="mt-2 flex items-center gap-6 px-4">
                    <label className="flex items-center text-[11px] font-bold text-slate-500 cursor-pointer select-none hover:text-slate-900 transition-colors uppercase tracking-widest">
                        <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-4 w-4 rounded bg-slate-100 text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border border-slate-300" />
                        Different Drop-off
                    </label>
                    <label className="flex items-center text-[11px] font-bold text-slate-500 cursor-pointer select-none hover:text-slate-900 transition-colors uppercase tracking-widest">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-slate-100 text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border border-slate-300" />
                        Driver Age 30-65
                    </label>
                </div>
            </div>
        </div>
        </>
    )
};

export default SearchWidget;
