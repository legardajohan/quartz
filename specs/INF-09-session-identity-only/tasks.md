# INF-09 — Tasks

## Backend (`quartz-api`)
- [x] Verificar con `grep` que `getChecklistTemplatesForSession` y `IChecklistTemplateForSession` solo los usa `auth.service`
- [x] `period.service.ts` / `subject.service.ts` — mover y exportar `mapPeriodToDTO` / `mapSubjectToDTO` desde sus controllers; controllers importan
- [x] `institution.service.ts` — `getInstitutionSettings(institutionId)` (`getEnabledReports` + `getShiftSettings`)
- [x] `institution.controller.ts` — `getMyInstitutionSettingsController` (sin `try/catch`, `institutionId` del token)
- [x] `institution.routes.ts` — `GET /me/settings` (`authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → asyncHandler`)
- [x] `auth.types.ts` — `ISessionData`: `periods: IPeriodDTO[]`, `subjects: ISubjectDTO[]`; borrar `checklistTemplates`
- [x] `auth.service.ts` — `getSessionData` sin `getChecklistTemplatesForSession`, con `getInstitutionSettings` y los mappers de DTO
- [x] `checklist-template.service.ts` / `.types.ts` — borrar `getChecklistTemplatesForSession` e `IChecklistTemplateForSession`

## Frontend (`quartz-web`)
- [x] `types/domain.ts` — `ISessionData` con `PeriodDto[]`/`SubjectDto[]`; borrar `ChecklistTemplates`
- [x] `auth/types/store.ts` — `SessionUser`, `SessionIdentity`; `sessionData: SessionIdentity | null`; quitar los 4 setters de `AuthState`
- [x] `institution/queries/useInstitutionQuery.ts` — `institutionKeys.settings`, `useInstitutionSettingsQuery`; la mutación de ajustes escribe `me` + `settings` y deja de tocar `useAuthStore`
- [x] `period/queries/usePeriodsQuery.ts` — mutaciones solo invalidan `periodKeys.all` + `['dashboard']`; borrar `refreshPeriods`/`syncSessionPeriods`
- [x] `subject/queries/useSubjectsQuery.ts` — ídem con `subjectKeys.all`; borrar `refreshSubjects`
- [x] `auth/seedSessionCatalogs.ts` — siembra `periodKeys.list()`, `subjectKeys.list()`, `institutionKeys.settings`; sin importar `useAuthStore`
- [x] `auth/useAuthStore.ts` — `login`/`activateAccount`/`refreshSession` siembran tras `clear()`; `sessionData: { user }`; eliminar los 4 setters; `persist` con `version: 1` + `migrate`
- [x] `useActivePeriod.ts` — `useQuery` + `select` (función de módulo)
- [x] `useSubjectAxisLabel.ts` — leer de `useSubjectsQuery`
- [x] `LearningsPage`, `ConceptsPage`, `ChecklistsPage` — periodos/dimensiones desde hooks; revisar el efecto del default de periodo activo
- [x] `UsersPage` — jornadas desde `useInstitutionSettingsQuery`
- [x] `StudentValuationsPage`, `StudentValuationDetail`, `IndividualReportsPanel` — `enabledReports`/dimensiones desde hooks; revisar el efecto del default de sede/periodo
- [x] `ConsolidatedReportsPanel`, `DashboardFilters` — periodos y jornadas desde hooks
- [x] `grep -rnE "sessionData\??\.(periods|subjects|enabledReports|multipleShifts|shifts|checklistTemplates)|setSubjects|setPeriods|setEnabledReports|setShifts" quartz-web/src` → 0 resultados (salvo comentarios actualizados)

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde
- [x] `cd quartz-web && npm run build && npm run lint` en verde (sin errores nuevos)
- [x] `npm run dev` en ambos paquetes sin errores de compilación ni runtime
- [x] Sesión persistida con el formato anterior se lee sin re-login y queda sin catálogos en `localStorage` (`migrate` implementado; prueba en navegador pendiente del usuario)
- [x] Repaso de aislamiento: `/me/settings` usa `institutionId` del token; la siembra va después de `queryClient.clear()`; ningún catálogo en storage

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
