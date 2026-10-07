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
import { CurrencyMenu, CurrencySheet, CurrencyFlag } from './currency/CurrencyPicker';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { lazyRetry } from '../utils/lazyRetry';

const Footer = lazyRetry(() => import('./Footer'));

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { selectedCurrency, currencies } = useCurrency();
  const currentCurrency = currencies.find(c => c.code === selectedCurrency);
  const location = useLocation();
  const closeCurrency = React.useCallback(() => setIsCurrencyOpen(false), []);
  const isSearchResults = /^\/search(\/|$)/.test(location.pathname);

  const isHomePage = location.pathname === '/' || location.pathname === '/ar' || location.pathname === '/ar/';
  const isSearchOrBookingPage = location.pathname.startsWith('/search') || 
                                location.pathname.startsWith('/searching') || 
                                location.pathname.startsWith('/book/') ||
                                location.pathname.startsWith('/confirmation') ||
                                location.pathname.startsWith('/voucher');

  const shouldShowFooter = isHomePage;

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
    const promo = params.get('promo');
    if (promo && /^[A-Za-z0-9_-]{3,24}$/.test(promo)) {
      try { sessionStorage.setItem('hogicar_promo', promo.toUpperCase()); } catch { /* storage blocked */ }
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 text-base font-sans">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-accent focus:text-white focus:rounded-xl focus:shadow-2xl focus:font-bold outline-none"
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
          <Link to="/" className="flex shrink-0 items-center max-w-[140px] lg:max-w-[160px] overflow-hidden transition-all duration-500" aria-label="Hogicar Home">
            <Logo className="w-full h-auto" variant="light" />
          </Link>

          {/* Search results put their compact "edit search" bar here (desktop). */}
          {isSearchResults && <div id="header-search-slot" className="hidden min-w-0 flex-1 justify-center px-4 lg:flex xl:px-8" />}

          {/* Desktop right side */}
          <nav className="hidden md:flex shrink-0 items-center gap-2 lg:gap-3" aria-label="Main Navigation">
            <Link to="/my-bookings" aria-label="Manage Booking" title="Manage Booking" className={`text-sm font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-2 py-2 rounded-full hover:bg-white/10 ${isSearchResults ? 'px-3 2xl:px-4' : 'px-4'}`}>
              <User className="w-4 h-4" />
              <span className={isSearchResults ? 'lg:hidden 2xl:inline' : ''}>Manage Booking</span>
            </Link>

            <CurrencyMenu />
          </nav>

          {/* Mobile: currency chip + menu button */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={() => { setIsMenuOpen(false); setIsCurrencyOpen(true); }}
              aria-label={`Currency: ${selectedCurrency}. Change currency`}
              className="flex h-9 items-center gap-1.5 rounded-full ps-1 pe-2.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/25 active:bg-white/10"
            >
              <CurrencyFlag currency={currentCurrency} size={24} />
              {selectedCurrency}
            </button>
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
              <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 ps-4 pe-4 py-4 border-s-4 border-transparent text-base font-bold text-white hover:text-blue-200 hover:bg-white/5 hover:border-blue-400 transition-colors">
                <User className="w-5 h-5" />
                Manage Booking
              </Link>
            </div>
            <div className="border-t border-white/10 px-4 pb-5 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">Currency</p>
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); setIsCurrencyOpen(true); }}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-3.5 py-3 text-start ring-1 ring-inset ring-white/15 active:bg-white/15"
              >
                <CurrencyFlag currency={currentCurrency} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{selectedCurrency} · {currentCurrency?.symbol}</span>
                  <span className="block truncate text-xs text-blue-100/80">{currentCurrency?.name}</span>
                </span>
                <span className="text-xs font-semibold text-white/80">Change</span>
                <ChevronRight className="h-4 w-4 text-white/60" />
              </button>
            </div>
          </div>
        )}
      </header>
      <CurrencySheet open={isCurrencyOpen} onClose={closeCurrency} />

      {/* Main Content */}
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Footer – only shown on the home page */}
      {shouldShowFooter && (
        <React.Suspense fallback={<div className="h-64 bg-[#003580] animate-pulse"></div>}>
          <Footer />
        </React.Suspense>
      )}
    </div>
  );
};

export default Layout;
