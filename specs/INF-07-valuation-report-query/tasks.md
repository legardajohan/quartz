# INF-07 — Tasks

## Frontend (`quartz-web`)
- [ ] Tipos: unificar `UserDto`/`GetUsersQuery` en `users/types`; ampliar `UserSchool`/`UserValuationSummary` si falta algún campo
- [ ] `student-valuation/queries/useStudentValuationQuery.ts` — `valuationKeys`, query `live` (POST get-or-create), update (setQueryData + invalida `users`/`dashboard`/`report`), delete
- [ ] `report/queries/useReportQuery.ts` — `reportKeys`, checklist, letter (`retry: false`), availability, save concepts, 2 consolidados como mutación
- [ ] `StudentValuationTable.tsx` — `isLoading`, `error`, `onDeleteValuation` por props; sin imports de store
- [ ] `StudentValuationsPage.tsx` — `useUsersQuery({ role: 'Estudiante' })`, `useLetterAvailabilityQuery`, delete mutation; borrar `useEffect` de fetch
- [ ] `StudentValuationDetail.tsx` — `useStudentValuationQuery` + update mutation; sync de `localValuation` solo si no hay cambios sin guardar; borrar `clearValuation`
- [ ] `ReportsPage.tsx` + `IndividualReportsPanel.tsx` — `useUsersQuery({ role: 'Estudiante' })`, `useLetterAvailabilityQuery`
- [ ] `ChecklistReportModal.tsx` / `CommunicativeLetterModal.tsx` — queries con `enabled: open && !!valuationId`; borrar `clear*`
- [ ] `CommunicativeLetterEditPage.tsx` — letter query + save mutation; sync de borrador solo si `!isDirty`
- [ ] `useBulkReportDownload.tsx` — mutaciones de consolidado
- [ ] `ReportsTable.tsx` — `ITEMS_PER_PAGE` desde `DataTable`
- [ ] Borrar `useStudentValuationStore.ts`, `useReportStore.ts` y sus `types/store.ts`; ajustar `types/index.ts`
- [ ] `grep -rn "useStudentValuationStore\|useReportStore" src` → 0 resultados

## Verificación final
- [ ] `npm run build && npm run lint` en verde
- [ ] `npm run dev` sin errores de compilación ni runtime
- [ ] Repaso de aislamiento: datos de informes solo en caché en memoria, purgada por INF-05; ningún PDF persistido

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
