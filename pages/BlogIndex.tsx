import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Clock from 'lucide-react/dist/esm/icons/clock';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';
import { API_BASE_URL } from '../lib/config';

interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: {
    name: string;
    slug: string;
  };
  authorName: string;
  publishedAt: string;
  readingTime?: string;
  tags?: string;
}

const BlogIndex: React.FC = () => {
  const { categorySlug, tag, author } = useParams<{ categorySlug?: string; tag?: string; author?: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [heroImageUrl, setHeroImageUrl] = React.useState<string>('');
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  const selectedCategory = categorySlug || null;
  const pageTitle = categorySlug
    ? `${categorySlug.replace(/-/g, ' ')} Travel Guides`
    : tag
      ? `${tag.replace(/-/g, ' ')} Articles`
      : author
        ? `Articles by ${decodeURIComponent(author)}`
        : 'Hogicar Travel Blog';

  React.useEffect(() => {
    setPage(0);
  }, [categorySlug, tag, author]);

  React.useEffect(() => {
    fetchData();
    fetchSettings();
  }, [categorySlug, tag, author, page]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/settings`);
      if (response.ok) {
        const data = await response.json();
        setHeroImageUrl(data.heroImageUrl || '');
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '10' });
      if (categorySlug) params.set('category', categorySlug);
      if (tag) params.set('tag', tag);
      if (author) params.set('author', decodeURIComponent(author));

      const articlesRes = await fetch(`${api.baseUrl}/api/public/blog/articles?${params.toString()}`);
      const articlesData = await articlesRes.json();
      setArticles(articlesData.content || []);
      setTotalPages(Math.max(articlesData.totalPages || 1, 1));

      const catsRes = await fetch(`${api.baseUrl}/api/public/blog/categories`);
      const catsData = await catsRes.json();
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${api.baseUrl}/api/public/blog/search?q=${searchQuery}`);
      const data = await res.json();
      setArticles(data.content || []);
      setTotalPages(Math.max(data.totalPages || 1, 1));
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <SEOMetadata 
        title="Hogicar Blog - Car Rental Tips & Travel Guides"
        description="Discover car rental tips, destination guides, airport advice, and road trip planning from Hogicar."
      />

      {/* Hero Section */}
      <div className={`relative text-white py-12 md:py-20 mb-12 overflow-hidden ${!heroImageUrl ? 'bg-emerald-900' : ''}`}>
        {heroImageUrl && (
            <div className="absolute inset-0 z-0">
                <img 
                    src={heroImageUrl.startsWith('/') && !heroImageUrl.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl} 
                    alt="Hogicar Blog" 
                    className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-emerald-950/40"></div>
            </div>
        )}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-6xl font-black mb-6 tracking-tight capitalize">{pageTitle}</h1>
          <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            Expert car rental guides, airport pickup advice, and local road trip inspiration to make your next journey seamless.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-48 bg-slate-200" />
                    <div className="p-6">
                      <div className="h-4 w-1/4 bg-slate-200 mb-4 rounded" />
                      <div className="h-6 w-3/4 bg-slate-200 mb-2 rounded" />
                      <div className="h-4 w-full bg-slate-200 mb-4 rounded" />
                      <div className="h-4 w-1/2 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <Link 
                    key={article.id} 
                    to={`/blog/${article.slug}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={article.featuredImage ? (article.featuredImage.startsWith('/') && !article.featuredImage.startsWith('http') ? `${API_BASE_URL}${article.featuredImage}` : article.featuredImage) : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800'} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/95 backdrop-blur-sm text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                          {article.category?.name || 'General'}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-emerald-500" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-emerald-500" />
                          {article.readingTime || '5 min'}
                        </div>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors leading-tight">
                        {article.title}
                      </h2>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-6">
                        {article.excerpt}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                {article.authorName?.charAt(0) || 'H'}
                            </div>
                            <span className="text-[11px] font-bold text-slate-600">{article.authorName || 'Hogicar Team'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-card shadow-sm">
                <div className="text-slate-400 mb-4">
                  <SearchIcon size={48} className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No articles found</h3>
                <p className="text-slate-600">Try adjusting your search or category filters.</p>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm font-bold text-slate-600">Page {page + 1} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[350px] space-y-8">
            {/* Search */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider">Search</h3>
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-2xl text-sm font-medium transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon className="absolute left-4 top-4 text-emerald-500" size={18} />
              </form>
            </div>

            {/* Categories */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
                 Categories
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                <Link
                  to="/blog"
                  className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${!selectedCategory ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => (
                  <Link 
                    key={cat.id}
                    to={`/blog/category/${cat.slug}`}
                    className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${selectedCategory === cat.slug ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-black text-white mb-3 relative z-10">Newsletter</h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10 leading-relaxed">Join 5,000+ travelers getting weekly insights and car rental deals.</p>
              <form className="space-y-3 relative z-10">
                <input 
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-5 py-4 bg-white/10 border-transparent focus:bg-white/20 focus:ring-2 focus:ring-emerald-500 rounded-2xl text-white text-sm placeholder:text-slate-500"
                />
                <button className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">
                  Join Now
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BlogIndex;
