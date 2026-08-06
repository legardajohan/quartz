import { create } from 'zustand';
import { apiGet, apiPatch, extractErrorMessage } from '../../api/apiClient';
import { useAuthStore } from '../auth/useAuthStore';
import type {
  InstitutionState,
  InstitutionDto,
  InstitutionBrandingDto,
  UpdateInstitutionSettings
} from './types';

export const useInstitutionStore = create<InstitutionState>((set) => ({
  institution: null,
  branding: null,
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

  fetchBranding: async () => {
    try {
      const data = await apiGet<InstitutionBrandingDto>('/institutions/me/branding');
      set({ branding: data });
    } catch {
      // Silencioso: el sidebar cae al placeholder por defecto si no hay branding disponible.
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
      useAuthStore.getState().setShifts(updated.settings.multipleShifts, updated.settings.shifts);
      set({ institution: updated, isSubmitting: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización de la configuración.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  uploadShield: async (blob: Blob) => {
    set({ isSubmitting: true });
    try {
      const fd = new FormData();
      fd.append('image', blob, 'shield.webp');
      const updated = await apiPatch<InstitutionDto, FormData>('/institutions/me/shield', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({
        institution: updated,
        branding: { name: updated.name, shieldUrl: updated.shieldUrl },
        isSubmitting: false,
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la subida del escudo.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },
}));
