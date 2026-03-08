import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function SupplierDeclineSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Logo className="mb-8" />
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-yellow-500 text-5xl mb-4">⚠</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Declined</h1>
        <p className="text-gray-600 mb-6">
          Booking <strong>{ref}</strong> has been declined.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          The customer has been notified.
        </p>
        <Link to="/" className="text-orange-500 hover:underline">Return to home</Link>
      </div>
    </div>
  );
}
