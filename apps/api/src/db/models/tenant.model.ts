import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenantSettings {
  timezone: string;
  locale: string;
  features: string[];
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}

export interface ITenantSubscription {
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: Date;
}

export interface ITenant extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  isActive: boolean;
  settings: ITenantSettings;
  subscription?: ITenantSubscription;
  createdAt: Date;
  updatedAt: Date;
}

interface ITenantModel extends Model<ITenant> {
  findBySlug(slug: string): Promise<ITenant | null>;
}

const tenantSettingsSchema = new Schema<ITenantSettings>(
  {
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    locale: {
      type: String,
      default: 'en-US',
    },
    features: {
      type: [String],
      default: [],
    },
    branding: {
      primaryColor: String,
      logoUrl: String,
    },
  },
  { _id: false }
);

const tenantSubscriptionSchema = new Schema<ITenantSubscription>(
  {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled'],
      default: 'active',
    },
    currentPeriodEnd: {
      type: Date,
    },
  },
  { _id: false }
);

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[a-z0-9-]+$/,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    settings: {
      type: tenantSettingsSchema,
      default: () => ({}),
    },
    subscription: {
      type: tenantSubscriptionSchema,
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

// Static methods
tenantSchema.statics.findBySlug = function (slug: string): Promise<ITenant | null> {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

export const Tenant = mongoose.model<ITenant, ITenantModel>('Tenant', tenantSchema);
