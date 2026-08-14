---
id: ACAD-04-schools-and-shifts
feature: schools-and-shifts
status: implemented
created: 2026-08-04
---

# ACAD-04 — Gestión de sedes y jornadas (spec)

## Objetivo
Dar al `Jefe de Área` control sobre la estructura de su institución: CRUD de sedes y una lista de jornadas propia del inquilino, asignable de forma opcional a cada estudiante.

## Alcance
**Incluye:**
- CRUD completo de `School` (hoy solo existe `GET /api/schools`), operable desde una pestaña nueva **Sedes y jornadas** en `/gestion/configuracion`.
- `schoolNumber` autoasignado por el backend (consecutivo por institución); el Jefe de Área solo escribe el nombre.
- Jornadas embebidas en `Institution.settings`: `multipleShifts: boolean` + `shifts: [{ _id, name }]`, con nombre libre y `_id` único generado por Mongo.
- Switch «Maneja varias jornadas» en la misma pestaña: apagado (default) el bloque de jornadas no se muestra ni se usa; encendido habilita agregar/renombrar/eliminar jornadas.
- `User.shiftId` opcional. Select **Jornada** en el modal de `/gestion/usuarios`, solo al crear y editar **estudiantes**, y solo cuando `multipleShifts` está activo con ≥1 jornada.
- `shifts` y `multipleShifts` viajan en `sessionData` (el modal y la tabla de usuarios son visibles para `Docente`, que no puede leer `/api/institutions/me`).
- Columna Sede de `UsersTable` muestra la jornada como subtítulo cuando `multipleShifts` está activo.

**Fuera:**
- Jornada por sede (las jornadas son del inquilino, no de la sede).
- Jornada en docentes.
- Filtro por jornada en `SearchFilterBar` de `/gestion/usuarios`.
- Horarios, hora de inicio/fin o cualquier atributo de la jornada distinto del nombre.
- Migración de datos: las instituciones existentes arrancan con `multipleShifts: false` y `shifts: []`.

## Criterios de aceptación (EARS)

### Sedes
- [x] Cuando el Jefe de Área envía `POST /api/schools` con un `name`, el sistema crea la sede con `schoolNumber = max(schoolNumber de la institución) + 1` y la devuelve con `201`.
- [x] Si el `name` enviado ya existe en la institución (comparación sin distinguir mayúsculas ni espacios sobrantes), el sistema responde `409` y no crea nada.
- [x] Cuando el Jefe de Área renombra una sede vía `PATCH /api/schools/:schoolId`, el sistema conserva su `schoolNumber`.
- [x] Si se intenta eliminar una sede con usuarios asociados, el sistema responde `409` indicando cuántos usuarios la referencian y no elimina nada.
- [x] Si se intenta eliminar la última sede de la institución, el sistema responde `409` (`User.schoolId` es requerido: sin sedes no se puede dar de alta a nadie).
- [x] Si un `Docente` invoca `POST`/`PATCH`/`DELETE` de `/api/schools`, el sistema responde `403`. `GET /api/schools` sigue abierto a todo usuario autenticado.

### Jornadas
- [x] Cuando el Jefe de Área guarda `settings.shifts` con entradas sin `_id`, el sistema les genera un `_id` propio y conserva el `_id` de las que ya lo traían.
- [x] Si dos jornadas del payload tienen el mismo nombre (sin distinguir mayúsculas ni espacios sobrantes), el sistema responde `422` y no guarda nada.
- [x] Si `multipleShifts` queda en `true` con la lista de jornadas vacía, el sistema responde `422`.
- [x] Si el payload omite una jornada que tiene estudiantes asignados, el sistema responde `409` indicando el nombre de la jornada y cuántos estudiantes la referencian.
- [x] Si `multipleShifts` pasa a `false` mientras algún usuario conserva `shiftId`, el sistema responde `409`.
- [x] Cuando `multipleShifts` pasa a `false` sin asignaciones vivas, el sistema conserva `settings.shifts` tal cual (los nombres no se pierden al reactivar el switch).
- [x] Cuando un usuario inicia sesión, `sessionData` incluye `multipleShifts` y `shifts` de su institución, sea cual sea su rol.

### Asignación al estudiante
- [x] Si `multipleShifts` es `false` o `shifts` está vacío, el modal de usuario no renderiza el campo Jornada y el formulario se comporta exactamente como hoy.
- [x] Cuando `multipleShifts` es `true` con ≥1 jornada y el rol del formulario es `Estudiante`, el modal renderiza un `Select` **Jornada (opcional)** con las jornadas del inquilino más la opción «Sin jornada».
- [x] Cuando se crea o actualiza un estudiante sin elegir jornada, el sistema persiste el usuario sin `shiftId` y ninguna validación lo impide.
- [x] Cuando se edita un estudiante y se elige «Sin jornada», el sistema elimina `shiftId` del documento.
- [x] Si `shiftId` no corresponde a ninguna jornada de `settings.shifts` de la institución, el sistema responde `422`.
- [x] Si el rol del payload es `Docente`, el sistema rechaza `shiftId` con `400` (esquema `.strict()`).
- [x] Cuando `GET /api/users` devuelve estudiantes, cada uno incluye `shift: { _id, name } | null` resuelto desde `Institution.settings.shifts`.

### Transversales
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`. Las jornadas viven dentro del documento del inquilino y se resuelven por `_id === req.user.institutionId`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- `ACAD-02-period-settings` — `Institution.settings` y el patrón `GET`/`PATCH /api/institutions/me`.
- `USR-01-user-management` — CRUD de usuarios y `UserForm`.
- `INF-01-search-and-report-polish` — **aún no está en `develop`** (7 commits por delante) y ACAD-04 toca `UsersPage.tsx` y `ConfigurationPage.tsx` en su estado posterior a INF-01.

## Trazabilidad
- Backend:  `quartz-api/src/features/school/`, `quartz-api/src/features/institution/`, `quartz-api/src/features/users/`, `quartz-api/src/features/auth/`
- Frontend: `quartz-web/src/features/school/`, `quartz-web/src/features/institution/`, `quartz-web/src/features/users/`, `quartz-web/src/features/configuration/`
- Branch:   `feat/ACAD-04-schools-and-shifts`, ramificada desde `feat/INF-01-search-and-report-polish` (excepción documentada al flujo SDD; ver Dependencias). PR → `develop` una vez INF-01 esté fusionado.
