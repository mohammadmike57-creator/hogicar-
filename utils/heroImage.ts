import { API_BASE_URL } from '../lib/config';

export const resolveAssetUrl = (url?: string | null): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return trimmed;
};

export const getHeroSrcSet = (imageUrl?: string | null, format: 'webp' | 'png' = 'webp'): string | undefined => {
  const resolved = resolveAssetUrl(imageUrl);
  if (!resolved || !resolved.includes('/uploads/hero/')) return undefined;
  const source = resolved.replace(/\.(webp|png|jpe?g)$/i, `.${format}`);
  return `${source.replace(`.${format}`, `_thumb.${format}`)} 400w, ${source.replace(`.${format}`, `_medium.${format}`)} 800w, ${source.replace(`.${format}`, `_large.${format}`)} 1600w`;
};
