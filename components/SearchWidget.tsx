import * as React from 'react';
import { MapPin, Calendar, Clock, Plane, Building, LoaderCircle, Search as SearchIcon, ArrowLeft, History } from 'lucide-react';
import { fetchLocations, LocationSuggestion } from '../api';

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

    // Modal state
    const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
    const [modalType, setModalType] = React.useState<'pickup' | 'dropoff'>('pickup');
    const [modalSearchQuery, setModalSearchQuery] = React.useState('');
    const [modalResults, setModalResults] = React.useState<LocationSuggestion[]>([]);
    const [modalLoading, setModalLoading] = React.useState(false);
    const [recentLocations, setRecentLocations] = React.useState<LocationSuggestion[]>([]);
    const [shouldFocusInput, setShouldFocusInput] = React.useState(false);
    const modalContainerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const modalDebounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>();

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

    // Modal search logic with debounce
    React.useEffect(() => {
        if (!isLocationModalOpen) return;
        if (modalSearchQuery.length < 2) {
            setModalResults([]);
            setModalLoading(false);
            return;
        }
        setModalLoading(true);
        if (modalDebounceTimer.current) clearTimeout(modalDebounceTimer.current);
        modalDebounceTimer.current = setTimeout(async () => {
            try {
                const results = await fetchLocations(modalSearchQuery);
                setModalResults(results);
            } catch (err) {
                setModalResults([]);
            } finally {
                setModalLoading(false);
            }
        }, 300);
        return () => {
            if (modalDebounceTimer.current) clearTimeout(modalDebounceTimer.current);
        };
    }, [modalSearchQuery, isLocationModalOpen]);

    // Professional open function (autoFocus + scroll + guaranteed focus)
    const openLocationModal = (type: 'pickup' | 'dropoff') => {
        setModalType(type);
        setModalSearchQuery('');
        setModalResults([]);
        setShouldFocusInput(true);
        setIsLocationModalOpen(true);

        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            if (modalContainerRef.current) {
                modalContainerRef.current.scrollTop = 0;
            }
        });

        // Extra guarantee for all browsers
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 50);
    };

    const closeLocationModal = () => {
        setIsLocationModalOpen(false);
        document.body.style.overflow = '';
        setShouldFocusInput(false);
    };

    const selectLocation = (loc: LocationSuggestion) => {
        // Save to recent searches
        setRecentLocations(prev => {
            const exists = prev.find(p => p.value === loc.value);
            if (exists) return prev;
            const updated = [loc, ...prev].slice(0, 5);
            saveRecentLocations(updated);
            return updated;
        });

        if (modalType === 'pickup') {
            setPickupQuery(loc.label);
            setPickupSelection(loc);
        } else {
            setDropoffQuery(loc.label);
            setDropoffSelection(loc);
        }
        closeLocationModal();
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

    // Skeleton loading component
    const SkeletonItem = () => (
        <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-slate-200 rounded w-1/3"></div>
            </div>
        </div>
    );

    // Desktop date/time fields (unchanged)
    const DateField = ({ label, value, onChange, min, id }: any) => (
        <label htmlFor={id} className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 cursor-pointer block">
            <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="pl-4 flex items-center">
                    <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 ml-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className="text-base font-bold text-slate-900">{formatDateForDisplay(value)}</div>
                </div>
            </div>
            <input
                type="date"
                id={id}
                value={value}
                onChange={onChange}
                min={min}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </label>
    );

    const TimeField = ({ label, value, onChange, options, id }: any) => (
        <label htmlFor={id} className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 cursor-pointer block">
            <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="pl-4 flex items-center">
                    <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 ml-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className="text-base font-bold text-slate-900">{value}</div>
                </div>
            </div>
            <select
                id={id}
                value={value}
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
                {options.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
        </label>
    );

    const pickupDateId = React.useId();
    const pickupTimeId = React.useId();
    const dropoffDateId = React.useId();
    const dropoffTimeId = React.useId();

    return (
        <>
        {/* --- MOBILE WIDGET --- */}
        <div className="lg:hidden" ref={mobileWidgetRef}>
            <div className="bg-white p-3 rounded-2xl shadow-2xl relative z-10 border border-slate-200/60">
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                    {/* Pick-up location button */}
                    <button
                        type="button"
                        onClick={() => openLocationModal('pickup')}
                        className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center w-full text-left px-3 focus:outline-none active:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-2 w-full min-w-0">
                            <div className="flex-shrink-0">
                                {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pick-up Location</div>
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
                            onClick={() => openLocationModal('dropoff')}
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
                    <div className="flex gap-2">
                        <div className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 flex items-center">
                            <div className="pl-3 flex items-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pick-up Date</label>
                                <input
                                    type="date"
                                    value={pickupDate}
                                    onChange={e => setPickupDate(e.target.value)}
                                    min={today.toISOString().split('T')[0]}
                                    className="w-full h-full bg-transparent pl-2 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer text-[16px]"
                                />
                            </div>
                        </div>
                        <div className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 flex items-center">
                            <div className="pl-3 flex items-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Drop-off Date</label>
                                <input
                                    type="date"
                                    value={dropoffDate}
                                    onChange={e => setDropoffDate(e.target.value)}
                                    min={pickupDate}
                                    className="w-full h-full bg-transparent pl-2 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer text-[16px]"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Time Row */}
                    <div className="flex gap-2">
                        <div className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 flex items-center">
                            <div className="pl-3 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pick-up Time</label>
                                <select
                                    value={pickupTime}
                                    onChange={e => setPickupTime(e.target.value)}
                                    className="w-full h-full bg-transparent pl-2 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                >
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 flex items-center">
                            <div className="pl-3 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Drop-off Time</label>
                                <select
                                    value={dropoffTime}
                                    onChange={e => setDropoffTime(e.target.value)}
                                    className="w-full h-full bg-transparent pl-2 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                                >
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-[#16a34a] hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base shadow-md mt-1 transition-transform active:scale-95">
                        Search
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

        {/* --- PROFESSIONAL LOCATION MODAL (autoFocus + recent + skeleton) --- */}
        {isLocationModalOpen && (
            <div
                ref={modalContainerRef}
                className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    height: '100dvh',
                    overscrollBehavior: 'contain'
                }}
            >
                {/* Sticky header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={closeLocationModal}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={inputRef}
                                autoFocus={shouldFocusInput}
                                type="text"
                                placeholder="Search location"
                                value={modalSearchQuery}
                                onChange={(e) => setModalSearchQuery(e.target.value)}
                                onFocus={() => setShouldFocusInput(false)}
                                autoCapitalize="off"
                                autoComplete="off"
                                inputMode="search"
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {/* Recent searches */}
                    {modalSearchQuery.length === 0 && recentLocations.length > 0 && (
                        <div className="mt-2">
                            <div className="text-xs font-semibold text-slate-400 px-4 mb-2 flex items-center gap-1">
                                <History className="w-3 h-3" /> Recent searches
                            </div>
                            {recentLocations.map((loc) => (
                                <button
                                    key={loc.value}
                                    onClick={() => selectLocation(loc)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        {getLocationIcon(loc.type, 'w-5 h-5')}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-900 text-base">{loc.label}</div>
                                        <div className="text-xs text-slate-500">{loc.iataCode}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Skeleton loading */}
                    {modalLoading && (
                        <div>
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </div>
                    )}

                    {/* Search results */}
                    {!modalLoading && modalResults.length > 0 && (
                        <div>
                            {modalResults.map((loc) => (
                                <button
                                    key={loc.value}
                                    onClick={() => selectLocation(loc)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        {getLocationIcon(loc.type, 'w-5 h-5')}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-900 text-base">{loc.label}</div>
                                        <div className="text-xs text-slate-500">{loc.iataCode}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!modalLoading && modalSearchQuery.length >= 2 && modalResults.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <MapPin className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-slate-500 text-base">No locations found</p>
                            <p className="text-slate-400 text-sm mt-1">Try a different spelling</p>
                        </div>
                    )}

                    {!modalLoading && modalSearchQuery.length < 2 && recentLocations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <SearchIcon className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-slate-500 text-base">Start typing</p>
                            <p className="text-slate-400 text-sm mt-1">Enter at least 2 letters</p>
                        </div>
                    )}

                    {/* Bottom safe area */}
                    <div style={{ height: 'env(safe-area-inset-bottom)' }} />
                </div>
            </div>
        )}

        {/* --- DESKTOP WIDGET (unchanged) --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="bg-white p-2 rounded-2xl shadow-2xl relative z-10 border border-slate-200/60">
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2 w-full">
                        <div className={`relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 ${differentDropoff ? 'flex-1' : 'flex-1'} w-full`}>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                            </div>
                            <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pick-up</div>
                            <input 
                                type="text" 
                                placeholder="City, airport, or station" 
                                className="block w-full h-full pl-11 pr-4 pt-4 pb-1 border-none focus:ring-0 focus:outline-none text-base font-bold placeholder-slate-400 text-slate-900 bg-transparent" 
                                value={pickupQuery} 
                                onChange={handleLocationChange} 
                                onFocus={handleFocus} 
                                autoComplete="off" 
                                required 
                            />
                            {isSuggestionsOpen && (
                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-2 w-[550px] left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                                    {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                </div>
                            )}
                        </div>

                        {differentDropoff && (
                            <div className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {getLocationIcon(dropoffSelection?.type || '', 'w-5 h-5')}
                                </div>
                                <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Drop-off</div>
                                <input
                                    type="text"
                                    placeholder="Enter drop-off city"
                                    className="block w-full h-full pl-11 pr-4 pt-4 pb-1 border-none focus:ring-0 focus:outline-none text-base font-bold placeholder-slate-400 text-slate-900 bg-transparent"
                                    value={dropoffQuery}
                                    onChange={handleDropoffLocationChange}
                                    onFocus={handleDropoffFocus}
                                    autoComplete="off"
                                />
                                {isDropoffSuggestionsOpen && (
                                    <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-2 w-[550px] left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                                        {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-row items-center gap-2 w-full">
                        <DateField
                            label="Pick-up Date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={today.toISOString().split('T')[0]}
                            id={pickupDateId}
                        />
                        <TimeField
                            label="Pick-up Time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            options={timeOptions}
                            id={pickupTimeId}
                        />
                        <DateField
                            label="Drop-off Date"
                            value={dropoffDate}
                            onChange={(e) => setDropoffDate(e.target.value)}
                            min={pickupDate}
                            id={dropoffDateId}
                        />
                        <TimeField
                            label="Drop-off Time"
                            value={dropoffTime}
                            onChange={(e) => setDropoffTime(e.target.value)}
                            options={timeOptions}
                            id={dropoffTimeId}
                        />
                        <button type="submit" className="h-14 px-8 bg-[#16a34a] hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center text-lg whitespace-nowrap">
                            Search
                        </button>
                    </div>
                </form>
                
                <div className="mt-3 flex items-center gap-6 px-2">
                    <label className="flex items-center text-sm font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors">
                        <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-5 w-5 rounded bg-slate-100 text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border border-slate-300" />
                        Drop car off at different location
                    </label>
                    <label className="flex items-center text-sm font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors">
                        <input type="checkbox" defaultChecked className="h-5 w-5 rounded bg-slate-100 text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border border-slate-300" />
                        Driver aged between 30 - 65?
                    </label>
                </div>
            </div>
        </div>
        </>
    )
};

export default SearchWidget;
