import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ChevronRight, Share2, Facebook, Twitter, Linkedin, ArrowLeft, MessageSquare, ArrowRight } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import LatestTravelGuides from '../components/LatestTravelGuides';
import { api } from '../api';
import { BlogArticle as BlogArticleType } from '../types';

const BlogArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = React.useState<BlogArticleType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recentArticles, setRecentArticles] = React.useState<BlogArticleType[]>([]);

  React.useEffect(() => {
    fetchArticle();
    fetchRecent();
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api.baseUrl}/public/blog/articles/${slug}`);
      const data = await res.json();
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await fetch(`${api.baseUrl}/public/blog/recent`);
      const data = await res.json();
      setRecentArticles(data);
    } catch (error) {
      console.error('Error fetching recent articles:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 animate-pulse">
        <div className="h-96 bg-slate-100 mb-8" />
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-4 w-32 bg-slate-100 mb-4" />
          <div className="h-10 w-3/4 bg-slate-100 mb-6" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-slate-100" />
            <div className="h-4 w-full bg-slate-100" />
            <div className="h-4 w-2/3 bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 pt-40 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Article Not Found</h2>
        <Link to="/blog" className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
      </div>
    );
  }

  const faqs = article.faqJson ? JSON.parse(article.faqJson) : [];
  const relatedRoutes = article.relatedRoutesJson ? JSON.parse(article.relatedRoutesJson) : [];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "image": article.featuredImage,
    "author": {
      "@type": "Person",
      "name": article.authorName || "Hogicar Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Hogicar",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.hogicar.com/logo.png"
      }
    },
    "datePublished": article.publishedAt,
    "description": article.seoDescription || article.excerpt
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f: any) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-white pt-20 pb-20">
      <SEOMetadata 
        title={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt}
        ogImage={article.featuredImage}
        canonicalUrl={article.canonicalUrl || `https://www.hogicar.com/blog/${article.slug}`}
        schema={faqSchema ? [articleSchema, faqSchema] : articleSchema}
      />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center text-sm text-slate-500">
        <Link to="/" className="hover:text-emerald-600">Home</Link>
        <ChevronRight size={14} className="mx-2" />
        <Link to="/blog" className="hover:text-emerald-600">Blog</Link>
        <ChevronRight size={14} className="mx-2" />
        <span className="text-slate-900 font-medium truncate">{article.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] mb-12">
        <img 
          src={article.featuredImage || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200'} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              {article.category?.name || 'General'}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <img 
                  src={article.authorImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'} 
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                  alt={article.authorName}
                />
                <span>{article.authorName || 'Hogicar Team'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                {new Date(article.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Article Body */}
          <article className="flex-1 max-w-4xl">
            <div 
              className="prose prose-lg prose-emerald max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <div className="mt-16 bg-slate-50 rounded-card p-8 border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <MessageSquare className="text-emerald-600" /> Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                  {faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                      <p className="text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Routes */}
            {relatedRoutes.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <ArrowRight className="text-emerald-600" /> Related Destinations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedRoutes.map((route: any, idx: number) => (
                    <Link 
                      key={idx} 
                      to={route.path}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                    >
                      <span className="font-bold text-slate-900">{route.label}</span>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Social Share */}
            <div className="mt-12 py-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-slate-900 font-bold uppercase tracking-wider text-sm">Share this article:</span>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-100 rounded-full hover:bg-emerald-600 hover:text-white transition-colors">
                    <Facebook size={20} />
                  </button>
                  <button className="p-2 bg-slate-100 rounded-full hover:bg-emerald-600 hover:text-white transition-colors">
                    <Twitter size={20} />
                  </button>
                  <button className="p-2 bg-slate-100 rounded-full hover:bg-emerald-600 hover:text-white transition-colors">
                    <Linkedin size={20} />
                  </button>
                  <button className="p-2 bg-slate-100 rounded-full hover:bg-emerald-600 hover:text-white transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              <Link to="/blog" className="text-emerald-600 font-bold flex items-center gap-1 hover:translate-x-1 transition-transform">
                <ArrowLeft size={16} /> All Articles
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-8">
            <div className="bg-slate-50 p-6 rounded-card border border-slate-100 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Articles</h3>
              <div className="space-y-6">
                {recentArticles.filter(a => a.id !== article.id).slice(0, 4).map((recent) => (
                  <Link key={recent.id} to={`/blog/${recent.slug}`} className="group flex gap-4">
                    <img 
                      src={recent.featuredImage || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=100'} 
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      alt={recent.title}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {recent.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {new Date(recent.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <LatestTravelGuides 
        route={article.destinations?.split(',')[0]} 
        country={article.countryTag} 
        airport={article.airportTags?.split(',')[0]}
        limit={3}
        title="More Like This"
        subtitle="Explore more travel guides and tips related to this topic."
      />
    </div>
  );
};

export default BlogArticle;
