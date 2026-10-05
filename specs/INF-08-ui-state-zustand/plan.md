# INF-08 — Plan técnico

## Principio
Cambios aditivos o de solo lectura sobre lo que deja INF-09: ningún store cambia su forma pública salvo añadir `resetAll()` al `logout`. La reducción de `sessionData` y la eliminación de los setters de catálogo son de INF-09; si aparece algo más del contrato de `useAuthStore` por cambiar, se anota como deuda y no entra aquí.

## Archivos
### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/stores/useTableFiltersStore.ts` |
| tocar | `src/features/auth/useAuthStore.ts` (solo `logout`: `+ resetAll()`) |
| tocar (selectores) | `features/auth/pages/LoginPage.tsx`, `features/report/components/ConsolidatedReportsPanel.tsx` |
| tocar (filtros) | `features/learning/pages/LearningsPage.tsx`, `features/concept/pages/ConceptsPage.tsx`, `features/users/pages/UsersPage.tsx`, `features/student-valuation/pages/StudentValuationsPage.tsx`, `features/report/pages/ReportsPage.tsx`, `features/report/components/IndividualReportsPanel.tsx` |
| tocar | `quartz-web/CLAUDE.md` (transversales + § "Estado") |

> Selectores: el resto de los 10 consumidores originales los migró INF-09 a hooks de catálogo y `usePermissions`. Verificar al empezar con `grep -rn "useAuthStore()" src` (esperado: solo esos 2 archivos).

## Contratos

### 1. Selectores en `useAuthStore` (sin cambio de comportamiento)
| Antes | Después |
|---|---|
| `LoginPage`: `const { login, isLoading, error, token } = useAuthStore();` | `useAuthStore(useShallow((s) => ({ login: s.login, isLoading: s.isLoading, error: s.error, token: s.token })))` |
| `ConsolidatedReportsPanel`: `const { sessionData } = useAuthStore();` (solo lee `user.role` y `user.schoolId`) | `const { isTeacher, schoolId } = usePermissions();` y reemplazar `sessionData?.user.role === "Docente"` por `isTeacher` y `sessionData?.user.schoolId` por `schoolId` |
- Si la página solo usa un campo derivado, seleccionar ese campo (`(s) => s.sessionData?.user.role`), cuidando devolver referencias estables (no `?? []` dentro del selector: el fallback va fuera).
- `useShallow` desde `zustand/react/shallow` (zustand@5).

### 2. `src/stores/useTableFiltersStore.ts`
```ts
export type TableId =
  | 'learnings' | 'concepts'
  | 'users-students' | 'users-staff'
  | 'valuations' | 'reports';

export interface TableFilters {
  search: string;
  selected: Record<string, string[]>; // clave = FilterGroup.id
  page: number;
  initialized: boolean;               // default ya aplicado en esta sesión
}

interface TableFiltersState {
  tables: Partial<Record<TableId, TableFilters>>;
  setSearch: (id: TableId, search: string) => void;                     // + page = 1
  toggleFilter: (id: TableId, groupId: string, value: string) => void;  // + page = 1
  setPage: (id: TableId, page: number) => void;
  initDefaults: (id: TableId, selected: Record<string, string[]>) => void; // no-op si initialized
  resetAll: () => void;
}
```
- `create<TableFiltersState>()` sin `persist`; actualizaciones inmutables.
- `EMPTY_FILTERS` y `EMPTY_LIST` constantes de módulo → selectores con referencia estable.

### 3. Hook
```ts
export function useTableFilters(id: TableId) {
  const filters = useTableFiltersStore((s) => s.tables[id] ?? EMPTY_FILTERS);
  const { setSearch, toggleFilter, setPage, initDefaults } = useTableFiltersStore(
    useShallow((s) => ({ setSearch: s.setSearch, toggleFilter: s.toggleFilter, setPage: s.setPage, initDefaults: s.initDefaults }))
  );
  return {
    search: filters.search,
    page: filters.page,
    selectedOf: (groupId: string) => filters.selected[groupId] ?? EMPTY_LIST,
    setSearch: (value: string) => setSearch(id, value),
    toggle: (groupId: string) => (value: string) => toggleFilter(id, groupId, value),
    setPage: (page: number) => setPage(id, page),
    initDefaults: (selected: Record<string, string[]>) => initDefaults(id, selected),
  };
}
```

### 4. Uso en página (patrón)
```tsx
const table = useTableFilters('learnings');

useEffect(() => {
  if (activePeriod) table.initDefaults({ period: [activePeriod._id] }); // idempotente
}, [activePeriod]);

const filterGroups: FilterGroup[] = [
  { id: 'period', label: 'Periodo', options, selected: table.selectedOf('period'), onToggle: table.toggle('period') },
];

<SearchFilterBar search={table.search} onSearchChange={table.setSearch} filters={filterGroups} />
```
- Se sustituyen los `useState` de `search`/`selected*`/`currentPage` y los `useRef` `hasInitialized*`. Modales, formularios y `activeTab` siguen en `useState`.
- `UsersPage`: `useTableFilters(activeTab === 'students' ? 'users-students' : 'users-staff')`; se elimina el `useEffect` que reseteaba la página al cambiar de pestaña (cada pestaña tiene la suya).
- `ReportsPage` es dueña de `'reports'`; `IndividualReportsPanel` lee `page`/`setPage` del mismo `tableId`; se elimina su `useEffect` de reset (el store ya pone `page = 1` al filtrar).
- Página efectiva: `Math.min(table.page, totalPages)` para cuando la lista se reduce tras una invalidación.
- Los casts a `GradeLevel`/`ValuationState` se quedan en el `useMemo` de filtrado, como hoy.

### 5. `useAuthStore.logout`
- Añadir `useTableFiltersStore.getState().resetAll();` junto a `queryClient.clear()` (INF-05). Sin ciclo: `src/stores/` no importa `features/`.

### 6. `quartz-web/CLAUDE.md`
- Transversales: `stores/`, para estado UI compartido entre rutas (sin datos de servidor ni `apiClient`).
- § "Estado":
  - Consumir stores siempre con selector y `useShallow` para varias claves.
  - Reemplazar el ejemplo `useAuthStore().sessionData?.user.role` por `useAuthStore((s) => s.sessionData?.user.role)`.
  - Estado de un solo componente/página (modal, borrador) → `useState`.
  - Borrar el aviso "Transición" (línea 48: `period`, `subject`, `school`, `institution`, `student-valuation` y `report` ya no usan Zustand tras INF-06/07).
  - Mapa de paridad: fila "Periodos / Materias / Colegios" ya no es "consumidos vía `sessionData`"; ahora tienen `queries/` propias (`period`, `subject`, `school`) y `sessionData` solo guarda identidad (INF-09).
- **Decisión del usuario:** la documentación entra en este spec, como excepción a la regla de `/sdd-implement` de dejarla para `/sdd-release`.

## Notas
- Un solo store con `Record<TableId, …>`: todas las tablas comparten la forma de `FilterGroup`, y el reset en `logout` queda en una línea.
- Modales en Zustand descartado: su vida es la de la página y globalizarlos añade estado que hay que limpiar sin ningún beneficio.
- Los selectores son la mejora de Zustand con mejor relación riesgo/beneficio: mismo dato, menos renders, y el diff es mecánico.

## Ajustes durante la implementación
- **Hook:** las acciones se memorizan por `id` (`useMemo`) y se separan de los datos, para que `initDefaults` sea estable en las deps de `useEffect` (exhaustive-deps) sin re-ejecutar el efecto en cada cambio de filtro.
- **Default sin periodo activo:** se llama `initDefaults({})` en cuanto llegan los periodos (o las sedes), aunque no haya default que aplicar. Replica el `useRef` anterior: la tabla queda inicializada y un periodo activo que aparezca después no pisa la elección del usuario.
- **Página efectiva** en Aprendizajes/Conceptos: `Math.max(1, Math.min(page, totalPages))`, porque ahí `totalPages` puede ser 0 con la lista vacía.
- **`ConsolidatedReportsPanel`:** `schoolId` de `usePermissions()` se renombra a `ownSchoolId` porque el panel ya tiene un `useState` `schoolId` (la sede elegida).
- **`StudentValuationsPage`:** antes, los filtros de grado/estado/sede no volvían a la página 1 (solo la búsqueda); ahora sí, por el store. Es lo que pide el criterio EARS.

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual (usuario):
  - Login/logout y F5 con sesión guardada funcionan igual que antes.
  - En Aprendizajes, filtrar + buscar + página 2 → ir a Usuarios → volver: mismos valores.
  - Quitar el periodo activo → salir y volver: no reaparece.
  - F5 o logout → defaults.
  - Abrir y cerrar modales y crear/editar: sin cambios de comportamiento.
