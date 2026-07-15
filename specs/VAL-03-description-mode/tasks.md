# VAL-03 — Tasks

> **Bloqueado por `ACAD-01-subject-management`.** Necesita `SubjectEvaluationMode` y `sessionData.subjects[].evaluationMode`.

## Preparación
- [ ] Confirmar que ACAD-01 está fusionado en `develop`.
- [ ] Crear rama `feat/VAL-03-description-mode` desde `develop`.

## Backend (`quartz-api`)
### checklist-template
- [ ] `checklist-template.types.ts` — `subjects[].subject` gana `evaluationMode`; mismo cambio en `SubjectSnapshotData` e `IChecklistTemplateResponse`.
- [ ] `checklist-template.model.ts` — `subjectInTemplateSchema.subject.evaluationMode` (`enum`, `required`).
- [ ] `checklist-template.validation.ts` — `subjects[].subject.evaluationMode: z.nativeEnum(SubjectEvaluationMode)`.
- [ ] `checklist-template.service.ts` — copiar `evaluationMode` al componer el snapshot desde `Subject`.

### student-valuation
- [ ] `student-valuation.types.ts` — `IValuationBySubjectDTO` como unión discriminada; `ValuationBySubjectUpdate` gana `performanceDescription?`. Importar `SubjectEvaluationMode` de `subject/subject.types.ts`, no redefinirlo.
- [ ] `student-valuation.model.ts` — `valuationBySubjectSchema` gana `evaluationMode` (`default: CHECKLIST`) y `performanceDescription` (`default: null`).
- [ ] `student-valuation.validation.ts` — `performanceDescription: z.string().max(2000).nullable().optional()` por dimensión; `learningValuations` con `.default([])`.
- [ ] `student-valuation.service.ts` — `initializeStudentValuation()`: bifurcar el `template.subjects.map` (línea 204) por `evaluationMode`.
- [ ] `student-valuation.service.ts` — `updateStudentValuation()`: mapa `subjectId → performanceDescription`; normalizar blanco → `null` igual que `observations` (líneas 323-327); dimensión en modo descripción con agregados en `0` y sin `assignedConceptId`.
- [ ] `student-valuation.service.ts` — `globalStatus`: una dimensión en modo descripción suma 1 a `totalLearnings` y 1 a `valuatedLearnings` si tiene descripción.
- [ ] `student-valuation.service.ts` — `populateAndMapValuation()`: propagar `evaluationMode` y `performanceDescription`.
- [ ] `student-valuation.routes.ts` — migrar los 5 `authorize(['Jefe de Área'])` literales al enum `UserRole`; abrir POST/GET/GET/PATCH al `UserRole.DOCENTE`; `DELETE` solo Jefe de Área (ver Nota 2 del `plan.md`).
- [ ] Verificar que `report/report.types.ts` compila: reutiliza `IValuationBySubjectDTO`, la unión se propaga sola.

## Frontend (`quartz-web`)
- [ ] **Primero:** `StudentValuationDetail.tsx:66-73` — rehacer el mapeo del payload. El `.filter(subject => subject.learningValuations.length > 0)` actual descarta las dimensiones en modo descripción y la descripción nunca llega al backend.
- [ ] `components/interfaces/PerformanceTextareaProps.ts` — crear.
- [ ] `components/common/PerformanceTextarea.tsx` — crear, extrayendo el textarea inline de `StudentValuationDetail.tsx:257-275`.
- [ ] `StudentValuationDetail.tsx` — Observaciones pasa a usar `<PerformanceTextarea />`; pasar `onDescriptionChange` a `ValuationChecklist`.
- [ ] `features/student-valuation/types/api.ts` — espejo de la unión discriminada.
- [ ] `ValuationChecklist.tsx` — `AccordionBody` bifurcado: `description` → `<PerformanceTextarea title="Descripción personalizada del desempeño por parte del docente" />`, sin tabla ni radios. Progreso 0/1 ↔ 1/1.
- [ ] `LearningsPage.tsx` — dimensión en modo descripción: aviso fijo, sin botón "Crear" ni tabla.
- [ ] `ChecklistEditor.tsx` — sin botón "+" en dimensiones en modo descripción.
- [ ] `features/report/types/api.ts` — espejo del DTO.
- [ ] `ChecklistReportDocument.tsx` — párrafo en lugar de grilla; respetar el rediseño de `specs/valuation-observations.spec.md`.
- [ ] Acabado visual con las skills `impeccable`, `emil-design-eng` y `frontend-design`.

## Docs
- [ ] `docs/data-base.md §2.2` — documentar el discriminador `evaluationMode` y el nullable `performanceDescription` en el snapshot de `StudentValuation`.

## Verificación final
- [ ] `npx tsc --noEmit` en verde (`quartz-api`)
- [ ] `npm run build && npm run lint` en verde (`quartz-web`)
- [ ] Servidor arranca sin errores de compilación ni runtime
- [ ] Repaso de aislamiento: ninguna query sin `institutionId` del token
- [ ] Flujo completo: dimensión en modo descripción → plantilla → valorar → guardar → recargar → persiste
- [ ] `globalStatus` llega a `'Evaluado'` solo con la descripción escrita; borrarla lo devuelve a `'Evaluando'`
- [ ] Una dimensión en modo descripción nunca recibe puntos ni `assignedConceptId`
- [ ] El PDF imprime el párrafo
- [ ] Un Docente puede leer y valorar; sigue sin poder borrar

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented` · PR → `develop`.
