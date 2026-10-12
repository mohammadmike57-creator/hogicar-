import * as React from 'react';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash from 'lucide-react/dist/esm/icons/trash-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Wand from 'lucide-react/dist/esm/icons/wand-2';
import { Hero, heroButton, heroPrimary, Segmented, num, Drawer, useToast, Toast, ErrorBanner, Spinner } from './commercialUi';
import { adminFetch } from '../../lib/adminApi';
import { imgSrc } from './suppliersFleetUi';

/** Same scoring the SEO list always used: title, description, keyword and content length. */
export const seoScore = (c: any) => {
  let score = 0;
  if (c.title && c.title.length >= 30 && c.title.length <= 60) score += 30;
  if (c.description && c.description.length >= 120 && c.description.length <= 160) score += 30;
  if (c.primaryKeyword) score += 20;
  if (c.content && c.content.length > 1000) score += 20;
  else if (c.content && c.content.length > 500) score += 10;
  return score;
};

const issuesOf = (c: any, all: any[]) => {
  const out: string[] = [];
  if (!c.title || c.title.length < 30) out.push('Title too short');
  if (c.title && c.title.length > 60) out.push('Title too long');
  if (!c.description || c.description.length < 120) out.push('Description too short');
  if (c.description && c.description.length > 160) out.push('Description too long');
  if (!c.h1Title) out.push('No H1');
  if (!c.primaryKeyword) out.push('No main keyword');
  if (!c.content || c.content.length < 500) out.push('Thin content');
  if (c.primaryKeyword && all.some(o => o.id !== c.id && o.primaryKeyword === c.primaryKeyword)) out.push('Keyword used twice');
  if (c.title && all.some(o => o.id !== c.id && o.title === c.title)) out.push('Duplicate title');
  if (c.description && all.some(o => o.id !== c.id && o.description === c.description)) out.push('Duplicate description');
  return out;
};

const band = (s: number) => s >= 80 ? { ring: '#10b981', text: 'text-emerald-700', label: 'Good' } : s >= 50 ? { ring: '#f59e0b', text: 'text-amber-700', label: 'Fair' } : { ring: '#f43f5e', text: 'text-rose-700', label: 'Poor' };

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const b = band(score);
  const r = 18, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center" title={`SEO score ${score}% (${b.label})`}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={b.ring} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className={`text-xs font-semibold tabular-nums ${b.text}`}>{score}</span>
    </span>
  );
};

const Thumb: React.FC<{ url?: string }> = ({ url }) => {
  const [failed, setFailed] = React.useState(false);
  const src = imgSrc(url);
  return (
    <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
      {src && !failed ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} /> : <ImageIcon className="h-5 w-5 text-slate-300" />}
    </span>
  );
};

const SITE = 'https://www.hogicar.com';
const decodeRoute = (r?: string) => { try { return decodeURI(r || '/'); } catch { return r || '/'; } };

/** How the page looks in Google: title, address and description. */
const SnippetPreview: React.FC<{ c: any }> = ({ c }) => (
  <div className="min-w-0">
    <p className="truncate text-xs text-emerald-700" dir="ltr">{SITE.replace('https://', '')}{decodeRoute(c.route)}</p>
    <p className="line-clamp-1 text-[15px] font-medium text-[#1a0dab]" dir="auto">{c.title || <span className="text-slate-400">No title yet</span>}</p>
    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600" dir="auto">{c.description || <span className="text-slate-400">No description yet</span>}</p>
  </div>
);

export const SeoBoard: React.FC<{
  configs: any[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  totalElements?: number;
  error?: string;
  onPageChange: (page: number) => void;
  onSearch: (q: string) => void;
  onEditSeo: (c: any) => void;
  onNewSeo: () => void;
  onDeleteSeo: (route: string) => void;
}> = ({ configs, loading, currentPage, totalPages, totalElements, error, onPageChange, onSearch, onEditSeo, onNewSeo, onDeleteSeo }) => {
  const list = Array.isArray(configs) ? configs : [];
  const [writerOpen, setWriterOpen] = React.useState(false);
  const { toast, notify } = useToast();
  const listTop = React.useRef<HTMLDivElement>(null);
  const goTo = (page: number) => {
    if (page < 0 || page >= totalPages || loading) return;
    onPageChange(page);
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [view, setView] = React.useState<'pages' | 'keywords'>('pages');
  const [query, setQuery] = React.useState('');
  const [onlyIssues, setOnlyIssues] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = window.setTimeout(() => onSearch(query.trim()), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const rows = list.map(c => ({ c, score: seoScore(c), issues: issuesOf(c, list) }));
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length) : 0;
  const needWork = rows.filter(r => r.score < 80).length;
  const notIndexed = rows.filter(r => r.c.indexable === false || r.c.published === false).length;
  const shown = onlyIssues ? rows.filter(r => r.score < 80) : rows;
  const keywords = list.filter(c => c.primaryKeyword);

  return (
    <div className="space-y-5">
      <Hero eyebrow="SEO" eyebrowIcon={Globe} title="Landing pages"
        subtitle="Titles, descriptions and keywords Google shows for each page of hogicar.com."
        loading={loading && !list.length}
        actions={<>
          <button onClick={() => onPageChange(currentPage)} className={heroButton}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={() => setWriterOpen(true)} className={heroButton}><Wand className="h-4 w-4" /> Write descriptions</button>
          <button onClick={onNewSeo} className={heroPrimary}><Plus className="h-4 w-4" /> Add page</button>
        </>}
        kpis={[
          { label: 'Pages', value: num(totalElements ?? list.length), Icon: Globe, note: totalPages > 1 ? `${totalPages} pages of results` : undefined },
          { label: 'Average score', value: rows.length ? `${avg}%` : '—', Icon: Gauge, note: 'Pages on screen' },
          { label: 'Need work', value: num(needWork), Icon: AlertTriangle, note: 'Score under 80%' },
          { label: 'Hidden from Google', value: num(notIndexed), Icon: EyeOff, note: 'Draft or noindex' },
        ]} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented layoutId="seo-view" value={view} onChange={setView} items={[
          { key: 'pages', label: 'Pages', count: list.length },
          { key: 'keywords', label: 'Keyword map', count: keywords.length },
        ]} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-white px-3.5 text-sm text-slate-700 ring-1 ring-slate-200">
            <input type="checkbox" checked={onlyIssues} onChange={e => setOnlyIssues(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#007ac2]" />
            Only pages that need work
          </label>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search address or title" aria-label="Search pages"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm" />
          </div>
        </div>
      </div>

      <div ref={listTop} className="scroll-mt-24" />
      {error && <ErrorBanner text={error} onRetry={() => onPageChange(currentPage)} />}

      {loading && !list.length ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : !list.length ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><Globe className="h-6 w-6 text-slate-400" /></span>
          <p className="mt-3 text-base font-semibold text-slate-900">{query ? 'No pages match' : 'No pages yet'}</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{query ? 'Try another address or word from the title.' : 'Add a landing page to set its title, description and keywords.'}</p>
          {!query && <button onClick={onNewSeo} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add page</button>}
        </div>
      ) : view === 'keywords' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {keywords.map(c => {
            const s = seoScore(c);
            return (
              <button key={c.id ?? c.route} onClick={() => onEditSeo(c)} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300">
                <ScoreRing score={s} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900" dir="auto"><KeyRound className="h-3.5 w-3.5 shrink-0 text-[#007ac2]" /><span className="truncate">{c.primaryKeyword}</span></p>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500" dir="ltr">{decodeRoute(c.route)}</p>
                  {c.secondaryKeywords && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {String(c.secondaryKeywords).split(',').map((k: string) => k.trim()).filter(Boolean).slice(0, 5).map((k: string) => (
                        <span key={k} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600" dir="auto">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {!keywords.length && <p className="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">No page on screen has a main keyword yet.</p>}
        </div>
      ) : (
        <ul className={`relative space-y-3 transition-opacity ${loading ? 'pointer-events-none opacity-50' : ''}`} aria-busy={loading}>
          {loading && <li className="sticky top-24 z-10 mx-auto flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg"><Spinner light /> Loading page…</li>}
          {shown.map(({ c, score, issues }) => (
            <li key={c.id ?? c.route} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <span className="hidden sm:block"><Thumb url={c.heroImage} /></span>
                  <SnippetPreview c={c} />
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:w-[420px] lg:flex-nowrap lg:justify-end">
                  <ScoreRing score={score} />
                  <div className="min-w-0 flex-1 lg:max-w-[230px]">
                    <div className="flex flex-wrap gap-1.5">
                      {c.published !== false
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Published</span>
                        : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">Draft</span>}
                      {c.indexable === false && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20"><EyeOff className="h-3 w-3" />Noindex</span>}
                    </div>
                    <p className={`mt-1.5 flex items-start gap-1 text-xs ${issues.length ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {issues.length ? <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> : <CheckCircle className="mt-px h-3.5 w-3.5 shrink-0" />}
                      <span className="line-clamp-2">{issues.length ? issues.join(' · ') : 'All checks pass'}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a href={`${SITE}${c.route || '/'}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900" title="Open on the site" aria-label="Open on the site"><ExternalLink className="h-4 w-4" /></a>
                    <button onClick={() => onDeleteSeo(c.route)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-rose-50 hover:text-rose-600" title="Delete page" aria-label="Delete page"><Trash className="h-4 w-4" /></button>
                    <button onClick={() => onEditSeo(c)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"><Pencil className="h-4 w-4" /> Edit</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {!shown.length && <li className="rounded-2xl bg-white p-6 text-center text-sm text-emerald-700 ring-1 ring-slate-200">Every page on screen scores 80% or more.</li>}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:flex-row" aria-label="Pages">
          <span className="text-sm text-slate-500">Page {currentPage + 1} of {totalPages}{totalElements != null ? ` · ${num(totalElements)} pages in total` : ''}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 0 || loading} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>
            {pageNumbers(currentPage, totalPages).map((n, i) => n < 0
              ? <span key={`gap${i}`} className="px-1 text-slate-400">…</span>
              : <button key={n} onClick={() => goTo(n)} disabled={loading} aria-current={n === currentPage ? 'page' : undefined}
                  className={`hidden h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium sm:inline-flex ${n === currentPage ? 'bg-slate-900 text-white' : 'text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>{n + 1}</button>)}
            <button onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages - 1 || loading} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </nav>
      )}

      {writerOpen && <DescriptionWriter onClose={() => setWriterOpen(false)} onApplied={n => { notify(`Updated ${n} ${n === 1 ? 'page' : 'pages'}`); onPageChange(currentPage); }} />}
      <Toast toast={toast} />
    </div>
  );
};

/** Page buttons around the current one: 1 … 4 5 6 … 12 (-1 marks a gap). */
const pageNumbers = (current: number, total: number): number[] => {
  const set = new Set([0, total - 1, current - 1, current, current + 1].filter(n => n >= 0 && n < total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: number[] = [];
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) out.push(-1); out.push(n); });
  return out;
};

type Proposal = { id: number; route: string; lang: string; reason: string; currentOk: boolean;
  oldTitle?: string; newTitle?: string | null; oldDescription?: string; newDescription: string };

/** Preview professional descriptions for the pages that need them (or all pages) and apply the ones you keep. */
const DescriptionWriter: React.FC<{ onClose: () => void; onApplied: (n: number) => void }> = ({ onClose, onApplied }) => {
  const [scope, setScope] = React.useState<'low' | 'all'>('low');
  const [items, setItems] = React.useState<Proposal[] | null>(null);
  const [picked, setPicked] = React.useState<Set<number>>(new Set());
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async (s: 'low' | 'all') => {
    setItems(null); setErr('');
    try {
      const res = await adminFetch(`/api/admin/seo/descriptions/preview?scope=${s}`);
      const list: Proposal[] = Array.isArray(res?.proposals) ? res.proposals : [];
      setItems(list);
      // pages whose text is already good stay unticked: tick them yourself to replace them
      setPicked(new Set(list.filter(p => !p.currentOk).map(p => p.id)));
    } catch (e: any) {
      setErr(e?.message || 'Could not prepare the descriptions.');
    }
  }, []);
  React.useEffect(() => { load(scope); }, [scope, load]);

  const apply = async () => {
    if (!picked.size) return;
    setBusy(true); setErr('');
    try {
      const res = await adminFetch('/api/admin/seo/descriptions/apply', { method: 'POST', body: JSON.stringify({ scope, ids: [...picked] }) });
      onApplied(Number(res?.updated) || 0);
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Could not save the descriptions.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: number) => setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const all = items || [];
  const allPicked = all.length > 0 && all.every(p => picked.has(p.id));

  return (
    <Drawer eyebrow="SEO" title="Write descriptions" onClose={onClose} busy={busy} width="max-w-[760px]"
      headerExtra={
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <Segmented layoutId="desc-scope" value={scope} onChange={setScope} items={[
            { key: 'low', label: 'Pages that need it' },
            { key: 'all', label: 'All pages' },
          ]} />
          {all.length > 0 && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allPicked} onChange={e => setPicked(e.target.checked ? new Set(all.map(p => p.id)) : new Set())} className="h-4 w-4 rounded border-slate-300 text-[#007ac2]" />
              Select all
            </label>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{picked.size} of {all.length} selected</p>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={busy} className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Cancel</button>
            <button onClick={apply} disabled={busy || !picked.size} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white hover:bg-[#00619a] disabled:opacity-50">
              {busy ? <Spinner light /> : <Wand className="h-4 w-4" />} Apply to {picked.size} {picked.size === 1 ? 'page' : 'pages'}
            </button>
          </div>
        </div>
      }>
      <p className="mb-4 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-100">
        Each page gets a description of 120–160 characters in its own language, plus a new title where the current one is too short or too long.
        The text only promises what Hogicar offers on every booking. Pages whose text is already good are left unticked.
      </p>
      {err && <div className="mb-4"><ErrorBanner text={err} onRetry={() => load(scope)} /></div>}
      {items === null && !err ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : all.length === 0 && !err ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-slate-200">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
          <p className="mt-3 font-semibold text-slate-900">{scope === 'low' ? 'Every page already has a good description' : 'Nothing to change'}</p>
          {scope === 'low' && <button onClick={() => setScope('all')} className="mt-4 text-sm font-semibold text-[#007ac2]">See suggestions for all pages</button>}
        </div>
      ) : (
        <ul className="space-y-3">
          {all.map(p => (
            <li key={p.id}>
              <label className={`block cursor-pointer rounded-2xl bg-white p-4 ring-1 transition ${picked.has(p.id) ? 'ring-2 ring-[#007ac2]' : 'ring-slate-200 hover:ring-slate-300'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#007ac2]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate font-mono text-xs text-slate-500" dir="ltr">{decodeRoute(p.route)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${p.currentOk ? 'bg-slate-100 text-slate-600 ring-slate-500/20' : 'bg-amber-50 text-amber-800 ring-amber-600/20'}`}>{p.reason}</span>
                    </div>
                    {p.newTitle && (
                      <div className="mt-2 text-sm" dir="auto">
                        <p className="text-slate-400 line-through decoration-slate-300">{p.oldTitle || 'No title'}</p>
                        <p className="font-medium text-[#1a0dab]">{p.newTitle} <span className="text-xs font-normal text-slate-400">({p.newTitle.length})</span></p>
                      </div>
                    )}
                    <div className="mt-2 space-y-1 text-sm" dir="auto">
                      <p className="text-slate-400 line-through decoration-slate-300">{p.oldDescription || 'No description'}</p>
                      <p className="text-slate-800">{p.newDescription} <span className="text-xs text-slate-400">({p.newDescription.length})</span></p>
                    </div>
                  </div>
                </div>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
};
