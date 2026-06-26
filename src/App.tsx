import { useState, useCallback, useEffect } from 'react';
import type { Area } from 'react-easy-crop';

import { UploadPanel }        from './components/UploadPanel';
import { PhotoTypeSelector }  from './components/PhotoTypeSelector';
import { CropEditor }         from './components/CropEditor';
import { CopyCountSelector }  from './components/CopyCountSelector';
import { SettingsPanel }      from './components/SettingsPanel';
import { A4Preview }          from './components/A4Preview';
import { ExportControls }     from './components/ExportControls';

import type { PhotoType, PhotoSettings, PhotoSize } from './types';
import { PHOTO_SIZES, computeLayout } from './types';
import { getCroppedImg } from './utils/cropImage';
import { Moon, Sun, Camera } from 'lucide-react';

interface ImageInfo {
  dataUrl: string;
  name: string;
  dimensions: { w: number; h: number };
}

const DEFAULT_SETTINGS: PhotoSettings = {
  photoType:       'passport',
  copies:          8,
  border:          'thin',
  backgroundColor: 'white',
  customColor:     '#ffffff',
  showCutMarks:    true,
  darkMode:        true,
};

export default function App() {
  const [imageInfo,        setImageInfo]        = useState<ImageInfo | null>(null);
  const [croppedAreaPx,    setCroppedAreaPx]    = useState<Area | null>(null);
  const [croppedImageUrl,  setCroppedImageUrl]  = useState<string | null>(null);
  const [settings,         setSettings]         = useState<PhotoSettings>(DEFAULT_SETTINGS);
  const [previewZoom,      setPreviewZoom]      = useState(0.55);
  const [currentPage,      setCurrentPage]      = useState(0);
  const [isCropProcessing, setIsCropProcessing] = useState(false);

  const dark = settings.darkMode;

  // Derive sizes
  const photoSize: PhotoSize = (() => {
    if (settings.photoType === 'custom') return PHOTO_SIZES.passport; // fallback
    return PHOTO_SIZES[settings.photoType];
  })();

  const layout = computeLayout(photoSize, settings.copies);

  // Reset page when layout changes
  useEffect(() => { setCurrentPage(0); }, [layout.totalPages]);

  // Auto-re-crop when photo type changes
  useEffect(() => {
    if (imageInfo && croppedAreaPx) {
      applyCrop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.photoType]);

  const handleImageLoaded = (dataUrl: string, name: string, dimensions: { w: number; h: number }) => {
    setImageInfo({ dataUrl, name, dimensions });
    setCroppedImageUrl(null);
    setCroppedAreaPx(null);
  };

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPx(pixels);
  }, []);

  const applyCrop = async () => {
    if (!imageInfo || !croppedAreaPx) return;
    setIsCropProcessing(true);
    try {
      const url = await getCroppedImg(
        imageInfo.dataUrl,
        croppedAreaPx,
        0,
        photoSize.widthMm  * 10,   // preview size (approx)
        photoSize.heightMm * 10,
      );
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropProcessing(false);
    }
  };

  const patchSettings = (patch: Partial<PhotoSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  // Theming
  const bg      = dark ? 'bg-slate-900'      : 'bg-gray-100';
  const sidebar = dark ? 'bg-slate-800/60'   : 'bg-white/80';
  const header  = dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';
  const brand   = dark ? 'text-white' : 'text-gray-900';
  const sub     = dark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>
      {/* ── HEADER ── */}
      <header className={`border-b px-6 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm ${header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold leading-tight ${brand}`}>PhotoPrint Pro</h1>
            <p className={`text-xs ${sub}`}>Passport &amp; Stamp Photo Maker</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {imageInfo && (
            <span className={`text-xs hidden sm:block ${sub}`}>
              {imageInfo.name} • {imageInfo.dimensions.w}×{imageInfo.dimensions.h}px
            </span>
          )}
          <button
            onClick={() => patchSettings({ darkMode: !dark })}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition
              ${dark
                ? 'bg-slate-700 border-slate-600 text-yellow-300 hover:bg-slate-600'
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <main className="flex-1 flex gap-0 overflow-hidden" style={{ height: 'calc(100vh - 61px)' }}>

        {/* ── LEFT PANEL ── */}
        <aside className={`w-72 flex-shrink-0 overflow-y-auto p-3 space-y-3 border-r ${sidebar} ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
          <UploadPanel
            onImageLoaded={handleImageLoaded}
            currentImage={imageInfo?.dataUrl ?? null}
            dark={dark}
          />

          <PhotoTypeSelector
            value={settings.photoType as PhotoType}
            onChange={(t) => patchSettings({ photoType: t })}
            dark={dark}
          />

          <CopyCountSelector
            value={settings.copies}
            onChange={(n) => patchSettings({ copies: n })}
            dark={dark}
          />

          <SettingsPanel
            settings={settings}
            onChange={patchSettings}
            dark={dark}
          />

          <ExportControls
            croppedImageUrl={croppedImageUrl}
            settings={settings}
            photoSize={photoSize}
            layout={layout}
            dark={dark}
          />
        </aside>

        {/* ── CENTER PANEL (Crop) ── */}
        <section className="flex-1 overflow-y-auto p-3 min-w-0" style={{ maxWidth: 520 }}>
          {imageInfo ? (
            <>
              <CropEditor
                imageSrc={imageInfo.dataUrl}
                photoSize={photoSize}
                onCropComplete={handleCropComplete}
                onConfirm={applyCrop}
                dark={dark}
              />
              {isCropProcessing && (
                <div className="mt-2 text-center text-sm text-blue-400 animate-pulse">
                  Processing crop…
                </div>
              )}
            </>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed ${dark ? 'border-slate-600 text-slate-500' : 'border-gray-300 text-gray-400'}`}>
              <Camera size={48} className="opacity-30" />
              <div className="text-center">
                <p className="font-medium text-sm">No photo uploaded yet</p>
                <p className="text-xs mt-1 opacity-70">Upload a photo from the left panel to start</p>
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL (A4 Preview) ── */}
        <section className={`flex-1 overflow-hidden p-3 border-l ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
          <A4Preview
            croppedImageUrl={croppedImageUrl}
            settings={settings}
            photoSize={photoSize}
            layout={layout}
            zoom={previewZoom}
            onZoomChange={setPreviewZoom}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            dark={dark}
          />
        </section>

      </main>
    </div>
  );
}
