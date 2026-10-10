import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Compass from 'lucide-react/dist/esm/icons/compass';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';
import { articlePath, blogImage, cleanExcerpt, formatBlogDate, readingLabel } from '../utils/blog';

interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage: string;
  thumbnailImage?: string;
  category?: { name: string; slug: string };
  authorName: string;
  publishedAt: string;
  readingTime?: string;
  lang?: string;
}

const PAGE_SIZE = 12;

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const Meta: React.FC<{ article: BlogArticle; light?: boolean }> = ({ article, light }) => {
  const reading = readingLabel(article.content, article.readingTime);
  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${light ? 'text-white/80' : 'text-slate-500'}`}>
      <span>{formatBlogDate(article.publishedAt)}</span>
      {reading && (
        <>
          <span aria-hidden="true" className={light ? 'text-white/40' : 'text-slate-300'}>•</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />{reading}</span>
        </>
      )}
    </div>
  );
};

const CategoryChip: React.FC<{ name?: string; light?: boolean }> = ({ name, light }) => (
  <span className={`inline-block text-[11px] font-bold uppercase tracking-[0.12em] ${light ? 'text-[#FFB25B]' : 'text-[#F57C00]'}`}>
    {name || 'Travel guide'}
  </span>
);

const BlogIndex: React.FC = () => {
  const { categorySlug, tag, author } = useParams<{ categorySlug?: string; tag?: string; author?: string }>();
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  const [categories, setCategories] = React.useState<{ id: number; name: string; slug: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeSearch, setActiveSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  const activeCategory = categories.find(c => c.slug === categorySlug);
  const heading = categorySlug
    ? (activeCategory?.name || titleCase(categorySlug))
    : tag ? `Guides tagged “${titleCase(tag)}”`
    : author ? `Guides by ${decodeURIComponent(author)}`
    : 'Travel guides for the road ahead';

  React.useEffect(() => { setPage(0); setActiveSearch(''); setSearchQuery(''); }, [categorySlug, tag, author]);

  React.useEffect(() => {
    fetch(`${api.baseUrl}/api/public/blog/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
        let url: string;
        if (activeSearch) {
          params.set('q', activeSearch);
          url = `${api.baseUrl}/api/public/blog/search?${params}`;
        } else {
          if (categorySlug) params.set('category', categorySlug);
          if (tag) params.set('tag', tag);
          if (author) params.set('author', decodeURIComponent(author));
          url = `${api.baseUrl}/api/public/blog/articles?${params}`;
        }
        const data = await (await fetch(url)).json();
        if (cancelled) return;
        setArticles(data.content || []);
        setTotalPages(Math.max(data.totalPages || 1, 1));
        setTotal(data.totalElements ?? (data.content || []).length);
      } catch (error) {
        console.error('Error fetching blog data:', error);
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [categorySlug, tag, author, page, activeSearch]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveSearch(searchQuery.trim());
  };

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFrontPage = page === 0 && !categorySlug && !tag && !author && !activeSearch;
  const featured = isFrontPage ? articles[0] : undefined;
  const grid = featured ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-white">
      <SEOMetadata
        title={categorySlug ? `${heading} | Hogicar Travel Guides` : 'Car Rental Travel Guides & Driving Tips | Hogicar Blog'}
        description="Destination guides, driving tips, airport pick-up advice and road trip ideas to help you plan your trip and choose the right rental car."
      />

      {/* Header */}
      <header className="relative overflow-hidden bg-[#0B2545] text-white">
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#007ac2]/30 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10 md:pt-36 md:pb-14">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            {categorySlug || tag || author ? (
              <>
                <Link to="/blog" className="hover:text-white">Travel guides</Link>
                <ChevronRight size={12} aria-hidden="true" />
                <span className="text-white/90">{heading}</span>
              </>
            ) : <span className="text-white/90">Travel guides</span>}
          </nav>
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFB25B]">
            <Compass size={14} aria-hidden="true" /> Hogicar Journal
          </p>
          <h1 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight">
            {heading}
          </h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-white/75">
            Practical advice on driving routes, airport pick-up, parking and choosing the right car, written to help you plan with confidence.
          </p>

          <form onSubmit={submitSearch} role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/20">
            <SearchIcon size={18} className="ml-3 shrink-0 text-slate-400" aria-hidden="true" />
            <label htmlFor="blog-search" className="sr-only">Search travel guides</label>
            <input
              id="blog-search"
              type="search"
              placeholder="Search guides, e.g. Dead Sea, parking, airport"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="shrink-0 rounded-xl bg-[#F57C00] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#E06F00]">
              Search
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="relative border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Guide categories" className="-mb-px flex gap-6 overflow-x-auto text-sm font-semibold [scrollbar-width:none]">
              {[{ id: 0, name: 'All guides', slug: '' }, ...categories].map(cat => {
                const active = cat.slug ? categorySlug === cat.slug : !categorySlug && !tag && !author;
                return (
                  <Link
                    key={cat.id}
                    to={cat.slug ? `/blog/category/${cat.slug}` : '/blog'}
                    aria-current={active ? 'page' : undefined}
                    className={`whitespace-nowrap border-b-2 py-4 transition-colors ${active ? 'border-[#F57C00] text-white' : 'border-transparent text-white/60 hover:text-white'}`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {activeSearch && !loading && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5">
            <p className="text-sm text-slate-700">
              <span className="font-bold text-slate-900">{total}</span> {total === 1 ? 'guide' : 'guides'} for “{activeSearch}”
            </p>
            <button type="button" onClick={() => { setActiveSearch(''); setSearchQuery(''); setPage(0); }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#007ac2] hover:underline">
              <X size={14} aria-hidden="true" /> Clear search
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] rounded-2xl bg-slate-100" />
                <div className="mt-5 h-3 w-24 rounded bg-slate-100" />
                <div className="mt-3 h-5 w-full rounded bg-slate-100" />
                <div className="mt-2 h-5 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center">
            <SearchIcon size={36} className="mx-auto text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">No guides found</h2>
            <p className="mt-1 text-sm text-slate-500">Try another word or browse all guides.</p>
            <Link to="/blog" onClick={() => setActiveSearch('')} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#007ac2] hover:underline">
              All guides <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            {featured && (
              <Link to={articlePath(featured.slug, featured.lang)} className="group mb-14 grid overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200/70 transition hover:shadow-xl hover:shadow-slate-200 md:grid-cols-2">
                <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[360px]">
                  <img src={blogImage(featured.featuredImage)} alt={featured.title} fetchPriority="high"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-10">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Featured guide · <CategoryChip name={featured.category?.name} /></p>
                  <h2 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-slate-900 group-hover:text-[#003580]">
                    {featured.title}
                  </h2>
                  {cleanExcerpt(featured.excerpt, featured.content) && <p className="mt-4 text-base leading-relaxed text-slate-600 line-clamp-3">{cleanExcerpt(featured.excerpt, featured.content)}</p>}
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <Meta article={featured} />
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#007ac2]">
                      Read guide <ArrowRight size={16} className="transition group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {featured && grid.length > 0 && (
              <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Latest guides</h2>
            )}

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((article) => (
                <article key={article.id} className="group">
                  <Link to={articlePath(article.slug, article.lang)} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                      <img src={blogImage(article.thumbnailImage || article.featuredImage)} alt={article.title} loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    </div>
                    <div className="mt-5">
                      <CategoryChip name={article.category?.name} />
                      <h3 className="mt-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-[#003580] line-clamp-2">
                        {article.title}
                      </h3>
                      {cleanExcerpt(article.excerpt, article.content) && <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">{cleanExcerpt(article.excerpt, article.content)}</p>}
                      <div className="mt-4"><Meta article={article} /></div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pages" className="mt-16 flex items-center justify-center gap-1.5">
                <button type="button" disabled={page === 0} onClick={() => goToPage(page - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 disabled:opacity-30" aria-label="Previous page">
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const show = i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1;
                  const gap = !show && (i === 1 || i === totalPages - 2);
                  if (!show) return gap ? <span key={i} className="px-1 text-slate-400">…</span> : null;
                  return (
                    <button key={i} type="button" onClick={() => goToPage(i)} aria-current={i === page ? 'page' : undefined}
                      className={`h-10 min-w-10 rounded-full px-3 text-sm font-bold transition ${i === page ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {i + 1}
                    </button>
                  );
                })}
                <button type="button" disabled={page + 1 >= totalPages} onClick={() => goToPage(page + 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 disabled:opacity-30" aria-label="Next page">
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </>
        )}

        {/* Booking band */}
        <section className="mt-20 overflow-hidden rounded-3xl bg-[#0B2545] px-6 py-10 sm:px-12 sm:py-12 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Planned the route? Find the car.</h2>
              <p className="mt-2 text-white/70">Compare rental cars from local and international suppliers at airports and city locations, and book online.</p>
            </div>
            <Link to="/" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F57C00] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#E06F00]">
              Search rental cars <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BlogIndex;
