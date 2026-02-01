/**
 * Admin API Keys Routes
 * API key management endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IamPermission, IamAuditAction, PaginationDefaults } from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  validate,
  NotFoundError,
  ForbiddenError,
} from '../../middleware/index.js';
import { ApiKey, ServiceAccount, User } from '../../db/models/index.js';
import { logIamActionFromRequest } from '../../services/index.js';

const router = Router();

// Validation schemas
const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    ownerType: z.enum(['user', 'service_account']).optional(),
    ownerId: z.string().optional(),
    scopes: z.array(z.string()).min(1),
    expiresAt: z.string().datetime().optional(),
  }),
});

const revokeApiKeySchema = z.object({
  params: z.object({
    keyId: z.string(),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

/**
 * GET /admin/tenants/:tenantId/api-keys
 * List API keys
 */
router.get(
  '/tenants/:tenantId/api-keys',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_API_KEY_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const page = parseInt(req.query.page as string) || PaginationDefaults.PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PaginationDefaults.LIMIT,
        PaginationDefaults.MAX_LIMIT
      );
      const includeRevoked = req.query.includeRevoked === 'true';

      const filter: Record<string, unknown> = { tenantId };
      if (!includeRevoked) {
        filter.revokedAt = { $exists: false };
      }

      const skip = (page - 1) * limit;

      const [keys, total] = await Promise.all([
        ApiKey.find(filter)
          .populate('createdBy', 'email firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ApiKey.countDocuments(filter),
      ]);

      // Get owner info
      const keysWithOwner = await Promise.all(
        keys.map(async (key) => {
          let ownerInfo = null;
          if (key.ownerType === 'user') {
            const user = await User.findById(key.ownerId).select('email firstName lastName').lean();
            ownerInfo = user ? { email: user.email, name: `${user.firstName} ${user.lastName}` } : null;
          } else if (key.ownerType === 'service_account') {
            const sa = await ServiceAccount.findById(key.ownerId).select('name').lean();
            ownerInfo = sa ? { name: sa.name } : null;
          }
          return {
            ...key,
            owner: ownerInfo,
            isExpired: key.expiresAt ? new Date(key.expiresAt) < new Date() : false,
          };
        })
      );

      res.json({
        success: true,
        data: keysWithOwner,
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
 * POST /admin/tenants/:tenantId/api-keys
 * Create a new API key (returns plaintext key once)
 */
router.post(
  '/tenants/:tenantId/api-keys',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_API_KEY_WRITE),
  validate(createApiKeySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { name, ownerType, ownerId, scopes, expiresAt } = req.body;

      // Default to current user if not specified
      const finalOwnerType = ownerType || 'user';
      const finalOwnerId = ownerId || req.user!.userId;

      // Verify owner exists
      if (finalOwnerType === 'user') {
        const user = await User.findById(finalOwnerId);
        if (!user) {
          throw new NotFoundError('Owner user not found');
        }
      } else if (finalOwnerType === 'service_account') {
        const sa = await ServiceAccount.findOne({ _id: finalOwnerId, tenantId });
        if (!sa) {
          throw new NotFoundError('Service account not found');
        }
      }

      // Generate key
      const { plainText, prefix, hash } = ApiKey.generateKey();

      const apiKey = await ApiKey.create({
        tenantId,
        ownerType: finalOwnerType,
        ownerId: finalOwnerId,
        name,
        keyPrefix: prefix,
        keyHash: hash,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdBy: req.user!.userId,
      });

      await logIamActionFromRequest(
        req,
        IamAuditAction.API_KEY_CREATED,
        'ApiKey',
        apiKey._id.toString(),
        `Created API key ${name}`,
        {
          targetName: name,
          after: { name, scopes, expiresAt },
        }
      );

      res.status(201).json({
        success: true,
        data: {
          apiKey: apiKey.toJSON(),
          plainTextKey: plainText, // Only returned once
        },
        meta: {
          timestamp: new Date().toISOString(),
          warning: 'Store this key securely. It will not be shown again.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/api-keys/:keyId/revoke
 * Revoke an API key
 */
router.post(
  '/tenants/:tenantId/api-keys/:keyId/revoke',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_API_KEY_REVOKE),
  validate(revokeApiKeySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, keyId } = req.params;
      const { reason } = req.body;

      const apiKey = await ApiKey.findOne({ _id: keyId, tenantId });
      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      if (apiKey.revokedAt) {
        throw new ForbiddenError('API key is already revoked');
      }

      apiKey.revokedAt = new Date();
      apiKey.revokedBy = req.user!.userId as unknown as typeof apiKey.revokedBy;
      apiKey.revokeReason = reason;
      await apiKey.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.API_KEY_REVOKED,
        'ApiKey',
        keyId,
        `Revoked API key ${apiKey.name}`,
        {
          targetName: apiKey.name,
          after: { reason },
        }
      );

      res.json({
        success: true,
        data: { message: 'API key revoked successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/api-keys/:keyId
 * Get API key details
 */
router.get(
  '/tenants/:tenantId/api-keys/:keyId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_API_KEY_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, keyId } = req.params;

      const apiKey = await ApiKey.findOne({ _id: keyId, tenantId })
        .populate('createdBy', 'email firstName lastName')
        .populate('revokedBy', 'email firstName lastName');

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      // Get owner info
      let ownerInfo = null;
      if (apiKey.ownerType === 'user') {
        const user = await User.findById(apiKey.ownerId).select('email firstName lastName').lean();
        ownerInfo = user ? { email: user.email, name: `${user.firstName} ${user.lastName}` } : null;
      } else if (apiKey.ownerType === 'service_account') {
        const sa = await ServiceAccount.findById(apiKey.ownerId).select('name').lean();
        ownerInfo = sa ? { name: sa.name } : null;
      }

      res.json({
        success: true,
        data: {
          ...apiKey.toJSON(),
          owner: ownerInfo,
          isExpired: apiKey.expiresAt ? new Date(apiKey.expiresAt) < new Date() : false,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
