/**
 * Click id from a distribution-channel deeplink (/go/...). Kept for the channel's attribution window
 * so the booking can be linked to the channel. It is only an opaque reference; never a price.
 */
const KEY = 'hc_dist_click';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const saveDistributionClick = (token: string | null | undefined) => {
  if (!token) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, at: Date.now() }));
  } catch {
    /* storage unavailable: attribution is best effort */
  }
};

export const getDistributionClick = (): string | undefined => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as { token?: string; at?: number };
    if (!v.token || !v.at || Date.now() - v.at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return undefined;
    }
    return v.token;
  } catch {
    return undefined;
  }
};
