import { create } from 'zustand';
import { apiGet, extractErrorMessage } from '../../api/apiClient';
import type { ReportState, GetUsersQuery, UserDto, IReportTemplate } from './types';

export const ITEMS_PER_PAGE = 10;

export const useReportStore = create<ReportState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  currentReport: null,
  isReportLoading: false,
  reportError: null,

  fetchUsers: async (query: GetUsersQuery) => {
    set({ isLoading: true, error: null, currentPage: 1 });
    try {
      const data = await apiGet<UserDto[]>('/users', { params: query });
      set({ users: data, isLoading: false });
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err, 'Falló la carga de estudiantes.'), isLoading: false });
    }
  },

  fetchChecklistReport: async (valuationId: string) => {
    set({ isReportLoading: true, reportError: null, currentReport: null });
    try {
      const data = await apiGet<IReportTemplate>(`/reports/checklist/${valuationId}`);
      set({ currentReport: data, isReportLoading: false });
    } catch (err: unknown) {
      set({ reportError: extractErrorMessage(err, 'Falló la carga del informe.'), isReportLoading: false });
    }
  },

  clearReport: () => set({ currentReport: null, reportError: null }),

  nextPage: () => set((state) => {
    const totalPages = Math.ceil(state.users.length / ITEMS_PER_PAGE);
    return state.currentPage < totalPages ? { currentPage: state.currentPage + 1 } : {};
  }),

  prevPage: () => set((state) => (state.currentPage > 1 ? { currentPage: state.currentPage - 1 } : {})),
}));
