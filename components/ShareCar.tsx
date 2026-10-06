import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import X from 'lucide-react/dist/esm/icons/x';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Send from 'lucide-react/dist/esm/icons/send';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import MoreHorizontal from 'lucide-react/dist/esm/icons/ellipsis';

export interface ShareCarDetails {
  carName: string;
  category?: string;
  supplierName?: string;
  image?: string;
  priceText: string;
  days: number;
  place?: string;
  datesText?: string;
  /** Link that opens this car on the details page for whoever receives it. */
  url: string;
}

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const shareMessage = (d: ShareCarDetails) => {
  const where = d.place ? ` in ${d.place}` : '';
  const from = d.supplierName ? ` from ${d.supplierName}` : '';
  return `Check out this car on Hogicar: ${d.carName}${from}${where} – ${d.priceText} for ${d.days} day${d.days === 1 ? '' : 's'}${d.datesText ? ` (${d.datesText})` : ''}.`;
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure contexts.
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

const ShareSheet: React.FC<{ open: boolean; onClose: () => void; details: ShareCarDetails }> = ({ open, onClose, details }) => {
  const [copied, setCopied] = React.useState(false);
  const message = shareMessage(details);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  React.useEffect(() => {
    if (!open) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  const handleCopy = async () => {
    if (await copyText(details.url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleNative = async () => {
    try {
      await navigator.share({ title: `${details.carName} on Hogicar`, text: message, url: details.url });
    } catch {
      // Cancelled by the user.
    }
  };

  const enc = encodeURIComponent;
  const channels: { name: string; href: string; icon: React.ReactNode; cls: string; label?: string; mobileOnly?: boolean }[] = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${message} ${details.url}`)}`, icon: <MessageCircle className="h-5 w-5" />, cls: 'bg-[#25D366] text-white' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(details.url)}`, icon: <Facebook className="h-5 w-5" />, cls: 'bg-[#1877F2] text-white' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${enc(message)}&url=${enc(details.url)}`, icon: <XLogo className="h-4 w-4" />, cls: 'bg-black text-white' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${enc(details.url)}&text=${enc(message)}`, icon: <Send className="h-5 w-5 -translate-x-px translate-y-px" />, cls: 'bg-[#229ED9] text-white' },
    { name: 'Email', href: `mailto:?subject=${enc(`${details.carName} on Hogicar`)}&body=${enc(`${message}\n\n${details.url}`)}`, icon: <Mail className="h-5 w-5" />, cls: 'bg-slate-700 text-white' },
    { name: 'SMS', href: `sms:?&body=${enc(`${message} ${details.url}`)}`, icon: <MessageSquare className="h-5 w-5" />, cls: 'bg-emerald-600 text-white', mobileOnly: true },
  ];

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="share-car-title">
          <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <div className="flex items-center justify-between px-5 pb-2 pt-3 sm:pt-5">
              <h2 id="share-car-title" className="text-lg font-bold text-slate-900">Share this car</h2>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {/* Preview of what is being shared */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                  {details.image ? <img src={details.image} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <Share2 className="h-5 w-5 text-slate-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{details.carName} <span className="font-normal text-slate-500">or similar</span></p>
                  <p className="truncate text-xs text-slate-500">{[details.category, details.supplierName].filter(Boolean).join(' · ')}</p>
                  <p className="mt-0.5 text-sm"><span className="font-bold text-slate-900">{details.priceText}</span> <span className="text-slate-500">for {details.days} day{details.days === 1 ? '' : 's'}</span></p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-y-4 sm:grid-cols-5">
                {channels.map(c => (
                  <a
                    key={c.name}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className={`group flex flex-col items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 ${c.mobileOnly ? 'sm:hidden' : ''}`}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-105 ${c.cls}`}>{c.icon}</span>
                    {c.label || c.name}
                  </a>
                ))}
                {canNativeShare && (
                  <button type="button" onClick={handleNative} className="group flex flex-col items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition-transform group-hover:scale-105"><MoreHorizontal className="h-5 w-5" /></span>
                    More
                  </button>
                )}
              </div>

              <div className="mt-5">
                <label htmlFor="share-car-link" className="text-xs font-semibold text-slate-500">Link to this car</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pl-3 focus-within:ring-2 focus-within:ring-accent/30">
                  <input id="share-car-link" readOnly value={details.url} onFocus={e => e.currentTarget.select()} className="min-w-0 flex-1 truncate bg-transparent text-sm text-slate-700 outline-none" />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-accent text-white hover:bg-accent-700'}`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Prices change often. Whoever opens the link sees the live price for these dates.</p>
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
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-accent hover:text-accent ${compact ? 'h-9 w-9 justify-center' : 'px-3.5 py-1.5'} ${className}`}
      >
        <Share2 className="h-4 w-4" />
        {!compact && 'Share'}
      </button>
      <ShareSheet open={open} onClose={close} details={details} />
    </>
  );
};

export default ShareCarButton;
