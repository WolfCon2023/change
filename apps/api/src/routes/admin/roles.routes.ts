/**
 * Admin Roles Routes
 * Role management endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  IamPermission,
  IamAuditAction,
  IamPermissionCatalog,
  SystemRolePermissions,
  SystemRole,
  PaginationDefaults,
  PrimaryRole,
} from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  validate,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../middleware/index.js';
import { IamRole } from '../../db/models/index.js';
import { logIamActionFromRequest, computeDiff } from '../../services/index.js';

const router = Router();

// Validation schemas
const createRoleBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1),
});

const updateRoleBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /admin/permissions
 * Get the permission catalog
 */
router.get(
  '/permissions',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_READ),
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: IamPermissionCatalog,
      meta: { timestamp: new Date().toISOString() },
    });
  }
);

/**
 * GET /admin/system-roles
 * Get system role definitions
 */
router.get(
  '/system-roles',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_READ),
  (_req: Request, res: Response) => {
    const systemRoles = Object.entries(SystemRolePermissions).map(([key, permissions]) => ({
      key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      permissions,
    }));

    res.json({
      success: true,
      data: systemRoles,
      meta: { timestamp: new Date().toISOString() },
    });
  }
);

/**
 * GET /admin/tenants/:tenantId/roles
 * List roles for a tenant (includes global roles)
 * IT_ADMIN sees ALL roles across ALL tenants
 */
router.get(
  '/tenants/:tenantId/roles',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const isItAdmin = req.primaryRole === PrimaryRole.IT_ADMIN;
      const page = parseInt(req.query.page as string) || PaginationDefaults.PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PaginationDefaults.LIMIT,
        PaginationDefaults.MAX_LIMIT
      );

      // IT_ADMIN sees ALL roles, others see tenant + global roles
      const filter = isItAdmin
        ? {}
        : {
            $or: [
              { tenantId },
              { tenantId: { $exists: false } },
              { tenantId: null },
            ],
          };

      const skip = (page - 1) * limit;

      const [roles, total] = await Promise.all([
        IamRole.find(filter).sort({ isSystem: -1, name: 1 }).skip(skip).limit(limit).lean(),
        IamRole.countDocuments(filter),
      ]);

      // Transform _id to id for frontend compatibility
      const transformedRoles = roles.map(role => ({
        ...role,
        id: role._id?.toString(),
      }));

      res.json({
        success: true,
        data: transformedRoles,
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
 * GET /admin/tenants/:tenantId/roles/:roleId
 * Get role details
 */
router.get(
  '/tenants/:tenantId/roles/:roleId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, roleId } = req.params;

      const role = await IamRole.findOne({
        _id: roleId,
        $or: [
          { tenantId },
          { tenantId: { $exists: false } },
          { tenantId: null },
        ],
      });

      if (!role) {
        throw new NotFoundError('Role not found');
      }

      res.json({
        success: true,
        data: role,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/roles
 * Create a new custom role
 */
router.post(
  '/tenants/:tenantId/roles',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_WRITE),
  validate(createRoleBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { name, description, permissions } = req.body;

      // Check for duplicate name
      const existing = await IamRole.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        $or: [{ tenantId }, { tenantId: { $exists: false } }],
      });

      if (existing) {
        throw new ConflictError('Role name already exists');
      }

      // Validate permissions
      const validPermissions = IamPermissionCatalog.map(p => p.key);
      const invalidPerms = permissions.filter((p: string) => !validPermissions.includes(p as typeof validPermissions[number]));
      if (invalidPerms.length > 0) {
        throw new ConflictError(`Invalid permissions: ${invalidPerms.join(', ')}`);
      }

      const role = await IamRole.create({
        tenantId,
        name,
        description,
        permissions,
        isSystem: false,
        isActive: true,
      });

      await logIamActionFromRequest(
        req,
        IamAuditAction.ROLE_CREATED,
        'IamRole',
        role._id.toString(),
        `Created role ${name}`,
        {
          targetName: name,
          after: { name, description, permissions },
        }
      );

      res.status(201).json({
        success: true,
        data: role,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /admin/tenants/:tenantId/roles/:roleId
 * Update a role
 * IT_ADMIN can update custom roles including platform-level roles
 */
router.put(
  '/tenants/:tenantId/roles/:roleId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_WRITE),
  validate(updateRoleBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, roleId } = req.params;
      const updates = req.body;

      // Look for role in tenant or platform-level (no tenantId)
      const role = await IamRole.findOne({
        _id: roleId,
        $or: [
          { tenantId: tenantId },
          { tenantId: { $exists: false } },
          { tenantId: null },
        ],
      });

      if (!role) {
        throw new NotFoundError('Role not found');
      }

      // Only IT_ADMIN can modify system roles
      if (role.isSystem && req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can modify system roles');
      }

      const beforeState = {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
      };

      // Validate permissions if being updated
      if (updates.permissions) {
        const validPermissions = IamPermissionCatalog.map(p => p.key);
        const invalidPerms = updates.permissions.filter((p: string) => !validPermissions.includes(p as typeof validPermissions[number]));
        if (invalidPerms.length > 0) {
          throw new ConflictError(`Invalid permissions: ${invalidPerms.join(', ')}`);
        }
      }

      Object.assign(role, updates);
      await role.save();

      const afterState = {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
      };

      const diff = computeDiff(beforeState, afterState);

      await logIamActionFromRequest(
        req,
        IamAuditAction.ROLE_UPDATED,
        'IamRole',
        roleId,
        `Updated role ${role.name}`,
        {
          targetName: role.name,
          before: diff.before,
          after: diff.after,
        }
      );

      res.json({
        success: true,
        data: role,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/tenants/:tenantId/roles/:roleId
 * Delete a custom role
 * IT_ADMIN can delete custom roles including platform-level roles
 */
router.delete(
  '/tenants/:tenantId/roles/:roleId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_DELETE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, roleId } = req.params;

      // Look for role in tenant or platform-level (no tenantId)
      const role = await IamRole.findOne({
        _id: roleId,
        $or: [
          { tenantId: tenantId },
          { tenantId: { $exists: false } },
          { tenantId: null },
        ],
      });

      if (!role) {
        throw new NotFoundError('Role not found');
      }

      if (role.isSystem) {
        throw new ForbiddenError('Cannot delete system roles');
      }

      // Soft delete
      role.isActive = false;
      await role.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.ROLE_DELETED,
        'IamRole',
        roleId,
        `Deleted role ${role.name}`,
        { targetName: role.name }
      );

      res.json({
        success: true,
        data: { message: 'Role deleted successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
