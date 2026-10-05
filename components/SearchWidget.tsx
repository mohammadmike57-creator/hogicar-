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
import { startCarSearchPrefetch } from '../utils/searchPrefetch';
import { lazyRetry } from '../utils/lazyRetry';

const SearchOverlay = lazyRetry(() => import('./SearchOverlay'));
const DateRangePicker = lazyRetry(() => import('./DateRangePicker'));

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
    return <MapPin className={`${sizeClass} text-slate-600`} />;
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
      <div className="p-5 text-sm text-slate-700 text-center flex items-center justify-center gap-2 font-semibold">
        <LoaderCircle className="w-4 h-4 animate-spin" /> Loading...
      </div>
    ) : error ? (
      <p className="p-5 text-sm text-rose-600 text-center font-semibold">{error}</p>
    ) : suggestions.length > 0 ? (
      <ul role="listbox" className="py-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.value + suggestion.label} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => handler(suggestion)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm text-slate-800 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">{getLocationIcon(suggestion.type)}</div>
              <div><span className="font-medium">{suggestion.label}</span></div>
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="p-5 text-sm text-slate-700 text-center font-semibold">No results found.</p>
    )}
  </>
);

const MobileDateTimeField = React.memo(({
    label,
    dateValue,
    onOpenDate,
    isActive,
    timeValue,
    onTimeChange,
    iconColor
}: {
    label: string;
    dateValue: string;
    onOpenDate: () => void;
    isActive: boolean;
    timeValue: string;
    onTimeChange: (time: string) => void;
    iconColor: string;
}) => {
    const timeId = React.useId();
    return (
        <div className={`overflow-hidden rounded-xl border bg-white transition-colors ${isActive ? 'border-accent ring-2 ring-accent/20' : 'border-slate-300'}`}>
            <button
                type="button"
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-start active:bg-slate-50"
                onClick={onOpenDate}
                aria-haspopup="dialog"
                aria-label={`${label} date: ${formatDateForDisplay(dateValue)}`}
            >
                <Calendar className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                <span className="min-w-0">
                    <span className="block text-xs text-slate-500">{label} date</span>
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{formatDateForDisplay(dateValue)}</span>
                </span>
            </button>
            <div className="relative flex items-start gap-2.5 border-t border-slate-200 px-3 py-2.5">
                <Clock className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                <span className="min-w-0 flex-1">
                    <label htmlFor={timeId} className="block text-xs text-slate-500">Time</label>
                    <span className="flex items-center justify-between text-[15px] font-semibold text-slate-900">
                        {timeValue}
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </span>
                </span>
                <select
                    id={timeId}
                    value={timeValue}
                    onChange={e => onTimeChange(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>
    );
});

const DesktopGroupedDateTimeField = React.memo(({ 
    dateLabel, 
    dateValue, 
    onOpenDate,
    isActive,
    timeLabel, 
    timeValue, 
    onTimeChange,
    timeOptions,
    idPrefix
}: { 
    dateLabel: string; 
    dateValue: string; 
    onOpenDate: () => void;
    isActive: boolean;
    timeLabel: string;
    timeValue: string;
    onTimeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    timeOptions: string[];
    iconType?: 'pickup' | 'dropoff';
    idPrefix: string;
}) => {
    return (
        <div className={`flex min-w-0 flex-1 divide-x divide-slate-200 rounded-xl border bg-white transition-colors ${isActive ? 'border-accent ring-2 ring-accent/20' : 'border-slate-300 hover:border-slate-400'}`}>
            {/* Date */}
            <button
                type="button"
                id={`${idPrefix}-date`}
                className="relative flex min-h-[64px] min-w-0 flex-[2] cursor-pointer items-center gap-3 rounded-s-xl px-4 text-start"
                onClick={onOpenDate}
                aria-haspopup="dialog"
                aria-expanded={isActive}
            >
                <Calendar className={`h-5 w-5 shrink-0 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                <span className="min-w-0">
                    <span className="block text-xs text-slate-500">{dateLabel}</span>
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{formatDateForDisplay(dateValue)}</span>
                </span>
            </button>

            {/* Time */}
            <div
                className="relative flex min-h-[64px] flex-1 cursor-pointer items-center px-4"
                onClick={(e) => {
                    const select = e.currentTarget.querySelector('select');
                    if (select) {
                        try { (select as any).showPicker(); } catch (err) { select.focus(); }
                    }
                }}
            >
                <div className="w-full">
                    <label htmlFor={`${idPrefix}-time`} className="block text-xs text-slate-500">{timeLabel}</label>
                    <div className="flex items-center justify-between text-[15px] font-semibold text-slate-900">
                        {timeValue}
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <select
                    id={`${idPrefix}-time`}
                    name={`${idPrefix}Time`}
                    value={timeValue}
                    onChange={onTimeChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>
    );
});

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

const SearchWidget: React.FC<SearchWidgetProps> = React.memo(({ initialValues, onSearch, showTitle = false, accentColor, style: widgetStyle = 'DEFAULT', customColor, buttonColor }) => {
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
    const [calendarFor, setCalendarFor] = React.useState<'pickup' | 'dropoff' | null>(null);
    const desktopDatesRef = React.useRef<HTMLDivElement>(null);
    const todayIso = today.toISOString().split('T')[0];
    const closeCalendar = React.useCallback(() => setCalendarFor(null), []);
    const handleDatesChange = React.useCallback((start: string, end: string) => {
        setPickupDate(start);
        setDropoffDate(end < start ? start : end);
    }, []);

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
        console.log("SEARCH BUTTON CLICKED");

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

        console.log("SEARCH PARAMETERS:", {
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            pickupDate,
            dropoffDate,
            pickupTime,
            dropoffTime
        });

        setIsSuggestionsOpen(false);
        setIsDropoffSuggestionsOpen(false);

        const finalPickupCode = pickupLocation;
        if (!finalPickupCode) return;
        
        const searchPayload = {
            pickup: finalPickupCode,
            pickupName: finalPickupName,
            pickupDate: pickupDate,
            dropoffDate: dropoffDate,
            startTime: pickupTime,
            endTime: dropoffTime,
            dropoff: dropoffLocation || finalPickupCode,
            dropoffName: finalDropoffName,
            differentDropoff: differentDropoff
        };

        console.log("CAR SEARCH API STARTED (PREFETCH)");
        startCarSearchPrefetch({
            pickupCode: finalPickupCode,
            dropoffCode: dropoffLocation || finalPickupCode,
            pickupDate,
            dropoffDate,
            startTime: pickupTime,
            endTime: dropoffTime,
        });

        console.log("NAVIGATING TO SEARCHING PAGE");
        onSearch(searchPayload);
    };
    

    const locationButton = (type: 'pickup' | 'dropoff') => {
        const selection = type === 'pickup' ? pickupSelection : dropoffSelection;
        const query = type === 'pickup' ? pickupQuery : dropoffQuery;
        const label = type === 'pickup' ? 'Pick-up location' : 'Drop-off location';
        return (
            <button
                type="button"
                onClick={() => openSearchOverlay(type)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-start transition-colors active:bg-slate-50"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {selection?.value ? getLocationIcon(selection.type, 'w-5 h-5') : <MapPin className="h-5 w-5 text-slate-500" />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-xs text-slate-500">{label}</span>
                    <span className={`block truncate text-[15px] ${selection?.label || query ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                        {selection?.label || query || 'Airport, city or station'}
                    </span>
                </span>
            </button>
        );
    };

    return (
        <>
        {/* --- MOBILE WIDGET --- */}
        <div className="w-full lg:hidden" ref={mobileWidgetRef}>
            <div className="relative z-10 rounded-2xl bg-white p-4 text-start shadow-[0_20px_50px_-20px_rgba(15,23,42,0.5)] ring-1 ring-black/5 sm:p-5">
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                    {locationButton('pickup')}

                    {differentDropoff && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            {locationButton('dropoff')}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <MobileDateTimeField
                            label="Pick-up"
                            dateValue={pickupDate}
                            onOpenDate={() => setCalendarFor('pickup')}
                            isActive={calendarFor === 'pickup'}
                            timeValue={pickupTime}
                            onTimeChange={setPickupTime}
                            iconColor="text-accent"
                        />
                        <MobileDateTimeField
                            label="Drop-off"
                            dateValue={dropoffDate}
                            onOpenDate={() => setCalendarFor('dropoff')}
                            isActive={calendarFor === 'dropoff'}
                            timeValue={dropoffTime}
                            onTimeChange={setDropoffTime}
                            iconColor="text-accent"
                        />
                    </div>

                    <div className="flex flex-col gap-2 pt-0.5">
                        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700">
                            <input id="mobile-different-dropoff" name="differentDropoff" type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} checked={differentDropoff} className="h-[18px] w-[18px] rounded border-slate-300 text-accent focus:ring-accent" />
                            Return to a different location
                        </label>
                        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700">
                            <input id="mobile-driver-age" name="driverAgeValid" type="checkbox" defaultChecked className="h-[18px] w-[18px] rounded border-slate-300 text-accent focus:ring-accent" />
                            Driver aged 30–65
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 active:bg-accent-800"
                    >
                        <SearchIcon className="h-5 w-5" />
                        Search cars
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

        {/* --- DESKTOP WIDGET --- */}
        <div className="hidden lg:block" ref={desktopWidgetRef}>
            <form onSubmit={handleSearch} className="relative rounded-2xl bg-white p-3 text-start shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] ring-1 ring-black/5">
                <div className="mb-2.5 flex flex-wrap items-center gap-6 px-1">
                    <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700">
                        <input
                            id="return-same-location"
                            name="returnSameLocation"
                            type="checkbox"
                            onChange={(e) => setDifferentDropoff(!e.target.checked)}
                            checked={!differentDropoff}
                            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                        />
                        Return car to the same location
                    </label>
                    <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700">
                        <input
                            id="driver-age-checkbox"
                            name="driverAgeValid"
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                        />
                        Driver aged 30–65
                    </label>
                </div>

                <div className="flex gap-2">
                    {/* Locations */}
                    <div className={`grid min-w-0 flex-[3] gap-2 ${differentDropoff ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="relative rounded-xl border border-slate-300 bg-white transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 hover:border-slate-400">
                            <div className="flex min-h-[64px] items-center gap-3 px-4">
                                <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="desktop-pickup-location" className="block text-xs text-slate-500">Pick-up location</label>
                                    <input
                                        id="desktop-pickup-location"
                                        name="pickupLocation"
                                        type="text"
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-expanded={isSuggestionsOpen}
                                        aria-haspopup="listbox"
                                        placeholder="Airport, city or station"
                                        className="w-full border-none bg-transparent p-0 text-[15px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                        value={pickupQuery}
                                        onChange={handleLocationChange}
                                        onFocus={handleFocus}
                                        autoComplete="off"
                                        aria-controls="pickup-suggestions"
                                        required
                                    />
                                </div>
                            </div>
                            {isSuggestionsOpen && (
                                <div id="pickup-suggestions" onMouseDown={(e) => e.preventDefault()} className="absolute start-0 top-full z-[200] mt-1 max-h-[400px] w-full min-w-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
                                    {renderSuggestions(isLoadingSuggestions, suggestionsError, suggestions, handleSuggestionClick)}
                                </div>
                            )}
                        </div>

                        {differentDropoff && (
                            <div className="relative rounded-xl border border-slate-300 bg-white transition-colors animate-in fade-in duration-300 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 hover:border-slate-400">
                                <div className="flex min-h-[64px] items-center gap-3 px-4">
                                    <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                                    <div className="min-w-0 flex-1">
                                        <label htmlFor="desktop-dropoff-location" className="block text-xs text-slate-500">Drop-off location</label>
                                        <input
                                            id="desktop-dropoff-location"
                                            name="dropoffLocation"
                                            type="text"
                                            role="combobox"
                                            aria-autocomplete="list"
                                            aria-expanded={isDropoffSuggestionsOpen}
                                            aria-haspopup="listbox"
                                            placeholder="Airport, city or station"
                                            className="w-full border-none bg-transparent p-0 text-[15px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                            value={dropoffQuery}
                                            onChange={handleDropoffLocationChange}
                                            onFocus={handleDropoffFocus}
                                            autoComplete="off"
                                            aria-controls="dropoff-suggestions"
                                            required={differentDropoff}
                                        />
                                    </div>
                                </div>
                                {isDropoffSuggestionsOpen && (
                                    <div id="dropoff-suggestions" onMouseDown={(e) => e.preventDefault()} className="absolute start-0 top-full z-[200] mt-1 max-h-[400px] w-full min-w-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
                                        {renderSuggestions(isDropoffLoading, dropoffError, dropoffSuggestions, handleDropoffSuggestionClick)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dates and times */}
                    <div ref={desktopDatesRef} className="flex min-w-0 flex-[4] gap-2">
                        <DesktopGroupedDateTimeField
                            idPrefix="pickup"
                            dateLabel="Pick-up date"
                            dateValue={pickupDate}
                            onOpenDate={() => setCalendarFor(c => (c === 'pickup' ? null : 'pickup'))}
                            isActive={calendarFor === 'pickup'}
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
                            onOpenDate={() => setCalendarFor(c => (c === 'dropoff' ? null : 'dropoff'))}
                            isActive={calendarFor === 'dropoff'}
                            timeLabel="Time"
                            timeValue={dropoffTime}
                            onTimeChange={(e) => setDropoffTime(e.target.value)}
                            timeOptions={TIME_OPTIONS}
                            iconType="dropoff"
                        />
                    </div>

                    <button
                        type="submit"
                        className="flex h-[66px] min-w-[150px] items-center justify-center gap-2 rounded-xl bg-accent px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 active:bg-accent-800"
                    >
                        <SearchIcon className="h-5 w-5" />
                        Search
                    </button>
                </div>
            </form>
        </div>

        {calendarFor && (
            <React.Suspense fallback={null}>
                <DateRangePicker
                    startDate={pickupDate}
                    endDate={dropoffDate}
                    minDate={todayIso}
                    active={calendarFor}
                    onActiveChange={setCalendarFor}
                    onChange={handleDatesChange}
                    onClose={closeCalendar}
                    anchorEl={desktopDatesRef.current}
                />
            </React.Suspense>
        )}
        </>
    )
});

export default SearchWidget;
