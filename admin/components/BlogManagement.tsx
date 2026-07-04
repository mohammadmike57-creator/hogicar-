import * as React from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, EyeOff, 
  Calendar, User, Tag, FileText, ChevronRight,
  Save, X, Globe, MessageSquare, AlertCircle,
  LoaderCircle, ImageIcon, ChevronDown, Copy, Archive, Monitor, Tablet, Smartphone
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
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  secondaryKeywords: string;
  robotsDirectives: string;
  openGraphTagsJson: string;
  twitterCardTagsJson: string;
  faqJson: string;
  relatedRoutesJson: string;
  relatedAirportsJson: string;
  relatedArticlesJson: string;
  relatedDestinationsJson: string;
  destinations: string;
  airportCodes: string;
  country: string;
  readingTime: string;
  featuredOnHomepage: boolean;
  isFeatured: boolean;
  tags: string;
  authorName: string;
  authorImage: string;
  status: string;
  publishDate: string;
  scheduledAt: string;
  archivedAt: string;
  seoScore: number;
  published: boolean;
  publishedAt: string;
  createdAt: string;
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
  const [previewMode, setPreviewMode] = React.useState<'desktop' | 'tablet' | 'mobile' | 'google'>('desktop');

  React.useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'articles') {
        const res = await adminFetch('/api/admin/blog/articles');
        setArticles(res.content || []);
      }
      // Always fetch categories as they are needed for article editing
      const catRes = await adminFetch('/api/admin/blog/categories');
      setCategories(catRes || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (editingArticle.relatedRoutesJson || editingArticle.relatedDestinationsJson) score += 10;
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
                setEditingArticle({ published: false, status: 'DRAFT', category: categories[0] || null });
                setIsArticleModalOpen(true);
              } else {
                setEditingCategory({});
                setIsCategoryModalOpen(true);
              }
            }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-card text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus size={16} /> Add {activeTab === 'articles' ? 'Article' : 'Category'}
          </button>
        </div>
      </div>

      {activeTab === 'articles' ? (
        <div className="bg-white rounded-card shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search articles by title..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Article</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <LoaderCircle className="w-8 h-8 text-slate-300 animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Articles...</span>
                      </div>
                    </td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                      No articles found. Start by creating one!
                    </td>
                  </tr>
                ) : articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={article.featuredImage ? (article.featuredImage.startsWith('/') && !article.featuredImage.startsWith('http') ? `${API_BASE_URL}${article.featuredImage}` : article.featuredImage) : 'https://via.placeholder.com/150'} 
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{article.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">/{article.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">
                        {article.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {article.published ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-tighter">
                          <Eye size={12} /> {article.status || 'Published'}
                        </span>
                      ) : article.status === 'ARCHIVED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-tighter">
                          <Archive size={12} /> Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tighter">
                          <EyeOff size={12} /> {article.status || 'Draft'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-600 font-medium">
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Preview article"
                        >
                          <Eye size={16} />
                        </a>
                        <button
                          onClick={() => handleArticleAction(article.id, article.published ? 'unpublish' : 'publish')}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title={article.published ? 'Unpublish' : 'Publish'}
                        >
                          {article.published ? <EyeOff size={16} /> : <Globe size={16} />}
                        </button>
                        <button
                          onClick={() => handleArticleAction(article.id, 'duplicate')}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleArticleAction(article.id, 'archive')}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditingArticle(article); setIsArticleModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteArticle(article.id)}
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Destinations (Route Slugs)</label>
                          <input 
                            type="text"
                            placeholder="/car-rental-amman, /car-rental-aqaba"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono"
                            value={editingArticle.destinations || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, destinations: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Airport Codes</label>
                          <input 
                            type="text"
                            placeholder="AMM, DXB, AUH"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono"
                            value={editingArticle.airportCodes || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, airportCodes: e.target.value})}
                          />
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
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Content (HTML Supported)</label>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${((editingArticle.content || '').split(/\s+/).filter(Boolean).length) >= 1500 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            Word Count: {(editingArticle.content || '').split(/\s+/).filter(Boolean).length} / 1500
                          </span>
                        </div>
                        <textarea 
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-96 font-mono"
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
                        <details className="text-xs text-slate-500">
                          <summary className="cursor-pointer font-bold">Raw FAQ JSON</summary>
                          <textarea
                            className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-32 font-mono"
                            placeholder='[{"question": "How to rent?", "answer": "Steps..."}]'
                            value={editingArticle.faqJson || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, faqJson: e.target.value})}
                          />
                        </details>
                      </div>

                      {/* Internal Links Editor */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Structured Related Content JSON</label>
                        {[
                          ['relatedRoutesJson', 'Related Routes'],
                          ['relatedAirportsJson', 'Related Airports'],
                          ['relatedDestinationsJson', 'Related Destinations'],
                          ['relatedArticlesJson', 'Related Articles']
                        ].map(([field, label]) => (
                          <textarea
                            key={field}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-24 font-mono"
                            placeholder={`[{"label": "${label}", "path": "/car-rental-amman"}]`}
                            value={(editingArticle as any)[field] || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, [field]: e.target.value})}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sidebar / Settings */}
                    <div className="space-y-8">
                      {/* Publishing */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Publishing</h3>
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
                          <span className="text-sm font-bold text-slate-700">Live Status</span>
                          <button 
                            type="button"
                            onClick={() => setEditingArticle({...editingArticle, published: !editingArticle.published, status: !editingArticle.published ? 'PUBLISHED' : 'DRAFT'})}
                            className={`relative w-12 h-6 rounded-full transition-colors ${editingArticle.published ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingArticle.published ? 'left-7' : 'left-1'}`} />
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
