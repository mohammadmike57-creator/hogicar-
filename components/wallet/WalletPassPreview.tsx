import * as React from 'react';
import { motion } from 'framer-motion';
import CarFront from 'lucide-react/dist/esm/icons/car-front';
import { Qr } from '../RentalVoucher';

const code = (c?: string, name?: string) => {
  const v = String(c || '').trim().toUpperCase();
  if (/^[A-Z0-9]{2,5}$/.test(v)) return v;
  const l = String(name || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  return l.length >= 3 ? l.slice(0, 3) : v.slice(0, 4) || '—';
};
const shortDay = (d?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || ''));
  if (!m) return d || '';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};
const place = (n?: string) => String(n || '').replace(/\s*\([^)]*\)\s*$/, '');

/** A to-scale look at the Wallet pass the customer is about to add. */
const WalletPassPreview: React.FC<{ booking: any; className?: string }> = ({ booking: b, className = '' }) => {
  const from = code(b.pickupCode, b.pickupLocationName);
  const to = code(b.dropoffCode || b.pickupCode, b.dropoffLocationName || b.pickupLocationName);
  const driver = [b.firstName, b.lastName].filter(Boolean).join(' ') || 'Main driver';
  const car = [b.carMake, b.carModel].filter(Boolean).join(' ') || 'Rental car';
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.hogicar.com'}/voucher?bookingRef=${encodeURIComponent(b.bookingRef || '')}`;
  return (
    <motion.div
      initial={{ rotate: -4, y: 12, opacity: 0 }}
      whileInView={{ rotate: -2, y: 0, opacity: 1 }}
      viewport={{ once: true }}
      whileHover={{ rotate: 0, y: -4 }}
      transition={{ type: 'spring', damping: 18, stiffness: 140 }}
      className={`w-[230px] select-none overflow-hidden rounded-[18px] bg-[#0b2545] text-white shadow-[0_24px_50px_-18px_rgba(11,37,69,0.65)] ring-1 ring-white/10 ${className}`}
      aria-hidden="true"
    >
      <div className="relative px-4 pb-3 pt-3.5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10"><svg viewBox="0 0 200 200" className="h-3.5 w-3.5"><path d="M52 106 Q100 58 148 94" stroke="#F57C00" strokeWidth="22" fill="none" strokeLinecap="round" /><line x1="70" y1="132" x2="130" y2="132" stroke="#F57C00" strokeWidth="16" strokeLinecap="round" /></svg></span>
            <span>HOGI<span className="text-accent">CAR</span></span>
          </span>
          <span className="text-right leading-tight"><span className="block text-[8px] font-semibold uppercase tracking-wider text-sky-300">Pick-up</span><span className="text-[11px] font-semibold">{shortDay(b.pickupDate)}</span></span>
        </div>
        <div className="relative mt-3 flex items-end justify-between">
          <div className="min-w-0"><p className="truncate text-[8px] uppercase tracking-wider text-sky-300">{place(b.pickupLocationName) || 'Pick-up'}</p><p className="text-[26px] font-semibold leading-none">{from}</p></div>
          <CarFront className="mb-1 h-4 w-4 shrink-0 text-sky-200" />
          <div className="min-w-0 text-right"><p className="truncate text-[8px] uppercase tracking-wider text-sky-300">{place(b.dropoffLocationName || b.pickupLocationName) || 'Return'}</p><p className="text-[26px] font-semibold leading-none">{to}</p></div>
        </div>
        <div className="relative mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="min-w-0"><p className="text-[8px] uppercase tracking-wider text-sky-300">Driver</p><p className="truncate font-medium">{driver}</p></div>
          <div className="min-w-0 text-right"><p className="text-[8px] uppercase tracking-wider text-sky-300">Car</p><p className="truncate font-medium">{car}</p></div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 bg-[#0b2545] pb-3.5 pt-1">
        <div className="rounded-lg bg-white p-1.5"><Qr value={url} size={72} /></div>
        <p className="font-mono text-[9px] tracking-wider text-sky-200">{b.bookingRef}</p>
      </div>
    </motion.div>
  );
};

export default WalletPassPreview;
