import mongoose, { Schema, Document } from 'mongoose';
import { USState, type USStateType } from '@change/shared';

export interface IPersonRole {
  type: 'owner' | 'member' | 'manager' | 'officer' | 'director' | 'registered_agent';
  title?: string;
  startDate: Date;
  endDate?: Date;
}

export interface IPersonAddress {
  street1: string;
  street2?: string;
  city: string;
  state: USStateType;
  zipCode: string;
  country: string;
}

export interface IPerson extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  businessProfileId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: IPersonAddress;
  dateOfBirth?: Date;
  roles: IPersonRole[];
  ownershipPercentage?: number;
  isSigningAuthority: boolean;
  isPrimaryContact: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtual
  fullName: string;
}

const personRoleSchema = new Schema<IPersonRole>(
  {
    type: {
      type: String,
      required: true,
      enum: ['owner', 'member', 'manager', 'officer', 'director', 'registered_agent'],
    },
    title: { type: String, maxlength: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
  },
  { _id: false }
);

const personAddressSchema = new Schema<IPersonAddress>(
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

const personSchema = new Schema<IPerson>(
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
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
    address: {
      type: personAddressSchema,
    },
    dateOfBirth: {
      type: Date,
    },
    roles: {
      type: [personRoleSchema],
      required: true,
      validate: {
        validator: (v: IPersonRole[]) => v.length > 0,
        message: 'At least one role is required',
      },
    },
    ownershipPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    isSigningAuthority: {
      type: Boolean,
      default: false,
    },
    isPrimaryContact: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.tenantId = ret.tenantId.toString();
        ret.businessProfileId = ret.businessProfileId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
personSchema.index({ tenantId: 1, businessProfileId: 1 });
personSchema.index({ tenantId: 1, email: 1 });

// Virtual for full name
personSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const Person = mongoose.model<IPerson>('Person', personSchema);
