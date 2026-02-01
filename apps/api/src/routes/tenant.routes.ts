import { Router } from 'express';
import mongoose from 'mongoose';
import { tenantCreateRequestSchema, tenantUpdateRequestSchema, AuditAction } from '@change/shared';
import { Tenant } from '../db/models/index.js';
import { AuditService } from '../services/audit.service.js';
import {
  validate,
  authenticate,
  requireAdmin,
  requirePlatformRole,
  NotFoundError,
  ConflictError,
} from '../middleware/index.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * GET /tenants
 * List all tenants (admin only)
 */
router.get(
  '/',
  authenticate,
  requirePlatformRole,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tenants = await Tenant.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        data: tenants,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            total: tenants.length,
            page: 1,
            limit: tenants.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenants/:id
 * Get tenant by ID
 */
router.get(
  '/:id',
  authenticate,
  requirePlatformRole,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id!)) {
        throw new NotFoundError('Tenant');
      }

      const tenant = await Tenant.findById(id);
      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      res.json({
        success: true,
        data: tenant,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /tenants
 * Create a new tenant (admin only)
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(tenantCreateRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, slug, settings } = req.body;

      // Check if slug already exists
      const existingTenant = await Tenant.findOne({ slug });
      if (existingTenant) {
        throw new ConflictError('Tenant with this slug already exists');
      }

      const tenant = new Tenant({
        name,
        slug,
        settings: settings ?? {},
        isActive: true,
      });

      await tenant.save();

      // Audit log
      await AuditService.logFromRequest(req, {
        action: AuditAction.TENANT_CREATED,
        resourceType: 'Tenant',
        resourceId: tenant._id.toString(),
        newState: tenant.toJSON(),
      });

      res.status(201).json({
        success: true,
        data: tenant,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /tenants/:id
 * Update tenant (admin only)
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(tenantUpdateRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id!)) {
        throw new NotFoundError('Tenant');
      }

      const tenant = await Tenant.findById(id);
      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const previousState = tenant.toJSON();

      // Update fields
      const { name, slug, settings } = req.body;
      if (name !== undefined) tenant.name = name;
      if (slug !== undefined) {
        // Check if new slug conflicts
        const existingTenant = await Tenant.findOne({ slug, _id: { $ne: id } });
        if (existingTenant) {
          throw new ConflictError('Tenant with this slug already exists');
        }
        tenant.slug = slug;
      }
      if (settings !== undefined) {
        tenant.settings = { ...tenant.settings, ...settings };
      }

      await tenant.save();

      // Audit log
      await AuditService.logFromRequest(req, {
        action: AuditAction.TENANT_UPDATED,
        resourceType: 'Tenant',
        resourceId: tenant._id.toString(),
        previousState,
        newState: tenant.toJSON(),
      });

      res.json({
        success: true,
        data: tenant,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /tenants/:id
 * Deactivate tenant (soft delete, admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id!)) {
        throw new NotFoundError('Tenant');
      }

      const tenant = await Tenant.findById(id);
      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const previousState = tenant.toJSON();

      // Soft delete
      tenant.isActive = false;
      await tenant.save();

      // Audit log
      await AuditService.logFromRequest(req, {
        action: AuditAction.TENANT_UPDATED,
        resourceType: 'Tenant',
        resourceId: tenant._id.toString(),
        previousState,
        newState: { isActive: false },
        metadata: { action: 'deactivated' },
      });

      res.json({
        success: true,
        data: {
          message: 'Tenant deactivated successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
