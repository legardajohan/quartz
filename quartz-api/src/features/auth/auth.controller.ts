import { Request, Response } from 'express';
import { login } from './auth.service';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await login(email, password);

  if (!result) {
    res.status(401).json({ message: 'Correo o contraseña inválidos.' });
    return;
  }

  res.json(result);
}
