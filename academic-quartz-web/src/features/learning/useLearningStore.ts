import { create } from 'zustand';
import { apiGet, apiDelete, apiPost } from '../../api/apiClient';
import type { 
  LearningState, 
  LearningsResponse, 
  Subject, 
  Period, 
  Learning, 
  NewLearning 
} from './types';

export const useLearningStore = create<LearningState>((set, get) => ({
  // Initial state
  learnings: [],
  subjects: [],
  periods: [],
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

  // Fetch subjects action
  fetchSubjects: async () => {
    if (get().subjects.length > 0) return; // Avoid re-fetching
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<Subject[]>('/subjects');
      set({ subjects: data, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la carga de asignaturas.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
    }
  },

  // Fetch periods action
  fetchPeriods: async () => {
    if (get().periods.length > 0) return; // Avoid re-fetching
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<Period[]>('/periods');
      set({ periods: data, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la carga de períodos.';
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
