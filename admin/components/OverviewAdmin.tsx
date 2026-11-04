import * as React from 'react';
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import Building from 'lucide-react/dist/esm/icons/building-2';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CarFront from 'lucide-react/dist/esm/icons/car-front';
import Info from 'lucide-react/dist/esm/icons/info';
import { Hero, heroButton, num } from './commercialUi';
import { changeStatusOf } from '../../utils/changeRequest';
import {
  AdminBooking, STATUS, STATUS_ORDER, statusOf, counts, total, earnings, currencyOf, bookedAt, pickupAt, mainCurrency,
  money, fmtDay, fmtDateTime, agoText, fullName, carName, initials, change,
} from './bookingData';

type Period = 7 | 30 | 90;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const trend = (pct: number | null, period: Period) =>
  pct === null ? `New vs previous ${period} days`
    : pct === 0 ? `Same as previous ${period} days`
    : pct >= 900 ? `▲ over 10× the previous ${period} days`
    : `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs previous ${period} days`;

const Card: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, subtitle, action, className = '', children }) => (
  <section className={`overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 ${className}`}>
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const linkBtn = 'inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#007ac2] hover:bg-sky-50';

/** Admin › Overview: how Hogicar is doing, and what needs attention today. */
const OverviewAdmin: React.FC<{
  bookings: AdminBooking[];
  loading?: boolean;
  pendingApplications: number;
  activeSuppliers: number;
  onNavigate: (section: string) => void;
  onRefresh: () => void;
}> = ({ bookings, loading, pendingApplications, activeSuppliers, onNavigate, onRefresh }) => {
  const [period, setPeriod] = React.useState<Period>(() => {
    try { return (Number(localStorage.getItem('hc_overview_period')) as Period) || 30; } catch { return 30; }
  });
  React.useEffect(() => { try { localStorage.setItem('hc_overview_period', String(period)); } catch { /* ignore */ } }, [period]);

  const list = Array.isArray(bookings) ? bookings : [];
  const currency = mainCurrency(list);
  const busy = loading && list.length === 0;

  const data = React.useMemo(() => {
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (period - 1));
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - period);
    const inRange = (b: AdminBooking, from: Date, to: Date) => { const d = bookedAt(b); return !!d && d >= from && d < to; };
    const same = (b: AdminBooking) => currencyOf(b) === currency;
    const cur = list.filter(b => inRange(b, start, new Date(now.getTime() + 1)));
    const prev = list.filter(b => inRange(b, prevStart, start));
    const sales = (l: AdminBooking[]) => l.filter(b => counts(b) && same(b));
    const sum = (l: AdminBooking[], f: (b: AdminBooking) => number) => l.reduce((a, b) => a + f(b), 0);

    const curSales = sales(cur), prevSales = sales(prev);
    const value = sum(curSales, total), prevValue = sum(prevSales, total);
    const earned = sum(curSales, earnings), prevEarned = sum(prevSales, earnings);
    const otherCurrency = cur.filter(b => counts(b) && !same(b)).length;

    // Daily (7/30 days) or weekly (90 days) chart
    const step = period === 90 ? 7 : 1;
    const chart: { name: string; value: number; bookings: number }[] = [];
    for (let i = 0; i < period; i += step) {
      const from = new Date(start); from.setDate(from.getDate() + i);
      const to = new Date(from); to.setDate(to.getDate() + step);
      const l = curSales.filter(b => inRange(b, from, to));
      chart.push({ name: step === 7 ? `w/c ${fmtDay(from)}` : fmtDay(from), value: Math.round(sum(l, total)), bookings: l.length });
    }

    const byStatus = STATUS_ORDER.map(k => ({ key: k, n: cur.filter(b => statusOf(b) === k).length }));
    const group = (key: (b: AdminBooking) => string) => {
      const m = new Map<string, { n: number; value: number }>();
      curSales.forEach(b => { const k = key(b) || '—'; const e = m.get(k) || { n: 0, value: 0 }; e.n++; e.value += total(b); m.set(k, e); });
      return [...m.entries()].sort((a, b) => b[1].n - a[1].n || b[1].value - a[1].value).slice(0, 5);
    };

    const inWeek = new Date(now); inWeek.setDate(inWeek.getDate() + 7);
    const upcoming = list
      .filter(b => ['CONFIRMED', 'PENDING', 'MODIFIED'].includes(statusOf(b)))
      .filter(b => { const p = pickupAt(b); return !!p && p >= now && p <= inWeek; })
      .sort((a, b) => (pickupAt(a)?.getTime() || 0) - (pickupAt(b)?.getTime() || 0));

    const hourAgo = now.getTime() - 3600000;
    return {
      value, prevValue, earned, prevEarned, otherCurrency,
      bookings: cur.length, prevBookings: prev.length,
      avg: curSales.length ? value / curSales.length : 0,
      prevAvg: prevSales.length ? prevValue / prevSales.length : 0,
      chart, byStatus, totalInPeriod: cur.length,
      suppliers: group(b => b.supplierName), locations: group(b => b.pickupCode),
      upcoming,
      attention: {
        awaitingSupplier: list.filter(b => statusOf(b) === 'PENDING').length,
        awaitingPayment: list.filter(b => statusOf(b) === 'PAYMENT_PENDING' && (bookedAt(b)?.getTime() || 0) < hourAgo).length,
        changes: list.filter(b => changeStatusOf(b) === 'REQUESTED').length,
      },
      recent: [...list].sort((a, b) => (bookedAt(b)?.getTime() || 0) - (bookedAt(a)?.getTime() || 0)).slice(0, 6),
    };
  }, [list, period, currency]);

  const attention = [
    { n: data.attention.awaitingSupplier, label: 'Waiting for the supplier', hint: 'On-request bookings the supplier has not confirmed yet', Icon: Clock, tone: 'text-amber-600 bg-amber-50', go: 'bookings' },
    { n: data.attention.changes, label: 'Change requests', hint: 'Customers asking to change dates or times', Icon: Repeat, tone: 'text-violet-600 bg-violet-50', go: 'bookings' },
    { n: data.attention.awaitingPayment, label: 'Card payment not finished', hint: 'Started over an hour ago and not paid', Icon: CreditCard, tone: 'text-sky-600 bg-sky-50', go: 'bookings' },
    { n: pendingApplications, label: 'Supplier applications', hint: 'Companies waiting to join Hogicar', Icon: Building, tone: 'text-[#007ac2] bg-sky-50', go: 'supplierrequests' },
  ];
  const open = attention.filter(a => a.n > 0);
  const maxStatus = Math.max(1, ...data.byStatus.map(s => s.n));

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Overview" eyebrowIcon={LayoutDashboard}
        title={greeting()}
        subtitle={`How Hogicar is doing over the last ${period} days, and what needs your attention today.`}
        loading={busy}
        actions={<>
          <div className="inline-flex rounded-xl bg-white/10 p-1 ring-1 ring-inset ring-white/20">
            {([7, 30, 90] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`h-9 rounded-lg px-3 text-sm font-semibold transition ${period === p ? 'bg-white text-[#0b2545] shadow' : 'text-white/80 hover:text-white'}`}>{p} days</button>
            ))}
          </div>
          <button onClick={onRefresh} className={heroButton} aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
        </>}
        kpis={[
          { label: 'Booking value', value: money(data.value, currency, true), Icon: Receipt, note: trend(change(data.value, data.prevValue), period) },
          { label: "Hogicar's earnings", value: money(data.earned, currency, true), Icon: Wallet, note: trend(change(data.earned, data.prevEarned), period) },
          { label: 'Bookings', value: num(data.bookings), Icon: CalendarCheck, note: trend(change(data.bookings, data.prevBookings), period) },
          { label: 'Average booking', value: money(data.avg, currency, true), Icon: Gauge, note: trend(change(Math.round(data.avg), Math.round(data.prevAvg)), period) },
        ]}
      />

      {data.otherCurrency > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-white px-4 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          Amounts are in {currency}. {num(data.otherCurrency)} booking{data.otherCurrency === 1 ? '' : 's'} in other currencies {data.otherCurrency === 1 ? 'is' : 'are'} counted in Bookings but not added to the amounts.
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Booking value" subtitle={`${money(data.value, currency)} from ${num(data.chart.reduce((a, d) => a + d.bookings, 0))} paid or confirmed bookings · ${period === 90 ? 'by week' : 'by day'}`}>
          <div className="h-[240px] px-2 pb-3 pt-4 sm:h-[300px] sm:px-4">
            {busy ? <div className="h-full animate-pulse rounded-xl bg-slate-100" /> : (
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={0}>
                <ComposedChart data={data.chart} margin={{ left: 0, right: 4, top: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ovValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#007ac2" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#007ac2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis yAxisId="v" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={52} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))} />
                  <YAxis yAxisId="n" orientation="right" hide allowDecimals={false} domain={[0, (max: number) => Math.max(1, max * 2.5)]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,122,194,0.06)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgb(15 23 42 / 0.10)', padding: '8px 12px', fontSize: 12 }}
                    formatter={(v: any, name: any) => (name === 'value' ? [money(Number(v), currency), 'Booking value'] : [v, 'Bookings'])}
                  />
                  <Bar yAxisId="n" dataKey="bookings" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Area yAxisId="v" type="monotone" dataKey="value" stroke="#007ac2" strokeWidth={2.25} fill="url(#ovValue)" dot={false} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#007ac2]" /> Booking value ({currency})</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Bookings</span>
          </div>
        </Card>

        <Card title="Needs attention" subtitle={open.length ? 'Work waiting for the Hogicar team' : 'Nothing is waiting for you'}>
          {open.length ? (
            <ul className="divide-y divide-slate-100">
              {attention.map(a => (
                <li key={a.label}>
                  <button onClick={() => onNavigate(a.go)} disabled={!a.n} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent sm:px-5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.tone}`}><a.Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{a.label}</span>
                      <span className="block truncate text-xs text-slate-500">{a.hint}</span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-slate-900">{a.n}</span>
                    {a.n > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle className="h-6 w-6" /></span>
              <p className="mt-3 text-sm font-semibold text-slate-900">All caught up</p>
              <p className="mt-1 text-xs text-slate-500">No bookings, changes or applications are waiting.</p>
            </div>
          )}
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{num(activeSuppliers)} active supplier{activeSuppliers === 1 ? '' : 's'}</div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Bookings by status" subtitle={`${num(data.totalInPeriod)} booked in the last ${period} days`}>
          <ul className="space-y-3.5 px-5 py-4">
            {data.byStatus.map(s => (
              <li key={s.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700"><span className={`h-2 w-2 rounded-full ${STATUS[s.key].dot}`} />{STATUS[s.key].label}</span>
                  <span className="tabular-nums font-medium text-slate-900">{s.n}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${(s.n / maxStatus) * 100}%`, background: STATUS[s.key].bar }} /></div>
              </li>
            ))}
          </ul>
        </Card>
        {([['Top suppliers', data.suppliers, Building], ['Top pick-up locations', data.locations, MapPin]] as const).map(([title, rows, Icon]) => {
          const max = Math.max(1, ...rows.map(([, v]) => v.n));
          return (
            <Card key={title} title={title} subtitle={`By paid or confirmed bookings, last ${period} days`}>
              {rows.length ? (
                <ul className="space-y-3.5 px-5 py-4">
                  {rows.map(([name, v]) => (
                    <li key={name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-slate-700"><Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{name}</span></span>
                        <span className="shrink-0 tabular-nums text-slate-900"><span className="font-medium">{v.n}</span> <span className="text-xs text-slate-400">· {money(v.value, currency, true)}</span></span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#007ac2]" style={{ width: `${(v.n / max) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="px-5 py-10 text-center text-sm text-slate-500">No bookings in this period.</p>}
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Pick-ups in the next 7 days" subtitle={`${num(data.upcoming.length)} car${data.upcoming.length === 1 ? '' : 's'} to hand over`} action={<button onClick={() => onNavigate('bookings')} className={linkBtn}>All bookings <ChevronRight className="h-3.5 w-3.5" /></button>}>
          {data.upcoming.length ? (
            <ul className="divide-y divide-slate-100">
              {data.upcoming.slice(0, 6).map(b => {
                const p = pickupAt(b);
                return (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-slate-50 py-1.5 ring-1 ring-inset ring-slate-200">
                      <span className="text-[10px] font-semibold uppercase text-slate-500">{p?.toLocaleDateString('en-GB', { month: 'short' })}</span>
                      <span className="text-base font-semibold leading-none text-slate-900">{p?.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{fullName(b)} <span className="font-normal text-slate-400">· {carName(b)}</span></span>
                      <span className="block truncate text-xs text-slate-500">{p?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {b.pickupCode || '—'} · {b.supplierName || '—'}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS[statusOf(b)].pill}`}>{STATUS[statusOf(b)].label}</span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="px-5 py-10 text-center text-sm text-slate-500">No pick-ups in the next 7 days.</p>}
        </Card>

        <Card title="Latest bookings" subtitle="The newest reservations across all suppliers" action={<button onClick={() => onNavigate('bookings')} className={linkBtn}>View all <ChevronRight className="h-3.5 w-3.5" /></button>}>
          {data.recent.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recent.map(b => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{initials(b)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{fullName(b)} <span className="font-mono text-xs font-normal text-slate-400">{b.bookingRef}</span></span>
                    <span className="block truncate text-xs text-slate-500"><CarFront className="mr-1 inline h-3 w-3" />{carName(b)} · {b.supplierName || '—'} · {agoText(bookedAt(b))}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{money(total(b), currencyOf(b))}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS[statusOf(b)].pill}`}>{STATUS[statusOf(b)].label}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-10 text-center text-sm text-slate-500">No bookings yet.</p>}
          {data.recent.length > 0 && <p className="border-t border-slate-100 px-5 py-2.5 text-[11px] text-slate-400">Last booking {fmtDateTime(bookedAt(data.recent[0]))}</p>}
        </Card>
      </div>
    </div>
  );
};

export default OverviewAdmin;
