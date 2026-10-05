import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { SubjectsResponse, SubjectDto, NewSubject, UpdateSubject } from '../types';

export const subjectKeys = {
  all: ['subjects'] as const,
  list: () => [...subjectKeys.all, 'list'] as const,
};

const fetchSubjects = () => apiGet<SubjectsResponse>('/subjects');

export function useSubjectsQuery() {
  return useQuery({
    queryKey: subjectKeys.list(),
    queryFn: fetchSubjects,
    staleTime: STALE_TIME.catalog,
  });
}

// Relee la lista del servidor para dejar caché y `sessionData.subjects` alineados con él.
async function refreshSubjects(queryClient: QueryClient) {
  try {
    const fresh = await queryClient.fetchQuery({
      queryKey: subjectKeys.list(),
      queryFn: fetchSubjects,
      staleTime: 0,
    });
    useAuthStore.getState().setSubjects(fresh);
  } catch {
    // La escritura ya se aplicó: no se reporta como fallo de la mutación.
    void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
  }
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewSubject) =>
      withErrorMessage(() => apiPost<SubjectDto, NewSubject>('/subjects', data), 'Falló la creación de la dimensión.'),
    onSuccess: () => refreshSubjects(queryClient),
  });
}

export function useUpdateSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubject }) =>
      withErrorMessage(
        () => apiPatch<SubjectDto, UpdateSubject>(`/subjects/${id}`, data),
        'Falló la actualización de la dimensión.',
      ),
    onSuccess: () => refreshSubjects(queryClient),
  });
}

export function useDeleteSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/subjects/${id}`), 'Falló la eliminación de la dimensión.'),
    onSuccess: () => refreshSubjects(queryClient),
  });
}
