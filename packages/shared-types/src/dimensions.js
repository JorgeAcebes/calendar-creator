"use strict";
// =============================================================================
// Dimension Conversion Utilities
// =============================================================================
// Shared between frontend canvas rendering and backend PDF composition
// to guarantee pixel-perfect correspondence.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PX_PER_MM_300DPI = exports.PT_PER_MM = void 0;
exports.mmToPt = mmToPt;
exports.ptToMm = ptToMm;
exports.mmToPx = mmToPx;
exports.pxToMm = pxToMm;
exports.mmToCanvasPx = mmToCanvasPx;
exports.computeCoverScale = computeCoverScale;
exports.computeImagePlacement = computeImagePlacement;
exports.estimateEffectiveDpi = estimateEffectiveDpi;
/** Points per millimeter (1 inch = 25.4mm, 1 inch = 72pt) */
exports.PT_PER_MM = 72 / 25.4; // ≈ 2.8346
/** Pixels per millimeter at 300 DPI (1 inch = 25.4mm) */
exports.PX_PER_MM_300DPI = 300 / 25.4; // ≈ 11.811
/**
 * Convert millimeters to PDF points.
 */
function mmToPt(mm) {
    return mm * exports.PT_PER_MM;
}
/**
 * Convert PDF points to millimeters.
 */
function ptToMm(pt) {
    return pt / exports.PT_PER_MM;
}
/**
 * Convert millimeters to pixels at a given DPI.
 */
function mmToPx(mm, dpi = 300) {
    return mm * (dpi / 25.4);
}
/**
 * Convert pixels to millimeters at a given DPI.
 */
function pxToMm(px, dpi = 300) {
    return px / (dpi / 25.4);
}
/**
 * Convert millimeters to canvas pixels at a given display scale.
 * The canvas operates at a virtual DPI determined by the scale factor.
 *
 * @param mm - Value in millimeters
 * @param canvasScale - Scale factor (e.g., 0.35 means 35% of actual size)
 * @param referenceDpi - The DPI the canvas "pretends" to be at scale=1 (default 300)
 */
function mmToCanvasPx(mm, canvasScale, referenceDpi = 300) {
    return mm * (referenceDpi / 25.4) * canvasScale;
}
/**
 * Compute the scale factor needed for an image to COVER a mask area
 * (no empty space, image may be cropped).
 *
 * @param imageWidthPx - Original image width in pixels
 * @param imageHeightPx - Original image height in pixels
 * @param maskWidthMm - Mask width in mm
 * @param maskHeightMm - Mask height in mm
 * @returns Scale factor to apply to the image
 */
function computeCoverScale(imageWidthPx, imageHeightPx, maskWidthMm, maskHeightMm) {
    // Convert mask to the same unit system (using arbitrary DPI, ratio is what matters)
    const maskAspect = maskWidthMm / maskHeightMm;
    const imageAspect = imageWidthPx / imageHeightPx;
    if (imageAspect > maskAspect) {
        // Image is wider than mask → scale by height
        return maskHeightMm / (imageHeightPx / (300 / 25.4));
    }
    else {
        // Image is taller than mask → scale by width
        return maskWidthMm / (imageWidthPx / (300 / 25.4));
    }
}
/**
 * Compute image placement within a mask for both Canvas and PDF rendering.
 * This is THE critical shared function that ensures edge-to-edge accuracy.
 *
 * @returns Position and size of the image in millimeters, relative to the page trim area
 */
function computeImagePlacement(imageWidthPx, imageHeightPx, mask, transform) {
    // 1. Base scale: image covers the mask
    const coverScale = computeCoverScale(imageWidthPx, imageHeightPx, mask.widthMm, mask.heightMm);
    // 2. Apply user's zoom factor
    const finalScale = coverScale * transform.scale;
    // 3. Image dimensions in mm at final scale
    const imgWidthMm = pxToMm(imageWidthPx) * finalScale;
    const imgHeightMm = pxToMm(imageHeightPx) * finalScale;
    // 4. Center image within mask, then apply user offset
    const imgXMm = mask.xMm + (mask.widthMm - imgWidthMm) / 2 + transform.offsetXMm;
    const imgYMm = mask.yMm + (mask.heightMm - imgHeightMm) / 2 + transform.offsetYMm;
    return { imgXMm, imgYMm, imgWidthMm, imgHeightMm };
}
/**
 * Estimate the effective DPI of an image placed in a mask.
 * Used to warn users about low-resolution images.
 *
 * @returns Estimated DPI (>= 300 is good, < 150 is a warning)
 */
function estimateEffectiveDpi(imageWidthPx, imageHeightPx, maskWidthMm, maskHeightMm, userScale = 1) {
    const coverScale = computeCoverScale(imageWidthPx, imageHeightPx, maskWidthMm, maskHeightMm);
    const finalScale = coverScale * userScale;
    // The image is rendered at imgWidthMm = pxToMm(imageWidthPx) * finalScale
    // Effective DPI = imageWidthPx / (imgWidthMm / 25.4)
    const imgWidthMm = pxToMm(imageWidthPx) * finalScale;
    const effectiveDpi = imageWidthPx / (imgWidthMm / 25.4);
    return Math.round(effectiveDpi);
}
//# sourceMappingURL=dimensions.js.map