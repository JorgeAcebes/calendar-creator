import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { CalendarProject, mmToPx } from '@calendar-creator/shared-types';
import MaskedImage from '../canvas/MaskedImage';
import CalendarGrid from '../canvas/CalendarGrid';
import { imagePreviewDataCache } from '@/utils/imageCache';

function toCanvasPx(mm: number, scale: number): number {
  return mmToPx(mm, 300) * scale;
}

async function preloadAndDecodeImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch (_) {}
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

interface PdfRendererProps {
  project: CalendarProject;
  onComplete: () => void;
  onError: (err: any) => void;
  onProgress: (page: number, total: number) => void;
}

const PdfRenderer: React.FC<PdfRendererProps> = ({ project, onComplete, onError, onProgress }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const stageRef = useRef<Konva.Stage>(null);
  const isGeneratingRef = useRef(false);
  
  const canvasScale = 1;

  // Initialize PDFs
  const [pdfPreview] = useState(() => new jsPDF({
    orientation: project.globalSettings.paperDimensions.orientation,
    unit: 'mm',
    format: [
      project.globalSettings.paperDimensions.widthMm + project.globalSettings.bleed.leftMm + project.globalSettings.bleed.rightMm,
      project.globalSettings.paperDimensions.heightMm + project.globalSettings.bleed.topMm + project.globalSettings.bleed.bottomMm,
    ]
  }));

  const [pdfPrint] = useState(() => new jsPDF({
    orientation: project.globalSettings.paperDimensions.orientation,
    unit: 'mm',
    format: [
      project.globalSettings.paperDimensions.widthMm + project.globalSettings.bleed.leftMm + project.globalSettings.bleed.rightMm,
      project.globalSettings.paperDimensions.heightMm + project.globalSettings.bleed.topMm + project.globalSettings.bleed.bottomMm,
    ]
  }));

  const page = project.pages[currentPageIndex];
  const { globalSettings } = project;
  const { paperDimensions, bleed } = globalSettings;

  const dims = {
    paperW: toCanvasPx(paperDimensions.widthMm, canvasScale),
    paperH: toCanvasPx(paperDimensions.heightMm, canvasScale),
    bleedT: toCanvasPx(bleed.topMm, canvasScale),
    bleedR: toCanvasPx(bleed.rightMm, canvasScale),
    bleedB: toCanvasPx(bleed.bottomMm, canvasScale),
    bleedL: toCanvasPx(bleed.leftMm, canvasScale),
    totalW: toCanvasPx(paperDimensions.widthMm + bleed.leftMm + bleed.rightMm, canvasScale),
    totalH: toCanvasPx(paperDimensions.heightMm + bleed.topMm + bleed.bottomMm, canvasScale),
    originX: toCanvasPx(bleed.leftMm, canvasScale),
    originY: toCanvasPx(bleed.topMm, canvasScale),
  };

  useEffect(() => {
    let mounted = true;
    
    const capturePage = async () => {
      try {
        if (!stageRef.current) return;
        
        // 1. Ensure all fonts (custom web fonts/Google fonts) are fully loaded
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready;
          } catch (_) {}
        }

        // 2. Preload and decode all images required for this page
        if (page?.imageRegions && page.imageRegions.length > 0) {
          const promises: Promise<void>[] = [];
          for (const region of page.imageRegions) {
            if (region.imageFileId) {
              const imgData = project.images[region.imageFileId];
              const src =
                (imgData?.previewDataUrl && imgData.previewDataUrl.length > 0)
                  ? imgData.previewDataUrl
                  : (imagePreviewDataCache.get(region.imageFileId) ?? imgData?.storagePath);
              if (src) {
                promises.push(preloadAndDecodeImage(src));
              }
            }
          }
          await Promise.allSettled(promises);
        }

        // 3. Wait for Konva stage to finish rendering and updating layer canvas buffers
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 250);
            });
          });
        });

        if (stageRef.current) {
          stageRef.current.batchDraw();
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        
        if (!mounted || isGeneratingRef.current) return;
        if (currentPageIndex === project.pages.length - 1) {
          isGeneratingRef.current = true;
        }

        // Preview: Full 300 DPI screen preview (pixelRatio: 1.0) with crisp quality
        const previewDataUrl = stageRef.current.toDataURL({
          pixelRatio: 1.0,
          mimeType: 'image/jpeg',
          quality: 0.88
        });

        // Print: Ultra-crisp 600 DPI (pixelRatio: 2.0) with maximum photographic quality
        const printDataUrl = stageRef.current.toDataURL({
          pixelRatio: 2.0,
          mimeType: 'image/jpeg',
          quality: 0.98
        });

        const pdfWidth = paperDimensions.widthMm + bleed.leftMm + bleed.rightMm;
        const pdfHeight = paperDimensions.heightMm + bleed.topMm + bleed.bottomMm;

        if (currentPageIndex > 0) {
          pdfPreview.addPage([pdfWidth, pdfHeight], project.globalSettings.paperDimensions.orientation);
          pdfPrint.addPage([pdfWidth, pdfHeight], project.globalSettings.paperDimensions.orientation);
        }

        pdfPreview.addImage(previewDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdfPrint.addImage(printDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        onProgress(currentPageIndex + 1, project.pages.length);

        if (currentPageIndex < project.pages.length - 1) {
          setCurrentPageIndex(prev => prev + 1);
        } else {
          // Both PDFs are done. Zip them.
          const zip = new JSZip();
          zip.file(`${project.name || 'Calendario'}_Preview.pdf`, pdfPreview.output('blob'));
          zip.file(`${project.name || 'Calendario'}_Impresion_300DPI.pdf`, pdfPrint.output('blob'));
          
          const content = await zip.generateAsync({ type: 'blob' });

          if ((window as any).__TAURI_INTERNALS__) {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            
            const filePath = await save({
              filters: [{
                name: 'Archivo ZIP',
                extensions: ['zip']
              }],
              defaultPath: `${project.name || 'Calendario'}_Export.zip`
            });

            if (filePath) {
               const arrayBuffer = await content.arrayBuffer();
               await writeFile(filePath, new Uint8Array(arrayBuffer));
            }
          } else {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name || 'Calendario'}_Export.zip`;
            a.click();
            URL.revokeObjectURL(url);
          }
          
          onComplete();
        }
      } catch (err) {
        console.error("PDF Export Error:", err);
        onError(err);
      }
    };

    capturePage();

    return () => {
      mounted = false;
    };
  }, [currentPageIndex, pdfPreview, pdfPrint, project, onComplete, onError, onProgress, paperDimensions, bleed]);

  if (!page) return null;

  return (
    <div style={{ position: 'fixed', top: -10000, left: -10000, width: dims.totalW, height: dims.totalH, opacity: 0, pointerEvents: 'none', zIndex: -1000 }}>
      <Stage
        ref={stageRef}
        width={dims.totalW}
        height={dims.totalH}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={dims.totalW}
            height={dims.totalH}
            fill="#ffffff"
          />
          <Rect
            x={dims.originX}
            y={dims.originY}
            width={dims.paperW}
            height={dims.paperH}
            fill={page.backgroundColor ?? globalSettings.backgroundColor}
          />
        </Layer>

        <Layer x={dims.originX} y={dims.originY}>
          {page.imageRegions.map((region: any) => (
            <MaskedImage
              key={region.id}
              region={region}
              canvasScale={canvasScale}
              isExport={true}
            />
          ))}

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

          {page.type === 'cover' && page.coverText && (() => {
            const defaultY = page.coverText.positionPreset === 'top-center'
              ? toCanvasPx(30, canvasScale)
              : page.coverText.positionPreset === 'center'
                ? dims.paperH / 2 - toCanvasPx(20, canvasScale)
                : dims.paperH - toCanvasPx(70, canvasScale);

            const groupX = page.coverText.xMm !== undefined ? toCanvasPx(page.coverText.xMm, canvasScale) : 0;
            const groupY = page.coverText.yMm !== undefined ? toCanvasPx(page.coverText.yMm, canvasScale) : defaultY;

            const hasShadow = !!page.coverText.showShadow;

            return (
              <Group x={groupX} y={groupY}>
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
                  shadowEnabled={hasShadow}
                  shadowColor={hasShadow ? "rgba(0,0,0,0.5)" : undefined}
                  shadowBlur={hasShadow ? 4 : 0}
                  shadowOffsetY={hasShadow ? 2 : 0}
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
                    shadowEnabled={hasShadow}
                    shadowColor={hasShadow ? "rgba(0,0,0,0.3)" : undefined}
                    shadowBlur={hasShadow ? 3 : 0}
                    shadowOffsetY={hasShadow ? 1 : 0}
                  />
                )}
              </Group>
            );
          })()}
        </Layer>
      </Stage>
    </div>
  );
};

export default PdfRenderer;
