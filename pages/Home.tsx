import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Shield, Tag, ChevronDown, Globe, Compass, ArrowRight, Star, Award, Search, FileSymlink, BookCheck, MapPin, Zap, Heart, Clock } from 'lucide-react';
import { SUPPLIERS as MOCK_SUPPLIERS, MOCK_HOMEPAGE_CONTENT, GLOBAL_TRUSTED_BRANDS } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { fetchLocations, fetchPublicSuppliers, fetchHomepageLogos, fetchSiteSettings, fetchHomepageContent } from '../api';
import { LocationSuggestion } from '../api';

const normalizeHomepageContent = (content: any) => {
  const fallback = MOCK_HOMEPAGE_CONTENT;
  const safeContent = content && typeof content === 'object' ? content : {};
  const safePopular = safeContent.popularDestinations && typeof safeContent.popularDestinations === 'object'
    ? safeContent.popularDestinations
    : {};
  const fallbackDestinations = Array.isArray(fallback?.popularDestinations?.destinations)
    ? fallback.popularDestinations.destinations
    : [];

  const normalizeDestinationImage = (destination: any, index: number) => {
    const image = typeof destination?.image === 'string' ? destination.image.trim() : '';
    if (image) return image;

    const legacyImage = typeof destination?.imageUrl === 'string' ? destination.imageUrl.trim() : '';
    if (legacyImage) return legacyImage;

    const fallbackImage = typeof fallbackDestinations[index]?.image === 'string'
      ? fallbackDestinations[index].image
      : '';
    return fallbackImage;
  };

  const hasDestinationsArray = Array.isArray(safePopular.destinations);

  const destinations = hasDestinationsArray
    ? safePopular.destinations
        .map((destination: any, index: number) => ({
          id: destination?.id || `d${index + 1}`,
          name: destination?.name || '',
          country: destination?.country || '',
          price: Number(destination?.price) || 0,
          image: normalizeDestinationImage(destination, index)
        }))
        .filter((destination: any) => destination.name || destination.country || destination.image || destination.price > 0)
    : fallbackDestinations;

  return {
    ...fallback,
    ...safeContent,
    hero: {
      ...fallback.hero,
      ...(safeContent.hero || {})
    },
    howItWorks: {
      ...fallback.howItWorks,
      ...(safeContent.howItWorks || {}),
      steps: Array.isArray(safeContent?.howItWorks?.steps) && safeContent.howItWorks.steps.length > 0
        ? safeContent.howItWorks.steps
        : fallback.howItWorks.steps
    },
    faqs: {
      ...fallback.faqs,
      ...(safeContent.faqs || {}),
      items: Array.isArray(safeContent?.faqs?.items) && safeContent.faqs.items.length > 0
        ? safeContent.faqs.items
        : fallback.faqs.items
    },
    popularDestinations: {
      ...fallback.popularDestinations,
      ...safePopular,
      destinations
    },
    advantage: {
        ...fallback.advantage,
        ...(safeContent.advantage || {})
    },
    stats: {
        ...fallback.stats,
        ...(safeContent.stats || {})
    },
    partners: {
        ...fallback.partners,
        ...(safeContent.partners || {})
    },
    cta: {
        ...fallback.cta,
        ...(safeContent.cta || {})
    }
  };
};

const Home: React.FC = () => {
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
  const [homepageContent, setHomepageContent] = React.useState<any>(MOCK_HOMEPAGE_CONTENT);
  
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
        const ammOption = options.find(o => o.value === 'AMM');
        if (ammOption) {
            setPickupName(ammOption.label);
            setDropoffName(ammOption.label);
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
                allLogos = GLOBAL_TRUSTED_BRANDS;
            }
            
            setSuppliers(allLogos);
        } catch (error) {
            console.error('Error loading home suppliers:', error);
            setSuppliers(GLOBAL_TRUSTED_BRANDS);
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

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search, FileSymlink, BookCheck, CheckCircle, Shield, Zap, Heart, Clock
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true }
  };

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      <SEOMetadata
        title="Hogicar | Affordable Car Rentals Worldwide"
        description="Compare car rental deals from 900+ suppliers at 60,000+ locations. Find the perfect car for your next trip with Hogicar."
      />
      
      {/* HERO – classic centered layout */}
      <section 
        className="pt-28 pb-10 lg:pt-40 lg:pb-24 text-white relative overflow-hidden"
        style={{ backgroundColor: 'var(--secondary-color, #003580)' }}
      >
        {/* Animated Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <motion.div 
             animate={{ 
               scale: [1, 1.2, 1],
               rotate: [0, 10, 0],
               opacity: [0.1, 0.15, 0.1] 
             }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"
           />
           <motion.div 
             animate={{ 
               scale: [1, 1.3, 1],
               rotate: [0, -15, 0],
               opacity: [0.05, 0.1, 0.05] 
             }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute bottom-0 right-0 w-[800px] h-[800px] blur-[150px] rounded-full translate-x-1/3 translate-y-1/3" 
             style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
           />
           <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
              {content.hero.title || 'Search, Compare & Save on Car Rentals'}
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <p className="mb-12 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl font-medium opacity-90 leading-relaxed">
              {content.hero.subtitle || 'Compare prices from 900+ car rental suppliers worldwide with transparent pricing and flexible terms.'}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative z-20 max-w-5xl mx-auto shadow-2xl rounded-3xl"
          >
            {content.searchWidgetTitle && (
              <h2 className="text-xl sm:text-2xl font-black mb-6 text-white text-shadow-sm">{content.searchWidgetTitle}</h2>
            )}
            <SearchWidget
              onSearch={handleSearch}
              showTitle={false}
              initialValues={{
                pickup: pickupCode,
                pickupName: pickupName,
                dropoff: dropoffCode,
                dropoffName: dropoffName
              }}
            />
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="whileInView"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mt-12 text-[12px] font-black uppercase tracking-[0.1em]"
          >
            {content.valuePropositions?.slice(0, 3).map((vp: any, idx: number) => {
              const Icon = iconMap[vp.icon] || CheckCircle;
              const colors = ['text-green-400', 'text-blue-400', 'text-amber-400'];
              return (
                <motion.div 
                  key={vp.id} 
                  variants={fadeInUp}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 hover:bg-white/20 transition-all cursor-default group"
                >
                  <Icon className={`w-5 h-5 ${colors[idx % colors.length]} group-hover:scale-110 transition-transform`} /> 
                  <span className="text-white/90">{vp.title}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* TRUSTED PARTNERS – marquee version */}
      <section className="py-8 bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center mb-6">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4 text-slate-400/80">{content.partners?.title || "Partnered with the World's Best"}</div>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto"></div>
        </div>
        <div className="relative flex items-center">
          <div className="animate-marquee flex items-center px-4">
            {[...suppliers, ...suppliers].map((s, idx) => (
              <img 
                key={`${s.id || s.name}-${idx}`} 
                src={s.logo || s.logoUrl} 
                alt={s.name} 
                className="h-10 md:h-14 w-auto max-w-[200px] object-contain brightness-95 hover:brightness-110 logo-scaled-hover" 
                width={180}
                height={56}
                style={{ 
                    '--logo-scale': (s.scale || 100) / 100,
                    '--logo-scale-mobile': (s.mobileScale || 100) / 100,
                    'marginRight': `${s.spacing || 24}px`
                } as any}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY BOOK WITH HOGICAR? & STATS */}
      <section className="py-20 lg:py-32 bg-slate-50/50 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-slate-100/50 to-transparent -z-10"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <h2 className="text-sm font-black tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--primary-color, #2563eb)' }}>{content.advantage?.title || "The Hogicar Advantage"}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.2]">{content.advantage?.subtitle || "Unbeatable value, unparalleled convenience."}</h3>
            <div className="mt-8 h-1.5 w-20 bg-blue-600 mx-auto rounded-full"></div>
            <p className="mt-8 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              {content.advantage?.description || "We streamline the car rental process from start to finish, ensuring you get the best vehicle for your needs without the hassle."}
            </p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
          >
            {content.features.slice(0, 4).map((feature, index) => {
              const Icon = iconMap[feature.icon] || CheckCircle;
              const accentColors = [
                'bg-blue-600',
                'bg-green-600',
                'bg-amber-500',
                'bg-indigo-600'
              ];
              const lightColors = [
                'bg-blue-50 text-blue-600',
                'bg-green-50 text-green-600',
                'bg-amber-50 text-amber-600',
                'bg-indigo-50 text-indigo-600'
              ];
              return (
                <motion.div 
                  key={feature.id} 
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group p-10 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all border border-slate-100 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${accentColors[index % accentColors.length]} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 ${lightColors[index % lightColors.length]} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Stats – Premium dark card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-slate-900 text-white p-12 lg:p-20 rounded-[40px] shadow-2xl relative overflow-hidden"
          >
            {/* Abstract shapes in stats card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="lg:w-1/2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-blue-400 text-xs font-black uppercase tracking-widest mb-6 border border-white/10">
                  <Globe className="w-4 h-4" /> Global Coverage
                </div>
                <h3 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{content.stats?.title || "Join our global network"}</h3>
                <p className="text-slate-300 text-lg mb-10 leading-relaxed font-medium">{content.stats?.description || "60,000+ locations in 160 countries. We've got you covered."}</p>
                <Link to="/supplier-login" className="group px-10 py-5 rounded-2xl text-lg font-black inline-flex items-center gap-3 transition-all hover:brightness-110 active:scale-95 shadow-lg hover:shadow-blue-500/20" style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}>
                  Become a Partner <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="lg:w-1/2 grid grid-cols-2 gap-8 w-full">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-5xl md:text-6xl font-black text-white mb-2">900+</div>
                  <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">Trusted Suppliers</div>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-5xl md:text-6xl font-black text-white mb-2">60k+</div>
                  <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">Global Locations</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GET YOUR PERFECT CAR – Modern vertical timeline */}
      <section className="py-24 lg:py-36 bg-white relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-24"
          >
            <h2 className="text-sm font-black tracking-[0.2em] uppercase mb-4 text-blue-600">Simple Process</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{content.howItWorks.title}</h3>
            <p className="mt-8 text-lg text-slate-600 leading-relaxed font-medium">{content.howItWorks.subtitle}</p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            {content.howItWorks.steps.map((step, index) => {
              const Icon = iconMap[step.icon] || CheckCircle;
              const colors = [
                'from-blue-600 to-indigo-600',
                'from-indigo-600 to-purple-600',
                'from-purple-600 to-pink-600'
              ];
              const lightColors = [
                'bg-blue-50 text-blue-600',
                'bg-indigo-50 text-indigo-600',
                'bg-purple-50 text-purple-600'
              ];
              return (
                <motion.div 
                  key={step.id} 
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="whileInView"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Connection line for desktop */}
                  {index < content.howItWorks.steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-1/2 w-full h-[2px] bg-slate-100 -z-10 overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        whileInView={{ x: '0%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`w-full h-full bg-gradient-to-r ${colors[index]}`}
                      />
                    </div>
                  )}
                  
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${colors[index]} p-[1px] mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <div className="w-full h-full rounded-[23px] bg-white flex items-center justify-center relative overflow-hidden">
                       <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${colors[index]}`}></div>
                       <Icon className="w-10 h-10 relative z-10 text-slate-900" />
                       <span className="absolute -bottom-2 -right-1 text-4xl font-black text-slate-100 -z-10">{index + 1}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{step.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-base font-medium max-w-xs">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
               <motion.div 
                 variants={fadeInUp}
                 initial="initial"
                 whileInView="whileInView"
                 viewport={{ once: true }}
                 className="max-w-2xl"
               >
                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase mb-6" style={{ backgroundColor: 'rgba(var(--primary-rgb, 37, 99, 235), 0.1)', color: 'var(--primary-color, #2563eb)' }}>
                       <MapPin className="w-4 h-4" /> {content.popularDestinations.badge || 'Top Destinations'}
                   </div>
                   <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">{content.popularDestinations.title}</h3>
                   <p className="mt-6 text-lg text-slate-600 leading-relaxed font-medium">{content.popularDestinations.subtitle}</p>
               </motion.div>
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
               >
                 <Link to="/search" className="group flex-shrink-0 inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl text-base hover:-translate-y-1" style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}>
                     {content.popularDestinations.buttonText || 'Explore All Locations'}
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </Link>
               </motion.div>
           </div>
           
           <motion.div 
             variants={staggerContainer}
             initial="initial"
             whileInView="whileInView"
             viewport={{ once: true }}
             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
           >
               {destinations.slice(0, 5).map((dest, index) => (
                   <motion.div
                     key={dest.name + index}
                     variants={fadeInUp}
                     whileHover={{ y: -10 }}
                     className="h-full"
                   >
                     <Link 
                         to={`/search?location=${encodeURIComponent(dest.name)}`} 
                         className="group relative rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 block text-white aspect-[3/4]"
                     >
                         <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                         
                         <div className="absolute top-4 right-4 z-20">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <Heart className="w-5 h-5" />
                            </div>
                         </div>

                         <div className="absolute inset-0 p-8 flex flex-col justify-end">
                             <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                 <h4 className="font-black text-white tracking-tight text-2xl mb-1">{dest.name}</h4>
                                 <p className="text-white/80 text-sm mb-6 flex items-center gap-2 font-bold uppercase tracking-widest">
                                     <MapPin className="w-4 h-4 text-blue-400" /> {dest.country}
                                 </p>
                                 <div className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl font-black shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                     <span className="text-[10px] uppercase opacity-60">From</span>
                                     <span className="text-lg">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</span>
                                     <span className="text-[10px] uppercase opacity-60">/day</span>
                                 </div>
                             </div>
                         </div>
                     </Link>
                   </motion.div>
               ))}
           </motion.div>
        </div>
      </section>

      {/* NEWSLETTER CTA – High-impact design */}
      <section className="py-24 lg:py-36 bg-white relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-slate-900 rounded-[60px] overflow-hidden relative"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10">
              <div className="p-12 md:p-20 lg:p-24 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest mb-8 border border-blue-500/20 w-fit">
                   <Zap className="w-4 h-4" /> Limited Time Offers
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-8">{content.cta?.title || "Get exclusive car rental deals."}</h2>
                <p className="text-xl text-slate-300 max-w-lg mb-12 font-medium leading-relaxed">{content.cta?.subtitle || "Join our newsletter for insider offers, travel inspiration, and early access to our best discounts. Straight to your inbox."}</p>
                
                <form className="flex flex-col sm:flex-row gap-4 max-w-md">
                  <input 
                    type="email" 
                    placeholder="your@email.com" 
                    className="flex-grow px-8 py-5 rounded-2xl text-slate-900 text-base font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all bg-white placeholder-slate-400 border-none"
                  />
                  <button 
                    type="submit" 
                    className="group hover:brightness-110 text-white font-black py-5 px-10 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-blue-500/20 whitespace-nowrap text-lg active:scale-95"
                    style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
                  >
                    Join Now
                  </button>
                </form>
                <p className="mt-6 text-sm text-slate-500 font-medium italic">We respect your privacy. Unsubscribe at any time.</p>
              </div>
              <div className="hidden lg:block relative min-h-[600px]">
                <img 
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop" 
                  alt="Modern luxury car" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent"></div>
                
                {/* Floating badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl text-white shadow-2xl"
                >
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                         <Star className="w-6 h-6 fill-white" />
                      </div>
                      <div>
                         <div className="text-2xl font-black">4.9/5</div>
                         <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Customer Rating</div>
                      </div>
                   </div>
                   <p className="text-sm font-medium italic text-slate-200">"The best deals I've found online!"</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* FAQS – Premium Accordion */}
      <section className="py-24 lg:py-36 bg-slate-50 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <h2 className="text-xs font-black tracking-[0.3em] uppercase mb-4 text-blue-600">Support</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{content.faqs.title}</h3>
            <p className="mt-8 text-lg text-slate-600 leading-relaxed font-medium">
              Have questions? We've got answers. Explore our most frequently asked questions to find the information you need.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {faqs.map((faq, index) => (
                <motion.div 
                  key={faq.id} 
                  variants={fadeInUp}
                  className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden ${openFaqIndex === index ? 'border-blue-200 shadow-xl scale-[1.02]' : 'border-slate-100'}`}
                >
                  <button 
                    onClick={() => toggleFaq(index)} 
                    className="w-full flex justify-between items-center text-left p-8 focus:outline-none group"
                  >
                    <span className={`font-black text-lg sm:text-xl transition-colors duration-300 ${openFaqIndex === index ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-500'}`}>{faq.question}</span>
                    <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-500 ${openFaqIndex === index ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                      <ChevronDown className="w-6 h-6" />
                    </span>
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <div className="text-slate-600 leading-relaxed text-base font-medium px-8 pb-8 pt-0 border-t border-slate-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-20 text-center"
            >
              <div className="inline-block p-1 rounded-[32px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-2xl">
                <Link to="/contact" className="inline-flex items-center justify-center gap-3 px-12 py-6 text-xl font-black rounded-[28px] text-white bg-slate-950 hover:bg-transparent transition-all duration-500 group">
                  <span>Still have questions?</span>
                  <span className="text-blue-400 group-hover:text-white transition-colors">Contact Support</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Home;
