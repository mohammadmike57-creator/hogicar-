import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Search as SearchIcon, MapPin, History, Plane, Building, LoaderCircle } from 'lucide-react';
import { fetchLocations, LocationSuggestion } from '../api';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationSuggestion) => void;
  recentLocations: LocationSuggestion[];
  saveRecentLocation: (loc: LocationSuggestion) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  recentLocations,
  saveRecentLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>();
  let scrollY = 0;

  // Lock/unlock body scroll when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      // Small delay to ensure the DOM is ready
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    }
    return () => {
      // Cleanup if unmounted while open
      if (isOpen) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const locations = await fetchLocations(searchQuery);
        setResults(locations);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, isOpen]);

  const getLocationIcon = (type: string, sizeClass = 'w-5 h-5') => {
    const lowerType = (type || '').toLowerCase();
    if (lowerType === 'airport') return <Plane className={`${sizeClass} text-green-600`} />;
    if (lowerType === 'city') return <Building className={`${sizeClass} text-amber-700`} />;
    return <MapPin className={`${sizeClass} text-slate-400`} />;
  };

  const handleSelect = (loc: LocationSuggestion) => {
    saveRecentLocation(loc);
    onSelectLocation(loc);
    onClose();
  };

  if (!isOpen) return null;

  // Use a portal to attach directly to body, avoiding any parent CSS issues
  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-white flex flex-col"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Search city or airport"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoCapitalize="off"
              autoComplete="off"
              inputMode="search"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '300px' }}
      >
        {/* Recent searches */}
        {searchQuery.length === 0 && recentLocations.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-400 px-4 mb-2 flex items-center gap-1">
              <History className="w-3 h-3" /> Recent searches
            </div>
            {recentLocations.map((loc) => (
              <button
                key={loc.value}
                onClick={() => handleSelect(loc)}
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
        {loading && (
          <div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search results */}
        {!loading && results.length > 0 && (
          <div>
            {results.map((loc) => (
              <button
                key={loc.value}
                onClick={() => handleSelect(loc)}
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

        {/* Empty states */}
        {!loading && searchQuery.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 text-base">No locations found</p>
            <p className="text-slate-400 text-sm mt-1">Try a different spelling</p>
          </div>
        )}

        {!loading && searchQuery.length < 2 && recentLocations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 text-base">Start typing</p>
            <p className="text-slate-400 text-sm mt-1">Enter at least 2 letters</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SearchOverlay;
