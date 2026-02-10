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
// DOCUMENT CATEGORIES (Business Transformation Platform Taxonomy)
// =============================================================================

export const DocumentCategory = {
  FORMATION: 'formation',
  GOVERNANCE: 'governance',
  FINANCIAL: 'financial',
  OPERATIONS: 'operations',
  COMPLIANCE: 'compliance',
  IMPROVEMENT: 'improvement',
} as const;

export type DocumentCategoryType = (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const DocumentCategoryLabels: Record<DocumentCategoryType, string> = {
  [DocumentCategory.FORMATION]: 'Formation',
  [DocumentCategory.GOVERNANCE]: 'Governance',
  [DocumentCategory.FINANCIAL]: 'Financial',
  [DocumentCategory.OPERATIONS]: 'Operations',
  [DocumentCategory.COMPLIANCE]: 'Compliance',
  [DocumentCategory.IMPROVEMENT]: 'Improvement',
};

export const DocumentCategoryDescriptions: Record<DocumentCategoryType, string> = {
  [DocumentCategory.FORMATION]: 'Entity formation and organization documents',
  [DocumentCategory.GOVERNANCE]: 'Corporate governance, resolutions, and policies',
  [DocumentCategory.FINANCIAL]: 'Financial records, ownership, and distributions',
  [DocumentCategory.OPERATIONS]: 'Business processes, SOPs, and operational documents',
  [DocumentCategory.COMPLIANCE]: 'Compliance calendars, licenses, and internal controls',
  [DocumentCategory.IMPROVEMENT]: 'Lean Six Sigma, SIPOC, DMAIC, and continuous improvement',
};

// =============================================================================
// DOCUMENT TYPES (PRD-FR-004: Document Generation)
// =============================================================================

export const DocumentType = {
  // FORMATION DOCUMENTS
  ARTICLES_OF_ORGANIZATION: 'articles_of_organization',
  ARTICLES_OF_INCORPORATION: 'articles_of_incorporation',
  OPERATING_AGREEMENT: 'operating_agreement',
  BYLAWS: 'bylaws',
  REGISTERED_AGENT_CONSENT: 'registered_agent_consent',
  INITIAL_MEMBER_RESOLUTION: 'initial_member_resolution',
  INITIAL_BOARD_RESOLUTION: 'initial_board_resolution',
  BUSINESS_ADDRESS_AFFIDAVIT: 'business_address_affidavit',
  STATE_FILING_CONFIRMATION: 'state_filing_confirmation',
  
  // GOVERNANCE DOCUMENTS
  BANKING_RESOLUTION: 'banking_resolution',
  OFFICER_APPOINTMENT_RESOLUTION: 'officer_appointment_resolution',
  MANAGER_APPOINTMENT_RESOLUTION: 'manager_appointment_resolution',
  CONFLICT_OF_INTEREST_POLICY: 'conflict_of_interest_policy',
  CODE_OF_CONDUCT: 'code_of_conduct',
  AMENDMENT_LOG: 'amendment_log',
  
  // FINANCIAL DOCUMENTS
  EIN_CONFIRMATION: 'ein_confirmation',
  EIN_CONFIRMATION_RECORD: 'ein_confirmation_record',
  SOS_FILING_CONFIRMATION: 'sos_filing_confirmation',
  CAPITAL_CONTRIBUTION_RECORD: 'capital_contribution_record',
  OWNERSHIP_LEDGER: 'ownership_ledger',
  DISTRIBUTION_POLICY: 'distribution_policy',
  OWNER_COMPENSATION_POLICY: 'owner_compensation_policy',
  
  // OPERATIONS DOCUMENTS
  BUSINESS_PROCESS_INVENTORY: 'business_process_inventory',
  SOP_TEMPLATE: 'sop_template',
  ROLE_RESPONSIBILITY_MATRIX: 'role_responsibility_matrix',
  VENDOR_MANAGEMENT_CHECKLIST: 'vendor_management_checklist',
  CUSTOMER_INTAKE_PROCESS: 'customer_intake_process',
  
  // COMPLIANCE DOCUMENTS
  ANNUAL_COMPLIANCE_CALENDAR: 'annual_compliance_calendar',
  LICENSE_PERMIT_TRACKER: 'license_permit_tracker',
  INTERNAL_CONTROLS_CHECKLIST: 'internal_controls_checklist',
  DATA_PRIVACY_POLICY: 'data_privacy_policy',
  INFORMATION_SECURITY_POLICY: 'information_security_policy',
  
  // IMPROVEMENT DOCUMENTS (Lean Six Sigma)
  SIPOC_DIAGRAM: 'sipoc_diagram',
  DMAIC_PROJECT_CHARTER: 'dmaic_project_charter',
  KPI_DEFINITIONS: 'kpi_definitions',
  ROOT_CAUSE_ANALYSIS: 'root_cause_analysis',
  CONTROL_PLAN: 'control_plan',
  
  // Legacy / Other
  BUSINESS_PLAN: 'business_plan',
  MEMBER_CERTIFICATE: 'member_certificate',
  RESOLUTION: 'resolution',
  CUSTOM: 'custom',
} as const;

export type DocumentTypeValue = (typeof DocumentType)[keyof typeof DocumentType];

// Map document types to categories
export const DocumentTypeToCategory: Record<DocumentTypeValue, DocumentCategoryType> = {
  // Formation
  [DocumentType.ARTICLES_OF_ORGANIZATION]: DocumentCategory.FORMATION,
  [DocumentType.ARTICLES_OF_INCORPORATION]: DocumentCategory.FORMATION,
  [DocumentType.OPERATING_AGREEMENT]: DocumentCategory.FORMATION,
  [DocumentType.BYLAWS]: DocumentCategory.FORMATION,
  [DocumentType.REGISTERED_AGENT_CONSENT]: DocumentCategory.FORMATION,
  [DocumentType.INITIAL_MEMBER_RESOLUTION]: DocumentCategory.FORMATION,
  [DocumentType.INITIAL_BOARD_RESOLUTION]: DocumentCategory.FORMATION,
  [DocumentType.BUSINESS_ADDRESS_AFFIDAVIT]: DocumentCategory.FORMATION,
  [DocumentType.STATE_FILING_CONFIRMATION]: DocumentCategory.FORMATION,
  
  // Governance
  [DocumentType.BANKING_RESOLUTION]: DocumentCategory.GOVERNANCE,
  [DocumentType.OFFICER_APPOINTMENT_RESOLUTION]: DocumentCategory.GOVERNANCE,
  [DocumentType.MANAGER_APPOINTMENT_RESOLUTION]: DocumentCategory.GOVERNANCE,
  [DocumentType.CONFLICT_OF_INTEREST_POLICY]: DocumentCategory.GOVERNANCE,
  [DocumentType.CODE_OF_CONDUCT]: DocumentCategory.GOVERNANCE,
  [DocumentType.AMENDMENT_LOG]: DocumentCategory.GOVERNANCE,
  
  // Financial
  [DocumentType.EIN_CONFIRMATION]: DocumentCategory.FINANCIAL,
  [DocumentType.EIN_CONFIRMATION_RECORD]: DocumentCategory.FINANCIAL,
  [DocumentType.SOS_FILING_CONFIRMATION]: DocumentCategory.FINANCIAL,
  [DocumentType.CAPITAL_CONTRIBUTION_RECORD]: DocumentCategory.FINANCIAL,
  [DocumentType.OWNERSHIP_LEDGER]: DocumentCategory.FINANCIAL,
  [DocumentType.DISTRIBUTION_POLICY]: DocumentCategory.FINANCIAL,
  [DocumentType.OWNER_COMPENSATION_POLICY]: DocumentCategory.FINANCIAL,
  
  // Operations
  [DocumentType.BUSINESS_PROCESS_INVENTORY]: DocumentCategory.OPERATIONS,
  [DocumentType.SOP_TEMPLATE]: DocumentCategory.OPERATIONS,
  [DocumentType.ROLE_RESPONSIBILITY_MATRIX]: DocumentCategory.OPERATIONS,
  [DocumentType.VENDOR_MANAGEMENT_CHECKLIST]: DocumentCategory.OPERATIONS,
  [DocumentType.CUSTOMER_INTAKE_PROCESS]: DocumentCategory.OPERATIONS,
  
  // Compliance
  [DocumentType.ANNUAL_COMPLIANCE_CALENDAR]: DocumentCategory.COMPLIANCE,
  [DocumentType.LICENSE_PERMIT_TRACKER]: DocumentCategory.COMPLIANCE,
  [DocumentType.INTERNAL_CONTROLS_CHECKLIST]: DocumentCategory.COMPLIANCE,
  [DocumentType.DATA_PRIVACY_POLICY]: DocumentCategory.COMPLIANCE,
  [DocumentType.INFORMATION_SECURITY_POLICY]: DocumentCategory.COMPLIANCE,
  
  // Improvement
  [DocumentType.SIPOC_DIAGRAM]: DocumentCategory.IMPROVEMENT,
  [DocumentType.DMAIC_PROJECT_CHARTER]: DocumentCategory.IMPROVEMENT,
  [DocumentType.KPI_DEFINITIONS]: DocumentCategory.IMPROVEMENT,
  [DocumentType.ROOT_CAUSE_ANALYSIS]: DocumentCategory.IMPROVEMENT,
  [DocumentType.CONTROL_PLAN]: DocumentCategory.IMPROVEMENT,
  
  // Legacy / Other
  [DocumentType.BUSINESS_PLAN]: DocumentCategory.OPERATIONS,
  [DocumentType.MEMBER_CERTIFICATE]: DocumentCategory.FORMATION,
  [DocumentType.RESOLUTION]: DocumentCategory.GOVERNANCE,
  [DocumentType.CUSTOM]: DocumentCategory.OPERATIONS,
};

// Document priority by archetype
export const DocumentPriorityByArchetype: Record<string, {
  required: DocumentTypeValue[];
  recommended: DocumentTypeValue[];
}> = {
  universal: {
    required: [
      DocumentType.ARTICLES_OF_ORGANIZATION,
      DocumentType.OPERATING_AGREEMENT,
      DocumentType.INITIAL_MEMBER_RESOLUTION,
      DocumentType.EIN_CONFIRMATION_RECORD,
      DocumentType.BUSINESS_PROCESS_INVENTORY,
      DocumentType.ANNUAL_COMPLIANCE_CALENDAR,
    ],
    recommended: [
      DocumentType.BANKING_RESOLUTION,
      DocumentType.CAPITAL_CONTRIBUTION_RECORD,
    ],
  },
  professional_services: {
    required: [
      DocumentType.SOP_TEMPLATE,
      DocumentType.CUSTOMER_INTAKE_PROCESS,
    ],
    recommended: [
      DocumentType.OWNER_COMPENSATION_POLICY,
      DocumentType.CONFLICT_OF_INTEREST_POLICY,
    ],
  },
  home_services: {
    required: [
      DocumentType.SOP_TEMPLATE,
      DocumentType.LICENSE_PERMIT_TRACKER,
    ],
    recommended: [
      DocumentType.INTERNAL_CONTROLS_CHECKLIST,
      DocumentType.VENDOR_MANAGEMENT_CHECKLIST,
    ],
  },
  ecommerce: {
    required: [
      DocumentType.DATA_PRIVACY_POLICY,
      DocumentType.VENDOR_MANAGEMENT_CHECKLIST,
    ],
    recommended: [
      DocumentType.INTERNAL_CONTROLS_CHECKLIST,
      DocumentType.SOP_TEMPLATE,
    ],
  },
  food_business: {
    required: [
      DocumentType.LICENSE_PERMIT_TRACKER,
      DocumentType.SOP_TEMPLATE,
    ],
    recommended: [
      DocumentType.VENDOR_MANAGEMENT_CHECKLIST,
      DocumentType.INTERNAL_CONTROLS_CHECKLIST,
    ],
  },
  nonprofit: {
    required: [
      DocumentType.CONFLICT_OF_INTEREST_POLICY,
      DocumentType.BYLAWS,
    ],
    recommended: [
      DocumentType.CODE_OF_CONDUCT,
      DocumentType.INTERNAL_CONTROLS_CHECKLIST,
    ],
  },
  healthcare_adjacent: {
    required: [
      DocumentType.DATA_PRIVACY_POLICY,
      DocumentType.INFORMATION_SECURITY_POLICY,
    ],
    recommended: [
      DocumentType.SOP_TEMPLATE,
      DocumentType.INTERNAL_CONTROLS_CHECKLIST,
    ],
  },
};

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
// PRIMARY ROLES (Simplified 4-Role Model)
// =============================================================================

export const PrimaryRole = {
  IT_ADMIN: 'it_admin',
  MANAGER: 'manager',
  ADVISOR: 'advisor',
  CUSTOMER: 'customer',
} as const;

export type PrimaryRoleType = (typeof PrimaryRole)[keyof typeof PrimaryRole];

// Primary role display names
export const PrimaryRoleLabels: Record<PrimaryRoleType, string> = {
  [PrimaryRole.IT_ADMIN]: 'IT Admin',
  [PrimaryRole.MANAGER]: 'Manager',
  [PrimaryRole.ADVISOR]: 'Advisor',
  [PrimaryRole.CUSTOMER]: 'Customer',
};

// Primary role descriptions
export const PrimaryRoleDescriptions: Record<PrimaryRoleType, string> = {
  [PrimaryRole.IT_ADMIN]: 'Full platform access including IAM management, audit logs, and cross-tenant operations',
  [PrimaryRole.MANAGER]: 'Manage users and operations within their tenant, invite users, manage tasks and documents',
  [PrimaryRole.ADVISOR]: 'Access assigned tenants only, approve tasks and documents, no IAM management',
  [PrimaryRole.CUSTOMER]: 'Access own tenant only, manage onboarding, tasks, and documents',
};

// Map legacy UserRole to PrimaryRole
export const LegacyRoleToPrimaryRole: Record<string, PrimaryRoleType> = {
  [UserRole.SYSTEM_ADMIN]: PrimaryRole.IT_ADMIN,
  [UserRole.PROGRAM_ADMIN]: PrimaryRole.MANAGER,
  [UserRole.ADVISOR]: PrimaryRole.ADVISOR,
  [UserRole.CLIENT_OWNER]: PrimaryRole.CUSTOMER,
  [UserRole.CLIENT_ADMIN]: PrimaryRole.CUSTOMER,
  [UserRole.CLIENT_CONTRIBUTOR]: PrimaryRole.CUSTOMER,
  [UserRole.EXTERNAL_PARTNER]: PrimaryRole.CUSTOMER,
};

// =============================================================================
// OPERATIONAL PERMISSIONS (Non-IAM)
// =============================================================================

export const OperationalPermission = {
  // User operations (tenant-scoped, different from IAM)
  USERS_INVITE: 'users.invite',
  USERS_UPDATE: 'users.update',

  // Tasks
  TASKS_READ: 'tasks.read',
  TASKS_MANAGE: 'tasks.manage',
  TASKS_APPROVE: 'tasks.approve',

  // Documents
  DOCUMENTS_READ: 'documents.read',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_APPROVE: 'documents.approve',

  // Dashboards and Reports
  DASHBOARDS_READ: 'dashboards.read',
  REPORTS_READ: 'reports.read',

  // Onboarding
  ONBOARDING_READ: 'onboarding.read',
  ONBOARDING_UPDATE: 'onboarding.update',

  // Customer access (for advisors)
  CUSTOMERS_READ: 'customers.read',

  // Messaging
  MESSAGES_SEND: 'messages.send',

  // Issues (optional)
  ISSUES_MANAGE: 'issues.manage',
} as const;

export type OperationalPermissionType = (typeof OperationalPermission)[keyof typeof OperationalPermission];

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
  // New simplified roles
  IT_ADMIN: 'it_admin',
  MANAGER: 'manager',
  ADVISOR: 'advisor',
  CUSTOMER: 'customer',
} as const;

export type SystemRoleType = (typeof SystemRole)[keyof typeof SystemRole];

// Legacy system role permissions (backward compatibility)
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
  // New simplified roles - IAM permissions only (operational permissions handled separately)
  [SystemRole.IT_ADMIN]: Object.values(IamPermission), // All IAM permissions
  [SystemRole.MANAGER]: [
    IamPermission.IAM_USER_READ,
    IamPermission.IAM_USER_INVITE,
    IamPermission.IAM_ROLE_READ,
    IamPermission.IAM_GROUP_READ,
  ],
  [SystemRole.ADVISOR]: [
    IamPermission.IAM_USER_READ,
  ],
  [SystemRole.CUSTOMER]: [
    IamPermission.IAM_ACCESS_REQUEST_CREATE,
  ],
};

// =============================================================================
// PRIMARY ROLE PERMISSIONS (Combined IAM + Operational)
// =============================================================================

// IT_ADMIN: Full IAM access + all operational permissions
export const ItAdminPermissions = {
  iam: Object.values(IamPermission),
  operational: Object.values(OperationalPermission),
};

// MANAGER: Limited IAM + tenant operations
export const ManagerPermissions = {
  iam: [
    IamPermission.IAM_USER_READ,
    IamPermission.IAM_USER_INVITE,
    IamPermission.IAM_ROLE_READ,
    IamPermission.IAM_GROUP_READ,
  ] as IamPermissionType[],
  operational: [
    OperationalPermission.USERS_INVITE,
    OperationalPermission.USERS_UPDATE,
    OperationalPermission.TASKS_READ,
    OperationalPermission.TASKS_MANAGE,
    OperationalPermission.DOCUMENTS_READ,
    OperationalPermission.DOCUMENTS_UPLOAD,
    OperationalPermission.DASHBOARDS_READ,
    OperationalPermission.REPORTS_READ,
    OperationalPermission.ISSUES_MANAGE,
  ] as OperationalPermissionType[],
};

// ADVISOR: Read assigned tenants, approve tasks/docs
export const AdvisorPermissions = {
  iam: [
    IamPermission.IAM_USER_READ,
  ] as IamPermissionType[],
  operational: [
    OperationalPermission.CUSTOMERS_READ,
    OperationalPermission.TASKS_READ,
    OperationalPermission.TASKS_APPROVE,
    OperationalPermission.DOCUMENTS_READ,
    OperationalPermission.DOCUMENTS_APPROVE,
    OperationalPermission.DASHBOARDS_READ,
    OperationalPermission.REPORTS_READ,
    OperationalPermission.ISSUES_MANAGE,
  ] as OperationalPermissionType[],
};

// CUSTOMER: Own tenant operations only
export const CustomerPermissions = {
  iam: [
    IamPermission.IAM_ACCESS_REQUEST_CREATE,
  ] as IamPermissionType[],
  operational: [
    OperationalPermission.ONBOARDING_READ,
    OperationalPermission.ONBOARDING_UPDATE,
    OperationalPermission.TASKS_READ,
    OperationalPermission.TASKS_MANAGE,
    OperationalPermission.DOCUMENTS_READ,
    OperationalPermission.DOCUMENTS_UPLOAD,
    OperationalPermission.DASHBOARDS_READ,
    OperationalPermission.MESSAGES_SEND,
  ] as OperationalPermissionType[],
};

// Combined permissions by primary role
export const PrimaryRolePermissions: Record<PrimaryRoleType, {
  iam: IamPermissionType[];
  operational: OperationalPermissionType[];
}> = {
  [PrimaryRole.IT_ADMIN]: ItAdminPermissions,
  [PrimaryRole.MANAGER]: ManagerPermissions,
  [PrimaryRole.ADVISOR]: AdvisorPermissions,
  [PrimaryRole.CUSTOMER]: CustomerPermissions,
};

// Roles that can be assigned by a Manager (privilege escalation prevention)
export const ManagerAssignableRoles: PrimaryRoleType[] = [
  PrimaryRole.CUSTOMER,
  PrimaryRole.MANAGER,
];

// Roles that require cross-tenant access
export const CrossTenantRoles: PrimaryRoleType[] = [
  PrimaryRole.IT_ADMIN,
  PrimaryRole.ADVISOR,
];

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
  // Authentication actions
  AUTH_LOGIN_SUCCESS: 'iam.auth.login_success',
  AUTH_LOGIN_FAILED: 'iam.auth.login_failed',
  AUTH_LOGOUT: 'iam.auth.logout',
  AUTH_PASSWORD_CHANGED: 'iam.auth.password_changed',
  AUTH_MFA_CHALLENGE: 'iam.auth.mfa_challenge',
  AUTH_SESSION_EXPIRED: 'iam.auth.session_expired',
  AUTH_TOKEN_REFRESH: 'iam.auth.token_refresh',

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

  // Advisor assignment actions
  ADVISOR_ASSIGNMENT_CREATED: 'iam.advisor_assignment.created',
  ADVISOR_ASSIGNMENT_UPDATED: 'iam.advisor_assignment.updated',
  ADVISOR_ASSIGNMENT_REMOVED: 'iam.advisor_assignment.removed',
} as const;

export type IamAuditActionType = (typeof IamAuditAction)[keyof typeof IamAuditAction];

// =============================================================================
// ADVISOR ASSIGNMENT STATUS
// =============================================================================

export const AdvisorAssignmentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

export type AdvisorAssignmentStatusType = (typeof AdvisorAssignmentStatus)[keyof typeof AdvisorAssignmentStatus];

// =============================================================================
// OPERATIONAL PERMISSION CATALOG (for UI)
// =============================================================================

export const OperationalPermissionCategory = {
  USER_OPERATIONS: 'User Operations',
  TASKS: 'Tasks',
  DOCUMENTS: 'Documents',
  DASHBOARDS: 'Dashboards and Reports',
  ONBOARDING: 'Onboarding',
  CUSTOMERS: 'Customer Access',
  MESSAGING: 'Messaging',
  ISSUES: 'Issues',
} as const;

export type OperationalPermissionCategoryType = (typeof OperationalPermissionCategory)[keyof typeof OperationalPermissionCategory];

export const OperationalPermissionCatalog: Array<{
  key: OperationalPermissionType;
  description: string;
  category: OperationalPermissionCategoryType;
}> = [
  // User Operations
  { key: OperationalPermission.USERS_INVITE, description: 'Invite new users to tenant', category: OperationalPermissionCategory.USER_OPERATIONS },
  { key: OperationalPermission.USERS_UPDATE, description: 'Update user profiles within tenant', category: OperationalPermissionCategory.USER_OPERATIONS },

  // Tasks
  { key: OperationalPermission.TASKS_READ, description: 'View tasks and checklists', category: OperationalPermissionCategory.TASKS },
  { key: OperationalPermission.TASKS_MANAGE, description: 'Create and update tasks', category: OperationalPermissionCategory.TASKS },
  { key: OperationalPermission.TASKS_APPROVE, description: 'Approve or reject tasks', category: OperationalPermissionCategory.TASKS },

  // Documents
  { key: OperationalPermission.DOCUMENTS_READ, description: 'View documents', category: OperationalPermissionCategory.DOCUMENTS },
  { key: OperationalPermission.DOCUMENTS_UPLOAD, description: 'Upload documents', category: OperationalPermissionCategory.DOCUMENTS },
  { key: OperationalPermission.DOCUMENTS_APPROVE, description: 'Approve or reject documents', category: OperationalPermissionCategory.DOCUMENTS },

  // Dashboards
  { key: OperationalPermission.DASHBOARDS_READ, description: 'View dashboards', category: OperationalPermissionCategory.DASHBOARDS },
  { key: OperationalPermission.REPORTS_READ, description: 'View reports', category: OperationalPermissionCategory.DASHBOARDS },

  // Onboarding
  { key: OperationalPermission.ONBOARDING_READ, description: 'View onboarding progress', category: OperationalPermissionCategory.ONBOARDING },
  { key: OperationalPermission.ONBOARDING_UPDATE, description: 'Update onboarding information', category: OperationalPermissionCategory.ONBOARDING },

  // Customer Access
  { key: OperationalPermission.CUSTOMERS_READ, description: 'View customer information (for advisors)', category: OperationalPermissionCategory.CUSTOMERS },

  // Messaging
  { key: OperationalPermission.MESSAGES_SEND, description: 'Send messages', category: OperationalPermissionCategory.MESSAGING },

  // Issues
  { key: OperationalPermission.ISSUES_MANAGE, description: 'Manage issues and tickets', category: OperationalPermissionCategory.ISSUES },
];

// =============================================================================
// ACCESS REVIEW CAMPAIGN (IAM Compliance)
// =============================================================================

/**
 * Access Review Campaign Status
 * Tracks the lifecycle of an access review campaign
 */
export const AccessReviewCampaignStatus = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed',
} as const;

export type AccessReviewCampaignStatusType = (typeof AccessReviewCampaignStatus)[keyof typeof AccessReviewCampaignStatus];

/**
 * Campaign Decision Type
 * The decision made for each access item during review
 */
export const CampaignDecisionType = {
  APPROVE: 'approve',
  REVOKE: 'revoke',
  MODIFY: 'modify',
  ESCALATE: 'escalate',
  PENDING: 'pending',
} as const;

export type CampaignDecisionTypeValue = (typeof CampaignDecisionType)[keyof typeof CampaignDecisionType];

/**
 * Privilege Level
 * Classification of access privilege levels
 */
export const PrivilegeLevel = {
  STANDARD: 'standard',
  ELEVATED: 'elevated',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type PrivilegeLevelType = (typeof PrivilegeLevel)[keyof typeof PrivilegeLevel];

export const PrivilegeLevelLabels: Record<PrivilegeLevelType, string> = {
  [PrivilegeLevel.STANDARD]: 'Standard',
  [PrivilegeLevel.ELEVATED]: 'Elevated',
  [PrivilegeLevel.ADMIN]: 'Admin',
  [PrivilegeLevel.SUPER_ADMIN]: 'Super Admin',
};

/**
 * Employment Type
 * Classification of user employment relationship
 */
export const EmploymentType = {
  EMPLOYEE: 'employee',
  CONTRACTOR: 'contractor',
  VENDOR: 'vendor',
} as const;

export type EmploymentTypeValue = (typeof EmploymentType)[keyof typeof EmploymentType];

export const EmploymentTypeLabels: Record<EmploymentTypeValue, string> = {
  [EmploymentType.EMPLOYEE]: 'Employee',
  [EmploymentType.CONTRACTOR]: 'Contractor',
  [EmploymentType.VENDOR]: 'Vendor',
};

/**
 * Environment Type
 * Classification of system environments
 */
export const EnvironmentType = {
  PROD: 'prod',
  UAT: 'uat',
  DEV: 'dev',
} as const;

export type EnvironmentTypeValue = (typeof EnvironmentType)[keyof typeof EnvironmentType];

export const EnvironmentTypeLabels: Record<EnvironmentTypeValue, string> = {
  [EnvironmentType.PROD]: 'Production',
  [EnvironmentType.UAT]: 'UAT',
  [EnvironmentType.DEV]: 'Development',
};

/**
 * Data Classification
 * Classification of data sensitivity levels
 */
export const DataClassification = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
} as const;

export type DataClassificationType = (typeof DataClassification)[keyof typeof DataClassification];

export const DataClassificationLabels: Record<DataClassificationType, string> = {
  [DataClassification.PUBLIC]: 'Public',
  [DataClassification.INTERNAL]: 'Internal',
  [DataClassification.CONFIDENTIAL]: 'Confidential',
  [DataClassification.RESTRICTED]: 'Restricted',
};

/**
 * Entitlement Type
 * Types of access entitlements that can be reviewed
 */
export const EntitlementType = {
  ROLE: 'role',
  GROUP: 'group',
  PERMISSION: 'permission',
  LICENSE: 'license',
  API_KEY: 'api_key',
  TOKEN: 'token',
} as const;

export type EntitlementTypeValue = (typeof EntitlementType)[keyof typeof EntitlementType];

export const EntitlementTypeLabels: Record<EntitlementTypeValue, string> = {
  [EntitlementType.ROLE]: 'Role',
  [EntitlementType.GROUP]: 'Group',
  [EntitlementType.PERMISSION]: 'Permission',
  [EntitlementType.LICENSE]: 'License',
  [EntitlementType.API_KEY]: 'API Key',
  [EntitlementType.TOKEN]: 'Token',
};

/**
 * Grant Method
 * How access was granted to the user
 */
export const GrantMethod = {
  MANUAL: 'manual',
  WORKFLOW: 'workflow',
  SCIM: 'scim',
  HR_FEED: 'hr_feed',
  GROUP_MEMBERSHIP: 'group_membership',
  API: 'api',
} as const;

export type GrantMethodType = (typeof GrantMethod)[keyof typeof GrantMethod];

export const GrantMethodLabels: Record<GrantMethodType, string> = {
  [GrantMethod.MANUAL]: 'Manual',
  [GrantMethod.WORKFLOW]: 'Workflow',
  [GrantMethod.SCIM]: 'SCIM',
  [GrantMethod.HR_FEED]: 'HR Feed',
  [GrantMethod.GROUP_MEMBERSHIP]: 'Group Membership',
  [GrantMethod.API]: 'API',
};

/**
 * SOD Concern Status
 * Segregation of Duties concern indicator
 */
export const SodConcern = {
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown',
} as const;

export type SodConcernType = (typeof SodConcern)[keyof typeof SodConcern];

/**
 * Review Type
 * Type of access review being conducted
 */
export const ReviewType = {
  PERIODIC: 'periodic',
  EVENT_DRIVEN: 'event_driven',
  ROLE_CHANGE: 'role_change',
  TERMINATION: 'termination',
  COMPLIANCE: 'compliance',
} as const;

export type ReviewTypeValue = (typeof ReviewType)[keyof typeof ReviewType];

export const ReviewTypeLabels: Record<ReviewTypeValue, string> = {
  [ReviewType.PERIODIC]: 'Periodic Review',
  [ReviewType.EVENT_DRIVEN]: 'Event Driven',
  [ReviewType.ROLE_CHANGE]: 'Role Change',
  [ReviewType.TERMINATION]: 'Termination',
  [ReviewType.COMPLIANCE]: 'Compliance Audit',
};

/**
 * Reviewer Type
 * Who is responsible for conducting the review
 */
export const ReviewerType = {
  MANAGER: 'manager',
  APP_OWNER: 'app_owner',
  IT_ADMIN: 'it_admin',
  COMPLIANCE: 'compliance',
} as const;

export type ReviewerTypeValue = (typeof ReviewerType)[keyof typeof ReviewerType];

/**
 * Remediation Status
 * Status of access revocation/modification remediation
 */
export const RemediationStatus = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type RemediationStatusType = (typeof RemediationStatus)[keyof typeof RemediationStatus];

/**
 * Subject Status
 * Review status for individual subjects in a campaign
 */
export const SubjectStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type SubjectStatusType = (typeof SubjectStatus)[keyof typeof SubjectStatus];

/**
 * Second Level Approval Decision
 */
export const SecondLevelDecision = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type SecondLevelDecisionType = (typeof SecondLevelDecision)[keyof typeof SecondLevelDecision];

/**
 * Reason Codes for Access Review Decisions
 */
export const DecisionReasonCode = {
  // Approve reasons
  BUSINESS_NEED: 'business_need',
  JOB_FUNCTION: 'job_function',
  MANAGER_APPROVED: 'manager_approved',
  COMPLIANT: 'compliant',
  // Revoke reasons
  NO_LONGER_NEEDED: 'no_longer_needed',
  ROLE_CHANGE: 'role_change',
  TERMINATION: 'termination',
  COMPLIANCE_VIOLATION: 'compliance_violation',
  SOD_CONFLICT: 'sod_conflict',
  EXCESSIVE_ACCESS: 'excessive_access',
  // Modify reasons
  REDUCE_SCOPE: 'reduce_scope',
  UPDATE_PERMISSIONS: 'update_permissions',
  TIME_BOUND: 'time_bound',
  // Escalate reasons
  REQUIRES_APPROVAL: 'requires_approval',
  POLICY_EXCEPTION: 'policy_exception',
  UNKNOWN_JUSTIFICATION: 'unknown_justification',
} as const;

export type DecisionReasonCodeType = (typeof DecisionReasonCode)[keyof typeof DecisionReasonCode];

/**
 * Regulated Flags
 * Compliance/regulatory flags for access items
 */
export const RegulatedFlag = {
  SOX: 'sox',
  PCI: 'pci',
  HIPAA: 'hipaa',
  GDPR: 'gdpr',
  SOC2: 'soc2',
  FERPA: 'ferpa',
} as const;

export type RegulatedFlagType = (typeof RegulatedFlag)[keyof typeof RegulatedFlag];

/**
 * IAM Audit Actions for Access Review Campaigns
 */
export const AccessReviewCampaignAuditAction = {
  CAMPAIGN_CREATED: 'iam.access_review_campaign.created',
  CAMPAIGN_UPDATED: 'iam.access_review_campaign.updated',
  CAMPAIGN_SUBMITTED: 'iam.access_review_campaign.submitted',
  CAMPAIGN_APPROVED: 'iam.access_review_campaign.approved',
  CAMPAIGN_REJECTED: 'iam.access_review_campaign.rejected',
  CAMPAIGN_REMEDIATION_STARTED: 'iam.access_review_campaign.remediation_started',
  CAMPAIGN_REMEDIATION_COMPLETED: 'iam.access_review_campaign.remediation_completed',
  CAMPAIGN_COMPLETED: 'iam.access_review_campaign.completed',
  SUBJECT_REVIEWED: 'iam.access_review_campaign.subject_reviewed',
  ITEM_DECISION_MADE: 'iam.access_review_campaign.item_decision',
} as const;

export type AccessReviewCampaignAuditActionType = (typeof AccessReviewCampaignAuditAction)[keyof typeof AccessReviewCampaignAuditAction];

/**
 * Campaign Scope Type
 * What is being reviewed in the campaign
 */
export const CampaignScopeType = {
  USERS: 'users',
  GROUPS: 'groups',
  MIXED: 'mixed',
} as const;

export type CampaignScopeTypeValue = (typeof CampaignScopeType)[keyof typeof CampaignScopeType];

/**
 * Group Review Status
 * Status of group certification
 */
export const GroupReviewStatus = {
  PENDING: 'pending',
  MEMBERSHIP_CERTIFIED: 'membership_certified',
  PERMISSIONS_CERTIFIED: 'permissions_certified',
  FULLY_CERTIFIED: 'fully_certified',
  CHANGES_REQUIRED: 'changes_required',
} as const;

export type GroupReviewStatusType = (typeof GroupReviewStatus)[keyof typeof GroupReviewStatus];

/**
 * Bulk Action Type
 * Types of bulk actions for fast review
 */
export const BulkActionType = {
  APPROVE_ALL: 'approve_all',
  APPROVE_STANDARD: 'approve_standard_only',
  REVOKE_UNUSED: 'revoke_unused',
  COPY_DECISION: 'copy_decision',
  FLAG_FOR_REVIEW: 'flag_for_review',
} as const;

export type BulkActionTypeValue = (typeof BulkActionType)[keyof typeof BulkActionType];

// =============================================================================
// BUSINESS APP CONSTANTS
// =============================================================================

/**
 * Formation Status
 * Tracks the SOS formation filing status
 */
export const FormationStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PENDING_FILING: 'pending_filing',
  FILED: 'filed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type FormationStatusType = (typeof FormationStatus)[keyof typeof FormationStatus];

/**
 * EIN Status
 * Tracks the EIN application status
 */
export const EINStatus = {
  NOT_STARTED: 'not_started',
  APPLICATION_PREPARED: 'application_prepared',
  APPLICATION_SUBMITTED: 'application_submitted',
  PENDING: 'pending',
  RECEIVED: 'received',
  FAILED: 'failed',
} as const;

export type EINStatusType = (typeof EINStatus)[keyof typeof EINStatus];

/**
 * Archetype Category
 * Categories for business archetypes
 */
export const ArchetypeCategory = {
  PROFESSIONAL_SERVICES: 'professional_services',
  HOME_SERVICES: 'home_services',
  ECOMMERCE: 'ecommerce',
  RETAIL: 'retail',
  FOOD_BUSINESS: 'food_business',
  PERSONAL_CARE: 'personal_care',
  FITNESS_COACHING: 'fitness_coaching',
  REAL_ESTATE: 'real_estate',
  CONSTRUCTION_TRADES: 'construction_trades',
  TRANSPORTATION: 'transportation',
  CHILDCARE: 'childcare',
  NONPROFIT: 'nonprofit',
  CREATIVE_SERVICES: 'creative_services',
  HEALTHCARE_ADJACENT: 'healthcare_adjacent',
} as const;

export type ArchetypeCategoryType = (typeof ArchetypeCategory)[keyof typeof ArchetypeCategory];

/**
 * Artifact Type
 * Types of artifacts/evidence stored
 */
export const ArtifactType = {
  SOS_FILING: 'sos_filing',
  SOS_CONFIRMATION: 'sos_confirmation',
  EIN_APPLICATION: 'ein_application',
  EIN_CONFIRMATION: 'ein_confirmation',
  OPERATING_AGREEMENT: 'operating_agreement',
  BYLAWS: 'bylaws',
  ARTICLES: 'articles',
  CERTIFICATE: 'certificate',
  LICENSE: 'license',
  PERMIT: 'permit',
  CONTRACT: 'contract',
  SCREENSHOT: 'screenshot',
  FORM: 'form',
  RECEIPT: 'receipt',
  OTHER: 'other',
} as const;

export type ArtifactTypeValue = (typeof ArtifactType)[keyof typeof ArtifactType];

/**
 * Workflow Template Category
 */
export const WorkflowTemplateCategory = {
  FORMATION: 'formation',
  OPERATIONS: 'operations',
  COMPLIANCE: 'compliance',
  PROJECT: 'project',
  ONBOARDING: 'onboarding',
} as const;

export type WorkflowTemplateCategoryType = (typeof WorkflowTemplateCategory)[keyof typeof WorkflowTemplateCategory];

/**
 * Workflow Instance Status
 */
export const WorkflowInstanceStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  AWAITING_APPROVAL: 'awaiting_approval',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type WorkflowInstanceStatusType = (typeof WorkflowInstanceStatus)[keyof typeof WorkflowInstanceStatus];

/**
 * Step Status
 */
export const StepStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;

export type StepStatusType = (typeof StepStatus)[keyof typeof StepStatus];

/**
 * DMAIC Phase
 */
export const DMAICPhase = {
  DEFINE: 'define',
  MEASURE: 'measure',
  ANALYZE: 'analyze',
  IMPROVE: 'improve',
  CONTROL: 'control',
} as const;

export type DMAICPhaseType = (typeof DMAICPhase)[keyof typeof DMAICPhase];

export const DMAICPhaseLabels: Record<DMAICPhaseType, string> = {
  [DMAICPhase.DEFINE]: 'Define',
  [DMAICPhase.MEASURE]: 'Measure',
  [DMAICPhase.ANALYZE]: 'Analyze',
  [DMAICPhase.IMPROVE]: 'Improve',
  [DMAICPhase.CONTROL]: 'Control',
};

/**
 * SIPOC Element Type
 */
export const SIPOCElement = {
  SUPPLIER: 'supplier',
  INPUT: 'input',
  PROCESS: 'process',
  OUTPUT: 'output',
  CUSTOMER: 'customer',
} as const;

export type SIPOCElementType = (typeof SIPOCElement)[keyof typeof SIPOCElement];

/**
 * Process Category
 */
export const ProcessCategory = {
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  MARKETING: 'marketing',
  SALES: 'sales',
  HR: 'hr',
  COMPLIANCE: 'compliance',
  CUSTOMER_SERVICE: 'customer_service',
  IT: 'it',
  ADMINISTRATION: 'administration',
} as const;

export type ProcessCategoryType = (typeof ProcessCategory)[keyof typeof ProcessCategory];

/**
 * KPI Frequency
 */
export const KPIFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export type KPIFrequencyType = (typeof KPIFrequency)[keyof typeof KPIFrequency];

/**
 * Risk Level
 */
export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RiskLevelType = (typeof RiskLevel)[keyof typeof RiskLevel];

/**
 * Approval Status
 */
export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
} as const;

export type ApprovalStatusType = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/**
 * Business App Audit Actions
 */
export const BusinessAppAuditAction = {
  // Setup
  SETUP_STARTED: 'app.setup.started',
  ARCHETYPE_SELECTED: 'app.setup.archetype_selected',
  ENTITY_TYPE_SELECTED: 'app.setup.entity_type_selected',
  STATE_SELECTED: 'app.setup.state_selected',
  SETUP_COMPLETED: 'app.setup.completed',
  
  // Formation
  FORMATION_STARTED: 'app.formation.started',
  SOS_PREPARED: 'app.formation.sos_prepared',
  SOS_FILED: 'app.formation.sos_filed',
  SOS_APPROVED: 'app.formation.sos_approved',
  EIN_PREPARED: 'app.formation.ein_prepared',
  EIN_SUBMITTED: 'app.formation.ein_submitted',
  EIN_RECEIVED: 'app.formation.ein_received',
  FORMATION_COMPLETED: 'app.formation.completed',
  
  // Workflow
  WORKFLOW_STARTED: 'app.workflow.started',
  WORKFLOW_STEP_COMPLETED: 'app.workflow.step_completed',
  WORKFLOW_PHASE_COMPLETED: 'app.workflow.phase_completed',
  WORKFLOW_COMPLETED: 'app.workflow.completed',
  
  // Artifacts
  ARTIFACT_UPLOADED: 'app.artifact.uploaded',
  ARTIFACT_VERIFIED: 'app.artifact.verified',
  
  // SIPOC
  PROCESS_CREATED: 'app.sipoc.process_created',
  PROCESS_UPDATED: 'app.sipoc.process_updated',
  
  // DMAIC
  DMAIC_PROJECT_CREATED: 'app.dmaic.project_created',
  DMAIC_PHASE_COMPLETED: 'app.dmaic.phase_completed',
  DMAIC_PROJECT_COMPLETED: 'app.dmaic.project_completed',
} as const;

export type BusinessAppAuditActionType = (typeof BusinessAppAuditAction)[keyof typeof BusinessAppAuditAction];
