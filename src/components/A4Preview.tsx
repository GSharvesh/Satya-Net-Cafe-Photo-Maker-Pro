import React, { useRef } from 'react';
import type { PhotoSettings, PhotoSize, SheetLayout } from '../types';
import {
  A4_WIDTH_MM, A4_HEIGHT_MM,
  mmToCssPx,
} from '../types';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  croppedImageUrl: string | null;
  settings: PhotoSettings;
  photoSize: PhotoSize;
  layout: SheetLayout;
  zoom: number;
  onZoomChange: (z: number) => void;
  currentPage: number;
  onPageChange: (p: number) => void;
  dark: boolean;
}

export const A4Preview: React.FC<Props> = ({
  croppedImageUrl, settings, photoSize, layout,
  zoom, onZoomChange, currentPage, onPageChange, dark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const a4WPx = mmToCssPx(A4_WIDTH_MM)  * zoom;
  const a4HPx = mmToCssPx(A4_HEIGHT_MM) * zoom;

  const scale = (mm: number) => mmToCssPx(mm) * zoom;

  const bgStyle = (): string => {
    if (settings.backgroundColor === 'white')     return '#ffffff';
    if (settings.backgroundColor === 'lightgray') return '#dcdcdc';
    return settings.customColor;
  };

  const borderStyle = (): string => {
    if (settings.border === 'none')  return 'none';
    if (settings.border === 'thin')  return '1px solid #000';
    return '2px solid #000';
  };

  // Photos on current page
  const startIdx  = currentPage * layout.photosPerPage;
  const endIdx    = Math.min(startIdx + layout.photosPerPage, settings.copies);
  const photosNow = endIdx - startIdx;

  const photoSlots: { col: number; row: number; hasPhoto: boolean }[] = [];
  let placed = 0;
  outer: for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      photoSlots.push({ col: c, row: r, hasPhoto: placed < photosNow });
      placed++;
      if (placed >= layout.photosPerPage) break outer;
    }
  }

  const card = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl  = dark ? 'text-slate-200' : 'text-gray-800';
  const sub  = dark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className={`rounded-xl border shadow-sm flex flex-col overflow-hidden ${card}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
        <h2 className={`font-semibold ${lbl}`}>A4 Preview</h2>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <span className={`text-xs ${sub}`}>
            {layout.cols}×{layout.rows} = {layout.photosPerPage}/page
          </span>
          <span className={`text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium`}>
            {layout.totalPages} page{layout.totalPages !== 1 ? 's' : ''}
          </span>
          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))}
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200">
              <ZoomOut size={12} />
            </button>
            <span className={`text-xs w-10 text-center font-mono ${sub}`}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
              className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200">
              <ZoomIn size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Page navigation */}
      {layout.totalPages > 1 && (
        <div className={`px-4 py-2 flex items-center justify-center gap-3 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="w-7 h-7 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className={`text-sm ${lbl}`}>Page {currentPage + 1} / {layout.totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(layout.totalPages - 1, currentPage + 1))}
            disabled={currentPage === layout.totalPages - 1}
            className="w-7 h-7 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* A4 Sheet */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-start justify-center"
        style={{ background: dark ? '#0f172a' : '#e2e8f0', minHeight: 400 }}
      >
        <div
          id="print-area"
          style={{
            width:    a4WPx,
            height:   a4HPx,
            background: bgStyle(),
            position: 'relative',
            flexShrink: 0,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Grid of photos */}
          {photoSlots.map((slot, i) => {
            const x = scale(layout.marginXMm) + slot.col * (scale(photoSize.widthMm) + scale(layout.spacingXMm));
            const y = scale(layout.marginYMm) + slot.row * (scale(photoSize.heightMm) + scale(layout.spacingYMm));
            const w = scale(photoSize.widthMm);
            const h = scale(photoSize.heightMm);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x, top: y,
                  width: w, height: h,
                  border: borderStyle(),
                  overflow: 'hidden',
                  background: !croppedImageUrl ? '#e5e7eb' : undefined,
                  boxSizing: 'border-box',
                }}
              >
                {croppedImageUrl ? (
                  <img
                    src={croppedImageUrl}
                    alt="photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    draggable={false}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d1d5db' }}>
                    <span style={{ fontSize: scale(3), color: '#9ca3af', fontWeight: 600 }}>Photo</span>
                  </div>
                )}

                {/* Cut marks */}
                {settings.showCutMarks && (
                  <>
                    {/* Corners */}
                    {[
                      { top: -scale(2.5), left: -scale(0.5), width: scale(2), height: 1 },
                      { top: -scale(0.5), left: -scale(2.5), width: 1, height: scale(2) },
                      { top: -scale(2.5), right: -scale(0.5), width: scale(2), height: 1 },
                      { top: -scale(0.5), right: -scale(2.5), width: 1, height: scale(2) },
                      { bottom: -scale(2.5), left: -scale(0.5), width: scale(2), height: 1 },
                      { bottom: -scale(0.5), left: -scale(2.5), width: 1, height: scale(2) },
                      { bottom: -scale(2.5), right: -scale(0.5), width: scale(2), height: 1 },
                      { bottom: -scale(0.5), right: -scale(2.5), width: 1, height: scale(2) },
                    ].map((s, ci) => (
                      <div key={ci} style={{ position: 'absolute', background: '#888', ...s }} />
                    ))}
                  </>
                )}
              </div>
            );
          })}

          {/* Empty placeholders */}
          {croppedImageUrl && (() => {
            const extra: React.ReactNode[] = [];
            let idx = photosNow;
            for (let r = 0; r < layout.rows; r++) {
              for (let c = 0; c < layout.cols; c++) {
                if (idx >= layout.photosPerPage) break;
                const x = scale(layout.marginXMm) + c * (scale(photoSize.widthMm) + scale(layout.spacingXMm));
                const y = scale(layout.marginYMm) + r * (scale(photoSize.heightMm) + scale(layout.spacingYMm));
                // only render if this slot is beyond photosNow
                const slotNum = r * layout.cols + c;
                if (slotNum >= photosNow) {
                  extra.push(
                    <div key={`empty-${r}-${c}`} style={{
                      position: 'absolute', left: x, top: y,
                      width: scale(photoSize.widthMm), height: scale(photoSize.heightMm),
                      border: '1px dashed #ccc', boxSizing: 'border-box',
                      background: 'rgba(200,200,200,0.1)',
                    }} />
                  );
                }
                idx++;
              }
            }
            return extra;
          })()}
        </div>
      </div>

      {/* Footer info */}
      <div className={`px-4 py-2 text-xs flex gap-4 border-t ${dark ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-500'}`}>
        <span>Size: {photoSize.widthMm}×{photoSize.heightMm}mm</span>
        <span>Layout: {layout.cols}×{layout.rows}</span>
        <span>Total: {settings.copies} photos • {layout.totalPages} page{layout.totalPages !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};
