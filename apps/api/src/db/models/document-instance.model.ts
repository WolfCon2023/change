import mongoose, { Schema, Document } from 'mongoose';
import {
  DocumentType,
  DocumentStatus,
  type DocumentTypeValue,
  type DocumentStatusType,
} from '@change/shared';

export interface IDocumentVersionEntry {
  version: number;
  content: string;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IDocumentInstance extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  templateVersion: number;
  businessProfileId: mongoose.Types.ObjectId;
  workflowInstanceId?: mongoose.Types.ObjectId;
  name: string;
  type: DocumentTypeValue;
  status: DocumentStatusType;
  content?: string;
  mergeData: Record<string, unknown>;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  generatedAt?: Date;
  generatedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  versionHistory: IDocumentVersionEntry[];
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addVersionEntry(content: string, userId: mongoose.Types.ObjectId, notes?: string): void;
  getCurrentVersion(): number;
}

const documentVersionEntrySchema = new Schema<IDocumentVersionEntry>(
  {
    version: { type: Number, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const documentInstanceSchema = new Schema<IDocumentInstance>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentTemplate',
      required: true,
    },
    templateVersion: {
      type: Number,
      required: true,
    },
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    workflowInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(DocumentType),
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.DRAFT,
      index: true,
    },
    content: {
      type: String,
    },
    mergeData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    fileUrl: {
      type: String,
    },
    filePath: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    generatedAt: {
      type: Date,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      maxlength: 2000,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    versionHistory: {
      type: [documentVersionEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.tenantId = ret.tenantId.toString();
        ret.templateId = ret.templateId.toString();
        ret.businessProfileId = ret.businessProfileId.toString();
        if (ret.workflowInstanceId) ret.workflowInstanceId = ret.workflowInstanceId.toString();
        if (ret.generatedBy) ret.generatedBy = ret.generatedBy.toString();
        if (ret.reviewedBy) ret.reviewedBy = ret.reviewedBy.toString();
        if (ret.approvedBy) ret.approvedBy = ret.approvedBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
documentInstanceSchema.index({ tenantId: 1, businessProfileId: 1, type: 1 });
documentInstanceSchema.index({ tenantId: 1, status: 1 });
documentInstanceSchema.index({ tenantId: 1, workflowInstanceId: 1 });

// Methods
documentInstanceSchema.methods.addVersionEntry = function (
  content: string,
  userId: mongoose.Types.ObjectId,
  notes?: string
): void {
  const currentVersion = this.getCurrentVersion();
  this.versionHistory.push({
    version: currentVersion + 1,
    content,
    createdAt: new Date(),
    createdBy: userId,
    notes,
  });
  this.content = content;
};

documentInstanceSchema.methods.getCurrentVersion = function (): number {
  if (this.versionHistory.length === 0) return 0;
  return Math.max(...this.versionHistory.map((v: IDocumentVersionEntry) => v.version));
};

export const DocumentInstance = mongoose.model<IDocumentInstance>(
  'DocumentInstance',
  documentInstanceSchema
);
