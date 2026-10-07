# AUTH-04 — Tasks

> Trabajar en el worktree `E:\dev\startup\quartz-auth-04` (rama `feat/AUTH-04-password-recovery`, base `feat/AUTH-03-compact-password-requirements`). No tocar `E:\dev\startup\quartz`. Si AUTH-03 recibe más commits, `git rebase feat/AUTH-03-compact-password-requirements` antes de implementar.

## Backend (`quartz-api`)
- [x] `utils/activationToken.ts` — `generateSecureToken(ttlMs)`, `PASSWORD_RESET_TTL_MS`, `PASSWORD_RESET_COOLDOWN_MS`, `generatePasswordResetToken()`; `generateActivationToken` lo reutiliza.
- [x] `services/email-layout.ts` — mover `BRAND_PURPLE`, `QUARTZ_LOGO_URL`, `escapeHtml`; crear `renderTransactionalEmail`.
- [x] `services/invitation-email.template.ts` — usar el layout; HTML/asunto/texto sin cambios.
- [x] `services/password-reset-email.template.ts` — `buildPasswordResetEmail` (HTML + texto, escape, hora `es-CO`/`America/Bogota`).
- [x] `features/auth/auth.model.ts` — `passwordResetTokenHash` (`select: false`), `passwordResetTokenExpiresAt`, `passwordResetSentAt`; índice unique+sparse; `SafeUser` omite el hash.
- [x] `features/auth/auth.types.ts` — `IPasswordResetPreview`.
- [x] `features/auth/auth.validation.ts` — `requestPasswordResetSchema`, `verifyPasswordResetSchema`, `resetPasswordSchema`.
- [x] `features/auth/auth.service.ts` — `requestPasswordReset` (pre-tenant, `STAFF_ROLES`, enfriamientos, Pendiente ⇒ `issueInvitation`, envío sin `await`), `verifyPasswordResetToken`, `resetPassword` (atómico, 404/410), `buildResetUrl`; `activateAccount` hace `$unset` de los campos de recuperación.
- [x] `features/users/users.service.ts` — `changeOwnPassword` hace `$unset` de los campos de recuperación.
- [x] `features/auth/auth.controller.ts` — 3 controllers (sin `try/catch`): `200 { message }`, `200 preview`, `204`.
- [x] `features/auth/auth.routes.ts` — `POST /password-reset/request`, `/password-reset/verify`, `/password-reset` con `validate` + `asyncHandler`, públicas.

## Frontend (`quartz-web`)
- [x] Invocar `emil-design-eng`, `impeccable`, `frontend-design` antes de la UI.
- [x] `features/auth/types/api.ts` — `PasswordResetPreview`, `RequestPasswordResetRequest/Response`, `ResetPasswordRequest`, `AuthLocationState`.
- [x] `features/auth/queries/usePasswordResetQuery.ts` — verify query + 2 mutations.
- [x] `components/AuthShell.tsx`, `components/LinkProblemNotice.tsx`, `components/NewPasswordForm.tsx` — extraídos de la activación.
- [x] `ActivateAccountForm.tsx` + `ActivateAccountPage.tsx` — usar los extraídos; comportamiento y textos iguales.
- [x] `components/ForgotPasswordForm.tsx` + `pages/ForgotPasswordPage.tsx` — solicitud + vista de confirmación genérica.
- [x] `pages/ResetPasswordPage.tsx` — estados sin token / loading / 404 / 410 / form; éxito ⇒ `/login` con `notice` + `email`.
- [x] `LoginPage.tsx` — navegar a `/recuperar-contrasena` con el correo; leer `location.state`.
- [x] `LoginPanel.tsx` — banner `notice` (`role="status"`).
- [x] `App.tsx` — rutas públicas `/recuperar-contrasena` y `/restablecer-contrasena`.

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde, sin problemas nuevos (`quartz-web`)
- [x] Servidor arranca sin errores de compilación ni runtime
- [x] Repaso de aislamiento: solo consultas pre-tenant por `email`/hash sobre el documento dueño; ningún `institutionId` de la petición
- [ ] Prueba manual con SMTP de prueba (casos de `plan.md` § Verificación) — **pendiente del usuario**

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
