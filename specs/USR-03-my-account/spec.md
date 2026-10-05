---
id: USR-03-my-account
feature: my-account
status: implemented
created: 2026-09-22
---

# USR-03 — Mi cuenta: perfil propio y cambio de contraseña (spec)

## Objetivo
Dar al Jefe de Área y al Docente autoservicio sobre su propia cuenta: ver y actualizar sus datos, subir su foto y cambiar su contraseña, desde un menú de usuario depurado.

## Alcance
**Incluye:**
- Pantallas `/mi-cuenta/perfil` (**Mi perfil**) y `/mi-cuenta/contrasena` (**Cambiar contraseña**), sin navegación propia entre ellas: se accede desde el menú de usuario.
- Endpoints `GET|PATCH /api/users/me`, `PATCH /api/users/me/password`, `PATCH /api/users/me/photo`.
- Menú de usuario: "Mi perfil", "Cambiar contraseña", "Cerrar sesión", con iconos `lucide-react`.
- `avatarUrl` en `sessionData.user` para mostrar la foto propia en el menú.

**Fuera:**
- Revocación de JWT ya emitidos tras cambiar la contraseña.
- Rate-limit / bloqueo por intentos fallidos de contraseña.
- Recuperación de contraseña por correo.
- Rol Estudiante (sin acciones en esta fase).
- Cambios en `/gestion/usuarios` y en `PATCH /api/users/:userId`.
- Cambiar rol o `gradesTaught` propios.

## Criterios de aceptación (EARS)

**Menú de usuario**
- [x] Cuando un usuario abre el menú de usuario, el sistema muestra exactamente tres ítems: "Mi perfil" (`UserRound`), "Cambiar contraseña" (`KeyRound`), "Cerrar sesión" (`LogOut`), iconos de `lucide-react`.
- [x] El sistema no muestra los ítems "Editar perfil", "Bandeja de entrada" ni "Ayuda".
- [x] Cuando el usuario elige "Mi perfil", el sistema navega a `/mi-cuenta/perfil`; cuando elige "Cambiar contraseña", a `/mi-cuenta/contrasena`.
- [x] Cuando el usuario elige "Cerrar sesión", el sistema ejecuta `logout()` igual que hoy.
- [x] Si `sessionData.user.avatarUrl` existe, el menú muestra esa foto; si no, `AVATAR_FALLBACK`.

**Rutas `/mi-cuenta/*`**
- [x] Cuando un usuario autenticado abre `/mi-cuenta`, el sistema redirige a `/mi-cuenta/perfil`.
- [x] Si la subruta no existe (p. ej. `/mi-cuenta/otra`), el sistema muestra la página 404 existente.
- [x] El sistema no muestra pestañas ni otra navegación entre `/mi-cuenta/perfil` y `/mi-cuenta/contrasena`; cada pantalla muestra su propio título.
- [x] Si el usuario no está autenticado, el sistema redirige a `/login` (`ProtectedRoute`).

**Perfil — ambos roles**
- [x] Cuando el usuario abre la sección Mi perfil, el sistema muestra sus datos actuales (`GET /api/users/me`): nombres, apellidos, tipo y número de identificación, teléfono, correo, sede, rol y foto.
- [x] Cuando el usuario guarda cambios en `firstName`, `middleName`, `lastName`, `secondLastName`, `identificationType`, `identificationNumber` o `phoneNumber`, el sistema los persiste y responde `200` con el perfil actualizado.
- [x] Cuando el perfil se actualiza, el sistema refresca `sessionData` y el menú muestra el nombre nuevo sin recargar la página.
- [x] Si no hay cambios respecto a los datos cargados, el sistema deshabilita "Guardar".
- [x] Si `identificationNumber` ya pertenece a otro usuario de la institución, el sistema responde `409` y no modifica nada.
- [x] Si el body incluye un campo fuera de la lista permitida (p. ej. `role`, `password`, `gradesTaught`, `institutionId`), el sistema responde `400`.

**Perfil — Docente**
- [x] Cuando un Docente abre la sección Mi perfil, el sistema muestra correo y sede en solo lectura con la indicación "Solo el Jefe de Área puede cambiarlo".
- [x] Si la petición de un Docente incluye `email` o `schoolId`, el sistema responde `403` y no modifica nada.

**Perfil — Jefe de Área**
- [x] Cuando un Jefe de Área guarda `email` o `schoolId` además de los campos comunes, el sistema los persiste.
- [x] Si el `email` ya pertenece a otro usuario, el sistema responde `409`.
- [x] Si `schoolId` no existe en la institución del token, el sistema responde `422`.

**Foto propia**
- [x] Cuando el usuario recorta y sube una imagen desde la sección Mi perfil, el sistema la guarda como WebP, reemplaza `avatarUrl`, borra la foto anterior del almacenamiento y el menú muestra la nueva.
- [x] Si el archivo no es WebP válido tras el recorte, el sistema responde `422`.

**Contraseña**
- [x] Cuando el usuario envía contraseña actual correcta y la nueva repetida dos veces igual (mín. 8 caracteres, distinta de la actual), el sistema actualiza `passwordHash` (bcrypt), responde `204`, muestra toast de éxito, limpia el formulario y mantiene la sesión.
- [x] Si la contraseña actual es incorrecta, el sistema responde `422` con "La contraseña actual es incorrecta." y **no** cierra la sesión.
- [x] Si `newPassword` y `confirmPassword` no coinciden, o `newPassword` tiene menos de 8 caracteres, o es igual a `currentPassword`, el sistema responde `400`; el formulario bloquea el envío en esos casos antes de llamar a la API.
- [x] Cuando el usuario inicia sesión después del cambio, el sistema acepta la contraseña nueva y rechaza la anterior.
- [x] Los campos de contraseña permiten alternar visibilidad y usan `autocomplete` `current-password` / `new-password`.

**Transversal**
- [x] Ninguna respuesta de `/api/users/me*` incluye `passwordHash`.
- [x] El usuario objetivo es siempre `req.user._id`; ningún endpoint `/me*` acepta un id de usuario en `params`/`body`.
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build` en verde en `quartz-web`.
- [ ] `npm run lint` en verde en `quartz-web` — 0 problemas nuevos; 17 preexistentes (9 errores) heredados de `feat/INF-04-dashboard`.

## Dependencias
- `USR-01-user-management` (servicio `users`, `useSchoolsQuery`, `ImageCropUploader`, endpoint de foto).
- `USR-02-teacher-ui-permissions` (patrón `403` por `schoolId` del Docente, `usePermissions`).
- `INF-03-session-sync-and-scope-audit` (`refreshSession`).

## Trazabilidad
- Backend:  `quartz-api/src/features/users/`, `quartz-api/src/features/auth/`
- Frontend: `quartz-web/src/features/account/`, `quartz-web/src/components/common/UserMenu.tsx`
- Docs:     `docs/roles-permissions.md`
- Branch:   `feat/USR-03-my-account` (desde `feat/INF-04-dashboard`)
