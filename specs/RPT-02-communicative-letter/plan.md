# RPT-02 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/student-valuation/student-valuation.types.ts` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` |
| tocar | `src/features/student-valuation/student-valuation.validation.ts` |
| tocar | `src/features/student-valuation/student-valuation.controller.ts` |
| tocar | `src/features/student-valuation/student-valuation.routes.ts` |
| tocar | `src/features/report/report.types.ts` |
| tocar | `src/features/report/report.service.ts` |
| tocar | `src/features/report/report.validation.ts` |
| tocar | `src/features/report/report.controller.ts` |
| tocar | `src/features/report/report.routes.ts` |

`app.ts` no se toca: `/api/student-valuations` y `/api/reports` ya están montados.
Ningún modelo cambia: `assignedConceptId` ya existe en `student-valuation.model.ts` con `ref: 'Concept'`.

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/report/components/CommunicativeLetterDocument.tsx` |
| crear | `src/features/report/components/CommunicativeLetterModal.tsx` |
| crear | `src/features/report/components/LetterConceptPicker.tsx` |
| tocar | `src/features/report/types/api.ts` |
| tocar | `src/features/report/types/store.ts` |
| tocar | `src/features/report/useReportStore.ts` |
| tocar | `src/features/report/usePdfShieldImage.ts` |
| tocar | `src/features/report/components/ReportsTable.tsx` |
| tocar | `src/features/report/pages/ReportsPage.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationTable.tsx` |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/data-model.md` · `docs/data-base.md` · `docs/domain.md` |

---

## Contratos

### Regla de dominio

*Named export* desde `student-valuation.service.ts`, donde ya viven el `pointsMapping` y el cálculo de `subjectPercentage`. `report.service.ts` la importa igual que ya importa `getStudentValuationById`.

```typescript
export function resolveQualitativeValuation(subjectPercentage: number): QualitativeValuation;
// >= 80 → ACHIEVED · >= 46 → IN_PROCESS · resto → WITH_DIFICULTY
```

Es la primera vez que los umbrales de `docs/domain.md` §Concepto por dimensión existen en código: hasta hoy sólo estaban documentados.

### Tipos / DTOs

`student-valuation.types.ts`:
```typescript
export type ConceptAssignmentUpdate = {
  subjectId: string;
  conceptId: string;
};

export type StudentValuationConceptsUpdateData = {
  assignments: ConceptAssignmentUpdate[];
};
```

`report.types.ts`:
```typescript
export interface ILetterConceptOption {
  _id: string;
  description: string;
}

export interface ILetterSubjectBlock {
  subjectId: string;
  subjectName: string;
  evaluationMode: SubjectEvaluationMode;
  valuationType: QualitativeValuation | null;   // null en modo description
  subjectPercentage: number;
  assignedConceptId: string | null;
  conceptText: string;                          // texto del concepto, o performanceDescription
  availableConcepts: ILetterConceptOption[];    // [] en modo description
}

export interface ICommunicativeLetterTemplate {
  _id: string;
  institution: IInstitution;
  period: IPeriod;
  teacher: ITeacher;
  student: IStudent;
  subjects: ILetterSubjectBlock[];
  observations: string | null;
  generatedAt: string;
}

export interface IMissingConceptCoverage {
  subjectId: string;
  subjectName: string;
  missingValuationTypes: QualitativeValuation[];
}

export interface ILetterAvailability {
  periodId: string;
  isAvailable: boolean;
  missing: IMissingConceptCoverage[];
}
```

`IInstitution`, `IPeriod`, `ITeacher` e `IStudent` se reutilizan sin cambios.

### Modelo Mongoose
Sin cambios. `assignedConceptId: { type: Schema.Types.ObjectId, ref: 'Concept' }` ya existe en `valuationBySubjectSchema`; este spec es el primero que lo escribe.

### Service — `student-valuation.service.ts`

**Asignación automática.** Dentro de `updateStudentValuation`, después del bucle que recalcula puntajes y `subjectPercentage`, y antes de `valuation.save()`:

1. Una sola lectura: `findScoped(ConceptModel, institutionId, { periodId: valuation.periodId })`, con `.select('subjectId valuationType').sort({ createdAt: 1 }).lean()`.
2. Indexar en memoria: `Map<'<subjectId>|<valuationType>', string[]>` de ids de concepto, en orden de antigüedad.
3. Por cada dimensión con `evaluationMode === CHECKLIST`:

| Estado de la dimensión | `assignedConceptId` resultante |
|---|---|
| Algún `qualitativeValuation === null` | sin definir |
| Completa · el valor actual está entre los candidatos del nivel derivado | se conserva |
| Completa · el valor actual no está entre los candidatos | primer candidato |
| Completa · no hay candidatos | sin definir |

Las dimensiones en modo `description` se saltan por completo.

Para limpiar el campo en un subdocumento Mongoose: `subject.set('assignedConceptId', undefined)`.

**Función nueva:**
```typescript
export async function updateValuationConcepts(
  valuationId: string,
  institutionId: string,
  data: StudentValuationConceptsUpdateData
): Promise<IStudentValuationDTO>;
```

| Condición | Respuesta |
|---|---|
| La valoración no existe en la institución | `404` |
| `globalStatus !== GlobalValuationStatus.COMPLETED` | `409` |
| `subjectId` ausente de `valuationsBySubject`, o en modo `description` | `422` |
| El `Concept` no existe en la institución | `422` |
| El `Concept` no coincide en `subjectId`, `periodId` o nivel derivado de esa dimensión | `422` |

Devuelve el DTO vía `populateAndMapValuation`, igual que `updateStudentValuation`.

### Service — `report.service.ts`

**Refactor previo.** Extraer de `getChecklistReport` el helper privado:

```typescript
async function buildReportContext(valuationId, institutionId, requestorRole, requestorSchoolId?)
  : Promise<{ valuation, institution, period, teacher, student }>;
```

Concentra el `409` por `globalStatus`, el `403` del Docente fuera de su sede, el `500` de integridad y el agregado paralelo de `Institution` / `Period` / `User` / `School`. `getChecklistReport` conserva su contrato y sigue resolviendo el `templateName` con el respaldo `'Plantilla eliminada'`, que es exclusivo suyo.

Renombrar `getChecklistReportShield` → `getReportShield`: la función ya es agnóstica del tipo de informe (valida por `valuationId`) y ahora tiene dos consumidores.

**Funciones nuevas:**
```typescript
export async function getCommunicativeLetterReport(
  valuationId: string, institutionId: string, requestorRole: UserRole, requestorSchoolId?: string
): Promise<ICommunicativeLetterTemplate>;

export async function getLetterAvailability(
  periodId: string, institutionId: string
): Promise<ILetterAvailability>;
```

`getCommunicativeLetterReport`:
1. `buildReportContext(...)`.
2. Lee los conceptos del período: `findScoped(ConceptModel, institutionId, { periodId })`, ordenados por `createdAt`.
3. Verifica cobertura sobre las dimensiones en modo `checklist` **de esa valoración** (no del catálogo): cada una necesita ≥1 concepto de cada uno de los tres niveles. Si falta alguno → `AppError(<detalle de dimensiones y niveles>, 422)`.
4. Compone un `ILetterSubjectBlock` por dimensión:

| Modo | `valuationType` | `conceptText` | `availableConcepts` |
|---|---|---|---|
| `description` | `null` | `performanceDescription ?? ''` | `[]` |
| `checklist` | `resolveQualitativeValuation(subjectPercentage)` | descripción del `assignedConceptId` si sigue siendo válido; si no, la del primer candidato | conceptos de ese `subjectId` + `valuationType` |

`getLetterAvailability` recorre las `Subject` de la institución con `evaluationMode === 'checklist'` y devuelve las combinaciones dimensión × nivel sin concepto (ver Nota 2).

### Zod

`student-valuation.validation.ts` — sigue el estilo del archivo (`z.object({ params, body })`, helper local `objectIdSchema`):
```typescript
export const updateValuationConceptsSchema = z.object({
  params: z.object({ valuationId: objectIdSchema }).strict(),
  body: z.object({
    assignments: z.array(z.object({
      subjectId: objectIdSchema,
      conceptId: objectIdSchema,
    }).strict()).min(1),
  }).strict(),
});
```

`report.validation.ts`:
```typescript
export const getCommunicativeLetterSchema = z.object({
  params: z.object({ valuationId: objectIdSchema }).strict(),
});

export const getCommunicativeLetterShieldSchema = z.object({
  params: z.object({ valuationId: objectIdSchema }).strict(),
});

export const getLetterAvailabilitySchema = z.object({
  query: z.object({ periodId: objectIdSchema }).strict(),
});
```

Ningún esquema acepta `institutionId`.

### Endpoints

| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| PATCH | `/api/student-valuations/:valuationId/concepts` | Jefe de Área · Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(updateValuationConceptsSchema) → asyncHandler` |
| GET | `/api/reports/communicative-letter/availability` | Jefe de Área · Docente | `… → validate(getLetterAvailabilitySchema) → asyncHandler` |
| GET | `/api/reports/communicative-letter/:valuationId` | Jefe de Área · Docente | `… → validate(getCommunicativeLetterSchema) → asyncHandler` |
| GET | `/api/reports/communicative-letter/:valuationId/shield` | Jefe de Área · Docente | `… → validate(getCommunicativeLetterShieldSchema) → asyncHandler` |

**Orden crítico en `report.routes.ts`:** `/communicative-letter/availability` se registra **antes** de `/communicative-letter/:valuationId`; en caso contrario Express captura `availability` como `valuationId` y `validate` lo rechaza con `400` por la regex de ObjectId.

`/checklist/:valuationId` y `/checklist/:valuationId/shield` no cambian.

### Frontend

**`useReportStore.ts`** — estado nuevo: `currentLetter`, `isLetterLoading`, `letterError`, `letterAvailability`.

| Acción | Llamada |
|---|---|
| `fetchLetterAvailability(periodId)` | `apiGet<ILetterAvailability>('/reports/communicative-letter/availability', { params: { periodId } })` |
| `fetchCommunicativeLetter(valuationId)` | `apiGet<ICommunicativeLetterTemplate>(\`/reports/communicative-letter/${valuationId}\`)` |
| `saveLetterConcepts(valuationId, assignments)` | `apiPatch(\`/student-valuations/${valuationId}/concepts\`, { assignments })` |
| `clearLetter()` | reset local |

`fetch*` traga el error en el estado; `saveLetterConcepts` hace `set({ error })` **y** re-lanza, para `toast.promise` (misma convención que `useSchoolStore` / `useSubjectStore`).

**`usePdfShieldImage.ts`** — firma pasa a `usePdfShieldImage(valuationId, hasShield, kind: ReportKind = 'checklist')`; la URL se compone a partir de `kind`. `ChecklistReportModal` no cambia su llamada.

**`LetterConceptPicker.tsx`** (presentacional, sin llamadas API). Por dimensión: nombre, chip del nivel obtenido y lista de `Radio` de `@material-tailwind/react` con las descripciones disponibles. Las dimensiones en modo `description` se renderizan como bloque de sólo lectura con la `performanceDescription` y la nota de que proviene de la Lista de Chequeo.

```typescript
interface LetterConceptPickerProps {
  subjects: ILetterSubjectBlock[];
  selection: Record<string, string>;          // subjectId → conceptId
  onSelect: (subjectId: string, conceptId: string) => void;
  disabled?: boolean;
}
```

Colores del chip: los tres ya definidos en `ChecklistReportDocument.tsx` (`#16a34a` · `#d97706` · `#dc2626`).

**`CommunicativeLetterDocument.tsx`** — `<Document>` / `<Page size="LETTER">`. Reutiliza el lenguaje visual de `ChecklistReportDocument.tsx`: encabezado con escudo y datos de institución sobre borde `#581c87`, fila de metadatos (estudiante · grado · sede · fecha de impresión), `brandFooter` fijo con `QUARTZ_LOGO_DATA_URI` y numeración de páginas. El cuerpo es narrativo: un bloque por dimensión con cabecera morada y el `conceptText` como párrafo; sin tabla, sin radios, sin leyenda de escala. Cierra con Observaciones (si existen) y el bloque de firma del docente.

**`CommunicativeLetterModal.tsx`** — `Dialog size="xl"`. `DialogBody` en dos columnas: izquierda `w-1/3` con scroll propio (`LetterConceptPicker`), derecha `flex-1` con `PDFViewer`. En el encabezado, `Carta Comunicativa · <estudiante>`. En el pie, `Guardar` (habilitado sólo si la selección difiere de la del servidor) y `PDFDownloadLink` → `carta-comunicativa-<estudiante>.pdf`. Cuando `letterError` corresponde al `422` de cobertura, el cuerpo se sustituye por un estado de bloqueo que lista las dimensiones y niveles faltantes con enlace a `/academico/conceptos`.

**`ReportsTable.tsx`** — el bloque del `EnvelopeIcon` deja de ser placeholder:

| Condición | Estado del icono | Tooltip |
|---|---|---|
| `status === 'Evaluado'` y hay cobertura | habilitado | `Ver Carta Comunicativa` |
| `status !== 'Evaluado'` | deshabilitado | `Disponible cuando la evaluación esté completa` |
| Sin cobertura de conceptos | deshabilitado | `Faltan conceptos por dimensión` |

**`StudentValuationTable.tsx`** — tercera acción con `EnvelopeIcon` entre "Ver Evaluación" y "Borrar", con la misma matriz, condicionada además a que `sessionData.enabledReports` incluya `communicative-letter` (esta tabla hoy no consulta esa bandera).

**Páginas** — `ReportsPage.tsx` y `StudentValuationsPage.tsx` disparan `fetchLetterAvailability(activePeriod._id)` junto a la carga de usuarios y montan `<CommunicativeLetterModal />` al lado del modal que ya tengan.

**Acabado:** aplicar las skills `impeccable`, `emil-design-eng` y el plugin `frontend-design` antes de escribir UI (obligatorio por `quartz-web/CLAUDE.md`).

---

## Notas

1. **`assignedConceptId` se escribe en cada `PATCH`, no en la transición a `Evaluado`.** Un disparador por cambio de estado obligaría a distinguir "acaba de completarse" de "ya estaba completo", y dejaría sin concepto a las valoraciones que hoy ya están en `Evaluado`. La regla adoptada es una invariante simple sobre el documento: dimensión completa ⇒ tiene concepto; dimensión incompleta ⇒ no lo tiene. Al llegar a `Evaluado` todas lo tienen por construcción, que es el efecto pedido.

2. **`getLetterAvailability` evalúa el catálogo de `Subject`, no el snapshot de cada valoración.** El pre-chequeo que pinta los iconos necesita una sola llamada por página; hacerlo por valoración serían diez. Se evalúa sobre las dimensiones de la institución en modo `checklist`, que es la lectura literal del requerimiento ("por cada dimensión que maneja `learnings[]`"). Puede producir un falso negativo si el catálogo tiene una dimensión que ninguna plantilla usa; el `422` de `getCommunicativeLetterReport`, que sí recorre el snapshot real, es el control exacto.

3. **La cobertura exige los tres niveles, no sólo el obtenido.** Bastaría con el nivel que la dimensión sacó, pero entonces bajar una valoración podría dejar la Carta ingenerable a mitad del trabajo del docente. Exigir los tres de entrada convierte la carga de conceptos en un requisito previo estable.

4. **`saveLetterConcepts` vive en `useReportStore` aunque escriba en `/student-valuations`.** El modal es un componente de `report/` y la escritura forma parte del flujo del informe; ubicarla en `useStudentValuationStore` obligaría a coordinar dos stores desde un único componente.

5. **Coste de re-render del `PDFViewer`.** Cada cambio de radio reconstruye el documento. Mitigación: `useDeferredValue` sobre el mapa de selección y `useMemo` sobre el elemento `<CommunicativeLetterDocument>` dependiendo del valor diferido.

6. **El escudo sigue siendo JPG.** `@react-pdf/renderer` no decodifica SVG; se reutiliza `shieldJpgUrl` a través del proxy autenticado de `usePdfShieldImage`, porque el bucket R2 no expone CORS.

7. **`docs/data-base.md` §1 y `docs/data-model.md` están desincronizados.** Ambos declaran `Concept` como "definido en diseño, sin modelo aún"; el modelo existe desde `specs/concepts.spec.md` (2026-07-13). Se corrigen aquí porque son exactamente la fuente que se consulta antes de tocar la asignación de conceptos. La nota de enum (`valuationType` reutiliza `QualitativeValuation`) se conserva: sigue siendo la decisión vigente.

8. **`docs/domain.md` §Informes** gana la precondición de cobertura: hoy sólo dice que "la previsualización de la Carta exige la Lista de Chequeo completa", que a partir de este spec es condición necesaria pero no suficiente.

---

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Cargar en `/academico/conceptos` los tres niveles para cada dimensión del período activo.
- Valorar un estudiante hasta `Evaluado` → el icono de sobre se habilita en `/evaluacion` y en `/informes`.
- Abrir la Carta: cada dimensión llega con concepto preseleccionado; cambiar el radio actualiza la vista previa; Guardar y reabrir → la selección persiste.
- Cambiar una valoración de forma que la dimensión cambie de nivel → el concepto se reasigna al nivel nuevo. Cambiarla sin cambiar de nivel → la elección manual sobrevive.
- Borrar todos los conceptos de `Con dificultad` de una dimensión → el icono se deshabilita con el tooltip de conceptos faltantes; invocar el endpoint directamente devuelve `422` con el detalle.
- Una dimensión en modo `description` imprime su `performanceDescription` en la Carta, sin nivel ni selector.
- Un Docente pidiendo la Carta de un estudiante de otra sede recibe `403`.
- `PATCH /:valuationId/concepts` con un `conceptId` de otra institución, de otro nivel o de otra dimensión → `422`.
