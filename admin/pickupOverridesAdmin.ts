import { adminFetch } from '../lib/adminApi';
import { API_BASE_URL } from '../lib/config';
import { PICKUP_OVERRIDES_FIELD, PickupOverrideMap, PickupTypeValue, overrideKeys } from '../utils/pickupOverrides';

const isPlainObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const normCode = (code?: string) => (code || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
const normName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

export async function fetchPickupOverrides(): Promise<PickupOverrideMap> {
  const content = await adminFetch('/api/admin/homepage');
  const map = isPlainObject(content) ? content[PICKUP_OVERRIDES_FIELD] : undefined;
  return isPlainObject(map) ? (map as PickupOverrideMap) : {};
}

/** What the public website receives (the search page reads this endpoint). */
async function fetchPublicOverrides(): Promise<PickupOverrideMap | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/homepage/content?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const content = await res.json();
    const map = isPlainObject(content) ? content[PICKUP_OVERRIDES_FIELD] : undefined;
    return isPlainObject(map) ? (map as PickupOverrideMap) : {};
  } catch {
    return null;
  }
}

export interface SavePickupResult {
  overrides: PickupOverrideMap;
  /** False when the setting was stored but the public website does not receive it. */
  publicOk: boolean;
}

/**
 * Saves (or clears, when pickupType is null) the pick-up type override for one external
 * supplier, either at one location or at every location. The site content is read, merged
 * and written back, then read again to confirm the server kept the setting, and the public
 * endpoint is checked to confirm the website receives it.
 */
export async function savePickupOverride(params: {
  location: string;
  supplierId: number | string;
  supplierName: string;
  vendorCode?: string;
  pickupType: PickupTypeValue | null;
  allLocations: boolean;
}): Promise<SavePickupResult> {
  const content = await adminFetch('/api/admin/homepage');
  if (!isPlainObject(content)) {
    throw new Error('Could not load the site content to store the pick-up setting.');
  }
  const map: PickupOverrideMap = { ...(isPlainObject(content[PICKUP_OVERRIDES_FIELD]) ? content[PICKUP_OVERRIDES_FIELD] : {}) };
  const loc = params.location.toUpperCase();
  const vendor = normCode(params.vendorCode);
  const name = normName(params.supplierName);

  // Remove existing settings for this supplier at this location (and everywhere, if the new
  // setting applies to all locations), so only one setting is in effect.
  Object.entries(map).forEach(([key, value]) => {
    const scope = key.split('|')[0];
    if (scope !== loc && !(params.allLocations && scope === '*')) return;
    const sameSupplier = (vendor && normCode(value?.vendorCode) === vendor)
      || (name && normName(value?.supplierName) === name)
      || overrideKeys(scope === '*' ? undefined : loc, params.supplierId, params.supplierName, params.vendorCode).includes(key);
    if (sameSupplier) delete map[key];
  });

  const keys = overrideKeys(params.allLocations ? undefined : loc, params.supplierId, params.supplierName, params.vendorCode);
  const key = keys[0];
  if (params.pickupType && key) {
    map[key] = {
      pickupType: params.pickupType,
      supplierName: params.supplierName,
      supplierId: params.supplierId,
      vendorCode: params.vendorCode,
      updatedAt: new Date().toISOString(),
    };
  }

  await adminFetch('/api/admin/homepage', {
    method: 'PUT',
    body: JSON.stringify({ ...content, [PICKUP_OVERRIDES_FIELD]: map }),
  });

  const saved = await fetchPickupOverrides();
  const expected = params.pickupType && key ? map[key].pickupType : undefined;
  if (key && saved[key]?.pickupType !== expected) {
    throw new Error('The server did not keep the pick-up setting. The backend needs to store "supplierPickupOverrides" with the homepage content.');
  }

  const publicMap = await fetchPublicOverrides();
  const publicOk = !key || (publicMap !== null && publicMap[key]?.pickupType === expected);
  return { overrides: saved, publicOk };
}
