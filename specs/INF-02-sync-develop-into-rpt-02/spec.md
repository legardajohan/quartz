---
id: INF-02-sync-develop-into-rpt-02
feature: sync-develop-into-rpt-02
status: implemented
created: 2026-08-13
---

# INF-02 — Sincronizar `develop` dentro de `feat/RPT-02-communicative-letter` (spec)

## Objetivo
Traer a `feat/RPT-02-communicative-letter` los 16 commits acumulados en `develop` desde su base (`f840d3f`, merge de USR-01) — INF-01 (búsqueda/filtros unificados + PDF), ACAD-04 (colegios/sedes), AUTH-01 (welcome loader + white-label) — sin perder la funcionalidad de Carta Comunicativa ya construida en esta rama, dando prioridad a la implementación de `develop` cuando ambas ramas modifican el mismo código.

## Alcance
**Incluye:**
- `git merge develop` sobre `feat/RPT-02-communicative-letter`.
- Resolución manual de los conflictos reales (11 archivos con solapamiento, 8 con marcadores de conflicto).
- `npm install` en `quartz-api` y `quartz-web` del worktree (nueva dependencia `sharp` de `develop`).
- Verificación: `tsc --noEmit`, `npm run build`, `npm run lint`.

**Fuera:**
- Cambios de funcionalidad nuevos (ni de Carta Comunicativa ni de lo traído de `develop`).
- Corrección de deuda de lint preexistente en `develop` (`App.tsx`, `ValuationChecklist.tsx`, `StudentValuationTable.tsx:90`, warnings de `exhaustive-deps`) — no introducida por este sync, fuera de alcance.
- Push a `origin/feat/RPT-02-communicative-letter` (queda pendiente de decisión del usuario).

## Criterios de aceptación (EARS)
- [x] Cuando se ejecuta `git merge develop`, el sistema conserva íntegras las funciones/rutas/schemas backend agregadas por ambas ramas en `report.controller.ts`, `report.routes.ts`, `report.service.ts`, `report.validation.ts` (sin duplicados, sin pérdida).
- [x] Cuando se resuelven `ReportsPage.tsx` y `StudentValuationsPage.tsx`, el sistema conserva la búsqueda/filtros y paginación local de `develop` (INF-01) **y** el botón/modal de Carta Comunicativa de esta rama.
- [x] Cuando se resuelven `useReportStore.ts`/`types/store.ts`, el sistema NO reintroduce `currentPage`/`nextPage`/`prevPage` (removidos intencionalmente por `develop`) y sí conserva `currentLetter`/`letterAvailability`/acciones de carta.
- [x] Si un archivo fue tocado solo por una rama, el sistema lo conserva sin alteración (merge automático de git, sin intervención manual).
- [x] `npx tsc --noEmit` en verde en `quartz-api`.
- [x] `npm run build && npm run lint` en verde en `quartz-web` (0 errores nuevos; los 4 errores/3 warnings preexistentes de `develop` permanecen sin cambio).
- [x] **Aislamiento:** ningún endpoint agregado o modificado acepta `institutionId` de `body`/`params`/`query` — se verificó que `report.controller.ts` sigue derivando `institutionId` de `req.user!.institutionId` en todas las funciones (nuevas y preexistentes).

## Dependencias
- Ninguna — trabaja directamente sobre `feat/RPT-02-communicative-letter` y `origin/develop`.

## Trazabilidad
- Backend:  quartz-api/src/features/report/ (controller, routes, service, types, validation)
- Frontend: quartz-web/src/features/report/, quartz-web/src/features/student-valuation/
- Branch:   feat/RPT-02-communicative-letter (mismo branch, no se crea uno nuevo — ver plan.md)
- Commit de merge: `b89dd2a`
