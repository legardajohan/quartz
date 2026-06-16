import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, apiGet, isAxiosError, extractErrorMessage } from '../../api/apiClient';
import type { AuthState, LoginRequest, LoginResponse, ProfileResponse } from './types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      sessionData: null,
      isLoading: false,
      error: null,

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
            error: null
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
        set({
          token: null,
          sessionData: null,
          isLoading: false,
          error: null
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
          const profile = await apiGet<ProfileResponse>('/auth/profile');
          const refreshedUser = profile.user;

          set((state) => ({
            sessionData: state.sessionData
              ? { ...state.sessionData, user: refreshedUser }
              : null,
            isLoading: false,
            error: null
          }));

        } catch (error: unknown) {
          if (isAxiosError(error) && error.response?.status === 401) {
            get().logout();
            return;
          }

          const errorMessage = extractErrorMessage(error, 'Error al actualizar datos del usuario');

          set({
            isLoading: false,
            error: errorMessage
          });
        }
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
