import { useQuery } from '@tanstack/react-query';
import { apiPost } from '@/api/apiClient';
import type { ActivationPreview } from '../types';

export const activationQueryKey = (token: string | null) => ['activation', token] as const;

// POST y no GET: el token no queda en logs de acceso. Sin reintentos: 404/410 son definitivos.
export function useVerifyActivationQuery(token: string | null) {
  return useQuery({
    queryKey: activationQueryKey(token),
    queryFn: () => apiPost<ActivationPreview, { token: string }>('/auth/activation/verify', { token: token as string }),
    enabled: !!token,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
