import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_IMAGES } from '../constants';
import { loadCars } from '../utils/loadCars';
import { apiCarsToCars } from '../utils/apiCarToCar';
import CarCard from '../components/CarCard';
import ComparisonModal from '../components/ComparisonModal';
import AiAdvisor, { openAiAdvisor } from '../components/AiAdvisor';
import { applyPickupOverrides, loadPickupOverrides, PickupOverrideMap } from '../utils/pickupOverrides';
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Filter from 'lucide-react/dist/esm/icons/filter';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Gem from 'lucide-react/dist/esm/icons/gem';
import Users from 'lucide-react/dist/esm/icons/users';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Gift from 'lucide-react/dist/esm/icons/gift';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Shield from 'lucide-react/dist/esm/icons/shield';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Check from 'lucide-react/dist/esm/icons/check';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowLeftRight from 'lucide-react/dist/esm/icons/arrow-left-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { CarCategory, Car, Transmission, FuelPolicy, CommissionType, ApiSearchResult, Supplier, BookingMode, CarType, RateTier, PickupType } from '../types';
import { calculatePrice } from '../utils/bookingUtils';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { Logo } from '../components/Logo';
import { API_BASE_URL } from '../lib/config';
import { formatCategoryName } from '../utils/ratings';
import { clearMatchingPrefetchedResults, getMatchingPrefetchedResults, waitForMatchingSearchPrefetch, getPrefetchParamsFromUrl } from '../utils/searchPrefetch';
import PickupTypeIcon from '../components/PickupTypeIcon';

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const navigate = useNavigate();
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata;
  const dropoffName = searchParams.get('dropoffName');
  const location = pickupName;
  const searchPrefetchParams = React.useMemo(() => getPrefetchParamsFromUrl(searchParams), [searchParamsString]);
  const { pickupDate: startDate, dropoffDate: endDate, dropoffCode: dropoffIata, startTime: startTimeParam, endTime: endTimeParam } = searchPrefetchParams;
  
  // Pagination & Loading States
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [apiCars, setApiCars] = useState<Car[]>(() => {
    if (typeof window === 'undefined') return [];
    const prefetched = getMatchingPrefetchedResults(searchPrefetchParams);
    if (prefetched && prefetched.cars) {
      console.log("Search: Initializing state with prefetched cars:", prefetched.cars.length);
      return apiCarsToCars(prefetched.cars);
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    
    // If we already initialized apiCars in the line above, we're not loading!
    const prefetched = getMatchingPrefetchedResults(searchPrefetchParams);
    if (prefetched) return false;
    
    // Check if there's an in-flight prefetch we should wait for
    const pendingPrefetch = waitForMatchingSearchPrefetch(searchPrefetchParams);
    if (pendingPrefetch) {
        console.log("Search: In-flight prefetch detected, starting in loading state.");
        return true;
    }

    // For direct URL access with no prefetch, we must start as loading
    return true; 
  });
  const [error, setError] = useState<string | null>(null);

  // Filter States (moved up so fetchApiCars can use them)
  const [priceRange, setPriceRange] = useState(5000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedFuelPolicies, setSelectedFuelPolicies] = useState<string[]>([]);
  const [passengerCapacity, setPassengerCapacity] = useState<number>(0);
  const [sortBy, setSortBy] = useState('Price: Low to High');
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);
  const [maxDeposit, setMaxDeposit] = useState<number>(0);
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<string[]>([]);
  const [specialOffersOnly, setSpecialOffersOnly] = useState<boolean>(false);

  const { convertPrice, getCurrencySymbol } = useCurrency();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [highlightedCarId, setHighlightedCarId] = React.useState<string | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);
  const showCarFromAdvisor = useCallback((carId: string) => {
    const el = document.getElementById(`car-${carId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedCarId(carId);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightedCarId(null), 2600);
  }, []);
  
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  
  const fetchApiCars = useCallback(async (isLoadMore = false) => {
    const currentPage = isLoadMore ? page + 1 : 0;

    // PRE-FETCH CHECK: Before setting loading=true, check if we already have the data 
    // or if a pre-fetch is in flight for the same signature.
    if (!isLoadMore && page === 0) {
      const prefetched = getMatchingPrefetchedResults(searchPrefetchParams);
      if (prefetched) {
        console.log("Search: Using pre-fetched results from session storage.");
        const cars = apiCarsToCars(prefetched.cars);
        
        // Only update if we don't already have these cars (from initial state)
        if (apiCars.length === 0) {
            setApiCars(cars);
            setHasNext(prefetched.hasNext);
        }
        
        setLoading(false);
        setTimeout(() => clearMatchingPrefetchedResults(searchPrefetchParams), 2000);
        return;
      }

      const pendingPrefetch = waitForMatchingSearchPrefetch(searchPrefetchParams);
      if (pendingPrefetch) {
        try {
          console.log("Search: Waiting for in-flight prefetch.");
          // Only show loading if we really don't have cars yet
          if (apiCars.length === 0) setLoading(true);
          
          const result = await pendingPrefetch;
          console.log("Search: In-flight prefetch completed.", { count: result.cars?.length });
          
          const cars = apiCarsToCars(result.cars);
          setApiCars(cars);
          setHasNext(result.hasNext);
          setLoading(false);
          
          setTimeout(() => clearMatchingPrefetchedResults(searchPrefetchParams), 2000);
          return;
        } catch (e) {
          console.warn("Search: In-flight prefetch failed.", e);
          // Continue to regular fetch as fallback
        }
      }
    }

    if (!isLoadMore && apiCars.length === 0) {
      setLoading(true);
    } else if (isLoadMore) {
      setIsFetchingMore(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await loadCars({
        locationsOptions: [],
        pickupCode: searchPrefetchParams.pickupCode,
        dropoffCode: searchPrefetchParams.dropoffCode,
        pickupDate: searchPrefetchParams.pickupDate,
        dropoffDate: searchPrefetchParams.dropoffDate,
        startTime: searchPrefetchParams.startTime,
        endTime: searchPrefetchParams.endTime,
        page: currentPage,
        size: 20,
        // Filters are applied on the client so counts stay stable and filtering is instant
        sort: sortBy,
      });

      if (isLoadMore) {
        setApiCars(prev => [...prev, ...apiCarsToCars(data.cars)]);
        setPage(currentPage);
      } else {
        setApiCars(apiCarsToCars(data.cars));
        setPage(0);
      }
      setHasNext(data.hasNext);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch search results:", err);
      if (!isLoadMore) {
        setError("We couldn't retrieve car results at the moment. Please try again later.");
        setApiCars([]);
      }
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }, [searchPrefetchParams, sortBy, page, apiCars.length]);

  useEffect(() => {
    fetchApiCars(false);
  }, [searchParamsString, sortBy]);

  // Admin-set pick-up types for external suppliers (in terminal, meet & greet, shuttle).
  const [pickupOverrides, setPickupOverrides] = useState<PickupOverrideMap | null>(null);
  useEffect(() => { loadPickupOverrides().then(setPickupOverrides); }, []);
  useEffect(() => {
    if (!pickupOverrides) return;
    setApiCars(prev => applyPickupOverrides(prev, pickupOverrides, pickupIata));
  }, [pickupOverrides, apiCars, pickupIata]);

  // Loads every remaining results page so the AI advisor can compare the whole search.
  const pageRef = useRef(page);
  const hasNextRef = useRef(hasNext);
  pageRef.current = page;
  hasNextRef.current = hasNext;
  const loadAllPromise = useRef<Promise<void> | null>(null);
  const loadAllResults = useCallback(() => {
    if (loadAllPromise.current) return loadAllPromise.current;
    loadAllPromise.current = (async () => {
      let nextPage = pageRef.current + 1;
      let more = hasNextRef.current;
      const collected: Car[] = [];
      for (let i = 0; more && i < 30; i++, nextPage++) {
        try {
          const data = await loadCars({
            locationsOptions: [],
            pickupCode: searchPrefetchParams.pickupCode,
            dropoffCode: searchPrefetchParams.dropoffCode,
            pickupDate: searchPrefetchParams.pickupDate,
            dropoffDate: searchPrefetchParams.dropoffDate,
            startTime: searchPrefetchParams.startTime,
            endTime: searchPrefetchParams.endTime,
            page: nextPage,
            size: 20,
            sort: sortBy,
          });
          collected.push(...apiCarsToCars(data.cars));
          more = Boolean(data.hasNext) && data.cars.length > 0;
        } catch (err) {
          console.warn('Search: could not load all results for the advisor', err);
          break;
        }
      }
      if (collected.length) {
        setApiCars(prev => {
          const seen = new Set(prev.map(c => c.id));
          return [...prev, ...collected.filter(c => !seen.has(c.id))];
        });
        setPage(nextPage - 1);
      }
      setHasNext(more);
    })().finally(() => { loadAllPromise.current = null; });
    return loadAllPromise.current;
  }, [searchPrefetchParams, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasNext || isFetchingMore || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchApiCars(true);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasNext, isFetchingMore, loading, page, fetchApiCars]);

  const formatDateTime = (date: Date, time: string) => {
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • ${time}`;
  };
  const startDateTimeDisplay = formatDateTime(startD, startTimeParam || '10:00');
  const endDateTimeDisplay = formatDateTime(endD, endTimeParam || '10:00');

  const [openFilters, setOpenFilters] = useState<string[]>([
    'Price',
    'Category',
    'Passengers',
    'Payment',
    'Deposit',
    'LocationType',
    'Transmission',
    'Fuel',
    'Supplier',
  ]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  
  const [allLocationSuppliers, setAllLocationSuppliers] = useState<any[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(CATEGORY_IMAGES as Record<string, string>);
  const [selectedCompareCars, setSelectedCompareCars] = useState<Car[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const toggleCompare = (car: Car) => {
    setIsCompareMode(true);
    setSelectedCompareCars(prev => {
        const isAlreadySelected = prev.some(c => c.id === car.id);
        if (isAlreadySelected) {
            return prev.filter(c => c.id !== car.id);
        } else {
            if (prev.length >= 4) return prev; // Limit to 4 cars for comparison
            return [...prev, car];
        }
    });
  };

  const normalizeCategoryImages = (images: unknown): Record<string, string> => {
    const normalized: Record<string, string> = {};
    if (!images || typeof images !== 'object') {
      return normalized;
    }

    Object.entries(images as Record<string, unknown>).forEach(([key, value]) => {
      const normalizedKey = key.trim().toUpperCase();
      const normalizedValue = typeof value === 'string' ? value.trim() : '';
      if (normalizedKey && normalizedValue) {
        normalized[normalizedKey] = normalizedValue;
      }
    });

    return normalized;
  };

  React.useEffect(() => {
    const loadLocationSuppliers = async () => {
      if (pickupIata) {
        try {
          const results = await fetchPublicSuppliers(pickupIata);
          setAllLocationSuppliers(results);
        } catch (err) {
          console.error("Failed to fetch location suppliers:", err);
        }
      }
    };
    loadLocationSuppliers();
  }, [pickupIata]);

  React.useEffect(() => {
    const loadCategoryImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/homepage/category-images`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const normalizedImages = normalizeCategoryImages(data);
        if (Object.keys(normalizedImages).length > 0) {
          setCategoryImages({ ...(CATEGORY_IMAGES as Record<string, string>), ...normalizedImages });
        }
      } catch (err) {
        console.error('Failed to load category images:', err);
      }
    };

    loadCategoryImages();
  }, []);

  React.useEffect(() => {
    if (showMobileFilters || showMobileSort) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileFilters, showMobileSort]);

  const handleResetFilters = () => {
    setPriceRange(5000);
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setSelectedTransmissions([]);
    setSelectedFuelPolicies([]);
    setPassengerCapacity(0);
    setSelectedPaymentTypes([]);
    setMaxDeposit(0);
    setSelectedLocationTypes([]);
    setSpecialOffersOnly(false);
  };

  const handleSearch = (params: any) => {
    const { pickup, pickupName, dropoff, dropoffName, pickupDate, dropoffDate, startTime, endTime } = params;
    if (!pickup) return;

    const newSearchParams = new URLSearchParams();
    newSearchParams.set('pickup', pickup);
    if(pickupName) newSearchParams.set('pickupName', pickupName);

    if (pickupDate) newSearchParams.set('pickupDate', pickupDate);
    if (dropoffDate) newSearchParams.set('dropoffDate', dropoffDate);
    if (startTime) newSearchParams.set('startTime', startTime);
    if (endTime) newSearchParams.set('endTime', endTime);
    
    if(dropoff) newSearchParams.set('dropoff', dropoff);
    if(dropoffName) newSearchParams.set('dropoffName', dropoffName);
    
    setIsSearchOpen(false);
    navigate(`/searching?${newSearchParams.toString()}`);
  };

  const toggleFilterSection = (section: string) => {
    setOpenFilters(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const allCategories = Object.values(CarCategory).filter(cat => cat !== CarCategory.INTERMEDIATE);
  const supplierLogos = React.useMemo(() => {
    const logos = new Map<string, string>();
    allLocationSuppliers.forEach(s => {
      if (s.name && !logos.has(s.name)) {
        logos.set(s.name, s.logoUrl || '');
      }
    });
    if (apiCars) {
      apiCars.forEach(c => {
        if (c.supplier?.name && !logos.has(c.supplier.name)) {
          logos.set(c.supplier.name, c.supplier.logo || '');
        }
      });
    }
    return logos;
  }, [apiCars, allLocationSuppliers]);

  const allSuppliers = React.useMemo(() => {
    return Array.from(supplierLogos.keys()).sort();
  }, [supplierLogos]);
  const allTransmissions = Object.values(Transmission);
  const allFuelPolicies = Object.values(FuelPolicy);
  const allLocationTypes = ['In Terminal', 'Shuttle Bus', 'Meet & Greet'];
  const paymentTypeMapping: { [key in CommissionType]: string } = {
    [CommissionType.FULL_PREPAID]: "Pay fully online",
    [CommissionType.PARTIAL_PREPAID]: "Pay partially online",
    [CommissionType.PAY_AT_DESK]: "Pay at desk",
  };
  const allPaymentTypes = Object.values(CommissionType);
  
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
        prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSupplierChange = (supplier: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplier) ? prev.filter(s => s !== supplier) : [...prev, supplier]
    );
  };

  const handleTransmissionChange = (transmission: string) => {
      setSelectedTransmissions(prev => 
        prev.includes(transmission) ? prev.filter(t => t !== transmission) : [...prev, transmission]
      );
  }

  const handleFuelPolicyChange = (policy: string) => {
      setSelectedFuelPolicies(prev => 
        prev.includes(policy) ? prev.filter(p => p !== policy) : [...prev, policy]
      );
  }
  
  const handlePaymentTypeChange = (paymentType: string) => {
    setSelectedPaymentTypes(prev => 
      prev.includes(paymentType) ? prev.filter(p => p !== paymentType) : [...prev, paymentType]
    );
  };

  const handleLocationTypeChange = (locationType: string) => {
      setSelectedLocationTypes(prev => 
        prev.includes(locationType) ? prev.filter(l => l !== locationType) : [...prev, locationType]
      );
  };

  const getCarDailyPrice = (car: Car) => calculatePrice(car, days, startDate).dailyRate;
  
  const baseFilteredCars = React.useMemo(() => {
    return apiCars || [];
  }, [apiCars]);

  const categoryOrder = [CarCategory.MINI, CarCategory.ECONOMY, CarCategory.COMPACT, CarCategory.MIDSIZE, CarCategory.FULLSIZE, CarCategory.SUV, CarCategory.LUXURY, CarCategory.PEOPLE_CARRIER];

  const filteredCarsExceptCategory = React.useMemo(() => {
    return baseFilteredCars.filter(car => {
      const basePrice = getCarDailyPrice(car);
      if (basePrice > priceRange) return false;
      if (selectedSuppliers.length > 0 && !selectedSuppliers.includes(car.supplier.name)) return false;
      if (selectedTransmissions.length > 0 && !selectedTransmissions.includes(car.transmission)) return false;
      if (selectedFuelPolicies.length > 0 && !selectedFuelPolicies.includes(car.fuelPolicy)) return false;
      if (passengerCapacity > 0 && car.passengers < passengerCapacity) return false;
      if (selectedPaymentTypes.length > 0 && !selectedPaymentTypes.includes(car.supplier.commissionType)) return false;
      if (maxDeposit > 0 && car.deposit > maxDeposit) return false;
      if (specialOffersOnly && !(car.promotionAmount || car.promotionPercent || car.hogicarChoice)) return false;
      if (selectedLocationTypes.length > 0) {
          const pt = car.supplier?.pickupType;
          let carMatch = false;
          if (pt === 'IN_TERMINAL' && selectedLocationTypes.includes('In Terminal')) carMatch = true;
          else if (pt === 'MEET_AND_GREET' && selectedLocationTypes.includes('Meet & Greet')) carMatch = true;
          else if (pt === 'SHUTTLE_BUS' && selectedLocationTypes.includes('Shuttle Bus')) carMatch = true;
          else {
              carMatch = selectedLocationTypes.some(locType => car.locationDetail.toLowerCase().includes(locType.toLowerCase()));
          }
          if (!carMatch) return false;
      }
      return true;
    });
  }, [baseFilteredCars, priceRange, selectedSuppliers, selectedTransmissions, selectedFuelPolicies, passengerCapacity, selectedPaymentTypes, maxDeposit, selectedLocationTypes, specialOffersOnly, days, startDate]);

  const categorySummaries = React.useMemo(() => {
    const summaries = new Map<string, { count: number; fromTotal: number | null; passengers: number | null; bags: number | null }>();

    categoryOrder.forEach(category => {
      const carsInCategory = filteredCarsExceptCategory.filter(car => car.category === category && car.isAvailable !== false);
      if (carsInCategory.length === 0) {
        summaries.set(category, { count: 0, fromTotal: null, passengers: null, bags: null });
        return;
      }

      const cheapest = [...carsInCategory].sort((a, b) => calculatePrice(a, days, startDate).total - calculatePrice(b, days, startDate).total)[0];
      summaries.set(category, {
        count: carsInCategory.length,
        fromTotal: calculatePrice(cheapest, days, startDate).total,
        passengers: cheapest.passengers || null,
        bags: cheapest.bags || null,
      });
    });

    return summaries;
  }, [filteredCarsExceptCategory, days, startDate]);

  const filterCounts = React.useMemo(() => {
    const counts = {
      category: new Map<string, number>(),
      supplier: new Map<string, number>(),
      transmission: new Map<string, number>(),
      fuelPolicy: new Map<string, number>(),
      paymentType: new Map<string, number>(),
      locationType: new Map<string, number>(),
    };

    // Use filteredCarsExceptCategory for category counts to show what WOULD be available
    filteredCarsExceptCategory.forEach(car => {
        counts.category.set(car.category, (counts.category.get(car.category) || 0) + 1);
    });

    baseFilteredCars.forEach(car => {
        counts.supplier.set(car.supplier.name, (counts.supplier.get(car.supplier.name) || 0) + 1);
        counts.transmission.set(car.transmission, (counts.transmission.get(car.transmission) || 0) + 1);
        counts.fuelPolicy.set(car.fuelPolicy, (counts.fuelPolicy.get(car.fuelPolicy) || 0) + 1);
        counts.paymentType.set(car.supplier.commissionType, (counts.paymentType.get(car.supplier.commissionType) || 0) + 1);
        
        const pt = car.supplier?.pickupType;
        let matched = false;
        if (pt === 'IN_TERMINAL') { counts.locationType.set('In Terminal', (counts.locationType.get('In Terminal') || 0) + 1); matched = true; }
        else if (pt === 'MEET_AND_GREET') { counts.locationType.set('Meet & Greet', (counts.locationType.get('Meet & Greet') || 0) + 1); matched = true; }
        else if (pt === 'SHUTTLE_BUS') { counts.locationType.set('Shuttle Bus', (counts.locationType.get('Shuttle Bus') || 0) + 1); matched = true; }
        
        if (!matched) {
            allLocationTypes.forEach(locType => {
                if (car.locationDetail.toLowerCase().includes(locType.toLowerCase())) {
                    counts.locationType.set(locType, (counts.locationType.get(locType) || 0) + 1);
                }
            });
        }
    });
    return counts;
  }, [baseFilteredCars, filteredCarsExceptCategory]);

  const sortedAndFilteredCars = React.useMemo(() => {
    const filtered = baseFilteredCars.filter(car => {
      const basePrice = getCarDailyPrice(car);
      if (basePrice > priceRange) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(car.category)) return false;
      if (selectedSuppliers.length > 0 && !selectedSuppliers.includes(car.supplier.name)) return false;
      if (selectedTransmissions.length > 0 && !selectedTransmissions.includes(car.transmission)) return false;
      if (selectedFuelPolicies.length > 0 && !selectedFuelPolicies.includes(car.fuelPolicy)) return false;
      if (passengerCapacity > 0 && car.passengers < passengerCapacity) return false;
      if (selectedPaymentTypes.length > 0 && !selectedPaymentTypes.includes(car.supplier.commissionType)) return false;
      if (maxDeposit > 0 && car.deposit > maxDeposit) return false;
      if (specialOffersOnly && !(car.promotionAmount || car.promotionPercent || car.hogicarChoice)) return false;
      if (selectedLocationTypes.length > 0) {
          const pt = car.supplier?.pickupType;
          let carMatch = false;
          if (pt === 'IN_TERMINAL' && selectedLocationTypes.includes('In Terminal')) carMatch = true;
          else if (pt === 'MEET_AND_GREET' && selectedLocationTypes.includes('Meet & Greet')) carMatch = true;
          else if (pt === 'SHUTTLE_BUS' && selectedLocationTypes.includes('Shuttle Bus')) carMatch = true;
          else {
              carMatch = selectedLocationTypes.some(locType => car.locationDetail.toLowerCase().includes(locType.toLowerCase()));
          }
          if (!carMatch) return false;
      }
      return true;
    });

    switch(sortBy) {
        case 'Price: Low to High':
            return [...filtered].sort((a, b) => getCarDailyPrice(a) - getCarDailyPrice(b));
        case 'Price: High to Low':
            return [...filtered].sort((a, b) => getCarDailyPrice(b) - getCarDailyPrice(a));
        default:
            return filtered;
    }
  }, [baseFilteredCars, priceRange, selectedCategories, selectedSuppliers, selectedTransmissions, selectedFuelPolicies, passengerCapacity, sortBy, days, startDate, selectedPaymentTypes, maxDeposit, selectedLocationTypes, specialOffersOnly]);
  
  const activeFilterCount =
    selectedCategories.length +
    selectedSuppliers.length +
    selectedTransmissions.length +
    selectedFuelPolicies.length +
    selectedPaymentTypes.length +
    selectedLocationTypes.length +
    (passengerCapacity > 0 ? 1 : 0) +
    (maxDeposit > 0 ? 1 : 0) +
    (specialOffersOnly ? 1 : 0);

  // Price slider covers the real range of daily prices; 5000 means "no limit"
  const maxDailyPrice = React.useMemo(() => {
    const prices = baseFilteredCars.map(getCarDailyPrice).filter(p => Number.isFinite(p) && p > 0);
    return prices.length ? Math.ceil(Math.max(...prices)) : 5000;
  }, [baseFilteredCars, days, startDate]);
  const sliderValue = Math.min(priceRange, maxDailyPrice);

  const activeFilters: { key: string; label: string; clear: () => void }[] = [
    ...(specialOffersOnly ? [{ key: 'special', label: 'Special offers', clear: () => setSpecialOffersOnly(false) }] : []),
    ...selectedCategories.map(c => ({ key: `cat-${c}`, label: formatCategoryName(c), clear: () => handleCategoryToggle(c) })),
    ...(passengerCapacity > 0 ? [{ key: 'seats', label: `${passengerCapacity}+ seats`, clear: () => setPassengerCapacity(0) }] : []),
    ...selectedTransmissions.map(t => ({ key: `tr-${t}`, label: t === 'AUTOMATIC' ? 'Automatic' : t === 'MANUAL' ? 'Manual' : t, clear: () => handleTransmissionChange(t) })),
    ...selectedPaymentTypes.map(t => ({ key: `pay-${t}`, label: paymentTypeMapping[t as CommissionType] || t, clear: () => handlePaymentTypeChange(t) })),
    ...(maxDeposit > 0 ? [{ key: 'deposit', label: `Deposit under ${getCurrencySymbol()}${convertPrice(maxDeposit).toFixed(0)}`, clear: () => setMaxDeposit(0) }] : []),
    ...selectedLocationTypes.map(l => ({ key: `loc-${l}`, label: l, clear: () => handleLocationTypeChange(l) })),
    ...selectedFuelPolicies.map(f => ({ key: `fuel-${f}`, label: `Fuel: ${f.replace(/_/g, ' ').toLowerCase()}`, clear: () => handleFuelPolicyChange(f) })),
    ...selectedSuppliers.map(n => ({ key: `sup-${n}`, label: n, clear: () => handleSupplierChange(n) })),
    ...(priceRange < 5000 && priceRange < maxDailyPrice ? [{ key: 'price', label: `Up to ${getCurrencySymbol()}${convertPrice(priceRange).toFixed(0)}/day`, clear: () => setPriceRange(5000) }] : []),
  ];
  const matchedFilterLabels = activeFilters.map(f => f.label);

  // When filters change and the user has scrolled past the top of the results, bring the results back into view
  const filterKey = matchedFilterLabels.join('|');
  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return; }
    const el = resultsTopRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 140;
    if (window.scrollY > top + 40) window.scrollTo({ top, behavior: 'smooth' });
  }, [filterKey]);

  const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low'];
  const sortLabel = (value: string) => value === 'Price: Low to High' ? 'Lowest price' : value === 'Price: High to Low' ? 'Highest price' : 'Recommended';

  const filterSection = (key: string, title: string, content: React.ReactNode, extraClass = '') => (
    <div className={`border-b border-slate-100 px-4 py-4 last:border-b-0 ${extraClass}`}>
      <button
        type="button"
        onClick={() => toggleFilterSection(key)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={openFilters.includes(key)}
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        {openFilters.includes(key) ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {openFilters.includes(key) && <div className="mt-3">{content}</div>}
    </div>
  );

  const checkboxRow = (key: string, checked: boolean, onChange: () => void, label: React.ReactNode, count?: number) => (
    <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1.5 text-sm text-slate-700 hover:text-slate-900">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 rounded border-slate-300 text-accent focus:ring-accent" />
      <span className="flex min-w-0 flex-1 items-center gap-2">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count}</span>}
    </label>
  );

  const fuelLabel = (policy: string) => policy.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

  return (
    <>
    <SEOMetadata
        title={`Car Hire in ${location || 'Top Destinations'} | Hogicar`}
        description={`Find the best car rental deals in ${location}. Compare prices from top suppliers like Hertz, Avis, and more.`}
    />
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 md:pb-12">
      {/* Search summary (part of the header) */}
      <div className="relative z-30 bg-[#003580] pb-4 pt-3 shadow-md md:sticky md:top-[72px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!isSearchOpen ? (
            <>
              {/* Desktop: segmented bar */}
              <div className="hidden items-stretch rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 md:flex">
                {[
                  { icon: MapPin, label: dropoffIata && dropoffIata !== pickupIata ? 'Pick-up location' : 'Pick-up & drop-off', value: location || 'Select location', grow: 'flex-[1.6]' },
                  { icon: Calendar, label: 'Pick-up', value: startDateTimeDisplay.replace(' • ', ', '), grow: 'flex-1' },
                  { icon: Calendar, label: 'Drop-off', value: endDateTimeDisplay.replace(' • ', ', '), grow: 'flex-1' },
                ].map((seg, i) => (
                  <button
                    key={seg.label}
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className={`flex min-w-0 ${seg.grow} items-center gap-3 rounded-lg px-4 py-2 text-left transition-colors hover:bg-slate-50 ${i > 0 ? 'border-l border-slate-200' : ''}`}
                  >
                    <seg.icon className="h-5 w-5 shrink-0 text-slate-400" />
                    <span className="min-w-0">
                      <span className="block text-xs text-slate-500">{seg.label}</span>
                      <span className="block truncate text-[15px] font-semibold text-slate-900">{seg.value}</span>
                    </span>
                  </button>
                ))}
                <div className="flex items-center border-l border-slate-200 px-4">
                  <span className="text-center">
                    <span className="block text-xs text-slate-500">Rental</span>
                    <span className="block whitespace-nowrap text-[15px] font-semibold text-slate-900">{days} day{days > 1 ? 's' : ''}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="ml-1.5 inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
                >
                  <Edit className="h-4 w-4" /> Edit search
                </button>
              </div>

              {/* Mobile: compact bar */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 text-left shadow-lg ring-1 ring-black/5 md:hidden"
              >
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{location || 'Select location'}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {startDateTimeDisplay.replace(' • ', ', ')} – {endDateTimeDisplay.replace(' • ', ', ')}
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent" aria-hidden="true">
                  <Edit className="h-4 w-4" />
                </span>
                <span className="sr-only">Edit search</span>
              </button>
            </>
          ) : (
            <div className="animate-fadeIn">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Edit your search</p>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" /> Close
                </button>
              </div>
              <SearchWidget
                onSearch={handleSearch}
                initialValues={{
                  pickup: pickupIata,
                  pickupName: pickupName,
                  pickupDate: startDate,
                  dropoffDate: endDate,
                  startTime: startTimeParam || '10:00',
                  endTime: endTimeParam || '10:00',
                  dropoff: dropoffIata || '',
                  dropoffName: dropoffName || '',
                  differentDropoff: !!dropoffIata && pickupIata !== dropoffIata
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile filter & sort controls */}
        <div className={`sticky top-[72px] z-20 -mx-4 grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur md:hidden ${isSearchOpen ? 'hidden' : 'grid'}`}>
          <button
            type="button"
            onClick={() => { setShowMobileSort(false); setShowMobileFilters(true); }}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-xs text-white">{activeFilters.length}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setShowMobileFilters(false); setShowMobileSort(true); }}
            className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700"
          >
            <ArrowUpDown className="h-4 w-4 shrink-0" />
            <span className="truncate">{sortLabel(sortBy)}</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col items-start gap-6 md:mt-6 md:flex-row">
          {/* Filters (sidebar on desktop, bottom sheet on mobile) */}
          <div className={`fixed inset-0 z-[100] md:relative md:inset-auto md:z-0 ${showMobileFilters ? 'flex' : 'hidden md:block'} w-full flex-shrink-0 md:w-[260px] lg:w-[280px]`}>
            <div className="absolute inset-0 bg-slate-900/40 md:hidden" onClick={() => setShowMobileFilters(false)} />

            <aside className="relative mt-auto flex h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:mt-0 md:h-auto md:overflow-visible md:rounded-xl md:border md:border-slate-200 md:shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  Filters
                  {activeFilters.length > 0 && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent">{activeFilters.length}</span>}
                </h2>
                <div className="flex items-center gap-3">
                  {activeFilters.length > 0 && (
                    <button type="button" onClick={handleResetFilters} className="text-sm font-medium text-accent hover:underline">Clear all</button>
                  )}
                  <button type="button" onClick={() => setShowMobileFilters(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Close filters">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-24 md:flex-none md:overflow-visible md:pb-0">
                <div className="border-b border-slate-100 px-4 py-3">
                  {checkboxRow('special', specialOffersOnly, () => setSpecialOffersOnly(!specialOffersOnly), <><Gift className="h-4 w-4 text-red-500" /> Special offers only</>)}
                </div>

                {filterSection('Price', 'Price per day', (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                      <span>Up to</span>
                      <span className="font-semibold text-slate-900">{sliderValue >= maxDailyPrice ? 'Any price' : `${getCurrencySymbol()}${convertPrice(sliderValue).toFixed(0)}`}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={maxDailyPrice}
                      step="1"
                      value={sliderValue}
                      onChange={(e) => { const v = Number(e.target.value); setPriceRange(v >= maxDailyPrice ? 5000 : v); }}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-accent"
                      aria-label="Maximum price per day"
                    />
                  </div>
                ))}

                {filterSection('Category', 'Car type', (
                  <div>
                    {allCategories.map(type => checkboxRow(type, selectedCategories.includes(type), () => handleCategoryToggle(type), formatCategoryName(type), filterCounts.category.get(type) || 0))}
                  </div>
                ), 'hidden md:block')}

                {filterSection('Passengers', 'Seats', (
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 5, 7].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPassengerCapacity(passengerCapacity === num ? 0 : num)}
                        aria-pressed={passengerCapacity === num}
                        className={`h-9 rounded-lg border text-sm font-medium transition-colors ${passengerCapacity === num ? 'border-accent bg-accent text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
                      >
                        {num}+
                      </button>
                    ))}
                  </div>
                ))}

                {filterSection('Transmission', 'Transmission', (
                  <div>
                    {allTransmissions.map(type => checkboxRow(type, selectedTransmissions.includes(type), () => handleTransmissionChange(type), type === 'AUTOMATIC' ? 'Automatic' : type === 'MANUAL' ? 'Manual' : fuelLabel(type), filterCounts.transmission.get(type) || 0))}
                  </div>
                ))}

                {filterSection('Payment', 'Payment', (
                  <div>
                    {allPaymentTypes.map(type => checkboxRow(type, selectedPaymentTypes.includes(type), () => handlePaymentTypeChange(type), paymentTypeMapping[type as CommissionType], filterCounts.paymentType.get(type) || 0))}
                  </div>
                ))}

                {filterSection('Deposit', 'Security deposit', (
                  <div>
                    {[0, 300, 500].map(amount => (
                      <label key={amount} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-slate-700">
                        <input type="radio" name="deposit" checked={maxDeposit === amount} onChange={() => setMaxDeposit(amount)} className="h-4 w-4 border-slate-300 text-accent focus:ring-accent" />
                        {amount === 0 ? 'Any amount' : `Under ${getCurrencySymbol()}${convertPrice(amount).toFixed(0)}`}
                      </label>
                    ))}
                  </div>
                ))}

                {filterSection('LocationType', 'Pick-up location', (
                  <div>
                    {allLocationTypes.map(type => checkboxRow(type, selectedLocationTypes.includes(type), () => handleLocationTypeChange(type), <><PickupTypeIcon type={type} size="xs" />{type}</>, filterCounts.locationType.get(type) || 0))}
                  </div>
                ))}

                {filterSection('Fuel', 'Fuel policy', (
                  <div>
                    {allFuelPolicies.map(policy => checkboxRow(policy, selectedFuelPolicies.includes(policy), () => handleFuelPolicyChange(policy), fuelLabel(policy), filterCounts.fuelPolicy.get(policy) || 0))}
                  </div>
                ))}

                {filterSection('Supplier', 'Rental company', (
                  <div>
                    {allSuppliers.length === 0 && <p className="text-sm text-slate-500">No suppliers found for this search.</p>}
                    {allSuppliers.map(name => checkboxRow(name, selectedSuppliers.includes(name), () => handleSupplierChange(name), (
                      <>
                        {supplierLogos.get(name) === 'HOGICAR_CHOICE_LOGO' ? (
                          <Logo className="h-5 w-auto max-w-[56px]" />
                        ) : supplierLogos.get(name) ? (
                          <img src={supplierLogos.get(name)} alt="" className="h-5 w-10 object-contain" loading="lazy" decoding="async" width="40" height="20" />
                        ) : null}
                        <span className="truncate">{name}</span>
                      </>
                    ), filterCounts.supplier.get(name) || 0))}
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 md:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="h-12 w-full rounded-lg bg-accent text-base font-semibold text-white"
                >
                  Show {sortedAndFilteredCars.length} cars
                </button>
              </div>
            </aside>
          </div>

          {/* Mobile sort sheet */}
          <div className={`fixed inset-0 z-[110] flex-col md:hidden ${showMobileSort ? 'flex' : 'hidden'}`}>
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowMobileSort(false)} />
            <div className="relative mt-auto w-full rounded-t-2xl bg-white pb-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
                <h2 className="text-base font-bold text-slate-900">Sort by</h2>
                <button type="button" onClick={() => setShowMobileSort(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close sort">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="px-2 py-2">
                {sortOptions.map(option => (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => { setSortBy(option); setShowMobileSort(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-left text-base ${sortBy === option ? 'font-semibold text-accent' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {sortLabel(option)}
                      {sortBy === option && <Check className="h-5 w-5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Results */}
          <main className="w-full min-w-0 flex-grow">
            {loading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading results">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
                ))}
                <p className="pt-2 text-center text-sm text-slate-500">Finding the best deals for you…</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-white px-6 py-12 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
                <h3 className="text-lg font-bold text-slate-900">Something went wrong</h3>
                <p className="mt-1 text-sm text-slate-500">{error}</p>
              </div>
            ) : (
              <>
                <div ref={resultsTopRef} aria-hidden="true" />
                {/* Car type chips */}
                <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0" role="group" aria-label="Filter by car type">
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    aria-pressed={selectedCategories.length === 0}
                    className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
                      selectedCategories.length === 0 ? 'border-accent bg-accent text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    All cars
                  </button>
                  {categoryOrder.map(category => {
                    const summary = categorySummaries.get(category);
                    const count = summary?.count || 0;
                    if (count === 0 && !selectedCategories.includes(category)) return null;
                    const isActive = selectedCategories.includes(category);
                    const categoryImage =
                      categoryImages[category] ||
                      categoryImages[category.toUpperCase()] ||
                      (CATEGORY_IMAGES as Record<string, string>)[category];
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryToggle(category)}
                        aria-pressed={isActive}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-sm transition-colors ${
                          isActive ? 'border-accent bg-accent-50 text-accent-800 ring-1 ring-accent' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span className="flex h-7 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                          {categoryImage && <img src={categoryImage} alt="" className="h-5 w-9 object-contain" loading="lazy" decoding="async" width="36" height="20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        </span>
                        <span className="font-medium">{formatCategoryName(category)}</span>
                        {summary?.fromTotal != null && (
                          <span className={isActive ? 'text-accent-700' : 'text-slate-500'}>{getCurrencySymbol()}{convertPrice(summary.fromTotal).toFixed(0)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeFilters.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
                      <Check className="h-4 w-4" /> Filtered by
                    </span>
                    {activeFilters.map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={f.clear}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-emerald-300 bg-white pl-3 pr-2 text-sm text-emerald-900 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                        aria-label={`Remove filter ${f.label}`}
                      >
                        {f.label}
                        <X className="h-3.5 w-3.5 text-emerald-600" />
                      </button>
                    ))}
                    <button type="button" onClick={handleResetFilters} className="ml-auto text-sm font-medium text-emerald-800 hover:underline">
                      Clear all
                    </button>
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                      {sortedAndFilteredCars.length} car{sortedAndFilteredCars.length === 1 ? '' : 's'} available
                    </h1>
                    <p className="text-sm text-slate-500">Prices are totals for {days} day{days > 1 ? 's' : ''}, including taxes and fees.</p>
                  </div>
                  <label className="hidden items-center gap-2 text-sm text-slate-600 md:flex">
                    Sort by
                    <span className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-semibold text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {sortOptions.map(option => <option key={option} value={option}>{sortLabel(option)}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </span>
                  </label>
                </div>

                {isRefreshing && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-500" role="status">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" /> Updating results…
                  </div>
                )}
                <div className={`space-y-3 transition-opacity duration-200 ${isRefreshing ? 'pointer-events-none opacity-60' : ''}`}>
                  {sortedAndFilteredCars.length > 1 && (
                    <div className="flex flex-col gap-3 rounded-xl border border-accent-100 bg-gradient-to-r from-accent-50 via-white to-white p-3.5 sm:flex-row sm:items-center sm:p-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#003580] to-accent text-white shadow-sm">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">Not sure which car to choose?</p>
                          <p className="text-xs text-slate-600 sm:text-sm">Our AI advisor compares all the results in your search: price, deposit, fuel policy, space and ratings.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-0.5 sm:shrink-0 sm:overflow-visible sm:pb-0">
                        <button type="button" onClick={() => openAiAdvisor('Which car is the best value?')} className="hidden h-9 shrink-0 items-center rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:border-accent hover:text-accent lg:inline-flex">
                          Best value?
                        </button>
                        <button type="button" onClick={() => openAiAdvisor()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white hover:bg-accent-700 sm:text-sm">
                          <Sparkles className="h-4 w-4" /> Ask AI advisor
                        </button>
                      </div>
                    </div>
                  )}

                  {sortedAndFilteredCars.map(car => (
                    <div key={car.id} id={`car-${car.id}`} className={`scroll-mt-24 rounded-xl transition-shadow duration-500 ${highlightedCarId === car.id ? 'shadow-[0_0_0_3px_rgba(0,122,194,0.55),0_12px_32px_-12px_rgba(0,122,194,0.5)]' : ''}`}>
                    <CarCard
                      car={car}
                      cars={sortedAndFilteredCars}
                      days={days}
                      startDate={startDate}
                      endDate={endDate}
                      startTime={startTimeParam || '10:00'}
                      endTime={endTimeParam || '10:00'}
                      pickupCode={pickupIata}
                      dropoffCode={dropoffIata || pickupIata}
                      isComparing={selectedCompareCars.some(c => c.id === car.id)}
                      showCompareControl
                      showMobileCompareControl
                      onCompareToggle={() => toggleCompare(car)}
                      matchedFilters={matchedFilterLabels}
                    />
                    </div>
                  ))}

                  {sortedAndFilteredCars.length === 0 && !loading && (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
                      <CarIcon className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-900">No cars match your filters</h3>
                      <p className="mt-1 text-sm text-slate-500">Try removing some filters or changing your dates.</p>
                      {activeFilters.length > 0 && (
                        <button type="button" onClick={handleResetFilters} className="mt-4 inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-accent hover:text-accent">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}

                  {/* Infinite scroll sentinel */}
                  <div ref={loaderRef} className="flex min-h-[80px] w-full items-center justify-center py-6">
                    {isFetchingMore ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        Loading more cars…
                      </div>
                    ) : !hasNext && sortedAndFilteredCars.length > 0 ? (
                      <p className="text-sm text-slate-400">You've seen all {sortedAndFilteredCars.length} results</p>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Comparison bar */}
      {selectedCompareCars.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(15,23,42,0.08)] animate-in slide-in-from-bottom-8 duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <ArrowLeftRight className="hidden h-5 w-5 shrink-0 text-accent sm:block" />
              <div className="flex -space-x-2">
                {selectedCompareCars.map(car => (
                  <div key={car.id} className="group/comp relative">
                    <div className="flex h-11 w-14 items-center justify-center rounded-lg border-2 border-white bg-slate-50 p-1 ring-1 ring-slate-200">
                      <img src={car.image} alt={car.model} className="h-full w-full object-contain" loading="lazy" decoding="async" width="56" height="44" />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(car)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-red-600"
                      aria-label={`Remove ${car.model} from comparison`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="min-w-0 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{selectedCompareCars.length} of 4</span>
                <span className="hidden sm:inline"> cars selected to compare</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => { setSelectedCompareCars([]); setIsCompareMode(false); }} className="hidden h-10 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">
                Clear
              </button>
              <button
                type="button"
                disabled={selectedCompareCars.length < 2}
                onClick={() => setIsCompareModalOpen(true)}
                className="h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {selectedCompareCars.length < 2 ? 'Select 1 more' : 'Compare'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && apiCars.length > 0 && (
        <AiAdvisor
          cars={apiCars.filter(c => c.isAvailable !== false)}
          hasMoreResults={hasNext}
          onLoadAllResults={loadAllResults}
          days={days}
          startDate={startDate}
          endDate={endDate}
          pickupName={pickupName}
          dropoffName={dropoffName}
          activeFilters={matchedFilterLabels}
          raised={selectedCompareCars.length > 0}
          onEnabledChange={setAiEnabled}
          onViewCar={showCarFromAdvisor}
        />
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <ComparisonModal
            selectedCars={selectedCompareCars}
            onClose={() => setIsCompareModalOpen(false)}
            onRemove={toggleCompare}
            days={days}
            startDate={startDate}
            endDate={endDate}
        />
      )}
    </div>
    </>
  );
};
