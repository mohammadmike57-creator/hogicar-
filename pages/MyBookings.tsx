
import * as React from 'react';
import { MOCK_CARS } from '../services/mockData';
import { Calendar, Tag, Car, Building, ArrowRight, Lock, Mail, Search, AlertCircle, CheckCircle, XCircle, Edit2, AlertTriangle, ChevronRight, Download, Printer, Phone, Plane, FileText, X, Star, LoaderCircle } from 'lucide-react';
import { Booking, Extra } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import ModifyBookingModal from '../components/ModifyBookingModal';
import { Link } from 'react-router-dom';
import { api } from '../api';

// --- SUB-COMPONENTS ---

// Re-using a customer-facing version of the voucher modal
const CustomerVoucherModal = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
    // In real app, we might need to fetch the car if it's not in mock
    const car = MOCK_CARS.find(c => c.id === booking.carId);
    // If not in mock, we might display fallback data or nothing. 
    // Ideally the Booking object should contain vehicle details from the API.
    
    const { convertPrice, getCurrencySymbol } = useCurrency();

    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:h-full print:rounded-none flex flex-col font-sans">
                {/* Header (Hidden in Print) */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 print:hidden sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600"/> Booking Voucher
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                {/* Printable Voucher Content */}
                <div className="p-10 print:p-0 flex-grow bg-white text-slate-900" id="voucher-content">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative">
                                    <Car className="h-6 w-6 text-[#003580]" />
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF9F1C] rounded-full border border-white"></div>
                                </div>
                                <span className="font-bold text-xl text-[#003580]">Hogi<span className="text-[#FF9F1C]">car</span></span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">Rental Voucher</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">Present this at the counter</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Reference</span>
                                <span className="font-mono text-xl font-bold text-slate-900">{booking.id}</span>
                            </div>
                            <div className={`inline-block px-3 py-1 rounded border text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                {booking.status}
                            </div>
                        </div>
                    </div>

                    {/* Driver & Flight Info */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Main Driver</h4>
                            <p className="text-lg font-bold text-slate-900">{booking.firstName} {booking.lastName}</p>
                            {booking.phone && (
                                <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-slate-400"/> {booking.phone}
                                </p>
                            )}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Flight Details</h4>
                            {booking.flightNumber ? (
                                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Plane className="w-4 h-4 text-slate-400"/> {booking.flightNumber}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Not provided</p>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Car className="w-4 h-4"/> Vehicle Information
                        </h4>
                        <div className="flex items-start gap-6">
                            {car && <img src={car.image} alt={car.make} className="w-40 h-28 object-contain bg-white rounded border border-slate-200 p-2" />}
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-slate-900">{car ? `${car.make} ${car.model}` : booking.carName}</h3>
                                {car && <p className="text-sm text-slate-500 mb-4">or similar {car.category} class</p>}
                                <div className="flex items-center gap-3">
                                    {car && <img src={car.supplier.logo} alt={car.supplier.name} className="h-6 w-auto object-contain" />}
                                    <span className="text-sm font-bold text-slate-700">Supplied by {booking.supplierName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Itinerary */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3 text-green-700">
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                <h4 className="text-sm font-bold uppercase tracking-wide">Pick-up</h4>
                            </div>
                            <p className="text-xl font-bold text-slate-900 mb-1">{booking.pickupDate}</p>
                            <p className="text-sm font-medium text-slate-700 mb-2">{booking.startTime || '10:00'}</p>
                            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">{booking.pickupCode}</p>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3 text-red-700">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                <h4 className="text-sm font-bold uppercase tracking-wide">Drop-off</h4>
                            </div>
                            <p className="text-xl font-bold text-slate-900 mb-1">{booking.dropoffDate}</p>
                            <p className="text-sm font-medium text-slate-700 mb-2">{booking.endTime || '10:00'}</p>
                            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">{booking.dropoffCode}</p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-slate-900 text-white rounded-lg p-6 flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400 print:text-slate-500">Payment Due at Desk</h4>
                            <p className="text-xs text-slate-500 mt-1 print:text-slate-400">Excludes security deposit.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-extrabold tracking-tight">{getCurrencySymbol()}{convertPrice(booking.payAtDesk).toFixed(2)}</span>
                            <span className="text-sm text-slate-400 ml-1">(Approx. ${booking.payAtDesk.toFixed(2)} USD)</span>
                        </div>
                    </div>
                </div>

                {/* Actions (Hidden in Print) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 print:hidden rounded-b-xl">
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-transform active:scale-95 flex items-center gap-2">
                        <Printer className="w-4 h-4"/> Print / PDF
                    </button>
                </div>
            </div>
        </div>
    )
}

const LoginScreen = ({ onLogin, error, isLoading }: { onLogin: (email: string, ref: string) => void, error: string, isLoading: boolean }) => {
    const [email, setEmail] = React.useState('');
    const [bookingRef, setBookingRef] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, bookingRef);
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-[#003580] p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">Manage your booking</h2>
                <p className="text-blue-100 text-sm">View, modify or cancel your reservation</p>
            </div>
            <div className="p-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                                placeholder="e.g. name@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Booking Reference Number</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={bookingRef}
                                onChange={e => setBookingRef(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase text-base"
                                placeholder="e.g. H1001"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Found in your confirmation email.</p>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-[#008009] hover:bg-[#006607] text-white font-bold py-3.5 rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <>Find My Booking <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Secure access via SSL encryption
                </p>
            </div>
        </div>
    )
}

const BookingDetailView = ({ booking, onCancel, onBookingModified, onBack }: { booking: Booking, onCancel: (id: string | number) => void, onBookingModified: (updatedBooking: Booking) => void, onBack: () => void }) => {
    // Attempt to find detailed car info from mock if available, otherwise fallback to basic info
    const car = MOCK_CARS.find(c => c.id === booking.carId) || {
        make: "Vehicle",
        model: booking.carName || "Rental",
        image: "https://placehold.co/600x400?text=Car+Image",
        category: "Standard",
        transmission: "Automatic",
        fuelPolicy: "Full to Full",
        airCon: true,
        location: booking.pickupCode || "Airport"
    } as any;

    const { convertPrice, getCurrencySymbol } = useCurrency();
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [showVoucher, setShowVoucher] = React.useState(false);
    // Note: Modify Logic would need significant backend support for real updates. Keeping mock for now or disabling if preferred.
    const [isModifyModalOpen, setIsModifyModalOpen] = React.useState(false);
    
    // For this demo, only allow modify if we have the car object fully
    const canModify = !!MOCK_CARS.find(c => c.id === booking.carId);

    const handleSaveModification = (modifications: Partial<Booking>) => {
        // This part would need a real API endpoint for update.
        alert("Modification feature requires full API implementation. Currently read-only for API bookings.");
        setIsModifyModalOpen(false);
    };

    const isPast = new Date(booking.dropoffDate) < new Date();
    const canCancel = !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    const isCancelled = booking.status === 'cancelled';
    const isCompleted = booking.status === 'completed';

    return (
        <div className="max-w-4xl mx-auto">
             {showVoucher && <CustomerVoucherModal booking={booking} onClose={() => setShowVoucher(false)} />}
             {canModify && isModifyModalOpen && <ModifyBookingModal booking={booking} car={car} isOpen={isModifyModalOpen} onClose={() => setIsModifyModalOpen(false)} onSave={handleSaveModification} />}
             
             <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                 <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Back to Search
             </button>

             <div className="flex flex-col lg:flex-row gap-8">
                 {/* Main Content */}
                 <div className="flex-grow space-y-6">
                     
                     {/* Header Status Card */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                         <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isCancelled ? 'bg-red-50' : (isCompleted ? 'bg-slate-50' : 'bg-white')}`}>
                             <div>
                                 <h1 className="text-2xl font-bold text-slate-900 mb-1">{isCancelled ? 'Booking Cancelled' : (isCompleted ? 'Booking Completed' : 'Booking Details')}</h1>
                                 <p className="text-sm text-slate-500">Reference: <span className="font-mono font-bold text-slate-700">{booking.bookingRef || booking.id}</span></p>
                             </div>
                             {isCancelled ? <XCircle className="w-10 h-10 text-red-500"/> : <CheckCircle className="w-10 h-10 text-green-500"/>}
                         </div>
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pick-up</h3>
                                 <div className="flex items-start gap-3">
                                     <div className="bg-blue-50 p-2 rounded text-blue-600"><Calendar className="w-5 h-5"/></div>
                                     <div>
                                         <p className="font-bold text-slate-900">{booking.pickupDate} @ {booking.startTime}</p>
                                         <p className="text-sm text-slate-600 mt-1">{booking.pickupCode}</p>
                                     </div>
                                 </div>
                             </div>
                             <div>
                                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Drop-off</h3>
                                 <div className="flex items-start gap-3">
                                     <div className="bg-blue-50 p-2 rounded text-blue-600"><Calendar className="w-5 h-5"/></div>
                                     <div>
                                         <p className="font-bold text-slate-900">{booking.dropoffDate} @ {booking.endTime}</p>
                                         <p className="text-sm text-slate-600 mt-1">{booking.dropoffCode}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* Vehicle Card */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                         <img src={car.image} alt={car.model} className="w-48 object-contain" />
                         <div className="flex-grow text-center sm:text-left">
                             <h3 className="text-xl font-bold text-slate-900">{car.make} {car.model}</h3>
                             <p className="text-sm text-slate-500 mb-4">or similar {car.category} class</p>
                             <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{car.transmission}</span>
                                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{car.fuelPolicy}</span>
                                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{car.airCon ? 'A/C' : 'No A/C'}</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="text-xs text-slate-500 mb-1">Total Cost</p>
                             <p className="text-xl font-extrabold text-slate-900">{getCurrencySymbol()}{convertPrice(booking.finalPrice).toFixed(2)}</p>
                              <p className="text-xs text-slate-400 mt-1">(Approx. ${booking.finalPrice.toFixed(2)} USD)</p>
                         </div>
                     </div>

                 </div>

                 {/* Sidebar Actions */}
                 <div className="lg:w-80 space-y-4">
                     
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                         <h3 className="font-bold text-slate-900 mb-4">Manage Booking</h3>
                         <div className="space-y-3">
                             {isCompleted && !booking.reviewSubmitted && (
                                <Link to={`/leave-review/${booking.id}`} className="w-full flex items-center justify-between p-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 transition-all group text-slate-900">
                                     <div className="flex items-center gap-3">
                                         <Star className="w-5 h-5"/>
                                         <div className="text-left">
                                             <span className="block font-bold text-sm">Leave a Review</span>
                                             <span className="block text-[10px]">Rate your experience</span>
                                         </div>
                                     </div>
                                     <ChevronRight className="w-4 h-4"/>
                                 </Link>
                             )}

                             <button onClick={() => setShowVoucher(true)} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                 <div className="flex items-center gap-3">
                                     <Download className="w-5 h-5 text-slate-400 group-hover:text-blue-600"/>
                                     <div className="text-left">
                                         <span className="block font-bold text-slate-700 text-sm group-hover:text-blue-700">Download Voucher</span>
                                         <span className="block text-[10px] text-slate-500">PDF Format</span>
                                     </div>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500"/>
                             </button>

                             {canModify && (
                                 <button onClick={() => setIsModifyModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                     <div className="flex items-center gap-3">
                                         <Edit2 className="w-5 h-5 text-slate-400 group-hover:text-blue-600"/>
                                         <div className="text-left">
                                             <span className="block font-bold text-slate-700 text-sm group-hover:text-blue-700">Modify Booking</span>
                                             <span className="block text-[10px] text-slate-500">Subject to availability</span>
                                         </div>
                                     </div>
                                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500"/>
                                 </button>
                             )}
                         </div>
                     </div>

                     {canCancel && (
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                             <h3 className="font-bold text-slate-900 mb-2">Need to cancel?</h3>
                             <p className="text-xs text-slate-500 mb-4">Free cancellation available until 48 hours before pick-up.</p>
                             
                             {!isCancelling ? (
                                <button onClick={() => setIsCancelling(true)} className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-2.5 rounded-lg text-sm transition-colors">
                                    Cancel Booking
                                </button>
                             ) : (
                                 <div className="bg-red-50 p-3 rounded-lg border border-red-100 animate-fadeIn">
                                     <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> Are you sure?</p>
                                     <div className="flex gap-2">
                                         <button onClick={() => setIsCancelling(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-1.5 rounded text-xs font-medium">Keep it</button>
                                         <button onClick={() => onCancel(booking.id)} className="flex-1 bg-red-600 text-white py-1.5 rounded text-xs font-bold hover:bg-red-700">Yes, Cancel</button>
                                     </div>
                                 </div>
                             )}
                         </div>
                     )}
                     
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <h4 className="font-bold text-blue-800 text-sm mb-1">Need Help?</h4>
                         <p className="text-xs text-blue-600 mb-2">Our agents are available 24/7.</p>
                         <p className="text-sm font-bold text-blue-900">+1 (555) 123-4567</p>
                     </div>

                 </div>
             </div>
        </div>
    )
}

const MyBookings: React.FC = () => {
  const [view, setView] = React.useState<'login' | 'dashboard'>('login');
  const [currentUserEmail, setCurrentUserEmail] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [userBookings, setUserBookings] = React.useState<Booking[]>([]);

  const handleLogin = async (email: string, ref: string) => {
      setIsLoading(true);
      setLoginError('');
      
      try {
          const normalizedEmail = email.toLowerCase().trim();
          const normalizedRef = ref.toUpperCase().trim();

          const booking = await api.lookupBooking(normalizedEmail, normalizedRef);
          
          setCurrentUserEmail(email);
          setUserBookings([booking]); // The API returns a single booking
          setView('dashboard');
      } catch (err: any) {
          console.error(err);
          setLoginError("Booking not found. Please check your reference number and email address.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleCancelBooking = async (bookingId: string | number) => {
      try {
          await api.cancelBooking(bookingId);
          // Update local state to reflect cancellation
          const updatedList = userBookings.map(b => 
              b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
          );
          setUserBookings(updatedList);
          alert("Booking cancelled successfully.");
      } catch (error) {
          alert("Failed to cancel booking. Please try again.");
          console.error(error);
      }
  };

  const handleBookingModified = (updatedBooking: Booking) => {
    setUserBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  };

  const handleLogout = () => {
      setView('login');
      setUserBookings([]);
      setCurrentUserEmail('');
  };

  return (
    <>
    <SEOMetadata
        title="Manage My Booking | Hogicar"
        description="View, modify, or cancel your car rental reservation securely."
        noIndex={true}
      />
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {view === 'login' ? (
            <LoginScreen onLogin={handleLogin} error={loginError} isLoading={isLoading} />
        ) : (
            <div>
                 {userBookings.length > 0 ? (
                     <BookingDetailView 
                        booking={userBookings[0]} 
                        onCancel={handleCancelBooking} 
                        onBookingModified={handleBookingModified}
                        onBack={handleLogout}
                     />
                 ) : (
                     <div className="text-center">
                         <h2 className="text-xl font-bold">No booking loaded</h2>
                         <button onClick={handleLogout} className="text-blue-600 underline mt-2">Go Back</button>
                     </div>
                 )}
            </div>
        )}
    </div>
    </>
  );
};

export default MyBookings;
