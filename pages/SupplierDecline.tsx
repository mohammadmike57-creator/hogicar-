import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supplierApi } from '../api';
import { Logo } from '../components/Logo';

export default function SupplierDecline() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [declinedBy, setDeclinedBy] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing token');
      setLoading(false);
      return;
    }

    supplierApi.getBookingByToken(token)
      .then(res => {
        setBooking(res.data);
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
    if (!token || !reason.trim() || !declinedBy.trim() || !confirmed) return;
    setSubmitting(true);
    try {
      // Send reason and declinedBy to backend – you may need to adjust the API to accept these
      await supplierApi.rejectBooking(token, `Declined by ${declinedBy}: ${reason}`);
      navigate(`/supplier-decline-success?ref=${booking.bookingRef}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to decline booking');
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
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Decline Booking</h1>
            <p className="text-red-100">Reference: {booking.bookingRef}</p>
          </div>
          <div className="p-6 md:p-8">
            {/* Booking summary */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{booking.firstName} {booking.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-medium">{booking.car?.make} {booking.car?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pick-up</p>
                  <p className="font-medium">{booking.pickupDate} {booking.startTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Drop-off</p>
                  <p className="font-medium">{booking.dropoffDate} {booking.endTime}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={declinedBy}
                  onChange={(e) => setDeclinedBy(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Please provide a reason..."
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="confirm" className="ml-2 block text-sm text-gray-700">
                  I confirm that I want to decline this booking
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !confirmed || !reason.trim() || !declinedBy.trim()}
                className="mt-4 w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting...' : 'Decline Booking'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
