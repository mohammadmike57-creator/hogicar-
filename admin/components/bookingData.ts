// Shared booking figures for the admin Overview and Bookings sections.

export type AdminBooking = Record<string, any>;

export type StatusKey = 'PAYMENT_PENDING' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'MODIFIED' | 'CANCELLED';

/** How each booking status is named and coloured everywhere in the admin. */
export const STATUS: Record<StatusKey, { label: string; dot: string; pill: string; bar: string }> = {
  PENDING: { label: 'Awaiting supplier', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 ring-amber-200', bar: '#f59e0b' },
  PAYMENT_PENDING: { label: 'Awaiting payment', dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 ring-sky-200', bar: '#0ea5e9' },
  CONFIRMED: { label: 'Confirmed', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', bar: '#10b981' },
  COMPLETED: { label: 'Completed', dot: 'bg-[#007ac2]', pill: 'bg-blue-50 text-blue-800 ring-blue-200', bar: '#007ac2' },
  MODIFIED: { label: 'Modified', dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-800 ring-violet-200', bar: '#8b5cf6' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-rose-200', bar: '#f43f5e' },
};
export const STATUS_ORDER: StatusKey[] = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'MODIFIED', 'CANCELLED'];

export const statusOf = (b: AdminBooking): StatusKey => {
  const s = String(b?.status || '').toUpperCase() as StatusKey;
  return STATUS[s] ? s : 'PENDING';
};

/** Bookings that count towards sales: everything except cancelled and unpaid card bookings. */
export const counts = (b: AdminBooking) => !['CANCELLED', 'PAYMENT_PENDING'].includes(statusOf(b));

export const total = (b: AdminBooking) => Number(b.finalPrice ?? b.totalPrice) || 0;

/** Hogicar's share: the total minus the supplier's net rate (as in the team email), else the commission. */
export const earnings = (b: AdminBooking) => {
  const t = total(b);
  const net = Number(b.netPrice) || 0;
  const commission = Number(b.commissionAmount) || 0;
  return net > 0 ? Math.max(t - net, commission, 0) : Math.max(commission, 0);
};

export const currencyOf = (b: AdminBooking) => String(b.currency || 'USD').toUpperCase();

export const toDate = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime()) ? null : d;
};
export const bookedAt = (b: AdminBooking) => toDate(b.createdAt || b.bookingDate);
export const pickupAt = (b: AdminBooking) => toDate(b.pickupDate ? `${b.pickupDate}T${(b.startTime || '10:00').slice(0, 5)}:00` : null);
export const dropoffAt = (b: AdminBooking) => toDate(b.dropoffDate ? `${b.dropoffDate}T${(b.endTime || '10:00').slice(0, 5)}:00` : null);

export const rentalDays = (b: AdminBooking) => {
  const p = toDate(b.pickupDate), d = toDate(b.dropoffDate);
  return p && d ? Math.max(1, Math.round((d.getTime() - p.getTime()) / 86400000)) : null;
};

/** The currency most bookings use: totals are shown in it, never mixed with other currencies. */
export const mainCurrency = (list: AdminBooking[]) => {
  const n = new Map<string, number>();
  list.forEach(b => n.set(currencyOf(b), (n.get(currencyOf(b)) || 0) + 1));
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';
};

export const money = (n: number, currency = 'USD', compact = false) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      notation: compact && Math.abs(n) >= 10000 ? 'compact' : 'standard',
      maximumFractionDigits: compact ? (Math.abs(n) >= 10000 ? 1 : 0) : 2,
      minimumFractionDigits: compact ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(compact ? 0 : 2)}`;
  }
};

export const fmtDay = (d: Date | null, withYear = false) =>
  d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }) : '—';

export const fmtDateTime = (d: Date | null) =>
  d ? `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '—';

export const agoText = (d: Date | null) => {
  if (!d) return '—';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return fmtDay(d, true);
};

export const fullName = (b: AdminBooking) => [b.firstName, b.lastName].filter(Boolean).join(' ') || '—';
export const carName = (b: AdminBooking) => [b.carMake, b.carModel].filter(Boolean).join(' ') || 'Car';
export const initials = (b: AdminBooking) => `${(b.firstName || '?')[0] || ''}${(b.lastName || '')[0] || ''}`.toUpperCase();

/** "Up 12%" style change between two periods; null when there is nothing to compare. */
export const change = (now: number, before: number) => {
  if (!before) return now ? null : 0;
  return Math.round(((now - before) / before) * 100);
};
