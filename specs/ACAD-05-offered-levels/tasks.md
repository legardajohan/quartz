# ACAD-05 — Tasks

## Preparación
- [ ] Confirmar que `feat/USR-05-bulk-user-import` tiene USR-05 commiteado (árbol limpio)
- [ ] Rama `feat/ACAD-05-offered-levels` desde `feat/USR-05-bulk-user-import` (no desde `develop`)

## Backend (`quartz-api`)
- [ ] `auth/auth.types.ts` — `GradeLevel` (3 valores), `GRADE_LEVELS`, `ISessionData.offeredLevels`
- [ ] `institution/institution.model.ts` — `settings.offeredLevels` (enum, default `['Transición']`)
- [ ] `institution/institution.types.ts` — `IInstitutionSettings`, `UpdateInstitutionSettingsData`
- [ ] `institution/institution.validation.ts` — `offeredLevels` (array enum, sin duplicados, `.strict()` intacto)
- [ ] `institution/institution.service.ts` — leer/mapear `offeredLevels`; 422 si queda vacío; 409 si algún usuario del inquilino (`findScoped`) usa el nivel quitado
- [ ] `auth/auth.service.ts` — `getSessionData` devuelve `offeredLevels`
- [ ] `users/users.service.ts` — `createUser`/`updateUser`: `gradesTaught ⊂ offeredLevels` (422); Estudiante = 1 grado también al editar
- [ ] `checklist-template/*.validation.ts` y `learning/*.validation.ts` — `z.nativeEnum(GradeLevel)`
- [ ] Script `migrate-grade-levels` (idempotente, con conteos) + fijar `offeredLevels` de instituciones existentes
- [ ] `dev/data_base/insert-db.js` — valores del enum

## Frontend (`quartz-web`)
- [ ] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design` antes de escribir UI
- [ ] `types/domain.ts` — `GradeLevel`, `GRADE_LEVELS`, `ISessionData.offeredLevels`
- [ ] `institution/types` + `auth/seedSessionCatalogs.ts` — `offeredLevels`
- [ ] `institution/queries/useOfferedLevels.ts`
- [ ] `institution/components/LevelsPanel.tsx`
- [ ] `configuration/pages/ConfigurationPage.tsx` — tab "Niveles" (6 pasos, texto "seis pasos")
- [ ] Reemplazar `GRADE_LEVELS = ["Transición"]` por `useOfferedLevels()` en: `UserForm`, `UsersPage`, `DashboardFilters`, `ReportsPage`, `ConsolidatedReportsPanel`, `StudentValuationsPage`
- [ ] `ChecklistCreateForm` y `LearningsPage` — selector de nivel (oculto si hay uno solo)

## Docs
- [ ] `docs/domain.md`, `docs/data-model.md`, tres `CLAUDE.md` — alcance Preescolar y `offeredLevels`

## Verificación final
- [ ] `npx tsc --noEmit` en verde (`quartz-api`)
- [ ] `npm run build && npm run lint` sin errores nuevos (`quartz-web`)
- [ ] Servidor y web arrancan sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación
- [ ] Repaso de aislamiento: `offeredLevels` y el conteo de usuarios filtran `institutionId` del token

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
