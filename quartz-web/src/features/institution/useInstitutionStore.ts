import { create } from 'zustand';
import { apiGet, apiPatch, extractErrorMessage } from '../../api/apiClient';
import { useAuthStore } from '../auth/useAuthStore';
import type {
  InstitutionState,
  InstitutionDto,
  UpdateInstitutionSettings
} from './types';

export const useInstitutionStore = create<InstitutionState>((set) => ({
  institution: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchInstitution: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<InstitutionDto>('/institutions/me');
      set({ institution: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de la configuración institucional.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateSettings: async (data: UpdateInstitutionSettings) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<InstitutionDto, { settings: UpdateInstitutionSettings }>(
        '/institutions/me',
        { settings: data }
      );
      useAuthStore.getState().setEnabledReports(updated.settings.enabledReports);
      set({ institution: updated, isSubmitting: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización de la configuración.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },
}));
