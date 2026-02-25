
import * as React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_STATS, SUPPLIERS, MOCK_BOOKINGS, addMockSupplier, processSupplierXmlUpdate, MOCK_API_PARTNERS, addMockApiPartner, generateApiKey, updateApiPartnerStatus, MOCK_CARS, MOCK_PAGES, updatePage, MOCK_SEO_CONFIGS, updateSeoConfig, MOCK_HOMEPAGE_CONTENT, updateHomepageContent, MOCK_APP_CONFIG, updateAppConfig, MOCK_CAR_LIBRARY, saveCarModel, deleteCarModel, MOCK_AFFILIATES, updateAffiliateStatus, updateAffiliateCommissionRate, MOCK_SUPPLIER_APPLICATIONS, removeSupplierApplication, MOCK_CATEGORY_IMAGES, updateCategoryImages, calculatePrice, addPromoCode, MOCK_PROMO_CODES, updatePromoCodeStatus, deletePromoCode } from '../services/mockData';
import { Users, Car as CarIcon, TrendingUp, AlertCircle, Edit, Save, X, LayoutDashboard, Building, Plus, Rss, Key, Link2, XCircle, RefreshCw, Copy, Check, DollarSign as DollarSignIcon, Share2, Power, Code, Menu, Mail, LogOut, FileText, Globe, Search as SearchIcon, ImageIcon, PlusCircle, Trash2, Shield, SlidersHorizontal, CheckCircle, ChevronDown, ChevronUp, PowerOff, MailQuestion, CheckSquare, XSquare, Tag, Calendar, Gift, Monitor, Tablet, Smartphone, Expand } from 'lucide-react';
import { Supplier, CommissionType, BookingMode, ApiConnection, ApiPartner, PageContent, SEOConfig, HomepageContent, FeatureItem, StepItem, ValuePropositionItem, DestinationItem, FaqItem, CarModel, CarCategory, CarType, Affiliate, SupplierApplication, Car, RateTier, RateByDay, PromoCode } from '../types';
import { useNavigate } from 'react-router-dom';

import { adminApi } from '../api';

interface SupplierRowProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onApprove: (id: string) => void;
  onManageApi: (supplier: Supplier) => void;
}

const EditSupplierModal = ({ supplier, isOpen, onClose, onSave }: { supplier: Supplier | null, isOpen: boolean, onClose: () => void, onSave: (s: Supplier) => void }) => {
    const [editedSupplier, setEditedSupplier] = React.useState<Partial<Supplier>>({});
    const [locations, setLocations] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            setEditedSupplier(supplier || {});
            adminApi.getLocations().then(setLocations).catch(console.error);
        }
    }, [supplier, isOpen]);

    const handleChange = (field: keyof Supplier, value: any) => {
        setEditedSupplier(prev => ({ ...prev, [field]: value }));
    };
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('logo', reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSave = () => {
        // Basic validation
        if (!editedSupplier.name || !editedSupplier.contactEmail) {
            alert("Supplier Name and Contact Email are required.");
            return;
        }
        onSave(editedSupplier as Supplier);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">{supplier?.id ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    {/* Section 1: Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Logo</label>
                            <div className="flex flex-col items-center gap-2">
                                {editedSupplier.logo ? (
                                    <img src={editedSupplier.logo} alt="Logo Preview" className="w-24 h-24 object-contain rounded-full border p-1 bg-slate-50"/>
                                ) : (
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-400"/></div>
                                )}
                                <label htmlFor="logo-upload" className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                                    {editedSupplier.logo ? 'Change' : 'Upload'}
                                    <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload}/>
                                </label>
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <InputField label="Company Name" value={editedSupplier.name || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)} />
                            <InputField label="Contact Email" type="email" value={editedSupplier.contactEmail || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('contactEmail', e.target.value)} />
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Location</label>
                                <select 
                                    value={editedSupplier.locationCode || ''} 
                                    onChange={(e) => {
                                        handleChange('locationCode', e.target.value);
                                        const selectedLoc = locations.find(l => l.iataCode === e.target.value);
                                        if (selectedLoc) {
                                            handleChange('location', selectedLoc.name);
                                        }
                                    }}
                                    className="block w-full border-gray-300 rounded border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3"
                                >
                                    <option value="">Select a location</option>
                                    {locations.map((loc) => (
                                        <option key={loc.iataCode} value={loc.iataCode}>
                                            {loc.name} ({loc.iataCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Section 2: Commission */}
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Commission & Booking</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <SelectField label="Commission Type" value={editedSupplier.commissionType || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('commissionType', e.target.value)} options={Object.values(CommissionType)} />
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Commission Value</label>
                                <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{editedSupplier.commissionType === 'Pay at Desk' ? '$' : '%'}</span>
                                     <input type="number" step="0.01" value={editedSupplier.commissionValue || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('commissionValue', parseFloat(e.target.value))} className="pl-7 w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" />
                                </div>
                             </div>
                             <SelectField label="Booking Mode" value={editedSupplier.bookingMode || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('bookingMode', e.target.value)} options={Object.values(BookingMode)} />
                        </div>
                    </div>
                    {/* Section: Marketing */}
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Marketing Features</h4>
                        <div className="bg-slate-50 p-3 rounded-lg border">
                            <label className="flex items-center text-sm text-slate-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={editedSupplier.enableSocialProof || false} 
                                    onChange={e => handleChange('enableSocialProof', e.target.checked)} 
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                />
                                <span>Enable "Recently Booked" social proof messages on car cards.</span>
                            </label>
                        </div>
                    </div>
                     {/* Section 3: Credentials */}
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Supplier Portal Credentials</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Username" value={editedSupplier.username || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('username', e.target.value)} />
                            <InputField label="Password" type="password" value={editedSupplier.password || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('password', e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save Supplier
                    </button>
                </div>
            </div>
        </div>
    );
};

const ApiConnectionModal = ({ supplier, isOpen, onClose, onSave }: { supplier: Supplier; isOpen: boolean; onClose: () => void; onSave: (updatedSupplier: Supplier) => void; }) => {
    const [editedSupplier, setEditedSupplier] = React.useState(supplier);
    const [syncing, setSyncing] = React.useState(false);
    const [syncMessage, setSyncMessage] = React.useState('');

    if (!isOpen) return null;

    const handleGenerateCredentials = () => {
        const accountId = `${supplier.name.substring(0,2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const secretKey = `sk_live_${[...Array(24)].map(() => Math.random().toString(36)[2]).join('')}`;
        setEditedSupplier(prev => ({ ...prev, apiConnection: { ...prev.apiConnection, accountId, secretKey } as ApiConnection }));
    };
    
    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage('');
        const result = await processSupplierXmlUpdate(supplier.id);
        setSyncMessage(result.message);
        setSyncing(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Rss className="w-5 h-5 text-blue-600"/> API Connection for {supplier.name}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><XCircle className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Connection Type</label>
                        <select 
                            value={editedSupplier.connectionType} 
                            onChange={e => setEditedSupplier({ ...editedSupplier, connectionType: e.target.value as any })}
                            className="block w-full border-gray-300 rounded border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3"
                        >
                            <option value="manual">Manual (UI Based)</option>
                            <option value="api">API (XML Sync)</option>
                        </select>
                    </div>

                    {editedSupplier.connectionType === 'api' && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Endpoint URL</label>
                                <div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="https://supplier.com/api/v1/inventory.xml" value={editedSupplier.apiConnection?.endpointUrl || ''} onChange={e => setEditedSupplier({ ...editedSupplier, apiConnection: { ...editedSupplier.apiConnection, endpointUrl: e.target.value } as ApiConnection })} className="pl-9 w-full border-gray-300 rounded border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3"/></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Account ID</label>
                                <div className="relative"><input type="text" readOnly value={editedSupplier.apiConnection?.accountId || ''} className="w-full bg-slate-100 border-slate-200 rounded border text-base py-2 px-3 font-mono" /><button onClick={() => copyToClipboard(editedSupplier.apiConnection?.accountId || '')} className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-blue-600"><Copy className="w-3.5 h-3.5"/></button></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">API Secret Key</label>
                                <div className="relative"><input type="text" readOnly value={editedSupplier.apiConnection?.secretKey || ''} className="w-full bg-slate-100 border-slate-200 rounded border text-base py-2 px-3 font-mono" /><button onClick={() => copyToClipboard(editedSupplier.apiConnection?.secretKey || '')} className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-blue-600"><Copy className="w-3.5 h-3.5"/></button></div>
                            </div>
                            <button onClick={handleGenerateCredentials} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"><Key className="w-3 h-3"/> Generate New Credentials</button>
                            
                            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                                <button onClick={handleSync} disabled={syncing} className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                                {syncMessage && <p className="text-xs text-green-600 font-medium">{syncMessage}</p>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end items-center p-4 bg-slate-50 border-t gap-3 sticky bottom-0">
                    <button onClick={onClose} className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-1.5 rounded-md font-medium text-xs">Cancel</button>
                    <button onClick={() => onSave(editedSupplier)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-medium text-xs flex items-center gap-2"><Save className="w-3.5 h-3.5"/> Save Connection</button>
                </div>
            </div>
        </div>
    );
};

const PageEditorModal = ({ page, isOpen, onClose }: { page: PageContent | null; isOpen: boolean; onClose: () => void }) => {
    const [title, setTitle] = React.useState(page?.title || '');
    const [content, setContent] = React.useState(page?.content || '');
    
    // Reset state when page changes
    React.useEffect(() => {
        if (page) {
            setTitle(page.title);
            setContent(page.content);
        }
    }, [page]);

    if (!isOpen || !page) return null;

    const handleSave = () => {
        updatePage(page.slug, { title, content });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">Edit Page: {page.slug}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Page Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base"
                        />
                    </div>
                    <div className="flex-grow flex flex-col h-[400px]">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Content (Text / HTML)</label>
                        <textarea 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            className="w-full h-full border-gray-300 rounded-md border shadow-sm p-3 text-base font-mono leading-relaxed resize-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const SEOEditorModal = ({ config, isOpen, onClose }: { config: SEOConfig | null, isOpen: boolean, onClose: () => void }) => {
    const [route, setRoute] = React.useState('');
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [keywords, setKeywords] = React.useState('');
    const [ogImage, setOgImage] = React.useState('');

    React.useEffect(() => {
        if (config) {
            setRoute(config.route);
            setTitle(config.title);
            setDescription(config.description);
            setKeywords(config.keywords || '');
            setOgImage(config.ogImage || '');
        } else {
            setRoute(''); setTitle(''); setDescription(''); setKeywords(''); setOgImage('');
        }
    }, [config]);

    if (!isOpen) return null;

    const handleSave = () => {
        if(!route || !title) return alert("Route and Title are required");
        updateSeoConfig({ route, title, description, keywords, ogImage });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">{config ? 'Edit SEO' : 'New SEO Configuration'}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Route Path</label>
                        <input type="text" value={route} onChange={e => setRoute(e.target.value)} placeholder="/" className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" disabled={!!config} />
                        <p className="text-[10px] text-slate-400 mt-1">Example: /, /about, /search</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Meta Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Meta Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" rows={3}></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Keywords (comma-separated)</label>
                        <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">OpenGraph Image URL</label>
                        <input type="text" value={ogImage} onChange={e => setOgImage(e.target.value)} className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save SEO
                    </button>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, ...props }: { label: string, [key: string]: any }) => (<label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}</span><input {...props} className="block w-full border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3" /></label>);
const SelectField = ({ label, options, ...props }: { label: string, options: string[], [key: string]: any }) => (<label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}</span><select {...props} className="block w-full border-gray-300 rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base py-2 px-3 appearance-none bg-white">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>);

const EditCarModelModal = ({ carModel, isOpen, onClose, onSave }: { carModel: CarModel | null; isOpen: boolean; onClose: () => void; onSave: (model: CarModel) => void; }) => {
    const [model, setModel] = React.useState<CarModel>({
        id: '', make: '', model: '', year: new Date().getFullYear(), category: CarCategory.ECONOMY, type: CarType.SEDAN, image: '', passengers: 4, bags: 2, doors: 4
    });

    React.useEffect(() => {
        if (carModel) {
            setModel(carModel);
        } else {
            setModel({ id: '', make: '', model: '', year: new Date().getFullYear(), category: CarCategory.ECONOMY, type: CarType.SEDAN, image: '', passengers: 4, bags: 2, doors: 4 });
        }
    }, [carModel, isOpen]);

    const handleChange = (field: keyof CarModel, value: any) => {
        setModel(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('image', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!model.make || !model.model || !model.image) {
            alert('Make, Model, and Image are required.');
            return;
        }
        onSave(model);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">{carModel ? 'Edit Car Model' : 'Add New Car Model'}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Make" value={model.make} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('make', e.target.value)} />
                        <InputField label="Model" value={model.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('model', e.target.value)} />
                        <InputField label="Year" type="number" value={model.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('year', parseInt(e.target.value))} />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Car Image</label>
                        <div className="mt-1 flex items-center gap-4">
                            {model.image ? (
                                <img src={model.image} alt="Preview" className="w-48 h-auto object-cover rounded border p-1" />
                            ) : (
                                <div className="w-48 h-24 bg-slate-100 rounded border flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                </div>
                            )}
                            <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <span>Upload file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         <SelectField label="Category" value={model.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('category', e.target.value)} options={Object.values(CarCategory)} />
                         <SelectField label="Type" value={model.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('type', e.target.value)} options={Object.values(CarType)} />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <InputField label="Passengers" type="number" value={model.passengers} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('passengers', parseInt(e.target.value))} />
                        <InputField label="Bags" type="number" value={model.bags} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('bags', parseInt(e.target.value))} />
                        <InputField label="Doors" type="number" value={model.doors} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('doors', parseInt(e.target.value))} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save Model
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }: { affiliate: Affiliate | null, isOpen: boolean, onClose: () => void, onSave: (id: string, rate: number) => void }) => {
    const [rate, setRate] = React.useState(0);

    React.useEffect(() => {
        if (affiliate) {
            setRate(affiliate.commissionRate);
        }
    }, [affiliate]);

    if (!isOpen || !affiliate) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800">Edit Commission</h3>
                    <p className="text-xs text-slate-500">{affiliate.name}</p>
                </div>
                <div className="p-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Commission Rate</label>
                    <div className="relative">
                        <input type="number" step="0.01" min="0" max="1" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} className="w-full border-gray-300 rounded-md border shadow-sm p-2 text-base" />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Enter as a decimal (e.g., 0.07 for 7%).</p>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                    <button onClick={() => onSave(affiliate.id, rate)} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold">Save</button>
                </div>
            </div>
        </div>
    );
}

const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: { car: Car; isOpen: boolean; onClose: () => void; onSave: (carId: string, newTier: RateTier) => void; onDeleteTier: (carId: string, tierId: string) => void; }) => {
    const [tierName, setTierName] = React.useState('');
    const [promotionLabel, setPromotionLabel] = React.useState('');
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [dailyRate, setDailyRate] = React.useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!tierName || !promotionLabel || !startDate || !endDate || !dailyRate) {
            alert("Please fill all fields for the new promotion.");
            return;
        }

        const newTier: RateTier = {
            id: `promo-${Date.now()}`,
            name: tierName,
            startDate,
            endDate,
            promotionLabel,
            rates: [{
                minDays: 1,
                maxDays: 99, // A wide range for simplicity
                dailyRate: parseFloat(dailyRate)
            }]
        };

        onSave(car.id, newTier);
        // Reset form
        setTierName('');
        setPromotionLabel('');
        setStartDate('');
        setEndDate('');
        setDailyRate('');
    };

    const promoTiers = car.rateTiers.filter(t => t.promotionLabel);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Tag className="w-5 h-5 text-purple-600"/> Manage Promotions for {car.make} {car.model}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Active Promotions</h4>
                        {promoTiers.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No promotions are currently active for this vehicle.</p>
                        ) : (
                            <div className="space-y-2">
                                {promoTiers.map(tier => (
                                    <div key={tier.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{tier.promotionLabel}</p>
                                            <p className="text-xs text-slate-500">{tier.name} ({tier.startDate} to {tier.endDate})</p>
                                            <p className="text-xs font-bold text-green-600 mt-1">Rate: ${tier.rates[0]?.dailyRate}/day</p>
                                        </div>
                                        <button onClick={() => onDeleteTier(car.id, tier.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-6 border-t">
                        <h4 className="text-sm font-bold text-slate-700 mb-4">Add New Promotion</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Promotion Name" placeholder="e.g. Summer Sale" value={tierName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTierName(e.target.value)} />
                            <InputField label="Promotion Label (Public)" placeholder="e.g. 20% Off!" value={promotionLabel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromotionLabel(e.target.value)} />
                            <InputField label="Start Date" type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} />
                            <InputField label="End Date" type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} />
                             <div className="md:col-span-2">
                                <InputField label="Promotional Daily Rate ($)" type="number" placeholder="e.g. 45.00" value={dailyRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyRate(e.target.value)} />
                             </div>
                        </div>
                         <button onClick={handleSave} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                            <PlusCircle className="w-4 h-4"/> Add Promotion
                        </button>
                    </div>
                </div>
                 <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState<'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 'carlibrary' | 'apipartners' | 'affiliates' | 'cms' | 'seo' | 'homepage' | 'sitesettings' | 'promotions'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  // Component State
  const [suppliers, setSuppliers] = React.useState(SUPPLIERS);
  const [supplierApps, setSupplierApps] = React.useState(MOCK_SUPPLIER_APPLICATIONS);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [approvingApplication, setApprovingApplication] = React.useState<SupplierApplication | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = React.useState(false);
  
  const [apiPartners, setApiPartners] = React.useState(MOCK_API_PARTNERS);
  const [isPageEditorOpen, setIsPageEditorOpen] = React.useState(false);
  const [editingPage, setEditingPage] = React.useState<PageContent | null>(null);

  const [isSeoEditorOpen, setIsSeoEditorOpen] = React.useState(false);
  const [editingSeoConfig, setEditingSeoConfig] = React.useState<SEOConfig | null>(null);

  const [carLibrary, setCarLibrary] = React.useState(MOCK_CAR_LIBRARY);
  const [isCarModelModalOpen, setIsCarModelModalOpen] = React.useState(false);
  const [editingCarModel, setEditingCarModel] = React.useState<CarModel | null>(null);

  const [affiliates, setAffiliates] = React.useState(MOCK_AFFILIATES);
  const [editingAffiliate, setEditingAffiliate] = React.useState<Affiliate | null>(null);

  const [isPromotionModalOpen, setIsPromotionModalOpen] = React.useState(false);
  const [managingPromosForCar, setManagingPromosForCar] = React.useState<Car | null>(null);

  React.useEffect(() => {
    // This is a mock for fetching data on mount
    setSuppliers(SUPPLIERS);
    setSupplierApps(MOCK_SUPPLIER_APPLICATIONS);
    setApiPartners(MOCK_API_PARTNERS);
    setCarLibrary(MOCK_CAR_LIBRARY);
    setAffiliates(MOCK_AFFILIATES);
  }, []);

  const handleSaveSupplier = async (updatedSupplier: Supplier) => {
    try {
        if (!updatedSupplier.id) {
            // Create new supplier
            const payload = {
                name: updatedSupplier.name,
                email: updatedSupplier.contactEmail,
                phone: updatedSupplier.phone || '',
                logoUrl: updatedSupplier.logo || '',
                active: true,
                location: updatedSupplier.location || '',
                locationCode: updatedSupplier.locationCode || '',
                bookingMode: updatedSupplier.bookingMode || 'FREE_SALE',
                commissionPercent: updatedSupplier.commissionValue || 0,
                password: updatedSupplier.password || 'defaultPassword123'
            };
            await adminApi.createSupplier(payload);
            alert("Supplier created successfully in backend.");
        } else {
            // Update existing supplier (mock for now)
            addMockSupplier(updatedSupplier);
        }
        
        setSuppliers([...SUPPLIERS]); // Re-fetch to update list
        setEditingSupplier(null);

        // If this save came from approving an application, remove the application
        if (approvingApplication) {
          removeSupplierApplication(approvingApplication.id);
          setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]);
          setApprovingApplication(null);
        }
    } catch (error: any) {
        console.error("Failed to save supplier:", error);
        alert(`Failed to save supplier: ${error.message || 'Unknown error'}`);
    }
  };

  const handleApproveSupplier = (id: string) => {
    const supplier = SUPPLIERS.find(s => s.id === id);
    if (supplier) {
        supplier.status = 'active';
        setSuppliers([...SUPPLIERS]);
    }
  };
  
  const handleSaveApiConnection = (updatedSupplier: Supplier) => {
    handleSaveSupplier(updatedSupplier);
    setIsApiModalOpen(false);
    setEditingSupplier(null);
  };

  const handleCreateApiPartner = (name: string) => {
      if (!name) return;
      addMockApiPartner(name);
      setApiPartners([...MOCK_API_PARTNERS]);
  };

  const handleToggleApiPartnerStatus = (id: string, status: 'active' | 'inactive') => {
      updateApiPartnerStatus(id, status);
      setApiPartners([...MOCK_API_PARTNERS]);
  };

  const handleSaveCarModel = (model: CarModel) => {
    saveCarModel(model);
    setCarLibrary([...MOCK_CAR_LIBRARY]);
    setIsCarModelModalOpen(false);
    setEditingCarModel(null);
  };

  const handleDeleteCarModel = (id: string) => {
      if (window.confirm("Are you sure you want to delete this car model from the library?")) {
          deleteCarModel(id);
          setCarLibrary([...MOCK_CAR_LIBRARY]);
      }
  };

  const handleUpdateAffiliateStatus = (id: string, status: Affiliate['status']) => {
      updateAffiliateStatus(id, status);
      setAffiliates([...MOCK_AFFILIATES]);
  };

  const handleSaveAffiliateCommission = (id: string, rate: number) => {
      updateAffiliateCommissionRate(id, rate);
      setAffiliates([...MOCK_AFFILIATES]);
      setEditingAffiliate(null);
  };
  
  const handleSavePromotion = (carId: string, newTier: RateTier) => {
      const carIndex = MOCK_CARS.findIndex(c => c.id === carId);
      if (carIndex > -1) {
          MOCK_CARS[carIndex].rateTiers.push(newTier);
      }
      setIsPromotionModalOpen(false);
      setManagingPromosForCar(null);
  };
  
  const handleDeleteTier = (carId: string, tierId: string) => {
      const carIndex = MOCK_CARS.findIndex(c => c.id === carId);
      if(carIndex > -1) {
          MOCK_CARS[carIndex].rateTiers = MOCK_CARS[carIndex].rateTiers.filter(t => t.id !== tierId);
          // Force re-render of modal content if it's open for the same car
          setManagingPromosForCar({...MOCK_CARS[carIndex]});
      }
  };

  const NavItem = ({ section, label, icon: Icon, count }: { section: typeof activeSection, label: string, icon: React.ElementType, count?: number }) => (
    <button onClick={() => { setActiveSection(section); setIsSidebarOpen(false); }} className={`flex items-center justify-between w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{count}</span>
      )}
    </button>
  );

  const SupplierRow: React.FC<SupplierRowProps> = ({ supplier, onEdit, onApprove, onManageApi }) => (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4 flex items-center gap-3">
          <img src={supplier.logo} alt={supplier.name} className="w-10 h-10 object-contain rounded-full bg-white border border-slate-200" />
          <div>
              <span className="block font-bold text-slate-900 text-sm">{supplier.name}</span>
              <span className="text-xs text-slate-500">{supplier.location}</span>
          </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm border ${supplier.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : supplier.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{supplier.status}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${supplier.connectionType === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {supplier.connectionType === 'api' ? <Rss className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
            {supplier.connectionType === 'api' ? 'API' : 'Manual'}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-slate-500">{MOCK_CARS.filter(c => c.supplier.id === supplier.id).length}</td>
      <td className="py-3 px-4 text-xs text-slate-500">{MOCK_BOOKINGS.filter(b => MOCK_CARS.some(c => c.id === b.carId && c.supplier.id === supplier.id)).length}</td>
      <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-2">
              {supplier.status === 'pending' && <button onClick={() => onApprove(supplier.id)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md" title="Approve"><Check className="w-4 h-4" /></button>}
              <button onClick={() => onManageApi(supplier)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-md" title="Manage API"><Rss className="w-4 h-4" /></button>
              <button onClick={() => onEdit(supplier)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-md" title="Edit"><Edit className="w-4 h-4" /></button>
          </div>
      </td>
    </tr>
  );

  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-slate-800 mt-1">$1.2M</p>
          <p className="text-xs text-green-500 flex items-center gap-1 mt-2"><TrendingUp className="w-4 h-4" /> +15% this month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500">Total Bookings</h3>
          <p className="text-3xl font-bold text-slate-800 mt-1">{MOCK_BOOKINGS.length}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">All-time</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500">Active Suppliers</h3>
          <p className="text-3xl font-bold text-slate-800 mt-1">{suppliers.filter(s => s.status === 'active').length} <span className="text-lg text-slate-400">/ {suppliers.length}</span></p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">Network partners</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500">Pending Actions</h3>
          <p className="text-3xl font-bold text-orange-500 mt-1">{suppliers.filter(s => s.status === 'pending').length}</p>
          <p className="text-xs text-orange-500 flex items-center gap-1 mt-2"><AlertCircle className="w-4 h-4" /> Approvals needed</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Monthly Revenue</h3>
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ADMIN_STATS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#1d4ed8" fill="#3b82f6" fillOpacity={0.1} />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const SuppliersContent = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Supplier Management</h2>
            <button onClick={() => setEditingSupplier({} as Supplier)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><Plus className="w-3.5 h-3.5"/> Add Supplier</button>
        </div>
        <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50"><tr className="text-xs font-semibold text-slate-500">
                    <th className="py-2 px-4 border-b border-slate-200">Supplier</th>
                    <th className="py-2 px-4 border-b border-slate-200">Status</th>
                    <th className="py-2 px-4 border-b border-slate-200">Connection</th>
                    <th className="py-2 px-4 border-b border-slate-200">Fleet Size</th>
                    <th className="py-2 px-4 border-b border-slate-200">Bookings</th>
                    <th className="py-2 px-4 border-b border-slate-200"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {suppliers.map(s => <SupplierRow key={s.id} supplier={s} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(supplier) => { setEditingSupplier(supplier); setIsApiModalOpen(true); }} />)}
                </tbody>
            </table>
        </div>
    </div>
  );

  const SupplierRequestsContent = () => {
    const handleApprove = (app: SupplierApplication) => {
      setApprovingApplication(app);
      const newSupplier: Partial<Supplier> = {
          name: app.companyName,
          contactEmail: app.email,
          location: app.primaryLocation,
          connectionType: app.integrationType === 'api' ? 'api' : 'manual',
          status: 'active',
          commissionType: CommissionType.PARTIAL_PREPAID,
          commissionValue: 0.15,
          bookingMode: BookingMode.FREE_SALE,
          username: app.companyName.toLowerCase().replace(/\s/g, ''),
          password: Math.random().toString(36).slice(-8), // Generate random password
      };
      setEditingSupplier(newSupplier as Supplier);
    };

    const handleReject = (id: string) => {
        if (window.confirm("Are you sure you want to reject this application?")) {
            removeSupplierApplication(id);
            setSupplierApps([...MOCK_SUPPLIER_APPLICATIONS]);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Supplier Requests</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-50/50">
                        <tr className="text-xs font-semibold text-slate-500">
                            <th className="p-3 border-b">Company</th>
                            <th className="p-3 border-b">Contact</th>
                            <th className="p-3 border-b">Fleet Size</th>
                            <th className="p-3 border-b">Integration</th>
                            <th className="p-3 border-b">Date</th>
                            <th className="p-3 border-b"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {supplierApps.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50 text-sm">
                                <td className="p-3 border-b"><span className="font-bold text-slate-800">{app.companyName}</span><br/><span className="text-xs text-slate-500">{app.primaryLocation}</span></td>
                                <td className="p-3 border-b">{app.contactName}<br/><span className="text-xs text-slate-500">{app.email}</span></td>
                                <td className="p-3 border-b text-xs">{app.fleetSize}</td>
                                <td className="p-3 border-b text-xs uppercase font-medium">{app.integrationType}</td>
                                <td className="p-3 border-b text-xs">{app.submissionDate}</td>
                                <td className="p-3 border-b text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleApprove(app)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md" title="Approve"><CheckSquare className="w-4 h-4" /></button>
                                        <button onClick={() => handleReject(app.id)} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-md" title="Reject"><XSquare className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {supplierApps.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm italic">No pending supplier requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const BookingsContent = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">All Bookings</h2>
        <p className="text-sm text-slate-500">View-only. Actions must be taken from the supplier's portal.</p>
    </div>
  );
  
  const FleetContent = () => {
    // New state for filters
    const [filterSupplier, setFilterSupplier] = React.useState('');
    const [filterLocation, setFilterLocation] = React.useState('');

    // Derived data for dropdowns
    const uniqueSuppliers = SUPPLIERS;
    const locationsForSupplier = React.useMemo(() => {
        if (!filterSupplier) {
            // If no supplier is selected, show all unique locations
            return Array.from(new Set(MOCK_CARS.map(c => c.location))).sort();
        }
        const supplierCars = MOCK_CARS.filter(c => c.supplier.id === filterSupplier);
        return Array.from(new Set(supplierCars.map(c => c.location))).sort();
    }, [filterSupplier]);

    // Filtered fleet for rendering
    const filteredFleet = React.useMemo(() => {
        return MOCK_CARS.filter(car => {
            const matchesSupplier = !filterSupplier || car.supplier.id === filterSupplier;
            const matchesLocation = !filterLocation || car.location === filterLocation;
            return matchesSupplier && matchesLocation;
        });
    }, [filterSupplier, filterLocation]);

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterSupplier(e.target.value);
        setFilterLocation(''); // Reset location when supplier changes
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Global Fleet Management</h2>
            
            {/* Filter Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Filter by Supplier</label>
                    <select onChange={handleSupplierChange} value={filterSupplier} className="w-full text-base border border-slate-300 rounded-md py-2 px-2 bg-white focus:ring-2 focus:ring-blue-500">
                        <option value="">All Suppliers</option>
                        {uniqueSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Filter by Location</label>
                    <select onChange={e => setFilterLocation(e.target.value)} value={filterLocation} className="w-full text-base border border-slate-300 rounded-md py-2 px-2 bg-white focus:ring-2 focus:ring-blue-500">
                        <option value="">All Locations</option>
                        {locationsForSupplier.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
                <button onClick={() => { setFilterSupplier(''); setFilterLocation(''); }} className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-md font-medium text-xs shadow-sm">
                    Reset Filters
                </button>
            </div>
            
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50/50">
                        <tr className="text-xs font-semibold text-slate-500">
                            <th className="py-2 px-4 border-b border-slate-200">Vehicle</th>
                            <th className="py-2 px-4 border-b border-slate-200">Supplier</th>
                            <th className="py-2 px-4 border-b border-slate-200">Base Rate</th>
                            <th className="py-2 px-4 border-b border-slate-200">Promotions</th>
                            <th className="py-2 px-4 border-b border-slate-200 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFleet.map(car => {
                            const basePrice = calculatePrice(car, 1, new Date().toISOString().split('T')[0]).dailyRate;
                            const promoTiers = car.rateTiers.filter(t => t.promotionLabel).length;
                            return (
                                <tr key={car.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 flex items-center gap-3">
                                        <img src={car.image} alt="" className="w-16 h-10 object-cover rounded bg-slate-100 border border-slate-200" />
                                        <div>
                                            <span className="block font-bold text-slate-800 text-sm">{car.make} {car.model}</span>
                                            <span className="text-xs text-slate-500">{car.category}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{car.supplier.name}</td>
                                    <td className="py-3 px-4 text-sm text-slate-600">${basePrice.toFixed(2)}/day</td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{promoTiers > 0 ? `${promoTiers} active` : 'None'}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => { setManagingPromosForCar(car); setIsPromotionModalOpen(true); }} className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5">
                                            <Tag className="w-3 h-3"/> Manage Promotions
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                         {filteredFleet.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm italic">No vehicles match the current filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const CarLibraryContent = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Car Model Library</h2>
                <button 
                    onClick={() => { setEditingCarModel(null); setIsCarModelModalOpen(true); }} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5"/> Add Model
                </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">This library provides base images and specifications for car models. When suppliers add vehicles, they will be matched against this library.</p>
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50/50">
                        <tr className="text-xs font-semibold text-slate-500">
                            <th className="py-2 px-4 border-b border-slate-200">Image</th>
                            <th className="py-2 px-4 border-b border-slate-200">Make & Model</th>
                            <th className="py-2 px-4 border-b border-slate-200">Year</th>
                            <th className="py-2 px-4 border-b border-slate-200">Category</th>
                            <th className="py-2 px-4 border-b border-slate-200">Type</th>
                            <th className="py-2 px-4 border-b border-slate-200"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {carLibrary.map(model => (
                            <tr key={model.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-4">
                                    <img src={model.image} alt={`${model.make} ${model.model}`} className="w-16 h-10 object-cover rounded bg-slate-100 border border-slate-200" />
                                </td>
                                <td className="py-3 px-4">
                                    <span className="block font-bold text-slate-800 text-sm">{model.make} {model.model}</span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">{model.year}</td>
                                <td className="py-3 px-4 text-xs text-slate-500">{model.category}</td>
                                <td className="py-3 px-4 text-xs text-slate-500">{model.type}</td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => { setEditingCarModel(model); setIsCarModelModalOpen(true); }} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-md" title="Edit Model"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteCarModel(model.id)} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-md" title="Delete Model"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const ApiPartnersContent = () => {
    const [newName, setNewName] = React.useState('');
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">API Partner Management</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-4 items-end mb-6">
                <div className="flex-grow">
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Partner Name</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Skyscanner" className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3"/>
                </div>
                <button onClick={() => { handleCreateApiPartner(newName); setNewName(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">Create</button>
            </div>
            <div className="space-y-3">
                {apiPartners.map(p => (
                    <div key={p.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Key className="w-3.5 h-3.5 text-slate-400"/>
                                <span className="text-xs font-mono text-slate-500">{p.apiKey}</span>
                                <button onClick={() => navigator.clipboard.writeText(p.apiKey)} className="text-slate-400 hover:text-blue-600"><Copy className="w-3.5 h-3.5"/></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-400">Created: {p.createdAt}</span>
                            <button onClick={() => handleToggleApiPartnerStatus(p.id, p.status === 'active' ? 'inactive' : 'active')} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                <Power className="w-3 h-3" /> {p.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const AffiliatesContent = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <EditAffiliateModal affiliate={editingAffiliate} isOpen={!!editingAffiliate} onClose={() => setEditingAffiliate(null)} onSave={handleSaveAffiliateCommission} />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Affiliate Management</h2>
            </div>
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-slate-50/50">
                        <tr className="text-xs font-semibold text-slate-500">
                            <th className="py-2 px-4 border-b border-slate-200">Affiliate</th>
                            <th className="py-2 px-4 border-b border-slate-200">Status</th>
                            <th className="py-2 px-4 border-b border-slate-200">Comm. Rate</th>
                            <th className="py-2 px-4 border-b border-slate-200">Clicks</th>
                            <th className="py-2 px-4 border-b border-slate-200">Conversions</th>
                            <th className="py-2 px-4 border-b border-slate-200">Earnings</th>
                            <th className="py-2 px-4 border-b border-slate-200 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {affiliates.map(affiliate => (
                            <tr key={affiliate.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-4">
                                    <span className="block font-bold text-slate-800 text-sm">{affiliate.name}</span>
                                    <span className="text-xs text-slate-500">{affiliate.email}</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm border ${affiliate.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : affiliate.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{affiliate.status}</span>
                                </td>
                                <td className="py-3 px-4 text-sm font-medium text-slate-700">{(affiliate.commissionRate * 100).toFixed(2)}%</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{affiliate.clicks}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{affiliate.conversions}</td>
                                <td className="py-3 px-4 text-sm font-bold text-slate-800">${affiliate.totalEarnings.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {affiliate.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateAffiliateStatus(affiliate.id, 'active')} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md" title="Approve"><Check className="w-4 h-4"/></button>
                                                <button onClick={() => handleUpdateAffiliateStatus(affiliate.id, 'rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-md" title="Reject"><X className="w-4 h-4"/></button>
                                            </>
                                        )}
                                        {affiliate.status === 'active' && <button onClick={() => handleUpdateAffiliateStatus(affiliate.id, 'rejected')} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-md" title="Deactivate"><PowerOff className="w-4 h-4"/></button>}
                                        {affiliate.status === 'rejected' && <button onClick={() => handleUpdateAffiliateStatus(affiliate.id, 'active')} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-md" title="Activate"><Power className="w-4 h-4"/></button>}
                                        <button onClick={() => setEditingAffiliate(affiliate)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-md" title="Edit Commission"><Edit className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  }

  const CmsContent = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Content Management System (CMS)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PAGES.map(page => (
                <div key={page.slug} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-800">{page.title}</h3>
                            <p className="text-xs font-mono text-slate-500 bg-slate-50 px-1 rounded inline-block mt-1">/{page.slug}</p>
                        </div>
                        <button onClick={() => { setEditingPage(page); setIsPageEditorOpen(true); }} className="text-slate-500 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Last updated: {page.lastUpdated}</p>
                </div>
            ))}
        </div>
    </div>
  );

  const SeoContent = () => (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">SEO Configurations</h2>
              <button onClick={() => { setEditingSeoConfig({} as SEOConfig); setIsSeoEditorOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><Plus className="w-3.5 h-3.5"/> New Route</button>
          </div>
          <div className="space-y-2">
              {MOCK_SEO_CONFIGS.map(config => (
                  <div key={config.route} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
                      <div>
                          <p className="font-mono text-sm text-blue-600 font-semibold">{config.route}</p>
                          <p className="text-xs text-slate-700 mt-1">{config.title}</p>
                          <p className="text-xs text-slate-500 truncate max-w-md">{config.description}</p>
                      </div>
                      <button onClick={() => { setEditingSeoConfig(config); setIsSeoEditorOpen(true); }} className="text-slate-500 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                  </div>
              ))}
          </div>
      </div>
  );

  const HomepageContent = () => {
    const [content, setContent] = React.useState<HomepageContent>(MOCK_HOMEPAGE_CONTENT);
    const [categoryImages, setCategoryImages] = React.useState(MOCK_CATEGORY_IMAGES);
    const [saved, setSaved] = React.useState(false);
    const [activeAccordion, setActiveAccordion] = React.useState<string | null>('hero');
    const [previewMode, setPreviewMode] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isPreviewFullScreen, setIsPreviewFullScreen] = React.useState(false);

    const handleSave = () => {
        updateHomepageContent(content);
        updateCategoryImages(categoryImages);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleTextChange = (path: string, value: string) => {
        const keys = path.split('.');
        setContent(prev => {
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const handleNestedItemChange = (section: keyof HomepageContent, nestedKey: string | null, index: number, field: string, value: any) => {
        setContent(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            const arrayParent = newState[section] as any;
            const arrayToUpdate = nestedKey ? arrayParent[nestedKey] : arrayParent;
            if (Array.isArray(arrayToUpdate)) {
                arrayToUpdate[index][field] = value;
            }
            return newState;
        });
    };

    const handleAddItem = (section: keyof HomepageContent, nestedKey: string | null = null, template: object) => {
         setContent(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if(nestedKey) {
                (newState[section] as any)[nestedKey].push(template);
            } else {
                (newState[section] as any).push(template);
            }
            return newState;
        });
    };

    const handleDeleteItem = (section: keyof HomepageContent, nestedKey: string | null = null, index: number) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        setContent(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if(nestedKey) {
                (newState[section] as any)[nestedKey].splice(index, 1);
            } else {
                (newState[section] as any).splice(index, 1);
            }
            return newState;
        });
    };
    
    const handleCategoryImageChange = (category: CarCategory, file: File) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCategoryImages(prev => ({
                    ...prev,
                    [category]: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const InputField = ({ label, value, onChange }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <div className="mb-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
            <input type="text" value={value} onChange={onChange} className="w-full p-2 border border-slate-300 rounded text-base"/>
        </div>
    );

    const AccordionSection = ({ title, id, children }: { title: string, id: string, children?: React.ReactNode }) => (
        <div className="border border-slate-200 rounded-lg mb-2">
            <button onClick={() => setActiveAccordion(activeAccordion === id ? null : id)} className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100">
                <span className="font-bold text-sm text-slate-700">{title}</span>
                {activeAccordion === id ? <ChevronUp className="w-5 h-5 text-slate-500"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
            </button>
            {activeAccordion === id && <div className="p-4 border-t border-slate-200">{children}</div>}
        </div>
    );
    
    const previewClasses = {
        desktop: 'w-full h-[600px] border-4 border-slate-800 rounded-lg shadow-2xl',
        tablet: 'w-[768px] h-[1024px] border-8 border-slate-800 rounded-2xl shadow-2xl scale-[.6] origin-top',
        mobile: 'w-[375px] h-[667px] border-8 border-slate-800 rounded-2xl shadow-2xl scale-[.9] origin-top',
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isPreviewFullScreen && (
                <div className="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center animate-fadeIn">
                    <div className="relative w-full h-full">
                        <iframe src="/#/" title="Live Preview" className="w-full h-full bg-white rounded-lg" />
                        <button onClick={() => setIsPreviewFullScreen(false)} className="absolute -top-2 -right-2 bg-white text-slate-800 rounded-full p-1 shadow-lg hover:bg-red-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            {/* Left Column: Editor */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                <div className="sticky top-[70px] z-10 bg-white/80 backdrop-blur-sm py-3 mb-6 flex justify-between items-center border-b border-slate-200 -mx-6 px-6">
                    <h2 className="text-lg font-bold text-slate-800">Homepage Content Editor</h2>
                    <div className="flex items-center gap-3">
                        {saved && <span className="text-green-600 text-xs font-bold flex items-center gap-1 animate-fadeIn"><CheckCircle className="w-4 h-4"/> Saved!</span>}
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm">
                            <Save className="w-3.5 h-3.5"/> Save All Changes
                        </button>
                    </div>
                </div>

                <AccordionSection title="Hero Section" id="hero">
                    <InputField label="Title" value={content.hero.title} onChange={e => handleTextChange('hero.title', e.target.value)} />
                    <InputField label="Subtitle" value={content.hero.subtitle} onChange={e => handleTextChange('hero.subtitle', e.target.value)} />
                    <InputField label="Background Image URL" value={content.hero.backgroundImage} onChange={e => handleTextChange('hero.backgroundImage', e.target.value)} />
                </AccordionSection>

                <AccordionSection title="Car Category Images" id="categoryimages">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.keys(categoryImages).map(cat => {
                            const category = cat as CarCategory;
                            return (
                                <div key={category} className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">{category}</label>
                                    <img src={categoryImages[category]} alt={category} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                                    <label htmlFor={`img-upload-${category}`} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                                        Change Image
                                        <input 
                                            id={`img-upload-${category}`}
                                            type="file" 
                                            className="sr-only" 
                                            accept="image/*" 
                                            onChange={(e) => {
                                                if(e.target.files?.[0]) {
                                                    handleCategoryImageChange(category, e.target.files[0])
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                </AccordionSection>
                
                <AccordionSection title="Features Section" id="features">
                    {(content.features || []).map((item, index) => (
                        <div key={item.id} className="p-3 border rounded mb-2 bg-slate-50 relative">
                            <button onClick={() => handleDeleteItem('features', null, index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputField label="Icon" value={item.icon} onChange={e => handleNestedItemChange('features', null, index, 'icon', e.target.value)} />
                            <InputField label="Title" value={item.title} onChange={e => handleNestedItemChange('features', null, index, 'title', e.target.value)} />
                            <InputField label="Description" value={item.description} onChange={e => handleNestedItemChange('features', null, index, 'description', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('features', null, {id: `f${Date.now()}`, icon: 'Globe', title: '', description: ''})} className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Feature</button>
                </AccordionSection>

                <AccordionSection title="How It Works" id="howitworks">
                    <InputField label="Section Title" value={content.howItWorks.title} onChange={e => handleTextChange('howItWorks.title', e.target.value)} />
                    <InputField label="Section Subtitle" value={content.howItWorks.subtitle} onChange={e => handleTextChange('howItWorks.subtitle', e.target.value)} />
                     {(content.howItWorks.steps || []).map((item, index) => (
                        <div key={item.id} className="p-3 border rounded mt-3 mb-2 bg-slate-50 relative">
                            <h4 className="text-xs font-bold mb-2">Step {index + 1}</h4>
                            <button onClick={() => handleDeleteItem('howItWorks', 'steps', index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputField label="Icon" value={item.icon} onChange={e => handleNestedItemChange('howItWorks', 'steps', index, 'icon', e.target.value)} />
                            <InputField label="Title" value={item.title} onChange={e => handleNestedItemChange('howItWorks', 'steps', index, 'title', e.target.value)} />
                            <InputField label="Description" value={item.description} onChange={e => handleNestedItemChange('howItWorks', 'steps', index, 'description', e.target.value)} />
                        </div>
                    ))}
                     <button onClick={() => handleAddItem('howItWorks', 'steps', {id: `s${Date.now()}`, icon: 'Search', title: '', description: ''})} className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Step</button>
                </AccordionSection>
                <AccordionSection title="Value Propositions" id="valuepropositions">
                    {(content.valuePropositions || []).map((item, index) => (
                        <div key={item.id} className="p-3 border rounded mb-2 bg-slate-50 relative">
                            <button onClick={() => handleDeleteItem('valuePropositions', null, index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputField label="Icon" value={item.icon} onChange={e => handleNestedItemChange('valuePropositions', null, index, 'icon', e.target.value)} />
                            <InputField label="Title" value={item.title} onChange={e => handleNestedItemChange('valuePropositions', null, index, 'title', e.target.value)} />
                            <InputField label="Description" value={item.description} onChange={e => handleNestedItemChange('valuePropositions', null, index, 'description', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('valuePropositions', null, {id: `vp${Date.now()}`, icon: 'CheckCircle', title: '', description: ''})} className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Proposition</button>
                </AccordionSection>

                <AccordionSection title="Popular Destinations" id="destinations">
                     <InputField label="Section Title" value={content.popularDestinations.title} onChange={e => handleTextChange('popularDestinations.title', e.target.value)} />
                    <InputField label="Section Subtitle" value={content.popularDestinations.subtitle} onChange={e => handleTextChange('popularDestinations.subtitle', e.target.value)} />
                     {(content.popularDestinations.destinations || []).map((item, index) => (
                        <div key={item.id} className="p-3 border rounded mt-3 mb-2 bg-slate-50 relative">
                            <h4 className="text-xs font-bold mb-2">Destination {index + 1}</h4>
                            <button onClick={() => handleDeleteItem('popularDestinations', 'destinations', index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputField label="Name" value={item.name} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'name', e.target.value)} />
                            <InputField label="Country" value={item.country} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'country', e.target.value)} />
    <InputField label="Price (number)" value={item.price.toString()} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'price', Number(e.target.value))} />
                            <InputField label="Image URL" value={item.image} onChange={e => handleNestedItemChange('popularDestinations', 'destinations', index, 'image', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('popularDestinations', 'destinations', {id: `d${Date.now()}`, name: '', country: '', price: 0, image: ''})} className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add Destination</button>
                </AccordionSection>

                 <AccordionSection title="Partners & CTA Sections" id="misc">
                    <InputField label="Partners Section Title" value={content.partners.title} onChange={e => handleTextChange('partners.title', e.target.value)} />
                    <InputField label="CTA Title" value={content.cta.title} onChange={e => handleTextChange('cta.title', e.target.value)} />
                    <InputField label="CTA Subtitle" value={content.cta.subtitle} onChange={e => handleTextChange('cta.subtitle', e.target.value)} />
                </AccordionSection>

                <AccordionSection title="FAQs" id="faqs">
                     <InputField label="Section Title" value={content.faqs.title} onChange={e => handleTextChange('faqs.title', e.target.value)} />
                     {(content.faqs.items || []).map((item, index) => (
                        <div key={item.id} className="p-3 border rounded mt-3 mb-2 bg-slate-50 relative">
                            <h4 className="text-xs font-bold mb-2">FAQ {index + 1}</h4>
                            <button onClick={() => handleDeleteItem('faqs', 'items', index)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            <InputField label="Question" value={item.question} onChange={e => handleNestedItemChange('faqs', 'items', index, 'question', e.target.value)} />
                            <InputField label="Answer" value={item.answer} onChange={e => handleNestedItemChange('faqs', 'items', index, 'answer', e.target.value)} />
                        </div>
                    ))}
                     <button onClick={() => handleAddItem('faqs', 'items', {id: `faq${Date.now()}`, question: '', answer: ''})} className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1"><PlusCircle className="w-4 h-4"/> Add FAQ</button>
                </AccordionSection>
            </div>
            {/* Right Column: Preview */}
            <div className="bg-slate-200 p-4 rounded-lg shadow-inner sticky top-20 h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700">Live Preview</h3>
                    <div className="flex items-center gap-1 bg-slate-300 p-1 rounded-lg">
                        <button onClick={() => setPreviewMode('desktop')} className={`p-1 rounded-md ${previewMode === 'desktop' ? 'bg-white shadow' : 'text-slate-500 hover:bg-white/50'}`}><Monitor className="w-4 h-4"/></button>
                        <button onClick={() => setPreviewMode('tablet')} className={`p-1 rounded-md ${previewMode === 'tablet' ? 'bg-white shadow' : 'text-slate-500 hover:bg-white/50'}`}><Tablet className="w-4 h-4"/></button>
                        <button onClick={() => setPreviewMode('mobile')} className={`p-1 rounded-md ${previewMode === 'mobile' ? 'bg-white shadow' : 'text-slate-500 hover:bg-white/50'}`}><Smartphone className="w-4 h-4"/></button>
                        <div className="w-px h-4 bg-slate-400 mx-1"></div>
                        <button onClick={() => setIsPreviewFullScreen(true)} className="p-1 rounded-md text-slate-500 hover:bg-white/50"><Expand className="w-4 h-4"/></button>
                    </div>
                </div>
                <div className="w-full h-[calc(100%-2.5rem)] bg-slate-300 rounded-md flex items-center justify-center overflow-auto">
                    <iframe 
                        key={`${previewMode}-${JSON.stringify(content)}`} 
                        src="/#/" 
                        title="Live Preview" 
                        className={`bg-white transition-all duration-300 ease-in-out ${previewClasses[previewMode]}`}
                    />
                </div>
            </div>
        </div>
    );
};
  
  const SiteSettingsContent = () => {
    const [duration, setDuration] = React.useState(MOCK_APP_CONFIG.searchingScreenDuration / 1000);
    const [saved, setSaved] = React.useState(false);

    const handleSave = () => {
      updateAppConfig({ searchingScreenDuration: duration * 1000 });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6">General Site Settings</h2>
        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Searching Screen Duration</label>
            <div className="relative">
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md border shadow-sm p-3 text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">seconds</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Controls how long the loading screen is shown while "searching" for cars.</p>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md">Save Settings</button>
            {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-2 animate-fadeIn"><CheckCircle className="w-5 h-5"/> Saved!</span>}
          </div>
        </div>
      </div>
    );
  };

  const PromotionsContent = () => {
    const [promos, setPromos] = React.useState(MOCK_PROMO_CODES);
    const [newCode, setNewCode] = React.useState('');
    const [newDiscount, setNewDiscount] = React.useState(10);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || newDiscount <= 0) return;
        addPromoCode(newCode, newDiscount);
        setPromos([...MOCK_PROMO_CODES]);
        setNewCode('');
        setNewDiscount(10);
    };

    const handleToggle = (id: string, status: 'active' | 'inactive') => {
        updatePromoCodeStatus(id, status);
        setPromos([...MOCK_PROMO_CODES]);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this promo code?')) {
            deletePromoCode(id);
            setPromos([...MOCK_PROMO_CODES]);
        }
    };
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Manage Promo Codes</h2>
        {/* Form to add */}
        <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Promo Code</label>
            <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="e.g., SUMMER20" className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Discount (%)</label>
            <input type="number" value={newDiscount} onChange={e => setNewDiscount(parseInt(e.target.value))} className="w-full border-gray-300 rounded-md border shadow-sm text-base py-2 px-3"/>
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md shadow-sm text-sm">Add Code</button>
        </form>

        {/* Table of codes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs font-semibold text-slate-500 bg-slate-50/50">
              <tr>
                <th className="p-3 border-b border-slate-200">Code</th>
                <th className="p-3 border-b border-slate-200">Discount</th>
                <th className="p-3 border-b border-slate-200">Status</th>
                <th className="p-3 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promos.map(p => (
                <tr key={p.id}>
                  <td className="p-3 font-mono font-bold text-slate-700">{p.code}</td>
                  <td className="p-3 text-sm text-slate-600">{(p.discount * 100).toFixed(0)}%</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggle(p.id, p.status === 'active' ? 'inactive' : 'active')} className="p-2 hover:bg-slate-100 rounded-md text-slate-500" title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {p.status === 'active' ? <PowerOff className="w-4 h-4"/> : <Power className="w-4 h-4"/>}
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-md text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent />;
      case 'suppliers': return <SuppliersContent />;
      case 'supplierrequests': return <SupplierRequestsContent />;
      case 'bookings': return <BookingsContent />;
      case 'fleet': return <FleetContent />;
      case 'carlibrary': return <CarLibraryContent />;
      case 'apipartners': return <ApiPartnersContent />;
      case 'affiliates': return <AffiliatesContent />;
      case 'cms': return <CmsContent />;
      case 'seo': return <SeoContent />;
      case 'homepage': return <HomepageContent />;
      case 'sitesettings': return <SiteSettingsContent />;
      case 'promotions': return <PromotionsContent />;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <EditSupplierModal isOpen={!!editingSupplier} onClose={() => { setEditingSupplier(null); setApprovingApplication(null); }} onSave={handleSaveSupplier} supplier={editingSupplier} />
      {editingSupplier && isApiModalOpen && <ApiConnectionModal supplier={editingSupplier} isOpen={isApiModalOpen} onClose={() => { setIsApiModalOpen(false); setEditingSupplier(null); }} onSave={handleSaveApiConnection} />}
      {isPageEditorOpen && <PageEditorModal page={editingPage} isOpen={isPageEditorOpen} onClose={() => setIsPageEditorOpen(false)} />}
      {isSeoEditorOpen && <SEOEditorModal config={editingSeoConfig} isOpen={isSeoEditorOpen} onClose={() => setIsSeoEditorOpen(false)} />}
      {isCarModelModalOpen && <EditCarModelModal carModel={editingCarModel} isOpen={isCarModelModalOpen} onClose={() => { setIsCarModelModalOpen(false); setEditingCarModel(null); }} onSave={handleSaveCarModel} />}
      {managingPromosForCar && <AdminPromotionModal car={managingPromosForCar} isOpen={isPromotionModalOpen} onClose={() => { setIsPromotionModalOpen(false); setManagingPromosForCar(null); }} onSave={handleSavePromotion} onDeleteTier={handleDeleteTier} />}
      
      {/* Mobile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20"
      >
          <div className="flex items-center gap-2">
             <Shield className="w-6 h-6 text-blue-600" />
             <span className="font-bold text-slate-800">Admin Panel</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
             {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
          </button>
       </motion.div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
        
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none md:bg-transparent md:w-60 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-4 h-full flex flex-col"
          >
            <div className="hidden md:flex items-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-slate-800">Admin Panel</h1>
                <p className="text-xs text-slate-500">Hogicar Inc.</p>
              </div>
            </div>
            <nav className="space-y-1.5 flex-grow">
              <NavItem section="dashboard" label="Dashboard" icon={LayoutDashboard} />
              <NavItem section="suppliers" label="Suppliers" icon={Building} />
              <NavItem section="supplierrequests" label="Supplier Requests" icon={MailQuestion} count={supplierApps.length} />
              <NavItem section="bookings" label="Bookings" icon={CarIcon} />
              <NavItem section="fleet" label="Fleet" icon={CarIcon} />
              <NavItem section="promotions" label="Promotions" icon={Tag} />
              <NavItem section="carlibrary" label="Car Library" icon={CarIcon} />
              <NavItem section="apipartners" label="API Partners" icon={Share2} />
              <NavItem section="affiliates" label="Affiliates" icon={DollarSignIcon} />
              <NavItem section="cms" label="CMS" icon={FileText} />
              <NavItem section="seo" label="SEO" icon={Globe} />
              <NavItem section="homepage" label="Homepage" icon={ImageIcon} />
              <NavItem section="sitesettings" label="Site Settings" icon={SlidersHorizontal} />
            </nav>
            <button onClick={() => navigate('/admin-login')} className="flex items-center w-full px-4 py-2 mt-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </motion.div>
        </aside>

        <main className="flex-grow w-full md:pl-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
