import { randomBytes, createHash } from 'crypto';

export const INVITATION_TTL_DAYS = 15;
export const INVITATION_RESEND_COOLDOWN_MS = 60_000;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ActivationToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

// SHA-256 y no bcrypt: el token tiene 256 bits de entropía (sin fuerza bruta posible)
// y el hash debe ser determinista para buscar al usuario por igualdad.
export function hashActivationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateActivationToken(): ActivationToken {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashActivationToken(token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * DAY_MS),
  };
}
