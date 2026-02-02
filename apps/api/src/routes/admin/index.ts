/**
 * Admin Routes Index
 * IAM Administration Portal API routes
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  IamPermission,
  IamPermissionCatalog,
  UserRole,
  PaginationDefaults,
  PrimaryRole,
} from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requireAnyPermission,
  getAccessibleTenants,
} from '../../middleware/index.js';
import { User, IamRole, Group, AccessRequest, AccessReview, ApiKey, Tenant } from '../../db/models/index.js';

import usersRoutes from './users.routes.js';
import rolesRoutes from './roles.routes.js';
import groupsRoutes from './groups.routes.js';
import apiKeysRoutes from './api-keys.routes.js';
import auditLogsRoutes from './audit-logs.routes.js';
import accessRequestsRoutes from './access-requests.routes.js';
import accessReviewsRoutes from './access-reviews.routes.js';
import advisorAssignmentsRoutes from './advisor-assignments.routes.js';
import tenantSettingsRoutes from './tenant-settings.routes.js';
import accessReviewCampaignsRoutes from './access-review-campaigns.routes.js';

const router = Router();

/**
 * GET /admin/me
 * Get current admin context (user, permissions, roles)
 */
router.get(
  '/me',
  authenticate,
  loadIamPermissions,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.currentUser;
      const primaryRole = req.primaryRole || PrimaryRole.CUSTOMER;
      
      // Determine which tenants this user can access
      let tenantId = req.user?.tenantId;
      let accessibleTenants: string[] = [];
      
      // For IT_ADMIN, get all tenants; for ADVISOR, get assigned tenants
      if (primaryRole === PrimaryRole.IT_ADMIN || primaryRole === PrimaryRole.ADVISOR) {
        const tenantAccess = await getAccessibleTenants(
          req.user!.userId,
          primaryRole,
          req.user?.tenantId
        );
        
        if (tenantAccess === 'all') {
          // IT_ADMIN: Get all active tenants
          const allTenants = await Tenant.find({ isActive: true }).select('_id').lean();
          accessibleTenants = allTenants.map(t => t._id.toString());
        } else {
          accessibleTenants = tenantAccess;
        }
        
        // Default to first accessible tenant if user doesn't have one
        if (!tenantId && accessibleTenants.length > 0) {
          tenantId = accessibleTenants[0];
        }
      } else if (tenantId) {
        accessibleTenants = [tenantId];
      }
      
      res.json({
        success: true,
        data: {
          user: user?.toJSON(),
          permissions: req.iamPermissions ? Array.from(req.iamPermissions) : [],
          roles: req.iamRoles || [],
          tenantId,
          accessibleTenants,
          primaryRole,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/dashboard
 * Get IAM dashboard statistics
 */
router.get(
  '/tenants/:tenantId/dashboard',
  authenticate,
  loadIamPermissions,
  requireAnyPermission(IamPermission.IAM_USER_READ, IamPermission.IAM_AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const primaryRole = req.primaryRole;
      const isItAdmin = primaryRole === PrimaryRole.IT_ADMIN;

      // For IT_ADMIN, include platform-level entities (those without tenantId)
      const userQuery = isItAdmin
        ? { $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }] }
        : { tenantId };

      const groupQuery = isItAdmin
        ? { $or: [{ tenantId, isActive: true }, { isPlatformGroup: true, isActive: true }] }
        : { tenantId, isActive: true };

      // Get user stats
      const [
        totalUsers,
        activeUsers,
        lockedUsers,
        mfaEnabledUsers,
        totalRoles,
        totalGroups,
        pendingAccessRequests,
        openAccessReviews,
      ] = await Promise.all([
        User.countDocuments(userQuery),
        User.countDocuments({ ...userQuery, isActive: true }),
        User.countDocuments({ ...userQuery, lockedAt: { $exists: true } }),
        User.countDocuments({ ...userQuery, mfaEnabled: true }),
        IamRole.countDocuments({
          $or: [{ tenantId }, { tenantId: { $exists: false } }],
          isActive: true,
        }),
        Group.countDocuments(groupQuery),
        AccessRequest.countDocuments({ tenantId, status: 'pending' }),
        AccessReview.countDocuments({ tenantId, status: { $in: ['open', 'in_progress'] } }),
      ]);

      // Get users without MFA
      const usersWithoutMfa = await User.find({
        ...userQuery,
        isActive: true,
        mfaEnabled: false,
      })
        .select('email firstName lastName')
        .limit(10)
        .lean();

      // Get expiring API keys (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const apiKeyQuery = isItAdmin
        ? { $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }] }
        : { tenantId };
      
      const expiringApiKeys = await ApiKey.find({
        ...apiKeyQuery,
        revokedAt: { $exists: false },
        expiresAt: { $lte: thirtyDaysFromNow, $gte: new Date() },
      })
        .select('name expiresAt')
        .limit(10)
        .lean();

      // Get recent IAM changes
      const { IamAuditLog } = await import('../../db/models/index.js');
      const auditQuery = isItAdmin
        ? { $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }] }
        : { tenantId };
      const recentIamChanges = await IamAuditLog.find(auditQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const mfaCoverage = totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          lockedUsers,
          mfaEnabledUsers,
          mfaCoverage,
          totalRoles,
          totalGroups,
          pendingAccessRequests,
          openAccessReviews,
          usersWithoutMfa: usersWithoutMfa.map(u => ({
            id: u._id.toString(),
            email: u.email,
            name: `${u.firstName} ${u.lastName}`,
          })),
          expiringApiKeys: expiringApiKeys.map(k => ({
            id: k._id.toString(),
            name: k.name,
            expiresAt: k.expiresAt,
          })),
          recentIamChanges,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/security-gaps
 * Get comprehensive security gap analysis
 */
router.get(
  '/tenants/:tenantId/security-gaps',
  authenticate,
  loadIamPermissions,
  requireAnyPermission(IamPermission.IAM_USER_READ, IamPermission.IAM_AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const primaryRole = req.primaryRole;
      const isItAdmin = primaryRole === PrimaryRole.IT_ADMIN;

      // Build queries based on role
      const userQuery = isItAdmin
        ? { $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }] }
        : { tenantId };

      const groupQuery = isItAdmin
        ? { $or: [{ tenantId, isActive: true }, { isPlatformGroup: true, isActive: true }] }
        : { tenantId, isActive: true };

      // Gather all the data we need
      const [
        allUsers,
        allGroups,
        allRoles,
        allApiKeys,
        accessReviews,
      ] = await Promise.all([
        User.find({ ...userQuery, isActive: true }).lean(),
        Group.find(groupQuery).lean(),
        IamRole.find({ $or: [{ tenantId }, { tenantId: { $exists: false } }], isActive: true }).lean(),
        ApiKey.find({ 
          ...(isItAdmin ? { $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }] } : { tenantId }),
          revokedAt: { $exists: false } 
        }).lean(),
        AccessReview.find({ tenantId }).lean(),
      ]);

      const gaps: Array<{
        id: string;
        category: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        title: string;
        description: string;
        affectedItems: Array<{ id: string; name: string; detail?: string }>;
        recommendation: string;
        complianceFrameworks: string[];
      }> = [];

      // =========================================================================
      // GAP 1: Users without MFA (Critical)
      // =========================================================================
      const usersWithoutMfa = allUsers.filter(u => !u.mfaEnabled);
      if (usersWithoutMfa.length > 0) {
        gaps.push({
          id: 'mfa-not-enabled',
          category: 'Authentication',
          severity: usersWithoutMfa.length > 5 ? 'critical' : 'high',
          title: 'Users Without MFA',
          description: `${usersWithoutMfa.length} active users do not have multi-factor authentication enabled, increasing the risk of unauthorized access.`,
          affectedItems: usersWithoutMfa.slice(0, 10).map(u => ({
            id: u._id.toString(),
            name: `${u.firstName} ${u.lastName}`,
            detail: u.email,
          })),
          recommendation: 'Enable MFA for all users, especially those with administrative or elevated privileges.',
          complianceFrameworks: ['SOC2', 'ISO 27001', 'NIST 800-53', 'PCI-DSS'],
        });
      }

      // =========================================================================
      // GAP 2: Inactive Users (Medium)
      // =========================================================================
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const inactiveUsers = allUsers.filter(u => 
        !u.lastLoginAt || new Date(u.lastLoginAt) < thirtyDaysAgo
      );
      if (inactiveUsers.length > 0) {
        gaps.push({
          id: 'inactive-users',
          category: 'Access Management',
          severity: inactiveUsers.length > 10 ? 'high' : 'medium',
          title: 'Inactive User Accounts',
          description: `${inactiveUsers.length} users have not logged in within the last 30 days but still have active access.`,
          affectedItems: inactiveUsers.slice(0, 10).map(u => ({
            id: u._id.toString(),
            name: `${u.firstName} ${u.lastName}`,
            detail: u.lastLoginAt ? `Last login: ${new Date(u.lastLoginAt).toLocaleDateString()}` : 'Never logged in',
          })),
          recommendation: 'Review inactive accounts and disable or remove access for users who no longer need it.',
          complianceFrameworks: ['SOC2', 'ISO 27001', 'NIST 800-53'],
        });
      }

      // =========================================================================
      // GAP 3: Excessive Admin Access (High)
      // =========================================================================
      const adminRoles = allRoles.filter(r => 
        r.name.toLowerCase().includes('admin') || 
        r.permissions?.some((p: string) => p.includes('WRITE') || p.includes('DELETE') || p.includes('ADMIN'))
      );
      const adminRoleIds = new Set(adminRoles.map(r => r._id.toString()));
      
      // Find users with admin roles through groups
      const adminGroups = allGroups.filter(g => 
        g.roles?.some((roleId: string) => adminRoleIds.has(roleId.toString()))
      );
      const usersInAdminGroups = new Set<string>();
      adminGroups.forEach(g => {
        g.members?.forEach((m: { userId: string }) => usersInAdminGroups.add(m.userId.toString()));
      });

      const usersWithAdminAccess = allUsers.filter(u => 
        u.roles?.some((r: string) => adminRoleIds.has(r.toString())) ||
        usersInAdminGroups.has(u._id.toString())
      );

      const adminPercentage = allUsers.length > 0 
        ? Math.round((usersWithAdminAccess.length / allUsers.length) * 100) 
        : 0;

      if (adminPercentage > 20) {
        gaps.push({
          id: 'excessive-admin-access',
          category: 'Privilege Management',
          severity: adminPercentage > 40 ? 'critical' : 'high',
          title: 'Excessive Administrative Access',
          description: `${adminPercentage}% of users (${usersWithAdminAccess.length}) have administrative privileges, which exceeds the recommended threshold of 20%.`,
          affectedItems: usersWithAdminAccess.slice(0, 10).map(u => ({
            id: u._id.toString(),
            name: `${u.firstName} ${u.lastName}`,
            detail: u.email,
          })),
          recommendation: 'Review admin access assignments and apply the principle of least privilege. Consider creating more granular roles.',
          complianceFrameworks: ['SOC2', 'ISO 27001', 'NIST 800-53', 'PCI-DSS'],
        });
      }

      // =========================================================================
      // GAP 4: API Keys Without Expiration or Expiring Soon (Medium)
      // =========================================================================
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const problematicApiKeys = allApiKeys.filter(k => 
        !k.expiresAt || // No expiration
        new Date(k.expiresAt) < thirtyDaysFromNow // Expiring soon
      );

      if (problematicApiKeys.length > 0) {
        const noExpiration = problematicApiKeys.filter(k => !k.expiresAt);
        const expiringSoon = problematicApiKeys.filter(k => k.expiresAt && new Date(k.expiresAt) < thirtyDaysFromNow && new Date(k.expiresAt) > now);
        const expired = problematicApiKeys.filter(k => k.expiresAt && new Date(k.expiresAt) < now);

        gaps.push({
          id: 'api-key-management',
          category: 'API Security',
          severity: noExpiration.length > 0 || expired.length > 0 ? 'high' : 'medium',
          title: 'API Key Management Issues',
          description: `${noExpiration.length} API keys have no expiration, ${expiringSoon.length} are expiring within 30 days, and ${expired.length} have expired.`,
          affectedItems: problematicApiKeys.slice(0, 10).map(k => ({
            id: k._id.toString(),
            name: k.name,
            detail: k.expiresAt 
              ? `Expires: ${new Date(k.expiresAt).toLocaleDateString()}`
              : 'No expiration set',
          })),
          recommendation: 'Set expiration dates for all API keys and implement a regular rotation schedule.',
          complianceFrameworks: ['SOC2', 'ISO 27001', 'OWASP'],
        });
      }

      // =========================================================================
      // GAP 5: No Recent Access Reviews (High)
      // =========================================================================
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const recentReviews = accessReviews.filter(r => 
        r.completedAt && new Date(r.completedAt) > ninetyDaysAgo
      );

      if (recentReviews.length === 0) {
        gaps.push({
          id: 'no-recent-access-reviews',
          category: 'Compliance',
          severity: 'high',
          title: 'No Recent Access Reviews',
          description: 'No access reviews have been completed in the last 90 days. Regular access reviews are essential for maintaining least privilege.',
          affectedItems: [],
          recommendation: 'Implement a quarterly access review process. Create an Access Review Campaign to review all user permissions.',
          complianceFrameworks: ['SOC2', 'ISO 27001', 'NIST 800-53', 'HIPAA'],
        });
      }

      // =========================================================================
      // GAP 6: Users Without Group Membership (Low)
      // =========================================================================
      const allGroupMemberIds = new Set<string>();
      allGroups.forEach(g => {
        g.members?.forEach((m: { userId: string }) => allGroupMemberIds.add(m.userId.toString()));
      });

      const usersWithoutGroups = allUsers.filter(u => !allGroupMemberIds.has(u._id.toString()));
      if (usersWithoutGroups.length > 0) {
        gaps.push({
          id: 'users-without-groups',
          category: 'Access Management',
          severity: 'low',
          title: 'Users Not Assigned to Groups',
          description: `${usersWithoutGroups.length} users are not members of any group, which may indicate incomplete provisioning.`,
          affectedItems: usersWithoutGroups.slice(0, 10).map(u => ({
            id: u._id.toString(),
            name: `${u.firstName} ${u.lastName}`,
            detail: u.email,
          })),
          recommendation: 'Assign users to appropriate groups based on their job function and access requirements.',
          complianceFrameworks: ['SOC2', 'ISO 27001'],
        });
      }

      // =========================================================================
      // GAP 7: Separation of Duties - Users with Conflicting Roles (High)
      // =========================================================================
      // Check for users who have both "approve" and "request" type permissions
      const usersWithConflicts: Array<{ user: typeof allUsers[0]; conflicts: string[] }> = [];
      
      for (const user of allUsers) {
        const userRoleIds = new Set(user.roles?.map((r: string) => r.toString()) || []);
        const userGroupIds = user.groups?.map((g: string) => g.toString()) || [];
        
        // Get all roles from user's groups
        for (const group of allGroups) {
          if (userGroupIds.includes(group._id.toString())) {
            group.roles?.forEach((r: string) => userRoleIds.add(r.toString()));
          }
        }
        
        // Get all permissions for this user
        const userPermissions = new Set<string>();
        for (const role of allRoles) {
          if (userRoleIds.has(role._id.toString())) {
            role.permissions?.forEach((p: string) => userPermissions.add(p));
          }
        }
        
        // Check for SoD conflicts
        const conflicts: string[] = [];
        if (userPermissions.has(IamPermission.IAM_USER_WRITE) && userPermissions.has(IamPermission.IAM_ROLE_WRITE)) {
          conflicts.push('Can create users AND assign roles (potential privilege escalation)');
        }
        if (userPermissions.has(IamPermission.IAM_ACCESS_REQUEST_WRITE) && userPermissions.has(IamPermission.IAM_ACCESS_REQUEST_APPROVE)) {
          conflicts.push('Can create AND approve access requests');
        }
        
        if (conflicts.length > 0) {
          usersWithConflicts.push({ user, conflicts });
        }
      }

      if (usersWithConflicts.length > 0) {
        gaps.push({
          id: 'separation-of-duties',
          category: 'Privilege Management',
          severity: 'high',
          title: 'Separation of Duties Violations',
          description: `${usersWithConflicts.length} users have conflicting permissions that violate separation of duties principles.`,
          affectedItems: usersWithConflicts.slice(0, 10).map(({ user, conflicts }) => ({
            id: user._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            detail: conflicts.join('; '),
          })),
          recommendation: 'Implement role-based access controls that enforce separation of duties. Split conflicting permissions across different roles.',
          complianceFrameworks: ['SOC2', 'ISO 27001', 'SOX', 'PCI-DSS'],
        });
      }

      // =========================================================================
      // Calculate overall security score
      // =========================================================================
      const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
      const maxScore = 100;
      const totalDeductions = gaps.reduce((sum, gap) => sum + severityWeights[gap.severity], 0);
      const securityScore = Math.max(0, maxScore - totalDeductions);

      // Count by severity
      const gapsBySeverity = {
        critical: gaps.filter(g => g.severity === 'critical').length,
        high: gaps.filter(g => g.severity === 'high').length,
        medium: gaps.filter(g => g.severity === 'medium').length,
        low: gaps.filter(g => g.severity === 'low').length,
      };

      // Count by category
      const gapsByCategory: Record<string, number> = {};
      gaps.forEach(g => {
        gapsByCategory[g.category] = (gapsByCategory[g.category] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          securityScore,
          totalGaps: gaps.length,
          gapsBySeverity,
          gapsByCategory,
          gaps,
          summary: {
            totalUsers: allUsers.length,
            mfaCoverage: allUsers.length > 0 
              ? Math.round(((allUsers.length - usersWithoutMfa.length) / allUsers.length) * 100) 
              : 100,
            adminAccessPercentage: adminPercentage,
            inactiveUserPercentage: allUsers.length > 0 
              ? Math.round((inactiveUsers.length / allUsers.length) * 100) 
              : 0,
            apiKeysWithIssues: problematicApiKeys.length,
            lastAccessReview: recentReviews.length > 0 
              ? recentReviews.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0].completedAt
              : null,
          },
          analyzedAt: new Date().toISOString(),
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mount sub-routes
router.use(usersRoutes);
router.use(rolesRoutes);
router.use(groupsRoutes);
router.use(apiKeysRoutes);
router.use(auditLogsRoutes);
router.use(accessRequestsRoutes);
router.use(accessReviewsRoutes);
router.use(advisorAssignmentsRoutes);
router.use(tenantSettingsRoutes);
router.use(accessReviewCampaignsRoutes);

export default router;
