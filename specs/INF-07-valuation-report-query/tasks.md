# INF-07 — Tasks

## Frontend (`quartz-web`)
- [x] Tipos: unificar `UserDto`/`GetUsersQuery` en `users/types`; ampliar `UserSchool`/`UserValuationSummary` si falta algún campo
- [x] `student-valuation/queries/useStudentValuationQuery.ts` — `valuationKeys`, query `live` (POST get-or-create), update (setQueryData + invalida `users`/`dashboard`/`report`), delete
- [x] `report/queries/useReportQuery.ts` — `reportKeys`, checklist, letter (`retry: false`), availability, save concepts, 2 consolidados como mutación
- [x] `StudentValuationTable.tsx` — `isLoading`, `error`, `onDeleteValuation` por props; sin imports de store
- [x] `StudentValuationsPage.tsx` — `useUsersQuery({ role: 'Estudiante' })`, `useLetterAvailabilityQuery`, delete mutation; borrar `useEffect` de fetch
- [x] `StudentValuationDetail.tsx` — `useStudentValuationQuery` + update mutation; sync de `localValuation` solo si no hay cambios sin guardar; borrar `clearValuation`
- [x] `ReportsPage.tsx` + `IndividualReportsPanel.tsx` — `useUsersQuery({ role: 'Estudiante' })`, `useLetterAvailabilityQuery`
- [x] `ChecklistReportModal.tsx` / `CommunicativeLetterModal.tsx` — queries con `enabled: open && !!valuationId`; borrar `clear*`
- [x] `CommunicativeLetterEditPage.tsx` — letter query + save mutation; sync de borrador solo si `!isDirty`
- [x] `useBulkReportDownload.tsx` — mutaciones de consolidado
- [x] `ReportsTable.tsx` — `ITEMS_PER_PAGE` desde `DataTable`
- [x] Borrar `useStudentValuationStore.ts`, `useReportStore.ts` y sus `types/store.ts`; ajustar `types/index.ts`
- [x] `grep -rn "useStudentValuationStore\|useReportStore" src` → 0 resultados

## Verificación final
- [x] `npm run build && npm run lint` en verde
- [x] `npm run dev` sin errores de compilación ni runtime
- [x] Repaso de aislamiento: datos de informes solo en caché en memoria, purgada por INF-05; ningún PDF persistido

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
