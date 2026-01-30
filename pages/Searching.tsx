
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SUPPLIERS, MOCK_APP_CONFIG } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { Check, Gift } from 'lucide-react';

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
  const duration = MOCK_APP_CONFIG.searchingScreenDuration;
  const [progress, setProgress] = React.useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const displayedSuppliers = SUPPLIERS.slice(0, 18);
  const totalSuppliers = displayedSuppliers.length;

  const searchMessages = [
    "Comparing deals from major brands...",
    "Checking availability with local specialists...",
    "Searching for exclusive online discounts...",
    "Finalizing the best options for your trip...",
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg relative overflow-hidden">
            <span className="shimmer-text">Searching the globe for your perfect car</span>
          </h1>
          <div className="h-8 mt-4">
             <p className="text-lg text-blue-200 transition-all duration-500" style={{ animation: `fade-in-text 0.5s ease-out forwards` }} key={currentMessageIndex}>
                {searchMessages[currentMessageIndex]}
             </p>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-amber-300 font-medium bg-black/20 py-3 px-6 rounded-full max-w-lg mx-auto backdrop-blur-sm border border-white/10 shadow-lg">
            <Gift className="w-5 h-5 flex-shrink-0 animate-pulse-glow" />
            <span className="leading-tight">We offer <strong>free cancellation</strong> on most bookings & <strong>no hidden fees</strong>.</span>
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

          <p className="mt-4 text-sm font-bold text-blue-300">
            {suppliersScanned} / {totalSuppliers} Suppliers Checked
          </p>

          <div className="mt-8 grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-6">
            {displayedSuppliers.map((supplier, index) => {
              const isChecked = progress * totalSuppliers > index + 0.5;
              const isChecking = progress * totalSuppliers > index && !isChecked;

              return (
                <div
                  key={supplier.id}
                  className="relative flex items-center justify-center aspect-square p-3 rounded-2xl transition-all duration-500"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    filter: isChecked ? 'none' : 'grayscale(100%)',
                    opacity: 0, // Start hidden for animation
                    transform: isChecked ? 'scale(1)' : 'scale(0.95)',
                    animation: `pop-in-box 0.5s ease-out forwards`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <img
                    src={supplier.logo}
                    alt={supplier.name}
                    className="max-h-12 w-full object-contain transition-all duration-500"
                     style={{ opacity: isChecked ? 1 : 0.8 }}
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
