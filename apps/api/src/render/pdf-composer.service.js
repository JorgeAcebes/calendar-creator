"use strict";
// =============================================================================
// PDF Composer Service — Generates print-ready PDFs using PDFKit
// =============================================================================
// This service translates the CalendarProject state into a vector PDF.
// It uses the SAME computeImagePlacement() function as the frontend canvas
// to guarantee pixel-perfect edge-to-edge correspondence.
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfComposerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfComposerService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const shared_types_1 = require("@calendar-creator/shared-types");
let PdfComposerService = PdfComposerService_1 = class PdfComposerService {
    logger = new common_1.Logger(PdfComposerService_1.name);
    /**
     * Compose a complete calendar PDF from the project state.
     * Returns a Buffer containing the raw PDF.
     */
    async compose(project, uploadDir) {
        const { bleed, paperDimensions } = project.globalSettings;
        // Total page size including bleed (in PDF points)
        const pageWidthPt = (0, shared_types_1.mmToPt)(paperDimensions.widthMm + bleed.leftMm + bleed.rightMm);
        const pageHeightPt = (0, shared_types_1.mmToPt)(paperDimensions.heightMm + bleed.topMm + bleed.bottomMm);
        const doc = new pdfkit_1.default({
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
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        const bleedOffsetX = (0, shared_types_1.mmToPt)(bleed.leftMm);
        const bleedOffsetY = (0, shared_types_1.mmToPt)(bleed.topMm);
        for (const page of project.pages) {
            doc.addPage({ size: [pageWidthPt, pageHeightPt], margin: 0 });
            // Background color
            const bgColor = page.backgroundColor ?? project.globalSettings.backgroundColor;
            doc.rect(0, 0, pageWidthPt, pageHeightPt).fill(bgColor);
            // Render images
            for (const region of page.imageRegions) {
                if (!region.imageFileId)
                    continue;
                const imageData = project.images[region.imageFileId];
                if (!imageData)
                    continue;
                const imagePath = path.join(uploadDir, path.basename(imageData.storagePath));
                if (!fs.existsSync(imagePath)) {
                    this.logger.warn(`Image not found: ${imagePath}`);
                    continue;
                }
                // Use the SAME shared function as the frontend
                const placement = (0, shared_types_1.computeImagePlacement)(imageData.widthPx, imageData.heightPx, region.mask, region.transform);
                // Convert to PDF points and add bleed offset
                const clipX = bleedOffsetX + (0, shared_types_1.mmToPt)(region.mask.xMm);
                const clipY = bleedOffsetY + (0, shared_types_1.mmToPt)(region.mask.yMm);
                const clipW = (0, shared_types_1.mmToPt)(region.mask.widthMm);
                const clipH = (0, shared_types_1.mmToPt)(region.mask.heightMm);
                const imgX = bleedOffsetX + (0, shared_types_1.mmToPt)(placement.imgXMm);
                const imgY = bleedOffsetY + (0, shared_types_1.mmToPt)(placement.imgYMm);
                const imgW = (0, shared_types_1.mmToPt)(placement.imgWidthMm);
                const imgH = (0, shared_types_1.mmToPt)(placement.imgHeightMm);
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
    drawCropMarks(doc, bleed, paper) {
        const markLen = (0, shared_types_1.mmToPt)(5);
        const markGap = (0, shared_types_1.mmToPt)(1);
        doc.save();
        doc.strokeColor([0, 0, 0, 100]); // CMYK black
        doc.lineWidth(0.25);
        const trimX = (0, shared_types_1.mmToPt)(bleed.leftMm);
        const trimY = (0, shared_types_1.mmToPt)(bleed.topMm);
        const trimW = (0, shared_types_1.mmToPt)(paper.widthMm);
        const trimH = (0, shared_types_1.mmToPt)(paper.heightMm);
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
    renderCalendarGrid(doc, page, project, ox, oy) {
        if (!page.calendarGrid || !page.month)
            return;
        const grid = page.calendarGrid;
        const typo = project.globalSettings.defaultTypography;
        const gridX = ox + (0, shared_types_1.mmToPt)(grid.positionMm.xMm);
        const gridY = oy + (0, shared_types_1.mmToPt)(grid.positionMm.yMm);
        const gridW = (0, shared_types_1.mmToPt)(grid.positionMm.widthMm);
        const gridH = (0, shared_types_1.mmToPt)(grid.positionMm.heightMm);
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
            align: (typo.monthHeader.textAlign ?? 'center'),
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
                if (cellIdx < adjustedFirstDow || dayNum > daysInMonth)
                    continue;
                const cellX = gridX + dow * colW;
                const cellY = bodyY + week * rowH;
                const padding = (0, shared_types_1.mmToPt)(1.5);
                // Determine color
                const isSunday = grid.startDayOfWeek === 'monday' ? dow === 6 : dow === 0;
                const color = isSunday ? typo.dayNumbers.sundayColor : typo.dayNumbers.color;
                doc.font(typo.dayNumbers.fontFamily)
                    .fontSize(typo.dayNumbers.fontSizePt)
                    .fillColor(color);
                doc.text(String(dayNum), cellX + padding, cellY + padding, {
                    width: colW - padding * 2,
                    align: (typo.dayNumbers.textAlign ?? 'center'),
                });
                // Annotations
                const annotation = grid.annotations.find((a) => a.day === dayNum);
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
    renderCoverText(doc, page, project, ox, oy) {
        if (!page.coverText)
            return;
        const paperH = (0, shared_types_1.mmToPt)(project.globalSettings.paperDimensions.heightMm);
        const paperW = (0, shared_types_1.mmToPt)(project.globalSettings.paperDimensions.widthMm);
        let textY;
        switch (page.coverText.positionPreset) {
            case 'top-center':
                textY = oy + (0, shared_types_1.mmToPt)(30);
                break;
            case 'center':
                textY = oy + paperH / 2 - (0, shared_types_1.mmToPt)(20);
                break;
            case 'bottom-center':
            default:
                textY = oy + paperH - (0, shared_types_1.mmToPt)(70);
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
};
exports.PdfComposerService = PdfComposerService;
exports.PdfComposerService = PdfComposerService = PdfComposerService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfComposerService);
//# sourceMappingURL=pdf-composer.service.js.map