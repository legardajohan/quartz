---
id: RPT-07-bulk-report-download
feature: bulk-report-download
status: implemented
created: 2026-09-09
---

# RPT-07 — Descargue masivo de informes (spec)

## Objetivo
`/Informes` gana pestañas y un modo de descarga masiva:
- **Individual**: sin cambios de UX respecto de antes de este spec — tabla de estudiantes con
  vista puntual (un informe a la vez) por icono. **La selección múltiple por checkbox, evaluada
  durante la implementación, se descartó por feedback directo del usuario ("no me gustó en
  absoluto") y se revirtió antes de cerrar el feature** — ver nota post-implementación más abajo.
- **Consolidado**: el usuario define una cohorte por Sede + Grado + Jornada (si aplica) +
  Periodo, y descarga un único PDF con los informes de todos los estudiantes evaluados que la
  componen, sin seleccionarlos uno a uno. Este es el único modo de descarga masiva expuesto en la UI.

El backend resuelve cualquier lote con un número de consultas a Mongo **constante**, independiente
de cuántos estudiantes entren en el PDF — el endpoint de lote por ids (`/bulk`) sigue existiendo y
sigue cubierto por esta misma resolución, pero hoy no tiene un control en la UI que lo invoque (ver
nota).

> **Nota post-implementación (feedback UX, posterior al cierre inicial):** el diseño original
> incluía selección por checkbox en la pestaña Individual (fila + casilla maestra) para descargar
> un PDF con varios estudiantes elegidos a mano. Se implementó, se probó, y el usuario pidió
> quitarla por completo ("quitamos eso de lista de chequeo y carta comunicativa, no me gustó en
> absoluto"). Se revirtió: `ReportsTable.tsx` volvió a su forma sin selección, `IndividualReportsPanel.tsx`
> perdió la barra de acción y el estado de selección, y `useReportStore`/`useBulkReportDownload` se
> simplificaron para cubrir solo el modo por cohorte. **El backend no se tocó**: `POST
> /api/reports/{checklist,communicative-letter}/bulk` (por ids) sigue implementado, probado y
> documentado más abajo — es una API válida sin consumidor en la UI hoy, no código muerto a
> eliminar sin que alguien lo pida explícitamente.

## Alcance
**Incluye:**
- **Backend — endpoint de lote por ids.** `POST /api/reports/checklist/bulk` y
  `POST /api/reports/communicative-letter/bulk` reciben `valuationIds[]` y devuelven los
  templates resueltos más la lista de descartados. Rol: **Jefe de Área y Docente**.
- **Backend — endpoint de lote por cohorte.** `POST /api/reports/checklist/consolidated` y
  `POST /api/reports/communicative-letter/consolidated` reciben `{ schoolId?, grade, shiftId?,
  periodId }`, resuelven los estudiantes que la cohorte describe y devuelven la misma forma que
  el endpoint de lote por ids. Rol: **Jefe de Área y Docente**.
- **Backend — resolución por lote.** `buildReportContexts(valuationIds, ...)` sustituye las ~10
  consultas por informe (`report.service.ts:44-128` + `student-valuation.service.ts:97-191`) por
  ~6 consultas para todo el lote: `$in` por colección, `.lean()` en todas, mapeo en memoria en
  vez de los tres `populate()` de `populateAndMapValuation`. La reutilizan los 4 endpoints de
  lote y el camino individual.
- **Backend — el camino individual delega en el de lote.** `buildReportContext` pasa a invocar
  `buildReportContexts` con un solo id y traduce el descarte a su `AppError` de siempre. Una sola
  implementación; los endpoints individuales heredan la mejora sin cambiar su contrato HTTP.
- **Backend — descarte tolerante.** Un id inexistente, de otro inquilino, no evaluado o sin
  conceptos suficientes **no rompe el lote**: se omite y se reporta en `skipped` con su motivo.
  Lo mismo aplica a los estudiantes de una cohorte que no tengan valoración `Evaluado` del
  periodo pedido.
- **Backend — aislamiento de sede para Docente en `/consolidated`.** Si el rol es Docente, el
  `schoolId` del body se **ignora**; la cohorte se fuerza a `req.user!.schoolId`. Si es Jefe de
  Área, el `schoolId` enviado se respeta tal cual, y su ausencia significa "todas las sedes".
- **Frontend — pestañas en `/Informes`.** `Tabs`/`TabsHeader`/`TabsBody`/`TabPanel` de
  `@material-tailwind/react`, con la paleta/motion de `UsersPage.tsx` (`bg-purple-50/60 p-1.5`,
  color activo/inactivo por ternario, `active:scale-[0.98]`) y estructura de paneles de
  `ConfigurationPage.tsx` (contenido íntegramente distinto por pestaña). Iconos heroicons
  outline: `UserIcon` (Individual) / `UserGroupIcon` (Consolidado). Estado de pestaña en
  `useState` local, sin persistir en la URL.
- ~~**Frontend — selección múltiple (pestaña Individual).**~~ Implementada y luego **revertida**
  por feedback del usuario — ver nota post-implementación. `ReportsTable` no tiene selección; la
  pestaña Individual queda igual que antes de este spec, salvo que su columna "Informes" ahora
  resuelve el `valuationId` del **periodo activo** del estudiante (antes tomaba `valuations[0]`
  sin filtrar por período, un bug preexistente que se corrigió de paso y se conservó tras la
  reversión por ser estrictamente más correcto).
- **Frontend — panel de cohorte (pestaña Consolidado).** Selects de Sede, Grado, Jornada (solo si
  `multipleShifts`, con opción "Todas las jornadas") y Periodo (cualquiera de la institución, no
  solo el activo). Para el Docente, el select de Sede aparece deshabilitado y precargado con su
  propia sede; para el Jefe de Área queda libre entre todas las de la institución.
- **Frontend — documento consolidado.** El subárbol `<Page>` por estudiante se extrae a su propio
  componente y lo componen tanto el `<Document>` individual como el masivo (compartido por ambas
  pestañas). Sin cambio visual en el informe individual respecto de RPT-06.
- **Frontend — descarga a disco.** Utilidad nueva `downloadBlob` (`createObjectURL` → `<a
  download>` → `revokeObjectURL`): hoy no existe precedente, la única descarga la hace
  `PDFDownloadLink` por dentro.

**Fuera:**
- **Render de PDF en backend.** Evaluado y descartado: `quartz-api` corre con `ts-node` sin paso
  de build, `module: "CommonJS"`, sin `jsx` ni React, y no hay workspace que permita compartir los
  componentes `.tsx` sin duplicarlos. Ver `plan.md` § *Por qué el render sigue en el navegador*.
- Envío por correo y generación desatendida de informes.
- Almacenar PDFs — prohibido por `docs/domain.md:66`.
- ZIP con un PDF por estudiante — tanto Individual como Consolidado entregan **un solo** PDF.
- Filtrado y paginación server-side en `GET /api/users`: la pestaña Individual sigue filtrando y
  paginando en cliente (`ITEMS_PER_PAGE = 10`). No se toca.
- Barra de progreso durante la generación (no existe el componente y el caso no lo amerita).
- Unificar los DTOs de informe duplicados entre `quartz-api` y `quartz-web`: requeriría workspace.
  Deuda anotada.
- Refactor de `populateAndMapValuation`, que sigue vigente para los endpoints de
  `student-valuation`.
- Estadísticas o agregados numéricos por cohorte (promedios, % de Logrado, etc.). "Consolidado"
  aquí significa *"un PDF con los informes de un grupo"*, no un reporte estadístico — no se
  confunde con el stub existente en `/gestion/consolidados` (`ConsolidatedPage.tsx`), que es un
  feature no relacionado y no implementado.
- Elegir más de una sede/grado/jornada a la vez en Consolidado (v1 = una cohorte por descarga).

## Criterios de aceptación (EARS)
- [x] Cuando el usuario abre `/Informes`, el sistema muestra dos pestañas: "Individual" y
      "Consolidado", con el estilo visual de los tabs de `/gestion/usuarios`.
- [ ] ~~Cuando el Jefe de Área o el Docente seleccionan N estudiantes en la pestaña Individual y
      descargan, el sistema entrega **un solo** archivo PDF con los N informes, uno por bloque de
      páginas.~~ **Revertido** (ver nota post-implementación): Individual no tiene selección ni
      descarga masiva en la UI. El endpoint `POST .../bulk` que lo habría servido sigue existiendo
      y sigue cubierto por `buildReportContexts` (misma consulta constante), sin consumidor de UI.
- [x] Cuando se descarga un consolidado de N estudiantes, el sistema emite **una sola** petición
      de datos al backend, sin importar el valor de N.
- [ ] ~~Cuando un estudiante no tiene valoración del periodo activo, o su estado no es `Evaluado`,
      el sistema deshabilita su casilla de selección en Individual e indica el motivo.~~
      **Revertido**: no existe casilla de selección en Individual.
- [ ] ~~Cuando la casilla maestra se marca, el sistema selecciona todos los estudiantes
      seleccionables del filtro vigente, no solo los de la página visible.~~ **Revertido**: no
      existe casilla maestra.
- [x] Cuando el Jefe de Área o el Docente definen una cohorte en Consolidado (sede, grado,
      jornada si aplica, periodo) y descargan, el sistema entrega un solo PDF con los informes de
      todos los estudiantes de esa cohorte cuyo estado sea `Evaluado` en el periodo elegido.
- [x] Si el Docente usa Consolidado, el sistema ignora cualquier `schoolId` que llegue en la
      petición y resuelve la cohorte con la sede de su propia sesión; el select de Sede en pantalla
      aparece deshabilitado y precargado con su sede.
- [x] Si el Jefe de Área usa Consolidado sin elegir sede, el sistema resuelve la cohorte sobre
      todas las sedes de la institución.
- [x] Cuando el inquilino tiene una sola jornada, el sistema no muestra el select de Jornada en
      Consolidado.
- [x] Si el lote incluye ids o una cohorte con estudiantes inexistentes, de otro inquilino, no
      evaluados o sin cobertura de conceptos, el sistema los omite, los reporta en `skipped` con
      su motivo y genera el PDF con los restantes.
- [x] Si **todos** los estudiantes de un lote o cohorte resultan descartados, el sistema no
      genera PDF e informa al usuario cuántos se omitieron y por qué.
- [x] Si una cohorte o un lote por ids excede `BULK_REPORT_MAX_ITEMS`, el sistema responde 422/400
      sin generar los contextos de informe.
- [x] Cuando se resuelve un lote o cohorte de N informes, el sistema ejecuta un número de
      consultas a Mongo **independiente de N** (~6-7, según tipo de informe).
- [x] Cuando se solicita un informe individual, el sistema conserva su contrato actual: 404 si no
      existe, 409 si no está evaluada, 403 si el Docente pide otra sede, 422 si faltan conceptos.
- [x] Cuando el backend devuelve un lote o cohorte, los informes vienen ordenados por apellido y
      luego nombre del estudiante.
- [x] Si un rol distinto de Jefe de Área o Docente invoca cualquiera de los 4 endpoints de lote,
      el sistema responde 403.
- [x] Cuando se genera el PDF consolidado, el sistema no emite ninguna petición de imagen (escudo,
      iconos de estado ni banda de footer) — garantizado por RPT-06.
- [x] **Aislamiento:** los endpoints de lote resuelven `institutionId` desde el token;
      `valuationIds`/filtros del body solo **filtran**, nunca determinan el inquilino. Un id o
      cohorte de otra institución cae en `skipped`/vacío, sin revelar su existencia. El `schoolId`
      de `/consolidated` nunca se acepta del body cuando el rol es Docente.
- [x] `npx tsc --noEmit` en verde en `quartz-api` · `npm run build && npm run lint` en verde en
      `quartz-web`.

## Dependencias
- **RPT-06-pdf-asset-pipeline (bloqueante, ya implementada).** Aporta `LetterPageShell`, los
  assets en base64 —sin ellos 16 informes dispararían 48 peticiones de iconos— y el escudo
  resuelto una vez por sesión, reutilizable como `shieldSrc` único para todo el lote.
- `@react-pdf/renderer@^4.5.1` ya instalado en `quartz-web`; se usa su API programática
  `pdf(<Doc/>).toBlob()`, no `PDFDownloadLink`.
- `findScoped` / `findOneScoped` de `quartz-api/src/repositories/base.repository.ts`.
- `apiPost` de `quartz-web/src/api/apiClient.ts` (ya acepta `AxiosRequestConfig` completo).
- `useSchoolsQuery` (`quartz-web/src/features/users/queries/useSchoolsQuery.ts`, `GET /schools`,
  sin restricción de rol) para poblar el select de Sede en Consolidado.
- `Select`/`Option` de `@material-tailwind/react` para el panel de cohorte; botones de descarga en
  Consolidado son `<button>` planos con clases Tailwind (`text-sm font-medium`, igual que los
  `Tab` de la cabecera, no el `Button` de `components/ui` — ese componente está pensado para CTAs
  grandes tipo login (`text-xl h-12 w-full`) y su texto no cabía en un botón de acción compacto).
  `Tabs`/`TabsHeader`/`TabsBody`/`TabPanel` (patrón de `UsersPage.tsx`/`ConfigurationPage.tsx`).

## Trazabilidad
- Backend:  quartz-api/src/features/report/ · quartz-api/src/features/student-valuation/
- Frontend: quartz-web/src/features/report/ · quartz-web/src/utils/ · quartz-web/src/components/common/
- Branch:   feat/RPT-07-bulk-report-download
