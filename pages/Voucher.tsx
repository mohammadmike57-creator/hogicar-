import * as React from 'react';
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
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0f172a]' : 'bg-[#F8FAFC]'} pb-24 transition-colors duration-300`}>
      <SEOMetadata title={`Rental Voucher - ${booking.bookingRef} | HogiCar`} noIndex />

      {/* Header / Logo */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md dark:bg-[#1e293b]/80 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo className="h-8 w-auto" variant={isDarkMode ? 'light' : 'dark'} />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button 
              onClick={handleDownloadPdf}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-[#123C69] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e293b]"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-2 w-full max-w-5xl px-3 sm:px-4">
        {/* Hero Section - Even More Compact & Zoomed Out */}
        <section className="relative overflow-hidden rounded-[1.25rem] bg-[#123C69] p-4 text-white shadow-xl sm:p-6">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#22C55E] backdrop-blur-sm">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Confirmed
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-300 backdrop-blur-sm">
                  {booking.bookingRef}
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
                {booking.carMake} <span className="text-[#F57C00]">{booking.carModel}</span>
              </h1>
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                Official Rental Voucher • {booking.supplierName}
              </p>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 p-1 pr-3 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="flex gap-0.5">
                    <TimeUnit value={countdown.days} label="d" />
                    <TimeUnit value={countdown.hours} label="h" />
                    <TimeUnit value={countdown.minutes} label="m" />
                    <TimeUnit value={countdown.seconds} label="s" />
                  </div>
                  <div className="ml-1">
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 leading-none">Pickup In</p>
                    <p className="mt-0.5 text-[8px] font-bold text-white/80">Countdown</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-md border border-white/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse"></div>
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 leading-none">Status</p>
                    <p className="mt-0.5 text-[10px] font-black text-white uppercase tracking-tight">Confirmed</p>
                  </div>
                </div>
              </div>
            </div>

            {booking.carImage && (
              <div className="relative md:w-1/3 lg:w-1/2 flex justify-center">
                <div className="absolute inset-0 rounded-full bg-[#F57C00]/10 blur-[80px]"></div>
                <img 
                  src={booking.carImage} 
                  alt={booking.carMake} 
                  className="relative h-auto w-full max-w-[280px] sm:max-w-[340px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F57C00]/5 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        </section>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-8 space-y-4">
            {/* Quick Summary Grid - New for "Zoomed Out" feel */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard icon={<Car />} label="Class" value={booking.carCategory} />
              <SummaryCard icon={<Zap />} label="Transmission" value={booking.carTransmission} />
              <SummaryCard icon={<Globe />} label="Fuel" value={booking.carFuelPolicy} />
              <SummaryCard icon={<Shield />} label="Insurance" value="Included" />
            </div>

            <section className="rounded-[1rem] bg-white p-4 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <MapPin className="h-3.5 w-3.5 text-[#F57C00]" />
                </div>
                <h3 className="text-base font-black text-[#123C69] dark:text-white">Trip Itinerary</h3>
              </div>
              
              <div className="relative space-y-0">
                {/* Pickup */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-4 w-4 rounded-full border-2 border-[#F57C00] bg-white dark:bg-[#1e293b]"></div>
                    <div className="h-full w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <div className="pb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#F57C00]">Pickup Location</p>
                    <h4 className="text-base font-bold dark:text-white">{booking.pickupLocationName}</h4>
                    <div className="mt-2 flex gap-4">
                      <div className="text-xs text-slate-500 font-medium">
                        {formatDisplayDate(booking.pickupDate)} • {formatDisplayTime(booking.startTime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-4 w-4 rounded-full border-2 border-slate-300 bg-white dark:bg-[#1e293b]"></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Return Location</p>
                    <h4 className="text-base font-bold dark:text-white">{booking.dropoffLocationName}</h4>
                    <div className="mt-2 text-xs text-slate-500 font-medium">
                      {formatDisplayDate(booking.dropoffDate)} • {formatDisplayTime(booking.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[1rem] bg-white p-4 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-black text-[#123C69] dark:text-white">Vehicle Details</h3>
                <Car className="h-4 w-4 text-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
                <SpecItem label="Passengers" value={`${booking.carPassengers} Seats`} />
                <SpecItem label="Luggage" value={`${booking.carBags} Bags`} />
                <SpecItem label="Doors" value={`${booking.carDoors} Doors`} />
                <SpecItem label="Air Con" value={booking.carAirConditioning ? 'Yes' : 'No'} />
              </div>
            </section>
          </div>

          {/* Right Column - QR & Quick Info */}
          <div className="lg:col-span-4 space-y-4">
            <section className="flex flex-col items-center rounded-[1.25rem] bg-white p-4 text-center shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-3 rounded-lg bg-slate-50 p-2.5 dark:bg-white transition-transform hover:scale-105">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} 
                  alt="Voucher QR Code"
                  className="h-28 w-28"
                />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scan at Counter</p>
              <h4 className="mt-0.5 text-xs font-bold text-[#123C69] dark:text-white">Fast-Track Pickup</h4>
            </section>

            <section className="rounded-[1rem] bg-white p-4 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <h4 className="text-xs font-black text-[#123C69] dark:text-white uppercase tracking-tight">Supplier Contact</h4>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/50">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Provider</p>
                  <p className="text-xs font-bold dark:text-white">{booking.supplierName}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/50">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Contact Support</p>
                  <p className="text-xs font-bold dark:text-white">booking@hogicar.com</p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.25rem] bg-[#123C69]/5 p-5 dark:bg-[#123C69]/20 border border-[#123C69]/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#123C69] dark:text-slate-300">Total Paid</span>
                <span className="text-base font-black text-[#22C55E]">
                  {getCurrencySymbol(booking.currency)} {booking.finalPrice?.toFixed(2) || '0.00'}
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-40 px-4 sm:px-6">
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
  <div className="flex flex-col items-center rounded-xl bg-white/10 px-2.5 py-1.5 backdrop-blur-md min-w-[40px] border border-white/5">
    <span className="text-sm font-black text-white leading-none">{String(value).padStart(2, '0')}</span>
    <span className="mt-0.5 text-[8px] font-black uppercase tracking-tighter text-slate-400 leading-none">{label}</span>
  </div>
);

const SummaryCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
    <div className="mb-2 text-[#F57C00]">
      {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
    </div>
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-0.5 text-[10px] font-bold text-[#123C69] dark:text-white truncate w-full">{value || 'N/A'}</p>
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
