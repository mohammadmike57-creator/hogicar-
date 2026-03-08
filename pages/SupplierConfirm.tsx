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
  const [debug, setDebug] = useState<string>('');
  const [bookingRef, setBookingRef] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing confirmation token');
      setLoading(false);
      return;
    }

    console.log('Fetching booking for token:', token);
    setDebug('Fetching booking...');

    supplierApi.getBookingByToken(token)
      .then(res => {
        console.log('API response:', res);
        setDebug('API response received: ' + JSON.stringify(res.data));
        if (res.data && res.data.bookingRef) {
          setBookingRef(res.data.bookingRef);
        } else {
          setError('Invalid response from server');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('API error:', err);
        let errorMsg = 'Invalid or expired token';
        if (err.response) {
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
          errorMsg = `Server error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`;
        } else if (err.request) {
          errorMsg = 'No response from server – check your connection';
        } else {
          errorMsg = err.message;
        }
        setError(errorMsg);
        setDebug('Error: ' + errorMsg);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !confirmationNumber.trim()) return;
    setSubmitting(true);
    try {
      const response = await supplierApi.confirmBooking(token, confirmationNumber.trim());
      console.log('Confirm response:', response);
      navigate(`/supplier-confirm-success?ref=${bookingRef}&number=${encodeURIComponent(confirmationNumber.trim())}`);
    } catch (err: any) {
      console.error('Confirm error:', err);
      let errorMsg = 'Failed to confirm booking';
      if (err.response) {
        errorMsg = err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMsg = 'No response from server';
      } else {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Logo className="mb-8" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        <p className="mt-4 text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Logo className="mb-8" />
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4 text-center">✕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error</h1>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          {debug && <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">{debug}</pre>}
          <div className="text-center mt-6">
            <a href="/" className="text-orange-500 hover:underline">Go to home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Logo className="mb-8" />
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirm Booking</h1>
        <p className="text-gray-600 mb-6">
          Booking reference: <span className="font-semibold">{bookingRef}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your confirmation number
          </label>
          <input
            type="text"
            value={confirmationNumber}
            onChange={(e) => setConfirmationNumber(e.target.value)}
            placeholder="e.g., CONFIRM-123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
