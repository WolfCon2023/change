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

  // Computed
  isDev: process.env['NODE_ENV'] !== 'production',
  isProd: process.env['NODE_ENV'] === 'production',
  isTest: process.env['NODE_ENV'] === 'test',
} as const;

export type Config = typeof config;
