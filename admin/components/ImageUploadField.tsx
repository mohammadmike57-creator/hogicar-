import * as React from 'react';
import { useState, useRef } from 'react';
import CloudUpload from 'lucide-react/dist/esm/icons/cloud-upload';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ImageOff from 'lucide-react/dist/esm/icons/image-off';
import Images from 'lucide-react/dist/esm/icons/images';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import { adminFetch } from '../../lib/adminApi';
import { imgSrc } from './blog/blogShared';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  helperText?: string;
  onLibraryOpen?: () => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';
const ACCEPTED = ACCEPT.split(',');
const MAX_MB = 15;

const errorText = (err: any) => {
  const m = String(err?.message || '');
  const hit = /status \d+: (.*)$/s.exec(m);
  const text = (hit ? hit[1] : m).trim();
  return text && !text.startsWith('<') && !text.startsWith('{') ? text : 'The upload did not go through. Please try again.';
};

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, value, onChange, placeholder, helperText, onLibraryOpen }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [broken, setBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = React.useId();

  React.useEffect(() => setBroken(false), [value]);

  const emit = (v: string) => onChange({ target: { value: v } } as any);

  const upload = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_MB} MB. Please use a smaller image.`);
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await adminFetch('/api/admin/seo/upload', { method: 'POST', body: formData });
      if (res?.url) {
        // Store only the relative path in the database
        const relativeUrl = /^https?:\/\//i.test(res.url) || res.url.startsWith('/') ? res.url : `/${res.url}`;
        emit(relativeUrl);
      } else {
        setError('The server did not return an image address.');
      }
    } catch (err: any) {
      setError(errorText(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const pick = () => fileInputRef.current?.click();

  // Uploaded files are kept on the server (other pages may use the same file), so
  // removing only clears this field.
  const remove = () => { setError(null); emit(''); };

  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (!uploading) setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!uploading) upload(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label>
        {onLibraryOpen && (
          <button type="button" onClick={onLibraryOpen}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-[#007ac2] hover:bg-[#007ac2]/10">
            <Images className="h-4 w-4" /> Choose from library
          </button>
        )}
      </div>

      <input type="file" hidden ref={fileInputRef} accept={ACCEPT} onChange={e => upload(e.target.files?.[0])} />

      {value ? (
        <div {...dropProps}
          className={`group relative overflow-hidden rounded-2xl bg-slate-100 ring-1 transition ${dragging ? 'ring-2 ring-[#007ac2]' : 'ring-slate-200'}`}>
          <div className="relative aspect-[16/9] w-full">
            {broken ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-50 text-slate-400">
                <ImageOff className="h-6 w-6" />
                <span className="text-xs">This image could not be loaded</span>
              </div>
            ) : (
              <img src={imgSrc(value)} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
            )}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm font-medium text-slate-700 backdrop-blur-[1px]">
                <RefreshCw className="h-5 w-5 animate-spin text-[#007ac2]" /> Uploading…
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-400" title={value}>{value}</span>
            <div className="flex shrink-0 gap-1.5">
              <button type="button" onClick={pick} disabled={uploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[13px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw className="h-3.5 w-3.5" /> Replace
              </button>
              <button type="button" onClick={remove} disabled={uploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={pick} disabled={uploading} {...dropProps}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${dragging ? 'border-[#007ac2] bg-[#007ac2]/5' : 'border-slate-300 bg-white hover:border-[#007ac2]/60 hover:bg-slate-50'}`}>
          {uploading ? (
            <>
              <RefreshCw className="h-6 w-6 animate-spin text-[#007ac2]" />
              <span className="text-sm font-medium text-slate-700">Uploading…</span>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007ac2]/10 text-[#007ac2]"><CloudUpload className="h-5 w-5" /></span>
              <span className="text-sm text-slate-700"><span className="font-semibold text-[#007ac2]">Click to upload</span> or drag and drop</span>
              <span className="text-xs text-slate-500">JPG, PNG or WebP · up to {MAX_MB} MB</span>
            </>
          )}
        </button>
      )}

      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id={inputId} value={value} onChange={e => { setError(null); onChange(e); }} placeholder={placeholder || 'Or paste an image URL'}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm" />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
      )}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

export default ImageUploadField;
