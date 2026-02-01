/**
 * Advisor Assignment Model
 * Tracks which advisors are assigned to which tenants
 * Used for enforcing advisor-to-tenant access control
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { AdvisorAssignmentStatus, type AdvisorAssignmentStatusType } from '@change/shared';

export interface IAdvisorAssignment extends Document {
  _id: Types.ObjectId;
  advisorId: Types.ObjectId;
  tenantId: Types.ObjectId;
  businessProfileId?: Types.ObjectId;
  cohortId?: Types.ObjectId;
  status: AdvisorAssignmentStatusType;
  assignedAt: Date;
  unassignedAt?: Date;
  isActive: boolean;
  isPrimary: boolean;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const advisorAssignmentSchema = new Schema<IAdvisorAssignment>(
  {
    advisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
    },
    cohortId: {
      type: Schema.Types.ObjectId,
      ref: 'Cohort',
    },
    status: {
      type: String,
      enum: Object.values(AdvisorAssignmentStatus),
      default: AdvisorAssignmentStatus.ACTIVE,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    unassignedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique active assignment per advisor-tenant pair
advisorAssignmentSchema.index(
  { advisorId: 1, tenantId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Index for querying advisor's active assignments
advisorAssignmentSchema.index({ advisorId: 1, status: 1, isActive: 1 });

// Index for querying tenant's assigned advisors
advisorAssignmentSchema.index({ tenantId: 1, status: 1, isActive: 1 });

// Transform for JSON output
advisorAssignmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.advisorId) ret.advisorId = ret.advisorId.toString();
    if (ret.tenantId) ret.tenantId = ret.tenantId.toString();
    if (ret.businessProfileId) ret.businessProfileId = ret.businessProfileId.toString();
    if (ret.cohortId) ret.cohortId = ret.cohortId.toString();
    if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const AdvisorAssignment = mongoose.model<IAdvisorAssignment>(
  'AdvisorAssignment',
  advisorAssignmentSchema
);
