import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, PrimaryRole, type UserRoleType, type PrimaryRoleType } from '@change/shared';

// Notification preferences interface
export interface INotificationPreferences {
  emailNotifications: boolean;
  complianceReminders: boolean;
  taskReminders: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRoleType; // Legacy role (deprecated, kept for compatibility)
  primaryRole: PrimaryRoleType; // New simplified role
  tenantId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  // Notification preferences
  notificationPreferences: INotificationPreferences;

  // IAM fields
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  mfaSecret?: string;
  iamRoles: mongoose.Types.ObjectId[]; // IamRole IDs
  groups: mongoose.Types.ObjectId[]; // Group IDs
  lockedAt?: Date;
  lockReason?: string;
  failedLoginAttempts: number;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): Omit<IUser, 'passwordHash' | 'mfaSecret'>;
  incrementFailedLogins(): Promise<void>;
  resetFailedLogins(): Promise<void>;
  lock(reason: string): Promise<void>;
  unlock(): Promise<void>;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
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
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.CLIENT_OWNER,
      index: true,
    },
    primaryRole: {
      type: String,
      enum: Object.values(PrimaryRole),
      default: PrimaryRole.CUSTOMER,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
      sparse: true, // Allow null for platform users
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profileImageUrl: {
      type: String,
    },
    // Notification preferences
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      complianceReminders: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
    // IAM fields
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaEnforced: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false, // Don't include in queries by default
    },
    iamRoles: [{
      type: Schema.Types.ObjectId,
      ref: 'IamRole',
    }],
    groups: [{
      type: Schema.Types.ObjectId,
      ref: 'Group',
    }],
    lockedAt: {
      type: Date,
    },
    lockReason: {
      type: String,
      maxlength: 500,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.mfaSecret;
        return ret;
      },
    },
  }
);

// Indexes for common queries
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ email: 1, isActive: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toJSON();
  delete obj.passwordHash;
  delete obj.mfaSecret;
  return obj;
};

// Increment failed login attempts
userSchema.methods.incrementFailedLogins = async function (): Promise<void> {
  this.failedLoginAttempts += 1;
  await this.save();
};

// Reset failed login attempts
userSchema.methods.resetFailedLogins = async function (): Promise<void> {
  if (this.failedLoginAttempts > 0) {
    this.failedLoginAttempts = 0;
    await this.save();
  }
};

// Lock the user account
userSchema.methods.lock = async function (reason: string): Promise<void> {
  this.lockedAt = new Date();
  this.lockReason = reason;
  await this.save();
};

// Unlock the user account
userSchema.methods.unlock = async function (): Promise<void> {
  this.lockedAt = undefined;
  this.lockReason = undefined;
  this.failedLoginAttempts = 0;
  await this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
