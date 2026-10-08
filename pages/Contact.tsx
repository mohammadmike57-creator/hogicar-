import * as React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Send from 'lucide-react/dist/esm/icons/send';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import LifeBuoy from 'lucide-react/dist/esm/icons/life-buoy';
import CalendarCog from 'lucide-react/dist/esm/icons/calendar-cog';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import CarFront from 'lucide-react/dist/esm/icons/car-front';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Handshake from 'lucide-react/dist/esm/icons/handshake';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import SEOMetadata from '../components/SEOMetadata';
import { API_BASE_URL, CONTACT_EMAIL, PUBLIC_BASE_URL } from '../lib/config';
import { HELP_ARTICLES, articleUrl } from '../content/helpCenter';

type Topic = { key: string; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; needsBooking?: boolean };

const TOPICS: Topic[] = [
  { key: 'BOOKING', label: 'A booking', hint: 'Questions about an existing reservation', icon: CarFront, needsBooking: true },
  { key: 'CHANGE_CANCEL', label: 'Change or cancel', hint: 'Dates, details or cancellation', icon: RefreshCw, needsBooking: true },
  { key: 'PAYMENT', label: 'Payment & refund', hint: 'Charges, refunds or deposits', icon: CreditCard, needsBooking: true },
  { key: 'PARTNERSHIP', label: 'Business & partnerships', hint: 'Affiliates, API and corporate', icon: Handshake },
  { key: 'SUPPLIER', label: 'Rental suppliers', hint: 'List your fleet on HogiCar', icon: Building2 },
  { key: 'PRESS', label: 'Press & media', hint: 'Interviews, data and assets', icon: Newspaper },
  { key: 'FEEDBACK', label: 'Feedback', hint: 'Compliments or complaints', icon: MessageSquare },
  { key: 'OTHER', label: 'Something else', hint: 'Anything we haven’t listed', icon: HelpCircle },
];

const MAX_MESSAGE = 5000;
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

type Errors = Partial<Record<'topic' | 'name' | 'email' | 'message' | 'bookingRef', string>>;

const inputCls = (invalid?: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-slate-300 focus:border-accent focus:ring-accent/15'
  }`;

const Field: React.FC<{ id: string; label: string; optional?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ id, label, optional, error, hint, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-slate-800">
      <span>{label}</span>
      {optional && <span className="text-xs font-normal text-slate-400">Optional</span>}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
    ) : null}
  </div>
);

const CopyEmail: React.FC<{ light?: boolean }> = ({ light }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };
  return (
    <button type="button" onClick={copy} aria-label="Copy email address"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${light ? 'text-white/80 hover:bg-white/15 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

const Contact: React.FC = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const initialTopic = TOPICS.some(t => t.key === params.get('topic')?.toUpperCase()) ? params.get('topic')!.toUpperCase() : '';
  const [form, setForm] = React.useState({
    topic: initialTopic,
    name: '',
    email: '',
    phone: '',
    bookingRef: (params.get('booking') || params.get('bookingRef') || '').toUpperCase().slice(0, 40),
    subject: '',
    message: '',
    website: '', // honeypot – real people never see or fill this
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [reference, setReference] = React.useState<string | null>(null);
  const startedAt = React.useRef(Date.now());
  const formRef = React.useRef<HTMLFormElement>(null);

  const topic = TOPICS.find(t => t.key === form.topic);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = k === 'bookingRef' ? e.target.value.toUpperCase() : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof Errors]) setErrors(er => ({ ...er, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.topic) e.topic = 'Choose what your message is about.';
    if (form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!emailOk(form.email)) e.email = 'Enter a valid email address so we can reply.';
    if (form.bookingRef && !/^[A-Z0-9-]{3,40}$/.test(form.bookingRef.trim())) e.bookingRef = 'Booking references look like H12345.';
    if (form.message.trim().length < 10) e.message = 'Tell us a little more (at least 10 characters).';
    if (form.message.length > MAX_MESSAGE) e.message = `Keep it under ${MAX_MESSAGE.toLocaleString()} characters.`;
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      (formRef.current?.querySelector(`[name="${first}"]`) as HTMLElement | null)?.focus();
      return;
    }
    setStatus('sending');
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bookingRef: topic?.needsBooking ? form.bookingRef.trim() : '',
          startedAt: startedAt.current,
          language: document.documentElement.lang?.slice(0, 2) || 'en',
          pageUrl: window.location.href,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || 'We couldn’t send your message. Please try again.');
      setReference(data.reference || null);
      setStatus('sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setServerError(err?.message && !/fetch/i.test(err.message) ? err.message : `We couldn’t send your message. Please try again or email ${CONTACT_EMAIL}.`);
      setStatus('error');
    }
  };

  const reset = () => {
    setForm(f => ({ ...f, subject: '', message: '', bookingRef: '' }));
    setReference(null);
    setStatus('idle');
    startedAt.current = Date.now();
  };

  const popular = HELP_ARTICLES.filter(a => a.popular).slice(0, 5);
  const isAbout = location.pathname === '/about';

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact HogiCar',
    url: `${PUBLIC_BASE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'HogiCar',
      url: PUBLIC_BASE_URL,
      logo: `${PUBLIC_BASE_URL}/android-chrome-512x512.png`,
      email: CONTACT_EMAIL,
      contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT_EMAIL, availableLanguage: ['English', 'Arabic'] }],
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEOMetadata
        title={isAbout ? 'About & Contact HogiCar' : 'Contact HogiCar | Customer & Business Enquiries'}
        description={`Get help with a car rental booking, payments or partnerships. Email ${CONTACT_EMAIL} or send us a message – we usually reply within one business day.`}
        canonicalUrl={`${PUBLIC_BASE_URL}/contact`}
        structuredData={structuredData}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#00224f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#0b5cc4_0%,_#003580_45%,_#00224f_100%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
            <Mail className="h-3.5 w-3.5" /> Contact us
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help?</h1>
          <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
            Questions about a booking, a payment or working with HogiCar – our team reads every message and usually replies within one business day.
          </p>
          <div className="mt-6 inline-flex items-center gap-1 rounded-2xl bg-white/10 py-1 pl-4 pr-1 ring-1 ring-white/15 backdrop-blur">
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[15px] font-semibold text-white hover:underline">{CONTACT_EMAIL}</a>
            <CopyEmail light />
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Self-service shortcuts */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { to: '/my-bookings', icon: CalendarCog, title: 'Manage your booking', text: 'View, change or cancel instantly' },
            { to: '/help', icon: LifeBuoy, title: 'Help Center', text: 'Answers to common questions' },
            { to: '/contact?topic=PARTNERSHIP', icon: Briefcase, title: 'Business enquiries', text: 'Partnerships, API & suppliers' },
          ].map(c => (
            <Link key={c.title} to={c.to} onClick={() => c.to.includes('topic=') && setForm(f => ({ ...f, topic: 'PARTNERSHIP' }))}
              className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_-12px_rgba(2,24,64,0.25)] ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-accent/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent"><c.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-slate-900">{c.title}</span>
                <span className="block text-sm text-slate-500">{c.text}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Form */}
          <section aria-labelledby="contact-form-title" className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
            {status === 'sent' ? (
              <div className="py-6 text-center sm:py-10" role="status">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                  <CheckCircle2 className="h-8 w-8" />
                </span>
                <h2 className="mt-6 text-2xl font-bold text-slate-900">Message sent</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-600">
                  Thank you{form.name ? `, ${form.name.split(' ')[0]}` : ''}. We’ve emailed a copy to <span className="font-semibold text-slate-800">{form.email}</span> and will reply there.
                </p>
                {reference && (
                  <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-2xl bg-slate-50 px-6 py-4 ring-1 ring-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Your reference</span>
                    <span className="mt-1 font-mono text-2xl font-bold tracking-wider text-slate-900">{reference}</span>
                  </div>
                )}
                <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
                  {[
                    ['Received', 'Your message is with our team.'],
                    ['Reviewed', 'We check your booking or request.'],
                    ['Reply', 'Usually within one business day.'],
                  ].map(([t, d], i) => (
                    <li key={t} className="rounded-2xl border border-slate-200 p-4">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{t}</p>
                      <p className="text-xs text-slate-500">{d}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={reset} className="h-11 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:border-slate-400">Send another message</button>
                  <Link to="/my-bookings" className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">Manage booking</Link>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
                <div>
                  <h2 id="contact-form-title" className="text-xl font-bold text-slate-900 sm:text-2xl">Send us a message</h2>
                  <p className="mt-1 text-sm text-slate-500">Fields marked optional can be left empty.</p>
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-slate-800">What is your message about?</legend>
                  <div role="radiogroup" aria-invalid={!!errors.topic} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TOPICS.map(t => {
                      const active = form.topic === t.key;
                      return (
                        <button key={t.key} type="button" role="radio" aria-checked={active} name={active || (!form.topic && t.key === 'BOOKING') ? 'topic' : undefined}
                          onClick={() => { setForm(f => ({ ...f, topic: t.key })); setErrors(e => ({ ...e, topic: undefined })); }}
                          className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition ${
                            active ? 'border-accent bg-accent-50 ring-2 ring-accent/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}>
                          <t.icon className={`h-5 w-5 ${active ? 'text-accent' : 'text-slate-500'}`} />
                          <span className={`text-sm font-semibold leading-tight ${active ? 'text-accent-800' : 'text-slate-800'}`}>{t.label}</span>
                          <span className="hidden text-[11px] leading-snug text-slate-500 sm:block">{t.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.topic && <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{errors.topic}</p>}
                </fieldset>

                {topic?.needsBooking && (
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <Field id="bookingRef" label="Booking reference" optional error={errors.bookingRef} hint="Starts with H – it’s in your confirmation email. It helps us find your booking straight away.">
                      <input id="bookingRef" name="bookingRef" value={form.bookingRef} onChange={set('bookingRef')} placeholder="H12345" maxLength={40}
                        autoComplete="off" aria-invalid={!!errors.bookingRef} aria-describedby={errors.bookingRef ? 'bookingRef-error' : undefined}
                        className={`${inputCls(!!errors.bookingRef)} font-mono uppercase tracking-wider`} />
                    </Field>
                    {form.topic === 'CHANGE_CANCEL' && (
                      <p className="mt-3 text-sm text-slate-600">
                        Tip: you can cancel, request new dates or update details yourself in{' '}
                        <Link to="/my-bookings" className="font-semibold text-accent hover:underline">Manage booking</Link> – it’s instant.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="name" label="Full name" error={errors.name}>
                    <input id="name" name="name" value={form.name} onChange={set('name')} autoComplete="name" maxLength={120} placeholder="Your full name"
                      aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} className={inputCls(!!errors.name)} />
                  </Field>
                  <Field id="email" label="Email address" error={errors.email}>
                    <input id="email" name="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={160} placeholder="you@example.com"
                      aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} className={inputCls(!!errors.email)} />
                  </Field>
                  <Field id="phone" label="Phone" optional>
                    <input id="phone" name="phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} placeholder="+962 7…" className={inputCls()} />
                  </Field>
                  <Field id="subject" label="Subject" optional>
                    <input id="subject" name="subject" value={form.subject} onChange={set('subject')} maxLength={200} placeholder="A short summary" className={inputCls()} />
                  </Field>
                </div>

                <Field id="message" label="Message" error={errors.message}>
                  <textarea id="message" name="message" rows={6} value={form.message} onChange={set('message')} maxLength={MAX_MESSAGE}
                    placeholder="How can we help? Include any details that will help us answer quickly."
                    aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-error' : 'message-count'}
                    className={`${inputCls(!!errors.message)} min-h-[150px] resize-y leading-relaxed`} />
                </Field>
                <p id="message-count" className="-mt-4 text-right text-xs text-slate-400">{form.message.length.toLocaleString()} / {MAX_MESSAGE.toLocaleString()}</p>

                {/* Honeypot: hidden from people and assistive tech */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </div>

                {serverError && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {serverError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-start gap-2 text-xs text-slate-500 sm:max-w-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>We only use your details to answer you. See our <Link to="/privacy-policy" className="font-medium text-accent hover:underline">privacy policy</Link>.</span>
                  </p>
                  <button type="submit" disabled={status === 'sending'}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 text-[15px] font-semibold text-white shadow-sm transition hover:bg-accent-700 disabled:opacity-70">
                    {status === 'sending' ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send message</>}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-base font-bold text-slate-900">Email us directly</h2>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-slate-50 py-2 pl-4 pr-2 ring-1 ring-slate-200">
                <a href={`mailto:${CONTACT_EMAIL}`} className="truncate text-[15px] font-semibold text-accent hover:underline">{CONTACT_EMAIL}</a>
                <CopyEmail />
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>We usually reply within <strong className="text-slate-800">one business day</strong>.</span></li>
                <li className="flex gap-3"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>We answer in English and Arabic.</span></li>
                <li className="flex gap-3"><CarFront className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>At the rental desk? Call the rental company – their number is on your voucher.</span></li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Popular answers</h2>
                <Link to="/help" className="text-sm font-semibold text-accent hover:underline">Help Center</Link>
              </div>
              <ul className="mt-3 divide-y divide-slate-100">
                {popular.map(a => (
                  <li key={a.slug}>
                    <Link to={articleUrl(a)} className="group flex items-center justify-between gap-3 py-3 text-sm text-slate-700 hover:text-accent">
                      <span>{a.title}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#003580] to-[#00224f] p-6 text-white shadow-sm">
              <Briefcase className="h-6 w-6 text-amber-300" />
              <h2 className="mt-3 text-base font-bold">Working with HogiCar</h2>
              <p className="mt-1 text-sm text-white/75">Affiliates, rental suppliers, API partners and press – choose the matching topic and our business team will reply.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link to="/affiliate-program" className="rounded-full bg-white/10 px-3 py-1.5 font-medium ring-1 ring-white/20 hover:bg-white/20">Affiliate program</Link>
                <Link to="/become-supplier" className="rounded-full bg-white/10 px-3 py-1.5 font-medium ring-1 ring-white/20 hover:bg-white/20">Become a supplier</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Contact;
