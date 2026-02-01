/**
 * CHANGE Platform Zod Validation Schemas
 * Runtime validation shared between frontend and backend
 */

import { z } from 'zod';
import {
  UserRole,
  EnrollmentStatus,
  WorkflowPhase,
  WorkflowStatus,
  FormationStep,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  DocumentType,
  DocumentStatus,
  BusinessType,
  USState,
  AuditAction,
  CohortStatus,
  PaginationDefaults,
} from '../constants/index.js';

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId format');

export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number format')
  .optional();

export const urlSchema = z.string().url('Invalid URL').optional();

export const einSchema = z
  .string()
  .regex(/^\d{2}-\d{7}$/, 'EIN must be in format XX-XXXXXXX')
  .optional();

export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const userRoleSchema = z.nativeEnum(UserRole);
export const enrollmentStatusSchema = z.nativeEnum(EnrollmentStatus);
export const workflowPhaseSchema = z.nativeEnum(WorkflowPhase);
export const workflowStatusSchema = z.nativeEnum(WorkflowStatus);
export const formationStepSchema = z.nativeEnum(FormationStep);
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);
export const taskCategorySchema = z.nativeEnum(TaskCategory);
export const documentTypeSchema = z.nativeEnum(DocumentType);
export const documentStatusSchema = z.nativeEnum(DocumentStatus);
export const businessTypeSchema = z.nativeEnum(BusinessType);
export const usStateSchema = z.nativeEnum(USState);
export const auditActionSchema = z.nativeEnum(AuditAction);
export const cohortStatusSchema = z.nativeEnum(CohortStatus);

// =============================================================================
// ADDRESS SCHEMA
// =============================================================================

export const addressSchema = z.object({
  street1: z.string().min(1, 'Street address is required').max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: usStateSchema,
  zipCode: zipCodeSchema,
  country: z.string().default('USA'),
});

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  role: userRoleSchema.optional(),
  tenantId: objectIdSchema.optional(),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// =============================================================================
// TENANT SCHEMAS
// =============================================================================

export const tenantSettingsSchema = z.object({
  timezone: z.string().default('America/New_York'),
  locale: z.string().default('en-US'),
  features: z.array(z.string()).default([]),
  branding: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      logoUrl: urlSchema,
    })
    .optional(),
});

export const tenantCreateRequestSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters').max(200).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim(),
  settings: tenantSettingsSchema.optional(),
});

export const tenantUpdateRequestSchema = tenantCreateRequestSchema.partial();

// =============================================================================
// BUSINESS PROFILE SCHEMAS
// =============================================================================

export const registeredAgentSchema = z.object({
  type: z.enum(['self', 'commercial', 'individual']),
  name: z.string().min(1, 'Registered agent name is required').max(200),
  address: addressSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
});

export const businessProfileCreateRequestSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200).trim(),
  businessType: businessTypeSchema,
  formationState: usStateSchema,
  isExistingBusiness: z.boolean(),
  email: emailSchema,
  phone: phoneSchema,
});

export const businessProfileUpdateRequestSchema = z.object({
  businessName: z.string().min(1).max(200).trim().optional(),
  dbaName: z.string().max(200).trim().optional(),
  businessType: businessTypeSchema.optional(),
  formationState: usStateSchema.optional(),
  isExistingBusiness: z.boolean().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  website: urlSchema,
  businessAddress: addressSchema.optional(),
  mailingAddress: addressSchema.optional(),
  registeredAgent: registeredAgentSchema.optional(),
  ein: einSchema,
  sosFilingNumber: z.string().max(50).optional(),
});

// =============================================================================
// PERSON SCHEMAS
// =============================================================================

export const personRoleSchema = z.object({
  type: z.enum(['owner', 'member', 'manager', 'officer', 'director', 'registered_agent']),
  title: z.string().max(100).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const personCreateRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema.optional(),
  dateOfBirth: z.coerce.date().optional(),
  roles: z.array(personRoleSchema).min(1, 'At least one role is required'),
  ownershipPercentage: z.number().min(0).max(100).optional(),
  isSigningAuthority: z.boolean().default(false),
  isPrimaryContact: z.boolean().default(false),
});

export const personUpdateRequestSchema = personCreateRequestSchema.partial();

// =============================================================================
// COHORT & ENROLLMENT SCHEMAS
// =============================================================================

export const cohortSettingsSchema = z.object({
  autoEnrollment: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  allowLateEnrollment: z.boolean().default(false),
});

export const cohortCreateRequestSchema = z.object({
  name: z.string().min(1, 'Cohort name is required').max(200).trim(),
  description: z.string().max(1000).optional(),
  programId: z.string().min(1, 'Program ID is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  maxCapacity: z.number().int().positive().optional(),
  advisorIds: z.array(objectIdSchema).default([]),
  settings: cohortSettingsSchema.optional(),
});

export const cohortUpdateRequestSchema = cohortCreateRequestSchema.partial().extend({
  status: cohortStatusSchema.optional(),
});

export const enrollmentCreateRequestSchema = z.object({
  cohortId: objectIdSchema,
  businessProfileId: objectIdSchema,
  notes: z.string().max(1000).optional(),
});

export const enrollmentUpdateRequestSchema = z.object({
  status: enrollmentStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
  advisorId: objectIdSchema.optional().nullable(),
  rejectionReason: z.string().max(500).optional(),
});

// =============================================================================
// WORKFLOW SCHEMAS
// =============================================================================

export const workflowAdvanceRequestSchema = z.object({
  targetPhase: workflowPhaseSchema.optional(),
  targetStep: formationStepSchema.optional(),
  stepData: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
});

export const stepDataSchema = z.object({
  step: formationStepSchema,
  status: workflowStatusSchema,
  data: z.record(z.unknown()),
  validationErrors: z.array(z.string()).optional(),
  completedAt: z.coerce.date().optional(),
  completedBy: objectIdSchema.optional(),
});

// =============================================================================
// TASK SCHEMAS
// =============================================================================

export const taskEvidenceSchema = z.object({
  id: z.string(),
  type: z.enum(['file', 'link', 'note']),
  name: z.string().min(1).max(200),
  url: urlSchema,
  content: z.string().max(5000).optional(),
  uploadedAt: z.coerce.date(),
  uploadedBy: objectIdSchema,
});

export const taskCreateRequestSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200).trim(),
  description: z.string().max(2000).optional(),
  category: taskCategorySchema,
  priority: taskPrioritySchema.default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional(),
  assigneeId: objectIdSchema.optional(),
  isRequired: z.boolean().default(false),
  isBlocking: z.boolean().default(false),
});

export const taskUpdateRequestSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: objectIdSchema.optional().nullable(),
});

export const taskCompleteRequestSchema = z.object({
  evidence: z.array(taskEvidenceSchema).optional(),
  notes: z.string().max(1000).optional(),
});

// =============================================================================
// DOCUMENT SCHEMAS
// =============================================================================

export const mergeFieldSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  source: z.enum(['business_profile', 'person', 'custom']),
  sourcePath: z.string().max(200).optional(),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
});

export const documentTemplateCreateRequestSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200).trim(),
  description: z.string().max(1000).optional(),
  type: documentTypeSchema,
  content: z.string().min(1, 'Template content is required'),
  mergeFields: z.array(mergeFieldSchema).default([]),
  applicableBusinessTypes: z.array(businessTypeSchema).min(1),
  applicableStates: z.array(usStateSchema).optional(),
});

export const documentTemplateUpdateRequestSchema = documentTemplateCreateRequestSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const documentGenerateRequestSchema = z.object({
  templateId: objectIdSchema,
  businessProfileId: objectIdSchema,
  customMergeData: z.record(z.unknown()).optional(),
});

export const documentUpdateRequestSchema = z.object({
  status: documentStatusSchema.optional(),
  reviewNotes: z.string().max(2000).optional(),
  content: z.string().optional(),
});

// =============================================================================
// ADVISOR SCHEMAS
// =============================================================================

export const advisorAssignmentCreateRequestSchema = z.object({
  advisorId: objectIdSchema,
  tenantId: objectIdSchema.optional(),
  businessProfileId: objectIdSchema.optional(),
  cohortId: objectIdSchema.optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const advisorReviewRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_revision']),
  notes: z.string().min(1, 'Review notes are required').max(2000),
});

// =============================================================================
// AUDIT LOG SCHEMAS
// =============================================================================

export const auditLogCreateRequestSchema = z.object({
  action: auditActionSchema,
  resourceType: z.string().min(1).max(100),
  resourceId: z.string().min(1).max(100),
  previousState: z.record(z.unknown()).optional(),
  newState: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// =============================================================================
// PAGINATION & FILTER SCHEMAS
// =============================================================================

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(PaginationDefaults.PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PaginationDefaults.MAX_LIMIT)
    .default(PaginationDefaults.LIMIT),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const businessProfileFiltersSchema = paginationParamsSchema.extend({
  businessType: businessTypeSchema.optional(),
  formationState: usStateSchema.optional(),
  isExistingBusiness: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
});

export const enrollmentFiltersSchema = paginationParamsSchema.extend({
  cohortId: objectIdSchema.optional(),
  status: enrollmentStatusSchema.optional(),
  advisorId: objectIdSchema.optional(),
});

export const taskFiltersSchema = paginationParamsSchema.extend({
  status: taskStatusSchema.optional(),
  category: taskCategorySchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: objectIdSchema.optional(),
  phase: workflowPhaseSchema.optional(),
  isOverdue: z.coerce.boolean().optional(),
});

export const documentFiltersSchema = paginationParamsSchema.extend({
  type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  businessProfileId: objectIdSchema.optional(),
});

export const auditLogFiltersSchema = paginationParamsSchema.extend({
  userId: objectIdSchema.optional(),
  action: auditActionSchema.optional(),
  resourceType: z.string().max(100).optional(),
  resourceId: z.string().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Type exports removed - use types from '../types/index.js' instead
// The schemas are used for runtime validation, the types are used for TypeScript
