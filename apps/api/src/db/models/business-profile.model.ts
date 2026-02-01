import mongoose, { Schema, Document } from 'mongoose';
import { BusinessType, USState, type BusinessTypeValue, type USStateType } from '@change/shared';

export interface IAddress {
  street1: string;
  street2?: string;
  city: string;
  state: USStateType;
  zipCode: string;
  country: string;
}

export interface IRegisteredAgent {
  type: 'self' | 'commercial' | 'individual';
  name: string;
  address: IAddress;
  email?: string;
  phone?: string;
}

export interface IBusinessProfile extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  businessName: string;
  dbaName?: string;
  businessType: BusinessTypeValue;
  formationState: USStateType;
  isExistingBusiness: boolean;
  formationDate?: Date;
  email: string;
  phone?: string;
  website?: string;
  businessAddress?: IAddress;
  mailingAddress?: IAddress;
  registeredAgent?: IRegisteredAgent;
  ein?: string;
  einApplicationDate?: Date;
  sosFilingNumber?: string;
  sosFilingDate?: Date;
  industryCode?: string;
  sectorId?: string;
  profileCompleteness: number;
  submittedAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateCompleteness(): number;
}

const addressSchema = new Schema<IAddress>(
  {
    street1: { type: String, required: true, maxlength: 200 },
    street2: { type: String, maxlength: 200 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, enum: Object.values(USState) },
    zipCode: { type: String, required: true, match: /^\d{5}(-\d{4})?$/ },
    country: { type: String, default: 'USA' },
  },
  { _id: false }
);

const registeredAgentSchema = new Schema<IRegisteredAgent>(
  {
    type: {
      type: String,
      required: true,
      enum: ['self', 'commercial', 'individual'],
    },
    name: { type: String, required: true, maxlength: 200 },
    address: { type: addressSchema, required: true },
    email: { type: String, lowercase: true },
    phone: { type: String },
  },
  { _id: false }
);

const businessProfileSchema = new Schema<IBusinessProfile>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    dbaName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    businessType: {
      type: String,
      required: true,
      enum: Object.values(BusinessType),
      index: true,
    },
    formationState: {
      type: String,
      required: true,
      enum: Object.values(USState),
      index: true,
    },
    isExistingBusiness: {
      type: Boolean,
      required: true,
      default: false,
    },
    formationDate: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    website: {
      type: String,
    },
    businessAddress: {
      type: addressSchema,
    },
    mailingAddress: {
      type: addressSchema,
    },
    registeredAgent: {
      type: registeredAgentSchema,
    },
    ein: {
      type: String,
      match: /^\d{2}-\d{7}$/,
    },
    einApplicationDate: {
      type: Date,
    },
    sosFilingNumber: {
      type: String,
      maxlength: 50,
    },
    sosFilingDate: {
      type: Date,
    },
    // Phase 2+ placeholders
    industryCode: {
      type: String,
    },
    sectorId: {
      type: String,
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.tenantId = ret.tenantId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
businessProfileSchema.index({ tenantId: 1, businessName: 1 });
businessProfileSchema.index({ tenantId: 1, businessType: 1 });
businessProfileSchema.index({ tenantId: 1, formationState: 1 });

// Calculate profile completeness
businessProfileSchema.methods.calculateCompleteness = function (): number {
  const fields = [
    { name: 'businessName', weight: 10 },
    { name: 'businessType', weight: 10 },
    { name: 'formationState', weight: 10 },
    { name: 'email', weight: 10 },
    { name: 'phone', weight: 5 },
    { name: 'businessAddress', weight: 15 },
    { name: 'registeredAgent', weight: 15 },
    { name: 'ein', weight: 15 },
    { name: 'sosFilingNumber', weight: 10 },
  ];

  let totalWeight = 0;
  let completedWeight = 0;

  for (const field of fields) {
    totalWeight += field.weight;
    const value = this.get(field.name);
    if (value && (typeof value !== 'object' || Object.keys(value).length > 0)) {
      completedWeight += field.weight;
    }
  }

  return Math.round((completedWeight / totalWeight) * 100);
};

// Pre-save hook to update completeness
businessProfileSchema.pre('save', function (next) {
  this.profileCompleteness = this.calculateCompleteness();
  next();
});

export const BusinessProfile = mongoose.model<IBusinessProfile>(
  'BusinessProfile',
  businessProfileSchema
);
