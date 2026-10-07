import * as React from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Printer from 'lucide-react/dist/esm/icons/printer';
import Download from 'lucide-react/dist/esm/icons/download';
import CalendarPlus from 'lucide-react/dist/esm/icons/calendar-plus';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import BellRing from 'lucide-react/dist/esm/icons/bell-ring';
import ScanLine from 'lucide-react/dist/esm/icons/scan-line';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import SEOMetadata from '../components/SEOMetadata';
import { api, API_BASE_URL } from '../api';
import { Logo } from '../components/Logo';
import RentalVoucher, { Qr } from '../components/RentalVoucher';
import WalletButtons from '../components/wallet/WalletButtons';
import WalletPassPreview from '../components/wallet/WalletPassPreview';

const at = (date?: string, time?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date || ''));
  if (!m) return NaN;
  const [h, mi] = String(time || '10:00').split(':').map(Number);
  return new Date(+m[1], +m[2] - 1, +m[3], isNaN(h) ? 10 : h, isNaN(mi) ? 0 : mi).getTime();
};

const icsStamp = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
};

const Voucher: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(Date.now());
  const [toast, setToast] = React.useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [walletAvailable, setWalletAvailable] = React.useState<boolean | null>(null);
  const toastTimer = React.useRef<number>();

  React.useEffect(() => {
    const bookingRef = searchParams.get('bookingRef');
    if (!bookingRef) { navigate('/'); return; }
    let alive = true;
    (async () => {
      try {
        const data = await api.getBookingByRef(bookingRef);
        if (alive) setBooking(data);
      } catch {
        if (alive) setError('We couldn’t find a voucher for this reference.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [searchParams, navigate]);

  React.useEffect(() => {
    document.body.classList.add('voucher-print');
    return () => document.body.classList.remove('voucher-print');
  }, []);

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const showToast = (text: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const onAvailability = React.useCallback((v: boolean) => setWalletAvailable(v), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="h-14 border-b border-slate-200 bg-white" />
        <div className="mx-auto mt-6 max-w-[900px] space-y-4 px-4">
          <div className="h-28 animate-pulse rounded-3xl bg-white" />
          <div className="h-[560px] animate-pulse rounded-[28px] bg-white" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100"><AlertCircle className="h-8 w-8" /></span>
        <h1 className="mt-5 text-2xl font-semibold text-slate-900">Voucher not found</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-600">{error || 'Please check your booking reference.'} You can also find it in Manage booking with your email.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/my-bookings" className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">Manage booking</Link>
          <Link to="/" className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</Link>
        </div>
      </div>
    );
  }

  const ref = booking.bookingRef;
  const status = String(booking.status || '').toUpperCase();
  const cancelled = /CANCEL|REJECT/.test(status);
  const start = at(booking.pickupDate, booking.startTime);
  const end = at(booking.dropoffDate, booking.endTime);
  const diff = start - now;
  const dd = Math.floor(diff / 86400000), hh = Math.floor((diff % 86400000) / 3600000), mm = Math.floor((diff % 3600000) / 60000);
  const phase = cancelled ? 'cancelled' : isNaN(start) ? 'unknown' : diff > 0 ? 'upcoming' : now < end ? 'active' : 'done';
  const firstName = booking.firstName ? String(booking.firstName).trim() : '';

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/${encodeURIComponent(ref)}/pdf`);
      if (!res.ok) { showToast('We couldn’t prepare the PDF. Please try again.', 'err'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Hogicar-Voucher-${ref}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('PDF voucher downloaded');
    } catch {
      showToast('Connection problem. Please try again.', 'err');
    } finally {
      setPdfBusy(false);
    }
  };

  const addToCalendar = () => {
    if (isNaN(start)) return;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hogicar//Voucher//EN', 'BEGIN:VEVENT',
      `UID:${ref}@hogicar.com`,
      `DTSTAMP:${icsStamp(Date.now())}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(isNaN(end) ? start + 3600000 : end)}`,
      `SUMMARY:Car rental pick-up · ${[booking.carMake, booking.carModel].filter(Boolean).join(' ')} (${ref})`,
      `LOCATION:${String(booking.pickupLocationName || '').replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:Booking ${ref} with ${booking.supplierName || 'your rental company'}. Voucher: ${window.location.href}`,
      'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:Car rental pick-up', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    a.download = `Hogicar-${ref}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    showToast('Calendar event downloaded');
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Hogicar voucher ${ref}`, text: `Car rental voucher ${ref}`, url }); } catch { /* dismissed */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); showToast('Voucher link copied'); }
    catch { showToast('Couldn’t copy the link', 'err'); }
  };

  const actions = [
    { key: 'pdf', label: pdfBusy ? 'Preparing…' : 'PDF', Icon: Download, onClick: downloadPdf, disabled: pdfBusy },
    { key: 'print', label: 'Print', Icon: Printer, onClick: () => window.print() },
    { key: 'cal', label: 'Calendar', Icon: CalendarPlus, onClick: addToCalendar, disabled: isNaN(start) },
    { key: 'share', label: 'Share', Icon: Share2, onClick: share },
  ];

  const phoneActions = [
    ...(cancelled ? [actions[1]] : [{ key: 'wallet', label: 'Wallet', Icon: Smartphone, onClick: () => document.getElementById('wallet')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), disabled: false }]),
    actions[0], actions[2], actions[3],
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-28 sm:pb-16 print:bg-white print:pb-0">
      <SEOMetadata title={`Rental voucher ${ref} | Hogicar`} noIndex />

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="Hogicar home" className="shrink-0"><Logo className="h-6 w-auto sm:h-7" /></Link>
          <div className="flex items-center gap-1.5">
            <Link to="/my-bookings" className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex"><Settings2 className="h-4 w-4" /> Manage</Link>
            {!cancelled && <a href="#wallet" onClick={e => { e.preventDefault(); document.getElementById('wallet')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="hidden h-9 items-center gap-1.5 rounded-lg bg-black px-3 text-sm font-semibold text-white hover:bg-slate-800 sm:inline-flex"><Smartphone className="h-4 w-4" /> Add to Wallet</a>}
            <button onClick={() => window.print()} className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"><Printer className="h-4 w-4" /> Print</button>
            <button onClick={downloadPdf} disabled={pdfBusy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-70">
              {pdfBusy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Download className="h-4 w-4" />} PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[900px] px-3 sm:px-4 print:hidden">
        {/* Greeting + countdown */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 px-1 pb-5 pt-6 sm:flex-row sm:items-end sm:justify-between sm:pt-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Booking {ref}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {phase === 'cancelled' ? 'This booking was cancelled' : phase === 'done' ? 'Thanks for driving with us' : phase === 'active' ? 'Enjoy the drive' : `You’re all set${firstName ? `, ${firstName}` : ''}`}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {phase === 'cancelled' ? 'This voucher is no longer valid at the rental desk.' : 'Show this voucher at the rental desk, printed or on your phone.'}
            </p>
          </div>
          {phase === 'upcoming' && (
            <div className="flex items-center gap-2 self-start rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 sm:self-auto">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
              <span className="text-xs font-medium text-slate-500">Pick-up in</span>
              {[{ v: dd, l: 'd' }, { v: hh, l: 'h' }, { v: mm, l: 'm' }].map(u => (
                <span key={u.l} className="rounded-lg bg-slate-900 px-2 py-1 font-mono text-sm font-semibold tabular-nums text-white">{String(u.v).padStart(2, '0')}<span className="ml-0.5 text-[10px] font-medium text-slate-400">{u.l}</span></span>
              ))}
            </div>
          )}
          {phase === 'cancelled' && <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200"><XCircle className="h-4 w-4" /> Cancelled</span>}
        </motion.section>

        {/* Wallet */}
        {!cancelled && walletAvailable !== false && (
          <motion.section
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            id="wallet"
            className="relative mb-5 scroll-mt-20 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200"
            aria-labelledby="wallet-title"
          >
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b2545] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"><Smartphone className="h-3 w-3" /> Digital wallet</span>
                <h2 id="wallet-title" className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Keep your voucher on your phone</h2>
                <p className="mt-1.5 max-w-md text-sm text-slate-600">Add it to your wallet and it’s one tap away at the desk, with the QR code ready to scan.</p>
                <ul className="mt-4 grid grid-cols-3 gap-2 text-[12px] leading-tight text-slate-700 sm:text-sm md:grid-cols-1 lg:grid-cols-3">
                  {[
                    { Icon: WifiOff, t: 'Works offline' },
                    { Icon: BellRing, t: 'No printing needed' },
                    { Icon: ScanLine, t: 'QR ready at the desk' },
                  ].map(x => <li key={x.t} className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0b2545]"><x.Icon className="h-3.5 w-3.5" /></span>{x.t}</li>)}
                </ul>
                <WalletButtons bookingRef={ref} status={booking.status} size="lg" className="mt-5 max-w-[520px]" onAvailability={onAvailability} />
              </div>
              <div className="hidden items-center gap-6 md:flex">
                <WalletPassPreview booking={booking} />
              </div>
            </div>
            <div className="relative hidden items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-7 py-3 text-xs text-slate-600 md:flex">
              <span className="rounded-md bg-white p-1 ring-1 ring-slate-200"><Qr value={window.location.href} size={44} /></span>
              <span><span className="font-semibold text-slate-800">On your computer?</span> Scan this with your phone’s camera to open the voucher and add it to your phone’s wallet.</span>
            </div>
          </motion.section>
        )}

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <RentalVoucher booking={booking} audience="customer" />
        </motion.div>

        {/* Quick actions */}
        <div className="mt-5 hidden grid-cols-4 gap-3 sm:grid">
          {actions.map(a => (
            <button key={a.key} onClick={a.onClick} disabled={a.disabled} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-accent hover:shadow-md disabled:opacity-60">
              <a.Icon className="h-4 w-4" /> {a.key === 'pdf' ? (pdfBusy ? 'Preparing…' : 'Download PDF') : a.key === 'cal' ? 'Add to calendar' : a.label}
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">Need to change something? <Link to="/my-bookings" className="font-semibold text-accent hover:underline">Manage your booking</Link></p>
      </main>

      {/* Print copy: printing shows only the voucher. */}
      {createPortal(<div className="voucher-print-root hidden"><RentalVoucher booking={booking} audience="customer" /></div>, document.body)}

      {/* Phone action bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl sm:hidden print:hidden" aria-label="Voucher actions">
        <div className="grid grid-cols-4">
          {phoneActions.map(a => (
            <button key={a.key} onClick={a.onClick} disabled={a.disabled} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-slate-600 active:bg-slate-100 disabled:opacity-50">
              <a.Icon className="h-5 w-5 text-slate-800" /> {a.label}
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            role="status"
            className={`fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-xl sm:bottom-8 ${toast.tone === 'err' ? 'bg-rose-600' : 'bg-slate-900'}`}
          >
            {toast.tone === 'err' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-emerald-400" />} {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Voucher;
