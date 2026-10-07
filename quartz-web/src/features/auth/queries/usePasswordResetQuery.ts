import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost } from '@/api/apiClient';
import type {
  PasswordResetPreview,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
} from '../types';

export const passwordResetQueryKey = (token: string | null) => ['password-reset', token] as const;

// POST y no GET: el token no queda en logs de acceso. Sin reintentos: 404/410 son definitivos.
export function useVerifyPasswordResetQuery(token: string | null) {
  return useQuery({
    queryKey: passwordResetQueryKey(token),
    queryFn: () =>
      apiPost<PasswordResetPreview, { token: string }>('/auth/password-reset/verify', { token: token as string }),
    enabled: !!token,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (request: RequestPasswordResetRequest) =>
      apiPost<RequestPasswordResetResponse, RequestPasswordResetRequest>('/auth/password-reset/request', request),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (request: ResetPasswordRequest) =>
      apiPost<void, ResetPasswordRequest>('/auth/password-reset', request),
  });
}
