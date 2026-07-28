
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPublicSuppliers, fetchSearchingLogos, fetchSiteSettings } from '../api';
import { getMatchingPrefetchedResults, startCarSearchPrefetch, waitForMatchingSearchPrefetch } from '../utils/searchPrefetch';
import SEOMetadata from '../components/SEOMetadata';
import { Logo } from '../components/Logo';
import Check from 'lucide-react/dist/esm/icons/check';
import Gift from 'lucide-react/dist/esm/icons/gift';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import { motion, AnimatePresence } from 'framer-motion';

const animationStyles = `
@keyframes background-pan {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes loading-shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(300%) skewX(-15deg); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

@keyframes pop-in-check {
  0% { transform: scale(0.5) rotate(-15deg); opacity: 0; }
  80% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes fade-in-text {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pop-in-box {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes marquee-reverse {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}

.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 40s linear infinite;
}

.animate-marquee-reverse {
  display: flex;
  width: max-content;
  animation: marquee-reverse 40s linear infinite;
}

.shimmer-text::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(100deg, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 80%);
  transform: translateX(-200%);
  animation: shimmer 3s infinite 1s;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 2px #fde047);
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 6px #fde047);
    transform: scale(1.1);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2.5s ease-in-out infinite;
}

`;

const Searching: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata || 'Your Destination';
  const searchPrefetchParams = React.useMemo(() => ({
    pickupCode: pickupIata,
    dropoffCode: searchParams.get('dropoff') || pickupIata,
    pickupDate: searchParams.get('pickupDate') || '',
    dropoffDate: searchParams.get('dropoffDate') || '',
  }), [pickupIata, searchParamsString]);
  const [duration, setDuration] = React.useState(5000); 
  const MIN_ANIMATION_TIME = 2500; // Allow proceeding after 2.5s if data is ready
  const [progress, setProgress] = React.useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSiteSettings();
        if (settings && settings.searchingScreenDuration) {
          setDuration(settings.searchingScreenDuration);
        }
      } catch (err) {
        console.error("Failed to load settings in Searching page:", err);
      }
    };
    loadSettings();
  }, []);

  React.useEffect(() => {
    if (!pickupIata) return;

    console.log("Searching: ensuring car results are loading while animation runs...");
    startCarSearchPrefetch(searchPrefetchParams);
  }, [pickupIata, searchPrefetchParams]);

  React.useEffect(() => {
    const loadSuppliers = async () => {
      try {
        console.log("Searching: Loading suppliers and logos for location:", pickupIata);
        const [realData, searchingLogos] = await Promise.all([
            fetchPublicSuppliers(pickupIata),
            fetchSearchingLogos(pickupIata)
        ]);
        
        console.log("Searching: Real suppliers found:", realData?.length);
        console.log("Searching: Searching logos found:", searchingLogos?.length);
        
        let results: any[] = [];
        
        // 1. Add admin-managed searching logos for this location (or global ones)
        if (searchingLogos && searchingLogos.length > 0) {
            searchingLogos.forEach(l => {
                results.push({
                    id: l.id,
                    name: l.name,
                    logoUrl: l.logoUrl,
                    scale: l.scale || 100,
                    mobileScale: l.mobileScale || 100,
                    spacing: l.spacing || 24,
                    isLocal: true
                });
            });
        }
        
        // 2. Add real suppliers for this location
        if (realData && realData.length > 0) {
          realData.forEach((s: any) => {
            if (!results.some(r => r.name.toLowerCase() === s.name.toLowerCase())) {
              results.push({
                id: s.id,
                name: s.name,
                logoUrl: s.logoUrl || s.logo,
                scale: s.logoScale || 100,
                mobileScale: s.logoScaleMobile || 100,
                spacing: 24,
                isLocal: false
              });
            }
          });
        }
        
        console.log("Searching: Total logos to display:", results.length);
        // Finalize supplier list - show up to 100
        setSuppliers(results.slice(0, 100));
      } catch (error) {
        console.error("Searching: Failed to load search branding", error);
        setSuppliers([]);
      }
    };
    
    loadSuppliers();
  }, [pickupIata]);

  const tips = [
    "Book now to lock in the lowest price!",
    "No credit card fees with Hogicar.",
    "Free cancellation up to 48 hours before pickup.",
    "All our suppliers are strictly vetted for quality.",
    "Prices are guaranteed once you book.",
    "Save up to 40% with local suppliers!",
    "Guaranteed instant confirmation on all cars.",
    "24/7 Premium support for all bookings.",
    "Transparent pricing - no hidden surprises.",
  ];

  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);

  React.useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  const totalSuppliers = suppliers.length; // Target scan count

  const searchMessages = [
    "Initializing secure connection to Global Distribution Systems...",
    "Scanning 450+ data points in your area...",
    "Verifying Economy and Compact car availability...",
    "Analyzing local fuel, insurance, and mileage policies...",
    "Checking SUV, Luxury and Premium deals...",
    "Verifying Meet & Greet and Terminal services...",
    "Retrieving exclusive Hogicar member discounts...",
    "Calculating regional taxes and mandatory fees...",
    "Optimizing results for the best price-to-quality ratio...",
    "Finalizing live rates for your specific dates...",
  ];
  
  // Effect for canvas animation
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, vx: number, vy: number, radius: number }[] = [];

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;

        particles = [];
        const numParticles = Math.floor((canvas.width * canvas.height) / 20000);

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 1.5 + 0.5
            });
        }
    };

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        });

        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
            for (let j = i; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 100) {
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                }
            }
        }
        ctx.lineWidth = 0.05;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw();
    window.addEventListener('resize', resizeCanvas);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = animationStyles;
    document.head.appendChild(styleSheet);

    let start: number | null = null;
    let isDataReady = !!getMatchingPrefetchedResults(searchPrefetchParams);
    let isNavigated = false;
    let isDisposed = false;
    const MAX_WAIT_TIME = 10000; // 10 seconds max

    const tryNavigate = () => {
      // Ensure we only navigate once
      if (isNavigated || isDisposed) return;

      const elapsed = Date.now() - (start || Date.now());
      const isDataWaitFinished = isDataReady || elapsed > MAX_WAIT_TIME;
      
      // If data is ready, we can proceed after MIN_ANIMATION_TIME instead of full duration
      const currentMinTime = isDataReady ? MIN_ANIMATION_TIME : duration;
      const isMinTimeFinished = elapsed >= currentMinTime;

      if (isDataWaitFinished && isMinTimeFinished) {
        // Force progress to 100% if we're navigating early
        setProgress(1);
        isNavigated = true;
        // Small delay to let the 100% state be visible
        setTimeout(() => {
          const forwardParams = new URLSearchParams(searchParamsString);
          navigate(`/search?${forwardParams.toString()}`);
        }, 300);
      }
    };

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      
      // Check if we should navigate early on every frame if data is ready
      if (isDataReady && elapsed >= MIN_ANIMATION_TIME) {
        tryNavigate();
      }

      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
      
      if (elapsed < duration && !isNavigated) {
        requestAnimationFrame(animate);
      } else if (!isNavigated) {
        tryNavigate();
      }
    };
    requestAnimationFrame(animate);

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % searchMessages.length);
    }, duration / searchMessages.length);

    // Monitoring for data readiness
    const pendingPrefetch = waitForMatchingSearchPrefetch(searchPrefetchParams);
    pendingPrefetch?.then(() => {
      if (isDisposed) return;
      if (getMatchingPrefetchedResults(searchPrefetchParams)) {
        isDataReady = true;
        tryNavigate();
      }
    }).catch(() => undefined);

    const checkDataInterval = setInterval(() => {
      if (getMatchingPrefetchedResults(searchPrefetchParams)) {
        isDataReady = true;
        tryNavigate();
      }
    }, 100);

    return () => {
      isDisposed = true;
      clearInterval(messageInterval);
      clearInterval(checkDataInterval);
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, [navigate, searchParamsString, duration, searchPrefetchParams]);

  const suppliersScanned = Math.floor(progress * totalSuppliers);

  return (
    <>
      <SEOMetadata
        title="Searching for your perfect car... | Hogicar"
        description="We're comparing hundreds of suppliers to find you the best car rental deal."
        noIndex={true}
      />
      <div 
        className="relative flex flex-col items-center justify-center min-h-[calc(100vh-48px)] p-2 font-sans text-white overflow-hidden"
        style={{
          backgroundSize: '200% 200%',
          backgroundImage: `linear-gradient(160deg, #0c152b 0%, #1e40af 100%)`,
          animation: 'background-pan 30s ease-in-out infinite',
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-20" />
        
        <div className="relative z-10 w-full max-w-7xl text-center">
          <div className="mb-3 animate-fade-in">
            <h1 className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-accent-300/60 uppercase mb-1.5">
              Searching for the best deals in
            </h1>
            
            <div className="flex flex-col items-center justify-center gap-1 relative">
              <div className="flex items-center gap-2 bg-white/5 px-5 py-1.5 rounded-xl backdrop-blur-md border border-white/10 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500/5 to-transparent animate-pulse" />
                <MapPin className="w-3.5 h-3.5 text-amber-400 relative z-10" />
                <span className="text-lg sm:text-xl font-black text-white tracking-tight uppercase relative z-10 drop-shadow-sm">
                  {pickupName}
                </span>
                {pickupIata && (
                  <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tighter relative z-10 shadow-md">
                    {pickupIata.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -inset-1 bg-accent-400/5 blur-xl rounded-full animate-pulse -z-10" />
            </div>
          </div>

          <div className="h-8 mt-1">
             <p className="text-base sm:text-lg font-bold text-accent-100/80 transition-all duration-500 bg-white/5 inline-block px-4 py-1 rounded-xl backdrop-blur-sm" style={{ animation: `fade-in-text 0.5s ease-out forwards` }} key={currentMessageIndex}>
                {searchMessages[currentMessageIndex]}
             </p>
          </div>

          {/* Professional Two-Line Logo Buffer */}
          <div className="mt-8 mb-8 relative w-full overflow-hidden py-4 pointer-events-none">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0c152b] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#1e40af] to-transparent z-10" />
            
            <div className="flex flex-col gap-6">
              {/* Row 1: Moving Right to Left */}
              <div className="flex whitespace-nowrap overflow-hidden">
                <div className="animate-marquee flex gap-4 px-2">
                  {[...suppliers, ...suppliers].map((supplier, idx) => (
                    <div
                      key={`r1-${supplier.id}-${idx}`}
                      className="flex-shrink-0 w-24 h-24 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 p-4 flex items-center justify-center shadow-xl relative group overflow-hidden"
                    >
                      {(supplier.logoUrl === 'HOGICAR_CHOICE_LOGO' || supplier.logo === 'HOGICAR_CHOICE_LOGO') ? (
                        <Logo className="w-full h-full object-contain" />
                      ) : (
                        <img
                          src={supplier.logoUrl || supplier.logo}
                          alt={supplier.name}
                          className="w-full h-full object-contain"
                          style={{ 
                              transform: `scale(${(window.innerWidth < 640 ? (supplier.mobileScale || 100) : (supplier.scale || 100)) / 100})`,
                          } as any}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animation: 'shimmer 2s infinite' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Moving Left to Right */}
              <div className="flex whitespace-nowrap overflow-hidden">
                <div className="animate-marquee-reverse flex gap-4 px-2">
                  {[...suppliers, ...suppliers].reverse().map((supplier, idx) => (
                    <div
                      key={`r2-${supplier.id}-${idx}`}
                      className="flex-shrink-0 w-24 h-24 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 p-4 flex items-center justify-center shadow-xl relative group overflow-hidden"
                    >
                      {(supplier.logoUrl === 'HOGICAR_CHOICE_LOGO' || supplier.logo === 'HOGICAR_CHOICE_LOGO') ? (
                        <Logo className="w-full h-full object-contain" />
                      ) : (
                        <img
                          src={supplier.logoUrl || supplier.logo}
                          alt={supplier.name}
                          className="w-full h-full object-contain"
                          style={{ 
                              transform: `scale(${(window.innerWidth < 640 ? (supplier.mobileScale || 100) : (supplier.scale || 100)) / 100})`,
                          } as any}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animation: 'shimmer 2s infinite' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-accent-200 font-medium bg-white/5 py-2.5 px-5 rounded-xl max-w-md mx-auto backdrop-blur-sm border border-white/10 shadow-lg min-h-[60px]">
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div className="text-left overflow-hidden">
                <p className="text-[9px] font-black text-accent-300/50 uppercase tracking-widest mb-0.5">Expert Tip</p>
                <motion.p 
                    key={currentTipIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="leading-tight text-white font-bold text-xs"
                >
                    {tips[currentTipIndex]}
                </motion.p>
            </div>
          </div>
          
          <div className="w-full max-w-sm mx-auto mt-5">
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/20 shadow-inner">
              <div
                className="bg-accent h-full rounded-full relative"
                style={{ width: `${progress * 100}%` }}
              >
                <div 
                    className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    style={{ animation: 'loading-shimmer 2s infinite' }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-5 bg-white/5 py-2.5 px-6 rounded-2xl backdrop-blur-sm border border-white/5 shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-accent-300/30 uppercase tracking-[0.2em] mb-0.5">Security</span>
              <span className="text-[10px] font-black text-emerald-400 tracking-tighter uppercase">Verified</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-accent-300/30 uppercase tracking-[0.2em] mb-0.5">Scanning</span>
              <span className="text-[10px] font-black text-white tracking-tighter uppercase">{Math.floor(progress * 100)}%</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-accent-300/30 uppercase tracking-[0.2em] mb-0.5">Results</span>
              <span className="text-[10px] font-black text-amber-400 tracking-tighter uppercase">{suppliersScanned} Found</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Searching;
