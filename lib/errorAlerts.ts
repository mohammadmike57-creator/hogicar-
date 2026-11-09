// Error alerts (Sentry) for the website. Off unless VITE_SENTRY_DSN is set when the site is built: then the
// Sentry code is downloaded after the page has loaded, so visitors' page speed is not affected.
// No personal data is sent: no IP address, and addresses lose their query and # part (which can hold an
// email address, a booking reference or a booking link key).

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined) || '';

type SentryLike = { captureException: (e: unknown, ctx?: unknown) => void };
let sentry: SentryLike | null = null;
const waiting: unknown[] = [];

/** "https://www.hogicar.com/voucher?bookingRef=H1&k=x#a" -> "https://www.hogicar.com/voucher" */
export const stripUrl = (url?: string) => (url ? url.split(/[?#]/)[0] : url);

// Errors that say nothing about Hogicar's code: browser extensions, blocked trackers, flaky networks.
const IGNORE = [
  /ResizeObserver loop/i, /Non-Error promise rejection/i, /Load failed/i, /Failed to fetch/i,
  /NetworkError/i, /Network Error/i, /timeout of \d+ms exceeded/i, /chrome-extension:|moz-extension:|safari-extension:/i,
  /Request aborted/i, /canceled/i,
];

export function startErrorAlerts() {
  if (!dsn || typeof window === 'undefined') return;
  const load = () => import('@sentry/browser').then(Sentry => {
    Sentry.init({
      dsn,
      environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) || 'production',
      release: (import.meta.env.VITE_RELEASE as string | undefined) || undefined,
      tracesSampleRate: 0,
      // Sentry collects these by default: all off, so no personal data leaves the visitor's browser.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        stackFrameVariables: false,
      },
      ignoreErrors: IGNORE,
      denyUrls: [/googletagmanager\.com/, /google-analytics\.com/, /clarity\.ms/, /doubleclick\.net/, /awin1\.com/, /dwin1\.com/, /^chrome-extension:/],
      beforeSend(event) {
        if (event.request) {
          event.request.url = stripUrl(event.request.url);
          delete event.request.query_string;
          delete event.request.cookies;
          if (event.request.headers) delete event.request.headers.Referer;
        }
        delete event.user;
        return event;
      },
      beforeBreadcrumb(crumb) {
        if (crumb.data && typeof crumb.data.url === 'string') crumb.data.url = stripUrl(crumb.data.url);
        if (crumb.data && typeof crumb.data.from === 'string') crumb.data.from = stripUrl(crumb.data.from);
        if (crumb.data && typeof crumb.data.to === 'string') crumb.data.to = stripUrl(crumb.data.to);
        // What visitors type stays on their device.
        if (crumb.category === 'ui.input') return null;
        return crumb;
      },
    });
    sentry = Sentry;
    waiting.splice(0).forEach(e => Sentry.captureException(e));
  }).catch(() => { /* alerts are optional */ });
  if (document.readyState === 'complete') setTimeout(load, 2000);
  else window.addEventListener('load', () => setTimeout(load, 2000), { once: true });
}

/** Reports an error caught by the page (for example by the error screen). */
export function reportError(error: unknown) {
  if (!dsn) return;
  if (sentry) sentry.captureException(error);
  else if (waiting.length < 10) waiting.push(error);
}
