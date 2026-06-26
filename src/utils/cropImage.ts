import type { CropArea } from '../types';

/**
 * Crops the source image and returns a blob URL.
 * @param imageSrc  – data URL or object URL of the original image
 * @param pixelCrop – { x, y, width, height } in image pixels
 * @param rotation  – degrees (0, 90, 180, 270)
 * @param outputW   – desired output width  in px (print resolution)
 * @param outputH   – desired output height in px (print resolution)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation: number,
  outputW: number,
  outputH: number,
): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d')!;
  canvas.width  = outputW;
  canvas.height = outputH;

  const rad = (rotation * Math.PI) / 180;

  // Temporary canvas to apply rotation
  const tmpCanvas  = document.createElement('canvas');
  const tmpCtx     = tmpCanvas.getContext('2d')!;
  tmpCanvas.width  = image.width;
  tmpCanvas.height = image.height;
  tmpCtx.translate(image.width / 2, image.height / 2);
  tmpCtx.rotate(rad);
  tmpCtx.drawImage(image, -image.width / 2, -image.height / 2);

  ctx.drawImage(
    tmpCanvas,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outputW, outputH,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.98);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}
