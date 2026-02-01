/**
 * Admin Access Requests Routes
 * Access request management endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  IamPermission,
  IamAuditAction,
  AccessRequestStatus,
  PaginationDefaults,
} from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  requireAnyPermission,
  validate,
  NotFoundError,
  ForbiddenError,
} from '../../middleware/index.js';
import { AccessRequest, IamRole, User } from '../../db/models/index.js';
import { logIamActionFromRequest } from '../../services/index.js';

const router = Router();

// Validation schemas
const createAccessRequestSchema = z.object({
  body: z.object({
    requestedRoleIds: z.array(z.string()).optional(),
    requestedPermissions: z.array(z.string()).optional(),
    reason: z.string().min(10).max(2000),
    effectiveUntil: z.string().datetime().optional(),
  }),
});

const decisionSchema = z.object({
  params: z.object({
    requestId: z.string(),
  }),
  body: z.object({
    notes: z.string().max(2000).optional(),
  }),
});

/**
 * GET /admin/tenants/:tenantId/access-requests
 * List access requests
 */
router.get(
  '/tenants/:tenantId/access-requests',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REQUEST_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const page = parseInt(req.query.page as string) || PaginationDefaults.PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PaginationDefaults.LIMIT,
        PaginationDefaults.MAX_LIMIT
      );
      const status = req.query.status as string;

      const filter: Record<string, unknown> = { tenantId };
      if (status) {
        filter.status = status;
      }

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        AccessRequest.find(filter)
          .populate('requestedRoleIds', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AccessRequest.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: requests,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/access-requests/:requestId
 * Get access request details
 */
router.get(
  '/tenants/:tenantId/access-requests/:requestId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REQUEST_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, requestId } = req.params;

      const request = await AccessRequest.findOne({ _id: requestId, tenantId })
        .populate('requestedRoleIds');

      if (!request) {
        throw new NotFoundError('Access request not found');
      }

      res.json({
        success: true,
        data: request,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/access-requests
 * Create a new access request (can be done by any user)
 */
router.post(
  '/tenants/:tenantId/access-requests',
  authenticate,
  loadIamPermissions,
  requireAnyPermission(
    IamPermission.IAM_ACCESS_REQUEST_CREATE,
    IamPermission.IAM_ACCESS_REQUEST_APPROVE
  ),
  validate(createAccessRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { requestedRoleIds, requestedPermissions, reason, effectiveUntil } = req.body;

      if (!requestedRoleIds?.length && !requestedPermissions?.length) {
        throw new ForbiddenError('Must request at least one role or permission');
      }

      // Verify requested roles exist
      if (requestedRoleIds?.length) {
        const roles = await IamRole.find({
          _id: { $in: requestedRoleIds },
          $or: [{ tenantId }, { tenantId: { $exists: false } }],
          isActive: true,
        });

        if (roles.length !== requestedRoleIds.length) {
          throw new NotFoundError('One or more requested roles not found');
        }
      }

      const requestor = await User.findById(req.user!.userId);
      if (!requestor) {
        throw new NotFoundError('User not found');
      }

      const accessRequest = await AccessRequest.create({
        tenantId,
        requestorId: req.user!.userId,
        requestorEmail: req.user!.email,
        requestedRoleIds: requestedRoleIds || [],
        requestedPermissions: requestedPermissions || [],
        reason,
        status: AccessRequestStatus.PENDING,
        effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : undefined,
      });

      await logIamActionFromRequest(
        req,
        IamAuditAction.ACCESS_REQUEST_CREATED,
        'AccessRequest',
        accessRequest._id.toString(),
        `Created access request`,
        {
          after: {
            requestedRoleIds,
            requestedPermissions,
            reason,
          },
        }
      );

      res.status(201).json({
        success: true,
        data: accessRequest,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/access-requests/:requestId/approve
 * Approve an access request
 */
router.post(
  '/tenants/:tenantId/access-requests/:requestId/approve',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REQUEST_APPROVE),
  validate(decisionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, requestId } = req.params;
      const { notes } = req.body;

      const accessRequest = await AccessRequest.findOne({ _id: requestId, tenantId });
      if (!accessRequest) {
        throw new NotFoundError('Access request not found');
      }

      if (accessRequest.status !== AccessRequestStatus.PENDING) {
        throw new ForbiddenError('Access request is not pending');
      }

      // Apply the requested roles to the user
      const user = await User.findById(accessRequest.requestorId);
      if (!user) {
        throw new NotFoundError('Requestor not found');
      }

      if (accessRequest.requestedRoleIds.length > 0) {
        user.iamRoles.addToSet(...accessRequest.requestedRoleIds);
        await user.save();
      }

      // Update access request
      accessRequest.status = AccessRequestStatus.APPROVED;
      accessRequest.approverId = req.user!.userId as unknown as typeof accessRequest.approverId;
      accessRequest.approverEmail = req.user!.email;
      accessRequest.approverNotes = notes;
      accessRequest.decidedAt = new Date();
      await accessRequest.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.ACCESS_REQUEST_APPROVED,
        'AccessRequest',
        requestId,
        `Approved access request for ${accessRequest.requestorEmail}`,
        {
          targetName: accessRequest.requestorEmail,
          after: { decision: 'approved', notes },
        }
      );

      res.json({
        success: true,
        data: { message: 'Access request approved successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/access-requests/:requestId/reject
 * Reject an access request
 */
router.post(
  '/tenants/:tenantId/access-requests/:requestId/reject',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REQUEST_APPROVE),
  validate(decisionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, requestId } = req.params;
      const { notes } = req.body;

      const accessRequest = await AccessRequest.findOne({ _id: requestId, tenantId });
      if (!accessRequest) {
        throw new NotFoundError('Access request not found');
      }

      if (accessRequest.status !== AccessRequestStatus.PENDING) {
        throw new ForbiddenError('Access request is not pending');
      }

      accessRequest.status = AccessRequestStatus.REJECTED;
      accessRequest.approverId = req.user!.userId as unknown as typeof accessRequest.approverId;
      accessRequest.approverEmail = req.user!.email;
      accessRequest.approverNotes = notes;
      accessRequest.decidedAt = new Date();
      await accessRequest.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.ACCESS_REQUEST_REJECTED,
        'AccessRequest',
        requestId,
        `Rejected access request for ${accessRequest.requestorEmail}`,
        {
          targetName: accessRequest.requestorEmail,
          after: { decision: 'rejected', notes },
        }
      );

      res.json({
        success: true,
        data: { message: 'Access request rejected' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
