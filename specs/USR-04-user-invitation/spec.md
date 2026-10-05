---
id: USR-04-user-invitation
feature: user-invitation
status: implemented
created: 2026-09-22
---

# USR-04 — Alta de usuarios por invitación con enlace seguro (spec)

## Objetivo
Que el Jefe de Área dé de alta Docentes y Jefes de Área sin conocer ni fijar su contraseña: el sistema envía por correo un enlace de activación de un solo uso (15 días) y el propio usuario crea su contraseña.

## Alcance
**Incluye:**
- Alta de **Docente** y **Jefe de Área** sin contraseña; estado `Pendiente` hasta activar.
- Token de activación aleatorio, guardado como hash, vigencia 15 días, un solo uso.
- Envío de correo de invitación por SMTP (Nodemailer) con marca de la institución.
- Pantalla pública `/activar-cuenta?token=…` con creación de contraseña y login automático.
- Reenvío de invitación por el Jefe de Área (enfriamiento 60 s).
- Pestaña **"Equipo docente"** (Docente + Jefe de Área) en `/gestion/usuarios`, columnas **Rol** y **Estado**.
- Eliminación del campo contraseña en alta **y** edición de usuarios.
- Política de contraseña fuerte en activación y en "Cambiar contraseña" (USR-03).

**Fuera:**
- "Olvidé mi contraseña" / recuperación por correo.
- Endpoint público para solicitar un nuevo enlace.
- Rate-limit por IP o global; cola de correos y reintentos automáticos.
- Revocación de JWT emitidos.
- Historial de invitaciones.
- Cambios sobre Estudiantes.
- Cambio de rol de un usuario existente.
- Migración de datos: usuarios existentes sin `accountStatus` se consideran `Activo`.

## Criterios de aceptación (EARS)

**Alta (Jefe de Área)**
- [x] Cuando el Jefe de Área abre "Crear" en la pestaña "Equipo docente", el sistema muestra un selector **Rol** (Docente / Jefe de Área) y ningún campo de contraseña.
- [x] Cuando el Jefe de Área envía un alta válida de Docente o Jefe de Área, el sistema crea el usuario con `accountStatus: 'Pendiente'`, sin `passwordHash`, y responde `201` con el usuario e `invitationEmailSent`.
- [x] Si el rol es Docente y `gradesTaught` está vacío, el sistema responde `400`; si el rol es Jefe de Área, `gradesTaught` es opcional.
- [x] Si falta `email` en un alta de Docente o Jefe de Área, el sistema responde `400`.
- [x] Si el body incluye `password`, el sistema responde `400`.
- [x] Si el `email` ya pertenece a otro usuario, el sistema responde `409` y no crea nada.
- [x] El sistema guarda el `email` en minúsculas y sin espacios.

**Token**
- [x] Cuando se crea una invitación, el sistema genera un token de 32 bytes aleatorios (`crypto.randomBytes`), guarda solo su hash SHA-256 en `activationTokenHash` y fija `activationTokenExpiresAt = ahora + 15 días`.
- [x] Cuando se emite una invitación nueva para un usuario, el sistema reemplaza el token anterior, que deja de ser válido.
- [x] Ninguna respuesta de la API incluye `passwordHash` ni `activationTokenHash`.

**Correo**
- [x] Cuando se crea o reenvía una invitación, el sistema envía un correo al `email` del usuario con asunto "Activa tu cuenta en Quartz — <Institución>", versión HTML y texto, en español.
- [x] El correo incluye nombre de la institución, escudo (`shieldJpgUrl`) si existe, nombre y rol del invitado, botón "Activar mi cuenta" con enlace `${WEB_ORIGIN}/activar-cuenta?token=<token>` y fecha de vencimiento (`es-CO`, `America/Bogota`).
- [x] Si el envío falla al crear el usuario, el sistema conserva el usuario `Pendiente`, responde `201` con `invitationEmailSent: false` y la UI muestra un toast de advertencia que sugiere "Reenviar invitación".

**Activación (público)**
- [x] Cuando un usuario abre `/activar-cuenta?token=…` con un token vigente, el sistema muestra su correo en solo lectura, su nombre, la institución y un formulario de contraseña + confirmación.
- [x] El formulario muestra en vivo los requisitos (≥8 caracteres, 1 mayúscula, 1 minúscula, 1 número), permite alternar visibilidad y usa `autocomplete="new-password"`.
- [x] Cuando el usuario envía una contraseña válida y la confirmación coincide, el sistema guarda `passwordHash` (bcrypt), fija `accountStatus: 'Activo'`, elimina `activationTokenHash`, `activationTokenExpiresAt` e `invitationSentAt`, y responde `200` con `{ token, sessionData }`.
- [x] Cuando la activación responde `200`, el cliente inicia sesión automáticamente (WelcomeLoader) y navega a `/dashboard`.
- [x] Si la contraseña no cumple la política o no coincide con la confirmación, el sistema responde `400`; el formulario bloquea el envío antes de llamar a la API.
- [x] Si dos solicitudes de activación usan el mismo token a la vez, solo una tiene éxito (actualización atómica).

**Enlace inválido o vencido**
- [x] Si el token no existe, ya se usó o falta en la URL, el sistema responde `404` y la pantalla muestra "Este enlace no es válido o ya fue usado" con botón a `/login`.
- [x] Si el token existe pero `activationTokenExpiresAt` ya pasó, el sistema responde `410` y la pantalla muestra "Este enlace expiró. Pide a tu Jefe de Área que te envíe uno nuevo." con botón a `/login`.
- [x] Ningún endpoint de activación responde `401`.

**Reenvío**
- [x] Cuando el Jefe de Área pulsa "Reenviar invitación" sobre un usuario `Pendiente` (vigente o vencido), el sistema emite un token nuevo de 15 días, envía el correo y responde `204`.
- [x] Si el usuario objetivo está `Activo`, el sistema responde `409`.
- [x] Si el último envío fue hace menos de 60 s, el sistema responde `429` y no envía nada.
- [x] Si el objetivo es Estudiante o no existe en la institución del token, el sistema responde `404`.
- [x] Si el envío SMTP falla en el reenvío, el sistema responde `502` con mensaje de error.
- [x] Solo el Jefe de Área puede reenviar (`403` para Docente).

**Edición y eliminación**
- [x] El formulario de edición no muestra campo de contraseña y `PATCH /api/users/:userId` responde `400` si recibe `password`.
- [x] El rol no se puede cambiar al editar.
- [x] Cuando el Jefe de Área cambia el `email` de un usuario `Pendiente`, el sistema invalida el token anterior y envía una invitación nueva al correo nuevo.
- [x] El Jefe de Área puede editar, eliminar y reenviar invitación a otros Jefes de Área de su institución.
- [x] Si el Jefe de Área intenta editar, eliminar o reenviar invitación sobre sí mismo por `/api/users/:userId*`, el sistema responde `403` ("Gestiona tu cuenta desde Mi cuenta.").

**Login**
- [x] Si un usuario `Pendiente` intenta iniciar sesión, el sistema responde `403` con "Tu cuenta aún no está activada. Revisa el correo de invitación o pide a tu Jefe de Área un nuevo enlace." y la pantalla de login lo muestra.
- [x] Los usuarios sin `accountStatus` (existentes) inician sesión igual que hoy.

**Tabla `/gestion/usuarios`**
- [x] El sistema muestra las pestañas "Estudiantes" y "Equipo docente"; esta última lista Docentes y Jefes de Área (solo visible para el Jefe de Área).
- [x] La pestaña "Equipo docente" muestra una columna **Rol** (badge) y una columna **Estado**: "Activo", "Pendiente" o "Invitación vencida" (`Pendiente` con `invitationExpiresAt` pasado).
- [x] Las filas no activas muestran la acción "Reenviar invitación".
- [x] La fila del Jefe de Área autenticado se marca "(Tú)" y no muestra acciones de editar, eliminar ni reenviar.

**Cambiar contraseña (USR-03)**
- [x] Si `newPassword` en `PATCH /api/users/me/password` no cumple la política fuerte, el sistema responde `400`; el formulario muestra el mismo checklist de requisitos que la activación.

**Transversal**
- [x] **Aislamiento:** toda lectura/escritura de `/api/users*` filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`. Las consultas por hash de token en `/api/auth/activation*` son la única excepción pre-tenant (como `login`) y solo tocan el usuario dueño del token.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web` (sin problemas nuevos: 17 preexistentes heredados de USR-03/INF-04).

## Dependencias
- `USR-01-user-management` (CRUD de usuarios, `UserForm`, `UsersTable`).
- `USR-02-teacher-ui-permissions` (`usePermissions`, alcance por sede).
- `USR-03-my-account` (`changeOwnPasswordSchema`, `ChangePasswordForm`; rama base).
- `ACAD-03-image-uploads` (`Institution.shieldJpgUrl`).
- Servidor SMTP accesible y variables `SMTP_*` / `MAIL_FROM` configuradas.

## Trazabilidad
- Backend:  `quartz-api/src/features/users/`, `quartz-api/src/features/auth/`, `quartz-api/src/services/mail.service.ts`
- Frontend: `quartz-web/src/features/users/`, `quartz-web/src/features/auth/`, `quartz-web/src/features/account/`
- Docs:     `docs/roles-permissions.md`, `docs/data-model.md`
- Branch:   `feat/USR-04-user-invitation` (desde `feat/USR-03-my-account`)
