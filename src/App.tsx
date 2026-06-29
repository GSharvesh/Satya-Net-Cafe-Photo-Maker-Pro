import { useState, useCallback, useEffect } from 'react';

import { AddPhotoPanel }   from './components/AddPhotoPanel';
import { CropEditor }      from './components/CropEditor';
import { PhotoQueue }      from './components/PhotoQueue';
import { SheetPreview }    from './components/SheetPreview';
import { SettingsPanel }   from './components/SettingsPanel';
import { ExportControls }  from './components/ExportControls';

import { usePhotoStore }   from './store/usePhotoStore';
import type { PhotoEntry, CropArea, BorderType } from './types';
import { PHOTO_SIZES } from './types';
import { getCroppedImg }   from './utils/cropImage';

import {
  Moon, Sun, Camera, Plus, Undo2, Redo2, PlusCircle,
} from 'lucide-react';

export default function App() {
  const store = usePhotoStore();

  // Which entry is open in the crop editor
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [previewZoom, setPreviewZoom] = useState(0.5);
  const [currentPage, setCurrentPage] = useState(0);

  const dark = store.settings.darkMode;

  // Auto-select first entry for crop when queue is empty and new one added
  useEffect(() => {
    if (store.queue.length === 1 && !editingId) {
      setEditingId(store.queue[0].id);
      setShowAddForm(false);
    }
  }, [store.queue.length]);

  // Clamp page
  useEffect(() => {
    setCurrentPage(p => Math.min(p, Math.max(0, store.numPages - 1)));
  }, [store.numPages]);

  const editingEntry = editingId ? store.queue.find(e => e.id === editingId) ?? null : null;

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleAddEntry = useCallback((partial: Omit<PhotoEntry, 'id'>) => {
    const id = crypto.randomUUID();
    const entry: PhotoEntry = { ...partial, id };
    store.addEntry(entry);
    setEditingId(id);
    setShowAddForm(false);
  }, [store]);

  const handleCropConfirm = useCallback(async (
    cropAreaPx: CropArea,
    zoom: number,
    rotation: number,
  ) => {
    if (!editingEntry) return;
    setProcessing(true);
    try {
      const w   = editingEntry.photoSize.widthMm  * 10;
      const h   = editingEntry.photoSize.heightMm * 10;
      const url = await getCroppedImg(editingEntry.originalDataUrl, cropAreaPx, rotation, w, h);
      store.updateEntry(editingEntry.id, { croppedUrl: url, cropAreaPx, zoom, rotation });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  }, [editingEntry, store]);

  const handleCropChange = useCallback((_px: CropArea, _zoom: number, _rot: number) => {
    // live preview update (optional — we update on confirm only for performance)
  }, []);

  const handleSelectEntry = (id: string) => {
    setEditingId(id);
    setShowAddForm(false);
  };

  const handleAddAnother = () => {
    setEditingId(null);
    setShowAddForm(true);
  };

  const handleBorderChange = (border: BorderType) => {
    if (editingId) store.updateEntry(editingId, { border });
  };

  // ── theming ────────────────────────────────────────────────────────────────
  const bg      = dark ? 'bg-slate-900'    : 'bg-gray-100';
  const sidebar = dark ? 'bg-slate-900'    : 'bg-gray-50';
  const hdr     = dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';
  const brand   = dark ? 'text-white'      : 'text-gray-900';
  const sub     = dark ? 'text-slate-400'  : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className={`border-b px-5 py-2.5 flex items-center justify-between sticky top-0 z-20 ${hdr}`} role="banner">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Camera size={18} className="text-white"/>
          </div>
          <div>
            <h1 className={`text-base font-bold leading-tight ${brand}`}>Satya-Net-Cafe – Photo Maker Pro</h1>
            <p className={`text-xs ${sub}`}>Passport · Stamp · Visa · ID Card Photo Printing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button onClick={store.undo} disabled={!store.canUndo} title="Undo"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-30
              ${dark ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}>
            <Undo2 size={14}/>
          </button>
          <button onClick={store.redo} disabled={!store.canRedo} title="Redo"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-30
              ${dark ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}>
            <Redo2 size={14}/>
          </button>

          {/* Stats */}
          {store.totalCopies > 0 && (
            <span className={`text-xs hidden sm:block ${sub}`}>
              {store.queue.length} photo{store.queue.length !== 1 ? 's' : ''} · {store.totalCopies} copies · {store.numPages} page{store.numPages !== 1 ? 's' : ''}
            </span>
          )}

          {/* Dark mode */}
          <button onClick={() => store.patchSettings({ darkMode: !dark })}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition
              ${dark ? 'bg-slate-700 border-slate-600 text-yellow-300 hover:bg-slate-600' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
        </div>
      </header>

      {/* ── MAIN 3-COLUMN LAYOUT ────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 53px - 44px)' }} role="main" aria-label="Photo Maker Workspace">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <aside className={`w-72 flex-shrink-0 overflow-y-auto p-3 space-y-3 border-r ${sidebar} ${dark ? 'border-slate-700' : 'border-gray-200'}`}>

          {/* Photo Queue */}
          <PhotoQueue
            queue={store.queue}
            activeId={editingId}
            onSelect={handleSelectEntry}
            onDelete={store.removeEntry}
            onDuplicate={store.duplicateEntry}
            onMove={store.reorderEntry}
            dark={dark}
          />

          {/* Add Photo form or button */}
          {showAddForm ? (
            <AddPhotoPanel onAdd={handleAddEntry} dark={dark}/>
          ) : (
            <button
              onClick={handleAddAnother}
              className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-500/50 text-blue-400 hover:border-blue-500 hover:bg-blue-500/10 transition font-medium text-sm"
            >
              <PlusCircle size={16}/>
              {store.queue.length === 0 ? 'Add First Photo' : 'Add Another Photo'}
            </button>
          )}

          {/* Sheet Settings */}
          <SettingsPanel
            settings={store.settings}
            onChange={store.patchSettings}
            activeBorder={editingEntry?.border ?? 'thin'}
            onBorderChange={handleBorderChange}
            dark={dark}
          />

          {/* Export */}
          <ExportControls
            slots={store.slots}
            layout={store.layout}
            paper={store.paper}
            settings={store.settings}
            orientation={store.settings.orientation}
            totalPagesCount={store.numPages}
            currentPage={currentPage}
            dark={dark}
          />
        </aside>

        {/* ── CENTER PANEL (Crop Editor) ───────────────────────────────────── */}
        <section className="flex-shrink-0 overflow-y-auto p-3" style={{ width: 480 }}>
          {editingEntry ? (
            <div className="space-y-3">
              {/* Entry header */}
              <div className={`flex items-center justify-between px-4 py-2 rounded-xl border ${dark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                <span className="text-sm font-medium">{editingEntry.name || 'Photo'}</span>
                <div className="flex items-center gap-2 text-xs">
                  {/* Copies inline edit */}
                  <span className={dark ? 'text-slate-400' : 'text-gray-500'}>Copies:</span>
                  <input
                    type="number" min={1} max={500}
                    value={editingEntry.copies}
                    onChange={e => store.updateEntry(editingEntry.id, { copies: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={`w-14 text-center rounded border px-1 py-0.5 font-bold text-sm
                      ${dark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                  />
                  {/* Photo type toggle */}
                  <button
                    onClick={() => {
                      const next = editingEntry.photoType === 'passport' ? 'stamp' : 'passport';
                      store.updateEntry(editingEntry.id, { photoType: next, photoSize: PHOTO_SIZES[next] });
                    }}
                    className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition font-medium"
                  >
                    {editingEntry.photoType === 'passport' ? 'Passport' : 'Stamp'} ↕
                  </button>
                </div>
              </div>

              <CropEditor
                imageSrc={editingEntry.originalDataUrl}
                photoSize={editingEntry.photoSize}
                initialZoom={editingEntry.zoom}
                initialRotation={editingEntry.rotation}
                onCropComplete={(px, z, r) => handleCropChange(px, z, r)}
                onConfirm={handleCropConfirm}
                dark={dark}
              />

              {processing && (
                <p className="text-center text-sm text-blue-400 animate-pulse">Processing crop…</p>
              )}

              {/* Add Another button below editor */}
              <button
                onClick={handleAddAnother}
                className="w-full py-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-500/40 text-green-400 hover:border-green-500 hover:bg-green-500/10 transition text-sm font-medium"
              >
                <Plus size={14}/> Add Another Photo
              </button>
            </div>
          ) : showAddForm ? (
            <AddPhotoPanel onAdd={handleAddEntry} dark={dark}/>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed
              ${dark ? 'border-slate-600 text-slate-500' : 'border-gray-300 text-gray-400'}`}>
              <Camera size={44} className="opacity-25"/>
              <div className="text-center">
                <p className="font-medium text-sm">No photo selected</p>
                <p className="text-xs mt-1 opacity-70">Click "Add First Photo" to get started</p>
                <p className="text-xs mt-0.5 opacity-50">Passport · Stamp · Visa · ID Card</p>
              </div>
              <button onClick={handleAddAnother}
                className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition flex items-center gap-2">
                <Plus size={14}/> Add First Photo
              </button>
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL (Preview) ────────────────────────────────────────── */}
        <section className={`flex-1 min-w-0 p-3 border-l ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
          <SheetPreview
            slots={store.slots}
            layout={store.layout}
            paper={store.paper}
            settings={store.settings}
            totalPagesCount={store.numPages}
            zoom={previewZoom}
            onZoomChange={setPreviewZoom}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onOrientationChange={store.setOrientation}
            dark={dark}
          />
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer
        className={`border-t px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs ${dark ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-gray-200 bg-white text-gray-500'}`}
        role="contentinfo"
      >
        <address className="not-italic flex flex-wrap items-center gap-3">
          <span className={`font-semibold ${dark ? 'text-slate-200' : 'text-gray-700'}`}>Satya Net Cafe</span>
          <span>73/25 Mohammadien Street, Perambur, Chennai – 600011</span>
          <a
            href="tel:+919940155512"
            className="text-blue-400 hover:text-blue-300 transition"
            aria-label="Call Satya Net Cafe"
          >
            +91 99401 55512
          </a>
        </address>
        <span className={dark ? 'text-slate-500' : 'text-gray-400'}>
          © 2026 Satya-Net-Cafe – Photo Maker Pro
        </span>
      </footer>
    </div>
  );
}
