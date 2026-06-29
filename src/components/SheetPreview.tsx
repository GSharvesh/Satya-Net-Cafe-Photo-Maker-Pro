import React, { useRef } from 'react';
import {
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Maximize2, AlignCenter, RotateCcw,
} from 'lucide-react';
import type {
  PackedSlot, SheetSettings, SheetLayout, PaperPreset, Orientation,
} from '../types';
import { computeLayout, mmToCssPx } from '../types';

interface Props {
  slots:           PackedSlot[];
  layout:          SheetLayout;
  paper:           PaperPreset;
  settings:        SheetSettings;
  totalPagesCount: number;
  zoom:            number;
  onZoomChange:    (z: number) => void;
  currentPage:     number;
  onPageChange:    (p: number) => void;
  onOrientationChange: (o: Orientation) => void;
  dark:            boolean;
}

export const SheetPreview: React.FC<Props> = ({
  slots, layout, paper, settings, totalPagesCount,
  zoom, onZoomChange, currentPage, onPageChange,
  onOrientationChange, dark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use actual sheet dimensions from layout (already resolved for orientation)
  const scale  = (mm: number) => mmToCssPx(mm) * zoom;
  const sheetW = scale(layout.sheetWidthMm);
  const sheetH = scale(layout.sheetHeightMm);

  const bgColor = (): string => {
    if (settings.backgroundColor === 'white')     return '#ffffff';
    if (settings.backgroundColor === 'lightgray') return '#dcdcdc';
    return settings.customColor;
  };

  const borderCss = (border: string): string => {
    if (border === 'none')  return 'none';
    if (border === 'thin')  return '1px solid #000';
    return '2px solid #000';
  };

  const pageSlots = slots.filter(s => s.page === currentPage);

  const card = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl  = dark ? 'text-slate-200' : 'text-gray-800';
  const sub  = dark ? 'text-slate-400' : 'text-gray-500';

  const fitZoom = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth  - 32;
    const ch = containerRef.current.clientHeight - 32;
    const fw = cw / mmToCssPx(layout.sheetWidthMm);
    const fh = ch / mmToCssPx(layout.sheetHeightMm);
    onZoomChange(+(Math.min(fw, fh, 2)).toFixed(2));
  };

  const orientBtnCls = (active: boolean) =>
    `text-xs px-2 py-0.5 rounded border font-medium transition ${
      active
        ? 'bg-blue-500 text-white border-blue-500'
        : dark
          ? 'bg-slate-700 border-slate-500 text-slate-300 hover:border-blue-400'
          : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-blue-400'
    }`;

  const orientLabel = layout.isLandscape ? 'Landscape' : 'Portrait';
  const isAuto      = settings.orientation === 'auto';

  // Default photo size for empty-slot placeholders
  const defaultW = slots[0]?.entry.photoSize.widthMm  ?? 35;
  const defaultH = slots[0]?.entry.photoSize.heightMm ?? 45;

  return (
    <div className={`rounded-xl border shadow-sm flex flex-col h-full overflow-hidden ${card}`} role="region" aria-label="Sheet Preview">

      {/* ── Header ── */}
      <header className={`px-3 py-2 flex items-center justify-between flex-shrink-0 border-b gap-2 flex-wrap ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold text-sm ${lbl}`}>{paper.label} Preview</h2>
          {/* Orientation badge */}
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1
            ${layout.isLandscape
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-sky-500/20 text-sky-400'
            }`}>
            <RotateCcw size={10}/>
            {orientLabel}
            {isAuto && <span className="opacity-60 ml-0.5">(auto)</span>}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Grid info */}
          <span className={`text-xs hidden lg:block ${sub}`}>
            {layout.cols}×{layout.rows} = {layout.photosPerPage}/pg
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
            {totalPagesCount} pg
          </span>

          {/* Orientation toggles */}
          <div className="flex gap-1">
            <button onClick={() => onOrientationChange('auto')}      className={orientBtnCls(settings.orientation === 'auto')}>Auto</button>
            <button onClick={() => onOrientationChange('portrait')}  className={orientBtnCls(settings.orientation === 'portrait')}>↑ Port</button>
            <button onClick={() => onOrientationChange('landscape')} className={orientBtnCls(settings.orientation === 'landscape')}>→ Land</button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button onClick={() => onZoomChange(Math.max(0.2, +(zoom - 0.1).toFixed(2)))}
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200">
              <ZoomOut size={11}/>
            </button>
            <span className={`text-xs w-9 text-center font-mono ${sub}`}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => onZoomChange(Math.min(2.5, +(zoom + 0.1).toFixed(2)))}
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200">
              <ZoomIn size={11}/>
            </button>
            <button onClick={fitZoom} title="Fit to screen"
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200">
              <Maximize2 size={11}/>
            </button>
            <button onClick={() => onZoomChange(1)} title="100%"
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200">
              <AlignCenter size={11}/>
            </button>
          </div>
        </div>
      </header>
      {totalPagesCount > 1 && (
        <div className={`px-4 py-1.5 flex items-center justify-center gap-3 flex-shrink-0 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="w-7 h-7 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30">
            <ChevronLeft size={14}/>
          </button>
          <span className={`text-sm ${lbl}`}>Page {currentPage + 1} / {totalPagesCount}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPagesCount - 1, currentPage + 1))}
            disabled={currentPage === totalPagesCount - 1}
            className="w-7 h-7 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30">
            <ChevronRight size={14}/>
          </button>
        </div>
      )}

      {/* ── Sheet canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-start justify-center"
        style={{ background: dark ? '#0f172a' : '#e2e8f0' }}
      >
        <div
          id="print-area"
          style={{
            width:      sheetW,
            height:     sheetH,
            background: bgColor(),
            position:   'relative',
            flexShrink: 0,
            boxShadow:  '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {/* ── Filled photo slots ── */}
          {pageSlots.map((slot, i) => {
            const { entry, col, row } = slot;
            // Compute layout for this entry's photo size in the current orientation
            const pl = computeLayout(paper, entry.photoSize, settings.orientation);
            const x  = scale(pl.marginXMm)  + col * (scale(entry.photoSize.widthMm)  + scale(pl.spacingXMm));
            const y  = scale(pl.marginYMm)  + row * (scale(entry.photoSize.heightMm) + scale(pl.spacingYMm));
            const w  = scale(entry.photoSize.widthMm);
            const h  = scale(entry.photoSize.heightMm);

            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: y, width: w, height: h,
                border: borderCss(entry.border),
                overflow: 'hidden', boxSizing: 'border-box',
              }}>
                <img
                  src={entry.croppedUrl}
                  alt="photo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  draggable={false}
                />
                {settings.showCutMarks && <CutMarks scale={scale}/>}
              </div>
            );
          })}

          {/* ── Empty placeholder slots ── */}
          {(() => {
            const filled = pageSlots.length;
            const empties: React.ReactNode[] = [];
            for (let i = filled; i < layout.photosPerPage; i++) {
              const row = Math.floor(i / layout.cols);
              const col = i % layout.cols;
              const x   = scale(layout.marginXMm) + col * (scale(defaultW) + scale(layout.spacingXMm));
              const y   = scale(layout.marginYMm) + row * (scale(defaultH) + scale(layout.spacingYMm));
              empties.push(
                <div key={`e${i}`} style={{
                  position: 'absolute', left: x, top: y,
                  width: scale(defaultW), height: scale(defaultH),
                  border: '1px dashed #bbb', boxSizing: 'border-box',
                  background: 'rgba(200,200,200,0.06)',
                }}/>
              );
            }
            return empties;
          })()}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className={`px-4 py-1.5 text-xs flex flex-wrap gap-3 flex-shrink-0 border-t ${dark ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-500'}`}>
        <span>{layout.sheetWidthMm}×{layout.sheetHeightMm} mm</span>
        <span>{layout.cols}×{layout.rows} grid · {layout.photosPerPage}/page</span>
        <span>{slots.length} photos total</span>
        <span className={layout.isLandscape ? 'text-purple-400' : 'text-sky-400'}>
          {orientLabel}
        </span>
        <span className={`ml-auto ${dark ? 'text-slate-600' : 'text-gray-300'}`}>Satya-Net-Cafe – Photo Maker Pro</span>
      </footer>
    </div>
  );
};

// ─── Cut-mark overlay ─────────────────────────────────────────────────────────
const CutMarks: React.FC<{ scale: (mm: number) => number }> = ({ scale }) => {
  const s = scale(2.2);
  const g = scale(0.4);
  const marks: React.CSSProperties[] = [
    { top: -(g + s), left: -g,      width: s, height: 1 },
    { top: -g,       left: -(g + s),width: 1, height: s },
    { top: -(g + s), right: -g,     width: s, height: 1 },
    { top: -g,       right: -(g + s),width: 1,height: s },
    { bottom: -(g + s), left: -g,   width: s, height: 1 },
    { bottom: -g,    left: -(g + s),width: 1, height: s },
    { bottom: -(g + s), right: -g,  width: s, height: 1 },
    { bottom: -g,    right: -(g + s),width: 1,height: s },
  ];
  return (
    <>
      {marks.map((m, i) => (
        <div key={i} style={{ position: 'absolute', background: '#888', ...m }}/>
      ))}
    </>
  );
};
