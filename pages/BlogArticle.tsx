import * as React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import LinkIcon from 'lucide-react/dist/esm/icons/link-2';
import Check from 'lucide-react/dist/esm/icons/check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import ListIcon from 'lucide-react/dist/esm/icons/list';
import Car from 'lucide-react/dist/esm/icons/car';
import SEOMetadata from '../components/SEOMetadata';
import { api, fetchRelatedBlogs } from '../api';
import { API_BASE_URL, PUBLIC_BASE_URL } from '../lib/config';
import { BlogArticle as BlogArticleType } from '../types';
import { articlePath, blogImage, cleanExcerpt, displayAuthor, formatBlogDate, prepareArticle, readingLabel, routeLabel } from '../utils/blog';

const XLogo: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const parseJsonArray = (value?: string) => {
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};
const parseJsonObject = (value?: string) => {
  if (!value) return null;
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' ? parsed : null; } catch { return null; }
};

/** Thin bar at the top of the page that fills as the article is read. */
const ReadingProgress: React.FC<{ target: React.RefObject<HTMLElement> }> = ({ target }) => {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => {
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      setProgress(Math.min(1, Math.max(0, -rect.top / Math.max(total, 1))));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [target]);
  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-[3px] bg-transparent" aria-hidden="true">
      <div className="h-full origin-left bg-[#F57C00] transition-transform duration-100" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
};

const BlogArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [article, setArticle] = React.useState<BlogArticleType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [moreArticles, setMoreArticles] = React.useState<BlogArticleType[]>([]);
  const [activeId, setActiveId] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [tocOpen, setTocOpen] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const articleRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${api.baseUrl}/api/public/blog/articles/${slug}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (!cancelled) setArticle(data); })
      .catch(() => { if (!cancelled) setArticle(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [slug]);

  // Related guides first, topped up with the latest ones.
  React.useEffect(() => {
    if (!article) return;
    let cancelled = false;
    (async () => {
      const lang = (article as any).lang as string | undefined;
      const related = await fetchRelatedBlogs(article.primaryRoute?.route, article.country, article.relatedAirports?.[0]?.iataCode, 6, lang);
      let pool = related.filter(a => a.slug !== article.slug);
      if (pool.length < 3) {
        try {
          const recent = await (await fetch(`${api.baseUrl}/api/public/blog/recent`)).json();
          if (Array.isArray(recent)) pool = [...pool, ...recent.filter((a: BlogArticleType) => a.slug !== article.slug && !pool.some(p => p.slug === a.slug))];
        } catch { /* ignore */ }
      }
      if (!cancelled) setMoreArticles(pool.slice(0, 3));
    })();
    return () => { cancelled = true; };
  }, [article]);

  const hasFaqs = React.useMemo(() => parseJsonArray(article?.faqJson).some((f: any) => f?.question && f?.answer), [article?.faqJson]);
  const prepared = React.useMemo(() => prepareArticle(article?.content, { stripFaq: hasFaqs }), [article?.content, hasFaqs]);

  // Highlight the section being read in the table of contents.
  React.useEffect(() => {
    if (!prepared.toc.length || !bodyRef.current) return;
    const headings = prepared.toc.map(t => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: '-100px 0px -65% 0px' });
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [prepared]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-28 animate-pulse" aria-busy="true">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-3 w-40 rounded bg-slate-100" />
          <div className="mt-6 h-10 w-full rounded bg-slate-100" />
          <div className="mt-3 h-10 w-2/3 rounded bg-slate-100" />
          <div className="mt-6 h-4 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-10"><div className="aspect-[21/9] rounded-3xl bg-slate-100" /></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white px-4 pt-40 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F57C00]">Travel guides</p>
        <h1 className="mt-3 text-3xl font-extrabold text-[#0B2545]">We couldn’t find that guide</h1>
        <p className="mt-2 text-slate-600">It may have been moved or renamed.</p>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#0B2545] px-5 py-3 text-sm font-bold text-white">
          <ArrowLeft size={16} aria-hidden="true" /> Browse all guides
        </Link>
      </div>
    );
  }

  const isArabic = (article as any).lang === 'ar' || location.pathname.startsWith('/ar/');
  const blogHome = isArabic ? '/ar/blog' : '/blog';
  const faqs = parseJsonArray(article.faqJson).filter((f: any) => f?.question && f?.answer);
  const primaryRoute = article.primaryRoute;
  const connections = [
    ...(primaryRoute ? [{ path: primaryRoute.route, label: routeLabel(primaryRoute.destinationName || primaryRoute.route) }] : []),
    ...((article.secondaryRoutes || []).map(r => ({ path: r.route, label: routeLabel(r.destinationName || r.route) }))),
  ].filter((c, i, all) => c.path && all.findIndex(x => x.path === c.path) === i);
  const destination = primaryRoute?.destinationName || article.destinations?.split(',')[0]?.trim() || '';
  const bookingPath = primaryRoute?.route || (destination ? `/car-rental-${destination.toLowerCase().replace(/\s+/g, '-')}` : '/');

  const heroImage = blogImage(article.featuredImage, primaryRoute?.heroImage ? blogImage(primaryRoute.heroImage) : undefined);
  const mobileImage = blogImage(article.mobileImage, heroImage);
  const ogImage = article.openGraphImage || article.twitterCardImage || article.featuredImage;
  const reading = readingLabel(article.content, article.readingTime);
  const published = formatBlogDate(article.publishedAt, 'long');
  const updated = article.updatedAt && formatBlogDate(article.updatedAt, 'long') !== published ? formatBlogDate(article.updatedAt, 'long') : '';
  const author = displayAuthor(article.authorName);
  const summary = cleanExcerpt(article.excerpt, article.content, 220);
  const canonical = article.canonicalUrl || `${PUBLIC_BASE_URL}${articlePath(article.slug, (article as any).lang)}`;
  const shareUrl = `${PUBLIC_BASE_URL}${location.pathname}`;

  const articleSchema = parseJsonObject(article.articleSchemaJson) || {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    image: ogImage ? blogImage(ogImage) : undefined,
    author: { '@type': 'Organization', name: author, url: PUBLIC_BASE_URL },
    publisher: { '@type': 'Organization', name: 'Hogicar', logo: { '@type': 'ImageObject', url: `${PUBLIC_BASE_URL}/android-chrome-512x512.png` } },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    mainEntityOfPage: canonical,
    description: article.seoDescription || article.excerpt,
  };
  const faqSchema = parseJsonObject(article.faqSchemaJson) || (faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f: any) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  } : null);
  const breadcrumbSchema = parseJsonObject(article.breadcrumbSchemaJson) || {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Travel guides', item: `${PUBLIC_BASE_URL}${blogHome}` },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
    ],
  };

  const copyLink = async () => {
    try {
      if (navigator.share && window.matchMedia('(max-width: 768px)').matches) {
        await navigator.share({ title: article.title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* user cancelled */ }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  const shareButtons = (
    <div className="flex items-center gap-2">
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
        aria-label="Share on Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-[#0B2545] hover:bg-[#0B2545] hover:text-white">
        <Facebook size={15} />
      </a>
      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer"
        aria-label="Share on X" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-[#0B2545] hover:bg-[#0B2545] hover:text-white">
        <XLogo size={14} />
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer"
        aria-label="Share on LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-[#0B2545] hover:bg-[#0B2545] hover:text-white">
        <Linkedin size={15} />
      </a>
      <button type="button" onClick={copyLink} aria-label="Copy link"
        className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${copied ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-[#0B2545] hover:text-[#0B2545]'}`}>
        {copied ? <Check size={14} /> : <LinkIcon size={14} />} {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white" dir={isArabic ? 'rtl' : undefined}>
      <SEOMetadata
        title={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt}
        ogImage={ogImage ? (ogImage.startsWith('/') && !ogImage.startsWith('http') ? `${API_BASE_URL}${ogImage}` : ogImage) : undefined}
        canonicalUrl={canonical}
        schema={faqSchema ? [articleSchema, faqSchema, breadcrumbSchema] : [articleSchema, breadcrumbSchema]}
      />
      <ReadingProgress target={articleRef} />

      <article ref={articleRef}>
        {/* Header */}
        <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 text-center">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-[#0B2545]">Home</Link>
            <ChevronRight size={12} aria-hidden="true" className={isArabic ? 'rotate-180' : ''} />
            <Link to={blogHome} className="hover:text-[#0B2545]">Travel guides</Link>
            {article.category?.name && (
              <>
                <ChevronRight size={12} aria-hidden="true" className={isArabic ? 'rotate-180' : ''} />
                <Link to={`/blog/category/${article.category.slug}`} className="hover:text-[#0B2545]">{article.category.name}</Link>
              </>
            )}
          </nav>
          {article.category?.name && (
            <Link to={`/blog/category/${article.category.slug}`} className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F57C00] hover:underline">
              {article.category.name}
            </Link>
          )}
          <h1 className="mt-3 text-[2rem] sm:text-4xl md:text-[3.1rem] font-extrabold leading-[1.12] tracking-tight text-[#0B2545]">
            {article.title}
          </h1>
          {summary && (
            <p className="mx-auto mt-5 max-w-2xl text-lg md:text-xl leading-relaxed text-slate-600">{summary}</p>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B2545] text-xs font-bold text-white" aria-hidden="true">
                {author.charAt(0)}
              </span>
              <span className="font-semibold text-slate-800">{author}</span>
            </span>
            {published && <span>{updated ? `Updated ${updated}` : published}</span>}
            {reading && <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" />{reading}</span>}
          </div>
        </header>

        <figure className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
          <picture>
            <source media="(max-width: 640px)" srcSet={mobileImage} />
            <img src={heroImage} alt={article.imageAltText || article.title} fetchPriority="high"
              className="aspect-[16/10] sm:aspect-[21/9] w-full rounded-3xl object-cover bg-slate-100" />
          </picture>
          {article.imageCaption && <figcaption className="mt-3 text-center text-xs text-slate-500">{article.imageCaption}</figcaption>}
        </figure>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 md:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div className="min-w-0 max-w-[720px] lg:mx-0 mx-auto">
            {/* Contents on small screens */}
            {prepared.toc.length > 1 && (
              <div className="mb-10 rounded-2xl border border-slate-200 lg:hidden">
                <button type="button" onClick={() => setTocOpen(o => !o)} aria-expanded={tocOpen}
                  className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-[#0B2545]">
                  <span className="inline-flex items-center gap-2"><ListIcon size={16} aria-hidden="true" /> In this guide</span>
                  <ChevronDown size={18} className={`transition ${tocOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {tocOpen && (
                  <ol className="border-t border-slate-100 px-5 py-3">
                    {prepared.toc.map((item, i) => (
                      <li key={item.id}>
                        <button type="button" onClick={() => scrollTo(item.id)} className="flex w-full gap-3 py-2 text-left text-sm text-slate-600 hover:text-[#0B2545]">
                          <span className="w-5 shrink-0 font-semibold text-slate-400">{i + 1}</span>{item.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            <div ref={bodyRef} className="article-body" dangerouslySetInnerHTML={{ __html: prepared.html }} />

            {faqs.length > 0 && (
              <section className="mt-16" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-2xl md:text-[1.9rem] font-extrabold tracking-tight text-[#0B2545]">Frequently asked questions</h2>
                <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                  {faqs.map((faq: any, idx: number) => (
                    <details key={idx} className="group py-1" open={idx === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base md:text-lg font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-open:rotate-180 group-open:bg-[#0B2545] group-open:text-white">
                          <ChevronDown size={16} aria-hidden="true" />
                        </span>
                      </summary>
                      <p className="pb-5 pr-10 text-slate-600 leading-relaxed">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {connections.length > 0 && (
              <section className="mt-14" aria-labelledby="destinations-heading">
                <h2 id="destinations-heading" className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Car rental for this trip</h2>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {connections.map(route => (
                    <Link key={route.path} to={route.path}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0B2545] hover:bg-[#0B2545] hover:text-white">
                      <MapPin size={14} aria-hidden="true" /> {route.label}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Share + author */}
            <div className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-slate-900">Share this guide</span>
              {shareButtons}
            </div>
            <div className="mt-8 flex gap-4 rounded-2xl bg-slate-50 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B2545] text-base font-bold text-white" aria-hidden="true">
                {author.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{author}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  The Hogicar team writes practical guides on driving, pick-up and choosing a rental car. Spotted something out of date? Email{' '}
                  <a href="mailto:business@hogicar.com" className="font-semibold text-[#007ac2] hover:underline">business@hogicar.com</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {prepared.toc.length > 1 && (
                <nav aria-label="In this guide">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">In this guide</p>
                  <ol className="space-y-0.5 border-l border-slate-200">
                    {prepared.toc.map(item => (
                      <li key={item.id}>
                        <button type="button" onClick={() => scrollTo(item.id)}
                          className={`-ml-px block w-full border-l-2 py-1.5 pl-4 text-left text-sm leading-snug transition ${activeId === item.id ? 'border-[#F57C00] font-semibold text-[#0B2545]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <div className="overflow-hidden rounded-2xl bg-[#0B2545] p-6 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10" aria-hidden="true"><Car size={20} /></span>
                <p className="mt-4 text-lg font-bold leading-snug">{destination ? `Need a car in ${destination}?` : 'Need a rental car?'}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">Compare cars from local and international suppliers for your dates.</p>
                <Link to={bookingPath} className="mt-5 flex items-center justify-center gap-1.5 rounded-xl bg-[#F57C00] py-3 text-sm font-bold text-white transition hover:bg-[#E06F00]">
                  Compare cars <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Share</p>
                {shareButtons}
              </div>
            </div>
          </aside>
        </div>
      </article>

      {/* Booking band (mobile and after the article) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 lg:hidden">
        <div className="rounded-3xl bg-[#0B2545] p-7 text-white">
          <p className="text-xl font-bold">{destination ? `Need a car in ${destination}?` : 'Need a rental car?'}</p>
          <p className="mt-1.5 text-sm text-white/70">Compare cars from local and international suppliers for your dates.</p>
          <Link to={bookingPath} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#F57C00] px-5 py-3 text-sm font-bold text-white">
            Compare cars <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {moreArticles.length > 0 && (
        <section className="mt-20 border-t border-slate-100 bg-slate-50/70 py-16" aria-labelledby="more-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="more-heading" className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0B2545]">Keep reading</h2>
              <Link to={blogHome} className="inline-flex items-center gap-1 text-sm font-bold text-[#007ac2] hover:underline">
                All guides <ArrowRight size={15} aria-hidden="true" className={isArabic ? 'rotate-180' : ''} />
              </Link>
            </div>
            <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {moreArticles.map(more => (
                <Link key={more.slug} to={articlePath(more.slug, (more as any).lang)} className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                    <img src={blogImage(more.thumbnailImage || more.featuredImage)} alt={more.title} loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F57C00]">{more.category?.name || 'Travel guide'}</p>
                  <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900 group-hover:text-[#003580] line-clamp-2">{more.title}</h3>
                  <p className="mt-2 text-xs text-slate-500">{[formatBlogDate(more.publishedAt), readingLabel(more.content, more.readingTime)].filter(Boolean).join(' · ')}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogArticle;
