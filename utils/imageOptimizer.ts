/**
 * Optimizes image URLs by appending resizing parameters for known CDNs.
 * Currently supports cdn.phototourl.com and mediaim.expedia.com
 */
export const getOptimizedImageUrl = (url: string | undefined, width: number, height?: number): string => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    
    // cdn.phototourl.com optimization (assuming common query params)
    if (urlObj.hostname.includes('phototourl.com')) {
      urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());
      urlObj.searchParams.set('fm', 'webp'); // Request webp format
      urlObj.searchParams.set('q', '80');    // Compression quality
      urlObj.searchParams.set('fit', 'max');
      return urlObj.toString();
    }
    
    // mediaim.expedia.com (often used for car images)
    if (urlObj.hostname.includes('expedia.com')) {
        // Expedia often uses path segments for resizing, but query params sometimes work too
        // If it doesn't support query params, we at least return the original
        urlObj.searchParams.set('width', width.toString());
        if (height) urlObj.searchParams.set('height', height.toString());
        return urlObj.toString();
    }
  } catch (e) {
    // If URL is invalid or relative, return as is
  }
  
  return url;
};

/**
 * Generates a srcset for optimized images
 */
export const getImageSrcSet = (url: string | undefined, baseWidth: number): string | undefined => {
  if (!url || !url.includes('phototourl.com')) return undefined;
  
  const w1 = baseWidth;
  const w2 = baseWidth * 2;
  
  return `${getOptimizedImageUrl(url, w1)} ${w1}w, ${getOptimizedImageUrl(url, w2)} ${w2}w`;
};
