import mongoose, { Schema, Document } from 'mongoose';
import {
  TaskStatus,
  TaskPriority,
  TaskCategory,
  WorkflowPhase,
  FormationStep,
  type TaskStatusType,
  type TaskPriorityType,
  type TaskCategoryType,
  type WorkflowPhaseType,
  type FormationStepType,
} from '@change/shared';

export interface ITaskEvidence {
  id: string;
  type: 'file' | 'link' | 'note';
  name: string;
  url?: string;
  content?: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  workflowInstanceId: mongoose.Types.ObjectId;
  businessProfileId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: TaskCategoryType;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  parentTaskId?: mongoose.Types.ObjectId;
  phase: WorkflowPhaseType;
  step?: FormationStepType;
  isRequired: boolean;
  isBlocking: boolean;
  order: number;
  evidence: ITaskEvidence[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isOverdue(): boolean;
}

const taskEvidenceSchema = new Schema<ITaskEvidence>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['file', 'link', 'note'],
    },
    name: { type: String, required: true, maxlength: 200 },
    url: { type: String },
    content: { type: String, maxlength: 5000 },
    uploadedAt: { type: Date, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    workflowInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
      required: true,
      index: true,
    },
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(TaskCategory),
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    phase: {
      type: String,
      required: true,
      enum: Object.values(WorkflowPhase),
      index: true,
    },
    step: {
      type: String,
      enum: Object.values(FormationStep),
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    isBlocking: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    evidence: {
      type: [taskEvidenceSchema],
      default: [],
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
        ret.workflowInstanceId = ret.workflowInstanceId.toString();
        ret.businessProfileId = ret.businessProfileId.toString();
        if (ret.completedBy) ret.completedBy = ret.completedBy.toString();
        if (ret.assigneeId) ret.assigneeId = ret.assigneeId.toString();
        if (ret.parentTaskId) ret.parentTaskId = ret.parentTaskId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
taskSchema.index({ tenantId: 1, workflowInstanceId: 1, status: 1 });
taskSchema.index({ tenantId: 1, businessProfileId: 1, status: 1 });
taskSchema.index({ tenantId: 1, assigneeId: 1, status: 1 });
taskSchema.index({ tenantId: 1, dueDate: 1, status: 1 });
taskSchema.index({ tenantId: 1, phase: 1, step: 1 });

// Methods
taskSchema.methods.isOverdue = function (): boolean {
  if (!this.dueDate) return false;
  if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.SKIPPED) return false;
  return new Date() > this.dueDate;
};

export const Task = mongoose.model<ITask>('Task', taskSchema);
