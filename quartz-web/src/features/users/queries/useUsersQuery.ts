import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/api/apiClient';
import type { UserDto, GetUsersQuery } from '../types';

export const usersQueryKey = (params?: GetUsersQuery) =>
  ['users', params] as const;

export function useUsersQuery(params?: GetUsersQuery) {
  return useQuery({
    queryKey: usersQueryKey(params),
    queryFn: () => apiGet<UserDto[]>('/users', { params }),
  });
}

export function useUploadStudentPhotoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, blob }: { studentId: string; blob: Blob }) => {
      const fd = new FormData();
      fd.append('image', blob, 'photo.webp');
      return apiPatch<UserDto, FormData>(`/users/${studentId}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
