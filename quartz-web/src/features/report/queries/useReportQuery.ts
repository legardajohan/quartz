import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, REPORT_REQUEST_TIMEOUT_MS } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  IReportTemplate,
  ICommunicativeLetterTemplate,
  ILetterAvailability,
  ConceptAssignmentUpdate,
  IBulkChecklistReportResponse,
  IBulkCommunicativeLetterResponse,
  IConsolidatedReportFilters,
} from '../types';

// Los datos de informe solo viven en esta caché en memoria (purgada en cada cambio de sesión):
// el PDF se genera bajo demanda y nunca se persiste.
export const reportKeys = {
  all: ['report'] as const,
  checklist: (valuationId: string) => [...reportKeys.all, 'checklist', valuationId] as const,
  letter: (valuationId: string) => [...reportKeys.all, 'letter', valuationId] as const,
  letterAvailabilityAll: () => [...reportKeys.all, 'letter-availability'] as const,
  letterAvailability: (periodId: string) => [...reportKeys.letterAvailabilityAll(), periodId] as const,
};

export function useChecklistReportQuery(valuationId: string | null, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: reportKeys.checklist(valuationId ?? ''),
    queryFn: () =>
      apiGet<IReportTemplate>(`/reports/checklist/${valuationId}`, { timeout: REPORT_REQUEST_TIMEOUT_MS }),
    enabled: enabled && !!valuationId,
    staleTime: STALE_TIME.live,
  });
}

export function useCommunicativeLetterQuery(
  valuationId: string | null | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: reportKeys.letter(valuationId ?? ''),
    queryFn: () =>
      apiGet<ICommunicativeLetterTemplate>(`/reports/communicative-letter/${valuationId}`, {
        timeout: REPORT_REQUEST_TIMEOUT_MS,
      }),
    enabled: enabled && !!valuationId,
    staleTime: STALE_TIME.live,
    // "Faltan conceptos" es un error de cobertura definitivo: reintentar no lo resuelve.
    retry: false,
  });
}

// Un fallo deja `data` en `undefined`: los consumidores lo tratan como "no disponible".
export function useLetterAvailabilityQuery(periodId?: string) {
  return useQuery({
    queryKey: reportKeys.letterAvailability(periodId ?? ''),
    queryFn: () =>
      apiGet<ILetterAvailability>('/reports/communicative-letter/availability', { params: { periodId } }),
    enabled: !!periodId,
    staleTime: STALE_TIME.list,
  });
}

export function useSaveLetterConceptsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ valuationId, assignments }: { valuationId: string; assignments: ConceptAssignmentUpdate[] }) =>
      withErrorMessage(
        () => apiPatch(`/student-valuations/${valuationId}/concepts`, { assignments }),
        'Falló guardar la selección de conceptos.',
      ),
    // Se espera solo la carta: la pantalla debe reflejar la versión del servidor al resolver.
    onSuccess: (_data, { valuationId }) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.letterAvailabilityAll() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return queryClient.invalidateQueries({ queryKey: reportKeys.letter(valuationId) });
    },
  });
}

// Consolidados: bajo demanda y descargados, sin caché.
export function useConsolidatedChecklistMutation() {
  return useMutation({
    mutationFn: (filters: IConsolidatedReportFilters) =>
      withErrorMessage(
        () =>
          apiPost<IBulkChecklistReportResponse>('/reports/checklist/consolidated', filters, {
            timeout: REPORT_REQUEST_TIMEOUT_MS,
          }),
        'Falló la generación del consolidado.',
      ),
  });
}

export function useConsolidatedLetterMutation() {
  return useMutation({
    mutationFn: (filters: IConsolidatedReportFilters) =>
      withErrorMessage(
        () =>
          apiPost<IBulkCommunicativeLetterResponse>('/reports/communicative-letter/consolidated', filters, {
            timeout: REPORT_REQUEST_TIMEOUT_MS,
          }),
        'Falló la generación del consolidado.',
      ),
  });
}
