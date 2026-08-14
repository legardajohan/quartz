# INF-02 — Plan técnico

## Por qué esta rama y no una nueva
No es un feature independiente: es sincronizar `feat/RPT-02-communicative-letter` con `develop`. Se documenta y ejecuta sobre la misma rama (convención confirmada en `specs/01-prompt-carta-comunicativa.md`: "Debes hacer la SPEC sobre la misma rama actual").

## Estado previo
- Base de la rama: `f840d3f` (merge PR #7, USR-01).
- `origin/develop` en `dc656fa` (16 commits por delante): INF-01, ACAD-04, AUTH-01.
- `feat/RPT-02-communicative-letter`: 2 commits propios (backend + frontend de Carta Comunicativa).
- Solapamiento real (mismo archivo tocado por ambas ramas) en 11 archivos.

## Estrategia
`git merge develop` (no rebase) → preserva historial, no requiere force-push sobre `origin/feat/RPT-02-communicative-letter`.

## Resolución de conflictos (8 archivos con marcadores; 3 más se auto-mergearon sin marcadores pero con solapamiento)

| Archivo | Tipo de conflicto | Resolución aplicada |
|---|---|---|
| `quartz-api/.../report.controller.ts` | Imports/funciones distintas | Ambos bloques: `getChecklistReportShieldController` (develop) + `getCommunicativeLetterReportController`, `getLetterAvailabilityController` (RPT-02) |
| `quartz-api/.../report.routes.ts` | Rutas nuevas distintas | 3 rutas nuevas conservadas; orden RPT-02 respetado (`/communicative-letter/availability` antes de `/communicative-letter/:valuationId`) |
| `quartz-api/.../report.validation.ts` | Schemas distintos | Los 3 schemas nuevos conservados |
| `quartz-api/.../report.service.ts` | Funciones distintas (~40 líneas develop, ~205 líneas RPT-02) | Ambos bloques + import de `r2.service` (develop) fusionado con imports de tipos de carta (RPT-02) |
| `quartz-api/.../report.types.ts` | *(auto-merge, sin marcadores)* comentario removido (develop) vs. interfaces nuevas (RPT-02) | Verificado: quedó sin comentario + con las 5 interfaces de carta |
| `quartz-web/.../report/types/store.ts` | develop quita `currentPage/nextPage/prevPage`; RPT-02 agrega campos de carta | Base develop (sin paginación en store) + campos/acciones de carta conservados |
| `quartz-web/.../report/useReportStore.ts` | Igual, en implementación | Base develop + `fetchLetterAvailability`, `fetchCommunicativeLetter`, `saveLetterConcepts`, `clearLetter` conservados; `nextPage`/`prevPage` eliminados |
| `quartz-web/.../report/components/ReportsTable.tsx` | *(auto-merge, sin marcadores)* `AVATAR_FALLBACK` (develop) vs. botón funcional de carta (RPT-02) | Verificado: import `AVATAR_FALLBACK` + botón "Ver carta" funcional, ambos presentes |
| `quartz-web/.../report/pages/ReportsPage.tsx` | develop reescribe con `SearchFilterBar` + paginación local; RPT-02 agrega modal de carta | Base develop (búsqueda/filtros/paginación local) + `fetchLetterAvailability` en `useEffect`, `letterAvailability`, `handleViewLetter`, `<CommunicativeLetterModal>` reintegrados |
| `quartz-web/.../student-valuation/components/StudentValuationTable.tsx` | *(auto-merge, sin marcadores)* `getValuationState` desde `domain.ts` + `AVATAR_FALLBACK` (develop) vs. botón/props de carta (RPT-02) | Verificado: ambos presentes sin pérdida |
| `quartz-web/.../student-valuation/pages/StudentValuationsPage.tsx` | Igual patrón que `ReportsPage.tsx` | Base develop (búsqueda/filtros/paginación local, `useMemo`) + `useReportStore` (letter actions), modal y handler de carta reintegrados |

## Dependencias
`quartz-api/package.json` y `quartz-web/package.json` llegaron actualizados desde `develop` (merge automático, sin conflicto). Requiere `npm install` en ambos paquetes del worktree — `develop` agregó `sharp` (backend, para `webpToJpeg.ts`) y una dependencia menor en frontend.

## Verificación
```
cd quartz-api && npx tsc --noEmit
cd quartz-web && npm install && npm run build && npm run lint
```
Resultado: backend limpio. Frontend build limpio; lint con 4 errores + 3 warnings, todos preexistentes en `develop` antes del merge (confirmado con `git show origin/develop:<path>`), no introducidos por esta sincronización.

## Notas
- Los archivos sueltos `specs/01-prompt-carta-comunicativa.md` y `specs/02-prompt-union-welcome-loader-carta-comunicativa.md` (untracked, fuera de la convención `<ID>-<slug>/`) no se tocaron.
- No se hizo push a `origin/feat/RPT-02-communicative-letter`; el commit de merge (`b89dd2a`) queda local para revisión.
