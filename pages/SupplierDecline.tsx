import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function SupplierDecline() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Supplier Decline Page</h1>
      <p><strong>Token:</strong> {token || 'No token provided'}</p>
    </div>
  );
}
