import { adminFetch } from '../lib/adminApi';
import { overrideKeys } from '../utils/pickupOverrides';
import {
  ADDON_CATALOG_FIELD,
  SUPPLIER_ADDONS_FIELD,
  AddonCatalog,
  SupplierAddonsEntry,
  SupplierAddonsMap,
} from '../utils/addons';

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const normCode = (code?: string) => (code || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
const normName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

export interface AdminAddonSettings {
  catalog: AddonCatalog;
  supplierAddons: SupplierAddonsMap;
}

const pick = (content: any): AdminAddonSettings => ({
  catalog: isObj(content?.[ADDON_CATALOG_FIELD]) ? content[ADDON_CATALOG_FIELD] : {},
  supplierAddons: isObj(content?.[SUPPLIER_ADDONS_FIELD]) ? content[SUPPLIER_ADDONS_FIELD] : {},
});

export async function fetchAddonSettings(): Promise<AdminAddonSettings> {
  return pick(await adminFetch('/api/admin/homepage'));
}

/** Reads the site content, applies a change, writes it back and returns what the server kept. */
async function updateContent(mutate: (content: Record<string, any>) => Record<string, any>) {
  const content = await adminFetch('/api/admin/homepage');
  if (!isObj(content)) throw new Error('Could not load the site content to store the add-ons.');
  await adminFetch('/api/admin/homepage', { method: 'PUT', body: JSON.stringify(mutate(content)) });
  return pick(await adminFetch('/api/admin/homepage'));
}

export async function saveAddonCatalog(catalog: AddonCatalog): Promise<AdminAddonSettings> {
  return updateContent(content => ({ ...content, [ADDON_CATALOG_FIELD]: catalog }));
}

/**
 * Saves (or clears, when addons is null) one external supplier's add-on prices, at one
 * location or at all of the supplier's locations. Other settings for the same supplier
 * at that scope are replaced so only one is in effect.
 */
export async function saveSupplierAddons(params: {
  location: string;
  supplierId: number | string;
  supplierName: string;
  vendorCode?: string;
  addons: SupplierAddonsEntry['addons'] | null;
  allLocations: boolean;
}): Promise<AdminAddonSettings> {
  const loc = params.location.toUpperCase();
  const vendor = normCode(params.vendorCode);
  const name = normName(params.supplierName);
  return updateContent(content => {
    const map: SupplierAddonsMap = { ...(isObj(content[SUPPLIER_ADDONS_FIELD]) ? content[SUPPLIER_ADDONS_FIELD] : {}) };
    Object.entries(map).forEach(([key, value]) => {
      const scope = key.split('|')[0];
      if (scope !== loc && !(params.allLocations && scope === '*')) return;
      const sameSupplier = (vendor && normCode(value?.vendorCode) === vendor)
        || (name && normName(value?.supplierName) === name)
        || overrideKeys(scope === '*' ? undefined : loc, params.supplierId, params.supplierName, params.vendorCode).includes(key);
      if (sameSupplier) delete map[key];
    });
    const key = overrideKeys(params.allLocations ? undefined : loc, params.supplierId, params.supplierName, params.vendorCode)[0];
    if (params.addons && key) {
      map[key] = {
        supplierName: params.supplierName,
        supplierId: params.supplierId,
        vendorCode: params.vendorCode,
        addons: params.addons,
        updatedAt: new Date().toISOString(),
      };
    }
    return { ...content, [SUPPLIER_ADDONS_FIELD]: map };
  });
}
