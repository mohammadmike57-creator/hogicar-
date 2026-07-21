import * as React from 'react';
import { Link } from 'react-router-dom';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Tag from 'lucide-react/dist/esm/icons/tag';

interface Destination {
  id: string | number;
  name: string;
  country: string;
  price: number;
  image: string;
}

interface PopularDestinationsProps {
  title: string;
  destinations: Destination[];
  convertPrice: (price: number) => number;
  getCurrencySymbol: () => string;
}

export const PopularDestinations: React.FC<PopularDestinationsProps> = ({ 
  title, 
  destinations, 
  convertPrice, 
  getCurrencySymbol 
}) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
          <Link to="/search" className="text-blue-600 font-bold uppercase text-xs tracking-widest hover:underline">View all destinations</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <Link 
              key={dest.id} 
              to={`/search?pickup=${encodeURIComponent(dest.name)}`}
              className="group relative h-[400px] rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <img 
                src={dest.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'} 
                alt={dest.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold uppercase text-[10px] tracking-widest">
                  <MapPin className="w-3 h-3" />
                  {dest.country}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight leading-none">{dest.name}</h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/20">
                  <Tag className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider">From {getCurrencySymbol()}{convertPrice(dest.price)}/day</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;
