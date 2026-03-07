import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, LoaderCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { supplierApi } from '../api';

const SupplierConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/supplier-login');
      return;
    }
    supplierApi.getBookingByToken(token)
      .then(res => setBooking(res.data))
      .catch(() => setError('Invalid or expired token'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationNumber.trim()) {
      setError('Please enter a confirmation number');
      return;
    }
    setSubmitting(true);
    try {
      await supplierApi.confirmBooking(token, confirmationNumber);
      navigate('/supplier-confirm-success', { state: { action: 'confirmed', bookingRef: booking.bookingRef } });
    } catch (err) {
      setError('Failed to confirm booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">{error || 'This confirmation link is no longer valid.'}</p>
          <a href="/" className="text-orange-600 hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" variant="light" />
            <h1 className="text-2xl font-bold">Confirm Booking</h1>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
            <p className="text-2xl font-bold text-gray-800">{booking.bookingRef}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-semibold">{booking.firstName} {booking.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold">{booking.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pick‑up</p>
              <p className="font-semibold">{booking.pickupDate} · {booking.startTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Drop‑off</p>
              <p className="font-semibold">{booking.dropoffDate} · {booking.endTime}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmation Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="e.g. CON-12345"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">This number will appear on the customer's voucher.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SupplierConfirm;
