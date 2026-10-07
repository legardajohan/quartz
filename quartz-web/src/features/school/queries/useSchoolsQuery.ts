import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import type { SchoolsResponse, SchoolDto, NewSchool, UpdateSchool } from '../types';

export const schoolKeys = {
  all: ['schools'] as const,
  list: () => [...schoolKeys.all, 'list'] as const,
};

export function useSchoolsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: schoolKeys.list(),
    queryFn: () => apiGet<SchoolsResponse>('/schools'),
    staleTime: STALE_TIME.catalog,
    enabled,
  });
}

// Los usuarios embeben su sede, por eso un cambio de sede también invalida `users`.
function useInvalidateSchools() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: schoolKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['users'] });
  };
}

export function useCreateSchoolMutation() {
  const invalidate = useInvalidateSchools();

  return useMutation({
    mutationFn: (data: NewSchool) =>
      withErrorMessage(() => apiPost<SchoolDto, NewSchool>('/schools', data), 'Falló la creación de la sede.'),
    onSuccess: invalidate,
  });
}

export function useUpdateSchoolMutation() {
  const invalidate = useInvalidateSchools();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSchool }) =>
      withErrorMessage(
        () => apiPatch<SchoolDto, UpdateSchool>(`/schools/${id}`, data),
        'Falló la actualización de la sede.',
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteSchoolMutation() {
  const invalidate = useInvalidateSchools();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/schools/${id}`), 'Falló la eliminación de la sede.'),
    onSuccess: invalidate,
  });
}
