import AppError from './AppError';

export function assertWebp(buffer: Buffer): void {
  const isRiff = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF';
  const isWebp = buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP';

  if (!isRiff || !isWebp) {
    throw new AppError('Formato de imagen inválido. Solo se acepta WEBP.', 422);
  }
}
