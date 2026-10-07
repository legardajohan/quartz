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

La diferencia entre los tres caminos (individual, lote por ids, lote por cohorte) es solo **cómo
se obtiene la lista de `valuationId`** antes de llamar a `buildReportContexts`, y la política de
fallo: el individual **lanza**, los dos de lote **acumulan en `skipped`**.

### Lote por ids vs. lote por cohorte: mismo motor, distinta entrada
Ambos endpoints de lote terminan en `buildReportContexts(valuationIds, ...)`. Lo único que
cambia es de dónde sale `valuationIds`:
- **`/bulk`**: viene directo del body (`valuationIds[]`) — el cliente ya sabe qué está pidiendo
  porque `ReportsTable` (pestaña Individual) ya tiene cargados los estudiantes y sus valoraciones
  del periodo activo.
- **`/consolidated`**: se **resuelve en el backend** a partir de `{ schoolId?, grade, shiftId?,
  periodId }`, porque el cliente no tiene precargadas las valoraciones de un periodo arbitrario
  ni de sedes que no sean la propia. Ver `resolveConsolidatedValuationIds` más abajo.

`StudentValuation` no tiene `schoolId`/`grade`/`shiftId` propios (`student-valuation.model.ts`):
esos campos viven en `User`. La resolución de cohorte hace un primer filtro sobre `User` y un
segundo sobre `StudentValuation` — dos consultas, no una, pero siguen siendo **O(1)** respecto a N.

### Aislamiento de sede en `/consolidated`: por qué no confiar en el body
`institutionId` ya se resuelve siempre del token (regla transversal del proyecto). Este spec
extiende el mismo principio a `schoolId` cuando el rol es Docente: aceptarlo del body permitiría
que un Docente pidiera el consolidado de una sede ajena simplemente cambiando el JSON. La regla:
- Zod valida `schoolId` como opcional en el body (forma única para ambos roles).
- El **service**, no el controller, decide: si `requestorRole === DOCENTE`, sobrescribe
  `schoolId` con `requestorSchoolId` sin importar lo que llegó; si es Jefe de Área, usa el valor
  del body tal cual (`undefined` = todas las sedes).

### POST para una lectura
Los 4 endpoints de lote usan `POST`: `/bulk` porque N ObjectIds de 24 caracteres no caben con
holgura en una query string; `/consolidated` por simetría con `/bulk` y porque ambos devuelven la
misma forma de respuesta. Desviación consciente del resto del feature, que es `GET`.

### Tabs de `/Informes`: estilo de `UsersPage`, estructura de `ConfigurationPage`
`UsersPage.tsx` usa `Tabs`+`TabsHeader`+`Tab` como filtro (sin `TabsBody`/`TabPanel`): un solo
listado por debajo, filtrado por el tab activo. No sirve tal cual aquí porque Individual y
Consolidado no comparten el mismo contenido (tabla+checkboxes vs. selects+botón) — se necesita
contenido separado por pestaña. Se toma:
- **Visual/motion de `UsersPage.tsx`**: `TabsHeader` con `bg-purple-50/60 p-1.5`; color de texto
  por ternario `isActive ? "text-purple-900" : "text-gray-600"`; `active:scale-[0.98]` en cada
  `Tab`; un icono heroicons por pestaña.
- **Estructura de `ConfigurationPage.tsx`**: `TabsBody` + `TabPanel` (uno por pestaña, contenido
  real distinto), envoltura `overflow-x-auto thin-scrollbar` si el ancho lo exige.
- Sin el badge numerado de `ConfigurationPage` (aquí no hay una secuencia de pasos) ni el
  subtítulo de dos líneas — dos pestañas simples, como `UsersPage`.

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
| crear | `src/features/report/components/IndividualReportsPanel.tsx` |
| crear | `src/features/report/components/ConsolidatedReportsPanel.tsx` |
| crear | `src/utils/downloadBlob.ts` |
| tocar | `src/features/report/types/api.ts` |
| tocar | `src/features/report/types/store.ts` |
| tocar | `src/features/report/useReportStore.ts` |
| tocar | `src/features/report/components/CommunicativeLetterDocument.tsx` |
| tocar | `src/features/report/components/ChecklistReportDocument.tsx` |
| tocar | `src/features/report/components/ReportsTable.tsx` |
| tocar | `src/features/report/pages/ReportsPage.tsx` (pasa a shell de Tabs) |
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

export interface IConsolidatedReportFilters {
  schoolId?: string;   // ignorado y sobrescrito por el service si requestorRole === DOCENTE
  grade: string;       // GradeLevel — hoy solo 'Transición' es seleccionable en el select
  shiftId?: string;    // ausente/omitido = todas las jornadas
  periodId: string;
}
```
`reports` sale ordenado por `student.lastName`, luego `student.firstName`, en los 4 endpoints:
el orden del PDF se decide en un solo lugar (`buildReportContexts`).

Espejo de los tipos en `quartz-web/src/features/report/types/api.ts`, siguiendo la convención
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

**Resolución de cohorte (nuevo, exclusivo de `/consolidated`):**
```ts
async function resolveConsolidatedValuationIds(
  filters: IConsolidatedReportFilters,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<string[]>
```
- `effectiveSchoolId = requestorRole === UserRole.DOCENTE ? requestorSchoolId : filters.schoolId`
  — el `schoolId` del body se ignora por completo para Docente.
- `findScoped(User, institutionId, { role: UserRole.ESTUDIANTE, gradesTaught: filters.grade,
  ...(effectiveSchoolId && { schoolId: effectiveSchoolId }), ...(filters.shiftId && { shiftId:
  filters.shiftId }) }).select('_id').lean()` → ids de estudiante.
- `findScoped(StudentValuationModel, institutionId, { studentId: { $in: studentIds }, periodId:
  filters.periodId, globalStatus: GlobalValuationStatus.COMPLETED }).select('_id').lean()` → ids
  de valoración. Los estudiantes sin valoración `Evaluado` de ese periodo simplemente no
  aparecen aquí (no generan una entrada en `skipped`: nunca fueron un id explícito pedido por el
  usuario, a diferencia de `/bulk`).
- Si `studentIds.length === 0`, devuelve `[]` sin la segunda consulta.
- Si el resultado supera `BULK_REPORT_MAX_ITEMS`, el caller (`getConsolidatedChecklistReport` /
  `getConsolidatedCommunicativeLetterReport`) lanza `AppError('El grupo tiene N estudiantes
  evaluados, supera el máximo de 50 por descarga. Ajusta los filtros.', 422)` **antes** de llamar
  a `buildReportContexts` — no se arma contexto de informe para descartarlo después.

```ts
export async function getConsolidatedChecklistReport(
  filters: IConsolidatedReportFilters, institutionId: string, requestorRole: UserRole, requestorSchoolId?: string
): Promise<IBulkChecklistReportResponse>

export async function getConsolidatedCommunicativeLetterReport(
  filters: IConsolidatedReportFilters, institutionId: string, requestorRole: UserRole, requestorSchoolId?: string
): Promise<IBulkCommunicativeLetterResponse>
```
Cada una: `resolveConsolidatedValuationIds` → validar tope → delegar en
`getBulkChecklistReport`/`getBulkCommunicativeLetterReport` con los ids resueltos. `skipped` en
la respuesta de estas dos funciones solo puede traer `not-completed` (una valoración que sí mat\
cheó la cohorte pero cuyo estado cambió entre la resolución y `buildReportContexts` — carrera
improbable pero posible) o `missing-concepts` para la carta; `not-found`/`forbidden-school` no
aplican porque la cohorte ya nació scoped al inquilino y, para Docente, a su sede.

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

const consolidatedReportBody = z.object({
  schoolId: objectIdSchema.optional(),
  grade: z.nativeEnum(GradeLevel),
  shiftId: objectIdSchema.optional(),
  periodId: objectIdSchema,
}).strict();

export const getBulkChecklistReportSchema = z.object({ body: bulkReportBody }).strict();
export const getBulkCommunicativeLetterSchema = z.object({ body: bulkReportBody }).strict();
export const getConsolidatedChecklistReportSchema = z.object({ body: consolidatedReportBody }).strict();
export const getConsolidatedCommunicativeLetterSchema = z.object({ body: consolidatedReportBody }).strict();
```
El tope de `/bulk` corta antes de tocar Mongo. El de `/consolidated` se valida después de
resolver la cohorte (no se conoce su tamaño de antemano). `BULK_REPORT_MAX_ITEMS` se exporta para
que el frontend muestre el límite sin hardcodearlo dos veces. `GradeLevel` se importa de
`../auth/auth.types`, igual que en `users.validation.ts`.

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| POST | `/api/reports/checklist/bulk` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(getBulkChecklistReportSchema) → asyncHandler` |
| POST | `/api/reports/communicative-letter/bulk` | Jefe de Área, Docente | ídem con `getBulkCommunicativeLetterSchema` |
| POST | `/api/reports/checklist/consolidated` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(getConsolidatedChecklistReportSchema) → asyncHandler` |
| POST | `/api/reports/communicative-letter/consolidated` | Jefe de Área, Docente | ídem con `getConsolidatedCommunicativeLetterSchema` |

Se registran **antes** de las rutas `/:valuationId` en `report.routes.ts`, por el mismo motivo que
ya obligó a poner `availability` primero (`report.routes.ts:43-44`): Express capturaría `bulk`/
`consolidated` como `valuationId` y `validate` lo rechazaría por el regex de ObjectId.

Controllers: extraen `req.body.valuationIds` o `req.body` (filtros), `institutionId`/`role`/
`schoolId` de `req.user!`, responden `res.status(200).json(result)`. Sin `try/catch`.

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

`shieldSrc` es **uno solo** para todo el lote (Individual o Consolidado): viene de
`useInstitutionShieldQuery` (RPT-06). Sin cambio visual en el informe individual.

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
fetchConsolidatedChecklistReports(filters: IConsolidatedReportFilters): Promise<IBulkChecklistReportResponse>;
fetchConsolidatedCommunicativeLetters(filters: IConsolidatedReportFilters): Promise<IBulkCommunicativeLetterResponse>;
```
Las 4 funciones de fetch usan `apiPost`. El store **no** importa `@react-pdf/renderer`: rompería
el aislamiento de bundle que consiguió RPT-06 (el store se carga con la app, la página de
informes no).

**`useBulkReportDownload.ts`** — vive en el chunk lazy de informes. Recibe el tipo de informe y,
según la pestaña, o bien una lista de ids (Individual) o un objeto de filtros (Consolidado); pide
el lote al store correspondiente, arma el `*BulkDocument`, genera el blob con
`pdf(<Doc/>).toBlob()` y lo entrega a `downloadBlob`. Devuelve `{ download(kind, source),
isDownloading }`.

**`utils/downloadBlob.ts`** — junto a `blobToDataUrl.ts`:
```ts
export function downloadBlob(blob: Blob, fileName: string): void
```
`createObjectURL` → `<a download>` → `click()` → `remove()` → `revokeObjectURL`. No existe
precedente en el proyecto: hoy la única descarga a disco la hace `PDFDownloadLink` por dentro.

Nombre de archivo:
- Individual: `carta-comunicativa-seleccion-<YYYYMMDD>.pdf` / `lista-chequeo-seleccion-<YYYYMMDD>.pdf`.
- Consolidado: `carta-comunicativa-consolidado-<sede>-<periodo>-<YYYYMMDD>.pdf` /
  `lista-chequeo-consolidado-<sede>-<periodo>-<YYYYMMDD>.pdf` (usa el nombre de sede/periodo
  resuelto en el propio panel, con slug simple `toLowerCase().replace(/\s+/g,'-')`).

**`pages/ReportsPage.tsx`** — pasa a ser el shell de pestañas:
```tsx
const TABS = [
  { value: "individual", label: "Individual", icon: UserIcon },
  { value: "consolidado", label: "Consolidado", icon: UserGroupIcon },
] as const;
```
`Tabs value={activeTab}` → `TabsHeader` (estilo `UsersPage`) → `TabsBody` con dos `TabPanel`:
`&lt;IndividualReportsPanel /&gt;` y `&lt;ConsolidatedReportsPanel /&gt;`. El `<h1>`/descripción actuales
quedan por encima de los tabs, fuera de ambos paneles.

**`IndividualReportsPanel.tsx`** — contenido íntegro que hoy vive en `ReportsPage.tsx`
(fetch de usuarios, filtros, `ReportsTable`, modales de vista individual), más:
- `ReportsTable.tsx` gana `Checkbox` por fila + casilla maestra en el encabezado.
- La fila apunta al `valuationId` del **periodo activo** (`user.valuations[].periodId`);
  `ReportsPage`/`IndividualReportsPanel` ya resuelve el periodo activo para
  `fetchLetterAvailability`.
- Casilla deshabilitada + `Tooltip` con el motivo cuando no hay valoración del periodo activo o
  `status !== 'Evaluado'`.
- La maestra marca **todos los seleccionables del filtro vigente**, no solo la página visible: la
  paginación es client-side (`ITEMS_PER_PAGE = 10`).
- `DataTable.tsx` no soporta selección de filas. Al implementar, elegir entre extenderlo con props
  opcionales o resolverlo en `ReportsTable`, según lo menos invasivo para sus otros consumidores.
- Barra de acción con el conteo de seleccionados y dos botones (`Button` de `components/ui`, con
  `isLoading` + `loadingText`) — visible para ambos roles.

**`ConsolidatedReportsPanel.tsx`** — nuevo:
- `Select` Sede: opciones de `useSchoolsQuery()` (`GET /schools`, ya sin restricción de rol). Para
  Docente: `disabled`, `value` fijo en `sessionData.user.schoolId`, mostrando el nombre resuelto
  de esa misma lista (no hace falta un endpoint aparte). Para Jefe de Área: libre, con una opción
  "Todas las sedes" (`value=""`) además de cada sede.
- `Select` Grado: opciones de `GRADE_LEVELS` (mismo patrón que el resto del feature, hoy solo
  `["Transición"]`).
- `Select` Jornada: solo se renderiza si `sessionData.multipleShifts`. Opciones: "Todas las
  jornadas" (`value=""`) + `sessionData.shifts`.
- `Select` Periodo: opciones de `sessionData.periods` (todos, no solo el activo) — patrón de
  `ChecklistCreateForm.tsx`.
- Botón "Descargar consolidado" (deshabilitado hasta tener Grado y Periodo elegidos — únicos
  campos obligatorios; Sede y Jornada pueden quedar en su default "todas").
- Cierre con `react-hot-toast`: éxito con conteo de estudiantes incluidos; advertencia si
  `skipped.length > 0`; error simple si la cohorte resulta vacía o excede el tope de 50.

## Notas
- **Fusión con el diseño original de RPT-07:** esta versión reemplaza la anterior (selección por
  checkbox únicamente, restringida a Jefe de Área, sin cohortes). No se creó una spec nueva
  (RPT-08) porque RPT-07 nunca se implementó — no hay código que reconciliar.
- **Por qué Consolidado no reutiliza la lista de usuarios ya cargada en Individual:** esa lista
  está scoped al periodo activo y, en la práctica, ya cargada en memoria del lado cliente para
  todos los estudiantes visibles al rol actual. Consolidado necesita periodos arbitrarios y,
  para Jefe de Área, sedes que el cliente no tiene por qué haber cargado — de ahí que la
  resolución de cohorte viva en el backend, no en un `useMemo` como hoy hace
  `ReportsPage`/`IndividualReportsPanel` para derivar `schools` de la lista de usuarios.
- **`forbidden-school` en `/consolidated`:** no debería producirse nunca (la cohorte ya nace
  scoped a la sede del Docente), pero `buildReportContexts` es compartida con el camino
  individual y de lote-por-ids, donde sí aplica — se deja el motivo en el enum sin lógica
  adicional en el camino de cohorte.
- **Tope de 50** es una cota de v1, ahora más alcanzable con Consolidado (una sede completa puede
  superarlo). Si aparece el caso en producción, se revisa con medición, no antes; mientras tanto
  el usuario debe acotar por jornada o sede.
- **Deuda que este spec no aborda:** los DTOs de informe siguen duplicados entre paquetes
  (unificarlos exige convertir el repo en workspace); `GET /api/users` sigue sin filtrar por
  periodo/grado/jornada en servidor (Consolidado no lo necesita: resuelve todo dentro de
  `report.service.ts`, sin pasar por `users.service.ts`).
- El feature `/gestion/consolidados` (`ConsolidatedPage.tsx`) es un stub sin relación con esta
  spec — no se toca ni se referencia.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- DevTools → Network al descargar un lote de 16 por Individual: **una sola** petición
  `POST .../bulk` y **cero** peticiones de imagen.
- DevTools → Network al descargar un Consolidado: **una sola** petición
  `POST .../consolidated` y **cero** peticiones de imagen.
