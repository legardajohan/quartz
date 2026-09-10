# RPT-07 — Tasks

> Se implementa **después** de `RPT-06-pdf-asset-pipeline` (aporta `LetterPageShell`, los assets
> en base64 y el escudo cacheado por sesión).

## Backend (`quartz-api`)

### 1. Contratos
- [ ] `report.types.ts` — `BulkReportSkipReason`, `IBulkReportSkip`,
      `IBulkChecklistReportResponse`, `IBulkCommunicativeLetterResponse`.
- [ ] `report.validation.ts` — `BULK_REPORT_MAX_ITEMS = 50`, `bulkReportBody` con
      `z.array(objectIdSchema).min(1).max(BULK_REPORT_MAX_ITEMS)`, y los dos schemas
      `{ body }.strict()`.

### 2. Resolución por lote
- [ ] `student-valuation.service.ts` — extraer y exportar `mapValuationToDTO(valuation, students,
      periods, subjects)` desde el cuerpo de `populateAndMapValuation` (líneas 119-170); dejar que
      `populateAndMapValuation` delegue en ella. No cambiar su firma pública.
- [ ] `report.service.ts` — `buildReportContexts(valuationIds, institutionId, role, schoolId?)`
      con las ~6 consultas de `plan.md`: `$in` por colección, `.lean()` en todas, consultas 2-5 en
      `Promise.all`, mapeo en memoria con `Map`. Devuelve `{ contexts, skipped }` y **no lanza**
      por elemento inválido.
- [ ] `report.service.ts` — `buildReportContext` pasa a envolver `buildReportContexts([id], ...)`
      y traduce el descarte a su `AppError` de siempre: `not-found` → 404, `not-completed` → 409,
      `forbidden-school` → 403.
- [ ] Confirmar que los endpoints individuales (`getChecklistReport`,
      `getCommunicativeLetterReport`) siguen devolviendo exactamente los mismos códigos y cuerpos.

### 3. Endpoints de lote
- [ ] `report.service.ts` — `getBulkChecklistReport(...)`: una sola consulta
      `findScoped(ChecklistTemplateModel, ..., { _id: { $in: templateIds } })` para los nombres de
      plantilla, conservando el fallback `'Plantilla eliminada'`.
- [ ] `report.service.ts` — `getBulkCommunicativeLetterReport(...)`: un solo
      `findScoped(ConceptModel, ..., { periodId: { $in: periodIds } })` para todo el lote;
      `findMissingConceptCoverage` por informe, y el que falle cae en `skipped` con
      `missing-concepts` en vez de lanzar 422.
- [ ] Ambas funciones ordenan `reports` por `student.lastName`, luego `student.firstName`.
- [ ] `report.controller.ts` — `getBulkChecklistReportController` y
      `getBulkCommunicativeLetterReportController`: `valuationIds` de `req.body`,
      `institutionId`/`role`/`schoolId` de `req.user!`, `res.status(200).json(result)`. Sin
      `try/catch`.
- [ ] `report.routes.ts` — `POST /checklist/bulk` y `POST /communicative-letter/bulk` con
      `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(schema) →
      asyncHandler`. **Registrarlas antes** de las rutas `/:valuationId`.

## Frontend (`quartz-web`)

### 4. Tipos y utilidades
- [ ] `features/report/types/api.ts` — espejo de `IBulkReportSkip`,
      `IBulkChecklistReportResponse`, `IBulkCommunicativeLetterResponse` y del union de motivos.
- [ ] `utils/downloadBlob.ts` — `downloadBlob(blob, fileName)`: `createObjectURL` → `<a download>`
      → `click()` → `remove()` → `revokeObjectURL`.

### 5. Store
- [ ] `features/report/types/store.ts` — `selectedValuationIds`, `isBulkDownloading`,
      `bulkError` y las firmas de las acciones nuevas.
- [ ] `useReportStore.ts` — `toggleValuationSelection`, `selectAllValuations`,
      `clearValuationSelection`, `fetchBulkChecklistReports`, `fetchBulkCommunicativeLetters`
      (vía `apiPost`). **Sin importar `@react-pdf/renderer`** en este archivo.

### 6. Documentos consolidados
- [ ] `components/CommunicativeLetterPages.tsx` — extraer de `CommunicativeLetterDocument.tsx` el
      contenido de un estudiante (`LetterPageShell` + cuerpo), con sus estilos.
- [ ] `components/ChecklistReportPages.tsx` — extraer de `ChecklistReportDocument.tsx` el subárbol
      `<Page>` de un estudiante, con sus estilos.
- [ ] `components/CommunicativeLetterDocument.tsx` y `components/ChecklistReportDocument.tsx` —
      quedan como `<Document>` envolviendo **un** `*Pages`. Verificar cero cambio visual respecto
      de RPT-06.
- [ ] `components/CommunicativeLetterBulkDocument.tsx` y `components/ChecklistReportBulkDocument.tsx`
      — `<Document>` mapeando N `*Pages`, con un único `shieldSrc` para todo el lote.

### 7. Selección y descarga
- [ ] `components/ReportsTable.tsx` — columna de selección con `Checkbox` de Material Tailwind por
      fila y casilla maestra; la fila apunta al `valuationId` del periodo activo.
- [ ] `ReportsTable.tsx` — casilla deshabilitada + `Tooltip` con el motivo cuando el estudiante no
      tiene valoración del periodo activo o su `status !== 'Evaluado'`.
- [ ] La casilla maestra selecciona **todos los seleccionables del filtro vigente**, no solo la
      página visible.
- [ ] `useBulkReportDownload.ts` — pide el lote, arma el `*BulkDocument`, genera el blob con
      `pdf(<Doc/>).toBlob()` y lo pasa a `downloadBlob`. Devuelve `{ download(kind), isDownloading }`.
- [ ] `pages/ReportsPage.tsx` — barra de acción con conteo de seleccionados y los dos botones
      (`Button` con `isLoading` + `loadingText`), visible solo si el rol es `Jefe de Área`.
- [ ] `ReportsPage.tsx` — toast de cierre; advertencia si `skipped.length > 0`; no generar PDF si
      `reports.length === 0`.

## Verificación final
- [ ] `cd quartz-api && npx tsc --noEmit` en verde.
- [ ] `cd quartz-web && npm run build && npm run lint` en verde (sin errores nuevos).
- [ ] Servidor arranca sin errores de compilación ni runtime.
- [ ] Manual — seleccionar 16 estudiantes evaluados y descargar: un solo PDF con los 16, ordenados
      por apellido.
- [ ] Manual — DevTools/Network durante esa descarga: **una sola** petición `POST .../bulk` y
      **cero** peticiones de imagen.
- [ ] Manual — lote con evaluados y no evaluados: el PDF sale con los válidos y el aviso indica
      cuántos se omitieron.
- [ ] Manual — seleccionar solo no evaluados: no se genera PDF, se informa el motivo.
- [ ] Manual — enviar más de 50 ids (desde cliente HTTP): responde 400.
- [ ] Manual — como Docente: el botón de descarga masiva no aparece y el endpoint responde 403.
- [ ] Manual — informe individual (checklist y carta) sigue igual que en RPT-06, incluidos sus
      errores 404 / 409 / 422.
- [ ] Repaso de aislamiento: ninguna consulta del feature sin `institutionId` del token; los
      endpoints de lote no leen `institutionId` de `body`, `params` ni `query`; un `valuationId`
      de otra institución cae en `skipped` como `not-found`.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
