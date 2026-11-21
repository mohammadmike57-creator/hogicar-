import * as React from 'react';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import type { LocationSuggestion } from '../api';

/** Green plane for airports, brown buildings for cities and downtown places. */
export const LocationIcon: React.FC<{ type?: string; className?: string }> = ({ type, className = 'h-6 w-6' }) => {
  const t = (type || '').toLowerCase();
  if (t === 'airport') return <Plane className={`${className} text-[#16a34a]`} strokeWidth={1.75} aria-hidden="true" />;
  if (t === 'city') return <Building2 className={`${className} text-[#92400e]`} strokeWidth={1.75} aria-hidden="true" />;
  return <MapPin className={`${className} text-slate-500`} strokeWidth={1.75} aria-hidden="true" />;
};

/** First line: the place (with the airport code). Second line: city, region, country. */
export const locationLines = (s: Partial<LocationSuggestion>) => {
  const title = s.title || (s.name ? `${s.name}${s.iataCode ? ` (${s.iataCode})` : ''}` : s.label || '');
  const subtitle = s.subtitle ?? [s.municipality, s.countryCode]
    .filter((p, i, a) => p && p !== 'N/A' && a.indexOf(p) === i)
    .join(', ');
  return { title, subtitle };
};

/** One row of the location list. */
export const LocationOption: React.FC<{ suggestion: Partial<LocationSuggestion>; onSelect: () => void; selected?: boolean }> = ({ suggestion, onSelect, selected }) => {
  const { title, subtitle } = locationLines(suggestion);
  return (
    <button
      type="button"
      role="option"
      aria-selected={!!selected}
      onClick={onSelect}
      className="flex w-full items-center gap-4 px-4 py-3 text-start transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        <LocationIcon type={suggestion.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium leading-snug text-slate-900">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] leading-snug text-slate-500">{subtitle}</span>}
      </span>
    </button>
  );
};

export default LocationOption;
