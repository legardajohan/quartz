import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { PeriodsResponse, PeriodDto, NewPeriod, UpdatePeriod } from '../types';

export const periodKeys = {
  all: ['periods'] as const,
  list: () => [...periodKeys.all, 'list'] as const,
};

const fetchPeriods = () => apiGet<PeriodsResponse>('/periods');

export function usePeriodsQuery() {
  return useQuery({
    queryKey: periodKeys.list(),
    queryFn: fetchPeriods,
    staleTime: STALE_TIME.catalog,
  });
}

function syncSessionPeriods(periods: PeriodDto[]) {
  useAuthStore.getState().setPeriods(
    periods.map((p) => ({ _id: p._id, name: p.name, isActive: p.isActive }))
  );
}

// Activar un periodo desactiva otro en el backend: se relee la lista del servidor en vez de
// reconstruirla a mano, y así caché y `sessionData.periods` quedan alineados con él.
async function refreshPeriods(queryClient: QueryClient) {
  try {
    const fresh = await queryClient.fetchQuery({
      queryKey: periodKeys.list(),
      queryFn: fetchPeriods,
      staleTime: 0,
    });
    syncSessionPeriods(fresh);
  } catch {
    // La escritura ya se aplicó: no se reporta como fallo de la mutación.
    void queryClient.invalidateQueries({ queryKey: periodKeys.all });
  }
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreatePeriodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewPeriod) =>
      withErrorMessage(() => apiPost<PeriodDto, NewPeriod>('/periods', data), 'Falló la creación del periodo.'),
    onSuccess: () => refreshPeriods(queryClient),
  });
}

export function useUpdatePeriodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePeriod }) =>
      withErrorMessage(
        () => apiPatch<PeriodDto, UpdatePeriod>(`/periods/${id}`, data),
        'Falló la actualización del periodo.',
      ),
    onSuccess: () => refreshPeriods(queryClient),
  });
}

export function useDeletePeriodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/periods/${id}`), 'Falló la eliminación del periodo.'),
    onSuccess: () => refreshPeriods(queryClient),
  });
}
