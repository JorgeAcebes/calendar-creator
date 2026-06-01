// =============================================================================
// PDF Composer Service — Generates print-ready PDFs using PDFKit
// =============================================================================
// This service translates the CalendarProject state into a vector PDF.
// It uses the SAME computeImagePlacement() function as the frontend canvas
// to guarantee pixel-perfect edge-to-edge correspondence.
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import {
  CalendarProject,
  Page,
  mmToPt,
  computeImagePlacement,
} from '@calendar-creator/shared-types';

@Injectable()
export class PdfComposerService {
  private readonly logger = new Logger(PdfComposerService.name);

  /**
   * Compose a complete calendar PDF from the project state.
   * Returns a Buffer containing the raw PDF.
   */
  async compose(project: CalendarProject, uploadDir: string): Promise<Buffer> {
    const { bleed, paperDimensions } = project.globalSettings;

    // Total page size including bleed (in PDF points)
    const pageWidthPt = mmToPt(paperDimensions.widthMm + bleed.leftMm + bleed.rightMm);
    const pageHeightPt = mmToPt(paperDimensions.heightMm + bleed.topMm + bleed.bottomMm);

    const doc = new PDFDocument({
      size: [pageWidthPt, pageHeightPt],
      margin: 0,
      autoFirstPage: false,
      info: {
        Title: project.name,
        Author: 'Calendar Creator',
        Subject: `Calendario ${project.year}`,
        Creator: 'Calendar Creator App',
      },
    });

    // Collect buffer chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const bleedOffsetX = mmToPt(bleed.leftMm);
    const bleedOffsetY = mmToPt(bleed.topMm);

    for (const page of project.pages) {
      doc.addPage({ size: [pageWidthPt, pageHeightPt], margin: 0 });

      // Background color
      const bgColor = page.backgroundColor ?? project.globalSettings.backgroundColor;
      doc.rect(0, 0, pageWidthPt, pageHeightPt).fill(bgColor);

      // Render images
      for (const region of page.imageRegions) {
        if (!region.imageFileId) continue;

        const imageData = project.images[region.imageFileId];
        if (!imageData) continue;

        const imagePath = path.join(uploadDir, path.basename(imageData.storagePath));
        if (!fs.existsSync(imagePath)) {
          this.logger.warn(`Image not found: ${imagePath}`);
          continue;
        }

        // Use the SAME shared function as the frontend
        const placement = computeImagePlacement(
          imageData.widthPx,
          imageData.heightPx,
          region.mask,
          region.transform,
        );

        // Convert to PDF points and add bleed offset
        const clipX = bleedOffsetX + mmToPt(region.mask.xMm);
        const clipY = bleedOffsetY + mmToPt(region.mask.yMm);
        const clipW = mmToPt(region.mask.widthMm);
        const clipH = mmToPt(region.mask.heightMm);

        const imgX = bleedOffsetX + mmToPt(placement.imgXMm);
        const imgY = bleedOffsetY + mmToPt(placement.imgYMm);
        const imgW = mmToPt(placement.imgWidthMm);
        const imgH = mmToPt(placement.imgHeightMm);

        // Clip and draw
        doc.save();
        doc.rect(clipX, clipY, clipW, clipH).clip();
        doc.image(imagePath, imgX, imgY, { width: imgW, height: imgH });
        doc.restore();
      }

      // Render calendar grid (for month pages)
      if (page.calendarGrid && page.month) {
        this.renderCalendarGrid(doc, page, project, bleedOffsetX, bleedOffsetY);
      }

      // Render cover text
      if (page.type === 'cover' && page.coverText) {
        this.renderCoverText(doc, page, project, bleedOffsetX, bleedOffsetY);
      }

      // Crop marks
      this.drawCropMarks(doc, bleed, paperDimensions);
    }

    // Finalize
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Draw crop marks at the four corners of the trim area.
   */
  private drawCropMarks(
    doc: PDFKit.PDFDocument,
    bleed: CalendarProject['globalSettings']['bleed'],
    paper: CalendarProject['globalSettings']['paperDimensions'],
  ): void {
    const markLen = mmToPt(5);
    const markGap = mmToPt(1);

    doc.save();
    doc.strokeColor([0, 0, 0, 100] as unknown as string); // CMYK black
    doc.lineWidth(0.25);

    const trimX = mmToPt(bleed.leftMm);
    const trimY = mmToPt(bleed.topMm);
    const trimW = mmToPt(paper.widthMm);
    const trimH = mmToPt(paper.heightMm);

    // Top-left
    doc.moveTo(trimX - markGap - markLen, trimY).lineTo(trimX - markGap, trimY).stroke();
    doc.moveTo(trimX, trimY - markGap - markLen).lineTo(trimX, trimY - markGap).stroke();

    // Top-right
    doc.moveTo(trimX + trimW + markGap, trimY).lineTo(trimX + trimW + markGap + markLen, trimY).stroke();
    doc.moveTo(trimX + trimW, trimY - markGap - markLen).lineTo(trimX + trimW, trimY - markGap).stroke();

    // Bottom-left
    doc.moveTo(trimX - markGap - markLen, trimY + trimH).lineTo(trimX - markGap, trimY + trimH).stroke();
    doc.moveTo(trimX, trimY + trimH + markGap).lineTo(trimX, trimY + trimH + markGap + markLen).stroke();

    // Bottom-right
    doc.moveTo(trimX + trimW + markGap, trimY + trimH).lineTo(trimX + trimW + markGap + markLen, trimY + trimH).stroke();
    doc.moveTo(trimX + trimW, trimY + trimH + markGap).lineTo(trimX + trimW, trimY + trimH + markGap + markLen).stroke();

    doc.restore();
  }

  /**
   * Render the calendar grid on a month page.
   */
  private renderCalendarGrid(
    doc: PDFKit.PDFDocument,
    page: Page,
    project: CalendarProject,
    ox: number,
    oy: number,
  ): void {
    if (!page.calendarGrid || !page.month) return;

    const grid = page.calendarGrid;
    const typo = project.globalSettings.defaultTypography;

    const gridX = ox + mmToPt(grid.positionMm.xMm);
    const gridY = oy + mmToPt(grid.positionMm.yMm);
    const gridW = mmToPt(grid.positionMm.widthMm);
    const gridH = mmToPt(grid.positionMm.heightMm);

    // Month header
    const headerFontSize = typo.monthHeader.fontSizePt;
    const headerHeight = headerFontSize * 2;

    // Generate month name
    const date = new Date(page.year, page.month - 1, 1);
    const monthName = date.toLocaleDateString(project.locale, { month: 'long' });
    const headerText = typo.monthHeader.textTransform === 'uppercase'
      ? `${monthName} ${page.year}`.toUpperCase()
      : `${monthName} ${page.year}`;

    doc.font(typo.monthHeader.fontFamily)
      .fontSize(headerFontSize)
      .fillColor(typo.monthHeader.color);

    doc.text(headerText, gridX, gridY, {
      width: gridW,
      align: (typo.monthHeader.textAlign ?? 'center') as 'left' | 'center' | 'right',
      height: headerHeight,
    });

    // Day numbers grid
    const dayNamesH = typo.dayNames.fontSizePt * 2.5;
    const bodyY = gridY + headerHeight + dayNamesH;
    const bodyH = gridH - headerHeight - dayNamesH;

    // Calculate days in month
    const daysInMonth = new Date(page.year, page.month, 0).getDate();
    const firstDow = date.getDay();
    const adjustedFirstDow = grid.startDayOfWeek === 'monday'
      ? (firstDow === 0 ? 6 : firstDow - 1)
      : firstDow;

    const colW = gridW / 7;
    const numWeeks = Math.ceil((daysInMonth + adjustedFirstDow) / 7);
    const rowH = bodyH / numWeeks;

    // Render day numbers
    let dayNum = 1;
    for (let week = 0; week < numWeeks; week++) {
      for (let dow = 0; dow < 7; dow++) {
        const cellIdx = week * 7 + dow;
        if (cellIdx < adjustedFirstDow || dayNum > daysInMonth) continue;

        const cellX = gridX + dow * colW;
        const cellY = bodyY + week * rowH;
        const padding = mmToPt(1.5);

        // Determine color
        const isSunday = grid.startDayOfWeek === 'monday' ? dow === 6 : dow === 0;
        const color = isSunday ? typo.dayNumbers.sundayColor : typo.dayNumbers.color;

        doc.font(typo.dayNumbers.fontFamily)
          .fontSize(typo.dayNumbers.fontSizePt)
          .fillColor(color);

        doc.text(String(dayNum), cellX + padding, cellY + padding, {
          width: colW - padding * 2,
          align: (typo.dayNumbers.textAlign ?? 'center') as 'left' | 'center' | 'right',
        });

        // Annotations
        const annotation = grid.annotations.find((a: any) => a.day === dayNum);
        if (annotation) {
          doc.font(annotation.fontFamily ?? typo.dayNumbers.fontFamily)
            .fontSize(annotation.fontSizePt)
            .fillColor(annotation.color);

          const annotText = annotation.icon
            ? `${annotation.icon} ${annotation.text}`
            : annotation.text;

          doc.text(annotText, cellX + padding, cellY + typo.dayNumbers.fontSizePt * 1.5 + padding, {
            width: colW - padding * 2,
            height: rowH - typo.dayNumbers.fontSizePt * 2,
            align: 'center',
            ellipsis: true,
          });
        }

        dayNum++;
      }
    }
  }

  /**
   * Render cover text overlay.
   */
  private renderCoverText(
    doc: PDFKit.PDFDocument,
    page: Page,
    project: CalendarProject,
    ox: number,
    oy: number,
  ): void {
    if (!page.coverText) return;

    const paperH = mmToPt(project.globalSettings.paperDimensions.heightMm);
    const paperW = mmToPt(project.globalSettings.paperDimensions.widthMm);

    let textY: number;
    switch (page.coverText.positionPreset) {
      case 'top-center':
        textY = oy + mmToPt(30);
        break;
      case 'center':
        textY = oy + paperH / 2 - mmToPt(20);
        break;
      case 'bottom-center':
      default:
        textY = oy + paperH - mmToPt(70);
        break;
    }

    doc.font(page.coverText.fontFamily)
      .fontSize(page.coverText.fontSizePt)
      .fillColor(page.coverText.color);

    doc.text(page.coverText.title, ox, textY, {
      width: paperW,
      align: 'center',
    });

    if (page.coverText.subtitle) {
      doc.fontSize(page.coverText.fontSizePt * 0.55)
        .fillOpacity(0.85)
        .text(page.coverText.subtitle, ox, textY + page.coverText.fontSizePt * 1.3, {
          width: paperW,
          align: 'center',
        });
      doc.fillOpacity(1);
    }
  }
}
