# INF-02 — Tasks

## Sincronización
- [x] Actualizar `develop` local a `origin/develop` (fast-forward, worktree `quartz`)
- [x] `git merge develop` en el worktree `quartz-rpt-02`
- [x] Resolver `report.controller.ts` — mantener ambos bloques de funciones
- [x] Resolver `report.routes.ts` — mantener las 3 rutas nuevas, orden correcto
- [x] Resolver `report.validation.ts` — mantener los 3 schemas nuevos
- [x] Resolver `report.service.ts` — mantener ambos bloques de funciones + fusionar imports
- [x] Verificar auto-merge de `report.types.ts` (interfaces de carta + comentario removido)
- [x] Resolver `quartz-web/.../report/types/store.ts` — base develop + campos de carta
- [x] Resolver `quartz-web/.../report/useReportStore.ts` — base develop + acciones de carta
- [x] Verificar auto-merge de `ReportsTable.tsx` (AVATAR_FALLBACK + botón de carta)
- [x] Resolver `ReportsPage.tsx` — base develop + reintegrar modal/estado/handler de carta
- [x] Verificar auto-merge de `StudentValuationTable.tsx` (getValuationState + botón de carta)
- [x] Resolver `StudentValuationsPage.tsx` — base develop + reintegrar modal/estado/handler de carta
- [x] Confirmar cero marcadores de conflicto (`<<<<<<<`/`=======`/`>>>>>>>`) en todo el worktree

## Verificación
- [x] `npm install` en `quartz-api` (dependencia `sharp` nueva de `develop`)
- [x] `npm install` en `quartz-web`
- [x] `npx tsc --noEmit` en `quartz-api` — verde
- [x] `npm run build` en `quartz-web` — verde
- [x] `npm run lint` en `quartz-web` — 4 errores/3 warnings, todos preexistentes en `develop` (confirmado, no introducidos)
- [x] Commit del merge (`b89dd2a`), sin push

## Definición de "hecho"
Todos los criterios EARS de `spec.md` cubiertos · `status: implemented`. Push pendiente de decisión del usuario.
