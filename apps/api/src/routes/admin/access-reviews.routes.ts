/**
 * Admin Access Reviews Routes
 * Access review management endpoints for compliance
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  IamPermission,
  IamAuditAction,
  AccessReviewStatus,
  AccessReviewDecision,
  PaginationDefaults,
} from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  validate,
  NotFoundError,
  ForbiddenError,
} from '../../middleware/index.js';
import {
  AccessReview,
  AccessReviewItem,
  User,
  IamRole,
  Group,
} from '../../db/models/index.js';
import { logIamActionFromRequest } from '../../services/index.js';
import { getUserPermissions } from '../../middleware/iam-auth.js';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueAt: z.string().datetime(),
  userIds: z.array(z.string()).optional(),
});

const decisionSchema = z.object({
  decision: z.nativeEnum(AccessReviewDecision),
  newRoles: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * GET /admin/tenants/:tenantId/access-reviews
 * List access reviews
 */
router.get(
  '/tenants/:tenantId/access-reviews',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
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

      const [reviews, total] = await Promise.all([
        AccessReview.find(filter)
          .populate('createdBy', 'email firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AccessReview.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: reviews,
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
 * GET /admin/tenants/:tenantId/access-reviews/:reviewId
 * Get access review details
 */
router.get(
  '/tenants/:tenantId/access-reviews/:reviewId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, reviewId } = req.params;

      const review = await AccessReview.findOne({ _id: reviewId, tenantId })
        .populate('createdBy', 'email firstName lastName')
        .populate('closedBy', 'email firstName lastName');

      if (!review) {
        throw new NotFoundError('Access review not found');
      }

      res.json({
        success: true,
        data: review,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/access-reviews
 * Create a new access review
 */
router.post(
  '/tenants/:tenantId/access-reviews',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  validate(createReviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { name, description, dueAt, userIds } = req.body;

      // Get users to review
      let usersToReview;
      if (userIds?.length) {
        usersToReview = await User.find({
          _id: { $in: userIds },
          tenantId,
          isActive: true,
        }).populate('iamRoles', 'name').populate('groups', 'name');
      } else {
        // Review all active users in tenant
        usersToReview = await User.find({
          tenantId,
          isActive: true,
        }).populate('iamRoles', 'name').populate('groups', 'name');
      }

      // Create review
      const review = await AccessReview.create({
        tenantId,
        name,
        description,
        status: AccessReviewStatus.OPEN,
        dueAt: new Date(dueAt),
        createdBy: req.user!.userId,
        itemCount: usersToReview.length,
        completedItemCount: 0,
      });

      // Create review items for each user
      const reviewItems = await Promise.all(
        usersToReview.map(async (user) => {
          const permissions = await getUserPermissions(user._id.toString());
          const iamRoles = user.iamRoles as unknown as Array<{ _id: string; name: string }>;
          const groups = user.groups as unknown as Array<{ _id: string; name: string }>;

          return AccessReviewItem.create({
            tenantId,
            reviewId: review._id,
            userId: user._id,
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`,
            currentRoles: iamRoles.map(r => ({ id: r._id, name: r.name })),
            currentPermissions: Array.from(permissions),
            currentGroups: groups.map(g => ({ id: g._id, name: g.name })),
            decision: AccessReviewDecision.PENDING,
          });
        })
      );

      await logIamActionFromRequest(
        req,
        IamAuditAction.ACCESS_REVIEW_CREATED,
        'AccessReview',
        review._id.toString(),
        `Created access review ${name} with ${reviewItems.length} users`,
        {
          targetName: name,
          after: { name, dueAt, userCount: reviewItems.length },
        }
      );

      res.status(201).json({
        success: true,
        data: {
          review,
          itemCount: reviewItems.length,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/access-reviews/:reviewId/items
 * Get review items
 */
router.get(
  '/tenants/:tenantId/access-reviews/:reviewId/items',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, reviewId } = req.params;
      const page = parseInt(req.query.page as string) || PaginationDefaults.PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PaginationDefaults.LIMIT,
        PaginationDefaults.MAX_LIMIT
      );
      const decision = req.query.decision as string;

      const review = await AccessReview.findOne({ _id: reviewId, tenantId });
      if (!review) {
        throw new NotFoundError('Access review not found');
      }

      const filter: Record<string, unknown> = { reviewId };
      if (decision) {
        filter.decision = decision;
      }

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        AccessReviewItem.find(filter)
          .sort({ userEmail: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AccessReviewItem.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: items,
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
 * POST /admin/tenants/:tenantId/access-reviews/:reviewId/items/:itemId/decision
 * Make a decision on a review item
 */
router.post(
  '/tenants/:tenantId/access-reviews/:reviewId/items/:itemId/decision',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_DECIDE),
  validate(decisionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, reviewId, itemId } = req.params;
      const { decision, newRoles, notes } = req.body;

      const review = await AccessReview.findOne({ _id: reviewId, tenantId });
      if (!review) {
        throw new NotFoundError('Access review not found');
      }

      if (review.status === AccessReviewStatus.CLOSED) {
        throw new ForbiddenError('Access review is closed');
      }

      const item = await AccessReviewItem.findOne({ _id: itemId, reviewId });
      if (!item) {
        throw new NotFoundError('Review item not found');
      }

      const wasCompleted = item.decision !== AccessReviewDecision.PENDING;

      // Update the item
      item.decision = decision;
      item.reviewerId = req.user!.userId as unknown as typeof item.reviewerId;
      item.reviewerEmail = req.user!.email;
      item.reviewedAt = new Date();
      item.notes = notes;

      if (decision === AccessReviewDecision.CHANGE && newRoles) {
        item.newRoles = newRoles;
      }

      await item.save();

      // Apply decision to user if not 'keep'
      if (decision === AccessReviewDecision.REMOVE) {
        await User.findByIdAndUpdate(item.userId, {
          $set: { iamRoles: [], groups: [] },
        });
      } else if (decision === AccessReviewDecision.CHANGE && newRoles) {
        await User.findByIdAndUpdate(item.userId, {
          $set: { iamRoles: newRoles },
        });
      }

      // Update review completion count
      if (!wasCompleted) {
        review.completedItemCount += 1;
        await review.save();
      }

      await logIamActionFromRequest(
        req,
        IamAuditAction.ACCESS_REVIEW_DECISION,
        'AccessReviewItem',
        itemId,
        `Made ${decision} decision for ${item.userEmail}`,
        {
          targetName: item.userEmail,
          after: { decision, newRoles, notes },
        }
      );

      res.json({
        success: true,
        data: { message: 'Decision recorded successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/access-reviews/:reviewId/close
 * Close an access review
 */
router.post(
  '/tenants/:tenantId/access-reviews/:reviewId/close',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, reviewId } = req.params;

      const review = await AccessReview.findOne({ _id: reviewId, tenantId });
      if (!review) {
        throw new NotFoundError('Access review not found');
      }

      if (review.status === AccessReviewStatus.CLOSED) {
        throw new ForbiddenError('Access review is already closed');
      }

      review.status = AccessReviewStatus.CLOSED;
      review.closedAt = new Date();
      review.closedBy = req.user!.userId as unknown as typeof review.closedBy;
      await review.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.ACCESS_REVIEW_CLOSED,
        'AccessReview',
        reviewId,
        `Closed access review ${review.name}`,
        {
          targetName: review.name,
          after: {
            completedItems: review.completedItemCount,
            totalItems: review.itemCount,
          },
        }
      );

      res.json({
        success: true,
        data: { message: 'Access review closed successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/access-reviews/:reviewId/export
 * Export access review as evidence pack (CSV)
 */
router.get(
  '/tenants/:tenantId/access-reviews/:reviewId/export',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, reviewId } = req.params;

      const review = await AccessReview.findOne({ _id: reviewId, tenantId })
        .populate('createdBy', 'email firstName lastName')
        .populate('closedBy', 'email firstName lastName');

      if (!review) {
        throw new NotFoundError('Access review not found');
      }

      const items = await AccessReviewItem.find({ reviewId }).lean();

      // Build CSV
      const headers = [
        'User Email',
        'User Name',
        'Current Roles',
        'Current Groups',
        'Decision',
        'New Roles',
        'Reviewer Email',
        'Reviewed At',
        'Notes',
      ];

      const rows = items.map(item => [
        item.userEmail,
        item.userName,
        item.currentRoles.map(r => r.name).join('; '),
        item.currentGroups.map(g => g.name).join('; '),
        item.decision,
        item.newRoles ? item.newRoles.join('; ') : '',
        item.reviewerEmail || '',
        item.reviewedAt ? item.reviewedAt.toISOString() : '',
        item.notes || '',
      ]);

      const escapeField = (field: string): string => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      const csvLines = [
        `# Access Review: ${review.name}`,
        `# Created: ${review.createdAt.toISOString()}`,
        `# Status: ${review.status}`,
        `# Completed: ${review.completedItemCount}/${review.itemCount}`,
        '',
        headers.map(escapeField).join(','),
        ...rows.map(row => row.map(escapeField).join(',')),
      ];

      const csv = csvLines.join('\n');
      const filename = `access-review-${reviewId}-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
