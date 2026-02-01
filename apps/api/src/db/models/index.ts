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
