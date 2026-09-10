---
id: RPT-07-bulk-report-download
feature: bulk-report-download
status: draft
created: 2026-09-09
---

# RPT-07 — Descargue masivo de informes (spec)

## Objetivo
El Jefe de Área selecciona varios estudiantes y descarga **un único PDF consolidado** con sus
informes (Carta Comunicativa o Lista de Chequeo), en vez de abrir un modal por estudiante. El
backend deja de resolver los datos informe por informe: un endpoint de lote los devuelve con un
número **constante** de consultas a Mongo.

## Alcance
**Incluye:**
- **Backend — endpoint de lote por tipo de informe.** `POST /api/reports/checklist/bulk` y
  `POST /api/reports/communicative-letter/bulk` reciben `valuationIds[]` y devuelven los
  templates resueltos más la lista de descartados. Rol: **solo Jefe de Área**.
- **Backend — resolución por lote.** Nueva `buildReportContexts(valuationIds, ...)` que sustituye
  las ~10 consultas por informe (`report.service.ts:44-128` + `student-valuation.service.ts:97-191`)
  por ~6 consultas para todo el lote: `$in` por colección, `.lean()` en todas y mapeo en memoria
  en vez de los tres `populate()` de `populateAndMapValuation`.
- **Backend — el camino individual delega en el de lote.** `buildReportContext` pasa a invocar
  `buildReportContexts` con un solo id y traduce el descarte a su `AppError` de siempre. Una sola
  implementación; los endpoints individuales heredan la mejora sin cambiar su contrato HTTP.
- **Backend — descarte tolerante.** Un id inexistente, de otro inquilino, no evaluado o sin
  conceptos suficientes **no rompe el lote**: se omite y se reporta en `skipped` con su motivo.
- **Frontend — selección múltiple.** `ReportsTable` gana casilla por fila y casilla maestra. La
  fila apunta al `valuationId` del **periodo activo** del estudiante; queda deshabilitada si no
  tiene valoración de ese periodo o si su estado no es `Evaluado`.
- **Frontend — documento consolidado.** El subárbol `<Page>` por estudiante se extrae a su propio
  componente y lo componen tanto el `<Document>` individual como el masivo. Sin cambio visual en
  el informe individual respecto de RPT-06.
- **Frontend — descarga a disco.** Utilidad nueva `downloadBlob` (`createObjectURL` → `<a
  download>` → `revokeObjectURL`): hoy no existe precedente, la única descarga la hace
  `PDFDownloadLink` por dentro.

**Fuera:**
- **Render de PDF en backend.** Evaluado y descartado: `quartz-api` corre con `ts-node` sin paso
  de build, `module: "CommonJS"`, sin `jsx` ni React, y no hay workspace que permita compartir los
  componentes `.tsx` sin duplicarlos. Ver `plan.md` § *Por qué el render sigue en el navegador*.
- Envío por correo y generación desatendida de informes.
- Almacenar PDFs — prohibido por `docs/domain.md:66`.
- Descargue masivo para el rol Docente. El scoping por sede ya existe en el service si se habilita
  después.
- ZIP con un PDF por estudiante.
- Filtrado y paginación server-side en `GET /api/users`: hoy la lista llega completa y
  `ReportsPage` filtra y pagina en cliente (`ITEMS_PER_PAGE = 10`). No se toca.
- Barra de progreso durante la generación (no existe el componente y el caso no lo amerita).
- Unificar los DTOs de informe duplicados entre `quartz-api` y `quartz-web`: requeriría workspace.
  Deuda anotada.
- Refactor de `populateAndMapValuation`, que sigue vigente para los endpoints de
  `student-valuation`.

## Criterios de aceptación (EARS)
- [ ] Cuando el Jefe de Área selecciona N estudiantes y descarga, el sistema entrega **un solo
      archivo PDF** con los N informes, uno por bloque de páginas.
- [ ] Cuando se descarga un lote de N estudiantes, el sistema emite **una sola** petición de datos
      al backend, sin importar el valor de N.
- [ ] Cuando un estudiante no tiene valoración del periodo activo, o su estado no es `Evaluado`,
      el sistema deshabilita su casilla de selección e indica el motivo.
- [ ] Cuando la casilla maestra se marca, el sistema selecciona todos los estudiantes
      seleccionables del filtro vigente, no solo los de la página visible.
- [ ] Si el lote incluye ids inexistentes, de otro inquilino, no evaluados o sin cobertura de
      conceptos, el sistema los omite, los reporta en `skipped` con su motivo y genera el PDF con
      los restantes.
- [ ] Si **todos** los ids del lote resultan descartados, el sistema no genera PDF e informa al
      usuario cuántos se omitieron y por qué.
- [ ] Si el lote excede `BULK_REPORT_MAX_ITEMS`, el sistema responde 400 sin consultar Mongo.
- [ ] Cuando se resuelve un lote de N informes, el sistema ejecuta un número de consultas a Mongo
      **independiente de N** (~6, o ~7 para Carta Comunicativa).
- [ ] Cuando se solicita un informe individual, el sistema conserva su contrato actual: 404 si no
      existe, 409 si no está evaluada, 403 si el Docente pide otra sede, 422 si faltan conceptos.
- [ ] Cuando el backend devuelve el lote, los informes vienen ordenados por apellido y luego
      nombre del estudiante.
- [ ] Si un Docente invoca cualquiera de los endpoints de lote, el sistema responde 403; el botón
      de descarga masiva no se renderiza para ese rol.
- [ ] Cuando se genera el PDF consolidado, el sistema no emite ninguna petición de imagen (escudo,
      iconos de estado ni banda de footer) — garantizado por RPT-06.
- [ ] **Aislamiento:** los endpoints de lote resuelven `institutionId` desde el token;
      `valuationIds` del body solo **filtra**, nunca determina el inquilino. Un id de otra
      institución cae en `skipped` como `not-found`, sin revelar su existencia.
- [ ] `npx tsc --noEmit` en verde en `quartz-api` · `npm run build && npm run lint` en verde en
      `quartz-web`.

## Dependencias
- **RPT-06-pdf-asset-pipeline (bloqueante).** Aporta `LetterPageShell`, los assets en base64 —sin
  ellos 16 informes dispararían 48 peticiones de iconos— y el escudo resuelto una vez por sesión,
  reutilizable como `shieldSrc` único para todo el lote.
- `@react-pdf/renderer@^4.5.1` ya instalado en `quartz-web`; se usa su API programática
  `pdf(<Doc/>).toBlob()`, no `PDFDownloadLink`.
- `findScoped` / `findOneScoped` de `quartz-api/src/repositories/base.repository.ts`.
- `apiPost` de `quartz-web/src/api/apiClient.ts` (ya acepta `AxiosRequestConfig` completo).
- `Checkbox` y `Tooltip` de `@material-tailwind/react`; `Button` de `components/ui` (ya soporta
  `isLoading` + `loadingText`).

## Trazabilidad
- Backend:  quartz-api/src/features/report/ · quartz-api/src/features/student-valuation/
- Frontend: quartz-web/src/features/report/ · quartz-web/src/utils/ · quartz-web/src/components/common/
- Branch:   feat/RPT-07-bulk-report-download
