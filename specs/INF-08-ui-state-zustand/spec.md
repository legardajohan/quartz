---
id: INF-08-ui-state-zustand
feature: ui-state-zustand
status: draft
created: 2026-09-28
---

# INF-08 — Zustand acotado a sesión + UI: mejorar sin romper (spec)

## Objetivo
Dejar Zustand solo para lo que ya hace bien (sesión) y lo que falta (filtros de tablas que sobrevivan a la navegación), además de corregir su uso en componentes (selectores). Sin cambiar el comportamiento de lo que hoy funciona.

## Contexto
- Tras INF-05/06/07/09, Zustand ya no guarda datos de servidor: INF-09 redujo `useAuthStore.sessionData` a identidad (`user`) y movió los catálogos (periods, subjects, settings de institución) a React Query, sembrados desde la sesión.
- **Lo que está bien y no se toca:** el contrato de `useAuthStore` **tal como lo deja INF-09** (`persist` con `name: 'quartz-session'`, `partialize` de `token` + `sessionData` reducido, `showWelcomeLoader`, `refreshSession` silencioso + siembra de catálogos; sin setters de catálogo); modales y borradores en `useState` local; alertas con `react-hot-toast`; caché del escudo en `shieldCache.ts`.
- **Lo que se puede mejorar:**
  - `useAuthStore()` sin selector re-renderiza el componente ante cualquier cambio del store (`isLoading`, `error`, `showWelcomeLoader`). Al redactar este spec eran 10 archivos; INF-09 migró 8 a hooks de catálogo y `usePermissions`. **Verificado tras INF-09** (`grep -rn "useAuthStore()" src`), quedan 2:
    - `features/auth/pages/LoginPage.tsx`: `const { login, isLoading, error, token } = useAuthStore();` → 4 claves, `useShallow`.
    - `features/report/components/ConsolidatedReportsPanel.tsx`: `const { sessionData } = useAuthStore();` y solo lee `user.role` y `user.schoolId` → `usePermissions()` (`isTeacher`, `schoolId`), que ya usa selectores atómicos.
  - `quartz-web/CLAUDE.md` recomienda el patrón sin selector (`useAuthStore().sessionData?.user.role`).
  - Búsqueda, filtros y página de las tablas viven en `useState` y se pierden al navegar. Los defaults (periodo activo, sede propia del Jefe de Área) se re-aplican con `useRef` en cada montaje y pisan la elección del usuario.

## Alcance
**Incluye:**
- Selectores atómicos en `LoginPage` (`useShallow`) y `ConsolidatedReportsPanel` (`usePermissions()`): los únicos consumidores de `useAuthStore()` sin selector tras INF-09 (mismo dato y mismo comportamiento, menos renders).
- Store transversal `src/stores/useTableFiltersStore.ts` (en memoria, sin `persist`) para búsqueda, filtros y página de: `LearningsPage`, `ConceptsPage`, `UsersPage` (por pestaña), `StudentValuationsPage`, `ReportsPage`/`IndividualReportsPanel`.
- `logout()` reinicia los filtros (una línea, sin tocar el resto de su lógica).
- `quartz-web/CLAUDE.md`: regla de selectores y cuándo va algo en `src/stores/` frente a `useState`.

**Fuera (se conserva tal cual):**
- Estructura, `persist`, `partialize`, clave de storage y acciones de `useAuthStore` tal como quedan tras INF-09 (la reducción de `sessionData` y la siembra de catálogos son de INF-09, no de este spec).
- Modales, formularios y borradores → `useState` local.
- Alertas → `react-hot-toast`. Tema: no existe en la app.
- Filtros del dashboard (`DashboardFilters`): son parámetros de su query de servidor.
- Filtros en la URL y persistencia de filtros en `localStorage`/`sessionStorage`.

## Criterios de aceptación (EARS)
- [ ] Ningún componente llama `useAuthStore()` sin selector; cada consumidor lee solo lo que usa (`useAuthStore((s) => s.sessionData)`, o `useShallow` si toma varias claves).
- [ ] Cuando cambia `isLoading`/`error` de `useAuthStore` (p. ej. durante el login), `ConsolidatedReportsPanel` no re-renderiza; `LoginPage` solo re-renderiza por las claves que usa (`login`, `isLoading`, `error`, `token`).
- [ ] `useAuthStore` conserva exactamente el estado, las acciones, el `persist` (`quartz-session`) y el `partialize` que dejó INF-09 (solo se añade `resetAll()` de filtros en `logout`); una sesión guardada antes de este cambio se sigue leyendo sin re-login.
- [ ] Cuando el usuario cambia búsqueda, filtros o página de una tabla, navega a otra sección y vuelve, el sistema restaura esos valores.
- [ ] Cuando una tabla se visita por primera vez en la sesión, el sistema aplica su default una sola vez (periodo activo en aprendizajes/conceptos; sede propia del Jefe de Área en evaluación/informes); si el usuario lo quita, no se re-aplica al volver.
- [ ] Cuando cambia la búsqueda o un filtro, el sistema vuelve la página de esa tabla a 1 (comportamiento actual).
- [ ] En `UsersPage`, cada pestaña (Estudiantes / Equipo docente) conserva sus propios filtros.
- [ ] Cuando el usuario recarga (F5) o cierra sesión, los filtros vuelven a sus defaults.
- [ ] Los modales, formularios, borradores y toasts se comportan igual que antes de este spec.
- [ ] `useTableFiltersStore` no contiene datos de servidor ni importa `apiClient` ni nada de `features/`.
- [ ] **Aislamiento:** los filtros (que pueden llevar `_id` de sedes/periodos del inquilino) no se escriben en storage y se reinician en `logout()`.
- [ ] `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- **Base de rama:** `feat/INF-09-session-identity-only` (cadena `INF-05 → INF-06 → INF-07 → INF-09 → INF-08`, cada una desde la anterior, sin pasar por `develop`). El PR a `develop` se abre cuando sus predecesoras estén mergeadas, o su diff las arrastrará.
- INF-05-server-state-foundation, INF-06-config-catalogs-query, INF-07-valuation-report-query.
- **INF-09-session-identity-only (dependencia dura, ya implementada):** este spec asume `sessionData` reducido a identidad y sin setters de catálogo. Si la rama base no lo incluye, no se empieza INF-08.

## Trazabilidad
- Frontend: `quartz-web/src/stores/`, `quartz-web/src/features/{auth,learning,concept,users,student-valuation,report}/`
- Branch:   `feat/INF-08-ui-state-zustand`
