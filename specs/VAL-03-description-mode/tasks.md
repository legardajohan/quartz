# VAL-03 — Tasks

> **Bloqueado por `ACAD-01-subject-management`.** Necesita `SubjectEvaluationMode` y `sessionData.subjects[].evaluationMode`.

## Preparación
- [x] Confirmar que ACAD-01 está fusionado en `develop`. — No está fusionado en `develop`, pero sus cambios (`SubjectEvaluationMode`, `Subject.evaluationMode`, `sessionData.subjects[].evaluationMode`) ya están presentes en `feat/ACAD-02-period-settings` (rama base de esta feature, por instrucción explícita del usuario).
- [x] Crear rama `feat/VAL-03-description-mode` desde `develop`. — Creada desde `feat/ACAD-02-period-settings` (no desde `develop`), por instrucción explícita del usuario: ACAD-01 aún no está en `develop`.

## Backend (`quartz-api`)
### checklist-template
- [x] `checklist-template.types.ts` — `subjects[].subject` gana `evaluationMode`; mismo cambio en `SubjectSnapshotData` e `IChecklistTemplateResponse`.
- [x] `checklist-template.model.ts` — `subjectInTemplateSchema.subject.evaluationMode` (`enum`, `required`).
- [x] `checklist-template.validation.ts` — `subjects[].subject.evaluationMode: z.nativeEnum(SubjectEvaluationMode)`. Además: `learnings.min(1)` ahora solo aplica cuando `evaluationMode === 'checklist'` (una dimensión en modo `description` siempre tiene `learnings: []`; sin este ajuste, el schema original la habría rechazado siempre).
- [x] `checklist-template.service.ts` — copiar `evaluationMode` al componer el snapshot desde `Subject`. Además: `createChecklistTemplate` ahora enumera **todas** las dimensiones (`Subject` con `type: DIMENSION`) de la institución, no solo las que ya tienen `Learning`s — necesario para que una dimensión en modo `description` (que nunca tiene aprendizajes) aparezca en el snapshot.

### student-valuation
- [x] `student-valuation.types.ts` — `IValuationBySubjectDTO` como unión discriminada; `ValuationBySubjectUpdate` gana `performanceDescription?`. Importa `SubjectEvaluationMode` de `subject/subject.types.ts`, no lo redefine.
- [x] `student-valuation.model.ts` — `valuationBySubjectSchema` gana `evaluationMode` (`default: CHECKLIST`) y `performanceDescription` (`default: null`).
- [x] `student-valuation.validation.ts` — `performanceDescription: z.string().max(2000).nullable().optional()` por dimensión; `learningValuations` con `.default([])`.
- [x] `student-valuation.service.ts` — `initializeStudentValuation()`: bifurcado el `template.subjects.map` por `evaluationMode`.
- [x] `student-valuation.service.ts` — `updateStudentValuation()`: mapa `subjectId → performanceDescription`; normaliza blanco → `null` igual que `observations`; dimensión en modo descripción con agregados en `0` y sin `assignedConceptId`.
- [x] `student-valuation.service.ts` — `globalStatus`: una dimensión en modo descripción suma 1 a `totalLearnings` y 1 a `valuatedLearnings` si tiene descripción.
- [x] `student-valuation.service.ts` — `populateAndMapValuation()`: propaga `evaluationMode` y `performanceDescription`.
- [x] `student-valuation.routes.ts` — migrados los 5 `authorize(['Jefe de Área'])` literales al enum `UserRole`; abiertos POST/GET/GET/PATCH al `UserRole.DOCENTE`; `DELETE` solo Jefe de Área (ver Nota 2 del `plan.md`).
- [x] Verificado que `report/report.types.ts` compila: reutiliza `IValuationBySubjectDTO`, la unión se propaga sola.

## Frontend (`quartz-web`)
- [x] **Primero:** `StudentValuationDetail.tsx:66-73` — rehecho el mapeo del payload. El `.filter(subject => subject.learningValuations.length > 0)` original descartaba las dimensiones en modo descripción; ahora se conservan siempre.
- [x] `components/interfaces/PerformanceTextareaProps.ts` — creado.
- [x] `components/common/PerformanceTextarea.tsx` — creado, extrayendo el textarea inline de `StudentValuationDetail.tsx`.
- [x] `StudentValuationDetail.tsx` — Observaciones pasa a usar `<PerformanceTextarea />`; pasa `onDescriptionChange` a `ValuationChecklist`.
- [x] `features/student-valuation/types/api.ts` — espejo de la unión discriminada.
- [x] `ValuationChecklist.tsx` — `AccordionBody` bifurcado: `description` → `<PerformanceTextarea title="Descripción personalizada del desempeño por parte del docente" />`, sin tabla ni radios. Progreso 0/1 ↔ 1/1.
- [x] `LearningsPage.tsx` — dimensión en modo descripción (única seleccionada en el filtro): aviso fijo, sin botón "Crear" ni tabla.
- [x] `ChecklistEditor.tsx` — sin botón "+" en dimensiones en modo descripción.
- [x] `features/report/types/api.ts` — espejo del DTO.
- [x] `ChecklistReportDocument.tsx` — párrafo en lugar de grilla; reutiliza los estilos existentes de `observationsBox`/`observationsText`.
- [x] Acabado visual con las skills `impeccable`, `emil-design-eng` y `frontend-design`. — Revisado por el hook de `impeccable` en cada edición; los hallazgos de paleta púrpura señalados corresponden al tema de marca preexistente de Quartz, no a código nuevo.

## Docs
- [x] `docs/data-base.md §2.2` — documentado el discriminador `evaluationMode` y el nullable `performanceDescription` en el snapshot de `StudentValuation`; también actualizado §2.1 para reflejar `evaluationMode` en el snapshot de `ChecklistTemplate`.

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`) — lint reporta los mismos 10 errores/7 warnings preexistentes en `main` (confirmado comparando contra el commit base vía `git stash`); ninguno introducido por esta feature.
- [x] Servidor arranca sin errores de compilación ni runtime — verificado levantando `quartz-api` (`MongoDB connected` · `Server running on port 4000`) y `quartz-web` (`VITE ready`) en local.
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token — todas las queries nuevas/tocadas usan `findScoped`/`createScoped` con `institutionId` del token; ninguna lectura/escritura lo toma de `body`/`params`.
- [ ] Flujo completo: dimensión en modo descripción → plantilla → valorar → guardar → recargar → persiste — **no verificado manualmente en navegador** (requiere sesión autenticada y datos semilla de la institución del usuario; no se intentó para no mutar su entorno de desarrollo). Recomendado que el usuario lo verifique antes de dar por cerrado el PR.
- [ ] `globalStatus` llega a `'Evaluado'` solo con la descripción escrita; borrarla lo devuelve a `'Evaluando'` — lógica implementada y revisada por código; no verificado end-to-end en navegador (mismo motivo que el punto anterior).
- [x] Una dimensión en modo descripción nunca recibe puntos ni `assignedConceptId` — verificado por revisión de código: `maxSubjectScore`/`totalSubjectScore`/`subjectPercentage` quedan en `0` y `assignedConceptId` nunca se asigna para `evaluationMode === 'description'`.
- [ ] El PDF imprime el párrafo — implementado; no renderizado manualmente (mismo motivo).
- [x] Un Docente puede leer y valorar; sigue sin poder borrar — verificado por código: rutas POST/GET/GET/PATCH abiertas a `UserRole.DOCENTE`, `DELETE` restringido a `UserRole.JEFE_DE_AREA`.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented` · PR → `develop`.
