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

  // Lock/unlock body scroll and force body to no margins
  useEffect(() => {
    if (isOpen) {
      scrollY = window.scrollY;
      const originalMargin = document.body.style.margin;
      const originalPadding = document.body.style.padding;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      
      return () => {
        document.body.style.margin = originalMargin;
        document.body.style.padding = originalPadding;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.documentElement.style.margin = '';
        document.documentElement.style.padding = '';
        window.scrollTo(0, scrollY);
      };
    }
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

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={20} color="#475569" />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.outline = '2px solid #3b82f6'}
              onBlur={(e) => e.currentTarget.style.outline = 'none'}
            />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '300px'
        }}
      >
        {/* Recent searches */}
        {searchQuery.length === 0 && recentLocations.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', padding: '0 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <History size={12} /> Recent searches
            </div>
            {recentLocations.map((loc) => (
              <button
                key={loc.value}
                onClick={() => handleSelect(loc)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getLocationIcon(loc.type, 'w-5 h-5')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px' }}>{loc.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{loc.iataCode}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Professional Loading Message (instead of skeleton) */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' }}>
            <LoaderCircle size={32} style={{ color: '#16a34a', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p style={{ color: '#475569', fontSize: '15px', fontWeight: 500 }}>We are currently searching...</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Please wait a moment</p>
          </div>
        )}

        {/* Search results */}
        {!loading && results.length > 0 && (
          <div>
            {results.map((loc) => (
              <button
                key={loc.value}
                onClick={() => handleSelect(loc)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getLocationIcon(loc.type, 'w-5 h-5')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px' }}>{loc.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{loc.iataCode}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && searchQuery.length >= 2 && results.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '9999px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MapPin size={28} color="#94a3b8" />
            </div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>No locations found</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Try a different spelling</p>
          </div>
        )}

        {!loading && searchQuery.length < 2 && recentLocations.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '9999px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <SearchIcon size={28} color="#94a3b8" />
            </div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Start typing</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Enter at least 2 letters</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SearchOverlay;
