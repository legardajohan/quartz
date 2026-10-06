---
id: ACAD-05-offered-levels
feature: offered-levels
status: draft        # draft | approved | implemented | released
created: 2026-10-06
---

# ACAD-05 — Niveles de Preescolar ofertados por institución (spec)

## Objetivo
Que la app opere sobre los niveles de **Preescolar** (Prejardín 3 años · Jardín 4 · Transición 5) y que el Jefe de Área configure cuáles ofrece su institución, en lugar del `"Transición"` fijo actual.

## Alcance
**Incluye:**
- `GradeLevel` = `Prejardín | Jardín | Transición` en API y web (se eliminan `1ro…11mo`).
- `Institution.settings.offeredLevels` (mín. 1; default `['Transición']`) editable en `/gestion/configuracion`, tab nueva **"Niveles"**.
- `offeredLevels` en la sesión (`ISessionData`) y en `GET /institutions/me/settings`.
- Selectores, filtros y formularios de grado alimentados por `offeredLevels` (sin constantes `GRADE_LEVELS = ["Transición"]`).
- Validación de grado de usuarios, plantillas de chequeo y aprendizajes contra el enum / niveles ofertados.
- Migración de datos con grados fuera del enum y corrección del seed.
- Docs y `CLAUDE.md` actualizados a "Preescolar".

**Fuera:**
- Grados 1°–11° y valoración cuantitativa (`docs/domain.md`, "Futuro").
- Plantillas de chequeo/aprendizajes distintos por nivel más allá del campo `grade` existente.
- Cambiar el nivel de un estudiante en lote.
- Cargue masivo (lo cubre USR-06).

## Criterios de aceptación (EARS)

**Enum y modelo**
- [ ] El sistema define `GradeLevel` con exactamente `Prejardín`, `Jardín`, `Transición` (API y web, mismo orden 3→5 años).
- [ ] Cuando se crea una institución sin `settings.offeredLevels`, el sistema asume `['Transición']`.
- [ ] La respuesta de `GET /institutions/me/settings` y `GET /auth/session` incluye `offeredLevels`.

**Configuración**
- [ ] Cuando el Jefe de Área abre `/gestion/configuracion`, el sistema muestra la tab "Niveles" (sexto paso; el texto de cabecera dice "seis pasos").
- [ ] La tab "Niveles" lista los 3 niveles con casilla y el rango de edad; guarda con `PATCH /institutions/me` (`settings.offeredLevels`) y muestra toast de éxito/error.
- [ ] Si el Jefe de Área intenta guardar sin ningún nivel, el sistema responde `422` y el botón "Guardar" se deshabilita en la UI.
- [ ] Si se quita un nivel que algún usuario del inquilino tiene en `gradesTaught`, el sistema responde `409` con el nombre del nivel y la cantidad de usuarios.
- [ ] Si `offeredLevels` trae duplicados o valores fuera del enum, el sistema responde `400`.

**Uso en la app**
- [ ] Los selectores y filtros de grado de Usuarios, Dashboard, Informes, Valoraciones y Aprendizajes muestran solo los niveles ofertados.
- [ ] Si la institución ofrece un único nivel, los formularios lo preseleccionan y los filtros de grado no se muestran donde hoy se autoseleccionan (`ConsolidatedReportsPanel`).
- [ ] La creación/edición de plantillas de chequeo y aprendizajes envía un nivel ofertado (selector si hay más de uno).
- [ ] Si se crea/edita un usuario con un grado no ofertado por su institución, el sistema responde `422`.
- [ ] Si se edita un Estudiante, el sistema exige exactamente un grado en `gradesTaught`.
- [ ] `checklist-template` y `learning` rechazan con `400` un `grade` que no pertenezca a `GradeLevel`.

**Migración y docs**
- [ ] El script de migración reporta y reasigna los `gradesTaught`/`grade` fuera del enum (`1ro…11mo` → `Transición`, con conteo por colección) y fija `offeredLevels` en las instituciones existentes según los niveles en uso.
- [ ] `dev/data_base/insert-db.js` usa solo valores del enum.
- [ ] `docs/domain.md`, `docs/data-model.md` y los tres `CLAUDE.md` describen el alcance Preescolar y `offeredLevels`.

**Transversales**
- [ ] **Aislamiento:** `offeredLevels` se lee/escribe solo sobre la institución del token; la validación de grado usa los niveles del inquilino del token, nunca del `body`.
- [ ] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` sin errores nuevos en `quartz-web`.

## Dependencias
- ACAD-04 (patrón de `settings` y `PATCH /institutions/me`), USR-01.
- Rama base: `feat/USR-05-bulk-user-import` (la más actual; aún no fusionada en `develop`). ACAD-05 parte de ella, no de `develop`.
- Requisito previo: el trabajo de USR-05 debe estar **commiteado** en esa rama (hoy está sin commit en el árbol de trabajo).

## Trazabilidad
- Backend:  `quartz-api/src/features/{auth,institution,users,checklist-template,learning}/`
- Frontend: `quartz-web/src/features/{institution,configuration,users,dashboard,report,student-valuation,learning,checklist-template}/`
- Branch:   `feat/ACAD-05-offered-levels`
