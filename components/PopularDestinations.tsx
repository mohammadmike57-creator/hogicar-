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
    <section className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
             <div>
                 <p className="text-sm font-semibold text-accent mb-2">Top picks</p>
                 <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-2">{title}</h2>
                 <p className="text-base text-slate-600 sm:text-lg">{subtitle}</p>
             </div>
             <a href="#search" className="text-accent font-semibold text-sm flex items-center gap-1.5 hover:underline">
                 Search all locations <ArrowRight className="w-4 h-4" />
             </a>
         </div>
         <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
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
                  <Link to={`/car-rental-${dest.name.toLowerCase().trim().replace(/\s+/g, '-')}`} key={index} className="group relative aspect-[4/5] w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-900 shadow-sm sm:w-auto">
                    <img 
                      src={imageUrl} 
                      srcSet={srcSet}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      alt={dest.name} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                    <div className="absolute bottom-5 start-5 end-5">
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
