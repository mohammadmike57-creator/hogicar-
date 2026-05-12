import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Search } from './pages/Search';
import CarDetails from './pages/CarDetails';
import SupplierDashboard from './pages/SupplierDashboard';
import MyBookings from './pages/MyBookings';
import Searching from './pages/Searching';
import BookingPage from './pages/Booking';
import Confirmation from './pages/Confirmation';
import AdminLogin from './pages/AdminLogin';
import SupplierLogin from './pages/SupplierLogin';
import Contact from './pages/Contact';
import DynamicPage from './pages/DynamicPage';
import AffiliateProgram from './pages/AffiliateProgram';
import BecomeSupplier from './pages/BecomeSupplier';
import SupplierConfirmation from './pages/SupplierConfirmation';
import Careers from './pages/Careers';
import { CurrencyProvider } from './contexts/CurrencyContext';
import LeaveReview from './pages/LeaveReview';
import { MOCK_APP_CONFIG } from './services/mockData';

// Admin imports
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';
import { AdminDashboard } from './admin/pages/AdminDashboard';

// --- SUBDOMAIN REDIRECT LOGIC ---
const host = window.location.hostname.toLowerCase();
const pathname = window.location.pathname;
const search = window.location.search || "";

if (host.startsWith("admin.") && pathname !== "/admin" && pathname !== "/admin-login") {
  window.location.replace(`/admin${search}`);
} else if (host.startsWith("supplier.") && pathname !== "/supplier" && pathname !== "/supplier-login") {
  window.location.replace(`/supplier-login${search}`);
}
// --- END SUBDOMAIN REDIRECT ---

const App: React.FC = () => {
  React.useEffect(() => {
    // Apply theme colors from config
    const primary = MOCK_APP_CONFIG.themePrimaryColor || '#ea580c';
    const secondary = MOCK_APP_CONFIG.themeSecondaryColor || '#0f172a';
    const heroBg = MOCK_APP_CONFIG.themeHeroBg || '#f8fafc';
    const footerBg = MOCK_APP_CONFIG.themeFooterBg || '#0f172a';
    const layoutBg = MOCK_APP_CONFIG.themeLayoutBg || '#ffffff';
    
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    document.documentElement.style.setProperty('--hero-bg', heroBg);
    document.documentElement.style.setProperty('--footer-bg', footerBg);
    document.documentElement.style.setProperty('--layout-bg', layoutBg);

    // Convert hex to RGB for alpha support
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
    };
    document.documentElement.style.setProperty('--primary-rgb', hexToRgb(primary));
    document.documentElement.style.setProperty('--secondary-rgb', hexToRgb(secondary));
  }, []);

  return (
    <CurrencyProvider>
      <Routes>
        {/* Public Admin and Supplier login routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/supplier-login" element={<SupplierLogin />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminProtectedRoute />}>
            <Route index element={<AdminDashboard />} />
        </Route>
        
        <Route path="/supplier" element={<SupplierDashboard />} />
        <Route path="/supplier-confirmation/:bookingId" element={<SupplierConfirmation />} />

        {/* Customer-facing application with main Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/searching" element={<Searching />} />
          <Route path="/search" element={<Search />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/leave-review/:bookingId" element={<LeaveReview />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/affiliate-program" element={<AffiliateProgram />} />
          <Route path="/become-supplier" element={<BecomeSupplier />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/:slug" element={<DynamicPage />} />
        </Route>
      </Routes>
    </CurrencyProvider>
  );
};

export default App;
