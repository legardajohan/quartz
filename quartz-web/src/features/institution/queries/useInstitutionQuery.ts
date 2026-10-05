import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/api/apiClient';
import { withErrorMessage } from '@/api/withErrorMessage';
import { STALE_TIME } from '@/lib/queryClient';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { InstitutionDto, InstitutionBrandingDto, UpdateInstitutionSettings } from '../types';

export const institutionKeys = {
  all: ['institution'] as const,
  me: ['institution', 'me'] as const,
  branding: ['institution', 'branding'] as const,
};

export function useInstitutionQuery() {
  return useQuery({
    queryKey: institutionKeys.me,
    queryFn: () => apiGet<InstitutionDto>('/institutions/me'),
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
      const { setEnabledReports, setShifts } = useAuthStore.getState();
      setEnabledReports(updated.settings.enabledReports);
      setShifts(updated.settings.multipleShifts, updated.settings.shifts);
      queryClient.setQueryData(institutionKeys.me, updated);
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
