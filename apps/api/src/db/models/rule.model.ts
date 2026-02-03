import mongoose, { Schema, Document } from 'mongoose';

/**
 * Rule Model
 * 
 * Business rules engine for determining what steps, tasks,
 * and documents are required based on context.
 */

// Condition operators
export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'exists'
  | 'not_exists';

// Single condition
export interface IRuleCondition {
  field: string; // e.g., 'state', 'entityType', 'archetype', 'riskProfile.level'
  operator: ConditionOperator;
  value?: unknown;
  caseSensitive?: boolean;
}

// Condition group (AND/OR logic)
export interface IRuleConditionGroup {
  logic: 'and' | 'or';
  conditions: (IRuleCondition | IRuleConditionGroup)[];
}

// Action types
export type ActionType =
  | 'add_step'
  | 'remove_step'
  | 'require_artifact'
  | 'add_task'
  | 'set_field'
  | 'require_approval'
  | 'add_document'
  | 'set_flag'
  | 'add_warning'
  | 'skip_step';

// Action definition
export interface IRuleAction {
  type: ActionType;
  target?: string; // e.g., step key, task category, field path
  value?: unknown;
  reason: string; // Explainability: why this action is taken
  priority?: number; // For ordering multiple actions
}

export interface IRule extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Rule identification
  key: string; // Unique identifier
  name: string;
  description: string;
  
  // Categorization
  category: string; // e.g., 'formation', 'compliance', 'state-specific', 'entity-specific'
  tags: string[];
  
  // Conditions (when this rule applies)
  conditions: IRuleConditionGroup;
  
  // Actions (what happens when rule matches)
  actions: IRuleAction[];
  
  // Priority (lower number = higher priority, evaluated first)
  priority: number;
  
  // Scope
  scope: 'global' | 'archetype' | 'state' | 'entity_type' | 'workflow';
  scopeValue?: string; // e.g., archetype key, state code
  
  // Applicability
  applicableWorkflows?: string[]; // Workflow template keys
  applicablePhases?: string[]; // Phase keys
  applicableSteps?: string[]; // Step keys
  
  // Status
  isActive: boolean;
  
  // Versioning
  version: number;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ruleConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: [
        'equals', 'not_equals', 'in', 'not_in', 'contains',
        'starts_with', 'ends_with', 'greater_than', 'less_than',
        'is_empty', 'is_not_empty', 'exists', 'not_exists'
      ],
      required: true,
    },
    value: { type: Schema.Types.Mixed },
    caseSensitive: { type: Boolean, default: false },
  },
  { _id: false }
);

// Recursive schema for condition groups
const ruleConditionGroupSchema = new Schema(
  {
    logic: { type: String, enum: ['and', 'or'], required: true },
    conditions: { type: [Schema.Types.Mixed], required: true },
  },
  { _id: false }
);

const ruleActionSchema = new Schema<IRuleAction>(
  {
    type: {
      type: String,
      enum: [
        'add_step', 'remove_step', 'require_artifact', 'add_task',
        'set_field', 'require_approval', 'add_document', 'set_flag',
        'add_warning', 'skip_step'
      ],
      required: true,
    },
    target: { type: String },
    value: { type: Schema.Types.Mixed },
    reason: { type: String, required: true },
    priority: { type: Number },
  },
  { _id: false }
);

const ruleSchema = new Schema<IRule>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
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
      required: true,
      index: true,
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    conditions: {
      type: ruleConditionGroupSchema,
      required: true,
    },
    actions: [ruleActionSchema],
    priority: {
      type: Number,
      required: true,
      default: 100,
      index: true,
    },
    scope: {
      type: String,
      enum: ['global', 'archetype', 'state', 'entity_type', 'workflow'],
      required: true,
      default: 'global',
    },
    scopeValue: {
      type: String,
    },
    applicableWorkflows: [{
      type: String,
    }],
    applicablePhases: [{
      type: String,
    }],
    applicableSteps: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    effectiveFrom: {
      type: Date,
    },
    effectiveUntil: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
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

// Indexes
ruleSchema.index({ category: 1, isActive: 1, priority: 1 });
ruleSchema.index({ scope: 1, scopeValue: 1 });
ruleSchema.index({ applicableWorkflows: 1 });
ruleSchema.index({ tags: 1 });

export const Rule = mongoose.model<IRule>('Rule', ruleSchema);
