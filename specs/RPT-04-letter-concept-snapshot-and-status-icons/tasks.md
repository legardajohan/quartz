# RPT-04 — Tasks

## Backend (`quartz-api`)
- [x] `student-valuation.model.ts` — `assignedConceptText?: string | null` en `IValuationBySubject` + schema (`default: null`)
- [x] `student-valuation.types.ts` — `assignedConceptText?: string | null` en `ValuationBySubjectBase`; `conceptText: string` en `ConceptAssignmentUpdate`
- [x] `student-valuation.validation.ts` — `conceptText` en `conceptAssignmentSchema` (`trim().min(1).max(2000)`)
- [x] `student-valuation.service.ts` — `PopulatedValuationBySubject` + mapeo en `populateAndMapValuation` (incluir `assignedConceptText`)
- [x] `student-valuation.service.ts` — auto-asignación en `updateStudentValuation`: seleccionar `description` de `Concept`, setear/limpiar `assignedConceptText` junto con `assignedConceptId`, preservar snapshot cuando la asignación sigue vigente
- [x] `student-valuation.service.ts` — `updateValuationConcepts`: persistir `assignedConceptText` desde `assignment.conceptText`
- [x] `report.service.ts` — `getCommunicativeLetterReport`: priorizar `assignedConceptText` sobre recálculo en vivo cuando la asignación sigue siendo candidato vigente
- [x] `npx tsc --noEmit`

## Frontend (`quartz-web`)
- [x] `features/report/types/api.ts` — `conceptText: string` en `ConceptAssignmentUpdate`
- [x] `features/report/statusVisuals.ts` (crear) — `STATUS_ICON_SVG` / `STATUS_ICON_JPG` por `QualitativeValuation`, import estático único por ícono
- [x] `features/report/components/LetterConceptPicker.tsx` — layout `grid` 2 columnas por dimensión `checklist` (tarjeta concepto + caja de estado), `SquarePen`/`Check` para alternar edición de texto, `Textarea` cuando edita, mover badge de estado a la caja derecha con ícono SVG
- [x] `features/report/pages/CommunicativeLetterEditPage.tsx` — estado `conceptText`, seed/reset (`buildServerConceptText`), reinicio de texto al cambiar `Select`, `isDirty` incluye texto, `handleSave` envía `conceptText` por asignación
- [x] `features/report/components/CommunicativeLetterDocument.tsx` — ícono JPG de estado por dimensión (reutilizando `STATUS_ICON_JPG`), quitar párrafo introductorio
- [x] `npm run build && npm run lint`

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`) — mismos 4 errores/3 warnings preexistentes (confirmados en RPT-03), ninguno en código tocado por RPT-04
- [x] Servidor arranca sin errores de compilación ni runtime — `quartz-api` compiló y conectó a MongoDB (único fallo `EADDRINUSE`, puerto 4000 ya ocupado); `quartz-web` compiló con `vite build` sin errores
- [x] Repaso de aislamiento: `updateValuationConcepts` sigue resolviendo `institutionId` del token; sin nuevas superficies que lo acepten de `body`/`params`
- [ ] Manual — editar `description` de un `Concept` ya asignado a una carta guardada → la carta no cambia (snapshot vigente) *(pendiente de probar en navegador con datos reales)*
- [ ] Manual — `Select` con 2+ candidatos: cambiar selección → texto se reinicia a la descripción vigente del nuevo candidato *(pendiente)*
- [ ] Manual — `SquarePen` → editar texto libremente → guardar → recargar → persiste el texto editado (no el original del banco) *(pendiente)*
- [ ] Manual — caja de estado a la derecha con ícono SVG + punto/texto, ausente de la tarjeta de concepto *(pendiente)*
- [ ] Manual — PDF de Carta Comunicativa (`/informes`): ícono JPG por dimensión, sin párrafo introductorio *(pendiente)*

## Definición de "hecho"
Todos los criterios EARS de `spec.md` cubiertos y marcados · `status: implemented`.
