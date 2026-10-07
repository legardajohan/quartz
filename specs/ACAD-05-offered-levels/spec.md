---
id: ACAD-05-offered-levels
feature: offered-levels
status: released        # draft | approved | implemented | released — enmienda "Quitar un nivel" (2026-10-06) implementada
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
- Cargue masivo (USR-05) alineado con `offeredLevels`: columna de nivel solo si hay más de uno.
- Docs y `CLAUDE.md` actualizados a "Preescolar".

**Fuera:**
- Grados 1°–11° y valoración cuantitativa (`docs/domain.md`, "Futuro").
- Plantillas de chequeo/aprendizajes distintos por nivel más allá del campo `grade` existente.
- Cambiar el nivel de un estudiante en lote.

## Criterios de aceptación (EARS)

**Enum y modelo**
- [x] El sistema define `GradeLevel` con exactamente `Prejardín`, `Jardín`, `Transición` (API y web, mismo orden 3→5 años).
- [x] Cuando se crea una institución sin `settings.offeredLevels`, el sistema asume `['Transición']`.
- [x] La respuesta de `GET /institutions/me/settings` y `GET /auth/session` incluye `offeredLevels`.

**Configuración**
- [x] Cuando el Jefe de Área abre `/gestion/configuracion`, el sistema muestra la tab "Niveles" (sexto paso; el texto de cabecera dice "seis pasos").
- [x] La tab "Niveles" lista los 3 niveles con casilla y el rango de edad; guarda con `PATCH /institutions/me` (`settings.offeredLevels`) y muestra toast de éxito/error.
- [x] Si el Jefe de Área intenta guardar sin ningún nivel, el sistema responde `422` y el botón "Guardar" se deshabilita en la UI.
- [x] Si `offeredLevels` trae duplicados o valores fuera del enum, el sistema responde `400`.

**Quitar un nivel (enmienda)**
- [x] Si se quita un nivel que algún **Estudiante** del inquilino tiene en `gradesTaught`, el sistema responde `409` "El nivel «<nivel>» tiene N estudiante(s). Cámbialos de nivel antes." y no guarda nada.
- [x] Docentes, Jefes de Área, aprendizajes y plantillas de chequeo **no** bloquean el cambio.
- [x] Cuando se guarda sin el nivel, el sistema lo retira del `gradesTaught` de los Docentes del inquilino; si un Docente queda sin niveles, recibe todos los niveles que siguen ofertados.
- [x] El `gradesTaught` de los Jefes de Área no se modifica.
- [x] Los aprendizajes y plantillas de chequeo del nivel quitado se conservan en BD, pero `GET /api/learnings` y `GET /api/checklist-templates` solo devuelven los de niveles ofertados; si el nivel se vuelve a ofrecer, reaparecen sin cambios.
- [x] El toast de éxito de la tab "Niveles" indica cuántos docentes se ajustaron (si alguno).

**Uso en la app**
- [x] Los selectores y filtros de grado de Usuarios, Dashboard, Informes, Valoraciones y Aprendizajes muestran solo los niveles ofertados.
- [x] Si la institución ofrece un único nivel, los formularios lo asignan sin mostrar selector y el selector de grado de `ConsolidatedReportsPanel` no se muestra (usa ese nivel).
- [x] La creación/edición de plantillas de chequeo y aprendizajes envía un nivel ofertado (selector si hay más de uno).
- [x] Si se crea/edita un usuario con un grado no ofertado por su institución, el sistema responde `422`.
- [x] Si se edita un Estudiante, el sistema exige exactamente un grado en `gradesTaught`.
- [x] `checklist-template` y `learning` rechazan con `400` un `grade` que no pertenezca a `GradeLevel`.

**Cargue masivo**
- [x] Si la institución ofrece un único nivel, la plantilla no trae columna de nivel y cada Estudiante/Docente recibe ese nivel (Jefe de Área, ninguno).
- [x] Si ofrece varios, la plantilla de Estudiantes trae "Nivel*" (lista de los ofertados) y la de Equipo docente "Niveles" (separados por coma; obligatoria para Docente).
- [x] Una fila con un nivel no ofertado, un Estudiante sin exactamente un nivel o un Docente sin niveles se informa como inválida; el confirm revalida contra los niveles del token.

**Migración y docs**
- [x] El script de migración reporta y reasigna los `gradesTaught`/`grade` fuera del enum (`1ro…11mo` → `Transición`, con conteo por colección) y fija `offeredLevels` en las instituciones existentes según los niveles en uso.
- [x] `dev/data_base/insert-db.js` usa solo valores del enum.
- [x] `docs/domain.md`, `docs/data-model.md` y los tres `CLAUDE.md` describen el alcance Preescolar y `offeredLevels`.

**Transversales**
- [x] **Aislamiento:** `offeredLevels` se lee/escribe solo sobre la institución del token; la validación de grado usa los niveles del inquilino del token, nunca del `body`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` sin errores nuevos en `quartz-web`.

## Dependencias
- ACAD-04 (patrón de `settings` y `PATCH /institutions/me`), USR-01.
- Rama base: `feat/USR-05-bulk-user-import` (aún no fusionada en `develop`). ACAD-05 parte de ella, no de `develop`.
- La enmienda "Quitar un nivel" se implementa en la misma rama `feat/ACAD-05-offered-levels` (sobre `f254a30`).

## Trazabilidad
- Backend:  `quartz-api/src/features/{auth,institution,users,checklist-template,learning}/`
- Frontend: `quartz-web/src/features/{institution,configuration,users,dashboard,report,student-valuation,learning,checklist-template}/`
- Branch:   `feat/ACAD-05-offered-levels`
