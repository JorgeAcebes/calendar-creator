// =============================================================================
// Font Catalog — Curated fonts available for calendar design
// =============================================================================
// All fonts are loaded from Google Fonts (OFL license).
// The fontFamily string must match the Google Fonts name exactly.
// =============================================================================

export interface FontOption {
  /** Font family name (must match CSS/Google Fonts) */
  family: string;
  /** Human-readable display name */
  label: string;
  /** Available weights */
  weights: number[];
  /** Category for grouping in UI */
  category: 'sans-serif' | 'serif' | 'display';
}

export const FONT_CATALOG: FontOption[] = [
  {
    family: 'Inter',
    label: 'Inter',
    weights: [300, 400, 500, 600, 700],
    category: 'sans-serif',
  },
  {
    family: 'Outfit',
    label: 'Outfit',
    weights: [300, 400, 500, 600, 700],
    category: 'sans-serif',
  },
  {
    family: 'Roboto',
    label: 'Roboto',
    weights: [300, 400, 500, 700],
    category: 'sans-serif',
  },
  {
    family: 'Montserrat',
    label: 'Montserrat',
    weights: [300, 400, 500, 600, 700],
    category: 'sans-serif',
  },
  {
    family: 'Poppins',
    label: 'Poppins',
    weights: [300, 400, 500, 600, 700],
    category: 'sans-serif',
  },
  {
    family: 'Raleway',
    label: 'Raleway',
    weights: [300, 400, 500, 600, 700],
    category: 'sans-serif',
  },
  {
    family: 'DM Sans',
    label: 'DM Sans',
    weights: [400, 500, 700],
    category: 'sans-serif',
  },
  {
    family: 'Source Sans 3',
    label: 'Source Sans',
    weights: [300, 400, 600, 700],
    category: 'sans-serif',
  },
  {
    family: 'Playfair Display',
    label: 'Playfair Display',
    weights: [400, 500, 600, 700],
    category: 'serif',
  },
  {
    family: 'Lora',
    label: 'Lora',
    weights: [400, 500, 600, 700],
    category: 'serif',
  },
];

/**
 * Get font option by family name.
 */
export function getFontOption(family: string): FontOption | undefined {
  return FONT_CATALOG.find((f) => f.family === family);
}

/**
 * Get available weights for a font family.
 */
export function getFontWeights(family: string): number[] {
  return getFontOption(family)?.weights ?? [400];
}
