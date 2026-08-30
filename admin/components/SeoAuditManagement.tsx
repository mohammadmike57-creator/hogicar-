import * as React from 'react';
import { useState, useEffect } from 'react';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Search from 'lucide-react/dist/esm/icons/search';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import BarChart from 'lucide-react/dist/esm/icons/bar-chart';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Activity from 'lucide-react/dist/esm/icons/activity';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch, performSeoAudit } from '../../lib/adminApi';

const SeoAuditManagement: React.FC = () => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'issues' | 'cannibalization' | 'all-urls'>('overview');

    const handleRunAudit = async () => {
        setLoading(true);
        try {
            const data = await performSeoAudit();
            setReport(data);
        } catch (error) {
            console.error('Failed to run SEO audit:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleRunAudit();
    }, []);

    if (loading && !report) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-extrabold uppercase tracking-[0.2em] text-xs">Scanning Entire Website SEO...</p>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-card bg-${color}-50 flex items-center justify-center text-${color}-600`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-3xl font-extrabold text-slate-950">{value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">SEO Quality Control</h2>
                    <p className="text-sm text-slate-500 font-medium">Automated site-wide audit for indexing, cannibalization, and ranking health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${report?.healthGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {report?.healthGreen ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                            SEO Status: {report?.healthGreen ? 'HEALTHY' : 'ACTION REQUIRED'}
                        </span>
                    </div>
                    <button 
                        onClick={handleRunAudit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-card font-extrabold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                        Run Full Audit
                    </button>
                </div>
            </div>

            {/* Overall Score */}
            <div className="bg-white rounded-card border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
                <div className="md:w-1/3 p-8 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                className={report?.overallSeoScore > 90 ? "text-emerald-500" : report?.overallSeoScore > 70 ? "text-amber-500" : "text-rose-500"}
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * report?.overallSeoScore) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-3xl font-extrabold text-slate-900">{report?.overallSeoScore}%</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs">Overall SEO Authority</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Based on technical and content quality audits.</p>
                </div>
                <div className="md:w-2/3 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Audited URLs</p>
                        <p className="text-2xl font-extrabold text-slate-900">{report?.totalUrlsAudited}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Indexable</p>
                        <p className="text-2xl font-extrabold text-emerald-600">{report?.indexableCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Orphan Pages</p>
                        <p className="text-2xl font-extrabold text-rose-600">{report?.orphanPageCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Cannibalization</p>
                        <p className="text-2xl font-extrabold text-amber-600">{report?.cannibalizationGroupCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Duplicate Titles</p>
                        <p className="text-2xl font-extrabold text-rose-500">{report?.duplicateTitleCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Duplicate H1</p>
                        <p className="text-2xl font-extrabold text-rose-500">{report?.duplicateH1Count}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Thin Content</p>
                        <p className="text-2xl font-extrabold text-amber-500">{report?.thinContentCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Meta Errors</p>
                        <p className="text-2xl font-extrabold text-rose-500">{report?.duplicateDescriptionCount}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart },
                    { id: 'issues', label: 'Issues & Fixes', icon: AlertCircle },
                    { id: 'cannibalization', label: 'Cannibalization', icon: Layers },
                    { id: 'all-urls', label: 'Audit Details', icon: Search }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all text-xs font-extrabold uppercase tracking-widest ${
                            selectedTab === tab.id 
                            ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {selectedTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-card border border-slate-200 p-6 space-y-6">
                            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-widest mb-4">Jordan Core Structure</h3>
                            <div className="space-y-3">
                                {[
                                    { route: '/car-rental-jordan', name: 'Jordan Hub' },
                                    { route: '/car-rental-amman', name: 'Amman City' },
                                    { route: '/car-rental-aqaba', name: 'Aqaba City' },
                                    { route: '/queen-alia-airport-car-rental', name: 'Queen Alia Airport' },
                                    { route: '/aqaba-airport-car-rental', name: 'Aqaba Airport' },
                                    { route: '/car-rental-petra', name: 'Petra' },
                                    { route: '/car-rental-dead-sea', name: 'Dead Sea' },
                                    { route: '/car-rental-wadi-rum', name: 'Wadi Rum' }
                                ].map(item => {
                                    const audit = report.auditResults.find((r: any) => r.route === item.route);
                                    return (
                                        <div key={item.route} className="flex items-center justify-between p-3 bg-slate-50 rounded-card border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${audit ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                <div>
                                                    <p className="text-xs font-extrabold text-slate-900">{item.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">{item.route}</p>
                                                </div>
                                            </div>
                                            {audit && (
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-extrabold text-slate-900">{audit.seoScore}%</p>
                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Score</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white rounded-card border border-slate-200 p-6">
                            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-widest mb-4">Top SEO Opportunities</h3>
                            <div className="space-y-4">
                                {report.auditResults
                                    .filter((r: any) => r.priority === 'P0' || r.priority === 'P1')
                                    .sort((a: any, b: any) => a.seoScore - b.seoScore)
                                    .slice(0, 8)
                                    .map((r: any) => (
                                        <div key={r.id} className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-extrabold text-slate-900">{r.route}</p>
                                                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">{r.seoScore}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${r.seoScore}%` }}></div>
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                {r.healthWarnings.slice(0, 2).map((w: string, i: number) => (
                                                    <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {w}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {selectedTab === 'issues' && (
                    <div className="bg-white rounded-card border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Severity</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">URL</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Issue</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Recommended Fix</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.issues.map((issue: any, index: number) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                                issue.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                                issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {issue.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900">{issue.url}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{issue.issue}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-blue-600">{issue.recommendedFix}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedTab === 'cannibalization' && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-card flex gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                            <div>
                                <h4 className="text-sm font-extrabold text-amber-900 uppercase tracking-widest">Understanding Cannibalization</h4>
                                <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
                                    Keyword cannibalization occurs when multiple pages target the same primary keyword. This confuses search engines and splits your ranking power.
                                    Consolidate these pages or differentiate their primary keywords to restore authority.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(report.cannibalizationGroups).map(([keyword, urls]: any) => (
                                <div key={keyword} className="bg-white rounded-card border border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layers className="w-4 h-4 text-amber-500" />
                                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-widest">Target: "{keyword}"</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {urls.map((url: string) => (
                                            <div key={url} className="flex items-center justify-between p-2 bg-slate-50 rounded-card border border-slate-100 text-[11px] font-bold text-slate-700">
                                                {url}
                                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                        <button className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest hover:underline">
                                            Merge Strategy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTab === 'all-urls' && (
                    <div className="bg-white rounded-card border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">URL</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Score</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Links (In/Out)</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Primary Keyword</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Health</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.auditResults.map((audit: any) => (
                                    <tr key={audit.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-extrabold text-slate-900">{audit.route}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{audit.routeType} | {audit.lang}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-extrabold ${
                                                audit.seoScore > 90 ? 'text-emerald-600' : 
                                                audit.seoScore > 70 ? 'text-amber-600' : 'text-rose-600'
                                            }`}>
                                                {audit.seoScore}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                                    <LinkIcon className="w-3 h-3 rotate-45" /> {audit.inboundLinksCount}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                                    <LinkIcon className="w-3 h-3 -rotate-45" /> {audit.outboundLinksCount}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700 italic">
                                            {audit.primaryKeyword || <span className="text-slate-300 font-normal">None</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {audit.healthWarnings.length === 0 ? (
                                                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest">Healthy</span>
                                                ) : (
                                                    audit.healthWarnings.slice(0, 2).map((w: string, i: number) => (
                                                        <span key={i} className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {w}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeoAuditManagement;
