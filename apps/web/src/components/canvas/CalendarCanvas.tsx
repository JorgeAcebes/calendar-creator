// =============================================================================
// CalendarCanvas — Main Konva Stage with all layers
// =============================================================================
// Renders the currently active page with bleed guides, dropzones, images,
// calendar grid, and cover text. All in a multi-layer Konva Stage.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { mmToPx } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import MaskedImage from './MaskedImage';
import CalendarGrid from './CalendarGrid';
import { showToast } from '@/components/layout/Toast';

function toCanvasPx(mm: number, scale: number): number {
  return mmToPx(mm, 300) * scale;
}

const CalendarCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const project = useCalendarStore((s) => s.project);
  const editor = useCalendarStore((s) => s.editor);
  const selectRegion = useCalendarStore((s) => s.selectRegion);
  const dragOverRegionId = useCalendarStore((s) => s.editor.dragOverRegionId);

  const { globalSettings } = project;
  const { paperDimensions, bleed } = globalSettings;
  const page = project.pages[editor.activePageIndex];
  const canvasScale = editor.canvasZoom;

  const [snapGuides, setSnapGuides] = useState<{ x?: number, y?: number }>({});

  // Calculate dimensions
  const dims = useMemo(() => {
    const paperW = toCanvasPx(paperDimensions.widthMm, canvasScale);
    const paperH = toCanvasPx(paperDimensions.heightMm, canvasScale);
    const bleedT = toCanvasPx(bleed.topMm, canvasScale);
    const bleedR = toCanvasPx(bleed.rightMm, canvasScale);
    const bleedB = toCanvasPx(bleed.bottomMm, canvasScale);
    const bleedL = toCanvasPx(bleed.leftMm, canvasScale);

    return {
      paperW,
      paperH,
      bleedT,
      bleedR,
      bleedB,
      bleedL,
      totalW: paperW + bleedL + bleedR,
      totalH: paperH + bleedT + bleedB,
      // Content origin (inside bleed)
      originX: bleedL,
      originY: bleedT,
    };
  }, [paperDimensions, bleed, canvasScale]);

  const assignImage = useCalendarStore((s) => s.assignImageToRegion);
  const setDragOverRegionId = useCalendarStore((s) => s.setDragOverRegionId);
  const draggedImageIds = useCalendarStore((s) => s.editor.draggedImageIds);
  const lastDistRef = useRef<number>(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ---- Synchronous drag activation via document-level listeners ----
  // We need the overlay enabled BEFORE React re-renders. The Zustand store
  // update from PhotoPanel.handleDragStart is async, so `isDraggingFromGallery`
  // is still false when the first dragenter fires on the canvas. We solve
  // this by:
  //   1) Detecting drag activity at the document level (synchronous callback)
  //   2) Directly mutating the overlay DOM element's style.pointerEvents
  //   3) Tracking with a ref so React's render path stays consistent
  const htmlDragActiveRef = useRef(false);
  const [htmlDragActive, setHtmlDragActive] = useState(false);

  const enableOverlay = useCallback(() => {
    if (!htmlDragActiveRef.current) {
      htmlDragActiveRef.current = true;
      setHtmlDragActive(true);
      // Directly mutate the overlay element for immediate effect
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = 'all';
        overlayRef.current.style.zIndex = '10';
      }
    }
  }, []);

  const disableOverlay = useCallback(() => {
    if (htmlDragActiveRef.current) {
      htmlDragActiveRef.current = false;
      setHtmlDragActive(false);
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = 'none';
        overlayRef.current.style.zIndex = '-1';
      }
      setDragOverRegionId(null);
    }
  }, [setDragOverRegionId]);

  useEffect(() => {
    // Detect ANY drag entering the document — if it carries our marker data,
    // enable the overlay immediately.
    const onDocDragEnter = (e: DragEvent) => {
      // Check if this drag comes from our gallery (has our data types)
      if (e.dataTransfer?.types.includes('text/plain') ||
          e.dataTransfer?.types.includes('application/json')) {
        enableOverlay();
      }
    };

    const onDocDragEnd = () => {
      disableOverlay();
    };

    const onDocDrop = () => {
      // The overlay's own onDrop handles assignment;
      // this document-level handler just cleans up if the drop lands outside.
      // Use a tiny delay to let the overlay's handler fire first.
      setTimeout(() => disableOverlay(), 50);
    };

    document.addEventListener('dragenter', onDocDragEnter, true);
    document.addEventListener('dragend', onDocDragEnd, true);
    document.addEventListener('drop', onDocDrop, true);

    return () => {
      document.removeEventListener('dragenter', onDocDragEnter, true);
      document.removeEventListener('dragend', onDocDragEnd, true);
      document.removeEventListener('drop', onDocDrop, true);
    };
  }, [enableOverlay, disableOverlay]);

  // Safe area (5mm from trim on each side)
  const safeMargin = toCanvasPx(5, canvasScale);

  if (!page) return null;

  const setCanvasZoom = useCalendarStore((s) => s.setCanvasZoom);

  const handleWheel = (e: any) => {
    // Zoom on any wheel event (mouse wheel or touchpad scroll/pinch)
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    // Get the wrapper container which is being scrolled (usually the parent with overflow: auto)
    const scrollContainer = stage.container().closest('.editor-layout__canvas');
    if (!scrollContainer) return;
    
    // Position of cursor relative to the viewport/scroll container
    const rect = scrollContainer.getBoundingClientRect();
    const pointerX = e.evt.clientX - rect.left;
    const pointerY = e.evt.clientY - rect.top;
    
    // Point on the canvas that is under the cursor
    const scrollLeft = scrollContainer.scrollLeft;
    const scrollTop = scrollContainer.scrollTop;
    
    const canvasPointX = (pointerX + scrollLeft) / canvasScale;
    const canvasPointY = (pointerY + scrollTop) / canvasScale;

    // Calculate new scale
    const scaleBy = Math.exp(e.evt.deltaY * -0.002);
    const oldScale = canvasScale;
    const newScale = Math.max(0.2, Math.min(oldScale * scaleBy, 4));
    
    setCanvasZoom(newScale);

    // After state updates and re-render, we need to adjust scroll position
    // Since setCanvasZoom is async, we use a timeout to let the DOM update the canvas size
    requestAnimationFrame(() => {
      if (scrollContainer) {
        scrollContainer.scrollLeft = (canvasPointX * newScale) - pointerX;
        scrollContainer.scrollTop = (canvasPointY * newScale) - pointerY;
      }
    });
  };

  const handleTouchMove = (e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      if (!lastDistRef.current) { 
        lastDistRef.current = dist; 
        return; 
      }
      
      const scaleBy = dist / lastDistRef.current;
      lastDistRef.current = dist;
      
      const oldScale = canvasScale;
      const newScale = oldScale * scaleBy;
      setCanvasZoom(Math.max(0.2, Math.min(newScale, 4)));
    }
  };

  const handleTouchEnd = () => {
    lastDistRef.current = 0;
  };

  // ---- Drag-and-drop helpers ----

  /** Given a mouse event relative to the overlay/wrapper, find which region is under the cursor */
  const findRegionAtPos = (clientX: number, clientY: number): string | null => {
    const el = overlayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const posX = clientX - rect.left;
    const posY = clientY - rect.top;

    for (const r of page.imageRegions as any[]) {
      const rx = dims.originX + toCanvasPx(r.mask.xMm, canvasScale);
      const ry = dims.originY + toCanvasPx(r.mask.yMm, canvasScale);
      const rw = toCanvasPx(r.mask.widthMm, canvasScale);
      const rh = toCanvasPx(r.mask.heightMm, canvasScale);
      if (posX >= rx && posX <= rx + rw && posY >= ry && posY <= ry + rh) {
        return r.id;
      }
    }
    return null;
  };

  const handleOverlayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    const hoveredId = findRegionAtPos(e.clientX, e.clientY);
    const current = useCalendarStore.getState().editor.dragOverRegionId;
    if (hoveredId !== current) {
      setDragOverRegionId(hoveredId);
    }
  };

  const handleOverlayDragLeave = (e: React.DragEvent) => {
    // Only clear if truly leaving the overlay (not entering a child)
    if (e.currentTarget === e.target) {
      setDragOverRegionId(null);
    }
  };

  const handleOverlayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const payloadText = e.dataTransfer.getData('text/plain');
      const payloadJson = e.dataTransfer.getData('application/json');

      let imageIds = useCalendarStore.getState().editor.draggedImageIds || [];

      if (imageIds.length === 0) {
        if (payloadJson) {
          try { imageIds = JSON.parse(payloadJson); } catch (_) {}
        } else if (payloadText && payloadText !== 'gallery-image') {
          imageIds = payloadText.split(',');
        }
      }

      if (imageIds.length === 0) return;

      const regionId = findRegionAtPos(e.clientX, e.clientY);
      if (!regionId) return;

      const currentPageIndex = useCalendarStore.getState().editor.activePageIndex;
      const currentPage = useCalendarStore.getState().project.pages[currentPageIndex];
      if (!currentPage) return;

      const droppedRegionIndex = currentPage.imageRegions.findIndex((r: any) => r.id === regionId);
      if (droppedRegionIndex < 0) return;

      // Check for duplicate usage and warn via toast
      const warnOnDuplicate = useCalendarStore.getState().project.globalSettings.warnOnDuplicatePhotos !== false;
      if (warnOnDuplicate) {
        const allPages = useCalendarStore.getState().project.pages;
        for (const imgId of imageIds) {
          const usedPages: string[] = [];
          for (const p of allPages) {
            if (p.imageRegions.some((r: any) => r.imageFileId === imgId)) {
              usedPages.push(p.type === 'cover' ? 'Portada' : (p.month ? `Mes ${p.month}` : `Página ${p.index}`));
            }
          }
          if (usedPages.length > 0) {
            showToast({
              type: 'warning',
              message: `Esta foto ya está en uso en: ${usedPages.join(', ')}. Se ha asignado de todos modos.`,
              duration: 5000,
            });
          }
        }
      }

      // Assign the first image to the target region
      assignImage(currentPageIndex, currentPage.imageRegions[droppedRegionIndex].id, imageIds[0]);
      selectRegion(currentPage.imageRegions[droppedRegionIndex].id);

      // Distribute remaining images to other regions
      let remainingIds = imageIds.slice(1);
      if (remainingIds.length > 0) {
        const emptyRegions = currentPage.imageRegions.filter(
          (r: any, idx: number) => idx !== droppedRegionIndex && !r.imageFileId,
        );
        for (let i = 0; i < Math.min(remainingIds.length, emptyRegions.length); i++) {
          assignImage(currentPageIndex, emptyRegions[i].id, remainingIds[i]);
        }
        remainingIds = remainingIds.slice(emptyRegions.length);

        if (remainingIds.length > 0) {
          const filledRegions = currentPage.imageRegions.filter(
            (r: any, idx: number) => idx !== droppedRegionIndex && !!r.imageFileId,
          );
          for (let i = 0; i < Math.min(remainingIds.length, filledRegions.length); i++) {
            assignImage(currentPageIndex, filledRegions[i].id, remainingIds[i]);
          }
        }
      }
    } catch (err) {
      console.error('Drop error', err);
    } finally {
      setDragOverRegionId(null);
      // Clean up dragged image IDs from store
      useCalendarStore.getState().setDraggedImageIds(null);
      disableOverlay();
    }
  };

  // Whether a gallery drag is currently in progress — combine both the
  // synchronous ref-based flag and the async Zustand state for robustness.
  const isDraggingFromGallery = htmlDragActive || (!!draggedImageIds && draggedImageIds.length > 0);

  return (
    <div
      className="canvas-wrapper"
      style={{ position: 'relative' }}
    >
      <Stage
        ref={stageRef}
        width={dims.totalW}
        height={dims.totalH}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={(e) => {
          // Deselect when clicking on empty canvas area
          if (e.target === stageRef.current) {
            selectRegion(null);
          }
        }}
      >
        {/* Layer 1: Background */}
        <Layer>
          {/* Bleed area background (slightly different shade) */}
          <Rect
            x={0}
            y={0}
            width={dims.totalW}
            height={dims.totalH}
            fill="#e8e8e8"
          />

          {/* Page area (white paper) */}
          <Rect
            x={dims.originX}
            y={dims.originY}
            width={dims.paperW}
            height={dims.paperH}
            fill={page.backgroundColor ?? globalSettings.backgroundColor}
            shadowColor="rgba(0,0,0,0.15)"
            shadowBlur={10}
            shadowOffsetY={2}
          />
        </Layer>

        {/* Layer 2: Content (images + calendar grid) */}
        <Layer x={dims.originX} y={dims.originY}>
          {/* Image regions */}
          {page.imageRegions.map((region: any) => (
            <MaskedImage
              key={region.id}
              region={region}
              canvasScale={canvasScale}
            />
          ))}

          {/* Calendar grid (month pages only) */}
          {page.calendarGrid && page.month && (
            <CalendarGrid
              config={page.calendarGrid}
              month={page.month}
              year={page.year}
              locale={project.locale}
              typography={globalSettings.defaultTypography}
              canvasScale={canvasScale}
            />
          )}

          {/* Cover text */}
          {page.type === 'cover' && page.coverText && (() => {
            const defaultY = page.coverText.positionPreset === 'top-center'
              ? toCanvasPx(30, canvasScale)
              : page.coverText.positionPreset === 'center'
                ? dims.paperH / 2 - toCanvasPx(20, canvasScale)
                : dims.paperH - toCanvasPx(70, canvasScale);

            const groupX = page.coverText.xMm !== undefined ? toCanvasPx(page.coverText.xMm, canvasScale) : 0;
            const groupY = page.coverText.yMm !== undefined ? toCanvasPx(page.coverText.yMm, canvasScale) : defaultY;

            return (
            <Group
              draggable
              x={groupX}
              y={groupY}
              onDragMove={(e) => {
                const node = e.target;
                let newX = node.x();
                let newY = node.y();
                let snapX = undefined;
                let snapY = undefined;
                
                // Snap X (0 means perfectly centered since group is full width)
                if (Math.abs(newX) < 15) {
                  newX = 0;
                  snapX = dims.originX + dims.paperW / 2;
                }
                
                // Snap Y (center of page)
                const defaultCenterY = dims.paperH / 2 - toCanvasPx(20, canvasScale);
                if (Math.abs(newY - defaultCenterY) < 15) {
                  newY = defaultCenterY;
                  snapY = dims.originY + dims.paperH / 2;
                }
                
                node.x(newX);
                node.y(newY);
                setSnapGuides({ x: snapX, y: snapY });
              }}
              onDragEnd={(e) => {
                setSnapGuides({});
                const setCoverText = useCalendarStore.getState().setCoverText;
                setCoverText({
                  xMm: e.target.x() / (300 / 25.4 * canvasScale),
                  yMm: e.target.y() / (300 / 25.4 * canvasScale),
                });
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'move';
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
              }}
            >
              <Text
                x={0}
                y={0}
                width={dims.paperW}
                text={page.coverText.title}
                fontFamily={page.coverText.fontFamily}
                fontSize={page.coverText.fontSizePt * canvasScale * 3.5}
                fontStyle="bold"
                fill={page.coverText.color}
                align="center"
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={4}
                shadowOffsetY={2}
              />
              {page.coverText.subtitle && (
                <Text
                  x={0}
                  y={page.coverText.fontSizePt * canvasScale * 4}
                  width={dims.paperW}
                  text={page.coverText.subtitle}
                  fontFamily={page.coverText.fontFamily}
                  fontSize={page.coverText.fontSizePt * canvasScale * 2}
                  fill={page.coverText.color}
                  align="center"
                  opacity={0.85}
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={3}
                  shadowOffsetY={1}
                />
              )}
            </Group>
            );
          })()}
        </Layer>

        {/* Layer 3: Guides (editor only — not in PDF) */}
        <Layer listening={false}>
          {/* Bleed guides (red dashed lines at trim edges) */}
          {editor.showBleedGuides && (
            <Group>
              {/* Top trim line */}
              <Line
                points={[0, dims.originY, dims.totalW, dims.originY]}
                stroke="rgba(255, 71, 87, 0.5)"
                strokeWidth={1}
                dash={[6, 3]}
              />
              {/* Bottom trim line */}
              <Line
                points={[0, dims.originY + dims.paperH, dims.totalW, dims.originY + dims.paperH]}
                stroke="rgba(255, 71, 87, 0.5)"
                strokeWidth={1}
                dash={[6, 3]}
              />
              {/* Left trim line */}
              <Line
                points={[dims.originX, 0, dims.originX, dims.totalH]}
                stroke="rgba(255, 71, 87, 0.5)"
                strokeWidth={1}
                dash={[6, 3]}
              />
              {/* Right trim line */}
              <Line
                points={[dims.originX + dims.paperW, 0, dims.originX + dims.paperW, dims.totalH]}
                stroke="rgba(255, 71, 87, 0.5)"
                strokeWidth={1}
                dash={[6, 3]}
              />
            </Group>
          )}

          {/* Safe area guides (orange dashed, 5mm inside trim) */}
          {editor.showSafeGuides && (
            <>
              <Rect
                x={dims.originX + safeMargin}
                y={dims.originY + safeMargin}
                width={dims.paperW - safeMargin * 2}
                height={dims.paperH - safeMargin * 2}
                stroke="rgba(255, 165, 2, 0.35)"
                strokeWidth={1}
                dash={[4, 4]}
              />
              {/* Ring binder / spiral area (gray translucent) */}
              {(globalSettings.bindingMarginMm || 0) > 0 && (
                <Rect
                  x={dims.originX}
                  y={dims.originY}
                  width={dims.paperW}
                  height={toCanvasPx(globalSettings.bindingMarginMm || 0, canvasScale)}
                  fill="rgba(0,0,0,0.15)"
                />
              )}
            </>
          )}

          {/* Magnetic Snap Guides (magenta) */}
          {snapGuides.x !== undefined && (
            <Line
              points={[snapGuides.x, 0, snapGuides.x, dims.totalH]}
              stroke="#ff00ff"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
          {snapGuides.y !== undefined && (
            <Line
              points={[0, snapGuides.y, dims.totalW, snapGuides.y]}
              stroke="#ff00ff"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
        </Layer>
      </Stage>

      {/* HTML overlay for drag-and-drop — sits on top of the Konva canvas.
          Starts with pointer-events:none; the document-level dragenter listener
          enables it synchronously via direct DOM mutation before React re-renders.
          The `style` below is the React-managed fallback; the ref-based direct
          mutation in enableOverlay/disableOverlay takes precedence. */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dims.totalW,
          height: dims.totalH,
          pointerEvents: isDraggingFromGallery ? 'all' : 'none',
          zIndex: isDraggingFromGallery ? 10 : -1,
        }}
        onDragOver={handleOverlayDragOver}
        onDragEnter={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          // Also enable overlay here as a secondary guard
          enableOverlay();
        }}
        onDragLeave={handleOverlayDragLeave}
        onDrop={handleOverlayDrop}
      >
        {/* Render drop-target highlight rectangles for each image region */}
        {isDraggingFromGallery && page.imageRegions.map((r: any) => {
          const rx = dims.originX + toCanvasPx(r.mask.xMm, canvasScale);
          const ry = dims.originY + toCanvasPx(r.mask.yMm, canvasScale);
          const rw = toCanvasPx(r.mask.widthMm, canvasScale);
          const rh = toCanvasPx(r.mask.heightMm, canvasScale);
          const isHovered = dragOverRegionId === r.id;
          return (
            <div
              key={r.id}
              style={{
                position: 'absolute',
                left: rx,
                top: ry,
                width: rw,
                height: rh,
                border: isHovered ? '3px solid #0a84ff' : '2px dashed rgba(10, 132, 255, 0.4)',
                background: isHovered ? 'rgba(10, 132, 255, 0.18)' : 'transparent',
                borderRadius: 4,
                transition: 'background 0.15s, border 0.15s',
                pointerEvents: 'none', // Let events pass to parent overlay
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarCanvas;
