import { create } from 'zustand';
import { apiGet } from '../../api/apiClient';
import type {
  StudentValuationState,
  GetUsersResponse,
  GetUsersQuery,
} from './types';
import { useAuthStore } from '../auth/useAuthStore';

export const useStudentValuationStore = create<StudentValuationState>((set) => ({
  // Initial state
  users: [],
  isLoading: false,
  error: null,

  // Fetch users action
  fetchUsers: async (query: GetUsersQuery) => {
    set({ isLoading: true, error: null });

    // Si no se provee un schoolId, usamos el de la sesión actual
    const finalQuery = { ...query };
    if (!finalQuery.schoolId) {
      const sessionSchoolId = useAuthStore.getState().sessionData?.user.schoolId;
      if (sessionSchoolId) {
        finalQuery.schoolId = sessionSchoolId;
      }
    }

    try {
      // El objeto `finalQuery` (ej: { role: 'Estudiante', schoolId: '...' })
      // es convertido a query params por nuestro apiClient
      const data = await apiGet<GetUsersResponse>('/users', { params: finalQuery });
      set({ users: data, isLoading: false });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Falló la carga de usuarios.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
      throw new Error(errorMessage);
    }
  },
}));