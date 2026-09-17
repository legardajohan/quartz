---
id: VAL-04-teacher-valuation-scope
feature: teacher-valuation-scope
status: implemented
created: 2026-09-15
---

# VAL-04 — Alcance por sede en Evaluaciones (spec)

## Objetivo
Restringir al Docente a las evaluaciones de los estudiantes **de su sede** y habilitarle el CRUD completo sobre ellas, cerrando el hueco actual: `student-valuation.service.ts` solo filtra por `institutionId`, así que hoy un Docente de la Sede A puede leer y modificar por id la valoración de un estudiante de la Sede B.

## Alcance
**Incluye:**
- Filtro por `schoolId` del Docente en las 6 operaciones de `student-valuation`.
- `DELETE /api/student-valuations/:valuationId` habilitado al Docente, acotado a su sede.
- Eliminación de la carga de foto del estudiante en `/evaluacion/:studentId` **para todos los roles**.
- Preselección del filtro de sede del Jefe de Área en `/evaluacion`; filtro de sede oculto para el Docente.

**Fuera:**
- Vínculo Docente↔Estudiante a nivel de modelo: "sus estudiantes" = todos los de su `schoolId`.
- El endpoint `PATCH /api/users/:userId/photo`, que se conserva intacto y pasa a consumirse solo desde `/gestion/usuarios` (`USR-02`).
- Informes (`report`), que ya aplican el filtro de sede (`report.service.ts:152-155`, `:551`).
- Restricción por jornada (`shiftId`): `toSafeUser()` no lo expone, queda fuera de esta fase.

## Criterios de aceptación (EARS)
- [x] Cuando un Docente solicita una valoración por id cuyo estudiante pertenece a otra sede, el sistema responde `404` y no revela la existencia del recurso.
- [x] Cuando un Docente inicializa, consulta, edita, actualiza conceptos o elimina una valoración de un estudiante **de su sede**, el sistema ejecuta la operación con normalidad.
- [x] Cuando un Docente invoca `DELETE /api/student-valuations/:valuationId` sobre un estudiante de su sede, el sistema elimina la valoración (antes: `403` por rol).
- [x] Si el solicitante es Jefe de Área, el sistema no aplica ningún filtro de sede y opera sobre toda la institución.
- [x] Cuando cualquier rol abre `/evaluacion/:studentId`, el sistema muestra la foto del estudiante en solo lectura y no ofrece ningún control de carga de imagen.
- [x] Cuando un Jefe de Área abre `/evaluacion`, el sistema preselecciona su propia sede en el filtro "Sede" y le permite quitarla o elegir otras.
- [x] Cuando un Docente abre `/evaluacion`, el sistema no muestra el grupo de filtro "Sede".
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; el `schoolId` se toma de `req.user`, nunca de `body`/`params`/`query`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- `AUTH-02-role-access-baseline` (hook `usePermissions`).

## Trazabilidad
- Backend:  `quartz-api/src/features/student-valuation/`
- Frontend: `quartz-web/src/features/student-valuation/`
- Branch:   `feat/VAL-04-teacher-valuation-scope`
