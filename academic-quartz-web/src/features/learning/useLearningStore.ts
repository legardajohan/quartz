import { create } from 'zustand';
import { apiGet } from '../../api/apiClient';
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch learnings';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
    }
  },
}));
