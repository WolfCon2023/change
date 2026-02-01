/**
 * Admin Groups Routes
 * Group management endpoints for the Admin Portal
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
  ConflictError,
} from '../../middleware/index.js';
import { Group, IamRole, User } from '../../db/models/index.js';
import { logIamActionFromRequest, computeDiff } from '../../services/index.js';

const router = Router();

// Validation schemas
const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    members: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
  }),
});

const updateGroupSchema = z.object({
  params: z.object({
    groupId: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
});

const manageMembersSchema = z.object({
  params: z.object({
    groupId: z.string(),
  }),
  body: z.object({
    action: z.enum(['add', 'remove']),
    userIds: z.array(z.string()).min(1),
  }),
});

const manageRolesSchema = z.object({
  params: z.object({
    groupId: z.string(),
  }),
  body: z.object({
    action: z.enum(['add', 'remove']),
    roleIds: z.array(z.string()).min(1),
  }),
});

/**
 * GET /admin/tenants/:tenantId/groups
 * List groups
 */
router.get(
  '/tenants/:tenantId/groups',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const page = parseInt(req.query.page as string) || PaginationDefaults.PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PaginationDefaults.LIMIT,
        PaginationDefaults.MAX_LIMIT
      );
      const search = req.query.search as string;

      const filter: Record<string, unknown> = { tenantId };
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }

      const skip = (page - 1) * limit;

      const [groups, total] = await Promise.all([
        Group.find(filter)
          .populate('roles', 'name')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Group.countDocuments(filter),
      ]);

      // Add member count
      const groupsWithCount = groups.map(g => ({
        ...g,
        memberCount: g.members?.length || 0,
      }));

      res.json({
        success: true,
        data: groupsWithCount,
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
 * GET /admin/tenants/:tenantId/groups/:groupId
 * Get group details with members
 */
router.get(
  '/tenants/:tenantId/groups/:groupId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;

      const group = await Group.findOne({ _id: groupId, tenantId })
        .populate('roles')
        .populate('members', 'email firstName lastName role isActive')
        .populate('createdBy', 'email firstName lastName');

      if (!group) {
        throw new NotFoundError('Group not found');
      }

      res.json({
        success: true,
        data: group,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/groups
 * Create a new group
 */
router.post(
  '/tenants/:tenantId/groups',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_WRITE),
  validate(createGroupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { name, description, members, roles } = req.body;

      // Check for duplicate name
      const existing = await Group.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        tenantId,
      });

      if (existing) {
        throw new ConflictError('Group name already exists');
      }

      const group = await Group.create({
        tenantId,
        name,
        description,
        members: members || [],
        roles: roles || [],
        isActive: true,
        createdBy: req.user!.userId,
      });

      // Update user group memberships
      if (members && members.length > 0) {
        await User.updateMany(
          { _id: { $in: members } },
          { $addToSet: { groups: group._id } }
        );
      }

      await logIamActionFromRequest(
        req,
        IamAuditAction.GROUP_CREATED,
        'Group',
        group._id.toString(),
        `Created group ${name}`,
        {
          targetName: name,
          after: { name, description, memberCount: members?.length || 0 },
        }
      );

      res.status(201).json({
        success: true,
        data: group,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /admin/tenants/:tenantId/groups/:groupId
 * Update group
 */
router.put(
  '/tenants/:tenantId/groups/:groupId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_WRITE),
  validate(updateGroupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;
      const updates = req.body;

      const group = await Group.findOne({ _id: groupId, tenantId });
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      const beforeState = {
        name: group.name,
        description: group.description,
        isActive: group.isActive,
      };

      Object.assign(group, updates);
      await group.save();

      const afterState = {
        name: group.name,
        description: group.description,
        isActive: group.isActive,
      };

      const diff = computeDiff(beforeState, afterState);

      await logIamActionFromRequest(
        req,
        IamAuditAction.GROUP_UPDATED,
        'Group',
        groupId,
        `Updated group ${group.name}`,
        {
          targetName: group.name,
          before: diff.before,
          after: diff.after,
        }
      );

      res.json({
        success: true,
        data: group,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/groups/:groupId/members
 * Add or remove group members
 */
router.post(
  '/tenants/:tenantId/groups/:groupId/members',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_MANAGE_MEMBERS),
  validate(manageMembersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;
      const { action, userIds } = req.body;

      const group = await Group.findOne({ _id: groupId, tenantId });
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Verify users exist and belong to tenant
      const users = await User.find({
        _id: { $in: userIds },
        tenantId,
      });

      if (users.length !== userIds.length) {
        throw new NotFoundError('One or more users not found');
      }

      if (action === 'add') {
        group.members.addToSet(...userIds);
        await User.updateMany(
          { _id: { $in: userIds } },
          { $addToSet: { groups: groupId } }
        );
      } else {
        group.members.pull(...userIds);
        await User.updateMany(
          { _id: { $in: userIds } },
          { $pull: { groups: groupId } }
        );
      }

      await group.save();

      const userEmails = users.map(u => u.email);
      await logIamActionFromRequest(
        req,
        action === 'add' ? IamAuditAction.GROUP_MEMBER_ADDED : IamAuditAction.GROUP_MEMBER_REMOVED,
        'Group',
        groupId,
        `${action === 'add' ? 'Added' : 'Removed'} ${userIds.length} member(s) ${action === 'add' ? 'to' : 'from'} group ${group.name}`,
        {
          targetName: group.name,
          after: { users: userEmails },
        }
      );

      res.json({
        success: true,
        data: { message: `Members ${action === 'add' ? 'added' : 'removed'} successfully` },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/groups/:groupId/roles
 * Add or remove group roles
 */
router.post(
  '/tenants/:tenantId/groups/:groupId/roles',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_ASSIGN),
  validate(manageRolesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;
      const { action, roleIds } = req.body;

      const group = await Group.findOne({ _id: groupId, tenantId });
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Verify roles exist
      const roles = await IamRole.find({
        _id: { $in: roleIds },
        $or: [{ tenantId }, { tenantId: { $exists: false } }],
        isActive: true,
      });

      if (roles.length !== roleIds.length) {
        throw new NotFoundError('One or more roles not found');
      }

      if (action === 'add') {
        group.roles.addToSet(...roleIds);
      } else {
        group.roles.pull(...roleIds);
      }

      await group.save();

      const roleNames = roles.map(r => r.name);
      await logIamActionFromRequest(
        req,
        IamAuditAction.ROLE_ASSIGNED,
        'Group',
        groupId,
        `${action === 'add' ? 'Added' : 'Removed'} ${roleIds.length} role(s) ${action === 'add' ? 'to' : 'from'} group ${group.name}`,
        {
          targetName: group.name,
          after: { roles: roleNames },
        }
      );

      res.json({
        success: true,
        data: { message: `Roles ${action === 'add' ? 'added' : 'removed'} successfully` },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/tenants/:tenantId/groups/:groupId
 * Delete group
 */
router.delete(
  '/tenants/:tenantId/groups/:groupId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_DELETE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;

      const group = await Group.findOne({ _id: groupId, tenantId });
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Remove group from all users
      await User.updateMany(
        { groups: groupId },
        { $pull: { groups: groupId } }
      );

      // Soft delete
      group.isActive = false;
      await group.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.GROUP_DELETED,
        'Group',
        groupId,
        `Deleted group ${group.name}`,
        { targetName: group.name }
      );

      res.json({
        success: true,
        data: { message: 'Group deleted successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
