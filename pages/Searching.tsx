
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPublicSuppliers, fetchSearchingLogos, fetchSiteSettings } from '../api';
import { getMatchingPrefetchedResults, startCarSearchPrefetch, waitForMatchingSearchPrefetch, getPrefetchParamsFromUrl, getPrefetchStatus } from '../utils/searchPrefetch';
import SEOMetadata from '../components/SEOMetadata';
import { Logo } from '../components/Logo';
import Check from 'lucide-react/dist/esm/icons/check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
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

  const dropoffLabel = searchParams.get('dropoffName') || pickupName;
  const dropoffCode = (searchPrefetchParams.dropoffCode || pickupIata || '').toUpperCase();
  const checkedCount = progress >= 1 ? totalSuppliers : suppliersScanned;

  const included = [
    { icon: ShieldCheck, title: 'Free cancellation', text: 'On most bookings' },
    { icon: Receipt, title: 'No hidden fees', text: 'Taxes and fees shown up front' },
    { icon: Headphones, title: '24/7 support', text: 'Before and during your rental' },
  ];

  return (
    <>
      <SEOMetadata
        title="Searching for your perfect car... | Hogicar"
        description="We're comparing hundreds of suppliers to find you the best car rental deal."
        noIndex={true}
      />
      <div className="min-h-[calc(100vh-72px)] bg-slate-50 font-sans text-slate-900">
        {/* Trip band */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#003580] via-[#0047a6] to-[#0b5cc4] pb-24 pt-8 text-white sm:pb-28 sm:pt-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <p className="text-center text-sm font-medium text-white/75">Finding the best car rental deals for your trip</p>

            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-white/60">Pick-up</p>
                <p className="mt-1 truncate text-lg font-bold sm:text-2xl">{pickupIata ? pickupIata.toUpperCase() : pickupName}</p>
                <p className="truncate text-sm text-white/80">{pickupName}</p>
                <p className="mt-1 text-sm text-white/70">{formatTripDate(searchPrefetchParams.pickupDate, searchPrefetchParams.startTime)}</p>
              </div>

              <div className="w-24 sm:w-64" aria-hidden="true">
                <div className="relative h-8">
                  <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/35" />
                  <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white" />
                  <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white" />
                  <div
                    className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-accent shadow-lg transition-[left] duration-200 ease-out"
                    style={{ left: `${Math.min(92, Math.max(8, progress * 100))}%` }}
                  >
                    <CarIcon className="h-4 w-4" />
                  </div>
                </div>
                {tripDays > 0 && <p className="mt-1 text-center text-xs font-medium text-white/75">{tripDays} day{tripDays > 1 ? 's' : ''}</p>}
              </div>

              <div className="min-w-0 text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-white/60">Drop-off</p>
                <p className="mt-1 truncate text-lg font-bold sm:text-2xl">{dropoffCode || dropoffLabel}</p>
                <p className="truncate text-sm text-white/80">{dropoffLabel}</p>
                <p className="mt-1 text-sm text-white/70">{formatTripDate(searchPrefetchParams.dropoffDate, searchPrefetchParams.endTime)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto -mt-16 max-w-5xl px-4 pb-12 sm:-mt-20 sm:px-6">
          {/* Progress card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 sm:text-base">
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
                <span key={stepIndex} className="animate-in fade-in duration-500">{searchMessages[stepIndex]}…</span>
              </p>
              <span className="shrink-0 text-2xl font-bold tabular-nums text-accent">{percent}%</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Search progress">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-sky-400 transition-[width] duration-200 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-8">
              <ol className="space-y-3">
                {searchMessages.map((message, i) => {
                  const done = i < stepIndex || progress >= 1;
                  const active = i === stepIndex && progress < 1;
                  return (
                    <li key={message} className={`flex items-center gap-3 text-sm ${done ? 'text-slate-700' : active ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${done ? 'bg-emerald-500 text-white' : active ? 'bg-accent-50 ring-2 ring-accent' : 'bg-slate-100'}`}>
                        {done ? <Check className="h-3.5 w-3.5" /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> : <span className="text-[11px] font-semibold text-slate-400">{i + 1}</span>}
                      </span>
                      {message}
                    </li>
                  );
                })}
              </ol>

              {totalSuppliers > 0 ? (
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Rental companies</p>
                    <p className="text-sm text-slate-500"><span className="font-semibold tabular-nums text-slate-900">{checkedCount}</span> of {totalSuppliers} checked</p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
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
              ) : (
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-accent shadow-sm">
                    <CarIcon className="h-6 w-6" />
                  </span>
                  <p className="text-sm text-slate-600">We're checking global brands and trusted local suppliers at <span className="font-semibold text-slate-900">{pickupName}</span>.</p>
                </div>
              )}
            </div>
          </div>

          {/* What's included + tip */}
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Every Hogicar booking</p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {included.map(item => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="block text-xs text-slate-500">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm">
                <Lightbulb className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">Good to know</p>
                <motion.p
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-0.5 text-sm text-amber-900/80"
                >
                  {tips[currentTipIndex]}
                </motion.p>
              </div>
            </div>
          </div>

          {/* Results preview */}
          <p className="mb-3 mt-8 text-sm font-medium text-slate-500">Your results will appear here</p>
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4" style={{ opacity: 1 - i * 0.25 }}>
                <div className="h-20 w-28 shrink-0 animate-pulse rounded-lg bg-slate-100 sm:w-40" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="hidden w-32 shrink-0 space-y-2.5 py-1 sm:block">
                  <div className="ml-auto h-5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="ml-auto h-10 w-full animate-pulse rounded-lg bg-slate-100" />
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
