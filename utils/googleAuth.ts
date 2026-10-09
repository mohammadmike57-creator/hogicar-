/**
 * "Continue with Google" using Google Identity Services (token client). The popup returns an access
 * token that the backend checks with Google before signing the customer in. Nothing is stored here.
 */
let loading: Promise<void> | null = null;

const loadGis = (): Promise<void> => {
  const w = window as any;
  if (w.google?.accounts?.oauth2) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error('Google sign-in couldn’t load. Check your connection and try again.')); };
    document.head.appendChild(s);
  });
  return loading;
};

/** Warm the script up when a Google button is shown, so the popup opens on the first click. */
export const preloadGoogle = () => { loadGis().catch(() => { /* retried on click */ }); };

export const getGoogleAccessToken = async (clientId: string): Promise<string> => {
  await loadGis();
  const google = (window as any).google;
  return new Promise<string>((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: (res: any) => {
          if (res?.error || !res?.access_token) reject(new Error(res?.error === 'access_denied' ? 'Google sign-in was cancelled.' : 'Google sign-in didn’t complete. Please try again.'));
          else resolve(res.access_token);
        },
        error_callback: (err: any) => reject(new Error(err?.type === 'popup_closed' ? 'Google sign-in was cancelled.' : 'Google sign-in didn’t complete. Please try again.')),
      });
      client.requestAccessToken();
    } catch {
      reject(new Error('Google sign-in isn’t available right now.'));
    }
  });
};
