/**
 * IAM Audit Log Model
 * Extended audit log specifically for IAM actions with before/after state
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IamAuditActionType } from '@change/shared';

export interface IIamAuditLog extends Document {
  _id: Types.ObjectId;
  tenantId?: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail: string;
  actorType: 'user' | 'service_account' | 'system';
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
  createdAt: Date;
}

const iamAuditLogSchema = new Schema<IIamAuditLog>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      sparse: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    actorType: {
      type: String,
      enum: ['user', 'service_account', 'system'],
      default: 'user',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    targetName: {
      type: String,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },
    requestId: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for querying by tenant and time
iamAuditLogSchema.index({ tenantId: 1, createdAt: -1 });

// Index for querying by actor
iamAuditLogSchema.index({ actorId: 1, createdAt: -1 });

// Index for querying by target
iamAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// Compound index for filtering
iamAuditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });

// TTL index for automatic cleanup (optional, 2 years retention)
// iamAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// Transform for JSON output
iamAuditLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.tenantId) {
      ret.tenantId = ret.tenantId.toString();
    }
    ret.actorId = ret.actorId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const IamAuditLog = mongoose.model<IIamAuditLog>('IamAuditLog', iamAuditLogSchema);
