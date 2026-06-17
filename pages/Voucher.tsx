
import * as React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Booking, Car } from '../types';
import { 
  CheckCircle, Printer, User, CreditCard, FileText, 
  MapPin, Calendar, Car as CarIcon, AlertCircle, 
  LoaderCircle, Award, Zap, Phone, Mail, Info,
  ChevronRight, ShieldCheck, Clock
} from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import { Logo } from '../components/Logo';
import { api } from '../api';

const Voucher: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getCurrencySymbol, selectedCurrency } = useCurrency();
  
  const [booking, setBooking] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderCircle className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">{error || "Booking Not Found"}</h1>
        <Link to="/" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Return Home</Link>
      </div>
    );
  }

  const renderPrice = (amount: number) => {
    const safeAmount = amount || 0;
    return `${booking.currency} ${safeAmount.toFixed(2)}`;
  };

  return (
    <div className="bg-slate-100 min-h-screen py-4 sm:py-10 print:bg-white print:py-0">
      <SEOMetadata 
        title={`Rental Voucher - ${booking.bookingRef}`} 
        description="Official Rental Voucher for Hogicar" 
        noIndex={true} 
      />
      
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none">
        {/* Header */}
        <div className="bg-[#0f172a] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-200">
          <Logo className="h-10 w-auto" variant="light" />
          <div className="flex flex-col items-center sm:items-end gap-3">
            <div className="text-center sm:text-right">
              <h1 className="text-white text-xl font-black uppercase tracking-widest print:text-slate-900">Official Rental Voucher</h1>
              <p className="text-blue-300 text-sm font-bold print:text-slate-500">Reference: {booking.bookingRef}</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all print:hidden"
            >
              <Printer className="w-4 h-4" /> Download PDF / Print
            </button>
          </div>
        </div>

        {/* Confirmation Banner */}
        <div className="bg-emerald-600 p-4 flex items-center justify-center gap-3 text-white print:bg-white print:text-emerald-700 print:border-b">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-black uppercase tracking-wider">Confirmed & Secured</span>
        </div>

        <div className="p-6 sm:p-10">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Customer & Supplier */}
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="w-3 h-3" /> Main Driver
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-lg font-black text-slate-800 uppercase">{booking.firstName} {booking.lastName}</p>
                  <p className="text-sm text-slate-500 mt-1">{booking.email}</p>
                  <p className="text-sm text-slate-500">{booking.phone}</p>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Award className="w-3 h-3" /> Rental Provider
                </h3>
                <div className="flex items-center gap-4">
                  {booking.supplierLogoUrl && (
                    <img src={booking.supplierLogoUrl} alt={booking.supplierName} className="h-10 w-auto object-contain" />
                  )}
                  <div>
                    <p className="font-black text-slate-800 uppercase">{booking.supplierName}</p>
                    <div className="mt-1 inline-block bg-emerald-50 text-emerald-700 text-xs font-black px-2 py-1 rounded border border-emerald-100">
                      CONFIRMATION #: {booking.supplierConfirmationNumber || 'PENDING'}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Column 2: Vehicle */}
            <div className="md:col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CarIcon className="w-32 h-32" />
               </div>
               
               <div className="relative z-10">
                 <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="w-full sm:w-48 h-32 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shrink-0">
                      <img 
                        src={booking.carImage || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle'} 
                        alt={`${booking.carMake} ${booking.carModel}`} 
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('placehold.co')) {
                            target.src = 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle';
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className="bg-blue-600 text-white text-xs font-black px-2 py-1 rounded uppercase tracking-tighter inline-block mb-1">
                        {booking.carCategory || 'Standard Class'}
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase">
                        {booking.carMake} {booking.carModel}
                      </h2>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">
                        or similar &bull; {booking.carTransmission} &bull; {booking.carFuelPolicy}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-bold text-slate-600">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-500" /> {booking.carPassengers} seats</span>
                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-500" /> {booking.carBags} bags</span>
                        <span className="flex items-center gap-1.5 font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">SIPP: {booking.carSippCode}</span>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

          </div>

          {/* Itinerary Section (Modern Style) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                  {/* Pickup */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className="flex flex-col items-start">
                      <span className="text-2xl font-black text-slate-950 mb-1">{booking.startTime || '10:00'}</span>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black text-[#003580] tracking-tight">{booking.pickupCode}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{booking.pickupLocationName?.split(',')[0]}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{booking.pickupDate}</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-[1.5] w-full flex flex-col items-center justify-center py-2 md:py-0">
                    <div className="relative w-full flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative z-10 bg-white px-4 flex flex-col items-center">
                        <div className="bg-slate-50 p-1.5 rounded-full border border-slate-100 shadow-sm mb-1">
                          <CarIcon className="w-4 h-4 text-[#008009] rotate-90 md:rotate-0" />
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white px-2">
                           Rental Journey
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drop-off */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className="flex flex-col items-end text-right">
                      <span className="text-2xl font-black text-slate-950 mb-1">{booking.endTime || '10:00'}</span>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{booking.dropoffLocationName?.split(',')[0] || booking.pickupLocationName?.split(',')[0]}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-lg font-black text-[#003580] tracking-tight">{booking.dropoffCode || booking.pickupCode}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{booking.dropoffDate}</span>
                    </div>
                  </div>
                </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Pick-up Location
                </h3>
                <p className="text-sm font-black text-slate-700 uppercase leading-relaxed">{booking.pickupLocationName || booking.pickupCode}</p>
                <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Representative will be waiting at the arrivals terminal.
                </p>
             </div>
             <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Drop-off Location
                </h3>
                <p className="text-sm font-black text-slate-700 uppercase leading-relaxed">{booking.dropoffLocationName || booking.dropoffCode}</p>
             </div>
          </div>

          {/* Payment & Footer */}
          <div className="mt-12 flex flex-col md:flex-row gap-8 items-start">
             <div className="flex-1 w-full space-y-6">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Terms & Pickup Requirements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                    <div className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Original Driving License (min. 1 year held)</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Passport or National ID card</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                      <CreditCard className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Credit Card in Driver's Name for Deposit</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                      <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Digital or Printed Copy of this Voucher</span>
                    </div>
                  </div>
                </section>
             </div>

             <div className="w-full md:w-80 bg-[#0f172a] rounded-2xl p-6 text-white shadow-xl print:text-slate-900 print:bg-white print:border print:shadow-none">
                <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-6 border-b border-white/10 pb-2 print:text-slate-500 print:border-slate-200">Financial Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-200/60 print:text-slate-500">PAID ONLINE</span>
                    <span className="font-mono font-bold text-emerald-400 print:text-emerald-700">{renderPrice(booking.payNow)}</span>
                  </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200/60 print:text-slate-500 uppercase">Pay at desk (Net Rate)</span>
                  <span className="font-mono font-bold">{renderPrice(booking.payAtDesk || booking.netPrice)}</span>
                </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center print:border-slate-200">
                    <span className="text-xs font-black tracking-widest uppercase">Total Price</span>
                    <span className="text-2xl font-black">{renderPrice(booking.finalPrice)}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-[9px] text-blue-200/40 text-center uppercase tracking-tighter print:text-slate-400">
                  Prices include all mandatory taxes & local fees.
                </div>
             </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100">
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-[#008009]" /> Hogicar Quality Guarantee
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed uppercase tracking-tighter">
                   This rental voucher is a legal agreement between the customer and the rental provider. Hogicar ensures all providers adhere to our strict quality standards. Please ensure you have all required documentation listed above to avoid delays at the rental desk. Safe travels!
                </p>
             </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-center gap-4 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#008009] hover:bg-[#006607] text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs">
            <Printer className="w-5 h-5"/> Print Voucher
          </button>
          <Link to="/" className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-3 px-8 rounded-xl transition-all uppercase tracking-widest text-xs">
            Return to Site
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] print:hidden">
         Hogicar.com &bull; Support: support@hogicar.com &bull; Amman, Jordan
      </div>
    </div>
  );
};

export default Voucher;
