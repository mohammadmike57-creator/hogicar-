
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../api';
import { PUBLIC_BASE_URL } from '../lib/config';
import { getRouteSEO } from '../utils/seo';

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
  let routeType = '';
  let locationSlug = '';
  const path = location.pathname;

  if (path.startsWith('/car-rental-')) {
    routeType = 'carRental';
    locationSlug = path.replace('/car-rental-', '');
  } else if (path.startsWith('/airport-car-rental-')) {
    routeType = 'airportCarRental';
    locationSlug = path.replace('/airport-car-rental-', '');
  } else if (path.startsWith('/best-car-rental-')) {
    routeType = 'bestCarRental';
    locationSlug = path.replace('/best-car-rental-', '');
  } else if (path.startsWith('/cheap-car-rental-')) {
    const slug = path.replace('/cheap-car-rental-', '');
    if (slug.includes('airport')) {
      routeType = 'cheapAirport';
    } else {
      routeType = 'cheapCarRental';
    }
    locationSlug = slug;
  } else if (path.startsWith('/economy-car-rental-')) {
    routeType = 'economyCarRental';
    locationSlug = path.replace('/economy-car-rental-', '');
  } else if (path.startsWith('/luxury-car-rental-')) {
    routeType = 'luxuryCarRental';
    locationSlug = path.replace('/luxury-car-rental-', '');
  } else if (path.startsWith('/monthly-car-rental-')) {
    routeType = 'monthlyCarRental';
    locationSlug = path.replace('/monthly-car-rental-', '');
  } else if (path.startsWith('/long-term-rental-')) {
    routeType = 'longTermRental';
    locationSlug = path.replace('/long-term-rental-', '');
  } else if (path.startsWith('/suv-rental-')) {
    routeType = 'suvRental';
    locationSlug = path.replace('/suv-rental-', '');
  } else if (path.startsWith('/van-rental-')) {
    routeType = 'vanRental';
    locationSlug = path.replace('/van-rental-', '');
  } else if (path.startsWith('/rent-a-car-')) {
    routeType = 'rentACar';
    locationSlug = path.replace('/rent-a-car-', '');
  } else if (path.endsWith('-airport-car-rental')) {
    routeType = 'airportSpecific';
    locationSlug = path.substring(1).replace('-airport-car-rental', '');
  } else {
    const countries = ['bahrain', 'egypt', 'jordan', 'kuwait', 'oman', 'qatar', 'saudi-arabia', 'united-arab-emirates'];
    const slug = path.substring(1).toLowerCase();
    if (countries.includes(slug)) {
      routeType = 'country';
      locationSlug = slug;
    }
  }

  const dynamicSEO = getRouteSEO(routeType, locationSlug, path);

  // 2. Resolve final values
  const title = propTitle || config?.title || (routeType ? dynamicSEO.title : "Hogicar - Compare Car Rental Deals Worldwide");
  const description = propDescription || config?.description || (routeType ? dynamicSEO.description : "Compare and book affordable car rentals worldwide with Hogicar. Find trusted rental cars, airport rentals, and travel deals.");
  const keywords = propKeywords || config?.keywords || "car rental, car hire, rent a car, hogicar";
  const ogImage = propOgImage || config?.ogImage || 'https://www.hogicar.com/android-chrome-512x512.png?v=2';
  const canonical = propCanonical || config?.canonicalUrl || (PUBLIC_BASE_URL + location.pathname);
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
      <meta property="og:url" content={PUBLIC_BASE_URL + location.pathname} />
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

      {preloadImageUrl && preloadImageUrl.length > 2 && (
        <link 
          rel="preload" 
          as="image" 
          id="hero-preload" 
          href={preloadImageUrl} 
          imagesrcset={preloadImageSrcSet} 
          imagesizes={preloadImageSrcSet ? '100vw' : undefined}
        />
      )}

      <link rel="alternate" hreflang={lang} href={PUBLIC_BASE_URL + normalizedPathname} />
      {alternateRoute && (
        <>
          <link rel="alternate" hreflang={lang === 'en' ? 'ar' : 'en'} href={PUBLIC_BASE_URL + alternateRoute} />
          <link rel="alternate" hreflang="x-default" href={PUBLIC_BASE_URL + (lang === 'en' ? normalizedPathname : alternateRoute)} />
        </>
      )}
    </Helmet>
  );
};

export default SEOMetadata;