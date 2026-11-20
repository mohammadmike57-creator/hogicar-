import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCars } from '../utils/loadCars';

afterEach(() => vi.unstubAllGlobals());

const answer = (body: any, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('search results', () => {
  it('fills in the supplier and prices the page relies on', async () => {
    vi.stubGlobal('fetch', answer({ cars: [{ id: 'a', supplierName: 'Budget', netPrice: 90, name: 'Kia Picanto' }], page: 0, size: 20, hasNext: true }));
    const r = await loadCars({ pickupCode: 'AMM', pickupDate: '2026-12-20', dropoffDate: '2026-12-23' });
    expect(r.hasNext).toBe(true);
    expect(r.incomplete).toBe(false);
    expect(r.cars[0].supplier?.name).toBe('Budget');
    expect(r.cars[0].finalPrice).toBe(90);
  });

  it('passes on that the car feed did not answer', async () => {
    vi.stubGlobal('fetch', answer({ cars: [], page: 0, size: 20, hasNext: false, incomplete: true }));
    const r = await loadCars({ pickupCode: 'AMM', pickupDate: '2026-12-20', dropoffDate: '2026-12-23' });
    expect(r.incomplete).toBe(true);
    expect(r.cars).toHaveLength(0);
  });

  it('reports a server error instead of showing no cars', async () => {
    vi.stubGlobal('fetch', answer({ message: 'down' }, 502));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(loadCars({ pickupCode: 'AMM', pickupDate: '2026-12-20', dropoffDate: '2026-12-23' })).rejects.toThrow();
  });
});
