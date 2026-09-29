import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import type { ConceptDto, NewConcept, UpdateConcept, GetConceptsQuery } from '../types';

export const conceptKeys = {
  all: ['concepts'] as const,
  list: (query?: GetConceptsQuery) => [...conceptKeys.all, 'list', query] as const,
};

export function useConceptsQuery(query?: GetConceptsQuery) {
  return useQuery({
    queryKey: conceptKeys.list(query),
    queryFn: () => apiGet<ConceptDto[]>('/concepts', { params: query }),
  });
}

// Los agregados del dashboard dependen de los conceptos.
function useInvalidateConcepts() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: conceptKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateConceptMutation() {
  const invalidate = useInvalidateConcepts();

  return useMutation({
    mutationFn: (data: NewConcept) =>
      withErrorMessage(() => apiPost<ConceptDto, NewConcept>('/concepts', data), 'Falló la creación del concepto.'),
    onSuccess: invalidate,
  });
}

export function useUpdateConceptMutation() {
  const invalidate = useInvalidateConcepts();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConcept }) =>
      withErrorMessage(
        () => apiPatch<ConceptDto, UpdateConcept>(`/concepts/${id}`, data),
        'Falló la actualización del concepto.',
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteConceptMutation() {
  const invalidate = useInvalidateConcepts();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/concepts/${id}`), 'Falló la eliminación del concepto.'),
    onSuccess: invalidate,
  });
}
