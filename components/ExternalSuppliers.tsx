import React, { useEffect, useState } from 'react';

interface ExternalSupplier {
  id?: number;
  vendorCode: string;
  name: string;
  markupPercent: number;
  depositSettings: string;
  carDepositOverrides: string;
  rating: number;
  reviewCount: number;
  contactEmail: string;
  logoUrl: string;
}

const API = '/api/admin/external-suppliers';

const DEFAULT_DEPOSITS = {
  MINI: 350,
  ECONOMY: 350,
  COMPACT: 350,
  MIDSIZE: 500,
  FULLSIZE: 750,
  SUV: 1000,
  CROSSOVER: 500,
  VAN: 1000
};

const ExternalSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ExternalSupplier[]>([]);
  const [form, setForm] = useState<ExternalSupplier>({
    vendorCode: '',
    name: '',
    markupPercent: 0,
    depositSettings: JSON.stringify(DEFAULT_DEPOSITS),
    carDepositOverrides: '{}',
    rating: 4.5,
    reviewCount: 0,
    contactEmail: '',
    logoUrl: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchSuppliers = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setSuppliers(data);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`${API}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } else {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    }
    fetchSuppliers();
    setForm({
      vendorCode: '', name: '', markupPercent: 0,
      depositSettings: JSON.stringify(DEFAULT_DEPOSITS),
      carDepositOverrides: '{}',
      rating: 4.5, reviewCount: 0,
      contactEmail: '', logoUrl: ''
    });
    setEditingId(null);
  };

  const handleEdit = (s: ExternalSupplier) => {
    setForm(s);
    setEditingId(s.id || null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this supplier?')) {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      fetchSuppliers();
    }
  };

  const updateDeposit = (category: string, value: number) => {
    try {
      const settings = JSON.parse(form.depositSettings || '{}');
      settings[category] = value;
      setForm({ ...form, depositSettings: JSON.stringify(settings) });
    } catch (e) { /* ignore */ }
  };

  const getDeposit = (category: string): number => {
    try {
      const settings = JSON.parse(form.depositSettings || '{}');
      return settings[category] || DEFAULT_DEPOSITS[category as keyof typeof DEFAULT_DEPOSITS] || 0;
    } catch (e) {
      return DEFAULT_DEPOSITS[category as keyof typeof DEFAULT_DEPOSITS] || 0;
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>External API Suppliers</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
        <h3>Supplier Details</h3>
        <input placeholder="Vendor Code (e.g., ZD)" value={form.vendorCode} onChange={e => setForm({...form, vendorCode: e.target.value})} required style={{ margin: 5, padding: 8 }} />
        <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ margin: 5, padding: 8 }} />
        <input type="number" step="0.01" placeholder="Markup %" value={form.markupPercent} onChange={e => setForm({...form, markupPercent: parseFloat(e.target.value)})} required style={{ margin: 5, padding: 8 }} />
        <input type="email" placeholder="Contact Email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} required style={{ margin: 5, padding: 8 }} />
        <input placeholder="Logo URL" value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} style={{ margin: 5, padding: 8 }} />
        
        <h3>Rating & Reviews</h3>
        <label>Rating (0-5): </label>
        <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm({...form, rating: parseFloat(e.target.value)})} style={{ margin: 5, padding: 8, width: 80 }} />
        <label>Number of Reviews: </label>
        <input type="number" min="0" value={form.reviewCount} onChange={e => setForm({...form, reviewCount: parseInt(e.target.value)})} style={{ margin: 5, padding: 8, width: 80 }} />

        <h3 style={{ marginTop: 20 }}>Deposit by Category ($)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {Object.keys(DEFAULT_DEPOSITS).map(cat => (
            <div key={cat}>
              <label>{cat}</label>
              <input 
                type="number" 
                value={getDeposit(cat)} 
                onChange={e => updateDeposit(cat, parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: 5 }}
              />
            </div>
          ))}
        </div>
        
        <button type="submit" style={{ marginTop: 20, padding: '10px 20px', background: '#007ac2', color: 'white', border: 'none', borderRadius: 5 }}>
          {editingId ? 'Update' : 'Add'} Supplier
        </button>
        {editingId && <button onClick={() => { setForm({ vendorCode: '', name: '', markupPercent: 0, depositSettings: JSON.stringify(DEFAULT_DEPOSITS), carDepositOverrides: '{}', rating: 4.5, reviewCount: 0, contactEmail: '', logoUrl: '' }); setEditingId(null); }} style={{ marginLeft: 10, padding: '10px 20px' }}>Cancel</button>}
      </form>

      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>ID</th><th>Code</th><th>Name</th><th>Markup %</th><th>Rating</th><th>Reviews</th><th>Deposits</th><th>Email</th><th>Logo</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {suppliers.map(s => {
            let depositSummary = '';
            try {
              const settings = JSON.parse(s.depositSettings || '{}');
              depositSummary = Object.keys(settings).slice(0, 3).map(k => `${k}:$${settings[k]}`).join(', ');
              if (Object.keys(settings).length > 3) depositSummary += '...';
            } catch(e) { depositSummary = '—'; }
            return (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.vendorCode}</td>
                <td>{s.name}</td>
                <td>{s.markupPercent}%</td>
                <td>{s.rating}</td>
                <td>{s.reviewCount}</td>
                <td>{depositSummary}</td>
                <td>{s.contactEmail}</td>
                <td>{s.logoUrl ? <img src={s.logoUrl} height="20" alt="logo" /> : '—'}</td>
                <td>
                  <button onClick={() => handleEdit(s)}>Edit</button>
                  <button onClick={() => s.id && handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ExternalSuppliersPage;
