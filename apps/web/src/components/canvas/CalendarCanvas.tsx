// =============================================================================
// CalendarCanvas — Main Konva Stage with all layers
// =============================================================================
// Renders the currently active page with bleed guides, dropzones, images,
// calendar grid, and cover text. All in a multi-layer Konva Stage.
// =============================================================================

import React, { useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { mmToPx } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import MaskedImage from './MaskedImage';
import CalendarGrid from './CalendarGrid';

function toCanvasPx(mm: number, scale: number): number {
  return mmToPx(mm, 300) * scale;
}

const CalendarCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const project = useCalendarStore((s) => s.project);
  const editor = useCalendarStore((s) => s.editor);
  const selectRegion = useCalendarStore((s) => s.selectRegion);

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

  const setCanvasZoom = useCalendarStore((s) => s.setCanvasZoom);
  const assignImage = useCalendarStore((s) => s.assignImageToRegion);

  // Safe area (5mm from trim on each side)
  const safeMargin = toCanvasPx(5, canvasScale);

  if (!page) return null;

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = Math.exp(e.evt.deltaY * -0.01);
    const oldScale = canvasScale;
    const newScale = oldScale * scaleBy;
    setCanvasZoom(Math.max(0.2, Math.min(newScale, 4)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;
    
    try {
      const payload = e.dataTransfer.getData('text/plain');
      if (!payload) return;
      const data = JSON.parse(payload);
      if (data.type !== 'gallery-image') return;
      
      stageRef.current.setPointersPositions(e.nativeEvent);
      const pos = stageRef.current.getPointerPosition();
      if (!pos) return;

      // Find region
      const droppedRegion = page.imageRegions.find((r: any) => {
        const x = dims.originX + toCanvasPx(r.mask.xMm, canvasScale);
        const y = dims.originY + toCanvasPx(r.mask.yMm, canvasScale);
        const w = toCanvasPx(r.mask.widthMm, canvasScale);
        const h = toCanvasPx(r.mask.heightMm, canvasScale);
        return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
      });

      if (droppedRegion) {
        // Check if image is already used
        const usedIn = project.pages.some((p: any) => p.imageRegions.some((r: any) => r.imageFileId === data.id));
        if (usedIn && project.globalSettings.warnOnDuplicatePhotos !== false) {
          alert('Aviso: Esta foto ya está siendo utilizada en otra página del calendario.');
        }

        assignImage(page.index, droppedRegion.id, data.id);
        selectRegion(droppedRegion.id);
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <div 
      className="canvas-wrapper"
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDragEnter={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={dims.totalW}
        height={dims.totalH}
        onWheel={handleWheel}
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
    </div>
  );
};

export default CalendarCanvas;
