import { Request, Response } from 'express';
import { validateCredentials, generateJWT } from './auth.service';

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password, institutionId } = req.body;
    if (!email || !password || !institutionId) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    const user = await validateCredentials(email, password, institutionId);
    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña inválidos.' });
    }
    const token = generateJWT(user);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
