import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../features/auth/useAuthStore';

export { isAxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Margen ampliado para lecturas de informe (PDF): componen datos de varias colecciones
// y, hasta RPT-06, incluyen un proxy de imagen a R2. El timeout global del cliente (10s)
// no cambia; este valor se pasa explicitamente por config en esas llamadas puntuales.
export const REPORT_REQUEST_TIMEOUT_MS = 30000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    };
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        console.warn('🚫 Unauthorized (401) - Token inválido o expirado. Cerrando sesión...');
        useAuthStore.getState().logout();
      }

      const message = (error.response.data as { message?: string })?.message ?? error.message;

      switch (status) {
        case 403:
          console.warn('🚫 Forbidden - Insufficient permissions');
          break;
        case 404:
          console.warn('🔍 Not Found - Resource does not exist');
          break;
        case 422:
          console.warn('⚠️ Validation Error:', message);
          break;
        case 500:
          console.error('💥 Server Error:', message);
          break;
        default:
          console.error(`❌ HTTP ${status}:`, message);
      }
    } else if (error.request) {
      console.error('🌐 Network Error - No response received:', error.request);
    } else {
      console.error('⚙️ Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      return 'La generación del informe tardó más de lo esperado. Inténtalo de nuevo.';
    }
    return (err.response?.data as { message?: string })?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * GET request with automatic error handling
 */
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

/**
 * POST request with automatic error handling
 */
export const apiPost = async <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * PUT request with automatic error handling
 */
export const apiPut = async <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * DELETE request with automatic error handling
 */
export const apiDelete = async <T = void>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

/**
 * PATCH request with automatic error handling
 */
export const apiPatch = async <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

export default apiClient;
