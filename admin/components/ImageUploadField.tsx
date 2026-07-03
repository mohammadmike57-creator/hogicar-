import * as React from 'react';
import { useState, useRef } from 'react';
import { Upload, RefreshCw, X } from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { API_BASE_URL } from '../../lib/config';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  helperText?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, value, onChange, placeholder, helperText }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await adminFetch('/api/admin/seo/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.url) {
        const fullUrl = res.url.startsWith('/') ? `${API_BASE_URL}${res.url}` : res.url;
        onChange({ target: { value: fullUrl } } as any);
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      
      {value && (
        <div className="relative mb-2 group">
          <div className="relative aspect-video rounded-card overflow-hidden border border-slate-200 bg-slate-50">
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                if (value.startsWith('/') && !value.startsWith('http')) {
                  e.currentTarget.src = `${API_BASE_URL}${value}`;
                }
              }}
            />
          </div>
          <button 
            type="button"
            onClick={() => onChange({ target: { value: '' } } as any)}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-rose-100"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-card text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        />
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleUpload}
          accept="image/*"
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-card text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2"
        >
          {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload
        </button>
      </div>
      {helperText && <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>}
    </div>
  );
};

export default ImageUploadField;
