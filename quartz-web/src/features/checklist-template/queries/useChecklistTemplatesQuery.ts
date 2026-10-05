import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, extractErrorMessage, isAxiosError } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import type { ChecklistTemplateDto, NewChecklistTemplate, UpdateChecklistTemplate } from '../types';

export const checklistTemplateKeys = {
  all: ['checklist-templates'] as const,
  list: () => [...checklistTemplateKeys.all, 'list'] as const,
};

export function useChecklistTemplatesQuery() {
  return useQuery({
    queryKey: checklistTemplateKeys.list(),
    queryFn: () => apiGet<ChecklistTemplateDto[]>('/checklist-templates'),
  });
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.all });
  };
}

export function useCreateChecklistTemplateMutation() {
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (data: NewChecklistTemplate) =>
      withErrorMessage(
        () => apiPost<ChecklistTemplateDto, NewChecklistTemplate>('/checklist-templates', data),
        (err) =>
          isAxiosError(err) && err.response?.status === 409
            ? extractErrorMessage(err, 'Máximo 2 plantillas por período alcanzado.')
            : extractErrorMessage(err, 'Falló la creación de la plantilla.'),
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateChecklistTemplateMutation() {
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChecklistTemplate }) =>
      withErrorMessage(
        () => apiPatch<ChecklistTemplateDto, UpdateChecklistTemplate>(`/checklist-templates/${id}`, data),
        'Falló la actualización de la plantilla.',
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteChecklistTemplateMutation() {
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorMessage(() => apiDelete<void>(`/checklist-templates/${id}`), 'Falló la eliminación de la plantilla.'),
    onSuccess: invalidate,
  });
}
