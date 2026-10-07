# RPT-03 — Tasks

## Backend (`quartz-api`)
- [x] `report.validation.ts` — `getCommunicativeLetterShieldSchema` (idéntico a `getChecklistReportShieldSchema`)
- [x] `report.service.ts` — `getCommunicativeLetterShield` (mirror de `getChecklistReportShield`)
- [x] `report.controller.ts` — `getCommunicativeLetterShieldController`
- [x] `report.routes.ts` — `GET /communicative-letter/:valuationId/shield` (+ `asyncHandler`, misma cadena de middlewares que `/checklist/:valuationId/shield`)

## Frontend (`quartz-web`)
- [x] `usePdfShieldImage.ts` — parametrizar por `reportKind: 'checklist' | 'communicative-letter'`
- [x] `ChecklistReportModal.tsx` — actualizar llamada al hook con `'checklist'`
- [x] `CommunicativeLetterDocument.tsx` — prop `shieldSrc`, `<Image>` real en vez de placeholder
- [x] `LetterConceptPicker.tsx` — `Select` cuando `availableConcepts.length > 1`, texto de solo lectura cuando `=== 1`
- [x] `CommunicativeLetterModal.tsx` — simplificar a panel único de solo-PDF (quitar picker/estado de edición/footer "Guardar"), añadir `usePdfShieldImage(..., 'communicative-letter')`
- [x] `pages/CommunicativeLetterEditPage.tsx` — crear vista de página (patrón `StudentValuationDetail.tsx`)
- [x] `App.tsx` — ruta `/evaluacion/:studentId/carta-comunicativa/:valuationId`
- [x] `StudentValuationsPage.tsx` — quitar `CommunicativeLetterModal` y su estado; `handleViewLetter` navega a la nueva ruta
- [x] `StudentValuationTable.tsx` — iconos Lucide (`Plus`, `ClipboardList`, `Mail`, `Trash2`) en columna Acciones; firma `onViewLetter(studentId, valuationId)`
- [x] `ReportsTable.tsx` — iconos Lucide (`ClipboardList`, `Mail`) en columna Informes
- [x] `ReportSettingsPanel.tsx` — quitar "(próximamente)" del copy de Carta Comunicativa

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`) — lint sin regresiones: los 4 errores/3 warnings reportados ya existían antes de esta sesión (confirmado con `git diff`), ninguno en líneas tocadas por RPT-03
- [x] Servidor arranca sin errores de compilación ni runtime — `quartz-api` compiló y conectó a MongoDB (el único fallo fue `EADDRINUSE`, puerto 4000 ya ocupado por otra instancia); `quartz-web` compiló con `vite build` sin errores
- [x] Repaso de aislamiento: el endpoint de escudo de Carta Comunicativa filtra por `institutionId` del token, nunca lo acepta de `body`/`params`
- [ ] Manual — `/evaluacion`: abrir Carta Comunicativa de un estudiante evaluado con 2+ conceptos candidatos en alguna dimensión → aparece `Select`; guardar → toast + persistencia al recargar; intentar salir con cambios sin guardar → bloqueo de navegación *(pendiente de probar en navegador con datos reales)*
- [ ] Manual — `/informes`: abrir Carta Comunicativa → solo PDF + escudo real + botón descargar, sin panel de edición *(pendiente de probar en navegador con datos reales)*
- [ ] Manual — alternar `enabledReports` en Configuración → el ícono de Carta Comunicativa aparece/desaparece en ambas tablas *(pendiente de probar en navegador con datos reales)*

## Definición de "hecho"
Todos los criterios EARS de `spec.md` cubiertos y marcados · `status: implemented`.
