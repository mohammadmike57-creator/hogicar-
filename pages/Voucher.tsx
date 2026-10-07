import * as React from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, Printer, User, CreditCard, FileText, MapPin, 
  Calendar, Car, AlertCircle, LoaderCircle, Award, Phone, 
  Mail, Info, ShieldCheck, Clock, Map, ArrowRight, 
  ExternalLink, MessageSquare, Download, Zap, Share2, 
  ChevronRight, Smartphone, Moon, Sun, Globe, Shield
} from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import { api, getGoogleWalletUrl, API_BASE_URL } from '../api';
import { Logo } from '../components/Logo';
import WalletModal from '../components/WalletModal';
import RentalVoucher from '../components/RentalVoucher';

const Voucher: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getCurrencySymbol } = useCurrency();

  const [booking, setBooking] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [walletStatus, setWalletStatus] = React.useState({ appleWallet: false, googleWallet: false });

  React.useEffect(() => {
    const bookingRef = searchParams.get('bookingRef');
    if (!bookingRef) {
      navigate('/');
      return;
    }

    const loadVoucher = async () => {
      try {
        const data = await api.getBookingByRef(bookingRef);
        setBooking(data);
        
        // Load wallet status
        const statusRes = await fetch(`${API_BASE_URL}/api/vouchers/config-status`);
        if (statusRes.ok) {
          const status = await statusRes.json();
          setWalletStatus(status);
        }
      } catch (err: any) {
        console.error('Voucher load error:', err);
        setError('Voucher not found. Please verify your booking reference.');
      } finally {
        setLoading(false);
      }
    };

    loadVoucher();
  }, [searchParams, navigate]);

  React.useEffect(() => {
    document.body.classList.add('voucher-print');
    return () => document.body.classList.remove('voucher-print');
  }, []);

  React.useEffect(() => {
    if (!booking || !booking.pickupDate) return;

    const parseDate = (dateStr: string, timeStr: string) => {
      try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = (timeStr || '10:00').split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0).getTime();
      } catch (e) {
        return new Date(`${dateStr}T${timeStr || '10:00'}:00`).getTime();
      }
    };

    const targetDate = parseDate(booking.pickupDate, booking.startTime);

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        total: distance
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAppleWallet = async () => {
    showToast('Generating Apple Wallet pass...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/vouchers/${booking.bookingRef}/apple-wallet`);
      
      if (response.status === 404) {
        showToast('Booking not found.');
        return;
      }

      const text = await response.clone().text();
      
      if (text.includes('CERTIFICATES_NOT_CONFIGURED')) {
        showToast('Apple Wallet certificates not configured on server. Please check WALLET_INTEGRATION.md.');
        return;
      }

      if (!response.ok) {
        showToast('Apple Wallet service currently unavailable.');
        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HogiCar-${booking.bookingRef}.pkpass`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsWalletModalOpen(false);
      showToast('Wallet pass downloaded!');
    } catch (err) {
      showToast('Connection error generating Apple Wallet pass.');
    }
  };

  const handleGoogleWallet = async () => {
    try {
      showToast('Generating Google Wallet pass...');
      const response = await fetch(`${API_BASE_URL}/api/vouchers/${booking.bookingRef}/google-wallet-url`);
      
      if (response.status === 404) {
        showToast('Booking not found.');
        return;
      }

      if (!response.ok) {
        showToast('Google Wallet service unavailable.');
        return;
      }

      let url = await response.text();
      url = url.replace(/^"|"$/g, ''); 
      
      if (!url || url === '#' || url.includes('UNCONFIGURED') || url.includes('TODO') || url.length < 10) {
        showToast('Google Wallet is not configured on the server. Please check WALLET_INTEGRATION.md.');
        return;
      }

      window.open(url, '_blank');
      setIsWalletModalOpen(false);
    } catch (err) {
      showToast('Error connecting to Google Wallet service.');
    }
  };

  const handleDownloadPdf = async () => {
    showToast('Preparing PDF Voucher...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/vouchers/${booking.bookingRef}/pdf`);
      
      if (response.status === 404) {
        showToast('Booking not found.');
        return;
      }

      if (!response.ok) {
        // Try to get error message if it's not a PDF
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text')) {
           const errorMsg = await response.text();
           console.error('PDF generation error:', errorMsg);
        }
        showToast('Error generating PDF. Please try again later.');
        return;
      }
      
      const blob = await response.blob();
      if (blob.size < 500) { // PDF should be larger than this
         const text = await blob.text();
         console.warn('PDF response looks too small:', text);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HogiCar-Rental-Voucher-${booking.bookingRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF Voucher downloaded successfully.');
    } catch (err) {
      showToast('Connection error downloading PDF.');
    }
  };

  const handleCalendar = () => {
    const start = new Date(`${booking.pickupDate}T${booking.startTime}:00`);
    const end = new Date(`${booking.dropoffDate}T${booking.endTime}:00`);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:HogiCar Rental - ${booking.carMake} ${booking.carModel} (${booking.bookingRef})`,
      `LOCATION:${booking.pickupLocationName}`,
      `DESCRIPTION:Pickup your rental vehicle. Booking ref: ${booking.bookingRef}. Supplier: ${booking.supplierName}.`,
      'DTSTART:' + start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTEND:' + end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HogiCar-${booking.bookingRef}.ics`;
    link.click();
    showToast('Calendar event downloaded');
  };

  const handleShare = () => {
    const text = `My HogiCar rental voucher ${booking.bookingRef} for ${booking.carMake} ${booking.carModel} pickup ${booking.pickupDate}.`;
    if (navigator.share) {
      navigator.share({
        title: 'HogiCar Rental Voucher',
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied to clipboard');
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoaderCircle className="h-10 w-10 animate-spin text-[#F57C00]" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <AlertCircle className="mb-4 h-16 w-16 text-[#EF4444]" />
        <h1 className="text-2xl font-bold text-[#123C69]">{error || 'Booking Not Found'}</h1>
        <Link to="/" className="mt-6 rounded-xl bg-[#123C69] px-6 py-3 font-bold text-white hover:bg-[#1e293b]">
          Return Home
        </Link>
      </div>
    );
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Not Provided';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return 'Not Provided';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-32 print:bg-white print:pb-0">
      <SEOMetadata title={`Rental Voucher - ${booking.bookingRef} | HogiCar`} noIndex />

      {/* Header / Logo */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-4 py-3">
          <Link to="/" aria-label="Hogicar home"><Logo className="h-7 w-auto" /></Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-4 w-full max-w-[900px] px-3 sm:mt-6 sm:px-4">
        <RentalVoucher booking={booking} audience="customer" />
      </main>
      {/* Print copy: printing shows only the voucher. */}
      {createPortal(<div className="voucher-print-root hidden"><RentalVoucher booking={booking} audience="customer" /></div>, document.body)}

      <div className="fixed bottom-6 left-0 right-0 z-40 px-4 sm:px-6 print:hidden">
        <div className="mx-auto max-w-lg rounded-3xl bg-white/80 p-3 shadow-2xl backdrop-blur-xl dark:bg-[#1e293b]/80 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#123C69] py-3 text-sm font-bold text-white transition-transform active:scale-95 hover:bg-[#1e293b]"
            >
              <Smartphone className="h-4 w-4" />
              Add to Wallet
            </button>
            <div className="flex gap-2">
              <ActionButton icon={<Calendar />} onClick={handleCalendar} title="Calendar" />
              <ActionButton icon={<Share2 />} onClick={handleShare} title="Share" />
              <ActionButton icon={<Printer />} onClick={handleDownloadPdf} title="PDF" />
            </div>
          </div>
        </div>
      </div>

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onAppleWallet={handleAppleWallet}
        onGoogleWallet={handleGoogleWallet}
        walletStatus={walletStatus}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#123C69] px-6 py-2 text-sm font-bold text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
};

const SpecItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 font-bold text-slate-900 dark:text-white">{value || 'N/A'}</p>
  </div>
);

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-1 backdrop-blur-md min-w-[32px] border border-white/5">
    <span className="text-xs font-black text-white leading-none">{String(value).padStart(2, '0')}</span>
    <span className="mt-0.5 text-[6px] font-black uppercase tracking-tighter text-slate-400 leading-none">{label}</span>
  </div>
);

const SummaryCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex flex-col items-center justify-center rounded-xl bg-white p-2.5 text-center shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800 border border-slate-50">
    <div className="mb-1.5 text-[#F57C00]">
      {React.cloneElement(icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
    </div>
    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-0.5 text-[9px] font-bold text-[#123C69] dark:text-white truncate w-full">{value || 'N/A'}</p>
  </div>
);

const ActionButton = ({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) => (
  <button 
    onClick={onClick}
    title={title}
    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#123C69] transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
  >
    {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
  </button>
);

export default Voucher;
