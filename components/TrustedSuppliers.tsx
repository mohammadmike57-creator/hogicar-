import React, { useEffect, useState } from 'react';
import { fetchHomepageLogos } from '../api';

interface Supplier {
  id?: number;
  name: string;
  logoUrl?: string;
  logo?: string;
  spacing?: number;
  scale?: number;
  mobileScale?: number;
}

interface TrustedSuppliersProps {
  accentColor?: string;
  backgroundColor?: string;
}

export const TrustedSuppliers: React.FC<TrustedSuppliersProps> = React.memo(({
  backgroundColor = '#ffffff'
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await fetchHomepageLogos();
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load supplier logos:", err);
      }
    };
    loadSuppliers();
  }, []);

  if (suppliers.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white py-8 sm:py-10" style={{ backgroundColor }}>
      <div className="mx-auto mb-6 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-slate-900 sm:text-base">Compare the world's leading car rental brands</p>
      </div>

      <div className="relative flex items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 md:w-32" style={{ backgroundImage: `linear-gradient(to right, ${backgroundColor}, transparent)` }} />
        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 md:w-32" style={{ backgroundImage: `linear-gradient(to left, ${backgroundColor}, transparent)` }} />

        <div className="animate-marquee flex items-center hover:[animation-play-state:paused]">
          {[...suppliers, ...suppliers].map((s, idx) => {
            const logoUrl = s.logo || s.logoUrl || '';
            const isLocalImage = logoUrl.includes('/uploads/hero/');
            const isWebp = logoUrl.toLowerCase().endsWith('.webp');

            // If it's the _logo variant, thumb is _mini (100px)
            const srcSet = (isLocalImage && isWebp && logoUrl.includes('_logo')) ?
              `${logoUrl.replace('_logo.webp', '_mini.webp')} 100w, ${logoUrl} 200w`
              : (isLocalImage && isWebp) ?
                `${logoUrl.replace('.webp', '_mini.webp')} 100w, ${logoUrl.replace('.webp', '_logo.webp')} 200w`
                : undefined;

            return (
              <div
                key={`${s.id || s.name}-${idx}`}
                className="mx-2 flex h-16 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm md:mx-3 md:h-20 md:w-44 md:p-2"
              >
                <img
                  src={logoUrl}
                  srcSet={srcSet}
                  sizes="160px"
                  alt={s.name}
                  className="h-full w-full object-contain"
                  width="160"
                  height="48"
                  loading="lazy"
                  decoding="async"
                  style={{ transform: `scale(${(s.scale || 100) / 100})` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default TrustedSuppliers;
