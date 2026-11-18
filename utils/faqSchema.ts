/**
 * Questions and answers shown on a page, read from its own HTML, as a schema.org FAQPage, so the structured
 * data always matches what visitors see. A FAQ section starts at a heading such as "Frequently asked questions"
 * (or "FAQ", or the Arabic "الأسئلة الشائعة"); each following h3/h4 (or <summary>/<dt>) is a question and the
 * text after it, up to the next question, is its answer. The section ends at the next heading of the same level.
 */
export type Faq = { question: string; answer: string };

const FAQ_HEADING = /frequently asked|\bfaqs?\b|الأسئلة الشائعة|أسئلة شائعة/i;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export function faqsFromHtml(html: string): Faq[] {
  if (!html || typeof DOMParser === 'undefined') return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = Array.from(doc.body.querySelectorAll('h1, h2, h3'));
  const start = headings.find(h => FAQ_HEADING.test(h.textContent || ''));
  if (!start) return [];
  const level = Number(start.tagName.substring(1));
  const out: Faq[] = [];
  let current: Faq | null = null;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  walker.currentNode = start;
  let node = walker.nextNode() as Element | null;
  while (node) {
    const tag = node.tagName;
    const hLevel = /^H[1-6]$/.test(tag) ? Number(tag.substring(1)) : 0;
    if (hLevel && hLevel <= level) break;
    if (hLevel > level || tag === 'SUMMARY' || tag === 'DT') {
      if (current && current.answer) out.push(current);
      current = { question: clean(node.textContent || ''), answer: '' };
    } else if (current && (tag === 'P' || tag === 'LI' || tag === 'DD')) {
      const text = clean(node.textContent || '');
      if (text) current.answer = current.answer ? `${current.answer} ${text}` : text;
    }
    node = walker.nextNode() as Element | null;
  }
  if (current && current.answer) out.push(current);
  return out.filter(f => f.question.length > 3 && f.answer.length > 3);
}

export function faqPageSchema(faqs: Faq[]) {
  const seen = new Set<string>();
  const unique = faqs.filter(f => { const k = f.question.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  if (unique.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: unique.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
}
