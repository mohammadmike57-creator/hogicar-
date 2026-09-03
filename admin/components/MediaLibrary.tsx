import * as React from 'react';
import { 
  Image as ImageIcon, 
  Search, 
  Filter, 
  X, 
  Plus, 
  Check, 
  Trash2, 
  Info,
  MapPin,
  Tag,
  Hash
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';

interface LocationImage {
  id: number;
  countryTag: string;
  cityTag?: string;
  areaTag?: string;
  topicTag?: string;
  title?: string;
  altText?: string;
  caption?: string;
  imageUrl: string;
}

interface MediaLibraryProps {
  onSelect?: (image: LocationImage) => void;
  onClose?: () => void;
  initialFilters?: {
    country?: string;
    city?: string;
    topic?: string;
  };
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect, onClose, initialFilters }) => {
  const [images, setImages] = React.useState<LocationImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState({
    country: initialFilters?.country || '',
    city: initialFilters?.city || '',
    topic: initialFilters?.topic || '',
    area: ''
  });
  const [selectedImageId, setSelectedImageId] = React.useState<number | null>(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.country) query.append('country', filters.country);
      if (filters.city) query.append('city', filters.city);
      if (filters.topic) query.append('topic', filters.topic);
      if (filters.area) query.append('area', filters.area);
      if (search) query.append('search', search);

      const data = await adminFetch(`/api/admin/blog/location-images?${query.toString()}`);
      setImages(data);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadImages();
  }, [filters, search]);

  const handleSelect = (image: LocationImage) => {
    setSelectedImageId(image.id);
    if (onSelect) {
      onSelect(image);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden rounded-2xl shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <ImageIcon size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Media Library</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Reuse images across destinations</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by title, alt text, or tags..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Filter City..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
          />
        </div>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Filter Topic..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
            value={filters.topic}
            onChange={(e) => setFilters({...filters, topic: e.target.value})}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="aspect-square bg-slate-200 rounded-2xl" />
                <div className="h-3 bg-slate-200 rounded-full w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
            <ImageIcon size={48} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No images found matching your filters</p>
            <button 
              onClick={() => setFilters({ country: '', city: '', area: '', topic: '' })}
              className="text-[10px] text-emerald-600 hover:underline font-black uppercase"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {images.map((image) => (
              <div 
                key={image.id}
                onClick={() => handleSelect(image)}
                className={`group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedImageId === image.id 
                    ? 'ring-4 ring-emerald-500 ring-offset-4 scale-95' 
                    : 'hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                <img 
                  src={image.imageUrl} 
                  alt={image.altText || image.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest mb-2 line-clamp-2">
                    {image.title || 'Untitled Image'}
                  </span>
                  <div className="flex flex-wrap justify-center gap-1">
                    {image.cityTag && (
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] text-white font-bold uppercase">
                        {image.cityTag}
                      </span>
                    )}
                    {image.topicTag && (
                      <span className="px-2 py-0.5 bg-emerald-500/80 rounded-full text-[8px] text-white font-bold uppercase">
                        {image.topicTag}
                      </span>
                    )}
                  </div>
                </div>

                {selectedImageId === image.id && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                    <Check size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Selection Details */}
      {selectedImageId && (
        <div className="p-6 border-t border-slate-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                <img 
                  src={images.find(i => i.id === selectedImageId)?.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt="Selected"
                />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase">
                  {images.find(i => i.id === selectedImageId)?.title || 'Selected Image'}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-md">
                  {images.find(i => i.id === selectedImageId)?.imageUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedImageId(null)}
                className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const img = images.find(i => i.id === selectedImageId);
                  if (img && onSelect) onSelect(img);
                  if (onClose) onClose();
                }}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
