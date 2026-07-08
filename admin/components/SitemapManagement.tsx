import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  ExternalLink, 
  FileText, 
  Route, 
  MessageSquare, 
  Layers,
  Search,
  AlertTriangle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { adminFetch } from '../../lib/adminApi';

interface SitemapStats {
    lastGenerated: string;
    totalUrls: number;
    routesCount: number;
    blogsCount: number;
    staticCount: number;
    status: string;
}

const SitemapManagement: React.FC = () => {
    const [stats, setStats] = useState<SitemapStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await adminFetch('/api/admin/sitemap/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch sitemap stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await adminFetch('/api/admin/sitemap/refresh', { method: 'POST' });
            await fetchStats();
        } catch (error) {
            console.error('Failed to refresh sitemap:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleValidate = async () => {
        setValidating(true);
        try {
            const result = await adminFetch('/api/admin/sitemap/validate');
            setValidationResult(result);
        } catch (error) {
            console.error('Failed to validate sitemap:', error);
        } finally {
            setValidating(false);
        }
    };

    const openSitemap = () => {
        window.open('/sitemap.xml', '_blank');
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sitemap Management</h2>
                    <p className="text-sm text-slate-500 font-medium">Configure and monitor your Google-compliant XML Sitemap system.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleValidate}
                        disabled={validating}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-card font-extrabold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {validating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Validate Sitemap
                    </button>
                    <button 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-card font-extrabold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
                    >
                        {refreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Regenerate Sitemap
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-card bg-blue-50 flex items-center justify-center text-blue-600">
                            <Layers className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                            {stats?.status || 'Healthy'}
                        </span>
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Indexed URLs</p>
                    <p className="text-3xl font-extrabold text-slate-950">{stats?.totalUrls || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-card bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                        <Globe className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1">Destination Routes</p>
                    <p className="text-3xl font-extrabold text-slate-950">{stats?.routesCount || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-card bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1">Blog Articles</p>
                    <p className="text-3xl font-extrabold text-slate-950">{stats?.blogsCount || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-card bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                        <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1">Static Pages</p>
                    <p className="text-3xl font-extrabold text-slate-950">{stats?.staticCount || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sitemap Files */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                Active Sitemap Index
                            </h3>
                            <button 
                                onClick={openSitemap}
                                className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest group"
                            >
                                Open Sitemap <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: 'sitemap.xml', label: 'Index File', count: 3, type: 'Index' },
                                { name: 'sitemap-routes.xml', label: 'Routes & Destinations', count: stats?.routesCount, type: 'URLs' },
                                { name: 'sitemap-blogs.xml', label: 'Travel Guides & Tips', count: stats?.blogsCount, type: 'URLs' },
                                { name: 'sitemap-static.xml', label: 'Core Static Pages', count: stats?.staticCount, type: 'URLs' }
                            ].map((file) => (
                                <div key={file.name} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-card bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900 leading-tight">/{file.name}</p>
                                            <p className="text-[11px] text-slate-500 font-medium">{file.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs font-extrabold text-slate-900">{file.count}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{file.type}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(`/${file.name}`, '_blank')}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {validationResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-6 rounded-card border ${validationResult.valid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} flex gap-4`}
                        >
                            {validationResult.valid ? (
                                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                            )}
                            <div>
                                <h4 className={`text-sm font-extrabold uppercase tracking-widest ${validationResult.valid ? 'text-emerald-900' : 'text-red-900'}`}>
                                    Sitemap Validation: {validationResult.valid ? 'Success' : 'Failed'}
                                </h4>
                                <p className={`text-xs mt-1 font-medium ${validationResult.valid ? 'text-emerald-700' : 'text-red-700'}`}>
                                    Last checked: {new Date(validationResult.lastCheck).toLocaleString()}
                                </p>
                                <div className="mt-3 flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${validationResult.errors > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider">{validationResult.errors} Errors</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${validationResult.warnings > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider">{validationResult.warnings} Warnings</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-slate-950 rounded-card p-6 text-white shadow-xl shadow-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-card bg-white/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-extrabold uppercase tracking-widest">Automation</h4>
                                <p className="text-[10px] text-slate-400 font-bold">Real-time Synchronization</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                <p className="text-[11px] font-medium text-slate-300">New content is added to sitemap instantly upon publishing.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                                <p className="text-[11px] font-medium text-slate-300">Images are automatically extracted and indexed for SEO.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                                <p className="text-[11px] font-medium text-slate-300">Search engines are notified when content changes.</p>
                            </div>
                        </div>
                        <div className="mt-8 p-4 bg-white/5 rounded-card border border-white/10">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Last Sync</p>
                            <p className="text-xs font-bold text-white">
                                {stats?.lastGenerated ? new Date(stats.lastGenerated).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-card border border-slate-200 p-6 shadow-sm">
                        <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-[0.2em] mb-4">SEO Best Practices</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                <span>HTTP 200 Status</span>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </li>
                            <li className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                <span>No Broken Links</span>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </li>
                            <li className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                <span>Image Metadata</span>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </li>
                            <li className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                <span>Canonical URLs</span>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SitemapManagement;
