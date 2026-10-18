/**
 * In-memory cache for high-resolution base64 preview data URLs.
 * Decouples heavy image strings from Zundo's undo/redo history snapshots
 * and prevents massive heap memory usage.
 */
export const imagePreviewDataCache = new Map<string, string>();
