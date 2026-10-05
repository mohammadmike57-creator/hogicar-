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
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-2">{title}</h2>
                 <p className="text-base text-slate-600">{subtitle}</p>
             </div>
             <Link to="/search" className="text-accent font-semibold text-sm flex items-center gap-1.5 hover:underline">
                 View All <ArrowRight className="w-4 h-4" />
             </Link>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
             {destinations.slice(0, 5).map((dest, index) => {
                const imageUrl = dest.image;
                const isLocalImage = imageUrl.includes('/uploads/hero/');
                const isWebp = imageUrl.toLowerCase().endsWith('.webp');
                
                const srcSet = (isLocalImage && isWebp) ? 
                  `${imageUrl.replace('.webp', '_thumb.webp')} 400w, ${imageUrl.replace('.webp', '_medium.webp')} 800w` 
                  : isLocalImage ? 
                    `${imageUrl.replace(/\.(png|jpg|jpeg)/i, '_thumb.png')} 400w, ${imageUrl.replace(/\.(png|jpg|jpeg)/i, '_medium.png')} 800w`
                    : undefined;

                return (
                  <Link to={`/search?location=${encodeURIComponent(dest.name)}`} key={index} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-900">
                    <img 
                      src={imageUrl} 
                      srcSet={srcSet}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      alt={dest.name} 
                      className="h-full w-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <div className="absolute bottom-6 start-6 end-6">
                        <h3 className="text-lg font-bold text-white">{dest.name}</h3>
                        {dest.country && (
                          <p className="text-white/80 text-sm mt-0.5">{dest.country}</p>
                        )}
                    </div>
                  </Link>
                );
             })}
         </div>
      </div>
    </section>
  );
};

export default React.memo(PopularDestinations);
