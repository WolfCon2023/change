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
