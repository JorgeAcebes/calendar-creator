"use strict";
// =============================================================================
// Calendar Creator — Complete Data Model
// =============================================================================
// This file defines the entire state tree for a calendar project.
// All spatial measurements use MILLIMETERS as the canonical unit.
// Conversion to px (canvas) or pt (PDF) happens at render time.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAPER_FORMATS = void 0;
/** Standard paper formats with their dimensions in mm */
exports.PAPER_FORMATS = {
    A4: { widthMm: 210, heightMm: 297 },
    A3: { widthMm: 297, heightMm: 420 },
    Letter: { widthMm: 215.9, heightMm: 279.4 },
};
//# sourceMappingURL=calendar.types.js.map