import mongoose, { Schema, Document } from 'mongoose';
import { CohortStatus, type CohortStatusType } from '@change/shared';

export interface ICohortSettings {
  autoEnrollment: boolean;
  requiresApproval: boolean;
  allowLateEnrollment: boolean;
}

export interface ICohort extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  programId: string;
  status: CohortStatusType;
  startDate: Date;
  endDate?: Date;
  maxCapacity?: number;
  currentEnrollment: number;
  advisorIds: mongoose.Types.ObjectId[];
  settings: ICohortSettings;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  hasCapacity(): boolean;
  isOpen(): boolean;
}

const cohortSettingsSchema = new Schema<ICohortSettings>(
  {
    autoEnrollment: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true },
    allowLateEnrollment: { type: Boolean, default: false },
  },
  { _id: false }
);

const cohortSchema = new Schema<ICohort>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    programId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(CohortStatus),
      default: CohortStatus.DRAFT,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    maxCapacity: {
      type: Number,
      min: 1,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
      min: 0,
    },
    advisorIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    settings: {
      type: cohortSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.advisorIds = ret.advisorIds.map((id: mongoose.Types.ObjectId) => id.toString());
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
cohortSchema.index({ status: 1, startDate: 1 });

// Methods
cohortSchema.methods.hasCapacity = function (): boolean {
  if (!this.maxCapacity) return true;
  return this.currentEnrollment < this.maxCapacity;
};

cohortSchema.methods.isOpen = function (): boolean {
  if (this.status !== CohortStatus.OPEN) return false;
  const now = new Date();
  if (this.endDate && now > this.endDate) return false;
  return this.hasCapacity();
};

export const Cohort = mongoose.model<ICohort>('Cohort', cohortSchema);
