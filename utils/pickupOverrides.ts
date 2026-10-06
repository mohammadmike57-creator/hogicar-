// Pick-up type overrides for external (API) suppliers.
//
// External suppliers' pick-up type (in terminal, meet & greet, shuttle bus) comes from the
// provider and is sometimes wrong. Admins can override it per supplier, for one location or
// for every location. Overrides are stored with the site content (supplierPickupOverrides)
// and applied to search results on the client.
import { Car } from '../types';
import { API_BASE_URL } from '../lib/config';

export type PickupTypeValue = 'IN_TERMINAL' | 'MEET_AND_GREET' | 'SHUTTLE_BUS';

export interface PickupOverride {
  pickupType: PickupTypeValue;
  supplierName?: string;
  supplierId?: string | number;
  vendorCode?: string;
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
const normCode = (code?: string) => (code || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
/** Supplier name without generic words, so "Monaco Rent a Car" matches "Monaco". */
const coreName = (name?: string) => normName(name).replace(/(rentacar|carrental|carrentals|rental|rentals|carhire|rentcar|cars|llc|ltd|co)$/g, '').replace(/(rentacar|carrental|rental|rentals|carhire|rentcar)/g, '');
const namesMatch = (a?: string, b?: string) => {
  const x = coreName(a), y = coreName(b);
  if (!x || !y) return false;
  return x === y || (Math.min(x.length, y.length) >= 4 && (x.startsWith(y) || y.startsWith(x)));
};
const locationsMatch = (a: string, b: string) => {
  const x = normCode(a), y = normCode(b);
  return !!x && !!y && (x === y || (Math.min(x.length, y.length) >= 3 && (x.startsWith(y) || y.startsWith(x))));
};

/** Keys from most to least specific: this location by id, by name, then all locations. */
export const overrideKeys = (location: string | undefined, supplierId?: string | number | null, supplierName?: string, vendorCode?: string) => {
  const loc = (location || '').toUpperCase();
  const keys: string[] = [];
  if (loc && normCode(vendorCode)) keys.push(`${loc}|vendor:${normCode(vendorCode)}`);
  if (loc && supplierId !== undefined && supplierId !== null && supplierId !== '') keys.push(`${loc}|id:${supplierId}`);
  if (loc && normName(supplierName)) keys.push(`${loc}|name:${normName(supplierName)}`);
  if (normCode(vendorCode)) keys.push(`*|vendor:${normCode(vendorCode)}`);
  if (supplierId !== undefined && supplierId !== null && supplierId !== '') keys.push(`*|id:${supplierId}`);
  if (normName(supplierName)) keys.push(`*|name:${normName(supplierName)}`);
  return keys;
};

/** Anything stored per supplier: matched by vendor code, id or name. */
export interface SupplierScopedEntry {
  supplierName?: string;
  supplierId?: string | number;
  vendorCode?: string;
}

/**
 * Finds the setting for a supplier at a location. Location-specific settings win over
 * "all locations". Within each, a supplier matches by provider vendor code, by id, or by
 * name (ignoring words like "rent a car"), so small differences between the admin data
 * and the search results don't stop it working.
 */
export const findSupplierEntry = <T extends SupplierScopedEntry>(
  map: Record<string, T> | null | undefined,
  location: string | undefined,
  supplierId?: string | number | null,
  supplierName?: string,
  vendorCode?: string,
  isUsable: (value: T) => boolean = value => !!value,
): (T & { key: string }) | undefined => {
  if (!map) return undefined;
  const entries = Object.entries(map).filter(([, v]) => v && isUsable(v));
  const matchesSupplier = (key: string, value: T) => {
    const ref = key.slice(key.indexOf('|') + 1);
    const [kind, ...rest] = ref.split(':');
    const keyValue = rest.join(':');
    // External suppliers in search results have ids like "ext-MONACO" (the vendor code).
    const vendor = normCode(vendorCode) || (String(supplierId ?? '').toLowerCase().startsWith('ext-') ? normCode(String(supplierId).slice(4)) : '');
    const vendorHit = !!vendor && (normCode(value.vendorCode) === vendor || (kind === 'vendor' && keyValue === vendor));
    const nameHit = !!supplierName && (
      namesMatch(value.supplierName, supplierName) ||
      (kind === 'name' && namesMatch(keyValue, supplierName)) ||
      // Some providers report the vendor code as the supplier name.
      (!!value.vendorCode && normCode(supplierName).startsWith(normCode(value.vendorCode)))
    );
    const idHit = supplierId !== undefined && supplierId !== null && supplierId !== '' &&
      ((kind === 'id' && keyValue === String(supplierId)) || (value.supplierId !== undefined && String(value.supplierId) === String(supplierId)));
    // Ids can come from different systems, so an id alone only counts when no names contradict it.
    return vendorHit || nameHit || (idHit && (!supplierName || !value.supplierName));
  };
  const here = entries.find(([key, value]) => !key.startsWith('*|') && location && locationsMatch(key.split('|')[0], location) && matchesSupplier(key, value));
  const everywhere = entries.find(([key, value]) => key.startsWith('*|') && matchesSupplier(key, value));
  const hit = here || everywhere;
  return hit ? { key: hit[0], ...hit[1] } : undefined;
};

export const findPickupOverride = (
  map: PickupOverrideMap | null | undefined,
  location: string | undefined,
  supplierId?: string | number | null,
  supplierName?: string,
  vendorCode?: string,
) => findSupplierEntry(map, location, supplierId, supplierName, vendorCode, v => !!v.pickupType);

// ---- Public side (search results) ----

let contentPromise: Promise<Record<string, any>> | null = null;

/** The public site content (one fresh request per page load, shared by every reader). */
export const loadSiteContent = (): Promise<Record<string, any>> => {
  if (!contentPromise) {
    // Fetched fresh (not from the browser cache) so admin changes show straight away.
    contentPromise = fetch(`${API_BASE_URL}/api/homepage/content?_=${Date.now()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : {}))
      .then((content: any) => (content && typeof content === 'object' && !Array.isArray(content) ? content : {}))
      .catch(() => ({}));
  }
  return contentPromise;
};

export const loadPickupOverrides = (): Promise<PickupOverrideMap> =>
  loadSiteContent().then(content => {
    const map = content?.[PICKUP_OVERRIDES_FIELD];
    return map && typeof map === 'object' && !Array.isArray(map) ? (map as PickupOverrideMap) : {};
  });

/** Returns the same array when nothing changes, so it is safe to call from effects. */
export const applyPickupOverrides = (cars: Car[], map: PickupOverrideMap, location: string | undefined): Car[] => {
  if (!map || !Object.keys(map).length) return cars;
  let changed = false;
  const next = cars.map(car => {
    const override = findPickupOverride(map, location, car.supplierId ?? car.supplier?.id, car.supplier?.name, car.vendorCode);
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
