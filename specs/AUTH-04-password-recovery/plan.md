# AUTH-04 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/utils/activationToken.ts` |
| crear | `src/services/email-layout.ts` |
| tocar | `src/services/invitation-email.template.ts` |
| crear | `src/services/password-reset-email.template.ts` |
| tocar | `src/features/auth/auth.model.ts` |
| tocar | `src/features/auth/auth.types.ts` |
| tocar | `src/features/auth/auth.validation.ts` |
| tocar | `src/features/auth/auth.service.ts` |
| tocar | `src/features/auth/auth.controller.ts` |
| tocar | `src/features/auth/auth.routes.ts` |
| tocar | `src/features/users/users.service.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/auth/types/api.ts` |
| crear | `src/features/auth/queries/usePasswordResetQuery.ts` |
| crear | `src/features/auth/components/AuthShell.tsx` |
| crear | `src/features/auth/components/LinkProblemNotice.tsx` |
| crear | `src/features/auth/components/NewPasswordForm.tsx` |
| tocar | `src/features/auth/components/ActivateAccountForm.tsx` |
| tocar | `src/features/auth/pages/ActivateAccountPage.tsx` |
| crear | `src/features/auth/components/ForgotPasswordForm.tsx` |
| crear | `src/features/auth/pages/ForgotPasswordPage.tsx` |
| crear | `src/features/auth/pages/ResetPasswordPage.tsx` |
| tocar | `src/features/auth/pages/LoginPage.tsx` |
| tocar | `src/features/auth/components/LoginPanel.tsx` |
| tocar | `src/App.tsx` |

> **No tocar** `src/components/common/PasswordRequirements.tsx` (lo define AUTH-03, rama base).

## Contratos
### Tipos / DTOs
```ts
// auth.types.ts
export interface IPasswordResetPreview { email: string; firstName: string }

// auth.model.ts
export type SafeUser = Omit<IUser, 'passwordHash' | 'activationTokenHash' | 'passwordResetTokenHash'> & { _id: Schema.Types.ObjectId };
```

### `utils/activationToken.ts`
- `generateSecureToken(ttlMs: number): ActivationToken` — `randomBytes(32).toString('base64url')` + `hashActivationToken`; `expiresAt = now + ttlMs`.
- `generateActivationToken()` ⇒ `generateSecureToken(INVITATION_TTL_DAYS * DAY_MS)` (sin cambio de firma).
- `PASSWORD_RESET_TTL_MS = 60 * 60_000`, `PASSWORD_RESET_COOLDOWN_MS = 60_000`.
- `generatePasswordResetToken()` ⇒ `generateSecureToken(PASSWORD_RESET_TTL_MS)`.

### `services/email-layout.ts`
- Exporta `BRAND_PURPLE`, `QUARTZ_LOGO_URL`, `escapeHtml` (movidos desde la invitación).
- `renderTransactionalEmail(input: TransactionalEmailLayout): string` con `{ title; preheader; heading; bodyHtml; ctaLabel; ctaUrl; footnoteHtml; disclaimer }` — el HTML actual de la invitación parametrizado (tablas + estilos inline, preheader oculto, botón, "Si el botón no funciona…", pie). Valores ya escapados por el llamador.
- `invitation-email.template.ts` lo usa; asunto, textos y HTML resultante iguales a los actuales.

### `services/password-reset-email.template.ts`
- `buildPasswordResetEmail({ firstName, institutionName, resetUrl, expiresAt }): { subject; html; text }`.
- Asunto `Restablece tu contraseña de Quartz`. Preheader `Crea una contraseña nueva para tu cuenta de Quartz.`
- Heading `Hola, ${firstName}`; cuerpo: "Recibimos una solicitud para restablecer la contraseña de tu cuenta en **${institutionName}**." CTA "Restablecer contraseña".
- Nota: "El enlace vence en **1 hora** (a las ${hh:mm}) y solo se puede usar una vez." — `toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', timeStyle: 'short' })`.
- Disclaimer: "Este es un mensaje automático, no respondas a este correo. Si no pediste este cambio, ignora este correo; tu contraseña actual sigue funcionando."

### Modelo Mongoose (`User`)
| Campo | Tipo | Notas |
|---|---|---|
| `passwordResetTokenHash` | `String` | `select: false` |
| `passwordResetTokenExpiresAt` | `Date` | opcional |
| `passwordResetSentAt` | `Date` | opcional; enfriamiento 60 s |

- Índice `{ passwordResetTokenHash: 1 }` `unique + sparse`.
- `toSafeUser` no copia campos de recuperación.

### Zod (`auth.validation.ts`)
| Schema | Forma |
|---|---|
| `requestPasswordResetSchema` | `{ body: { email: string().trim().min(1).email() }.strict() }` |
| `verifyPasswordResetSchema` | `{ body: { token: string().min(1) }.strict() }` |
| `resetPasswordSchema` | `{ body: { token, password: strongPasswordSchema, confirmPassword }.strict().refine(igualdad, path confirmPassword) }` |

### Endpoints
| Método | Ruta | Rol | Middlewares | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/password-reset/request` | público | `validate(requestPasswordResetSchema)` | `200 { message }` · `400` |
| POST | `/api/auth/password-reset/verify` | público | `validate(verifyPasswordResetSchema)` | `200 IPasswordResetPreview` · `404` · `410` |
| POST | `/api/auth/password-reset` | público | `validate(resetPasswordSchema)` | `204` · `400` · `404` · `410` |

### Service — `auth.service.ts`
- Constantes: `PASSWORD_RESET_REQUESTED_MESSAGE = 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'`, `INVALID_RESET_MESSAGE = 'Este enlace no es válido o ya fue usado.'`, `EXPIRED_RESET_MESSAGE = 'Este enlace expiró. Solicita uno nuevo.'`.
- `requestPasswordReset(email): Promise<void>` (pre-tenant, comentario explícito):
  1. `User.findOne({ email: normalizeEmail(email), role: { $in: STAFF_ROLES } }).select('institutionId firstName email accountStatus invitationSentAt passwordResetSentAt +passwordHash').lean()`.
  2. Sin usuario ⇒ return.
  3. `PENDIENTE` ⇒ si `invitationSentAt` < `INVITATION_RESEND_COOLDOWN_MS` return; si no `void issueInvitation(String(user.institutionId), String(user._id)).catch(logMailError)`; return.
  4. Sin `passwordHash` o `passwordResetSentAt` < `PASSWORD_RESET_COOLDOWN_MS` ⇒ return.
  5. `generatePasswordResetToken()` → `User.updateOne({ _id: user._id }, { $set: { passwordResetTokenHash, passwordResetTokenExpiresAt, passwordResetSentAt: now } })` (await).
  6. `void sendPasswordResetEmail(user, token, expiresAt).catch(logMailError)` — lee `Institution.findById(user.institutionId).select('name')`, `buildPasswordResetEmail`, `sendMail`.
- `buildResetUrl(token)`: `${WEB_ORIGIN sin / final}/restablecer-contrasena?token=${encodeURIComponent(token)}` (mismo patrón que `buildActivationUrl` de `users.service.ts`).
- `findUserByResetToken(token)`: `findOne({ passwordResetTokenHash })` `.select('email firstName passwordResetTokenExpiresAt').lean()`; null ⇒ `404`; vencido ⇒ `410`.
- `verifyPasswordResetToken(token): Promise<IPasswordResetPreview>`.
- `resetPassword(token, password): Promise<void>`: `bcrypt.hash(password, 10)`; `findOneAndUpdate({ passwordResetTokenHash, passwordResetTokenExpiresAt: { $gt: now } }, { $set: { passwordHash, updatedAt: now }, $unset: { passwordResetTokenHash: 1, passwordResetTokenExpiresAt: 1, passwordResetSentAt: 1 } })`; null ⇒ `await findUserByResetToken(token)` (lanza 404/410) y si no lanza ⇒ `404`.
- `activateAccount`: añadir los 3 campos de recuperación al `$unset`.

### Service — `users.service.ts`
- `changeOwnPassword`: añadir `$unset` de los 3 campos de recuperación al update del `passwordHash`.

### Controller
- `requestPasswordResetController` ⇒ `await requestPasswordReset(email)`; `res.status(200).json({ message: PASSWORD_RESET_REQUESTED_MESSAGE })`.
- `verifyPasswordResetController` ⇒ `200` preview.
- `resetPasswordController` ⇒ `res.status(204).end()`.

### Frontend
- **`types/api.ts`:** `PasswordResetPreview { email; firstName }`, `RequestPasswordResetRequest { email }`, `RequestPasswordResetResponse { message }`, `ResetPasswordRequest { token; password; confirmPassword }`, `LoginLocationState { notice?: string; email?: string }`.
- **`queries/usePasswordResetQuery.ts`:** `passwordResetQueryKey(token)`; `useVerifyPasswordResetQuery(token)` (`enabled: !!token`, `retry: false`, `staleTime: 0`, `gcTime: 0` — igual que `useActivationQuery`); `useRequestPasswordResetMutation()` y `useResetPasswordMutation()` con `apiPost`.
- **`components/AuthShell.tsx`:** extraído tal cual de `ActivationShell` (`PresentationPanel` + panel derecho).
- **`components/LinkProblemNotice.tsx`:** props `{ icon: LucideIcon; title; body; actionLabel; onAction }`; estilos actuales.
- **`components/NewPasswordForm.tsx`:** extraído de `ActivateAccountForm`: props `{ email; heading; subtitle: ReactNode; submitLabel; loadingText; isSubmitting; error; onSubmit }`; exporta `NewPasswordFormValues`.
- **`ActivateAccountForm.tsx`:** wrapper de `NewPasswordForm` (heading "Hola, {firstName}", subtítulo con institución, "Activar mi cuenta"/"Activando…"). `ActivateAccountFormValues` se mantiene como alias.
- **`ActivateAccountPage.tsx`:** usa `AuthShell` y `LinkProblemNotice` (textos y botón "Ir a iniciar sesión" iguales).
- **`ForgotPasswordForm.tsx`:** `Input` material-tailwind (`type="email"`, `autoComplete="email"`), botón "Enviar enlace"/"Enviando…", enlace "Volver a iniciar sesión"; props `{ initialEmail; isSubmitting; error; onSubmit }`.
- **`ForgotPasswordPage.tsx`:** `AuthShell`; `location.state?.email` como inicial; `useRequestPasswordResetMutation`; éxito ⇒ vista de confirmación (icono `MailCheck`, texto genérico, "revisa spam", "vence en 1 hora", botón "Volver a iniciar sesión"). Error de red/`400` ⇒ `extractErrorMessage`.
- **`ResetPasswordPage.tsx`:** espejo de `ActivateAccountPage`: sin token / submit 404-410 / loading / verify error / form (`NewPasswordForm` con heading "Crea una contraseña nueva", subtítulo "Hola, {firstName}…", "Guardar contraseña"/"Guardando…"). `410` ⇒ `LinkProblemNotice` con "Solicitar un enlace nuevo" → `/recuperar-contrasena`. Éxito ⇒ `navigate('/login', { replace: true, state: { notice: 'Tu contraseña se actualizó. Inicia sesión con la nueva.', email } })`.
- **`LoginPage.tsx`:** `useLocation().state as LoginLocationState | null`; `formData.email` inicial = `state?.email ?? ''`; `handleForgotPassword` ⇒ `navigate('/recuperar-contrasena', { state: { email: formData.email.trim() } })`; pasa `notice`.
- **`LoginPanel.tsx`:** prop `notice?: string | null` ⇒ banner `bg-green-50 border-green-200 text-green-700`, `role="status"`, encima del error.
- **`App.tsx`:** `<Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />` y `<Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />` junto a `/activar-cuenta`.

## Notas
- **Campos propios** (no se reutiliza `activationTokenHash`): el reset no cambia `accountStatus`, tiene otro TTL y no debe invalidar una invitación.
- **Respuesta genérica + envío sin `await`:** ni el contenido ni el tiempo de respuesta revelan si el correo existe; el fallo SMTP no se reporta al cliente (trade-off aceptado: el usuario reintenta tras 60 s).
- **Pendiente ⇒ invitación:** decisión del usuario; se reutiliza `issueInvitation` y su enfriamiento `invitationSentAt`.
- **Sin login automático:** decisión del usuario; el `204` no emite JWT.
- **Nunca 401:** el interceptor de `apiClient` haría `logout()` (mismo criterio que la activación).
- **POST con token en body:** el token no queda en logs de acceso.
- **`validate()` no reescribe `req.body`** (desviación documentada en USR-04): la normalización del email va en el service con `normalizeEmail`.
- **Worktree:** se implementa en `E:\dev\startup\quartz-auth-04` sobre `feat/AUTH-03-compact-password-requirements` (rama base); no se toca el working tree de `E:\dev\startup\quartz`.
- Docs (`docs/data-model.md` fila `User`, `docs/roles-permissions.md`) quedan para `/sdd-release`.
- Diseño web: invocar `emil-design-eng`, `impeccable` y `frontend-design` antes de la UI (regla de `quartz-web/CLAUDE.md`).

## Desviaciones durante la implementación
- **`PASSWORD_RESET_UNSET`** vive en `auth.model.ts` (no en `auth.service.ts`): lo usan `auth.service` y `users.service`, y `auth.service` ya importa `users.service` (`issueInvitation`, `normalizeEmail`); así se evita el ciclo.
- **`renderTransactionalEmail`** recibe `paragraphsHtml: string[]` en lugar de `bodyHtml`: reproduce los márgenes del HTML original (último párrafo 28 px). Verificado: el HTML, el texto y el asunto de la invitación son idénticos byte a byte a los anteriores.
- **`LoginLocationState` → `AuthLocationState`**: lo usan `/login` y `/recuperar-contrasena`.
- **`ForgotPasswordForm`** usa `Input`/`Button` de `@material-tailwind/react` (como `LoginPanel` tras AUTH-03). `NewPasswordForm` conserva el `Button` de `components/ui` de la activación para no cambiarla visualmente.
- **`LoginPage`** limpia `location.state` tras leerlo (el aviso no reaparece al recargar) y oculta el aviso al enviar el login.
- **Impeccable:** no hay `PRODUCT.md`; no se creó (fuera del alcance de `/sdd-implement`). La UI sigue el sistema visual de la activación y el login.
- **Índice nuevo** `passwordResetTokenHash_1` (unique+sparse): Mongoose lo crea al arrancar la API (`autoIndex`).

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual (SMTP de prueba Mailtrap/Ethereal): correo inexistente / Activo / Pendiente ⇒ misma pantalla de confirmación; Activo recibe correo ⇒ restablece ⇒ `/login` con aviso ⇒ entra con la nueva; reusar enlace ⇒ "no válido"; `passwordResetTokenExpiresAt` en el pasado ⇒ "expiró" + "Solicitar un enlace nuevo"; dos solicitudes en < 60 s ⇒ un solo correo; Pendiente recibe invitación nueva; correo de invitación idéntico al anterior; `/activar-cuenta` sin cambios visibles.
