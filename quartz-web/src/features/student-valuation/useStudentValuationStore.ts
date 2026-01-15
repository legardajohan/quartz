import { create } from 'zustand';
import { apiGet, apiPatch, apiPost, apiDelete } from '../../api/apiClient';
import type {
  StudentValuationState,
  GetUsersQuery,
  UserDto,
  StudentValuationUpdateData,
  IStudentValuationDTO,
} from './types';
import { useAuthStore } from '../auth/useAuthStore';

export const ITEMS_PER_PAGE = 10;

export const useStudentValuationStore = create<StudentValuationState>((set, get) => ({
  // Initial state
  users: [],
  currentValuation: null,
  isLoading: false,
  error: null,
  currentPage: 1,

  // Fetch users action
  fetchUsers: async (query: GetUsersQuery) => {
    set({ isLoading: true, error: null, currentPage: 1 }); // Reset page on new fetch

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

  fetchValuation: async (studentId: string, periodId: string) => {
    set({ isLoading: true, error: null, currentValuation: null });
    try {
      const url = `/student-valuations/student/${studentId}/period/${periodId}`;
      const data = await apiPost<IStudentValuationDTO>(url, {});
      set({ currentValuation: data, isLoading: false });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Error al cargar la valoración.";
      set({ error: errorMessage, isLoading: false });
      console.error(err);
      // throw new Error(errorMessage); // Opcional, dependiendo de si queremos que el componente maneje el error
    }
  },

  clearValuation: () => {
    set({ currentValuation: null, error: null });
  },

  // Initialize or fetch a student valuation for a given student and active period
  updateValuation: async (valuationId: string, payload: StudentValuationUpdateData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Datos de valoración enviados a la API:', JSON.stringify(payload, null, 2));
      const data = await apiPatch<IStudentValuationDTO, StudentValuationUpdateData>(`/student-valuations/${valuationId}`, payload);
      // Actualizar currentValuation si es la misma
      const current = get().currentValuation;
      if (current && current._id === valuationId) {
        set({ currentValuation: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falló la actualización.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
      throw new Error(errorMessage);
    }
  },

  deleteValuation: async (valuationId: string) => {
    try {
      await apiDelete(`/student-valuations/${valuationId}`);
      set((state) => ({
        users: state.users.filter((user) => user._id !== valuationId),
      }));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Error al eliminar la Lista de Chequeo.";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Pagination actions
  nextPage: () => {
    set((state) => {
      const totalPages = Math.ceil(state.users.length / ITEMS_PER_PAGE);
      if (state.currentPage < totalPages) {
        return { currentPage: state.currentPage + 1 };
      }
      return {};
    });
  },

  prevPage: () => {
    set((state) => {
      if (state.currentPage > 1) {
        return { currentPage: state.currentPage - 1 };
      }
      return {};
    });
  },
}));