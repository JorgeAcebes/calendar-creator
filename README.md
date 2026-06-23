# Calendar Creator

Calendar Creator is a professional desktop application designed for creating premium print-ready photographic calendars. It features an intuitive, glassmorphism-styled dark editor that allows users to seamlessly place photos, customize typography, and add day-specific annotations. Built for precision and high-quality outputs, the application exports 300 DPI, CMYK-ready PDFs complete with 3mm bleed margins and crop marks, ensuring flawless professional printing.

## Core Features

- **13-Page Project Structure**: Dedicated pages for the front cover and 12 calendar months.
- **Multiple Supported Formats**: Generate layouts in A4, A3, and US Letter sizes.
- **Multilingual Support**: Fully localized interface and calendar generation for ES, EN, FR, DE, IT, PT, CA, GL, and EU.
- **Professional Layout Options**: Choose from full-bleed single photos, 2-photo collages, 3-photo mosaics, and 4-photo grids.
- **Precision Positioning**: Image placement relies on predefined dropzones with controlled offset parameters instead of free dragging, ensuring pixel-perfect alignment.
- **Advanced Typography**: Independent control over font family, size, weight, and color for month headers, day names, and date numbers.
- **Custom Annotations**: Highlight specific dates with custom text labels directly on the calendar grid.
- **Print-Ready PDF Export**: Outputs are strictly formatted for professional printing with high-resolution images, CMYK color space compatibility, embedded fonts, and precise crop marks.
- **Offline and Local**: Operates as a standalone desktop application using Tauri. Projects and images are stored locally in your filesystem.

## Getting Started

### Prerequisites

- Node.js 22 or higher
- pnpm 9 or higher
- Rust toolchain (required for Tauri builds)

### Installation

Clone the repository and install the workspace dependencies:

```bash
git clone https://github.com/JorgeAcebes/calendar-creator.git
cd calendar-creator
pnpm install
```

### Running Locally (Desktop App)

To compile and launch the native desktop application using Tauri:

```bash
pnpm --filter @calendar-creator/web run tauri dev
```

## Architecture

The project is structured as a monorepo utilizing pnpm workspaces and Turborepo for optimal build performance.

- **apps/web**: The frontend interface built with React 19, Vite, and Zustand. It serves as the UI layer for the Tauri desktop application.
- **packages/shared-types**: TypeScript models and interfaces to guarantee type safety across the app.
- **packages/tsconfig**: Shared base configuration for the TypeScript compiler.

### Key Technical Decisions

- **Unified Geometry Calculation**: The logic that computes image positioning and scaling is shared across the Canvas preview and the PDF generation service. This guarantees that what you see in the editor perfectly matches the printed output.
- **Absolute Physical Units**: The state model relies strictly on millimeters as the canonical unit. Conversions to pixels for the web canvas or points for the PDF document occur only during the final render stage.
- **Tauri Local Storage**: The application directly reads and writes project data to the local file system (AppData), allowing for offline usage without a backend database.

## License

This project is licensed under the MIT License.
