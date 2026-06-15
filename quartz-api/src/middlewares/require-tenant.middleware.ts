import { Request, Response, NextFunction } from 'express';

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.institutionId) {
    res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta.' });
    return;
  }
  next();
}
