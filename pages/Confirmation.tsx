
import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_BOOKINGS, MOCK_CARS } from '../services/mockData';
// FIX: Add missing 'Car' icon to lucide-react import.
import { CheckCircle, Printer, ArrowRight, User, CreditCard, FileText, MapPin, Calendar, Mail, Car } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';

const Confirmation: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const booking = MOCK_BOOKINGS.find(b => b.id === bookingId);
  const car = booking ? MOCK_CARS.find(c => c.id === booking.carId) : null;

  if (!booking || !car) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-slate-50">
        <SEOMetadata
          title="Booking Not Found | Hogicar"
          description="The requested booking could not be found."
          noIndex={true}
        />
        <div className="text-center p-4">
          <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
          <p className="mt-2 text-slate-500">The booking reference is invalid or has expired.</p>
          <Link to="/" className="mt-6 inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'pending';

  return (
    <>
      <SEOMetadata
        title={`Booking ${isPending ? 'Request Sent' : 'Confirmed'}! | Hogicar`}
        description={`Your booking confirmation for a ${car.make} ${car.model}. Reference: ${booking.id}.`}
        noIndex={true}
      />
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BookingStepper currentStep={5} />

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className={`p-8 text-center border-b ${isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${isPending ? 'text-yellow-500' : 'text-green-500'}`} />
              <h1 className={`text-3xl font-extrabold ${isPending ? 'text-yellow-800' : 'text-green-800'}`}>
                {isPending ? 'Your Request is Sent!' : 'Booking Confirmed!'}
              </h1>
              <p className={`mt-2 text-sm max-w-lg mx-auto ${isPending ? 'text-yellow-700' : 'text-green-700'}`}>
                {isPending 
                  ? "The supplier will confirm availability shortly. A confirmation email with your voucher will be sent to you once confirmed."
                  : `Your rental is confirmed! A confirmation email with your voucher has been sent to ${booking.customerEmail}.`
                }
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Booking Reference: <span className="font-mono bg-slate-200 text-slate-800 px-2 py-1 rounded">{booking.id}</span>
              </p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Car className="w-5 h-5 text-blue-600" /> Vehicle Details</h3>
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <img src={car.image} alt={car.model} className="w-24 h-16 object-cover rounded"/>
                      <div>
                        <p className="font-bold text-slate-900">{booking.carName}</p>
                        <p className="text-xs text-slate-500">Provided by {car.supplier.name}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> Rental Period</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                        <span className="font-semibold text-slate-600">Pick-up:</span>
                        <span className="font-bold text-slate-800">{booking.startDate} @ {booking.startTime}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                        <span className="font-semibold text-slate-600">Drop-off:</span>
                        <span className="font-bold text-slate-800">{booking.endDate} @ {booking.endTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Location</h3>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{car.locationDetail} at {car.location}</p>
                  </div>

                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> Price Breakdown</h3>
                    <div className="text-sm bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                       <div className="flex justify-between text-slate-600">
                           <span>Paid Online Now:</span>
                           <span className="font-bold text-blue-700">{getCurrencySymbol()}{convertPrice(booking.amountPaidOnline).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-slate-600">
                           <span>Pay at Desk:</span>
                           <span className="font-bold">{getCurrencySymbol()}{convertPrice(booking.amountToPayAtDesk).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
                           <span>Total Price:</span>
                           <span>{getCurrencySymbol()}{convertPrice(booking.totalPrice).toFixed(2)}</span>
                       </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> What to Bring</h3>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <li>Your booking voucher (digital or printed)</li>
                      <li>Valid driver's license</li>
                      <li>Credit card in the main driver's name</li>
                      <li>Passport or valid photo ID</li>
                    </ul>
                  </div>

                   <div className="flex flex-col sm:flex-row gap-3 pt-2">
                     <Link to="/my-bookings" className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
                       Manage Booking <ArrowRight className="w-4 h-4"/>
                     </Link>
                     <button onClick={() => window.print()} className="w-full text-center bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
                       <Printer className="w-4 h-4"/> Print Voucher
                     </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Confirmation;
