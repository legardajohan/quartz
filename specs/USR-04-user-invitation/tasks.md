# USR-04 — Tasks

> Rama `feat/USR-04-user-invitation` desde `feat/USR-03-my-account`.

## Backend (`quartz-api`)
- [x] `npm i nodemailer` + `npm i -D @types/nodemailer`
- [x] `src/utils/activationToken.ts` — `INVITATION_TTL_DAYS`, `INVITATION_RESEND_COOLDOWN_MS`, `generateActivationToken`, `hashActivationToken`
- [x] `src/services/mail.service.ts` — transporte Nodemailer perezoso + `sendMail`
- [x] `src/services/invitation-email.template.ts` — `buildInvitationEmail` (HTML inline + texto, escudo JPG, fecha `es-CO`, escape HTML)
- [x] `auth.types.ts` — `UserAccountStatus`, `IActivationPreview`
- [x] `auth.model.ts` — `accountStatus`, `activationTokenHash` (`select: false`), `activationTokenExpiresAt`, `invitationSentAt`; índice `unique+sparse`; `SafeUser`/`toSafeUser` sin hash
- [x] `auth.validation.ts` — `strongPasswordSchema` (export), `verifyActivationSchema`, `activateAccountSchema`
- [x] `auth.service.ts` — `login` 403 Pendiente; `verifyActivationToken` (404/410); `activateAccount` atómico → `{ token, sessionData }`
- [x] `auth.controller.ts` — `verifyActivationController`, `activateAccountController` (sin `try/catch`)
- [x] `auth.routes.ts` — `POST /activation/verify`, `POST /activation` (públicas, `validate` + `asyncHandler`)
- [x] `users.types.ts` — `WritableUserRole` + JA; `CreateUserDTO` sin `password`; `accountStatus`/`invitationExpiresAt` en DTO; `CreatedUserResponse`; `UpdateUserRequestor.userId`
- [x] `users.validation.ts` — `createAreaLeadSchema`; teacher sin `password`; `updateUserSchema` sin `password`; email `trim().toLowerCase()`; `roles` en `getUsersSchema`; `resendInvitationSchema`; `changeOwnPasswordSchema.newPassword` → `strongPasswordSchema`
- [x] `users.service.ts` — `issueInvitation`; `createUser` (Pendiente + envío, `invitationEmailSent`); `resendInvitation` (403/404/409/429/502); `updateUser` (403 self, sin password, reenvío por cambio de email Pendiente); `deleteUser` (403 self); `getUsersByFilters` (`roles`, JA listable, proyección de estado); `mapUserToDTO`
- [x] `users.controller.ts` — `resendInvitationController` (204); `createUserController` 201; pasar `req.user!._id` a update/delete
- [x] `users.routes.ts` — `POST /:userId/invitation` (`authorize([JEFE_DE_AREA])`)
- [x] Repaso: ninguna respuesta expone `passwordHash`/`activationTokenHash`

## Frontend (`quartz-web`)
- [x] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design`
- [x] `src/types/domain.ts` — `ACCOUNT_STATUSES` + `AccountStatus`
- [x] `src/utils/passwordPolicy.ts` — `PASSWORD_RULES`, `isStrongPassword`
- [x] `src/components/common/PasswordField.tsx` — extraído de `ChangePasswordForm` (no planeado, ver Notas del plan)
- [x] `src/components/common/PasswordRequirements.tsx`
- [x] `features/auth/types/` — `ActivationPreview`, `ActivateAccountRequest`; `activateAccount` en `AuthState`
- [x] `useAuthStore.ts` — acción `activateAccount` (login automático + WelcomeLoader)
- [x] `features/auth/queries/useActivationQuery.ts` — `useVerifyActivationQuery`
- [x] `features/auth/components/ActivateAccountForm.tsx`
- [x] `features/auth/pages/ActivateAccountPage.tsx` — estados loading / no válido / expiró / formulario
- [x] `App.tsx` — ruta pública `/activar-cuenta`
- [x] `features/users/types/api.ts` — `WritableUserRole`, `StaffRole`, `NewUser` sin password, `UserDto` estado, `CreatedUser`, `GetUsersQuery.roles`
- [x] `useUsersQuery.ts` — `roles` csv, `CreatedUser`, `useResendInvitationMutation`
- [x] `UserForm.tsx` — quitar contraseña; Select Rol en alta; cursos opcionales JA
- [x] `UsersTable.tsx` — columnas Rol y Estado, acción Reenviar, fila "(Tú)" sin acciones
- [x] `components/AccountStatusBadge.tsx` + `accountStatus.ts` (`getAccountStatusView`) — no planeados, ver Notas del plan
- [x] `UsersPage.tsx` — pestaña "Equipo docente", validaciones, toasts (incl. `invitationEmailSent: false`), reenvío
- [x] `features/account/components/ChangePasswordForm.tsx` — política fuerte + `PasswordRequirements`
- [x] `grep` usos de `role: 'Docente'` en `useUsersQuery` fuera de `UsersPage` y ajustar si aplica

## Docs
- [ ] `docs/roles-permissions.md` — alta JA, reenvío, restricción sobre sí mismo · **diferido a `/sdd-release`** (`/sdd-implement` no escribe docs)
- [ ] `docs/data-model.md` — fila `User` con `accountStatus` y token de activación · **diferido a `/sdd-release`**

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`, sin problemas nuevos) — lint: 17 preexistentes (9 errores) heredados, 0 nuevos
- [x] Servidores arrancan sin errores de compilación ni runtime
- [x] Repaso de aislamiento: toda query de `/api/users*` con `institutionId` del token; activación solo por hash (excepción pre-tenant documentada)
- [ ] Prueba manual del usuario (ver `plan.md` → Verificación) · pendiente, la hace el usuario

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
