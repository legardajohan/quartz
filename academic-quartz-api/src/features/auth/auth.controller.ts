import { Request, Response, NextFunction } from 'express';
import { login } from './auth.service';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);

    if (!result) {
      return res.status(401).json({ message: 'Correo o contraseña inválidos.' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}
