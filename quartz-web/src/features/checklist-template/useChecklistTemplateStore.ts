import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage, isAxiosError } from '../../api/apiClient';
import type {
  ChecklistTemplateState,
  ChecklistTemplateDto,
  NewChecklistTemplate,
  UpdateChecklistTemplate,
} from './types';

export const useChecklistTemplateStore = create<ChecklistTemplateState>((set) => ({
  templates: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<ChecklistTemplateDto[]>('/checklist-templates');
      set({ templates: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de plantillas.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createTemplate: async (data: NewChecklistTemplate) => {
    set({ isSubmitting: true });
    try {
      const newTemplate = await apiPost<ChecklistTemplateDto, NewChecklistTemplate>(
        '/checklist-templates',
        data
      );
      set((state) => ({
        templates: [...state.templates, newTemplate],
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage =
        isAxiosError(err) && err.response?.status === 409
          ? extractErrorMessage(err, 'Máximo 2 plantillas por período alcanzado.')
          : extractErrorMessage(err, 'Falló la creación de la plantilla.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  updateTemplate: async (id: string, data: UpdateChecklistTemplate) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<ChecklistTemplateDto, UpdateChecklistTemplate>(
        `/checklist-templates/${id}`,
        data
      );
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? updated : t)),
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización de la plantilla.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      await apiDelete<void>(`/checklist-templates/${id}`);
      set((state) => ({
        templates: state.templates.filter((t) => t._id !== id),
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la eliminación de la plantilla.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
