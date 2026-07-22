import * as React from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

interface Destination {
  name: string;
  image: string;
  country?: string;
}

interface PopularDestinationsProps {
  destinations: Destination[];
  title?: string;
  subtitle?: string;
}

const PopularDestinations: React.FC<PopularDestinationsProps> = ({ 
  destinations, 
  title = "Popular Destinations",
  subtitle = "Explore our most booked locations"
}) => {
  if (!destinations || destinations.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
             <div>
                 <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">{title}</h2>
                 <p className="text-slate-700 font-bold uppercase text-xs tracking-widest">{subtitle}</p>
             </div>
             <Link to="/search" className="text-accent font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                 View All <ArrowRight className="w-4 h-4" />
             </Link>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
             {destinations.slice(0, 5).map((dest, index) => (
                <Link to={`/search?location=${encodeURIComponent(dest.name)}`} key={index} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-900">
                    <img 
                      src={dest.image} 
                      alt={dest.name} 
                      className="h-full w-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{dest.name}</h3>
                        {dest.country && (
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">{dest.country}</p>
                        )}
                    </div>
                </Link>
             ))}
         </div>
      </div>
    </section>
  );
};

export default React.memo(PopularDestinations);
