import * as React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_CATEGORY_IMAGES, SUPPLIERS, loadCars } from '../services/mockData';
import CarCard from '../components/CarCard';
import { SlidersHorizontal, Filter, Car as CarIcon, Users, MapPin, Check, Calendar, X, Shield, Clock } from 'lucide-react';
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
  
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);

  const filteredCars = React.useMemo(() => {
    let cars = [...apiCars].filter(car => {
        const dailyPrice = car.finalPrice || car.netPrice;
        if (convertPrice(dailyPrice) > priceRange) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(car.category)) return false;
        if (selectedTransmissions.length > 0 && !selectedTransmissions.includes(car.transmission)) return false;
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

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedTransmissions([]);
    setSelectedLocationTypes([]);
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
      <SEOMetadata title={`Car Rental in ${pickupName} | RentCompare`} />
      
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="zoom-container py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-extrabold bg-gradient-to-r from-[#0A2647] to-[#1B4D8C] bg-clip-text text-transparent">
              Rent<span className="text-[#D4AF37]">Compare</span>
            </Link>
            <div className="hidden md:block h-5 w-px bg-gray-300"></div>
            <span className="hidden md:block text-[10px] font-medium text-gray-500 uppercase tracking-widest">Executive</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1 text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">24/7 Support</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A2647]/5 to-[#1B4D8C]/5 border-b">
        <div className="zoom-container py-3">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                <div className="bg-white rounded-full shadow-sm border px-3 py-1 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  <span className="font-medium text-gray-700">{pickupName}</span>
                </div>
                <div className="bg-white rounded-full shadow-sm border px-3 py-1 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3 h-3 text-[#D4AF37]" />
                  <span className="font-medium text-gray-700">{dateRangeDisplay}</span>
                </div>
                <button 
                    onClick={() => setIsSearchWidgetOpen(!isSearchWidgetOpen)}
                    className="bg-[#1B4D8C] hover:bg-[#0A2647] text-white text-[10px] font-semibold px-3 py-1 rounded-full transition-colors"
                >
                    {isSearchWidgetOpen ? 'Close' : 'Update'}
                </button>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#0A2647]">Compare <span className="text-[#D4AF37]">premium rentals</span></h1>
              <p className="text-gray-500 text-[10px]">{loading ? 'Searching...' : `${filteredCars.length} verified offers`}</p>
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

              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Category</h3>
                  <div className="space-y-1.5">
                    {[CarCategory.ECONOMY, CarCategory.COMPACT, CarCategory.INTERMEDIATE, CarCategory.SUV, CarCategory.LUXURY].map(cat => (
                      <label key={cat} className="flex items-center text-xs cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(cat)}
                            onChange={() => handleCategoryToggle(cat)}
                            className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C] transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Transmission</h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedTransmissions.includes(Transmission.AUTOMATIC)}
                        onChange={() => handleTransmissionToggle(Transmission.AUTOMATIC)}
                        className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-[#1B4D8C]" 
                      /> 
                      <span className="group-hover:text-[#1B4D8C]">Automatic</span>
                    </label>
                    <label className="flex items-center text-xs cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedTransmissions.includes(Transmission.MANUAL)}
                        onChange={() => handleTransmissionToggle(Transmission.MANUAL)}
                        className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-[#1B4D8C]" 
                      /> 
                      <span className="group-hover:text-[#1B4D8C]">Manual</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="text-[10px] font-bold uppercase">Daily ({getCurrencySymbol()})</h3>
                    <span className="text-sm font-bold text-[#D4AF37]">{getCurrencySymbol()} {priceRange}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="1000" 
                    value={priceRange} 
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" 
                  />
                </div>

                <div>
                  <h3 className="text-[10px] font-bold uppercase mb-2 text-gray-400">Conditions</h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs cursor-pointer group mb-1.5">
                        <input 
                            type="checkbox" 
                            checked={freeCancelOnly}
                            onChange={(e) => setFreeCancelOnly(e.target.checked)}
                            className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C]">Free cancel</span>
                    </label>
                    <label className="flex items-center text-xs cursor-pointer group mb-1.5">
                        <input 
                            type="checkbox" 
                            checked={selectedLocationTypes.includes(PickupType.MEET_AND_GREET)}
                            onChange={() => handleLocationTypeToggle(PickupType.MEET_AND_GREET)}
                            className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C]">Meet & Greet</span>
                    </label>
                    <label className="flex items-center text-xs cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={selectedLocationTypes.includes(PickupType.IN_TERMINAL)}
                            onChange={() => handleLocationTypeToggle(PickupType.IN_TERMINAL)}
                            className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-[#1B4D8C]" 
                        /> 
                        <span className="group-hover:text-[#1B4D8C]">In-terminal</span>
                    </label>
                  </div>
                </div>
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
            <div className="flex flex-wrap justify-between gap-2 mb-3 bg-white p-2 rounded-lg shadow-sm border">
              <div className="flex items-center gap-1.5 text-xs">
                <CarIcon className="w-3.5 h-3.5 text-[#D4AF37]" /> 
                <span className="font-bold text-sm">{filteredCars.length}</span> 
                <span className="text-gray-500 text-[11px]">vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 hidden sm:inline font-semibold">Sort</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border rounded-lg px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-[#1B4D8C] outline-none"
                >
                  <option value="rating_desc">🌟 Recommended</option>
                  <option value="price_asc">💰 Price: Low</option>
                  <option value="price_desc">💰 Price: High</option>
                  <option value="rating_desc">⭐ Rating</option>
                </select>
                <button 
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="lg:hidden flex items-center gap-1 bg-gray-50 border rounded-lg px-2 py-1 text-xs font-semibold"
                >
                  <Filter className="w-3 h-3" /> Filter
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
