/**
 * Access Review Item Model
 * Individual user reviews within an access review
 * Enhanced with IAM compliance fields for audit and risk assessment
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IamPermissionType, AccessReviewDecisionType } from '@change/shared';
import { AccessReviewDecision } from '@change/shared';

// Risk indicator types
export const RiskIndicator = {
  DORMANT_ACCOUNT: 'dormant_account',       // No login in X days
  EXCESSIVE_PERMISSIONS: 'excessive_perms', // More permissions than role requires
  PRIVILEGED_ACCESS: 'privileged_access',   // Has admin/elevated access
  SOD_VIOLATION: 'sod_violation',           // Separation of duties conflict
  EXTERNAL_USER: 'external_user',           // External/contractor account
  ORPHAN_ACCOUNT: 'orphan_account',         // No manager/owner assigned
  NEVER_LOGGED_IN: 'never_logged_in',       // Account created but never used
  FAILED_LOGINS: 'failed_logins',           // Recent failed login attempts
  ACCESS_ANOMALY: 'access_anomaly',         // Unusual access pattern detected
} as const;

export type RiskIndicatorType = typeof RiskIndicator[keyof typeof RiskIndicator];

export interface IRoleSnapshot {
  id: Types.ObjectId;
  name: string;
  isSystem?: boolean;
  permissions?: string[];
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
  
  // Current access state (snapshot at review creation)
  currentRoles: IRoleSnapshot[];
  currentPermissions: IamPermissionType[];
  currentGroups: IGroupSnapshot[];
  
  // User account metadata for compliance review
  accountMetadata: {
    createdAt?: Date;
    lastLoginAt?: Date;
    daysSinceLastLogin?: number;
    isActive: boolean;
    mfaEnabled: boolean;
    primaryRole?: string;
    department?: string;
    manager?: string;
    accountType: 'employee' | 'contractor' | 'service' | 'external';
  };
  
  // Risk assessment
  riskIndicators: RiskIndicatorType[];
  riskScore?: number;  // Calculated risk score (0-100)
  riskNotes?: string;  // Explanation of risk factors
  
  // SoD (Separation of Duties) analysis
  sodViolations?: {
    conflictingRoles: string[];
    description: string;
  }[];
  
  // Review decision
  decision: AccessReviewDecisionType;
  newRoles?: Types.ObjectId[]; // If decision is 'change'
  
  // Reviewer information
  reviewerId?: Types.ObjectId;
  reviewerEmail?: string;
  reviewedAt?: Date;
  
  // Justification and evidence (required for compliance)
  notes?: string;
  justification?: string;  // Required explanation for keep/change decisions
  evidenceChecked?: boolean;  // Reviewer confirmed evidence review
  
  // Previous review reference
  previousReviewId?: Types.ObjectId;
  previousDecision?: AccessReviewDecisionType;
  
  // Action tracking
  actionRequired?: boolean;
  actionDueAt?: Date;
  actionCompletedAt?: Date;
  actionNotes?: string;
  
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
    isSystem: Boolean,
    permissions: [String],
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

const sodViolationSchema = new Schema(
  {
    conflictingRoles: [String],
    description: String,
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
    
    // Current access state
    currentRoles: [roleSnapshotSchema],
    currentPermissions: [{ type: String }],
    currentGroups: [groupSnapshotSchema],
    
    // Account metadata for compliance review
    accountMetadata: {
      createdAt: Date,
      lastLoginAt: Date,
      daysSinceLastLogin: Number,
      isActive: { type: Boolean, default: true },
      mfaEnabled: { type: Boolean, default: false },
      primaryRole: String,
      department: String,
      manager: String,
      accountType: {
        type: String,
        enum: ['employee', 'contractor', 'service', 'external'],
        default: 'employee',
      },
    },
    
    // Risk assessment
    riskIndicators: [{
      type: String,
      enum: Object.values(RiskIndicator),
    }],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    riskNotes: {
      type: String,
      maxlength: 1000,
    },
    
    // SoD violations
    sodViolations: [sodViolationSchema],
    
    // Decision
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
    
    // Reviewer
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewerEmail: {
      type: String,
      lowercase: true,
    },
    reviewedAt: Date,
    
    // Justification and evidence
    notes: {
      type: String,
      maxlength: 2000,
    },
    justification: {
      type: String,
      maxlength: 2000,
    },
    evidenceChecked: {
      type: Boolean,
      default: false,
    },
    
    // Previous review reference
    previousReviewId: {
      type: Schema.Types.ObjectId,
      ref: 'AccessReview',
    },
    previousDecision: {
      type: String,
      enum: Object.values(AccessReviewDecision),
    },
    
    // Action tracking
    actionRequired: Boolean,
    actionDueAt: Date,
    actionCompletedAt: Date,
    actionNotes: {
      type: String,
      maxlength: 1000,
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
