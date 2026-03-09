import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function SupplierConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Supplier Confirm Page</h1>
      <p><strong>Token:</strong> {token || 'No token provided'}</p>
      <p>If you see this, the route is working!</p>
    </div>
  );
}
