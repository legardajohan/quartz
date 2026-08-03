import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/apiClient';
import type { UserSchool } from '../types';

export function useSchoolsQuery() {
  return useQuery({
    queryKey: ['schools'] as const,
    queryFn: () => apiGet<UserSchool[]>('/schools'),
  });
}
