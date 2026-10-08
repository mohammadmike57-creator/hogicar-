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
import CarFront from 'lucide-react/dist/esm/icons/car-front';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Info from 'lucide-react/dist/esm/icons/info';
import { Logo } from './Logo';

export type VoucherAudience = 'customer' | 'supplier' | 'admin';

/** Booking as returned by the API (/api/bookings/ref, supplier and admin booking lists). */
export type VoucherBooking = Record<string, any>;

const SUPPORT_EMAIL = 'business@hogicar.com';

const pick = (b: VoucherBooking, ...keys: string[]) => {
  for (const k of keys) if (b?.[k] !== undefined && b?.[k] !== null && b?.[k] !== '') return b[k];
  return undefined;
};

const titleCase = (v?: string) => String(v || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\bSuv\b/g, 'SUV').replace(/\bMpv\b/g, 'MPV');

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

export const Qr: React.FC<{ value: string; size?: number }> = ({ value, size = 104 }) => {
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

const SectionTitle: React.FC<{ icon?: React.ElementType; children: React.ReactNode; aside?: React.ReactNode }> = ({ icon: Icon, children, aside }) => (
  <div className="flex items-center justify-between gap-3">
    <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {Icon && <Icon className="h-3.5 w-3.5 text-accent" />}{children}
    </h3>
    {aside}
  </div>
);

const Field: React.FC<{ label: string; value?: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-slate-500">{label}</dt>
    <dd className={`mt-0.5 break-words text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
  </div>
);

/** Three-letter code for the big route line: the location code, else letters of the place name. */
const routeCode = (code?: string, name?: string) => {
  const c = String(code || '').trim().toUpperCase();
  if (/^[A-Z0-9]{2,5}$/.test(c)) return c;
  const letters = String(name || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  return letters.length >= 3 ? letters.slice(0, 3) : (c.slice(0, 4) || '—');
};

/** Ticket perforation with notches on both edges. */
const Perforation: React.FC = () => (
  <div className="relative h-6 print:h-3" aria-hidden="true">
    <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-100 shadow-[inset_-1px_0_0_#e2e8f0] print:hidden" />
    <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-100 shadow-[inset_1px_0_0_#e2e8f0] print:hidden" />
    <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-slate-200" />
  </div>
);

/** The rental voucher document: a boarding-pass style ticket. Print-ready (A4) and responsive. */
export const RentalVoucher: React.FC<{ booking: VoucherBooking; audience?: VoucherAudience }> = ({ booking: b, audience = 'customer' }) => {
  const ref = pick(b, 'bookingRef') || `#${b.id}`;
  const status = STATUS[String(b.status || '').toUpperCase()] || STATUS.CONFIRMED;
  const cancelled = /CANCEL|REJECT/.test(String(b.status || '').toUpperCase());
  const currency = pick(b, 'currency') || 'USD';
  const carName = [pick(b, 'carMake'), pick(b, 'carModel')].filter(Boolean).join(' ') || pick(b, 'carName') || 'Rental car';
  const pickupDate = pick(b, 'pickupDate', 'startDate');
  const dropoffDate = pick(b, 'dropoffDate', 'endDate');
  const rentalDays = days(pickupDate, dropoffDate);
  const pickupName = pick(b, 'pickupLocationName') || pick(b, 'pickupCode');
  const dropoffName = pick(b, 'dropoffLocationName') || pick(b, 'dropoffCode') || pickupName;
  const pickupCode = routeCode(pick(b, 'pickupCode'), pickupName);
  const dropoffCode = routeCode(pick(b, 'dropoffCode') || pick(b, 'pickupCode'), dropoffName);
  const sameReturn = pickupName === dropoffName;
  const driver = [pick(b, 'firstName'), pick(b, 'lastName')].filter(Boolean).join(' ') || pick(b, 'customerName');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.hogicar.com';
  const voucherUrl = `${origin}/voucher?bookingRef=${encodeURIComponent(String(pick(b, 'bookingRef') || ''))}`;
  const issued = pick(b, 'createdAt', 'bookingDate');
  const payNow = Number(pick(b, 'payNow') ?? 0);
  const payAtDesk = Number(pick(b, 'payAtDesk') ?? 0);
  const total = Number(pick(b, 'finalPrice', 'totalPrice') ?? payNow + payAtDesk);
  const deposit = Number(pick(b, 'carDeposit') ?? 0);
  const fuel = pick(b, 'carFuelPolicy');
  const fuelLabel = fuel ? (String(fuel).toUpperCase() === 'FULL_TO_FULL' ? 'Full to full' : titleCase(fuel)) : undefined;
  const extras = pick(b, 'extrasSummary') ? String(b.extrasSummary).split(';').map((x: string) => x.trim()).filter(Boolean) : [];

  const specs = [
    pick(b, 'carPassengers') && { Icon: Users, label: `${b.carPassengers} seats` },
    pick(b, 'carBags') && { Icon: Briefcase, label: `${b.carBags} bags` },
    pick(b, 'carTransmission') && { Icon: Settings2, label: titleCase(b.carTransmission) },
    b.carAirConditioning !== false && { Icon: Snowflake, label: 'Air conditioning' },
    fuelLabel && { Icon: Fuel, label: `Fuel: ${fuelLabel}` },
    { Icon: Gauge, label: b.carUnlimitedMileage === false ? 'Limited mileage' : 'Unlimited mileage' },
  ].filter(Boolean) as { Icon: React.ElementType; label: string }[];

  const ends = [
    { key: 'pickup', label: 'Pick-up', code: pickupCode, date: pickupDate, time: pick(b, 'startTime'), place: pickupName },
    { key: 'return', label: 'Return', code: dropoffCode, date: dropoffDate, time: pick(b, 'endTime'), place: sameReturn ? 'Same location' : dropoffName },
  ];

  return (
    <article className="voucher-doc relative mx-auto w-full max-w-[880px] overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 print:max-w-none print:rounded-none print:text-[12.5px] print:shadow-none print:ring-0">
      {cancelled && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
          <span className="-rotate-12 rounded-2xl border-[5px] border-rose-500/70 px-8 py-2 text-5xl font-black uppercase tracking-[0.2em] text-rose-500/70 sm:text-7xl">Cancelled</span>
        </div>
      )}

      {/* Header */}
      <header className="relative overflow-hidden bg-[#0b2545] text-white print:bg-[#0b2545]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/35 blur-3xl print:hidden" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl print:hidden" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07] print:hidden" aria-hidden="true">
          <defs><pattern id="vgrid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#fff" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#vgrid)" />
        </svg>
        <div className="relative px-5 pb-6 pt-5 sm:px-8 sm:pb-7 sm:pt-6 print:px-6 print:py-3">
          <div className="flex items-center justify-between gap-4">
            <Logo className="h-6 w-auto sm:h-7" variant="light" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100 ring-1 ring-inset ring-white/15">Rental voucher</span>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5 print:mt-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-200/90">Booking reference</p>
              <p className="mt-1 font-mono text-[28px] font-semibold leading-none tracking-[0.06em] sm:text-4xl">{ref}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.cls}`}>
                  <status.Icon className="h-3.5 w-3.5" /> {status.label}
                </span>
                {pick(b, 'supplierConfirmationNumber') && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
                    Supplier ref <span className="font-mono">{b.supplierConfirmationNumber}</span>
                  </span>
                )}
                {issued && <span className="text-xs text-sky-100/80">Booked {fmtDate(String(issued))}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="hidden text-right text-xs leading-relaxed text-sky-100/90 sm:block">
                <p className="font-semibold text-white">Scan at the desk</p>
                <p>or show the reference</p>
              </div>
              <div className="rounded-2xl bg-white p-2 shadow-lg shadow-black/20 ring-1 ring-white/40"><Qr value={voucherUrl} size={92} /></div>
            </div>
          </div>
        </div>
      </header>

      {/* Route */}
      <section className="relative px-5 pb-2 pt-6 sm:px-8 print:px-6 print:pt-3" aria-label="Trip">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-6">
          {ends.map((e, i) => (
            <React.Fragment key={e.key}>
              {i === 1 && (
                <div className="flex flex-col items-center pt-6 sm:pt-7">
                  <div className="flex items-center gap-1.5 text-slate-300 sm:gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="h-px w-5 border-t-2 border-dotted border-slate-300 sm:w-14" />
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30 sm:h-9 sm:w-9"><CarFront className="h-4 w-4" /></span>
                    <span className="h-px w-5 border-t-2 border-dotted border-slate-300 sm:w-14" />
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </div>
                  {rentalDays && <span className="mt-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{rentalDays} day{rentalDays === 1 ? '' : 's'}</span>}
                </div>
              )}
              <div className={`min-w-0 ${i === 1 ? 'text-right' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{e.label}</p>
                <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-[#0b2545] sm:text-5xl print:text-4xl">{e.code}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">{fmtDate(e.date)}</p>
                {e.time && <p className="text-sm font-medium text-accent">{fmtTime(e.time)}</p>}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-6">
          <p className="flex items-start gap-1.5 text-[13px] text-slate-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><span className="min-w-0">{pickupName || '—'}</span></p>
          <p className="flex items-start gap-1.5 text-[13px] text-slate-600 sm:justify-end sm:text-right"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500 sm:order-2" /><span className="min-w-0">{sameReturn ? `Same as pick-up` : (dropoffName || '—')}</span></p>
        </div>
      </section>

      <Perforation />

      <div className="grid md:grid-cols-[minmax(0,1fr)_300px] print:grid-cols-[minmax(0,1fr)_250px]">
        {/* Main column */}
        <div className="space-y-6 px-5 pb-6 pt-2 sm:px-8 print:space-y-3 print:px-6 print:pb-3">
          {/* Car */}
          <section className="print:break-inside-avoid">
            <SectionTitle icon={CarFront}>Your car</SectionTitle>
            <div className="mt-3 flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center print:p-2.5">
              {pick(b, 'carImage') && (
                <div className="flex h-28 w-full shrink-0 items-center justify-center sm:w-44 print:h-16 print:w-28">
                  <img src={b.carImage} alt="" onError={e => { const box = (e.currentTarget.parentElement as HTMLElement | null); if (box) box.style.display = 'none'; }} className="max-h-full max-w-full object-contain drop-shadow-[0_12px_14px_rgba(15,23,42,0.18)]" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug text-slate-900">{carName} <span className="text-sm font-normal text-slate-500">or similar</span></p>
                <p className="text-sm text-slate-500">{[titleCase(pick(b, 'carCategory')), pick(b, 'carSippCode')].filter(Boolean).join(' · ') || '—'}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {specs.map(s => <li key={s.label} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"><s.Icon className="h-3.5 w-3.5 text-slate-400" />{s.label}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* Driver */}
          <section className="print:break-inside-avoid">
            <SectionTitle icon={IdCard}>Main driver</SectionTitle>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Field label="Name" value={driver} />
              <Field label="Email" value={pick(b, 'email', 'customerEmail')} />
              <Field label="Phone" value={pick(b, 'phone', 'customerPhone')} />
              <Field label="Flight number" value={pick(b, 'flightNumber')} />
              <Field label="Nationality" value={pick(b, 'nationality')} />
              <Field label="Rental days" value={rentalDays ? String(rentalDays) : undefined} />
            </dl>
          </section>

          {/* Supplier */}
          <section className="print:break-inside-avoid">
            <SectionTitle icon={Building2}>Rental company</SectionTitle>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-slate-200">
                {pick(b, 'supplierLogoUrl') && b.supplierLogoUrl !== 'HOGICAR_CHOICE_LOGO'
                  ? <img src={b.supplierLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
                  : <span className="text-xs font-semibold text-slate-600">{String(pick(b, 'supplierName') || 'S').slice(0, 2).toUpperCase()}</span>}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{pick(b, 'supplierName') || '—'}</p>
                <p className="text-sm text-slate-500">Your car is supplied and serviced by this company.</p>
              </div>
            </div>
          </section>

          {/* Add-ons */}
          {extras.length > 0 && (
            <section className="print:break-inside-avoid">
              <SectionTitle icon={CheckCircle}>Add-ons reserved</SectionTitle>
              <ul className="mt-3 flex flex-wrap gap-2">
                {extras.map((x: string) => (
                  <li key={x} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900 ring-1 ring-emerald-100"><CheckCircle className="h-3.5 w-3.5 text-emerald-600" />{x}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">Add-ons are paid at the rental desk and subject to availability.</p>
            </section>
          )}

          {/* Supplier promotion */}
          {pick(b, 'promotionSummary') && (
            <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-4 print:break-inside-avoid print:p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-orange-500 text-sm font-bold text-white">%</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Promotion applied</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{String(b.promotionSummary)}</p>
                <p className="mt-0.5 text-xs text-slate-600">Offered by the rental company and already reflected in your price. Free add-ons are honoured at the desk.</p>
              </div>
            </section>
          )}

          {/* What to bring */}
          <section className="rounded-2xl bg-[#0b2545]/[0.03] p-4 ring-1 ring-slate-200 print:break-inside-avoid print:p-3">
            <p className="text-sm font-semibold text-slate-900">Bring to the rental desk</p>
            <ul className="mt-3 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-2 print:mt-1.5 print:gap-1 print:text-xs">
              {[
                { Icon: IdCard, t: 'Main driver’s driving licence' },
                { Icon: FileText, t: 'Passport or national ID' },
                { Icon: CreditCard, t: 'Credit card in the driver’s name' },
                { Icon: Plane, t: 'This voucher, printed or on your phone' },
              ].map(x => (
                <li key={x.t} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-accent ring-1 ring-slate-200"><x.Icon className="h-3.5 w-3.5" /></span>{x.t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Payment column */}
        <aside className="space-y-5 border-t border-slate-200 bg-slate-50/70 px-5 py-6 sm:px-8 md:border-l md:border-t-0 md:px-6 print:space-y-3 print:border-l print:border-t-0 print:px-4 print:py-3">
          <section>
            <SectionTitle icon={CreditCard}>Payment</SectionTitle>
            <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <dl className="space-y-2.5 p-4 text-sm print:p-3">
                <div className="flex justify-between gap-3"><dt className="text-slate-600">Rental total</dt><dd className="font-semibold tabular-nums">{money(total, currency)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-600">Paid online</dt><dd className="inline-flex items-center gap-1 tabular-nums text-emerald-700"><CheckCircle className="h-3.5 w-3.5" />{money(payNow, currency)}</dd></div>
              </dl>
              <div className="border-t border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3.5 print:px-3 print:py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pay at pick-up</p>
                <p className="mt-0.5 text-[28px] font-bold leading-tight tabular-nums text-amber-950">{money(payAtDesk, currency)}</p>
                {extras.length > 0 && <p className="text-[11px] text-amber-800">Plus any add-ons priced at the desk.</p>}
              </div>
            </div>
            {deposit > 0 && (
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Security deposit {money(deposit, currency)}</p>
                  <p className="text-xs text-slate-500">Held on the credit card at pick-up and released after return.</p>
                </div>
              </div>
            )}
          </section>

          {audience !== 'customer' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 print:p-3">
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
            <SectionTitle icon={Phone}>Need help?</SectionTitle>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-slate-400" /> <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-accent">{SUPPORT_EMAIL}</a></li>
              <li className="flex items-center gap-2"><Info className="h-4 w-4 shrink-0 text-slate-400" /> <span>Quote <span className="whitespace-nowrap font-mono font-medium">{ref}</span></span></li>
            </ul>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 text-[11px] leading-relaxed text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 print:px-6 print:py-2 print:text-[9.5px]">
        <p className="max-w-[560px]">
          This voucher confirms a car rental arranged by Hogicar, subject to the rental company’s terms presented at the desk.
          The car shown is an example of the category; the exact model may vary.
        </p>
        <p className="shrink-0 font-mono text-slate-400">{ref} · Issued {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
      <div className="flex-1 overflow-y-auto bg-slate-100 px-3 py-5 sm:px-6 sm:py-8 print:overflow-visible print:bg-white print:p-0">
        <RentalVoucher booking={booking} audience={audience} />
      </div>
    </div>,
    document.body,
  );
};

export default RentalVoucher;
