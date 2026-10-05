import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/api/apiClient';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { OwnProfile, UpdateOwnProfile, ChangeOwnPassword } from '../types';

export const accountQueryKey = ['account', 'me'] as const;

export function useOwnProfileQuery() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: () => apiGet<OwnProfile>('/users/me'),
  });
}

// El menú de usuario lee nombre y foto de `sessionData`: se revalida tras cada cambio de perfil.
function useSyncProfile() {
  const queryClient = useQueryClient();

  return (profile: OwnProfile) => {
    queryClient.setQueryData(accountQueryKey, profile);
    void useAuthStore.getState().refreshSession();
  };
}

export function useUpdateOwnProfileMutation() {
  const syncProfile = useSyncProfile();

  return useMutation({
    mutationFn: (data: UpdateOwnProfile) => apiPatch<OwnProfile, UpdateOwnProfile>('/users/me', data),
    onSuccess: syncProfile,
  });
}

export function useUploadOwnPhotoMutation() {
  const syncProfile = useSyncProfile();

  return useMutation({
    mutationFn: (blob: Blob) => {
      const fd = new FormData();
      fd.append('image', blob, 'photo.webp');
      return apiPatch<OwnProfile, FormData>('/users/me/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: syncProfile,
  });
}

export function useChangeOwnPasswordMutation() {
  return useMutation({
    mutationFn: (data: ChangeOwnPassword) => apiPatch<void, ChangeOwnPassword>('/users/me/password', data),
  });
}
