import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supplierApi } from '../api';
import { Logo } from '../components/Logo';

export default function SupplierConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [car, setCar] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing confirmation token');
      setLoading(false);
      return;
    }

    supplierApi.getBookingByToken(token)
      .then(res => {
        setBooking(res.data);
        setCar(res.data.car);
        setSupplier(res.data.supplier);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Invalid or expired token');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !confirmationNumber.trim()) return;
    setSubmitting(true);
    try {
      await supplierApi.confirmBooking(token, confirmationNumber.trim());
      navigate(`/supplier-confirm-success?ref=${booking.bookingRef}&number=${encodeURIComponent(confirmationNumber.trim())}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm booking');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Logo className="mb-8" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Logo className="mb-8" />
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="text-orange-500 hover:underline">Go to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Logo className="h-12 mx-auto" />
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Confirm Booking</h1>
            <p className="text-orange-100">Reference: {booking.bookingRef}</p>
          </div>
          <div className="p-6 md:p-8">
            {/* Booking details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                  Customer & Flight
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{booking.firstName} {booking.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{booking.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{booking.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flight:</span>
                    <span className="font-medium">{booking.flightNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                  Vehicle
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Make/Model:</span>
                    <span className="font-medium">{car?.make} {car?.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{car?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transmission:</span>
                    <span className="font-medium">{car?.transmission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel policy:</span>
                    <span className="font-medium">{car?.fuelPolicy}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                  Rental Period
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pick-up:</span>
                    <span className="font-medium">{booking.pickupDate} at {booking.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drop-off:</span>
                    <span className="font-medium">{booking.dropoffDate} at {booking.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{booking.pickupCode}</span>
                  </div>
                </div>
              </div>
              
              {/* SIMPLIFIED PRICE BREAKDOWN – only total and pay at desk */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                  Payment Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-lg font-bold border-b pb-2">
                    <span>Total</span>
                    <span className="text-orange-600">${booking.finalPrice}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                    <span className="font-medium">Pay at rental desk</span>
                    <span className="text-xl font-bold text-orange-600">${booking.payAtDesk}</span>
                  </div>
                  {booking.payNow > 0 && (
                    <div className="text-sm text-gray-500 italic">
                      * ${booking.payNow} already paid online
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your confirmation number
              </label>
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="e.g., CONF-123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
