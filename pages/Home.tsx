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
      <section className="relative bg-[#003580] pt-4 pb-8 lg:pt-10 lg:pb-16 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 z-0">
            <img src={content.hero.backgroundImage} alt="Background" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#003580]/90 via-[#003580]/80 to-[#001a40]/95"></div>
        </div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-[#FF9F1C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-4 lg:mb-6">
                <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-medium mb-4 shadow-lg">
                    <Star className="w-4 h-4 text-[#FF9F1C] fill-[#FF9F1C]" />
                    <span>Rated 4.9/5 by 10,000+ customers</span>
                </div>
                
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 lg:mb-4 leading-[1.1] mt-2 sm:mt-0">
                  {content.hero.title.split(' ').map((word, i) => 
                    word.toLowerCase() === 'perfect' || word.toLowerCase() === 'car' ? 
                    <span key={i} className="text-[#FF9F1C]">{word} </span> : 
                    <span key={i}>{word} </span>
                  )}
                </h1>
                
                <p className="hidden sm:block text-blue-100 text-base sm:text-lg font-medium mb-6 max-w-2xl mx-auto leading-relaxed">
                  {content.hero.subtitle}
                </p>
            </div>

            <div className="relative z-20 max-w-5xl mx-auto">
                {/* Decorative glow behind widget */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-[#FF9F1C] rounded-3xl blur-2xl opacity-20"></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 sm:p-4">
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
                </div>
            </div>
            
            {/* Quick Trust Badges */}
            <div className="mt-6 lg:mt-8 flex flex-wrap justify-center gap-3 sm:gap-6 text-white text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="bg-green-500/20 p-1 sm:p-1.5 rounded-full">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <span>Free Cancellation</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="bg-blue-500/20 p-1 sm:p-1.5 rounded-full">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="bg-[#FF9F1C]/20 p-1 sm:p-1.5 rounded-full">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9F1C]" />
                    </div>
                    <span>24/7 Support</span>
                </div>
            </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Trusted by the world's leading car rental suppliers</h2>
                <p className="text-slate-500 mt-2">We partner with top brands to bring you the best vehicles at the best prices.</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
                {SUPPLIERS.slice(0, 6).map((s) => (
                    <img 
                        key={s.id}
                        src={s.logo} 
                        alt={s.name} 
                        className="h-8 md:h-10 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    />
                ))}
            </div>
        </div>
      </section>

      {/* WHY BOOK WITH HOGICAR? & STATS - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-20">
                <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">The Hogicar Advantage</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Unbeatable value, unparalleled convenience.</h3>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                    We streamline the car rental process from start to finish, ensuring you get the best vehicle for your needs without the hassle.
                </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                {content.features.slice(0, 4).map((feature) => {
                    const Icon = iconMap[feature.icon] || CheckCircle;
                    return (
                        <div key={feature.id} className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100/80">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-6">
                                <Icon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h4>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* Integrated Stats & Network Section */}
            <div className="relative bg-white rounded-3xl shadow-lg border border-slate-100/80 p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="lg:w-1/2 text-center lg:text-left">
                    <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">Join our global network</h3>
                    <p className="text-slate-600 text-lg max-w-lg leading-relaxed">
                        We've built a vast network of trusted partners to provide you with an exceptional car rental experience, anywhere in the world.
                    </p>
                </div>
                <div className="lg:w-1/2 flex justify-center lg:justify-end gap-10 sm:gap-16">
                    <div className="text-center">
                        <div className="text-5xl md:text-7xl font-black text-blue-600 tracking-tight">900+</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500 uppercase tracking-widest">Suppliers</div>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="text-center">
                        <div className="text-5xl md:text-7xl font-black text-blue-600 tracking-tight">60k+</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500 uppercase tracking-widest">Locations</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* GET YOUR PERFECT CAR - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-20">
                <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Simple Process</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{content.howItWorks.title}</h3>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">{content.howItWorks.subtitle}</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-20">
                {content.howItWorks.steps.map((step, index) => {
                    const Icon = iconMap[step.icon] || CheckCircle;
                    return (
                        <div key={step.id} className="relative flex items-center gap-8 sm:gap-12">
                            {/* Number and Icon */}
                            <div className="flex-shrink-0 relative">
                                <span className="font-sans text-9xl font-black text-slate-100/80 -z-10">{`0${index + 1}`}</span>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-full shadow-lg">
                                    <Icon className="w-9 h-9" />
                                </div>
                            </div>
                            {/* Text Content */}
                            <div>
                                <h4 className="text-3xl font-bold text-slate-900 mb-3">{step.title}</h4>
                                <p className="text-slate-600 leading-relaxed text-lg">{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-6">
               <div className="max-w-xl">
                   <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Top Destinations</h2>
                   <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{content.popularDestinations.title}</h3>
                   <p className="mt-6 text-lg text-slate-600 leading-relaxed">{content.popularDestinations.subtitle}</p>
               </div>
               <Link to="/search" className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                   Explore All Locations
               </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {destinations.slice(0, 5).map((dest, index) => (
                   <Link 
                       to={`/search?location=${encodeURIComponent(dest.name)}`} 
                       key={dest.name} 
                       className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 block text-white ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
                       
                       <div className={`w-full ${index === 0 ? 'h-full pt-[75%]' : 'h-0 pt-[100%]'}`}></div>

                       <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                       
                       <div className="absolute inset-x-0 bottom-0 p-8">
                           <h4 className={`font-bold text-white mb-2 ${index === 0 ? 'text-4xl' : 'text-3xl'}`}>{dest.name}</h4>
                           <p className="text-blue-200/90 text-sm mb-4 flex items-center gap-2 font-medium">
                               <MapPin className="w-4 h-4" /> {dest.country}
                           </p>
                           <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20">
                               From <span className="font-bold">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</span> / day
                           </div>
                       </div>
                   </Link>
               ))}
           </div>
        </div>
      </section>

      {/* NEWSLETTER CTA - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 rounded-3xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-10 md:p-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">Get exclusive car rental deals.</h2>
                        <p className="mt-6 text-lg text-slate-300 max-w-md">Join our newsletter for insider offers, travel inspiration, and early access to our best discounts. Straight to your inbox.</p>
                        <form className="mt-10 flex flex-col sm:flex-row gap-4 max-w-md">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="flex-grow px-5 py-4 rounded-full text-slate-900 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all bg-white placeholder-slate-400"
                            />
                            <button 
                                type="submit" 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                                Subscribe
                            </button>
                        </form>
                    </div>
                    <div className="hidden lg:block relative">
                        <img 
                            src="https://images.unsplash.com/photo-1568605117036-5fe5e7185743?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                            alt="Modern car interior" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/20"></div>
                    </div>
                </div>
            </div>
        </div>
      </section>
      
      {/* FAQS - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-20">
                <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Support</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{content.faqs.title}</h3>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                    Have questions? We've got answers. Explore our most frequently asked questions to find the information you need.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={faq.id} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
                            <button 
                                onClick={() => toggleFaq(index)} 
                                className="w-full flex justify-between items-center text-left p-6 sm:p-8 focus:outline-none group"
                            >
                                <span className="font-bold text-lg sm:text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                                <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors ${openFaqIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                                </span>
                            </button>
                            <div 
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaqIndex === index ? 'max-h-96' : 'max-h-0'}`}
                            >
                                <div className="text-slate-600 leading-relaxed text-base sm:text-lg px-6 sm:px-8 pb-8">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-16 text-center">
                    <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-slate-700 bg-white hover:bg-slate-100 transition-all shadow-md border border-slate-200">
                        Still have questions? Contact Support
                    </Link>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};
export default Home;