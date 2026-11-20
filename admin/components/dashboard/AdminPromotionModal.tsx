// Admin dashboard: AdminPromotionModal (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
    adminFetch 
} from '../../../lib/adminApi';

import { InputField, Modal, Toggle } from './ui';

export const AdminPromotionModal = ({ car, isOpen, onClose, onSave, onDeleteTier }: any) => {
  const [choice, setChoice] = useState(car?.hogicarChoice || false);
  const [promo, setPromo] = useState(car?.hogicarPromotion || 0);
  const [manualPrice, setManualPrice] = useState(car?.manualPrice || 0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (car) {
      setChoice(car.hogicarChoice || false);
      setPromo(car.hogicarPromotion || 0);
      setManualPrice(car.manualPrice || 0);
    }
  }, [car]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // car.supplierId is available from the car object
      const supplierId = car.supplierId;
      const res = await adminFetch(`/api/admin/suppliers/${supplierId}/cars/${car.id}/hogicar-choice`, {
        method: 'PATCH',
        body: JSON.stringify({
          hogicarChoice: choice,
          hogicarPromotion: promo,
          manualPrice: manualPrice
        })
      });
      alert('Pricing and Choice settings updated successfully');
      onSave(car.id, res); // Refresh the list
      onClose();
    } catch (e: any) {
      alert(`Update failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Pricing: ${car?.displayName || 'Vehicle'}`}>
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-card border border-blue-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-[#007ac2] uppercase tracking-wider">Hogicar Choice</h4>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Highlight this vehicle as a recommended option</p>
          </div>
          <Toggle checked={choice} onChange={setChoice} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Manual Price Override (Daily)" 
            type="number" 
            value={manualPrice} 
            onChange={(e: any) => setManualPrice(parseFloat(e.target.value))} 
            placeholder="0.00"
            helper="If set, this will override the supplier's base daily rate."
          />
          <InputField 
            label="Promotion Discount (%)" 
            type="number" 
            value={promo} 
            onChange={(e: any) => setPromo(parseFloat(e.target.value))} 
            placeholder="0"
            helper="Applied on top of the final price."
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#007ac2] text-white px-8 py-2.5 rounded-card font-bold text-sm shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Pricing'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
