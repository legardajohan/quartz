import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../api/apiClient';
import type { AuthState, LoginRequest, LoginResponse, ProfileResponse } from './types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      sessionData: null,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post<LoginResponse>('/auth/login', {
            email: email.toLowerCase().trim(),
            password
          } as LoginRequest);

          const { token, sessionData } = response.data; // Response API
          
          // Store token in apiClient for future requests
          // apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({  
            token,
            sessionData, 
            isLoading: false,
            error: null 
          });

        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                             error.message || 
                             'Error de conexión. Verifica tu conexión a internet.';
          
          set({  
            token: null,
            sessionData: null, 
            isLoading: false, 
            error: errorMessage 
          });
        }
      },

      // Logout action
      logout: () => {
        // Clear token from apiClient
        // delete apiClient.defaults.headers.common['Authorization'];
        
        set({ 
          token: null,
          sessionData: null, 
          isLoading: false, 
          error: null 
        });
      },

      // Clear error action
      clearError: () => {
        set({ error: null });
      },

      // Refresh user data action
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.get<ProfileResponse>('/auth/profile');
          const refreshedUser = response.data.user;
          
          set((state) => ({
            sessionData: state.sessionData
              ? { ...state.sessionData, user: refreshedUser } 
              : null,
            isLoading: false,
            error: null 
          }));

        } catch (error: any) {
          // If token is invalid, logout user
          if (error.response?.status === 401) {
            get().logout();
            return;
          }
          
          const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar datos del usuario';
          
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