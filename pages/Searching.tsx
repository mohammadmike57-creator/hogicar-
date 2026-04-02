
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPublicSuppliers, fetchSearchingLogos } from '../api';
import SEOMetadata from '../components/SEOMetadata';
import { Check, Gift, MapPin } from 'lucide-react';
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
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata || 'Your Destination';
  const duration = 6000; // ms
  const [progress, setProgress] = React.useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
            results = searchingLogos.map(l => ({
                id: l.id,
                name: l.name,
                logoUrl: l.logoUrl,
                scale: l.scale,
                mobileScale: l.mobileScale,
                spacing: l.spacing,
                isLocal: true
            }));
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
                isLocal: false
              });
            }
          });
        }
        
        console.log("Searching: Total logos to display:", results.length);
        // Finalize supplier list - show up to 30
        setSuppliers(results.slice(0, 30));
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
    "Instant confirmation for most car types.",
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
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % searchMessages.length);
    }, duration / searchMessages.length);

    const navigationTimeout = setTimeout(() => {
      // Create a new URLSearchParams object from the current page's search params.
      // This will correctly forward ALL parameters it received from the home page.
      const forwardParams = new URLSearchParams(searchParams);
      
      // Navigate to the search results page with the preserved parameters.
      navigate(`/search?${forwardParams.toString()}`);
    }, duration);

    return () => {
      clearTimeout(navigationTimeout);
      clearInterval(messageInterval);
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, [navigate, searchParams, duration]);

  const suppliersScanned = Math.floor(progress * totalSuppliers);

  return (
    <>
      <SEOMetadata
        title="Searching for your perfect car... | Hogicar"
        description="We're comparing hundreds of suppliers to find you the best car rental deal."
        noIndex={true}
      />
      <div 
        className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 font-sans text-white overflow-hidden"
        style={{
          backgroundSize: '200% 200%',
          backgroundImage: `linear-gradient(160deg, #0c152b 0%, #1e40af 100%)`,
          animation: 'background-pan 30s ease-in-out infinite',
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-20" />
        
        <div className="relative z-10 w-full max-w-4xl text-center">
          <div className="mb-6 animate-fade-in">
            <h1 className="text-sm sm:text-base font-bold tracking-[0.3em] text-blue-300 uppercase mb-3">
              Searching for the best deals in
            </h1>
            
            <div className="flex flex-col items-center justify-center gap-2 relative">
              <div className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent animate-pulse" />
                <MapPin className="w-6 h-6 text-amber-400 relative z-10" />
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase relative z-10 drop-shadow-md">
                  {pickupName}
                </span>
                {pickupIata && (
                  <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-lg text-xs font-black tracking-tighter relative z-10 shadow-lg">
                    {pickupIata.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -inset-1 bg-blue-400/20 blur-xl rounded-full animate-pulse -z-10" />
            </div>
          </div>

          <div className="h-10 mt-2">
             <p className="text-xl sm:text-2xl font-bold text-blue-100 transition-all duration-500 bg-white/5 inline-block px-6 py-2 rounded-2xl backdrop-blur-sm" style={{ animation: `fade-in-text 0.5s ease-out forwards` }} key={currentMessageIndex}>
                {searchMessages[currentMessageIndex]}
             </p>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-blue-200 font-medium bg-white/5 py-4 px-8 rounded-2xl max-w-lg mx-auto backdrop-blur-sm border border-white/10 shadow-lg min-h-[80px]">
            <Check className="w-6 h-6 flex-shrink-0 text-green-400" />
            <div className="text-left overflow-hidden">
                <p className="text-[10px] font-black text-blue-300/60 uppercase tracking-widest mb-1">Expert Tip</p>
                <motion.p 
                    key={currentTipIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="leading-tight text-white font-bold"
                >
                    {tips[currentTipIndex]}
                </motion.p>
            </div>
          </div>
          
          <div className="w-full max-w-md mx-auto mt-8">
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/20 shadow-inner">
              <div
                className="bg-green-400 h-full rounded-full relative"
                style={{ width: `${progress * 100}%` }}
              >
                <div 
                    className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    style={{ animation: 'loading-shimmer 2s infinite' }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 bg-white/5 py-4 px-10 rounded-3xl backdrop-blur-sm border border-white/5 shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.2em] mb-1">Security</span>
              <span className="text-xs font-black text-green-400 tracking-tighter uppercase">Verified</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.2em] mb-1">Scanning</span>
              <span className="text-xs font-black text-white tracking-tighter uppercase">{Math.floor(progress * 100)}%</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.2em] mb-1">Results</span>
              <span className="text-xs font-black text-amber-400 tracking-tighter uppercase">{suppliersScanned} Found</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 max-w-2xl mx-auto">
            {suppliers.map((supplier, index) => {
              const isChecked = progress * totalSuppliers > index + 0.5;
              const isChecking = progress * totalSuppliers > index && !isChecked;

              return (
                <div
                  key={supplier.isLocal ? `local-${supplier.id}` : `real-${supplier.id}`}
                  className="relative flex items-center justify-center aspect-[3/2] p-2 rounded-xl transition-all duration-500"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    filter: isChecked ? 'none' : 'grayscale(100%) brightness(0.7)',
                    opacity: 0,
                    transform: isChecked ? 'scale(1)' : 'scale(0.9)',
                    animation: `pop-in-box 0.5s ease-out forwards`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <img
                    src={supplier.logoUrl || supplier.logo}
                    alt={supplier.name}
                    className="w-full object-contain transition-all duration-700 logo-scaled-hover"
                    width={100}
                    height={48}
                    style={{ 
                        opacity: isChecked ? 1 : 0.4,
                        '--logo-scale': (supplier.scale || 100) / 100,
                        '--logo-scale-mobile': (supplier.mobileScale || 100) / 100
                    } as any}
                  />
                  {isChecking && (
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
                      style={{ animation: `shimmer 1s infinite` }}
                    />
                  )}
                  {isChecked && (
                    <div
                      className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0c152b]"
                      style={{ animation: 'pop-in-check 0.4s ease-out forwards' }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Searching;
