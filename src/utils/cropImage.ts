import type { CropArea } from '../types';

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation: number,
  outputW: number,
  outputH: number,
): Promise<string> {
  const image = await createImage(imageSrc);

  // Apply rotation on a temp canvas
  const tmpCanvas  = document.createElement('canvas');
  const tmpCtx     = tmpCanvas.getContext('2d')!;
  tmpCanvas.width  = image.width;
  tmpCanvas.height = image.height;
  tmpCtx.translate(image.width / 2, image.height / 2);
  tmpCtx.rotate((rotation * Math.PI) / 180);
  tmpCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d')!;
  canvas.width  = outputW;
  canvas.height = outputH;

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

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

/** Render a blob/object URL onto a canvas at the given print-resolution size */
export async function toDataUrl(src: string, w: number, h: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c   = document.createElement('canvas');
      c.width   = w;
      c.height  = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.98));
    };
    img.onerror = reject;
    img.src = src;
  });
}
