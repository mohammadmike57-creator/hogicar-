import * as React from 'react';
import CalendarRange from 'lucide-react/dist/esm/icons/calendar-range';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Download from 'lucide-react/dist/esm/icons/download';
import Search from 'lucide-react/dist/esm/icons/search';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import CarFront from 'lucide-react/dist/esm/icons/car-front';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import X from 'lucide-react/dist/esm/icons/x';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { Hero, heroButton, heroPrimary, num, Segmented, useToast, Toast } from './commercialUi';
import { VoucherModal } from '../../components/RentalVoucher';
import ChangeDecisionModal from '../../components/manage/ChangeDecisionModal';
import { changeStatusOf } from '../../utils/changeRequest';
import { API_BASE_URL } from '../../lib/config';
import { getAdminToken } from '../../lib/adminApi';
import {
  AdminBooking, STATUS, statusOf, counts, total, currencyOf, bookedAt, pickupAt, dropoffAt, rentalDays, mainCurrency,
  money, fmtDay, agoText, fullName, carName, initials,
} from './bookingData';

type Tab = 'all' | 'upcoming' | 'awaiting' | 'payment' | 'confirmed' | 'completed' | 'cancelled' | 'changes';
type Sort = 'booked' | 'pickup' | 'value';
const PAGE = 25;

const StatusPill: React.FC<{ b: AdminBooking }> = ({ b }) => (
  <span className="flex flex-col items-start gap-1">
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS[statusOf(b)].pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS[statusOf(b)].dot}`} />{STATUS[statusOf(b)].label}
    </span>
    {changeStatusOf(b) === 'REQUESTED' && <span className="whitespace-nowrap rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">Change requested</span>}
  </span>
);

const CarThumb: React.FC<{ b: AdminBooking }> = ({ b }) => {
  const [failed, setFailed] = React.useState(false);
  return (
    <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-200">
      {b.carImage && !failed
        ? <img src={b.carImage} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" />
        : <CarFront className="h-4 w-4 text-slate-300" />}
    </span>
  );
};

const paidLine = (b: AdminBooking) => {
  const cur = currencyOf(b);
  const online = Number(b.payNow) || 0;
  const desk = Number(b.payAtDesk) || 0;
  if (online > 0 && desk > 0) return `${money(online, cur, true)} online · ${money(desk, cur, true)} desk`;
  if (online > 0) return 'Paid online';
  return 'At pick-up';
};

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Admin › Bookings: every reservation, its status, and the work it needs. */
const BookingsAdmin: React.FC<{ bookings: AdminBooking[]; loading?: boolean; onRefresh: () => void }> = ({ bookings, loading, onRefresh }) => {
  const list = Array.isArray(bookings) ? bookings : [];
  const [tab, setTab] = React.useState<Tab>('all');
  const [query, setQuery] = React.useState('');
  const [supplier, setSupplier] = React.useState('all');
  const [sort, setSort] = React.useState<Sort>('booked');
  const [shown, setShown] = React.useState(PAGE);
  const [viewing, setViewing] = React.useState<AdminBooking | null>(null);
  const [deciding, setDeciding] = React.useState<AdminBooking | null>(null);
  const { toast, notify } = useToast();
  React.useEffect(() => setShown(PAGE), [tab, query, supplier, sort]);

  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const isUpcoming = (b: AdminBooking) => ['CONFIRMED', 'PENDING', 'MODIFIED'].includes(statusOf(b)) && (pickupAt(b)?.getTime() || 0) >= startOfToday.getTime();
  const tabTest: Record<Tab, (b: AdminBooking) => boolean> = {
    all: () => true,
    upcoming: isUpcoming,
    awaiting: b => statusOf(b) === 'PENDING',
    payment: b => statusOf(b) === 'PAYMENT_PENDING',
    confirmed: b => statusOf(b) === 'CONFIRMED',
    completed: b => statusOf(b) === 'COMPLETED',
    cancelled: b => statusOf(b) === 'CANCELLED',
    changes: b => changeStatusOf(b) === 'REQUESTED',
  };
  const count = (t: Tab) => list.filter(tabTest[t]).length;

  const suppliers = React.useMemo(() => [...new Set(list.map(b => b.supplierName).filter(Boolean))].sort() as string[], [list]);
  const currency = mainCurrency(list);
  const in7 = now + 7 * 86400000;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const kpi = {
    pickups: list.filter(b => isUpcoming(b) && (pickupAt(b)?.getTime() || 0) <= in7).length,
    awaiting: count('awaiting'),
    changes: count('changes'),
    month: list.filter(b => counts(b) && currencyOf(b) === currency && (bookedAt(b)?.getTime() || 0) >= monthStart.getTime()).reduce((a, b) => a + total(b), 0),
  };

  const q = query.trim().toLowerCase();
  const filtered = list
    .filter(tabTest[tab])
    .filter(b => supplier === 'all' || b.supplierName === supplier)
    .filter(b => !q || `${b.bookingRef} ${b.firstName} ${b.lastName} ${b.email} ${b.phone} ${b.supplierName} ${b.pickupCode} ${b.dropoffCode} ${b.carMake} ${b.carModel} ${b.supplierConfirmationNumber || ''}`.toLowerCase().includes(q))
    .sort((a, b) => sort === 'pickup'
      ? (pickupAt(a)?.getTime() || 0) - (pickupAt(b)?.getTime() || 0)
      : sort === 'value' ? total(b) - total(a)
      : (bookedAt(b)?.getTime() || 0) - (bookedAt(a)?.getTime() || 0));
  const page = filtered.slice(0, shown);

  const exportCsv = () => {
    const head = ['Reference', 'Status', 'Booked', 'Customer', 'Email', 'Phone', 'Supplier', 'Supplier ref', 'Car', 'Pick-up', 'Pick-up date', 'Pick-up time', 'Drop-off', 'Drop-off date', 'Drop-off time', 'Days', 'Currency', 'Total', 'Paid online', 'At desk', 'Supplier net'];
    const rows = filtered.map(b => [b.bookingRef, STATUS[statusOf(b)].label, bookedAt(b)?.toISOString() || '', fullName(b), b.email, b.phone, b.supplierName, b.supplierConfirmationNumber, carName(b),
      b.pickupCode, b.pickupDate, b.startTime, b.dropoffCode, b.dropoffDate, b.endTime, rentalDays(b) ?? '', currencyOf(b), total(b).toFixed(2), (Number(b.payNow) || 0).toFixed(2), (Number(b.payAtDesk) || 0).toFixed(2), (Number(b.netPrice) || 0).toFixed(2)]);
    const csv = [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `hogicar-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    notify(`${num(filtered.length)} booking${filtered.length === 1 ? '' : 's'} exported`);
  };

  const downloadPdf = async () => {
    if (!viewing) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${viewing.id}/voucher/download`, { headers: { Authorization: `Bearer ${getAdminToken() || ''}` } });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url; a.download = `Hogicar-Voucher-${viewing.bookingRef || viewing.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e: any) {
      notify(`The PDF could not be downloaded (${e?.message || 'error'}). Use Print instead.`, 'err');
    }
  };

  const decide = async (approve: boolean, message: string) => {
    if (!deciding) return;
    const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${deciding.id}/change-request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken() || ''}` }, body: JSON.stringify({ approve, message }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Server returned ${res.status}`); }
    setDeciding(null); setViewing(null);
    notify(approve ? 'Change approved; the customer has been told' : 'Change declined; the customer has been told');
    onRefresh();
  };

  const filtersOn = tab !== 'all' || supplier !== 'all' || !!q;
  const busy = loading && list.length === 0;

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Bookings" eyebrowIcon={CalendarRange} title="Reservations"
        subtitle="Every booking across Hogicar: find one quickly, see what it needs, open its voucher."
        loading={busy}
        actions={<>
          <button onClick={onRefresh} className={heroButton}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={exportCsv} disabled={!filtered.length} className={`${heroPrimary} disabled:opacity-60`}><Download className="h-4 w-4" /> Export CSV</button>
        </>}
        kpis={[
          { label: 'Pick-ups in 7 days', value: num(kpi.pickups), Icon: KeyRound, note: `${num(count('upcoming'))} upcoming in total` },
          { label: 'Waiting for supplier', value: num(kpi.awaiting), Icon: Clock, note: kpi.awaiting ? 'Needs a supplier answer' : 'None waiting' },
          { label: 'Change requests', value: num(kpi.changes), Icon: Repeat, note: kpi.changes ? 'Review and answer' : 'None open' },
          { label: 'Booked this month', value: money(kpi.month, currency, true), Icon: Receipt, note: `Paid or confirmed, in ${currency}` },
        ]}
      />

      <div className="space-y-3">
        <Segmented<Tab> layoutId="bk-tab" value={tab} onChange={setTab} items={[
          { key: 'all', label: 'All', count: list.length },
          { key: 'upcoming', label: 'Upcoming', count: count('upcoming') },
          { key: 'awaiting', label: 'Waiting for supplier', count: count('awaiting'), dot: count('awaiting') > 0 },
          { key: 'payment', label: 'Payment not finished', count: count('payment') },
          { key: 'confirmed', label: 'Confirmed', count: count('confirmed') },
          { key: 'completed', label: 'Completed', count: count('completed') },
          { key: 'cancelled', label: 'Cancelled', count: count('cancelled') },
          ...(count('changes') ? [{ key: 'changes' as Tab, label: 'Change requests', count: count('changes'), dot: true }] : []),
        ]} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Reference, customer, email, phone, supplier, car…" className="h-11 w-full rounded-xl bg-white pl-10 pr-10 text-sm shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007ac2]/40" />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
          </div>
          <div className="flex gap-2">
            <select value={supplier} onChange={e => setSupplier(e.target.value)} aria-label="Supplier" className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#007ac2]/40 sm:w-48 sm:flex-none">
              <option value="all">All suppliers</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort" className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#007ac2]/40 sm:w-44 sm:flex-none">
              <option value="booked">Newest first</option>
              <option value="pickup">Pick-up date</option>
              <option value="value">Highest value</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>{num(filtered.length)} booking{filtered.length === 1 ? '' : 's'}{filtersOn ? ' match' : ''}</span>
          {filtersOn && <button onClick={() => { setTab('all'); setSupplier('all'); setQuery(''); }} className="font-semibold text-[#007ac2] hover:underline">Clear filters</button>}
        </div>
      </div>

      {busy ? (
        <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Inbox className="h-6 w-6" /></span>
          <p className="mt-3 text-sm font-semibold text-slate-900">{list.length ? 'No bookings match' : 'No bookings yet'}</p>
          <p className="mt-1 text-xs text-slate-500">{list.length ? 'Try another tab, supplier or search.' : 'New reservations appear here as soon as they are made.'}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 lg:block">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Car & supplier</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {page.map(b => {
                  const p = pickupAt(b), d = dropoffAt(b), days = rentalDays(b);
                  return (
                    <tr key={b.id} onClick={e => { if (!(e.target as HTMLElement).closest('button')) setViewing(b); }} className="cursor-pointer transition hover:bg-sky-50/40">
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-mono text-[13px] font-semibold text-slate-900">{b.bookingRef || `#${b.id}`}</p>
                        <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500" title={bookedAt(b)?.toLocaleString('en-GB')}>{agoText(bookedAt(b))}</p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{initials(b)}</span>
                          <span className="min-w-0">
                            <span className="block max-w-[160px] truncate font-semibold text-slate-900">{fullName(b)}</span>
                            <span className="block max-w-[160px] truncate text-xs text-slate-500">{b.email || b.phone || '—'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <CarThumb b={b} />
                          <span className="min-w-0">
                            <span className="block max-w-[170px] truncate font-medium text-slate-900">{carName(b)}</span>
                            <span className="block max-w-[170px] truncate text-xs text-slate-500">{b.supplierName || '—'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="flex items-center gap-1.5 whitespace-nowrap text-slate-900">{fmtDay(p)} <ArrowRight className="h-3 w-3 text-slate-400" /> {fmtDay(d)}{days ? <span className="text-xs text-slate-400">· {days} day{days === 1 ? '' : 's'}</span> : null}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{(b.startTime || '').slice(0, 5)} · {b.pickupCode || '—'}{b.dropoffCode && b.dropoffCode !== b.pickupCode ? ` → ${b.dropoffCode}` : ''}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right align-top">
                        <p className="font-semibold tabular-nums text-slate-900">{money(total(b), currencyOf(b))}</p>
                        <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500">{paidLine(b)}</p>
                      </td>
                      <td className="px-4 py-3.5 align-top"><StatusPill b={b} /></td>
                      <td className="px-5 py-3.5 text-right align-top">
                        <button onClick={() => setViewing(b)} aria-label={`Voucher ${b.bookingRef || ''}`} title="Open voucher" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-white hover:text-[#007ac2] hover:ring-[#007ac2]/40"><FileText className="h-3.5 w-3.5" /><span className="hidden 2xl:inline">Voucher</span></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phone and tablet cards */}
          <ul className="space-y-2 lg:hidden">
            {page.map(b => {
              const p = pickupAt(b), d = dropoffAt(b);
              return (
                <li key={b.id}>
                  <button onClick={() => setViewing(b)} className="w-full rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition active:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{fullName(b)}</p>
                        <p className="font-mono text-xs text-slate-500">{b.bookingRef || `#${b.id}`} · {agoText(bookedAt(b))}</p>
                      </div>
                      <StatusPill b={b} />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <CarThumb b={b} />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium text-slate-900">{carName(b)} <span className="font-normal text-slate-400">· {b.supplierName || '—'}</span></p>
                        <p className="truncate text-xs text-slate-500">{fmtDay(p)} → {fmtDay(d)} · {b.pickupCode || '—'}</p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-slate-900">{money(total(b), currencyOf(b))}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {filtered.length > shown && (
            <div className="flex justify-center">
              <button onClick={() => setShown(s => s + PAGE)} className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                Show more · {num(filtered.length - shown)} left
              </button>
            </div>
          )}
        </>
      )}

      <VoucherModal booking={viewing as any} audience="admin" onClose={() => setViewing(null)} onDownloadPdf={downloadPdf}
        extraActions={viewing && changeStatusOf(viewing) === 'REQUESTED' ? (
          <button onClick={() => setDeciding(viewing)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700">Review change</button>
        ) : null} />
      {deciding && <ChangeDecisionModal booking={deciding as any} onClose={() => setDeciding(null)} onDecide={decide} />}
      <Toast toast={toast} />
    </div>
  );
};

export default BookingsAdmin;
