import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_IMAGES } from '../constants';
import { loadCars } from '../utils/loadCars';
import CarCard from '../components/CarCard';
import ComparisonModal from '../components/ComparisonModal';
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

const ratingToPercent = (rating: number | undefined) => {
    const safeRating = Number(rating || 4.5);
    return Math.round(Math.max(0, Math.min(100, safeRating > 5 ? safeRating * 10 : safeRating * 20)));
};

const normalizeForMatch = (value: unknown) => (
    String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '')
);

const isBlockedExternalCar = (apiCar: ApiSearchResult) => {
    const supplierName = normalizeForMatch(apiCar.supplier?.name || (apiCar as any).supplierName || (apiCar as any).supplier_name);
    const vendorCode = normalizeForMatch((apiCar as any)._vendorCode || (apiCar as any).vendorCode);
    const carName = normalizeForMatch(apiCar.name || `${apiCar.brand || ''} ${apiCar.model || ''}`);

    return (supplierName.includes('URDRIVEJO') || vendorCode.includes('URDRIVEJO')) && carName.includes('TOYOTACAMRY');
};

const apiCarToCar = (apiCar: ApiSearchResult): Car => {
    const hasFinalPrice = apiCar.finalPrice !== undefined && apiCar.finalPrice !== null;
    const dailyPrice = hasFinalPrice ? apiCar.finalPrice : apiCar.netPrice;
    
    const mappedSupplier: Supplier = {
        id: apiCar.supplierId || `api-supplier-${((apiCar.supplier?.name ?? 'Unknown')).replace(/\s+/g, '-')}`,
        name: apiCar.supplier?.name || apiCar.name || 'Unknown Supplier',
        rating: apiCar.supplier?.rating || 4.5,
        ratingReviewCount: apiCar.supplier?.ratingReviewCount,
        detailedRatings: {
            cleanliness: apiCar.supplier?.ratingCleanliness ?? ratingToPercent(apiCar.supplier?.rating),
            condition: apiCar.supplier?.ratingCondition ?? ratingToPercent(apiCar.supplier?.rating),
            valueForMoney: apiCar.supplier?.ratingValueForMoney ?? ratingToPercent(apiCar.supplier?.rating),
            pickupSpeed: apiCar.supplier?.ratingPickupSpeed ?? ratingToPercent(apiCar.supplier?.rating),
            dropoffSpeed: apiCar.supplier?.ratingDropoffSpeed ?? ratingToPercent(apiCar.supplier?.rating),
            staffService: apiCar.supplier?.ratingStaffService ?? ratingToPercent(apiCar.supplier?.rating),
            easeOfLocating: apiCar.supplier?.ratingEaseOfLocating ?? ratingToPercent(apiCar.supplier?.rating),
        },
        logo: apiCar.supplier?.logoUrl || '',
        commissionType: CommissionType.PAY_AT_DESK,
        commissionValue: 0,
        bookingMode: BookingMode.FREE_SALE,
        status: 'active',
        location: '',
        locations: [],
        contactEmail: 'contact@api.supplier',
        gracePeriodHours: 1,
        minBookingLeadTime: 2,
        termsAndConditions: "Standard terms apply.",
        connectionType: 'api',
        includesCDW: true,
        includesTP: true,
        enableSocialProof: false,
        pickupType: apiCar.supplier?.pickupType as any || apiCar.pickupType as any || PickupType.IN_TERMINAL
    };
    
    const apiRateTier: RateTier = {
        id: `api-tier-${apiCar.id}`,
        name: 'Standard Rate',
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        rates: [{ minDays: 1, maxDays: 99, dailyRate: dailyPrice || 0 }]
    };

    const rawName = apiCar.name || "";
    const parts = rawName.trim().split(" ");
    const inferredMake = parts.length > 0 ? parts[0] : "";
    const inferredModel = parts.length > 1 ? parts.slice(1).join(" ") : "";

    const make = apiCar.brand || inferredMake || "Unknown";
    const model = apiCar.model || inferredModel || "Unknown";

    const displayName = (rawName || `${make} ${model}`.trim() || "Unknown Car").replace(/\s*\([^)]*\)\s*/g, "").trim();
    
    return {
        id: String(apiCar.id),
        make: make,
        model: model,
        displayName: displayName,
        netPrice: apiCar.netPrice,
        commissionPercent: apiCar.commissionPercent,
        commissionAmount: apiCar.commissionAmount,
        finalPrice: apiCar.finalPrice,
        year: apiCar.year || new Date().getFullYear(),
        category: apiCar.category as CarCategory || CarCategory.ECONOMY,
        type: CarType.SEDAN,
        sippCode: apiCar.sippCode || 'XXXX',
        transmission: apiCar.transmission as Transmission || Transmission.AUTOMATIC,
        passengers: apiCar.passengers || 4,
        bags: apiCar.bags || 2,
        doors: apiCar.doors || 4,
        airCon: apiCar.airCon || false,
        image: apiCar.image || '',
        supplier: mappedSupplier,
        features: [],
        fuelPolicy: apiCar.fuelPolicy as FuelPolicy || FuelPolicy.FULL_TO_FULL,
        isAvailable: apiCar.available !== false,
        location: '',
        deposit: apiCar.deposit || 0,
        excess: apiCar.excess || 0,
        stopSales: [],
        rateTiers: [apiRateTier],
        extras: [],
        locationDetail: apiCar.locationDetail || 'In Terminal',
        unlimitedMileage: apiCar.unlimitedMileage || true,
        tags: ["Online Deal"],
        detailedRatings: mappedSupplier.detailedRatings,
        hasFinalPriceFromApi: hasFinalPrice,
        supplierId: apiCar.supplierId,
        currency: apiCar.currency,
        hogicarChoice: apiCar.hogicarChoice,
        promotionAmount: apiCar.promotionAmount,
        promotionPercent: apiCar.promotionPercent,
    };
};

const apiCarsToCars = (data: ApiSearchResult[]): Car[] => {
    const mappedCars = data.filter(apiCar => !isBlockedExternalCar(apiCar)).map(apiCarToCar);
    const finalCars: Car[] = [];

    mappedCars.forEach(car => {
        finalCars.push({ ...car, isHogicarChoiceBranded: false });
        if (car.hogicarChoice && car.supplier.name !== 'Hogi Car Choice') {
            const choiceCar = JSON.parse(JSON.stringify(car));
            choiceCar.id = `choice-${car.id}`;
            choiceCar.supplier.name = 'Hogi Car Choice';
            choiceCar.supplier.logo = 'HOGICAR_CHOICE_LOGO';
            choiceCar.isHogicarChoiceBranded = true;
            finalCars.push(choiceCar);
        }
    });

    return finalCars;
};

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
        sort: sortBy,
        categories: selectedCategories,
        suppliers: selectedSuppliers,
        transmissions: selectedTransmissions,
        fuelPolicies: selectedFuelPolicies,
        passengers: passengerCapacity,
        maxPrice: priceRange
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
    }
  }, [
    searchPrefetchParams, sortBy, selectedCategories, selectedSuppliers, 
    selectedTransmissions, selectedFuelPolicies, passengerCapacity, priceRange, page, apiCars.length
  ]);

  useEffect(() => {
    fetchApiCars(false);
  }, [
    searchParamsString, 
    sortBy, 
    selectedCategories, 
    selectedSuppliers, 
    selectedTransmissions, 
    selectedFuelPolicies, 
    passengerCapacity, 
    priceRange
  ]);

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
      {/* Search summary */}
      <div className="z-30 border-b border-slate-200 bg-white md:sticky md:top-[72px]">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent sm:flex">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{location || 'Select location'}</p>
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {startDateTimeDisplay.replace(' • ', ', ')} – {endDateTimeDisplay.replace(' • ', ', ')}
                  <span className="hidden sm:inline"> · {days} day{days > 1 ? 's' : ''}</span>
                  {dropoffIata && dropoffIata !== pickupIata && <span className="hidden sm:inline"> · Return to {dropoffName || dropoffIata}</span>}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-expanded={isSearchOpen}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-accent hover:text-accent sm:px-4"
            >
              {isSearchOpen ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              <span>{isSearchOpen ? 'Close' : 'Edit search'}</span>
            </button>
          </div>

          {isSearchOpen && (
            <div className="mt-3 animate-fadeIn">
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
        {/* Car categories */}
        <div className="pt-4 sm:pt-6">
          <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
            {categoryOrder.map(category => {
              const isActive = selectedCategories.includes(category);
              const summary = categorySummaries.get(category);
              const count = summary?.count || filterCounts.category.get(category) || 0;
              const hasCars = count > 0;
              const categoryImage =
                categoryImages[category] ||
                categoryImages[category.toUpperCase()] ||
                (CATEGORY_IMAGES as Record<string, string>)[category];
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  disabled={!hasCars}
                  aria-pressed={isActive}
                  className={`relative flex w-[132px] shrink-0 snap-start flex-col items-center rounded-xl border px-2 pb-2.5 pt-2 text-center transition-colors sm:w-[148px] ${
                    isActive
                      ? 'border-accent bg-accent-50 ring-1 ring-accent'
                      : hasCars
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'cursor-not-allowed border-slate-200 bg-white opacity-50'
                  }`}
                >
                  <div className="flex h-14 w-full items-center justify-center">
                    <img
                      src={categoryImage}
                      alt=""
                      className="max-h-14 w-full object-contain"
                      loading="lazy"
                      decoding="async"
                      width="120"
                      height="56"
                    />
                  </div>
                  <span className={`mt-1 block w-full truncate text-sm font-semibold ${isActive ? 'text-accent-800' : 'text-slate-900'}`}>{formatCategoryName(category)}</span>
                  <span className="block text-xs text-slate-500">
                    {summary?.fromTotal != null ? <>from <span className="font-semibold text-slate-900">{getCurrencySymbol()}{convertPrice(summary.fromTotal).toFixed(0)}</span></> : 'Unavailable'}
                  </span>
                  {isActive && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile filter & sort controls */}
        <div className="sticky top-[72px] z-20 -mx-4 mt-3 grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => { setShowMobileSort(false); setShowMobileFilters(true); }}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-xs text-white">{activeFilterCount}</span>
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
                  {activeFilterCount > 0 && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent">{activeFilterCount}</span>}
                </h2>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
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
                      <span className="font-semibold text-slate-900">{getCurrencySymbol()}{convertPrice(priceRange).toFixed(0)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
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
                    {allLocationTypes.map(type => checkboxRow(type, selectedLocationTypes.includes(type), () => handleLocationTypeChange(type), type, filterCounts.locationType.get(type) || 0))}
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

                <div className="space-y-3">
                  {sortedAndFilteredCars.map(car => (
                    <CarCard
                      key={car.id}
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
                    />
                  ))}

                  {sortedAndFilteredCars.length === 0 && !loading && (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
                      <CarIcon className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-900">No cars match your filters</h3>
                      <p className="mt-1 text-sm text-slate-500">Try removing some filters or changing your dates.</p>
                      {activeFilterCount > 0 && (
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
