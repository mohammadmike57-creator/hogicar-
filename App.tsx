import * as React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { CurrencyProvider } from './contexts/CurrencyContext';
// Lazy load pages for performance
const AdminProtectedRoute = React.lazy(() => import('./admin/components/AdminProtectedRoute'));
const Search = React.lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const CarDetails = React.lazy(() => import('./pages/CarDetails'));
const SupplierDashboard = React.lazy(() => import('./pages/SupplierDashboard'));
const MyBookings = React.lazy(() => import('./pages/MyBookings'));
const Searching = React.lazy(() => import('./pages/Searching'));
const BookingPage = React.lazy(() => import('./pages/Booking'));
const Confirmation = React.lazy(() => import('./pages/Confirmation'));
const Voucher = React.lazy(() => import('./pages/Voucher'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const SupplierLogin = React.lazy(() => import('./pages/SupplierLogin'));
const Contact = React.lazy(() => import('./pages/Contact'));
const BlogIndex = React.lazy(() => import('./pages/BlogIndex'));
const BlogArticle = React.lazy(() => import('./pages/BlogArticle'));
const DynamicPage = React.lazy(() => import('./pages/DynamicPage'));
const Sitemap = React.lazy(() => import('./pages/Sitemap'));
const AffiliateProgram = React.lazy(() => import('./pages/AffiliateProgram'));
const BecomeSupplier = React.lazy(() => import('./pages/BecomeSupplier'));
const SupplierConfirmation = React.lazy(() => import('./pages/SupplierConfirmation'));
const Careers = React.lazy(() => import('./pages/Careers'));
const LeaveReview = React.lazy(() => import('./pages/LeaveReview'));
const AdminDashboard = React.lazy(() => import('./admin/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

// --- SUBDOMAIN REDIRECT LOGIC ---
const host = window.location.hostname.toLowerCase();
const pathname = window.location.pathname;
const hash = window.location.hash;
const search = window.location.search || "";

// Handle legacy hash routes by redirecting to clean URLs
if (hash.startsWith("#/")) {
  const cleanPath = hash.substring(2);
  window.location.replace(`/${cleanPath}${search}`);
}

if (host.startsWith("admin.")) {
  if (pathname !== "/admin" && pathname !== "/admin-login") {
    window.location.replace(`/admin${search}`);
  }
} else if (host.startsWith("supplier.")) {
  if (pathname !== "/supplier" && pathname !== "/supplier-login") {
    window.location.replace(`/supplier-login${search}`);
  }
}
// --- END SUBDOMAIN REDIRECT ---

const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <ScrollToTop />
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>}>
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
            <Route path="/ar" element={<Home />} />
            <Route path="/searching" element={<Searching />} />
            <Route path="/search" element={<Search />} />
            <Route path="/car/:id" element={<CarDetails />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/leave-review/:bookingId" element={<LeaveReview />} />
            <Route path="/book/:id" element={<BookingPage />} />
            <Route path="/book/:id/details" element={<BookingPage />} />
            <Route path="/book/:id/payment" element={<BookingPage />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/voucher" element={<Voucher />} />
            <Route path="/affiliate-program" element={<AffiliateProgram />} />
            <Route path="/become-supplier" element={<BecomeSupplier />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/ar/اتصل-بنا" element={<Contact />} />
            <Route path="/about" element={<Contact />} />
            <Route path="/ar/من-نحن" element={<Contact />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/ar/blog" element={<BlogIndex />} />
            <Route path="/blog/category/:categorySlug" element={<BlogIndex />} />
            <Route path="/blog/tag/:tag" element={<BlogIndex />} />
            <Route path="/blog/author/:author" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/ar/blog/:slug" element={<BlogArticle />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="*" element={<DynamicPage />} />
          </Route>
        </Routes>
      </React.Suspense>
    </CurrencyProvider>
  );
};

export default App;
