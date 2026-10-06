import { adminFetch } from '../lib/adminApi';
import { PICKUP_OVERRIDES_FIELD, PickupOverrideMap, PickupTypeValue, overrideKeys } from '../utils/pickupOverrides';

const isPlainObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export async function fetchPickupOverrides(): Promise<PickupOverrideMap> {
  const content = await adminFetch('/api/admin/homepage');
  const map = isPlainObject(content) ? content[PICKUP_OVERRIDES_FIELD] : undefined;
  return isPlainObject(map) ? (map as PickupOverrideMap) : {};
}

/**
 * Saves (or clears, when pickupType is null) the pick-up type override for one external
 * supplier, either at one location or at every location. The site content is read, merged
 * and written back, then read again to confirm the server kept the setting.
 */
export async function savePickupOverride(params: {
  location: string;
  supplierId: number | string;
  supplierName: string;
  pickupType: PickupTypeValue | null;
  allLocations: boolean;
}): Promise<PickupOverrideMap> {
  const content = await adminFetch('/api/admin/homepage');
  if (!isPlainObject(content)) {
    throw new Error('Could not load the site content to store the pick-up setting.');
  }
  const map: PickupOverrideMap = { ...(isPlainObject(content[PICKUP_OVERRIDES_FIELD]) ? content[PICKUP_OVERRIDES_FIELD] : {}) };

  // Remove any existing override for this supplier at this location (and everywhere, if the
  // new setting applies to all locations), so only one setting is in effect.
  const here = overrideKeys(params.location, params.supplierId, params.supplierName).filter(k => !k.startsWith('*|'));
  const everywhere = overrideKeys(undefined, params.supplierId, params.supplierName);
  [...here, ...(params.allLocations ? everywhere : [])].forEach(key => { delete map[key]; });

  const key = params.allLocations ? everywhere[0] : here[0];
  if (params.pickupType && key) {
    map[key] = { pickupType: params.pickupType, supplierName: params.supplierName, updatedAt: new Date().toISOString() };
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
  return saved;
}
