
import * as React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Booking, Car } from '../types';
import { CheckCircle, Printer, ArrowRight, User, CreditCard, FileText, MapPin, Calendar, Mail, Car as CarIcon, AlertCircle, LoaderCircle } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import { api } from '../api';

const Confirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  
  const [booking, setBooking] = React.useState<any | null>(null);
  const [storedCar, setStoredCar] = React.useState<Car | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const bookingRefFromQuery = searchParams.get('bookingRef');
    const allowedRef = sessionStorage.getItem("allowConfirmationRef");
    const storedBookingRaw = sessionStorage.getItem("hogicar_booking");

    // Guard against stale URL on browser restore if session is empty and query doesn't match allowed
    if (bookingRefFromQuery && bookingRefFromQuery !== allowedRef && !storedBookingRaw) {
        // We can still try to fetch if we have a valid looking ref
        // But the original logic redirected. We will try to fetch if ref exists.
    }

    const loadConfirmation = async () => {
      setLoading(true);
      setApiError(null);
      
      const storedBooking = storedBookingRaw ? JSON.parse(storedBookingRaw) : null;
      
      const storedCarRaw = sessionStorage.getItem("hogicar_car");
      if (storedCarRaw) {
        setStoredCar(JSON.parse(storedCarRaw));
      }

      // Determine which ref to use
      const bookingRef = bookingRefFromQuery || (storedBooking as any)?.bookingRef || (storedBooking as any)?.id;
      
      if (!bookingRef) {
        if (!storedBooking) {
            navigate('/');
            return;
        }
        setBooking(storedBooking);
        setLoading(false);
        return;
      }
      
      // If we have stored booking matching ref, show it immediately (optimistic)
      if (storedBooking && ((storedBooking as any).bookingRef === bookingRef || storedBooking.id == bookingRef)) {
          setBooking(storedBooking);
      }

      try {
        const data = await api.getBookingByRef(bookingRef);
        setBooking(data);
        sessionStorage.setItem("hogicar_booking", JSON.stringify(data));
        
        // Clean up one-time token after successful load
        if (allowedRef) {
            sessionStorage.removeItem("allowConfirmationRef");
        }

      } catch (fetchError: any) {
        console.error("Failed to fetch booking from API:", fetchError);
        setApiError("Showing saved confirmation (API unavailable).");
        if (!booking && storedBooking) {
            setBooking(storedBooking);
        } else if (!booking) {
            setApiError(fetchError.message || "Booking not found");
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfirmation();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-slate-50">
        <div className="text-center p-4 flex flex-col items-center gap-4">
          <LoaderCircle className="w-12 h-12 text-blue-600 animate-spin" />
          <h2 className="text-xl font-bold text-slate-800">Loading Your Confirmation...</h2>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-slate-50">
        <SEOMetadata
          title="Booking Not Found | Hogicar"
          description="The requested booking could not be found."
          noIndex={true}
        />
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
          <h2 className="text-xl font-bold text-slate-800">{apiError || 'Booking Not Found'}</h2>
          <p className="mt-2 text-slate-500">The booking reference may be invalid or has expired.</p>
          <Link to="/" className="mt-6 inline-block bg-blue-600 text-white font-bold px-4 py-2 rounded-lg">Return to Home</Link>
        </div>
      </div>
    );
  }

  const car = storedCar; // Use the car data we stored locally, as API mostly returns booking info. Ideally API returns full car details too.

  return (
    <>
      <SEOMetadata
        title={`Booking Confirmed: ${booking.bookingRef || booking.id} | Hogicar`}
        description="Your car rental booking is confirmed. View your voucher and pickup details."
        noIndex={true}
      />
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BookingStepper currentStep={5} />
          {apiError && booking && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {apiError}
              </div>
          )}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-8 text-center bg-green-50 border-b border-green-200">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-extrabold text-slate-900">Booking Confirmed!</h1>
              <p className="text-slate-600 mt-2">A confirmation email has been sent to <strong className="text-slate-800">{booking.email}</strong>.</p>
              <div className="mt-4 inline-block">
                <p className="text-sm text-slate-500">Your Booking Reference:</p>
                <p className="font-mono text-xl font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-4 py-2 mt-1">{booking.bookingRef || booking.id}</p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Car & Supplier */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehicle Details</h3>
                  <div className="flex items-center gap-4">
                    {car && <img src={car.image} alt={car.model} className="w-32 h-20 object-cover rounded-lg" />}
                    <div>
                      <p className="font-bold text-slate-800">{car?.make} {car?.model || booking.carName || "Car"}</p>
                      <p className="text-sm text-slate-500">{car?.category}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rental Provider</h3>
                  <div className="flex items-center gap-3">
                     {car && <img src={car.supplier.logo} alt={car.supplier.name} className="h-8 w-auto object-contain" />}
                     <p className="font-semibold text-slate-700">{booking.supplierName}</p>
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pick-up</h3>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded text-blue-600"><Calendar className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-900">{new Date(booking.pickupDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.startTime || '10:00'}</p>
                      {car && <p className="text-sm text-slate-600 mt-1">{car.location}</p>}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Drop-off</h3>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded text-blue-600"><Calendar className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-900">{new Date(booking.dropoffDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.endTime || '10:00'}</p>
                      {car && <p className="text-sm text-slate-600 mt-1">{car.location}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Summary */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Paid Online:</span> <span className="font-bold text-green-600">{getCurrencySymbol()}{convertPrice(booking.payNow).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Due at Rental Desk:</span> <span className="font-bold text-slate-800">{getCurrencySymbol()}{convertPrice(booking.payAtDesk).toFixed(2)}</span></div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-dashed">
                    <span className="font-bold text-slate-800">Total Price:</span>
                    <span className="font-extrabold text-slate-900">{getCurrencySymbol()}{convertPrice(booking.finalPrice).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Required at Desk */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Required at Rental Desk</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3"><FileText className="w-5 h-5 text-slate-400 mt-0.5" /> <div><strong className="block text-slate-800">Your Voucher</strong><p className="text-xs text-slate-500">Print it or show the PDF on your device.</p></div></li>
                  <li className="flex items-start gap-3"><CreditCard className="w-5 h-5 text-slate-400 mt-0.5" /> <div><strong className="block text-slate-800">Credit Card</strong><p className="text-xs text-slate-500">In the main driver's name, with sufficient funds for the deposit.</p></div></li>
                  <li className="flex items-start gap-3"><User className="w-5 h-5 text-slate-400 mt-0.5" /> <div><strong className="block text-slate-800">Driving License & ID</strong><p className="text-xs text-slate-500">A valid license held for at least 1 year, plus a passport or ID card.</p></div></li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button onClick={() => window.print()} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                <Printer className="w-5 h-5"/> Print Voucher
              </button>
              <Link to="/my-bookings" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-lg shadow-sm transition-colors">
                Manage Booking <ArrowRight className="w-5 h-5"/>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Confirmation;
