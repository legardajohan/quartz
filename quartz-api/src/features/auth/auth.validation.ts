import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'El email es obligatorio.').email('El formato del email no es válido.'),
    password: z.string().min(1, 'La contraseña es obligatoria.')
  }),
});

// Política de contraseña (USR-04). Espejo en `quartz-web/src/utils/passwordPolicy.ts`.
export const strongPasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula.')
  .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula.')
  .regex(/\d/, 'La contraseña debe tener al menos un número.');

const activationToken = z.string().min(1, 'El enlace de activación no es válido.');

export const verifyActivationSchema = z.object({
  body: z.object({
    token: activationToken,
  }).strict(),
});

export const activateAccountSchema = z.object({
  body: z.object({
    token: activationToken,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Debe confirmar la contraseña.'),
  }).strict()
    .refine((b) => b.password === b.confirmPassword, {
      message: 'Las contraseñas no coinciden.',
      path: ['confirmPassword'],
    }),
});
