import * as React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_CATEGORY_IMAGES, SUPPLIERS } from '../services/mockData';
import { loadCars } from '../utils/loadCars';
import CarCard from '../components/CarCard';
import { SlidersHorizontal, Filter, Car as CarIcon, Users, MapPin, Check, Calendar, X, Shield, Clock, Fuel, Star, Settings } from 'lucide-react';
import { CarCategory, Car, Transmission, ApiSearchResult, Supplier, RateTier, PickupType } from '../types';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';

const apiCarToCar = (apiCar: ApiSearchResult): Car => {
    const hasFinalPrice = apiCar.finalPrice !== undefined && apiCar.finalPrice !== null;
    const dailyPrice = hasFinalPrice ? apiCar.finalPrice : apiCar.netPrice;
    
    const mockSupplier = SUPPLIERS.find(s => s.name.toLowerCase() === (apiCar.supplier?.name ?? "").toLowerCase());

    const mappedSupplier: Supplier = {
        id: mockSupplier?.id || `api-supplier-${((apiCar.supplier?.name ?? 'Unknown')).replace(/\s+/g, '-')}`,
        name: apiCar.supplier?.name ?? 'Unknown Supplier',
        rating: apiCar.supplier?.rating || 4.5,
        logo: apiCar.supplier?.logoUrl || '',
        commissionType: mockSupplier?.commissionType || 'PAY_AT_DESK' as any,
        commissionPercent: mockSupplier?.commissionPercent || mockSupplier?.commissionValue || 0,
        commissionValue: mockSupplier?.commissionValue || 0,
        bookingMode: mockSupplier?.bookingMode || 'FREE_SALE' as any,
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
        sippCode: apiCar.sippCode || 'XXXX',
        transmission: apiCar.transmission as Transmission || Transmission.AUTOMATIC,
        passengers: apiCar.passengers || 4,
        bags: apiCar.bags || 2,
        doors: apiCar.doors || 4,
        airCon: apiCar.airCon || false,
        image: apiCar.image || '',
        supplier: mappedSupplier,
        features: [],
        fuelPolicy: apiCar.fuelPolicy as any || 'FULL_TO_FULL',
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
        hogicarChoice: apiCar.hogicarChoice,
        promotionAmount: apiCar.promotionAmount,
        promotionPercent: apiCar.promotionPercent,
    } as Car;
};

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pickupIata = searchParams.get('pickup') || '';
  const pickupName = searchParams.get('pickupName') || pickupIata;
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
  const [isSearchWidgetOpen, setIsSearchWidgetOpen] = React.useState(false);
  
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(new Date().setDate(today.getDate() + 3)).toISOString().split('T')[0];

  const startDate = pickupDateParam || defaultStart;
  const endDate = dropoffDateParam || defaultEnd;

  const startD = new Date(startDate);
  const endD = new Date(endDate);
  
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
            setError("Failed to load results.");
            setApiCars([]);
        } finally {
            setLoading(false);
        }
    };
    fetchApiCars();
  }, [searchParams, startDate, endDate, pickupIata, dropoffIata]);

  const [priceRange, setPriceRange] = React.useState(500);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = React.useState<Transmission[]>([]);
  const [selectedLocationTypes, setSelectedLocationTypes] = React.useState<PickupType[]>([]);
  const [sortBy, setSortBy] = React.useState('rating_desc');
  const [freeCancelOnly, setFreeCancelOnly] = React.useState(false);
  
  const [selectedSuppliers, setSelectedSuppliers] = React.useState<string[]>([]);
  const [selectedPassengers, setSelectedPassengers] = React.useState<number[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [selectedFuelPolicies, setSelectedFuelPolicies] = React.useState<string[]>([]);
  const [minRating, setMinRating] = React.useState<number>(0);

  const filteredCars = React.useMemo(() => {
    let cars = [...apiCars].filter(car => {
        const dailyPrice = car.finalPrice || car.netPrice;
        if (convertPrice(dailyPrice) > priceRange) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(car.category)) return false;
        if (selectedTransmissions.length > 0 && !selectedTransmissions.includes(car.transmission)) return false;
        if (selectedSuppliers.length > 0 && !selectedSuppliers.includes(car.supplier.name)) return false;
        if (selectedPassengers.length > 0 && !selectedPassengers.some(p => car.passengers >= p)) return false;
        if (selectedFuelPolicies.length > 0 && !selectedFuelPolicies.includes(car.fuelPolicy)) return false;
        if (minRating > 0 && car.supplier.rating < minRating) return false;
        const pType = car.supplier?.pickupType || (car as any).pickupType;
        if (selectedLocationTypes.length > 0 && !selectedLocationTypes.includes(pType)) return false;
        if (freeCancelOnly && !car.supplier.includesCDW) return false;
        return true;
    });

    if (sortBy === 'price_asc') cars.sort((a, b) => (a.finalPrice || a.netPrice) - (b.finalPrice || b.netPrice));
    else if (sortBy === 'price_desc') cars.sort((a, b) => (b.finalPrice || b.netPrice) - (a.finalPrice || a.netPrice));
    else if (sortBy === 'rating_desc') cars.sort((a, b) => b.supplier.rating - a.supplier.rating);

    return cars;
  }, [apiCars, priceRange, selectedCategories, selectedTransmissions, selectedLocationTypes, freeCancelOnly, sortBy, convertPrice]);

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleTransmissionToggle = (trans: Transmission) => {
    setSelectedTransmissions(prev => prev.includes(trans) ? prev.filter(t => t !== trans) : [...prev, trans]);
  };

  const handleLocationTypeToggle = (type: PickupType) => {
    setSelectedLocationTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSupplierToggle = (sup: string) => {
    setSelectedSuppliers(prev => prev.includes(sup) ? prev.filter(s => s !== sup) : [...prev, sup]);
  };

  const handlePassengerToggle = (num: number) => {
    setSelectedPassengers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const handleFuelPolicyToggle = (policy: string) => {
    setSelectedFuelPolicies(prev => prev.includes(policy) ? prev.filter(p => p !== policy) : [...prev, policy]);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedTransmissions([]);
    setSelectedLocationTypes([]);
    setSelectedSuppliers([]);
    setSelectedPassengers([]);
    setSelectedFuelPolicies([]);
    setMinRating(0);
    setPriceRange(500);
    setFreeCancelOnly(false);
  };

  const handleSearchUpdate = (values: any) => {
    const params = new URLSearchParams(searchParams);
    params.set('pickup', values.pickup);
    if (values.pickupName) params.set('pickupName', values.pickupName);
    params.set('pickupDate', values.pickupDate);
    params.set('dropoffDate', values.dropoffDate);
    params.set('startTime', values.startTime);
    params.set('endTime', values.endTime);
    if (values.dropoff) params.set('dropoff', values.dropoff);
    if (values.dropoffName) params.set('dropoffName', values.dropoffName);
    navigate(`/search?${params.toString()}`);
    setIsSearchWidgetOpen(false);
  };

  const dateRangeDisplay = `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="bg-[#F8FAFE] min-h-screen font-sans text-[#0A2647] antialiased">
      <SEOMetadata 
        title={`Car Rental in ${pickupName} | RentCompare`} 
        description={`Compare and book premium car rentals in ${pickupName}. Best prices, verified suppliers, and free cancellation available.`} 
      />
      
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A2647]/5 to-[#1B4D8C]/5 border-b">
        <div className="zoom-container py-3">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2 flex items-center gap-2 text-sm sm:text-xs">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-gray-800">{pickupName}</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2 flex items-center gap-2 text-sm sm:text-xs">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-gray-800">{dateRangeDisplay}</span>
                </div>
                <button 
                    onClick={() => setIsSearchWidgetOpen(!isSearchWidgetOpen)}
                    className="bg-[#1B4D8C] hover:bg-[#0A2647] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {isSearchWidgetOpen ? 'Close' : 'Modify'}
                </button>
              </div>
              <h1 className="text-xl sm:text-lg font-black text-[#0A2647]">Compare <span className="text-[#D4AF37]">premium rentals</span></h1>
              <p className="text-gray-600 text-xs sm:text-[10px] font-medium">{loading ? 'Searching for best deals...' : `${filteredCars.length} verified offers found`}</p>
            </div>
            <div className="flex gap-1.5">
              <div className="bg-white rounded-full shadow-sm border px-2 py-1 flex items-center gap-1 text-[10px]">
                <Shield className="w-3 h-3 text-[#D4AF37]" />
                <span>Best price</span>
              </div>
              <div className="bg-white rounded-full shadow-sm border px-2 py-1 flex items-center gap-1 text-[10px]">
                <Clock className="w-3 h-3 text-[#D4AF37]" />
                <span>Free cancel</span>
              </div>
            </div>
          </div>

          {isSearchWidgetOpen && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-xl border animate-fadeIn">
                <SearchWidget 
                    onSearch={handleSearchUpdate}
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
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#D4AF37]/30 to-transparent"></div>
      </div>

      <div className="zoom-container py-4">
        {/* Top Category Filter */}
        <div className="flex overflow-x-auto lg:justify-center gap-3 pb-6 mb-2 no-scrollbar scroll-smooth">
            {[CarCategory.MINI, CarCategory.ECONOMY, CarCategory.COMPACT, CarCategory.MIDSIZE, CarCategory.SUV, CarCategory.VAN, CarCategory.LUXURY].map(cat => (
                <button 
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[90px] sm:min-w-[110px] p-3 sm:p-5 rounded-3xl border-2 transition-all duration-300 shadow-sm ${
                        selectedCategories.includes(cat) 
                        ? 'bg-gradient-to-br from-[#123C69] to-[#1B4D8C] border-[#123C69] text-white shadow-xl scale-105 -translate-y-1' 
                        : 'bg-white border-gray-100 text-[#0A2647] hover:border-[#F57C00]/30 hover:shadow-md'
                    }`}
                >
                    <div className={`w-10 h-8 sm:w-12 sm:h-9 mb-2 flex items-center justify-center transition-all duration-300 ${selectedCategories.includes(cat) ? 'scale-110 drop-shadow-md' : ''}`}>
                        <CarIcon className={`w-7 h-7 sm:w-9 sm:h-9 ${selectedCategories.includes(cat) ? 'text-white' : 'text-[#F57C00]'}`} />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] ${selectedCategories.includes(cat) ? 'text-white' : 'text-gray-500'}`}>{cat.toLowerCase()}</span>
                    {selectedCategories.includes(cat) && (
                        <div className="absolute -top-1 -right-1">
                            <div className="bg-[#F57C00] text-white rounded-full p-1 shadow-md">
                                <Check className="w-3 h-3 stroke-[4]" />
                            </div>
                        </div>
                    )}
                </button>
            ))}
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          <aside className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-2xl transform ${isFilterDrawerOpen ? 'translate-x-0' : '-translate-x-full'} transition lg:relative lg:translate-x-0 lg:shadow-none lg:bg-transparent lg:w-auto overflow-auto rounded-r-2xl lg:rounded-none`}>
            <div className="lg:bg-white lg:rounded-xl lg:border lg:shadow-sm bg-white p-4 h-full">
              <div className="flex justify-between pb-2 border-b mb-4">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#1B4D8C]" />
                  <h2 className="font-bold text-sm">Refine</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={resetFilters} className="text-[10px] font-semibold text-[#1B4D8C] hover:text-[#D4AF37]">Reset</button>
                  <button onClick={() => setIsFilterDrawerOpen(false)} className="lg:hidden p-0.5 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-wider flex items-center gap-2">
                    <Fuel className="w-3 h-3" /> Fuel Policy
                  </h3>
                  <div className="space-y-2">
                    {['FULL_TO_FULL', 'SAME_LEVEL'].map(policy => (
                      <label key={policy} className="flex items-center text-sm cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={selectedFuelPolicies.includes(policy)}
                            onChange={() => handleFuelPolicyToggle(policy)}
                            className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] transition-colors font-medium text-gray-700">{policy.replace(/_/g, ' ').toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-wider flex items-center gap-2">
                    <Star className="w-3 h-3" /> Supplier Rating
                  </h3>
                  <div className="space-y-2">
                    {[9, 8, 7].map(rating => (
                      <label key={rating} className="flex items-center text-sm cursor-pointer group">
                        <input 
                            type="radio" 
                            name="rating"
                            checked={minRating === rating}
                            onChange={() => setMinRating(rating)}
                            className="mr-3 w-4 h-4 rounded-full border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] transition-colors font-medium text-gray-700">{rating}+ Excellent</span>
                      </label>
                    ))}
                    <label className="flex items-center text-sm cursor-pointer group">
                        <input 
                            type="radio" 
                            name="rating"
                            checked={minRating === 0}
                            onChange={() => setMinRating(0)}
                            className="mr-3 w-4 h-4 rounded-full border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] transition-colors font-medium text-gray-700">Any Rating</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-wider flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Transmission
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedTransmissions.includes(Transmission.AUTOMATIC)}
                        onChange={() => handleTransmissionToggle(Transmission.AUTOMATIC)}
                        className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                      /> 
                      <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700">Automatic</span>
                    </label>
                    <label className="flex items-center text-sm cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedTransmissions.includes(Transmission.MANUAL)}
                        onChange={() => handleTransmissionToggle(Transmission.MANUAL)}
                        className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                      /> 
                      <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700">Manual</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-wider">Capacity</h3>
                  <div className="space-y-2">
                    {[4, 5, 7].map(num => (
                      <label key={num} className="flex items-center text-sm cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedPassengers.includes(num)}
                          onChange={() => handlePassengerToggle(num)}
                          className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700">{num}+ Passengers</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Max Daily Price</h3>
                    <span className="text-sm font-bold text-[#D4AF37]">{getCurrencySymbol()} {priceRange}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="1000" 
                    value={priceRange} 
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" 
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
                    <span>{getCurrencySymbol()} 10</span>
                    <span>{getCurrencySymbol()} 1000+</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-wider">Rental Conditions</h3>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={freeCancelOnly}
                            onChange={(e) => setFreeCancelOnly(e.target.checked)}
                            className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700">Free Cancellation</span>
                    </label>
                    <label className="flex items-center text-sm cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={selectedLocationTypes.includes(PickupType.IN_TERMINAL)}
                            onChange={() => handleLocationTypeToggle(PickupType.IN_TERMINAL)}
                            className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700">In Terminal</span>
                    </label>
                    <label className="flex items-center text-sm cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={selectedLocationTypes.includes(PickupType.MEET_AND_GREET)}
                            onChange={() => handleLocationTypeToggle(PickupType.MEET_AND_GREET)}
                            className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700">Meet & Greet</span>
                    </label>
                  </div>
                </div>

                {apiCars.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-wider">Suppliers</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from(new Set(apiCars.map(c => c.supplier.name))).sort().map(sup => (
                        <label key={sup} className="flex items-center text-sm cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={selectedSuppliers.includes(sup)}
                            onChange={() => handleSupplierToggle(sup)}
                            className="mr-3 w-4 h-4 rounded border-gray-300 text-[#1B4D8C]" 
                          /> 
                          <span className="group-hover:text-[#1B4D8C] font-medium text-gray-700 truncate">{sup}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {isFilterDrawerOpen && (
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setIsFilterDrawerOpen(false)}
            />
          )}

          <main className="lg:col-span-3 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 sm:p-2 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-sm sm:text-xs">
                <div className="bg-[#D4AF37]/10 p-1.5 rounded-lg">
                  <CarIcon className="w-4 h-4 text-[#D4AF37]" /> 
                </div>
                <div>
                  <span className="font-black text-lg sm:text-sm text-[#0A2647]">{filteredCars.length}</span> 
                  <span className="text-gray-500 text-xs sm:text-[11px] ml-1 font-medium">vehicles available</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:py-1.5 text-xs font-bold focus:ring-2 focus:ring-[#1B4D8C]/20 outline-none transition-all"
                >
                  <option value="rating_desc">🌟 Recommended</option>
                  <option value="price_asc">💰 Price: Low</option>
                  <option value="price_desc">💰 Price: High</option>
                  <option value="rating_desc">⭐ Rating</option>
                </select>
                <button 
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="lg:hidden flex items-center justify-center gap-2 bg-[#1B4D8C] text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  <Filter className="w-3.5 h-3.5" /> Filter
                </button>
              </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white rounded-xl border animate-pulse" />
                    ))}
                </div>
            ) : filteredCars.length > 0 ? (
                <div className="space-y-3">
                    {filteredCars.map(car => (
                        <CarCard 
                            key={car.id} 
                            car={car} 
                            pickupDate={startD}
                            dropoffDate={endD}
                            cars={filteredCars}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border">
                  <CarIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-sm font-semibold">No matches</h3>
                  <p className="text-gray-400 text-xs">Adjust filters</p>
                  <button 
                    onClick={resetFilters}
                    className="mt-2 bg-[#0A2647] text-white px-3 py-1 rounded-lg text-xs"
                  >
                    Clear
                  </button>
                </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
