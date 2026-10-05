import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import type { PeriodsResponse, PeriodDto, NewPeriod, UpdatePeriod } from '../types';

export const periodKeys = {
  all: ['periods'] as const,
  list: () => [...periodKeys.all, 'list'] as const,
};

const fetchPeriods = () => apiGet<PeriodsResponse>('/periods');

// La caché se siembra con la sesión (`seedSessionCatalogs`): con < 30 min no se refetchea al montar.
export function usePeriodsQuery<TData = PeriodsResponse>(select?: (periods: PeriodsResponse) => TData) {
  return useQuery({
    queryKey: periodKeys.list(),
    queryFn: fetchPeriods,
    staleTime: STALE_TIME.catalog,
    select,
  });
}

// Activar un periodo desactiva otro en el backend: se relee la lista en vez de reconstruirla a mano.
function useInvalidatePeriods() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: periodKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreatePeriodMutation() {
  const invalidate = useInvalidatePeriods();

  return useMutation({
    mutationFn: (data: NewPeriod) =>
      withErrorMessage(() => apiPost<PeriodDto, NewPeriod>('/periods', data), 'Falló la creación del periodo.'),
    onSuccess: invalidate,
  });
}

export function useUpdatePeriodMutation() {
  const invalidate = useInvalidatePeriods();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePeriod }) =>
      withErrorMessage(
        () => apiPatch<PeriodDto, UpdatePeriod>(`/periods/${id}`, data),
        'Falló la actualización del periodo.',
      ),
    onSuccess: invalidate,
  });
}

export function useDeletePeriodMutation() {
  const invalidate = useInvalidatePeriods();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/periods/${id}`), 'Falló la eliminación del periodo.'),
    onSuccess: invalidate,
  });
}
