---
id: USR-01-user-management
feature: user-management
status: implemented        # draft | approved | implemented | released
created: 2026-07-17
---

# USR-01 — Gestión de usuarios (spec)

## Objetivo
Permitir al Jefe de Área crear, ver, editar y eliminar **Estudiantes** y **Docentes** de su institución desde `/gestion/usuarios`, con la tabla compartida del proyecto, tabs por rol, búsqueda/filtros y carga de imagen de perfil.

## Alcance
**Incluye:**
- CRUD de `User` (roles `Estudiante` y `Docente`) restringido a Jefe de Área, atado al `institutionId` del token.
- Listado por rol vía tabs `ESTUDIANTES | DOCENTES` (extiende `GET /api/users` a docentes).
- Columnas: NOMBRE (avatar + apellidos y nombres), IDENTIFICACIÓN (tipo + número), GRADO, SEDE, ACCIONES (ver/editar, eliminar).
- Búsqueda por nombre o identificación + filtros por sede y/o grado (cliente).
- Carga/recorte de imagen en crear y editar reutilizando `ImageCropUploader` + R2 (ACAD-03); generalización del endpoint de foto a cualquier usuario del tenant.
- Fallback de avatar a `public/avatar-default.svg` cuando `avatarUrl` no existe.
- Layout sin contenedor de fondo blanco en `/gestion/usuarios` y `/informes` (aspecto de `/academico/aprendizajes`).
- Fix del índice único multi-tenant de `identificationNumber` (compuesto por institución) y `ref` de `institutionId`.

**Fuera:**
- Crear usuarios con rol `Jefe de Área`.
- Flujos de recuperación / activación de contraseña del docente.
- Borrado en cascada de `StudentValuation` al eliminar un estudiante (hard delete; huérfanas fuera de alcance).
- Paginación y búsqueda server-side (se mantiene client-side sobre la lista cargada).
- Migrar el feature `users` de React Query a Zustand (ver `plan.md` § Notas — decisión deliberada).

## Criterios de aceptación (EARS)
- [x] Cuando un Jefe de Área envía `POST /api/users` con datos válidos de Estudiante (`role`, `firstName`, `lastName`, `identificationType`, `identificationNumber`, `schoolId`, `gradesTaught` con 1 grado), el sistema crea el usuario y responde `201` con el DTO enriquecido (con `school`).
- [x] Cuando un Jefe de Área envía `POST /api/users` de Docente, el sistema **exige** `email` y `password`, persiste `passwordHash` (bcrypt) y responde `201`.
- [x] Si al crear falta un campo obligatorio según el rol, el sistema responde `400` (Zod, vía `validate` middleware — convención del proyecto para errores de esquema; corregido de `422` a `400` durante la implementación) y no crea.
- [x] Si `identificationNumber` ya existe en la institución, el sistema responde `409` y no crea.
- [x] Si al crear un Docente el `email` ya existe (cualquier institución), el sistema responde `409` y no crea.
- [x] Si `schoolId` no pertenece al tenant, el sistema responde `422` y no crea.
- [x] Cuando un Jefe de Área envía `PATCH /api/users/:userId`, el sistema actualiza solo los campos enviados, mantiene el `role` inmutable, re-hashea la contraseña solo si se envía, y responde `200` con el DTO.
- [x] Cuando un Jefe de Área envía `DELETE /api/users/:userId`, el sistema elimina el usuario, borra su avatar en R2 best-effort y responde `204`.
- [x] Si `:userId` no existe o pertenece a otra institución, el sistema responde `404` en `PATCH`, `DELETE` y `PATCH .../photo`.
- [x] Si un usuario con rol `Docente` o `Estudiante` invoca `POST`, `PATCH` o `DELETE` sobre `/api/users`, el sistema responde `403`.
- [x] Cuando se invoca `GET /api/users?role=Docente`, un Jefe de Área recibe los docentes de su institución (filtrables por `schoolId`); un Docente recibe `[]`.
- [x] Cuando un Jefe de Área o Docente sube foto vía `PATCH /api/users/:userId/photo`, el sistema persiste `avatarUrl`; si el solicitante es Docente, solo se permite sobre estudiantes de su sede (si no → `404`).
- [x] Cuando un usuario navega a `/gestion/usuarios`, el sistema muestra los tabs `ESTUDIANTES | DOCENTES` y la tabla compartida con avatar+nombre, identificación, grado, sede y columna de acciones.
- [x] Si el usuario no es Jefe de Área, la vista no muestra el botón "+ Crear" ni la columna de acciones de escritura.
- [x] Cuando el usuario escribe en la barra de búsqueda (nombre o identificación) o aplica filtros de sede/grado, la tabla se filtra en cliente.
- [x] Cuando una acción de crear/editar/eliminar termina con éxito, la tabla refleja el cambio (invalidación de la query de usuarios).
- [x] Cuando el usuario abre `/gestion/usuarios` o `/informes`, ninguna de las dos vistas envuelve su contenido en un contenedor de fondo blanco.
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [x] `npx tsc --noEmit` en verde en `quartz-api` + `npm run build && npm run lint` en verde en `quartz-web`.

> **Pendiente de verificación manual (sin navegador en este entorno):** click-through en `/gestion/usuarios` (crear/editar/eliminar Estudiante y Docente, carga de imagen, búsqueda y filtros) y drop del índice viejo `identificationNumber_1` en la base real. Ver `tasks.md` § Verificación final.

## Ajustes UI — Iteración 2 (implementado)
Solo `quartz-web`. Sin cambios backend → el criterio de aislamiento no aplica a esta iteración.

- [x] Cuando el usuario abre el menú de filtros en `/gestion/usuarios` y pasa el cursor sobre el botón de filtro, el sistema no muestra ningún borde/outline negro — ni al inicio ni tras el primer clic.
- [x] Cuando el usuario ve la cabecera de `/gestion/usuarios`, los tabs ESTUDIANTES|DOCENTES y la barra de búsqueda aparecen en la misma fila: tabs (segmented control) a la izquierda, input de búsqueda ocupando el resto.
- [x] Cuando el contenido de un `FormModal` excede la altura disponible, el sistema habilita scroll vertical delgado dentro del cuerpo; el scrollbar solo se hace visible al hacer hover sobre el cuerpo o al hacer scroll con la rueda, y no aparece cuando el contenido cabe sin desbordar.
- [x] Cuando se crea o edita un Docente, el campo antes "Grados a cargo" se llama "Cursos a cargo" y es un desplegable con checkboxes; su disparador lista los grados seleccionados separados por comas (ej. "Transición, Primero"), truncados con elipsis cuando no caben en el ancho. **Nota de implementación:** es el propio `Select`+`Option`+`Checkbox` de material-tailwind (mismo componente y misma animación de label flotante que "Sede"), no un componente custom — ver `plan.md` § Nota de implementación (final).
- [x] Cuando se crea o edita un Estudiante, los campos Sede y Grado se muestran en una sola fila de 2 columnas; lo mismo aplica a Sede y Cursos a cargo cuando se crea o edita un Docente.
- [x] `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- ACAD-03 (`image-uploads`): infra R2 (`r2.service.ts`, `upload.middleware.ts`, `assertWebp.ts`), endpoint de foto, `ImageCropUploader.tsx`, `avatarUrl` en `User`, `public/avatar-default.svg`. Todo ya en `develop`.
- `GET /api/schools` (feature `school`) para poblar el selector/filtro de sede.

## Trazabilidad
- Backend:  quartz-api/src/features/users/ · quartz-api/src/features/auth/auth.model.ts
- Frontend: quartz-web/src/features/users/ · quartz-web/src/features/report/pages/ReportsPage.tsx
- Branch:   feat/USR-01-user-management
