/**
 * Access Review Model
 * Periodic access reviews for compliance
 * Aligned with IAM compliance standards (SOC2, ISO27001, NIST)
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AccessReviewStatusType } from '@change/shared';
import { AccessReviewStatus } from '@change/shared';

// Review type determines the trigger and scope
export const AccessReviewType = {
  PERIODIC: 'periodic',           // Scheduled regular review (quarterly, annual)
  EVENT_TRIGGERED: 'event',       // Triggered by specific event (role change, incident)
  CERTIFICATION: 'certification', // Full access certification campaign
  RISK_BASED: 'risk_based',       // Triggered by risk indicators
  ONBOARDING: 'onboarding',       // New employee/contractor access review
  OFFBOARDING: 'offboarding',     // Departing user access removal
} as const;

export type AccessReviewTypeType = typeof AccessReviewType[keyof typeof AccessReviewType];

// Scope defines what is being reviewed
export const AccessReviewScope = {
  ALL_USERS: 'all_users',           // Review all users in tenant
  SPECIFIC_ROLES: 'specific_roles', // Review users with specific roles
  SPECIFIC_GROUPS: 'specific_groups', // Review users in specific groups
  PRIVILEGED_ACCESS: 'privileged',  // Review privileged/admin access only
  EXTERNAL_USERS: 'external',       // Review external/contractor access
  DORMANT_ACCOUNTS: 'dormant',      // Review inactive accounts
  HIGH_RISK: 'high_risk',           // Review high-risk access
} as const;

export type AccessReviewScopeType = typeof AccessReviewScope[keyof typeof AccessReviewScope];

// Risk level for prioritization
export const AccessReviewRiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type AccessReviewRiskLevelType = typeof AccessReviewRiskLevel[keyof typeof AccessReviewRiskLevel];

// Compliance framework reference
export const ComplianceFramework = {
  SOC2: 'soc2',
  ISO27001: 'iso27001',
  NIST: 'nist',
  HIPAA: 'hipaa',
  PCI_DSS: 'pci_dss',
  GDPR: 'gdpr',
  CUSTOM: 'custom',
} as const;

export type ComplianceFrameworkType = typeof ComplianceFramework[keyof typeof ComplianceFramework];

export interface IAccessReview extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  status: AccessReviewStatusType;
  
  // Review configuration
  reviewType: AccessReviewTypeType;
  scope: AccessReviewScopeType;
  scopeConfig?: {
    roleIds?: Types.ObjectId[];
    groupIds?: Types.ObjectId[];
    inactiveDays?: number;  // For dormant account reviews
  };
  
  // Compliance and risk
  complianceFramework?: ComplianceFrameworkType;
  controlReference?: string;  // e.g., "CC6.1" for SOC2
  riskLevel: AccessReviewRiskLevelType;
  
  // Reviewer assignment
  reviewerIds: Types.ObjectId[];  // Users assigned to conduct the review
  reviewerGroups?: Types.ObjectId[];  // Groups assigned to review
  
  // Timeline
  dueAt: Date;
  reminderSentAt?: Date;
  escalatedAt?: Date;
  startedAt?: Date;
  closedAt?: Date;
  
  // Ownership
  createdBy: Types.ObjectId;
  closedBy?: Types.ObjectId;
  
  // Progress tracking
  itemCount: number;
  completedItemCount: number;
  
  // Results summary
  summary?: {
    keepCount: number;
    removeCount: number;
    changeCount: number;
    pendingCount: number;
  };
  
  // Evidence and justification
  notes?: string;
  justification?: string;  // Overall review justification
  evidenceUrls?: string[];  // Links to supporting evidence
  
  // Recurrence (for periodic reviews)
  recurrence?: {
    enabled: boolean;
    frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    nextScheduledAt?: Date;
  };
  
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
    
    // Review configuration
    reviewType: {
      type: String,
      enum: Object.values(AccessReviewType),
      default: AccessReviewType.PERIODIC,
    },
    scope: {
      type: String,
      enum: Object.values(AccessReviewScope),
      default: AccessReviewScope.ALL_USERS,
    },
    scopeConfig: {
      roleIds: [{ type: Schema.Types.ObjectId, ref: 'IamRole' }],
      groupIds: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
      inactiveDays: { type: Number },
    },
    
    // Compliance and risk
    complianceFramework: {
      type: String,
      enum: Object.values(ComplianceFramework),
    },
    controlReference: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    riskLevel: {
      type: String,
      enum: Object.values(AccessReviewRiskLevel),
      default: AccessReviewRiskLevel.MEDIUM,
    },
    
    // Reviewer assignment
    reviewerIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    reviewerGroups: [{
      type: Schema.Types.ObjectId,
      ref: 'Group',
    }],
    
    // Timeline
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    reminderSentAt: Date,
    escalatedAt: Date,
    startedAt: Date,
    closedAt: Date,
    
    // Ownership
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Progress
    itemCount: {
      type: Number,
      default: 0,
    },
    completedItemCount: {
      type: Number,
      default: 0,
    },
    
    // Results summary
    summary: {
      keepCount: { type: Number, default: 0 },
      removeCount: { type: Number, default: 0 },
      changeCount: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
    },
    
    // Evidence and justification
    notes: {
      type: String,
      maxlength: 2000,
    },
    justification: {
      type: String,
      maxlength: 2000,
    },
    evidenceUrls: [{
      type: String,
      maxlength: 500,
    }],
    
    // Recurrence
    recurrence: {
      enabled: { type: Boolean, default: false },
      frequency: { 
        type: String, 
        enum: ['monthly', 'quarterly', 'semi_annual', 'annual'],
      },
      nextScheduledAt: Date,
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
