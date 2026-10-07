// Lectura perezosa (mismo motivo que `r2.service.ts`): los `import` de `app.ts` se evalúan
// antes de `dotenv.config()`, así que leer `process.env` a nivel de módulo devolvería `undefined`.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido');
  }
  return secret;
}
