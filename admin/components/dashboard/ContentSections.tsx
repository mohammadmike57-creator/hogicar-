// Admin dashboard: ContentSections (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';
import { useState, useEffect } from 'react';
import Save from 'lucide-react/dist/esm/icons/save';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Settings from 'lucide-react/dist/esm/icons/settings';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Star from 'lucide-react/dist/esm/icons/star';
import { motion } from 'framer-motion';
import ImageUploadField from '../ImageUploadField';
import { 
    adminFetch 
} from '../../../lib/adminApi';
import { SeoBoard } from '../seoPagesUi';
import { CarCategory
} from '../../../types';
import { getImageUrl, resizeImage } from './images';
import { InputField, SectionHeader, TextAreaField } from './ui';

export const MOCK_HOMEPAGE_CONTENT: any = {
  hero: { title: '', subtitle: '', backgroundImage: '' },
  features: [],
  howItWorks: { title: '', steps: [] },
  faqs: { title: '', items: [] },
  popularDestinations: { title: '', destinations: [] },
  topDestinations: {
    title: '',
    subtitle: '',
    countries: [],
    cities: [],
    airports: [],
    regions: []
  }
};
// ==================== CMS ====================
export const CmsContent = ({ pages, onEditPage }: any) => (
  <div className="bg-white rounded-card shadow-lg p-6">
    <SectionHeader title="CMS" icon={FileText} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {pages.map((page: any) => (
        <div key={page.slug} className="p-3 border rounded-card">
          <div className="flex justify-between">
            <div><h3 className="font-bold">{page.title}</h3><p className="text-xs text-gray-500">/{page.slug}</p></div>
            <button onClick={() => onEditPage(page)}><Edit className="w-4 h-4"/></button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Last updated: {page.lastUpdated}</p>
        </div>
      ))}
    </div>
  </div>
);

// ==================== SEO ====================
export const SeoContent = (props: any) => <SeoBoard {...props} />;

// ==================== Homepage ====================
export const HomepageContentSection = ({ content, categoryImages, onSave, isSaving }: any) => {
  const [localContent, setLocalContent] = useState(content || {});
  const [localCategoryImages, setLocalCategoryImages] = useState<Record<string, string>>(categoryImages || {});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalContent(content || {});
  }, [content]);

  useEffect(() => {
    setLocalCategoryImages(categoryImages || {});
  }, [categoryImages]);

  const formatCategoryLabel = (category: string) =>
    category
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const resolveDestinationImage = (destination: any) => {
    const image = typeof destination?.image === 'string' ? destination.image.trim() : '';
    if (image) {
      return image;
    }

    return typeof destination?.imageUrl === 'string' ? destination.imageUrl.trim() : '';
  };

  const fallbackDestinations =
    (MOCK_HOMEPAGE_CONTENT as any)?.popularDestinations?.destinations || [];

  const getDefaultDestination = (index: number) => {
    const fallback = fallbackDestinations[index] || fallbackDestinations[0] || {};
    return {
      id: fallback.id || `d${index + 1}`,
      name: fallback.name || '',
      country: fallback.country || '',
      price: Number(fallback.price) || 0,
      image: fallback.image || ''
    };
  };

  const currentDestinations = Array.isArray(localContent?.popularDestinations?.destinations)
    ? localContent.popularDestinations.destinations.map((destination: any, index: number) => {
        const fallback = getDefaultDestination(index);
        const safeDestination = destination && typeof destination === 'object' ? destination : {};
        return {
          ...fallback,
          ...safeDestination,
          id: safeDestination.id || fallback.id,
          image: resolveDestinationImage(safeDestination)
        };
      })
    : [];

  const updateDestinationField = (index: number, field: string, value: string | number) => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));

      if (!next.popularDestinations || typeof next.popularDestinations !== 'object') {
        next.popularDestinations = {};
      }

      const destinations = Array.isArray(next.popularDestinations.destinations)
        ? [...next.popularDestinations.destinations]
        : [];

      while (destinations.length <= index) {
        destinations.push(getDefaultDestination(destinations.length));
      }

      const existing = destinations[index] && typeof destinations[index] === 'object'
        ? destinations[index]
        : getDefaultDestination(index);

      const normalizedValue = field === 'price' ? Number(value) || 0 : value;

      if (field === 'image') {
        const imageValue = String(normalizedValue || '');
        destinations[index] = {
          ...existing,
          id: existing.id || `d${index + 1}`,
          image: imageValue,
          imageUrl: imageValue
        };
      } else {
        destinations[index] = {
          ...existing,
          id: existing.id || `d${index + 1}`,
          [field]: normalizedValue
        };
      }

      next.popularDestinations.destinations = destinations;
      return next;
    });
  };

  const addDestination = () => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      if (!next.popularDestinations || typeof next.popularDestinations !== 'object') {
        next.popularDestinations = {};
      }
      const destinations = Array.isArray(next.popularDestinations.destinations)
        ? [...next.popularDestinations.destinations]
        : [];
      destinations.push(getDefaultDestination(destinations.length));
      next.popularDestinations.destinations = destinations;
      return next;
    });
  };

  const removeDestination = (index: number) => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      const destinations = Array.isArray(next?.popularDestinations?.destinations)
        ? [...next.popularDestinations.destinations]
        : [];

      destinations.splice(index, 1);

      if (!next.popularDestinations || typeof next.popularDestinations !== 'object') {
        next.popularDestinations = {};
      }
      next.popularDestinations.destinations = destinations;
      return next;
    });
  };

  const addTopCountry = () => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      if (!next.topDestinations) next.topDestinations = {};
      if (!Array.isArray(next.topDestinations.countries)) next.topDestinations.countries = [];
      next.topDestinations.countries.push({ name: '', code: '', count: '', flag: '' });
      return next;
    });
  };

  const removeTopCountry = (index: number) => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      if (next.topDestinations && Array.isArray(next.topDestinations.countries)) {
        next.topDestinations.countries.splice(index, 1);
      }
      return next;
    });
  };

  const updateTopCountryField = (index: number, field: string, value: string) => {
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      if (next.topDestinations && Array.isArray(next.topDestinations.countries)) {
        next.topDestinations.countries[index] = {
          ...next.topDestinations.countries[index],
          [field]: value
        };
      }
      return next;
    });
  };

  const updateTopList = (field: 'cities' | 'airports' | 'regions', value: string) => {
    const list = value.split(',').map(s => s.trim()).filter(Boolean);
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const next = JSON.parse(JSON.stringify(base));
      if (!next.topDestinations) next.topDestinations = {};
      next.topDestinations[field] = list;
      return next;
    });
  };

  const handleDestinationImageUpload = async (index: number, file?: File) => {
    if (!file) return;

    try {
      const base64 = await resizeImage(file, 900, 540);
      updateDestinationField(index, 'image', base64);
    } catch (error: any) {
      alert(`Failed to process destination image: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    await onSave(localContent, localCategoryImages);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (path: string, val: string) => {
    const parts = path.split('.');
    setLocalContent((prev: any) => {
      const base = prev && typeof prev === 'object' ? prev : {};
      const newState = JSON.parse(JSON.stringify(base));
      let cur = newState;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!cur[part] || typeof cur[part] !== 'object') {
          cur[part] = {};
        }
        cur = cur[part];
      }
      cur[parts[parts.length - 1]] = val;
      return newState;
    });
  };

  const handleCategoryImageUpload = async (category: string, file?: File) => {
    if (!file) return;
    try {
      const resized = await resizeImage(file, 320, 210);
      setLocalCategoryImages(prev => ({ ...prev, [category]: resized }));
    } catch (e: any) {
      console.error(`Failed to resize category image for ${category}`, e);
      alert(e?.message || 'Failed to process image. Please try a smaller file or paste a direct image URL.');
    }
  };

  return (
    <div className="bg-white rounded-card shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h2 className="text-xl font-bold text-slate-900">Homepage Editor</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-bold">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#007ac2] text-white px-4 py-2 rounded-card font-bold text-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-card border border-slate-200 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#007ac2]" />
          Hero Section Builder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Hero Title" value={localContent?.hero?.title || ''} onChange={e => handleChange('hero.title', e.target.value)} />
          <InputField label="Hero Subtitle" value={localContent?.hero?.subtitle || ''} onChange={e => handleChange('hero.subtitle', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploadField 
            label="Hero Background Image" 
            value={localContent?.hero?.backgroundImage || ''} 
            onChange={(e: any) => handleChange('hero.backgroundImage', e.target.value)} 
          />
          <InputField label="Hero Background Video" value={localContent?.hero?.video || ''} onChange={e => handleChange('hero.video', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Button Text" value={localContent?.hero?.buttonText || ''} onChange={e => handleChange('hero.buttonText', e.target.value)} />
          <InputField label="Button Link" value={localContent?.hero?.buttonLink || ''} onChange={e => handleChange('hero.buttonLink', e.target.value)} />
          <InputField label="Text Color" type="color" value={localContent?.hero?.textColor || '#FFFFFF'} onChange={e => handleChange('hero.textColor', e.target.value)} />
        </div>
        <InputField label="FAQs Section Title" value={localContent?.faqs?.title || ''} onChange={e => handleChange('faqs.title', e.target.value)} />
        <div className="flex items-center gap-2 pt-2 pb-4">
          <input 
            type="checkbox" 
            id="hp-show-reviews"
            checked={!!localContent?.showReviews} 
            onChange={e => {
                setLocalContent((prev: any) => ({ ...prev, showReviews: e.target.checked }));
            }}
            className="w-4 h-4 rounded border-slate-300 text-[#007ac2] focus:ring-[#007ac2]"
          />
          <label htmlFor="hp-show-reviews" className="text-sm font-bold text-slate-700">Show Customer Reviews on Homepage</label>
        </div>

        {/* HOMEPAGE REVIEWS EDITOR */}
        <div className="bg-white p-6 rounded-card border border-slate-100 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Homepage Reviews
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Add reviews specifically for the homepage.</p>
                </div>
                <button 
                    type="button"
                    onClick={() => {
                        const currentItems = localContent?.selectedReviews || [];
                        const newItem = { id: Date.now(), author: '', location: '', comment: '', rating: 5, verified: true, date: 'Just now' };
                        setLocalContent((prev: any) => ({ ...prev, selectedReviews: [...currentItems, newItem] }));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Review
                </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {(localContent?.selectedReviews || []).map((review: any, idx: number) => (
                    <div key={review.id || idx} className="p-4 bg-slate-50 rounded-card border border-slate-100 shadow-sm space-y-3 relative group">
                        <button 
                            type="button"
                            onClick={() => {
                                const newItems = [...localContent.selectedReviews];
                                newItems.splice(idx, 1);
                                setLocalContent((prev: any) => ({ ...prev, selectedReviews: newItems }));
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
                                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white outline-none" 
                                    value={review.author || ''} 
                                    onChange={(e) => {
                                        const newItems = [...localContent.selectedReviews];
                                        newItems[idx].author = e.target.value;
                                        setLocalContent((prev: any) => ({ ...prev, selectedReviews: newItems }));
                                    }} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Location</label>
                                <input 
                                    placeholder="e.g. United Kingdom" 
                                    className="w-full text-xs p-2 border border-slate-200 rounded bg-white outline-none" 
                                    value={review.location || ''} 
                                    onChange={(e) => {
                                        const newItems = [...localContent.selectedReviews];
                                        newItems[idx].location = e.target.value;
                                        setLocalContent((prev: any) => ({ ...prev, selectedReviews: newItems }));
                                    }} 
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Comment</label>
                            <textarea 
                                placeholder="Customer feedback..." 
                                className="w-full text-xs p-3 border border-slate-200 rounded bg-white outline-none h-20 resize-none" 
                                value={review.comment || ''} 
                                onChange={(e) => {
                                    const newItems = [...localContent.selectedReviews];
                                    newItems[idx].comment = e.target.value;
                                    setLocalContent((prev: any) => ({ ...prev, selectedReviews: newItems }));
                                }} 
                            />
                        </div>
                    </div>
                ))}
                {(!localContent?.selectedReviews || localContent.selectedReviews.length === 0) && (
                    <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-card">
                        <p className="text-[10px] font-bold uppercase tracking-widest">No custom reviews added</p>
                        <p className="text-[9px] mt-1">Default global reviews will be shown</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900 mb-1">Category Filter Images</h3>
        <p className="text-xs text-slate-500 mb-4">Upload an image per category to display in the category filter section.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.values(CarCategory).map((category) => {
            const imageUrl = localCategoryImages?.[category] || '';
            const fileInputId = `homepage-category-image-${category}`;

            return (
              <div key={category} className="border border-slate-200 rounded-card p-4 space-y-3 bg-slate-50/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-slate-800">{formatCategoryLabel(category)}</div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{category}</span>
                </div>

                <div className="h-24 rounded-card border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={getImageUrl(imageUrl)} alt={`${category} category`} className="w-full h-full object-cover" width="320" height="210" loading="lazy" />
                  ) : (
                    <div className="text-[11px] font-bold text-slate-400">No image</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={async (e) => {
                      await handleCategoryImageUpload(category, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={fileInputId}
                    className="flex-1 text-center bg-white border border-blue-200 text-[#007ac2] rounded-card px-3 py-2 text-xs font-bold cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    Upload Image
                  </label>
                  <button
                    type="button"
                    onClick={() => setLocalCategoryImages(prev => ({ ...prev, [category]: '' }))}
                    className="px-3 py-2 rounded-card border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setLocalCategoryImages(prev => ({ ...prev, [category]: e.target.value }))}
                  placeholder="Or paste image URL"
                  className="w-full bg-white border border-slate-200 rounded-card px-3 py-2 text-xs text-slate-700"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Top Destinations Worldwide</h3>
            <p className="text-xs text-slate-500">Manage countries, cities, airports, and regions shown on the home page.</p>
          </div>
          <button
            type="button"
            onClick={addTopCountry}
            className="px-3 py-2 rounded-card bg-[#007ac2] text-white text-xs font-extrabold hover:bg-blue-800 transition-colors"
          >
            Add Country
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InputField
            label="Section Title"
            value={localContent?.topDestinations?.title || ''}
            onChange={(e: any) => handleChange('topDestinations.title', e.target.value)}
          />
          <InputField
            label="Section Subtitle"
            value={localContent?.topDestinations?.subtitle || ''}
            onChange={(e: any) => handleChange('topDestinations.subtitle', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <TextAreaField 
             label="Cities (comma separated)"
             value={(localContent?.topDestinations?.cities || []).join(', ')}
             onChange={(e: any) => updateTopList('cities', e.target.value)}
             rows={4}
          />
          <TextAreaField 
             label="Airports (comma separated)"
             value={(localContent?.topDestinations?.airports || []).join(', ')}
             onChange={(e: any) => updateTopList('airports', e.target.value)}
             rows={4}
          />
          <TextAreaField 
             label="Regions (comma separated)"
             value={(localContent?.topDestinations?.regions || []).join(', ')}
             onChange={(e: any) => updateTopList('regions', e.target.value)}
             rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {(localContent?.topDestinations?.countries || []).map((country: any, idx: number) => (
            <div key={idx} className="p-4 rounded-card border border-slate-200 bg-white space-y-3 relative group">
              <button 
                onClick={() => removeTopCountry(idx)}
                className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                 <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Name" value={country.name} onChange={(e: any) => updateTopCountryField(idx, 'name', e.target.value)} />
                <InputField label="Code" value={country.code} onChange={(e: any) => updateTopCountryField(idx, 'code', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Count" value={country.count} onChange={(e: any) => updateTopCountryField(idx, 'count', e.target.value)} />
                <InputField label="Flag Emoji" value={country.flag} onChange={(e: any) => updateTopCountryField(idx, 'flag', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Popular Destinations</h3>
            <p className="text-xs text-slate-500">Manage destination cards shown on the home page.</p>
          </div>
          <button
            type="button"
            onClick={addDestination}
            className="px-3 py-2 rounded-card bg-[#007ac2] text-white text-xs font-extrabold hover:bg-blue-800 transition-colors"
          >
            Add Destination
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InputField
            label="Section Title"
            value={localContent?.popularDestinations?.title || ''}
            onChange={e => handleChange('popularDestinations.title', e.target.value)}
          />
          <InputField
            label="Section Subtitle"
            value={localContent?.popularDestinations?.subtitle || ''}
            onChange={e => handleChange('popularDestinations.subtitle', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {currentDestinations.map((destination: any, index: number) => (
            <div key={destination?.id || `destination-${index}`} className="rounded-card border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-extrabold text-slate-800">Destination #{index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeDestination(index)}
                  className="px-2.5 py-1.5 rounded-card border border-red-100 text-red-500 text-[11px] font-extrabold hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <InputField
                  label="Name (Search Query)"
                  value={destination?.name || ''}
                  onChange={e => updateDestinationField(index, 'name', e.target.value)}
                />
              </div>

              <div className="mt-3 space-y-2">
                <ImageUploadField 
                  label="Destination Image"
                  value={destination?.image || destination?.imageUrl || ''}
                  onChange={e => updateDestinationField(index, 'image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          ))}

          {currentDestinations.length === 0 && (
            <div className="rounded-card border border-dashed border-slate-300 bg-slate-50 p-4 text-xs font-bold text-slate-500">
              No destinations yet. Click <span className="text-slate-700">Add Destination</span> to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Site Settings ====================
export const SiteSettingsContent = () => {
  const [duration, setDuration] = useState(5);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch('/api/admin/settings')
      .then(data => {
        setDuration(data.searchingScreenDuration / 1000);
        setHeroImageUrl(data.heroImageUrl || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        searchingScreenDuration: duration * 1000,
        heroImageUrl: heroImageUrl
      })
    })
    .then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    })
    .catch(err => alert('Failed to save settings: ' + err.message));
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading Settings...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-gray-50 bg-gray-50/30">
        <SectionHeader title="Site Configuration" icon={Settings} subtitle="Global behavior and design settings" />
      </div>
      <div className="p-8 space-y-6">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Searching Screen Duration (seconds)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))} 
            className="w-full bg-slate-50 border border-slate-100 rounded-card p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
          />
        </div>
        <div>
          <ImageUploadField 
            label="Homepage Hero Background Image" 
            value={heroImageUrl} 
            onChange={(e: any) => setHeroImageUrl(e.target.value)} 
            placeholder="https://example.com/image.jpg"
            helperText="Recommended size: 2000x1200px"
          />
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button 
            onClick={handleSave} 
            className="bg-[#007ac2] text-white px-8 py-3 rounded-card font-extrabold text-sm shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-600 font-extrabold text-xs uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Settings Saved Successfully
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
};
