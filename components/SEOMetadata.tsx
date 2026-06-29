
import * as React from 'react';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';

interface SEOMetadataProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const SEOMetadata: React.FC<SEOMetadataProps> = ({ 
  title: defaultTitle, 
  description: defaultDescription, 
  keywords: defaultKeywords,
  canonicalUrl: defaultCanonical,
  ogImage: defaultOgImage,
  noIndex: defaultNoIndex 
}) => {
  const location = useLocation();
  const [config, setConfig] = useState<any>(null);

  const normalizedPathname = location.pathname.replace(/\/$/, '') || '/';

  // Use props if they exist, otherwise fallback to config fetched from API
  const title = defaultTitle || config?.title || "Hogicar | Car Rental & Search";
  const description = defaultDescription || config?.description || "Search and compare car rentals from 900+ suppliers worldwide.";
  const keywords = defaultKeywords || config?.keywords || "car rental, hire car, search car rental, hogicar";
  const ogImage = defaultOgImage || config?.ogImage || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop';
  const canonical = defaultCanonical || config?.canonicalUrl || (typeof window !== 'undefined' ? (window.location.origin + location.pathname) : '');
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
    if (title) setMetaTag('og:title', title, 'property');
    if (description) setMetaTag('og:description', description, 'property');
    setMetaTag('og:url', window.location.href, 'property');
    setMetaTag('og:type', 'website', 'property');
    if (ogImage) setMetaTag('og:image', ogImage, 'property');

    // 4. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    if (title) setMetaTag('twitter:title', title);
    if (description) setMetaTag('twitter:description', description);
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
  }, [title, description, keywords, ogImage, isNoIndex, canonical, location.pathname]);

  return null;
};

export default SEOMetadata;