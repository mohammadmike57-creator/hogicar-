
import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPage } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { ArrowLeft, Clock } from 'lucide-react';

const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = getPage(slug || '');

  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50">
         <h1 className="text-2xl font-bold text-slate-800">Page Not Found</h1>
         <Link to="/" className="mt-4 text-blue-600 hover:underline flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> Return Home</Link>
      </div>
    );
  }

  // Helper to process line breaks for simple text content
  const processedContent = page.content.split('\n').map((line, i) => (
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-[#003580] text-white p-8">
                 <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
                 <div className="flex items-center gap-2 text-blue-200 text-xs">
                     <Clock className="w-3.5 h-3.5"/>
                     <span>Last Updated: {page.lastUpdated}</span>
                 </div>
             </div>
             <div className="p-8 text-slate-700 leading-relaxed text-sm space-y-4">
                 <p>{processedContent}</p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;