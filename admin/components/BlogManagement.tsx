import * as React from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, EyeOff, 
  Calendar, User, Tag, FileText, ChevronRight,
  Save, X, Globe, MessageSquare, AlertCircle,
  LoaderCircle, ImageIcon, ChevronDown
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
  mobileImage: string;
  thumbnailImage: string;
  category: BlogCategory | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  faqJson: string;
  relatedRoutesJson: string;
  destinations: string;
  airportTags: string;
  countryTag: string;
  readingTime: string;
  featuredOnHomepage: boolean;
  isFeatured: boolean;
  tags: string;
  authorName: string;
  authorImage: string;
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

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminFetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('Failed to delete category');
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
        <button 
          onClick={() => {
            if (activeTab === 'articles') {
              setEditingArticle({ published: false, category: categories[0] || null });
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
                          <Eye size={12} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tighter">
                          <EyeOff size={12} /> Draft
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
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Country Tag</label>
                          <input 
                            type="text"
                            placeholder="e.g., Jordan"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-bold"
                            value={editingArticle.countryTag || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, countryTag: e.target.value})}
                          />
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
                            value={editingArticle.airportTags || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, airportTags: e.target.value})}
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
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Content (HTML Supported)</label>
                        <textarea 
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-96 font-mono"
                          value={editingArticle.content || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, content: e.target.value})}
                        />
                      </div>

                      {/* FAQ Editor */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">FAQ Section (JSON Format)</label>
                        <textarea 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-32 font-mono"
                          placeholder='[{"question": "How to rent?", "answer": "Steps..."}]'
                          value={editingArticle.faqJson || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, faqJson: e.target.value})}
                        />
                      </div>

                      {/* Internal Links Editor */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Related Routes (Internal Links JSON)</label>
                        <textarea 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm h-32 font-mono"
                          placeholder='[{"label": "Car Rental in Amman", "path": "/car-rental-amman"}]'
                          value={editingArticle.relatedRoutesJson || ''}
                          onChange={(e) => setEditingArticle({...editingArticle, relatedRoutesJson: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Sidebar / Settings */}
                    <div className="space-y-8">
                      {/* Publishing */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Publishing</h3>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-sm font-bold text-slate-700">Live Status</span>
                          <button 
                            type="button"
                            onClick={() => setEditingArticle({...editingArticle, published: !editingArticle.published})}
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
                            label="Desktop (Main)"
                            placeholder="Desktop image URL..."
                            value={editingArticle.featuredImage || ''}
                            onChange={(e) => setEditingArticle({...editingArticle, featuredImage: e.target.value})}
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
                        </div>
                      </div>

                      {/* SEO Settings */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Globe size={14} /> SEO Meta
                        </h3>
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
                        </div>
                      </div>

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
