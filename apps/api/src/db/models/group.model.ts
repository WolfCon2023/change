/**
 * Group Model
 * Groups for organizing users and assigning roles collectively
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  _id: Types.ObjectId;
  tenantId?: Types.ObjectId; // Optional for platform-level groups
  name: string;
  description?: string;
  members: Types.ObjectId[]; // User IDs
  roles: Types.ObjectId[]; // IamRole IDs
  isActive: boolean;
  isPlatformGroup: boolean; // True for groups without tenantId
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      sparse: true, // Allow null for platform-level groups
      index: true,
    },
    isPlatformGroup: {
      type: Boolean,
      default: false,
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
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    roles: [{
      type: Schema.Types.ObjectId,
      ref: 'IamRole',
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique group names within a tenant (or globally for platform groups)
groupSchema.index(
  { tenantId: 1, name: 1 },
  { unique: true, partialFilterExpression: { tenantId: { $exists: true } } }
);
// Unique platform group names
groupSchema.index(
  { isPlatformGroup: 1, name: 1 },
  { unique: true, partialFilterExpression: { isPlatformGroup: true } }
);

// Index for querying active groups
groupSchema.index({ tenantId: 1, isActive: 1 });

// Index for finding groups by member
groupSchema.index({ tenantId: 1, members: 1 });

// Transform for JSON output
groupSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.tenantId) ret.tenantId = ret.tenantId.toString();
    ret.members = ret.members.map((m: Types.ObjectId) => m.toString());
    ret.roles = ret.roles.map((r: Types.ObjectId) => r.toString());
    ret.createdBy = ret.createdBy.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Group = mongoose.model<IGroup>('Group', groupSchema);
