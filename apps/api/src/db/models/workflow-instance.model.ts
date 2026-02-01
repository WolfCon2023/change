import mongoose, { Schema, Document } from 'mongoose';
import {
  WorkflowPhase,
  WorkflowStatus,
  FormationStep,
  type WorkflowPhaseType,
  type WorkflowStatusType,
  type FormationStepType,
} from '@change/shared';

export interface IPhaseHistoryEntry {
  phase: WorkflowPhaseType;
  status: WorkflowStatusType;
  enteredAt: Date;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IStepData {
  step: FormationStepType;
  status: WorkflowStatusType;
  data: Record<string, unknown>;
  validationErrors?: string[];
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
}

export interface IWorkflowInstance extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  businessProfileId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  currentPhase: WorkflowPhaseType;
  currentStep?: FormationStepType;
  status: WorkflowStatusType;
  phaseHistory: IPhaseHistoryEntry[];
  stepData: Map<string, IStepData>;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getStepData(step: FormationStepType): IStepData | undefined;
  setStepData(step: FormationStepType, data: Partial<IStepData>): void;
  getPhaseProgress(): { completed: number; total: number; percentage: number };
}

const phaseHistoryEntrySchema = new Schema<IPhaseHistoryEntry>(
  {
    phase: {
      type: String,
      required: true,
      enum: Object.values(WorkflowPhase),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(WorkflowStatus),
    },
    enteredAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  { _id: false }
);

const stepDataSchema = new Schema<IStepData>(
  {
    step: {
      type: String,
      required: true,
      enum: Object.values(FormationStep),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(WorkflowStatus),
      default: WorkflowStatus.NOT_STARTED,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    validationErrors: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const workflowInstanceSchema = new Schema<IWorkflowInstance>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      index: true,
    },
    currentPhase: {
      type: String,
      required: true,
      enum: Object.values(WorkflowPhase),
      default: WorkflowPhase.INTAKE,
      index: true,
    },
    currentStep: {
      type: String,
      enum: Object.values(FormationStep),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(WorkflowStatus),
      default: WorkflowStatus.NOT_STARTED,
      index: true,
    },
    phaseHistory: {
      type: [phaseHistoryEntrySchema],
      default: [],
    },
    stepData: {
      type: Map,
      of: stepDataSchema,
      default: new Map(),
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.tenantId = ret.tenantId.toString();
        ret.businessProfileId = ret.businessProfileId.toString();
        if (ret.enrollmentId) ret.enrollmentId = ret.enrollmentId.toString();
        // Convert Map to object
        if (ret.stepData instanceof Map) {
          ret.stepData = Object.fromEntries(ret.stepData);
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
workflowInstanceSchema.index({ tenantId: 1, businessProfileId: 1 });
workflowInstanceSchema.index({ tenantId: 1, currentPhase: 1, status: 1 });

// Methods
workflowInstanceSchema.methods.getStepData = function (
  step: FormationStepType
): IStepData | undefined {
  return this.stepData.get(step);
};

workflowInstanceSchema.methods.setStepData = function (
  step: FormationStepType,
  data: Partial<IStepData>
): void {
  const existing = this.stepData.get(step) ?? {
    step,
    status: WorkflowStatus.NOT_STARTED,
    data: {},
  };
  this.stepData.set(step, { ...existing, ...data });
};

workflowInstanceSchema.methods.getPhaseProgress = function (): {
  completed: number;
  total: number;
  percentage: number;
} {
  const formationSteps = Object.values(FormationStep);
  const total = formationSteps.length;
  let completed = 0;

  for (const step of formationSteps) {
    const stepData = this.stepData.get(step);
    if (stepData?.status === WorkflowStatus.COMPLETED) {
      completed++;
    }
  }

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
};

export const WorkflowInstance = mongoose.model<IWorkflowInstance>(
  'WorkflowInstance',
  workflowInstanceSchema
);
