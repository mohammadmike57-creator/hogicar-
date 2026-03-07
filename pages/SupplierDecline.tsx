import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, LoaderCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { supplierApi } from '../api';

const SupplierDecline: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/supplier-login');
      return;
    }
    const fetchBooking = async () => {
      try {
        const response = await supplierApi.getBookingByToken(token);
        setBooking(response.data);
      } catch (err: any) {
        setError(err.response?.data || 'Invalid or expired token');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }
    setSubmitting(true);
    try {
      await supplierApi.rejectBooking(token, reason);
      navigate('/supplier-decline-success', { state: { bookingRef: booking.bookingRef } });
    } catch (err: any) {
      setError(err.response?.data || 'Failed to decline booking. Please try again.');
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
          <p className="text-gray-600 mb-6">{error || 'This link is no longer valid.'}</p>
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
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" variant="light" />
            <h1 className="text-2xl font-bold">Decline Booking</h1>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
            <p className="text-2xl font-bold text-gray-800">{booking.bookingRef}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-semibold">{booking.firstName} {booking.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold">{booking.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for declining <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="e.g. Car not available, maintenance issue..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              {submitting ? 'Processing...' : 'Decline Booking'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SupplierDecline;
