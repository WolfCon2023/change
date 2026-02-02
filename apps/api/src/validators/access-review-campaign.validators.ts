/**
 * Access Review Campaign Validators
 * Zod schemas for validating Access Review Campaign requests
 */

import { z } from 'zod';
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
  PaginationDefaults,
} from '@change/shared';

// =============================================================================
// EMBEDDED SCHEMAS
// =============================================================================

/**
 * Access Review Decision Schema
 */
export const accessReviewItemDecisionSchema = z.object({
  decisionType: z.enum(Object.values(CampaignDecisionType) as [string, ...string[]]),
  reasonCode: z.enum(Object.values(DecisionReasonCode) as [string, ...string[]]).optional(),
  comments: z.string().max(2000).optional(),
  effectiveDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  requestedChange: z.object({
    newRoleName: z.string().max(200).optional(),
    newPermissions: z.array(z.string()).optional(),
    newScope: z.string().max(200).optional(),
    expirationDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
    notes: z.string().max(500).optional(),
  }).optional(),
  evidenceProvided: z.boolean().optional(),
  evidenceLink: z.string().url().max(500).optional(),
}).refine(
  // If decision is REVOKE or MODIFY, comments are required
  (data) => {
    if (data.decisionType === CampaignDecisionType.REVOKE || 
        data.decisionType === CampaignDecisionType.MODIFY) {
      return data.comments && data.comments.length > 0;
    }
    return true;
  },
  { message: 'Comments are required for REVOKE or MODIFY decisions', path: ['comments'] }
).refine(
  // If decision is MODIFY, requestedChange is required
  (data) => {
    if (data.decisionType === CampaignDecisionType.MODIFY) {
      return data.requestedChange !== undefined;
    }
    return true;
  },
  { message: 'Requested change details are required for MODIFY decisions', path: ['requestedChange'] }
);

/**
 * Access Review Item Schema
 */
export const accessReviewCampaignItemSchema = z.object({
  id: z.string().optional(),
  application: z.string().min(1).max(200),
  environment: z.enum(Object.values(EnvironmentType) as [string, ...string[]]),
  roleName: z.string().min(1).max(200),
  roleDescription: z.string().max(500).optional(),
  entitlementName: z.string().max(200).optional(),
  entitlementType: z.enum(Object.values(EntitlementType) as [string, ...string[]]),
  privilegeLevel: z.enum(Object.values(PrivilegeLevel) as [string, ...string[]]),
  scope: z.string().max(200).optional(),
  grantedDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  grantedBy: z.string().max(200).optional(),
  grantMethod: z.enum(Object.values(GrantMethod) as [string, ...string[]]),
  lastUsedDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  authMethod: z.string().max(100).optional(),
  mfaEnabled: z.boolean().optional(),
  justificationOnFile: z.string().max(1000).optional(),
  ticketId: z.string().max(100).optional(),
  supportLink: z.string().url().max(500).optional(),
  dataClassification: z.enum(Object.values(DataClassification) as [string, ...string[]]),
  regulatedFlags: z.array(
    z.enum(Object.values(RegulatedFlag) as [string, ...string[]])
  ).optional(),
  isPrivileged: z.boolean().optional(),
  sodConcern: z.enum(Object.values(SodConcern) as [string, ...string[]]).optional(),
  compensatingControls: z.string().max(1000).optional(),
  decision: accessReviewItemDecisionSchema.optional(),
}).refine(
  // If dataClassification is RESTRICTED, require evidence
  (data) => {
    if (data.dataClassification === DataClassification.RESTRICTED) {
      return data.decision?.evidenceProvided === true || 
             (data.decision?.evidenceLink && data.decision.evidenceLink.length > 0);
    }
    return true;
  },
  { message: 'Evidence is required for RESTRICTED data classification items', path: ['decision'] }
);

/**
 * Access Review Subject Schema
 */
export const accessReviewCampaignSubjectSchema = z.object({
  id: z.string().optional(),
  subjectId: z.string().min(1),
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  employeeId: z.string().max(50).optional(),
  jobTitle: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  managerName: z.string().max(200).optional(),
  managerEmail: z.string().email().max(254).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  endDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  employmentType: z.enum(Object.values(EmploymentType) as [string, ...string[]]),
  status: z.enum(Object.values(SubjectStatus) as [string, ...string[]]).optional(),
  items: z.array(accessReviewCampaignItemSchema).min(1, 'At least one access item is required'),
}).refine(
  // If employmentType is CONTRACTOR or VENDOR, endDate is required
  (data) => {
    if (data.employmentType === EmploymentType.CONTRACTOR || 
        data.employmentType === EmploymentType.VENDOR) {
      return data.endDate !== undefined;
    }
    return true;
  },
  { message: 'End date is required for contractors and vendors', path: ['endDate'] }
);

/**
 * Campaign Approvals Schema
 */
export const accessReviewCampaignApprovalsSchema = z.object({
  reviewerName: z.string().min(1).max(200),
  reviewerEmail: z.string().email().max(254),
  reviewerAttestation: z.boolean().optional(),
  reviewerAttestedAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  secondLevelRequired: z.boolean().optional(),
  secondApproverName: z.string().max(200).optional(),
  secondApproverEmail: z.string().email().max(254).optional(),
  secondDecision: z.enum(Object.values(SecondLevelDecision) as [string, ...string[]]).optional(),
  secondDecisionNotes: z.string().max(2000).optional(),
  secondDecidedAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
});

/**
 * Campaign Workflow Schema
 */
export const accessReviewCampaignWorkflowSchema = z.object({
  dueDate: z.string().datetime().transform(v => new Date(v)),
  escalationLevel: z.number().int().min(0).optional(),
  notificationsSentAt: z.array(z.string().datetime().transform(v => new Date(v))).optional(),
  remediationTicketCreated: z.boolean().optional(),
  remediationTicketId: z.string().max(100).optional(),
  remediationStatus: z.enum(Object.values(RemediationStatus) as [string, ...string[]]).optional(),
  remediationCompletedAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
});

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

/**
 * Create Campaign Request Schema
 */
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(2000).optional(),
  systemName: z.string().min(1, 'System name is required').max(200),
  environment: z.enum(Object.values(EnvironmentType) as [string, ...string[]]),
  businessUnit: z.string().max(200).optional(),
  reviewType: z.enum(Object.values(ReviewType) as [string, ...string[]]),
  triggerReason: z.string().max(500).optional(),
  periodStart: z.string().datetime().transform(v => new Date(v)),
  periodEnd: z.string().datetime().transform(v => new Date(v)),
  reviewerType: z.enum(Object.values(ReviewerType) as [string, ...string[]]),
  assignedReviewerId: z.string().optional(),
  assignedReviewerEmail: z.string().email().max(254).optional(),
  subjects: z.array(accessReviewCampaignSubjectSchema).optional(),
  workflow: z.object({
    dueDate: z.string().datetime().transform(v => new Date(v)),
  }).optional(),
}).refine(
  // periodEnd must be after periodStart
  (data) => data.periodEnd > data.periodStart,
  { message: 'Period end date must be after period start date', path: ['periodEnd'] }
);

/**
 * Update Campaign Request Schema
 */
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  systemName: z.string().min(1).max(200).optional(),
  environment: z.enum(Object.values(EnvironmentType) as [string, ...string[]]).optional(),
  businessUnit: z.string().max(200).optional(),
  reviewType: z.enum(Object.values(ReviewType) as [string, ...string[]]).optional(),
  triggerReason: z.string().max(500).optional(),
  periodStart: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  periodEnd: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  reviewerType: z.enum(Object.values(ReviewerType) as [string, ...string[]]).optional(),
  assignedReviewerId: z.string().optional(),
  assignedReviewerEmail: z.string().email().max(254).optional(),
  subjects: z.array(accessReviewCampaignSubjectSchema).optional(),
  approvals: accessReviewCampaignApprovalsSchema.optional(),
  workflow: accessReviewCampaignWorkflowSchema.partial().optional(),
});

/**
 * Submit Campaign Request Schema
 */
export const submitCampaignSchema = z.object({
  reviewerAttestation: z.boolean().refine(val => val === true, {
    message: 'Reviewer attestation is required to submit',
  }),
  reviewerName: z.string().min(1).max(200),
  reviewerEmail: z.string().email().max(254),
});

/**
 * Approve Campaign Request Schema (Second-level)
 */
export const approveCampaignSchema = z.object({
  decision: z.enum([SecondLevelDecision.APPROVED, SecondLevelDecision.REJECTED]),
  notes: z.string().max(2000).optional(),
  approverName: z.string().min(1).max(200),
  approverEmail: z.string().email().max(254),
});

/**
 * Remediate Campaign Request Schema
 */
export const remediateCampaignSchema = z.object({
  remediationTicketId: z.string().min(1).max(100),
  remediationStatus: z.enum(Object.values(RemediationStatus) as [string, ...string[]]),
  notes: z.string().max(2000).optional(),
});

/**
 * Complete Campaign Request Schema
 */
export const completeCampaignSchema = z.object({
  verifiedBy: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
});

/**
 * Campaign List Filters Schema
 */
export const campaignFiltersSchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : PaginationDefaults.PAGE),
  limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), PaginationDefaults.MAX_LIMIT) : PaginationDefaults.LIMIT),
  status: z.enum(Object.values(AccessReviewCampaignStatus) as [string, ...string[]]).optional(),
  systemName: z.string().optional(),
  environment: z.enum(Object.values(EnvironmentType) as [string, ...string[]]).optional(),
  reviewType: z.enum(Object.values(ReviewType) as [string, ...string[]]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  assignedReviewerId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'systemName', 'status', 'periodEnd']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// =============================================================================
// VALIDATION HELPER
// =============================================================================

/**
 * Validate campaign has complete decisions for submission
 */
export function validateCampaignForSubmission(campaign: {
  subjects: Array<{
    items: Array<{
      decision?: {
        decisionType: string;
      };
      dataClassification: string;
      privilegeLevel: string;
    }>;
  }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all items have decisions
  let itemIndex = 0;
  for (const subject of campaign.subjects) {
    for (const item of subject.items) {
      itemIndex++;
      
      if (!item.decision || item.decision.decisionType === CampaignDecisionType.PENDING) {
        errors.push(`Item ${itemIndex} is missing a decision`);
      }
      
      // Check RESTRICTED items have evidence
      if (item.dataClassification === DataClassification.RESTRICTED) {
        const decision = item.decision;
        if (!decision?.evidenceProvided && !decision?.evidenceLink) {
          errors.push(`Item ${itemIndex} requires evidence for RESTRICTED classification`);
        }
      }
    }
  }

  // Check for privileged access requiring second-level approval
  const hasPrivilegedAccess = campaign.subjects.some(s =>
    s.items.some(i =>
      i.privilegeLevel === PrivilegeLevel.ADMIN ||
      i.privilegeLevel === PrivilegeLevel.SUPER_ADMIN
    )
  );

  if (hasPrivilegedAccess) {
    // This will be enforced by the route handler
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
