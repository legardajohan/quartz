import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiPost } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import type { ImportKind, ImportPreview, ImportResult, ImportRowDto } from '../types';

// Hasta 100 invitaciones por SMTP viajan en la misma petición: supera el timeout global (10 s).
const CONFIRM_TIMEOUT_MS = 60000;

const TEMPLATE_FILENAME: Record<ImportKind, string> = {
  students: 'plantilla-estudiantes.xlsx',
  staff: 'plantilla-equipo-docente.xlsx',
};

export async function downloadImportTemplate(kind: ImportKind): Promise<void> {
  const response = await withErrorMessage(
    () => apiClient.get<Blob>('/users/import/template', { params: { kind }, responseType: 'blob' }),
    'No se pudo descargar la plantilla.',
  );

  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = TEMPLATE_FILENAME[kind];
  link.click();
  URL.revokeObjectURL(url);
}

export function usePreviewImportMutation() {
  return useMutation({
    mutationFn: ({ kind, file }: { kind: ImportKind; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      return withErrorMessage(
        () =>
          apiPost<ImportPreview, FormData>('/users/import/preview', fd, {
            params: { kind },
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        'No se pudo validar el archivo.',
      );
    },
  });
}

export function useConfirmImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, rows }: { kind: ImportKind; rows: ImportRowDto[] }) =>
      withErrorMessage(
        () => apiPost<ImportResult, { kind: ImportKind; rows: ImportRowDto[] }>('/users/import', { kind, rows }, { timeout: CONFIRM_TIMEOUT_MS }),
        'No se pudieron crear los usuarios.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
