import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import AppError from '../utils/AppError';

const MAX_IMAGE_BYTES = 40 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'image/webp') {
      cb(new AppError('Formato no permitido. Solo se acepta WEBP.', 422));
      return;
    }
    cb(null, true);
  },
});

export function uploadImageSingle(req: Request, res: Response, next: NextFunction): void {
  const middleware: RequestHandler = upload.single('image');
  middleware(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('La imagen supera el máximo de 40 KB.', 422));
        return;
      }
      next(new AppError('Archivo inválido.', 422));
      return;
    }

    next(err);
  });
}
