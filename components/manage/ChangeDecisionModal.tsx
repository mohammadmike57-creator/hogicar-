import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { changeRequestOf, fmtDay } from '../../utils/changeRequest';

/** Supplier/admin review of a customer's date change request. */
const ChangeDecisionModal: React.FC<{
  booking: any;
  onClose: () => void;
  onDecide: (approve: boolean, message: string) => Promise<void>;
}> = ({ booking: b, onClose, onDecide }) => {
  const req = changeRequestOf(b);
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState<null | 'approve' | 'decline'>(null);
  const [error, setError] = React.useState<string | null>(null);
  if (!req) return null;

  const decide = async (approve: boolean) => {
    setBusy(approve ? 'approve' : 'decline'); setError(null);
    try { await onDecide(approve, message.trim()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'Could not save your decision.'); setBusy(null); }
  };

  const rows = [
    { label: 'Pick-up', from: fmtDay(req.previousPickupDate || b.pickupDate, req.previousStartTime || b.startTime), to: fmtDay(req.pickupDate, req.startTime) },
    { label: 'Drop-off', from: fmtDay(req.previousDropoffDate || b.dropoffDate, req.previousEndTime || b.endTime), to: fmtDay(req.dropoffDate, req.endTime) },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => !busy && onClose()} className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative w-full max-w-lg rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6">
        <button onClick={onClose} disabled={!!busy} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Change request</p>
        <h2 id="decision-title" className="mt-1 text-xl font-bold text-slate-900">{b.firstName} {b.lastName} wants new dates</h2>
        <p className="mt-0.5 font-mono text-xs text-slate-500">Booking {b.bookingRef || b.id}</p>
        <div className="mt-4 space-y-2">
          {rows.map(r => (
            <div key={r.label} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{r.label}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500 line-through decoration-slate-300">{r.from}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">{r.to}</span>
              </p>
            </div>
          ))}
        </div>
        {req.note && <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">“{req.note}”</p>}
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Message to the customer <span className="font-normal text-slate-400">(optional)</span></span>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 300))} rows={2} placeholder="e.g. Approved, an extra day is paid at the desk"
            className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-2.5 text-base outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-sm" />
        </label>
        {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => decide(false)} disabled={!!busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
            {busy === 'decline' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" /> : <X className="h-4 w-4" />} Decline
          </button>
          <button onClick={() => decide(true)} disabled={!!busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {busy === 'approve' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />} Approve
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Approving updates the booking’s dates. The customer is emailed either way.</p>
      </motion.div>
    </div>,
    document.body,
  );
};

export default ChangeDecisionModal;
