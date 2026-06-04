import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPublicSuppliers } from '../api';
import { MOCK_CARS, MOCK_CATEGORY_IMAGES, MOCK_CAR_LIBRARY, SUPPLIERS } from '../services/mockData';
import { loadCars } from '../utils/loadCars';
import CarCard from '../components/CarCard';
import ComparisonModal from '../components/ComparisonModal';
import { SlidersHorizontal, ChevronDown, ChevronUp, Filter, ArrowUpDown, Car as CarIcon, Truck, Gem, Users, Gift, CreditCard, Shield, MapPin, Check, Edit, Calendar, ArrowRight, AlertCircle, X, ArrowLeftRight, Sparkles, Search as SearchIcon } from 'lucide-react';
import { CarCategory, Car, Transmission, FuelPolicy, CommissionType, ApiSearchResult, Supplier, BookingMode, CarType, RateTier, PickupType } from '../types';
import { calculatePrice } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { API_BASE_URL } from '../lib/config';
import { Logo } from '../components/Logo';

const apiCarToCar = (apiCar: ApiSearchResult): Car => {
    const hasFinalPrice = apiCar.finalPrice !== undefined && apiCar.finalPrice !== null;
    const dailyPrice = hasFinalPrice ? apiCar.finalPrice : apiCar.netPrice;
    
    const mockSupplier = SUPPLIERS.find(s => s.name.toLowerCase() === (apiCar.supplier?.name ?? "").toLowerCase());

    const mappedSupplier: Supplier = {
        id: mockSupplier?.id || `api-supplier-${((apiCar.supplier?.name ?? 'Unknown')).replace(/\s+/g, '-')}`,
        name: apiCar.supplier?.name ?? 'Unknown Supplier',
        rating: apiCar.supplier?.rating || 4.5,
        logo: apiCar.supplier?.logoUrl || '',
        commissionType: mockSupplier?.commissionType || CommissionType.PAY_AT_DESK,
        commissionValue: mockSupplier?.commissionValue || 0,
        bookingMode: mockSupplier?.bookingMode || BookingMode.FREE_SALE,
        status: 'active',
        location: '',
        locations: [],
        contactEmail: mockSupplier?.contactEmail || 'contact@api.supplier',
        gracePeriodHours: mockSupplier?.gracePeriodHours || 1,
        minBookingLeadTime: mockSupplier?.minBookingLeadTime || 2,
        termsAndConditions: mockSupplier?.termsAndConditions || "Standard terms apply.",
        connectionType: 'api',
        includesCDW: mockSupplier?.includesCDW ?? true,
        includesTP: mockSupplier?.includesTP ?? true,
        oneWayFee: mockSupplier?.oneWayFee,
        enableSocialProof: mockSupplier?.enableSocialProof ?? false,
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
        type: MOCK_CAR_LIBRARY.find(m => m.category === apiCar.category)?.type || CarType.SEDAN,
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
        detailedRatings: {
            cleanliness: 90,
            condition: 90,
            valueForMoney: 90,
            pickupSpeed: 90,
            staffService: 90,
        },
        hasFinalPriceFromApi: hasFinalPrice,
        supplierId: apiCar.supplierId,
        currency: apiCar.currency,
        hogicarChoice: apiCar.hogicarChoice,
        promotionAmount: apiCar.promotionAmount,
        promotionPercent: apiCar.promotionPercent,
    };
};

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata;
  const location = pickupName;
  const pickupDateParam = searchParams.get('pickupDate');
  const dropoffDateParam = searchParams.get('dropoffDate');
  const startTimeParam = searchParams.get('startTime');
  const endTimeParam = searchParams.get('endTime');
  const dropoffIata = searchParams.get('dropoff');
  const dropoffName = searchParams.get('dropoffName');
  
  const [apiCars, setApiCars] = React.useState<Car[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { convertPrice, getCurrencySymbol } = useCurrency();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(new Date().setDate(today.getDate() + 3)).toISOString().split('T')[0];

  const startDate = pickupDateParam || defaultStart;
  const endDate = dropoffDateParam || defaultEnd;

  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  
  React.useEffect(() => {
    const fetchApiCars = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loadCars({
                locationsOptions: [],
                pickupCode: pickupIata,
                dropoffCode: dropoffIata || pickupIata,
                pickupDate: startDate,
                dropoffDate: endDate,
            });
            const mappedCars = data.map(apiCarToCar);
            setApiCars(mappedCars);
        } catch (err) {
            console.error("Failed to fetch search results:", err);
            setError("We couldn't retrieve car results at the moment. Please try again later.");
            setApiCars([]);
        } finally {
            setLoading(false);
        }
    };

    fetchApiCars();
  }, [searchParams]);

  const formatDateTime = (date: Date, time: string) => {
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • ${time}`;
  };
  const startDateTimeDisplay = formatDateTime(startD, startTimeParam || '10:00');
  const endDateTimeDisplay = formatDateTime(endD, endTimeParam || '10:00');

  // Filter States
  const [priceRange, setPriceRange] = React.useState(5000);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = React.useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = React.useState<string[]>([]);
  const [selectedFuelPolicies, setSelectedFuelPolicies] = React.useState<string[]>([]);
  const [passengerCapacity, setPassengerCapacity] = React.useState<number>(0);
  const [sortBy, setSortBy] = React.useState('Recommended');
  const [openFilters, setOpenFilters] = React.useState<string[]>([
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
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [showMobileSort, setShowMobileSort] = React.useState(false);
  
  const [selectedPaymentTypes, setSelectedPaymentTypes] = React.useState<string[]>([]);
  const [maxDeposit, setMaxDeposit] = React.useState<number>(0);
  const [selectedLocationTypes, setSelectedLocationTypes] = React.useState<string[]>([]);
  const [specialOffersOnly, setSpecialOffersOnly] = React.useState<boolean>(false);
  const [allLocationSuppliers, setAllLocationSuppliers] = React.useState<any[]>([]);
  const [categoryImages, setCategoryImages] = React.useState<Record<string, string>>(MOCK_CATEGORY_IMAGES as Record<string, string>);
  const [selectedCompareCars, setSelectedCompareCars] = React.useState<Car[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);
  const [isCompareMode, setIsCompareMode] = React.useState(false);

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
          setCategoryImages({ ...(MOCK_CATEGORY_IMAGES as Record<string, string>), ...normalizedImages });
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

  const filterCounts = React.useMemo(() => {
    const counts = {
      category: new Map<string, number>(),
      supplier: new Map<string, number>(),
      transmission: new Map<string, number>(),
      fuelPolicy: new Map<string, number>(),
      paymentType: new Map<string, number>(),
      locationType: new Map<string, number>(),
    };

    baseFilteredCars.forEach(car => {
        counts.category.set(car.category, (counts.category.get(car.category) || 0) + 1);
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
  }, [baseFilteredCars]);

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
  
  const categoryOrder = [CarCategory.MINI, CarCategory.ECONOMY, CarCategory.COMPACT, CarCategory.MIDSIZE, CarCategory.FULLSIZE, CarCategory.SUV, CarCategory.LUXURY, CarCategory.PEOPLE_CARRIER];
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

  return (
    <>
    <SEOMetadata
        title={`Car Hire in ${location || 'Top Destinations'} | Hogicar`}
        description={`Find the best car rental deals in ${location}. Compare prices from top suppliers like Hertz, Avis, and more.`}
    />
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Search Header */}
      <div className="bg-[#0b3f95] shadow-lg border-b border-blue-950/30 md:sticky md:top-[80px] z-30">
        <div className="mx-auto max-w-[3840px] px-2 py-1.5 sm:px-6 sm:py-3 lg:px-8 2xl:px-10">
            <div className="rounded-xl border border-white/10 bg-slate-950/30 px-2.5 py-2 shadow-[0_14px_34px_-30px_rgba(0,0,0,0.85)] sm:px-3 md:bg-transparent md:border-transparent md:shadow-none">
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">{location || 'Select Location'}</p>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                      {pickupIata || 'Pickup'} to {dropoffIata || pickupIata || 'Dropoff'} · {days} day{days > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#008009] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-md shadow-[#008009]/20 active:scale-[0.98]"
                  >
                    <Edit className="h-3 w-3" />
                    <span>{isSearchOpen ? 'Close' : 'Modify'}</span>
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[#00a30b]" />
                  <p className="min-w-0 truncate text-[10px] font-black text-white">
                    {startDateTimeDisplay} - {endDateTimeDisplay}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-5 md:grid md:grid-cols-[220px_minmax(360px,760px)_auto] lg:grid-cols-[260px_minmax(420px,820px)_auto] 2xl:grid-cols-[320px_minmax(520px,940px)_auto]">
                <div className="flex min-w-0 items-center">
                  <Logo variant="light" className="h-12 w-[190px] max-w-full lg:h-14 lg:w-[220px]" />
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="group mx-auto flex w-full min-w-0 items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3 text-left shadow-xl shadow-blue-950/20 ring-1 ring-white/70 transition hover:shadow-2xl active:scale-[0.99]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b3f95]">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950 2xl:text-lg">{location || 'Select pickup location'}</p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-black text-slate-500 2xl:text-sm">
                        <span className="truncate">{startDateTimeDisplay}</span>
                        <span className="text-slate-300">-</span>
                        <span className="truncate">{endDateTimeDisplay}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:inline-flex">
                      {days} day{days > 1 ? 's' : ''}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b3f95] text-white transition group-hover:bg-[#008009]">
                      <SearchIcon className="h-5 w-5" />
                    </span>
                  </div>
                </button>

                <div className="flex items-center justify-end gap-3">
                  <div className="hidden rounded-xl border border-white/10 bg-white/10 px-3 py-2 xl:block">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Results</p>
                    <p className="text-sm font-black text-white">{sortedAndFilteredCars.length} cars</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#008009] px-5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#006607] active:scale-[0.98]"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>{isSearchOpen ? 'Close' : 'Modify'}</span>
                  </button>
                </div>
              </div>
            </div>

            {isSearchOpen && (
                <div className="mt-3 animate-fadeIn rounded-2xl border border-white/10 bg-slate-950/25 p-3">
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
      

      <div className="hidden md:block bg-white border-b border-slate-200 py-6">
          <div className="mx-auto max-w-[3840px] px-4 sm:px-6 lg:px-8 2xl:px-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2"><CarIcon className="w-5 h-5 text-[#008009]"/> Filter by Category</h2>
                  <p className="text-xs font-bold text-slate-500">Select a vehicle class to quickly narrow down your options.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
                    <span className="text-xs text-slate-500 font-bold">Sort by:</span>
                    <div className="relative">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-sm text-slate-700 font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#008009] cursor-pointer hover:border-slate-300"
                        >
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
              </div>
              <div className="flex overflow-x-auto no-scrollbar md:flex md:flex-wrap md:justify-center gap-3 sm:gap-4 lg:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
                  {categoryOrder.map(category => {
                      const isActive = selectedCategories.includes(category);
                      const count = filterCounts.category.get(category) || 0;
                      const isDisabled = false;
                      const categoryImage =
                        categoryImages[category] ||
                        categoryImages[category.toUpperCase()] ||
                        (MOCK_CATEGORY_IMAGES as Record<string, string>)[category];
                      return (
                          <button
                              key={category}
                              onClick={() => handleCategoryToggle(category)}
                              disabled={isDisabled}
                              className={`flex-shrink-0 w-16 sm:w-20 md:w-28 lg:w-32 flex flex-col items-center gap-1 group transition-all duration-300 relative ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                              {isActive && (
                                  <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#008009] rounded-full flex items-center justify-center text-white border-2 border-white z-10 shadow">
                                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </div>
                              )}
                              <div className={`w-full aspect-[4/3] rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 border-2 shadow-sm
                                  ${isActive
                                      ? 'border-[#008009] shadow-lg shadow-[#008009]/30 ring-2 ring-emerald-50'
                                      : 'border-slate-200 bg-slate-50 group-hover:border-[#008009]/40 group-hover:shadow-md group-hover:-translate-y-0.5'}`}>
                                  <img src={categoryImage} alt={category} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" width="100" height="100" />
                              </div>
                              <div className="text-center leading-tight">
                                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight transition-colors duration-300 ${isActive ? 'text-[#008009]' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                      {category}
                                  </span>
                                  <span className={`block text-[9px] font-bold ${isActive ? 'text-[#008009]/70' : 'text-slate-400'}`}>({count} cars)</span>
                              </div>
                          </button>
                      )
                  })}
              </div>
          </div>
      </div>

      <div className="mx-auto max-w-[3840px] px-3 pt-0 sm:px-6 lg:px-8 2xl:px-10 md:pt-5">
        
        {/* Mobile Filter & Sort Controls */}
        <div className="md:hidden my-2 bg-white/95 backdrop-blur p-1.5 border border-slate-200 rounded-xl sticky top-2 z-20 grid grid-cols-2 gap-1.5 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.7)]">
            <button 
                onClick={() => {
                    setShowMobileSort(false);
                    setShowMobileFilters(true);
                }}
                className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2.5 rounded-lg font-black text-[11px] shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50"
            >
                <SlidersHorizontal className="w-4 h-4 text-[#008009]" />
                <span>Filters</span>
                { activeFilterCount > 0 && (
                    <span className="bg-[#008009] text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                        {activeFilterCount}
                    </span>
                )}
            </button>
            <button 
                onClick={() => {
                    setShowMobileFilters(false);
                    setShowMobileSort(true);
                }}
                className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2.5 rounded-lg font-black text-[11px] shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50 min-w-0"
            >
                {sortBy === 'Recommended' ? (
                    <Gem className="w-4 h-4 text-[#008009]" />
                ) : (
                    <ArrowUpDown className="w-4 h-4 text-[#008009]" />
                )}
                <span className="truncate">{sortBy}</span>
            </button>
        </div>

        <div className="flex flex-col md:flex-row gap-5 lg:gap-7 items-start">
          
          {/* Filters Sidebar / Mobile Pop-up */}
          <div className={`
            fixed inset-0 z-[100] md:relative md:inset-auto md:z-0
            ${showMobileFilters ? 'flex' : 'hidden md:block'} 
            w-full md:w-[270px] lg:w-[300px] flex-shrink-0
          `}>
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
              onClick={() => setShowMobileFilters(false)}
            />

            <aside className={`
              relative bg-white w-full h-[90vh] mt-auto rounded-t-[28px] shadow-2xl flex flex-col
              md:h-auto md:mt-0 md:rounded-2xl md:shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)] md:border md:border-slate-200
              overflow-hidden md:overflow-visible transition-transform duration-500 ease-out
              ${showMobileFilters ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            `}>
              <div className="flex items-center justify-between p-5 md:p-4 border-b border-slate-100 md:bg-slate-950 md:text-white md:rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 md:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                      <SlidersHorizontal className="w-4 h-4 text-[#008009]" /> Filters
                    </h3>
                    {showMobileFilters && (
                        <span className="md:hidden bg-emerald-50 text-[#008009] text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {activeFilterCount} active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button 
                      onClick={handleResetFilters}
                      className="text-[10px] text-[#008009] md:text-emerald-300 font-black hover:underline uppercase tracking-widest"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setShowMobileFilters(false)}
                      className="md:hidden p-2 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 overflow-y-auto md:overflow-visible flex-1 md:flex-none custom-scrollbar pb-24 md:pb-0">
                  <div className="p-4 md:p-3 bg-emerald-50/60 md:bg-white">
                      <label className="flex items-center cursor-pointer hover:bg-white md:hover:bg-slate-50 p-2 rounded-xl -ml-1 border border-emerald-100 md:border-transparent">
                          <input type="checkbox" checked={specialOffersOnly} onChange={(e) => setSpecialOffersOnly(e.target.checked)} className="rounded w-4 h-4 text-[#008009] shadow-sm focus:border-[#008009] focus:ring focus:ring-[#008009] focus:ring-opacity-50" />
                          <span className="ml-2 text-xs text-slate-600 font-medium">Special Offers Only</span>
                          <Gift className="w-4 h-4 text-red-500 ml-auto" />
                      </label>
                  </div>

                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Price')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Price per Day</span>
                          {openFilters.includes('Price') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Price') && (
                          <div className="mt-3 px-1">
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                                  <span>{getCurrencySymbol()}0</span>
                                  <span className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{getCurrencySymbol()}{convertPrice(priceRange).toFixed(0)}</span>
                              </div>
                              <input 
                                  type="range" 
                                  min="0" 
                                  max="5000" 
                                  value={priceRange} 
                                  onChange={(e) => setPriceRange(Number(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#008009]"
                              />
                          </div>
                      )}
                  </div>

                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Category')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Car Category</span>
                          {openFilters.includes('Category') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Category') && (
                          <div className="mt-2 space-y-1.5">
                              {allCategories.map((type) => (
                                  <label key={type} className={`flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1`}>
                                      <input 
                                          type="checkbox" 
                                          checked={selectedCategories.includes(type)}
                                          onChange={() => handleCategoryToggle(type)}
                                          className="rounded border-gray-300 text-[#008009] shadow-sm focus:border-[#008009] focus:ring focus:ring-[#008009] focus:ring-opacity-50 w-4 h-4" 
                                      />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.category.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Passengers')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Number of seats</span>
                          {openFilters.includes('Passengers') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Passengers') && (
                          <div className="mt-2 grid grid-cols-4 gap-2">
                              {[2, 4, 5, 7].map(num => (
                                  <button key={num} onClick={() => setPassengerCapacity(passengerCapacity === num ? 0 : num)} className={`p-2 border rounded-md text-xs font-bold transition-colors ${passengerCapacity === num ? 'bg-[#008009] text-white border-[#008009]' : 'bg-white text-slate-700 border-slate-200 hover:border-[#008009]'}`}>
                                      {num}{num === 7 ? '+' : ''}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Payment')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Payment Type</span>
                          {openFilters.includes('Payment') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Payment') && (
                          <div className="mt-2 space-y-1.5">
                              {allPaymentTypes.map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedPaymentTypes.includes(type)} onChange={() => handlePaymentTypeChange(type)} className="rounded w-4 h-4 text-[#008009]" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{paymentTypeMapping[type as CommissionType]}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.paymentType.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Deposit')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Refundable Security Deposit</span>
                          {openFilters.includes('Deposit') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Deposit') && (
                          <div className="mt-2 space-y-1.5">
                              {[0, 300, 500].map((amount) => (
                                  <label key={amount} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="radio" name="deposit" checked={maxDeposit === amount} onChange={() => setMaxDeposit(amount)} className="w-4 h-4 text-[#008009] focus:ring-[#008009]" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{amount === 0 ? 'Any amount' : `Less than ${getCurrencySymbol()}${convertPrice(amount).toFixed(0)}`}</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('LocationType')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Location Type</span>
                          {openFilters.includes('LocationType') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('LocationType') && (
                          <div className="mt-2 space-y-1.5">
                              {allLocationTypes.map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedLocationTypes.includes(type)} onChange={() => handleLocationTypeChange(type)} className="rounded w-4 h-4 text-[#008009]" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.locationType.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Transmission')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Transmission</span>
                          {openFilters.includes('Transmission') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Transmission') && (
                          <div className="mt-2 space-y-1.5">
                              {allTransmissions.map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedTransmissions.includes(type)} onChange={() => handleTransmissionChange(type)} className="rounded w-4 h-4 text-[#008009]" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.transmission.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Fuel')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Fuel Policy</span>
                          {openFilters.includes('Fuel') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Fuel') && (
                          <div className="mt-2 space-y-1.5">
                              {allFuelPolicies.map((policy) => (
                                  <label key={policy} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedFuelPolicies.includes(policy)} onChange={() => handleFuelPolicyChange(policy)} className="rounded w-4 h-4 text-[#008009]" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{policy}</span>
                                       <span className="ml-auto text-[10px] text-slate-400">({filterCounts.fuelPolicy.get(policy) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4 md:p-3">
                      <button onClick={() => toggleFilterSection('Supplier')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#008009] uppercase tracking-wide">Suppliers in {pickupIata || location}</span>
                          {openFilters.includes('Supplier') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Supplier') && (
                          <div className="mt-2 space-y-1.5">
                              {allSuppliers.length === 0 && (
                                  <p className="text-[10px] text-slate-400 italic">No suppliers found for this search.</p>
                              )}
                              {allSuppliers.map((name) => (
                                  <label key={name} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedSuppliers.includes(name)} onChange={() => handleSupplierChange(name)} className="rounded w-4 h-4 text-[#008009]" />
                                      {supplierLogos.get(name) && (
                                         <img src={supplierLogos.get(name)} alt={name} className="w-10 h-8 ml-2 object-contain" width="40" height="32" />
                                     )}
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{name}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.supplier.get(name) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              <div className="p-4 border-t border-slate-100 md:hidden bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] absolute bottom-0 left-0 right-0 z-10">
                  <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-[#008009] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-[#008009]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Show {sortedAndFilteredCars.length} results
                  </button>
              </div>
            </aside>
          </div>

          {/* Mobile Sorting Pop-up */}
          <div className={`
            fixed inset-0 z-[110] md:hidden
            ${showMobileSort ? 'flex' : 'hidden'} 
            w-full flex-col
          `}>
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowMobileSort(false)}
            />

            <aside className={`
              relative bg-white w-full mt-auto rounded-t-[32px] shadow-2xl flex flex-col
              overflow-hidden transition-transform duration-500 ease-out
              ${showMobileSort ? 'translate-y-0' : 'translate-y-full'}
            `}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <ArrowUpDown className="w-4 h-4 text-[#008009]" /> Sort By
                </h3>
                <button 
                  onClick={() => setShowMobileSort(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3 pb-12">
                {[
                  { label: 'Recommended', icon: <Gem className="w-4 h-4" /> },
                  { label: 'Price: Low to High', icon: <ArrowUpDown className="w-4 h-4 rotate-180" /> },
                  { label: 'Price: High to Low', icon: <ArrowUpDown className="w-4 h-4" /> }
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      setSortBy(option.label);
                      setShowMobileSort(false);
                    }}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${
                      sortBy === option.label 
                        ? 'bg-[#008009] border-2 border-[#008009] text-white shadow-lg shadow-emerald-200' 
                        : 'bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${sortBy === option.label ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            {React.cloneElement(option.icon as React.ReactElement<any>, { 
                                className: `w-4 h-4 ${sortBy === option.label ? 'text-white' : 'text-[#008009]'}` 
                            })}
                        </div>
                        <span className="font-bold text-sm">{option.label}</span>
                    </div>
                    {sortBy === option.label && <div className="bg-white rounded-full p-1"><Check className="w-3 h-3 text-[#008009]" /></div>}
                  </button>
                ))}
              </div>
            </aside>
          </div>
          
          {/* Results List */}
          <main className="flex-grow w-full">
            {loading ? (
              <div className="text-center py-20 px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 font-semibold text-slate-700">Finding the best deals for you...</p>
              </div>
            ) : error ? (
              <div className="text-center bg-white rounded-lg shadow-sm border border-red-200 py-12 px-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Something went wrong</h3>
                  <p className="text-sm text-slate-500 mt-2">{error}</p>
              </div>
            ) : (
                <>
                <div className="flex items-center justify-between gap-3 mb-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-4">
                    <div className="min-w-0">
                      <p className="text-base md:text-sm text-slate-900 font-black uppercase tracking-tight md:tracking-wide">
                          <span className="text-[#008009]">{sortedAndFilteredCars.length}</span> cars available
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold mt-1">
                        {pickupIata || location || 'Selected location'} • {days} day{days > 1 ? 's' : ''} • {sortBy}
                      </p>
                    </div>
                    <div className="flex max-[420px]:hidden items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest text-right rounded-full bg-emerald-50 px-3 py-1.5">
                        <Check className="w-3 h-3 text-[#008009]" /> Taxes & fees included
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:gap-3 px-0">
                    {sortedAndFilteredCars.map(car => (
                        <CarCard 
                            key={car.id} 
                            car={car}
                            cars={sortedAndFilteredCars}
                            days={days}
                            startDate={startDate}
                            endDate={endDate}
                            pickupCode={pickupIata}
                            dropoffCode={dropoffIata || pickupIata}
                            isComparing={selectedCompareCars.some(c => c.id === car.id)}
                            showCompareControl
                            showMobileCompareControl={isCompareMode || selectedCompareCars.some(c => c.id === car.id)}
                            onCompareToggle={() => toggleCompare(car)}
                        />
                    ))}
                    {sortedAndFilteredCars.length === 0 && (
                         <div className="col-span-full text-center bg-white rounded-lg shadow-sm border border-slate-200 py-12 px-6">
                            <CarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">No cars found</h3>
                            <p className="text-sm text-slate-500 mt-2">Try adjusting your filters, or use dates where supplier rates are available.</p>
                            <p className="text-xs text-slate-400 mt-2">Location: {pickupIata || 'N/A'} • {startDate} to {endDate}</p>
                        </div>
                    )}
                </div>
                </>
            )}
          </main>
        </div>
      </div>
      
      {/* Smart Comparison Bar */}
      {selectedCompareCars.length === 0 && sortedAndFilteredCars.length > 0 && (
        <>
        <div className="fixed bottom-4 left-1/2 z-[100] w-[94%] max-w-5xl -translate-x-1/2 animate-in slide-in-from-bottom-8 duration-700 md:hidden">
            <button
                onClick={() => setIsCompareMode(prev => !prev)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 text-left text-slate-950 shadow-[0_22px_58px_-30px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/5 backdrop-blur-2xl sm:rounded-3xl sm:px-6"
                aria-pressed={isCompareMode}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <Sparkles className="h-6 w-6 shrink-0 text-slate-950" />
                    <div className="min-w-0">
                        <p className="text-lg font-black leading-tight text-slate-950 sm:text-xl">Smart comparison</p>
                        <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">Compare prices, specs, ratings and more</p>
                    </div>
                </div>
                <span className={`relative flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${isCompareMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${isCompareMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </span>
            </button>
        </div>
        </>
      )}

      {selectedCompareCars.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-[100] w-[94%] max-w-5xl -translate-x-1/2 animate-in slide-in-from-bottom-8 duration-700 sm:bottom-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-3 text-slate-950 shadow-[0_26px_70px_-28px_rgba(15,23,42,0.65)] ring-1 ring-slate-900/5 backdrop-blur-2xl sm:rounded-3xl sm:p-4">
                <div 
                    className="absolute bottom-0 left-0 h-1 bg-[#008009] transition-all duration-500 ease-out"
                    style={{ width: `${(selectedCompareCars.length / 4) * 100}%` }}
                />
              
                <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#008009] text-white shadow-[0_16px_32px_-18px_rgba(0,128,9,0.9)] sm:flex">
                            <ArrowLeftRight className="h-5 w-5 stroke-[2.5px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-950 md:text-base">Compare your choices</p>
                            <p className="mt-1 hidden text-xs font-semibold text-slate-500 sm:block">Review prices, deposits, excess, specs and supplier policies side by side.</p>
                            <div className="mt-2 flex items-center gap-2 sm:mt-2.5">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`h-1.5 w-5 rounded-full transition-colors ${i <= selectedCompareCars.length ? 'bg-[#008009]' : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{selectedCompareCars.length}/4 choices</span>
                            </div>
                        </div>
                    </div>
                  
                    <div className="flex items-center justify-between gap-3 md:shrink-0 md:justify-end md:gap-6">
                        <div className="flex min-w-0 -space-x-2 sm:-space-x-3">
                            {selectedCompareCars.map(car => (
                                <div key={car.id} className="relative group/comp">
                                    <div className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-slate-50 p-1.5 shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:ring-[#008009]/40 sm:h-14 sm:w-14 md:h-16 md:w-16">
                                        <img src={car.image} alt={car.model} className="w-full h-full object-contain drop-shadow-md" />
                                    </div>
                                    <button 
                                        onClick={() => toggleCompare(car)}
                                        className="absolute -right-1 -top-1 z-30 rounded-full border-2 border-white bg-slate-950 p-1.5 text-white opacity-100 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-red-600 active:scale-90 sm:opacity-0 sm:group-hover/comp:opacity-100"
                                        aria-label={`Remove ${car.model} from comparison choices`}
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            ))}
                            {Array.from({ length: 4 - selectedCompareCars.length }).map((_, i) => (
                                <div key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 sm:h-14 sm:w-14 md:h-16 md:w-16">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                </div>
                            ))}
                        </div>
                      
                        <button 
                            disabled={selectedCompareCars.length < 2}
                            onClick={() => setIsCompareModalOpen(true)}
                            className={`
                                relative group/btn min-h-12 shrink-0 overflow-hidden rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[0.16em] transition-all duration-300 sm:rounded-2xl sm:px-7 md:px-9
                                ${selectedCompareCars.length >= 2 
                                    ? 'bg-[#008009] text-white shadow-[0_18px_38px_-18px_rgba(0,128,9,0.8)] hover:bg-slate-950 active:scale-95' 
                                    : 'cursor-not-allowed bg-slate-100 text-slate-400'}
                            `}
                        >
                            <span className="relative z-10">{selectedCompareCars.length < 2 ? 'Add 1 more' : 'Compare'}</span>
                            {selectedCompareCars.length >= 2 && (
                                <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                            )}
                        </button>
                    </div>
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
