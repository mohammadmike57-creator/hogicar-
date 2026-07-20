import * as React from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../lib/config';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Plane from 'lucide-react/dist/esm/icons/plane';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import SEOMetadata from '../components/SEOMetadata';

interface SitemapRoute {
  name: string;
  route: string;
  type: string;
  country?: string;
}

const Sitemap: React.FC = () => {
  const [routes, setRoutes] = React.useState<SitemapRoute[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/sitemap/all`)
      .then(res => res.json())
      .then(data => {
        setRoutes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch sitemap routes:', err);
        setLoading(false);
      });
  }, []);

  const categorized = React.useMemo(() => {
    return {
      countries: routes.filter(r => r.type === 'ROUTE' && !r.route.includes('airport') && !r.route.includes('city')),
      cities: routes.filter(r => r.type === 'ROUTE' && r.route.includes('city') || (r.type === 'ROUTE' && !r.route.includes('airport') && r.name.toLowerCase().includes('rental'))),
      airports: routes.filter(r => r.type === 'ROUTE' && r.route.includes('airport')),
      blog: routes.filter(r => r.type === 'BLOG'),
      pages: routes.filter(r => r.type === 'STATIC' || r.type === 'PAGE')
    };
  }, [routes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007ac2]"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <SEOMetadata 
        title="Sitemap | Hogicar" 
        description="Browse all car rental locations, airport guides, and travel articles on Hogicar." 
      />
      
      <div className="bg-[#003580] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4 uppercase tracking-tight">Website Sitemap</h1>
          <p className="text-blue-100 text-lg opacity-80">Easily find any destination or guide on our platform.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-card shadow-xl border border-slate-100 p-8 md:p-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            
            {/* Countries */}
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-blue-500 pb-2">
                <Globe className="text-blue-500" /> Countries
              </h2>
              <ul className="space-y-3">
                {categorized.countries.map((r, i) => (
                  <li key={i}>
                    <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-300" /> {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Cities */}
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-emerald-500 pb-2">
                <MapPin className="text-emerald-500" /> Popular Cities
              </h2>
              <ul className="space-y-3">
                {categorized.cities.map((r, i) => (
                  <li key={i}>
                    <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-300" /> {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Airports */}
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-orange-500 pb-2">
                <Plane className="text-orange-500" /> Airport Guides
              </h2>
              <ul className="space-y-3">
                {categorized.airports.map((r, i) => (
                  <li key={i}>
                    <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-orange-600 font-bold transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-300" /> {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Blog */}
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-purple-500 pb-2">
                <FileText className="text-purple-500" /> Travel Blog
              </h2>
              <ul className="space-y-3">
                {categorized.blog.map((r, i) => (
                  <li key={i}>
                    <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 font-bold transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-300" /> {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Pages */}
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-slate-300 pb-2">
                Company
              </h2>
              <ul className="space-y-3">
                {categorized.pages.map((r, i) => (
                  <li key={i}>
                    <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-200" /> {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
