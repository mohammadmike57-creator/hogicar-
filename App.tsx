
import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
// FIX: Changed to a named import to match the updated export in pages/Search.tsx.
import { Search } from './pages/Search';
import CarDetails from './pages/CarDetails';
// FIX: Changed to a default import to match the updated export in SupplierDashboard.tsx.
import SupplierDashboard from './pages/SupplierDashboard';
// FIX: Changed to a named import to match the updated export in AdminDashboard.tsx.
import { AdminDashboard } from './pages/AdminDashboard';
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

const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <Routes>
        {/* Admin and Supplier portals have their own routes and do not use the main Layout */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/supplier-login" element={<SupplierLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/supplier" element={<SupplierDashboard />} />
        <Route path="/supplier-confirmation/:bookingId" element={<SupplierConfirmation />} />

        {/* All other routes are part of the customer-facing application and render inside the Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/searching" element={<Searching />} />
          <Route path="/search" element={<Search />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/leave-review/:bookingId" element={<LeaveReview />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/confirmation/:bookingId" element={<Confirmation />} />
          <Route path="/affiliate-program" element={<AffiliateProgram />} />
          <Route path="/become-supplier" element={<BecomeSupplier />} />
          <Route path="/careers" element={<Careers />} />
          {/* Dynamic route for pages like /about, /terms, /privacy */}
          <Route path="/:slug" element={<DynamicPage />} />
        </Route>
      </Routes>
    </CurrencyProvider>
  );
};

export default App;
