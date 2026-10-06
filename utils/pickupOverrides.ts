// Pick-up type overrides for external (API) suppliers.
//
// External suppliers' pick-up type (in terminal, meet & greet, shuttle bus) comes from the
// provider and is sometimes wrong. Admins can override it per supplier, for one location or
// for every location. Overrides are stored with the site content (supplierPickupOverrides)
// and applied to search results on the client.
import { Car } from '../types';
import { fetchHomepageContent } from '../api';

export type PickupTypeValue = 'IN_TERMINAL' | 'MEET_AND_GREET' | 'SHUTTLE_BUS';

export interface PickupOverride {
  pickupType: PickupTypeValue;
  supplierName?: string;
  updatedAt?: string;
}

export type PickupOverrideMap = Record<string, PickupOverride>;

export const PICKUP_OVERRIDES_FIELD = 'supplierPickupOverrides';

export const PICKUP_TYPE_OPTIONS: { value: PickupTypeValue; label: string; description: string }[] = [
  { value: 'IN_TERMINAL', label: 'In terminal', description: 'Rental desk inside the airport terminal' },
  { value: 'MEET_AND_GREET', label: 'Meet & greet', description: 'An agent meets the customer at arrivals' },
  { value: 'SHUTTLE_BUS', label: 'Shuttle bus', description: 'Free shuttle to an off-airport office' },
];

export const pickupTypeLabel = (value?: string) => PICKUP_TYPE_OPTIONS.find(o => o.value === value)?.label;

const normName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Keys from most to least specific: this location by id, by name, then all locations. */
export const overrideKeys = (location: string | undefined, supplierId?: string | number | null, supplierName?: string) => {
  const loc = (location || '').toUpperCase();
  const keys: string[] = [];
  if (loc && supplierId !== undefined && supplierId !== null && supplierId !== '') keys.push(`${loc}|id:${supplierId}`);
  if (loc && normName(supplierName)) keys.push(`${loc}|name:${normName(supplierName)}`);
  if (supplierId !== undefined && supplierId !== null && supplierId !== '') keys.push(`*|id:${supplierId}`);
  if (normName(supplierName)) keys.push(`*|name:${normName(supplierName)}`);
  return keys;
};

export const findPickupOverride = (map: PickupOverrideMap | null | undefined, location: string | undefined, supplierId?: string | number | null, supplierName?: string) => {
  if (!map) return undefined;
  for (const key of overrideKeys(location, supplierId, supplierName)) {
    if (map[key]) return { key, ...map[key] };
  }
  return undefined;
};

// ---- Public side (search results) ----

let overridesPromise: Promise<PickupOverrideMap> | null = null;

export const loadPickupOverrides = (): Promise<PickupOverrideMap> => {
  if (!overridesPromise) {
    overridesPromise = fetchHomepageContent()
      .then(content => {
        const map = content?.[PICKUP_OVERRIDES_FIELD];
        return map && typeof map === 'object' && !Array.isArray(map) ? (map as PickupOverrideMap) : {};
      })
      .catch(() => ({}));
  }
  return overridesPromise;
};

/** Returns the same array when nothing changes, so it is safe to call from effects. */
export const applyPickupOverrides = (cars: Car[], map: PickupOverrideMap, location: string | undefined): Car[] => {
  if (!map || !Object.keys(map).length) return cars;
  let changed = false;
  const next = cars.map(car => {
    const override = findPickupOverride(map, location, car.supplierId ?? car.supplier?.id, car.supplier?.name);
    // "Hogi Car Choice" copies keep the original supplier id; the name check covers the rest.
    if (!override || car.supplier?.pickupType === override.pickupType) return car;
    changed = true;
    return {
      ...car,
      locationDetail: pickupTypeLabel(override.pickupType) || car.locationDetail,
      supplier: { ...car.supplier, pickupType: override.pickupType as any },
    };
  });
  return changed ? next : cars;
};
