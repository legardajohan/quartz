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
- Tras INF-05/06/07, el único store Zustand con datos de servidor es `useAuthStore.sessionData`, y es correcto: es sesión, se persiste y se revalida con `refreshSession()` en `AppRoot`.
- **Lo que está bien y no se toca:** el contrato de `useAuthStore` (`persist` con `name: 'quartz-session'`, `partialize` de `token` + `sessionData`, `showWelcomeLoader`, `refreshSession` silencioso, setters `setSubjects`/`setPeriods`/`setEnabledReports`/`setShifts`); modales y borradores en `useState` local; alertas con `react-hot-toast`; caché del escudo en `shieldCache.ts`.
- **Lo que se puede mejorar:**
  - 10 archivos consumen `useAuthStore()` sin selector (`const { sessionData } = useAuthStore()`), lo que re-renderiza la página ante cualquier cambio del store (`isLoading`, `error`, `showWelcomeLoader`). Son `LoginPage`, `ChecklistsPage`, `ConceptsPage`, `DashboardFilters`, `LearningsPage`, `ConsolidatedReportsPanel`, `IndividualReportsPanel`, `StudentValuationDetail`, `StudentValuationsPage` y `UsersPage`. `quartz-web/CLAUDE.md` recomienda ese mismo patrón (`useAuthStore().sessionData?.user.role`).
  - Búsqueda, filtros y página de las tablas viven en `useState` y se pierden al navegar. Los defaults (periodo activo, sede propia del Jefe de Área) se re-aplican con `useRef` en cada montaje y pisan la elección del usuario.

## Alcance
**Incluye:**
- Selectores atómicos en los 10 consumidores de `useAuthStore()` (mismo dato y mismo comportamiento, menos renders).
- Store transversal `src/stores/useTableFiltersStore.ts` (en memoria, sin `persist`) para búsqueda, filtros y página de: `LearningsPage`, `ConceptsPage`, `UsersPage` (por pestaña), `StudentValuationsPage`, `ReportsPage`/`IndividualReportsPanel`.
- `logout()` reinicia los filtros (una línea, sin tocar el resto de su lógica).
- `quartz-web/CLAUDE.md`: regla de selectores y cuándo va algo en `src/stores/` frente a `useState`.

**Fuera (se conserva tal cual):**
- Estructura, `persist`, `partialize`, clave de storage y acciones de `useAuthStore`.
- Modales, formularios y borradores → `useState` local.
- Alertas → `react-hot-toast`. Tema: no existe en la app.
- Filtros del dashboard (`DashboardFilters`): son parámetros de su query de servidor.
- Filtros en la URL y persistencia de filtros en `localStorage`/`sessionStorage`.

## Criterios de aceptación (EARS)
- [ ] Ningún componente llama `useAuthStore()` sin selector; cada consumidor lee solo lo que usa (`useAuthStore((s) => s.sessionData)`, o `useShallow` si toma varias claves).
- [ ] Cuando cambia `isLoading`/`error` de `useAuthStore` (p. ej. durante el login), las páginas que solo leen `sessionData` no re-renderizan.
- [ ] `useAuthStore` conserva exactamente su estado, acciones, `persist` (`quartz-session`) y `partialize`; una sesión guardada antes de este cambio se sigue leyendo sin re-login.
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
- **Base de rama:** `feat/USR-04-user-invitation` (incluye INF-04, USR-03 y USR-04, aún no mergeados en `develop`). El PR a `develop` se abre tras mergear USR-04, o su diff arrastrará esos commits.
- INF-05-server-state-foundation. Idealmente tras INF-06 e INF-07 (mismas páginas; reduce conflictos de merge).

## Trazabilidad
- Frontend: `quartz-web/src/stores/`, `quartz-web/src/features/{auth,learning,concept,checklist-template,dashboard,users,student-valuation,report}/`
- Branch:   `feat/INF-08-ui-state-zustand`
