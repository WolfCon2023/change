import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request ID
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { useAuthStore } = await import('@/stores/auth.store');
        const store = useAuthStore.getState();
        
        if (store.refreshToken) {
          await store.refreshAuth();
          
          // Retry the original request with new token
          const newToken = useAuthStore.getState().accessToken;
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed, logout
        const { useAuthStore } = await import('@/stores/auth.store');
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
