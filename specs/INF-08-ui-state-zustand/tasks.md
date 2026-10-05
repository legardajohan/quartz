# INF-08 — Tasks

## Frontend (`quartz-web`)
### Selectores (sin cambio de comportamiento)
- [ ] Verificar que la rama base incluye INF-09 (`sessionData` sin catálogos, sin `setSubjects`/`setPeriods`/`setEnabledReports`/`setShifts`); si no, detenerse
- [ ] Confirmar consumidores sin selector: `grep -rn "useAuthStore()" src` → solo `LoginPage` y `ConsolidatedReportsPanel`
- [ ] `LoginPage` — `useAuthStore(useShallow(...))` con `login`, `isLoading`, `error`, `token`
- [ ] `ConsolidatedReportsPanel` — `usePermissions()` (`isTeacher`, `schoolId`) en lugar de `useAuthStore()`
- [ ] `grep -rn "useAuthStore()" src` → 0 resultados

### Filtros de tablas
- [ ] `src/stores/useTableFiltersStore.ts` — tipos, store sin `persist`, acciones inmutables, `EMPTY_FILTERS`/`EMPTY_LIST`, hook `useTableFilters`
- [ ] `useAuthStore.logout` — añadir `resetAll()` (nada más cambia en el store)
- [ ] `LearningsPage.tsx` — `useTableFilters('learnings')` + default de periodo vía `initDefaults`
- [ ] `ConceptsPage.tsx` — `useTableFilters('concepts')` + default de periodo
- [ ] `UsersPage.tsx` — `'users-students'`/`'users-staff'`; quitar `useEffect` de reset de página
- [ ] `StudentValuationsPage.tsx` — `useTableFilters('valuations')` + default de sede
- [ ] `ReportsPage.tsx` + `IndividualReportsPanel.tsx` — `useTableFilters('reports')`; quitar `useEffect` de reset
- [ ] Página efectiva `Math.min(page, totalPages)` en cada tabla

### Documentación
- [ ] `quartz-web/CLAUDE.md` — `stores/` en transversales; regla de selectores; ejemplo de rol corregido; borrar el aviso "Transición" y corregir la fila de paridad de periodos/materias/colegios (decisión del usuario: la doc va en este spec, no en `/sdd-release`)

## Verificación final
- [ ] `npm run build && npm run lint` en verde
- [ ] `npm run dev` sin errores de compilación ni runtime
- [ ] Sesión persistida previa (`quartz-session`) se lee sin re-login
- [ ] Repaso de aislamiento: filtros fuera de storage y reiniciados en `logout`

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
