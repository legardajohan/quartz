import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage } from '../../api/apiClient';
import type {
  ConceptState,
  ConceptDto,
  NewConcept,
  UpdateConcept,
  GetConceptsQuery,
} from './types';

export const useConceptStore = create<ConceptState>((set) => ({
  concepts: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchConcepts: async (query?: GetConceptsQuery) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<ConceptDto[]>('/concepts', { params: query });
      set({ concepts: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de conceptos.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createConcept: async (data: NewConcept) => {
    set({ isSubmitting: true });
    try {
      const newConcept = await apiPost<ConceptDto, NewConcept>('/concepts', data);
      set((state) => ({
        concepts: [...state.concepts, newConcept],
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la creación del concepto.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  updateConcept: async (id: string, data: UpdateConcept) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<ConceptDto, UpdateConcept>(`/concepts/${id}`, data);
      set((state) => ({
        concepts: state.concepts.map((concept) => (concept._id === id ? updated : concept)),
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización del concepto.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  deleteConcept: async (id: string) => {
    try {
      await apiDelete<void>(`/concepts/${id}`);
      set((state) => ({
        concepts: state.concepts.filter((concept) => concept._id !== id),
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la eliminación del concepto.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
