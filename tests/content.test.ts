import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CITY_CONTENT_AR } from '../utils/cityContentAr';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|html)$/.test(f) ? [p] : [];
  });
}
const customerFacing = [...files('pages'), ...files('components'), 'index.html'].filter(f => !f.includes('SupplierLogin'));

describe('website content stays honest and consistent', () => {
  it('makes no claims the business cannot back up', () => {
    const banned = [/900\+/, /60,000\+/, /2M\+/, /160 countries/i, /24\/7 (customer )?support/i, /day and night/i, /around the clock/i];
    const found = customerFacing.flatMap(f => banned.filter(re => re.test(readFileSync(f, 'utf8'))).map(re => `${f}: ${re}`));
    expect(found).toEqual([]);
  });

  it('spells the brand one way', () => {
    const oldSpelling = 'Hogi' + 'Car'; // written in two parts so this file does not contain it
    const found = customerFacing.filter(f => readFileSync(f, 'utf8').includes(oldSpelling));
    expect(found).toEqual([]);
  });

  it('Arabic pages only link to Arabic pages that exist (Arabic addresses)', () => {
    const html = JSON.stringify(CITY_CONTENT_AR);
    const englishSlugLinks = html.match(/href=\\?"\/ar\/[a-z][^"\\]*/g) || [];
    expect(englishSlugLinks).toEqual([]);
  });
});
