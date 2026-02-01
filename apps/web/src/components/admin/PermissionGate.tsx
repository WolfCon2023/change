/**
 * Permission Gate Component
 * Conditionally renders children based on IAM permissions
 */

import { ReactNode } from 'react';
import { useAdminStore } from '@/stores/admin.store';
import type { IamPermissionType } from '@change/shared';

interface PermissionGateProps {
  permission?: IamPermissionType;
  permissions?: IamPermissionType[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, context } = useAdminStore();

  if (!context) {
    return <>{fallback}</>;
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
