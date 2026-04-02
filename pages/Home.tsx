import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Shield, Tag, ChevronDown, Globe, Compass, ArrowRight, Star, Award, Search, FileSymlink, BookCheck, MapPin } from 'lucide-react';
import { SUPPLIERS as MOCK_SUPPLIERS, MOCK_HOMEPAGE_CONTENT, GLOBAL_TRUSTED_BRANDS } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { fetchLocations, fetchPublicSuppliers, fetchHomepageLogos } from '../api';
import { LocationSuggestion } from '../api';

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
  
  React.useEffect(() => {
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
                    scale: l.scale
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

    loadLocations();
    loadSuppliers();
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
      
      {/* HERO – clean version (no absolute/blur) */}
      <section className="bg-[#003580] py-10 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="bg-white/10 inline-block px-4 py-1 rounded-full text-sm mb-4">
            <Star className="w-4 h-4 inline text-yellow-400 fill-current" /> Rated 4.9/5 by 10,000+ customers
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Search, Compare & Save on <span className="text-[#FF9F1C]">Car Rentals</span>
          </h1>
          <p className="text-blue-100 mb-6">Compare prices from 900+ car rental suppliers worldwide.</p>
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
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" /> Free Cancellation
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
              <Shield className="w-4 h-4 text-blue-300" /> No Hidden Fees
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
              <Award className="w-4 h-4 text-orange-400" /> 24/7 Support
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS – marquee version */}
      <section className="py-10 bg-white overflow-hidden border-y border-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center mb-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-2">Trusted by Leading Partners</h2>
          <div className="h-0.5 w-12 bg-blue-600/20 mx-auto rounded-full"></div>
        </div>
        <div className="relative flex items-center">
          <div className="animate-marquee flex gap-16 md:gap-28 items-center px-4">
            {[...suppliers, ...suppliers].map((s, idx) => (
              <img 
                key={`${s.id || s.name}-${idx}`} 
                src={s.logo || s.logoUrl} 
                alt={s.name} 
                className="h-10 md:h-14 w-auto max-w-[180px] object-contain brightness-95 hover:brightness-110 logo-scaled-hover" 
                style={{ 
                    '--logo-scale': (s.scale || 100) / 100 
                } as any}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY BOOK WITH HOGICAR? & STATS */}
      <section className="py-8 lg:py-12 bg-slate-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">The Hogicar Advantage</h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Unbeatable value, unparalleled convenience.</h3>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              We streamline the car rental process from start to finish, ensuring you get the best vehicle for your needs without the hassle.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {content.features.slice(0, 4).map((feature, index) => {
              const Icon = iconMap[feature.icon] || CheckCircle;
              const colors = [
                'bg-blue-100 text-blue-600',
                'bg-green-100 text-green-600',
                'bg-yellow-100 text-yellow-600',
                'bg-purple-100 text-purple-600'
              ];
              const colorClass = colors[index % colors.length];
              return (
                <div key={feature.id} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100/80">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Stats – simplified card (no absolute/blur) */}
          <div className="bg-slate-900 text-white p-8 rounded-xl text-center">
            <Globe className="w-10 h-10 mx-auto mb-2" />
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Join our global network</h3>
            <p className="text-slate-300 mb-4">We've built a vast network of trusted partners to provide you with an exceptional car rental experience, anywhere in the world.</p>
            <Link to="/supplier-login" className="bg-blue-600 px-6 py-2 rounded-full text-sm inline-flex items-center gap-2">
              Become a Partner <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
              <div className="text-center">
                <div className="text-3xl font-black">900+</div>
                <div className="text-xs uppercase tracking-wider">Trusted Suppliers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black">60k+</div>
                <div className="text-xs uppercase tracking-wider">Global Locations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GET YOUR PERFECT CAR */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">Simple Process</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{content.howItWorks.title}</h3>
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
                <div key={step.id} className={`relative flex items-center gap-6 sm:gap-8 p-6 rounded-2xl bg-gradient-to-r ${colorClass} text-white shadow-lg`}>
                  <div className="flex-shrink-0 relative">
                    <span className="font-sans text-7xl font-black text-white/20 -z-10">{`0${index + 1}`}</span>
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

      {/* POPULAR DESTINATIONS */}
      <section className="py-8 lg:py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
               <div className="max-w-2xl">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-widest uppercase mb-3">
                       <MapPin className="w-3 h-3" /> Top Destinations
                   </div>
                   <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">{content.popularDestinations.title}</h3>
                   <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">{content.popularDestinations.subtitle}</p>
               </div>
               <Link to="/search" className="group flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-blue-600 transition-colors duration-300 shadow-lg hover:shadow-xl text-sm">
                   Explore All Locations
                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               {destinations.slice(0, 5).map((dest, index) => (
                   <Link 
                       to={`/search?location=${encodeURIComponent(dest.name)}`} 
                       key={dest.name} 
                       className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 block text-white aspect-[4/3]"
                   >
                       <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                       <div className="absolute inset-0 p-4 flex flex-col justify-end">
                           <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                               <h4 className="font-bold text-white tracking-tight text-lg">{dest.name}</h4>
                               <p className="text-blue-200 text-xs mb-2 flex items-center gap-1 font-medium">
                                   <MapPin className="w-3 h-3" /> {dest.country}
                               </p>
                               <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-xl px-2 py-1 rounded-lg text-white font-medium border border-white/20 shadow-inner">
                                   <span className="text-slate-300 text-[10px]">From</span>
                                   <span className="font-bold text-sm">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</span>
                                   <span className="text-slate-300 text-[10px]">/d</span>
                               </div>
                           </div>
                       </div>
                   </Link>
               ))}
           </div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-5 md:p-8">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">Get exclusive car rental deals.</h2>
                <p className="mt-3 text-xs text-slate-300 max-w-sm">Join our newsletter for insider offers, travel inspiration, and early access to our best discounts. Straight to your inbox.</p>
                <form className="mt-5 flex flex-col sm:flex-row gap-2 max-w-sm">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-grow px-3 py-2 rounded-full text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all bg-white placeholder-slate-400"
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap text-xs"
                  >
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
      
      {/* FAQS */}
      <section className="py-8 lg:py-12 bg-slate-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center mb-6">
            <h2 className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1.5">Support</h2>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{content.faqs.title}</h3>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Have questions? We've got answers. Explore our most frequently asked questions to find the information you need.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-slate-100/80 overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(index)} 
                    className="w-full flex justify-between items-center text-left p-3 sm:p-4 focus:outline-none group"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                    <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-colors ${openFaqIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
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

    </div>
  );
};
export default Home;
