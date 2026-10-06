import React from 'react';
import PlaneLanding from 'lucide-react/dist/esm/icons/plane-landing';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import BusFront from 'lucide-react/dist/esm/icons/bus-front';
import Building from 'lucide-react/dist/esm/icons/building-2';

type Size = 'xs' | 'sm' | 'md';

const SIZES: Record<Size, { box: string; icon: string }> = {
  xs: { box: 'h-6 w-6', icon: 'h-3.5 w-3.5' },
  sm: { box: 'h-7 w-7', icon: 'h-4 w-4' },
  md: { box: 'h-8 w-8', icon: 'h-4 w-4' },
};

/** Normalises the different spellings used across the site ("In Terminal", "IN_TERMINAL", ...). */
export const normalizePickupType = (value?: string | null) => {
  const v = String(value || '').toUpperCase().replace(/[^A-Z]+/g, '_');
  if (v.includes('TERMINAL')) return 'IN_TERMINAL';
  if (v.includes('MEET')) return 'MEET_AND_GREET';
  if (v.includes('SHUTTLE') || v.includes('BUS')) return 'SHUTTLE_BUS';
  return undefined;
};

export const pickupIconFor = (value?: string | null) => {
  const type = normalizePickupType(value);
  return type === 'IN_TERMINAL' ? PlaneLanding : type === 'MEET_AND_GREET' ? Handshake : type === 'SHUTTLE_BUS' ? BusFront : Building;
};

/** Green round badge with the pick-up type's icon: airplane, handshake or shuttle bus. */
const PickupTypeIcon: React.FC<{ type?: string | null; size?: Size; className?: string }> = ({ type, size = 'sm', className = '' }) => {
  const Icon = pickupIconFor(type);
  const known = !!normalizePickupType(type);
  const s = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${s.box} ${
        known ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/20' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      } ${className}`}
    >
      <Icon className={s.icon} strokeWidth={2.25} />
    </span>
  );
};

export default PickupTypeIcon;
