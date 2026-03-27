import * as React from 'react';
import { MapPin, Calendar, Clock, Plane, Building, LoaderCircle } from 'lucide-react';
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

    return (
        <>
        {/* --- MOBILE WIDGET (unchanged, visible date inputs) --- */}
        <div className="lg:hidden" ref={mobileWidgetRef}>
            <div className="bg-white p-3 rounded-2xl shadow-2xl relative z-10 border border-slate-200/60">
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                    {/* Pick-up location */}
                    <div className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex items-center w-full">
                        <div className="pl-3 flex items-center pointer-events-none">
                            {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                        </div>
                        <div className="flex-1 relative h-full">
                            <label className="absolute top-1 left-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pick-up Location</label>
                            <input
                                type="text"
                                className="w-full h-full pl-3 pr-3 pt-4 pb-1 font-bold text-slate-900 text-base bg-transparent border-none focus:ring-0 focus:outline-none"
                                value={pickupQuery}
                                onChange={handleLocationChange}
                                onFocus={handleFocus}
                                autoComplete="off"
                                placeholder="City, airport, or station"
                                required
                            />
                        </div>
                        {isSuggestionsOpen && (
                            <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                            </div>
                        )}
                    </div>

                    {/* Conditional Drop-off Location */}
                    {differentDropoff && (
                        <div className="relative h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex items-center w-full">
                            <div className="pl-3 flex items-center pointer-events-none">
                                {getLocationIcon(dropoffSelection?.type || '', 'w-5 h-5')}
                            </div>
                            <div className="flex-1 relative h-full">
                                <label className="absolute top-1 left-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Drop-off Location</label>
                                <input
                                    type="text"
                                    className="w-full h-full pl-3 pr-3 pt-4 pb-1 font-bold text-slate-900 text-base bg-transparent border-none focus:ring-0 focus:outline-none"
                                    value={dropoffQuery}
                                    onChange={handleDropoffLocationChange}
                                    onFocus={handleDropoffFocus}
                                    autoComplete="off"
                                    placeholder="City, airport, or station"
                                    required
                                />
                            </div>
                            {isDropoffSuggestionsOpen && (
                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date Row – visible date inputs */}
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
                                    className="w-full h-full bg-transparent pl-2 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
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
                                    className="w-full h-full bg-transparent pl-2 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer"
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

        {/* --- DESKTOP WIDGET – date fields use absolute input covering container, visible text is non‑clickable --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="bg-white p-2 rounded-2xl shadow-2xl relative z-10 border border-slate-200/60">
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                    {/* ROW 1: Locations */}
                    <div className="flex flex-row items-center gap-2 w-full">
                        {/* Pick-up Location */}
                        <div className={`relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 ${differentDropoff ? 'flex-1' : 'flex-1'} w-full`}>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                {getLocationIcon(pickupSelection?.type || '', 'w-5 h-5')}
                            </div>
                            <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pick-up</div>
                            <input 
                                id="pickup-location" 
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

                        {/* Drop-off Location */}
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

                    {/* ROW 2: Four separate fields */}
                    <div className="flex flex-row items-center gap-2 w-full">
                        {/* Pick-up Date – absolute input covers whole container */}
                        <div className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <Calendar className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none z-10">Pick-up Date</div>
                            <div className="absolute inset-0 pl-11 pr-4 pt-4 pb-1 text-base font-bold text-slate-900 bg-transparent pointer-events-none z-10">
                                {formatDateForDisplay(pickupDate)}
                            </div>
                            <input
                                type="date"
                                value={pickupDate}
                                onChange={e => setPickupDate(e.target.value)}
                                min={today.toISOString().split('T')[0]}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                        </div>

                        {/* Pick-up Time */}
                        <div className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Clock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">Pick-up Time</div>
                            <select
                                value={pickupTime}
                                onChange={e => setPickupTime(e.target.value)}
                                className="w-full h-full bg-transparent pl-11 pr-4 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                            >
                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Drop-off Date – absolute input covers whole container */}
                        <div className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <Calendar className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none z-10">Drop-off Date</div>
                            <div className="absolute inset-0 pl-11 pr-4 pt-4 pb-1 text-base font-bold text-slate-900 bg-transparent pointer-events-none z-10">
                                {formatDateForDisplay(dropoffDate)}
                            </div>
                            <input
                                type="date"
                                value={dropoffDate}
                                onChange={e => setDropoffDate(e.target.value)}
                                min={pickupDate}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                        </div>

                        {/* Drop-off Time */}
                        <div className="relative h-14 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Clock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <div className="absolute top-1.5 left-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">Drop-off Time</div>
                            <select
                                value={dropoffTime}
                                onChange={e => setDropoffTime(e.target.value)}
                                className="w-full h-full bg-transparent pl-11 pr-4 pt-4 pb-1 text-base font-bold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
                            >
                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Search Button */}
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
