import * as React from 'react';
import { MapPin, Calendar, Clock, Search as SearchIcon, Compass, X, Plane, Building, LoaderCircle } from 'lucide-react';
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

    // Autocomplete state
    const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
    const [defaultSuggestions, setDefaultSuggestions] = React.useState<LocationSuggestion[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
    const [dropoffSuggestions, setDropoffSuggestions] = React.useState<LocationSuggestion[]>([]);
    const [isDropoffSuggestionsOpen, setIsDropoffSuggestionsOpen] = React.useState(false);

    // New state for loading and error handling
    const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
    const [suggestionsError, setSuggestionsError] = React.useState<string | null>(null);
    const [isDropoffLoading, setIsDropoffLoading] = React.useState(false);
    const [dropoffError, setDropoffError] = React.useState<string | null>(null);
    
    const mobileWidgetRef = React.useRef<HTMLDivElement>(null);
    const desktopWidgetRef = React.useRef<HTMLDivElement>(null);
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>();

    // Fetch default locations on mount
    React.useEffect(() => {
        const loadDefaultLocations = async () => {
            try {
                // Fix: Pass an empty string to fetchLocations to get default locations, as it expects one argument.
                // FIX: Pass an empty string to fetchLocations to get default locations, as it expects at least one argument.
                const results = await fetchLocations(''); // No query
                setDefaultSuggestions(results);
                // Also set the main suggestions if input is empty initially
                if (!pickupQuery) {
                    setSuggestions(results);
                }
            } catch (err) {
                setSuggestionsError("Could not load initial locations.");
            }
        };
        loadDefaultLocations();
    }, []); // Empty dependency array means it runs once on mount

    const getLocationIcon = (type: string, sizeClass = 'w-4 h-4') => {
        const lowerType = (type || '').toLowerCase();
        if (lowerType === 'airport') {
            return <Plane className={`${sizeClass} text-green-600`} />;
        }
        if (lowerType === 'city') {
             return <Building className={`${sizeClass} text-amber-700`} />;
        }
        return <MapPin className={`${sizeClass} text-slate-400`} />; // Default fallback
    };


    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPickupQuery(value);
        setPickupSelection(null);
        setSuggestionsError(null);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (value.length < 2) {
            setSuggestions(defaultSuggestions); // Show defaults when clearing input
            setIsSuggestionsOpen(true);
            setIsLoadingSuggestions(false);
            return;
        }
        
        setIsLoadingSuggestions(true);
        setIsSuggestionsOpen(true);

        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await fetchLocations(value);
                setSuggestions(results);
            } catch (err) {
                setSuggestionsError('Locations temporarily unavailable, you can type manually.');
                setSuggestions([]);
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
        if (!pickupQuery) {
            setSuggestions(defaultSuggestions);
            setIsSuggestionsOpen(true);
        } else if ((pickupQuery || '').length > 1 && (suggestions.length > 0 || isLoadingSuggestions || suggestionsError)) {
            setIsSuggestionsOpen(true);
        }
    };

    const handleDropoffLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDropoffQuery(value);
        setDropoffSelection(null);
        setDropoffError(null);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        if (value.length < 2) {
            setDropoffSuggestions(defaultSuggestions); // Also use defaults here
            setIsDropoffSuggestionsOpen(true);
            setIsDropoffLoading(false);
            return;
        }

        setIsDropoffLoading(true);
        setIsDropoffSuggestionsOpen(true);

        debounceTimer.current = setTimeout(async () => {
             try {
                const results = await fetchLocations(value);
                setDropoffSuggestions(results);
            } catch (err) {
                setDropoffError('Locations temporarily unavailable, you can type manually.');
                setDropoffSuggestions([]);
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
        if (!dropoffQuery) {
            setDropoffSuggestions(defaultSuggestions);
            setIsDropoffSuggestionsOpen(true);
        } else if ((dropoffQuery || '').length > 1 && (dropoffSuggestions.length > 0 || isDropoffLoading || dropoffError)) {
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
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

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
            } else if (dropoffQuery) { // Only error if they've typed something but not selected
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

    return (
        <>
        {/* --- START OF NEW MOBILE WIDGET --- */}
        <div className="lg:hidden" ref={mobileWidgetRef}>
            <div className="bg-[#FF9F1C] p-1 rounded-lg shadow-2xl relative z-10">
                <form onSubmit={handleSearch} className="space-y-1">

                    {/* Pick-up location */}
                    <div className="bg-white rounded-md p-2 flex items-center gap-2 relative">
                        <div className="flex-shrink-0">{getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}</div>
                        <div className="w-full border border-slate-200 rounded-md p-1 focus-within:border-slate-200">
                            <label className="text-xs text-slate-500">Pick-up location</label>
                            <input
                                type="text"
                                className="w-full font-bold text-slate-800 text-base bg-transparent border-none focus:ring-0 focus:outline-none p-0"
                                value={pickupQuery}
                                onChange={handleLocationChange}
                                onFocus={handleFocus}
                                autoComplete="off"
                                placeholder="City, airport, or station"
                                required
                            />
                        </div>
                        {isSuggestionsOpen && (
                            <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                               {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                            </div>
                        )}
                    </div>

                    {/* Conditional Drop-off Location */}
                    {differentDropoff && (
                        <div className="bg-white rounded-md p-2 flex items-center gap-2 relative">
                            <div className="flex-shrink-0">{getLocationIcon(dropoffSelection?.type || '', 'w-5 h-5')}</div>
                            <div className="w-full border border-slate-200 rounded-md p-1 focus-within:border-slate-200">
                                <label className="text-xs text-slate-500">Drop-off location</label>
                                <input
                                    type="text"
                                    className="w-full font-bold text-slate-800 text-base bg-transparent border-none focus:ring-0 focus:outline-none p-0"
                                    value={dropoffQuery}
                                    onChange={handleDropoffLocationChange}
                                    onFocus={handleDropoffFocus}
                                    autoComplete="off"
                                    placeholder="City, airport, or station"
                                    required
                                />
                            </div>
                            {isDropoffSuggestionsOpen && (
                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date Row */}
                    <div className="flex gap-1">
                        {/* Pick-up Date */}
                        <div className="bg-white rounded-md p-2 flex items-center gap-2 w-1/2 relative">
                            <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="w-full">
                                <label className="text-xs text-slate-500">Pick-up</label>
                                <p className="font-bold text-slate-800 text-sm">{formatDateForDisplay(pickupDate)}</p>
                                <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={today.toISOString().split('T')[0]} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base" />
                            </div>
                        </div>
                        {/* Drop-off Date */}
                        <div className="bg-white rounded-md p-2 flex items-center gap-2 w-1/2 relative">
                            <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="w-full">
                                <label className="text-xs text-slate-500">Drop-off</label>
                                <p className="font-bold text-slate-800 text-sm">{formatDateForDisplay(dropoffDate)}</p>
                                <input type="date" value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} min={pickupDate} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Time Row */}
                    <div className="flex gap-1">
                        {/* Pick-up Time */}
                        <div className="bg-white rounded-md p-2 flex items-center gap-1 w-1/2 relative">
                            <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="w-full">
                                <label className="text-xs text-slate-500">Pick-up Time</label>
                                <p className="font-bold text-slate-800 text-sm">{pickupTime}</p>
                                <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base">
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        {/* Drop-off Time */}
                        <div className="bg-white rounded-md p-2 flex items-center gap-1 w-1/2 relative">
                            <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="w-full">
                                <label className="text-xs text-slate-500">Drop-off Time</label>
                                <p className="font-bold text-slate-800 text-sm">{dropoffTime}</p>
                                <select value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base">
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>


                    <button type="submit" className="w-full bg-[#16a34a] hover:bg-green-700 text-white font-bold py-3 rounded-md text-base shadow-md">
                        Search
                    </button>

                </form>
            </div>
            <div className="p-2">
                <div className="space-y-1">
                    <label className="flex items-center text-sm font-medium text-white cursor-pointer select-none">
                        <input type="checkbox" checked={differentDropoff} onChange={(e) => setDifferentDropoff(e.target.checked)} className="h-5 w-5 rounded bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border-0 shadow" />
                        Drop car off at different location
                    </label>
                    <label className="flex items-center text-sm font-medium text-white cursor-pointer select-none">
                        <input type="checkbox" defaultChecked className="h-5 w-5 rounded bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border-0 shadow" />
                        Driver aged between 30 - 65?
                    </label>
                </div>
            </div>
        </div>
        {/* --- END OF NEW MOBILE WIDGET --- */}


        {/* --- START OF REVISED DESKTOP WIDGET --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="bg-[#FF9F1C] p-1 rounded-[4px] shadow-2xl relative z-10">
                <div className="bg-white p-3 rounded-[3px]">
                    {showTitle && (
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Compass className="w-5 h-5 text-[#003580]" />
                            Let's find your ideal car
                        </h2>
                    )}
                    <form onSubmit={handleSearch}>
                        <div className="flex flex-col gap-2">
                            {/* ROW 1: Locations */}
                            <div className="grid grid-cols-2 gap-1.5">
                                <div className={differentDropoff ? "col-span-1" : "col-span-2"}>
                                    <div className="rounded-lg relative bg-white h-full">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Pick-up Location</label>
                                        <div className="relative border border-slate-300 rounded-[4px] overflow-hidden group bg-white focus-within:border-slate-300">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{getLocationIcon(pickupSelection?.type || '')}</div>
                                            <input id="pickup-location" type="text" placeholder="City, airport, or station" className="block w-full pl-9 pr-3 border-none focus:ring-0 focus:outline-none text-base md:text-sm font-medium placeholder-slate-400 text-slate-900 h-10" value={pickupQuery} onChange={handleLocationChange} onFocus={handleFocus} autoComplete="off" required />
                                        </div>
                                        {isSuggestionsOpen && (
                                            <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                                {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {differentDropoff && (
                                    <div className="col-span-1">
                                         <div className="rounded-lg relative bg-white w-full h-full">
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Drop-off Location</label>
                                            <div className="relative border border-slate-300 rounded-[4px] overflow-hidden group bg-white focus-within:border-slate-300">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{getLocationIcon(dropoffSelection?.type || '')}</div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter drop-off city"
                                                    className="block w-full pl-9 pr-3 border-none focus:ring-0 focus:outline-none text-base md:text-sm font-medium placeholder-slate-400 text-slate-900 h-10"
                                                    value={dropoffQuery}
                                                    onChange={handleDropoffLocationChange}
                                                    onFocus={handleDropoffFocus}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {isDropoffSuggestionsOpen && (
                                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                                    {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ROW 2: Dates & Search */}
                            <div className="grid grid-cols-10 gap-1.5 items-end">
                                <div className="lg:col-span-8">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Pick-up & Drop-off</label>
                                    <div className="grid grid-cols-2 border border-slate-300 rounded-[4px] overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                        {/* Pick-up */}
                                        <div className="relative bg-white">
                                            <div className="flex">
                                                <div className="relative flex-grow">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-slate-400" /></div>
                                                    <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={today.toISOString().split('T')[0]} className="w-full h-10 pl-9 text-base md:text-sm font-medium border-none focus:ring-0 focus:outline-none text-slate-700 bg-transparent" />
                                                </div>
                                                <div className="relative w-[85px] border-l border-slate-200">
                                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><Clock className="h-3 w-3 text-slate-400" /></div>
                                                    <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full h-10 pl-7 text-base md:text-sm font-medium border-none focus:ring-0 focus:outline-none bg-slate-50 text-slate-700 appearance-none">
                                                        {timeOptions.map(t => <option key={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Drop-off */}
                                        <div className="relative bg-white border-l border-slate-300">
                                            <div className="flex">
                                                <div className="relative flex-grow">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-slate-400" /></div>
                                                    <input type="date" value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} min={pickupDate} className="w-full h-10 pl-9 text-base md:text-sm font-medium border-none focus:ring-0 focus:outline-none text-slate-700 bg-transparent" />
                                                </div>
                                                <div className="relative w-[85px] border-l border-slate-200">
                                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><Clock className="h-3 w-3 text-slate-400" /></div>
                                                    <select value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} className="w-full h-10 pl-7 text-base md:text-sm font-medium border-none focus:ring-0 focus:outline-none bg-slate-50 text-slate-700 appearance-none">
                                                        {timeOptions.map(t => <option key={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <button type="submit" className="w-full bg-[#16a34a] hover:bg-green-700 text-white font-bold rounded-[4px] shadow-sm transition-transform active:scale-95 flex items-center justify-center text-lg h-10">
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4">
                            <label className="flex items-center text-base font-medium text-slate-700 cursor-pointer select-none">
                                <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-6 w-6 rounded-md bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-3 border-2 border-slate-300" />
                                Drop car off at different location
                            </label>
                            <label className="flex items-center text-base font-medium text-slate-700 cursor-pointer select-none">
                                <input type="checkbox" defaultChecked className="h-6 w-6 rounded-md bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-3 border-2 border-slate-300" />
                                Driver aged between 30 - 65?
                            </label>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        {/* --- END OF REVISED DESKTOP WIDGET --- */}
        </>
    )
};

export default SearchWidget;