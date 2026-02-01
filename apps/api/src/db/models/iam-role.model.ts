/**
 * IAM Role Model
 * Custom roles with granular permissions for the Admin Portal
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IamPermissionType, SystemRoleType } from '@change/shared';

export interface IIamRole extends Document {
  _id: Types.ObjectId;
  tenantId?: Types.ObjectId; // Null for global roles
  name: string;
  description?: string;
  isSystem: boolean; // System roles cannot be modified
  systemRole?: SystemRoleType; // Link to system role type
  permissions: IamPermissionType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const iamRoleSchema = new Schema<IIamRole>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      sparse: true,
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
    isSystem: {
      type: Boolean,
      default: false,
    },
    systemRole: {
      type: String,
      enum: ['global_admin', 'tenant_admin', 'advisor_admin', 'auditor'],
    },
    permissions: [{
      type: String,
      required: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique role names within a tenant
iamRoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Index for querying active roles
iamRoleSchema.index({ tenantId: 1, isActive: 1 });

// Prevent modification of system roles
iamRoleSchema.pre('save', function(next) {
  if (this.isModified('permissions') && this.isSystem && !this.isNew) {
    next(new Error('Cannot modify permissions of system roles'));
    return;
  }
  next();
});

// Transform for JSON output
iamRoleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.tenantId) {
      ret.tenantId = ret.tenantId.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const IamRole = mongoose.model<IIamRole>('IamRole', iamRoleSchema);
