import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserPublic, UserRoleType } from '@change/shared';
import { api } from '@/lib/api';

// Login result can be either full auth or MFA challenge
interface LoginResult {
  requiresMfa?: boolean;
  mfaToken?: string;
  user?: UserPublic;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // MFA state (stored here to persist across component remounts)
  mfaPending: boolean;
  mfaToken: string | null;

  // Actions
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithMfa: (code: string) => Promise<void>;
  clearMfaState: () => void;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRoleType;
    tenantId?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaPending: false,
      mfaToken: null,

      login: async (email: string, password: string): Promise<LoginResult> => {
        set({ isLoading: true, error: null, mfaPending: false, mfaToken: null });

        try {
          console.log('[AuthStore] Calling /auth/login API...');
          const response = await api.post('/auth/login', { email, password });
          const data = response.data.data;
          console.log('[AuthStore] Login response data:', data);

          // Check if MFA is required
          if (data.requiresMfa) {
            console.log('[AuthStore] MFA required, storing mfaToken in state');
            set({ 
              isLoading: false, 
              mfaPending: true, 
              mfaToken: data.mfaToken 
            });
            return { requiresMfa: true, mfaToken: data.mfaToken };
          }

          const { user, accessToken, refreshToken } = data;
          console.log('[AuthStore] No MFA, setting authenticated state');

          // Update API instance with new token
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { user, accessToken, refreshToken };
        } catch (error: unknown) {
          console.error('[AuthStore] Login error:', error);
          const message =
            (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
            'Login failed';
          set({ isLoading: false, error: message, mfaPending: false, mfaToken: null });
          throw new Error(message);
        }
      },

      loginWithMfa: async (code: string) => {
        const { mfaToken } = get();
        if (!mfaToken) {
          throw new Error('No MFA token available');
        }
        
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/auth/login/mfa', { mfaToken, code });
          const { user, accessToken, refreshToken } = response.data.data;

          // Update API instance with new token
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mfaPending: false,
            mfaToken: null,
          });
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
            'Invalid verification code';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },
      
      clearMfaState: () => {
        set({ mfaPending: false, mfaToken: null, error: null });
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/auth/register', data);
          const { user, accessToken, refreshToken } = response.data.data;

          // Update API instance with new token
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
            'Registration failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: () => {
        // Clear API auth header
        delete api.defaults.headers.common['Authorization'];

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Update API instance with new token
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            accessToken,
            refreshToken: newRefreshToken,
          });
        } catch {
          // Refresh failed, logout
          get().logout();
        }
      },

      refreshUser: async () => {
        try {
          const response = await api.get('/auth/me');
          const user = response.data.data;
          set({ user });
        } catch {
          // Ignore errors - user might not be authenticated
          console.error('Failed to refresh user');
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'change-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore auth header after rehydration
        if (state?.accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      },
    }
  )
);
