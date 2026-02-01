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
        User.countDocuments({ tenantId }),
        User.countDocuments({ tenantId, isActive: true }),
        User.countDocuments({ tenantId, lockedAt: { $exists: true } }),
        User.countDocuments({ tenantId, mfaEnabled: true }),
        IamRole.countDocuments({
          $or: [{ tenantId }, { tenantId: { $exists: false } }],
          isActive: true,
        }),
        Group.countDocuments({ tenantId, isActive: true }),
        AccessRequest.countDocuments({ tenantId, status: 'pending' }),
        AccessReview.countDocuments({ tenantId, status: { $in: ['open', 'in_progress'] } }),
      ]);

      // Get users without MFA
      const usersWithoutMfa = await User.find({
        tenantId,
        isActive: true,
        mfaEnabled: false,
      })
        .select('email firstName lastName')
        .limit(10)
        .lean();

      // Get expiring API keys (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringApiKeys = await ApiKey.find({
        tenantId,
        revokedAt: { $exists: false },
        expiresAt: { $lte: thirtyDaysFromNow, $gte: new Date() },
      })
        .select('name expiresAt')
        .limit(10)
        .lean();

      // Get recent IAM changes
      const { IamAuditLog } = await import('../../db/models/index.js');
      const recentIamChanges = await IamAuditLog.find({ tenantId })
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

// Mount sub-routes
router.use(usersRoutes);
router.use(rolesRoutes);
router.use(groupsRoutes);
router.use(apiKeysRoutes);
router.use(auditLogsRoutes);
router.use(accessRequestsRoutes);
router.use(accessReviewsRoutes);

export default router;
