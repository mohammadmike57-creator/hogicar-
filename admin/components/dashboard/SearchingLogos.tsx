// Admin dashboard: SearchingLogos (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit from 'lucide-react/dist/esm/icons/edit';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import { 
    adminFetch 
} from '../../../lib/adminApi';

import { LocationPicker } from './EditSupplierModal';
import { getImageUrl, resizeImage } from './images';
import { Badge, InputField, Modal } from './ui';

// ==================== Homepage Logos ====================
// ==================== Searching Page Logos ====================
export const SearchingLogosContent = () => {
    const [logos, setLogos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLogo, setEditingLogo] = useState<any>(null);

    const fetchLogos = async () => {
        setLoading(true);
        try {
            const data = await adminFetch(`/api/admin/searching-logos?t=${Date.now()}`);
            const logosArray = Array.isArray(data) ? data : [];
            setLogos(logosArray);
        } catch (e: any) {
            console.error('[DEBUG] Failed to fetch searching logos', e);
            alert(`Failed to load branding logos: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogos(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this searching logo?')) return;
        try {
            await adminFetch(`/api/admin/searching-logos/${id}`, { method: 'DELETE' });
            await fetchLogos();
            alert('Branding logo removed successfully!');
        } catch (e: any) {
            alert(`Delete failed: ${e.message}`);
        }
    };

    const handleSave = async (logo: any) => {
        setLoading(true);
        try {
            const isNew = !logo.id;
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew ? '/api/admin/searching-logos' : `/api/admin/searching-logos/${logo.id}`;
            
            const saved = await adminFetch(url, {
                method,
                body: JSON.stringify(logo)
            });
            
            await fetchLogos();
            setEditingLogo(null);
            alert(isNew ? 'New branding logo added successfully!' : 'Branding logo updated successfully!');
        } catch (e: any) {
            console.error('[DEBUG] Save operation failed:', e);
            alert(`Save failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <EditSearchingLogoModal 
                isOpen={!!editingLogo} 
                onClose={() => setEditingLogo(null)} 
                onSave={handleSave} 
                logo={editingLogo} 
                loading={loading}
            />
            
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight text-left">Searching Page Branding</h2>
                        <p className="text-sm text-gray-500 font-medium text-left">Manage logos displayed during the scanning animation for specific locations</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchLogos} disabled={loading} className="p-2.5 rounded-card bg-white border border-gray-200 text-gray-500 hover:text-[#007ac2] hover:border-blue-200 transition-all shadow-sm">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setEditingLogo({ name: '', logoUrl: '', locationCodes: [], displayOrder: logos.length + 1, scale: 100, mobileScale: 100, spacing: 24, active: true })} 
                            className="bg-[#007ac2] text-white px-6 py-2.5 rounded-card font-bold text-sm shadow-lg shadow-blue-200 hover:bg-[#007ac2] transition-all flex items-center gap-2">
                            <PlusCircle className="w-5 h-5" />
                            Add New Searching Logo
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Preview</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Name</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Order</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading logos...</td></tr>
                            ) : logos.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold">No searching logos configured yet</td></tr>
                            ) : logos.map((l: any) => (
                                <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="w-20 h-10 bg-white border border-slate-100 rounded-card flex items-center justify-center p-1.5 shadow-sm group-hover:border-blue-200 transition-colors">
                                            {l.logoUrl ? (
                                                <img src={getImageUrl(l.logoUrl)} alt={l.name} className="max-w-full max-h-full object-contain" width="100" height="50" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-sm font-extrabold text-slate-900">{l.name}</span></td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {Array.isArray(l.locationCodes) && l.locationCodes.length > 0 ? (
                                                l.locationCodes.map((code: string) => (
                                                    <span key={code} className="text-[9px] font-mono font-bold text-[#007ac2] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                                                        {code}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-tighter">GLOBAL</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4"><span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{l.displayOrder}</span></td>
                                    <td className="px-8 py-4"><Badge status={l.active ? 'active' : 'inactive'} /></td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingLogo(l)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-[#007ac2] rounded-card transition-all"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-card transition-all"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const EditSearchingLogoModal = ({ isOpen, onClose, onSave, logo, loading }: any) => {
    const [formData, setFormData] = useState<any>(logo || {});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (logo) setFormData(logo); }, [logo]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await resizeImage(file, 800, 400);
                setFormData({ ...formData, logoUrl: base64 });
            } catch (err) {
                alert('Failed to process image');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={logo?.id ? 'Edit Searching Logo' : 'Add New Searching Logo'} size="md">
            <div className="space-y-6">
                <InputField label="Name / Brand" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Local Jordan Partner" />
                
                <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Logo Image</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <InputField value={formData.logoUrl} onChange={(e: any) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="Paste direct image URL or upload →" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-card transition-colors flex items-center justify-center text-slate-400 hover:text-[#007ac2] hover:border-blue-200">
                            <ImageIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {formData.logoUrl && (
                        <div className="mt-4 p-4 border border-slate-100 rounded-card bg-slate-50/50 flex items-center justify-center">
                            <img src={getImageUrl(formData.logoUrl)} alt="Preview" className="max-h-24 object-contain drop-shadow-sm" width="200" height="100" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Target Locations (IATA/City)</label>
                    <LocationPicker 
                        onChange={(loc: any) => {
                            if (!loc) return;
                            const code = loc.iataCode || loc.value;
                            const currentCodes = Array.isArray(formData.locationCodes) ? formData.locationCodes : [];
                            if (!currentCodes.includes(code)) {
                                setFormData({ ...formData, locationCodes: [...currentCodes, code] });
                            }
                        }} 
                        placeholder="Search to add location..." 
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px] items-center">
                        {(!Array.isArray(formData.locationCodes) || formData.locationCodes.length === 0) && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-card uppercase tracking-wider border border-slate-100">Global (All Locations)</span>
                        )}
                        {Array.isArray(formData.locationCodes) && formData.locationCodes.map((code: string) => (
                            <span key={code} className="bg-blue-50 text-[#007ac2] pl-3 pr-2 py-1.5 rounded-card text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-2 border border-blue-100 group">
                                {code}
                                <button 
                                    onClick={() => setFormData({ ...formData, locationCodes: formData.locationCodes.filter((c: string) => c !== code) })} 
                                    className="p-1 rounded-card hover:bg-blue-200/50 text-blue-400 hover:text-blue-800 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Add multiple locations. If empty, this logo will appear everywhere as a global partner.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Display Order" type="number" value={formData.displayOrder ?? 0} onChange={(e: any) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
                    <InputField label="Scale (Desktop %)" type="number" value={formData.scale ?? 100} onChange={(e: any) => setFormData({ ...formData, scale: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Scale (Mobile %)" type="number" value={formData.mobileScale ?? 100} onChange={(e: any) => setFormData({ ...formData, mobileScale: parseInt(e.target.value) || 0 })} />
                    <InputField label="Spacing (px)" type="number" value={formData.spacing ?? 24} onChange={(e: any) => setFormData({ ...formData, spacing: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Status</label>
                    <select 
                        className="w-full bg-white border border-slate-200 rounded-card px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} type="button" className="flex-1 py-4 rounded-card font-extrabold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button 
                        onClick={() => { 
                            if (!formData.name?.trim()) { alert('Please provide a name/brand'); return; }
                            if (!formData.logoUrl?.trim()) { alert('Please provide a logo URL or upload an image'); return; }
                            
                            const payload = {
                                ...formData,
                                displayOrder: Number(formData.displayOrder) || 0,
                                scale: Number(formData.scale) || 100,
                                mobileScale: Number(formData.mobileScale) || 100,
                                spacing: Number(formData.spacing) || 24,
                                locationCodes: Array.isArray(formData.locationCodes) ? formData.locationCodes : []
                            };
                            onSave(payload); 
                        }} 
                        type="button"
                        disabled={loading}
                        className={`flex-1 py-4 rounded-card font-extrabold text-xs uppercase tracking-widest text-white transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#007ac2] shadow-lg shadow-blue-200 hover:bg-[#007ac2]'}`}
                    >
                        {loading ? 'Processing...' : (logo?.id ? 'Update Branding' : 'Add Branding')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
