/**
 * Middleware Index
 * Export all middleware functions
 */

// Error handling
export {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TenantAccessError,
  InvalidTransitionError,
  errorHandler,
  notFoundHandler,
} from './error-handler.js';

// Authentication & RBAC (TRS-ARCH-002)
export {
  authenticate,
  optionalAuth,
  loadUser,
  requireRoles,
  requireMinRole,
  requirePlatformRole,
  requireClientRole,
  requireAdmin,
  hasRole,
  hasMinRole,
} from './auth.js';

// Multi-tenant (TRS-ARCH-001)
export {
  resolveTenant,
  requireTenant,
  enforceTenantIsolation,
  tenantFilter,
  verifyResourceTenant,
  canAccessTenant,
} from './tenant.js';

// Validation
export { validate, validateMultiple } from './validate.js';

// IAM Authorization
export {
  loadIamPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireCrossTenantAccess,
  requireTenantAccess,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canAccessTenant as canAccessTenantByRole,
  getAccessibleTenants,
} from './iam-auth.js';
