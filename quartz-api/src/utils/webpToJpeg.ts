import sharp from 'sharp';

const JPEG_SIZE = 400;
const JPEG_QUALITY = 90;

export async function webpToJpeg(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(JPEG_SIZE, JPEG_SIZE, { fit: 'cover' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
