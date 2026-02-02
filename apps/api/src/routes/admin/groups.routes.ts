/**
 * Admin Groups Routes
 * Group management endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IamPermission, IamAuditAction, PaginationDefaults, PrimaryRole } from '@change/shared';
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
const createGroupBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  members: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
});

const updateGroupBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

const manageMembersBodySchema = z.object({
  action: z.enum(['add', 'remove']),
  userIds: z.array(z.string()).min(1),
});

const manageRolesBodySchema = z.object({
  action: z.enum(['add', 'remove']),
  roleIds: z.array(z.string()).min(1),
});

/**
 * GET /admin/tenants/:tenantId/groups
 * List groups (IT_ADMIN sees all including platform groups)
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

      // Build base filter
      // IT_ADMIN can see tenant groups AND platform groups
      let baseFilter: Record<string, unknown>;
      
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        baseFilter = {
          $or: [
            { tenantId: tenantId },
            { isPlatformGroup: true },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        baseFilter = { tenantId: tenantId };
      }
      
      // Combine with search if provided
      let filter: Record<string, unknown>;
      if (search) {
        filter = { $and: [baseFilter, { name: { $regex: search, $options: 'i' } }] };
      } else {
        filter = baseFilter;
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

      // Transform _id to id and add member count for frontend compatibility
      const transformedGroups = groups.map(g => ({
        ...g,
        id: g._id?.toString(),
        memberCount: g.members?.length || 0,
        roles: g.roles?.map((role: { _id?: unknown; name?: string }) => ({
          id: role._id?.toString(),
          name: role.name,
        })),
      }));

      res.json({
        success: true,
        data: transformedGroups,
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
 * IT_ADMIN can view platform groups as well as tenant groups
 */
router.get(
  '/tenants/:tenantId/groups/:groupId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;

      // IT_ADMIN can see platform groups (isPlatformGroup: true or no tenantId)
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: groupId,
          $or: [
            { tenantId: tenantId },
            { isPlatformGroup: true },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: groupId, tenantId: tenantId };
      }

      const group = await Group.findOne(query)
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
  validate(createGroupBodySchema),
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
 * IT_ADMIN can update platform groups as well as tenant groups
 */
router.put(
  '/tenants/:tenantId/groups/:groupId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_WRITE),
  validate(updateGroupBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;
      const updates = req.body;

      // IT_ADMIN can update platform groups
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: groupId,
          $or: [
            { tenantId: tenantId },
            { isPlatformGroup: true },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: groupId, tenantId: tenantId };
      }

      const group = await Group.findOne(query);
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
 * IT_ADMIN can manage platform group members
 */
router.post(
  '/tenants/:tenantId/groups/:groupId/members',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_MANAGE_MEMBERS),
  validate(manageMembersBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;
      const { action, userIds } = req.body;

      // IT_ADMIN can manage platform groups
      let groupQuery: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        groupQuery = {
          _id: groupId,
          $or: [
            { tenantId: tenantId },
            { isPlatformGroup: true },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        groupQuery = { _id: groupId, tenantId: tenantId };
      }

      const group = await Group.findOne(groupQuery);
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // For platform groups, allow users from any tenant or platform users
      // For tenant groups, verify users belong to tenant
      let userQuery: Record<string, unknown>;
      if (group.isPlatformGroup || !group.tenantId) {
        // Platform group - accept any user
        userQuery = { _id: { $in: userIds } };
      } else {
        // Tenant group - users must belong to the tenant
        userQuery = { _id: { $in: userIds }, tenantId: tenantId };
      }

      const users = await User.find(userQuery);

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
 * IT_ADMIN can manage platform group roles
 */
router.post(
  '/tenants/:tenantId/groups/:groupId/roles',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_ASSIGN),
  validate(manageRolesBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;
      const { action, roleIds } = req.body;

      // IT_ADMIN can manage platform groups
      let groupQuery: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        groupQuery = {
          _id: groupId,
          $or: [
            { tenantId: tenantId },
            { isPlatformGroup: true },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        groupQuery = { _id: groupId, tenantId: tenantId };
      }

      const group = await Group.findOne(groupQuery);
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
 * IT_ADMIN can delete platform groups as well as tenant groups
 */
router.delete(
  '/tenants/:tenantId/groups/:groupId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_DELETE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, groupId } = req.params;

      // IT_ADMIN can delete platform groups
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: groupId,
          $or: [
            { tenantId: tenantId },
            { isPlatformGroup: true },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: groupId, tenantId: tenantId };
      }

      const group = await Group.findOne(query);
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
