/**
 * Advisor Routes
 * API endpoints for advisors to manage their assigned clients
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PrimaryRole } from '@change/shared';
import { authenticate, ForbiddenError } from '../../middleware/index.js';
import { 
  AdvisorAssignment, 
  BusinessProfile, 
  Task, 
  DocumentInstance,
  Tenant,
} from '../../db/models/index.js';

const router = Router();

// Middleware to ensure user is an advisor
const requireAdvisor = (req: Request, res: Response, next: NextFunction) => {
  if (req.primaryRole !== PrimaryRole.ADVISOR) {
    return next(new ForbiddenError('Only advisors can access this resource'));
  }
  next();
};

/**
 * GET /advisor/dashboard
 * Get advisor dashboard summary
 */
router.get(
  '/dashboard',
  authenticate,
  requireAdvisor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const advisorId = req.user?.userId;

      // Get all active assignments for this advisor
      const assignments = await AdvisorAssignment.find({
        advisorId,
        isActive: true,
      }).lean();

      const tenantIds = assignments.map(a => a.tenantId);

      // Get business profiles for assigned tenants
      const profiles = await BusinessProfile.find({
        tenantId: { $in: tenantIds },
      }).lean();

      // Get task stats across all assigned clients
      const [pendingTasks, overdueTasks] = await Promise.all([
        Task.countDocuments({
          tenantId: { $in: tenantIds },
          status: { $in: ['pending', 'in_progress'] },
        }),
        Task.countDocuments({
          tenantId: { $in: tenantIds },
          status: { $in: ['pending', 'in_progress'] },
          dueDate: { $lt: new Date() },
        }),
      ]);

      // Calculate clients by progress phase
      const clientsByPhase = {
        setup: 0,
        formation: 0,
        operations: 0,
        complete: 0,
      };

      profiles.forEach((profile: any) => {
        const flags = profile.readinessFlags || {};
        if (!flags.archetypeSelected || !flags.entitySelected || !flags.stateSelected) {
          clientsByPhase.setup++;
        } else if (profile.einStatus !== 'received') {
          clientsByPhase.formation++;
        } else if (!flags.bankAccountOpened || !flags.operatingAgreementSigned || !flags.complianceCalendarSetup) {
          clientsByPhase.operations++;
        } else {
          clientsByPhase.complete++;
        }
      });

      res.json({
        success: true,
        data: {
          assignedClients: assignments.length,
          activeClients: profiles.length,
          pendingTasks,
          overdueTasks,
          clientsByPhase,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /advisor/clients
 * Get list of assigned clients with progress
 */
router.get(
  '/clients',
  authenticate,
  requireAdvisor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const advisorId = req.user?.userId;

      // Get all active assignments for this advisor
      const assignments = await AdvisorAssignment.find({
        advisorId,
        isActive: true,
      })
        .populate('tenantId', 'name slug')
        .lean();

      const tenantIds = assignments.map(a => a.tenantId);

      // Get business profiles
      const profiles = await BusinessProfile.find({
        tenantId: { $in: tenantIds.map(t => (t as any)?._id || t) },
      }).lean();

      // Get task counts per tenant
      const taskCounts = await Task.aggregate([
        { $match: { tenantId: { $in: tenantIds.map(t => (t as any)?._id || t) } } },
        { $group: { 
          _id: '$tenantId', 
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdue: { $sum: { 
            $cond: [
              { $and: [
                { $in: ['$status', ['pending', 'in_progress']] },
                { $lt: ['$dueDate', new Date()] }
              ]}, 
              1, 
              0
            ] 
          }}
        }}
      ]);

      // Build client list
      const clients = assignments.map((assignment: any) => {
        const tenant = assignment.tenantId;
        const tenantId = tenant?._id?.toString() || tenant?.toString();
        const profile = profiles.find((p: any) => p.tenantId?.toString() === tenantId);
        const tasks = taskCounts.find((t: any) => t._id?.toString() === tenantId) || { total: 0, completed: 0, overdue: 0 };
        
        // Calculate progress
        let progress = 0;
        let phase = 'setup';
        if (profile) {
          const flags = profile.readinessFlags || {};
          
          // Setup progress (33%)
          let setupScore = 0;
          if (profile.businessName) setupScore += 20;
          if (profile.archetypeKey) setupScore += 30;
          if (profile.businessType) setupScore += 25;
          if (profile.formationState) setupScore += 25;
          
          // Formation progress (33%)
          let formationScore = 0;
          if (flags.addressVerified) formationScore += 20;
          if (flags.registeredAgentSet) formationScore += 20;
          if (flags.ownersAdded) formationScore += 10;
          if (profile.formationStatus === 'filed' || profile.formationStatus === 'approved') formationScore += 25;
          if (profile.einStatus === 'received') formationScore += 25;
          
          // Operations progress (34%)
          let opsScore = 0;
          if (flags.bankAccountOpened) opsScore += 33;
          if (flags.operatingAgreementSigned) opsScore += 33;
          if (flags.complianceCalendarSetup) opsScore += 34;
          
          progress = Math.round((setupScore * 0.33 + formationScore * 0.33 + opsScore * 0.34));
          
          if (setupScore < 100) phase = 'setup';
          else if (formationScore < 100) phase = 'formation';
          else if (opsScore < 100) phase = 'operations';
          else phase = 'complete';
        }
        
        return {
          id: assignment._id.toString(),
          tenantId,
          tenantName: tenant?.name || 'Unknown',
          businessName: profile?.businessName || tenant?.name || 'Unknown',
          businessType: profile?.businessType,
          state: profile?.formationState,
          phase,
          progress,
          isPrimary: assignment.isPrimary,
          assignedAt: assignment.assignedAt,
          tasks: {
            total: tasks.total,
            completed: tasks.completed,
            overdue: tasks.overdue,
          },
          lastActivity: profile?.updatedAt,
        };
      });

      // Sort by overdue tasks first, then by progress
      clients.sort((a, b) => {
        if (b.tasks.overdue !== a.tasks.overdue) return b.tasks.overdue - a.tasks.overdue;
        return a.progress - b.progress;
      });

      res.json({
        success: true,
        data: clients,
        meta: { 
          timestamp: new Date().toISOString(),
          total: clients.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /advisor/clients/:tenantId
 * Get detailed client information
 */
router.get(
  '/clients/:tenantId',
  authenticate,
  requireAdvisor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const advisorId = req.user?.userId;
      const { tenantId } = req.params;

      // Verify advisor has access to this tenant
      const assignment = await AdvisorAssignment.findOne({
        advisorId,
        tenantId,
        isActive: true,
      });

      if (!assignment) {
        throw new ForbiddenError('You are not assigned to this client');
      }

      // Get tenant info
      const tenant = await Tenant.findById(tenantId).lean();
      if (!tenant) {
        throw new ForbiddenError('Client not found');
      }

      // Get business profile
      const profile = await BusinessProfile.findOne({ tenantId }).lean();

      // Get tasks
      const tasks = await Task.find({ tenantId })
        .sort({ dueDate: 1, priority: -1 })
        .limit(20)
        .lean();

      // Get documents
      const documents = await DocumentInstance.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Calculate progress stats
      const taskStats = {
        total: await Task.countDocuments({ tenantId }),
        completed: await Task.countDocuments({ tenantId, status: 'completed' }),
        pending: await Task.countDocuments({ tenantId, status: { $in: ['pending', 'in_progress'] } }),
        overdue: await Task.countDocuments({ 
          tenantId, 
          status: { $in: ['pending', 'in_progress'] },
          dueDate: { $lt: new Date() }
        }),
      };

      res.json({
        success: true,
        data: {
          tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
          },
          profile: profile ? {
            businessName: profile.businessName,
            businessType: profile.businessType,
            formationState: profile.formationState,
            formationStatus: profile.formationStatus,
            einStatus: profile.einStatus,
            readinessFlags: profile.readinessFlags,
            complianceItems: profile.complianceItems,
          } : null,
          tasks: tasks.map((t: any) => ({
            id: t._id.toString(),
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            category: t.category,
          })),
          documents: documents.map((d: any) => ({
            id: d._id.toString(),
            name: d.name,
            type: d.documentType,
            status: d.status,
            createdAt: d.createdAt,
          })),
          taskStats,
          assignment: {
            isPrimary: assignment.isPrimary,
            assignedAt: assignment.assignedAt,
            notes: assignment.notes,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
