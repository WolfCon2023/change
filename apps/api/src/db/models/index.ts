/**
 * Database Models Index
 * Export all Mongoose models
 */

export { User, type IUser } from './user.model.js';
export { Tenant, type ITenant, type ITenantSettings, type ITenantSubscription } from './tenant.model.js';
export {
  BusinessProfile,
  type IBusinessProfile,
  type IAddress,
  type IRegisteredAgent,
} from './business-profile.model.js';
export { Person, type IPerson, type IPersonRole, type IPersonAddress } from './person.model.js';
export { Cohort, type ICohort, type ICohortSettings } from './cohort.model.js';
export { Enrollment, type IEnrollment } from './enrollment.model.js';
export {
  WorkflowInstance,
  type IWorkflowInstance,
  type IPhaseHistoryEntry,
  type IStepData,
} from './workflow-instance.model.js';
export { Task, type ITask, type ITaskEvidence } from './task.model.js';
export {
  DocumentTemplate,
  type IDocumentTemplate,
  type IMergeField,
} from './document-template.model.js';
export {
  DocumentInstance,
  type IDocumentInstance,
  type IDocumentVersionEntry,
} from './document-instance.model.js';
export { AuditLog, type IAuditLog } from './audit-log.model.js';

// IAM Models
export { IamRole, type IIamRole } from './iam-role.model.js';
export { Group, type IGroup } from './group.model.js';
export { AccessRequest, type IAccessRequest } from './access-request.model.js';
export { ServiceAccount, type IServiceAccount } from './service-account.model.js';
export { ApiKey, type IApiKey } from './api-key.model.js';
export { AccessReview, type IAccessReview } from './access-review.model.js';
export {
  AccessReviewItem,
  type IAccessReviewItem,
  type IRoleSnapshot,
  type IGroupSnapshot,
} from './access-review-item.model.js';
export { IamAuditLog, type IIamAuditLog } from './iam-audit-log.model.js';
export { AdvisorAssignment, type IAdvisorAssignment } from './advisor-assignment.model.js';
export { TenantSettings, type ITenantSettings as ITenantSettingsDocument } from './tenant-settings.model.js';
export {
  AccessReviewCampaign,
  type IAccessReviewCampaign,
  type IAccessReviewCampaignSubject,
  type IAccessReviewCampaignItem,
  type IAccessReviewItemDecision,
  type IAccessReviewCampaignApprovals,
  type IAccessReviewCampaignWorkflow,
} from './access-review-campaign.model.js';
