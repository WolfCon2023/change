/**
 * Access Request Model
 * Tracks requests for additional roles or permissions
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IamPermissionType, AccessRequestStatusType } from '@change/shared';
import { AccessRequestStatus } from '@change/shared';

export interface IAccessRequest extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  requestorId: Types.ObjectId;
  requestorEmail: string;
  requestedRoleIds: Types.ObjectId[];
  requestedPermissions: IamPermissionType[];
  reason: string;
  status: AccessRequestStatusType;
  approverId?: Types.ObjectId;
  approverEmail?: string;
  approverNotes?: string;
  decidedAt?: Date;
  expiresAt?: Date;
  effectiveUntil?: Date; // For time-limited access
  createdAt: Date;
  updatedAt: Date;
}

const accessRequestSchema = new Schema<IAccessRequest>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    requestorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestorEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    requestedRoleIds: [{
      type: Schema.Types.ObjectId,
      ref: 'IamRole',
    }],
    requestedPermissions: [{
      type: String,
    }],
    reason: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(AccessRequestStatus),
      default: AccessRequestStatus.PENDING,
      index: true,
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approverEmail: {
      type: String,
      lowercase: true,
    },
    approverNotes: {
      type: String,
      maxlength: 2000,
    },
    decidedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    effectiveUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for pending requests
accessRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

// Index for user's requests
accessRequestSchema.index({ tenantId: 1, requestorId: 1, createdAt: -1 });

// Transform for JSON output
accessRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    ret.requestorId = ret.requestorId.toString();
    ret.requestedRoleIds = ret.requestedRoleIds.map((r: Types.ObjectId) => r.toString());
    if (ret.approverId) {
      ret.approverId = ret.approverId.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const AccessRequest = mongoose.model<IAccessRequest>('AccessRequest', accessRequestSchema);
