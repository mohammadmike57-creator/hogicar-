import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import { appleWalletPassUrl, getGoogleWalletUrl, getWalletStatus, WalletStatus } from '../../api';

export type WalletPlatform = 'ios' | 'android' | 'mac' | 'other';

export const walletPlatform = (): WalletPlatform => {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const iPadOS = navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh/i.test(ua)) return 'mac';
  return 'other';
};

/** Wallet availability from the server; null while loading. */
export const useWalletStatus = () => {
  const [status, setStatus] = React.useState<WalletStatus | null>(null);
  React.useEffect(() => {
    let alive = true;
    getWalletStatus().then(s => { if (alive) setStatus(s); });
    return () => { alive = false; };
  }, []);
  return status;
};

const AppleWalletIcon: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect x="1" y="1" width="30" height="30" rx="7" fill="#1c1c1e" stroke="#3a3a3c" strokeWidth="1" />
    <rect x="5" y="6" width="22" height="13" rx="2.5" fill="#0a84ff" />
    <rect x="5" y="9" width="22" height="13" rx="2.5" fill="#30d158" />
    <rect x="5" y="12" width="22" height="13" rx="2.5" fill="#ffd60a" />
    <rect x="5" y="15" width="22" height="13" rx="2.5" fill="#ff453a" />
    <path d="M4 18.5h7.2c.9 0 1.6.5 2 1.2.5 1 1.6 1.7 2.8 1.7s2.3-.7 2.8-1.7c.4-.7 1.1-1.2 2-1.2H28V27a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8.5z" fill="#e5e5ea" />
  </svg>
);

const GoogleWalletIcon: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect x="3" y="5" width="26" height="9" rx="3" fill="#ea4335" />
    <rect x="3" y="9" width="26" height="9" rx="3" fill="#fbbc04" />
    <rect x="3" y="13" width="26" height="9" rx="3" fill="#34a853" />
    <path d="M3 19.5c0-1.4 1.1-2.5 2.5-2.5h7.3c1 0 1.9.6 2.4 1.5l.5.9c.2.4.6.6 1 .6h.6c.4 0 .8-.2 1-.6l.5-.9c.5-.9 1.4-1.5 2.4-1.5h4.3c1.4 0 2.5 1.1 2.5 2.5V24c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3v-4.5z" fill="#4285f4" />
  </svg>
);

const Spinner = () => <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-hidden="true" />;

const Badge: React.FC<{
  kind: 'apple' | 'google';
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  size: 'md' | 'lg';
}> = ({ kind, busy, disabled, onClick, size }) => {
  const label = kind === 'apple' ? 'Apple Wallet' : 'Google Wallet';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Add to ${label}`}
      aria-busy={busy}
      className={`group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden bg-black text-left text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.55)] ring-1 ring-black transition hover:bg-[#111] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40 disabled:cursor-wait ${size === 'lg' ? 'h-14 rounded-2xl px-5' : 'h-12 rounded-xl px-4'} ${kind === 'google' ? 'sm:rounded-full' : ''}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        {busy ? <Spinner /> : kind === 'apple' ? <AppleWalletIcon /> : <GoogleWalletIcon />}
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[11px] font-medium text-white/80">{busy ? 'Preparing your pass…' : 'Add to'}</span>
        <span className={`mt-0.5 font-semibold tracking-tight ${size === 'lg' ? 'text-[19px]' : 'text-[17px]'}`}>{label}</span>
      </span>
    </motion.button>
  );
};

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const messageOf = async (res: Response, fallback: string) => {
  try { const j = await res.json(); return j?.message || fallback; } catch { return fallback; }
};

/**
 * "Add to Apple Wallet" and "Add to Google Wallet" buttons. Only wallets the server can issue
 * passes for are shown; the one that matches the device comes first. Renders `fallback`
 * (or nothing) when no wallet is available.
 */
const WalletButtons: React.FC<{
  bookingRef: string;
  status?: string;
  size?: 'md' | 'lg';
  layout?: 'row' | 'stack';
  className?: string;
  fallback?: React.ReactNode;
  onAvailability?: (available: boolean) => void;
}> = ({ bookingRef, status, size = 'md', layout = 'row', className = '', fallback = null, onAvailability }) => {
  const wallet = useWalletStatus();
  const platform = React.useMemo(walletPlatform, []);
  const [busy, setBusy] = React.useState<null | 'apple' | 'google'>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const cancelled = /CANCEL|REJECT/i.test(String(status || ''));
  const kinds = React.useMemo(() => {
    if (!wallet || cancelled) return [] as ('apple' | 'google')[];
    const list: ('apple' | 'google')[] = [];
    if (wallet.appleWallet && platform !== 'android') list.push('apple');
    if (wallet.googleWallet && platform !== 'ios') list.push('google');
    // On desktop show both; on a phone only the wallet that phone has.
    if ((platform === 'android' || platform === 'other') && list[0] === 'apple' && list.length > 1) list.reverse();
    return list;
  }, [wallet, cancelled, platform]);

  React.useEffect(() => { if (wallet) onAvailability?.(kinds.length > 0); }, [wallet, kinds.length, onAvailability]);

  const addApple = async () => {
    setError(null); setDone(null);
    const url = appleWalletPassUrl(bookingRef);
    if (platform === 'ios') {
      // Safari on iPhone opens the "Add pass" sheet when it navigates to a .pkpass.
      setBusy('apple');
      window.location.href = url;
      setTimeout(() => setBusy(null), 2500);
      return;
    }
    setBusy('apple');
    try {
      const res = await fetch(url);
      if (!res.ok) { setError(await messageOf(res, 'We couldn’t create your Apple Wallet pass. Please try again.')); return; }
      download(await res.blob(), `Hogicar-${bookingRef}.pkpass`);
      setDone(platform === 'mac' ? 'Pass downloaded. Open it to add it to Wallet, it syncs to your iPhone.' : 'Pass downloaded. Open it on your iPhone to add it to Apple Wallet.');
    } catch {
      setError('Connection problem. Check your internet and try again.');
    } finally {
      setBusy(null);
    }
  };

  const addGoogle = async () => {
    setError(null); setDone(null);
    const mobile = platform === 'android';
    const tab = mobile ? null : window.open('', '_blank');
    setBusy('google');
    try {
      const url = await getGoogleWalletUrl(bookingRef);
      if (!url) throw new Error('no url');
      if (tab) { tab.location.href = url; setDone('Google Wallet opened in a new tab.'); }
      else window.location.href = url;
    } catch (e: any) {
      tab?.close();
      setError(e?.response?.data?.message || 'We couldn’t create your Google Wallet pass. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (!wallet) {
    return <div className={`h-12 w-full animate-pulse rounded-xl bg-slate-200/70 ${className}`} aria-hidden="true" />;
  }
  if (kinds.length === 0) return <>{fallback}</>;

  return (
    <div className={className}>
      <div className={layout === 'row' && kinds.length > 1 ? 'grid gap-2.5 sm:grid-cols-2' : 'grid gap-2.5'}>
        {kinds.map(k => (
          <Badge key={k} kind={k} size={size} busy={busy === k} disabled={!!busy} onClick={k === 'apple' ? addApple : addGoogle} />
        ))}
      </div>
      <AnimatePresence>
        {(error || done) && (
          <motion.p
            key={error || done}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role={error ? 'alert' : 'status'}
            className={`mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ring-1 ${error ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200'}`}
          >
            {error ? <AlertCircle className="mt-px h-4 w-4 shrink-0" /> : <CheckCircle className="mt-px h-4 w-4 shrink-0" />}
            {error || done}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export { AppleWalletIcon, GoogleWalletIcon };
export default WalletButtons;
