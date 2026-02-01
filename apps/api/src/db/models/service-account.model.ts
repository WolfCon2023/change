/**
 * Service Account Model
 * Non-human accounts for API integrations and automation
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ServiceAccountStatusType } from '@change/shared';
import { ServiceAccountStatus } from '@change/shared';

export interface IServiceAccount extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  status: ServiceAccountStatusType;
  createdBy: Types.ObjectId;
  roles: Types.ObjectId[]; // IamRole IDs
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const serviceAccountSchema = new Schema<IServiceAccount>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(ServiceAccountStatus),
      default: ServiceAccountStatus.ACTIVE,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roles: [{
      type: Schema.Types.ObjectId,
      ref: 'IamRole',
    }],
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique names within a tenant
serviceAccountSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Index for active service accounts
serviceAccountSchema.index({ tenantId: 1, status: 1 });

// Transform for JSON output
serviceAccountSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    ret.createdBy = ret.createdBy.toString();
    ret.roles = ret.roles.map((r: Types.ObjectId) => r.toString());
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ServiceAccount = mongoose.model<IServiceAccount>('ServiceAccount', serviceAccountSchema);
