# INF-08 — Tasks

## Frontend (`quartz-web`)
### Selectores (sin cambio de comportamiento)
- [ ] `LoginPage`, `ChecklistsPage`, `DashboardFilters`, `ConsolidatedReportsPanel`, `StudentValuationDetail` — `useAuthStore(selector)` / `useShallow`
- [ ] `grep -rn "useAuthStore()" src` → 0 resultados (tras completar también el bloque de filtros)

### Filtros de tablas
- [ ] `src/stores/useTableFiltersStore.ts` — tipos, store sin `persist`, acciones inmutables, `EMPTY_FILTERS`/`EMPTY_LIST`, hook `useTableFilters`
- [ ] `useAuthStore.logout` — añadir `resetAll()` (nada más cambia en el store)
- [ ] `LearningsPage.tsx` — selector de sesión + `useTableFilters('learnings')` + default de periodo vía `initDefaults`
- [ ] `ConceptsPage.tsx` — selector de sesión + `useTableFilters('concepts')` + default de periodo
- [ ] `UsersPage.tsx` — selector de sesión + `'users-students'`/`'users-staff'`; quitar `useEffect` de reset de página
- [ ] `StudentValuationsPage.tsx` — selector de sesión + `useTableFilters('valuations')` + default de sede
- [ ] `ReportsPage.tsx` + `IndividualReportsPanel.tsx` — selector de sesión + `useTableFilters('reports')`; quitar `useEffect` de reset
- [ ] Página efectiva `Math.min(page, totalPages)` en cada tabla

### Documentación
- [ ] `quartz-web/CLAUDE.md` — `stores/` en transversales; regla de selectores; ejemplo de rol corregido

## Verificación final
- [ ] `npm run build && npm run lint` en verde
- [ ] `npm run dev` sin errores de compilación ni runtime
- [ ] Sesión persistida previa (`quartz-session`) se lee sin re-login
- [ ] Repaso de aislamiento: filtros fuera de storage y reiniciados en `logout`

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
