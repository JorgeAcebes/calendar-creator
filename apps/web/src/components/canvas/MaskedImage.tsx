// =============================================================================
// MaskedImage — Image rendered inside a clipping mask (NO free movement)
// =============================================================================
// This component renders a photo inside a Group with clipFunc.
// The image is NEVER draggable. All repositioning is via the OffsetControls
// panel which modifies the store's transform.offsetXMm / offsetYMm values.
// Clicking on a placed image selects it. A delete button appears on selection.
// =============================================================================

import React from 'react';
import { Group, Image as KonvaImage, Rect, Circle, Path } from 'react-konva';
import type { ImageRegion } from '@calendar-creator/shared-types';
import { computeImagePlacement, mmToPx } from '@calendar-creator/shared-types';
import { useImageLoader } from '@/hooks/useImageLoader';
import { useCalendarStore } from '@/store/calendarStore';

interface MaskedImageProps {
  /** The image region data from the store */
  region: ImageRegion;
  /** Scale factor from mm to canvas pixels */
  canvasScale: number;
}

/**
 * Converts mm to canvas px using scale factor.
 */
function toCanvasPx(mm: number, scale: number): number {
  return mmToPx(mm, 300) * scale;
}

const MaskedImage: React.FC<MaskedImageProps> = ({ region, canvasScale }) => {
  const selectRegion = useCalendarStore((s) => s.selectRegion);
  const selectedRegionId = useCalendarStore((s) => s.editor.selectedRegionId);
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const clearImage = useCalendarStore((s) => s.clearImageFromRegion);
  const images = useCalendarStore((s) => s.project.images);
  const paper = useCalendarStore((s) => s.project.globalSettings.paperDimensions);
  const isSelected = selectedRegionId === region.id;

  // Get the image data
  const imageData = region.imageFileId ? images[region.imageFileId] : null;
  const imageSrc = imageData?.previewDataUrl ?? imageData?.storagePath ?? null;
  const loadedImage = useImageLoader(imageSrc);

  // Calculate effective mask if clipped to safe area
  let effectiveMaskX = region.mask.xMm;
  let effectiveMaskY = region.mask.yMm;
  let effectiveMaskW = region.mask.widthMm;
  let effectiveMaskH = region.mask.heightMm;

  if (region.clipToSafeArea) {
    const safeMarginMm = 5;
    const safeX = safeMarginMm;
    const safeY = safeMarginMm;
    const safeW = paper.widthMm - safeMarginMm * 2;
    const safeH = paper.heightMm - safeMarginMm * 2;

    const left = Math.max(effectiveMaskX, safeX);
    const right = Math.min(effectiveMaskX + effectiveMaskW, safeX + safeW);
    const top = Math.max(effectiveMaskY, safeY);
    const bottom = Math.min(effectiveMaskY + effectiveMaskH, safeY + safeH);

    effectiveMaskX = left;
    effectiveMaskY = top;
    effectiveMaskW = Math.max(0, right - left);
    effectiveMaskH = Math.max(0, bottom - top);
  }

  // Mask dimensions in canvas pixels
  const maskX = toCanvasPx(effectiveMaskX, canvasScale);
  const maskY = toCanvasPx(effectiveMaskY, canvasScale);
  const maskW = toCanvasPx(effectiveMaskW, canvasScale);
  const maskH = toCanvasPx(effectiveMaskH, canvasScale);

  // Original mask for dropzone indicator (so we see where it drops)
  const origMaskX = toCanvasPx(region.mask.xMm, canvasScale);
  const origMaskY = toCanvasPx(region.mask.yMm, canvasScale);
  const origMaskW = toCanvasPx(region.mask.widthMm, canvasScale);
  const origMaskH = toCanvasPx(region.mask.heightMm, canvasScale);

  // Handle click to select this region
  const handleClick = () => {
    selectRegion(region.id);
  };

  // If no image assigned, render empty dropzone indicator
  if (!loadedImage || !imageData) {
    return (
      <Group onClick={handleClick} onTap={handleClick}>
        {/* Empty dropzone background */}
        <Rect
          x={origMaskX}
          y={origMaskY}
          width={origMaskW}
          height={origMaskH}
          fill={isSelected ? 'rgba(10, 132, 255, 0.15)' : 'rgba(10, 132, 255, 0.06)'}
          stroke={isSelected ? '#0a84ff' : 'rgba(10, 132, 255, 0.3)'}
          strokeWidth={isSelected ? 2 : 1}
          dash={[8, 4]}
          cornerRadius={region.mask.shape === 'rounded-rectangle' ? toCanvasPx(region.mask.borderRadiusMm, canvasScale) : 0}
        />
      </Group>
    );
  }

  // Compute placement using the shared algorithm
  const placement = computeImagePlacement(
    imageData.widthPx,
    imageData.heightPx,
    region.mask,
    region.transform,
  );

  // Convert placement to canvas pixels
  const imgX = toCanvasPx(placement.imgXMm, canvasScale);
  const imgY = toCanvasPx(placement.imgYMm, canvasScale);
  const imgW = toCanvasPx(placement.imgWidthMm, canvasScale);
  const imgH = toCanvasPx(placement.imgHeightMm, canvasScale);

  // Delete button dimensions
  const btnRadius = Math.max(10, 14 * canvasScale);
  const btnX = maskX + maskW - btnRadius - 4 * canvasScale;
  const btnY = maskY + btnRadius + 4 * canvasScale;

  return (
    <>
      {/* Clipped image group */}
      <Group
        clipFunc={(ctx) => {
          if (region.mask.shape === 'rounded-rectangle' && region.mask.borderRadiusMm > 0) {
            const r = toCanvasPx(region.mask.borderRadiusMm, canvasScale);
            ctx.beginPath();
            ctx.moveTo(maskX + r, maskY);
            ctx.lineTo(maskX + maskW - r, maskY);
            ctx.arcTo(maskX + maskW, maskY, maskX + maskW, maskY + r, r);
            ctx.lineTo(maskX + maskW, maskY + maskH - r);
            ctx.arcTo(maskX + maskW, maskY + maskH, maskX + maskW - r, maskY + maskH, r);
            ctx.lineTo(maskX + r, maskY + maskH);
            ctx.arcTo(maskX, maskY + maskH, maskX, maskY + maskH - r, r);
            ctx.lineTo(maskX, maskY + r);
            ctx.arcTo(maskX, maskY, maskX + r, maskY, r);
            ctx.closePath();
          } else {
            ctx.rect(maskX, maskY, maskW, maskH);
          }
        }}
        onClick={handleClick}
        onTap={handleClick}
        draggable={true}
        onDragStart={(e) => {
          selectRegion(region.id);
          e.target.moveToTop();
        }}
        onDragMove={() => {
          // Keep visually dragging
        }}
        onDragEnd={(e) => {
          const stage = e.target.getStage();
          const pos = stage?.getPointerPosition();
          
          // Reset visually to original spot immediately
          e.target.x(0);
          e.target.y(0);
          
          if (!pos) return;
          
          const state = useCalendarStore.getState();
          const page = state.project.pages[activePageIndex];
          const bleed = state.project.globalSettings.bleed;
          
          const originX = mmToPx(bleed.leftMm, 300) * canvasScale;
          const originY = mmToPx(bleed.topMm, 300) * canvasScale;
          
          // Find if dropped on another region
          const droppedRegion = page.imageRegions.find(r => {
            if (r.id === region.id) return false; // don't swap with self
            const x = originX + mmToPx(r.mask.xMm, 300) * canvasScale;
            const y = originY + mmToPx(r.mask.yMm, 300) * canvasScale;
            const w = mmToPx(r.mask.widthMm, 300) * canvasScale;
            const h = mmToPx(r.mask.heightMm, 300) * canvasScale;
            return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
          });
          
          if (droppedRegion) {
            state.swapImagesBetweenRegions(activePageIndex, region.id, droppedRegion.id);
            selectRegion(droppedRegion.id);
          }
        }}
      >
        {/* The actual photo — NEVER draggable, but LISTENING for clicks */}
        <KonvaImage
          image={loadedImage}
          x={imgX}
          y={imgY}
          width={imgW}
          height={imgH}
          draggable={false}
          listening={true}
        />

        {/* Hover overlay — clickable area matching the full mask */}
        <Rect
          x={maskX}
          y={maskY}
          width={maskW}
          height={maskH}
          fill="transparent"
          stroke={isSelected ? '#0a84ff' : 'transparent'}
          strokeWidth={isSelected ? 2.5 : 0}
          hitStrokeWidth={20}
          cornerRadius={region.mask.shape === 'rounded-rectangle' ? toCanvasPx(region.mask.borderRadiusMm, canvasScale) : 0}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        />
      </Group>

      {/* Delete button — rendered OUTSIDE the clip group so it's always visible */}
      {isSelected && (
        <Group
          onClick={(e) => {
            e.cancelBubble = true;
            clearImage(activePageIndex, region.id);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            clearImage(activePageIndex, region.id);
          }}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        >
          <Circle
            x={btnX}
            y={btnY}
            radius={btnRadius}
            fill="rgba(255, 69, 58, 0.9)"
            shadowColor="rgba(0,0,0,0.4)"
            shadowBlur={4}
            shadowOffsetY={1}
          />
          {/* Trash icon (Lucide Trash2 standard SVG path) */}
          <Path
            x={btnX - btnRadius * 0.55}
            y={btnY - btnRadius * 0.55}
            data="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"
            stroke="#ffffff"
            strokeWidth={2}
            scale={{ x: (btnRadius * 1.1) / 24, y: (btnRadius * 1.1) / 24 }}
            strokeLinecap="round"
            strokeLinejoin="round"
            listening={false}
          />
        </Group>
      )}
    </>
  );
};

export default React.memo(MaskedImage);
