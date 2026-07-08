import * as React from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, EyeOff, 
  Calendar, User, Tag, FileText, ChevronRight,
  Save, X, Globe, MessageSquare, AlertCircle,
  LoaderCircle, ImageIcon, ChevronDown, Copy, Archive, Monitor, Tablet, Smartphone,
  Check, Filter, MoreVertical, Layout, Share2, ArrowUpRight, MapPin
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import ImageUploadField from './ImageUploadField';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../lib/config';

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface SeoConfig {
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

interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

interface BlogArticle {
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

const BlogManagement: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'articles' | 'categories'>('articles');
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  const [categories, setCategories] = React.useState<BlogCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isArticleModalOpen, setIsArticleModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<Partial<BlogArticle> | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Partial<BlogCategory> | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedArticles, setSelectedArticles] = React.useState<number[]>([]);
  const [filters, setFilters] = React.useState({
    category: '',
    country: '',
    route: '',
    status: '',
    featured: '',
    author: ''
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<'desktop' | 'tablet' | 'mobile' | 'google'>('desktop');
  
  // Pagination State
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  
  // Route Connection Manager State
  const [availableRoutes, setAvailableRoutes] = React.useState<SeoConfig[]>([]);
  const [routeFilters, setRouteFilters] = React.useState({
    routeType: '',
    countryTag: '',
    cityTag: '',
    search: ''
  });
  const [isRouteSectionOpen, setIsRouteSectionOpen] = React.useState(true);

  React.useEffect(() => {
    fetchData();
  }, [activeTab]);

  const filteredArticles = React.useMemo(() => {
    return articles.filter(article => {
      const matchSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = !filters.category || article.category?.id === Number(filters.category);
      const matchCountry = !filters.country || article.country === filters.country;
      const matchRoute = !filters.route || article.primaryRoute?.id === Number(filters.route);
      const matchStatus = !filters.status || article.status === filters.status;
      const matchFeatured = !filters.featured || (filters.featured === 'true' ? article.featuredOnHomepage : !article.featuredOnHomepage);
      const matchAuthor = !filters.author || article.authorName === filters.author;

      return matchSearch && matchCategory && matchCountry && matchRoute && matchStatus && matchFeatured && matchAuthor;
    });
  }, [articles, searchTerm, filters]);

  const toggleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(a => a.id));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    if (selectedArticles.length === 0) return;
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedArticles.length} articles?`)) return;
    
    setLoading(true);
    try {
      for (const id of selectedArticles) {
        if (action === 'delete') {
          await adminFetch(`/api/admin/blog/articles/${id}`, { method: 'DELETE' });
        } else {
          await adminFetch(`/api/admin/blog/articles/${id}/${action}`, { method: 'POST' });
        }
      }
      setSelectedArticles([]);
      fetchData();
    } catch (error) {
      alert(`Bulk ${action} failed`);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'articles') {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', pageSize.toString());
        if (filters.category) params.append('category', filters.category);
        if (filters.country) params.append('country', filters.country);
        if (filters.route) params.append('route', filters.route);
        if (filters.status) params.append('status', filters.status);
        if (filters.featured) params.append('featured', filters.featured);
        if (filters.author) params.append('author', filters.author);
        if (searchTerm) params.append('search', searchTerm);

        const res = await adminFetch(`/api/admin/blog/articles?${params.toString()}`);
        setArticles(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      }
      // Always fetch categories as they are needed for article editing
      const catRes = await adminFetch('/api/admin/blog/categories');
      setCategories(catRes || []);

      // Fetch all routes for connections
      const routeRes = await adminFetch('/api/admin/blog/routes');
      setAvailableRoutes(routeRes || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, filters, searchTerm]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchFilteredRoutes = async () => {
    try {
      const params = new URLSearchParams();
      if (routeFilters.routeType) params.append('routeType', routeFilters.routeType);
      if (routeFilters.countryTag) params.append('countryTag', routeFilters.countryTag);
      if (routeFilters.cityTag) params.append('cityTag', routeFilters.cityTag);
      if (routeFilters.search) params.append('search', routeFilters.search);

      const res = await adminFetch(`/api/admin/blog/routes?${params.toString()}`);
      setAvailableRoutes(res || []);
    } catch (error) {
      console.error('Error fetching filtered routes:', error);
    }
  };

  React.useEffect(() => {
    if (isArticleModalOpen) {
      fetchFilteredRoutes();
    }
  }, [routeFilters]);

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminFetch('/api/admin/blog/articles', {
        method: 'POST',
        body: JSON.stringify(editingArticle)
      });
      setIsArticleModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Failed to save article');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminFetch('/api/admin/blog/categories', {
        method: 'POST',
        body: JSON.stringify(editingCategory)
      });
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Failed to save category');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await adminFetch(`/api/admin/blog/articles/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('Failed to delete article');
    }
  };

  const handleArticleAction = async (id: number, action: 'publish' | 'unpublish' | 'archive' | 'duplicate') => {
    try {
      await adminFetch(`/api/admin/blog/articles/${id}/${action}`, { method: 'POST' });
      fetchData();
    } catch (error) {
      alert(`Failed to ${action} article`);
    }
  };

  const scheduleArticle = async () => {
    if (!editingArticle?.id || !editingArticle.scheduledAt) return;
    try {
      const scheduledAt = editingArticle.scheduledAt.length === 16 ? `${editingArticle.scheduledAt}:00` : editingArticle.scheduledAt;
      const updated = await adminFetch(`/api/admin/blog/articles/${editingArticle.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledAt })
      });
      setEditingArticle(updated);
      fetchData();
    } catch {
      alert('Failed to schedule article');
    }
  };

  const addFaq = () => {
    const faqs = parseJsonArray(editingArticle?.faqJson);
    faqs.push({ question: '', answer: '' });
    setEditingArticle({ ...editingArticle, faqJson: JSON.stringify(faqs, null, 2) });
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const faqs = parseJsonArray(editingArticle?.faqJson);
    faqs[index] = { ...(faqs[index] || {}), [field]: value };
    setEditingArticle({ ...editingArticle, faqJson: JSON.stringify(faqs, null, 2) });
  };

  const removeFaq = (index: number) => {
    const faqs = parseJsonArray(editingArticle?.faqJson).filter((_: any, i: number) => i !== index);
    setEditingArticle({ ...editingArticle, faqJson: JSON.stringify(faqs, null, 2) });
  };

  const parseJsonArray = (value?: string) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const seoScore = React.useMemo(() => {
    if (!editingArticle) return 0;
    let score = 0;
    if (editingArticle.seoTitle && editingArticle.seoTitle.length <= 70) score += 15;
    if (editingArticle.seoDescription && editingArticle.seoDescription.length >= 120 && editingArticle.seoDescription.length <= 165) score += 15;
    if (editingArticle.canonicalUrl) score += 10;
    if (editingArticle.focusKeyword) score += 10;
    if (editingArticle.imageAltText || editingArticle.title) score += 10;
    if (editingArticle.faqJson) score += 10;
    if (editingArticle.primaryRoute || (editingArticle.secondaryRoutes && editingArticle.secondaryRoutes.length > 0)) score += 10;
    if ((editingArticle.content || '').split(/\s+/).filter(Boolean).length >= 900) score += 10;
    if (editingArticle.excerpt) score += 5;
    if (editingArticle.tags) score += 5;
    return Math.min(score, 100);
  }, [editingArticle]);

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminFetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  const handlePurgeArticles = async () => {
    if (!confirm('CRITICAL: This will delete ALL blog articles. This cannot be undone. Are you sure?')) return;
    try {
      await adminFetch('/api/admin/blog/articles/purge', { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('Failed to purge articles');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-card shadow-sm border border-slate-200">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'articles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Articles
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Categories
          </button>
        </div>
        <div className="flex gap-2">
          {activeTab === 'articles' && (
            <button 
              onClick={handlePurgeArticles}
              className="bg-rose-50 text-rose-600 px-5 py-2.5 rounded-card text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-all border border-rose-100"
            >
              <Trash2 size={16} /> Purge All
            </button>
          )}
          <button 
            onClick={() => {
              if (activeTab === 'articles') {
                setEditingArticle({ 
                  published: false, 
                  status: 'DRAFT', 
                  category: categories[0] || null,
                  secondaryRoutes: [],
                  articleTags: [],
                  relatedArticles: [],
                  relatedAirports: [],
                  readingTime: '1 min read',
                  featuredOnHomepage: false,
                  isFeatured: false,
                  live: false
                });
                setIsArticleModalOpen(true);
              } else {
                setEditingCategory({});
                setIsCategoryModalOpen(true);
              }
            }}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-card text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest"
          >
            <Plus size={18} strokeWidth={3} /> {activeTab === 'articles' ? 'New Article' : 'New Category'}
          </button>
        </div>
      </div>

      {activeTab === 'articles' ? (
        <div className="bg-white rounded-card shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search articles by title or slug..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <Filter size={16} /> Filters
                </button>
                {selectedArticles.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => handleBulkAction('publish')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all" title="Publish Selected"><Eye size={14} /></button>
                    <button onClick={() => handleBulkAction('unpublish')} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md transition-all" title="Unpublish Selected"><EyeOff size={14} /></button>
                    <button onClick={() => handleBulkAction('archive')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-all" title="Archive Selected"><Archive size={14} /></button>
                    <button onClick={() => handleBulkAction('delete')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-all" title="Delete Selected"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100"
                >
                  <select 
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input 
                    type="text" placeholder="Country"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                    value={filters.country}
                    onChange={(e) => setFilters({...filters, country: e.target.value})}
                  />
                  <select 
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                    value={filters.route}
                    onChange={(e) => setFilters({...filters, route: e.target.value})}
                  >
                    <option value="">All Routes</option>
                    {availableRoutes.map(r => <option key={r.id} value={r.id}>{r.destinationName || r.route}</option>)}
                  </select>
                  <select 
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <select 
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                    value={filters.featured}
                    onChange={(e) => setFilters({...filters, featured: e.target.value})}
                  >
                    <option value="">All Visibility</option>
                    <option value="true">Homepage Featured</option>
                    <option value="false">Not on Homepage</option>
                  </select>
                  <input 
                    type="text" placeholder="Author"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                    value={filters.author}
                    onChange={(e) => setFilters({...filters, author: e.target.value})}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="pl-6 py-4 w-10">
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Article</th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Routes</th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center">SEO</th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Visibility</th>
                  <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <LoaderCircle className="w-8 h-8 text-slate-300 animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Articles...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No articles match your criteria
                    </td>
                  </tr>
                ) : filteredArticles.map((article) => (
                  <tr key={article.id} className={`hover:bg-slate-50/50 transition-colors ${selectedArticles.includes(article.id) ? 'bg-slate-50' : ''}`}>
                    <td className="pl-6 py-4">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={selectedArticles.includes(article.id)}
                        onChange={() => {
                          setSelectedArticles(prev => prev.includes(article.id) ? prev.filter(id => id !== article.id) : [...prev, article.id]);
                        }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={article.featuredImage ? (article.featuredImage.startsWith('/') && !article.featuredImage.startsWith('http') ? `${API_BASE_URL}${article.featuredImage}` : article.featuredImage) : 'https://via.placeholder.com/150'} 
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shadow-sm border border-slate-200"
                          />
                        </div>
                        <div className="max-w-[200px] xl:max-w-[300px]">
                          <div className="font-bold text-slate-900 truncate" title={article.title}>{article.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-tighter bg-indigo-50 px-1 rounded">{article.authorName || 'Hogicar'}</span>
                            <span className="text-[9px] text-slate-400 font-medium truncate">/{article.slug}</span>
                            <span className="text-[9px] text-slate-300 font-bold">•</span>
                            <span className="text-[9px] text-slate-400 font-bold">{article.readingTime || '1 min read'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight self-start">
                          {article.category?.name || 'Uncategorized'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{article.country || 'Jordan'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {article.primaryRoute ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-slate-700 leading-tight truncate max-w-[120px]" title={article.primaryRoute.route}>{article.primaryRoute.destinationName || article.primaryRoute.route}</span>
                          {article.secondaryRoutes && article.secondaryRoutes.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5" title={article.secondaryRoutes.map(r => r.route).join(', ')}>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="text-[9px] text-slate-400 font-medium">{article.secondaryRoutes.length} related</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">No Route</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex flex-col items-center justify-center w-8 h-8 rounded-full border-2 ${article.seoScore >= 80 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : article.seoScore >= 60 ? 'border-amber-400 text-amber-600 bg-amber-50' : 'border-rose-300 text-rose-500 bg-rose-50'}`}>
                        <span className="text-[10px] font-extrabold leading-none">{article.seoScore || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-tighter ${
                          article.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                          article.status === 'SCHEDULED' ? 'bg-indigo-100 text-indigo-700' :
                          article.status === 'ARCHIVED' ? 'bg-slate-200 text-slate-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {article.status || 'DRAFT'}
                        </span>
                        <div className="flex items-center gap-1 ml-1">
                           <Calendar size={8} className="text-slate-400" />
                           <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                             {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : 'N/A'}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {article.published && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-600 uppercase tracking-tighter">
                            <Check size={8} /> Published
                          </span>
                        )}
                        {article.live && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-600 uppercase tracking-tighter">
                            <Globe size={8} /> Live
                          </span>
                        )}
                        {article.featuredOnHomepage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-600 uppercase tracking-tighter">
                            <Layout size={8} /> Homepage
                          </span>
                        )}
                        {!article.published && !article.live && !article.featuredOnHomepage && (
                          <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic ml-1">Hidden</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Live"
                        >
                          <ArrowUpRight size={14} />
                        </a>
                        <button
                          onClick={() => handleArticleAction(article.id, article.published ? 'unpublish' : 'publish')}
                          className={`p-1.5 rounded-lg transition-all ${article.published ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={article.published ? 'Unpublish' : 'Publish'}
                        >
                          {article.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleArticleAction(article.id, 'duplicate')}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => { setEditingArticle(article); setIsArticleModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {activeTab === 'articles' && totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Showing <span className="text-slate-900">{page * pageSize + 1}</span> to <span className="text-slate-900">{Math.min((page + 1) * pageSize, totalElements)}</span> of <span className="text-slate-900">{totalElements}</span> articles
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === i ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Slug</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <LoaderCircle className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    No categories found.
                  </td>
                </tr>
              ) : categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{cat.name}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{cat.slug}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{cat.description}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Article Modal */}
      <AnimatePresence>
        {isArticleModalOpen && editingArticle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsArticleModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <form onSubmit={handleSaveArticle} className="flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2 rounded-xl text-white">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {editingArticle.id ? 'Edit Article' : 'New Article'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Article Editor & Content Builder</p>
                    </div>
                  </div>
                  <button 
                    type="button" onClick={() => setIsArticleModalOpen(false)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Article Title</label>
                        <input 
                          type="text" required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold text-lg"
                          value={editingArticle.title || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, title: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Slug</label>
                          <input 
                            type="text" required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                            value={editingArticle.slug || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, slug: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold text-sm"
                            value={editingArticle.category?.id || ''}
                            onChange={(e) => {
                              const cat = categories.find(c => c.id === Number(e.target.value));
                              setEditingArticle({...editingArticle, category: cat || null});
                            }}
                          >
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Excerpt (Summary)</label>
                        <textarea 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-20 resize-none"
                          value={editingArticle.excerpt || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, excerpt: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Reading Time</label>
                          <input 
                            type="text"
                            placeholder="e.g., 5 min read"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-bold"
                            value={editingArticle.readingTime || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, readingTime: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Country</label>
                          <input 
                            type="text"
                            placeholder="e.g., Jordan"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-bold"
                            value={editingArticle.country || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, country: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Publish Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                            value={editingArticle.publishDate || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, publishDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Scheduled Publishing</label>
                          <div className="flex gap-2">
                            <input
                              type="datetime-local"
                              className="min-w-0 flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                              value={editingArticle.scheduledAt?.slice(0, 16) || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, scheduledAt: e.target.value, status: e.target.value ? 'SCHEDULED' : editingArticle.status})}
                            />
                            {editingArticle.id && (
                              <button type="button" onClick={scheduleArticle} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                                Set
                              </button>
                            )}
                          </div>
                        </div>
                      </div>


                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Tags (Comma Separated)</label>
                        <input 
                          type="text"
                          placeholder="Travel Tips, Luxury, Adventure"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                          value={editingArticle.tags || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, tags: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Content (Rich HTML Editor)</label>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${((editingArticle.content || '').split(/\s+/).filter(Boolean).length) >= 1500 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            Word Count: {(editingArticle.content || '').split(/\s+/).filter(Boolean).length} / 1500
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 p-2 bg-slate-100 border border-slate-200 rounded-t-xl border-b-0">
                          {['H1', 'H2', 'H3', 'B', 'I', 'UL', 'OL', 'LI', 'IMG', 'A', 'TABLE', 'TR', 'TD'].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('article-content-textarea') as HTMLTextAreaElement;
                                if (!el) return;
                                const start = el.selectionStart;
                                const end = el.selectionEnd;
                                const text = el.value;
                                const selected = text.substring(start, end);
                                const before = text.substring(0, start);
                                const after = text.substring(end);
                                const lowerTag = tag.toLowerCase();
                                let replacement = '';
                                if (tag === 'IMG') replacement = `<img src="" alt="" />`;
                                else if (tag === 'A') replacement = `<a href="">${selected || 'Link'}</a>`;
                                else if (tag === 'TABLE') replacement = `<table>\n  <tr>\n    <td></td>\n  </tr>\n</table>`;
                                else replacement = `<${lowerTag}>${selected}</${lowerTag}>`;
                                
                                const newValue = before + replacement + after;
                                setEditingArticle({...editingArticle, content: newValue});
                                setTimeout(() => {
                                  el.focus();
                                  el.setSelectionRange(start + replacement.length, start + replacement.length);
                                }, 10);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-extrabold text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <textarea 
                          id="article-content-textarea"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-b-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-96 font-mono"
                          value={editingArticle.content || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, content: e.target.value})}
                        />
                      </div>

                      {/* FAQ Editor */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">FAQs</label>
                          <button type="button" onClick={addFaq} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                            Add FAQ
                          </button>
                        </div>
                        <div className="space-y-3">
                          {parseJsonArray(editingArticle.faqJson).map((faq: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                              <input
                                type="text"
                                placeholder="Question"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                                value={faq.question || ''}
                                onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                              />
                              <textarea
                                placeholder="Answer"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm h-20 resize-none"
                                value={faq.answer || ''}
                                onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                              />
                              <button type="button" onClick={() => removeFaq(idx)} className="text-[10px] font-bold text-rose-600">
                                Remove FAQ
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Related Articles Selector */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Related Articles</label>
                        <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar bg-slate-50 p-4 rounded-xl border border-slate-200">
                          {articles
                            .filter(a => a.id !== editingArticle.id)
                            .map(a => {
                              const isSelected = editingArticle.relatedArticles?.some(ra => ra.id === a.id);
                              return (
                                <div 
                                  key={a.id} 
                                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-slate-900 text-white' : 'hover:bg-white text-slate-700'}`}
                                  onClick={() => {
                                    const newRelated = isSelected 
                                      ? editingArticle.relatedArticles?.filter(ra => ra.id !== a.id)
                                      : [...(editingArticle.relatedArticles || []), a];
                                    setEditingArticle({...editingArticle, relatedArticles: newRelated});
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <img src={a.featuredImage ? (a.featuredImage.startsWith('/') && !a.featuredImage.startsWith('http') ? `${API_BASE_URL}${a.featuredImage}` : a.featuredImage) : 'https://via.placeholder.com/150'} className="w-6 h-6 rounded object-cover" />
                                    <span className="text-xs font-bold truncate max-w-[300px]">{a.title}</span>
                                  </div>
                                  {isSelected && <Check size={14} />}
                                </div>
                              );
                            })}
                        </div>
                      </div>

                    </div>

                    {/* Sidebar / Settings */}
                    <div className="space-y-8">
                      {/* General Information */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Eye size={14} /> General Information
                        </h3>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                          <select
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                            value={editingArticle.status || (editingArticle.published ? 'PUBLISHED' : 'DRAFT')}
                            onChange={(e) => setEditingArticle({...editingArticle, status: e.target.value, published: e.target.value === 'PUBLISHED'})}
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-sm font-bold text-slate-700">Published</span>
                          <button 
                            type="button"
                            onClick={() => setEditingArticle({...editingArticle, published: !editingArticle.published})}
                            className={`relative w-12 h-6 rounded-full transition-colors ${editingArticle.published ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingArticle.published ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">Live Status</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Publicly Accessible</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setEditingArticle({...editingArticle, live: !editingArticle.live})}
                            className={`relative w-12 h-6 rounded-full transition-colors ${editingArticle.live ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingArticle.live ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-sm font-bold text-slate-700">Featured on Homepage</span>
                          <button 
                            type="button"
                            onClick={() => setEditingArticle({...editingArticle, featuredOnHomepage: !editingArticle.featuredOnHomepage})}
                            className={`relative w-12 h-6 rounded-full transition-colors ${editingArticle.featuredOnHomepage ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingArticle.featuredOnHomepage ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-sm font-bold text-slate-700">Mark as Featured</span>
                          <button 
                            type="button"
                            onClick={() => setEditingArticle({...editingArticle, isFeatured: !editingArticle.isFeatured})}
                            className={`relative w-12 h-6 rounded-full transition-colors ${editingArticle.isFeatured ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingArticle.isFeatured ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Route Assignment */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} /> Route Assignment
                        </h3>

                        <div className="space-y-4">
                          {/* Route Filters */}
                          <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                            <select 
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                              value={routeFilters.routeType}
                              onChange={(e) => setRouteFilters({...routeFilters, routeType: e.target.value})}
                            >
                              <option value="">All Route Types</option>
                              <option value="HOMEPAGE">Homepage</option>
                              <option value="AIRPORT">Airport</option>
                              <option value="CITY">City</option>
                              <option value="DESTINATION">Destination</option>
                            </select>
                            <input 
                              type="text"
                              placeholder="Search routes..."
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                              value={routeFilters.search}
                              onChange={(e) => setRouteFilters({...routeFilters, search: e.target.value})}
                            />
                          </div>

                          {/* Primary Route */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Primary Route (Required)</label>
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar bg-white p-2 rounded-xl border border-slate-200">
                              {availableRoutes.map(r => {
                                const isSelected = editingArticle.primaryRoute?.id === r.id;
                                return (
                                  <div 
                                    key={r.id} 
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                                    onClick={() => setEditingArticle({...editingArticle, primaryRoute: r})}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold">{r.destinationName || r.route}</span>
                                      <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{r.route}</span>
                                    </div>
                                    {isSelected && <Check size={14} />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Related Routes Multi-Select */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Related Routes (Optional)</label>
                            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar bg-white p-2 rounded-xl border border-slate-200">
                                {availableRoutes
                                  .filter(r => r.id !== editingArticle.primaryRoute?.id)
                                  .map(r => {
                                    const isSelected = editingArticle.secondaryRoutes?.some(sr => sr.id === r.id);
                                    return (
                                      <div 
                                        key={r.id} 
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                                        onClick={() => {
                                          const newSecondary = isSelected 
                                            ? editingArticle.secondaryRoutes?.filter(sr => sr.id !== r.id)
                                            : [...(editingArticle.secondaryRoutes || []), r];
                                          setEditingArticle({...editingArticle, secondaryRoutes: newSecondary});
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-xs font-bold">{r.destinationName || r.route}</span>
                                          <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{r.route}</span>
                                        </div>
                                        {isSelected && <Check size={14} />}
                                      </div>
                                    );
                                  })}
                            </div>
                          </div>

                          {/* Admin Preview Summary */}
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-4">
                            <div className="space-y-2">
                              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">This article will appear on:</div>
                              <div className="space-y-1">
                                {(editingArticle.featuredOnHomepage || editingArticle.isFeatured) && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                    <Check size={10} className="text-emerald-500" /> Homepage (Featured)
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                  <Check size={10} className="text-emerald-500" /> Blog Index
                                </div>
                                {editingArticle.primaryRoute && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                    <Check size={10} className="text-emerald-500" /> {editingArticle.primaryRoute.destinationName || editingArticle.primaryRoute.route}
                                  </div>
                                )}
                                {editingArticle.secondaryRoutes?.map(r => (
                                  <div key={r.id} className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                    <Check size={10} className="text-emerald-500" /> {r.destinationName || r.route}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-emerald-200/50">
                              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">This article will be added to:</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                  <Check size={10} className="text-emerald-500" /> Blog Index
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                  <Check size={10} className="text-emerald-500" /> XML Sitemap
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                  <Check size={10} className="text-emerald-500" /> Internal Search
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                  <Check size={10} className="text-emerald-500" /> Related Articles
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                  <Check size={10} className="text-emerald-500" /> Route Blog Sections
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Featured Image */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Images</h3>
                        
                        <div className="space-y-4">
                          <ImageUploadField 
                            label="Hero Image"
                            placeholder="Hero image URL..."
                            value={editingArticle.featuredImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, featuredImage: e.target.value})}
                          />

                          <ImageUploadField 
                            label="Desktop (Main)"
                            placeholder="Desktop image URL..."
                            value={editingArticle.desktopImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, desktopImage: e.target.value})}
                          />
                          
                          <ImageUploadField 
                            label="Mobile"
                            placeholder="Mobile image URL..."
                            value={editingArticle.mobileImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, mobileImage: e.target.value})}
                          />

                          <ImageUploadField 
                            label="Thumbnail (Card)"
                            placeholder="Thumbnail image URL..."
                            value={editingArticle.thumbnailImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, thumbnailImage: e.target.value})}
                          />

                          <ImageUploadField 
                            label="Open Graph"
                            placeholder="Open Graph image URL..."
                            value={editingArticle.openGraphImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, openGraphImage: e.target.value})}
                          />

                          <ImageUploadField 
                            label="Twitter Card"
                            placeholder="Twitter image URL..."
                            value={editingArticle.twitterCardImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, twitterCardImage: e.target.value})}
                          />

                          <input
                            type="text"
                            placeholder="Alt text"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            value={editingArticle.imageAltText || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, imageAltText: e.target.value})}
                          />
                          <textarea
                            placeholder="Image caption"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs h-16 resize-none"
                            value={editingArticle.imageCaption || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, imageCaption: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* SEO Settings */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Globe size={14} /> SEO Meta
                        </h3>
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 mb-2">
                            <span>SEO Score</span>
                            <span className={seoScore >= 80 ? 'text-emerald-600' : seoScore >= 60 ? 'text-amber-600' : 'text-rose-600'}>{seoScore}/100</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${seoScore}%` }} />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">SEO Title</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              value={editingArticle.seoTitle || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, seoTitle: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Meta Description</label>
                            <textarea 
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs h-20 resize-none"
                              value={editingArticle.seoDescription || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, seoDescription: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Canonical URL</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              value={editingArticle.canonicalUrl || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, canonicalUrl: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Focus Keyword</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              value={editingArticle.focusKeyword || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, focusKeyword: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Secondary Keywords</label>
                            <textarea
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs h-16 resize-none"
                              value={editingArticle.secondaryKeywords || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, secondaryKeywords: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Robots Directives</label>
                            <input
                              type="text"
                              placeholder="index, follow"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              value={editingArticle.robotsDirectives || ''}
                              onChange={(e) => setEditingArticle({...editingArticle, robotsDirectives: e.target.value})}
                            />
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-3">Google Search Preview</div>
                            <div className="text-[#1a0dab] text-base leading-tight line-clamp-2">{editingArticle.seoTitle || editingArticle.title || 'Article title'}</div>
                            <div className="text-[#006621] text-xs mt-1">www.hogicar.com/blog/{editingArticle.slug || 'article-slug'}</div>
                            <div className="text-[#545454] text-xs mt-1 line-clamp-3">{editingArticle.seoDescription || editingArticle.excerpt || 'Meta description preview appears here.'}</div>
                          </div>
                        </div>
                      </div>

                      {editingArticle.slug && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Preview</h3>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              ['desktop', Monitor],
                              ['tablet', Tablet],
                              ['mobile', Smartphone],
                              ['google', Search]
                            ].map(([mode, Icon]: any) => (
                              <button
                                type="button"
                                key={mode}
                                onClick={() => setPreviewMode(mode)}
                                className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center ${previewMode === mode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                <Icon size={14} />
                              </button>
                            ))}
                          </div>
                          {previewMode === 'google' ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
                              <div className="text-[#1a0dab] text-base">{editingArticle.seoTitle || editingArticle.title}</div>
                              <div className="text-[#006621]">www.hogicar.com/blog/{editingArticle.slug}</div>
                              <div className="text-[#545454]">{editingArticle.seoDescription || editingArticle.excerpt}</div>
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-hidden">
                              <iframe
                                title="Article preview"
                                src={`/blog/${editingArticle.slug}`}
                                className={`bg-white border-0 mx-auto ${previewMode === 'desktop' ? 'w-full h-64' : previewMode === 'tablet' ? 'w-[420px] max-w-full h-64' : 'w-[260px] h-64'}`}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Author */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Author Info</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <input 
                            type="text"
                            placeholder="Name"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            value={editingArticle.authorName || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, authorName: e.target.value})}
                          />
                        <ImageUploadField 
                          label="Author Image"
                          placeholder="Author image URL"
                          value={editingArticle.authorImage || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, authorImage: e.target.value})}
                        />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                  <button 
                    type="button" onClick={() => setIsArticleModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <Save size={16} /> Save Article
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && editingCategory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsCategoryModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveCategory}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {editingCategory.id ? 'Edit Category' : 'New Category'}
                  </h2>
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Name</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold"
                      value={editingCategory.name || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Slug</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                      value={editingCategory.slug || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, slug: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Description</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-24"
                      value={editingCategory.description || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 text-xs font-bold text-slate-600">Cancel</button>
                  <button type="submit" className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Save size={16} /> Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogManagement;
