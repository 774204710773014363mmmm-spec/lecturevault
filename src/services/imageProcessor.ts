/**
 * Image processing utilities for document contrast enhancement, auto-crop simulation, and resolution scaling.
 */

export interface ProcessImageOptions {
  applyEnhancer?: boolean;
  autoCrop?: boolean;
  resolution?: 'high' | 'medium';
}

/**
 * Raw Image Passthrough service.
 * Disables all automatic filters, contrast modifications, and color adjustments
 * to preserve 100% raw original image data as uploaded or captured.
 */
export function processImageDataUrl(dataUrl: string, _options: ProcessImageOptions = {}): Promise<string> {
  return Promise.resolve(dataUrl);
}

