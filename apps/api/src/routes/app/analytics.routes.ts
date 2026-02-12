/**
 * Analytics Routes
 * Business analytics and reporting endpoints
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireTenant } from '../../middleware/index.js';
import { Artifact, BusinessProfile, AuditLog } from '../../db/models/index.js';
// Note: Task analytics now uses BusinessProfile.tasks (embedded) to match Tasks page

const router = Router();

// Helper to convert tenantId string to ObjectId for aggregation queries
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

/**
 * GET /app/analytics/overview
 * Get overall business analytics overview
 */
router.get(
  '/overview',
  authenticate,
  requireTenant,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;

      // Get business profile which contains embedded tasks
      const businessProfile = await BusinessProfile.findOne({ tenantId }).lean();
      
      // Get tasks from BusinessProfile (same source as Tasks page)
      const tasks = (businessProfile as any)?.tasks || [];
      const now = new Date();
      
      // Calculate task statistics from embedded tasks
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
      const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
      const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
      const overdueTasks = tasks.filter((t: any) => {
        if (t.status === 'completed' || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
      }).length;

      // Get document statistics
      const [totalDocuments, generatedDocuments, uploadedDocuments] = await Promise.all([
        Artifact.countDocuments({ tenantId }),
        Artifact.countDocuments({ tenantId, uploadType: 'generated' }),
        Artifact.countDocuments({ tenantId, uploadType: { $in: ['user', 'advisor'] } }),
      ]);
      
      // Calculate compliance score
      const complianceItems = businessProfile?.complianceItems || [];
      const completedCompliance = complianceItems.filter((item: any) => item.status === 'completed').length;
      const totalCompliance = complianceItems.length;
      const complianceScore = totalCompliance > 0 
        ? Math.round((completedCompliance / totalCompliance) * 100) 
        : 0;

      // Get activity count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivityCount = await AuditLog.countDocuments({
        tenantId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Calculate task completion rate
      const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      res.json({
        success: true,
        data: {
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            inProgress: inProgressTasks,
            overdue: overdueTasks,
            completionRate,
          },
          documents: {
            total: totalDocuments,
            generated: generatedDocuments,
            uploaded: uploadedDocuments,
          },
          compliance: {
            score: complianceScore,
            completed: completedCompliance,
            total: totalCompliance,
          },
          activity: {
            last30Days: recentActivityCount,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /app/analytics/tasks
 * Get detailed task analytics with trends
 */
router.get(
  '/tasks',
  authenticate,
  requireTenant,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const days = parseInt(req.query.days as string) || 30;

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Get tasks from BusinessProfile (same source as Tasks page)
      const businessProfile = await BusinessProfile.findOne({ tenantId }).lean();
      const tasks = (businessProfile as any)?.tasks || [];

      // Calculate status breakdown from embedded tasks
      const statusCounts: Record<string, number> = {};
      const priorityCounts: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};
      const completionByDate: Record<string, number> = {};
      const creationByDate: Record<string, number> = {};

      for (const task of tasks) {
        // Status breakdown
        const status = task.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Priority breakdown
        const priority = task.priority || 'medium';
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;

        // Category breakdown
        const category = task.category || 'uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        // Completion trend (tasks completed in date range)
        if (task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (completedDate >= startDate) {
            const dateStr = completedDate.toISOString().split('T')[0];
            completionByDate[dateStr] = (completionByDate[dateStr] || 0) + 1;
          }
        }

        // Creation trend (tasks created in date range)
        if (task.createdAt) {
          const createdDate = new Date(task.createdAt);
          if (createdDate >= startDate) {
            const dateStr = createdDate.toISOString().split('T')[0];
            creationByDate[dateStr] = (creationByDate[dateStr] || 0) + 1;
          }
        }
      }

      // Fill in missing dates for trends
      const fillDates = (dataMap: Record<string, number>, days: number) => {
        const result: { date: string; count: number }[] = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          result.push({
            date: dateStr,
            count: dataMap[dateStr] || 0,
          });
        }
        return result;
      };

      res.json({
        success: true,
        data: {
          statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
          })),
          priorityBreakdown: Object.entries(priorityCounts).map(([priority, count]) => ({
            priority,
            count,
          })),
          categoryBreakdown: Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            count,
          })),
          completionTrend: fillDates(completionByDate, days),
          creationTrend: fillDates(creationByDate, days),
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /app/analytics/documents
 * Get document analytics
 */
router.get(
  '/documents',
  authenticate,
  requireTenant,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const tenantObjectId = toObjectId(tenantId!);

      // Get documents by category
      const categoryBreakdown = await Artifact.aggregate([
        { $match: { tenantId: tenantObjectId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);

      // Get documents by type
      const typeBreakdown = await Artifact.aggregate([
        { $match: { tenantId: tenantObjectId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      // Get documents by upload type
      const uploadTypeBreakdown = await Artifact.aggregate([
        { $match: { tenantId: tenantObjectId } },
        { $group: { _id: '$uploadType', count: { $sum: 1 } } },
      ]);

      // Get documents created over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const creationTrend = await Artifact.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        data: {
          categoryBreakdown: categoryBreakdown.map(c => ({
            category: c._id || 'uncategorized',
            count: c.count,
          })),
          typeBreakdown: typeBreakdown.map(t => ({
            type: t._id || 'unknown',
            count: t.count,
          })),
          uploadTypeBreakdown: uploadTypeBreakdown.map(u => ({
            uploadType: u._id || 'unknown',
            count: u.count,
          })),
          creationTrend: creationTrend.map(d => ({
            date: d._id,
            count: d.count,
          })),
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /app/analytics/compliance
 * Get compliance analytics and upcoming deadlines
 */
router.get(
  '/compliance',
  authenticate,
  requireTenant,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;

      const businessProfile = await BusinessProfile.findOne({ tenantId }).lean();
      const complianceItems = (businessProfile?.complianceItems || []) as Array<{
        name: string;
        status: string;
        dueDate?: Date;
        category?: string;
        frequency?: string;
      }>;

      // Status breakdown
      const statusCounts = complianceItems.reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      // Category breakdown
      const categoryCounts = complianceItems.reduce((acc: Record<string, number>, item) => {
        const cat = item.category || 'general';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      // Upcoming deadlines (next 90 days)
      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const upcomingDeadlines = complianceItems
        .filter(item => {
          if (!item.dueDate) return false;
          const dueDate = new Date(item.dueDate);
          return dueDate >= now && dueDate <= ninetyDaysFromNow && item.status !== 'completed';
        })
        .map(item => ({
          name: item.name,
          dueDate: item.dueDate,
          status: item.status,
          category: item.category || 'general',
          daysUntilDue: Math.ceil((new Date(item.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        }))
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      // Overdue items
      const overdueItems = complianceItems
        .filter(item => {
          if (!item.dueDate || item.status === 'completed') return false;
          return new Date(item.dueDate) < now;
        })
        .map(item => ({
          name: item.name,
          dueDate: item.dueDate,
          status: item.status,
          category: item.category || 'general',
          daysOverdue: Math.ceil((now.getTime() - new Date(item.dueDate!).getTime()) / (1000 * 60 * 60 * 24)),
        }));

      // Calculate compliance health score
      const completed = statusCounts['completed'] || 0;
      const total = complianceItems.length;
      const overdue = overdueItems.length;
      
      // Score: 100 - (overdue penalty) + (completion bonus)
      let healthScore = 100;
      if (total > 0) {
        healthScore = Math.round(((completed / total) * 100) - (overdue * 10));
        healthScore = Math.max(0, Math.min(100, healthScore));
      }

      res.json({
        success: true,
        data: {
          summary: {
            total: complianceItems.length,
            completed: statusCounts['completed'] || 0,
            pending: statusCounts['pending'] || 0,
            inProgress: statusCounts['in_progress'] || 0,
            overdue: overdueItems.length,
            healthScore,
          },
          statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
          })),
          categoryBreakdown: Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            count,
          })),
          upcomingDeadlines: upcomingDeadlines.slice(0, 10),
          overdueItems,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /app/analytics/activity
 * Get activity analytics over time
 */
router.get(
  '/activity',
  authenticate,
  requireTenant,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const tenantObjectId = toObjectId(tenantId!);
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Get activity by day
      const activityByDay = await AuditLog.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get activity by action type
      const activityByAction = await AuditLog.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Get activity by resource type
      const activityByResource = await AuditLog.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$resourceType',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Fill in missing dates
      const fillDates = (data: { _id: string; count: number }[], days: number) => {
        const result: { date: string; count: number }[] = [];
        const dataMap = new Map(data.map(d => [d._id, d.count]));
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          result.push({
            date: dateStr,
            count: dataMap.get(dateStr) || 0,
          });
        }
        return result;
      };

      res.json({
        success: true,
        data: {
          activityByDay: fillDates(activityByDay, days),
          activityByAction: activityByAction.map(a => ({
            action: a._id || 'unknown',
            count: a.count,
          })),
          activityByResource: activityByResource.map(r => ({
            resource: r._id || 'unknown',
            count: r.count,
          })),
          totalActivity: activityByDay.reduce((sum, d) => sum + d.count, 0),
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
