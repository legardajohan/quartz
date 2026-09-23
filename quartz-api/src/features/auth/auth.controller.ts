import { Request, Response } from 'express';
import { login, toSessionUser, getSessionData, verifyActivationToken, activateAccount } from './auth.service';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await login(email, password);

  if (!result) {
    res.status(401).json({ message: 'Correo o contraseña inválidos.' });
    return;
  }

  res.json(result);
}

export async function getProfileController(req: Request, res: Response) {
  res.json({ user: toSessionUser(req.user!) });
}

export async function getSessionController(req: Request, res: Response) {
  const sessionData = await getSessionData(req.user!);
  res.json({ sessionData });
}

export async function verifyActivationController(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  const preview = await verifyActivationToken(token);
  res.status(200).json(preview);
}

export async function activateAccountController(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string };
  const result = await activateAccount(token, password);
  res.status(200).json(result);
}
