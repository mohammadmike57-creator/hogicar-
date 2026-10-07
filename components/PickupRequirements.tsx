import React from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';

// ---- Illustrations (flat with a soft drop shadow, drawn for Hogicar) ----

const LicenceArt = () => (
  <svg viewBox="0 0 120 96" className="h-full w-full" aria-hidden="true">
    <ellipse cx="60" cy="86" rx="40" ry="5" fill="#0f172a" opacity=".08" />
    <rect x="12" y="20" width="96" height="60" rx="10" fill="#1d5fd1" />
    <rect x="12" y="16" width="96" height="60" rx="10" fill="#3b82f6" />
    <rect x="18" y="22" width="84" height="48" rx="6" fill="#dbeafe" />
    <rect x="18" y="22" width="84" height="10" rx="5" fill="#bfdbfe" />
    <rect x="24" y="36" width="26" height="28" rx="4" fill="#fff" />
    <circle cx="37" cy="47" r="7" fill="#fdba74" />
    <path d="M30 45.5c0-5 3.2-8 7-8s7 3 7 8c-1.8-2.2-4.2-3-7-3s-5.2.8-7 3Z" fill="#ea580c" />
    <path d="M27.5 64c1.4-5 5-8 9.5-8s8.1 3 9.5 8Z" fill="#2563eb" />
    <rect x="56" y="38" width="38" height="4" rx="2" fill="#93c5fd" />
    <rect x="56" y="46" width="30" height="4" rx="2" fill="#93c5fd" />
    <rect x="56" y="54" width="34" height="4" rx="2" fill="#93c5fd" />
    <rect x="22" y="25" width="22" height="4" rx="2" fill="#fff" opacity=".9" />
  </svg>
);

const PassportArt = () => (
  <svg viewBox="0 0 120 96" className="h-full w-full" aria-hidden="true">
    <ellipse cx="60" cy="88" rx="30" ry="5" fill="#0f172a" opacity=".08" />
    <g transform="rotate(6 60 48)">
      <rect x="34" y="8" width="54" height="76" rx="6" fill="#1e40af" />
      <rect x="30" y="8" width="54" height="76" rx="6" fill="#3b6fe0" />
      <rect x="30" y="8" width="7" height="76" rx="3" fill="#2f5fcc" />
      <circle cx="60" cy="42" r="14" fill="none" stroke="#1e3a8a" strokeWidth="3" />
      <ellipse cx="60" cy="42" rx="6" ry="14" fill="none" stroke="#1e3a8a" strokeWidth="2.5" />
      <path d="M46 42h28M48 35h24M48 49h24" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="46" y="66" width="28" height="4" rx="2" fill="#1e3a8a" opacity=".7" />
    </g>
  </svg>
);

const CardArt = () => (
  <svg viewBox="0 0 120 96" className="h-full w-full" aria-hidden="true">
    <ellipse cx="60" cy="84" rx="40" ry="5" fill="#0f172a" opacity=".08" />
    <rect x="12" y="22" width="96" height="58" rx="10" fill="#d97706" />
    <rect x="12" y="18" width="96" height="58" rx="10" fill="#fbbf24" />
    <rect x="12" y="30" width="96" height="10" fill="#f59e0b" opacity=".55" />
    <rect x="22" y="46" width="16" height="12" rx="3" fill="#fef3c7" />
    <path d="M22 52h16M30 46v12" stroke="#f59e0b" strokeWidth="1.2" />
    <circle cx="86" cy="62" r="7" fill="#fff" opacity=".85" />
    <circle cx="95" cy="62" r="7" fill="#fff" opacity=".55" />
    <rect x="22" y="64" width="12" height="4" rx="2" fill="#fff" opacity=".9" />
    <rect x="38" y="64" width="12" height="4" rx="2" fill="#fff" opacity=".9" />
    <rect x="54" y="64" width="12" height="4" rx="2" fill="#fff" opacity=".9" />
    <text x="22" y="28" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="#fff" letterSpacing=".5" opacity=".95">CREDIT</text>
  </svg>
);

const VoucherArt = () => (
  <svg viewBox="0 0 120 96" className="h-full w-full" aria-hidden="true">
    <ellipse cx="60" cy="90" rx="32" ry="5" fill="#0f172a" opacity=".08" />
    <g transform="rotate(-6 60 50)">
      <rect x="32" y="14" width="58" height="74" rx="7" fill="#1e293b" />
      <rect x="36" y="20" width="50" height="62" rx="3" fill="#f8fafc" />
      <rect x="49" y="9" width="24" height="12" rx="4" fill="#94a3b8" />
      <circle cx="61" cy="9" r="4" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
      <rect x="42" y="30" width="26" height="4" rx="2" fill="#0ea5e9" />
      <rect x="42" y="40" width="38" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="42" y="47" width="32" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="42" y="54" width="36" height="3" rx="1.5" fill="#cbd5e1" />
      <circle cx="73" cy="70" r="7" fill="#10b981" />
      <path d="m69.8 70 2.2 2.2 4-4.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

interface Requirement {
  title: string;
  text: string;
  question: string;
  answer: string;
  Art: React.FC;
  tint: string;
}

const REQUIREMENTS: Requirement[] = [
  {
    title: 'Driving licence',
    text: 'A valid driving licence in the main driver’s name, usually held for at least 1 year.',
    question: 'What type of driving licence do I need?',
    answer: 'A full licence printed in Latin letters is accepted almost everywhere. If yours is in another alphabet (for example Arabic or Cyrillic), bring an International Driving Permit together with your original licence. Digital or temporary paper licences are usually not accepted.',
    Art: LicenceArt,
    tint: 'from-sky-50 to-blue-100/70',
  },
  {
    title: 'Passport or ID',
    text: 'A passport or national ID card for the main driver, matching the name on the booking.',
    question: 'Will I need my passport to pick up the car?',
    answer: 'Visitors from abroad should bring their passport. Residents can usually use a national ID card instead. The name must match the driving licence and the booking.',
    Art: PassportArt,
    tint: 'from-indigo-50 to-blue-100/70',
  },
  {
    title: 'Credit card',
    text: 'A credit card in the main driver’s name with enough available funds for the security deposit.',
    question: 'I don’t have a credit card. Can I still rent a car?',
    answer: 'Most rental companies need a credit card for the deposit. Some accept debit cards or a cash deposit, so check the rental terms on the car you choose before you book.',
    Art: CardArt,
    tint: 'from-amber-50 to-yellow-100/70',
  },
  {
    title: 'Booking voucher',
    text: 'Your Hogicar voucher, printed or on your phone, with your booking reference.',
    question: 'What is a voucher and where can I find it?',
    answer: 'The voucher confirms your booking, what is included and how to find the desk. We email it as soon as the booking is confirmed, and you can always download it again from My bookings.',
    Art: VoucherArt,
    tint: 'from-emerald-50 to-teal-100/70',
  },
];

/** Home page section: the documents a customer needs at the rental desk. */
const PickupRequirements: React.FC = () => {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <section className="bg-white py-16 sm:py-24" aria-labelledby="pickup-requirements-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Before you travel</p>
          <h2 id="pickup-requirements-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">What do you need to pick up the car?</h2>
          <p className="mt-3 text-base text-slate-600">Bring these four things to the rental desk and you’ll be on the road in minutes.</p>
        </div>

        <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {REQUIREMENTS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `pickup-req-${i}`;
            return (
              <li key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden">
                <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br p-2 sm:h-40 sm:w-full sm:rounded-none sm:p-6 ${item.tint}`}>
                  <div className="h-full w-full max-w-[150px]"><item.Art /></div>
                </div>
                <div className="min-w-0 flex-1 sm:p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">{i + 1}</span>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.text}</p>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="mt-3 inline-flex items-start gap-1 text-left text-sm font-semibold text-accent hover:text-accent-700"
                  >
                    <span>{item.question}</span>
                    <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div id={panelId} hidden={!isOpen} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                    {item.answer}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default PickupRequirements;
