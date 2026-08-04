const DEFAULT_MAX_SIZE = 400;
const JPEG_QUALITY = 0.92;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = src;
  });
}

export async function blobToJpegDataUrl(blob: Blob, maxSize: number = DEFAULT_MAX_SIZE): Promise<string | null> {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);

    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
