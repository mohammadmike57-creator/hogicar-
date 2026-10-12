import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Archive from 'lucide-react/dist/esm/icons/archive';
import Filter from 'lucide-react/dist/esm/icons/filter';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import FilePen from 'lucide-react/dist/esm/icons/file-pen';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Folder from 'lucide-react/dist/esm/icons/folder';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import X from 'lucide-react/dist/esm/icons/x';
import Layout from 'lucide-react/dist/esm/icons/layout';
import Save from 'lucide-react/dist/esm/icons/save';
import { adminFetch } from '../../lib/adminApi';
import {
  Hero, heroButton, heroPrimary, Segmented, Drawer, Field, inputCls, useToast, Toast, ErrorBanner, Spinner, ago, num,
} from './commercialUi';
import {
  BlogArticle, BlogCategory, BlogLocationImage, CoverageRow, SeoConfig, Empty, SeoRing, StatusPill, Thumb,
  apiMessage, articlePlace, findInherited, ownPicture, placeName, plural, primaryBtn, secondaryBtn, slugify, statusOf, useConfirm,
} from './blog/blogShared';
import ArticleEditor from './blog/ArticleEditor';
import LocationImagesPanel from './blog/LocationImagesPanel';

type Tab = 'articles' | 'categories' | 'location-images';
type Filters = { category: string; country: string; route: string; status: string; featured: string; author: string };
type ArticleAction = 'publish' | 'unpublish' | 'archive' | 'duplicate';

const EMPTY_FILTERS: Filters = { category: '', country: '', route: '', status: '', featured: '', author: '' };

const ACTION_DONE: Record<ArticleAction | 'delete', string> = {
  publish: 'published', unpublish: 'unpublished', archive: 'archived', duplicate: 'duplicated', delete: 'deleted',
};

const newArticle = (categories: BlogCategory[]): Partial<BlogArticle> => ({
  published: false,
  status: 'DRAFT',
  category: categories[0] || null,
  secondaryRoutes: [],
  articleTags: [],
  relatedArticles: [],
  relatedAirports: [],
  readingTime: '1 min read',
  featuredOnHomepage: false,
  isFeatured: false,
  live: false,
});

/* ------------------------------------------------------------------ row menu */

const RowMenu: React.FC<{ a: BlogArticle; onAction: (a: BlogArticle, action: ArticleAction) => void; onDelete: (a: BlogArticle) => void }> = ({ a, onAction, onDelete }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  const item = 'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50';
  const run = (fn: () => void) => () => { setOpen(false); fn(); };
  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-label="More actions" aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
            <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" className={item} onClick={() => setOpen(false)}><ArrowUpRight className="h-4 w-4 text-slate-400" /> View on site</a>
            <button type="button" className={item} onClick={run(() => onAction(a, a.published ? 'unpublish' : 'publish'))}>
              {a.published ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}{a.published ? 'Unpublish' : 'Publish'}
            </button>
            <button type="button" className={item} onClick={run(() => onAction(a, 'duplicate'))}><Copy className="h-4 w-4 text-slate-400" /> Duplicate</button>
            {statusOf(a) !== 'ARCHIVED' && <button type="button" className={item} onClick={run(() => onAction(a, 'archive'))}><Archive className="h-4 w-4 text-slate-400" /> Archive</button>}
            <div className="my-1 border-t border-slate-100" />
            <button type="button" className={`${item} text-rose-600 hover:bg-rose-50`} onClick={run(() => onDelete(a))}><Trash2 className="h-4 w-4" /> Delete</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ------------------------------------------------------------------ article rows */

type RowProps = {
  a: BlogArticle;
  coverage: CoverageRow[];
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onAction: (a: BlogArticle, action: ArticleAction) => void;
  onDelete: (a: BlogArticle) => void;
};

const useRowData = (a: BlogArticle, coverage: CoverageRow[]) => {
  const place = articlePlace(a);
  const own = ownPicture(a);
  const inherited = own ? null : findInherited(coverage, place.country, place.city);
  return {
    place: place.country ? placeName(place.country, place.city) : '',
    src: own || inherited?.imageUrl || '',
    inherited,
    status: statusOf(a),
  };
};

// "live" turns on automatic links to the car rental pages; it is not about whether the article is public.
const Visibility: React.FC<{ a: BlogArticle }> = ({ a }) => {
  const bits = [a.featuredOnHomepage && 'On homepage', a.isFeatured && 'Featured', a.live && 'Auto links'].filter(Boolean) as string[];
  if (!bits.length) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <Globe className="h-3.5 w-3.5 text-[#007ac2]" />
      {bits.join(' · ')}
    </span>
  );
};

const InheritedBadge: React.FC<{ label: string }> = ({ label }) => (
  <span title={`No picture of its own, shows the ${label} location image`} className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm">
    <MapPin className="h-3 w-3" />
  </span>
);

const ROW_COLS = 'grid-cols-[20px_112px_minmax(0,1fr)_44px_130px_84px] xl:grid-cols-[20px_112px_minmax(0,1fr)_170px_44px_130px_84px] items-center gap-4';
const ROW_GRID = `grid ${ROW_COLS}`;

const ArticleRow: React.FC<RowProps> = ({ a, coverage, selected, busy, onSelect, onOpen, onAction, onDelete }) => {
  const d = useRowData(a, coverage);
  return (
    <div onClick={onOpen} className={`${ROW_GRID} group cursor-pointer border-t border-slate-100 px-5 py-3.5 transition ${selected ? 'bg-sky-50/70' : 'hover:bg-slate-50/80'}`}>
      <input type="checkbox" aria-label={`Select ${a.title}`} checked={selected} onChange={onSelect} onClick={e => e.stopPropagation()}
        className="h-4 w-4 rounded border-slate-300 text-[#007ac2] focus:ring-[#007ac2]" />
      <Thumb src={d.src} alt={a.imageAltText || a.title} className="aspect-[16/10] w-full rounded-lg ring-1 ring-slate-200">
        {d.inherited && <InheritedBadge label={d.inherited.label} />}
      </Thumb>
      <div className="min-w-0">
        <p className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-[#00649f]" title={a.title}>{a.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {d.place && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{d.place}</span>}
          {d.place && <span className="text-slate-300">•</span>}
          <span>{a.category?.name || 'Uncategorised'}</span>
          <span className="text-slate-300">•</span>
          <span>{a.readingTime || '1 min read'}</span>
          <span className="text-slate-300">•</span>
          <span>{a.authorName || 'Hogicar'}</span>
        </p>
      </div>
      <div className="hidden min-w-0 xl:block">
        {a.primaryRoute ? (
          <>
            <p className="truncate text-sm text-slate-700" title={a.primaryRoute.route}>{a.primaryRoute.destinationName || a.primaryRoute.route}</p>
            {a.secondaryRoutes?.length > 0 && <p className="truncate text-xs text-slate-400" title={a.secondaryRoutes.map(r => r.route).join(', ')}>+{a.secondaryRoutes.length} related</p>}
          </>
        ) : <span className="text-xs text-slate-400">No route</span>}
      </div>
      <SeoRing score={a.seoScore || 0} />
      <div className="min-w-0 space-y-1">
        <StatusPill status={d.status} />
        <Visibility a={a} />
        <p className="text-[11px] text-slate-400">Updated {ago(a.updatedAt)}</p>
      </div>
      <div className="flex items-center justify-end gap-0.5" onClick={e => e.stopPropagation()}>
        {busy ? <span className="flex h-9 w-9 items-center justify-center"><Spinner /></span> : (
          <button type="button" onClick={onOpen} aria-label="Edit" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
        )}
        <RowMenu a={a} onAction={onAction} onDelete={onDelete} />
      </div>
    </div>
  );
};

const ArticleCard: React.FC<RowProps> = ({ a, coverage, selected, busy, onSelect, onOpen, onAction, onDelete }) => {
  const d = useRowData(a, coverage);
  return (
    <div onClick={onOpen} className={`cursor-pointer rounded-2xl bg-white p-3 shadow-sm ring-1 transition active:bg-slate-50 ${selected ? 'ring-2 ring-[#007ac2]' : 'ring-slate-200'}`}>
      <div className="flex gap-3">
        <Thumb src={d.src} alt={a.imageAltText || a.title} className="aspect-[16/10] w-28 shrink-0 self-start rounded-lg ring-1 ring-slate-200">
          {d.inherited && <InheritedBadge label={d.inherited.label} />}
          <span className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 shadow-sm" onClick={e => e.stopPropagation()}>
            <input type="checkbox" aria-label={`Select ${a.title}`} checked={selected} onChange={onSelect} className="h-4 w-4 rounded border-slate-300 text-[#007ac2] focus:ring-[#007ac2]" />
          </span>
        </Thumb>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">{a.title}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{[d.place, a.category?.name || 'Uncategorised'].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
        <StatusPill status={d.status} />
        <SeoRing score={a.seoScore || 0} size={30} />
        <span className="min-w-0 flex-1 truncate text-xs text-slate-400">{ago(a.updatedAt)}</span>
        {busy && <Spinner />}
        <RowMenu a={a} onAction={onAction} onDelete={onDelete} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ pagination */

const pageList = (page: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const out: (number | '…')[] = [0];
  const from = Math.max(1, page - 1);
  const to = Math.min(total - 2, page + 1);
  if (from > 1) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 2) out.push('…');
  out.push(total - 1);
  return out;
};

const Pagination: React.FC<{ page: number; totalPages: number; totalElements: number; pageSize: number; onPage: (p: number) => void; onSize: (n: number) => void }> = ({ page, totalPages, totalElements, pageSize, onPage, onSize }) => (
  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <span>{totalElements === 0 ? 'No articles' : <>Showing <span className="font-medium text-slate-900">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}</span> of <span className="font-medium text-slate-900">{num(totalElements)}</span></>}</span>
      <select aria-label="Articles per page" value={pageSize} onChange={e => onSize(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-[#007ac2]">
        {[10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
      </select>
    </div>
    {totalPages > 1 && (
      <div className="flex items-center gap-1">
        <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        {pageList(page, totalPages).map((p, i) => p === '…'
          ? <span key={`e${i}`} className="w-6 text-center text-sm text-slate-400">…</span>
          : <button key={p} type="button" onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined}
              className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold tabular-nums transition ${p === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{p + 1}</button>)}
        <button type="button" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ category drawer */

const CategoryDrawer: React.FC<{ initial: Partial<BlogCategory>; onClose: () => void; onSaved: (name: string) => void }> = ({ initial, onClose, onSaved }) => {
  const [c, setC] = React.useState<Partial<BlogCategory>>(initial);
  const [slugTouched, setSlugTouched] = React.useState(!!initial.slug);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await adminFetch('/api/admin/blog/categories', { method: 'POST', body: JSON.stringify(c) });
      onSaved(c.name || 'Category');
    } catch (err) {
      setError(apiMessage(err, 'Failed to save category.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer eyebrow={c.id ? 'Edit category' : 'New category'} title={c.name?.trim() || 'Untitled category'} onClose={onClose} busy={busy} width="max-w-[520px]"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={`${secondaryBtn} flex-1 sm:flex-none`}>Cancel</button>
          <button type="submit" form="category-form" disabled={busy} className={`${primaryBtn} flex-[2] sm:ml-auto sm:flex-none`}>{busy ? <Spinner light /> : <Save className="h-4 w-4" />} Save category</button>
        </div>
      }>
      <form id="category-form" onSubmit={save} className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <Field label="Name">
          <input required autoFocus className={inputCls} value={c.name || ''} placeholder="Travel tips"
            onChange={e => setC({ ...c, name: e.target.value, ...(!slugTouched ? { slug: slugify(e.target.value) } : {}) })} />
        </Field>
        <Field label="Slug" hint="Used in the category address.">
          <input required className={`${inputCls} font-mono`} value={c.slug || ''} onChange={e => { setSlugTouched(true); setC({ ...c, slug: e.target.value }); }} />
        </Field>
        <Field label="Description">
          <textarea className={`${inputCls} h-28 resize-none py-2.5`} value={c.description || ''} onChange={e => setC({ ...c, description: e.target.value })} />
        </Field>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </form>
    </Drawer>
  );
};

/* ------------------------------------------------------------------ page */

const BlogManagement: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('articles');
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  const [categories, setCategories] = React.useState<BlogCategory[]>([]);
  const [locationImages, setLocationImages] = React.useState<BlogLocationImage[]>([]);
  const [usedLocations, setUsedLocations] = React.useState<{ countryTag: string; cityTag: string | null }[]>([]);
  const [coverage, setCoverage] = React.useState<CoverageRow[]>([]);
  const [availableRoutes, setAvailableRoutes] = React.useState<SeoConfig[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [metaLoading, setMetaLoading] = React.useState(true);
  const [locLoading, setLocLoading] = React.useState(true);
  const [locError, setLocError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<{ total: number | null; published: number | null; drafts: number | null; scheduled: number | null; archived: number | null }>({ total: null, published: null, drafts: null, scheduled: null, archived: null });

  const [editingArticle, setEditingArticle] = React.useState<Partial<BlogArticle> | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Partial<BlogCategory> | null>(null);
  const [addImageSignal, setAddImageSignal] = React.useState(0);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedArticles, setSelectedArticles] = React.useState<number[]>([]);
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = React.useState(false);
  const [busyIds, setBusyIds] = React.useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const { toast, notify } = useToast();
  const { ask, dialog } = useConfirm();

  /* ---------------------------------------------------------------- loading */

  React.useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedSearch(searchTerm.trim()); }, 300);
    return () => window.clearTimeout(t);
  }, [searchTerm]);
  React.useEffect(() => { setPage(0); }, [debouncedSearch]);

  const loadArticles = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', pageSize.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.country) params.append('country', filters.country);
      if (filters.route) params.append('route', filters.route);
      if (filters.status) params.append('status', filters.status);
      if (filters.featured) params.append('featured', filters.featured);
      if (filters.author) params.append('author', filters.author);
      if (debouncedSearch) params.append('search', debouncedSearch);
      const res = await adminFetch(`/api/admin/blog/articles?${params.toString()}`);
      setArticles(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      setLoadError(apiMessage(error, 'Could not load articles.'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, debouncedSearch]);

  const loadStats = React.useCallback(async () => {
    const count = async (status?: string) => {
      const res = await adminFetch(`/api/admin/blog/articles?page=0&size=1${status ? `&status=${status}` : ''}`);
      return Number(res?.totalElements ?? 0);
    };
    const [total, published, drafts, scheduled, archived] = await Promise.allSettled([count(), count('PUBLISHED'), count('DRAFT'), count('SCHEDULED'), count('ARCHIVED')]);
    const v = (r: PromiseSettledResult<number>) => (r.status === 'fulfilled' ? r.value : null);
    setStats({ total: v(total), published: v(published), drafts: v(drafts), scheduled: v(scheduled), archived: v(archived) });
  }, []);

  const loadMeta = React.useCallback(async () => {
    setMetaLoading(true);
    try {
      // Categories are needed for article editing, routes for connections and filters
      const [catRes, routeRes] = await Promise.all([adminFetch('/api/admin/blog/categories'), adminFetch('/api/admin/blog/routes')]);
      setCategories(catRes || []);
      setAvailableRoutes(routeRes || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadLocations = React.useCallback(async () => {
    setLocLoading(true);
    setLocError(null);
    try {
      const [imgs, cov, used] = await Promise.allSettled([
        adminFetch('/api/admin/blog/location-images'),
        adminFetch('/api/admin/blog/location-images/coverage'),
        adminFetch('/api/admin/blog/used-locations'),
      ]);
      if (imgs.status === 'fulfilled') setLocationImages(Array.isArray(imgs.value) ? imgs.value : []);
      else setLocError(apiMessage(imgs.reason, 'Could not load location images.'));
      if (cov.status === 'fulfilled') setCoverage(Array.isArray(cov.value) ? cov.value : []);
      else console.error('Failed to fetch location coverage', cov.reason);
      if (used.status === 'fulfilled') setUsedLocations(Array.isArray(used.value) ? used.value : []);
      else console.error('Failed to fetch used locations', used.reason);
    } finally {
      setLocLoading(false);
    }
  }, []);

  React.useEffect(() => { loadArticles(); }, [loadArticles]);
  React.useEffect(() => { loadStats(); loadMeta(); loadLocations(); }, [loadStats, loadMeta, loadLocations]);
  const firstTab = React.useRef(true);
  React.useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    if (activeTab === 'location-images') loadLocations();
    if (activeTab === 'categories') loadMeta();
  }, [activeTab, loadLocations, loadMeta]);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([loadArticles(), loadStats(), loadLocations()]);
  }, [loadArticles, loadStats, loadLocations]);

  /* ---------------------------------------------------------------- derived */

  const filteredArticles = React.useMemo(() => {
    const q = searchTerm.toLowerCase();
    return articles.filter(article => {
      const matchSearch = (article.title || '').toLowerCase().includes(q) || (article.slug || '').toLowerCase().includes(q);
      const matchCategory = !filters.category || article.category?.id === Number(filters.category);
      const matchCountry = !filters.country || article.country === filters.country;
      const matchRoute = !filters.route || article.primaryRoute?.id === Number(filters.route);
      const matchStatus = !filters.status || article.status === filters.status;
      const matchFeatured = !filters.featured || (filters.featured === 'true' ? article.featuredOnHomepage : !article.featuredOnHomepage);
      const matchAuthor = !filters.author || article.authorName === filters.author;
      return matchSearch && matchCategory && matchCountry && matchRoute && matchStatus && matchFeatured && matchAuthor;
    });
  }, [articles, searchTerm, filters]);

  const avgSeo = articles.length ? Math.round(articles.reduce((n, a) => n + Number(a.seoScore || 0), 0) / articles.length) : null;
  const extraFilterCount = (['category', 'country', 'route', 'featured', 'author'] as const).filter(k => filters[k]).length;
  const allSelected = filteredArticles.length > 0 && filteredArticles.every(a => selectedArticles.includes(a.id));

  const updateFilters = (p: Partial<Filters>) => { setFilters(f => ({ ...f, ...p })); setPage(0); setSelectedArticles([]); };

  /* ---------------------------------------------------------------- actions */

  const toggleSelectAll = () => setSelectedArticles(allSelected ? [] : filteredArticles.map(a => a.id));

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    if (selectedArticles.length === 0) return;
    const n = selectedArticles.length;
    if (action === 'delete' && !(await ask({ title: `Delete ${plural(n, 'article')}?`, body: 'They are removed from the site and cannot be restored.', confirmLabel: `Delete ${plural(n, 'article')}` }))) return;
    setBulkBusy(true);
    try {
      for (const id of selectedArticles) {
        if (action === 'delete') await adminFetch(`/api/admin/blog/articles/${id}`, { method: 'DELETE' });
        else await adminFetch(`/api/admin/blog/articles/${id}/${action}`, { method: 'POST' });
      }
      setSelectedArticles([]);
      notify(`${plural(n, 'article')} ${ACTION_DONE[action]}`);
    } catch {
      notify(`Bulk ${action} failed`, 'err');
    } finally {
      setBulkBusy(false);
      refreshAll();
    }
  };

  const handleArticleAction = async (a: BlogArticle, action: ArticleAction) => {
    setBusyIds(ids => [...ids, a.id]);
    try {
      await adminFetch(`/api/admin/blog/articles/${a.id}/${action}`, { method: 'POST' });
      notify(`Article ${ACTION_DONE[action]}`);
      refreshAll();
    } catch {
      notify(`Failed to ${action} article`, 'err');
    } finally {
      setBusyIds(ids => ids.filter(x => x !== a.id));
    }
  };

  const handleDeleteArticle = async (a: BlogArticle) => {
    if (!(await ask({ title: 'Delete this article?', body: <>“{a.title}” is removed from the site and cannot be restored.</>, confirmLabel: 'Delete article' }))) return;
    setBusyIds(ids => [...ids, a.id]);
    try {
      await adminFetch(`/api/admin/blog/articles/${a.id}`, { method: 'DELETE' });
      setSelectedArticles(s => s.filter(x => x !== a.id));
      notify('Article deleted');
      refreshAll();
    } catch {
      notify('Failed to delete article', 'err');
    } finally {
      setBusyIds(ids => ids.filter(x => x !== a.id));
    }
  };

  const handlePurgeArticles = async () => {
    const ok = await ask({
      title: 'Delete every blog article?',
      body: <>This removes all {stats.total != null ? num(stats.total) : ''} articles from the site. It cannot be undone.</>,
      confirmLabel: 'Delete all articles',
      typeToConfirm: 'DELETE',
    });
    if (!ok) return;
    try {
      await adminFetch('/api/admin/blog/articles/purge', { method: 'DELETE' });
      setSelectedArticles([]);
      notify('All articles deleted');
      refreshAll();
    } catch {
      notify('Failed to purge articles', 'err');
    }
  };

  const handleDeleteCategory = async (c: BlogCategory) => {
    if (!(await ask({ title: `Delete “${c.name}”?`, body: 'Articles in this category become uncategorised.', confirmLabel: 'Delete category' }))) return;
    try {
      await adminFetch(`/api/admin/blog/categories/${c.id}`, { method: 'DELETE' });
      notify('Category deleted');
      loadMeta();
    } catch {
      notify('Failed to delete category', 'err');
    }
  };

  const closeEditor = React.useCallback(() => setEditingArticle(null), []);
  const closeCategory = React.useCallback(() => setEditingCategory(null), []);

  /* ---------------------------------------------------------------- render */

  const heroActions = (
    <>
      <button type="button" onClick={() => { refreshAll(); loadMeta(); }} className={heroButton} aria-label="Refresh">
        <RefreshCw className={`h-4 w-4 ${loading || locLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span>
      </button>
      {activeTab === 'articles' && <button type="button" onClick={() => setEditingArticle(newArticle(categories))} className={heroPrimary}><Plus className="h-4 w-4" /> New article</button>}
      {activeTab === 'categories' && <button type="button" onClick={() => setEditingCategory({})} className={heroPrimary}><Plus className="h-4 w-4" /> New category</button>}
      {activeTab === 'location-images' && <button type="button" onClick={() => setAddImageSignal(n => n + 1)} className={heroPrimary}><Plus className="h-4 w-4" /> Add image</button>}
    </>
  );

  const draftsAndScheduled = stats.drafts != null || stats.scheduled != null ? (stats.drafts || 0) + (stats.scheduled || 0) : null;

  return (
    <div className="space-y-5">
      <Hero eyebrow="Content" eyebrowIcon={Newspaper} title="Blog"
        subtitle="Travel guides and route articles that bring visitors to Hogicar. Write, schedule and keep every article looking its best."
        loading={stats.total == null && loading}
        actions={heroActions}
        kpis={[
          { label: 'Total articles', value: num(stats.total ?? totalElements), Icon: Newspaper, note: metaLoading ? undefined : plural(categories.length, 'category', 'categories') },
          { label: 'Published', value: stats.published != null ? num(stats.published) : '—', Icon: Globe, note: stats.archived ? `${num(stats.archived)} archived` : undefined },
          { label: 'Drafts & scheduled', value: draftsAndScheduled != null ? num(draftsAndScheduled) : '—', Icon: FilePen, note: draftsAndScheduled != null ? `${num(stats.drafts || 0)} drafts · ${num(stats.scheduled || 0)} scheduled` : undefined },
          { label: 'Average SEO score', value: avgSeo != null ? `${avgSeo}/100` : '—', Icon: Gauge, note: articles.length ? (articles.length >= totalElements ? 'Across all articles' : `Across the ${articles.length} shown`) : undefined },
        ]} />

      <Segmented layoutId="blog-tab" value={activeTab} onChange={setActiveTab} items={[
        { key: 'articles', label: 'Articles', count: stats.total ?? totalElements },
        { key: 'categories', label: 'Categories', count: categories.length },
        { key: 'location-images', label: 'Location images', count: locationImages.length },
      ]} />

      {/* ============================================================ Articles */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="-mx-1 overflow-x-auto px-1">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {[['', 'All'], ['PUBLISHED', 'Published'], ['DRAFT', 'Drafts'], ['SCHEDULED', 'Scheduled'], ['ARCHIVED', 'Archived']].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => updateFilters({ status: k })}
                    className={`h-9 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition ${filters.status === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <label className="relative block min-w-0 flex-1 xl:w-80">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by title or slug"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base shadow-sm outline-none focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm" />
              </label>
              <button type="button" onClick={() => setShowFilters(s => !s)} aria-expanded={showFilters}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold shadow-sm ring-1 ring-inset transition ${showFilters || extraFilterCount ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>
                <Filter className="h-4 w-4" /><span className="hidden sm:inline">Filters</span>
                {extraFilterCount > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[11px]">{extraFilterCount}</span>}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5">
                  <Field label="Category">
                    <select className={inputCls} value={filters.category} onChange={e => updateFilters({ category: e.target.value })}>
                      <option value="">All categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Country"><input className={inputCls} placeholder="Any country" value={filters.country} onChange={e => updateFilters({ country: e.target.value })} /></Field>
                  <Field label="Route">
                    <select className={inputCls} value={filters.route} onChange={e => updateFilters({ route: e.target.value })}>
                      <option value="">All routes</option>
                      {availableRoutes.map(r => <option key={r.id} value={r.id}>{r.destinationName || r.route}</option>)}
                    </select>
                  </Field>
                  <Field label="Homepage">
                    <select className={inputCls} value={filters.featured} onChange={e => updateFilters({ featured: e.target.value })}>
                      <option value="">Any</option>
                      <option value="true">Featured on homepage</option>
                      <option value="false">Not on homepage</option>
                    </select>
                  </Field>
                  <Field label="Author"><input className={inputCls} placeholder="Any author" value={filters.author} onChange={e => updateFilters({ author: e.target.value })} /></Field>
                  {extraFilterCount > 0 && (
                    <button type="button" onClick={() => updateFilters({ category: '', country: '', route: '', featured: '', author: '' })}
                      className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-[#007ac2] hover:underline sm:col-span-2 lg:col-span-5"><X className="h-4 w-4" /> Clear filters</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadError && <ErrorBanner text={loadError} onRetry={loadArticles} />}

          <AnimatePresence>
            {selectedArticles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900 p-2 pl-4 text-white shadow-lg">
                <span className="mr-auto text-sm font-semibold">{plural(selectedArticles.length, 'article')} selected</span>
                {bulkBusy && <Spinner light />}
                {([['publish', Eye, 'Publish'], ['unpublish', EyeOff, 'Unpublish'], ['archive', Archive, 'Archive']] as const).map(([k, Icon, label]) => (
                  <button key={k} type="button" disabled={bulkBusy} onClick={() => handleBulkAction(k)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"><Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span></button>
                ))}
                <button type="button" disabled={bulkBusy} onClick={() => handleBulkAction('delete')} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete</span></button>
                <button type="button" onClick={() => setSelectedArticles([])} aria-label="Clear selection" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"><X className="h-4 w-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && articles.length === 0 ? (
            <div className="space-y-2">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
          ) : filteredArticles.length === 0 && !loadError ? (
            <Empty icon={Newspaper}
              title={stats.total === 0 && !debouncedSearch && !filters.status && !extraFilterCount ? 'No articles yet' : 'No articles match'}
              text={stats.total === 0 && !debouncedSearch ? 'Write your first travel guide. It will show up on the blog and on the routes you link it to.' : 'Try another search, status or filter.'}
              action={<button type="button" onClick={() => setEditingArticle(newArticle(categories))} className={`${primaryBtn} mt-5`}><Plus className="h-4 w-4" /> New article</button>} />
          ) : (
            <div className={`rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <div className={`${ROW_COLS} hidden rounded-t-3xl px-5 py-3 text-xs font-medium text-slate-500 md:grid`}>
                <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-[#007ac2] focus:ring-[#007ac2]" />
                <span>Image</span>
                <span>Article</span>
                <span className="hidden xl:block">Route</span>
                <span>SEO</span>
                <span>Status</span>
                <span />
              </div>
              <div className="hidden md:block">
                {filteredArticles.map(a => (
                  <ArticleRow key={a.id} a={a} coverage={coverage} selected={selectedArticles.includes(a.id)} busy={busyIds.includes(a.id)}
                    onSelect={() => setSelectedArticles(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                    onOpen={() => setEditingArticle(a)} onAction={handleArticleAction} onDelete={handleDeleteArticle} />
                ))}
              </div>
              <div className="space-y-3 p-3 md:hidden">
                <label className="flex items-center gap-2 px-1 text-sm text-slate-600">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-[#007ac2] focus:ring-[#007ac2]" /> Select all on this page
                </label>
                {filteredArticles.map(a => (
                  <ArticleCard key={a.id} a={a} coverage={coverage} selected={selectedArticles.includes(a.id)} busy={busyIds.includes(a.id)}
                    onSelect={() => setSelectedArticles(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                    onOpen={() => setEditingArticle(a)} onAction={handleArticleAction} onDelete={handleDeleteArticle} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={pageSize}
                onPage={p => { setPage(p); setSelectedArticles([]); }} onSize={n => { setPageSize(n); setPage(0); }} />
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Layout className="mt-0.5 h-4 w-4 shrink-0 text-[#007ac2]" />
              <p>Articles without their own picture show their country or city image. <button type="button" onClick={() => setActiveTab('location-images')} className="font-semibold text-[#007ac2] hover:underline">Manage location images</button></p>
            </div>
            <button type="button" onClick={handlePurgeArticles} className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg px-3 text-sm font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 sm:self-auto">
              <Trash2 className="h-4 w-4" /> Delete all articles
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ Categories */}
      {activeTab === 'categories' && (
        metaLoading && categories.length === 0 ? (
          <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
        ) : categories.length === 0 ? (
          <Empty icon={Folder} title="No categories yet" text="Group articles by theme, like Travel tips or Road trips."
            action={<button type="button" onClick={() => setEditingCategory({})} className={`${primaryBtn} mt-5`}><Plus className="h-4 w-4" /> New category</button>} />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007ac2]/10 text-[#007ac2]"><Folder className="h-4 w-4" /></span>
                <button type="button" onClick={() => setEditingCategory(cat)} className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-slate-900">{cat.name}</span>
                    <span className="font-mono text-xs text-slate-400">/{cat.slug}</span>
                  </span>
                  {cat.description && <span className="mt-0.5 line-clamp-1 block text-sm text-slate-500">{cat.description}</span>}
                </button>
                <button type="button" onClick={() => setEditingCategory(cat)} aria-label={`Edit ${cat.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => handleDeleteCategory(cat)} aria-label={`Delete ${cat.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )
      )}

      {/* ============================================================ Location images */}
      {activeTab === 'location-images' && (
        <LocationImagesPanel images={locationImages} coverage={coverage} usedLocations={usedLocations} loading={locLoading} error={locError}
          addSignal={addImageSignal} onReload={loadLocations} notify={notify} ask={ask}
          onChanged={async () => { await Promise.all([loadLocations(), loadArticles()]); }} />
      )}

      <AnimatePresence>
        {editingArticle && (
          <ArticleEditor key={`article-${editingArticle.id ?? 'new'}`} initial={editingArticle} categories={categories} articles={articles}
            routes={availableRoutes} coverage={coverage} notify={notify} ask={ask}
            onClose={closeEditor}
            onChanged={() => { loadArticles(); loadStats(); }}
            onSaved={() => { setEditingArticle(null); notify('Article saved'); refreshAll(); }} />
        )}
        {editingCategory && (
          <CategoryDrawer key={`cat-${editingCategory.id ?? 'new'}`} initial={editingCategory} onClose={closeCategory}
            onSaved={name => { setEditingCategory(null); notify(`${name} saved`); loadMeta(); }} />
        )}
      </AnimatePresence>
      {dialog}
      <Toast toast={toast} />
    </div>
  );
};

export default BlogManagement;
