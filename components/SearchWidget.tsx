
import * as React from 'react';
import { MapPin, Calendar, Clock, Search as SearchIcon, Compass, X, Plane, Building } from 'lucide-react';
import { getAvailableLocations } from '../services/mockData';

interface SearchParams {
    location: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    dropoffLocation?: string;
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

    // FIX: Use optional chaining on `initialValues` to prevent TypeScript errors when the prop is not provided.
    const [location, setLocation] = React.useState(initialValues?.location || 'Queen Alia International Airport');
    const [differentDropoff, setDifferentDropoff] = React.useState(initialValues?.differentDropoff || false);
    const [dropoffLocation, setDropoffLocation] = React.useState(initialValues?.dropoffLocation || '');
    const [pickupDate, setPickupDate] = React.useState(initialValues?.startDate || today.toISOString().split('T')[0]);
    const [dropoffDate, setDropoffDate] = React.useState(initialValues?.endDate || nextThreeDays.toISOString().split('T')[0]);
    const [pickupTime, setPickupTime] = React.useState(initialValues?.startTime || '10:00');
    const [dropoffTime, setDropoffTime] = React.useState(initialValues?.endTime || '10:00');

    // Autocomplete state
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
    const [dropoffSuggestions, setDropoffSuggestions] = React.useState<string[]>([]);
    const [isDropoffSuggestionsOpen, setIsDropoffSuggestionsOpen] = React.useState(false);
    const allLocations = React.useMemo(() => getAvailableLocations(), []);
    const mobileWidgetRef = React.useRef<HTMLDivElement>(null);
    const desktopWidgetRef = React.useRef<HTMLDivElement>(null);

    const getLocationIcon = (loc: string, sizeClass = 'w-4 h-4') => {
        const lowerLoc = loc.toLowerCase();
        if (lowerLoc.includes('airport')) {
            return <Plane className={`${sizeClass} text-green-600`} />;
        }
        if (lowerLoc) { // If there's any text, assume it's a city/downtown
             return <Building className={`${sizeClass} text-amber-700`} />;
        }
        return <MapPin className={`${sizeClass} text-slate-400`} />; // Default fallback
    };


    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocation(value);

        if (value.length > 0) {
            const filteredSuggestions = allLocations.filter(loc =>
                loc.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setIsSuggestionsOpen(filteredSuggestions.length > 0);
        } else {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setLocation(suggestion);
        setSuggestions([]);
        setIsSuggestionsOpen(false);
    };

    const handleFocus = () => {
        if (location.length > 0) {
            const filteredSuggestions = allLocations.filter(loc =>
                loc.toLowerCase().includes(location.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setIsSuggestionsOpen(filteredSuggestions.length > 0);
        }
    };

    const handleDropoffLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDropoffLocation(value);

        if (value.length > 0) {
            const filteredSuggestions = allLocations.filter(loc =>
                loc.toLowerCase().includes(value.toLowerCase())
            );
            setDropoffSuggestions(filteredSuggestions);
            setIsDropoffSuggestionsOpen(filteredSuggestions.length > 0);
        } else {
            setDropoffSuggestions([]);
            setIsDropoffSuggestionsOpen(false);
        }
    };

    const handleDropoffSuggestionClick = (suggestion: string) => {
        setDropoffLocation(suggestion);
        setDropoffSuggestions([]);
        setIsDropoffSuggestionsOpen(false);
    };

    const handleDropoffFocus = () => {
        if (dropoffLocation.length > 0) {
            const filteredSuggestions = allLocations.filter(loc =>
                loc.toLowerCase().includes(dropoffLocation.toLowerCase())
            );
            setDropoffSuggestions(filteredSuggestions);
            setIsDropoffSuggestionsOpen(false);
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
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!location) return;
        setIsSuggestionsOpen(false);
        setIsDropoffSuggestionsOpen(false);
        onSearch({
            location,
            startDate: pickupDate,
            endDate: dropoffDate,
            startTime: pickupTime,
            endTime: dropoffTime,
            dropoffLocation: differentDropoff ? dropoffLocation : undefined
        });
    };
    
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        const formattedHour = hour.toString().padStart(2, '0');
        return `${formattedHour}:${minute}`;
    });

    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };
    
    return (
        <>
        {/* --- START OF NEW MOBILE WIDGET --- */}
        <div className="lg:hidden" ref={mobileWidgetRef}>
            <div className="bg-[#FF9F1C] p-1 rounded-lg shadow-2xl relative z-10">
                <form onSubmit={handleSearch} className="space-y-1">

                    {/* Pick-up location */}
                    <div className="bg-white rounded-md p-2 flex items-center gap-2 relative">
                        <div className="flex-shrink-0">{getLocationIcon(location, 'w-5 h-5')}</div>
                        <div className="w-full border border-slate-200 rounded-md p-1 focus-within:border-slate-200">
                            <label className="text-xs text-slate-500">Pick-up location</label>
                            <input
                                type="text"
                                className="w-full font-bold text-slate-800 text-base bg-transparent border-none focus:ring-0 focus:outline-none p-0"
                                value={location}
                                onChange={handleLocationChange}
                                onFocus={handleFocus}
                                autoComplete="off"
                                required
                            />
                        </div>
                        {isSuggestionsOpen && suggestions.length > 0 && (
                            <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                <ul className="py-1">
                                    {suggestions.map((suggestion) => (
                                        <li key={suggestion}>
                                            <button
                                                type="button"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                            >
                                                <div className="flex-shrink-0">{getLocationIcon(suggestion)}</div>
                                                <span>{suggestion}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Conditional Drop-off Location */}
                    {differentDropoff && (
                        <div className="bg-white rounded-md p-2 flex items-center gap-2 relative">
                            <div className="flex-shrink-0">{getLocationIcon(dropoffLocation, 'w-5 h-5')}</div>
                            <div className="w-full border border-slate-200 rounded-md p-1 focus-within:border-slate-200">
                                <label className="text-xs text-slate-500">Drop-off location</label>
                                <input
                                    type="text"
                                    className="w-full font-bold text-slate-800 text-base bg-transparent border-none focus:ring-0 focus:outline-none p-0"
                                    value={dropoffLocation}
                                    onChange={handleDropoffLocationChange}
                                    onFocus={handleDropoffFocus}
                                    autoComplete="off"
                                    placeholder="City, Airport or Station"
                                    required
                                />
                            </div>
                            {isDropoffSuggestionsOpen && dropoffSuggestions.length > 0 && (
                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                    <ul className="py-1">
                                        {dropoffSuggestions.map((suggestion) => (
                                            <li key={suggestion}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDropoffSuggestionClick(suggestion)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                                >
                                                    <div className="flex-shrink-0">{getLocationIcon(suggestion)}</div>
                                                    <span>{suggestion}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
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
                                <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base" />
                            </div>
                        </div>
                        {/* Drop-off Date */}
                        <div className="bg-white rounded-md p-2 flex items-center gap-2 w-1/2 relative">
                            <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="w-full">
                                <label className="text-xs text-slate-500">Drop-off</label>
                                <p className="font-bold text-slate-800 text-sm">{formatDateForDisplay(dropoffDate)}</p>
                                <input type="date" value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base" />
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
                        <input type="checkbox" onChange={(e) => setDifferentDropoff(e.target.checked)} className="h-5 w-5 rounded bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 focus:outline-none mr-2 border-0 shadow" />
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
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{getLocationIcon(location)}</div>
                                            <input id="pickup-location" type="text" placeholder="City, Airport or Station" className="block w-full pl-9 pr-3 border-none focus:ring-0 focus:outline-none text-base md:text-sm font-medium placeholder-slate-400 text-slate-900 h-10" value={location} onChange={handleLocationChange} onFocus={handleFocus} autoComplete="off" required />
                                        </div>
                                        {isSuggestionsOpen && suggestions.length > 0 && (
                                            <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                                <ul className="py-1">
                                                    {suggestions.map((suggestion) => (
                                                        <li key={suggestion}><button type="button" onClick={() => handleSuggestionClick(suggestion)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors flex items-center gap-3">{getLocationIcon(suggestion)}<span>{suggestion}</span></button></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {differentDropoff && (
                                    <div className="col-span-1">
                                         <div className="rounded-lg relative bg-white w-full h-full">
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Drop-off Location</label>
                                            <div className="relative border border-slate-300 rounded-[4px] overflow-hidden group bg-white focus-within:border-slate-300">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{getLocationIcon(dropoffLocation)}</div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter drop-off city"
                                                    className="block w-full pl-9 pr-3 border-none focus:ring-0 focus:outline-none text-base md:text-sm font-medium placeholder-slate-400 text-slate-900 h-10"
                                                    value={dropoffLocation}
                                                    onChange={handleDropoffLocationChange}
                                                    onFocus={handleDropoffFocus}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {isDropoffSuggestionsOpen && dropoffSuggestions.length > 0 && (
                                                <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                                    <ul className="py-1">
                                                        {dropoffSuggestions.map((suggestion) => (
                                                            <li key={suggestion}><button type="button" onClick={() => handleDropoffSuggestionClick(suggestion)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors flex items-center gap-3">{getLocationIcon(suggestion)}<span>{suggestion}</span></button></li>
                                                        ))}
                                                    </ul>
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
                                                    <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full h-10 pl-9 text-base md:text-sm font-medium border-none focus:ring-0 focus:outline-none text-slate-700 bg-transparent" />
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
                                                    <input type="date" value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} className="w-full h-10 pl-9 text-base md:text-sm font-medium border-none focus:ring-0 focus:outline-none text-slate-700 bg-transparent" />
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