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
  const [bookingRef, setBookingRef] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing token');
      setLoading(false);
      return;
    }

    supplierApi.getBookingByToken(token)
      .then(res => {
        setBookingRef(res.data.bookingRef);
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
    if (!token) return;
    setSubmitting(true);
    try {
      await supplierApi.rejectBooking(token, reason || 'No reason provided');
      navigate(`/supplier-decline-success?ref=${bookingRef}`);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Logo className="mb-8" />
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Decline Booking</h1>
        <p className="text-gray-600 mb-6">
          Booking reference: <span className="font-semibold">{bookingRef}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Why are you declining?"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Decline Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
