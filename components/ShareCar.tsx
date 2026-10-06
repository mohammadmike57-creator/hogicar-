import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import qrcode from 'qrcode-generator';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import X from 'lucide-react/dist/esm/icons/x';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import MoreHorizontal from 'lucide-react/dist/esm/icons/ellipsis';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';

export interface ShareCarDetails {
  carName: string;
  category?: string;
  supplierName?: string;
  supplierLogo?: string;
  image?: string;
  priceText: string;
  days: number;
  place?: string;
  datesText?: string;
  seats?: number;
  bags?: number;
  transmission?: string;
  /** Link that opens this car on the details page for whoever receives it. */
  url: string;
}

// ---- Brand marks (official glyphs, single colour) ----
const Glyph = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);
const WHATSAPP = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';
const FACEBOOK = 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z';
const XLOGO = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const TELEGRAM = 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.140-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';

const shareMessage = (d: ShareCarDetails) => {
  const where = d.place ? ` in ${d.place}` : '';
  const from = d.supplierName ? ` from ${d.supplierName}` : '';
  return `Have a look at this car on Hogicar: ${d.carName} or similar${from}${where}, ${d.priceText} for ${d.days} day${d.days === 1 ? '' : 's'}${d.datesText ? ` (${d.datesText})` : ''}.`;
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and in-app browsers without clipboard access.
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(el);
    return ok;
  }
};

/** Crisp, scalable QR code drawn as SVG modules. */
const QrSvg: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const cells = React.useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      const n = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c},${r}h1v1h-1z`;
      return { n, d };
    } catch {
      return null;
    }
  }, [value]);
  if (!cells) return null;
  return (
    <svg viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} className={className} shapeRendering="crispEdges" role="img" aria-label="QR code for this deal">
      <rect x="-2" y="-2" width={cells.n + 4} height={cells.n + 4} fill="#fff" />
      <path d={cells.d} fill="#0f172a" />
    </svg>
  );
};

const ShareSheet: React.FC<{ open: boolean; onClose: () => void; details: ShareCarDetails }> = ({ open, onClose, details }) => {
  const [copied, setCopied] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const message = shareMessage(details);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  React.useEffect(() => {
    if (!open) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  const handleCopy = async () => {
    if (await copyText(details.url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleNative = async () => {
    try {
      await navigator.share({ title: `${details.carName} on Hogicar`, text: message, url: details.url });
    } catch {
      // Cancelled.
    }
  };

  const enc = encodeURIComponent;
  const channels: { name: string; href: string; icon: React.ReactNode; cls: string; mobileOnly?: boolean }[] = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${message}\n${details.url}`)}`, icon: <Glyph d={WHATSAPP} className="h-[22px] w-[22px]" />, cls: 'bg-[#25D366]' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(details.url)}`, icon: <Glyph d={FACEBOOK} className="h-[22px] w-[22px]" />, cls: 'bg-[#1877F2]' },
    { name: 'X', href: `https://x.com/intent/post?text=${enc(message)}&url=${enc(details.url)}`, icon: <Glyph d={XLOGO} className="h-[18px] w-[18px]" />, cls: 'bg-black' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${enc(details.url)}&text=${enc(message)}`, icon: <Glyph d={TELEGRAM} className="h-[22px] w-[22px]" />, cls: 'bg-[#26A5E4]' },
    { name: 'Email', href: `mailto:?subject=${enc(`${details.carName} on Hogicar`)}&body=${enc(`${message}\n\n${details.url}`)}`, icon: <Mail className="h-5 w-5" />, cls: 'bg-slate-700' },
    { name: 'Messages', href: `sms:?&body=${enc(`${message} ${details.url}`)}`, icon: <MessageSquare className="h-5 w-5" />, cls: 'bg-[#34C759]', mobileOnly: true },
  ];

  const specs = [
    details.seats ? { icon: Users, label: `${details.seats} seats` } : null,
    details.bags ? { icon: Briefcase, label: `${details.bags} bags` } : null,
    details.transmission ? { icon: Settings2, label: details.transmission } : null,
  ].filter(Boolean) as { icon: typeof Users; label: string }[];

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="share-car-title">
          <motion.div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)] sm:max-w-[620px] sm:rounded-[22px]"
            initial={{ y: 48, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.985 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />

            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-7 sm:pt-6">
              <div>
                <h2 id="share-car-title" className="text-[19px] font-bold tracking-tight text-slate-900">Share this deal</h2>
                <p className="mt-0.5 text-sm text-slate-500">Send it to the people you’re travelling with.</p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="-mr-1.5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-7">
              {/* Deal preview */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex gap-4 bg-gradient-to-br from-slate-50 via-white to-accent-50/60 p-4">
                  <div className="flex h-[76px] w-[112px] shrink-0 items-center justify-center sm:h-[88px] sm:w-[132px]">
                    {details.image && !imageFailed
                      ? <img src={details.image} alt="" onError={() => setImageFailed(true)} className="max-h-full max-w-full object-contain drop-shadow-[0_8px_10px_rgba(15,23,42,0.18)]" referrerPolicy="no-referrer" />
                      : <Share2 className="h-6 w-6 text-slate-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-base font-bold leading-tight text-slate-900">{details.carName}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">or similar{details.category ? ` · ${details.category}` : ''}</p>
                      </div>
                      {details.supplierLogo
                        ? <img src={details.supplierLogo} alt={details.supplierName || ''} className="h-6 w-auto max-w-[72px] shrink-0 object-contain" />
                        : details.supplierName ? <span className="shrink-0 text-xs font-semibold text-slate-600">{details.supplierName}</span> : null}
                    </div>
                    {specs.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {specs.map(s => (
                          <li key={s.label} className="inline-flex items-center gap-1 text-xs text-slate-600"><s.icon className="h-3.5 w-3.5 text-slate-400" />{s.label}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-200 bg-white px-4 py-3">
                  <div className="min-w-0 space-y-1 text-xs text-slate-600">
                    {details.place && <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{details.place}</span></p>}
                    {details.datesText && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />{details.datesText}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold leading-none text-slate-900">{details.priceText}</p>
                    <p className="mt-1 text-[11px] text-slate-500">total for {details.days} day{details.days === 1 ? '' : 's'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_148px] sm:gap-7">
                <div className="min-w-0">
                  {/* Channels */}
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share via</p>
                  <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5">
                    {channels.map(c => (
                      <a
                        key={c.name}
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        aria-label={`Share on ${c.name}`}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl text-[11px] font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${c.mobileOnly ? 'sm:hidden' : ''}`}
                      >
                        <span className={`flex h-[50px] w-[50px] items-center justify-center rounded-full text-white shadow-[0_6px_14px_-6px_rgba(15,23,42,0.5)] transition-transform duration-150 group-hover:-translate-y-0.5 group-active:scale-95 ${c.cls}`}>{c.icon}</span>
                        <span className="group-hover:text-slate-900">{c.name}</span>
                      </a>
                    ))}
                    {canNativeShare && (
                      <button type="button" onClick={handleNative} aria-label="More sharing options" className="group flex flex-col items-center gap-1.5 rounded-xl text-[11px] font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition-transform duration-150 group-hover:-translate-y-0.5 group-active:scale-95"><MoreHorizontal className="h-5 w-5" /></span>
                        <span className="group-hover:text-slate-900">More</span>
                      </button>
                    )}
                  </div>

                  {/* Link */}
                  <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Or copy the link</p>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3.5 focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20">
                    <input aria-label="Link to this deal" readOnly value={details.url.replace(/^https?:\/\//, '')} onFocus={e => e.currentTarget.select()} className="min-w-0 flex-1 truncate bg-transparent text-sm text-slate-700 outline-none" />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`inline-flex min-w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${copied ? 'bg-emerald-600' : 'bg-accent hover:bg-accent-700'}`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                  <p className="sr-only" aria-live="polite">{copied ? 'Link copied to clipboard' : ''}</p>
                </div>

                {/* QR (desktop): open the deal on a phone */}
                <div className="hidden flex-col items-center sm:flex">
                  <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <QrSvg value={details.url} className="h-[124px] w-[124px]" />
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1 text-center text-[11px] font-medium text-slate-500"><QrCode className="h-3.5 w-3.5" /> Scan to open on your phone</p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-emerald-600" />
                <p>The link opens this car with the same dates and location. Prices are live, so whoever opens it sees the latest price and availability.</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/** "Share" button for the car details page. Opens the share sheet. */
const ShareCarButton: React.FC<{ details: ShareCarDetails; className?: string; compact?: boolean }> = ({ details, className = '', compact }) => {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Share this car"
        className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-accent/40 hover:bg-accent-50 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${compact ? 'h-9 w-9 justify-center' : 'px-4 py-2'} ${className}`}
      >
        <Share2 className="h-4 w-4" />
        {!compact && 'Share'}
      </button>
      <ShareSheet open={open} onClose={close} details={details} />
    </>
  );
};

export default ShareCarButton;
