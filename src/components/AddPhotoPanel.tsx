import React, { useCallback, useRef, useState } from 'react';
import { Upload, ImageIcon, X, CreditCard, Stamp, Minus, Plus, User } from 'lucide-react';
import type { PhotoType, PhotoEntry, CropArea } from '../types';
import { PHOTO_SIZES } from '../types';

interface Props {
  onAdd: (entry: Omit<PhotoEntry, 'id'>) => void;
  dark: boolean;
  /** when editing an existing entry */
  editEntry?: PhotoEntry | null;
}

interface Draft {
  dataUrl: string;
  fileName: string;
  photoType: PhotoType;
  copies: number;
  name: string;
}

const PRESETS = [4, 6, 8, 12, 16, 20];

export const AddPhotoPanel: React.FC<Props> = ({ onAdd, dark, editEntry }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft,    setDraft]    = useState<Draft | null>(editEntry ? {
    dataUrl:   editEntry.originalDataUrl,
    fileName:  editEntry.name,
    photoType: editEntry.photoType,
    copies:    editEntry.copies,
    name:      editEntry.name,
  } : null);
  const [dragging, setDragging] = useState(false);
  const [error,    setError]    = useState('');

  const processFile = (file: File) => {
    setError('');
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG, JPEG, PNG files supported.'); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20 MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setDraft({ dataUrl, fileName: file.name, photoType: 'passport', copies: 4, name: '' });
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const clamp = (n: number) => Math.max(1, Math.min(500, n));

  const handleAdd = () => {
    if (!draft) return;
    const size = PHOTO_SIZES[draft.photoType];
    // Placeholder cropArea — will be set properly in CropEditor
    const cropArea: CropArea = { x: 0, y: 0, width: 100, height: 100 };
    onAdd({
      name:            draft.name || draft.fileName,
      originalDataUrl: draft.dataUrl,
      croppedUrl:      draft.dataUrl,  // will be replaced after crop
      photoType:       draft.photoType,
      photoSize:       size,
      copies:          draft.copies,
      cropAreaPx:      cropArea,
      rotation:        0,
      zoom:            1,
      border:          'thin',
    });
    setDraft(null);
  };

  const card    = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl     = dark ? 'text-slate-200' : 'text-gray-800';
  const sub     = dark ? 'text-slate-400' : 'text-gray-500';
  const inputCls= dark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-gray-50 border-gray-300 text-gray-800';
  const dropBg  = dragging
    ? (dark ? 'bg-blue-900/40 border-blue-400' : 'bg-blue-50 border-blue-400')
    : (dark ? 'bg-slate-700 border-slate-500 hover:border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-blue-400');

  const typeBtn = (active: boolean) =>
    `flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs font-medium flex-1
     ${active
       ? 'border-blue-500 bg-blue-500/20 text-blue-400'
       : dark ? 'border-slate-600 text-slate-300 hover:border-slate-400' : 'border-gray-200 text-gray-600 hover:border-blue-300'
     }`;

  return (
    <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${card}`}>
      <h3 className={`font-semibold flex items-center gap-2 ${lbl}`}>
        <ImageIcon size={16} />
        {draft ? 'Configure Photo' : 'Add Photo'}
      </h3>

      {/* Upload zone */}
      {!draft ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${dropBg}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Upload className="mx-auto mb-2 text-blue-500" size={28} />
            <p className={`text-sm font-medium ${lbl}`}>Drag &amp; drop or click</p>
            <p className={`text-xs mt-0.5 ${sub}`}>JPG, PNG • Max 20 MB</p>
          </div>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1"><X size={12}/>{error}</p>
          )}
        </>
      ) : (
        <>
          {/* Preview + change */}
          <div className="relative rounded-lg overflow-hidden h-28">
            <img src={draft.dataUrl} alt="preview" className="w-full h-full object-cover" />
            <button
              onClick={() => { setDraft(null); inputRef.current?.click(); }}
              className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs px-2 py-0.5 rounded hover:bg-black/80"
            >
              Change
            </button>
          </div>

          {/* Customer name */}
          <div>
            <label className={`text-xs font-medium ${sub} flex items-center gap-1`}><User size={10}/> Customer Name (optional)</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={draft.name}
              onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)}
              className={`mt-1 w-full text-sm rounded-lg border px-3 py-1.5 ${inputCls}`}
            />
          </div>

          {/* Photo type */}
          <div>
            <p className={`text-xs font-medium mb-1.5 ${sub}`}>Photo Type</p>
            <div className="flex gap-2">
              <button onClick={() => setDraft(d => d ? { ...d, photoType: 'passport' } : d)} className={typeBtn(draft.photoType === 'passport')}>
                <CreditCard size={14}/> Passport <span className="opacity-60">35×45</span>
              </button>
              <button onClick={() => setDraft(d => d ? { ...d, photoType: 'stamp' } : d)} className={typeBtn(draft.photoType === 'stamp')}>
                <Stamp size={14}/> Stamp <span className="opacity-60">25×35</span>
              </button>
            </div>
          </div>

          {/* Copies */}
          <div>
            <p className={`text-xs font-medium mb-1.5 ${sub}`}>Copies</p>
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setDraft(d => d ? { ...d, copies: clamp(d.copies - 1) } : d)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center">
                <Minus size={13}/>
              </button>
              <input type="number" min={1} max={500} value={draft.copies}
                onChange={e => setDraft(d => d ? { ...d, copies: clamp(parseInt(e.target.value)||1) } : d)}
                className={`w-16 text-center text-base font-bold rounded-lg border px-2 py-1 ${inputCls}`}
              />
              <button onClick={() => setDraft(d => d ? { ...d, copies: clamp(d.copies + 1) } : d)}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center">
                <Plus size={13}/>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {PRESETS.map(p => (
                <button key={p}
                  onClick={() => setDraft(d => d ? { ...d, copies: p } : d)}
                  className={`text-xs py-1 rounded border font-medium transition
                    ${draft.copies === p
                      ? 'bg-blue-500 text-white border-blue-500'
                      : dark ? 'bg-slate-700 border-slate-500 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Add to sheet */}
          <button onClick={handleAdd}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition text-sm">
            <Upload size={14}/> Add to Sheet → Crop
          </button>

          <button onClick={() => setDraft(null)}
            className={`w-full py-1.5 text-xs rounded-lg border transition
              ${dark ? 'border-slate-600 text-slate-400 hover:border-slate-400' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}>
            Cancel
          </button>
        </>
      )}

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={onFileChange} />
    </div>
  );
};
