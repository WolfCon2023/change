import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  // Server
  env: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  apiBaseUrl: process.env['API_BASE_URL'] ?? 'http://localhost:3001',

  // MongoDB
  mongoUri: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/change_platform'),

  // JWT
  jwt: {
    secret: requireEnv('JWT_SECRET', 'development-secret-change-in-production'),
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '1d',
    refreshSecret: requireEnv(
      'JWT_REFRESH_SECRET',
      'development-refresh-secret-change-in-production'
    ),
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },

  // CORS
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100', 10),
  },

  // Logging
  logLevel: process.env['LOG_LEVEL'] ?? 'debug',

  // Seed Data
  seed: {
    adminEmail: process.env['SEED_ADMIN_EMAIL'] ?? 'admin@change-platform.com',
    adminPassword: process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin123!',
  },

  // Feature Flags
  enabledFeatures: (process.env['ENABLED_FEATURES'] ?? '').split(',').filter(Boolean),

  // SMTP / Email
  smtp: {
    host: process.env['SMTP_HOST'] ?? '',
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    user: process.env['SMTP_USER'] ?? '',
    pass: process.env['SMTP_PASS'] ?? '',
    from: process.env['SMTP_FROM'] ?? process.env['SMTP_USER'] ?? 'noreply@change-platform.com',
  },

  // App URLs (for email links)
  appUrl: process.env['APP_URL'] ?? 'http://localhost:5173',

  // Stripe
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] ?? '',
    publishableKey: process.env['STRIPE_PUBLISHABLE_KEY'] ?? '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] ?? '',
    prices: {
      starterMonthly: process.env['STRIPE_STARTER_MONTHLY_PRICE_ID'] ?? '',
      starterAnnual: process.env['STRIPE_STARTER_ANNUAL_PRICE_ID'] ?? '',
      professionalMonthly: process.env['STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID'] ?? '',
      professionalAnnual: process.env['STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID'] ?? '',
      enterpriseMonthly: process.env['STRIPE_ENTERPRISE_MONTHLY_PRICE_ID'] ?? '',
      enterpriseAnnual: process.env['STRIPE_ENTERPRISE_ANNUAL_PRICE_ID'] ?? '',
    },
    trialDays: parseInt(process.env['STRIPE_TRIAL_DAYS'] ?? '7', 10),
  },

  // Computed
  isDev: process.env['NODE_ENV'] !== 'production',
  isProd: process.env['NODE_ENV'] === 'production',
  isTest: process.env['NODE_ENV'] === 'test',
} as const;

export type Config = typeof config;
