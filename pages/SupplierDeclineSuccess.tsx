import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function SupplierDeclineSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>⚠️ Booking Declined</h1>
      <p>Reference: <strong>{ref}</strong></p>
      <p><Link to="/" style={{ color: '#F57C00' }}>Go to home</Link></p>
    </div>
  );
}
