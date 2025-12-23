import { Request, Response, NextFunction } from 'express';

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Acceso prohibido. No se ha proporcionado un rol.' });
    }

    const hasRequiredRole = allowedRoles.includes(req.user.role);

    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Acceso prohibido. No tienes los permisos necesarios.' });
    }

    next();
  };
}
