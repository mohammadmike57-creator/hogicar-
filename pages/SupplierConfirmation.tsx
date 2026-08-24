import * as React from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, CheckCircle, AlertTriangle, FileText, Calendar, 
  User, Hash, Send, LoaderCircle, XCircle, Printer, 
  MapPin, Clock, Phone, Mail, Shield, Zap, Info, 
  CreditCard, ChevronRight, MessageSquare, HelpCircle, 
  Download, ExternalLink, Globe, Award
} from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';
import { Logo } from '../components/Logo';
import { useCurrency } from '../contexts/CurrencyContext';

const SupplierConfirmation: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { getCurrencySymbol } = useCurrency();
    
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const action = queryParams.get('action');
    const shouldAutoPrint = queryParams.get('print') === '1';

    const [booking, setBooking] = React.useState<any | null>(null);
    const [confirmationNumber, setConfirmationNumber] = React.useState('');
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [isRejected, setIsRejected] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDarkMode, setIsDarkMode] = React.useState(false);

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
                
                const status = fetchedBooking.status?.toLowerCase();
                if (status === 'confirmed') {
                    setIsConfirmed(true);
                    setConfirmationNumber(fetchedBooking.supplierConfirmationNumber || '');
                } else if (status === 'cancelled') {
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
            const timer = window.setTimeout(() => window.print(), 800);
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
                await api.confirmBookingByToken(bookingId as string, confirmationNumber);
            }
            setIsConfirmed(true);
            const updatedBooking = await (token ? api.getBookingByToken(token) : api.getBookingByRef(bookingId!));
            setBooking(updatedBooking);
        } catch (err: any) {
            setError(err.message || 'Could not confirm booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Action link expired or invalid.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.rejectBookingByToken(token, rejectionReason || 'Declined by supplier');
            setIsRejected(true);
        } catch (err: any) {
            setError(err.message || 'Could not decline booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
            <LoaderCircle className="h-10 w-10 animate-spin text-[#123C69]" />
          </div>
        );
    }

    if (error && !booking) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
                <AlertTriangle className="mb-4 h-16 w-16 text-[#EF4444]" />
                <h1 className="text-2xl font-bold text-[#123C69]">Error</h1>
                <p className="mt-2 text-slate-500">{error}</p>
                <Link to="/" className="mt-6 rounded-xl bg-[#123C69] px-6 py-3 font-bold text-white">Return Home</Link>
            </div>
        );
    }

    if (!booking) return null;

    const isRejectAction = action === 'reject';
    const statusColor = isConfirmed ? 'text-[#22C55E]' : (isRejected ? 'text-[#EF4444]' : 'text-[#F59E0B]');
    const statusBg = isConfirmed ? 'bg-[#22C55E]/10' : (isRejected ? 'bg-[#EF4444]/10' : 'bg-[#F59E0B]/10');

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0f172a]' : 'bg-[#F8FAFC]'} pb-20 transition-colors duration-300`}>
            <SEOMetadata title={`Rental Request - ${booking.bookingRef}`} noIndex />
            
            <style>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-area { width: 100% !important; margin: 0 !important; box-shadow: none !important; border: 0 !important; }
                    .card { break-inside: avoid; border: 1px solid #e2e8f0 !important; }
                }
            `}</style>

            <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#1e293b]/80 no-print">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Logo className="h-8 w-auto" variant={isDarkMode ? 'light' : 'dark'} />
                        <span className="h-6 w-px bg-slate-200 dark:bg-slate-700"></span>
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Rental Request</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8 print-area">
                <div className="mb-8 overflow-hidden rounded-[2rem] bg-white shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12">
                        <div>
                            <div className={`inline-flex items-center gap-2 rounded-full ${statusBg} px-4 py-1.5 text-xs font-black uppercase tracking-widest ${statusColor} mb-4`}>
                                <Zap className="h-3 w-3" />
                                {isConfirmed ? 'Confirmed' : (isRejected ? 'Cancelled' : 'Pending Confirmation')}
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-[#123C69] dark:text-white sm:text-5xl">
                                Rental Request: <span className="font-mono text-slate-400">#{booking.bookingRef}</span>
                            </h1>
                            <div className="mt-6 flex flex-wrap gap-6 text-sm">
                                <InfoItem label="Date Created" value={new Date(booking.createdAt).toLocaleDateString()} />
                                <InfoItem label="Channel" value="HogiCar Online" />
                                <InfoItem label="Currency" value={booking.currency} />
                                <InfoItem label="Status" value={isConfirmed ? 'CONFIRMED' : (isRejected ? 'CANCELLED' : 'AWAITING RESPONSE')} />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 text-center md:items-end md:text-right">
                             <div className="rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Net Rate</p>
                                <p className="text-3xl font-black text-[#123C69] dark:text-white">
                                    {getCurrencySymbol(booking.currency)} {booking.netPrice?.toFixed(2)}
                                </p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800 card">
                             <div className="mb-8 flex items-center justify-between">
                                <h3 className="text-xl font-black text-[#123C69] dark:text-white">Rental Itinerary</h3>
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center dark:bg-slate-900">
                                    <MapPin className="h-5 w-5 text-[#F57C00]" />
                                </div>
                             </div>
                             <div className="relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <div className="h-2 w-2 rounded-full bg-[#22C55E]"></div> Pickup
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold dark:text-white">{booking.pickupLocationName}</h4>
                                            <div className="mt-4 flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-300" />
                                                    <span className="text-sm font-bold dark:text-white">{booking.pickupDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-300" />
                                                    <span className="text-sm font-bold dark:text-white">{booking.startTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <div className="h-2 w-2 rounded-full bg-[#EF4444]"></div> Return
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold dark:text-white">{booking.dropoffLocationName}</h4>
                                            <div className="mt-4 flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-300" />
                                                    <span className="text-sm font-bold dark:text-white">{booking.dropoffDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-300" />
                                                    <span className="text-sm font-bold dark:text-white">{booking.endTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block absolute top-4 left-1/2 -translate-x-1/2 w-px h-24 border-l border-dashed border-slate-200 dark:border-slate-700"></div>
                             </div>
                        </section>

                        <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800 card">
                             <div className="mb-8 flex items-center justify-between">
                                <h3 className="text-xl font-black text-[#123C69] dark:text-white">Requested Vehicle</h3>
                                <Car className="h-6 w-6 text-[#F57C00]" />
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <SpecItem label="Vehicle Group" value={booking.carCategory} />
                                <SpecItem label="SIPP Code" value={booking.carSippCode} />
                                <SpecItem label="Transmission" value={booking.carTransmission} />
                                <SpecItem label="Fuel Type" value={booking.carFuelPolicy} />
                                <SpecItem label="A/C" value={booking.carAirConditioning ? 'YES' : 'NO'} />
                                <SpecItem label="Seats" value={booking.carPassengers} />
                                <SpecItem label="Doors" value={booking.carDoors} />
                                <SpecItem label="Luggage" value={booking.carBags} />
                             </div>
                        </section>

                        <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#1e293b] dark:border dark:border-slate-800 card">
                             <div className="mb-8 flex items-center justify-between">
                                <h3 className="text-xl font-black text-[#123C69] dark:text-white">Customer Information</h3>
                                <User className="h-6 w-6 text-[#F57C00]" />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <DetailRow label="Primary Driver" value={`${booking.firstName} ${booking.lastName}`} bold />
                                    <DetailRow label="Nationality" value={booking.nationality || 'Not Provided'} />
                                    <DetailRow label="Contact Phone" value={booking.phone} />
                                    <DetailRow label="Contact Email" value={booking.email} />
                                </div>
                                <div className="space-y-4">
                                    <DetailRow label="Flight Number" value={booking.flightNumber || 'Not Provided'} />
                                    <DetailRow label="License Country" value="Not Provided" />
                                    <DetailRow label="Special Requests" value="None" />
                                    <div className="pt-2">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-[#123C69] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
                                            <Award className="h-3 w-3 text-[#F57C00]" /> Verified Driver
                                        </span>
                                    </div>
                                </div>
                             </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section className="rounded-[2rem] bg-white p-8 shadow-xl border-2 border-slate-100 dark:bg-[#1e293b] dark:border-slate-800 no-print">
                             {!isConfirmed && !isRejected ? (
                                <>
                                    <h3 className="text-xl font-black text-[#123C69] dark:text-white mb-2">Reservation Action</h3>
                                    <p className="text-sm text-slate-500 mb-6">Confirm availability to finalize this reservation.</p>
                                    
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Supplier Confirmation #</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                                <input 
                                                    type="text" 
                                                    value={confirmationNumber}
                                                    onChange={e => setConfirmationNumber(e.target.value.toUpperCase())}
                                                    placeholder="Enter your system ID"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 font-bold focus:border-[#123C69] focus:ring-0 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            disabled={isSubmitting}
                                            className="w-full rounded-xl bg-[#123C69] py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#1e293b] active:scale-95 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => navigate(`${location.pathname}?token=${token}&action=reject`)}
                                            className="w-full rounded-xl border border-slate-200 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-900/10"
                                        >
                                            Decline Request
                                        </button>
                                    </form>
                                </>
                             ) : isConfirmed ? (
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#22C55E]/10 text-[#22C55E]">
                                        <CheckCircle className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-[#123C69] dark:text-white">Confirmed</h3>
                                    <p className="mt-2 text-sm text-slate-500">Booking finalized with ID: <strong>{booking.supplierConfirmationNumber}</strong></p>
                                    <button onClick={() => window.print()} className="mt-6 w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">
                                        Print Voucher
                                    </button>
                                </div>
                             ) : (
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EF4444]/10 text-[#EF4444]">
                                        <XCircle className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-[#123C69] dark:text-white">Cancelled</h3>
                                    <p className="mt-2 text-sm text-slate-500">This request has been declined.</p>
                                </div>
                             )}
                        </section>

                        <section className="rounded-[2rem] bg-[#123C69] p-8 text-white shadow-lg no-print">
                            <h3 className="text-lg font-black mb-4">Partner Support</h3>
                            <div className="space-y-4">
                                <SupportItem icon={<Phone className="h-4 w-4" />} label="Supplier Assistance" value="+1 800 HOGICAR" />
                                <SupportItem icon={<Mail className="h-4 w-4" />} label="Finance Dept" value="finance@hogicar.com" />
                            </div>
                        </section>
                    </div>
                </div>

                <footer className="mt-12 border-t border-slate-200 py-8 text-center dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Automatically generated by HogiCar System V2.5 &bull; Ref: {booking.bookingRef}
                    </p>
                </footer>
            </main>

            {isRejectAction && !isRejected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
                    <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-[#1e293b]">
                        <h2 className="text-2xl font-black text-[#123C69] dark:text-white mb-2">Decline Request</h2>
                        <form onSubmit={handleReject} className="space-y-4">
                            <textarea 
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:border-[#EF4444] focus:ring-0 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                rows={4}
                                placeholder="Reason for declining..."
                                required
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => navigate(`${location.pathname}?token=${token}`)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700">Back</button>
                                <button disabled={isSubmitting} className="flex-[2] rounded-xl bg-[#EF4444] py-3 text-sm font-black uppercase tracking-widest text-white">Confirm Decline</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
);

const SpecItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value || 'N/A'}</p>
    </div>
);

const DetailRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className="flex justify-between border-b border-slate-50 pb-3 dark:border-slate-800/50">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`text-sm ${bold ? 'font-black text-[#123C69] dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{value}</span>
    </div>
);

const SupportItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1 text-[#F57C00]">{icon}</div>
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-sm font-bold">{value}</p>
        </div>
    </div>
);

export default SupplierConfirmation;
