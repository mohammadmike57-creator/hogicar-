
import * as React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SEOMetadata from '../components/SEOMetadata';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import Home from './Home';
import { API_BASE_URL } from '../lib/config';

const DynamicPage: React.FC = () => {
  const location = useLocation();
  const [page, setPage] = useState<any>(null);
  const [seoConfig, setSeoConfig] = useState<any>(null);
  const [isLandingPage, setIsLandingPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      setError(false);
      setIsLandingPage(false);
      setPage(null);
      setSeoConfig(null);

      // Normalize route
      const route = location.pathname.replace(/\/$/, '') || '/';
      const slug = route.startsWith('/') ? route.substring(1) : route;

      try {
        // 1. Try fetching static page content first (if there's a slug)
        if (slug) {
          const pageResponse = await fetch(`${API_BASE_URL}/api/pages/${slug}`);
          if (pageResponse.ok) {
            const data = await pageResponse.json();
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
         <Loader2 className="w-8 h-8 text-[#007ac2] animate-spin" />
         <p className="mt-4 text-slate-500 font-medium text-sm">Loading page...</p>
      </div>
    );
  }

  // If it's a landing page, render the Home component with SEO config
  if (isLandingPage && seoConfig) {
    return <Home seoConfig={seoConfig} />;
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

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <SEOMetadata 
        title={`${page.title} | Hogicar`} 
        description={page.content.substring(0, 160)} 
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-card shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-[#003580] text-white p-8 md:p-12">
                 <h1 className="text-3xl md:text-4xl font-bold mb-4">{page.title}</h1>
                 <div className="flex items-center gap-2 text-blue-200 text-xs font-medium uppercase tracking-wider">
                     <Clock className="w-4 h-4"/>
                     <span>Last Updated: {page.lastUpdated}</span>
                 </div>
             </div>
             <div className="p-8 md:p-12 text-slate-700 leading-relaxed text-base">
                 <div className="prose prose-slate max-w-none">
                    <p>{processedContent}</p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;