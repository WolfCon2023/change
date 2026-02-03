import mongoose, { Schema, Document } from 'mongoose';

/**
 * Artifact Model
 * 
 * Stores evidence, filings, confirmations, and other artifacts
 * produced during business formation and operations.
 */

export interface IArtifact extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  
  // Artifact identification
  type: string; // e.g., 'sos_filing', 'ein_confirmation', 'screenshot', 'document', 'form'
  name: string;
  description?: string;
  
  // Storage
  storageType: 'file' | 'url' | 'text' | 'json';
  storageKey?: string; // S3 key or file path
  storageUrl?: string; // External URL
  textContent?: string; // Text content for small items
  jsonContent?: Record<string, unknown>; // JSON data
  
  // File metadata
  mimeType?: string;
  fileSize?: number;
  checksum?: string;
  
  // Linking
  linkedEntityType: string; // e.g., 'workflow_step', 'task', 'business_profile', 'dmaic_project'
  linkedEntityId: string;
  linkedStepKey?: string; // For workflow steps
  
  // Tags and categorization
  tags: string[];
  category?: string;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  verificationNotes?: string;
  
  // Compliance
  retentionDays?: number;
  expiresAt?: Date;
  isConfidential: boolean;
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const artifactSchema = new Schema<IArtifact>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    storageType: {
      type: String,
      enum: ['file', 'url', 'text', 'json'],
      required: true,
    },
    storageKey: {
      type: String,
    },
    storageUrl: {
      type: String,
    },
    textContent: {
      type: String,
    },
    jsonContent: {
      type: Schema.Types.Mixed,
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    checksum: {
      type: String,
    },
    linkedEntityType: {
      type: String,
      required: true,
      index: true,
    },
    linkedEntityId: {
      type: String,
      required: true,
      index: true,
    },
    linkedStepKey: {
      type: String,
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    category: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    verificationNotes: {
      type: String,
      maxlength: 1000,
    },
    retentionDays: {
      type: Number,
    },
    expiresAt: {
      type: Date,
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Compound indexes
artifactSchema.index({ tenantId: 1, linkedEntityType: 1, linkedEntityId: 1 });
artifactSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
artifactSchema.index({ tenantId: 1, tags: 1 });
artifactSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

export const Artifact = mongoose.model<IArtifact>('Artifact', artifactSchema);
