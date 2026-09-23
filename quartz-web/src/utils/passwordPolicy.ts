// Política de contraseña (USR-04). Espejo de `strongPasswordSchema` en
// `quartz-api/src/features/auth/auth.validation.ts`: si cambia una, cambia la otra.

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: `Al menos ${MIN_PASSWORD_LENGTH} caracteres`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { id: 'upper', label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\d/.test(p) },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
