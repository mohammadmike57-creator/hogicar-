
import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_BOOKINGS, MOCK_CARS, confirmBooking } from '../services/mockData';
import { Booking, Car as CarType } from '../types';
import { Car, CheckCircle, AlertTriangle, FileText, Calendar, User, Hash, Send } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';

const SupplierConfirmation: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [booking, setBooking] = React.useState<Booking | null>(null);
    const [car, setCar] = React.useState<CarType | null>(null);
    const [confirmationNumber, setConfirmationNumber] = React.useState('');
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        const foundBooking = MOCK_BOOKINGS.find(b => b.id === bookingId);
        if (foundBooking) {
            setBooking(foundBooking);
            const foundCar = MOCK_CARS.find(c => c.id === foundBooking.carId);
            setCar(foundCar || null);
            if (foundBooking.status === 'confirmed') {
                setIsConfirmed(true);
                setConfirmationNumber(foundBooking.supplierConfirmationNumber || 'N/A');
            }
        } else {
            setError('Booking not found.');
        }
    }, [bookingId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationNumber.trim()) {
            setError('Please enter a confirmation number.');
            return;
        }
        if (bookingId) {
            const success = confirmBooking(bookingId, confirmationNumber);
            if (success) {
                setIsConfirmed(true);
                setError('');
            } else {
                setError('Could not confirm booking. It may have been cancelled or already confirmed.');
            }
        }
    };

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
    
    if (!booking || !car) {
        return <div className="min-h-screen bg-slate-100 flex justify-center items-center"><p>Loading booking details...</p></div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <SEOMetadata title="Confirm Booking Request" description="Supplier confirmation page for Hogicar rental request." noIndex={true} />
            
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
                    <div className="relative">
                        <Car className="h-6 w-6 text-[#003580]" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF9F1C] rounded-full border border-white"></div>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-[#003580]">Hogi<span className="text-[#FF9F1C]">car</span></span>
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
                                    <p className="flex justify-between"><span>Hogicar Reference:</span> <strong className="font-mono">{booking.id}</strong></p>
                                    <p className="flex justify-between"><span>Customer Name:</span> <strong>{booking.customerName}</strong></p>
                                </div>
                            </div>
                             <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rental Period</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="flex justify-between"><span>Pick-up:</span> <strong>{booking.startDate} at {booking.startTime}</strong></p>
                                    <p className="flex justify-between"><span>Drop-off:</span> <strong>{booking.endDate} at {booking.endTime}</strong></p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Car Details */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <img src={car.image} alt={car.model} className="w-full h-32 object-contain mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">{car.make} {car.model}</h3>
                            <p className="text-xs text-slate-500">or similar {car.category}</p>
                            <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1">
                                <p className="flex justify-between"><span>SIPP Code:</span> <span className="font-mono">{car.sippCode}</span></p>
                                <p className="flex justify-between"><span>Transmission:</span> <span>{car.transmission}</span></p>
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
                                <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-base">
                                    <Send className="w-5 h-5"/> Confirm Booking
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
