/**
 * Admin Audit Logs Routes
 * Audit log endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IamPermission, PaginationDefaults, PrimaryRole } from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  validate,
} from '../../middleware/index.js';
import { queryIamAuditLogs, exportIamAuditLogs } from '../../services/index.js';

const router = Router();

// Validation schemas - for query parameters
const auditLogQuerySchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : PaginationDefaults.PAGE),
  limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), PaginationDefaults.MAX_LIMIT) : PaginationDefaults.LIMIT),
  actorId: z.string().optional(),
  actorEmail: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * GET /admin/tenants/:tenantId/audit-logs
 * Query audit logs
 */
router.get(
  '/tenants/:tenantId/audit-logs',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_READ),
  validate(auditLogQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const {
        page,
        limit,
        actorId,
        actorEmail,
        action,
        targetType,
        targetId,
        startDate,
        endDate,
      } = req.query as {
        page: number;
        limit: number;
        actorId?: string;
        actorEmail?: string;
        action?: string;
        targetType?: string;
        targetId?: string;
        startDate?: string;
        endDate?: string;
      };

      // IT_ADMIN can see platform-level logs (auth events, etc.)
      const includePlatformLogs = req.primaryRole === PrimaryRole.IT_ADMIN;

      const result = await queryIamAuditLogs({
        tenantId,
        actorId,
        actorEmail,
        action: action as Parameters<typeof queryIamAuditLogs>[0]['action'],
        targetType,
        targetId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page,
        limit,
        includePlatformLogs,
      });

      res.json({
        success: true,
        data: result.logs,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/audit-logs/export
 * Export audit logs as CSV
 */
router.get(
  '/tenants/:tenantId/audit-logs/export',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_EXPORT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { actorId, action, targetType, startDate, endDate } = req.query;

      const csv = await exportIamAuditLogs({
        tenantId,
        actorId: actorId as string,
        action: action as Parameters<typeof exportIamAuditLogs>[0]['action'],
        targetType: targetType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      const filename = `audit-logs-${tenantId}-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/audit-logs/actions
 * Get available action types for filtering
 */
router.get(
  '/tenants/:tenantId/audit-logs/actions',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;

      // Get distinct actions from the database
      const { IamAuditLog } = await import('../../db/models/index.js');
      const actions = await IamAuditLog.distinct('action', { tenantId });

      res.json({
        success: true,
        data: actions.sort(),
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants/:tenantId/audit-logs/target-types
 * Get available target types for filtering
 */
router.get(
  '/tenants/:tenantId/audit-logs/target-types',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_AUDIT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;

      // Get distinct target types from the database
      const { IamAuditLog } = await import('../../db/models/index.js');
      const targetTypes = await IamAuditLog.distinct('targetType', { tenantId });

      res.json({
        success: true,
        data: targetTypes.sort(),
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
