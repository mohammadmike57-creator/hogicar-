import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import Library from 'lucide-react/dist/esm/icons/library';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash from 'lucide-react/dist/esm/icons/trash-2';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import DoorOpen from 'lucide-react/dist/esm/icons/door-open';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import List from 'lucide-react/dist/esm/icons/list';
import ImageOff from 'lucide-react/dist/esm/icons/image-off';
import CloudUpload from 'lucide-react/dist/esm/icons/cloud-upload';
import Minus from 'lucide-react/dist/esm/icons/minus';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Tags from 'lucide-react/dist/esm/icons/tags';
import { adminFetch } from '../../lib/adminApi';
import { CarCategory, CarType } from '../../types';
import { CarPicture } from './suppliersFleetUi';
import { Hero, heroButton, heroPrimary, Segmented, num, inputCls, Field, useToast, Toast, Drawer, Spinner } from './commercialUi';

export type CarModel = {
  id?: number | string; make: string; model: string; year?: number | null; category?: string; type?: string;
  imageUrl?: string; image?: string; passengers?: number; bags?: number; doors?: number;
};
type Usage = { cars: number; suppliers: number };
type Sort = 'make' | 'size' | 'used';

const CATEGORY_ORDER = Object.values(CarCategory) as string[];
const ACRONYMS = new Set(['SUV', 'MPV', '4X4', 'EV', 'VIP']);
const pretty = (v?: string | null) => (v || '').split('_').filter(Boolean)
  .map(w => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ').replace('Van 9 Seater', 'Van (9 seats)');
const photoOf = (m: CarModel) => m.imageUrl || m.image || '';
/** Stock / placeholder pictures that should be replaced with a real photo of the car. */
const isPlaceholder = (url: string) => !url || /picsum\.photos|placeholder|via\.placeholder|dummyimage|placehold/i.test(url);
const keyOf = (make?: string, model?: string) => `${(make || '').trim().toLowerCase()}|${(model || '').trim().toLowerCase()}`;
const idOf = (id: any) => parseInt(String(id).split(':')[0], 10);

const errorText = (e: any, fallback: string) => {
  const m = String(e?.message || '');
  const hit = /status \d+: (.*)$/s.exec(m);
  const text = (hit ? hit[1] : m).trim();
  return text && !text.startsWith('<') && !text.startsWith('{') ? text : fallback;
};

const iconBtn = 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 bg-white transition hover:bg-slate-50 hover:text-slate-900';

const Specs: React.FC<{ m: CarModel; small?: boolean }> = ({ m, small }) => (
  <span className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 ${small ? 'text-xs' : 'text-sm'}`}>
    <span className="inline-flex items-center gap-1" title="Seats"><Users className="h-3.5 w-3.5 text-slate-400" /> {m.passengers ?? '—'}</span>
    <span className="inline-flex items-center gap-1" title="Large bags"><Briefcase className="h-3.5 w-3.5 text-slate-400" /> {m.bags ?? '—'}</span>
    <span className="inline-flex items-center gap-1" title="Doors"><DoorOpen className="h-3.5 w-3.5 text-slate-400" /> {m.doors ?? '—'}</span>
  </span>
);

const Stepper: React.FC<{ label: string; value: number; min: number; max: number; onChange: (v: number) => void; icon: React.ComponentType<{ className?: string }> }> = ({ label, value, min, max, onChange, icon: Icon }) => (
  <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Icon className="h-3.5 w-3.5" /> {label}</span>
    <div className="mt-2 flex items-center justify-between">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-40" aria-label={`Fewer ${label.toLowerCase()}`}><Minus className="h-4 w-4" /></button>
      <span className="text-lg font-semibold tabular-nums text-slate-900">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-40" aria-label={`More ${label.toLowerCase()}`}><Plus className="h-4 w-4" /></button>
    </div>
  </div>
);

const Confirm: React.FC<{ title: string; text: React.ReactNode; busy?: boolean; onCancel: () => void; onConfirm: () => void }> = ({ title, text, busy, onCancel, onConfirm }) =>
  createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-4" role="alertdialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50" onClick={() => !busy && onCancel()} />
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Trash className="h-5 w-5" /></span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
        <div className="mt-1.5 text-sm text-slate-600">{text}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onCancel} disabled={busy} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">{busy && <Spinner light />} Delete model</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );

/** Admin › Car library: the car models (picture, class and capacity) used across the site. */
const CarLibraryAdmin: React.FC<{
  library: CarModel[];
  loading?: boolean;
  onRefresh: () => Promise<void> | void;
  /** Turns a chosen picture file into the stored image (resized, background removed). */
  prepareImage: (file: File) => Promise<string>;
}> = ({ library, loading, onRefresh, prepareImage }) => {
  const list = Array.isArray(library) ? library : [];
  const [usage, setUsage] = React.useState<Map<string, Usage>>(new Map());
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [sort, setSort] = React.useState<Sort>('make');
  const [view, setView] = React.useState<'grid' | 'list'>(() => { try { return (localStorage.getItem('hc_carlib_view') as any) || 'grid'; } catch { return 'grid'; } });
  const [editing, setEditing] = React.useState<CarModel | 'new' | null>(null);
  const [form, setForm] = React.useState<CarModel>({ make: '', model: '' });
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [preparing, setPreparing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CarModel | null>(null);
  const [busyDelete, setBusyDelete] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { toast, notify } = useToast();

  const loadUsage = React.useCallback(async () => {
    try {
      const cars = await adminFetch('/api/admin/fleet/cars');
      const m = new Map<string, { cars: number; suppliers: Set<string> }>();
      (Array.isArray(cars) ? cars : []).forEach((c: any) => {
        const k = keyOf(c.make, c.model);
        const u = m.get(k) || { cars: 0, suppliers: new Set<string>() };
        u.cars++;
        u.suppliers.add(String(c.supplierId ?? c.supplierName ?? ''));
        m.set(k, u);
      });
      setUsage(new Map([...m].map(([k, v]) => [k, { cars: v.cars, suppliers: v.suppliers.size }])));
    } catch { /* usage is extra information only */ }
  }, []);
  React.useEffect(() => { loadUsage(); }, [loadUsage]);
  React.useEffect(() => { try { localStorage.setItem('hc_carlib_view', view); } catch { /* ignore */ } }, [view]);

  const usageOf = (m: CarModel): Usage => usage.get(keyOf(m.make, m.model)) || { cars: 0, suppliers: 0 };
  const refresh = async () => { await Promise.all([onRefresh(), loadUsage()]); };

  const categories = React.useMemo(() => {
    const c = new Map<string, number>();
    list.forEach(m => { const k = m.category || 'OTHER'; c.set(k, (c.get(k) || 0) + 1); });
    return [...c].sort((a, b) => (CATEGORY_ORDER.indexOf(a[0]) + 1 || 99) - (CATEGORY_ORDER.indexOf(b[0]) + 1 || 99));
  }, [list]);

  const stats = React.useMemo(() => ({
    models: list.length,
    makes: new Set(list.map(m => (m.make || '').trim().toLowerCase()).filter(Boolean)).size,
    needPhoto: list.filter(m => isPlaceholder(photoOf(m))).length,
    used: list.filter(m => usageOf(m).cars > 0).length,
  }), [list, usage]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = (m: CarModel) => CATEGORY_ORDER.indexOf(m.category || '') + 1 || 99;
    return list
      .filter(m => category === 'all' || (category === 'photo' ? isPlaceholder(photoOf(m)) : (m.category || 'OTHER') === category))
      .filter(m => !q || [m.make, m.model, `${m.make} ${m.model}`, pretty(m.category), pretty(m.type), m.year].some(v => String(v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => sort === 'size' ? rank(a) - rank(b) || `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`)
        : sort === 'used' ? usageOf(b).cars - usageOf(a).cars || `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`)
        : `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`) || (a.year || 0) - (b.year || 0));
  }, [list, query, category, sort, usage]);

  // ---- editor
  const openNew = () => {
    setForm({ make: '', model: '', year: new Date().getFullYear(), category: 'ECONOMY', type: 'SEDAN', imageUrl: '', passengers: 5, bags: 2, doors: 4 });
    setTouched(false); setEditing('new');
  };
  const openEdit = (m: CarModel) => {
    setForm({ ...m, imageUrl: photoOf(m), passengers: m.passengers ?? 5, bags: m.bags ?? 2, doors: m.doors ?? 4 });
    setTouched(false); setEditing(m);
  };
  const set = (patch: Partial<CarModel>) => setForm(f => ({ ...f, ...patch }));

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { notify('Please choose a JPG, PNG or WebP picture.', 'err'); return; }
    setPreparing(true);
    try {
      set({ imageUrl: await prepareImage(file) });
    } catch {
      // Same fallback as before: keep the original picture when it can't be processed.
      const data = await new Promise<string>(res => { const r = new FileReader(); r.onloadend = () => res(String(r.result || '')); r.readAsDataURL(file); });
      set({ imageUrl: data });
    } finally { setPreparing(false); }
  };

  const duplicate = list.find(m => keyOf(m.make, m.model) === keyOf(form.make, form.model) && (m.year || null) === (form.year || null)
    && (editing === 'new' || idOf(m.id) !== idOf((editing as CarModel)?.id)));
  const problems: string[] = [];
  if (!form.make?.trim()) problems.push('Add the make, for example Toyota.');
  if (!form.model?.trim()) problems.push('Add the model, for example Corolla.');
  if (!form.imageUrl?.trim()) problems.push('Add a picture of the car.');
  if (form.year != null && (form.year < 1990 || form.year > new Date().getFullYear() + 2)) problems.push('Check the year.');

  const save = async () => {
    setTouched(true);
    if (problems.length || saving) return;
    setSaving(true);
    const payload = {
      id: form.id != null ? idOf(form.id) : undefined, make: form.make.trim(), model: form.model.trim(), year: form.year || null,
      category: form.category, type: form.type, imageUrl: form.imageUrl, passengers: form.passengers, bags: form.bags, doors: form.doors,
    };
    try {
      if (editing === 'new') await adminFetch('/api/admin/car-models', { method: 'POST', body: JSON.stringify(payload) });
      else await adminFetch(`/api/admin/car-models/${idOf(form.id)}`, { method: 'PUT', body: JSON.stringify(payload) });
      notify(editing === 'new' ? `${payload.make} ${payload.model} added` : 'Changes saved');
      setEditing(null);
      await onRefresh();
    } catch (e: any) {
      notify(errorText(e, 'Could not save. Please try again.'), 'err');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await adminFetch(`/api/admin/car-models/${idOf(deleting.id)}`, { method: 'DELETE' });
      notify(`${deleting.make} ${deleting.model} deleted`);
      setDeleting(null);
      await onRefresh();
    } catch (e: any) {
      notify(errorText(e, 'Could not delete. Please try again.'), 'err');
    } finally { setBusyDelete(false); }
  };

  const busy = loading && list.length === 0;

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Fleet catalogue" eyebrowIcon={Library} title="Car library"
        subtitle="The car models used across HogiCar: picture, car class and capacity. Suppliers pick from these when they add cars."
        loading={busy}
        actions={<>
          <button onClick={refresh} className={heroButton}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={openNew} className={heroPrimary}><Plus className="h-4 w-4" /> Add car model</button>
        </>}
        kpis={[
          { label: 'Car models', value: num(stats.models), Icon: CarIcon, note: `${num(categories.length)} car classes` },
          { label: 'Makes', value: num(stats.makes), Icon: Tags },
          { label: "In suppliers' fleets", value: num(stats.used), Icon: Users, note: stats.models ? `${Math.round((stats.used / stats.models) * 100)}% of models` : undefined },
          { label: 'Need a real photo', value: num(stats.needPhoto), Icon: ImageOff, note: stats.needPhoto ? 'Stock or missing picture' : 'All set' },
        ]}
      />

      <div className="space-y-3">
        <Segmented layoutId="carlib-cat" value={category} onChange={setCategory} items={[
          { key: 'all', label: 'All', count: list.length },
          ...categories.map(([k, n]) => ({ key: k, label: pretty(k), count: n })),
          ...(stats.needPhoto ? [{ key: 'photo', label: 'Need a photo', count: stats.needPhoto, dot: true }] : []),
        ]} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search make, model, class or body type" aria-label="Search car models" className={`${inputCls} pl-10`} />
          </div>
          <div className="flex min-w-0 gap-2">
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort" className={`${inputCls} min-w-0 flex-1 pr-8 sm:w-60 sm:flex-none`}>
              <option value="make">Make A–Z</option>
              <option value="size">Car size (small to large)</option>
              <option value="used">Most used by suppliers</option>
            </select>
            <div className="inline-flex shrink-0 rounded-xl bg-white p-1 ring-1 ring-slate-200" role="group" aria-label="View">
              {([['grid', LayoutGrid, 'Cards'], ['list', List, 'List']] as const).map(([v, Icon, label]) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v} title={label}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${view === v ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}><Icon className="h-4 w-4" /></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {busy ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><CarIcon className="h-6 w-6 text-slate-400" /></span>
          <p className="mt-3 text-base font-semibold text-slate-900">{list.length ? 'No car models match' : 'The library is empty'}</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{list.length ? 'Try another search or car class.' : 'Add the first car model with its picture and capacity.'}</p>
          {!list.length && <button onClick={openNew} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add car model</button>}
        </div>
      ) : view === 'grid' ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(m => {
            const u = usageOf(m);
            const placeholder = isPlaceholder(photoOf(m));
            return (
              <li key={String(m.id)} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-lg hover:ring-slate-300">
                <button onClick={() => openEdit(m)} className="text-left" aria-label={`Edit ${m.make} ${m.model}`}>
                  <div className="relative">
                    <CarPicture url={photoOf(m)} alt={`${m.make} ${m.model}`} className="h-40 w-full" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">{pretty(m.category) || 'No class'}</span>
                    {placeholder && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-300"><ImageOff className="h-3 w-3" /> Stock photo</span>}
                  </div>
                  <div className="px-4 pb-3 pt-3.5">
                    <p className="truncate text-base font-semibold text-slate-900">{m.make} {m.model}</p>
                    <p className="text-xs text-slate-500">{[pretty(m.type), m.year].filter(Boolean).join(' · ') || '—'}</p>
                    <div className="mt-3"><Specs m={m} small /></div>
                  </div>
                </button>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
                  <span className={`text-xs ${u.cars ? 'font-medium text-emerald-700' : 'text-slate-400'}`}>
                    {u.cars ? `${u.cars} supplier car${u.cars === 1 ? '' : 's'} · ${u.suppliers} supplier${u.suppliers === 1 ? '' : 's'}` : 'Not in any fleet yet'}
                  </span>
                  <span className="flex gap-1.5">
                    <button onClick={() => openEdit(m)} className={iconBtn} aria-label={`Edit ${m.make} ${m.model}`} title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleting(m)} className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} aria-label={`Delete ${m.make} ${m.model}`} title="Delete"><Trash className="h-4 w-4" /></button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="hidden grid-cols-[6rem_minmax(0,1fr)_9rem_10rem_11rem_5.5rem] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Picture</span><span>Car</span><span>Class</span><span>Capacity</span><span>Suppliers</span><span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map(m => {
              const u = usageOf(m);
              return (
                <li key={String(m.id)} className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-slate-50/70 sm:px-5 lg:grid-cols-[6rem_minmax(0,1fr)_9rem_10rem_11rem_5.5rem] lg:gap-4">
                  <button onClick={() => openEdit(m)} aria-label={`Edit ${m.make} ${m.model}`}><CarPicture url={photoOf(m)} alt={`${m.make} ${m.model}`} className="h-14 w-full rounded-xl ring-1 ring-slate-200" /></button>
                  <button onClick={() => openEdit(m)} className="min-w-0 text-left">
                    <span className="block truncate text-sm font-semibold text-slate-900">{m.make} {m.model}</span>
                    <span className="block truncate text-xs text-slate-500">{[pretty(m.type), m.year].filter(Boolean).join(' · ')}{isPlaceholder(photoOf(m)) ? ' · Stock photo' : ''}</span>
                    <span className="mt-1 block text-xs text-slate-500 lg:hidden">{pretty(m.category)} · {m.passengers ?? '—'} seats · {u.cars ? `${u.cars} supplier cars` : 'not in a fleet'}</span>
                  </button>
                  <span className="hidden lg:block"><span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-600/20">{pretty(m.category) || '—'}</span></span>
                  <span className="hidden lg:block"><Specs m={m} small /></span>
                  <span className={`hidden text-sm lg:block ${u.cars ? 'text-slate-700' : 'text-slate-400'}`}>{u.cars ? `${u.cars} car${u.cars === 1 ? '' : 's'} · ${u.suppliers} supplier${u.suppliers === 1 ? '' : 's'}` : 'Not in any fleet'}</span>
                  <span className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(m)} className={iconBtn} aria-label={`Edit ${m.make} ${m.model}`} title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleting(m)} className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} aria-label={`Delete ${m.make} ${m.model}`} title="Delete"><Trash className="h-4 w-4" /></button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!busy && filtered.length > 0 && <p className="text-center text-xs text-slate-400">Showing {num(filtered.length)} of {num(list.length)} car models</p>}

      <AnimatePresence>
        {editing && (
          <Drawer
            eyebrow={editing === 'new' ? 'New car model' : 'Edit car model'}
            title={editing === 'new' ? 'Add a car model' : `${editing.make} ${editing.model}`}
            onClose={() => setEditing(null)} busy={saving} width="max-w-[640px]"
            footer={
              <div className="flex items-center justify-between gap-3">
                <span className="hidden truncate text-xs text-rose-600 sm:block">{touched && problems[0]}</span>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setEditing(null)} disabled={saving} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
                  <button onClick={save} disabled={saving || preparing} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                    {saving && <Spinner light />} {editing === 'new' ? 'Add car model' : 'Save changes'}
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Picture */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Picture</h3>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
                  className={`overflow-hidden rounded-2xl bg-white ring-1 transition ${dragging ? 'ring-2 ring-[#007ac2]' : touched && !form.imageUrl ? 'ring-rose-300' : 'ring-slate-200'}`}>
                  <div className="relative">
                    <CarPicture url={form.imageUrl} alt="Car picture" className="h-48 w-full" />
                    {preparing && <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-sm font-medium text-slate-700"><Spinner /> Preparing picture…</div>}
                    {form.imageUrl && isPlaceholder(form.imageUrl) && !preparing && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-300"><ImageOff className="h-3 w-3" /> Stock photo: replace with a real picture</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 p-3">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3.5 text-sm font-semibold text-white hover:bg-slate-800"><CloudUpload className="h-4 w-4" /> {form.imageUrl ? 'Replace picture' : 'Upload picture'}</button>
                    {form.imageUrl && <button type="button" onClick={() => set({ imageUrl: '' })} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"><Trash className="h-4 w-4" /> Remove</button>}
                    <span className="text-xs text-slate-500">or drop a JPG, PNG or WebP here. The background is removed automatically.</span>
                  </div>
                </div>
                <Field label="Or paste a picture link" className="mt-3">
                  <input value={form.imageUrl?.startsWith('data:') ? '' : form.imageUrl || ''} onChange={e => set({ imageUrl: e.target.value.trim() })}
                    placeholder={form.imageUrl?.startsWith('data:') ? 'Using the uploaded picture' : 'https://…'} className={inputCls} />
                </Field>
              </section>

              {/* Car */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Car</h3>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]">
                  <Field label="Make"><input value={form.make} onChange={e => set({ make: e.target.value })} placeholder="Toyota" className={`${inputCls} ${touched && !form.make?.trim() ? 'border-rose-400' : ''}`} /></Field>
                  <Field label="Model"><input value={form.model} onChange={e => set({ model: e.target.value })} placeholder="Corolla" className={`${inputCls} ${touched && !form.model?.trim() ? 'border-rose-400' : ''}`} /></Field>
                  <Field label="Year"><input type="number" inputMode="numeric" value={form.year ?? ''} onChange={e => set({ year: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="2025" className={inputCls} /></Field>
                </div>
                {duplicate && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> {duplicate.make} {duplicate.model}{duplicate.year ? ` ${duplicate.year}` : ''} is already in the library.</p>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Car class" hint="Filled in on a supplier's car when they pick this model.">
                    <select value={form.category} onChange={e => set({ category: e.target.value })} className={inputCls}>
                      {CATEGORY_ORDER.map(v => <option key={v} value={v}>{pretty(v)}</option>)}
                    </select>
                  </Field>
                  <Field label="Body type">
                    <select value={form.type} onChange={e => set({ type: e.target.value })} className={inputCls}>
                      {(Object.values(CarType) as string[]).map(v => <option key={v} value={v}>{pretty(v)}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              {/* Capacity */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Capacity</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Stepper label="Seats" icon={Users} value={form.passengers ?? 5} min={1} max={17} onChange={v => set({ passengers: v })} />
                  <Stepper label="Large bags" icon={Briefcase} value={form.bags ?? 2} min={0} max={10} onChange={v => set({ bags: v })} />
                  <Stepper label="Doors" icon={DoorOpen} value={form.doors ?? 4} min={2} max={5} onChange={v => set({ doors: v })} />
                </div>
              </section>

              {/* Preview */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">How customers see it</h3>
                <div className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <CarPicture url={form.imageUrl} alt="" className="h-20 w-32 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#007ac2]">{pretty(form.category)}</p>
                    <p className="truncate text-base font-semibold text-slate-900">{form.make || 'Make'} {form.model || 'Model'} <span className="text-sm font-normal text-slate-500">or similar</span></p>
                    <div className="mt-1.5"><Specs m={form} small /></div>
                  </div>
                </div>
              </section>

              {editing !== 'new' && usageOf(editing).cars > 0 && (
                <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-200">
                  {usageOf(editing).cars} supplier car{usageOf(editing).cars === 1 ? ' is' : 's are'} this model ({usageOf(editing).suppliers} supplier{usageOf(editing).suppliers === 1 ? '' : 's'}). Changes here are used the next time a supplier picks this model; cars already added keep their own details.
                </p>
              )}
            </div>
          </Drawer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <Confirm
            title={`Delete ${deleting.make} ${deleting.model}?`}
            busy={busyDelete}
            onCancel={() => setDeleting(null)}
            onConfirm={remove}
            text={usageOf(deleting).cars ? (
              <span className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-900 ring-1 ring-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{usageOf(deleting).cars} supplier car{usageOf(deleting).cars === 1 ? ' is' : 's are'} this model. They keep their details, but suppliers can't pick this model for new cars.</span>
              </span>
            ) : 'It is removed from the library. This cannot be undone.'}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
};

export default CarLibraryAdmin;
