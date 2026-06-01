// =============================================================================
// useImageLoader — Load images into Konva-compatible HTMLImageElement
// =============================================================================

import { useState, useEffect } from 'react';

/**
 * Load an image from a URL/data-url and return an HTMLImageElement
 * ready for use with Konva <Image />.
 */
export function useImageLoader(
  src: string | null | undefined,
): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
}
