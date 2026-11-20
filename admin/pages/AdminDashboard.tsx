import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from 'lucide-react/dist/esm/icons/menu';
import Building from 'lucide-react/dist/esm/icons/building';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Copy from 'lucide-react/dist/esm/icons/copy';
import { motion, AnimatePresence } from 'framer-motion';
import BlogManagement from '../components/BlogManagement';
import SitemapManagement from '../components/SitemapManagement';
import SeoAuditManagement from '../components/SeoAuditManagement';
import PushNotificationManagement from '../components/PushNotificationManagement';
import { 
    adminFetch 
} from '../../lib/adminApi';
import PromotionsAdmin from '../components/PromotionsAdmin';
import AffiliatesAdmin from '../components/AffiliatesAdmin';
import IntegrationsAdmin from '../components/IntegrationsAdmin';
import LocationsAdmin from '../components/LocationsAdmin';
import CarLibraryAdmin from '../components/CarLibraryAdmin';
import HomepageBrandsAdmin from '../components/HomepageBrandsAdmin';
import OverviewAdmin from '../components/OverviewAdmin';
import BookingsAdmin from '../components/BookingsAdmin';
import { SuppliersBoard, FleetBoard } from '../components/suppliersFleetUi';
const AffiliateNetworksAdmin = React.lazy(() => import('../components/affiliateNetworks/AffiliateNetworksAdmin'));
const DistributionAdmin = React.lazy(() => import('../components/distribution/DistributionAdmin'));
const RewardsAdmin = React.lazy(() => import('../components/RewardsAdmin'));
const BannersAdmin = React.lazy(() => import('../components/BannersAdmin'));
const XmlSuppliersAdmin = React.lazy(() => import('../components/XmlSuppliersAdmin'));
const EmailCampaignsAdmin = React.lazy(() => import('../components/EmailCampaignsAdmin'));
const MailAdmin = React.lazy(() => import('../components/MailAdmin'));
import ExternalSuppliersPage from './ExternalSuppliers';
import { 
  Supplier, CommissionType, BookingMode, SEOConfig, 
  RateTier
} from '../../types';

// Mock data stubs (Real mock data removed)
import { AdminPromotionModal } from '../components/dashboard/AdminPromotionModal';
import { CmsContent, HomepageContentSection, MOCK_HOMEPAGE_CONTENT, SeoContent, SiteSettingsContent } from '../components/dashboard/ContentSections';
import { EditSupplierModal, ratingToDefaultPercent } from '../components/dashboard/EditSupplierModal';
import { RatesModal, SupplierFleetModal } from '../components/dashboard/FleetModals';
import { ApiConnectionModal, PageEditorModal, SEOEditorModal } from '../components/dashboard/SEOEditorModal';
import { SearchingLogosContent } from '../components/dashboard/SearchingLogos';
import { SupplierRequestsContent } from '../components/dashboard/SupplierRequestsContent';
import { getImageUrl, resizeImage } from '../components/dashboard/images';
import { MobileTabBar, OWN_HERO_SECTIONS, SECTION_META, type Section, Sidebar } from '../components/dashboard/navigation';
import { useResponsiveTables } from '../components/dashboard/ui';

const MOCK_CARS: any[] = [];
const MOCK_CATEGORY_IMAGES: any = {};

// ==================== Affiliates ====================
const AffiliatesContent = () => <AffiliatesAdmin />;
const AffiliateNetworksContent = () => (
  <React.Suspense fallback={<div className="space-y-4"><div className="h-40 animate-pulse rounded-3xl bg-slate-200/70" /><div className="h-12 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
    <AffiliateNetworksAdmin />
  </React.Suspense>
);

const DistributionContent = () => (
  <React.Suspense fallback={<div className="space-y-4"><div className="h-12 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
    <DistributionAdmin />
  </React.Suspense>
);

const PromotionsContent = () => <PromotionsAdmin />;

// ==================== Suppliers Content ====================
const SuppliersContent = (props: any) => <SuppliersBoard {...props} />;

// ==================== Fleet ====================
const FleetContent = ({ cars, loading, onRefresh, setManagingPromosForCar, setIsPromotionModalOpen }: any) => (
  <FleetBoard cars={cars} loading={loading} onRefresh={onRefresh}
    onPricing={(c: any) => { setManagingPromosForCar(c); setIsPromotionModalOpen(true); }} />
);
const ApiPartnersContent = () => <IntegrationsAdmin />;

// ==================== Main AdminDashboard ====================
export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  useResponsiveTables(contentRef, activeSection);
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierFetchError, setSupplierFetchError] = useState<string | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [viewingFleetSupplier, setViewingFleetSupplier] = useState<any>(null);
  const [viewingRatesCar, setViewingRatesCar] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [carLibrary, setCarLibrary] = useState<any[]>([]);
  const [loadingCarLibrary, setLoadingCarLibrary] = useState(false);
  const [supplierApps, setSupplierApps] = useState<any[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [approvingApplication, setApprovingApplication] = useState<any>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isSeoEditorOpen, setIsSeoEditorOpen] = useState(false);
  const [editingSeoConfig, setEditingSeoConfig] = useState<any>(null);
  const [seoConfigs, setSeoConfigs] = useState<SEOConfig[]>([]);
  const [seoPage, setSeoPage] = useState(0);
  const [seoTotalPages, setSeoTotalPages] = useState(0);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [managingPromosForCar, setManagingPromosForCar] = useState<any>(null);
  const [homepageContent, setHomepageContent] = useState(MOCK_HOMEPAGE_CONTENT);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(MOCK_CATEGORY_IMAGES as Record<string, string>);
  const [loadingHomepageEditor, setLoadingHomepageEditor] = useState(false);
  const [savingHomepageEditor, setSavingHomepageEditor] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = async (text: string, id: string, label: string = "Password") => {
    // Always toggle reveal state even if there's no text to copy
    const next = new Set(revealedPasswords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedPasswords(next);

    if (!text) {
        showToast(`No ${label} available to copy`, 'error');
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showToast(`${label} copied to clipboard!`);
        } else {
            // Fallback for older browsers or insecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) showToast(`${label} copied to clipboard!`);
            else throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        // If we can't copy, we still showed the toast if we wanted, but let's be explicit
        // showToast('Revealed (Copy failed)', 'error');
    }
  };

  const toggleReveal = (id: string) => {
    const next = new Set(revealedPasswords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedPasswords(next);
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await adminFetch('/api/admin/suppliers');
      const normalized = (Array.isArray(res) ? res : []).map((s: any) => ({
        ...s,
        contactEmail: s.contactEmail,
        logo: s.logoUrl,
        commissionValue: s.commissionPercent,
        carCount: s.carCount || 0
      }));
      setSuppliers(normalized);
      setSupplierFetchError(null);
    } catch (e) { 
      console.error('Failed to fetch suppliers', e);
      setSupplierFetchError(e instanceof Error ? e.message : 'Failed to fetch suppliers');
    } finally { setLoadingSuppliers(false); }
  };

  const fetchSupplierApps = async () => {
    try {
      const res = await adminFetch('/api/partner-applications/admin/all');
      setSupplierApps(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch supplier applications', e);
    }
  };

  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const res = await adminFetch('/api/admin/cms/pages');
      setPages(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch pages', e);
    } finally {
      setLoadingPages(false);
    }
  };

  const seoSearchRef = useRef('');
  const seoRequestRef = useRef(0);
  const [seoError, setSeoError] = useState('');
  const [seoTotal, setSeoTotal] = useState<number | undefined>(undefined);
  const fetchSeoConfigs = async (page = 0, search: string = seoSearchRef.current) => {
    seoSearchRef.current = search;
    const request = ++seoRequestRef.current;
    const wanted = Math.max(0, Number.isFinite(page) ? page : 0);
    setLoadingSeo(true);
    setSeoError('');
    try {
      // Use the paginated endpoint instead of the full list to avoid 502/timeouts
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await adminFetch(`/api/admin/seo/routes?page=${wanted}&size=20&sort=route,asc${q}`);
      if (request !== seoRequestRef.current) return; // a newer page was asked for meanwhile
      if (res && Array.isArray(res.content)) {
        // Spring sends the page numbers either at the top level or under "page"
        const meta = res.page && typeof res.page === 'object' ? res.page : res;
        setSeoConfigs(res.content);
        setSeoTotalPages(Number(meta.totalPages) || 1);
        setSeoPage(Number.isFinite(Number(meta.number)) ? Number(meta.number) : wanted);
        setSeoTotal(Number.isFinite(Number(meta.totalElements)) ? Number(meta.totalElements) : undefined);
      } else {
        setSeoConfigs(Array.isArray(res) ? res : []);
        setSeoTotalPages(1);
        setSeoPage(0);
        setSeoTotal(Array.isArray(res) ? res.length : undefined);
      }
    } catch (e: any) {
      if (request !== seoRequestRef.current) return;
      console.error('Failed to fetch SEO configs', e);
      setSeoError(e?.message ? `Couldn't load page ${wanted + 1}: ${e.message}` : `Couldn't load page ${wanted + 1}.`);
    } finally {
      if (request === seoRequestRef.current) setLoadingSeo(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await adminFetch('/api/admin/locations');
      setLocations(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch locations', e);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchBookings = async (supplierId?: string | null) => {
    setLoadingBookings(true);
    try {
        const url = supplierId ? `/api/admin/bookings?supplierId=${supplierId}` : '/api/admin/bookings';
        const res = await adminFetch(url);
        setBookings(Array.isArray(res) ? res : []);
    } catch (e) {
        console.error('Failed to fetch bookings', e);
        setBookings([]);
    } finally { setLoadingBookings(false); }
  };

  const fetchFleet = async (supplierId?: string | null) => {
    setLoadingFleet(true);
    try {
        const url = supplierId ? `/api/admin/fleet/cars?supplierId=${supplierId}` : '/api/admin/fleet/cars';
        const res = await adminFetch(url);
        setFleet(Array.isArray(res) ? res : []);
    } catch (e) {
        console.error('Failed to fetch fleet', e);
        setFleet([]);
    } finally { setLoadingFleet(false); }
  };

  const fetchCarLibrary = async () => {
    setLoadingCarLibrary(true);
    try {
        const res = await adminFetch('/api/admin/car-models');
        const normalized = Array.isArray(res) ? res.map(m => ({
            ...m,
            image: m.imageUrl // Map backend 'imageUrl' to frontend 'image'
        })) : [];
        setCarLibrary(normalized);
    } catch (e) {
        console.error('Failed to fetch car library', e);
        setCarLibrary([]);
    } finally { setLoadingCarLibrary(false); }
  };

  const fetchHomepageEditor = async () => {
    setLoadingHomepageEditor(true);
    try {
      const [contentRes, imagesRes] = await Promise.all([
        adminFetch('/api/admin/homepage'),
        adminFetch('/api/admin/homepage/category-images')
      ]);

      setHomepageContent(contentRes && typeof contentRes === 'object' ? contentRes : MOCK_HOMEPAGE_CONTENT);
      setCategoryImages(imagesRes && typeof imagesRes === 'object' ? imagesRes : {});
    } catch (e) {
      console.error('Failed to fetch homepage editor data', e);
    } finally {
      setLoadingHomepageEditor(false);
    }
  };

  const handleFixData = async () => {
    if (!window.confirm("This will repair data by activating suppliers and locations with cars. Proceed?")) return;
    try {
      await adminFetch('/api/admin/suppliers/fix-data', { method: 'POST' });
      alert("Data repaired successfully.");
      fetchSuppliers();
      fetchFleet();
    } catch (e) {
      alert("Failed to repair data.");
    }
  };

  useEffect(() => { 
    fetchSuppliers(); 
    fetchCarLibrary();
    fetchSupplierApps();
  }, []);

  useEffect(() => {
    if (activeSection === 'supplierrequests') {
      fetchSupplierApps();
    }
  }, [activeSection]);

  useEffect(() => {
    fetchBookings(selectedSupplierId);
    fetchFleet(selectedSupplierId);
  }, [selectedSupplierId]);

  useEffect(() => {
    if (activeSection === 'cms') {
      fetchPages();
    }
    if (activeSection === 'seo') {
      fetchSeoConfigs();
      fetchLocations();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'homepage') {
      fetchHomepageEditor();
    }
  }, [activeSection]);

  const stats = { 
    totalSuppliers: suppliers.length, 
    activeSuppliers: suppliers.filter(s => s.status === 'active' || (s as any).active).length, 
    totalBookings: bookings.length, 
    totalRevenue: bookings.filter((b: any) => String(b.status).toLowerCase() !== 'cancelled').reduce((acc, b: any) => acc + (Number(b.finalPrice ?? b.totalPrice) || 0), 0)
  };
  const pendingCount = supplierApps.length;

  const handleSaveSupplier = async (updatedSupplier: any) => {
    try {
      const payload = {
        name: updatedSupplier.name,
        email: updatedSupplier.email || updatedSupplier.contactEmail, // Login email
        contactEmail: updatedSupplier.contactEmail, // Reservation email
        phone: updatedSupplier.phone || "",
        logoUrl: updatedSupplier.logo || updatedSupplier.logoUrl || "",
        locations: updatedSupplier.locations || [],
        commissionType: updatedSupplier.commissionType || CommissionType.PARTIAL_PREPAID,
        commissionPercent: updatedSupplier.commissionPercent || 0,
        bookingMode: updatedSupplier.bookingMode || BookingMode.FREE_SALE,
        active: updatedSupplier.status === 'active' || updatedSupplier.active !== false,
        password: updatedSupplier.password || undefined,
        enableSocialProof: updatedSupplier.enableSocialProof || false,
        hogicarChoice: updatedSupplier.hogicarChoice || false,
        address: updatedSupplier.address || "",
        termsAndConditions: updatedSupplier.termsAndConditions || "",
        includesCDW: updatedSupplier.includesCDW ?? true,
        includesTP: updatedSupplier.includesTP ?? true,
        oneWayFee: updatedSupplier.oneWayFee || 0,
        gracePeriodHours: updatedSupplier.gracePeriodHours || 0,
        minBookingLeadTime: updatedSupplier.minBookingLeadTime || 0,
        connectionType: updatedSupplier.connectionType || 'manual',
        rating: updatedSupplier.rating || 5.0,
        ratingReviewCount: updatedSupplier.ratingReviewCount || 0,
        ratingCleanliness: updatedSupplier.ratingCleanliness ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingCondition: updatedSupplier.ratingCondition ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingValueForMoney: updatedSupplier.ratingValueForMoney ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingPickupSpeed: updatedSupplier.ratingPickupSpeed ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingDropoffSpeed: updatedSupplier.ratingDropoffSpeed ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingStaffService: updatedSupplier.ratingStaffService ?? ratingToDefaultPercent(updatedSupplier.rating),
        ratingEaseOfLocating: updatedSupplier.ratingEaseOfLocating ?? ratingToDefaultPercent(updatedSupplier.rating),
        pickupType: updatedSupplier.pickupType,
        minRentalDays: updatedSupplier.minRentalDays,
        maxRentalDays: updatedSupplier.maxRentalDays,
        maxBookingLeadTimeDays: updatedSupplier.maxBookingLeadTimeDays,
        logoScale: updatedSupplier.logoScale || 100,
        logoScaleMobile: updatedSupplier.logoScaleMobile || 100
      };

      if (!updatedSupplier.id) {
        await adminFetch('/api/admin/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert("Supplier created successfully");
      } else {
        await adminFetch(`/api/admin/suppliers/${updatedSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert("Supplier updated successfully");
      }
      
      await fetchSuppliers();
      setEditingSupplier(null);
      if (approvingApplication) { 
        await adminFetch(`/api/partner-applications/admin/${approvingApplication.id}`, { method: 'DELETE' }); 
        fetchSupplierApps(); 
        setApprovingApplication(null); 
      }
    } catch (err: any) { 
        alert(`Action failed: ${err.message}`); 
    }
  };

  const handleToggleVisibility = async (supplier: any) => {
    const action = supplier.visible ? 'HIDE' : 'SHOW';
    const message = supplier.visible 
        ? "Are you sure you want to hide this supplier?\n\nThis will remove this supplier and its vehicles from all customer-facing search results and booking flows across Hogicar.\n\nThe supplier will NOT be deleted and will remain available in Manage Suppliers for administration."
        : "Are you sure you want to make this supplier visible to customers again?\n\nOnce enabled, its eligible vehicles can appear in customer-facing search and booking results.";
    
    if (!confirm(message)) return;
    
    try {
        await adminFetch(`/api/admin/suppliers/${supplier.id}/visibility`, {
            method: 'PATCH',
            body: JSON.stringify({ visible: !supplier.visible })
        });
        showToast(`Supplier ${!supplier.visible ? 'is now visible' : 'hidden successfully'}`);
        fetchSuppliers();
    } catch (e: any) {
        alert("Failed to update visibility: " + e.message);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    try {
      await adminFetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
      alert('Supplier deleted successfully');
      await fetchSuppliers();
    } catch (err: any) { alert(`Delete failed: ${err.message}`); }
  };

  const handleApproveSupplier = async (id: string) => { 
    const s = suppliers.find(s => s.id === id); 
    if (s) { 
        await handleSaveSupplier({ ...s, status: 'active' });
    } 
  };
  const handleSaveApiConnection = (updated: Supplier) => { handleSaveSupplier(updated); setIsApiModalOpen(false); setEditingSupplier(null); };
  const handleSavePromotion = (carId: string, newTier: RateTier) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers.push(newTier); setIsPromotionModalOpen(false); setManagingPromosForCar(null); };
  const handleDeleteTier = (carId: string, tierId: string) => { const idx = MOCK_CARS.findIndex(c => c.id === carId); if (idx > -1) MOCK_CARS[idx].rateTiers = MOCK_CARS[idx].rateTiers.filter(t => t.id !== tierId); setManagingPromosForCar({...MOCK_CARS[idx]}); };
  const handleRejectApplication = async (id: string) => {
    if (confirm('Are you sure you want to reject and delete this application?')) {
      try {
        await adminFetch(`/api/partner-applications/admin/${id}`, { method: 'DELETE' });
        fetchSupplierApps();
      } catch (e) {
        alert("Failed to reject application");
      }
    }
  };

  const handleSaveSeoConfig = async (config: any) => {
    try {
        await adminFetch('/api/admin/seo', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        showToast("SEO config saved successfully");
        fetchSeoConfigs();
        setIsSeoEditorOpen(false);
        setEditingSeoConfig(null);
    } catch (e: any) {
        alert(`Failed to save SEO config: ${e.message}`);
    }
  };

  const handleDeleteSeoConfig = async (route: string) => {
    if (!confirm(`Are you sure you want to delete SEO config for route: ${route}?`)) return;
    try {
        await adminFetch(`/api/admin/seo?route=${encodeURIComponent(route)}`, { method: 'DELETE' });
        showToast("SEO config deleted");
        fetchSeoConfigs();
    } catch (e: any) {
        alert(`Delete failed: ${e.message}`);
    }
  };
  const handleApproveApplication = (newSupplier: any, app: any) => { setApprovingApplication(app); setEditingSupplier(newSupplier); };
  const handleEditPage = (page: any) => { setEditingPage(page); setIsPageEditorOpen(true); };
  const handleSavePage = async (slug: string, data: any) => {
    try {
      await adminFetch(`/api/admin/cms/pages/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast("Page updated successfully");
      fetchPages();
    } catch (e: any) {
      alert("Failed to save page: " + e.message);
    }
  };
  const handleNewSeo = () => { setEditingSeoConfig({}); setIsSeoEditorOpen(true); };
  const handleEditSeo = async (config: any) => {
    if (!config?.route) {
      setEditingSeoConfig(config || {});
      setIsSeoEditorOpen(true);
      return;
    }

    try {
      const fullConfig = await adminFetch(`/api/admin/seo?route=${encodeURIComponent(config.route)}`);
      setEditingSeoConfig(fullConfig || config);
      setIsSeoEditorOpen(true);
    } catch (e: any) {
      console.error('Failed to fetch SEO config detail', e);
      alert(`Failed to open SEO config: ${e.message}`);
    }
  };
  const handleSaveHomepage = async (content: any, images: Record<string, string>) => {
    setSavingHomepageEditor(true);
    try {
      await adminFetch('/api/admin/homepage', {
        method: 'PUT',
        body: JSON.stringify(content)
      });
      await adminFetch('/api/admin/homepage/category-images', {
        method: 'PUT',
        body: JSON.stringify(images)
      });
      setHomepageContent(content);
      setCategoryImages(images);
    } catch (e: any) {
      alert(`Failed to save homepage content: ${e.message}`);
      throw e;
    } finally {
      setSavingHomepageEditor(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <OverviewAdmin bookings={bookings} loading={loadingBookings} pendingApplications={pendingCount} activeSuppliers={stats.activeSuppliers} onNavigate={(s: string) => setActiveSection(s as any)} onRefresh={() => fetchBookings(selectedSupplierId)} />;
      case 'suppliers': return <SuppliersContent suppliers={suppliers} bookings={bookings} fetchError={supplierFetchError} onEdit={setEditingSupplier} onApprove={handleApproveSupplier} onManageApi={(s: any) => { setEditingSupplier(s); setIsApiModalOpen(true); }} onManageFleet={setViewingFleetSupplier} onAddSupplier={() => setEditingSupplier({})} onRefresh={fetchSuppliers} onDelete={handleDeleteSupplier} onFixData={handleFixData} onToggleVisibility={handleToggleVisibility} revealedPasswords={revealedPasswords} onCopy={handleCopy} />;
      case 'supplierrequests': return <SupplierRequestsContent apps={supplierApps} onApprove={handleApproveApplication} onReject={handleRejectApplication} onRefresh={fetchSupplierApps} />;
      case 'bookings': return <BookingsAdmin bookings={bookings} loading={loadingBookings} onRefresh={() => fetchBookings(selectedSupplierId)} />;
      case 'fleet': return <FleetContent cars={fleet} loading={loadingFleet} onRefresh={() => fetchFleet(selectedSupplierId)} setManagingPromosForCar={setManagingPromosForCar} setIsPromotionModalOpen={setIsPromotionModalOpen} />;
      case 'carlibrary': return <CarLibraryAdmin library={carLibrary} loading={loadingCarLibrary} onRefresh={fetchCarLibrary} prepareImage={f => resizeImage(f, 7680, 4320, { removeBackground: true })} />;
      case 'apipartners': return <ApiPartnersContent />;
      case 'xmlsuppliers': return (
        <React.Suspense fallback={<div className="space-y-4"><div className="h-48 animate-pulse rounded-3xl bg-slate-200/70" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
          <XmlSuppliersAdmin />
        </React.Suspense>
      );
      case 'affiliates': return <AffiliatesContent />;
      case 'affiliatenetworks': return <AffiliateNetworksContent />;
      case 'distribution': return <DistributionContent />;
      case 'banners': return (
        <React.Suspense fallback={<div className="space-y-4"><div className="h-48 animate-pulse rounded-3xl bg-slate-200/70" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
          <BannersAdmin />
        </React.Suspense>
      );
      case 'mail': return (
        <React.Suspense fallback={<div className="space-y-4"><div className="h-48 animate-pulse rounded-3xl bg-slate-200/70" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
          <MailAdmin />
        </React.Suspense>
      );
      case 'emailcampaigns': return (
        <React.Suspense fallback={<div className="space-y-4"><div className="h-48 animate-pulse rounded-3xl bg-slate-200/70" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
          <EmailCampaignsAdmin />
        </React.Suspense>
      );
      case 'rewards': return (
        <React.Suspense fallback={<div className="space-y-4"><div className="h-48 animate-pulse rounded-3xl bg-slate-200/70" /><div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /></div>}>
          <RewardsAdmin />
        </React.Suspense>
      );
      case 'cms': return <CmsContent pages={pages} onEditPage={handleEditPage} />;
      case 'blog': return <BlogManagement />;
      case 'sitemap': return <SitemapManagement />;
      case 'seo': return <SeoContent configs={seoConfigs} onEditSeo={handleEditSeo} onNewSeo={handleNewSeo} onDeleteSeo={handleDeleteSeoConfig} loading={loadingSeo} currentPage={seoPage} totalPages={seoTotalPages} totalElements={seoTotal} error={seoError} onPageChange={(p: number) => fetchSeoConfigs(p)} onSearch={(q: string) => fetchSeoConfigs(0, q)} />;
      case 'seoaudit': return <SeoAuditManagement />;
      case 'push': return <PushNotificationManagement />;
      case 'homepage':
        if (loadingHomepageEditor) {
          return <div className="p-8 text-center text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading Homepage Editor...</div>;
        }
        return <HomepageContentSection content={homepageContent} categoryImages={categoryImages} onSave={handleSaveHomepage} isSaving={savingHomepageEditor} />;
      case 'sitesettings': return <SiteSettingsContent />;
      case 'promotions': return <PromotionsContent />;
      case 'globallocations': return <LocationsAdmin />;
      case 'homepagelogos': return <HomepageBrandsAdmin prepareImage={f => resizeImage(f, 800, 400)} imageUrl={getImageUrl} />;
      case 'searchinglogos': return <SearchingLogosContent />;
      case 'externalsuppliers': return <ExternalSuppliersPage />;
      default: return null;
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-slate-50 font-sans text-slate-900">
      <EditSupplierModal isOpen={!!editingSupplier} onClose={() => setEditingSupplier(null)} onSave={handleSaveSupplier} supplier={editingSupplier} onCopy={handleCopy} />
      {editingSupplier && isApiModalOpen && <ApiConnectionModal supplier={editingSupplier} isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSave={handleSaveApiConnection} />}
      {isPageEditorOpen && <PageEditorModal page={editingPage} isOpen={isPageEditorOpen} onClose={() => setIsPageEditorOpen(false)} onSave={handleSavePage} />}
      {isSeoEditorOpen && <SEOEditorModal config={editingSeoConfig} isOpen={isSeoEditorOpen} onClose={() => setIsSeoEditorOpen(false)} onSave={handleSaveSeoConfig} locations={locations} />}
      {managingPromosForCar && <AdminPromotionModal car={managingPromosForCar} isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} onSave={handleSavePromotion} onDeleteTier={handleDeleteTier} />}
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-slate-900 px-4 py-2.5 text-white shadow-xl"
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} countSupplierRequests={pendingCount} />

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setIsSidebarOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="flex items-center gap-2 sm:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">H</span>
              <span className="text-sm font-semibold text-slate-900">Admin</span>
            </span>
            <nav className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex" aria-label="Breadcrumb">
              <span className="text-slate-500">{SECTION_META[activeSection]?.group || 'Admin'}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="truncate font-medium text-slate-900">{SECTION_META[activeSection]?.title || activeSection}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {['dashboard', 'bookings', 'fleet', 'suppliers'].includes(activeSection) && (
                <label className="relative flex items-center">
                  <span className="sr-only">Supplier</span>
                  <Building className="pointer-events-none absolute left-2.5 h-4 w-4 text-slate-400" />
                  <select
                    className="h-9 w-[172px] rounded-lg border border-slate-300 bg-white pl-8 pr-7 text-sm text-slate-900 sm:w-auto sm:max-w-[220px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    value={selectedSupplierId || ''}
                    onChange={(e) => setSelectedSupplierId(e.target.value || null)}
                  >
                    <option value="">All suppliers</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white sm:flex" title="Administrator">AD</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
          {/* Sections with their own banner keep the page title for screen readers only */}
          <div className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${OWN_HERO_SECTIONS.has(activeSection) && !selectedSupplierId ? '' : 'mb-5 sm:mb-6'}`}>
            <div className={OWN_HERO_SECTIONS.has(activeSection) ? 'sr-only' : ''}>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{SECTION_META[activeSection]?.title || activeSection}</h1>
              <p className="mt-1 text-sm text-slate-500">{SECTION_META[activeSection]?.description}</p>
            </div>
            {selectedSupplierId && (() => {
              const sup = suppliers.find(x => x.id.toString() === selectedSupplierId.toString());
              const revealed = revealedPasswords.has(`header-${sup?.id}`);
              return (
                <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm max-sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Supplier login</p>
                    <p className="max-w-[200px] truncate font-medium text-slate-900">{sup?.email || 'N/A'}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <p className="text-xs text-slate-500">Password</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(sup?.password || '', `header-${sup?.id}`, 'Password')}
                      className="flex items-center gap-1.5 font-mono font-medium text-slate-900 hover:text-accent"
                      title="Reveal and copy"
                    >
                      {revealed ? (sup?.password || 'N/A') : '••••••••'}
                      {revealed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div ref={contentRef} className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div 
                key={activeSection} 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="min-h-[600px] pb-2 md:overflow-x-auto md:[&_table]:min-w-[860px]"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
          </div>

          <footer className="mt-12 hidden border-t border-slate-200 pt-6 text-xs text-slate-400 lg:block">
            © {new Date().getFullYear()} Hogicar · Admin
          </footer>
          <MobileTabBar activeSection={activeSection} setActiveSection={setActiveSection} onMore={() => setIsSidebarOpen(true)} pendingCount={pendingCount} />
        </main>
      </div>

      {viewingFleetSupplier && (
        <SupplierFleetModal 
          supplier={viewingFleetSupplier} 
          onClose={() => setViewingFleetSupplier(null)} 
          onShowRates={setViewingRatesCar}
        />
      )}

      {viewingRatesCar && (
        <RatesModal 
          car={viewingRatesCar} 
          supplier={viewingFleetSupplier}
          onClose={() => setViewingRatesCar(null)}
        />
      )}
    </div>
  );
};
