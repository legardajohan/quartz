---
id: INF-05-server-state-foundation
feature: server-state-foundation
status: released
created: 2026-09-28
---

# INF-05 — Base de estado de servidor con React Query (spec)

## Objetivo
Eliminar las requests redundantes y el spinner al navegar por el sidebar: fijar la política global de caché de React Query, purgar la caché entre sesiones y migrar los catálogos académicos (`learning`, `concept`, `checklist-template`) de Zustand a React Query como patrón canónico para INF-06/07/08.

## Contexto
- `QueryClientProvider` y `ReactQueryDevtools` ya están montados en `quartz-web/src/main.tsx`; defaults en `quartz-web/src/lib/queryClient.ts` (`staleTime 5min`, `retry 1`, `refetchOnWindowFocus false`, sin `gcTime` explícito).
- `useLearningStore`, `useConceptStore` y `useChecklistTemplateStore` guardan la lista en Zustand y sus páginas llaman `fetchX()` en `useEffect` al montar → 1 request + `isLoading: true` en cada visita.
- `logout()` (`features/auth/useAuthStore.ts`) no limpia la caché de React Query → la siguiente sesión en la misma pestaña (otra institución) puede leer datos del inquilino anterior hasta el refetch.
- `quartz-web/CLAUDE.md` § "Estado" prohíbe migrar stores "solo por consistencia"; aquí hay defecto real (latencia, requests redundantes, fuga de caché entre inquilinos) → la regla se reescribe.

## Alcance
**Incluye:**
- Defaults globales de `queryClient` + constante de tiers `STALE_TIME`.
- Purga de caché (`queryClient.clear()`) en `logout`, `login` y `activateAccount`.
- Migración de `learning`, `concept`, `checklist-template` a `features/<f>/queries/`; eliminación de sus stores y `types/store.ts`.
- Reescritura de `quartz-web/CLAUDE.md` § "Estado: Zustand vs. React Query".

**Fuera:**
- `period`, `subject`, `school`, `institution` → INF-06.
- `student-valuation`, `report` → INF-07.
- Persistencia de filtros en Zustand → INF-08 (aquí los filtros siguen en `useState`).
- Persistir la caché de React Query en `localStorage` (`persistQueryClient`): descartado por riesgo multi-tenant.
- Actualizaciones optimistas.
- Cambios de backend.

## Criterios de aceptación (EARS)
- [x] Cuando la app arranca, el `queryClient` usa `staleTime 5min`, `gcTime 30min`, `refetchOnWindowFocus false`, `mutations.retry 0` y reintenta una query **solo** si el error no es 4xx (máx. 1 reintento).
- [x] `src/lib/queryClient.ts` exporta `STALE_TIME` con los tiers `catalog` (30 min), `list` (5 min), `live` (0).
- [x] Cuando el usuario entra a `/academico/aprendizajes`, `/academico/conceptos` o `/academico/lista-chequeo` por segunda vez dentro de 5 min, el sistema muestra la lista sin request HTTP a `/learnings`, `/concepts` o `/checklist-templates` y sin spinner.
- [x] Cuando el usuario vuelve a esas secciones con datos stale (> 5 min), el sistema pinta la caché al instante y revalida en segundo plano sin mostrar el spinner de carga inicial.
- [x] Si la lista no está en caché, el sistema muestra el spinner de `DataTable` hasta la primera respuesta (`isPending`).
- [x] Cuando una creación/edición/eliminación de aprendizaje, concepto o plantilla termina OK, el sistema invalida la key raíz del recurso y la lista refleja el cambio sin recargar la página.
- [x] Cuando una mutación de aprendizaje o concepto termina OK, el sistema invalida además `['dashboard']` (sus agregados dependen de ambos).
- [x] Si una mutación falla, el sistema muestra el mensaje de `extractErrorMessage` en el toast (mismos textos que hoy) y la caché no cambia.
- [x] Si la creación de plantilla responde `409`, el toast muestra "Máximo 2 plantillas por período alcanzado." (comportamiento actual preservado).
- [x] Cuando el usuario cierra sesión (manual o por `401` del interceptor), el sistema vacía toda la caché de React Query antes de limpiar la sesión.
- [x] Cuando `login()` o `activateAccount()` fijan una sesión nueva, el sistema vacía la caché de React Query antes de guardar `token`/`sessionData`.
- [x] No existen `useLearningStore.ts`, `useConceptStore.ts`, `useChecklistTemplateStore.ts` ni sus `types/store.ts`; ningún componente de esos features llama `apiGet/apiPost/apiPatch/apiDelete` fuera de `queries/`.
- [x] `quartz-web/CLAUDE.md` § "Estado" establece: dato de servidor → siempre React Query; Zustand solo sesión (`useAuthStore`) y UI; tiers `STALE_TIME`; factory de keys; purga en sesión.
- [x] **Aislamiento:** sin cambios de backend; `institutionId` sigue saliendo del token; la caché cliente nunca sobrevive a un cambio de sesión.
- [x] `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- **Base de rama:** `feat/USR-04-user-invitation` (incluye INF-04, USR-03 y USR-04, aún no mergeados en `develop`). El PR a `develop` se abre tras mergear USR-04, o su diff arrastrará esos commits.
- Bloquea a INF-06, INF-07 e INF-08.

## Trazabilidad
- Frontend: `quartz-web/src/lib/queryClient.ts`, `quartz-web/src/features/{learning,concept,checklist-template,auth}/`
- Branch:   `feat/INF-05-server-state-foundation`
