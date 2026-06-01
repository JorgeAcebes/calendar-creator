// =============================================================================
// Calendar Store — Zustand Global State
// =============================================================================
// Central state tree for the entire calendar editor.
// Uses Immer for immutable updates and temporal middleware for undo/redo.
// =============================================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import type {
  CalendarProject,
  Page,
  ImageRegion,
  ImageTransform,
  UploadedImage,
  LayoutTemplateId,
  GlobalSettings,
  DefaultTypography,
  DayAnnotation,
  Locale,
  PaperDimensions,
  CalendarGridConfig,
} from '@calendar-creator/shared-types';
import { getLayoutTemplate, getLayoutsForPageType } from '@/config/layouts';

// ---------------------------------------------------------------------------
// Store State Interface
// ---------------------------------------------------------------------------

interface EditorState {
  /** The active page index (0 = cover, 1-12 = months) */
  activePageIndex: number;
  /** Currently selected image region ID (for offset controls) */
  selectedRegionId: string | null;
  /** Canvas zoom level (0.1 to 2.0) */
  canvasZoom: number;
  /** Show bleed guides */
  showBleedGuides: boolean;
  /** Show safe area guides */
  showSafeGuides: boolean;
  /** Offset step size in mm */
  offsetStepMm: number;
}

export interface CalendarStoreState {
  /** The full calendar project data */
  project: CalendarProject;
  /** Editor UI state (not part of the saved project) */
  editor: EditorState;
}

// ---------------------------------------------------------------------------
// Store Actions Interface
// ---------------------------------------------------------------------------

export interface CalendarStoreActions {
  // --- Project Actions ---
  /** Initialize a new project with default settings */
  initProject: (name: string, year: number, locale: Locale) => void;
  /** Load a project from saved data */
  loadProject: (project: CalendarProject) => void;
  /** Update project name */
  setProjectName: (name: string) => void;
  /** Update project year (regenerates all pages) */
  setProjectYear: (year: number) => void;
  /** Update locale */
  setProjectLocale: (locale: Locale) => void;

  // --- Global Settings ---
  /** Update paper dimensions */
  setPaperDimensions: (dims: PaperDimensions) => void;
  /** Update global typography */
  setDefaultTypography: (typo: Partial<DefaultTypography>) => void;
  /** Update global background color */
  setBackgroundColor: (color: string) => void;
  /** Set warn on duplicate photos */
  setWarnOnDuplicatePhotos: (warn: boolean) => void;
  /** Set remove image gaps */
  setRemoveImageGaps: (remove: boolean) => void;

  // --- Page Actions ---
  /** Set the active page */
  setActivePage: (index: number) => void;
  /** Change page layout template */
  setPageLayout: (pageIndex: number, layoutId: LayoutTemplateId) => void;
  /** Set page-specific background color */
  setPageBackgroundColor: (pageIndex: number, color: string) => void;

  // --- Image Actions ---
  /** Add an uploaded image to the project's image library */
  addImage: (image: UploadedImage) => void;
  /** Remove an image from the library */
  removeImage: (imageId: string) => void;
  /** Move an image to a folder */
  moveImageToFolder: (imageId: string, folder: string) => void;
  /** Assign an image to a dropzone */
  assignImageToRegion: (pageIndex: number, regionId: string, imageId: string) => void;
  /** Clear an image from a region */
  clearImageFromRegion: (pageIndex: number, regionId: string) => void;
  /** Update image transform (offset, scale) */
  updateImageTransform: (pageIndex: number, regionId: string, transform: Partial<ImageTransform>) => void;
  /** Swap images between two regions */
  swapImagesBetweenRegions: (pageIndex: number, regionId1: string, regionId2: string) => void;

  // --- Annotation Actions ---
  /** Add or update a day annotation */
  setDayAnnotation: (pageIndex: number, annotation: DayAnnotation) => void;
  /** Remove a day annotation */
  removeDayAnnotation: (pageIndex: number, day: number) => void;

  // --- Grid Config Actions ---
  /** Update calendar grid configuration for a page */
  updateGridConfig: (pageIndex: number, config: Partial<CalendarGridConfig>) => void;

  // --- Cover Actions ---
  /** Update cover text */
  setCoverText: (text: Partial<import('@calendar-creator/shared-types').CoverText>) => void;

  /** Set clipToSafeArea on a region */
  setRegionClipToSafe: (pageIndex: number, regionId: string, clip: boolean) => void;

  // --- Editor UI Actions ---
  /** Select an image region for editing */
  selectRegion: (regionId: string | null) => void;
  /** Set canvas zoom */
  setCanvasZoom: (zoom: number) => void;
  /** Toggle bleed guides visibility */
  toggleBleedGuides: () => void;
  /** Toggle safe area guides */
  toggleSafeGuides: () => void;
  /** Set offset step size */
  setOffsetStep: (stepMm: number) => void;

  // --- Auto Actions ---
  /** Randomly fill empty image regions with uploaded images */
  randomFillCalendar: () => void;

  // --- Convenience Getters ---
  /** Get the currently active page */
  getActivePage: () => Page;
  /** Get the selected image region */
  getSelectedRegion: () => ImageRegion | null;
}

// ---------------------------------------------------------------------------
// Default Values
// ---------------------------------------------------------------------------

function createDefaultSettings(): GlobalSettings {
  return {
    paperDimensions: {
      format: 'A4',
      widthMm: 210,
      heightMm: 297,
      orientation: 'portrait',
    },
    bleed: { topMm: 3, rightMm: 3, bottomMm: 3, leftMm: 3 },
    defaultTypography: {
      monthHeader: {
        fontFamily: 'Outfit',
        fontWeight: 700,
        fontSizePt: 28,
        color: '#1A1A2E',
        textTransform: 'uppercase',
        textAlign: 'center',
      },
      dayNames: {
        fontFamily: 'Inter',
        fontWeight: 600,
        fontSizePt: 9,
        color: '#555555',
        textTransform: 'uppercase',
        textAlign: 'center',
      },
      dayNumbers: {
        fontFamily: 'Inter',
        fontWeight: 400,
        fontSizePt: 12,
        color: '#1A1A2E',
        sundayColor: '#E63946',
        textAlign: 'center',
        verticalAlign: 'top',
        cellPaddingPx: { top: 4, right: 4, bottom: 4, left: 4 },
      },
    },
    backgroundColor: '#FFFFFF',
    warnOnDuplicatePhotos: true,
    removeImageGaps: false,
    bindingMarginMm: 10,
  };
}

function createDefaultPages(year: number, paper: PaperDimensions): Page[] {
  const pages: Page[] = [];

  // Cover page
  const coverTemplate = getLayoutTemplate('cover-full-bleed', paper);
  pages.push({
    index: 0,
    type: 'cover',
    year,
    layoutTemplateId: 'cover-full-bleed',
    imageRegions: coverTemplate?.dropzones.map((dz) => ({
      id: uuidv4(),
      dropzoneId: dz.id,
      imageFileId: null,
      mask: {
        xMm: dz.xMm,
        yMm: dz.yMm,
        widthMm: dz.widthMm,
        heightMm: dz.heightMm,
        shape: 'rectangle' as const,
        borderRadiusMm: 0,
      },
      transform: { scale: 1, offsetXMm: 0, offsetYMm: 0 },
    })) ?? [],
    calendarGrid: null,
    coverText: {
      title: String(year),
      subtitle: '',
      fontFamily: 'Outfit',
      fontSizePt: 36,
      color: '#000000',
      positionPreset: 'bottom-center',
    },
  });

  // 12 month pages
  for (let m = 1; m <= 12; m++) {
    const template = getLayoutTemplate('month-single-photo-top', paper);
    pages.push({
      index: m,
      type: 'month',
      month: m,
      year,
      layoutTemplateId: 'month-single-photo-top',
      imageRegions: template?.dropzones.map((dz) => ({
        id: uuidv4(),
        dropzoneId: dz.id,
        imageFileId: null,
        mask: {
          xMm: dz.xMm,
          yMm: dz.yMm,
          widthMm: dz.widthMm,
          heightMm: dz.heightMm,
          shape: 'rectangle' as const,
          borderRadiusMm: 0,
        },
        transform: { scale: 1, offsetXMm: 0, offsetYMm: 0 },
      })) ?? [],
      calendarGrid: template?.calendarGridPosition
        ? {
            positionMm: template.calendarGridPosition,
            startDayOfWeek: 'monday',
            showWeekNumbers: false,
            showGridLines: true,
            includeYear: true,
            annotations: [],
          }
        : null,
    });
  }

  return pages;
}

function createDefaultProject(name: string, year: number, locale: Locale): CalendarProject {
  const settings = createDefaultSettings();
  return {
    id: uuidv4(),
    name,
    year,
    locale,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    globalSettings: settings,
    pages: createDefaultPages(year, settings.paperDimensions),
    images: {},
  };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

export const useCalendarStore = create<CalendarStoreState & CalendarStoreActions>()(
  temporal(
    immer((set, get) => ({
      // --- Initial State ---
      project: createDefaultProject('Mi Calendario', new Date().getFullYear() + 1, 'es-ES'),
      editor: {
        activePageIndex: 0,
        selectedRegionId: null,
        canvasZoom: 0.4,
        showBleedGuides: true,
        showSafeGuides: false,
        offsetStepMm: 1,
      },

      // --- Project Actions ---
      initProject: (name, year, locale) => {
        set((state) => {
          state.project = createDefaultProject(name, year, locale);
          state.editor.activePageIndex = 0;
          state.editor.selectedRegionId = null;
        });
      },

      loadProject: (project) => {
        set((state) => {
          state.project = project;
          state.editor.activePageIndex = 0;
          state.editor.selectedRegionId = null;
        });
      },

      setProjectName: (name) => {
        set((state) => {
          state.project.name = name;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setProjectYear: (year) => {
        set((state) => {
          state.project.year = year;
          state.project.pages = createDefaultPages(year, state.project.globalSettings.paperDimensions);
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setProjectLocale: (locale) => {
        set((state) => {
          state.project.locale = locale;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      // --- Global Settings ---
      setPaperDimensions: (dims) => {
        set((state) => {
          state.project.globalSettings.paperDimensions = dims;
          // Regenerate pages with new layout dimensions
          state.project.pages = createDefaultPages(state.project.year, dims);
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setDefaultTypography: (typo) => {
        set((state) => {
          if (typo.monthHeader) {
            Object.assign(state.project.globalSettings.defaultTypography.monthHeader, typo.monthHeader);
          }
          if (typo.dayNames) {
            Object.assign(state.project.globalSettings.defaultTypography.dayNames, typo.dayNames);
          }
          if (typo.dayNumbers) {
            Object.assign(state.project.globalSettings.defaultTypography.dayNumbers, typo.dayNumbers);
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setBackgroundColor: (color) => {
        set((state) => {
          state.project.globalSettings.backgroundColor = color;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setWarnOnDuplicatePhotos: (warn) => {
        set((state) => {
          state.project.globalSettings.warnOnDuplicatePhotos = warn;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setRemoveImageGaps: (remove) => {
        set((state) => {
          state.project.globalSettings.removeImageGaps = remove;
          state.project.updatedAt = new Date().toISOString();
          
          // Must re-apply layout to all pages so the masks are recalculated
          const paper = state.project.globalSettings.paperDimensions;
          for (const page of state.project.pages) {
            const template = getLayoutTemplate(page.layoutTemplateId, paper, remove);
            if (template) {
              page.imageRegions.forEach((region, i) => {
                if (template.dropzones[i]) {
                  const dz = template.dropzones[i];
                  region.mask.xMm = dz.xMm;
                  region.mask.yMm = dz.yMm;
                  region.mask.widthMm = dz.widthMm;
                  region.mask.heightMm = dz.heightMm;
                }
              });
            }
          }
        });
      },

      // --- Page Actions ---
      setActivePage: (index) => {
        set((state) => {
          state.editor.activePageIndex = index;
          state.editor.selectedRegionId = null;
        });
      },

      setPageLayout: (pageIndex, layoutId) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page) return;

          const paper = state.project.globalSettings.paperDimensions;
          const removeGaps = state.project.globalSettings.removeImageGaps;
          const template = getLayoutTemplate(layoutId, paper, removeGaps);
          if (!template) return;

          page.layoutTemplateId = layoutId;
          const oldRegions = page.imageRegions;
          
          page.imageRegions = template.dropzones.map((dz, idx) => ({
            id: uuidv4(),
            dropzoneId: dz.id,
            imageFileId: oldRegions[idx]?.imageFileId || null,
            mask: {
              xMm: dz.xMm,
              yMm: dz.yMm,
              widthMm: dz.widthMm,
              heightMm: dz.heightMm,
              shape: 'rectangle' as const,
              borderRadiusMm: 0,
            },
            transform: oldRegions[idx] && oldRegions[idx].imageFileId 
              ? { ...oldRegions[idx].transform, offsetXMm: 0, offsetYMm: 0, scale: 1 } 
              : { scale: 1, offsetXMm: 0, offsetYMm: 0 },
          }));

          if (template.calendarGridPosition && page.calendarGrid) {
            page.calendarGrid.positionMm = template.calendarGridPosition;
          }

          state.project.updatedAt = new Date().toISOString();
        });
      },

      setPageBackgroundColor: (pageIndex, color) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (page) {
            page.backgroundColor = color;
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      // --- Image Actions ---
      addImage: (image) => {
        set((state) => {
          state.project.images[image.id] = image;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      removeImage: (imageId) => {
        set((state) => {
          delete state.project.images[imageId];
          state.project.pages.forEach((page) => {
            page.imageRegions.forEach((region) => {
              if (region.imageFileId === imageId) {
                region.imageFileId = null;
                region.transform = { scale: 1, offsetXMm: 0, offsetYMm: 0 };
              }
            });
          });
        });
      },

      moveImageToFolder: (imageId, folder) => {
        set((state) => {
          if (state.project.images[imageId]) {
            state.project.images[imageId].folder = folder;
          }
        });
      },

      assignImageToRegion: (pageIndex, regionId, imageId) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page) return;
          const region = page.imageRegions.find((r) => r.id === regionId);
          if (region) {
            region.imageFileId = imageId;
            region.transform = { scale: 1, offsetXMm: 0, offsetYMm: 0 };
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      clearImageFromRegion: (pageIndex, regionId) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page) return;
          const region = page.imageRegions.find((r) => r.id === regionId);
          if (region) {
            region.imageFileId = null;
            region.transform = { scale: 1, offsetXMm: 0, offsetYMm: 0 };
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      updateImageTransform: (pageIndex, regionId, transform) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page) return;
          const region = page.imageRegions.find((r) => r.id === regionId);
          if (region) {
            Object.assign(region.transform, transform);
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      swapImagesBetweenRegions: (pageIndex, regionId1, regionId2) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page) return;
          const r1 = page.imageRegions.find((r) => r.id === regionId1);
          const r2 = page.imageRegions.find((r) => r.id === regionId2);
          if (r1 && r2) {
            const tempFileId = r1.imageFileId;
            const tempTransform = { ...r1.transform };
            
            r1.imageFileId = r2.imageFileId;
            r1.transform = r2.transform;
            
            r2.imageFileId = tempFileId;
            r2.transform = tempTransform;
            
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      setRegionClipToSafe: (pageIndex, regionId, clip) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page) return;
          const region = page.imageRegions.find((r) => r.id === regionId);
          if (region) {
            region.clipToSafeArea = clip;
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      // --- Annotation Actions ---
      setDayAnnotation: (pageIndex, annotation) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page?.calendarGrid) return;
          const existing = page.calendarGrid.annotations.findIndex((a) => a.day === annotation.day);
          if (existing >= 0) {
            page.calendarGrid.annotations[existing] = annotation;
          } else {
            page.calendarGrid.annotations.push(annotation);
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      removeDayAnnotation: (pageIndex, day) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page?.calendarGrid) return;
          page.calendarGrid.annotations = page.calendarGrid.annotations.filter((a) => a.day !== day);
          state.project.updatedAt = new Date().toISOString();
        });
      },

      // --- Grid Config Actions ---
      updateGridConfig: (pageIndex, config) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page?.calendarGrid) return;
          Object.assign(page.calendarGrid, config);
          state.project.updatedAt = new Date().toISOString();
        });
      },

      // --- Cover Actions ---
      setCoverText: (text) => {
        set((state) => {
          const cover = state.project.pages[0];
          if (!cover?.coverText) return;
          Object.assign(cover.coverText, text);
          state.project.updatedAt = new Date().toISOString();
        });
      },

      // --- Editor UI Actions ---
      selectRegion: (regionId) => {
        set((state) => {
          state.editor.selectedRegionId = regionId;
        });
      },

      setCanvasZoom: (zoom) => {
        set((state) => {
          state.editor.canvasZoom = Math.max(0.1, Math.min(2.0, zoom));
        });
      },

      toggleBleedGuides: () => {
        set((state) => {
          state.editor.showBleedGuides = !state.editor.showBleedGuides;
        });
      },

      toggleSafeGuides: () => {
        set((state) => {
          state.editor.showSafeGuides = !state.editor.showSafeGuides;
        });
      },

      setOffsetStep: (stepMm) => {
        set((state) => {
          state.editor.offsetStepMm = stepMm;
        });
      },

      // --- Auto Actions ---
      randomFillCalendar: () => {
        set((state) => {
          const imageIds = Object.keys(state.project.images);
          if (imageIds.length === 0) return;
          
          // Fisher-Yates shuffle
          const shuffled = [...imageIds];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          let imgIndex = 0;
          const paper = state.project.globalSettings.paperDimensions;
          const monthLayouts = getLayoutsForPageType('month', paper);
          
          state.project.pages.forEach((page) => {
            if (page.type === 'month') {
              // Pick a random layout for this month
              const randomLayout = monthLayouts[Math.floor(Math.random() * monthLayouts.length)];
              
              if (page.layoutTemplateId !== randomLayout.id) {
                // Apply the new layout geometry
                page.layoutTemplateId = randomLayout.id;
                page.imageRegions = randomLayout.dropzones.map((dz) => ({
                  id: uuidv4(),
                  dropzoneId: dz.id,
                  imageFileId: null,
                  mask: {
                    xMm: dz.xMm,
                    yMm: dz.yMm,
                    widthMm: dz.widthMm,
                    heightMm: dz.heightMm,
                    shape: 'rectangle',
                    borderRadiusMm: 0,
                  },
                  transform: { scale: 1, offsetXMm: 0, offsetYMm: 0 },
                }));
                if (randomLayout.calendarGridPosition && page.calendarGrid) {
                  page.calendarGrid.positionMm = randomLayout.calendarGridPosition;
                }
              }
            }

            page.imageRegions.forEach((region) => {
              if (!region.imageFileId) {
                region.imageFileId = shuffled[imgIndex % shuffled.length];
                region.transform = { scale: 1, offsetXMm: 0, offsetYMm: 0 };
                imgIndex++;
              }
            });
          });
          state.project.updatedAt = new Date().toISOString();
        });
      },

      // --- Convenience Getters ---
      getActivePage: () => {
        const state = get();
        return state.project.pages[state.editor.activePageIndex];
      },

      getSelectedRegion: () => {
        const state = get();
        const page = state.project.pages[state.editor.activePageIndex];
        if (!page || !state.editor.selectedRegionId) return null;
        return page.imageRegions.find((r) => r.id === state.editor.selectedRegionId) ?? null;
      },
    })),
    {
      limit: 30,
      partialize: (state) => ({ project: state.project }),
    }
  )
);
