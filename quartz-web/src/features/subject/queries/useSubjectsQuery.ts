import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import type { SubjectsResponse, SubjectDto, NewSubject, UpdateSubject } from '../types';

export const subjectKeys = {
  all: ['subjects'] as const,
  list: () => [...subjectKeys.all, 'list'] as const,
};

const fetchSubjects = () => apiGet<SubjectsResponse>('/subjects');

// La caché se siembra con la sesión (`seedSessionCatalogs`): con < 30 min no se refetchea al montar.
export function useSubjectsQuery() {
  return useQuery({
    queryKey: subjectKeys.list(),
    queryFn: fetchSubjects,
    staleTime: STALE_TIME.catalog,
  });
}

// Los agregados del dashboard dependen de las dimensiones.
function useInvalidateSubjects() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateSubjectMutation() {
  const invalidate = useInvalidateSubjects();

  return useMutation({
    mutationFn: (data: NewSubject) =>
      withErrorMessage(() => apiPost<SubjectDto, NewSubject>('/subjects', data), 'Falló la creación de la dimensión.'),
    onSuccess: invalidate,
  });
}

export function useUpdateSubjectMutation() {
  const invalidate = useInvalidateSubjects();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubject }) =>
      withErrorMessage(
        () => apiPatch<SubjectDto, UpdateSubject>(`/subjects/${id}`, data),
        'Falló la actualización de la dimensión.',
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteSubjectMutation() {
  const invalidate = useInvalidateSubjects();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/subjects/${id}`), 'Falló la eliminación de la dimensión.'),
    onSuccess: invalidate,
  });
}
