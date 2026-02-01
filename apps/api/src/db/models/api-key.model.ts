/**
 * API Key Model
 * API keys for programmatic access
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';
import type { IamPermissionType } from '@change/shared';

export interface IApiKey extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  ownerType: 'user' | 'service_account';
  ownerId: Types.ObjectId;
  name: string;
  keyPrefix: string; // First 8 chars for identification
  keyHash: string; // Hashed key (never store plaintext)
  scopes: IamPermissionType[];
  lastUsedAt?: Date;
  lastUsedIp?: string;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  revokedAt?: Date;
  revokedBy?: Types.ObjectId;
  revokeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
interface IApiKeyModel extends mongoose.Model<IApiKey> {
  generateKey(): { plainText: string; prefix: string; hash: string };
  hashKey(key: string): string;
  verifyKey(plainText: string, hash: string): boolean;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ['user', 'service_account'],
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'ownerType',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      select: false, // Don't include by default
    },
    scopes: [{
      type: String,
      required: true,
    }],
    lastUsedAt: {
      type: Date,
    },
    lastUsedIp: {
      type: String,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revokeReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active keys
apiKeySchema.index({ tenantId: 1, revokedAt: 1, expiresAt: 1 });

// Index for owner's keys
apiKeySchema.index({ tenantId: 1, ownerType: 1, ownerId: 1 });

// Static method to generate a new API key
apiKeySchema.statics.generateKey = function(): { plainText: string; prefix: string; hash: string } {
  const plainText = `chg_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = plainText.substring(0, 12);
  const hash = crypto.createHash('sha256').update(plainText).digest('hex');
  return { plainText, prefix, hash };
};

// Static method to hash a key
apiKeySchema.statics.hashKey = function(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Static method to verify a key
apiKeySchema.statics.verifyKey = function(plainText: string, hash: string): boolean {
  const computedHash = crypto.createHash('sha256').update(plainText).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
};

// Check if key is active (not revoked and not expired)
apiKeySchema.methods.isActive = function(): boolean {
  if (this.revokedAt) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Transform for JSON output
apiKeySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.tenantId = ret.tenantId.toString();
    ret.ownerId = ret.ownerId.toString();
    ret.createdBy = ret.createdBy.toString();
    if (ret.revokedBy) {
      ret.revokedBy = ret.revokedBy.toString();
    }
    delete ret._id;
    delete ret.__v;
    delete ret.keyHash; // Never expose hash
    return ret;
  },
});

export const ApiKey = mongoose.model<IApiKey, IApiKeyModel>('ApiKey', apiKeySchema);
