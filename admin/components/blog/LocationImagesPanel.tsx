import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Info from 'lucide-react/dist/esm/icons/info';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Globe from 'lucide-react/dist/esm/icons/globe';
import CloudUpload from 'lucide-react/dist/esm/icons/cloud-upload';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Layers from 'lucide-react/dist/esm/icons/layers';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check';
import Lock from 'lucide-react/dist/esm/icons/lock';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { adminFetch } from '../../../lib/adminApi';
import ImageUploadField from '../ImageUploadField';
import { Drawer, Field, inputCls, Segmented, Spinner, ErrorBanner, num } from '../commercialUi';
import {
  BlogLocationImage, CoverageRow, ConfirmOptions, Empty, Thumb, apiMessage, normTag, placeLabel, placeName, plural,
  primaryBtn, secondaryBtn, smallBtn,
} from './blogShared';

/* ------------------------------------------------------------------ model */

type Place = {
  key: string;
  country: string;
  city: string | null;
  articles: number;
  ownImage: number;
  titles: string[];
  image: BlogLocationImage | null;
  inheritedUrl: string | null;
  coverage?: CoverageRow;
};

type CountryGroup = { country: string; place: Place; cities: Place[]; extras: BlogLocationImage[] };

const keyOf = (country: string, city?: string | null) => `${country}|${city || ''}`;

const buildGroups = (
  images: BlogLocationImage[],
  coverage: CoverageRow[],
  used: { countryTag: string; cityTag: string | null }[],
): CountryGroup[] => {
  const plain = new Map<string, BlogLocationImage>();
  const extras: BlogLocationImage[] = [];
  images.forEach(img => {
    if (!img.countryTag) return;
    if (img.areaTag || img.topicTag) extras.push(img);
    else plain.set(keyOf(normTag(img.countryTag), normTag(img.cityTag)), img);
  });

  const places = new Map<string, Place>();
  const ensure = (countryRaw: string, cityRaw?: string | null) => {
    const country = normTag(countryRaw);
    const city = normTag(cityRaw) || null;
    if (!country) return null;
    const k = keyOf(country, city);
    let p = places.get(k);
    if (!p) {
      p = { key: k, country, city, articles: 0, ownImage: 0, titles: [], image: null, inheritedUrl: null };
      places.set(k, p);
    }
    return p;
  };

  coverage.forEach(row => {
    const p = ensure(row.countryTag, row.cityTag);
    if (!p) return;
    p.articles = Number(row.articles || 0);
    p.ownImage = Number(row.ownImage || 0);
    p.titles = row.titles || [];
    p.coverage = row;
  });
  plain.forEach(img => ensure(img.countryTag, img.cityTag));
  used.forEach(u => ensure(u.countryTag, u.cityTag));
  extras.forEach(img => ensure(img.countryTag, null));

  places.forEach(p => {
    p.image = plain.get(p.key) || null;
    const row = p.coverage;
    if (!p.image && row && row.imageId != null && row.imageUrl && !row.inheritedFromCountry) {
      p.image = { id: row.imageId, countryTag: p.country, cityTag: p.city, imageUrl: row.imageUrl };
    }
  });

  const groups = new Map<string, CountryGroup>();
  places.forEach(p => {
    if (p.city) return;
    groups.set(p.country, { country: p.country, place: p, cities: [], extras: [] });
  });
  places.forEach(p => {
    if (!p.city) return;
    let g = groups.get(p.country);
    if (!g) {
      const cp = ensure(p.country, null)!;
      g = { country: p.country, place: cp, cities: [], extras: [] };
      groups.set(p.country, g);
    }
    g.cities.push(p);
  });
  extras.forEach(img => groups.get(normTag(img.countryTag))?.extras.push(img));

  const byWeight = (a: Place, b: Place) => b.articles - a.articles || placeLabel(a.city || a.country).localeCompare(placeLabel(b.city || b.country));
  const list = [...groups.values()];
  list.forEach(g => {
    if (!g.place.coverage && g.place.articles === 0) {
      g.place.articles = g.cities.reduce((n, c) => n + c.articles, 0);
      g.place.ownImage = g.cities.reduce((n, c) => n + c.ownImage, 0);
    }
    const countryUrl = g.place.image?.imageUrl || null;
    g.cities.forEach(c => {
      if (!c.image) c.inheritedUrl = countryUrl || (c.coverage?.inheritedFromCountry ? c.coverage.imageUrl : null);
    });
    g.cities.sort(byWeight);
  });
  return list.sort((a, b) => byWeight(a.place, b.place));
};

/* ------------------------------------------------------------------ pieces */

const Titles: React.FC<{ titles: string[] }> = ({ titles }) => {
  if (!titles.length) return null;
  const shown = titles.slice(0, 8);
  return (
    <details className="group mt-2 text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /> Show articles
      </summary>
      <ul className="mt-2 space-y-1 border-l-2 border-slate-100 pl-3">
        {shown.map((t, i) => <li key={i} className="line-clamp-1 text-[13px] text-slate-600" title={t}>{t}</li>)}
        {titles.length > shown.length && <li className="text-[13px] text-slate-400">and {titles.length - shown.length} more</li>}
      </ul>
    </details>
  );
};

const Counts: React.FC<{ p: Place }> = ({ p }) => (
  <p className="mt-0.5 text-[13px] text-slate-500">
    <span className="font-medium text-slate-700">{plural(p.articles, 'article')}</span>
    {p.ownImage > 0 && <> · {p.ownImage} {p.ownImage === 1 ? 'uses its' : 'use their'} own picture</>}
  </p>
);

const Actions: React.FC<{
  p: Place; busy: string | null; onUpload: () => void; onApply: () => void; onDelete: () => void; compact?: boolean;
}> = ({ p, busy, onUpload, onApply, onDelete, compact }) => {
  const has = !!p.image;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" onClick={onUpload}
        className={`${smallBtn} ${has ? 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50' : 'bg-[#007ac2] text-white hover:bg-[#00649f]'}`}>
        {has ? <RefreshCw className="h-3.5 w-3.5" /> : <CloudUpload className="h-4 w-4" />}
        {has ? 'Replace image' : 'Upload image'}
      </button>
      {has && p.articles > 0 && p.ownImage > 0 && (
        <button type="button" onClick={onApply} disabled={!!busy}
          className={`${smallBtn} bg-[#007ac2]/10 text-[#00649f] hover:bg-[#007ac2]/15`}>
          {busy === `apply-${p.key}` ? <Spinner /> : <Layers className="h-3.5 w-3.5" />}
          Apply to all {num(p.articles)} articles
        </button>
      )}
      {has && p.articles > 0 && p.ownImage === 0 && !compact && (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700"><CircleCheck className="h-4 w-4" /> Every article shows this image</span>
      )}
      {has && (
        <button type="button" onClick={onDelete} disabled={!!busy} aria-label="Delete image"
          className={`${smallBtn} ml-auto px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
          {busy === `del-${p.key}` ? <Spinner /> : <Trash2 className="h-4 w-4" />}
          <span className="sr-only sm:not-sr-only">Delete</span>
        </button>
      )}
    </div>
  );
};

const CityTile: React.FC<{ p: Place; busy: string | null; onUpload: () => void; onApply: () => void; onDelete: () => void }> = ({ p, ...rest }) => {
  const own = p.image?.imageUrl;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <Thumb src={own || p.inheritedUrl} alt={p.image?.altText || placeLabel(p.city)} dim={!own} className="aspect-[16/10]" iconSize="h-6 w-6">
        {!own && (
          <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ring-1 ring-inset ${p.inheritedUrl ? 'bg-white/90 text-slate-700 ring-slate-200' : 'bg-amber-50 text-amber-800 ring-amber-200'}`}>
            {p.inheritedUrl ? <><Globe className="h-3 w-3" /> Uses country image</> : <><ImageIcon className="h-3 w-3" /> No image yet</>}
          </span>
        )}
      </Thumb>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="flex items-center gap-1.5 font-semibold text-slate-900"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{placeLabel(p.city)}</span></p>
        <Counts p={p} />
        <Titles titles={p.titles} />
        <div className="mt-auto"><Actions p={p} compact {...rest} /></div>
      </div>
    </div>
  );
};

const CountryCard: React.FC<{
  g: CountryGroup; busy: string | null;
  onUpload: (p: Place) => void; onApply: (p: Place) => void; onDelete: (p: Place) => void; onEditExtra: (img: BlogLocationImage) => void;
}> = ({ g, busy, onUpload, onApply, onDelete, onEditExtra }) => {
  const p = g.place;
  const label = placeLabel(g.country);
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Thumb src={p.image?.imageUrl} alt={p.image?.altText || label} className="aspect-video md:aspect-auto md:min-h-[240px]" iconSize="h-8 w-8">
          {!p.image && (
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-6 text-sm font-medium text-slate-500 md:inset-0 md:pb-0 md:pt-20">No image yet</span>
          )}
        </Thumb>
        <div className="flex flex-col p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#007ac2]">Country</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{label}</h3>
          <Counts p={p} />
          {g.cities.length > 0 && <p className="text-[13px] text-slate-500">{plural(g.cities.length, 'city', 'cities')} listed below</p>}
          <p className="mt-3 text-sm text-slate-600">
            {p.image
              ? `Shown on every article about ${label} that has no city image and no picture of its own.`
              : `Add an image so articles about ${label} without their own picture still look good.`}
          </p>
          <Titles titles={p.titles} />
          <div className="mt-auto pt-1">
            <Actions p={p} busy={busy} onUpload={() => onUpload(p)} onApply={() => onApply(p)} onDelete={() => onDelete(p)} />
          </div>
        </div>
      </div>

      {g.cities.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Cities in {label}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.cities.map(c => (
              <CityTile key={c.key} p={c} busy={busy} onUpload={() => onUpload(c)} onApply={() => onApply(c)} onDelete={() => onDelete(c)} />
            ))}
          </div>
        </div>
      )}

      {g.extras.length > 0 && (
        <div className="border-t border-slate-100 p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Area and topic images</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {g.extras.map(img => (
              <li key={img.id}>
                <button type="button" onClick={() => onEditExtra(img)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left ring-1 ring-slate-200 hover:bg-slate-50">
                  <Thumb src={img.imageUrl} alt={img.altText} className="aspect-[16/10] w-20 shrink-0 rounded-lg" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{img.title || placeName(normTag(img.countryTag), normTag(img.cityTag) || null)}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {[img.cityTag && placeLabel(normTag(img.cityTag)), img.areaTag && `Area: ${placeLabel(img.areaTag)}`, img.topicTag && `Topic: ${placeLabel(img.topicTag)}`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ drawer */

type Draft = {
  id?: number;
  countryTag: string;
  cityTag: string;
  areaTag: string;
  topicTag: string;
  title: string;
  altText: string;
  caption: string;
  imageUrl: string;
};

type DrawerState = { draft: Draft; locked: boolean; base?: BlogLocationImage | null; articles?: number };

const toDraft = (img: Partial<BlogLocationImage> | null, country = '', city = ''): Draft => ({
  id: img?.id,
  countryTag: img?.countryTag ? normTag(img.countryTag) : country,
  cityTag: img?.cityTag ? normTag(img.cityTag) : city,
  areaTag: img?.areaTag || '',
  topicTag: img?.topicTag || '',
  title: img?.title || '',
  altText: img?.altText || '',
  caption: img?.caption || '',
  imageUrl: img?.imageUrl || '',
});

const LocationDrawer: React.FC<{
  state: DrawerState;
  countries: string[];
  citiesOf: (country: string) => string[];
  findExisting: (country: string, city: string | null) => BlogLocationImage | null;
  onClose: () => void;
  onSaved: (label: string) => void;
}> = ({ state, countries, citiesOf, findExisting, onClose, onSaved }) => {
  const [d, setD] = React.useState<Draft>(state.draft);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<Draft>) => { setError(null); setD(prev => ({ ...prev, ...p })); };

  const country = normTag(d.countryTag);
  const city = normTag(d.cityTag) || null;
  const label = country ? placeName(country, city) : '';
  const isExtra = !!(state.base?.areaTag || state.base?.topicTag);

  const save = async () => {
    if (!country) { setError('Enter a country.'); return; }
    if (!d.imageUrl.trim()) { setError('Upload an image or paste its address.'); return; }
    setBusy(true);
    setError(null);
    const area = normTag(d.areaTag);
    const topic = normTag(d.topicTag);
    const existingId = d.id ?? (!area && !topic ? findExisting(country, city)?.id : undefined);
    const payload: Record<string, any> = {
      ...(state.base || {}),
      countryTag: country,
      cityTag: city,
      title: d.title.trim() || label,
      altText: d.altText.trim() || label,
      caption: d.caption.trim(),
      imageUrl: d.imageUrl.trim(),
    };
    if (existingId != null) payload.id = existingId; else delete payload.id;
    if (area) payload.areaTag = area; else delete payload.areaTag;
    if (topic) payload.topicTag = topic; else delete payload.topicTag;
    try {
      await adminFetch('/api/admin/blog/location-images', { method: 'POST', body: JSON.stringify(payload) });
      onSaved(label);
    } catch (e) {
      setError(apiMessage(e, 'Could not save the image. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const ro = `${inputCls} bg-slate-50 text-slate-600`;
  return (
    <Drawer
      eyebrow={state.locked ? (state.base?.id ? 'Replace location image' : 'Add location image') : 'Add location image'}
      title={label || 'New location image'}
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={`${secondaryBtn} flex-1 sm:flex-none`}>Cancel</button>
          <button type="button" onClick={save} disabled={busy} className={`${primaryBtn} flex-[2] sm:ml-auto sm:flex-none`}>
            {busy ? <Spinner light /> : <CloudUpload className="h-4 w-4" />} Save image
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Place</p>
          {state.locked ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country"><div className="relative"><input readOnly className={ro} value={placeLabel(country)} /><Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></div></Field>
              <Field label="City"><div className="relative"><input readOnly className={ro} value={city ? placeLabel(city) : 'Whole country'} /><Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></div></Field>
              {isExtra && (
                <>
                  <Field label="Area"><input readOnly className={ro} value={placeLabel(d.areaTag) || '—'} /></Field>
                  <Field label="Topic"><input readOnly className={ro} value={placeLabel(d.topicTag) || '—'} /></Field>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country" hint={country ? `Shows as “${placeLabel(country)}”` : 'For example Jordan'}>
                  <input list="loc-countries" className={inputCls} value={d.countryTag} onChange={e => set({ countryTag: e.target.value })} placeholder="Jordan" autoFocus />
                </Field>
                <Field label="City" hint={city ? `Shows as “${placeLabel(city)}”` : 'Leave empty for the whole country'}>
                  <input list="loc-cities" className={inputCls} value={d.cityTag} onChange={e => set({ cityTag: e.target.value })} placeholder="Optional, e.g. Dead Sea" />
                </Field>
              </div>
              <datalist id="loc-countries">{countries.map(c => <option key={c} value={placeLabel(c)} />)}</datalist>
              <datalist id="loc-cities">{citiesOf(country).map(c => <option key={c} value={placeLabel(c)} />)}</datalist>
              <details className="group">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /> Area or topic (optional)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Area" hint="A neighbourhood, e.g. Abdoun"><input className={inputCls} value={d.areaTag} onChange={e => set({ areaTag: e.target.value })} /></Field>
                  <Field label="Topic" hint="e.g. driving, parking, food"><input className={inputCls} value={d.topicTag} onChange={e => set({ topicTag: e.target.value })} /></Field>
                </div>
              </details>
            </>
          )}
          {state.locked && state.articles != null && (
            <p className="flex items-start gap-2 text-[13px] text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {state.articles > 0
                ? `Shown on ${plural(state.articles, 'article')} about ${label} unless they have their own picture.`
                : `No articles about ${label} yet. New ones will show this image.`}
            </p>
          )}
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Image</p>
          <ImageUploadField label="Picture" value={d.imageUrl} onChange={e => set({ imageUrl: e.target.value })} helperText="Landscape works best, at least 1600 px wide." />
          <Field label="Alt text" hint="Describe what is in the picture. Read by screen readers and Google.">
            <input className={inputCls} value={d.altText} onChange={e => set({ altText: e.target.value })} placeholder={label ? `View of ${label}` : 'View of the old town at sunset'} />
          </Field>
          <Field label="Caption" hint="Optional. Shown under the picture on the article.">
            <input className={inputCls} value={d.caption} onChange={e => set({ caption: e.target.value })} />
          </Field>
          <Field label="Library title" hint="Optional. Helps you find it in the media library.">
            <input className={inputCls} value={d.title} onChange={e => set({ title: e.target.value })} placeholder={label} />
          </Field>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
        )}
      </div>
    </Drawer>
  );
};

/* ------------------------------------------------------------------ panel */

const LocationImagesPanel: React.FC<{
  images: BlogLocationImage[];
  coverage: CoverageRow[];
  usedLocations: { countryTag: string; cityTag: string | null }[];
  loading: boolean;
  error: string | null;
  addSignal: number;
  onReload: () => void;
  onChanged: () => Promise<void> | void;
  notify: (t: string, tone?: 'ok' | 'err') => void;
  ask: (o: ConfirmOptions) => Promise<boolean>;
}> = ({ images, coverage, usedLocations, loading, error, addSignal, onReload, onChanged, notify, ask }) => {
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<'all' | 'missing'>('all');
  const [drawer, setDrawer] = React.useState<DrawerState | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const groups = React.useMemo(() => buildGroups(images, coverage, usedLocations), [images, coverage, usedLocations]);

  const allPlaces = React.useMemo(() => groups.flatMap(g => [g.place, ...g.cities]), [groups]);
  const missingCount = allPlaces.filter(p => !p.image).length;
  const withImage = allPlaces.length - missingCount;

  const openNew = React.useCallback(() => setDrawer({ draft: toDraft(null), locked: false }), []);
  const lastSignal = React.useRef(addSignal);
  React.useEffect(() => {
    if (addSignal !== lastSignal.current) { lastSignal.current = addSignal; openNew(); }
  }, [addSignal, openNew]);

  const q = normTag(query);
  const visible = groups
    .map(g => {
      const countryHit = !q || g.country.includes(q);
      let cities = g.cities.filter(c => countryHit || (c.city || '').includes(q));
      if (view === 'missing') cities = cities.filter(c => !c.image);
      const show = (countryHit || cities.length > 0) && (view === 'all' || !g.place.image || cities.length > 0);
      return show ? { ...g, cities } : null;
    })
    .filter(Boolean) as CountryGroup[];

  const upload = (p: Place) => setDrawer({
    draft: toDraft(p.image, p.country, p.city || ''),
    locked: true,
    base: p.image,
    articles: p.articles,
  });

  const apply = async (p: Place) => {
    if (!p.image) return;
    const label = placeName(p.country, p.city);
    const ok = await ask({
      title: `Use this image for every article about ${label}?`,
      body: (
        <>
          <p>{p.ownImage} of {plural(p.articles, 'article')} about {label} {p.ownImage === 1 ? 'has its' : 'have their'} own picture. {p.ownImage === 1 ? 'It' : 'They'} will switch to this image.</p>
          <p className="mt-2 text-slate-500">Their own pictures are cleared from those articles. You can still give an article its own picture again later.</p>
        </>
      ),
      confirmLabel: `Apply to ${plural(p.articles, 'article')}`,
      tone: 'primary',
    });
    if (!ok) return;
    setBusy(`apply-${p.key}`);
    try {
      const res = await adminFetch(`/api/admin/blog/location-images/${p.image.id}/apply`, { method: 'POST' });
      const n = Number(res?.updated ?? 0);
      notify(`Applied to ${plural(n, 'article')}`);
      await onChanged();
    } catch (e) {
      notify(apiMessage(e, 'Could not apply the image.'), 'err');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: Place) => {
    if (!p.image) return;
    const label = placeName(p.country, p.city);
    const ok = await ask({
      title: `Delete the ${label} image?`,
      body: p.city
        ? `Articles about ${placeLabel(p.city)} without their own picture will show the ${placeLabel(p.country)} image instead, if there is one.`
        : `Articles about ${label} without their own picture or a city image will have no picture.`,
      confirmLabel: 'Delete image',
    });
    if (!ok) return;
    setBusy(`del-${p.key}`);
    try {
      await adminFetch(`/api/admin/blog/location-images/${p.image.id}`, { method: 'DELETE' });
      notify(`${label} image deleted`);
      await onChanged();
    } catch (e) {
      notify(apiMessage(e, 'Could not delete the image.'), 'err');
    } finally {
      setBusy(null);
    }
  };

  const findExisting = React.useCallback((country: string, city: string | null) =>
    images.find(i => !i.areaTag && !i.topicTag && normTag(i.countryTag) === country && (normTag(i.cityTag) || null) === city) || null, [images]);

  const countries = groups.map(g => g.country);
  const citiesOf = (c: string) => groups.find(g => g.country === c)?.cities.map(x => x.city!) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007ac2]/10 text-[#007ac2]"><Info className="h-4 w-4" /></span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-slate-900">One image per country or city. Every article about that place shows it unless it has its own picture.</p>
          <p className="mt-0.5 text-slate-500">
            {loading ? 'Loading places…' : `${plural(allPlaces.length, 'place')} · ${num(withImage)} with an image · ${num(missingCount)} without`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented layoutId="loc-view" value={view} onChange={setView} items={[
          { key: 'all', label: 'All places', count: allPlaces.length },
          { key: 'missing', label: 'Missing an image', count: missingCount, dot: missingCount > 0 },
        ]} />
        <div className="flex gap-2">
          <label className="relative block min-w-0 flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a country or city"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base shadow-sm outline-none focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm" />
          </label>
          <button type="button" onClick={openNew} className={`${primaryBtn} shrink-0`}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add image</span></button>
        </div>
      </div>

      {error && <ErrorBanner text={error} onRetry={onReload} />}

      {loading && !groups.length ? (
        <div className="space-y-4">{[0, 1].map(i => <div key={i} className="h-72 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : visible.length === 0 ? (
        <Empty icon={MapPin}
          title={groups.length ? (view === 'missing' && !q ? 'Every place has an image' : 'No places match') : 'No places yet'}
          text={groups.length ? (view === 'missing' && !q ? 'Nice — all countries and cities used by your articles have a picture.' : 'Try another search.') : 'Places appear here once articles mention a country or city. You can also add an image for any place now.'}
          action={!groups.length ? <button type="button" onClick={openNew} className={`${primaryBtn} mt-5`}><Plus className="h-4 w-4" /> Add image</button> : undefined} />
      ) : (
        <div className="space-y-5">
          {visible.map(g => (
            <CountryCard key={g.country} g={g} busy={busy} onUpload={upload} onApply={apply} onDelete={remove}
              onEditExtra={img => setDrawer({ draft: toDraft(img), locked: true, base: img })} />
          ))}
        </div>
      )}

      {loading && groups.length > 0 && (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500"><Spinner /> Refreshing…</p>
      )}

      <AnimatePresence>
        {drawer && (
          <LocationDrawer key="loc-drawer" state={drawer} countries={countries} citiesOf={citiesOf} findExisting={findExisting}
            onClose={() => setDrawer(null)}
            onSaved={async label => { setDrawer(null); notify(`${label} image saved`); await onChanged(); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationImagesPanel;
