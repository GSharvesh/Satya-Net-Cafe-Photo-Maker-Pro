import React, { useCallback, useRef, useState } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
interface Props {
  onImageLoaded: (dataUrl: string, fileName: string, dimensions: { w: number; h: number }) => void;
  currentImage: string | null;
  dark: boolean;
}

export const UploadPanel: React.FC<Props> = ({ onImageLoaded, currentImage, dark }) => {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error,    setError]    = useState('');

  const processFile = (file: File) => {
    setError('');
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG, JPEG, PNG files are supported.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img     = new Image();
      img.onload    = () => onImageLoaded(dataUrl, file.name, { w: img.width, h: img.height });
      img.src       = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const card   = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const label  = dark ? 'text-slate-200' : 'text-gray-800';
  const sub    = dark ? 'text-slate-400' : 'text-gray-500';
  const dropBg = dragging
    ? (dark ? 'bg-blue-900/40 border-blue-400' : 'bg-blue-50 border-blue-400')
    : (dark ? 'bg-slate-700 border-slate-500 hover:border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-blue-400');

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${card}`}>
      <h3 className={`font-semibold mb-3 flex items-center gap-2 ${label}`}>
        <ImageIcon size={16} /> Upload Photo
      </h3>

      {!currentImage ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dropBg}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Upload className="mx-auto mb-2 text-blue-500" size={32} />
          <p className={`text-sm font-medium ${label}`}>Drag &amp; drop or click to upload</p>
          <p className={`text-xs mt-1 ${sub}`}>JPG, JPEG, PNG • Max 20 MB</p>
        </div>
      ) : (
        <div className="relative">
          <img
            src={currentImage}
            alt="preview"
            className="w-full h-36 object-cover rounded-lg border border-slate-600"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md hover:bg-blue-700 transition"
          >
            Change
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1 text-red-400 text-xs">
          <X size={12} /> {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
};
