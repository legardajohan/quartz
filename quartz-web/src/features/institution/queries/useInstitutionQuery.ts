import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import { learningKeys } from '@/features/learning/queries/useLearningsQuery';
import { checklistTemplateKeys } from '@/features/checklist-template/queries/useChecklistTemplatesQuery';
import type {
  InstitutionDto,
  InstitutionBrandingDto,
  InstitutionSettingsDto,
  UpdateInstitutionSettings,
} from '../types';

export const institutionKeys = {
  all: ['institution'] as const,
  me: ['institution', 'me'] as const,
  settings: ['institution', 'settings'] as const,
  branding: ['institution', 'branding'] as const,
};

export function useInstitutionQuery() {
  return useQuery({
    queryKey: institutionKeys.me,
    queryFn: () => apiGet<InstitutionDto>('/institutions/me'),
    staleTime: STALE_TIME.catalog,
  });
}

// Ajustes transversales (informes, jornadas) para Jefe de Área y Docente; `/me` es solo Jefe de Área.
// Se siembra con la sesión (`seedSessionCatalogs`). Un fallo deja `data` en `undefined`: los
// consumidores caen a sus defaults.
export function useInstitutionSettingsQuery() {
  return useQuery({
    queryKey: institutionKeys.settings,
    queryFn: () => apiGet<InstitutionSettingsDto>('/institutions/me/settings'),
    staleTime: STALE_TIME.catalog,
  });
}

export function useInstitutionBrandingQuery() {
  return useQuery({
    queryKey: institutionKeys.branding,
    queryFn: () => apiGet<InstitutionBrandingDto>('/institutions/me/branding'),
    staleTime: STALE_TIME.catalog,
    // Un fallo es silencioso: el sidebar cae al placeholder y no se reintenta.
    retry: false,
  });
}

export function useUpdateInstitutionSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateInstitutionSettings) =>
      withErrorMessage(
        () => apiPatch<InstitutionDto, { settings: UpdateInstitutionSettings }>('/institutions/me', { settings: data }),
        'Falló la actualización de la configuración.',
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(institutionKeys.me, updated);
      queryClient.setQueryData(institutionKeys.settings, updated.settings);
      // Quitar un nivel cambia qué aprendizajes/plantillas se listan y puede reasignar docentes.
      queryClient.invalidateQueries({ queryKey: learningKeys.all });
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUploadShieldMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blob: Blob) => {
      const fd = new FormData();
      fd.append('image', blob, 'shield.webp');
      return withErrorMessage(
        () =>
          apiPatch<InstitutionDto, FormData>('/institutions/me/shield', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        'Falló la subida del escudo.',
      );
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(institutionKeys.me, updated);
      // `shieldVersion` sale de `shieldJpgUrl`, que no viaja en `InstitutionDto`: se relee el branding.
      await queryClient.invalidateQueries({ queryKey: institutionKeys.branding });
    },
  });
}
