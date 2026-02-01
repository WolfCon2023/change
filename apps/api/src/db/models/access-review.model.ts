/**
 * Access Review Model
 * Periodic access reviews for compliance
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AccessReviewStatusType } from '@change/shared';
import { AccessReviewStatus } from '@change/shared';

export interface IAccessReview extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  status: AccessReviewStatusType;
  dueAt: Date;
  createdBy: Types.ObjectId;
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  itemCount: number;
  completedItemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const accessReviewSchema = new Schema<IAccessReview>(
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
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: Object.values(AccessReviewStatus),
      default: AccessReviewStatus.DRAFT,
      index: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    itemCount: {
      type: Number,
      default: 0,
    },
    completedItemCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for open reviews
accessReviewSchema.index({ tenantId: 1, status: 1, dueAt: 1 });

// Virtual for completion percentage
accessReviewSchema.virtual('completionPercentage').get(function() {
  if (this.itemCount === 0) return 0;
  return Math.round((this.completedItemCount / this.itemCount) * 100);
});

// Transform for JSON output
accessReviewSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    ret.createdBy = ret.createdBy.toString();
    if (ret.closedBy) {
      ret.closedBy = ret.closedBy.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const AccessReview = mongoose.model<IAccessReview>('AccessReview', accessReviewSchema);
