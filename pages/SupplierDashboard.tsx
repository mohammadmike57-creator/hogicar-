import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Tag, MapPin, User, 
  Calendar, Download, Upload, Save, Plus, Trash2, Edit, 
  ChevronDown, ChevronUp, DollarSign, Settings, AlertCircle, 
  CheckCircle, Shield, BarChart3, TrendingUp, Users, Package,
  Clock, History, Zap, Gift, Image,
  FileText, PieChart, Activity, Wifi, Coffee, Baby, CarTaxiFront,
  Percent, Coins, Award, Star, Bell, Moon, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { format, parseISO } from 'date-fns';
import { Logo } from '../components/Logo';
import { supplierApi, getPublicLocations } from '../api';

// ==================== Types ====================
interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  sippCode: string;
  category: string;
  transmission: string;
  fuelPolicy: string;
  passengers: number;
  bags: number;
  doors: number;
  airConditioning: boolean;
  imageUrl: string;
  deposit: number;
  excess: number;
  unlimitedMileage: boolean;
  available: boolean;
  locationCode: string;
  rateTiers?: RateTier[];
}

interface RateBand {
  minDays: number;
  maxDays: number;
  dailyRate?: number;
}

interface RateTier {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  promotionLabel?: string;
  bands: RateBand[];
}

interface Period {
  name: string;
  startDate: string;
  endDate: string;
  bands?: RateBand[];
  usePreviousBands?: boolean;
}

interface TemplateConfig {
  currency: string;
  periods: Period[];
  bands: RateBand[];
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  logoUrl: string;
  locationCode: string;
  location: string;
  bookingMode: 'FREE_SALE' | 'ON_REQUEST';
}

interface LocationRequest {
  id: string;
  locationCode: string;
  displayName: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  requestedAt: string;
}

interface Activity {
  id: string;
  type: 'car_added' | 'car_updated' | 'car_deleted' | 'rates_updated' | 'stop_sale_added' | 'location_requested' | 'promotion_created' | 'extra_created' | 'extra_updated' | 'extra_deleted';
  description: string;
  timestamp: string;
}

interface Promotion {
  id: string;
  carId: string;
  carName: string;
  promotionLabel: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_EXTRA';
  discountValue: number;
  extraId?: string;
  startDate: string;
  endDate: string;
}

interface Extra {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  maxQuantity: number;
}

// ==================== Helper Functions ====================
const toNumber = (val: any, fallback: number): number => {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

const formatDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

// ==================== Sidebar Component ====================
const Sidebar = ({ activeSection, setActiveSection, isOpen, setIsOpen, supplierName, bookingMode, supplierLogo }: any) => {
  const navigate = useNavigate();
  
  const NavItem = ({ section, label, icon: Icon }: any) => (
    <motion.button
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => { setActiveSection(section); setIsOpen(false); }}
      className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
        activeSection === section 
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </motion.button>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" variant="light" />
              <div>
                <h1 className="font-bold text-white text-xl">HogiCar</h1>
                <p className="text-xs text-gray-400">Supplier Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
              {supplierLogo ? (
                <img src={supplierLogo} alt={supplierName} className="w-10 h-10 rounded-full object-cover border-2 border-orange-500" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500">
                  <User className="w-5 h-5 text-orange-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{supplierName || 'Supplier'}</p>
                <div className="flex items-center gap-1 mt-1">
                  {bookingMode === 'FREE_SALE' ? (
                    <>
                      <Zap className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Free Sale</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-yellow-400">On Request</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <NavItem section="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavItem section="cars" label="My Cars" icon={Car} />
            <NavItem section="rates" label="Rates Management" icon={DollarSign} />
            <NavItem section="promotions" label="Promotions" icon={Gift} />
            <NavItem section="extras" label="Extras" icon={Package} />
            <NavItem section="stopsales" label="Stop Sales" icon={Calendar} />
            <NavItem section="locations" label="Location Requests" icon={MapPin} />
            <NavItem section="profile" label="Profile" icon={User} />
          </nav>

          <div className="p-4 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                localStorage.removeItem('supplierToken');
                navigate('/supplier-login');
              }}
              className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== EditCarModal Component ====================
const EditCarModal = ({ isOpen, onClose, car, supplier, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    sippCode: '',
    category: '',
    transmission: '',
    fuelPolicy: '',
    passengers: 5,
    bags: 2,
    doors: 4,
    airConditioning: true,
    imageUrl: '',
    deposit: 0,
    excess: 0,
    unlimitedMileage: true,
    available: true,
    locationCode: supplier?.locationCode || '',
  });
  const [carModels, setCarModels] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (car) {
        setFormData({
          ...car,
          year: car.year || new Date().getFullYear(),
          passengers: car.passengers || 5,
          bags: car.bags || 2,
          doors: car.doors || 4,
          deposit: car.deposit || 0,
          excess: car.excess || 0,
        });
      } else {
        setFormData({
          name: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          sippCode: '',
          category: '',
          transmission: '',
          fuelPolicy: '',
          passengers: 5,
          bags: 2,
          doors: 4,
          airConditioning: true,
          imageUrl: '',
          deposit: 0,
          excess: 0,
          unlimitedMileage: true,
          available: true,
          locationCode: supplier?.locationCode || '',
        });
      }
      supplierApi.getCarModels().then(res => setCarModels(res.data)).catch(console.error);
    }
  }, [isOpen, car, supplier]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (car) {
        await supplierApi.updateCar(car.id, formData);
      } else {
        await supplierApi.createCar(formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save car');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modelOptions = carModels.map((m: any) => ({ value: m.model, label: `${m.make} ${m.model}` }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">{car ? 'Edit Car' : 'Add New Car'}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Car Name</label>
                    <input
                      type="text"
                      value={formData.name ?? ''}
                      onChange={e => handleChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                    <Select
                      options={modelOptions}
                      value={modelOptions.find(o => o.value === formData.model)}
                      onChange={(option: any) => {
                        handleChange('model', option?.value);
                        const selected = carModels.find((m: any) => m.model === option?.value);
                        if (selected) {
                          handleChange('make', selected.make);
                        }
                      }}
                      placeholder="Search and select a model..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Make</label>
                    <input
                      type="text"
                      value={formData.make ?? ''}
                      onChange={e => handleChange('make', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                      <input
                        type="number"
                        value={formData.year ?? new Date().getFullYear()}
                        onChange={e => handleChange('year', toNumber(e.target.value, new Date().getFullYear()))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1900"
                        max="2100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">SIPP Code</label>
                      <input
                        type="text"
                        value={formData.sippCode ?? ''}
                        onChange={e => handleChange('sippCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                      <select
                        value={formData.category ?? ''}
                        onChange={e => handleChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="ECONOMY">Economy</option>
                        <option value="COMPACT">Compact</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="STANDARD">Standard</option>
                        <option value="FULLSIZE">Fullsize</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="LUXURY">Luxury</option>
                        <option value="SUV">SUV</option>
                        <option value="VAN">Van</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Transmission</label>
                      <select
                        value={formData.transmission ?? ''}
                        onChange={e => handleChange('transmission', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="MANUAL">Manual</option>
                        <option value="AUTOMATIC">Automatic</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Fuel Policy</label>
                      <select
                        value={formData.fuelPolicy ?? ''}
                        onChange={e => handleChange('fuelPolicy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="FULL_TO_FULL">Full to Full</option>
                        <option value="FULL_TO_EMPTY">Full to Empty</option>
                        <option value="LIKE_FOR_LIKE">Like for Like</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.locationCode ?? ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Location assigned by admin</p>
                    </div>
                  </div>
                </div>

                {/* Specs & Pricing */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Specifications & Pricing</h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Passengers</label>
                      <input
                        type="number"
                        value={formData.passengers ?? 5}
                        onChange={e => handleChange('passengers', toNumber(e.target.value, 5))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Bags</label>
                      <input
                        type="number"
                        value={formData.bags ?? 2}
                        onChange={e => handleChange('bags', toNumber(e.target.value, 2))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Doors</label>
                      <input
                        type="number"
                        value={formData.doors ?? 4}
                        onChange={e => handleChange('doors', toNumber(e.target.value, 4))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.airConditioning ?? true}
                        onChange={e => handleChange('airConditioning', e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Air Conditioning</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.unlimitedMileage ?? true}
                        onChange={e => handleChange('unlimitedMileage', e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Unlimited Mileage</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Deposit ($)</label>
                      <input
                        type="number"
                        value={formData.deposit ?? 0}
                        onChange={e => handleChange('deposit', toNumber(e.target.value, 0))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Excess ($)</label>
                      <input
                        type="number"
                        value={formData.excess ?? 0}
                        onChange={e => handleChange('excess', toNumber(e.target.value, 0))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl ?? ''}
                      onChange={e => handleChange('imageUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://example.com/car.jpg"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.available ?? true}
                        onChange={e => handleChange('available', e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Available for booking</span>
                    </label>
                  </div>
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Car</>}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== RatesSection Component (FIXED) ====================
const RatesSection = ({ onRatesUpdate }: any) => {
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchConfig = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await supplierApi.getTemplateConfig();
      console.log('Template config response:', res);
      // Handle different response structures
      const configData = res?.data || res;
      setConfig(configData);
    } catch (err: any) {
      console.error('Failed to fetch config', err);
      setFetchError('Could not load configuration. You can still create a new one.');
      // Set a default config to allow modal opening
      setConfig({
        currency: 'USD',
        periods: [],
        bands: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (newConfig: TemplateConfig) => {
    setIsSaving(true);
    try {
      await supplierApi.saveTemplateConfig(newConfig);
      setConfig(newConfig);
      setShowConfigModal(false);
      if (onRatesUpdate) onRatesUpdate();
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await supplierApi.downloadTemplate();
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rates_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download template');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      const res = await supplierApi.importRates(uploadFile);
      setUploadResult(res.data.message || 'Import successful');
      setUploadFile(null);
      fetchConfig();
      if (onRatesUpdate) onRatesUpdate();
    } catch (err) {
      alert('Import failed');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rates Management</h2>
          {fetchError && <p className="text-sm text-orange-600 mt-1">{fetchError}</p>}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfigModal(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
        >
          <Settings className="w-4 h-4" /> Configure Periods
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="text-2xl font-bold text-gray-800">{config?.currency || 'USD'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Periods</p>
              <p className="text-2xl font-bold text-gray-800">{config?.periods?.length || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bands</p>
              <p className="text-2xl font-bold text-gray-800">{config?.bands?.length || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Excel Template</h3>
        <div className="flex flex-wrap gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Downloading...' : 'Download Template'}
          </motion.button>
          <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-md">
            <Upload className="w-4 h-4" />
            Upload Filled Excel
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        {uploadFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex items-center gap-4"
          >
            <p className="text-sm text-gray-600">Selected: {uploadFile.name}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-lg text-sm"
            >
              Import
            </motion.button>
          </motion.div>
        )}
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {uploadResult}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showConfigModal && config && (
          <ConfigModal
            config={config}
            onClose={() => setShowConfigModal(false)}
            onSave={handleSaveConfig}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== ConfigModal Component (with period editing) ====================
const ConfigModal = ({ config, onClose, onSave, isSaving }: any) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [newPeriod, setNewPeriod] = useState({ name: '', startDate: '', endDate: '', bands: [] });
  const [newBand, setNewBand] = useState({ name: '', minDays: 1, maxDays: 1 });
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number | null>(null);

  const addPeriod = () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      alert('Please fill all period fields');
      return;
    }
    const updated = { ...localConfig };
    updated.periods.push({ ...newPeriod, bands: [] });
    setLocalConfig(updated);
    setNewPeriod({ name: '', startDate: '', endDate: '', bands: [] });
    setEditingPeriodIndex(null);
  };

  const updatePeriod = () => {
    if (editingPeriodIndex === null) return;
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      alert('Please fill all period fields');
      return;
    }
    const updated = { ...localConfig };
    updated.periods[editingPeriodIndex] = { ...newPeriod, bands: updated.periods[editingPeriodIndex].bands };
    setLocalConfig(updated);
    setNewPeriod({ name: '', startDate: '', endDate: '', bands: [] });
    setEditingPeriodIndex(null);
  };

  const handleEditPeriod = (index: number) => {
    const period = localConfig.periods[index];
    setNewPeriod({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      bands: period.bands || [],
    });
    setEditingPeriodIndex(index);
  };

  const addBand = () => {
    if (!newBand.name || newBand.minDays >= newBand.maxDays) {
      alert('Invalid band: max days must be greater than min days');
      return;
    }
    const updated = { ...localConfig };
    updated.bands.push({ ...newBand });
    setLocalConfig(updated);
    setNewBand({ name: '', minDays: 1, maxDays: 1 });
  };

  const removeBand = (index: number) => {
    const updated = { ...localConfig };
    updated.bands.splice(index, 1);
    setLocalConfig(updated);
  };

  const removePeriodBand = (periodIndex: number, bandIndex: number) => {
    const updated = { ...localConfig };
    updated.periods[periodIndex].bands?.splice(bandIndex, 1);
    setLocalConfig(updated);
  };

  const toggleUsePreviousBands = (index: number, use: boolean) => {
    const updated = { ...localConfig };
    if (use && index > 0) {
      updated.periods[index].bands = JSON.parse(JSON.stringify(updated.periods[index-1].bands || []));
      updated.periods[index].usePreviousBands = true;
    } else {
      updated.periods[index].bands = [];
      updated.periods[index].usePreviousBands = false;
    }
    setLocalConfig(updated);
  };

  const cancelEdit = () => {
    setNewPeriod({ name: '', startDate: '', endDate: '', bands: [] });
    setEditingPeriodIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Configure Periods & Bands</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-orange-500" /> Periods
          </h4>
          <div className="space-y-4">
            {localConfig.periods.map((period: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 cursor-pointer" onClick={() => handleEditPeriod(index)}>
                    <p className="font-medium text-gray-800">{period.name}</p>
                    <p className="text-sm text-gray-600">{formatDate(period.startDate)} – {formatDate(period.endDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={period.usePreviousBands || false}
                          onChange={(e) => toggleUsePreviousBands(index, e.target.checked)}
                          className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span>Use previous bands</span>
                      </label>
                    )}
                    <button
                      onClick={() => handleEditPeriod(index)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit period"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {!period.usePreviousBands && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Custom bands:</p>
                    {period.bands && period.bands.length > 0 ? (
                      <div className="space-y-2">
                        {period.bands.map((band: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">{band.name}: {band.minDays}-{band.maxDays} days</span>
                            <button onClick={() => removePeriodBand(index, i)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No bands – will use global bands.</p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add/Edit Period Form */}
            <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl">
              <h5 className="font-medium mb-2">{editingPeriodIndex !== null ? 'Edit Period' : 'Add New Period'}</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newPeriod.name}
                  onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={newPeriod.startDate}
                  onChange={e => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={newPeriod.endDate}
                  onChange={e => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={editingPeriodIndex !== null ? updatePeriod : addPeriod}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 flex-1"
                  >
                    {editingPeriodIndex !== null ? <><Save className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>}
                  </motion.button>
                  {editingPeriodIndex !== null && (
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-gray-700 mt-8 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-orange-500" /> Global Bands
          </h4>
          <div className="space-y-2">
            {localConfig.bands.map((band: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border"
              >
                <span className="text-sm">{band.name}: {band.minDays} – {band.maxDays} days</span>
                <button onClick={() => removeBand(index)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl">
            <h5 className="font-medium mb-2">Add New Global Band</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Name (e.g., 1-2 days)"
                value={newBand.name}
                onChange={e => setNewBand({ ...newBand, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Min days"
                value={newBand.minDays}
                onChange={e => setNewBand({ ...newBand, minDays: toNumber(e.target.value, 1) })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
              <input
                type="number"
                placeholder="Max days"
                value={newBand.maxDays}
                onChange={e => setNewBand({ ...newBand, maxDays: toNumber(e.target.value, 1) })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addBand}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(localConfig)}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== PromotionsSection Component ====================
const PromotionsSection = ({ cars, onPromotionCreated }: any) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);

  useEffect(() => {
    const carsData = Array.isArray(cars) ? cars : [];
    const allPromos = carsData.flatMap((car: any) =>
      (car.rateTiers || [])
        .filter((t: any) => t.promotionLabel)
        .map((t: any) => ({
          id: t.id,
          carId: car.id,
          carName: `${car.make} ${car.model}`,
          promotionLabel: t.promotionLabel,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          startDate: t.startDate,
          endDate: t.endDate,
        }))
    );
    setPromotions(allPromos);
    const savedExtras = localStorage.getItem('supplier_extras');
    setExtras(savedExtras ? JSON.parse(savedExtras) : []);
  }, [cars]);

  const handleAddPromotion = (newPromo: Promotion) => {
    setPromotions([...promotions, { ...newPromo, id: Date.now().toString() }]);
    if (onPromotionCreated) onPromotionCreated();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Promotions</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Promotion
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <motion.div
            key={promo.id}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-md border border-gray-100 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{promo.carName}</p>
                <p className="text-sm text-orange-600 font-medium mt-1">{promo.promotionLabel}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                </p>
              </div>
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% off` : `$${promo.discountValue} off`}
              </span>
            </div>
          </motion.div>
        ))}
        {promotions.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center py-8">No promotions yet.</p>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddPromotionModal
            cars={cars}
            extras={extras}
            onClose={() => setShowAddModal(false)}
            onSave={handleAddPromotion}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== AddPromotionModal Component ====================
const AddPromotionModal = ({ cars, extras, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    carId: '',
    promotionLabel: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    extraId: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = () => {
    if (!formData.carId || !formData.promotionLabel || !formData.startDate || !formData.endDate) {
      alert('Please fill all required fields');
      return;
    }
    if (formData.discountType === 'FREE_EXTRA' && !formData.extraId) {
      alert('Please select an extra');
      return;
    }
    const selectedCar = cars.find((c: any) => c.id === formData.carId);
    onSave({
      ...formData,
      carName: selectedCar ? `${selectedCar.make} ${selectedCar.model}` : '',
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Create Promotion</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Car</label>
            <select
              value={formData.carId}
              onChange={e => setFormData({ ...formData, carId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a car</option>
              {cars.map((car: any) => (
                <option key={car.id} value={car.id}>{car.make} {car.model} ({car.year})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Label</label>
            <input
              type="text"
              value={formData.promotionLabel}
              onChange={e => setFormData({ ...formData, promotionLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Summer Special"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PERCENTAGE">Percentage off</option>
                <option value="FIXED_AMOUNT">Fixed amount off per day</option>
                <option value="FREE_EXTRA">Free extra</option>
              </select>
            </div>
            {formData.discountType !== 'FREE_EXTRA' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={e => setFormData({ ...formData, discountValue: toNumber(e.target.value, 0) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra</label>
                <select
                  value={formData.extraId}
                  onChange={e => setFormData({ ...formData, extraId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select extra</option>
                  {extras.map((ex: Extra) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-md"
          >
            Create Promotion
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== ExtrasSection Component ====================
const ExtrasSection = ({ extras, onExtrasChange }: any) => {
  const [localExtras, setLocalExtras] = useState<Extra[]>(extras);
  const [showModal, setShowModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);

  useEffect(() => {
    setLocalExtras(extras);
  }, [extras]);

  const handleSave = (extra: Extra) => {
    let updated;
    if (editingExtra) {
      updated = localExtras.map(e => e.id === extra.id ? extra : e);
    } else {
      updated = [...localExtras, { ...extra, id: Date.now().toString() }];
    }
    setLocalExtras(updated);
    localStorage.setItem('supplier_extras', JSON.stringify(updated));
    setShowModal(false);
    setEditingExtra(null);
    if (onExtrasChange) onExtrasChange();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this extra?')) {
      const updated = localExtras.filter(e => e.id !== id);
      setLocalExtras(updated);
      localStorage.setItem('supplier_extras', JSON.stringify(updated));
      if (onExtrasChange) onExtrasChange();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Extras</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingExtra(null); setShowModal(true); }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Extra
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localExtras.map((extra) => (
          <motion.div
            key={extra.id}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-md border border-gray-100 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{extra.name}</p>
                  <p className="text-xs text-gray-500">{extra.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">${extra.pricePerDay}<span className="text-xs text-gray-400">/day</span></p>
                <p className="text-xs text-gray-500">Max {extra.maxQuantity}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setEditingExtra(extra); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(extra.id)} className="text-red-600 hover:text-red-800">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {localExtras.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center py-8">No extras added yet.</p>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <ExtraModal
            extra={editingExtra}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== ExtraModal Component ====================
const ExtraModal = ({ extra, onClose, onSave }: any) => {
  const [formData, setFormData] = useState<Partial<Extra>>(
    extra || { name: '', description: '', pricePerDay: 0, maxQuantity: 1 }
  );

  const handleSubmit = () => {
    if (!formData.name || !formData.description || formData.pricePerDay === undefined || !formData.maxQuantity) {
      alert('Please fill all fields');
      return;
    }
    onSave({ ...formData, id: extra?.id });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">{extra ? 'Edit Extra' : 'Add Extra'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., GPS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Satellite navigation system"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per day ($)</label>
              <input
                type="number"
                value={formData.pricePerDay}
                onChange={e => setFormData({ ...formData, pricePerDay: toNumber(e.target.value, 0) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max quantity</label>
              <input
                type="number"
                value={formData.maxQuantity}
                onChange={e => setFormData({ ...formData, maxQuantity: toNumber(e.target.value, 1) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-md"
          >
            {extra ? 'Update' : 'Create'} Extra
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== StopSalesSection Component ====================
const StopSalesSection = () => {
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !startDate || !endDate) return;
    setIsSubmitting(true);
    try {
      await supplierApi.post('/dashboard/stopsales/bulk', { category, startDate, endDate });
      alert('Stop sales applied successfully');
      setCategory('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      alert('Failed to apply stop sales');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 max-w-2xl"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Stop Sales</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select category</option>
            <option value="ECONOMY">Economy</option>
            <option value="COMPACT">Compact</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="STANDARD">Standard</option>
            <option value="FULLSIZE">Fullsize</option>
            <option value="PREMIUM">Premium</option>
            <option value="LUXURY">Luxury</option>
            <option value="SUV">SUV</option>
            <option value="VAN">Van</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 shadow-md"
        >
          {isSubmitting ? 'Applying...' : 'Apply Stop Sales'}
        </motion.button>
      </form>
    </motion.div>
  );
};

// ==================== LocationRequestsSection Component ====================
const LocationRequestsSection = () => {
  const [locations, setLocations] = useState<LocationRequest[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locsRes, airportsRes] = await Promise.all([
          supplierApi.getMyLocations(),
          getPublicLocations()
        ]);
        setLocations(locsRes.data);
        setAirports(airportsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequest = async () => {
    if (!selectedAirport) return;
    setIsSubmitting(true);
    try {
      await supplierApi.requestLocation({
        locationCode: selectedAirport.value,
        displayName: selectedAirport.label
      });
      alert('Location request submitted');
      setSelectedAirport(null);
      const updated = await supplierApi.getMyLocations();
      setLocations(updated.data);
    } catch (err) {
      alert('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const airportOptions = airports.map((a: any) => ({
    value: a.iataCode,
    label: `${a.iataCode} – ${a.name}, ${a.municipality} (${a.countryCode})`
  }));

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Location Requests</h2>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Request New Location</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <Select
              options={airportOptions}
              value={selectedAirport}
              onChange={setSelectedAirport}
              placeholder="Search for an airport..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequest}
            disabled={!selectedAirport || isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? 'Submitting...' : 'Request'}
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">Existing Requests</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td className="px-6 py-4">{loc.displayName}</td>
                <td className="px-6 py-4">{loc.locationCode}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    loc.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                    loc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {loc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(loc.requestedAt)}</td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No location requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// ==================== ProfileSection Component ====================
const ProfileSection = ({ supplier }: { supplier: Supplier }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>
      <div className="flex items-center gap-6 mb-6">
        {supplier.logoUrl ? (
          <img src={supplier.logoUrl} alt={supplier.name} className="w-24 h-24 rounded-full object-cover border-4 border-orange-200" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-200">
            <User className="w-12 h-12 text-orange-400" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{supplier.name}</h3>
          <p className="text-gray-600">{supplier.email}</p>
          <p className="text-gray-600">{supplier.phone}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Primary Location</p>
          <p className="font-medium">{supplier.locationCode} – {supplier.location}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Booking Mode</p>
          <p className="font-medium flex items-center gap-1">
            {supplier.bookingMode === 'FREE_SALE' ? (
              <><Zap className="w-4 h-4 text-green-500" /> Free Sale</>
            ) : (
              <><Clock className="w-4 h-4 text-yellow-500" /> On Request</>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== CarsSection Component ====================
const CarsSection = ({ supplier }: { supplier: Supplier }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const res = await supplierApi.getCars();
      // Handle both response formats
      const carsData = Array.isArray(res) ? res : (res?.data || []);
      setCars(carsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load cars');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;
    try {
      await supplierApi.deleteCar(id);
      await fetchCars();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete car');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Fleet</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Car
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-6 py-3">Car</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cars.map(car => (
              <tr key={car.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={car.imageUrl || 'https://placehold.co/80x50/orange/white?text=Car'} alt={car.name} className="w-20 h-12 object-cover rounded" />
                    <div>
                      <p className="font-medium text-gray-900">{car.name}</p>
                      <p className="text-sm text-gray-500">{car.make} {car.model} {car.year}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {car.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{car.locationCode}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${car.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {car.available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setEditingCar(car); setIsModalOpen(true); }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {cars.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No cars yet. Click "Add Car" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <EditCarModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            car={editingCar}
            supplier={supplier}
            onSave={fetchCars}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== DashboardHome Component ====================
const DashboardHome = ({ supplier, cars, activities, promotions, stats }: any) => {
  // Debug marker to confirm component renders
  return (
    <div className="space-y-6">
      <div style={{position:'fixed', top:0, left:0, background:'green', color:'white', zIndex:9999, padding:'4px'}}>
        Dashboard Home Rendered
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {supplier.name}!</h1>
            <p className="text-orange-100 mt-1">Here's what's happening with your fleet today.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/20 rounded-lg px-4 py-2">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{supplier.locationCode} – {supplier.location}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center text-white">
              <Car className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Cars</p>
              <p className="text-2xl font-bold text-gray-800">{cars?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center text-white">
              <Gift className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Active Promotions</p>
              <p className="text-2xl font-bold text-gray-800">{promotions?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center text-white">
              <Package className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Active Extras</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.extrasCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center text-white">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Locations</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.pendingLocations || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {promotions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Gift className="w-5 h-5 mr-2 text-purple-500" />
            Active Promotions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.slice(0, 3).map((promo: Promotion) => (
              <motion.div
                key={promo.id}
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{promo.carName}</p>
                    <p className="text-sm text-purple-600 font-medium mt-1">{promo.promotionLabel}</p>
                    <p className="text-xs text-gray-500 mt-2">Until {formatDate(promo.endDate)}</p>
                  </div>
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% off` : `$${promo.discountValue} off`}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          {promotions.length > 3 && (
            <p className="text-sm text-gray-500 mt-4">+ {promotions.length - 3} more promotions</p>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <History className="w-5 h-5 mr-2 text-orange-500" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity.</p>
          ) : (
            activities.slice(0, 5).map((act: Activity) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start border-b border-gray-100 pb-3 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {act.type === 'car_added' && <Plus className="w-4 h-4 text-green-600" />}
                  {act.type === 'car_updated' && <Edit className="w-4 h-4 text-blue-600" />}
                  {act.type === 'car_deleted' && <Trash2 className="w-4 h-4 text-red-600" />}
                  {act.type === 'rates_updated' && <DollarSign className="w-4 h-4 text-purple-600" />}
                  {act.type === 'promotion_created' && <Gift className="w-4 h-4 text-orange-600" />}
                  {act.type === 'extra_created' && <Package className="w-4 h-4 text-indigo-600" />}
                  {act.type === 'stop_sale_added' && <Calendar className="w-4 h-4 text-red-600" />}
                  {act.type === 'location_requested' && <MapPin className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{act.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(act.timestamp)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ==================== Main SupplierDashboard Component ====================
const SupplierDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [stats, setStats] = useState({ stopSalesCount: 0, pendingLocations: 0, extrasCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      console.log('Fetching profile...');
      const profileRes = await supplierApi.getMe();
      console.log('Profile response:', profileRes);
      
      console.log('Fetching cars...');
      const carsRes = await supplierApi.getCars();
      console.log('Cars response:', carsRes);
      
      // Handle both possible response formats (direct object or { data: ... })
      const profileData = profileRes?.data || profileRes;
      const carsData = Array.isArray(carsRes) ? carsRes : (carsRes?.data || []);
      
      setSupplier(profileData);
      setCars(carsData);

      const savedActivities = localStorage.getItem('supplier_activities');
      if (savedActivities) setActivities(JSON.parse(savedActivities));

      const savedExtras = localStorage.getItem('supplier_extras');
      if (savedExtras) {
        const extrasList = JSON.parse(savedExtras);
        setExtras(extrasList);
        setStats(prev => ({ ...prev, extrasCount: extrasList.length }));
      }

      // Safely compute promotions
      const allPromos = (carsData || []).flatMap((car: any) =>
        (car.rateTiers || []).filter((t: any) => t.promotionLabel).map((t: any) => ({
          id: t.id,
          carId: car.id,
          carName: `${car.make} ${car.model}`,
          promotionLabel: t.promotionLabel,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          startDate: t.startDate,
          endDate: t.endDate,
        }))
      );
      setPromotions(allPromos);

      setStats(prev => ({ ...prev, pendingLocations: 2 }));
    } catch (err) {
      console.error('Failed to fetch data', err);
      navigate('/supplier-login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if token exists before fetching
    const token = localStorage.getItem('supplierToken');
    if (!token) {
      navigate('/supplier-login');
      return;
    }
    fetchAllData();
  }, [navigate]);

  const addActivity = (type: Activity['type'], description: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      description,
      timestamp: new Date().toISOString()
    };
    const updated = [newActivity, ...activities.slice(0, 19)];
    setActivities(updated);
    localStorage.setItem('supplier_activities', JSON.stringify(updated));
  };

  const handlePromotionCreated = () => {
    addActivity('promotion_created', 'Created a new promotion');
    supplierApi.getCars().then(res => {
      const carsData = Array.isArray(res) ? res : (res?.data || []);
      setCars(carsData);
    });
  };

  const handleExtrasChange = () => {
    const savedExtras = localStorage.getItem('supplier_extras');
    if (savedExtras) {
      const extrasList = JSON.parse(savedExtras);
      setExtras(extrasList);
      setStats(prev => ({ ...prev, extrasCount: extrasList.length }));
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!supplier) return <div className="flex h-screen items-center justify-center">No supplier data</div>;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome supplier={supplier} cars={cars} activities={activities} promotions={promotions} stats={stats} />;
      case 'cars':
        return <CarsSection supplier={supplier} />;
      case 'rates':
        return <RatesSection onRatesUpdate={() => addActivity('rates_updated', 'Updated rate configuration')} />;
      case 'promotions':
        return <PromotionsSection cars={cars} onPromotionCreated={handlePromotionCreated} />;
      case 'extras':
        return <ExtrasSection extras={extras} onExtrasChange={handleExtrasChange} />;
      case 'stopsales':
        return <StopSalesSection />;
      case 'locations':
        return <LocationRequestsSection />;
      case 'profile':
        return <ProfileSection supplier={supplier} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-gray-800">HogiCar</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          supplierName={supplier.name}
          bookingMode={supplier.bookingMode}
          supplierLogo={supplier.logoUrl}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;
