
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Shield, Star, Award, Search, 
  MapPin, Zap, Fuel, Clock, ArrowRight, ChevronDown, 
  ChevronRight, Globe, Info, X,
  CreditCard, Wallet, HelpCircle, User, Car as CarIcon,
  ParkingCircle, Compass, Plane, Quote, ShieldCheck, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchWidget from '../components/SearchWidget';
import SEOMetadata from '../components/SEOMetadata';
import TrustedSuppliers from '../components/TrustedSuppliers';
import LatestTravelGuides from '../components/LatestTravelGuides';
import Reviews from '../components/Reviews';
import { fetchCountryBySlug, fetchFeaturedCars, fetchHomepageContent, fetchLocations, fetchSiteSettings, LocationSuggestion } from '../api';
import { useCurrency } from '../contexts/CurrencyContext';
import { resolveAssetUrl } from '../utils/heroImage';

type DealLocation = {
  label: string;
  value: string;
  type: 'airport' | 'city';
};

const inferLocationCode = (label: string) => {
  const match = label.match(/\(([A-Z]{3})\)/i);
  if (match?.[1]) return match[1].toUpperCase();
  const lower = label.toLowerCase();
  if (lower.includes('queen alia')) return 'AMM';
  if (lower.includes('king hussein')) return 'AQJ';
  return label;
};

const normalizeLocationLabel = (location: any) => {
  if (typeof location === 'string') return location;
  if (location?.label) return location.label;
  if (location?.name) return location.name;
  return '';
};

const CountryPage: React.FC = () => {
  const params = useParams();
  const countrySlug = params.countrySlug || params['*'];
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  
  const [country, setCountry] = useState<any>(null);
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [mainHeroImage, setMainHeroImage] = useState('');
  const [dealLocations, setDealLocations] = useState<DealLocation[]>([]);
  const [selectedDealLocation, setSelectedDealLocation] = useState('');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!countrySlug) return;
      setLoading(true);
      try {
        const data = await fetchCountryBySlug(countrySlug);
        if (data) {
          setCountry(data);
          const [countryCars, settings, homepageContent, locationSuggestions] = await Promise.all([
            fetchFeaturedCars(data.name),
            fetchSiteSettings(),
            fetchHomepageContent(),
            fetchLocations(data.name)
          ]);
          const cars = countryCars.length > 0 ? countryCars : await fetchFeaturedCars();
          setFeaturedCars(cars);
          setMainHeroImage(resolveAssetUrl(settings?.heroImageUrl || homepageContent?.hero?.backgroundImage || data.heroImage));

          const countryInfo = data.countryInfoJson ? JSON.parse(data.countryInfoJson) : {};
          const airports = data.airportsJson ? JSON.parse(data.airportsJson) : [];
          const popularCities = data.popularCitiesJson ? JSON.parse(data.popularCitiesJson) : [];
          const countryName = (data.name || '').toLowerCase();
          const countryCode = (countryInfo.countryCode || data.countryCode || '').toLowerCase();
          const apiLocations = (locationSuggestions || [])
            .filter((loc: LocationSuggestion) => {
              const haystack = `${loc.label} ${loc.name} ${loc.municipality} ${loc.countryCode}`.toLowerCase();
              return haystack.includes(countryName) || (countryCode && loc.countryCode?.toLowerCase() === countryCode);
            })
            .map((loc: LocationSuggestion) => ({
              label: loc.label,
              value: loc.value,
              type: loc.type
            }));

          const fallbackAirports = (airports.length > 0 ? airports : data.name === 'Jordan' ? ['Queen Alia International Airport (AMM), Amman', 'King Hussein International Airport (AQJ), Aqaba'] : [])
            .map((airport: any) => normalizeLocationLabel(airport))
            .filter(Boolean)
            .map((label: string) => ({ label, value: inferLocationCode(label), type: 'airport' as const }));

          const fallbackCities = (popularCities.length > 0 ? popularCities : data.name === 'Jordan' ? ['Amman Downtown', 'Aqaba City Center'] : [data.name])
            .map((city: any) => normalizeLocationLabel(city))
            .filter(Boolean)
            .map((label: string) => ({ label, value: inferLocationCode(label), type: 'city' as const }));

          const mergedLocations = Array.from(
            new Map([...apiLocations, ...fallbackAirports, ...fallbackCities].map((item) => [item.label, item])).values()
          ).slice(0, 8);

          setDealLocations(mergedLocations);
          setSelectedDealLocation(mergedLocations[0]?.value || data.name);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading country data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [countrySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4">404 - Country Not Found</h1>
        <p className="text-slate-600 mb-8 max-w-md">We couldn't find the destination you're looking for. Try searching on our homepage.</p>
        <button onClick={() => navigate('/')} className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors">
          Go to Homepage
        </button>
      </div>
    );
  }

  const countryInfo = country.countryInfoJson ? JSON.parse(country.countryInfoJson) : {};
  const faqs = country.faqJson ? JSON.parse(country.faqJson) : [];
  const popularCities = country.popularCitiesJson ? JSON.parse(country.popularCitiesJson) : [];
  const airports = country.airportsJson ? JSON.parse(country.airportsJson) : [];

  const handleCarClick = (car: any) => {
    setSelectedCar(car);
    setShowBookingPopup(true);
  };

  const handleLiveSearch = (params: any) => {
    if (!params.pickup || !params.dropoff) {
      alert("Please select a pickup and dropoff location.");
      return;
    }

    const queryParams = new URLSearchParams();
    queryParams.set('pickup', params.pickup);
    if (params.pickupName) queryParams.set('pickupName', params.pickupName);
    if (params.pickupDate) queryParams.set('pickupDate', params.pickupDate);
    if (params.dropoffDate) queryParams.set('dropoffDate', params.dropoffDate);
    if (params.startTime) queryParams.set('startTime', params.startTime);
    if (params.endTime) queryParams.set('endTime', params.endTime);
    if (params.dropoff) queryParams.set('dropoff', params.dropoff);
    if (params.dropoffName) queryParams.set('dropoffName', params.dropoffName);
    setShowBookingPopup(false);
    navigate(`/searching?${queryParams.toString()}`);
  };

  const heroBackgroundImage = mainHeroImage || resolveAssetUrl(country.heroImage);
  const selectedLocation = dealLocations.find((location) => location.value === selectedDealLocation) || dealLocations[0];

  return (
    <div className="bg-white min-h-screen font-sans overflow-x-hidden">
      <SEOMetadata 
        title={country.seoTitle || `Car Rental in ${country.name} | Hogicar`}
        description={country.seoDescription || `Rent a car in ${country.name} with Hogicar. Save up to 70% on your booking.`}
        canonicalUrl={country.canonicalUrl || `https://www.hogicar.com/${country.slug}`}
        preloadImageUrl={heroBackgroundImage}
      />

      {/* Hero Section - Identical to Home */}
      <section className="relative min-h-[500px] lg:min-h-[650px] flex items-center pt-24 pb-12 overflow-visible bg-[#002b70]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {heroBackgroundImage ? (
            <picture>
              <img
                src={heroBackgroundImage}
                alt={`Car rental in ${country.name}`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </picture>
          ) : (
            <div className="w-full h-full bg-[#002b70]"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#002b70]/80 via-transparent to-transparent lg:hidden"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-8 lg:mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg"
            >
              {country.heroHeading || `Car Rental in ${country.name}`}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-white/90 font-medium mb-8 max-w-2xl mx-auto drop-shadow-md"
            >
              {country.heroSubtitle || "Save up to 70% with trusted suppliers"}
            </motion.p>

            {/* Trust Badges - Desktop */}
            <div className="hidden lg:flex items-center justify-center gap-6 mb-8 text-white/90">
              <div className="flex items-center gap-2 text-sm font-bold">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>Free Cancellation</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Shield className="w-5 h-5 text-accent" />
                <span>No Hidden Fees</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Star className="w-5 h-5 text-accent" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Search Widget - same surface as the homepage */}
          <SearchWidget
            onSearch={handleLiveSearch}
          />
        </div>
      </section>

      <TrustedSuppliers />

      {/* Featured Deals Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 mb-4">
                <Zap className="w-4 h-4" />
                Live rates by pickup location
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3">
                Car rental deals in {country.name}
              </h2>
              <p className="text-slate-600 font-medium max-w-2xl">
                Compare practical airport and city-center pickup options, including locations such as Queen Alia International Airport when available.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
              <Plane className="w-5 h-5 text-accent" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured pickup</p>
                <p className="text-sm font-black text-slate-900">{dealLocations[0]?.label || country.name}</p>
              </div>
            </div>
          </div>

          {dealLocations.length > 0 && (
            <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
              {dealLocations.slice(0, 6).map((location) => {
                const isSelected = selectedDealLocation === location.value;
                const Icon = location.type === 'airport' ? Plane : MapPin;

                return (
                  <button
                    key={`${location.value}-${location.label}`}
                    type="button"
                    onClick={() => setSelectedDealLocation(location.value)}
                    className={`shrink-0 flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/15'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-accent'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="max-w-[230px] truncate text-sm font-black">{location.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.length > 0 ? featuredCars.map((car, idx) => (
              <motion.div
                key={car.id || `${car.make}-${car.model}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                onClick={() => handleCarClick(car)}
              >
                {/* Image Section */}
                <div className="relative h-48 sm:h-56 bg-slate-100 flex items-center justify-center p-6 overflow-hidden">
                  <img 
                    src={car.imageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'} 
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 border border-slate-200 shadow-sm">
                    <span className="block max-w-[210px] truncate">{selectedLocation?.label || country.name}</span>
                  </div>
                  {car.dailyRate < 30 && (
                     <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                       Top Deal
                     </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1">{car.make} {car.model}</h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-slate-900">4.8</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4" />
                      <span className="text-xs font-bold">{car.passengers || 5} Seats</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Fuel className="w-4 h-4" />
                      <span className="text-xs font-bold">Automatic</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold">Free Cancellation</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold">Unlimited Mileage</span>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Live rate from</p>
                      <p className="text-2xl font-black text-slate-900">
                        {getCurrencySymbol()}{convertPrice(car.dailyRate).toFixed(0)}
                      </p>
                    </div>
                    <button className="bg-accent text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                      View Deal
                    </button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full rounded-[1.5rem] border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Search className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Run a live search for current availability</h3>
                  <p className="text-slate-600 font-medium mb-6">
                    Preloaded deals are not available for this destination right now. Search by airport or city to retrieve real cars and live rates for your selected dates.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCar(null);
                      setShowBookingPopup(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-accent/20 transition-all hover:brightness-110"
                  >
                    Search live cars <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Country Info Section */}
      <section className="py-20 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                   <Globe className="w-8 h-8 text-accent mb-4" />
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Languages</h4>
                   <p className="text-lg font-black text-slate-900">{countryInfo.languages || 'English / Local'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                   <Wallet className="w-8 h-8 text-accent mb-4" />
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Currency</h4>
                   <p className="text-lg font-black text-slate-900">{countryInfo.currency || 'USD / Local'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                   <Compass className="w-8 h-8 text-accent mb-4" />
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Drive Side</h4>
                   <p className="text-lg font-black text-slate-900">{countryInfo.driveSide || 'Right'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                   <Fuel className="w-8 h-8 text-accent mb-4" />
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Price</h4>
                   <p className="text-lg font-black text-slate-900">{countryInfo.fuelPrice || '$1.45/L'}</p>
                </div>
              </div>

              {/* Text Info */}
              <div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6">Important Information for {country.name}</h2>
                <div className="prose prose-slate prose-lg max-w-none">
                  {country.travelGuideContent ? (
                     <div dangerouslySetInnerHTML={{ __html: country.travelGuideContent }} />
                  ) : (
                    <p className="text-slate-600 font-medium">
                      Planning to rent a car in {country.name}? Here's everything you need to know about driving rules, local requirements, and top attractions to visit.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section (Cities & Airports) */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-black mb-12">Top Pick-up Locations in {country.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto text-left">
            {/* Cities */}
            <div>
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-accent" /> Popular Cities
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {(popularCities.length > 0 ? popularCities : ['Amman', 'Aqaba', 'Petra', 'Jerash', 'Madaba']).map((city: any) => (
                  <button key={normalizeLocationLabel(city)} className="bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-2xl font-bold transition-all text-sm group flex items-center justify-between">
                    {normalizeLocationLabel(city)}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Airports */}
            <div>
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <Plane className="w-6 h-6 text-accent" /> Major Airports
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {(airports.length > 0 ? airports : ['Queen Alia International Airport (AMM)', 'King Hussein International Airport (AQJ)']).map((airport: any) => (
                  <button key={normalizeLocationLabel(airport)} className="bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-2xl font-bold transition-all text-sm group flex items-center justify-between">
                    {normalizeLocationLabel(airport)}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews />

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50 overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-6">
                Car Rental FAQ in {country.name}
              </h2>
              <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                Everything you need to know about hiring a vehicle for your next adventure.
              </p>
            </div>

            <div className="grid gap-4">
              {faqs.map((faq: any, idx: number) => (
                <div 
                  key={idx}
                  className={`bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
                    openFaq === idx ? 'border-accent shadow-xl shadow-accent/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 sm:p-8 text-left"
                  >
                    <span className="text-lg sm:text-xl font-black text-slate-900 pr-8">{faq.question}</span>
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      openFaq === idx ? 'bg-accent text-white rotate-180' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <ChevronDown className="w-6 h-6" />
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-8 sm:px-8 sm:pb-10 pt-2 text-slate-600 text-lg leading-relaxed border-t border-slate-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blogs Section */}
      <LatestTravelGuides title={`Travel Guides for ${country.name}`} country={country.name} />

      {/* CTA Section */}
      <section className="py-20 bg-accent text-white text-center">
        <div className="container mx-auto px-4">
           <h2 className="text-4xl lg:text-6xl font-black mb-6">Ready to start your journey?</h2>
           <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">Book your car in {country.name} today and save up to 70% with Hogicar.</p>
           <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
             className="bg-white text-accent px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
           >
             Search Cars Now
           </button>
        </div>
      </section>

      {/* Booking Popup Modal */}
      <AnimatePresence>
        {showBookingPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingPopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-[1.5rem] shadow-2xl overflow-visible z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-accent mb-2">Live availability search</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                      {selectedCar?.make ? `Search for ${selectedCar.make} ${selectedCar.model}` : `Search live cars in ${country.name}`}
                    </h2>
                    <p className="text-slate-500 font-bold flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-accent" /> Type any airport or city, then choose dates to see real results
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowBookingPopup(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {selectedCar && (
                  <div className="bg-slate-50 rounded-2xl p-5 mb-6 flex items-center gap-5 border border-slate-100">
                    <div className="w-32 h-20 shrink-0">
                      <img src={selectedCar.imageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'} alt={selectedCar.make} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-black text-slate-900">{selectedCar.make} {selectedCar.model}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> 5</span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Fuel className="w-3 h-3" /> Auto</span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-accent" /> Free Cancellation</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[1.25rem] bg-slate-900 p-4 sm:p-5">
                   <SearchWidget onSearch={handleLiveSearch} />
                   <p className="mt-4 text-center text-xs font-bold text-white/60">
                     Results are loaded from live availability for the location and dates you select.
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountryPage;
