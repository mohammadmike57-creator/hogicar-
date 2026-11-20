// Admin dashboard: FleetModals (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useState, useEffect } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Car from 'lucide-react/dist/esm/icons/car';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Percent from 'lucide-react/dist/esm/icons/percent';
import { motion } from 'framer-motion';
import {
    getSupplierCars,
    getSupplierRates,
    updateHogicarChoice 
} from '../../../lib/adminApi';

import { getImageUrl } from './images';

// ==================== Rates View Modal ====================
export const RatesModal = ({ car, supplier, onClose }: any) => {
    const [rates, setRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRates = async () => {
            try {
                setLoading(true);
                const cleanCarId = parseInt(String(car.id).split(':')[0]);
                const cleanSupplierId = parseInt(String(supplier.id).split(':')[0]);
                const data = await getSupplierRates(cleanSupplierId, cleanCarId);
                setRates(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadRates();
    }, [car, supplier]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Active Rates</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{car.make} {car.model} • {car.locationCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-card transition-colors text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                         <div className="flex justify-center py-12"><LoaderCircle className="w-8 h-8 text-indigo-600 animate-spin" /></div>
                    ) : rates.length === 0 ? (
                        <p className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">No rates configured for this car</p>
                    ) : (
                        <div className="space-y-4">
                            {rates.map((tier: any) => (
                                <div key={tier.id} className="p-6 rounded-card border border-slate-100 bg-slate-50/30">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 text-sm">{tier.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tier.startDate} — {tier.endDate}</p>
                                        </div>
                                        <div className="px-2 py-1 bg-white rounded-card border border-slate-200 text-[10px] font-extrabold text-indigo-600 uppercase">{tier.currency}</div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {tier.bands?.map((band: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded-card border border-slate-100 shadow-sm">
                                                <p className="text-[8px] font-extrabold text-slate-400 uppercase mb-1">{band.minDays}-{band.maxDays === 9999 ? '∞' : band.maxDays} Days</p>
                                                <p className="text-xs font-extrabold text-slate-900 tracking-tight">{tier.currency} {band.dailyRate}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ==================== Supplier Fleet Modal ====================
export const SupplierFleetModal = ({ supplier, onClose, onShowRates }: any) => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true);
        const data = await getSupplierCars(supplier.id);
        setCars(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (supplier) loadCars();
  }, [supplier]);

  const handleToggleChoice = async (carId: any, currentChoice: boolean) => {
    try {
      const cleanCarId = parseInt(String(carId).split(':')[0]);
      const cleanSupplierId = parseInt(String(supplier.id).split(':')[0]);
      setSavingId(carId);
      const updated = await updateHogicarChoice(cleanSupplierId, cleanCarId, { hogicarChoice: !currentChoice });
      setCars(prev => prev.map(c => c.id === carId ? updated : c));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdatePromo = async (carId: any, promo: number) => {
    try {
      const cleanCarId = parseInt(String(carId).split(':')[0]);
      const cleanSupplierId = parseInt(String(supplier.id).split(':')[0]);
      setSavingId(carId);
      const updated = await updateHogicarChoice(cleanSupplierId, cleanCarId, { hogicarPromotion: promo });
      setCars(prev => prev.map(c => c.id === carId ? updated : c));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Car className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Fleet Management</h2>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{supplier.name} • Choice & Promotions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-card transition-colors text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoaderCircle className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Accessing Fleet Inventory...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 rounded-card border border-red-100 flex items-center gap-4 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p className="font-bold">{error}</p>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
               <Car className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest">No vehicles found for this partner</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-card bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Vehicle</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Location</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Rates</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Hogicar Choice</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Commission Promo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cars.map((car: any) => (
                    <tr key={car.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 rounded-card bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                            {car.imageUrl ? <img src={getImageUrl(car.imageUrl)} className="w-full h-full object-contain" width="64" height="40" /> : <Car className="w-5 h-5 text-slate-200" />}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">{car.make} {car.model}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{car.sippCode} • {car.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 rounded-card text-[10px] font-extrabold text-slate-600 border border-slate-200">
                          {car.locationCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onShowRates(car)}
                          className="p-2 hover:bg-white rounded-card transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            disabled={savingId === car.id}
                            onClick={() => handleToggleChoice(car.id, !!car.hogicarChoice)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${car.hogicarChoice ? 'bg-indigo-600' : 'bg-slate-200'} ${savingId === car.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${car.hogicarChoice ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {car.hogicarChoice ? (
                          <div className="flex items-center gap-2">
                             <div className="relative">
                               <input 
                                 type="number"
                                 defaultValue={car.hogicarPromotion || 0}
                                 onBlur={(e) => handleUpdatePromo(car.id, parseFloat(e.target.value) || 0)}
                                 className="w-20 pl-6 pr-2 py-1.5 bg-indigo-50/30 border border-indigo-100 rounded-card text-xs font-extrabold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                               />
                               <Percent className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400" />
                             </div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Off Comm.</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic uppercase">Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
