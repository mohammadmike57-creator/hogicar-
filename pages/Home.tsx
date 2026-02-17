import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Shield, Tag, ChevronDown, Globe, Compass, ArrowRight, Star, Award, Search, FileSymlink, BookCheck, MapPin } from 'lucide-react';
import { SUPPLIERS, MOCK_HOMEPAGE_CONTENT } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { fetchLocations } from '../api';
import { LocationSuggestion } from '../api';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const { convertPrice, getCurrencySymbol } = useCurrency();
  
  // --- START: NEW SEARCH LOGIC ---
  const [locationsOptions, setLocationsOptions] = React.useState<LocationSuggestion[]>([]);
  const [pickupCode, setPickupCode] = React.useState<string>('AMM');
  const [dropoffCode, setDropoffCode] = React.useState<string>('AMM');
  const [pickupName, setPickupName] = React.useState<string>('Amman, Jordan (AMM)');
  const [dropoffName, setDropoffName] = React.useState<string>('Amman, Jordan (AMM)');
  
  React.useEffect(() => {
    const loadLocations = async () => {
      try {
        // FIX: Pass an empty string to fetchLocations to get default locations, as it expects one argument.
        const options = await fetchLocations('');
        setLocationsOptions(options);

        // Update name for default AMM code if a better label is available from API
        const ammOption = options.find(o => o.value === 'AMM');
        if (ammOption) {
            setPickupName(ammOption.label);
            setDropoffName(ammOption.label);
        }
      } catch (error) {
         console.error("Failed to load locations on homepage:", error);
      }
    };
    loadLocations();
  }, []);
  // --- END: NEW SEARCH LOGIC ---

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
  
  const content = MOCK_HOMEPAGE_CONTENT;
  const faqs = content.faqs.items;
  const destinations = content.popularDestinations.destinations;

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search, FileSymlink, BookCheck, CheckCircle, Shield
  };

  return (
    <div className="bg-white font-sans text-slate-900">
      <SEOMetadata
        title="Hogicar | Affordable Car Rentals Worldwide"
        description="Compare car rental deals from 900+ suppliers at 60,000+ locations. Find the perfect car for your next trip with Hogicar."
      />
      
      {/* 1. HERO SECTION & SEARCH WIDGET */}
      <section className="relative bg-[#003580] pb-20 pt-6 sm:pt-12 lg:pb-28 overflow-visible">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 overflow-hidden">
            <img src={content.hero.backgroundImage} alt="Background" className="w-full h-full object-cover opacity-10 mix-blend-overlay" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
              {content.hero.title}
            </h1>
            <p className="text-blue-100 text-base sm:text-lg font-medium max-w-2xl mx-auto md:mx-0">
              {content.hero.subtitle}
            </p>
          </div>

          <SearchWidget 
            onSearch={handleSearch} 
            showTitle={true} 
            initialValues={{
              pickup: pickupCode,
              pickupName: pickupName,
              dropoff: dropoffCode,
              dropoffName: dropoffName
            }}
          />
          
        </div>
      </section>

      {/* WHY CHOOSE US & PARTNERS SECTION */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* TRUSTED PARTNERS */}
            <div className="mb-12">
                <h2 className="text-center text-sm font-semibold text-slate-500 tracking-wider">
                    Trusted by the world's leading car rental suppliers
                </h2>
                <div className="relative mt-8 marquee-container [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    <div className="overflow-hidden">
                        <div className="flex w-max animate-scroll-rtl">
                            {[...SUPPLIERS, ...SUPPLIERS].map((s, index) => (
                                <div key={`rtl-${s.id}-${index}`} className="flex-shrink-0 w-40 mx-6 flex items-center justify-center h-16">
                                    <img 
                                        src={s.logo} 
                                        alt={s.name} 
                                        className="max-h-8 w-full object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Why Book With Hogicar?</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500">
                    We make renting a car simple, transparent, and affordable.
                </p>
            </div>
            <div className="mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {content.features.map((feature) => {
                        const Icon = iconMap[feature.icon];
                        const colors = {
                            Globe: { bg: 'bg-blue-100', text: 'text-blue-600' },
                            Tag: { bg: 'bg-green-100', text: 'text-green-600' },
                            Star: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                            Award: { bg: 'bg-purple-100', text: 'text-purple-600' }
                        };
                        const color = colors[feature.icon as keyof typeof colors];
                        return (
                            <div key={feature.id} className="flex items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all">
                                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${color.bg}`}>
                                    <Icon className={`h-6 w-6 ${color.text}`} aria-hidden="true" />
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg leading-6 font-bold text-slate-900">{feature.title}</h3>
                                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="pb-12 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900">{content.howItWorks.title}</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">
                {content.howItWorks.subtitle}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
                {content.howItWorks.steps.map((step, index) => {
                    const Icon = iconMap[step.icon];
                    return (
                        <div key={step.id} className="relative p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <div className="absolute -top-5 left-5 w-9 h-9 bg-[#FF9F1C] rounded-full text-white font-bold flex items-center justify-center text-base border-4 border-white">{index + 1}</div>
                            <div className="mt-5 flex flex-col items-center text-center">
                                <Icon className="w-7 h-7 text-[#003580] mb-2"/>
                                <h3 className="text-base font-bold">{step.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS */}
      <section className="py-10 bg-white">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {content.valuePropositions.map(prop => {
                      const Icon = iconMap[prop.icon];
                      return (
                         <div key={prop.id} className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#003580]">
                                <Icon className="w-5 h-5"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1">{prop.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{prop.description}</p>
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
               <div>
                   <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{content.popularDestinations.title}</h2>
                   <p className="text-slate-500 mt-2 text-base">{content.popularDestinations.subtitle}</p>
               </div>
               <Link to="/search" className="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-full">
                   View all locations <ArrowRight className="w-5 h-5" />
               </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
               {destinations.map((dest) => (
                   <Link to={`/search?location=${encodeURIComponent(dest.name)}`} key={dest.name} className="group relative h-[360px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100">
                       <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                       
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                       
                       <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                           <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1 block">Top Rated</span>
                           <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{dest.name}</h3>
                           <p className="text-blue-100 flex items-center gap-2 text-sm font-medium mb-4">
                               <MapPin className="w-4 h-4 text-yellow-400" /> {dest.country}
                           </p>
                           
                           <div className="grid grid-cols-2 items-center gap-4 border-t border-white/20 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                               <div>
                                   <p className="text-[9px] uppercase tracking-wide text-slate-300">Daily rates from</p>
                                   <p className="text-xl font-bold text-white">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</p>
                               </div>
                               <div className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm text-center shadow-lg hover:bg-blue-50 transition-colors">
                                   Book Now
                               </div>
                           </div>
                       </div>
                   </Link>
               ))}
           </div>
           
           <Link to="/search" className="md:hidden mt-8 flex items-center justify-center gap-2 text-blue-600 font-bold w-full bg-blue-50 py-4 rounded-xl">
               View all locations <ArrowRight className="w-5 h-5" />
           </Link>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 bg-slate-800 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold mb-3">{content.cta.title}</h2>
            <p className="text-slate-300 mb-6">{content.cta.subtitle}</p>
            <form className="max-w-md mx-auto flex gap-2">
                <input type="email" placeholder="Enter your email" className="flex-grow p-3 rounded-lg text-slate-900 text-base"/>
                <button type="submit" className="bg-[#FF9F1C] hover:bg-orange-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors">Subscribe</button>
            </form>
        </div>
      </section>
      
      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-10">{content.faqs.title}</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={faq.id} className="border border-slate-200 rounded-lg">
                        <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center p-5 text-left font-semibold text-slate-800">
                            {faq.question}
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaqIndex === index && (
                            <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed animate-fadeIn">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </section>

    </div>
  );
};
export default Home;