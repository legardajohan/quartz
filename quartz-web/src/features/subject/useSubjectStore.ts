import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage } from '../../api/apiClient';
import { useAuthStore } from '../auth/useAuthStore';
import type {
  SubjectState,
  SubjectsResponse,
  SubjectDto,
  NewSubject,
  UpdateSubject
} from './types';

export const useSubjectStore = create<SubjectState>((set) => ({
  subjects: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchSubjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<SubjectsResponse>('/subjects');
      set({ subjects: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de dimensiones.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createSubject: async (data: NewSubject) => {
    set({ isSubmitting: true });
    try {
      const newSubject = await apiPost<SubjectDto, NewSubject>('/subjects', data);
      set((state) => {
        const subjects = [...state.subjects, newSubject];
        useAuthStore.getState().setSubjects(subjects);
        return { subjects, isSubmitting: false };
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la creación de la dimensión.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  updateSubject: async (id: string, data: UpdateSubject) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<SubjectDto, UpdateSubject>(`/subjects/${id}`, data);
      set((state) => {
        const subjects = state.subjects.map((subject) =>
          subject._id === id ? updated : subject
        );
        useAuthStore.getState().setSubjects(subjects);
        return { subjects, isSubmitting: false };
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización de la dimensión.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  deleteSubject: async (id: string) => {
    try {
      await apiDelete<void>(`/subjects/${id}`);
      set((state) => {
        const subjects = state.subjects.filter((subject) => subject._id !== id);
        useAuthStore.getState().setSubjects(subjects);
        return { subjects };
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la eliminación de la dimensión.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
