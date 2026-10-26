import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Globe from 'lucide-react/dist/esm/icons/globe-2';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Building from 'lucide-react/dist/esm/icons/building-2';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash from 'lucide-react/dist/esm/icons/trash-2';
import Users from 'lucide-react/dist/esm/icons/users';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import { adminFetch } from '../../lib/adminApi';
import { Hero, heroButton, heroPrimary, Segmented, num, inputCls, Field, useToast, Toast, Drawer, ErrorBanner, Spinner } from './commercialUi';

type Location = { id: number; iataCode?: string | null; name: string; municipality?: string | null; countryCode?: string | null; type?: string | null };
type Kind = 'airport' | 'city' | 'other';
type Filter = 'all' | 'airport' | 'city' | 'used' | 'unused';
type Usage = { cars: number; suppliers: number };
type Form = { iataCode: string; name: string; municipality: string; countryCode: string; kind: 'airport' | 'city'; type: string };

const PAGE = 60;

/** "large_airport", "Airport" → airport; "city", "downtown" → city. */
const kindOf = (type?: string | null): Kind => {
  const t = (type || '').toLowerCase();
  if (t.includes('airport')) return 'airport';
  if (!t || t.includes('city') || t.includes('down') || t.includes('town')) return 'city';
  return 'other';
};
const kindLabel = (type?: string | null) => {
  const k = kindOf(type);
  if (k === 'airport') return 'Airport';
  if (k === 'city') return 'City / downtown';
  return (type || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
};

const regionNames = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; }
})();
/** "JO" → "Jordan"; null when it isn't a country code. */
const countryName = (code?: string | null) => {
  const c = (code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return null;
  try {
    const n = regionNames?.of(c);
    return n && n !== c ? n : null;
  } catch { return null; }
};
const flag = (code?: string | null) => {
  const c = (code || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0))) : '';
};

const errorText = (e: any, fallback: string) => {
  const m = String(e?.message || '');
  const hit = /status \d+: (.*)$/s.exec(m);
  const text = (hit ? hit[1] : m).trim();
  return text && !text.startsWith('<') && !text.startsWith('{') ? text : fallback;
};

const iconBtn = 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900';
const emptyForm: Form = { iataCode: '', name: '', municipality: '', countryCode: '', kind: 'airport', type: 'Airport' };

const KindTile: React.FC<{ type?: string | null; code?: string | null }> = ({ type, code }) => {
  const k = kindOf(type);
  return (
    <span className={`flex h-12 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl px-1 ring-1 ring-inset ${k === 'airport' ? 'bg-sky-50 text-sky-800 ring-sky-600/15' : 'bg-violet-50 text-violet-800 ring-violet-600/15'}`}>
      {k === 'airport' ? <Plane className="h-3.5 w-3.5 opacity-70" /> : <Building className="h-3.5 w-3.5 opacity-70" />}
      <span className={`mt-0.5 max-w-full truncate font-mono font-semibold leading-none ${(code || '').length > 4 ? 'text-[10px]' : 'text-[13px] tracking-wide'}`} title={code || undefined}>{code || '—'}</span>
    </span>
  );
};

/** Small confirm dialog. */
const Confirm: React.FC<{ title: string; text: React.ReactNode; confirmLabel: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }> = ({ title, text, confirmLabel, busy, onCancel, onConfirm }) =>
  createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center p-0 sm:items-center sm:p-4" role="alertdialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50" onClick={() => !busy && onCancel()} />
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Trash className="h-5 w-5" /></span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
        <div className="mt-1.5 text-sm text-slate-600">{text}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onCancel} disabled={busy} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
            {busy && <Spinner light />} {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );

/** Admin › Locations: the airports and city stations customers can search, and where suppliers have cars. */
const LocationsAdmin: React.FC = () => {
  const [items, setItems] = React.useState<Location[] | null>(null);
  const [error, setError] = React.useState('');
  const [usage, setUsage] = React.useState<Map<string, Usage>>(new Map());
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('all');
  const [country, setCountry] = React.useState('');
  const [shown, setShown] = React.useState(PAGE);
  const [editing, setEditing] = React.useState<Location | 'new' | null>(null);
  const [form, setForm] = React.useState<Form>(emptyForm);
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Location | null>(null);
  const [busyDelete, setBusyDelete] = React.useState(false);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setError('');
    try {
      const [locs, cars] = await Promise.all([
        adminFetch('/api/admin/locations'),
        adminFetch('/api/admin/fleet/cars').catch(() => []),
      ]);
      setItems(Array.isArray(locs) ? locs : []);
      const m = new Map<string, { cars: number; suppliers: Set<string> }>();
      (Array.isArray(cars) ? cars : []).forEach((c: any) => {
        const code = String(c.locationCode || '').trim().toUpperCase();
        if (!code || code === 'ALL') return;
        const u = m.get(code) || { cars: 0, suppliers: new Set<string>() };
        u.cars++;
        u.suppliers.add(String(c.supplierId ?? c.supplierName ?? ''));
        m.set(code, u);
      });
      setUsage(new Map([...m].map(([k, v]) => [k, { cars: v.cars, suppliers: v.suppliers.size }])));
    } catch (e: any) {
      setError(errorText(e, 'Locations could not be loaded.'));
      setItems(prev => prev ?? []);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => setShown(PAGE), [query, filter, country]);

  const list = items || [];
  const usageOf = (l: Location): Usage => usage.get(String(l.iataCode || '').trim().toUpperCase()) || { cars: 0, suppliers: 0 };

  const countries = React.useMemo(() => {
    const m = new Map<string, number>();
    list.forEach(l => { const c = (l.countryCode || '').toUpperCase(); if (c) m.set(c, (m.get(c) || 0) + 1); });
    return [...m].map(([code, count]) => ({ code, count, name: countryName(code) || code })).sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const counts = React.useMemo(() => ({
    all: list.length,
    airport: list.filter(l => kindOf(l.type) === 'airport').length,
    city: list.filter(l => kindOf(l.type) !== 'airport').length,
    used: list.filter(l => usageOf(l).cars > 0).length,
  }), [list, usage]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter(l => filter === 'all' || (filter === 'airport' ? kindOf(l.type) === 'airport'
        : filter === 'city' ? kindOf(l.type) !== 'airport'
        : filter === 'used' ? usageOf(l).cars > 0 : usageOf(l).cars === 0))
      .filter(l => !country || (l.countryCode || '').toUpperCase() === country)
      .filter(l => !q || [l.iataCode, l.name, l.municipality, l.countryCode, countryName(l.countryCode)]
        .some(v => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => (countryName(a.countryCode) || a.countryCode || '~').localeCompare(countryName(b.countryCode) || b.countryCode || '~')
        || (a.municipality || '').localeCompare(b.municipality || '') || (a.iataCode || '').localeCompare(b.iataCode || ''));
  }, [list, query, filter, country, usage]);

  // ---- editor
  const openNew = () => { setForm(emptyForm); setTouched(false); setEditing('new'); };
  const openEdit = (l: Location) => {
    const k = kindOf(l.type);
    setForm({ iataCode: l.iataCode || '', name: l.name || '', municipality: l.municipality || '', countryCode: l.countryCode || '',
      kind: k === 'airport' ? 'airport' : 'city', type: l.type || (k === 'airport' ? 'Airport' : 'city') });
    setTouched(false);
    setEditing(l);
  };
  const setKind = (kind: 'airport' | 'city') => setForm(f => {
    // Keep the stored type (e.g. "large_airport") unless the kind really changes.
    const original = editing && editing !== 'new' ? editing.type : null;
    const type = original && kindOf(original) === kind ? original : kind === 'airport' ? 'Airport' : 'city';
    return { ...f, kind, type };
  });

  const code = form.iataCode.trim().toUpperCase();
  const cc = form.countryCode.trim().toUpperCase();
  const duplicate = code ? list.find(l => (l.iataCode || '').toUpperCase() === code && (editing === 'new' || l.id !== editing?.id)) : undefined;
  const problems: Partial<Record<'code' | 'name' | 'country', string>> = {};
  if (form.kind === 'airport' && !/^[A-Z]{3}$/.test(code)) problems.code = 'An airport needs its 3-letter IATA code, for example AMM.';
  else if (form.kind === 'city' && code && !/^[A-Z0-9_-]{2,12}$/.test(code)) problems.code = 'Letters, numbers, - or _ only (2–12), for example AMMAN_DT.';
  else if (duplicate) problems.code = `${code} is already used by ${duplicate.name}.`;
  if (!form.name.trim()) problems.name = 'Add the name customers will see.';
  if (cc && !countryName(cc)) problems.country = 'Use the 2-letter country code, for example JO or AE.';
  const valid = Object.keys(problems).length === 0;

  const save = async () => {
    setTouched(true);
    if (!valid || saving) return;
    setSaving(true);
    const body = JSON.stringify({ iataCode: code || null, name: form.name.trim(), municipality: form.municipality.trim() || null, countryCode: cc || null, type: form.type });
    try {
      if (editing && editing !== 'new') await adminFetch(`/api/admin/locations/${editing.id}`, { method: 'PUT', body });
      else await adminFetch('/api/admin/locations', { method: 'POST', body });
      notify(editing === 'new' ? `${form.name.trim()} added` : 'Changes saved');
      setEditing(null);
      await load();
    } catch (e: any) {
      notify(errorText(e, 'Could not save. Please try again.'), 'err');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await adminFetch(`/api/admin/locations/${deleting.id}`, { method: 'DELETE' });
      notify(`${deleting.name} deleted`);
      setDeleting(null);
      await load();
    } catch (e: any) {
      notify(errorText(e, 'Could not delete. Please try again.'), 'err');
    } finally { setBusyDelete(false); }
  };

  const loading = items === null;
  let lastCountry: string | null = null;

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Network" eyebrowIcon={Globe} title="Locations"
        subtitle="The airports and city stations customers can search. Suppliers add their cars to these locations."
        loading={loading}
        actions={<>
          <button onClick={load} className={heroButton}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={openNew} className={heroPrimary}><Plus className="h-4 w-4" /> Add location</button>
        </>}
        kpis={[
          { label: 'Locations', value: num(counts.all), Icon: MapPin, note: `${num(countries.length)} ${countries.length === 1 ? 'country' : 'countries'}` },
          { label: 'Airports', value: num(counts.airport), Icon: Plane },
          { label: 'City / downtown', value: num(counts.city), Icon: Building },
          { label: 'With suppliers', value: num(counts.used), Icon: Users, note: counts.all ? `${Math.round((counts.used / counts.all) * 100)}% of locations` : undefined },
        ]}
      />

      {error && <ErrorBanner text={error} onRetry={load} />}

      <div className="space-y-3">
        <Segmented layoutId="loc-filter" value={filter} onChange={setFilter} items={[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'airport', label: 'Airports', count: counts.airport },
          { key: 'city', label: 'City / downtown', count: counts.city },
          { key: 'used', label: 'With suppliers', count: counts.used },
          { key: 'unused', label: 'No suppliers yet', count: counts.all - counts.used },
        ]} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search code, name, city or country" aria-label="Search locations" className={`${inputCls} pl-10`} />
          </div>
          <select value={country} onChange={e => setCountry(e.target.value)} aria-label="Country" className={`${inputCls} min-w-0 pr-8 sm:w-60`}>
            <option value="">All countries</option>
            {countries.map(c => <option key={c.code} value={c.code}>{flag(c.code)} {c.name} ({c.count})</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><MapPin className="h-6 w-6 text-slate-400" /></span>
          <p className="mt-3 text-base font-semibold text-slate-900">{list.length ? 'No locations match' : 'No locations yet'}</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{list.length ? 'Try another search or filter.' : 'Add the first airport or city station customers can search.'}</p>
          {!list.length && <button onClick={openNew} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add location</button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="hidden grid-cols-[minmax(0,1fr)_10rem_12rem_5.5rem] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Location</span><span>Type</span><span>Suppliers here</span><span className="text-right">Actions</span>
          </div>
          <ul>
            {filtered.slice(0, shown).map(l => {
              const u = usageOf(l);
              const cName = countryName(l.countryCode) || l.countryCode || 'No country';
              const header = cName !== lastCountry ? cName : null;
              lastCountry = cName;
              return (
                <li key={l.id}>
                  {header && (
                    <div className="flex items-center gap-2 border-y border-slate-100 bg-slate-50/70 px-5 py-2 text-xs font-semibold text-slate-600 first:border-t-0">
                      <span className="text-base leading-none">{flag(l.countryCode)}</span> {header}
                    </div>
                  )}
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-slate-50/70 sm:px-5 md:grid-cols-[minmax(0,1fr)_10rem_12rem_5.5rem] md:gap-4">
                    <button onClick={() => openEdit(l)} className="col-span-2 flex min-w-0 items-center gap-3 text-left md:col-span-1">
                      <KindTile type={l.type} code={l.iataCode} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">{l.name}</span>
                        <span className="block truncate text-xs text-slate-500">{[l.municipality, countryName(l.countryCode) || l.countryCode].filter(Boolean).join(', ') || '—'}</span>
                        <span className="mt-1 flex flex-wrap gap-1.5 md:hidden">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{kindLabel(l.type)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${u.cars ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.cars ? `${u.suppliers} supplier${u.suppliers === 1 ? '' : 's'} · ${u.cars} car${u.cars === 1 ? '' : 's'}` : 'No suppliers yet'}
                          </span>
                        </span>
                      </span>
                    </button>
                    <span className="hidden md:block">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${kindOf(l.type) === 'airport' ? 'bg-sky-50 text-sky-800 ring-sky-600/20' : 'bg-violet-50 text-violet-800 ring-violet-600/20'}`}>
                        {kindOf(l.type) === 'airport' ? <Plane className="h-3 w-3" /> : <Building className="h-3 w-3" />} {kindLabel(l.type)}
                      </span>
                    </span>
                    <span className="hidden text-sm md:block">
                      {u.cars ? (
                        <span className="flex items-center gap-3 text-slate-700">
                          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-400" /> {u.suppliers}</span>
                          <span className="inline-flex items-center gap-1"><CarIcon className="h-3.5 w-3.5 text-slate-400" /> {u.cars} car{u.cars === 1 ? '' : 's'}</span>
                        </span>
                      ) : <span className="text-slate-400">No suppliers yet</span>}
                    </span>
                    <span className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(l)} className={iconBtn} aria-label={`Edit ${l.name}`} title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleting(l)} className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} aria-label={`Delete ${l.name}`} title="Delete"><Trash className="h-4 w-4" /></button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            <span>Showing {num(Math.min(shown, filtered.length))} of {num(filtered.length)}</span>
            {shown < filtered.length && (
              <button onClick={() => setShown(s => s + PAGE)} className="h-9 rounded-lg px-3 font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Show more</button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <Drawer
            eyebrow={editing === 'new' ? 'New location' : 'Edit location'}
            title={editing === 'new' ? 'Add a location' : editing.name}
            onClose={() => setEditing(null)} busy={saving} width="max-w-[560px]"
            footer={
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setEditing(null)} disabled={saving} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
                <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {saving && <Spinner light />} {editing === 'new' ? 'Add location' : 'Save changes'}
                </button>
              </div>
            }
          >
            <div className="space-y-5">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Type</span>
                <div className="grid grid-cols-2 gap-2">
                  {([['airport', 'Airport', Plane, 'Customers collect at the airport'], ['city', 'City / downtown', Building, 'A station or office in town']] as const).map(([k, label, Icon, hint]) => (
                    <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={form.kind === k}
                      className={`flex items-start gap-3 rounded-2xl p-3.5 text-left ring-1 ring-inset transition ${form.kind === k ? 'bg-white ring-2 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${form.kind === k ? 'bg-[#007ac2] text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></span>
                      <span><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="block text-xs text-slate-500">{hint}</span></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <Field label={form.kind === 'airport' ? 'IATA code' : 'Code (optional)'}>
                  <input value={form.iataCode} onChange={e => setForm(f => ({ ...f, iataCode: e.target.value.toUpperCase() }))} maxLength={12}
                    placeholder={form.kind === 'airport' ? 'AMM' : 'AMMAN_DT'} className={`${inputCls} font-mono uppercase tracking-wide ${touched && problems.code ? 'border-rose-400' : ''}`} />
                </Field>
                <Field label="Name customers see">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={form.kind === 'airport' ? 'Queen Alia International Airport' : 'Amman Downtown'} className={`${inputCls} ${touched && problems.name ? 'border-rose-400' : ''}`} />
                </Field>
              </div>
              {touched && (problems.code || problems.name) && <p className="-mt-3 text-xs font-medium text-rose-600">{problems.code || problems.name}</p>}
              {!touched && duplicate && <p className="-mt-3 text-xs font-medium text-amber-700">{code} is already used by {duplicate.name}.</p>}

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <Field label="City">
                  <input value={form.municipality} onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))} placeholder="Amman" className={inputCls} />
                </Field>
                <Field label="Country code" hint={cc ? (countryName(cc) ? `${flag(cc)} ${countryName(cc)}` : 'Not a country code') : 'For example JO'}>
                  <input value={form.countryCode} onChange={e => setForm(f => ({ ...f, countryCode: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="JO"
                    className={`${inputCls} font-mono uppercase tracking-wide ${touched && problems.country ? 'border-rose-400' : ''}`} />
                </Field>
              </div>
              {touched && problems.country && <p className="-mt-3 text-xs font-medium text-rose-600">{problems.country}</p>}

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">How customers see it in search</span>
                <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
                      {form.kind === 'airport' ? <Plane className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{form.name.trim() || 'Location name'}{code ? ` (${code})` : ''}</span>
                      <span className="block truncate text-xs text-slate-500">{[form.municipality.trim(), countryName(cc)].filter(Boolean).join(', ') || 'City, country'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {editing !== 'new' && (() => {
                const u = usageOf(editing);
                return (
                  <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm ring-1 ${u.cars ? 'bg-emerald-50 text-emerald-900 ring-emerald-200' : 'bg-white text-slate-600 ring-slate-200'}`}>
                    {u.cars ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
                    <span>{u.cars
                      ? <>{u.suppliers} supplier{u.suppliers === 1 ? '' : 's'} with {u.cars} car{u.cars === 1 ? '' : 's'} at this location. Changing the code changes where their cars are found, so keep it unless it is wrong.</>
                      : 'No supplier has cars here yet.'}</span>
                  </div>
                );
              })()}
            </div>
          </Drawer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <Confirm
            title={`Delete ${deleting.name}?`}
            confirmLabel="Delete location"
            busy={busyDelete}
            onCancel={() => setDeleting(null)}
            onConfirm={remove}
            text={usageOf(deleting).cars ? (
              <span className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-900 ring-1 ring-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{usageOf(deleting).suppliers} supplier{usageOf(deleting).suppliers === 1 ? ' has' : 's have'} {usageOf(deleting).cars} car{usageOf(deleting).cars === 1 ? '' : 's'} at {deleting.iataCode || 'this location'}. Customers will no longer find this location in search.</span>
              </span>
            ) : 'Customers will no longer find it in search. This cannot be undone.'}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
};

export default LocationsAdmin;
