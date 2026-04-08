import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPublicSuppliers } from '../api';
import { MOCK_CARS, MOCK_CATEGORY_IMAGES, MOCK_CAR_LIBRARY, SUPPLIERS } from '../services/mockData';
import { loadCars } from '../utils/loadCars';
import CarCard from '../components/CarCard';
import { SlidersHorizontal, ChevronDown, ChevronUp, Filter, ArrowUpDown, Car as CarIcon, Truck, Gem, Users, Gift, CreditCard, Shield, MapPin, Check, Edit, Calendar, ArrowRight, AlertCircle, X } from 'lucide-react';
import { CarCategory, Car, Transmission, FuelPolicy, CommissionType, ApiSearchResult, Supplier, BookingMode, CarType, RateTier, PickupType } from '../types';
import { calculatePrice } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { API_BASE_URL } from '../lib/config';

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
        location: 'API Location',
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
        name: 'API Rate',
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
        location: 'API Result',
        deposit: apiCar.deposit || 0,
        excess: 1000,
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
        },
        hasFinalPriceFromApi: hasFinalPrice,
        supplierId: apiCar.supplierId,
        currency: apiCar.currency,
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
  const [openFilters, setOpenFilters] = React.useState<string[]>(['Price', 'Category', 'Passengers', 'LocationType', 'Supplier']);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [showMobileSort, setShowMobileSort] = React.useState(false);
  
  const [selectedPaymentTypes, setSelectedPaymentTypes] = React.useState<string[]>([]);
  const [maxDeposit, setMaxDeposit] = React.useState<number>(0);
  const [selectedLocationTypes, setSelectedLocationTypes] = React.useState<string[]>([]);
  const [specialOffersOnly, setSpecialOffersOnly] = React.useState<boolean>(false);
  const [allLocationSuppliers, setAllLocationSuppliers] = React.useState<any[]>([]);
  const [categoryImages, setCategoryImages] = React.useState<Record<string, string>>(MOCK_CATEGORY_IMAGES as Record<string, string>);

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

  const allCategories = Object.values(CarCategory);
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
  
  const categoryOrder = [CarCategory.MINI, CarCategory.ECONOMY, CarCategory.COMPACT, CarCategory.MIDSIZE, CarCategory.INTERMEDIATE, CarCategory.FULLSIZE, CarCategory.SUV, CarCategory.LUXURY, CarCategory.PEOPLE_CARRIER];

  return (
    <>
    <SEOMetadata
        title={`Car Hire in ${location || 'Top Destinations'} | Hogicar`}
        description={`Find the best car rental deals in ${location}. Compare prices from top suppliers like Hertz, Avis, and more.`}
    />
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Search Header */}
      <div className="bg-slate-900 shadow-xl border-b border-slate-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex justify-between items-center cursor-pointer group bg-slate-800 hover:bg-slate-700 transition-all duration-300 p-2 sm:p-3 rounded-2xl border border-slate-700 hover:border-blue-500/50 shadow-inner"
            >
              <div className="flex-grow grid grid-cols-2 gap-x-2 sm:gap-x-6 items-center">
                <div className="flex items-center gap-2 sm:gap-3 px-2">
                  <div className="bg-blue-500/10 p-2 rounded-xl flex-shrink-0 border border-blue-500/20"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400"/></div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Location</p>
                    <p className="font-bold text-xs sm:text-base text-white truncate group-hover:text-blue-300 transition-colors">{location || 'Select Location'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 px-2 border-l border-slate-700">
                  <div className="bg-blue-500/10 p-2 rounded-xl flex-shrink-0 border border-blue-500/20"><Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400"/></div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Dates & Times</p>
                    <div className="font-bold text-[10px] sm:text-sm text-white group-hover:text-blue-300 transition-colors flex items-center flex-wrap gap-x-1">
                      <span className="truncate">{startDateTimeDisplay}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{endDateTimeDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-2 sm:ml-4 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm py-2 px-3 sm:py-3 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Modify</span>
                  </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup</p>
                <p className="text-xs font-black text-white truncate">{pickupIata || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dropoff</p>
                <p className="text-xs font-black text-white truncate">{dropoffIata || pickupIata || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rental Duration</p>
                <p className="text-xs font-black text-white">{days} day{days > 1 ? 's' : ''}</p>
              </div>
              <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suppliers</p>
                <p className="text-xs font-black text-white">{allSuppliers.length}</p>
              </div>
            </div>

            {isSearchOpen && (
                <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn">
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
      

      {/* Category Image Filter - HIDDEN ON MOBILE, visible on md screens and up */}
      <div className="hidden md:block bg-white border-b border-slate-200 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2"><CarIcon className="w-5 h-5 text-blue-600"/> Filter by Category</h2>
                  <p className="text-xs font-bold text-slate-500">Select a vehicle class to quickly narrow down your options.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
                    <span className="text-xs text-slate-500 font-bold">Sort by:</span>
                    <div className="relative">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-sm text-slate-700 font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-slate-300"
                        >
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
              </div>
              <div className="flex overflow-x-auto no-scrollbar md:grid md:grid-cols-7 lg:grid-cols-9 md:gap-2 -mx-4 px-4 md:mx-0 md:px-0 space-x-1.5 sm:space-x-2 md:space-x-0">
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
                              className={`flex-shrink-0 w-14 sm:w-16 md:w-auto flex flex-col items-center gap-0.5 group transition-all duration-300 relative ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                              {isActive && (
                                  <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white z-10 shadow">
                                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </div>
                              )}
                              <div className={`w-full aspect-[4/3] rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 border-2 shadow-sm
                                  ${isActive
                                      ? 'border-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-100'
                                      : 'border-slate-200 bg-slate-50 group-hover:border-blue-400 group-hover:shadow-md group-hover:-translate-y-0.5'}`}>
                                  <img src={categoryImage} alt={category} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" width={100} height={100} />
                              </div>
                              <div className="text-center leading-tight">
                                  <span className={`text-[8px] sm:text-[9px] md:text-[9px] font-black whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                      {category}
                                  </span>
                                  <span className={`block text-[8px] ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>({count} cars)</span>
                              </div>
                          </button>
                      )
                  })}
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-6 lg:px-8 pt-0 md:pt-6">
        
        {/* Mobile Filter & Sort Controls */}
        <div className="md:hidden mb-0 bg-white p-3 border-b border-slate-100 sticky top-[100px] z-20 flex gap-3 shadow-sm">
            <button 
                onClick={() => {
                    setShowMobileSort(false);
                    setShowMobileFilters(true);
                }}
                className="w-1/2 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 p-3 rounded-xl font-bold text-xs shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50"
            >
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
                { (selectedCategories.length + selectedSuppliers.length + selectedTransmissions.length + selectedFuelPolicies.length + (passengerCapacity > 0 ? 1 : 0)) > 0 && (
                    <span className="bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                        {(selectedCategories.length + selectedSuppliers.length + selectedTransmissions.length + selectedFuelPolicies.length + (passengerCapacity > 0 ? 1 : 0))}
                    </span>
                )}
            </button>
            <button 
                onClick={() => {
                    setShowMobileFilters(false);
                    setShowMobileSort(true);
                }}
                className="w-1/2 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 p-3 rounded-xl font-bold text-xs shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50"
            >
                {sortBy === 'Recommended' ? (
                    <Gem className="w-4 h-4 text-blue-600" />
                ) : (
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                )}
                <span>{sortBy}</span>
            </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Filters Sidebar / Mobile Pop-up */}
          <div className={`
            fixed inset-0 z-[100] md:relative md:inset-auto md:z-0
            ${showMobileFilters ? 'flex' : 'hidden md:block'} 
            w-full md:w-64 lg:w-72 flex-shrink-0
          `}>
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
              onClick={() => setShowMobileFilters(false)}
            />

            <aside className={`
              relative bg-white w-full h-[90vh] mt-auto rounded-t-[32px] shadow-2xl flex flex-col
              md:h-auto md:mt-0 md:rounded-lg md:shadow-sm md:border md:border-slate-200 md:sticky md:top-36
              overflow-hidden transition-transform duration-500 ease-out
              ${showMobileFilters ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            `}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100 md:bg-slate-50/50 md:rounded-t-lg">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filters
                    </h3>
                    {showMobileFilters && (
                        <span className="md:hidden bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {sortedAndFilteredCars.length} results
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button 
                      onClick={handleResetFilters}
                      className="text-[10px] text-blue-600 font-bold hover:underline uppercase tracking-widest"
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

              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar pb-24 md:pb-0">
                  <div className="p-4">
                      <label className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                          <input type="checkbox" checked={specialOffersOnly} onChange={(e) => setSpecialOffersOnly(e.target.checked)} className="rounded w-4 h-4 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                          <span className="ml-2 text-xs text-slate-600 font-medium">Special Offers Only</span>
                          <Gift className="w-4 h-4 text-red-500 ml-auto" />
                      </label>
                  </div>

                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Price')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Price per Day</span>
                          {openFilters.includes('Price') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Price') && (
                          <div className="mt-4 px-1">
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
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                          </div>
                      )}
                  </div>

                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Category')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Car Category</span>
                          {openFilters.includes('Category') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Category') && (
                          <div className="mt-3 space-y-2">
                              {allCategories.map((type) => (
                                  <label key={type} className={`flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1`}>
                                      <input 
                                          type="checkbox" 
                                          checked={selectedCategories.includes(type)}
                                          onChange={() => handleCategoryToggle(type)}
                                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 w-4 h-4" 
                                      />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.category.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Passengers')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Number of seats</span>
                          {openFilters.includes('Passengers') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Passengers') && (
                          <div className="mt-3 grid grid-cols-4 gap-2">
                              {[2, 4, 5, 7].map(num => (
                                  <button key={num} onClick={() => setPassengerCapacity(passengerCapacity === num ? 0 : num)} className={`p-2 border rounded-md text-xs font-bold transition-colors ${passengerCapacity === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}>
                                      {num}{num === 7 ? '+' : ''}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Payment')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Payment Type</span>
                          {openFilters.includes('Payment') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Payment') && (
                          <div className="mt-3 space-y-2">
                              {allPaymentTypes.map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedPaymentTypes.includes(type)} onChange={() => handlePaymentTypeChange(type)} className="rounded w-4 h-4 text-blue-600" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{paymentTypeMapping[type as CommissionType]}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.paymentType.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Deposit')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Refundable Security Deposit</span>
                          {openFilters.includes('Deposit') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Deposit') && (
                          <div className="mt-3 space-y-2">
                              {[0, 300, 500].map((amount) => (
                                  <label key={amount} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="radio" name="deposit" checked={maxDeposit === amount} onChange={() => setMaxDeposit(amount)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{amount === 0 ? 'Any amount' : `Less than ${getCurrencySymbol()}${convertPrice(amount).toFixed(0)}`}</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('LocationType')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Location Type</span>
                          {openFilters.includes('LocationType') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('LocationType') && (
                          <div className="mt-3 space-y-2">
                              {allLocationTypes.map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedLocationTypes.includes(type)} onChange={() => handleLocationTypeChange(type)} className="rounded w-4 h-4 text-blue-600" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.locationType.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Transmission')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Transmission</span>
                          {openFilters.includes('Transmission') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Transmission') && (
                          <div className="mt-3 space-y-2">
                              {allTransmissions.map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedTransmissions.includes(type)} onChange={() => handleTransmissionChange(type)} className="rounded w-4 h-4 text-blue-600" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.transmission.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Fuel')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Fuel Policy</span>
                          {openFilters.includes('Fuel') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Fuel') && (
                          <div className="mt-3 space-y-2">
                              {allFuelPolicies.map((policy) => (
                                  <label key={policy} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedFuelPolicies.includes(policy)} onChange={() => handleFuelPolicyChange(policy)} className="rounded w-4 h-4 text-blue-600" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{policy}</span>
                                       <span className="ml-auto text-[10px] text-slate-400">({filterCounts.fuelPolicy.get(policy) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Supplier')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Suppliers in {pickupIata || location}</span>
                          {openFilters.includes('Supplier') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Supplier') && (
                          <div className="mt-3 space-y-2">
                              {allSuppliers.length === 0 && (
                                  <p className="text-[10px] text-slate-400 italic">No suppliers found for this search.</p>
                              )}
                              {allSuppliers.map((name) => (
                                  <label key={name} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedSuppliers.includes(name)} onChange={() => handleSupplierChange(name)} className="rounded w-4 h-4 text-blue-600" />
                                      {supplierLogos.get(name) && (
                                         <img src={supplierLogos.get(name)} alt={name} className="w-10 h-8 ml-2 object-contain" width={40} height={32} />
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
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <ArrowUpDown className="w-4 h-4 text-blue-600" /> Sort By
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
                        ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${sortBy === option.label ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            {React.cloneElement(option.icon as React.ReactElement, { 
                                className: `w-4 h-4 ${sortBy === option.label ? 'text-white' : 'text-blue-600'}` 
                            })}
                        </div>
                        <span className="font-bold text-sm">{option.label}</span>
                    </div>
                    {sortBy === option.label && <div className="bg-white rounded-full p-1"><Check className="w-3 h-3 text-blue-600" /></div>}
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
                <p className="text-xs text-slate-500 font-medium mb-3 md:mt-0 px-4 md:px-0">
                    Showing <strong>{sortedAndFilteredCars.length}</strong> of {baseFilteredCars.length} vehicles
                </p>
                <div className="space-y-4 md:space-y-0 px-2 md:px-0">
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
                        />
                    ))}
                    {sortedAndFilteredCars.length === 0 && (
                         <div className="text-center bg-white rounded-lg shadow-sm border border-slate-200 py-12 px-6">
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
    </div>
    </>
  );
};
