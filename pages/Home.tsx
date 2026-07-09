import * as React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    CheckCircle, Shield, Tag, ChevronDown, Globe, ArrowRight, Star, Award, 
    Search as SearchIcon, FileSymlink, BookCheck, MapPin, Mail, Sparkles, Zap, 
    FileText, User, Car, Fuel, ParkingCircle, Compass, Calendar,
    Quote, ShieldCheck, Clock, ChevronUp, HelpCircle, Check
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
        <section className="relative z-30 pt-28 pb-8 sm:pt-32 sm:pb-10 lg:pt-40 lg:pb-24 text-white overflow-visible" style={{ color: heroTextColor }}>
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

          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-4 lg:mb-8 leading-[1.05] tracking-tight drop-shadow-2xl max-w-3xl mx-auto uppercase">
              {displayH1}
            </h1>
            <p className="text-white mb-8 lg:mb-14 max-w-lg mx-auto text-[14px] sm:text-base lg:text-xl font-bold leading-relaxed px-2 opacity-90">
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


      {/* 4. POPULAR SUPPLIERS */}
      {sections.suppliers && (
        <TrustedSuppliers />
      )}

      {/* 5. WHY CHOOSE HOGICAR */}
      {sections.benefits && (
          <section className="py-24 bg-[#003580] relative overflow-hidden">
            {/* Background elements for richness */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/3 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
                            <Star className="w-4 h-4 text-amber-400 fill-current" />
                            <span className="text-white text-xs font-black uppercase tracking-widest">Top Rated Comparison</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight leading-none">Why Choose HogiCar?</h2>
                        <p className="text-blue-100 text-lg font-medium leading-relaxed mb-8 opacity-80">
                            We combine cutting-edge technology with world-class support to give you the best car rental experience on the planet.
                        </p>
                        <div className="flex flex-col gap-4">
                            {[
                                'No hidden fees or surprises',
                                'Free cancellation on most cars',
                                '24/7 Premium customer support',
                                'Secure encrypted payments'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-white font-bold uppercase text-[10px] tracking-widest">
                                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {content.features.slice(0, 4).map((feature, i) => {
                            const Icon = iconMap[feature.icon] || CheckCircle;
                            const colors = [
                                'from-blue-500/20 to-blue-600/20',
                                'from-emerald-500/20 to-emerald-600/20',
                                'from-amber-500/20 to-amber-600/20',
                                'from-rose-500/20 to-rose-600/20'
                            ];
                            const iconColors = [
                                'text-blue-400',
                                'text-emerald-400',
                                'text-amber-400',
                                'text-rose-400'
                            ];
                            
                            return (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-7 h-7 ${iconColors[i % iconColors.length]}`} />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">{feature.title}</h3>
                                    <p className="text-blue-100/70 text-sm leading-relaxed font-medium">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
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


      {/* 14. FREQUENTLY ASKED QUESTIONS */}
      {sections.faq && (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl mb-6 border border-slate-100">
                <HelpCircle className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-none">Questions? We Have Answers.</h2>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Everything you need to know about renting with HogiCar in {displayH1.replace('Car Rental in ', '')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {faqs.map((faq, index) => (
                  <div 
                    key={faq.id || index} 
                    className={`group rounded-[2rem] border transition-all duration-500 ${
                      openFaqIndex === index 
                        ? 'bg-white border-accent/20 shadow-2xl shadow-accent/5 translate-y-[-4px]' 
                        : 'bg-white/50 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <button 
                      onClick={() => toggleFaq(index)} 
                      className="w-full flex justify-between items-center text-left p-8 focus:outline-none"
                    >
                      <span className={`text-lg font-black uppercase tracking-tight transition-colors duration-300 ${
                        openFaqIndex === index ? 'text-accent' : 'text-slate-900'
                      }`}>
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        openFaqIndex === index ? 'bg-accent text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFaqIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="p-8 pt-0 text-slate-600 leading-relaxed font-medium text-lg border-t border-slate-50 mt-2">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-16 p-10 rounded-[2.5rem] bg-[#003580] text-white text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Still have more questions?</h3>
                    <p className="text-blue-100 mb-8 font-medium opacity-80 max-w-lg mx-auto">
                        Can't find the answer you're looking for? Please chat to our friendly team.
                    </p>
                    <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#003580] font-black px-10 py-5 rounded-2xl hover:bg-accent hover:text-white transition-all uppercase tracking-widest text-xs">
                        Contact Support <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
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
