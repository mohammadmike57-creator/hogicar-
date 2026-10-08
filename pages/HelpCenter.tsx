import * as React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Search from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import UserRound from 'lucide-react/dist/esm/icons/user-round';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Info from 'lucide-react/dist/esm/icons/info';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ThumbsUp from 'lucide-react/dist/esm/icons/thumbs-up';
import ThumbsDown from 'lucide-react/dist/esm/icons/thumbs-down';
import Mail from 'lucide-react/dist/esm/icons/mail';
import CalendarCog from 'lucide-react/dist/esm/icons/calendar-cog';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Check from 'lucide-react/dist/esm/icons/check';
import CornerDownLeft from 'lucide-react/dist/esm/icons/corner-down-left';
import SEOMetadata from '../components/SEOMetadata';
import { CONTACT_EMAIL, PUBLIC_BASE_URL } from '../lib/config';
import {
  HELP_ARTICLES, HELP_CATEGORIES, HelpArticle, HelpBlock, HelpCategory,
  articleBySlug, articleText, articleUrl, articlesIn, categoryBySlug, searchHelp, tokenize,
} from '../content/helpCenter';

const ICONS: Record<HelpCategory['icon'], React.ComponentType<{ className?: string }>> = {
  calendar: CalendarDays, refresh: RefreshCw, card: CreditCard, shield: ShieldCheck,
  key: KeyRound, user: UserRound, phone: Smartphone, briefcase: Briefcase,
};

const QUICK_SEARCHES = ['Cancel booking', 'Refund', 'Deposit', 'What to bring', 'Change dates', 'Voucher'];

/** Wraps matched query words in <mark>. */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const words = tokenize(query).filter(w => w.length > 1).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.join('|')})`, 'gi');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i} className="rounded bg-amber-100 px-0.5 text-inherit">{part}</mark> : part))}</>;
};

// ------------------------------------------------------------------ search box

const HelpSearch: React.FC<{ size?: 'lg' | 'md'; autoFocusShortcut?: boolean }> = ({ size = 'lg', autoFocusShortcut = true }) => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = React.useState(params.get('q') || '');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const hits = React.useMemo(() => searchHelp(query, 7), [query]);

  // "/" or Ctrl/⌘ K focuses the search, like modern docs sites.
  React.useEffect(() => {
    if (!autoFocusShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName || '');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [autoFocusShortcut]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  React.useEffect(() => setActive(0), [query]);

  const go = (a: HelpArticle) => {
    setOpen(false);
    navigate(articleUrl(a));
  };

  const submit = () => {
    if (hits[active]) return go(hits[active].article);
    if (query.trim()) {
      const next = new URLSearchParams(params);
      next.set('q', query.trim());
      setParams(next);
      setOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, Math.max(0, hits.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const showPanel = open && query.trim().length > 1;
  const lg = size === 'lg';

  return (
    <div ref={boxRef} className="relative w-full">
      <div className={`flex items-center gap-3 rounded-2xl bg-white ring-1 transition ${open ? 'ring-accent shadow-[0_18px_50px_-15px_rgba(2,24,64,0.45)]' : 'ring-slate-200 shadow-[0_12px_40px_-18px_rgba(2,24,64,0.45)]'} ${lg ? 'px-5' : 'px-4'}`}>
        <Search className={`${lg ? 'h-5 w-5' : 'h-4 w-4'} shrink-0 text-slate-400`} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="help-search-results"
          aria-activedescendant={showPanel && hits[active] ? `help-hit-${hits[active].article.slug}` : undefined}
          aria-label="Search the Help Center"
          placeholder="Search for answers – e.g. cancel, deposit, refund"
          className={`min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden ${lg ? 'h-14 text-base sm:h-16 sm:text-lg' : 'h-12 text-[15px]'}`}
        />
        {query ? (
          <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        ) : (
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-sans text-xs text-slate-500 sm:inline">/</kbd>
        )}
      </div>

      {showPanel && (
        <div id="help-search-results" role="listbox" className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl bg-white text-left shadow-[0_24px_60px_-12px_rgba(2,24,64,0.35)] ring-1 ring-black/5">
          {hits.length ? (
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {hits.map((h, i) => {
                const cat = categoryBySlug(h.article.category);
                return (
                  <li key={h.article.slug} id={`help-hit-${h.article.slug}`} role="option" aria-selected={i === active}>
                    <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(h.article)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${i === active ? 'bg-accent-50' : ''}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-slate-900"><Highlight text={h.article.title} query={query} /></span>
                        <span className="mt-0.5 block truncate text-sm text-slate-500"><Highlight text={h.article.summary} query={query} /></span>
                      </span>
                      <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 sm:inline">{cat?.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-800">No answers match “{query}”</p>
              <p className="mt-1 text-sm text-slate-500">Try other words, or <Link to="/contact" className="font-semibold text-accent hover:underline">contact us</Link>.</p>
            </div>
          )}
          <div className="hidden items-center gap-4 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500 sm:flex">
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1">↑</kbd><kbd className="rounded border border-slate-200 bg-white px-1">↓</kbd> navigate</span>
            <span className="inline-flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1">esc</kbd> close</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ shared pieces

const Crumbs: React.FC<{ items: { label: string; to?: string }[] }> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="text-sm">
    <ol className="flex flex-wrap items-center gap-1 text-slate-500">
      {items.map((c, i) => (
        <li key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
          {c.to ? <Link to={c.to} className="hover:text-accent hover:underline">{c.label}</Link> : <span aria-current="page" className="font-medium text-slate-700">{c.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

const ContactCta: React.FC<{ topic?: string }> = ({ topic }) => (
  <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#003580] to-[#00224f] p-6 text-white sm:p-8">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold">Still need help?</h2>
        <p className="mt-1 max-w-lg text-sm text-white/75">Our team usually replies within one business day. Include your booking reference so we can help faster.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={topic ? `/contact?topic=${topic}` : '/contact'} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#003580] hover:bg-blue-50">
          <Mail className="h-4 w-4" /> Contact us
        </Link>
        <Link to="/my-bookings" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/10">
          <CalendarCog className="h-4 w-4" /> Manage booking
        </Link>
      </div>
    </div>
  </section>
);

const CategoryNav: React.FC<{ current?: string }> = ({ current }) => (
  <nav aria-label="Help categories" className="space-y-1">
    {HELP_CATEGORIES.map(c => {
      const Icon = ICONS[c.icon];
      const active = c.slug === current;
      return (
        <Link key={c.slug} to={`/help/${c.slug}`}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-accent-50 font-semibold text-accent-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
          <Icon className={`h-4 w-4 ${active ? 'text-accent' : 'text-slate-400'}`} />
          <span className="flex-1">{c.title}</span>
          <span className="text-xs text-slate-400">{articlesIn(c.slug).length}</span>
        </Link>
      );
    })}
  </nav>
);

const ArticleRow: React.FC<{ a: HelpArticle; query?: string }> = ({ a, query = '' }) => (
  <Link to={articleUrl(a)} className="group flex items-center gap-4 rounded-2xl px-4 py-4 transition hover:bg-slate-50">
    <span className="min-w-0 flex-1">
      <span className="block text-[15px] font-semibold text-slate-900 group-hover:text-accent"><Highlight text={a.title} query={query} /></span>
      <span className="mt-0.5 block text-sm text-slate-500"><Highlight text={a.summary} query={query} /></span>
    </span>
    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
  </Link>
);

// ------------------------------------------------------------------ home

const HelpHome: React.FC = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const results = React.useMemo(() => (q ? searchHelp(q, 20) : []), [q]);
  const popular = HELP_ARTICLES.filter(a => a.popular);

  const faqLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: popular.map(a => ({ '@type': 'Question', name: a.title, acceptedAnswer: { '@type': 'Answer', text: articleText(a) } })),
  });

  return (
    <>
      <SEOMetadata
        title="Help Center | HogiCar Car Rental Support"
        description="Answers about booking, changing or cancelling, payments, deposits, insurance, pick-up and drop-off. Search the HogiCar Help Center or contact our team."
        canonicalUrl={`${PUBLIC_BASE_URL}/help`}
        noIndex={!!q}
        structuredData={faqLd}
      />
      <section className="relative bg-[#00224f] text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#0b5cc4_0%,_#003580_45%,_#00224f_100%)]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.06]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">HogiCar Help Center</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help you?</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/75">Search our guides or browse a topic below.</p>
          <div className="mx-auto mt-8 max-w-2xl"><HelpSearch /></div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK_SEARCHES.map(s => (
              <Link key={s} to={`/help?q=${encodeURIComponent(s)}`} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90 ring-1 ring-white/15 transition hover:bg-white/20">{s}</Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {q ? (
          <section aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{results.length ? `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”` : `No results for “${q}”`}</h2>
              <Link to="/help" className="text-sm font-semibold text-accent hover:underline">Clear search</Link>
            </div>
            {results.length ? (
              <div className="mt-6 divide-y divide-slate-100 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                {results.map(r => <ArticleRow key={r.article.slug} a={r.article} query={q} />)}
              </div>
            ) : (
              <p className="mt-3 text-slate-600">Try different words, browse the topics below, or contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">{CONTACT_EMAIL}</a>.</p>
            )}
          </section>
        ) : null}

        <section className={q ? 'mt-14' : ''} aria-labelledby="help-topics">
          <h2 id="help-topics" className="text-2xl font-bold text-slate-900">Browse by topic</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HELP_CATEGORIES.map(c => {
              const Icon = ICONS[c.icon];
              const count = articlesIn(c.slug).length;
              return (
                <Link key={c.slug} to={`/help/${c.slug}`}
                  className="group flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(2,24,64,0.45)] hover:ring-accent/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-accent transition group-hover:bg-accent group-hover:text-white"><Icon className="h-5 w-5" /></span>
                  <span className="mt-4 text-base font-bold text-slate-900">{c.title}</span>
                  <span className="mt-1 flex-1 text-sm text-slate-500">{c.description}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">{count} article{count === 1 ? '' : 's'} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" aria-labelledby="help-popular">
          <div>
            <h2 id="help-popular" className="text-2xl font-bold text-slate-900">Popular questions</h2>
            <div className="mt-6 divide-y divide-slate-100 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
              {popular.map(a => <ArticleRow key={a.slug} a={a} />)}
            </div>
          </div>
          <aside className="space-y-4 lg:pt-14">
            <Link to="/my-bookings" className="group flex items-start gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-accent/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CalendarCog className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-slate-900">Manage your booking</span>
                <span className="mt-0.5 block text-sm text-slate-500">Cancel, change dates, update details or open your voucher – instantly.</span>
              </span>
            </Link>
            <Link to="/contact" className="group flex items-start gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-accent/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent"><Mail className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-slate-900">Contact our team</span>
                <span className="mt-0.5 block text-sm text-slate-500">{CONTACT_EMAIL} · usually within one business day.</span>
              </span>
            </Link>
          </aside>
        </section>
      </div>
    </>
  );
};

// ------------------------------------------------------------------ category

const HelpCategoryPage: React.FC<{ category: HelpCategory }> = ({ category }) => {
  const list = articlesIn(category.slug);
  const Icon = ICONS[category.icon];
  return (
    <>
      <SEOMetadata
        title={`${category.title} | HogiCar Help Center`}
        description={`${category.description} ${list.slice(0, 3).map(a => a.title).join(' ')}`.slice(0, 158)}
        canonicalUrl={`${PUBLIC_BASE_URL}/help/${category.slug}`}
      />
      <HelpHeader crumbs={[{ label: 'Help Center', to: '/help' }, { label: category.title }]} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block"><div className="sticky top-24"><CategoryNav current={category.slug} /></div></aside>
        <div>
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent"><Icon className="h-6 w-6" /></span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{category.title}</h1>
              <p className="mt-1 text-slate-500">{category.description}</p>
            </div>
          </div>
          <div className="mt-8 divide-y divide-slate-100 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
            {list.map(a => <ArticleRow key={a.slug} a={a} />)}
          </div>
          <div className="mt-10"><ContactCta /></div>
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------------------------ article

const Block: React.FC<{ block: HelpBlock }> = ({ block }) => {
  switch (block.type) {
    case 'p':
      return <p className="leading-relaxed text-slate-700">{block.text}</p>;
    case 'list':
      return (
        <ul className="space-y-2">
          {block.items.map(i => (
            <li key={i} className="flex gap-3 leading-relaxed text-slate-700">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{i}
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="space-y-3">
          {block.items.map((i, n) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{n + 1}</span>
              <span className="pt-0.5 leading-relaxed text-slate-700">{i}</span>
            </li>
          ))}
        </ol>
      );
    case 'note': {
      const tone = {
        info: { cls: 'bg-blue-50 text-blue-900 ring-blue-200', icon: Info, label: 'Good to know' },
        tip: { cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200', icon: Lightbulb, label: 'Tip' },
        warning: { cls: 'bg-amber-50 text-amber-900 ring-amber-200', icon: AlertTriangle, label: 'Important' },
      }[block.tone];
      return (
        <div className={`flex gap-3 rounded-2xl p-4 ring-1 ${tone.cls}`}>
          <tone.icon className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed"><span className="font-semibold">{tone.label}: </span>{block.text}</p>
        </div>
      );
    }
    case 'actions':
      return (
        <div className="flex flex-wrap gap-2">
          {block.items.map((a, i) => (
            <Link key={a.to} to={a.to} className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${i === 0 ? 'bg-accent text-white hover:bg-accent-700' : 'text-slate-700 ring-1 ring-slate-300 hover:ring-slate-400'}`}>
              {a.label} <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      );
  }
};

const FEEDBACK_KEY = 'hogicar_help_feedback';

const Feedback: React.FC<{ slug: string }> = ({ slug }) => {
  const read = () => { try { return (JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}') as Record<string, string>)[slug]; } catch { return undefined; } };
  const [vote, setVote] = React.useState<string | undefined>(read);
  React.useEffect(() => setVote(read()), [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  const cast = (v: 'yes' | 'no') => {
    setVote(v);
    try {
      const all = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify({ ...all, [slug]: v }));
    } catch { /* storage blocked */ }
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: 'help_article_feedback', help_article: slug, helpful: v === 'yes' });
  };
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
      {vote ? (
        <p className="flex items-center gap-2 text-sm font-medium text-slate-700" role="status">
          <Check className="h-4 w-4 text-emerald-600" />
          {vote === 'yes' ? 'Thanks for your feedback!' : <>Thanks – sorry this didn’t help. <Link to="/contact" className="font-semibold text-accent hover:underline">Ask our team</Link>.</>}
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-800">Was this article helpful?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => cast('yes')} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:ring-emerald-400 hover:text-emerald-700"><ThumbsUp className="h-4 w-4" /> Yes</button>
            <button type="button" onClick={() => cast('no')} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:ring-red-300 hover:text-red-700"><ThumbsDown className="h-4 w-4" /> No</button>
          </div>
        </>
      )}
    </div>
  );
};

const CopyLink: React.FC = () => {
  const [done, setDone] = React.useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* blocked */ } }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-accent">
      {done ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />} {done ? 'Link copied' : 'Copy link'}
    </button>
  );
};

const TOPIC_FOR_CATEGORY: Record<string, string> = {
  booking: 'BOOKING', 'manage-booking': 'CHANGE_CANCEL', payments: 'PAYMENT', 'deposit-insurance': 'PAYMENT',
  'pick-up-drop-off': 'BOOKING', drivers: 'BOOKING', 'voucher-app': 'BOOKING', business: 'PARTNERSHIP',
};

const HelpArticlePage: React.FC<{ article: HelpArticle; category: HelpCategory }> = ({ article, category }) => {
  const related = (article.related || []).map(articleBySlug).filter((a): a is HelpArticle => !!a);
  const more = related.length ? related : articlesIn(category.slug).filter(a => a.slug !== article.slug).slice(0, 3);
  const url = `${PUBLIC_BASE_URL}${articleUrl(article)}`;
  const ld = JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: article.title, acceptedAnswer: { '@type': 'Answer', text: articleText(article) } }] },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Help Center', item: `${PUBLIC_BASE_URL}/help` },
        { '@type': 'ListItem', position: 2, name: category.title, item: `${PUBLIC_BASE_URL}/help/${category.slug}` },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
  ]);

  return (
    <>
      <SEOMetadata title={`${article.title} | HogiCar Help`} description={`${article.summary} ${articleText(article)}`.slice(0, 158)} canonicalUrl={url} structuredData={ld} />
      <HelpHeader crumbs={[{ label: 'Help Center', to: '/help' }, { label: category.title, to: `/help/${category.slug}` }, { label: article.title }]} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block"><div className="sticky top-24"><CategoryNav current={category.slug} /></div></aside>
        <div className="min-w-0">
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
            <p className="text-sm font-semibold text-accent">{category.title}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.1rem] sm:leading-tight">{article.title}</h1>
            <p className="mt-3 text-lg text-slate-500">{article.summary}</p>
            <div className="mt-8 space-y-6 border-t border-slate-100 pt-8">
              {article.body.map((b, i) => <Block key={i} block={b} />)}
            </div>
            <div className="mt-10 space-y-4">
              <Feedback slug={article.slug} />
              <div className="flex justify-end"><CopyLink /></div>
            </div>
          </article>

          {more.length > 0 && (
            <section className="mt-10" aria-labelledby="related-title">
              <h2 id="related-title" className="text-lg font-bold text-slate-900">Related articles</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {more.map(a => (
                  <Link key={a.slug} to={articleUrl(a)} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-accent/40">
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-accent">{a.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{a.summary}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <div className="mt-10"><ContactCta topic={TOPIC_FOR_CATEGORY[category.slug]} /></div>
        </div>
      </div>
    </>
  );
};

const HelpHeader: React.FC<{ crumbs: { label: string; to?: string }[] }> = ({ crumbs }) => (
  <div className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <Crumbs items={crumbs} />
      <div className="md:w-[380px]"><HelpSearch size="md" /></div>
    </div>
  </div>
);

const NotFound: React.FC = () => (
  <div className="mx-auto max-w-xl px-4 py-24 text-center">
    <SEOMetadata title="Article not found | HogiCar Help" description="This Help Center page doesn't exist." noIndex />
    <h1 className="text-2xl font-bold text-slate-900">We couldn’t find that page</h1>
    <p className="mt-2 text-slate-500">It may have moved. Try searching the Help Center instead.</p>
    <div className="mt-6"><HelpSearch size="md" /></div>
    <Link to="/help" className="mt-6 inline-block font-semibold text-accent hover:underline">Back to the Help Center</Link>
  </div>
);

// ------------------------------------------------------------------ router entry

const HelpCenter: React.FC = () => {
  const { categorySlug, articleSlug } = useParams();
  React.useEffect(() => { window.scrollTo({ top: 0 }); }, [categorySlug, articleSlug]);

  let content: React.ReactNode;
  if (!categorySlug) content = <HelpHome />;
  else {
    const category = categoryBySlug(categorySlug);
    if (!category) content = <NotFound />;
    else if (!articleSlug) content = <HelpCategoryPage category={category} />;
    else {
      const article = articleBySlug(articleSlug);
      content = article && article.category === category.slug ? <HelpArticlePage article={article} category={category} /> : <NotFound />;
    }
  }
  return <div className="min-h-screen bg-slate-50 pb-16">{content}</div>;
};

export default HelpCenter;
