import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage } from '../../api/apiClient';
import type {
  SchoolState,
  SchoolsResponse,
  SchoolDto,
  NewSchool,
  UpdateSchool
} from './types';

export const useSchoolStore = create<SchoolState>((set) => ({
  schools: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchSchools: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<SchoolsResponse>('/schools');
      set({ schools: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de sedes.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createSchool: async (data: NewSchool) => {
    set({ isSubmitting: true });
    try {
      const newSchool = await apiPost<SchoolDto, NewSchool>('/schools', data);
      set((state) => ({ schools: [...state.schools, newSchool], isSubmitting: false }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la creación de la sede.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  updateSchool: async (id: string, data: UpdateSchool) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<SchoolDto, UpdateSchool>(`/schools/${id}`, data);
      set((state) => ({
        schools: state.schools.map((school) => (school._id === id ? updated : school)),
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización de la sede.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  deleteSchool: async (id: string) => {
    try {
      await apiDelete<void>(`/schools/${id}`);
      set((state) => ({ schools: state.schools.filter((school) => school._id !== id) }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la eliminación de la sede.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
