// Admin dashboard: EditSupplierModal (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Building from 'lucide-react/dist/esm/icons/building';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Copy from 'lucide-react/dist/esm/icons/copy';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Search from 'lucide-react/dist/esm/icons/search';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Award from 'lucide-react/dist/esm/icons/award';
import Star from 'lucide-react/dist/esm/icons/star';
import { fetchLocations, LocationSuggestion } from '../../../api';
import { 
    adminFetch 
} from '../../../lib/adminApi';
import { 
  Supplier
} from '../../../types';
import { getImageUrl, resizeImage } from './images';
import { InputField, Modal, SelectField } from './ui';

// ==================== Location Picker (working, searchable) ====================
export const LocationPicker = ({ onSelect, placeholder = "Search location..." }: any) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timer = useRef<any>();

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetchLocations(query);
        setSuggestions(res);
        setIsOpen(res.length > 0);
      } catch(e) { console.error(e); } finally { setLoading(false); }
    }, 300);
  }, [query]);

  const handleSelect = (loc: LocationSuggestion) => {
    setQuery('');
    setIsOpen(false);
    if (onSelect) onSelect(loc);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-card focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-card shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center"><RefreshCw className="w-4 h-4 animate-spin inline" /> Loading...</div>
          ) : (
            suggestions.map(loc => (
              <button
                key={loc.value}
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 transition-colors flex items-center gap-3"
              >
                <div className={`p-1.5 rounded-card ${loc.type === 'airport' ? 'bg-blue-50 text-[#007ac2]' : 'bg-slate-50 text-slate-600'}`}>
                  {loc.type === 'airport' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">{loc.label}</span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{loc.iataCode || 'CITY'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Edit Supplier Modal (with location picker) ====================
export const supplierRatingMetrics = [
  { field: 'ratingStaffService', label: 'Staff helpfulness' },
  { field: 'ratingCondition', label: 'Car condition' },
  { field: 'ratingEaseOfLocating', label: 'Ease of locating' },
  { field: 'ratingValueForMoney', label: 'Value for money' },
  { field: 'ratingDropoffSpeed', label: 'Drop-off speed' },
  { field: 'ratingPickupSpeed', label: 'Pick-up speed' },
  { field: 'ratingCleanliness', label: 'Car cleanliness' }
] as const;

export const ratingToDefaultPercent = (rating: number | undefined) => {
  const score = Number(rating || 4.5);
  return Math.round(Math.max(0, Math.min(100, score > 5 ? score * 10 : score * 20)));
};

export const EditSupplierModal = ({ supplier, isOpen, onClose, onSave, onCopy }: any) => {
  const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
  const [selectedLocations, setSelectedLocations] = useState<any[]>([]);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [customLocs, setCustomLocs] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCredentials = async () => {
    if (!editedSupplier.name) return alert("Please enter company name first");
    if (editedSupplier.id && !window.confirm("This will overwrite credentials. Continue?")) return;
    setIsGenerating(true);
    try {
      const resp = await adminFetch("/api/admin/suppliers/generate-credentials", {
        method: "POST",
        body: JSON.stringify({ name: editedSupplier.name, email: editedSupplier.contactEmail })
      });
      setEditedSupplier(prev => ({ ...prev, email: resp.username, password: resp.password }));
      setShowPassword(true);
    } catch (e: any) { alert("Failed to generate: " + e.message); }
    finally { setIsGenerating(false); }
  };

  useEffect(() => {
    const stored = localStorage.getItem("hogicar_custom_locations");
    if (stored) setCustomLocs(JSON.parse(stored));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setEditedSupplier(supplier || {});
      if (supplier?.locations && supplier.locations.length > 0)
        setSelectedLocations(Array.isArray(supplier.locations) ? supplier.locations.map((l: any) => ({ label: l.displayName || l.location, value: l.locationCode })) : []);
      else if (supplier?.location && supplier?.locationCode)
        setSelectedLocations([{ label: supplier.location, value: supplier.locationCode }]);
      else setSelectedLocations([]);
    }
  }, [supplier, isOpen]);

  const handleChange = (field: any, val: any) => setEditedSupplier(prev => ({ ...prev, [field]: val }));
  const handleLogo = async (e: any) => {
    if (e.target.files?.[0]) {
      try {
        const resized = await resizeImage(e.target.files[0], 800, 400);
        setEditedSupplier(prev => ({ ...prev, logoUrl: resized, logo: "" }));
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => setEditedSupplier(prev => ({ ...prev, logoUrl: reader.result as string, logo: "" }));
        reader.readAsDataURL(e.target.files[0]);
      }
    }
  };

  const handleLocSelect = (loc: any) => {
    if (loc && !selectedLocations.find(l => l.value === loc.value)) {
      setSelectedLocations(prev => [...prev, loc]);
    }
  };

  const removeLocation = (code: string) => {
    setSelectedLocations(prev => prev.filter(l => l.value !== code));
  };

  const handleCreateCustom = () => {
    if (!newLocName) return alert("Enter location name");
    let code = newLocCode.trim().toUpperCase() || newLocName.replace(/[^a-zA-Z0-9]/g, "").substring(0,6).toUpperCase();
    const newLoc = { label: newLocName, value: code };
    const updated = [...customLocs, newLoc];
    setCustomLocs(updated);
    localStorage.setItem("hogicar_custom_locations", JSON.stringify(updated));
    handleLocSelect(newLoc);
    setNewLocName("");
    setNewLocCode("");
  };

  const handleSave = () => {
    if (!editedSupplier.name || !editedSupplier.contactEmail) return alert("Name and contact email required");
    if (selectedLocations.length === 0) return alert("Select at least one location");
    const finalSupplier = {
      ...editedSupplier,
      email: editedSupplier.email || editedSupplier.contactEmail,
      locations: selectedLocations.map(l => ({ displayName: l.label, locationCode: l.value })),
      bookingMode: editedSupplier.bookingMode || "FREE_SALE",
      commissionType: editedSupplier.commissionType || "PARTIAL_PREPAID",
      commissionPercent: editedSupplier.commissionPercent || 0.15,
      pickupType: editedSupplier.pickupType || "IN_TERMINAL",
      includesCDW: editedSupplier.includesCDW ?? true,
      includesTP: editedSupplier.includesTP ?? true,
      gracePeriodHours: editedSupplier.gracePeriodHours || 0,
      minBookingLeadTime: editedSupplier.minBookingLeadTime || 0,
      minRentalDays: editedSupplier.minRentalDays || 1,
      maxRentalDays: editedSupplier.maxRentalDays || 30,
      maxBookingLeadTimeDays: editedSupplier.maxBookingLeadTimeDays || 365,
      logoScale: editedSupplier.logoScale || 100,
      logoScaleMobile: editedSupplier.logoScaleMobile || 100,
      oneWayFee: editedSupplier.oneWayFee || 0,
      connectionType: editedSupplier.connectionType || "manual",
      rating: editedSupplier.rating || 4.5,
      ratingReviewCount: editedSupplier.ratingReviewCount || 0,
      ratingCleanliness: editedSupplier.ratingCleanliness ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingCondition: editedSupplier.ratingCondition ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingValueForMoney: editedSupplier.ratingValueForMoney ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingPickupSpeed: editedSupplier.ratingPickupSpeed ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingDropoffSpeed: editedSupplier.ratingDropoffSpeed ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingStaffService: editedSupplier.ratingStaffService ?? ratingToDefaultPercent(editedSupplier.rating),
      ratingEaseOfLocating: editedSupplier.ratingEaseOfLocating ?? ratingToDefaultPercent(editedSupplier.rating)
    };
    if (!finalSupplier.id) finalSupplier.status = "active";
    if (!finalSupplier.password) finalSupplier.password = "changeMe123!";
    onSave(finalSupplier);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier?.id ? "Edit Supplier" : "Add Supplier"} size="lg">
      <div className="space-y-6">
        {/* Logo section */}
        <div className="flex gap-6 p-6 bg-gradient-to-br from-blue-50 to-white rounded-card border border-blue-100/50">
          <div className="flex flex-col items-center">
            <div className="relative group w-48 h-32">
              {editedSupplier.logo || editedSupplier.logoUrl ? (
                <img src={getImageUrl(editedSupplier.logo || editedSupplier.logoUrl)} className="w-full h-full rounded-card object-contain bg-white shadow-xl border-4 border-white" alt="Logo" width="192" height="128" />
              ) : (
                <div className="w-full h-full bg-white rounded-card flex items-center justify-center border-2 border-dashed border-gray-200">
                  <Building className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-card cursor-pointer">
                <ImageIcon className="w-6 h-6 text-white" />
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleLogo} />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Logo (auto-resized)</p>
          </div>
          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Name" value={editedSupplier.name || ""} onChange={e => handleChange("name", e.target.value)} />
              <InputField label="Reservation Email" value={editedSupplier.contactEmail || ""} onChange={e => handleChange("contactEmail", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Pickup Type" value={editedSupplier.pickupType || "IN_TERMINAL"} onChange={e => handleChange("pickupType", e.target.value)} options={[
                { value: "IN_TERMINAL", label: "In Terminal" },
                { value: "MEET_AND_GREET", label: "Meet & Greet" },
                { value: "SHUTTLE_BUS", label: "Shuttle Bus" }
              ]} />
              <div className="bg-white px-3 py-1.5 rounded-card border border-gray-200">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Supplier Rating (1-10)</label>
                <div className="flex items-center gap-3 mt-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <input 
                    type="range" min="1" max="10" step="0.1" 
                    value={editedSupplier.rating || 4.5} 
                    onChange={e => handleChange("rating", parseFloat(e.target.value))}
                    className="flex-grow h-1.5 bg-gray-200 rounded-card appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-sm font-extrabold text-gray-700 min-w-[2rem]">{editedSupplier.rating || 4.5}</span>
                </div>
              </div>
            </div>
            <div className="rounded-card border border-gray-200 bg-white p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-gray-800">Customer rating details</h3>
                  <p className="mt-1 text-[11px] font-medium text-gray-400">Controls the dark rating pop-up bars on search cards.</p>
                </div>
                <div className="w-full sm:w-40">
                  <InputField
                    label="Review Count"
                    type="number"
                    min="0"
                    value={editedSupplier.ratingReviewCount ?? 0}
                    onChange={e => handleChange("ratingReviewCount", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {supplierRatingMetrics.map(metric => {
                  const metricValue = Number((editedSupplier as any)[metric.field] ?? ratingToDefaultPercent(editedSupplier.rating));
                  return (
                    <div key={metric.field} className="rounded-card border border-gray-100 bg-gray-50 px-3 py-2.5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">{metric.label}</label>
                        <span className="text-xs font-extrabold text-gray-900">{metricValue}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={metricValue}
                        onChange={e => handleChange(metric.field, parseInt(e.target.value) || 0)}
                        className="h-2 w-full cursor-pointer appearance-none rounded-card bg-gray-200 accent-[#5fd018]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <InputField 
              label="Supplier Logo URL" 
              icon={Globe}
              value={editedSupplier.logoUrl || editedSupplier.logo || ""} 
              onChange={e => setEditedSupplier(prev => ({ ...prev, logoUrl: e.target.value, logo: "" }))} 
              placeholder="https://example.com/logo.png"
              helperText="Paste a direct image URL or use the upload button on the left."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Phone" value={editedSupplier.phone || ""} onChange={e => handleChange("phone", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#007ac2]" /><h3 className="text-sm font-bold">Service Locations</h3></div>
          <div className="bg-white p-4 rounded-card border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Add New Location</label>
              <LocationPicker onSelect={handleLocSelect} />
            </div>
            {selectedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map(loc => (
                  <div key={loc.value} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-card">
                    <span className="text-xs font-bold">{loc.label} ({loc.value})</span>
                    <button onClick={() => removeLocation(loc.value)}><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase block text-center">Or create custom location</label>
              <div className="flex gap-2 mt-2">
                <input placeholder="City Name" value={newLocName} onChange={e => setNewLocName(e.target.value)} className="flex-1 px-3 py-2 border rounded-card text-sm" />
                <input placeholder="Code" value={newLocCode} onChange={e => setNewLocCode(e.target.value.toUpperCase())} className="w-16 px-3 py-2 border rounded-card text-sm" />
                <button onClick={handleCreateCustom} className="p-2 bg-gray-800 text-white rounded-card hover:bg-gray-700"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Commission & Business Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-card border border-gray-100">
            <h4 className="text-xs font-bold mb-2">Commission</h4>
            <SelectField label="Type" value={editedSupplier.commissionType || "PARTIAL_PREPAID"} onChange={e => handleChange("commissionType", e.target.value)} options={[
              { value: "FULL_PREPAID", label: "Full Prepaid" },
              { value: "PARTIAL_PREPAID", label: "Partial Prepaid" },
              { value: "PAY_AT_DESK", label: "Pay at Desk" }
            ]} />
            <InputField label="Commission %" type="number" step="0.01" value={editedSupplier.commissionPercent || 0} onChange={e => handleChange("commissionPercent", parseFloat(e.target.value))} />
          </div>
          <div className="bg-white p-4 rounded-card border border-gray-100">
            <h4 className="text-xs font-bold mb-2">Booking Policy</h4>
            <SelectField label="Mode" value={editedSupplier.bookingMode || "FREE_SALE"} onChange={e => handleChange("bookingMode", e.target.value)} options={[
              { value: "FREE_SALE", label: "Free Sale (Instant)" },
              { value: "ON_REQUEST", label: "On Request (Manual)" }
            ]} />
            <SelectField label="Connection" value={editedSupplier.connectionType || "manual"} onChange={e => handleChange("connectionType", e.target.value)} options={[
              { value: "manual", label: "Manual Entry" },
              { value: "api", label: "Real-time API" }
            ]} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Min Duration (days)</label>
            <input type="number" value={editedSupplier.minRentalDays ?? 1} onChange={e => handleChange("minRentalDays", parseInt(e.target.value) || 1)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Max Duration (days)</label>
            <input type="number" value={editedSupplier.maxRentalDays ?? 30} onChange={e => handleChange("maxRentalDays", parseInt(e.target.value) || 30)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Grace Period (hrs)</label>
            <input type="number" value={editedSupplier.gracePeriodHours ?? 0} onChange={e => handleChange("gracePeriodHours", parseInt(e.target.value) || 0)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Min Lead Time (hrs)</label>
            <input type="number" value={editedSupplier.minBookingLeadTime ?? 0} onChange={e => handleChange("minBookingLeadTime", parseInt(e.target.value) || 0)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">Max Lead Time (days)</label>
            <input type="number" value={editedSupplier.maxBookingLeadTimeDays ?? 365} onChange={e => handleChange("maxBookingLeadTimeDays", parseInt(e.target.value) || 365)} className="w-full border rounded-card p-2 mt-1" />
          </div>
          <div className="bg-white p-3 rounded-card border">
            <label className="text-[10px] font-bold text-gray-400">One Way Fee</label>
            <input type="number" value={editedSupplier.oneWayFee ?? 0} onChange={e => handleChange("oneWayFee", parseFloat(e.target.value) || 0)} className="w-full border rounded-card p-2 mt-1" />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-card p-6 border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2"><Lock className="w-5 h-5 text-gray-600" /><span className="font-bold">Access Credentials</span></div>
            <button onClick={handleGenerateCredentials} disabled={isGenerating} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-card">Auto-generate</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Login Email" value={editedSupplier.email || editedSupplier.contactEmail || ""} onChange={e => handleChange("email", e.target.value)} />
            <div className="relative">
              <InputField label="Password" type={showPassword ? "text" : "password"} value={editedSupplier.password || ""} onChange={e => handleChange("password", e.target.value)} />
              <div className="absolute right-3 top-[34px] flex items-center gap-2">
                <button 
                  onClick={() => onCopy(editedSupplier.password || "", "edit-modal", "Password")} 
                  className="text-gray-400 hover:text-[#007ac2] transition-colors"
                  title="Copy Password"
                  type="button"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="text-gray-400 hover:text-slate-900 transition-colors"
                  type="button"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={editedSupplier.enableSocialProof || false} 
                onChange={e => handleChange("enableSocialProof", e.target.checked)} 
                className="w-4 h-4 rounded border-slate-300 text-[#007ac2] focus:ring-blue-500"
              /> 
              <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Enable Social Proof</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={editedSupplier.hogicarChoice || false} 
                onChange={e => handleChange("hogicarChoice", e.target.checked)} 
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              /> 
              <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-900 transition-colors flex items-center gap-1">
                <Award className="w-3 h-3" />
                Hogicar Choice
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500">Cancel</button>
          <button onClick={handleSave} className="px-8 py-2 bg-[#007ac2] text-white rounded-card font-bold">Save Supplier</button>
        </div>
      </div>
    </Modal>
  );
};
