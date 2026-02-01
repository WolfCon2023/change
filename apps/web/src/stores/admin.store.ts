/**
 * Admin Store
 * State management for IAM Admin Portal
 */

import { create } from 'zustand';
import type { IamPermissionType } from '@change/shared';

interface AdminContext {
  permissions: IamPermissionType[];
  roles: Array<{ id: string; name: string; permissions: IamPermissionType[] }>;
  currentTenantId: string | null;
}

interface AdminState {
  context: AdminContext | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setContext: (context: AdminContext) => void;
  setCurrentTenant: (tenantId: string) => void;
  clearContext: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Permission helpers
  hasPermission: (permission: IamPermissionType) => boolean;
  hasAnyPermission: (...permissions: IamPermissionType[]) => boolean;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  context: null,
  isLoading: false,
  error: null,

  setContext: (context) => set({ context, error: null }),
  
  setCurrentTenant: (tenantId) => set((state) => ({
    context: state.context ? { ...state.context, currentTenantId: tenantId } : null,
  })),
  
  clearContext: () => set({ context: null, error: null }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  hasPermission: (permission) => {
    const { context } = get();
    return context?.permissions.includes(permission) ?? false;
  },

  hasAnyPermission: (...permissions) => {
    const { context } = get();
    if (!context) return false;
    return permissions.some((p) => context.permissions.includes(p));
  },
}));
