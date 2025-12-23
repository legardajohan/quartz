import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, SafeUser } from '../features/auth/auth.model';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

interface JwtPayload {
  sub: string;
  institutionId: string;
  role: string;
  firstName: string;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado.' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.sub) {
      return res.status(401).json({ message: 'Token inválido, formato incorrecto.' });
    }

    const userDocument = await User.findById(decoded.sub);
    if (!userDocument) {
      return res.status(401).json({ message: 'Usuario no encontrado.' });
    }

    req.user = userDocument.toSafeUser();
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}