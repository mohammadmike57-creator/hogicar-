// Recovery for "stale build" errors. After a new deploy, a browser that still has the old
// page open asks for JavaScript files whose names changed, and the import fails
// (Safari: "Importing a module script failed", Chrome: "Failed to fetch dynamically imported module").
// The fix is to reload the page once so the browser picks up the new build.

const CHUNK_ERROR_PATTERN = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Loading (CSS )?chunk|ChunkLoadError|Unable to preload CSS|Expected a JavaScript.*module script/i;

const STORAGE_KEY = 'hogicar-chunk-reloads';
const RELOAD_PARAM = '_v';
const WINDOW_MS = 60_000;
const MAX_RELOADS = 2;

export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? '');
  return CHUNK_ERROR_PATTERN.test(message);
};

const readAttempts = (): number[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((t: unknown) => typeof t === 'number' && Date.now() - t < WINDOW_MS) : [];
  } catch {
    return [];
  }
};

/**
 * Reloads the page to fetch the latest build. Returns false (and does nothing) if we already
 * reloaded twice in the last minute, so a genuinely broken file can't cause a reload loop.
 */
export const reloadForNewVersion = (): boolean => {
  if (typeof window === 'undefined') return false;
  const attempts = readAttempts();
  if (attempts.length >= MAX_RELOADS) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...attempts, Date.now()]));
  } catch {
    // Storage blocked (private mode): still reload once; the URL marker below stops loops.
    if (new URL(window.location.href).searchParams.has(RELOAD_PARAM)) return false;
  }
  // A cache-busting query makes sure the browser fetches a fresh index.html.
  const url = new URL(window.location.href);
  url.searchParams.set(RELOAD_PARAM, Date.now().toString(36));
  window.location.replace(url.toString());
  return true;
};

/** Removes the cache-busting marker from the address bar after a successful reload. */
export const cleanReloadMarker = () => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(RELOAD_PARAM)) return;
  url.searchParams.delete(RELOAD_PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + (url.search || '') + url.hash);
};
