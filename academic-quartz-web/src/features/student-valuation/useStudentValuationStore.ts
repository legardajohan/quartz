import { create } from 'zustand';
import { apiGet, apiPatch } from '../../api/apiClient';
import type {
  StudentValuationState,
  GetUsersQuery,
  UserDto,
  StudentValuationUpdateData,
  IStudentValuationDTO,
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
      const data = await apiGet<UserDto[]>('/users', { params: finalQuery });
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
  // Initialize or fetch a student valuation for a given student and active period
  updateValuation: async (valuationId: string, payload: StudentValuationUpdateData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Datos de valoración enviados a la API:', JSON.stringify(payload, null, 2));
      const data = await apiPatch<IStudentValuationDTO, StudentValuationUpdateData>(`/student-valuations/${valuationId}`, payload);
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la actualización.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
      throw new Error(errorMessage);
    }
  },
}));