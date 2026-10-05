import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import type { IStudentValuationDTO, StudentValuationUpdateData } from '../types';

export const valuationKeys = {
  all: ['student-valuation'] as const,
  detail: (studentId: string, periodId: string) => [...valuationKeys.all, studentId, periodId] as const,
};

// `POST` como lectura: el endpoint es get-or-create idempotente (VAL-01).
export function useStudentValuationQuery(studentId?: string, periodId?: string) {
  return useQuery({
    queryKey: valuationKeys.detail(studentId ?? '', periodId ?? ''),
    queryFn: () =>
      apiPost<IStudentValuationDTO>(`/student-valuations/student/${studentId}/period/${periodId}`, {}),
    enabled: !!studentId && !!periodId,
    staleTime: STALE_TIME.live,
  });
}

// La lista de estudiantes (`globalStatus`), el dashboard y los informes derivan de la valoración.
function useInvalidateValuationDependents() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['report'] });
  };
}

export function useUpdateValuationMutation() {
  const queryClient = useQueryClient();
  const invalidateDependents = useInvalidateValuationDependents();

  return useMutation({
    mutationFn: ({ valuationId, payload }: { valuationId: string; payload: StudentValuationUpdateData }) =>
      withErrorMessage(
        () => apiPatch<IStudentValuationDTO, StudentValuationUpdateData>(`/student-valuations/${valuationId}`, payload),
        'Falló la actualización.',
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(valuationKeys.detail(data.studentId, data.periodId), data);
      invalidateDependents();
    },
  });
}

export function useDeleteValuationMutation() {
  const queryClient = useQueryClient();
  const invalidateDependents = useInvalidateValuationDependents();

  return useMutation({
    mutationFn: (valuationId: string) =>
      withErrorMessage(
        () => apiDelete<void>(`/student-valuations/${valuationId}`),
        'Error al eliminar la Lista de Chequeo.',
      ),
    // Sin el `studentId`/`periodId` a mano se descarta todo el prefijo: el siguiente acceso
    // vuelve a hacer get-or-create.
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: valuationKeys.all });
      invalidateDependents();
    },
  });
}
