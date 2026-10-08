/**
 * HogiCar cookie consent – the one consent source for the whole site.
 *
 * Categories: necessary (always on), analytics, marketing (advertising and affiliate partners).
 * The choice is stored in localStorage `hogicar_consent`, pushed to GTM's dataLayer as
 * `hogicar_consent_update` (so GA4/Ads tags can respect it) and broadcast to the affiliate
 * tracking, which passes the marketing choice to every network's own consent flag.
 */
export type ConsentState = 'granted' | 'denied' | 'unknown';
export type ConsentChoice = { analytics: boolean; marketing: boolean };

const KEY = 'hogicar_consent';
const VERSION = 1;
const EVENT = 'hogicar:consent-change';
export const OPEN_SETTINGS_EVENT = 'hogicar:open-cookie-settings';

type Stored = ConsentChoice & { v: number; ts: number };

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Stored;
    return v && v.v === VERSION && typeof v.marketing === 'boolean' ? v : null;
  } catch {
    return null;
  }
}

export function hasConsentChoice(): boolean {
  return read() !== null;
}

export function getConsentChoice(): ConsentChoice | null {
  const v = read();
  return v ? { analytics: v.analytics, marketing: v.marketing } : null;
}

/** Marketing consent (advertising and affiliate networks). */
export function marketingConsent(): ConsentState {
  const v = read();
  return v ? (v.marketing ? 'granted' : 'denied') : 'unknown';
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...choice, v: VERSION, ts: Date.now() }));
  } catch { /* storage blocked: the choice applies to this page only */ }
  pushToDataLayer(choice);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function onConsentChange(cb: (choice: ConsentChoice) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentChoice>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}

function pushToDataLayer(choice: ConsentChoice) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'hogicar_consent_update',
    analytics_consent: choice.analytics ? 'granted' : 'denied',
    marketing_consent: choice.marketing ? 'granted' : 'denied',
  });
}

/** Re-announce a stored choice on page load so GTM sees it on every visit. */
export function announceStoredConsent() {
  const c = getConsentChoice();
  if (c) pushToDataLayer(c);
}
