import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, apiGet, isAxiosError, extractErrorMessage } from '../../api/apiClient';
import { purgeAllShieldCacheEntries } from '../institution/shieldCache';
import type { AuthState, LoginRequest, LoginResponse, SessionResponse } from './types';

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

          set({
            token,
            sessionData,
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

      logout: () => {
        purgeAllShieldCacheEntries();
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
          set({ sessionData });
        } catch (error: unknown) {
          if (isAxiosError(error) && error.response?.status === 401) {
            get().logout();
            return;
          }

          // Red o 5xx: se conserva la sessionData persistida, sin tocar `isLoading` ni
          // `error` — esta revalidación es silenciosa, no debe parpadear la UI.
        }
      },

      setSubjects: (subjects) => {
        set((state) => ({
          sessionData: state.sessionData
            ? { ...state.sessionData, subjects }
            : null
        }));
      },

      setPeriods: (periods) => {
        set((state) => ({
          sessionData: state.sessionData
            ? { ...state.sessionData, periods }
            : null
        }));
      },

      setEnabledReports: (enabledReports) => {
        set((state) => ({
          sessionData: state.sessionData
            ? { ...state.sessionData, enabledReports }
            : null
        }));
      },

      setShifts: (multipleShifts, shifts) => {
        set((state) => ({
          sessionData: state.sessionData
            ? { ...state.sessionData, multipleShifts, shifts }
            : null
        }));
      },

      dismissWelcomeLoader: () => {
        set({ showWelcomeLoader: false });
      }
    }),
    {
      name: 'quartz-session',
      partialize: (state) => ({
        token: state.token,
        sessionData: state.sessionData
      }),
    }
  )
);
