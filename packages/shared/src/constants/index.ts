/**
 * CHANGE Platform Constants
 * These constants are shared between frontend and backend
 * Aligned to SRS/PRD requirements
 */

// =============================================================================
// ROLES (TRS-ARCH-002: Role-based access control)
// =============================================================================

export const UserRole = {
  // Client roles
  CLIENT_OWNER: 'client_owner',
  CLIENT_ADMIN: 'client_admin',
  CLIENT_CONTRIBUTOR: 'client_contributor',
  // Platform roles
  ADVISOR: 'advisor',
  PROGRAM_ADMIN: 'program_admin',
  SYSTEM_ADMIN: 'system_admin',
  // Phase 2+ placeholder
  EXTERNAL_PARTNER: 'external_partner',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const ClientRoles: UserRoleType[] = [
  UserRole.CLIENT_OWNER,
  UserRole.CLIENT_ADMIN,
  UserRole.CLIENT_CONTRIBUTOR,
];

export const PlatformRoles: UserRoleType[] = [
  UserRole.ADVISOR,
  UserRole.PROGRAM_ADMIN,
  UserRole.SYSTEM_ADMIN,
];

// Role hierarchy for permission checks
export const RoleHierarchy: Record<UserRoleType, number> = {
  [UserRole.SYSTEM_ADMIN]: 100,
  [UserRole.PROGRAM_ADMIN]: 90,
  [UserRole.ADVISOR]: 80,
  [UserRole.CLIENT_OWNER]: 50,
  [UserRole.CLIENT_ADMIN]: 40,
  [UserRole.CLIENT_CONTRIBUTOR]: 30,
  [UserRole.EXTERNAL_PARTNER]: 20,
};

// =============================================================================
// ENROLLMENT STATUS (PRD-FR-002: Program Enrollment)
// =============================================================================

export const EnrollmentStatus = {
  APPLIED: 'applied',
  PENDING_REVIEW: 'pending_review',
  ENROLLED: 'enrolled',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  WITHDRAWN: 'withdrawn',
  REJECTED: 'rejected',
} as const;

export type EnrollmentStatusType = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

// Valid enrollment status transitions
export const EnrollmentStatusTransitions: Record<EnrollmentStatusType, EnrollmentStatusType[]> = {
  [EnrollmentStatus.APPLIED]: [EnrollmentStatus.PENDING_REVIEW, EnrollmentStatus.WITHDRAWN],
  [EnrollmentStatus.PENDING_REVIEW]: [
    EnrollmentStatus.ENROLLED,
    EnrollmentStatus.REJECTED,
    EnrollmentStatus.WITHDRAWN,
  ],
  [EnrollmentStatus.ENROLLED]: [EnrollmentStatus.ACTIVE, EnrollmentStatus.WITHDRAWN],
  [EnrollmentStatus.ACTIVE]: [
    EnrollmentStatus.ON_HOLD,
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.WITHDRAWN,
  ],
  [EnrollmentStatus.ON_HOLD]: [EnrollmentStatus.ACTIVE, EnrollmentStatus.WITHDRAWN],
  [EnrollmentStatus.COMPLETED]: [],
  [EnrollmentStatus.WITHDRAWN]: [],
  [EnrollmentStatus.REJECTED]: [],
};

// =============================================================================
// WORKFLOW PHASES (TRS-ARCH-003: Gated workflows)
// =============================================================================

export const WorkflowPhase = {
  // Phase 1: Beginning Step
  INTAKE: 'intake',
  ENROLLMENT: 'enrollment',
  FORMATION: 'formation',
  DOCUMENTS: 'documents',
  REVIEW: 'review',
  COMPLETION: 'completion',
  // Phase 2+ placeholders
  OPERATIONS: 'operations',
  GROWTH: 'growth',
} as const;

export type WorkflowPhaseType = (typeof WorkflowPhase)[keyof typeof WorkflowPhase];

// Phase 1 phases only
export const Phase1Phases: WorkflowPhaseType[] = [
  WorkflowPhase.INTAKE,
  WorkflowPhase.ENROLLMENT,
  WorkflowPhase.FORMATION,
  WorkflowPhase.DOCUMENTS,
  WorkflowPhase.REVIEW,
  WorkflowPhase.COMPLETION,
];

// Phase order for progression
export const PhaseOrder: WorkflowPhaseType[] = [
  WorkflowPhase.INTAKE,
  WorkflowPhase.ENROLLMENT,
  WorkflowPhase.FORMATION,
  WorkflowPhase.DOCUMENTS,
  WorkflowPhase.REVIEW,
  WorkflowPhase.COMPLETION,
  WorkflowPhase.OPERATIONS,
  WorkflowPhase.GROWTH,
];

// =============================================================================
// WORKFLOW STATUS
// =============================================================================

export const WorkflowStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const;

export type WorkflowStatusType = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

// =============================================================================
// FORMATION STEPS (PRD-FR-003: Business Formation)
// =============================================================================

export const FormationStep = {
  BUSINESS_TYPE: 'business_type',
  BUSINESS_NAME: 'business_name',
  REGISTERED_AGENT: 'registered_agent',
  BUSINESS_ADDRESS: 'business_address',
  MEMBERS_OFFICERS: 'members_officers',
  SOS_FILING: 'sos_filing',
  EIN_APPLICATION: 'ein_application',
  OPERATING_AGREEMENT: 'operating_agreement',
  REVIEW_SUBMIT: 'review_submit',
} as const;

export type FormationStepType = (typeof FormationStep)[keyof typeof FormationStep];

export const FormationStepOrder: FormationStepType[] = [
  FormationStep.BUSINESS_TYPE,
  FormationStep.BUSINESS_NAME,
  FormationStep.REGISTERED_AGENT,
  FormationStep.BUSINESS_ADDRESS,
  FormationStep.MEMBERS_OFFICERS,
  FormationStep.SOS_FILING,
  FormationStep.EIN_APPLICATION,
  FormationStep.OPERATING_AGREEMENT,
  FormationStep.REVIEW_SUBMIT,
];

// =============================================================================
// TASK STATUS (PRD-FR-005: Task Management)
// =============================================================================

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  SKIPPED: 'skipped',
  OVERDUE: 'overdue',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskCategory = {
  SOS_FILING: 'sos_filing',
  EIN_APPLICATION: 'ein_application',
  DOCUMENT_PREPARATION: 'document_preparation',
  COMPLIANCE: 'compliance',
  ADVISOR_REVIEW: 'advisor_review',
  GENERAL: 'general',
} as const;

export type TaskCategoryType = (typeof TaskCategory)[keyof typeof TaskCategory];

// =============================================================================
// DOCUMENT TYPES (PRD-FR-004: Document Generation)
// =============================================================================

export const DocumentType = {
  // Formation documents
  ARTICLES_OF_ORGANIZATION: 'articles_of_organization',
  ARTICLES_OF_INCORPORATION: 'articles_of_incorporation',
  OPERATING_AGREEMENT: 'operating_agreement',
  BYLAWS: 'bylaws',
  // Regulatory documents
  EIN_CONFIRMATION: 'ein_confirmation',
  SOS_FILING_CONFIRMATION: 'sos_filing_confirmation',
  // Business documents
  BUSINESS_PLAN: 'business_plan',
  MEMBER_CERTIFICATE: 'member_certificate',
  RESOLUTION: 'resolution',
  // Other
  CUSTOM: 'custom',
} as const;

export type DocumentTypeValue = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FINAL: 'final',
  ARCHIVED: 'archived',
} as const;

export type DocumentStatusType = (typeof DocumentStatus)[keyof typeof DocumentStatus];

// =============================================================================
// BUSINESS TYPES
// =============================================================================

export const BusinessType = {
  LLC: 'llc',
  CORPORATION: 'corporation',
  SOLE_PROPRIETORSHIP: 'sole_proprietorship',
  PARTNERSHIP: 'partnership',
  NONPROFIT: 'nonprofit',
  COOPERATIVE: 'cooperative',
} as const;

export type BusinessTypeValue = (typeof BusinessType)[keyof typeof BusinessType];

export const BusinessTypeLabels: Record<BusinessTypeValue, string> = {
  [BusinessType.LLC]: 'Limited Liability Company (LLC)',
  [BusinessType.CORPORATION]: 'Corporation',
  [BusinessType.SOLE_PROPRIETORSHIP]: 'Sole Proprietorship',
  [BusinessType.PARTNERSHIP]: 'Partnership',
  [BusinessType.NONPROFIT]: 'Nonprofit Organization',
  [BusinessType.COOPERATIVE]: 'Cooperative',
};

// =============================================================================
// US STATES (for SOS filing)
// =============================================================================

export const USState = {
  AL: 'AL',
  AK: 'AK',
  AZ: 'AZ',
  AR: 'AR',
  CA: 'CA',
  CO: 'CO',
  CT: 'CT',
  DE: 'DE',
  FL: 'FL',
  GA: 'GA',
  HI: 'HI',
  ID: 'ID',
  IL: 'IL',
  IN: 'IN',
  IA: 'IA',
  KS: 'KS',
  KY: 'KY',
  LA: 'LA',
  ME: 'ME',
  MD: 'MD',
  MA: 'MA',
  MI: 'MI',
  MN: 'MN',
  MS: 'MS',
  MO: 'MO',
  MT: 'MT',
  NE: 'NE',
  NV: 'NV',
  NH: 'NH',
  NJ: 'NJ',
  NM: 'NM',
  NY: 'NY',
  NC: 'NC',
  ND: 'ND',
  OH: 'OH',
  OK: 'OK',
  OR: 'OR',
  PA: 'PA',
  RI: 'RI',
  SC: 'SC',
  SD: 'SD',
  TN: 'TN',
  TX: 'TX',
  UT: 'UT',
  VT: 'VT',
  VA: 'VA',
  WA: 'WA',
  WV: 'WV',
  WI: 'WI',
  WY: 'WY',
  DC: 'DC',
} as const;

export type USStateType = (typeof USState)[keyof typeof USState];

export const USStateNames: Record<USStateType, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

// =============================================================================
// AUDIT LOG ACTIONS
// =============================================================================

export const AuditAction = {
  // Auth
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  PASSWORD_RESET: 'password_reset',
  // Tenant
  TENANT_CREATED: 'tenant_created',
  TENANT_UPDATED: 'tenant_updated',
  // Business Profile
  BUSINESS_PROFILE_CREATED: 'business_profile_created',
  BUSINESS_PROFILE_UPDATED: 'business_profile_updated',
  // Enrollment
  ENROLLMENT_CREATED: 'enrollment_created',
  ENROLLMENT_STATUS_CHANGED: 'enrollment_status_changed',
  // Workflow
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_PHASE_CHANGED: 'workflow_phase_changed',
  WORKFLOW_STEP_COMPLETED: 'workflow_step_completed',
  WORKFLOW_COMPLETED: 'workflow_completed',
  // Tasks
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  // Documents
  DOCUMENT_CREATED: 'document_created',
  DOCUMENT_GENERATED: 'document_generated',
  DOCUMENT_APPROVED: 'document_approved',
  DOCUMENT_REJECTED: 'document_rejected',
  // Advisor
  ADVISOR_ASSIGNED: 'advisor_assigned',
  ADVISOR_REVIEW_SUBMITTED: 'advisor_review_submitted',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

// =============================================================================
// COHORT STATUS
// =============================================================================

export const CohortStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type CohortStatusType = (typeof CohortStatus)[keyof typeof CohortStatus];

// =============================================================================
// API RESPONSE CODES
// =============================================================================

export const ApiErrorCode = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  // Tenant errors
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  // Workflow errors
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  PREREQUISITES_NOT_MET: 'PREREQUISITES_NOT_MET',
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

// =============================================================================
// PAGINATION DEFAULTS
// =============================================================================

export const PaginationDefaults = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// =============================================================================
// IAM PERMISSIONS (Admin Portal)
// =============================================================================

export const IamPermission = {
  // User management
  IAM_USER_READ: 'iam.user.read',
  IAM_USER_WRITE: 'iam.user.write',
  IAM_USER_DELETE: 'iam.user.delete',
  IAM_USER_INVITE: 'iam.user.invite',
  IAM_USER_RESET_PASSWORD: 'iam.user.reset_password',

  // Role management
  IAM_ROLE_READ: 'iam.role.read',
  IAM_ROLE_WRITE: 'iam.role.write',
  IAM_ROLE_DELETE: 'iam.role.delete',
  IAM_ROLE_ASSIGN: 'iam.role.assign',

  // Group management
  IAM_GROUP_READ: 'iam.group.read',
  IAM_GROUP_WRITE: 'iam.group.write',
  IAM_GROUP_DELETE: 'iam.group.delete',
  IAM_GROUP_MANAGE_MEMBERS: 'iam.group.manage_members',

  // Access requests
  IAM_ACCESS_REQUEST_READ: 'iam.access_request.read',
  IAM_ACCESS_REQUEST_APPROVE: 'iam.access_request.approve',
  IAM_ACCESS_REQUEST_CREATE: 'iam.access_request.create',

  // API keys and service accounts
  IAM_API_KEY_READ: 'iam.api_key.read',
  IAM_API_KEY_WRITE: 'iam.api_key.write',
  IAM_API_KEY_REVOKE: 'iam.api_key.revoke',
  IAM_SERVICE_ACCOUNT_READ: 'iam.service_account.read',
  IAM_SERVICE_ACCOUNT_WRITE: 'iam.service_account.write',

  // Audit and compliance
  IAM_AUDIT_READ: 'iam.audit.read',
  IAM_AUDIT_EXPORT: 'iam.audit.export',

  // Access reviews
  IAM_ACCESS_REVIEW_READ: 'iam.access_review.read',
  IAM_ACCESS_REVIEW_WRITE: 'iam.access_review.write',
  IAM_ACCESS_REVIEW_DECIDE: 'iam.access_review.decide',

  // Policy and settings
  IAM_POLICY_READ: 'iam.policy.read',
  IAM_POLICY_WRITE: 'iam.policy.write',
  IAM_SETTINGS_READ: 'iam.settings.read',
  IAM_SETTINGS_WRITE: 'iam.settings.write',

  // Tenant management (cross-tenant for global admins)
  IAM_TENANT_READ: 'iam.tenant.read',
  IAM_TENANT_WRITE: 'iam.tenant.write',
  IAM_CROSS_TENANT: 'iam.cross_tenant',
} as const;

export type IamPermissionType = (typeof IamPermission)[keyof typeof IamPermission];

// Permission categories for UI grouping
export const IamPermissionCategory = {
  USER_MANAGEMENT: 'User Management',
  ROLE_MANAGEMENT: 'Role Management',
  GROUP_MANAGEMENT: 'Group Management',
  ACCESS_REQUESTS: 'Access Requests',
  API_KEYS: 'API Keys and Service Accounts',
  AUDIT: 'Audit and Compliance',
  ACCESS_REVIEWS: 'Access Reviews',
  POLICY: 'Policy and Settings',
  TENANT: 'Tenant Management',
} as const;

export type IamPermissionCategoryType = (typeof IamPermissionCategory)[keyof typeof IamPermissionCategory];

// Map permissions to categories
export const IamPermissionCatalog: Array<{
  key: IamPermissionType;
  description: string;
  category: IamPermissionCategoryType;
}> = [
  // User Management
  { key: IamPermission.IAM_USER_READ, description: 'View users and their details', category: IamPermissionCategory.USER_MANAGEMENT },
  { key: IamPermission.IAM_USER_WRITE, description: 'Create and update users', category: IamPermissionCategory.USER_MANAGEMENT },
  { key: IamPermission.IAM_USER_DELETE, description: 'Deactivate or delete users', category: IamPermissionCategory.USER_MANAGEMENT },
  { key: IamPermission.IAM_USER_INVITE, description: 'Invite new users', category: IamPermissionCategory.USER_MANAGEMENT },
  { key: IamPermission.IAM_USER_RESET_PASSWORD, description: 'Reset user passwords', category: IamPermissionCategory.USER_MANAGEMENT },

  // Role Management
  { key: IamPermission.IAM_ROLE_READ, description: 'View roles and permissions', category: IamPermissionCategory.ROLE_MANAGEMENT },
  { key: IamPermission.IAM_ROLE_WRITE, description: 'Create and update roles', category: IamPermissionCategory.ROLE_MANAGEMENT },
  { key: IamPermission.IAM_ROLE_DELETE, description: 'Delete custom roles', category: IamPermissionCategory.ROLE_MANAGEMENT },
  { key: IamPermission.IAM_ROLE_ASSIGN, description: 'Assign roles to users', category: IamPermissionCategory.ROLE_MANAGEMENT },

  // Group Management
  { key: IamPermission.IAM_GROUP_READ, description: 'View groups and members', category: IamPermissionCategory.GROUP_MANAGEMENT },
  { key: IamPermission.IAM_GROUP_WRITE, description: 'Create and update groups', category: IamPermissionCategory.GROUP_MANAGEMENT },
  { key: IamPermission.IAM_GROUP_DELETE, description: 'Delete groups', category: IamPermissionCategory.GROUP_MANAGEMENT },
  { key: IamPermission.IAM_GROUP_MANAGE_MEMBERS, description: 'Add or remove group members', category: IamPermissionCategory.GROUP_MANAGEMENT },

  // Access Requests
  { key: IamPermission.IAM_ACCESS_REQUEST_READ, description: 'View access requests', category: IamPermissionCategory.ACCESS_REQUESTS },
  { key: IamPermission.IAM_ACCESS_REQUEST_APPROVE, description: 'Approve or reject access requests', category: IamPermissionCategory.ACCESS_REQUESTS },
  { key: IamPermission.IAM_ACCESS_REQUEST_CREATE, description: 'Submit access requests', category: IamPermissionCategory.ACCESS_REQUESTS },

  // API Keys
  { key: IamPermission.IAM_API_KEY_READ, description: 'View API keys', category: IamPermissionCategory.API_KEYS },
  { key: IamPermission.IAM_API_KEY_WRITE, description: 'Create API keys', category: IamPermissionCategory.API_KEYS },
  { key: IamPermission.IAM_API_KEY_REVOKE, description: 'Revoke API keys', category: IamPermissionCategory.API_KEYS },
  { key: IamPermission.IAM_SERVICE_ACCOUNT_READ, description: 'View service accounts', category: IamPermissionCategory.API_KEYS },
  { key: IamPermission.IAM_SERVICE_ACCOUNT_WRITE, description: 'Create and update service accounts', category: IamPermissionCategory.API_KEYS },

  // Audit
  { key: IamPermission.IAM_AUDIT_READ, description: 'View audit logs', category: IamPermissionCategory.AUDIT },
  { key: IamPermission.IAM_AUDIT_EXPORT, description: 'Export audit logs', category: IamPermissionCategory.AUDIT },

  // Access Reviews
  { key: IamPermission.IAM_ACCESS_REVIEW_READ, description: 'View access reviews', category: IamPermissionCategory.ACCESS_REVIEWS },
  { key: IamPermission.IAM_ACCESS_REVIEW_WRITE, description: 'Create access reviews', category: IamPermissionCategory.ACCESS_REVIEWS },
  { key: IamPermission.IAM_ACCESS_REVIEW_DECIDE, description: 'Make access review decisions', category: IamPermissionCategory.ACCESS_REVIEWS },

  // Policy
  { key: IamPermission.IAM_POLICY_READ, description: 'View security policies', category: IamPermissionCategory.POLICY },
  { key: IamPermission.IAM_POLICY_WRITE, description: 'Update security policies', category: IamPermissionCategory.POLICY },
  { key: IamPermission.IAM_SETTINGS_READ, description: 'View IAM settings', category: IamPermissionCategory.POLICY },
  { key: IamPermission.IAM_SETTINGS_WRITE, description: 'Update IAM settings', category: IamPermissionCategory.POLICY },

  // Tenant
  { key: IamPermission.IAM_TENANT_READ, description: 'View tenant information', category: IamPermissionCategory.TENANT },
  { key: IamPermission.IAM_TENANT_WRITE, description: 'Update tenant settings', category: IamPermissionCategory.TENANT },
  { key: IamPermission.IAM_CROSS_TENANT, description: 'Access resources across tenants', category: IamPermissionCategory.TENANT },
];

// =============================================================================
// SYSTEM ROLES (Pre-defined roles with fixed permissions)
// =============================================================================

export const SystemRole = {
  GLOBAL_ADMIN: 'global_admin',
  TENANT_ADMIN: 'tenant_admin',
  ADVISOR_ADMIN: 'advisor_admin',
  AUDITOR: 'auditor',
} as const;

export type SystemRoleType = (typeof SystemRole)[keyof typeof SystemRole];

// Permissions for each system role
export const SystemRolePermissions: Record<SystemRoleType, IamPermissionType[]> = {
  [SystemRole.GLOBAL_ADMIN]: Object.values(IamPermission), // All permissions
  [SystemRole.TENANT_ADMIN]: [
    IamPermission.IAM_USER_READ,
    IamPermission.IAM_USER_WRITE,
    IamPermission.IAM_USER_DELETE,
    IamPermission.IAM_USER_INVITE,
    IamPermission.IAM_USER_RESET_PASSWORD,
    IamPermission.IAM_ROLE_READ,
    IamPermission.IAM_ROLE_WRITE,
    IamPermission.IAM_ROLE_ASSIGN,
    IamPermission.IAM_GROUP_READ,
    IamPermission.IAM_GROUP_WRITE,
    IamPermission.IAM_GROUP_DELETE,
    IamPermission.IAM_GROUP_MANAGE_MEMBERS,
    IamPermission.IAM_ACCESS_REQUEST_READ,
    IamPermission.IAM_ACCESS_REQUEST_APPROVE,
    IamPermission.IAM_API_KEY_READ,
    IamPermission.IAM_API_KEY_WRITE,
    IamPermission.IAM_API_KEY_REVOKE,
    IamPermission.IAM_SERVICE_ACCOUNT_READ,
    IamPermission.IAM_SERVICE_ACCOUNT_WRITE,
    IamPermission.IAM_AUDIT_READ,
    IamPermission.IAM_AUDIT_EXPORT,
    IamPermission.IAM_ACCESS_REVIEW_READ,
    IamPermission.IAM_ACCESS_REVIEW_WRITE,
    IamPermission.IAM_ACCESS_REVIEW_DECIDE,
    IamPermission.IAM_SETTINGS_READ,
    IamPermission.IAM_SETTINGS_WRITE,
  ],
  [SystemRole.ADVISOR_ADMIN]: [
    IamPermission.IAM_USER_READ,
    IamPermission.IAM_USER_INVITE,
    IamPermission.IAM_ROLE_READ,
    IamPermission.IAM_GROUP_READ,
    IamPermission.IAM_ACCESS_REQUEST_READ,
    IamPermission.IAM_ACCESS_REQUEST_APPROVE,
    IamPermission.IAM_AUDIT_READ,
    IamPermission.IAM_ACCESS_REVIEW_READ,
    IamPermission.IAM_ACCESS_REVIEW_DECIDE,
  ],
  [SystemRole.AUDITOR]: [
    IamPermission.IAM_USER_READ,
    IamPermission.IAM_ROLE_READ,
    IamPermission.IAM_GROUP_READ,
    IamPermission.IAM_AUDIT_READ,
    IamPermission.IAM_AUDIT_EXPORT,
    IamPermission.IAM_ACCESS_REVIEW_READ,
    IamPermission.IAM_ACCESS_REQUEST_READ,
  ],
};

// =============================================================================
// ACCESS REQUEST STATUS
// =============================================================================

export const AccessRequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type AccessRequestStatusType = (typeof AccessRequestStatus)[keyof typeof AccessRequestStatus];

// =============================================================================
// ACCESS REVIEW STATUS
// =============================================================================

export const AccessReviewStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export type AccessReviewStatusType = (typeof AccessReviewStatus)[keyof typeof AccessReviewStatus];

export const AccessReviewDecision = {
  PENDING: 'pending',
  KEEP: 'keep',
  REMOVE: 'remove',
  CHANGE: 'change',
} as const;

export type AccessReviewDecisionType = (typeof AccessReviewDecision)[keyof typeof AccessReviewDecision];

// =============================================================================
// SERVICE ACCOUNT & API KEY STATUS
// =============================================================================

export const ServiceAccountStatus = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DELETED: 'deleted',
} as const;

export type ServiceAccountStatusType = (typeof ServiceAccountStatus)[keyof typeof ServiceAccountStatus];

export const ApiKeyStatus = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export type ApiKeyStatusType = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus];

// =============================================================================
// IAM AUDIT ACTIONS (extends base AuditAction)
// =============================================================================

export const IamAuditAction = {
  // User actions
  USER_CREATED: 'iam.user.created',
  USER_UPDATED: 'iam.user.updated',
  USER_DELETED: 'iam.user.deleted',
  USER_INVITED: 'iam.user.invited',
  USER_PASSWORD_RESET: 'iam.user.password_reset',
  USER_ROLE_CHANGED: 'iam.user.role_changed',
  USER_MFA_ENABLED: 'iam.user.mfa_enabled',
  USER_MFA_DISABLED: 'iam.user.mfa_disabled',
  USER_LOCKED: 'iam.user.locked',
  USER_UNLOCKED: 'iam.user.unlocked',

  // Role actions
  ROLE_CREATED: 'iam.role.created',
  ROLE_UPDATED: 'iam.role.updated',
  ROLE_DELETED: 'iam.role.deleted',
  ROLE_ASSIGNED: 'iam.role.assigned',
  ROLE_UNASSIGNED: 'iam.role.unassigned',

  // Group actions
  GROUP_CREATED: 'iam.group.created',
  GROUP_UPDATED: 'iam.group.updated',
  GROUP_DELETED: 'iam.group.deleted',
  GROUP_MEMBER_ADDED: 'iam.group.member_added',
  GROUP_MEMBER_REMOVED: 'iam.group.member_removed',

  // Access request actions
  ACCESS_REQUEST_CREATED: 'iam.access_request.created',
  ACCESS_REQUEST_APPROVED: 'iam.access_request.approved',
  ACCESS_REQUEST_REJECTED: 'iam.access_request.rejected',
  ACCESS_REQUEST_EXPIRED: 'iam.access_request.expired',

  // API key actions
  API_KEY_CREATED: 'iam.api_key.created',
  API_KEY_REVOKED: 'iam.api_key.revoked',
  API_KEY_USED: 'iam.api_key.used',

  // Service account actions
  SERVICE_ACCOUNT_CREATED: 'iam.service_account.created',
  SERVICE_ACCOUNT_UPDATED: 'iam.service_account.updated',
  SERVICE_ACCOUNT_DISABLED: 'iam.service_account.disabled',

  // Access review actions
  ACCESS_REVIEW_CREATED: 'iam.access_review.created',
  ACCESS_REVIEW_CLOSED: 'iam.access_review.closed',
  ACCESS_REVIEW_DECISION: 'iam.access_review.decision',

  // Policy actions
  POLICY_UPDATED: 'iam.policy.updated',
  SETTINGS_UPDATED: 'iam.settings.updated',
} as const;

export type IamAuditActionType = (typeof IamAuditAction)[keyof typeof IamAuditAction];
