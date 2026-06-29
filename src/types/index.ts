// ─── Photo Types ─────────────────────────────────────────────────────────────
export type PhotoType       = 'passport' | 'stamp' | 'custom';
export type BorderType      = 'none' | 'thin' | 'thick';
export type BackgroundColor = 'white' | 'lightgray' | 'custom';
export type PaperPresetKey  = 'a4' | 'maxicard';
export type Orientation     = 'auto' | 'portrait' | 'landscape';

// ─── Photo Size ───────────────────────────────────────────────────────────────
export interface PhotoSize {
  widthMm:  number;
  heightMm: number;
  label:    string;
}

// ─── Crop Area ────────────────────────────────────────────────────────────────
export interface CropArea {
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

// ─── A single customer photo entry in the queue ───────────────────────────────
export interface PhotoEntry {
  id:              string;
  name:            string;        // customer name (optional)
  originalDataUrl: string;        // raw upload
  croppedUrl:      string;        // blob URL after crop
  photoType:       PhotoType;
  photoSize:       PhotoSize;
  copies:          number;
  cropAreaPx:      CropArea;
  rotation:        number;
  zoom:            number;
  border:          BorderType;
}

// ─── Global sheet settings ────────────────────────────────────────────────────
export interface SheetSettings {
  backgroundColor: BackgroundColor;
  customColor:     string;
  showCutMarks:    boolean;
  darkMode:        boolean;
  activePaper:     PaperPresetKey;
  orientation:     Orientation;   // 'auto' | 'portrait' | 'landscape'
}

// ─── Paper preset (always stored in portrait natural dimensions) ───────────────
export interface PaperPreset {
  key:       PaperPresetKey;
  label:     string;
  widthMm:   number;   // short edge (portrait)
  heightMm:  number;   // long  edge (portrait)
  marginMm:  number;
  spacingMm: number;
}

// ─── Computed layout for a paper + photo size ─────────────────────────────────
export interface SheetLayout {
  cols:         number;
  rows:         number;
  photosPerPage:number;
  spacingXMm:   number;
  spacingYMm:   number;
  marginXMm:    number;
  marginYMm:    number;
  /** actual sheet dimensions used (may be rotated) */
  sheetWidthMm: number;
  sheetHeightMm:number;
  isLandscape:  boolean;
}

// ─── One slot in the packed sheet ─────────────────────────────────────────────
export interface PackedSlot {
  page:  number;
  col:   number;
  row:   number;
  entry: PhotoEntry;
}

// ─── Undo / Redo ──────────────────────────────────────────────────────────────
export interface HistorySnapshot {
  queue: PhotoEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const DPI = 300;

// Passport: official 35 × 45 mm  |  Stamp: 25 × 35 mm
export const PHOTO_SIZES: Record<PhotoType, PhotoSize> = {
  passport: { widthMm: 35, heightMm: 45, label: 'Passport (35×45 mm)' },
  stamp:    { widthMm: 25, heightMm: 35, label: 'Stamp (25×35 mm)'    },
  custom:   { widthMm: 35, heightMm: 45, label: 'Custom'               },
};

export const PAPER_PRESETS: Record<PaperPresetKey, PaperPreset> = {
  a4: {
    key: 'a4', label: 'A4',
    widthMm: 210, heightMm: 297,
    marginMm: 5,  spacingMm: 3,
  },
  maxicard: {
    key: 'maxicard', label: 'Maxi Card',
    widthMm: 100, heightMm: 148,
    marginMm: 3,  spacingMm: 2,
  },
};

// ─── Unit helpers ─────────────────────────────────────────────────────────────
export function mmToPx(mm: number): number {
  return Math.round((mm * DPI) / 25.4);
}

export function mmToCssPx(mm: number): number {
  return (mm * 96) / 25.4;
}

// ─── Core grid calculator (given explicit W × H) ──────────────────────────────
function calcGrid(
  sheetW:    number,
  sheetH:    number,
  photo:     PhotoSize,
  marginMm:  number,
  spacingMm: number,
): { cols: number; rows: number; photosPerPage: number;
     marginXMm: number; marginYMm: number } {
  const usableW = sheetW - marginMm * 2;
  const usableH = sheetH - marginMm * 2;

  const cols = Math.max(1, Math.floor((usableW + spacingMm) / (photo.widthMm  + spacingMm)));
  const rows = Math.max(1, Math.floor((usableH + spacingMm) / (photo.heightMm + spacingMm)));

  // Centre the grid on the sheet
  const gridW   = cols * photo.widthMm  + (cols - 1) * spacingMm;
  const gridH   = rows * photo.heightMm + (rows - 1) * spacingMm;
  const marginX = (sheetW - gridW) / 2;
  const marginY = (sheetH - gridH) / 2;

  return { cols, rows, photosPerPage: cols * rows, marginXMm: marginX, marginYMm: marginY };
}

/**
 * Smart packing: find the minimum safe margin (down to MIN_MARGIN_MM) that
 * maximises the number of photos on the sheet, then centre the resulting grid.
 * This lets Maxi Card landscape squeeze from 3 cols → 4 cols when the fixed
 * 3 mm margin would otherwise waste the extra space.
 */
const MIN_MARGIN_MM    = 1;   // absolute minimum print-safe margin
const MARGIN_STEP_MM   = 0.5; // search granularity

function calcGridOptimal(
  sheetW:         number,
  sheetH:         number,
  photo:          PhotoSize,
  nominalMarginMm: number,
  spacingMm:      number,
): { cols: number; rows: number; photosPerPage: number;
     marginXMm: number; marginYMm: number; usedMarginMm: number } {

  let bestResult = { ...calcGrid(sheetW, sheetH, photo, nominalMarginMm, spacingMm),
                     usedMarginMm: nominalMarginMm };

  // Walk margin down until we can't improve, or hit the floor
  let m = nominalMarginMm - MARGIN_STEP_MM;
  while (m >= MIN_MARGIN_MM - 0.001) {
    const candidate = calcGrid(sheetW, sheetH, photo, m, spacingMm);
    if (candidate.photosPerPage > bestResult.photosPerPage) {
      bestResult = { ...candidate, usedMarginMm: m };
    }
    m -= MARGIN_STEP_MM;
  }

  return bestResult;
}

// ─── Layout engine: auto-picks best orientation ───────────────────────────────
/**
 * For a given paper preset, photo size, and orientation preference:
 *  - 'auto'      → pick whichever orientation fits more photos; tie → portrait
 *  - 'portrait'  → always use portrait
 *  - 'landscape' → always use landscape (swap W & H)
 *
 * Uses smart margin optimisation: if reducing the margin (down to 1 mm) allows
 * more photos to fit, that reduced margin is used and the grid is re-centred.
 *
 * Returns a fully resolved SheetLayout including the actual sheet dimensions.
 */
export function computeLayout(
  paper:       PaperPreset,
  photo:       PhotoSize,
  orientation: Orientation = 'auto',
): SheetLayout {
  const pW = paper.widthMm;
  const pH = paper.heightMm;

  // Calculate best layout for both orientations using smart margin optimiser
  const portrait  = calcGridOptimal(pW, pH, photo, paper.marginMm, paper.spacingMm);
  const landscape = calcGridOptimal(pH, pW, photo, paper.marginMm, paper.spacingMm);

  let useLandscape: boolean;
  if (orientation === 'landscape') {
    useLandscape = true;
  } else if (orientation === 'portrait') {
    useLandscape = false;
  } else {
    // auto: pick orientation with more photos; tie → portrait
    useLandscape = landscape.photosPerPage > portrait.photosPerPage;
  }

  const chosen        = useLandscape ? landscape : portrait;
  const sheetWidthMm  = useLandscape ? pH : pW;
  const sheetHeightMm = useLandscape ? pW : pH;

  return {
    cols:          chosen.cols,
    rows:          chosen.rows,
    photosPerPage: chosen.photosPerPage,
    spacingXMm:    paper.spacingMm,
    spacingYMm:    paper.spacingMm,
    marginXMm:     chosen.marginXMm,
    marginYMm:     chosen.marginYMm,
    sheetWidthMm,
    sheetHeightMm,
    isLandscape:   useLandscape,
  };
}

// ─── Queue packer ─────────────────────────────────────────────────────────────
export function packQueue(
  queue:       PhotoEntry[],
  paper:       PaperPreset,
  orientation: Orientation = 'auto',
): PackedSlot[] {
  if (queue.length === 0) return [];

  const baseLayout = computeLayout(paper, queue[0].photoSize, orientation);
  const perPage    = baseLayout.photosPerPage;

  const slots: PackedSlot[] = [];
  let globalIdx = 0;

  for (const entry of queue) {
    for (let i = 0; i < entry.copies; i++) {
      const page = Math.floor(globalIdx / perPage);
      const pos  = globalIdx % perPage;
      const row  = Math.floor(pos / baseLayout.cols);
      const col  = pos % baseLayout.cols;
      slots.push({ page, row, col, entry });
      globalIdx++;
    }
  }

  return slots;
}

export function totalPages(
  queue:       PhotoEntry[],
  paper:       PaperPreset,
  orientation: Orientation = 'auto',
): number {
  if (queue.length === 0) return 1;
  const layout = computeLayout(paper, queue[0].photoSize, orientation);
  const total  = queue.reduce((s, e) => s + e.copies, 0);
  return Math.max(1, Math.ceil(total / layout.photosPerPage));
}
