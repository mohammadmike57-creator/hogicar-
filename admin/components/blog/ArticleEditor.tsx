import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Globe from 'lucide-react/dist/esm/icons/globe';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import Check from 'lucide-react/dist/esm/icons/check';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import Search from 'lucide-react/dist/esm/icons/search';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Tablet from 'lucide-react/dist/esm/icons/tablet';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import Info from 'lucide-react/dist/esm/icons/info';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import { adminFetch } from '../../../lib/adminApi';
import ImageUploadField from '../ImageUploadField';
import { MediaLibrary } from '../MediaLibrary';
import { Drawer, Field, Toggle, inputCls, Spinner } from '../commercialUi';
import {
  BlogArticle, BlogCategory, BlogLocationImage, CoverageRow, SeoConfig, ConfirmOptions, SeoRing, StatusPill, Thumb,
  apiMessage, articlePlace, findInherited, parseJsonArray, placeLabel, placeName, rawWordCount, seoBand, slugify, statusOf,
  primaryBtn, secondaryBtn,
} from './blogShared';

type Draft = Partial<BlogArticle>;

const SECTIONS = [
  { id: 'content', label: 'Content', Icon: FileText },
  { id: 'media', label: 'Media', Icon: ImageIcon },
  { id: 'seo', label: 'SEO', Icon: Globe },
  { id: 'location', label: 'Location & routes', Icon: MapPin },
  { id: 'publishing', label: 'Publishing', Icon: CalendarClock },
] as const;
type SectionId = typeof SECTIONS[number]['id'];

/** Live SEO checks. Points add up to the same score the editor always used. */
export const seoChecks = (a: Draft | null) => {
  if (!a) return [];
  const words = rawWordCount(a.content);
  const titleLen = (a.seoTitle || '').length;
  const descLen = (a.seoDescription || '').length;
  return [
    { label: 'SEO title, 70 characters or less', ok: !!a.seoTitle && titleLen <= 70, pts: 15, hint: a.seoTitle ? `${titleLen} characters` : 'Not set' },
    { label: 'Meta description, 120–165 characters', ok: !!a.seoDescription && descLen >= 120 && descLen <= 165, pts: 15, hint: a.seoDescription ? `${descLen} characters` : 'Not set' },
    { label: 'Canonical URL', ok: !!a.canonicalUrl, pts: 10 },
    { label: 'Focus keyword', ok: !!a.focusKeyword, pts: 10 },
    { label: 'Image alt text', ok: !!(a.imageAltText || a.title), pts: 10 },
    { label: 'FAQs', ok: !!a.faqJson, pts: 10 },
    { label: 'Linked to a route', ok: !!(a.primaryRoute || (a.secondaryRoutes && a.secondaryRoutes.length > 0)), pts: 10 },
    { label: 'At least 900 words', ok: words >= 900, pts: 10, hint: `${words} words` },
    { label: 'Excerpt', ok: !!a.excerpt, pts: 5 },
    { label: 'Tags', ok: !!a.tags, pts: 5 },
  ];
};

export const seoScoreOf = (a: Draft | null) => Math.min(seoChecks(a).reduce((n, c) => n + (c.ok ? c.pts : 0), 0), 100);

/* ------------------------------------------------------------------ small pieces */

const Section: React.FC<{ id: SectionId; title: string; description: string; Icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }> = ({ id, title, description, Icon, children }) => (
  <section id={`article-sec-${id}`} data-section={id} className="scroll-mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
    <header className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007ac2]/10 text-[#007ac2]"><Icon className="h-4 w-4" /></span>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </header>
    <div className="space-y-5">{children}</div>
  </section>
);

const LabelRow: React.FC<{ label: string; right?: React.ReactNode; htmlFor?: string }> = ({ label, right, htmlFor }) => (
  <div className="mb-1.5 flex items-center justify-between gap-2">
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">{label}</label>
    {right}
  </div>
);

const Counter: React.FC<{ n: number; min?: number; max: number }> = ({ n, min = 1, max }) => {
  const ok = n >= min && n <= max;
  return <span className={`text-xs tabular-nums ${n === 0 ? 'text-slate-400' : ok ? 'text-emerald-600' : 'text-amber-600'}`}>{n} / {min > 1 ? `${min}–` : ''}{max}</span>;
};

const RouteList: React.FC<{ routes: SeoConfig[]; isSelected: (r: SeoConfig) => boolean; onToggle: (r: SeoConfig) => void; empty: string }> = ({ routes, isSelected, onToggle, empty }) => (
  <div className="max-h-56 overflow-y-auto rounded-xl ring-1 ring-slate-200">
    {routes.length === 0 ? <p className="p-4 text-center text-sm text-slate-400">{empty}</p> : (
      <ul className="divide-y divide-slate-100">
        {routes.map(r => {
          const on = isSelected(r);
          return (
            <li key={r.id}>
              <button type="button" onClick={() => onToggle(r)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${on ? 'bg-[#007ac2]/[0.06]' : 'hover:bg-slate-50'}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ${on ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-white ring-slate-300'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{r.destinationName || r.route}</span>
                  <span className="block truncate font-mono text-[11px] text-slate-400">{r.route}</span>
                </span>
                {r.routeType && <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 sm:inline">{placeLabel(r.routeType)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

const TOOLBAR = ['H1', 'H2', 'H3', 'B', 'I', 'UL', 'OL', 'LI', 'IMG', 'A', 'TABLE', 'TR', 'TD'];

/* ------------------------------------------------------------------ editor */

const ArticleEditor: React.FC<{
  initial: Draft;
  categories: BlogCategory[];
  articles: BlogArticle[];
  routes: SeoConfig[];
  coverage: CoverageRow[];
  onClose: () => void;
  onSaved: (a: Draft) => void;
  onChanged: () => void;
  notify: (t: string, tone?: 'ok' | 'err') => void;
  ask: (o: ConfirmOptions) => Promise<boolean>;
}> = ({ initial, categories, articles, routes, coverage, onClose, onSaved, onChanged, notify, ask }) => {
  const [a, setA] = React.useState<Draft>(initial);
  const [saving, setSaving] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<SectionId>('content');
  const [previewMode, setPreviewMode] = React.useState<'desktop' | 'tablet' | 'mobile' | 'google'>('desktop');
  const [libraryTarget, setLibraryTarget] = React.useState<string | null>(null);
  const [suggested, setSuggested] = React.useState<BlogLocationImage[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [routeFilters, setRouteFilters] = React.useState({ routeType: '', countryTag: '', cityTag: '', search: '' });
  const [routeList, setRouteList] = React.useState<SeoConfig[]>(routes);
  const [slugTouched, setSlugTouched] = React.useState(!!initial.slug);
  const baseline = React.useRef(JSON.stringify(initial));
  const contentRef = React.useRef<HTMLTextAreaElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const set = (p: Partial<BlogArticle>) => setA(prev => ({ ...prev, ...p }));

  /* suggestions for the article's place (same request as before) */
  React.useEffect(() => {
    const country = a.primaryRoute?.countryTag || a.country;
    if (!country) { setSuggested([]); return; }
    let cancelled = false;
    setLoadingSuggestions(true);
    const params = new URLSearchParams();
    params.append('country', country);
    if (a.primaryRoute?.cityTag) params.append('city', a.primaryRoute.cityTag);
    adminFetch(`/api/admin/blog/location-images?${params.toString()}`)
      .then(data => { if (!cancelled) setSuggested(Array.isArray(data) ? data : []); })
      .catch(err => console.error('Failed to fetch suggestions:', err))
      .finally(() => { if (!cancelled) setLoadingSuggestions(false); });
    return () => { cancelled = true; };
  }, [a.primaryRoute?.id, a.country]);

  /* route search */
  const firstRouteRun = React.useRef(true);
  React.useEffect(() => {
    if (firstRouteRun.current) { firstRouteRun.current = false; return; }
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (routeFilters.routeType) params.append('routeType', routeFilters.routeType);
        if (routeFilters.countryTag) params.append('countryTag', routeFilters.countryTag);
        if (routeFilters.cityTag) params.append('cityTag', routeFilters.cityTag);
        if (routeFilters.search) params.append('search', routeFilters.search);
        const res = await adminFetch(`/api/admin/blog/routes?${params.toString()}`);
        setRouteList(res || []);
      } catch (e) {
        console.error('Error fetching filtered routes:', e);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [routeFilters]);

  /* active section while scrolling */
  React.useEffect(() => {
    const root = formRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      const hit = entries.filter(e => e.isIntersecting).sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
      const id = hit?.target.getAttribute('data-section') as SectionId | null;
      if (id) setActive(id);
    }, { root, rootMargin: '0px 0px -65% 0px', threshold: 0 });
    root.querySelectorAll('[data-section]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (id: SectionId) => {
    setActive(id);
    document.getElementById(`article-sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const checks = seoChecks(a);
  const score = seoScoreOf(a);
  const band = seoBand(score);
  const words = rawWordCount(a.content);
  const place = articlePlace(a);
  const inherited = findInherited(coverage, place.country, place.city);
  const faqs = parseJsonArray(a.faqJson);

  const requestClose = async () => {
    if (saving) return;
    if (JSON.stringify(a) !== baseline.current) {
      const ok = await ask({ title: 'Discard your changes?', body: 'You have edits that are not saved yet.', confirmLabel: 'Discard changes' });
      if (!ok) return;
    }
    onClose();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/api/admin/blog/articles', { method: 'POST', body: JSON.stringify(a) });
      baseline.current = JSON.stringify(a);
      onSaved(a);
    } catch (err) {
      setError(apiMessage(err, 'Failed to save article.'));
      notify('Could not save the article', 'err');
    } finally {
      setSaving(false);
    }
  };

  const schedule = async () => {
    if (!a.id || !a.scheduledAt) return;
    setScheduling(true);
    try {
      const scheduledAt = a.scheduledAt.length === 16 ? `${a.scheduledAt}:00` : a.scheduledAt;
      const updated = await adminFetch(`/api/admin/blog/articles/${a.id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) });
      setA(updated);
      baseline.current = JSON.stringify(updated);
      notify('Publishing scheduled');
      onChanged();
    } catch {
      notify('Failed to schedule article', 'err');
    } finally {
      setScheduling(false);
    }
  };

  const insertTag = (tag: string) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const lower = tag.toLowerCase();
    let replacement = '';
    if (tag === 'IMG') replacement = `<img src="" alt="" />`;
    else if (tag === 'A') replacement = `<a href="">${selected || 'Link'}</a>`;
    else if (tag === 'TABLE') replacement = `<table>\n  <tr>\n    <td></td>\n  </tr>\n</table>`;
    else replacement = `<${lower}>${selected}</${lower}>`;
    set({ content: text.substring(0, start) + replacement + text.substring(end) });
    window.setTimeout(() => { el.focus(); el.setSelectionRange(start + replacement.length, start + replacement.length); }, 10);
  };

  const addFaq = () => set({ faqJson: JSON.stringify([...faqs, { question: '', answer: '' }], null, 2) });
  const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
    const next = [...faqs];
    next[i] = { ...(next[i] || {}), [field]: value };
    set({ faqJson: JSON.stringify(next, null, 2) });
  };
  const removeFaq = (i: number) => set({ faqJson: JSON.stringify(faqs.filter((_: any, k: number) => k !== i), null, 2) });

  const imageField = (key: keyof BlogArticle, label: string, placeholder: string) => (
    <ImageUploadField label={label} placeholder={placeholder} value={(a[key] as string) || ''}
      onChange={e => set({ [key]: e.target.value } as Partial<BlogArticle>)} onLibraryOpen={() => setLibraryTarget(key as string)} />
  );

  const status = statusOf(a);
  const placeText = place.country ? placeName(place.country, place.city) : '';

  const nav = (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-3">
      {SECTIONS.map(s => (
        <button key={s.id} type="button" onClick={() => jump(s.id)}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition ${active === s.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <s.Icon className="h-3.5 w-3.5" />{s.label}
        </button>
      ))}
    </nav>
  );

  return (
    <Drawer
      eyebrow={a.id ? 'Edit article' : 'New article'}
      title={a.title?.trim() || 'Untitled article'}
      onClose={requestClose}
      busy={saving}
      width="max-w-[1180px]"
      headerExtra={nav}
      footer={
        <div className="flex items-center gap-2">
          <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
            <StatusPill status={status} />
            <span className={`text-sm font-medium ${band.text}`}>SEO {score}/100</span>
            {error && <span className="truncate text-sm text-rose-700">{error}</span>}
          </div>
          <button type="button" onClick={requestClose} disabled={saving} className={`${secondaryBtn} flex-1 sm:flex-none`}>Cancel</button>
          <button type="submit" form="article-editor-form" disabled={saving} className={`${primaryBtn} flex-[2] sm:flex-none`}>
            {saving ? <Spinner light /> : <Save className="h-4 w-4" />} Save article
          </button>
        </div>
      }
    >
      <form id="article-editor-form" ref={formRef} onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          {error && <p role="alert" className="rounded-2xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-rose-200 sm:hidden">{error}</p>}

          {/* ---------------------------------------------------- Content */}
          <Section id="content" title="Content" description="Title, summary and the article body." Icon={FileText}>
            <Field label="Title">
              <input required className={`${inputCls} h-12 text-lg font-semibold sm:text-base`} value={a.title || ''}
                onChange={e => set({ title: e.target.value, ...(!slugTouched && !a.id ? { slug: slugify(e.target.value) } : {}) })} placeholder="Driving from Amman to the Dead Sea" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <LabelRow label="Slug" htmlFor="article-slug" right={
                  <button type="button" onClick={() => { set({ slug: slugify(a.title || '') }); setSlugTouched(true); }} className="inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2] hover:underline"><Wand2 className="h-3.5 w-3.5" />From title</button>
                } />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">/blog/</span>
                  <input id="article-slug" required className={`${inputCls} pl-[3.6rem] font-mono`} value={a.slug || ''} onChange={e => { setSlugTouched(true); set({ slug: e.target.value }); }} />
                </div>
              </div>
              <Field label="Category">
                <select className={inputCls} value={a.category?.id || ''} onChange={e => set({ category: categories.find(c => c.id === Number(e.target.value)) || null })}>
                  <option value="">Uncategorised</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div>
              <LabelRow label="Excerpt" right={<span className="text-xs text-slate-400">{(a.excerpt || '').length} characters</span>} />
              <textarea className={`${inputCls} h-24 resize-none py-2.5`} value={a.excerpt || ''} onChange={e => set({ excerpt: e.target.value })} placeholder="A short summary shown on blog cards." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <LabelRow label="Reading time" htmlFor="article-rt" right={
                  <button type="button" onClick={() => set({ readingTime: `${Math.max(1, Math.round(words / 200))} min read` })} className="inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2] hover:underline"><Wand2 className="h-3.5 w-3.5" />Estimate</button>
                } />
                <input id="article-rt" className={inputCls} placeholder="e.g. 5 min read" value={a.readingTime || ''} onChange={e => set({ readingTime: e.target.value })} />
              </div>
              <Field label="Tags" hint="Separate with commas.">
                <input className={inputCls} placeholder="Travel tips, Luxury, Adventure" value={a.tags || ''} onChange={e => set({ tags: e.target.value })} />
              </Field>
            </div>

            <div>
              <LabelRow label="Article body (HTML)" htmlFor="article-content-textarea" right={
                <span className={`text-xs font-medium tabular-nums ${words >= 1500 ? 'text-emerald-600' : 'text-amber-600'}`}>{words.toLocaleString()} / 1,500 words</span>
              } />
              <div className="overflow-hidden rounded-xl ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-[#007ac2]/50">
                <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
                  {TOOLBAR.map(tag => (
                    <button key={tag} type="button" onClick={() => insertTag(tag)}
                      className="h-7 rounded-md px-2 font-mono text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm">{tag}</button>
                  ))}
                </div>
                <textarea id="article-content-textarea" ref={contentRef} required value={a.content || ''} onChange={e => set({ content: e.target.value })}
                  className="block h-[28rem] w-full resize-y bg-white px-3.5 py-3 font-mono text-[13px] leading-relaxed text-slate-800 outline-none" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Google tends to rank in-depth guides of 1,000–1,500 words or more.</p>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">FAQs</p>
                  <p className="text-xs text-slate-500">Shown on the article and added as FAQ rich results.</p>
                </div>
                <button type="button" onClick={addFaq} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-[#007ac2] ring-1 ring-inset ring-[#007ac2]/30 hover:bg-[#007ac2]/5"><Plus className="h-4 w-4" /> Add FAQ</button>
              </div>
              {faqs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">No FAQs yet.</p>
              ) : (
                <ol className="space-y-3">
                  {faqs.map((faq: any, idx: number) => (
                    <li key={idx} className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                      <div className="flex items-start gap-2">
                        <span className="mt-2.5 w-5 shrink-0 text-xs font-semibold tabular-nums text-slate-400">{idx + 1}.</span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <input className={`${inputCls} font-medium`} placeholder="Question" value={faq.question || ''} onChange={e => updateFaq(idx, 'question', e.target.value)} />
                          <textarea className={`${inputCls} h-20 resize-none py-2.5`} placeholder="Answer" value={faq.answer || ''} onChange={e => updateFaq(idx, 'answer', e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removeFaq(idx)} aria-label="Remove FAQ" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold text-slate-900">Related articles</p>
              <p className="mb-3 text-xs text-slate-500">{(a.relatedArticles || []).length} selected · shown at the end of the article.</p>
              <div className="max-h-64 overflow-y-auto rounded-xl ring-1 ring-slate-200">
                <ul className="divide-y divide-slate-100">
                  {articles.filter(x => x.id !== a.id).map(x => {
                    const on = !!a.relatedArticles?.some(r => r.id === x.id);
                    return (
                      <li key={x.id}>
                        <button type="button" onClick={() => set({ relatedArticles: on ? a.relatedArticles?.filter(r => r.id !== x.id) : [...(a.relatedArticles || []), x] })}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${on ? 'bg-[#007ac2]/[0.06]' : 'hover:bg-slate-50'}`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ${on ? 'bg-[#007ac2] text-white ring-[#007ac2]' : 'bg-white ring-slate-300'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                          <Thumb src={x.thumbnailImage || x.featuredImage} className="aspect-[16/10] w-12 shrink-0 rounded-md" iconSize="h-3.5 w-3.5" />
                          <span className="line-clamp-1 min-w-0 flex-1 text-sm text-slate-800">{x.title}</span>
                        </button>
                      </li>
                    );
                  })}
                  {articles.filter(x => x.id !== a.id).length === 0 && <li className="p-4 text-center text-sm text-slate-400">No other articles on this page.</li>}
                </ul>
              </div>
            </div>
          </Section>

          {/* ---------------------------------------------------- Media */}
          <Section id="media" title="Media" description="The hero picture and the sizes used for cards and social sharing." Icon={ImageIcon}>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <Thumb src={inherited?.imageUrl} dim={!!a.featuredImage} className="aspect-[16/10] w-28 shrink-0 rounded-xl sm:w-36" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-slate-900">
                  {inherited ? `${inherited.label} location image` : placeText ? `No location image for ${placeText}` : 'No location set'}
                </p>
                <p className="mt-0.5 text-slate-600">
                  {inherited
                    ? (a.featuredImage
                      ? `This article has its own picture. Remove the hero image below to use the ${inherited.label} image instead.`
                      : `Leave empty to use the ${inherited.label} image.`)
                    : placeText
                      ? 'Add one under Location images and every article about this place will show it automatically.'
                      : 'Set a country or a primary route to pick up a location image automatically.'}
                </p>
              </div>
            </div>

            {(loadingSuggestions || suggested.length > 0) && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Suggested for {a.primaryRoute?.destinationName || placeText || 'this location'}</p>
                {loadingSuggestions ? <div className="h-20 animate-pulse rounded-xl bg-slate-100" /> : (
                  <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
                    {suggested.map(img => (
                      <button key={img.id} type="button" title={img.title || img.altText || 'Use this image'}
                        onClick={() => set({ featuredImage: img.imageUrl, imageAltText: img.altText || a.imageAltText, imageCaption: img.caption || a.imageCaption })}
                        className={`group relative w-32 shrink-0 overflow-hidden rounded-xl ring-2 transition ${a.featuredImage === img.imageUrl ? 'ring-[#007ac2]' : 'ring-transparent hover:ring-slate-300'}`}>
                        <Thumb src={img.imageUrl} alt={img.altText} className="aspect-[16/10] w-full" />
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">Use image</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {imageField('featuredImage', 'Hero image', 'Hero image URL…')}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Alt text" hint="Describe the picture for screen readers and Google.">
                <input className={inputCls} value={a.imageAltText || ''} onChange={e => set({ imageAltText: e.target.value })} />
              </Field>
              <Field label="Caption">
                <input className={inputCls} value={a.imageCaption || ''} onChange={e => set({ imageCaption: e.target.value })} />
              </Field>
            </div>

            <details className="group rounded-2xl ring-1 ring-slate-200" open={!!(a.desktopImage || a.mobileImage || a.thumbnailImage || a.openGraphImage || a.twitterCardImage)}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Other sizes</span>
                  <span className="block text-xs text-slate-500">Optional. Desktop, mobile, card thumbnail and social images.</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <div className="grid gap-5 border-t border-slate-100 p-4 md:grid-cols-2">
                {imageField('desktopImage', 'Desktop (main)', 'Desktop image URL…')}
                {imageField('mobileImage', 'Mobile', 'Mobile image URL…')}
                {imageField('thumbnailImage', 'Thumbnail (card)', 'Thumbnail image URL…')}
                {imageField('openGraphImage', 'Open Graph', 'Open Graph image URL…')}
                {imageField('twitterCardImage', 'Twitter card', 'Twitter image URL…')}
              </div>
            </details>
          </Section>

          {/* ---------------------------------------------------- SEO */}
          <Section id="seo" title="SEO" description="How the article appears in Google and what it ranks for." Icon={Globe}>
            <div className={`flex items-center gap-4 rounded-2xl p-4 ring-1 ${band.soft}`}>
              <SeoRing score={score} size={64} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">SEO score · {band.label}</p>
                <p className="text-sm text-slate-600">{checks.filter(c => !c.ok).length === 0 ? 'Everything is in place.' : `${checks.filter(c => !c.ok).length} things left to improve.`}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80"><div className={`h-full ${band.bg} transition-all`} style={{ width: `${score}%` }} /></div>
              </div>
            </div>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {checks.map(c => (
                <li key={c.label} className="flex items-start gap-2 text-sm">
                  {c.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                  <span className={c.ok ? 'text-slate-700' : 'text-slate-500'}>{c.label}{c.hint && <span className="text-slate-400"> · {c.hint}</span>}</span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-400">+{c.pts}</span>
                </li>
              ))}
            </ul>
            <div>
              <LabelRow label="SEO title" htmlFor="seo-title" right={<Counter n={(a.seoTitle || '').length} max={70} />} />
              <input id="seo-title" className={inputCls} value={a.seoTitle || ''} onChange={e => set({ seoTitle: e.target.value })} placeholder={a.title || ''} />
            </div>
            <div>
              <LabelRow label="Meta description" htmlFor="seo-desc" right={<Counter n={(a.seoDescription || '').length} min={120} max={165} />} />
              <textarea id="seo-desc" className={`${inputCls} h-24 resize-none py-2.5`} value={a.seoDescription || ''} onChange={e => set({ seoDescription: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Focus keyword"><input className={inputCls} value={a.focusKeyword || ''} onChange={e => set({ focusKeyword: e.target.value })} placeholder="car rental amman" /></Field>
              <Field label="Robots directives"><input className={inputCls} placeholder="index, follow" value={a.robotsDirectives || ''} onChange={e => set({ robotsDirectives: e.target.value })} /></Field>
            </div>
            <Field label="Canonical URL"><input className={inputCls} value={a.canonicalUrl || ''} onChange={e => set({ canonicalUrl: e.target.value })} placeholder={`https://www.hogicar.com/blog/${a.slug || ''}`} /></Field>
            <Field label="Secondary keywords"><textarea className={`${inputCls} h-20 resize-none py-2.5`} value={a.secondaryKeywords || ''} onChange={e => set({ secondaryKeywords: e.target.value })} /></Field>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-medium text-slate-400">Google search preview</p>
              <p className="text-[13px] text-[#202124]">www.hogicar.com › blog › {a.slug || 'article-slug'}</p>
              <p className="mt-0.5 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{a.seoTitle || a.title || 'Article title'}</p>
              <p className="mt-1 line-clamp-3 text-sm text-[#4d5156]">{a.seoDescription || a.excerpt || 'Meta description preview appears here.'}</p>
            </div>
          </Section>

          {/* ---------------------------------------------------- Location & routes */}
          <Section id="location" title="Location & routes" description="Where the article is about and which pages it is listed on." Icon={MapPin}>
            <Field label="Country" hint={place.country ? `Location images for ${placeText} apply to this article.` : 'Used to pick the location image when the article has no picture of its own.'}>
              <input className={inputCls} placeholder="e.g. Jordan" value={a.country || ''} onChange={e => set({ country: e.target.value })} />
            </Field>
            <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
              <select className={inputCls} value={routeFilters.routeType} onChange={e => setRouteFilters({ ...routeFilters, routeType: e.target.value })}>
                <option value="">All route types</option>
                <option value="HOMEPAGE">Homepage</option>
                <option value="AIRPORT">Airport</option>
                <option value="CITY">City</option>
                <option value="DESTINATION">Destination</option>
              </select>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className={`${inputCls} pl-10`} placeholder="Search routes" value={routeFilters.search} onChange={e => setRouteFilters({ ...routeFilters, search: e.target.value })} />
              </label>
            </div>
            <div>
              <LabelRow label="Primary route" right={a.primaryRoute ? <button type="button" onClick={() => set({ primaryRoute: null })} className="text-xs font-semibold text-slate-500 hover:text-rose-600">Clear</button> : <span className="text-xs text-slate-400">Required for route pages</span>} />
              <RouteList routes={routeList} empty="No routes match." isSelected={r => a.primaryRoute?.id === r.id} onToggle={r => set({ primaryRoute: r })} />
            </div>
            <div>
              <LabelRow label="Related routes" right={<span className="text-xs text-slate-400">{(a.secondaryRoutes || []).length} selected · optional</span>} />
              <RouteList routes={routeList.filter(r => r.id !== a.primaryRoute?.id)} empty="No other routes match."
                isSelected={r => !!a.secondaryRoutes?.some(s => s.id === r.id)}
                onToggle={r => {
                  const on = a.secondaryRoutes?.some(s => s.id === r.id);
                  set({ secondaryRoutes: on ? a.secondaryRoutes?.filter(s => s.id !== r.id) : [...(a.secondaryRoutes || []), r] });
                }} />
            </div>
            <div className="grid gap-4 rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-200 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-emerald-900">This article will appear on</p>
                <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                  {(a.featuredOnHomepage || a.isFeatured) && <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Homepage (featured)</li>}
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Blog index</li>
                  {a.primaryRoute && <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> {a.primaryRoute.destinationName || a.primaryRoute.route}</li>}
                  {a.secondaryRoutes?.map(r => <li key={r.id} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> {r.destinationName || r.route}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">It will be added to</p>
                <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                  {['Blog index', 'XML sitemap', 'Internal search', 'Related articles', 'Route blog sections'].map(t => <li key={t} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> {t}</li>)}
                </ul>
              </div>
            </div>
          </Section>

          {/* ---------------------------------------------------- Publishing */}
          <Section id="publishing" title="Publishing" description="Status, visibility, scheduling and author." Icon={CalendarClock}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select className={inputCls} value={a.status || (a.published ? 'PUBLISHED' : 'DRAFT')} onChange={e => set({ status: e.target.value, published: e.target.value === 'PUBLISHED' })}>
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>
              <Field label="Publish date">
                <input type="date" className={inputCls} value={a.publishDate || ''} onChange={e => set({ publishDate: e.target.value })} />
              </Field>
            </div>
            <div>
              <LabelRow label="Schedule publishing" htmlFor="article-schedule" />
              <div className="flex gap-2">
                <input id="article-schedule" type="datetime-local" className={`${inputCls} min-w-0 flex-1`} value={a.scheduledAt?.slice(0, 16) || ''}
                  onChange={e => set({ scheduledAt: e.target.value, status: e.target.value ? 'SCHEDULED' : a.status })} />
                {a.id && (
                  <button type="button" onClick={schedule} disabled={!a.scheduledAt || scheduling} className={`${secondaryBtn} shrink-0`}>
                    {scheduling ? <Spinner /> : <CalendarClock className="h-4 w-4" />} Set
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{a.id ? 'Press Set to schedule now, or save the article.' : 'Saved together with the article.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={!!a.published} onChange={v => set({ published: v })} label="Published" hint="Marks the article as published." />
              <Toggle checked={!!a.live} onChange={v => set({ live: v })} label="Automatic internal links" hint="Adds links from this article to the matching car rental pages when you save." />
              <Toggle checked={!!a.featuredOnHomepage} onChange={v => set({ featuredOnHomepage: v })} label="Featured on homepage" />
              <Toggle checked={!!a.isFeatured} onChange={v => set({ isFeatured: v })} label="Mark as featured" />
            </div>
            <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
              <Field label="Author name"><input className={inputCls} placeholder="Hogicar" value={a.authorName || ''} onChange={e => set({ authorName: e.target.value })} /></Field>
              <ImageUploadField label="Author image" placeholder="Author image URL" value={a.authorImage || ''} onChange={e => set({ authorImage: e.target.value })} />
            </div>

            {a.slug && (
              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Preview</p>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    {([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobile'], ['google', Search, 'Google']] as const).map(([mode, Icon, label]) => (
                      <button key={mode} type="button" onClick={() => setPreviewMode(mode)} aria-label={label} title={label}
                        className={`flex h-8 w-10 items-center justify-center rounded-lg transition ${previewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
                {previewMode === 'google' ? (
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <p className="text-[13px] text-[#202124]">www.hogicar.com › blog › {a.slug}</p>
                    <p className="text-lg text-[#1a0dab]">{a.seoTitle || a.title}</p>
                    <p className="text-sm text-[#4d5156]">{a.seoDescription || a.excerpt}</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl bg-slate-100 p-3 ring-1 ring-slate-200">
                    <iframe title="Article preview" src={`/blog/${a.slug}`}
                      className={`mx-auto block rounded-lg border-0 bg-white ${previewMode === 'desktop' ? 'h-80 w-full' : previewMode === 'tablet' ? 'h-80 w-[420px] max-w-full' : 'h-80 w-[260px] max-w-full'}`} />
                  </div>
                )}
                <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#007ac2] hover:underline">Open the live page <ArrowUpRight className="h-3.5 w-3.5" /></a>
              </div>
            )}
          </Section>
        </div>

        {/* ---------------------------------------------------- side summary */}
        <aside className="hidden xl:block">
          <div className="sticky top-0 space-y-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <SeoRing score={score} size={56} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">SEO score</p>
                  <p className={`text-sm ${band.text}`}>{band.label}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {checks.filter(c => !c.ok).slice(0, 5).map(c => (
                  <li key={c.label} className="flex items-start gap-2 text-[13px] text-slate-600"><Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />{c.label}</li>
                ))}
                {checks.every(c => c.ok) && <li className="flex items-center gap-2 text-[13px] text-emerald-700"><CircleCheck className="h-4 w-4" /> All checks passed</li>}
              </ul>
              <button type="button" onClick={() => jump('seo')} className="mt-3 text-[13px] font-semibold text-[#007ac2] hover:underline">Open SEO settings</button>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-900">At a glance</p>
              <dl className="mt-3 space-y-2 text-[13px]">
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Status</dt><dd><StatusPill status={status} /></dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Words</dt><dd className="tabular-nums text-slate-800">{words.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Place</dt><dd className="truncate text-right text-slate-800">{placeText || '—'}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Route</dt><dd className="truncate text-right text-slate-800">{a.primaryRoute?.destinationName || a.primaryRoute?.route || '—'}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">FAQs</dt><dd className="tabular-nums text-slate-800">{faqs.length}</dd></div>
              </dl>
            </div>
            <Thumb src={a.featuredImage || inherited?.imageUrl} dim={!a.featuredImage} className="aspect-[16/10] rounded-2xl ring-1 ring-slate-200">
              {!a.featuredImage && inherited && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700"><Info className="h-3 w-3" /> {inherited.label} image</span>}
            </Thumb>
          </div>
        </aside>
      </form>

      {libraryTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm md:p-8">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="h-full max-h-[85vh] w-full max-w-6xl">
            <MediaLibrary
              onClose={() => setLibraryTarget(null)}
              initialFilters={{ country: a.primaryRoute?.countryTag || a.country, city: a.primaryRoute?.cityTag }}
              onSelect={image => {
                set({
                  [libraryTarget]: image.imageUrl,
                  // Also update alt text/caption if target is hero/featured
                  ...(libraryTarget === 'featuredImage' ? { imageAltText: image.altText || a.imageAltText, imageCaption: image.caption || a.imageCaption } : {}),
                } as Partial<BlogArticle>);
                setLibraryTarget(null);
              }}
            />
          </motion.div>
        </div>,
        document.body,
      )}
    </Drawer>
  );
};

export default ArticleEditor;
