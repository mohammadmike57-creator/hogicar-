
import * as React from 'react';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { PUBLIC_BASE_URL } from '../lib/config';

interface SEOMetadataProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  noIndex?: boolean;
  schema?: any;
  structuredData?: string;
  preloadImageUrl?: string;
  preloadImageSrcSet?: string;
}

const SEOMetadata: React.FC<SEOMetadataProps> = ({ 
  title: defaultTitle, 
  description: defaultDescription, 
  keywords: defaultKeywords,
  canonicalUrl: defaultCanonical,
  ogImage: defaultOgImage,
  ogTitle: defaultOgTitle,
  ogDescription: defaultOgDescription,
  twitterTitle: defaultTwitterTitle,
  twitterDescription: defaultTwitterDescription,
  noIndex: defaultNoIndex,
  schema,
  structuredData,
  preloadImageUrl,
  preloadImageSrcSet
}) => {
  const location = useLocation();
  const [config, setConfig] = useState<any>(null);

  const normalizedPathname = location.pathname.replace(/\/$/, '') || '/';

  // Use props if they exist, otherwise fallback to config fetched from API
  const title = defaultTitle || config?.title || "Hogicar - Compare Car Rental Deals Worldwide";
  const description = defaultDescription || config?.description || "Compare and book affordable car rentals worldwide with Hogicar. Find trusted rental cars, airport rentals, and travel deals.";
  const keywords = defaultKeywords || config?.keywords || "car rental, car hire, rent a car, hogicar";
  const ogImage = defaultOgImage || config?.ogImage || 'https://www.hogicar.com/icon-512.png';
  const canonical = defaultCanonical || config?.canonicalUrl || (PUBLIC_BASE_URL + location.pathname);
  const isNoIndex = defaultNoIndex !== undefined ? defaultNoIndex : (config ? (config.indexable === false) : false);

  // AUTHORITATIVE TITLE SETTER
  useLayoutEffect(() => {
    if (title) {
      document.title = title;
      console.log('[SEO DEBUG] AUTHORITATIVE SET - document.title =', title);
    }
  }, [title, location.pathname]);

  useEffect(() => {
    // DEBUG LOGS
    console.log('[SEO DEBUG] Current URL:', window.location.href);
    console.log('[SEO DEBUG] Loaded SEO title:', title);
    console.log('[SEO DEBUG] Props - Title:', defaultTitle);
    console.log('[SEO DEBUG] API Config - Title:', config?.title);

    if (title) {
      document.title = title;
      console.log('[SEO DEBUG] Final document.title check:', document.title);
    }
  }, [title, location.pathname]);

  useEffect(() => {
    // RESET state when pathname changes to avoid showing stale data from previous route
    setConfig(null);

    // If props are provided, we don't necessarily need to fetch
    // But we fetch if the title is missing to ensure we have some metadata
    if (defaultTitle && defaultDescription) {
      return;
    }

    let isMounted = true;
    const fetchConfig = async () => {
      if (normalizedPathname.endsWith('.xml') || normalizedPathname.endsWith('.txt')) {
        return;
      }
      try {
        const res = await api.fetchSeoConfig(normalizedPathname);
        if (isMounted) {
          if (res.data) {
            setConfig(res.data);
          } else {
            setConfig(null);
          }
        }
      } catch (e) {
        if (isMounted) {
          console.error('Failed to fetch SEO config for', normalizedPathname);
          setConfig(null);
        }
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, [normalizedPathname]);

  useEffect(() => {
    // Handle robots/noindex separately
    const robotsTag = document.querySelector('meta[name="robots"]');
    if (isNoIndex) {
      if (robotsTag) {
        robotsTag.setAttribute('content', 'noindex, nofollow');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
      }
    } else if (robotsTag) {
      robotsTag.setAttribute('content', 'index, follow');
    }
  }, [isNoIndex]);

  useLayoutEffect(() => {
    // 1. Set Page Title IMMEDIATELY
    if (title) {
      document.title = title;
      if (typeof window !== 'undefined') {
        window.document.title = title;
      }
    }

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, attribute = 'name') => {
      if (!content) return;
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    if (description) setMetaTag('description', description);
    if (keywords) setMetaTag('keywords', keywords);

    // 3. Open Graph Tags
    const finalOgTitle = defaultOgTitle || config?.ogTitle || title;
    const finalOgDesc = defaultOgDescription || config?.ogDescription || description;
    setMetaTag('og:site_name', 'Hogicar', 'property');
    if (finalOgTitle) setMetaTag('og:title', finalOgTitle, 'property');
    if (finalOgDesc) setMetaTag('og:description', finalOgDesc, 'property');
    setMetaTag('og:url', PUBLIC_BASE_URL + location.pathname, 'property');
    setMetaTag('og:type', 'website', 'property');
    if (ogImage) setMetaTag('og:image', ogImage, 'property');

    // 4. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    const finalTwitterTitle = defaultTwitterTitle || config?.twitterTitle || title;
    const finalTwitterDesc = defaultTwitterDescription || config?.twitterDescription || description;
    if (finalTwitterTitle) setMetaTag('twitter:title', finalTwitterTitle);
    if (finalTwitterDesc) setMetaTag('twitter:description', finalTwitterDesc);
    if (ogImage) setMetaTag('twitter:image', ogImage);

    // 5. Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonical);

    // 6. Handle Robots tag (noindex)
    if (isNoIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag) {
        robotsTag.setAttribute('content', 'index, follow');
      }
    }

    // 7. Schema Markup (JSON-LD)
    if (schema || structuredData || config?.structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]#seo-schema');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.id = 'seo-schema';
        document.head.appendChild(scriptTag);
      }
      
      const schemaToInject = structuredData || config?.structuredData || (schema ? JSON.stringify(schema) : null);
      if (schemaToInject) {
        scriptTag.textContent = typeof schemaToInject === 'string' ? schemaToInject : JSON.stringify(schemaToInject);
      }
    } else {
      const scriptTag = document.querySelector('script[type="application/ld+json"]#seo-schema');
      if (scriptTag) scriptTag.remove();
    }

    // 8. Preload Image (Hero)
    if (preloadImageUrl && preloadImageUrl.length > 2) {
      let preloadTag = document.querySelector('link[rel="preload"][as="image"]#hero-preload') as HTMLLinkElement;
      const isNew = !preloadTag;
      if (isNew) {
        preloadTag = document.createElement('link');
        preloadTag.setAttribute('rel', 'preload');
        preloadTag.setAttribute('as', 'image');
        preloadTag.id = 'hero-preload';
        preloadTag.setAttribute('fetchpriority', 'high');
        document.head.appendChild(preloadTag);
      }
      
      // ONLY update if it has changed to prevent duplicate requests
      if (preloadTag.getAttribute('href') !== preloadImageUrl) {
        preloadTag.setAttribute('href', preloadImageUrl);
      }

      if (preloadImageSrcSet) {
        if (preloadTag.getAttribute('imagesrcset') !== preloadImageSrcSet) {
          preloadTag.setAttribute('imagesrcset', preloadImageSrcSet);
          preloadTag.setAttribute('imagesizes', '100vw');
        }
      } else if (preloadTag.hasAttribute('imagesrcset')) {
        preloadTag.removeAttribute('imagesrcset');
        preloadTag.removeAttribute('imagesizes');
      }
    } else {
      const existingPreload = document.querySelector('link[rel="preload"][as="image"]#hero-preload');
      if (existingPreload) existingPreload.remove();
    }
  }, [title, description, keywords, ogImage, isNoIndex, canonical, location.pathname, schema, structuredData, config, preloadImageUrl, preloadImageSrcSet]);

  return null;
};

export default SEOMetadata;