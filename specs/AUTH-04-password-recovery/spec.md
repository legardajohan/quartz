---
id: AUTH-04-password-recovery
feature: password-recovery
status: implemented        # draft | approved | implemented | released
created: 2026-10-07
---

# AUTH-04 — Recuperar contraseña por correo (spec)

## Objetivo
Que un Docente o Jefe de Área que olvidó su contraseña reciba por correo un enlace de un solo uso (1 h) para crear una nueva, con el mismo diseño y mecánica de la invitación de USR-04.

## Alcance
**Incluye:**
- Endpoint público para solicitar el enlace (respuesta genérica, sin revelar si el correo existe).
- Token aleatorio guardado como hash SHA-256 en campos propios de `User`; vigencia 1 h; un solo uso; enfriamiento 60 s.
- Correo de recuperación con el layout de "Correo de creación de contraseña" (`invitation-email.template.ts`).
- Cuenta `Pendiente` que pide recuperación ⇒ se le reenvía la invitación (`issueInvitation`).
- Pantallas públicas `/recuperar-contrasena` y `/restablecer-contrasena?token=…`.
- Aviso en `/login` tras restablecer.
- Invalidación del enlace pendiente al cambiar la contraseña por "Mi cuenta" o al activar la cuenta.

**Fuera:**
- Rate-limit por IP o global; cola de correos y reintentos.
- Revocación de JWT emitidos (las sesiones abiertas siguen vivas hasta vencer).
- Estudiantes (no tienen correo ni contraseña).
- Login automático tras restablecer.
- Cambios a `PasswordRequirements.tsx` (AUTH-03).

## Criterios de aceptación (EARS)

**Solicitud**
- [x] Cuando se envía un `email` con formato válido a `POST /api/auth/password-reset/request`, el sistema responde `200 { message }` con el mismo mensaje, exista o no el correo, sea cual sea su estado y aunque falle el SMTP.
- [x] Si el `email` no tiene formato válido o el body trae campos extra, el sistema responde `400`.
- [x] El sistema busca el correo normalizado (`trim().toLowerCase()`) y solo entre roles `Docente` y `Jefe de Área`.
- [x] Si el correo es de un usuario `Activo` (o sin `accountStatus`) con `passwordHash`, el sistema genera un token de 32 bytes (`crypto.randomBytes`), guarda solo su hash SHA-256 en `passwordResetTokenHash`, fija `passwordResetTokenExpiresAt = ahora + 1 h` y `passwordResetSentAt = ahora`, y envía el correo.
- [x] Cuando se emite un token nuevo, el anterior deja de ser válido.
- [x] Si `passwordResetSentAt` es de hace < 60 s, el sistema no genera token ni envía correo (misma respuesta `200`).
- [x] Si el usuario está `Pendiente`, el sistema emite una invitación nueva con `issueInvitation` (15 días, plantilla de activación) salvo que `invitationSentAt` sea de hace < 60 s; no genera token de recuperación.
- [x] El token se persiste antes del envío y la respuesta no espera al SMTP; un fallo de envío solo se registra en el log del servidor.

**Correo**
- [x] El correo tiene asunto "Restablece tu contraseña de Quartz", versión HTML y texto, en español.
- [x] El correo usa el mismo layout que la invitación (logo Quartz, tarjeta blanca, botón morado `BRAND_PURPLE`, preheader, pie automático) e incluye: saludo con `firstName`, nombre de la institución, botón "Restablecer contraseña" con enlace `${WEB_ORIGIN}/restablecer-contrasena?token=<token>`, vigencia ("vence en 1 hora", a las `hh:mm` `es-CO` / `America/Bogota`), "solo se puede usar una vez", enlace en texto plano y "Si no pediste este cambio, ignora este correo; tu contraseña actual sigue funcionando."
- [x] Los valores del usuario se escapan (HTML).
- [x] El correo de invitación existente se ve igual que antes del refactor del layout.

**Verificación del enlace (público)**
- [x] Cuando se envía un token vigente a `POST /api/auth/password-reset/verify`, el sistema responde `200 { email, firstName }`.
- [x] Si el token no existe, ya se usó o falta, el sistema responde `404` ("Este enlace no es válido o ya fue usado.").
- [x] Si el token existe pero `passwordResetTokenExpiresAt` ya pasó, el sistema responde `410` ("Este enlace expiró. Solicita uno nuevo.").

**Restablecer (público)**
- [x] Cuando se envía a `POST /api/auth/password-reset` un token vigente, una contraseña que cumple `strongPasswordSchema` y una confirmación igual, el sistema guarda `passwordHash` (bcrypt), elimina `passwordResetTokenHash`, `passwordResetTokenExpiresAt` y `passwordResetSentAt`, y responde `204`.
- [x] Si la contraseña no cumple la política o no coincide con la confirmación, el sistema responde `400`; el formulario bloquea el envío antes de llamar a la API.
- [x] Si dos solicitudes usan el mismo token a la vez, solo una tiene éxito (actualización atómica); la otra recibe `404`.
- [x] Ningún endpoint de `/api/auth/password-reset*` responde `401`.
- [x] Ninguna respuesta de la API incluye `passwordResetTokenHash`.

**Invalidación**
- [x] Cuando el usuario cambia su contraseña por `PATCH /api/users/me/password`, el sistema elimina los campos de recuperación.
- [x] Cuando un usuario activa su cuenta (`POST /api/auth/activation`), el sistema elimina los campos de recuperación.

**Web**
- [x] Cuando el usuario pulsa "Recuperar" en `/login`, el sistema navega a `/recuperar-contrasena` con el correo escrito prellenado.
- [x] En `/recuperar-contrasena`, cuando el usuario envía un correo válido, el sistema muestra una vista de confirmación genérica ("Si el correo está registrado, te enviamos un enlace…", revisa spam, vence en 1 h) con botón "Volver a iniciar sesión".
- [x] Cuando un usuario abre `/restablecer-contrasena?token=…` con token vigente, el sistema muestra su correo en solo lectura, su nombre y un formulario de contraseña + confirmación con `PasswordRequirements`, toggle de visibilidad y `autocomplete="new-password"`.
- [x] Si falta el token o la verificación responde `404`, la pantalla muestra "Este enlace no es válido" con botón "Ir a iniciar sesión".
- [x] Si la verificación responde `410`, la pantalla muestra "Este enlace expiró" con botón "Solicitar un enlace nuevo" (→ `/recuperar-contrasena`).
- [x] Si el envío del formulario responde `404`/`410`, la pantalla cambia a la vista correspondiente.
- [x] Cuando el restablecimiento responde `204`, el sistema navega a `/login` (replace) y muestra el aviso "Tu contraseña se actualizó. Inicia sesión con la nueva." con el correo prellenado.
- [x] `/activar-cuenta` conserva su comportamiento y textos tras extraer componentes compartidos.

**Transversal**
- [x] **Aislamiento:** las consultas por `email` (solicitud) y por hash de token (verificación/restablecer) son pre-tenant, como `login` y la activación, y solo leen/escriben el documento del usuario dueño. El reenvío de invitación usa el `institutionId` del propio documento, nunca de `body`/`params`. Ninguna operación acepta `institutionId` de la petición.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web` (sin problemas nuevos).

## Dependencias
- `USR-04-user-invitation` (`mail.service.ts`, `invitation-email.template.ts`, `utils/activationToken.ts`, `strongPasswordSchema`, `PasswordField`, `PasswordRequirements`, `ActivateAccountPage`).
- `USR-03-my-account` (`changeOwnPassword`).
- `USR-06-bulk-import-fixes` (config SMTP con pool y timeouts).
- `AUTH-03-compact-password-requirements` (rama base; checklist compacto que reutilizan las pantallas nuevas).
- Variables `SMTP_*`, `MAIL_FROM`, `WEB_ORIGIN` configuradas.

## Trazabilidad
- Backend:  `quartz-api/src/features/auth/`, `quartz-api/src/services/`, `quartz-api/src/utils/activationToken.ts`, `quartz-api/src/features/users/users.service.ts`
- Frontend: `quartz-web/src/features/auth/`, `quartz-web/src/App.tsx`
- Branch:   `feat/AUTH-04-password-recovery` (desde `feat/AUTH-03-compact-password-requirements`, worktree `../quartz-auth-04`)
