import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_CARS, MOCK_CATEGORY_IMAGES, MOCK_CAR_LIBRARY, SUPPLIERS } from '../services/mockData';
import { fetchCars } from '../api';
import CarCard from '../components/CarCard';
import { SlidersHorizontal, ChevronDown, ChevronUp, Filter, ArrowUpDown, Car as CarIcon, Truck, Gem, Users, Gift, CreditCard, Shield, MapPin, Check, Edit, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { CarCategory, Car, Transmission, FuelPolicy, CommissionType, ApiSearchResult, Supplier, BookingMode, CarType, RateTier } from '../types';
import { calculatePrice } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import BookingStepper from '../components/BookingStepper';
import SearchWidget from '../components/SearchWidget';

const apiCarToCar = (apiCar: ApiSearchResult, index: number, days: number): Car => {
    const carModel = MOCK_CAR_LIBRARY.find(m => m.make.toLowerCase() === apiCar.brand.toLowerCase() && m.model.toLowerCase() === apiCar.model.toLowerCase());

    const supplierFromMock = SUPPLIERS.find(s => s.name.toLowerCase() === apiCar.supplier.toLowerCase());

    const supplier: Supplier = supplierFromMock ? {
        ...supplierFromMock,
        commissionType: CommissionType.PAY_AT_DESK,
        commissionValue: 0
    } : {
        id: `api-supplier-${apiCar.supplier.replace(/\s+/g, '-')}-${index}`,
        name: apiCar.supplier,
        rating: 4.2,
        logo: 'https://placehold.co/100x100/e2e8f0/64748b?text=Logo',
        commissionType: CommissionType.PAY_AT_DESK,
        commissionValue: 0,
        bookingMode: BookingMode.FREE_SALE,
        status: 'active',
        location: 'API Location',
        contactEmail: 'contact@api.supplier',
        gracePeriodHours: 1,
        minBookingLeadTime: 2,
        termsAndConditions: "Standard terms apply.",
        connectionType: 'api',
        includesCDW: true,
        includesTP: true,
        oneWayFee: 0,
        enableSocialProof: false,
    };

    const dailyRate = days > 0 ? apiCar.finalPrice / days : apiCar.finalPrice;
    const apiRateTier: RateTier = {
        id: `api-tier-${index}`,
        name: 'API Rate',
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        rates: [{ minDays: 1, maxDays: 99, dailyRate: dailyRate }]
    };
    
    const categoryKey = apiCar.category.toUpperCase() as keyof typeof CarCategory;
    const categoryValue = CarCategory[categoryKey] || CarCategory.ECONOMY;

    return {
        id: `api-car-${index}-${apiCar.brand}-${apiCar.model}`,
        make: apiCar.brand,
        model: apiCar.model,
        year: carModel?.year || new Date().getFullYear(),
        category: categoryValue,
        type: carModel?.type || CarType.SEDAN,
        sippCode: 'CDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: carModel?.passengers || 4,
        bags: carModel?.bags || 2,
        doors: carModel?.doors || 4,
        airCon: true,
        image: carModel?.image || MOCK_CATEGORY_IMAGES[categoryValue] || 'https://images.unsplash.com/photo-1580273916550-4821b3a160fa?w=500&auto=format&fit=crop',
        supplier: supplier,
        features: ['API Result'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'API Result', // This won't be used for filtering
        deposit: 300,
        excess: 1000,
        stopSales: [],
        rateTiers: [apiRateTier],
        extras: [],
        locationDetail: "In Terminal",
        unlimitedMileage: true,
        tags: ["Online Deal"],
        detailedRatings: {
            cleanliness: 90,
            condition: 90,
            valueForMoney: 90,
            pickupSpeed: 90,
        }
    };
};


// FIX: Changed to a named export to resolve module resolution error.
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
  
  // Calculate dynamic default dates if not provided
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(new Date().setDate(today.getDate() + 3)).toISOString().split('T')[0];

  const startDate = pickupDateParam || defaultStart;
  const endDate = dropoffDateParam || defaultEnd;

  // Calculate duration in days
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Default to 1 if calculation fails
  
  React.useEffect(() => {
    const fetchApiCars = async () => {
        setLoading(true);
        setError(null);
        setApiCars([]);

        const pickup = searchParams.get('pickup');
        const dropoff = searchParams.get('dropoff') || pickup;
        const pickupDate = searchParams.get('pickupDate');
        const dropoffDate = searchParams.get('dropoffDate');

        if (!pickup || !pickupDate || !dropoffDate || !dropoff) {
            setError("Missing search parameters. Please start a new search from the homepage.");
            setLoading(false);
            return; 
        }
        
        try {
            const data: ApiSearchResult[] = await fetchCars({
              pickup,
              dropoff,
              pickupDate,
              dropoffDate,
            });

            if (data && data.length > 0) {
                const mappedCars: Car[] = data.map((apiCar, index) => apiCarToCar(apiCar, index, days));
                setApiCars(mappedCars);
            } else {
                setApiCars([]); // No results found
            }
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            setError("We couldn't retrieve car results at the moment. The service might be temporarily down. Please try again later.");
            setApiCars([]);
        } finally {
            setLoading(false);
        }
    };

    fetchApiCars();
  }, [searchParams, days]);

  // Formatting dates and times for display
  const formatDateTime = (date: Date, time: string) => {
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • ${time}`;
  };
  const startDateTimeDisplay = formatDateTime(startD, startTimeParam || '10:00');
  const endDateTimeDisplay = formatDateTime(endD, endTimeParam || '10:00');

  // Filter States
  const [priceRange, setPriceRange] = React.useState(300);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = React.useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = React.useState<string[]>([]);
  const [selectedFuelPolicies, setSelectedFuelPolicies] = React.useState<string[]>([]);
  const [passengerCapacity, setPassengerCapacity] = React.useState<number>(0);
  const [sortBy, setSortBy] = React.useState('Recommended');
  const [openFilters, setOpenFilters] = React.useState<string[]>(['Price', 'Category', 'Passengers', 'LocationType']);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  
  // New Filter States
  const [selectedPaymentTypes, setSelectedPaymentTypes] = React.useState<string[]>([]);
  const [maxDeposit, setMaxDeposit] = React.useState<number>(0); // 0 means any
  const [selectedLocationTypes, setSelectedLocationTypes] = React.useState<string[]>([]);
  const [specialOffersOnly, setSpecialOffersOnly] = React.useState<boolean>(false);

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
    
    setIsSearchOpen(false); // Close the widget
    navigate(`/searching?${newSearchParams.toString()}`);
  };


  const toggleFilterSection = (section: string) => {
    setOpenFilters(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  // Derived Filter Lists
  const allCategories = Object.values(CarCategory);
  const allSuppliers = React.useMemo(() => {
    if (!apiCars) return [];
    return Array.from(new Set(apiCars.map(c => c.supplier.name))).sort();
  }, [apiCars]);
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
        const price = getCarDailyPrice(car);
        if (price > priceRange) return;
        
        const hasPromo = !!calculatePrice(car, days, startDate).promotionLabel || (car.tags && car.tags.length > 0);

        const matchesSuppliers = selectedSuppliers.length === 0 || selectedSuppliers.includes(car.supplier.name);
        const matchesCategories = selectedCategories.length === 0 || selectedCategories.includes(car.category);
        const matchesTransmissions = selectedTransmissions.length === 0 || selectedTransmissions.includes(car.transmission);
        const matchesFuelPolicies = selectedFuelPolicies.length === 0 || selectedFuelPolicies.includes(car.fuelPolicy);
        const matchesPassengers = passengerCapacity === 0 || car.passengers >= passengerCapacity;
        const matchesPaymentTypes = selectedPaymentTypes.length === 0 || selectedPaymentTypes.includes(car.supplier.commissionType);
        const matchesDeposit = maxDeposit === 0 || car.deposit <= maxDeposit;
        const matchesLocationTypes = selectedLocationTypes.length === 0 || selectedLocationTypes.some(locType => car.locationDetail.toLowerCase().includes(locType.toLowerCase()));
        const matchesSpecialOffers = !specialOffersOnly || hasPromo;

        const commonMatches = matchesDeposit && matchesSpecialOffers;

        if (commonMatches && matchesSuppliers && matchesTransmissions && matchesFuelPolicies && matchesPassengers && matchesPaymentTypes && matchesLocationTypes) {
            counts.category.set(car.category, (counts.category.get(car.category) || 0) + 1);
        }
        if (commonMatches && matchesCategories && matchesTransmissions && matchesFuelPolicies && matchesPassengers && matchesPaymentTypes && matchesLocationTypes) {
            counts.supplier.set(car.supplier.name, (counts.supplier.get(car.supplier.name) || 0) + 1);
        }
        if (commonMatches && matchesCategories && matchesSuppliers && matchesFuelPolicies && matchesPassengers && matchesPaymentTypes && matchesLocationTypes) {
            counts.transmission.set(car.transmission, (counts.transmission.get(car.transmission) || 0) + 1);
        }
        if (commonMatches && matchesCategories && matchesSuppliers && matchesTransmissions && matchesPassengers && matchesPaymentTypes && matchesLocationTypes) {
            counts.fuelPolicy.set(car.fuelPolicy, (counts.fuelPolicy.get(car.fuelPolicy) || 0) + 1);
        }
        if (commonMatches && matchesCategories && matchesSuppliers && matchesTransmissions && matchesPassengers && matchesFuelPolicies && matchesLocationTypes) {
            counts.paymentType.set(car.supplier.commissionType, (counts.paymentType.get(car.supplier.commissionType) || 0) + 1);
        }
        if (commonMatches && matchesCategories && matchesSuppliers && matchesTransmissions && matchesPassengers && matchesFuelPolicies && matchesPaymentTypes) {
             allLocationTypes.forEach(locType => {
                if (car.locationDetail.toLowerCase().includes(locType.toLowerCase())) {
                    counts.locationType.set(locType, (counts.locationType.get(locType) || 0) + 1);
                }
            });
        }
    });
    return counts;
  }, [baseFilteredCars, priceRange, selectedCategories, selectedSuppliers, selectedTransmissions, selectedFuelPolicies, passengerCapacity, days, startDate, selectedPaymentTypes, maxDeposit, selectedLocationTypes, specialOffersOnly]);


  // Final Filter & Sort Logic
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
      if (selectedLocationTypes.length > 0 && !selectedLocationTypes.some(locType => car.locationDetail.toLowerCase().includes(locType.toLowerCase()))) return false;
      if (specialOffersOnly) {
        const hasPromoLabel = !!calculatePrice(car, days, startDate).promotionLabel;
        const hasTags = car.tags && car.tags.length > 0;
        if (!hasPromoLabel && !hasTags) return false;
      }
      return true;
    });

    switch(sortBy) {
        case 'Price: Low to High':
            return [...filtered].sort((a, b) => getCarDailyPrice(a) - getCarDailyPrice(b));
        case 'Price: High to Low':
            return [...filtered].sort((a, b) => getCarDailyPrice(b) - getCarDailyPrice(a));
        default: // Recommended
            return filtered;
    }

  }, [baseFilteredCars, priceRange, selectedCategories, selectedSuppliers, selectedTransmissions, selectedFuelPolicies, passengerCapacity, sortBy, days, startDate, selectedPaymentTypes, maxDeposit, selectedLocationTypes, specialOffersOnly]);
  
  const categoryOrder = [CarCategory.MINI, CarCategory.ECONOMY, CarCategory.COMPACT, CarCategory.MIDSIZE, CarCategory.FULLSIZE, CarCategory.SUV, CarCategory.LUXURY, CarCategory.PEOPLE_CARRIER];

  return (
    <>
    <SEOMetadata
        title={`Car Hire in ${location || 'Top Destinations'} | Hogicar`}
        description={`Find the best car rental deals in ${location}. Compare prices from top suppliers like Hertz, Avis, and more.`}
    />
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-2 py-1 sm:py-2 sm:px-6 lg:px-8">
            <div 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex justify-between items-center cursor-pointer group bg-white hover:bg-slate-50 transition-colors duration-200 p-0.5 sm:p-1 rounded-lg border border-transparent hover:border-blue-300"
            >
              <div className="flex-grow grid grid-cols-2 gap-x-1 sm:gap-x-4 items-center">
                {/* Location */}
                <div className="p-1 sm:p-2 flex items-center gap-1 sm:gap-2">
                  <div className="bg-blue-50 p-1 sm:p-3 rounded-md sm:rounded-lg flex-shrink-0"><MapPin className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600"/></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs text-slate-500 font-medium">Location</p>
                    <p className="font-bold text-[10px] sm:text-sm text-slate-800 truncate group-hover:text-blue-700 transition-colors">{location || 'Select Location'}</p>
                  </div>
                </div>

                {/* Dates & Times */}
                <div className="p-1 sm:p-2 flex items-center gap-1 sm:gap-2 border-l border-slate-200">
                  <div className="bg-blue-50 p-1 sm:p-3 rounded-md sm:rounded-lg flex-shrink-0"><Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600"/></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs text-slate-500 font-medium">Dates & Times</p>
                    <div className="font-bold text-[9px] sm:text-sm text-slate-800 group-hover:text-blue-700 transition-colors flex items-center flex-wrap gap-x-1">
                      <span className="truncate">{startDateTimeDisplay}</span>
                      <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{endDateTimeDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modify Button */}
              <div className="ml-1 sm:ml-4 flex-shrink-0">
                  <div className="flex items-center gap-1 text-blue-600 font-bold text-sm py-1 px-2 sm:py-3 sm:px-4 rounded-md sm:rounded-lg bg-blue-100/50 group-hover:bg-blue-100 transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Modify</span>
                  </div>
              </div>
            </div>

            {isSearchOpen && (
                <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn">
                    <SearchWidget
                        onSearch={handleSearch}
                        initialValues={{ 
                            pickup: pickupIata,
                            pickupName: pickupName,
                            startDate, 
                            endDate,
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
      
      <BookingStepper currentStep={2} />

       {/* Category Image Filter */}
      <div className="bg-white border-b border-slate-200 py-2 sm:py-3">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h2 className="text-[11px] sm:text-sm font-bold text-slate-800">Filter by Category</h2>
                <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-slate-500">Sort by:</span>
                    <div className="relative">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-sm text-slate-700 font-medium rounded pl-3 pr-8 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-slate-300"
                        >
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
              </div>
              <div className="flex overflow-x-auto no-scrollbar md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-2 -mx-4 px-4 md:mx-0 md:px-0 space-x-2 sm:space-x-3 md:space-x-0">
                  {categoryOrder.map(category => {
                      const isActive = selectedCategories.includes(category);
                      const count = filterCounts.category.get(category) || 0;
                      const isDisabled = count === 0 && !isActive;

                      return (
                          <button
                              key={category}
                              onClick={() => handleCategoryToggle(category)}
                              disabled={isDisabled}
                              className={`flex-shrink-0 w-16 sm:w-24 md:w-auto flex flex-col items-center gap-0.5 group transition-all duration-300 relative ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                              {isActive && (
                                  <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white z-10">
                                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </div>
                              )}
                              <div className={`w-full aspect-[4/3] rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 border-2 shadow-sm
                                  ${isActive
                                      ? 'border-blue-600 shadow-lg shadow-blue-500/30'
                                      : 'border-slate-200 group-hover:border-blue-400 group-hover:shadow-md group-hover:-translate-y-1'}`}>
                                  <img src={MOCK_CATEGORY_IMAGES[category]} alt={category} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              </div>
                              <div className="text-center">
                                  <span className={`text-[9px] sm:text-[11px] md:text-[11px] font-bold whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                      {category}
                                  </span>
                                  <span className="block text-[8px] text-slate-400">({count} cars)</span>
                              </div>
                          </button>
                      )
                  })}
              </div>
          </div>
      </div>

      {/* Main Results Container - px-0 on mobile for edge-to-edge */}
      <div className="max-w-6xl mx-auto px-0 md:px-6 lg:px-8 pt-0 md:pt-6">
        
        {/* Mobile Filter & Sort Controls */}
        <div className="md:hidden mb-0 bg-slate-50 p-2 border-b border-slate-200 sticky top-[100px] z-20 flex gap-2">
            <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-1/2 flex items-center justify-center gap-1.5 bg-white border border-slate-200 p-2 rounded-md font-medium text-slate-700 shadow-sm text-xs active:bg-slate-50"
            >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
            </button>
            <div className="relative w-1/2">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-full appearance-none bg-white border border-slate-200 p-2 rounded-md font-medium text-slate-700 shadow-sm text-xs active:bg-slate-50 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none pl-2.5"
                >
                    <option>Recommended</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
        </div>


        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Filters Sidebar */}
          <aside className={`w-full md:w-64 lg:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden'} md:block pt-4 md:pt-0`}>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 sticky top-36">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50 rounded-t-lg">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </h3>
                <button 
                  onClick={() => {
                    setPriceRange(300);
                    setSelectedCategories([]);
                    setSelectedSuppliers([]);
                    setSelectedTransmissions([]);
                    setSelectedFuelPolicies([]);
                    setPassengerCapacity(0);
                    setSelectedPaymentTypes([]);
                    setMaxDeposit(0);
                    setSelectedLocationTypes([]);
                    setSpecialOffersOnly(false);
                  }}
                  className="text-[10px] text-blue-600 font-semibold hover:underline uppercase tracking-wide"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                  {/* Special Offers Filter */}
                  <div className="p-4">
                      <label className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                          <input type="checkbox" checked={specialOffersOnly} onChange={(e) => setSpecialOffersOnly(e.target.checked)} className="rounded w-4 h-4 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                          <span className="ml-2 text-xs text-slate-600 font-medium">Special Offers Only</span>
                          <Gift className="w-4 h-4 text-red-500 ml-auto" />
                      </label>
                  </div>

                  {/* Price Filter */}
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
                                  max="300" 
                                  value={priceRange} 
                                  onChange={(e) => setPriceRange(Number(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                          </div>
                      )}
                  </div>

                  {/* Category Filter */}
                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Category')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Car Category</span>
                          {openFilters.includes('Category') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Category') && (
                          <div className="mt-3 space-y-2">
                              {allCategories.map((type) => (
                                  <label key={type} className={`flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1 ${ (filterCounts.category.get(type) || 0) === 0 ? 'opacity-50' : '' }`}>
                                      <input 
                                          type="checkbox" 
                                          checked={selectedCategories.includes(type)}
                                          onChange={() => handleCategoryToggle(type)}
                                          disabled={(filterCounts.category.get(type) || 0) === 0 && !selectedCategories.includes(type)}
                                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 w-4 h-4" 
                                      />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{type}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.category.get(type) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  {/* Number of seats Filter */}
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
                  
                  {/* Payment Type Filter */}
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

                  {/* Security Deposit Filter */}
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
                  
                  {/* Location Type Filter */}
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

                  {/* Transmission Filter */}
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

                  {/* Fuel Policy Filter */}
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


                  {/* Supplier Filter */}
                  <div className="p-4">
                      <button onClick={() => toggleFilterSection('Supplier')} className="w-full flex justify-between items-center text-left group">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Car Rental Company</span>
                          {openFilters.includes('Supplier') ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFilters.includes('Supplier') && (
                          <div className="mt-3 space-y-2">
                              {allSuppliers.map((name) => (
                                  <label key={name} className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded -ml-1">
                                      <input type="checkbox" checked={selectedSuppliers.includes(name)} onChange={() => handleSupplierChange(name)} className="rounded w-4 h-4 text-blue-600" />
                                      <span className="ml-2 text-xs text-slate-600 font-medium">{name}</span>
                                      <span className="ml-auto text-[10px] text-slate-400">({filterCounts.supplier.get(name) || 0})</span>
                                  </label>
                              ))}
                          </div>
                      )}
                  </div>

              </div>
            </div>
          </aside>
          
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
                {sortedAndFilteredCars.length > 0 ? (
                    <div>
                    {sortedAndFilteredCars.map(car => (
                        <CarCard 
                        key={car.id}
                        car={car}
                        days={days}
                        startDate={startDate}
                        endDate={endDate}
                        />
                    ))}
                    </div>
                ) : (
                    <div className="text-center bg-white rounded-lg shadow-sm border border-slate-200 py-12 px-6">
                        <h3 className="text-lg font-bold text-slate-800">No cars found</h3>
                        <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or search criteria.</p>
                    </div>
                )}
                </>
            )}
          </main>
        </div>
      </div>
    </div>
    </>
  );
};
