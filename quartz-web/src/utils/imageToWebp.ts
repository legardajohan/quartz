export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ACCEPTED_IMAGE_LABEL = "JPG, PNG o WEBP";

const OUTPUT_SIZE = 400;
const MAX_BYTES = 40 * 1024;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.05;

export function isPng(file: File): boolean {
  return file.type === "image/png";
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropToWebpOptions {
  size?: number;
  whiteBg?: boolean;
  maxBytes?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

export async function cropToWebp(
  imageSrc: string,
  croppedAreaPixels: CropArea,
  opts: CropToWebpOptions = {}
): Promise<Blob> {
  const { size = OUTPUT_SIZE, whiteBg = false, maxBytes = MAX_BYTES } = opts;

  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo procesar la imagen.");
  }

  if (whiteBg) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
  }

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    size,
    size
  );

  let quality = 0.9;
  let bestBlob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
    const blob = await canvasToBlob(canvas, quality);
    if (!blob) {
      throw new Error("No se pudo generar la imagen.");
    }
    bestBlob = blob;
    if (blob.size <= maxBytes) {
      return blob;
    }
    quality -= QUALITY_STEP;
  }

  if (!bestBlob) {
    throw new Error("No se pudo generar la imagen.");
  }

  return bestBlob;
}
