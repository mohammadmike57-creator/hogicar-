import { API_BASE_URL } from '../lib/config';

/** Affiliate tracking: hogicar.com/?ref=CODE is remembered for the affiliate's attribution window. */
const KEY = 'hogicar_aff';
const CODE_RE = /^[A-Za-z0-9_-]{3,40}$/;

type Stored = { code: string; until: number };

let seenThisSession: string | null = null;

export function captureAffiliateRef(code: string | null) {
  if (!code || !CODE_RE.test(code)) return;
  const normalized = code.toUpperCase();
  // One click per code per browser session, however many pages carry ?ref=.
  if (seenThisSession === normalized) return;
  seenThisSession = normalized;
  try {
    if (sessionStorage.getItem(`${KEY}_seen`) === normalized) return;
    sessionStorage.setItem(`${KEY}_seen`, normalized);
  } catch { /* storage blocked */ }
  fetch(`${API_BASE_URL}/api/public/affiliates/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: normalized }),
    keepalive: true,
  })
    .then(r => (r.ok ? r.json() : null))
    .then(res => {
      if (!res?.valid) return;
      const days = Number(res.cookieDays) > 0 ? Number(res.cookieDays) : 30;
      try { localStorage.setItem(KEY, JSON.stringify({ code: res.code || normalized, until: Date.now() + days * 86_400_000 })); } catch { /* storage blocked */ }
    })
    .catch(() => { /* tracking is best effort */ });
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Stored;
    return v && typeof v.code === 'string' && typeof v.until === 'number' ? v : null;
  } catch {
    return null;
  }
}

/** The affiliate code to attach to a booking, if a tracked click is still within its window. */
export function activeAffiliateCode(): string | undefined {
  const v = readStored();
  if (!v) return undefined;
  if (v.until < Date.now()) {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    return undefined;
  }
  return v.code;
}
