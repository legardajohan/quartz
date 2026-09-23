import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, apiDelete } from '@/api/apiClient';
import type { UserDto, GetUsersQuery, NewUser, UpdateUser, CreatedUser } from '../types';

export const usersQueryKey = (params?: GetUsersQuery) =>
  ['users', params] as const;

export function useUsersQuery(params?: GetUsersQuery) {
  return useQuery({
    queryKey: usersQueryKey(params),
    // `roles` viaja como CSV (`Docente,Jefe de Área`), el formato que valida la API.
    queryFn: () =>
      apiGet<UserDto[]>('/users', {
        params: params?.roles ? { ...params, roles: params.roles.join(',') } : params,
      }),
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

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewUser) => apiPost<CreatedUser, NewUser>('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUser }) =>
      apiPatch<UserDto, UpdateUser>(`/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiDelete<void>(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResendInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiPost<void>(`/users/${userId}/invitation`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
