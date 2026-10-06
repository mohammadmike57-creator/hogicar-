// Rental add-ons (additional driver, child seats, GPS, ...).
//
// The catalog (names, photos, default prices) and each external supplier's own prices are
// set in the admin and stored with the site content, like the pick-up type overrides:
//   addonCatalog:    { [code]: { name?, description?, enabled?, defaultPrice?, unit?, maxPrice? } }
//   supplierAddons:  { "<LOC>|vendor:CODE" | "*|vendor:CODE" ...: { supplierName, vendorCode, addons: { [code]: { price, unit, maxPrice?, enabled } } } }
// The car page turns them into car.extras, which the booking flow already understands.
import { Car, Extra } from '../types';
import { findSupplierEntry, loadSiteContent, SupplierScopedEntry } from './pickupOverrides';

export const ADDON_CATALOG_FIELD = 'addonCatalog';
export const SUPPLIER_ADDONS_FIELD = 'supplierAddons';

export type AddonUnit = 'per_day' | 'per_rental';
export type AddonCode = 'ADDITIONAL_DRIVER' | 'BABY_SEAT' | 'CHILD_SEAT' | 'BOOSTER_SEAT' | 'GPS' | 'WIFI' | 'SNOW_CHAINS';

export interface AddonDefinition {
  code: AddonCode;
  name: string;
  description: string;
  /** How many a customer can add (seats: up to 3). */
  maxQuantity: number;
}

export const ADDON_DEFINITIONS: AddonDefinition[] = [
  { code: 'ADDITIONAL_DRIVER', name: 'Additional driver', description: 'Share the driving. The extra driver must show a valid licence at pick-up.', maxQuantity: 3 },
  { code: 'BABY_SEAT', name: 'Baby seat', description: 'Rear-facing infant seat for babies up to 13 kg (0–15 months).', maxQuantity: 3 },
  { code: 'CHILD_SEAT', name: 'Child seat', description: 'Forward-facing seat for children 9–18 kg (about 1–4 years).', maxQuantity: 3 },
  { code: 'BOOSTER_SEAT', name: 'Booster seat', description: 'Raises older children, 15–36 kg (about 4–12 years), so the belt fits safely.', maxQuantity: 3 },
  { code: 'GPS', name: 'GPS navigation', description: 'Satellite navigation with up-to-date local maps.', maxQuantity: 1 },
  { code: 'WIFI', name: 'Wi-Fi hotspot', description: 'Portable 4G hotspot to keep everyone connected on the road.', maxQuantity: 1 },
  { code: 'SNOW_CHAINS', name: 'Snow chains', description: 'Recommended or required on mountain roads in winter.', maxQuantity: 1 },
];

export interface AddonCatalogEntry {
  name?: string;
  description?: string;
  /** Hidden from customers when false. */
  enabled?: boolean;
  /** Used for suppliers without their own price. Empty = "price confirmed at the desk". */
  defaultPrice?: number | null;
  unit?: AddonUnit;
  maxPrice?: number | null;
}
export type AddonCatalog = Partial<Record<AddonCode, AddonCatalogEntry>>;

export interface SupplierAddonPrice {
  price: number | null;
  unit: AddonUnit;
  maxPrice?: number | null;
  enabled: boolean;
}
export interface SupplierAddonsEntry extends SupplierScopedEntry {
  addons: Partial<Record<AddonCode, SupplierAddonPrice>>;
  updatedAt?: string;
}
export type SupplierAddonsMap = Record<string, SupplierAddonsEntry>;

/** Extra as shown on the car page. */
export interface AddonExtra extends Extra {
  code: AddonCode;
  maxPrice?: number | null;
  maxQuantity: number;
  /** No price set: the supplier confirms and charges it at the desk. */
  onRequest?: boolean;
}

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Catalog with admin changes applied on top of the built-in definitions. */
export const mergedCatalog = (catalog: AddonCatalog | null | undefined) =>
  ADDON_DEFINITIONS.map(def => {
    const custom = (catalog || {})[def.code] || {};
    return {
      ...def,
      name: custom.name?.trim() || def.name,
      description: custom.description?.trim() || def.description,
      enabled: custom.enabled !== false,
      defaultPrice: typeof custom.defaultPrice === 'number' && custom.defaultPrice >= 0 ? custom.defaultPrice : null,
      unit: custom.unit || 'per_day' as AddonUnit,
      maxPrice: typeof custom.maxPrice === 'number' && custom.maxPrice > 0 ? custom.maxPrice : null,
    };
  });

export const loadAddonSettings = () =>
  loadSiteContent().then(content => ({
    catalog: (isObj(content[ADDON_CATALOG_FIELD]) ? content[ADDON_CATALOG_FIELD] : {}) as AddonCatalog,
    supplierAddons: (isObj(content[SUPPLIER_ADDONS_FIELD]) ? content[SUPPLIER_ADDONS_FIELD] : {}) as SupplierAddonsMap,
  }));

/**
 * The add-ons offered with a car: the supplier's own prices when the admin set them,
 * otherwise the catalog default, otherwise "price confirmed at the desk".
 * Extras the car already has from its supplier are kept.
 */
export const buildCarAddons = (
  car: Car,
  settings: { catalog: AddonCatalog; supplierAddons: SupplierAddonsMap },
  location: string | undefined,
): AddonExtra[] => {
  const supplierEntry = findSupplierEntry(
    settings.supplierAddons,
    location,
    car.supplierId ?? car.supplier?.id,
    car.supplier?.name,
    car.vendorCode,
    v => isObj(v.addons),
  );
  return mergedCatalog(settings.catalog)
    .filter(item => item.enabled)
    .map(item => {
      const own = supplierEntry?.addons?.[item.code];
      if (own && own.enabled === false) return null;
      const ownPrice = own && typeof own.price === 'number' && own.price >= 0 ? own : null;
      const price = ownPrice ? ownPrice.price as number : item.defaultPrice;
      const unit = ownPrice ? ownPrice.unit : item.unit;
      const maxPrice = ownPrice ? (ownPrice.maxPrice || null) : item.maxPrice;
      return {
        id: `addon-${item.code}`,
        code: item.code,
        name: item.name,
        description: item.description,
        price: price ?? 0,
        type: unit,
        maxPrice,
        maxQuantity: item.maxQuantity,
        onRequest: price === null,
      } as AddonExtra;
    })
    .filter(Boolean) as AddonExtra[];
};

/** Adds the add-ons to car.extras (keeping any the supplier already provides). */
export const withAddons = (car: Car, addons: AddonExtra[]): Car => {
  const own = (car.extras || []).filter(e => !String(e.id).startsWith('addon-'));
  const next = [...own, ...addons];
  const same = JSON.stringify(next) === JSON.stringify(car.extras || []);
  return same ? car : { ...car, extras: next };
};

/** Price of one unit of an extra for the rental, with the per-rental cap applied. */
export const extraUnitTotal = (extra: Extra & { maxPrice?: number | null }, days: number) => {
  const raw = extra.type === 'per_day' ? extra.price * days : extra.price;
  return extra.maxPrice && extra.maxPrice > 0 ? Math.min(raw, extra.maxPrice) : raw;
};

/** selectedExtraIds may repeat an id once per unit (e.g. two child seats). */
export const countSelected = (selectedExtraIds: string[], id: string) => selectedExtraIds.filter(x => x === id).length;
