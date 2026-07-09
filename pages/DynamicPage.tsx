
import * as React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SEOMetadata from '../components/SEOMetadata';
import { ArrowLeft, Clock, Loader2, CheckCircle, Shield, Award, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import Home from './Home';
import Reviews from '../components/Reviews';
import TrustedSuppliers from '../components/TrustedSuppliers';
import LatestTravelGuides from '../components/LatestTravelGuides';
import { API_BASE_URL } from '../lib/config';

const DynamicPage: React.FC = () => {
  const location = useLocation();
  const [page, setPage] = useState<any>(null);
  const [seoConfig, setSeoConfig] = useState<any>(null);
  const [isLandingPage, setIsLandingPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [homepageContent, setHomepageContent] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    const loadCommonData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/homepage/content`);
        if (response.ok) {
          setHomepageContent(await response.json());
        }
      } catch (e) {
        console.error("Failed to load common content:", e);
      }
    };

    const loadSettings = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/public/settings`);
          if (response.ok) {
            setSiteSettings(await response.json());
          }
        } catch (e) {
          console.error("Failed to load site settings:", e);
        }
    };

    loadCommonData();
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      setError(false);
      setIsLandingPage(false);
      setPage(null);
      setSeoConfig(null);

      // Normalize route
      const route = location.pathname.replace(/\/$/, '') || '/';
      const lowercaseRoute = route.toLowerCase();

      // STRICT BYPASS for static file extensions to prevent JSON parsing crashes
      if (lowercaseRoute.endsWith('.xml') || lowercaseRoute.endsWith('.txt')) {
        if (!location.search.includes('spa_fallback=1')) {
          console.warn('[SPA] Detected static file route in DynamicPage, triggering hard reload:', route);
          window.location.href = route + (location.search ? location.search + '&' : '?') + 'spa_fallback=1';
        } else {
          console.error('[SPA] Failed to load static file from server, even with spa_fallback=1. Showing error.');
          setError(true);
          setLoading(false);
        }
        return;
      }
      
      const slug = route.startsWith('/') ? route.substring(1) : route;

      try {
        // 1. Try fetching static page content first (if there's a slug)
        if (slug) {
          const pageResponse = await fetch(`${API_BASE_URL}/api/pages/${slug}`);
          if (pageResponse.ok) {
            const data = await pageResponse.json();
            
            // Check if it's an SEO landing page or should use the Home layout
            // data.route is only present in SeoConfigDto
            if (data.route || data.layout === 'LANDING_PAGE' || data.layout === 'HOMEPAGE') {
              setSeoConfig(data);
              setIsLandingPage(true);
              setLoading(false);
              return;
            }

            setPage(data);
            setLoading(false);
            return;
          }
        }

        // 2. If no static page, check if it's an SEO route (e.g. /car-rental-amman)
        const seoResponse = await fetch(`${API_BASE_URL}/api/seo/config?route=${encodeURIComponent(route)}`);
        if (seoResponse.ok) {
           const seoData = await seoResponse.json();
           // Ensure it's not a generic fallback/empty response
           if (seoData && seoData.title) {
             setSeoConfig(seoData);
             setIsLandingPage(true);
             setLoading(false);
             return;
           }
        }

        throw new Error('Page not found');
      } catch (err) {
        console.error('Error fetching page data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [location.pathname]);

  if (loading) {
    return (
      <>
        <SEOMetadata title="" description="" />
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
           <Loader2 className="w-8 h-8 text-[#007ac2] animate-spin" />
           <p className="mt-4 text-slate-500 font-medium text-sm">Loading page...</p>
        </div>
      </>
    );
  }

  // If it's a landing page, render the Home component with SEO config
  if (isLandingPage && seoConfig) {
    return (
      <Home seoConfig={seoConfig} />
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 text-center px-4">
         <h1 className="text-2xl font-bold text-slate-800">Page Not Found</h1>
         <p className="text-slate-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
         <Link to="/" className="mt-6 bg-[#003580] text-white px-6 py-2 rounded-card hover:bg-blue-800 transition-colors flex items-center gap-2 mx-auto"><ArrowLeft className="w-4 h-4"/> Return Home</Link>
      </div>
    );
  }

  // Helper to process line breaks for simple text content
  const processedContent = page.content.split('\n').map((line: string, i: number) => (
      <React.Fragment key={i}>
          {line}
          <br />
      </React.Fragment>
  ));

  const heroImageUrl = siteSettings?.heroImageUrl;
  const heroBackgroundImage = heroImageUrl ? (heroImageUrl.startsWith('/') && !heroImageUrl.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl) : null;

  const content = (
    <div className="bg-white min-h-screen">
      {/* Standard Page Hero */}
      <div className={`relative text-white py-16 md:py-24 overflow-hidden ${!heroBackgroundImage ? 'bg-[#003580]' : ''}`}>
        {heroBackgroundImage && (
            <>
                <div className="absolute inset-0 z-0">
                    <img src={heroBackgroundImage} alt={page?.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"></div>
                </div>
            </>
        )}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">{page?.title}</h1>
            <div className="flex items-center justify-center gap-4 text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">
                <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Verified Info</span>
                </div>
                <div className="w-1 h-1 bg-blue-300/30 rounded-full"></div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Updated: {page?.lastUpdated || 'Recently'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-card shadow-xl border border-slate-100 overflow-hidden mb-12">
             <div className="p-8 md:p-12 text-slate-700 leading-relaxed text-lg">
                 <div className="prose prose-slate prose-lg max-w-none">
                    <p>{processedContent}</p>
                 </div>
             </div>
             <div className="bg-slate-50 border-t border-slate-100 p-6 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Was this page helpful?</span>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors">Yes</button>
                    <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors">No</button>
                </div>
             </div>
        </div>
      </div>

      {/* Reusable Premium Sections */}
      {(seoConfig?.showSuppliers ?? true) && <TrustedSuppliers />}
      
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-blue-50 rounded-card border border-blue-100 flex flex-col items-center text-center">
                    <Shield className="w-10 h-10 text-[#007ac2] mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Secure Bookings</h4>
                    <p className="text-sm text-slate-600">Your data is always protected with industry-standard encryption.</p>
                </div>
                <div className="p-8 bg-emerald-50 rounded-card border border-emerald-100 flex flex-col items-center text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-600 mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Free Cancellation</h4>
                    <p className="text-sm text-slate-600">Flexible plans with free cancellation on most vehicles.</p>
                </div>
                <div className="p-8 bg-orange-50 rounded-card border border-orange-100 flex flex-col items-center text-center">
                    <Award className="w-10 h-10 text-orange-600 mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Best Price Guarantee</h4>
                    <p className="text-sm text-slate-600">Find a lower price? We'll match it, no questions asked.</p>
                </div>
            </div>
        </div>
      </section>

      {(seoConfig?.showReviews ?? true) && <Reviews />}

      {/* Popular Destinations Fallback for Standard Pages */}
      {(seoConfig?.showRelatedDestinations ?? true) && homepageContent?.popularDestinations?.destinations?.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Popular Destinations</h3>
                    <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {homepageContent.popularDestinations.destinations.slice(0, 4).map((dest: any) => (
                        <Link key={dest.id} to={`/car-rental-${dest.name.toLowerCase().replace(/\s+/g, '-')}`} className="group">
                            <div className="relative aspect-[4/3] rounded-card overflow-hidden mb-3">
                                <img src={dest.image || dest.imageUrl} alt={dest.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-3 left-3 text-white">
                                    <div className="text-sm font-bold">{dest.name}</div>
                                    <div className="text-[10px] uppercase tracking-wider opacity-80">{dest.country}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* FAQ Section Fallback for Standard Pages */}
      {(seoConfig?.showFaq ?? true) && homepageContent?.faqs?.items?.length > 0 && (
        <section className="py-16 bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h3>
                    <p className="text-slate-500">Everything you need to know about renting a car with Hogicar.</p>
                </div>
                <div className="space-y-4">
                    {homepageContent.faqs.items.slice(0, 5).map((faq: any, idx: number) => (
                        <div key={idx} className="bg-white p-6 rounded-card border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                                {faq.question}
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      <LatestTravelGuides 
        route={location.pathname} 
        destination={seoConfig?.destinationName}
        country={seoConfig?.countryTag || homepageContent?.countryTag} 
        airport={seoConfig?.airportTags}
      />

      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-extrabold mb-6">Ready to hit the road?</h3>
            <p className="text-slate-400 mb-8 text-lg">Compare over 900+ suppliers and find your perfect car today.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-[#007ac2] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/20">
                Start Searching Now <ChevronRight className="w-5 h-5" />
            </Link>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <SEOMetadata 
        title={seoConfig?.title || (page ? `${page.title} | Hogicar` : undefined)} 
        description={seoConfig?.description || (page ? page.content.substring(0, 160) : undefined)} 
      />
      {content}
    </>
  );
};

export default DynamicPage;