# RPT-02 — Tasks

## Backend (`quartz-api`)

### Asignación del concepto — feature `student-valuation`
- [ ] `student-valuation.types.ts` — `ConceptAssignmentUpdate`, `StudentValuationConceptsUpdateData`.
- [ ] `student-valuation.service.ts` — `resolveQualitativeValuation(subjectPercentage)` como *named export* (umbrales de `docs/domain.md`).
- [ ] `student-valuation.service.ts` — asignación automática de `assignedConceptId` en `updateStudentValuation`: una sola lectura de `Concept` por período, índice en memoria `subjectId|valuationType`, conservar la elección si el nivel no cambió, limpiar con `subject.set(...)` si la dimensión queda incompleta o no hay candidatos. Las dimensiones en modo `description` se saltan.
- [ ] `student-valuation.service.ts` — `updateValuationConcepts` con `404` / `409` / `422` según la matriz del plan.
- [ ] `student-valuation.validation.ts` — `updateValuationConceptsSchema` (`.strict()`, sin `institutionId`).
- [ ] `student-valuation.controller.ts` — `updateValuationConceptsController`, sin `try/catch`, `institutionId` desde `req.user!`.
- [ ] `student-valuation.routes.ts` — `PATCH /:valuationId/concepts` con `authorize([JEFE_DE_AREA, DOCENTE])` + `validate` + `asyncHandler`.

### Informe — feature `report`
- [ ] `report.types.ts` — `ILetterConceptOption`, `ILetterSubjectBlock`, `ICommunicativeLetterTemplate`, `IMissingConceptCoverage`, `ILetterAvailability`.
- [ ] `report.service.ts` — extraer `buildReportContext` y reescribir `getChecklistReport` sobre él, sin alterar su contrato ni el respaldo `'Plantilla eliminada'`.
- [ ] `report.service.ts` — renombrar `getChecklistReportShield` → `getReportShield`.
- [ ] `report.service.ts` — `getCommunicativeLetterReport`: cobertura de los tres niveles sobre el snapshot de la valoración → `422` con detalle; bloque por dimensión según la tabla del plan.
- [ ] `report.service.ts` — `getLetterAvailability(periodId, institutionId)` sobre el catálogo de `Subject` en modo `checklist`.
- [ ] `report.validation.ts` — `getCommunicativeLetterSchema`, `getCommunicativeLetterShieldSchema`, `getLetterAvailabilitySchema`.
- [ ] `report.controller.ts` — los tres controllers correspondientes; el del escudo reutiliza `getReportShield`.
- [ ] `report.routes.ts` — las tres rutas, con `/communicative-letter/availability` registrada **antes** de `/communicative-letter/:valuationId`.

## Frontend (`quartz-web`)

- [ ] Invocar `impeccable`, `emil-design-eng` y el plugin `frontend-design` **antes** de escribir UI.
- [ ] `report/types/api.ts` — espejo de `ILetterConceptOption`, `ILetterSubjectBlock`, `ICommunicativeLetterTemplate`, `IMissingConceptCoverage`, `ILetterAvailability`.
- [ ] `report/types/store.ts` — `ReportState` gana `currentLetter`, `isLetterLoading`, `letterError`, `letterAvailability` y las cuatro acciones.
- [ ] `useReportStore.ts` — `fetchLetterAvailability`, `fetchCommunicativeLetter`, `saveLetterConcepts` (re-lanza para `toast.promise`), `clearLetter`.
- [ ] `usePdfShieldImage.ts` — tercer parámetro `kind: ReportKind` con default `'checklist'`; la URL se compone desde él.
- [ ] `components/LetterConceptPicker.tsx` — presentacional: chip de nivel + `Radio` por concepto; bloque de sólo lectura para dimensiones en modo `description`.
- [ ] `components/CommunicativeLetterDocument.tsx` — PDF tamaño carta, narrativo, reutilizando el lenguaje visual de `ChecklistReportDocument.tsx`.
- [ ] `components/CommunicativeLetterModal.tsx` — dos columnas (selección + `PDFViewer`), Guardar sólo si hay cambios, `PDFDownloadLink`, y estado de bloqueo cuando el backend responde `422` por falta de conceptos.
- [ ] `components/ReportsTable.tsx` — el `EnvelopeIcon` deja de estar siempre deshabilitado; matriz de estado y tooltips del plan.
- [ ] `pages/ReportsPage.tsx` — `fetchLetterAvailability(activePeriod._id)` y montaje de `<CommunicativeLetterModal />`.
- [ ] `student-valuation/components/StudentValuationTable.tsx` — acción de Carta Comunicativa, condicionada además a `enabledReports`.
- [ ] `student-valuation/pages/StudentValuationsPage.tsx` — disponibilidad + montaje del modal.

## Docs
- [ ] `docs/data-model.md` — `Concept` deja de figurar como "definido en diseño, sin modelo aún"; `assignedConceptId` pasa a describirse como campo escrito por `student-valuation`.
- [ ] `docs/data-base.md` §1.1 — sustituir la spec de campos por la referencia a `concept.model.ts`, conservando la nota de enum.
- [ ] `docs/domain.md` §Informes — añadir la precondición de cobertura de conceptos para la Carta Comunicativa.

## Verificación final
- [ ] `cd quartz-api && npx tsc --noEmit` en verde.
- [ ] `cd quartz-web && npm run build && npm run lint` en verde.
- [ ] Servidor arranca sin errores de compilación ni runtime.
- [ ] Recorrer la lista de Verificación del `plan.md`.
- [ ] Repaso de aislamiento: ninguna lectura de `Concept`, `Subject` o `StudentValuation` sin `institutionId` del token; ningún esquema Zod acepta `institutionId`.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
