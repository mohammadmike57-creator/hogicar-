
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
import DynamicPage from './pages/DynamicPage';
import AffiliateProgram from './pages/AffiliateProgram';
import BecomeSupplier from './pages/BecomeSupplier';
import SupplierConfirmation from './pages/SupplierConfirmation';
import Careers from './pages/Careers';
import { CurrencyProvider } from './contexts/CurrencyContext';
import LeaveReview from './pages/LeaveReview';

// Admin imports
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';
import { AdminDashboard } from './admin/pages/AdminDashboard';

// --- SUBDOMAIN REDIRECT LOGIC ---
// This runs before the component renders to handle redirection immediately.
const host = window.location.hostname.toLowerCase();
const hash = window.location.hash;
const search = window.location.search || "";

if (host.startsWith("admin.") && !hash.startsWith("#/admin")) {
  // Use replace to avoid adding to browser history and prevent loops.
  // We modify the hash for compatibility with HashRouter.
  window.location.replace(`/#/admin/login${search}`);
} else if (host.startsWith("supplier.") && !hash.startsWith("#/supplier")) {
  window.location.replace(`/#/supplier/login${search}`);
}
// --- END SUBDOMAIN REDIRECT ---

const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <Routes>
        {/* Public Admin and Supplier login routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/supplier-login" element={<SupplierLogin />} />
        
        {/* Protected Admin Routes - Reverted to single-page dashboard */}
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
          <Route path="/:slug" element={<DynamicPage />} />
        </Route>
      </Routes>
    </CurrencyProvider>
  );
};

export default App;
