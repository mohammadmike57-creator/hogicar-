import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function SupplierConfirmSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const number = searchParams.get('number');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Logo className="h-12 mb-8" />
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-4">You have successfully confirmed booking <span className="font-semibold">{ref}</span>.</p>
        {number && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Confirmation number</p>
            <p className="text-xl font-bold text-orange-600">{number}</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-6">The customer has been notified and will receive the voucher.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
          Return to home
        </Link>
      </div>
    </div>
  );
}
