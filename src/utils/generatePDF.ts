import jsPDF from 'jspdf';
import type { PhotoSettings, PhotoSize, SheetLayout } from '../types';
import {
  A4_WIDTH_MM, A4_HEIGHT_MM,
} from '../types';

interface GenerateOptions {
  croppedImageUrl: string;
  settings: PhotoSettings;
  photoSize: PhotoSize;
  layout: SheetLayout;
}

export async function generatePDF(opts: GenerateOptions): Promise<void> {
  const { croppedImageUrl, settings, photoSize, layout } = opts;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalCopies = settings.copies;
  let remaining     = totalCopies;

  for (let page = 0; page < layout.totalPages; page++) {
    if (page > 0) pdf.addPage();

    const photosThisPage = Math.min(remaining, layout.photosPerPage);

    // Background
    const bgColor = getBgColor(settings);
    pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    pdf.rect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, 'F');

    let idx = 0;
    outer: for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        if (idx >= photosThisPage) break outer;

        const x = layout.marginXMm + c * (photoSize.widthMm  + layout.spacingXMm);
        const y = layout.marginYMm + r * (photoSize.heightMm + layout.spacingYMm);

        // Photo image
        pdf.addImage(
          croppedImageUrl,
          'JPEG',
          x, y,
          photoSize.widthMm, photoSize.heightMm,
          undefined,
          'FAST',
        );

        // Border
        if (settings.border !== 'none') {
          const lineWidth = settings.border === 'thin' ? 0.1 : 0.4;
          pdf.setLineWidth(lineWidth);
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, y, photoSize.widthMm, photoSize.heightMm, 'S');
        }

        // Cut marks
        if (settings.showCutMarks) {
          drawCutMarks(pdf, x, y, photoSize.widthMm, photoSize.heightMm);
        }

        idx++;
      }
    }

    remaining -= photosThisPage;
  }

  pdf.save('passport-photos.pdf');
}

function getBgColor(settings: PhotoSettings): { r: number; g: number; b: number } {
  if (settings.backgroundColor === 'white')     return { r: 255, g: 255, b: 255 };
  if (settings.backgroundColor === 'lightgray') return { r: 220, g: 220, b: 220 };
  // custom hex
  const hex = settings.customColor.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function drawCutMarks(
  pdf: jsPDF,
  x: number, y: number,
  w: number, h: number,
): void {
  const len   = 2;   // mm
  const gap   = 0.5; // mm
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.1);

  // Top-left
  pdf.line(x - gap - len, y, x - gap, y);
  pdf.line(x, y - gap - len, x, y - gap);
  // Top-right
  pdf.line(x + w + gap, y, x + w + gap + len, y);
  pdf.line(x + w, y - gap - len, x + w, y - gap);
  // Bottom-left
  pdf.line(x - gap - len, y + h, x - gap, y + h);
  pdf.line(x, y + h + gap, x, y + h + gap + len);
  // Bottom-right
  pdf.line(x + w + gap, y + h, x + w + gap + len, y + h);
  pdf.line(x + w, y + h + gap, x + w, y + h + gap + len);
}

/** Returns a canvas data URL of the cropped image at print resolution */
export async function getHighResCroppedCanvas(
  croppedUrl: string,
  widthPx: number,
  heightPx: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas    = document.createElement('canvas');
      canvas.width    = widthPx;
      canvas.height   = heightPx;
      const ctx       = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, widthPx, heightPx);
      resolve(canvas.toDataURL('image/jpeg', 0.98));
    };
    img.onerror = reject;
    img.src     = croppedUrl;
  });
}
