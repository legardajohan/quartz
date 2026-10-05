import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// Estado de UI compartido entre rutas: búsqueda, filtros y página de cada tabla sobreviven a la
// navegación. En memoria a propósito (sin `persist`): los filtros llevan `_id` del inquilino y F5 o
// `logout()` deben devolverlos a sus defaults.

export type TableId =
  | 'learnings'
  | 'concepts'
  | 'users-students'
  | 'users-staff'
  | 'valuations'
  | 'reports';

export interface TableFilters {
  search: string;
  /** Clave = `FilterGroup.id`. */
  selected: Record<string, string[]>;
  page: number;
  /** El default de la tabla ya se aplicó en esta sesión; no se vuelve a aplicar. */
  initialized: boolean;
}

interface TableFiltersState {
  tables: Partial<Record<TableId, TableFilters>>;
  setSearch: (id: TableId, search: string) => void;
  toggleFilter: (id: TableId, groupId: string, value: string) => void;
  setPage: (id: TableId, page: number) => void;
  initDefaults: (id: TableId, selected: Record<string, string[]>) => void;
  resetAll: () => void;
}

// Referencias estables: un selector que devuelve un objeto/array nuevo en cada llamada provoca
// re-renders infinitos en zustand@5.
const EMPTY_FILTERS: TableFilters = { search: '', selected: {}, page: 1, initialized: false };
const EMPTY_LIST: string[] = [];

const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

export const useTableFiltersStore = create<TableFiltersState>()((set) => {
  const updateTable = (id: TableId, update: (current: TableFilters) => Partial<TableFilters>) =>
    set((state) => {
      const current = state.tables[id] ?? EMPTY_FILTERS;
      return { tables: { ...state.tables, [id]: { ...current, ...update(current) } } };
    });

  return {
    tables: {},

    // Cambiar búsqueda o filtros vuelve a la página 1.
    setSearch: (id, search) => updateTable(id, () => ({ search, page: 1 })),

    toggleFilter: (id, groupId, value) =>
      updateTable(id, (current) => ({
        selected: {
          ...current.selected,
          [groupId]: toggleValue(current.selected[groupId] ?? EMPTY_LIST, value),
        },
        page: 1,
      })),

    setPage: (id, page) => updateTable(id, () => ({ page })),

    // Idempotente: si el usuario ya quitó el default, volver a la página no lo re-aplica.
    initDefaults: (id, selected) =>
      set((state) => {
        if (state.tables[id]?.initialized) return state;
        const current = state.tables[id] ?? EMPTY_FILTERS;
        return {
          tables: {
            ...state.tables,
            [id]: { ...current, selected: { ...current.selected, ...selected }, initialized: true },
          },
        };
      }),

    resetAll: () => set({ tables: {} }),
  };
});

export function useTableFilters(id: TableId) {
  const filters = useTableFiltersStore((s) => s.tables[id] ?? EMPTY_FILTERS);
  const { setSearch, toggleFilter, setPage, initDefaults } = useTableFiltersStore(
    useShallow((s) => ({
      setSearch: s.setSearch,
      toggleFilter: s.toggleFilter,
      setPage: s.setPage,
      initDefaults: s.initDefaults,
    }))
  );

  // Acciones atadas a `id`: conservan su referencia aunque cambien los filtros, así pueden ir en
  // deps de `useEffect` sin re-ejecutarlo.
  const actions = useMemo(
    () => ({
      setSearch: (value: string) => setSearch(id, value),
      toggle: (groupId: string) => (value: string) => toggleFilter(id, groupId, value),
      setPage: (page: number) => setPage(id, page),
      initDefaults: (selected: Record<string, string[]>) => initDefaults(id, selected),
    }),
    [id, setSearch, toggleFilter, setPage, initDefaults]
  );

  return {
    search: filters.search,
    page: filters.page,
    selectedOf: (groupId: string): string[] => filters.selected[groupId] ?? EMPTY_LIST,
    ...actions,
  };
}
