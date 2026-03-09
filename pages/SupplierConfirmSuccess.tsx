import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function SupplierConfirmSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const number = searchParams.get('number');

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>✅ Booking Confirmed!</h1>
      <p>Reference: <strong>{ref}</strong></p>
      {number && <p>Confirmation number: <strong>{number}</strong></p>}
      <p><Link to="/" style={{ color: '#F57C00' }}>Go to home</Link></p>
    </div>
  );
}
