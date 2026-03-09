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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <Logo className="mb-8 h-12" />
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-orange-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="mt-6 text-slate-600 font-light tracking-wide">Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <Logo className="mb-8 h-12" />
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/50">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-slate-800 mb-3">Error</h1>
          <p className="text-slate-600 mb-8 font-light">{error}</p>
          <a href="/" className="inline-block px-8 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition shadow-lg shadow-orange-500/30">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Logo className="h-14 mx-auto" />
          <p className="mt-4 text-slate-500 text-sm tracking-wider uppercase">Booking confirmation</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-4xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header with subtle gradient */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-white tracking-tight">Confirm Booking</h1>
                <p className="text-orange-100 mt-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Reference: <span className="font-mono">{booking.bookingRef}</span>
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-5 py-2">
                  <span className="text-white font-light">Supplier confirmation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            {/* Two-column layout with refined cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer & Flight */}
              <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-slate-800">Customer & Flight</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-800">{booking.firstName} {booking.lastName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-800 break-all">{booking.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-800">{booking.phone}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Flight</span>
                    <span className="font-medium text-slate-800">{booking.flightNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-slate-800">Vehicle</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Make/Model</span>
                    <span className="font-medium text-slate-800">{car?.make} {car?.model}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium text-slate-800">{car?.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Transmission</span>
                    <span className="font-medium text-slate-800">{car?.transmission}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Fuel policy</span>
                    <span className="font-medium text-slate-800">{car?.fuelPolicy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Second row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Rental Period */}
              <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-slate-800">Rental Period</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Pick-up</span>
                    <span className="font-medium text-slate-800">{booking.pickupDate} at {booking.startTime}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Drop-off</span>
                    <span className="font-medium text-slate-800">{booking.dropoffDate} at {booking.endTime}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Location</span>
                    <span className="font-medium text-slate-800">{booking.pickupCode}</span>
                  </div>
                </div>
              </div>

              {/* Payment – elegantly highlighted */}
              <div className="group bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 shadow-md border border-orange-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-slate-800">Payment</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/80 rounded-xl p-5 border border-orange-200">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Amount due at rental desk</p>
                      <p className="text-xs text-slate-500">Includes all taxes and fees</p>
                    </div>
                    <span className="text-3xl font-light text-orange-600">
                      ${booking.payAtDesk?.toFixed(2)}
                    </span>
                  </div>
                  {booking.payNow > 0 && (
                    <div className="text-xs text-slate-500 italic bg-white/50 rounded-lg p-3">
                      * ${booking.payNow} already paid online
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation form with refined style */}
            <div className="border-t border-slate-200 pt-8">
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmation number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={confirmationNumber}
                      onChange={(e) => setConfirmationNumber(e.target.value)}
                      placeholder="e.g., CONF-123"
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm text-slate-800 placeholder-slate-400"
                      required
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Booking</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Subtle footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} Hogicar. All rights reserved.
        </p>
      </div>
    </div>
  );
}
