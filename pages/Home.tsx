import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Shield, Tag, ChevronDown, Globe, Compass, ArrowRight, Star, Award, Search, FileSymlink, BookCheck, MapPin, Mail, Gift, Sparkles } from 'lucide-react';
import { TRUSTED_BRANDS } from '../constants';
import SEOMetadata from '../components/SEOMetadata';
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
      steps: [],
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

  const builderConfig = React.useMemo(() => {
    if (!seoConfig?.contentJson) return null;
    try {
      return JSON.parse(seoConfig.contentJson);
    } catch (e) {
      return null;
    }
  }, [seoConfig]);

  const isCustomLanding = seoConfig?.layout === 'LANDING_PAGE';
  const sections = builderConfig?.sections || {
    search: { enabled: true },
    hero: { enabled: true },
    features: { enabled: true },
    whyChooseUs: { enabled: true },
    faq: { enabled: true },
    cta: { enabled: true },
    supplierLogos: { enabled: true },
    stats: { enabled: true },
    popularDestinations: { enabled: true }
  };

  const customStyles = builderConfig?.styles || {};
  
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
  }, []);

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
  const heroBackgroundImage = heroImageUrl || content.hero.backgroundImage;

  const displayH1 = content.hero.title || 'Search, Compare & Save on Car Rentals';
  const displaySubtitle = content.hero.subtitle || 'Compare prices from 900+ car rental suppliers worldwide with transparent pricing and flexible terms.';

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search, FileSymlink, BookCheck, CheckCircle, Shield
  };

  const accentColor = customStyles.accentColor || '#007ac2';
  const backgroundColor = customStyles.backgroundColor || '#ffffff';
  const textColor = customStyles.textColor || '#0f172a';

  return (
    <div 
      className="bg-white font-sans" 
      style={isCustomLanding ? { backgroundColor, color: textColor } : {}}
    >
      <SEOMetadata
        title={seoConfig?.title || "Hogicar | Affordable Car Rentals Worldwide"}
        description={seoConfig?.description || "Compare car rental deals from 900+ suppliers at 60,000+ locations. Find the perfect car for your next trip with Hogicar."}
        keywords={seoConfig?.keywords}
        canonicalUrl={seoConfig?.canonicalUrl}
      />
      
      {/* HERO – professional centered layout with background image */}
      {sections.hero?.enabled && (
        <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-10 lg:pt-32 lg:pb-24 text-white overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroBackgroundImage || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop"} 
              className="w-full h-full object-cover"
              alt="Hero Background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#003580]/90 via-[#003580]/80 to-[#003580]/95 backdrop-blur-[1px]"></div>
          </div>

          <div className="absolute inset-0 opacity-20 pointer-events-none z-[1]">
             <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 blur-3xl rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <h1 className="text-[2rem] sm:text-4xl lg:text-6xl font-extrabold mb-3 lg:mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
              {displayH1}
            </h1>
            <p className="text-blue-50/90 mb-6 lg:mb-12 max-w-2xl mx-auto text-[13px] sm:text-base lg:text-lg font-medium leading-relaxed px-2">
              {displaySubtitle}
            </p>
            
            {sections.search?.enabled && (
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
                  accentColor={isCustomLanding ? accentColor : undefined}
                />
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
      {sections.supplierLogos?.enabled && (
        <section className="py-8 bg-white overflow-hidden border-b border-slate-100" style={isCustomLanding ? { backgroundColor } : {}}>
          <div className="max-w-7xl mx-auto px-4 text-center mb-6">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4" style={{ color: isCustomLanding ? accentColor : '#007ac2' }}>Partnered with the World's Best</div>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto"></div>
          </div>
          <div className="relative flex items-center group">
            <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" style={isCustomLanding ? { backgroundImage: `linear-gradient(to right, ${backgroundColor}, transparent)` } : {}}></div>
            <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" style={isCustomLanding ? { backgroundImage: `linear-gradient(to left, ${backgroundColor}, transparent)` } : {}}></div>

            <div className="animate-marquee flex items-center hover:[animation-play-state:paused]">
              {[...suppliers, ...suppliers, ...suppliers, ...suppliers].map((s, idx) => (
                <div 
                  key={`${s.id || s.name}-${idx}`}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ marginRight: `${s.spacing || 40}px` }}
                >
                  <img 
                    src={s.logo || s.logoUrl} 
                    alt={s.name} 
                    className="h-8 md:h-12 w-auto max-w-[160px] object-contain transition-all duration-500 logo-scaled-hover" 
                    width="160"
                    height="48"
                    style={{ 
                        '--logo-scale': (s.scale || 100) / 100,
                        '--logo-scale-mobile': (s.mobileScale || 100) / 100,
                    } as any}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY BOOK WITH HOGICAR? & STATS */}
      {(sections.features?.enabled || sections.stats?.enabled) && (
        <section className="py-8 lg:py-12" style={isCustomLanding ? { backgroundColor } : {}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {sections.features?.enabled && (
              <>
                <div className="max-w-3xl mx-auto text-center mb-10">
                  <h2 className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: isCustomLanding ? accentColor : '#007ac2' }}>The Hogicar Advantage</h2>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight" style={isCustomLanding ? { color: textColor } : { color: '#0f172a' }}>Unbeatable value, unparalleled convenience.</h3>
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
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-card mb-4 ${isCustomLanding ? '' : colorClass}`}
                          style={isCustomLanding ? { backgroundColor: `${accentColor}15`, color: accentColor } : {}}
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
            {sections.stats?.enabled && (
              <div className="bg-slate-900 text-white p-8 rounded-card text-center" style={isCustomLanding ? { backgroundColor: textColor, color: backgroundColor } : {}}>
                <Globe className="w-10 h-10 mx-auto mb-2" style={isCustomLanding ? { color: accentColor } : {}} />
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Join our global network</h3>
                <p className="text-slate-300 mb-4" style={isCustomLanding ? { color: `${backgroundColor}CC` } : {}}>We've built a vast network of trusted partners to provide you with an exceptional car rental experience, anywhere in the world.</p>
                <Link to="/become-supplier" className="px-6 py-2 rounded-full text-sm inline-flex items-center gap-2" style={{ backgroundColor: accentColor, color: '#fff' }}>
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

      {/* GET YOUR PERFECT CAR */}
      {sections.whyChooseUs?.enabled && (
        <section className="py-8 lg:py-12" style={isCustomLanding ? { backgroundColor } : {}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: isCustomLanding ? accentColor : '#007ac2' }}>Simple Process</h2>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={isCustomLanding ? { color: textColor } : { color: '#0f172a' }}>{content.howItWorks.title}</h3>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">{content.howItWorks.subtitle}</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {content.howItWorks.steps.map((step, index) => {
                const Icon = iconMap[step.icon] || CheckCircle;
                const colors = [
                  'from-blue-500 to-cyan-400',
                  'from-purple-500 to-pink-400',
                  'from-emerald-500 to-teal-400'
                ];
                const colorClass = colors[index % colors.length];
                return (
                  <div 
                    key={step.id} 
                    className={`relative flex items-center gap-6 sm:gap-8 p-6 rounded-card text-white shadow-lg ${isCustomLanding ? '' : `bg-gradient-to-r ${colorClass}`}`}
                    style={isCustomLanding ? { backgroundColor: accentColor } : {}}
                  >
                    <div className="flex-shrink-0 relative">
                      <span className="font-sans text-7xl font-extrabold text-white/20 -z-10">{`0${index + 1}`}</span>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-full shadow-inner border border-white/30">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-white/90 leading-relaxed text-sm">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* POPULAR DESTINATIONS */}
      {sections.popularDestinations?.enabled && (
        <section className="py-8 lg:py-12" style={isCustomLanding ? { backgroundColor } : {}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                 <div className="max-w-2xl">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#007ac2] text-[10px] font-bold tracking-widest uppercase mb-3" style={isCustomLanding ? { backgroundColor: `${accentColor}10`, color: accentColor } : {}}>
                         <MapPin className="w-3 h-3" /> Top Destinations
                     </div>
                     <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight" style={isCustomLanding ? { color: textColor } : { color: '#0f172a' }}>{content.popularDestinations.title}</h3>
                     <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">{content.popularDestinations.subtitle}</p>
                 </div>
                 <Link to="/search" className="group flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-[#007ac2] transition-colors duration-300 shadow-lg hover:shadow-xl text-sm" style={isCustomLanding ? { backgroundColor: textColor, color: backgroundColor } : {}}>
                     Explore All Locations
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {destinations.slice(0, 5).map((dest, index) => (
                     <Link 
                         to={`/search?location=${encodeURIComponent(dest.name)}`} 
                         key={dest.name} 
                         className="group relative rounded-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 block aspect-[4/3] border-2 border-transparent"
                         style={isCustomLanding ? { borderColor: `${accentColor}20` } : {}}
                     >
                         <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" width="400" height="300" />
                     </Link>
                 ))}
             </div>
          </div>
        </section>
      )}

      {/* NEWSLETTER CTA */}
      {sections.cta?.enabled && (
        <section className="py-12" style={isCustomLanding ? { backgroundColor } : {}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 p-8 md:p-14 text-center" style={isCustomLanding ? { backgroundColor: textColor, color: backgroundColor } : {}}>
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 -mt-24 -mr-24 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accentColor }}></div>
              <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accentColor }}></div>
              
              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-extrabold uppercase tracking-widest mb-6" style={isCustomLanding ? { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor } : {}}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Exclusive Member Access
                </div>
                
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
                  Get exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400" style={isCustomLanding ? { backgroundImage: `linear-gradient(to right, ${accentColor}, #10b981)` } : {}}>car rental deals</span>
                </h2>
                
                <p className="text-base text-slate-400 mb-10 leading-relaxed" style={isCustomLanding ? { color: `${backgroundColor}AA` } : {}}>
                  Join 10,000+ travelers receiving insider offers, premium travel inspiration, and first-look access to our most competitive rates.
                </p>
                
                <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Enter your email address" 
                      className="w-full pl-12 pr-4 py-4 rounded-card text-white text-sm font-medium focus:outline-none transition-all bg-white/5 border border-white/10 placeholder-slate-500"
                      style={isCustomLanding ? { borderColor: `${backgroundColor}30` } : {}}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-accent hover:bg-accent-700 text-white font-bold py-4 px-8 rounded-card transition-all duration-300 shadow-lg active:scale-[0.98] whitespace-nowrap text-sm"
                    style={isCustomLanding ? { backgroundColor: accentColor } : {}}
                  >
                    Join the Club
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* FAQS */}
      {sections.faq?.enabled && (
        <section className="py-8 lg:py-12" style={isCustomLanding ? { backgroundColor } : {}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center mb-6">
              <h2 className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: isCustomLanding ? accentColor : '#007ac2' }}>Support</h2>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight" style={isCustomLanding ? { color: textColor } : { color: '#0f172a' }}>{content.faqs.title}</h3>
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
                      <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#007ac2] transition-colors" style={isCustomLanding ? { '--hover-color': accentColor } as any : {}}>{faq.question}</span>
                      <span 
                        className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-colors ${openFaqIndex === index ? '' : 'bg-slate-100 text-slate-500'}`}
                        style={openFaqIndex === index ? { backgroundColor: accentColor, color: '#fff' } : {}}
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
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-extrabold rounded-full text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform border-none" style={isCustomLanding ? { backgroundColor: accentColor, backgroundImage: 'none' } : {}}>
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
