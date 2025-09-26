import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching issues
    config.params = {
      ...config.params,
      _t: Date.now()
    };

    // Log requests in development
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

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle common HTTP errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          console.warn('🚫 Unauthorized - Token may be expired');
          // Don't automatically logout here, let the auth store handle it
          break;
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

// Utility functions for common API patterns

/**
 * GET request with automatic error handling
 */
export const apiGet = async <T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

/**
 * POST request with automatic error handling
 */
export const apiPost = async <T = any, D = any>(
  url: string, 
  data?: D, 
  config?: InternalAxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * PUT request with automatic error handling
 */
export const apiPut = async <T = any, D = any>(
  url: string, 
  data?: D, 
  config?: InternalAxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * DELETE request with automatic error handling
 */
export const apiDelete = async <T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

/**
 * PATCH request with automatic error handling
 */
export const apiPatch = async <T = any, D = any>(
  url: string, 
  data?: D, 
  config?: InternalAxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

export default apiClient;