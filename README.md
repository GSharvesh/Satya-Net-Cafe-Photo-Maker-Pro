# 📸 PhotoPrint Pro — Passport & Stamp Photo Maker

A professional web application for Xerox shops and photo studios to generate printable passport-size and stamp-size photo sheets from a customer photo.

## 🚀 Live Features

- **Upload** JPG/PNG photos up to 20 MB with drag-and-drop support
- **Crop Editor** — zoom, rotate, and crop with correct aspect ratio locking
- **Photo Types** — Passport (35×45 mm) and Stamp (25×35 mm)
- **Copy Count** — 1 to 500 copies with quick presets (4, 8, 12, 16, 20, 24)
- **Auto Layout** — fills an A4 sheet with max photos, centers the grid, wraps to multiple pages
- **Cut Marks** — toggleable cut guides for easy trimming
- **Borders** — None / Thin / Thick
- **Background** — White / Light Gray / Custom color
- **Download PDF** — 300 DPI print-accurate multi-page PDF
- **Print** — direct browser print with A4 @page rules
- **Dark / Light mode** toggle

## 🛠 Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4
- react-easy-crop
- jsPDF
- html2canvas
- Lucide React icons
- Vite

## 📐 Print Math

```
pixels = mm × 300 ÷ 25.4
```

- Passport (35×45 mm) → **20 photos per A4 page** (4×5 grid)
- Stamp (25×35 mm) → **42 photos per A4 page** (6×7 grid)

## 🏁 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
src/
├── components/
│   ├── UploadPanel.tsx        # Drag-and-drop photo upload
│   ├── PhotoTypeSelector.tsx  # Passport / Stamp selector
│   ├── CropEditor.tsx         # Interactive crop with zoom & rotate
│   ├── CopyCountSelector.tsx  # Copy count stepper + presets
│   ├── SettingsPanel.tsx      # Cut marks, border, background
│   ├── A4Preview.tsx          # Live A4 sheet preview
│   └── ExportControls.tsx     # PDF download + print
├── utils/
│   ├── cropImage.ts           # Canvas-based crop utility
│   └── generatePDF.ts         # jsPDF sheet generator
├── types/
│   └── index.ts               # Types, constants, layout math
└── App.tsx                    # Main 3-panel layout
```

## 📄 License

MIT
