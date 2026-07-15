import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage } from '../../api/apiClient';
import { useAuthStore } from '../auth/useAuthStore';
import type {
  PeriodState,
  PeriodsResponse,
  PeriodDto,
  NewPeriod,
  UpdatePeriod
} from './types';

function syncSessionPeriods(periods: PeriodDto[]) {
  useAuthStore.getState().setPeriods(
    periods.map((p) => ({ _id: p._id, name: p.name, isActive: p.isActive }))
  );
}

export const usePeriodStore = create<PeriodState>((set) => ({
  periods: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchPeriods: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<PeriodsResponse>('/periods');
      set({ periods: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de periodos.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createPeriod: async (data: NewPeriod) => {
    set({ isSubmitting: true });
    try {
      const newPeriod = await apiPost<PeriodDto, NewPeriod>('/periods', data);
      set((state) => {
        const periods = [...state.periods, newPeriod];
        syncSessionPeriods(periods);
        return { periods, isSubmitting: false };
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la creación del periodo.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  updatePeriod: async (id: string, data: UpdatePeriod) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<PeriodDto, UpdatePeriod>(`/periods/${id}`, data);
      set((state) => {
        const periods = state.periods.map((period) =>
          period._id === id ? updated : period
        );
        syncSessionPeriods(periods);
        return { periods, isSubmitting: false };
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización del periodo.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  deletePeriod: async (id: string) => {
    try {
      await apiDelete<void>(`/periods/${id}`);
      set((state) => {
        const periods = state.periods.filter((period) => period._id !== id);
        syncSessionPeriods(periods);
        return { periods };
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la eliminación del periodo.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
