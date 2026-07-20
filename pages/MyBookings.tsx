
import * as React from 'react';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Car from 'lucide-react/dist/esm/icons/car';
import Building from 'lucide-react/dist/esm/icons/building';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Search from 'lucide-react/dist/esm/icons/search';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Download from 'lucide-react/dist/esm/icons/download';
import Printer from 'lucide-react/dist/esm/icons/printer';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Plane from 'lucide-react/dist/esm/icons/plane';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Wind from 'lucide-react/dist/esm/icons/wind';
import { Booking, Extra } from '../types';
import { DetailedRatingsTooltip } from '../components/DetailedRatingsTooltip';
import { getRatingDescription, getRatingColor, getRatingTextColor } from '../utils/ratings';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import ModifyBookingModal from '../components/ModifyBookingModal';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Logo } from '../components/Logo';
import { loadCars } from '../utils/loadCars';

// --- SUB-COMPONENTS ---

const LoginScreen = ({ onLogin, error, isLoading }: { onLogin: (email: string, ref: string) => void, error: string, isLoading: boolean }) => {
    const [email, setEmail] = React.useState('');
    const [bookingRef, setBookingRef] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, bookingRef);
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-card shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-[#003580] p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">Manage your booking</h2>
                <p className="text-blue-100 text-sm">View, modify or cancel your reservation</p>
            </div>
            <div className="p-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-card text-sm flex items-center gap-2">
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
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-card focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-base"
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
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-card focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all uppercase text-base"
                                placeholder="e.g. H1001"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Found in your confirmation email.</p>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-accent hover:bg-accent-700 text-white font-bold py-3.5 rounded-card shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
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

const MOCK_CARS: any[] = [];

const BookingDetailView = ({ booking, onCancel, onBookingModified, onBack }: { booking: Booking, onCancel: (id: string | number) => void, onBookingModified: (updatedBooking: Booking) => void, onBack: () => void }) => {
    // Attempt to find detailed car info from mock if available, otherwise fallback to basic info
    const car = MOCK_CARS.find(c => c.id === booking.carId) || {
        make: booking.carMake || "Vehicle",
        model: booking.carModel || booking.carName || "Rental",
        image: booking.carImage || "https://placehold.co/600x400?text=Car+Image",
        category: booking.carCategory || "Standard",
        transmission: booking.carTransmission || "Automatic",
        fuelPolicy: booking.carFuelPolicy || "Full to Full",
        airCon: booking.carAirConditioning ?? true,
        location: booking.pickupCode || "Airport"
    } as any;

    const { convertPrice, getCurrencySymbol, selectedCurrency } = useCurrency();
    const [imageError, setImageError] = React.useState(false);
    const displayImage = imageError ? 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle' : (booking.carImage || 'https://placehold.co/400x250/64748b/ffffff?text=Vehicle');
    const [isCancelling, setIsCancelling] = React.useState(false);
    const renderPrice = (amount: number) => {
        const safeAmount = amount || 0;
        if (booking.currency === selectedCurrency) {
            return `${getCurrencySymbol()}${convertPrice(safeAmount).toFixed(2)}`;
        }
        return `${booking.currency} ${safeAmount.toFixed(2)}`;
    };
    const [isModifyModalOpen, setIsModifyModalOpen] = React.useState(false);
    const [fullCar, setFullCar] = React.useState<any>(null);
    const [isFetchingCar, setIsFetchingCar] = React.useState(false);

    const isPast = new Date(booking.dropoffDate) < new Date();
    const canCancel = !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    const canModify = !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    const isCancelled = booking.status === 'cancelled';
    const isCompleted = booking.status === 'completed';

    const handleModifyClick = async () => {
        setIsFetchingCar(true);
        try {
            const searchResults = await loadCars({
                pickupCode: booking.pickupCode || "AMM",
                dropoffCode: booking.dropoffCode || "AMM",
                pickupDate: booking.pickupDate || "",
                dropoffDate: booking.dropoffDate || ""
            });
            const found = searchResults.find(c => String(c.id).replace('choice-', '') === String(booking.carId));
            if (found) {
                setFullCar(found);
                setIsModifyModalOpen(true);
            } else {
                // FALLBACK: Use car info from booking if search doesn't return it
                setFullCar(car);
                setIsModifyModalOpen(true);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to load vehicle details for modification.");
        } finally {
            setIsFetchingCar(false);
        }
    };

    const handleSaveModification = async (modifications: any) => {
        try {
            const result = await api.requestModification(Number(booking.id), {
                pickupDate: modifications.startDate,
                dropoffDate: modifications.endDate,
                startTime: modifications.startTime,
                endTime: modifications.endTime,
                phone: modifications.customerPhone,
                flightNumber: modifications.flightNumber
            });

            if (result.clientSecret) {
                alert(`Extra payment of ${result.modificationExtraCharge} ${booking.currency} is required. For this demo, we will confirm it automatically.`);
                await api.confirmModification(Number(booking.id));
            } else {
                await api.confirmModification(Number(booking.id));
            }

            const updated = await api.getBooking(Number(booking.id));
            onBookingModified(updated);
            setIsModifyModalOpen(false);
            alert("Booking updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to update booking. Please try again.");
        }
    };


    return (
        <div className="max-w-4xl mx-auto">
             {fullCar && isModifyModalOpen && <ModifyBookingModal booking={booking} car={fullCar} isOpen={isModifyModalOpen} onClose={() => setIsModifyModalOpen(false)} onSave={handleSaveModification} />}
             
             <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-[#007ac2] transition-colors">
                 <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Back to Search
             </button>

             <div className="flex flex-col lg:flex-row gap-8">
                 {/* Main Content */}
                 <div className="flex-grow space-y-6">
                     
                     {/* Header Status Card */}
                     <div className="bg-white rounded-card shadow-sm border border-slate-200 overflow-hidden">
                        <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isCancelled ? 'bg-red-50' : (isCompleted ? 'bg-slate-50' : 'bg-white')}`}>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">{isCancelled ? 'Booking Cancelled' : (isCompleted ? 'Booking Completed' : 'Booking Details')}</h1>
                                <p className="text-sm text-slate-500">Reference: <span className="font-mono font-bold text-slate-700">{booking.bookingRef || booking.id}</span></p>
                            </div>
                            {isCancelled ? <XCircle className="w-10 h-10 text-red-500"/> : <CheckCircle className="w-10 h-10 text-green-500"/>}
                        </div>
                        {isCompleted && !booking.reviewSubmitted && (
                            <div className="p-6 bg-yellow-50 border-b border-yellow-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-200">
                                        <Star className="w-6 h-6 text-white fill-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">How was your trip?</h3>
                                        <p className="text-sm text-slate-600">Share your feedback and help others choose the right car.</p>
                                    </div>
                                </div>
                                <Link to={`/leave-review/${booking.id}`} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-card hover:bg-slate-800 transition-all shadow-md active:scale-95 text-sm whitespace-nowrap">
                                    Rate Now
                                </Link>
                            </div>
                        )}
                        <div className="p-6 grid grid-cols-2 gap-6">
                             <div>
                                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pick-up</h3>
                                 <div className="flex items-start gap-3">
                                     <div className="bg-blue-50 p-2 rounded text-[#007ac2]"><Calendar className="w-5 h-5"/></div>
                                     <div>
                                         <p className="font-bold text-slate-900">{booking.pickupDate} @ {booking.startTime}</p>
                                         <p className="text-sm text-slate-600 mt-1">{booking.pickupCode}</p>
                                     </div>
                                 </div>
                             </div>
                             <div>
                                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Drop-off</h3>
                                 <div className="flex items-start gap-3">
                                     <div className="bg-blue-50 p-2 rounded text-[#007ac2]"><Calendar className="w-5 h-5"/></div>
                                     <div>
                                         <p className="font-bold text-slate-900">{booking.dropoffDate} @ {booking.endTime}</p>
                                         <p className="text-sm text-slate-600 mt-1">{booking.dropoffCode}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* Vehicle Card */}
                     <div className="bg-white rounded-card shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                         <img 
                            src={displayImage} 
                            alt={car.model} 
                            onError={() => setImageError(true)}
                            referrerPolicy="no-referrer"
                            loading="eager"
                            className="w-48 object-contain"
                         />
                         <div className="flex-grow text-center sm:text-left">
                             <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                 <h3 className="text-xl font-bold text-slate-900">{car.make} {car.model}</h3>
                                 {(!booking.bookingMode || booking.bookingMode === 'FREE_SALE') && (
                                     <div className="flex items-center gap-1 bg-emerald-50 text-[#007ac2] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border border-emerald-100 shadow-sm">
                                         <Zap className="w-2.5 h-2.5 fill-[#007ac2]/20" />
                                         Instant
                                     </div>
                                 )}
                             </div>
                             <p className="text-sm text-slate-500 mb-4">or similar {car.category} class</p>
                             <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{car.transmission}</span>
                                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{car.fuelPolicy}</span>
                                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{car.airCon ? 'A/C' : 'No A/C'}</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="text-xs text-slate-500 mb-1">Total Cost</p>
                             <p className="text-xl font-extrabold text-slate-900">{renderPrice(booking.finalPrice)}</p>
                              {booking.currency === 'USD' ? null : <p className="text-xs text-slate-400 mt-1">(Approx. ${(booking.finalPrice || 0).toFixed(2)} USD)</p>}
                         </div>
                     </div>

                 </div>

                 {/* Sidebar Actions */}
                 <div className="lg:w-80 space-y-4">
                     
                     <div className="bg-white rounded-card shadow-sm border border-slate-200 p-5">
                         <h3 className="font-bold text-slate-900 mb-4">Manage Booking</h3>
                         <div className="space-y-3">
                             {isCompleted && !booking.reviewSubmitted && (
                                <Link to={`/leave-review/${booking.id}`} className="w-full flex items-center justify-between p-3 rounded-card bg-yellow-400 hover:bg-yellow-500 transition-all group text-slate-900">
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

                             <Link 
                                 to={`/voucher?bookingRef=${booking.bookingRef || booking.id}`}
                                 className="w-full flex items-center justify-between p-3 rounded-card border border-slate-200 hover:border-accent hover:bg-accent-50 transition-all group"
                             >
                                 <div className="flex items-center gap-3">
                                     <FileText className="w-5 h-5 text-slate-400 group-hover:text-accent"/>
                                     <div className="text-left">
                                         <span className="block font-bold text-slate-700 text-sm group-hover:text-accent">Digital Voucher</span>
                                         <span className="block text-[10px] text-slate-500">Official Confirmation</span>
                                     </div>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent"/>
                             </Link>
 
                             {canModify && (
                                <button 
                                    onClick={handleModifyClick}
                                    disabled={isFetchingCar}
                                    className="w-full flex items-center justify-between p-3 rounded-card border border-slate-200 hover:border-accent hover:bg-accent-50 transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {isFetchingCar ? (
                                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Edit2 className="w-5 h-5 text-slate-400 group-hover:text-accent"/>
                                        )}
                                        <div className="text-left">
                                            <span className="block font-bold text-slate-700 text-sm group-hover:text-accent">Modify Booking</span>
                                            <span className="block text-[10px] text-slate-500">Dates, flight, or phone</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent"/>
                                </button>
                            )}
                         </div>
                     </div>

                     {canCancel && (
                         <div className="bg-white rounded-card shadow-sm border border-slate-200 p-5">
                             <h3 className="font-bold text-slate-900 mb-2">Need to cancel?</h3>
                             <p className="text-xs text-slate-500 mb-4">Free cancellation available until 48 hours before pick-up.</p>
                             
                             {!isCancelling ? (
                                <button onClick={() => setIsCancelling(true)} className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-2.5 rounded-card text-sm transition-colors">
                                    Cancel Booking
                                </button>
                             ) : (
                                 <div className="bg-red-50 p-3 rounded-card border border-red-100 animate-fadeIn">
                                     <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> Are you sure?</p>
                                     <div className="flex gap-2">
                                         <button onClick={() => setIsCancelling(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-1.5 rounded text-xs font-medium">Keep it</button>
                                         <button onClick={() => onCancel(booking.id)} className="flex-1 bg-red-600 text-white py-1.5 rounded text-xs font-bold hover:bg-red-700">Yes, Cancel</button>
                                     </div>
                                 </div>
                             )}
                         </div>
                     )}
                     
                     <div className="bg-accent-50 p-4 rounded-card border border-accent-100">
                         <h4 className="font-bold text-accent-800 text-sm mb-1">Need Help?</h4>
                         <p className="text-xs text-accent-600 mb-2">Our agents are available 24/7.</p>
                         <p className="text-sm font-bold text-accent-900">+1 (555) 123-4567</p>
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
                         <button onClick={handleLogout} className="text-accent underline mt-2">Go Back</button>
                     </div>
                 )}
            </div>
        )}
    </div>
    </>
  );
};

export default MyBookings;
