import * as React from 'react';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import { Link } from 'react-router-dom';
import { fetchRelatedBlogs, fetchHomepageFeaturedBlogs } from '../api';
import { BlogArticle } from '../types';
import { blogImage, cleanExcerpt, displayAuthor, formatBlogDate, readingLabel, routeLabel } from '../utils/blog';

interface LatestTravelGuidesProps {
  route?: string;
  country?: string;
  airport?: string;
  destination?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
  variant?: 'DEFAULT' | 'HOMEPAGE';
}

/** Uploaded hero images come in resized copies; other images are used as they are. */
const imageSet = (url: string): string | undefined => {
  if (!url.includes('/uploads/hero/')) return undefined;
  if (url.toLowerCase().endsWith('.webp')) {
    return `${url.replace('.webp', '_thumb.webp')} 400w, ${url.replace('.webp', '_medium.webp')} 800w, ${url.replace('.webp', '_large.webp')} 1600w`;
  }
  return `${url.replace(/\.(png|jpg|jpeg)/i, '_thumb.png')} 400w, ${url.replace(/\.(png|jpg|jpeg)/i, '_medium.png')} 800w, ${url.replace(/\.(png|jpg|jpeg)/i, '_large.png')} 1600w`;
};

const LatestTravelGuides: React.FC<LatestTravelGuidesProps> = ({
  route = '/',
  country,
  airport,
  destination,
  limit = 6,
  title,
  subtitle,
  variant,
}) => {
  const isArabic = route.startsWith('/ar') || window.location.pathname.startsWith('/ar');
  const lang = isArabic ? 'ar' : 'en';
  const isHomepage = variant === 'HOMEPAGE' || route === '/' || route === '/ar' || route === '/ar/';
  // Landing pages without a destination name ("/car-rental-amman") still get a proper heading.
  const fromRoute = routeLabel(route);
  const place = destination || (!isHomepage && fromRoute.startsWith('Car rental in ') ? fromRoute.slice('Car rental in '.length) : '');
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  const [loading, setLoading] = React.useState(true);

  const t = {
    eyebrow: isArabic ? 'أدلة السفر' : 'Travel guides',
    title: title || (isArabic
      ? (isHomepage ? 'أحدث أدلة ونصائح السفر' : (place ? `دليلك للقيادة في ${place}` : 'أدلة ذات صلة'))
      : (isHomepage ? 'Plan your trip with our travel guides' : (place ? `Your guide to driving in ${place}` : 'Related travel guides'))),
    subtitle: subtitle || (isArabic
      ? 'نصائح عملية حول طرق القيادة والاستلام من المطار والمواقف واختيار السيارة المناسبة.'
      : place
        ? `Practical advice on routes, parking, airport pick-up and choosing the right car in ${place}.`
        : 'Practical advice on driving routes, airport pick-up, parking and choosing the right rental car.'),
    all: isArabic ? 'كل الأدلة' : 'All guides',
    read: isArabic ? 'اقرأ الدليل' : 'Read guide',
    featured: isArabic ? 'دليل مميز' : 'Featured guide',
    fallbackCategory: isArabic ? 'دليل سفر' : 'Travel guide',
  };

  React.useEffect(() => {
    let cancelled = false;
    const loadBlogs = async () => {
      setLoading(true);
      try {
        let data: BlogArticle[] = [];
        if (isHomepage) {
          data = (await fetchHomepageFeaturedBlogs()).filter(a => !a.lang || a.lang === lang);
        } else {
          // The page address lets the server match guides written for this page, then its city and country.
          data = await fetchRelatedBlogs(route !== '/' ? route : destination, country, airport, limit, lang);
        }
        if (!cancelled) setArticles(data.slice(0, limit));
      } catch (error) {
        console.error('Error loading travel guides:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadBlogs();
    return () => { cancelled = true; };
  }, [route, country, airport, limit, lang, destination, isHomepage]);

  if (!loading && articles.length === 0) return null;

  const blogHome = isArabic ? '/ar/blog' : '/blog';
  const linkFor = (a: BlogArticle) => (isArabic || (a as any).lang === 'ar' ? `/ar/blog/${a.slug}` : `/blog/${a.slug}`);
  const metaFor = (a: BlogArticle) => [formatBlogDate(a.publishedAt), readingLabel(a.content, a.readingTime)].filter(Boolean);

  const [featured, ...rest] = articles;
  const side = rest.slice(0, 4);
  const below = rest.slice(4);

  return (
    <section className="bg-slate-50/70 py-16 md:py-24 border-y border-slate-100" dir={isArabic ? 'rtl' : undefined} aria-labelledby="travel-guides-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F57C00]">
              <BookOpen size={14} aria-hidden="true" /> {t.eyebrow}
            </p>
            <h2 id="travel-guides-heading" className="mt-3 text-3xl md:text-[2.5rem] font-extrabold leading-tight tracking-tight text-[#0B2545]">
              {t.title}
            </h2>
            <p className="mt-3 text-base md:text-lg leading-relaxed text-slate-600">{t.subtitle}</p>
          </div>
          <Link to={blogHome}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0B2545] transition hover:border-[#0B2545] hover:bg-[#0B2545] hover:text-white md:self-auto">
            {t.all}
            <ArrowRight size={16} aria-hidden="true" className={`transition group-hover:translate-x-0.5 ${isArabic ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-8 lg:grid-cols-12" aria-busy="true">
            <div className="animate-pulse lg:col-span-7">
              <div className="aspect-[16/10] rounded-3xl bg-slate-200/70" />
              <div className="mt-5 h-6 w-3/4 rounded bg-slate-200/70" />
            </div>
            <div className="space-y-6 lg:col-span-5">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex animate-pulse gap-4">
                  <div className="h-24 w-32 shrink-0 rounded-2xl bg-slate-200/70" />
                  <div className="flex-1 space-y-2 pt-2"><div className="h-4 w-full rounded bg-slate-200/70" /><div className="h-4 w-2/3 rounded bg-slate-200/70" /></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-8 ${side.length ? 'lg:grid-cols-12 lg:gap-10' : ''}`}>
              {/* Featured guide */}
              <Link to={linkFor(featured)} className={`group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/80 transition hover:shadow-xl hover:shadow-slate-200/70 ${side.length ? 'lg:col-span-7' : ''}`}>
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img src={blogImage(featured.featuredImage)} srcSet={imageSet(blogImage(featured.featuredImage))}
                    sizes="(max-width: 1024px) 100vw, 700px" alt={featured.imageAltText || featured.title} loading="lazy" decoding="async"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <span className={`absolute top-4 ${isArabic ? 'right-4' : 'left-4'} rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0B2545] shadow-sm`}>
                    {t.featured}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F57C00]">{featured.category?.name || t.fallbackCategory}</p>
                  <h3 className="mt-2 text-2xl md:text-[1.75rem] font-extrabold leading-tight tracking-tight text-slate-900 group-hover:text-[#003580]">
                    {featured.title}
                  </h3>
                  {cleanExcerpt(featured.excerpt, featured.content) && (
                    <p className="mt-3 text-base leading-relaxed text-slate-600 line-clamp-3">{cleanExcerpt(featured.excerpt, featured.content)}</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B2545] text-[11px] font-bold text-white" aria-hidden="true">
                        {displayAuthor(featured.authorName).charAt(0)}
                      </span>
                      <span className="font-semibold text-slate-700">{displayAuthor(featured.authorName)}</span>
                      {metaFor(featured).map(m => <span key={m}>· {m}</span>)}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#007ac2]">
                      {t.read} <ArrowUpRight size={16} aria-hidden="true" className={isArabic ? '-scale-x-100' : ''} />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Compact list */}
              {side.length > 0 && (
                <ul className="flex flex-col divide-y divide-slate-200 lg:col-span-5">
                  {side.map(article => (
                    <li key={article.id || article.slug} className="py-5 first:pt-0 last:pb-0">
                      <Link to={linkFor(article)} className="group flex gap-4 sm:gap-5">
                        <div className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-36">
                          <img src={blogImage(article.thumbnailImage || article.featuredImage)} alt={article.title} loading="lazy" decoding="async"
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F57C00]">{article.category?.name || t.fallbackCategory}</p>
                          <h3 className="mt-1 text-base sm:text-lg font-bold leading-snug text-slate-900 line-clamp-2 group-hover:text-[#003580]">{article.title}</h3>
                          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                            {metaFor(article).map((m, i) => (
                              <span key={m} className="inline-flex items-center gap-1">
                                {i > 0 && <span aria-hidden="true">·</span>}
                                {i === 1 && <Clock size={12} aria-hidden="true" />}{m}
                              </span>
                            ))}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {below.length > 0 && (
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {below.map(article => (
                  <Link key={article.id || article.slug} to={linkFor(article)} className="group block">
                    <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                      <img src={blogImage(article.featuredImage)} alt={article.title} loading="lazy" decoding="async"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    </div>
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F57C00]">{article.category?.name || t.fallbackCategory}</p>
                    <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900 line-clamp-2 group-hover:text-[#003580]">{article.title}</h3>
                    <p className="mt-2 text-xs text-slate-500">{metaFor(article).join(' · ')}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default React.memo(LatestTravelGuides);
