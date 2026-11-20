// Admin dashboard: navigation (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Car from 'lucide-react/dist/esm/icons/car';
import Building from 'lucide-react/dist/esm/icons/building';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Settings from 'lucide-react/dist/esm/icons/settings';
import MailQuestion from 'lucide-react/dist/esm/icons/mail-question';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Plug from 'lucide-react/dist/esm/icons/plug';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Waypoints from 'lucide-react/dist/esm/icons/waypoints';
import RadioTower from 'lucide-react/dist/esm/icons/radio-tower';
import Tag from 'lucide-react/dist/esm/icons/tag';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Search from 'lucide-react/dist/esm/icons/search';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Send from 'lucide-react/dist/esm/icons/send';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Bell from 'lucide-react/dist/esm/icons/bell';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== UI Components ====================
export const SECTION_META: Record<string, { title: string; description: string; group: string }> = {
  dashboard: { title: 'Overview', description: 'Bookings, revenue and recent activity across Hogicar.', group: 'Operations' },
  bookings: { title: 'Bookings', description: 'Every reservation and its current status.', group: 'Operations' },
  suppliers: { title: 'Suppliers', description: 'Direct suppliers, their fleets, visibility and access.', group: 'Operations' },
  supplierrequests: { title: 'Supplier requests', description: 'Applications from companies that want to join Hogicar.', group: 'Operations' },
  externalsuppliers: { title: 'External suppliers', description: 'API suppliers: pricing, contact details and pick-up type.', group: 'Operations' },
  fleet: { title: 'Fleet', description: 'Cars, rates and promotions from direct suppliers.', group: 'Operations' },
  promotions: { title: 'Promotions', description: 'Promo codes for checkout and every supplier promotion.', group: 'Commercial' },
  carlibrary: { title: 'Car library', description: 'Car models, images and specifications used across the site.', group: 'Commercial' },
  apipartners: { title: 'Integrations', description: 'Partner API keys and connected services.', group: 'Commercial' },
  xmlsuppliers: { title: 'XML suppliers', description: 'Rental companies connected through their own XML booking API (OTA, SOAP or their own format).', group: 'Operations' },
  affiliates: { title: 'Affiliates', description: 'Partners who earn commission on the bookings they send.', group: 'Commercial' },
  affiliatenetworks: { title: 'Affiliate networks', description: 'Awin and other affiliate networks: tracking, conversions and reconciliation.', group: 'Commercial' },
  distribution: { title: 'Distribution network', description: 'Skyscanner, KAYAK and partner channels: onboarding, inventory, pricing, deeplinks and monitoring.', group: 'Commercial' },
  rewards: { title: 'Rewards', description: 'Hogicar Rewards members, points and reward codes.', group: 'Commercial' },
  mail: { title: 'Mail', description: 'Write emails with your signature and attachments.', group: 'Commercial' },
  emailcampaigns: { title: 'Email campaigns', description: 'Send discounts and promotions to customers by email.', group: 'Commercial' },
  push: { title: 'Push notifications', description: 'Messages sent to app users.', group: 'Commercial' },
  homepage: { title: 'Homepage', description: 'Hero, sections and images on the homepage.', group: 'Website' },
  homepagelogos: { title: 'Homepage branding', description: 'The rental brand logos shown on the homepage.', group: 'Website' },
  searchinglogos: { title: 'Searching logos', description: 'Logos shown on the searching screen.', group: 'Website' },
  banners: { title: 'Search banners', description: 'Offers shown between the cars on the search results page.', group: 'Website' },
  cms: { title: 'Pages', description: 'Content pages on the website.', group: 'Website' },
  blog: { title: 'Blog', description: 'Travel guides and articles.', group: 'Website' },
  globallocations: { title: 'Locations', description: 'Airports, cities and stations customers can search.', group: 'Website' },
  seo: { title: 'SEO', description: 'Titles, descriptions and landing pages for search engines.', group: 'SEO & settings' },
  seoaudit: { title: 'SEO audit', description: 'Checks for SEO issues across the site.', group: 'SEO & settings' },
  sitemap: { title: 'Sitemap', description: 'Sitemap files submitted to search engines.', group: 'SEO & settings' },
  sitesettings: { title: 'Site settings', description: 'Global settings such as the searching screen and hero image.', group: 'SEO & settings' },
};

export type Section = 'dashboard' | 'suppliers' | 'supplierrequests' | 'bookings' | 'fleet' | 
                'carlibrary' | 'apipartners' | 'affiliates' | 'affiliatenetworks' | 'distribution' | 'rewards' | 'mail' | 'emailcampaigns' | 'banners' | 'cms' | 'seo' | 'seoaudit' |
                'homepage' | 'sitesettings' | 'promotions' | 'globallocations' | 
                'homepagelogos' | 'searchinglogos' | 'externalsuppliers' | 'xmlsuppliers' | 'blog' | 'sitemap' | 'push';

export const OWN_HERO_SECTIONS = new Set<string>(['suppliers', 'fleet', 'externalsuppliers', 'blog', 'seo', 'mail']);

// ==================== Sidebar ====================
export const NAV_ITEMS: { section: Section; icon: any }[] = [
  { section: 'dashboard', icon: LayoutDashboard },
  { section: 'bookings', icon: Calendar },
  { section: 'suppliers', icon: Building },
  { section: 'supplierrequests', icon: MailQuestion },
  { section: 'externalsuppliers', icon: Share2 },
  { section: 'xmlsuppliers', icon: Plug },
  { section: 'fleet', icon: Car },
  { section: 'promotions', icon: Tag },
  { section: 'carlibrary', icon: Car },
  { section: 'apipartners', icon: Link2 },
  { section: 'affiliates', icon: DollarSign },
  { section: 'affiliatenetworks', icon: Waypoints },
  { section: 'distribution', icon: RadioTower },
  { section: 'rewards', icon: Gift },
  { section: 'mail', icon: Send },
  { section: 'emailcampaigns', icon: Mail },
  { section: 'push', icon: Bell },
  { section: 'homepage', icon: ImageIcon },
  { section: 'homepagelogos', icon: ImageIcon },
  { section: 'searchinglogos', icon: Search },
  { section: 'banners', icon: Megaphone },
  { section: 'cms', icon: FileText },
  { section: 'blog', icon: MessageSquare },
  { section: 'globallocations', icon: Globe },
  { section: 'seo', icon: Globe },
  { section: 'seoaudit', icon: Activity },
  { section: 'sitemap', icon: Link2 },
  { section: 'sitesettings', icon: Settings },
];

export const Sidebar = ({ activeSection, setActiveSection, isOpen, setIsOpen, countSupplierRequests }: any) => {
  const navigate = useNavigate();
  const groups = Array.from(new Set(NAV_ITEMS.map(i => SECTION_META[i.section]?.group)));

  return (
    <>
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setIsOpen(false)} />}</AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0b1526] transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">H</span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-white">Hogicar</p>
            <p className="text-[11px] text-slate-400">Admin</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X className="h-4 w-4" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
          {groups.map(group => (
            <div key={group} className="mb-5">
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">{group}</p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.filter(i => SECTION_META[i.section]?.group === group).map(({ section, icon: Icon }) => {
                  const active = activeSection === section;
                  const count = section === 'supplierrequests' ? countSupplierRequests : undefined;
                  return (
                    <li key={section}>
                      <button
                        onClick={() => { setActiveSection(section); setIsOpen(false); }}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 font-medium text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent-400" />}
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent-300' : 'text-slate-500'}`} />
                        <span className="truncate">{SECTION_META[section]?.title || section}</span>
                        {count !== undefined && count > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">{count}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-4 w-4 text-slate-500" /> View website
          </a>
          <button
            onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin-login'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 text-slate-500" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

// ==================== Mobile tab bar ====================
export const MobileTabBar = ({ activeSection, setActiveSection, onMore, pendingCount }: any) => {
  const tabs: { section: Section; label: string; icon: any }[] = [
    { section: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { section: 'bookings', label: 'Bookings', icon: Calendar },
    { section: 'suppliers', label: 'Suppliers', icon: Building },
    { section: 'externalsuppliers', label: 'External', icon: Share2 },
  ];
  const inTabs = tabs.some(t => t.section === activeSection);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick navigation">
      <ul className="grid grid-cols-5">
        {tabs.map(({ section, label, icon: Icon }) => {
          const active = activeSection === section;
          return (
            <li key={section}>
              <button onClick={() => { setActiveSection(section); window.scrollTo({ top: 0 }); }} aria-current={active ? 'page' : undefined}
                className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? 'text-accent' : 'text-slate-500'}`}>
                <Icon className="h-5 w-5" />
                {label}
              </button>
            </li>
          );
        })}
        <li>
          <button onClick={onMore} className={`relative flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${!inTabs ? 'text-accent' : 'text-slate-500'}`}>
            <Menu className="h-5 w-5" />
            Menu
            {pendingCount > 0 && <span className="absolute right-[26%] top-2 h-2 w-2 rounded-full bg-red-500" />}
          </button>
        </li>
      </ul>
    </nav>
  );
};
