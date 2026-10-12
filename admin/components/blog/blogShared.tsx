import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { API_BASE_URL } from '../../../lib/config';
import { Spinner, inputCls } from '../commercialUi';

/* ------------------------------------------------------------------ types */

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface SeoConfig {
  id: number;
  route: string;
  title?: string;
  destinationName?: string;
  countryTag?: string;
  cityTag?: string;
  airportTags?: string;
  routeType?: string;
  heroImage?: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogLocationImage {
  id: number;
  countryTag: string;
  cityTag?: string | null;
  areaTag?: string | null;
  topicTag?: string | null;
  title?: string;
  altText?: string;
  caption?: string;
  imageUrl: string;
}

export interface CoverageRow {
  countryTag: string;
  cityTag: string | null;
  articles: number;
  ownImage: number;
  titles: string[];
  imageId: number | null;
  imageUrl: string | null;
  inheritedFromCountry?: true;
}

export interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  desktopImage: string;
  mobileImage: string;
  thumbnailImage: string;
  openGraphImage: string;
  twitterCardImage: string;
  imageAltText: string;
  imageCaption: string;
  category: BlogCategory | null;
  primaryRoute: SeoConfig | null;
  secondaryRoutes: SeoConfig[];
  relatedAirports: any[];
  articleTags: BlogTag[];
  relatedArticles: BlogArticle[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  secondaryKeywords: string;
  robotsDirectives: string;
  openGraphTagsJson: string;
  twitterCardTagsJson: string;
  faqJson: string;
  country: string;
  readingTime: string;
  featuredOnHomepage: boolean;
  isFeatured: boolean;
  tags?: string;
  authorName: string;
  authorImage: string;
  status: string;
  publishDate: string;
  scheduledAt: string;
  archivedAt: string;
  seoScore: number;
  published: boolean;
  live: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ helpers */

/** The one place that turns a stored image value into something an <img> can load. */
export const imgSrc = (value?: string | null): string => {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:') || v.startsWith('blob:')) return v;
  if (v.startsWith('/')) return `${API_BASE_URL}${v}`;
  if (v.startsWith('uploads/')) return `${API_BASE_URL}/${v}`;
  return v;
};

/** `Dead Sea` / `dead_sea` → `dead-sea` (matches how the server stores tags). */
export const normTag = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SMALL_WORDS = new Set(['and', 'of', 'the', 'de', 'el', 'al', 'la', 'du', 'des']);

/** `united-arab-emirates` → `United Arab Emirates`. */
export const placeLabel = (tag?: string | null): string => {
  const words = (tag || '').trim().split(/[-_\s]+/).filter(Boolean);
  return words
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const wordCount = (html?: string) =>
  (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

/** Original word count used by the SEO score (counts raw tokens, as before). */
export const rawWordCount = (content?: string) => (content || '').split(/\s+/).filter(Boolean).length;

export const parseJsonArray = (value?: string) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Pulls the server's `{message}` out of adminFetch's error text. */
export const apiMessage = (e: any, fallback: string) => {
  const m = String(e?.message || '');
  const hit = /status \d+: (.*)$/s.exec(m);
  const text = (hit ? hit[1] : '').trim();
  if (!text || text.startsWith('{') || text.startsWith('<')) return fallback;
  return text;
};

/** Country / city an article is about, as normalised tags. */
export const articlePlace = (a: Partial<BlogArticle>) => ({
  country: normTag(a.primaryRoute?.countryTag || a.country),
  city: normTag(a.primaryRoute?.cityTag) || null,
});

export const placeName = (country: string, city: string | null) =>
  city ? `${placeLabel(city)}, ${placeLabel(country)}` : placeLabel(country);

export type InheritedImage = { imageUrl: string; label: string; scope: 'city' | 'country' } | null;

/** Which location image an article without its own picture will show. */
export const findInherited = (coverage: CoverageRow[], country: string, city: string | null): InheritedImage => {
  if (!country) return null;
  if (city) {
    const row = coverage.find(r => normTag(r.countryTag) === country && normTag(r.cityTag) === city);
    if (row?.imageUrl) {
      return row.inheritedFromCountry
        ? { imageUrl: row.imageUrl, label: placeLabel(country), scope: 'country' }
        : { imageUrl: row.imageUrl, label: placeLabel(city), scope: 'city' };
    }
  }
  const c = coverage.find(r => normTag(r.countryTag) === country && !r.cityTag);
  return c?.imageUrl ? { imageUrl: c.imageUrl, label: placeLabel(country), scope: 'country' } : null;
};

export const ownPicture = (a: Partial<BlogArticle>) => a.thumbnailImage || a.featuredImage || a.desktopImage || '';

/* ------------------------------------------------------------------ status + SEO */

export type StatusKey = 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED';

const STATUS_UI: Record<StatusKey, { label: string; cls: string; dot: string }> = {
  PUBLISHED: { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  ARCHIVED: { label: 'Archived', cls: 'bg-stone-100 text-stone-600 ring-stone-200', dot: 'bg-stone-400' },
};

export const statusOf = (a: Partial<BlogArticle>): StatusKey => {
  const s = (a.status || '').toUpperCase();
  if (s in STATUS_UI) return s as StatusKey;
  return a.published ? 'PUBLISHED' : 'DRAFT';
};

export const StatusPill: React.FC<{ status: StatusKey }> = ({ status }) => {
  const ui = STATUS_UI[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ui.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />
      {ui.label}
    </span>
  );
};

export const seoBand = (score: number) =>
  score >= 80
    ? { stroke: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-500', soft: 'bg-emerald-50 ring-emerald-200', label: 'Good' }
    : score >= 60
      ? { stroke: '#f59e0b', text: 'text-amber-700', bg: 'bg-amber-500', soft: 'bg-amber-50 ring-amber-200', label: 'Needs work' }
      : { stroke: '#f43f5e', text: 'text-rose-700', bg: 'bg-rose-500', soft: 'bg-rose-50 ring-rose-200', label: 'Poor' };

export const SeoRing: React.FC<{ score: number; size?: number }> = ({ score, size = 40 }) => {
  const s = Math.max(0, Math.min(100, Math.round(score || 0)));
  const band = seoBand(s);
  const stroke = size >= 64 ? 6 : 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} title={`SEO score ${s}/100 · ${band.label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={band.stroke} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * s) / 100} />
      </svg>
      <span className={`absolute font-semibold tabular-nums ${band.text} ${size >= 64 ? 'text-lg' : 'text-[11px]'}`}>{s}</span>
    </span>
  );
};

/* ------------------------------------------------------------------ images */

/** Image with a calm placeholder when there is no URL or the file fails to load. */
export const Thumb: React.FC<{ src?: string | null; alt?: string; className?: string; dim?: boolean; iconSize?: string; children?: React.ReactNode }> = ({
  src, alt = '', className = '', dim, iconSize = 'h-5 w-5', children,
}) => {
  const url = imgSrc(src);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [url]);
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {url && !failed ? (
        <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${dim ? 'opacity-45 grayscale-[35%]' : ''}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/70 text-slate-400">
          <ImageIcon className={iconSize} />
        </div>
      )}
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ confirm dialog */

export type ConfirmOptions = {
  title: string;
  body?: React.ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  /** Ask the user to type this word before confirming. */
  typeToConfirm?: string;
};

export const useConfirm = () => {
  const [state, setState] = React.useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const ask = React.useCallback((opts: ConfirmOptions) => new Promise<boolean>(resolve => setState({ ...opts, resolve })), []);
  const close = (ok: boolean) => { state?.resolve(ok); setState(null); };
  const dialog = <ConfirmDialog state={state} onClose={close} />;
  return { ask, dialog };
};

const ConfirmDialog: React.FC<{ state: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null; onClose: (ok: boolean) => void }> = ({ state, onClose }) => {
  const [typed, setTyped] = React.useState('');
  React.useEffect(() => setTyped(''), [state]);
  React.useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, onClose]);
  if (typeof document === 'undefined') return null;
  const blocked = !!state?.typeToConfirm && typed.trim() !== state.typeToConfirm;
  const danger = state?.tone !== 'primary';
  return createPortal(
    <AnimatePresence>
      {state && (
        <div className="fixed inset-0 z-[280] flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => onClose(false)} />
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? 'bg-rose-50 text-rose-600' : 'bg-[#007ac2]/10 text-[#007ac2]'}`}>
                {danger ? <AlertTriangle className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">{state.title}</h3>
                {state.body && <div className="mt-1.5 text-sm leading-relaxed text-slate-600">{state.body}</div>}
              </div>
            </div>
            {state.typeToConfirm && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm text-slate-600">Type <span className="font-mono font-semibold text-slate-900">{state.typeToConfirm}</span> to confirm</span>
                <input autoFocus className={inputCls} value={typed} onChange={e => setTyped(e.target.value)} />
              </label>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => onClose(false)} className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={blocked} onClick={() => onClose(true)} autoFocus={!state.typeToConfirm}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-40 ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#007ac2] hover:bg-[#00649f]'}`}>
                {state.confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/* ------------------------------------------------------------------ misc UI */

export const Empty: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; text: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><Icon className="h-7 w-7" /></span>
    <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>
    {action}
  </div>
);

export const primaryBtn = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-60';
export const secondaryBtn = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-60';
export const smallBtn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition disabled:opacity-50';

export const BusyButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; light?: boolean }> = ({ busy, light = true, children, disabled, ...rest }) => (
  <button {...rest} disabled={disabled || busy}>
    {busy && <Spinner light={light} />}
    {children}
  </button>
);
