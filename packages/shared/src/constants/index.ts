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
