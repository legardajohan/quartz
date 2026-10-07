import { QueryClient } from '@tanstack/react-query';
// Directo de `axios`, no de `@/api/apiClient`: ese módulo importa `useAuthStore`, que importa este
// archivo para purgar la caché en logout → ciclo. Este módulo no importa nada de `src/`.
import { isAxiosError } from 'axios';

// Frescura por tipo de dato. Una query la sobrescribe en su propio `useQuery` si necesita otra.
export const STALE_TIME = {
  catalog: 30 * 60_000, // subjects, periods, schools, institution, branding
  list: 5 * 60_000, // learnings, concepts, checklist-templates, users
  live: 0, // valoración, carta, reporte: pinta la caché y revalida en segundo plano
} as const;

const MAX_RETRIES = 1;

// Un 4xx (401/403/404/409/422) es definitivo: reintentar solo repite el error.
const shouldRetry = (failureCount: number, error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status ?? 0 : 0;
  if (status >= 400 && status < 500) return false;
  return failureCount < MAX_RETRIES;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.list,
      gcTime: 30 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
