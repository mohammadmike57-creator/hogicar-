import * as React from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../lib/config';
import Globe from 'lucide-react/dist/esm/icons/globe';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import SEOMetadata from '../components/SEOMetadata';

interface SitemapRoute {
  name: string;
  route: string;
  type: string;
  country?: string;
  city?: string;
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

  const formatName = (name: string) => {
    if (!name) return '';
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const groupedData = React.useMemo(() => {
    const geoData: Record<string, Record<string, SitemapRoute[]>> = {};
    const otherData: { blog: SitemapRoute[], pages: SitemapRoute[] } = { blog: [], pages: [] };

    routes.forEach(route => {
      if (route.type === 'ROUTE' || route.type === 'COUNTRY' || route.type === 'CITY' || route.type === 'AIRPORT' || route.type === 'SYNONYM' || route.type === 'KEYWORD') {
        const country = route.country ? formatName(route.country) : 'International';
        const city = route.city ? formatName(route.city) : 'General';

        if (!geoData[country]) geoData[country] = {};
        if (!geoData[country][city]) geoData[country][city] = [];
        
        geoData[country][city].push(route);
      } else if (route.type === 'BLOG') {
        otherData.blog.push(route);
      } else {
        otherData.pages.push(route);
      }
    });

    // Sort countries alphabetically
    const sortedGeo: Record<string, Record<string, SitemapRoute[]>> = {};
    Object.keys(geoData).sort().forEach(country => {
      sortedGeo[country] = {};
      // Sort cities alphabetically, but put 'General' first for the country
      Object.keys(geoData[country]).sort((a, b) => {
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        return a.localeCompare(b);
      }).forEach(city => {
        sortedGeo[country][city] = geoData[country][city].sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    return { geo: sortedGeo, blog: otherData.blog, pages: otherData.pages };
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
          
          <div className="space-y-16">
            
            {/* Geo Grouped Routes */}
            {Object.entries(groupedData.geo).map(([country, cities]) => (
              <section key={country} className="border-b border-slate-100 pb-12 last:border-0">
                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight border-b-4 border-blue-500 pb-2 w-fit">
                  <Globe className="text-blue-500" /> {country}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {Object.entries(cities).map(([city, cityRoutes]) => (
                    <div key={city} className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-l-4 border-emerald-500 pl-3">
                        {city === 'General' ? country : city}
                      </h3>
                      <ul className="space-y-2.5 ml-4">
                        {cityRoutes.map((r, i) => (
                          <li key={i}>
                            <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors">
                              <ChevronRight className="w-3 h-3 text-slate-300" /> {r.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
              {/* Blog */}
              {groupedData.blog.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-purple-500 pb-2">
                    <FileText className="text-purple-500" /> Travel Blog
                  </h2>
                  <ul className="space-y-3">
                    {groupedData.blog.map((r, i) => (
                      <li key={i}>
                        <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 font-bold transition-colors">
                          <ChevronRight className="w-4 h-4 text-slate-300" /> {r.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pages */}
              {groupedData.pages.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-4 border-slate-300 pb-2">
                    Company Info
                  </h2>
                  <ul className="space-y-3">
                    {groupedData.pages.map((r, i) => (
                      <li key={i}>
                        <Link to={r.route} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
                          <ChevronRight className="w-4 h-4 text-slate-200" /> {r.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
