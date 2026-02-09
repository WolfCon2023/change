import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import tenantRoutes from './tenant.routes.js';
import adminRoutes from './admin/index.js';
import appRoutes from './app/index.js';
import advisorRoutes from './advisor/index.js';
import downloadsRoutes from './downloads.routes.js';

const router = Router();

// Health checks (no auth)
router.use('/health', healthRoutes);

// Public downloads (token in query string)
router.use('/downloads', downloadsRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Tenant management (admin)
router.use('/tenants', tenantRoutes);

// Admin Portal IAM routes
router.use('/admin', adminRoutes);

// Business App routes
router.use('/app', appRoutes);

// Advisor routes
router.use('/advisor', advisorRoutes);

// API info
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'CHANGE Platform API',
      version: '0.1.0',
      phase: 'Phase 1 - Beginning Step',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        tenants: '/api/v1/tenants',
        admin: '/api/v1/admin',
        app: '/api/v1/app',
        businessProfiles: '/api/v1/business-profiles',
        enrollments: '/api/v1/enrollments',
        workflows: '/api/v1/workflows',
        tasks: '/api/v1/tasks',
        documents: '/api/v1/documents',
        advisor: '/api/v1/advisor',
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
