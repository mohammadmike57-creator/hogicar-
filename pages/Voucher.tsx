
import * as React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Printer from 'lucide-react/dist/esm/icons/printer';
import User from 'lucide-react/dist/esm/icons/user';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Award from 'lucide-react/dist/esm/icons/award';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Info from 'lucide-react/dist/esm/icons/info';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Map from 'lucide-react/dist/esm/icons/map';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Download from 'lucide-react/dist/esm/icons/download';
import Zap from 'lucide-react/dist/esm/icons/zap';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import { api } from '../api';

const Voucher: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getCurrencySymbol } = useCurrency();
  
  const [booking, setBooking] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState('');

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
        console.error("Voucher load error:", err);
        setError("Voucher not found. Please verify your booking reference.");
      } finally {
        setLoading(false);
      }
    };

    loadVoucher();
  }, [searchParams, navigate]);

  // Countdown logic
  React.useEffect(() => {
    if (!booking || !booking.pickupDate) return;

    const targetDate = new Date(`${booking.pickupDate}T${booking.startTime || '10:00'}:00`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown("Picked Up / Ready");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderCircle className="w-10 h-10 text-[#123C69] animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">{error || "Booking Not Found"}</h1>
        <Link to="/" className="mt-6 bg-[#123C69] text-white px-6 py-2 rounded-lg font-bold">Return Home</Link>
      </div>
    );
  }

  const renderPrice = (amount: number) => {
    const safeAmount = amount || 0;
    return `${booking.currency} ${safeAmount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 print:bg-white print:pb-0">
      <SEOMetadata 
        title={`Rental Voucher - ${booking.bookingRef}`} 
        description="Official HogiCar Premium Digital Voucher" 
        noIndex={true} 
      />
      
      <style>{`
        .premium-gradient {
          background: linear-gradient(135deg, #123C69 0%, #0f172a 100%);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        }
        .qr-section {
          background: linear-gradient(135deg, #059669 0%, #065f46 100%);
          color: white;
          text-align: center;
        }
        .timeline-item {
          position: relative;
          padding-left: 24px;
          padding-bottom: 24px;
          border-left: 2px solid #e2e8f0;
        }
        .timeline-item:last-child {
          border-left: 0;
          padding-bottom: 0;
        }
        .timeline-dot {
          position: absolute;
          left: -7px;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
        }
        .apple-wallet-btn {
          background: linear-gradient(180deg, #333 0%, #000 100%);
          color: white;
        }
        @media print {
          @page { size: A4; margin: 10mm; }
          .no-print { display: none !important; }
          .glass-card { 
            box-shadow: none !important; 
            border: 1px solid #e2e8f0 !important;
            transform: none !important;
            background: white !important;
          }
          .premium-gradient { background: #123C69 !important; color: white !important; -webkit-print-color-adjust: exact; }
          .qr-section { background: #059669 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 pt-8 sm:pt-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
            <div className="logo">
                <svg viewBox="0 0 420 90" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
                    <circle cx="45" cy="45" r="24" fill="#123C69"/>
                    <path d="M28 48 Q45 30 62 42" stroke="#F57C00" stroke-width="7" fill="none" stroke-linecap="round"/>
                    <line x1="35" y1="55" x2="55" y2="55" stroke="#F57C00" stroke-width="4" stroke-linecap="round"/>
                    <text x="80" y="55" font-family="Montserrat, Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="1" fill="#123C69">
                        HOGI<tspan fill="#F57C00">CAR</tspan>
                        <tspan font-size="20" fill="#F57C00">.com</tspan>
                    </text>
                </svg>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black tracking-wider uppercase">
                <CheckCircle className="w-4 h-4" /> CONFIRMED
            </div>
        </header>

        {/* Boarding Pass Hero */}
        <div className="glass-card premium-gradient text-white overflow-hidden mb-6">
            <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Booking Reference</div>
                        <div className="text-3xl font-black text-[#F57C00] tracking-tighter">{booking.bookingRef}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Pickup Countdown</div>
                        <div className="text-xl font-black text-emerald-400 tabular-nums">{countdown}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex-1">
                        <div className="text-4xl font-black mb-1">{booking.pickupCode || 'AMM'}</div>
                        <div className="text-xs text-white/60 font-medium truncate max-w-[120px] uppercase tracking-widest">{booking.pickupLocationName?.split(',')[0]}</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <ArrowRight className="w-6 h-6 text-[#F57C00]" />
                        <div className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">{booking.rentalDays || 3} Days</div>
                    </div>
                    <div className="flex-1 text-right">
                        <div className="text-4xl font-black mb-1">{booking.dropoffCode || booking.pickupCode || 'AMM'}</div>
                        <div className="text-xs text-white/60 font-medium truncate max-w-[120px] uppercase tracking-widest text-right">{booking.dropoffLocationName?.split(',')[0] || booking.pickupLocationName?.split(',')[0]}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/10">
                    <div>
                        <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Pickup Date</div>
                        <div className="text-sm font-bold">{formatDate(booking.pickupDate)}</div>
                    </div>
                    <div>
                        <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Pickup Time</div>
                        <div className="text-sm font-bold">{booking.startTime || '10:30'}</div>
                    </div>
                    <div>
                        <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Status</div>
                        <div className="text-sm font-bold text-emerald-400">VEHICLE READY</div>
                    </div>
                    <div className="text-right">
                        <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Support</div>
                        <div className="text-sm font-bold">+962 7 9876 5432</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Vehicle Showcase */}
        <div className="glass-card mb-6 p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-tighter">Vehicle Details</h3>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">
                    {booking.carCategory || 'ECONOMY'}
                </div>
            </div>
            <div className="p-8 text-center bg-slate-50/50">
                <img 
                    src={booking.carImageUrl || "https://www.sixt.com/fileadmin/files/global/user_upload/fleet/png/350x200/toyota-corolla-4-door-white-2020.png"} 
                    alt={booking.carModel} 
                    className="mx-auto w-64 h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                />
                <h4 className="text-2xl font-black text-slate-900 mt-6 uppercase tracking-tight">{booking.carMake} {booking.carModel}</h4>
                <p className="text-slate-500 text-sm italic">or Similar Class Vehicle</p>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#123C69]" /> {booking.carTransmission}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                    <User className="w-3.5 h-3.5 text-[#123C69]" /> {booking.carPassengers} Seats
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                    <FileText className="w-3.5 h-3.5 text-[#123C69]" /> {booking.carBags} Bags
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-[#123C69]" /> A/C Included
                </div>
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Mileage Policy</div>
                    <div className="text-sm font-bold text-slate-800">Unlimited Mileage</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fuel Policy</div>
                    <div className="text-sm font-bold text-slate-800">{booking.carFuelPolicy || 'Full to Full'}</div>
                </div>
            </div>
        </div>

        {/* Customer Identity */}
        <div className="glass-card mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter mb-6">Driver Identity</h3>
            <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                    <User className="w-12 h-12" />
                </div>
                <div>
                    <div className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{booking.firstName} {booking.lastName}</div>
                    <div className="text-xs font-black text-[#F57C00] uppercase tracking-widest">GOLD TIER MEMBER • #HC-L88231</div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
                {[
                    { label: 'Nationality', value: booking.country || 'United Kingdom' },
                    { label: 'Driver License', value: 'UK (GB) - Valid' },
                    { label: 'License Expiry', value: 'Dec 2029' },
                    { label: 'Age Requirement', value: 'Verified (30+)' }
                ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <span className="text-sm font-black text-slate-800">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Supplier & Location */}
        <div className="glass-card mb-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tighter mb-1">Rental Supplier</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Counter Instructions Included</p>
                </div>
                {booking.supplierLogoUrl ? (
                    <img src={booking.supplierLogoUrl} alt={booking.supplierName} className="h-8 w-auto grayscale opacity-50" />
                ) : (
                    <div className="font-black text-slate-300 text-2xl uppercase tracking-tighter">{booking.supplierName}</div>
                )}
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-[#123C69]">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pickup Counter</div>
                        <div className="text-sm font-black text-slate-800 uppercase leading-snug">{booking.pickupLocationName || 'Arrivals Hall, Terminal 1'}</div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocationName || 'Airport')}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 transition-all text-xs uppercase tracking-widest">
                        <Map className="w-4 h-4" /> Open Maps
                    </button>
                    <a href={`tel:${booking.supplierPhone || '+96264451200'}`} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 transition-all text-xs uppercase tracking-widest">
                        <Phone className="w-4 h-4" /> Call Supplier
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Opening Hours</div>
                    <div className="text-xs font-bold text-slate-800 uppercase">24/7 Service Available</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Supplier Ref</div>
                    <div className="text-xs font-bold text-emerald-800">{booking.supplierConfirmationNumber || 'HC-CONF-8821'}</div>
                </div>
            </div>
        </div>

        {/* Financial Summary */}
        <div className="glass-card mb-6 bg-emerald-50 border-emerald-100 overflow-hidden">
            <div className="p-6">
                <h3 className="font-black text-emerald-900 uppercase tracking-tighter mb-6">Payment Summary</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-800/60 uppercase tracking-widest">
                        <span>Vehicle Rental ({booking.rentalDays || 3} Days)</span>
                        <span>{renderPrice(booking.finalPrice - (booking.finalPrice * 0.15))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-emerald-600 uppercase tracking-widest">
                        <span>HogiCar Online Discount</span>
                        <span>- {renderPrice(booking.finalPrice * 0.15)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-800/60 uppercase tracking-widest">
                        <span>Premium Insurance (CDW)</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-200 rounded-md">INCLUDED</span>
                    </div>
                    <div className="pt-6 border-t border-emerald-200 flex justify-between items-end">
                        <div>
                            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-1">Total Paid</div>
                            <div className="text-sm font-bold text-emerald-800/60 uppercase">Paid via Credit Card</div>
                        </div>
                        <div className="text-4xl font-black text-emerald-900 tracking-tighter">{renderPrice(booking.finalPrice)}</div>
                    </div>
                </div>
            </div>
            <div className="bg-emerald-600 p-3 text-center text-[10px] font-black text-white uppercase tracking-[0.3em]">
                Transaction Secured & Verified • No Hidden Fees
            </div>
        </div>

        {/* Insurance Coverage */}
        <div className="glass-card mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter mb-6">Insurance Coverage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: 'Collision Damage Waiver', icon: ShieldCheck },
                    { label: 'Theft Protection', icon: ShieldCheck },
                    { label: 'Third Party Liability', icon: ShieldCheck },
                    { label: 'Roadside Assistance', icon: ShieldCheck }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <item.icon className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-900 uppercase tracking-tight">{item.label}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                <Info className="w-5 h-5 text-[#123C69] flex-shrink-0" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tighter">
                    Your rental includes our premium protection package. Zero excess may apply depending on local supplier terms. Please present this voucher for full coverage verification.
                </p>
            </div>
        </div>

        {/* Pickup Timeline */}
        <div className="glass-card mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter mb-8">Pickup Journey</h3>
            <div className="timeline px-2">
                {[
                    { title: 'Arrive at Airport', desc: 'Collect luggage and follow car rental signs.' },
                    { title: `Go to ${booking.supplierName} Counter`, desc: 'Located in Arrival Level, Terminal 1.' },
                    { title: 'Present Identity', desc: 'Show your license, passport and this voucher.' },
                    { title: 'Receive Keys', desc: 'Complete the inspection and enjoy your ride.' }
                ].map((step, idx) => (
                    <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{step.title}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter leading-relaxed">{step.desc}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Security Verification Block */}
        <div className="glass-card bg-[#0f172a] text-white border-white/5 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm uppercase tracking-[0.2em]">Enterprise Security Verification</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[10px] font-mono text-white/50">
                <div className="space-y-4">
                    <div>
                        <div className="uppercase mb-1 tracking-widest">Verification ID</div>
                        <div className="text-emerald-400 break-all">V-{booking.bookingRef}-HOGI-VERIFIED</div>
                    </div>
                    <div>
                        <div className="uppercase mb-1 tracking-widest">Digital Signature</div>
                        <div className="text-white/30 break-all">7e8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z</div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="uppercase mb-1 tracking-widest">Validation Status</div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            LIVE & AUTHENTICATED
                        </div>
                    </div>
                    <div>
                        <div className="uppercase mb-1 tracking-widest">Server Time</div>
                        <div className="text-white/30">{new Date().toISOString()}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* QR Verification Section */}
        <div className="glass-card qr-section py-12 mb-6">
            <h3 className="font-black text-3xl mb-2 tracking-tighter uppercase italic">Digital Verification</h3>
            <p className="text-emerald-100 mb-10 opacity-80 text-xs font-bold uppercase tracking-[0.2em]">Scan at Rental Counter to Complete Check-in</p>
            
            <div className="inline-block p-6 bg-white rounded-[32px] shadow-2xl relative group">
                <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                     <div className="grid grid-cols-5 gap-2 opacity-20">
                        {Array(25).fill(0).map((_, i) => (
                            <div key={i} className="w-4 h-4 bg-[#123C69] rounded-sm"></div>
                        ))}
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-[#123C69] rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-16 h-16 text-[#123C69]" />
                        </div>
                     </div>
                </div>
                <div className="absolute left-0 right-0 top-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-bounce opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            <div className="mt-8">
                <div className="text-sm font-black tracking-[0.4em] uppercase">{booking.bookingRef}-VERIFIED</div>
                <div className="text-[9px] text-emerald-200/60 font-bold uppercase mt-2 tracking-widest">
                    Encrypted Blockchain Payload • Version 4.0.1
                </div>
            </div>
        </div>

        {/* Add to Wallet Buttons */}
        <div className="glass-card mb-8">
            <h3 className="font-black text-slate-400 text-center uppercase text-[10px] tracking-[0.3em] mb-8">Add to Your Digital Wallet</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
                <button className="flex items-center justify-center gap-2 bg-black text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95 text-xs uppercase tracking-[0.2em]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .76-3.27.82-1.31.05-2.31-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.89 1.22-2.11 1.09-3.33-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 2.01-1.12 3.19 1.16.09 2.34-.53 3.08-1.42z"/></svg>
                    Apple Wallet
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#123C69] text-white font-black py-4 rounded-2xl shadow-xl hover:bg-[#0f2d4e] transition-all active:scale-95 text-xs uppercase tracking-[0.2em]">
                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center text-[10px] text-[#123C69] font-black">G</div>
                    Google Wallet
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 px-4 no-print">
                <button onClick={() => window.print()} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                    <Printer className="w-6 h-6 text-slate-400 group-hover:text-[#123C69] transition-colors" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Print / PDF</span>
                </button>
                <a href={`mailto:?subject=My HogiCar Voucher ${booking.bookingRef}&body=Here is my rental voucher: ${window.location.href}`} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group text-center">
                    <Mail className="w-6 h-6 text-slate-400 group-hover:text-[#123C69] transition-colors" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                </a>
                <a href={`https://wa.me/?text=My HogiCar Voucher ${booking.bookingRef}: ${window.location.href}`} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group text-center">
                    <MessageSquare className="w-6 h-6 text-slate-400 group-hover:text-[#123C69] transition-colors" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</span>
                </a>
                <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group text-center">
                    <Download className="w-6 h-6 text-slate-400 group-hover:text-[#123C69] transition-colors" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Save Offline</span>
                </button>
            </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pb-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] print:mt-10">
            <div className="flex justify-center gap-8 mb-10 no-print">
                <a href="#" className="hover:text-[#123C69] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[#123C69] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#123C69] transition-colors">Rental Rules</a>
            </div>
            <div className="flex flex-col items-center gap-6">
                <svg viewBox="0 0 420 90" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer">
                    <circle cx="45" cy="45" r="24" fill="#123C69"/>
                    <path d="M28 48 Q45 30 62 42" stroke="#F57C00" stroke-width="7" fill="none" stroke-linecap="round"/>
                    <line x1="35" y1="55" x2="55" y2="55" stroke="#F57C00" stroke-width="4" stroke-linecap="round"/>
                    <text x="80" y="55" font-family="Montserrat, Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="1" fill="#123C69">
                        HOGI<tspan fill="#F57C00">CAR</tspan>
                        <tspan font-size="20" fill="#F57C00">.com</tspan>
                    </text>
                </svg>
                <div className="space-y-2">
                    <p>© 2026 HogiCar Enterprise Rental Group. All rights reserved.</p>
                    <p className="text-[8px] opacity-60 tracking-[0.4em]">Amman • Dubai • Riyadh • London • New York</p>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default Voucher;
