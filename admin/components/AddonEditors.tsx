import React from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle';
import Save from 'lucide-react/dist/esm/icons/save';
import AddonIcon from '../../components/AddonIcon';
import {
  ADDON_DEFINITIONS,
  AddonCatalog,
  AddonCode,
  AddonUnit,
  SupplierAddonsEntry,
  mergedCatalog,
} from '../../utils/addons';

const inputCls = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

const toNumber = (value: string) => {
  if (value.trim() === '') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

// ---------------------------------------------------------------------------
// Per-supplier prices (inside the external supplier editor)
// ---------------------------------------------------------------------------

export interface SupplierAddonDraftRow {
  offered: boolean;
  price: string;
  unit: AddonUnit;
  maxPrice: string;
}
export type SupplierAddonDraft = Record<AddonCode, SupplierAddonDraftRow>;

export const draftFromEntry = (entry: SupplierAddonsEntry | undefined, catalog: AddonCatalog): SupplierAddonDraft => {
  const merged = mergedCatalog(catalog);
  return Object.fromEntries(merged.map(item => {
    const own = entry?.addons?.[item.code];
    return [item.code, {
      offered: own ? own.enabled !== false : true,
      price: own && typeof own.price === 'number' ? String(own.price) : '',
      unit: own?.unit || item.unit,
      maxPrice: own?.maxPrice ? String(own.maxPrice) : '',
    }];
  })) as SupplierAddonDraft;
};

/** Converts the editor rows into what is stored; null when nothing is customised. */
export const addonsFromDraft = (draft: SupplierAddonDraft): SupplierAddonsEntry['addons'] | null => {
  const out: SupplierAddonsEntry['addons'] = {};
  (Object.keys(draft) as AddonCode[]).forEach(code => {
    const row = draft[code];
    const price = toNumber(row.price);
    if (!row.offered) out[code] = { enabled: false, price: null, unit: row.unit };
    else if (price !== null) out[code] = { enabled: true, price, unit: row.unit, maxPrice: toNumber(row.maxPrice) };
  });
  return Object.keys(out).length ? out : null;
};

export const SupplierAddonsEditor: React.FC<{
  catalog: AddonCatalog;
  draft: SupplierAddonDraft;
  onChange: (draft: SupplierAddonDraft) => void;
  allLocations: boolean;
  onAllLocationsChange: (value: boolean) => void;
  supplierName: string;
  currency: string;
}> = ({ catalog, draft, onChange, allLocations, onAllLocationsChange, supplierName, currency }) => {
  const items = mergedCatalog(catalog).filter(item => item.enabled);
  const set = (code: AddonCode, patch: Partial<SupplierAddonDraftRow>) => onChange({ ...draft, [code]: { ...draft[code], ...patch } });

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">Add-ons</h3>
      <p className="mt-0.5 text-sm text-slate-500">
        Prices customers see on the car page, paid at the desk. Leave a price empty to use the default
        {' '}from the add-on catalog (or “price at the desk” if there is none).
      </p>
      <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
        {items.map(item => {
          const row = draft[item.code];
          if (!row) return null;
          const fallback = item.defaultPrice !== null ? `${item.defaultPrice}` : 'At desk';
          return (
            <li key={item.code} className={`p-3 ${row.offered ? 'bg-white' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <AddonIcon code={item.code} active={row.offered} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${row.offered ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{item.name}</p>
                  <p className="text-xs text-slate-500">{row.offered ? (row.price ? 'Supplier price' : `Default: ${fallback}${item.defaultPrice !== null ? ` / ${item.unit === 'per_day' ? 'day' : 'rental'}` : ''}`) : 'Not offered by this supplier'}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.offered}
                  aria-label={`${item.name} offered`}
                  onClick={() => set(item.code, { offered: !row.offered })}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${row.offered ? 'bg-accent' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${row.offered ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {row.offered && (
                <div className="mt-2.5 grid grid-cols-[1fr_1fr_1fr] gap-2 pl-0 sm:pl-[68px]">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-slate-500">Price ({currency})</span>
                    <input type="number" min="0" step="0.01" inputMode="decimal" placeholder={fallback} className={inputCls} value={row.price} onChange={e => set(item.code, { price: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-slate-500">Charged</span>
                    <select className={inputCls} value={row.unit} onChange={e => set(item.code, { unit: e.target.value as AddonUnit })}>
                      <option value="per_day">Per day</option>
                      <option value="per_rental">Per rental</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-slate-500">Max / rental</span>
                    <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="No cap" disabled={row.unit !== 'per_day'} className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`} value={row.unit === 'per_day' ? row.maxPrice : ''} onChange={e => set(item.code, { maxPrice: e.target.value })} />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <label className="mt-3 flex items-center gap-2.5 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent" checked={allLocations} onChange={e => onAllLocationsChange(e.target.checked)} />
        Use these add-on prices at all of {supplierName}’s locations
      </label>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Catalog (photos, names, default prices) – side panel
// ---------------------------------------------------------------------------

interface CatalogRow {
  enabled: boolean;
  name: string;
  description: string;
  defaultPrice: string;
  unit: AddonUnit;
  maxPrice: string;
}

export const AddonCatalogPanel: React.FC<{
  open: boolean;
  catalog: AddonCatalog;
  onClose: () => void;
  onSave: (catalog: AddonCatalog) => Promise<void>;
}> = ({ open, catalog, onClose, onSave }) => {
  const [rows, setRows] = React.useState<Record<string, CatalogRow>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setRows(Object.fromEntries(ADDON_DEFINITIONS.map(def => {
      const c = catalog[def.code] || {};
      return [def.code, {
        enabled: c.enabled !== false,
        name: c.name || '',
        description: c.description || '',
        defaultPrice: typeof c.defaultPrice === 'number' ? String(c.defaultPrice) : '',
        unit: c.unit || 'per_day',
        maxPrice: typeof c.maxPrice === 'number' ? String(c.maxPrice) : '',
      }];
    })));
  }, [open, catalog]);

  if (!open) return null;

  const set = (code: string, patch: Partial<CatalogRow>) => setRows(prev => ({ ...prev, [code]: { ...prev[code], ...patch } }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const next: AddonCatalog = {};
      ADDON_DEFINITIONS.forEach(def => {
        const r = rows[def.code];
        if (!r) return;
        next[def.code] = {
          enabled: r.enabled,
          name: r.name.trim() || undefined,
          description: r.description.trim() || undefined,
          defaultPrice: toNumber(r.defaultPrice),
          unit: r.unit,
          maxPrice: r.unit === 'per_day' ? toNumber(r.maxPrice) : null,
        };
      });
      await onSave(next);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="addon-catalog-title">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="addon-catalog-title" className="text-lg font-semibold text-slate-900">Add-on catalog</h2>
            <p className="mt-0.5 text-sm text-slate-500">Names, descriptions and default prices shown on every car page. Suppliers can have their own prices.</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {ADDON_DEFINITIONS.map(def => {
            const r = rows[def.code];
            if (!r) return null;
            return (
              <div key={def.code} className={`rounded-xl border p-4 ${r.enabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <AddonIcon code={def.code} active={r.enabled} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{r.name || def.name}</p>
                    <p className="text-xs text-slate-500">{r.enabled ? 'Shown to customers' : 'Hidden from customers'}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={r.enabled}
                    aria-label={`Show ${def.name}`}
                    onClick={() => set(def.code, { enabled: !r.enabled })}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${r.enabled ? 'bg-accent' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                {r.enabled && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
                      <input className={inputCls} placeholder={def.name} value={r.name} onChange={e => set(def.code, { name: e.target.value })} />
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Default price</span>
                        <input type="number" min="0" step="0.01" placeholder="At desk" className={inputCls} value={r.defaultPrice} onChange={e => set(def.code, { defaultPrice: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Charged</span>
                        <select className={inputCls} value={r.unit} onChange={e => set(def.code, { unit: e.target.value as AddonUnit })}>
                          <option value="per_day">Per day</option>
                          <option value="per_rental">Per rental</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Max</span>
                        <input type="number" min="0" step="0.01" placeholder="No cap" disabled={r.unit !== 'per_day'} className={`${inputCls} disabled:bg-slate-100`} value={r.unit === 'per_day' ? r.maxPrice : ''} onChange={e => set(def.code, { maxPrice: e.target.value })} />
                      </label>
                    </div>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
                      <input className={inputCls} placeholder={def.description} value={r.description} onChange={e => set(def.code, { description: e.target.value })} />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-200/60">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
