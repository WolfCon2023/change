/**
 * Advisor Assignment Routes
 * Manage advisor-to-tenant assignments (IT Admin only)
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  IamPermission,
  IamAuditAction,
  PrimaryRole,
  AdvisorAssignmentStatus,
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
import { AdvisorAssignment, User, Tenant } from '../../db/models/index.js';
import { logIamActionFromRequest } from '../../services/index.js';

const router = Router();

// Validation schemas
const createAssignmentBodySchema = z.object({
  advisorId: z.string().min(1),
  tenantId: z.string().min(1),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

const updateAssignmentBodySchema = z.object({
  isPrimary: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  status: z.nativeEnum(AdvisorAssignmentStatus).optional(),
});

/**
 * GET /admin/advisor-assignments
 * List all advisor assignments (IT Admin only)
 */
router.get(
  '/advisor-assignments',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only IT_ADMIN can view all assignments
      if (req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can view advisor assignments');
      }

      const { advisorId, tenantId, status, isActive } = req.query;

      const filter: Record<string, unknown> = {};
      if (advisorId) filter.advisorId = advisorId;
      if (tenantId) filter.tenantId = tenantId;
      if (status) filter.status = status;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const assignments = await AdvisorAssignment.find(filter)
        .populate('advisorId', 'email firstName lastName primaryRole')
        .populate('tenantId', 'name slug')
        .populate('createdBy', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .lean();

      // Transform to include readable names
      const transformedAssignments = assignments.map((a) => ({
        id: a._id.toString(),
        advisorId: a.advisorId?._id?.toString() || a.advisorId?.toString(),
        advisor: a.advisorId && typeof a.advisorId === 'object' ? {
          id: (a.advisorId as { _id: { toString(): string } })._id.toString(),
          email: (a.advisorId as { email: string }).email,
          firstName: (a.advisorId as { firstName: string }).firstName,
          lastName: (a.advisorId as { lastName: string }).lastName,
          name: `${(a.advisorId as { firstName: string }).firstName} ${(a.advisorId as { lastName: string }).lastName}`,
        } : null,
        tenantId: a.tenantId?._id?.toString() || a.tenantId?.toString(),
        tenant: a.tenantId && typeof a.tenantId === 'object' ? {
          id: (a.tenantId as { _id: { toString(): string } })._id.toString(),
          name: (a.tenantId as { name: string }).name,
          slug: (a.tenantId as { slug: string }).slug,
        } : null,
        status: a.status,
        isActive: a.isActive,
        isPrimary: a.isPrimary,
        notes: a.notes,
        assignedAt: a.assignedAt,
        unassignedAt: a.unassignedAt,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));

      res.json({
        success: true,
        data: transformedAssignments,
        meta: {
          timestamp: new Date().toISOString(),
          total: transformedAssignments.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/advisors
 * List all users with ADVISOR role (for assignment dropdown)
 */
router.get(
  '/advisors',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can view advisors');
      }

      const advisors = await User.find({
        primaryRole: PrimaryRole.ADVISOR,
        isActive: true,
      })
        .select('email firstName lastName primaryRole')
        .sort({ firstName: 1, lastName: 1 })
        .lean();

      res.json({
        success: true,
        data: advisors.map((a) => ({
          id: a._id.toString(),
          email: a.email,
          firstName: a.firstName,
          lastName: a.lastName,
          name: `${a.firstName} ${a.lastName}`,
        })),
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/tenants-list
 * List all tenants (for assignment dropdown)
 */
router.get(
  '/tenants-list',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can view tenants list');
      }

      const tenants = await Tenant.find({ isActive: true })
        .select('name slug')
        .sort({ name: 1 })
        .lean();

      res.json({
        success: true,
        data: tenants.map((t) => ({
          id: t._id.toString(),
          name: t.name,
          slug: t.slug,
        })),
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/advisor-assignments
 * Create a new advisor assignment (IT Admin only)
 */
router.post(
  '/advisor-assignments',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_WRITE),
  validate(createAssignmentBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can create advisor assignments');
      }

      const { advisorId, tenantId, isPrimary, notes } = req.body;

      // Verify advisor exists and has ADVISOR role
      const advisor = await User.findById(advisorId);
      if (!advisor) {
        throw new NotFoundError('Advisor');
      }
      if (advisor.primaryRole !== PrimaryRole.ADVISOR) {
        throw new ForbiddenError('User is not an advisor');
      }

      // Verify tenant exists
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      // Check if active assignment already exists
      const existingAssignment = await AdvisorAssignment.findOne({
        advisorId,
        tenantId,
        isActive: true,
      });
      if (existingAssignment) {
        throw new ConflictError('Advisor is already assigned to this tenant');
      }

      // If this is primary, remove primary from other assignments for this tenant
      if (isPrimary) {
        await AdvisorAssignment.updateMany(
          { tenantId, isPrimary: true, isActive: true },
          { isPrimary: false }
        );
      }

      const assignment = await AdvisorAssignment.create({
        advisorId,
        tenantId,
        isPrimary: isPrimary || false,
        notes,
        status: AdvisorAssignmentStatus.ACTIVE,
        isActive: true,
        assignedAt: new Date(),
        createdBy: req.user?.userId,
      });

      // Audit log
      await logIamActionFromRequest(req, {
        action: IamAuditAction.ADVISOR_ASSIGNMENT_CREATED,
        targetType: 'AdvisorAssignment',
        targetId: assignment._id.toString(),
        summary: `Assigned advisor ${advisor.email} to tenant ${tenant.name}`,
        after: assignment.toJSON(),
      });

      res.status(201).json({
        success: true,
        data: assignment,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /admin/advisor-assignments/:assignmentId
 * Update an advisor assignment (IT Admin only)
 */
router.put(
  '/advisor-assignments/:assignmentId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_WRITE),
  validate(updateAssignmentBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can update advisor assignments');
      }

      const { assignmentId } = req.params;
      const { isPrimary, notes, status } = req.body;

      const assignment = await AdvisorAssignment.findById(assignmentId);
      if (!assignment) {
        throw new NotFoundError('Advisor Assignment');
      }

      const beforeState = assignment.toJSON();

      // If setting as primary, remove primary from others
      if (isPrimary === true) {
        await AdvisorAssignment.updateMany(
          { tenantId: assignment.tenantId, isPrimary: true, isActive: true, _id: { $ne: assignmentId } },
          { isPrimary: false }
        );
      }

      if (isPrimary !== undefined) assignment.isPrimary = isPrimary;
      if (notes !== undefined) assignment.notes = notes;
      if (status !== undefined) {
        assignment.status = status;
        if (status === AdvisorAssignmentStatus.INACTIVE) {
          assignment.isActive = false;
          assignment.unassignedAt = new Date();
        }
      }

      await assignment.save();

      // Audit log
      await logIamActionFromRequest(req, {
        action: IamAuditAction.ADVISOR_ASSIGNMENT_UPDATED,
        targetType: 'AdvisorAssignment',
        targetId: assignment._id.toString(),
        summary: `Updated advisor assignment`,
        before: beforeState,
        after: assignment.toJSON(),
      });

      res.json({
        success: true,
        data: assignment,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/advisor-assignments/:assignmentId
 * Remove an advisor assignment (IT Admin only)
 */
router.delete(
  '/advisor-assignments/:assignmentId',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_WRITE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.primaryRole !== PrimaryRole.IT_ADMIN) {
        throw new ForbiddenError('Only IT Admin can remove advisor assignments');
      }

      const { assignmentId } = req.params;

      const assignment = await AdvisorAssignment.findById(assignmentId)
        .populate('advisorId', 'email')
        .populate('tenantId', 'name');

      if (!assignment) {
        throw new NotFoundError('Advisor Assignment');
      }

      const beforeState = assignment.toJSON();

      // Soft delete
      assignment.isActive = false;
      assignment.status = AdvisorAssignmentStatus.INACTIVE;
      assignment.unassignedAt = new Date();
      await assignment.save();

      // Audit log
      const advisorEmail = (assignment.advisorId as unknown as { email: string })?.email || 'unknown';
      const tenantName = (assignment.tenantId as unknown as { name: string })?.name || 'unknown';

      await logIamActionFromRequest(req, {
        action: IamAuditAction.ADVISOR_ASSIGNMENT_REMOVED,
        targetType: 'AdvisorAssignment',
        targetId: assignment._id.toString(),
        summary: `Removed advisor ${advisorEmail} from tenant ${tenantName}`,
        before: beforeState,
      });

      res.json({
        success: true,
        data: { message: 'Advisor assignment removed successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
