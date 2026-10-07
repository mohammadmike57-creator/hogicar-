import React from 'react';
import { createPortal } from 'react-dom';
import qrcode from 'qrcode-generator';
import X from 'lucide-react/dist/esm/icons/x';
import Printer from 'lucide-react/dist/esm/icons/printer';
import Download from 'lucide-react/dist/esm/icons/download';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Snowflake from 'lucide-react/dist/esm/icons/snowflake';
import Fuel from 'lucide-react/dist/esm/icons/fuel';
import Gauge from 'lucide-react/dist/esm/icons/gauge';
import IdCard from 'lucide-react/dist/esm/icons/id-card';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { Logo } from './Logo';

export type VoucherAudience = 'customer' | 'supplier' | 'admin';

/** Booking as returned by the API (/api/bookings/ref, supplier and admin booking lists). */
export type VoucherBooking = Record<string, any>;

const SUPPORT_EMAIL = 'booking@hogicar.com';

const pick = (b: VoucherBooking, ...keys: string[]) => {
  for (const k of keys) if (b?.[k] !== undefined && b?.[k] !== null && b?.[k] !== '') return b[k];
  return undefined;
};

const titleCase = (v?: string) => String(v || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const fmtDate = (v?: string) => {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (v?: string) => {
  if (!v) return '';
  const [h, m] = v.split(':');
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return v;
  return `${String(hour).padStart(2, '0')}:${(m || '00').slice(0, 2)}`;
};
const money = (n: any, currency?: string) => {
  const v = Number(n);
  if (!isFinite(v)) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(v); }
  catch { return `${currency || ''} ${v.toFixed(2)}`.trim(); }
};
const days = (a?: string, b?: string) => {
  if (!a || !b) return null;
  const d = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
  return isFinite(d) && d > 0 ? d : null;
};

const STATUS: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  CONFIRMED: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CheckCircle },
  COMPLETED: { label: 'Completed', cls: 'bg-sky-50 text-sky-700 ring-sky-200', Icon: CheckCircle },
  PENDING: { label: 'Awaiting confirmation', cls: 'bg-amber-50 text-amber-800 ring-amber-200', Icon: Clock },
  MODIFIED: { label: 'Modified', cls: 'bg-violet-50 text-violet-700 ring-violet-200', Icon: Clock },
  CANCELLED: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 ring-rose-200', Icon: XCircle },
  REJECTED: { label: 'Not confirmed', cls: 'bg-rose-50 text-rose-700 ring-rose-200', Icon: XCircle },
};

const Qr: React.FC<{ value: string; size?: number }> = ({ value, size = 104 }) => {
  const cells = React.useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      const n = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c},${r}h1v1h-1z`;
      return { n, d };
    } catch { return null; }
  }, [value]);
  if (!cells) return null;
  return (
    <svg viewBox={`-1 -1 ${cells.n + 2} ${cells.n + 2}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="Voucher QR code">
      <rect x="-1" y="-1" width={cells.n + 2} height={cells.n + 2} fill="#fff" />
      <path d={cells.d} fill="#0f172a" />
    </svg>
  );
};

const SectionTitle: React.FC<{ n?: string; children: React.ReactNode }> = ({ n, children }) => (
  <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
    {n && <span className="text-accent">{n}</span>}{children}
  </h3>
);

const Field: React.FC<{ label: string; value?: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-slate-500">{label}</dt>
    <dd className={`mt-0.5 break-words text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
  </div>
);

/** The rental voucher document. Print-ready (A4) and responsive. */
export const RentalVoucher: React.FC<{ booking: VoucherBooking; audience?: VoucherAudience }> = ({ booking: b, audience = 'customer' }) => {
  const ref = pick(b, 'bookingRef') || `#${b.id}`;
  const status = STATUS[String(b.status || '').toUpperCase()] || STATUS.CONFIRMED;
  const currency = pick(b, 'currency') || 'USD';
  const carName = [pick(b, 'carMake'), pick(b, 'carModel')].filter(Boolean).join(' ') || pick(b, 'carName') || 'Rental car';
  const pickupDate = pick(b, 'pickupDate', 'startDate');
  const dropoffDate = pick(b, 'dropoffDate', 'endDate');
  const rentalDays = days(pickupDate, dropoffDate);
  const pickupName = pick(b, 'pickupLocationName') || pick(b, 'pickupCode');
  const dropoffName = pick(b, 'dropoffLocationName') || pick(b, 'dropoffCode') || pickupName;
  const driver = [pick(b, 'firstName'), pick(b, 'lastName')].filter(Boolean).join(' ') || pick(b, 'customerName');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hogicar.com';
  const voucherUrl = `${origin}/voucher?bookingRef=${encodeURIComponent(String(pick(b, 'bookingRef') || ''))}`;
  const issued = pick(b, 'createdAt', 'bookingDate');
  const payNow = Number(pick(b, 'payNow') ?? 0);
  const payAtDesk = Number(pick(b, 'payAtDesk') ?? 0);
  const total = Number(pick(b, 'finalPrice', 'totalPrice') ?? payNow + payAtDesk);
  const deposit = Number(pick(b, 'carDeposit') ?? 0);
  const fuel = pick(b, 'carFuelPolicy');
  const fuelLabel = fuel ? (String(fuel).toUpperCase() === 'FULL_TO_FULL' ? 'Full to full' : titleCase(fuel)) : undefined;

  const specs = [
    pick(b, 'carPassengers') && { Icon: Users, label: `${b.carPassengers} seats` },
    pick(b, 'carBags') && { Icon: Briefcase, label: `${b.carBags} bags` },
    pick(b, 'carTransmission') && { Icon: Settings2, label: titleCase(b.carTransmission) },
    b.carAirConditioning !== false && { Icon: Snowflake, label: 'Air conditioning' },
    fuelLabel && { Icon: Fuel, label: `Fuel: ${fuelLabel}` },
    { Icon: Gauge, label: b.carUnlimitedMileage === false ? 'Limited mileage' : 'Unlimited mileage' },
  ].filter(Boolean) as { Icon: React.ElementType; label: string }[];

  return (
    <article className="voucher-doc mx-auto print:text-[13px] w-full max-w-[860px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      {/* Header */}
      <header className="relative overflow-hidden bg-[#0b2545] px-6 py-6 text-white sm:px-8 print:py-3">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl print:hidden" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <Logo className="h-7 w-auto" variant="light" />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Rental voucher</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wide sm:text-3xl">{ref}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.cls}`}>
                <status.Icon className="h-3.5 w-3.5" /> {status.label}
              </span>
              {pick(b, 'supplierConfirmationNumber') && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
                  Supplier ref: <span className="font-mono">{b.supplierConfirmationNumber}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-xs text-sky-100 sm:block">
              <p>Show this voucher</p>
              <p>at the rental desk</p>
            </div>
            <div className="rounded-xl bg-white p-2 shadow-sm"><Qr value={voucherUrl} size={96} /></div>
          </div>
        </div>
      </header>

      {/* Trip */}
      <section className="grid gap-px bg-slate-200 sm:grid-cols-2 print:grid-cols-2">
        {[
          { label: 'Pick-up', date: pickupDate, time: pick(b, 'startTime'), place: pickupName, code: pick(b, 'pickupCode'), dot: 'bg-emerald-500' },
          { label: 'Drop-off', date: dropoffDate, time: pick(b, 'endTime'), place: dropoffName, code: pick(b, 'dropoffCode') || pick(b, 'pickupCode'), dot: 'bg-rose-500' },
        ].map(s => (
          <div key={s.label} className="bg-white px-6 py-5 sm:px-8 print:py-2.5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{fmtDate(s.date)}{s.time ? <span className="text-slate-500"> · {fmtTime(s.time)}</span> : null}</p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{s.place || '—'}{s.code && s.place !== s.code ? <span className="text-slate-500"> ({s.code})</span> : null}</span></p>
          </div>
        ))}
      </section>
      {rentalDays && (
        <p className="border-y border-slate-200 bg-slate-50 px-6 py-2 text-center text-xs font-medium text-slate-600 sm:px-8">Rental duration: {rentalDays} day{rentalDays === 1 ? '' : 's'}</p>
      )}

      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_300px] print:grid-cols-[minmax(0,1fr)_260px]">
        {/* Main column */}
        <div className="space-y-7 px-6 py-6 sm:px-8 md:border-r md:border-slate-200 print:space-y-3 print:py-3">
          {/* Car */}
          <section className="print:break-inside-avoid">
            <SectionTitle n="01">Vehicle</SectionTitle>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              {pick(b, 'carImage') && (
                <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-xl bg-slate-50 sm:w-40 print:h-16 print:w-28">
                  <img src={b.carImage} alt="" className="max-h-20 max-w-full object-contain print:max-h-14" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-semibold text-slate-900">{carName} <span className="text-sm font-normal text-slate-500">or similar</span></p>
                <p className="text-sm text-slate-500">{[titleCase(pick(b, 'carCategory')), pick(b, 'carSippCode')].filter(Boolean).join(' · ') || '—'}</p>
                <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  {specs.map(s => <li key={s.label} className="inline-flex items-center gap-1.5"><s.Icon className="h-3.5 w-3.5 text-slate-400" />{s.label}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* Driver */}
          <section className="print:break-inside-avoid">
            <SectionTitle n="02">Main driver</SectionTitle>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Field label="Name" value={driver} />
              <Field label="Email" value={pick(b, 'email', 'customerEmail')} />
              <Field label="Phone" value={pick(b, 'phone', 'customerPhone')} />
              <Field label="Flight number" value={pick(b, 'flightNumber')} />
              <Field label="Nationality" value={pick(b, 'nationality')} />
              <Field label="Booked on" value={issued ? fmtDate(String(issued)) : undefined} />
            </dl>
          </section>

          {/* Supplier */}
          <section>
            <SectionTitle n="03">Rental company</SectionTitle>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5">
                {pick(b, 'supplierLogoUrl') && b.supplierLogoUrl !== 'HOGICAR_CHOICE_LOGO'
                  ? <img src={b.supplierLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
                  : <span className="text-xs font-semibold text-slate-600">{String(pick(b, 'supplierName') || 'S').slice(0, 2).toUpperCase()}</span>}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{pick(b, 'supplierName') || '—'}</p>
                <p className="text-sm text-slate-500">Your car is supplied and serviced by this company.</p>
              </div>
            </div>
          </section>

          {/* Add-ons */}
          {pick(b, 'extrasSummary') && (
            <section>
              <SectionTitle n="04">Add-ons reserved</SectionTitle>
              <ul className="mt-3 space-y-1.5">
                {String(b.extrasSummary).split(';').map((x: string) => x.trim()).filter(Boolean).map((x: string) => (
                  <li key={x} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{x}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">Add-ons are paid at the rental desk and subject to availability.</p>
            </section>
          )}

          {/* What to bring */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:break-inside-avoid print:p-3">
            <p className="text-sm font-semibold text-slate-900">Bring to the rental desk</p>
            <ul className="mt-2.5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 print:mt-1.5 print:gap-1 print:text-xs">
              <li className="flex items-center gap-2"><IdCard className="h-4 w-4 text-accent" /> Main driver’s driving licence</li>
              <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Passport or national ID</li>
              <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-accent" /> Credit card in the driver’s name</li>
              <li className="flex items-center gap-2"><Plane className="h-4 w-4 text-accent" /> This voucher (printed or on phone)</li>
            </ul>
          </section>
        </div>

        {/* Payment column */}
        <aside className="space-y-5 bg-slate-50/60 px-6 py-6 sm:px-8 md:px-6 print:space-y-3 print:py-4">
          <section>
            <SectionTitle>Payment summary</SectionTitle>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-600">Rental total</dt><dd className="font-semibold tabular-nums">{money(total, currency)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-600">Paid online</dt><dd className="tabular-nums text-emerald-700">{money(payNow, currency)}</dd></div>
            </dl>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800">Pay at pick-up</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-amber-900">{money(payAtDesk, currency)}</p>
              {pick(b, 'extrasSummary') && <p className="mt-1 text-[11px] text-amber-800">Plus any add-ons priced at the desk.</p>}
            </div>
            {deposit > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Security deposit {money(deposit, currency)}</p>
                  <p className="text-xs text-slate-500">Held on the credit card at pick-up and released after return.</p>
                </div>
              </div>
            )}
          </section>

          {audience !== 'customer' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 print:p-3">
              <SectionTitle>{audience === 'admin' ? 'Commercial (internal)' : 'Your earnings'}</SectionTitle>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-600">Supplier net rate</dt><dd className="font-semibold tabular-nums">{money(pick(b, 'netPrice'), currency)}</dd></div>
                {audience === 'admin' && (
                  <>
                    <div className="flex justify-between gap-3"><dt className="text-slate-600">Commission</dt><dd className="tabular-nums">{money(pick(b, 'commissionAmount') ?? (Number(b.finalPrice || 0) - Number(b.netPrice || 0)), currency)}{b.commissionPercent ? <span className="text-slate-500"> ({Number(b.commissionPercent)}%)</span> : null}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-600">Booking ID</dt><dd className="font-mono">{b.id}</dd></div>
                  </>
                )}
              </dl>
              <p className="mt-2 text-[11px] text-slate-500 print:hidden">Not shown on the customer’s voucher.</p>
            </section>
          )}

          <section>
            <SectionTitle>Need help?</SectionTitle>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {SUPPORT_EMAIL}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-slate-400" /> <span>Quote <span className="whitespace-nowrap font-mono font-medium">{ref}</span></span></li>
            </ul>
          </section>
        </aside>
      </div>

      <footer className="border-t border-slate-200 px-6 py-4 text-[11px] leading-relaxed text-slate-500 sm:px-8 print:py-2.5 print:text-[10px]">
        This voucher confirms a car rental arranged by Hogicar. The rental is subject to the rental company’s terms and conditions, presented at the desk.
        The car shown is an example of the category; the exact model may vary. Issued {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
      </footer>
    </article>
  );
};

/** Full-screen voucher viewer with print / PDF actions. Printing prints only the voucher. */
export const VoucherModal: React.FC<{
  booking: VoucherBooking | null;
  audience?: VoucherAudience;
  onClose: () => void;
  onDownloadPdf?: () => void;
  extraActions?: React.ReactNode;
}> = ({ booking, audience = 'customer', onClose, onDownloadPdf, extraActions }) => {
  React.useEffect(() => {
    if (!booking) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('voucher-print');
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove('voucher-print');
    };
  }, [booking, onClose]);

  if (!booking || typeof document === 'undefined') return null;
  return createPortal(
    <div className="voucher-print-root fixed inset-0 z-[200] flex flex-col bg-slate-900/60 backdrop-blur-[2px] print:static print:bg-white" role="dialog" aria-modal="true" aria-label={`Rental voucher ${booking.bookingRef || ''}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 print:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Rental voucher</p>
          <p className="truncate font-mono text-xs text-slate-500">{booking.bookingRef || `#${booking.id}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {onDownloadPdf && (
            <button onClick={onDownloadPdf} className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex">
              <Download className="h-4 w-4" /> PDF
            </button>
          )}
          <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-700">
            <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print / Save as PDF</span><span className="sm:hidden">Print</span>
          </button>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close voucher"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-8 print:overflow-visible print:p-0">
        <RentalVoucher booking={booking} audience={audience} />
      </div>
    </div>,
    document.body,
  );
};

export default RentalVoucher;
