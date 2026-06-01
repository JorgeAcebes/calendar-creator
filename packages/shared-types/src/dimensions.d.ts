/** Points per millimeter (1 inch = 25.4mm, 1 inch = 72pt) */
export declare const PT_PER_MM: number;
/** Pixels per millimeter at 300 DPI (1 inch = 25.4mm) */
export declare const PX_PER_MM_300DPI: number;
/**
 * Convert millimeters to PDF points.
 */
export declare function mmToPt(mm: number): number;
/**
 * Convert PDF points to millimeters.
 */
export declare function ptToMm(pt: number): number;
/**
 * Convert millimeters to pixels at a given DPI.
 */
export declare function mmToPx(mm: number, dpi?: number): number;
/**
 * Convert pixels to millimeters at a given DPI.
 */
export declare function pxToMm(px: number, dpi?: number): number;
/**
 * Convert millimeters to canvas pixels at a given display scale.
 * The canvas operates at a virtual DPI determined by the scale factor.
 *
 * @param mm - Value in millimeters
 * @param canvasScale - Scale factor (e.g., 0.35 means 35% of actual size)
 * @param referenceDpi - The DPI the canvas "pretends" to be at scale=1 (default 300)
 */
export declare function mmToCanvasPx(mm: number, canvasScale: number, referenceDpi?: number): number;
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
export declare function computeCoverScale(imageWidthPx: number, imageHeightPx: number, maskWidthMm: number, maskHeightMm: number): number;
/**
 * Compute image placement within a mask for both Canvas and PDF rendering.
 * This is THE critical shared function that ensures edge-to-edge accuracy.
 *
 * @returns Position and size of the image in millimeters, relative to the page trim area
 */
export declare function computeImagePlacement(imageWidthPx: number, imageHeightPx: number, mask: {
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
}, transform: {
    scale: number;
    offsetXMm: number;
    offsetYMm: number;
}): {
    imgXMm: number;
    imgYMm: number;
    imgWidthMm: number;
    imgHeightMm: number;
};
/**
 * Estimate the effective DPI of an image placed in a mask.
 * Used to warn users about low-resolution images.
 *
 * @returns Estimated DPI (>= 300 is good, < 150 is a warning)
 */
export declare function estimateEffectiveDpi(imageWidthPx: number, imageHeightPx: number, maskWidthMm: number, maskHeightMm: number, userScale?: number): number;
//# sourceMappingURL=dimensions.d.ts.map