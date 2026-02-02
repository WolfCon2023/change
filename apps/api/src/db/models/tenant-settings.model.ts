/**
 * Tenant Settings Model
 * Stores configuration settings per tenant
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITenantSettings extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  
  // Audit settings
  auditLoggingEnabled: boolean;
  auditRetentionDays: number;
  
  // Security settings
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  passwordExpiryDays: number;
  
  // Notification settings
  emailNotificationsEnabled: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const tenantSettingsSchema = new Schema<ITenantSettings>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
      index: true,
    },
    
    // Audit settings
    auditLoggingEnabled: {
      type: Boolean,
      default: true,
    },
    auditRetentionDays: {
      type: Number,
      default: 365,
      min: 30,
      max: 2555, // ~7 years
    },
    
    // Security settings
    mfaRequired: {
      type: Boolean,
      default: false,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 1440, // 24 hours
    },
    maxFailedLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10,
    },
    passwordExpiryDays: {
      type: Number,
      default: 90,
      min: 0, // 0 = never expires
      max: 365,
    },
    
    // Notification settings
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Transform for JSON output
tenantSettingsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const TenantSettings = mongoose.model<ITenantSettings>('TenantSettings', tenantSettingsSchema);
