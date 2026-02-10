import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  DocumentType,
  DocumentCategory,
  BusinessType,
  USState,
  type DocumentTypeValue,
  type DocumentCategoryType,
  type BusinessTypeValue,
  type USStateType,
} from '@change/shared';

export interface IMergeField {
  key: string;
  label: string;
  source: 'business_profile' | 'person' | 'custom';
  sourcePath?: string;
  required: boolean;
  defaultValue?: string;
}

export type DocumentPriorityType = 'required' | 'recommended' | 'optional';

export interface IDocumentTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: DocumentTypeValue;
  category: DocumentCategoryType;
  version: number;
  isLatestVersion: boolean;
  previousVersionId?: mongoose.Types.ObjectId;
  content: string;
  mergeFields: IMergeField[];
  applicableBusinessTypes: BusinessTypeValue[];
  applicableStates?: USStateType[];
  applicableArchetypes?: string[];
  priority: DocumentPriorityType;
  advisorReviewRequired: boolean;
  workflowStepKey?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IDocumentTemplateModel extends Model<IDocumentTemplate> {
  findLatestByType(type: DocumentTypeValue): Promise<IDocumentTemplate | null>;
  createNewVersion(
    templateId: mongoose.Types.ObjectId,
    updates: Partial<IDocumentTemplate>,
    userId: mongoose.Types.ObjectId
  ): Promise<IDocumentTemplate>;
}

const mergeFieldSchema = new Schema<IMergeField>(
  {
    key: { type: String, required: true, maxlength: 100 },
    label: { type: String, required: true, maxlength: 200 },
    source: {
      type: String,
      required: true,
      enum: ['business_profile', 'person', 'custom'],
    },
    sourcePath: { type: String, maxlength: 200 },
    required: { type: Boolean, default: false },
    defaultValue: { type: String },
  },
  { _id: false }
);

const documentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(DocumentType),
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(DocumentCategory),
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
      index: true,
    },
    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentTemplate',
    },
    content: {
      type: String,
      required: true,
    },
    mergeFields: {
      type: [mergeFieldSchema],
      default: [],
    },
    applicableBusinessTypes: {
      type: [String],
      required: true,
      enum: Object.values(BusinessType),
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one business type is required',
      },
    },
    applicableStates: {
      type: [String],
      enum: Object.values(USState),
    },
    applicableArchetypes: {
      type: [String],
      default: [],
    },
    priority: {
      type: String,
      enum: ['required', 'recommended', 'optional'],
      default: 'optional',
    },
    advisorReviewRequired: {
      type: Boolean,
      default: false,
    },
    workflowStepKey: {
      type: String,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        if (ret.previousVersionId) ret.previousVersionId = ret.previousVersionId.toString();
        ret.createdBy = ret.createdBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
documentTemplateSchema.index({ type: 1, isLatestVersion: 1, isActive: 1 });
documentTemplateSchema.index({ type: 1, version: 1 });
documentTemplateSchema.index({ category: 1, isLatestVersion: 1, isActive: 1 });
documentTemplateSchema.index({ priority: 1 });

// Static methods
documentTemplateSchema.statics.findLatestByType = function (
  type: DocumentTypeValue
): Promise<IDocumentTemplate | null> {
  return this.findOne({
    type,
    isLatestVersion: true,
    isActive: true,
  });
};

documentTemplateSchema.statics.createNewVersion = async function (
  templateId: mongoose.Types.ObjectId,
  updates: Partial<IDocumentTemplate>,
  userId: mongoose.Types.ObjectId
): Promise<IDocumentTemplate> {
  const existingTemplate = await this.findById(templateId);
  if (!existingTemplate) {
    throw new Error('Template not found');
  }

  // Mark existing as not latest
  existingTemplate.isLatestVersion = false;
  await existingTemplate.save();

  // Create new version
  const newVersion = new this({
    name: updates.name ?? existingTemplate.name,
    description: updates.description ?? existingTemplate.description,
    type: existingTemplate.type,
    category: updates.category ?? existingTemplate.category,
    version: existingTemplate.version + 1,
    isLatestVersion: true,
    previousVersionId: existingTemplate._id,
    content: updates.content ?? existingTemplate.content,
    mergeFields: updates.mergeFields ?? existingTemplate.mergeFields,
    applicableBusinessTypes:
      updates.applicableBusinessTypes ?? existingTemplate.applicableBusinessTypes,
    applicableStates: updates.applicableStates ?? existingTemplate.applicableStates,
    applicableArchetypes: updates.applicableArchetypes ?? existingTemplate.applicableArchetypes,
    priority: updates.priority ?? existingTemplate.priority,
    advisorReviewRequired: updates.advisorReviewRequired ?? existingTemplate.advisorReviewRequired,
    workflowStepKey: updates.workflowStepKey ?? existingTemplate.workflowStepKey,
    isActive: true,
    createdBy: userId,
  });

  return newVersion.save();
};

export const DocumentTemplate = mongoose.model<IDocumentTemplate, IDocumentTemplateModel>(
  'DocumentTemplate',
  documentTemplateSchema
);
