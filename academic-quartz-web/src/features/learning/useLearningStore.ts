import { create } from 'zustand';
import { apiGet, apiDelete } from '../../api/apiClient';
import type { LearningState, LearningsResponse } from './types';

export const useLearningStore = create<LearningState>((set) => ({
  // Initial state
  learnings: [],
  isLoading: false,
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
