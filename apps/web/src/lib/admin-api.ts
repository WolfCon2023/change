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
        primaryRole?: string;
        accessibleTenants?: string[];
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
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
      const res = await api.get<PaginatedResponse<AdminUser>>(`/admin/tenants/${tenantId}/users`, { params });
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
      phoneNumber?: string;
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

export function useUpdateUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      email?: string;
      phoneNumber?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      primaryRole?: string;
      isActive?: boolean;
      mfaEnforced?: boolean;
    }) => {
      const { userId, ...updateData } = data;
      const res = await api.put<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/users/${userId}`, updateData);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId, variables.userId] });
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

export function useDeleteUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/users/${userId}`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
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

export function useUpdateRole(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { roleId: string; name?: string; description?: string; permissions?: string[] }) => {
      const { roleId, ...updateData } = data;
      const res = await api.put<ApiResponse<unknown>>(`/admin/tenants/${tenantId}/roles/${roleId}`, updateData);
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | null;
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
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-reviews', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-reviews', tenantId, reviewId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', tenantId] });
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

// =============================================================================
// ADVISOR ASSIGNMENTS
// =============================================================================

export interface AdvisorAssignment {
  id: string;
  advisorId: string;
  advisor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
  } | null;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  } | null;
  status: string;
  isActive: boolean;
  isPrimary: boolean;
  notes?: string;
  assignedAt: string;
  unassignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Advisor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
}

export interface TenantOption {
  id: string;
  name: string;
  slug: string;
}

export function useAdvisorAssignments(params?: { advisorId?: string; tenantId?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'advisor-assignments', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdvisorAssignment[]>>('/admin/advisor-assignments', { params });
      return res.data.data;
    },
  });
}

export function useAdvisors() {
  return useQuery({
    queryKey: ['admin', 'advisors'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Advisor[]>>('/admin/advisors');
      return res.data.data;
    },
  });
}

export function useTenantsList() {
  return useQuery({
    queryKey: ['admin', 'tenants-list'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TenantOption[]>>('/admin/tenants-list');
      return res.data.data;
    },
  });
}

export function useCreateAdvisorAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { advisorId: string; tenantId: string; isPrimary?: boolean; notes?: string }) => {
      const res = await api.post<ApiResponse<AdvisorAssignment>>('/admin/advisor-assignments', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'advisor-assignments'] });
    },
  });
}

export function useUpdateAdvisorAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assignmentId: string; isPrimary?: boolean; notes?: string; status?: string }) => {
      const { assignmentId, ...updateData } = data;
      const res = await api.put<ApiResponse<AdvisorAssignment>>(`/admin/advisor-assignments/${assignmentId}`, updateData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'advisor-assignments'] });
    },
  });
}

export function useDeleteAdvisorAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.delete<ApiResponse<{ message: string }>>(`/admin/advisor-assignments/${assignmentId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'advisor-assignments'] });
    },
  });
}

// =============================================================================
// TENANT SETTINGS
// =============================================================================

export interface TenantSettings {
  id: string;
  tenantId: string;
  auditLoggingEnabled: boolean;
  auditRetentionDays: number;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  passwordExpiryDays: number;
  emailNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useTenantSettings(tenantId: string) {
  return useQuery({
    queryKey: ['admin', 'tenant-settings', tenantId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TenantSettings>>(`/admin/tenants/${tenantId}/settings`);
      return res.data.data;
    },
    enabled: !!tenantId,
  });
}

export function useUpdateTenantSettings(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Omit<TenantSettings, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>) => {
      const res = await api.put<ApiResponse<TenantSettings>>(`/admin/tenants/${tenantId}/settings`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenant-settings', tenantId] });
    },
  });
}

export function useToggleAuditLogging(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await api.patch<ApiResponse<{ auditLoggingEnabled: boolean }>>(
        `/admin/tenants/${tenantId}/settings/audit-logging`,
        { enabled }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenant-settings', tenantId] });
    },
  });
}

// =============================================================================
// ACCESS REVIEW CAMPAIGNS
// =============================================================================

import type {
  AccessReviewCampaign,
  AccessReviewCampaignCreateRequest,
  AccessReviewCampaignUpdateRequest,
  AccessReviewCampaignSubmitRequest,
  AccessReviewCampaignApproveRequest,
  AccessReviewCampaignRemediateRequest,
  AccessReviewCampaignCompleteRequest,
  AccessReviewCampaignFilters,
} from '@change/shared';

export function useAccessReviewCampaigns(tenantId: string, params?: Partial<AccessReviewCampaignFilters>) {
  return useQuery({
    queryKey: ['admin', 'access-review-campaigns', tenantId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns`,
        { params }
      );
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useAccessReviewCampaign(tenantId: string, campaignId: string) {
  return useQuery({
    queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId],
    queryFn: async () => {
      // Guard against undefined or empty campaignId
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }
      const res = await api.get<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}`
      );
      return res.data.data;
    },
    enabled: !!tenantId && !!campaignId,
    retry: false, // Don't retry if campaignId is invalid
  });
}

export function useCreateAccessReviewCampaign(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccessReviewCampaignCreateRequest) => {
      const res = await api.post<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
    },
  });
}

export function useUpdateAccessReviewCampaign(tenantId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccessReviewCampaignUpdateRequest) => {
      const res = await api.put<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId] });
    },
  });
}

export function useSubmitAccessReviewCampaign(tenantId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccessReviewCampaignSubmitRequest) => {
      const res = await api.post<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}/submit`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId] });
    },
  });
}

export function useApproveAccessReviewCampaign(tenantId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccessReviewCampaignApproveRequest) => {
      const res = await api.post<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}/approve`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId] });
    },
  });
}

export function useRemediateAccessReviewCampaign(tenantId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccessReviewCampaignRemediateRequest) => {
      const res = await api.post<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}/remediate`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId] });
    },
  });
}

export function useCompleteAccessReviewCampaign(tenantId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccessReviewCampaignCompleteRequest) => {
      const res = await api.post<ApiResponse<AccessReviewCampaign>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}/complete`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId] });
    },
  });
}

export function useDeleteAccessReviewCampaign(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await api.delete<ApiResponse<{ message: string }>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
    },
  });
}

// Smart Suggestions Response Type
export interface SmartSuggestion {
  itemId: string;
  subjectId: string;
  suggestedDecision: string;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  requiresManualReview: boolean;
  riskScore: number;
}

export interface SmartSuggestionsResponse {
  suggestions: SmartSuggestion[];
  summary: {
    totalItems: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    requireManualReview: number;
    averageRiskScore: number;
    highRiskItems: number;
  };
}

export function useAccessReviewSuggestions(tenantId: string, campaignId: string) {
  return useQuery({
    queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId, 'suggestions'],
    queryFn: async () => {
      // Guard against undefined or empty campaignId
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }
      const res = await api.get<ApiResponse<SmartSuggestionsResponse>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}/suggestions`
      );
      return res.data.data;
    },
    enabled: !!tenantId && !!campaignId,
    retry: false,
  });
}

// Bulk Decision Request Type
export interface BulkDecisionRequest {
  targetType: 'all' | 'filtered' | 'selected';
  itemIds?: string[];
  filter?: {
    privilegeLevel?: string;
    entitlementType?: string;
    dataClassification?: string;
  };
  decision: {
    decisionType: string;
    reasonCode?: string;
    comments?: string;
  };
  skipHighRisk?: boolean;
}

export interface BulkDecisionResult {
  totalProcessed: number;
  successful: number;
  skipped: number;
  failed: number;
  skippedItems?: Array<{ itemId: string; reason: string }>;
}

export function useBulkAccessReviewDecision(tenantId: string, campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkDecisionRequest) => {
      const res = await api.post<ApiResponse<BulkDecisionResult>>(
        `/admin/tenants/${tenantId}/access-review-campaigns/${campaignId}/bulk-decision`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'access-review-campaigns', tenantId, campaignId, 'suggestions'] });
    },
  });
}
