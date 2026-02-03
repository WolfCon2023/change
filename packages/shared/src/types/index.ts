/**
 * CHANGE Platform Core Types
 * Shared between frontend and backend
 * Aligned to SRS/PRD entity requirements
 */

import type {
  UserRoleType,
  EnrollmentStatusType,
  WorkflowPhaseType,
  WorkflowStatusType,
  FormationStepType,
  TaskStatusType,
  TaskPriorityType,
  TaskCategoryType,
  DocumentTypeValue,
  DocumentStatusType,
  BusinessTypeValue,
  USStateType,
  AuditActionType,
  CohortStatusType,
  IamPermissionType,
  SystemRoleType,
  AccessRequestStatusType,
  AccessReviewStatusType,
  AccessReviewDecisionType,
  ServiceAccountStatusType,
  ApiKeyStatusType,
  IamAuditActionType,
  PrimaryRoleType,
  OperationalPermissionType,
  AdvisorAssignmentStatusType,
  // Access Review Campaign types
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
  CampaignScopeTypeValue,
  GroupReviewStatusType,
  BulkActionTypeValue,
  // Business App types
  FormationStatusType,
  EINStatusType,
  ArtifactTypeValue,
  WorkflowTemplateCategoryType,
  WorkflowInstanceStatusType,
  StepStatusType,
  DMAICPhaseType,
  ProcessCategoryType,
  KPIFrequencyType,
  RiskLevelType,
  ApprovalStatusType,
} from '../constants/index.js';

// =============================================================================
// BASE TYPES
// =============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantScopedEntity extends BaseEntity {
  tenantId: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: USStateType;
  zipCode: string;
  country: string;
}

// =============================================================================
// USER & AUTH (TRS-ARCH-002: RBAC)
// =============================================================================

export interface User extends BaseEntity {
  email: string;
  passwordHash?: string; // Excluded from API responses
  firstName: string;
  lastName: string;
  role: UserRoleType; // Legacy role field (deprecated, kept for compatibility)
  primaryRole?: PrimaryRoleType; // New simplified role (IT_ADMIN, MANAGER, ADVISOR, CUSTOMER)
  tenantId?: string; // Null for platform-level users (advisors, IT admins)
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean;
  profileImageUrl?: string;
}

export interface UserPublic extends Omit<User, 'passwordHash'> {}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRoleType;
  tenantId?: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRoleType;
  tenantId?: string;
}

// =============================================================================
// TENANT (TRS-ARCH-001: Multi-tenant)
// =============================================================================

export interface Tenant extends BaseEntity {
  name: string;
  slug: string; // URL-friendly identifier
  isActive: boolean;
  settings: TenantSettings;
  subscription?: TenantSubscription;
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  features: string[]; // Feature flags
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}

export interface TenantSubscription {
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: Date;
}

// =============================================================================
// BUSINESS PROFILE (PRD-FR-001: Client Onboarding)
// =============================================================================

export interface BusinessProfile extends TenantScopedEntity {
  // Basic Info
  businessName: string;
  dbaName?: string;
  businessType: BusinessTypeValue;
  formationState: USStateType;
  
  // Status
  isExistingBusiness: boolean;
  formationDate?: Date;
  
  // Contact
  email: string;
  phone?: string;
  website?: string;
  
  // Address
  businessAddress?: Address;
  mailingAddress?: Address;
  
  // Registered Agent
  registeredAgent?: RegisteredAgent;
  
  // Tax Info
  ein?: string;
  einApplicationDate?: Date;
  sosFilingNumber?: string;
  sosFilingDate?: Date;
  
  // Industry (Phase 2+ placeholder)
  industryCode?: string;
  sectorId?: string;
  
  // Completion tracking
  profileCompleteness: number; // 0-100
  
  // Timestamps
  submittedAt?: Date;
  approvedAt?: Date;
}

export interface RegisteredAgent {
  type: 'self' | 'commercial' | 'individual';
  name: string;
  address: Address;
  email?: string;
  phone?: string;
}

export interface BusinessProfileCreateRequest {
  businessName: string;
  businessType: BusinessTypeValue;
  formationState: USStateType;
  isExistingBusiness: boolean;
  email: string;
  phone?: string;
}

export interface BusinessProfileUpdateRequest extends Partial<BusinessProfileCreateRequest> {
  dbaName?: string;
  website?: string;
  businessAddress?: Address;
  mailingAddress?: Address;
  registeredAgent?: RegisteredAgent;
  ein?: string;
  sosFilingNumber?: string;
}

// =============================================================================
// PERSON / MEMBERS (Business members/officers)
// =============================================================================

export interface Person extends TenantScopedEntity {
  businessProfileId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  ssn?: string; // Encrypted, excluded from API responses
  dateOfBirth?: Date;
  roles: PersonRole[];
  ownershipPercentage?: number;
  isSigningAuthority: boolean;
  isPrimaryContact: boolean;
}

export interface PersonRole {
  type: 'owner' | 'member' | 'manager' | 'officer' | 'director' | 'registered_agent';
  title?: string; // e.g., "CEO", "CFO", "Secretary"
  startDate: Date;
  endDate?: Date;
}

export interface PersonCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: PersonRole[];
  ownershipPercentage?: number;
  isSigningAuthority?: boolean;
  isPrimaryContact?: boolean;
}

// =============================================================================
// COHORT & ENROLLMENT (PRD-FR-002: Program Enrollment)
// =============================================================================

export interface Cohort extends BaseEntity {
  name: string;
  description?: string;
  programId: string;
  status: CohortStatusType;
  startDate: Date;
  endDate?: Date;
  maxCapacity?: number;
  currentEnrollment: number;
  advisorIds: string[];
  settings: CohortSettings;
}

export interface CohortSettings {
  autoEnrollment: boolean;
  requiresApproval: boolean;
  allowLateEnrollment: boolean;
}

export interface Enrollment extends TenantScopedEntity {
  cohortId: string;
  businessProfileId: string;
  status: EnrollmentStatusType;
  appliedAt: Date;
  enrolledAt?: Date;
  activatedAt?: Date;
  completedAt?: Date;
  withdrawnAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  advisorId?: string;
}

export interface EnrollmentCreateRequest {
  cohortId: string;
  businessProfileId: string;
  notes?: string;
}

export interface EnrollmentUpdateRequest {
  status?: EnrollmentStatusType;
  notes?: string;
  advisorId?: string;
  rejectionReason?: string;
}

// =============================================================================
// WORKFLOW (TRS-ARCH-003: Gated workflows)
// =============================================================================

export interface WorkflowInstance extends TenantScopedEntity {
  businessProfileId: string;
  enrollmentId?: string;
  currentPhase: WorkflowPhaseType;
  currentStep?: FormationStepType;
  status: WorkflowStatusType;
  phaseHistory: PhaseHistoryEntry[];
  stepData: Record<string, StepData>;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PhaseHistoryEntry {
  phase: WorkflowPhaseType;
  status: WorkflowStatusType;
  enteredAt: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface StepData {
  step: FormationStepType;
  status: WorkflowStatusType;
  data: Record<string, unknown>;
  validationErrors?: string[];
  completedAt?: Date;
  completedBy?: string;
}

export interface WorkflowAdvanceRequest {
  targetPhase?: WorkflowPhaseType;
  targetStep?: FormationStepType;
  stepData?: Record<string, unknown>;
  notes?: string;
}

export interface WorkflowGateCheck {
  canAdvance: boolean;
  missingRequirements: string[];
  incompleteTasks: string[];
  warnings: string[];
}

// =============================================================================
// TASKS & CHECKLISTS (PRD-FR-005: Task Management)
// =============================================================================

export interface Task extends TenantScopedEntity {
  workflowInstanceId: string;
  businessProfileId: string;
  title: string;
  description?: string;
  category: TaskCategoryType;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  assigneeId?: string;
  parentTaskId?: string; // For subtasks
  phase: WorkflowPhaseType;
  step?: FormationStepType;
  isRequired: boolean;
  isBlocking: boolean; // Blocks workflow progression
  order: number;
  evidence?: TaskEvidence[];
  metadata?: Record<string, unknown>;
}

export interface TaskEvidence {
  id: string;
  type: 'file' | 'link' | 'note';
  name: string;
  url?: string;
  content?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Checklist extends TenantScopedEntity {
  workflowInstanceId: string;
  name: string;
  description?: string;
  phase: WorkflowPhaseType;
  step?: FormationStepType;
  taskIds: string[];
  completedTaskCount: number;
  totalTaskCount: number;
  isComplete: boolean;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  category: TaskCategoryType;
  priority?: TaskPriorityType;
  dueDate?: Date;
  assigneeId?: string;
  isRequired?: boolean;
  isBlocking?: boolean;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  dueDate?: Date;
  assigneeId?: string;
}

// =============================================================================
// DOCUMENTS (PRD-FR-004 + TRS-ARCH-004: Document Generation)
// =============================================================================

export interface DocumentTemplate extends BaseEntity {
  name: string;
  description?: string;
  type: DocumentTypeValue;
  version: number;
  isLatestVersion: boolean;
  previousVersionId?: string;
  content: string; // Template content with merge fields
  mergeFields: MergeField[];
  applicableBusinessTypes: BusinessTypeValue[];
  applicableStates?: USStateType[];
  isActive: boolean;
  createdBy: string;
}

export interface MergeField {
  key: string;
  label: string;
  source: 'business_profile' | 'person' | 'custom';
  sourcePath?: string; // e.g., "businessName", "members[0].firstName"
  required: boolean;
  defaultValue?: string;
}

export interface DocumentInstance extends TenantScopedEntity {
  templateId: string;
  templateVersion: number;
  businessProfileId: string;
  workflowInstanceId?: string;
  name: string;
  type: DocumentTypeValue;
  status: DocumentStatusType;
  content?: string; // Generated content
  mergeData: Record<string, unknown>; // Data used for generation
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  generatedAt?: Date;
  generatedBy?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  approvedAt?: Date;
  approvedBy?: string;
  versionHistory: DocumentVersionEntry[];
}

export interface DocumentVersionEntry {
  version: number;
  content: string;
  createdAt: Date;
  createdBy: string;
  notes?: string;
}

export interface DocumentGenerateRequest {
  templateId: string;
  businessProfileId: string;
  customMergeData?: Record<string, unknown>;
}

export interface DocumentUpdateRequest {
  status?: DocumentStatusType;
  reviewNotes?: string;
  content?: string;
}

// =============================================================================
// ADVISOR (PRD-FR-006: Advisor Oversight)
// =============================================================================

export interface AdvisorAssignment extends BaseEntity {
  advisorId: string;
  tenantId: string;
  businessProfileId?: string;
  cohortId?: string;
  status: AdvisorAssignmentStatusType;
  assignedAt: Date;
  unassignedAt?: Date;
  isActive: boolean;
  isPrimary: boolean;
  notes?: string;
  createdBy?: string;
}

export interface AdvisorDashboardSummary {
  assignedClients: number;
  activeClients: number;
  pendingReviews: number;
  overdueTasks: number;
  recentActivity: AuditLog[];
  clientsByPhase: Record<WorkflowPhaseType, number>;
  upcomingDeadlines: Task[];
}

export interface ClientProgressSummary {
  businessProfileId: string;
  businessName: string;
  enrollmentStatus: EnrollmentStatusType;
  currentPhase: WorkflowPhaseType;
  currentStep?: FormationStepType;
  overallProgress: number; // 0-100
  taskCompletion: {
    completed: number;
    total: number;
  };
  documentStatus: {
    generated: number;
    approved: number;
    pending: number;
  };
  lastActivityAt?: Date;
  nextDueDate?: Date;
  alerts: string[];
}

// =============================================================================
// AUDIT LOG
// =============================================================================

export interface AuditLog extends BaseEntity {
  tenantId?: string;
  userId: string;
  userEmail: string;
  userRole: UserRoleType;
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogCreateRequest {
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & { pagination: PaginationMeta };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// QUERY/FILTER TYPES
// =============================================================================

export interface BusinessProfileFilters extends PaginationParams {
  businessType?: BusinessTypeValue;
  formationState?: USStateType;
  isExistingBusiness?: boolean;
  search?: string;
}

export interface EnrollmentFilters extends PaginationParams {
  cohortId?: string;
  status?: EnrollmentStatusType;
  advisorId?: string;
}

export interface TaskFilters extends PaginationParams {
  status?: TaskStatusType;
  category?: TaskCategoryType;
  priority?: TaskPriorityType;
  assigneeId?: string;
  phase?: WorkflowPhaseType;
  isOverdue?: boolean;
}

export interface DocumentFilters extends PaginationParams {
  type?: DocumentTypeValue;
  status?: DocumentStatusType;
  businessProfileId?: string;
}

export interface AuditLogFilters extends PaginationParams {
  userId?: string;
  action?: AuditActionType;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
}

// =============================================================================
// IAM TYPES (Admin Portal)
// =============================================================================

// Enhanced User with IAM fields
export interface UserWithIam extends User {
  primaryRole: PrimaryRoleType; // Required for IAM users
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  iamRoles: string[]; // IamRole IDs
  groups: string[]; // Group IDs
  lockedAt?: Date;
  lockReason?: string;
  failedLoginAttempts: number;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
}

// IAM Role (custom roles with permissions)
export interface IamRole extends BaseEntity {
  tenantId?: string; // Null for global roles
  name: string;
  description?: string;
  isSystem: boolean; // System roles cannot be modified
  systemRole?: SystemRoleType; // Link to system role type
  permissions: IamPermissionType[];
  isActive: boolean;
}

export interface IamRoleCreateRequest {
  name: string;
  description?: string;
  permissions: IamPermissionType[];
}

export interface IamRoleUpdateRequest {
  name?: string;
  description?: string;
  permissions?: IamPermissionType[];
  isActive?: boolean;
}

// Group
export interface Group extends TenantScopedEntity {
  name: string;
  description?: string;
  members: string[]; // User IDs
  roles: string[]; // IamRole IDs
  isActive: boolean;
}

export interface GroupCreateRequest {
  name: string;
  description?: string;
  members?: string[];
  roles?: string[];
}

export interface GroupUpdateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface GroupMemberUpdateRequest {
  action: 'add' | 'remove';
  userIds: string[];
}

export interface GroupRoleUpdateRequest {
  action: 'add' | 'remove';
  roleIds: string[];
}

// Access Request
export interface AccessRequest extends TenantScopedEntity {
  requestorId: string;
  requestorEmail: string;
  requestedRoleIds: string[];
  requestedPermissions: IamPermissionType[];
  reason: string;
  status: AccessRequestStatusType;
  approverId?: string;
  approverEmail?: string;
  approverNotes?: string;
  decidedAt?: Date;
  expiresAt?: Date;
  effectiveUntil?: Date; // For time-limited access
}

export interface AccessRequestCreateRequest {
  requestedRoleIds?: string[];
  requestedPermissions?: IamPermissionType[];
  reason: string;
  effectiveUntil?: Date;
}

export interface AccessRequestDecisionRequest {
  decision: 'approve' | 'reject';
  notes?: string;
}

// Service Account
export interface ServiceAccount extends TenantScopedEntity {
  name: string;
  description?: string;
  status: ServiceAccountStatusType;
  createdBy: string;
  roles: string[]; // IamRole IDs
  lastUsedAt?: Date;
}

export interface ServiceAccountCreateRequest {
  name: string;
  description?: string;
  roles?: string[];
}

export interface ServiceAccountUpdateRequest {
  name?: string;
  description?: string;
  status?: ServiceAccountStatusType;
  roles?: string[];
}

// API Key
export interface ApiKey extends TenantScopedEntity {
  ownerType: 'user' | 'service_account';
  ownerId: string;
  name: string;
  keyPrefix: string; // First 8 chars for identification
  keyHash: string; // Hashed key (never store plaintext)
  scopes: IamPermissionType[];
  lastUsedAt?: Date;
  lastUsedIp?: string;
  expiresAt?: Date;
  createdBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}

export interface ApiKeyCreateRequest {
  name: string;
  ownerType?: 'user' | 'service_account';
  ownerId?: string; // Required if ownerType is service_account
  scopes: IamPermissionType[];
  expiresAt?: Date;
}

export interface ApiKeyCreateResponse {
  apiKey: Omit<ApiKey, 'keyHash'>;
  plainTextKey: string; // Only returned once on creation
}

// Access Review
export interface AccessReview extends TenantScopedEntity {
  name: string;
  description?: string;
  status: AccessReviewStatusType;
  dueAt: Date;
  createdBy: string;
  closedAt?: Date;
  closedBy?: string;
  itemCount: number;
  completedItemCount: number;
}

export interface AccessReviewCreateRequest {
  name: string;
  description?: string;
  dueAt: Date;
  userIds?: string[]; // Specific users to review, or all if empty
}

// Access Review Item
export interface AccessReviewItem extends TenantScopedEntity {
  reviewId: string;
  userId: string;
  userEmail: string;
  userName: string;
  currentRoles: Array<{ id: string; name: string }>;
  currentPermissions: IamPermissionType[];
  currentGroups: Array<{ id: string; name: string }>;
  decision: AccessReviewDecisionType;
  newRoles?: string[]; // If decision is 'change'
  reviewerId?: string;
  reviewerEmail?: string;
  reviewedAt?: Date;
  notes?: string;
}

export interface AccessReviewItemDecisionRequest {
  decision: AccessReviewDecisionType;
  newRoles?: string[];
  notes?: string;
}

// IAM Audit Log (extended)
export interface IamAuditLog extends BaseEntity {
  tenantId?: string;
  actorId: string;
  actorEmail: string;
  actorType: 'user' | 'service_account' | 'system';
  action: IamAuditActionType;
  targetType: string;
  targetId: string;
  targetName?: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface IamAuditLogFilters extends PaginationParams {
  actorId?: string;
  actorEmail?: string;
  action?: IamAuditActionType;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

// IAM Security Settings
export interface IamSecuritySettings {
  tenantId?: string; // Null for global settings
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  passwordExpiryDays: number;
  mfaRequired: boolean;
  mfaGracePeriodDays: number;
  apiKeyMaxAgedays: number;
  accessReviewFrequencyDays: number;
}

// IAM Dashboard Stats
export interface IamDashboardStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  mfaEnabledUsers: number;
  mfaCoverage: number; // Percentage
  totalRoles: number;
  totalGroups: number;
  pendingAccessRequests: number;
  openAccessReviews: number;
  recentIamChanges: IamAuditLog[];
  usersWithoutMfa: Array<{ id: string; email: string; name: string }>;
  expiringApiKeys: Array<{ id: string; name: string; expiresAt: Date }>;
}

// User filters for admin
export interface UserFilters extends PaginationParams {
  email?: string;
  name?: string;
  role?: UserRoleType;
  isActive?: boolean;
  mfaEnabled?: boolean;
  search?: string;
}

// =============================================================================
// ACCESS REVIEW CAMPAIGN TYPES (IAM Compliance)
// =============================================================================

/**
 * Access Review Decision
 * Decision made for each access item during review
 */
export interface AccessReviewItemDecision {
  decisionType: CampaignDecisionTypeValue;
  reasonCode?: DecisionReasonCodeType;
  comments?: string;
  effectiveDate?: Date;
  requestedChange?: AccessReviewRequestedChange;
  evidenceProvided?: boolean;
  evidenceLink?: string;
  decidedBy?: string;
  decidedAt?: Date;
}

/**
 * Requested Change for MODIFY decisions
 */
export interface AccessReviewRequestedChange {
  newRoleName?: string;
  newPermissions?: string[];
  newScope?: string;
  expirationDate?: Date;
  notes?: string;
}

/**
 * Access Review Item
 * Individual access/entitlement row being reviewed
 */
export interface AccessReviewCampaignItem {
  id?: string;
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
  decision?: AccessReviewItemDecision;
}

/**
 * Access Review Subject
 * The identity (user) being reviewed in a campaign
 */
export interface AccessReviewCampaignSubject {
  id?: string;
  // User identification
  subjectId: string; // userId reference
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
  endDate?: Date; // Required for contractors/vendors
  employmentType: EmploymentTypeValue;
  // Review status
  status: SubjectStatusType;
  // Access items to review
  items: AccessReviewCampaignItem[];
  // Timestamps
  reviewedAt?: Date;
  reviewedBy?: string;
}

/**
 * Campaign Approvals
 * Approval/attestation tracking for the campaign
 */
export interface AccessReviewCampaignApprovals {
  // Primary reviewer
  reviewerName: string;
  reviewerEmail: string;
  reviewerAttestation?: boolean;
  reviewerAttestedAt?: Date;
  // Second-level approval (for privileged access)
  secondLevelRequired?: boolean;
  secondApproverName?: string;
  secondApproverEmail?: string;
  secondDecision?: SecondLevelDecisionType;
  secondDecisionNotes?: string;
  secondDecidedAt?: Date;
}

/**
 * Campaign Workflow
 * Workflow tracking and remediation status
 */
export interface AccessReviewCampaignWorkflow {
  dueDate: Date;
  escalationLevel?: number;
  notificationsSentAt?: Date[];
  // Remediation tracking
  remediationTicketCreated?: boolean;
  remediationTicketId?: string;
  remediationStatus?: RemediationStatusType;
  remediationCompletedAt?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

/**
 * Group Certification
 * Tracks certification status for a group in a campaign
 */
export interface GroupCertification {
  groupId: string;
  groupName: string;
  membershipCertified?: boolean;
  membershipCertifiedAt?: Date | string;
  membershipCertifiedBy?: string;
  permissionsCertified?: boolean;
  permissionsCertifiedAt?: Date | string;
  permissionsCertifiedBy?: string;
}

/**
 * Access Review Campaign
 * Main campaign document containing subjects and items
 */
export interface AccessReviewCampaign extends TenantScopedEntity {
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
  createdBy: string;
  createdByEmail?: string;
  // Reviewer assignment
  reviewerType: ReviewerTypeValue;
  assignedReviewerId?: string;
  assignedReviewerEmail?: string;
  // Embedded documents
  subjects: AccessReviewCampaignSubject[];
  approvals?: AccessReviewCampaignApprovals;
  workflow?: AccessReviewCampaignWorkflow;
  groupCertifications?: GroupCertification[];
  // Stats (computed)
  totalSubjects?: number;
  completedSubjects?: number;
  totalItems?: number;
  completedItems?: number;
  // Timestamps
  submittedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
}

/**
 * Create Campaign Request
 */
export interface AccessReviewCampaignCreateRequest {
  name: string;
  description?: string;
  systemName: string;
  environment: EnvironmentTypeValue;
  businessUnit?: string;
  reviewType: ReviewTypeValue;
  triggerReason?: string;
  periodStart: Date;
  periodEnd: Date;
  reviewerType: ReviewerTypeValue;
  assignedReviewerId?: string;
  assignedReviewerEmail?: string;
  subjects?: AccessReviewCampaignSubject[];
  workflow?: {
    dueDate: Date;
  };
}

/**
 * Update Campaign Request
 */
export interface AccessReviewCampaignUpdateRequest {
  name?: string;
  description?: string;
  systemName?: string;
  environment?: EnvironmentTypeValue;
  businessUnit?: string;
  reviewType?: ReviewTypeValue;
  triggerReason?: string;
  periodStart?: Date;
  periodEnd?: Date;
  reviewerType?: ReviewerTypeValue;
  assignedReviewerId?: string;
  assignedReviewerEmail?: string;
  subjects?: AccessReviewCampaignSubject[];
  approvals?: AccessReviewCampaignApprovals;
  workflow?: Partial<AccessReviewCampaignWorkflow>;
  groupCertifications?: GroupCertification[];
}

/**
 * Submit Campaign Request
 */
export interface AccessReviewCampaignSubmitRequest {
  reviewerAttestation: boolean;
  reviewerName: string;
  reviewerEmail: string;
}

/**
 * Approve Campaign Request (Second-level)
 */
export interface AccessReviewCampaignApproveRequest {
  decision: SecondLevelDecisionType;
  notes?: string;
  approverName: string;
  approverEmail: string;
}

/**
 * Remediate Campaign Request
 */
export interface AccessReviewCampaignRemediateRequest {
  remediationTicketId: string;
  remediationStatus: RemediationStatusType;
  notes?: string;
}

/**
 * Complete Campaign Request
 */
export interface AccessReviewCampaignCompleteRequest {
  verifiedBy: string;
  notes?: string;
}

/**
 * Campaign Filters for List Endpoint
 */
export interface AccessReviewCampaignFilters extends PaginationParams {
  status?: AccessReviewCampaignStatusType;
  systemName?: string;
  environment?: EnvironmentTypeValue;
  reviewType?: ReviewTypeValue;
  startDate?: Date;
  endDate?: Date;
  assignedReviewerId?: string;
  search?: string;
}

// =============================================================================
// GROUP REVIEW TYPES
// =============================================================================

/**
 * Group Review Subject
 * A group being reviewed in a campaign (parallel to user subjects)
 */
export interface AccessReviewGroupSubject {
  id?: string;
  // Group identification
  groupId: string;
  groupName: string;
  description?: string;
  // Group metadata
  memberCount: number;
  roleCount: number;
  createdAt?: Date;
  lastModifiedAt?: Date;
  // Owner info
  ownerName?: string;
  ownerEmail?: string;
  // Review status
  status: GroupReviewStatusType;
  // Membership certification
  membershipCertified?: boolean;
  membershipCertifiedBy?: string;
  membershipCertifiedAt?: Date;
  membershipNotes?: string;
  // Permissions certification
  permissionsCertified?: boolean;
  permissionsCertifiedBy?: string;
  permissionsCertifiedAt?: Date;
  permissionsNotes?: string;
  // Members to review (optional drill-down)
  members?: AccessReviewGroupMember[];
  // Roles/permissions assigned to group
  groupRoles?: AccessReviewCampaignItem[];
  // Decision
  decision?: {
    action: CampaignDecisionTypeValue;
    comments?: string;
    changes?: string[];
  };
}

/**
 * Group Member (for drill-down review)
 */
export interface AccessReviewGroupMember {
  userId: string;
  fullName: string;
  email: string;
  memberSince?: Date;
  addedBy?: string;
  // Quick certification
  certified?: boolean;
  certifiedAt?: Date;
  notes?: string;
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Bulk User Selection Request
 * For adding multiple users to a campaign at once
 */
export interface BulkUserSelectionRequest {
  // Select by user IDs
  userIds?: string[];
  // Select by group membership
  groupIds?: string[];
  // Select by role assignment
  roleIds?: string[];
  // Select by filters
  filters?: {
    department?: string;
    employmentType?: EmploymentTypeValue;
    hasPrivilegedAccess?: boolean;
    inactiveForDays?: number;
  };
  // Auto-populate their current access
  autoPopulateAccess?: boolean;
}

/**
 * Bulk Decision Request
 * For applying decisions to multiple items at once
 */
export interface BulkDecisionRequest {
  // Target items
  targetType: 'all' | 'filtered' | 'selected';
  itemIds?: string[]; // For 'selected' type
  // Filter criteria for 'filtered' type
  filter?: {
    privilegeLevel?: PrivilegeLevelType;
    entitlementType?: EntitlementTypeValue;
    hasBeenUsedRecently?: boolean;
    dataClassification?: DataClassificationType;
  };
  // Decision to apply
  decision: {
    decisionType: CampaignDecisionTypeValue;
    reasonCode?: DecisionReasonCodeType;
    comments?: string;
  };
  // Skip items that require manual review
  skipHighRisk?: boolean;
}

/**
 * Bulk Operation Result
 */
export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  skipped: number;
  failed: number;
  skippedItems?: Array<{
    itemId: string;
    reason: string;
  }>;
  failedItems?: Array<{
    itemId: string;
    error: string;
  }>;
}

/**
 * Smart Review Suggestions
 * AI/rule-based suggestions for faster review
 */
export interface ReviewSuggestion {
  itemId: string;
  suggestedDecision: CampaignDecisionTypeValue;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  requiresManualReview: boolean;
  riskIndicators?: string[];
}

// =============================================================================
// BUSINESS APP TYPES
// =============================================================================

/**
 * Starter Process
 */
export interface StarterProcess {
  name: string;
  description: string;
  category: ProcessCategoryType;
  priority: number;
}

/**
 * Default KPI
 */
export interface DefaultKPI {
  name: string;
  description: string;
  formula?: string;
  unit: string;
  targetDirection: 'increase' | 'decrease' | 'maintain';
  category: string;
  frequency: KPIFrequencyType;
}

/**
 * Starter Document
 */
export interface StarterDoc {
  name: string;
  description: string;
  templateKey?: string;
  category: string;
  required: boolean;
  legalReview: boolean;
}

/**
 * Starter Workflow
 */
export interface StarterWorkflow {
  templateKey: string;
  name: string;
  description: string;
  triggerEvent?: string;
}

/**
 * Risk Checklist Item
 */
export interface RiskChecklistItem {
  category: string;
  item: string;
  severity: RiskLevelType;
  mitigation?: string;
}

/**
 * Business Archetype
 */
export interface BusinessArchetype extends BaseEntity {
  key: string;
  name: string;
  description: string;
  icon?: string;
  tags: string[];
  recommendedEntityTypes: BusinessTypeValue[];
  industryExamples: string[];
  commonProcesses: StarterProcess[];
  defaultKPIs: DefaultKPI[];
  starterDocs: StarterDoc[];
  starterWorkflows: StarterWorkflow[];
  riskChecklist: RiskChecklistItem[];
  commonLicenses?: string[];
  commonPermits?: string[];
  insuranceTypes?: string[];
  isActive: boolean;
  displayOrder: number;
}

/**
 * Readiness Flags
 */
export interface ReadinessFlags {
  profileComplete: boolean;
  entitySelected: boolean;
  stateSelected: boolean;
  archetypeSelected: boolean;
  addressVerified: boolean;
  registeredAgentSet: boolean;
  ownersAdded: boolean;
  sosReadyToFile: boolean;
  einReadyToApply: boolean;
  documentsGenerated: boolean;
  advisorAssigned: boolean;
}

/**
 * Risk Profile
 */
export interface RiskProfile {
  level: RiskLevelType;
  factors: string[];
  lastAssessedAt?: Date;
}

/**
 * Enhanced Business Profile (extends existing)
 */
export interface BusinessProfileEnhanced extends BusinessProfile {
  archetypeKey?: string;
  naicsCode?: string;
  sicCode?: string;
  formationStatus: FormationStatusType;
  sosConfirmationArtifactId?: string;
  einStatus: EINStatusType;
  einConfirmationArtifactId?: string;
  readinessFlags: ReadinessFlags;
  riskProfile?: RiskProfile;
  setupCompletedAt?: Date;
}

/**
 * Artifact
 */
export interface Artifact extends TenantScopedEntity {
  type: ArtifactTypeValue;
  name: string;
  description?: string;
  storageType: 'file' | 'url' | 'text' | 'json';
  storageKey?: string;
  storageUrl?: string;
  textContent?: string;
  jsonContent?: Record<string, unknown>;
  mimeType?: string;
  fileSize?: number;
  checksum?: string;
  linkedEntityType: string;
  linkedEntityId: string;
  linkedStepKey?: string;
  tags: string[];
  category?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  retentionDays?: number;
  expiresAt?: Date;
  isConfidential: boolean;
  createdBy: string;
  updatedBy?: string;
}

export interface ArtifactCreateRequest {
  type: ArtifactTypeValue;
  name: string;
  description?: string;
  storageType: 'file' | 'url' | 'text' | 'json';
  storageKey?: string;
  storageUrl?: string;
  textContent?: string;
  jsonContent?: Record<string, unknown>;
  linkedEntityType: string;
  linkedEntityId: string;
  linkedStepKey?: string;
  tags?: string[];
  category?: string;
  isConfidential?: boolean;
}

/**
 * Step Requirement
 */
export interface StepRequirement {
  type: 'artifact' | 'approval' | 'task_completion' | 'field_value' | 'external_verification';
  description: string;
  artifactType?: string;
  taskCategory?: string;
  fieldPath?: string;
  fieldValue?: unknown;
  isBlocking: boolean;
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  key: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  isSkippable: boolean;
  requiresApproval: boolean;
  approverRole?: string;
  requirements: StepRequirement[];
  expectedArtifacts: string[];
  autoTasks: {
    title: string;
    category: string;
    priority: string;
    isRequired: boolean;
  }[];
  formSchema?: Record<string, unknown>;
  guidance?: string;
  helpUrl?: string;
  rulesHooks?: string[];
  estimatedMinutes?: number;
}

/**
 * Workflow Phase Definition
 */
export interface WorkflowPhaseDefinition {
  key: string;
  name: string;
  description: string;
  order: number;
  icon?: string;
  steps: WorkflowStep[];
  gateRequirements: StepRequirement[];
  requiresPhaseApproval: boolean;
  phaseApproverRole?: string;
}

/**
 * Workflow Template
 */
export interface WorkflowTemplate extends BaseEntity {
  key: string;
  version: number;
  name: string;
  description: string;
  category: WorkflowTemplateCategoryType;
  tags: string[];
  phases: WorkflowPhaseDefinition[];
  requiredArtifacts: string[];
  applicableArchetypes: string[];
  applicableStates?: string[];
  applicableEntityTypes?: string[];
  rulesHooks?: string[];
  isLatestVersion: boolean;
  previousVersionId?: string;
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: string;
}

/**
 * Step State (for WorkflowInstance)
 */
export interface StepState {
  status: StepStatusType;
  data: Record<string, unknown>;
  submittedAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  completedAt?: Date;
  artifacts: string[];
  tasks: string[];
}

/**
 * Enhanced Workflow Instance
 */
export interface WorkflowInstanceEnhanced extends WorkflowInstance {
  templateKey: string;
  templateVersion: number;
  stepStates: Record<string, StepState>;
  computedChecklist: {
    total: number;
    completed: number;
    blocked: number;
  };
}

/**
 * Rule Condition
 */
export interface RuleCondition {
  field: string;
  operator: string;
  value?: unknown;
  caseSensitive?: boolean;
}

/**
 * Rule Condition Group
 */
export interface RuleConditionGroup {
  logic: 'and' | 'or';
  conditions: (RuleCondition | RuleConditionGroup)[];
}

/**
 * Rule Action
 */
export interface RuleAction {
  type: string;
  target?: string;
  value?: unknown;
  reason: string;
  priority?: number;
}

/**
 * Rule
 */
export interface Rule extends BaseEntity {
  key: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  conditions: RuleConditionGroup;
  actions: RuleAction[];
  priority: number;
  scope: 'global' | 'archetype' | 'state' | 'entity_type' | 'workflow';
  scopeValue?: string;
  applicableWorkflows?: string[];
  applicablePhases?: string[];
  applicableSteps?: string[];
  isActive: boolean;
  version: number;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

/**
 * Setup Status Response
 */
export interface SetupStatus {
  hasStarted: boolean;
  isComplete: boolean;
  currentStep: string;
  archetypeKey?: string;
  entityType?: BusinessTypeValue;
  state?: USStateType;
  readinessFlags: ReadinessFlags;
  businessProfileId?: string;
}

/**
 * Setup Start Request
 */
export interface SetupStartRequest {
  businessName: string;
  email: string;
}

/**
 * Archetype Selection Request
 */
export interface ArchetypeSelectionRequest {
  archetypeKey: string;
}

/**
 * Entity Type Selection Request
 */
export interface EntityTypeSelectionRequest {
  entityType: BusinessTypeValue;
}

/**
 * State Selection Request
 */
export interface StateSelectionRequest {
  state: USStateType;
}

/**
 * Setup Complete Request
 */
export interface SetupCompleteRequest {
  businessName: string;
  dbaName?: string;
  email: string;
  phone?: string;
}

// =============================================================================
// ADDITIONAL BUSINESS APP TYPES (for future modules)
// =============================================================================

/**
 * Rule Evaluation Result
 */
export interface RuleEvaluationResult {
  ruleKey: string;
  ruleName: string;
  matched: boolean;
  actions: RuleAction[];
  evaluatedAt: Date;
  context?: Record<string, unknown>;
}

/**
 * Approval Request
 */
export interface ApprovalRequest extends TenantScopedEntity {
  type: 'step' | 'phase' | 'document' | 'workflow';
  targetType: string;
  targetId: string;
  targetName: string;
  requestorId: string;
  requestorName: string;
  status: ApprovalStatusType;
  assignedTo?: string;
  assignedToRole?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt?: Date;
  decidedAt?: Date;
  decidedBy?: string;
  decision?: 'approved' | 'rejected';
  notes?: string;
  context?: Record<string, unknown>;
}

/**
 * Today View Item
 */
export interface TodayViewItem {
  type: 'task' | 'approval' | 'blocker' | 'milestone' | 'alert';
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt?: Date;
  link: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dashboard KPI
 */
export interface DashboardKPI {
  key: string;
  name: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  target?: number;
  status: 'good' | 'warning' | 'critical' | 'neutral';
}

/**
 * Business Setup Request
 */
export interface BusinessSetupRequest {
  businessName: string;
  businessType: BusinessTypeValue;
  formationState: USStateType;
  archetypeKey: string;
  email: string;
  phone?: string;
  isExistingBusiness?: boolean;
}

/**
 * Start Workflow Request
 */
export interface StartWorkflowRequest {
  templateKey: string;
  name?: string;
}

/**
 * Update Step Request
 */
export interface UpdateStepRequest {
  data: Record<string, unknown>;
  artifacts?: string[];
  notes?: string;
}

/**
 * Submit Step Request
 */
export interface SubmitStepRequest {
  notes?: string;
}

/**
 * Approve Step Request
 */
export interface ApproveStepRequest {
  approved: boolean;
  notes?: string;
}
