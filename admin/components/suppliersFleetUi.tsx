import * as React from 'react';
import Building from 'lucide-react/dist/esm/icons/building-2';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Key from 'lucide-react/dist/esm/icons/key-round';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash from 'lucide-react/dist/esm/icons/trash-2';
import Rss from 'lucide-react/dist/esm/icons/rss';
import Star from 'lucide-react/dist/esm/icons/star';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Cog from 'lucide-react/dist/esm/icons/settings-2';
import Snowflake from 'lucide-react/dist/esm/icons/snowflake';
import Tag from 'lucide-react/dist/esm/icons/tag';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import List from 'lucide-react/dist/esm/icons/list';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Copy from 'lucide-react/dist/esm/icons/copy';
import { API_BASE_URL } from '../../lib/config';
import { Hero, heroButton, heroPrimary, Segmented, num } from './commercialUi';

/** Admin uploads are stored as "/uploads/..." on the API server; everything else is a full URL. */
export const imgSrc = (url?: string | null) => {
  if (!url || typeof url !== 'string') return '';
  return url.startsWith('/') && !url.startsWith('//') ? `${API_BASE_URL}${url}` : url;
};

const TONES = ['bg-sky-100 text-sky-800', 'bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-800', 'bg-rose-100 text-rose-800', 'bg-teal-100 text-teal-800'];
const initials = (name?: string) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const toneOf = (name?: string) => TONES[[...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

/** Supplier logo on a white tile; the supplier's initials when there is no logo or it doesn't load. */
export const SupplierLogo: React.FC<{ url?: string | null; name?: string; size?: 'sm' | 'md' | 'lg' }> = ({ url, name, size = 'md' }) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [url]);
  const box = size === 'lg' ? 'h-16 w-16 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-12 w-12 rounded-xl';
  const src = imgSrc(url);
  if (!src || failed) {
    return <span className={`${box} ${toneOf(name)} flex shrink-0 items-center justify-center font-semibold ${size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-lg' : 'text-sm'}`} aria-hidden>{initials(name)}</span>;
  }
  return (
    <span className={`${box} flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-slate-200 ${size === 'sm' ? 'p-1' : 'p-1.5'}`}>
      <img src={src} alt={name ? `${name} logo` : 'Logo'} className="max-h-full max-w-full object-contain" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
};

/** Car picture on a light background; a car icon when there is none. */
export const CarPicture: React.FC<{ url?: string | null; alt: string; className?: string }> = ({ url, alt, className = '' }) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [url]);
  const src = imgSrc(url);
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 ${className}`}>
      {src && !failed
        ? <img src={src} alt={alt} className="h-full w-full object-contain p-2 mix-blend-multiply" loading="lazy" onError={() => setFailed(true)} />
        : <CarIcon className="h-1/3 w-1/3 text-slate-300" aria-hidden />}
    </div>
  );
};

const Pill: React.FC<{ tone: 'green' | 'slate' | 'amber' | 'blue' | 'red'; children: React.ReactNode }> = ({ tone, children }) => {
  const c = { green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', slate: 'bg-slate-100 text-slate-600 ring-slate-500/20', amber: 'bg-amber-50 text-amber-800 ring-amber-600/20', blue: 'bg-sky-50 text-sky-800 ring-sky-600/20', red: 'bg-rose-50 text-rose-700 ring-rose-600/20' }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${c}`}>{children}</span>;
};

const iconBtn = 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900';
const searchCls = 'h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm';

const Empty: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; text: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><Icon className="h-6 w-6 text-slate-400" /></span>
    <p className="mt-3 text-base font-semibold text-slate-900">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ==================== Suppliers ====================

type SupplierFilter = 'all' | 'visible' | 'hidden' | 'inactive';

export const SuppliersBoard: React.FC<{
  suppliers: any[];
  bookings: any[];
  fetchError?: boolean;
  onEdit: (s: any) => void;
  onManageApi: (s: any) => void;
  onManageFleet: (s: any) => void;
  onAddSupplier: () => void;
  onRefresh: () => void;
  onDelete: (id: any) => void;
  onFixData: () => void;
  onToggleVisibility: (s: any) => void;
  revealedPasswords: Set<string>;
  onCopy: (text: string, key: string, label: string) => void;
}> = ({ suppliers, bookings, fetchError, onEdit, onManageApi, onManageFleet, onAddSupplier, onRefresh, onDelete, onFixData, onToggleVisibility, revealedPasswords, onCopy }) => {
  const list = Array.isArray(suppliers) ? suppliers : [];
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<SupplierFilter>('all');

  const bookingsBySupplier = React.useMemo(() => {
    const m = new Map<string, number>();
    (Array.isArray(bookings) ? bookings : []).forEach(b => {
      const k = String(b.supplierName || '').toLowerCase();
      if (k) m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [bookings]);

  const counts = {
    all: list.length,
    visible: list.filter(s => s.visible).length,
    hidden: list.filter(s => !s.visible).length,
    inactive: list.filter(s => !s.active).length,
  };
  const cars = list.reduce((a, s) => a + (Number(s.carCount) || 0), 0);
  const rated = list.filter(s => Number(s.rating) > 0);
  const avgRating = rated.length ? rated.reduce((a, s) => a + Number(s.rating), 0) / rated.length : 0;

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter(s => filter === 'all' ? true : filter === 'visible' ? s.visible : filter === 'hidden' ? !s.visible : !s.active)
      .filter(s => !q || [s.name, s.email, s.contactEmail, s.phone, ...(Array.isArray(s.locations) ? s.locations.flatMap((l: any) => [l.locationCode, l.displayName]) : [])]
        .some(v => v && String(v).toLowerCase().includes(q)))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [list, query, filter]);

  return (
    <div className="space-y-5">
      <Hero eyebrow="Operations" eyebrowIcon={Building} title="Suppliers"
        subtitle="Your direct rental partners: who is live on Hogicar, their fleets, logins and contact details."
        actions={<>
          <button onClick={onFixData} className={heroButton} title="Repair supplier data"><ShieldCheck className="h-4 w-4" /> Repair data</button>
          <button onClick={onRefresh} className={heroButton} aria-label="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={onAddSupplier} className={heroPrimary}><Plus className="h-4 w-4" /> Add supplier</button>
        </>}
        kpis={[
          { label: 'Suppliers', value: num(counts.all), Icon: Building, note: `${num(list.filter(s => s.active).length)} active` },
          { label: 'Live on the site', value: num(counts.visible), Icon: Eye, note: counts.hidden ? `${counts.hidden} hidden` : 'All visible' },
          { label: 'Cars listed', value: num(cars), Icon: CarIcon },
          { label: 'Average rating', value: avgRating ? avgRating.toFixed(1) : '—', Icon: Star, note: rated.length ? `${rated.length} rated` : 'No ratings yet' },
        ]} />

      {fetchError && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> Supplier data couldn't be refreshed right now. Showing the last saved list.
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented layoutId="sup-filter" value={filter} onChange={setFilter} items={[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'visible', label: 'Live', count: counts.visible },
          { key: 'hidden', label: 'Hidden', count: counts.hidden },
          { key: 'inactive', label: 'Inactive', count: counts.inactive, dot: counts.inactive > 0 },
        ]} />
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or location" className={searchCls} aria-label="Search suppliers" />
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty icon={Building} title={list.length ? 'No suppliers match' : 'No suppliers yet'}
          text={list.length ? 'Try another search or filter.' : 'Add your first rental partner to start listing their cars.'}
          action={!list.length && <button onClick={onAddSupplier} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add supplier</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map(s => {
            const locs: any[] = Array.isArray(s.locations) ? s.locations : [];
            const key = `table-${s.id}`;
            const revealed = revealedPasswords?.has(key);
            const booked = bookingsBySupplier.get(String(s.name || '').toLowerCase()) || 0;
            return (
              <article key={s.id} className="flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300">
                <div className="flex items-start gap-4 p-5">
                  <SupplierLogo url={s.logoUrl || s.logo} name={s.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900" title={s.name}>{s.name}</h3>
                      {Number(s.rating) > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0b2545] px-1.5 py-0.5 text-xs font-semibold text-white" title={`${s.ratingReviewCount || 0} reviews`}>
                          {Number(s.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.active ? <Pill tone="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</Pill> : <Pill tone="red">Inactive</Pill>}
                      {s.visible ? <Pill tone="blue"><Eye className="h-3 w-3" />Live on site</Pill> : <Pill tone="slate"><EyeOff className="h-3 w-3" />Hidden</Pill>}
                      <Pill tone="slate">{String(s.connectionType || '').toLowerCase() === 'api' ? 'API connection' : 'Manual rates'}</Pill>
                      {s.hogicarChoice && <Pill tone="amber"><Sparkles className="h-3 w-3" />Hogicar choice</Pill>}
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-3 border-y border-slate-100 text-center">
                  {[['Cars', s.carCount ?? 0], ['Bookings', booked], ['Locations', locs.length]].map(([label, value]) => (
                    <div key={label as string} className="py-3 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-slate-100">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{num(Number(value))}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex-1 space-y-2.5 p-5 text-sm">
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    {locs.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {locs.slice(0, 4).map((l: any) => (
                          <span key={l.id || l.locationCode} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700" title={l.displayName}>
                            <b className="font-semibold">{l.locationCode}</b>{l.displayName ? ` · ${l.displayName}` : ''}
                          </span>
                        ))}
                        {locs.length > 4 && <span className="text-xs text-slate-500">+{locs.length - 4} more</span>}
                      </div>
                    ) : <span className="text-slate-400">No pick-up locations yet</span>}
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate" title="Reservations email">{s.contactEmail || s.email || '—'}</span>
                  </div>
                  {s.phone && <div className="flex items-center gap-2.5 text-slate-600"><Phone className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{s.phone}</span></div>}
                  <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                    <Key className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate" title="Login">{s.email || '—'}</span>
                    <button onClick={() => onCopy(s.password, key, 'Password')} className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-slate-700 hover:bg-white hover:text-[#007ac2]" title="Show and copy the password">
                      {revealed ? (s.password || 'Not set') : '••••••••'}
                      {revealed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 p-3">
                  <button onClick={() => onManageFleet(s)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800">
                    <CarIcon className="h-4 w-4" /> Fleet & rates
                  </button>
                  <button onClick={() => onEdit(s)} className={iconBtn} title="Edit supplier" aria-label="Edit supplier"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onManageApi(s)} className={iconBtn} title="API connection" aria-label="API connection"><Rss className="h-4 w-4" /></button>
                  <button onClick={() => onToggleVisibility(s)} className={iconBtn} title={s.visible ? 'Hide from the site' : 'Show on the site'} aria-label={s.visible ? 'Hide from the site' : 'Show on the site'}>
                    {s.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                  </button>
                  <button onClick={() => onDelete(s.id)} className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} title="Delete supplier" aria-label="Delete supplier"><Trash className="h-4 w-4" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== Fleet ====================

const carTitle = (c: any) => c.name || [c.make, c.model].filter(Boolean).join(' ') || 'Car';
const ACRONYMS = new Set(['SUV', 'MPV', '4X4', 'EV', 'VIP']);
const titleCase = (v?: string) => (v || '').toLowerCase().replace(/_/g, ' ').replace(/\S+/g, w => ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1));

export const FleetBoard: React.FC<{
  cars: any[];
  loading?: boolean;
  onRefresh: () => void;
  onPricing: (car: any) => void;
}> = ({ cars, loading, onRefresh, onPricing }) => {
  const list = Array.isArray(cars) ? cars : [];
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [view, setView] = React.useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('admin.fleet.view') as any) || 'grid'; } catch { return 'grid'; }
  });
  React.useEffect(() => { try { localStorage.setItem('admin.fleet.view', view); } catch { /* storage blocked */ } }, [view]);

  const categories = React.useMemo(() => {
    const m = new Map<string, number>();
    list.forEach(c => { const k = String(c.category || 'Other').toUpperCase(); m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [list]);

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter(c => category === 'all' || String(c.category || 'Other').toUpperCase() === category)
      .filter(c => !q || [c.name, c.make, c.model, c.sippCode, c.supplierName, c.locationCode, c.category].some(v => v && String(v).toLowerCase().includes(q)));
  }, [list, query, category]);

  const available = list.filter(c => c.available !== false).length;
  const suppliers = new Set(list.map(c => c.supplierId || c.supplierName)).size;
  const choice = list.filter(c => c.hogicarChoice).length;

  return (
    <div className="space-y-5">
      <Hero eyebrow="Operations" eyebrowIcon={CarIcon} title="Fleet"
        subtitle="Every car your direct suppliers list on Hogicar, with its pricing and promotions."
        actions={<button onClick={onRefresh} className={heroButton}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>}
        loading={loading && !list.length}
        kpis={[
          { label: 'Cars', value: num(list.length), Icon: CarIcon, note: `${categories.length} categories` },
          { label: 'Available', value: num(available), Icon: CalendarCheck, note: list.length - available ? `${list.length - available} unavailable` : 'All bookable' },
          { label: 'Suppliers', value: num(suppliers), Icon: Building },
          { label: 'Hogicar choice', value: num(choice), Icon: Sparkles, note: 'Highlighted in results' },
        ]} />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented layoutId="fleet-cat" value={category} onChange={setCategory}
          items={[{ key: 'all', label: 'All', count: list.length }, ...categories.slice(0, 6).map(([k, n]) => ({ key: k, label: titleCase(k), count: n }))]} />
        <div className="flex gap-2">
          <div className="relative w-full xl:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search car, supplier, SIPP or location" className={searchCls} aria-label="Search fleet" />
          </div>
          <div className="hidden shrink-0 rounded-xl bg-white p-1 ring-1 ring-slate-200 md:flex" role="group" aria-label="View">
            <button onClick={() => setView('grid')} aria-pressed={view === 'grid'} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} aria-pressed={view === 'list'} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`} aria-label="List view"><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {loading && !list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}
        </div>
      ) : shown.length === 0 ? (
        <Empty icon={CarIcon} title={list.length ? 'No cars match' : 'No cars yet'}
          text={list.length ? 'Try another search or category.' : 'Cars appear here once a supplier adds them to their fleet.'} />
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map(c => (
            <article key={c.id} className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300">
              <div className="relative">
                <CarPicture url={c.imageUrl || c.image} alt={carTitle(c)} className="aspect-[16/10]" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {c.hogicarChoice && <Pill tone="amber"><Sparkles className="h-3 w-3" />Hogicar choice</Pill>}
                  {Number(c.hogicarPromotion) > 0 && <Pill tone="green">-{Number(c.hogicarPromotion)}%</Pill>}
                </div>
                <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${c.available !== false ? 'text-emerald-700 ring-emerald-600/20' : 'text-rose-700 ring-rose-600/20'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.available !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />{c.available !== false ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-[#007ac2]">{titleCase(c.category) || 'Car'}{c.sippCode ? <span className="ml-1.5 font-mono text-slate-400">{c.sippCode}</span> : null}</p>
                <h3 className="mt-0.5 line-clamp-1 text-base font-semibold text-slate-900" title={carTitle(c)}>{carTitle(c)}{c.year ? <span className="font-normal text-slate-400"> {c.year}</span> : null}</h3>
                <p className="text-xs text-slate-500">or similar</p>
                <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-600">
                  {c.passengers ? <li className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-400" />{c.passengers}</li> : null}
                  {c.bags ? <li className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{c.bags}</li> : null}
                  {c.transmission ? <li className="inline-flex items-center gap-1"><Cog className="h-3.5 w-3.5 text-slate-400" />{titleCase(c.transmission)}</li> : null}
                  {c.airConditioning ? <li className="inline-flex items-center gap-1"><Snowflake className="h-3.5 w-3.5 text-slate-400" />A/C</li> : null}
                </ul>
                <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-3">
                  <SupplierLogo url={c.supplierLogoUrl} name={c.supplierName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{c.supplierName || 'Supplier'}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{c.locationCode || '—'}</p>
                  </div>
                  <button onClick={() => onPricing(c)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-[#007ac2] ring-1 ring-inset ring-slate-200 hover:bg-sky-50">
                    <Tag className="h-4 w-4" /> Pricing
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Car</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Specs</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CarPicture url={c.imageUrl || c.image} alt={carTitle(c)} className="h-12 w-16 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{carTitle(c)}</p>
                        <p className="text-xs text-slate-500">{titleCase(c.category)}{c.sippCode ? <span className="ml-1.5 font-mono">{c.sippCode}</span> : null}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><SupplierLogo url={c.supplierLogoUrl} name={c.supplierName} size="sm" /><span className="truncate">{c.supplierName || '—'}</span></div></td>
                  <td className="px-4 py-3 text-slate-600">{c.locationCode || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{[c.passengers && `${c.passengers} seats`, c.bags && `${c.bags} bags`, c.transmission && titleCase(c.transmission)].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.available !== false ? <Pill tone="green">Available</Pill> : <Pill tone="red">Unavailable</Pill>}
                      {c.hogicarChoice && <Pill tone="amber">Choice</Pill>}
                      {Number(c.hogicarPromotion) > 0 && <Pill tone="green">-{Number(c.hogicarPromotion)}%</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onPricing(c)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-[#007ac2] ring-1 ring-inset ring-slate-200 hover:bg-sky-50"><Tag className="h-4 w-4" /> Pricing</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
