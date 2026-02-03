import mongoose, { Schema, Document } from 'mongoose';

/**
 * Business Archetype Model
 * 
 * Defines reusable business templates with recommended processes,
 * KPIs, documents, and workflows based on business category.
 */

// Starter Process definition
export interface IStarterProcess {
  name: string;
  description: string;
  category: string; // e.g., 'operations', 'finance', 'marketing', 'hr', 'compliance'
  priority: number; // 1-5, higher is more important
}

// KPI Definition
export interface IDefaultKPI {
  name: string;
  description: string;
  formula?: string;
  unit: string;
  targetDirection: 'increase' | 'decrease' | 'maintain';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

// Starter Document
export interface IStarterDoc {
  name: string;
  description: string;
  templateKey?: string;
  category: string;
  required: boolean;
  legalReview: boolean;
}

// Starter Workflow
export interface IStarterWorkflow {
  templateKey: string;
  name: string;
  description: string;
  triggerEvent?: string;
}

// Risk Checklist Item
export interface IRiskChecklistItem {
  category: string;
  item: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
}

export interface IBusinessArchetype extends Document {
  _id: mongoose.Types.ObjectId;
  key: string; // Unique identifier, e.g., 'professional-services'
  name: string;
  description: string;
  icon?: string; // Icon name for UI
  tags: string[]; // For search and filtering
  recommendedEntityTypes: string[]; // LLC, Corporation, etc.
  industryExamples: string[]; // Example businesses
  
  // Core processes - top 5 for this archetype
  commonProcesses: IStarterProcess[];
  
  // Default KPIs - top 8 for this archetype
  defaultKPIs: IDefaultKPI[];
  
  // Starter documents
  starterDocs: IStarterDoc[];
  
  // Starter workflows
  starterWorkflows: IStarterWorkflow[];
  
  // Risk checklist starters
  riskChecklist: IRiskChecklistItem[];
  
  // Regulatory considerations
  commonLicenses?: string[];
  commonPermits?: string[];
  insuranceTypes?: string[];
  
  // Metadata
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const starterProcessSchema = new Schema<IStarterProcess>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const defaultKPISchema = new Schema<IDefaultKPI>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    formula: { type: String },
    unit: { type: String, required: true },
    targetDirection: { type: String, enum: ['increase', 'decrease', 'maintain'], required: true },
    category: { type: String, required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  },
  { _id: false }
);

const starterDocSchema = new Schema<IStarterDoc>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    templateKey: { type: String },
    category: { type: String, required: true },
    required: { type: Boolean, default: false },
    legalReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const starterWorkflowSchema = new Schema<IStarterWorkflow>(
  {
    templateKey: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    triggerEvent: { type: String },
  },
  { _id: false }
);

const riskChecklistItemSchema = new Schema<IRiskChecklistItem>(
  {
    category: { type: String, required: true },
    item: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    mitigation: { type: String },
  },
  { _id: false }
);

const businessArchetypeSchema = new Schema<IBusinessArchetype>(
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
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    icon: {
      type: String,
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    recommendedEntityTypes: [{
      type: String,
    }],
    industryExamples: [{
      type: String,
    }],
    commonProcesses: [starterProcessSchema],
    defaultKPIs: [defaultKPISchema],
    starterDocs: [starterDocSchema],
    starterWorkflows: [starterWorkflowSchema],
    riskChecklist: [riskChecklistItemSchema],
    commonLicenses: [{
      type: String,
    }],
    commonPermits: [{
      type: String,
    }],
    insuranceTypes: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 100,
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
businessArchetypeSchema.index({ tags: 1 });
businessArchetypeSchema.index({ isActive: 1, displayOrder: 1 });

export const BusinessArchetype = mongoose.model<IBusinessArchetype>('BusinessArchetype', businessArchetypeSchema);
