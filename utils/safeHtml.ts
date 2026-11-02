import DOMPurify from 'dompurify';

/**
 * HTML written in the admin (pages, blog articles, homepage text), cleaned before it is shown: scripts, event
 * handlers ("onclick") and "javascript:" links are removed; formatting, images, tables and video embeds from
 * YouTube, Vimeo and Google Maps are kept.
 */
const EMBEDS = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|google\.com\/maps|maps\.google\.com)\//i;

let hooked = false;
function hook() {
  if (hooked || typeof window === 'undefined') return;
  hooked = true;
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = (node as Element).getAttribute?.('src') || '';
      if (!EMBEDS.test(src)) node.parentNode?.removeChild(node);
    }
  });
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    // Links opening a new tab cannot reach back into this page.
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer');
  });
}

export function safeHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof window === 'undefined') return '';
  hook();
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'loading'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
  });
}

/** JSON for a <script type="application/ld+json"> tag: "<" is escaped so a value can never close the tag. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
