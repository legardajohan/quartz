import { Request, Response, NextFunction } from 'express';
import { validateCredentials, generateJWT } from './auth.service';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, institutionId } = req.body;
    const user = await validateCredentials(email, password, institutionId);

    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña inválidos.' });
    }

    const token = generateJWT(user);
    res.json({ token });
  } catch (error) {
    // Pass errors to the next error-handling middleware
    next(error);
  }
}