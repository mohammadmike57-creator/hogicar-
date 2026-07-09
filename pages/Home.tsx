import * as React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    CheckCircle, Shield, Tag, ChevronDown, Globe, ArrowRight, Star, Award, 
    Search as SearchIcon, FileSymlink, BookCheck, MapPin, Mail, Sparkles, Zap, 
    FileText, User, Plane, Building, Car, Fuel, ParkingCircle, Compass, Calendar,
    Quote, ShieldCheck, Clock, ChevronUp
} from 'lucide-react';
import { TRUSTED_BRANDS } from '../constants';
import SEOMetadata from '../components/SEOMetadata';
import Reviews from '../components/Reviews';
import TrustedSuppliers from '../components/TrustedSuppliers';
import LatestTravelGuides from '../components/LatestTravelGuides';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { fetchLocations, fetchPublicSuppliers, fetchHomepageLogos, fetchSiteSettings, fetchHomepageContent } from '../api';
import { LocationSuggestion } from '../api';
import { API_BASE_URL } from '../lib/config';

const normalizeHomepageContent = (content: any) => {
  const safeContent = content && typeof content === 'object' ? content : {};
  const safePopular = safeContent.popularDestinations && typeof safeContent.popularDestinations === 'object'
    ? safeContent.popularDestinations
    : {};

  const normalizeDestinationImage = (destination: any) => {
    const image = typeof destination?.image === 'string' ? destination.image.trim() : '';
    if (image) return image;

    const legacyImage = typeof destination?.imageUrl === 'string' ? destination.imageUrl.trim() : '';
    if (legacyImage) return legacyImage;

    return '';
  };

  const hasDestinationsArray = Array.isArray(safePopular.destinations);
  const hasFeaturesArray = Array.isArray(safeContent.features);

  const destinations = hasDestinationsArray
    ? safePopular.destinations
        .map((destination: any, index: number) => ({
          id: destination?.id || `d${index + 1}`,
          name: destination?.name || '',
          country: destination?.country || '',
          price: Number(destination?.price) || 0,
          image: normalizeDestinationImage(destination)
        }))
        .filter((destination: any) => destination.name || destination.country || destination.image || destination.price > 0)
    : [];

  const features = hasFeaturesArray
    ? safeContent.features
        .map((f: any, index: number) => ({
          id: f?.id || `f${index + 1}`,
          icon: f?.icon || 'CheckCircle',
          title: f?.title || '',
          description: f?.description || ''
        }))
    : [];

  return {
    ...safeContent,
    features,
    hero: {
      title: 'Car Hire – Search, Compare & Save',
      subtitle: 'Free cancellations on most bookings',
      backgroundImage: '',
      ...(safeContent.hero || {})
    },
    howItWorks: {
      title: 'Get Your Perfect Car in 3 Easy Steps',
      subtitle: 'A streamlined rental flow from search to confirmation, built for clear prices, trusted suppliers, and fast booking.',
      steps: [
        {
          id: 'search',
          icon: 'Search',
          title: 'Search your trip',
          description: 'Choose your pickup location, dates, and times to see cars that match your exact journey.'
        },
        {
          id: 'compare',
          icon: 'Shield',
          title: 'Compare with confidence',
          description: 'Review supplier ratings, vehicle details, deposits, and policies before you decide.'
        },
        {
          id: 'book',
          icon: 'BookCheck',
          title: 'Book securely',
          description: 'Reserve online and receive your booking details with clear pickup instructions.'
        }
      ],
      ...(safeContent.howItWorks || {}),
    },
    faqs: {
      title: 'Frequently Asked Questions',
      items: [],
      ...(safeContent.faqs || {}),
    },
    popularDestinations: {
      title: 'Popular Destinations',
      ...safePopular,
      destinations
    }
  };
};

interface HomeProps {
  seoConfig?: any;
}

const PopularCarsSection = ({ destination }: { destination?: string }) => {
    // Semi-dynamic placeholder data for professional look
    const cars = [
        { name: 'Economy', model: 'Hyundai Accent', price: '25', image: 'https://cdn.pixabay.com/photo/2016/04/01/12/16/car-1300629_1280.png', type: 'Economy' },
        { name: 'Compact', model: 'Toyota Corolla', price: '30', image: 'https://cdn.pixabay.com/photo/2012/04/13/20/45/car-33568_1280.png', type: 'Compact' },
        { name: 'SUV', model: 'Kia Sportage', price: '45', image: 'https://cdn.pixabay.com/photo/2016/04/01/12/16/car-1300629_1280.png', type: 'SUV' },
        { name: 'Luxury', model: 'Mercedes C-Class', price: '85', image: 'https://cdn.pixabay.com/photo/2012/04/13/20/45/car-33568_1280.png', type: 'Luxury' }
    ];

    return (
        <section className="py-16 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Popular Cars in {destination || 'this destination'}</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Most booked vehicle types in the last 30 days</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cars.map((car, i) => (
                        <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-1 block">{car.type}</span>
                                    <h3 className="font-extrabold text-slate-900">{car.model}</h3>
                                </div>
                                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    From ${car.price}/day
                                </div>
                            </div>
                            <div className="aspect-[16/10] mb-4 overflow-hidden rounded-2xl bg-slate-50 flex items-center justify-center p-4">
                                <img src={car.image} alt={car.model} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex gap-2 text-slate-400">
                                    <div className="flex items-center gap-1"><User className="w-3 h-3" /> <span className="text-[10px] font-black">5</span></div>
                                    <div className="flex items-center gap-1"><Zap className="w-3 h-3" /> <span className="text-[10px] font-black">Auto</span></div>
                                </div>
                                <button className="text-accent font-black text-[11px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                    View Offers <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const DestinationTips = ({ destination, seoConfig }: { destination?: string, seoConfig?: any }) => {
    const tips = [
        { icon: <Car className="w-5 h-5 text-accent" />, title: 'Rental Tips', content: 'Book in advance to secure the best rates and wide selection of vehicles.' },
        { icon: <Compass className="w-5 h-5 text-amber-500" />, title: 'Driving Tips', content: 'Always carry your international driving permit and follow local speed limits.' },
        { icon: <ParkingCircle className="w-5 h-5 text-emerald-600" />, title: 'Parking', content: 'Look for designated blue/white parking zones or use secure paid parking garages.' },
        { icon: <Fuel className="w-5 h-5 text-rose-500" />, title: 'Fuel Information', content: 'Most cars take Unleaded 95. Fill up before returning to avoid extra charges.' }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {tips.map((tip, i) => (
                        <div key={i} className="flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm border border-slate-100">
                                {tip.icon}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{tip.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                {tip.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const NearbyLocations = ({ destination, seoConfig }: { destination?: string, seoConfig?: any }) => {
    // If we have destination from SEO title, use it.
    const dest = destination || (seoConfig?.title ? seoConfig.title.replace('Car Rental in ', '') : 'this destination');

    return (
        <section className="py-16 bg-slate-50 border-y border-slate-200/50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                            <Plane className="w-5 h-5 text-accent" /> Nearby Airports
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[`${dest} Airport`, 'Queen Alia Airport (AMM)', 'International Airport'].map((loc, i) => (
                                <button key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-accent transition-all text-left group">
                                    <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-accent/10 transition-colors"><MapPin className="w-4 h-4 text-slate-400 group-hover:text-accent" /></div>
                                    <span className="text-sm font-extrabold text-slate-700">{loc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                            <Building className="w-5 h-5 text-accent" /> Nearby Cities
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[`${dest} Downtown`, 'Old City', 'Business District', 'Coastal Area'].map((loc, i) => (
                                <button key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-accent transition-all text-left group">
                                    <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-accent/10 transition-colors"><MapPin className="w-4 h-4 text-slate-400 group-hover:text-accent" /></div>
                                    <span className="text-sm font-extrabold text-slate-700">{loc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Home: React.FC<HomeProps> = ({ seoConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const { convertPrice, getCurrencySymbol } = useCurrency();
  
  const [locationsOptions, setLocationsOptions] = React.useState<LocationSuggestion[]>([]);
  const [pickupCode, setPickupCode] = React.useState<string>('');
  const [dropoffCode, setDropoffCode] = React.useState<string>('');
  const [pickupName, setPickupName] = React.useState<string>('');
  const [dropoffName, setDropoffName] = React.useState<string>('');
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [heroImageUrl, setHeroImageUrl] = React.useState<string>('');
  const [homepageContent, setHomepageContent] = React.useState<any>(normalizeHomepageContent(null));

  const isCustomLanding = !!seoConfig;

  const builderConfig = React.useMemo(() => {
    if (!seoConfig?.contentJson) return null;
    try {
      return JSON.parse(seoConfig.contentJson);
    } catch (e) {
      return null;
    }
  }, [seoConfig]);

  const sections = {
    hero: seoConfig?.showHero ?? true,
    search: seoConfig?.showSearch ?? true,
    promotions: seoConfig?.showPromotions ?? true,
    suppliers: seoConfig?.showSuppliers ?? true,
    benefits: seoConfig?.showBenefits ?? true,
    reviews: seoConfig ? seoConfig.showReviews : !!homepageContent?.showReviews,
    faq: seoConfig?.showFaq ?? true,
    content: seoConfig?.showSeoContent ?? true,
    relatedBlogs: seoConfig?.showSeoContent ?? true,
    popularDestinations: seoConfig?.showRelatedDestinations ?? true,
    featuredCars: seoConfig?.showFeaturedCars ?? true,
    cta: true
  };

  const customStyles = {
    primaryColor: seoConfig?.primaryColor || '#007ac2',
    secondaryColor: seoConfig?.secondaryColor || '#ffffff',
    buttonColor: seoConfig?.buttonColor || '#007ac2',
    backgroundColor: seoConfig?.backgroundColor || '#ffffff',
    accentColor: seoConfig?.accentColor || '#007ac2',
    textColor: seoConfig?.heroTextColor || '#0f172a'
  };
  
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSiteSettings();
        if (settings && settings.heroImageUrl) {
          setHeroImageUrl(settings.heroImageUrl);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    const loadLocations = async () => {
      try {
        const options = await fetchLocations('');
        setLocationsOptions(options);
        
        let targetOption = null;

        // 1. Explicit prefill from builder config
        if (sections.search?.pickupPrefill) {
           const prefill = sections.search.pickupPrefill.toLowerCase();
           targetOption = options.find(o => 
             o.name.toLowerCase().includes(prefill) || 
             o.label.toLowerCase().includes(prefill) ||
             o.value.toLowerCase() === prefill
           );
        }

        // 2. Heuristic pre-fill based on SEO config or current route
        if (!targetOption && seoConfig) {
          // DISABLED per redesign requirements: DO NOT automatically fill locations
          /*
          const lowerRoute = (seoConfig.route || '').toLowerCase();
          const lowerTitle = (seoConfig.title || '').toLowerCase();
          
          targetOption = options.find(o => {
            const name = (o.name || '').toLowerCase();
            const muni = (o.municipality || '').toLowerCase();
            const iata = (o.iataCode || '').toLowerCase();
            
            return (name.length > 3 && lowerRoute.includes(name)) || 
                   (muni.length > 3 && lowerRoute.includes(muni)) ||
                   (iata.length === 3 && lowerRoute.includes(iata)) ||
                   (name.length > 3 && lowerTitle.includes(name));
          });
          */
        }

        if (!targetOption && !seoConfig) {
            targetOption = options.find(o => o.value === 'AMM');
        }

        if (targetOption) {
            setPickupName(targetOption.label);
            setPickupCode(targetOption.value);
            setDropoffName(targetOption.label);
            setDropoffCode(targetOption.value);
        }
      } catch (error) {
         console.error("Failed to load locations on homepage:", error);
      }
    };
    
    const loadSuppliers = async () => {
        try {
            const [realSuppliers, homepageLogos] = await Promise.all([
                fetchPublicSuppliers(),
                fetchHomepageLogos()
            ]);
            
            let allLogos: any[] = [];
            
            // 1. Add admin-managed homepage logos first
            if (homepageLogos && homepageLogos.length > 0) {
                allLogos = homepageLogos.map(l => ({
                    name: l.name,
                    logo: l.logoUrl,
                    scale: l.scale,
                    mobileScale: l.mobileScale,
                    spacing: l.spacing
                }));
            }
            
            // Fallback to global brands ONLY if no logos are configured at all
            if (allLogos.length === 0) {
                allLogos = TRUSTED_BRANDS;
            }
            
            setSuppliers(allLogos);
        } catch (error) {
            console.error('Error loading home suppliers:', error);
            setSuppliers(TRUSTED_BRANDS);
        }
    };

    const loadHomepageData = async () => {
      try {
        const contentData = await fetchHomepageContent();
        const normalized = normalizeHomepageContent(contentData);
        setHomepageContent(normalized);
        if (normalized?.hero?.backgroundImage && !heroImageUrl) {
          setHeroImageUrl(normalized.hero.backgroundImage);
        }
      } catch (error) {
        console.error('Error loading homepage content:', error);
      }
    };

    loadSettings();
    loadLocations();
    loadSuppliers();
    loadHomepageData();
  }, [seoConfig, location.pathname]);

  const handleSearch = (params: any) => {
    if (!params.pickup || !params.dropoff) {
      alert("Please select a pickup and dropoff location.");
      return;
    }
    const { pickup, pickupName, dropoff, dropoffName, pickupDate, dropoffDate, startTime, endTime } = params;
    const searchParams = new URLSearchParams();
    searchParams.set('pickup', pickup);
    if(pickupName) searchParams.set('pickupName', pickupName);
    if(pickupDate) searchParams.set('pickupDate', pickupDate);
    if(dropoffDate) searchParams.set('dropoffDate', dropoffDate);
    if(startTime) searchParams.set('startTime', startTime);
    if(endTime) searchParams.set('endTime', endTime);
    if(dropoff) searchParams.set('dropoff', dropoff);
    if(dropoffName) searchParams.set('dropoffName', dropoffName);
    navigate(`/searching?${searchParams.toString()}`);
  };

  const scrollToSearchWidget = () => {
    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
  const content = homepageContent;
  
  const faqs = React.useMemo(() => {
    if (seoConfig?.faqJson) {
      try {
        const parsed = JSON.parse(seoConfig.faqJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse FAQ JSON from SEO config:", e);
      }
    }
    return content.faqs.items;
  }, [seoConfig, content.faqs.items]);

  const destinations = content.popularDestinations.destinations;
  const [heroLoaded, setHeroLoaded] = React.useState(false);
  // THE HERO IMAGE SHOULD NEVER CHANGE per redesign requirements
  const heroBackgroundImage = content.hero.backgroundImage || (heroImageUrl?.startsWith('/') && !heroImageUrl?.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl);
  const heroMobileImage = heroBackgroundImage;
  const heroVideo = seoConfig?.heroVideo || content.hero.video;
  const heroOverlayOpacity = seoConfig?.heroOverlayOpacity ?? 0.4;
  const heroTextColor = seoConfig?.heroTextColor || content.hero.textColor || '#FFFFFF';
  const heroButtonText = seoConfig?.heroButtonText || content.hero.buttonText;
  const heroButtonLink = seoConfig?.heroButtonLink || content.hero.buttonLink || '#search';
  const heroPromotion = {
    active: !!seoConfig?.heroPromotionActive && !!seoConfig?.heroPromotionText,
    text: seoConfig?.heroPromotionText || '',
    link: seoConfig?.heroPromotionLink || '',
    color: seoConfig?.heroPromotionColor || '#E11D48'
  };

  const displayH1 = seoConfig?.h1Title || content.hero.title || 'Search, Compare & Save on Car Rentals';
  const displaySubtitle = seoConfig?.heroSubtitle || seoConfig?.introText || content.hero.subtitle || 'Compare prices from 900+ car rental suppliers worldwide with transparent pricing and flexible terms.';

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search: SearchIcon, FileSymlink, BookCheck, CheckCircle, Shield, Sparkles, Zap, MapPin, Mail, ArrowRight
  };

  const processSteps = Array.isArray(content.howItWorks.steps) ? content.howItWorks.steps : [];
  const processDetails = [
    'Live location and date matching',
    'Transparent terms before payment',
    'Confirmation sent after booking'
  ];

  const accentColor = customStyles.accentColor;
  const backgroundColor = customStyles.backgroundColor;
  const textColor = customStyles.textColor;
  const primaryColor = customStyles.primaryColor;
  const buttonColor = customStyles.buttonColor;

  const relatedBlogs = React.useMemo(() => {
    if (!seoConfig?.relatedBlogsJson) return [];
    try {
      return JSON.parse(seoConfig.relatedBlogsJson);
    } catch (e) {
      return [];
    }
  }, [seoConfig]);

  return (
    <div className="bg-white font-sans">
      <SEOMetadata
        title={seoConfig?.title}
        description={seoConfig?.description}
        keywords={seoConfig?.keywords}
        canonicalUrl={seoConfig?.canonicalUrl}
        ogImage={seoConfig?.ogImage}
        noIndex={seoConfig ? !seoConfig.indexable : undefined}
        structuredData={seoConfig?.structuredData}
      />
      
      {/* 1. HERO & 2. SEARCH WIDGET */}
      {sections.hero && (
        <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-10 lg:pt-32 lg:pb-24 text-white overflow-hidden" style={{ color: heroTextColor }}>
          <div className="absolute inset-0 z-0">
            {heroVideo ? (
              <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover"
                onCanPlay={() => setHeroLoaded(true)}
              >
                <source src={heroVideo} type="video/mp4" />
              </video>
            ) : heroBackgroundImage && (
              <picture>
                <source media="(max-width: 640px)" srcSet={heroMobileImage} />
                <img 
                  key={heroBackgroundImage}
                  src={heroBackgroundImage} 
                  className={`w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
                  alt={displayH1}
                  onLoad={() => setHeroLoaded(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    setHeroLoaded(true);
                  }}
                />
              </picture>
            )}
            {!heroLoaded && !heroVideo && (
              <div className="absolute inset-0 bg-[#003580]/80 animate-pulse"></div>
            )}
            {!heroBackgroundImage && !heroVideo && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#003580]/90 via-[#003580]/80 to-[#003580]/95 backdrop-blur-[1px]"></div>
            )}
            <div className="absolute inset-0 bg-black" style={{ opacity: heroOverlayOpacity }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-3 lg:mb-6 leading-[1.1] tracking-tight drop-shadow-lg max-w-4xl mx-auto uppercase">
              {displayH1}
            </h1>
            <p className="text-blue-50/90 mb-6 lg:mb-12 max-w-xl mx-auto text-[13px] sm:text-base lg:text-lg font-bold leading-relaxed px-2">
              {displaySubtitle}
            </p>
            
            {sections.search && (
              <div id="search" className="relative z-20 mt-1 scroll-mt-24 lg:mt-0">
                <SearchWidget
                  onSearch={handleSearch}
                  showTitle={false}
                  initialValues={{
                    pickup: pickupCode,
                    pickupName: pickupName,
                    dropoff: dropoffCode,
                    dropoffName: dropoffName
                  }}
                  accentColor={accentColor}
                  style={seoConfig?.searchWidgetStyle}
                  customColor={seoConfig?.searchWidgetColor}
                  buttonColor={seoConfig?.searchWidgetButtonColor}
                  prioritizeHint={seoConfig?.title}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. POPULAR CARS */}
      <PopularCarsSection destination={displayH1.replace('Car Rental in ', '')} />

      {/* 4. POPULAR SUPPLIERS */}
      {sections.suppliers && (
        <TrustedSuppliers />
      )}

      {/* 5. WHY CHOOSE HOGICAR */}
      {sections.benefits && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Why Choose HogiCar?</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">The smartest way to rent a car</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {content.features.slice(0, 4).map((feature, i) => {
                        const Icon = iconMap[feature.icon] || CheckCircle;
                        return (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:bg-accent group-hover:text-white transition-colors">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-3 uppercase tracking-tight">{feature.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
          </section>
      )}

      {/* 6. CUSTOMER REVIEWS */}
      {sections.reviews && (
        <Reviews 
          customReviews={seoConfig ? builderConfig?.sections?.reviews?.items : homepageContent?.selectedReviews}
          accentColor={customStyles.accentColor}
        />
      )}

      {/* 7. DESTINATION INFORMATION (Unique Content) */}
      {sections.content && (seoConfig?.content || builderConfig?.sections?.content?.html || builderConfig?.sections?.content?.text || builderConfig?.html || builderConfig?.text) && (
        <section id="main-seo-content" className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4">
            <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900">
              {seoConfig?.content ? (
                <div dangerouslySetInnerHTML={{ __html: seoConfig.content }} />
              ) : (builderConfig?.sections?.content?.html || builderConfig?.html) ? (
                <div dangerouslySetInnerHTML={{ __html: builderConfig?.sections?.content?.html || builderConfig?.html }} />
              ) : (
                <div className="whitespace-pre-wrap text-slate-600">{builderConfig?.sections?.content?.text || builderConfig?.text}</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 8, 9, 10, 11. TIPS SECTIONS */}
      <DestinationTips destination={displayH1.replace('Car Rental in ', '')} />

      {/* 12, 13. NEARBY AIRPORTS & CITIES */}
      <NearbyLocations destination={seoConfig?.destinationName} seoConfig={seoConfig} />

      {/* 14. FREQUENTLY ASKED QUESTIONS */}
      {sections.faq && (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Frequently Asked Questions</h2>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Everything you need to know about renting in {displayH1.replace('Car Rental in ', '')}</p>
            </div>

            <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={faq.id || index} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all">
                    <button 
                      onClick={() => toggleFaq(index)} 
                      className="w-full flex justify-between items-center text-left p-6 focus:outline-none group"
                    >
                      <span className="font-black text-slate-900 group-hover:text-accent transition-colors uppercase tracking-tight">{faq.question}</span>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180 text-accent' : 'text-slate-400'}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className="p-6 pt-0 text-slate-600 leading-relaxed font-medium border-t border-slate-200/50 mt-2">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* 15. RELATED ARTICLES */}
      <LatestTravelGuides 
        variant={isCustomLanding ? 'DEFAULT' : 'HOMEPAGE'}
        route={seoConfig?.route || '/'} 
        destination={seoConfig?.destinationName}
        country={seoConfig?.countryTag} 
        airport={seoConfig?.airportTags}
        limit={isCustomLanding ? 3 : 6} 
      />

      {/* FOOTER is outside the Home component usually or at the bottom of the main layout. 
          Assuming Newsletter section is the last part before the real footer. */}
      {sections.cta && (
        <section className="py-16 bg-slate-950 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight">Get Exclusive Car Rental Deals</h2>
            <p className="text-slate-400 mb-10 font-bold uppercase text-sm tracking-widest">Join 10,000+ travelers receiving insider offers</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent"
                />
                <button type="submit" className="bg-accent hover:brightness-110 text-white font-black px-8 py-4 rounded-2xl transition-all uppercase tracking-widest text-xs">
                    Join Now
                </button>
            </form>
          </div>
        </section>
      )}

      {/* 16. POPULAR DESTINATIONS (Extra, not explicitly requested in order but good for SEO internal linking) */}
      {!isCustomLanding && sections.popularDestinations && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
             <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                 <div>
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Popular Destinations</h2>
                     <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Explore our most booked locations</p>
                 </div>
                 <Link to="/search" className="text-accent font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                     View All <ArrowRight className="w-4 h-4" />
                 </Link>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                 {destinations.slice(0, 5).map((dest, index) => (
                    <Link to={`/search?location=${encodeURIComponent(dest.name)}`} key={index} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-900">
                        <img src={dest.image} alt={dest.name} className="h-full w-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">{dest.name}</h4>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">{dest.country}</p>
                        </div>
                    </Link>
                 ))}
             </div>
          </div>
        </section>
      )}

    </div>
  );
};
export default Home;
