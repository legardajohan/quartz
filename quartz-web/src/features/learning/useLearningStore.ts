import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage } from '../../api/apiClient';
import type {
  LearningState,
  LearningsResponse,
  Learning,
  NewLearning,
  UpdateLearning
} from './types';

export const useLearningStore = create<LearningState>((set) => ({
  learnings: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchLearnings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<LearningsResponse>('/learnings');
      set({ learnings: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de aprendizajes.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createLearning: async (learningData: NewLearning) => {
    set({ isSubmitting: true });
    try {
      const newLearning = await apiPost<Learning, NewLearning>('/learnings', learningData);
      set((state) => ({
        learnings: [...state.learnings, newLearning],
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la creación del aprendizaje.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  updateLearning: async (id: string, learningData: UpdateLearning) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiPatch<Learning, UpdateLearning>(`/learnings/${id}`, learningData);
      set((state) => ({
        learnings: state.learnings.map((learning) =>
          learning._id === id ? updated : learning
        ),
        isSubmitting: false,
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización del aprendizaje.');
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  deleteLearning: async (id: string) => {
    try {
      await apiDelete<void>(`/learnings/${id}`);
      set((state) => ({
        learnings: state.learnings.filter((learning) => learning._id !== id),
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la eliminación del aprendizaje.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
