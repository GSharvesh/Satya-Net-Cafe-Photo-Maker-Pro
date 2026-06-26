import React, { useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import type { PhotoSettings, PhotoSize, SheetLayout } from '../types';
import { mmToPx } from '../types';
import { generatePDF, getHighResCroppedCanvas } from '../utils/generatePDF';

interface Props {
  croppedImageUrl: string | null;
  settings: PhotoSettings;
  photoSize: PhotoSize;
  layout: SheetLayout;
  dark: boolean;
}

export const ExportControls: React.FC<Props> = ({
  croppedImageUrl, settings, photoSize, layout, dark,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!croppedImageUrl) return;
    setLoading(true);
    try {
      const w = mmToPx(photoSize.widthMm);
      const h = mmToPx(photoSize.heightMm);
      const hiResUrl = await getHighResCroppedCanvas(croppedImageUrl, w, h);
      await generatePDF({
        croppedImageUrl: hiResUrl,
        settings, photoSize, layout,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const disabled = !croppedImageUrl || loading;
  const card = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl  = dark ? 'text-slate-200' : 'text-gray-800';

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${card}`}>
      <h3 className={`font-semibold mb-3 ${lbl}`}>Export</h3>
      <div className="space-y-2">
        <button
          onClick={handleDownloadPDF}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:text-blue-300 text-white font-semibold rounded-lg transition"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Generating PDF…</>
            : <><Download size={16} /> Download PDF</>
          }
        </button>
        <button
          onClick={handlePrint}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 py-2.5 font-semibold rounded-lg transition border
            ${dark
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-500 disabled:opacity-40'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 disabled:opacity-40'
            }`}
        >
          <Printer size={16} /> Print
        </button>
      </div>
      {!croppedImageUrl && (
        <p className={`text-xs mt-2 text-center ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
          Upload and crop a photo first
        </p>
      )}
    </div>
  );
};
