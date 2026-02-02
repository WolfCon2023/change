/**
 * Permission Gate Component
 * Conditionally renders children based on IAM permissions or roles
 */

import { ReactNode } from 'react';
import { useAdminStore } from '@/stores/admin.store';
import type { IamPermissionType, PrimaryRoleType } from '@change/shared';

interface PermissionGateProps {
  permission?: IamPermissionType;
  permissions?: IamPermissionType[];
  requireAll?: boolean;
  /** Require a specific role (e.g., IT_ADMIN) */
  role?: PrimaryRoleType;
  /** Require any of these roles */
  roles?: PrimaryRoleType[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, context } = useAdminStore();

  if (!context) {
    return <>{fallback}</>;
  }

  // Role-based check (takes precedence if specified)
  if (role) {
    return context.primaryRole === role ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple roles check
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(context.primaryRole as PrimaryRoleType);
    return hasRole ? <>{children}</> : <>{fallback}</>;
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      const hasAll = permissions.every((p) => hasPermission(p));
      return hasAll ? <>{children}</> : <>{fallback}</>;
    } else {
      return hasAnyPermission(...permissions) ? <>{children}</> : <>{fallback}</>;
    }
  }

  // No permission specified, render children
  return <>{children}</>;
}
