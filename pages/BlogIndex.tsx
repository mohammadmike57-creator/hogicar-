import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight, Search as SearchIcon, Tag, Clock } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import SearchWidget from '../components/SearchWidget';
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
  
  const handleCarSearch = (params: any) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });
    navigate(`/search?${queryParams.toString()}`);
  };
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
      <div className={`relative text-white py-16 mb-12 overflow-hidden ${!heroImageUrl ? 'bg-emerald-900' : ''}`}>
        {heroImageUrl && (
            <div className="absolute inset-0 z-0">
                <img 
                    src={heroImageUrl.startsWith('/') && !heroImageUrl.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl} 
                    alt="Hogicar Blog" 
                    className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-[1px]"></div>
            </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 capitalize">{pageTitle}</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Practical car rental guides, airport pickup advice, road trip planning, and destination-specific travel tips.
          </p>
        </div>
      </div>

      {/* Search Widget Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 mb-16 relative z-20">
         <div className="bg-white rounded-[2.5rem] shadow-2xl p-2 md:p-4">
            <SearchWidget onSearch={handleCarSearch} />
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 4].map((i) => (
                  <div key={i} className="bg-white rounded-card overflow-hidden shadow-sm animate-pulse">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map((article) => (
                  <Link 
                    key={article.id} 
                    to={`/blog/${article.slug}`}
                    className="group bg-white rounded-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={article.featuredImage ? (article.featuredImage.startsWith('/') && !article.featuredImage.startsWith('http') ? `${API_BASE_URL}${article.featuredImage}` : article.featuredImage) : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800'} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {article.category?.name || 'General'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-slate-500 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {article.readingTime || '5 min read'}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {article.authorName || 'Hogicar Team'}
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center text-emerald-600 font-semibold text-sm">
                        Read More <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                      {article.tags && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                          {article.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3).map(t => (
                            <span key={t} className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
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
          <div className="w-full lg:w-80 space-y-8">
            {/* Search */}
            <div className="bg-white p-6 rounded-card shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Search Articles</h3>
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-lg text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </form>
            </div>

            {/* Categories */}
            <div className="bg-white p-6 rounded-card shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Tag size={18} /> Categories
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                <Link
                  to="/blog"
                  className={`px-4 py-2 text-sm text-left rounded-lg transition-colors ${!selectedCategory ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => (
                  <Link 
                    key={cat.id}
                    to={`/blog/category/${cat.slug}`}
                    className={`px-4 py-2 text-sm text-left rounded-lg transition-colors ${selectedCategory === cat.slug ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-emerald-50 p-6 rounded-card border border-emerald-100">
              <h3 className="text-lg font-bold text-emerald-900 mb-2">Join Our Newsletter</h3>
              <p className="text-emerald-700 text-xs mb-4">Get the latest travel tips and exclusive rental deals delivered to your inbox.</p>
              <form className="space-y-2">
                <input 
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-2 border-slate-200 rounded-lg text-sm"
                />
                <button className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors">
                  Subscribe
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
