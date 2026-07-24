import * as React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import User from 'lucide-react/dist/esm/icons/user';
import Globe from 'lucide-react/dist/esm/icons/globe';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Star from 'lucide-react/dist/esm/icons/star';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Twitter from 'lucide-react/dist/esm/icons/twitter';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Check from 'lucide-react/dist/esm/icons/check';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { useCurrency } from '../contexts/CurrencyContext';
import { Logo } from './Logo';

const Footer = React.lazy(() => import('./Footer'));

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();
  const currentCurrency = currencies.find(c => c.code === selectedCurrency);
  const location = useLocation();

  const isHomePage = location.pathname === '/' || location.pathname === '/ar';
  const isSearchingPage = location.pathname === '/searching';

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('hogicar_affiliate_ref', ref);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 text-base font-sans">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-accent focus:text-white focus:rounded-xl focus:shadow-2xl focus:font-bold outline-none"
      >
        Skip to main content
      </a>
      {/* HEADER */}
      <header className={`${isHomePage ? 'fixed' : 'sticky'} top-0 z-50 w-full transition-all duration-500 ${
        isHomePage 
          ? (isScrolled ? 'bg-[#003580]/95 backdrop-blur-md shadow-xl border-b border-white/10 py-0.5' : 'bg-transparent border-b border-transparent py-3') 
          : 'bg-[#003580] shadow-md py-1 border-b border-[#002a66]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 transition-all duration-500">
          {/* Logo */}
          <Link to="/" className="flex items-center max-w-[140px] lg:max-w-[160px] overflow-hidden transition-all duration-500" aria-label="Hogicar Home">
            <Logo className="w-full h-auto" variant="light" />
          </Link>

          {/* Desktop right side */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Main Navigation">
            <Link to="/my-bookings" className="text-sm font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10">
              <User className="w-4 h-4" />
              Manage Booking
            </Link>

            {/* Currency selector */}
            <div className="relative">
              <button 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                aria-expanded={isCurrencyOpen}
                aria-haspopup="listbox"
                aria-controls="currency-listbox"
                aria-label={`Current currency: ${selectedCurrency}. Click to change.`}
                className="flex items-center space-x-2 text-sm font-bold text-white hover:text-blue-200 px-4 py-2 rounded-full hover:bg-white/10 transition-colors border border-white/20 hover:border-white/40"
              >
                {currentCurrency?.flag ? (
                  <span className="text-base leading-none">{currentCurrency.flag}</span>
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                <span>{selectedCurrency}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCurrencyOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyOpen(false)}></div>
                  {/* Dropdown panel */}
                  <div id="currency-listbox" role="listbox" className="absolute right-0 mt-2 w-72 bg-white rounded-card shadow-2xl ring-1 ring-black/5 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100">
                      <span className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Select Currency</span>
                    </div>
                    <div className="p-2">
                      {currencies.map(currency => (
                        <button 
                          key={currency.code} 
                          role="option"
                          aria-selected={selectedCurrency === currency.code}
                          onClick={() => { setSelectedCurrency(currency.code); setIsCurrencyOpen(false); }}
                          className={`block w-full text-left px-4 py-3 text-sm rounded-card transition-colors ${selectedCurrency === currency.code ? 'text-[#007ac2] font-bold bg-blue-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{currency.flag}</span>
                                <span>{currency.code} - {currency.name}</span>
                            </div>
                            {selectedCurrency === currency.code && <Check className="w-4 h-4 text-accent" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-card text-white hover:text-blue-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#003580] bg-[#004099] w-full shadow-xl z-50">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 pl-4 pr-4 py-4 border-l-4 border-transparent text-base font-bold text-white hover:text-blue-200 hover:bg-white/5 hover:border-blue-400 transition-colors">
                <User className="w-5 h-5" />
                Manage Booking
              </Link>
            </div>
            <div className="pt-4 pb-6 border-t border-[#003580]">
              <div className="px-4">
                <p className="text-xs font-extrabold text-blue-300 uppercase tracking-widest mb-3">Currency</p>
                <div className="grid grid-cols-3 gap-2">
                  {currencies.map(curr => (
                    <button 
                      key={curr.code} 
                      onClick={() => {setSelectedCurrency(curr.code); setIsMenuOpen(false)}} 
                      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-extrabold p-3 rounded-card border transition-all ${selectedCurrency === curr.code ? 'bg-white text-[#004099] border-white shadow-md' : 'border-blue-700 text-white hover:bg-white/10'}`}
                    >
                      <span className="text-lg">{curr.flag}</span>
                      <span>{curr.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Footer – shown on all pages except searching */}
      {!isSearchingPage && (
        <React.Suspense fallback={<div className="h-64 bg-[#003580] animate-pulse"></div>}>
          <Footer />
        </React.Suspense>
      )}
    </div>
  );
};

export default Layout;
