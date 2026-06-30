import * as React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Tag, ChevronDown, Globe, ArrowRight, Star, Award, Search, FileSymlink, BookCheck, MapPin, Mail, Sparkles, Zap } from 'lucide-react';
import { TRUSTED_BRANDS } from '../constants';
import SEOMetadata from '../components/SEOMetadata';
import Reviews from '../components/Reviews';
import TrustedSuppliers from '../components/TrustedSuppliers';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { fetchLocations, fetchPublicSuppliers, fetchHomepageLogos, fetchSiteSettings, fetchHomepageContent } from '../api';
import { LocationSuggestion } from '../api';

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
        }

        if (!targetOption) {
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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
  const content = homepageContent;
  const faqs = content.faqs.items;
  const destinations = content.popularDestinations.destinations;
  const [heroLoaded, setHeroLoaded] = React.useState(false);
  const heroBackgroundImage = seoConfig?.heroImage || heroImageUrl || content.hero.backgroundImage;
  const heroMobileImage = seoConfig?.heroMobileImage || heroBackgroundImage;
  const heroVideo = seoConfig?.heroVideo || content.hero.video;
  const heroOverlayOpacity = seoConfig?.heroOverlayOpacity ?? 0.4;
  const heroTextColor = seoConfig?.heroTextColor || content.hero.textColor || '#FFFFFF';
  const heroButtonText = seoConfig?.heroButtonText || content.hero.buttonText;
  const heroButtonLink = seoConfig?.heroButtonLink || content.hero.buttonLink || '#search';

  const displayH1 = seoConfig?.h1Title || content.hero.title || 'Search, Compare & Save on Car Rentals';
  const displaySubtitle = seoConfig?.heroSubtitle || seoConfig?.introText || content.hero.subtitle || 'Compare prices from 900+ car rental suppliers worldwide with transparent pricing and flexible terms.';

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search, FileSymlink, BookCheck, CheckCircle, Shield, Sparkles, Zap, MapPin, Mail, ArrowRight
  };

  const processSteps = Array.isArray(content.howItWorks.steps) ? content.howItWorks.steps : [];
  const processDetails = [
    'Live location and date matching',
    'Transparent terms before payment',
    'Confirmation sent after booking'
  ];
  const processStats = [
    { label: 'Clear pricing', value: 'No surprises' },
    { label: 'Trusted suppliers', value: 'Verified partners' },
    { label: 'Booking support', value: '24/7 help' }
  ];

  const accentColor = customStyles.accentColor;
  const backgroundColor = customStyles.backgroundColor;
  const textColor = customStyles.textColor;
  const primaryColor = customStyles.primaryColor;
  const buttonColor = customStyles.buttonColor;

  return (
    <div className="bg-white font-sans">
      <SEOMetadata
        title={seoConfig?.title}
        description={seoConfig?.description}
        keywords={seoConfig?.keywords}
        canonicalUrl={seoConfig?.canonicalUrl}
        ogImage={seoConfig?.ogImage}
        noIndex={seoConfig ? !seoConfig.indexable : undefined}
      />
      
      {/* HERO – professional centered layout with background image */}
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
                    target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop";
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

          <div className="absolute inset-0 opacity-20 pointer-events-none z-[1]">
             <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             {!heroBackgroundImage && (
               <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 blur-3xl rounded-full translate-x-1/2 translate-y-1/2"></div>
             )}
          </div>
          
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            {/* Hero Promotion Banner */}
            {seoConfig?.heroPromotionActive && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xl border border-white/20 animate-bounce mb-6 mx-auto cursor-default transition-transform hover:scale-105" style={{ backgroundColor: seoConfig.heroPromotionColor || '#E11D48' }}>
                <Zap className="w-3.5 h-3.5 text-white fill-current" />
                <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-white leading-none">
                  {seoConfig.heroPromotionText}
                </span>
                {seoConfig.heroPromotionLink && (
                  <Link to={seoConfig.heroPromotionLink} className="ml-2 pl-2 border-l border-white/30 text-[10px] sm:text-[11px] font-bold text-white/90 hover:text-white hover:underline">
                    CLAIM OFFER
                  </Link>
                )}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 lg:mb-6 leading-[1.1] tracking-tight drop-shadow-lg max-w-4xl mx-auto">
              {displayH1}
            </h1>
            <p className="text-blue-50/90 mb-6 lg:mb-12 max-w-xl mx-auto text-[13px] sm:text-base lg:text-lg font-medium leading-relaxed px-2">
              {displaySubtitle}
            </p>
            
            {heroButtonText && (
              <div className="mt-8">
                <a 
                  href={heroButtonLink} 
                  className="px-8 py-4 rounded-card font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 inline-block"
                  style={{ backgroundColor: buttonColor, color: '#fff' }}
                >
                  {heroButtonText}
                </a>
              </div>
            )}
            
            {sections.search && (
              <div className="relative z-20 mt-1 lg:mt-0">
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
              </div>
            )}

            {/* QUICK SEO INTRO (if available) */}
            {seoConfig?.content && (
              <div className="mt-8 lg:mt-12 max-w-3xl mx-auto text-left bg-white/10 backdrop-blur-md p-6 rounded-card border border-white/20 shadow-xl">
                 <div className="prose prose-invert prose-sm max-w-none text-white/90" dangerouslySetInnerHTML={{ __html: seoConfig.content.split('</p>')[0] + '</p>' }} />
                 {seoConfig.content.includes('</p>') && (
                   <button 
                     onClick={() => document.getElementById('main-seo-content')?.scrollIntoView({ behavior: 'smooth' })}
                     className="mt-4 text-xs font-bold text-blue-300 hover:text-white transition-colors flex items-center gap-1"
                   >
                     Read more <ChevronDown className="w-3 h-3" />
                   </button>
                 )}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-8 text-[11px] font-extrabold uppercase tracking-wider">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <CheckCircle className="w-4 h-4 text-green-400" /> Free Cancellation
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-blue-300" /> No Hidden Fees
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Award className="w-4 h-4 text-orange-400" /> 24/7 Support
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TRUSTED PARTNERS – marquee version */}
      {sections.suppliers && (
        <TrustedSuppliers />
      )}

      {/* WHY BOOK WITH HOGICAR? & STATS */}
      {(sections.benefits || sections.featuredCars) && (
        <section className="py-8 lg:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {sections.benefits && (
              <>
                <div className="max-w-3xl mx-auto text-center mb-10">
                  <h2 className="text-xs font-bold tracking-widest uppercase mb-2 text-[#007ac2]">The Hogicar Advantage</h2>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-slate-900">Unbeatable value, unparalleled convenience.</h3>
                  <p className="mt-3 text-base text-slate-600 leading-relaxed">
                    We streamline the car rental process from start to finish, ensuring you get the best vehicle for your needs without the hassle.
                  </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  {content.features.slice(0, 4).map((feature, index) => {
                    const Icon = iconMap[feature.icon] || CheckCircle;
                    const colors = [
                      'bg-blue-100 text-[#007ac2]',
                      'bg-green-100 text-green-600',
                      'bg-yellow-100 text-yellow-600',
                      'bg-purple-100 text-purple-600'
                    ];
                    const colorClass = colors[index % colors.length];
                    return (
                      <div key={feature.id} className="text-center p-6 bg-white rounded-card shadow-sm border border-slate-100/80">
                        <div 
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-card mb-4 ${colorClass}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Stats – simplified card */}
            {sections.featuredCars && (
              <div className="p-8 rounded-card text-center bg-slate-50 text-slate-900 border border-slate-100">
                <Globe className="w-10 h-10 mx-auto mb-2 text-[#007ac2]" />
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Join our global network</h3>
                <p className="mb-4 text-slate-600">We've built a vast network of trusted partners to provide you with an exceptional car rental experience, anywhere in the world.</p>
                <Link to="/become-supplier" className="px-6 py-2 rounded-full text-sm inline-flex items-center gap-2 bg-[#007ac2] text-white">
                  Become a Partner <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold">900+</div>
                    <div className="text-xs uppercase tracking-wider">Trusted Suppliers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-extrabold">60k+</div>
                    <div className="text-xs uppercase tracking-wider">Global Locations</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* GET YOUR PERFECT CAR - PROFESSIONAL PROCESS SECTION */}
      {sections.promotions && (
        <section className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-12 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div className="lg:sticky lg:top-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#007ac2]/20 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#007ac2] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Simple process
                </div>
                <h3 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                  {content.howItWorks.title}
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                  {content.howItWorks.subtitle || "We've simplified car rental to give you more time for the journey. Experience a seamless booking flow in just minutes."}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {processStats.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                      <span className="text-sm font-extrabold text-slate-950">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="hidden lg:block absolute left-10 top-8 bottom-8 w-px bg-slate-200" />
                <div className="space-y-5">
                  {processSteps.map((step, index) => {
                    const Icon = iconMap[step.icon] || CheckCircle;
                    const isLast = index === processSteps.length - 1;
                    return (
                      <motion.article
                        key={step.id || `${step.title}-${index}`}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
                        className="group relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#007ac2]/30 hover:shadow-xl hover:shadow-slate-200/80 sm:p-6"
                      >
                        {!isLast && (
                          <div className="absolute left-9 top-full hidden h-5 w-px bg-slate-200 lg:block" />
                        )}
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-lg shadow-slate-300/60 transition-colors duration-300 group-hover:bg-[#007ac2]">
                            <Icon className="h-7 w-7" />
                            <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-[#F57C00] px-2 text-[11px] font-black text-white shadow-sm">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#007ac2]">
                                  Step {index + 1}
                                </p>
                                <h4 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 md:text-2xl">
                                  {step.title}
                                </h4>
                              </div>
                              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Verified
                              </div>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                              {step.description}
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2">
                              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                                {processDetails[index] || 'Guided rental flow'}
                              </span>
                              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#007ac2]">
                                Built for speed
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-lg border border-[#007ac2]/20 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#007ac2]">Ready when you are</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">Search live availability and compare rental options in one place.</p>
                    </div>
                    <Link to="/search" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#007ac2] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#006aa8]">
                      Start searching <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* POPULAR DESTINATIONS */}
      {sections.popularDestinations && (
        <section className="py-8 lg:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                 <div className="max-w-2xl">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#007ac2] text-[10px] font-bold tracking-widest uppercase mb-3">
                         <MapPin className="w-3 h-3" /> Top Destinations
                     </div>
                     <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">{content.popularDestinations.title}</h3>
                     <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">{content.popularDestinations.subtitle}</p>
                 </div>
                 <Link to="/search" className="group flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-[#007ac2] transition-colors duration-300 shadow-lg hover:shadow-xl text-sm">
                     Explore All Locations
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {destinations.slice(0, 5).map((dest, index) => (
                     <Link 
                         to={`/search?location=${encodeURIComponent(dest.name)}`} 
                         key={dest.name} 
                         className="group relative rounded-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 block aspect-[4/3] border-2 border-transparent hover:border-blue-100"
                     >
                         <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" width="400" height="300" />
                     </Link>
                 ))}
             </div>
          </div>
        </section>
      )}

      {/* REVIEWS SECTION */}
      {sections.reviews && (
        <Reviews 
          customReviews={seoConfig ? builderConfig?.sections?.reviews?.items : homepageContent?.selectedReviews}
          accentColor={customStyles.accentColor}
        />
      )}

      {/* NEWSLETTER CTA */}
      {sections.cta && (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden p-8 md:p-14 text-center bg-[#003580] rounded-card shadow-xl text-white">
              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-[10px] font-extrabold uppercase tracking-widest mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Exclusive Member Access
                </div>
                
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
                  Get exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">car rental deals</span>
                </h2>
                
                <p className="text-base text-blue-100/90 mb-10 leading-relaxed">
                  Join 10,000+ travelers receiving insider offers, premium travel inspiration, and first-look access to our most competitive rates.
                </p>
                
                <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/50" />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Enter your email address" 
                      className="w-full pl-12 pr-4 py-4 rounded-card text-white text-sm font-medium focus:outline-none transition-all bg-white/10 border border-white/20 placeholder-white/40 focus:border-white/40"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-white text-[#003580] hover:bg-blue-50 font-bold py-4 px-8 rounded-card transition-all duration-300 shadow-lg active:scale-[0.98] whitespace-nowrap text-sm"
                  >
                    Join the Club
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* DYNAMIC SEO CONTENT */}
      {/* MAIN CONTENT SECTION - for SEO and Dynamic Pages */}
      {sections.content && (seoConfig?.content || builderConfig?.sections?.content?.html || builderConfig?.sections?.content?.text || builderConfig?.html || builderConfig?.text) && (
        <section id="main-seo-content" className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none prose-img:rounded-card prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed">
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

      {/* FAQS */}
      {sections.faq && (
        <section className="py-8 lg:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center mb-6">
              <h2 className="text-[10px] font-bold tracking-widest uppercase mb-1.5 text-[#007ac2]">Support</h2>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">{content.faqs.title}</h3>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Have questions? We've got answers. Explore our most frequently asked questions to find the information you need.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={faq.id} className="bg-white rounded-card shadow-sm border border-slate-100/80 overflow-hidden">
                    <button 
                      onClick={() => toggleFaq(index)} 
                      className="w-full flex justify-between items-center text-left p-3 sm:p-4 focus:outline-none group"
                    >
                      <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#007ac2] transition-colors">{faq.question}</span>
                      <span 
                        className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-colors ${openFaqIndex === index ? 'bg-[#007ac2] text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaqIndex === index ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <div className="text-slate-600 leading-relaxed text-xs sm:text-sm px-3 sm:px-4 pb-4">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-extrabold rounded-full text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform border-none">
                  Still have questions? Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
export default Home;
