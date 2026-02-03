import mongoose, { Schema, Document } from 'mongoose';

/**
 * Workflow Template Model
 * 
 * Defines reusable workflow templates with phases, steps,
 * required artifacts, approvals, and rule hooks.
 */

// Step requirement
export interface IStepRequirement {
  type: 'artifact' | 'approval' | 'task_completion' | 'field_value' | 'external_verification';
  description: string;
  artifactType?: string;
  taskCategory?: string;
  fieldPath?: string;
  fieldValue?: unknown;
  isBlocking: boolean;
}

// Step definition
export interface IWorkflowStep {
  key: string;
  name: string;
  description: string;
  order: number;
  
  // Step configuration
  isRequired: boolean;
  isSkippable: boolean;
  requiresApproval: boolean;
  approverRole?: string; // 'advisor', 'manager', 'it_admin'
  
  // Requirements to complete this step
  requirements: IStepRequirement[];
  
  // Artifacts this step should produce
  expectedArtifacts: string[];
  
  // Tasks to auto-generate
  autoTasks: {
    title: string;
    category: string;
    priority: string;
    isRequired: boolean;
  }[];
  
  // UI configuration
  formSchema?: Record<string, unknown>;
  guidance?: string;
  helpUrl?: string;
  
  // Rules hooks
  rulesHooks?: string[]; // Rule keys to evaluate
  
  // Estimated duration in minutes
  estimatedMinutes?: number;
}

// Phase definition
export interface IWorkflowPhase {
  key: string;
  name: string;
  description: string;
  order: number;
  icon?: string;
  
  // Steps in this phase
  steps: IWorkflowStep[];
  
  // Phase requirements (gate check)
  gateRequirements: IStepRequirement[];
  
  // Phase-level approval
  requiresPhaseApproval: boolean;
  phaseApproverRole?: string;
}

export interface IWorkflowTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Template identification
  key: string; // e.g., 'business-formation', 'sipoc-discovery', 'dmaic-project'
  version: number;
  name: string;
  description: string;
  
  // Categorization
  category: 'formation' | 'operations' | 'compliance' | 'project' | 'onboarding';
  tags: string[];
  
  // Template structure
  phases: IWorkflowPhase[];
  
  // Global requirements
  requiredArtifacts: string[];
  
  // Archetype compatibility
  applicableArchetypes: string[]; // Empty means all
  
  // State/entity type restrictions
  applicableStates?: string[];
  applicableEntityTypes?: string[];
  
  // Rules to evaluate at template level
  rulesHooks?: string[];
  
  // Versioning
  isLatestVersion: boolean;
  previousVersionId?: mongoose.Types.ObjectId;
  
  // Status
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  
  // Metadata
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stepRequirementSchema = new Schema<IStepRequirement>(
  {
    type: {
      type: String,
      enum: ['artifact', 'approval', 'task_completion', 'field_value', 'external_verification'],
      required: true,
    },
    description: { type: String, required: true },
    artifactType: { type: String },
    taskCategory: { type: String },
    fieldPath: { type: String },
    fieldValue: { type: Schema.Types.Mixed },
    isBlocking: { type: Boolean, default: true },
  },
  { _id: false }
);

const workflowStepSchema = new Schema<IWorkflowStep>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    isRequired: { type: Boolean, default: true },
    isSkippable: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    approverRole: { type: String },
    requirements: [stepRequirementSchema],
    expectedArtifacts: [{ type: String }],
    autoTasks: [{
      title: { type: String, required: true },
      category: { type: String, required: true },
      priority: { type: String, default: 'medium' },
      isRequired: { type: Boolean, default: true },
      _id: false,
    }],
    formSchema: { type: Schema.Types.Mixed },
    guidance: { type: String },
    helpUrl: { type: String },
    rulesHooks: [{ type: String }],
    estimatedMinutes: { type: Number },
  },
  { _id: false }
);

const workflowPhaseSchema = new Schema<IWorkflowPhase>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    icon: { type: String },
    steps: [workflowStepSchema],
    gateRequirements: [stepRequirementSchema],
    requiresPhaseApproval: { type: Boolean, default: false },
    phaseApproverRole: { type: String },
  },
  { _id: false }
);

const workflowTemplateSchema = new Schema<IWorkflowTemplate>(
  {
    key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ['formation', 'operations', 'compliance', 'project', 'onboarding'],
      required: true,
      index: true,
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    phases: [workflowPhaseSchema],
    requiredArtifacts: [{
      type: String,
    }],
    applicableArchetypes: [{
      type: String,
    }],
    applicableStates: [{
      type: String,
    }],
    applicableEntityTypes: [{
      type: String,
    }],
    rulesHooks: [{
      type: String,
    }],
    isLatestVersion: {
      type: Boolean,
      default: true,
      index: true,
    },
    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowTemplate',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index for key + version
workflowTemplateSchema.index({ key: 1, version: 1 }, { unique: true });
workflowTemplateSchema.index({ key: 1, isLatestVersion: 1 });
workflowTemplateSchema.index({ category: 1, isActive: 1 });

export const WorkflowTemplate = mongoose.model<IWorkflowTemplate>('WorkflowTemplate', workflowTemplateSchema);
