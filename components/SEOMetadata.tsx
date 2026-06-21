
import * as React from 'react';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.fetchSeoConfig(location.pathname);
        if (res.data) {
          setConfig(res.data);
        } else {
          setConfig(null);
        }
      } catch (e) {
        console.error('Failed to fetch SEO config for', location.pathname);
        setConfig(null);
      }
    };
    fetchConfig();
  }, [location.pathname]);

  const title = config?.title || defaultTitle;
  const description = config?.description || defaultDescription;
  const keywords = config?.keywords || defaultKeywords || 'car rental, cheap car hire, auto rental, travel';
  const ogImage = config?.ogImage || defaultOgImage || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop';
  const canonical = config?.canonicalUrl || defaultCanonical || (window.location.origin + location.pathname);
  const isNoIndex = config ? (config.indexable === false) : defaultNoIndex;

  useEffect(() => {
    // 1. Set Page Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);

    // 3. Open Graph Tags
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', ogImage, 'property');
    setMetaTag('og:url', window.location.href, 'property');
    setMetaTag('og:type', 'website', 'property');

    // 4. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

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
  }, [title, description, keywords, ogImage, isNoIndex, canonical, location]);

  return null;
};

export default SEOMetadata;