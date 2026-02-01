import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuditAction, UserRole, type AuditActionType, type UserRoleType } from '@change/shared';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: UserRoleType;
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface IAuditLogModel extends Model<IAuditLog> {
  logAction(params: {
    tenantId?: mongoose.Types.ObjectId | string;
    userId: mongoose.Types.ObjectId | string;
    userEmail: string;
    userRole: UserRoleType;
    action: AuditActionType;
    resourceType: string;
    resourceId: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<IAuditLog>;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
      sparse: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditAction),
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    previousState: {
      type: Schema.Types.Mixed,
    },
    newState: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        if (ret.tenantId) ret.tenantId = ret.tenantId.toString();
        ret.userId = ret.userId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index for automatic cleanup (optional - 1 year retention)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static method for logging
auditLogSchema.statics.logAction = async function (params: {
  tenantId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  userEmail: string;
  userRole: UserRoleType;
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<IAuditLog> {
  const log = new this({
    tenantId: params.tenantId
      ? new mongoose.Types.ObjectId(params.tenantId.toString())
      : undefined,
    userId: new mongoose.Types.ObjectId(params.userId.toString()),
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    previousState: params.previousState,
    newState: params.newState,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  return log.save();
};

export const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', auditLogSchema);
