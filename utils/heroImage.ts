import { API_BASE_URL } from '../lib/config';

export const resolveAssetUrl = (url?: string | null): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return trimmed;
};

export const getHeroSrcSet = (imageUrl?: string | null, format: 'webp' | 'png' = 'webp'): string | undefined => {
  void imageUrl;
  void format;
  return undefined;
};
