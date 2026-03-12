import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Shield, Award, Star, MapPin, ArrowRight, Globe } from 'lucide-react';
import { SUPPLIERS } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();

  return (
    <div className="bg-white text-slate-900">
      <SEOMetadata
        title="Hogicar | Affordable Car Rentals Worldwide"
        description="Compare car rental deals from 900+ suppliers at 60,000+ locations."
      />
      
      {/* SIMPLE HERO – no absolute/blur */}
      <section className="bg-[#003580] py-10 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="bg-white/10 inline-block px-4 py-1 rounded-full text-sm mb-4">
            <Star className="w-4 h-4 inline text-yellow-400 fill-current" /> Rated 4.9/5
          </div>
          <h1 className="text-3xl font-bold mb-3">Search, Compare & Save on Car Rentals</h1>
          <p className="text-blue-100 mb-6">Compare prices from 900+ car rental suppliers worldwide.</p>
          <SearchWidget onSearch={() => {}} showTitle={false} />
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

      {/* TRUSTED PARTNERS – static grid */}
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Trusted by leading suppliers</h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {SUPPLIERS.map(s => (
              <img key={s.id} src={s.logo} alt={s.name} className="h-10 object-contain grayscale hover:grayscale-0" />
            ))}
          </div>
        </div>
      </section>

      {/* STATS – simple card */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-slate-900 text-white p-6 rounded-xl text-center">
            <Globe className="w-8 h-8 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">Join our global network</h3>
            <p className="text-sm text-slate-300 mb-4">900+ suppliers • 60k+ locations</p>
            <Link to="/supplier-login" className="bg-blue-600 px-4 py-2 rounded-full text-sm inline-block">
              Become a Partner <ArrowRight className="inline w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Home;
