// Admin dashboard: images (moved out of AdminDashboard.tsx unchanged).
import * as React from 'react';

import { API_BASE_URL } from '../../../lib/config';

// ==================== Helper Functions ====================
export const getImageUrl = (url: string) => {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.startsWith('/') && !url.startsWith('http')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
};

export const removeLightBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const samplePoints = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const bg = samplePoints.reduce(
    (acc, [x, y]) => {
      const index = (y * width + x) * 4;
      acc.r += data[index];
      acc.g += data[index + 1];
      acc.b += data[index + 2];
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );
  bg.r /= samplePoints.length;
  bg.g /= samplePoints.length;
  bg.b /= samplePoints.length;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const colorDistance = Math.hypot(r - bg.r, g - bg.g, b - bg.b);
    const lowSaturation = Math.max(r, g, b) - Math.min(r, g, b) < 34;

    if (brightness > 238 && colorDistance < 72) {
      data[i + 3] = 0;
    } else if (brightness > 218 && lowSaturation && colorDistance < 54) {
      data[i + 3] = Math.min(data[i + 3], 70);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

export const resizeImage = (file: File, maxWidth: number, maxHeight: number, options: { removeBackground?: boolean } = {}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const MAX_DATA_URL_LENGTH = 3_000_000; // Increased for high-resolution 8K support
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          if (options.removeBackground) {
            removeLightBackground(ctx, canvas.width, canvas.height);
            let outputCanvas = canvas;
            let dataUrl = outputCanvas.toDataURL('image/png');

            while (dataUrl.length > MAX_DATA_URL_LENGTH && outputCanvas.width > 420 && outputCanvas.height > 280) {
              const nextWidth = Math.round(outputCanvas.width * 0.86);
              const nextHeight = Math.round(outputCanvas.height * 0.86);
              const smallerCanvas = document.createElement('canvas');
              smallerCanvas.width = nextWidth;
              smallerCanvas.height = nextHeight;
              const smallerCtx = smallerCanvas.getContext('2d');
              if (!smallerCtx) break;
              smallerCtx.imageSmoothingEnabled = true;
              smallerCtx.imageSmoothingQuality = 'high';
              smallerCtx.drawImage(outputCanvas, 0, 0, nextWidth, nextHeight);
              outputCanvas = smallerCanvas;
              dataUrl = outputCanvas.toDataURL('image/png');
            }

            if (dataUrl.length > MAX_DATA_URL_LENGTH) {
              reject(new Error('The transparent image is still too big. Please upload a smaller car image.'));
              return;
            }

            resolve(dataUrl);
            return;
          }
          
          let quality = 0.82;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, try to reduce quality progressively
          while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          if (dataUrl.length > MAX_DATA_URL_LENGTH) {
            reject(new Error('The image is still too big even after compression. Please upload a smaller file or use an image URL.'));
            return;
          }
          resolve(dataUrl);
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};
