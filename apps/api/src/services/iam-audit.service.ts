/**
 * IAM Audit Service
 * Handles logging of all IAM-related actions with before/after state
 */

import type { Request } from 'express';
import type { IamAuditActionType } from '@change/shared';
import { IamAuditLog } from '../db/models/index.js';

interface AuditLogOptions {
  tenantId?: string;
  actorId: string;
  actorEmail: string;
  actorType?: 'user' | 'service_account' | 'system';
  action: IamAuditActionType;
  targetType: string;
  targetId: string;
  targetName?: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Create an IAM audit log entry
 */
export async function logIamAction(options: AuditLogOptions): Promise<void> {
  try {
    // Generate a placeholder ObjectId for unknown actors (e.g., failed login with unknown email)
    const actorId = options.actorId === 'unknown' 
      ? new (await import('mongoose')).default.Types.ObjectId()
      : options.actorId;
    
    await IamAuditLog.create({
      tenantId: options.tenantId,
      actorId,
      actorEmail: options.actorEmail,
      actorType: options.actorType || 'user',
      action: options.action,
      targetType: options.targetType,
      targetId: options.targetId,
      targetName: options.targetName,
      summary: options.summary,
      before: sanitizeForLog(options.before),
      after: sanitizeForLog(options.after),
      ip: options.ip,
      userAgent: options.userAgent,
      requestId: options.requestId,
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create IAM audit log:', error);
  }
}

/**
 * Create an IAM audit log entry from a request
 */
export async function logIamActionFromRequest(
  req: Request,
  action: IamAuditActionType,
  targetType: string,
  targetId: string,
  summary: string,
  options?: {
    targetName?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }
): Promise<void> {
  if (!req.user) {
    return;
  }

  await logIamAction({
    tenantId: req.tenantId,
    actorId: req.user.userId,
    actorEmail: req.user.email,
    actorType: 'user',
    action,
    targetType,
    targetId,
    targetName: options?.targetName,
    summary,
    before: options?.before,
    after: options?.after,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent']?.substring(0, 500),
    requestId: req.headers['x-request-id'] as string,
  });
}

/**
 * Get client IP from request
 */
function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }
  return req.ip || req.socket?.remoteAddress;
}

/**
 * Sanitize object for logging (remove sensitive fields)
 */
function sanitizeForLog(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!obj) return undefined;

  const sensitiveFields = [
    'password',
    'passwordHash',
    'mfaSecret',
    'keyHash',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'ssn',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(f => lowerKey.includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Compute diff between two objects for audit logging
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const beforeDiff: Record<string, unknown> = {};
  const afterDiff: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];

    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      if (beforeVal !== undefined) {
        beforeDiff[key] = beforeVal;
      }
      if (afterVal !== undefined) {
        afterDiff[key] = afterVal;
      }
    }
  }

  return {
    before: sanitizeForLog(beforeDiff) || {},
    after: sanitizeForLog(afterDiff) || {},
  };
}

/**
 * Query IAM audit logs
 */
export interface IamAuditLogQuery {
  tenantId?: string;
  actorId?: string;
  actorEmail?: string;
  action?: IamAuditActionType;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function queryIamAuditLogs(query: IamAuditLogQuery & { includePlatformLogs?: boolean }) {
  const filter: Record<string, unknown> = {};

  if (query.tenantId) {
    // If includePlatformLogs is true, also include logs without tenantId
    if (query.includePlatformLogs) {
      filter.$or = [
        { tenantId: query.tenantId },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ];
    } else {
      filter.tenantId = query.tenantId;
    }
  }
  if (query.actorId) {
    filter.actorId = query.actorId;
  }
  if (query.actorEmail) {
    filter.actorEmail = { $regex: query.actorEmail, $options: 'i' };
  }
  if (query.action) {
    filter.action = query.action;
  }
  if (query.targetType) {
    filter.targetType = query.targetType;
  }
  if (query.targetId) {
    filter.targetId = query.targetId;
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      (filter.createdAt as Record<string, Date>).$gte = query.startDate;
    }
    if (query.endDate) {
      (filter.createdAt as Record<string, Date>).$lte = query.endDate;
    }
  }

  const page = query.page || 1;
  const limit = Math.min(query.limit || 50, 100);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    IamAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    IamAuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Export audit logs to CSV format
 */
export async function exportIamAuditLogs(query: Omit<IamAuditLogQuery, 'page' | 'limit'>): Promise<string> {
  const filter: Record<string, unknown> = {};

  if (query.tenantId) {
    filter.tenantId = query.tenantId;
  }
  if (query.actorId) {
    filter.actorId = query.actorId;
  }
  if (query.action) {
    filter.action = query.action;
  }
  if (query.targetType) {
    filter.targetType = query.targetType;
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      (filter.createdAt as Record<string, Date>).$gte = query.startDate;
    }
    if (query.endDate) {
      (filter.createdAt as Record<string, Date>).$lte = query.endDate;
    }
  }

  const logs = await IamAuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(10000) // Max export limit
    .lean();

  // CSV header
  const headers = [
    'Timestamp',
    'Actor Email',
    'Actor Type',
    'Action',
    'Target Type',
    'Target ID',
    'Target Name',
    'Summary',
    'IP Address',
    'Request ID',
  ];

  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.actorEmail,
    log.actorType,
    log.action,
    log.targetType,
    log.targetId,
    log.targetName || '',
    log.summary,
    log.ip || '',
    log.requestId || '',
  ]);

  // Escape CSV fields
  const escapeField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvLines = [
    headers.map(escapeField).join(','),
    ...rows.map(row => row.map(escapeField).join(',')),
  ];

  return csvLines.join('\n');
}
