import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Users from 'lucide-react/dist/esm/icons/users';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Rows from 'lucide-react/dist/esm/icons/rows-3';
import Info from 'lucide-react/dist/esm/icons/info';
import { adminAxios, API_BASE_URL } from '../../api';
import SearchPromoBanner, { BANNER_ICONS, BANNER_THEMES, PromoBanner } from '../../components/SearchPromoBanner';
import { Hero, heroPrimary, Drawer, ErrorBanner, Spinner, Toast, useToast, errorOf, num, fmtDate, inputCls, Field, Toggle } from './commercialUi';

const BASE = `${API_BASE_URL}/api/admin/banners`;

type Banner = PromoBanner & {
  id?: number; name: string; locationCodes?: string | null; startDate?: string | null; endDate?: string | null;
  active: boolean; sortOrder?: number; positionAfter: number; audience: string;
};

const EMPTY: Banner = {
  name: '', eyebrow: 'Limited offer', title: '', subtitle: '', ctaLabel: 'Find out more', ctaUrl: '/', badge: '', badgeCaption: '',
  theme: 'NAVY', icon: 'gift', imageUrl: '', positionAfter: 3, audience: 'ALL', locationCodes: '', startDate: '', endDate: '', active: true, sortOrder: 0,
};

const AUDIENCE: Record<string, string> = { ALL: 'Everyone', GUESTS: 'Guests (not signed in)', MEMBERS: 'Rewards members' };

const statusOf = (b: Banner) => {
  const today = new Date().toISOString().slice(0, 10);
  if (!b.active) return { label: 'Off', cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
  if (b.startDate && b.startDate > today) return { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-sky-200' };
  if (b.endDate && b.endDate < today) return { label: 'Ended', cls: 'bg-amber-50 text-amber-800 ring-amber-200' };
  return { label: 'Live', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
};

const BannersAdmin: React.FC = () => {
  const [items, setItems] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [editing, setEditing] = React.useState<Banner | null>(null);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems((await adminAxios.get(BASE)).data); }
    catch (e) { setError(errorOf(e, 'Couldn’t load banners.')); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const toggle = async (b: Banner) => {
    try {
      await adminAxios.patch(`${BASE}/${b.id}/active`, null, { params: { active: !b.active } });
      notify(b.active ? 'Banner turned off' : 'Banner is live');
      load();
    } catch (e) { notify(errorOf(e, 'Couldn’t update the banner.'), 'err'); }
  };

  const remove = async (b: Banner) => {
    if (!window.confirm(`Delete “${b.name}”? This can’t be undone.`)) return;
    try { await adminAxios.delete(`${BASE}/${b.id}`); notify('Banner deleted'); load(); }
    catch (e) { notify(errorOf(e, 'Couldn’t delete the banner.'), 'err'); }
  };

  const live = items.filter(b => statusOf(b).label === 'Live').length;

  return (
    <div className="space-y-5">
      <Hero eyebrow="Search results" eyebrowIcon={Megaphone} title="Search banners"
        subtitle="Offers shown between the cars on the search results page. Choose the style, the position, who sees them and when."
        loading={loading && !items.length}
        actions={<button className={heroPrimary} onClick={() => setEditing({ ...EMPTY })}><Plus className="h-4 w-4" /> New banner</button>}
        kpis={[
          { label: 'Live now', value: num(live), Icon: Eye },
          { label: 'All banners', value: num(items.length), Icon: Rows },
          { label: 'For guests', value: num(items.filter(b => b.audience === 'GUESTS').length), Icon: Users },
          { label: 'For members', value: num(items.filter(b => b.audience === 'MEMBERS').length), Icon: Users },
        ]} />

      {error && <ErrorBanner text={error} onRetry={load} />}

      {loading && !items.length ? <div className="flex justify-center p-12"><Spinner /></div> : items.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200">
          <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-900">No banners yet</p>
          <button onClick={() => setEditing({ ...EMPTY })} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create a banner</button>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map(b => {
            const st = statusOf(b);
            return (
              <li key={b.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${st.cls}`}>{st.label}</span>
                  <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">{b.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Rows className="h-3.5 w-3.5" /> After car {b.positionAfter}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {AUDIENCE[b.audience] || b.audience}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {b.locationCodes || 'All locations'}</span>
                    {(b.startDate || b.endDate) && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {b.startDate ? fmtDate(b.startDate) : 'Now'} – {b.endDate ? fmtDate(b.endDate) : 'no end'}</span>}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 sm:p-5"><SearchPromoBanner banner={b} preview /></div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
                    <span className="relative">
                      <input type="checkbox" className="peer sr-only" checked={b.active} onChange={() => toggle(b)} aria-label={`Show ${b.name}`} />
                      <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </span>
                    {b.active ? 'On' : 'Off'}
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing({ ...b })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"><Pencil className="h-4 w-4" /> Edit</button>
                    <button onClick={() => remove(b)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Delete</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Only advertise offers HogiCar actually gives. Changes reach the website within a minute. Customers can hide a banner for the rest of their visit.</p>

      <AnimatePresence>
        {editing && <BannerEditor initial={editing} onClose={() => setEditing(null)} onSaved={msg => { setEditing(null); notify(msg); load(); }} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

const BannerEditor = ({ initial, onClose, onSaved }: { initial: Banner; onClose: () => void; onSaved: (msg: string) => void }) => {
  const [b, setB] = React.useState<Banner>({ ...EMPTY, ...initial });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const set = <K extends keyof Banner>(k: K, v: Banner[K]) => setB(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = { ...b, startDate: b.startDate || null, endDate: b.endDate || null };
      if (b.id) await adminAxios.put(`${BASE}/${b.id}`, body); else await adminAxios.post(BASE, body);
      onSaved(b.id ? 'Banner saved' : 'Banner created');
    } catch (e) {
      setError(errorOf(e, 'Couldn’t save the banner.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer eyebrow={b.id ? 'Edit banner' : 'New banner'} title={b.name || 'Untitled banner'} onClose={onClose} busy={busy} width="max-w-[760px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-rose-700">{error}</p> : <span className="text-xs text-slate-500">The preview updates as you type.</span>}
          <div className="flex shrink-0 gap-2">
            <button onClick={onClose} disabled={busy} className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Cancel</button>
            <button onClick={save} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-60">{busy && <Spinner light />} Save banner</button>
          </div>
        </div>
      }>
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Live preview</p>
          <div className="rounded-2xl bg-slate-100 p-3 ring-1 ring-slate-200">
            <div className="mb-2 h-16 rounded-xl bg-white ring-1 ring-slate-200" aria-hidden="true" />
            <SearchPromoBanner banner={{ ...b, title: b.title || 'Your headline' }} preview />
            <div className="mt-2 h-16 rounded-xl bg-white ring-1 ring-slate-200" aria-hidden="true" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Internal name" hint="Only you see this." className="sm:col-span-2"><input className={inputCls} value={b.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer member offer" /></Field>
          <Field label="Small label"><input className={inputCls} value={b.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} maxLength={40} placeholder="e.g. Members only" /></Field>
          <Field label="Headline"><input className={inputCls} value={b.title} onChange={e => set('title', e.target.value)} maxLength={120} placeholder="e.g. Get 10% off with your account" /></Field>
          <Field label="Text" className="sm:col-span-2"><textarea className={`${inputCls} h-20 py-2.5`} value={b.subtitle || ''} onChange={e => set('subtitle', e.target.value)} maxLength={300} placeholder="One or two short sentences." /></Field>
          <Field label="Highlight" hint="Big text on the right, e.g. 10% or 250 pts."><input className={inputCls} value={b.badge || ''} onChange={e => set('badge', e.target.value)} maxLength={16} /></Field>
          <Field label="Highlight caption"><input className={inputCls} value={b.badgeCaption || ''} onChange={e => set('badgeCaption', e.target.value)} maxLength={40} placeholder="e.g. off your rental" /></Field>
          <Field label="Button text" hint="Leave empty for no button."><input className={inputCls} value={b.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} maxLength={40} /></Field>
          <Field label="Button link" hint="A page like /my-bookings, or https://…"><input className={inputCls} value={b.ctaUrl || ''} onChange={e => set('ctaUrl', e.target.value)} maxLength={500} /></Field>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-900">Style</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(BANNER_THEMES).map(([key, t]) => (
              <button key={key} type="button" onClick={() => set('theme', key)} aria-pressed={b.theme === key}
                className={`rounded-xl p-1.5 text-center ring-2 transition ${b.theme === key ? 'ring-[#007ac2]' : 'ring-transparent hover:ring-slate-300'}`}>
                <span className={`block h-10 rounded-lg bg-gradient-to-r ${t.swatch}`} />
                <span className="mt-1 block text-xs font-medium text-slate-700">{t.label}</span>
              </button>
            ))}
          </div>
          {b.theme === 'IMAGE' && (
            <Field label="Background image link" hint="A wide photo, at least 1200 px wide. Text sits on the left." className="mt-3">
              <input className={inputCls} value={b.imageUrl || ''} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" />
            </Field>
          )}
          <p className="mb-2 mt-4 text-sm font-semibold text-slate-900">Icon</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => set('icon', null)} className={`h-11 rounded-xl px-3 text-xs font-semibold ring-2 ${!b.icon ? 'ring-[#007ac2]' : 'ring-slate-200'}`}>None</button>
            {Object.entries(BANNER_ICONS).map(([key, Icon]) => (
              <button key={key} type="button" onClick={() => set('icon', key)} aria-label={key} aria-pressed={b.icon === key}
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-2 ${b.icon === key ? 'text-[#007ac2] ring-[#007ac2]' : 'text-slate-600 ring-slate-200 hover:ring-slate-300'}`}>
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Position" hint="Shown after this many cars.">
            <select className={inputCls} value={b.positionAfter} onChange={e => set('positionAfter', Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(n => <option key={n} value={n}>After car {n}</option>)}
            </select>
          </Field>
          <Field label="Who sees it">
            <select className={inputCls} value={b.audience} onChange={e => set('audience', e.target.value)}>
              {Object.entries(AUDIENCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Pick-up locations" hint="Codes like AMM, AQJ. Empty = everywhere." className="sm:col-span-2"><input className={inputCls} value={b.locationCodes || ''} onChange={e => set('locationCodes', e.target.value.toUpperCase())} placeholder="All locations" /></Field>
          <Field label="Starts"><input type="date" className={inputCls} value={b.startDate || ''} onChange={e => set('startDate', e.target.value)} /></Field>
          <Field label="Ends"><input type="date" className={inputCls} value={b.endDate || ''} onChange={e => set('endDate', e.target.value)} /></Field>
        </section>

        <Toggle checked={b.active} onChange={v => set('active', v)} label="Show on the website" hint="Turn off to keep the banner without showing it." />
      </div>
    </Drawer>
  );
};

export default BannersAdmin;
