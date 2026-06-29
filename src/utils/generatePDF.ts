import jsPDF from 'jspdf';
import type { SheetSettings, PaperPreset, PackedSlot, SheetLayout, Orientation } from '../types';
import { computeLayout, mmToPx } from '../types';
import { toDataUrl } from './cropImage';

// ─── PDF export ───────────────────────────────────────────────────────────────

interface GenerateOptions {
  slots:           PackedSlot[];
  layout:          SheetLayout;
  paper:           PaperPreset;
  settings:        SheetSettings;
  totalPagesCount: number;
  orientation:     Orientation;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function getBgRgb(s: SheetSettings) {
  if (s.backgroundColor === 'white')     return { r: 255, g: 255, b: 255 };
  if (s.backgroundColor === 'lightgray') return { r: 220, g: 220, b: 220 };
  return hexToRgb(s.customColor);
}

function drawCutMarksPdf(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  const len = 2, gap = 0.5;
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.1);
  pdf.line(x - gap - len, y,             x - gap,           y            );
  pdf.line(x,             y - gap - len, x,                 y - gap      );
  pdf.line(x + w + gap,   y,             x + w + gap + len, y            );
  pdf.line(x + w,         y - gap - len, x + w,             y - gap      );
  pdf.line(x - gap - len, y + h,         x - gap,           y + h        );
  pdf.line(x,             y + h + gap,   x,                 y + h + gap + len);
  pdf.line(x + w + gap,   y + h,         x + w + gap + len, y + h        );
  pdf.line(x + w,         y + h + gap,   x + w,             y + h + gap + len);
}

export async function generatePDF(opts: GenerateOptions): Promise<void> {
  const { slots, layout, paper, settings, totalPagesCount, orientation } = opts;

  const pageW = layout.sheetWidthMm;
  const pageH = layout.sheetHeightMm;

  // Pre-render all unique images at 300 DPI
  const cache = new Map<string, string>();
  for (const slot of slots) {
    if (!cache.has(slot.entry.croppedUrl)) {
      const w = mmToPx(slot.entry.photoSize.widthMm);
      const h = mmToPx(slot.entry.photoSize.heightMm);
      cache.set(slot.entry.croppedUrl, await toDataUrl(slot.entry.croppedUrl, w, h));
    }
  }

  const pdf = new jsPDF({
    orientation: layout.isLandscape ? 'landscape' : 'portrait',
    unit:        'mm',
    format:      [pageW, pageH],
  });

  const bg = getBgRgb(settings);

  for (let page = 0; page < totalPagesCount; page++) {
    if (page > 0) pdf.addPage([pageW, pageH], layout.isLandscape ? 'landscape' : 'portrait');

    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(0, 0, pageW, pageH, 'F');

    for (const slot of slots.filter(s => s.page === page)) {
      const { entry, col, row } = slot;
      const pl = computeLayout(paper, entry.photoSize, orientation);
      const x  = pl.marginXMm + col * (entry.photoSize.widthMm  + pl.spacingXMm);
      const y  = pl.marginYMm + row * (entry.photoSize.heightMm + pl.spacingYMm);
      const w  = entry.photoSize.widthMm;
      const h  = entry.photoSize.heightMm;

      pdf.addImage(cache.get(entry.croppedUrl)!, 'JPEG', x, y, w, h, undefined, 'FAST');

      if (entry.border !== 'none') {
        pdf.setLineWidth(entry.border === 'thin' ? 0.1 : 0.4);
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(x, y, w, h, 'S');
      }

      if (settings.showCutMarks) drawCutMarksPdf(pdf, x, y, w, h);
    }
  }

  const tag = layout.isLandscape ? 'landscape' : 'portrait';
  pdf.save(`satya-net-cafe-photo-maker-${paper.label}-${tag}.pdf`);
}

// ─── Shared canvas renderer ───────────────────────────────────────────────────
// Used by both generateImage (download) and printPages (print).
// Returns an array of JPEG data-URLs, one per page.

const RENDER_SCALE = 3; // 3× screen = ~288 DPI

async function renderPagesToCanvas(
  slots:           PackedSlot[],
  layout:          SheetLayout,
  paper:           PaperPreset,
  settings:        SheetSettings,
  orientation:     Orientation,
  totalPagesCount: number,
): Promise<string[]> {
  const pxW   = Math.round((layout.sheetWidthMm  / 25.4) * 96 * RENDER_SCALE);
  const pxH   = Math.round((layout.sheetHeightMm / 25.4) * 96 * RENDER_SCALE);
  const mmPx  = (mm: number) => (mm / 25.4) * 96 * RENDER_SCALE;

  const bgFill = settings.backgroundColor === 'white'
    ? '#ffffff'
    : settings.backgroundColor === 'lightgray'
      ? '#dcdcdc'
      : settings.customColor;

  const dataUrls: string[] = [];

  for (let page = 0; page < totalPagesCount; page++) {
    const canvas  = document.createElement('canvas');
    canvas.width  = pxW;
    canvas.height = pxH;
    const ctx     = canvas.getContext('2d')!;

    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, pxW, pxH);

    for (const slot of slots.filter(s => s.page === page)) {
      const { entry, col, row } = slot;
      const pl = computeLayout(paper, entry.photoSize, orientation);
      const x  = mmPx(pl.marginXMm  + col * (entry.photoSize.widthMm  + pl.spacingXMm));
      const y  = mmPx(pl.marginYMm  + row * (entry.photoSize.heightMm + pl.spacingYMm));
      const w  = mmPx(entry.photoSize.widthMm);
      const h  = mmPx(entry.photoSize.heightMm);

      await new Promise<void>(res => {
        const img   = new Image();
        img.onload  = () => { ctx.drawImage(img, x, y, w, h); res(); };
        img.onerror = () => res();
        img.src     = entry.croppedUrl;
      });

      if (entry.border !== 'none') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth   = entry.border === 'thin' ? RENDER_SCALE : RENDER_SCALE * 3;
        ctx.strokeRect(x, y, w, h);
      }

      if (settings.showCutMarks) {
        drawCutMarksCanvas(ctx, x, y, w, h, RENDER_SCALE);
      }
    }

    dataUrls.push(canvas.toDataURL('image/jpeg', 0.97));
  }

  return dataUrls;
}

// ─── Canvas cut marks ─────────────────────────────────────────────────────────

function drawCutMarksCanvas(
  ctx:   CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  scale: number,
) {
  const len = 6   * scale;
  const gap = 1.5 * scale;
  ctx.save();
  ctx.strokeStyle = 'rgba(130,130,130,0.9)';
  ctx.lineWidth   = scale;

  const segs: [number, number, number, number][] = [
    [x - gap - len, y,             x - gap,           y            ],
    [x,             y - gap - len, x,                 y - gap      ],
    [x + w + gap,   y,             x + w + gap + len, y            ],
    [x + w,         y - gap - len, x + w,             y - gap      ],
    [x - gap - len, y + h,         x - gap,           y + h        ],
    [x,             y + h + gap,   x,                 y + h + gap + len],
    [x + w + gap,   y + h,         x + w + gap + len, y + h        ],
    [x + w,         y + h + gap,   x + w,             y + h + gap + len],
  ];

  for (const [x1, y1, x2, y2] of segs) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Download image (PNG / JPEG) ──────────────────────────────────────────────

export async function generateImage(
  slots:       PackedSlot[],
  layout:      SheetLayout,
  paper:       PaperPreset,
  settings:    SheetSettings,
  orientation: Orientation,
  page:        number,
  format:      'png' | 'jpeg',
): Promise<void> {
  const dataUrls = await renderPagesToCanvas(
    slots, layout, paper, settings, orientation, page + 1,
  );
  // renderPagesToCanvas renders pages 0..totalPagesCount-1;
  // we only want the requested page index
  const allUrls = await renderPagesToCanvas(
    slots, layout, paper, settings, orientation,
    Math.max(1, page + 1),
  );
  const targetUrl = allUrls[page] ?? allUrls[0];

  const _mime = format === 'png' ? 'image/png' : 'image/jpeg'; void _mime;
  const final = format === 'png'
    ? (() => {
        // Re-encode as PNG from the JPEG data URL
        const img = new Image();
        return new Promise<string>(res => {
          img.onload = () => {
            const c   = document.createElement('canvas');
            c.width   = img.width;
            c.height  = img.height;
            c.getContext('2d')!.drawImage(img, 0, 0);
            res(c.toDataURL('image/png'));
          };
          img.src = targetUrl;
        });
      })()
    : Promise.resolve(targetUrl);

  const dataUrl = await final;
  const a       = document.createElement('a');
  a.href        = dataUrl;
  a.download    = `satya-net-cafe-photos-p${page + 1}.${format}`;
  a.click();
  void dataUrls; // suppress unused warning
}

// ─── Print (same canvas pipeline — matches PDF/image exactly) ────────────────

export async function printPages(
  slots:           PackedSlot[],
  layout:          SheetLayout,
  paper:           PaperPreset,
  settings:        SheetSettings,
  orientation:     Orientation,
  totalPagesCount: number,
): Promise<void> {
  const pageDataUrls = await renderPagesToCanvas(
    slots, layout, paper, settings, orientation, totalPagesCount,
  );

  const pw = layout.sheetWidthMm;
  const ph = layout.sheetHeightMm;

  // One <div class="page"> per page, page-break between them
  const imgTags = pageDataUrls.map((url, i) =>
    `<div class="page"${i > 0 ? ' style="page-break-before:always"' : ''}>` +
    `<img src="${url}" /></div>`
  ).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Satya-Net-Cafe – Photo Maker Pro | Print</title>
<style>
  @page {
    size: ${pw}mm ${ph}mm;
    margin: 0;
  }
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    width: ${pw}mm;
    height: ${ph}mm;
    overflow: hidden;
    background: #ffffff;
  }
  .page {
    width: ${pw}mm;
    height: ${ph}mm;
    overflow: hidden;
    position: relative;
  }
  .page img {
    display: block;
    width: ${pw}mm;
    height: ${ph}mm;
    object-fit: fill;
  }
</style>
</head>
<body>${imgTags}</body>
</html>`;

  // Mount hidden iframe, write document, wait for decode, then print
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  // Write the HTML into the iframe
  await new Promise<void>(resolve => {
    iframe.onload = () => resolve();
    iframe.srcdoc = html;
  });

  // Extra settle time for images to fully decode inside the iframe
  await new Promise<void>(res => setTimeout(res, 800));

  iframe.contentWindow!.focus();
  iframe.contentWindow!.print();

  // Remove iframe after the print dialog is dismissed
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 3000);
}
