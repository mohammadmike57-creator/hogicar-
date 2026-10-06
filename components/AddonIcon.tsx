import React from 'react';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Baby from 'lucide-react/dist/esm/icons/baby';
import Navigation from 'lucide-react/dist/esm/icons/navigation';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import Snowflake from 'lucide-react/dist/esm/icons/snowflake';
import PackagePlus from 'lucide-react/dist/esm/icons/package-plus';

type IconProps = { className?: string; strokeWidth?: number };

// Seat icons drawn in the same style as the lucide set (24px grid, round strokes).
const ChildSeat: React.FC<IconProps> = ({ className, strokeWidth = 2 }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3h3a2 2 0 0 1 2 2v7h3.5a2.5 2.5 0 0 1 2.5 2.5V17a1 1 0 0 1-1 1H9a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z" />
    <path d="M9 7.5h1.5" />
    <path d="M7 21h11" />
    <path d="M10 18v3" />
    <path d="M16 18v3" />
  </svg>
);

const BoosterSeat: React.FC<IconProps> = ({ className, strokeWidth = 2 }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 13V9.5A1.5 1.5 0 0 1 7.5 8h0A1.5 1.5 0 0 1 9 9.5V13" />
    <path d="M18 13V9.5A1.5 1.5 0 0 0 16.5 8h0A1.5 1.5 0 0 0 15 9.5V13" />
    <path d="M4 13h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3Z" />
    <path d="M7 21h10" />
    <path d="M12 18v3" />
  </svg>
);

const ICONS: Record<string, React.ElementType> = {
  ADDITIONAL_DRIVER: UserPlus,
  BABY_SEAT: Baby,
  CHILD_SEAT: ChildSeat,
  BOOSTER_SEAT: BoosterSeat,
  GPS: Navigation,
  WIFI: Wifi,
  SNOW_CHAINS: Snowflake,
};

export const addonIconFor = (code?: string) => ICONS[code || ''] || PackagePlus;

/** Rounded icon tile for an add-on. `active` switches it to the solid brand colour. */
const AddonIcon: React.FC<{ code?: string; active?: boolean; size?: 'sm' | 'md'; className?: string }> = ({ code, active, size = 'md', className = '' }) => {
  const Icon = addonIconFor(code);
  const box = size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-12 w-12 rounded-xl';
  const icon = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-6 w-6';
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center transition-colors ${box} ${
        active ? 'bg-accent text-white shadow-[0_6px_14px_-8px_rgba(0,122,194,0.9)]' : 'bg-accent-50 text-accent ring-1 ring-inset ring-accent/15'
      } ${className}`}
    >
      <Icon className={icon} strokeWidth={1.9} />
    </span>
  );
};

export default AddonIcon;
