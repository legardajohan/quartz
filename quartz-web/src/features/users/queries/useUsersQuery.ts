import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/apiClient';
import type { UserDto, GetUsersQuery } from '../types';

export const usersQueryKey = (params?: GetUsersQuery) =>
  ['users', params] as const;

export function useUsersQuery(params?: GetUsersQuery) {
  return useQuery({
    queryKey: usersQueryKey(params),
    queryFn: () => apiGet<UserDto[]>('/users', { params }),
  });
}
