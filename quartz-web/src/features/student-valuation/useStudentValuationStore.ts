import { create } from 'zustand';
import { apiGet, apiPatch, apiPost, apiDelete, extractErrorMessage } from '../../api/apiClient';
import type {
  StudentValuationState,
  GetUsersQuery,
  UserDto,
  StudentValuationUpdateData,
  IStudentValuationDTO,
} from './types';

export const ITEMS_PER_PAGE = 10;

export const useStudentValuationStore = create<StudentValuationState>((set, get) => ({
  users: [],
  currentValuation: null,
  isLoading: false,
  error: null,

  fetchUsers: async (query: GetUsersQuery) => {
    set({ isLoading: true, error: null });

    const finalQuery = { ...query };

    try {
      const data = await apiGet<UserDto[]>('/users', { params: finalQuery });
      set({ users: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la carga de usuarios.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchValuation: async (studentId: string, periodId: string) => {
    set({ isLoading: true, error: null, currentValuation: null });
    try {
      const url = `/student-valuations/student/${studentId}/period/${periodId}`;
      const data = await apiPost<IStudentValuationDTO>(url, {});
      set({ currentValuation: data, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Error al cargar la valoración.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearValuation: () => {
    set({ currentValuation: null, error: null });
  },

  updateValuation: async (valuationId: string, payload: StudentValuationUpdateData) => {
    set({ error: null });
    try {
      const data = await apiPatch<IStudentValuationDTO, StudentValuationUpdateData>(`/student-valuations/${valuationId}`, payload);
      const current = get().currentValuation;
      if (current && current._id === valuationId) {
        set({ currentValuation: data });
      }
      return data;
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Falló la actualización.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteValuation: async (valuationId: string, userId: string) => {
    try {
      await apiDelete<void>(`/student-valuations/${valuationId}`);
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId
            ? { ...user, valuations: user.valuations.filter((v) => v._id !== valuationId) }
            : user
        ),
      }));
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Error al eliminar la Lista de Chequeo.');
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
}));
