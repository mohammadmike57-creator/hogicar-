
import * as React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Booking, Car as CarType } from '../types';
import { Car, CheckCircle, AlertTriangle, FileText, Calendar, User, Hash, Send, LoaderCircle, XCircle, Printer } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';
import { Logo } from '../components/Logo';

const SupplierConfirmation: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const location = useLocation();
    
    // Parse query params for token and action
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const action = queryParams.get('action');
    const shouldAutoPrint = queryParams.get('print') === '1';

    const [booking, setBooking] = React.useState<Booking | null>(null);
    const [confirmationNumber, setConfirmationNumber] = React.useState('');
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [isRejected, setIsRejected] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        const loadData = async () => {
            if (!bookingId && !token) {
                setError('No booking ID or token provided');
                setIsLoading(false);
                return;
            }

            try {
                let fetchedBooking: any;
                if (token) {
                    fetchedBooking = await api.getBookingByToken(token);
                } else if (bookingId) {
                    fetchedBooking = await api.getBookingByRef(bookingId);
                }
                
                setBooking(fetchedBooking);
                
                if (fetchedBooking.status === 'confirmed' || fetchedBooking.status === 'CONFIRMED') {
                    setIsConfirmed(true);
                    setConfirmationNumber(fetchedBooking.supplierConfirmationNumber || 'N/A');
                } else if (fetchedBooking.status === 'cancelled' || fetchedBooking.status === 'CANCELLED') {
                    setIsRejected(true);
                }
            } catch (err: any) {
                console.error("Failed to load booking:", err);
                setError('Booking not found or could not be loaded.');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [bookingId, token]);

    React.useEffect(() => {
        if (!isLoading && booking && shouldAutoPrint) {
            const timer = window.setTimeout(() => window.print(), 650);
            return () => window.clearTimeout(timer);
        }
    }, [isLoading, booking, shouldAutoPrint]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationNumber.trim()) {
            setError('Please enter a confirmation number.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            if (token) {
                await api.confirmBookingByToken(token, confirmationNumber);
            } else if (bookingId) {
                await api.supplierConfirm(bookingId, confirmationNumber);
            }
            setIsConfirmed(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Could not confirm booking. It may have been cancelled or already confirmed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Token is required to decline a booking via this page.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.rejectBookingByToken(token, rejectionReason || 'Declined by supplier');
            setIsRejected(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Could not decline booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-slate-100 flex justify-center items-center"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600"/></div>;
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-slate-800">Error</h1>
                <p className="text-slate-500">{error}</p>
                <Link to="/" className="mt-6 text-sm text-blue-600 hover:underline">Return to Hogicar Home</Link>
            </div>
        );
    }
    
    // Fallback for car visual
    const displayCar = {
        make: booking?.carMake || "Vehicle",
        model: booking?.carModel || "Rental",
        category: booking?.carCategory || "Standard",
        sippCode: booking?.carSippCode || "????",
        transmission: booking?.carTransmission || "Automatic"
    } as any;

    if (!booking) return null;

    const isRejectAction = action === 'reject';

    return (
        <div className="supplier-print-page min-h-screen bg-slate-100 font-sans print:bg-white">
            <SEOMetadata title="Confirm Booking Request" description="Supplier confirmation page for Hogicar rental request." noIndex={true} />
            <style>{`
                @media print {
                    @page { size: A4; margin: 7mm; }
                    html, body, #root { background: #ffffff !important; }
                    body * { visibility: hidden; }
                    .supplier-print-area, .supplier-print-area * { visibility: visible; }
                    .supplier-print-area {
                        position: absolute !important;
                        inset: 0 auto auto 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        overflow: hidden !important;
                    }
                    .supplier-print-hide { display: none !important; }
                    .supplier-print-body { padding: 4mm !important; }
                    .supplier-print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 4mm !important; }
                    .supplier-print-card { padding: 3mm !important; border-radius: 5px !important; }
                    .supplier-print-area h1 { font-size: 15pt !important; }
                    .supplier-print-area h2 { font-size: 13pt !important; }
                    .supplier-print-area h3 { font-size: 7.5pt !important; margin-bottom: 2mm !important; }
                    .supplier-print-area p, .supplier-print-area span, .supplier-print-area strong, .supplier-print-area div { line-height: 1.25 !important; }
                    .supplier-print-area .supplier-print-car-image { height: 24mm !important; }
                    .supplier-print-area .supplier-print-status { display: block !important; padding: 3mm !important; margin-top: 3mm !important; }
                }
            `}</style>
            
            <header className="supplier-print-hide bg-white shadow-sm print:hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="h-12 w-auto" variant="dark" />
                        <span className="text-slate-400 font-light text-xl mx-2">|</span>
                        <span className="text-sm font-semibold text-slate-500">Supplier Dashboard</span>
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </header>
            
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:px-0">
                <div className="supplier-print-area bg-white rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:rounded-none">
                    <div className="supplier-print-hide p-8 border-b border-slate-100 print:hidden">
                        <h1 className="text-2xl font-bold text-slate-800">Rental Request Voucher</h1>
                        <p className="text-sm text-slate-500 mt-1">Please review the details below and take action to finalize this booking.</p>
                    </div>

                    {/* Print-only Header */}
                    <div className="hidden print:flex items-center justify-between border-b-2 border-slate-200 p-4 mb-2">
                        <Logo className="h-12 w-auto" variant="dark" />
                        <div className="text-right">
                            <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">Supplier Reservation</h1>
                            <p className="text-slate-500 font-bold text-sm">Reference: {booking.bookingRef}</p>
                            <div className="mt-2 inline-block bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                {isConfirmed ? 'CONFIRMED' : (isRejected ? 'CANCELLED' : 'ACTION REQUIRED')}
                            </div>
                        </div>
                    </div>

                    <div className="supplier-print-body p-8 supplier-print-grid grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Booking Details */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Booking Details</h3>
                                <div className="supplier-print-card bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                                    <p className="flex justify-between"><span>Hogicar Reference:</span> <strong className="font-mono">{booking.bookingRef || booking.id}</strong></p>
                                    <p className="flex justify-between"><span>Customer Name:</span> <strong>{booking.firstName} {booking.lastName}</strong></p>
                                    <p className="flex justify-between"><span>Customer Email:</span> <strong>{booking.email}</strong></p>
                                    <p className="flex justify-between"><span>Customer Phone:</span> <strong>{booking.phone}</strong></p>
                                </div>
                            </div>
                            {/* Rental Itinerary (Modern Style) */}
                            <div className="supplier-print-card md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4">
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
                                            <div className="relative z-10 bg-white px-4 flex flex-col items-center text-center">
                                                <div className="bg-slate-50 p-1.5 rounded-full border border-slate-100 shadow-sm mb-1">
                                                    <Hash className="w-4 h-4 text-[#008009]" />
                                                </div>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white px-2">
                                                    Reservation Request
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
                        </div>

                        {/* Right Column: Car Details & Price */}
                        <div className="space-y-6">
                            <div className="supplier-print-card bg-slate-50 p-6 rounded-lg border border-slate-200">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehicle Specifications</h3>
                                <div className="flex flex-col sm:flex-row gap-6 items-center mb-4">
                                    <div className="flex-grow">
                                        <p className="text-lg font-black text-slate-900 uppercase">{displayCar.make} {displayCar.model}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{displayCar.category} or similar</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-y-2 mt-2 border-t border-slate-100 pt-3">
                                        <p className="flex flex-col"><span className="text-[10px] text-slate-400 uppercase">SIPP Code</span> <span className="font-mono font-bold text-blue-600 uppercase">{displayCar.sippCode}</span></p>
                                        <p className="flex flex-col"><span className="text-[10px] text-slate-400 uppercase">Transmission</span> <span className="font-bold">{displayCar.transmission}</span></p>
                                        <p className="flex flex-col"><span className="text-[10px] text-slate-400 uppercase">Category</span> <span className="font-bold">{displayCar.category}</span></p>
                                        <p className="flex flex-col"><span className="text-[10px] text-slate-400 uppercase">Fuel Policy</span> <span className="font-bold">{booking.carFuelPolicy || 'N/A'}</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="supplier-print-card bg-blue-50 p-6 rounded-lg border border-blue-100">
                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Financial Breakdown</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="flex justify-between"><span>Supplier Net Rate:</span> <strong className="text-lg text-blue-700">{booking.currency} {booking.netPrice?.toFixed(2)}</strong></p>
                                    <p className="text-[10px] text-blue-400 italic">This is the amount you will receive for this rental.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isConfirmed ? (
                        <div className="supplier-print-status p-8 bg-green-50 border-t border-green-200 rounded-b-xl">
                            <div className="text-center mb-6">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h2 className="text-xl font-bold text-green-800">Booking Confirmed!</h2>
                                <p className="text-sm text-green-700 mt-2">
                                    The customer has been notified and sent the updated voucher.
                                </p>
                            </div>
                            
                            {(!booking.supplierConfirmationNumber || booking.supplierConfirmationNumber === 'PENDING' || booking.supplierConfirmationNumber === 'N/A') && (
                                <div className="supplier-print-hide max-w-md mx-auto bg-white p-6 rounded-xl border border-green-200 shadow-sm print:hidden">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 text-center uppercase tracking-wider">Provide Your Confirmation Number</h3>
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={confirmationNumber === 'N/A' ? '' : confirmationNumber}
                                                onChange={e => setConfirmationNumber(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                                placeholder="Your System ID"
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                        >
                                            {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                            Update Confirmation #
                                        </button>
                                        {error && <p className="text-red-600 text-center text-xs">{error}</p>}
                                    </form>
                                </div>
                            )}
                            
                            {(booking.supplierConfirmationNumber && booking.supplierConfirmationNumber !== 'PENDING' && booking.supplierConfirmationNumber !== 'N/A') && (
                                <div className="text-center">
                                    <p className="text-sm text-green-700">
                                        Supplier Confirmation Number: 
                                        <strong className="font-mono bg-green-100 p-1 rounded ml-1 text-lg">{booking.supplierConfirmationNumber}</strong>
                                    </p>
                                    <button 
                                        onClick={() => window.print()} 
                                        className="supplier-print-hide mt-6 flex items-center gap-2 mx-auto bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all print:hidden"
                                    >
                                        <Printer className="w-4 h-4" /> Print Updated Voucher
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : isRejected ? (
                        <div className="supplier-print-status p-8 bg-red-50 border-t border-red-200 rounded-b-xl text-center">
                            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-red-800">Booking Declined</h2>
                            <p className="text-sm text-red-700 mt-2">
                                This booking request has been declined. The customer has been notified.
                            </p>
                        </div>
                    ) : (
                        <div className="supplier-print-hide p-8 bg-slate-50 border-t border-slate-200 rounded-b-xl print:hidden">
                            {isRejectAction ? (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-red-900 mb-2">Decline Booking Request</h2>
                                    <p className="text-sm text-slate-600">Are you sure you want to decline this booking? This action cannot be undone.</p>
                                    <form onSubmit={handleReject} className="flex flex-col gap-4">
                                        <div>
                                            <label htmlFor="reason" className="block text-sm font-bold text-slate-700 mb-2">Reason for Declining</label>
                                            <textarea
                                                id="reason"
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm"
                                                placeholder="Please explain why this request is being declined (e.g., Vehicle out of stock, maintenance issue)"
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        {error && <p className="text-red-600 text-xs">{error}</p>}
                                        <div className="flex gap-4">
                                            <button 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <XCircle className="w-5 h-5"/>}
                                                Decline Booking
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const url = new URL(window.location.href);
                                                    url.searchParams.delete('action');
                                                    window.history.pushState({}, '', url.toString());
                                                    window.location.reload();
                                                }}
                                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-8 rounded-lg transition-all"
                                            >
                                                Back to Confirm
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-lg font-bold text-blue-900 mb-4">Action Required</h2>
                                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
                                        <div className="flex-grow w-full">
                                            <label htmlFor="confirmationNumber" className="block text-sm font-bold text-slate-700 mb-2">Your Confirmation Number</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    id="confirmationNumber"
                                                    type="text"
                                                    value={confirmationNumber}
                                                    onChange={e => setConfirmationNumber(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                                                    placeholder="Enter your system's ID"
                                                    required
                                                />
                                            </div>
                                            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                            <button 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-50"
                                            >
                                                {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                                                Confirm Booking
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const url = new URL(window.location.href);
                                                    url.searchParams.set('action', 'reject');
                                                    window.history.pushState({}, '', url.toString());
                                                    window.location.reload();
                                                }}
                                                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5"/>
                                                Decline
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SupplierConfirmation;
