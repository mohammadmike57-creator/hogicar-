import * as React from 'react';
import { useState, useEffect } from 'react';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Send from 'lucide-react/dist/esm/icons/send';
import Users from 'lucide-react/dist/esm/icons/users';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Plus from 'lucide-react/dist/esm/icons/plus';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Search from 'lucide-react/dist/esm/icons/search';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Target from 'lucide-react/dist/esm/icons/target';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import X from 'lucide-react/dist/esm/icons/x';
import History from 'lucide-react/dist/esm/icons/history';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Mail from 'lucide-react/dist/esm/icons/mail';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Play from 'lucide-react/dist/esm/icons/play';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '../../lib/adminApi';
import { PushStats, PushCampaign } from '../../types';

const PushNotificationManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'campaigns' | 'audience' | 'history' | 'logs'>('dashboard');
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [testToken, setTestToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<PushCampaign>>({
    name: '',
    title: '',
    body: '',
    type: 'MARKETING',
    priority: 'high',
    schedule: 'IMMEDIATE',
    audience: 'EVERYONE'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminFetch('/api/push/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch push stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      await adminFetch('/api/push/campaigns', {
        method: 'POST',
        body: JSON.stringify(newCampaign)
      });
      setIsCreating(false);
      fetchStats();
      setActiveSubTab('history');
    } catch (err) {
      console.error('Failed to create campaign', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await adminFetch(`/api/push/campaigns/${id}`, { method: 'DELETE' });
      fetchStats();
    } catch (err) {
      console.error('Failed to delete campaign', err);
    }
  };

  const handleDuplicateCampaign = async (id: number) => {
    try {
      await adminFetch(`/api/push/campaigns/${id}/duplicate`, { method: 'POST' });
      fetchStats();
      setActiveSubTab('history');
    } catch (err) {
      console.error('Failed to duplicate campaign', err);
    }
  };

  const handleTestPush = async () => {
    if (!testToken) return;
    try {
      setIsTesting(true);
      await adminFetch('/api/push/test', {
        method: 'POST',
        body: JSON.stringify({ tokens: [testToken] })
      });
      alert('Test push sent successfully!');
    } catch (err) {
      alert('Failed to send test push');
    } finally {
      setIsTesting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-card shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            Push Notification Platform
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Enterprise-grade messaging for iOS and Android devices worldwide.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-card text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-card w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'campaigns', label: 'Campaigns', icon: Send },
          { id: 'audience', label: 'Audience', icon: Target },
          { id: 'history', label: 'History', icon: History },
          { id: 'logs', label: 'System Logs', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-card text-[10px] font-extrabold uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'dashboard' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Devices" value={stats.totalDevices} icon={Smartphone} color="blue" />
          <StatCard title="Active Tokens" value={stats.activeTokens} icon={CheckCircle} color="emerald" />
          <StatCard title="iOS Devices" value={stats.iosDevices} icon={Smartphone} color="slate" />
          <StatCard title="Android Devices" value={stats.androidDevices} icon={Smartphone} color="green" />
          <StatCard title="Last 24 Hours" value={stats.last24Hours} icon={Activity} color="orange" />
          <StatCard title="Failed Tokens" value={stats.failedTokens} icon={AlertCircle} color="red" />
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-widest">Recent Campaigns</h3>
            <button className="text-blue-600 text-[10px] font-extrabold uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Campaign</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Audience</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Sent</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Opened</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Created</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentCampaigns.map((campaign: any) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{campaign.name}</div>
                      <div className="text-slate-400 text-[11px] font-medium mt-0.5">{campaign.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-extrabold uppercase tracking-tighter">
                        {campaign.audience}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-tighter ${
                        campaign.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' : 
                        campaign.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{(campaign.sentCount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{(campaign.openedCount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                      {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDuplicateCampaign(campaign.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-card transition-all"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-card transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-widest">System Delivery Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Level</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Message</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-tighter ${
                        log.level === 'ERROR' ? 'bg-red-100 text-red-600' : 
                        log.level === 'WARN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.message}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'audience' && (
        <div className="bg-white p-8 rounded-card border border-slate-100 shadow-sm">
          <div className="max-w-md">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Test Push Notification</h3>
            <p className="text-slate-500 text-sm mb-6">Send a test notification to a specific Expo Push Token.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Expo Push Token</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={testToken}
                    onChange={e => setTestToken(e.target.value)}
                    placeholder="ExponentPushToken[...]"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                  <button 
                    onClick={handleTestPush}
                    disabled={isTesting || !testToken}
                    className="px-6 py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-card text-xs font-extrabold uppercase tracking-widest transition-all"
                  >
                    {isTesting ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Builder Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-card shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create New Campaign</h2>
                  <p className="text-slate-500 text-xs font-medium">Design and target your push notification</p>
                </div>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Left Column: Form */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Notification Content
                      </h3>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Campaign Internal Name</label>
                        <input 
                          type="text" 
                          value={newCampaign.name}
                          onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                          placeholder="e.g. Summer Sale 2026 - UK"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Message Title</label>
                          <input 
                            type="text" 
                            value={newCampaign.title}
                            onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                            placeholder="Grab your summer car!"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Subtitle (Optional)</label>
                          <input 
                            type="text" 
                            value={newCampaign.subtitle}
                            onChange={e => setNewCampaign({...newCampaign, subtitle: e.target.value})}
                            placeholder="Up to 40% off"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Message Body</label>
                        <textarea 
                          rows={3}
                          value={newCampaign.body}
                          onChange={e => setNewCampaign({...newCampaign, body: e.target.value})}
                          placeholder="Book now and save on your next road trip..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Target className="w-3 h-3" />
                        Audience & Targeting
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Audience</label>
                          <select 
                            value={newCampaign.audience}
                            onChange={e => setNewCampaign({...newCampaign, audience: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-extrabold text-xs"
                          >
                            <option value="EVERYONE">Everyone</option>
                            <option value="COUNTRY">Specific Country</option>
                            <option value="CITY">Specific City</option>
                            <option value="PLATFORM">Device Platform</option>
                            <option value="ACTIVE_USERS">Active Users (7 days)</option>
                            <option value="NEW_USERS">New Users (24h)</option>
                            <option value="ABANDONED_CHECKOUT">Abandoned Checkout</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Target Value</label>
                          <input 
                            type="text" 
                            value={newCampaign.targetValue}
                            onChange={e => setNewCampaign({...newCampaign, targetValue: e.target.value})}
                            placeholder="e.g. United Kingdom"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Scheduling
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Send Type</label>
                          <select 
                            value={newCampaign.schedule}
                            onChange={e => setNewCampaign({...newCampaign, schedule: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-extrabold text-xs"
                          >
                            <option value="IMMEDIATE">Immediately</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="RECURRING">Recurring</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Schedule Time</label>
                          <input 
                            type="datetime-local" 
                            value={newCampaign.scheduleTime}
                            onChange={e => setNewCampaign({...newCampaign, scheduleTime: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Preview */}
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Smartphone className="w-3 h-3" />
                      Live Preview
                    </h3>
                    
                    <div className="relative mx-auto w-[280px] h-[560px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl p-4 overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-10"></div>
                      
                      {/* Status Bar */}
                      <div className="flex justify-between items-center px-4 mt-2 text-[10px] text-white/60 font-medium">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <TrendingUp className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Notification Card */}
                      <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5 text-slate-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-white/80">HOGICAR</span>
                              <span className="text-[9px] text-white/50">now</span>
                            </div>
                            <h4 className="text-white text-[13px] font-bold truncate mt-0.5">{newCampaign.title || 'Notification Title'}</h4>
                            {newCampaign.subtitle && (
                              <p className="text-white/90 text-[11px] font-semibold mt-0.5">{newCampaign.subtitle}</p>
                            )}
                            <p className="text-white/70 text-[11px] leading-tight mt-1 line-clamp-3">
                              {newCampaign.body || 'This is how your message will appear to users on their mobile devices.'}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Lock Screen Wallpaper Hint */}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
                      
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
                    </div>

                    <div className="mt-8 space-y-4">
                       <div className="bg-blue-50 border border-blue-100 p-4 rounded-card">
                          <div className="flex gap-3">
                            <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-blue-900">Campaign Impact</p>
                              <p className="text-[10px] text-blue-700 mt-0.5">Estimated reach: <strong>{stats?.activeTokens.toLocaleString()}</strong> devices worldwide.</p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-extrabold uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  onClick={handleCreateCampaign}
                  disabled={loading || !newCampaign.name || !newCampaign.title || !newCampaign.body}
                  className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-card text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg shadow-blue-200"
                >
                  {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Launch Campaign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    slate: 'text-slate-600 bg-slate-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50'
  };

  return (
    <div className="bg-white p-6 rounded-card border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-2xl font-black text-slate-900">{value.toLocaleString()}</h4>
        </div>
        <div className={`p-3 rounded-card ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-bold text-emerald-500">+12% from last week</span>
      </div>
    </div>
  );
};

export default PushNotificationManagement;
