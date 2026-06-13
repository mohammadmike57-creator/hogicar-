import * as React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

// Admin imports
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';
import { AdminDashboard } from './admin/pages/AdminDashboard';

// --- SUBDOMAIN REDIRECT LOGIC ---
const host = window.location.hostname.toLowerCase();
const pathname = window.location.pathname;
const hash = window.location.hash;
const search = window.location.search || "";

// If using HashRouter, the application logic is in the hash part.
// But we might still get traditional paths if someone types them or from old redirects.
if (host.startsWith("admin.")) {
  if (!hash.startsWith("#/admin") && !hash.startsWith("#/admin-login")) {
    window.location.replace(`/#/admin${search}`);
  }
} else if (host.startsWith("supplier.")) {
  if (!hash.startsWith("#/supplier") && !hash.startsWith("#/supplier-login")) {
    window.location.replace(`/#/supplier-login${search}`);
  }
}
// Support for non-subdomain admin path (e.g. hogicar.com/admin)
else if (pathname === "/admin" || pathname === "/admin/") {
  window.location.replace(`/#/admin${search}`);
}
else if (pathname === "/admin-login" || pathname === "/admin-login/") {
  window.location.replace(`/#/admin-login${search}`);
}
else if (pathname === "/supplier" || pathname === "/supplier/") {
  window.location.replace(`/#/supplier${search}`);
}
else if (pathname === "/supplier-login" || pathname === "/supplier-login/") {
  window.location.replace(`/#/supplier-login${search}`);
}
// --- END SUBDOMAIN REDIRECT ---

const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <ScrollToTop />
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
        <Route path="/supplier-confirmation" element={<SupplierConfirmation />} />

        {/* Customer-facing application with main Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/searching" element={<Searching />} />
          <Route path="/search" element={<Search />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/leave-review/:bookingId" element={<LeaveReview />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/book/:id/details" element={<BookingPage />} />
          <Route path="/book/:id/payment" element={<BookingPage />} />
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
