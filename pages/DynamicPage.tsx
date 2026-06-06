
import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SEOMetadata from '../components/SEOMetadata';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';

const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(false);
      try {
        const baseUrl = 'https://hogicar-backend.onrender.com';
        const response = await fetch(`${baseUrl}/api/pages/${slug}`);
        if (!response.ok) throw new Error('Page not found');
        const data = await response.json();
        setPage(data);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50">
         <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
         <p className="mt-4 text-slate-500 font-medium">Loading page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 text-center px-4">
         <h1 className="text-2xl font-bold text-slate-800">Page Not Found</h1>
         <p className="text-slate-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
         <Link to="/" className="mt-6 bg-[#003580] text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2 mx-auto"><ArrowLeft className="w-4 h-4"/> Return Home</Link>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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