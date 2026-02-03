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

// Formation status tracking
export type FormationStatusValue = 
  | 'not_started'
  | 'in_progress'
  | 'pending_filing'
  | 'filed'
  | 'approved'
  | 'rejected';

// EIN status tracking
export type EINStatusValue = 
  | 'not_started'
  | 'application_prepared'
  | 'application_submitted'
  | 'pending'
  | 'received'
  | 'failed';

// Readiness flags
export interface IReadinessFlags {
  profileComplete: boolean;
  entitySelected: boolean;
  stateSelected: boolean;
  archetypeSelected: boolean;
  addressVerified: boolean;
  registeredAgentSet: boolean;
  ownersAdded: boolean;
  sosReadyToFile: boolean;
  einReadyToApply: boolean;
  documentsGenerated: boolean;
  advisorAssigned: boolean;
}

// Risk profile
export interface IRiskProfile {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  lastAssessedAt?: Date;
}

export interface IBusinessProfile extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  
  // Basic info
  businessName: string;
  dbaName?: string;
  businessType: BusinessTypeValue;
  formationState: USStateType;
  isExistingBusiness: boolean;
  formationDate?: Date;
  
  // Archetype and classification
  archetypeKey?: string;
  naicsCode?: string;
  sicCode?: string;
  
  // Contact
  email: string;
  phone?: string;
  website?: string;
  
  // Addresses
  businessAddress?: IAddress;
  mailingAddress?: IAddress;
  registeredAgent?: IRegisteredAgent;
  
  // Formation status
  formationStatus: FormationStatusValue;
  sosFilingNumber?: string;
  sosFilingDate?: Date;
  sosConfirmationArtifactId?: mongoose.Types.ObjectId;
  
  // EIN status
  einStatus: EINStatusValue;
  ein?: string;
  einApplicationDate?: Date;
  einConfirmationArtifactId?: mongoose.Types.ObjectId;
  
  // Legacy fields (keep for compatibility)
  industryCode?: string;
  sectorId?: string;
  
  // Readiness tracking
  readinessFlags: IReadinessFlags;
  
  // Risk assessment
  riskProfile?: IRiskProfile;
  
  // Completion tracking
  profileCompleteness: number;
  setupCompletedAt?: Date;
  
  // Timestamps
  submittedAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateCompleteness(): number;
  updateReadinessFlags(): void;
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

const readinessFlagsSchema = new Schema<IReadinessFlags>(
  {
    profileComplete: { type: Boolean, default: false },
    entitySelected: { type: Boolean, default: false },
    stateSelected: { type: Boolean, default: false },
    archetypeSelected: { type: Boolean, default: false },
    addressVerified: { type: Boolean, default: false },
    registeredAgentSet: { type: Boolean, default: false },
    ownersAdded: { type: Boolean, default: false },
    sosReadyToFile: { type: Boolean, default: false },
    einReadyToApply: { type: Boolean, default: false },
    documentsGenerated: { type: Boolean, default: false },
    advisorAssigned: { type: Boolean, default: false },
  },
  { _id: false }
);

const riskProfileSchema = new Schema<IRiskProfile>(
  {
    level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    factors: [{ type: String }],
    lastAssessedAt: { type: Date },
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
    // Archetype and classification
    archetypeKey: {
      type: String,
      index: true,
    },
    naicsCode: {
      type: String,
      maxlength: 6,
    },
    sicCode: {
      type: String,
      maxlength: 4,
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
    // Formation status
    formationStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'pending_filing', 'filed', 'approved', 'rejected'],
      default: 'not_started',
      index: true,
    },
    sosFilingNumber: {
      type: String,
      maxlength: 50,
    },
    sosFilingDate: {
      type: Date,
    },
    sosConfirmationArtifactId: {
      type: Schema.Types.ObjectId,
      ref: 'Artifact',
    },
    // EIN status
    einStatus: {
      type: String,
      enum: ['not_started', 'application_prepared', 'application_submitted', 'pending', 'received', 'failed'],
      default: 'not_started',
      index: true,
    },
    ein: {
      type: String,
      match: /^\d{2}-\d{7}$/,
    },
    einApplicationDate: {
      type: Date,
    },
    einConfirmationArtifactId: {
      type: Schema.Types.ObjectId,
      ref: 'Artifact',
    },
    // Legacy fields
    industryCode: {
      type: String,
    },
    sectorId: {
      type: String,
    },
    // Readiness tracking
    readinessFlags: {
      type: readinessFlagsSchema,
      default: () => ({}),
    },
    // Risk assessment
    riskProfile: {
      type: riskProfileSchema,
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    setupCompletedAt: {
      type: Date,
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

// Update readiness flags
businessProfileSchema.methods.updateReadinessFlags = function (): void {
  const flags = this.readinessFlags || {};
  
  flags.entitySelected = !!this.businessType;
  flags.stateSelected = !!this.formationState;
  flags.archetypeSelected = !!this.archetypeKey;
  flags.addressVerified = !!this.businessAddress?.street1;
  flags.registeredAgentSet = !!this.registeredAgent?.name;
  flags.profileComplete = this.profileCompleteness >= 80;
  flags.sosReadyToFile = flags.profileComplete && flags.addressVerified && flags.registeredAgentSet;
  flags.einReadyToApply = this.formationStatus === 'approved' || this.formationStatus === 'filed';
  
  this.readinessFlags = flags;
};

// Pre-save hook to update completeness and readiness
businessProfileSchema.pre('save', function (next) {
  this.profileCompleteness = this.calculateCompleteness();
  this.updateReadinessFlags();
  next();
});

export const BusinessProfile = mongoose.model<IBusinessProfile>(
  'BusinessProfile',
  businessProfileSchema
);
