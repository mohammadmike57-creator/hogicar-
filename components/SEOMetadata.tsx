
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../api';
import { PUBLIC_BASE_URL } from '../lib/config';
import { getRouteSEO, detectRouteType } from '../utils/seo';

interface SEOMetadataProps {
  title?: string;
  description?: string;
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
  config?: any; 
}

const SEOMetadata: React.FC<SEOMetadataProps> = ({ 
  title: propTitle, 
  description: propDescription, 
  keywords: propKeywords,
  canonicalUrl: propCanonical,
  ogImage: propOgImage,
  ogTitle: propOgTitle,
  ogDescription: propOgDescription,
  twitterTitle: propTwitterTitle,
  twitterDescription: propTwitterDescription,
  noIndex: propNoIndex,
  schema,
  structuredData,
  preloadImageUrl,
  preloadImageSrcSet,
  config: propConfig
}) => {
  const location = useLocation();
  const [apiConfig, setApiConfig] = useState<any>(null);

  const normalizedPathname = location.pathname.replace(/\/$/, '') || '/';
  const config = propConfig || apiConfig;

  // 1. Determine Dynamic SEO Defaults based on path
  const path = location.pathname;
  const { routeType, locationSlug } = detectRouteType(path);
  const dynamicSEO = getRouteSEO(routeType, locationSlug, path);

  // 2. Resolve final values
  const title = propTitle || config?.title || (routeType ? dynamicSEO.title : "Hogicar - Compare Car Rental Deals Worldwide");
  const description = propDescription || config?.description || (routeType ? dynamicSEO.description : "Compare and book affordable car rentals worldwide with Hogicar. Find trusted rental cars, airport rentals, and travel deals.");
  const keywords = propKeywords || config?.keywords || "car rental, car hire, rent a car, hogicar";
  const ogImage = propOgImage || config?.ogImage || 'https://www.hogicar.com/android-chrome-512x512.png?v=2';
  const canonical = propCanonical || config?.canonicalUrl || dynamicSEO?.canonicalUrl || (PUBLIC_BASE_URL + location.pathname);
  const isNoIndex = propNoIndex !== undefined ? propNoIndex : (config ? (config.indexable === false) : false);

  const finalOgTitle = propOgTitle || config?.ogTitle || title;
  const finalOgDesc = propOgDescription || config?.ogDescription || description;
  const finalTwitterTitle = propTwitterTitle || config?.twitterTitle || title;
  const finalTwitterDesc = propTwitterDescription || config?.twitterDescription || description;

  const schemaToInject = structuredData || config?.structuredData || (schema ? JSON.stringify(schema) : null);
  const lang = config?.lang || 'en';
  const alternateRoute = config?.alternateRoute;

  useEffect(() => {
    if (propConfig || (propTitle && propDescription)) {
      setApiConfig(null);
      return;
    }

    let isMounted = true;
    const fetchConfig = async () => {
      const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|webmanifest|xml|txt|js|css|map)$/i.test(normalizedPathname);
      if (isStaticAsset) return;
      try {
        const res = await api.fetchSeoConfig(normalizedPathname);
        if (isMounted) {
          setApiConfig(res.data || null);
        }
      } catch (e) {
        if (isMounted) setApiConfig(null);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, [normalizedPathname, propConfig, propTitle, propDescription]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={isNoIndex ? 'noindex, nofollow' : 'index, follow'} />

      <meta property="og:site_name" content="Hogicar" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDesc} />
      <meta name="twitter:image" content={ogImage} />

      {schemaToInject && (
        <script type="application/ld+json" id="seo-schema">
          {typeof schemaToInject === 'string' ? schemaToInject : JSON.stringify(schemaToInject)}
        </script>
      )}

      {preloadImageUrl && typeof preloadImageUrl === 'string' && preloadImageUrl.length > 2 && (
        <link 
          rel="preload" 
          as="image" 
          href={preloadImageUrl} 
          {...(preloadImageSrcSet ? { 
            imagesrcset: preloadImageSrcSet,
            imagesizes: "100vw" 
          } : {})}
        />
      )}

      <link rel="alternate" hrefLang={lang} href={PUBLIC_BASE_URL + normalizedPathname} />
      {alternateRoute && (
        <>
          <link rel="alternate" hrefLang={lang === 'en' ? 'ar' : 'en'} href={PUBLIC_BASE_URL + alternateRoute} />
          <link rel="alternate" hrefLang="x-default" href={PUBLIC_BASE_URL + (lang === 'en' ? normalizedPathname : alternateRoute)} />
        </>
      )}
    </Helmet>
  );
};

export default SEOMetadata;
