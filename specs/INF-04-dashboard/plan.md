# INF-04 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta | Qué |
|---|---|---|
| crear | `src/features/dashboard/dashboard.types.ts` | DTOs de respuesta + `DashboardFilters` |
| crear | `src/features/dashboard/dashboard.validation.ts` | `getDashboardSchema` (solo `query`) |
| crear | `src/features/dashboard/dashboard.service.ts` | Resolución de cohorte, pipelines, etiquetado, composición |
| crear | `src/features/dashboard/dashboard.controller.ts` | `getDashboardController` |
| crear | `src/features/dashboard/dashboard.routes.ts` | `GET /` con la cadena canónica |
| crear | `src/services/memory-cache.service.ts` | `getOrSet` + `invalidatePrefix` (transversal, no atado a feature) |
| tocar | `src/app.ts` | `app.use('/api/dashboard', dashboardRoutes)` |
| tocar | `src/features/student-valuation/student-valuation.types.ts` | Exportar `CONCEPT_THRESHOLDS` y `VALUATION_POINTS` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` | Consumir las constantes; invalidar caché en las 4 escrituras |
| tocar | `src/features/student-valuation/student-valuation.model.ts` | Índice `{ institutionId, periodId, studentId }` |
| tocar | `src/features/learning/learning.model.ts` | Índice `{ institutionId, periodId, subjectId }` (hoy el modelo no declara ninguno) |
| tocar | `src/features/learning/learning.service.ts` | Invalidar caché en create/update/delete |
| tocar | `src/features/concept/concept.model.ts` | Índice `{ institutionId, periodId, subjectId, valuationType }` |
| tocar | `src/features/concept/concept.service.ts` | Invalidar caché en create/update/delete |
| tocar | `src/features/auth/auth.model.ts` | Índice `{ institutionId, role, schoolId }` para la consulta de cohorte |

### quartz-web
| Acción | Ruta | Qué |
|---|---|---|
| tocar | `package.json` | `recharts` |
| tocar | `src/types/domain.ts` | `QualitativeValuation`, `QUALITATIVE_VALUATION_VALUES`, `QUALITATIVE_VALUATION_COLORS`, `CHART_PALETTE` |
| crear | `src/components/ui/Skeleton.tsx` | Primitiva de carga (no existe) |
| crear | `src/components/common/EmptyState.tsx` | Estado vacío reutilizable (hoy son ad-hoc) |
| crear | `src/features/dashboard/types/api.ts` | Espejo exacto de `DashboardResponse` |
| crear | `src/features/dashboard/types/domain.ts` | Labels, orden de series, helpers de formato |
| crear | `src/features/dashboard/types/index.ts` | Agregador |
| crear | `src/features/dashboard/queries/useDashboardQuery.ts` | React Query |
| crear | `src/features/dashboard/components/ChartCard.tsx` | Shell: título, subtítulo, skeleton, vacío, acción |
| crear | `src/features/dashboard/components/StatTile.tsx` | KPI (capa 1) |
| crear | `src/features/dashboard/components/DashboardFilters.tsx` | Periodo / sede / jornada / grado desde `sessionData` |
| crear | `src/features/dashboard/components/DashboardHeader.tsx` | Filtros + «actualizado hace X» + botón refrescar |
| crear | `src/features/dashboard/components/DashboardSkeleton.tsx` | Esqueleto con la geometría final |
| crear | `src/features/dashboard/components/charts/SubjectPerformanceChart.tsx` | Widget 5 |
| crear | `src/features/dashboard/components/charts/ValuationStatusDonut.tsx` | Widget 6 |
| crear | `src/features/dashboard/components/charts/SubjectConceptChart.tsx` | Widget 7 |
| crear | `src/features/dashboard/components/charts/TeacherProgressChart.tsx` | Widget 8 |
| crear | `src/features/dashboard/components/charts/SchoolProgressChart.tsx` | Widget 9 |
| crear | `src/features/dashboard/components/charts/PeriodTrendChart.tsx` | Widget 11 |
| crear | `src/features/dashboard/components/CurriculumHealthPanel.tsx` | Widget 10 |
| crear | `src/features/dashboard/components/AtRiskStudentsList.tsx` | Widget 12 |
| crear | `src/features/dashboard/pages/DashboardPage.tsx` | Composición + reparto por rol |
| tocar | `src/App.tsx` | Borrar el placeholder `:31-44`; `React.lazy` + `Suspense` |
| tocar | `src/features/concept/components/ConceptsTable.tsx` | Importar colores del origen único (`:13-17`) |
| tocar | `src/features/report/components/LetterConceptPicker.tsx` | Idem (`:8-12`) |
| tocar | `src/features/report/components/ChecklistReportPages.tsx` | Idem (`:7-13`) |
| tocar | `src/features/report/components/CommunicativeLetterPages.tsx` | Idem (`:6-10`) |

---

## Contratos

### Tipos / DTOs — `dashboard.types.ts`

```ts
export interface DashboardFilters {
  institutionId: string;
  periodId?: string;
  schoolId?: string;
  shiftId?: string;
  grade?: GradeLevel;
  requestorRole: UserRole;
  requestorSchoolId?: string;
}

export interface IPeriodContext {
  _id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  closingAlertDate: string | null;
  isActive: boolean;
  daysToClose: number;          // negativo si endDate ya pasó
}

export interface ICohortSummary {
  totalStudents: number;
  evaluated: number;            // globalStatus 'Evaluado'
  inProgress: number;           // 'Evaluando'
  created: number;              // 'Por diligenciar' | null
  notStarted: number;           // derivado: sin documento StudentValuation
  coveragePercentage: number;   // evaluated / totalStudents * 100, 0 si cohorte vacía
}

export interface IItemProgress {
  valuedItems: number;
  totalItems: number;
  percentage: number;
}

export interface ISubjectPerformanceRow {
  subjectId: string;
  subjectName: string;
  achieved: number;
  inProcess: number;
  withDificulty: number;
  pending: number;              // qualitativeValuation === null
  total: number;
}

export interface ISubjectConceptRow {
  subjectId: string;
  subjectName: string;
  achieved: number;
  inProcess: number;
  withDificulty: number;
  scoredStudents: number;       // solo maxSubjectScore > 0
}

export interface ITeacherProgressRow {
  teacherId: string;
  teacherName: string;
  total: number;
  evaluated: number;
  pending: number;
  percentage: number;
}

export interface ISchoolProgressRow {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  evaluated: number;
  percentage: number;
}

export interface ICurriculumHealth {
  subjectsWithoutLearnings: { subjectId: string; subjectName: string }[];
  learningsBySubject: { subjectId: string; subjectName: string; count: number }[];
  missingConcepts: { subjectId: string; subjectName: string; missing: QualitativeValuation[] }[];
  totalLearnings: number;
  totalConcepts: number;
  totalChecklistTemplates: number;
}

export interface IPeriodTrendPoint {
  periodId: string;
  periodName: string;
  year: number;
  averagePercentage: number;
  scoredStudents: number;
}

export interface IAtRiskStudentRow {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  subjectsWithDificulty: number;
  subjectNames: string[];
}

export interface IDashboardResponse {
  period: IPeriodContext | null;
  scope: {
    role: UserRole;
    schoolId: string | null;
    schoolName: string | null;
    grade: GradeLevel | null;
    shiftId: string | null;
    isInstitutionWide: boolean;
  };
  cohort: ICohortSummary;
  itemProgress: IItemProgress;
  performanceBySubject: ISubjectPerformanceRow[];
  conceptBySubject: ISubjectConceptRow[];
  teacherProgress: ITeacherProgressRow[] | null;    // null para Docente
  schoolProgress: ISchoolProgressRow[] | null;      // null para Docente o sede única
  curriculumHealth: ICurriculumHealth | null;       // null para Docente
  periodTrend: IPeriodTrendPoint[];                 // [] si < 2 periodos con datos
  atRiskStudents: IAtRiskStudentRow[];
  generatedAt: string;                              // ISO
}
```

### Constantes compartidas — `student-valuation.types.ts`
Se extraen del service para que **el mismo número** gobierne TypeScript y el pipeline de Mongo:

```ts
export const VALUATION_POINTS: Record<QualitativeValuation, number> = {
  [QualitativeValuation.ACHIEVED]: 3,
  [QualitativeValuation.IN_PROCESS]: 2,
  [QualitativeValuation.WITH_DIFICULTY]: 1,
};

/** Umbrales de `resolveQualitativeValuation` (docs/domain.md § Concepto por dimensión). */
export const CONCEPT_THRESHOLDS = { ACHIEVED: 80, IN_PROCESS: 46 } as const;
```
`resolveQualitativeValuation` (`student-valuation.service.ts:39-43`) y `pointsMapping` (`:450-454`) pasan a consumirlas. Sin cambio de comportamiento.

### Modelo Mongoose
Ningún modelo nuevo. **Solo índices**, todos con `institutionId` en primera posición:

| Modelo | Índice nuevo | Para |
|---|---|---|
| `StudentValuation` | `{ institutionId: 1, periodId: 1, studentId: 1 }` | `$match` del `$facet` y de la tendencia |
| `Learning` | `{ institutionId: 1, periodId: 1, subjectId: 1 }` | Salud curricular (el modelo hoy no declara ninguno) |
| `Concept` | `{ institutionId: 1, periodId: 1, subjectId: 1, valuationType: 1 }` | Huecos de concepto |
| `User` | `{ institutionId: 1, role: 1, schoolId: 1 }` | Resolución de cohorte |

El único compuesto actual de `studentValuations` es `{ studentId, periodId }` único, que **no cubre** el filtro por inquilino + periodo. Se conserva tal cual: sigue garantizando una valoración por estudiante y periodo.

### Zod — `dashboard.validation.ts`
`.strict()` va sobre el objeto `query` interno, **nunca** sobre el envoltorio (ver `quartz-api/docs/known-issues.md`).

```ts
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identificador inválido.');

export const getDashboardSchema = z.object({
  query: z.object({
    periodId: objectId.optional(),
    schoolId: objectId.optional(),
    shiftId: objectId.optional(),
    grade: z.nativeEnum(GradeLevel).optional(),
  }).strict(),
});

export type GetDashboardQuery = z.infer<typeof getDashboardSchema>['query'];
```

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/dashboard` | Jefe de Área · Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(getDashboardSchema) → asyncHandler(getDashboardController)` |

Respuesta `200`: `IDashboardResponse`. `400` query con clave desconocida · `401` token inválido · `403` rol Estudiante.

```ts
// dashboard.controller.ts — sin try/catch, sin guardas
export async function getDashboardController(req: Request, res: Response) {
  const query = req.query as GetDashboardQuery;
  res.json(
    await getDashboard({
      institutionId: req.user!.institutionId.toString(),
      periodId: query.periodId,
      schoolId: query.schoolId,
      shiftId: query.shiftId,
      grade: query.grade,
      requestorRole: req.user!.role as UserRole,
      requestorSchoolId: req.user!.schoolId?.toString(),
    })
  );
}
```

### Caché — `src/services/memory-cache.service.ts`

```ts
interface CacheEntry { promise: Promise<unknown>; expiresAt: number; }

const store = new Map<string, CacheEntry>();
const MAX_ENTRIES = 500;

export function getOrSet<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T>;
export function invalidatePrefix(prefix: string): void;
export function clearCache(): void;
```

- **Se almacena la promesa, no el valor.** Dos peticiones equivalentes en paralelo comparten una sola ejecución del productor (criterio EARS de deduplicación).
- Si la promesa **rechaza**, la entrada se borra en el `catch`: un fallo no se cachea.
- Purga de expirados en cada escritura; si se supera `MAX_ENTRIES`, se descarta la entrada más antigua.
- Clave del dashboard:
  `dashboard:{institutionId}:{periodId|none}:{schoolId|all}:{shiftId|all}:{grade|all}:{role}`
  `institutionId` va primero para que `invalidatePrefix('dashboard:' + institutionId)` barra todas las combinaciones de un inquilino de un golpe. `role` va en la clave porque el payload difiere.
- TTL: `DASHBOARD_CACHE_TTL_MS = 60_000` en `dashboard.service.ts`.
- Invalidación: `invalidatePrefix(\`dashboard:${institutionId}\`)` al final de
  `initializeStudentValuation`, `updateStudentValuation`, `updateValuationConcepts`,
  `deleteStudentValuation`, `createLearning`, `updateLearning`, `deleteLearning`,
  `createConcept`, `updateConcept`, `deleteConcept`.

### Servicio — estrategia de consulta

**Se descarta `$lookup`** de `studentValuations` → `users`. Se usa el patrón ya establecido en el repo (`resolveConsolidatedValuationIds`, `report.service.ts:545-576`): resolver la cohorte primero y filtrar por `studentId: { $in }`.

**Paso 0 — periodo y alcance.**
- `periodId` de la query, o el `Period` con `isActive: true` del inquilino. Si no hay ninguno → respuesta vacía (`period: null`, contadores en cero), no `404`.
- **Si `requestorRole === DOCENTE`, `schoolId` se sobreescribe con `requestorSchoolId`**, ignorando el valor de la query.

**Paso 1 — cohorte.**
```ts
const cohort = await findScoped(User, institutionId, {
  role: UserRole.ESTUDIANTE,
  ...(schoolId && { schoolId }),
  ...(shiftId && { shiftId }),
  ...(grade && { gradesTaught: grade }),
}).select('_id firstName lastName secondLastName schoolId avatarUrl').lean();
```
`cohort.length` es el denominador de la cobertura y hace que **`notStarted` salga gratis**:
`notStarted = cohort.length − (evaluated + inProgress + created)`.

**Paso 2 — un solo `$facet` sobre `studentValuations`.**
```js
StudentValuation.aggregate([
  { $match: {
      institutionId: new Types.ObjectId(institutionId),
      periodId:      new Types.ObjectId(periodId),
      studentId:     { $in: cohortIds },
  } },
  { $facet: {

    // Widgets 1, 2, 6, 8, 9 — N docs mínimos, se cruzan en memoria con el Map de cohorte
    index: [
      { $project: { _id: 0, studentId: 1, teacherId: 1, globalStatus: 1 } },
    ],

    // Widget 3 — progreso ítem a ítem
    itemProgress: [
      { $unwind: '$valuationsBySubject' },
      { $project: {
          items: { $cond: [
            { $eq: ['$valuationsBySubject.evaluationMode', 'description'] },
            [{ valued: { $ne: ['$valuationsBySubject.performanceDescription', null] } }],
            { $map: { input: '$valuationsBySubject.learningValuations', as: 'lv',
                      in: { valued: { $ne: ['$$lv.qualitativeValuation', null] } } } },
          ] },
      } },
      { $unwind: '$items' },
      { $group: { _id: null,
          total: { $sum: 1 },
          valued: { $sum: { $cond: ['$items.valued', 1, 0] } } } },
    ],

    // Widget 5 — desempeño por dimensión, ítem a ítem
    subjectPerformance: [
      { $unwind: '$valuationsBySubject' },
      { $unwind: '$valuationsBySubject.learningValuations' },
      { $group: { _id: {
            subjectId: '$valuationsBySubject.subjectId',
            level:     '$valuationsBySubject.learningValuations.qualitativeValuation' },
          count: { $sum: 1 } } },
    ],

    // Widget 7 — concepto resultante por dimensión
    subjectConcept: [
      { $unwind: '$valuationsBySubject' },
      { $match: { 'valuationsBySubject.maxSubjectScore': { $gt: 0 } } },
      { $group: { _id: {
            subjectId: '$valuationsBySubject.subjectId',
            level: { $switch: { branches: [
              { case: { $gte: ['$valuationsBySubject.subjectPercentage', CONCEPT_THRESHOLDS.ACHIEVED] },
                then: QualitativeValuation.ACHIEVED },
              { case: { $gte: ['$valuationsBySubject.subjectPercentage', CONCEPT_THRESHOLDS.IN_PROCESS] },
                then: QualitativeValuation.IN_PROCESS },
            ], default: QualitativeValuation.WITH_DIFICULTY } } },
          count: { $sum: 1 } } },
    ],

    // Widget 12 — estudiantes con 2+ dimensiones en dificultad
    atRisk: [
      { $unwind: '$valuationsBySubject' },
      { $match: {
          'valuationsBySubject.maxSubjectScore': { $gt: 0 },
          'valuationsBySubject.subjectPercentage': { $lt: CONCEPT_THRESHOLDS.IN_PROCESS } } },
      { $group: { _id: '$studentId',
          count: { $sum: 1 },
          subjectIds: { $push: '$valuationsBySubject.subjectId' } } },
      { $match: { count: { $gte: 2 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ],
  } },
]);
```

**Paso 3 — consultas auxiliares**, en un `Promise.all`:

| Consulta | Widget | Condición |
|---|---|---|
| `findScoped(Subject, institutionId).select('name evaluationMode').lean()` | 5, 7, 10 | siempre (catálogo de ~7 docs) |
| `Learning.aggregate` — `$match { institutionId, periodId }` + `$group` por `subjectId` | 10 | solo Jefe de Área |
| `Concept.aggregate` — `$match { institutionId, periodId }` + `$group` por `(subjectId, valuationType)` | 10 | solo Jefe de Área |
| `StudentValuation.aggregate` de tendencia (ver abajo) | 11 | solo si hay ≥2 periodos del inquilino |
| `findScoped(User, institutionId, { _id: { $in: teacherIds } }).select('firstName lastName').lean()` | 8 | solo Jefe de Área |
| `getSchoolsByInstitution(institutionId)` | 9 | solo Jefe de Área con >1 sede |

Los nombres de los estudiantes en riesgo salen del `Map` de cohorte del paso 1: **cero consultas extra**.

**Tendencia (widget 11):**
```js
StudentValuation.aggregate([
  { $match: { institutionId, studentId: { $in: cohortIds }, periodId: { $in: previousPeriodIds } } },
  { $unwind: '$valuationsBySubject' },
  { $match: { 'valuationsBySubject.maxSubjectScore': { $gt: 0 } } },
  { $group: { _id: '$periodId',
      averagePercentage: { $avg: '$valuationsBySubject.subjectPercentage' },
      students: { $addToSet: '$studentId' } } },
]);
```

**Coste total: ≤10 consultas, todas constantes respecto al tamaño de la cohorte**, repartidas en 2 tandas de `Promise.all`. Etiquetado siempre con `$in` + `Map`, **nunca** `populate()` — misma regla que `buildReportContexts` (`report.service.ts:54-61`).

### Frontend

**Tokens de color — `src/types/domain.ts`** (origen único; hoy están duplicados en 4 archivos):
```ts
export const QUALITATIVE_VALUATION_VALUES = ['Logrado', 'En proceso', 'Con dificultad'] as const;
export type QualitativeValuation = (typeof QUALITATIVE_VALUATION_VALUES)[number];

/** Hex, no clases Tailwind: Recharts y react-pdf necesitan el valor literal. */
export const QUALITATIVE_VALUATION_COLORS: Record<QualitativeValuation, string> = {
  'Logrado': '#16a34a',
  'En proceso': '#d97706',
  'Con dificultad': '#dc2626',
};

export const CHART_PALETTE = {
  brand: '#620DD1',
  brandSoft: '#a57cff',
  brandFaint: '#dbd1ff',
  accent: '#E1035A',
  grid: '#eceff1',
  axis: '#78909c',
} as const;
```
Los hex de desempeño son **los mismos** que ya usan `ChecklistReportPages.tsx:7-13` y `CommunicativeLetterPages.tsx:6-10`: no se inventa paleta, se centraliza la existente. Los 4 archivos duplicados pasan a importar de aquí.

Los colores de estado salen de `ValuationStatusBadge.tsx:12-43` y el orden de `VALUATION_STATE_ORDER` (`student-valuation/types/domain.ts`): se reutiliza `ValuationState`, no se define un enum nuevo.

**Query — `features/dashboard/queries/useDashboardQuery.ts`** (patrón de `features/users/queries/useUsersQuery.ts`):
```ts
export const dashboardQueryKey = (params?: GetDashboardQuery) => ['dashboard', params] as const;

export function useDashboardQuery(params?: GetDashboardQuery) {
  return useQuery({
    queryKey: dashboardQueryKey(params),
    queryFn: () => apiGet<DashboardResponse>('/dashboard', { params }),
    staleTime: 60_000,            // alineado con el TTL del servidor
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,   // el default global es false (src/lib/queryClient.ts)
    placeholderData: keepPreviousData,
  });
}
```
`dataUpdatedAt` alimenta el «actualizado hace X». `isFetching` con `data` presente → indicador sutil en el header; **nunca** el esqueleto completo.

**Página — `DashboardPage.tsx`:**
- Filtros en estado local, con valores iniciales de `useActivePeriod()` y `usePermissions()`.
- Para Docente, el selector de sede no se renderiza (el backend fuerza la suya de todos modos).
- `isAreaLead` decide si se montan los widgets 8, 9 y 10.
- La capa 1 se pinta con HTML plano: la primera señal aparece **sin esperar al chunk de Recharts**.
- Cada transformación DTO → serie va en `useMemo`.

**Ruta — `App.tsx`:** se borra el placeholder `:31-44` y se sustituye por
```tsx
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
...
<Route path="/dashboard" element={<Suspense fallback={routeFallback}><DashboardPage /></Suspense>} />
```
Mismo patrón que `ReportsPage` y `CommunicativeLetterEditPage`, que ya salen del bundle inicial por `@react-pdf/renderer`.

---

## Notas

1. **Por qué un endpoint y no seis.** `authenticateJWT` hace un `User.findById` **en cada request** (`auth.middleware.ts`). Seis endpoints serían seis rehidrataciones de usuario para pintar una sola pantalla. El payload agregado son números: del orden de KB.

2. **Por qué `$in` y no `$lookup`.** `StudentValuation` **no guarda `schoolId` ni `grade`**; ambos solo existen en `User`. Un `$lookup` haría el join dentro de Mongo pero impediría reutilizar el índice de cohorte y rompería con el patrón ya validado del repo. Además, resolver la cohorte primero es lo único que permite calcular **«Sin iniciar»**, que es una ausencia de documento y por definición no aparece en ninguna agregación sobre `studentValuations`.

3. **«Sin iniciar» no es un estado del enum.** `GlobalValuationStatus` tiene tres valores. El cuarto estado ya existe en el frontend (`ValuationState.NOT_STARTED`, `VALUATION_STATE_LABELS`) y aquí se calcula por diferencia. No se añade al enum del backend: sería un estado que ningún documento puede tener.

4. **`globalStatus: null` cuenta como «Por diligenciar».** El modelo declara `default: null` y `resolveGlobalStatus` solo escribe tras la primera edición. Un documento recién creado que aún no pasó por el cálculo es, de hecho, «Por diligenciar».

5. **Los umbrales se duplican en el pipeline, pero no el número.** Mongo no puede ejecutar `resolveQualitativeValuation`, así que el `$switch` replica la estructura del `if`. Para que no se desincronicen, ambos leen `CONCEPT_THRESHOLDS` de `student-valuation.types.ts`. La lógica se escribe dos veces; el valor, una.

6. **La caché es por proceso.** `Map` en memoria: con varias instancias de la API cada una tiene la suya, y un `invalidatePrefix` solo barre la propia. Con la ventana de 60 s el peor caso es que un usuario vea datos hasta 60 s viejos tras una escritura atendida por otra instancia. Aceptable para el modelo de despliegue actual (un solo proceso `ts-node`). Migrar a Redis cambiaría solo `memory-cache.service.ts`: la firma `getOrSet`/`invalidatePrefix` no cambia.

7. **Discrepancia de `docs/domain.md`, no resuelta aquí.** `domain.md` dice que el Docente puede *«filtrar otras sedes sin editar»*, pero `VAL-04` y `INF-03` cerraron el alcance a su propia sede con `404`, y `resolveConsolidatedValuationIds` ya ignora el `schoolId` del body para el Docente. El dashboard sigue **lo implementado**, que es lo coherente con el resto del sistema. Alinear `domain.md` es un cambio de documentación de dominio y va en su propio spec.

8. **Sin acoplamiento Zustand → `queryClient`.** Las valoraciones viven en un store Zustand y el dashboard en React Query. Invalidar `['dashboard']` desde el store metería el cliente de queries dentro de un store, cruzando los dos patrones. No hace falta: el flujo real es salir a `/evaluacion`, valorar y volver — y el refetch al montar y al enfocar la pestaña ya lo cubre.

9. **Recharts fuera del bundle inicial.** La librería solo se descarga al entrar a `/dashboard`. Como `/dashboard` es el destino de `/`, eso significa que el chunk se pide en el primer render; por eso la capa 1 se pinta con HTML plano y no espera a Recharts. El resto de la app (evaluación, informes, gestión) nunca lo descarga.

10. **`byStudentSchool` se resuelve en memoria.** El sub-pipeline `index` devuelve un documento mínimo por valoración y el cruce con la sede sale del `Map` de cohorte. Es O(N) en memoria con N = tamaño de la cohorte (cientos en Transición); a cambio ahorra un `$lookup` y dos sub-pipelines.

11. **Índices nuevos, coste de escritura.** Cuatro índices compuestos encarecen marginalmente los `create`/`update`. Sin ellos, el `$match` del `$facet` haría collection scan sobre `studentValuations`, que es la colección que más crece.

12. **Skills de diseño obligatorias.** `quartz-web/CLAUDE.md` exige cargar `emil-design-eng`, `impeccable` y `frontend-design` antes de escribir UI. Para los gráficos se añade `dataviz`. Está recogido en `tasks.md`.

---

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes (web `5173`, API `4000`): cero errores en consola.
- Manual — `GET /api/dashboard` como Jefe de Área: devuelve las 5 capas, con `teacherProgress`, `schoolProgress` y `curriculumHealth` poblados.
- Manual — como Docente: esos tres campos en `null` y la cohorte recortada a su sede.
- Manual — **aislamiento**: Docente de la Sede A con `?schoolId=<Sede B>` recibe los datos de la Sede A.
- Manual — **aislamiento**: dos inquilinos distintos nunca comparten entrada de caché (claves con `institutionId` al frente).
- Manual — `?foo=bar` en la query responde `400`.
- Manual — sin periodo activo: `200` con `period: null` y estado vacío en la UI, sin errores en consola.
- Manual — caché: dos peticiones idénticas seguidas; la segunda no genera consultas en el log de Mongo. Tras editar una valoración, la siguiente sí las genera.
- Manual — red: cambiar un filtro conserva los datos previos en pantalla; volver a la pestaña refresca; el botón manual actualiza el «hace X».
- Manual — bundle: `npm run build` y comprobar que `recharts` queda en el chunk de `DashboardPage`, no en el de entrada.
- Manual (usuario) — revisión visual y de interacción. **No se usa Claude in Chrome** (prohibido por `quartz-web/CLAUDE.md`).
