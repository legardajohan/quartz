import { create } from 'zustand';
import { apiGet, apiPatch, extractErrorMessage, REPORT_REQUEST_TIMEOUT_MS } from '../../api/apiClient';
import type {
  ReportState,
  GetUsersQuery,
  UserDto,
  IReportTemplate,
  ICommunicativeLetterTemplate,
  ILetterAvailability,
  ConceptAssignmentUpdate,
} from './types';

export const ITEMS_PER_PAGE = 10;

export const useReportStore = create<ReportState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  currentReport: null,
  isReportLoading: false,
  reportError: null,
  currentLetter: null,
  isLetterLoading: false,
  letterError: null,
  letterAvailability: null,

  fetchUsers: async (query: GetUsersQuery) => {
    set({ isLoading: true, error: null });
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
      const data = await apiGet<IReportTemplate>(`/reports/checklist/${valuationId}`, {
        timeout: REPORT_REQUEST_TIMEOUT_MS,
      });
      set({ currentReport: data, isReportLoading: false });
    } catch (err: unknown) {
      set({ reportError: extractErrorMessage(err, 'Falló la carga del informe.'), isReportLoading: false });
    }
  },

  clearReport: () => set({ currentReport: null, reportError: null }),

  fetchLetterAvailability: async (periodId: string) => {
    try {
      const data = await apiGet<ILetterAvailability>('/reports/communicative-letter/availability', {
        params: { periodId },
      });
      set({ letterAvailability: data });
    } catch {
      set({ letterAvailability: null });
    }
  },

  fetchCommunicativeLetter: async (valuationId: string) => {
    set({ isLetterLoading: true, letterError: null, currentLetter: null });
    try {
      const data = await apiGet<ICommunicativeLetterTemplate>(`/reports/communicative-letter/${valuationId}`, {
        timeout: REPORT_REQUEST_TIMEOUT_MS,
      });
      set({ currentLetter: data, isLetterLoading: false });
    } catch (err: unknown) {
      set({ letterError: extractErrorMessage(err, 'Falló la carga de la Carta Comunicativa.'), isLetterLoading: false });
    }
  },

  saveLetterConcepts: async (valuationId: string, assignments: ConceptAssignmentUpdate[]) => {
    try {
      await apiPatch(`/student-valuations/${valuationId}/concepts`, { assignments });
      const data = await apiGet<ICommunicativeLetterTemplate>(`/reports/communicative-letter/${valuationId}`, {
        timeout: REPORT_REQUEST_TIMEOUT_MS,
      });
      set({ currentLetter: data });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Falló guardar la selección de conceptos.');
      set({ letterError: message });
      throw new Error(message);
    }
  },

  clearLetter: () => set({ currentLetter: null, letterError: null, isLetterLoading: false }),
}));
