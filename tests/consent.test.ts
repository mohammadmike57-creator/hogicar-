import { beforeEach, describe, expect, it } from 'vitest';
import { marketingConsent, setConsent } from '../utils/consent';

const consentUpdates = () => ((window as any).dataLayer || []).filter((e: any) => e && e[0] === 'consent' && e[1] === 'update').map((e: any) => e[2]);

beforeEach(() => { (window as any).dataLayer = []; localStorage.clear(); });

describe('cookie consent', () => {
  it('starts unknown and remembers the visitor\'s choice', () => {
    expect(marketingConsent()).toBe('unknown');
    setConsent({ analytics: true, marketing: false });
    expect(marketingConsent()).toBe('denied');
  });

  it('passes the choice to Google consent mode', () => {
    setConsent({ analytics: true, marketing: true });
    expect(consentUpdates().pop()).toMatchObject({ ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    setConsent({ analytics: false, marketing: false });
    expect(consentUpdates().pop()).toMatchObject({ ad_storage: 'denied', analytics_storage: 'denied' });
  });
});
