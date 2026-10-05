
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
import { AnimatePresence, motion } from 'framer-motion';

const Searching: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata || 'Your Destination';
  const searchPrefetchParams = React.useMemo(() => getPrefetchParamsFromUrl(searchParams), [searchParamsString]);
  const [duration, setDuration] = React.useState(5000); 
  // Keep the searching screen up for at least this long, even when results arrive sooner.
  const MIN_DISPLAY_TIME = 5000;
  const startTimeRef = React.useRef<number>(Date.now());
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
    const initialStatus = getPrefetchStatus(searchPrefetchParams);
    let isDataFinished = initialStatus === 'fulfilled' || initialStatus === 'failed';
    let isNavigated = false;
    let isDisposed = false;
    let frameId = 0;
    const MAX_WAIT_TIME = 15000; // 15 seconds max
    // Progress fills over at least MIN_DISPLAY_TIME (or the admin-configured duration if longer).
    const fillTime = Math.max(duration, MIN_DISPLAY_TIME);
    const elapsedMs = () => Date.now() - startTimeRef.current;

    console.log("Searching: initial data status:", initialStatus);

    const tryNavigate = () => {
      // Ensure we only navigate once
      if (isNavigated || isDisposed) return;

      const elapsed = elapsedMs();
      const isDataWaitFinished = isDataFinished || elapsed > MAX_WAIT_TIME;
      // Always show the screen for at least MIN_DISPLAY_TIME; the results chunk must also be loaded to avoid a Suspense flash
      const isMinTimeFinished = elapsed >= MIN_DISPLAY_TIME;

      if (isDataWaitFinished && isMinTimeFinished && isChunkLoaded) {
        console.log("Searching: proceeding to results page.", { isDataFinished, isChunkLoaded, elapsed });
        setProgress(1);
        isNavigated = true;
        // Short pause so the completed state is visible
        setTimeout(() => {
          const forwardParams = new URLSearchParams(searchParamsString);
          navigate(`/search?${forwardParams.toString()}`);
        }, 350);
      }
    };

    const animate = () => {
      if (isNavigated || isDisposed) return;
      const elapsed = elapsedMs();
      // Hold just short of 100% until results are actually ready
      const cap = isDataFinished ? 1 : 0.95;
      setProgress(Math.min(elapsed / fillTime, cap));
      if (elapsed >= MIN_DISPLAY_TIME) tryNavigate();
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % searchMessages.length);
    }, Math.max(duration, MIN_DISPLAY_TIME) / searchMessages.length);

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
      cancelAnimationFrame(frameId);
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
  const logoSlots = visibleSuppliers.slice(0, 8);

  const included = [
    { icon: ShieldCheck, title: 'Free cancellation', text: 'On most bookings' },
    { icon: Receipt, title: 'No hidden fees', text: 'Taxes and fees shown up front' },
    { icon: Headphones, title: '24/7 support', text: 'Before and during your rental' },
  ];

  // Slides shown in turn inside a fixed-height panel so the page never scrolls
  const slideKeys = [...(totalSuppliers > 0 ? ['suppliers'] : []), 'included', 'tip'];
  const [slideIndex, setSlideIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setSlideIndex(i => i + 1), 1800);
    return () => clearInterval(id);
  }, []);
  const activeSlide = slideKeys[slideIndex % slideKeys.length];

  const renderSlide = (key: string) => {
    if (key === 'suppliers') {
      return (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Checking rental companies</p>
            <p className="text-sm text-slate-500"><span className="font-semibold tabular-nums text-slate-900">{checkedCount}</span> of {totalSuppliers}</p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {logoSlots.map((supplier, index) => {
              const isComplete = progress >= 1 || index < suppliersScanned;
              const isActive = !isComplete && index === Math.min(suppliersScanned, totalSuppliers - 1);
              const logoScale = ((isMobileViewport ? supplier.mobileScale : supplier.scale) || 100) / 100;
              const logoSrc = supplier.logoUrl || supplier.logo;
              const initials = String(supplier.name || 'Supplier').split(/\s+/).slice(0, 2).map((part: string) => part.charAt(0)).join('').toUpperCase();
              return (
                <div
                  key={`supplier-scan-${supplier.id}-${supplier.name}`}
                  className={`relative flex h-11 min-w-0 items-center justify-center rounded-lg border bg-white p-2 transition-all duration-300 sm:h-12 ${
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
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {totalSuppliers > logoSlots.length && (
            <p className="mt-2 text-xs text-slate-500">+ {totalSuppliers - logoSlots.length} more companies</p>
          )}
        </div>
      );
    }
    if (key === 'included') {
      return (
        <div>
          <p className="text-sm font-semibold text-slate-900">Every Hogicar booking includes</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {included.map(item => (
              <li key={item.title} className="flex items-center gap-3 sm:block">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="sm:mt-2 sm:block">
                  <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                  <span className="block text-xs text-slate-500">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="flex h-full items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          <Lightbulb className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Good to know</p>
          <p className="mt-1 text-base text-slate-600">{tips[currentTipIndex]}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <SEOMetadata
        title="Searching for your perfect car... | Hogicar"
        description="We're comparing hundreds of suppliers to find you the best car rental deal."
        noIndex={true}
      />
      <div className="relative flex h-[calc(100dvh-73px)] min-h-[560px] flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-4 font-sans text-slate-900 sm:px-6">
        {/* Blue backdrop behind the top half */}
        <div className="absolute inset-x-0 top-0 h-[46%] overflow-hidden bg-gradient-to-br from-[#003580] via-[#0047a6] to-[#0b5cc4]" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        </div>

        <div className="relative w-full max-w-3xl">
          {/* Trip route */}
          <div className="text-white">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">Pick-up</p>
                <p className="truncate text-xl font-bold leading-tight sm:text-2xl">{pickupIata ? pickupIata.toUpperCase() : pickupName}</p>
                <p className="truncate text-xs text-white/75 sm:text-sm">{formatTripDate(searchPrefetchParams.pickupDate, searchPrefetchParams.startTime)}</p>
              </div>
              <div className="w-20 sm:w-56" aria-hidden="true">
                <div className="relative h-8">
                  <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/35" />
                  <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white" />
                  <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white" />
                  <div
                    className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-accent shadow-lg"
                    style={{ left: `${Math.min(88, Math.max(12, progress * 100))}%` }}
                  >
                    <CarIcon className="h-4 w-4" />
                  </div>
                </div>
                {tripDays > 0 && <p className="text-center text-[11px] font-medium text-white/75">{tripDays} day{tripDays > 1 ? 's' : ''}</p>}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">Drop-off</p>
                <p className="truncate text-xl font-bold leading-tight sm:text-2xl">{dropoffCode || dropoffLabel}</p>
                <p className="truncate text-xs text-white/75 sm:text-sm">{formatTripDate(searchPrefetchParams.dropoffDate, searchPrefetchParams.endTime)}</p>
              </div>
            </div>
            <p className="mt-3 truncate text-center text-sm text-white/80">{pickupName}</p>
          </div>

        {/* Main card */}
          <div className="mt-5 flex w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xl sm:mt-6" role="status" aria-live="polite">
            <div className="p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Step {stepIndex + 1} of {searchMessages.length}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
                    <span key={stepIndex} className="truncate animate-in fade-in duration-500">{progress >= 1 ? 'Your results are ready' : searchMessages[stepIndex]}</span>
                  </p>
                </div>
                <span className="shrink-0 text-3xl font-bold tabular-nums tracking-tight text-accent">{percent}%</span>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Search progress">
                {searchMessages.map((message, i) => {
                  const segStart = i / searchMessages.length;
                  const fill = Math.max(0, Math.min(1, (progress - segStart) * searchMessages.length));
                  return (
                    <div key={message} className="h-2 overflow-hidden rounded-full bg-slate-100" title={message}>
                      <div className={`h-full rounded-full ${fill >= 1 ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${fill * 100}%` }} />
                    </div>
                  );
                })}
              </div>
              <ul className="mt-2 hidden grid-cols-5 gap-1.5 sm:grid">
                {searchMessages.map((message, i) => (
                  <li key={message} className={`text-[11px] leading-tight ${i < stepIndex || progress >= 1 ? 'text-emerald-700' : i === stepIndex ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                    {['Availability', 'Prices', 'Taxes & fees', 'Policies', 'Best deals'][i]}
                  </li>
                ))}
              </ul>
            </div>

            {/* Slides */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-4 pt-5 sm:px-6">
              <div className="relative h-[176px] overflow-hidden sm:h-[150px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    {renderSlide(activeSlide)}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-2 flex justify-center gap-1.5">
                {slideKeys.map((key, i) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Show slide ${i + 1}`}
                    aria-current={activeSlide === key}
                    className={`h-1.5 rounded-full transition-all ${activeSlide === key ? 'w-6 bg-accent' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 sm:gap-x-6">
            <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure search</li>
            <li className="inline-flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-emerald-600" /> Prices include taxes and fees</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Free cancellation on most bookings</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Searching;
