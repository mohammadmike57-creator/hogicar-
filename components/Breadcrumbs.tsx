import * as React from 'react';
import { Link } from 'react-router-dom';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Home from 'lucide-react/dist/esm/icons/home';

interface BreadcrumbItem {
  name: string;
  route: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark';
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, variant = 'dark' }) => {
  const isLight = variant === 'light';
  
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.hogicar.com/"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.name,
        "item": `https://www.hogicar.com${item.route}`
      }))
    ]
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbList)}
      </script>
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link 
          to="/" 
          className={`flex items-center gap-1.5 transition-colors ${isLight ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
        >
          <Home className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Home</span>
        </Link>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-white/30' : 'text-slate-300'}`} aria-hidden="true" />
            <Link 
              to={item.route} 
              aria-current={index === items.length - 1 ? "page" : undefined}
              className={`transition-colors ${
                index === items.length - 1 
                  ? (isLight ? 'text-white' : 'text-slate-900') 
                  : (isLight ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-900')
              }`}
            >
              {item.name}
            </Link>
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;
