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
  DayNamesFormat,
} from '@calendar-creator/shared-types';
import { getLayoutTemplate, getLayoutsForPageType } from '@/config/layouts';
import { imagePreviewDataCache } from '@/utils/imageCache';
import { getAllHolidaysForYear } from '@/utils/spanishHolidays';
export { imagePreviewDataCache };

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
  /** Currently dragged image IDs from the gallery */
  draggedImageIds: string[] | null;
  /** Region ID being hovered during a gallery drag */
  dragOverRegionId: string | null;
  /** Selected day in calendar grid for notes/annotations */
  selectedDayForAnnotation: number | null;
  /** Active sidebar tab in editor */
  activeTab: 'design' | 'typography' | 'notes';
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
  setDefaultTypography: (typo: Partial<DefaultTypography>, applyGlobally?: boolean, pageIndex?: number) => void;
  /** Update global background color */
  setBackgroundColor: (color: string) => void;
  /** Set warn on duplicate photos */
  setWarnOnDuplicatePhotos: (warn: boolean) => void;
  /** Set remove image gaps */
  setRemoveImageGaps: (remove: boolean) => void;

  // --- Global Grid & Safety Toggles ---
  /** Update includeYear globally (default) or for single page */
  setGlobalIncludeYear: (includeYear: boolean, applyGlobally?: boolean, pageIndex?: number) => void;
  /** Update shortDayNames globally (default) or for single page */
  setGlobalShortDayNames: (shortDayNames: boolean, applyGlobally?: boolean, pageIndex?: number) => void;
  /** Update dayNamesFormat globally (default) or for single page ('single' | 'short' | 'full') */
  setGlobalDayNamesFormat: (format: DayNamesFormat, applyGlobally?: boolean, pageIndex?: number) => void;
  /** Update showGridLines globally (default) or for single page */
  setGlobalShowGridLines: (showGridLines: boolean, applyGlobally?: boolean, pageIndex?: number) => void;
  /** Update clipToSafeArea globally (default) or for single region */
  setGlobalClipToSafe: (clip: boolean, applyGlobally?: boolean, pageIndex?: number, regionId?: string) => void;
  /** Apply Spanish national and provincial public holidays to all calendar pages */
  applySpanishHolidays: (includeNational: boolean, provinceId?: string, holidayColor?: string) => void;
  /** Clear automated Spanish holidays from all pages */
  clearSpanishHolidays: () => void;
  /** Update holiday text position, fill background, background color, and holiday text/number color */
  setHolidayStyle: (
    style: {
      textPosition?: 'top' | 'middle' | 'bottom';
      fillBackground?: boolean;
      backgroundColor?: string;
      holidayColor?: string;
    },
    applyGlobally?: boolean,
    pageIndex?: number
  ) => void;

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
  /** Clear all day annotations for a page */
  clearAllDayAnnotations: (pageIndex: number) => void;

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
  setOffsetStepMm: (step: number) => void;
  /** Set dragged image IDs */
  setDraggedImageIds: (ids: string[] | null) => void;
  /** Set drag over region ID */
  setDragOverRegionId: (regionId: string | null) => void;
  /** Select day for annotation editing */
  setSelectedDayForAnnotation: (day: number | null) => void;
  /** Set active editor tab */
  setActiveTab: (tab: 'design' | 'typography' | 'notes') => void;

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
        sundayColor: '#000000',
        textAlign: 'center',
        verticalAlign: 'top',
        cellPaddingPx: { top: 4, right: 4, bottom: 4, left: 4 },
      },
    },
    backgroundColor: '#FFFFFF',
    warnOnDuplicatePhotos: true,
    removeImageGaps: false,
    bindingMarginMm: 10,
    includeYear: true,
    shortDayNames: true,
    dayNamesFormat: 'short',
    clipToSafeArea: false,
    includeNationalHolidays: false,
    holidayProvince: undefined,
    holidayTextPosition: 'bottom',
    holidayFillBackground: false,
    holidayBackgroundColor: '#ffebee',
    holidayColor: '#000000',
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
      showShadow: false,
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
            shortDayNames: true,
            dayNamesFormat: 'short',
            holidayTextPosition: 'bottom',
            holidayFillBackground: false,
            holidayBackgroundColor: '#ffebee',
            holidayColor: '#000000',
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
        canvasZoom: 0.22,
        showBleedGuides: true,
        showSafeGuides: true,
        offsetStepMm: 1,
        draggedImageIds: null,
        dragOverRegionId: null,
        selectedDayForAnnotation: null,
        activeTab: 'design',
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
        if (project.images) {
          Object.values(project.images).forEach((img: any) => {
            if (img.previewDataUrl) {
              imagePreviewDataCache.set(img.id, img.previewDataUrl);
            }
          });
        }
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
          const oldPages = state.project.pages;
          state.project.globalSettings.paperDimensions = dims;
          const newPages = createDefaultPages(state.project.year, dims);
          
          for (let i = 0; i < newPages.length; i++) {
             const oldPage = oldPages.find(p => p.index === newPages[i].index);
             if (!oldPage) continue;
             
             // Preserve images
             for (let j = 0; j < Math.min(newPages[i].imageRegions.length, oldPage.imageRegions.length); j++) {
                newPages[i].imageRegions[j].imageFileId = oldPage.imageRegions[j].imageFileId;
                newPages[i].imageRegions[j].transform = oldPage.imageRegions[j].transform;
             }
             
             // Preserve text
             if (newPages[i].type === 'cover' && oldPage.type === 'cover' && newPages[i].coverText && oldPage.coverText) {
                newPages[i].coverText = { ...newPages[i].coverText!, ...oldPage.coverText };
             }
          }
          
          state.project.pages = newPages;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setDefaultTypography: (typo, applyGlobally = true, pageIndex) => {
        set((state) => {
          if (applyGlobally) {
            if (typo.monthHeader) {
              Object.assign(state.project.globalSettings.defaultTypography.monthHeader, typo.monthHeader);
            }
            if (typo.dayNames) {
              Object.assign(state.project.globalSettings.defaultTypography.dayNames, typo.dayNames);
            }
            if (typo.dayNumbers) {
              Object.assign(state.project.globalSettings.defaultTypography.dayNumbers, typo.dayNumbers);
            }
            // Clear overrides so all pages adopt the global setting
            state.project.pages.forEach((p) => {
              if (p.calendarGrid) {
                p.calendarGrid.typographyOverrides = undefined;
              }
            });
          } else if (pageIndex !== undefined && state.project.pages[pageIndex]?.calendarGrid) {
            const grid = state.project.pages[pageIndex].calendarGrid!;
            grid.typographyOverrides = {
              ...(grid.typographyOverrides || {}),
              ...(typo.monthHeader ? { monthHeader: { ...(grid.typographyOverrides?.monthHeader || state.project.globalSettings.defaultTypography.monthHeader), ...typo.monthHeader } } : {}),
              ...(typo.dayNames ? { dayNames: { ...(grid.typographyOverrides?.dayNames || state.project.globalSettings.defaultTypography.dayNames), ...typo.dayNames } } : {}),
              ...(typo.dayNumbers ? { dayNumbers: { ...(grid.typographyOverrides?.dayNumbers || state.project.globalSettings.defaultTypography.dayNumbers), ...typo.dayNumbers } } : {}),
            };
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
        if (image.previewDataUrl) {
          imagePreviewDataCache.set(image.id, image.previewDataUrl);
        }
        set((state) => {
          state.project.images[image.id] = image;
          state.project.updatedAt = new Date().toISOString();
        });
      },

      removeImage: (imageId) => {
        imagePreviewDataCache.delete(imageId);
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
          const region = page.imageRegions.find((r: any) => r.id === regionId);
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
          const region = page.imageRegions.find((r: any) => r.id === regionId);
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
          const region = page.imageRegions.find((r: any) => r.id === regionId);
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
          const r1 = page.imageRegions.find((r: any) => r.id === regionId1);
          const r2 = page.imageRegions.find((r: any) => r.id === regionId2);
          if (r1 && r2) {
            const tempFileId = r1.imageFileId;
            const tempTransform = r1.transform
              ? { ...r1.transform }
              : { scale: 1, offsetXMm: 0, offsetYMm: 0 };
            
            r1.imageFileId = r2.imageFileId;
            r1.transform = r2.imageFileId && r2.transform
              ? { ...r2.transform }
              : { scale: 1, offsetXMm: 0, offsetYMm: 0 };
            
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
          const region = page.imageRegions.find((r: any) => r.id === regionId);
          if (region) {
            region.clipToSafeArea = clip;
            state.project.updatedAt = new Date().toISOString();
          }
        });
      },

      setGlobalClipToSafe: (clip, applyGlobally = true, pageIndex, regionId) => {
        set((state) => {
          state.project.globalSettings.clipToSafeArea = clip;
          if (applyGlobally) {
            state.project.pages.forEach((page) => {
              page.imageRegions.forEach((r: any) => {
                r.clipToSafeArea = clip;
              });
            });
          } else if (pageIndex !== undefined && regionId) {
            const page = state.project.pages[pageIndex];
            const region = page?.imageRegions.find((r: any) => r.id === regionId);
            if (region) {
              region.clipToSafeArea = clip;
            }
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      // --- Annotation Actions ---
      setDayAnnotation: (pageIndex, annotation) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page?.calendarGrid) return;
          const ann = { ...annotation, day: Number(annotation.day) };
          const existing = page.calendarGrid.annotations.findIndex((a: any) => Number(a.day) === ann.day);
          if (existing >= 0) {
            page.calendarGrid.annotations[existing] = ann;
          } else {
            page.calendarGrid.annotations.push(ann);
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      removeDayAnnotation: (pageIndex, day) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page?.calendarGrid) return;
          page.calendarGrid.annotations = page.calendarGrid.annotations.filter((a: any) => Number(a.day) !== Number(day));
          state.project.updatedAt = new Date().toISOString();
        });
      },

      clearAllDayAnnotations: (pageIndex) => {
        set((state) => {
          const page = state.project.pages[pageIndex];
          if (!page?.calendarGrid) return;
          page.calendarGrid.annotations = [];
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

      setGlobalIncludeYear: (includeYear, applyGlobally = true, pageIndex) => {
        set((state) => {
          state.project.globalSettings.includeYear = includeYear;
          if (applyGlobally) {
            state.project.pages.forEach((page) => {
              if (page.calendarGrid) {
                page.calendarGrid.includeYear = includeYear;
              }
            });
          } else if (pageIndex !== undefined && state.project.pages[pageIndex]?.calendarGrid) {
            state.project.pages[pageIndex].calendarGrid!.includeYear = includeYear;
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setGlobalShortDayNames: (shortDayNames, applyGlobally = true, pageIndex) => {
        set((state) => {
          state.project.globalSettings.shortDayNames = shortDayNames;
          const formatMode: DayNamesFormat = shortDayNames ? 'short' : 'full';
          state.project.globalSettings.dayNamesFormat = formatMode;
          if (applyGlobally) {
            state.project.pages.forEach((page) => {
              if (page.calendarGrid) {
                page.calendarGrid.shortDayNames = shortDayNames;
                page.calendarGrid.dayNamesFormat = formatMode;
              }
            });
          } else if (pageIndex !== undefined && state.project.pages[pageIndex]?.calendarGrid) {
            state.project.pages[pageIndex].calendarGrid!.shortDayNames = shortDayNames;
            state.project.pages[pageIndex].calendarGrid!.dayNamesFormat = formatMode;
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setGlobalDayNamesFormat: (format, applyGlobally = true, pageIndex) => {
        set((state) => {
          state.project.globalSettings.dayNamesFormat = format;
          state.project.globalSettings.shortDayNames = format !== 'full';
          if (applyGlobally) {
            state.project.pages.forEach((page) => {
              if (page.calendarGrid) {
                page.calendarGrid.dayNamesFormat = format;
                page.calendarGrid.shortDayNames = format !== 'full';
              }
            });
          } else if (pageIndex !== undefined && state.project.pages[pageIndex]?.calendarGrid) {
            state.project.pages[pageIndex].calendarGrid!.dayNamesFormat = format;
            state.project.pages[pageIndex].calendarGrid!.shortDayNames = format !== 'full';
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setGlobalShowGridLines: (showGridLines, applyGlobally = true, pageIndex) => {
        set((state) => {
          if (applyGlobally) {
            state.project.pages.forEach((page) => {
              if (page.calendarGrid) {
                page.calendarGrid.showGridLines = showGridLines;
              }
            });
          } else if (pageIndex !== undefined && state.project.pages[pageIndex]?.calendarGrid) {
            state.project.pages[pageIndex].calendarGrid!.showGridLines = showGridLines;
          }
          state.project.updatedAt = new Date().toISOString();
        });
      },

      applySpanishHolidays: (includeNational, provinceId, holidayColor) => {
        set((state) => {
          const year = state.project.year;
          state.project.globalSettings.includeNationalHolidays = includeNational;
          state.project.globalSettings.holidayProvince = provinceId;
          const activeHolidayColor = holidayColor ?? state.project.globalSettings.holidayColor ?? '#000000';
          state.project.globalSettings.holidayColor = activeHolidayColor;

          const allHolidays = getAllHolidaysForYear(year, includeNational, provinceId);

          state.project.pages.forEach((page) => {
            if (page.type === 'month' && page.month && page.calendarGrid) {
              const grid = page.calendarGrid;
              grid.holidayColor = activeHolidayColor;
              // 1. Remove previous automated holidays (keep custom user annotations)
              grid.annotations = grid.annotations.filter((a: any) => !a.isHoliday);

              // 2. Add calculated holidays for this month
              const monthHolidays = allHolidays.filter((h) => h.month === page.month);
              monthHolidays.forEach((h) => {
                const existingIndex = grid.annotations.findIndex((a: any) => Number(a.day) === h.day);
                const holidayAnnotation: DayAnnotation = {
                  day: h.day,
                  text: h.name.replace(/^🔴\s*/, ''),
                  color: activeHolidayColor,
                  fontSizePt: 7,
                  fontFamily: 'Inter',
                  icon: undefined,
                  isHoliday: true,
                  holidayType: h.type,
                };
                if (existingIndex >= 0) {
                  grid.annotations[existingIndex].isHoliday = true;
                  grid.annotations[existingIndex].holidayType = h.type;
                  grid.annotations[existingIndex].color = activeHolidayColor;
                  grid.annotations[existingIndex].icon = undefined;
                  grid.annotations[existingIndex].text = h.name.replace(/^🔴\s*/, '');
                } else {
                  grid.annotations.push(holidayAnnotation);
                }
              });
            }
          });
          state.project.updatedAt = new Date().toISOString();
        });
      },

      clearSpanishHolidays: () => {
        set((state) => {
          state.project.globalSettings.includeNationalHolidays = false;
          state.project.globalSettings.holidayProvince = undefined;
          state.project.pages.forEach((page) => {
            if (page.type === 'month' && page.calendarGrid) {
              page.calendarGrid.annotations = page.calendarGrid.annotations.filter((a: any) => !a.isHoliday);
            }
          });
          state.project.updatedAt = new Date().toISOString();
        });
      },

      setHolidayStyle: (style, applyGlobally = true, pageIndex) => {
        set((state) => {
          if (style.textPosition !== undefined) {
            state.project.globalSettings.holidayTextPosition = style.textPosition;
          }
          if (style.fillBackground !== undefined) {
            state.project.globalSettings.holidayFillBackground = style.fillBackground;
          }
          if (style.backgroundColor !== undefined) {
            state.project.globalSettings.holidayBackgroundColor = style.backgroundColor;
          }
          if (style.holidayColor !== undefined) {
            state.project.globalSettings.holidayColor = style.holidayColor;
          }

          if (applyGlobally) {
            state.project.pages.forEach((page) => {
              if (page.type === 'month' && page.calendarGrid) {
                if (style.textPosition !== undefined) page.calendarGrid.holidayTextPosition = style.textPosition;
                if (style.fillBackground !== undefined) page.calendarGrid.holidayFillBackground = style.fillBackground;
                if (style.backgroundColor !== undefined) page.calendarGrid.holidayBackgroundColor = style.backgroundColor;
                if (style.holidayColor !== undefined) {
                  page.calendarGrid.holidayColor = style.holidayColor;
                  page.calendarGrid.annotations.forEach((a: any) => {
                    if (a.isHoliday) a.color = style.holidayColor;
                  });
                }
              }
            });
          } else if (pageIndex !== undefined && state.project.pages[pageIndex]?.calendarGrid) {
            const grid = state.project.pages[pageIndex].calendarGrid!;
            if (style.textPosition !== undefined) grid.holidayTextPosition = style.textPosition;
            if (style.fillBackground !== undefined) grid.holidayFillBackground = style.fillBackground;
            if (style.backgroundColor !== undefined) grid.holidayBackgroundColor = style.backgroundColor;
            if (style.holidayColor !== undefined) {
              grid.holidayColor = style.holidayColor;
              grid.annotations.forEach((a: any) => {
                if (a.isHoliday) a.color = style.holidayColor;
              });
            }
          }
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
          state.editor.canvasZoom = Math.max(0.1, Math.min(4.0, zoom));
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

      setOffsetStepMm: (step) => {
        set((state) => {
          state.editor.offsetStepMm = step;
        });
      },

      setDraggedImageIds: (ids) => {
        set((state) => {
          state.editor.draggedImageIds = ids;
          if (!ids) state.editor.dragOverRegionId = null;
        });
      },

      setDragOverRegionId: (regionId) => {
        set((state) => {
          state.editor.dragOverRegionId = regionId;
        });
      },

      setSelectedDayForAnnotation: (day) => {
        set((state) => {
          state.editor.selectedDayForAnnotation = day;
        });
      },

      setActiveTab: (tab) => {
        set((state) => {
          state.editor.activeTab = tab;
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
        return page.imageRegions.find((r: any) => r.id === state.editor.selectedRegionId) ?? null;
      },
    })),
    {
      limit: 30,
      partialize: (state) => {
        // Strip heavy base64 strings from history snapshots to prevent memory leak
        const slimImages: Record<string, UploadedImage> = {};
        for (const [id, img] of Object.entries(state.project.images || {})) {
          slimImages[id] = {
            ...img,
            previewDataUrl: '',
          };
        }
        return {
          project: {
            ...state.project,
            images: slimImages,
          },
        };
      },
    }
  )
);
