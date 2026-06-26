import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Check, RefreshCw } from 'lucide-react';
import type { Area } from 'react-easy-crop';
import type { PhotoSize } from '../types';

interface Props {
  imageSrc: string;
  photoSize: PhotoSize;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onConfirm: () => void;
  dark: boolean;
}

export const CropEditor: React.FC<Props> = ({
  imageSrc, photoSize, onCropComplete, onConfirm, dark,
}) => {
  const [crop,     setCrop]     = useState({ x: 0, y: 0 });
  const [zoom,     setZoom]     = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleCropComplete = useCallback(
    (_: Area, pixels: Area) => onCropComplete(_, pixels),
    [onCropComplete],
  );

  const aspect = photoSize.widthMm / photoSize.heightMm;

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const card    = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const label   = dark ? 'text-slate-200' : 'text-gray-800';
  const btnIcon = dark
    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-500'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200';

  return (
    <div className={`rounded-xl border overflow-hidden shadow-sm ${card}`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
        <h2 className={`font-semibold ${label}`}>Crop &amp; Adjust</h2>
        <div className="flex gap-2">
          <span className={`text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono`}>
            {photoSize.widthMm}×{photoSize.heightMm} mm
          </span>
          <button
            onClick={reset}
            className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${btnIcon}`}
          >
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Crop Area */}
      <div className="relative w-full" style={{ height: 380 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          style={{
            containerStyle: {
              background: dark ? '#0f172a' : '#f1f5f9',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className={`px-4 py-3 space-y-3 border-t ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
        {/* Zoom */}
        <div className="flex items-center gap-3">
          <span className={`text-xs w-12 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Zoom</span>
          <button onClick={() => setZoom(Math.max(1, zoom - 0.1))}
            className={`w-7 h-7 rounded border flex items-center justify-center ${btnIcon}`}>
            <ZoomOut size={14} />
          </button>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <button onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className={`w-7 h-7 rounded border flex items-center justify-center ${btnIcon}`}>
            <ZoomIn size={14} />
          </button>
          <span className={`text-xs w-10 text-right font-mono ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Rotate */}
        <div className="flex items-center gap-3">
          <span className={`text-xs w-12 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Rotate</span>
          <button onClick={() => setRotation((r) => r - 90)}
            className={`w-7 h-7 rounded border flex items-center justify-center ${btnIcon}`}>
            <RotateCcw size={14} />
          </button>
          <input
            type="range" min={-180} max={180} step={1}
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <button onClick={() => setRotation((r) => r + 90)}
            className={`w-7 h-7 rounded border flex items-center justify-center ${btnIcon}`}>
            <RotateCw size={14} />
          </button>
          <span className={`text-xs w-10 text-right font-mono ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            {rotation}°
          </span>
        </div>

        {/* Confirm */}
        <button
          onClick={onConfirm}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Check size={16} /> Apply Crop &amp; Preview
        </button>
      </div>
    </div>
  );
};
