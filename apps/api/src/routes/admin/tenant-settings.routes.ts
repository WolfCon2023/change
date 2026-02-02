/**
 * Admin Tenant Settings Routes
 * Settings management endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IamPermission } from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  validate,
} from '../../middleware/index.js';
import { TenantSettings } from '../../db/models/tenant-settings.model.js';

const router = Router();

// Validation schema for updating settings
const updateSettingsSchema = z.object({
  auditLoggingEnabled: z.boolean().optional(),
  auditRetentionDays: z.number().min(30).max(2555).optional(),
  mfaRequired: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
  maxFailedLoginAttempts: z.number().min(3).max(10).optional(),
  passwordExpiryDays: z.number().min(0).max(365).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

/**
 * GET /admin/tenants/:tenantId/settings
 * Get tenant settings
 */
router.get(
  '/tenants/:tenantId/settings',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;

      // Find or create settings for this tenant
      let settings = await TenantSettings.findOne({ tenantId }).lean();
      
      if (!settings) {
        // Create default settings if none exist
        const newSettings = await TenantSettings.create({ tenantId });
        settings = newSettings.toJSON();
      }

      res.json({
        success: true,
        data: settings,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /admin/tenants/:tenantId/settings
 * Update tenant settings
 */
router.put(
  '/tenants/:tenantId/settings',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_READ), // Could be a separate permission in the future
  validate(updateSettingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const updates = req.body;

      // Find or create settings, then update
      const settings = await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: updates },
        { new: true, upsert: true }
      ).lean();

      res.json({
        success: true,
        data: settings,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/tenants/:tenantId/settings/audit-logging
 * Toggle audit logging on/off
 */
router.patch(
  '/tenants/:tenantId/settings/audit-logging',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'enabled must be a boolean' },
        });
      }

      const settings = await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: { auditLoggingEnabled: enabled } },
        { new: true, upsert: true }
      ).lean();

      res.json({
        success: true,
        data: { auditLoggingEnabled: settings?.auditLoggingEnabled ?? true },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
