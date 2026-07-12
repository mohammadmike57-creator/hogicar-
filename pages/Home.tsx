import * as React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    CheckCircle, Shield, Tag, ChevronDown, Globe, ArrowRight, Star, Award, 
    Search as SearchIcon, FileSymlink, BookCheck, MapPin, Mail, Sparkles, Zap, 
    FileText, User, Car, Fuel, ParkingCircle, Compass, Calendar,
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

  const features = hasFeaturesArray && safeContent.features.length > 0
    ? safeContent.features
        .map((f: any, index: number) => ({
          id: f?.id || `f${index + 1}`,
          icon: f?.icon || 'CheckCircle',
          title: f?.title || '',
          description: f?.description || ''
        }))
    : [
        {
          id: 'f1',
          icon: 'Shield',
          title: '900+ Suppliers',
          description: 'Compare deals from over 900 global and local car rental companies in one place.'
        },
        {
          id: 'f2',
          icon: 'MapPin',
          title: '60,000+ Locations',
          description: 'Pick up your car at airports, city centers, and stations in over 160 countries.'
        },
        {
          id: 'f3',
          icon: 'Zap',
          title: 'Free Cancellation',
          description: 'Flexible bookings with free cancellation on most rentals up to 48 hours before pickup.'
        },
        {
          id: 'f4',
          icon: 'ShieldCheck',
          title: 'No Hidden Fees',
          description: 'Transparent pricing with all mandatory taxes and fees included in the final price.'
        },
        {
          id: 'f5',
          icon: 'Clock',
          title: '24/7 Support',
          description: 'Our customer excellence team is available around the clock to assist you anywhere.'
        },
        {
          id: 'f6',
          icon: 'BookCheck',
          title: 'Secure Payments',
          description: 'Safe and encrypted payment processing for your peace of mind.'
        },
        {
          id: 'f7',
          icon: 'Star',
          title: 'Verified Reviews',
          description: 'Read authentic experiences from millions of customers to help you decide.'
        },
        {
          id: 'f8',
          icon: 'Award',
          title: 'Trusted Partners',
          description: 'We only work with established, reputable suppliers to ensure quality service.'
        }
      ];

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

        /* 
        DISABLED: Leave Pickup/Dropoff Location EMPTY as per redesign requirements.
        if (!targetOption && !seoConfig) {
            targetOption = options.find(o => o.value === 'AMM');
        }

        if (targetOption) {
            setPickupName(targetOption.label);
            setPickupCode(targetOption.value);
            setDropoffName(targetOption.label);
            setDropoffCode(targetOption.value);
        }
        */
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
  // THE HERO IMAGE SHOULD NEVER CHANGE per redesign requirements: USE THE GLOBAL SITE SETTINGS IMAGE ONLY
  const heroBackgroundImage = (heroImageUrl?.startsWith('/') && !heroImageUrl?.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl) || content.hero.backgroundImage;
  const isLocalHero = heroBackgroundImage?.includes('/uploads/hero/');
  const heroWebpSrcSet = isLocalHero ? 
    `${heroBackgroundImage.replace('.webp', '_thumb.webp')} 400w, ${heroBackgroundImage.replace('.webp', '_medium.webp')} 800w, ${heroBackgroundImage.replace('.webp', '_large.webp')} 1600w` 
    : undefined;
  const heroPngSrcSet = isLocalHero ? 
    `${heroBackgroundImage.replace('.webp', '_thumb.png')} 400w, ${heroBackgroundImage.replace('.webp', '_medium.png')} 800w, ${heroBackgroundImage.replace('.webp', '_large.png')} 1600w` 
    : undefined;
  
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
        preloadImageUrl={heroBackgroundImage}
        preloadImageSrcSet={heroWebpSrcSet || heroPngSrcSet}
      />
      
      {/* 1. HERO & 2. SEARCH WIDGET */}
      {sections.hero && (
        <section className="relative z-30 pt-20 pb-12 sm:pt-20 sm:pb-10 lg:pt-32 lg:pb-24 text-white overflow-visible min-h-0 flex flex-col justify-start sm:justify-center bg-[#0052cc] sm:bg-transparent" style={{ color: heroTextColor }}>
          <div className="absolute inset-0 z-0 hidden sm:block">
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
                {isLocalHero && (
                    <source 
                        type="image/webp" 
                        srcSet={heroWebpSrcSet} 
                        sizes="100vw"
                    />
                )}
                <img 
                  key={heroBackgroundImage}
                  src={heroBackgroundImage}
                  srcSet={heroPngSrcSet}
                  sizes="100vw"
                  className={`w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
                  alt={displayH1}
                  fetchPriority="high"
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
            <h1 className="text-xl sm:text-3xl lg:text-5xl font-black mb-3 lg:mb-6 leading-[1.1] tracking-tight drop-shadow-lg max-w-4xl mx-auto uppercase px-4">
              {displayH1}
            </h1>
            <p className="text-blue-50/90 mb-6 lg:mb-12 max-w-xl mx-auto text-sm sm:text-base lg:text-lg font-bold leading-relaxed px-6">
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
                />
                
                {/* Mobile Features Bar */}
                <div className="lg:hidden mt-8 flex flex-wrap justify-center gap-3 px-4">
                    {[
                        { icon: Shield, text: 'Fully Insured' },
                        { icon: Zap, text: 'Free Cancellation' },
                        { icon: CheckCircle, text: 'No Hidden Fees' },
                        { icon: Clock, text: '24/7 Support' }
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                            <f.icon className="w-3.5 h-3.5 text-blue-200" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{f.text}</span>
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}


      {/* 4. POPULAR SUPPLIERS */}
      {sections.suppliers && (
        <TrustedSuppliers />
      )}

      {/* 4.5 POPULAR COUNTRIES */}
      {!isCustomLanding && (
        <section className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Top Destinations Worldwide</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Explore car rental options in over 160 countries</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {[
                        { name: 'United Arab Emirates', code: 'AE', count: '1,200+', flag: '🇦🇪' },
                        { name: 'Jordan', code: 'JO', count: '800+', flag: '🇯🇴' },
                        { name: 'Saudi Arabia', code: 'SA', count: '950+', flag: '🇸🇦' },
                        { name: 'Oman', code: 'OM', count: '400+', flag: '🇴🇲' },
                        { name: 'Qatar', code: 'QA', count: '300+', flag: '🇶🇦' },
                        { name: 'Kuwait', code: 'KW', count: '250+', flag: '🇰🇼' },
                    ].map((country) => (
                        <Link key={country.code} to={`/search?country=${country.name}`} className="group flex flex-col items-center p-6 rounded-3xl bg-slate-50 hover:bg-blue-600 transition-all duration-300 border border-slate-100 hover:border-blue-600 hover:-translate-y-1">
                            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{country.flag}</span>
                            <span className="font-black text-[12px] text-slate-900 group-hover:text-white uppercase tracking-tighter text-center">{country.name}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-blue-100 font-bold mt-1 uppercase">{country.count} Cars</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* 4.6 SMART RENTAL GUIDE */}
      {!isCustomLanding && (
        <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 skew-x-12 translate-x-20" />
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <p className="text-blue-400 font-black uppercase text-sm tracking-[0.2em] mb-4">Rental Intelligence</p>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] uppercase tracking-tighter mb-8">
                            How to get the <span className="text-blue-500">absolute best</span> car rental deal
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { title: 'Book 2 Weeks Early', desc: 'Secure your vehicle at least 14 days before pickup to save up to 40% on peak season rates.' },
                                { title: 'Full-to-Full Policy', desc: 'Always choose full-to-full fuel policies to avoid hidden service charges and high fuel prices.' },
                                { title: 'Check Insurance', desc: 'Verify what is included in your CDW. Sometimes booking full cover online is 50% cheaper than at the desk.' },
                                { title: 'Unlimited Mileage', desc: 'For road trips, ensure unlimited mileage is included to avoid expensive per-km charges later.' },
                            ].map((tip, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-black text-lg">{i+1}</div>
                                    <h4 className="font-black text-white uppercase text-sm tracking-tight">{tip.title}</h4>
                                    <p className="text-slate-400 text-xs font-bold leading-relaxed">{tip.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-blue-600 blur-[120px] opacity-20" />
                        <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                             <img 
                                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800" 
                                alt="Driver enjoying car rental" 
                                className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                             <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                                 <div className="flex -space-x-3">
                                     {[1,2,3,4].map(i => (
                                         <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden">
                                             <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                         </div>
                                     ))}
                                 </div>
                                 <div className="text-right">
                                     <p className="text-white font-black text-sm uppercase">10k+ Daily Bookings</p>
                                     <div className="flex gap-1 justify-end mt-1">
                                         {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-blue-500 text-blue-500" />)}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* 4.7 GLOBAL REACH */}
      {!isCustomLanding && (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Partners', value: '900+', sub: 'Global & Local Suppliers' },
                        { label: 'Locations', value: '60,000+', sub: 'In 160+ Countries' },
                        { label: 'Reviews', value: '2M+', sub: 'Verified Customer Ratings' },
                        { label: 'Support', value: '24/7', sub: 'In 30+ Languages' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                            <div className="text-3xl md:text-4xl font-black text-blue-600 mb-2 tracking-tighter">{stat.value}</div>
                            <div className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-1">{stat.label}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{stat.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* 5. WHY CHOOSE HOGICAR */}
      {sections.benefits && (
          <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-center md:text-left">
                    <div className="max-w-2xl mx-auto md:mx-0">
                        <p className="text-accent font-black uppercase text-sm tracking-[0.2em] mb-4">The HogiCar Advantage</p>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">
                            Why Travelers <span className="text-accent">Choose Us</span> Over Others
                        </h2>
                    </div>
                    <div className="hidden md:block pb-2">
                        <Link to="/about" className="group flex items-center gap-2 text-slate-900 font-black uppercase text-sm tracking-widest hover:text-accent transition-colors">
                            Learn more about us <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {content.features.map((feature, i) => {
                        const Icon = iconMap[feature.icon] || CheckCircle;
                        return (
                            <div key={i} className="relative p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-accent/5 transition-colors duration-500" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 text-slate-900">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-none">{feature.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed font-bold">{feature.description}</p>
                                </div>
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
