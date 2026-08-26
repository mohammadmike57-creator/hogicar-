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
  const [countdown, setCountdown] = React.useState('');
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

    const targetDate = new Date(
      `${booking.pickupDate}T${booking.startTime || '10:00'}:00`
    ).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown('Picked Up / Ready');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

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
      if (!response.ok) {
        if (response.status === 503) {
          showToast('Apple Wallet is not configured on the server.');
        } else {
          showToast('Error generating Apple Wallet pass.');
        }
        return;
      }
      
      const blob = await response.blob();
      if (blob.size === 0 || (await blob.text()) === 'CERTIFICATES_NOT_CONFIGURED') {
        showToast('Apple Wallet certificates not configured.');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HogiCar-${booking.bookingRef}.pkpass`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsWalletModalOpen(false);
    } catch (err) {
      showToast('Connection error generating Apple Wallet pass.');
    }
  };

  const handleGoogleWallet = async () => {
    try {
      showToast('Generating Google Wallet pass...');
      const response = await fetch(`${API_BASE_URL}/api/vouchers/${booking.bookingRef}/google-wallet-url`);
      if (!response.ok) {
        showToast('Error generating Google Wallet pass.');
        return;
      }
      let url = await response.text();
      url = url.replace(/^"|"$/g, ''); // Remove wrapping quotes if returned as JSON string
      
      if (!url || url === '#' || url.includes('UNCONFIGURED') || url.includes('TODO')) {
        showToast('Google Wallet is not configured on the server.');
        return;
      }

      window.open(url, '_blank');
      setIsWalletModalOpen(false);
    } catch (err) {
      showToast('Error generating Google Wallet pass');
    }
  };

  const handleDownloadPdf = async () => {
    showToast('Preparing PDF Voucher...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/vouchers/${booking.bookingRef}/pdf`);
      if (!response.ok) {
        showToast('Error generating PDF Voucher.');
        return;
      }
      
      const blob = await response.blob();
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

      <main className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#123C69] p-8 text-white shadow-2xl sm:p-12">
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#22C55E] backdrop-blur-sm">
                <CheckCircle className="h-3 w-3" />
                Confirmed
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                {booking.carMake} <span className="text-[#F57C00]">{booking.carModel}</span>
              </h1>
              <p className="mt-4 text-lg font-medium text-slate-300">
                Booking Reference: <span className="font-mono text-white tracking-tighter">{booking.bookingRef}</span>
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pickup in</p>
                  <p className="mt-1 text-xl font-bold text-white">{countdown}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier</p>
                  <p className="mt-1 text-xl font-bold text-white">{booking.supplierName}</p>
                </div>
              </div>
            </div>
            {booking.carImage && (
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[#F57C00]/20 blur-3xl"></div>
                <img 
                  src={booking.carImage} 
                  alt={booking.carMake} 
                  className="relative h-auto w-full max-w-md drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                />
              </div>
            )}
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F57C00]/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section className="group rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:shadow-md dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">01 / Vehicle</span>
                  <h3 className="text-2xl font-black text-[#123C69] dark:text-white">Rental Specifications</h3>
                </div>
                <Car className="h-8 w-8 text-[#F57C00]" />
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <SpecItem label="Category" value={booking.carCategory} />
                <SpecItem label="Transmission" value={booking.carTransmission} />
                <SpecItem label="Fuel Policy" value={booking.carFuelPolicy} />
                <SpecItem label="A/C" value={booking.carAirConditioning ? 'Included' : 'Not Included'} />
                <SpecItem label="Passengers" value={`${booking.carPassengers} Seats`} />
                <SpecItem label="Doors" value={`${booking.carDoors} Doors`} />
                <SpecItem label="Luggage" value={`${booking.carBags} Large Bags`} />
                <SpecItem label="Mileage" value="Unlimited" />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">02 / Pickup</span>
                  <h3 className="text-2xl font-black text-[#123C69] dark:text-white">Collection Details</h3>
                </div>
                <MapPin className="h-8 w-8 text-[#F57C00]" />
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/50">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{booking.pickupLocationName}</h4>
                  <div className="mt-4 flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p>
                        <p className="font-bold dark:text-white">{formatDisplayDate(booking.pickupDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</p>
                        <p className="font-bold dark:text-white">{formatDisplayTime(booking.startTime)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl border border-dashed border-slate-200 p-6 dark:border-slate-700">
                  <Info className="mt-1 h-5 w-5 text-[#123C69] dark:text-[#F57C00]" />
                  <div>
                    <p className="text-sm font-bold dark:text-white">Pickup Instructions</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Please proceed to the {booking.supplierName} counter. Ensure you have your driver's license, passport, and a credit card in the main driver's name.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">03 / Return</span>
                  <h3 className="text-2xl font-black text-[#123C69] dark:text-white">Drop-off Details</h3>
                </div>
                <ArrowRight className="h-8 w-8 text-[#F57C00]" />
              </div>
              <div className="rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/50">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{booking.dropoffLocationName}</h4>
                <div className="mt-4 flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p>
                      <p className="font-bold dark:text-white">{formatDisplayDate(booking.dropoffDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</p>
                      <p className="font-bold dark:text-white">{formatDisplayTime(booking.endTime)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="flex flex-col items-center rounded-[2rem] bg-white p-8 text-center shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <div className="mb-6 rounded-2xl bg-slate-50 p-4 dark:bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} 
                  alt="Voucher QR Code"
                  className="h-40 w-40"
                />
              </div>
              <h4 className="text-lg font-black text-[#123C69] dark:text-white">Scan to Check-in</h4>
            </section>

            <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">04 / Supplier</span>
              <h4 className="mt-1 text-xl font-black text-[#123C69] dark:text-white">{booking.supplierName}</h4>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="mt-0.5 h-4 w-4 text-[#F57C00]" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmation #</p>
                    <p className="font-bold dark:text-white">{booking.supplierConfirmationNumber || 'Awaiting Confirmation'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#f8fafc] p-8 dark:bg-slate-900/50 dark:border dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">05 / Payment</span>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-300">Total Paid</span>
                  <span className="text-sm font-black text-[#22C55E]">{getCurrencySymbol(booking.currency)} {booking.finalPrice?.toFixed(2) || '0.00'}</span>
                </div>
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
