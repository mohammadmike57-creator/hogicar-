import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function SupplierConfirmSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const number = searchParams.get('number');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Logo className="mb-8" />
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-4">
          You have successfully confirmed booking <strong>{ref}</strong>.
        </p>
        {number && (
          <p className="text-gray-600 mb-6">
            Confirmation number: <span className="font-semibold">{number}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mb-6">
          The customer has been notified and will receive a voucher.
        </p>
        <Link to="/" className="text-orange-500 hover:underline">Return to home</Link>
      </div>
    </div>
  );
}
