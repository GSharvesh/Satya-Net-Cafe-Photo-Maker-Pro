import React, { useState } from 'react';
import { Download, Printer, Loader2, FileImage, Image } from 'lucide-react';
import type { PackedSlot, SheetSettings, PaperPreset, SheetLayout, Orientation } from '../types';
import { generatePDF, generateImage, printPages } from '../utils/generatePDF';

interface Props {
  slots:           PackedSlot[];
  layout:          SheetLayout;
  paper:           PaperPreset;
  settings:        SheetSettings;
  orientation:     Orientation;
  totalPagesCount: number;
  currentPage:     number;
  dark:            boolean;
}

export const ExportControls: React.FC<Props> = ({
  slots, layout, paper, settings, orientation,
  totalPagesCount, currentPage, dark,
}) => {
  const [loadingPdf,   setLoadingPdf]   = useState(false);
  const [loadingImg,   setLoadingImg]   = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const disabled = slots.length === 0;
  const card = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl  = dark ? 'text-slate-200' : 'text-gray-800';
  const sub  = dark ? 'text-slate-400' : 'text-gray-500';

  const orientLabel = layout.isLandscape ? 'Landscape' : 'Portrait';

  const handlePDF = async () => {
    if (disabled) return;
    setLoadingPdf(true);
    try {
      await generatePDF({ slots, layout, paper, settings, totalPagesCount, orientation });
    } catch (e) {
      console.error(e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleImg = async (format: 'png' | 'jpeg') => {
    if (disabled) return;
    setLoadingImg(true);
    try {
      await generateImage(slots, layout, paper, settings, orientation, currentPage, format);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingImg(false);
    }
  };

  const handlePrint = async () => {
    if (disabled) return;
    setLoadingPrint(true);
    try {
      await printPages(slots, layout, paper, settings, orientation, totalPagesCount);
    } catch (e) {
      console.error(e);
      alert('Print failed. Please try again.');
    } finally {
      setLoadingPrint(false);
    }
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${card}`}>
      <h3 className={`font-semibold mb-1 ${lbl}`}>Download &amp; Print</h3>
      <p className={`text-xs mb-3 ${sub}`}>
        {paper.label} · {orientLabel} · {layout.sheetWidthMm}×{layout.sheetHeightMm} mm
      </p>

      <div className="space-y-2">
        {/* PDF */}
        <button
          onClick={handlePDF}
          disabled={disabled || loadingPdf}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 disabled:text-blue-300 text-white font-semibold rounded-lg transition"
        >
          {loadingPdf
            ? <><Loader2 size={15} className="animate-spin"/> Generating…</>
            : <><Download size={15}/> PDF — all {totalPagesCount} page{totalPagesCount !== 1 ? 's' : ''}</>
          }
        </button>

        {/* PNG / JPEG */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleImg('png')}
            disabled={disabled || loadingImg}
            className={`flex items-center justify-center gap-1.5 py-2 font-medium rounded-lg transition border text-xs
              ${dark ? 'bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600 disabled:opacity-40'
                     : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 disabled:opacity-40'}`}
          >
            {loadingImg ? <Loader2 size={13} className="animate-spin"/> : <FileImage size={13}/>}
            PNG
          </button>
          <button
            onClick={() => handleImg('jpeg')}
            disabled={disabled || loadingImg}
            className={`flex items-center justify-center gap-1.5 py-2 font-medium rounded-lg transition border text-xs
              ${dark ? 'bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600 disabled:opacity-40'
                     : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 disabled:opacity-40'}`}
          >
            {loadingImg ? <Loader2 size={13} className="animate-spin"/> : <Image size={13}/>}
            JPEG
          </button>
        </div>

        {/* Print — uses same canvas pipeline as PDF/image export */}
        <button
          onClick={handlePrint}
          disabled={disabled || loadingPrint}
          className={`w-full flex items-center justify-center gap-2 py-2 font-medium rounded-lg transition border text-sm
            ${dark ? 'bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600 disabled:opacity-40'
                   : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 disabled:opacity-40'}`}
        >
          {loadingPrint
            ? <><Loader2 size={14} className="animate-spin"/> Preparing print…</>
            : <><Printer size={14}/> Print</>
          }
        </button>
      </div>

      {disabled && (
        <p className={`text-xs mt-2 text-center ${sub}`}>Add photos to enable export</p>
      )}
    </div>
  );
};
