/**
 * Generic affiliate-network tracking for the browser (Awin is network #1).
 *
 * - Landing: the server's config says which URL parameters each active network uses. If the landing
 *   URL carries one, the click is sent to the server, which validates it, stores it and sets the
 *   first-party HttpOnly `hogicar_affiliate` cookie. The returned attribution tokens are also kept in
 *   localStorage so they survive payment redirects and SPA navigation.
 * - Every page: network site-wide tags (e.g. Awin's MasterTag) load once, after the network's consent
 *   flag is set from the visitor's marketing consent.
 * - Booking: getAffiliateAttributionRef() goes into the booking request; the server decides network,
 *   publisher and commission.
 * - Confirmation: fireConversionTags() runs the confirmation tags the server returns – only once per
 *   booking, only for confirmed bookings (the server enforces this too).
 *
 * Nothing here knows about a specific network: it executes the server's instructions generically.
 */
import { API_BASE_URL } from '../lib/config';
import { marketingConsent, onConsentChange } from './consent';

type Script = { src: string; reinject: boolean };
type Global = { path: string; value: unknown };
type HiddenField = { formName: string; id: string; text: string };
type ClientSpec = { consentGlobal?: string | null; globals?: Global[]; scripts?: Script[]; pixels?: string[]; hiddenFields?: HiddenField[] };
type NetworkConfig = { code: string; clickParam: string; publisherParam?: string | null; clickRefParam?: string | null; params: string[]; windowDays: number; consentPolicy: string; sitewide?: ClientSpec | null };
type TrackingConfig = { enabled: boolean; networks: NetworkConfig[]; utmParams: string[] };
type StoredAttribution = { token: string; network: string; expiresAt: number };

const CONFIG_KEY = 'hogicar_aff_cfg';
const ATTR_KEY = 'hogicar_affiliate';
const VISITOR_KEY = 'hogicar_vid';
const CONFIG_TTL = 15 * 60 * 1000;
const loadedScripts = new Set<string>();
let configPromise: Promise<TrackingConfig | null> | null = null;
let started = false;

function safeGet(storage: Storage, key: string): string | null {
  try { return storage.getItem(key); } catch { return null; }
}
function safeSet(storage: Storage, key: string, value: string) {
  try { storage.setItem(key, value); } catch { /* storage blocked */ }
}

/** Random, non-personal id for this browser, used only to recognise a returning affiliate visitor. */
export function visitorId(): string {
  let id = safeGet(localStorage, VISITOR_KEY);
  if (!id || !/^[A-Za-z0-9-]{8,40}$/.test(id)) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    safeSet(localStorage, VISITOR_KEY, id);
  }
  return id;
}

function loadConfig(): Promise<TrackingConfig | null> {
  if (configPromise) return configPromise;
  const cached = safeGet(localStorage, CONFIG_KEY);
  if (cached) {
    try {
      const { at, cfg } = JSON.parse(cached);
      if (Date.now() - at < CONFIG_TTL) return (configPromise = Promise.resolve(cfg as TrackingConfig));
    } catch { /* refetch */ }
  }
  configPromise = fetch(`${API_BASE_URL}/api/public/affiliate-tracking/config`, { credentials: 'same-origin' })
    .then(r => (r.ok ? r.json() : null))
    .then((cfg: TrackingConfig | null) => {
      if (cfg) safeSet(localStorage, CONFIG_KEY, JSON.stringify({ at: Date.now(), cfg }));
      return cfg;
    })
    .catch(() => null);
  return configPromise;
}

function storedAttributions(): StoredAttribution[] {
  try {
    const list = JSON.parse(safeGet(localStorage, ATTR_KEY) || '[]') as StoredAttribution[];
    const now = Date.now();
    return Array.isArray(list) ? list.filter(a => a && typeof a.token === 'string' && a.expiresAt > now) : [];
  } catch {
    return [];
  }
}

function remember(list: { token: string; network: string; expiresAt?: string | null }[]) {
  const current = storedAttributions().filter(a => !list.some(n => n.token === a.token));
  const added = list.map(a => ({ token: a.token, network: a.network, expiresAt: a.expiresAt ? Date.parse(a.expiresAt) : Date.now() + 30 * 86_400_000 }));
  safeSet(localStorage, ATTR_KEY, JSON.stringify([...current, ...added].slice(-10)));
}

/** Sets a dotted global path such as AWIN.Tracking.Sale without replacing existing parents. */
function setGlobal(path: string, value: unknown) {
  if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(path)) return;
  const parts = path.split('.');
  let obj: any = window;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined || obj[parts[i]] === null || typeof obj[parts[i]] !== 'object') obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
}

/** Network tags must be https (plain http is only accepted for a local test server). */
function isHttps(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname));
  } catch {
    return false;
  }
}

function loadScript(src: string, reinject: boolean) {
  if (!isHttps(src)) return;
  if (!reinject && loadedScripts.has(src)) return;
  loadedScripts.add(src);
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  s.defer = true;
  s.dataset.affiliateTag = 'true';
  document.body.appendChild(s);
}

function applySpec(spec: ClientSpec, consent: boolean) {
  if (spec.consentGlobal) setGlobal(spec.consentGlobal, consent);
  spec.globals?.forEach(g => setGlobal(g.path, g.value));
  spec.hiddenFields?.forEach(f => {
    if (document.getElementById(f.id)) document.getElementById(f.id)!.closest('form')?.remove();
    const form = document.createElement('form');
    form.style.display = 'none';
    form.name = f.formName;
    const area = document.createElement('textarea');
    area.id = f.id;
    area.wrap = 'physical';
    area.textContent = f.text;
    form.appendChild(area);
    document.body.appendChild(form);
  });
  spec.scripts?.forEach(s => loadScript(s.src, s.reinject));
  spec.pixels?.forEach(p => {
    if (!isHttps(p)) return;
    const img = new Image(1, 1);
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = p;
  });
}

function allowed(network: { consentPolicy?: string }) {
  return network.consentPolicy !== 'REQUIRE_MARKETING_CONSENT' || marketingConsent() === 'granted';
}

async function capture(cfg: TrackingConfig, search: string) {
  const params = new URLSearchParams(search);
  const matching = cfg.networks.filter(n => params.get(n.clickParam) && allowed(n));
  if (!matching.length) return;
  const wanted = new Set<string>([...cfg.utmParams, ...matching.flatMap(n => n.params)]);
  const picked: Record<string, string> = {};
  wanted.forEach(k => { const v = params.get(k); if (v) picked[k] = v.slice(0, 500); });
  const signature = JSON.stringify(picked);
  if (safeGet(sessionStorage, 'hogicar_aff_seen') === signature) return; // same landing, refreshed
  safeSet(sessionStorage, 'hogicar_aff_seen', signature);
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/affiliate-tracking/attribution`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: picked,
        landingUrl: window.location.href.slice(0, 1000),
        referrer: document.referrer || null,
        visitorId: visitorId(),
        consent: marketingConsent(),
      }),
      keepalive: true,
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data?.attributions) ? data.attributions : [];
    if (!list.length) return;
    remember(list);
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    // Affiliate dimensions for GA4 via GTM (no personal data).
    list.forEach((a: { network: string }) => {
      const n = matching.find(m => m.code === a.network);
      w.dataLayer.push({
        event: 'affiliate_attribution',
        affiliate_network: a.network.toLowerCase(),
        affiliate_publisher_id: (n?.publisherParam && params.get(n.publisherParam)) || undefined,
        affiliate_click_id: (n && params.get(n.clickParam)) || undefined,
        affiliate_click_reference: (n?.clickRefParam && params.get(n.clickRefParam)) || undefined,
      });
    });
  } catch {
    safeSet(sessionStorage, 'hogicar_aff_seen', '');
  }
}

function loadSitewide(cfg: TrackingConfig) {
  const consent = marketingConsent() === 'granted';
  cfg.networks.forEach(n => {
    if (!n.sitewide || !allowed(n)) return;
    applySpec(n.sitewide, consent);
  });
}

/** Start once per page load: capture any affiliate click, then load network site-wide tags. */
export function initAffiliateTracking(search: string = window.location.search) {
  if (started) return;
  started = true;
  const run = async () => {
    const cfg = await loadConfig();
    if (!cfg?.enabled || !cfg.networks?.length) return;
    await capture(cfg, search);
    loadSitewide(cfg);
    // A visitor who accepts marketing cookies after landing: capture for networks that need consent.
    onConsentChange(choice => {
      if (!choice.marketing) return;
      safeSet(sessionStorage, 'hogicar_aff_seen', '');
      capture(cfg, search).then(() => loadSitewide(cfg));
    });
  };
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(() => run(), { timeout: 3000 });
  else setTimeout(run, 1200);
}

/** References for the booking request; the server picks the winning click. */
export function getAffiliateAttributionRef(): { tokens: string[]; visitorId: string; consent: string } | undefined {
  const tokens = storedAttributions().map(a => a.token);
  const vid = safeGet(localStorage, VISITOR_KEY);
  if (!tokens.length && !vid) return undefined;
  return { tokens, visitorId: vid || visitorId(), consent: marketingConsent() };
}

const firedRefs = new Set<string>();

/** Confirmation page: fire the networks' conversion tags for this booking (once). */
export async function fireConversionTags(bookingRef: string) {
  const ref = (bookingRef || '').trim().toUpperCase();
  if (!ref || firedRefs.has(ref)) return;
  firedRefs.add(ref); // also covers React StrictMode double effects
  if (!storedAttributions().length && !safeGet(localStorage, VISITOR_KEY)) return; // never an affiliate visitor
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/affiliate-tracking/conversion?bookingRef=${encodeURIComponent(ref)}`, { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = await res.json();
    const consent = marketingConsent() === 'granted';
    (data?.tags || []).forEach((t: { consentPolicy?: string; spec: ClientSpec }) => {
      if (!allowed(t)) return;
      applySpec(t.spec, consent);
    });
  } catch { /* the server-to-server channel still reports the sale */ }
}
