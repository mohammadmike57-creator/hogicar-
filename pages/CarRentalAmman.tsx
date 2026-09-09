import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import Home from './Home';
import { getRouteSEO } from '../utils/seo';

/**
 * Dedicated component for Amman Car Rental SEO Landing Page.
 * This component satisfies the requirement for a route-specific React component
 * containing an explicit <Helmet> block for SEO.
 */
const CarRentalAmman: React.FC = () => {
  // We still use the utility to get the full configuration (FAQ, Content, etc.)
  // but we explicitly define the core SEO tags here in the Helmet block.
  const seoConfig = getRouteSEO('carRental', 'amman', '/car-rental-amman');
  
  const title = "Car Rental Amman – Affordable Deals | Hogicar";
  const description = "Rent a car in Amman with Hogicar. Best prices, full insurance, free cancellation. Book online now.";
  const canonical = "https://www.hogicar.com/car-rental-amman";
  const ogImage = "https://www.hogicar.com/android-chrome-512x512.png";

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        {/* Core SEO Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={seoConfig?.keywords || "car rental amman, rent a car amman, car hire amman"} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />

        {/* Hreflang Tags */}
        <link rel="alternate" hrefLang="en" href="https://www.hogicar.com/car-rental-amman" />
        <link rel="alternate" hrefLang="ar" href="https://www.hogicar.com/ar/تأجير-سيارات-في-عمان" />
        <link rel="alternate" hrefLang="x-default" href="https://www.hogicar.com/car-rental-amman" />

        {/* Open Graph Tags */}
        <meta property="og:site_name" content="Hogicar" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage} />

        {/* Twitter Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Structured Data */}
        {seoConfig?.structuredData && (
          <script type="application/ld+json">
            {seoConfig.structuredData}
          </script>
        )}
      </Helmet>
      
      {/* 
          We render the Home component which provides the UI.
          We pass skipSEO={true} to avoid duplicate Helmet blocks from SEOMetadata.
      */}
      <React.Suspense fallback={<div className="min-h-[60vh] flex flex-col items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-[#007ac2] border-t-transparent rounded-full animate-spin"></div></div>}>
        <Home seoConfig={seoConfig} skipSEO={true} />
      </React.Suspense>
    </div>
  );
};

export default CarRentalAmman;
