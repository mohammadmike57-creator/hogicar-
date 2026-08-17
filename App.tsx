import * as React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { lazyRetry } from './utils/lazyRetry';

// Lazy load pages for performance
const Home = lazyRetry(() => import('./pages/Home'));
const AdminProtectedRoute = lazyRetry(() => import('./admin/components/AdminProtectedRoute'));
const Search = lazyRetry(() => import('./pages/Search').then(m => ({ default: m.Search })));
const CarDetails = lazyRetry(() => import('./pages/CarDetails'));
const SupplierDashboard = lazyRetry(() => import('./pages/SupplierDashboard'));
const MyBookings = lazyRetry(() => import('./pages/MyBookings'));
const Searching = lazyRetry(() => import('./pages/Searching'));
const BookingPage = lazyRetry(() => import('./pages/Booking'));
const Confirmation = lazyRetry(() => import('./pages/Confirmation'));
const Voucher = lazyRetry(() => import('./pages/Voucher'));
const AdminLogin = lazyRetry(() => import('./pages/AdminLogin'));
const SupplierLogin = lazyRetry(() => import('./pages/SupplierLogin'));
const Contact = lazyRetry(() => import('./pages/Contact'));
const BlogIndex = lazyRetry(() => import('./pages/BlogIndex'));
const BlogArticle = lazyRetry(() => import('./pages/BlogArticle'));
const DynamicPage = lazyRetry(() => import('./pages/DynamicPage'));
const Sitemap = lazyRetry(() => import('./pages/Sitemap'));
const AffiliateProgram = lazyRetry(() => import('./pages/AffiliateProgram'));
const BecomeSupplier = lazyRetry(() => import('./pages/BecomeSupplier'));
const SupplierConfirmation = lazyRetry(() => import('./pages/SupplierConfirmation'));
const Careers = lazyRetry(() => import('./pages/Careers'));
const LeaveReview = lazyRetry(() => import('./pages/LeaveReview'));
const AdminDashboard = lazyRetry(() => import('./admin/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

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
            
            {/* SEO Landing Pages (Explicitly defined for Googlebot) */}
            <Route path="/bahrain" element={<DynamicPage />} />
            <Route path="/egypt" element={<DynamicPage />} />
            <Route path="/jordan" element={<DynamicPage />} />
            <Route path="/kuwait" element={<DynamicPage />} />
            <Route path="/oman" element={<DynamicPage />} />
            <Route path="/qatar" element={<DynamicPage />} />
            <Route path="/saudi-arabia" element={<DynamicPage />} />
            <Route path="/united-arab-emirates" element={<DynamicPage />} />
            
            <Route path="/car-rental-:city" element={<DynamicPage />} />
            <Route path="/car-hire-:city" element={<DynamicPage type="carHire" />} />
            <Route path="/airport-car-rental-:city" element={<DynamicPage />} />
            <Route path="/airport-car-hire-:city" element={<DynamicPage type="airportCarHire" />} />
            <Route path="/best-car-rental-:city" element={<DynamicPage />} />
            <Route path="/best-car-hire-:city" element={<DynamicPage type="bestCarHire" />} />
            <Route path="/cheap-car-rental-:slug" element={<DynamicPage />} />
            <Route path="/cheap-car-hire-:slug" element={<DynamicPage type="cheapCarHire" />} />
            <Route path="/economy-car-rental-:city" element={<DynamicPage />} />
            <Route path="/economy-car-hire-:city" element={<DynamicPage type="economyCarHire" />} />
            <Route path="/luxury-car-rental-:city" element={<DynamicPage />} />
            <Route path="/luxury-car-hire-:city" element={<DynamicPage type="luxuryCarHire" />} />
            <Route path="/monthly-car-rental-:city" element={<DynamicPage />} />
            <Route path="/monthly-car-hire-:city" element={<DynamicPage type="monthlyCarHire" />} />
            <Route path="/long-term-rental-:city" element={<DynamicPage />} />
            <Route path="/long-term-car-hire-:city" element={<DynamicPage type="longTermCarHire" />} />
            <Route path="/suv-rental-:city" element={<DynamicPage />} />
            <Route path="/suv-hire-:city" element={<DynamicPage type="suvHire" />} />
            <Route path="/van-rental-:city" element={<DynamicPage />} />
            <Route path="/van-hire-:city" element={<DynamicPage type="vanHire" />} />
            <Route path="/rent-a-car-:country" element={<DynamicPage />} />
            <Route path="/:airport-airport-car-rental" element={<DynamicPage />} />

            {/* New high-intent keyword patterns */}
            <Route path="/weekly-car-rental-:slug" element={<DynamicPage type="weeklyCarRental" />} />
            <Route path="/daily-car-rental-:slug" element={<DynamicPage type="dailyCarRental" />} />
            <Route path="/electric-car-rental-:slug" element={<DynamicPage type="electricCarRental" />} />
            <Route path="/convertible-rental-:slug" element={<DynamicPage type="convertibleRental" />} />
            <Route path="/one-way-car-rental-:slug" element={<DynamicPage type="oneWayCarRental" />} />

            <Route path="*" element={<DynamicPage />} />
          </Route>
        </Routes>
      </React.Suspense>
    </CurrencyProvider>
  );
};

export default App;
