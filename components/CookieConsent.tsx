import * as React from 'react';
import { Link } from 'react-router-dom';
import Cookie from 'lucide-react/dist/esm/icons/cookie';
import X from 'lucide-react/dist/esm/icons/x';
import { getConsentChoice, hasConsentChoice, OPEN_SETTINGS_EVENT, setConsent } from '../utils/consent';

/**
 * The site's cookie consent banner. Necessary cookies are always on; analytics and marketing
 * (advertising and affiliate partners such as Awin) need the visitor's choice. Reopened from the
 * footer's "Cookie settings" link.
 */
const Toggle: React.FC<{ checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void; label: string }> = ({ checked, disabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-slate-300'} ${disabled ? 'opacity-60' : ''}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

const CookieConsent: React.FC<{ forceOpen?: boolean }> = ({ forceOpen = false }) => {
  const [open, setOpen] = React.useState(forceOpen || !hasConsentChoice());
  const [details, setDetails] = React.useState(forceOpen);
  const stored = getConsentChoice();
  const [analytics, setAnalytics] = React.useState(stored?.analytics ?? true);
  const [marketing, setMarketing] = React.useState(stored?.marketing ?? true);

  React.useEffect(() => {
    const reopen = () => {
      const c = getConsentChoice();
      setAnalytics(c?.analytics ?? true);
      setMarketing(c?.marketing ?? true);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const save = (choice: { analytics: boolean; marketing: boolean }) => {
    setConsent(choice);
    setOpen(false);
    setDetails(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] p-3 sm:p-4" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title">
      <div className="hc-anim-sheet mx-auto max-w-3xl rounded-2xl bg-white p-4 text-slate-900 shadow-[0_18px_60px_-12px_rgba(2,24,64,0.45)] ring-1 ring-black/5 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent sm:flex">
            <Cookie className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p id="cookie-consent-title" className="text-sm font-semibold sm:text-base">Your privacy choices</p>
              {hasConsentChoice() && (
                <button type="button" onClick={() => setOpen(false)} className="-me-1 -mt-1 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              We use necessary cookies to run the site and, with your permission, analytics and marketing cookies, including for our affiliate partners who send you to us.{' '}
              <Link to="/privacy-policy" className="font-medium text-accent hover:underline">Privacy policy</Link>
            </p>

            {details && (
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                <li className="flex items-center justify-between gap-4 p-3">
                  <div>
                    <p className="text-sm font-medium">Necessary</p>
                    <p className="text-xs text-slate-500">Search, booking, payment, security and remembering an affiliate partner's referral so they can be paid.</p>
                  </div>
                  <Toggle checked disabled label="Necessary cookies (always on)" />
                </li>
                <li className="flex items-center justify-between gap-4 p-3">
                  <div>
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-slate-500">Anonymous statistics that help us improve the site.</p>
                  </div>
                  <Toggle checked={analytics} onChange={setAnalytics} label="Analytics cookies" />
                </li>
                <li className="flex items-center justify-between gap-4 p-3">
                  <div>
                    <p className="text-sm font-medium">Marketing</p>
                    <p className="text-xs text-slate-500">Advertising and affiliate partner cookies (for example Awin) used to measure campaigns.</p>
                  </div>
                  <Toggle checked={marketing} onChange={setMarketing} label="Marketing cookies" />
                </li>
              </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="h-10 rounded-full bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700">
                Accept all
              </button>
              <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="h-10 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-slate-400">
                Necessary only
              </button>
              {details ? (
                <button type="button" onClick={() => save({ analytics, marketing })} className="h-10 rounded-full px-4 text-sm font-semibold text-accent hover:bg-accent-50">
                  Save choices
                </button>
              ) : (
                <button type="button" onClick={() => setDetails(true)} className="h-10 rounded-full px-4 text-sm font-semibold text-accent hover:bg-accent-50">
                  Manage
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
