// Admin dashboard: SupplierRequestsContent (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import MailQuestion from 'lucide-react/dist/esm/icons/mail-question';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { motion } from 'framer-motion';

import { CommissionType, BookingMode
} from '../../../types';
import { SectionHeader } from './ui';

// ==================== Supplier Requests ====================
export const SupplierRequestsContent = ({ apps, onApprove, onReject, onRefresh }: any) => {
  const handleApprove = (app: any) => { 
    const locationCode = app.primaryLocation.replace(/[^A-Z0-9]/g, '').substring(0,3).toUpperCase();
    const newSup: any = { 
        name: app.companyName, 
        contactEmail: app.email, 
        email: app.email, // Use request email as login email by default
        locations: [{ displayName: app.primaryLocation, locationCode: locationCode || 'LOC' }],
        connectionType: app.integrationType === 'api' ? 'api' : 'manual', 
        status: 'active', 
        commissionType: CommissionType.PARTIAL_PREPAID, 
        commissionValue: 0.15, 
        bookingMode: BookingMode.FREE_SALE, 
        password: app.companyName.toLowerCase().replace(/\s/g, '') + '123!' 
    }; 
    onApprove(newSup, app); 
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    if (Array.isArray(dateVal)) return dateVal.join('-');
    return dateVal.toString();
  };

  return (
    <div className="bg-white rounded-card shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <SectionHeader title="Supplier Requests" icon={MailQuestion} subtitle="New partner applications for review" />
          <button onClick={onRefresh} className="p-2 hover:bg-white rounded-card border border-gray-200 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
      </div>
      
      {!apps.length ? (
        <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <MailQuestion className="w-8 h-8" />
            </div>
            <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">No pending requests</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Fleet</th>
                <th className="px-6 py-4">Integration</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {apps.map((app: any) => (
                <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-900 text-[13px]">{app.companyName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{app.primaryLocation}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[12px] font-bold text-slate-700">{app.contactName}</div>
                    <div className="text-[11px] text-[#007ac2] font-medium lowercase mt-0.5">{app.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        {app.fleetSize}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-extrabold px-2 py-1 rounded-md uppercase tracking-widest ${app.integrationType === 'api' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-[#007ac2]'}`}>
                        {app.integrationType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-400 font-bold">
                    {formatDate(app.submissionDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleApprove(app)} 
                        className="p-2 bg-green-500 text-white rounded-card shadow-md shadow-green-100 hover:bg-green-600 transition-colors"
                        title="Approve & Setup Account"
                      >
                        <CheckCircle className="w-4 h-4"/>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => onReject(app.id)} 
                        className="p-2 bg-red-100 text-red-600 rounded-card hover:bg-red-200 transition-colors"
                        title="Reject Application"
                      >
                        <XCircle className="w-4 h-4"/>
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
