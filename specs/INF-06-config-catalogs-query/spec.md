---
id: INF-06-config-catalogs-query
feature: config-catalogs-query
status: implemented
created: 2026-09-28
---

# INF-06 — Catálogos de configuración en React Query (spec)

## Objetivo
Migrar periodos, dimensiones, sedes e institución (configuración + branding) de Zustand a React Query, eliminando las requests duplicadas en `/gestion/configuracion`, en el sidebar/topbar y entre `users` y `school`.

## Contexto
- Duplicados actuales:
  - `GET /institutions/me`: lo piden `ReportSettingsPanel`, `ShiftsPanel` e `InstitutionShieldPanel` en cada montaje.
  - `GET /institutions/me/branding`: lo pide `InstitutionBrand` en cada montaje (sidebar y topbar).
  - `GET /schools`: `useSchoolStore` (`SchoolsPanel`) **y** `users/queries/useSchoolsQuery.ts` (`UsersPage`), con cachés separadas.
- `usePeriodStore`, `useSubjectStore` e `useInstitutionStore` sincronizan `sessionData` (`setPeriods`, `setSubjects`, `setEnabledReports`, `setShifts`) tras mutar; ese contrato se mantiene.
- `useInstitutionShieldQuery` lee `shieldVersion` de `useInstitutionStore.branding`.

## Alcance
**Incluye:**
- `queries/` para `period`, `subject`, `school`, `institution`; eliminación de `usePeriodStore`, `useSubjectStore`, `useSchoolStore`, `useInstitutionStore` y sus `types/store.ts`.
- Unificación de `useSchoolsQuery` en `features/school/queries/`.
- `InstitutionBrand` y `useInstitutionShieldQuery` sobre `useInstitutionBrandingQuery`.

**Fuera:**
- Reemplazar `sessionData.subjects/periods` como fuente de lectura del resto de la app (sigue siendo `useAuthStore`).
- Cambios de backend o de UI.
- Caché del escudo en `localStorage` (`shieldCache.ts`): se mantiene tal cual.

## Criterios de aceptación (EARS)
- [x] Cuando el Jefe de Área abre `/gestion/configuracion`, el sistema emite como máximo una request a `/institutions/me` aunque monten `ReportSettingsPanel`, `ShiftsPanel` e `InstitutionShieldPanel`.
- [x] Cuando el usuario navega entre secciones, `InstitutionBrand` no emite `GET /institutions/me/branding` si la caché tiene < 30 min.
- [x] Cuando `UsersPage` y `SchoolsPanel` se visitan en la misma sesión, el sistema comparte la key `['schools']` y emite una sola request mientras no esté stale.
- [x] Mientras los datos de subjects, periods, schools, institution y branding tengan < 30 min (`STALE_TIME.catalog`), el sistema no los refetchea al montar.
- [x] Cuando se crea/edita/elimina un periodo, el sistema invalida `['periods']`, `['dashboard']` y actualiza `sessionData.periods` vía `setPeriods`.
- [x] Cuando se crea/edita/elimina una dimensión, el sistema invalida `['subjects']`, `['dashboard']` y actualiza `sessionData.subjects` vía `setSubjects`.
- [x] Cuando se crea/edita/elimina una sede, el sistema invalida `['schools']` y `['users']`.
- [x] Cuando se guardan ajustes de institución, el sistema escribe la respuesta en `['institution','me']` y llama `setEnabledReports` + `setShifts`.
- [x] Cuando se sube el escudo, el sistema escribe la respuesta en `['institution','me']` e invalida `['institution','branding']`; `useInstitutionShieldQuery` descarga el nuevo escudo por el nuevo `shieldVersion`.
- [x] Si `GET /institutions/me/branding` falla, `InstitutionBrand` muestra el placeholder sin toast (comportamiento actual).
- [x] Si una mutación falla, el toast muestra el mismo mensaje que hoy y la caché no cambia.
- [x] No existen `usePeriodStore.ts`, `useSubjectStore.ts`, `useSchoolStore.ts`, `useInstitutionStore.ts` ni `users/queries/useSchoolsQuery.ts`.
- [x] **Aislamiento:** sin cambios de backend; la caché se purga en cada cambio de sesión (INF-05).
- [x] `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- **Base de rama:** `feat/INF-05-server-state-foundation` (incluye USR-04 y anteriores; cadena `INF-05 → INF-06 → INF-07 → INF-09 → INF-08`, cada una desde la anterior, sin pasar por `develop`). El PR a `develop` se abre cuando sus predecesoras estén mergeadas, o su diff las arrastrará.
- INF-05-server-state-foundation (`STALE_TIME`, purga de caché, convención de keys).

## Trazabilidad
- Frontend: `quartz-web/src/features/{period,subject,school,institution,users}/`, `quartz-web/src/components/common/InstitutionBrand.tsx`
- Branch:   `feat/INF-06-config-catalogs-query`
