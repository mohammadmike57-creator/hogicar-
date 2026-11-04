import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash from 'lucide-react/dist/esm/icons/trash-2';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import ImageOff from 'lucide-react/dist/esm/icons/image-off';
import CloudUpload from 'lucide-react/dist/esm/icons/cloud-upload';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Layers from 'lucide-react/dist/esm/icons/layers';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { adminFetch } from '../../lib/adminApi';
import { Hero, heroButton, heroPrimary, num, inputCls, Field, useToast, Toast, Drawer, Spinner, Toggle, errorOf as apiError } from './commercialUi';

/** The server's message when there is one (adminFetch puts it on the error), else the fallback. */
const errorOf = (e: any, fallback: string) => apiError(e, typeof e?.message === 'string' && e.message.trim() ? e.message : fallback);

export type HomepageBrand = {
  id?: number;
  name: string;
  logoUrl: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  displayOrder?: number | null;
  active?: boolean | null;
  scale?: number | null;
  mobileScale?: number | null;
  spacing?: number | null;
};

const byOrder = (a: HomepageBrand, b: HomepageBrand) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0);

/** One logo tile, drawn exactly like the homepage strip (components/TrustedSuppliers). */
const BrandTile: React.FC<{ brand: HomepageBrand; imageUrl: (u: string) => string; large?: boolean }> = ({ brand, imageUrl, large }) => (
  <div className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${large ? 'h-20 w-44 p-2' : 'h-16 w-36 p-1.5'}`}>
    {brand.logoUrl
      ? <img src={imageUrl(brand.logoUrl)} alt={brand.name} className="h-full w-full object-contain" style={{ transform: `scale(${(brand.scale || 100) / 100})` }} />
      : <ImageOff className="h-5 w-5 text-slate-300" />}
  </div>
);

const ConfirmDelete: React.FC<{ brand: HomepageBrand; busy: boolean; onCancel: () => void; onConfirm: () => void }> = ({ brand, busy, onCancel, onConfirm }) =>
  createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-4" role="alertdialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50" onClick={() => !busy && onCancel()} />
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Trash className="h-5 w-5" /></span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Remove {brand.name}?</h3>
        <p className="mt-1.5 text-sm text-slate-600">The logo leaves the homepage strip straight away. To show it only some of the time, switch it off instead.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onCancel} disabled={busy} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">{busy ? <Spinner light /> : <Trash className="h-4 w-4" />} Remove brand</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );

/** Admin › Homepage logos: the rental brands in the homepage strip "Compare the world's leading car rental brands". */
const HomepageBrandsAdmin: React.FC<{
  /** Turns a chosen picture file into the stored logo (resized). */
  prepareImage: (file: File) => Promise<string>;
  /** Address of a stored picture as the browser loads it. */
  imageUrl: (url: string) => string;
}> = ({ prepareImage, imageUrl }) => {
  const [brands, setBrands] = React.useState<HomepageBrand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [preview, setPreview] = React.useState<'desktop' | 'phone'>('desktop');
  const [editing, setEditing] = React.useState<HomepageBrand | null>(null);
  const [form, setForm] = React.useState<HomepageBrand>({ name: '', logoUrl: '' });
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [preparing, setPreparing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [deleting, setDeleting] = React.useState<HomepageBrand | null>(null);
  const [busyDelete, setBusyDelete] = React.useState(false);
  const [busyRow, setBusyRow] = React.useState<number | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/homepage-logos');
      setBrands((Array.isArray(data) ? data : []).sort(byOrder));
    } catch (e) {
      setError(errorOf(e, 'The brands could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const live = brands.filter(b => b.active !== false && b.logoUrl);
  const stats = {
    total: brands.length,
    live: live.length,
    hidden: brands.filter(b => b.active === false).length,
    noLogo: brands.filter(b => !b.logoUrl).length,
  };

  const openNew = () => {
    const next = brands.reduce((m, b) => Math.max(m, b.displayOrder ?? 0), 0) + 1;
    setForm({ name: '', logoUrl: '', displayOrder: next, active: true, scale: 100 });
    setTouched(false);
    setEditing({ name: '', logoUrl: '' });
  };
  const openEdit = (b: HomepageBrand) => {
    setForm({ ...b, scale: b.scale ?? 100, active: b.active !== false });
    setTouched(false);
    setEditing(b);
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
      notify('Please choose a PNG, JPG, WebP or SVG picture.', 'err');
      return;
    }
    setPreparing(true);
    try {
      const url = file.type === 'image/svg+xml'
        ? await new Promise<string>((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = fail; r.readAsDataURL(file); })
        : await prepareImage(file);
      setForm(f => ({ ...f, logoUrl: url }));
    } catch {
      notify('This picture could not be read. Please try another file.', 'err');
    } finally {
      setPreparing(false);
    }
  };

  const nameError = touched && !form.name.trim() ? 'Enter the brand name.' : '';
  const logoError = touched && !form.logoUrl.trim() ? 'Add the brand logo.' : '';

  const save = async () => {
    setTouched(true);
    if (!form.name.trim() || !form.logoUrl.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, name: form.name.trim(), logoUrl: form.logoUrl.trim() };
      if (editing?.id) await adminFetch(`/api/admin/homepage-logos/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      else await adminFetch('/api/admin/homepage-logos', { method: 'POST', body: JSON.stringify(body) });
      notify(editing?.id ? `${body.name} saved` : `${body.name} added to the homepage strip`);
      setEditing(null);
      await load();
    } catch (e) {
      notify(errorOf(e, 'The brand could not be saved.'), 'err');
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (b: HomepageBrand, active: boolean) => {
    if (!b.id) return;
    setBusyRow(b.id);
    setBrands(list => list.map(x => (x.id === b.id ? { ...x, active } : x)));
    try {
      // Always the whole brand: fields left out would be reset to their defaults by the server.
      await adminFetch(`/api/admin/homepage-logos/${b.id}`, { method: 'PUT', body: JSON.stringify({ ...b, active }) });
      notify(active ? `${b.name} is on the homepage` : `${b.name} is hidden from the homepage`);
    } catch (e) {
      setBrands(list => list.map(x => (x.id === b.id ? { ...x, active: !active } : x)));
      notify(errorOf(e, 'The change could not be saved.'), 'err');
    } finally {
      setBusyRow(null);
    }
  };

  /** Moves a brand one place and saves the new order (1, 2, 3 ...) for the brands whose place changed. */
  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= brands.length) return;
    const next = [...brands];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    const changed = renumbered.filter(b => brands.find(o => o.id === b.id)?.displayOrder !== b.displayOrder);
    const previous = brands;
    setBrands(renumbered);
    setBusyRow(brands[index].id ?? null);
    try {
      // Always the whole brand: fields left out would be reset to their defaults by the server.
      await Promise.all(changed.map(b => adminFetch(`/api/admin/homepage-logos/${b.id}`, { method: 'PUT', body: JSON.stringify(b) })));
    } catch (e) {
      setBrands(previous);
      notify(errorOf(e, 'The new order could not be saved.'), 'err');
    } finally {
      setBusyRow(null);
    }
  };

  const remove = async () => {
    if (!deleting?.id) return;
    setBusyDelete(true);
    try {
      await adminFetch(`/api/admin/homepage-logos/${deleting.id}`, { method: 'DELETE' });
      notify(`${deleting.name} removed`);
      setDeleting(null);
      await load();
    } catch (e) {
      notify(errorOf(e, 'The brand could not be removed.'), 'err');
    } finally {
      setBusyDelete(false);
    }
  };

  const busy = loading && brands.length === 0;

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Website" eyebrowIcon={Sparkles} title="Homepage branding"
        subtitle="The rental brands in the homepage logo strip, “Compare the world's leading car rental brands”. Visitors see the brands that are on, in this order."
        loading={busy}
        actions={<>
          <button onClick={load} className={heroButton}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={openNew} className={heroPrimary}><Plus className="h-4 w-4" /> Add brand</button>
        </>}
        kpis={[
          { label: 'Brands', value: num(stats.total), Icon: Layers },
          { label: 'On the homepage', value: num(stats.live), Icon: Eye, note: stats.live ? 'Shown in the strip' : 'The strip is hidden' },
          { label: 'Switched off', value: num(stats.hidden), Icon: EyeOff },
          { label: 'Missing a logo', value: num(stats.noLogo), Icon: ImageOff, note: stats.noLogo ? 'Not shown until added' : 'All set' },
        ]}
      />

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button onClick={load} className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100">Try again</button>
        </div>
      )}

      {/* Live preview */}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">How visitors see it</h3>
            <p className="text-xs text-slate-500">On the homepage the strip scrolls slowly; here it stands still.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {([['desktop', Monitor, 'Desktop'], ['phone', Smartphone, 'Phone']] as const).map(([k, Icon, label]) => (
                <button key={k} onClick={() => setPreview(k)} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${preview === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[#007ac2] hover:bg-sky-50"><ExternalLink className="h-3.5 w-3.5" /> Open homepage</a>
          </div>
        </div>
        <div className="bg-slate-50 p-4 sm:p-6">
          <div className={`mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white py-8 shadow-sm transition-all ${preview === 'phone' ? 'max-w-[390px]' : 'max-w-full'}`}>
            <p className="mb-6 px-4 text-center text-sm font-semibold text-slate-900 sm:text-base">Compare the world's leading car rental brands</p>
            {live.length ? (
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
                {live.map(b => <BrandTile key={b.id} brand={b} imageUrl={imageUrl} large={preview === 'desktop'} />)}
              </div>
            ) : (
              <p className="px-4 text-center text-sm text-slate-500">No brand is on, so the strip is not shown on the homepage.</p>
            )}
          </div>
        </div>
      </section>

      {/* Brand list */}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-slate-900">Brands <span className="font-normal text-slate-400">· {num(brands.length)}</span></h3>
          <p className="hidden text-xs text-slate-500 sm:block">Use the arrows to change the order.</p>
        </div>
        {busy ? (
          <ul className="divide-y divide-slate-100">{[0, 1, 2].map(i => <li key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5"><div className="h-16 w-36 animate-pulse rounded-xl bg-slate-100" /><div className="h-4 w-40 animate-pulse rounded bg-slate-100" /></li>)}</ul>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#007ac2]"><Layers className="h-6 w-6" /></span>
            <h4 className="mt-4 text-base font-semibold text-slate-900">No brands yet</h4>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Add the rental brands you work with. Their logos appear in a strip on the homepage.</p>
            <button onClick={openNew} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white hover:bg-[#00649f]"><Plus className="h-4 w-4" /> Add the first brand</button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {brands.map((b, i) => {
              const on = b.active !== false;
              return (
                <li key={b.id} className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${on ? '' : 'bg-slate-50/60'}`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-slate-400">{i + 1}</span>
                    <div className={on ? '' : 'opacity-50 grayscale'}><BrandTile brand={b} imageUrl={imageUrl} /></div>
                    <div className="min-w-0 sm:hidden">
                      <p className="truncate font-semibold text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">{on ? 'On the homepage' : 'Switched off'}</p>
                    </div>
                  </div>
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <p className="truncate font-semibold text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-500">
                      {!b.logoUrl ? <span className="font-medium text-amber-700">Logo missing: not shown</span> : on ? 'On the homepage' : 'Switched off'}
                      {(b.scale ?? 100) !== 100 && <> · size {b.scale}%</>}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" title={on ? 'Hide from the homepage' : 'Show on the homepage'}>
                      <span className="relative">
                        <input type="checkbox" className="peer sr-only" checked={on} disabled={busyRow === b.id} onChange={e => setActive(b, e.target.checked)} />
                        <span className="block h-6 w-10 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-disabled:opacity-60" />
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                      </span>
                      <span className="w-12">{on ? 'Shown' : 'Hidden'}</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => move(i, -1)} disabled={i === 0 || busyRow !== null} aria-label={`Move ${b.name} up`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                      <button onClick={() => move(i, 1)} disabled={i === brands.length - 1 || busyRow !== null} aria-label={`Move ${b.name} down`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(b)} aria-label={`Edit ${b.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-sky-50 hover:text-[#007ac2]"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleting(b)} aria-label={`Remove ${b.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-rose-50 hover:text-rose-600"><Trash className="h-4 w-4" /></button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {editing && (
          <Drawer
            eyebrow={editing.id ? 'Edit brand' : 'New brand'}
            title={form.name.trim() || (editing.id ? editing.name : 'Add a brand')}
            onClose={() => !saving && setEditing(null)}
            busy={saving}
            footer={
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button onClick={() => setEditing(null)} disabled={saving} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
                <button onClick={save} disabled={saving || preparing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-60">{saving && <Spinner light />} {editing.id ? 'Save changes' : 'Add brand'}</button>
              </div>
            }
          >
            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs font-medium text-slate-500">Preview on the homepage</p>
                <div className="mt-3 flex items-center justify-center rounded-xl bg-slate-50 py-6">
                  <BrandTile brand={form} imageUrl={imageUrl} large />
                </div>
              </div>

              <Field label="Brand name" hint={nameError || 'Shown to screen readers and when the logo cannot load.'}>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Hertz" className={`${inputCls} ${nameError ? 'ring-rose-300' : ''}`} autoFocus />
              </Field>

              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Logo</p>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${dragging ? 'border-[#007ac2] bg-sky-50' : logoError ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white hover:border-[#007ac2]/50 hover:bg-sky-50/40'}`}
                >
                  {preparing ? <Spinner /> : <CloudUpload className="h-6 w-6 text-[#007ac2]" />}
                  <p className="mt-2 text-sm font-semibold text-slate-800">{form.logoUrl ? 'Replace the logo' : 'Drop the logo here or choose a file'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">PNG with a transparent background works best · about 400 × 200 px</p>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
                </div>
                {logoError && <p className="mt-1.5 text-xs font-medium text-rose-600">{logoError}</p>}
                <div className="mt-3">
                  <Field label="Or paste a link to the logo">
                    <input value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                      placeholder={form.logoUrl.startsWith('data:') ? 'Using the uploaded picture' : 'https://…'} className={inputCls} />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Logo size</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">{form.scale ?? 100}%</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">Make a logo with a lot of empty space bigger, or a tall one smaller, so all brands look even.</p>
                <input type="range" min={50} max={150} step={5} value={form.scale ?? 100} onChange={e => setForm(f => ({ ...f, scale: Number(e.target.value) }))} className="mt-3 w-full accent-[#007ac2]" aria-label="Logo size" />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>50%</span><button type="button" onClick={() => setForm(f => ({ ...f, scale: 100 }))} className="font-semibold text-[#007ac2] hover:underline">Reset</button><span>150%</span></div>
              </div>

              <Toggle checked={form.active !== false} onChange={v => setForm(f => ({ ...f, active: v }))} label="Show on the homepage" hint="Switch off to keep the brand here without showing it." />
            </div>
          </Drawer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && <ConfirmDelete brand={deleting} busy={busyDelete} onCancel={() => setDeleting(null)} onConfirm={remove} />}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
};

export default HomepageBrandsAdmin;
