import type { Request } from 'express';
import mongoose from 'mongoose';
import { type AuditActionType, type UserRoleType, AuditAction, UserRole } from '@change/shared';
import { AuditLog, type IAuditLog } from '../db/models/index.js';

export interface AuditContext {
  tenantId?: string;
  userId: string;
  userEmail: string;
  userRole: UserRoleType;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogParams {
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Audit Service for logging all key workflow state changes
 * Requirement: Include audit logging for all key workflow state changes (who, what, when)
 */
export class AuditService {
  /**
   * Extract audit context from Express request
   */
  static getContextFromRequest(req: Request): AuditContext | null {
    if (!req.user) {
      return null;
    }

    return {
      tenantId: req.tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip ?? req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  /**
   * Log an audit event
   */
  static async log(context: AuditContext, params: AuditLogParams): Promise<IAuditLog> {
    try {
      const auditLog = await AuditLog.logAction({
        tenantId: context.tenantId,
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        previousState: params.previousState,
        newState: params.newState,
        metadata: params.metadata,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return auditLog;
    } catch (error) {
      // Log error but don't throw - audit logging shouldn't break main operations
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Log directly from a request
   */
  static async logFromRequest(req: Request, params: AuditLogParams): Promise<IAuditLog | null> {
    const context = this.getContextFromRequest(req);
    if (!context) {
      console.warn('Cannot create audit log: no user context');
      return null;
    }

    return this.log(context, params);
  }

  /**
   * Log a system action (no user context)
   */
  static async logSystemAction(params: AuditLogParams): Promise<IAuditLog> {
    return AuditLog.logAction({
      userId: new mongoose.Types.ObjectId().toString(), // System user placeholder
      userEmail: 'system@change-platform.local',
      userRole: UserRole.SYSTEM_ADMIN,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      previousState: params.previousState,
      newState: params.newState,
      metadata: { ...params.metadata, isSystemAction: true },
    });
  }

  /**
   * Query audit logs for a specific resource
   */
  static async getResourceLogs(
    resourceType: string,
    resourceId: string,
    options: {
      tenantId?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {
      resourceType,
      resourceId,
    };

    if (options.tenantId) {
      query['tenantId'] = new mongoose.Types.ObjectId(options.tenantId);
    }

    return AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit ?? 50)
      .skip(options.skip ?? 0)
      .exec();
  }

  /**
   * Query audit logs for a tenant
   */
  static async getTenantLogs(
    tenantId: string,
    options: {
      action?: AuditActionType;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (options.action) {
      query['action'] = options.action;
    }

    if (options.userId) {
      query['userId'] = new mongoose.Types.ObjectId(options.userId);
    }

    if (options.startDate || options.endDate) {
      query['createdAt'] = {};
      if (options.startDate) {
        (query['createdAt'] as Record<string, Date>)['$gte'] = options.startDate;
      }
      if (options.endDate) {
        (query['createdAt'] as Record<string, Date>)['$lte'] = options.endDate;
      }
    }

    return AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit ?? 50)
      .skip(options.skip ?? 0)
      .exec();
  }

  /**
   * Get recent activity for a user
   */
  static async getUserActivity(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(options.limit ?? 50)
      .skip(options.skip ?? 0)
      .exec();
  }

  // ==========================================================================
  // Convenience methods for common audit actions
  // ==========================================================================

  static async logUserLogin(context: AuditContext): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.USER_LOGIN,
      resourceType: 'User',
      resourceId: context.userId,
    });
  }

  static async logUserLogout(context: AuditContext): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.USER_LOGOUT,
      resourceType: 'User',
      resourceId: context.userId,
    });
  }

  static async logBusinessProfileCreated(
    context: AuditContext,
    profileId: string,
    profileData: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.BUSINESS_PROFILE_CREATED,
      resourceType: 'BusinessProfile',
      resourceId: profileId,
      newState: profileData,
    });
  }

  static async logBusinessProfileUpdated(
    context: AuditContext,
    profileId: string,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.BUSINESS_PROFILE_UPDATED,
      resourceType: 'BusinessProfile',
      resourceId: profileId,
      previousState,
      newState,
    });
  }

  static async logEnrollmentCreated(
    context: AuditContext,
    enrollmentId: string,
    enrollmentData: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.ENROLLMENT_CREATED,
      resourceType: 'Enrollment',
      resourceId: enrollmentId,
      newState: enrollmentData,
    });
  }

  static async logEnrollmentStatusChanged(
    context: AuditContext,
    enrollmentId: string,
    previousStatus: string,
    newStatus: string,
    metadata?: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.ENROLLMENT_STATUS_CHANGED,
      resourceType: 'Enrollment',
      resourceId: enrollmentId,
      previousState: { status: previousStatus },
      newState: { status: newStatus },
      metadata,
    });
  }

  static async logWorkflowPhaseChanged(
    context: AuditContext,
    workflowId: string,
    previousPhase: string,
    newPhase: string,
    metadata?: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.WORKFLOW_PHASE_CHANGED,
      resourceType: 'WorkflowInstance',
      resourceId: workflowId,
      previousState: { phase: previousPhase },
      newState: { phase: newPhase },
      metadata,
    });
  }

  static async logWorkflowStepCompleted(
    context: AuditContext,
    workflowId: string,
    step: string,
    stepData?: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.WORKFLOW_STEP_COMPLETED,
      resourceType: 'WorkflowInstance',
      resourceId: workflowId,
      newState: { step, ...stepData },
    });
  }

  static async logTaskCompleted(
    context: AuditContext,
    taskId: string,
    taskData: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.TASK_COMPLETED,
      resourceType: 'Task',
      resourceId: taskId,
      newState: taskData,
    });
  }

  static async logDocumentGenerated(
    context: AuditContext,
    documentId: string,
    documentData: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.DOCUMENT_GENERATED,
      resourceType: 'DocumentInstance',
      resourceId: documentId,
      newState: documentData,
    });
  }

  static async logDocumentApproved(
    context: AuditContext,
    documentId: string,
    notes?: string
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.DOCUMENT_APPROVED,
      resourceType: 'DocumentInstance',
      resourceId: documentId,
      metadata: { notes },
    });
  }

  static async logAdvisorAssigned(
    context: AuditContext,
    assignmentId: string,
    assignmentData: Record<string, unknown>
  ): Promise<IAuditLog> {
    return this.log(context, {
      action: AuditAction.ADVISOR_ASSIGNED,
      resourceType: 'AdvisorAssignment',
      resourceId: assignmentId,
      newState: assignmentData,
    });
  }
}
