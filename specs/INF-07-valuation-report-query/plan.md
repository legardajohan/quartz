# INF-07 — Plan técnico

## Archivos
### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/student-valuation/queries/useStudentValuationQuery.ts` |
| crear | `src/features/report/queries/useReportQuery.ts` |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationDetail.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationTable.tsx` (props en vez de store) |
| tocar | `src/features/report/pages/ReportsPage.tsx` |
| tocar | `src/features/report/pages/CommunicativeLetterEditPage.tsx` |
| tocar | `src/features/report/components/{IndividualReportsPanel,ChecklistReportModal,CommunicativeLetterModal,ReportsTable}.tsx` |
| tocar | `src/features/report/useBulkReportDownload.tsx` |
| tocar | `src/features/{student-valuation,report}/types/index.ts` |
| borrar | `src/features/student-valuation/useStudentValuationStore.ts`, `.../types/store.ts` |
| borrar | `src/features/report/useReportStore.ts`, `.../types/store.ts` |

## Contratos

### Tipos
- `UserDto`/`GetUsersQuery` de `student-valuation` y `report` → se importan de `@/features/users/types`.
- Verificar compatibilidad: `users.UserDto.school` es `UserSchool`; `student-valuation` usa `SchoolDto` (`_id`, `schoolNumber`, `name`) y `ValuationSummary`. Si `UserSchool`/`UserValuationSummary` no cubren esos campos, se amplían en `users/types/api.ts` (la respuesta de `/users` ya los trae).
- `ITEMS_PER_PAGE` → `@/components/common/DataTable` (se borra la copia de ambos stores).

### Keys
| Factory | Keys | `staleTime` |
|---|---|---|
| `usersQueryKey` (existente) | `['users', { role: 'Estudiante' }]` | `list` |
| `valuationKeys` | `all: ['student-valuation']` · `detail(studentId, periodId)` | `live` |
| `reportKeys` | `all: ['report']` · `checklist(valuationId)` · `letter(valuationId)` · `letterAvailability(periodId)` | `live` (availability: `list`) |

### Hooks — `student-valuation/queries/useStudentValuationQuery.ts`
| Export | Endpoint | Opciones / onSuccess |
|---|---|---|
| `useStudentValuationQuery(studentId?, periodId?)` | `POST /student-valuations/student/:studentId/period/:periodId` `{}` → `IStudentValuationDTO` | `enabled: !!studentId && !!periodId` · `staleTime: STALE_TIME.live` |
| `useUpdateValuationMutation()` | `PATCH /student-valuations/:valuationId` (`{ valuationId, payload }`) | `setQueryData(detail(studentId, periodId), data)` + invalida `['users']`, `['dashboard']`, `['report']` |
| `useDeleteValuationMutation()` | `DELETE /student-valuations/:valuationId` | `removeQueries(valuationKeys.all)` + invalida `['users']`, `['dashboard']`, `['report']` |

### Hooks — `report/queries/useReportQuery.ts`
| Export | Endpoint | Opciones / onSuccess |
|---|---|---|
| `useChecklistReportQuery(valuationId, { enabled })` | `GET /reports/checklist/:valuationId` (`timeout: REPORT_REQUEST_TIMEOUT_MS`) → `IReportTemplate` | `live` |
| `useCommunicativeLetterQuery(valuationId, { enabled }?)` | `GET /reports/communicative-letter/:valuationId` (timeout) → `ICommunicativeLetterTemplate` | `live` · `retry: false` (error de cobertura "faltan conceptos" es 4xx definitivo) |
| `useLetterAvailabilityQuery(periodId?)` | `GET /reports/communicative-letter/availability?periodId=` → `ILetterAvailability` | `enabled: !!periodId` · error → `data` `undefined` (silencioso, como hoy) |
| `useSaveLetterConceptsMutation()` | `PATCH /student-valuations/:valuationId/concepts` `{ assignments }` | invalida `reportKeys.letter(valuationId)`, `reportKeys.letterAvailability` (prefijo), `['dashboard']` |
| `useConsolidatedChecklistMutation()` | `POST /reports/checklist/consolidated` (timeout) → `IBulkChecklistReportResponse` | sin caché |
| `useConsolidatedLetterMutation()` | `POST /reports/communicative-letter/consolidated` (timeout) → `IBulkCommunicativeLetterResponse` | sin caché |

- Ejemplo:
```ts
export const valuationKeys = {
  all: ['student-valuation'] as const,
  detail: (studentId: string, periodId: string) => [...valuationKeys.all, studentId, periodId] as const,
};

export function useStudentValuationQuery(studentId?: string, periodId?: string) {
  return useQuery({
    queryKey: valuationKeys.detail(studentId ?? '', periodId ?? ''),
    queryFn: () => apiPost<IStudentValuationDTO>(`/student-valuations/student/${studentId}/period/${periodId}`, {}),
    enabled: !!studentId && !!periodId,
    staleTime: STALE_TIME.live,
  });
}
```

### Protección de borradores
- `StudentValuationDetail`: `localValuation` se sincroniza desde `data` **solo** si `!isDirty` (comparar `localValuation` vs `data`, o flag `isDirty` que se pone en `true` al editar y en `false` al guardar/descartar). Mismo criterio para abrir la primera dimensión.
- `CommunicativeLetterEditPage`: `setSelection/setConceptText(buildServer…(letter))` solo si `!isDirty` (el `isDirty` memoizado ya existe).
- Se borran los `clearValuation()` / `clearLetter()` / `clearReport()` de cleanup: la caché por key reemplaza el reset manual.
- *(Añadido en implementación)* El borrador se compara contra la **versión base** del servidor sobre la que se editó (estado local), no contra la caché: así una revalidación con datos nuevos no se confunde con "cambios sin guardar". La sincronización se hace en render (patrón "ajustar estado al cambiar una prop"), sin `useEffect`.
- *(Añadido en implementación)* `StudentValuationDetail` se monta con `key={studentId}` y la carta re-sincroniza si cambia `_id`: un cambio de estudiante/valoración en la misma ruta no arrastra el borrador anterior.

### Consumidores
- `StudentValuationsPage`: `const { data: users = [], isPending, error } = useUsersQuery({ role: 'Estudiante' })`; `useLetterAvailabilityQuery(activePeriod?._id)`; `useDeleteValuationMutation` → prop `onDeleteValuation` de `StudentValuationTable`. Se borra el `useEffect` de `fetchUsers`.
- `ReportsPage` e `IndividualReportsPanel`: ambos llaman `useUsersQuery({ role: 'Estudiante' })` (dedupe por key).
- `ChecklistReportModal`: `useChecklistReportQuery(valuationId, { enabled: open && !!valuationId })`.
- `CommunicativeLetterModal`: ídem con `useCommunicativeLetterQuery`.
- `useBulkReportDownload`: `mutateAsync` de las 2 mutaciones de consolidado.

## Notas
- La lista de estudiantes pasa a ser `['users', { role: 'Estudiante' }]`: la misma caché que `UsersPage` pestaña "Estudiantes" → navegar Usuarios ↔ Evaluación ↔ Informes = 1 request por ventana de 5 min.
- `POST` como `queryFn` es aceptable: es get-or-create idempotente; `refetchOnWindowFocus` sigue desactivado global.
- `retry` sin 4xx (INF-05) evita reintentar 403/404 de valoraciones fuera del alcance del Docente (VAL-04).
- Invalidar `['report']` por prefijo cubre carta, checklist y availability de cualquier valoración.

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual (usuario): Network — Evaluación → Informes → Evaluación: 1 request `/users`; abrir un estudiante, editar sin guardar, esperar revalidación (volver a la pestaña de la lista y regresar): el borrador persiste; guardar → la lista muestra el nuevo `globalStatus` sin recargar.
