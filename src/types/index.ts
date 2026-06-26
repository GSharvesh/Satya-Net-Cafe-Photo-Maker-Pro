export type PhotoType = 'passport' | 'stamp' | 'custom';
export type BorderType = 'none' | 'thin' | 'thick';
export type BackgroundColor = 'white' | 'lightgray' | 'custom';

export interface PhotoSize {
  widthMm: number;
  heightMm: number;
  label: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoSettings {
  photoType: PhotoType;
  copies: number;
  border: BorderType;
  backgroundColor: BackgroundColor;
  customColor: string;
  showCutMarks: boolean;
  darkMode: boolean;
}

export interface SheetLayout {
  cols: number;
  rows: number;
  photosPerPage: number;
  totalPages: number;
  spacingXMm: number;
  spacingYMm: number;
  marginXMm: number;
  marginYMm: number;
}

export const PHOTO_SIZES: Record<PhotoType, PhotoSize> = {
  passport: { widthMm: 35, heightMm: 45, label: 'Passport (35×45 mm)' },
  stamp:    { widthMm: 25, heightMm: 35, label: 'Stamp (25×35 mm)' },
  custom:   { widthMm: 35, heightMm: 45, label: 'Custom' },
};

export const A4_WIDTH_MM  = 210;
export const A4_HEIGHT_MM = 297;
export const DPI          = 300;

/** Convert mm → pixels at 300 DPI */
export function mmToPx(mm: number): number {
  return Math.round((mm * DPI) / 25.4);
}

/** Convert mm → CSS pixels (screen: 96 DPI) */
export function mmToCssPx(mm: number): number {
  return (mm * 96) / 25.4;
}

export function computeLayout(size: PhotoSize, copies: number): SheetLayout {
  const spacingMm = 3;
  const marginMm  = 5;

  const usableW = A4_WIDTH_MM  - marginMm * 2;
  const usableH = A4_HEIGHT_MM - marginMm * 2;

  const cols = Math.floor((usableW + spacingMm) / (size.widthMm  + spacingMm));
  const rows = Math.floor((usableH + spacingMm) / (size.heightMm + spacingMm));

  const photosPerPage = cols * rows;
  const totalPages    = Math.ceil(copies / photosPerPage);

  // Center the grid
  const gridW   = cols * size.widthMm  + (cols - 1) * spacingMm;
  const gridH   = rows * size.heightMm + (rows - 1) * spacingMm;
  const marginX = (A4_WIDTH_MM  - gridW) / 2;
  const marginY = (A4_HEIGHT_MM - gridH) / 2;

  return {
    cols, rows, photosPerPage, totalPages,
    spacingXMm: spacingMm, spacingYMm: spacingMm,
    marginXMm: marginX, marginYMm: marginY,
  };
}
