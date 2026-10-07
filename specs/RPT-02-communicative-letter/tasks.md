# RPT-02 — Tasks

## Backend (`quartz-api`)

### Asignación del concepto — feature `student-valuation`
- [x] `student-valuation.types.ts` — `ConceptAssignmentUpdate`, `StudentValuationConceptsUpdateData`.
- [x] `student-valuation.service.ts` — `resolveQualitativeValuation(subjectPercentage)` como *named export* (umbrales de `docs/domain.md`).
- [x] `student-valuation.service.ts` — asignación automática de `assignedConceptId` en `updateStudentValuation`: una sola lectura de `Concept` por período, índice en memoria `subjectId|valuationType`, conservar la elección si el nivel no cambió, limpiar el campo si la dimensión queda incompleta o no hay candidatos. Las dimensiones en modo `description` se saltan. *(Desviación: se usa asignación directa `subject.assignedConceptId = ...` en vez de `subject.set(...)` — el subdocumento tipado como `IValuationBySubject` plano no expone `.set()`; la asignación directa es el patrón que ya usa el resto del archivo, ej. `subject.totalSubjectScore = totalPoints`.)*
- [x] `student-valuation.service.ts` — `updateValuationConcepts` con `404` / `409` / `422` según la matriz del plan.
- [x] `student-valuation.validation.ts` — `updateValuationConceptsSchema` (`.strict()`, sin `institutionId`).
- [x] `student-valuation.controller.ts` — `updateValuationConceptsController`, sin `try/catch`, `institutionId` desde `req.user!`.
- [x] `student-valuation.routes.ts` — `PATCH /:valuationId/concepts` con `authorize([JEFE_DE_AREA, DOCENTE])` + `validate` + `asyncHandler`.

### Informe — feature `report`
- [x] `report.types.ts` — `ILetterConceptOption`, `ILetterSubjectBlock`, `ICommunicativeLetterTemplate`, `IMissingConceptCoverage`, `ILetterAvailability`.
- [x] `report.service.ts` — extraer `buildReportContext` y reescribir `getChecklistReport` sobre él, sin alterar su contrato ni el respaldo `'Plantilla eliminada'`.
- [x] ~~`report.service.ts` — renombrar `getChecklistReportShield` → `getReportShield`.~~ **N/A**: en `develop` el endpoint de escudo (`/checklist/:valuationId/shield`, R2, `shieldJpgUrl`) no existe todavía — es de `INF-01-search-and-report-polish`, que no está mergeado a `develop`. El plan se escribió explorando la rama `feat/ACAD-04-schools-and-shifts` (que sí trae INF-01 encima) por error; no hay nada que renombrar en la base real. `institution.shieldUrl` (string simple) sigue existiendo y se usa igual que en `getChecklistReport`.
- [x] `report.service.ts` — `getCommunicativeLetterReport`: cobertura de los tres niveles sobre el snapshot de la valoración → `422` con detalle; bloque por dimensión según la tabla del plan.
- [x] `report.service.ts` — `getLetterAvailability(periodId, institutionId)` sobre el catálogo de `Subject` en modo `checklist`.
- [x] `report.validation.ts` — `getCommunicativeLetterSchema`, `getLetterAvailabilitySchema`. *(`getCommunicativeLetterShieldSchema` no se creó: no hay endpoint de escudo que validar, ver punto anterior.)*
- [x] `report.controller.ts` — los dos controllers correspondientes (`getCommunicativeLetterReportController`, `getLetterAvailabilityController`).
- [x] `report.routes.ts` — las dos rutas nuevas, con `/communicative-letter/availability` registrada **antes** de `/communicative-letter/:valuationId`.

## Frontend (`quartz-web`)

- [x] Invocar `impeccable`, `emil-design-eng` y el plugin `frontend-design` **antes** de escribir UI. *(`impeccable` bloqueó en su paso de setup por falta de `PRODUCT.md` en el repo — no existe en ningún feature previo tampoco. Se aplicó la guía de las tres skills ya cargada en contexto — contraste, animación con `transition`/`ease-out`/`active:scale-97`, prohibiciones de patrones genéricos — reutilizando 1:1 el lenguaje visual purple/Material Tailwind ya establecido, mismo criterio que ACAD-04 documentó para la misma fricción.)*
- [x] `report/types/api.ts` — espejo de `ILetterConceptOption`, `ILetterSubjectBlock`, `ICommunicativeLetterTemplate`, `IMissingConceptCoverage`, `ILetterAvailability`, `ConceptAssignmentUpdate`.
- [x] `report/types/store.ts` — `ReportState` gana `currentLetter`, `isLetterLoading`, `letterError`, `letterAvailability` y las cuatro acciones.
- [x] `useReportStore.ts` — `fetchLetterAvailability`, `fetchCommunicativeLetter`, `saveLetterConcepts` (re-lanza para `toast`), `clearLetter`.
- [x] ~~`usePdfShieldImage.ts`~~ **N/A**: no existe en `develop` (mismo motivo que el endpoint de escudo backend). El componente PDF usa un placeholder "Escudo" — igual que `ChecklistReportDocument.tsx` en esta base.
- [x] `components/LetterConceptPicker.tsx` — presentacional: chip de nivel + `Radio` (prop `label`) por concepto; bloque de sólo lectura para dimensiones en modo `description`.
- [x] `components/CommunicativeLetterDocument.tsx` — PDF tamaño carta, narrativo, reutilizando el lenguaje visual de `ChecklistReportDocument.tsx` (borde `#581c87`, meta row, firma, numeración).
- [x] `components/CommunicativeLetterModal.tsx` — dos columnas (selección + `PDFViewer`), Guardar sólo si hay cambios (`isDirty`), `PDFDownloadLink`, y estado de bloqueo cuando el backend responde `422` por falta de conceptos. `useDeferredValue` sobre la selección para suavizar el re-render del PDF.
- [x] `components/ReportsTable.tsx` — el `EnvelopeIcon` deja de estar siempre deshabilitado; matriz de estado y tooltips del plan.
- [x] `pages/ReportsPage.tsx` — `fetchLetterAvailability(activePeriod._id)` y montaje de `<CommunicativeLetterModal />`.
- [x] `student-valuation/components/StudentValuationTable.tsx` — acción de Carta Comunicativa, condicionada además a `enabledReports`.
- [x] `student-valuation/pages/StudentValuationsPage.tsx` — disponibilidad (vía `useReportStore`) + montaje del modal.

## Docs
- [ ] `docs/data-model.md` — `Concept` deja de figurar como "definido en diseño, sin modelo aún"; `assignedConceptId` pasa a describirse como campo escrito por `student-valuation`.
- [ ] `docs/data-base.md` §1.1 — sustituir la spec de campos por la referencia a `concept.model.ts`, conservando la nota de enum.
- [ ] `docs/domain.md` §Informes — añadir la precondición de cobertura de conceptos para la Carta Comunicativa.

> Nota: `/sdd-implement` no escribe documentación por regla de la skill. Estas tres tareas quedan para `/sdd-release` o una pasada explícita de docs.

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde.
- [x] `cd quartz-web && npm run build && npm run lint` en verde (lint solo reporta issues preexistentes fuera de este feature: `App.tsx`, `ConceptsPage.tsx`, `LearningsPage.tsx`, `StudentValuationDetail.tsx`, `ValuationChecklist.tsx`, y el `catch (err: any)` preexistente en `StudentValuationTable.tsx:93`).
- [x] Servidor arranca sin errores de compilación ni runtime (`MongoDB connected` + `Server running on port ...`; smoke test de los 3 endpoints nuevos responde `401` — autenticado correctamente, sin error de ruta ni 500).
- [x] Recorrer la lista de Verificación del `plan.md` — cubierta por tsc/build/lint/arranque; sin sesión manual en navegador (ver nota de proceso).
- [x] Repaso de aislamiento: `findScoped`/`findOneScoped` con `institutionId` del token en todas las queries nuevas de `Concept`, `Subject` y `StudentValuation`; ningún esquema Zod acepta `institutionId`.

## Nota de proceso
Durante la implementación, otra sesión cambió de rama el directorio de trabajo principal (`feat/RPT-02-communicative-letter` → `feat/ACAD-04-schools-and-shifts` → `feat/AUTH-01-welcome-loader`) mientras había cambios sin commitear. El cambio se resolvió sin pérdida de trabajo (quedó en 2 `git stash` con mensajes explícitos) creando un `git worktree` aislado en `../quartz-rpt-02` para el resto de la implementación. Ese worktree es descartable una vez fusionado el PR.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
