/**
 * Admin API Client
 * API hooks for IAM Admin Portal
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// Types
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    timestamp: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: { timestamp: string };
}

// Admin Context
export function useAdminContext() {
  return useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{
        user: unknown;
        permissions: string[];
        roles: Array<{ id: string; name: string; permissions: string[] }>;
        tenantId: string;
      }>>('/admin/me');
      return res.data.data;
    },
  });
}

// Dashboard
export function useAdminDashboard(tenantId: string) {
  return useQuery({
    queryKey: ['admin', 'dashboard', tenantId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{
        totalUsers: number;
        activeUsers: number;
        lockedUsers: number;
        mfaEnabledUsers: number;
        mfaCoverage: number;
        totalRoles: number;
        totalGroups: number;
        pendingAccessRequests: number;
        openAccessReviews: number;
        usersWithoutMfa: Array<{ id: string; email: string; name: string }>;
        expiringApiKeys: Array<{ id: string; name: string; expiresAt: string }>;
        recentIamChanges: unknown[];
      }>>(`/admin/tenants/${tenantId}/dashboard`);
      return res.data.data;
    },
    enabled: !!tenantId,
  });
}

// Users
export function useUsers(tenantId: string, params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['admin', 'users', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<unknown>>(`/admin/tenants/${tenantId}/users`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useUser(tenantId: string, userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', tenantId, userId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/users/${userId}`);
      return res.data.data;
    },
    enabled: !!tenantId && !!userId,
  });
}

export function useCreateUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      firstName: string;
      lastName: string;
      password?: string;
      role?: string;
      primaryRole?: string;
      iamRoleIds?: string[];
      groupIds?: string[];
      mfaEnforced?: boolean;
    }) => {
      const res = await api.post<ApiResponse<{ user: unknown; temporaryPassword?: string }>>(
        `/admin/tenants/${tenantId}/users`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
    },
  });
}

export function useUpdateUser(tenantId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      role?: string;
      primaryRole?: string;
      isActive?: boolean;
      mfaEnforced?: boolean;
    }) => {
      const res = await api.put<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/users/${userId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId, userId] });
    },
  });
}

export function useResetPassword(tenantId: string, userId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ temporaryPassword: string }>>(
        `/admin/tenants/${tenantId}/users/${userId}/reset-password`
      );
      return res.data.data;
    },
  });
}

export function useLockUser(tenantId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/users/${userId}/lock`,
        { reason }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId] });
    },
  });
}

export function useUnlockUser(tenantId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/users/${userId}/unlock`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId] });
    },
  });
}

export function useSetUserRoles(tenantId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (iamRoleIds: string[]) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/users/${userId}/roles`,
        { iamRoleIds }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId, userId] });
    },
  });
}

export function useSetUserGroups(tenantId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupIds: string[]) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/users/${userId}/groups`,
        { groupIds }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId, userId] });
    },
  });
}

// Roles
export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Array<{
        key: string;
        description: string;
        category: string;
      }>>>('/admin/permissions');
      return res.data.data;
    },
  });
}

export function useRoles(tenantId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'roles', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        name: string;
        description?: string;
        permissions: string[];
        isSystem: boolean;
        isActive: boolean;
      }>>(`/admin/tenants/${tenantId}/roles`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateRole(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; permissions: string[] }) => {
      const res = await api.post<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/roles`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles', tenantId] });
    },
  });
}

export function useUpdateRole(tenantId: string, roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; permissions?: string[] }) => {
      const res = await api.put<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/roles/${roleId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles', tenantId] });
    },
  });
}

export function useDeleteRole(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const res = await api.delete<ApiResponse<{ message: string }>>(`/admin/tenants/${tenantId}/roles/${roleId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles', tenantId] });
    },
  });
}

// Groups
export function useGroups(tenantId: string, params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'groups', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        name: string;
        description?: string;
        memberCount: number;
        roles: Array<{ id: string; name: string }>;
        isActive: boolean;
      }>>(`/admin/tenants/${tenantId}/groups`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useGroup(tenantId: string, groupId: string) {
  return useQuery({
    queryKey: ['admin', 'groups', tenantId, groupId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/groups/${groupId}`);
      return res.data.data;
    },
    enabled: !!tenantId && !!groupId,
  });
}

export function useCreateGroup(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; members?: string[]; roles?: string[] }) => {
      const res = await api.post<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/groups`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId] });
    },
  });
}

export function useUpdateGroup(tenantId: string, groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; isActive?: boolean }) => {
      const res = await api.put<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/groups/${groupId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId, groupId] });
    },
  });
}

export function useManageGroupMembers(tenantId: string, groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { action: 'add' | 'remove'; userIds: string[] }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/groups/${groupId}/members`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId, groupId] });
    },
  });
}

export function useManageGroupRoles(tenantId: string, groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { action: 'add' | 'remove'; roleIds: string[] }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/groups/${groupId}/roles`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId, groupId] });
    },
  });
}

export function useDeleteGroup(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const res = await api.delete<ApiResponse<{ message: string }>>(`/admin/tenants/${tenantId}/groups/${groupId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', tenantId] });
    },
  });
}

// Access Requests
export function useAccessRequests(tenantId: string, params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'access-requests', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        requestorEmail: string;
        requestedRoleIds: Array<{ id: string; name: string }>;
        reason: string;
        status: string;
        createdAt: string;
      }>>(`/admin/tenants/${tenantId}/access-requests`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useApproveAccessRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/access-requests/${requestId}/approve`,
        { notes }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-requests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
    },
  });
}

export function useRejectAccessRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/access-requests/${requestId}/reject`,
        { notes }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-requests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
    },
  });
}

// API Keys
export function useApiKeys(tenantId: string, params?: { page?: number; limit?: number; includeRevoked?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'api-keys', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: string[];
        owner: { email?: string; name: string } | null;
        lastUsedAt?: string;
        expiresAt?: string;
        revokedAt?: string;
        isExpired: boolean;
      }>>(`/admin/tenants/${tenantId}/api-keys`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateApiKey(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; scopes: string[]; expiresAt?: string }) => {
      const res = await api.post<ApiResponse<{ apiKey: unknown; plainTextKey: string }>>(
        `/admin/tenants/${tenantId}/api-keys`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys', tenantId] });
    },
  });
}

export function useRevokeApiKey(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ keyId, reason }: { keyId: string; reason?: string }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/api-keys/${keyId}/revoke`,
        { reason }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys', tenantId] });
    },
  });
}

// Audit Logs
export function useAuditLogs(tenantId: string, params?: {
  page?: number;
  limit?: number;
  actorEmail?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        actorEmail: string;
        action: string;
        targetType: string;
        targetId: string;
        targetName?: string;
        summary: string;
        createdAt: string;
        ip?: string;
      }>>(`/admin/tenants/${tenantId}/audit-logs`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useExportAuditLogs(tenantId: string) {
  return useMutation({
    mutationFn: async (params?: { startDate?: string; endDate?: string; action?: string }) => {
      const res = await api.get(`/admin/tenants/${tenantId}/audit-logs/export`, {
        params,
        responseType: 'blob',
      });
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

// Access Reviews
export function useAccessReviews(tenantId: string, params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'access-reviews', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        name: string;
        status: string;
        dueAt: string;
        itemCount: number;
        completedItemCount: number;
        completionPercentage: number;
        createdAt: string;
      }>>(`/admin/tenants/${tenantId}/access-reviews`, { params });
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useAccessReviewItems(tenantId: string, reviewId: string, params?: { page?: number; decision?: string }) {
  return useQuery({
    queryKey: ['admin', 'access-reviews', tenantId, reviewId, 'items', params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<{
        id: string;
        userEmail: string;
        userName: string;
        currentRoles: Array<{ id: string; name: string }>;
        currentGroups: Array<{ id: string; name: string }>;
        decision: string;
        reviewerEmail?: string;
        reviewedAt?: string;
        notes?: string;
      }>>(`/admin/tenants/${tenantId}/access-reviews/${reviewId}/items`, { params });
      return res.data;
    },
    enabled: !!tenantId && !!reviewId,
  });
}

export function useCreateAccessReview(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; dueAt: string; userIds?: string[] }) => {
      const res = await api.post<ApiResponse<{ review: unknown; itemCount: number }>>(
        `/admin/tenants/${tenantId}/access-reviews`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-reviews', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
    },
  });
}

export function useAccessReviewDecision(tenantId: string, reviewId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { itemId: string; decision: string; newRoles?: string[]; notes?: string }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/access-reviews/${reviewId}/items/${data.itemId}/decision`,
        { decision: data.decision, newRoles: data.newRoles, notes: data.notes }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-reviews', tenantId, reviewId] });
    },
  });
}

export function useCloseAccessReview(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/access-reviews/${reviewId}/close`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-reviews', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
    },
  });
}
