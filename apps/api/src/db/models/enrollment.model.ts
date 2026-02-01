import mongoose, { Schema, Document } from 'mongoose';
import {
  EnrollmentStatus,
  EnrollmentStatusTransitions,
  type EnrollmentStatusType,
} from '@change/shared';

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  cohortId: mongoose.Types.ObjectId;
  businessProfileId: mongoose.Types.ObjectId;
  status: EnrollmentStatusType;
  appliedAt: Date;
  enrolledAt?: Date;
  activatedAt?: Date;
  completedAt?: Date;
  withdrawnAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  advisorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  canTransitionTo(newStatus: EnrollmentStatusType): boolean;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    cohortId: {
      type: Schema.Types.ObjectId,
      ref: 'Cohort',
      required: true,
      index: true,
    },
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(EnrollmentStatus),
      default: EnrollmentStatus.APPLIED,
      index: true,
    },
    appliedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    enrolledAt: {
      type: Date,
    },
    activatedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    withdrawnAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    advisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.tenantId = ret.tenantId.toString();
        ret.cohortId = ret.cohortId.toString();
        ret.businessProfileId = ret.businessProfileId.toString();
        if (ret.advisorId) ret.advisorId = ret.advisorId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
enrollmentSchema.index({ tenantId: 1, cohortId: 1 });
enrollmentSchema.index({ tenantId: 1, businessProfileId: 1 });
enrollmentSchema.index({ tenantId: 1, status: 1 });
enrollmentSchema.index({ cohortId: 1, status: 1 });

// Unique constraint: one enrollment per business per cohort
enrollmentSchema.index({ cohortId: 1, businessProfileId: 1 }, { unique: true });

// Methods
enrollmentSchema.methods.canTransitionTo = function (
  newStatus: EnrollmentStatusType
): boolean {
  const allowedTransitions = EnrollmentStatusTransitions[this.status];
  return allowedTransitions?.includes(newStatus) ?? false;
};

// Pre-save hook to set timestamps based on status changes
enrollmentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case EnrollmentStatus.ENROLLED:
        if (!this.enrolledAt) this.enrolledAt = now;
        break;
      case EnrollmentStatus.ACTIVE:
        if (!this.activatedAt) this.activatedAt = now;
        break;
      case EnrollmentStatus.COMPLETED:
        if (!this.completedAt) this.completedAt = now;
        break;
      case EnrollmentStatus.WITHDRAWN:
        if (!this.withdrawnAt) this.withdrawnAt = now;
        break;
      case EnrollmentStatus.REJECTED:
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
    }
  }
  next();
});

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
