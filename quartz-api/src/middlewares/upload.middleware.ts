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

const MAX_SPREADSHEET_BYTES = 1024 * 1024;
const XLSX_MIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SPREADSHEET_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== XLSX_MIMETYPE) {
      cb(new AppError('El archivo debe ser una hoja de cálculo .xlsx.', 422));
      return;
    }
    cb(null, true);
  },
});

export function uploadSpreadsheetSingle(req: Request, res: Response, next: NextFunction): void {
  const middleware: RequestHandler = spreadsheetUpload.single('file');
  middleware(req, res, (err: unknown) => {
    if (!err) {
      if (!req.file) {
        next(new AppError('Selecciona un archivo .xlsx.', 422));
        return;
      }
      next();
      return;
    }

    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('El archivo supera el máximo de 1 MB.', 422));
        return;
      }
      next(new AppError('Archivo inválido.', 422));
      return;
    }

    next(err);
  });
}

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
