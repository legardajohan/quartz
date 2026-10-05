---
id: INF-09-session-identity-only
feature: session-identity-only
status: implemented
created: 2026-10-05
---

# INF-09 — `sessionData` solo identidad; catálogos en React Query (spec)

## Objetivo
Eliminar la doble fuente de verdad de los catálogos: `useAuthStore.sessionData` queda solo con la identidad (`user`) y React Query es el único dueño de periodos, dimensiones y ajustes de institución, sembrado desde la respuesta de sesión.

## Contexto
- Tras INF-06, `periods`/`subjects`/`enabledReports`/`multipleShifts`/`shifts` viven en dos sitios: `sessionData` y la caché de React Query. Se mantienen alineados a mano (`setPeriods`, `setSubjects`, `setEnabledReports`, `setShifts` en cada `onSuccess`, y `fetchQuery` para releer la lista).
- Consumidores de catálogos en `sessionData` (11): `ChecklistsPage`, `ConceptsPage`, `LearningsPage`, `UsersPage`, `StudentValuationsPage`, `StudentValuationDetail`, `IndividualReportsPanel`, `ConsolidatedReportsPanel`, `DashboardFilters`, `useActivePeriod`, `useSubjectAxisLabel`. Se recalcula con `grep` al implementar.
- `GET /institutions/me` es solo Jefe de Área; el Docente recibe `enabledReports`/`multipleShifts`/`shifts` únicamente por `/auth/session`. Con la caché de 30 min, migrar esos datos a `['institution','me']` daría 403 al Docente al caducar.
- `getSessionData` entrega periodos recortados (`_id`, `name`, `isActive`); `GET /periods` entrega `IPeriodDTO` completo. Sembrar la caché con el recorte dejaría filas incompletas en `PeriodsPanel` → el payload de sesión debe usar el mismo DTO que los endpoints.
- `sessionData.checklistTemplates` se calcula en cada login/refresh (una query a Mongo) y ningún código lo lee; solo `auth.service` usa `getChecklistTemplatesForSession`.
- `AppRoot` no espera a `refreshSession()`: pinta con la copia de `localStorage`.

## Alcance
**Incluye:**
- Backend: `GET /api/institutions/me/settings` (Jefe de Área + Docente); `/auth/session` y `/auth/login` y `/auth/activation` devuelven periodos y dimensiones con el DTO completo; eliminar `checklistTemplates` del payload y su código huérfano.
- `useAuthStore`: `sessionData` pasa a `{ user }`; se eliminan `setSubjects`, `setPeriods`, `setEnabledReports`, `setShifts`; `login`, `activateAccount` y `refreshSession` siembran la caché con `setQueryData` (después de `queryClient.clear()`).
- `persist` con `version` + `migrate`: una sesión guardada con el formato anterior se lee sin re-login y se descartan los catálogos viejos de `localStorage`.
- Hook `useInstitutionSettingsQuery` (key `['institution','settings']`).
- Migración de los consumidores de catálogos a hooks (`useActivePeriod` y `useSubjectAxisLabel` envuelven la query con `select`).
- Mutaciones de INF-06: periodos/dimensiones solo invalidan; ajustes de institución escriben `['institution','me']` y `['institution','settings']`.

**Fuera:**
- Selectores atómicos de `useAuthStore()` y filtros de tablas (INF-08).
- Persistir catálogos en `localStorage` o esperar la sesión en `AppRoot`: tras F5 se acepta un parpadeo breve.
- Cambios de UI, de `shieldCache.ts` y de `branding` (ya es query propia).
- Cambiar roles de `GET /institutions/me`.

## Criterios de aceptación (EARS)
- [x] `sessionData` en el store contiene solo `user`; `useAuthStore` no expone `setSubjects`, `setPeriods`, `setEnabledReports` ni `setShifts`.
- [x] Cuando se inicia sesión, se activa una cuenta o se ejecuta `refreshSession()`, el sistema purga la caché y luego escribe `['periods','list']`, `['subjects','list']` e `['institution','settings']` con los datos de la respuesta, sin emitir requests adicionales a `/periods`, `/subjects` ni `/institutions/me/settings`.
- [x] Los periodos sembrados tienen los mismos campos que `GET /periods` (`year`, `startDate`, `endDate`, `closingAlertDate`, `isActive`); `PeriodsPanel` muestra las fechas completas sin refetch.
- [x] Mientras los catálogos sembrados tengan < 30 min (`STALE_TIME.catalog`), el sistema no los refetchea al montar.
- [x] Cuando el Docente carga cualquier pantalla tras caducar la caché, el sistema obtiene los ajustes con `GET /institutions/me/settings` sin error 403.
- [x] `GET /institutions/me/settings` responde `{ enabledReports, multipleShifts, shifts }` para Jefe de Área y Docente, con `institutionId` tomado del token; un rol distinto recibe 403.
- [x] Cuando se crea/edita/elimina un periodo o una dimensión, el sistema invalida `['periods']` o `['subjects']` y `['dashboard']`, sin escribir en `sessionData`.
- [x] Cuando se guardan los ajustes de institución, el sistema escribe la respuesta en `['institution','me']` y `['institution','settings']`; los consumidores de `enabledReports`/`shifts` se actualizan sin recargar.
- [x] Ningún componente ni hook lee `periods`, `subjects`, `enabledReports`, `multipleShifts` ni `shifts` de `useAuthStore`.
- [x] Mientras los catálogos no han llegado (F5), los consumidores renderizan con listas vacías estables sin errores en consola; los filtros que aplican un valor por defecto una sola vez (periodo activo) lo aplican cuando el dato llega.
- [x] Cuando existe una sesión persistida con el formato anterior (`sessionData` con catálogos), el sistema la lee sin pedir login, conserva `token` y `user`, y descarta los catálogos de `localStorage`.
- [x] `localStorage['quartz-session']` contiene solo `token` y `sessionData.user`.
- [x] `/auth/login`, `/auth/activation` y `/auth/session` no incluyen `checklistTemplates`; `getChecklistTemplatesForSession` e `IChecklistTemplateForSession` no existen; `ChecklistTemplates` no existe en `quartz-web/src/types/domain.ts`.
- [x] Si `refreshSession()` falla por red o 5xx, el sistema conserva `token` y `user` persistidos y no toca la caché; si responde 401, ejecuta `logout()` (comportamiento actual).
- [x] **Aislamiento:** `GET /institutions/me/settings` filtra por `institutionId` del token y no acepta `institutionId` de `body`/`params`/`query`; la siembra ocurre después de `queryClient.clear()` y `logout()` purga la caché (INF-05); ningún catálogo se persiste en storage.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web` (sin errores nuevos respecto de la línea base).

## Dependencias
- **Base de rama:** `feat/INF-07-valuation-report-query` (cadena `INF-05 → INF-06 → INF-07 → INF-09 → INF-08`, cada una desde la anterior, sin pasar por `develop`). El PR a `develop` se abre cuando sus predecesoras estén mergeadas, o su diff las arrastrará.
- INF-05 (`STALE_TIME`, purga de caché, keys), INF-06 (`periodKeys`, `subjectKeys`, `institutionKeys`, mutaciones), INF-07 (consumidores de valoración/informes ya migrados).
- INF-08 depende de este spec.

## Trazabilidad
- Backend:  `quartz-api/src/features/{auth,institution,period,subject,checklist-template}/`
- Frontend: `quartz-web/src/features/{auth,period,subject,institution,learning,concept,checklist-template,dashboard,users,student-valuation,report}/`, `quartz-web/src/types/domain.ts`
- Branch:   `feat/INF-09-session-identity-only`
