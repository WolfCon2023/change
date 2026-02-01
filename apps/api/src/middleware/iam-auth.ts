/**
 * IAM Authorization Middleware
 * Permission-based access control for the Admin Portal
 */

import type { Request, Response, NextFunction } from 'express';
import {
  type IamPermissionType,
  type PrimaryRoleType,
  type OperationalPermissionType,
  IamPermission,
  UserRole,
  PrimaryRole,
  SystemRolePermissions,
  SystemRole,
  PrimaryRolePermissions,
  AdvisorAssignmentStatus,
} from '@change/shared';
import { ForbiddenError, UnauthorizedError } from './error-handler.js';
import { User, IamRole, Group, AdvisorAssignment, type IUser } from '../db/models/index.js';
import type { Types } from 'mongoose';

// Extend Express Request type for IAM
declare global {
  namespace Express {
    interface Request {
      iamPermissions?: Set<IamPermissionType>;
      operationalPermissions?: Set<OperationalPermissionType>;
      iamRoles?: Array<{ id: string; name: string; permissions: IamPermissionType[] }>;
      primaryRole?: PrimaryRoleType;
    }
  }
}

/**
 * Load IAM permissions for the current user
 * Aggregates permissions from user's primary role, IAM roles, and group memberships
 */
export async function loadIamPermissions(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const iamPermissions = new Set<IamPermissionType>();
    const operationalPermissions = new Set<OperationalPermissionType>();
    const rolesList: Array<{ id: string; name: string; permissions: IamPermissionType[] }> = [];

    // Get the full user with IAM fields
    const user = await User.findById(req.user.userId)
      .populate('iamRoles')
      .populate('groups');

    if (!user) {
      return next();
    }

    // Check if user is locked
    if (user.lockedAt) {
      throw new ForbiddenError('Account is locked: ' + (user.lockReason || 'Contact administrator'));
    }

    // Determine primary role (use new field or derive from legacy)
    const primaryRole = user.primaryRole || derivePrimaryRoleFromLegacy(user.role);
    req.primaryRole = primaryRole;

    // Add permissions from primary role
    const rolePerms = PrimaryRolePermissions[primaryRole];
    if (rolePerms) {
      rolePerms.iam.forEach(p => iamPermissions.add(p));
      rolePerms.operational.forEach(p => operationalPermissions.add(p));
    }

    // Add permissions from legacy role (backward compatibility)
    const legacyRolePermissions = getLegacyRolePermissions(user.role);
    legacyRolePermissions.forEach(p => iamPermissions.add(p));

    // Add permissions from IAM roles
    const iamRoles = user.iamRoles as unknown as Array<{
      _id: Types.ObjectId;
      name: string;
      permissions: IamPermissionType[];
      isActive: boolean;
    }>;

    if (iamRoles && iamRoles.length > 0) {
      for (const role of iamRoles) {
        if (role.isActive) {
          role.permissions.forEach(p => iamPermissions.add(p));
          rolesList.push({
            id: role._id.toString(),
            name: role.name,
            permissions: role.permissions,
          });
        }
      }
    }

    // Add permissions from groups
    const groups = user.groups as unknown as Array<{
      _id: Types.ObjectId;
      roles: Types.ObjectId[];
      isActive: boolean;
    }>;

    if (groups && groups.length > 0) {
      const groupRoleIds = new Set<string>();
      for (const group of groups) {
        if (group.isActive && group.roles) {
          group.roles.forEach(roleId => groupRoleIds.add(roleId.toString()));
        }
      }

      if (groupRoleIds.size > 0) {
        const groupRoles = await IamRole.find({
          _id: { $in: Array.from(groupRoleIds) },
          isActive: true,
        });

        for (const role of groupRoles) {
          role.permissions.forEach(p => iamPermissions.add(p as IamPermissionType));
          // Only add to rolesList if not already present
          if (!rolesList.find(r => r.id === role._id.toString())) {
            rolesList.push({
              id: role._id.toString(),
              name: role.name,
              permissions: role.permissions as IamPermissionType[],
            });
          }
        }
      }
    }

    req.iamPermissions = iamPermissions;
    req.operationalPermissions = operationalPermissions;
    req.iamRoles = rolesList;
    req.currentUser = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Derive primary role from legacy UserRole
 */
function derivePrimaryRoleFromLegacy(legacyRole: string): PrimaryRoleType {
  switch (legacyRole) {
    case UserRole.SYSTEM_ADMIN:
      return PrimaryRole.IT_ADMIN;
    case UserRole.PROGRAM_ADMIN:
      return PrimaryRole.MANAGER;
    case UserRole.ADVISOR:
      return PrimaryRole.ADVISOR;
    default:
      return PrimaryRole.CUSTOMER;
  }
}

/**
 * Map legacy UserRole to IAM permissions (backward compatibility)
 */
function getLegacyRolePermissions(role: string): IamPermissionType[] {
  switch (role) {
    case UserRole.SYSTEM_ADMIN:
      return SystemRolePermissions[SystemRole.GLOBAL_ADMIN];
    case UserRole.PROGRAM_ADMIN:
      return SystemRolePermissions[SystemRole.TENANT_ADMIN];
    case UserRole.ADVISOR:
      return SystemRolePermissions[SystemRole.ADVISOR_ADMIN];
    default:
      // Regular users have minimal IAM permissions
      return [
        IamPermission.IAM_ACCESS_REQUEST_CREATE,
      ];
  }
}

/**
 * Middleware to require specific IAM permission
 */
export function requirePermission(permission: IamPermissionType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.iamPermissions) {
        throw new ForbiddenError('IAM permissions not loaded');
      }

      if (!req.iamPermissions.has(permission)) {
        throw new ForbiddenError(`Permission denied: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(...permissions: IamPermissionType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.iamPermissions) {
        throw new ForbiddenError('IAM permissions not loaded');
      }

      const hasAny = permissions.some(p => req.iamPermissions!.has(p));
      if (!hasAny) {
        throw new ForbiddenError(`Permission denied. Required one of: ${permissions.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require all of the specified permissions
 */
export function requireAllPermissions(...permissions: IamPermissionType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.iamPermissions) {
        throw new ForbiddenError('IAM permissions not loaded');
      }

      const missing = permissions.filter(p => !req.iamPermissions!.has(p));
      if (missing.length > 0) {
        throw new ForbiddenError(`Missing permissions: ${missing.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has cross-tenant permission
 */
export function requireCrossTenantAccess(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.iamPermissions) {
      throw new ForbiddenError('IAM permissions not loaded');
    }

    if (!req.iamPermissions.has(IamPermission.IAM_CROSS_TENANT)) {
      throw new ForbiddenError('Cross-tenant access not permitted');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to enforce tenant access based on primary role
 * - IT_ADMIN: Can access any tenant
 * - MANAGER: Can access only their own tenant
 * - CUSTOMER: Can access only their own tenant
 * - ADVISOR: Can access only tenants with active AdvisorAssignment
 */
export function requireTenantAccess(tenantIdParam: string = 'tenantId') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const targetTenantId = req.params[tenantIdParam];
      if (!targetTenantId) {
        throw new ForbiddenError('Tenant ID required');
      }

      const primaryRole = req.primaryRole;
      const userTenantId = req.user.tenantId;

      // IT_ADMIN can access any tenant
      if (primaryRole === PrimaryRole.IT_ADMIN) {
        return next();
      }

      // MANAGER and CUSTOMER can only access their own tenant
      if (primaryRole === PrimaryRole.MANAGER || primaryRole === PrimaryRole.CUSTOMER) {
        if (userTenantId !== targetTenantId) {
          throw new ForbiddenError('Access denied: You can only access your own tenant');
        }
        return next();
      }

      // ADVISOR can only access assigned tenants
      if (primaryRole === PrimaryRole.ADVISOR) {
        const assignment = await AdvisorAssignment.findOne({
          advisorId: req.user.userId,
          tenantId: targetTenantId,
          status: AdvisorAssignmentStatus.ACTIVE,
          isActive: true,
        });

        if (!assignment) {
          throw new ForbiddenError('Access denied: You are not assigned to this tenant');
        }
        return next();
      }

      // Default deny
      throw new ForbiddenError('Access denied');
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if current user can access the specified tenant
 * Returns true/false without throwing
 */
export async function canAccessTenant(
  userId: string,
  targetTenantId: string,
  primaryRole: PrimaryRoleType,
  userTenantId?: string
): Promise<boolean> {
  // IT_ADMIN can access any tenant
  if (primaryRole === PrimaryRole.IT_ADMIN) {
    return true;
  }

  // MANAGER and CUSTOMER can only access their own tenant
  if (primaryRole === PrimaryRole.MANAGER || primaryRole === PrimaryRole.CUSTOMER) {
    return userTenantId === targetTenantId;
  }

  // ADVISOR can only access assigned tenants
  if (primaryRole === PrimaryRole.ADVISOR) {
    const assignment = await AdvisorAssignment.findOne({
      advisorId: userId,
      tenantId: targetTenantId,
      status: AdvisorAssignmentStatus.ACTIVE,
      isActive: true,
    });
    return !!assignment;
  }

  return false;
}

/**
 * Get all tenant IDs a user can access
 */
export async function getAccessibleTenants(
  userId: string,
  primaryRole: PrimaryRoleType,
  userTenantId?: string
): Promise<string[] | 'all'> {
  // IT_ADMIN can access all tenants
  if (primaryRole === PrimaryRole.IT_ADMIN) {
    return 'all';
  }

  // MANAGER and CUSTOMER can only access their own tenant
  if (primaryRole === PrimaryRole.MANAGER || primaryRole === PrimaryRole.CUSTOMER) {
    return userTenantId ? [userTenantId] : [];
  }

  // ADVISOR can access assigned tenants
  if (primaryRole === PrimaryRole.ADVISOR) {
    const assignments = await AdvisorAssignment.find({
      advisorId: userId,
      status: AdvisorAssignmentStatus.ACTIVE,
      isActive: true,
    }).select('tenantId');
    return assignments.map(a => a.tenantId.toString());
  }

  return [];
}

/**
 * Helper to check permission in code
 */
export function hasPermission(req: Request, permission: IamPermissionType): boolean {
  return req.iamPermissions?.has(permission) ?? false;
}

/**
 * Helper to check any permission in code
 */
export function hasAnyPermission(req: Request, ...permissions: IamPermissionType[]): boolean {
  if (!req.iamPermissions) return false;
  return permissions.some(p => req.iamPermissions!.has(p));
}

/**
 * Helper to check all permissions in code
 */
export function hasAllPermissions(req: Request, ...permissions: IamPermissionType[]): boolean {
  if (!req.iamPermissions) return false;
  return permissions.every(p => req.iamPermissions!.has(p));
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<Set<IamPermissionType>> {
  const permissions = new Set<IamPermissionType>();

  const user = await User.findById(userId)
    .populate('iamRoles')
    .populate({
      path: 'groups',
      populate: { path: 'roles' },
    });

  if (!user) {
    return permissions;
  }

  // Add legacy role permissions
  const legacyPerms = getLegacyRolePermissions(user.role);
  legacyPerms.forEach(p => permissions.add(p));

  // Add IAM role permissions
  const iamRoles = user.iamRoles as unknown as Array<{
    permissions: IamPermissionType[];
    isActive: boolean;
  }>;

  if (iamRoles) {
    for (const role of iamRoles) {
      if (role.isActive) {
        role.permissions.forEach(p => permissions.add(p));
      }
    }
  }

  // Add group role permissions
  const groups = user.groups as unknown as Array<{
    roles: Array<{ permissions: IamPermissionType[]; isActive: boolean }>;
    isActive: boolean;
  }>;

  if (groups) {
    for (const group of groups) {
      if (group.isActive && group.roles) {
        for (const role of group.roles) {
          if (role.isActive) {
            role.permissions.forEach(p => permissions.add(p));
          }
        }
      }
    }
  }

  return permissions;
}
