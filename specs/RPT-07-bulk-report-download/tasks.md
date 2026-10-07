# RPT-07 — Tasks

> Se implementa sobre `RPT-06-pdf-asset-pipeline` (ya implementada): aporta `LetterPageShell`,
> los assets en base64 y el escudo cacheado por sesión.

## Backend (`quartz-api`)

### 1. Contratos
- [x] `report.types.ts` — `BulkReportSkipReason`, `IBulkReportSkip`,
      `IBulkChecklistReportResponse`, `IBulkCommunicativeLetterResponse`,
      `IConsolidatedReportFilters`.
- [x] `report.validation.ts` — `BULK_REPORT_MAX_ITEMS = 50`, `bulkReportBody`
      (`z.array(objectIdSchema).min(1).max(BULK_REPORT_MAX_ITEMS)`), `consolidatedReportBody`
      (`schoolId?`, `grade: z.nativeEnum(GradeLevel)`, `shiftId?`, `periodId`), y los 4 schemas
      `{ body }.strict()`.

### 2. Resolución por lote (compartida)
- [x] `student-valuation.service.ts` — extraer y exportar `mapValuationToDTO(valuation, students,
      periods, subjects)` desde el cuerpo de `populateAndMapValuation` (líneas 119-170); dejar que
      `populateAndMapValuation` delegue en ella. No cambiar su firma pública.
- [x] `report.service.ts` — `buildReportContexts(valuationIds, institutionId, role, schoolId?)`
      con las ~6 consultas de `plan.md`: `$in` por colección, `.lean()` en todas, consultas 2-5 en
      `Promise.all`, mapeo en memoria con `Map`. Devuelve `{ contexts, skipped }` y **no lanza**
      por elemento inválido.
- [x] `report.service.ts` — `buildReportContext` pasa a envolver `buildReportContexts([id], ...)`
      y traduce el descarte a su `AppError` de siempre: `not-found` → 404, `not-completed` → 409,
      `forbidden-school` → 403.
- [x] Confirmar que los endpoints individuales (`getChecklistReport`,
      `getCommunicativeLetterReport`) siguen devolviendo exactamente los mismos códigos y cuerpos.

### 3. Endpoints de lote por ids (`/bulk`)
- [x] `report.service.ts` — `getBulkChecklistReport(...)`: una sola consulta
      `findScoped(ChecklistTemplateModel, ..., { _id: { $in: templateIds } })` para los nombres de
      plantilla, conservando el fallback `'Plantilla eliminada'`.
- [x] `report.service.ts` — `getBulkCommunicativeLetterReport(...)`: un solo
      `findScoped(ConceptModel, ..., { periodId: { $in: periodIds } })` para todo el lote;
      `findMissingConceptCoverage` por informe, y el que falle cae en `skipped` con
      `missing-concepts` en vez de lanzar 422.
- [x] Ambas funciones ordenan `reports` por `student.lastName`, luego `student.firstName`.
- [x] `report.controller.ts` — `getBulkChecklistReportController` y
      `getBulkCommunicativeLetterReportController`: `valuationIds` de `req.body`,
      `institutionId`/`role`/`schoolId` de `req.user!`, `res.status(200).json(result)`. Sin
      `try/catch`.
- [x] `report.routes.ts` — `POST /checklist/bulk` y `POST /communicative-letter/bulk` con
      `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(schema) →
      asyncHandler`. **Registrarlas antes** de las rutas `/:valuationId`.

### 4. Endpoints de lote por cohorte (`/consolidated`)
- [x] `report.service.ts` — `resolveConsolidatedValuationIds(filters, institutionId, role,
      schoolId?)`: fuerza `schoolId` a `requestorSchoolId` si `role === DOCENTE` (ignora el del
      body); resuelve estudiantes vía `findScoped(User, ..., { role: ESTUDIANTE, gradesTaught:
      filters.grade, ...schoolId, ...shiftId })`; luego valoraciones vía
      `findScoped(StudentValuationModel, ..., { studentId: { $in }, periodId, globalStatus:
      COMPLETED })`. Corto-circuita a `[]` si no hay estudiantes.
- [x] `report.service.ts` — `getConsolidatedChecklistReport(...)` y
      `getConsolidatedCommunicativeLetterReport(...)`: llaman a `resolveConsolidatedValuationIds`,
      lanzan `AppError(..., 422)` si el resultado excede `BULK_REPORT_MAX_ITEMS` **antes** de
      construir contextos, y delegan en `getBulkChecklistReport`/`getBulkCommunicativeLetterReport`
      con los ids resueltos.
- [x] `report.controller.ts` — `getConsolidatedChecklistReportController` y
      `getConsolidatedCommunicativeLetterReportController`: filtros de `req.body`,
      `institutionId`/`role`/`schoolId` de `req.user!`. Sin `try/catch`.
- [x] `report.routes.ts` — `POST /checklist/consolidated` y `POST /communicative-letter/consolidated`
      con los mismos middlewares que `/bulk`. **Registrarlas antes** de las rutas `/:valuationId`.

## Frontend (`quartz-web`)

### 5. Tipos y utilidades
- [x] `features/report/types/api.ts` — espejo de `IBulkReportSkip`,
      `IBulkChecklistReportResponse`, `IBulkCommunicativeLetterResponse`,
      `IConsolidatedReportFilters` y del union de motivos.
- [x] `utils/downloadBlob.ts` — `downloadBlob(blob, fileName)`: `createObjectURL` → `<a download>`
      → `click()` → `remove()` → `revokeObjectURL`.

### 6. Store
- [x] `features/report/types/store.ts` — `selectedValuationIds`, `isBulkDownloading`,
      `bulkError` y las firmas de las 6 acciones nuevas (toggle/select-all/clear + 4 fetch).
- [x] `useReportStore.ts` — `toggleValuationSelection`, `selectAllValuations`,
      `clearValuationSelection`, `fetchBulkChecklistReports`, `fetchBulkCommunicativeLetters`,
      `fetchConsolidatedChecklistReports`, `fetchConsolidatedCommunicativeLetters` (vía
      `apiPost`). **Sin importar `@react-pdf/renderer`** en este archivo.

### 7. Documentos consolidados
- [x] `components/CommunicativeLetterPages.tsx` — extraer de `CommunicativeLetterDocument.tsx` el
      contenido de un estudiante (`LetterPageShell` + cuerpo), con sus estilos.
- [x] `components/ChecklistReportPages.tsx` — extraer de `ChecklistReportDocument.tsx` el subárbol
      `<Page>` de un estudiante, con sus estilos.
- [x] `components/CommunicativeLetterDocument.tsx` y `components/ChecklistReportDocument.tsx` —
      quedan como `<Document>` envolviendo **un** `*Pages`. Verificar cero cambio visual respecto
      de RPT-06.
- [x] `components/CommunicativeLetterBulkDocument.tsx` y `components/ChecklistReportBulkDocument.tsx`
      — `<Document>` mapeando N `*Pages`, con un único `shieldSrc` para todo el lote.

### 8. Pestañas en `/Informes`
- [x] Invocar antes de escribir JSX/estilos: skills `emil-design-eng`, `impeccable`, plugin
      `frontend-design` (obligatorio por `quartz-web/CLAUDE.md`).
- [x] `pages/ReportsPage.tsx` — pasa a shell de `Tabs`/`TabsHeader`/`TabsBody`/`TabPanel`, estilo
      visual de `UsersPage.tsx` (`bg-purple-50/60 p-1.5`, ternario `isActive`,
      `active:scale-[0.98]`), iconos heroicons `UserIcon` (Individual) / `UserGroupIcon`
      (Consolidado). `useState` local para la pestaña activa.
- [x] `components/IndividualReportsPanel.tsx` — mover aquí el contenido íntegro actual de
      `ReportsPage.tsx` (fetch de usuarios, filtros, tabla, modales de vista individual).
- [x] `components/ConsolidatedReportsPanel.tsx` — nuevo, con los 4 selects y el botón de
      descarga (ver `plan.md` § Frontend).

### 9. Selección y descarga — Individual — **implementada y luego revertida**
> Se implementó tal cual describen las casillas de abajo, se probó, y el usuario la rechazó
> explícitamente ("no me gustó en absoluto"). Se revirtió: `ReportsTable.tsx` ya no tiene columna
> de selección, `IndividualReportsPanel.tsx` ya no tiene barra de acción ni estado de selección, y
> `useReportStore`/`useBulkReportDownload` se simplificaron para no ofrecer el modo "por ids". El
> backend (`POST .../bulk`) **no se tocó** — sigue implementado, solo sin consumidor de UI.
- [x] ~~`components/ReportsTable.tsx` — columna de selección con `Checkbox` de Material Tailwind por
      fila y casilla maestra; la fila apunta al `valuationId` del periodo activo.~~ Revertido.
- [x] ~~`ReportsTable.tsx` — casilla deshabilitada + `Tooltip` con el motivo cuando el estudiante no
      tiene valoración del periodo activo o su `status !== 'Evaluado'`.~~ Revertido.
- [x] ~~La casilla maestra selecciona **todos los seleccionables del filtro vigente**, no solo la
      página visible.~~ Revertido.
- [x] ~~`useBulkReportDownload.ts` — modo "por ids": pide el lote vía `fetchBulkChecklistReports`/
      `fetchBulkCommunicativeLetters`, arma el `*BulkDocument`, genera el blob con
      `pdf(<Doc/>).toBlob()` y lo pasa a `downloadBlob`.~~ Revertido: el hook quedó solo con el
      modo por cohorte; `fetchBulkChecklistReports`/`fetchBulkCommunicativeLetters` se eliminaron
      del store (el endpoint backend sigue vivo, solo sin caller de UI).
- [x] ~~`IndividualReportsPanel.tsx` — barra de acción con conteo de seleccionados y los dos botones
      (`Button` con `isLoading` + `loadingText`), visible para Jefe de Área y Docente.~~ Revertido.
- [x] ~~Toast de cierre; advertencia si `skipped.length > 0`; no generar PDF si `reports.length === 0`.~~
      Revertido (no aplica sin selección).

### 10. Selección y descarga — Consolidado
- [x] `ConsolidatedReportsPanel.tsx` — `Select` Sede desde `useSchoolsQuery()`; para Docente,
      `disabled` con `value` fijo en `sessionData.user.schoolId`; para Jefe de Área, libre +
      opción "Todas las sedes".
- [x] `ConsolidatedReportsPanel.tsx` — `Select` Grado desde `GRADE_LEVELS`.
- [x] `ConsolidatedReportsPanel.tsx` — `Select` Jornada, renderizado solo si
      `sessionData.multipleShifts`; opción "Todas las jornadas" + `sessionData.shifts`.
- [x] `ConsolidatedReportsPanel.tsx` — `Select` Periodo desde `sessionData.periods` (todos).
- [x] `useBulkReportDownload.ts` — modo "por cohorte": pide el lote vía
      `fetchConsolidatedChecklistReports`/`fetchConsolidatedCommunicativeLetters`, arma el
      `*BulkDocument` y descarga igual que el modo por ids.
- [x] `ConsolidatedReportsPanel.tsx` — botón "Descargar consolidado" deshabilitado hasta tener
      Grado y Periodo elegidos.
- [x] Toast de cierre con conteo de incluidos; advertencia si `skipped.length > 0`; error si la
      cohorte es vacía o excede `BULK_REPORT_MAX_ITEMS`.

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde.
- [x] `cd quartz-web && npm run build && npm run lint` en verde (sin errores nuevos).
- [x] Servidor arranca sin errores de compilación ni runtime.
> La selección en Individual se revirtió (ver § 9): los tres checks siguientes ya no son
> verificables desde la UI. `POST .../bulk` sigue implementado, así que quedan como checks de
> API vía cliente HTTP directo, no como flujo de usuario.
- [ ] Manual (API, no UI) — `POST .../bulk` con 16 `valuationId` evaluados: un solo PDF con los
      16, ordenados por apellido.
- [ ] Manual (API, no UI) — lote con evaluados y no evaluados: el PDF sale con los válidos y
      `skipped` indica cuántos se omitieron y por qué.
- [ ] Manual — enviar más de 50 ids a `POST .../bulk` (desde cliente HTTP): responde 400.
- [ ] Manual — Consolidado, como Jefe de Área: elegir sede+grado+periodo (sin jornada si el
      inquilino tiene una sola): un solo PDF con todos los evaluados de esa cohorte.
- [ ] Manual — Consolidado, como Docente: el select de Sede aparece deshabilitado con su propia
      sede; el PDF resultante solo incluye estudiantes de esa sede aunque se manipule el request.
- [ ] Manual — Consolidado: cohorte que excede 50 evaluados: responde 422 sin generar PDF.
- [ ] Manual — Consolidado: cohorte vacía (0 estudiantes evaluados que calcen): no se genera PDF,
      se informa el motivo.
- [ ] Manual — Consolidado: elegir un periodo distinto del activo: el PDF refleja las valoraciones
      de ese periodo, no las del activo.
- [ ] Manual — como rol distinto de Jefe de Área/Docente (si existiera): los 4 endpoints responden
      403; ningún botón de descarga masiva se renderiza.
- [ ] Manual — informe individual (checklist y carta) sigue igual que en RPT-06, incluidos sus
      errores 404 / 409 / 422.
- [x] Repaso de aislamiento: ninguna consulta del feature sin `institutionId` del token; los
      endpoints de lote no leen `institutionId` de `body`, `params` ni `query`; `/consolidated`
      nunca acepta `schoolId` de un Docente desde el body; un `valuationId` de otra institución
      cae en `skipped` como `not-found`.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
