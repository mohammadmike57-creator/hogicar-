// Admin dashboard: ui (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useEffect } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { motion } from 'framer-motion';

export const StatCard = ({ icon: Icon, title, value, change, hint, color = 'blue' }: any) => {
  const colors: any = {
    blue: 'bg-accent-50 text-accent',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-amber-50 text-amber-600',
    purple: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
        <span className={`flex h-8 w-8 shrink-0 sm:h-9 sm:w-9 items-center justify-center rounded-lg ${colors[color] || colors.blue}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-2 truncate text-[22px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums sm:mt-3 sm:text-[28px]">{value}</p>
      {(change || hint) && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-snug text-slate-500 sm:text-xs">
          {change && (
            <span className={`inline-flex items-center gap-0.5 font-semibold ${String(change).startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
              <TrendingUp className="h-3 w-3" /> {change}
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
};

export const SectionHeader = ({ title, subtitle, icon: Icon, action }: any) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      {Icon && <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-[18px] w-[18px]" /></span>}
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const fieldClass = (error?: any) => `w-full rounded-lg border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-accent focus:ring-accent/20'} bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50`;

export const InputField = ({ label, error, helperText, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <input {...props} className={`${fieldClass(error)} h-10`} />
    {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-slate-300'}`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
  </button>
);

export const SelectField = ({ label, options, error, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-slate-600">{label}</label>}
    <select {...props} className={`${fieldClass(error)} h-10`}>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export const TextAreaField = ({ label, ...props }: any) => (
  <div className="space-y-1.5">{label && <label className="block text-xs font-medium text-slate-600">{label}</label>}<textarea {...props} className={fieldClass()} /></div>
);

export const Badge = ({ status }: { status: string }) => {
  const styles: any = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    visible: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    approved: 'bg-accent-50 text-accent-800 ring-accent-600/20',
    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
    hidden: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  };
  const dot: any = { active: 'bg-emerald-500', confirmed: 'bg-emerald-500', visible: 'bg-emerald-500', pending: 'bg-amber-500', approved: 'bg-accent', rejected: 'bg-red-500', cancelled: 'bg-red-500', hidden: 'bg-slate-400' };
  const key = String(status || 'pending').toLowerCase();
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[key] || 'bg-slate-100 text-slate-700 ring-slate-500/20'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[key] || 'bg-slate-400'}`} />
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null;
  const sizes: any = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.98, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 8 }} transition={{ duration: 0.15 }}
        role="dialog" aria-modal="true"
        className={`flex max-h-[92dvh] w-full ${sizes[size]} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:max-h-[90vh] sm:rounded-xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
          <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
};

// ==================== Responsive tables ====================
/**
 * On phones every table inside the admin content is shown as a list of cards (see
 * .admin-content rules in index.css). This labels each cell with its column header so
 * the card can show "Status: Confirmed" etc. It re-runs whenever the content changes.
 */
export const useResponsiveTables = (root: React.RefObject<HTMLElement | null>, key: unknown) => {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const label = () => {
      el.querySelectorAll('table').forEach(table => {
        const headRow = table.querySelector('thead tr');
        if (!headRow) return;
        const headers: string[] = [];
        headRow.querySelectorAll('th, td').forEach(th => {
          const span = Number((th as HTMLTableCellElement).colSpan) || 1;
          for (let i = 0; i < span; i++) headers.push((th.textContent || '').trim());
        });
        table.setAttribute('data-rt', '');
        table.querySelectorAll('tbody tr').forEach(tr => {
          let col = 0;
          tr.querySelectorAll(':scope > td').forEach(td => {
            const text = headers[col] || '';
            if (td.getAttribute('data-label') !== text) td.setAttribute('data-label', text);
            col += Number((td as HTMLTableCellElement).colSpan) || 1;
          });
        });
      });
    };
    label();
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(label);
    });
    observer.observe(el, { childList: true, subtree: true });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [root, key]);
};

// Helper to format enum to label
export const formatEnum = (val: string) => {
  if (!val) return '';
  return val.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};
