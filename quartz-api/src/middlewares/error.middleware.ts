import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import AppError, { VERSION_CONFLICT } from '../utils/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, ...(err.code && { code: err.code }) });
    return;
  }

  if (err instanceof mongoose.Error.VersionError) {
    res.status(409).json({
      message: 'El registro fue modificado por otro usuario.',
      code: VERSION_CONFLICT,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Error de validación.',
      errors: err.issues.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor.' });
}
