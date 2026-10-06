import { create } from 'zustand';
import type { DashboardFilterValues } from '@/features/dashboard/components/DashboardFilters';

// Filtros del Dashboard: sobreviven a la navegación entre rutas. En memoria a propósito (sin
// `persist`): llevan `_id` del inquilino, y F5 o `logout()` deben devolverlos a sus defaults.
// Valores únicos, no multi-selección: por eso no reutiliza `useTableFiltersStore`.

const DEFAULT_FILTERS: DashboardFilterValues = {
  periodId: '',
  schoolId: '',
  shiftId: '',
  grade: '',
};

interface DashboardFiltersState {
  filters: DashboardFilterValues;
  /** El periodo activo ya se aplicó como default en esta sesión; no se vuelve a aplicar. */
  initialized: boolean;
  setFilters: (values: DashboardFilterValues) => void;
  initDefaults: (periodId: string) => void;
  reset: () => void;
}

export const useDashboardFiltersStore = create<DashboardFiltersState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  initialized: false,
  setFilters: (values) => set({ filters: values, initialized: true }),
  initDefaults: (periodId) => {
    if (get().initialized) return;
    set((state) => ({ filters: { ...state.filters, periodId }, initialized: true }));
  },
  reset: () => set({ filters: DEFAULT_FILTERS, initialized: false }),
}));
