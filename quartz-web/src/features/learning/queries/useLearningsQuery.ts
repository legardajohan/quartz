import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import type { Learning, LearningsResponse, NewLearning, UpdateLearning } from '../types';

export const learningKeys = {
  all: ['learnings'] as const,
  list: () => [...learningKeys.all, 'list'] as const,
};

export function useLearningsQuery() {
  return useQuery({
    queryKey: learningKeys.list(),
    queryFn: () => apiGet<LearningsResponse>('/learnings'),
  });
}

// Los agregados del dashboard dependen de los aprendizajes.
function useInvalidateLearnings() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: learningKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateLearningMutation() {
  const invalidate = useInvalidateLearnings();

  return useMutation({
    mutationFn: (data: NewLearning) =>
      withErrorMessage(() => apiPost<Learning, NewLearning>('/learnings', data), 'Falló la creación del aprendizaje.'),
    onSuccess: invalidate,
  });
}

export function useUpdateLearningMutation() {
  const invalidate = useInvalidateLearnings();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLearning }) =>
      withErrorMessage(
        () => apiPatch<Learning, UpdateLearning>(`/learnings/${id}`, data),
        'Falló la actualización del aprendizaje.',
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteLearningMutation() {
  const invalidate = useInvalidateLearnings();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/learnings/${id}`), 'Falló la eliminación del aprendizaje.'),
    onSuccess: invalidate,
  });
}
