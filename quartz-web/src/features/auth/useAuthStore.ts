import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, apiGet, isAxiosError, extractErrorMessage } from '../../api/apiClient';
import { purgeAllShieldCacheEntries } from '../institution/shieldCache';
import { queryClient } from '../../lib/queryClient';
import { seedSessionCatalogs } from './seedSessionCatalogs';
import type {
  AuthState,
  LoginRequest,
  LoginResponse,
  SessionResponse,
  ActivateAccountRequest,
  SessionUser,
} from './types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      sessionData: null,
      isLoading: false,
      error: null,
      showWelcomeLoader: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { token, sessionData } = await apiPost<LoginResponse, LoginRequest>('/auth/login', {
            email: email.toLowerCase().trim(),
            password,
          });

          // La caché es de la sesión anterior (otro usuario o institución): se descarta antes de
          // sembrar la nueva, y se siembra antes de fijar `token` para que el primer render
          // autenticado ya tenga catálogos.
          queryClient.clear();
          seedSessionCatalogs(sessionData);
          set({
            token,
            sessionData: { user: sessionData.user },
            isLoading: false,
            error: null,
            showWelcomeLoader: true
          });

        } catch (error: unknown) {
          const errorMessage = extractErrorMessage(error, 'Error de conexión. Verifica tu conexión a internet.');

          set({
            token: null,
            sessionData: null,
            isLoading: false,
            error: errorMessage
          });
        }
      },

      activateAccount: async (request: ActivateAccountRequest) => {
        const { token, sessionData } = await apiPost<LoginResponse, ActivateAccountRequest>('/auth/activation', request);
        queryClient.clear();
        seedSessionCatalogs(sessionData);
        set({
          token,
          sessionData: { user: sessionData.user },
          isLoading: false,
          error: null,
          showWelcomeLoader: true
        });
      },

      logout: () => {
        purgeAllShieldCacheEntries();
        queryClient.clear();
        set({
          token: null,
          sessionData: null,
          isLoading: false,
          error: null,
          showWelcomeLoader: false
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshSession: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const { sessionData } = await apiGet<SessionResponse>('/auth/session');
          // El servidor es la fuente: re-sembrar sobrescribe la caché sin riesgo.
          seedSessionCatalogs(sessionData);
          set({ sessionData: { user: sessionData.user } });
        } catch (error: unknown) {
          if (isAxiosError(error) && error.response?.status === 401) {
            get().logout();
            return;
          }

          // Red o 5xx: se conservan `token` y `user` persistidos y la caché, sin tocar `isLoading` ni
          // `error` — esta revalidación es silenciosa, no debe parpadear la UI.
        }
      },

      dismissWelcomeLoader: () => {
        set({ showWelcomeLoader: false });
      }
    }),
    {
      name: 'quartz-session',
      // v0 guardaba `sessionData` con catálogos. `migrate` conserva `token` + `user` (sin re-login)
      // y descarta los catálogos; sin él, el cambio de versión tiraría la sesión guardada.
      version: 1,
      migrate: (persisted) => {
        const old = persisted as { token?: string | null; sessionData?: { user?: SessionUser } | null };
        return {
          token: old.token ?? null,
          sessionData: old.sessionData?.user ? { user: old.sessionData.user } : null,
        } as AuthState;
      },
      partialize: (state) => ({
        token: state.token,
        sessionData: state.sessionData
      }),
    }
  )
);
