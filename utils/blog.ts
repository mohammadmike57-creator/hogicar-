import { API_BASE_URL } from '../lib/config';

export const BLOG_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200';

/** Uploaded images are stored as "/uploads/..."; those are served by the backend. */
export const blogImage = (url?: string | null, fallback: string = BLOG_FALLBACK_IMAGE): string => {
  if (!url) return fallback;
  return url.startsWith('/') && !url.startsWith('//') ? `${API_BASE_URL}${url}` : url;
};

/** Reading time from the article text itself (about 220 words a minute), never less than 1 minute. */
export const readingMinutes = (html?: string | null): number | null => {
  if (!html) return null;
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / 220)) : null;
};

export const readingLabel = (html?: string | null, stored?: string | null): string => {
  const minutes = readingMinutes(html);
  if (minutes) return `${minutes} min read`;
  return stored || '';
};

export const formatBlogDate = (value?: string | null, style: 'short' | 'long' = 'short'): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Article path in the article's own language. */
export const articlePath = (slug: string, lang?: string | null): string =>
  lang === 'ar' ? `/ar/blog/${slug}` : `/blog/${slug}`;

export interface TocItem { id: string; text: string; }

const FAQ_HEADING = /^(faqs?|frequently asked questions)\b/i;

const plain = (html?: string | null) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The summary shown under a title. Some stored excerpts were cut from the article text and begin
 * with its first heading ("Driving Route: Amman to the Dead Sea The Dead Sea is..."); those are
 * replaced by the first paragraph, shortened at a word.
 */
export const cleanExcerpt = (excerpt?: string | null, content?: string | null, max = 180): string => {
  const text = (excerpt || '').trim();
  const heading = content?.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  const headingText = heading ? plain(heading[1]) : '';
  if (text && !(headingText && text.startsWith(headingText))) return text;
  const paragraph = content?.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const source = paragraph ? plain(paragraph[1]) : text.slice(headingText.length).trim();
  if (source.length <= max) return source;
  const cut = source.lastIndexOf(' ', max);
  return `${source.slice(0, cut > max / 2 ? cut : max).replace(/[,;:.\s]+$/, '')}…`;
};

/** Public byline: internal team names ("Hogicar SEO Team") read as "Hogicar Team". */
export const displayAuthor = (name?: string | null): string =>
  !name || /seo|admin|system/i.test(name) ? 'Hogicar Team' : name;

/** "/car-rental-amman" -> "Car rental in Amman" when a route has no destination name. */
export const routeLabel = (label: string): string => {
  if (!label.startsWith('/')) return label;
  const slug = label.replace(/^\/(ar\/)?/, '');
  const m = slug.match(/^(.*?)-?car-(rental|hire)-?(.*)$/);
  const place = (m ? (m[3] || m[1]) : slug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return m ? `Car rental in ${place}` : place;
};

/**
 * Gives every h2 in the article an id (kept when it already has one) and returns the table of
 * contents. Works on the parsed document, so headings with classes or attributes are found too.
 */
export const prepareArticle = (html?: string | null, options: { stripFaq?: boolean } = {}): { html: string; toc: TocItem[] } => {
  if (!html || typeof DOMParser === 'undefined') return { html: html || '', toc: [] };
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  // The page shows the FAQs as an accordion, so an FAQ section written into the text would repeat them.
  if (options.stripFaq) {
    root.querySelectorAll('h2').forEach((h2) => {
      if (!FAQ_HEADING.test((h2.textContent || '').trim())) return;
      const section = h2.closest('section');
      if (section && section !== root) { section.remove(); return; }
      let next = h2.nextElementSibling;
      while (next && next.tagName !== 'H2') { const after = next.nextElementSibling; next.remove(); next = after; }
      h2.remove();
    });
  }
  const toc: TocItem[] = [];
  const used = new Set<string>();
  root.querySelectorAll('h2').forEach((h2, index) => {
    const text = (h2.textContent || '').trim();
    if (!text) return;
    let id = h2.id || text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || `section-${index + 1}`;
    while (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    h2.id = id;
    toc.push({ id, text });
  });
  // Links inside articles that leave the site open in a new tab.
  root.querySelectorAll('a[href^="http"]').forEach((a) => {
    if (!a.getAttribute('href')?.includes('hogicar.com')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return { html: root.innerHTML, toc };
};
