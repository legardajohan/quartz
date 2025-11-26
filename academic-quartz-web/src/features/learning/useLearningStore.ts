import { create } from 'zustand';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../api/apiClient';
import type { 
  LearningState, 
  LearningsResponse, 
  Learning, 
  NewLearning,
  UpdateLearning 
} from './types';

export const useLearningStore = create<LearningState>((set) => ({
  // Initial state
  learnings: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetch learnings action
  fetchLearnings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<LearningsResponse>('/learnings');
      set({ learnings: data, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la carga de aprendizajes.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
    }
  },

  // Create learning action
  createLearning: async (learningData: NewLearning) => {
    set({ isSubmitting: true });
    try {
      const newLearning = await apiPost<Learning>('/learnings', learningData);
      set((state) => ({
        learnings: [...state.learnings, newLearning],
        isSubmitting: false,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la creación del aprendizaje.';
      console.error(errorMessage);
      set({ isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  // Update learning action
  updateLearning: async (id: string, learningData: UpdateLearning) => {
    set({ isSubmitting: true });
    try {
      const updateLearning = await apiPatch<Learning>(`/learnings/${id}`, learningData);
      set((state) => ({
        learnings: state.learnings.map((learning) => 
          learning._id === id ? updateLearning : learning
        ),
        isSubmitting: false,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la actualización del aprendizaje';
      console.error(errorMessage);
      set({ isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  // Delete learning action
  deleteLearning: async (id: string) => {
    try {
      await apiDelete(`/learnings/${id}`);
      set((state) => ({
        learnings: state.learnings.filter((learning) => learning._id !== id),
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la eliminación del aprendizaje.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
}));
