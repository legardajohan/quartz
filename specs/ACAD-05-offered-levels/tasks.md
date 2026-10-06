# ACAD-05 — Tasks

## Preparación
- [x] Confirmar que `feat/USR-05-bulk-user-import` tiene USR-05 commiteado (árbol limpio)
- [x] Rama `feat/ACAD-05-offered-levels` desde `feat/USR-05-bulk-user-import` (no desde `develop`)

## Backend (`quartz-api`)
- [x] `auth/auth.types.ts` — `GradeLevel` (3 valores), `GRADE_LEVELS`, `ISessionData.offeredLevels`
- [x] `institution/institution.model.ts` — `settings.offeredLevels` (enum, default `['Transición']`)
- [x] `institution/institution.types.ts` — `IInstitutionSettings`, `UpdateInstitutionSettingsData`
- [x] `institution/institution.validation.ts` — `offeredLevels` (array enum, sin duplicados, `.strict()` intacto)
- [x] `institution/institution.service.ts` — leer/mapear `offeredLevels`; 422 si queda vacío; 409 si algún usuario del inquilino (`findScoped`) usa el nivel quitado
- [x] `auth/auth.service.ts` — `getSessionData` devuelve `offeredLevels`
- [x] `users/users.service.ts` — `createUser`/`updateUser`: `gradesTaught ⊂ offeredLevels` (422); Estudiante = 1 grado también al editar
- [x] `checklist-template/*.validation.ts` y `learning/*.validation.ts` — `z.nativeEnum(GradeLevel)`
- [x] Script `migrate-grade-levels` (idempotente, con conteos) + fijar `offeredLevels` de instituciones existentes
- [x] `dev/data_base/insert-db.js` — valores del enum
- [x] `institution.service.ts` — 409 también si aprendizajes o plantillas usan el nivel quitado
- [x] `users-import.service.ts` — nivel desde `offeredLevels` (columna condicional + revalidación en confirm)

## Frontend (`quartz-web`)
- [x] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design` antes de escribir UI
- [x] `types/domain.ts` — `GradeLevel`, `GRADE_LEVELS`, `ISessionData.offeredLevels`
- [x] `institution/types` + `auth/seedSessionCatalogs.ts` — `offeredLevels`
- [x] `institution/queries/useOfferedLevels.ts`
- [x] `institution/components/LevelsPanel.tsx`
- [x] `configuration/pages/ConfigurationPage.tsx` — tab "Niveles" (6 pasos, texto "seis pasos")
- [x] Reemplazar `GRADE_LEVELS = ["Transición"]` por `useOfferedLevels()` en: `UserForm`, `UsersPage`, `DashboardFilters`, `ReportsPage`, `ConsolidatedReportsPanel`, `StudentValuationsPage`
- [x] `ChecklistCreateForm` y `LearningsPage` — selector de nivel (oculto si hay uno solo)
- [x] `users/types/api.ts` (`ImportRowDto.gradesTaught`) y ayuda de columnas en `UserImportModal`

## Docs
- [x] `docs/domain.md`, `docs/data-model.md`, tres `CLAUDE.md` — alcance Preescolar y `offeredLevels`

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` sin errores nuevos (`quartz-web`)
- [x] Servidor y web arrancan sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación _(pendiente: lo hace el usuario; incluye correr la migración en base de prueba)_
- [x] Repaso de aislamiento: `offeredLevels` y el conteo de usuarios filtran `institutionId` del token

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
