import * as React from 'react';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Building from 'lucide-react/dist/esm/icons/building';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { fetchLocations, LocationSuggestion } from '../api';

const SearchOverlay = React.lazy(() => import('./SearchOverlay'));

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedHour = hour.toString().padStart(2, '0');
    return `${formattedHour}:${minute}`;
});

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
      <ul role="listbox" className="py-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.value + suggestion.label} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => handler(suggestion)}
              className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-blue-50/80 transition-colors flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-slate-100 border border-slate-200 flex-shrink-0">{getLocationIcon(suggestion.type)}</div>
              <div><span className="font-semibold">{suggestion.label}</span></div>
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="p-5 text-sm text-slate-500 text-center font-semibold">No results found.</p>
    )}
  </>
);

const DesktopGroupedDateTimeField = ({ 
    dateLabel, 
    dateValue, 
    onDateChange, 
    minDate,
    timeLabel, 
    timeValue, 
    onTimeChange,
    timeOptions,
    iconType = 'pickup',
    idPrefix
}: { 
    dateLabel: string; 
    dateValue: string; 
    onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    minDate: string;
    timeLabel: string;
    timeValue: string;
    onTimeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    timeOptions: string[];
    iconType?: 'pickup' | 'dropoff';
    idPrefix: string;
}) => (
    <div className="flex flex-1 bg-white rounded-2xl divide-x divide-slate-200 overflow-hidden shadow-sm border border-slate-200/50">
        {/* Date Part */}
        <div 
            className="flex-[2] relative cursor-pointer group px-4 pt-2.5 pb-2 min-h-[64px] flex flex-col justify-center"
            onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input) {
                    try { (input as any).showPicker(); } catch (err) { input.focus(); }
                }
            }}
        >
            <label htmlFor={`${idPrefix}-date`} className="block text-[12px] text-slate-700 font-bold mb-0.5">{dateLabel}</label>
            <div className="flex items-center gap-2">
                <div className="flex items-center text-slate-900 font-bold text-[15px]">
                    {iconType === 'pickup' ? (
                        <span className="mr-3 flex items-center gap-1.5 text-slate-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                            <ArrowRight className="w-4 h-4 stroke-[3px]" />
                        </span>
                    ) : (
                        <span className="mr-3 flex items-center gap-1.5 text-slate-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                            <ArrowRight className="w-4 h-4 stroke-[3px] rotate-180" />
                        </span>
                    )}
                    {formatDateForDisplay(dateValue)}
                </div>
            </div>
            <input
                id={`${idPrefix}-date`}
                name={`${idPrefix}Date`}
                type="date"
                value={dateValue}
                onChange={onDateChange}
                min={minDate}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ colorScheme: 'light' }}
            />
        </div>

        {/* Time Part */}
        <div 
            className="flex-1 relative cursor-pointer group px-4 pt-2.5 pb-2 min-h-[64px] flex flex-col justify-center"
            onClick={(e) => {
                const select = e.currentTarget.querySelector('select');
                if (select) {
                    try { (select as any).showPicker(); } catch (err) { select.focus(); }
                }
            }}
        >
            <label htmlFor={`${idPrefix}-time`} className="block text-[12px] text-slate-700 font-bold mb-0.5">{timeLabel}</label>
            <div className="text-[15px] font-bold text-slate-900 flex items-center justify-between">
                {timeValue}
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <select
                id={`${idPrefix}-time`}
                name={`${idPrefix}Time`}
                value={timeValue}
                onChange={onTimeChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
            >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
    </div>
);

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
    style?: string;
    customColor?: string;
    buttonColor?: string;
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ initialValues, onSearch, showTitle = false, accentColor, style: widgetStyle = 'DEFAULT', customColor, buttonColor }) => {
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
    

    return (
        <>
        {/* --- MOBILE WIDGET --- */}
        <div className="lg:hidden w-full px-3 sm:px-6" ref={mobileWidgetRef}>
            <div className="bg-white p-6 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 border border-white/20">
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                    {/* Pick-up location button */}
                    <div className="flex flex-col gap-1">
                        <label id="mobile-pickup-label" className="text-[9px] font-black text-slate-700 uppercase tracking-[0.12em] ml-1">Pick-up Location</label>
                        <button
                            type="button"
                            onClick={() => openSearchOverlay('pickup')}
                            aria-labelledby="mobile-pickup-label"
                            className="relative h-[62px] bg-white rounded-2xl border border-slate-200/60 flex items-center w-full text-left px-4 focus:outline-none active:scale-[0.98] transition-all hover:border-accent/50 shadow-sm"
                        >
                            <div className="flex items-center gap-3 w-full min-w-0">
                                {pickupSelection ? (
                                    <div className="flex-shrink-0 bg-white p-1.5 rounded-none shadow-sm border border-slate-100">
                                        {getLocationIcon(pickupSelection.type, 'w-5 h-5')}
                                    </div>
                                ) : null}
                                <div className="flex-1 min-w-0">
                                    <div className="font-extrabold text-slate-900 text-[12px] leading-tight">
                                        {pickupSelection?.label || pickupQuery || 'City, airport, or station'}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Where do you want to start?</div>
                                </div>
                                {pickupSelection ? (
                                    <div className="text-accent flex-shrink-0 bg-emerald-50 p-1.5 rounded-full">
                                        <SearchIcon className="w-3 h-3" />
                                    </div>
                                ) : null}
                            </div>
                        </button>
                    </div>

                    {/* Drop-off location button */}
                    {differentDropoff && (
                        <div className="flex flex-col gap-1 -mt-1 animate-in slide-in-from-top-2 duration-300">
                            <label id="mobile-dropoff-label" className="text-[9px] font-black text-slate-700 uppercase tracking-[0.15em] ml-1">Drop-off Location</label>
                            <button
                                type="button"
                                onClick={() => openSearchOverlay('dropoff')}
                                aria-labelledby="mobile-dropoff-label"
                                className="relative h-[62px] bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center w-full text-left px-4 focus:outline-none active:scale-[0.98] transition-all hover:border-accent/50 shadow-sm"
                            >
                                <div className="flex items-center gap-3 w-full min-w-0">
                                    {dropoffSelection ? (
                                        <div className="flex-shrink-0 bg-white p-1.5 rounded-none shadow-sm border border-slate-100">
                                            {getLocationIcon(dropoffSelection.type, 'w-5 h-5')}
                                        </div>
                                    ) : null}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-extrabold text-slate-900 text-[12px] leading-tight">
                                            {dropoffSelection?.label || dropoffQuery || 'City, airport, or station'}
                                        </div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Where do you want to end?</div>
                                    </div>
                                    {dropoffSelection ? (
                                        <div className="text-accent flex-shrink-0 bg-emerald-50 p-1.5 rounded-full">
                                            <SearchIcon className="w-3 h-3" />
                                        </div>
                                    ) : null}
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Date/Time Section */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label id="mobile-pickup-date-label" className="text-[9px] font-black text-slate-700 uppercase tracking-[0.12em] ml-1">Pick-up Date & Time</label>
                            <div className="relative bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col transition-all focus-within:border-accent/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/5 shadow-sm overflow-hidden">
                                <div className="p-2 pb-1 flex flex-col border-b border-slate-100">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {pickupSelection && <Calendar className="w-3 h-3 text-accent" />}
                                        <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Date</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={pickupDate}
                                        onChange={e => setPickupDate(e.target.value)}
                                        min={today.toISOString().split('T')[0]}
                                        className={`w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer ${!pickupSelection ? 'opacity-80' : ''}`}
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div className="p-2 pt-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {pickupSelection && <Clock className="w-3 h-3 text-accent" />}
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Time</span>
                                    </div>
                                    <select
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                        className={`w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none ${!pickupSelection ? 'opacity-80' : ''}`}
                                    >
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label id="mobile-dropoff-date-label" className="text-[9px] font-black text-slate-700 uppercase tracking-[0.12em] ml-1">Drop-off Date & Time</label>
                            <div className="relative bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col transition-all focus-within:border-accent/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/5 shadow-sm overflow-hidden">
                                <div className="p-2 pb-1 flex flex-col border-b border-slate-100">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {pickupSelection && <Calendar className="w-3 h-3 text-accent" />}
                                        <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Date</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={dropoffDate}
                                        onChange={e => setDropoffDate(e.target.value)}
                                        min={pickupDate}
                                        className={`w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer ${!pickupSelection ? 'opacity-80' : ''}`}
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div className="p-2 pt-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {pickupSelection && <Clock className="w-3 h-3 text-accent" />}
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Time</span>
                                    </div>
                                    <select
                                        value={dropoffTime}
                                        onChange={e => setDropoffTime(e.target.value)}
                                        className={`w-full bg-transparent p-0 text-[13px] font-extrabold text-slate-900 border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none ${!pickupSelection ? 'opacity-80' : ''}`}
                                    >
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
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
                            Driver age between 30 - 65?
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full text-white font-black h-16 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 text-[17px] uppercase tracking-[0.05em] hover:bg-[#006407] shadow-xl shadow-green-900/20"
                        style={{ backgroundColor: '#008009' }}
                    >
                        <SearchIcon className="w-5 h-5 stroke-[3px]" />
                        Search now
                    </button>
                </form>
            </div>
        </div>

        {/* --- SEARCH OVERLAY (full-screen) --- */}
        <React.Suspense fallback={null}>
          <SearchOverlay
              isOpen={isSearchOverlayOpen}
              onClose={closeSearchOverlay}
              onSelectLocation={handleOverlaySelect}
              recentLocations={recentLocations}
              saveRecentLocation={saveRecentLocation}
          />
        </React.Suspense>

        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <div className="max-w-[950px] mx-auto">
                <form onSubmit={handleSearch} className="relative bg-[#ffda44] p-1.5 rounded-3xl shadow-2xl overflow-visible border-[3px] border-[#ffda44]">
                    <div className="flex flex-col gap-2">
                        {/* Locations Row */}
                        <div className={`grid grid-cols-1 ${differentDropoff ? 'md:grid-cols-2' : ''} gap-2 transition-all duration-300`}>
                            {/* Pick-up location */}
                            <div className="relative bg-white rounded-2xl shadow-sm group border border-slate-200/50">
                                <div className="px-4 pt-2.5 pb-2 flex flex-col min-h-[60px] justify-center">
                                    <label htmlFor="desktop-pickup-location" className="text-[11px] text-slate-700 mb-0.5 font-bold">Pick-up location</label>
                                    <input
                                        id="desktop-pickup-location"
                                        name="pickupLocation"
                                        type="text"
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-expanded={isSuggestionsOpen}
                                        aria-haspopup="listbox"
                                        placeholder="Enter airport or city"
                                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] font-bold text-slate-900 placeholder-slate-500 p-0"
                                        value={pickupQuery}
                                        onChange={handleLocationChange}
                                        onFocus={handleFocus}
                                        autoComplete="off"
                                        aria-controls="pickup-suggestions"
                                        required
                                    />
                                </div>
                                {isSuggestionsOpen && (
                                    <div id="pickup-suggestions" onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] max-h-[400px] overflow-y-auto">
                                        {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                    </div>
                                )}
                            </div>
    
                            {/* Drop-off location (Conditional) */}
                            {differentDropoff && (
                                <div className="relative bg-white rounded-2xl shadow-sm group border border-slate-200/50 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="px-4 pt-2.5 pb-2 flex flex-col min-h-[60px] justify-center">
                                        <label htmlFor="desktop-dropoff-location" className="text-[11px] text-slate-700 mb-0.5 font-bold">Drop-off location</label>
                                        <input
                                            id="desktop-dropoff-location"
                                            name="dropoffLocation"
                                            type="text"
                                            role="combobox"
                                            aria-autocomplete="list"
                                            aria-expanded={isDropoffSuggestionsOpen}
                                            aria-haspopup="listbox"
                                            placeholder="Enter airport or city"
                                            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] font-bold text-slate-900 placeholder-slate-500 p-0"
                                            value={dropoffQuery}
                                            onChange={handleDropoffLocationChange}
                                            onFocus={handleDropoffFocus}
                                            autoComplete="off"
                                            aria-controls="dropoff-suggestions"
                                            required={differentDropoff}
                                        />
                                    </div>
                                    {isDropoffSuggestionsOpen && (
                                        <div id="dropoff-suggestions" onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] max-h-[400px] overflow-y-auto">
                                            {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Checkboxes Row */}
                        <div className="flex flex-wrap items-center gap-6 px-1">
                            <label className="flex items-center text-[13px] font-semibold text-slate-800 cursor-pointer select-none">
                                <input 
                                    id="return-same-location"
                                    name="returnSameLocation"
                                    type="checkbox" 
                                    onChange={(e) => setDifferentDropoff(!e.target.checked)} 
                                    checked={!differentDropoff} 
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0 mr-2" 
                                />
                                Return car in same location
                            </label>
                            <label className="flex items-center text-[13px] font-semibold text-slate-800 cursor-pointer select-none">
                                <input 
                                    id="driver-age-checkbox"
                                    name="driverAgeValid"
                                    type="checkbox" 
                                    defaultChecked 
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0 mr-2" 
                                />
                                Driver age between 30 - 65?
                            </label>
                        </div>

                        {/* Dates & Times row */}
                        <div className="flex flex-col md:flex-row gap-2">
                                <DesktopGroupedDateTimeField
                                    idPrefix="pickup"
                                    dateLabel="Pick-up date"
                                    dateValue={pickupDate}
                                    onDateChange={(e) => setPickupDate(e.target.value)}
                                    minDate={today.toISOString().split('T')[0]}
                                    timeLabel="Time"
                                    timeValue={pickupTime}
                                    onTimeChange={(e) => setPickupTime(e.target.value)}
                                    timeOptions={TIME_OPTIONS}
                                    iconType="pickup"
                                />
                                <DesktopGroupedDateTimeField
                                    idPrefix="dropoff"
                                    dateLabel="Drop-off date"
                                    dateValue={dropoffDate}
                                    onDateChange={(e) => setDropoffDate(e.target.value)}
                                    minDate={pickupDate}
                                    timeLabel="Time"
                                    timeValue={dropoffTime}
                                    onTimeChange={(e) => setDropoffTime(e.target.value)}
                                    timeOptions={TIME_OPTIONS}
                                    iconType="dropoff"
                                />
                        </div>

                        {/* Driver info & Search button row */}
                        <div className="flex items-center justify-end mt-1">
                            <button 
                                type="submit" 
                                className="bg-[#008009] text-white px-12 h-[60px] rounded-2xl font-black text-[18px] uppercase tracking-wide hover:bg-[#006407] transition-all active:scale-[0.98] shadow-lg flex items-center justify-center"
                            >
                                Search now
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
};

export default SearchWidget;
