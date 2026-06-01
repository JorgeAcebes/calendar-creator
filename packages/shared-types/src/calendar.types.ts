// =============================================================================
// Calendar Creator — Complete Data Model
// =============================================================================
// This file defines the entire state tree for a calendar project.
// All spatial measurements use MILLIMETERS as the canonical unit.
// Conversion to px (canvas) or pt (PDF) happens at render time.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums & Literals
// ---------------------------------------------------------------------------

export type Orientation = 'portrait' | 'landscape';

export type PaperFormat = 'A2' | 'A3' | 'A4' | 'A5' | 'B4' | 'B5' | 'Letter' | 'Legal' | 'Tabloid' | 'custom';

export type PageType = 'cover' | 'month';

export type TextAlign = 'left' | 'center' | 'right';

export type VerticalAlign = 'top' | 'middle' | 'bottom';

export type TextTransform = 'none' | 'uppercase' | 'capitalize';

export type FontWeight = 300 | 400 | 500 | 600 | 700;

export type MaskShape = 'rectangle' | 'rounded-rectangle';

export type StartDayOfWeek = 'monday' | 'sunday';

export type CoverTextPosition = 'top-center' | 'center' | 'bottom-center';

export type Locale =
  | 'es-ES'
  | 'en-US'
  | 'en-GB'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'pt-PT'
  | 'pt-BR'
  | 'ca-ES'
  | 'gl-ES'
  | 'eu-ES';

export type LayoutTemplateId =
  | 'cover-full-bleed'
  | 'cover-with-title-bar'
  | 'month-single-photo-top'
  | 'month-single-photo-left'
  | 'month-dual-horizontal'
  | 'month-dual-vertical'
  | 'month-triple-mosaic'
  | 'month-quad-grid'
  | 'month-no-photo';

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/tiff';

// ---------------------------------------------------------------------------
// Paper Dimensions
// ---------------------------------------------------------------------------

export interface PaperDimensions {
  /** Paper format preset */
  format: PaperFormat;
  /** Width in millimeters */
  widthMm: number;
  /** Height in millimeters */
  heightMm: number;
  /** Page orientation */
  orientation: Orientation;
}

/** Standard paper formats with their dimensions in mm */
export const PAPER_FORMATS: Record<Exclude<PaperFormat, 'custom'>, { widthMm: number; heightMm: number }> = {
  A2: { widthMm: 420, heightMm: 594 },
  A3: { widthMm: 297, heightMm: 420 },
  A4: { widthMm: 210, heightMm: 297 },
  A5: { widthMm: 148, heightMm: 210 },
  B4: { widthMm: 250, heightMm: 353 },
  B5: { widthMm: 176, heightMm: 250 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
  Legal: { widthMm: 215.9, heightMm: 355.6 },
  Tabloid: { widthMm: 279.4, heightMm: 431.8 },
};

// ---------------------------------------------------------------------------
// Bleed Settings
// ---------------------------------------------------------------------------

export interface BleedSettings {
  /** Top bleed in mm */
  topMm: number;
  /** Right bleed in mm */
  rightMm: number;
  /** Bottom bleed in mm */
  bottomMm: number;
  /** Left bleed in mm */
  leftMm: number;
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export interface TypographyConfig {
  fontFamily: string;
  fontWeight: FontWeight;
  fontSizePt: number;
  color: string;
  textTransform?: TextTransform;
  textAlign?: TextAlign;
}

export interface DayNumbersTypography extends TypographyConfig {
  /** Color for Sundays */
  sundayColor: string;
  /** Color for Saturdays (optional) */
  saturdayColor?: string;
  /** Vertical alignment within cell */
  verticalAlign: VerticalAlign;
  /** Padding inside each day cell in px (at screen scale) */
  cellPaddingPx: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface DefaultTypography {
  /** Typography for month name header (e.g., "ENERO 2027") */
  monthHeader: TypographyConfig;
  /** Typography for day-of-week names (L, M, X, J, V, S, D) */
  dayNames: TypographyConfig;
  /** Typography for day numbers in the grid */
  dayNumbers: DayNumbersTypography;
}

// ---------------------------------------------------------------------------
// Global Settings
// ---------------------------------------------------------------------------

export interface GlobalSettings {
  paperDimensions: PaperDimensions;
  bleed: BleedSettings;
  defaultTypography: DefaultTypography;
  /** Background color for pages (hex) */
  backgroundColor: string;
  /** Whether to warn when dropping an image that is already used */
  warnOnDuplicatePhotos?: boolean;
  /** Whether to remove gaps between photos in collages */
  removeImageGaps?: boolean;
  /** Margin reserved for ring binder / spiral (in mm, applied at top) */
  bindingMarginMm?: number;
}

// ---------------------------------------------------------------------------
// Image Transform & Mask
// ---------------------------------------------------------------------------

export interface MaskDefinition {
  /** X position of mask origin in mm (relative to trim area) */
  xMm: number;
  /** Y position of mask origin in mm (relative to trim area) */
  yMm: number;
  /** Mask width in mm */
  widthMm: number;
  /** Mask height in mm */
  heightMm: number;
  /** Shape of the mask */
  shape: MaskShape;
  /** Border radius for rounded rectangles, in mm */
  borderRadiusMm: number;
}

export interface ImageTransform {
  /**
   * Scale factor relative to "cover" fill.
   * 1.0 = image covers the mask exactly (no empty space).
   * >1.0 = zoomed in; <1.0 would show empty space (clamped to min cover).
   */
  scale: number;
  /** Horizontal offset in mm (positive = right) */
  offsetXMm: number;
  /** Vertical offset in mm (positive = down) */
  offsetYMm: number;
}

export interface ImageRegion {
  /** Unique ID for this image region */
  id: string;
  /** ID of the dropzone from the layout template */
  dropzoneId: string;
  /** ID of the assigned image file, or null if empty */
  imageFileId: string | null;
  /** Clipping mask definition */
  mask: MaskDefinition;
  /** Image transform within the mask */
  transform: ImageTransform;
  /** If true, clip image to safe area (5mm inside trim) instead of bleed */
  clipToSafeArea?: boolean;
}

// ---------------------------------------------------------------------------
// Calendar Grid
// ---------------------------------------------------------------------------

export interface DayAnnotation {
  /** Day of the month (1-31) */
  day: number;
  /** Annotation text */
  text: string;
  /** Text color (hex) */
  color: string;
  /** Font family override (optional) */
  fontFamily?: string;
  /** Font size in points */
  fontSizePt: number;
  /** Optional emoji/icon */
  icon?: string;
}

export interface CalendarGridConfig {
  /** Position and size of the grid area on the page */
  positionMm: {
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  };
  /** First day of the week */
  startDayOfWeek: StartDayOfWeek;
  /** Show ISO week numbers column */
  showWeekNumbers: boolean;
  /** Show grid lines between day cells */
  showGridLines?: boolean;
  /** Whether to include the year in the month header */
  includeYear?: boolean;
  /** Per-page typography overrides (merged with global defaults) */
  typographyOverrides?: Partial<DefaultTypography>;
  /** Day-specific annotations */
  annotations: DayAnnotation[];
  /** Whether to use short day names (e.g. L vs Lunes) */
  shortDayNames?: boolean;
}

// ---------------------------------------------------------------------------
// Cover Text
// ---------------------------------------------------------------------------

export interface CoverText {
  title: string;
  subtitle: string;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  positionPreset: CoverTextPosition;
  xMm?: number;
  yMm?: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface Page {
  /** Page index: 0 = cover, 1-12 = months */
  index: number;
  /** Page type */
  type: PageType;
  /** Month number (1-12), only for month pages */
  month?: number;
  /** Year for this page (allows calendars spanning year boundaries) */
  year: number;
  /** Layout template ID defining the dropzone geometry */
  layoutTemplateId: LayoutTemplateId;
  /** Page-specific background color override (hex) */
  backgroundColor?: string;
  /** Image regions (one per dropzone in the template) */
  imageRegions: ImageRegion[];
  /** Calendar grid config (null for cover page) */
  calendarGrid: CalendarGridConfig | null;
  /** Cover text overlay (only for cover pages) */
  coverText?: CoverText;
}

// ---------------------------------------------------------------------------
// Uploaded Image Metadata
// ---------------------------------------------------------------------------

export interface UploadedImage {
  /** Unique ID */
  id: string;
  /** Original filename from the user's machine */
  originalFilename: string;
  /** Path in storage (local fs path or S3 key) */
  storagePath: string;
  /** Thumbnail path for quick preview */
  thumbnailPath: string;
  /** Data URL for in-browser preview (populated client-side) */
  previewDataUrl?: string;
  /** Original image width in pixels */
  widthPx: number;
  /** Original image height in pixels */
  heightPx: number;
  /** File size in bytes */
  fileSizeBytes: number;
  /** MIME type */
  mimeType: ImageMimeType;
  /** Estimated DPI based on image dimensions and intended print size */
  dpiEstimate?: number;
  /** Carpeta para organizar la galería */
  folder?: string;
}

// ---------------------------------------------------------------------------
// Calendar Project (Root State)
// ---------------------------------------------------------------------------

export interface CalendarProject {
  /** Unique project ID */
  id: string;
  /** Project name */
  name: string;
  /** Calendar year */
  year: number;
  /** Locale for month/day names */
  locale: Locale;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Global settings (paper, bleed, typography) */
  globalSettings: GlobalSettings;
  /** Array of 13 pages: [0] = cover, [1..12] = months */
  pages: Page[];
  /** Map of uploaded images keyed by imageFileId */
  images: Record<string, UploadedImage>;
}

// ---------------------------------------------------------------------------
// Layout Template Definition (used to define dropzone geometry)
// ---------------------------------------------------------------------------

export interface DropzoneDefinition {
  /** Unique dropzone ID within the template */
  id: string;
  /** Label for UI display */
  label: string;
  /** Position and size in mm (relative to trim area) */
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface LayoutTemplate {
  /** Template ID */
  id: LayoutTemplateId;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Whether this is a cover or month template */
  pageType: PageType;
  /** Dropzone definitions */
  dropzones: DropzoneDefinition[];
  /** Position of calendar grid (only for month templates) */
  calendarGridPosition?: {
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  };
}
