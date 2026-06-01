// =============================================================================
// Layout Templates — Predefined dropzone geometries for each page type
// =============================================================================
// All positions are in millimeters relative to the trim area (0,0 = top-left).
// The layout templates are parameterized by paper dimensions so they adapt
// to A4, A3, Letter, etc.
// =============================================================================

import type { LayoutTemplate, LayoutTemplateId, PaperDimensions } from '@calendar-creator/shared-types';

/**
 * Generate layout templates for a given paper size.
 * Positions are calculated dynamically based on paper dimensions.
 */
export function generateLayoutTemplates(paper: PaperDimensions, removeImageGaps: boolean = false): LayoutTemplate[] {
  const w = paper.widthMm;
  const h = paper.heightMm;

  // Standard proportions
  const photoTopHeight = h * 0.52;       // ~52% for photo area
  const gridStartY = photoTopHeight + 8; // 8mm gap
  const gridHeight = h - gridStartY - 10; // 10mm bottom margin
  const margin = 10; // Standard inner margin in mm
  
  const gap = removeImageGaps ? 0 : 2; // half gap for left/right

  return [
    // ----- COVER TEMPLATES -----
    {
      id: 'cover-full-bleed',
      name: 'Portada completa',
      description: 'Imagen a sangre completa con texto superpuesto',
      pageType: 'cover',
      dropzones: [
        {
          id: 'cover-main',
          label: 'Imagen principal',
          xMm: -3, yMm: -3,
          widthMm: w + 6, heightMm: h + 6,
        },
      ],
    },
    {
      id: 'cover-with-title-bar',
      name: 'Portada con barra de título',
      description: 'Imagen con barra inferior para título',
      pageType: 'cover',
      dropzones: [
        {
          id: 'cover-main',
          label: 'Imagen principal',
          xMm: -3, yMm: -3,
          widthMm: w + 6, heightMm: h * 0.75 + 3,
        },
      ],
    },

    // ----- MONTH TEMPLATES -----
    {
      id: 'month-single-photo-top',
      name: '1 foto (arriba)',
      description: 'Una foto en la mitad superior, cuadrícula abajo',
      pageType: 'month',
      dropzones: [
        {
          id: 'photo-top',
          label: 'Foto superior',
          xMm: 0, yMm: 0,
          widthMm: w, heightMm: photoTopHeight,
        },
      ],
      calendarGridPosition: {
        xMm: margin, yMm: gridStartY,
        widthMm: w - margin * 2, heightMm: gridHeight,
      },
    },
    {
      id: 'month-dual-horizontal',
      name: '2 fotos (horizontal)',
      description: 'Dos fotos lado a lado arriba, cuadrícula abajo',
      pageType: 'month',
      dropzones: [
        {
          id: 'photo-left',
          label: 'Foto izquierda',
          xMm: 0, yMm: 0,
          widthMm: w / 2 - gap, heightMm: photoTopHeight,
        },
        {
          id: 'photo-right',
          label: 'Foto derecha',
          xMm: w / 2 + gap, yMm: 0,
          widthMm: w / 2 - gap, heightMm: photoTopHeight,
        },
      ],
      calendarGridPosition: {
        xMm: margin, yMm: gridStartY,
        widthMm: w - margin * 2, heightMm: gridHeight,
      },
    },
    {
      id: 'month-dual-vertical',
      name: '2 fotos (vertical)',
      description: 'Dos fotos apiladas verticalmente, cuadrícula abajo',
      pageType: 'month',
      dropzones: [
        {
          id: 'photo-top',
          label: 'Foto superior',
          xMm: 0, yMm: 0,
          widthMm: w, heightMm: photoTopHeight / 2 - gap,
        },
        {
          id: 'photo-bottom',
          label: 'Foto inferior',
          xMm: 0, yMm: photoTopHeight / 2 + gap,
          widthMm: w, heightMm: photoTopHeight / 2 - gap,
        },
      ],
      calendarGridPosition: {
        xMm: margin, yMm: gridStartY,
        widthMm: w - margin * 2, heightMm: gridHeight,
      },
    },
    {
      id: 'month-triple-mosaic',
      name: '3 fotos (mosaico)',
      description: 'Una grande a la izquierda, dos pequeñas a la derecha',
      pageType: 'month',
      dropzones: [
        {
          id: 'photo-main',
          label: 'Foto principal',
          xMm: 0, yMm: 0,
          widthMm: w * 0.6 - gap, heightMm: photoTopHeight,
        },
        {
          id: 'photo-top-right',
          label: 'Foto superior derecha',
          xMm: w * 0.6 + gap, yMm: 0,
          widthMm: w * 0.4 - gap, heightMm: photoTopHeight / 2 - gap,
        },
        {
          id: 'photo-bottom-right',
          label: 'Foto inferior derecha',
          xMm: w * 0.6 + gap, yMm: photoTopHeight / 2 + gap,
          widthMm: w * 0.4 - gap, heightMm: photoTopHeight / 2 - gap,
        },
      ],
      calendarGridPosition: {
        xMm: margin, yMm: gridStartY,
        widthMm: w - margin * 2, heightMm: gridHeight,
      },
    },
    {
      id: 'month-quad-grid',
      name: '4 fotos (cuadrícula)',
      description: 'Cuatro fotos en cuadrícula 2×2',
      pageType: 'month',
      dropzones: [
        {
          id: 'photo-tl',
          label: 'Arriba izquierda',
          xMm: 0, yMm: 0,
          widthMm: w / 2 - gap, heightMm: photoTopHeight / 2 - gap,
        },
        {
          id: 'photo-tr',
          label: 'Arriba derecha',
          xMm: w / 2 + gap, yMm: 0,
          widthMm: w / 2 - gap, heightMm: photoTopHeight / 2 - gap,
        },
        {
          id: 'photo-bl',
          label: 'Abajo izquierda',
          xMm: 0, yMm: photoTopHeight / 2 + gap,
          widthMm: w / 2 - gap, heightMm: photoTopHeight / 2 - gap,
        },
        {
          id: 'photo-br',
          label: 'Abajo derecha',
          xMm: w / 2 + gap, yMm: photoTopHeight / 2 + gap,
          widthMm: w / 2 - gap, heightMm: photoTopHeight / 2 - gap,
        },
      ],
      calendarGridPosition: {
        xMm: margin, yMm: gridStartY,
        widthMm: w - margin * 2, heightMm: gridHeight,
      },
    },
  ];
}

export function getLayoutTemplate(
  id: LayoutTemplateId,
  paper: PaperDimensions,
  removeImageGaps: boolean = false
): LayoutTemplate | undefined {
  return generateLayoutTemplates(paper, removeImageGaps).find((t) => t.id === id);
}

/**
 * Get all layout templates for a given page type.
 */
export function getLayoutsForPageType(
  pageType: 'cover' | 'month',
  paper: PaperDimensions,
  removeImageGaps: boolean = false
): LayoutTemplate[] {
  return generateLayoutTemplates(paper, removeImageGaps).filter((t) => t.pageType === pageType);
}
