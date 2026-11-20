import { describe, expect, it } from 'vitest';
import { faqPageSchema, faqsFromHtml } from '../utils/faqSchema';

describe('FAQ marking for search engines', () => {
  it('reads the questions and answers under the FAQ heading only', () => {
    const html = `<h2>Driving in Amman</h2><p>Intro.</p>
      <h2>Frequently asked questions</h2>
      <h3>Do I need a licence?</h3><p>Yes, a valid one.</p><p>Held for a year.</p>
      <h3>Can I cancel?</h3><ul><li>Free on most cars.</li></ul>
      <h2>More guides</h2><h3>Not a question</h3><p>Ignored.</p>`;
    expect(faqsFromHtml(html)).toEqual([
      { question: 'Do I need a licence?', answer: 'Yes, a valid one. Held for a year.' },
      { question: 'Can I cancel?', answer: 'Free on most cars.' },
    ]);
  });

  it('understands Arabic FAQ headings', () => {
    expect(faqsFromHtml('<h2>الأسئلة الشائعة</h2><h3>هل أحتاج رخصة؟</h3><p>نعم، رخصة سارية.</p>')).toHaveLength(1);
  });

  it('gives nothing when a page has no FAQ, and lists a question once', () => {
    expect(faqsFromHtml('<h2>About</h2><p>Text</p>')).toEqual([]);
    expect(faqPageSchema([])).toBeNull();
    const s = faqPageSchema([{ question: 'Q?', answer: 'A.' }, { question: 'q?', answer: 'B.' }]) as any;
    expect(s['@type']).toBe('FAQPage');
    expect(s.mainEntity).toHaveLength(1);
  });
});
