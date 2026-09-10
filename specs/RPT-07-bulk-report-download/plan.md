# RPT-07 — Plan técnico

## Decisiones de arquitectura

### Por qué el render sigue en el navegador
El backend no renderiza el PDF. Razones medidas sobre el repo, no de principio:

| Obstáculo | Estado actual |
|---|---|
| Sin paso de build | `quartz-api` arranca con `ts-node src/app.ts` (`package.json`, scripts `start`/`dev`) |
| Sin JSX | `quartz-api/tsconfig.json` no declara `jsx`; `module: "CommonJS"` |
| Sin React ni PDF | `quartz-api/package.json` no tiene `react` ni `@react-pdf/renderer` |
| Sin workspace | No hay `package.json` raíz ni `packages/`; los DTOs de informe ya están duplicados a mano entre paquetes |
| ESM/WASM | `@react-pdf/renderer@4` + `yoga-layout` son ESM-first; no hay `engines` que fije la versión de Node del servidor |

Mover el render implicaría agregar React al API, habilitar JSX en un tsconfig CommonJS, resolver
la interop ESM/WASM bajo `ts-node` y **duplicar los componentes `.tsx`**. El navegador ya renderiza
estos mismos documentos correctamente hoy.

**El cuello de botella no es el render, son los round-trips**, y ese sí se arregla en backend.
Cuando se necesite envío por correo o generación desatendida, RPT-06 dejó los componentes
portables a Node y esa migración se hace en su propio spec.

### De ~10·N consultas a ~6 constantes
Hoy, resolver **un** informe encadena ~10 consultas: `populate()` no es un JOIN (Mongoose lanza
una consulta por path poblado, `student-valuation.service.ts:100-104`) y el estudiante y el
periodo se traen dos veces, porque `populateAndMapValuation` y `buildReportContext` no comparten
lo ya cargado. Con 16 estudiantes son ~160 viajes encadenados.

`buildReportContexts` los resuelve por lote:

| # | Consulta | Nota |
|---|---|---|
| 1 | `findScoped(StudentValuationModel, institutionId, { _id: { $in: ids } }).lean()` | `.lean()`: hoy `getStudentValuationById` hidrata el documento Mongoose completo solo para mapearlo a DTO |
| 2 | `findScoped(User, institutionId, { _id: { $in: [...studentIds, ...teacherIds] } }).lean()` | estudiantes y docentes en **una** consulta |
| 3 | `findScoped(Period, institutionId, { _id: { $in: periodIds } }).lean()` | |
| 4 | `findScoped(Subject, institutionId, {}).select('name evaluationMode').lean()` | son 7 dimensiones: traerlas todas sale más barato que poblar por valoración |
| 5 | `Institution.findById(institutionId).lean()` | una sola vez para todo el lote |
| 6 | `findScoped(SchoolModel, institutionId, { _id: { $in: schoolIds } }).lean()` | secuencial: los `schoolId` salen de la #2 |
| +1 | `findScoped(ConceptModel, institutionId, { periodId: { $in: periodIds } })` | solo Carta Comunicativa; hoy ya se hace, pero una vez **por informe** (`report.service.ts:200`) |

Las consultas 2-5 van en un `Promise.all`; la 6 depende de la 2. El mapeo a DTO se hace en memoria
con `Map` indexados por `_id`, sin `populate`.

### El camino individual delega en el de lote
`buildReportContext(valuationId, ...)` pasa a ser un envoltorio de
`buildReportContexts([valuationId], ...)` que traduce el descarte al `AppError` correspondiente.
Una sola implementación de la resolución de datos; el contrato HTTP de los endpoints individuales
no cambia (404 / 409 / 403 / 422 idénticos).

La diferencia entre ambos caminos es solo la política de fallo: el individual **lanza**, el de lote
**acumula en `skipped`**.

### POST para una lectura
Los endpoints de lote usan `POST` porque N ObjectIds de 24 caracteres no caben con holgura en una
query string. Desviación consciente del resto del feature, que es `GET`.

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/report/report.types.ts` |
| tocar | `src/features/report/report.validation.ts` |
| tocar | `src/features/report/report.service.ts` |
| tocar | `src/features/report/report.controller.ts` |
| tocar | `src/features/report/report.routes.ts` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/report/components/CommunicativeLetterPages.tsx` |
| crear | `src/features/report/components/ChecklistReportPages.tsx` |
| crear | `src/features/report/components/CommunicativeLetterBulkDocument.tsx` |
| crear | `src/features/report/components/ChecklistReportBulkDocument.tsx` |
| crear | `src/features/report/useBulkReportDownload.ts` |
| crear | `src/utils/downloadBlob.ts` |
| tocar | `src/features/report/types/api.ts` |
| tocar | `src/features/report/types/store.ts` |
| tocar | `src/features/report/useReportStore.ts` |
| tocar | `src/features/report/components/CommunicativeLetterDocument.tsx` |
| tocar | `src/features/report/components/ChecklistReportDocument.tsx` |
| tocar | `src/features/report/components/ReportsTable.tsx` |
| tocar | `src/features/report/pages/ReportsPage.tsx` |
| tocar | `src/components/common/DataTable.tsx` (solo si la selección se resuelve ahí) |

## Contratos

### Tipos / DTOs (`report.types.ts`)
```ts
export type BulkReportSkipReason =
  | 'not-found'         // no existe, o no pertenece al inquilino del token
  | 'not-completed'     // globalStatus !== Evaluado
  | 'forbidden-school'  // Docente pidiendo estudiante de otra sede
  | 'missing-concepts'; // solo carta: findMissingConceptCoverage encontró faltantes

export interface IBulkReportSkip {
  valuationId: string;
  reason: BulkReportSkipReason;
}

export interface IBulkChecklistReportResponse {
  reports: IReportTemplate[];
  skipped: IBulkReportSkip[];
}

export interface IBulkCommunicativeLetterResponse {
  reports: ICommunicativeLetterTemplate[];
  skipped: IBulkReportSkip[];
}
```
`reports` sale ordenado por `student.lastName`, luego `student.firstName`: el orden del PDF se
decide en un solo lugar.

Espejo de los tres tipos en `quartz-web/src/features/report/types/api.ts`, siguiendo la convención
vigente del proyecto (los DTOs de informe ya se duplican a mano entre paquetes).

### Modelo Mongoose
**Sin cambios.** No hay campos ni colecciones nuevas.

### Service (`report.service.ts`)
```ts
interface BuildReportContextsResult {
  contexts: ReportContext[];              // en el orden de entrada, ya filtrados
  skipped: IBulkReportSkip[];
}

async function buildReportContexts(
  valuationIds: string[],
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<BuildReportContextsResult>
```
- Nunca lanza por un elemento inválido: lo agrega a `skipped`.
- Sigue lanzando `AppError(..., 500)` ante inconsistencia real de datos (institución o sede
  ausentes), igual que hoy `buildReportContext:75-77`.

```ts
export async function getBulkChecklistReport(
  valuationIds: string[], institutionId: string, requestorRole: UserRole, requestorSchoolId?: string
): Promise<IBulkChecklistReportResponse>

export async function getBulkCommunicativeLetterReport(
  valuationIds: string[], institutionId: string, requestorRole: UserRole, requestorSchoolId?: string
): Promise<IBulkCommunicativeLetterResponse>
```
- `getBulkChecklistReport` resuelve los nombres de plantilla con **una** consulta
  `findScoped(ChecklistTemplateModel, institutionId, { _id: { $in: templateIds } })`, conservando
  el fallback `'Plantilla eliminada'` de `getChecklistReport:143`.
- `getBulkCommunicativeLetterReport` reutiliza el `conceptsByKey` del lote completo y aplica
  `findMissingConceptCoverage` por informe: el que falle cae en `skipped` con `missing-concepts`
  en vez de lanzar 422.

### Service (`student-valuation.service.ts`)
Se extrae y exporta el mapeo en memoria que hoy vive dentro de `populateAndMapValuation`
(líneas 119-170), para que el camino de lote arme el `IStudentValuationDTO` sin `populate`:
```ts
export function mapValuationToDTO(
  valuation: IStudentValuationLean,
  students: Map<string, StudentNameFields>,
  periods: Map<string, { name: string }>,
  subjects: Map<string, { name: string }>
): IStudentValuationDTO
```
`populateAndMapValuation` se conserva —la usan `getStudentValuations` y `getStudentValuationById`
desde los endpoints de `student-valuation`— y pasa a delegar su paso de mapeo en esta función.

### Zod (`report.validation.ts`)
```ts
export const BULK_REPORT_MAX_ITEMS = 50;

const bulkReportBody = z.object({
  valuationIds: z.array(objectIdSchema).min(1).max(BULK_REPORT_MAX_ITEMS),
}).strict();

export const getBulkChecklistReportSchema = z.object({ body: bulkReportBody }).strict();
export const getBulkCommunicativeLetterSchema = z.object({ body: bulkReportBody }).strict();
```
El tope corta antes de tocar Mongo. `BULK_REPORT_MAX_ITEMS` se exporta para que el frontend
muestre el límite sin hardcodearlo dos veces.

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| POST | `/api/reports/checklist/bulk` | Jefe de Área | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(getBulkChecklistReportSchema) → asyncHandler` |
| POST | `/api/reports/communicative-letter/bulk` | Jefe de Área | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(getBulkCommunicativeLetterSchema) → asyncHandler` |

Se registran **antes** de las rutas `/:valuationId` en `report.routes.ts`, por el mismo motivo que
ya obligó a poner `availability` primero (`report.routes.ts:43-44`): Express capturaría `bulk` como
`valuationId` y `validate` lo rechazaría por el regex de ObjectId.

Son las primeras rutas del feature restringidas a un solo rol; las cinco existentes autorizan
`[JEFE_DE_AREA, DOCENTE]`.

Controllers: extraen `req.body.valuationIds`, `institutionId`/`role`/`schoolId` de `req.user!`,
responden `res.status(200).json(result)`. Sin `try/catch`.

### Frontend

**Composición de documentos** — se extrae el subárbol `<Page>` por estudiante para que individual
y masivo compartan maquetado:

| Componente | Contenido |
|---|---|
| `CommunicativeLetterPages.tsx` | `LetterPageShell` (RPT-06) + cuerpo de **un** estudiante |
| `ChecklistReportPages.tsx` | subárbol `<Page>` de **un** estudiante del checklist |
| `CommunicativeLetterDocument.tsx` | `<Document>` con un `CommunicativeLetterPages` |
| `ChecklistReportDocument.tsx` | `<Document>` con un `ChecklistReportPages` |
| `CommunicativeLetterBulkDocument.tsx` | `<Document>` mapeando N `CommunicativeLetterPages` |
| `ChecklistReportBulkDocument.tsx` | `<Document>` mapeando N `ChecklistReportPages` |

`shieldSrc` es **uno solo** para todo el lote: viene de `useInstitutionShieldQuery` (RPT-06).
Sin cambio visual en el informe individual.

**`useReportStore.ts`** — estado y acciones nuevas:
```ts
selectedValuationIds: string[];
isBulkDownloading: boolean;
bulkError: string | null;

toggleValuationSelection(valuationId: string): void;
selectAllValuations(valuationIds: string[]): void;   // reemplaza la selección
clearValuationSelection(): void;
fetchBulkChecklistReports(ids: string[]): Promise<IBulkChecklistReportResponse>;
fetchBulkCommunicativeLetters(ids: string[]): Promise<IBulkCommunicativeLetterResponse>;
```
El store **no** importa `@react-pdf/renderer`: rompería el aislamiento de bundle que consiguió
RPT-06 (el store se carga con la app, la página de informes no).

**`useBulkReportDownload.ts`** — vive en el chunk lazy de informes. Pide el lote al store, arma el
`*BulkDocument`, genera el blob con `pdf(<Doc/>).toBlob()` y lo entrega a `downloadBlob`. Devuelve
`{ download(kind), isDownloading }`.

**`utils/downloadBlob.ts`** — junto a `blobToDataUrl.ts`:
```ts
export function downloadBlob(blob: Blob, fileName: string): void
```
`createObjectURL` → `<a download>` → `click()` → `remove()` → `revokeObjectURL`. No existe
precedente en el proyecto: hoy la única descarga a disco la hace `PDFDownloadLink` por dentro.

Nombre de archivo: `carta-comunicativa-consolidado-<periodo>-<YYYYMMDD>.pdf` y
`lista-chequeo-consolidado-<periodo>-<YYYYMMDD>.pdf`.

**`ReportsTable.tsx`** — columna de selección:
- `Checkbox` de `@material-tailwind/react` por fila; casilla maestra en el encabezado.
- La fila apunta al `valuationId` del **periodo activo** (`user.valuations[].periodId`);
  `ReportsPage` ya resuelve el periodo activo para `fetchLetterAvailability`.
- Casilla deshabilitada + `Tooltip` con el motivo cuando no hay valoración del periodo activo o
  `status !== 'Evaluado'`.
- La maestra marca **todos los seleccionables del filtro vigente**, no solo la página visible: la
  paginación es client-side (`ITEMS_PER_PAGE = 10`).
- `DataTable.tsx` no soporta selección de filas. Al implementar, elegir entre extenderlo con props
  opcionales o resolverlo en `ReportsTable`, según lo menos invasivo para sus otros consumidores.

**`ReportsPage.tsx`** — barra de acción con el conteo de seleccionados y dos botones (`Button` de
`components/ui`, con `isLoading` + `loadingText`), visible solo si
`sessionData?.user.role === 'Jefe de Área'` (`/informes` no está bajo `RoleRoute`). Cierre con
`react-hot-toast`; si `skipped.length > 0`, toast de advertencia con el conteo y el motivo
dominante. Si `reports.length === 0`, no se genera PDF.

## Notas
- **Orden de implementación:** después de RPT-06. Sin sus assets en base64, un lote de 16 informes
  dispararía 48 peticiones de iconos; sin `LetterPageShell`, el documento masivo duplicaría el
  maquetado de la carta.
- **Aislamiento:** `valuationIds` viene del body pero solo **filtra**. `institutionId` sale del
  token y va en todas las consultas vía `findScoped`. Un id de otro inquilino no vuelve del `$in`
  y cae en `skipped` como `not-found`, sin revelar su existencia.
- **`forbidden-school`** se conserva aunque los endpoints de lote sean solo de Jefe de Área:
  `buildReportContexts` es compartida con el camino individual, donde el Docente sí llega.
- **Tope de 50** es una cota de v1: acota el trabajo de layout en el navegador y el tamaño de la
  respuesta. Si aparece el caso de una sede completa, se revisa con medición, no antes.
- **Deuda que este spec no aborda:** los DTOs de informe siguen duplicados entre paquetes
  (unificarlos exige convertir el repo en workspace) y `GET /api/users` sigue sin filtrar por
  periodo/grado en servidor.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- DevTools → Network al descargar un lote de 16: **una sola** petición `POST .../bulk` y **cero**
  peticiones de imagen.
