# Calendar Creator

**Professional calendar creator with print-ready PDF export.** Create beautiful personalized calendars with photos, custom typography, and day annotations — all exportable as high-quality PDFs ready for professional printing.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-22+-green)
![TypeScript](https://img.shields.io/badge/typescript-strict-blue)

## Features

- **13-page calendar**: 1 cover + 12 months
- **Multiple paper formats**: A4, A3, Letter
- **Multi-language support**: ES, EN, FR, DE, IT, PT, CA, GL, EU
- **Professional layouts**: Single photo, 2-photo collage, 3-photo mosaic, 4-photo grid
- **Controlled image positioning**: Arrow-key offset controls (no free-drag) for precise alignment
- **Typography control**: Independent font, size, weight, and color for month header, day names, and day numbers
- **Day annotations**: Add text and emoji to any day
- **Print-ready PDF export**: 300 DPI, CMYK color, 3mm bleed, crop marks, embedded fonts
- **Dark editor UI**: Premium glassmorphism design

## Quick Start

### Prerequisites

- **Node.js** ≥ 22 ([download](https://nodejs.org))
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Docker** (optional, for backend PDF generation with Ghostscript)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/your-username/calendar-creator-app.git
cd calendar-creator-app

# Install dependencies
pnpm install

# Start the frontend development server
pnpm dev:web
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend (for PDF export)

```bash
# Start backend + Redis with Docker
pnpm docker:up

# Or run without Docker (requires Ghostscript installed)
pnpm dev:api
```

## Architecture

```
calendar-creator-app/
├── apps/
│   ├── web/          # React 19 + Vite + Konva.js (Frontend)
│   └── api/          # NestJS + PDFKit + Ghostscript (Backend)
├── packages/
│   ├── shared-types/ # TypeScript types shared between frontend & backend
│   └── tsconfig/     # Shared TypeScript configurations
└── docker/           # Docker files for backend services
```

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Konva.js, Zustand |
| Backend | NestJS, PDFKit, Ghostscript, Sharp |
| State | Zustand with Immer |
| Build | pnpm workspaces, Turborepo |

### Key Design Decisions

1. **No Free Movement**: Images snap to predefined dropzones. Repositioning is done via arrow controls and numeric inputs — preventing misalignment and ensuring print accuracy.

2. **Shared `computeImagePlacement()`**: The exact same function calculates image position/scale on both the Canvas preview and the PDF output, guaranteeing pixel-perfect correspondence.

3. **All dimensions in millimeters**: The state model uses mm as the canonical unit. Conversion to px (canvas) or pt (PDF) happens at render time only.

## License

MIT
