/**
 * Access Review Campaign Model
 * IAM Access Review Campaigns with embedded subjects and items
 * Supports multi-tenancy, RBAC, audit logs, and compliance requirements
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  AccessReviewCampaignStatus,
  CampaignDecisionType,
  PrivilegeLevel,
  EmploymentType,
  EnvironmentType,
  DataClassification,
  EntitlementType,
  GrantMethod,
  SodConcern,
  ReviewType,
  ReviewerType,
  RemediationStatus,
  SubjectStatus,
  SecondLevelDecision,
  DecisionReasonCode,
  RegulatedFlag,
} from '@change/shared';
import type {
  AccessReviewCampaignStatusType,
  CampaignDecisionTypeValue,
  PrivilegeLevelType,
  EmploymentTypeValue,
  EnvironmentTypeValue,
  DataClassificationType,
  EntitlementTypeValue,
  GrantMethodType,
  SodConcernType,
  ReviewTypeValue,
  ReviewerTypeValue,
  RemediationStatusType,
  SubjectStatusType,
  SecondLevelDecisionType,
  DecisionReasonCodeType,
  RegulatedFlagType,
} from '@change/shared';

// =============================================================================
// EMBEDDED SCHEMAS
// =============================================================================

/**
 * Access Review Decision (embedded in Item)
 */
export interface IAccessReviewItemDecision {
  decisionType: CampaignDecisionTypeValue;
  reasonCode?: DecisionReasonCodeType;
  comments?: string;
  effectiveDate?: Date;
  requestedChange?: {
    newRoleName?: string;
    newPermissions?: string[];
    newScope?: string;
    expirationDate?: Date;
    notes?: string;
  };
  evidenceProvided?: boolean;
  evidenceLink?: string;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
}

const accessReviewItemDecisionSchema = new Schema<IAccessReviewItemDecision>(
  {
    decisionType: {
      type: String,
      enum: Object.values(CampaignDecisionType),
      default: CampaignDecisionType.PENDING,
    },
    reasonCode: {
      type: String,
      enum: Object.values(DecisionReasonCode),
    },
    comments: {
      type: String,
      maxlength: 2000,
    },
    effectiveDate: Date,
    requestedChange: {
      newRoleName: String,
      newPermissions: [String],
      newScope: String,
      expirationDate: Date,
      notes: String,
    },
    evidenceProvided: Boolean,
    evidenceLink: {
      type: String,
      maxlength: 500,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    decidedAt: Date,
  },
  { _id: false }
);

/**
 * Access Review Item (embedded in Subject)
 */
export interface IAccessReviewCampaignItem {
  _id?: Types.ObjectId;
  // Application/System info
  application: string;
  environment: EnvironmentTypeValue;
  // Role/Entitlement info
  roleName: string;
  roleDescription?: string;
  entitlementName?: string;
  entitlementType: EntitlementTypeValue;
  privilegeLevel: PrivilegeLevelType;
  scope?: string;
  // Grant info
  grantedDate?: Date;
  grantedBy?: string;
  grantMethod: GrantMethodType;
  // Usage info
  lastUsedDate?: Date;
  authMethod?: string;
  mfaEnabled?: boolean;
  // Justification
  justificationOnFile?: string;
  ticketId?: string;
  supportLink?: string;
  // Classification
  dataClassification: DataClassificationType;
  regulatedFlags?: RegulatedFlagType[];
  // Derived/computed
  isPrivileged?: boolean;
  sodConcern?: SodConcernType;
  compensatingControls?: string;
  // Decision
  decision?: IAccessReviewItemDecision;
}

const accessReviewCampaignItemSchema = new Schema<IAccessReviewCampaignItem>(
  {
    application: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    environment: {
      type: String,
      enum: Object.values(EnvironmentType),
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    roleDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    entitlementName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    entitlementType: {
      type: String,
      enum: Object.values(EntitlementType),
      required: true,
    },
    privilegeLevel: {
      type: String,
      enum: Object.values(PrivilegeLevel),
      required: true,
    },
    scope: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    grantedDate: Date,
    grantedBy: String,
    grantMethod: {
      type: String,
      enum: Object.values(GrantMethod),
      required: true,
    },
    lastUsedDate: Date,
    authMethod: String,
    mfaEnabled: Boolean,
    justificationOnFile: {
      type: String,
      maxlength: 1000,
    },
    ticketId: String,
    supportLink: {
      type: String,
      maxlength: 500,
    },
    dataClassification: {
      type: String,
      enum: Object.values(DataClassification),
      required: true,
    },
    regulatedFlags: [{
      type: String,
      enum: Object.values(RegulatedFlag),
    }],
    isPrivileged: Boolean,
    sodConcern: {
      type: String,
      enum: Object.values(SodConcern),
    },
    compensatingControls: {
      type: String,
      maxlength: 1000,
    },
    decision: accessReviewItemDecisionSchema,
  },
  { _id: true }
);

// Compute isPrivileged before save
accessReviewCampaignItemSchema.pre('save', function() {
  this.isPrivileged = 
    this.privilegeLevel === PrivilegeLevel.ADMIN || 
    this.privilegeLevel === PrivilegeLevel.SUPER_ADMIN;
});

/**
 * Access Review Subject (embedded in Campaign)
 */
export interface IAccessReviewCampaignSubject {
  _id?: Types.ObjectId;
  // User identification (can be ObjectId string or synthetic ID)
  subjectId: string;
  fullName: string;
  email: string;
  employeeId?: string;
  // Job info
  jobTitle?: string;
  department?: string;
  managerName?: string;
  managerEmail?: string;
  location?: string;
  // Employment info
  startDate?: Date;
  endDate?: Date;
  employmentType: EmploymentTypeValue;
  // Review status
  status: SubjectStatusType;
  // Access items to review
  items: IAccessReviewCampaignItem[];
  // Timestamps
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
}

const accessReviewCampaignSubjectSchema = new Schema<IAccessReviewCampaignSubject>(
  {
    subjectId: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    employeeId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    managerName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    managerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    startDate: Date,
    endDate: Date,
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubjectStatus),
      default: SubjectStatus.PENDING,
    },
    items: [accessReviewCampaignItemSchema],
    reviewedAt: Date,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

/**
 * Campaign Approvals (embedded in Campaign)
 */
export interface IAccessReviewCampaignApprovals {
  reviewerName: string;
  reviewerEmail: string;
  reviewerAttestation?: boolean;
  reviewerAttestedAt?: Date;
  secondLevelRequired?: boolean;
  secondApproverName?: string;
  secondApproverEmail?: string;
  secondDecision?: SecondLevelDecisionType;
  secondDecisionNotes?: string;
  secondDecidedAt?: Date;
}

const accessReviewCampaignApprovalsSchema = new Schema<IAccessReviewCampaignApprovals>(
  {
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    reviewerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    reviewerAttestation: Boolean,
    reviewerAttestedAt: Date,
    secondLevelRequired: Boolean,
    secondApproverName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    secondApproverEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    secondDecision: {
      type: String,
      enum: Object.values(SecondLevelDecision),
    },
    secondDecisionNotes: {
      type: String,
      maxlength: 2000,
    },
    secondDecidedAt: Date,
  },
  { _id: false }
);

/**
 * Campaign Workflow (embedded in Campaign)
 */
export interface IAccessReviewCampaignWorkflow {
  dueDate: Date;
  escalationLevel?: number;
  notificationsSentAt?: Date[];
  remediationTicketCreated?: boolean;
  remediationTicketId?: string;
  remediationStatus?: RemediationStatusType;
  remediationCompletedAt?: Date;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
}

const accessReviewCampaignWorkflowSchema = new Schema<IAccessReviewCampaignWorkflow>(
  {
    dueDate: {
      type: Date,
      required: true,
    },
    escalationLevel: {
      type: Number,
      default: 0,
    },
    notificationsSentAt: [Date],
    remediationTicketCreated: Boolean,
    remediationTicketId: String,
    remediationStatus: {
      type: String,
      enum: Object.values(RemediationStatus),
    },
    remediationCompletedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
  },
  { _id: false }
);

// =============================================================================
// MAIN CAMPAIGN DOCUMENT
// =============================================================================

export interface IAccessReviewCampaign extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  // Campaign identification
  name: string;
  description?: string;
  systemName: string;
  environment: EnvironmentTypeValue;
  businessUnit?: string;
  // Review metadata
  reviewType: ReviewTypeValue;
  triggerReason?: string;
  periodStart: Date;
  periodEnd: Date;
  // Status
  status: AccessReviewCampaignStatusType;
  // Creator/Owner
  createdBy: Types.ObjectId;
  createdByEmail?: string;
  // Reviewer assignment
  reviewerType: ReviewerTypeValue;
  assignedReviewerId?: Types.ObjectId;
  assignedReviewerEmail?: string;
  // Embedded documents
  subjects: IAccessReviewCampaignSubject[];
  approvals?: IAccessReviewCampaignApprovals;
  workflow?: IAccessReviewCampaignWorkflow;
  // Stats (computed)
  totalSubjects: number;
  completedSubjects: number;
  totalItems: number;
  completedItems: number;
  // Timestamps
  submittedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const accessReviewCampaignSchema = new Schema<IAccessReviewCampaign>(
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
      maxlength: 2000,
    },
    systemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    environment: {
      type: String,
      enum: Object.values(EnvironmentType),
      required: true,
    },
    businessUnit: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    reviewType: {
      type: String,
      enum: Object.values(ReviewType),
      required: true,
    },
    triggerReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AccessReviewCampaignStatus),
      default: AccessReviewCampaignStatus.DRAFT,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    reviewerType: {
      type: String,
      enum: Object.values(ReviewerType),
      required: true,
    },
    assignedReviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedReviewerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    subjects: [accessReviewCampaignSubjectSchema],
    approvals: accessReviewCampaignApprovalsSchema,
    workflow: accessReviewCampaignWorkflowSchema,
    totalSubjects: {
      type: Number,
      default: 0,
    },
    completedSubjects: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    completedItems: {
      type: Number,
      default: 0,
    },
    submittedAt: Date,
    approvedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound indexes for common queries
accessReviewCampaignSchema.index({ tenantId: 1, status: 1 });
accessReviewCampaignSchema.index({ tenantId: 1, systemName: 1 });
accessReviewCampaignSchema.index({ tenantId: 1, periodEnd: 1 });
accessReviewCampaignSchema.index({ tenantId: 1, 'subjects.subjectId': 1 });
accessReviewCampaignSchema.index({ tenantId: 1, assignedReviewerId: 1 });
accessReviewCampaignSchema.index({ tenantId: 1, status: 1, 'workflow.dueDate': 1 });

// =============================================================================
// VIRTUALS
// =============================================================================

accessReviewCampaignSchema.virtual('completionPercentage').get(function() {
  if (this.totalItems === 0) return 0;
  return Math.round((this.completedItems / this.totalItems) * 100);
});

accessReviewCampaignSchema.virtual('subjectCompletionPercentage').get(function() {
  if (this.totalSubjects === 0) return 0;
  return Math.round((this.completedSubjects / this.totalSubjects) * 100);
});

// =============================================================================
// PRE-SAVE HOOKS
// =============================================================================

accessReviewCampaignSchema.pre('save', function(next) {
  // Compute stats
  this.totalSubjects = this.subjects.length;
  this.completedSubjects = this.subjects.filter(
    s => s.status === SubjectStatus.COMPLETED
  ).length;
  
  this.totalItems = this.subjects.reduce(
    (sum, s) => sum + (s.items?.length || 0),
    0
  );
  this.completedItems = this.subjects.reduce(
    (sum, s) => sum + (s.items?.filter(
      i => i.decision?.decisionType && i.decision.decisionType !== CampaignDecisionType.PENDING
    ).length || 0),
    0
  );

  // Check if second-level approval is required
  const hasPrivilegedAccess = this.subjects.some(s =>
    s.items?.some(i =>
      i.privilegeLevel === PrivilegeLevel.ADMIN ||
      i.privilegeLevel === PrivilegeLevel.SUPER_ADMIN
    )
  );
  
  if (this.approvals && hasPrivilegedAccess) {
    this.approvals.secondLevelRequired = true;
  }

  next();
});

// =============================================================================
// JSON TRANSFORM
// =============================================================================

accessReviewCampaignSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    ret.createdBy = ret.createdBy.toString();
    if (ret.assignedReviewerId) {
      ret.assignedReviewerId = ret.assignedReviewerId.toString();
    }
    
    // Transform subjects
    if (ret.subjects) {
      ret.subjects = ret.subjects.map((s: IAccessReviewCampaignSubject & { _id?: Types.ObjectId }) => ({
        ...s,
        id: s._id?.toString(),
        subjectId: s.subjectId.toString(),
        reviewedBy: s.reviewedBy?.toString(),
        items: s.items?.map((i: IAccessReviewCampaignItem & { _id?: Types.ObjectId }) => ({
          ...i,
          id: i._id?.toString(),
          decision: i.decision ? {
            ...i.decision,
            decidedBy: i.decision.decidedBy?.toString(),
          } : undefined,
        })),
      }));
    }
    
    // Transform workflow
    if (ret.workflow?.verifiedBy) {
      ret.workflow.verifiedBy = ret.workflow.verifiedBy.toString();
    }
    
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const AccessReviewCampaign = mongoose.model<IAccessReviewCampaign>(
  'AccessReviewCampaign',
  accessReviewCampaignSchema
);
