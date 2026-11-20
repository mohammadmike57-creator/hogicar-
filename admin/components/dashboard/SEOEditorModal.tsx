// Admin dashboard: SEOEditorModal (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useState, useEffect } from 'react';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Car from 'lucide-react/dist/esm/icons/car';
import Save from 'lucide-react/dist/esm/icons/save';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Shield from 'lucide-react/dist/esm/icons/shield';
import MailQuestion from 'lucide-react/dist/esm/icons/mail-question';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Tag from 'lucide-react/dist/esm/icons/tag';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Search from 'lucide-react/dist/esm/icons/search';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Activity from 'lucide-react/dist/esm/icons/activity';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Star from 'lucide-react/dist/esm/icons/star';
import Home from 'lucide-react/dist/esm/icons/home';
import ImageUploadField from '../ImageUploadField';

import { detectRouteType, getDefaultSEOPage } from '../../../utils/seo';

import { InputField, Modal, TextAreaField } from './ui';

// ==================== Modals ====================
export const ApiConnectionModal = ({ supplier, isOpen, onClose, onSave }: any) => <Modal isOpen={isOpen} onClose={onClose} title="API Connection"><div>API settings</div></Modal>;
export const PageEditorModal = ({ page, isOpen, onClose, onSave }: any) => {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  useEffect(() => { if (page) { setTitle(page.title); setContent(page.content); } }, [page]);
  const handleSave = () => { onSave(page.slug, { title, content }); onClose(); };
  if (!isOpen) return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={`Edit ${page?.slug || 'Page'}`}><InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextAreaField label="Content" value={content} onChange={e => setContent(e.target.value)} rows={10} /><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>Cancel</button><button onClick={handleSave} className="bg-[#007ac2] text-white px-3 py-1 rounded">Save</button></div></Modal>);
};
export const SEOEditorModal = ({ config, isOpen, onClose, onSave, locations }: any) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'layout' | 'builder' | 'style' | 'links'>('seo');
  const [route, setRoute] = useState(config?.route || '');
  const [title, setTitle] = useState(config?.title || '');
  const [heroTitle, setHeroTitle] = useState(config?.heroTitle || '');
  const [metaTitle, setMetaTitle] = useState(config?.metaTitle || '');
  const [description, setDescription] = useState(config?.description || '');
  const [keywords, setKeywords] = useState(config?.keywords || '');
  const [primaryKeyword, setPrimaryKeyword] = useState(config?.primaryKeyword || '');
  const [secondaryKeywords, setSecondaryKeywords] = useState(config?.secondaryKeywords || '');
  const [canonicalUrl, setCanonicalUrl] = useState(config?.canonicalUrl || '');
  const [indexable, setIndexable] = useState(config?.indexable !== false);
  const [ogTitle, setOgTitle] = useState(config?.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(config?.ogDescription || '');
  const [ogImage, setOgImage] = useState(config?.ogImage || '');
  const [twitterTitle, setTwitterTitle] = useState(config?.twitterTitle || '');
  const [twitterDescription, setTwitterDescription] = useState(config?.twitterDescription || '');
  const [imageAltText, setImageAltText] = useState(config?.imageAltText || '');
  const [imageTitle, setImageTitle] = useState(config?.imageTitle || '');
  const [breadcrumbTitle, setBreadcrumbTitle] = useState(config?.breadcrumbTitle || '');
  const [searchIntent, setSearchIntent] = useState(config?.searchIntent || '');
  const [relatedKeywords, setRelatedKeywords] = useState(config?.relatedKeywords || '');
  const [published, setPublished] = useState(config?.published !== false);
  const [layout, setLayout] = useState(config?.layout || 'HOMEPAGE');
  const [h1Title, setH1Title] = useState(config?.h1Title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(config?.heroSubtitle || '');
  const [introText, setIntroText] = useState(config?.introText || '');
  const [content, setContent] = useState(config?.content || '');
  const [heroImage, setHeroImage] = useState(config?.heroImage || '');
  const [heroMobileImage, setHeroMobileImage] = useState(config?.heroMobileImage || '');
  const [heroVideo, setHeroVideo] = useState(config?.heroVideo || '');
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(config?.heroOverlayOpacity ?? 0.4);
  const [heroTextColor, setHeroTextColor] = useState(config?.heroTextColor || '#FFFFFF');
  const [heroButtonText, setHeroButtonText] = useState(config?.heroButtonText || '');
  const [heroButtonLink, setHeroButtonLink] = useState(config?.heroButtonLink || '');

  const [primaryColor, setPrimaryColor] = useState(config?.primaryColor || '#007ac2');
  const [secondaryColor, setSecondaryColor] = useState(config?.secondaryColor || '#FFFFFF');
  const [buttonColor, setButtonColor] = useState(config?.buttonColor || '#007ac2');
  const [backgroundColor, setBackgroundColor] = useState(config?.backgroundColor || '#F8FAFC');
  const [accentColor, setAccentColor] = useState(config?.accentColor || '#E2E8F0');

  const [searchWidgetStyle, setSearchWidgetStyle] = useState(config?.searchWidgetStyle || 'DEFAULT');
  const [searchWidgetColor, setSearchWidgetColor] = useState(config?.searchWidgetColor || '');
  const [searchWidgetButtonColor, setSearchWidgetButtonColor] = useState(config?.searchWidgetButtonColor || '');

  const [heroPromotionActive, setHeroPromotionActive] = useState(config?.heroPromotionActive ?? false);
  const [heroPromotionText, setHeroPromotionText] = useState(config?.heroPromotionText || '');
  const [heroPromotionLink, setHeroPromotionLink] = useState(config?.heroPromotionLink || '');
  const [heroPromotionColor, setHeroPromotionColor] = useState(config?.heroPromotionColor || '#E11D48');

  const [showHero, setShowHero] = useState(config?.showHero ?? true);
  const [showSearch, setShowSearch] = useState(config?.showSearch ?? true);
  const [showPromotions, setShowPromotions] = useState(config?.showPromotions ?? true);
  const [showSuppliers, setShowSuppliers] = useState(config?.showSuppliers ?? true);
  const [showBenefits, setShowBenefits] = useState(config?.showBenefits ?? true);
  const [showReviews, setShowReviews] = useState(config?.showReviews ?? true);
  const [showFaq, setShowFaq] = useState(config?.showFaq ?? true);
  const [showSeoContent, setShowSeoContent] = useState(config?.showSeoContent ?? true);
  const [showRelatedDestinations, setShowRelatedDestinations] = useState(config?.showRelatedDestinations ?? true);
  const [showFeaturedCars, setShowFeaturedCars] = useState(config?.showFeaturedCars ?? true);
  const [destinationName, setDestinationName] = useState(config?.destinationName || '');
  const [countryTag, setCountryTag] = useState(config?.countryTag || '');
  const [airportTags, setAirportTags] = useState(config?.airportTags || '');
  const [relatedBlogsJson, setRelatedBlogsJson] = useState(config?.relatedBlogsJson || '');
  const [faqJson, setFaqJson] = useState(config?.faqJson || '');
  const [structuredData, setStructuredData] = useState(config?.structuredData || '');

  const defaultBuilder = {
    sections: {
      hero: { enabled: true },
      search: { enabled: true, pickupPrefill: '' },
      content: { enabled: true, html: '', text: '' },
      features: { enabled: true },
      whyChooseUs: { enabled: true },
      supplierLogos: { enabled: true },
      reviews: { enabled: true, selection: '' },
      popularDestinations: { enabled: true },
      stats: { enabled: false },
      faq: { enabled: true }
    },
    styles: {
      accentColor: '#007ac2',
      backgroundColor: '#ffffff',
      textColor: '#0f172a'
    }
  };

  const [builderConfig, setBuilderConfig] = useState(config?.contentJson ? JSON.parse(config.contentJson) : defaultBuilder);

  useEffect(() => {
    if (config) {
      setRoute(config.route || '');
      setTitle(config.title || '');
      setHeroTitle(config.heroTitle || '');
      setMetaTitle(config.metaTitle || '');
      setDescription(config.description || '');
      setKeywords(config.keywords || '');
      setPrimaryKeyword(config.primaryKeyword || '');
      setSecondaryKeywords(config.secondaryKeywords || '');
      setCanonicalUrl(config.canonicalUrl || '');
      setIndexable(config.indexable !== false);
      setOgTitle(config.ogTitle || '');
      setOgDescription(config.ogDescription || '');
      setOgImage(config.ogImage || '');
      setTwitterTitle(config.twitterTitle || '');
      setTwitterDescription(config.twitterDescription || '');
      setImageAltText(config.imageAltText || '');
      setImageTitle(config.imageTitle || '');
      setBreadcrumbTitle(config.breadcrumbTitle || '');
      setSearchIntent(config.searchIntent || '');
      setRelatedKeywords(config.relatedKeywords || '');
      setPublished(config.published !== false);
      setLayout(config.layout || 'HOMEPAGE');
      setH1Title(config.h1Title || '');
      setHeroSubtitle(config.heroSubtitle || '');
      setIntroText(config.introText || '');
      setContent(config.content || '');
      setHeroImage(config.heroImage || '');
      setHeroPromotionActive(config.heroPromotionActive ?? false);
      setHeroPromotionText(config.heroPromotionText || '');
      setHeroPromotionLink(config.heroPromotionLink || '');
      setHeroPromotionColor(config.heroPromotionColor || '#E11D48');
      setDestinationName(config.destinationName || '');
      setCountryTag(config.countryTag || '');
      setAirportTags(config.airportTags || '');
      setRelatedBlogsJson(config.relatedBlogsJson || '');
      setFaqJson(config.faqJson || '');
      setStructuredData(config.structuredData || '');
      const savedBuilder = config.contentJson ? JSON.parse(config.contentJson) : {};
      setBuilderConfig({
        ...defaultBuilder,
        ...savedBuilder,
        sections: { ...defaultBuilder.sections, ...(savedBuilder.sections || {}) },
        styles: { ...defaultBuilder.styles, ...(savedBuilder.styles || {}) }
      });
      setActiveTab('seo');
    } else {
        setRoute('');
        setTitle('');
        setHeroTitle('');
        setMetaTitle('');
        setDescription('');
        setKeywords('');
        setPrimaryKeyword('');
        setCanonicalUrl('');
        setIndexable(true);
        setOgTitle('');
        setOgDescription('');
        setOgImage('');
        setTwitterTitle('');
        setTwitterDescription('');
        setImageAltText('');
        setImageTitle('');
        setBreadcrumbTitle('');
        setSearchIntent('');
        setRelatedKeywords('');
        setPublished(true);
        setLayout('HOMEPAGE');
        setH1Title('');
        setHeroSubtitle('');
        setIntroText('');
        setContent('');
        setHeroImage('');
        setHeroPromotionActive(false);
        setHeroPromotionText('');
        setHeroPromotionLink('');
        setHeroPromotionColor('#E11D48');
        setDestinationName('');
        setCountryTag('');
        setAirportTags('');
        setRelatedBlogsJson('');
        setFaqJson('');
        setStructuredData('');
        setBuilderConfig(defaultBuilder);
        setActiveTab('seo');
    }
  }, [config, isOpen]);

  useEffect(() => {
    if (!route || route === '/' || !isOpen) return;

    const { routeType, locationSlug } = detectRouteType(route);
    if (!routeType || !locationSlug) return;

    // Find location data if available
    const matchedLocation = locations?.find((l: any) => 
      l.iataCode?.toLowerCase() === locationSlug.toLowerCase() ||
      l.municipality?.toLowerCase()?.replace(/\s+/g, '-') === locationSlug.toLowerCase() ||
      l.name?.toLowerCase()?.replace(/\s+/g, '-') === locationSlug.toLowerCase()
    );

    const defaults = getDefaultSEOPage(routeType, locationSlug, matchedLocation, false, route);

    // Apply defaults only if fields are empty
    if (!title) setTitle(defaults.title);
    if (!metaTitle) setMetaTitle(defaults.ogTitle);
    if (!description) setDescription(defaults.description);
    if (!keywords) setKeywords(defaults.keywords);
    if (!primaryKeyword) setPrimaryKeyword(defaults.primaryKeyword);
    if (!canonicalUrl) setCanonicalUrl(defaults.canonicalUrl);
    if (!breadcrumbTitle) setBreadcrumbTitle(defaults.breadcrumbTitle);
    if (!ogTitle) setOgTitle(defaults.ogTitle);
    if (!twitterTitle) setTwitterTitle(defaults.twitterTitle);
    if (!imageAltText) setImageAltText(defaults.imageAltText);
    if (!imageTitle) setImageTitle(defaults.imageTitle);
    if (!destinationName) setDestinationName(defaults.destinationName);
    if (!countryTag) setCountryTag(defaults.countryTag);
    if (!airportTags) setAirportTags(defaults.airportTags);
    if (!introText) setIntroText(defaults.introText);
    
    // OG Image defaults to site-wide if empty
    if (!ogImage) setOgImage(defaults.ogImage);
    
    // Defaults for search intent, indexing, and published
    if (!searchIntent) setSearchIntent(defaults.searchIntent);
    
    // For booleans, we only set if it's a new config (no id)
    if (!config?.id) {
        setIndexable(defaults.indexable);
        setPublished(defaults.published);
    }
  }, [route, isOpen, locations]);

  const handleSave = () => {
    if (!route || !title || !description) {
      alert("Route, Title, and Description are required.");
      return;
    }
    if (title.length > 60) return alert("Title must not exceed 60 characters.");
    if (description.length > 160) return alert("Description must not exceed 160 characters.");
    
    // Normalize route
    let normalizedRoute = route.trim();
    if (!normalizedRoute.startsWith('/')) normalizedRoute = '/' + normalizedRoute;
    if (normalizedRoute.length > 1 && normalizedRoute.endsWith('/')) {
        normalizedRoute = normalizedRoute.substring(0, normalizedRoute.length - 1);
    }
    
    onSave({ 
      ...config,
      route: normalizedRoute, 
      title, 
      heroTitle,
      metaTitle,
      description, 
      keywords, 
      primaryKeyword,
      secondaryKeywords,
      canonicalUrl, 
      indexable,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      imageAltText,
      imageTitle,
      breadcrumbTitle,
      searchIntent,
      relatedKeywords,
      published,
      layout,
      h1Title,
      heroSubtitle,
      introText,
      content,
      heroImage,
      heroMobileImage,
      heroVideo,
      heroOverlayOpacity,
      heroTextColor,
      heroButtonText,
      heroButtonLink,
      primaryColor,
      secondaryColor,
      buttonColor,
      backgroundColor,
      accentColor,
      searchWidgetStyle,
      searchWidgetColor,
      searchWidgetButtonColor,
      heroPromotionActive,
      heroPromotionText,
      heroPromotionLink,
      heroPromotionColor,
      showHero,
      showSearch,
      showPromotions,
      showSuppliers,
      showBenefits,
      showReviews,
      showFaq,
      showSeoContent,
      showRelatedDestinations,
      showFeaturedCars,
      destinationName,
      countryTag,
      airportTags,
      relatedBlogsJson,
      faqJson,
      structuredData,
      contentJson: JSON.stringify(builderConfig)
    });
  };

  const getScore = () => {
    let score = 0;
    if (title.length >= 30 && title.length <= 60) score += 40;
    if (description.length >= 120 && description.length <= 160) score += 40;
    if (keywords.split(',').filter(k => k.trim()).length >= 3) score += 20;
    return score;
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={config?.id ? 'Edit SEO Optimization' : 'Optimize New Route'}
      size="xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 -mx-6 px-6">
          {[
            { id: 'seo', label: 'General SEO', icon: Globe },
            { id: 'layout', label: 'Layout', icon: LayoutDashboard },
            { id: 'builder', label: 'Sections', icon: LayoutGrid },
            { id: 'style', label: 'Design', icon: Palette },
            { id: 'links', label: 'Internal Links', icon: Link2 }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-[#007ac2] text-[#007ac2]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <InputField 
                        label="Route (e.g. /amman)" 
                        value={route} 
                        onChange={(e: any) => setRoute(e.target.value)} 
                        disabled={!!config?.id}
                        placeholder="/your-custom-route"
                      />
                    </div>
                    {config?.id && (
                      <a 
                        href={`${window.location.origin}${route}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 mb-[1px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-card transition-all flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Live
                      </a>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Page Title</label>
                      <span className={`text-[9px] font-bold ${title.length > 60 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {title.length}/60
                      </span>
                    </div>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-bold ${title.length > 60 ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
                      placeholder="Car Rental in Amman, Jordan | Hogicar"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Meta Description</label>
                      <span className={`text-[9px] font-bold ${description.length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {description.length}/160
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-medium ${description.length > 160 ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
                      placeholder="Enter a compelling description that encourages clicks from Google search results."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <InputField 
                    label="Keywords (comma separated)" 
                    value={keywords} 
                    onChange={(e: any) => setKeywords(e.target.value)} 
                    placeholder="car rental amman, cheap car hire jordan"
                  />
                  <InputField 
                    label="Canonical URL" 
                    value={canonicalUrl} 
                    onChange={(e: any) => setCanonicalUrl(e.target.value)} 
                    placeholder="https://www.hogicar.com/your-route"
                  />
                  <InputField 
                    label="OG Image URL" 
                    value={ogImage} 
                    onChange={(e: any) => setOgImage(e.target.value)} 
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  <div className="p-4 bg-slate-50 rounded-card border border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Advanced SEO
                    </h4>
                    <InputField 
                      label="Primary Keyword" 
                      value={primaryKeyword} 
                      onChange={(e: any) => setPrimaryKeyword(e.target.value)} 
                      placeholder="e.g. car rental Amman"
                    />
                    <InputField 
                      label="Secondary Keywords" 
                      value={secondaryKeywords} 
                      onChange={(e: any) => setSecondaryKeywords(e.target.value)} 
                      placeholder="e.g. rent a car amman airport"
                    />
                    <InputField 
                      label="Search Intent" 
                      value={searchIntent} 
                      onChange={(e: any) => setSearchIntent(e.target.value)} 
                      placeholder="e.g. Commercial, Transactional"
                    />
                    <InputField 
                      label="Breadcrumb Title" 
                      value={breadcrumbTitle} 
                      onChange={(e: any) => setBreadcrumbTitle(e.target.value)} 
                      placeholder="e.g. Amman"
                    />
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-card border border-blue-100 space-y-3">
                    <h4 className="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Social & Image Tags
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <InputField label="OG Title" value={ogTitle} onChange={(e: any) => setOgTitle(e.target.value)} />
                      <InputField label="Twitter Title" value={twitterTitle} onChange={(e: any) => setTwitterTitle(e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Image Alt" value={imageAltText} onChange={(e: any) => setImageAltText(e.target.value)} />
                        <InputField label="Image Title" value={imageTitle} onChange={(e: any) => setImageTitle(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-card border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Indexing Toggle</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Allow Google to index this page?</p>
                      </div>
                      <button 
                        onClick={() => setIndexable(!indexable)}
                        className={`w-12 h-6 rounded-full transition-all relative ${indexable ? 'bg-[#007ac2]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${indexable ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Publish Status</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Show this page on the site & sitemap?</p>
                      </div>
                      <button 
                        onClick={() => setPublished(!published)}
                        className={`w-12 h-6 rounded-full transition-all relative ${published ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${published ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">SEO Score</span>
                        <span className={`text-xs font-black ${getScore() >= 80 ? 'text-emerald-500' : getScore() >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {getScore()}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${getScore() >= 80 ? 'bg-emerald-500' : getScore() >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${getScore()}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Smart Filtering Tags */}
                  <div className="p-4 bg-emerald-50/50 rounded-card border border-emerald-100 space-y-4">
                    <h4 className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Location Tagging (Smart Blogs)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField 
                        label="Destination" 
                        value={destinationName} 
                        onChange={(e: any) => setDestinationName(e.target.value)} 
                        placeholder="e.g. Dubai"
                      />
                      <InputField 
                        label="Country" 
                        value={countryTag} 
                        onChange={(e: any) => setCountryTag(e.target.value)} 
                        placeholder="e.g. UAE"
                      />
                    </div>
                    <InputField 
                      label="Airport Tags" 
                      value={airportTags} 
                      onChange={(e: any) => setAirportTags(e.target.value)} 
                      placeholder="e.g. DXB, Dubai International"
                    />
                  </div>
                </div>
              </div>

              {/* Google Preview */}
              <div className="p-4 bg-slate-50 rounded-card border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Google Search Preview</span>
                </div>
                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm max-w-xl">
                  <div className="text-[14px] text-blue-800 hover:underline cursor-pointer font-medium mb-1 truncate">
                    {title || 'Your Page Title Goes Here'}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-emerald-800 mb-1">
                    <span>https://www.hogicar.com</span>
                    <span className="text-slate-400 font-bold">{route || '/example'}</span>
                  </div>
                  <div className="text-[13px] text-slate-600 line-clamp-2">
                    {description || 'Provide a meta description to see how your page will look in Google search results. Make it attractive to get more clicks!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setLayout('HOMEPAGE')}
                  className={`p-6 rounded-card border-2 cursor-pointer transition-all ${layout === 'HOMEPAGE' ? 'border-[#007ac2] bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${layout === 'HOMEPAGE' ? 'bg-[#007ac2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Homepage Layout</h4>
                      <p className="text-xs text-slate-500">Standard booking experience</p>
                    </div>
                    {layout === 'HOMEPAGE' && <CheckCircle className="w-5 h-5 text-[#007ac2] ml-auto" />}
                  </div>
                </div>

                <div 
                  onClick={() => setLayout('LANDING_PAGE')}
                  className={`p-6 rounded-card border-2 cursor-pointer transition-all ${layout === 'LANDING_PAGE' ? 'border-[#007ac2] bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${layout === 'LANDING_PAGE' ? 'bg-[#007ac2] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Custom Landing</h4>
                      <p className="text-xs text-slate-500">Bespoke section builder</p>
                    </div>
                    {layout === 'LANDING_PAGE' && <CheckCircle className="w-5 h-5 text-[#007ac2] ml-auto" />}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <InputField 
                  label="Hero Title" 
                  value={heroTitle} 
                  onChange={(e: any) => setHeroTitle(e.target.value)} 
                  placeholder="The main headline shown in the hero section"
                />
                <InputField 
                  label="Hero H1 Heading" 
                  value={h1Title} 
                  onChange={(e: any) => setH1Title(e.target.value)} 
                  placeholder="e.g. Best Car Rental in Amman"
                />
                <InputField 
                  label="Hero Subtitle" 
                  value={heroSubtitle} 
                  onChange={(e: any) => setHeroSubtitle(e.target.value)} 
                  placeholder="e.g. Compare trusted suppliers and find the best car rental deals in Amman."
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Intro Text / Description</label>
                  <textarea 
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-medium bg-white"
                    placeholder="Provide unique content for this landing page."
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Main SEO Content (HTML/Markdown support)</label>
                    <span className={`text-[9px] font-bold uppercase tracking-tight ${content.split(/\s+/).filter(Boolean).length >= 1000 ? 'text-emerald-500' : 'text-rose-400'}`}>
                      Word Count: {content.split(/\s+/).filter(Boolean).length} / 1000+ recommended
                    </span>
                  </div>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-slate-200 rounded-card text-sm focus:ring-2 focus:ring-[#007ac2] outline-none transition-all font-medium bg-white"
                    placeholder="Enter the main SEO content for this page. You can use HTML tags."
                  />
                  <p className="text-[9px] text-slate-400 italic font-bold">CRITICAL: Google indexing requires at least 1,000–1,500 words of high-quality content per page.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadField 
                    label="Hero Background Image (Desktop)" 
                    value={heroImage} 
                    onChange={(e: any) => setHeroImage(e.target.value)} 
                    placeholder="https://example.com/hero.jpg"
                  />
                  <ImageUploadField 
                    label="Hero Background Image (Mobile)" 
                    value={heroMobileImage} 
                    onChange={(e: any) => setHeroMobileImage(e.target.value)} 
                    placeholder="https://example.com/hero-mobile.jpg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Hero Background Video (Optional)" 
                    value={heroVideo} 
                    onChange={(e: any) => setHeroVideo(e.target.value)} 
                    placeholder="https://example.com/hero-video.mp4"
                  />
                  <InputField 
                    label="Hero Overlay Opacity (0.0 - 1.0)" 
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={heroOverlayOpacity} 
                    onChange={(e: any) => setHeroOverlayOpacity(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                   <div className="md:col-span-2 bg-rose-50/50 p-4 rounded-card border border-rose-100 mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-rose-500" />
                          <span className="text-[11px] font-extrabold text-rose-900 uppercase tracking-widest">Hero Promotion Section</span>
                        </div>
                        <button 
                          onClick={() => setHeroPromotionActive(!heroPromotionActive)}
                          className={`text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all ${heroPromotionActive ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-200'}`}
                        >
                          {heroPromotionActive ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField 
                          label="Promotion Text (e.g. 15% OFF)" 
                          value={heroPromotionText} 
                          onChange={(e: any) => setHeroPromotionText(e.target.value)} 
                          placeholder="BLACK FRIDAY - 20% OFF"
                        />
                        <InputField 
                          label="Promotion Color (Background)" 
                          type="color"
                          value={heroPromotionColor} 
                          onChange={(e: any) => setHeroPromotionColor(e.target.value)} 
                        />
                      </div>
                      <div className="mt-4">
                        <InputField 
                          label="Promotion Link (Optional)" 
                          value={heroPromotionLink} 
                          onChange={(e: any) => setHeroPromotionLink(e.target.value)} 
                          placeholder="/promotions/black-friday"
                        />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Hero Text Color" 
                    type="color"
                    value={heroTextColor} 
                    onChange={(e: any) => setHeroTextColor(e.target.value)} 
                  />
                  <InputField 
                    label="Hero Button Text" 
                    value={heroButtonText} 
                    onChange={(e: any) => setHeroButtonText(e.target.value)} 
                    placeholder="Book Now"
                  />
                </div>
                <InputField 
                  label="Hero Button Link" 
                  value={heroButtonLink} 
                  onChange={(e: any) => setHeroButtonLink(e.target.value)} 
                  placeholder="#search"
                />
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-card border border-slate-200 mb-6 text-left">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Section Visibility</p>
                <p className="text-[11px] text-slate-500 font-medium">Control which components are displayed on this specific route.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'Hero', state: showHero, setter: setShowHero, icon: ImageIcon },
                  { key: 'Search', state: showSearch, setter: setShowSearch, icon: Search },
                  { key: 'Promotions', state: showPromotions, setter: setShowPromotions, icon: Tag },
                  { key: 'Suppliers', state: showSuppliers, setter: setShowSuppliers, icon: Building2 },
                  { key: 'Benefits', state: showBenefits, setter: setShowBenefits, icon: ShieldCheck },
                  { key: 'Reviews', state: showReviews, setter: setShowReviews, icon: Star },
                  { key: 'FAQ', state: showFaq, setter: setShowFaq, icon: MailQuestion },
                  { key: 'SEO Content', state: showSeoContent, setter: setShowSeoContent, icon: FileText },
                  { key: 'Related Destinations', state: showRelatedDestinations, setter: setShowRelatedDestinations, icon: MapPin },
                  { key: 'Featured Cars', state: showFeaturedCars, setter: setShowFeaturedCars, icon: Car },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-card hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${s.state ? 'bg-blue-50 text-[#007ac2]' : 'bg-slate-50 text-slate-400'}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest">{s.key}</span>
                    </div>
                    <button 
                      onClick={() => s.setter(!s.state)}
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all ${s.state ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      {s.state ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>

              {/* ROUTE-SPECIFIC REVIEWS EDITOR */}
              <div className="bg-slate-50 p-6 rounded-card border border-slate-200 mt-8 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Customer Reviews</p>
                    <p className="text-[11px] text-slate-500 font-medium">Add route-specific reviews to make this page more professional.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const currentItems = builderConfig.sections?.reviews?.items || [];
                      const newItem = { id: Date.now(), author: '', location: '', comment: '', rating: 5, verified: true, date: 'Just now' };
                      setBuilderConfig({
                        ...builderConfig, 
                        sections: {
                          ...builderConfig.sections, 
                          reviews: {
                            ...builderConfig.sections?.reviews, 
                            enabled: true,
                            items: [...currentItems, newItem]
                          }
                        }
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Review
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(builderConfig.sections?.reviews?.items || []).map((review: any, idx: number) => (
                    <div key={review.id || idx} className="p-4 bg-white rounded-card border border-slate-200 shadow-sm space-y-3 relative group">
                       <button 
                         onClick={() => {
                            const newItems = [...builderConfig.sections.reviews.items];
                            newItems.splice(idx, 1);
                            setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                         }} 
                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                       
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Author</label>
                            <input 
                              placeholder="e.g. John Doe" 
                              className="w-full text-xs p-2 border border-slate-100 rounded bg-slate-50/50 focus:bg-white transition-all outline-none" 
                              value={review.author} 
                              onChange={(e) => {
                                const newItems = [...builderConfig.sections.reviews.items];
                                newItems[idx].author = e.target.value;
                                setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                              }} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Location</label>
                            <input 
                              placeholder="e.g. United Kingdom" 
                              className="w-full text-xs p-2 border border-slate-100 rounded bg-slate-50/50 focus:bg-white transition-all outline-none" 
                              value={review.location} 
                              onChange={(e) => {
                                const newItems = [...builderConfig.sections.reviews.items];
                                newItems[idx].location = e.target.value;
                                setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                              }} 
                            />
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Comment</label>
                          <textarea 
                            placeholder="Customer feedback..." 
                            className="w-full text-xs p-3 border border-slate-100 rounded bg-slate-50/50 focus:bg-white transition-all outline-none h-20 resize-none" 
                            value={review.comment} 
                            onChange={(e) => {
                              const newItems = [...builderConfig.sections.reviews.items];
                              newItems[idx].comment = e.target.value;
                              setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                            }} 
                          />
                       </div>

                       <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                               Rating: 
                               <select 
                                 value={review.rating} 
                                 className="border-none bg-slate-50 rounded px-2 py-1 text-[10px] font-black" 
                                 onChange={(e) => {
                                    const newItems = [...builderConfig.sections.reviews.items];
                                    newItems[idx].rating = parseInt(e.target.value);
                                    setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                                 }}
                               >
                                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                               </select>
                            </label>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 checked={review.verified} 
                                 className="rounded border-slate-200 text-blue-500 focus:ring-0"
                                 onChange={(e) => {
                                    const newItems = [...builderConfig.sections.reviews.items];
                                    newItems[idx].verified = e.target.checked;
                                    setBuilderConfig({...builderConfig, sections: {...builderConfig.sections, reviews: {...builderConfig.sections.reviews, items: newItems}}});
                                 }} 
                               />
                               Verified
                            </label>
                          </div>
                          <span className="text-[9px] text-slate-300 font-mono">ID: {review.id}</span>
                       </div>
                    </div>
                  ))}
                  
                  {(!builderConfig.sections?.reviews?.items || builderConfig.sections.reviews.items.length === 0) && (
                    <div className="py-12 border-2 border-dashed border-slate-100 rounded-card flex flex-col items-center justify-center text-slate-300">
                      <Star className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No custom reviews added</p>
                      <p className="text-[9px] mt-1">Default global reviews will be shown</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-card border border-slate-200">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Global Color Theme</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Primary Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Secondary Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Button Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Accent Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center bg-white p-6 rounded border border-slate-200 shadow-inner">
                    <p className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest mb-4">Live Theme Preview</p>
                    <button style={{ backgroundColor: buttonColor }} className="px-8 py-3 text-white font-extrabold text-sm rounded-card shadow-lg active:scale-95 transition-all">
                      Primary CTA
                    </button>
                    <div className="mt-4 flex gap-2">
                       <div style={{ backgroundColor: primaryColor }} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" title="Primary"></div>
                       <div style={{ backgroundColor: secondaryColor }} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" title="Secondary"></div>
                       <div style={{ backgroundColor: accentColor }} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" title="Accent"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-card border border-slate-200">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Search Widget Customization</p>
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Widget Style</label>
                        <select value={searchWidgetStyle} onChange={(e) => setSearchWidgetStyle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-card text-sm font-bold bg-white outline-none">
                          <option value="DEFAULT">Default (Professional)</option>
                          <option value="MODERN">Modern (Glassmorphism)</option>
                          <option value="CLASSIC">Classic (Compact)</option>
                          <option value="MINIMAL">Minimalist</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Widget Accent Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={searchWidgetColor} onChange={(e) => setSearchWidgetColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white shadow-sm" />
                          <input type="text" value={searchWidgetColor} onChange={(e) => setSearchWidgetColor(e.target.value)} placeholder="Auto" className="flex-1 px-3 py-2 border border-slate-200 rounded-card text-xs font-mono font-bold uppercase" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Search Button Color</label>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-card flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#059669] shadow-sm"></div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Locked to Professional Green</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 italic">For optimal conversion and brand consistency, the search button remains emerald green.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-card border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-slate-900 p-2 rounded-xl text-white">
                    <Link2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest leading-none">Internal linking & FAQ</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Connect this page to relevant travel content</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Related Blog Articles (JSON)</label>
                    <TextAreaField 
                      label=""
                      placeholder='[{"title": "Driving Tips for Amman", "slug": "driving-amman-tips", "image": "URL"}]'
                      value={relatedBlogsJson}
                      onChange={(e: any) => setRelatedBlogsJson(e.target.value)}
                      rows={6}
                    />
                    <p className="text-[9px] text-slate-400 mt-2 italic px-1">
                      Add a JSON array of blog articles to display them as related content on this destination landing page.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">FAQ Items (JSON)</label>
                    <TextAreaField 
                      label=""
                      placeholder='[{"question": "How to rent a car?", "answer": "Simple..."}]'
                      value={faqJson}
                      onChange={(e: any) => setFaqJson(e.target.value)}
                      rows={6}
                    />
                    <p className="text-[9px] text-slate-400 mt-2 italic px-1">
                      JSON array of question/answer pairs. Essential for Google FAQ Rich Snippets.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Custom Structured Data (JSON-LD)</label>
                    <TextAreaField 
                      label=""
                      placeholder='{"@context": "https://schema.org", "@type": "Product", ...}'
                      value={structuredData}
                      onChange={(e: any) => setStructuredData(e.target.value)}
                      rows={8}
                    />
                    <p className="text-[9px] text-slate-400 mt-2 italic px-1">
                      Schema.org JSON-LD to be injected into the page head. Critical for advanced SEO indexing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 -mx-6 px-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest transition-all ${getScore() >= 80 ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
              <Activity className="w-3 h-3" />
              SEO Quality: {getScore()}%
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-extrabold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="bg-[#007ac2] hover:bg-[#00619a] text-white px-8 py-2 rounded-card font-extrabold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
