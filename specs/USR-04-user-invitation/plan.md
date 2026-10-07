# USR-04 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `package.json` (+ `nodemailer`, `@types/nodemailer`) |
| crear | `src/utils/activationToken.ts` |
| crear | `src/services/mail.service.ts` |
| crear | `src/services/invitation-email.template.ts` |
| tocar | `src/features/auth/auth.types.ts` |
| tocar | `src/features/auth/auth.model.ts` |
| tocar | `src/features/auth/auth.validation.ts` |
| tocar | `src/features/auth/auth.service.ts` |
| tocar | `src/features/auth/auth.controller.ts` |
| tocar | `src/features/auth/auth.routes.ts` |
| tocar | `src/features/users/users.types.ts` |
| tocar | `src/features/users/users.validation.ts` |
| tocar | `src/features/users/users.service.ts` |
| tocar | `src/features/users/users.controller.ts` |
| tocar | `src/features/users/users.routes.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/types/domain.ts` (`ACCOUNT_STATUSES` + `AccountStatus`) |
| crear | `src/components/common/PasswordRequirements.tsx` |
| crear | `src/utils/passwordPolicy.ts` |
| tocar | `src/features/auth/types/api.ts` |
| tocar | `src/features/auth/types/store.ts` |
| tocar | `src/features/auth/useAuthStore.ts` |
| crear | `src/features/auth/queries/useActivationQuery.ts` |
| crear | `src/features/auth/components/ActivateAccountForm.tsx` |
| crear | `src/features/auth/pages/ActivateAccountPage.tsx` |
| tocar | `src/App.tsx` |
| tocar | `src/features/users/types/api.ts` |
| tocar | `src/features/users/queries/useUsersQuery.ts` |
| tocar | `src/features/users/components/UserForm.tsx` |
| tocar | `src/features/users/components/UsersTable.tsx` |
| tocar | `src/features/users/pages/UsersPage.tsx` |
| tocar | `src/features/account/components/ChangePasswordForm.tsx` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/roles-permissions.md` (sección Usuarios) |
| tocar | `docs/data-model.md` (fila `User`) |

## Contratos
### Tipos / DTOs
```ts
// auth.types.ts
export enum UserAccountStatus { PENDIENTE = 'Pendiente', ACTIVO = 'Activo' }
export interface IActivationPreview { email: string; firstName: string; institutionName: string }

// users.types.ts
export type WritableUserRole = UserRole.ESTUDIANTE | UserRole.DOCENTE | UserRole.JEFE_DE_AREA;
// CreateUserDTO: se elimina `password`; `email` requerido si role ∈ {Docente, Jefe de Área}
// UserWithValuations: + accountStatus?: UserAccountStatus; + invitationExpiresAt?: string (ISO, solo Pendiente)
export type CreatedUserResponse = UserWithValuations & { invitationEmailSent: boolean };
// UpdateUserDTO: sin `password` (hereda de CreateUserDTO)
// UpdateUserRequestor: + userId: string
```

### Modelo Mongoose (`User`)
| Campo | Tipo | Notas |
|---|---|---|
| `accountStatus` | `String`, enum `UserAccountStatus` | opcional, sin default. Ausente ⇒ Activo |
| `activationTokenHash` | `String` | `select: false` |
| `activationTokenExpiresAt` | `Date` | opcional |
| `invitationSentAt` | `Date` | opcional; enfriamiento 60 s |

- Índice: `{ activationTokenHash: 1 }` `unique + sparse`.
- `SafeUser = Omit<IUser, 'passwordHash' | 'activationTokenHash'>`; `toSafeUser` no copia campos de token.

### `utils/activationToken.ts`
- `INVITATION_TTL_DAYS = 15`, `INVITATION_RESEND_COOLDOWN_MS = 60_000`.
- `generateActivationToken(): { token: string; tokenHash: string; expiresAt: Date }` — `randomBytes(32).toString('base64url')`, SHA-256 hex.
- `hashActivationToken(token: string): string`.

### `services/mail.service.ts`
- Transporte Nodemailer creado en el primer uso (patrón `r2.service.ts`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`'true'`), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. Falta de variables ⇒ `Error` (lo captura el llamador).
- `sendMail({ to, subject, html, text }): Promise<void>`.

### `services/invitation-email.template.ts`
- `buildInvitationEmail({ firstName, role, institutionName, shieldJpgUrl?, activationUrl, expiresAt }): { subject, html, text }`.
- HTML con estilos inline y tabla (compatibilidad Outlook/Gmail). Escudo JPG (WebP no se muestra en Outlook). Fecha `toLocaleDateString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long' })`.
- Valores del usuario escapados (HTML).

### Zod
| Schema | Forma |
|---|---|
| `strongPasswordSchema` (`auth.validation.ts`, exportado) | `string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/)` con mensajes en español |
| `verifyActivationSchema` | `{ body: { token: string().min(1) }.strict() }` |
| `activateAccountSchema` | `{ body: { token, password: strongPasswordSchema, confirmPassword }.strict().refine(igualdad, path confirmPassword) }` |
| `createUserSchema` | `discriminatedUnion('role', [student, teacher, areaLead])`; teacher sin `password`; `areaLead`: `gradesTaught` `.optional()`, `email` requerido. `email: z.string().trim().toLowerCase().email()` |
| `updateUserSchema` | se quita `password`; `email` con `trim().toLowerCase()` |
| `getUsersSchema.query` | + `roles`: csv → array de `Docente`/`Jefe de Área` (`transform` + `refine`) |
| `resendInvitationSchema` | `{ params: { userId: objectId }.strict() }` |
| `changeOwnPasswordSchema.newPassword` | → `strongPasswordSchema` |

> Revisar la entrada de `.strict()` en `quartz-api/docs/known-issues.md` antes de escribir los schemas.

### Endpoints
| Método | Ruta | Rol | Middlewares | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/activation/verify` | público | `validate(verifyActivationSchema)` | `200 IActivationPreview` · `404` · `410` |
| POST | `/api/auth/activation` | público | `validate(activateAccountSchema)` | `200 { token, sessionData }` · `400` · `404` · `410` |
| POST | `/api/users` | Jefe de Área | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(createUserSchema)` | `201 CreatedUserResponse` |
| GET | `/api/users?roles=Docente,Jefe de Área` | JA | sin cambio de cadena | `200 UserWithValuations[]` |
| PATCH | `/api/users/:userId` | JA, Docente | sin cambio de cadena | `403` si `userId === req.user._id` |
| DELETE | `/api/users/:userId` | JA | sin cambio de cadena | `403` si es él mismo |
| POST | `/api/users/:userId/invitation` | JA | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(resendInvitationSchema)` | `204` · `403` · `404` · `409` · `429` · `502` |

### Service — `auth.service.ts`
- `login`: tras `findOne({ email })`, si `accountStatus === PENDIENTE` ⇒ `AppError(<mensaje spec>, 403)` (fuera del `try/catch` genérico, o re-lanzar `AppError`).
- `verifyActivationToken(token)`: `User.findOne({ activationTokenHash })` ⇒ null ⇒ 404; `accountStatus !== PENDIENTE` ⇒ 404; vencido ⇒ 410; lee `Institution.name` por `user.institutionId`.
- `activateAccount(token, password)`: `bcrypt.hash(password, 10)`; `User.findOneAndUpdate({ activationTokenHash, accountStatus: PENDIENTE, activationTokenExpiresAt: { $gt: now } }, { $set: { passwordHash, accountStatus: ACTIVO, updatedAt }, $unset: { activationTokenHash: 1, activationTokenExpiresAt: 1, invitationSentAt: 1 } }, { new: true })`. Null ⇒ reconsulta por hash para devolver 410 (existe y vencido) o 404. Éxito ⇒ `toSafeUser` → `getSessionData` + `generateJWT`.
- Consultas por hash sin `institutionId`: comentario explícito de excepción pre-tenant (igual que `login`).

### Service — `users.service.ts`
- `issueInvitation(institutionId, userId): Promise<void>` (no exportada): `generateActivationToken` → `findOneAndUpdateScoped` `$set { activationTokenHash, activationTokenExpiresAt, invitationSentAt: now }` → `findByIdScoped(Institution…)` (name, shieldJpgUrl) → `buildInvitationEmail` → `sendMail`. El token persiste antes del envío.
- `createUser`: rama Docente/JA (`role !== ESTUDIANTE`): `assertUniqueEmail`, `userData.email`, `accountStatus: PENDIENTE`; sin `passwordHash`. Tras crear: `try { await issueInvitation } catch { invitationEmailSent = false; console.error }`.
- `resendInvitation(institutionId, userId, requestorId)`: orden de guardas `403 self → 404 → 409 → 429`; `issueInvitation` en `try/catch` ⇒ `AppError('No se pudo enviar el correo de invitación. Inténtalo de nuevo.', 502)`.
- `updateUser`: guarda `403` self; quita rama `password`; si `email` cambia y `existing.accountStatus === PENDIENTE` ⇒ tras el update, `issueInvitation` (fallo ⇒ `502` con el usuario ya actualizado; mensaje indica reenviar).
- `deleteUser(institutionId, userId, requestorId)`: guarda `403` self.
- `getUsersByFilters`: `roles?: UserRole[]`; admite `DOCENTE` y `JEFE_DE_AREA` solo si `requestorRole === JEFE_DE_AREA` (Docente ⇒ `[]`); filtro `role: { $in }`; proyecta `accountStatus` y `activationTokenExpiresAt` (el hash nunca). DTO: `invitationExpiresAt` solo si Pendiente.
- `mapUserToDTO`: + `accountStatus`, `invitationExpiresAt`.

### Controller
- `activateAccountController`, `verifyActivationController` en `auth.controller.ts`.
- `resendInvitationController` (`res.status(204).end()`); `updateUserController`/`deleteUserController` pasan `req.user!._id.toString()`.
- `createUserController` responde `201` con `CreatedUserResponse`.

### Frontend
- **`utils/passwordPolicy.ts`:** `PASSWORD_RULES` (`id`, `label`, `test`) + `isStrongPassword(p)` — espejo de `strongPasswordSchema`.
- **`components/common/PasswordRequirements.tsx`:** lista en vivo de `PASSWORD_RULES` (check verde / gris). Reutilizado en activación y `ChangePasswordForm`.
- **`types/domain.ts`:** `ACCOUNT_STATUSES = ['Pendiente', 'Activo'] as const` + `AccountStatus`.
- **Auth:**
  - `types/api.ts`: `ActivationPreview`, `ActivateAccountRequest { token; password; confirmPassword }`; respuesta = `LoginResponse`.
  - `useAuthStore.activateAccount(req)`: `apiPost<LoginResponse>('/auth/activation', req)` → `set({ token, sessionData, showWelcomeLoader: true })`; relanza el error para que la página muestre toast.
  - `queries/useActivationQuery.ts`: `useVerifyActivationQuery(token)` → `apiPost('/auth/activation/verify', { token })`, `enabled: !!token`, `retry: false`, `staleTime: 0`.
  - `pages/ActivateAccountPage.tsx`: `useSearchParams().get('token')`; estados: sin token/404 ⇒ vista "no válido"; 410 ⇒ vista "expiró"; loading ⇒ `Loading`; ok ⇒ `ActivateAccountForm`. Éxito ⇒ `navigate('/dashboard', { replace: true })`. Layout visual del login (`PresentationPanel`).
  - `components/ActivateAccountForm.tsx`: correo `readOnly`, contraseña + confirmación con toggle de visibilidad, `autocomplete="new-password"`, `PasswordRequirements`, submit deshabilitado hasta `isStrongPassword && coincide`.
  - `App.tsx`: `<Route path="/activar-cuenta" element={<ActivateAccountPage />} />` junto a `/login` (pública).
- **Users:**
  - `types/api.ts`: `WritableUserRole` + `'Jefe de Área'`; `StaffRole = Extract<UserRole, 'Docente' | 'Jefe de Área'>`; `NewUser` sin `password`; `UserDto` + `accountStatus?`, `invitationExpiresAt?`; `CreatedUser = UserDto & { invitationEmailSent: boolean }`; `GetUsersQuery` + `roles?: StaffRole[]` (serializado como csv en `useUsersQuery`).
  - `useUsersQuery.ts`: `useCreateUserMutation` tipado a `CreatedUser`; `useResendInvitationMutation` (`apiPost('/users/:id/invitation')`, invalida `['users']`).
  - `UsersPage.tsx`: `ROLE_TABS = [Estudiante, { value: 'staff', label: 'Equipo docente' }]`; query por pestaña (`role: 'Estudiante'` | `roles: ['Docente','Jefe de Área']`); estado `formRole` elegido en el form para altas del equipo; validación `email` obligatorio; toast de advertencia si `!invitationEmailSent`; `handleResendInvitation` con `toast.promise`; `currentUserId = sessionData.user._id`.
  - `UserForm.tsx`: sin `password`; Select **Rol** (solo alta en pestaña equipo, `menuProps placement` según memoria de popovers); `gradesTaught` etiquetado "(opcional)" si JA; `email` para Docente y JA.
  - `UsersTable.tsx`: en pestaña equipo, columnas **Rol** (badge por rol) y **Estado** (`getAccountStatusLabel(user, now)` ⇒ Activo verde · Pendiente azul · Invitación vencida ámbar); acción "Reenviar invitación" en no activos; fila propia con "(Tú)" y sin acciones.
- **Account:** `ChangePasswordForm.tsx` usa `isStrongPassword` + `PasswordRequirements` para `newPassword`.

## Notas
- **Token por hash SHA-256**, no bcrypt: entropía de 256 bits ⇒ sin fuerza bruta; permite lookup por igualdad con índice.
- **POST** para verificar/activar: el token no queda en logs de acceso ni en caché.
- **Nunca 401** en activación: el interceptor de `apiClient` haría `logout()`; se usan `404`/`410`/`400`.
- **Atomicidad:** el filtro de `findOneAndUpdate` incluye hash + estado + vigencia ⇒ un token no se usa dos veces.
- **Fallo SMTP no revierte el alta:** el token se persiste antes de enviar; el reenvío genera otro.
- **`accountStatus` sin default:** los usuarios existentes (sin campo) quedan Activos sin migración; Estudiantes nunca lo tienen.
- **Login Pendiente 403 específico:** decisión explícita del usuario; revela que el correo existe (aceptado).
- **Sin `.env.example`** en `quartz-api`: las variables nuevas se documentan en este plan y en el PR.
- **Rama base:** `feat/USR-04-user-invitation` sale de `feat/USR-03-my-account` (depende de `ChangePasswordForm` y `/me/password`).
- Diseño web: invocar `emil-design-eng`, `impeccable` y `frontend-design` antes de la UI (regla de `quartz-web/CLAUDE.md`).

## Desviaciones durante la implementación
- **`validate()` no reescribe `req.body`/`req.query`** con el resultado de Zod: los `transform` no llegan al controller. El email se normaliza (`trim().toLowerCase()`) en `users.service.ts#normalizeEmail` y el CSV de `roles` se separa en `getUsers` (controller). El `.trim()` de Zod solo valida.
- **`updateUserSchema.gradesTaught`** pierde `.min(1)` (un Jefe de Área puede no tener cursos); el service responde `400` si se vacía el de un Docente.
- **`src/components/common/PasswordField.tsx`** (nuevo): extraído de `ChangePasswordForm` para reutilizarlo en la activación; `PasswordRequirements.tsx` también exporta `PasswordRequirement`.
- **`src/features/users/components/AccountStatusBadge.tsx`** + **`src/features/users/accountStatus.ts`** (nuevos): badge de estado con la gramática de `ValuationStatusBadge`; `getAccountStatusView` vive aparte por `react-refresh/only-export-components`.
- `STAFF_ROLES` (api `users.types.ts` y web `users/types/api.ts`) como fuente única de los roles invitables.
- Docs (`roles-permissions.md`, `data-model.md`) quedan para `/sdd-release`.

## Variables de entorno nuevas (`quartz-api`)
| Variable | Ejemplo |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` (`true` para 465) |
| `SMTP_USER` | usuario SMTP |
| `SMTP_PASS` | contraseña / app password |
| `MAIL_FROM` | `"Quartz <no-reply@dominio.com>"` |
| `WEB_ORIGIN` | ya existe; base del enlace |

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual (usuario, SMTP de prueba Mailtrap/Ethereal): alta Docente y JA → correo → activar → login automático; reusar enlace ⇒ "no válido"; `activationTokenExpiresAt` en el pasado ⇒ "expiró"; reenviar dos veces en < 60 s ⇒ 429; login de Pendiente ⇒ mensaje; cambiar correo de Pendiente ⇒ nuevo correo; PATCH/DELETE propio por API ⇒ 403.
