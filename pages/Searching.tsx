
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPublicSuppliers, fetchSearchingLogos, fetchSiteSettings } from '../api';
import { getMatchingPrefetchedResults, startCarSearchPrefetch, waitForMatchingSearchPrefetch, getPrefetchParamsFromUrl, getPrefetchStatus } from '../utils/searchPrefetch';
import SEOMetadata from '../components/SEOMetadata';
import { Logo } from '../components/Logo';
import Check from 'lucide-react/dist/esm/icons/check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import { motion } from 'framer-motion';

const Searching: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata || 'Your Destination';
  const searchPrefetchParams = React.useMemo(() => getPrefetchParamsFromUrl(searchParams), [searchParamsString]);
  const [duration, setDuration] = React.useState(5000); 
  const MIN_ANIMATION_TIME = 0; // Proceded immediately when data is ready per requirements
  const [progress, setProgress] = React.useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const [isChunkLoaded, setIsChunkLoaded] = React.useState(false);
  const [isDataFinished, setIsDataFinished] = React.useState(false);

  React.useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth < 640);

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

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

    console.log("Searching: MOUNTED. Ensuring car results are loading...", {
        pickupIata,
        params: searchPrefetchParams
    });
    startCarSearchPrefetch(searchPrefetchParams);
    
    // Pre-load the Search component chunk while we're on the buffer page
    // This reduces the flash caused by lazy loading in App.tsx
    console.log("Searching: Starting pre-load of Search component chunk...");
    import('./Search').then(() => {
        console.log("Searching: Search component chunk LOADED.");
        setIsChunkLoaded(true);
    }).catch(err => {
        console.warn("Searching: Search component pre-load failed", err);
        // We still allow navigation even if pre-load fails, but it might flash
        setIsChunkLoaded(true); 
    });
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
    'Free cancellation on most bookings.',
    'All mandatory taxes and fees are included in the price you see.',
    'Every supplier shows real customer ratings to help you choose.',
    'Our support team is available 24/7 before and during your rental.',
    'Booking early usually means better prices and more choice.',
  ];

  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);

  React.useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  const searchMessages = [
    'Checking availability with rental companies',
    'Comparing prices for your dates',
    'Adding taxes and mandatory fees',
    'Reviewing fuel, mileage and insurance policies',
    'Sorting the best deals for you',
  ];

  React.useEffect(() => {
    let start: number | null = null;
    const initialStatus = getPrefetchStatus(searchPrefetchParams);
    let isDataFinished = initialStatus === 'fulfilled' || initialStatus === 'failed';
    let isNavigated = false;
    let isDisposed = false;
    const MAX_WAIT_TIME = 15000; // 15 seconds max

    console.log("Searching: initial data status:", initialStatus);

    const tryNavigate = () => {
      // Ensure we only navigate once
      if (isNavigated || isDisposed) return;

      const elapsed = Date.now() - (start || Date.now());
      const isDataWaitFinished = isDataFinished || elapsed > MAX_WAIT_TIME;
      
      // If data is ready, we can proceed after MIN_ANIMATION_TIME instead of full duration
      // AND the component chunk must be loaded to avoid Suspense flash
      const currentMinTime = isDataFinished ? MIN_ANIMATION_TIME : duration;
      const isMinTimeFinished = elapsed >= currentMinTime;

      if (isDataWaitFinished && isMinTimeFinished && isChunkLoaded) {
        console.log("Searching: proceeding to results page.", { isDataFinished, isChunkLoaded, elapsed });
        // Force progress to 100% if we're navigating early
        setProgress(1);
        isNavigated = true;
        // Small delay to let the 100% state be visible if it was very fast
        setTimeout(() => {
          const forwardParams = new URLSearchParams(searchParamsString);
          navigate(`/search?${forwardParams.toString()}`);
        }, 100);
      }
    };

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      
      // Check if we should navigate early on every frame if data and chunk are ready
      if (isDataFinished && isChunkLoaded && elapsed >= MIN_ANIMATION_TIME) {
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
      const status = getPrefetchStatus(searchPrefetchParams);
      console.log("Searching: prefetch promise resolved with status:", status);
      if (status === 'fulfilled' || status === 'failed') {
        isDataFinished = true;
        tryNavigate();
      }
    }).catch(() => {
        if (isDisposed) return;
        isDataFinished = true;
        tryNavigate();
    });

    const checkDataInterval = setInterval(() => {
      const status = getPrefetchStatus(searchPrefetchParams);
      if (status === 'fulfilled' || status === 'failed') {
        if (!isDataFinished) {
            console.log("Searching: data status changed to finished via interval:", status);
        }
        isDataFinished = true;
        tryNavigate();
      }
    }, 100);

    return () => {
      isDisposed = true;
      clearInterval(messageInterval);
      clearInterval(checkDataInterval);
    };
  }, [navigate, searchParamsString, duration, searchPrefetchParams, isChunkLoaded]);

  const visibleSuppliers = React.useMemo(() => suppliers.slice(0, 24), [suppliers]);
  const totalSuppliers = visibleSuppliers.length;
  const suppliersScanned = totalSuppliers > 0
    ? Math.min(totalSuppliers, Math.floor(progress * totalSuppliers))
    : 0;
  const percent = Math.floor(progress * 100);
  const stepIndex = Math.min(searchMessages.length - 1, Math.floor(progress * searchMessages.length));

  const formatTripDate = (date?: string, time?: string) => {
    if (!date) return '';
    const [y, m, d] = date.split('-').map(Number);
    const label = new Date(y, (m || 1) - 1, d || 1, 12).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return time ? `${label}, ${time}` : label;
  };
  const tripDays = (() => {
    const { pickupDate, dropoffDate } = searchPrefetchParams;
    if (!pickupDate || !dropoffDate) return 0;
    const diff = new Date(dropoffDate).getTime() - new Date(pickupDate).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  })();

  return (
    <>
      <SEOMetadata
        title="Searching for your perfect car... | Hogicar"
        description="We're comparing hundreds of suppliers to find you the best car rental deal."
        noIndex={true}
      />
      <div className="min-h-[calc(100vh-72px)] bg-slate-50 font-sans text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" role="status" aria-live="polite">
            {/* Trip summary */}
            <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500">Finding cars in</p>
                <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {pickupName}
                  {pickupIata && pickupIata.toUpperCase() !== pickupName.toUpperCase() && (
                    <span className="ml-2 align-middle text-sm font-semibold text-slate-400">{pickupIata.toUpperCase()}</span>
                  )}
                </h1>
                {(searchPrefetchParams.pickupDate || searchPrefetchParams.dropoffDate) && (
                  <p className="mt-1 text-sm text-slate-600">
                    {formatTripDate(searchPrefetchParams.pickupDate, searchPrefetchParams.startTime)} – {formatTripDate(searchPrefetchParams.dropoffDate, searchPrefetchParams.endTime)}
                    {tripDays > 0 && <span className="text-slate-400"> · {tripDays} day{tripDays > 1 ? 's' : ''}</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
                  <span key={stepIndex} className="animate-in fade-in duration-500">{searchMessages[stepIndex]}…</span>
                </p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">{percent}%</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Search progress">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out" style={{ width: `${progress * 100}%` }} />
              </div>

              <ol className="mt-5 grid gap-2 sm:grid-cols-2">
                {searchMessages.map((message, i) => {
                  const done = i < stepIndex || progress >= 1;
                  const active = i === stepIndex && progress < 1;
                  return (
                    <li key={message} className={`flex items-center gap-2.5 text-sm ${done ? 'text-slate-700' : active ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-500 text-white' : active ? 'border-2 border-accent' : 'border-2 border-slate-200'}`}>
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      {message}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Rental companies being checked */}
            {totalSuppliers > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Rental companies</p>
                  <p className="text-sm text-slate-500"><span className="font-semibold text-slate-900 tabular-nums">{progress >= 1 ? totalSuppliers : suppliersScanned}</span> of {totalSuppliers} checked</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {visibleSuppliers.map((supplier, index) => {
                    const isComplete = progress >= 1 || index < suppliersScanned;
                    const isActive = !isComplete && index === Math.min(suppliersScanned, totalSuppliers - 1);
                    const logoScale = ((isMobileViewport ? supplier.mobileScale : supplier.scale) || 100) / 100;
                    const logoSrc = supplier.logoUrl || supplier.logo;
                    const initials = String(supplier.name || 'Supplier').split(/\s+/).slice(0, 2).map((part: string) => part.charAt(0)).join('').toUpperCase();
                    return (
                      <div
                        key={`supplier-scan-${supplier.id}-${supplier.name}`}
                        className={`relative flex h-14 min-w-0 items-center justify-center rounded-lg border bg-white p-2.5 transition-all duration-300 ${
                          isComplete ? 'border-slate-200' : isActive ? 'border-accent ring-2 ring-accent/20' : 'border-slate-200 opacity-40'
                        }`}
                        title={supplier.name}
                        aria-label={`${supplier.name || 'Supplier'} ${isComplete ? 'checked' : isActive ? 'checking' : 'waiting'}`}
                      >
                        {(supplier.logoUrl === 'HOGICAR_CHOICE_LOGO' || supplier.logo === 'HOGICAR_CHOICE_LOGO') ? (
                          <div className="flex h-full w-full items-center justify-center" style={{ transform: `scale(${logoScale})` }}>
                            <Logo className="h-full w-full object-contain" />
                          </div>
                        ) : logoSrc ? (
                          <img src={logoSrc} alt={supplier.name} className="h-full w-full object-contain" style={{ transform: `scale(${logoScale})` }} />
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">{initials}</span>
                        )}
                        {isComplete && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="flex items-start gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              <motion.p
                key={currentTipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-slate-600"
              >
                {tips[currentTipIndex]}
              </motion.p>
            </div>
          </div>

          {/* Results preview */}
          <div className="mt-6 space-y-3" aria-hidden="true">
            {[0, 1].map(i => (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="h-20 w-28 shrink-0 animate-pulse rounded-lg bg-slate-100 sm:w-36" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="hidden w-28 shrink-0 space-y-2.5 py-1 sm:block">
                  <div className="ml-auto h-5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="ml-auto h-9 w-full animate-pulse rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Searching;
