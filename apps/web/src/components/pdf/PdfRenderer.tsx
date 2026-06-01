import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { CalendarProject, mmToPx } from '@calendar-creator/shared-types';
import MaskedImage from '../canvas/MaskedImage';
import CalendarGrid from '../canvas/CalendarGrid';

function toCanvasPx(mm: number, scale: number): number {
  return mmToPx(mm, 300) * scale;
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
        
        await new Promise(r => setTimeout(r, 1000));
        
        if (!mounted) return;

        // Preview: Low DPI (72) and lower quality
        const previewDataUrl = stageRef.current.toDataURL({
          pixelRatio: 1,
          mimeType: 'image/jpeg',
          quality: 0.6
        });

        // Print: High DPI (300) and high quality
        const printDataUrl = stageRef.current.toDataURL({
          pixelRatio: 300 / 72,
          mimeType: 'image/jpeg',
          quality: 0.95
        });

        const pdfWidth = paperDimensions.widthMm + bleed.leftMm + bleed.rightMm;
        const pdfHeight = paperDimensions.heightMm + bleed.topMm + bleed.bottomMm;

        if (currentPageIndex > 0) {
          pdfPreview.addPage([pdfWidth, pdfHeight], project.globalSettings.paperDimensions.orientation);
          pdfPrint.addPage([pdfWidth, pdfHeight], project.globalSettings.paperDimensions.orientation);
        }

        pdfPreview.addImage(previewDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdfPrint.addImage(printDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        onProgress(currentPageIndex + 1, project.pages.length);

        if (currentPageIndex < project.pages.length - 1) {
          setCurrentPageIndex(prev => prev + 1);
        } else {
          // Both PDFs are done. Zip them.
          const zip = new JSZip();
          zip.file(`${project.name || 'Calendario'}_Preview.pdf`, pdfPreview.output('blob'));
          zip.file(`${project.name || 'Calendario'}_Impresion_300DPI.pdf`, pdfPrint.output('blob'));
          
          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.name || 'Calendario'}_Export.zip`;
          a.click();
          URL.revokeObjectURL(url);
          
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
    <div style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden' }}>
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
