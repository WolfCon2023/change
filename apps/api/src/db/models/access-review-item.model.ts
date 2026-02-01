/**
 * Access Review Item Model
 * Individual user reviews within an access review
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IamPermissionType, AccessReviewDecisionType } from '@change/shared';
import { AccessReviewDecision } from '@change/shared';

export interface IRoleSnapshot {
  id: Types.ObjectId;
  name: string;
}

export interface IGroupSnapshot {
  id: Types.ObjectId;
  name: string;
}

export interface IAccessReviewItem extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  reviewId: Types.ObjectId;
  userId: Types.ObjectId;
  userEmail: string;
  userName: string;
  currentRoles: IRoleSnapshot[];
  currentPermissions: IamPermissionType[];
  currentGroups: IGroupSnapshot[];
  decision: AccessReviewDecisionType;
  newRoles?: Types.ObjectId[]; // If decision is 'change'
  reviewerId?: Types.ObjectId;
  reviewerEmail?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const roleSnapshotSchema = new Schema<IRoleSnapshot>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const groupSnapshotSchema = new Schema<IGroupSnapshot>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const accessReviewItemSchema = new Schema<IAccessReviewItem>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'AccessReview',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
    },
    currentRoles: [roleSnapshotSchema],
    currentPermissions: [{
      type: String,
    }],
    currentGroups: [groupSnapshotSchema],
    decision: {
      type: String,
      enum: Object.values(AccessReviewDecision),
      default: AccessReviewDecision.PENDING,
      index: true,
    },
    newRoles: [{
      type: Schema.Types.ObjectId,
      ref: 'IamRole',
    }],
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewerEmail: {
      type: String,
      lowercase: true,
    },
    reviewedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for items in a review
accessReviewItemSchema.index({ reviewId: 1, decision: 1 });

// Index for finding items by user
accessReviewItemSchema.index({ tenantId: 1, userId: 1 });

// Unique constraint: one item per user per review
accessReviewItemSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

// Transform for JSON output
accessReviewItemSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    ret.reviewId = ret.reviewId.toString();
    ret.userId = ret.userId.toString();
    ret.currentRoles = ret.currentRoles.map((r: IRoleSnapshot) => ({
      id: r.id.toString(),
      name: r.name,
    }));
    ret.currentGroups = ret.currentGroups.map((g: IGroupSnapshot) => ({
      id: g.id.toString(),
      name: g.name,
    }));
    if (ret.newRoles) {
      ret.newRoles = ret.newRoles.map((r: Types.ObjectId) => r.toString());
    }
    if (ret.reviewerId) {
      ret.reviewerId = ret.reviewerId.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const AccessReviewItem = mongoose.model<IAccessReviewItem>('AccessReviewItem', accessReviewItemSchema);
