import React, { useEffect, useState } from 'react';
import { fetchHomepageLogos } from '../api';

interface Supplier {
  id: number;
  name: string;
  logoUrl: string;
  logo?: string;
  spacing?: number;
  scale?: number;
  mobileScale?: number;
}

interface TrustedSuppliersProps {
  accentColor?: string;
  backgroundColor?: string;
}

export const TrustedSuppliers: React.FC<TrustedSuppliersProps> = ({ 
  accentColor = '#007ac2',
  backgroundColor = '#ffffff'
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await fetchHomepageLogos();
        setSuppliers(data);
      } catch (err) {
        console.error("Failed to load supplier logos:", err);
      }
    };
    loadSuppliers();
  }, []);

  if (suppliers.length === 0) return null;

  return (
    <section className="py-10 bg-white overflow-hidden border-b border-slate-100" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 text-center mb-8">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4" style={{ color: accentColor }}>Partnered with the World's Best</div>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto"></div>
      </div>
      
      <div className="relative flex items-center group">
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, ${backgroundColor}, transparent)` }}></div>
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(to left, ${backgroundColor}, transparent)` }}></div>

        <div className="animate-marquee flex items-center hover:[animation-play-state:paused]">
          {[...suppliers, ...suppliers, ...suppliers, ...suppliers].map((s, idx) => (
            <div 
              key={`${s.id || s.name}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center"
              style={{ marginRight: `${s.spacing || 40}px` }}
            >
              <img 
                src={s.logo || s.logoUrl} 
                alt={s.name} 
                className="h-8 md:h-12 w-auto max-w-[160px] object-contain transition-all duration-500 hover:scale-110" 
                width="160"
                height="48"
                loading="lazy"
                style={{ 
                    transform: `scale(${(s.scale || 100) / 100})`,
                } as any}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedSuppliers;
