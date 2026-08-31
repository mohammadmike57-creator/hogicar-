import * as React from 'react';
import { useState, useEffect } from 'react';
import Globe from 'lucide-react/dist/esm/icons/globe';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Route from 'lucide-react/dist/esm/icons/route';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Search from 'lucide-react/dist/esm/icons/search';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Send from 'lucide-react/dist/esm/icons/send';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Filter from 'lucide-react/dist/esm/icons/filter';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '../../lib/adminApi';

interface SitemapStats {
    lastGenerated: string;
    totalUrls: number;
    routesCount: number;
    airportPages: number;
    blogsCount: number;
    staticCount: number;
    imagesCount: number;
    lastValidation: string;
    status: string;
}

interface SitemapEntry {
    url: string;
    route: string;
    routeType: string;
    country: string;
    lang: string;
    lifecycleStatus: string;
    included: boolean;
    status: string;
    reason: string;
    lastmod: string;
}

interface SitemapReport {
    generatedAt: string;
    country: string;
    lang: string;
    totalRoutes: number;
    includedCount: number;
    excludedCount: number;
    breakdown: Record<string, number>;
    entries: SitemapEntry[];
}

const SitemapManagement: React.FC = () => {
    const [stats, setStats] = useState<SitemapStats | null>(null);
    const [report, setReport] = useState<SitemapReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    
    const [countryFilter, setCountryFilter] = useState('');
    const [langFilter, setLangFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'INCLUDED' | 'EXCLUDED'>('ALL');

    const countries = [
        { code: '', name: 'All Countries' },
        { code: 'JO', name: 'Jordan' },
        { code: 'AE', name: 'United Arab Emirates' },
        { code: 'SA', name: 'Saudi Arabia' },
        { code: 'QA', name: 'Qatar' },
        { code: 'BH', name: 'Bahrain' },
        { code: 'OM', name: 'Oman' },
        { code: 'EG', name: 'Egypt' }
    ];

    const languages = [
        { code: '', name: 'All Languages' },
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'Arabic' }
    ];

    const fetchStats = async () => {
        try {
            const data = await adminFetch('/api/admin/sitemap/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch sitemap stats:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/sitemap/report?`;
            if (countryFilter) url += `country=${countryFilter}&`;
            if (langFilter) url += `lang=${langFilter}&`;
            
            const data = await adminFetch(url);
            setReport(data);
        } catch (error) {
            console.error('Failed to fetch sitemap report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [countryFilter, langFilter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await adminFetch('/api/admin/sitemap/refresh', { method: 'POST' });
            await Promise.all([fetchStats(), fetchReport()]);
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

    const submitToGoogle = () => {
        window.open('https://search.google.com/search-console/sitemaps', '_blank');
    };

    const filteredEntries = report?.entries.filter(entry => {
        if (statusFilter === 'INCLUDED') return entry.included;
        if (statusFilter === 'EXCLUDED') return !entry.included;
        return true;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sitemap Control Center</h2>
                    <p className="text-sm text-slate-500 font-medium">Authoritative SEO inventory-based XML Sitemap management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleValidate}
                        disabled={validating}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-card font-extrabold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {validating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Validate
                    </button>
                    <button 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-card font-extrabold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
                    >
                        {refreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Sync Sitemap
                    </button>
                    <button
                        onClick={submitToGoogle}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-card font-extrabold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Google Console
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-card border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Filters:</span>
                </div>
                
                <select 
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="text-xs font-bold text-slate-700 border-slate-200 rounded-card focus:ring-blue-500 focus:border-blue-500"
                >
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>

                <select 
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="text-xs font-bold text-slate-700 border-slate-200 rounded-card focus:ring-blue-500 focus:border-blue-500"
                >
                    {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>

                <div className="h-4 w-px bg-slate-200 mx-2"></div>

                <div className="flex items-center bg-slate-100 p-1 rounded-card">
                    {(['ALL', 'INCLUDED', 'EXCLUDED'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-card text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                                statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Routes</p>
                    <p className="text-3xl font-extrabold text-slate-950">{report?.totalRoutes || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-[0.2em] mb-1">Included in Sitemap</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-extrabold text-slate-950">{report?.includedCount || 0}</p>
                        <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-[0.2em] mb-1">Excluded (Noindex/Other)</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-extrabold text-slate-950">{report?.excludedCount || 0}</p>
                        <XCircle className="w-5 h-5 text-rose-500 mb-2" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] mb-1">Health Score</p>
                    <p className="text-3xl font-extrabold text-slate-950">
                        {report ? Math.round((report.includedCount / report.totalRoutes) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Inventory Table */}
                <div className="lg:col-span-3 bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-500" />
                            Authoritative Sitemap Inventory
                        </h3>
                        <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
                            Showing {filteredEntries.length} items
                        </span>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">URL / Path</th>
                                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Country/Lang</th>
                                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Exclusion Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning inventory...</p>
                                        </td>
                                    </tr>
                                ) : filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                                            No routes matching filters found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                {entry.included ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-100">
                                                        <CheckCircle className="w-3 h-3" /> Included
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border border-slate-200">
                                                        <XCircle className="w-3 h-3" /> Excluded
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col max-w-md overflow-hidden">
                                                    <p className="text-xs font-extrabold text-slate-900 truncate">{entry.url}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold truncate">{entry.route}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {entry.routeType || 'DESTINATION'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-extrabold text-slate-700">{entry.country || 'Global'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">{entry.lang}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {entry.reason ? (
                                                    <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-100">
                                                        {entry.reason}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-extrabold text-slate-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Exclusion Breakdown */}
                <div className="space-y-6">
                    <div className="bg-white rounded-card border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            Exclusion Breakdown
                        </h3>
                        <div className="space-y-4">
                            {report && Object.entries(report.breakdown).length > 0 ? (
                                Object.entries(report.breakdown).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                                    <div key={reason} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                                            <span className="text-slate-500">{reason}</span>
                                            <span className="text-slate-900">{count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(count / report.excludedCount) * 100}%` }}
                                                className="h-full bg-rose-500"
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs font-bold text-slate-400 italic">No exclusions recorded.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-card p-6 text-white shadow-xl shadow-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-card bg-white/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-extrabold uppercase tracking-widest text-white">Sitemap State</h4>
                                <p className="text-[10px] text-slate-400 font-bold">Inventory Sync Status</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 rounded-card border border-white/10">
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Last Generated</p>
                                <p className="text-xs font-bold text-white">{stats?.lastGenerated ? new Date(stats.lastGenerated).toLocaleString() : 'Never'}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-card border border-white/10">
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Index Files</p>
                                <div className="space-y-1 mt-2">
                                    <p className="text-[10px] font-medium text-slate-300 flex justify-between">
                                        <span>/sitemap.xml</span>
                                        <span className="text-emerald-400">ACTIVE</span>
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-300 flex justify-between">
                                        <span>/sitemap-routes.xml</span>
                                        <span className="text-emerald-400">{stats?.routesCount || 0} URLs</span>
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-300 flex justify-between">
                                        <span>/sitemap-images.xml</span>
                                        <span className="text-emerald-400">{stats?.imagesCount || 0} IMG</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SitemapManagement;
