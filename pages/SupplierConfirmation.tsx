
import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CARS } from '../services/mockData';
import { Booking, Car as CarType } from '../types';
import { Car, CheckCircle, AlertTriangle, FileText, Calendar, User, Hash, Send, LoaderCircle } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';
import { Logo } from '../components/Logo';

const SupplierConfirmation: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [booking, setBooking] = React.useState<Booking | null>(null);
    const [car, setCar] = React.useState<CarType | null>(null);
    const [confirmationNumber, setConfirmationNumber] = React.useState('');
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        const loadData = async () => {
            if (!bookingId) {
                setError('No booking ID provided');
                setIsLoading(false);
                return;
            }

            try {
                // Fetch booking details using the ID (which might be the Reference or numeric ID)
                // Assuming route uses Ref, we use getBookingByRef. 
                const fetchedBooking = await api.getBookingByRef(bookingId);
                setBooking(fetchedBooking);
                
                // Try to find the car from mock data for display purposes
                const foundCar = MOCK_CARS.find(c => c.id === fetchedBooking.carId);
                setCar(foundCar || null);

                if (fetchedBooking.status === 'confirmed') {
                    setIsConfirmed(true);
                    setConfirmationNumber(fetchedBooking.supplierConfirmationNumber || 'N/A');
                }
            } catch (err: any) {
                console.error("Failed to load booking:", err);
                setError('Booking not found or could not be loaded.');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [bookingId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationNumber.trim()) {
            setError('Please enter a confirmation number.');
            return;
        }
        if (!bookingId) return;

        setIsSubmitting(true);
        setError('');

        try {
            await api.supplierConfirm(bookingId, confirmationNumber);
            setIsConfirmed(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Could not confirm booking. It may have been cancelled or already confirmed.');
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
    
    // Fallback for car visual if not found in MOCK_CARS
    const displayCar = car || {
        make: "Vehicle",
        model: booking?.carName || "Rental",
        image: "https://placehold.co/600x400?text=Car+Image",
        category: "Standard",
        sippCode: "????",
        transmission: "Automatic"
    } as any;

    if (!booking) return null;

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <SEOMetadata title="Confirm Booking Request" description="Supplier confirmation page for Hogicar rental request." noIndex={true} />
            
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
                    <Logo className="h-12 w-auto" variant="dark" />
                    <span className="text-slate-400 font-light text-xl mx-2">|</span>
                    <span className="text-sm font-semibold text-slate-500">Supplier Confirmation</span>
                </div>
            </header>
            
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                    <div className="p-8 border-b border-slate-100">
                        <h1 className="text-2xl font-bold text-slate-800">Rental Request Voucher</h1>
                        <p className="text-sm text-slate-500 mt-1">Please review the details below and provide your confirmation number to finalize this booking.</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Booking Details */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Booking Details</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="flex justify-between"><span>Hogicar Reference:</span> <strong className="font-mono">{booking.bookingRef || booking.id}</strong></p>
                                    <p className="flex justify-between"><span>Customer Name:</span> <strong>{booking.firstName} {booking.lastName}</strong></p>
                                </div>
                            </div>
                             <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rental Period</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="flex justify-between"><span>Pick-up:</span> <strong>{booking.pickupDate}</strong></p>
                                    <p className="flex justify-between"><span>Drop-off:</span> <strong>{booking.dropoffDate}</strong></p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Car Details */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <img src={displayCar.image} alt={displayCar.model} className="w-full h-32 object-contain mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">{displayCar.make} {displayCar.model}</h3>
                            <p className="text-xs text-slate-500">or similar {displayCar.category}</p>
                            <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1">
                                <p className="flex justify-between"><span>SIPP Code:</span> <span className="font-mono">{displayCar.sippCode}</span></p>
                                <p className="flex justify-between"><span>Transmission:</span> <span>{displayCar.transmission}</span></p>
                            </div>
                        </div>
                    </div>

                    {isConfirmed ? (
                        <div className="p-8 bg-green-50 border-t border-green-200 rounded-b-xl text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-green-800">Booking Confirmed!</h2>
                            <p className="text-sm text-green-700 mt-2">
                                The customer has been notified and sent the updated voucher with your confirmation number: 
                                <strong className="font-mono bg-green-100 p-1 rounded ml-1">{confirmationNumber}</strong>.
                            </p>
                        </div>
                    ) : (
                        <div className="p-8 bg-blue-50 border-t border-blue-200 rounded-b-xl">
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
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-50"
                                >
                                    {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                                    {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SupplierConfirmation;
