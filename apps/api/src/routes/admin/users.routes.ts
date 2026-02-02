/**
 * Admin User Routes
 * User management endpoints for the Admin Portal
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import {
  IamPermission,
  IamAuditAction,
  UserRole,
  PaginationDefaults,
  PrimaryRole,
  type PrimaryRoleType,
  ManagerAssignableRoles,
  SystemRole,
} from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  requireAnyPermission,
  requireTenantAccess,
  validate,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../middleware/index.js';
import { User, IamRole, Group } from '../../db/models/index.js';
import { logIamActionFromRequest, computeDiff } from '../../services/index.js';

const router = Router();

// Validation schemas
const userFiltersSchema = z.object({
  params: z.object({
    tenantId: z.string(),
  }),
  query: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : PaginationDefaults.PAGE),
    limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), PaginationDefaults.MAX_LIMIT) : PaginationDefaults.LIMIT),
    search: z.string().optional(),
    role: z.string().optional(),
    isActive: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
    mfaEnabled: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
    sortBy: z.enum(['email', 'firstName', 'lastName', 'createdAt', 'lastLoginAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

const createUserBodySchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().max(20).optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole).optional(),
  primaryRole: z.nativeEnum(PrimaryRole).optional(),
  iamRoleIds: z.array(z.string()).optional(),
  groupIds: z.array(z.string()).optional(),
  mfaEnforced: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().max(20).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  primaryRole: z.nativeEnum(PrimaryRole).optional(),
  isActive: z.boolean().optional(),
  mfaEnforced: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

/**
 * Check if the requesting user can assign a specific primary role
 * - IT_ADMIN can assign any role
 * - MANAGER can only assign CUSTOMER or MANAGER (not IT_ADMIN or ADVISOR)
 * - Others cannot assign roles
 */
function canAssignRole(actorPrimaryRole: PrimaryRoleType | undefined, targetRole: PrimaryRoleType): boolean {
  if (actorPrimaryRole === PrimaryRole.IT_ADMIN) {
    return true;
  }
  if (actorPrimaryRole === PrimaryRole.MANAGER) {
    return ManagerAssignableRoles.includes(targetRole);
  }
  return false;
}

/**
 * Check if removing a role would leave no IT_ADMINs
 */
async function wouldRemoveLastItAdmin(userId: string, newRole: PrimaryRoleType): Promise<boolean> {
  if (newRole === PrimaryRole.IT_ADMIN) {
    return false; // Not removing IT_ADMIN
  }
  
  // Check if user being modified is currently an IT_ADMIN
  const user = await User.findById(userId);
  if (!user || user.primaryRole !== PrimaryRole.IT_ADMIN) {
    return false;
  }
  
  // Count other IT_ADMINs
  const otherItAdmins = await User.countDocuments({
    _id: { $ne: userId },
    primaryRole: PrimaryRole.IT_ADMIN,
    isActive: true,
  });
  
  return otherItAdmins === 0;
}

const setRolesBodySchema = z.object({
  iamRoleIds: z.array(z.string()),
});

const setGroupsBodySchema = z.object({
  groupIds: z.array(z.string()),
});

/**
 * GET /admin/tenants/:tenantId/users
 * List users with filtering and pagination
 * IT_ADMIN sees all users (platform + tenant), others see only tenant users
 */
router.get(
  '/tenants/:tenantId/users',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      
      // Parse query params manually
      const page = parseInt(req.query.page as string) || PaginationDefaults.PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PaginationDefaults.LIMIT,
        PaginationDefaults.MAX_LIMIT
      );
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const mfaEnabled = req.query.mfaEnabled === 'true' ? true : req.query.mfaEnabled === 'false' ? false : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as string | undefined;

      // Build base filter
      // IT_ADMIN can see all users (platform users without tenantId + tenant users)
      // Others only see their tenant's users
      let baseFilter: Record<string, unknown>;
      
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        // Show users from this tenant OR platform users (no tenantId)
        baseFilter = {
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        baseFilter = { tenantId: tenantId };
      }

      // Build additional filters
      const additionalFilters: Record<string, unknown>[] = [];
      
      if (search) {
        additionalFilters.push({
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
          ],
        });
      }
      if (role) {
        additionalFilters.push({ role: role });
      }
      if (isActive !== undefined) {
        additionalFilters.push({ isActive: isActive });
      }
      if (mfaEnabled !== undefined) {
        additionalFilters.push({ mfaEnabled: mfaEnabled });
      }
      
      // Combine all filters
      let filter: Record<string, unknown>;
      if (additionalFilters.length > 0) {
        filter = { $and: [baseFilter, ...additionalFilters] };
      } else {
        filter = baseFilter;
      }

      // Build sort
      const sort: Record<string, 1 | -1> = {};
      if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1;
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .populate('iamRoles', 'name')
          .populate('groups', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filter),
      ]);

      // Transform _id to id for frontend compatibility
      const transformedUsers = users.map(user => ({
        ...user,
        id: user._id?.toString(),
        roles: user.iamRoles?.map((role: { _id?: unknown; name?: string }) => ({
          id: role._id?.toString(),
          name: role.name,
        })),
        groups: user.groups?.map((group: { _id?: unknown; name?: string }) => ({
          id: group._id?.toString(),
          name: group.name,
        })),
      }));

      res.json({
        success: true,
        data: transformedUsers,
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
 * GET /admin/tenants/:tenantId/users/:userId
 * Get user details
 * IT_ADMIN can view any user including platform users
 */
router.get(
  '/tenants/:tenantId/users/:userId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;

      // Build query based on role
      // IT_ADMIN can view platform users (no tenantId) or tenant users
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query)
        .populate('iamRoles')
        .populate('groups');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: user,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/users
 * Create a new user
 */
router.post(
  '/tenants/:tenantId/users',
  authenticate,
  loadIamPermissions,
  requireTenantAccess('tenantId'),
  requirePermission(IamPermission.IAM_USER_WRITE),
  validate(createUserBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const {
        email,
        phoneNumber,
        password,
        firstName,
        lastName,
        role,
        primaryRole,
        iamRoleIds,
        groupIds,
        mfaEnforced,
        mustChangePassword,
      } = req.body;

      // Determine the target primary role
      const targetPrimaryRole = primaryRole || PrimaryRole.CUSTOMER;

      // Check privilege escalation
      if (!canAssignRole(req.primaryRole, targetPrimaryRole)) {
        throw new ForbiddenError(
          `You cannot assign the ${targetPrimaryRole} role. ` +
          'Managers can only assign Customer or Manager roles.'
        );
      }

      // Check if email already exists
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        throw new ConflictError('Email already in use');
      }

      // Generate temporary password if not provided
      const tempPassword = password || crypto.randomBytes(16).toString('hex');

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || undefined,
        passwordHash: tempPassword, // Will be hashed by pre-save hook
        firstName,
        lastName,
        role: role || UserRole.CLIENT_CONTRIBUTOR,
        primaryRole: targetPrimaryRole,
        tenantId,
        iamRoles: iamRoleIds || [],
        groups: groupIds || [],
        mfaEnforced: mfaEnforced || false,
        mustChangePassword: mustChangePassword ?? !password,
        isActive: true,
      });

      // Log the action
      await logIamActionFromRequest(
        req,
        IamAuditAction.USER_CREATED,
        'User',
        user._id.toString(),
        `Created user ${email}`,
        {
          targetName: `${firstName} ${lastName}`,
          after: { email, firstName, lastName, role: user.role, primaryRole: user.primaryRole },
        }
      );

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          temporaryPassword: !password ? tempPassword : undefined,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /admin/tenants/:tenantId/users/:userId
 * Update user profile
 * IT_ADMIN can update any user including platform users
 */
router.put(
  '/tenants/:tenantId/users/:userId',
  authenticate,
  loadIamPermissions,
  requireTenantAccess('tenantId'),
  requirePermission(IamPermission.IAM_USER_WRITE),
  validate(updateUserBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;
      const updates = req.body;

      // Prevent users from modifying their own role
      if (userId === req.user?.userId && updates.primaryRole) {
        throw new ForbiddenError('You cannot modify your own role');
      }

      // Build query based on role
      // IT_ADMIN can update platform users (no tenantId) or tenant users
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if email is being changed and validate uniqueness
      if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
        const existingUser = await User.findOne({ 
          email: updates.email.toLowerCase(),
          _id: { $ne: userId },
        });
        if (existingUser) {
          throw new ConflictError('Email already in use by another user');
        }
        // Normalize email to lowercase
        updates.email = updates.email.toLowerCase();
      }

      // Check privilege escalation for role changes
      if (updates.primaryRole && updates.primaryRole !== user.primaryRole) {
        if (!canAssignRole(req.primaryRole, updates.primaryRole)) {
          throw new ForbiddenError(
            `You cannot assign the ${updates.primaryRole} role. ` +
            'Managers can only assign Customer or Manager roles.'
          );
        }

        // Prevent removing the last IT_ADMIN
        if (await wouldRemoveLastItAdmin(userId, updates.primaryRole)) {
          throw new ForbiddenError(
            'Cannot remove the last IT Admin from the platform. ' +
            'Assign another IT Admin first.'
          );
        }
      }

      const beforeState = {
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        primaryRole: user.primaryRole,
        isActive: user.isActive,
        mfaEnforced: user.mfaEnforced,
      };

      // Apply updates
      Object.assign(user, updates);
      await user.save();

      const afterState = {
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        primaryRole: user.primaryRole,
        isActive: user.isActive,
        mfaEnforced: user.mfaEnforced,
      };

      const diff = computeDiff(beforeState, afterState);

      // Log the action
      await logIamActionFromRequest(
        req,
        IamAuditAction.USER_UPDATED,
        'User',
        userId,
        `Updated user ${user.email}`,
        {
          targetName: `${user.firstName} ${user.lastName}`,
          before: diff.before,
          after: diff.after,
        }
      );

      res.json({
        success: true,
        data: user,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/users/:userId/reset-password
 * Admin reset password
 * IT_ADMIN can reset password for any user including platform users
 */
router.post(
  '/tenants/:tenantId/users/:userId/reset-password',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_RESET_PASSWORD),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;

      // Build query based on role
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate temporary password
      // Note: Set plain text password - the pre-save hook will hash it
      const tempPassword = crypto.randomBytes(16).toString('hex');
      user.passwordHash = tempPassword;
      user.mustChangePassword = true;
      user.passwordChangedAt = new Date();
      await user.save();

      // Log the action
      await logIamActionFromRequest(
        req,
        IamAuditAction.USER_PASSWORD_RESET,
        'User',
        userId,
        `Reset password for ${user.email}`,
        { targetName: `${user.firstName} ${user.lastName}` }
      );

      res.json({
        success: true,
        data: {
          temporaryPassword: tempPassword,
          message: 'Password reset successfully. User must change password on next login.',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/users/:userId/roles
 * Set user IAM roles
 * IT_ADMIN can set roles for any user including platform users
 */
router.post(
  '/tenants/:tenantId/users/:userId/roles',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ROLE_ASSIGN),
  validate(setRolesBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;
      const { iamRoleIds } = req.body;

      // Build query based on role
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query).populate('iamRoles', 'name');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify all roles exist and belong to tenant
      const roles = await IamRole.find({
        _id: { $in: iamRoleIds },
        $or: [{ tenantId }, { tenantId: { $exists: false } }],
        isActive: true,
      });

      if (roles.length !== iamRoleIds.length) {
        throw new NotFoundError('One or more roles not found');
      }

      const beforeRoles = (user.iamRoles as unknown as Array<{ name: string }>).map(r => r.name);
      user.iamRoles = iamRoleIds;
      await user.save();

      const afterRoles = roles.map(r => r.name);

      // Log the action
      await logIamActionFromRequest(
        req,
        IamAuditAction.ROLE_ASSIGNED,
        'User',
        userId,
        `Updated roles for ${user.email}`,
        {
          targetName: `${user.firstName} ${user.lastName}`,
          before: { roles: beforeRoles },
          after: { roles: afterRoles },
        }
      );

      res.json({
        success: true,
        data: { message: 'Roles updated successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/users/:userId/groups
 * Set user groups
 * IT_ADMIN can set groups for any user including platform users
 */
router.post(
  '/tenants/:tenantId/users/:userId/groups',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_GROUP_MANAGE_MEMBERS),
  validate(setGroupsBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;
      const { groupIds } = req.body;

      // Build query based on role
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query).populate('groups', 'name');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify all groups exist and belong to tenant
      const groups = await Group.find({
        _id: { $in: groupIds },
        tenantId,
        isActive: true,
      });

      if (groups.length !== groupIds.length) {
        throw new NotFoundError('One or more groups not found');
      }

      const beforeGroups = (user.groups as unknown as Array<{ name: string }>).map(g => g.name);
      user.groups = groupIds;
      await user.save();

      // Update group membership
      await Group.updateMany(
        { tenantId, members: userId },
        { $pull: { members: userId } }
      );
      await Group.updateMany(
        { _id: { $in: groupIds } },
        { $addToSet: { members: userId } }
      );

      const afterGroups = groups.map(g => g.name);

      // Log the action
      await logIamActionFromRequest(
        req,
        IamAuditAction.GROUP_MEMBER_ADDED,
        'User',
        userId,
        `Updated groups for ${user.email}`,
        {
          targetName: `${user.firstName} ${user.lastName}`,
          before: { groups: beforeGroups },
          after: { groups: afterGroups },
        }
      );

      res.json({
        success: true,
        data: { message: 'Groups updated successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/users/:userId/lock
 * Lock user account
 * IT_ADMIN can lock any user including platform users
 */
router.post(
  '/tenants/:tenantId/users/:userId/lock',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_WRITE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;
      const { reason } = req.body;

      // Build query based on role
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.lock(reason || 'Locked by administrator');

      await logIamActionFromRequest(
        req,
        IamAuditAction.USER_LOCKED,
        'User',
        userId,
        `Locked user ${user.email}`,
        {
          targetName: `${user.firstName} ${user.lastName}`,
          after: { lockedAt: user.lockedAt, lockReason: user.lockReason },
        }
      );

      res.json({
        success: true,
        data: { message: 'User locked successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/tenants/:tenantId/users/:userId/unlock
 * Unlock user account
 * IT_ADMIN can unlock any user including platform users
 */
router.post(
  '/tenants/:tenantId/users/:userId/unlock',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_WRITE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;

      // Build query based on role
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.unlock();

      await logIamActionFromRequest(
        req,
        IamAuditAction.USER_UNLOCKED,
        'User',
        userId,
        `Unlocked user ${user.email}`,
        { targetName: `${user.firstName} ${user.lastName}` }
      );

      res.json({
        success: true,
        data: { message: 'User unlocked successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/tenants/:tenantId/users/:userId
 * Deactivate user
 * IT_ADMIN can deactivate any user including platform users
 */
router.delete(
  '/tenants/:tenantId/users/:userId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_DELETE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.params;

      // Build query based on role
      let query: Record<string, unknown>;
      if (req.primaryRole === PrimaryRole.IT_ADMIN) {
        query = {
          _id: userId,
          $or: [
            { tenantId: tenantId },
            { tenantId: { $exists: false } },
            { tenantId: null },
          ],
        };
      } else {
        query = { _id: userId, tenantId: tenantId };
      }

      const user = await User.findOne(query);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.isActive = false;
      await user.save();

      await logIamActionFromRequest(
        req,
        IamAuditAction.USER_DELETED,
        'User',
        userId,
        `Deactivated user ${user.email}`,
        { targetName: `${user.firstName} ${user.lastName}` }
      );

      res.json({
        success: true,
        data: { message: 'User deactivated successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
